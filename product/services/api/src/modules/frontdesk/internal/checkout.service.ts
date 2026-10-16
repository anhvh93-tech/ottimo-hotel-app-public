/**
 * Check-out – spec EP03-05 5 (US-035…039, US-038 B18; BR-412/413/415 at the ACTUAL time – DOM G-10; G-15
 * credit; BR-426 balance; BR-427 post-checkout window; BR-525 debt; BR-812 kit collect).
 *
 * getCheckoutSummary: lines + money + blockers for the 3-step screen (read-only).
 * checkOut (B18): server re-checks every blocker in order (minibar → pending approvals → balance → credit),
 * recomputes the late surcharge at the actual departure time: a lower amount reverses the old line and posts
 * the new one automatically (in the guest's favour), a higher one needs the desk's confirmation (BR-414).
 * Folio `settled` + bill number through FolioService.settle (BE-B FolioPort) in the SAME transaction.
 * Payments of `finalPayment` go through PaymentService.recordInTx (one path for receipts).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, addDays, businessDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { folioLineDto } from '../../folio/public/folio-view';
import type { FolioLineRow } from '../../folio/public/folio.service';
import { PaymentService, type PaymentCreateInput } from '../../payments/public/payment.service';
import {
  type BookingContext,
  Fields,
  MGR_PLUS,
  type ReservationRow,
  type RoomInfo,
  hasAny,
  loadReservation,
  recordTransition,
} from '../../reservations/public/stay-port';
import type { LateCheckoutResult } from '../public/stay-rules';
import { StayService } from './stay.service';
import { StaySupport, TASK_RANK } from './stay-support';

/** BA EP03-05 5.5 [GIẢ ĐỊNH BA]: a debt is due within this many days (data-entry bound, technical). */
const DEBT_MAX_DAYS = 30;

type Blocker = 'minibar_not_checked' | 'pending_approvals' | 'balance_due' | 'credit_balance';

interface Departure {
  time: LocalTime;
  rm: RoomInfo;
  quote: Awaited<ReturnType<StayService['lateQuote']>>;
}

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(StayService) private readonly stays: StayService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PaymentService) private readonly payments: PaymentService,
  ) {}

  /** The departure clock time on the business-day axis (E05-09: `checkoutAt` wins over `checkoutTime`). */
  private async departureTime(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    checkoutTime: LocalTime | undefined,
    checkoutAt: Date | undefined,
  ): Promise<LocalTime> {
    if (checkoutAt) {
      const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
      if (businessDate(checkoutAt, ctx.tz, rollover) !== row.departure_date) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'checkoutAt', code: 'DATE_INVALID' }],
        });
      }
      return this.s.localTime(ctx, checkoutAt);
    }
    return (
      checkoutTime ?? row.agreed_checkout_time ?? (await this.s.param(tx, ctx, 'checkout_time'))
    );
  }

  private async departure(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    time: LocalTime,
  ): Promise<Departure> {
    const seg = await this.s.segmentOn(tx, row.id, addDays(row.departure_date, -1));
    const rm = seg.room_id ? await this.s.stay.room(tx, seg.room_id) : null;
    if (!rm) throw problem('RESERVATION_UNASSIGNED');
    return { time, rm, quote: await this.stays.lateQuote(tx, ctx, row, rm, time) };
  }

  /** Live (posted, not reversed, not a reversal) late-checkout lines of the booking (G-10). */
  private async liveLateLines(tx: Tx, folioId: string, reservationId: string) {
    const lines = await this.s.folios.lines(tx, folioId);
    const reversed = new Set(lines.filter((l) => l.reversal_of_id).map((l) => l.reversal_of_id));
    return lines.filter(
      (l) =>
        l.reservation_id === reservationId &&
        l.category === 'late_checkout' &&
        l.line_state === 'posted' &&
        !l.reversal_of_id &&
        !reversed.has(l.id),
    );
  }

  private async pendingApprovals(tx: Tx, row: ReservationRow): Promise<number> {
    // A-34: refund requests never block the check-out.
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM approval_request
        WHERE target_type = 'reservation' AND target_id = $1 AND status IN ('pending', 'escalated')
          AND type <> 'refund'`,
      [row.id],
    );
    return rows[0]?.n ?? 0;
  }

  /** B18 is called on the folio's primary booking; its children (B9a/B13) leave with it. */
  private primaryFor(row: ReservationRow): void {
    if (row.parent_reservation_id) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check out the primary booking (children share its folio)',
      });
    }
  }

  private async children(tx: Tx, row: ReservationRow) {
    const { rows } = await tx.query<{ id: string; code: string; departure_date: string }>(
      `SELECT id, code, departure_date::text AS departure_date FROM reservation
        WHERE parent_reservation_id = $1 AND status = 'in_house' ORDER BY departure_date FOR UPDATE`,
      [row.id],
    );
    return rows;
  }

  // ───────────────────────── getCheckoutSummary ─────────────────────────

  async summary(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    q: { checkoutTime?: LocalTime | undefined; checkoutAt?: Date | undefined },
  ): Promise<Record<string, unknown>> {
    const row = await loadReservation(tx, id, ctx.actor);
    if (row.status !== 'in_house') throw this.s.stay.invalid(row);
    if (!row.folio_id) throw problem('NOT_FOUND');
    const time = await this.departureTime(tx, ctx, row, q.checkoutTime, q.checkoutAt);
    const d = await this.departure(tx, ctx, row, time);
    const lines = await this.s.folios.lines(tx, row.folio_id);
    const balance = await this.s.folios.balance(tx, row.folio_id);
    const pending = await this.pendingApprovals(tx, row);
    const minibar = await this.s.ports.minibar.checkoutStatus(tx, row.id, d.rm.id);
    const old = await this.liveLateLines(tx, row.folio_id, row.id);
    const oldVnd = old.reduce((a, l) => a + l.amount_vnd, 0);
    const late = d.quote.r;
    const blockers: Blocker[] = [];
    if (minibar.required && !minibar.checked) blockers.push('minibar_not_checked');
    if (pending > 0) blockers.push('pending_approvals');
    if (balance.balanceDueVnd > 0) blockers.push('balance_due');
    if (balance.creditVnd > 0) blockers.push('credit_balance');
    const tz = ctx.tz;
    return {
      checkoutTime: time,
      standardCheckoutTime: d.quote.standard,
      lateCheckoutSurcharge: { tierPct: late.tierPct, amountVnd: late.amountVnd },
      lines: lines.map((l: FolioLineRow) => folioLineDto(l, tz)),
      totalVnd: balance.totalVnd,
      paidVnd: balance.paidVnd,
      balanceDueVnd: balance.balanceDueVnd,
      creditVnd: balance.creditVnd,
      ...(old.length > 0
        ? {
            lateSurchargeRecalc: {
              oldVnd,
              newVnd: late.amountVnd,
              newTierPct: late.tierPct,
            },
          }
        : {}),
      pendingApprovals: pending,
      blockers,
    };
  }

  // ───────────────────────── B18 ─────────────────────────

  async checkOut(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<{ row: ReservationRow; billNo: string; createdTaskIds: string[] }> {
    const f = new Fields(body);
    const checkoutTime = f.time('checkoutTime');
    if (body.checkoutTime === undefined || body.checkoutTime === null) {
      f.add('checkoutTime', 'REQUIRED');
    }
    let checkoutAt: Date | undefined;
    if (body.checkoutAt !== undefined && body.checkoutAt !== null) {
      if (typeof body.checkoutAt !== 'string' || Number.isNaN(Date.parse(body.checkoutAt))) {
        f.add('checkoutAt', 'DATE_INVALID');
      } else {
        checkoutAt = new Date(body.checkoutAt);
        if (checkoutAt.getTime() > ctx.now.getTime()) f.add('checkoutAt', 'DATE_INVALID');
      }
    }
    const applyLate = f.bool('applyLateSurcharge') ?? false;
    const expected = f.money('expectedSurchargeVnd', { required: false, positive: false });
    const over = this.overpayment(f, body);
    const debt = this.debt(f, body, ctx.today);
    const finalPayment = this.paymentInput(f, body);
    f.done();
    const mgr = hasAny(ctx.actor.roles, MGR_PLUS);
    if (debt && !mgr) throw problem('FORBIDDEN_ACTION', { detail: 'debt is OWN/MGR (A19)' });
    if (over?.mode === 'retain_with_guest_consent' && !mgr) {
      throw problem('FORBIDDEN_ACTION', { detail: 'retain_with_guest_consent is MGR+' });
    }

    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    if (row.status !== 'in_house') throw this.s.stay.invalid(row);
    this.primaryFor(row);
    const kids = await this.children(tx, row);
    const lastDeparture = kids.reduce(
      (a, k) => (k.departure_date > a ? k.departure_date : a),
      row.departure_date,
    );
    if (lastDeparture !== ctx.today) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-out on the departure business day (early departure first – B16)',
      });
    }
    if (!row.folio_id) throw problem('NOT_FOUND');
    const folioId = row.folio_id;
    const time = await this.departureTime(tx, ctx, row, checkoutTime, checkoutAt);
    const d = await this.departure(tx, ctx, row, time);
    const late: LateCheckoutResult = d.quote.r;
    if (late.treatAsExtension) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'checkoutTime', code: 'LATE_CHECKOUT_AFTER_LIMIT' }],
      });
    }
    await this.s.occupancy.lockRooms(tx, [d.rm.id]);

    // ── G-10: late surcharge at the ACTUAL departure time ──
    const old = await this.liveLateLines(tx, folioId, row.id);
    const oldVnd = old.reduce((a, l) => a + l.amount_vnd, 0);
    const newVnd = late.amountVnd;
    const confirmIfHigher = () => {
      if (!applyLate) return false;
      if (expected === undefined) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'expectedSurchargeVnd', code: 'REQUIRED' }],
        });
      }
      if (expected !== newVnd) {
        throw problem('SURCHARGE_CHANGED', {
          extras: { expectedSurchargeVnd: newVnd, tierPct: late.tierPct },
        });
      }
      return true;
    };
    let repost = false;
    if (oldVnd > 0 && newVnd < oldVnd)
      repost = true; // lower → automatic, in the guest's favour
    else if (newVnd > oldVnd && newVnd > 0) repost = confirmIfHigher();
    if (repost) {
      const actor = { userId: ctx.actor.userId, reservationCode: row.code, ...this.s.req(ctx) };
      for (const l of old) {
        await this.s.folios.reverseLine(tx, l.id, `G-10 actual departure ${time}`, actor);
      }
      if (newVnd > 0) {
        await this.s.folios.postLines(
          tx,
          folioId,
          [
            {
              reservationId: row.id,
              category: 'late_checkout',
              description: `late_checkout ${time} ${late.tierPct}%`,
              quantity: 1,
              unitPriceVnd: newVnd,
              amountVnd: newVnd,
              serviceDate: row.departure_date,
              source: 'checkout',
            },
          ],
          actor,
        );
      }
    }

    // ── final payment in the same transaction (spec 5.4) ──
    if (finalPayment) {
      await this.payments.recordInTx(
        tx,
        { userId: ctx.actor.userId, roles: ctx.actor.roles, ...this.s.req(ctx) },
        folioId,
        finalPayment,
        {
          reservationId: row.id,
          reservationCode: row.code,
          channelGroup: row.channel_group,
          fieldPrefix: 'finalPayment.',
        },
      );
    }

    // ── blockers, in order (spec 5.5) ──
    const minibar = await this.s.ports.minibar.checkoutStatus(tx, row.id, d.rm.id);
    if (minibar.required && !minibar.checked) throw problem('MINIBAR_NOT_CHECKED');
    const pending = await this.pendingApprovals(tx, row);
    if (pending > 0) throw problem('PENDING_APPROVALS', { extras: { pendingApprovals: pending } });
    const balance = await this.s.folios.balance(tx, folioId);
    if (balance.balanceDueVnd > 0 && !debt) {
      throw problem('BALANCE_DUE', { extras: { balanceDueVnd: balance.balanceDueVnd } });
    }
    let refundRequestId: string | null = null;
    if (balance.creditVnd > 0) {
      if (!over) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'overpaymentHandling', code: 'OVERPAYMENT_HANDLING_REQUIRED' }],
          extras: { creditVnd: balance.creditVnd },
        });
      }
      if (over.mode === 'refund_request') {
        const req = await this.s.approvals.submit(tx, ctx.actor, {
          type: 'refund',
          amountVnd: balance.creditVnd,
          reasonCode: 'overpayment',
          reasonNote: over.reason,
          targetType: 'reservation',
          targetId: row.id,
          targetCode: row.code,
          ...this.s.req(ctx),
        });
        refundRequestId = req.id;
      } else {
        await this.s.folios.postLines(
          tx,
          folioId,
          [
            {
              reservationId: row.id,
              category: 'deposit_forfeit',
              description: 'retain_with_guest_consent',
              quantity: 1,
              unitPriceVnd: balance.creditVnd,
              amountVnd: balance.creditVnd,
              serviceDate: row.departure_date,
              source: 'checkout',
              reason: over.reason,
            },
          ],
          { userId: ctx.actor.userId, reservationCode: row.code, ...this.s.req(ctx) },
        );
      }
    }

    // ── state ──
    const all = [row.id, ...kids.map((k) => k.id)];
    await tx.query(
      `UPDATE reservation SET status = 'checked_out', actual_checkout_at = $2, checkout_mode = $3,
              debt_due_date = $4, debt_reason = $5, updated_at = $2, version = version + 1
        WHERE id = ANY($1::uuid[])`,
      [all, ctx.now, debt ? 'debt' : 'desk', debt?.dueDate ?? null, debt?.reason ?? null],
    );
    for (const k of kids) {
      await recordTransition(tx, {
        reservationId: k.id,
        code: k.code,
        from: 'in_house',
        to: 'checked_out',
        event: 'B18',
        reasonNote: row.code,
        now: ctx.now,
        requestId: ctx.requestId,
      });
    }
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'in_house',
      to: 'checked_out',
      event: 'B18',
      reasonCode: debt ? 'debt' : null,
      reasonNote: debt?.reason ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    const settled = await this.s.folios.settle(tx, folioId, {
      userId: ctx.actor.userId,
      reservationCode: row.code,
      ...this.s.req(ctx),
    });
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.checked_out',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { status: 'in_house' },
      after: {
        status: 'checked_out',
        roomNo: d.rm.room_no,
        lateSurchargeVnd: newVnd,
        checkoutMode: debt ? 'debt' : 'desk',
      },
      ...(debt ? { reason: debt.reason } : {}),
      ...this.s.req(ctx),
    });
    if (debt) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.debt_on_checkout',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        after: { balanceDueVnd: balance.balanceDueVnd, dueDate: debt.dueDate },
        reason: debt.reason,
        ...this.s.req(ctx),
      });
    }

    // ── room + housekeeping (SM-03 R9: CL stays CL) ──
    const createdTaskIds: string[] = [];
    const status = await this.s.roomStatus.of(tx, d.rm.id, ctx.today);
    if (status !== 'CL') {
      await this.s.roomStatus.set(tx, d.rm.id, 'VD', {
        today: ctx.today,
        now: ctx.now,
        event: 'B18',
      });
    }
    const extra = Math.max(0, this.s.counted(row) - d.rm.base_occupancy);
    const prepared = extra > 0 ? await this.s.doneKitPrepared(tx, row.id, d.rm.id) : 0;
    for (const t of await this.s.openKitTasks(tx, row.id)) {
      if (t.type === 'extra_guest_kit_prepare')
        await this.s.cancelTask(tx, ctx, t.id, 'checked_out');
    }
    const arrival = await this.s.sameDayArrival(tx, d.rm.id, ctx.today, row.id);
    const clean = await this.s.createTask(tx, ctx, {
      roomId: d.rm.id,
      reservationId: row.id,
      type: 'checkout_clean',
      dueDate: ctx.today,
      rank: arrival ? TASK_RANK.arrivalToday : TASK_RANK.checkoutNoArrival,
      note: prepared > 0 ? `extra_guest_kit_collect x${prepared}` : null,
    });
    if (clean) createdTaskIds.push(clean);
    const refill = await this.s.ports.minibar.onCheckedOut(tx, row.id, d.rm.id);
    if (refill) createdTaskIds.push(refill);

    await this.s.ports.registration.onCheckedOut(tx, row.id, ctx.now);
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    if (refundRequestId) {
      await this.s.events.publish(tx, 'payment.changed', refundRequestId, {
        roles: [...MGR_PLUS],
        userIds: [ctx.actor.userId],
      });
    }
    await this.s.stay.emit(tx, 'transitioned', after, 'in_house', 'B18', d.rm.id);
    return { row: after, billNo: settled.billNo, createdTaskIds };
  }

  // ───────────────────────── inputs ─────────────────────────

  private overpayment(
    f: Fields,
    body: Record<string, unknown>,
  ): { mode: 'refund_request' | 'retain_with_guest_consent'; reason: string } | null {
    const v = body.overpaymentHandling;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('overpaymentHandling', 'VALIDATION_FAILED');
      return null;
    }
    const sub = new Fields(v as Record<string, unknown>);
    const mode = sub.enumOf('mode', ['refund_request', 'retain_with_guest_consent'] as const, true);
    const reason = sub.text('reason', 500, { required: true, min: 3 });
    for (const e of sub.errors) f.add(`overpaymentHandling.${e.field}`, e.code);
    return mode && reason ? { mode, reason } : null;
  }

  private debt(
    f: Fields,
    body: Record<string, unknown>,
    today: LocalDate,
  ): { dueDate: LocalDate; reason: string } | null {
    const v = body.debt;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('debt', 'VALIDATION_FAILED');
      return null;
    }
    const sub = new Fields(v as Record<string, unknown>);
    const due = sub.date('dueDate', true);
    const reason = sub.text('reason', 500, { required: true, min: 3 });
    if (due && (due <= today || due > addDays(today, DEBT_MAX_DAYS)))
      sub.add('dueDate', 'DATE_INVALID');
    for (const e of sub.errors) f.add(`debt.${e.field}`, e.code);
    return due && reason && !sub.has('dueDate') ? { dueDate: due, reason } : null;
  }

  private paymentInput(f: Fields, body: Record<string, unknown>): PaymentCreateInput | null {
    const v = body.finalPayment;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('finalPayment', 'VALIDATION_FAILED');
      return null;
    }
    const p = v as Record<string, unknown>;
    const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string) : null);
    return {
      type: str('type') ?? '',
      method: str('method') ?? '',
      amountVnd: typeof p.amountVnd === 'number' ? p.amountVnd : Number.NaN,
      receivedAt: str('receivedAt'),
      posAuthCode: str('posAuthCode'),
      note: str('note'),
      attachmentId: str('attachmentId'),
    };
  }
}
