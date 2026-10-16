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
import { calendarRate, rateBounds } from '../../reservations/public/pricing';
import { PricingService } from '../../reservations/public/pricing.service';
import {
  type Actor,
  type BookingContext,
  type ReservationRow,
  type SegmentRow,
  ReservationStayPort,
  activeSegments,
} from '../../reservations/public/stay-port';
import type {
  FrontdeskChildDataPort,
  FrontdeskGuestAccessPort,
  FrontdeskMinibarPort,
  FrontdeskRegistrationPort,
} from '../public/ports';
import { RoomStatusService } from '../public/room-status.service';
import { nightlyEquivalent } from '../public/stay-rules';

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

  /** Another confirmed booking arriving in `roomId` on `date` (BR-412 grace, BR-416, US-031 order). */
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
        WHERE s.room_id = $1 AND s.active AND s.from_date = $2 AND r.id <> $3 AND r.status = 'confirmed'
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

  /** Direct-channel calendar rate of `roomId` on `date` (BR-104) with its BR-105 bounds. */
  async directRate(
    tx: Tx,
    ctx: BookingContext,
    roomId: string,
    date: LocalDate,
  ): Promise<{ rateVnd: number; floorVnd: number; ceilingVnd: number; special: boolean }> {
    const list = PricingService.listPriceOn(
      {
        roomId,
        baseOccupancy: 0,
        listPrices: await this.listPrices(tx, roomId),
      },
      date,
    );
    if (list === null) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }],
        detail: 'room has no list price for the night',
      });
    }
    const p = ctx.params;
    const c = calendarRate(list, date, 'direct', p.calendar, p.nightRateUnit);
    const { rows } = await tx.query<{ code: string }>(
      'SELECT rg.code FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id WHERE rm.id = $1',
      [roomId],
    );
    const groupBase = rows[0] ? p.otaBaseRates[rows[0].code] : undefined;
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
    line: { id: string; amountVnd: number; category: string },
    input: FocRequestInput,
  ): Promise<ApprovalRow> {
    if (input.amountVnd <= 0 || input.amountVnd > line.amountVnd) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'requestFocForSurcharge.amountVnd', code: 'VALUE_OUT_OF_RANGE' }],
        extras: { max: line.amountVnd },
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
    return this.approvals.submit(tx, ctx.actor, {
      type: 'foc',
      amountVnd: input.amountVnd,
      reasonCode: input.reasonCode,
      reasonNote: input.note,
      targetType: 'reservation',
      targetId: row.id,
      targetCode: row.code,
      folioLineId: focLineId as string,
      lineCategory: line.category,
      ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    });
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
