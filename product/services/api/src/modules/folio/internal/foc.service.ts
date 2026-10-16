/**
 * FOC / special discount on a folio line (US-007 AC1, A35; SM-10; BR-431…436, BR-434; DATA erd 8).
 * - requestFoc: a NEGATIVE line `foc`/`discount` in state `pending_approval` pointing at the line it
 *   reduces (related_line_id), then ApprovalService.submit() in the same transaction (A1 pending, or A2
 *   self-applied within the requester's limit – then the hook below already posted it).
 * - Approval hooks (same transaction as the decision, registered by FolioModule):
 *   approved → line `posted`; a reduced ROOM night gets discount_vnd += amount on its stay_night through
 *   StayNightAllocationService (ARC S2-07; 100 % → is_complimentary); rejected/cancelled → line `rejected`;
 *   approved after the reduced charge was reversed (cancel/resync) → `rejected` (nothing left to reduce)
 *   (the charge stays payable – A5). Amounts are never updated (BR-008).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import {
  type Actor,
  type ApprovalRow,
  ApprovalService,
} from '../../approvals/public/approval.service';
import { StayNightAllocationService } from '../../reservations/public/stay-night-allocation';
import { FolioService } from '../public/folio.service';

export interface FocInput {
  kind: 'foc' | 'special_discount';
  amountVnd: number;
  reasonCode: string;
  note: string | null;
  requesterReauthenticated: boolean;
}

interface LineRow {
  id: string;
  folio_id: string;
  category: string;
  revenue_group: 'room' | 'other' | 'non_revenue';
  service_date: string | null;
  unit_price_vnd: number;
  amount_vnd: number;
  line_state: string;
  reversal_of_id: string | null;
  related_line_id: string | null;
  stay_night_id: string | null;
  reversed: boolean;
}

@Injectable()
export class FolioFocService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(StayNightAllocationService) private readonly nights: StayNightAllocationService,
  ) {}

  async request(
    tx: Tx,
    actor: Actor,
    folioId: string,
    lineId: string,
    input: FocInput,
    ctx: { reservationCode: string | null; requestId?: string },
  ): Promise<ApprovalRow> {
    const folio = await this.folios.lock(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');
    const line = await this.line(tx, lineId);
    if (!line || line.folio_id !== folio.id) throw problem('NOT_FOUND');
    if (
      line.line_state !== 'posted' ||
      line.reversed ||
      line.reversal_of_id ||
      ['foc', 'discount', 'adjustment'].includes(line.category) ||
      line.amount_vnd <= 0
    ) {
      throw problem('INVALID_TRANSITION');
    }
    // "Giảm giá đặc biệt (tiền phòng)" (copy foc.kind_discount): only room lines.
    if (input.kind === 'special_discount' && line.category !== 'room') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_IN_LIST' }] });
    }
    const { rows: used } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(-SUM(amount_vnd), 0) AS total FROM folio_line
        WHERE related_line_id = $1 AND category IN ('foc', 'discount')
          AND line_state IN ('posted', 'pending_approval') AND reversal_of_id IS NULL`,
      [line.id],
    );
    const remaining = line.amount_vnd - Number(used[0]?.total ?? 0);
    if (input.amountVnd > remaining) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'VALUE_OUT_OF_RANGE' }],
        extras: { max: remaining },
      });
    }

    const now = this.clock.now();
    const focLineId = await this.folios.insertLine(tx, {
      folioId: folio.id,
      reservationId: folio.primary_reservation_id,
      category: input.kind === 'foc' ? 'foc' : 'discount',
      revenueGroup: line.revenue_group,
      description: input.kind === 'foc' ? 'foc' : 'special_discount',
      quantity: 1,
      unitPriceVnd: -input.amountVnd,
      amountVnd: -input.amountVnd,
      serviceDate: line.service_date,
      stayNightId: null,
      source: 'manual',
      postedBy: actor.userId,
      now,
      lineState: 'pending_approval',
      relatedLineId: line.id,
    });
    await this.audit.recordMoney(tx, {
      action: 'folio.foc_requested',
      entityType: 'folio_line',
      entityId: focLineId,
      ...(ctx.reservationCode ? { entityCode: ctx.reservationCode } : {}),
      after: {
        category: input.kind === 'foc' ? 'foc' : 'discount',
        amountVnd: -input.amountVnd,
        lineState: 'pending_approval',
        relatedCategory: line.category,
      },
      ...(input.note ? { reason: input.note } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const row = await this.approvals.submit(tx, actor, {
      type: input.kind,
      amountVnd: input.amountVnd,
      reasonCode: input.reasonCode,
      reasonNote: input.note,
      targetType: 'reservation',
      targetId: folio.primary_reservation_id,
      ...(ctx.reservationCode ? { targetCode: ctx.reservationCode } : {}),
      folioLineId: focLineId,
      // BR-433 "≤ giá 1 đêm": the night rate of the reduced room line.
      limitBasisVnd: line.category === 'room' ? line.unit_price_vnd : null,
      lineCategory: line.category,
      requesterReauthenticated: input.requesterReauthenticated,
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await tx.query(`UPDATE folio_line SET approval_request_id = $2 WHERE id = $1`, [
      focLineId,
      row.id,
    ]);
    return row;
  }

  /** SM-10 decision hook (approved / rejected / cancelled) for `foc` and `special_discount`. */
  async onDecided(tx: Tx, request: ApprovalRow): Promise<void> {
    if (!request.folio_line_id) return;
    const line = await this.line(tx, request.folio_line_id);
    if (!line || line.line_state !== 'pending_approval') return;
    if (request.status === 'approved') {
      const related = line.related_line_id ? await this.line(tx, line.related_line_id) : null;
      if (!related || related.reversed) {
        // The charge was reversed meanwhile (cancel / resync): nothing left to reduce.
        await tx.query(`UPDATE folio_line SET line_state = 'rejected' WHERE id = $1`, [line.id]);
        return;
      }
      await tx.query(`UPDATE folio_line SET line_state = 'posted' WHERE id = $1`, [line.id]);
      if (related.category === 'room' && related.stay_night_id) {
        await this.nights.addDiscount(tx, related.stay_night_id, -line.amount_vnd);
      }
    } else if (request.status === 'rejected' || request.status === 'cancelled') {
      await tx.query(`UPDATE folio_line SET line_state = 'rejected' WHERE id = $1`, [line.id]);
    } else {
      return;
    }
    await this.audit.recordMoney(tx, {
      action: request.status === 'approved' ? 'folio.foc_posted' : 'folio.foc_rejected',
      entityType: 'folio_line',
      entityId: line.id,
      ...(request.target_code ? { entityCode: request.target_code } : {}),
      before: { lineState: 'pending_approval' },
      after: {
        lineState: request.status === 'approved' ? 'posted' : 'rejected',
        amountVnd: line.amount_vnd,
      },
    });
  }

  private async line(tx: Tx, id: string): Promise<LineRow | null> {
    const { rows } = await tx.query<LineRow>(
      `SELECT l.id, l.folio_id, l.category, l.revenue_group, l.service_date::text AS service_date,
              l.unit_price_vnd, l.amount_vnd, l.line_state, l.reversal_of_id, l.related_line_id, l.stay_night_id,
              EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id) AS reversed
         FROM folio_line l WHERE l.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }
}
