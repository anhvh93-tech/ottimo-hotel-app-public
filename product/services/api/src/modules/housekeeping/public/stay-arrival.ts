/**
 * First arrival of a stay (BR-807-01 – "khách ở tiếp" = arrival < business date < departure; linen rule BR-807 /
 * ESC-008 counts nights from it). One definition for J8 `hk.daily` and the B13 branch of RoomStatusService
 * (BUG-R2-151): the earliest of
 * - the booking's own arrival;
 * - its parent's arrival (an extension child B13 / a room-return child continues the parent's stay);
 * - the arrival of the children of the same root booking still or already lived (`in_house`/`checked_out`) – the
 *   B9a night before an early check-in of an OTA booking is such a child (its arrival is the day before).
 * SQL expression over the alias `r` (the `reservation` row of the segment); no parameters.
 */
export const STAY_ARRIVAL_SQL = `LEAST(
    r.arrival_date,
    COALESCE((SELECT sp.arrival_date FROM reservation sp WHERE sp.id = r.parent_reservation_id), r.arrival_date),
    COALESCE((SELECT min(sk.arrival_date) FROM reservation sk
               WHERE sk.parent_reservation_id = COALESCE(r.parent_reservation_id, r.id)
                 AND sk.status IN ('in_house', 'checked_out')), r.arrival_date))`;
