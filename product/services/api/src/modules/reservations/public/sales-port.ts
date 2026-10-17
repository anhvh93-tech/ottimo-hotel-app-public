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
 * - stayInfo()            Sprint 3 (BE-B S3-B3): read-only facts of a stay for modules whose callers are not in
 *                         the booking scopes (minibar count by HK, payment lists): status, dates, current room,
 *                         folio, channel. No guest name/phone (C2), RLS only – the CALLER applies its own
 *                         operation scope (e.g. HK only `in_house`). null when not visible.
 * - amountDueFor()        0.3.7 `createVietQr` `purpose` `check_in` / `check_out` (S4-10, BE-B): the cap of the QR =
 *                         `CheckInPreview.amountDueAtCheckinVnd` / `CheckoutSummary.amountDueAtCheckoutVnd` for the
 *                         given time and options – the SAME calculation as those reads (front desk module, through
 *                         ReservationHooks). Wrong state / day → 409 INVALID_TRANSITION; a non-desk actor → 403
 *                         FORBIDDEN_ACTION; a B9a / extra-night rate outside floor–ceiling → 422 RATE_OUT_OF_RANGE.
 * - ConfirmedStay         what folio.onReservationConfirmed() needs to post room/extra-person lines (B2/B4/B12).
 *
 * (Re-created by BE-A from the call sites of folio/sales/payments after an overwrite – same members.)
 */
import type { Tx } from '../../../db/database';
import type { LocalDate, LocalTime } from '../../../shared/time';
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
  /**
   * Sold nights. `extraPersonVnd` (Sprint 3 fix, DOM S3-13 / FB-R2-ARC-BE-S3-01): BR-110 fee of THAT night –
   * people present that night × base occupancy of that night's room (mid-stay changes apply from `effectiveFrom`).
   * The folio posts one `extra_person` line per night with it (0 = none); `extraPersonPerNightVnd` is the
   * booking-level default kept for older callers.
   */
  nights: Array<{
    stayNightId: string;
    date: LocalDate;
    roomRevenueVnd: number;
    extraPersonVnd: number;
    /** 0032 (blocker verification ARC-S3-01): extra persons of THAT night – the bill label "{n} người". */
    extraPersonCount?: number;
    /**
     * E05-11 (OpenAPI 0.3.6 bổ sung 2): night added at check-out after the BR-412 limit – printed as
     * `bill.line.extra_night` (charge_code `extra_night` on its room line). Optional (BE-A sets it).
     */
    extraNight?: boolean;
  }>;
  /** Commission % of the quote (BR-006 snapshot) – null = the parameter in force (direct bookings). */
  commissionRatePctSnapshot?: number | null;
  /**
   * Review S3 (DOM BE-13, BE-B): `ota_prepaid` → folio keeps one system `ota_collect` receipt equal to the
   * OTA-covered charges (BR-307 "Đã thu qua OTA"). Optional so older callers keep compiling.
   */
  paymentModel?: string;
}

/** stayInfo(): booking facts without personal data (C0/C1). Dates are business dates. */
export interface StayInfo {
  id: string;
  code: string;
  status: string;
  stayType: 'short' | 'long';
  channelGroup: string;
  paymentModel: string;
  folioId: string | null;
  parentReservationId: string | null;
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** Room of the segment covering the last night (current room in house); null while unassigned. */
  roomId: string | null;
  roomNo: string | null;
  adults: number;
  children6to11: number;
  childrenUnder6: number;
  externalContract: boolean;
}

/** amountDueFor(): createVietQr `check_in` / `check_out` (OpenAPI 0.3.7 – fields of that request). */
export interface AmountDueQuery {
  reservationId: string;
  purpose: 'check_in' | 'check_out';
  /** The caller (FD+ – SAL/CTV get 403). */
  actor: { userId: string; roles: readonly string[]; requestId?: string };
  /** check_in: like `previewCheckIn.checkinTime` – absent = the server clock (what B9 would charge now). */
  checkinTime?: LocalTime;
  /** check_in (B9a): the prior night is taken … */
  addPriorNight?: boolean;
  /** … at this rate (absent = its default rate). */
  priorNightRateVnd?: number;
  /** check_out: like `getCheckoutSummary.checkoutAt` – absent = the server clock. */
  checkoutAt?: Date;
  /** check_out after the last tier: the extra night at this rate (absent = `extraNightDefaultRateVnd`). */
  extraNightRateVnd?: number;
  /**
   * check_out (0.3.7 bổ sung 4, BR-416-06 – `createVietQr.lateFeeAsNight`): include the late charge of one night
   * when the night of the departure day is required and cannot be sold (`CheckoutSummary.lateFeeAsNightVnd`);
   * amountDueFor refuses it otherwise (422 NOT_ALLOWED, `field` = `lateFeeAsNight`).
   */
  lateFeeAsNight?: boolean;
}

export interface ReservationSalesPort {
  stayInfo(tx: Tx, reservationId: string): Promise<StayInfo | null>;
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
  /** Cap of a check-in / check-out VietQR (≥ 0) – see the file header. */
  amountDueFor(tx: Tx, q: AmountDueQuery): Promise<number>;
  /**
   * ARC 16.6 (f) D7 (`confirmPaymentReceived`): what a check-in / check-out VietQR may take NOW, from the
   * context stored at `createVietQr` – the same calculation as `amountDueFor`, never refused: the step's day,
   * options that no longer apply (B9a night taken since, extra night sold / unsellable since, a rate out of
   * bounds) are dropped; a stay past that step owes its folio balance. FD+ (SAL/CTV → 403) like amountDueFor.
   */
  amountDueNowFor(tx: Tx, q: AmountDueQuery): Promise<number>;
}
