/**
 * "Khách đang ở căn" on a business day – ONE definition for the housekeeping module (ARC FB-R2-ARC-BE-S4-03:
 * `inHouseByRoom` read `to_date >= D`, RoomStatusService `to_date > D`, so on the departure day one said "guest in
 * the room" and the other "empty"). Same rule as BE-B's `currentRoomOfStay` (BUG-R2-178): an in-house stay is in
 * the room of its segment covering D (`from_date ≤ D < to_date`); when none covers D (departure day not checked
 * out yet, or a stay past its dates) it is in the room of its latest-starting segment. The stay = the booking and
 * the children of the same root (B13 extension, B9a night, S4-09 move). So on a room-move day only the new room
 * holds the guest, and on the departure day the room keeps the guest until B18.
 *
 * Used by: RoomStatusService (derived OC, the B13 branch), the room list (`inHouseByRoom`), "Cần chú ý"
 * `room_status_mismatch`, work orders (occupancy at creation, J11 remedy). NOT by J8 `hk.daily`: a stay-over clean
 * is a different question – "the night of D is lived" (`STAYOVER_NIGHT_SQL`, BR-807-01 arrival < D < departure).
 *
 * SQL condition over the aliases `s` (`reservation_segment`) and `r` (its `reservation`); `day` is the SQL of the
 * business date (a parameter such as `$1::date`).
 */
export function inRoomOnSql(day: string): string {
  return `(s.active AND r.status = 'in_house' AND s.from_date <= ${day}
    AND (s.to_date > ${day} OR NOT EXISTS (
      SELECT 1 FROM reservation_segment s2 JOIN reservation r2 ON r2.id = s2.reservation_id
       WHERE s2.active AND s2.id <> s.id AND r2.status = 'in_house'
         AND COALESCE(r2.parent_reservation_id, r2.id) = COALESCE(r.parent_reservation_id, r.id)
         AND s2.from_date <= ${day} AND (s2.to_date > ${day} OR s2.from_date > s.from_date))))`;
}

/** J8 stay-over: the night of `day` is lived in the segment (`from_date ≤ D < to_date`) – see inRoomOnSql. */
export function stayoverNightSql(day: string): string {
  return `(s.active AND r.status = 'in_house' AND s.from_date <= ${day} AND s.to_date > ${day})`;
}
