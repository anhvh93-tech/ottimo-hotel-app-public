/**
 * Check-in – spec EP03-05 1 (US-025, US-026, US-027; SM-01 B9/B9a/B17; BR-402, BR-411, BR-413, BR-417, BR-613).
 *
 * previewCheckIn: conditions + warnings + early surcharge / prior night, read-only.
 * checkIn (B9): order of checks (spec 1.6): trusted device + role (guard) → If-Match → `confirmed` and business
 * date = arrival (or B9a window) → RESERVATION_UNASSIGNED → BR-402/BR-613 conditions (409
 * CHECKIN_CONDITIONS_NOT_MET + unmet[]) → field data (422). R2 never generates/stores a door code (SEC D2,
 * US-128 R3): only `cardsIssued` and the "handed over" tick are recorded.
 * undoCheckIn (B17, MGR+): same business day, no live folio line posted since check-in.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import {
  type LocalDate,
  type LocalTime,
  addDays,
  atLocal,
  businessDate,
} from '../../../shared/time';
import type { ApprovalRow } from '../../approvals/public/approval.service';
import { AuditService } from '../../audit/public/audit.service';
import { PaymentService, type PaymentCreateInput } from '../../payments/public/payment.service';
import {
  type BookingContext,
  FDL_PLUS,
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
import type { RoomStatusCode } from '../public/room-status.service';
import {
  type EarlyCheckinResult,
  type EarlyTier,
  earlyCheckinSurcharge,
  minutesOf,
} from '../public/stay-rules';
import { StaySupport } from './stay-support';

type ConditionCode =
  | 'not_unassigned'
  | 'capacity_within_max'
  | 'room_ready'
  | 'balance_paid'
  | 'main_guest_document'
  | 'document_check_block';

interface Condition {
  code: ConditionCode;
  met: boolean;
  detail?: string;
  overridableBy?: string[];
}

interface Evaluation {
  row: ReservationRow;
  room: RoomInfo | null;
  roomStatus: RoomStatusCode;
  checkinTime: LocalTime;
  standard: LocalTime;
  rollover: LocalTime;
  priorNightWindow: boolean;
  early: EarlyCheckinResult;
  priorNight: {
    date: LocalDate;
    available: boolean;
    defaultRateVnd: number;
    /** direct calendar price of the night (BR-421) – the base the B9a night is re-tiered from */
    calendarVnd: number;
    floorVnd: number;
    ceilingVnd: number;
    createsChildReservation: boolean;
    /** ARC 16.18: the room bought now – anchor of a B9a price the desk types (null = the origin room). */
    anchorRoomId: string | null;
  } | null;
  conditions: Condition[];
  warnings: Array<{ code: string }>;
  registrationDeadlinePreview: Date | null;
  /** Folio now: what is still due (contract balanceDueVnd) and the money paid above it (VietQR before B9). */
  balanceDueVnd: number;
  creditVnd: number;
  /** BR-402 v0.3.6: Σ "khi duyệt sẽ áp" of the pending FOC on incidental charges already on the folio. */
  pendingIncidentalFocVnd: number;
  /** 0.3.7: due to reach balance_paid if checked in at `checkinTime` (surcharge + B9a night included). */
  amountDueAtCheckinVnd: number;
}

/** Room money (BR-402 (2) "tiền phòng" – always collected in full, pending discounts included). */
const ROOM_MONEY: ReadonlySet<string> = new Set(['room', 'room_change_difference']);

const FDL_UP = ['front_desk_lead', 'manager', 'owner'];

@Injectable()
export class CheckinService {
  constructor(
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PaymentService) private readonly payments: PaymentService,
  ) {}

  // ───────────────────────── preview ─────────────────────────

  async preview(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    checkinTime: LocalTime | undefined,
  ): Promise<Record<string, unknown>> {
    const row = await loadReservation(tx, id, ctx.actor);
    if (row.status !== 'confirmed') throw this.s.stay.invalid(row);
    const e = await this.evaluate(tx, ctx, row, checkinTime, 'preview');
    return {
      checkinTime: e.checkinTime,
      standardCheckinTime: e.standard,
      roomStatus: e.roomStatus,
      conditions: e.conditions,
      warnings: e.warnings,
      ...(e.priorNight ? { priorNight: e.priorNight } : {}),
      earlyCheckinSurcharge: {
        tierPct: e.early.tierPct,
        baseNightVnd: e.early.baseNightVnd,
        amountVnd: e.early.amountVnd,
        addsPreviousNight: e.early.addsPreviousNight,
        ruleRef: e.early.ruleRef,
      },
      ...(e.registrationDeadlinePreview
        ? { registrationDeadlinePreview: ctx.iso(e.registrationDeadlinePreview) }
        : {}),
      // 0.3.7 (BUG-R2-038, BR-402 v0.3.6): due now, and due to reach balance_paid at this time.
      balanceDueVnd: e.balanceDueVnd,
      amountDueAtCheckinVnd: e.amountDueAtCheckinVnd,
    };
  }

  /**
   * 0.3.7 `createVietQr purpose = check_in` (S4-10 – BE-B's cap through ReservationSalesPort.amountDueFor):
   * `amountDueAtCheckinVnd` of previewCheckIn at `checkinTime` (absent = the server clock, what B9 would charge
   * now), the B9a night at `priorNightRateVnd` when `addPriorNight`. Same gates as B9: `confirmed`, the arrival
   * business day or the B9a window (else 409 INVALID_TRANSITION); the rate within floor–ceiling (422).
   */
  async amountDueForQr(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    q: {
      checkinTime?: LocalTime | undefined;
      addPriorNight?: boolean | undefined;
      priorNightRateVnd?: number | undefined;
    },
  ): Promise<number> {
    const row = await loadReservation(tx, id, ctx.actor);
    if (row.status !== 'confirmed') throw this.s.stay.invalid(row);
    const e = await this.evaluate(tx, ctx, row, q.checkinTime, 'write');
    if (ctx.today !== row.arrival_date && !e.priorNightWindow) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-in QR on the arrival business day (or the B9a window)',
      });
    }
    if (!e.priorNight || !e.priorNight.available || !q.addPriorNight) {
      // BUG-R2-127: no B9a night to sell (none, or the room is taken that night) → the option is refused.
      if (q.addPriorNight || q.priorNightRateVnd !== undefined) {
        throw problem('VALIDATION_FAILED', {
          errors: [
            {
              field: q.addPriorNight ? 'addPriorNight' : 'priorNightRateVnd',
              code: 'NOT_ALLOWED',
            },
          ],
        });
      }
      return e.amountDueAtCheckinVnd;
    }
    const rate = q.priorNightRateVnd ?? e.priorNight.defaultRateVnd;
    if (rate < e.priorNight.floorVnd || rate > e.priorNight.ceilingVnd) {
      throw problem('RATE_OUT_OF_RANGE', {
        errors: [{ field: 'priorNightRateVnd', code: 'RATE_OUT_OF_RANGE' }],
        extras: { min: e.priorNight.floorVnd, max: e.priorNight.ceilingVnd },
      });
    }
    if (rate === e.priorNight.defaultRateVnd) return e.amountDueAtCheckinVnd;
    // S438-REGR-01: the whole amount again at the typed rate – clamped at 0 once, never "clamped then shifted".
    return (await this.evaluate(tx, ctx, row, q.checkinTime, 'write', rate)).amountDueAtCheckinVnd;
  }

  /**
   * ARC 16.6 (f) D7 (`confirmPaymentReceived`): what a `check_in` VietQR may take NOW, from the context stored
   * when it was created – `amountDueForQr`'s calculation, never refused: a B9a night no longer free (or a rate out
   * of bounds) is dropped, a booking past check-in (or not confirmed) owes its folio balance.
   */
  async amountDueNow(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    q: {
      checkinTime?: LocalTime | undefined;
      addPriorNight?: boolean | undefined;
      priorNightRateVnd?: number | undefined;
    },
  ): Promise<number> {
    const row = await loadReservation(tx, id, ctx.actor);
    if (!row.folio_id) return 0;
    if (row.status !== 'confirmed') {
      return Math.max(0, (await this.s.folios.balance(tx, row.folio_id)).balanceDueVnd);
    }
    const e = await this.evaluate(tx, ctx, row, q.checkinTime, 'write');
    const p = e.priorNight;
    const rate = q.priorNightRateVnd;
    if (
      q.addPriorNight &&
      p &&
      p.available &&
      rate !== undefined &&
      rate !== p.defaultRateVnd &&
      rate >= p.floorVnd &&
      rate <= p.ceilingVnd
    ) {
      return (await this.evaluate(tx, ctx, row, q.checkinTime, 'write', rate))
        .amountDueAtCheckinVnd;
    }
    return e.amountDueAtCheckinVnd;
  }

  private async evaluate(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    requestedTime: LocalTime | undefined,
    mode: 'preview' | 'write',
    priorRateVnd?: number,
  ): Promise<Evaluation> {
    const seg = await this.s.segmentOn(tx, row.id, row.arrival_date);
    const room = seg.room_id ? await this.s.stay.room(tx, seg.room_id) : null;
    const roomStatus: RoomStatusCode = room
      ? await this.s.roomStatus.of(tx, room.id, ctx.today)
      : 'VC';
    const standard = ctx.params.checkinTime;
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    // B9a (BR-417, BR-010): business date = arrival − 1 while the calendar date is already the arrival day.
    const priorNightWindow =
      ctx.today === addDays(row.arrival_date, -1) && this.s.calendarDate(ctx) === row.arrival_date;
    // FB-R2-ARC-BE-S3-07: in the B9a window the check-in time is ALWAYS the server clock (a typed 14:00 must
    // not turn an arrival at 04:40 into a plain B9). Otherwise: the preview shows the form default (standard
    // time, BR-414); a check-in without a typed time uses the server clock (never a silent "standard").
    const checkinTime = priorNightWindow
      ? this.s.localTime(ctx)
      : (requestedTime ?? (mode === 'preview' ? standard : this.s.localTime(ctx)));

    let early: EarlyCheckinResult = {
      tierPct: 0,
      baseNightVnd: 0,
      amountVnd: 0,
      addsPreviousNight: false,
      ruleRef: 'BR-411',
    };
    // BUG-R2-052: on the arrival business day a clock time before the rollover (00:00–05:59) is AFTER
    // midnight – a late arrival (US-025 AC6, BR-010), never "before 06:00 → prior night" (that is B9a only).
    const afterMidnight =
      !priorNightWindow &&
      ctx.today === row.arrival_date &&
      minutesOf(checkinTime) < minutesOf(rollover);
    if (room && !afterMidnight) {
      const tiers = await this.s.param<EarlyTier[]>(tx, ctx, 'early_checkin_tiers');
      const base = await this.s.surchargeBase(tx, ctx, row, 'first', room.id);
      const longStay =
        row.stay_type === 'long'
          ? { vacantPreviousNight: await this.vacantPreviousNight(tx, room.id, row) }
          : null;
      early = earlyCheckinSurcharge({
        checkinTime,
        standardCheckinTime: standard,
        rollover,
        tiers,
        baseNightVnd: base,
        unit: ctx.params.feeUnit,
        longStay,
      });
    }

    let priorNight: Evaluation['priorNight'] = null;
    if (room && early.addsPreviousNight) {
      const date = addDays(row.arrival_date, -1);
      // S438-DOM-01 (BR-417 (2), BR-421 v0.3.4): the default of the B9a night is the direct calendar of THAT night
      // (a Saturday is a Saturday), never the first night of the booking; a long stay keeps its nightly basis.
      // CI 72fa486 / BR-411-07, BUG-R2-134 (BR-417-07): an agreed price typed in this room is suggested; after an
      // OTTIMO move min(what the guest bought, this room's calendar); always within BR-105.
      const nc = await this.s.addedNightContext(tx, ctx, row, 'first', room.id);
      const r = await this.s.addedNightRate(tx, ctx, nc, date);
      const direct = { rateVnd: r.calendarVnd, floorVnd: r.floorVnd, ceilingVnd: r.ceilingVnd };
      const own = row.stay_type === 'long' ? early.baseNightVnd : r.rateVnd;
      priorNight = {
        date,
        available:
          priorNightWindow && (await this.s.occupancy.isFree(tx, room.id, date, row.arrival_date)),
        defaultRateVnd: own,
        calendarVnd: direct.rateVnd,
        floorVnd: direct.floorVnd,
        ceilingVnd: direct.ceilingVnd,
        createsChildReservation: row.channel_group === 'ota' || row.external_contract,
        anchorRoomId: nc.anchorRoomId,
      };
    }

    // 0.3.7 (BUG-R2-038, BR-402 v0.3.6 – M4): "đã thu đủ" is judged AFTER the early surcharge / B9a night and
    // the payment of the check-in (`checkIn.payment`); the pending FOC asked on incidental charges is not due to
    // check in (min(asked, line) – BE-B's allocation); the room money (B9a night included) always is.
    const balance = row.folio_id ? await this.s.folios.balance(tx, row.folio_id) : null;
    const balanceDueVnd = balance?.balanceDueVnd ?? 0;
    const creditVnd = balance?.rawCreditVnd ?? 0;
    const pendingIncidentalFocVnd = row.folio_id
      ? await this.pendingIncidentalFoc(tx, row.folio_id)
      : 0;
    // BR-402 v0.3.8 (DOM-S4-05): an OTA-prepaid booking owes the ROOM money collected at the desk before check-in
    // (`room_change_difference`, the B9a night of its direct child booking) – its incidental charges (early
    // check-in, extra person, minibar…) wait for the check-out (BR-307 "Đã thu qua OTA" covers only the OTA room).
    const otaPrepaid = row.payment_model === 'ota_prepaid';
    const notYetDue = otaPrepaid
      ? row.folio_id
        ? await this.incidentalNet(tx, row.folio_id)
        : 0
      : pendingIncidentalFocVnd;
    // S4-38 (S438-PAY-01/-02, REGR-01; BR-417-04…06): the B9a night counts as B9a WRITES it – the stay re-tiered
    // (BR-107 on the typed calendar price), the BR-110 fee of the added night – and the amount is clamped at 0 only
    // once everything is in (a credit on the folio absorbs a typed rate above the default).
    // BUG-R2-127 (BR-417 (1)/(5)): a night before that is not free cannot be sold – nothing to collect for it.
    const priorDeltaVnd =
      priorNight && priorNight.available && room
        ? await this.priorNightDelta(
            tx,
            ctx,
            row,
            room,
            priorNight.date,
            priorRateVnd ?? priorNight.defaultRateVnd,
            otaPrepaid,
          )
        : 0;
    const toPost = (otaPrepaid ? 0 : Math.max(0, early.amountVnd)) + priorDeltaVnd;
    const amountDueAtCheckinVnd = Math.max(0, balanceDueVnd - creditVnd + toPost - notYetDue);
    const balancePaid = amountDueAtCheckinVnd === 0;
    const docs = await this.s.ports.registration.checkinDocumentStatus(tx, row.id);
    const capacityOk =
      row.capacity_conflict_at === null && (!room || this.s.counted(row) <= room.max_occupancy);
    const roomReady = !!room && (roomStatus === 'VI' || roomStatus === 'VC');
    const conditions: Condition[] = [
      { code: 'not_unassigned', met: row.conflict_state !== 'open' },
      { code: 'capacity_within_max', met: capacityOk },
      {
        code: 'room_ready',
        met: roomReady,
        ...(roomReady ? {} : { detail: roomStatus }),
        ...(!roomReady && roomStatus !== 'OOO' ? { overridableBy: FDL_UP } : {}),
      },
      {
        code: 'balance_paid',
        met: balancePaid,
        ...(balancePaid ? {} : { detail: String(amountDueAtCheckinVnd) }),
      },
      { code: 'main_guest_document', met: docs.mainGuestDocument },
      {
        code: 'document_check_block',
        met: !docs.documentCheckBlock,
        ...(docs.documentCheckBlock ? { overridableBy: FDL_UP } : {}),
      },
    ];
    const warnings: Array<{ code: string }> = [];
    const kits = await this.kitOpen(tx, row.id);
    if (kits > 0) warnings.push({ code: 'extra_guest_kit_not_ready' });
    if (docs.visaExpiresBeforeDeparture) warnings.push({ code: 'visa_expires_before_departure' });
    if (docs.passportExpiresDuringStay) warnings.push({ code: 'passport_expires_during_stay' });
    if (docs.pendingOnlineCheckin) warnings.push({ code: 'pending_online_checkin' });
    return {
      row,
      room,
      roomStatus,
      checkinTime,
      standard,
      rollover,
      priorNightWindow,
      early,
      priorNight,
      conditions,
      warnings,
      registrationDeadlinePreview: await this.s.ports.registration.deadlinePreview(
        tx,
        row.id,
        ctx.now,
      ),
      balanceDueVnd,
      creditVnd,
      pendingIncidentalFocVnd,
      amountDueAtCheckinVnd,
    };
  }

  /**
   * What the B9a night adds to the folio, computed like `addPriorNight` writes it (S4-38): OTA / manual long stay
   * → a direct child night at `rateVnd` (+ its BR-110 fee unless OTA-prepaid, where the fee is incidental, due at
   * check-out); direct/agent → the stay re-tiered with the night typed at `rateVnd` as its calendar price (BR-107)
   * plus the fee of the added night (the party's per-night fee) – the same function as B18's extra night.
   */
  private async priorNightDelta(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    room: { base_occupancy: number },
    date: LocalDate,
    rateVnd: number,
    otaPrepaid: boolean,
  ): Promise<number> {
    // BUG-R2-125: the fee of the added night from the SAME base the write uses (protected base, BR-429 (b2)).
    if (row.channel_group === 'ota' || row.external_contract) {
      const fee = otaPrepaid
        ? 0
        : await this.s.stay.addedNightFee(tx, ctx, row, 'first', room.base_occupancy);
      return rateVnd + fee;
    }
    const kept = await this.s.stay.pricedNights(tx, row);
    const r = this.s.stay.retierStay(ctx, row, kept, [
      { date, calendarVnd: rateVnd, amountVnd: rateVnd, manual: true },
    ]);
    const before = kept.reduce((a, n) => a + n.amountVnd, 0);
    const after = [...r.kept, ...r.added].reduce((a, n) => a + n.amountVnd, 0);
    const fees = await this.s.stay.nightFees(tx, row);
    const fee = await this.s.stay.addedNightFee(tx, ctx, row, 'first', room.base_occupancy);
    // Approved FOC / discounts follow the re-tiered nights (BR-434 – BE-B's allocation), as at B18 (S438-FOC-02).
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

  /**
   * BR-402 v0.3.6: the pending FOC / discount requests on INCIDENTAL charges of the folio (early check-in,
   * extra person, minibar… – not room money), each counted at what it WOULD apply now (min(asked, line − the
   * approved ones before it): FolioService.focViews – BE-B's S4-23 allocation, never computed here).
   */
  private async pendingIncidentalFoc(tx: Tx, folioId: string): Promise<number> {
    const pending = (await this.s.folios.reductionRequests(tx, folioId, { lock: false })).filter(
      (r) => (r.status === 'pending' || r.status === 'escalated') && !ROOM_MONEY.has(r.category),
    );
    if (pending.length === 0) return 0;
    const views = await this.s.folios.focViews(
      tx,
      pending.map((r) => ({ id: r.id, folio_line_id: r.folioLineId })),
    );
    return pending.reduce((a, r) => a + (views.get(r.id)?.effectiveAmountVnd ?? 0), 0);
  }

  /**
   * BR-402 v0.3.8 (DOM-S4-05): what the folio carries in INCIDENTAL charges (every category but room money –
   * `room`, `room_change_difference`), net of their FOC / discounts / reversals – for an OTA-prepaid booking they
   * are due at the check-out, not at the check-in.
   */
  private async incidentalNet(tx: Tx, folioId: string): Promise<number> {
    const lines = (await this.s.folios.lines(tx, folioId)).filter((l) => l.line_state === 'posted');
    const byId = new Map(lines.map((l) => [l.id, l]));
    // BUG-R2-131: a reversal takes the category of what it reverses, a FOC / discount the category of the line
    // it reduces – recursively (the reversal of a FOC on a room-change difference is room money).
    const categoryOf = (l: (typeof lines)[number], depth = 0): string => {
      if (depth > 8) return l.category;
      const target = l.reversal_of_id
        ? byId.get(l.reversal_of_id)
        : (l.category === 'foc' || l.category === 'discount') && l.related_line_id
          ? byId.get(l.related_line_id)
          : undefined;
      return target ? categoryOf(target, depth + 1) : l.category;
    };
    return Math.max(
      0,
      lines.reduce((a, l) => (ROOM_MONEY.has(categoryOf(l)) ? a : a + l.amount_vnd), 0),
    );
  }

  /** US-027 / BR-413: no in-house or departed booking leaving this room on the arrival day. */
  private async vacantPreviousNight(tx: Tx, roomId: string, row: ReservationRow): Promise<boolean> {
    const { rows } = await tx.query(
      `SELECT 1 FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
        WHERE s.room_id = $1 AND s.to_date = $2 AND r.id <> $3 AND r.status IN ('in_house', 'checked_out')
        LIMIT 1`,
      [roomId, row.arrival_date, row.id],
    );
    return rows.length === 0;
  }

  private async kitOpen(tx: Tx, reservationId: string): Promise<number> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM hk_task WHERE reservation_id = $1
          AND type IN ('extra_guest_kit_prepare', 'extra_guest_kit_transfer') AND status IN ('open', 'in_progress')`,
      [reservationId],
    );
    return rows[0]?.n ?? 0;
  }

  // ───────────────────────── B9 / B9a ─────────────────────────

  async checkIn(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<{ row: ReservationRow } | { approval: ApprovalRow }> {
    const f = new Fields(body);
    const checkinTime = f.time('checkinTime');
    const timeNote = f.text('checkinTimeNote', 300, { min: 3 });
    const applyEarly = f.bool('applyEarlySurcharge') ?? false;
    const expected = f.money('expectedSurchargeVnd', { required: false, positive: false });
    const cardsIssued = f.int('cardsIssued', { required: true, min: 0, max: 2 });
    if (body.houseRulesSent !== true) f.add('houseRulesSent', 'REQUIRED');
    const doorHandedOver = f.bool('doorAccessHandedOver') ?? false;
    const addPriorNight = f.bool('addPriorNight') ?? false;
    const priorRate = f.money('priorNightRateVnd', { required: false, positive: true });
    const roomOverride = this.object(f, body, 'roomNotReadyOverride');
    const roomOverrideReason =
      roomOverride && typeof roomOverride.reason === 'string' ? roomOverride.reason.trim() : null;
    const roomApprovalId =
      roomOverride && typeof roomOverride.approvalRequestId === 'string'
        ? roomOverride.approvalRequestId
        : null;
    const docOverride = this.object(f, body, 'documentBlockOverride');
    const docOverrideReason =
      docOverride && typeof docOverride.reason === 'string' ? docOverride.reason.trim() : null;
    const foc = this.focInput(f, body, 'requestFocForSurcharge');
    // 0.3.7 (BUG-R2-038): the payment taken at the desk in the same transaction (`type = charge` only).
    const payment = this.paymentInput(f, body);
    if (payment && payment.type !== 'charge') f.add('payment.type', 'NOT_IN_LIST');

    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    if (row.status !== 'confirmed') throw this.s.stay.invalid(row);
    const e = await this.evaluate(tx, ctx, row, checkinTime, 'write');
    if (ctx.today !== row.arrival_date && !e.priorNightWindow) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-in only on the arrival business day (or B9a with addPriorNight)',
      });
    }
    // FB-R2-ARC-BE-S3-07 (0.3.6 bổ sung 2): in the B9a window the guest either takes the prior night or waits
    // for the business-day rollover (a plain B9 from then on).
    if (e.priorNightWindow && !addPriorNight) {
      throw problem('INVALID_TRANSITION', {
        extras: {
          currentState: row.status,
          availableFrom: ctx.iso(atLocal(row.arrival_date, e.rollover, ctx.tz)),
        },
        detail: 'before the business-day rollover the check-in adds the prior night (B9a)',
      });
    }
    if (row.conflict_state === 'open') throw problem('RESERVATION_UNASSIGNED');
    const room = e.room;
    if (!room) throw problem('RESERVATION_UNASSIGNED');

    // ── BR-402 / BR-613 conditions ──
    const fdlPlus = hasAny(ctx.actor.roles, FDL_PLUS);
    const unmet: ConditionCode[] = [];
    let roomOverrideBy: 'lead' | 'approval' | null = null;
    let requestRoomApproval = false;
    // BR-402 (2) v0.3.6 (0.3.7 order): `balance_paid` is judged AFTER SURCHARGE_CHANGED, the lines this request
    // posts and its payment – on the real folio, below (never on a projection here).
    for (const c of e.conditions) {
      if (c.code === 'balance_paid') continue;
      if (c.met) continue;
      if (c.code === 'document_check_block' && docOverrideReason) {
        if (!fdlPlus)
          throw problem('FORBIDDEN_ACTION', { detail: 'documentBlockOverride is FDL+' });
        if (docOverrideReason.length < 3) f.add('documentBlockOverride.reason', 'REASON_REQUIRED');
        continue;
      }
      if (c.code === 'room_ready' && e.roomStatus !== 'OOO' && roomOverride) {
        if (fdlPlus) {
          if (!roomOverrideReason || roomOverrideReason.length < 3) {
            f.add('roomNotReadyOverride.reason', 'REASON_REQUIRED');
          }
          roomOverrideBy = 'lead';
          continue;
        }
        if (roomApprovalId) {
          await this.assertRoomApproval(tx, ctx, row, roomApprovalId);
          roomOverrideBy = 'approval';
          continue;
        }
        if (roomOverrideReason && roomOverrideReason.length >= 3) {
          requestRoomApproval = true; // A12 = D: FD asks a lead (202)
          continue;
        }
        f.add('roomNotReadyOverride.reason', 'REASON_REQUIRED');
        continue;
      }
      unmet.push(c.code);
    }
    if (unmet.length > 0) {
      throw problem('CHECKIN_CONDITIONS_NOT_MET', { extras: { unmet } });
    }
    // 0.3.7 bổ sung 1 (ARC 11.3 (1)): the 202 branch does not check in – no money taken there (never ignored).
    if (requestRoomApproval && payment) f.add('payment', 'NOT_ALLOWED');

    // ── surcharge shown ≠ surcharge now (409, before the field checks – ARC-BE-S3-24.1) ──
    const surcharge = e.early.amountVnd;
    if (applyEarly && surcharge > 0 && expected !== undefined && expected !== surcharge) {
      throw problem('SURCHARGE_CHANGED', {
        extras: { surchargeVnd: surcharge, tierPct: e.early.tierPct },
      });
    }
    // ARC 16.18 (0.3.7 vòng sửa 5): `priorNightRateVnd` is optional – absent = the suggested price, written `default`;
    // present = typed (`manual`). The amount shown (`expectedSurchargeVnd`) is checked against the price written.
    const priorUsed = priorRate ?? e.priorNight?.defaultRateVnd;
    if (addPriorNight && e.early.addsPreviousNight && priorUsed !== undefined) {
      if (expected !== undefined && expected !== priorUsed) {
        throw problem('SURCHARGE_CHANGED', { extras: { surchargeVnd: priorUsed } });
      }
    }

    // ── field data (422) ──
    let typed: { systemTime: LocalTime; noted: boolean } | null = null;
    if (!e.priorNightWindow && checkinTime !== undefined) {
      typed = await this.s.checkTypedTime(tx, ctx, f, {
        field: 'checkinTime',
        time: checkinTime,
        noteField: 'checkinTimeNote',
        note: timeNote,
        rollover: e.rollover,
      });
    }
    if (e.early.addsPreviousNight) {
      if (!addPriorNight) f.add('addPriorNight', 'REQUIRED');
      if (addPriorNight && expected === undefined && !f.has('expectedSurchargeVnd')) {
        f.add('expectedSurchargeVnd', 'REQUIRED');
      }
    } else if (addPriorNight) {
      f.add('addPriorNight', 'NOT_ALLOWED');
    }
    // DOM S3-12: a surcharge > 0 is posted (optionally with a FOC request) – never skipped silently.
    if (surcharge > 0 && !applyEarly) f.add('applyEarlySurcharge', 'SURCHARGE_DECISION_REQUIRED');
    if (applyEarly && surcharge > 0 && expected === undefined && !f.has('expectedSurchargeVnd')) {
      f.add('expectedSurchargeVnd', 'REQUIRED');
    }
    if (foc && !(applyEarly && surcharge > 0)) {
      f.add('requestFocForSurcharge', 'NOT_ALLOWED');
    }
    f.done();
    if (addPriorNight && e.priorNight && priorUsed !== undefined) {
      if (!e.priorNight.available) {
        const view = { withNames: true };
        throw await this.s.occupancy.unavailable(
          tx,
          {
            roomId: room.id,
            from: e.priorNight.date,
            to: row.arrival_date,
            persons: this.s.counted(row),
          },
          view,
        );
      }
      if (priorUsed < e.priorNight.floorVnd || priorUsed > e.priorNight.ceilingVnd) {
        throw problem('RATE_OUT_OF_RANGE', {
          errors: [{ field: 'priorNightRateVnd', code: 'RATE_OUT_OF_RANGE' }],
          extras: { min: e.priorNight.floorVnd, max: e.priorNight.ceilingVnd },
        });
      }
    }

    if (requestRoomApproval) {
      // ApprovalService.submit pushes the approvers itself (ARC-BE-S3-23.1 – one push per request).
      const approval = await this.s.approvals.submit(tx, ctx.actor, {
        type: 'checkin_room_not_ready',
        amountVnd: 0,
        reasonCode: 'room_not_ready',
        reasonNote: roomOverrideReason,
        targetType: 'reservation',
        targetId: row.id,
        targetCode: row.code,
        ...this.s.req(ctx),
      });
      return { approval };
    }

    // ── writes (lock order: reservation → room → folio) ──
    await this.s.occupancy.lockRooms(tx, [room.id]);
    // K11-01 (ARC 16.19): the folio before BR-402 (2) is judged on it (`balance_paid`) – a folio command committed
    // between that read and the check-in would otherwise let the guest in owing it.
    if (row.folio_id) await this.s.folios.lock(tx, row.folio_id);
    let arrival = row.arrival_date;
    if (addPriorNight && e.priorNight && priorUsed !== undefined) {
      arrival = await this.addPriorNight(
        tx,
        ctx,
        row,
        room,
        e.priorNight,
        priorUsed,
        priorRate === undefined ? 'default' : 'manual',
      );
    }
    // BR-411/413/415 surcharge confirmed by the desk (BR-414) + optional FOC request.
    if (applyEarly && surcharge > 0 && row.folio_id) {
      const [lineId] = await this.s.folios.postLines(
        tx,
        row.folio_id,
        [
          {
            reservationId: row.id,
            category: 'early_checkin',
            description: `early_checkin ${e.checkinTime} ${e.early.tierPct}%`,
            quantity: 1,
            unitPriceVnd: surcharge,
            amountVnd: surcharge,
            serviceDate: row.arrival_date,
            source: 'checkin',
            labelParams: { time: e.checkinTime, pct: e.early.tierPct },
          },
        ],
        { userId: ctx.actor.userId, reservationCode: row.code, ...this.s.req(ctx) },
      );
      if (foc && lineId) {
        await this.s.requestFoc(
          tx,
          ctx,
          row,
          row.folio_id,
          { id: lineId, amountVnd: surcharge, category: 'early_checkin' },
          foc,
        );
      }
    }

    // 0.3.7 (BUG-R2-038 – M4): the payment of the check-in, capped at what the folio owes after the lines above
    // (the guest may also pay what is asked as FOC – BR-402 v0.3.6, BR-522 when it is approved).
    if (payment && row.folio_id) {
      const owed = (await this.s.folios.balance(tx, row.folio_id)).balanceDueVnd;
      if (payment.amountVnd > owed) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'payment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
          extras: { max: owed },
        });
      }
      await this.payments.recordInTx(
        tx,
        { userId: ctx.actor.userId, roles: ctx.actor.roles, ...this.s.req(ctx) },
        row.folio_id,
        payment,
        {
          reservationId: row.id,
          reservationCode: row.code,
          channelGroup: row.channel_group,
          fieldPrefix: 'payment.',
        },
      );
    }
    // BR-402 (2) on the real folio (after the surcharge / B9a night and the payment): not met → 409 and the
    // whole transaction (lines, payment) is rolled back – nothing is written.
    if (row.folio_id) {
      const b = await this.s.folios.balance(tx, row.folio_id);
      const due =
        b.balanceDueVnd -
        b.rawCreditVnd -
        (row.payment_model === 'ota_prepaid'
          ? await this.incidentalNet(tx, row.folio_id)
          : await this.pendingIncidentalFoc(tx, row.folio_id));
      if (due > 0) {
        throw problem('CHECKIN_CONDITIONS_NOT_MET', {
          extras: { unmet: ['balance_paid'], balanceDueVnd: due },
        });
      }
    }
    const transition = addPriorNight ? 'B9a' : 'B9';
    await tx.query(
      `UPDATE reservation SET status = 'in_house', actual_checkin_at = $2::timestamptz, cards_issued = $3,
              house_rules_sent_at = $2::timestamptz, house_rules_sent_by = $4::uuid,
              door_access_handed_over_at = CASE WHEN $5::boolean THEN $2::timestamptz ELSE NULL END,
              door_access_handed_over_by = CASE WHEN $5::boolean THEN $4::uuid ELSE NULL END,
              checkin_document_override_reason = $6, checkin_document_override_by = $7,
              checkin_room_override_reason = $8, checkin_room_override_by = $9,
              checkin_room_status_before = $10, room_disclosed_to_guest = true,
              updated_at = $2::timestamptz, version = version + 1
        WHERE id = $1`,
      [
        row.id,
        ctx.now,
        cardsIssued,
        ctx.actor.userId,
        doorHandedOver,
        docOverrideReason,
        docOverrideReason ? ctx.actor.userId : null,
        roomOverrideBy ? (roomOverrideReason ?? 'approved') : null,
        roomOverrideBy ? ctx.actor.userId : null,
        e.roomStatus,
      ],
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'confirmed',
      to: 'in_house',
      event: transition,
      reasonNote: [roomOverrideReason, docOverrideReason].filter(Boolean).join(' | ') || null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    if (typed?.noted && checkinTime !== undefined) {
      // E03-07: typed time well before the action – both times + the note in the change log and the audit.
      await recordChange(
        tx,
        row.id,
        'checkin_time',
        typed.systemTime,
        checkinTime,
        ctx.now,
        timeNote ?? null,
      );
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.checked_in',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { status: 'confirmed' },
      after: {
        status: 'in_house',
        roomNo: room.room_no,
        cardsIssued,
        doorAccessHandedOver: doorHandedOver,
        roomStatusBefore: e.roomStatus,
        checkinTime: e.checkinTime,
        ...(typed ? { systemTime: typed.systemTime } : {}),
        ...(arrival !== row.arrival_date ? { arrivalDate: arrival } : {}),
      },
      ...(docOverrideReason || roomOverrideReason || (typed?.noted && timeNote)
        ? {
            reason: [roomOverrideReason, docOverrideReason, typed?.noted ? timeNote : null]
              .filter(Boolean)
              .join(' | '),
          }
        : {}),
      ...this.s.req(ctx),
    });
    // SM-03: OC, or OD when checked in on an unready room (exception, priority clean – R7).
    const ready = e.roomStatus === 'VI' || e.roomStatus === 'VC';
    await this.s.roomStatus.set(tx, room.id, ready ? 'OC' : 'OD', {
      today: ctx.today,
      now: ctx.now,
      event: transition,
      reason: roomOverrideReason,
    });
    if (!ready) {
      await this.s.createTask(tx, ctx, {
        roomId: room.id,
        reservationId: row.id,
        type: 'priority_clean',
        dueDate: ctx.today,
        rank: 1,
        note: 'checkin_room_not_ready',
      });
    }

    // DOM S3-10: a "check in on an unready room" request still open lost its purpose.
    await this.s.approvals.cancelSuperseded(tx, {
      targetType: 'reservation',
      targetId: row.id,
      types: ['checkin_room_not_ready'],
      reason: `checked in (${transition})`,
      ...this.s.req(ctx),
    });
    // BR-812 (5): kit not prepared yet → first in the HK queue.
    await this.s.raiseKitPriority(tx, ctx, row.id);
    // BR-602/603 (G-9): registration deadline counts from actualCheckinAt.
    await this.s.ports.registration.onCheckedIn(tx, row.id, ctx.now);
    if (docOverrideReason) {
      await this.audit.record(tx, {
        category: 'security',
        action: 'checkin.document_block_override',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        reason: docOverrideReason,
        ...this.s.req(ctx),
      });
      // EP06 4 / ARC-BE-S3-24.2: the manager is told (ids + booking code only – the reason stays in the audit).
      await this.s.events.notify(
        tx,
        {
          kind: 'security_alert',
          roles: [...MGR_PLUS],
          excludeUserIds: [ctx.actor.userId],
          refType: 'reservation',
          refId: row.id,
          refCode: row.code,
        },
        ctx.now,
      );
    }
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.stay.emit(tx, 'transitioned', after, 'confirmed', transition, room.id);
    return { row: after };
  }

  /**
   * B9a (BR-417): direct/agent booking gets one more first night (segment + inventory + sold night + folio),
   * re-tiered with the stay (BR-107 D-8 – FB-R2-DOM-BE-30) and kept as a typed price (ARC-BE-S3-24.3); an
   * OTA booking (or a manual long stay without nights) gets a direct CHILD booking for that night.
   * Returns the (new) arrival date of the booking itself.
   */
  private async addPriorNight(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    room: RoomInfo,
    prior: NonNullable<Evaluation['priorNight']>,
    rateVnd: number,
    source: 'default' | 'manual',
  ): Promise<LocalDate> {
    const date = prior.date;
    const sourced = {
      source,
      ...(source === 'manual' ? { anchorRoomId: prior.anchorRoomId } : {}),
    } as const;
    if (row.channel_group === 'ota' || row.external_contract) {
      await this.s.stay.createChildStay(tx, ctx, row, {
        roomId: room.id,
        from: date,
        to: row.arrival_date,
        nights: [{ date, amountVnd: rateVnd, calendarVnd: prior.calendarVnd, ...sourced }],
        rateSource: 'extra_night_early_late',
        transition: 'B9a',
        actualCheckinAt: ctx.now,
      });
      return row.arrival_date;
    }
    const seg = await this.s.segmentOn(tx, row.id, row.arrival_date);
    await this.s.occupancy.update(
      tx,
      { segmentId: seg.id },
      { roomId: room.id, from: date, to: seg.to_date },
      ctx.now,
      { withNames: true, persons: this.s.counted(row), excludeSegmentIds: [seg.id] },
    );
    await tx.query(`UPDATE reservation_segment SET from_date = $2, updated_at = $3 WHERE id = $1`, [
      seg.id,
      date,
      ctx.now,
    ]);
    const kept = await this.s.stay.pricedNights(tx, row);
    const r = this.s.stay.retierStay(ctx, row, kept, [
      // BR-107 v0.3.8 (S4-38): the typed rate is the night's calendar price – the tier of the stay applies on it.
      { date, calendarVnd: rateVnd, amountVnd: rateVnd, manual: source === 'manual', ...sourced },
    ]);
    await this.s.stay.writeRepricedNights(tx, ctx, row, {
      segmentId: seg.id,
      roomId: room.id,
      pct: r.pct,
      kept: r.kept,
      added: r.added,
      rateSource: 'extra_night_early_late',
    });
    await tx.query(`UPDATE reservation SET arrival_date = $2 WHERE id = $1`, [row.id, date]);
    await recordChange(tx, row.id, 'arrival_date', row.arrival_date, date, ctx.now, 'B9a');
    await this.audit.recordMoney(tx, {
      action: 'reservation.prior_night_added',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: {
        arrivalDate: date,
        nightlyRates: [{ date, amountVnd: rateVnd }],
        losDiscountPct: r.pct,
      },
      reason: 'BR-417',
      ...this.s.req(ctx),
    });
    await outboxAvailability(
      tx,
      [{ roomId: room.id, from: date, to: row.arrival_date }],
      'reservation.prior_night',
    );
    const fresh = await loadReservation(tx, row.id, ctx.actor);
    await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, fresh), {
      userId: ctx.actor.userId,
      ...this.s.req(ctx),
    });
    return date;
  }

  /** FD with an approved `checkin_room_not_ready` of this booking, decided this business day (E03-03). */
  private async assertRoomApproval(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    approvalId: string,
  ): Promise<void> {
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    const { rows } = await tx.query<{ status: string; decided_at: Date | null }>(
      `SELECT status, decided_at FROM approval_request
        WHERE id = $1 AND type = 'checkin_room_not_ready' AND target_type = 'reservation' AND target_id = $2`,
      [approvalId, row.id],
    );
    const a = rows[0];
    if (
      !a ||
      a.status !== 'approved' ||
      !a.decided_at ||
      businessDate(a.decided_at, ctx.tz, rollover) !== ctx.today
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'roomNotReadyOverride.approvalRequestId', code: 'NOT_IN_LIST' }],
      });
    }
  }

  // ───────────────────────── B17 ─────────────────────────

  async undo(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const f = new Fields(body);
    const reason = f.text('reason', 500, { required: true, min: 3 });
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    if (row.status !== 'in_house' || !row.actual_checkin_at) throw this.s.stay.invalid(row);
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    if (businessDate(row.actual_checkin_at, ctx.tz, rollover) !== ctx.today) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'undo only on the business day of the check-in',
      });
    }
    // No LIVE folio line posted since the check-in (a reversed pair does not count – spec 1.7); "live" is the
    // folio module's rule (FolioService.hasLiveLinesSince – ARC-BE-S3-15 c).
    const moved = await this.s.folios.hasLiveLinesSince(tx, row.id, row.actual_checkin_at);
    const { rows: children } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM reservation WHERE parent_reservation_id = $1 AND status = 'in_house'`,
      [row.id],
    );
    if (moved || (children[0]?.n ?? 0) > 0) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'reverse the lines posted since check-in first',
      });
    }
    const seg = await this.s.segmentOn(tx, row.id, row.arrival_date);
    await tx.query(
      `UPDATE reservation SET status = 'confirmed', actual_checkin_at = NULL, cards_issued = NULL,
              house_rules_sent_at = NULL, house_rules_sent_by = NULL, door_access_handed_over_at = NULL,
              door_access_handed_over_by = NULL, checkin_document_override_reason = NULL,
              checkin_document_override_by = NULL, checkin_room_override_reason = NULL,
              checkin_room_override_by = NULL, checkin_room_status_before = NULL, updated_at = $2,
              version = version + 1
        WHERE id = $1`,
      [row.id, ctx.now],
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'in_house',
      to: 'confirmed',
      event: 'B17',
      reasonNote: reason ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.check_in_undone',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { status: 'in_house' },
      after: { status: 'confirmed' },
      ...(reason ? { reason } : {}),
      ...this.s.req(ctx),
    });
    if (seg.room_id) {
      const before = (row.checkin_room_status_before as RoomStatusCode | null) ?? 'VC';
      await this.s.roomStatus.set(tx, seg.room_id, before, {
        today: ctx.today,
        now: ctx.now,
        event: 'B17',
        reason: reason ?? null,
      });
    }
    await this.s.ports.registration.onCheckInUndone(tx, row.id);
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.stay.emit(tx, 'transitioned', after, 'in_house', 'B17', seg.room_id);
    return after;
  }

  // ───────────────────────── input helpers ─────────────────────────

  private object(
    f: Fields,
    body: Record<string, unknown>,
    field: string,
  ): Record<string, unknown> | null {
    const v = body[field];
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add(field, 'VALIDATION_FAILED');
      return null;
    }
    return v as Record<string, unknown>;
  }

  /** FocRequestInput (EP00 7.1): amountVnd, reasonCode, note. */
  focInput(
    f: Fields,
    body: Record<string, unknown>,
    field: string,
  ): { amountVnd: number; reasonCode: string; note: string | null } | null {
    const o = this.object(f, body, field);
    if (!o) return null;
    const sub = new Fields(o);
    const amount = sub.money('amountVnd', { required: true, positive: true });
    const reasonCode = sub.text('reasonCode', 40, { required: true });
    const note = sub.text('note', 500);
    for (const e of sub.errors) f.add(`${field}.${e.field}`, e.code);
    if (amount === undefined || !reasonCode) return null;
    return { amountVnd: amount, reasonCode, note: note ?? null };
  }

  /** `checkIn.payment` (PaymentCreate) – same shape as `checkOut.finalPayment`, errors prefixed `payment.`. */
  private paymentInput(f: Fields, body: Record<string, unknown>): PaymentCreateInput | null {
    const v = body.payment;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('payment', 'VALIDATION_FAILED');
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
