/**
 * Port of the reservations module for sales (quotes, leads, commissions) and folio (BE-B). Provided by the
 * reservations module under RESERVATION_SALES_PORT (global); every method runs in the caller's transaction.
 *
 * - availability()        US-082 / quote screen: is the room free for [from, to) + up to 6 free rooms
 *                         (same group first, other groups marked `upgrade` – BR-316).
 * - createHoldFromQuote() Q2 + B1 (US-084): a `hold` booking on the quote's room with the quote's prices
 *                         (BR-006 snapshot). Inventory through the EXCLUDE constraint (409 ROOM_UNAVAILABLE).
 * - reservationView()     the Reservation JSON of a booking for the caller in the tx context.
 * - ownership()           code + creator + closer of a booking (SAL/CTV `own` scope checks).
 * - lockForDeposit()      payments (confirmDeposit, deposit notices): the booking FOR UPDATE (lock order
 *                         reservation → room → folio) with what B4 needs; null when not visible.
 * - confirmFromHold()     B4 after payments checked the deposit (Σ ≥ required, money before the deadline –
 *                         US-085 AC4): hold → confirmed, occupancy kind, nights sold, BR-812 kit task,
 *                         state_transition. Returns the ConfirmedStay the CALLER posts to the folio.
 * - ConfirmedStay         what folio.onReservationConfirmed() needs to post room/extra-person lines (B2/B4/B12).
 *
 * (Re-created by BE-A from the call sites of folio/sales/payments after an overwrite – same members.)
 */
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';
import type { RoomSuggestion } from './occupancy.service';

export const RESERVATION_SALES_PORT = Symbol('RESERVATION_SALES_PORT');

export interface AvailabilityQuery {
  roomId?: string;
  roomGroupId?: string;
  fromDate: LocalDate;
  toDate: LocalDate;
  /** BR-110 counted persons (adults + children 6–11). */
  countedPersons: number;
}

export interface AvailabilityAnswer {
  /** The requested room (or, without a room, at least one room of the group) is free. */
  available: boolean;
  reason?: 'booked' | 'blocked' | 'not_sellable' | 'capacity' | 'past_date';
  alternatives: RoomSuggestion[];
  /** BR-113 orphan-night exception: [from, to) on the requested room fills a gap between two stays. */
  orphanGap?: boolean;
}

export interface DepositTarget {
  id: string;
  code: string;
  status: string;
  version: number;
  folioId: string;
  quoteId: string | null;
  createdBy: string | null;
  closerUserId: string | null;
  holdCreatedAt: Date | null;
  holdExpiresAt: Date | null;
  depositRequiredVnd: number;
}

export interface HoldFromQuoteInput {
  quoteId: string;
  quoteCode: string;
  roomId: string;
  channelId: string;
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  adults: number;
  children6to11: number;
  childrenUnder6: number;
  bookerGuestId: string;
  closerUserId: string | null;
  holdHours: number;
  /** Informative – the reservations module recomputes the BR-302 deadline from Clock. */
  holdCreatedAt?: Date;
  holdExpiresAt?: Date;
  nightlyRates: Array<{ date: LocalDate; amountVnd: number }>;
  extraPersonPerNightVnd: number;
  extraGuestCount: number;
  totalRoomVnd: number;
  depositRequiredVnd: number;
  depositMethod?: string;
  pricingSnapshot: Record<string, unknown>;
  createdBy: string;
  requestId?: string;
}

export interface ReservationOwnership {
  id: string;
  code: string;
  status: string;
  createdBy: string | null;
  closerUserId: string | null;
}

export interface ConfirmedStay {
  reservationId: string;
  reservationCode: string;
  folioId: string;
  channelId: string;
  closerUserId: string | null;
  stayType: 'short' | 'long';
  extraGuestCount: number;
  extraPersonPerNightVnd: number;
  /** OTA fee reported on entry (BR-901), null = estimate from the channel rate. */
  otaChannelFeeVnd: number | null;
  nights: Array<{ stayNightId: string; date: LocalDate; roomRevenueVnd: number }>;
  /** Commission % of the quote (BR-006 snapshot) – null = the parameter in force (direct bookings). */
  commissionRatePctSnapshot?: number | null;
}

export interface ReservationSalesPort {
  availability(tx: Tx, q: AvailabilityQuery): Promise<AvailabilityAnswer>;
  createHoldFromQuote(
    tx: Tx,
    input: HoldFromQuoteInput,
  ): Promise<{ reservationId: string; code: string }>;
  reservationView(tx: Tx, reservationId: string): Promise<Record<string, unknown>>;
  ownership(tx: Tx, reservationId: string): Promise<ReservationOwnership | null>;
  lockForDeposit(tx: Tx, reservationId: string): Promise<DepositTarget | null>;
  confirmFromHold(
    tx: Tx,
    reservationId: string,
    actor: { userId: string; requestId?: string },
  ): Promise<ConfirmedStay>;
}
