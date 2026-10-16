/**
 * Booking facts for the registration and guest-portal modules (BE-C, ARC s3-contract 4.3 "reservations/public –
 * đọc đơn có actor"): the narrow view they need (dates, persons, booker name/locale for the declaration and the
 * guest greeting, current room, actual times) and the one write they need (`setEta` from the online check-in).
 * They never read or write the reservations tables directly.
 *
 * - stayView / stayViews   read with the CALLER's actor (SEC H2): SAL/CTV only their own bookings (x-scope own),
 *                          FD+ all; jobs and the guest session (already bound to its booking by the token) pass
 *                          SYSTEM_ACTOR. Out of scope / other property (RLS) → null.
 * - activeRootBookings     primary bookings still open (hold/confirmed/in house) – registration backfill.
 * - setEta                 EP06 8 / guest-web step "eta": Reservation.etaTime from completeOnlineCheckin
 *                          (lock order: the booking row first; history + SSE `reservation.changed`).
 */
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import type { LocalDate, LocalTime } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import { type Actor, ownScopeSql, recordChange } from '../internal/reservation-store';

export interface StayViewRow {
  reservationId: string;
  code: string;
  status: 'hold' | 'confirmed' | 'in_house' | 'checked_out' | 'cancelled' | 'no_show';
  stayType: 'short' | 'long';
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** BR-601/608: everyone to declare, children under 6 included. */
  personsTotal: number;
  bookerName: string;
  bookerPreferredLocale: string | null;
  /** Room of the latest active segment (current room in house); null while unassigned. */
  roomNo: string | null;
  etaTime: LocalTime | null;
  actualCheckinAt: Date | null;
  actualCheckoutAt: Date | null;
  parentReservationId: string | null;
}

interface Row {
  id: string;
  code: string;
  status: StayViewRow['status'];
  stay_type: StayViewRow['stayType'];
  arrival_date: string;
  departure_date: string;
  persons: number;
  full_name: string;
  preferred_locale: string | null;
  room_no: string | null;
  eta_time: string | null;
  actual_checkin_at: Date | null;
  actual_checkout_at: Date | null;
  parent_reservation_id: string | null;
}

const SELECT = `
  SELECT r.id, r.code, r.status, r.stay_type, r.arrival_date::text AS arrival_date,
         r.departure_date::text AS departure_date,
         (r.adults + r.children_6_11 + r.children_under_6)::int AS persons,
         g.full_name, g.preferred_locale, rm.room_no, to_char(r.eta_time, 'HH24:MI') AS eta_time,
         r.actual_checkin_at, r.actual_checkout_at, r.parent_reservation_id
    FROM reservation r
    JOIN guest g ON g.id = r.booker_guest_id
    LEFT JOIN LATERAL (
      SELECT ro.room_no FROM reservation_segment s JOIN room ro ON ro.id = s.room_id
       WHERE s.reservation_id = r.id AND s.active
       ORDER BY s.from_date DESC LIMIT 1) rm ON true`;

function toView(r: Row): StayViewRow {
  return {
    reservationId: r.id,
    code: r.code,
    status: r.status,
    stayType: r.stay_type,
    arrivalDate: r.arrival_date,
    departureDate: r.departure_date,
    personsTotal: r.persons,
    bookerName: r.full_name,
    bookerPreferredLocale: r.preferred_locale,
    roomNo: r.room_no,
    etaTime: r.eta_time,
    actualCheckinAt: r.actual_checkin_at,
    actualCheckoutAt: r.actual_checkout_at,
    parentReservationId: r.parent_reservation_id,
  };
}

/** One booking for `actor` (null when not visible – out of scope or another property). */
export async function stayView(
  tx: Tx,
  reservationId: string,
  actor: Actor,
): Promise<StayViewRow | null> {
  return (await stayViews(tx, [reservationId], actor)).get(reservationId) ?? null;
}

export async function stayViews(
  tx: Tx,
  ids: readonly string[],
  actor: Actor,
): Promise<Map<string, StayViewRow>> {
  if (ids.length === 0) return new Map();
  const scope = ownScopeSql(actor, '$2');
  const { rows } = await tx.query<Row>(
    `${SELECT} WHERE r.id = ANY($1::uuid[]) ${scope ? `AND ${scope}` : 'AND $2::uuid IS NOT NULL'}`,
    [[...ids], actor.userId],
  );
  return new Map(rows.map((r) => [r.id, toView(r)]));
}

/** Technical cap of one backfill read (a property has tens of open bookings). */
const ROOT_BOOKINGS_CAP = 2000;

/** Primary bookings still open (hold / confirmed / in house) with their head count. */
export async function activeRootBookings(tx: Tx): Promise<Array<{ id: string; persons: number }>> {
  const { rows } = await tx.query<{ id: string; persons: number }>(
    `SELECT r.id, (r.adults + r.children_6_11 + r.children_under_6)::int AS persons FROM reservation r
      WHERE r.parent_reservation_id IS NULL AND r.status IN ('hold', 'confirmed', 'in_house')
      ORDER BY r.id LIMIT $1`,
    [ROOT_BOOKINGS_CAP],
  );
  return rows;
}

/**
 * EP06 8 (online check-in step "eta"): the guest's arrival time becomes Reservation.etaTime. Only before the
 * check-in (`hold`/`confirmed`); unchanged value = no-op. `late` (arrives after the desk closes) is kept in
 * the change history reason. Returns false when the booking is no longer before check-in.
 */
export async function setEta(
  tx: Tx,
  reservationId: string,
  eta: LocalTime | null,
  late: boolean,
  now: Date,
): Promise<boolean> {
  if (eta !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(eta)) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'etaTime', code: 'VALIDATION_FAILED' }],
    });
  }
  const { rows } = await tx.query<{ status: string; eta: string | null }>(
    `SELECT status, to_char(eta_time, 'HH24:MI') AS eta FROM reservation WHERE id = $1 FOR UPDATE`,
    [reservationId],
  );
  const r = rows[0];
  if (!r) throw problem('NOT_FOUND');
  if (r.status !== 'hold' && r.status !== 'confirmed') return false;
  if (r.eta === eta) return true;
  await tx.query(
    `UPDATE reservation SET eta_time = $2::time, updated_at = $3, version = version + 1 WHERE id = $1`,
    [reservationId, eta, now],
  );
  await recordChange(
    tx,
    reservationId,
    'eta_time',
    r.eta,
    eta,
    now,
    late ? 'online_checkin late_arrival' : 'online_checkin',
  );
  await new EventsService().publish(tx, 'reservation.changed', reservationId);
  return true;
}
