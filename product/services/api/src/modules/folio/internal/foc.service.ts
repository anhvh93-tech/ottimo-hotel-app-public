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
import { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { applyPct } from '../../reservations/public/pricing';
import { FolioService, OTA_COVERED } from '../public/folio.service';
import { keyKindOf } from '../public/reductions';
import { StayWaiverAlertService } from './stay-waiver-alert';

/**
 * ARC 16.27 (2) / R7LOCK-02 (DOM 18/10, BR-525): the FOC reason that writes a debt off after check-out – the ONLY
 * request on a `settled` / `closed` folio, and only while the stay has an open debt.
 */
export const DEBT_WRITE_OFF = 'debt_write_off';
const WRITE_OFF_ROLES = ['owner', 'manager'];

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
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Inject(StayWaiverAlertService) private readonly stayAlert: StayWaiverAlertService,
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
    // ARC 16.27 (2): `debt_write_off` is the one exception to a settled / closed folio – with an open debt of the
    // stay (front desk, read under L1 → L3), `kind = foc`, OWN/MGR, a note, at most what is still owed.
    const writeOff = input.reasonCode === DEBT_WRITE_OFF;
    let openDebtVnd = 0;
    if (folio.status !== 'open') {
      const debt = writeOff ? await this.hooks.openDebt(tx, folio.id) : null;
      if (!debt) throw problem('FOLIO_LOCKED');
      openDebtVnd = debt.openDebtVnd;
      if (!actor.roles.some((r) => WRITE_OFF_ROLES.includes(r))) throw problem('FORBIDDEN_ACTION');
      // R3-Q25 (FB-R2-SEC-BE-82 (b)): a write-off may be self-applied by OWN/MGR – the requester re-authenticates
      // exactly as an approver deciding it would (S1: password, checked by the controller before the unit of work).
      if (!input.requesterReauthenticated) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'secret', code: 'REQUIRED' }] });
      }
      if (input.kind !== 'foc') {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_ALLOWED' }] });
      }
      if (!input.note || input.note.trim().length < 3) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
        });
      }
    } else if (writeOff) {
      // Nothing to write off while the folio is open (no debt yet) – the ordinary FOC reasons apply.
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'reasonCode', code: 'NOT_ALLOWED' }],
      });
    }
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
    // S4-23 (6): line − (what is applied now + what pending requests ask) on the key (FolioService – the same
    // rule as the desk's requestFocForSurcharge, S4-25).
    const usage = await this.folios.reductionUsage(tx, line.id);
    const remaining = Math.max(0, usage.valueVnd - usage.usedVnd);
    // BR-433 (a)(b) v0.4.0 (R3 – FB-R2-SEC-BE-83, "chống chia nhỏ"): the per-time limit is compared with the Σ of
    // the same write-off folio / FOC key – read here, under L1 → L3 (lockStay above), so two requests sent at the
    // same time never both fit the limit (BR-525-27).
    let perTimeAmountVnd: number;
    let limitBasisVnd: number | null;
    if (writeOff) {
      // DOM 18/10 (BR-525, ARC 16.28) + FB-R2-SEC-BE-80 (a): min(what the line still allows, the OPEN DEBT –
      // `OpenDebt.openDebtVnd` of the front desk, the one source of the amount – minus what the write-offs still
      // pending on this folio ask) – never an overpayment on a folio that is or will be closed, never a charge still
      // inside its post-checkout window (not a debt yet).
      const { rows: asked } = await tx.query<{ total: string | number }>(
        `SELECT COALESCE(sum(a.amount_vnd), 0) AS total FROM approval_request a
           JOIN folio_line f ON f.id = a.folio_line_id
          WHERE f.folio_id = $1 AND a.type = 'foc' AND a.reason_code = $2
            AND a.status IN ('pending', 'escalated')`,
        [folio.id, DEBT_WRITE_OFF],
      );
      const askedVnd = Number(asked[0]?.total ?? 0);
      const max = Math.max(0, Math.min(remaining, openDebtVnd - askedVnd));
      if (input.amountVnd > max) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
          extras: { max },
        });
      }
      // (a) Σ = what the approved write-offs of the folio apply now (every debt cycle, every requester/approver,
      // OWN included – live posted lines, BUG-R2-207) + what the pending ones ask + this request; rejected and
      // auto-cancelled (`debt_cleared`) requests count nothing. Basis = the folio's highest night (not the line).
      const { rows: applied } = await tx.query<{ total: string | number }>(
        `SELECT COALESCE(-sum(l.amount_vnd), 0) AS total FROM folio_line l
           JOIN approval_request a ON a.id = l.approval_request_id
          WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted'
            AND l.reversal_of_id IS NULL AND a.reason_code = $2
            AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
        [folio.id, DEBT_WRITE_OFF],
      );
      perTimeAmountVnd = Number(applied[0]?.total ?? 0) + askedVnd + input.amountVnd;
      limitBasisVnd = await this.folios.folioNightBasisVnd(tx, folio.id);
    } else {
      if (input.amountVnd > remaining) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'amountVnd', code: 'VALUE_OUT_OF_RANGE' }],
          extras: { max: remaining },
        });
      }
      // (b) Σ of the FOC key = what its reductions apply now + what is still asked on it + this request.
      perTimeAmountVnd = usage.usedVnd + input.amountVnd;
      // BR-433 "≤ giá 1 đêm": the night rate of the night the reduced line belongs to (BUG-R2-046).
      limitBasisVnd = await this.folios.nightRateBasis(tx, line.id);
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
      // ARC 16.27 (2): a write-off is an entry after the bill was closed (bill and folio state unchanged).
      ...(writeOff ? { postCheckout: true } : {}),
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
      // BR-433 "≤ giá 1 đêm" (BUG-R2-046) – for a write-off the folio's highest night (BR-433 (a) v0.4.0).
      limitBasisVnd,
      perTimeAmountVnd,
      lineCategory: line.category,
      requesterReauthenticated: input.requesterReauthenticated,
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await tx.query(`UPDATE folio_line SET approval_request_id = $2 WHERE id = $1`, [
      focLineId,
      row.id,
    ]);
    // 0060: the key of a room / extra-person / room-change-difference FOC is its date (BR-434 S4-02 – moves with
    // the nights; S438-FOC-03/04).
    if (keyKindOf(line.category) === 'night' && line.service_date) {
      await this.approvals.setFocKeyDate(tx, row.id, line.service_date);
    }
    // Self-applied (MGR within the price of one night, OWN): submit already ran onDecided → afterWriteOff.
    return row;
  }

  /**
   * ARC 16.27 (2), after a `debt_write_off` FOC is posted (self-applied, or approved by OWN – same transaction,
   * locks L1 → L3 held: lockStay / preLock): BR-903 – on a ROOM line the amount written off leaves the commission
   * base of the booking (CTV 8 %: 100.000 off → 408.400 instead of 416.400; `paid` untouched – R3), on minibar /
   * damage / surcharge lines the base stays; the folio owes nothing any more → the debt is closed `written_off`
   * (front desk) and the commission is earned now (FolioService.tryEarnCommissions).
   */
  private async afterWriteOff(tx: Tx, request: ApprovalRow): Promise<void> {
    if (request.reason_code !== DEBT_WRITE_OFF || !request.folio_line_id) return;
    const { rows } = await tx.query<{
      folio_id: string;
      category: string;
      reservation_id: string | null;
      applied: string | number;
    }>(
      `SELECT f.folio_id, r.category, r.reservation_id,
              (SELECT COALESCE(-sum(x.amount_vnd), 0) FROM folio_line x
                WHERE x.approval_request_id = $1 AND x.line_state = 'posted'
                  AND NOT EXISTS (SELECT 1 FROM folio_line y WHERE y.reversal_of_id = x.id)) AS applied
         FROM folio_line f JOIN folio_line r ON r.id = f.related_line_id
        WHERE f.id = $2`,
      [request.id, request.folio_line_id],
    );
    const w = rows[0];
    if (!w) return;
    const applied = Number(w.applied);
    const folio = await this.folios.get(tx, w.folio_id);
    if (!folio) return;
    if (w.category === 'room' && applied > 0) {
      const { rows: cs } = await tx.query<{
        id: string;
        status: string;
        rate_pct_snapshot: string;
        base_amount_vnd: number;
        amount_vnd: number;
      }>(
        `SELECT id, status, rate_pct_snapshot, base_amount_vnd, amount_vnd FROM commission
          WHERE reservation_id IN ($1, $2) AND status IN ('projected', 'earned', 'payable')
          ORDER BY id FOR UPDATE`,
        [folio.primary_reservation_id, w.reservation_id ?? folio.primary_reservation_id],
      );
      for (const c of cs) {
        const base = Math.max(0, Number(c.base_amount_vnd) - applied);
        const amount = applyPct(base, Number(c.rate_pct_snapshot), 1);
        await tx.query(
          `UPDATE commission SET base_amount_vnd = $2, amount_vnd = $3, updated_at = $4, version = version + 1
            WHERE id = $1`,
          [c.id, base, amount, this.clock.now()],
        );
        await this.audit.recordMoney(tx, {
          action: 'commission.projected',
          entityType: 'commission',
          entityId: c.id,
          ...(request.target_code ? { entityCode: request.target_code } : {}),
          before: {
            status: c.status,
            baseVnd: Number(c.base_amount_vnd),
            amountVnd: Number(c.amount_vnd),
          },
          after: { status: c.status, baseVnd: base, amountVnd: amount },
          reason: 'debt written off on a room line (BR-903, BR-525)',
        });
      }
    }
    if ((await this.folios.balance(tx, w.folio_id)).balanceDueVnd > 0) return;
    await this.hooks.debtSettled(tx, {
      folioId: w.folio_id,
      paymentId: request.folio_line_id,
      outcome: 'written_off',
      actor: {
        userId: request.approver_id ?? request.requested_by,
        roles: [request.approver_role_snapshot ?? 'manager'],
      },
    });
    const own = request.target_code ?? '';
    await this.folios.tryEarnCommissions(tx, {
      reservationId: folio.primary_reservation_id,
      reservationCode: own,
      status: 'checked_out',
    });
  }

  /** SM-10 decision hook (approved / rejected / cancelled) for `foc` and `special_discount`. */
  async onDecided(tx: Tx, request: ApprovalRow): Promise<void> {
    if (!request.folio_line_id) return;
    const first = await this.line(tx, request.folio_line_id);
    if (!first) return;
    if (request.status === 'approved' && request.reason_code === DEBT_WRITE_OFF) {
      // FB-R2-SEC-BE-80 (b), BR-525: applied up to the open debt NOW (preLock holds L1 → L3; the debt may have been
      // paid while the request waited): nothing left → cancelled `debt_cleared`, no FOC line; less → capped.
      const open = await this.hooks.openDebt(tx, first.folio_id);
      const capVnd = Math.min(Number(request.amount_vnd), Math.max(0, open?.openDebtVnd ?? 0));
      if (capVnd <= 0) {
        await this.approvals.cancelApproved(tx, request.id, 'debt_cleared');
        await this.rejectPendingLines(tx, request, first.folio_id);
        return;
      }
      await this.approvals.setAppliedCap(tx, request.id, capVnd, {
        openDebtVnd: open?.openDebtVnd ?? 0,
      });
    }
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
      // ARC 16.27 (2): a write-off OWN approved above the manager's limit.
      await this.afterWriteOff(tx, request);
      // BR-433 (c) v0.4.0 – ESC-026 A: Σ of the waivers applied on the stay vs the threshold → tell the owner.
      await this.stayAlert.afterApplied(tx, request, first.folio_id);
      return;
    }
    if (request.status !== 'rejected' && request.status !== 'cancelled') return;
    await this.rejectPendingLines(tx, request, first.folio_id);
  }

  /** Every "chờ duyệt" line of the request (it may have followed re-posted lines – S4-18) → `rejected`. */
  private async rejectPendingLines(tx: Tx, request: ApprovalRow, folioId: string): Promise<void> {
    const { rows: pending } = await tx.query<{ id: string; amount_vnd: number }>(
      `SELECT id, amount_vnd FROM folio_line
        WHERE (approval_request_id = $1 OR id = $2) AND line_state = 'pending_approval'`,
      [request.id, request.folio_line_id],
    );
    if (pending.length > 0) await this.folios.touch(tx, folioId);
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
