/**
 * OpenAPI 0.3.9 add 1 (`Reservation.stayDepartureDate`, BR-422): the EFFECTIVE departure of a stay – the latest
 * departure of the primary booking and its extension children still in force: the in_house children of an in-house
 * stay; the confirmed / in_house children of a confirmed one (the same children as `effectiveStay` of B16/B18).
 * null for a child booking or another status. One aggregate query.
 * The one reader of this rule for `Reservation.stayDepartureDate` (reservations.service) and `StayInfo` (read-port –
 * the minibar standard's overdue window, FB-R5-ARC-BE-A2-01).
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export async function stayDepartureDateOf(
  tx: Tx,
  r: {
    id: string;
    parentReservationId: string | null;
    status: string;
    departureDate: LocalDate;
  },
): Promise<LocalDate | null> {
  if (r.parentReservationId) return null;
  if (r.status !== 'confirmed' && r.status !== 'in_house') return null;
  const live = r.status === 'in_house' ? ['in_house'] : ['confirmed', 'in_house'];
  const { rows } = await tx.query<{ d: string | null }>(
    `SELECT max(departure_date)::text AS d FROM reservation
      WHERE parent_reservation_id = $1 AND status = ANY($2::text[])`,
    [r.id, live],
  );
  const child = rows[0]?.d ?? null;
  return child && child > r.departureDate ? child : r.departureDate;
}
