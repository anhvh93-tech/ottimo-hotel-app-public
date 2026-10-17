/**
 * The three lists of "Hôm nay" for one business date (BR-404, US-011; EP01 2.1) – ONE reader shared by
 * getArrivalsDepartures and the counts of getTonightKpi, so the KPI "{đã nhận}/{tổng}" always equals the list.
 *
 * Read model (reporting module – architecture 5.1 `reporting`, M1): SELECT only, inside the caller's read-only
 * tenant transaction (RLS); it writes nothing. Primary bookings only – a child booking (B9a prior night, OTA
 * extension B13/BR-422) shares the primary's room and folio and is never an arrival or a departure of its own
 * (ARC B-1 #5 b; B18 is called on the primary).
 * - arrivals:   primary, arrival_date = date, status confirmed (not yet in) or in_house (in today);
 * - departures: primary, status in_house or checked_out, EFFECTIVE departure = date (the latest departure of
 *               the booking and its children – a stay extended by a child booking leaves on the child's date);
 * - holds:      primary, status hold, arrival_date = date ("Giữ chỗ chưa cọc").
 * cancelled / no_show never appear (US-011 AC1).
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export interface StayListRow {
  id: string;
  code: string;
  status: 'hold' | 'confirmed' | 'in_house' | 'checked_out';
  stay_type: 'short' | 'long';
  arrival_date: LocalDate;
  departure_date: LocalDate;
  /** Arrivals/holds: the booking's departure; departures: the effective departure (= the list date). */
  effective_departure: LocalDate;
  guest_name: string;
  channel_code: string;
  eta_time: string | null;
  hold_expires_at: Date | null;
  conflict_state: 'none' | 'open' | 'resolved';
  capacity_conflict: boolean;
  folio_id: string;
  agreed_checkout_time: string | null;
  /** Room of the night that matters (arrival night / last night); null = unassigned (OTA conflict lane). */
  room_id: string | null;
  room_no: string | null;
}

const COLUMNS = `
  r.id, r.code, r.status, r.stay_type, r.arrival_date::text AS arrival_date,
  r.departure_date::text AS departure_date, g.full_name AS guest_name, c.code AS channel_code,
  to_char(r.eta_time, 'HH24:MI') AS eta_time, r.hold_expires_at, r.conflict_state,
  (r.capacity_conflict_at IS NOT NULL) AS capacity_conflict, r.folio_id,
  to_char(r.agreed_checkout_time, 'HH24:MI') AS agreed_checkout_time`;

/** Segment covering night `$night` (else the latest active one) and its room. */
const ROOM_OF_NIGHT = (night: string) => `
  LEFT JOIN LATERAL (
    SELECT s.room_id, rm.room_no FROM reservation_segment s LEFT JOIN room rm ON rm.id = s.room_id
     WHERE s.reservation_id = r.id AND s.active
     ORDER BY (s.from_date <= ${night} AND s.to_date > ${night}) DESC, s.from_date DESC
     LIMIT 1) seg ON true`;

export async function arrivalRows(tx: Tx, date: LocalDate): Promise<StayListRow[]> {
  const { rows } = await tx.query<StayListRow>(
    `SELECT ${COLUMNS}, r.departure_date::text AS effective_departure, seg.room_id, seg.room_no
       FROM reservation r
       JOIN channel c ON c.id = r.channel_id
       JOIN guest g ON g.id = r.booker_guest_id
       ${ROOM_OF_NIGHT('$1::date')}
      WHERE r.arrival_date = $1 AND r.status IN ('confirmed', 'in_house')
        AND r.parent_reservation_id IS NULL`,
    [date],
  );
  return rows;
}

export async function holdRows(tx: Tx, date: LocalDate): Promise<StayListRow[]> {
  const { rows } = await tx.query<StayListRow>(
    `SELECT ${COLUMNS}, r.departure_date::text AS effective_departure, seg.room_id, seg.room_no
       FROM reservation r
       JOIN channel c ON c.id = r.channel_id
       JOIN guest g ON g.id = r.booker_guest_id
       ${ROOM_OF_NIGHT('$1::date')}
      WHERE r.arrival_date = $1 AND r.status = 'hold' AND r.parent_reservation_id IS NULL
      ORDER BY r.hold_expires_at, r.code`,
    [date],
  );
  return rows;
}

export async function departureRows(tx: Tx, date: LocalDate): Promise<StayListRow[]> {
  // Candidates through the departure index: primaries leaving on `date` + primaries of children leaving on
  // `date`; then keep those whose effective departure is `date`.
  const { rows } = await tx.query<StayListRow>(
    `WITH cand AS (
       SELECT id FROM reservation
        WHERE departure_date = $1 AND parent_reservation_id IS NULL AND status IN ('in_house', 'checked_out')
       UNION
       SELECT parent_reservation_id FROM reservation
        WHERE departure_date = $1 AND parent_reservation_id IS NOT NULL
          AND status IN ('confirmed', 'in_house', 'checked_out')
     ), eff AS (
       SELECT r.id,
              GREATEST(r.departure_date,
                       COALESCE((SELECT max(k.departure_date) FROM reservation k
                                  WHERE k.parent_reservation_id = r.id
                                    AND k.status IN ('confirmed', 'in_house', 'checked_out')),
                                r.departure_date)) AS dep
         FROM reservation r JOIN cand ON cand.id = r.id
        WHERE r.parent_reservation_id IS NULL AND r.status IN ('in_house', 'checked_out')
     )
     SELECT ${COLUMNS}, eff.dep::text AS effective_departure, seg.room_id, seg.room_no
       FROM eff
       JOIN reservation r ON r.id = eff.id
       JOIN channel c ON c.id = r.channel_id
       JOIN guest g ON g.id = r.booker_guest_id
       ${ROOM_OF_NIGHT('($1::date - 1)')}
      WHERE eff.dep = $1`,
    [date],
  );
  return rows;
}

/**
 * US-031 AC2 / EP01 2.2 `hasArrivalSameRoomToday`: another primary booking (hold, confirmed or in house)
 * starts a stay in `roomId` on `date` – the departing guest's room must be freed and cleaned first.
 */
export async function roomsWithArrival(
  tx: Tx,
  date: LocalDate,
  roomIds: readonly string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (roomIds.length === 0) return out;
  const { rows } = await tx.query<{ room_id: string; reservation_id: string }>(
    `SELECT DISTINCT s.room_id, s.reservation_id FROM reservation_segment s
       JOIN reservation r ON r.id = s.reservation_id
      WHERE s.active AND s.from_date = $1 AND s.room_id = ANY($2::uuid[])
        AND r.status IN ('hold', 'confirmed', 'in_house') AND r.parent_reservation_id IS NULL`,
    [date, [...roomIds]],
  );
  for (const r of rows) out.set(r.room_id, [...(out.get(r.room_id) ?? []), r.reservation_id]);
  return out;
}

/** Bookings among `ids` with a recorded check-out reply (US-030 – checkout_confirmation). */
export async function repliedBookings(tx: Tx, ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const { rows } = await tx.query<{ reservation_id: string }>(
    'SELECT DISTINCT reservation_id FROM checkout_confirmation WHERE reservation_id = ANY($1::uuid[])',
    [[...ids]],
  );
  return new Set(rows.map((r) => r.reservation_id));
}
