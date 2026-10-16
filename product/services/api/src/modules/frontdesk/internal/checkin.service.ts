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
import { type LocalDate, type LocalTime, addDays, businessDate } from '../../../shared/time';
import type { ApprovalRow } from '../../approvals/public/approval.service';
import { AuditService } from '../../audit/public/audit.service';
import {
  type BookingContext,
  FDL_PLUS,
  Fields,
  type ReservationRow,
  type RoomInfo,
  hasAny,
  insertNights,
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
  priorNightWindow: boolean;
  early: EarlyCheckinResult;
  priorNight: {
    date: LocalDate;
    available: boolean;
    defaultRateVnd: number;
    floorVnd: number;
    ceilingVnd: number;
    createsChildReservation: boolean;
  } | null;
  conditions: Condition[];
  warnings: Array<{ code: string }>;
  registrationDeadlinePreview: Date | null;
}

const FDL_UP = ['front_desk_lead', 'manager', 'owner'];

@Injectable()
export class CheckinService {
  constructor(
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(AuditService) private readonly audit: AuditService,
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
    const e = await this.evaluate(tx, ctx, row, checkinTime);
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
    };
  }

  private async evaluate(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    requestedTime: LocalTime | undefined,
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
    const checkinTime = requestedTime ?? (priorNightWindow ? this.s.localTime(ctx) : standard);

    let early: EarlyCheckinResult = {
      tierPct: 0,
      baseNightVnd: 0,
      amountVnd: 0,
      addsPreviousNight: false,
      ruleRef: 'BR-411',
    };
    if (room) {
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
      const direct = await this.s.directRate(tx, ctx, room.id, date);
      const own =
        row.stay_type === 'long'
          ? early.baseNightVnd
          : row.channel_group === 'ota' || direct.special
            ? direct.rateVnd
            : early.baseNightVnd;
      priorNight = {
        date,
        available:
          priorNightWindow && (await this.s.occupancy.isFree(tx, room.id, date, row.arrival_date)),
        defaultRateVnd: own,
        floorVnd: direct.floorVnd,
        ceilingVnd: direct.ceilingVnd,
        createsChildReservation: row.channel_group === 'ota' || row.external_contract,
      };
    }

    const balance = row.folio_id ? await this.s.folios.balance(tx, row.folio_id) : null;
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
        met: row.payment_model === 'ota_prepaid' || (balance?.balanceDueVnd ?? 0) === 0,
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
    };
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

    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.s.stay.assertVersion(row, expectedVersion);
    if (row.status !== 'confirmed') throw this.s.stay.invalid(row);
    const e = await this.evaluate(tx, ctx, row, checkinTime);
    if (ctx.today !== row.arrival_date && !e.priorNightWindow) {
      throw problem('INVALID_TRANSITION', {
        extras: { currentState: row.status },
        detail: 'check-in only on the arrival business day (or B9a with addPriorNight)',
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
    for (const c of e.conditions) {
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

    // ── field data (422) ──
    if (e.early.addsPreviousNight) {
      if (!addPriorNight) f.add('addPriorNight', 'REQUIRED');
      if (addPriorNight && priorRate === undefined && !f.has('priorNightRateVnd')) {
        f.add('priorNightRateVnd', 'REQUIRED');
      }
    } else if (addPriorNight) {
      f.add('addPriorNight', 'NOT_ALLOWED');
    }
    if (applyEarly && e.early.amountVnd > 0 && expected === undefined) {
      f.add('expectedSurchargeVnd', 'REQUIRED');
    }
    if (foc && !(applyEarly && e.early.amountVnd > 0)) {
      f.add('requestFocForSurcharge', 'NOT_ALLOWED');
    }
    f.done();
    if (applyEarly && e.early.amountVnd > 0 && expected !== e.early.amountVnd) {
      throw problem('SURCHARGE_CHANGED', {
        extras: { expectedSurchargeVnd: e.early.amountVnd, tierPct: e.early.tierPct },
      });
    }
    if (addPriorNight && e.priorNight && priorRate !== undefined) {
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
      if (priorRate < e.priorNight.floorVnd || priorRate > e.priorNight.ceilingVnd) {
        throw problem('RATE_OUT_OF_RANGE', {
          errors: [{ field: 'priorNightRateVnd', code: 'RATE_OUT_OF_RANGE' }],
          extras: { min: e.priorNight.floorVnd, max: e.priorNight.ceilingVnd },
        });
      }
    }

    if (requestRoomApproval) {
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
      await this.s.events.notify(
        tx,
        {
          kind: 'approval_requested',
          roles: FDL_UP,
          excludeUserIds: [ctx.actor.userId],
          refType: 'approval_request',
          refId: approval.id,
          refCode: row.code,
        },
        ctx.now,
      );
      return { approval };
    }

    // ── writes ──
    await this.s.occupancy.lockRooms(tx, [room.id]);
    let arrival = row.arrival_date;
    if (addPriorNight && e.priorNight && priorRate !== undefined) {
      arrival = await this.addPriorNight(tx, ctx, row, room, e.priorNight.date, priorRate);
    }
    const transition = addPriorNight ? 'B9a' : 'B9';
    await tx.query(
      `UPDATE reservation SET status = 'in_house', actual_checkin_at = $2::timestamptz, cards_issued = $3,
              house_rules_sent_at = $2::timestamptz, house_rules_sent_by = $4::uuid,
              door_access_handed_over_at = CASE WHEN $5::boolean THEN $2::timestamptz ELSE NULL END,
              door_access_handed_over_by = CASE WHEN $5::boolean THEN $4::uuid ELSE NULL END,
              checkin_document_override_reason = $6, checkin_document_override_by = $7,
              checkin_room_override_reason = $8, checkin_room_override_by = $9,
              checkin_room_status_before = $10, updated_at = $2::timestamptz, version = version + 1
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
        ...(arrival !== row.arrival_date ? { arrivalDate: arrival } : {}),
      },
      ...(docOverrideReason || roomOverrideReason
        ? { reason: [roomOverrideReason, docOverrideReason].filter(Boolean).join(' | ') }
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

    // BR-411/413/415 surcharge confirmed by the desk (BR-414) + optional FOC request.
    if (applyEarly && e.early.amountVnd > 0 && row.folio_id) {
      const [lineId] = await this.s.folios.postLines(
        tx,
        row.folio_id,
        [
          {
            reservationId: row.id,
            category: 'early_checkin',
            description: `early_checkin ${e.checkinTime} ${e.early.tierPct}%`,
            quantity: 1,
            unitPriceVnd: e.early.amountVnd,
            amountVnd: e.early.amountVnd,
            serviceDate: row.arrival_date,
            source: 'checkin',
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
          { id: lineId, amountVnd: e.early.amountVnd, category: 'early_checkin' },
          foc,
        );
      }
    }

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
    }
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.s.events.publish(tx, 'reservation.changed', row.id);
    await this.s.stay.emit(tx, 'transitioned', after, 'confirmed', transition, room.id);
    return { row: after };
  }

  /**
   * B9a (BR-417): direct/agent booking gets one more first night (segment + inventory + sold night + folio);
   * an OTA booking (or a manual long stay without nights) gets a direct CHILD booking for that night.
   * Returns the (new) arrival date of the booking itself.
   */
  private async addPriorNight(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    room: RoomInfo,
    date: LocalDate,
    rateVnd: number,
  ): Promise<LocalDate> {
    if (row.channel_group === 'ota' || row.external_contract) {
      await this.s.stay.createChildStay(tx, ctx, row, {
        roomId: room.id,
        from: date,
        to: row.arrival_date,
        nights: [{ date, amountVnd: rateVnd, calendarVnd: rateVnd }],
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
    await insertNights(
      tx,
      {
        reservationId: row.id,
        segmentId: seg.id,
        roomId: room.id,
        channelId: row.channel_id,
        stayType: row.stay_type,
        state: 'sold',
        isComplimentary: false,
        now: ctx.now,
      },
      [{ date, amountVnd: rateVnd, calendarVnd: rateVnd, source: 'manual' }],
    );
    await tx.query(
      `UPDATE stay_night SET rate_source = 'extra_night_early_late' WHERE reservation_id = $1 AND stay_date = $2
          AND night_state <> 'void'`,
      [row.id, date],
    );
    await tx.query(
      `UPDATE reservation SET arrival_date = $2, total_room_vnd = total_room_vnd + $3 WHERE id = $1`,
      [row.id, date, rateVnd],
    );
    await recordChange(tx, row.id, 'arrival_date', row.arrival_date, date, ctx.now, 'B9a');
    await this.audit.recordMoney(tx, {
      action: 'reservation.prior_night_added',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: { arrivalDate: date, nightlyRates: [{ date, amountVnd: rateVnd }] },
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
    // No LIVE folio line posted since the check-in (a reversed pair does not count – spec 1.7).
    const { rows: lines } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM folio_line l
        WHERE l.reservation_id = $1 AND l.posted_at >= $2 AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [row.id, row.actual_checkin_at],
    );
    const { rows: children } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM reservation WHERE parent_reservation_id = $1 AND status = 'in_house'`,
      [row.id],
    );
    if ((lines[0]?.n ?? 0) > 0 || (children[0]?.n ?? 0) > 0) {
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
}
