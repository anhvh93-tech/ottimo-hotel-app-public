/**
 * Ports the front desk (BE-A) calls in ITS transaction, implemented by other Sprint 3 zones (ARC s3-contract
 * 4.3). Until the owner binds its implementation (a global provider under the token), the frontdesk module
 * uses the default below – chosen to FAIL CLOSED where safety matters:
 *
 * - FD_REGISTRATION_PORT (BE-C registration/public/registration.port.ts): document conditions of B9 and the
 *   registration side effects of B9/B13/B14/B16/B17/B18/US-022. Default: `mainGuestDocument = false` (check-in
 *   blocked, never "documents OK" without the registration module); hooks are no-ops.
 * - FD_GUEST_ACCESS_PORT (BE-C guest-portal/public/guest-access.port.ts): `revokeAllForReservation` (B-13).
 *   Default: no-op (R2 has no guest link before BE-C ships – nothing to revoke).
 * - FD_CHILD_DATA_PORT (BE-C crypto/public/crypto.service.ts via an adapter): C3 child data of the party (D09).
 *   Default: refuses (503) – a child's name/birth year is NEVER stored in clear.
 * - FD_MINIBAR_PORT (BE-B inventory): blocker `minibar_not_checked` of B18 + refill task. Default: not
 *   required (no minibar items configured before the inventory module).
 * Money goes through FolioService/PaymentService (BE-B public FolioPort, already on main).
 */
import type { Tx } from '../../../db/database';

export const FD_REGISTRATION_PORT = Symbol('FD_REGISTRATION_PORT');
export const FD_GUEST_ACCESS_PORT = Symbol('FD_GUEST_ACCESS_PORT');
export const FD_CHILD_DATA_PORT = Symbol('FD_CHILD_DATA_PORT');
export const FD_MINIBAR_PORT = Symbol('FD_MINIBAR_PORT');

/** BR-402 (3), BR-613 – what B9 needs from the registration (EP06 2–5). */
export interface CheckinDocumentStatus {
  /** Registration ≥ `partial` AND a document of the booker (`isMain`). */
  mainGuestDocument: boolean;
  /** `Registration.blocksDoorCode` (BR-613 c) – FDL+ may override with a reason. */
  documentCheckBlock: boolean;
  pendingOnlineCheckin: boolean;
  visaExpiresBeforeDeparture: boolean;
  passportExpiresDuringStay: boolean;
}

/** `removePartyMember?guestUploadPersonIndex=` (0.3.7, S4-39): a guest-link slot ≥ 2, or `none`. */
export type GuestUploadChoice = number | 'none';

export interface FrontdeskRegistrationPort {
  checkinDocumentStatus(tx: Tx, reservationId: string): Promise<CheckinDocumentStatus>;
  /** BR-602/603 deadline if the guest checked in at `at` (preview) – null when not computable. */
  deadlinePreview(tx: Tx, reservationId: string, at: Date): Promise<Date | null>;
  /** B9: deadline starts at actualCheckinAt (BR-602/603, G-9). Returns the deadline (null = none). */
  onCheckedIn(tx: Tx, reservationId: string, actualCheckinAt: Date): Promise<Date | null>;
  /** B17: deadline no longer counts (registration keeps its status). */
  onCheckInUndone(tx: Tx, reservationId: string): Promise<void>;
  /** B13 / B16 / B18: declared departure changed → `needs_update` for a foreign registration (BR-604). */
  onDepartureChanged(tx: Tx, reservationId: string, newDeparture: string): Promise<void>;
  /** B14: note of the room change on the registration (no new declaration – BR-424). */
  onRoomChanged(tx: Tx, reservationId: string, newRoomNo: string): Promise<void>;
  /** US-022: a person added/removed – `needs_update` when already sent (K9). */
  onPartyChanged(tx: Tx, reservationId: string): Promise<void>;
  /**
   * A-38: documents/images of the removed person are destroyed in the same transaction (C3).
   * 0.3.7 (S4-39, SEC-BE-53 main approach): `guestUpload` = the desk's answer to "which guest-link slot
   * ("Khách n", n ≥ 2) was this person's" – a slot number, or `none`; `undefined` = not sent. The port
   * answers 422 `REQUIRED` (+ `personIndexes[]`) when it is needed and missing; the whole removal rolls back.
   */
  onPartyMemberRemoved(
    tx: Tx,
    reservationId: string,
    memberId: string,
    guestUpload?: GuestUploadChoice,
  ): Promise<void>;
  /** B18 / B16: image retention counts from actualCheckoutAt (G-17). */
  onCheckedOut(tx: Tx, reservationId: string, actualCheckoutAt: Date): Promise<void>;
  /** B10 / B11 / relocation: registration voided (K11). */
  onReservationVoided(tx: Tx, reservationId: string): Promise<void>;
  /**
   * BUG-R2-037 (BR-605, US-050 AC2): earliest visa / temporary-residence validity (YYYY-MM-DD) of the foreign
   * documents of the booking; null = none known. Used only to compare with a new departure (B13).
   */
  earliestVisaValidUntil(tx: Tx, reservationId: string): Promise<string | null>;
}

export interface FrontdeskGuestAccessPort {
  /** B-13 / SEC G4: every guest link and session of the booking revoked in the same transaction. */
  revokeAllForReservation(
    tx: Tx,
    reservationId: string,
    reason?: 'cancelled' | 'no_show' | 'relocated' | 'revoked',
  ): Promise<number>;
}

export interface EncryptedChildData {
  nameEnc: Buffer;
  birthYearEnc: Buffer;
  /** Keyed hash of the normalised name + birth year – duplicate detection without decrypting (US-022 AC3). */
  nameHmac: string;
  dataKeyId: string;
}

export interface FrontdeskChildDataPort {
  /** Encrypt a child's name + birth year with a DEK of its own (purpose `child_data`, SEC B1). */
  encryptChild(
    tx: Tx,
    input: { reservationId: string; memberId: string; name: string; birthYear: number },
  ): Promise<EncryptedChildData>;
  /** A-38 / T03: destroy the DEK of a removed child row (crypto-shredding). */
  destroy(tx: Tx, dataKeyId: string): Promise<void>;
}

export interface MinibarCheckoutStatus {
  /** The room has chargeable minibar items (BR-701 standard). */
  required: boolean;
  /** A `checkout` count exists for this booking and room (latest, not replaced). */
  checked: boolean;
}

export interface FrontdeskMinibarPort {
  checkoutStatus(tx: Tx, reservationId: string, roomId: string): Promise<MinibarCheckoutStatus>;
  /** B18: refill task when the checkout count used items – returns the task id (createdTaskIds). */
  onCheckedOut(tx: Tx, reservationId: string, roomId: string): Promise<string | null>;
  /**
   * 0.3.7 bổ sung 4 (ARC 16.2 R9, BUG-R2-136): the minibars of the stay (every room it lived in – the old room
   * before a B14 included) with a chargeable item and no `checkout` count yet – `CheckoutSummary.
   * minibarUncheckedRooms` and the B18 blocker. Optional while BE-B wires it: absent → the desk asks
   * `checkoutStatus` room by room.
   */
  uncheckedRooms?(
    tx: Tx,
    reservationId: string,
  ): Promise<Array<{ roomId: string; roomNo: string }>>;
}
