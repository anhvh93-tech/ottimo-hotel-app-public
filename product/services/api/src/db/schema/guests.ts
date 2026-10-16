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
  ],
);
