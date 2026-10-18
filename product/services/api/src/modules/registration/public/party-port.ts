/**
 * Consumer port of the registration module towards the party of a booking (BUG-R2-033, US-043 AC3, EP06 2.2,
 * BR-951) – implemented by the front desk (`DocumentPartyPort`, written by BE-C for 0.3.7 nhóm D mục A, BE-A
 * reviews), handed to `RegistrationPartyLink.provide()` in FrontdeskModule.onModuleInit (no provider cycle
 * registration ↔ frontdesk, no ModuleRef – ARC-BE-S3-16). Not provided (worker, apps without the front desk)
 * → null: the document stays without a person.
 *
 * Called in the `addGuestDocument` transaction when the desk enters a document without `partyMemberId` – the
 * main guest's included: `isMain` never means "the booker" (OpenAPI 0.3.7 addGuestDocument, SEC s3 §7, SEC
 * FB-R2-SEC-BE-73 / ARC 16.22):
 * 1. a person of this booking – the booker or a member – whose profile carries the document key
 *    (`guest.id_doc_hmac` = `guestDocKey`, P05 profiles only), then the same normalised name + date of birth →
 *    that person (the booker: `memberId` = the booking id, its `party[]` id);
 * 2. else a profile OUTSIDE the booking with that document key (P05) → added as companion `unknown`;
 * 3. else (adult) a minimal profile "from the document" (`source = document`, name + nationality only) is
 *    created through guests/public/document-profile and added as companion `unknown` – also beyond the
 *    declared head count (`overCount` – the desk is warned, BR-110 fees are the desk's decision);
 * 4. a minor never gets a profile (rbac 9) → null when nothing matched.
 * A name + date of birth match OUTSIDE the booking is never linked: `possibleReturningGuest` (BR-952).
 * The clear date of birth is used in memory only (C3 – never stored outside the document, never logged).
 */
import { Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { LocalDate } from '../../../shared/time';

export interface DocumentPersonInput {
  reservationId: string;
  /** erd 4.4 v1 document key: `v1:` + keyedHash('guest_doc', guestDocKeyInput(...)) – never stored without P05. */
  guestDocKey: string;
  /** Name as printed on the document (normalise with guests/public/normalize for BR-951). */
  fullNameOnDoc: string;
  /** Clear date of birth of the document (C3 – matching only). */
  dateOfBirth: LocalDate | null;
  /** ISO 3166-1 alpha-3 of the document; `nationalityAlpha2` for a new profile (guest.nationality_code). */
  nationalityCode: string;
  nationalityAlpha2: string | null;
  isForeigner: boolean;
  isMinor: boolean;
  actor: { userId: string; requestId: string };
}

export interface DocumentPersonMatch {
  /** A `reservation_guest` id – or the booking id when the person is the booker (`via` booker_*). */
  memberId: string;
  guestId: string | null;
  /** How the person was found (audit only). */
  via:
    | 'booker_key'
    | 'booker_name_dob'
    | 'member_key'
    | 'member_name_dob'
    | 'profile_key'
    | 'new_profile';
  /** The person was added beyond the declared head count. */
  overCount: boolean;
  /** Name + date of birth match a profile outside the booking (BR-952 – the desk confirms). */
  possibleReturningGuest: boolean;
}

export interface RegistrationPartyPort {
  memberForDocument(tx: Tx, input: DocumentPersonInput): Promise<DocumentPersonMatch | null>;
}

/** Holder of BE-A's implementation (global export of RegistrationModule). */
@Injectable()
export class RegistrationPartyLink {
  private impl: RegistrationPartyPort | null = null;

  provide(impl: RegistrationPartyPort): void {
    if (this.impl && this.impl !== impl) throw new Error('registration party port provided twice');
    this.impl = impl;
  }

  memberForDocument(tx: Tx, input: DocumentPersonInput): Promise<DocumentPersonMatch | null> {
    return this.impl ? this.impl.memberForDocument(tx, input) : Promise.resolve(null);
  }
}
