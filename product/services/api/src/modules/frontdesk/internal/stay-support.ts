/**
 * Shared helpers of the front desk use cases (EP03-05): parameters, the booking's current segment, the
 * surcharge base night (BR-411/412/413/415), same-day arrivals (BR-412 grace, BR-416), housekeeping tasks the
 * desk creates (B14/B18, BR-807 ranks, BR-812 kits), FOC requests on a surcharge line and the ports of the other
 * zones (FrontdeskPorts). Everything runs in the caller's transaction.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, addDays, localDate } from '../../../shared/time';
import { type ApprovalRow, ApprovalService } from '../../approvals/public/approval.service';
import { EventsService } from '../../events/public/events.service';
import { FolioService } from '../../folio/public/folio.service';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { OccupancyService } from '../../reservations/public/occupancy.service';
import { calendarRate, isSpecialDate, rateBounds } from '../../reservations/public/pricing';
import {
  type SourcedNight,
  addedNightPrice,
  referenceNightRate,
  stayRooms,
} from '../../reservations/public/added-night-price';
import { PricingService } from '../../reservations/public/pricing.service';
import {
  type Actor,
  type BookingContext,
  type Fields,
  type ReservationRow,
  type SegmentRow,
  ReservationStayPort,
  activeSegments,
  loadReservation,
} from '../../reservations/public/stay-port';
import type {
  FrontdeskChildDataPort,
  FrontdeskGuestAccessPort,
  FrontdeskMinibarPort,
  FrontdeskRegistrationPort,
} from '../public/ports';
import { RoomStatusService } from '../public/room-status.service';
import { businessMinutes, nightlyEquivalent } from '../public/stay-rules';

/** Resolved ports (owner implementation or the fail-closed default – see frontdesk.module.ts). */
export class FrontdeskPorts {
  constructor(
    readonly registration: FrontdeskRegistrationPort,
    readonly guestAccess: FrontdeskGuestAccessPort,
    readonly childData: FrontdeskChildDataPort,
    readonly minibar: FrontdeskMinibarPort,
  ) {}
}

/** BR-807 rank of a task (EP07-08 3.3): small = first. */
export const TASK_RANK = {
  kitInHouse: 1,
  arrivalToday: 2,
  checkoutNoArrival: 5,
  low: 7,
} as const;

export interface SameDayArrival {
  reservationId: string;
  code: string;
  guestName: string | null;
  etaTime: LocalTime | null;
}

export interface FocRequestInput {
  amountVnd: number;
  reasonCode: string;
  note: string | null;
}

/** BR-417 appendix 5A: per-stay inputs of `addedNightRate` (one per operation – AN-42). */
export interface AddedNightContext {
  /** Step 2: the room the added night goes to (CĐT). */
  roomId: string;
  /** Step 1: the room the guest bought (CKM) – the night's room when unknown or not applicable. */
  boughtRoomId: string;
  /** The stay's origin room (anchor of nights typed before any room). */
  originRoomId: string;
  /** Step 3: the typed nights of an AGREED stay (empty otherwise) and which side of the added night to search. */
  nights: SourcedNight[];
  side: 'before' | 'after';
  /** ARC 16.18: `anchorRoomId` a night typed now records (null = the origin room). */
  anchorRoomId: string | null;
  /** S4-36: list prices and group of the rooms priced by this operation, read once (`directRate`). */
  rooms: RoomPriceCache;
}

/** S4-36: per-operation cache of a room's list prices and group code (one read per room, not per night). */
export type RoomPriceCache = Map<
  string,
  Promise<{
    listPrices: Array<{ effectiveFrom: string; nightlyVnd: number }>;
    groupCode: string | null;
  }>
>;

@Injectable()
export class StaySupport {
  constructor(
    @Inject(ReservationStayPort) readonly stay: ReservationStayPort,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(OccupancyService) readonly occupancy: OccupancyService,
    @Inject(PricingService) private readonly pricing: PricingService,
    @Inject(RoomStatusService) readonly roomStatus: RoomStatusService,
    @Inject(EventsService) readonly events: EventsService,
    @Inject(FolioService) readonly folios: FolioService,
    @Inject(ApprovalService) readonly approvals: ApprovalService,
    @Inject(FrontdeskPorts) readonly ports: FrontdeskPorts,
  ) {}

  context(tx: Tx, actor: Actor, requestId?: string): Promise<BookingContext> {
    return this.stay.context(tx, actor, requestId);
  }

  param<T>(tx: Tx, ctx: BookingContext, key: string): Promise<T> {
    return this.params.get<T>(tx, key, ctx.today);
  }

  async optionalParam<T>(tx: Tx, ctx: BookingContext, key: string): Promise<T | undefined> {
    try {
      return await this.params.get<T>(tx, key, ctx.today);
    } catch (err) {
      if (err instanceof ParameterMissingError) return undefined;
      throw err;
    }
  }

  /** Local wall-clock time of `now` (HH:mm) in the property time zone. */
  localTime(ctx: BookingContext, at: Date = ctx.now): LocalTime {
    return ctx.iso(at).slice(11, 16);
  }

  /** Active segment covering `date` (from ≤ date < to), else the last one (B14 history keeps old ones). */
  async segmentOn(tx: Tx, reservationId: string, date: LocalDate): Promise<SegmentRow> {
    const segs = await activeSegments(tx, reservationId);
    const hit = segs.find((s) => s.from_date <= date && s.to_date > date) ?? segs[segs.length - 1];
    if (!hit) throw new Error(`booking ${reservationId} has no active segment`);
    return hit;
  }

  async lastSegment(tx: Tx, reservationId: string): Promise<SegmentRow> {
    const segs = await activeSegments(tx, reservationId);
    const last = segs[segs.length - 1];
    if (!last) throw new Error(`booking ${reservationId} has no active segment`);
    return last;
  }

  /**
   * Another booking arriving in `roomId` on `date` (BR-412 grace, BR-416, US-031 order): `confirmed` and
   * `hold` (DOM S3-14 – a hold with a partial deposit is a paying guest holding the room).
   */
  async sameDayArrival(
    tx: Tx,
    roomId: string,
    date: LocalDate,
    excludeReservationId: string,
  ): Promise<SameDayArrival | null> {
    const { rows } = await tx.query<{
      id: string;
      code: string;
      full_name: string | null;
      eta_time: string | null;
    }>(
      `SELECT r.id, r.code, g.full_name, to_char(r.eta_time, 'HH24:MI') AS eta_time
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
         LEFT JOIN guest g ON g.id = r.booker_guest_id
        WHERE s.room_id = $1 AND s.active AND s.from_date = $2 AND r.id <> $3
          AND r.status IN ('confirmed', 'hold')
        ORDER BY r.eta_time NULLS LAST LIMIT 1`,
      [roomId, date, excludeReservationId],
    );
    const r = rows[0];
    return r
      ? { reservationId: r.id, code: r.code, guestName: r.full_name, etaTime: r.eta_time }
      : null;
  }

  /** A free room of the same group for the night of `date` (BR-416 "còn căn thay thế cùng nhóm"). */
  async sameGroupRoomFree(
    tx: Tx,
    roomId: string,
    date: LocalDate,
    persons: number,
  ): Promise<boolean> {
    const { rows } = await tx.query<{ room_group_id: string }>(
      'SELECT room_group_id FROM room WHERE id = $1',
      [roomId],
    );
    const groupId = rows[0]?.room_group_id;
    if (!groupId) return false;
    const s = await this.occupancy.suggest(tx, {
      roomId,
      from: date,
      to: addDays(date, 1),
      persons,
      limit: 6,
    });
    const { rows: same } = await tx.query<{ id: string }>(
      'SELECT id FROM room WHERE room_group_id = $1 AND id = ANY($2::uuid[])',
      [groupId, s.map((x) => x.roomId)],
    );
    return same.length > 0;
  }

  /** Nightly list prices of a room (PriceRoom for the direct calendar – BR-415/421). */
  async listPrices(tx: Tx, roomId: string) {
    const { rows } = await tx.query<{ effective_from: string; nightly: number }>(
      `SELECT effective_from::text AS effective_from, nightly_list_price_vnd AS nightly
         FROM room_list_price WHERE room_id = $1 ORDER BY effective_from`,
      [roomId],
    );
    return rows.map((r) => ({ effectiveFrom: r.effective_from, nightlyVnd: r.nightly }));
  }

  /**
   * BR-417 appendix 5A steps 1–3 (DOM 18/10, vòng sửa 5 – BUG-R2-160/161/162; ARC 16.6 (a), 16.18): what
   * `addedNightRate` needs once per operation – `pick` = the side of the stay the night is added to (B9a `first`,
   * B13/B18 `last`), `roomId` = the room of that night (CĐT).
   * - The room bought over the whole stay as the booking holding the neighbour night sees it (B13/B18: the last
   *   booking of the stay – an OTA child after S4-09 keeps the room bought before the temporary move).
   * - The min applies to direct/agent bookings and the direct child nights of an OTA booking (r3-1), not to a
   *   manual long stay / internal use.
   * - The reference nights: only an AGREED stay (typed at booking – `bookingRateSource`, BUG-R2-126) has them;
   *   S4-35 / B13 typed prices of a calendar booking never make it agreed (AN-20, AN-21).
   */
  async addedNightContext(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    pick: 'first' | 'last',
    roomId: string,
  ): Promise<AddedNightContext> {
    const minApplies =
      (row.channel_group === 'direct' ||
        row.channel_group === 'agent' ||
        row.channel_group === 'ota') &&
      !row.external_contract;
    const holder = pick === 'last' ? (await this.effectiveStay(tx, ctx, row)).last : row;
    const view = minApplies
      ? await this.stay.boughtRoom(tx, holder.id)
      : { boughtRoomId: null, originRoomId: null };
    // BUG-R2-195: the one fallback shared with MovePlanner (never moved, no stored origin → the room now).
    const { originRoomId, boughtRoomId } = stayRooms(view, roomId);
    const agreed =
      (row.channel_group === 'direct' || row.channel_group === 'agent') &&
      !row.external_contract &&
      row.stay_type === 'short' &&
      (row.pricing_snapshot as { bookingRateSource?: string }).bookingRateSource ===
        'manual_agreed';
    const nights: SourcedNight[] = agreed
      ? (await this.stay.pricedNights(tx, row)).map((n) => ({
          date: n.date,
          calendarVnd: n.calendarVnd,
          source: n.source ?? (n.manual ? 'manual' : 'calendar'),
          anchorRoomId: n.anchorRoomId ?? null,
        }))
      : [];
    return {
      roomId,
      boughtRoomId,
      originRoomId,
      nights,
      side: pick === 'first' ? 'after' : 'before',
      anchorRoomId: boughtRoomId !== originRoomId ? boughtRoomId : null,
      rooms: new Map(),
    };
  }

  /**
   * BR-417 appendix 5A steps 3–5 – THE default price of a night added on `date` (B9a, B13, B18's extra night,
   * `lateFeeAsNightVnd`, `extraNightDefaultRateVnd`, `currentBookingRateVnd`): `addedNightPrice` on the calendars of
   * the room bought and of the night's room (special date included) with the reference night of an agreed stay.
   * `floorVnd`/`ceilingVnd` = the desk's range (both rooms when the min applies). `keepVnd` =
   * `currentBookingRateVnd` (AN-45 – by source: agreed reference or min; null = the night room's calendar).
   */
  async addedNightRate(
    tx: Tx,
    ctx: BookingContext,
    c: AddedNightContext,
    date: LocalDate,
  ): Promise<{
    rateVnd: number;
    calendarVnd: number;
    floorVnd: number;
    ceilingVnd: number;
    special: boolean;
    keepVnd: number | null;
  }> {
    const night = await this.directRate(tx, ctx, c.roomId, date, c.rooms);
    const sameRoom = c.boughtRoomId === c.roomId;
    const bought = sameRoom ? night : await this.directRate(tx, ctx, c.boughtRoomId, date, c.rooms);
    const special = (d: LocalDate) => isSpecialDate(d, ctx.params.calendar.specialDates);
    const p = addedNightPrice({
      bought,
      night,
      sameRoom,
      special: night.special,
      referenceVnd: referenceNightRate(
        c.nights,
        date,
        c.side,
        c.boughtRoomId,
        c.originRoomId,
        special,
      ),
    });
    return {
      rateVnd: p.rateVnd,
      calendarVnd: night.rateVnd,
      floorVnd: p.floorVnd,
      ceilingVnd: p.ceilingVnd,
      special: night.special,
      keepVnd: p.keep ? p.rateVnd : null,
    };
  }

  /** Direct-channel calendar rate of `roomId` on `date` (BR-104) with its BR-105 bounds. */
  async directRate(
    tx: Tx,
    ctx: BookingContext,
    roomId: string,
    date: LocalDate,
    cache?: RoomPriceCache,
  ): Promise<{ rateVnd: number; floorVnd: number; ceilingVnd: number; special: boolean }> {
    const read = async () => {
      const { rows } = await tx.query<{ code: string }>(
        'SELECT rg.code FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id WHERE rm.id = $1',
        [roomId],
      );
      return { listPrices: await this.listPrices(tx, roomId), groupCode: rows[0]?.code ?? null };
    };
    let facts = cache?.get(roomId);
    if (!facts) {
      facts = read();
      cache?.set(roomId, facts);
    }
    const { listPrices, groupCode } = await facts;
    const list = PricingService.listPriceOn({ roomId, baseOccupancy: 0, listPrices }, date);
    if (list === null) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }],
        detail: 'room has no list price for the night',
      });
    }
    const p = ctx.params;
    const c = calendarRate(list, date, 'direct', p.calendar, p.nightRateUnit);
    const groupBase = groupCode !== null ? p.otaBaseRates[groupCode] : undefined;
    const b =
      groupBase !== undefined
        ? rateBounds(groupBase, p.rateFloorPct, p.rateCeilingPct, p.otaRateUnit)
        : rateBounds(list, p.rateFloorPct, p.rateCeilingPct, p.nightRateUnit);
    return { rateVnd: c.rateVnd, ...b, special: c.uplift === 'special' };
  }

  /** Nightly equivalent of a long stay (BR-102: monthly rent ÷ long_stay_daily_divisor). */
  async longStayNight(tx: Tx, ctx: BookingContext, row: ReservationRow): Promise<number> {
    const manual = row.manual_long_stay as { monthly_rent_vnd?: number } | null;
    const rent = manual?.monthly_rent_vnd;
    if (!rent) throw problem('INVALID_TRANSITION', { detail: 'long stay without monthly rent' });
    const divisor = await this.param<number>(tx, ctx, 'long_stay_daily_divisor');
    return nightlyEquivalent(rent, divisor, ctx.params.nightRateUnit);
  }

  /**
   * Base of the early/late surcharge (spec EP03-05 0): direct/agent → the booking's first/last night price;
   * OTA → the direct channel's current rate of that night (BR-415); long stay → monthly rent ÷ 30 (BR-413).
   */
  async surchargeBase(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    which: 'first' | 'last',
    roomId: string,
  ): Promise<number> {
    if (row.stay_type === 'long') return this.longStayNight(tx, ctx, row);
    const night = which === 'first' ? row.arrival_date : addDays(row.departure_date, -1);
    if (row.channel_group === 'ota') return (await this.directRate(tx, ctx, roomId, night)).rateVnd;
    const { rows } = await tx.query<{ gross: number }>(
      `SELECT room_revenue_gross_vnd AS gross FROM stay_night
        WHERE reservation_id = $1 AND night_state <> 'void' AND stay_date = $2`,
      [row.id, night],
    );
    if (rows[0]) return rows[0].gross;
    return (await this.directRate(tx, ctx, roomId, night)).rateVnd;
  }

  /** Persons counted for capacity/extra fee (BR-110: adults + children 6–11). */
  counted(row: Pick<ReservationRow, 'adults' | 'children_6_11'>): number {
    return row.adults + row.children_6_11;
  }

  /** Housekeeping task created by the desk (B14/B18): duplicate open cleaning of the day is a no-op. */
  async createTask(
    tx: Tx,
    ctx: BookingContext,
    t: {
      roomId: string;
      reservationId: string | null;
      type:
        | 'checkout_clean'
        | 'priority_clean'
        | 'adhoc_clean'
        | 'minibar_refill'
        | 'extra_guest_kit_collect'
        | 'extra_guest_kit_transfer'
        | 'extra_guest_kit_prepare';
      quantity?: number;
      dueDate: LocalDate;
      dueAt?: Date | null;
      notBeforeTime?: LocalTime | null;
      rank: number;
      note?: string | null;
    },
  ): Promise<string | null> {
    const id = uuidv7();
    const r = await tx.query<{ id: string }>(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, quantity, status,
         due_at, due_date, not_before_time, priority_rank, source, note, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, $10, $11, 'system', $12, $13, $14, $13)
       ON CONFLICT DO NOTHING RETURNING id`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        t.roomId,
        t.reservationId,
        t.type,
        t.quantity ?? 1,
        t.dueAt ?? null,
        t.dueDate,
        t.notBeforeTime ?? null,
        t.rank,
        t.note ?? null,
        ctx.now,
        ctx.actor.userId,
      ],
    );
    const created = r.rows[0]?.id ?? null;
    if (created) await this.taskChanged(tx, created, t.reservationId);
    return created;
  }

  /** outbox `hk_task.changed` (HK app) + SSE hint – ids only. */
  async taskChanged(tx: Tx, taskId: string, reservationId: string | null): Promise<void> {
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'hk_task.changed', $4, $5)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        JSON.stringify({ taskId, reservationId }),
        `hk_task.changed:${taskId}:${uuidv7()}`,
      ],
    );
    await this.events.publish(tx, 'hk_task.changed', taskId);
  }

  /** Open extra-guest-kit tasks of a booking (BR-812). */
  async openKitTasks(
    tx: Tx,
    reservationId: string,
  ): Promise<
    Array<{ id: string; type: string; room_id: string; quantity: number; status: string }>
  > {
    const { rows } = await tx.query<{
      id: string;
      type: string;
      room_id: string;
      quantity: number;
      status: string;
    }>(
      `SELECT id, type, room_id, quantity, status FROM hk_task
        WHERE reservation_id = $1 AND type LIKE 'extra_guest_kit_%' AND status IN ('open', 'in_progress')
        ORDER BY created_at FOR UPDATE`,
      [reservationId],
    );
    return rows;
  }

  async doneKitPrepared(tx: Tx, reservationId: string, roomId: string): Promise<number> {
    const { rows } = await tx.query<{ q: number }>(
      `SELECT COALESCE(sum(quantity), 0)::int AS q FROM hk_task
        WHERE reservation_id = $1 AND room_id = $2 AND type IN ('extra_guest_kit_prepare', 'extra_guest_kit_transfer')
          AND status = 'done'`,
      [reservationId, roomId],
    );
    return rows[0]?.q ?? 0;
  }

  async cancelTask(tx: Tx, ctx: BookingContext, taskId: string, reason: string): Promise<void> {
    await tx.query(
      `UPDATE hk_task SET status = 'cancelled', cancel_reason = $2, updated_at = $3, version = version + 1
        WHERE id = $1 AND status IN ('open', 'in_progress')`,
      [taskId, reason, ctx.now],
    );
    await this.taskChanged(tx, taskId, null);
  }

  /** BR-812 (5): kit still open when the guest arrives → first in the queue (rank 1). */
  async raiseKitPriority(tx: Tx, ctx: BookingContext, reservationId: string): Promise<number> {
    const { rows } = await tx.query<{ id: string }>(
      `UPDATE hk_task SET priority_rank = $2, updated_at = $3, version = version + 1
        WHERE reservation_id = $1 AND type IN ('extra_guest_kit_prepare', 'extra_guest_kit_transfer')
          AND status IN ('open', 'in_progress') AND priority_rank <> $2
        RETURNING id`,
      [reservationId, TASK_RANK.kitInHouse, ctx.now],
    );
    for (const r of rows) await this.taskChanged(tx, r.id, reservationId);
    return rows.length;
  }

  /** Mid-stay kit due (BR-812 (2)): now + extra_guest_kit_midstay_due_minutes. */
  async midstayKitDue(tx: Tx, ctx: BookingContext): Promise<Date> {
    const minutes = await this.param<number>(tx, ctx, 'extra_guest_kit_midstay_due_minutes');
    return new Date(ctx.now.getTime() + minutes * 60_000);
  }

  /**
   * FOC on a surcharge line the desk just posted (`requestFocForSurcharge`, EP00 7.1): a pending negative line
   * + ApprovalService.submit – the folio module's approval hook posts or rejects it (SM-10, BR-434).
   */
  async requestFoc(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    folioId: string,
    line: { id: string; amountVnd: number; category: string; serviceDate?: string | null },
    input: FocRequestInput,
    opts: { field?: string; kind?: 'foc' | 'special_discount'; noSelfApply?: boolean } = {},
  ): Promise<ApprovalRow> {
    // S4-25 (BE-B) – S4-23 (6), BR-434 v0.3.6: a FOC already approved / pending on the same key (late check-out is
    // ONE key per stay) leaves less to ask: max = line − (applied + asked).
    const max = await this.folios.reductionHeadroomVnd(tx, line.id);
    if (input.amountVnd <= 0 || input.amountVnd > max) {
      throw problem('VALIDATION_FAILED', {
        errors: [
          {
            field: `${opts.field ?? 'requestFocForSurcharge'}.amountVnd`,
            code: 'VALUE_OUT_OF_RANGE',
          },
        ],
        extras: { max },
      });
    }
    const [focLineId] = await this.folios.postLines(
      tx,
      folioId,
      [
        {
          reservationId: row.id,
          category: 'foc',
          revenueGroup: 'other',
          description: 'foc',
          quantity: 1,
          unitPriceVnd: -input.amountVnd,
          amountVnd: -input.amountVnd,
          source: 'manual',
          lineState: 'pending_approval',
          relatedLineId: line.id,
        },
      ],
      { userId: ctx.actor.userId, reservationCode: row.code, ...this.req(ctx) },
    );
    const request = await this.approvals.submit(tx, ctx.actor, {
      type: 'foc',
      amountVnd: input.amountVnd,
      reasonCode: input.reasonCode,
      reasonNote: input.note,
      targetType: 'reservation',
      targetId: row.id,
      targetCode: row.code,
      folioLineId: focLineId as string,
      lineCategory: line.category,
      // BR-433 "≤ giá 1 đêm" (BUG-R2-046, folio port of BE-B): last night for late check-out, first for early;
      // the late charge of one night (BR-416-07, BUG-R2-148): the charge itself.
      limitBasisVnd: await this.folios.nightRateBasis(tx, line.id),
      ...(opts.noSelfApply ? { noSelfApply: true } : {}),
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
    // Same links as the folio's requestFoc (BE-B): the pending line carries its request (Folio DTO
    // `approvalRequestId`, S4-18 sync), and a dated key (room / extra person) its date (0060, BR-434 S4-02).
    // Major 15 (ARC): through the folio's own port – it locks the folio first (16.19) and is idempotent.
    await this.folios.linkApprovalRequest(tx, focLineId as string, request.id);
    if ((line.category === 'room' || line.category === 'extra_person') && line.serviceDate) {
      await this.approvals.setFocKeyDate(tx, request.id, line.serviceDate);
    }
    return request;
  }

  /**
   * The stay as the guest lives it (FB-R2-ARC-BE-S3-05, ARC B-1 #5/#6): a primary booking + its in-house
   * children (B9a prior night, OTA extension B13 – BR-422) share one room and one folio. The departure is the
   * latest of them; `last` is the booking holding the last night (its rate is the late-checkout base).
   */
  async effectiveStay(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
  ): Promise<{ departureDate: LocalDate; last: ReservationRow; ids: string[] }> {
    const { rows } = await tx.query<{ id: string; departure_date: string }>(
      `SELECT id, departure_date::text AS departure_date FROM reservation
        WHERE parent_reservation_id = $1 AND status = 'in_house' ORDER BY departure_date, id`,
      [row.id],
    );
    let last = row;
    let departureDate = row.departure_date;
    for (const k of rows) {
      if (k.departure_date > departureDate) {
        departureDate = k.departure_date;
        last = await loadReservation(tx, k.id, ctx.actor);
      }
    }
    return { departureDate, last, ids: [row.id, ...rows.map((k) => k.id)] };
  }

  /**
   * Live surcharge lines (posted, not reversed, not a reversal) of one category on the bookings `ids`, with the
   * APPROVED FOC/discount still reducing each (DOM S3-11) and whether a FOC request is still pending.
   */
  async liveSurchargeLines(
    tx: Tx,
    folioId: string,
    ids: readonly string[],
    category: 'late_checkout' | 'early_checkin',
  ): Promise<{
    lines: Array<{ id: string; amountVnd: number; reservationId: string }>;
    grossVnd: number;
    focVnd: number;
    focReason: string | null;
  }> {
    const all = await this.folios.lines(tx, folioId);
    const reversed = new Set(all.filter((l) => l.reversal_of_id).map((l) => l.reversal_of_id));
    const live = (l: (typeof all)[number]) =>
      l.line_state === 'posted' && !l.reversal_of_id && !reversed.has(l.id);
    const lines = all.filter(
      (l) =>
        l.category === category && !!l.reservation_id && ids.includes(l.reservation_id) && live(l),
    );
    const lineIds = new Set(lines.map((l) => l.id));
    const focs = all.filter(
      (l) =>
        (l.category === 'foc' || l.category === 'discount') &&
        !!l.related_line_id &&
        lineIds.has(l.related_line_id) &&
        live(l),
    );
    const reason = focs.map((l) => l.label_params?.reason).find((r) => typeof r === 'string');
    return {
      lines: lines.map((l) => ({
        id: l.id,
        amountVnd: l.amount_vnd,
        reservationId: l.reservation_id as string,
      })),
      grossVnd: lines.reduce((a, l) => a + l.amount_vnd, 0),
      focVnd: focs.reduce((a, l) => a - l.amount_vnd, 0),
      focReason: typeof reason === 'string' ? reason : null,
    };
  }

  /**
   * One live late-checkout charge per stay (FB-R2-ARC-BE-S3-06, DOM G-10 / S3-11): reverses the live lines
   * (their FOC goes with them – BR-008) and posts the new amount (if > 0). The FOC follows through the folio's
   * FOC key sync (BE-B S4-34, BR-412 v0.3.5 / BR-434): late check-out is ONE key per stay – min(**approved**
   * amount, new charge), 0 → dormant, back > 0 → restored (no second approval); a PENDING request follows the
   * new line and applies min(asked, charge at approval). Returns the new line id (null when the new amount is
   * 0) and the FOC applied on it.
   */
  async replaceLateCharge(
    tx: Tx,
    ctx: BookingContext,
    input: {
      folioId: string;
      ids: readonly string[];
      booking: ReservationRow;
      serviceDate: LocalDate;
      time: LocalTime;
      tierPct: number;
      amountVnd: number;
      reason: string;
      source: 'checkout' | 'manual';
      /** BR-416-06: `late_fee_as_night` – the late charge of one night when that night cannot be sold. */
      chargeCode?: string;
    },
  ): Promise<{ lineId: string | null; carriedFocVnd: number }> {
    const actor = {
      userId: ctx.actor.userId,
      reservationCode: input.booking.code,
      ...this.req(ctx),
    };
    const old = await this.liveSurchargeLines(tx, input.folioId, input.ids, 'late_checkout');
    for (const l of old.lines) {
      await this.folios.reverseLine(tx, l.id, input.reason, actor, { skipReductionSync: true });
    }
    const sync = () =>
      this.folios.syncReductions(tx, input.folioId, {
        userId: ctx.actor.userId,
        cause: 'checkout_time_change',
        ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
      });
    if (input.amountVnd <= 0) {
      await sync();
      return { lineId: null, carriedFocVnd: 0 };
    }
    const [lineId] = await this.folios.postLines(
      tx,
      input.folioId,
      [
        {
          reservationId: input.booking.id,
          category: 'late_checkout',
          description: `late_checkout ${input.time} ${input.tierPct}%`,
          quantity: 1,
          unitPriceVnd: input.amountVnd,
          amountVnd: input.amountVnd,
          serviceDate: input.serviceDate,
          source: input.source,
          labelParams: { time: input.time, pct: input.tierPct },
          ...(input.chargeCode ? { chargeCode: input.chargeCode } : {}),
        },
      ],
      actor,
    );
    await sync();
    const now = await this.liveSurchargeLines(tx, input.folioId, input.ids, 'late_checkout');
    return { lineId: lineId ?? null, carriedFocVnd: now.focVnd };
  }

  /**
   * E03-07 / BR-414 v0.3.4 (DOM S3-12): a time the desk typed vs the server clock, both on the business-day
   * axis. Later by more than `manual_time_tolerance_minutes` → 422 TIME_AFTER_ACTION on `field` (no future
   * times – the surcharge would vanish); earlier by more → the note is required (TIME_NOTE_REQUIRED on
   * `noteField`). Adds to `f` (the caller reports all field errors at once). `noted` = the note applies.
   */
  async checkTypedTime(
    tx: Tx,
    ctx: BookingContext,
    f: Fields,
    input: {
      field: string;
      time: LocalTime;
      noteField: string;
      note: string | undefined;
      rollover: LocalTime;
    },
  ): Promise<{ systemTime: LocalTime; noted: boolean }> {
    const systemTime = this.localTime(ctx);
    const tolerance = await this.param<number>(tx, ctx, 'manual_time_tolerance_minutes');
    const diff =
      businessMinutes(input.time, input.rollover) - businessMinutes(systemTime, input.rollover);
    if (diff > tolerance) f.add(input.field, 'TIME_AFTER_ACTION');
    const noted = -diff > tolerance;
    if (noted && !input.note) f.add(input.noteField, 'TIME_NOTE_REQUIRED');
    return { systemTime, noted };
  }

  req(ctx: BookingContext): { requestId?: string } {
    return ctx.requestId ? { requestId: ctx.requestId } : {};
  }

  today(ctx: BookingContext): LocalDate {
    return ctx.today;
  }

  calendarDate(ctx: BookingContext, at: Date = ctx.now): LocalDate {
    return localDate(at, ctx.tz);
  }
}
