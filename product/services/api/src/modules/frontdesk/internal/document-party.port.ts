/**
 * BUG-R2-033 / OpenAPI 0.3.7 nhóm D mục A (S4-11 – BE-C, BE-A reviews; US-043 AC3, EP06 2.2, BR-951, SEC s3
 * mục 7): the person a document of a NON-main guest belongs to, when the desk did not choose `partyMemberId`.
 * Implements the registration consumer port (registration/public/party-port.ts), bound by FrontdeskModule;
 * called in the addGuestDocument transaction. Order:
 * 1. a member of the booking whose profile carries the document key (`guest.id_doc_hmac`, P05 profiles only) or
 *    the same normalised name + date of birth → that member;
 * 2. a profile OUTSIDE the booking with that document key (P05) → added as companion `unknown`;
 * 3. an adult matched by nothing → a minimal profile "from the document" (guests/public/document-profile:
 *    `source = document`, name as printed + nationality) added as companion `unknown`;
 * steps 2–3 add the person even beyond the declared head count (`overCount` – the desk is warned; occupancy and
 * BR-110 fees stay the desk's decision through updateReservation / addPartyMember). A minor never gets a
 * profile (rbac 9) → null. A name + date of birth match OUTSIDE the booking is never linked automatically –
 * `possibleReturningGuest` (BR-952). The clear date of birth is used only in memory (C3 – not stored, not logged).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { AuditService } from '../../audit/public/audit.service';
import { DocumentProfileService } from '../../guests/public/document-profile.service';
import { nameSearchKey } from '../../guests/public/normalize';
import { ParameterService } from '../../platform/public/parameter.service';
import type {
  DocumentPersonInput,
  DocumentPersonMatch,
  RegistrationPartyPort,
} from '../../registration/public/party-port';

type Band = 'adult' | 'child_6_11' | 'child_under_6';

interface MemberRow {
  id: string;
  guest_id: string | null;
  price_age_band: Band;
  id_doc_hmac: string | null;
  name_search: string | null;
  date_of_birth: string | null;
}

/** Full years between a date of birth and a day (both YYYY-MM-DD). */
function ageOn(dob: string, day: string): number {
  const [y1, m1, d1] = dob.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = day.split('-').map(Number) as [number, number, number];
  return y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
}

@Injectable()
export class DocumentPartyPort implements RegistrationPartyPort {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(DocumentProfileService) private readonly profiles: DocumentProfileService,
  ) {}

  async memberForDocument(tx: Tx, input: DocumentPersonInput): Promise<DocumentPersonMatch | null> {
    const { rows: res } = await tx.query<{
      id: string;
      code: string;
      status: string;
      booker_guest_id: string | null;
      adults: number;
      children_6_11: number;
      children_under_6: number;
      arrival_date: string;
    }>(
      `SELECT id, code, status, booker_guest_id, adults, children_6_11, children_under_6,
              arrival_date::text AS arrival_date
         FROM reservation WHERE id = $1 FOR UPDATE`,
      [input.reservationId],
    );
    const row = res[0];
    if (!row || !['hold', 'confirmed', 'in_house'].includes(row.status)) return null;
    const { rows: members } = await tx.query<MemberRow>(
      `SELECT m.id, m.guest_id, m.price_age_band, g.id_doc_hmac, g.name_search,
              g.date_of_birth::text AS date_of_birth
         FROM reservation_guest m LEFT JOIN guest g ON g.id = m.guest_id
        WHERE m.reservation_id = $1 AND m.removed_at IS NULL
        ORDER BY m.created_at, m.id`,
      [row.id],
    );
    const inBooking = [
      ...(row.booker_guest_id ? [row.booker_guest_id] : []),
      ...members.map((m) => m.guest_id).filter((g): g is string => !!g),
    ];
    const lookAlike = async (exclude: readonly string[]) =>
      (await this.profiles.lookAlikes(tx, input.fullNameOnDoc, input.dateOfBirth, exclude)).length >
      0;
    const found = (m: MemberRow, via: DocumentPersonMatch['via']): Promise<DocumentPersonMatch> =>
      lookAlike(inBooking).then((possibleReturningGuest) => ({
        memberId: m.id,
        guestId: m.guest_id,
        via,
        overCount: false,
        possibleReturningGuest,
      }));
    // 1. a member of the booking – document key (P05 profiles) first, then name + date of birth.
    const byKey = members.filter(
      (m) => m.id_doc_hmac !== null && m.id_doc_hmac === input.guestDocKey,
    );
    if (byKey.length === 1) return found(byKey[0] as MemberRow, 'member_key');
    const name = nameSearchKey(input.fullNameOnDoc);
    const byName = input.dateOfBirth
      ? members.filter((m) => m.name_search === name && m.date_of_birth === input.dateOfBirth)
      : [];
    if (byKey.length === 0 && byName.length === 1)
      return found(byName[0] as MemberRow, 'member_name_dob');
    if (byKey.length > 1 || byName.length > 1) return null; // ambiguous: the desk picks
    // 2. a P05 profile outside the booking with this document key.
    const profiles = await this.profiles.profilesByDocKey(tx, input.guestDocKey);
    if (profiles.length === 1 && profiles[0] !== row.booker_guest_id) {
      const profile = profiles[0] as string;
      const already = members.find((m) => m.guest_id === profile);
      if (already) return found(already, 'member_key');
      return this.addCompanion(tx, input, row, members, profile, 'profile_key', inBooking);
    }
    // 3. nothing matched: a minimal profile from the document (adults only – rbac 9).
    if (input.isMinor) return null;
    const created = await this.profiles.createDocumentProfile(tx, {
      fullNameOnDoc: input.fullNameOnDoc,
      nationalityAlpha2: input.nationalityAlpha2,
      isForeigner: input.isForeigner,
      createdBy: input.actor.userId,
      now: this.clock.now(),
      requestId: input.actor.requestId,
    });
    return this.addCompanion(tx, input, row, members, created.id, 'new_profile', inBooking);
  }

  /** Companion `unknown` for the profile – also beyond the declared head count (`overCount`). */
  private async addCompanion(
    tx: Tx,
    input: DocumentPersonInput,
    row: {
      id: string;
      code: string;
      adults: number;
      children_6_11: number;
      children_under_6: number;
      arrival_date: string;
    },
    members: readonly MemberRow[],
    guestId: string,
    via: DocumentPersonMatch['via'],
    inBooking: readonly string[],
  ): Promise<DocumentPersonMatch> {
    let band: Band = 'adult';
    if (input.dateOfBirth) {
      const age = ageOn(input.dateOfBirth, row.arrival_date);
      const adultFrom = await this.params.get<number>(tx, 'adult_from_age', row.arrival_date);
      const freeUnder = await this.params.get<number>(tx, 'child_free_under_age', row.arrival_date);
      band = age >= adultFrom ? 'adult' : age >= freeUnder ? 'child_6_11' : 'child_under_6';
    }
    const declared: Record<Band, number> = {
      adult: row.adults,
      child_6_11: row.children_6_11,
      child_under_6: row.children_under_6,
    };
    const present: Record<Band, number> = { adult: 1, child_6_11: 0, child_under_6: 0 };
    for (const m of members) present[m.price_age_band] += 1;
    const overCount = present[band] >= declared[band];
    const memberId = uuidv7();
    const at = this.clock.now();
    await tx.query(
      `INSERT INTO reservation_guest (id, organization_id, property_id, reservation_id, guest_id, role,
         relationship, is_minor_data, price_age_band, effective_from, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, 'companion', 'unknown', $6, $7, NULL, $8, $9)`,
      [
        memberId,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        row.id,
        guestId,
        input.isMinor,
        band,
        at,
        input.actor.userId,
      ],
    );
    await tx.query(
      `UPDATE reservation SET party_version = party_version + 1, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [row.id, at],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'reservation.party_member_added',
      entityType: 'reservation',
      entityId: row.id,
      entityCode: row.code,
      after: { partyRole: 'companion', priceAgeBand: band },
      reason:
        via === 'new_profile'
          ? `document (no match – profile from document${overCount ? ', over the declared count' : ''})`
          : `document (BR-951 key match${overCount ? ', over the declared count' : ''})`,
      ...(input.actor.requestId ? { requestId: input.actor.requestId } : {}),
    });
    const possibleReturningGuest =
      (
        await this.profiles.lookAlikes(tx, input.fullNameOnDoc, input.dateOfBirth, [
          ...inBooking,
          guestId,
        ])
      ).length > 0;
    return { memberId, guestId, via, overCount, possibleReturningGuest };
  }
}
