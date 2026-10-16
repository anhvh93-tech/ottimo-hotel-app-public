/**
 * Consumer port of the registration module towards the party of a booking (BUG-R2-033, US-043 AC3, EP06 2.2,
 * BR-951) – implemented by BE-A (frontdesk `DocumentPartyPort`), handed to `RegistrationPartyLink.provide()`
 * in FrontdeskModule.onModuleInit (same pattern as ReservationHooks.provideRegistrationSummary – no provider
 * cycle registration ↔ frontdesk, no ModuleRef – ARC-BE-S3-16). Not provided (worker, apps without the
 * front desk) → null: the document simply stays without a person (staff link it with `partyMemberId`).
 *
 * Called in the `addGuestDocument` transaction when the desk enters a document of a person OTHER than the
 * main guest without `partyMemberId`. The provider:
 * 1. returns the party member of this booking the document belongs to: an existing member, or a member it
 *    adds for the guest profile matched by BR-951 (document number blind index → name + date of birth;
 *    phone/e-mail are not on a document), or a new member with relationship `unknown`;
 * 2. never creates a CRM profile for a person under `minor_data_age_threshold` (`isMinor`, rbac 9);
 * 3. keeps the clear date of birth in memory only (C3 – never stored outside the document, never logged);
 * 4. returns null when it cannot decide (two candidates) – no guess.
 * The returned id must be a member of `reservationId` (FK guest_document → reservation_guest, 0053).
 */
import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export interface DocumentPersonInput {
  reservationId: string;
  /** CryptoService.blindIndex of the normalised document number – the same key as `guest.id_doc_hmac`. */
  docNumberHmac: string;
  /** Name as printed on the document (normalise with guests/public/normalize for BR-951). */
  fullNameOnDoc: string;
  /** Clear date of birth of the document (C3 – matching only). */
  dateOfBirth: LocalDate | null;
  /** ISO 3166-1 alpha-3. */
  nationalityCode: string;
  isMinor: boolean;
  actor: { userId: string; requestId: string };
}

export interface RegistrationPartyPort {
  memberForDocument(tx: Tx, input: DocumentPersonInput): Promise<string | null>;
}

/** Holder of BE-A's implementation (global export of RegistrationModule). */
@Injectable()
export class RegistrationPartyLink {
  private impl: RegistrationPartyPort | null = null;

  provide(impl: RegistrationPartyPort): void {
    if (this.impl && this.impl !== impl) throw new Error('registration party port provided twice');
    this.impl = impl;
  }

  memberForDocument(tx: Tx, input: DocumentPersonInput): Promise<string | null> {
    return this.impl ? this.impl.memberForDocument(tx, input) : Promise.resolve(null);
  }
}
