/**
 * What the front desk module (BE-A Sprint 3: B9…B18, US-022) uses from the reservations module – the booking
 * row, its segments/nights/history writers and the Reservation JSON – exposed here so `frontdesk` never imports
 * `reservations/internal` (coding-standards 2 [LINT]). Everything runs in the caller's transaction, lock order
 * reservation → rooms (ascending) → folio.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { ReservationStatus } from '../../../db/schema';
import type { BookingContext } from '../internal/booking-context';
import type { Actor, ReservationRow } from '../internal/reservation-store';
import { type RoomInfo, ReservationsService } from '../internal/reservations.service';
import type { ConfirmedStay } from './sales-port';

export type { BookingContext } from '../internal/booking-context';
export {
  type Actor,
  type LiveNightRow,
  type ReservationRow,
  type SegmentRow,
  RESERVATION_COLUMNS,
  activeSegments,
  insertNights,
  insertSegment,
  isOwnScoped,
  liveNightRows,
  liveNights,
  loadReservation,
  outboxAvailability,
  outboxStaffPush,
  recordChange,
  recordMachineTransition,
  recordTransition,
  voidNights,
} from '../internal/reservation-store';
export { Fields, asBody, isLocalDate, isUuid, pathId } from '../internal/inputs';
export { FDL_PLUS, FD_PLUS, MGR_PLUS, hasAny } from '../internal/allowed-actions';
export { syncExtraGuestKit } from '../internal/extra-guest-kit';
export type { RoomInfo } from '../internal/reservations.service';
export { SYSTEM_ACTOR } from '../internal/reservations.service';

@Injectable()
export class ReservationStayPort {
  constructor(@Inject(ReservationsService) private readonly reservations: ReservationsService) {}

  context(tx: Tx, actor: Actor, requestId?: string): Promise<BookingContext> {
    return this.reservations.context(tx, actor, requestId);
  }

  dtoOf(tx: Tx, ctx: BookingContext, row: ReservationRow): Promise<Record<string, unknown>> {
    return this.reservations.dtoOf(tx, ctx, row);
  }

  room(tx: Tx, roomId: string): Promise<RoomInfo | null> {
    return this.reservations.room(tx, roomId);
  }

  /** BR-110: counted persons (adults + children 6–11) ≤ room max → else 422 CAPACITY_EXCEEDED. */
  assertCapacity(rm: RoomInfo, party: { adults: number; children6to11: number }): void {
    this.reservations.assertCapacity(rm, party);
  }

  /** Re-read max occupancy after the rooms are locked (ĐK-S2-2 race) → 409 CONCURRENT_UPDATE. */
  assertCapacityStable(tx: Tx, rooms: ReadonlyArray<RoomInfo>): Promise<void> {
    return this.reservations.assertCapacityStable(tx, rooms);
  }

  assertVersion(row: { version: number }, expected: number): void {
    this.reservations.assertVersion(row, expected);
  }

  invalid(row: ReservationRow) {
    return this.reservations.invalid(row);
  }

  /** Sold nights of the booking as the folio wants them (FOLIO_STAY_SYNC.resyncStay input). */
  confirmedStay(tx: Tx, row: ReservationRow): Promise<ConfirmedStay> {
    return this.reservations.confirmedStay(tx, row);
  }

  /** BR-417 (3) / BR-422: direct-channel child booking of an OTA stay, same room + folio, `in_house`. */
  createChildStay(
    tx: Tx,
    ctx: BookingContext,
    parent: ReservationRow,
    input: Parameters<ReservationsService['createChildStay']>[3],
  ): Promise<ReservationRow> {
    return this.reservations.createChildStay(tx, ctx, parent, input);
  }

  /** Same-transaction hooks (registration, commissions…) of an SM-01 transition or a stay change. */
  emit(
    tx: Tx,
    kind: 'created' | 'transitioned' | 'stay_changed',
    row: ReservationRow,
    previous: ReservationStatus | null,
    transition: string | null,
    roomId: string | null,
    reasonCode?: string,
  ): Promise<void> {
    return this.reservations.emitEvent(tx, kind, row, previous, transition, roomId, reasonCode);
  }
}
