/**
 * Persistence helpers of the reservations module: row shapes, loading with lock + scope, segments, nights,
 * history (state_transition + reservation_change + audit_event in the same transaction – erd 4.5
 * "Mọi chuyển SM-01 ghi cả state_transition và reservation_change(field='status')") and channel outbox.
 * Dates are always selected as text (`::text`) – a pg `date` must never become a JS Date in server time.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { ChannelGroup, ReservationStatus } from '../../../db/schema';
import { problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { addDays } from '../../../shared/time';
import type { PricedNight } from '../public/pricing.service';
import { nightDates } from '../public/pricing';

export interface ReservationRow {
  id: string;
  organization_id: string;
  property_id: string;
  code: string;
  status: ReservationStatus;
  stay_type: 'short' | 'long';
  channel_id: string;
  channel_code: string;
  channel_group: ChannelGroup;
  payment_model: 'direct' | 'ota_prepaid' | 'ota_pay_at_property';
  ota_ref: string | null;
  ota_booked_at: Date | null;
  direct_source: string | null;
  /** US-155 (0086): sub-source of a `website` booking (BR-911). */
  direct_sub_source?: string | null;
  booker_guest_id: string;
  closer_user_id: string | null;
  parent_reservation_id: string | null;
  quote_id: string | null;
  group_id: string | null;
  folio_id: string | null;
  arrival_date: LocalDate;
  departure_date: LocalDate;
  adults: number;
  children_6_11: number;
  children_under_6: number;
  eta_time: string | null;
  is_complimentary: boolean;
  conflict_state: 'none' | 'open' | 'resolved';
  capacity_conflict_at: Date | null;
  capacity_ack_reason: string | null;
  hold_created_at: Date | null;
  hold_hours: number | null;
  hold_expires_at: Date | null;
  hold_extended_count: number;
  deposit_required_vnd: number;
  total_room_vnd: number;
  pricing_snapshot: Record<string, unknown>;
  cancelled_at: Date | null;
  cancel_reason_code: string | null;
  cancel_note: string | null;
  status_before_cancel: string | null;
  confirmed_at: Date | null;
  no_show_marked_at: Date | null;
  reschedule_count: number;
  actual_checkin_at: Date | null;
  actual_checkout_at: Date | null;
  agreed_checkout_time: string | null;
  internal_note: string | null;
  external_contract: boolean;
  manual_long_stay: Record<string, unknown> | null;
  // 0030 (Sprint 3 front desk)
  cards_issued: number | null;
  house_rules_sent_at: Date | null;
  door_access_handed_over_at: Date | null;
  checkout_mode: string | null;
  checkin_room_status_before: string | null;
  early_departure_notice_at: Date | null;
  party_version: number;
  // 0040 (BE-B – deposit shortfall accepted by MGR+; Reservation.depositShortfall, 0.3.6 bổ sung)
  deposit_shortfall_vnd: number | null;
  deposit_shortfall_accepted_at: Date | null;
  deposit_shortfall_accepted_by_name: string | null;
  deposit_shortfall_reason: string | null;
  // 0055 (BR-012 (4), BR-429): the guest was told the concrete room – `inventory_optimize` only while false.
  room_disclosed_to_guest: boolean;
  // 0059 (BR-424, BR-429 (c) – S4-05): origin room of the OTA difference; NULL = never moved (first room).
  origin_room_id: string | null;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  version: number;
}

export const RESERVATION_COLUMNS = `r.id, r.organization_id, r.property_id, r.code, r.status, r.stay_type, r.channel_id,
  c.code AS channel_code, c.channel_group, r.payment_model, r.ota_ref, r.ota_booked_at, r.direct_source,
  r.direct_sub_source, r.booker_guest_id, r.closer_user_id, r.parent_reservation_id, r.quote_id, r.group_id, r.folio_id,
  r.arrival_date::text AS arrival_date, r.departure_date::text AS departure_date, r.adults, r.children_6_11,
  r.children_under_6, to_char(r.eta_time, 'HH24:MI') AS eta_time, r.is_complimentary, r.conflict_state, r.capacity_conflict_at, r.capacity_ack_reason,
  r.hold_created_at, r.hold_hours, r.hold_expires_at, r.hold_extended_count, r.deposit_required_vnd,
  r.total_room_vnd, r.pricing_snapshot, r.cancelled_at, r.cancel_reason_code, r.cancel_note,
  r.status_before_cancel, r.confirmed_at, r.no_show_marked_at, r.reschedule_count, r.actual_checkin_at,
  r.actual_checkout_at, to_char(r.agreed_checkout_time, 'HH24:MI') AS agreed_checkout_time, r.internal_note,
  r.external_contract, r.manual_long_stay, r.cards_issued, r.house_rules_sent_at, r.door_access_handed_over_at,
  r.checkout_mode,
  r.checkin_room_status_before, r.early_departure_notice_at, r.party_version, r.created_at, r.created_by,
  r.updated_at, r.version, r.deposit_shortfall_vnd, r.deposit_shortfall_accepted_at, r.deposit_shortfall_reason,
  r.room_disclosed_to_guest, r.origin_room_id,
  (SELECT su.display_name FROM app_user su WHERE su.id = r.deposit_shortfall_accepted_by)
    AS deposit_shortfall_accepted_by_name`;

export interface Actor {
  userId: string;
  roles: readonly string[];
}

/** FD+ see every booking; SAL/CTV only their own (x-scope `own`, US-087). */
export function isOwnScoped(actor: Actor): boolean {
  return !actor.roles.some((r) =>
    ['owner', 'manager', 'front_desk_lead', 'front_desk'].includes(r),
  );
}

/** SAL/CTV scope `own` (x-scope, US-087): created by or closed by the caller – in SQL. */
export function ownScopeSql(actor: Actor, param: string): string | null {
  if (!isOwnScoped(actor)) return null;
  return `(r.created_by = ${param} OR r.closer_user_id = ${param})`;
}

export function isOwn(actor: Actor, row: Pick<ReservationRow, 'created_by' | 'closer_user_id'>) {
  return row.created_by === actor.userId || row.closer_user_id === actor.userId;
}

/**
 * Load one booking (optionally locked). Out of scope / other property → 404 (never 403). The lock is FOR NO KEY
 * UPDATE (ARC 16.16 bổ sung 2): no write here changes the booking's key, and a stronger lock would block the
 * KEY SHARE that every folio line / payment row referencing the booking takes – a folio command that holds the
 * folio first then deadlocked with B7/B13/B14/B18 (40P01).
 */
export async function loadReservation(
  tx: Tx,
  id: string,
  actor: Actor,
  opts: { forUpdate?: boolean } = {},
): Promise<ReservationRow> {
  const scope = ownScopeSql(actor, '$2');
  const { rows } = await tx.query<ReservationRow>(
    `SELECT ${RESERVATION_COLUMNS}
       FROM reservation r JOIN channel c ON c.id = r.channel_id
      WHERE r.id = $1 ${scope ? `AND ${scope}` : 'AND $2::uuid IS NOT NULL'}
      ${opts.forUpdate ? 'FOR NO KEY UPDATE OF r' : ''}`,
    [id, actor.userId],
  );
  const row = rows[0];
  if (!row) throw problem('NOT_FOUND');
  return row;
}

export interface SegmentRow {
  id: string;
  room_id: string | null;
  room_no: string | null;
  room_group_id: string | null;
  base_occupancy: number | null;
  from_date: LocalDate;
  to_date: LocalDate;
}

export async function activeSegments(tx: Tx, reservationId: string): Promise<SegmentRow[]> {
  const { rows } = await tx.query<SegmentRow>(
    `SELECT s.id, s.room_id, rm.room_no, rm.room_group_id, rm.base_occupancy,
            s.from_date::text AS from_date, s.to_date::text AS to_date
       FROM reservation_segment s LEFT JOIN room rm ON rm.id = s.room_id
      WHERE s.reservation_id = $1 AND s.active ORDER BY s.from_date`,
    [reservationId],
  );
  return rows;
}

/** The single active segment of a booking that has not checked in (B7, B7a, B11, B12, swap). */
export async function singleSegment(tx: Tx, reservationId: string): Promise<SegmentRow> {
  const segs = await activeSegments(tx, reservationId);
  const seg = segs[0];
  if (segs.length !== 1 || !seg)
    throw new Error(`booking ${reservationId} has ${segs.length} segments`);
  return seg;
}

export async function insertSegment(
  tx: Tx,
  reservationId: string,
  roomId: string | null,
  from: LocalDate,
  to: LocalDate,
  now: Date,
): Promise<string> {
  const id = uuidv7();
  await tx.query(
    `INSERT INTO reservation_segment (id, organization_id, property_id, reservation_id, room_id, from_date,
       to_date, active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $8)`,
    [id, tx.ctx.organizationId, tx.ctx.propertyId, reservationId, roomId, from, to, now],
  );
  return id;
}

export interface NightWrite {
  reservationId: string;
  segmentId: string;
  roomId: string | null;
  channelId: string;
  stayType: 'short' | 'long';
  state: 'hold' | 'sold';
  isComplimentary: boolean;
  now: Date;
}

/**
 * stay_night rows for priced nights (erd 8): `hold` for B1, `sold` (+ sold_at) for B2/B4/B12. A system price path:
 * the night's price is its reference rate too (BR-433 (d) v0.4.1 – `reference_rate_vnd`).
 */
export async function insertNights(tx: Tx, w: NightWrite, nights: readonly PricedNight[]) {
  for (const n of nights) {
    await tx.query(
      `INSERT INTO stay_night (id, organization_id, property_id, reservation_id, reservation_segment_id, room_id,
         stay_date, night_state, room_revenue_gross_vnd, discount_vnd, room_revenue_vnd, sold_at,
         is_complimentary, rate_source, channel_id, stay_type, created_at, updated_at, calendar_rate_vnd,
         reference_rate_vnd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $9, $10, $11, 'short_stay_rate', $12, $13, $14, $14, $15, $9)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        w.reservationId,
        w.segmentId,
        w.roomId,
        n.date,
        w.state,
        n.amountVnd,
        w.state === 'sold' ? w.now : null,
        w.isComplimentary || n.amountVnd === 0,
        w.channelId,
        w.stayType,
        w.now,
        n.calendarVnd ?? null,
      ],
    );
  }
}

export interface LiveNightRow {
  id: string;
  date: LocalDate;
  grossVnd: number;
  discountVnd: number;
  calendarVnd: number | null;
}

/**
 * Live nights with their calendar price (A-22) – for BR-107 re-tiering on a change of nights. Money nights only:
 * the lease nights of a manual long stay (A7-01, `lease-nights.ts`) are left out.
 */
export async function liveNightRows(tx: Tx, reservationId: string): Promise<LiveNightRow[]> {
  const { rows } = await tx.query<{
    id: string;
    date: string;
    gross: number;
    discount: number;
    calendar: number | null;
  }>(
    `SELECT id, stay_date::text AS date, room_revenue_gross_vnd AS gross, discount_vnd AS discount,
            calendar_rate_vnd AS calendar
       FROM stay_night WHERE reservation_id = $1 AND night_state <> 'void'
        AND rate_source <> 'lease_allocation'
      ORDER BY stay_date`,
    [reservationId],
  );
  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    grossVnd: r.gross,
    discountVnd: r.discount,
    calendarVnd: r.calendar,
  }));
}

/** Void every live night of a booking (optionally only the given dates) – erd 8 "Mọi lần void". */
export async function voidNights(
  tx: Tx,
  reservationId: string,
  reason:
    | 'hold_expired'
    | 'cancelled'
    | 'no_show'
    | 'date_change'
    | 'relocated_external'
    | 'channel_cancelled',
  now: Date,
  dates?: readonly LocalDate[],
): Promise<string[]> {
  const r = await tx.query(
    `UPDATE stay_night SET prev_state = night_state, night_state = 'void', voided_at = $3, void_reason = $2,
            updated_at = $3
      WHERE reservation_id = $1 AND night_state <> 'void'
        AND ($4::date[] IS NULL OR stay_date = ANY($4::date[]))
      RETURNING id`,
    [reservationId, reason, now, dates ? [...dates] : null],
  );
  return r.rows.map((x) => (x as { id: string }).id);
}

/** hold → sold on B4 (sold_at = first time sold). */
export async function sellNights(tx: Tx, reservationId: string, now: Date): Promise<void> {
  await tx.query(
    `UPDATE stay_night SET night_state = 'sold', sold_at = COALESCE(sold_at, $2), updated_at = $2
      WHERE reservation_id = $1 AND night_state = 'hold'`,
    [reservationId, now],
  );
}

/** Live (not void) nights of a booking as priced nights (for re-pricing kept nights – BR-106). */
export async function liveNights(
  tx: Tx,
  reservationId: string,
): Promise<
  Array<{ date: LocalDate; amountVnd: number; calendarVnd: number | null; state: 'hold' | 'sold' }>
> {
  const { rows } = await tx.query<{
    date: string;
    amount: number;
    calendar: number | null;
    state: 'hold' | 'sold';
  }>(
    `SELECT stay_date::text AS date, room_revenue_gross_vnd AS amount, calendar_rate_vnd AS calendar,
            night_state AS state
       FROM stay_night WHERE reservation_id = $1 AND night_state <> 'void'
        AND rate_source <> 'lease_allocation'
      ORDER BY stay_date`,
    [reservationId],
  );
  return rows.map((r) => ({
    date: r.date,
    amountVnd: r.amount,
    calendarVnd: r.calendar,
    state: r.state,
  }));
}

export interface TransitionRecord {
  reservationId: string;
  code: string;
  from: ReservationStatus | null;
  to: ReservationStatus;
  event: string;
  reasonCode?: string | null | undefined;
  reasonNote?: string | null | undefined;
  now: Date;
  requestId?: string | undefined;
}

/** state_transition (SM-01) + reservation_change(field=status) – same transaction as the change. */
export async function recordTransition(tx: Tx, t: TransitionRecord): Promise<void> {
  await tx.query(
    `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
       event_code, actor_type, actor_user_id, reason_code, reason_note, occurred_at, request_id)
     VALUES ($1, $2, 'SM-01', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      t.reservationId,
      t.from,
      t.to,
      t.event,
      tx.ctx.actorType,
      tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
      t.reasonCode ?? null,
      t.reasonNote ?? null,
      t.now,
      t.requestId ?? null,
    ],
  );
  if (t.from !== t.to) {
    await recordChange(tx, t.reservationId, 'status', t.from, t.to, t.now, t.reasonCode ?? null);
  }
}

/** Generic state transition row for other machines (SM-02 room blocks). */
export async function recordMachineTransition(
  tx: Tx,
  machine: string,
  entityId: string,
  from: string | null,
  to: string,
  event: string,
  now: Date,
  reasonNote: string | null,
): Promise<void> {
  await tx.query(
    `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
       event_code, actor_type, actor_user_id, reason_note, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      machine,
      entityId,
      from,
      to,
      event,
      tx.ctx.actorType,
      tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
      reasonNote,
      now,
    ],
  );
}

export async function recordChange(
  tx: Tx,
  reservationId: string,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  now: Date,
  reason: string | null = null,
): Promise<void> {
  const text = (v: unknown) =>
    v === null || v === undefined ? null : typeof v === 'string' ? v : JSON.stringify(v);
  await tx.query(
    `INSERT INTO reservation_change (id, organization_id, property_id, reservation_id, changed_at, changed_by,
       field, old_value, new_value, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      uuidv7(),
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      reservationId,
      now,
      tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
      field,
      text(oldValue),
      text(newValue),
      reason,
    ],
  );
}

/**
 * BR-905: every inventory change → outbox `channel.availability_changed` (Mock channel manager in R2).
 * Payload carries ids and dates only (no C2/C3).
 */
export async function outboxAvailability(
  tx: Tx,
  changes: ReadonlyArray<{ roomId: string | null; from: LocalDate; to: LocalDate }>,
  cause: string,
): Promise<void> {
  const rooms = changes.filter((c) => c.roomId !== null);
  if (rooms.length === 0) return;
  const id = uuidv7();
  await tx.query(
    `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
     VALUES ($1, $2, $3, 'channel.availability_changed', $4, $5)`,
    [
      id,
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      JSON.stringify({ cause, ranges: rooms }),
      `availability:${id}`,
    ],
  );
}

/** Staff notification through the outbox (`staff.push`, Mock in R2): ids, codes and roles only. */
export async function outboxStaffPush(
  tx: Tx,
  payload: {
    kind: string;
    roles: string[];
    userIds?: string[];
    refType: string;
    refId: string;
    refCode?: string;
  },
  dedupeKey: string,
): Promise<void> {
  await tx.query(
    `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
     VALUES ($1, $2, $3, 'staff.push', $4, $5) ON CONFLICT (dedupe_key) DO NOTHING`,
    [uuidv7(), tx.ctx.organizationId, tx.ctx.propertyId, JSON.stringify(payload), dedupeKey],
  );
}

/** Nights of [from, to) that are not in [keepFrom, keepTo). */
export function datesOutside(
  from: LocalDate,
  to: LocalDate,
  keepFrom: LocalDate,
  keepTo: LocalDate,
): LocalDate[] {
  const keep = new Set(nightDates(keepFrom, keepTo));
  return nightDates(from, to).filter((d) => !keep.has(d));
}

export { addDays };
