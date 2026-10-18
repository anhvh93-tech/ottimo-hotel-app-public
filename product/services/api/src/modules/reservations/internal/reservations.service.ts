/**
 * Reservation use cases (SM-01; BA EP02 spec; BR-110…113, 302–317, 812, 906; ADR-009). Every method runs in
 * the caller's transaction (UnitOfWork for writes): checks → lock (reservation → rooms ascending) →
 * business writes → state_transition + reservation_change + audit_event → outbox → hooks.
 * Inventory goes through OccupancyService only (EXCLUDE constraint, 409 + conflicts/suggestions).
 */
import { Inject, Injectable } from '@nestjs/common';
import { LeadsService } from '../../sales/public/leads.service';
import { inSequence } from '../../../shared/sequence';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { ChannelGroup, ReservationStatus } from '../../../db/schema';
import { CANCEL_REASON_CODES, type CancelReasonCode } from '../../../db/schema';
import { ProblemError, problem } from '../../../shared/problem';
import { assertNoCardNumber, containsCardNumber } from '../../../shared/validation';
import { type LocalDate, type LocalTime, addDays, atLocal } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { ApprovalService, type ApprovalRow } from '../../approvals/public/approval.service';
import { attachEmailIfEmpty } from '../../guests/public/guest-contact';
import { normalizeEmail } from '../../guests/public/normalize';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { OccupancyService } from '../public/occupancy.service';
import {
  countedPersons,
  directCancelRefund,
  extraGuestKitDue,
  extraPersons,
  discountedNight,
  effectiveDiscountPct,
  losDiscountPct,
  returnGuestOf,
  holdDeadline,
  holdExtension,
  isOrphanGap,
  isSpecialDate,
  lastBookableArrival,
  minStayNights,
  nightDates,
  nightsOf,
  noticeDays,
  requiredDepositAfterChange,
} from '../public/pricing';
import type { NightSource } from '../public/added-night-price';
import { type PriceResult, type PricingParams, PricingService } from '../public/pricing.service';
import { type InitialPayment, ReservationHooks } from '../public/reservation-hooks';
import type { ConfirmedStay } from '../public/sales-port';
import { MoneyBridge } from './money-bridge';
import { type BookingMovePlan, MovePlanner, moveCauseOf } from './move-planner';
import { boughtRoomOf, protectedBaseOf, roomChangeHistory, stayRoomHistory } from './room-history';
import { FDL_PLUS, FD_PLUS, MGR_PLUS, allowedActions, hasAny } from './allowed-actions';
import { type BookingContext, bookingContext } from './booking-context';
import { syncExtraGuestKit } from './extra-guest-kit';
import { Fields, isUuid } from './inputs';
import { type BookerRow, otaGuestCount, toReservationDto } from './reservation-dto';
import {
  type Actor,
  type ReservationRow,
  type SegmentRow,
  activeSegments,
  insertNights,
  insertSegment,
  isOwn,
  liveNightRows,
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
/** 0.3.5 A-19 MoveReasonCode (DOM D-5). */
const MOVE_REASONS = [
  'guest_request',
  'property_fault',
  'overbooking',
  'upgrade',
  'inventory_optimize',
  'force_majeure',
  'other',
] as const;
type MoveReason = (typeof MOVE_REASONS)[number];

/** Parsed body of `moveReservation` (= query of `previewMoveReservation`). */
interface MoveInput {
  roomId: string | undefined;
  arrival: LocalDate | undefined;
  departure: LocalDate | undefined;
  mode: 'change' | 'postpone_instead_of_cancel';
  reasonCode: MoveReason;
  note: string | undefined;
  capacityAck: string | undefined;
  resolution: 'reassigned_same_group' | 'upgraded' | undefined;
  applyDifference: boolean;
  expectedDeltaVnd: number | undefined;
}

/** A checked move with its money plan (ARC 10.4: the preview and the write share it). */
interface PreparedMove {
  seg: SegmentRow;
  rm: RoomInfo;
  from: LocalDate;
  to: LocalDate;
  roomChanges: boolean;
  overCapacity: boolean;
  plan: BookingMovePlan;
  /** Change of the folio the guest sees (room + BR-110 fee + OTA difference − FOC that follows). */
  folioDeltaVnd: number;
  warnings: Array<{ code: string; field?: string }>;
}

/** Holds handled per J1 run (SEC-BE-24) – technical batch size; the next tick takes the rest. */
const HOLD_EXPIRY_BATCH = 100;

/**
 * 0.3.7 D1 S4-08 (BE-B): `retainLines[{lineId, reason}]` of cancelReservation / markNoShow – shape only here
 * (≤ 50 items, uuid, reason ≤ 500); the folio checks the lines and the reason length (closeStayPreview).
 */
function retainLinesOf(f: Fields, raw: unknown): Array<{ lineId: string; reason: string }> {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    f.add('retainLines', 'VALIDATION_FAILED');
    return [];
  }
  if (raw.length > 50) f.add('retainLines', 'VALUE_OUT_OF_RANGE');
  const out: Array<{ lineId: string; reason: string }> = [];
  raw.slice(0, 50).forEach((item, i) => {
    const it = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    if (typeof it.lineId !== 'string' || !isUuid(it.lineId)) {
      f.add(
        `retainLines[${i}].lineId`,
        typeof it.lineId === 'undefined' ? 'REQUIRED' : 'VALIDATION_FAILED',
      );
      return;
    }
    const reason = typeof it.reason === 'string' ? it.reason : '';
    // V-09 (BE-A review S4, as the other reason fields): a card number answers CARD_NUMBER_DETECTED – checked
    // before the length (BUG-R2-043), never stored nor logged.
    if (containsCardNumber(reason)) {
      f.add(`retainLines[${i}].reason`, 'CARD_NUMBER_DETECTED');
      return;
    }
    if (reason.length > 500) {
      f.add(`retainLines[${i}].reason`, 'TOO_LONG');
      return;
    }
    out.push({ lineId: it.lineId, reason });
  });
  return out;
}

/** Error code for job reports – never a message with data (SR-LOG-04). */
function errorCode(err: unknown): string {
  if (err instanceof ProblemError) return err.code;
  if (typeof err === 'object' && err !== null && 'code' in err)
    return String((err as { code: unknown }).code);
  return err instanceof Error ? err.name : 'error';
}

/** Input limit of a manual long stay (BA EP02 4 – data-entry guard, not a business rule). */
const MANUAL_LONG_STAY_MAX_DAYS = 731;

/** A night price of an in-house stay being re-tiered (B13, B9a – BR-107 D-8). */
export interface StayNightPrice {
  date: LocalDate;
  calendarVnd: number;
  amountVnd: number;
  /** typed by a person (snapshot `source: manual`) */
  manual: boolean;
  /**
   * ARC 16.18 (BR-417 appendix 5A step 3): the source recorded by the operation – `default` = the suggested price
   * written untouched; absent = `manual` ? 'manual' : 'calendar'.
   */
  source?: NightSource;
  /** `manual` only: the room bought when typed (null/absent = the stay's origin room). */
  anchorRoomId?: string | null;
}

/**
 * ARC 16.18: snapshot source (+ anchor of a typed night) of each night after a move plan – `kept` nights keep what
 * the snapshot had, re-priced / added ones take the source the planner gave them.
 */
function plannedSource(
  row: ReservationRow,
  planned: ReadonlyMap<string, { priceSource: 'kept' | 'calendar' | 'default' }>,
): (date: string) => { source: string; anchorRoomId?: string } {
  const prior = new Map(
    (
      (
        row.pricing_snapshot as {
          nights?: Array<{ date: string; source?: string; anchorRoomId?: string | null }>;
        }
      ).nights ?? []
    ).map((n) => [n.date, n]),
  );
  return (date) => {
    const n = planned.get(date);
    if (n && n.priceSource !== 'kept') return { source: n.priceSource };
    const p = prior.get(date);
    const source = p?.source ?? 'calendar';
    return source === 'manual' && p?.anchorRoomId
      ? { source, anchorRoomId: p.anchorRoomId }
      : { source };
  };
}

/** Snapshot entry of a night (`pricing_snapshot.nights[]`). */
function snapshotNight(x: StayNightPrice) {
  const source: NightSource = x.source ?? (x.manual ? 'manual' : 'calendar');
  return {
    date: x.date,
    amountVnd: x.amountVnd,
    calendarVnd: x.calendarVnd,
    source,
    ...(source === 'manual' && x.anchorRoomId ? { anchorRoomId: x.anchorRoomId } : {}),
  };
}

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
    @Inject(LeadsService) private readonly leads: LeadsService,
  ) {}

  /** ONE calculation of a room move – B7/B7a/B8 here, B14 through the stay port (ARC 10.4, S4-04/05/07/21). */
  readonly planner: MovePlanner = new MovePlanner({
    room: (tx, id) => this.room(tx, id),
    roomListPrices: (tx, id) => this.listPrices(tx, id),
    nightExtra: (ctx, row, party, base) => this.nightExtra(ctx, row, party, base),
    parameter: (tx, key, asOf) => this.params.get(tx, key, asOf),
    differenceLines: (tx, row) => this.money.differenceLines(tx, row),
    reductions: (tx, row, nights) => this.money.previewReductions(tx, row, nights),
  });

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

  /**
   * Full Reservation JSON for the caller (allowedActions by state AND role) – getReservation: also the deposit
   * notices (0.3.7 bổ sung 1 – required here, may be absent from action responses; the serializer drops
   * `note` (D12c) / `createdByName` (D27) for SAL/CTV).
   */
  async dto(tx: Tx, ctx: BookingContext, id: string): Promise<Record<string, unknown>> {
    const row = await loadReservation(tx, id, ctx.actor);
    const out = await this.dtoOf(tx, ctx, row);
    return { ...out, depositNotices: await this.hooks.depositNotices(tx, row.id) };
  }

  async dtoOf(tx: Tx, ctx: BookingContext, row: ReservationRow): Promise<Record<string, unknown>> {
    const [segments, booker, nights] = await inSequence([
      () => activeSegments(tx, row.id),
      () => this.guest(tx, row.booker_guest_id),
      () => liveNights(tx, row.id),
    ]);
    const markTime = await this.params.get<LocalTime>(tx, 'no_show_mark_time', ctx.today);
    const markAt =
      row.status === 'confirmed' && row.arrival_date <= ctx.today
        ? atLocal(row.arrival_date, markTime, ctx.tz)
        : null;
    let restoreWithinRules = false;
    if (row.status === 'no_show' && row.channel_group !== 'ota') {
      const seg = segments[0];
      restoreWithinRules =
        ctx.today === row.arrival_date &&
        !!seg?.room_id &&
        (await this.occupancy.isFree(tx, seg.room_id, row.arrival_date, row.departure_date, [
          seg.id,
        ]));
    }
    const depositPaidVnd = await this.money.depositPaid(tx, row);
    let requestedGroup: { id: string; code: string } | null = null;
    if (row.conflict_state === 'open') {
      const g = await tx.query<{ id: string; code: string }>(
        `SELECT rg.id, rg.code FROM overbooking_incident i
           JOIN room rr ON rr.id = i.requested_room_id JOIN room_group rg ON rg.id = rr.room_group_id
          WHERE i.reservation_id = $1 AND i.status = 'open' ORDER BY i.detected_at DESC LIMIT 1`,
        [row.id],
      );
      requestedGroup = g.rows[0] ?? null;
    }
    const actions = allowedActions(ctx.actor.roles, {
      status: row.status,
      conflictState: row.conflict_state,
      capacityConflict: row.capacity_conflict_at !== null,
      channelGroup: row.channel_group,
      arrivalDate: row.arrival_date,
      departureDate: row.departure_date,
      today: ctx.today,
      holdExpired: !!row.hold_expires_at && row.hold_expires_at.getTime() <= ctx.now.getTime(),
      holdExtendedCount: row.hold_extended_count,
      own: isOwn(ctx.actor, row),
      noShowMarkable: markAt !== null && ctx.now.getTime() >= markAt.getTime(),
      restoreWithinRules,
      rescheduleCount: row.reschedule_count,
      rescheduleMaxTimes: ctx.params.rescheduleMaxTimes,
    });
    // US-022: booker + active party members (people recorded on the booking – counted by frontdesk).
    const partyMembers = await this.hooks.partyCount(tx, row.id);
    // BUG-R2-031: registration (registration module) and the folio's balance due (folio module).
    const registration = row.parent_reservation_id
      ? null
      : await this.hooks.registrationSummary(tx, row.id);
    const balanceDueVnd = row.folio_id ? await this.money.balanceDue(tx, row) : undefined;
    return toReservationDto({
      row,
      segments,
      booker,
      partyPresentCount: 1 + partyMembers,
      registration,
      ...(balanceDueVnd !== undefined ? { balanceDueVnd } : {}),
      nights: nights.map((n) => ({
        date: n.date,
        amountVnd: n.amountVnd,
        ...(n.calendarVnd !== null ? { calendarRateVnd: n.calendarVnd } : {}),
      })),
      actions,
      iso: ctx.iso,
      noShowAvailableFrom: markAt,
      depositPaidVnd,
      requestedGroup,
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
    const closerKind = closerUserId ? await this.closerKind(tx, closerUserId) : null;
    if (closerUserId && !closerKind) f.add('closerUserId', 'NOT_IN_LIST');
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
    this.checkCloserForChannel(
      f,
      group,
      group === 'direct' ? directSource : null,
      closerUserId,
      closerKind,
    );
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
    // DOM D-1 (BR-312 (1)): an OTA booking is never refused for capacity – warning + reason, then saved with a
    // `capacity` conflict flag (check-in blocked until solved). Other channels stay blocked (422).
    let capacityAck: string | undefined;
    if (group === 'ota' && countedPersons(party) > rm.max_occupancy) {
      capacityAck = f.text('capacityWarningAckReason', 500, { min: 3 });
      f.done();
      if (!capacityAck) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED_WARNING' }],
          extras: { roomNo: rm.room_no, max: rm.max_occupancy },
        });
      }
    } else {
      this.assertCapacity(rm, party);
    }

    // BR-113 minimum stay – not for OTA manual entry, not for the internal channel (DOM D-7), not for AC5a.
    if (!manual && group !== 'ota' && group !== 'internal') {
      const need = minStayNights(from, group, p.minStay, p.calendar.specialDates);
      if (need > 0 && nights < need) {
        const orphan =
          p.minStayOrphanException && (await this.isOrphanNightGap(tx, rm.id, from, to));
        if (!orphan) {
          if (!minStayOverrideReason) {
            throw problem('VALIDATION_FAILED', {
              errors: [{ field: 'departureDate', code: 'MIN_STAY_NOT_MET' }],
              extras: {
                minStayNights: need,
                // 0.3.5 A-05: rooms of the group where the asked range IS an orphan night (BR-113 a).
                suggestions: p.minStayOrphanException
                  ? await this.orphanRooms(tx, rm, from, to, countedPersons(party))
                  : [],
              },
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
          groupCode: rm.group_code,
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
    await this.assertSellable(tx, rm, from, to);

    // ── writes ──
    await this.occupancy.lockRooms(tx, [rm.id]);
    await this.assertCapacityStable(tx, [rm]);
    const code = await this.docNumbers.allocate(tx, 'reservation');
    const id = uuidv7();
    const folioId = uuidv7(); // reservation.folio_id ↔ folio.primary_reservation_id, both DEFERRED
    const snapshot = priced
      ? PricingService.snapshot(p, priced, {
          // Fix round 4 (5), DOM 17/10: the party the OTA priced (OTA guest count – BR-110/BR-307).
          ...(group === 'ota' ? { bookedParty: party } : {}),
          ...(rateOverrideReason ? { rateOverrideReason } : {}),
          ...(otaChannelFeeVnd !== undefined ? { otaChannelFeeVnd } : {}),
          ...(otaRoomAmountVnd !== undefined ? { otaRoomAmountVnd } : {}),
        })
      : {
          asOf: p.asOf,
          manualLongStay: true,
          cancelPolicy: p.cancelPolicy,
          bookingRateSource: 'calendar',
        };
    await tx.query(
      `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id, payment_model,
         ota_ref, ota_booked_at, direct_source, booker_guest_id, closer_user_id, arrival_date, departure_date,
         booked_arrival_date, booked_departure_date, adults, children_6_11, children_under_6, eta_time,
         is_complimentary, conflict_state, deposit_required_vnd, total_room_vnd, pricing_snapshot, confirmed_at,
         internal_note, external_contract, manual_long_stay, stay_group_id, created_at, created_by, updated_at,
         folio_id)
       VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $13, $14, $15, $16, $17,
         $18, $19, 'none', $20, $21, $22, $23, $24, $25, $26, $1, $23, $27, $23, $28)`,
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
        folioId,
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
      // 0.3.7 D1 (BR-012 (4), ARC assumption (a)): a conflict booking has no room the guest was told.
      await tx.query(
        `UPDATE reservation SET conflict_state = 'open', room_disclosed_to_guest = false WHERE id = $1`,
        [id],
      );
      await this.openIncident(tx, ctx, { id, code, from, to, roomId: rm.id });
    } else if (capacityAck) {
      // DOM D-1 / A-20: OTA over capacity – kept in its room, flagged, "Cần chú ý" (push FD/FDL/MGR).
      await tx.query(
        `UPDATE reservation SET capacity_conflict_at = $2, capacity_ack_reason = $3, capacity_ack_by = $4
          WHERE id = $1`,
        [id, ctx.now, capacityAck, ctx.actor.userId],
      );
      await outboxStaffPush(
        tx,
        {
          kind: 'capacity_conflict',
          roles: ['front_desk', 'front_desk_lead', 'manager'],
          refType: 'reservation',
          refId: id,
          refCode: code,
        },
        `capacity_conflict:${id}`,
      );
    }
    // EP02 3.4 order: … → OOO → double booking (claim above) → money (BUG-R2-019).
    if ((group === 'direct' || group === 'agent') && !manual) {
      const paid = initialPayment?.amountVnd ?? 0;
      if (paid < depositRequired) {
        throw problem('DEPOSIT_INSUFFICIENT', {
          errors: [{ field: 'initialPayment', code: 'DEPOSIT_INSUFFICIENT' }],
          extras: {
            depositRequiredVnd: depositRequired,
            depositPaidVnd: paid,
            shortfallVnd: depositRequired - paid,
          },
        });
      }
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
    await this.money.openFolio(tx, id, folioId, ctx.actor.userId);
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
    if (guestEmail && !booker.email_norm) {
      await attachEmailIfEmpty(tx, this.audit, {
        guestId: booker.id,
        email: guestEmail,
        now: ctx.now,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }

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
      ...(minStayOverrideReason || capacityAck
        ? { reason: [minStayOverrideReason, capacityAck].filter(Boolean).join(' | ') }
        : {}),
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
        rateSource: nightlyRates?.some((r) => r.edited !== false) ? 'manual' : 'calendar',
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
    await this.assertOpenHoldLimit(tx, ctx);
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
          groupCode: rm.group_code,
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
    await this.assertCapacityStable(tx, [rm]);
    const code = await this.docNumbers.allocate(tx, 'reservation');
    const id = uuidv7();
    const folioId = uuidv7();
    await tx.query(
      `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id, payment_model,
         booker_guest_id, closer_user_id, quote_id, arrival_date, departure_date, booked_arrival_date,
         booked_departure_date, adults, children_6_11, children_under_6, conflict_state, hold_created_at, hold_hours,
         hold_expires_at, deposit_required_vnd, total_room_vnd, pricing_snapshot, stay_group_id, created_at,
         created_by, updated_at, direct_source, folio_id)
       VALUES ($1, $2, $3, $4, 'hold', 'short', $5, 'direct', $6, $7, $8, $9, $10, $9, $10, $11, $12, $13, 'none',
         $14, $15, $16, $17, $18, $19, $1, $14, $20, $14, $21, $22)`,
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
        folioId,
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
    await this.money.openFolio(tx, id, folioId, ctx.actor.userId);
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
      throw problem('HOLD_EXPIRED', { extras: { expiredAt: ctx.iso(row.hold_expires_at) } });
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
    const { rows } = await tx.query<{
      id: string;
      date: string;
      amount: number;
      extra: number | null;
      cnt: number | null;
    }>(
      `SELECT id, stay_date::text AS date, room_revenue_vnd AS amount, extra_person_fee_vnd AS extra,
              extra_person_count AS cnt
         FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold' ORDER BY stay_date`,
      [row.id],
    );
    const snap = row.pricing_snapshot as {
      extraPersonFeePerNightVnd?: number;
      extraCount?: number;
      otaChannelFeeVnd?: number;
      commissionRatePct?: number | null;
      quote?: { commissionRatePct?: number | null };
      extraNightDates?: string[];
    };
    const commissionRatePct = snap.commissionRatePct ?? snap.quote?.commissionRatePct ?? null;
    const extraNights = new Set(snap.extraNightDates ?? []);
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
      nights: rows.map((n) => ({
        stayNightId: n.id,
        date: n.date,
        roomRevenueVnd: n.amount,
        // NULL = the booking-level fee of the snapshot (every night alike); a value = this night's own fee.
        extraPersonVnd: n.extra ?? snap.extraPersonFeePerNightVnd ?? 0,
        // 0032 – the bill label "{n} người" of that night (NULL count = the booking-level one).
        extraPersonCount: n.cnt ?? (n.extra === null || n.extra > 0 ? (snap.extraCount ?? 0) : 0),
        // E05-11: night sold at check-out after the BR-412 limit (bill.line.extra_night).
        ...(extraNights.has(n.date) ? { extraNight: true } : {}),
      })),
      commissionRatePctSnapshot: typeof commissionRatePct === 'number' ? commissionRatePct : null,
      // BE-B review S3 (DOM BE-13): the folio keeps the OTA prepaid receipt in step with the nights.
      paymentModel: row.payment_model,
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
    const capacityAck = f.text('capacityWarningAckReason', 500, { min: 3 });
    // 0.3.6 bổ sung 4 (DOM 17/10, BR-110/BR-307): who changed the head count of an OTA booking before check-in.
    const partySource = f.enumOf(
      'partyChangeSource',
      ['ota_modification', 'guest_direct'] as const,
      false,
    );
    const rawRef = body.otaModificationRef;
    let otaModificationRef: string | undefined;
    if (rawRef !== undefined && rawRef !== null) {
      const ref = typeof rawRef === 'string' ? rawRef.trim() : '';
      if (!/^[A-Za-z0-9\-/._]{3,64}$/.test(ref)) f.add('otaModificationRef', 'VALIDATION_FAILED');
      else otaModificationRef = ref;
    }
    // B-28 (US-025 AC7): "door code / card handed over" tick added later – only `true`, once, in house.
    const doorHandedOver = body.doorAccessHandedOver;
    if (doorHandedOver !== undefined && doorHandedOver !== true) {
      f.add('doorAccessHandedOver', 'NOT_IN_LIST');
    }
    // 0.3.7 D1 (BR-012 (4)): "đã báo căn cho khách" – only `true` (one way), FD+, before check-in.
    const disclosed = body.roomDisclosedToGuest;
    if (disclosed !== undefined && disclosed !== true) f.add('roomDisclosedToGuest', 'NOT_IN_LIST');
    // 0.3.7 D1 (S4-09, BR-424 v0.3.6): "khách đã chuyển về căn cũ" – only `true`, once, on the child booking.
    const returned = body.roomReturnRecorded;
    if (returned !== undefined && returned !== true) f.add('roomReturnRecorded', 'NOT_IN_LIST');
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    if (!['hold', 'confirmed', 'in_house'].includes(row.status)) throw this.invalid(row);
    if (returned === true) {
      if (!hasAny(ctx.actor.roles, FD_PLUS)) throw problem('FORBIDDEN_ACTION');
      await this.hooks.roomReturn(tx, {
        reservationId: row.id,
        userId: ctx.actor.userId,
        roles: ctx.actor.roles,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    if (disclosed === true) {
      if (!hasAny(ctx.actor.roles, FD_PLUS)) throw problem('FORBIDDEN_ACTION');
      if (row.status !== 'hold' && row.status !== 'confirmed') throw this.invalid(row);
      if (!row.room_disclosed_to_guest) {
        await tx.query('UPDATE reservation SET room_disclosed_to_guest = true WHERE id = $1', [
          row.id,
        ]);
        await this.audit.record(tx, {
          category: 'state',
          action: 'reservation.room_disclosed',
          entityType: 'reservation',
          entityId: row.id,
          entityCode: row.code,
          after: { roomDisclosedToGuest: true },
          ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
        });
      }
    }
    if (doorHandedOver === true) {
      if (!hasAny(ctx.actor.roles, FD_PLUS)) throw problem('FORBIDDEN_ACTION');
      if (row.status !== 'in_house' || row.door_access_handed_over_at !== null) {
        throw this.invalid(row);
      }
      await tx.query(
        `UPDATE reservation SET door_access_handed_over_at = $2, door_access_handed_over_by = $3
          WHERE id = $1`,
        [row.id, ctx.now, ctx.actor.userId],
      );
      await this.audit.record(tx, {
        category: 'state',
        action: 'reservation.door_access_handed_over',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        after: { doorAccessHandedOver: true },
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    if (closerUserId) {
      const kind = await this.closerKind(tx, closerUserId);
      if (!kind) f.add('closerUserId', 'NOT_IN_LIST');
      else this.checkCloserForChannel(f, row.channel_group, row.direct_source, closerUserId, kind);
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
    const next = {
      adults: adults ?? row.adults,
      children6to11: children611 ?? row.children_6_11,
      childrenUnder6: childrenUnder6 ?? row.children_under_6,
    };
    const peopleChanged =
      next.adults !== row.adults ||
      next.children6to11 !== row.children_6_11 ||
      next.childrenUnder6 !== row.children_under_6;
    // 0.3.6 bổ sung 4 (s3-contract 7.8 (1), BR-110-14…16): an OTA booking's head count changed before check-in
    // needs its source – `ota_modification` (+ extranet ref) moves the OTA guest count, `guest_direct` keeps it
    // and the people above max(standard, OTA count) pay BR-110 at the desk. In house: the party flow, always
    // `guest_direct`. Other channels: not allowed.
    const otaBooking = row.channel_group === 'ota';
    const beforeCheckin = row.status === 'hold' || row.status === 'confirmed';
    if (!otaBooking) {
      if (partySource !== undefined) f.add('partyChangeSource', 'NOT_ALLOWED');
      if (otaModificationRef !== undefined) f.add('otaModificationRef', 'NOT_ALLOWED');
    } else {
      if (
        peopleChanged &&
        beforeCheckin &&
        partySource === undefined &&
        !f.has('partyChangeSource')
      ) {
        f.add('partyChangeSource', 'REQUIRED');
      }
      if (partySource === 'ota_modification' && !beforeCheckin) {
        f.add('partyChangeSource', 'NOT_ALLOWED');
      }
      if (partySource === 'ota_modification' && otaModificationRef === undefined) {
        if (!f.has('otaModificationRef')) f.add('otaModificationRef', 'REQUIRED');
      }
      if (partySource !== 'ota_modification' && otaModificationRef !== undefined) {
        f.add('otaModificationRef', 'NOT_ALLOWED');
      }
    }
    f.done();
    // Fix round 5 (C): "OTA sửa đơn" recorded AFTER the desk already took the new count as `guest_direct` (same
    // head count, OTA count still the old one) → the OTA count follows and the BR-110 fee is re-priced (else the
    // guest pays twice – OTA and desk, BR-110 (i)).
    const storedBooked = (row.pricing_snapshot as { bookedParty?: typeof next }).bookedParty;
    const otaRebook =
      otaBooking &&
      beforeCheckin &&
      !peopleChanged &&
      partySource === 'ota_modification' &&
      (!storedBooked ||
        storedBooked.adults !== next.adults ||
        storedBooked.children6to11 !== next.children6to11 ||
        storedBooked.childrenUnder6 !== next.childrenUnder6);
    const repriced = peopleChanged || otaRebook;
    const seg = await singleSegmentOrLast(tx, row.id);
    let capacityState: 'over' | 'ok' | null = null;
    let baseOccupancy: number | null = null;
    if (repriced && seg.room_id) {
      // QC-S2-01: lock the room (reservation already locked – lock order kept) BEFORE reading max_occupancy,
      // so a concurrent updateRoom either waits for us (and sees the new head count) or we see its value.
      await this.occupancy.lockRooms(tx, [seg.room_id]);
      const rm = await this.room(tx, seg.room_id);
      if (rm) {
        baseOccupancy = rm.base_occupancy;
        const over = next.adults + next.children6to11 > rm.max_occupancy;
        if (over && row.channel_group === 'ota') {
          // DOM D-1: OTA head count above capacity → warning + reason, flagged (not refused).
          if (!capacityAck) {
            throw problem('VALIDATION_FAILED', {
              errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED_WARNING' }],
              extras: { roomNo: rm.room_no, max: rm.max_occupancy },
            });
          }
          capacityState = 'over';
        } else {
          this.assertCapacity(rm, next);
          if (row.capacity_conflict_at) capacityState = 'ok';
        }
      }
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
    if (capacityState === 'over') {
      await this.setCapacityConflict(tx, ctx, row, capacityAck as string);
    } else if (capacityState === 'ok') {
      await this.clearCapacityConflict(tx, row.id);
    }
    if (repriced && baseOccupancy !== null) {
      if (row.status === 'in_house') {
        // DOM S3-13 / BE-16: an in-house change applies from tonight; the nights already stayed keep their fee.
        await this.peopleFromNight(tx, ctx, row, next, ctx.today, { write: true });
      } else {
        // OTA (DOM 17/10): `ota_modification` → the OTA guest count follows; `guest_direct` → kept (a legacy
        // booking without a stored count keeps the one it had before this change).
        const booked = otaBooking
          ? partySource === 'ota_modification'
            ? next
            : ((row.pricing_snapshot as { bookedParty?: typeof next }).bookedParty ?? {
                adults: row.adults,
                children6to11: row.children_6_11,
                childrenUnder6: row.children_under_6,
              })
          : null;
        await this.repriceExtraPersons(tx, ctx, row, next, baseOccupancy, booked);
      }
    } else if (repriced && otaBooking && beforeCheckin && !seg.room_id) {
      // S4-07 / BUG-R2-058 (d): a conflict booking without a room has no standard occupancy yet – keep the OTA
      // guest count (what the OTA priced) so the fee is charged when the room is assigned (B7a/B7 plan), instead
      // of the new head count silently becoming the OTA count.
      const booked =
        partySource === 'ota_modification'
          ? next
          : ((row.pricing_snapshot as { bookedParty?: typeof next }).bookedParty ?? {
              adults: row.adults,
              children6to11: row.children_6_11,
              childrenUnder6: row.children_under_6,
            });
      await tx.query(
        `UPDATE reservation SET pricing_snapshot = pricing_snapshot || $2::jsonb WHERE id = $1`,
        [row.id, JSON.stringify({ bookedParty: booked })],
      );
    }
    if (closerUserId && closerUserId !== row.closer_user_id) {
      // SEC-BE-26: the closer decides who earns the commission – a money event.
      await this.audit.recordMoney(tx, {
        action: 'reservation.closer_changed',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        before: { closerUserId: row.closer_user_id },
        after: { closerUserId },
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    for (const [field, oldV, newV] of [
      ['adults', row.adults, next.adults],
      ['children_6_11', row.children_6_11, next.children6to11],
      ['children_under_6', row.children_under_6, next.childrenUnder6],
      ['eta_time', row.eta_time, etaTime ?? row.eta_time],
      ['closer_user_id', row.closer_user_id, closerUserId ?? row.closer_user_id],
    ] as const) {
      if (oldV !== newV) {
        const note =
          otaBooking && peopleChanged && field !== 'eta_time' && field !== 'closer_user_id'
            ? partySource === 'ota_modification'
              ? `ota_modification ${otaModificationRef ?? ''}`.trim()
              : (partySource ?? null)
            : null;
        await recordChange(tx, row.id, field, oldV, newV, ctx.now, note);
      }
    }
    const nextOtaCount = next.adults + next.children6to11;
    if (repriced && partySource === 'ota_modification' && otaGuestCount(row) !== nextOtaCount) {
      await recordChange(
        tx,
        row.id,
        'ota_guest_count',
        otaGuestCount(row),
        nextOtaCount,
        ctx.now,
        `ota_modification ${otaModificationRef ?? ''}`.trim(),
      );
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
        ...(otaBooking ? { otaGuestCount: otaGuestCount(row) } : {}),
      },
      after: {
        ...next,
        ...(otaBooking && repriced && partySource
          ? {
              partyChangeSource: partySource,
              ...(otaModificationRef ? { otaModificationRef } : {}),
            }
          : {}),
      },
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const after = await loadReservation(tx, row.id, ctx.actor);
    if (repriced) {
      await this.syncKit(tx, ctx, after, seg.room_id, seg.base_occupancy);
      if (after.status !== 'hold') {
        await this.money.resynced(
          tx,
          await this.confirmedStay(tx, after),
          ctx.actor.userId,
          ctx.requestId,
        );
        // Blocker verification ARC-S3-01: the in-house children (B9a / OTA extension) follow the people.
        if (after.status === 'in_house') {
          await this.syncChildrenParty(tx, ctx, after, next, ctx.today);
        }
      }
      await this.hooks.emit(tx, this.event('stay_changed', after, after.status, null, seg.room_id));
    }
    return after;
  }

  /** A-20: flag (or keep) the capacity conflict of an OTA booking + "Cần chú ý" push once. */
  private async setCapacityConflict(
    tx: Tx,
    ctx: BookingContext,
    row: Pick<ReservationRow, 'id' | 'code' | 'capacity_conflict_at'>,
    reason: string,
  ): Promise<void> {
    await tx.query(
      `UPDATE reservation SET capacity_conflict_at = COALESCE(capacity_conflict_at, $2), capacity_ack_reason = $3,
              capacity_ack_by = $4 WHERE id = $1`,
      [row.id, ctx.now, reason, ctx.actor.userId],
    );
    if (!row.capacity_conflict_at) {
      await outboxStaffPush(
        tx,
        {
          kind: 'capacity_conflict',
          roles: ['front_desk', 'front_desk_lead', 'manager'],
          refType: 'reservation',
          refId: row.id,
          refCode: row.code,
        },
        `capacity_conflict:${row.id}:${ctx.now.getTime()}`,
      );
    }
  }

  /** A-20: the head count fits the assigned room again (B7 to a bigger room, fewer guests). */
  private async clearCapacityConflict(tx: Tx, reservationId: string): Promise<void> {
    await tx.query(
      `UPDATE reservation SET capacity_conflict_at = NULL, capacity_ack_reason = NULL, capacity_ack_by = NULL
        WHERE id = $1 AND capacity_conflict_at IS NOT NULL`,
      [reservationId],
    );
  }

  /**
   * BR-110 before check-in: extra-person fee of the snapshot follows the new head count – direct/agent: above
   * the standard occupancy; OTA (fix round 4 (5), DOM 17/10): above max(standard, OTA guest count of `booked`),
   * stored with the nights as their own fee + count (collected at the desk, never in "Đã thu qua OTA").
   * `extraCount` stays the people above the standard (BR-812 kits).
   */
  private async repriceExtraPersons(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    baseOccupancy: number,
    booked: { adults: number; children6to11: number; childrenUnder6: number } | null,
  ): Promise<void> {
    const snap = row.pricing_snapshot as {
      extraAdultFeeVnd?: number;
      child611FeeVnd?: number;
      nights?: unknown[];
    };
    const charged = row.channel_group === 'direct' || row.channel_group === 'agent';
    const rates = {
      adultVnd: snap.extraAdultFeeVnd ?? 0,
      child611Vnd: snap.child611FeeVnd ?? 0,
    };
    const x = extraPersons(party, baseOccupancy, rates);
    const otaCount = booked ? booked.adults + booked.children6to11 : 0;
    const ota =
      row.channel_group === 'ota' && booked
        ? extraPersons(party, Math.max(baseOccupancy, otaCount), rates)
        : null;
    const perNight = charged ? x.perNightVnd : (ota?.perNightVnd ?? 0);
    const nights = nightsOf(row.arrival_date, row.departure_date);
    await tx.query(
      `UPDATE reservation SET pricing_snapshot = pricing_snapshot || $2::jsonb WHERE id = $1`,
      [
        row.id,
        JSON.stringify({
          extraCount: x.extraCount,
          extraPersonFeePerNightVnd: perNight,
          extraPersonFeeVnd: perNight * nights,
          ...(booked ? { bookedParty: booked } : {}),
        }),
      ],
    );
    const current = await this.nightFees(tx, row);
    if (ota) {
      // Each night of its room (a booking may already carry own fees) – the bill prints the people charged.
      const bases = await this.nightBases(tx, row.id);
      const fees = current.map((n) => {
        const base = bases.get(n.date) ?? baseOccupancy;
        const e = extraPersons(party, Math.max(base, otaCount), rates);
        return { date: n.date, feeVnd: e.perNightVnd, count: e.extraCount };
      });
      await this.setNightFees(tx, row.id, fees, ctx.now);
    } else if (charged && current.some((n) => n.own)) {
      // S4-07: nights that carry their own fee (moved to another room – BR-429) are priced on THEIR base
      // (`nightBases`: the room's, or the higher one an OTTIMO move kept) – the booking-level fee would not reach them.
      const bases = await this.nightBases(tx, row.id);
      const fees = current.map((n) => {
        const e = extraPersons(party, bases.get(n.date) ?? baseOccupancy, rates);
        return { date: n.date, feeVnd: e.perNightVnd, count: e.extraCount };
      });
      await this.setNightFees(tx, row.id, fees, ctx.now);
    }
  }

  // ─────────────────────────── helpers ───────────────────────────

  assertCapacity(rm: RoomInfo, party: { adults: number; children6to11: number }): void {
    const persons = party.adults + party.children6to11;
    if (persons > rm.max_occupancy) {
      throw problem('CAPACITY_EXCEEDED', {
        errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
        extras: { roomNo: rm.room_no, max: rm.max_occupancy },
      });
    }
  }

  /**
   * QC-S2-01 race guard. `rm` was read before the room lock (lock order: reservation → rooms ascending), so a
   * concurrent `updateRoom` may have lowered max_occupancy after the capacity decision. RoomsService.update
   * locks the room FOR UPDATE and only sees committed bookings; once we hold the room lock, re-read the value:
   * if it changed, our capacity decision is stale → 409 CONCURRENT_UPDATE (+ Retry-After) and the client
   * retries with the fresh value (its retry gets the right CAPACITY_EXCEEDED / warning branch).
   * Call ONLY after occupancy.lockRooms() on the same rooms.
   */
  async assertCapacityStable(tx: Tx, rooms: ReadonlyArray<RoomInfo>): Promise<void> {
    if (rooms.length === 0) return;
    const { rows } = await tx.query<{ id: string; max_occupancy: number }>(
      'SELECT id, max_occupancy FROM room WHERE id = ANY($1::uuid[])',
      [rooms.map((r) => r.id)],
    );
    const fresh = new Map(rows.map((r) => [r.id, r.max_occupancy]));
    if (rooms.some((r) => fresh.get(r.id) !== r.max_occupancy)) {
      throw new ProblemError('CONCURRENT_UPDATE', { headers: { 'Retry-After': '1' } });
    }
  }

  /** Room sellable and active over the stay (US-004 AC2) → 409 ROOM_NOT_SELLABLE. */
  async assertSellable(_tx: Tx, rm: RoomInfo, from: LocalDate, to: LocalDate): Promise<void> {
    const active = rm.active_from <= from && (rm.active_to === null || rm.active_to >= to);
    if (!rm.is_sellable || !active) {
      throw problem('ROOM_NOT_SELLABLE', { extras: { roomNo: rm.room_no } });
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

  /**
   * Closer of a booking (BR-903, SEC-BE-26): an ACTIVE user of the property (role not revoked, account
   * active) holding a role that may close a sale (SAL, CTV, FD+). Kind as in listCloserCandidates: `agent`
   * = only the CTV role, `staff` = any internal role (SAL, FD+). null = not a valid closer.
   */
  private async closerKind(tx: Tx, userId: string): Promise<'agent' | 'staff' | null> {
    const { rows } = await tx.query<{ agent: boolean }>(
      `SELECT bool_or(upr.role = 'collaborator') AND NOT bool_or(upr.role <> 'collaborator') AS agent
         FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
        WHERE upr.user_id = $1 AND upr.property_id = $2 AND upr.revoked_at IS NULL AND u.status = 'active'
          AND upr.role IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff', 'collaborator')
        GROUP BY upr.user_id`,
      [userId, tx.ctx.propertyId],
    );
    if (rows.length === 0) return null;
    return rows[0]!.agent ? 'agent' : 'staff';
  }

  /**
   * US-017 AC9 / EP02 3.2 (BUG-R2-023): channel group `agent` needs a CTV closer; direct source
   * `sales_staff` needs an internal closer (kind `staff`); other channels/sources: closer optional.
   */
  private checkCloserForChannel(
    f: Fields,
    group: string,
    directSource: string | null | undefined,
    closerUserId: string | undefined,
    kind: 'agent' | 'staff' | null,
  ): void {
    if (f.has('closerUserId')) return;
    const need: 'agent' | 'staff' | null =
      group === 'agent'
        ? 'agent'
        : group === 'direct' && directSource === 'sales_staff'
          ? 'staff'
          : null;
    if (!need) return;
    if (!closerUserId) f.add('closerUserId', 'REQUIRED');
    else if (kind !== need) f.add('closerUserId', 'NOT_IN_LIST');
  }

  /** SEC-BE-28: open holds per SAL/CTV (parameter max_open_holds_per_user); FD+ unlimited. */
  private async assertOpenHoldLimit(tx: Tx, ctx: BookingContext): Promise<void> {
    if (hasAny(ctx.actor.roles, FD_PLUS)) return;
    const limits = await this.params.get<Record<string, number>>(
      tx,
      'max_open_holds_per_user',
      ctx.today,
    );
    const caps = ctx.actor.roles
      .map((r) => limits[r])
      .filter((n): n is number => typeof n === 'number');
    if (caps.length === 0) return;
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM reservation
        WHERE status = 'hold' AND (created_by = $1 OR closer_user_id = $1)`,
      [ctx.actor.userId],
    );
    const max = Math.max(...caps);
    if ((rows[0]?.n ?? 0) >= max) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'holdHours', code: 'HOLD_LIMIT_REACHED' }],
        extras: { max },
      });
    }
  }

  /** BR-113 (a) suggestions: rooms of the same group where [from, to) is exactly an orphan night. */
  private async orphanRooms(
    tx: Tx,
    rm: RoomInfo,
    from: LocalDate,
    to: LocalDate,
    persons: number,
  ): Promise<Array<Record<string, unknown>>> {
    const free = await this.occupancy.suggest(tx, {
      roomGroupId: rm.room_group_id,
      from,
      to,
      persons,
      limit: 20,
    });
    const out: Array<Record<string, unknown>> = [];
    for (const s of free) {
      if (s.upgrade) continue;
      if (await this.isOrphanNightGap(tx, s.roomId, from, to)) {
        out.push({ ...s, upgrade: false, orphanNight: true });
      }
    }
    return out;
  }

  private parseNightlyRates(f: Fields, raw: unknown) {
    if (raw === undefined || raw === null) return undefined;
    if (!Array.isArray(raw) || raw.length > 60) {
      f.add('nightlyRates', 'VALIDATION_FAILED');
      return undefined;
    }
    const out: Array<{ date: LocalDate; amountVnd: number; edited?: boolean }> = [];
    for (const r of raw) {
      const o = r as { date?: unknown; amountVnd?: unknown; edited?: unknown };
      if (
        !o ||
        typeof o.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(o.date) ||
        typeof o.amountVnd !== 'number' ||
        !Number.isSafeInteger(o.amountVnd) ||
        (o.edited !== undefined && o.edited !== null && typeof o.edited !== 'boolean')
      ) {
        f.add('nightlyRates', 'VALIDATION_FAILED');
        return undefined;
      }
      // ARC 16.18 bổ sung: `NightRate.edited` – in the command only (the night's source), never returned.
      out.push({
        date: o.date,
        amountVnd: o.amountVnd,
        ...(typeof o.edited === 'boolean' ? { edited: o.edited } : {}),
      });
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
    // V-09 / BUG-R2-043: a card number is refused as such (Luhn first), never as "too long" – and never stored.
    for (const k of ['posAuthCode', 'note'] as const) {
      if (typeof o[k] === 'string') assertNoCardNumber(`initialPayment.${k}`, o[k] as string);
    }
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
    source: 'desk' | 'no_show_restore' = 'desk',
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
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $11, $12, $9, $10, 'open')`,
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
        source,
        source === 'desk' ? 'manual_entry' : 'other',
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
      dueAt: await this.kitDue(tx, ctx, row.arrival_date),
      tz: ctx.tz,
      now: ctx.now,
      today: ctx.today,
      userId: ctx.actor.userId,
    });
  }

  /**
   * BR-812 (2) + DOM D-10: check-in time of the arrival day, but never already overdue when the booking is
   * confirmed late – max(check-in time, now + extra_guest_kit_midstay_due_minutes).
   */
  private async kitDue(tx: Tx, ctx: BookingContext, arrival: LocalDate): Promise<Date> {
    const minutes = await this.params.get<number>(
      tx,
      'extra_guest_kit_midstay_due_minutes',
      ctx.today,
    );
    return extraGuestKitDue(arrival, ctx.params.checkinTime, ctx.tz, {
      at: ctx.now,
      midstayMinutes: minutes,
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

  /**
   * BR-417 (3) / BR-422: OTA guest staying one more night before (B9a) or after (B13) the OTA booking – the
   * OTA booking is never edited; a CHILD booking of the direct channel is created straight `in_house`, on the
   * same room and the SAME folio (parent's), its nights sold (BR-904) at the agreed rates. Inventory through
   * OccupancyService (409 ROOM_UNAVAILABLE + suggestions on a clash). Returns the child row.
   */
  async createChildStay(
    tx: Tx,
    ctx: BookingContext,
    parent: ReservationRow,
    input: {
      roomId: string;
      from: LocalDate;
      to: LocalDate;
      nights: ReadonlyArray<{
        date: LocalDate;
        amountVnd: number;
        calendarVnd?: number;
        /** ARC 16.18: recorded by the operation (absent = `manual`, as before). */
        source?: NightSource;
        anchorRoomId?: string | null;
      }>;
      rateSource: 'extra_night_early_late' | 'extension';
      transition: 'B9a' | 'B13';
      actualCheckinAt: Date;
      /** E05-11: the night is the "extra night on check-out" (bill.line.extra_night). */
      extraNight?: boolean;
    },
  ): Promise<ReservationRow> {
    const { rows: ch } = await tx.query<{ id: string }>(
      `SELECT id FROM channel WHERE channel_group = 'direct' AND is_active
        ORDER BY (code = 'direct') DESC, code LIMIT 1`,
    );
    const channelId = ch[0]?.id;
    if (!channelId) throw problem('VALIDATION_FAILED', { detail: 'no active direct channel' });
    const code = await this.docNumbers.allocate(tx, 'reservation');
    const id = uuidv7();
    const total = input.nights.reduce((a, n) => a + n.amountVnd, 0);
    // The child is a DIRECT booking: BR-110 extra persons are charged on its nights (room of the child) – at
    // least at the base the parent's adjacent night is protected at (BR-429 (b2), S4-38 BUG-R2-125).
    const rm = await this.room(tx, input.roomId);
    const parentBase = await this.adjacentBase(
      tx,
      parent.id,
      input.to <= parent.arrival_date ? 'first' : 'last',
    );
    const rates = {
      adultVnd: ctx.params.extraAdultFeeVnd,
      child611Vnd: ctx.params.child611FeeVnd,
    };
    const extra = extraPersons(
      {
        adults: parent.adults,
        children6to11: parent.children_6_11,
        childrenUnder6: parent.children_under_6,
      },
      Math.max(rm?.base_occupancy ?? 0, parentBase ?? 0),
      rates,
    );
    const snapshot = {
      asOf: ctx.today,
      nightRateUnit: ctx.params.nightRateUnit,
      parentReservationCode: parent.code,
      childOf: input.transition,
      bookingRateSource: 'calendar',
      extraAdultFeeVnd: rates.adultVnd,
      child611FeeVnd: rates.child611Vnd,
      extraPersonFeePerNightVnd: rm ? extra.perNightVnd : 0,
      extraCount: rm ? extra.extraCount : 0,
      ...(input.extraNight ? { extraNightDates: input.nights.map((n) => n.date) } : {}),
      nights: input.nights.map((n) => ({
        date: n.date,
        amountVnd: n.amountVnd,
        source: n.source ?? 'manual',
        ...((n.source ?? 'manual') === 'manual' && n.anchorRoomId
          ? { anchorRoomId: n.anchorRoomId }
          : {}),
        ...(n.calendarVnd !== undefined ? { calendarVnd: n.calendarVnd } : {}),
      })),
    };
    await tx.query(
      `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id, payment_model,
         booker_guest_id, parent_reservation_id, arrival_date, departure_date, booked_arrival_date,
         booked_departure_date, adults, children_6_11, children_under_6, conflict_state, deposit_required_vnd,
         total_room_vnd, pricing_snapshot, confirmed_at, actual_checkin_at, created_at, created_by, updated_at,
         folio_id)
       VALUES ($1, $2, $3, $4, 'in_house', 'short', $5, 'direct', $6, $7, $8, $9, $8, $9, $10, $11, $12, 'none', 0,
         $13, $14, $15, $16, $15, $17, $15, $18)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        code,
        channelId,
        parent.booker_guest_id,
        parent.id,
        input.from,
        input.to,
        parent.adults,
        parent.children_6_11,
        parent.children_under_6,
        total,
        JSON.stringify(snapshot),
        ctx.now,
        input.actualCheckinAt,
        ctx.actor.userId,
        parent.folio_id,
      ],
    );
    const segmentId = await insertSegment(tx, id, input.roomId, input.from, input.to, ctx.now);
    await this.occupancy.claim(
      tx,
      {
        roomId: input.roomId,
        from: input.from,
        to: input.to,
        kind: 'reservation',
        segmentId,
        now: ctx.now,
      },
      { withNames: true, persons: parent.adults + parent.children_6_11 },
    );
    await insertNights(
      tx,
      {
        reservationId: id,
        segmentId,
        roomId: input.roomId,
        channelId,
        stayType: 'short',
        state: 'sold',
        isComplimentary: false,
        now: ctx.now,
      },
      input.nights.map((n) => ({
        date: n.date,
        amountVnd: n.amountVnd,
        source: 'manual',
        ...(n.calendarVnd !== undefined ? { calendarVnd: n.calendarVnd } : {}),
      })),
    );
    await tx.query(`UPDATE stay_night SET rate_source = $2 WHERE reservation_id = $1`, [
      id,
      input.rateSource,
    ]);
    await recordTransition(tx, {
      reservationId: id,
      code,
      from: null,
      to: 'in_house',
      event: input.transition,
      reasonNote: parent.code,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    await this.audit.recordMoney(tx, {
      action: 'reservation.priced',
      entityType: 'reservation',
      entityId: id,
      entityCode: code,
      after: {
        status: 'in_house',
        totalRoomVnd: total,
        nightlyRates: input.nights.map((n) => ({ date: n.date, amountVnd: n.amountVnd })),
        rateSource: input.rateSource,
      },
      reason: `${input.transition} ${parent.code}`,
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    const child = await loadReservation(tx, id, ctx.actor);
    await outboxAvailability(
      tx,
      [{ roomId: input.roomId, from: input.from, to: input.to }],
      'reservation.child_created',
    );
    await this.money.resynced(
      tx,
      await this.confirmedStay(tx, child),
      ctx.actor.userId,
      ctx.requestId,
    );
    await this.hooks.emit(tx, this.event('created', child, null, input.transition, input.roomId));
    return child;
  }

  // ─────────────────────────── BR-110 per night (DOM S3-13, FB-R2-ARC-BE-S3-01) ───────────────────────────

  /** Fee rates of the booking (BR-006 snapshot first, else the parameters in force). */
  feeRates(ctx: BookingContext, row: ReservationRow): { adultVnd: number; child611Vnd: number } {
    const snap = row.pricing_snapshot as { extraAdultFeeVnd?: number; child611FeeVnd?: number };
    return {
      adultVnd: snap.extraAdultFeeVnd ?? ctx.params.extraAdultFeeVnd,
      child611Vnd: snap.child611FeeVnd ?? ctx.params.child611FeeVnd,
    };
  }

  /**
   * BR-110 fee AND count of one night for `party` in a room of `baseOccupancy`: the people above the base,
   * adults first so the extra persons are charged at the lower band. Direct/agent: that fee. OTA (DOM 17/10,
   * BR-110 v0.3.4): only the people above max(standard occupancy, OTA guest count – `bookedParty`), at the
   * lower band of everyone present (collected at the desk). Internal: 0.
   */
  nightExtra(
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    baseOccupancy: number,
  ): { feeVnd: number; count: number } {
    const rates = this.feeRates(ctx, row);
    if (row.channel_group === 'direct' || row.channel_group === 'agent') {
      const x = extraPersons(party, baseOccupancy, rates);
      return { feeVnd: x.perNightVnd, count: x.extraCount };
    }
    if (row.channel_group !== 'ota') return { feeVnd: 0, count: 0 };
    const x = extraPersons(party, Math.max(baseOccupancy, otaGuestCount(row) ?? 0), rates);
    return { feeVnd: x.perNightVnd, count: x.extraCount };
  }

  nightFee(
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    baseOccupancy: number,
  ): number {
    return this.nightExtra(ctx, row, party, baseOccupancy).feeVnd;
  }

  /** Current fee + count of every live night (own values, else the booking-level ones of the snapshot). */
  async nightFees(
    tx: Tx,
    row: ReservationRow,
  ): Promise<Array<{ id: string; date: LocalDate; feeVnd: number; count: number; own: boolean }>> {
    const snap = row.pricing_snapshot as {
      extraPersonFeePerNightVnd?: number;
      extraCount?: number;
    };
    const { rows } = await tx.query<{
      id: string;
      date: string;
      fee: number | null;
      cnt: number | null;
    }>(
      `SELECT id, stay_date::text AS date, extra_person_fee_vnd AS fee, extra_person_count AS cnt
         FROM stay_night WHERE reservation_id = $1 AND night_state <> 'void' ORDER BY stay_date`,
      [row.id],
    );
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      feeVnd: r.fee ?? snap.extraPersonFeePerNightVnd ?? 0,
      count: r.cnt ?? (r.fee === null || r.fee > 0 ? (snap.extraCount ?? 0) : 0),
      own: r.fee !== null,
    }));
  }

  /**
   * Give nights their own fee and extra-person count (the folio sync posts one `extra_person` line per night,
   * labelled with that night's count). An omitted count keeps the stored one.
   */
  async setNightFees(
    tx: Tx,
    reservationId: string,
    fees: ReadonlyArray<{ date: LocalDate; feeVnd: number; count?: number }>,
    now: Date,
  ): Promise<void> {
    for (const f of fees) {
      await tx.query(
        `UPDATE stay_night SET extra_person_fee_vnd = $3, extra_person_count = COALESCE($5::smallint, extra_person_count),
                updated_at = $4
          WHERE reservation_id = $1 AND stay_date = $2 AND night_state <> 'void'
            AND (extra_person_fee_vnd IS DISTINCT FROM $3::bigint
                 OR ($5::smallint IS NOT NULL AND extra_person_count IS DISTINCT FROM $5::smallint))`,
        [reservationId, f.date, f.feeVnd, now, f.count ?? null],
      );
    }
  }

  /**
   * Standard occupancy pricing the BR-110 fee of each night: the room's (active segments), unless an OTTIMO move
   * kept a higher one on the night (0059 `extra_person_base` – S4-07: the guest never pays more because OTTIMO
   * moved them, also when the people change afterwards).
   */
  /**
   * BUG-R2-134 (BR-417-07, BR-429 (b1) bổ sung 18/10): the room the guest bought (last guest-requested move, else
   * the origin room) – null when the booking never changed room. A booking whose current room differs was put
   * there by OTTIMO: an added night costs min(what the guest bought, the current room's calendar).
   */
  async boughtRoomId(tx: Tx, row: Pick<ReservationRow, 'id'>): Promise<string | null> {
    return (await this.boughtRoom(tx, row.id)).boughtRoomId;
  }

  /**
   * BR-417 appendix 5A step 1 (BUG-R2-160): the room the guest bought as the booking `reservationId` (the one holding
   * the night next to the added one) sees the whole stay, and the stay's origin room (anchor of nights typed before
   * any room – ARC 16.18).
   */
  async boughtRoom(
    tx: Tx,
    reservationId: string,
  ): Promise<{ boughtRoomId: string | null; originRoomId: string | null }> {
    const h = await stayRoomHistory(tx, reservationId);
    return { boughtRoomId: boughtRoomOf(h.history, h.originRoomId), originRoomId: h.originRoomId };
  }

  async nightBases(tx: Tx, reservationId: string): Promise<Map<LocalDate, number>> {
    const out = new Map<LocalDate, number>();
    // S438-REGR-03: nights without a stored base keep what the booking's OTTIMO moves protected (room history).
    const histBase = protectedBaseOf(await roomChangeHistory(tx, reservationId));
    for (const s of await activeSegments(tx, reservationId)) {
      if (s.base_occupancy === null) continue;
      const base = histBase !== null ? Math.max(histBase, s.base_occupancy) : s.base_occupancy;
      for (const d of nightDates(s.from_date, s.to_date)) out.set(d, base);
    }
    const { rows } = await tx.query<{ date: string; base: number }>(
      `SELECT stay_date::text AS date, extra_person_base AS base FROM stay_night
        WHERE reservation_id = $1 AND night_state <> 'void' AND extra_person_base IS NOT NULL`,
      [reservationId],
    );
    for (const r of rows) if (out.has(r.date)) out.set(r.date, r.base);
    return out;
  }

  /**
   * People of an IN-HOUSE booking changed (US-022 AC4 / updateReservation): nights before `fromDate` keep what
   * they had (frozen as their own fee + count), nights from `fromDate` get the fee and count of the new party
   * in their room. Returns old/new Σ of the changed nights. The caller updates the head count and re-syncs the
   * folio (and the children – `syncChildrenParty`).
   */
  async peopleFromNight(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    fromDate: LocalDate,
    opts: { write: boolean },
  ): Promise<{ oldVnd: number; newVnd: number; nights: number; extraCount: number }> {
    const bases = await this.nightBases(tx, row.id);
    const fees = await this.nightFees(tx, row);
    const changes: Array<{ date: LocalDate; feeVnd: number; count: number }> = [];
    let oldVnd = 0;
    let newVnd = 0;
    let nights = 0;
    let extraCount = 0;
    for (const n of fees) {
      if (n.date < fromDate) {
        if (!n.own) changes.push({ date: n.date, feeVnd: n.feeVnd, count: n.count });
        continue;
      }
      const base = bases.get(n.date);
      if (base === undefined) continue;
      const x = this.nightExtra(ctx, row, party, base);
      oldVnd += n.feeVnd;
      newVnd += x.feeVnd;
      nights += 1;
      extraCount = Math.max(
        extraCount,
        extraPersons(party, base, this.feeRates(ctx, row)).extraCount,
      );
      changes.push({ date: n.date, feeVnd: x.feeVnd, count: x.count });
    }
    if (opts.write) {
      if (
        row.channel_group === 'ota' &&
        !(row.pricing_snapshot as { bookedParty?: unknown }).bookedParty
      ) {
        await tx.query(
          `UPDATE reservation SET pricing_snapshot = pricing_snapshot || $2::jsonb WHERE id = $1`,
          [
            row.id,
            JSON.stringify({
              bookedParty: {
                adults: row.adults,
                children6to11: row.children_6_11,
                childrenUnder6: row.children_under_6,
              },
            }),
          ],
        );
      }
      await this.setNightFees(tx, row.id, changes, ctx.now);
    }
    return { oldVnd, newVnd, nights, extraCount };
  }

  /**
   * Blocker verification ARC-S3-01 (17/10): the in-house CHILD bookings of a stay (B9a prior night, OTA
   * extension, E05-11 extra night – same room, same folio) follow the people of the primary booking: same head
   * count, BR-110 fee per night from `fromDate`, folio re-synced. Without this an OTA stay extended first and
   * joined by a person afterwards lost the fee of the child's nights.
   * Fix round 4 (3): `write: false` only returns Σ old/new fee of the children's nights from `fromDate` – the
   * preview and `expectedSurchargeVnd` of adding a person include them (one decision for the whole stay).
   */
  async syncChildrenParty(
    tx: Tx,
    ctx: BookingContext,
    parent: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    fromDate: LocalDate,
    opts: { write: boolean } = { write: true },
  ): Promise<{ oldVnd: number; newVnd: number; nights: number }> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM reservation WHERE parent_reservation_id = $1 AND status = 'in_house'
        ORDER BY arrival_date, id${opts.write ? ' FOR NO KEY UPDATE' : ''}`,
      [parent.id],
    );
    const total = { oldVnd: 0, newVnd: 0, nights: 0 };
    for (const { id } of rows) {
      const child = await loadReservation(tx, id, SYSTEM_ACTOR);
      if (
        child.adults === party.adults &&
        child.children_6_11 === party.children6to11 &&
        child.children_under_6 === party.childrenUnder6
      ) {
        continue;
      }
      const p = await this.peopleFromNight(tx, ctx, child, party, fromDate, opts);
      total.oldVnd += p.oldVnd;
      total.newVnd += p.newVnd;
      total.nights += p.nights;
      if (!opts.write) continue;
      await tx.query(
        `UPDATE reservation SET adults = $2, children_6_11 = $3, children_under_6 = $4, updated_at = $5,
                version = version + 1
          WHERE id = $1`,
        [id, party.adults, party.children6to11, party.childrenUnder6, ctx.now],
      );
      await recordChange(
        tx,
        id,
        'persons',
        {
          adults: child.adults,
          children6to11: child.children_6_11,
          childrenUnder6: child.children_under_6,
        },
        party,
        ctx.now,
        `parent ${parent.code}`,
      );
      if (child.folio_id) {
        const fresh = await loadReservation(tx, id, SYSTEM_ACTOR);
        await this.money.resynced(
          tx,
          await this.confirmedStay(tx, fresh),
          ctx.actor.userId,
          ctx.requestId,
        );
      }
    }
    return total;
  }

  /** New nights (B13, B9a) of a booking whose nights carry their own fee get the current party's fee. */
  async feesForNewNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    dates: readonly LocalDate[],
  ): Promise<void> {
    const fees = await this.nightFees(tx, row);
    if (!fees.some((f) => f.own)) return; // booking-level fee still applies to every night
    const bases = await this.nightBases(tx, row.id);
    const party = {
      adults: row.adults,
      children6to11: row.children_6_11,
      childrenUnder6: row.children_under_6,
    };
    // S4-38 (BUG-R2-125, BR-429 (b2) "đêm thêm của đơn lấy định mức bảo vệ của đơn"): an added night takes the
    // base of the booking night next to it (B9a: the first, B13/B18: the last) – the one its preview uses.
    const added = new Set(dates);
    const kept = [...bases.keys()].filter((d) => !added.has(d)).sort();
    const adjacent = (d: LocalDate) =>
      kept.length === 0
        ? undefined
        : bases.get(
            d < (kept[0] as string) ? (kept[0] as string) : (kept[kept.length - 1] as string),
          );
    await this.setNightFees(
      tx,
      row.id,
      dates.flatMap((d) => {
        const base = adjacent(d) ?? bases.get(d);
        if (base === undefined) return [];
        const x = this.nightExtra(ctx, row, party, base);
        return [{ date: d, feeVnd: x.feeVnd, count: x.count }];
      }),
      ctx.now,
    );
  }

  /**
   * S4-38 (BUG-R2-125): the BR-110 fee of a night added before (`first` – B9a) or after (`last` – B13/B18) the
   * stay, exactly as the write gives it (feesForNewNights / the booking-level fee) – for the previews and the
   * QR caps. A direct child night of an OTA / manual long stay: the child's own fee at max(room base, the
   * booking's adjacent base) – createChildStay.
   */
  async addedNightFee(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    side: 'first' | 'last',
    roomBase: number,
  ): Promise<number> {
    const party = {
      adults: row.adults,
      children6to11: row.children_6_11,
      childrenUnder6: row.children_under_6,
    };
    const adjacent = await this.adjacentBase(tx, row.id, side);
    if (row.channel_group === 'ota' || row.external_contract) {
      const asDirect = { ...row, channel_group: 'direct' as const };
      return this.nightExtra(ctx, asDirect, party, Math.max(roomBase, adjacent ?? roomBase)).feeVnd;
    }
    const fees = await this.nightFees(tx, row);
    if (!fees.some((f) => f.own)) {
      return (
        (row.pricing_snapshot as { extraPersonFeePerNightVnd?: number })
          .extraPersonFeePerNightVnd ?? 0
      );
    }
    return this.nightExtra(ctx, row, party, adjacent ?? roomBase).feeVnd;
  }

  /** BR-110 base of the booking's first / last live night (nightBases – stored protection, room history). */
  private async adjacentBase(
    tx: Tx,
    reservationId: string,
    side: 'first' | 'last',
  ): Promise<number | null> {
    const bases = await this.nightBases(tx, reservationId);
    const dates = (await liveNightRows(tx, reservationId))
      .map((n) => n.date)
      .filter((d) => bases.has(d))
      .sort();
    const d = side === 'first' ? dates[0] : dates[dates.length - 1];
    return d ? (bases.get(d) ?? null) : null;
  }

  // ───────────── BR-107 re-tiering of an in-house stay (B13, B9a – D-8; ARC B-3 d: night prices only here) ─────────────

  /** Live nights with their calendar price; `manual` = the price was typed (never re-tiered – ARC-BE-S3-24.3). */
  async pricedNights(tx: Tx, row: ReservationRow): Promise<StayNightPrice[]> {
    const snap = new Map(
      (
        (
          row.pricing_snapshot as {
            nights?: Array<{ date: string; source?: string; anchorRoomId?: string | null }>;
          }
        ).nights ?? []
      ).map((n) => [n.date, n]),
    );
    return (await liveNightRows(tx, row.id)).map((n) => {
      const s = snap.get(n.date);
      const source = (s?.source ?? 'calendar') as NightSource;
      return {
        date: n.date,
        calendarVnd: n.calendarVnd ?? n.grossVnd,
        amountVnd: n.grossVnd,
        manual: source === 'manual',
        source,
        ...(source === 'manual' ? { anchorRoomId: s?.anchorRoomId ?? null } : {}),
      };
    });
  }

  /** D-8: every live non-manual night of a direct/agent booking re-tiered for the new number of nights. */
  retierStay(
    ctx: BookingContext,
    row: ReservationRow,
    kept: readonly StayNightPrice[],
    added: readonly StayNightPrice[],
  ): { pct: number; kept: StayNightPrice[]; added: StayNightPrice[] } {
    const tiered =
      (row.channel_group === 'direct' || row.channel_group === 'agent') && !row.external_contract;
    const tier = tiered ? losDiscountPct(kept.length + added.length, ctx.params.losTiers) : 0;
    // BR-429 (a1) v0.3.8 (DOM-S4-03): a booking from a quote keeps its BR-111 return-guest % – the better of it
    // and the tier on every re-tiering, not stacked (`pct` = the % in force, stored as `losDiscountPct`).
    const ret = tiered ? returnGuestOf(row.pricing_snapshot) : { pct: 0, stacked: false };
    const pct = tiered ? effectiveDiscountPct(tier, ret) : 0;
    const unit =
      (row.pricing_snapshot as { nightRateUnit?: number }).nightRateUnit ??
      ctx.params.nightRateUnit;
    // BR-107 v0.3.8 (S4-38, S438-PAY-03/-04 – replaces ARC-BE-S3-24.3 "never re-tiered"): a typed price (booking,
    // S4-35, B13, B9a, B18) is the CALENDAR price of the night – every night takes the tier of the final stay.
    const apply = (n: StayNightPrice): StayNightPrice =>
      !tiered ? { ...n } : { ...n, amountVnd: discountedNight(n.calendarVnd, tier, ret, unit) };
    return { pct, kept: kept.map(apply), added: added.map(apply) };
  }

  /**
   * Writes a re-tiered stay (B13 extension, B9a prior night of a direct booking): kept nights get their new
   * gross (discounts kept), added nights are sold with `rateSource`, the snapshot remembers which prices were
   * typed, `total_room_vnd` = Σ gross, and the added nights get the party's BR-110 fee when nights carry their
   * own fee. The caller moves the segment / inventory first and re-syncs the folio after.
   */
  async writeRepricedNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    input: {
      segmentId: string;
      roomId: string;
      pct: number;
      kept: readonly StayNightPrice[];
      added: readonly StayNightPrice[];
      rateSource: string;
      /** E05-11: the added nights are "extra night on check-out" (bill.line.extra_night). */
      extraNight?: boolean;
    },
  ): Promise<number> {
    for (const k of input.kept) {
      await tx.query(
        `UPDATE stay_night SET room_revenue_gross_vnd = $3::bigint, room_revenue_vnd = $3::bigint - discount_vnd,
                calendar_rate_vnd = $4::bigint, updated_at = $5
          WHERE reservation_id = $1 AND stay_date = $2 AND night_state <> 'void'
            AND (room_revenue_gross_vnd <> $3::bigint OR calendar_rate_vnd IS DISTINCT FROM $4::bigint)`,
        [row.id, k.date, k.amountVnd, k.calendarVnd, ctx.now],
      );
    }
    await insertNights(
      tx,
      {
        reservationId: row.id,
        segmentId: input.segmentId,
        roomId: input.roomId,
        channelId: row.channel_id,
        stayType: row.stay_type,
        state: 'sold',
        isComplimentary: row.is_complimentary,
        now: ctx.now,
      },
      input.added.map((x) => ({
        date: x.date,
        amountVnd: x.amountVnd,
        calendarVnd: x.calendarVnd,
        source: snapshotNight(x).source,
      })),
    );
    const addedDates = input.added.map((x) => x.date);
    await tx.query(
      `UPDATE stay_night SET rate_source = $3 WHERE reservation_id = $1
          AND stay_date = ANY($2::date[]) AND night_state <> 'void'`,
      [row.id, addedDates, input.rateSource],
    );
    const all = [...input.kept, ...input.added].sort((a, b) => (a.date < b.date ? -1 : 1));
    const total = all.reduce((a, x) => a + x.amountVnd, 0);
    await tx.query(
      `UPDATE reservation SET total_room_vnd = $2, pricing_snapshot = pricing_snapshot || $3::jsonb WHERE id = $1`,
      [
        row.id,
        total,
        JSON.stringify({
          losDiscountPct: input.pct,
          ...(input.extraNight
            ? {
                extraNightDates: [
                  ...((row.pricing_snapshot as { extraNightDates?: string[] }).extraNightDates ??
                    []),
                  ...addedDates,
                ],
              }
            : {}),
          nights: all.map(snapshotNight),
        }),
      ],
    );
    await this.feesForNewNights(tx, ctx, row, addedDates);
    return total;
  }

  /** Same-transaction hooks for a transition/stay change made outside this service (front desk – B9…B18). */
  async emitEvent(
    tx: Tx,
    kind: 'created' | 'transitioned' | 'stay_changed',
    row: ReservationRow,
    previous: ReservationStatus | null,
    transition: string | null,
    roomId: string | null,
    reasonCode?: string,
  ): Promise<void> {
    await this.hooks.emit(tx, this.event(kind, row, previous, transition, roomId, reasonCode));
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
      throw problem('HOLD_EXPIRED', {
        ...(row.hold_expires_at ? { extras: { expiredAt: ctx.iso(row.hold_expires_at) } } : {}),
      });
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
    // 0.3.6 bổ sung 4 (BR-310/901, BE-B): the OTA's actual fee on the penalty – only with a penalty.
    const otaPenaltyFee = f.money('otaPenaltyChannelFeeVnd', { required: false, positive: false });
    if (otaPenaltyFee !== undefined && otaPenalty === undefined) {
      f.add('otaPenaltyChannelFeeVnd', 'NOT_ALLOWED');
    }
    if (reasonCode && !USER_CANCEL_REASONS.includes(reasonCode)) f.add('reasonCode', 'NOT_IN_LIST');
    // 0.3.7 D1 S4-08 (BE-B): service lines the desk keeps (validated against the folio by closeStayPreview).
    const retainLines = retainLinesOf(f, body.retainLines);
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
    // Re-verification 17/10 (Minor) + S4-37 (BE-B, round-5 MONEY note): a penalty above what the OTA booking is
    // worth is a typing error. The OTA penalty comes out of the OTA room amount only – the BR-110 extra-person fee
    // is paid at the desk, never through the OTA (otherwise the prepaid `ota_collect` = penalty could exceed what
    // the OTA really collected).
    if (otaPenalty !== undefined && row.channel_group === 'ota') {
      if (otaPenalty > Number(row.total_room_vnd ?? 0))
        f.add('otaPenaltyVnd', 'VALUE_OUT_OF_RANGE');
    }
    f.done();

    const policy = await this.cancellationQuote(tx, ctx, row, otaPenalty);
    // S4-08 + S4-06 (BE-B): services reversed / kept and the refund request – the SAME calculation for the dry
    // run and the write (FolioService.closeStayPreview).
    const close = row.folio_id
      ? await this.money.closeStayPreview(tx, row, {
          retainLines,
          feeVnd: Number(policy.retainedVnd ?? 0),
          feeCategory: 'cancellation_fee',
          today: ctx.today,
        })
      : null;
    const quote: Record<string, unknown> = { ...policy, ...(close ?? {}) };
    if (dryRun) return { row, cancellation: quote };

    const segs = await activeSegments(tx, row.id);
    await this.occupancy.lockRooms(
      tx,
      segs.flatMap((s) => (s.room_id ? [s.room_id] : [])),
    );
    for (const s of segs) await this.occupancy.release(tx, { segmentId: s.id }, ctx.now);
    const voidedIds = await voidNights(
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
    const retained = Number(quote.retainedVnd ?? 0);
    await this.money.voided(
      tx,
      {
        reservationId: row.id,
        reservationCode: row.code,
        folioId: row.folio_id,
        voidedStayNightIds: voidedIds,
        retainedVnd: retained,
        retainedKind: retained > 0 ? 'cancellation_fee' : null,
        ...(otaPenaltyFee !== undefined ? { channelFeeActualVnd: otaPenaltyFee } : {}),
        reason: reasonCode as string,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
        services: { retainLines },
      },
      ctx.actor.userId,
    );
    // S4-06 (BE-B, BR-522): AFTER the folio is closed (fee posted, services reversed) – ONE refund request for
    // the overpayment left (the deposit part BR-309 refunds + other money paid, OTA money excluded).
    const refund = await this.money.closeStayCredit(
      tx,
      row,
      reasonCode as string,
      ctx.actor,
      ctx.requestId,
      note ?? null,
    );
    const refundApprovalRequestId = refund?.id;
    // S438-CANCEL-04 (M2 dry run = write): the amount of the request THIS cancellation created (refundPlan) – a
    // request already open that covers the excess is linked (refundApprovalRequestId) but not counted again.
    quote.refundRequestVnd = refund?.created ? refund.amountVnd : 0;
    // SM-09: a cancelled hold sends its lead back to `quoted` (B5).
    if (row.status === 'hold') await this.leads.onHoldEnded(tx, row.quote_id);
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
      // DOM 17/10 (BR-310, oracles BR-310-01/02): the penalty the OTA keeps for OTTIMO is other revenue on the
      // folio (`cancellation_fee`); prepaid → "Đã thu qua OTA" of the same amount (folio sync), pay-at-property
      // → due at the desk. 0 / absent → no line.
      return {
        depositPaidVnd: depositPaid,
        refundableVnd: 0,
        retainedVnd: otaPenalty ?? 0,
        ...(otaPenalty !== undefined ? { otaPenaltyVnd: otaPenalty } : {}),
        policyRef: 'BR-310',
      };
    }
    // BR-309 v0.3.8 (DOM-S4-14): the fee base is min(deposit paid, deposit REQUIRED, booking value) – money paid
    // above the required deposit is excess, and an open refund request never lowers the fee (BE-B's one refund
    // request – BR-522 – adds the shortfall or replaces a pending request that asks more than the excess).
    const { cap } = await this.retainableDeposit(tx, row, depositPaid);
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
    // BR-309 (iv) v0.3.8 bổ sung 18/10 (BR-309-15): a late guest date move locked the refund tier.
    const pctCap = (row.pricing_snapshot as { refundPctCap?: number }).refundPctCap;
    const tiers = (snap.cancelPolicy ?? ctx.params.cancelPolicy).map((t) =>
      pctCap === undefined ? t : { ...t, refundPct: Math.min(t.refundPct, pctCap) },
    );
    // BR-309 v0.3.8 (S438-CANCEL-02): a special night among the nights the booking has now, or kept from a move
    // (`hasPeakNight` – see writePlannedNights).
    const livePeak = this.hasPeakNight(
      ctx,
      (await liveNightRows(tx, row.id)).map((n) => n.date),
    );
    const peakNoRefund =
      (snap.cancelPeakNoRefund ?? ctx.params.cancelPeakNoRefund) &&
      (livePeak || !!snap.hasPeakNight);
    const r = directCancelRefund(
      cap,
      noticeDays(row.arrival_date, ctx.today),
      tiers,
      peakNoRefund,
      snap.feeUnit ?? ctx.params.feeUnit,
    );
    return {
      depositPaidVnd: depositPaid,
      refundableVnd: depositPaid - r.cancelFeeVnd,
      retainedVnd: r.cancelFeeVnd,
      policyRef: 'BR-309',
    };
  }

  /**
   * BR-305 / BR-309 v0.3.8 (S4-38, S438-CANCEL-01): the required deposit – the base of a cancellation / no-show
   * fee – follows the CURRENT room money after B7/B8 (30 % rounded, BR-305). A guest-requested change that lowers
   * it with less than 7 days to the arrival keeps the former one (no "move then cancel" to get the deposit back).
   * The desk never asks the guest for a top-up (BR-429 (e)) – only the fee base moves. OTA/internal: unchanged.
   */
  /**
   * BR-309 (iv) v0.3.8 bổ sung 18/10 (S438R3-GAP-Q1, BR-309-15/-16): refund % cap after a date move of a paid
   * direct/agent short stay – `guest_request` or `other` with < 7 days to the OLD arrival: min(cap so far, the
   * tier % at the move); `force_majeure` (any notice): 0 – null when the move does not lock anything.
   */
  private refundPctCapAfter(
    ctx: BookingContext,
    row: ReservationRow,
    newArrival: LocalDate,
    reasonCode: string,
    depositPaidVnd: number,
  ): number | null {
    if (row.channel_group !== 'direct' && row.channel_group !== 'agent') return null;
    if (row.external_contract || row.stay_type !== 'short' || row.status === 'hold') return null;
    if (depositPaidVnd <= 0 || newArrival === row.arrival_date) return null;
    const snap = row.pricing_snapshot as {
      cancelPolicy?: Array<{ minDays: number; refundPct: number }>;
      refundPctCap?: number;
    };
    // BR-309-16 (DOM 18/10, F4/F5): a date move for force majeure is free but never refundable in cash – a later
    // cancellation refunds nothing.
    if (reasonCode === 'force_majeure') return 0;
    // r3-3 corrected: `other` locks the tier like `guest_request` (no way around it through the reason).
    if (reasonCode !== 'guest_request' && reasonCode !== 'other') return null;
    const notice = noticeDays(row.arrival_date, ctx.today);
    if (notice >= 7) return null;
    const tiers = [...(snap.cancelPolicy ?? ctx.params.cancelPolicy)].sort(
      (a, b) => b.minDays - a.minDays,
    );
    const pct = tiers.find((t) => notice >= t.minDays)?.refundPct ?? 0;
    return Math.min(snap.refundPctCap ?? 100, pct);
  }

  /** BR-104 special dates (`special_dates`) among the nights – the BR-309 "ngày cao điểm" test. */
  private hasPeakNight(ctx: BookingContext, dates: readonly LocalDate[]): boolean {
    return dates.some((d) => isSpecialDate(d, ctx.params.calendar.specialDates));
  }

  private requiredDepositAfter(
    ctx: BookingContext,
    row: ReservationRow,
    totalRoomVnd: number,
    reasonCode: string,
    depositPaidVnd: number,
  ): { requiredVnd: number; heldVnd: number } {
    const old = Number(row.deposit_required_vnd ?? 0);
    const snap = row.pricing_snapshot as {
      depositPct?: number;
      depositUnit?: number;
      depositHeldVnd?: number;
    };
    const held = snap.depositHeldVnd ?? 0;
    if (row.channel_group !== 'direct' && row.channel_group !== 'agent') {
      return { requiredVnd: old, heldVnd: held };
    }
    if (row.external_contract || row.stay_type !== 'short')
      return { requiredVnd: old, heldVnd: held };
    // BR-309 (v) v0.3.8 bổ sung 18/10: the held level is for a booking that has a deposit – a `hold` (or a
    // booking with nothing paid) always needs 30 % of its current room money.
    const paid = row.status !== 'hold' && depositPaidVnd > 0;
    return requiredDepositAfterChange({
      oldRequiredVnd: old,
      heldVnd: paid ? held : 0,
      totalRoomVnd,
      depositPct: snap.depositPct ?? ctx.params.depositPct,
      depositUnit: snap.depositUnit ?? ctx.params.depositUnit,
      guestRequest: paid && reasonCode === 'guest_request',
      lateNotice: noticeDays(row.arrival_date, ctx.today) < 7,
    });
  }

  /**
   * The deposit OTTIMO may keep or charge a fee on – ONE rule for B10 (BR-309 fee) and B11 (BR-311 no-show):
   * BR-309 v0.3.8 (DOM-S4-14) `base` = min(deposit paid, deposit required) – money paid above the required
   * deposit is excess, and an open refund request does NOT lower it (it used to: VER-BE-S3-01, now overturned);
   * `cap` = min(base, booking value). Booking value (DOM 17/10, REFUND #3) = live room + extra-person lines
   * after FOC/discounts, minus OTA-collected money (FolioService.bookingValueVnd) – never the snapshot.
   */
  private async retainableDeposit(
    tx: Tx,
    row: ReservationRow,
    depositPaid?: number,
  ): Promise<{
    depositPaid: number;
    open: number;
    base: number;
    bookingValue: number;
    cap: number;
  }> {
    const paid = depositPaid ?? (await this.money.depositPaid(tx, row));
    const open = paid > 0 ? await this.money.openRefunds(tx, row) : 0;
    const base = Math.max(0, Math.min(paid, Number(row.deposit_required_vnd ?? 0)));
    const bookingValue = await this.money.bookingValue(tx, row);
    return { depositPaid: paid, open, base, bookingValue, cap: Math.min(base, bookingValue) };
  }

  // ─────────────────────────── B7 / B8 – move (one calculation for the preview and the write) ───────────────────────────

  /** Body of `moveReservation` / query of `previewMoveReservation` (same fields, same checks). */
  private moveInput(body: Record<string, unknown>, preview: boolean): MoveInput {
    const f = new Fields(body);
    const roomId = f.uuid('roomId', false);
    const arrival = f.date('arrivalDate', false);
    const departure = f.date('departureDate', false);
    const mode =
      f.enumOf('mode', ['change', 'postpone_instead_of_cancel'] as const, false) ?? 'change';
    const reasonCode = f.enumOf('reasonCode', MOVE_REASONS, true) as MoveReason;
    const noteRequired = !preview && (reasonCode === 'other' || reasonCode === 'force_majeure');
    const note = f.text('note', 500, { required: noteRequired, min: noteRequired ? 3 : 0 });
    const capacityAck = f.text('capacityWarningAckReason', 500, { min: 3 });
    const resolution = f.enumOf(
      'overbookingResolution',
      ['reassigned_same_group', 'upgraded'] as const,
      false,
    );
    const applyDifference = f.bool('applyDifference') ?? false;
    const raw = body.expectedDeltaVnd;
    let expectedDeltaVnd: number | undefined;
    if (raw !== undefined && raw !== null) {
      if (typeof raw !== 'number' || !Number.isSafeInteger(raw)) {
        f.add('expectedDeltaVnd', 'AMOUNT_INVALID');
      } else {
        expectedDeltaVnd = raw;
      }
    }
    if (!roomId && !arrival && !departure) f.add('roomId', 'REQUIRED');
    f.done();
    return {
      roomId,
      arrival,
      departure,
      mode,
      reasonCode,
      note,
      capacityAck,
      resolution,
      applyDifference,
      expectedDeltaVnd,
    };
  }

  /**
   * Checks of B7/B8 (BR-309, BR-312, BR-316, BR-429, A-19, A-20) and the money plan – the SAME function for the
   * preview (read-only, `mode = preview`: warnings instead of "reason required" errors, no locks) and the write
   * (after the reservation lock: rooms then folio locked BEFORE the plan, lock order reservation → rooms → folio).
   */
  private async prepareMove(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    m: MoveInput,
    mode: 'preview' | 'write',
  ): Promise<PreparedMove> {
    const f = new Fields({});
    const warnings: Array<{ code: string; field?: string }> = [];
    if (row.status !== 'confirmed') throw this.invalid(row);
    if (row.external_contract && (m.arrival || m.departure)) {
      f.add('arrivalDate', 'VALIDATION_FAILED');
    }
    if (row.channel_group === 'ota' && (m.arrival || m.departure))
      f.add('arrivalDate', 'OTA_DATES_LOCKED');
    if (row.conflict_state === 'open' && !m.resolution) f.add('overbookingResolution', 'REQUIRED');
    // A-19 rules: `overbooking` only for a flagged booking; `force_majeure` only as B8 (MGR+ below).
    if (
      m.reasonCode === 'overbooking' &&
      row.conflict_state !== 'open' &&
      !row.capacity_conflict_at
    ) {
      f.add('reasonCode', 'NOT_IN_LIST');
    }
    if (m.reasonCode === 'force_majeure' && m.mode !== 'postpone_instead_of_cancel') {
      f.add('reasonCode', 'NOT_IN_LIST');
    }
    // 0.3.7 D1 (BR-429, BR-012 (4)): rearranging rooms is only for a guest who was not told the room yet.
    if (m.reasonCode === 'inventory_optimize' && row.room_disclosed_to_guest) {
      f.add('reasonCode', 'NOT_IN_LIST');
    }
    f.done();
    if (m.reasonCode === 'upgrade' && !hasAny(ctx.actor.roles, FDL_PLUS)) {
      throw problem('FORBIDDEN_ACTION', { detail: 'upgrade needs FDL+ (BR-316 (3))' });
    }
    const from = m.arrival ?? row.arrival_date;
    const to = m.departure ?? row.departure_date;
    const p = ctx.params;
    if (to <= from) f.add('departureDate', 'DATE_ORDER');
    if ((m.arrival || m.departure) && from < ctx.today) f.add('arrivalDate', 'DATE_IN_PAST');
    f.done();
    if (m.mode === 'postpone_instead_of_cancel') {
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
    const targetRoomId = m.roomId ?? seg.room_id;
    if (!targetRoomId) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'REQUIRED' }] });
    }
    const rm = await this.room(tx, targetRoomId);
    if (!rm)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    // A-20: OTA over capacity → warning + reason (flag kept); a room that fits clears the flag.
    const overCapacity = row.adults + row.children_6_11 > rm.max_occupancy;
    if (overCapacity && row.channel_group === 'ota') {
      if (!m.capacityAck && !row.capacity_conflict_at) {
        if (mode === 'preview') {
          warnings.push({ code: 'CAPACITY_EXCEEDED_WARNING', field: 'roomId' });
        } else {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'roomId', code: 'CAPACITY_EXCEEDED_WARNING' }],
            extras: { roomNo: rm.room_no, max: rm.max_occupancy },
          });
        }
      }
    } else {
      this.assertCapacity(rm, { adults: row.adults, children6to11: row.children_6_11 });
    }
    await this.assertSellable(tx, rm, from, to);
    if (row.conflict_state === 'open') {
      await this.assertResolution(tx, ctx, row, rm, m.resolution as string);
    }
    const roomChanges = targetRoomId !== seg.room_id;
    // BR-429 (b): `other` keeps the booked prices, so a move to a room priced higher today is an upgrade – FDL+.
    if (
      m.reasonCode === 'other' &&
      roomChanges &&
      seg.room_id &&
      !hasAny(ctx.actor.roles, FDL_PLUS)
    ) {
      const dates = nightDates(from, to);
      const [now, next] = [
        await this.planner.directTotal(tx, ctx, seg.room_id, dates),
        await this.planner.directTotal(tx, ctx, targetRoomId, dates),
      ];
      if (next > now) {
        throw problem('FORBIDDEN_ACTION', {
          detail: 'other to a room priced higher needs FDL+ (BR-429 (b))',
        });
      }
    }
    if (mode === 'write') {
      // Lock order: reservation (done) → rooms ascending → folio; the plan is read under these locks.
      await this.occupancy.lockRooms(tx, [targetRoomId, ...(seg.room_id ? [seg.room_id] : [])]);
      await this.money.lockFolio(tx, row);
    }
    // Inventory first (preview and write alike – a taken night is a 409 before any money question); the write
    // keeps the inventory constraint as the race guard.
    if (!(await this.occupancy.isFree(tx, targetRoomId, from, to, [seg.id]))) {
      throw await this.occupancy.unavailable(
        tx,
        {
          roomId: targetRoomId,
          from,
          to,
          persons: countedPersons({
            adults: row.adults,
            children6to11: row.children_6_11,
            childrenUnder6: 0,
          }),
          exclude: [seg.id],
        },
        { withNames: true },
      );
    }
    const requested =
      row.conflict_state === 'open' && !seg.room_id
        ? {
            room: await this.requestedRoom(tx, row.id),
            upgraded: m.resolution === 'upgraded',
          }
        : undefined;
    const plan = await this.planner.planBooking(tx, ctx, {
      row,
      flow: 'B7',
      cause: row.conflict_state === 'open' && !seg.room_id ? 'ottimo' : moveCauseOf(m.reasonCode),
      fromDate: from < row.arrival_date ? from : row.arrival_date,
      arrival: from,
      departure: to,
      newRoom: roomChanges ? rm : null,
      requested,
    });
    return {
      seg,
      rm,
      from,
      to,
      roomChanges,
      overCapacity,
      plan,
      folioDeltaVnd: plan.folioDeltaVnd,
      warnings,
    };
  }

  /** previewMoveReservation (0.3.7, ESC-019 A; S4-21): the move's money, nothing written (READ ONLY tx). */
  async previewMove(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const m = this.moveInput(query, true);
    const row = await loadReservation(tx, id, ctx.actor);
    const pm = await this.prepareMove(tx, ctx, row, m, 'preview');
    const { plan } = pm;
    const depositPaid = row.folio_id ? await this.money.depositPaid(tx, row) : 0;
    const balance = row.folio_id ? await this.money.balanceDue(tx, row) : 0;
    const credit = row.folio_id ? await this.money.credit(tx, row) : 0;
    const name = await this.roomName(tx, pm.rm.id);
    const ota = row.channel_group === 'ota';
    return {
      pricingBasis: plan.basis,
      roomId: pm.rm.id,
      roomNo: pm.rm.room_no,
      roomName: name,
      arrivalDate: pm.from,
      departureDate: pm.to,
      nights: plan.nights.map((n) => ({
        date: n.date,
        oldRateVnd: n.oldGrossVnd,
        newRateVnd: n.newGrossVnd,
        ...(ota && plan.basis === 'new_room_rate' ? { roomChangeDifferenceVnd: n.diffVnd } : {}),
        ...(n.focVnd > 0 ? { focVnd: n.focVnd } : {}),
        ...(n.pendingFocVnd > 0 ? { pendingFocVnd: n.pendingFocVnd } : {}),
        ...(n.suggestedRateVnd !== undefined ? { suggestedRateVnd: n.suggestedRateVnd } : {}),
      })),
      ...(plan.removed.length > 0 ? { removedNights: plan.removed.map((r) => r.date) } : {}),
      roomTotalOldVnd: plan.roomOldVnd,
      roomTotalNewVnd: plan.roomNewVnd,
      extraPersonOldVnd: plan.feeOldVnd,
      extraPersonNewVnd: plan.feeNewVnd,
      ...(ota ? { roomChangeDifferenceVnd: plan.diffNewVnd } : {}),
      folioDeltaVnd: pm.folioDeltaVnd,
      // BR-429 (a1) v0.3.8: the better of the BR-107 tier and the BR-111 return-guest % – only one is > 0.
      losDiscountPct: plan.returningGuestPct > 0 && plan.losPct !== plan.tierPct ? 0 : plan.tierPct,
      ...(plan.returningGuestPct > 0 ? { returningGuestDiscountPct: plan.returningGuestPct } : {}),
      depositPaidVnd: depositPaid,
      // BR-429 (e): the deposit never changes; what is left is due at check-in, a surplus goes to BR-522.
      balanceDueAfterVnd: Math.max(0, balance - credit + pm.folioDeltaVnd),
      warnings: [
        ...pm.warnings,
        ...plan.nights.flatMap((n, i) =>
          n.manualRepriced ? [{ code: 'MANUAL_RATE_REPRICED', field: `nights[${i}]` }] : [],
        ),
      ],
    };
  }

  async move(
    tx: Tx,
    ctx: BookingContext,
    id: string,
    expectedVersion: number,
    body: Record<string, unknown>,
  ): Promise<ReservationRow> {
    const m = this.moveInput(body, false);
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    this.assertVersion(row, expectedVersion);
    const pm = await this.prepareMove(tx, ctx, row, m, 'write');
    const { seg, rm, from, to, plan } = pm;
    const targetRoomId = rm.id;
    const reasonCode = m.reasonCode;
    const note = m.note;
    // BR-429 (d) / (d1) v0.3.8 (DOM-S4-06, BA E02-10) / BR-414: EVERY B7/B8 that changes the money of the booking
    // (folioDeltaVnd ≠ 0 – any reason: a guest's date change, a force-majeure postponement, an OTTIMO move that
    // lowers the BR-110 fee) is saved only with "Đã báo khách số tiền mới" and the amount the desk showed (the SAME
    // plan – a stale preview → 409, never a silent other amount); a guest-requested move to another room needs
    // them even at 0. BR-429 (d2) v0.3.8 (DOM-S4-19): an amount the caller sent must match even when the tick is not
    // required – the guest heard that number (else 409, nothing saved); not sent → nothing to compare.
    const told =
      (reasonCode === 'guest_request' && pm.roomChanges && !row.external_contract) ||
      pm.folioDeltaVnd !== 0;
    if (told) {
      if (!m.applyDifference) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'applyDifference', code: 'REQUIRED' }],
          extras: { folioDeltaVnd: pm.folioDeltaVnd },
        });
      }
      if (m.expectedDeltaVnd === undefined) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'expectedDeltaVnd', code: 'REQUIRED' }],
          extras: { folioDeltaVnd: pm.folioDeltaVnd },
        });
      }
      if (m.expectedDeltaVnd !== pm.folioDeltaVnd) {
        throw problem('SURCHARGE_CHANGED', {
          extras: { surchargeVnd: pm.folioDeltaVnd, folioDeltaVnd: pm.folioDeltaVnd },
        });
      }
    } else if (m.expectedDeltaVnd !== undefined && m.expectedDeltaVnd !== pm.folioDeltaVnd) {
      throw problem('SURCHARGE_CHANGED', {
        extras: { surchargeVnd: pm.folioDeltaVnd, folioDeltaVnd: pm.folioDeltaVnd },
      });
    }

    await this.assertCapacityStable(tx, [rm]);
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

    // Nights exactly as planned (BR-106/107/429, DOM D-8): dropped nights void, kept nights re-priced/re-roomed,
    // new nights sold – price, calendar, BR-110 fee and its base from the plan.
    let totalRoom = row.total_room_vnd;
    if (plan.removed.length) {
      await voidNights(
        tx,
        row.id,
        'date_change',
        ctx.now,
        plan.removed.map((r) => r.date),
      );
    }
    await this.writePlannedNights(tx, ctx, row, plan, seg.id);
    if (!row.external_contract) {
      const live = await liveNights(tx, row.id);
      totalRoom = live.reduce((sum, n) => sum + n.amountVnd, 0);
    }
    const postpone = m.mode === 'postpone_instead_of_cancel';
    const disclose = reasonCode === 'guest_request' && pm.roomChanges;
    const depositPaid = await this.money.depositPaid(tx, row);
    const required = this.requiredDepositAfter(ctx, row, totalRoom, reasonCode, depositPaid);
    await tx.query(
      `UPDATE reservation SET arrival_date = $2, departure_date = $3, total_room_vnd = $4,
              deposit_required_vnd = $9,
              pricing_snapshot = CASE WHEN $10::bigint > 0
                THEN pricing_snapshot || jsonb_build_object('depositHeldVnd', $10::bigint) ELSE pricing_snapshot END,
              reschedule_count = reschedule_count + $5, conflict_state = CASE WHEN conflict_state = 'open' THEN 'resolved' ELSE conflict_state END,
              room_disclosed_to_guest = room_disclosed_to_guest OR $7,
              origin_room_id = COALESCE(origin_room_id, $8::uuid),
              updated_at = $6, version = version + 1
        WHERE id = $1`,
      [
        row.id,
        from,
        to,
        totalRoom,
        postpone ? 1 : 0,
        ctx.now,
        disclose,
        plan.originRoomId,
        required.requiredVnd,
        required.heldVnd,
      ],
    );
    // BR-309 (iv) v0.3.8 bổ sung 18/10 (S438R3-GAP-Q1, BR-309-15): a guest-requested date move with < 7 days to
    // the OLD arrival locks the refund tier of a paid booking – a later cancellation refunds at most that %.
    const refundCap = this.refundPctCapAfter(ctx, row, from, reasonCode, depositPaid);
    if (refundCap !== null) {
      await tx.query(
        `UPDATE reservation SET pricing_snapshot = pricing_snapshot || jsonb_build_object('refundPctCap', $2::int)
          WHERE id = $1`,
        [row.id, refundCap],
      );
    }
    if (row.conflict_state === 'open')
      await this.resolveIncident(tx, ctx, row.id, m.resolution as string);
    if (pm.overCapacity && row.channel_group === 'ota') {
      await this.setCapacityConflict(tx, ctx, row, m.capacityAck ?? row.capacity_ack_reason ?? '');
    } else if (row.capacity_conflict_at) {
      await this.clearCapacityConflict(tx, row.id);
    }
    if (from !== row.arrival_date)
      await recordChange(tx, row.id, 'arrival_date', row.arrival_date, from, ctx.now, reasonCode);
    if (to !== row.departure_date)
      await recordChange(tx, row.id, 'departure_date', row.departure_date, to, ctx.now, reasonCode);
    if (targetRoomId !== seg.room_id)
      await recordChange(tx, row.id, 'room', seg.room_no, rm.room_no, ctx.now, reasonCode);
    await recordTransition(tx, {
      reservationId: row.id,
      code: row.code,
      from: 'confirmed',
      to: 'confirmed',
      event: postpone ? 'B8' : row.conflict_state === 'open' ? 'B7a' : 'B7',
      reasonCode,
      reasonNote: note ?? null,
      now: ctx.now,
      requestId: ctx.requestId,
    });
    if (plan.basis === 'new_room_rate' && pm.folioDeltaVnd !== 0) {
      // 0.3.7 (ESC-019 A): a guest-requested move re-priced the booking – money log with the reason.
      await this.audit.recordMoney(tx, {
        action: 'reservation.room_change_repriced',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        before: {
          totalRoomVnd: row.total_room_vnd,
          roomNo: seg.room_no,
          extraPersonVnd: plan.feeOldVnd,
          roomChangeDifferenceVnd: plan.diffOldVnd,
        },
        after: {
          totalRoomVnd: totalRoom,
          roomNo: rm.room_no,
          extraPersonVnd: plan.feeNewVnd,
          roomChangeDifferenceVnd: plan.diffNewVnd,
          folioDeltaVnd: pm.folioDeltaVnd,
          nightlyRates: plan.nights.map((n) => ({ date: n.date, amountVnd: n.newGrossVnd })),
          rateSource: 'room_change',
        },
        reason: reasonCode,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    } else if (totalRoom !== row.total_room_vnd || plan.feeNewVnd !== plan.feeOldVnd) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.repriced',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        before: { totalRoomVnd: row.total_room_vnd, extraPersonVnd: plan.feeOldVnd },
        after: { totalRoomVnd: totalRoom, extraPersonVnd: plan.feeNewVnd },
        reason: reasonCode,
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
    // S4-05 / BR-429 (c): OTA difference against the origin room – reversed then re-posted (guest request).
    if (plan.diffLinesToReverse.length > 0 || plan.nights.some((n) => n.diffVnd !== n.oldDiffVnd)) {
      await this.money.repostDifferences(
        tx,
        row,
        plan.diffLinesToReverse,
        plan.nights
          .filter((n) => n.diffVnd > 0)
          .map((n) => ({
            date: n.date,
            amountVnd: n.diffVnd,
            from: seg.room_no ?? '',
            to: rm.room_no,
          })),
        { userId: ctx.actor.userId, requestId: ctx.requestId },
      );
    }
    // BR-434 (DOM 17/10, S4-14): where an approved FOC goes is decided by the folio sync from the DATES (old
    // live night lines vs the new nights) – the same rule for every flow, nothing to pass from here.
    await this.money.resynced(
      tx,
      await this.confirmedStay(tx, after),
      ctx.actor.userId,
      ctx.requestId,
    );
    await this.hooks.emit(
      tx,
      this.event('stay_changed', after, 'confirmed', postpone ? 'B8' : 'B7', targetRoomId),
    );
    return after;
  }

  /**
   * Writes the nights of a move plan exactly (B7/B7a/B8 – the B14 writer applies the same plan per night):
   * kept nights get their room, gross (discount kept), calendar and BR-110 fee/count/base; new nights are sold
   * at the planned price; the snapshot remembers the BR-107 % and which prices were typed.
   */
  /**
   * S4-38 (S438-MOVE-01/-02/-03, REGR-02/-03): K12 swap and B12 restore into another room are OTTIMO room moves
   * (BR-429 (b), (b1), (b2); BR-424 v0.3.8) – the SAME plan as B7 with an OTTIMO cause: prices kept, BR-110 fee =
   * min(fee recorded, fee at the protected base), the base stored per night, the origin room kept. Plan BEFORE the
   * nights change room (the planner reads the old room of each night); the caller re-syncs the folio after.
   */
  private async planOttimoRoomChange(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    target: RoomInfo,
  ): Promise<BookingMovePlan> {
    return this.planner.planBooking(tx, ctx, {
      row,
      flow: 'B7',
      cause: 'ottimo',
      fromDate: row.arrival_date,
      arrival: row.arrival_date,
      departure: row.departure_date,
      newRoom: target,
    });
  }

  private async writeOttimoRoomChange(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    plan: BookingMovePlan,
    segmentId: string,
    oldRoomId: string | null,
  ): Promise<void> {
    await this.writePlannedNights(tx, ctx, row, plan, segmentId);
    await tx.query(
      `UPDATE reservation SET origin_room_id = COALESCE(origin_room_id, $2::uuid, $3::uuid) WHERE id = $1`,
      [row.id, plan.originRoomId, oldRoomId],
    );
  }

  private async writePlannedNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    plan: BookingMovePlan,
    segmentId: string,
  ): Promise<void> {
    const added = plan.nights.filter((n) => n.added);
    if (added.length) {
      await insertNights(
        tx,
        {
          reservationId: row.id,
          segmentId,
          roomId: added[0]?.roomId ?? null,
          channelId: row.channel_id,
          stayType: row.stay_type,
          state: 'sold',
          isComplimentary: row.is_complimentary,
          now: ctx.now,
        },
        added.map((n) => ({
          date: n.date,
          amountVnd: n.newGrossVnd,
          source: n.manual ? 'manual' : 'calendar',
          ...(n.calendarVnd !== null ? { calendarVnd: n.calendarVnd } : {}),
        })),
      );
    }
    for (const n of plan.nights) {
      await tx.query(
        `UPDATE stay_night SET room_id = $3, reservation_segment_id = $4,
                room_revenue_gross_vnd = $5::bigint, room_revenue_vnd = $5::bigint - discount_vnd,
                calendar_rate_vnd = $6::bigint,
                extra_person_fee_vnd = CASE WHEN $10::boolean THEN $7::bigint ELSE extra_person_fee_vnd END,
                extra_person_count = CASE WHEN $10::boolean THEN $8::smallint ELSE extra_person_count END,
                extra_person_base = CASE WHEN $10::boolean THEN $9::smallint ELSE extra_person_base END,
                updated_at = $11
          WHERE reservation_id = $1 AND stay_date = $2 AND night_state <> 'void'`,
        [
          row.id,
          n.date,
          n.roomId,
          segmentId,
          n.newGrossVnd,
          n.calendarVnd,
          n.feeVnd,
          n.feeCount,
          n.feeBase,
          n.roomChanged || n.added,
          ctx.now,
        ],
      );
    }
    if (row.external_contract) return;
    const live = await liveNightRows(tx, row.id);
    // BR-309 v0.3.8 (S4-38, S438-CANCEL-02): "đêm cao điểm" follows the nights the booking has NOW; a paid booking
    // that had one keeps the no-refund rule after moving out of it (no "move then cancel").
    const oldPeak = !!(row.pricing_snapshot as { hasPeakNight?: boolean }).hasPeakNight;
    const nowPeak = this.hasPeakNight(
      ctx,
      live.map((n) => n.date),
    );
    const hasPeakNight =
      nowPeak || (oldPeak && row.folio_id !== null && (await this.money.depositPaid(tx, row)) > 0);
    const planned = new Map(plan.nights.map((n) => [n.date, n]));
    // ARC 16.18: the source the operation gives each night – kept (a typed night keeps `manual` and its anchor),
    // re-priced to a calendar, or an added night priced by the appendix 5A function (`default`).
    const sourceOf = plannedSource(row, planned);
    await tx.query(
      `UPDATE reservation SET pricing_snapshot = pricing_snapshot || $2::jsonb WHERE id = $1`,
      [
        row.id,
        JSON.stringify({
          losDiscountPct: plan.losPct,
          hasPeakNight,
          nights: live.map((n) => ({
            date: n.date,
            amountVnd: n.grossVnd,
            ...sourceOf(n.date),
            ...(n.calendarVnd !== null ? { calendarVnd: n.calendarVnd } : {}),
          })),
        }),
      ],
    );
  }

  /** Lock order reservation → rooms → folio (B14 locks its rooms, then this, then plans). */
  lockFolio(tx: Tx, row: ReservationRow): Promise<void> {
    return this.money.lockFolio(tx, row);
  }

  /**
   * B14 writer of one booking's plan (the B7 writer is `writePlannedNights`): each moved night gets its new room,
   * segment, gross (discount kept), calendar and BR-110 fee/count/base exactly as planned; `total_room_vnd`
   * follows the room nights; the origin room is stored on the first move (BR-424).
   */
  async writeMovedNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    plan: BookingMovePlan,
    segmentOf: ReadonlyMap<string, string>,
  ): Promise<void> {
    for (const n of plan.nights) {
      await tx.query(
        `UPDATE stay_night SET reservation_segment_id = COALESCE($3::uuid, reservation_segment_id), room_id = $4,
                room_revenue_gross_vnd = $5::bigint, room_revenue_vnd = $5::bigint - discount_vnd,
                calendar_rate_vnd = $6::bigint,
                extra_person_fee_vnd = CASE WHEN $10::boolean THEN $7::bigint ELSE extra_person_fee_vnd END,
                extra_person_count = CASE WHEN $10::boolean THEN $8::smallint ELSE extra_person_count END,
                extra_person_base = CASE WHEN $10::boolean THEN $9::smallint ELSE extra_person_base END,
                updated_at = $11
          WHERE reservation_id = $1 AND stay_date = $2 AND night_state <> 'void'`,
        [
          row.id,
          n.date,
          segmentOf.get(n.date) ?? null,
          n.roomId,
          n.newGrossVnd,
          n.calendarVnd,
          n.feeVnd,
          n.feeCount,
          n.feeBase,
          n.roomChanged,
          ctx.now,
        ],
      );
    }
    const roomDelta =
      row.channel_group === 'ota' || row.external_contract ? 0 : plan.roomNewVnd - plan.roomOldVnd;
    await tx.query(
      `UPDATE reservation SET total_room_vnd = total_room_vnd + $2,
              origin_room_id = COALESCE(origin_room_id, $3::uuid)
        WHERE id = $1`,
      [row.id, roomDelta, plan.originRoomId],
    );
    // BUG-R2-134: a guest-requested move re-prices typed nights to the new room's calendar – the snapshot forgets
    // that they were typed even when the room money happens not to change.
    const repriced = plan.nights.some((x) => x.priceSource !== 'kept');
    if ((roomDelta !== 0 || repriced) && !row.external_contract) {
      // ARC 16.18: an OTTIMO move keeps each night's source and anchor; a guest move re-prices the moved nights to
      // the new room's calendar (`calendar`).
      const sourceOf = plannedSource(row, new Map(plan.nights.map((x) => [x.date, x])));
      const live = await liveNightRows(tx, row.id);
      await tx.query(
        `UPDATE reservation SET pricing_snapshot = pricing_snapshot || $2::jsonb WHERE id = $1`,
        [
          row.id,
          JSON.stringify({
            nights: live.map((x) => ({
              date: x.date,
              amountVnd: x.grossVnd,
              ...sourceOf(x.date),
              ...(x.calendarVnd !== null ? { calendarVnd: x.calendarVnd } : {}),
            })),
          }),
        ],
      );
    }
  }

  /** S4-05 (BR-424 v0.3.5): reverse the live OTA differences from the move night, post the planned ones. */
  async repostPlannedDifferences(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    plan: BookingMovePlan,
    labels: { from: string; to: string },
  ): Promise<void> {
    const post = plan.nights.filter((n) => n.diffVnd > 0);
    if (plan.diffLinesToReverse.length === 0 && post.length === 0) return;
    await this.money.repostDifferences(
      tx,
      row,
      plan.diffLinesToReverse,
      post.map((n) => ({ date: n.date, amountVnd: n.diffVnd, ...labels })),
      { userId: ctx.actor.userId, requestId: ctx.requestId },
    );
  }

  /** Requested room of an open conflict (BR-312) – base of the "old" fee and the origin when upgraded. */
  private async requestedRoom(tx: Tx, reservationId: string): Promise<RoomInfo | null> {
    const { rows } = await tx.query<{ requested_room_id: string | null }>(
      `SELECT requested_room_id FROM overbooking_incident WHERE reservation_id = $1 AND status = 'open'
        ORDER BY detected_at DESC LIMIT 1`,
      [reservationId],
    );
    const id = rows[0]?.requested_room_id;
    return id ? this.room(tx, id) : null;
  }

  /** BR-012: display name of a room (null = not named yet). */
  async roomName(tx: Tx, roomId: string): Promise<string | null> {
    const { rows } = await tx.query<{ name: string | null }>(
      'SELECT name FROM room WHERE id = $1',
      [roomId],
    );
    return rows[0]?.name ?? null;
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
    const capacityAck = f.text('capacityWarningAckReason', 500, { min: 3 });
    f.done();
    const overCapacity = row.adults + row.children_6_11 > rm.max_occupancy;
    if (overCapacity && row.channel_group === 'ota') {
      // A-20: an OTA booking is never refused – warning + reason, then flagged.
      if (!capacityAck && !row.capacity_conflict_at) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'roomId', code: 'CAPACITY_EXCEEDED_WARNING' }],
          extras: { roomNo: rm.room_no, max: rm.max_occupancy },
        });
      }
      await this.setCapacityConflict(tx, ctx, row, capacityAck ?? row.capacity_ack_reason ?? '');
    } else {
      this.assertCapacity(rm, { adults: row.adults, children6to11: row.children_6_11 });
      if (row.capacity_conflict_at) await this.clearCapacityConflict(tx, row.id);
    }
    await this.assertSellable(tx, rm, row.arrival_date, row.departure_date);
    const seg = await singleSegment(tx, row.id);
    await this.occupancy.lockRooms(tx, [rm.id]);
    await this.money.lockFolio(tx, row);
    await this.assertCapacityStable(tx, [rm]);
    // S4-07 (BR-429 v0.3.4): B7a is OTTIMO's choice – prices kept, BR-110 fee per night = min(fee in the room the
    // OTA guest booked, fee in the assigned room); the SAME plan as B7 (ARC 10.4).
    const plan = await this.planner.planBooking(tx, ctx, {
      row,
      flow: 'B7',
      cause: 'ottimo',
      fromDate: row.arrival_date,
      arrival: row.arrival_date,
      departure: row.departure_date,
      newRoom: rm,
      requested: {
        room: await this.requestedRoom(tx, row.id),
        upgraded: resolution === 'upgraded',
      },
    });
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
    await this.writePlannedNights(tx, ctx, row, plan, seg.id);
    await tx.query(
      `UPDATE reservation SET conflict_state = 'resolved', origin_room_id = COALESCE(origin_room_id, $3::uuid),
              updated_at = $2, version = version + 1 WHERE id = $1`,
      [row.id, ctx.now, plan.originRoomId],
    );
    if (plan.feeNewVnd !== plan.feeOldVnd) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.repriced',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        before: { extraPersonVnd: plan.feeOldVnd },
        after: { extraPersonVnd: plan.feeNewVnd },
        reason: resolution as string,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
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
    // The BR-110 lines of the assigned room (collected at the desk – never in "Đã thu qua OTA").
    await this.money.resynced(
      tx,
      await this.confirmedStay(tx, after),
      ctx.actor.userId,
      ctx.requestId,
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
    await this.assertCapacityStable(tx, [roomA, roomB]);
    // Lock order: reservations (id order) → rooms → folios; the plans are read under these locks.
    await this.money.lockFolio(tx, first);
    await this.money.lockFolio(tx, second);
    const plans = new Map<string, BookingMovePlan>([
      [a.id, await this.planOttimoRoomChange(tx, ctx, a, roomB)],
      [b.id, await this.planOttimoRoomChange(tx, ctx, b, roomA)],
    ]);
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
      // BR-429 (b2) / BR-424 (S4-38): nights re-roomed with their fee/base by the OTTIMO plan, origin kept.
      await this.writeOttimoRoomChange(
        tx,
        ctx,
        r,
        plans.get(r.id) as BookingMovePlan,
        seg.id,
        old.id,
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
      await this.money.resynced(
        tx,
        await this.confirmedStay(tx, after),
        ctx.actor.userId,
        ctx.requestId,
      );
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
    // 0.3.7 D1 S4-08 (BE-B): service lines the desk keeps (BR-309 applies to no-show too).
    const retainLines = retainLinesOf(f, body.retainLines);
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
    const voidedIds = await voidNights(tx, row.id, 'no_show', ctx.now);
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
    // BR-311 with the B10 rule (BR-309 v0.3.8, DOM-S4-14): keep min(deposit paid, deposit required), never above
    // the booking value – what was paid above it is excess (BR-522); OTA → reported on the channel (kept 0).
    const retainable = await this.retainableDeposit(tx, row);
    const kept = row.channel_group === 'ota' ? 0 : retainable.cap;
    // S4-08 (BE-B): checks `retainLines` against the folio (422 before anything is committed).
    if (row.folio_id) {
      await this.money.closeStayPreview(tx, row, {
        retainLines,
        feeVnd: kept,
        feeCategory: 'no_show_fee',
        today: ctx.today,
      });
    }
    if (kept > 0) {
      await this.audit.recordMoney(tx, {
        action: 'reservation.no_show_deposit_retained',
        entityType: 'reservation',
        entityId: row.id,
        entityCode: row.code,
        after: { retainedVnd: kept, depositPaidVnd: retainable.depositPaid },
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
    // US-136 AC2/AC4 (BE-D, 0.3.7 D1): `no_show_marked` + "Cần chú ý" `ota_no_show_report` come from the
    // 'transitioned' hook (reporting/no-show-notices) in this transaction – no second push here.
    const after = await loadReservation(tx, row.id, ctx.actor);
    const seg = segs[0];
    await this.syncKit(tx, ctx, after, seg?.room_id ?? null, seg?.base_occupancy ?? null);
    await outboxAvailability(
      tx,
      segs.map((s) => ({ roomId: s.room_id, from: s.from_date, to: s.to_date })),
      'reservation.no_show',
    );
    // BR-311: a direct/agent no-show keeps the retainable deposit (other revenue, `kept` above).
    await this.money.voided(
      tx,
      {
        reservationId: row.id,
        reservationCode: row.code,
        folioId: row.folio_id,
        voidedStayNightIds: voidedIds,
        retainedVnd: kept,
        retainedKind: kept > 0 ? 'no_show_fee' : null,
        reason: 'no_show',
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
        services: { retainLines },
      },
      ctx.actor.userId,
    );
    // S4-06 (BE-B, BR-522): money left on the folio of a no-show → ONE refund request + "Cần chú ý".
    await this.money.closeStayCredit(tx, row, 'no_show', ctx.actor, ctx.requestId);
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
    const newRoomId = f.uuid('roomId', false);
    const allowUnassigned = f.bool('allowUnassigned') ?? false;
    f.done();
    const row = await loadReservation(tx, id, ctx.actor, { forUpdate: true });
    if (expectedVersion !== null) this.assertVersion(row, expectedVersion);
    if (row.status !== 'no_show') throw this.invalid(row);
    const seg = await singleSegment(tx, row.id);
    const mgr = hasAny(ctx.actor.roles, MGR_PLUS) || opts.approved === true;
    // 0.3.5 A-21: another room / the unassigned lane are MGR+ decisions.
    if ((newRoomId || allowUnassigned) && !mgr) throw problem('FORBIDDEN_ACTION');
    const inBusinessDay = ctx.today === row.arrival_date;
    const free =
      !!seg.room_id &&
      (await this.occupancy.isFree(tx, seg.room_id, row.arrival_date, row.departure_date, [
        seg.id,
      ]));
    // BR-315 + DOM D-3 (c): FD/FDL restore alone only within the 3 conditions and never an OTA booking (it may
    // already be reported as no-show on the channel) → otherwise approval request (SM-10), 202.
    if (!mgr && (!(inBusinessDay && free) || row.channel_group === 'ota')) {
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
    let roomId: string | null = newRoomId ?? seg.room_id;
    let unassigned = false;
    let checkedRoom: RoomInfo | null = null;
    if (newRoomId) {
      const rm = await this.room(tx, newRoomId);
      checkedRoom = rm;
      if (!rm) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
      }
      this.assertCapacity(rm, { adults: row.adults, children6to11: row.children_6_11 });
      await this.assertSellable(tx, rm, row.arrival_date, row.departure_date);
    } else if (!free && (allowUnassigned || opts.approved === true)) {
      // DOM D-3 (b): the room was sold again – an approved restore never fails, the booking goes to the
      // unassigned lane and the desk assigns a room (B7a).
      roomId = null;
      unassigned = true;
    }
    if (roomId) {
      await this.occupancy.lockRooms(tx, [roomId, ...(seg.room_id ? [seg.room_id] : [])]);
      if (checkedRoom) await this.assertCapacityStable(tx, [checkedRoom]);
      await this.occupancy.update(
        tx,
        { segmentId: seg.id },
        { roomId, from: row.arrival_date, to: row.departure_date, active: true },
        ctx.now,
        { withNames: true, persons: row.adults + row.children_6_11, excludeSegmentIds: [seg.id] },
      );
      if (roomId !== seg.room_id) {
        await tx.query(
          `UPDATE reservation_segment SET room_id = $2, change_reason_code = 'overbooking', updated_at = $3
            WHERE id = $1`,
          [seg.id, roomId, ctx.now],
        );
        await recordChange(
          tx,
          row.id,
          'room',
          seg.room_no,
          checkedRoom?.room_no ?? roomId,
          ctx.now,
          'no_show_restore',
        );
      }
    } else if (unassigned) {
      await tx.query(
        'UPDATE reservation_segment SET room_id = NULL, updated_at = $2 WHERE id = $1',
        [seg.id, ctx.now],
      );
      // S438-MOVE-03 / REGR-02 (BR-424 v0.3.8): the room it leaves stays the origin of a later OTA difference.
      await tx.query(
        `UPDATE reservation SET conflict_state = 'open', origin_room_id = COALESCE(origin_room_id, $2::uuid)
          WHERE id = $1`,
        [row.id, seg.room_id],
      );
      await recordChange(tx, row.id, 'room', seg.room_no, null, ctx.now, 'no_show_restore');
      await this.openIncident(
        tx,
        ctx,
        {
          id: row.id,
          code: row.code,
          from: row.arrival_date,
          to: row.departure_date,
          roomId: seg.room_id as string,
        },
        'no_show_restore',
      );
    } else {
      throw this.invalid(row);
    }
    // Nights sold again with their snapshot prices (BR-315 (3) "không đổi giá"): the voided rows are revived
    // (same stay_night ids, so the folio does not post the same night twice). Into another room: revived in
    // the room they had, then moved by the OTTIMO plan (S4-38: BR-110 fee min + protected base, origin room).
    const moving = !!roomId && roomId !== seg.room_id && !!seg.room_id && !!checkedRoom;
    await tx.query(
      `UPDATE stay_night SET night_state = 'sold', voided_at = NULL, void_reason = NULL, prev_state = NULL,
              room_id = $3, updated_at = $2
        WHERE reservation_id = $1 AND night_state = 'void' AND void_reason = 'no_show'`,
      [row.id, ctx.now, moving ? seg.room_id : roomId],
    );
    if (moving) {
      await this.money.lockFolio(tx, row);
      const plan = await this.planOttimoRoomChange(tx, ctx, row, checkedRoom as RoomInfo);
      await this.writeOttimoRoomChange(tx, ctx, row, plan, seg.id, seg.room_id);
    }
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
    // US-136 AC4/AC5 (BE-D): `no_show_restored` (OWN + MGR, not the restorer) and the `revoke` line come from
    // the 'transitioned' hook (reporting/no-show-notices) – no second push here.
    const after = await loadReservation(tx, row.id, ctx.actor);
    const base = roomId ? ((await this.room(tx, roomId))?.base_occupancy ?? null) : null;
    await this.syncKit(tx, ctx, after, roomId, base);
    await outboxAvailability(
      tx,
      [{ roomId, from: row.arrival_date, to: row.departure_date }],
      'reservation.restored',
    );
    // DOM D-3 (a): revived nights keep the snapshot price; the folio reverses the no-show fee and re-posts.
    await this.money.resynced(
      tx,
      await this.confirmedStay(tx, after),
      ctx.actor.userId,
      ctx.requestId,
    );
    // S438-CANCEL-03 (BE-B, BR-522 v0.3.8): the refund request the no-show created and "Cần chú ý"
    // closed_reservation_credit follow the money of the restored stay.
    await this.money.reopenStayCredit(tx, after, ctx.actor, ctx.requestId);
    await this.hooks.emit(tx, this.event('transitioned', after, 'no_show', 'B12', roomId));
    return { row: after };
  }

  // ─────────────────────────── B6 – hold expiry (SYS) ───────────────────────────

  /**
   * J1 (`hold.expire`, B6) for the property in context. Exactly once per hold: a batch is taken with
   * FOR UPDATE SKIP LOCKED and re-checked under the lock, so concurrent or repeated runs never cancel twice.
   * Each hold runs in its own SAVEPOINT – one bad row is reported in `failures` and the others still expire
   * (FB-R2-SEC-BE-24). A hold with money received (DOM D-9, US-085 AC4) is never auto-cancelled: red push to
   * its sale + FD/FDL once, and to the manager once the BR-302 cap (12:00 on arrival day) has passed.
   */
  async expireHolds(
    tx: Tx,
    now: Date,
    tz: string,
    today: LocalDate,
  ): Promise<{
    expired: number;
    keptPaid: number;
    failed: number;
    failures: Array<{ id: string; code: string }>;
  }> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM reservation WHERE status = 'hold' AND hold_expires_at <= $1
        ORDER BY hold_expires_at LIMIT ${HOLD_EXPIRY_BATCH} FOR NO KEY UPDATE SKIP LOCKED`,
      [now],
    );
    const latest = await this.params.get<LocalTime>(tx, 'hold_latest_time_on_arrival', today);
    let expired = 0;
    let keptPaid = 0;
    const failures: Array<{ id: string; code: string }> = [];
    for (const [n, { id }] of rows.entries()) {
      const sp = `hold_${n}`;
      await tx.query(`SAVEPOINT ${sp}`);
      try {
        const outcome = await this.expireOne(tx, id, now, tz, latest);
        await tx.query(`RELEASE SAVEPOINT ${sp}`);
        if (outcome === 'expired') expired += 1;
        if (outcome === 'kept_paid') keptPaid += 1;
      } catch (err) {
        await tx.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        failures.push({ id, code: errorCode(err) });
      }
    }
    return { expired, keptPaid, failed: failures.length, failures };
  }

  private async expireOne(
    tx: Tx,
    id: string,
    now: Date,
    tz: string,
    latest: LocalTime,
  ): Promise<'expired' | 'kept_paid' | 'skipped'> {
    const system = SYSTEM_ACTOR;
    const row = await loadReservation(tx, id, system);
    if (row.status !== 'hold' || !row.hold_expires_at || row.hold_expires_at > now)
      return 'skipped';
    const recipients = [row.created_by, row.closer_user_id].filter((u): u is string => !!u);
    if ((await this.money.depositPaid(tx, row)) > 0) {
      // DOM D-9: money received → not cancelled; the people in charge must act (B4 / MGR accepts / B5 refund).
      await outboxStaffPush(
        tx,
        {
          kind: 'hold_overdue_with_deposit',
          roles: ['front_desk', 'front_desk_lead'],
          userIds: [...new Set(recipients)],
          refType: 'reservation',
          refId: id,
          refCode: row.code,
        },
        `hold_overdue_partial:${id}:${row.hold_expires_at.toISOString()}`,
      );
      if (now.getTime() >= atLocal(row.arrival_date, latest, tz).getTime()) {
        await outboxStaffPush(
          tx,
          {
            kind: 'hold_overdue_cap',
            roles: ['manager'],
            refType: 'reservation',
            refId: id,
            refCode: row.code,
          },
          `hold_overdue_cap:${id}`,
        );
      }
      return 'kept_paid';
    }
    const segs = await activeSegments(tx, id);
    await this.occupancy.lockRooms(
      tx,
      segs.flatMap((s) => (s.room_id ? [s.room_id] : [])),
    );
    for (const s of segs) await this.occupancy.release(tx, { segmentId: s.id }, now);
    const voidedIds = await voidNights(tx, id, 'hold_expired', now);
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
    if (recipients.length) {
      await outboxStaffPush(
        tx,
        {
          kind: 'hold_expired',
          roles: [],
          userIds: [...new Set(recipients)],
          refType: 'reservation',
          refId: id,
          refCode: row.code,
        },
        `hold_expired:${id}`,
      );
    }
    const after = await loadReservation(tx, id, system);
    await this.money.voided(
      tx,
      {
        reservationId: row.id,
        reservationCode: row.code,
        folioId: row.folio_id,
        voidedStayNightIds: voidedIds,
        retainedVnd: 0,
        retainedKind: null,
        reason: 'hold_expired',
      },
      null,
    );
    await this.leads.onHoldEnded(tx, row.quote_id); // SM-09 (B6): lead back to `quoted`
    await this.hooks.emit(
      tx,
      this.event('transitioned', after, 'hold', 'B6', segs[0]?.room_id ?? null, 'hold_expired'),
    );
    return 'expired';
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
    const voidedIds = await voidNights(tx, row.id, 'relocated_external', ctx.now);
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
    await this.money.voided(
      tx,
      {
        reservationId: row.id,
        reservationCode: row.code,
        folioId: row.folio_id,
        voidedStayNightIds: voidedIds,
        retainedVnd: 0,
        retainedKind: null,
        reason: 'overbooking_relocated',
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      },
      ctx.actor.userId,
    );
    // DOM BE-12 / A-40: the guest is moved out by OTTIMO – 100 % of what was paid goes back (refund request,
    // reason overbooking_relocated; destination + payout through BE-B A-33). Nothing retained (voidStay 0).
    const refundable = await this.money.credit(tx, row);
    if (refundable > 0) {
      await this.approvals.submit(tx, ctx.actor, {
        type: 'refund',
        amountVnd: refundable,
        reasonCode: 'overbooking_relocated',
        ...(note ? { reasonNote: note } : {}),
        targetType: 'reservation',
        targetId: row.id,
        targetCode: row.code,
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    }
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
