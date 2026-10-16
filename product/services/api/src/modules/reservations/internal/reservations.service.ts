/**
 * Reservation use cases (SM-01; BA EP02 spec; BR-110…113, 302–317, 812, 906; ADR-009). Every method runs in
 * the caller's transaction (UnitOfWork for writes): checks → lock (reservation → rooms ascending) →
 * business writes → state_transition + reservation_change + audit_event → outbox → hooks.
 * Inventory goes through OccupancyService only (EXCLUDE constraint, 409 + conflicts/suggestions).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { LeadsService } from '../../sales/public/leads.service';
import { inSequence } from '../../../shared/sequence';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { ChannelGroup, ReservationStatus } from '../../../db/schema';
import { CANCEL_REASON_CODES, type CancelReasonCode } from '../../../db/schema';
import { ProblemError, problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, addDays, atLocal } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { ApprovalService, type ApprovalRow } from '../../approvals/public/approval.service';
import { normalizeEmail } from '../../guests/public/normalize';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { OccupancyService } from '../public/occupancy.service';
import {
  countedPersons,
  directCancelRefund,
  extraGuestKitDue,
  holdDeadline,
  holdExtension,
  isOrphanGap,
  lastBookableArrival,
  minStayNights,
  nightsOf,
  noticeDays,
} from '../public/pricing';
import {
  type PriceResult,
  type PricedNight,
  type PricingParams,
  PricingService,
} from '../public/pricing.service';
import { type InitialPayment, ReservationHooks } from '../public/reservation-hooks';
import type { ConfirmedStay } from '../public/sales-port';
import { MoneyBridge } from './money-bridge';
import { FDL_PLUS, FD_PLUS, MGR_PLUS, allowedActions, hasAny } from './allowed-actions';
import { type BookingContext, bookingContext } from './booking-context';
import { syncExtraGuestKit } from './extra-guest-kit';
import { Fields, isUuid } from './inputs';
import { type BookerRow, toReservationDto } from './reservation-dto';
import {
  type Actor,
  type ReservationRow,
  type SegmentRow,
  activeSegments,
  datesOutside,
  insertNights,
  insertSegment,
  isOwn,
  liveNights,
  loadReservation,
  outboxAvailability,
  outboxStaffPush,
  recordChange,
  recordTransition,
  sellNights,
  singleSegment,
  voidNights,
} from './reservation-store';

export interface RoomInfo {
  id: string;
  room_no: string;
  room_group_id: string;
  group_code: string;
  base_occupancy: number;
  max_occupancy: number;
  is_sellable: boolean;
  active_from: LocalDate;
  active_to: LocalDate | null;
}

interface ChannelInfo {
  id: string;
  code: string;
  channel_group: ChannelGroup;
  requires_ota_ref: boolean;
  is_active: boolean;
}

interface GuestRow extends BookerRow {
  email_norm: string | null;
}

/** Cancel reasons a user may pick (BR-308): system codes are never chosen by hand. */
const USER_CANCEL_REASONS: readonly CancelReasonCode[] = [
  'guest_changed_mind',
  'found_other',
  'price',
  'date_change',
  'unreachable',
  'other',
  'ota_cancelled',
];
const MOVE_REASONS = [
  'guest_request',
  'property_fault',
  'overbooking',
  'upgrade',
  'other',
] as const;
/** Input limit of a manual long stay (BA EP02 4 – data-entry guard, not a business rule). */
const MANUAL_LONG_STAY_MAX_DAYS = 731;

export interface CreateHoldInput {
  roomId: string;
  channelId: string;
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  adults: number;
  children6to11: number;
  childrenUnder6: number;
  bookerGuestId: string;
  closerUserId?: string | undefined;
  holdHours: number;
  quoteId?: string | undefined;
  /** Prices of the quote (BR-006 snapshot) – omitted = priced now. */
  priced?: { result: PriceResult; snapshot: Record<string, unknown> } | undefined;
}

/** Booking reads by system jobs and ports (no SAL/CTV scope). */
export const SYSTEM_ACTOR: Actor = {
  userId: '00000000-0000-0000-0000-000000000000',
  roles: ['owner'],
};

export interface CancelResult {
  reservation: Record<string, unknown>;
  cancellation: Record<string, unknown>;
}

@Injectable()
export class ReservationsService {
  constructor(
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(PricingService) private readonly pricing: PricingService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(OccupancyService) private readonly occupancy: OccupancyService,
    @Inject(DocNumberService) private readonly docNumbers: DocNumberService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Inject(MoneyBridge) private readonly money: MoneyBridge,
    @Optional() @Inject(LeadsService) private readonly leads?: LeadsService,
  ) {}

  context(tx: Tx, actor: Actor, requestId?: string): Promise<BookingContext> {
    return bookingContext(tx, this.property, this.pricing, actor, requestId);
  }

  // ─────────────────────────── reads ───────────────────────────

  async room(tx: Tx, roomId: string): Promise<RoomInfo | null> {
    const { rows } = await tx.query<RoomInfo>(
      `SELECT rm.id, rm.room_no, rm.room_group_id, rg.code AS group_code, rm.base_occupancy, rm.max_occupancy,
              rm.is_sellable, rm.active_from::text AS active_from, rm.active_to::text AS active_to
         FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id WHERE rm.id = $1`,
      [roomId],
    );
    return rows[0] ?? null;
  }

  private async listPrices(tx: Tx, roomId: string) {
    const { rows } = await tx.query<{ effective_from: string; nightly: number }>(
      `SELECT effective_from::text AS effective_from, nightly_list_price_vnd AS nightly
         FROM room_list_price WHERE room_id = $1 ORDER BY effective_from`,
      [roomId],
    );
    return rows.map((r) => ({ effectiveFrom: r.effective_from, nightlyVnd: r.nightly }));
  }

  private async channel(tx: Tx, channelId: string): Promise<ChannelInfo | null> {
    const { rows } = await tx.query<ChannelInfo>(
      'SELECT id, code, channel_group, requires_ota_ref, is_active FROM channel WHERE id = $1',
      [channelId],
    );
    return rows[0] ?? null;
  }

  private async guest(tx: Tx, guestId: string): Promise<GuestRow | null> {
    const { rows } = await tx.query<GuestRow>(
      `SELECT id, code, full_name, nationality_code, phone_e164, email_norm, tags, possible_duplicate_at
         FROM guest WHERE id = $1 AND merged_into_id IS NULL AND anonymized_at IS NULL`,
      [guestId],
    );
    return rows[0] ?? null;
  }

  /** Full Reservation JSON for the caller (allowedActions by state AND role). */
  async dto(tx: Tx, ctx: BookingContext, id: string): Promise<Record<string, unknown>> {
    const row = await loadReservation(tx, id, ctx.actor);
    return this.dtoOf(tx, ctx, row);
  }

  async dtoOf(tx: Tx, ctx: BookingContext, row: ReservationRow): Promise<Record<string, unknown>> {
    const [segments, booker, nights] = await inSequence([
      () => activeSegments(tx, row.id),
      () => this.guest(tx, row.booker_guest_id),
      () => liveNights(tx, row.id),
    ]);
    const markTime = await this.params.get<LocalTime>(tx, 'no_show_mark_time', ctx.today);
    let restoreWithinRules = false;
    if (row.status === 'no_show') {
      const seg = segments[0];
      restoreWithinRules =
        ctx.today === row.arrival_date &&
        !!seg?.room_id &&
        (await this.occupancy.isFree(tx, seg.room_id, row.arrival_date, row.departure_date, [
          seg.id,
        ]));
    }
    const actions = allowedActions(ctx.actor.roles, {
      status: row.status,
      conflictState: row.conflict_state,
      channelGroup: row.channel_group,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      today: ctx.today,
      holdExpired: !!row.hold_expires_at && row.hold_expires_at.getTime() <= ctx.now.getTime(),
      holdExtendedCount: row.hold_extended_count,
      own: isOwn(ctx.actor, row),
      noShowMarkable:
        ctx.today >= row.arrival_date &&
        ctx.now.getTime() >= atLocal(row.arrival_date, markTime, ctx.tz).getTime(),
      restoreWithinRules,
      rescheduleCount: row.reschedule_count,
      rescheduleMaxTimes: ctx.params.rescheduleMaxTimes,
    });
    return toReservationDto({
      row,
      segments,
      booker,
      nights: nights.map((n) => ({ date: n.date, amountVnd: n.amountVnd })),
      actions,
      iso: ctx.iso,
    });
  }

  // ─────────────────────────── B2 / B7b / AC5a – create ───────────────────────────

  async create(
    tx: Tx,
    ctx: BookingContext,
    body: Record<string, unknown>,
  ): Promise<{ row: ReservationRow }> {
    const f = new Fields(body);
    const roomId = f.uuid('roomId', true);
    const channelId = f.uuid('channelId', true);
    const arrival = f.date('arrivalDate', true);
    const departure = f.date('departureDate', true);
    const adults = f.int('adults', { required: true, min: 1, max: 20 });
    const children611 = f.int('children6to11', { required: false, min: 0, max: 20, fallback: 0 });
    const childrenUnder6 = f.int('childrenUnder6', {
      required: false,
      min: 0,
      max: 20,
      fallback: 0,
    });
    const bookerGuestId = f.uuid('bookerGuestId', true);
    const closerUserId = f.uuid('closerUserId', false);
    const paymentModel = f.enumOf(
      'paymentModel',
      ['direct', 'ota_prepaid', 'ota_pay_at_property'] as const,
      true,
    );
    const directSource = f.enumOf(
      'directSource',
      ['website', 'zalo_phone', 'walk_in', 'returning', 'sales_staff'] as const,
      false,
    );
    const etaTime = f.time('etaTime');
    const internalNote = f.text('internalNote', 1000);
    const rateOverrideReason = f.text('rateOverrideReason', 500, { min: 3 });
    const minStayOverrideReason = f.text('minStayOverrideReason', 500, { min: 3 });
    const allowUnassigned = f.bool('allowUnassigned') ?? false;
    const otaRoomAmountVnd = f.money('otaRoomAmountVnd', { required: false, positive: true });
    const otaChannelFeeVnd = f.money('otaChannelFeeVnd', { required: false, positive: false });
    let otaRef: string | undefined;
    if (f.present('otaRef')) {
      const v = body.otaRef;
      if (typeof v !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(v))
        f.add('otaRef', 'VALIDATION_FAILED');
      else otaRef = v;
    }
    let otaBookedAt: Date | undefined;
    if (f.present('otaBookedAt')) {
      const t = typeof body.otaBookedAt === 'string' ? Date.parse(body.otaBookedAt) : Number.NaN;
      if (Number.isNaN(t) || t > ctx.now.getTime()) f.add('otaBookedAt', 'DATE_INVALID');
      else otaBookedAt = new Date(t);
    }
    let guestEmail: string | null = null;
    if (f.present('guestEmail')) {
      guestEmail = typeof body.guestEmail === 'string' ? normalizeEmail(body.guestEmail) : null;
      if (!guestEmail) f.add('guestEmail', 'EMAIL_INVALID');
    }
    const nightlyRates = this.parseNightlyRates(f, body.nightlyRates);
    const initialPayment = this.parseInitialPayment(f, body.initialPayment);
    const manual = this.parseManualLongStay(f, body);
    if (
      otaChannelFeeVnd !== undefined &&
      otaRoomAmountVnd !== undefined &&
      otaChannelFeeVnd > otaRoomAmountVnd
    ) {
      f.add('otaChannelFeeVnd', 'AMOUNT_INVALID');
    }
    f.done();

    const [channel, room, guest] = await inSequence([
      () => this.channel(tx, channelId as string),
      () => this.room(tx, roomId as string),
      () => this.guest(tx, bookerGuestId as string),
    ]);
    if (!channel || !channel.is_active) f.add('channelId', 'NOT_IN_LIST');
    if (!room) f.add('roomId', 'NOT_IN_LIST');
    if (!guest) f.add('bookerGuestId', 'NOT_IN_LIST');
    if (closerUserId && !(await this.isPropertyUser(tx, closerUserId)))
      f.add('closerUserId', 'NOT_IN_LIST');
    f.done();
    const ch = channel as ChannelInfo;
    const rm = room as RoomInfo;
    const booker = guest as GuestRow;
    const group = ch.channel_group;
    const from = arrival as LocalDate;
    const to = departure as LocalDate;
    const party = {
      adults: adults as number,
      children6to11: children611 ?? 0,
      childrenUnder6: childrenUnder6 ?? 0,
    };

    // Field rules depending on the channel (EP02 3.2, 4).
    if (from < ctx.today) f.add('arrivalDate', 'DATE_IN_PAST');
    if (to <= from) f.add('departureDate', 'DATE_ORDER');
    const nights = nightsOf(from, to);
    const p = ctx.params;
    if (manual) {
      if (group !== 'direct' && group !== 'agent') f.add('channelId', 'NOT_IN_LIST');
      if (nights < p.longStayRequiredFromNights) {
        f.add('departureDate', 'MANUAL_LONG_STAY_BELOW_THRESHOLD');
      } else if (nights > MANUAL_LONG_STAY_MAX_DAYS) {
        f.add('departureDate', 'VALUE_OUT_OF_RANGE');
      }
      if (paymentModel && paymentModel !== 'direct') f.add('paymentModel', 'NOT_IN_LIST');
    } else {
      if (to > from && nights >= p.longStayRequiredFromNights) {
        f.add('departureDate', 'LONG_STAY_REQUIRES_CONTRACT');
      }
      if (group === 'ota') {
        if (paymentModel === 'direct') f.add('paymentModel', 'NOT_IN_LIST');
      } else if (paymentModel && paymentModel !== 'direct') {
        f.add('paymentModel', 'NOT_IN_LIST');
      }
    }
    if (group === 'direct' && !directSource) f.add('directSource', 'REQUIRED');
    if (group !== 'direct' && directSource) f.add('directSource', 'DIRECT_SOURCE_NOT_ALLOWED');
    if (ch.requires_ota_ref && !otaRef) f.add('otaRef', 'REQUIRED');
    if (allowUnassigned && group !== 'ota') f.add('allowUnassigned', 'ALLOW_UNASSIGNED_OTA_ONLY');
    if (group === 'internal' && !internalNote) f.add('internalNote', 'REQUIRED');
    if (otaRef && !f.has('otaRef')) {
      const dup = await tx.query<{ code: string }>(
        `SELECT code FROM reservation WHERE channel_id = $1 AND ota_ref = $2 AND status <> 'cancelled' LIMIT 1`,
        [ch.id, otaRef],
      );
      if (dup.rows[0]) f.add('otaRef', 'OTA_REF_DUPLICATE');
    }
    f.done();

    if (
      !manual &&
      (from > lastBookableArrival(ctx.today, p.bookingWindowDays) || nights > p.shortStayMaxNights)
    ) {
      throw problem('OUTSIDE_BOOKING_WINDOW', {
        errors: [
          {
            field: nights > p.shortStayMaxNights ? 'departureDate' : 'arrivalDate',
            code: 'OUTSIDE_BOOKING_WINDOW',
          },
        ],
      });
    }
    if ((group === 'direct' || group === 'agent') && !booker.phone_e164) {
      throw problem('PHONE_REQUIRED', {
        errors: [{ field: 'bookerGuestId', code: 'PHONE_REQUIRED' }],
      });
    }
    this.assertCapacity(rm, party);

    // BR-113 minimum stay (not for OTA manual entry, not for AC5a).
    if (!manual && group !== 'ota') {
      const need = minStayNights(from, group, p.minStay, p.calendar.specialDates);
      if (need > 0 && nights < need) {
        const orphan =
          p.minStayOrphanException && (await this.isOrphanNightGap(tx, rm.id, from, to));
        if (!orphan) {
          if (!minStayOverrideReason) {
            throw problem('VALIDATION_FAILED', {
              errors: [{ field: 'departureDate', code: 'MIN_STAY_NOT_MET' }],
              extras: { minStayNights: need },
            });
          }
          if (!hasAny(ctx.actor.roles, FDL_PLUS) || group !== 'direct') {
            throw problem('FORBIDDEN_ACTION', {
              detail: 'min stay override needs FDL+ on a direct booking',
            });
          }
        }
      }
    }

    // Prices (BR-101…107, 110, 305) – AC5a has no nightly price (contract outside the system).
    let priced: PriceResult | null = null;
    if (!manual) {
      priced = this.pricing.price(p, {
        room: {
          roomId: rm.id,
          baseOccupancy: rm.base_occupancy,
          listPrices: await this.listPrices(tx, rm.id),
        },
        channelGroup: group,
        arrival: from,
        departure: to,
        party,
        nightlyRates,
        otaRoomAmountVnd,
      });
      if (priced.outOfRange.length > 0) {
        if (group === 'ota') {
          if (!rateOverrideReason) {
            throw problem('VALIDATION_FAILED', {
              errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE_WARNING' }],
              extras: { dates: priced.outOfRange },
            });
          }
        } else {
          throw problem('RATE_OUT_OF_RANGE', {
            errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
            extras: { dates: priced.outOfRange },
          });
        }
      }
    }
    const depositRequired = priced?.depositRequiredVnd ?? 0;
    // B2 condition (b)/(c): a direct/agent booking is guaranteed by a payment ≥ the BR-305 deposit.
    if ((group === 'direct' || group === 'agent') && !manual) {
      if (!initialPayment || initialPayment.amountVnd < depositRequired) {
        throw problem('DEPOSIT_INSUFFICIENT', {
          errors: [{ field: 'initialPayment', code: 'DEPOSIT_INSUFFICIENT' }],
          extras: { depositRequiredVnd: depositRequired },
        });
      }
    }
    await this.assertSellable(tx, rm, from, to);

    // ── writes ──
    await this.occupancy.lockRooms(tx, [rm.id]);
    const code = await this.docNumbers.allocate(tx, 'reservation');
    const id = uuidv7();
    const snapshot = priced
      ? PricingService.snapshot(p, priced, {
          ...(rateOverrideReason ? { rateOverrideReason } : {}),
          ...(otaChannelFeeVnd !== undefined ? { otaChannelFeeVnd } : {}),
          ...(otaRoomAmountVnd !== undefined ? { otaRoomAmountVnd } : {}),
        })
      : { asOf: p.asOf, manualLongStay: true, cancelPolicy: p.cancelPolicy };
    await tx.query(
      `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id, payment_model,
         ota_ref, ota_booked_at, direct_source, booker_guest_id, closer_user_id, arrival_date, departure_date,
         booked_arrival_date, booked_departure_date, adults, children_6_11, children_under_6, eta_time,
         is_complimentary, conflict_state, deposit_required_vnd, total_room_vnd, pricing_snapshot, confirmed_at,
         internal_note, external_contract, manual_long_stay, stay_group_id, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $13, $14, $15, $16, $17,
         $18, $19, 'none', $20, $21, $22, $23, $24, $25, $26, $1, $23, $27, $23)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        manual ? 'long' : 'short',
        ch.id,
        manual ? 'direct' : paymentModel,
        otaRef ?? null,
        otaBookedAt ?? null,
        directSource ?? null,
        booker.id,
        closerUserId ?? null,
        from,
        to,
        party.adults,
        party.children6to11,
        party.childrenUnder6,
        etaTime ?? null,
        group === 'internal' || (priced !== null && priced.totalRoomVnd === 0),
        depositRequired,
        priced?.totalRoomVnd ?? 0,
        JSON.stringify(snapshot),
        ctx.now,
        internalNote ?? null,
        !!manual,
        manual ? JSON.stringify(manual) : null,
        ctx.actor.userId,
      ],
    );
    const segmentId = await insertSegment(tx, id, rm.id, from, to, ctx.now);
    let assignedRoomId: string | null = rm.id;
    let conflict: ProblemError | null = null;
    try {
      await this.occupancy.claim(
        tx,
        { roomId: rm.id, from, to, kind: 'reservation', segmentId, now: ctx.now },
        { withNames: true, persons: countedPersons(party) },
      );
    } catch (err) {
      if (!(err instanceof ProblemError) || group !== 'ota' || !allowUnassigned) throw err;
      conflict = err; // B7b: OTA booking kept in the "unassigned" lane (erd 7, US-139)
      assignedRoomId = null;
    }
    if (conflict) {
      await tx.query('UPDATE reservation_segment SET room_id = NULL WHERE id = $1', [segmentId]);
      await tx.query(`UPDATE reservation SET conflict_state = 'open' WHERE id = $1`, [id]);
      await this.openIncident(tx, ctx, { id, code, from, to, roomId: rm.id });
    }
    if (priced) {
      await insertNights(
        tx,
        {
          reservationId: id,
          segmentId,
          roomId: assignedRoomId,
          channelId: ch.id,
          stayType: 'short',
          state: 'sold',
          isComplimentary: group === 'internal',
          now: ctx.now,
        },
        priced.nights,
      );
    }
    const folioId = await this.money.openFolio(tx, id, ctx.actor.userId);
    if (initialPayment) {
      await this.money.recordInitialPayment(
        tx,
        { id, code, folio_id: folioId },
        initialPayment,
        ctx.actor.userId,
        ctx.now,
        ctx.requestId,
      );
    }
    if (guestEmail && !booker.email_norm) await this.setGuestEmail(tx, booker.id, guestEmail);

    await recordTransition(tx, {
      reservationId: id,
      code,
      from: null,
      to: 'confirmed',
      event: conflict ? 'B7b' : 'B2',
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.created',
      entityType: 'reservation',
      entityId: id,
      entityCode: code,
      after: {
        status: 'confirmed',
        roomNo: assignedRoomId ? rm.room_no : null,
        arrivalDate: from,
        departureDate: to,
        channelCode: ch.code,
        conflictState: conflict ? 'open' : 'none',
        externalContract: !!manual,
      },
      ...(minStayOverrideReason ? { reason: minStayOverrideReason } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await this.audit.recordMoney(tx, {
      action: 'reservation.priced',
      entityType: 'reservation',
      entityId: id,
      entityCode: code,
      after: {
        totalRoomVnd: priced?.totalRoomVnd ?? 0,
        depositRequiredVnd: depositRequired,
        extraPersonFeeVnd: priced?.extraPersonFeeVnd ?? 0,
        nightlyRates: priced?.nights.map((n) => ({ date: n.date, amountVnd: n.amountVnd })) ?? [],
        rateSource: nightlyRates ? 'manual' : 'calendar',
        ...(manual ? { monthlyRentVnd: manual.monthly_rent_vnd } : {}),
      },
      ...(rateOverrideReason ? { reason: rateOverrideReason } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const row = await loadReservation(tx, id, ctx.actor);
    await this.syncKit(tx, ctx, row, assignedRoomId, rm.base_occupancy);
    await outboxAvailability(tx, [{ roomId: assignedRoomId, from, to }], 'reservation.created');
    if (priced)
      await this.money.posted(
        tx,
        await this.confirmedStay(tx, row),
        ctx.actor.userId,
        ctx.requestId,
      );
    await this.hooks.emit(
      tx,
      this.event('created', row, null, conflict ? 'B7b' : 'B2', assignedRoomId),
    );
    return { row: await loadReservation(tx, id, ctx.actor) };
  }

  // ─────────────────────────── B1 – hold (used by quotes / createHoldFromQuote, BE-B) ───────────────────────────

  async createHold(tx: Tx, ctx: BookingContext, input: CreateHoldInput): Promise<ReservationRow> {
    const [channel, room, guest] = await inSequence([
      () => this.channel(tx, input.channelId),
      () => this.room(tx, input.roomId),
      () => this.guest(tx, input.bookerGuestId),
    ]);
    const f = new Fields({});
    if (!channel || !channel.is_active || !['direct', 'agent'].includes(channel.channel_group)) {
      f.add('channelId', 'NOT_IN_LIST');
    }
    if (!room) f.add('roomId', 'NOT_IN_LIST');
    if (!guest) f.add('guestId', 'NOT_IN_LIST');
    const opts = await this.params.get<number[]>(tx, 'hold_hours_options', ctx.today);
    if (!opts.includes(input.holdHours)) f.add('holdHours', 'NOT_IN_LIST');
    if (input.arrivalDate < ctx.today) f.add('arrivalDate', 'DATE_IN_PAST');
    if (input.departureDate <= input.arrivalDate) f.add('departureDate', 'DATE_ORDER');
    f.done();
    const ch = channel as ChannelInfo;
    const rm = room as RoomInfo;
    const booker = guest as GuestRow;
    const latest = await this.params.get<LocalTime>(tx, 'hold_latest_time_on_arrival', ctx.today);
    const deadline = holdDeadline(
      ctx.now,
      input.holdHours,
      input.arrivalDate,
      ctx.today,
      latest,
      ctx.tz,
    );
    if (!deadline.allowed) throw problem('HOLD_NOT_ALLOWED_TODAY');
    if (!booker.phone_e164) {
      throw problem('PHONE_REQUIRED', { errors: [{ field: 'guestId', code: 'PHONE_REQUIRED' }] });
    }
    const party = {
      adults: input.adults,
      children6to11: input.children6to11,
      childrenUnder6: input.childrenUnder6,
    };
    this.assertCapacity(rm, party);
    const p = ctx.params;
    const nights = nightsOf(input.arrivalDate, input.departureDate);
    if (
      nights > p.shortStayMaxNights ||
      input.arrivalDate > lastBookableArrival(ctx.today, p.bookingWindowDays)
    ) {
      throw problem('OUTSIDE_BOOKING_WINDOW');
    }
    let result: PriceResult;
    let snapshot: Record<string, unknown>;
    if (input.priced) {
      result = input.priced.result;
      snapshot = input.priced.snapshot;
    } else {
      result = this.pricing.price(p, {
        room: {
          roomId: rm.id,
          baseOccupancy: rm.base_occupancy,
          listPrices: await this.listPrices(tx, rm.id),
        },
        channelGroup: ch.channel_group,
        arrival: input.arrivalDate,
        departure: input.departureDate,
        party,
      });
      snapshot = PricingService.snapshot(p, result);
    }
    await this.assertSellable(tx, rm, input.arrivalDate, input.departureDate);
    await this.occupancy.lockRooms(tx, [rm.id]);
    const code = await this.docNumbers.allocate(tx, 'reservation');
    const id = uuidv7();
    await tx.query(
      `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id, payment_model,
         booker_guest_id, closer_user_id, quote_id, arrival_date, departure_date, booked_arrival_date,
         booked_departure_date, adults, children_6_11, children_under_6, conflict_state, hold_created_at, hold_hours,
         hold_expires_at, deposit_required_vnd, total_room_vnd, pricing_snapshot, stay_group_id, created_at,
         created_by, updated_at, direct_source)
       VALUES ($1, $2, $3, $4, 'hold', 'short', $5, 'direct', $6, $7, $8, $9, $10, $9, $10, $11, $12, $13, 'none',
         $14, $15, $16, $17, $18, $19, $1, $14, $20, $14, $21)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        ch.id,
        booker.id,
        input.closerUserId ?? null,
        input.quoteId ?? null,
        input.arrivalDate,
        input.departureDate,
        party.adults,
        party.children6to11,
        party.childrenUnder6,
        ctx.now,
        input.holdHours,
        deadline.expiresAt,
        result.depositRequiredVnd,
        result.totalRoomVnd,
        JSON.stringify(snapshot),
        ctx.actor.userId,
        ch.channel_group === 'direct' && ctx.actor.roles.includes('sales_staff')
          ? 'sales_staff'
          : null,
      ],
    );
    const segmentId = await insertSegment(
      tx,
      id,
      rm.id,
      input.arrivalDate,
      input.departureDate,
      ctx.now,
    );
    await this.occupancy.claim(
      tx,
      {
        roomId: rm.id,
        from: input.arrivalDate,
        to: input.departureDate,
        kind: 'hold',
        segmentId,
        now: ctx.now,
      },
      { withNames: hasAny(ctx.actor.roles, FD_PLUS), persons: countedPersons(party) },
    );
    await insertNights(
      tx,
      {
        reservationId: id,
        segmentId,
        roomId: rm.id,
        channelId: ch.id,
        stayType: 'short',
        state: 'hold',
        isComplimentary: false,
        now: ctx.now,
      },
      result.nights,
    );
    await recordTransition(tx, {
      reservationId: id,
      code,
      from: null,
      to: 'hold',
      event: 'B1',
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await this.audit.recordMoney(tx, {
      action: 'reservation.priced',
      entityType: 'reservation',
      entityId: id,
      entityCode: code,
      after: {
        status: 'hold',
        totalRoomVnd: result.totalRoomVnd,
        depositRequiredVnd: result.depositRequiredVnd,
        extraPersonFeeVnd: result.extraPersonFeeVnd,
      },
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    await this.money.openFolio(tx, id, ctx.actor.userId);
    await outboxAvailability(
      tx,
      [{ roomId: rm.id, from: input.arrivalDate, to: input.departureDate }],
      'hold.created',
    );
    const row = await loadReservation(tx, id, { userId: ctx.actor.userId, roles: ['owner'] });
    await this.hooks.emit(tx, this.event('created', row, null, 'B1', rm.id));
    return row;
  }

  // ─────────────────────────── B4 – confirm a hold (payments call it after recording the deposit) ───────────────────────────

  async confirmHold(
    tx: Tx,
    ctx: BookingContext,
    reservationId: string,
    expectedVersion: number,
  ): Promise<ReservationRow> {
    const row = await loadReservation(tx, reservationId, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (row.status !== 'hold') throw this.invalid(row);
    if (row.hold_expires_at && row.hold_expires_at.getTime() <= ctx.now.getTime()) {
      throw problem('HOLD_EXPIRED');
    }
    const paid = await this.money.depositPaid(tx, row);
    if (paid < row.deposit_required_vnd) {
      throw problem('DEPOSIT_INSUFFICIENT', {
        extras: { depositRequiredVnd: row.deposit_required_vnd, depositPaidVnd: paid },
      });
    }
    const stay = await this.confirmFromHold(tx, ctx, row);
    await this.money.posted(tx, stay, ctx.actor.userId, ctx.requestId);
    return loadReservation(tx, row.id, ctx.actor);
  }

  /**
   * B4 core, row already locked and the deposit already checked by the caller (payments – sales-port
   * confirmFromHold): occupancy kind, nights sold, status, kit task, history. Returns the ConfirmedStay the
   * caller posts to the folio.
   */
  async confirmFromHold(tx: Tx, ctx: BookingContext, row: ReservationRow): Promise<ConfirmedStay> {
    if (row.status !== 'hold') throw this.invalid(row);
    const seg = await singleSegment(tx, row.id);
    await this.occupancy.lockRooms(tx, seg.room_id ? [seg.room_id] : []);
    if (seg.room_id) await this.occupancy.setKind(tx, seg.id, 'reservation', ctx.now);
    await sellNights(tx, row.id, ctx.now);
    await tx.query(
      `UPDATE reservation SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, $2), hold_expires_at = NULL,
              updated_at = $2, version = version + 1 WHERE id = $1`,
      [row.id, ctx.now],
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'hold',
      to: 'confirmed',
      event: 'B4',
      now: ctx.now,
      requestId: ctx.requestId,
    });
    const after = await loadReservation(tx, row.id, SYSTEM_ACTOR);
    await this.syncKit(tx, ctx, after, seg.room_id, seg.base_occupancy);
    await this.hooks.emit(tx, this.event('transitioned', after, 'hold', 'B4', seg.room_id));
    return this.confirmedStay(tx, after);
  }

  /** Sold nights + snapshot extra-person fee for the folio postings (sales-port ConfirmedStay). */
  async confirmedStay(tx: Tx, row: ReservationRow): Promise<ConfirmedStay> {
    const { rows } = await tx.query<{ id: string; date: string; amount: number }>(
      `SELECT id, stay_date::text AS date, room_revenue_vnd AS amount FROM stay_night
        WHERE reservation_id = $1 AND night_state = 'sold' ORDER BY stay_date`,
      [row.id],
    );
    const snap = row.pricing_snapshot as {
      extraPersonFeePerNightVnd?: number;
      extraCount?: number;
      otaChannelFeeVnd?: number;
      commissionRatePct?: number | null;
      quote?: { commissionRatePct?: number | null };
    };
    const commissionRatePct = snap.commissionRatePct ?? snap.quote?.commissionRatePct ?? null;
    return {
      reservationId: row.id,
      reservationCode: row.code,
      folioId: row.folio_id ?? '',
      channelId: row.channel_id,
      closerUserId: row.closer_user_id,
      stayType: row.stay_type,
      extraGuestCount: snap.extraCount ?? 0,
      extraPersonPerNightVnd: snap.extraPersonFeePerNightVnd ?? 0,
      otaChannelFeeVnd: snap.otaChannelFeeVnd ?? null,
      nights: rows.map((n) => ({ stayNightId: n.id, date: n.date, roomRevenueVnd: n.amount })),
      commissionRatePctSnapshot: typeof commissionRatePct === 'number' ? commissionRatePct : null,
    };
  }

  // ─────────────────────────── PATCH ───────────────────────────

  async update(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const f = new Fields(body);
    const adults = f.int('adults', { required: false, min: 1, max: 20 });
    const children611 = f.int('children6to11', { required: false, min: 0, max: 20 });
    const childrenUnder6 = f.int('childrenUnder6', { required: false, min: 0, max: 20 });
    const etaTime = f.time('etaTime');
    const closerUserId = f.uuid('closerUserId', false);
    const internalNote = f.text('internalNote', 1000);
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (!['hold', 'confirmed', 'in_house'].includes(row.status)) throw this.invalid(row);
    if (closerUserId && !(await this.isPropertyUser(tx, closerUserId))) {
      f.add('closerUserId', 'NOT_IN_LIST');
    }
    // The closer drives the commission: after confirmation only MGR+ may change it (EP02 5.4).
    if (
      closerUserId &&
      closerUserId !== row.closer_user_id &&
      row.status !== 'hold' &&
      !hasAny(ctx.actor.roles, MGR_PLUS)
    ) {
      throw problem('FORBIDDEN_ACTION', { detail: 'closer change after confirmation needs MGR+' });
    }
    f.done();
    const next = {
      adults: adults ?? row.adults,
      children6to11: children611 ?? row.children_6_11,
      childrenUnder6: childrenUnder6 ?? row.children_under_6,
    };
    const seg = await singleSegmentOrLast(tx, row.id);
    const peopleChanged =
      next.adults !== row.adults ||
      next.children6to11 !== row.children_6_11 ||
      next.childrenUnder6 !== row.children_under_6;
    if (peopleChanged && seg.room_id) {
      const rm = await this.room(tx, seg.room_id);
      if (rm) this.assertCapacity(rm, next);
    }
    await tx.query(
      `UPDATE reservation SET adults = $2, children_6_11 = $3, children_under_6 = $4,
              eta_time = COALESCE($5::time, eta_time), closer_user_id = COALESCE($6, closer_user_id),
              internal_note = CASE WHEN $8 THEN $7 ELSE internal_note END, updated_at = $9,
              version = version + 1
        WHERE id = $1`,
      [
        row.id,
        next.adults,
        next.children6to11,
        next.childrenUnder6,
        etaTime ?? null,
        closerUserId ?? null,
        internalNote ?? null,
        'internalNote' in body,
        ctx.now,
      ],
    );
    for (const [field, oldV, newV] of [
      ['adults', row.adults, next.adults],
      ['children_6_11', row.children_6_11, next.children6to11],
      ['children_under_6', row.children_under_6, next.childrenUnder6],
      ['eta_time', row.eta_time, etaTime ?? row.eta_time],
      ['closer_user_id', row.closer_user_id, closerUserId ?? row.closer_user_id],
    ] as const) {
      if (oldV !== newV) await recordChange(tx, row.id, field, oldV, newV, ctx.now);
    }
    await this.audit.record(tx, {
      category: 'data',
      action: 'reservation.updated',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: {
        adults: row.adults,
        children6to11: row.children_6_11,
        childrenUnder6: row.children_under_6,
      },
      after: next,
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const after = await loadReservation(tx, row.id, ctx.actor);
    if (peopleChanged) {
      await this.syncKit(tx, ctx, after, seg.room_id, seg.base_occupancy);
      await this.hooks.emit(tx, this.event('stay_changed', after, after.status, null, seg.room_id));
    }
    return after;
  }

  // ─────────────────────────── helpers ───────────────────────────

  assertCapacity(rm: RoomInfo, party: { adults: number; children6to11: number }): void {
    const persons = party.adults + party.children6to11;
    if (persons > rm.max_occupancy) {
      throw problem('CAPACITY_EXCEEDED', {
        errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
        extras: { room: rm.room_no, max: rm.max_occupancy },
      });
    }
  }

  /** Room sellable and active over the stay (US-004 AC2) → 409 ROOM_NOT_SELLABLE. */
  async assertSellable(_tx: Tx, rm: RoomInfo, from: LocalDate, to: LocalDate): Promise<void> {
    const active = rm.active_from <= from && (rm.active_to === null || rm.active_to >= to);
    if (!rm.is_sellable || !active) {
      throw problem('ROOM_NOT_SELLABLE', { extras: { room: rm.room_no } });
    }
  }

  private async isOrphanNightGap(tx: Tx, roomId: string, from: LocalDate, to: LocalDate) {
    const { rows } = await tx.query<{ f: string; t: string }>(
      `SELECT lower(stay_range)::text AS f, upper(stay_range)::text AS t FROM room_occupancy
        WHERE room_id = $1 AND active AND (upper(stay_range) = $2::date OR lower(stay_range) = $3::date)`,
      [roomId, from, to],
    );
    return isOrphanGap(
      from,
      to,
      rows.map((r) => ({ from: r.f, to: r.t })),
    );
  }

  private async isPropertyUser(tx: Tx, userId: string): Promise<boolean> {
    const { rows } = await tx.query(
      `SELECT 1 FROM user_property_role WHERE user_id = $1 AND property_id = $2 LIMIT 1`,
      [userId, tx.ctx.propertyId],
    );
    return rows.length > 0;
  }

  private async setGuestEmail(tx: Tx, guestId: string, email: string): Promise<void> {
    await tx.query('SAVEPOINT guest_email');
    try {
      await tx.query('UPDATE guest SET email_norm = $2 WHERE id = $1 AND email_norm IS NULL', [
        guestId,
        email,
      ]);
      await tx.query('RELEASE SAVEPOINT guest_email');
    } catch {
      // Another profile already owns this e-mail (BR-951): keep the booking, do not attach it.
      await tx.query('ROLLBACK TO SAVEPOINT guest_email');
    }
  }

  private parseNightlyRates(f: Fields, raw: unknown) {
    if (raw === undefined || raw === null) return undefined;
    if (!Array.isArray(raw) || raw.length > 60) {
      f.add('nightlyRates', 'VALIDATION_FAILED');
      return undefined;
    }
    const out: Array<{ date: LocalDate; amountVnd: number }> = [];
    for (const r of raw) {
      const o = r as { date?: unknown; amountVnd?: unknown };
      if (
        !o ||
        typeof o.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(o.date) ||
        typeof o.amountVnd !== 'number' ||
        !Number.isSafeInteger(o.amountVnd)
      ) {
        f.add('nightlyRates', 'VALIDATION_FAILED');
        return undefined;
      }
      out.push({ date: o.date, amountVnd: o.amountVnd });
    }
    return out.length ? out : undefined;
  }

  private parseInitialPayment(f: Fields, raw: unknown): InitialPayment | undefined {
    if (raw === undefined || raw === null) return undefined;
    const o = raw as Record<string, unknown>;
    const pf = new Fields(o);
    const type = pf.enumOf('type', ['deposit', 'charge'] as const, true);
    const method = pf.enumOf(
      'method',
      ['cash', 'bank_transfer', 'vietqr', 'card_pos'] as const,
      true,
    );
    const amount = pf.money('amountVnd', { required: true, positive: true });
    const note = pf.text('note', 300);
    const posAuthCode = pf.text('posAuthCode', 12);
    for (const e of pf.errors) f.add(`initialPayment.${e.field}`, e.code);
    if (pf.errors.length) return undefined;
    return {
      type: type as 'deposit' | 'charge',
      method: method as string,
      amountVnd: amount as number,
      ...(typeof o.receivedAt === 'string' ? { receivedAt: o.receivedAt } : {}),
      ...(posAuthCode ? { posAuthCode } : {}),
      ...(note ? { note } : {}),
      ...(isUuid(o.attachmentId) ? { attachmentId: o.attachmentId } : {}),
    };
  }

  private parseManualLongStay(f: Fields, body: Record<string, unknown>) {
    const raw = body.manualLongStay;
    if (raw === undefined || raw === null) return null;
    for (const k of ['nightlyRates', 'otaRoomAmountVnd', 'allowUnassigned', 'initialPayment']) {
      if (body[k] !== undefined && body[k] !== null && body[k] !== false)
        f.add(k, 'VALIDATION_FAILED');
    }
    const mf = new Fields(raw as Record<string, unknown>);
    const rent = mf.money('monthlyRentVnd', { required: true, positive: true });
    const ref = mf.text('externalContractRef', 64);
    const held = mf.money('depositHeldVnd', { required: false, positive: false });
    const note = mf.text('note', 500);
    for (const e of mf.errors) f.add(`manualLongStay.${e.field}`, e.code);
    if (mf.errors.length) return null;
    return {
      monthly_rent_vnd: rent as number,
      ...(ref ? { external_contract_ref: ref } : {}),
      ...(held !== undefined ? { deposit_held_vnd: held } : {}),
      ...(note ? { note } : {}),
    };
  }

  /** erd 7 point 3 + BR-317: incident, deadline, red alert to FD + MGR. */
  private async openIncident(
    tx: Tx,
    ctx: BookingContext,
    r: { id: string; code: string; from: LocalDate; to: LocalDate; roomId: string },
  ): Promise<void> {
    const ids = await tx.query<{ id: string }>(
      `SELECT DISTINCT s.reservation_id AS id FROM room_occupancy o
         JOIN reservation_segment s ON s.id = o.reservation_segment_id
        WHERE o.room_id = $1 AND o.active AND o.stay_range && daterange($2::date, $3::date, '[)')`,
      [r.roomId, r.from, r.to],
    );
    const urgentHours = await this.params.get<number>(
      tx,
      'conflict_urgent_window_hours',
      ctx.today,
    );
    const urgentMinutes = await this.params.get<number>(
      tx,
      'conflict_resolve_minutes_urgent',
      ctx.today,
    );
    const farTime = await this.params.get<LocalTime>(
      tx,
      'conflict_resolve_deadline_far',
      ctx.today,
    );
    const checkin = atLocal(r.from, ctx.params.checkinTime, ctx.tz);
    const urgent = checkin.getTime() - ctx.now.getTime() <= urgentHours * 3_600_000;
    const handleBy = urgent
      ? new Date(ctx.now.getTime() + urgentMinutes * 60_000)
      : atLocal(addDays(ctx.today, 1), farTime, ctx.tz);
    const incidentId = uuidv7();
    await tx.query(
      `INSERT INTO overbooking_incident (id, organization_id, property_id, reservation_id, requested_room_id,
         stay_from, stay_to, conflicting_reservation_ids, source, cause, detected_at, handle_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'desk', 'manual_entry', $9, $10, 'open')`,
      [
        incidentId,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        r.id,
        r.roomId,
        r.from,
        r.to,
        ids.rows.map((x) => x.id),
        ctx.now,
        handleBy,
      ],
    );
    await outboxStaffPush(
      tx,
      {
        kind: urgent ? 'overbooking_urgent' : 'overbooking',
        roles: ['front_desk', 'front_desk_lead', 'manager'],
        refType: 'reservation',
        refId: r.id,
        refCode: r.code,
      },
      `overbooking:${incidentId}`,
    );
  }

  async syncKit(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    roomId: string | null,
    baseOccupancy: number | null,
  ): Promise<void> {
    const extra =
      baseOccupancy === null ? 0 : Math.max(0, row.adults + row.children_6_11 - baseOccupancy);
    await syncExtraGuestKit(tx, {
      reservationId: row.id,
      roomId,
      status: row.status,
      extraCount: extra,
      dueAt: extraGuestKitDue(row.arrival_date, ctx.params.checkinTime, ctx.tz),
      tz: ctx.tz,
      now: ctx.now,
      today: ctx.today,
      userId: ctx.actor.userId,
    });
  }

  event(
    kind: 'created' | 'transitioned' | 'stay_changed',
    row: ReservationRow,
    previous: ReservationStatus | null,
    transition: string | null,
    roomId: string | null,
    reasonCode?: string,
  ) {
    return {
      kind,
      reservationId: row.id,
      code: row.code,
      status: row.status,
      previousStatus: previous,
      transition,
      channelGroup: row.channel_group,
      roomId,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      personsTotal: row.adults + row.children_6_11 + row.children_under_6,
      externalContract: row.external_contract,
      ...(reasonCode ? { reasonCode } : {}),
    };
  }

  assertVersion(row: { version: number }, expected: number): void {
    if (row.version !== expected) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.version } });
    }
  }

  invalid(row: ReservationRow): ProblemError {
    return problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
  }

  // ─────────────────────────── B3 – extend hold ───────────────────────────

  async extendHold(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const max = await this.params.get<number>(tx, 'hold_extension_max_hours', ctx.today);
    const f = new Fields(body);
    const extra = f.int('extraHours', { required: true, min: 1, max });
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (row.status !== 'hold') throw this.invalid(row);
    if (!row.hold_expires_at || row.hold_expires_at.getTime() <= ctx.now.getTime()) {
      throw problem('HOLD_EXPIRED');
    }
    if (row.hold_extended_count > 0) {
      throw problem('INVALID_TRANSITION', {
        errors: [{ field: 'extraHours', code: 'HOLD_EXTENDED_ONCE' }],
        extras: { currentState: row.status },
      });
    }
    const latest = await this.params.get<LocalTime>(tx, 'hold_latest_time_on_arrival', ctx.today);
    const next = holdExtension(
      row.hold_expires_at,
      extra as number,
      row.arrival_date,
      latest,
      ctx.tz,
    );
    await tx.query(
      `UPDATE reservation SET hold_expires_at = $2, hold_extended_count = hold_extended_count + 1, updated_at = $3,
              version = version + 1 WHERE id = $1`,
      [row.id, next, ctx.now],
    );
    await recordChange(
      tx,
      row.id,
      'hold_expires_at',
      row.hold_expires_at.toISOString(),
      next.toISOString(),
      ctx.now,
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'hold',
      to: 'hold',
      event: 'B3',
      now: ctx.now,
      requestId: ctx.requestId,
    });
    return loadReservation(tx, row.id, ctx.actor);
  }

  // ─────────────────────────── B5 / B10 – cancel ───────────────────────────

  async cancel(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number | null,
    body: Record<string, unknown>,
    dryRun: boolean,
  ): Promise<{ row: ReservationRow; cancellation: Record<string, unknown> }> {
    const f = new Fields(body);
    const reasonCode = f.enumOf('reasonCode', CANCEL_REASON_CODES, true);
    const note = f.text('note', 500, {
      min: reasonCode === 'other' ? 3 : 0,
      required: reasonCode === 'other',
    });
    const otaPenalty = f.money('otaPenaltyVnd', { required: false, positive: false });
    if (reasonCode && !USER_CANCEL_REASONS.includes(reasonCode)) f.add('reasonCode', 'NOT_IN_LIST');
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: !dryRun });
    if (!dryRun && expectedVersion !== null) this.assertVersion(row, expectedVersion);
    if (row.status !== 'hold' && row.status !== 'confirmed') throw this.invalid(row);
    // x-scope: SAL own_direct_only (own holds + own direct bookings), CTV own_hold_only.
    if (!hasAny(ctx.actor.roles, FD_PLUS)) {
      const sal = ctx.actor.roles.includes('sales_staff');
      const allowed = row.status === 'hold' || (sal && row.channel_group === 'direct');
      if (!allowed) throw problem('FORBIDDEN_ACTION');
    }
    if (reasonCode === 'ota_cancelled' && row.channel_group !== 'ota')
      f.add('reasonCode', 'NOT_IN_LIST');
    if (otaPenalty !== undefined && row.channel_group !== 'ota')
      f.add('otaPenaltyVnd', 'OTA_PENALTY_OTA_ONLY');
    f.done();

    const quote = await this.cancellationQuote(tx, ctx, row, otaPenalty);
    if (dryRun) return { row, cancellation: quote };

    const segs = await activeSegments(tx, row.id);
    await this.occupancy.lockRooms(
      tx,
      segs.flatMap((s) => (s.room_id ? [s.room_id] : [])),
    );
    for (const s of segs) await this.occupancy.release(tx, { segmentId: s.id }, ctx.now);
    await voidNights(
      tx,
      row.id,
      reasonCode === 'ota_cancelled' ? 'channel_cancelled' : 'cancelled',
      ctx.now,
    );
    await tx.query(
      `UPDATE reservation SET status = 'cancelled', status_before_cancel = status, cancelled_at = $2,
              cancelled_by_type = 'user', cancelled_by = $3, cancel_reason_code = $4, cancel_note = $5,
              hold_expires_at = NULL, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [row.id, ctx.now, ctx.actor.userId, reasonCode, note ?? null],
    );
    if (row.conflict_state === 'open') {
      await tx.query(
        `UPDATE overbooking_incident SET status = 'resolved', resolution = $2, resolved_at = $3, resolved_by = $4,
                version = version + 1
          WHERE reservation_id = $1 AND status = 'open'`,
        [
          row.id,
          reasonCode === 'ota_cancelled' ? 'cancelled_by_channel' : 'cancelled_by_channel',
          ctx.now,
          ctx.actor.userId,
        ],
      );
      await tx.query(`UPDATE reservation SET conflict_state = 'resolved' WHERE id = $1`, [row.id]);
    }
    const transition = row.status === 'hold' ? 'B5' : 'B10';
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: row.status,
      to: 'cancelled',
      event: transition,
      reasonCode,
      reasonNote: note ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    let refundApprovalRequestId: string | undefined;
    const refundable = Number(quote.refundableVnd ?? 0);
    if (refundable > 0) {
      const req = await this.approvals.submit(tx, ctx.actor, {
        type: 'refund',
        amountVnd: refundable,
        reasonCode: reasonCode as string,
        ...(note ? { reasonNote: note } : {}),
        targetType: 'reservation',
        targetId: row.id,
        targetCode: row.code,
      });
      refundApprovalRequestId = req.id;
    }
    if (Number(quote.depositPaidVnd ?? 0) > 0 || otaPenalty !== undefined) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.cancellation_fee',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        after: {
          depositPaidVnd: quote.depositPaidVnd,
          retainedVnd: quote.retainedVnd,
          refundableVnd: quote.refundableVnd,
          ...(otaPenalty !== undefined ? { otaPenaltyVnd: otaPenalty } : {}),
        },
        reason: reasonCode as string,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.cancelled',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      before: { status: row.status },
      after: { status: 'cancelled', reasonCode },
      ...(note ? { reason: note } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const after = await loadReservation(tx, row.id, ctx.actor);
    const seg = segs[segs.length - 1];
    await this.syncKit(tx, ctx, after, seg?.room_id ?? null, seg?.base_occupancy ?? null);
    await outboxAvailability(
      tx,
      segs.map((s) => ({ roomId: s.room_id, from: s.from_date, to: s.to_date })),
      'reservation.cancelled',
    );
    await this.money.voided(tx, row, reasonCode as string, ctx.requestId);
    // SM-09: a cancelled hold sends its lead back to `quoted` (B5).
    if (row.status === 'hold') await this.leads?.onHoldEnded(tx, row.quote_id);
    await this.hooks.emit(
      tx,
      this.event('transitioned', after, row.status, transition, seg?.room_id ?? null, reasonCode),
    );
    return {
      row: after,
      cancellation: { ...quote, ...(refundApprovalRequestId ? { refundApprovalRequestId } : {}) },
    };
  }

  /** CancellationQuote (US-021 AC3/AC4): BR-309 for direct/agent deposits, BR-310 for OTA, nothing for holds. */
  async cancellationQuote(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    otaPenalty: number | undefined,
  ): Promise<Record<string, unknown>> {
    const depositPaid = await this.money.depositPaid(tx, row);
    if (row.channel_group === 'ota') {
      return {
        depositPaidVnd: depositPaid,
        refundableVnd: 0,
        retainedVnd: 0,
        ...(otaPenalty !== undefined ? { otaPenaltyVnd: otaPenalty } : {}),
        policyRef: 'BR-310',
      };
    }
    if (row.status === 'hold' || depositPaid === 0) {
      return {
        depositPaidVnd: depositPaid,
        refundableVnd: depositPaid,
        retainedVnd: 0,
        policyRef: 'BR-308',
      };
    }
    const snap = row.pricing_snapshot as {
      cancelPolicy?: Array<{ minDays: number; refundPct: number }>;
      cancelPeakNoRefund?: boolean;
      hasPeakNight?: boolean;
      feeUnit?: number;
    };
    const tiers = snap.cancelPolicy ?? ctx.params.cancelPolicy;
    const peakNoRefund =
      (snap.cancelPeakNoRefund ?? ctx.params.cancelPeakNoRefund) && !!snap.hasPeakNight;
    const r = directCancelRefund(
      depositPaid,
      noticeDays(row.arrival_date, ctx.today),
      tiers,
      peakNoRefund,
      snap.feeUnit ?? ctx.params.feeUnit,
    );
    return {
      depositPaidVnd: depositPaid,
      refundableVnd: r.refundVnd,
      retainedVnd: r.cancelFeeVnd,
      policyRef: 'BR-309',
    };
  }

  // ─────────────────────────── B7 / B8 – move ───────────────────────────

  async move(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const f = new Fields(body);
    const roomId = f.uuid('roomId', false);
    const newArrival = f.date('arrivalDate', false);
    const newDeparture = f.date('departureDate', false);
    const mode =
      f.enumOf('mode', ['change', 'postpone_instead_of_cancel'] as const, false) ?? 'change';
    const reasonCode = f.enumOf('reasonCode', MOVE_REASONS, true);
    const note = f.text('note', 500, {
      required: reasonCode === 'other',
      min: reasonCode === 'other' ? 3 : 0,
    });
    const resolution = f.enumOf(
      'overbookingResolution',
      ['reassigned_same_group', 'upgraded'] as const,
      false,
    );
    if (!roomId && !newArrival && !newDeparture) f.add('roomId', 'REQUIRED');
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (row.status !== 'confirmed') throw this.invalid(row);
    if (row.external_contract && (newArrival || newDeparture)) {
      f.add('arrivalDate', 'VALIDATION_FAILED');
    }
    if (row.channel_group === 'ota' && (newArrival || newDeparture))
      f.add('arrivalDate', 'OTA_DATES_LOCKED');
    if (row.conflict_state === 'open' && !resolution) f.add('overbookingResolution', 'REQUIRED');
    f.done();
    const from = newArrival ?? row.arrival_date;
    const to = newDeparture ?? row.departure_date;
    const p = ctx.params;
    if (to <= from) f.add('departureDate', 'DATE_ORDER');
    if ((newArrival || newDeparture) && from < ctx.today) f.add('arrivalDate', 'DATE_IN_PAST');
    f.done();
    if (mode === 'postpone_instead_of_cancel') {
      // B8 (BR-309): MGR+, direct/agent, once, within reschedule_window_months of the old arrival.
      if (!hasAny(ctx.actor.roles, MGR_PLUS)) throw problem('FORBIDDEN_ACTION');
      if (row.channel_group !== 'direct' && row.channel_group !== 'agent') throw this.invalid(row);
      if (row.reschedule_count >= p.rescheduleMaxTimes) throw this.invalid(row);
      const limit = addMonths(row.arrival_date, p.rescheduleWindowMonths);
      if (from > limit) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'arrivalDate', code: 'VALUE_OUT_OF_RANGE' }],
        });
      }
    }
    if (!row.external_contract) {
      const nights = nightsOf(from, to);
      if (
        nights > p.shortStayMaxNights ||
        from > lastBookableArrival(ctx.today, p.bookingWindowDays)
      ) {
        throw problem('OUTSIDE_BOOKING_WINDOW');
      }
    }
    const seg = await singleSegment(tx, row.id);
    const targetRoomId = roomId ?? seg.room_id;
    if (!targetRoomId) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'REQUIRED' }] });
    }
    const rm = await this.room(tx, targetRoomId);
    if (!rm)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    this.assertCapacity(rm, { adults: row.adults, children6to11: row.children_6_11 });
    await this.assertSellable(tx, rm, from, to);
    if (row.conflict_state === 'open') {
      await this.assertResolution(tx, ctx, row, rm, resolution as string);
    }

    // Lock order: reservation (done) → rooms ascending.
    await this.occupancy.lockRooms(tx, [targetRoomId, ...(seg.room_id ? [seg.room_id] : [])]);
    const persons = countedPersons({
      adults: row.adults,
      children6to11: row.children_6_11,
      childrenUnder6: 0,
    });
    if (seg.room_id) {
      await this.occupancy.update(
        tx,
        { segmentId: seg.id },
        { roomId: targetRoomId, from, to },
        ctx.now,
        { withNames: true, persons, excludeSegmentIds: [seg.id] },
      );
    } else {
      await this.occupancy.claim(
        tx,
        { roomId: targetRoomId, from, to, kind: 'reservation', segmentId: seg.id, now: ctx.now },
        { withNames: true, persons },
      );
    }
    await tx.query(
      `UPDATE reservation_segment SET room_id = $2, from_date = $3, to_date = $4, change_reason_code = $5,
              change_note = $6, updated_at = $7 WHERE id = $1`,
      [seg.id, targetRoomId, from, to, reasonCode, note ?? null, ctx.now],
    );

    // Nights: kept nights keep their price (BR-106); dropped nights void; new nights at today's prices.
    let totalRoom = row.total_room_vnd;
    if (!row.external_contract) {
      const dropped = datesOutside(row.arrival_date, row.departure_date, from, to);
      if (dropped.length) await voidNights(tx, row.id, 'date_change', ctx.now, dropped);
      await tx.query(
        'UPDATE stay_night SET room_id = $2, updated_at = $3 WHERE reservation_id = $1 AND night_state <> $4',
        [row.id, targetRoomId, ctx.now, 'void'],
      );
      const added = datesOutside(from, to, row.arrival_date, row.departure_date);
      if (added.length) {
        const priced = this.pricing.price(p, {
          room: {
            roomId: rm.id,
            baseOccupancy: rm.base_occupancy,
            listPrices: await this.listPrices(tx, rm.id),
          },
          channelGroup: row.channel_group,
          arrival: from,
          departure: to,
          party: {
            adults: row.adults,
            children6to11: row.children_6_11,
            childrenUnder6: row.children_under_6,
          },
        });
        const newNights: PricedNight[] = priced.nights.filter((n) => added.includes(n.date));
        await insertNights(
          tx,
          {
            reservationId: row.id,
            segmentId: seg.id,
            roomId: targetRoomId,
            channelId: row.channel_id,
            stayType: row.stay_type,
            state: 'sold',
            isComplimentary: row.is_complimentary,
            now: ctx.now,
          },
          newNights,
        );
      }
      const live = await liveNights(tx, row.id);
      totalRoom = live.reduce((s, n) => s + n.amountVnd, 0);
    }
    const postpone = mode === 'postpone_instead_of_cancel';
    await tx.query(
      `UPDATE reservation SET arrival_date = $2, departure_date = $3, total_room_vnd = $4,
              reschedule_count = reschedule_count + $5, conflict_state = CASE WHEN conflict_state = 'open' THEN 'resolved' ELSE conflict_state END,
              updated_at = $6, version = version + 1
        WHERE id = $1`,
      [row.id, from, to, totalRoom, postpone ? 1 : 0, ctx.now],
    );
    if (row.conflict_state === 'open')
      await this.resolveIncident(tx, ctx, row.id, resolution as string);
    if (from !== row.arrival_date)
      await recordChange(
        tx,
        row.id,
        'arrival_date',
        row.arrival_date,
        from,
        ctx.now,
        reasonCode as string,
      );
    if (to !== row.departure_date)
      await recordChange(
        tx,
        row.id,
        'departure_date',
        row.departure_date,
        to,
        ctx.now,
        reasonCode as string,
      );
    if (targetRoomId !== seg.room_id)
      await recordChange(
        tx,
        row.id,
        'room',
        seg.room_no,
        rm.room_no,
        ctx.now,
        reasonCode as string,
      );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'confirmed',
      to: 'confirmed',
      event: postpone ? 'B8' : row.conflict_state === 'open' ? 'B7a' : 'B7',
      reasonCode: reasonCode as string,
      reasonNote: note ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    if (totalRoom !== row.total_room_vnd) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.repriced',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        before: { totalRoomVnd: row.total_room_vnd },
        after: { totalRoomVnd: totalRoom },
        reason: reasonCode as string,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.syncKit(tx, ctx, after, targetRoomId, rm.base_occupancy);
    await outboxAvailability(
      tx,
      [
        { roomId: seg.room_id, from: seg.from_date, to: seg.to_date },
        { roomId: targetRoomId, from, to },
      ],
      postpone ? 'reservation.postponed' : 'reservation.moved',
    );
    await this.hooks.emit(
      tx,
      this.event('stay_changed', after, 'confirmed', postpone ? 'B8' : 'B7', targetRoomId),
    );
    return after;
  }

  /** BR-312 (4): a room of another group is an upgrade – FDL+ only, and must be declared as such. */
  private async assertResolution(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    rm: RoomInfo,
    resolution: string,
  ): Promise<void> {
    const { rows } = await tx.query<{ room_group_id: string | null }>(
      `SELECT rm.room_group_id FROM overbooking_incident i LEFT JOIN room rm ON rm.id = i.requested_room_id
        WHERE i.reservation_id = $1 AND i.status = 'open' ORDER BY i.detected_at DESC LIMIT 1`,
      [row.id],
    );
    const requestedGroup = rows[0]?.room_group_id ?? null;
    const sameGroup = requestedGroup === null || requestedGroup === rm.room_group_id;
    const expected = sameGroup ? 'reassigned_same_group' : 'upgraded';
    if (resolution !== expected) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'resolution', code: 'NOT_IN_LIST' }],
        extras: { expected },
      });
    }
    if (expected === 'upgraded' && !hasAny(ctx.actor.roles, FDL_PLUS)) {
      throw problem('FORBIDDEN_ACTION', { detail: 'upgrade needs FDL+ (BR-312 (4)(ii))' });
    }
  }

  private async resolveIncident(
    tx: Tx,
    ctx: BookingContext,
    reservationId: string,
    resolution: string,
  ) {
    await tx.query(
      `UPDATE overbooking_incident SET status = 'resolved', resolution = $2, resolved_at = $3, resolved_by = $4,
              version = version + 1
        WHERE reservation_id = $1 AND status = 'open'`,
      [reservationId, resolution, ctx.now, ctx.actor.userId],
    );
  }

  // ─────────────────────────── B7a – assign room ───────────────────────────

  async assignRoom(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const f = new Fields(body);
    const roomId = f.uuid('roomId', true);
    const resolution = f.enumOf('resolution', ['reassigned_same_group', 'upgraded'] as const, true);
    const note = f.text('note', 500);
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (row.status !== 'confirmed' || row.conflict_state !== 'open') throw this.invalid(row);
    const rm = await this.room(tx, roomId as string);
    if (!rm)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    await this.assertResolution(tx, ctx, row, rm, resolution as string);
    this.assertCapacity(rm, { adults: row.adults, children6to11: row.children_6_11 });
    await this.assertSellable(tx, rm, row.arrival_date, row.departure_date);
    const seg = await singleSegment(tx, row.id);
    await this.occupancy.lockRooms(tx, [rm.id]);
    await this.occupancy.claim(
      tx,
      {
        roomId: rm.id,
        from: row.arrival_date,
        to: row.departure_date,
        kind: 'reservation',
        segmentId: seg.id,
        now: ctx.now,
      },
      { withNames: true, persons: row.adults + row.children_6_11 },
    );
    await tx.query(
      `UPDATE reservation_segment SET room_id = $2, change_reason_code = 'overbooking', change_note = $3, updated_at = $4
        WHERE id = $1`,
      [seg.id, rm.id, note ?? null, ctx.now],
    );
    await tx.query(
      `UPDATE stay_night SET room_id = $2, updated_at = $3 WHERE reservation_id = $1 AND night_state <> 'void'`,
      [row.id, rm.id, ctx.now],
    );
    await tx.query(
      `UPDATE reservation SET conflict_state = 'resolved', updated_at = $2, version = version + 1 WHERE id = $1`,
      [row.id, ctx.now],
    );
    await this.resolveIncident(tx, ctx, row.id, resolution as string);
    await recordChange(tx, row.id, 'room', null, rm.room_no, ctx.now, resolution as string);
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'confirmed',
      to: 'confirmed',
      event: 'B7a',
      reasonCode: resolution as string,
      reasonNote: note ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.syncKit(tx, ctx, after, rm.id, rm.base_occupancy);
    await outboxAvailability(
      tx,
      [{ roomId: rm.id, from: row.arrival_date, to: row.departure_date }],
      'reservation.assigned',
    );
    await this.hooks.emit(tx, this.event('transitioned', after, 'confirmed', 'B7a', rm.id));
    return after;
  }

  // ─────────────────────────── swap (K12) ───────────────────────────

  async swapRoom(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow[]> {
    const f = new Fields(body);
    const otherId = f.uuid('otherReservationId', true);
    const otherVersion = f.int('otherVersion', { required: true, min: 1 });
    const reason = f.text('reason', 500, { required: true, min: 3 });
    f.date('effectiveDate', false);
    if (otherId === id) f.add('otherReservationId', 'VALIDATION_FAILED');
    f.done();
    // Lock both bookings in id order (deadlock rule), then the rooms ascending.
    const [firstId, secondId] = [id, otherId as string].sort() as [string, string];
    const first = await loadReservation(tx, firstId, ctx.actor, { forUpdate: true });
    const second = await loadReservation(tx, secondId, ctx.actor, { forUpdate: true });
    const a = first.id === id ? first : second;
    const b = first.id === id ? second : first;
    this.assertVersion(a, expectedVersion);
    this.assertVersion(b, otherVersion as number);
    for (const r of [a, b]) {
      if (r.status !== 'confirmed' || r.conflict_state === 'open') throw this.invalid(r);
    }
    const segA = await singleSegment(tx, a.id);
    const segB = await singleSegment(tx, b.id);
    if (!segA.room_id || !segB.room_id) throw this.invalid(a);
    const roomA = (await this.room(tx, segA.room_id)) as RoomInfo;
    const roomB = (await this.room(tx, segB.room_id)) as RoomInfo;
    this.assertCapacity(roomB, { adults: a.adults, children6to11: a.children_6_11 });
    this.assertCapacity(roomA, { adults: b.adults, children6to11: b.children_6_11 });
    await this.occupancy.lockRooms(tx, [roomA.id, roomB.id]);
    // K12: both rows move inside one deferred check (ADR-009 update R1 step 4, BE-ARC-08).
    await this.occupancy.guarded(
      tx,
      async () => {
        await tx.query('SET CONSTRAINTS room_occupancy_no_overlap DEFERRED');
        await tx.query(
          `UPDATE room_occupancy SET room_id = $2, updated_at = $3 WHERE reservation_segment_id = $1`,
          [segA.id, roomB.id, ctx.now],
        );
        await tx.query(
          `UPDATE room_occupancy SET room_id = $2, updated_at = $3 WHERE reservation_segment_id = $1`,
          [segB.id, roomA.id, ctx.now],
        );
        await tx.query('SET CONSTRAINTS room_occupancy_no_overlap IMMEDIATE');
      },
      {
        roomId: roomB.id,
        from: segA.from_date,
        to: segA.to_date,
        persons: a.adults + a.children_6_11,
        exclude: [segA.id, segB.id],
      },
      { withNames: true },
    );
    const out: ReservationRow[] = [];
    for (const [r, seg, target, old] of [
      [a, segA, roomB, roomA],
      [b, segB, roomA, roomB],
    ] as const) {
      await tx.query(
        `UPDATE reservation_segment SET room_id = $2, change_reason_code = 'other', change_note = $3, updated_at = $4
          WHERE id = $1`,
        [seg.id, target.id, reason, ctx.now],
      );
      await tx.query(
        `UPDATE stay_night SET room_id = $2, updated_at = $3 WHERE reservation_id = $1 AND night_state <> 'void'`,
        [r.id, target.id, ctx.now],
      );
      await tx.query(
        `UPDATE reservation SET updated_at = $2, version = version + 1 WHERE id = $1`,
        [r.id, ctx.now],
      );
      await recordChange(tx, r.id, 'room', old.room_no, target.room_no, ctx.now, reason as string);
      await recordTransition(tx, {
        reservationId: r.id,
        code: r.code,
        from: 'confirmed',
        to: 'confirmed',
        event: 'B7',
        reasonCode: 'swap',
        reasonNote: reason ?? null,
        now: ctx.now,
        requestId: ctx.requestId,
      });
      const after = await loadReservation(tx, r.id, ctx.actor);
      await this.syncKit(tx, ctx, after, target.id, target.base_occupancy);
      await this.hooks.emit(tx, this.event('stay_changed', after, 'confirmed', 'B7', target.id));
      out.push(after);
    }
    await outboxAvailability(
      tx,
      [
        { roomId: roomA.id, from: segA.from_date, to: segA.to_date },
        { roomId: roomB.id, from: segB.from_date, to: segB.to_date },
      ],
      'reservation.swapped',
    );
    return out;
  }

  // ─────────────────────────── B11 – no-show ───────────────────────────

  async markNoShow(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const f = new Fields(body);
    const contact = f.text('contactAttemptNote', 500, { required: true, min: 3 });
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (row.status !== 'confirmed') throw this.invalid(row);
    const markTime = await this.params.get<LocalTime>(tx, 'no_show_mark_time', row.arrival_date);
    // BR-311: never automatic, only from the mark time of the arrival day (business day, BR-010).
    if (
      ctx.today < row.arrival_date ||
      ctx.now.getTime() < atLocal(row.arrival_date, markTime, ctx.tz).getTime()
    ) {
      throw problem('INVALID_TRANSITION', {
        extras: {
          currentState: row.status,
          availableFrom: ctx.iso(atLocal(row.arrival_date, markTime, ctx.tz)),
        },
      });
    }
    const segs = await activeSegments(tx, row.id);
    await this.occupancy.lockRooms(
      tx,
      segs.flatMap((s) => (s.room_id ? [s.room_id] : [])),
    );
    for (const s of segs) await this.occupancy.release(tx, { segmentId: s.id }, ctx.now);
    await voidNights(tx, row.id, 'no_show', ctx.now);
    await tx.query(
      `UPDATE reservation SET status = 'no_show', status_before_cancel = 'confirmed', no_show_marked_at = $2,
              no_show_marked_by = $3, no_show_contact_note = $4, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [row.id, ctx.now, ctx.actor.userId, contact],
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'confirmed',
      to: 'no_show',
      event: 'B11',
      reasonNote: contact ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    const deposit = await this.money.depositPaid(tx, row);
    if (deposit > 0) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.no_show_deposit_retained',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        after: { retainedVnd: deposit },
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    if (row.channel_group === 'ota') {
      await outboxStaffPush(
        tx,
        {
          kind: 'ota_no_show_report',
          roles: ['front_desk', 'front_desk_lead'],
          refType: 'reservation',
          refId: row.id,
          refCode: row.code,
        },
        `ota_no_show:${row.id}:${ctx.now.getTime()}`,
      );
    }
    const after = await loadReservation(tx, row.id, ctx.actor);
    const seg = segs[0];
    await this.syncKit(tx, ctx, after, seg?.room_id ?? null, seg?.base_occupancy ?? null);
    await outboxAvailability(
      tx,
      segs.map((s) => ({ roomId: s.room_id, from: s.from_date, to: s.to_date })),
      'reservation.no_show',
    );
    await this.money.voided(tx, row, 'no_show', ctx.requestId);
    await this.hooks.emit(
      tx,
      this.event('transitioned', after, 'confirmed', 'B11', seg?.room_id ?? null),
    );
    return after;
  }

  // ─────────────────────────── B12 – restore no-show ───────────────────────────

  async restoreNoShow(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number | null,
    body: Record<string, unknown>,
    opts: { approved?: boolean } = {},
  ): Promise<{ row: ReservationRow } | { approval: ApprovalRow }> {
    const f = new Fields(body);
    const reason = f.text('reason', 500, { required: true, min: 3 });
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    if (expectedVersion !== null) this.assertVersion(row, expectedVersion);
    if (row.status !== 'no_show') throw this.invalid(row);
    const seg = await singleSegment(tx, row.id);
    const mgr = hasAny(ctx.actor.roles, MGR_PLUS) || opts.approved === true;
    const inBusinessDay = ctx.today === row.arrival_date;
    const free =
      !!seg.room_id &&
      (await this.occupancy.isFree(tx, seg.room_id, row.arrival_date, row.departure_date, [
        seg.id,
      ]));
    if (!mgr && !(inBusinessDay && free)) {
      // BR-315: outside the 3 conditions → approval request (SM-10 no_show_restore), 202.
      const approval = await this.approvals.submit(tx, ctx.actor, {
        type: 'no_show_restore',
        amountVnd: 0,
        reasonCode: 'no_show_restore',
        reasonNote: reason as string,
        targetType: 'reservation',
        targetId: row.id,
        targetCode: row.code,
      });
      return { approval };
    }
    if (!seg.room_id) throw this.invalid(row);
    await this.occupancy.lockRooms(tx, [seg.room_id]);
    await this.occupancy.update(
      tx,
      { segmentId: seg.id },
      { roomId: seg.room_id, from: row.arrival_date, to: row.departure_date, active: true },
      ctx.now,
      { withNames: true, persons: row.adults + row.children_6_11, excludeSegmentIds: [seg.id] },
    );
    // Nights sold again with their snapshot prices (BR-315 (3) "không đổi giá"): the voided rows are revived
    // (same stay_night ids, so the folio does not post the same night twice).
    await tx.query(
      `UPDATE stay_night SET night_state = 'sold', voided_at = NULL, void_reason = NULL, prev_state = NULL,
              updated_at = $2
        WHERE reservation_id = $1 AND night_state = 'void' AND void_reason = 'no_show'`,
      [row.id, ctx.now],
    );
    await tx.query(
      `UPDATE reservation SET status = 'confirmed', status_before_cancel = NULL, no_show_marked_at = NULL,
              no_show_marked_by = NULL, updated_at = $2, version = version + 1 WHERE id = $1`,
      [row.id, ctx.now],
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'no_show',
      to: 'confirmed',
      event: 'B12',
      reasonNote: reason ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await outboxStaffPush(
      tx,
      {
        kind: 'no_show_restored',
        roles: ['manager'],
        refType: 'reservation',
        refId: row.id,
        refCode: row.code,
      },
      `no_show_restored:${row.id}:${ctx.now.getTime()}`,
    );
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.syncKit(tx, ctx, after, seg.room_id, seg.base_occupancy);
    await outboxAvailability(
      tx,
      [{ roomId: seg.room_id, from: row.arrival_date, to: row.departure_date }],
      'reservation.restored',
    );
    await this.money.posted(
      tx,
      await this.confirmedStay(tx, after),
      ctx.actor.userId,
      ctx.requestId,
    );
    await this.hooks.emit(tx, this.event('transitioned', after, 'no_show', 'B12', seg.room_id));
    return { row: after };
  }

  // ─────────────────────────── B6 – hold expiry (SYS) ───────────────────────────

  /**
   * Cancels the expired holds of the property in context (J1). Exactly-once per hold: rows are taken with
   * FOR UPDATE SKIP LOCKED and re-checked (`status = 'hold' AND hold_expires_at <= $now`), so concurrent or
   * repeated runs never cancel a hold twice. A hold with a succeeded deposit is not cancelled (late job).
   */
  async expireHolds(tx: Tx, now: Date): Promise<{ expired: number; keptPaid: number }> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM reservation WHERE status = 'hold' AND hold_expires_at <= $1
        ORDER BY hold_expires_at FOR UPDATE SKIP LOCKED`,
      [now],
    );
    const system = SYSTEM_ACTOR;
    let expired = 0;
    let keptPaid = 0;
    for (const { id } of rows) {
      const row = await loadReservation(tx, id, system);
      if (row.status !== 'hold' || !row.hold_expires_at || row.hold_expires_at > now) continue;
      if ((await this.money.depositPaid(tx, row)) > 0) {
        keptPaid += 1;
        continue;
      }
      const segs = await activeSegments(tx, id);
      for (const s of segs) await this.occupancy.release(tx, { segmentId: s.id }, now);
      await voidNights(tx, id, 'hold_expired', now);
      await tx.query(
        `UPDATE reservation SET status = 'cancelled', status_before_cancel = 'hold', cancelled_at = $2,
                cancelled_by_type = 'system', cancel_reason_code = 'hold_expired', updated_at = $2,
                version = version + 1
          WHERE id = $1 AND status = 'hold'`,
        [id, now],
      );
      await recordTransition(tx, {
        reservationId: id,
        code: row.code,
        from: 'hold',
        to: 'cancelled',
        event: 'B6',
        reasonCode: 'hold_expired',
        now,
      });
      await this.audit.record(tx, {
        category: 'state',
        action: 'reservation.hold_expired',
        entityType: 'reservation',
        entityId: id,
        entityCode: row.code,
        after: { status: 'cancelled', reasonCode: 'hold_expired' },
      });
      await outboxAvailability(
        tx,
        segs.map((s) => ({ roomId: s.room_id, from: s.from_date, to: s.to_date })),
        'hold.expired',
      );
      if (row.created_by) {
        await outboxStaffPush(
          tx,
          { kind: 'hold_expired', roles: [], refType: 'reservation', refId: id, refCode: row.code },
          `hold_expired:${id}`,
        );
      }
      const after = await loadReservation(tx, id, system);
      await this.money.voided(tx, row, 'hold_expired');
      await this.leads?.onHoldEnded(tx, row.quote_id); // SM-09 (B6): lead back to `quoted`
      await this.hooks.emit(
        tx,
        this.event('transitioned', after, 'hold', 'B6', segs[0]?.room_id ?? null, 'hold_expired'),
      );
      expired += 1;
    }
    return { expired, keptPaid };
  }

  // ─────────────────────────── BR-312 relocation (MGR+) ───────────────────────────

  async resolveExternal(
    tx: Tx,
    ctx: BookingContext,
    incidentId: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const f = new Fields(body);
    const cost = f.money('costVnd', { required: true, positive: false });
    const note = f.text('note', 500, { required: true, min: 3 });
    f.done();
    const { rows } = await tx.query<{ reservation_id: string; status: string }>(
      'SELECT reservation_id, status FROM overbooking_incident WHERE id = $1 FOR UPDATE',
      [incidentId],
    );
    const inc = rows[0];
    if (!inc) throw problem('NOT_FOUND');
    if (inc.status !== 'open')
      throw problem('INVALID_TRANSITION', { extras: { currentState: inc.status } });
    const row = await loadReservation(tx, inc.reservation_id, ctx.actor, { forUpdate: true });
    if (row.status !== 'confirmed') throw this.invalid(row);
    const segs = await activeSegments(tx, row.id);
    for (const s of segs) await this.occupancy.release(tx, { segmentId: s.id }, ctx.now);
    await voidNights(tx, row.id, 'relocated_external', ctx.now);
    await tx.query(
      `UPDATE reservation SET status = 'cancelled', status_before_cancel = 'confirmed', cancelled_at = $2,
              cancelled_by_type = 'user', cancelled_by = $3, cancel_reason_code = 'overbooking_relocated',
              cancel_note = $4, conflict_state = 'resolved', updated_at = $2, version = version + 1
        WHERE id = $1`,
      [row.id, ctx.now, ctx.actor.userId, note],
    );
    await tx.query(
      `UPDATE overbooking_incident SET status = 'resolved', resolution = 'relocated_external', cost_vnd = $2,
              decided_by = $3, decision_note = $4, resolved_at = $5, resolved_by = $3, version = version + 1
        WHERE id = $1`,
      [incidentId, cost, ctx.actor.userId, note, ctx.now],
    );
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'confirmed',
      to: 'cancelled',
      event: 'B10',
      reasonCode: 'overbooking_relocated',
      reasonNote: note ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await this.audit.recordMoney(tx, {
      action: 'overbooking.relocation_cost',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: { costVnd: cost },
      ...(note ? { reason: note } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const after = await loadReservation(tx, row.id, ctx.actor);
    await this.syncKit(tx, ctx, after, null, null);
    await this.money.voided(tx, row, 'overbooking_relocated', ctx.requestId);
    await this.hooks.emit(
      tx,
      this.event('transitioned', after, 'confirmed', 'B10', null, 'overbooking_relocated'),
    );
    return incidentId;
  }
}

async function singleSegmentOrLast(tx: Tx, reservationId: string): Promise<SegmentRow> {
  const segs = await activeSegments(tx, reservationId);
  const last = segs[segs.length - 1];
  if (!last) throw new Error(`booking ${reservationId} has no segment`);
  return last;
}

/** Calendar month arithmetic on a LocalDate (end-of-month clamped) – BR-309 "trong 3 tháng". */
export function addMonths(date: LocalDate, months: number): LocalDate {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export type { PricingParams };
