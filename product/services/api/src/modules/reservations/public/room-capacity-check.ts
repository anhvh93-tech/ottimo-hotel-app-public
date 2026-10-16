/**
 * Real implementation of the platform port ROOM_CAPACITY_CHECK (US-004, BR-110; OpenAPI `updateRoom` 409
 * `CAPACITY_BELOW_BOOKINGS`; QC-S2-01 / ĐK-S2-2). Replaces the Sprint 1 stub NO_BOOKINGS_YET.
 *
 * A booking blocks lowering `room.max_occupancy` to `newMax` when ALL hold:
 *  - it is `confirmed`, `in_house`, or a live `hold` (`hold_expires_at` > now – an expired hold that J1 has not
 *    cancelled yet no longer keeps the room);
 *  - one of its ACTIVE segments sits on the room and still has a night ≥ `fromDate` (half-open
 *    [from_date, to_date) → `to_date > fromDate`, BR-002);
 *  - its counted head count (adults + children 6–11; children under 6 never count – BR-110) is > `newMax`.
 * OTA bookings already flagged over capacity (DOM D-1) count too: lowering would only make them worse.
 *
 * `stayFrom`/`stayTo` = the booking's stay ON THIS ROOM (its active segments there), so a booking moved
 * mid-stay shows only the nights that would break. One row per booking.
 *
 * Race with a concurrent booking write: RoomsService.update locks the room row FOR UPDATE before calling this;
 * every booking write that relies on max_occupancy re-reads it after its own room lock
 * (ReservationsService.assertCapacityStable) – see BE-A s3-dk2 report.
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import type { CapacityConflict, RoomCapacityCheck } from '../../platform/public/room-capacity';

export const OVER_CAPACITY_SQL = `
  SELECT r.code AS reservation_code,
         min(s.from_date)::text AS stay_from,
         max(s.to_date)::text AS stay_to,
         (r.adults + r.children_6_11)::int AS guest_count
    FROM reservation_segment s
    JOIN reservation r ON r.id = s.reservation_id
   WHERE s.room_id = $1
     AND s.active
     AND s.to_date > $3::date
     AND (r.status IN ('confirmed', 'in_house') OR (r.status = 'hold' AND r.hold_expires_at > $4))
     AND r.adults + r.children_6_11 > $2
   GROUP BY r.id, r.code, r.adults, r.children_6_11
   ORDER BY min(s.from_date), r.code`;

@Injectable()
export class ReservationCapacityCheck implements RoomCapacityCheck {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  async overCapacity(
    tx: Tx,
    roomId: string,
    newMaxOccupancy: number,
    fromDate: LocalDate,
  ): Promise<CapacityConflict[]> {
    const { rows } = await tx.query<{
      reservation_code: string;
      stay_from: string;
      stay_to: string;
      guest_count: number;
    }>(OVER_CAPACITY_SQL, [roomId, newMaxOccupancy, fromDate, this.clock.now()]);
    return rows.map((r) => ({
      reservationCode: r.reservation_code,
      stayFrom: r.stay_from as LocalDate,
      stayTo: r.stay_to as LocalDate,
      guestCount: Number(r.guest_count),
    }));
  }

  /** A-39: the OVER_CAPACITY_SQL booking condition without the head-count part. */
  async futureReservationCount(tx: Tx, roomId: string, fromDate: LocalDate): Promise<number> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(DISTINCT r.id)::int AS n
         FROM reservation_segment s JOIN reservation r ON r.id = s.reservation_id
        WHERE s.room_id = $1 AND s.active AND s.to_date > $2::date
          AND (r.status IN ('confirmed', 'in_house') OR (r.status = 'hold' AND r.hold_expires_at > $3))`,
      [roomId, fromDate, this.clock.now()],
    );
    return rows[0]?.n ?? 0;
  }
}
