/**
 * "Cần chú ý" items computed from booking/inventory/housekeeping state (erd BE-ARC-06 – not stored):
 * capacity_conflict (A-20), overbooking (BR-312), no_show_call / no_show_mark (BR-311), hold_expiring
 * (BR-303 `hold_expiry_reminder_hours`), extra_guest_kit_overdue (BR-812), room_ooo (SM-02).
 * Codes, counts, booking ids and room numbers only (SEC J). `count` is the full count (`count(*) OVER ()` –
 * ARC-BE-S3-23.4); the id/room lists are capped at LIST_CAP. Child bookings (B9a / OTA extension) are never
 * arrivals of their own (ARC B-1 #5 b).
 */
import type { Tx } from '../../../db/database';
import { atLocal, type LocalTime } from '../../../shared/time';
import type {
  AttentionItem,
  AttentionSource,
  AttentionSourceContext,
} from '../../events/public/events.service';
import { businessMinutes } from '../public/stay-rules';

/** Technical cap of the ids/room numbers listed in one item (the UI shows a summary). */
const LIST_CAP = 100;

async function capacityConflicts(tx: Tx): Promise<AttentionItem[]> {
  const { rows } = await tx.query<{ id: string; total: number }>(
    `SELECT id, count(*) OVER ()::int AS total FROM reservation
      WHERE capacity_conflict_at IS NOT NULL AND status IN ('confirmed', 'in_house')
      ORDER BY arrival_date LIMIT $1`,
    [LIST_CAP],
  );
  if (rows.length === 0) return [];
  return [
    {
      kind: 'capacity_conflict',
      source: 'computed',
      severity: 'warning',
      count: rows[0]?.total ?? rows.length,
      reservationIds: rows.map((r) => r.id),
      params: { count: rows[0]?.total ?? rows.length },
    },
  ];
}

async function overbooking(tx: Tx): Promise<AttentionItem[]> {
  const { rows } = await tx.query<{ reservation_id: string; total: number }>(
    `SELECT reservation_id, count(*) OVER ()::int AS total FROM overbooking_incident
      WHERE status = 'open' ORDER BY detected_at LIMIT $1`,
    [LIST_CAP],
  );
  if (rows.length === 0) return [];
  return [
    {
      kind: 'overbooking',
      source: 'computed',
      severity: 'critical',
      count: rows[0]?.total ?? rows.length,
      reservationIds: rows.map((r) => r.reservation_id),
      link: '/overbooking',
      params: { count: rows[0]?.total ?? rows.length },
    },
  ];
}

/**
 * US-136 AC1 / BR-311 (J6, J7 – computed, BE-D Sprint 4): confirmed primary bookings arriving on the business
 * date and not in yet, from the call time on. A booking whose guest gave an ETA still ahead ("đã báo đến trễ –
 * giữ phòng cả đêm") is left out until that ETA has passed – both for the call line and the mark line; times
 * compared on the business-day axis (an ETA of 00:30 is after 23:00). Never marks anything itself.
 */
async function noShows(tx: Tx, ctx: AttentionSourceContext): Promise<AttentionItem[]> {
  const call = await ctx.param<LocalTime>('no_show_call_time');
  const mark = await ctx.param<LocalTime>('no_show_mark_time');
  const rollover = (await ctx.param<LocalTime>('business_day_rollover')) ?? '06:00';
  if (!call || !mark) return [];
  const callAt = atLocal(ctx.today, call, ctx.tz);
  if (ctx.now.getTime() < callAt.getTime()) return [];
  const markAt = atLocal(ctx.today, mark, ctx.tz);
  const nowMinutes = businessMinutes(ctx.iso(ctx.now).slice(11, 16), rollover);
  const { rows } = await tx.query<{ id: string; eta_time: string | null }>(
    `SELECT id, to_char(eta_time, 'HH24:MI') AS eta_time FROM reservation
      WHERE status = 'confirmed' AND arrival_date = $1 AND parent_reservation_id IS NULL
      ORDER BY id`,
    [ctx.today],
  );
  const due = rows.filter(
    (r) => r.eta_time === null || businessMinutes(r.eta_time, rollover) <= nowMinutes,
  );
  if (due.length === 0) return [];
  const marking = ctx.now.getTime() >= markAt.getTime();
  return [
    {
      kind: marking ? 'no_show_mark' : 'no_show_call',
      source: 'computed',
      severity: marking ? 'critical' : 'warning',
      count: due.length,
      dueAt: ctx.iso(markAt),
      reservationIds: due.slice(0, LIST_CAP).map((r) => r.id),
      params: { count: due.length, time: marking ? mark : call },
    },
  ];
}

async function holdsExpiring(tx: Tx, ctx: AttentionSourceContext): Promise<AttentionItem[]> {
  const hours = await ctx.param<number>('hold_expiry_reminder_hours');
  if (hours === undefined) return [];
  const until = new Date(ctx.now.getTime() + hours * 3_600_000);
  const { rows } = await tx.query<{ id: string; hold_expires_at: Date; total: number }>(
    `SELECT id, hold_expires_at, count(*) OVER ()::int AS total FROM reservation
      WHERE status = 'hold' AND hold_expires_at > $1 AND hold_expires_at <= $2
      ORDER BY hold_expires_at LIMIT $3`,
    [ctx.now, until, LIST_CAP],
  );
  const first = rows[0];
  if (!first) return [];
  return [
    {
      kind: 'hold_expiring',
      source: 'computed',
      severity: 'warning',
      count: rows[0]?.total ?? rows.length,
      dueAt: ctx.iso(first.hold_expires_at),
      reservationIds: rows.map((r) => r.id),
      params: { count: rows[0]?.total ?? rows.length },
    },
  ];
}

async function kitsOverdue(tx: Tx, ctx: AttentionSourceContext): Promise<AttentionItem[]> {
  const { rows } = await tx.query<{ reservation_id: string; room_no: string; total: number }>(
    `SELECT t.reservation_id, rm.room_no, count(*) OVER ()::int AS total
       FROM hk_task t JOIN room rm ON rm.id = t.room_id
      WHERE t.type IN ('extra_guest_kit_prepare', 'extra_guest_kit_transfer')
        AND t.status IN ('open', 'in_progress') AND t.due_at < $1
      ORDER BY t.due_at LIMIT $2`,
    [ctx.now, LIST_CAP],
  );
  if (rows.length === 0) return [];
  return [
    {
      kind: 'extra_guest_kit_overdue',
      source: 'computed',
      severity: 'warning',
      count: rows[0]?.total ?? rows.length,
      reservationIds: [...new Set(rows.map((r) => r.reservation_id))],
      roomNos: [...new Set(rows.map((r) => r.room_no))],
      params: { count: rows[0]?.total ?? rows.length },
    },
  ];
}

async function roomsOoo(tx: Tx, ctx: AttentionSourceContext): Promise<AttentionItem[]> {
  const { rows } = await tx.query<{ room_no: string }>(
    `SELECT rm.room_no FROM room_block b JOIN room rm ON rm.id = b.room_id
      WHERE b.status = 'active' AND b.start_date <= $1
        AND COALESCE(b.end_date_actual, b.end_date_planned) > $1
      ORDER BY rm.room_no`,
    [ctx.today],
  );
  if (rows.length === 0) return [];
  return [
    {
      kind: 'room_ooo',
      source: 'computed',
      severity: 'info',
      count: rows.length,
      roomNos: rows.map((r) => r.room_no),
      params: { count: rows.length },
    },
  ];
}

export const FRONTDESK_ATTENTION_SOURCES: AttentionSource[] = [
  (tx) => capacityConflicts(tx),
  (tx) => overbooking(tx),
  noShows,
  holdsExpiring,
  kitsOverdue,
  roomsOoo,
];
