/**
 * Guest profiles (erd 4.4, US-071…073). Organisation-level: one profile per person across properties
 * (C3 data stays on the property's registration). Identity keys normalised per BR-951; partial unique
 * indexes block duplicate phone/e-mail among live profiles (not merged, not anonymised).
 * The trigram index on name_search (US-073) is created in the custom migration (needs pg_trgm).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgTable,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';
import { organization } from './platform';

export const guest = pgTable(
  'guest',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    code: text('code').notNull(),
    fullName: text('full_name').notNull(),
    // Upper-case, diacritics removed (BR-951) – searched with/without accents (US-073).
    nameSearch: text('name_search').notNull(),
    phoneE164: text('phone_e164'),
    emailNorm: text('email_norm'),
    messagingHandles: jsonb('messaging_handles'),
    dateOfBirth: date('date_of_birth', { mode: 'string' }),
    gender: text('gender'),
    nationalityCode: text('nationality_code'),
    isForeigner: boolean('is_foreigner').notNull().default(false),
    preferredLocale: text('preferred_locale'),
    preferredContact: text('preferred_contact'),
    companyName: text('company_name'),
    taxCode: text('tax_code'),
    tags: text('tags').array(),
    serviceNotes: text('service_notes').array(),
    freeNote: text('free_note'),
    idDocLast4: text('id_doc_last4'),
    idDocHmac: text('id_doc_hmac'),
    crmConsent: text('crm_consent').notNull().default('not_asked'),
    mergedIntoId: uuid('merged_into_id'),
    anonymizedAt: instant('anonymized_at'),
    // erd 4.4 0.3.4 (ARC Q7): set when a create/edit found a BR-952 look-alike (on both profiles);
    // GuestSummary.possibleDuplicate reads it (no similarity per list row); cleared by merge (R3).
    possibleDuplicateAt: instant('possible_duplicate_at'),
    // 0055 (erd 4.4 0.3.7, draft A.2, SEC s3 7.4): how the profile was created. `document` = minimal profile
    // made from a declared ID document (companion) – created only through guests/public/document-profile.ts.
    // `guest_app`, `import` are R3. Rows without phone and e-mail before 0.3.7 were backfilled to `ota`.
    source: text('source').notNull().default('desk'),
    // 0055 (erd 4.4, SEC 7.2): last check-out of a stay of this person – retention anchor of `document`
    // profiles (T05, job J25); written by BE-A through touchLastStay() in B18/B16.
    lastStayCheckoutAt: instant('last_stay_checkout_at'),
    ...auditColumns(),
  },
  (t) => [
    unique('guest_org_id_key').on(t.organizationId, t.id),
    unique('guest_org_code_key').on(t.organizationId, t.code),
    uniqueIndex('guest_phone_live_uk')
      .on(t.organizationId, t.phoneE164)
      .where(sql`${t.mergedIntoId} IS NULL AND ${t.anonymizedAt} IS NULL`),
    uniqueIndex('guest_email_live_uk')
      .on(t.organizationId, t.emailNorm)
      .where(sql`${t.mergedIntoId} IS NULL AND ${t.anonymizedAt} IS NULL`),
    index('guest_created_by_idx').on(t.organizationId, t.createdBy),
    index('guest_dob_idx').on(t.organizationId, t.dateOfBirth),
    check(
      'guest_gender_check',
      sql`${t.gender} IS NULL OR ${t.gender} IN ('male', 'female', 'other')`,
    ),
    check(
      'guest_locale_check',
      sql`${t.preferredLocale} IS NULL OR ${t.preferredLocale} IN ('vi', 'en', 'ru')`,
    ),
    check(
      'guest_contact_check',
      sql`${t.preferredContact} IS NULL OR ${t.preferredContact} IN ('phone', 'zalo', 'whatsapp', 'kakaotalk', 'email')`,
    ),
    check('guest_crm_consent_check', sql`${t.crmConsent} IN ('not_asked', 'granted', 'refused')`),
    check(
      'guest_nationality_check',
      sql`${t.nationalityCode} IS NULL OR ${t.nationalityCode} ~ '^[A-Z]{2}$'`,
    ),
    check(
      'guest_phone_check',
      sql`${t.phoneE164} IS NULL OR ${t.phoneE164} ~ '^[1-9][0-9]{7,14}$'`,
    ),
    // 0055 (erd 4.4 0.3.7) – profiles made from documents (SEC s3 mục 7, ARC draft A.2).
    check(
      'guest_source_check',
      sql`${t.source} IN ('desk', 'ota', 'document', 'guest_app', 'import')`,
    ),
    // v1 blind index of the ID number (SEC s3 7.3): 'v1:' + 64 hex.
    check(
      'guest_id_doc_hmac_format_check',
      sql`${t.idDocHmac} IS NULL OR ${t.idDocHmac} ~ '^v1:[0-9a-f]{64}$'`,
    ),
    // CHECK 1: a desk profile always has a contact (anonymised/merged profiles excepted).
    check(
      'guest_contact_source_check',
      sql`${t.source} <> 'desk' OR ${t.phoneE164} IS NOT NULL OR ${t.emailNorm} IS NOT NULL OR ${t.anonymizedAt} IS NOT NULL OR ${t.mergedIntoId} IS NOT NULL`,
    ),
    // CHECK 2 (SEC F03 at DB level): the ID blind index exists only with the P05 consent.
    check(
      'guest_id_doc_hmac_consent_check',
      sql`${t.idDocHmac} IS NULL OR ${t.crmConsent} = 'granted'`,
    ),
    // 0070 (SEC FB-R2-SEC-BE-78 (a), with BE-73): the last 4 digits of the ID likewise only with the P05 consent.
    check(
      'guest_id_doc_last4_consent_check',
      sql`${t.idDocLast4} IS NULL OR ${t.crmConsent} = 'granted'`,
    ),
    // CHECK 3 (last safety net, SEC 7.1): a `document` profile without P05 holds no extra personal data.
    check(
      'guest_document_minimal_check',
      sql`${t.source} <> 'document' OR ${t.crmConsent} = 'granted' OR (${t.dateOfBirth} IS NULL AND ${t.gender} IS NULL AND ${t.idDocLast4} IS NULL AND ${t.idDocHmac} IS NULL AND ${t.freeNote} IS NULL AND coalesce(cardinality(${t.tags}), 0) = 0 AND coalesce(cardinality(${t.serviceNotes}), 0) = 0)`,
    ),
    uniqueIndex('guest_id_doc_hmac_uk')
      .on(t.organizationId, t.idDocHmac)
      .where(
        sql`${t.idDocHmac} IS NOT NULL AND ${t.mergedIntoId} IS NULL AND ${t.anonymizedAt} IS NULL`,
      ),
    index('guest_document_profile_retention_idx')
      .on(t.organizationId, t.lastStayCheckoutAt)
      .where(
        sql`${t.source} = 'document' AND ${t.crmConsent} <> 'granted' AND ${t.anonymizedAt} IS NULL`,
      ),
  ],
);
