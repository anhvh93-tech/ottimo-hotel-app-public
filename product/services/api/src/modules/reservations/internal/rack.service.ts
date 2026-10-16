/**
 * Read side of the reservations module: room rack (US-016, US-019, US-139), availability (US-082),
 * booking list (US-020, US-087) and booking history (US-006 AC1, US-021 AC2).
 *
 * Rack = 3 queries for any window (rooms, segments, blocks) – budget < 200 ms (architecture 16). Role views
 * (EP02 spec 1.4): FD+ full; HK/MT (`all_masked`) bars without booking identity (the role serializer also
 * removes reservationId/guestDisplayName/channelCode); SAL/CTV (`availability_only`) only merged
 * `unavailable` bars, no unassigned lane.
 */
import { Inject, Injectable } from '@nestjs/common';
import { inSequence } from '../../../shared/sequence';
import type { Tx } from '../../../db/database';
import { RESERVATION_STATUSES, type ReservationStatus } from '../../../db/schema';
import { decodeCursor, page } from '../../../shared/http/pagination';
import { problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { OccupancyService, parseRange } from '../public/occupancy.service';
import { isOrphanGap } from '../public/pricing';
import type { AvailabilityAnswer } from '../public/sales-port';
import { FD_PLUS, hasAny } from './allowed-actions';
import type { BookingContext } from './booking-context';
import {
  RESERVATION_COLUMNS,
  type ReservationRow,
  isOwnScoped,
  ownScopeSql,
} from './reservation-store';
import { toSummaryDto } from './reservation-dto';

const MAX_RACK_DAYS = 31;

type BarKind =
  'in_house' | 'confirmed' | 'long_stay' | 'hold' | 'checked_out' | 'ooo' | 'unavailable';

const LABEL: Record<BarKind, string> = {
  in_house: 'status.booking.in_house',
  confirmed: 'status.booking.confirmed',
  long_stay: 'status.booking.long_term',
  hold: 'status.booking.hold',
  checked_out: 'status.booking.checked_out',
  ooo: 'status.block.ooo',
  unavailable: 'fo.rack.sold_out',
};

interface SegRow {
  room_id: string | null;
  from_date: string;
  to_date: string;
  reservation_id: string;
  code: string;
  hold_expires_at: Date | null;
  capacity_conflict_at: Date | null;
  req_group_id: string | null;
  req_group_code: string | null;
  status: ReservationStatus;
  stay_type: 'short' | 'long';
  external_contract: boolean;
  conflict_state: 'none' | 'open' | 'resolved';
  arrival_date: string;
  adults: number;
  children_6_11: number;
  base_occupancy: number | null;
  channel_code: string;
  guest_name: string | null;
}

interface BlockRow {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

export type RackView = 'full' | 'masked' | 'availability';

export function rackViewOf(roles: readonly string[]): RackView {
  if (hasAny(roles, FD_PLUS)) return 'full';
  if (roles.includes('housekeeping') || roles.includes('maintenance')) return 'masked';
  return 'availability';
}

function barKind(s: SegRow): BarKind {
  if (s.status === 'hold') return 'hold';
  if (s.status === 'checked_out') return 'checked_out';
  if (s.stay_type === 'long') return 'long_stay';
  return s.status === 'in_house' ? 'in_house' : 'confirmed';
}

/** Append to a list in a map (no array copy per row – FB-R2-ARC-BE-S2-11). */
function push<V>(m: Map<string, V[]>, key: string, v: V): void {
  const list = m.get(key);
  if (list) list.push(v);
  else m.set(key, [v]);
}

/** Merge overlapping/adjacent half-open ranges (SAL/CTV see only "sold out"). */
export function mergeRanges(ranges: Array<{ from: LocalDate; to: LocalDate }>) {
  const sorted = [...ranges].sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
  const out: Array<{ from: LocalDate; to: LocalDate }> = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.from <= last.to) {
      if (r.to > last.to) last.to = r.to;
    } else out.push({ ...r });
  }
  return out;
}

@Injectable()
export class RackService {
  constructor(@Inject(OccupancyService) private readonly occupancy: OccupancyService) {}

  async rack(
    tx: Tx,
    ctx: BookingContext,
    q: { from?: string | undefined; days?: string | undefined },
  ): Promise<Record<string, unknown>> {
    const from = q.from ?? addDays(ctx.today, -2);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || Number.isNaN(Date.parse(`${from}T00:00:00Z`))) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'from', code: 'DATE_INVALID' }] });
    }
    const days = q.days === undefined ? 14 : Number(q.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_RACK_DAYS) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'days', code: 'VALUE_OUT_OF_RANGE' }],
      });
    }
    const to = addDays(from, days);
    const view = rackViewOf(ctx.actor.roles);

    const [rooms, segs, blocks] = await inSequence([
      () =>
        tx.query<{ id: string; room_no: string; group_code: string; is_sellable: boolean }>(
          `SELECT rm.id, rm.room_no, rg.code AS group_code, rm.is_sellable
           FROM room rm JOIN room_group rg ON rg.id = rm.room_group_id
          WHERE rm.active_from < $2 AND (rm.active_to IS NULL OR rm.active_to >= $1)
          ORDER BY rg.sort_order, rm.room_no`,
          [from, to],
        ),
      () =>
        tx.query<SegRow>(
          `SELECT s.room_id, s.from_date::text AS from_date, s.to_date::text AS to_date, r.id AS reservation_id, r.code, r.hold_expires_at, r.capacity_conflict_at,
                rq.group_id AS req_group_id, rq.group_code AS req_group_code,
                r.status, r.stay_type, r.external_contract, r.conflict_state, r.arrival_date::text AS arrival_date,
                r.adults, r.children_6_11, rm.base_occupancy, c.code AS channel_code, g.full_name AS guest_name
           FROM reservation_segment s
           JOIN reservation r ON r.id = s.reservation_id
           JOIN channel c ON c.id = r.channel_id
           LEFT JOIN room rm ON rm.id = s.room_id
           LEFT JOIN guest g ON g.id = r.booker_guest_id
           LEFT JOIN LATERAL (
             SELECT rg.id AS group_id, rg.code AS group_code
               FROM overbooking_incident i
               JOIN room rr ON rr.id = i.requested_room_id
               JOIN room_group rg ON rg.id = rr.room_group_id
              WHERE i.reservation_id = r.id AND s.room_id IS NULL
              ORDER BY i.detected_at DESC LIMIT 1) rq ON true
          WHERE s.active AND s.from_date < $2 AND s.to_date > $1
            AND r.status IN ('hold', 'confirmed', 'in_house', 'checked_out')
          ORDER BY s.from_date`,
          [from, to],
        ),
      () =>
        tx.query<BlockRow>(
          `SELECT id, room_id, start_date::text AS start_date,
                COALESCE(end_date_actual, end_date_planned)::text AS end_date, status, reason
           FROM room_block
          WHERE status IN ('planned', 'active', 'released') AND start_date < $2
            AND COALESCE(end_date_actual, end_date_planned) > $1
            AND COALESCE(end_date_actual, end_date_planned) > start_date`,
          [from, to],
        ),
    ]);

    const byRoom = new Map<string, Array<Record<string, unknown>>>();
    const busy = new Map<string, Array<{ from: LocalDate; to: LocalDate }>>();
    const inHouseToday = new Set<string>();
    const unassigned: Array<Record<string, unknown>> = [];
    for (const s of segs.rows) {
      const kind = barKind(s);
      const extra = Math.max(
        0,
        s.adults + s.children_6_11 - (s.base_occupancy ?? s.adults + s.children_6_11),
      );
      const bar: Record<string, unknown> = {
        kind,
        from: s.from_date,
        to: s.to_date,
        label: LABEL[kind],
        conflictState: s.conflict_state,
        arrivingToday:
          s.arrival_date === ctx.today && (s.status === 'confirmed' || s.status === 'hold'),
        extraGuestCount: extra,
        externalContract: s.external_contract,
      };
      if (view === 'full') {
        bar.reservationId = s.reservation_id;
        bar.reservationCode = s.code; // 0.3.5 A-01
        if (s.capacity_conflict_at) bar.capacityConflict = true; // 0.3.5 A-24
        if (s.req_group_id) {
          // 0.3.5 A-25: group the OTA guest booked, for the unassigned lane.
          bar.requestedRoomGroupId = s.req_group_id;
          bar.requestedRoomGroupCode = s.req_group_code;
        }
        if (s.status === 'hold' && s.hold_expires_at)
          bar.holdExpiresAt = ctx.iso(s.hold_expires_at);
        if (s.guest_name) bar.guestDisplayName = s.guest_name;
        bar.channelCode = s.channel_code;
      }
      if (s.room_id === null) {
        if (view === 'full') unassigned.push(bar);
        continue;
      }
      if (s.status === 'in_house' && s.from_date <= ctx.today && s.to_date > ctx.today)
        inHouseToday.add(s.room_id);
      if (s.status !== 'checked_out') {
        push(busy, s.room_id, { from: s.from_date, to: s.to_date });
      }
      push(byRoom, s.room_id, bar);
    }
    const oooToday = new Set<string>();
    for (const b of blocks.rows) {
      if (b.status === 'active' && b.start_date <= ctx.today && b.end_date > ctx.today)
        oooToday.add(b.room_id);
      push(busy, b.room_id, { from: b.start_date, to: b.end_date });
      const bar: Record<string, unknown> = {
        kind: 'ooo',
        from: b.start_date,
        to: b.end_date,
        label: LABEL.ooo,
        roomBlockId: b.id,
      };
      push(byRoom, b.room_id, bar);
    }

    // BUG-R2-040: the STORED room status (SM-03 `room_status`, written by B9/B13/B14/B17/B18 – same
    // aggregate, ARC B-3) wins over the derived one, exactly like RoomStatusService.current().
    const stored = new Map(
      (
        await tx.query<{ room_id: string; status: string }>(
          'SELECT room_id, status FROM room_status WHERE room_id = ANY($1::uuid[])',
          [rooms.rows.map((r) => r.id)],
        )
      ).rows.map((x) => [x.room_id, x.status]),
    );
    return {
      from,
      days,
      today: ctx.today,
      rooms: rooms.rows.map((r) => ({
        roomId: r.id,
        roomNo: r.room_no,
        roomGroupCode: r.group_code,
        isSellable: r.is_sellable,
        // Room status (SM-03; housekeeping owns it from Sprint 4): OOO block today, else the stored status,
        // else derived from today's facts.
        roomStatus: oooToday.has(r.id)
          ? 'OOO'
          : (stored.get(r.id) ?? (inHouseToday.has(r.id) ? 'OC' : 'VC')),
        bars:
          view === 'availability'
            ? mergeRanges(busy.get(r.id) ?? []).map((x) => ({
                kind: 'unavailable',
                from: x.from,
                to: x.to,
                label: LABEL.unavailable,
              }))
            : (byRoom.get(r.id) ?? []).sort((a, b) => String(a.from).localeCompare(String(b.from))),
      })),
      ...(view === 'full' ? { unassigned } : {}),
    };
  }

  /** searchAvailability + sales port (US-082 AC1/AC2, US-017, US-019). */
  async availability(
    tx: Tx,
    today: LocalDate,
    q: {
      roomId?: string | undefined;
      roomGroupId?: string | undefined;
      fromDate: LocalDate;
      toDate: LocalDate;
      persons: number;
      /** 0.3.5 A-05: the booking being (re)assigned – its own nights are not busy; its room group is the
       * reference for `upgrade`. */
      reservationId?: string | undefined;
    },
  ): Promise<AvailabilityAnswer & { requestedRoom?: Record<string, unknown> }> {
    let exclude: string[] = [];
    let refGroupId = q.roomGroupId;
    if (q.reservationId) {
      const r = await tx.query<{ seg: string; group_id: string | null }>(
        `SELECT s.id AS seg, COALESCE(rm.room_group_id, rr.room_group_id) AS group_id
           FROM reservation_segment s
           LEFT JOIN room rm ON rm.id = s.room_id
           LEFT JOIN overbooking_incident i ON i.reservation_id = s.reservation_id
           LEFT JOIN room rr ON rr.id = i.requested_room_id
          WHERE s.reservation_id = $1 AND s.active`,
        [q.reservationId],
      );
      exclude = r.rows.map((x) => x.seg);
      refGroupId ??= r.rows.find((x) => x.group_id)?.group_id ?? undefined;
    }
    if (q.fromDate < today) {
      return {
        available: false,
        reason: 'past_date',
        alternatives: [],
        ...(q.roomId
          ? { requestedRoom: { roomId: q.roomId, available: false, reason: 'past_date' } }
          : {}),
      };
    }
    let requested: Record<string, unknown> | undefined;
    let available = true;
    let reason: AvailabilityAnswer['reason'];
    let orphanGap = false;
    if (q.roomId) {
      const { rows } = await tx.query<{
        room_no: string;
        is_sellable: boolean;
        max_occupancy: number;
        active_from: string;
        active_to: string | null;
      }>(
        `SELECT room_no, is_sellable, max_occupancy, active_from::text AS active_from, active_to::text AS active_to
           FROM room WHERE id = $1`,
        [q.roomId],
      );
      const rm = rows[0];
      if (!rm)
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
      const conflicts = await this.occupancy.conflicts(tx, q.roomId, q.fromDate, q.toDate, exclude);
      const activeRange =
        rm.active_from <= q.fromDate && (rm.active_to === null || rm.active_to >= q.toDate);
      if (!rm.is_sellable || !activeRange) reason = 'not_sellable';
      else if (q.persons > rm.max_occupancy) reason = 'capacity';
      else if (conflicts.some((c) => c.kind === 'ooo')) reason = 'blocked';
      else if (conflicts.length > 0) reason = 'booked';
      available = reason === undefined;
      const near = await tx.query<{ range: string }>(
        `SELECT stay_range::text AS range FROM room_occupancy
          WHERE room_id = $1 AND active AND (upper(stay_range) = $2::date OR lower(stay_range) = $3::date)`,
        [q.roomId, q.fromDate, q.toDate],
      );
      orphanGap =
        available &&
        isOrphanGap(
          q.fromDate,
          q.toDate,
          near.rows.map((n) => parseRange(n.range)),
        );
      requested = {
        roomId: q.roomId,
        roomNo: rm.room_no,
        available,
        orphanNight: orphanGap,
        ...(reason ? { reason } : {}),
      };
    }
    const alternatives = await this.occupancy.suggest(tx, {
      roomId: q.roomId ?? null,
      roomGroupId: refGroupId ?? null,
      from: q.fromDate,
      to: q.toDate,
      persons: q.persons,
      excludeSegmentIds: exclude,
      withOrphanFlag: true,
    });
    if (!q.roomId) available = alternatives.length > 0;
    return {
      available,
      ...(reason ? { reason } : {}),
      alternatives,
      orphanGap,
      ...(requested ? { requestedRoom: requested } : {}),
    };
  }

  /** listReservations (US-020; SAL/CTV own – US-087 – in SQL). Cursor on (arrival_date, id). */
  async list(
    tx: Tx,
    ctx: BookingContext,
    q: {
      status?: string | undefined;
      stayFrom?: string | undefined;
      stayTo?: string | undefined;
      q?: string | undefined;
      externalContract?: string | undefined;
      cursor?: string | undefined;
      limit: number;
    },
  ) {
    const params: unknown[] = [];
    const ph = (v: unknown) => {
      params.push(v);
      return `$${params.length}`;
    };
    const where: string[] = [];
    if (isOwnScoped(ctx.actor)) where.push(ownScopeSql(ctx.actor, ph(ctx.actor.userId)) as string);
    if (q.status) {
      const list = q.status.split(',').filter(Boolean);
      if (list.some((s) => !(RESERVATION_STATUSES as readonly string[]).includes(s))) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'status', code: 'NOT_IN_LIST' }] });
      }
      where.push(`r.status = ANY(${ph(list)}::text[])`);
    }
    for (const [field, v] of [
      ['stayFrom', q.stayFrom],
      ['stayTo', q.stayTo],
    ] as const) {
      if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'DATE_INVALID' }] });
      }
    }
    if (q.stayFrom) where.push(`r.departure_date > ${ph(q.stayFrom)}::date`);
    if (q.stayTo) where.push(`r.arrival_date <= ${ph(q.stayTo)}::date`);
    if (q.externalContract !== undefined) {
      if (q.externalContract !== 'true' && q.externalContract !== 'false') {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'externalContract', code: 'VALIDATION_FAILED' }],
        });
      }
      where.push(`r.external_contract = ${ph(q.externalContract === 'true')}`);
    }
    if (q.q) {
      if (q.q.length > 40)
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'q', code: 'TOO_LONG' }] });
      const like = ph(`%${q.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
      where.push(`(r.code ILIKE ${like} OR r.ota_ref ILIKE ${like} OR g.code ILIKE ${like})`);
    }
    const c = decodeCursor(q.cursor, 2);
    if (c)
      where.push(`(r.arrival_date, r.id) > (${ph(String(c[0]))}::date, ${ph(String(c[1]))}::uuid)`);
    const { rows } = await tx.query<
      ReservationRow & { room_no: string | null; guest_name: string | null }
    >(
      `SELECT ${RESERVATION_COLUMNS},
              (SELECT rm.room_no FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
                WHERE s.reservation_id = r.id AND s.active ORDER BY s.from_date DESC LIMIT 1) AS room_no,
              g.full_name AS guest_name
         FROM reservation r
         JOIN channel c ON c.id = r.channel_id
         JOIN guest g ON g.id = r.booker_guest_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY r.arrival_date, r.id
        LIMIT ${ph(q.limit + 1)}`,
      params,
    );
    const paged = page(rows, q.limit, (r) => [r.arrival_date, r.id]);
    return { data: paged.data.map((r) => toSummaryDto(r, ctx.iso)), page: paged.page };
  }

  /** getReservationHistory: audit events of the booking + status/field history, newest first. */
  async history(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
  ): Promise<Array<Record<string, unknown>>> {
    const [audit, changes, transitions] = await inSequence([
      () =>
        tx.query<{
          occurred_at: Date;
          actor_type: 'user' | 'guest' | 'system';
          actor_name: string | null;
          category: string;
          action: string;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          reason: string | null;
        }>(
          `SELECT e.occurred_at, e.actor_type, u.display_name AS actor_name, e.category, e.action, e.before, e.after,
                e.reason
           FROM audit_event e LEFT JOIN app_user u ON u.id = e.actor_user_id
          WHERE e.property_id = $1 AND ((e.entity_type = 'reservation' AND e.entity_id = $2) OR e.entity_code = $3)`,
          [row.property_id, row.id, row.code],
        ),
      () =>
        tx.query<{
          changed_at: Date;
          actor_name: string | null;
          changed_by: string | null;
          field: string;
          old_value: string | null;
          new_value: string | null;
          reason: string | null;
        }>(
          `SELECT ch.changed_at, u.display_name AS actor_name, ch.changed_by, ch.field, ch.old_value, ch.new_value,
                ch.reason
           FROM reservation_change ch LEFT JOIN app_user u ON u.id = ch.changed_by
          WHERE ch.reservation_id = $1 AND ch.field <> 'status'`,
          [row.id],
        ),
      () =>
        tx.query<{
          occurred_at: Date;
          actor_type: 'user' | 'guest' | 'system';
          actor_name: string | null;
          from_state: string | null;
          to_state: string;
          event_code: string;
          reason_code: string | null;
          reason_note: string | null;
        }>(
          `SELECT t.occurred_at, t.actor_type, u.display_name AS actor_name, t.from_state, t.to_state, t.event_code,
                t.reason_code, t.reason_note
           FROM state_transition t LEFT JOIN app_user u ON u.id = t.actor_user_id
          WHERE t.machine = 'SM-01' AND t.entity_id = $1 AND NOT t.rejected`,
          [row.id],
        ),
    ]);
    const items: Array<{ at: Date; dto: Record<string, unknown> }> = [];
    const base = { entityType: 'reservation', entityId: row.id, entityCode: row.code };
    for (const a of audit.rows) {
      items.push({
        at: a.occurred_at,
        dto: {
          occurredAt: ctx.iso(a.occurred_at),
          actorType: a.actor_type,
          ...(a.actor_name ? { actorName: a.actor_name } : {}),
          category: a.category,
          action: a.action,
          ...base,
          ...(a.before ? { before: a.before } : {}),
          ...(a.after ? { after: a.after } : {}),
          ...(a.reason ? { reason: a.reason } : {}),
        },
      });
    }
    for (const t of transitions.rows) {
      items.push({
        at: t.occurred_at,
        dto: {
          occurredAt: ctx.iso(t.occurred_at),
          actorType: t.actor_type,
          ...(t.actor_name ? { actorName: t.actor_name } : {}),
          category: 'state',
          action: `reservation.transition.${t.event_code}`,
          ...base,
          ...(t.from_state ? { before: { status: t.from_state } } : {}),
          after: { status: t.to_state, ...(t.reason_code ? { reasonCode: t.reason_code } : {}) },
          ...(t.reason_note ? { reason: t.reason_note } : {}),
        },
      });
    }
    for (const ch of changes.rows) {
      items.push({
        at: ch.changed_at,
        dto: {
          occurredAt: ctx.iso(ch.changed_at),
          actorType: ch.changed_by ? 'user' : 'system',
          ...(ch.actor_name ? { actorName: ch.actor_name } : {}),
          category: 'data',
          action: 'reservation.field_changed',
          ...base,
          before: { [ch.field]: ch.old_value },
          after: { [ch.field]: ch.new_value },
          ...(ch.reason ? { reason: ch.reason } : {}),
        },
      });
    }
    items.sort((a, b) => b.at.getTime() - a.at.getTime());
    return items.map((i) => i.dto);
  }
}
