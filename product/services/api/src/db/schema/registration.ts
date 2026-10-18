/**
 * registration module tables (erd 4.7, SM-05, EP06 v0.2) – BE-C Sprint 3, migration 0051_registration_be_c.
 *
 * - registration: one per root reservation (BR-608), status K1…K13.
 * - registration_portal_submission: portal reference per block of a `mixed` declaration (E06-03).
 * - guest_document: one document per person. Every `*_enc` column is AES-256-GCM under the DEK of the row
 *   (`data_key_id`); `doc_number_hmac` = HMAC-SHA256(ID_HASH_KEY) – C3, never returned; only
 *   `doc_number_last4` leaves the server outside `…/sensitive` (SR-AZ-04, SR-KEY-07).
 * - document_image: encrypted blob per image, its own DEK (SR-KEY-01); delete = destroy DEK.
 * - consent_record: P02b decisions, append-only (R-CON-02) – the current decision is the newest row.
 *
 * party_member_id has no FK yet: the party table (reservation_guest) is BE-A Sprint 3 and not on main –
 * the FK is added in a later migration of this range once it is merged (ARC s3-contract 4.2 rule 6).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, bytea, instant } from './common';
import { dataKey } from './crypto';
import { reservationGuest } from './frontdesk';
import { property } from './platform';
import { reservation } from './reservations';

export const REGISTRATION_STATUSES = [
  'none',
  'pre',
  'partial',
  'review',
  'scanned',
  'sent',
  'confirmed',
  'needs_update',
  'updated',
  'void',
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_KINDS = ['vn_citizen_stay', 'foreigner_temp_residence', 'mixed'] as const;
export type RegistrationKind = (typeof REGISTRATION_KINDS)[number];

export const IMAGE_PURGE_REASONS = [
  'retention',
  'no_consent',
  'consent_withdrawn',
  'guest_request',
  'void',
] as const;
export type ImagePurgeReason = (typeof IMAGE_PURGE_REASONS)[number];

export const registration = pgTable(
  'registration',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    status: text('status').notNull().default('none'),
    kind: text('kind'),
    requiredCount: smallint('required_count').notNull(),
    submittedCount: smallint('submitted_count').notNull().default(0),
    preSubmittedAt: instant('pre_submitted_at'),
    actualCheckinAt: instant('actual_checkin_at'),
    actualCheckoutAt: instant('actual_checkout_at'),
    deadlineAt: instant('deadline_at'),
    deadlineBasis: text('deadline_basis'),
    sentAt: instant('sent_at'),
    sentBy: uuid('sent_by'),
    portalReference: text('portal_reference'),
    confirmedAt: instant('confirmed_at'),
    rejectedReason: text('rejected_reason'),
    needsUpdateReason: text('needs_update_reason'),
    updatedAtPortal: instant('updated_at_portal'),
    actualDepartureDate: date('actual_departure_date', { mode: 'string' }),
    imageRetentionUntil: instant('image_retention_until'),
    legalHold: boolean('legal_hold').notNull().default(false),
    blocksDoorCode: boolean('blocks_door_code').notNull().default(false),
    imagesPurgeScheduledAt: instant('images_purge_scheduled_at'),
    imagesPurgedAt: instant('images_purged_at'),
    imagesPurgeReason: text('images_purge_reason'),
    voidedAt: instant('voided_at'),
    /** 0053: checkout / early departure / cancel with a declaration in progress – SEC BE-32 deadline base. */
    stayEndedAt: instant('stay_ended_at'),
    ...auditColumns(),
  },
  (t) => [
    unique('registration_property_id_key').on(t.propertyId, t.id),
    unique('registration_reservation_key').on(t.reservationId),
    foreignKey({
      name: 'registration_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'registration_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    check(
      'registration_status_check',
      sql`${t.status} IN ('none', 'pre', 'partial', 'review', 'scanned', 'sent', 'confirmed', 'needs_update', 'updated', 'void')`,
    ),
    check(
      'registration_kind_check',
      sql`${t.kind} IS NULL OR ${t.kind} IN ('vn_citizen_stay', 'foreigner_temp_residence', 'mixed')`,
    ),
    check(
      'registration_deadline_basis_check',
      sql`${t.deadlineBasis} IS NULL OR ${t.deadlineBasis} IN ('vn_2300', 'vn_0800_next', 'foreigner_hours', 'foreigner_earlier_of')`,
    ),
    check(
      'registration_purge_reason_check',
      // 0062 (0.3.7 bổ sung 3 #8): `unconfirmed` – SR-RET-02, a declaration never confirmed.
      sql`${t.imagesPurgeReason} IS NULL OR ${t.imagesPurgeReason} IN ('retention', 'no_consent', 'consent_withdrawn', 'guest_request', 'void', 'unconfirmed')`,
    ),
    check('registration_counts_check', sql`${t.requiredCount} >= 0 AND ${t.submittedCount} >= 0`),
    index('registration_property_status_idx').on(t.propertyId, t.status, t.deadlineAt),
  ],
);

export const registrationPortalSubmission = pgTable(
  'registration_portal_submission',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    registrationId: uuid('registration_id').notNull(),
    kind: text('kind').notNull(),
    reference: text('reference').notNull(),
    sentAt: instant('sent_at').notNull(),
    sentBy: uuid('sent_by').notNull(),
  },
  (t) => [
    unique('registration_portal_submission_kind_key').on(t.registrationId, t.kind),
    foreignKey({
      name: 'registration_portal_submission_registration_fk',
      columns: [t.propertyId, t.registrationId],
      foreignColumns: [registration.propertyId, registration.id],
    }),
    check(
      'registration_portal_submission_kind_check',
      sql`${t.kind} IN ('foreigner_temp_residence', 'vn_citizen_stay')`,
    ),
  ],
);

export const DOC_TYPES = ['cccd', 'passport', 'child_personal_id', 'other'] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const guestDocument = pgTable(
  'guest_document',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    registrationId: uuid('registration_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    partyMemberId: uuid('party_member_id'),
    /** guest-web person number (1…requiredPeople) of an uploaded document (US-107). */
    personIndex: smallint('person_index'),
    /**
     * 0070 (SEC FB-R2-SEC-BE-73, ARC 16.22): the BOOKER's profile when the document is the booker's – the booker is a
     * party person (`party[]` id = the booking id) without a reservation_guest row. Never inferred from `is_main`;
     * exclusive with `party_member_id`; one per declaration.
     */
    guestId: uuid('guest_id'),
    docType: text('doc_type').notNull(),
    isMain: boolean('is_main').notNull().default(false),
    isForeigner: boolean('is_foreigner').notNull().default(false),
    /** Person below minor_data_age_threshold (BR-612): no consent question, images go at `confirmed`. */
    isMinorData: boolean('is_minor_data').notNull().default(false),
    fullNameOnDoc: text('full_name_on_doc'),
    nationalityCode: text('nationality_code'),
    gender: text('gender'),
    docNumberEnc: bytea('doc_number_enc'),
    docNumberLast4: text('doc_number_last4'),
    docNumberHmac: text('doc_number_hmac'),
    dateOfBirthEnc: bytea('date_of_birth_enc'),
    passportIssueDateEnc: bytea('passport_issue_date_enc'),
    passportExpiryDateEnc: bytea('passport_expiry_date_enc'),
    issuingPlaceEnc: bytea('issuing_place_enc'),
    visaKindEnc: bytea('visa_kind_enc'),
    visaNumberEnc: bytea('visa_number_enc'),
    visaValidUntilEnc: bytea('visa_valid_until_enc'),
    entryDateEnc: bytea('entry_date_enc'),
    entryPortEnc: bytea('entry_port_enc'),
    entryPurposeEnc: bytea('entry_purpose_enc'),
    noEntryRecordEnc: bytea('no_entry_record_enc'),
    addressEnc: bytea('address_enc'),
    checkResults: jsonb('check_results')
      .notNull()
      .default(sql`'[]'::jsonb`),
    visaAlertOn: date('visa_alert_on', { mode: 'string' }),
    captureMethod: text('capture_method').notNull(),
    dataKeyId: uuid('data_key_id').notNull(),
    fieldsPurgeAfter: instant('fields_purge_after'),
    purgedAt: instant('purged_at'),
    /** Person removed from the booking (EP02 8, A-38): C3 destroyed in the same transaction. */
    removedAt: instant('removed_at'),
    /**
     * 0.3.7 nhóm D A.6 (0057): name + date of birth on the document match a guest profile OUTSIDE the booking –
     * never linked automatically, the desk confirms (BR-952). Computed when the document is entered.
     */
    possibleReturningGuest: boolean('possible_returning_guest').notNull().default(false),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by'),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    unique('guest_document_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'guest_document_registration_fk',
      columns: [t.propertyId, t.registrationId],
      foreignColumns: [registration.propertyId, registration.id],
    }),
    foreignKey({
      name: 'guest_document_data_key_fk',
      columns: [t.propertyId, t.dataKeyId],
      foreignColumns: [dataKey.propertyId, dataKey.id],
    }),
    foreignKey({
      name: 'guest_document_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'guest_document_party_member_fk',
      columns: [t.propertyId, t.partyMemberId],
      foreignColumns: [reservationGuest.propertyId, reservationGuest.id],
    }),
    check(
      'guest_document_doc_type_check',
      sql`${t.docType} IN ('cccd', 'passport', 'child_personal_id', 'other')`,
    ),
    check(
      'guest_document_capture_check',
      sql`${t.captureMethod} IN ('qr_cccd', 'mrz', 'manual', 'guest_upload')`,
    ),
    check(
      'guest_document_gender_check',
      sql`${t.gender} IS NULL OR ${t.gender} IN ('male', 'female', 'other')`,
    ),
    check(
      'guest_document_person_index_check',
      sql`${t.personIndex} IS NULL OR ${t.personIndex} >= 1`,
    ),
    check('guest_document_person_check', sql`${t.guestId} IS NULL OR ${t.partyMemberId} IS NULL`),
    uniqueIndex('guest_document_booker_uk')
      .on(t.registrationId)
      .where(sql`${t.guestId} IS NOT NULL AND ${t.removedAt} IS NULL`),
    index('guest_document_registration_idx').on(t.registrationId),
    index('guest_document_visa_alert_idx')
      .on(t.propertyId, t.visaAlertOn)
      .where(sql`${t.visaAlertOn} IS NOT NULL`),
  ],
);

export const documentImage = pgTable(
  'document_image',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    guestDocumentId: uuid('guest_document_id').notNull(),
    registrationId: uuid('registration_id').notNull(),
    blobKey: text('blob_key').notNull(),
    mime: text('mime').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    ciphertextSha256: text('ciphertext_sha256').notNull(),
    dataKeyId: uuid('data_key_id').notNull(),
    uploadedVia: text('uploaded_via').notNull(),
    uploadedBy: uuid('uploaded_by'),
    uploadedAt: instant('uploaded_at').notNull(),
    deleteAfter: instant('delete_after'),
    deletedAt: instant('deleted_at'),
    deleteReason: text('delete_reason'),
  },
  (t) => [
    foreignKey({
      name: 'document_image_document_fk',
      columns: [t.propertyId, t.guestDocumentId],
      foreignColumns: [guestDocument.propertyId, guestDocument.id],
    }),
    foreignKey({
      name: 'document_image_data_key_fk',
      columns: [t.propertyId, t.dataKeyId],
      foreignColumns: [dataKey.propertyId, dataKey.id],
    }),
    check('document_image_via_check', sql`${t.uploadedVia} IN ('desk', 'guest_app')`),
    check('document_image_mime_check', sql`${t.mime} IN ('image/jpeg', 'image/webp')`),
    check(
      'document_image_delete_reason_check',
      sql`${t.deleteReason} IS NULL OR ${t.deleteReason} IN ('retention', 'no_consent', 'consent_withdrawn', 'guest_request', 'void', 'replaced', 'party_removed', 'unconfirmed')`,
    ),
    index('document_image_document_idx').on(t.guestDocumentId),
    index('document_image_registration_idx').on(t.registrationId),
    index('document_image_purge_idx')
      .on(t.propertyId, t.deleteAfter)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export const CONSENT_PURPOSES = [
  'P02B_ID_IMAGE_RETENTION',
  'P05_CRM',
  'P06_MARKETING',
  'P07_REVIEW',
] as const;

export const consentRecord = pgTable(
  'consent_record',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    registrationId: uuid('registration_id').notNull(),
    /** The person: the document the decision is about (party table not merged yet – see header). */
    guestDocumentId: uuid('guest_document_id'),
    partyMemberId: uuid('party_member_id'),
    personIndex: smallint('person_index'),
    purpose: text('purpose').notNull(),
    decision: text('decision').notNull(),
    noticeVersion: text('notice_version').notNull(),
    locale: text('locale').notNull(),
    channel: text('channel').notNull(),
    recordedByType: text('recorded_by_type').notNull(),
    recordedBy: uuid('recorded_by'),
    recordedAt: instant('recorded_at').notNull(),
    /** 0053 (SEC ĐK-2 17/10): P02b retention days the person read in the consent sentence. */
    retentionDays: smallint('retention_days'),
  },
  (t) => [
    foreignKey({
      name: 'consent_record_registration_fk',
      columns: [t.propertyId, t.registrationId],
      foreignColumns: [registration.propertyId, registration.id],
    }),
    check(
      'consent_record_purpose_check',
      sql`${t.purpose} IN ('P02B_ID_IMAGE_RETENTION', 'P05_CRM', 'P06_MARKETING', 'P07_REVIEW')`,
    ),
    check('consent_record_decision_check', sql`${t.decision} IN ('granted', 'refused')`),
    check('consent_record_channel_check', sql`${t.channel} IN ('guest_app', 'desk', 'paper')`),
    check('consent_record_locale_check', sql`${t.locale} IN ('vi', 'en', 'ru')`),
    check('consent_record_by_check', sql`${t.recordedByType} IN ('user', 'guest')`),
    check(
      'consent_record_retention_days_check',
      sql`${t.retentionDays} IS NULL OR ${t.retentionDays} BETWEEN 1 AND 365`,
    ),
    index('consent_record_registration_idx').on(t.registrationId, t.recordedAt),
  ],
);
