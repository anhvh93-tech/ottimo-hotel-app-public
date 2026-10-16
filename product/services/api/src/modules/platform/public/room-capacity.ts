/**
 * Port for US-004 / BR-110: "lowering maxOccupancy below the head count of a future or in-house booking →
 * 409 CAPACITY_BELOW_BOOKINGS". Bookings live in the reservations module (Sprint 2), which will provide
 * the real implementation of this token (query: reservation confirmed/in_house/live hold with a night
 * ≥ today on the room, counted guests > newMax). Until then the platform default finds no conflict.
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

/** Default until reservations exist (Sprint 2): no booking can conflict. */
export const NO_BOOKINGS_YET: RoomCapacityCheck = {
  overCapacity: async () => [],
};
