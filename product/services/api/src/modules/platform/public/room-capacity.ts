/**
 * Port for US-004 / BR-110: "lowering maxOccupancy below the head count of a future or in-house booking →
 * 409 CAPACITY_BELOW_BOOKINGS". Bookings live in the reservations module, which provides the ONLY
 * implementation of this token (ReservationsModule → reservations/public/room-capacity-check.ts; query:
 * reservation confirmed/in_house/live hold with a night ≥ today on the room, counted guests > newMax).
 * The platform module deliberately has no default (QC-S2-01: the Sprint 1 stub NO_BOOKINGS_YET silently
 * accepted every change) – a missing provider fails at boot instead.
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export const ROOM_CAPACITY_CHECK = Symbol('ROOM_CAPACITY_CHECK');

export interface CapacityConflict {
  reservationCode: string;
  stayFrom: LocalDate;
  stayTo: LocalDate;
  guestCount: number;
}

export interface RoomCapacityCheck {
  /** Bookings on `roomId` with a night ≥ `fromDate` that count more than `newMaxOccupancy` guests. */
  overCapacity(
    tx: Tx,
    roomId: string,
    newMaxOccupancy: number,
    fromDate: LocalDate,
  ): Promise<CapacityConflict[]>;
}
