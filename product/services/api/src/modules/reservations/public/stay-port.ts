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
import type { BookingMovePlan, PlanInput } from '../internal/move-planner';
import {
  type RoomInfo,
  ReservationsService,
  type StayNightPrice,
} from '../internal/reservations.service';
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
export type { RoomInfo, StayNightPrice } from '../internal/reservations.service';
export {
  type BookingMovePlan,
  type PlanInput,
  type PlanNight,
  moveCauseOf,
} from '../internal/move-planner';
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

  // BR-110 per night (DOM S3-13, FB-R2-ARC-BE-S3-01) – see ReservationsService.
  nightFee(
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    baseOccupancy: number,
  ): number {
    return this.reservations.nightFee(ctx, row, party, baseOccupancy);
  }

  nightExtra(
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    baseOccupancy: number,
  ): { feeVnd: number; count: number } {
    return this.reservations.nightExtra(ctx, row, party, baseOccupancy);
  }

  /** S4-38 (BUG-R2-125): the fee of a night added before/after the stay, as the write gives it. */
  addedNightFee(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    side: 'first' | 'last',
    roomBase: number,
  ): Promise<number> {
    return this.reservations.addedNightFee(tx, ctx, row, side, roomBase);
  }

  nightFees(tx: Tx, row: ReservationRow) {
    return this.reservations.nightFees(tx, row);
  }

  setNightFees(
    tx: Tx,
    reservationId: string,
    fees: ReadonlyArray<{ date: string; feeVnd: number; count?: number }>,
    now: Date,
  ): Promise<void> {
    return this.reservations.setNightFees(tx, reservationId, fees, now);
  }

  /**
   * In-house children of the stay follow the people of the primary booking (fee per night from `fromDate`).
   * `write: false` = preview only: Σ old/new BR-110 fee of the children's nights from `fromDate`.
   */
  syncChildrenParty(
    tx: Tx,
    ctx: BookingContext,
    parent: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    fromDate: string,
    opts: { write: boolean } = { write: true },
  ): Promise<{ oldVnd: number; newVnd: number; nights: number }> {
    return this.reservations.syncChildrenParty(tx, ctx, parent, party, fromDate, opts);
  }

  peopleFromNight(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    party: { adults: number; children6to11: number; childrenUnder6: number },
    fromDate: string,
    opts: { write: boolean },
  ) {
    return this.reservations.peopleFromNight(tx, ctx, row, party, fromDate, opts);
  }

  feesForNewNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    dates: readonly string[],
  ): Promise<void> {
    return this.reservations.feesForNewNights(tx, ctx, row, dates);
  }

  /** BUG-R2-134: the room the guest bought (null = never moved) – BR-417-07, BR-429 (b1). */
  boughtRoomId(tx: Tx, row: ReservationRow): Promise<string | null> {
    return this.reservations.boughtRoomId(tx, row);
  }

  // BR-107 re-tiering of an in-house stay (B13, B9a) – ARC B-3 (d): night prices only through reservations.
  pricedNights(tx: Tx, row: ReservationRow): Promise<StayNightPrice[]> {
    return this.reservations.pricedNights(tx, row);
  }

  retierStay(
    ctx: BookingContext,
    row: ReservationRow,
    kept: readonly StayNightPrice[],
    added: readonly StayNightPrice[],
  ): { pct: number; kept: StayNightPrice[]; added: StayNightPrice[] } {
    return this.reservations.retierStay(ctx, row, kept, added);
  }

  writeRepricedNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    input: Parameters<ReservationsService['writeRepricedNights']>[3],
  ): Promise<number> {
    return this.reservations.writeRepricedNights(tx, ctx, row, input);
  }

  // ── ONE calculation of a room move (OpenAPI 0.3.7 D1, ARC 10.4 – S4-04/05/07): B14 dryRun and write ──

  /** The money plan of one booking of the stay (nights from `fromDate` into `newRoom`). */
  planMove(tx: Tx, ctx: BookingContext, input: PlanInput): Promise<BookingMovePlan> {
    return this.reservations.planner.planBooking(tx, ctx, input);
  }

  /** Lock the folio after the rooms (lock order reservation → rooms → folio) before planning the write. */
  lockFolio(tx: Tx, row: ReservationRow): Promise<void> {
    return this.reservations.lockFolio(tx, row);
  }

  /**
   * Writes the planned nights of one booking (B14): room, segment, gross (discount kept), calendar and the
   * BR-110 fee/count/base of each moved night; `total_room_vnd` and the origin room (first move) follow.
   */
  writeMovedNights(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    plan: BookingMovePlan,
    segmentOf: ReadonlyMap<string, string>,
  ): Promise<void> {
    return this.reservations.writeMovedNights(tx, ctx, row, plan, segmentOf);
  }

  /** S4-05: reverse the OTA differences from the move night and post the plan's (one line per night). */
  repostDifferences(
    tx: Tx,
    ctx: BookingContext,
    row: ReservationRow,
    plan: BookingMovePlan,
    labels: { from: string; to: string },
  ): Promise<void> {
    return this.reservations.repostPlannedDifferences(tx, ctx, row, plan, labels);
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
