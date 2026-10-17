/**
 * FOC / special discount on a folio line (US-007 AC1, A35; SM-10; BR-431…436, BR-434; DATA erd 8).
 * - requestFoc: a NEGATIVE line `foc`/`discount` in state `pending_approval` pointing at the line it
 *   reduces (related_line_id), then ApprovalService.submit() in the same transaction (A1 pending, or A2
 *   self-applied within the requester's limit – then the hook below already posted it). The amount asked is
 *   capped per KEY (S4-23 (6)): line − (applied + asked of the pending requests on the key).
 * - Approval hooks (same transaction as the decision, registered by FolioModule):
 *   approved → FolioService.syncReductions (S4-18, BR-434 v0.3.5: the approval re-reads the CURRENT line of
 *   the key in the same transaction and applies min(asked, line − earlier reductions) – 0 → the FOC is
 *   dormant, never "approved but not applied"; the night's discount_vnd follows); rejected/cancelled → the
 *   "chờ duyệt" line `rejected`. Amounts are never updated (BR-008).
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
import { FolioService, OTA_COVERED } from '../public/folio.service';

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
  reservation_id: string | null;
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
  ) {}

  async request(
    tx: Tx,
    actor: Actor,
    folioId: string,
    lineId: string,
    input: FocInput,
    ctx: { reservationCode: string | null; requestId?: string },
  ): Promise<ApprovalRow> {
    // S4-13 lock order (bookings → folio): a self-applied request moves stay_night like a decision.
    const folio = await this.folios.lockStay(tx, folioId);
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
    // DOM 17/10 (BR-307/431, oracle BR-307-03; OpenAPI 0.3.6 bổ sung 4) + re-verification round 5: no FOC /
    // special discount on anything the OTA collected for us – every OTA_COVERED line (night, OTA-kept fee:
    // early departure / cancellation / no-show) of a booking with its system receipt `ota_collect`. The receipt
    // is the gross of those lines, so a FOC there would eat into the money paid at the desk (extra-person fee).
    // Make good with a FOC on a desk charge, a free night or a real refund (BR-522). OTA at the property: like
    // Direct.
    if (OTA_COVERED.has(line.category)) {
      const { rows: prepaid } = await tx.query(
        `SELECT 1 FROM folio_line l JOIN payment p
            ON p.folio_id = l.folio_id AND p.reservation_id = l.reservation_id
         WHERE l.id = $1 AND p.provider = 'ota_system' AND p.status = 'succeeded' AND p.reversal_of_id IS NULL
         LIMIT 1`,
        [line.id],
      );
      if (prepaid.length > 0) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'kind', code: 'FOC_NOT_ALLOWED_OTA_PREPAID' }],
        });
      }
    }
    // S4-23 (6): what is applied now + what pending requests ask on this line (reversed FOC lines excluded –
    // a recomputed FOC leaves its old line reversed on the same charge).
    const { rows: used } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(-SUM(f.amount_vnd), 0) AS total FROM folio_line f
        WHERE f.related_line_id = $1 AND f.category IN ('foc', 'discount')
          AND f.line_state IN ('posted', 'pending_approval') AND f.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = f.id)`,
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
      // Round 6 (B): the FOC belongs to the booking of the line it reduces (a child booking's night too).
      reservationId: line.reservation_id ?? folio.primary_reservation_id,
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
      // Bill label "Miễn phí · {reason}" (BR-434, DOM BE-21).
      labelParams: { reason: input.reasonCode },
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
      // BR-433 "≤ giá 1 đêm": the night rate of the night the reduced line belongs to (BUG-R2-046 – surcharges,
      // services and fees too, not only room lines).
      limitBasisVnd: await this.folios.nightRateBasis(tx, line.id),
      lineCategory: line.category,
      requesterReauthenticated: input.requesterReauthenticated,
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await tx.query(`UPDATE folio_line SET approval_request_id = $2 WHERE id = $1`, [
      focLineId,
      row.id,
    ]);
    // 0060: the key of a room / extra-person FOC is its date (BR-434 S4-02 – moves with the nights).
    if ((line.category === 'room' || line.category === 'extra_person') && line.service_date) {
      await this.approvals.setFocKeyDate(tx, row.id, line.service_date);
    }
    return row;
  }

  /** SM-10 decision hook (approved / rejected / cancelled) for `foc` and `special_discount`. */
  async onDecided(tx: Tx, request: ApprovalRow): Promise<void> {
    if (!request.folio_line_id) return;
    const first = await this.line(tx, request.folio_line_id);
    if (!first) return;
    if (request.status === 'approved') {
      // S4-18 / S4-23: the decision re-reads the current line of the key in this transaction (the folio is
      // locked before the request – ApprovalService.onBeforeDecide) and applies what the key allows.
      await this.folios.syncReductions(tx, first.folio_id, {
        userId: request.approver_id,
      });
      // x-ota-prepaid-rule safety net: the receipt is the GROSS of the OTA-covered lines (BR-307 v0.3.4) and no
      // FOC is accepted on them for an OTA prepaid booking (requestFoc), so a decision normally leaves it as
      // is; the resync only repairs a receipt that drifted.
      await this.folios.resyncOtaCollect(tx, first.folio_id, null, {
        userId: request.approver_id,
        ...(request.target_code ? { reservationCode: request.target_code } : {}),
      });
      return;
    }
    if (request.status !== 'rejected' && request.status !== 'cancelled') return;
    // Every "chờ duyệt" line of the request (it may have followed re-posted lines – S4-18).
    const { rows: pending } = await tx.query<{ id: string; amount_vnd: number }>(
      `SELECT id, amount_vnd FROM folio_line
        WHERE (approval_request_id = $1 OR id = $2) AND line_state = 'pending_approval'`,
      [request.id, request.folio_line_id],
    );
    for (const l of pending) {
      await tx.query(`UPDATE folio_line SET line_state = 'rejected' WHERE id = $1`, [l.id]);
      await this.audit.recordMoney(tx, {
        action: 'folio.foc_rejected',
        entityType: 'folio_line',
        entityId: l.id,
        ...(request.target_code ? { entityCode: request.target_code } : {}),
        before: { lineState: 'pending_approval' },
        after: { lineState: 'rejected', amountVnd: l.amount_vnd },
      });
    }
  }

  private async line(tx: Tx, id: string): Promise<LineRow | null> {
    const { rows } = await tx.query<LineRow>(
      `SELECT l.id, l.folio_id, l.reservation_id, l.category, l.revenue_group,
              l.service_date::text AS service_date,
              l.unit_price_vnd, l.amount_vnd, l.line_state, l.reversal_of_id, l.related_line_id, l.stay_night_id,
              EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id) AS reversed
         FROM folio_line l WHERE l.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }
}
