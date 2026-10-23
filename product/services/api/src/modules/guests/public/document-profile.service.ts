/**
 * Guest profiles "from documents" (OpenAPI 0.3.7 nhóm D mục A – S4-11, S4-32; SEC s3 mục 7; erd 4.4) – written
 * by BE-C for the registration / front-desk flows, reviewed by BE-B (owner of the guests module):
 * - `createDocumentProfile`: the minimal profile of a companion whose document matched nobody (`source =
 *   document`): code, name as printed, nationality (alpha-2) + foreigner flag, `crm_consent = not_asked` –
 *   no contact, date of birth, gender, document key, tag or note (SEC 7.1; DB CHECK 3 is the last net);
 * - `profilesByDocKey`: live profiles carrying the document key `id_doc_hmac` (only P05 profiles have one);
 * - `grantCrmConsent` / `withdrawCrmConsent` (BR-955 – P05 recorded at the desk): granted → the profile may keep
 *   `id_doc_hmac` (v1 key) + `id_doc_last4` (S4-32 [GIẢ ĐỊNH ARC – SEC chốt]); withdrawn → both NULL at once
 *   (SEC F03, DB CHECK 2). A key already held by another live profile is not copied (the duplicate is a
 *   merge for R3, never two owners of one document);
 * - `touchLastStay`: `last_stay_checkout_at` (B18/B16 – BE-A calls it in the checkout transaction; J25 also
 *   catches it up from checked-out stays, so the retention never depends on that call alone);
 * - `anonymizeDue` (J25 `guest.document_profile_anonymize`, T05): `document` profiles without P05 whose last
 *   check-out is `document_profile_retention_months` old → name replaced by an anonymous code, `anonymized_at`,
 *   `purge_journal` (`anonymize`, T05). Code, nationality and the foreigner flag stay (statistics).
 * The document key itself is computed by the caller (registration – it holds the number in clear, C3) with
 * `CryptoService.keyedHash('guest_doc', guestDocKeyInput(...))` and prefixed `v1:` (erd 4.4).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { pgCode } from '../../../db/database';
import { AuditService } from '../../audit/public/audit.service';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { nameSearchKey } from './normalize';

/** erd 4.4 v1: `<kind>|<issuing country alpha-3>|<number upper-cased, without spaces . - />`. */
export function guestDocKeyInput(
  docType: string,
  issuingCountryAlpha3: string | null,
  number: string,
): string {
  const kind =
    docType === 'passport'
      ? 'passport'
      : docType === 'cccd' || docType === 'child_personal_id'
        ? 'vn_id'
        : 'other';
  const country = (issuingCountryAlpha3 ?? (kind === 'vn_id' ? 'VNM' : '')).toUpperCase();
  return `${kind}|${country}|${number.toUpperCase().replace(/[\s.\-/]/g, '')}`;
}

export const GUEST_DOC_KEY = /^v1:[0-9a-f]{64}$/;

@Injectable()
export class DocumentProfileService {
  constructor(
    @Inject(DocNumberService) private readonly docs: DocNumberService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async createDocumentProfile(
    tx: Tx,
    input: {
      fullNameOnDoc: string;
      nationalityAlpha2: string | null;
      isForeigner: boolean;
      createdBy: string | null;
      now: Date;
      requestId?: string;
    },
  ): Promise<{ id: string; code: string }> {
    const id = uuidv7();
    const code = await this.docs.allocate(tx, 'guest');
    await tx.query(
      `INSERT INTO guest (id, organization_id, code, full_name, name_search, nationality_code, is_foreigner,
         source, crm_consent, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'document', 'not_asked', $8, $9, $8)`,
      [
        id,
        tx.ctx.organizationId,
        code,
        input.fullNameOnDoc,
        nameSearchKey(input.fullNameOnDoc),
        input.nationalityAlpha2,
        input.isForeigner,
        input.now,
        input.createdBy,
      ],
    );
    await this.audit.record(tx, {
      category: 'data',
      action: 'guest.created',
      entityType: 'guest',
      entityId: id,
      after: { code, source: 'document' },
      ...(input.requestId ? { requestId: input.requestId } : {}),
    });
    return { id, code };
  }

  async profilesByDocKey(tx: Tx, key: string): Promise<string[]> {
    if (!GUEST_DOC_KEY.test(key)) return [];
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM guest WHERE id_doc_hmac = $1 AND merged_into_id IS NULL AND anonymized_at IS NULL
        LIMIT 2`,
      [key],
    );
    return rows.map((r) => r.id);
  }

  /** Live profiles (outside `exclude`) with the same normalised name and date of birth (BR-952). */
  async lookAlikes(
    tx: Tx,
    fullName: string,
    dateOfBirth: string | null,
    exclude: readonly string[],
  ): Promise<string[]> {
    if (!dateOfBirth) return [];
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM guest WHERE name_search = $1 AND date_of_birth = $2::date AND merged_into_id IS NULL
          AND anonymized_at IS NULL AND NOT (id = ANY($3::uuid[])) LIMIT 2`,
      [nameSearchKey(fullName), dateOfBirth, [...exclude]],
    );
    return rows.map((r) => r.id);
  }

  /** Writes the document key + last 4 of a P05 profile (no-op without P05 or when another profile holds it). */
  async writeDocKey(tx: Tx, guestId: string, key: string, last4: string): Promise<boolean> {
    if (!GUEST_DOC_KEY.test(key)) throw new Error('guest document key must be v1:<64 hex>');
    await tx.query('SAVEPOINT guest_doc_key');
    try {
      const r = await tx.query(
        `UPDATE guest SET id_doc_hmac = $2, id_doc_last4 = $3, updated_at = updated_at
          WHERE id = $1 AND crm_consent = 'granted' AND merged_into_id IS NULL AND anonymized_at IS NULL`,
        [guestId, key, last4],
      );
      await tx.query('RELEASE SAVEPOINT guest_doc_key');
      return (r.rowCount ?? 0) > 0;
    } catch (err) {
      await tx.query('ROLLBACK TO SAVEPOINT guest_doc_key');
      if (pgCode(err) === '23505') return false; // another live profile holds this document (merge – R3)
      throw err;
    }
  }

  /** BR-955 P05 granted at the desk: CRM fields open, the document key of this stay is kept. */
  async grantCrmConsent(
    tx: Tx,
    guestId: string,
    doc: { key: string; last4: string } | null,
    now: Date,
  ): Promise<void> {
    await tx.query(
      `UPDATE guest SET crm_consent = 'granted', updated_at = $2, version = version + 1 WHERE id = $1`,
      [guestId, now],
    );
    if (doc) await this.writeDocKey(tx, guestId, doc.key, doc.last4);
  }

  /** P05 refused / withdrawn: the document key and last 4 go in the same transaction (SEC F03). */
  async withdrawCrmConsent(tx: Tx, guestId: string, now: Date): Promise<void> {
    await tx.query(
      `UPDATE guest SET crm_consent = 'refused', id_doc_hmac = NULL, id_doc_last4 = NULL, updated_at = $2,
              version = version + 1
        WHERE id = $1`,
      [guestId, now],
    );
  }

  async touchLastStay(tx: Tx, guestIds: readonly string[], at: Date): Promise<void> {
    if (guestIds.length === 0) return;
    await tx.query(
      `UPDATE guest SET last_stay_checkout_at = GREATEST(COALESCE(last_stay_checkout_at, $2), $2)
        WHERE id = ANY($1::uuid[])`,
      [[...guestIds], at],
    );
  }

  /**
   * J25 (T05): anonymise `document` profiles without P05 past the retention after their anchor.
   * - Anchor (SEC FB-R2-SEC-BE-75): the latest end of ANY stay of the person in the organisation – check-out,
   *   cancellation, no-show, removal from the party – or `last_stay_checkout_at` (touchLastStay), else the
   *   profile's `created_at` (a profile on no stay at all). A stay still open (hold / confirmed / in house, not
   *   removed) in ANY property of the organisation keeps the profile. Both come from the SECURITY DEFINER
   *   function `guest_stay_retention` (migration 0080: id in, one boolean + one instant out, current
   *   organisation only) – J25 runs per property under property RLS and could not see the other properties.
   * - Anonymised = nothing left that identifies the person (SEC FB-R2-SEC-BE-74 (b)): an anonymous name, and
   *   every field outside SEC 7.1 NULL (contact, messaging, company, tax code, notes, tags, date of birth,
   *   gender, locale, document key). Code, nationality and the foreigner flag stay (statistics). The phone /
   *   e-mail unique indexes ignore anonymised rows, and those rows now hold none – a returning guest with the
   *   same phone gets one live profile.
   * Audit / purge_journal: ids and counts only.
   */
  async anonymizeDue(
    tx: Tx,
    now: Date,
    months: number,
    limit = 200,
  ): Promise<{ anonymized: number }> {
    const { rows } = await tx.query<{ id: string; code: string }>(
      `SELECT g.id, g.code FROM guest g
         CROSS JOIN LATERAL guest_stay_retention(g.id) s
        WHERE g.source = 'document' AND g.crm_consent <> 'granted' AND g.anonymized_at IS NULL
          AND g.merged_into_id IS NULL
          AND NOT s.has_open
          AND COALESCE(GREATEST(g.last_stay_checkout_at, s.last_end), g.created_at)
              + make_interval(months => $2) <= $1
        ORDER BY g.created_at LIMIT $3 FOR UPDATE OF g SKIP LOCKED`,
      [now, months, limit],
    );
    for (const g of rows) {
      await tx.query(
        `UPDATE guest SET full_name = $2, name_search = $3, anonymized_at = $4, updated_at = $4,
                phone_e164 = NULL, email_norm = NULL, messaging_handles = NULL, date_of_birth = NULL,
                gender = NULL, preferred_locale = NULL, preferred_contact = NULL, company_name = NULL,
                tax_code = NULL, tags = NULL, service_notes = NULL, free_note = NULL, id_doc_last4 = NULL,
                id_doc_hmac = NULL, version = version + 1
          WHERE id = $1`,
        [g.id, `ANON ${g.code}`, nameSearchKey(`ANON ${g.code}`), now],
      );
      await tx.query(
        `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action,
           purged_at)
         VALUES ($1, $2, 'guest', $3, 'T05', 'anonymize', $4)`,
        [tx.ctx.organizationId, tx.ctx.propertyId, g.id, now],
      );
    }
    return { anonymized: rows.length };
  }

  /** SEC FB-R2-SEC-BE-79 (1): the document key + last 4 leave a profile they do not belong to (same key only). */
  async removeDocKey(tx: Tx, guestId: string, key: string): Promise<boolean> {
    const r = await tx.query(
      `UPDATE guest SET id_doc_hmac = NULL, id_doc_last4 = NULL, updated_at = updated_at
        WHERE id = $1 AND id_doc_hmac = $2`,
      [guestId, key],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /**
   * SEC FB-R2-SEC-BE-79 (2): put back the P05 decision a profile had before a document of ANOTHER person gave it
   * one. `granted` restores the consent only (the key comes back with that person's own next document);
   * `refused` / `not_asked` also drop the key + last 4, and a `document` profile loses what only P05 allowed
   * (DB CHECK guest_document_minimal_check).
   */
  async restoreCrmConsent(
    tx: Tx,
    guestId: string,
    decision: 'granted' | 'refused' | 'not_asked',
    now: Date,
  ): Promise<void> {
    if (decision === 'granted') {
      await tx.query(
        `UPDATE guest SET crm_consent = 'granted', updated_at = $2, version = version + 1 WHERE id = $1`,
        [guestId, now],
      );
      return;
    }
    await tx.query(
      `UPDATE guest SET crm_consent = $3, id_doc_hmac = NULL, id_doc_last4 = NULL,
              date_of_birth = CASE WHEN source = 'document' THEN NULL ELSE date_of_birth END,
              gender = CASE WHEN source = 'document' THEN NULL ELSE gender END,
              free_note = CASE WHEN source = 'document' THEN NULL ELSE free_note END,
              tags = CASE WHEN source = 'document' THEN NULL ELSE tags END,
              service_notes = CASE WHEN source = 'document' THEN NULL ELSE service_notes END,
              updated_at = $2, version = version + 1
        WHERE id = $1`,
      [guestId, now, decision],
    );
  }
}
