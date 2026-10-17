/**
 * Check-out – spec EP03-05 5 (US-035…039, US-038 B18; BR-412/413/415 at the ACTUAL time – DOM G-10; G-15
 * credit; BR-416 extra night; BR-426 balance; BR-427 post-checkout window; BR-525 debt; BR-812 kit collect).
 *
 * getCheckoutSummary: lines + money + blockers for the 3-step screen (read-only).
 * checkOut (B18): server re-checks every blocker in order (minibar → pending approvals → balance → credit),
 * recomputes the late surcharge at the actual departure time: a lower amount reverses the old line and posts
 * the new one automatically (in the guest's favour, an approved FOC carried over – DOM S3-11), a higher one
 * needs the desk's decision (BR-414, S3-12). Folio `settled` + bill number through FolioService.settle (BE-B
 * FolioPort) in the SAME transaction. Payments of `finalPayment` go through PaymentService.recordInTx.
 *
 * OpenAPI 0.3.6 bổ sung 2 (E05-11, E03-07, E15-05; DOM S3-9/S3-10): the stay is the primary booking + its
 * in-house children (BR-422 – ARC-BE-S3-05); a departure after the last BR-412 tier is "check out – charge
 * one more night" (`extraNight`, one transaction); the post-midnight window (business date = departure − 1,
 * calendar date = departure) is a valid B18 with no surcharge; only MONEY requests block; operational ones
 * are cancelled as superseded; the overpayment handled is the part not yet routed to a refund request.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import {
  type LocalDate,
  type LocalTime,
  addDays,
  businessDate,
  localDate,
} from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { folioLineDto } from '../../folio/public/folio-view';
import { roomNamesOf, snapshotSettledRoomNames } from '../../folio/public/room-names';
import type { FolioLineRow } from '../../folio/public/folio.service';
import { DocumentProfileService } from '../../guests/public/document-profile.service';
import { PaymentService, type PaymentCreateInput } from '../../payments/public/payment.service';
import {
  type BookingContext,
  Fields,
  MGR_PLUS,
  type ReservationRow,
  type RoomInfo,
  hasAny,
  loadReservation,
  outboxAvailability,
  recordChange,
  recordTransition,
} from '../../reservations/public/stay-port';
import type { LateCheckoutResult } from '../public/stay-rules';
import { StayService } from './stay.service';
import { StaySupport, TASK_RANK } from './stay-support';

/** BA EP03-05 5.5 [GIẢ ĐỊNH BA]: a debt is due within this many days (data-entry bound, technical). */
const DEBT_MAX_DAYS = 30;

/** DOM S3-10 / US-038 AC4: only MONEY requests block the check-out. */
const BLOCKING_APPROVALS = ['foc', 'special_discount', 'damage_pricing'] as const;
/** DOM S3-10: operational requests that lose their purpose at B18 (cancelled `superseded`). */
const SUPERSEDED_AT_CHECKOUT = ['late_checkout_conflict', 'checkin_room_not_ready'] as const;

type Blocker = 'minibar_not_checked' | 'pending_approvals' | 'balance_due' | 'credit_balance';

interface ExtraNight {
  date: LocalDate;
  defaultRateVnd: number;
  calendarVnd: number;
  floorVnd: number;
  ceilingVnd: number;
  available: boolean;
}

interface Departure {
  time: LocalTime;
  rm: RoomInfo;
  quote: Awaited<ReturnType<StayService['lateQuote']>>;
  stay: Awaited<ReturnType<StaySupport['effectiveStay']>>;
  /** post-midnight window: business date = departure − 1 and calendar date = departure */
  postMidnight: boolean;
  /** departure after the last BR-412 tier → one more night (E05-11) */
  extraNight: ExtraNight | null;
  rollover: LocalTime;
}

/** BR-416-06: OWN/MGR who confirmed the late charge of one night at the desk (controller re-auth). */
export interface LateFeeApprover {
  userId: string;
  username: string;
  roles: string[];
  /** The caller confirmed with their own password (OWN/MGR doing B18). */
  self: boolean;
}

/** The departure-day night is required and can be sold (BR-416). */
function sellableNight(d: Departure): boolean {
  return !!d.extraNight && d.extraNight.available;
}

/**
 * Late-checkout charge of the departure at `d.time`: the BR-412 tier; none when an extra night is sold; one
 * night's price when that night cannot be sold (BR-416-06, BUG-R2-139 – not a sold night, other revenue).
 */
function lateChargeOf(d: Departure): number {
  if (!d.extraNight) return d.quote.r.amountVnd;
  return d.extraNight.available ? 0 : d.extraNight.defaultRateVnd;
}

function lateTierOf(d: Departure): number {
  if (!d.extraNight) return d.quote.r.tierPct;
  return d.extraNight.available ? 0 : 100;
}

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(StayService) private readonly stays: StayService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(DocumentProfileService) private readonly profiles: DocumentProfileService,
  ) {}

  /** Post-midnight window at `at` for a stay leaving on `departure` (DOM S3-9 b). */
  private postMidnight(
    ctx: BookingContext,
    rollover: LocalTime,
    departure: LocalDate,
    at: Date,
  ): boolean {
    return (
      businessDate(at, ctx.tz, rollover) === addDays(departure, -1) &&
      localDate(at, ctx.tz) === departure
    );
  }

  /**
   * Departure of the whole stay at the given time: the clock time on the business-day axis (E05-09:
   * `checkoutAt` wins over `checkoutTime`), the room of the last night, the late quote (zero in the
   * post-midnight window), and the extra night when the time is after the last tier.
   */
  private async departure(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    checkoutTime: LocalTime | undefined,
    checkoutAt: Date | undefined,
  ): Promise<Departure> {
    const stay = await this.s.effectiveStay(tx, ctx, row);
    const dep = stay.departureDate;
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    const at = checkoutAt ?? ctx.now;
    const postMidnight = this.postMidnight(ctx, rollover, dep, at);
    if (checkoutAt && businessDate(checkoutAt, ctx.tz, rollover) !== dep && !postMidnight) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'checkoutAt', code: 'DATE_INVALID' }],
      });
    }
    const time: LocalTime = checkoutAt
      ? this.s.localTime(ctx, checkoutAt)
      : (checkoutTime ??
        row.agreed_checkout_time ??
        (await this.s.param<LocalTime>(tx, ctx, 'checkout_time')));
    const seg = await this.s.segmentOn(tx, stay.last.id, addDays(dep, -1));
    const rm = seg.room_id ? await this.s.stay.room(tx, seg.room_id) : null;
    if (!rm) throw problem('RESERVATION_UNASSIGNED');
    const quote = postMidnight
      ? {
          r: {
            tierPct: 0,
            baseNightVnd: 0,
            amountVnd: 0,
            treatAsExtension: false,
            inGrace: false,
            ruleRef: 'BR-412',
          } satisfies LateCheckoutResult,
          arrival: null,
          alternativeRoomAvailable: true,
          standard: await this.s.param<LocalTime>(tx, ctx, 'checkout_time'),
          rollover,
        }
      : await this.stays.lateQuote(tx, ctx, stay.last, rm, time);
    let extraNight: ExtraNight | null = null;
    if (quote.r.treatAsExtension) {
      // BR-416 v0.3.8 (BR-416-02), BUG-R2-134 (BR-417-07): the agreed price typed in this room, else the direct
      // calendar of that night; after an OTTIMO move min(what the guest bought, this room's calendar); always
      // within BR-105 – the default is a rate B18 accepts (preview = write).
      const r = await this.s.addedNightRate(
        tx,
        ctx,
        await this.s.addedNightContext(tx, ctx, row, 'last', rm.id),
        dep,
      );
      extraNight = {
        date: dep,
        defaultRateVnd: r.rateVnd,
        calendarVnd: r.calendarVnd,
        floorVnd: r.floorVnd,
        ceilingVnd: r.ceilingVnd,
        available: await this.s.occupancy.isFree(tx, rm.id, dep, addDays(dep, 1)),
      };
    }
    return { time, rm, quote, stay, postMidnight, extraNight, rollover };
  }

  private async pendingApprovals(tx: Tx, ids: readonly string[]): Promise<number> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM approval_request
        WHERE target_type = 'reservation' AND target_id = ANY($1::uuid[])
          AND status IN ('pending', 'escalated') AND type = ANY($2::text[])`,
      [[...ids], [...BLOCKING_APPROVALS]],
    );
    return rows[0]?.n ?? 0;
  }

  /** B18 is called on the folio's primary booking; its children (B9a/B13) leave with it. */
  /**
   * 0.3.7 (S4-47): what B18 would leave due if completed now at this time – the late charge re-computed (its
   * approved FOC follows: min(Σ approved, new charge) – BR-434) and the extra night after the last tier at
   * `extraNightRateVnd` (default rate when absent). One calculation for getCheckoutSummary, the `finalPayment`
   * cap and the check-out VietQR cap (S4-10).
   */
  private async dueAtCheckout(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    d: Departure,
    extraNightRateVnd: number | undefined,
    lateFeeAsNight: boolean,
  ): Promise<number> {
    const folioId = row.folio_id as string;
    const balance = await this.s.folios.balance(tx, folioId);
    const old = await this.s.liveSurchargeLines(tx, folioId, d.stay.ids, 'late_checkout');
    // BUG-R2-139 / BR-416-06 (ARC 16.6 (d)): an extra night that cannot be sold (the room is taken that night) is
    // never counted; with `lateFeeAsNight` the late charge of one night that B18 then writes
    // (`lateFeeInsteadOfNight`) is – its approved FOC follows like any late charge.
    const newVnd = d.extraNight && !d.extraNight.available && !lateFeeAsNight ? 0 : lateChargeOf(d);
    const focAfter = Math.min(await this.approvedOn(tx, folioId, 'late_checkout'), newVnd);
    const extra =
      d.extraNight && sellableNight(d)
        ? await this.extraNightDelta(
            tx,
            ctx,
            row,
            d,
            extraNightRateVnd ?? d.extraNight.defaultRateVnd,
          )
        : 0;
    return Math.max(
      0,
      balance.balanceDueVnd -
        balance.rawCreditVnd +
        (newVnd - focAfter) -
        (old.grossVnd - old.focVnd) +
        extra,
    );
  }

  /**
   * 0.3.7 `createVietQr purpose = check_out` (S4-10 – BE-B's cap through ReservationSalesPort.amountDueFor): the
   * amount of getCheckoutSummary at `checkoutAt` (absent = now) with the extra night at `extraNightRateVnd`.
   * Same gates as B18: in house, the primary booking, the departure business day (or the post-midnight window).
   */
  async amountDueForQr(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    q: {
      checkoutAt?: Date | undefined;
      extraNightRateVnd?: number | undefined;
      lateFeeAsNight?: boolean | undefined;
    },
  ): Promise<number> {
    const row = await loadReservation(tx, id, ctx.actor);
    if (row.status !== 'in_house') throw this.s.stay.invalid(row);
    this.primaryFor(row);
    if (!row.folio_id) throw problem('NOT_FOUND');
    const stay = await this.s.effectiveStay(tx, ctx, row);
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    const nowWindow = this.postMidnight(ctx, rollover, stay.departureDate, ctx.now);
    if (stay.departureDate !== ctx.today && !nowWindow) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-out QR on the departure business day',
      });
    }
    // `checkoutAt` absent = the server clock (contract), not the standard time of the summary's form default.
    const d = await this.departure(tx, ctx, row, undefined, q.checkoutAt ?? ctx.now);
    const rate = q.extraNightRateVnd;
    if (rate !== undefined) {
      // BUG-R2-139: no extra night to sell (none due, or the room is taken that night) → the option is refused.
      if (!d.extraNight || !d.extraNight.available) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'extraNightRateVnd', code: 'NOT_ALLOWED' }],
        });
      }
      if (rate < d.extraNight.floorVnd || rate > d.extraNight.ceilingVnd) {
        throw problem('RATE_OUT_OF_RANGE', {
          errors: [{ field: 'extraNightRateVnd', code: 'RATE_OUT_OF_RANGE' }],
          extras: { min: d.extraNight.floorVnd, max: d.extraNight.ceilingVnd },
        });
      }
    }
    // ARC 16.6 (d) D6: the late charge of one night only when asked explicitly, and only when the night of the
    // departure day is required and cannot be sold.
    const unsellable = !!d.extraNight && !d.extraNight.available;
    if (q.lateFeeAsNight && !unsellable) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'lateFeeAsNight', code: 'NOT_ALLOWED' }],
      });
    }
    return this.dueAtCheckout(tx, ctx, row, d, rate, !!q.lateFeeAsNight);
  }

  /**
   * ARC 16.6 (f) D7 (BE-B `confirmPaymentReceived`): what a `check_out` VietQR may take NOW, from the context
   * stored when it was created – the same calculation as `amountDueForQr`, but never refused: options that no
   * longer apply are dropped (a night that became unsellable / sellable, a rate out of bounds), and a stay
   * already checked out (or not in house) owes its folio balance.
   */
  async amountDueNow(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    q: {
      checkoutAt?: Date | undefined;
      extraNightRateVnd?: number | undefined;
      lateFeeAsNight?: boolean | undefined;
    },
  ): Promise<number> {
    const row = await loadReservation(tx, id, ctx.actor);
    const primary = row.parent_reservation_id
      ? await loadReservation(tx, row.parent_reservation_id, ctx.actor)
      : row;
    if (!primary.folio_id) return 0;
    if (primary.status !== 'in_house') {
      return Math.max(0, (await this.s.folios.balance(tx, primary.folio_id)).balanceDueVnd);
    }
    const d = await this.departure(tx, ctx, primary, undefined, q.checkoutAt ?? ctx.now);
    const x = d.extraNight;
    const rate =
      x &&
      x.available &&
      q.extraNightRateVnd !== undefined &&
      q.extraNightRateVnd >= x.floorVnd &&
      q.extraNightRateVnd <= x.ceilingVnd
        ? q.extraNightRateVnd
        : undefined;
    return this.dueAtCheckout(tx, ctx, primary, d, rate, !!q.lateFeeAsNight);
  }

  /**
   * SEC BE-64 (BR-416-06): the read-only business checks of `lateFeeInsteadOfNight` BEFORE the approver's
   * password is tried – the same answers as B18 (409 / 422), nothing written. A body B18 would refuse for its
   * own fields (time format…) passes here and is refused by B18 itself.
   */
  async lateFeePrecheck(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    body: Record<string, unknown>,
  ): Promise<void> {
    // BUG-R2-149 (SEC BE-64): every check B18 makes before writing, in B18's order and with B18's answers – the
    // body (422), the state and the day (409), the night that cannot be sold (422) and the amount shown (409).
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
      }
    }
    const extraNightRate = this.extraNightInput(f, body);
    const lateFee = this.lateFeeInput(f, body);
    f.done();
    const row = await loadReservation(tx, id, ctx.actor);
    if (row.status !== 'in_house') throw this.s.stay.invalid(row);
    this.primaryFor(row);
    if (!row.folio_id) throw problem('NOT_FOUND');
    const d = await this.departure(tx, ctx, row, checkoutTime, checkoutAt);
    const nowWindow = this.postMidnight(ctx, d.rollover, d.stay.departureDate, ctx.now);
    if (d.stay.departureDate !== ctx.today && !nowWindow) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-out on the departure business day (early departure first – B16)',
      });
    }
    const unsellable = !!d.extraNight && !d.extraNight.available;
    if (unsellable && lateFee && lateFee.amountVnd !== lateChargeOf(d)) {
      throw problem('SURCHARGE_CHANGED', {
        extras: { surchargeVnd: lateChargeOf(d), tierPct: 100 },
      });
    }
    const g = new Fields({});
    if (!unsellable) g.add('lateFeeInsteadOfNight', 'NOT_ALLOWED');
    if (extraNightRate) g.add('extraNight', 'NOT_ALLOWED');
    g.done();
  }

  /**
   * ARC 16.2 R9 / `CheckoutSummary.minibarUncheckedRooms` (BUG-R2-136): the minibars of the stay with a chargeable
   * item and no `checkout` count – from the inventory port (`uncheckedRooms`, every room of the stay); a port
   * without it answers for the room of the departure only (the former check).
   */
  private async uncheckedMinibars(
    tx: Tx,
    row: ReservationRow,
    d: Departure,
  ): Promise<
    Array<{
      roomId: string;
      roomNo: string;
      reason?: 'never_counted' | 'stay_continued' | 'new_fill';
    }>
  > {
    const port = this.s.ports.minibar;
    // ARC 16.14: `reason` comes from the inventory port as it is (never_counted / stay_continued / new_fill).
    if (port.uncheckedRooms) return port.uncheckedRooms(tx, row.id);
    const st = await port.checkoutStatus(tx, row.id, d.rm.id);
    return st.required && !st.checked
      ? [{ roomId: d.rm.id, roomNo: d.rm.room_no, reason: 'never_counted' }]
      : [];
  }

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
    const d = await this.departure(tx, ctx, row, q.checkoutTime, q.checkoutAt);
    const lines = await this.s.folios.lines(tx, row.folio_id);
    const balance = await this.s.folios.balance(tx, row.folio_id);
    const pending = await this.pendingApprovals(tx, d.stay.ids);
    const unchecked = await this.uncheckedMinibars(tx, row, d);
    const old = await this.s.liveSurchargeLines(tx, row.folio_id, d.stay.ids, 'late_checkout');
    const newVnd = lateChargeOf(d);
    const blockers: Blocker[] = [];
    if (unchecked.length > 0) blockers.push('minibar_not_checked');
    if (pending > 0) blockers.push('pending_approvals');
    if (balance.balanceDueVnd > 0) blockers.push('balance_due');
    if (balance.unhandledCreditVnd > 0) blockers.push('credit_balance');
    const tz = ctx.tz;
    // BR-012 (0.3.7 D1): `room` / `from` / `to` label params are room names.
    const roomName = await roomNamesOf(tx, row.folio_id);
    // ARC 16.6 (d): the amount due includes the late charge of one night when the night cannot be sold.
    const amountDueAtCheckoutVnd = await this.dueAtCheckout(
      tx,
      ctx,
      row,
      d,
      d.extraNight?.defaultRateVnd,
      true,
    );
    return {
      serverTime: ctx.iso(ctx.now),
      amountDueAtCheckoutVnd,
      checkoutTime: d.time,
      standardCheckoutTime: d.quote.standard,
      lateCheckoutSurcharge: { tierPct: lateTierOf(d), amountVnd: newVnd },
      lines: lines.map((l: FolioLineRow) => folioLineDto(l, tz, { roomName })),
      totalVnd: balance.totalVnd,
      paidVnd: balance.paidVnd,
      balanceDueVnd: balance.balanceDueVnd,
      creditVnd: balance.rawCreditVnd,
      unhandledCreditVnd: balance.unhandledCreditVnd,
      ...(old.lines.length > 0
        ? {
            lateSurchargeRecalc: {
              oldVnd: old.grossVnd,
              newVnd,
              newTierPct: lateTierOf(d),
            },
          }
        : {}),
      pendingApprovals: pending,
      extraNightRequired: !!d.extraNight,
      ...(d.extraNight
        ? {
            extraNightDefaultRateVnd: d.extraNight.defaultRateVnd,
            extraNightAvailable: d.extraNight.available,
            ...(d.extraNight.available ? {} : { lateFeeAsNightVnd: d.extraNight.defaultRateVnd }),
          }
        : {}),
      ...(unchecked.length > 0 ? { minibarUncheckedRooms: unchecked } : {}),
      postMidnightWindow: d.postMidnight,
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
    opts: { approver?: LateFeeApprover | null } = {},
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
      }
    }
    const timeNote = f.text('checkoutTimeNote', 300, { min: 3 });
    const extraNightRate = this.extraNightInput(f, body);
    const lateFee = this.lateFeeInput(f, body);
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
    // BR-416-06 (ARC 16.6 (d)): OWN/MGR confirmed at the desk – checked by the controller before the unit of work.
    const approver = opts.approver ?? null;
    if (lateFee && !approver) {
      throw problem('REAUTH_FAILED', {
        errors: [{ field: 'lateFeeInsteadOfNight.secret', code: 'REAUTH_FAILED' }],
      });
    }

    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    if (row.status !== 'in_house') throw this.s.stay.invalid(row);
    this.primaryFor(row);
    await this.children(tx, row); // lock the children before reading the stay
    if (!row.folio_id) throw problem('NOT_FOUND');
    const folioId = row.folio_id;
    const d = await this.departure(tx, ctx, row, checkoutTime, checkoutAt);
    const nowWindow = this.postMidnight(ctx, d.rollover, d.stay.departureDate, ctx.now);
    if (d.stay.departureDate !== ctx.today && !nowWindow) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-out on the departure business day (early departure first – B16)',
      });
    }
    const late: LateCheckoutResult = d.quote.r;
    // BR-416-06 (BUG-R2-139): the night of the departure day is not sellable → no extra night, a late charge of
    // one night instead (`lateFeeInsteadOfNight`, OWN/MGR confirms at the desk); a sellable night is sold.
    const unsellable = !!d.extraNight && !d.extraNight.available;
    const decided = lateFee !== null && unsellable;
    const surcharge = decided ? lateChargeOf(d) : d.extraNight ? 0 : late.amountVnd;
    const old = await this.s.liveSurchargeLines(tx, folioId, d.stay.ids, 'late_checkout');
    // 409 SURCHARGE_CHANGED before the field checks (contract order): the amount the desk showed.
    if (decided && lateFee.amountVnd !== surcharge) {
      throw problem('SURCHARGE_CHANGED', { extras: { surchargeVnd: surcharge, tierPct: 100 } });
    }
    if (
      !decided &&
      applyLate &&
      surcharge > old.grossVnd &&
      expected !== undefined &&
      expected !== surcharge
    ) {
      throw problem('SURCHARGE_CHANGED', {
        extras: { surchargeVnd: surcharge, tierPct: late.tierPct },
      });
    }

    // ── field data (422) ──
    // E03-07: the typed departure vs the server clock (checkoutAt = an instant, else the business-day axis).
    let typed: { systemTime: LocalTime; noted: boolean };
    if (checkoutAt) {
      const tolerance = await this.s.param<number>(tx, ctx, 'manual_time_tolerance_minutes');
      const diff = checkoutAt.getTime() - ctx.now.getTime();
      if (diff > tolerance * 60_000) f.add('checkoutAt', 'TIME_AFTER_ACTION');
      typed = { systemTime: this.s.localTime(ctx), noted: -diff > tolerance * 60_000 };
      if (typed.noted && !timeNote) f.add('checkoutTimeNote', 'TIME_NOTE_REQUIRED');
    } else {
      typed = await this.s.checkTypedTime(tx, ctx, f, {
        field: 'checkoutTime',
        time: d.time,
        noteField: 'checkoutTimeNote',
        note: timeNote,
        rollover: d.rollover,
      });
    }
    if (lateFee && !unsellable) f.add('lateFeeInsteadOfNight', 'NOT_ALLOWED');
    if (lateFee && extraNightRate) f.add('extraNight', 'NOT_ALLOWED');
    if (d.extraNight && !extraNightRate && !lateFee) {
      f.add(unsellable ? 'lateFeeInsteadOfNight' : 'extraNight', 'LATE_CHECKOUT_AFTER_LIMIT');
    }
    if (!d.extraNight && extraNightRate) f.add('extraNight', 'NOT_ALLOWED');
    const raise = surcharge > old.grossVnd;
    if (raise && !applyLate && !decided) {
      f.add('applyLateSurcharge', 'SURCHARGE_DECISION_REQUIRED');
    }
    if (raise && applyLate && expected === undefined && !decided) {
      f.add('expectedSurchargeVnd', 'REQUIRED');
    }
    f.done();
    await this.s.occupancy.lockRooms(tx, [d.rm.id]);

    // ── E05-11: "check out – charge one more night" (BR-416 v0.3.4, DOM S3-9) ──
    if (d.extraNight && extraNightRate !== null) {
      const x = d.extraNight;
      if (extraNightRate < x.floorVnd || extraNightRate > x.ceilingVnd) {
        throw problem('RATE_OUT_OF_RANGE', {
          errors: [{ field: 'extraNight.rateVnd', code: 'RATE_OUT_OF_RANGE' }],
          extras: { min: x.floorVnd, max: x.ceilingVnd },
        });
      }
      if (!x.available) {
        throw await this.s.occupancy.unavailable(
          tx,
          { roomId: d.rm.id, from: x.date, to: addDays(x.date, 1), persons: this.s.counted(row) },
          { withNames: true },
        );
      }
      await this.addExtraNight(tx, ctx, row, d, x, extraNightRate);
    }

    // ── G-10: late surcharge at the ACTUAL departure time (one live charge, FOC carried – S3-11) ──
    let lateLineId: string | null = null;
    if (surcharge < old.grossVnd || (raise && (applyLate || decided))) {
      const posted = await this.s.replaceLateCharge(tx, ctx, {
        folioId,
        ids: d.stay.ids,
        booking: d.stay.last,
        serviceDate: d.stay.departureDate,
        time: d.time,
        tierPct: lateTierOf(d),
        amountVnd: surcharge,
        reason: decided
          ? `BR-416-06 late checkout ${d.time} instead of an unsellable night: ${lateFee.reason}`
          : d.extraNight
            ? `extra night on checkout ${d.time}`
            : `G-10 actual departure ${d.time}`,
        source: 'checkout',
        ...(decided ? { chargeCode: 'late_fee_as_night' } : {}),
      });
      lateLineId = posted.lineId;
    }
    if (decided && approver) {
      // FOC asked with it: approved in this transaction by the approver, within their BR-433 limit (ARC 16.6 (d)).
      if (lateFee.requestFoc && lateLineId) {
        const asked = await this.s.requestFoc(
          tx,
          ctx,
          row,
          folioId,
          { id: lateLineId, amountVnd: surcharge, category: 'late_checkout' },
          lateFee.requestFoc,
          // BUG-R2-153 (BR-416-07): decided by the APPROVER (their identity, role, limit, `auth_method = password`),
          // never self-applied by the caller – also when a manager confirms their own B18.
          { field: 'lateFeeInsteadOfNight.requestFoc', noSelfApply: true },
        );
        if (asked.status !== 'approved') {
          const decision = await this.s.approvals.approve(
            tx,
            { userId: approver.userId, roles: approver.roles },
            asked.id,
            {
              authMethod: 'password',
              note: lateFee.requestFoc.note,
              ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
            },
          );
          if ('escalatedTo' in decision) {
            throw problem('APPROVAL_LIMIT_EXCEEDED', {
              extras: { approver: decision.escalatedTo },
            });
          }
        }
      }
      await this.audit.recordMoney(tx, {
        action: 'reservation.late_fee_instead_of_night',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        after: {
          amountVnd: surcharge,
          checkoutTime: d.time,
          date: d.stay.departureDate,
          confirmedBy: approver.userId,
          // SEC BE-62: who did it is the audit actor; how it was confirmed.
          channel: approver.self ? 'self' : 'desk',
          authMethod: 'password',
          // BUG-R2-154 (SEC BE-62): the role the approver confirmed with.
          approverRole: approver.roles.includes('owner') ? 'owner' : 'manager',
          ...(lateFee.requestFoc ? { focVnd: lateFee.requestFoc.amountVnd } : {}),
        },
        reason: lateFee.reason,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
      // SEC BE-62: the approver learns their credentials were used at the desk.
      if (!approver.self) {
        await this.s.events.notify(
          tx,
          {
            kind: 'account_security_change',
            userIds: [approver.userId],
            refType: 'reservation',
            refId: row.id,
            refCode: row.code,
          },
          ctx.now,
        );
      }
    }

    // ── final payment in the same transaction (spec 5.4) – 0.3.7 (S4-47): capped at what the folio owes AFTER
    // the extra night / re-computed late charge (= CheckoutSummary.amountDueAtCheckoutVnd) ──
    if (finalPayment) {
      const owed = (await this.s.folios.balance(tx, folioId)).balanceDueVnd;
      if (Number.isSafeInteger(finalPayment.amountVnd) && finalPayment.amountVnd > owed) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'finalPayment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
          extras: { max: owed },
        });
      }
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

    // DOM S3-10: operational requests of the stay lost their purpose (cancelled `superseded`, audited).
    const kids = await this.children(tx, row);
    const all = [row.id, ...kids.map((k) => k.id)];
    for (const target of all) {
      await this.s.approvals.cancelSuperseded(tx, {
        targetType: 'reservation',
        targetId: target,
        types: SUPERSEDED_AT_CHECKOUT,
        reason: 'checked out (B18)',
        ...this.s.req(ctx),
      });
    }

    // ── blockers, in order (spec 5.5) ──
    // ARC 16.2 R9 (BUG-R2-136): every minibar of the stay (the old room before a B14 included).
    if ((await this.uncheckedMinibars(tx, row, d)).length > 0) throw problem('MINIBAR_NOT_CHECKED');
    const pending = await this.pendingApprovals(tx, all);
    if (pending > 0) throw problem('PENDING_APPROVALS', { extras: { pendingApprovals: pending } });
    // x-ota-prepaid-rule safety net (BE-B, re-verification 17/10): the OTA receipt matches the OTA-covered
    // lines before the balance decides B18.
    await this.s.folios.resyncOtaCollect(tx, folioId, row.id, {
      userId: ctx.actor.userId,
      reservationCode: row.code,
    });
    const balance = await this.s.folios.balance(tx, folioId);
    if (balance.balanceDueVnd > 0 && !debt) {
      throw problem('BALANCE_DUE', { extras: { balanceDueVnd: balance.balanceDueVnd } });
    }
    // E15-05 / DOM BE-14: only the overpayment NOT yet routed to a refund request.
    const unhandled = balance.unhandledCreditVnd;
    if (unhandled > 0) {
      if (!over) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'overpaymentHandling', code: 'OVERPAYMENT_HANDLING_REQUIRED' }],
          extras: { unhandledCreditVnd: unhandled, creditVnd: unhandled },
        });
      }
      if (over.mode === 'refund_request') {
        await this.s.approvals.submit(tx, ctx.actor, {
          type: 'refund',
          amountVnd: unhandled,
          reasonCode: 'overpayment',
          reasonNote: over.reason,
          targetType: 'reservation',
          targetId: row.id,
          targetCode: row.code,
          ...this.s.req(ctx),
        });
      } else {
        // DOM S3-4: the guest freely gives the excess up – other revenue, bill "left by the guest".
        await this.s.folios.postLines(
          tx,
          folioId,
          [
            {
              reservationId: row.id,
              category: 'deposit_forfeit',
              revenueGroup: 'other',
              chargeCode: 'overpayment_retained',
              description: 'overpayment_retained',
              quantity: 1,
              unitPriceVnd: unhandled,
              amountVnd: unhandled,
              serviceDate: d.stay.departureDate,
              source: 'checkout',
              reason: over.reason,
            },
          ],
          { userId: ctx.actor.userId, reservationCode: row.code, ...this.s.req(ctx) },
        );
      }
    }

    // ── state ──
    await tx.query(
      `UPDATE reservation SET status = 'checked_out', actual_checkout_at = $2, checkout_mode = $3,
              debt_due_date = $4, debt_reason = $5, updated_at = $2, version = version + 1
        WHERE id = ANY($1::uuid[])`,
      [all, ctx.now, debt ? 'debt' : 'desk', debt?.dueDate ?? null, debt?.reason ?? null],
    );
    // S4-11/32 (BE-C, T05): the last check-out of every guest of the stay (bookers + present members) – the
    // retention of a profile "from the document" counts from it (J25 also catches up; this is the exact time).
    const { rows: stayGuests } = await tx.query<{ id: string }>(
      `SELECT booker_guest_id AS id FROM reservation
        WHERE id = ANY($1::uuid[]) AND booker_guest_id IS NOT NULL
       UNION
       SELECT guest_id FROM reservation_guest
        WHERE reservation_id = ANY($1::uuid[]) AND guest_id IS NOT NULL AND removed_at IS NULL`,
      [all],
    );
    await this.profiles.touchLastStay(
      tx,
      stayGuests.map((g) => g.id),
      ctx.now,
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
    if (typed.noted) {
      // E03-07: typed time well before the action – both times + the note in the change log and the audit.
      await recordChange(
        tx,
        row.id,
        'checkout_time',
        typed.systemTime,
        d.time,
        ctx.now,
        timeNote ?? null,
      );
    }
    const settled = await this.s.folios.settle(tx, folioId, {
      userId: ctx.actor.userId,
      reservationCode: row.code,
      ...this.s.req(ctx),
    });
    // BR-012 (5), 0.3.7 D1: the bill keeps the room names it had when settled (folio.settled_room_names).
    await snapshotSettledRoomNames(tx, folioId);
    // SM-11 / DOM S3-3 (FB-R2-DOM-BE-15): checked out + folio owes nothing → commissions may be earned now.
    await this.s.folios.tryEarnCommissions(
      tx,
      { reservationId: row.id, reservationCode: row.code, status: 'checked_out' },
      ctx.requestId,
    );
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
        checkoutTime: d.time,
        systemTime: typed.systemTime,
        lateSurchargeVnd: surcharge,
        checkoutMode: debt ? 'debt' : 'desk',
        ...(d.extraNight ? { extraNight: d.extraNight.date } : {}),
        ...(d.postMidnight ? { postMidnightWindow: true } : {}),
      },
      ...(debt || (typed.noted && timeNote)
        ? {
            reason: [debt?.reason, typed.noted ? timeNote : null].filter(Boolean).join(' | '),
          }
        : {}),
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
    await this.s.stay.emit(tx, 'transitioned', after, 'in_house', 'B18', d.rm.id);
    return { row: after, billNo: settled.billNo, createdTaskIds };
  }

  /**
   * E05-11 (BR-416 v0.3.4): the night of the departure day is sold at `rateVnd` – direct/agent: the booking is
   * extended (re-tiered like B13, the typed price kept); OTA / external contract: a direct child booking (BR-422).
   */
  private async addExtraNight(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    d: Departure,
    x: ExtraNight,
    rateVnd: number,
  ): Promise<void> {
    const to = addDays(x.date, 1);
    if (row.channel_group === 'ota' || row.external_contract) {
      await this.s.stay.createChildStay(tx, ctx, row, {
        roomId: d.rm.id,
        from: x.date,
        to,
        nights: [{ date: x.date, amountVnd: rateVnd, calendarVnd: x.calendarVnd }],
        rateSource: 'extra_night_early_late',
        transition: 'B13',
        actualCheckinAt: row.actual_checkin_at ?? ctx.now,
        extraNight: true,
      });
    } else {
      const seg = await this.s.lastSegment(tx, row.id);
      await this.s.occupancy.update(
        tx,
        { segmentId: seg.id },
        { roomId: d.rm.id, from: seg.from_date, to },
        ctx.now,
        { withNames: true, persons: this.s.counted(row), excludeSegmentIds: [seg.id] },
      );
      await tx.query('UPDATE reservation_segment SET to_date = $2, updated_at = $3 WHERE id = $1', [
        seg.id,
        to,
        ctx.now,
      ]);
      const kept = await this.s.stay.pricedNights(tx, row);
      const r = this.s.stay.retierStay(ctx, row, kept, [
        // BR-107 v0.3.8 (S4-38, BR-416-04): the typed rate is the night's calendar price – tiered like B13.
        { date: x.date, calendarVnd: rateVnd, amountVnd: rateVnd, manual: true },
      ]);
      await this.s.stay.writeRepricedNights(tx, ctx, row, {
        segmentId: seg.id,
        roomId: d.rm.id,
        pct: r.pct,
        kept: r.kept,
        added: r.added,
        rateSource: 'extra_night_early_late',
        extraNight: true,
      });
      await tx.query(
        `UPDATE reservation SET departure_date = $2, updated_at = $3, version = version + 1 WHERE id = $1`,
        [row.id, to, ctx.now],
      );
      await recordChange(
        tx,
        row.id,
        'departure_date',
        row.departure_date,
        to,
        ctx.now,
        'B18 extra night',
      );
      const fresh = await loadReservation(tx, row.id, ctx.actor);
      await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, fresh), {
        userId: ctx.actor.userId,
        ...this.s.req(ctx),
      });
    }
    await this.audit.recordMoney(tx, {
      action: 'reservation.extra_night_on_checkout',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { departureDate: d.stay.departureDate },
      after: {
        departureDate: to,
        nightlyRates: [{ date: x.date, amountVnd: rateVnd }],
        checkoutTime: d.time,
      },
      reason: 'BR-416',
      ...this.s.req(ctx),
    });
    await outboxAvailability(
      tx,
      [{ roomId: d.rm.id, from: x.date, to }],
      'reservation.extra_night_on_checkout',
    );
    await this.s.ports.registration.onDepartureChanged(tx, row.id, to);
  }

  /** Σ approved (alive) FOC / discounts on a stay key of the folio (early check-in / late check-out – BR-412). */
  private async approvedOn(
    tx: Tx,
    folioId: string,
    category: 'late_checkout' | 'early_checkin',
  ): Promise<number> {
    return (await this.s.folios.reductionRequests(tx, folioId, { lock: false }))
      .filter(
        (r) =>
          r.category === category &&
          r.status === 'approved' &&
          (r.focState === 'applied' || r.focState === 'dormant'),
      )
      .reduce((a, r) => a + r.amountVnd, 0);
  }

  /**
   * S4-47: change of the folio if B18 adds the night of the departure day at `rateVnd` (E05-11), read-only –
   * the same arithmetic as `addExtraNight`: a direct/agent stay is re-tiered (BR-107, D-8) with the typed night
   * and the BR-110 fee of that night; an OTA / manual long stay gets a direct child night (price + direct fee).
   */
  private async extraNightDelta(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    d: Departure,
    rateVnd: number,
  ): Promise<number> {
    // BUG-R2-125: the fee of the added night from the SAME base the write uses (protected base, BR-429 (b2)).
    if (row.channel_group === 'ota' || row.external_contract) {
      return rateVnd + (await this.s.stay.addedNightFee(tx, ctx, row, 'last', d.rm.base_occupancy));
    }
    const kept = await this.s.stay.pricedNights(tx, row);
    const x = d.extraNight as ExtraNight;
    const r = this.s.stay.retierStay(ctx, row, kept, [
      { date: x.date, calendarVnd: rateVnd, amountVnd: rateVnd, manual: true },
    ]);
    const before = kept.reduce((a, n) => a + n.amountVnd, 0);
    const after = [...r.kept, ...r.added].reduce((a, n) => a + n.amountVnd, 0);
    const fees = await this.s.stay.nightFees(tx, row);
    const fee = await this.s.stay.addedNightFee(tx, ctx, row, 'last', d.rm.base_occupancy);
    // S4-38 (S438-FOC-02, BR-416-05): the approved FOC / discounts follow the re-tiered nights (min(approved, new
    // line) – BR-434) – BE-B's allocation on the nights as B18 writes them, so the due shown = what B18 leaves.
    let focDelta = 0;
    if (row.folio_id) {
      const feeOf = new Map(fees.map((n) => [n.date, n.feeVnd]));
      const nights = [...r.kept, ...r.added].map((n) => ({
        date: n.date,
        roomVnd: n.amountVnd,
        extraPersonVnd: feeOf.get(n.date) ?? fee,
      }));
      const foc = await this.s.folios.previewStayReductions(tx, row.folio_id, row.id, nights);
      focDelta = foc.newAppliedVnd - foc.oldAppliedVnd;
    }
    return after - before + fee - focDelta;
  }

  /** `extraNight {rateVnd}` (E05-11). */
  private extraNightInput(f: Fields, body: Record<string, unknown>): number | null {
    const v = body.extraNight;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('extraNight', 'VALIDATION_FAILED');
      return null;
    }
    const sub = new Fields(v as Record<string, unknown>);
    const rate = sub.money('rateVnd', { required: true, positive: true });
    for (const e of sub.errors) f.add(`extraNight.${e.field}`, e.code);
    return rate ?? null;
  }

  /**
   * BR-416-06 (BUG-R2-139, ARC 16.6 (d)): `lateFeeInsteadOfNight { amountVnd, reason, approverUsername?, authMethod,
   * secret, requestFoc? }` – the credentials are checked by the controller (here: the money part only).
   */
  private lateFeeInput(
    f: Fields,
    body: Record<string, unknown>,
  ): {
    amountVnd: number;
    reason: string;
    requestFoc: { amountVnd: number; reasonCode: string; note: string | null } | null;
  } | null {
    const v = body.lateFeeInsteadOfNight;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('lateFeeInsteadOfNight', 'VALIDATION_FAILED');
      return null;
    }
    const field = 'lateFeeInsteadOfNight';
    const sub = new Fields(v as Record<string, unknown>);
    const amount = sub.money('amountVnd', { required: true, positive: true });
    const reason = sub.text('reason', 500, { required: true, min: 3 });
    for (const e of sub.errors) f.add(`${field}.${e.field}`, e.code);
    let requestFoc: { amountVnd: number; reasonCode: string; note: string | null } | null = null;
    const rf = (v as Record<string, unknown>).requestFoc;
    if (rf !== undefined && rf !== null) {
      if (typeof rf !== 'object' || Array.isArray(rf)) {
        f.add(`${field}.requestFoc`, 'VALIDATION_FAILED');
      } else {
        const o = rf as Record<string, unknown>;
        // The password of `lateFeeInsteadOfNight` is the confirmation – none here.
        for (const k of ['authMethod', 'secret']) {
          if (o[k] !== undefined) f.add(`${field}.requestFoc.${k}`, 'NOT_ALLOWED');
        }
        // "Giảm giá đặc biệt" is for room lines only (folio FOC rule) – a late charge takes a FOC.
        if (o.kind !== undefined && o.kind !== 'foc')
          f.add(`${field}.requestFoc.kind`, 'NOT_IN_LIST');
        const fs = new Fields(o);
        const focAmount = fs.money('amountVnd', { required: true, positive: true });
        const reasonCode = fs.text('reasonCode', 40, { required: true });
        const note = fs.text('note', 500);
        for (const e of fs.errors) f.add(`${field}.requestFoc.${e.field}`, e.code);
        if (focAmount !== undefined && reasonCode) {
          requestFoc = { amountVnd: focAmount, reasonCode, note: note ?? null };
        }
      }
    }
    return amount !== undefined && reason ? { amountVnd: amount, reason, requestFoc } : null;
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
