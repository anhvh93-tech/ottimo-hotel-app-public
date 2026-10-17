/**
 * In-house stay – spec EP03-05 4 (US-028…031, US-024 B14, US-137 B16; SM-01 B13/B14/B15/B16;
 * BR-107 D-8, BR-110, BR-412/413/416, BR-421/422, BR-424, BR-425, BR-428, BR-803, BR-812).
 * Inventory only through OccupancyService (ADR-009); money through FolioService (BE-B FolioPort) – nights are
 * re-synced (reversal + repost, BR-008), never edited on the folio. Dry runs read in a readOnly transaction
 * (controller – SEC A3) and never write here (`dryRun` paths return before the first write).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, addDays, businessDate } from '../../../shared/time';
import type { ApprovalRow } from '../../approvals/public/approval.service';
import { AuditService } from '../../audit/public/audit.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { ChannelsService } from '../../platform/public/channels';
import { applyPct, nightDates } from '../../reservations/public/pricing';
import { roomReturnsOn } from '../../reservations/public/room-return';
import {
  type BookingContext,
  type BookingMovePlan,
  Fields,
  MGR_PLUS,
  type ReservationRow,
  type RoomInfo,
  type SegmentRow,
  type StayNightPrice,
  activeSegments,
  hasAny,
  insertSegment,
  liveNightRows,
  loadReservation,
  moveCauseOf,
  outboxAvailability,
  recordChange,
  recordTransition,
} from '../../reservations/public/stay-port';
import {
  type CheckoutReminders,
  type DepartureReminderState,
  type EarlyDepartureRefundPolicy,
  type LateTier,
  departureReminderState,
  earlyDepartureRefund,
  lateCheckoutSurcharge,
  nightsOf,
} from '../public/stay-rules';
import { CheckinService } from './checkin.service';
import { type AddedNightContext, StaySupport, TASK_RANK } from './stay-support';

/** Technical bound of the free-night scan of an external long-stay contract (no BR-421 limit). */
const LONG_SCAN_NIGHTS = 62;

type NightPrice = StayNightPrice;

export interface LateCheckoutOutcome {
  status: 200 | 202;
  body: Record<string, unknown>;
  approval?: ApprovalRow;
  row?: ReservationRow;
}

@Injectable()
export class StayService {
  constructor(
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
    @Inject(CheckinService) private readonly checkin: CheckinService,
    @Inject(AttachmentService) private readonly attachments: AttachmentService,
  ) {}

  private assertInHouse(row: ReservationRow): void {
    if (row.status !== 'in_house') throw this.s.stay.invalid(row);
  }

  private async roomOf(tx: Tx, roomId: string | null): Promise<RoomInfo> {
    const rm = roomId ? await this.s.stay.room(tx, roomId) : null;
    if (!rm) throw problem('RESERVATION_UNASSIGNED');
    return rm;
  }

  // ───────────────────────── B13 – extension ─────────────────────────

  async extensionOptions(tx: Tx, ctx: BookingContext, id: string) {
    const row = await loadReservation(tx, id, ctx.actor);
    this.assertInHouse(row);
    return (await this.options(tx, ctx, row)).dto;
  }

  private async options(tx: Tx, ctx: BookingContext, row: ReservationRow) {
    // ARC-BE-S3-05: an OTA stay already extended by a child booking continues after the child's last night.
    const eff = await this.s.effectiveStay(tx, ctx, row);
    const from = eff.departureDate;
    const seg = await this.s.lastSegment(tx, eff.last.id);
    const rm = await this.roomOf(tx, seg.room_id);
    const limit = row.external_contract
      ? LONG_SCAN_NIGHTS
      : await this.s.param<number>(tx, ctx, 'extension_max_nights');
    const kept = await this.s.stay.pricedNights(tx, row);
    // BR-421 / BR-417-07 (BUG-R2-134): default of each added night – one rule with B9a/B18 (`addedNightRate`).
    const nc = row.external_contract
      ? null
      : await this.s.addedNightContext(tx, row, 'last', rm.id);
    let keepRate: number | null = null;
    const nights: Array<Record<string, unknown>> = [];
    const defaults: NightPrice[] = [];
    let maxNights = 0;
    let consecutive = true;
    for (let i = 0; i < limit; i += 1) {
      const date = addDays(from, i);
      const available = await this.s.occupancy.isFree(tx, rm.id, date, addDays(date, 1));
      if (!available) consecutive = false;
      if (available && consecutive) maxNights += 1;
      if (row.external_contract) {
        nights.push({ date, available });
        continue;
      }
      const d = await this.s.addedNightRate(tx, ctx, nc as AddedNightContext, date);
      if (i === 0) keepRate = d.keepVnd;
      // BUG-R2-134: a default that is not this room's calendar (agreed price, OTTIMO min) is written as typed.
      defaults.push({ date, calendarVnd: d.rateVnd, amountVnd: d.rateVnd, manual: d.typed });
      nights.push({
        date,
        available,
        defaultRateVnd: d.rateVnd,
        floorVnd: d.floorVnd,
        ceilingVnd: d.ceilingVnd,
      });
    }
    const beyond =
      consecutive &&
      maxNights === limit &&
      (await this.s.occupancy.isFree(tx, rm.id, addDays(from, limit), addDays(from, limit + 1)));
    const currentNights = nightsOf(row.arrival_date, from);
    const exceeds =
      !row.external_contract &&
      (beyond || currentNights + maxNights >= ctx.params.longStayRequiredFromNights);
    const currentTotal = kept.reduce((a, n) => a + n.amountVnd, 0);
    const repricing: Array<Record<string, unknown>> = [];
    // BR-422 / BR-901: the OTA commission the extension does NOT pay (its nights go to the direct channel).
    const otaPct =
      row.channel_group === 'ota'
        ? ((await this.channels.byId(tx, row.channel_id, ctx.today))?.commissionRatePct ?? 0)
        : 0;
    if (!row.external_contract) {
      for (let k = 1; k <= maxNights; k += 1) {
        const added = defaults.slice(0, k);
        if (row.channel_group === 'ota') {
          const total = added.reduce((a, n) => a + n.amountVnd, 0);
          repricing.push({
            nights: k,
            repricedTotalVnd: total,
            deltaVnd: total,
            losDiscountPct: 0,
            // 0.3.6 bổ sung 3 (BUG-R2-045): Σ default rates of the k nights × the OTA channel's commission.
            channelFeeSavingsVnd: applyPct(total, otaPct, ctx.params.feeUnit),
          });
          continue;
        }
        const r = this.s.stay.retierStay(ctx, row, kept, added);
        const total = [...r.kept, ...r.added].reduce((a, n) => a + n.amountVnd, 0);
        repricing.push({
          nights: k,
          repricedTotalVnd: total,
          deltaVnd: total - currentTotal,
          losDiscountPct: r.pct,
        });
      }
    }
    // Root field kept for compatibility (0.3.6 bổ sung 3): ONE night.
    let savings: number | undefined;
    if (row.channel_group === 'ota' && defaults[0]) {
      savings = applyPct(defaults[0].amountVnd, otaPct, ctx.params.feeUnit);
    }
    return {
      rm,
      seg,
      from,
      ids: eff.ids,
      kept,
      defaults,
      maxNights,
      limit,
      dto: {
        maxNights,
        exceedsShortStayLimit: exceeds,
        createsChildReservation: row.channel_group === 'ota',
        ...(savings !== undefined ? { channelFeeSavingsVnd: savings } : {}),
        // E04-07 "Giữ giá đơn" (BUG-R2-132/-134, ARC 16.6 (a)): the agreed price (or the OTTIMO min) as the first
        // added night would take it – null = the current room's calendar (calendar booking, guest move).
        currentBookingRateVnd: keepRate,
        repricing,
        nights,
      },
    };
  }

  async extend(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<{ row: ReservationRow; child: ReservationRow | null }> {
    const f = new Fields(body);
    const nights = f.int('nights', { required: true, min: 1 });
    const visaAck = f.text('visaWarningAckReason', 500, { min: 3 });
    const rawRates = body.nightlyRates;
    if (rawRates !== undefined && rawRates !== null && !Array.isArray(rawRates)) {
      f.add('nightlyRates', 'VALIDATION_FAILED');
    }
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    this.assertInHouse(row);
    this.assertPrimary(row);
    const n = nights as number;
    const rates = Array.isArray(rawRates) ? (rawRates as Array<Record<string, unknown>>) : [];
    if (row.external_contract && rates.length > 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'nightlyRates', code: 'NIGHTLY_RATES_NOT_ALLOWED' }],
      });
    }
    const o = await this.options(tx, ctx, row);
    if (n > o.limit) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'nights', code: 'EXTENSION_LIMIT_EXCEEDED' }],
        extras: { max: o.maxNights },
      });
    }
    const from = o.from;
    const to = addDays(from, n);
    const dates = nightDates(from, to);
    // BUG-R2-037 (BR-605, US-050 AC2, E04-01): a foreign guest's visa / temporary residence ending before the
    // new departure is a SOFT block – the desk confirms with a reason (the declared departure still stops at
    // the visa – registration module).
    if (!visaAck) {
      const visa = await this.s.ports.registration.earliestVisaValidUntil(tx, row.id);
      if (visa !== null && visa < to) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'visaWarningAckReason', code: 'VISA_EXPIRES_BEFORE_DEPARTURE' }],
        });
      }
    }
    // Rates: default (BR-421) or typed by the desk within BR-105 (one row per added night).
    const byDate = new Map<string, number>();
    for (const r of rates) {
      const date = r.date;
      const amount = r.amountVnd;
      if (
        typeof date !== 'string' ||
        !dates.includes(date) ||
        byDate.has(date) ||
        typeof amount !== 'number' ||
        !Number.isSafeInteger(amount)
      ) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'nightlyRates', code: 'VALIDATION_FAILED' }],
        });
      }
      if (amount <= 0) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'nightlyRates', code: 'AMOUNT_NOT_POSITIVE' }],
        });
      }
      byDate.set(date, amount);
    }
    const added: NightPrice[] = [];
    if (!row.external_contract) {
      for (const date of dates) {
        const d =
          o.defaults.find((x) => x.date === date) ??
          (() => {
            throw problem('VALIDATION_FAILED', {
              errors: [{ field: 'nights', code: 'EXTENSION_LIMIT_EXCEEDED' }],
            });
          })();
        const typed = byDate.get(date);
        const bounds = (o.dto.nights as Array<Record<string, unknown>>).find(
          (x) => x.date === date,
        );
        const floor = Number(bounds?.floorVnd ?? 0);
        const ceiling = Number(bounds?.ceilingVnd ?? Number.MAX_SAFE_INTEGER);
        // BUG-R2-134 (BR-105, BR-107 v0.3.8): the default is checked like a typed rate, and typing the default
        // is leaving it (same night, same source).
        const rate = typed ?? d.calendarVnd;
        if (rate < floor || rate > ceiling) {
          throw problem('RATE_OUT_OF_RANGE', {
            errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
            extras: { date, min: floor, max: ceiling },
          });
        }
        if (typed !== undefined && typed !== d.calendarVnd) {
          added.push({ date, calendarVnd: typed, amountVnd: typed, manual: true });
        } else {
          added.push({ ...d });
        }
      }
    }
    await this.s.occupancy.lockRooms(tx, [o.rm.id]);
    let child: ReservationRow | null = null;
    if (row.channel_group === 'ota') {
      // BR-422: the OTA booking is not edited – a direct child booking takes the added nights.
      child = await this.s.stay.createChildStay(tx, ctx, row, {
        roomId: o.rm.id,
        from,
        to,
        nights: added.map((x) => ({
          date: x.date,
          amountVnd: x.amountVnd,
          calendarVnd: x.calendarVnd,
        })),
        rateSource: 'extension',
        transition: 'B13',
        actualCheckinAt: row.actual_checkin_at ?? ctx.now,
      });
    } else {
      await this.s.occupancy.update(
        tx,
        { segmentId: o.seg.id },
        { roomId: o.rm.id, from: o.seg.from_date, to },
        ctx.now,
        { withNames: true, persons: this.s.counted(row), excludeSegmentIds: [o.seg.id] },
      );
      await tx.query('UPDATE reservation_segment SET to_date = $2, updated_at = $3 WHERE id = $1', [
        o.seg.id,
        to,
        ctx.now,
      ]);
      if (!row.external_contract) {
        const r = this.s.stay.retierStay(ctx, row, o.kept, added);
        await this.s.stay.writeRepricedNights(tx, ctx, row, {
          segmentId: o.seg.id,
          roomId: o.rm.id,
          pct: r.pct,
          kept: r.kept,
          added: r.added,
          rateSource: 'extension',
        });
      }
      await tx.query(
        `UPDATE reservation SET departure_date = $2, updated_at = $3, version = version + 1 WHERE id = $1`,
        [row.id, to, ctx.now],
      );
      await recordChange(tx, row.id, 'departure_date', from, to, ctx.now, 'B13');
    }
    if (row.channel_group === 'ota') {
      await tx.query(
        `UPDATE reservation SET updated_at = $2, version = version + 1 WHERE id = $1`,
        [row.id, ctx.now],
      );
    }
    // ARC-BE-S3-06 / FB-R2-DOM-BE-25: a late checkout agreed for the old departure day is void – its charge is
    // reversed, the agreed time cleared, an open conflict request cancelled (superseded).
    if (row.folio_id) {
      await this.s.replaceLateCharge(tx, ctx, {
        folioId: row.folio_id,
        ids: o.ids,
        booking: row,
        serviceDate: from,
        time: this.s.localTime(ctx),
        tierPct: 0,
        amountVnd: 0,
        reason: 'superseded by extension (B13)',
        source: 'manual',
      });
    }
    if (row.agreed_checkout_time) {
      await tx.query(
        `UPDATE reservation SET agreed_checkout_time = NULL, late_checkout_requested_time = NULL
          WHERE id = $1`,
        [row.id],
      );
      await recordChange(
        tx,
        row.id,
        'agreed_checkout_time',
        row.agreed_checkout_time,
        null,
        ctx.now,
        'B13',
      );
    }
    await this.s.approvals.cancelSuperseded(tx, {
      targetType: 'reservation',
      targetId: row.id,
      types: ['late_checkout_conflict'],
      reason: 'extended (B13)',
      ...this.s.req(ctx),
    });
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'in_house',
      to: 'in_house',
      event: 'B13',
      reasonNote: visaAck ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await this.audit.recordMoney(tx, {
      action: 'reservation.extended',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { departureDate: from },
      after: {
        departureDate: to,
        nightlyRates: added.map((x) => ({ date: x.date, amountVnd: x.amountVnd })),
        rateSource: byDate.size > 0 ? 'manual' : 'calendar',
      },
      ...(visaAck ? { reason: visaAck } : {}),
      ...this.s.req(ctx),
    });
    await outboxAvailability(tx, [{ roomId: o.rm.id, from, to }], 'reservation.extended');
    // BUG-R2-047 (SM-01 B13, SM-03, BR-802): the stay goes on – the occupied-clean room needs a stay-over clean.
    if ((await this.s.roomStatus.of(tx, o.rm.id, ctx.today)) === 'OC') {
      await this.s.roomStatus.set(tx, o.rm.id, 'OD', {
        today: ctx.today,
        now: ctx.now,
        event: 'B13',
      });
    }
    const fresh = await loadReservation(tx, row.id, ctx.actor);
    if (row.channel_group !== 'ota' && !row.external_contract) {
      await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, fresh), {
        userId: ctx.actor.userId,
        ...this.s.req(ctx),
      });
    }
    await this.s.ports.registration.onDepartureChanged(tx, row.id, to);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.stay.emit(tx, 'stay_changed', fresh, 'in_house', 'B13', o.rm.id);
    return { row: fresh, child };
  }

  // ───────────────────────── B15 – late checkout ─────────────────────────

  async lateCheckout(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number | null,
    body: Record<string, unknown>,
    dryRun: boolean,
  ): Promise<LateCheckoutOutcome> {
    const f = new Fields(body);
    const time = f.time('checkoutTime');
    if (body.checkoutTime === undefined || body.checkoutTime === null) {
      f.add('checkoutTime', 'REQUIRED');
    }
    const apply = f.bool('applySurcharge') ?? false;
    const expected = f.money('expectedSurchargeVnd', { required: false, positive: false });
    const requestApproval = f.bool('requestApproval') ?? false;
    const foc = this.checkin.focInput(f, body, 'requestFocForSurcharge');
    f.done();
    const checkoutTime = time as LocalTime;
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: !dryRun });
    if (!dryRun && expectedVersion !== null) this.s.stay.assertVersion(row, expectedVersion);
    this.assertInHouse(row);
    this.assertPrimary(row);
    // ARC-BE-S3-05: departure, room and base night of the whole stay (primary + in-house children).
    const eff = await this.s.effectiveStay(tx, ctx, row);
    const lastNight = addDays(eff.departureDate, -1);
    const seg = await this.s.segmentOn(tx, eff.last.id, lastNight);
    const rm = await this.roomOf(tx, seg.room_id);
    const q = await this.lateQuote(tx, ctx, eff.last, rm, checkoutTime);
    const arrival = q.arrival;
    const conflict = !!arrival && !q.alternativeRoomAvailable;
    const result: Record<string, unknown> = {
      checkoutTime,
      tierPct: q.r.tierPct,
      surchargeVnd: q.r.amountVnd,
      treatAsExtension: q.r.treatAsExtension,
      ...(arrival
        ? {
            arrivalSameDay: {
              ...(arrival.guestName ? { guestDisplayName: arrival.guestName } : {}),
              ...(arrival.etaTime ? { etaTime: arrival.etaTime } : {}),
              alternativeRoomAvailable: q.alternativeRoomAvailable,
            },
          }
        : {}),
      cleaningNotBefore: checkoutTime,
      saved: false,
    };
    if (dryRun) return { status: 200, body: result };

    if (q.r.treatAsExtension) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'checkoutTime', code: 'LATE_CHECKOUT_AFTER_LIMIT' }],
      });
    }
    const mgr = hasAny(ctx.actor.roles, MGR_PLUS);
    if (conflict && !mgr) {
      if (!requestApproval) {
        throw problem('LATE_CHECKOUT_CONFLICT', {
          extras: {
            ...(arrival?.etaTime ? { etaTime: arrival.etaTime } : {}),
            alternativeRoomAvailable: false,
          },
        });
      }
      // A16 = D: FD asks MGR+; approved → agreed time applied by the approval hook (frontdesk.module).
      await tx.query(
        `UPDATE reservation SET late_checkout_requested_time = $2, updated_at = $3, version = version + 1
          WHERE id = $1`,
        [row.id, checkoutTime, ctx.now],
      );
      // ApprovalService.submit pushes MGR+ itself (ARC-BE-S3-23.1 – one push per request).
      const approval = await this.s.approvals.submit(tx, ctx.actor, {
        type: 'late_checkout_conflict',
        amountVnd: q.r.amountVnd,
        reasonCode: 'late_checkout_conflict',
        reasonNote: `${checkoutTime}`,
        targetType: 'reservation',
        targetId: row.id,
        targetCode: row.code,
        ...this.s.req(ctx),
      });
      return { status: 202, body: {}, approval };
    }
    const surcharge = q.r.amountVnd;
    // ARC-BE-S3-24.1: SURCHARGE_CHANGED (409) before the field checks; DOM S3-12: no silent skip.
    if (apply && surcharge > 0 && expected !== undefined && expected !== surcharge) {
      throw problem('SURCHARGE_CHANGED', {
        extras: { surchargeVnd: surcharge, tierPct: q.r.tierPct },
      });
    }
    if (surcharge > 0 && !apply) f.add('applySurcharge', 'SURCHARGE_DECISION_REQUIRED');
    if (apply && surcharge > 0 && expected === undefined) f.add('expectedSurchargeVnd', 'REQUIRED');
    if (foc && !(apply && surcharge > 0)) f.add('requestFocForSurcharge', 'NOT_ALLOWED');
    f.done();
    await tx.query(
      `UPDATE reservation SET agreed_checkout_time = $2, late_checkout_requested_time = NULL, updated_at = $3,
              version = version + 1 WHERE id = $1`,
      [row.id, checkoutTime, ctx.now],
    );
    await recordChange(
      tx,
      row.id,
      'agreed_checkout_time',
      row.agreed_checkout_time,
      checkoutTime,
      ctx.now,
      'B15',
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'in_house',
      to: 'in_house',
      event: 'B15',
      reasonNote: checkoutTime,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    // ARC-BE-S3-06: ONE live late charge per stay – a new time reverses the live one (its approved FOC is
    // carried over as min(FOC, new amount) – DOM S3-11) and posts the new amount (G-10 logic, same tx).
    let lineId: string | null = null;
    if (row.folio_id) {
      const replaced = await this.s.replaceLateCharge(tx, ctx, {
        folioId: row.folio_id,
        ids: eff.ids,
        booking: eff.last,
        serviceDate: eff.departureDate,
        time: checkoutTime,
        tierPct: q.r.tierPct,
        amountVnd: apply ? surcharge : 0,
        reason: `B15 late checkout ${checkoutTime}`,
        source: 'manual',
      });
      lineId = replaced.lineId;
      if (foc && lineId) {
        await this.s.requestFoc(
          tx,
          ctx,
          row,
          row.folio_id,
          { id: lineId, amountVnd: surcharge, category: 'late_checkout' },
          foc,
        );
      }
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.late_checkout_set',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: {
        agreedCheckoutTime: checkoutTime,
        lateSurchargeVnd: apply ? surcharge : 0,
        tierPct: q.r.tierPct,
      },
      ...this.s.req(ctx),
    });
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    return { status: 200, body: { ...result, saved: true }, row: after };
  }

  /** BR-412/413/415 surcharge of a departure at `time` + same-day arrival (BR-416). Read-only. */
  async lateQuote(tx: Tx, ctx: BookingContext, row: ReservationRow, rm: RoomInfo, time: LocalTime) {
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    const tiers = await this.s.param<LateTier[]>(tx, ctx, 'late_checkout_tiers');
    const grace = (await this.s.optionalParam<LocalTime>(tx, ctx, 'late_grace_until')) ?? null;
    const graceNoArrival =
      (await this.s.optionalParam<boolean>(tx, ctx, 'late_grace_requires_no_same_day_arrival')) ??
      true;
    const standard = await this.s.param<LocalTime>(tx, ctx, 'checkout_time');
    const arrival = await this.s.sameDayArrival(tx, rm.id, row.departure_date, row.id);
    const base = await this.s.surchargeBase(tx, ctx, row, 'last', rm.id);
    const longStay =
      row.stay_type === 'long'
        ? { freeUntil: await this.s.param<LocalTime>(tx, ctx, 'long_stay_free_late_until') }
        : null;
    const r = lateCheckoutSurcharge({
      checkoutTime: time,
      standardCheckoutTime: standard,
      rollover,
      tiers,
      graceUntil: grace,
      graceRequiresNoArrival: graceNoArrival,
      sameDayArrival: !!arrival,
      baseNightVnd: base,
      unit: ctx.params.feeUnit,
      longStay,
    });
    const alternativeRoomAvailable = arrival
      ? await this.s.sameGroupRoomFree(tx, rm.id, row.departure_date, this.s.counted(row))
      : true;
    return { r, arrival, alternativeRoomAvailable, standard, rollover };
  }

  /** Approval hook of `late_checkout_conflict` (SM-10): approved → the requested time becomes the agreed one. */
  async onLateCheckoutDecided(tx: Tx, request: ApprovalRow): Promise<void> {
    if (!request.target_id) return;
    if (request.status === 'approved') {
      const { rows } = await tx.query<{ t: string | null; code: string }>(
        `UPDATE reservation SET agreed_checkout_time = late_checkout_requested_time,
                late_checkout_requested_time = NULL, version = version + 1, updated_at = $2
          WHERE id = $1 AND status = 'in_house' AND late_checkout_requested_time IS NOT NULL
          RETURNING to_char(agreed_checkout_time, 'HH24:MI') AS t, code`,
        [request.target_id, request.decided_at ?? new Date(0)],
      );
      if (rows[0]) {
        await recordChange(
          tx,
          request.target_id,
          'agreed_checkout_time',
          null,
          rows[0].t,
          request.decided_at ?? new Date(0),
          'late_checkout_conflict approved',
        );
        await this.s.events.publish(tx, 'reservation.changed', request.target_id);
      }
    } else {
      await tx.query(
        `UPDATE reservation SET late_checkout_requested_time = NULL, version = version + 1
          WHERE id = $1 AND late_checkout_requested_time IS NOT NULL`,
        [request.target_id],
      );
    }
  }

  // ───────────────────────── B14 – change room ─────────────────────────

  /**
   * B14 (US-133, BR-424, DOM S3-13/S3-15, 0.3.6 bổ sung – today only). Fix round 5 (B), BR-424 bổ sung 17/10: a
   * stay extended by a child booking (BR-422 – OTA extension) changes room as ONE stay: every night from
   * tonight of the primary booking AND of its in-house children moves to the new room in the same operation;
   * the new room must be free up to the EFFECTIVE departure – otherwise 409 ROOM_UNAVAILABLE (conflicting nights
   * + suggestions) before anything is saved, the desk picks another room. Each booking is priced by its own
   * channel: OTA → OTA price kept + per-night difference collected at the desk; direct child nights → the new
   * room calendar (re-tiered); property fault → prices kept.
   */
  async changeRoom(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number | null,
    body: Record<string, unknown>,
    dryRun: boolean,
  ): Promise<{ preview: Record<string, unknown> } | { row: ReservationRow }> {
    const f = new Fields(body);
    const newRoomId = f.uuid('newRoomId', true);
    const effective = f.date('effectiveDate', true);
    const cause = f.enumOf('cause', ['property_fault', 'guest_request'] as const, true);
    const reason = f.text('reason', 500, { required: true, min: 3 });
    const workOrderId = f.uuid('workOrderId', false);
    const vacated = f.bool('oldRoomVacated') ?? true;
    const applyDifference = f.bool('applyDifference') ?? false;
    // 0.3.7 (S4-09, BR-424 v0.3.6): "khách đồng ý – chỉ chuyển tới hết đơn gốc".
    const stayScope =
      f.enumOf('stayScope', ['whole_stay', 'until_parent_departure'] as const, false) ??
      'whole_stay';
    const expectedDelta = body.expectedDeltaVnd;
    if (
      expectedDelta !== undefined &&
      expectedDelta !== null &&
      (typeof expectedDelta !== 'number' || !Number.isSafeInteger(expectedDelta))
    ) {
      f.add('expectedDeltaVnd', 'AMOUNT_INVALID');
    }
    // EP07-08 6.4: work orders arrive with the maintenance module (Sprint 4) – none can match yet.
    if (workOrderId) f.add('workOrderId', 'NOT_IN_LIST');
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: !dryRun });
    if (!dryRun && expectedVersion !== null) this.s.stay.assertVersion(row, expectedVersion);
    this.assertInHouse(row);
    this.assertPrimary(row);
    const from = effective as LocalDate;
    const eff = await this.s.effectiveStay(tx, ctx, row);
    // 0.3.6 bổ sung (FB-R2-ARC-BE-S3-08, DOM BE-26): R2 changes the room TODAY only – room status, cleaning
    // and the door access are applied immediately; a later date waits for R3 (job on the effective day).
    if (from !== ctx.today || from >= eff.departureDate) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'effectiveDate', code: 'DATE_INVALID' }],
      });
    }
    // The bookings of the stay with nights from tonight (primary first, then the in-house children).
    const stays: ReservationRow[] = [row];
    for (const cid of eff.ids) {
      if (cid !== row.id) {
        stays.push(await loadReservation(tx, cid, ctx.actor, { forUpdate: !dryRun }));
      }
    }
    const withNights = stays.filter((b) => b.departure_date > from);
    const childStays = withNights.filter((b) => b.id !== row.id);
    // S4-09: the child bookings (extension nights) stay in the old room; the guest moves back to it on the
    // first night of the children (`returnToRoomDate`). A stay without such nights has nothing to keep back.
    if (stayScope === 'until_parent_departure' && childStays.length === 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'stayScope', code: 'NOT_ALLOWED' }],
      });
    }
    const parentOnly = stayScope === 'until_parent_departure';
    const moving = parentOnly ? withNights.filter((b) => b.id === row.id) : withNights;
    const returnToRoomDate = parentOnly
      ? childStays.map((b) => b.arrival_date).sort()[0]
      : undefined;
    const segsOf = new Map<string, SegmentRow[]>();
    for (const b of moving) {
      segsOf.set(
        b.id,
        (await activeSegments(tx, b.id)).filter((s) => s.to_date > from),
      );
    }
    const allSegs = [...segsOf.values()].flat();
    const seg = allSegs.find((s) => s.from_date <= from && s.to_date > from);
    if (!seg?.room_id || seg.room_id === newRoomId) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'newRoomId', code: 'NOT_IN_LIST' }] });
    }
    const oldRoom = await this.roomOf(tx, seg.room_id);
    const newRoom = await this.s.stay.room(tx, newRoomId as string);
    if (!newRoom) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'newRoomId', code: 'NOT_IN_LIST' }] });
    }
    // A-37: hard block for every channel – the guests are real people already in house.
    if (this.s.counted(row) > newRoom.max_occupancy) {
      throw problem('CAPACITY_EXCEEDED', {
        errors: [{ field: 'newRoomId', code: 'CAPACITY_EXCEEDED' }],
        extras: { roomNo: newRoom.room_no, max: newRoom.max_occupancy },
      });
    }
    const status = await this.s.roomStatus.of(tx, newRoom.id, ctx.today);
    // Free up to the effective departure – the child nights included (never left behind silently) – or, when
    // the guest agreed to move only until the end of the primary booking (S4-09), up to that departure.
    const to = parentOnly ? row.departure_date : eff.departureDate;
    const ownSegIds = allSegs.map((s) => s.id);
    if (!(await this.s.occupancy.isFree(tx, newRoom.id, from, to, ownSegIds))) {
      const err = await this.s.occupancy.unavailable(
        tx,
        { roomId: newRoom.id, from, to, persons: this.s.counted(row), exclude: ownSegIds },
        { withNames: true },
      );
      // 0.3.7 (S4-09): the new room is free until the end of the primary booking → the desk can ask the guest.
      const parentOnlyAvailable =
        !parentOnly &&
        childStays.length > 0 &&
        (await this.s.occupancy.isFree(tx, newRoom.id, from, row.departure_date, ownSegIds));
      throw parentOnlyAvailable
        ? new ProblemError(err.code, {
            ...err.options,
            extras: { ...(err.options.extras ?? {}), parentOnlyAvailable: true },
          })
        : err;
    }
    if (status !== 'VI' && status !== 'VC') {
      throw problem('ROOM_NOT_READY', { extras: { roomNo: newRoom.room_no, roomStatus: status } });
    }

    // Money of the nights moved – ONE calculation for dryRun and the write (OpenAPI 0.3.7 D1, ARC 10.4; S4-04,
    // S4-05, S4-07), booking by booking (primary + in-house children): fault → booked prices kept, BR-110 fee
    // min(old, new); guest request → new room calendar (direct/agent, D-8 re-tier), fee of the new room; OTA guest
    // request → OTA price kept, difference against the ORIGIN room per night, reversed and re-posted (BR-424).
    // The write plans again under the locks (rooms, then folio) and compares with the amount the desk showed.
    const plan = async (): Promise<BookingMovePlan[]> => {
      const out: BookingMovePlan[] = [];
      for (const b of moving) {
        out.push(
          await this.s.stay.planMove(tx, ctx, {
            row: b,
            flow: 'B14',
            cause: moveCauseOf(cause as string),
            fromDate: from,
            arrival: b.arrival_date,
            departure: b.departure_date,
            newRoom,
          }),
        );
      }
      return out;
    };
    const previewOf = (plans: BookingMovePlan[]) => {
      const ota = plans.some(
        (p) => moving.find((b) => b.id === p.reservationId)?.channel_group === 'ota',
      );
      // Folio change the guest sees: lines − FOC that follows (BE-B allocation) – the write re-plans the same.
      const delta = plans.reduce((a, p) => a + p.folioDeltaVnd, 0);
      return {
        delta,
        preview: {
          nights: plans
            .flatMap((p) =>
              p.nights.map((n) => ({
                date: n.date,
                oldRateVnd: n.oldGrossVnd ?? n.newGrossVnd,
                newRateVnd: n.newGrossVnd,
              })),
            )
            .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
          folioDeltaVnd: delta,
          ...(ota ? { roomChangeDifferenceVnd: plans.reduce((a, p) => a + p.diffNewVnd, 0) } : {}),
          losDiscountPct: plans.find((p) => p.losPct > 0)?.losPct ?? 0,
          extraGuestKitTransfer: oldExtra > 0 && newExtra > 0,
          newRoomStatus: status,
          stayScope,
          ...(returnToRoomDate ? { returnToRoomDate } : {}),
        },
      };
    };
    const newExtra = Math.max(0, this.s.counted(row) - newRoom.base_occupancy);
    const oldExtra = Math.max(0, this.s.counted(row) - oldRoom.base_occupancy);
    if (dryRun) return { preview: previewOf(await plan()).preview };

    // ── writes (lock order: reservation → rooms ascending → folio) ──
    await this.s.occupancy.lockRooms(tx, [
      ...new Set([
        oldRoom.id,
        newRoom.id,
        ...allSegs.flatMap((s) => (s.room_id ? [s.room_id] : [])),
      ]),
    ]);
    await this.s.stay.lockFolio(tx, row);
    const plans = await plan();
    const { delta } = previewOf(plans);
    if (delta !== 0) {
      if (!applyDifference) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'applyDifference', code: 'REQUIRED' }],
          extras: { folioDeltaVnd: delta },
        });
      }
      if (expectedDelta !== delta) {
        throw problem('SURCHARGE_CHANGED', {
          extras: { surchargeVnd: delta, folioDeltaVnd: delta },
        });
      }
    } else if (expectedDelta !== undefined && expectedDelta !== null && expectedDelta !== delta) {
      // BR-424-07 (MOVE-06, BR-429 (d2) on B14): an amount the caller sent must match even at 0 – the guest
      // heard that number (409, nothing saved).
      throw problem('SURCHARGE_CHANGED', {
        extras: { surchargeVnd: delta, folioDeltaVnd: delta },
      });
    }
    await this.s.stay.assertCapacityStable(tx, [newRoom]);
    const released: Array<{ roomId: string | null; from: LocalDate; to: LocalDate }> = [];
    for (const p of plans) {
      const b = moving.find((x) => x.id === p.reservationId) as ReservationRow;
      const segOfNight = new Map<LocalDate, string>();
      for (const sg of segsOf.get(b.id) ?? []) {
        const start = sg.from_date > from ? sg.from_date : from;
        if (sg.room_id === newRoom.id) {
          for (const d of nightDates(start, sg.to_date)) segOfNight.set(d, sg.id);
          continue;
        }
        if (sg.from_date >= from) {
          await this.s.occupancy.update(
            tx,
            { segmentId: sg.id },
            { roomId: newRoom.id, from: sg.from_date, to: sg.to_date },
            ctx.now,
            { withNames: true, persons: this.s.counted(b), excludeSegmentIds: [sg.id] },
          );
          await tx.query(
            `UPDATE reservation_segment SET room_id = $2, change_reason_code = $3, change_note = $4, updated_at = $5
              WHERE id = $1`,
            [sg.id, newRoom.id, cause, reason, ctx.now],
          );
          for (const d of nightDates(sg.from_date, sg.to_date)) segOfNight.set(d, sg.id);
        } else {
          await this.s.occupancy.update(
            tx,
            { segmentId: sg.id },
            { roomId: sg.room_id ?? oldRoom.id, from: sg.from_date, to: from },
            ctx.now,
            { withNames: true, persons: this.s.counted(b), excludeSegmentIds: [sg.id] },
          );
          await tx.query(
            'UPDATE reservation_segment SET to_date = $2, updated_at = $3 WHERE id = $1',
            [sg.id, from, ctx.now],
          );
          const newSegId = await insertSegment(tx, b.id, newRoom.id, from, sg.to_date, ctx.now);
          await tx.query(
            'UPDATE reservation_segment SET change_reason_code = $2, change_note = $3 WHERE id = $1',
            [newSegId, cause, reason],
          );
          await this.s.occupancy.claim(
            tx,
            {
              roomId: newRoom.id,
              from,
              to: sg.to_date,
              kind: 'reservation',
              segmentId: newSegId,
              now: ctx.now,
            },
            { withNames: true, persons: this.s.counted(b) },
          );
          for (const d of nightDates(from, sg.to_date)) segOfNight.set(d, newSegId);
        }
        released.push({ roomId: sg.room_id, from: start, to: sg.to_date });
      }
      // The planned nights exactly (price, calendar, BR-110 fee/count/base), total and origin room.
      await this.s.stay.writeMovedNights(tx, ctx, b, p, segOfNight);
    }
    for (const b of [row, ...moving.filter((x) => x.id !== row.id)]) {
      await tx.query(
        `UPDATE reservation SET door_access_handed_over_at = NULL, door_access_handed_over_by = NULL,
                capacity_conflict_at = CASE WHEN $3::boolean THEN NULL ELSE capacity_conflict_at END,
                updated_at = $2, version = version + 1
          WHERE id = $1`,
        [b.id, ctx.now, this.s.counted(b) <= newRoom.max_occupancy],
      );
      await recordChange(
        tx,
        b.id,
        'room',
        oldRoom.room_no,
        newRoom.room_no,
        ctx.now,
        cause ?? null,
      );
      await recordTransition(tx, {
        reservationId: b.id,
        code: b.code,
        from: 'in_house',
        to: 'in_house',
        event: 'B14',
        reasonCode: cause,
        reasonNote: reason ?? null,
        now: ctx.now,
        requestId: ctx.requestId,
      });
    }
    const children = plans.filter((p) => p.reservationId !== row.id);
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.room_changed',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { roomNo: oldRoom.room_no },
      after: {
        roomNo: newRoom.room_no,
        reasonCode: cause,
        stayScope,
        ...(returnToRoomDate ? { returnToRoomDate } : {}),
        ...(children.length > 0
          ? {
              childBookings: children.map(
                (p) => moving.find((b) => b.id === p.reservationId)?.code,
              ),
            }
          : {}),
      },
      ...(reason ? { reason } : {}),
      ...this.s.req(ctx),
    });
    for (const p of plans) {
      if (p.folioDeltaVnd === 0 && p.linesDeltaVnd === 0 && p.diffLinesToReverse.length === 0)
        continue;
      const b = moving.find((x) => x.id === p.reservationId) as ReservationRow;
      const ota = b.channel_group === 'ota';
      await this.audit.recordMoney(tx, {
        action: 'reservation.room_change_repriced',
        entityType: 'reservation',
        entityId: b.id,
        entityCode: b.code,
        before: {
          totalRoomVnd: b.total_room_vnd,
          extraPersonVnd: p.feeOldVnd,
          roomChangeDifferenceVnd: p.diffOldVnd,
        },
        after: {
          totalRoomVnd: b.total_room_vnd + (ota ? 0 : p.roomNewVnd - p.roomOldVnd),
          extraPersonVnd: p.feeNewVnd,
          roomChangeDifferenceVnd: p.diffNewVnd,
          nightlyRates: p.nights.map((n) => ({ date: n.date, amountVnd: n.newGrossVnd })),
          rateSource: 'room_change',
        },
        ...(reason ? { reason } : {}),
        ...this.s.req(ctx),
      });
    }
    const fresh = await loadReservation(tx, row.id, ctx.actor);
    if (row.folio_id) {
      for (const p of plans) {
        const b = moving.find((x) => x.id === p.reservationId) as ReservationRow;
        // S4-05 / BR-424 v0.3.5: against the origin room, reversed then re-posted – never cumulative.
        await this.s.stay.repostDifferences(tx, ctx, b, p, {
          from: oldRoom.room_no,
          to: newRoom.room_no,
        });
        if (!b.external_contract) {
          const fb = b.id === row.id ? fresh : await loadReservation(tx, b.id, ctx.actor);
          await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, fb), {
            userId: ctx.actor.userId,
            ...this.s.req(ctx),
          });
        }
      }
    }
    // SM-03 + housekeeping: old room VD ("moved out") / OD ("moving later") + cleaning; new room OC.
    await this.s.roomStatus.set(tx, oldRoom.id, vacated ? 'VD' : 'OD', {
      today: ctx.today,
      now: ctx.now,
      event: 'B14',
      reason: reason ?? null,
    });
    await this.s.roomStatus.set(tx, newRoom.id, 'OC', {
      today: ctx.today,
      now: ctx.now,
      event: 'B14',
    });
    const arrivalOld = await this.s.sameDayArrival(tx, oldRoom.id, ctx.today, row.id);
    await this.s.createTask(tx, ctx, {
      roomId: oldRoom.id,
      reservationId: row.id,
      type: 'checkout_clean',
      dueDate: ctx.today,
      rank: arrivalOld ? TASK_RANK.arrivalToday : TASK_RANK.checkoutNoArrival,
      note: 'room_change',
    });
    // BUG-R2-136 (BR-703-01, BR-424; DOM 18/10 (c)): the old room's minibar is left like a check-out – a count
    // already taken there for this stay gets its refill task now (same port as B18 and the room return). Never
    // blocks the move (assumption (k)); a count taken after the move gets its task from the inventory module.
    await this.s.ports.minibar.onCheckedOut(tx, row.id, oldRoom.id);
    await this.transferKits(tx, ctx, row, oldRoom, newRoom, oldExtra, newExtra);
    await this.s.ports.registration.onRoomChanged(tx, row.id, newRoom.room_no);
    await outboxAvailability(
      tx,
      [...released, { roomId: newRoom.id, from, to }],
      'reservation.room_changed',
    );
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.stay.emit(tx, 'stay_changed', fresh, 'in_house', 'B14', newRoom.id);
    for (const p of children) {
      const child = await loadReservation(tx, p.reservationId, ctx.actor);
      await this.s.events.publish(tx, 'reservation.changed', child.id);
      await this.s.stay.emit(tx, 'stay_changed', child, 'in_house', 'B14', newRoom.id);
    }
    return { row: fresh };
  }

  /**
   * 0.3.7 D1 (S4-09, BR-424 v0.3.6 (3)): "khách đã chuyển về căn cũ" (`updateReservation.roomReturnRecorded`) on
   * the CHILD booking, on its arrival day, after a `changeRoom stayScope = until_parent_departure`: the room of the
   * primary booking's last night → `VD` + check-out cleaning ("khách đến hôm nay" first when someone arrives
   * there today), the child's room → `OC`; the door access is handed over again (BR-511). Once; no late-checkout
   * surcharge (same stay). 409 INVALID_TRANSITION otherwise.
   */
  async recordRoomReturn(
    tx: Tx,
    input: { reservationId: string; userId: string; roles: readonly string[]; requestId?: string },
  ): Promise<void> {
    const ctx = await this.s.stay.context(
      tx,
      { userId: input.userId, roles: input.roles },
      input.requestId,
    );
    const child = await loadReservation(tx, input.reservationId, ctx.actor, { forUpdate: true });
    const refuse = () =>
      problem('INVALID_TRANSITION', {
        extras: { currentState: child.status },
        detail:
          'room return: the in-house child booking starting today, after a move until the primary departure',
      });
    const [ret] = await roomReturnsOn(tx, ctx.today, child.id);
    if (!ret || ret.recorded) throw refuse();
    const parent = await loadReservation(tx, ret.parentReservationId, ctx.actor);
    const moved = await this.roomOf(tx, ret.movedRoomId);
    const back = await this.roomOf(tx, ret.returnRoomId);
    await this.s.roomStatus.set(tx, moved.id, 'VD', {
      today: ctx.today,
      now: ctx.now,
      event: 'B14',
      reason: 'room_return',
    });
    await this.s.roomStatus.set(tx, back.id, 'OC', {
      today: ctx.today,
      now: ctx.now,
      event: 'B14',
    });
    const arrival = await this.s.sameDayArrival(tx, moved.id, ctx.today, child.id);
    await this.s.createTask(tx, ctx, {
      roomId: moved.id,
      reservationId: parent.id,
      type: 'checkout_clean',
      dueDate: ctx.today,
      rank: arrival ? TASK_RANK.arrivalToday : TASK_RANK.checkoutNoArrival,
      note: 'room_return',
    });
    // BR-424-05 `minibarCheckNewRoom`: the moved room is left like a check-out – a checkout count already taken
    // for the primary booking gets its refill task (same port as B18; no count yet → HK counts at the clean).
    await this.s.ports.minibar.onCheckedOut(tx, parent.id, moved.id);
    await tx.query(
      `UPDATE reservation SET door_access_handed_over_at = NULL, door_access_handed_over_by = NULL WHERE id = $1`,
      [child.id],
    );
    await recordChange(tx, child.id, 'room_return', moved.room_no, back.room_no, ctx.now, null);
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.room_returned',
      entityType: 'reservation',
      entityId: child.id,
      entityCode: child.code,
      before: { roomNo: moved.room_no },
      after: { roomNo: back.room_no },
      ...this.s.req(ctx),
    });
    await this.s.events.publish(tx, 'reservation.changed', child.id);
  }

  /** BR-812 (4) on B14: open kit → moved; prepared kit → transfer (or collect when no longer needed). */
  private async transferKits(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    oldRoom: RoomInfo,
    newRoom: RoomInfo,
    oldExtra: number,
    newExtra: number,
  ): Promise<void> {
    for (const t of await this.s.openKitTasks(tx, row.id)) {
      if (t.room_id !== oldRoom.id) continue;
      await this.s.cancelTask(tx, ctx, t.id, 'room_changed');
      if (t.type !== 'extra_guest_kit_collect' && newExtra > 0) {
        await this.s.createTask(tx, ctx, {
          roomId: newRoom.id,
          reservationId: row.id,
          type: 'extra_guest_kit_prepare',
          quantity: newExtra,
          dueDate: ctx.today,
          dueAt: await this.s.midstayKitDue(tx, ctx),
          rank: TASK_RANK.kitInHouse,
        });
      }
    }
    const prepared = await this.s.doneKitPrepared(tx, row.id, oldRoom.id);
    if (prepared > 0 && oldExtra > 0) {
      if (newExtra > 0) {
        await this.s.createTask(tx, ctx, {
          roomId: newRoom.id,
          reservationId: row.id,
          type: 'extra_guest_kit_transfer',
          quantity: Math.min(prepared, newExtra),
          dueDate: ctx.today,
          dueAt: await this.s.midstayKitDue(tx, ctx),
          rank: TASK_RANK.kitInHouse,
          note: `from ${oldRoom.room_no}`,
        });
      } else {
        await this.s.createTask(tx, ctx, {
          roomId: oldRoom.id,
          reservationId: row.id,
          type: 'extra_guest_kit_collect',
          quantity: prepared,
          dueDate: ctx.today,
          rank: TASK_RANK.low,
        });
      }
    }
  }

  // ───────────────────────── B16 – early departure (US-137, Should) ─────────────────────────

  /**
   * B16 (US-137, BR-428, DOM S3-1/S3-2 – OpenAPI 0.3.6 bổ sung 2, E04-06). Basis = the NET price of the dropped
   * nights (`room_revenue_vnd`: after the BR-107 tier and the approved FOC/discounts of each night – a night
   * already given away is never charged 50 %); no re-tiering of the stayed nights (S3-1). The BR-110 fee of the
   * dropped nights is refunded in full. Refund request = min(BR-428 part + dropped fees + dropped BR-424
   * differences, unhandled credit) – never a second request for money already routed. OTA: the desk types what
   * the OTA keeps (`otaRetainedVnd` → `early_departure_fee`, covered by the OTA receipt); OTTIMO never refunds
   * OTA money, only what the desk collected (DOM 17/10 (4), BR-428-06). A notice typed back in time needs
   * evidence (BR-011).
   *
   * Fix round 4 (re-verification 17/10): the stay ends at its EFFECTIVE departure – an OTA stay extended by a
   * direct child booking (BR-422, ARC-05) may end inside the child's nights. The dropped nights of every
   * booking of the stay go: OTA nights → `otaRetainedVnd`, direct child nights → BR-428 policy; a child booking
   * whose nights are all dropped is cancelled (it never started). B14 OTA differences are per night and the
   * dropped ones are reversed here.
   */
  async earlyDeparture(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<{
    row: ReservationRow;
    earlyDepartureFeeVnd: number;
    refundVnd: number;
    refundRequestId: string | null;
    extraPersonRefundVnd: number;
    extraPersonReversedVnd: number;
  }> {
    const f = new Fields(body);
    const newDeparture = f.date('newDepartureDate', true);
    const notice = body.noticeGivenAt;
    let noticeAt: Date | null = null;
    if (notice === undefined || notice === null) f.add('noticeGivenAt', 'REQUIRED');
    else if (typeof notice !== 'string' || Number.isNaN(Date.parse(notice))) {
      f.add('noticeGivenAt', 'DATE_INVALID');
    } else {
      noticeAt = new Date(notice);
      if (noticeAt.getTime() > ctx.now.getTime()) f.add('noticeGivenAt', 'DATE_INVALID');
    }
    const otaRetained = f.money('otaRetainedVnd', { required: false, positive: false });
    const evidence = this.evidenceInput(f, body);
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    this.assertInHouse(row);
    this.assertPrimary(row);
    const nd = newDeparture as LocalDate;
    const eff = await this.s.effectiveStay(tx, ctx, row);
    if (nd < ctx.today || nd >= eff.departureDate || nd <= row.arrival_date) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'newDepartureDate', code: 'DATE_INVALID' }],
      });
    }
    // Every booking of the stay with nights from `nd` (primary first, then the in-house children).
    const stays: ReservationRow[] = [row];
    for (const cid of eff.ids) {
      if (cid !== row.id)
        stays.push(await loadReservation(tx, cid, ctx.actor, { forUpdate: true }));
    }
    const parts: Array<{
      b: ReservationRow;
      dropped: LocalDate[];
      whole: boolean;
      ota: boolean;
      grossVnd: number;
      netVnd: number;
      feesVnd: number;
    }> = [];
    for (const b of stays) {
      if (b.departure_date <= nd) continue;
      const dropped = nightDates(b.arrival_date > nd ? b.arrival_date : nd, b.departure_date);
      const live = (await liveNightRows(tx, b.id)).filter((n) => dropped.includes(n.date));
      // DOM 17/10 (4): the BR-110 fee of every dropped night – an OTA booking's fee is a desk charge too.
      const feesVnd = (await this.s.stay.nightFees(tx, b))
        .filter((n) => dropped.includes(n.date))
        .reduce((a, n) => a + n.feeVnd, 0);
      parts.push({
        b,
        dropped,
        whole: b.arrival_date >= nd,
        ota: b.channel_group === 'ota',
        grossVnd: live.reduce((a, n) => a + n.grossVnd, 0),
        netVnd: live.reduce((a, n) => a + Math.max(0, n.grossVnd - n.discountVnd), 0),
        feesVnd,
      });
    }
    const otaParts = parts.filter((p) => p.ota);
    const directParts = parts.filter((p) => !p.ota);
    const otaGrossVnd = otaParts.reduce((a, p) => a + p.grossVnd, 0);
    const directNetVnd = directParts.reduce((a, p) => a + p.netVnd, 0);
    const droppedFeesVnd = parts.reduce((a, p) => a + p.feesVnd, 0);
    const ota = row.channel_group === 'ota';
    // `otaRetainedVnd` is what the OTA keeps of ITS nights – none dropped (only child nights) → optional (0).
    if (otaParts.length > 0 && otaRetained === undefined) f.add('otaRetainedVnd', 'REQUIRED');
    if (!ota && otaRetained !== undefined) f.add('otaRetainedVnd', 'NOT_ALLOWED');
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    const noticeDate = businessDate(noticeAt as Date, ctx.tz, rollover);
    // BR-011 / E04-06: a notice typed back in time (beyond the tolerance, or another business day) needs proof.
    const tolerance = await this.s.param<number>(tx, ctx, 'manual_time_tolerance_minutes');
    const backdated =
      ctx.now.getTime() - (noticeAt as Date).getTime() > tolerance * 60_000 ||
      noticeDate !== ctx.today;
    if (backdated && !evidence) f.add('noticeEvidence', 'EVIDENCE_REQUIRED');
    f.done();
    if (evidence?.attachmentId) {
      await this.attachments.assertUsable(
        tx,
        { userId: ctx.actor.userId, roles: ctx.actor.roles },
        evidence.attachmentId,
        'penalty_evidence',
        { reservationId: row.id, field: 'noticeEvidence.attachmentId' },
      );
    }
    if (otaRetained !== undefined && otaRetained > otaGrossVnd) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'otaRetainedVnd', code: 'VALUE_OUT_OF_RANGE' }],
        extras: { max: otaGrossVnd },
      });
    }
    let refund = { noticeDays: 0, refundVnd: 0 };
    if (directNetVnd > 0) {
      const policy = await this.s.optionalParam<EarlyDepartureRefundPolicy>(
        tx,
        ctx,
        'early_departure_refund',
      );
      if (!policy) {
        throw problem('PAYMENT_NOT_CONFIGURED', {
          detail: 'early_departure_refund (BR-428) is not configured',
        });
      }
      refund = earlyDepartureRefund({
        newDeparture: nd,
        businessDateAtNotice: noticeDate,
        droppedNightsVnd: directNetVnd,
        policy,
        unit: ctx.params.feeUnit,
      });
    }
    const otaFeeVnd = otaRetained ?? 0;
    const directFeeVnd = directNetVnd - refund.refundVnd;
    const feeVnd = otaFeeVnd + directFeeVnd;
    const segs = new Map<string, Awaited<ReturnType<typeof activeSegments>>>();
    for (const p of parts) segs.set(p.b.id, await activeSegments(tx, p.b.id));
    await this.s.occupancy.lockRooms(tx, [
      ...new Set([...segs.values()].flat().flatMap((x) => (x.room_id ? [x.room_id] : []))),
    ]);
    const released: Array<{ roomId: string | null; from: LocalDate; to: LocalDate }> = [];
    for (const p of parts) {
      for (const sg of segs.get(p.b.id) ?? []) {
        if (sg.to_date <= nd) continue;
        if (sg.from_date >= nd) {
          await this.s.occupancy.release(tx, { segmentId: sg.id }, ctx.now);
          await tx.query(
            'UPDATE reservation_segment SET active = false, updated_at = $2 WHERE id = $1',
            [sg.id, ctx.now],
          );
          released.push({ roomId: sg.room_id, from: sg.from_date, to: sg.to_date });
        } else if (sg.room_id) {
          await this.s.occupancy.update(
            tx,
            { segmentId: sg.id },
            { roomId: sg.room_id, from: sg.from_date, to: nd },
            ctx.now,
            { withNames: true, persons: this.s.counted(p.b), excludeSegmentIds: [sg.id] },
          );
          await tx.query(
            'UPDATE reservation_segment SET to_date = $2, updated_at = $3 WHERE id = $1',
            [sg.id, nd, ctx.now],
          );
          released.push({ roomId: sg.room_id, from: nd, to: sg.to_date });
        }
      }
      await tx.query(
        `UPDATE stay_night SET prev_state = night_state, night_state = 'void', voided_at = $3,
                void_reason = 'early_departure', updated_at = $3
          WHERE reservation_id = $1 AND night_state <> 'void' AND stay_date = ANY($2::date[])`,
        [p.b.id, p.dropped, ctx.now],
      );
      if (p.whole) {
        // A child booking none of whose nights is stayed: cancelled (it never started – SM-01 child of BR-422).
        await tx.query(
          `UPDATE reservation SET status = 'cancelled', status_before_cancel = 'confirmed', cancelled_at = $2,
                  cancelled_by_type = 'user', cancelled_by = $3, cancel_reason_code = 'date_change',
                  cancel_note = $4, early_departure_notice_at = $5,
                  total_room_vnd = GREATEST(0, total_room_vnd - $6), updated_at = $2, version = version + 1
            WHERE id = $1`,
          [p.b.id, ctx.now, ctx.actor.userId, `B16 ${row.code}`, noticeAt, p.grossVnd],
        );
        await recordTransition(tx, {
          reservationId: p.b.id,
          code: p.b.code,
          from: 'in_house',
          to: 'cancelled',
          event: 'B16',
          reasonCode: 'early_departure',
          now: ctx.now,
          requestId: ctx.requestId,
        });
        continue;
      }
      await tx.query(
        `UPDATE reservation SET departure_date = $2, early_departure_notice_at = $3,
                total_room_vnd = GREATEST(0, total_room_vnd - $4), updated_at = $5, version = version + 1
          WHERE id = $1`,
        [p.b.id, nd, noticeAt, p.grossVnd, ctx.now],
      );
      await recordChange(
        tx,
        p.b.id,
        'departure_date',
        p.b.departure_date,
        nd,
        ctx.now,
        evidence ? `B16 ${evidence.note}` : 'B16',
      );
    }
    if (!parts.some((p) => p.b.id === row.id)) {
      // The stay now ends inside a child booking: the primary keeps its nights, the action is still its own.
      await tx.query(
        `UPDATE reservation SET early_departure_notice_at = $2, updated_at = $3, version = version + 1
          WHERE id = $1`,
        [row.id, noticeAt, ctx.now],
      );
    }
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'in_house',
      to: 'in_house',
      event: 'B16',
      reasonCode: 'early_departure',
      now: ctx.now,
      requestId: ctx.requestId,
    });
    const fresh = await loadReservation(tx, row.id, ctx.actor);
    let refundRequestId: string | null = null;
    let refundVnd = 0;
    let extraPersonRefundVnd = 0;
    let differenceReversedVnd = 0;
    const lineIds: string[] = [];
    if (row.folio_id) {
      const who = { userId: ctx.actor.userId, reservationCode: row.code, ...this.s.req(ctx) };
      // A late-checkout charge of the old departure day is void with it (the guest leaves earlier).
      await this.s.replaceLateCharge(tx, ctx, {
        folioId: row.folio_id,
        ids: eff.ids,
        booking: row,
        serviceDate: nd,
        time: this.s.localTime(ctx),
        tierPct: 0,
        amountVnd: 0,
        reason: 'superseded by early departure (B16)',
        source: 'manual',
      });
      for (const p of parts) {
        const b = p.b.id === row.id ? fresh : await loadReservation(tx, p.b.id, ctx.actor);
        await this.s.folios.resyncStay(tx, await this.s.stay.confirmedStay(tx, b), who);
        if (p.whole) {
          await this.s.folios.onReservationVoided(tx, {
            reservationId: b.id,
            reservationCode: b.code,
            reason: 'early_departure',
            ...this.s.req(ctx),
          });
        }
      }
      // Fix round 4 (2), BR-424: the B14 OTA difference of each dropped night is reversed (one line per night).
      const all = await this.s.folios.lines(tx, row.folio_id);
      const reversedIds = new Set(all.filter((l) => l.reversal_of_id).map((l) => l.reversal_of_id));
      for (const l of all) {
        if (
          l.category !== 'room_change_difference' ||
          l.line_state !== 'posted' ||
          l.reversal_of_id ||
          reversedIds.has(l.id) ||
          !l.reservation_id ||
          !eff.ids.includes(l.reservation_id) ||
          l.service_date === null ||
          l.service_date < nd
        ) {
          continue;
        }
        const r = await this.s.folios.reverseLine(tx, l.id, 'early departure (B16)', who);
        differenceReversedVnd += r.reversedVnd;
      }
      const otaNights = otaParts.reduce((a, p) => a + p.dropped.length, 0);
      const directNights = directParts.reduce((a, p) => a + p.dropped.length, 0);
      const firstDirect = directParts[0];
      const feeLines = [
        ...(otaFeeVnd > 0
          ? [{ reservationId: row.id, amountVnd: otaFeeVnd, ota: true, nights: otaNights }]
          : []),
        ...(directFeeVnd > 0 && firstDirect
          ? [
              {
                reservationId: firstDirect.b.id,
                amountVnd: directFeeVnd,
                ota: false,
                nights: directNights,
              },
            ]
          : []),
      ];
      for (const x of feeLines) {
        const [lineId] = await this.s.folios.postLines(
          tx,
          row.folio_id,
          [
            {
              reservationId: x.reservationId,
              category: 'early_departure_fee',
              revenueGroup: 'other',
              description: `early_departure ${refund.noticeDays}d`,
              quantity: 1,
              unitPriceVnd: x.amountVnd,
              amountVnd: x.amountVnd,
              serviceDate: nd,
              source: 'system',
              ...(x.ota ? { chargeCode: 'ota_retained' } : {}),
              labelParams: { noticeDays: refund.noticeDays, nights: x.nights },
            },
          ],
          who,
        );
        if (lineId) lineIds.push(lineId);
      }
      if (evidence?.attachmentId && lineIds[0]) {
        await this.attachments.bindTo(tx, evidence.attachmentId, {
          type: 'folio_line',
          id: lineIds[0],
        });
      }
      // G-14 / DOM S3-2 (c) / DOM 17/10 (4): the refundable part + the dropped nights' BR-110 fees + the
      // reversed BR-424 differences become ONE `refund` request, capped by the overpayment not yet routed to a
      // request (unhandled credit – never OTA money). Not collected → the reversed lines are enough.
      const credit = (await this.s.folios.balance(tx, row.folio_id)).unhandledCreditVnd;
      refundVnd = Math.min(refund.refundVnd + droppedFeesVnd + differenceReversedVnd, credit);
      extraPersonRefundVnd = Math.min(droppedFeesVnd, refundVnd);
      if (refundVnd > 0) {
        const req = await this.s.approvals.submit(tx, ctx.actor, {
          type: 'refund',
          amountVnd: refundVnd,
          reasonCode: 'early_departure',
          ...(evidence ? { reasonNote: evidence.note } : {}),
          targetType: 'reservation',
          targetId: row.id,
          targetCode: row.code,
          ...this.s.req(ctx),
        });
        refundRequestId = req.id;
      }
    }
    if (evidence?.attachmentId && lineIds.length === 0) {
      await this.attachments.bindTo(tx, evidence.attachmentId, { type: 'reservation', id: row.id });
    }
    await this.audit.recordMoney(tx, {
      action: 'reservation.early_departure',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { departureDate: eff.departureDate },
      after: {
        departureDate: nd,
        droppedNetVnd: directNetVnd,
        ...(otaParts.length > 0 ? { droppedOtaGrossVnd: otaGrossVnd } : {}),
        refundableVnd: refund.refundVnd,
        droppedExtraPersonVnd: droppedFeesVnd,
        ...(differenceReversedVnd > 0 ? { roomChangeDifferenceVnd: differenceReversedVnd } : {}),
        retainedVnd: feeVnd,
        refundRequestedVnd: refundVnd,
        ...(parts.some((p) => p.b.id !== row.id)
          ? {
              childBookings: parts
                .filter((p) => p.b.id !== row.id)
                .map((p) => ({ code: p.b.code, nights: p.dropped.length, cancelled: p.whole })),
            }
          : {}),
        noticeGivenAt: ctx.iso(noticeAt as Date),
        ...(evidence ? { noticeEvidence: true } : {}),
      },
      reason: `BR-428 notice ${refund.noticeDays}d${evidence ? ` – ${evidence.note}` : ''}`,
      ...this.s.req(ctx),
    });
    await outboxAvailability(tx, released, 'reservation.early_departure');
    await this.s.ports.registration.onDepartureChanged(tx, row.id, nd);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.stay.emit(tx, 'stay_changed', fresh, 'in_house', 'B16', null, 'early_departure');
    for (const p of parts) {
      if (p.b.id === row.id) continue;
      const child = await loadReservation(tx, p.b.id, ctx.actor);
      await this.s.events.publish(tx, 'reservation.changed', child.id);
      if (p.whole) {
        await this.s.stay.emit(
          tx,
          'transitioned',
          child,
          'in_house',
          'B16',
          null,
          'early_departure',
        );
      } else {
        await this.s.stay.emit(
          tx,
          'stay_changed',
          child,
          'in_house',
          'B16',
          null,
          'early_departure',
        );
      }
    }
    const after = await loadReservation(tx, row.id, ctx.actor);
    return {
      row: after,
      earlyDepartureFeeVnd: Math.max(0, feeVnd),
      refundVnd,
      refundRequestId,
      extraPersonRefundVnd,
      extraPersonReversedVnd: Math.max(0, droppedFeesVnd - extraPersonRefundVnd),
    };
  }

  /** `noticeEvidence {note, attachmentId?}` (E04-06). */
  private evidenceInput(
    f: Fields,
    body: Record<string, unknown>,
  ): { note: string; attachmentId: string | null } | null {
    const v = body.noticeEvidence;
    if (v === undefined || v === null) return null;
    if (typeof v !== 'object' || Array.isArray(v)) {
      f.add('noticeEvidence', 'VALIDATION_FAILED');
      return null;
    }
    const sub = new Fields(v as Record<string, unknown>);
    const note = sub.text('note', 500, { required: true, min: 3 });
    const attachmentId = sub.uuid('attachmentId', false);
    for (const e of sub.errors) f.add(`noticeEvidence.${e.field}`, e.code);
    return note ? { note, attachmentId: attachmentId ?? null } : null;
  }

  /** B13/B15/B16 run on the primary booking (children share its room and folio – ARC-BE-S3-05). */
  private assertPrimary(row: ReservationRow): void {
    if (row.parent_reservation_id) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'use the primary booking (this child booking shares its room and folio)',
      });
    }
  }

  // ───────────────────────── US-030 / US-031 – departure reminders ─────────────────────────

  async reminderState(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    replied: boolean,
  ): Promise<DepartureReminderState> {
    if (row.status === 'checked_out') return 'checked_out';
    if (row.status !== 'in_house') return 'reminded_waiting';
    if (row.departure_date > ctx.today) return replied ? 'replied' : 'reminded_waiting';
    if (row.departure_date < ctx.today) return 'overdue';
    const reminders = await this.s.param<CheckoutReminders>(tx, ctx, 'checkout_reminders');
    const rollover = await this.s.param<LocalTime>(tx, ctx, 'business_day_rollover');
    const seg = await this.s.segmentOn(tx, row.id, addDays(row.departure_date, -1));
    const arrival = seg.room_id
      ? await this.s.sameDayArrival(tx, seg.room_id, row.departure_date, row.id)
      : null;
    return departureReminderState({
      nowTime: this.s.localTime(ctx),
      rollover,
      checkedOut: false,
      replied,
      sameDayArrival: !!arrival,
      reminders,
    });
  }

  async listReminders(tx: Tx, ctx: BookingContext, id: string) {
    const row = await loadReservation(tx, id, ctx.actor);
    const { rows } = await tx.query<{
      recorded_at: Date;
      channel: string;
      reply_type: string;
      confirmed_time: string | null;
      note: string | null;
      recorded_by_name: string | null;
    }>(
      `SELECT c.recorded_at, c.channel, c.reply_type, to_char(c.confirmed_time, 'HH24:MI') AS confirmed_time,
              c.note, u.display_name AS recorded_by_name
         FROM checkout_confirmation c LEFT JOIN app_user u ON u.id = c.recorded_by
        WHERE c.reservation_id = $1 ORDER BY c.recorded_at, c.id`,
      [row.id],
    );
    const replied = rows.length > 0 || row.agreed_checkout_time !== null;
    return {
      state: await this.reminderState(tx, ctx, row, replied),
      data: rows.map((r) => this.entryDto(ctx, r)),
    };
  }

  private entryDto(
    ctx: BookingContext,
    r: {
      recorded_at: Date;
      channel: string;
      reply_type: string;
      confirmed_time: string | null;
      note: string | null;
      recorded_by_name: string | null;
    },
  ) {
    return {
      at: ctx.iso(r.recorded_at),
      channel: r.channel,
      replyType: r.reply_type,
      ...(r.confirmed_time ? { confirmedTime: r.confirmed_time } : {}),
      ...(r.note ? { note: r.note } : {}),
      ...(r.recorded_by_name ? { recordedBy: r.recorded_by_name } : {}),
    };
  }

  async recordConfirmation(tx: Tx, ctx: BookingContext, id: string, body: Record<string, unknown>) {
    const f = new Fields(body);
    const channel = f.enumOf('channel', ['phone', 'app', 'zalo_copy', 'in_person'] as const, true);
    const reply = f.enumOf('replyType', ['on_time', 'time', 'late', 'extend'] as const, true);
    const time = f.time('confirmedTime');
    const note = f.text('note', 300);
    const standard = await this.s.param<LocalTime>(tx, ctx, 'checkout_time');
    if (reply === 'time' || reply === 'late') {
      if (!time) {
        if (!f.has('confirmedTime')) f.add('confirmedTime', 'REQUIRED');
      } else if (reply === 'time' ? time > standard : time <= standard) {
        f.add('confirmedTime', 'DATE_INVALID');
      }
    }
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertInHouse(row);
    const entryId = uuidv7();
    await tx.query(
      `INSERT INTO checkout_confirmation (id, organization_id, property_id, reservation_id, recorded_at,
         recorded_by, channel, reply_type, confirmed_time, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entryId,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        row.id,
        ctx.now,
        ctx.actor.userId,
        channel,
        reply,
        reply === 'time' || reply === 'late' ? time : null,
        note ?? null,
      ],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.checkout_confirmed',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: { replyType: reply, channel, confirmedTime: time ?? null },
      ...this.s.req(ctx),
    });
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    const { rows } = await tx.query<{ display_name: string }>(
      'SELECT display_name FROM app_user WHERE id = $1',
      [ctx.actor.userId],
    );
    return this.entryDto(ctx, {
      recorded_at: ctx.now,
      channel: channel as string,
      reply_type: reply as string,
      confirmed_time: reply === 'time' || reply === 'late' ? (time ?? null) : null,
      note: note ?? null,
      recorded_by_name: rows[0]?.display_name ?? null,
    });
  }
}
