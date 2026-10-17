/**
 * getTonightKpi (US-010, US-019 AC2, US-003 AC4; EP01 1.1; metrics-definitions v0.2 Q-03…Q-05, K-01…K-03, S1c)
 * computed at read time from stay_night + room + room_block of the business date (BR-010 – 02:00 on 21/10 is
 * the night of 20/10). No money field at all (FD sees the whole object – rbac S02 note 1).
 *
 * - roomsTotal      rooms in business that night (active_from ≤ night < active_to);
 * - roomsSellable   of those, `is_sellable` (a room out of sale is in neither numerator nor denominator);
 * - oooRooms        sellable rooms inside an OOO block `active`/`released` covering the night
 *                   ([start, coalesce(end_actual, end_planned)) – `planned`/`cancelled` never count, Q-04);
 *                   a night both sold and OOO (bad data, BR-804) counts as sold, not OOO (EP01 1.1 "Biên");
 * - availableRoomsNet = roomsSellable − oooRooms (K-01);
 * - occupiedRooms   sellable rooms with a `sold` night ASSIGNED to them (room_id not null – K-02, Q-05);
 * - holdOnlyRooms   sellable rooms whose only night is `hold` (BR-904 – never sold, shown apart);
 * - unassignedConflictReservations  bookings with a `sold` night without room (S1c – not in occupancy);
 * - occupancyPct    occupied ÷ availableNet × 100, one decimal; null when the denominator is 0 (Q-15);
 * - arrivals/departures (+ checked in / out) = the lists of getArrivalsDepartures (same reader);
 *   inHouse = primary bookings in house now (a stay with a child booking counts once).
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import { arrivalRows, departureRows } from './stay-lists';

export interface TonightKpi {
  businessDate: LocalDate;
  roomsTotal: number;
  roomsSellable: number;
  oooRooms: number;
  availableRoomsNet: number;
  occupiedRooms: number;
  holdOnlyRooms: number;
  arrivals: number;
  arrivalsCheckedIn: number;
  departures: number;
  departuresCheckedOut: number;
  inHouse: number;
  occupancyPct: number | null;
  unassignedConflictReservations: number;
  denominatorNote: string;
  metricRefs: Record<string, string>;
}

/** K-03 rounding (Q-15): one decimal, half up; null for a zero denominator. */
export function occupancyPct(occupied: number, available: number): number | null {
  if (available <= 0) return null;
  return Math.round((occupied * 1000) / available) / 10;
}

export async function tonightKpi(tx: Tx, night: LocalDate): Promise<TonightKpi> {
  const { rows } = await tx.query<{
    rooms_total: number;
    rooms_sellable: number;
    ooo_rooms: number;
    occupied_rooms: number;
    hold_only_rooms: number;
    unassigned: number;
    in_house: number;
  }>(
    `WITH rooms AS (
       SELECT id, is_sellable FROM room
        WHERE active_from <= $1 AND (active_to IS NULL OR active_to > $1)
     ), sold AS (
       SELECT DISTINCT room_id FROM stay_night
        WHERE stay_date = $1 AND night_state = 'sold' AND room_id IS NOT NULL
     ), held AS (
       SELECT DISTINCT room_id FROM stay_night
        WHERE stay_date = $1 AND night_state = 'hold' AND room_id IS NOT NULL
     ), ooo AS (
       SELECT DISTINCT room_id FROM room_block
        WHERE status IN ('active', 'released') AND start_date <= $1
          AND COALESCE(end_date_actual, end_date_planned) > $1
     )
     SELECT (SELECT count(*) FROM rooms)::int AS rooms_total,
            (SELECT count(*) FROM rooms WHERE is_sellable)::int AS rooms_sellable,
            (SELECT count(*) FROM rooms r
              WHERE r.is_sellable AND r.id IN (SELECT room_id FROM ooo)
                AND r.id NOT IN (SELECT room_id FROM sold))::int AS ooo_rooms,
            (SELECT count(*) FROM rooms r
              WHERE r.is_sellable AND r.id IN (SELECT room_id FROM sold))::int AS occupied_rooms,
            (SELECT count(*) FROM rooms r
              WHERE r.is_sellable AND r.id IN (SELECT room_id FROM held)
                AND r.id NOT IN (SELECT room_id FROM sold))::int AS hold_only_rooms,
            (SELECT count(DISTINCT reservation_id) FROM stay_night
              WHERE stay_date = $1 AND night_state = 'sold' AND room_id IS NULL)::int AS unassigned,
            (SELECT count(*) FROM reservation
              WHERE status = 'in_house' AND parent_reservation_id IS NULL)::int AS in_house`,
    [night],
  );
  const k = rows[0];
  if (!k) throw new Error('tonight KPI query returned no row');
  const arrivals = await arrivalRows(tx, night);
  const departures = await departureRows(tx, night);
  const availableRoomsNet = k.rooms_sellable - k.ooo_rooms;
  return {
    businessDate: night,
    roomsTotal: k.rooms_total,
    roomsSellable: k.rooms_sellable,
    oooRooms: k.ooo_rooms,
    availableRoomsNet,
    occupiedRooms: k.occupied_rooms,
    holdOnlyRooms: k.hold_only_rooms,
    arrivals: arrivals.length,
    arrivalsCheckedIn: arrivals.filter((a) => a.status === 'in_house').length,
    departures: departures.length,
    departuresCheckedOut: departures.filter((d) => d.status === 'checked_out').length,
    inHouse: k.in_house,
    occupancyPct: occupancyPct(k.occupied_rooms, availableRoomsNet),
    unassignedConflictReservations: k.unassigned,
    denominatorNote:
      `Đêm khả dụng thuần = ${k.rooms_sellable} căn − ${k.ooo_rooms} căn khóa = ${availableRoomsNet}; ` +
      'giữ chỗ không tính là bán; đơn OTA xung đột chưa gán căn không tính vào công suất',
    metricRefs: {
      availableRoomsNet: 'K-01',
      occupiedRooms: 'K-02',
      occupancyPct: 'K-03',
      unassignedConflictReservations: 'S1c',
    },
  };
}
