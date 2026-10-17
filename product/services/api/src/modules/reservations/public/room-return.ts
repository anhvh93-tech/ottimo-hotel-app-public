/**
 * BR-424 v0.3.6 (S4-09, oracle BR-424-05) – the return day of a B14 `stayScope = until_parent_departure` move:
 * the child booking (in house, arrival = that business date) sleeps in its own room while the primary spent the
 * night before in another room. One definition for:
 * - the desk (`updateReservation.roomReturnRecorded` – frontdesk `recordRoomReturn`);
 * - J8 `hk.daily` (housekeeping – BE-C): `returnRoomId` is a room WITH AN ARRIVAL, not a stayover (VC/VI → no
 *   task; not clean → cleaning ranked "arrival today", due `checkout_time`; no open cleaning task →
 *   `priority_clean`); `movedRoomId` is a departure that J8 does NOT set `VD` at 07:00 (the guest is still there
 *   until the desk records the move back – `recorded`);
 * - BR-806 `room_status_mismatch` when the desk forgets (`recorded = false` late in the day).
 * Plain function (no Nest container) so the worker can call it too.
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export interface RoomReturn {
  childReservationId: string;
  parentReservationId: string;
  /** The child's room on the return day (the room the guest comes back to). */
  returnRoomId: string;
  /** The primary's room on the night before the return day (the room the guest leaves). */
  movedRoomId: string;
  /** The desk already recorded the move back (once – `reservation_change.field = 'room_return'`). */
  recorded: boolean;
}

export async function roomReturnsOn(
  tx: Tx,
  date: LocalDate,
  childReservationId?: string,
): Promise<RoomReturn[]> {
  const { rows } = await tx.query<{
    child_id: string;
    parent_id: string;
    return_room_id: string;
    moved_room_id: string;
    recorded: boolean;
  }>(
    `SELECT c.id AS child_id, c.parent_reservation_id AS parent_id, cs.room_id AS return_room_id,
            ps.room_id AS moved_room_id,
            EXISTS (SELECT 1 FROM reservation_change rc
                     WHERE rc.reservation_id = c.id AND rc.field = 'room_return') AS recorded
       FROM reservation c
       JOIN reservation_segment cs ON cs.reservation_id = c.id AND cs.active
                                  AND cs.from_date <= $1::date AND cs.to_date > $1::date
       JOIN reservation_segment ps ON ps.reservation_id = c.parent_reservation_id AND ps.active
                                  AND ps.from_date <= $1::date - 1 AND ps.to_date > $1::date - 1
      WHERE c.parent_reservation_id IS NOT NULL AND c.status = 'in_house' AND c.arrival_date = $1::date
        AND cs.room_id IS NOT NULL AND ps.room_id IS NOT NULL AND cs.room_id <> ps.room_id
        AND ($2::uuid IS NULL OR c.id = $2::uuid)
      ORDER BY c.id`,
    [date, childReservationId ?? null],
  );
  return rows.map((r) => ({
    childReservationId: r.child_id,
    parentReservationId: r.parent_id,
    returnRoomId: r.return_room_id,
    movedRoomId: r.moved_room_id,
    recorded: r.recorded,
  }));
}
