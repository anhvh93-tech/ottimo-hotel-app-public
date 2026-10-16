/**
 * BUG-R2-033 (US-043 AC3, EP06 2.2, BR-951): the person a document of a NON-main guest belongs to, when the desk
 * did not choose `partyMemberId`. Implements BE-C's consumer port REGISTRATION_PARTY_PORT
 * (registration/public/party-port.ts), bound by FrontdeskModule; called in the addGuestDocument transaction.
 *
 * Order (identity first – BR-951 key order on a document: document number, then name + date of birth):
 * 1. a member of the booking whose profile matches (`guest.id_doc_hmac`, else normalised name + date of birth);
 * 2. a guest profile that matches the same way → added to the party as companion, relationship `unknown`,
 *    ONLY while the booking still has a free declared place in that age band (a person beyond the declared
 *    count changes occupancy and BR-110 fees – that stays the desk's `addPartyMember` with its decision);
 * 3. otherwise the ONE member that has no document yet;
 * 4. anything ambiguous (two candidates) or nothing → null: the document stays unlinked, the desk links it.
 * No CRM profile is ever created here (a profile needs a contact – guests module V-02; and never for a minor).
 * The clear date of birth is used for the comparison only (C3 – not stored, not logged, not audited).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { AuditService } from '../../audit/public/audit.service';
import { nameSearchKey } from '../../guests/public/normalize';
import { ParameterService } from '../../platform/public/parameter.service';
import type {
  DocumentPersonInput,
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
  has_document: boolean;
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
  ) {}

  async memberForDocument(tx: Tx, input: DocumentPersonInput): Promise<string | null> {
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
              g.date_of_birth::text AS date_of_birth,
              EXISTS (SELECT 1 FROM guest_document d
                       WHERE d.party_member_id = m.id AND d.purged_at IS NULL) AS has_document
         FROM reservation_guest m LEFT JOIN guest g ON g.id = m.guest_id
        WHERE m.reservation_id = $1 AND m.removed_at IS NULL
        ORDER BY m.created_at, m.id`,
      [row.id],
    );
    const nameKey = nameSearchKey(input.fullNameOnDoc);
    const sameByName = (n: string | null, dob: string | null) =>
      !!input.dateOfBirth && n === nameKey && dob === input.dateOfBirth;

    // 1. a member whose profile is this person
    const byDoc = members.filter((m) => m.id_doc_hmac === input.docNumberHmac);
    if (byDoc.length === 1) return (byDoc[0] as MemberRow).id;
    if (byDoc.length > 1) return null;
    const byName = members.filter((m) => sameByName(m.name_search, m.date_of_birth));
    if (byName.length === 1) return (byName[0] as MemberRow).id;
    if (byName.length > 1) return null;

    // 2. a guest profile that is this person
    const profile = await this.profile(tx, input, nameKey);
    if (profile === 'ambiguous') return null;
    if (profile) {
      if (profile === row.booker_guest_id) return null; // the booker has no party row (B-1 #1)
      const already = members.find((m) => m.guest_id === profile);
      if (already) return already.id;
      return this.addFromProfile(tx, input, row, members, profile);
    }

    // 3. the one member still without a document
    const undocumented = members.filter((m) => !m.has_document);
    return undocumented.length === 1 ? (undocumented[0] as MemberRow).id : null;
  }

  /** Profile matched by document blind index, else by normalised name + date of birth; null = none. */
  private async profile(
    tx: Tx,
    input: DocumentPersonInput,
    nameKey: string,
  ): Promise<string | 'ambiguous' | null> {
    const pick = (ids: Array<{ id: string }>) =>
      ids.length === 1 ? (ids[0] as { id: string }).id : ids.length > 1 ? 'ambiguous' : null;
    const { rows: byDoc } = await tx.query<{ id: string }>(
      `SELECT id FROM guest WHERE id_doc_hmac = $1 AND merged_into_id IS NULL AND anonymized_at IS NULL
        LIMIT 2`,
      [input.docNumberHmac],
    );
    const doc = pick(byDoc);
    if (doc) return doc;
    if (!input.dateOfBirth) return null;
    const { rows: byName } = await tx.query<{ id: string }>(
      `SELECT id FROM guest WHERE name_search = $1 AND date_of_birth = $2::date
          AND merged_into_id IS NULL AND anonymized_at IS NULL
        LIMIT 2`,
      [nameKey, input.dateOfBirth],
    );
    return pick(byName);
  }

  /** Companion `unknown` for a matched profile – only into a free declared place of its age band. */
  private async addFromProfile(
    tx: Tx,
    input: DocumentPersonInput,
    row: {
      id: string;
      code: string;
      status: string;
      adults: number;
      children_6_11: number;
      children_under_6: number;
      arrival_date: string;
    },
    members: readonly MemberRow[],
    guestId: string,
  ): Promise<string | null> {
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
    if (present[band] >= declared[band]) return null; // beyond the declared people: addPartyMember
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
      reason: 'document (BR-951 match)',
      ...(input.actor.requestId ? { requestId: input.actor.requestId } : {}),
    });
    return memberId;
  }
}
