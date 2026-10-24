/**
 * public-site – "Yêu cầu đặt phòng" from the website (erd 4.14; OpenAPI 0.3.7 bổ sung 2 / 0.3.8; US-155, ADR-014
 * mục 4 phương án A; SM-18 WR1–WR8) – BE-D, R3 Sprint 1, migration 0086.
 *
 * - `website_booking_request`: one row per accepted request. C2 (`guest_name`, `phone_e164`, `email`, `note`,
 *   `decline_note`, `contact_hmac`) is NULLed by `converted` (WR6), `erase` (WR8) or the retention job (T19) –
 *   `pii_purged_at`. Never linked to `guest`/`lead` (ADR-014 4.3).
 * - `privacy_notice_version`: published privacy notices (SEC C-3) – append-only, rows written by the landing
 *   release (OPS data migration); a request needs the current version of its locale (or the previous one for
 *   7 days after `superseded_at`).
 * - `public_form_nonce`: one-time use of a signed form token (ADR-014 4.4 tầng 1).
 * - `rate_limit_counter`: SR-RL-11 counters in PostgreSQL (atomic UPSERT) – bucket keys hold only HMAC/ids.
 */
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea, instant } from './common';
import { appUser } from './identity';
import { organization, property } from './platform';

export const WEBSITE_REQUEST_STATUSES = [
  'new',
  'in_progress',
  'converted',
  'declined',
  'spam',
] as const;
export type WebsiteRequestStatus = (typeof WEBSITE_REQUEST_STATUSES)[number];

/** OpenAPI WebsiteBookingRequestDeclineReason – `stale`, `erased_on_request` are system codes. */
export const WEBSITE_REQUEST_DECLINE_REASONS = [
  'no_availability',
  'price_not_accepted',
  'guest_unreachable',
  'guest_not_proceeding',
  'duplicate',
  'policy_mismatch',
  'stale',
  'erased_on_request',
  'other',
] as const;

export const WEBSITE_REQUEST_CHANNELS = [
  'zalo',
  'whatsapp',
  'telegram',
  'viber',
  'phone',
  'email',
] as const;

/** OpenAPI DirectSubSource. */
export const DIRECT_SUB_SOURCES = [
  'facebook',
  'instagram',
  'google',
  'zalo',
  'qr',
  'other',
] as const;

export const WEBSITE_REQUEST_FLAGS = [
  'contains_url',
  'unexpected_script',
  'far_future',
  'repeat_contact',
  'room_type_unmatched',
  'possible_duplicate',
  'offer_unverified',
] as const;

export const privacyNoticeVersion = pgTable(
  'privacy_notice_version',
  {
    organizationId: uuid('organization_id').notNull(),
    version: text('version').notNull(),
    locale: text('locale').notNull(),
    bodySha256: text('body_sha256').notNull(),
    urlPath: text('url_path').notNull(),
    publishedAt: instant('published_at').notNull(),
    supersededAt: instant('superseded_at'),
  },
  (t) => [
    primaryKey({
      name: 'privacy_notice_version_pkey',
      columns: [t.organizationId, t.version, t.locale],
    }),
    foreignKey({
      name: 'privacy_notice_version_org_fk',
      columns: [t.organizationId],
      foreignColumns: [organization.id],
    }),
    check('privacy_notice_version_locale_check', sql`${t.locale} IN ('vi', 'en', 'ru')`),
    check(
      'privacy_notice_version_version_check',
      sql`${t.version} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(\\.[0-9]{1,2})?$'`,
    ),
    check('privacy_notice_version_sha_check', sql`${t.bodySha256} ~ '^[0-9a-f]{64}$'`),
  ],
);

export const websiteBookingRequest = pgTable(
  'website_booking_request',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    refCode: text('ref_code').notNull(),
    status: text('status').notNull().default('new'),
    arrivalDate: date('arrival_date', { mode: 'string' }).notNull(),
    departureDate: date('departure_date', { mode: 'string' }),
    stayKind: text('stay_kind').notNull(),
    stayMonths: smallint('stay_months'),
    adults: smallint('adults').notNull(),
    children: smallint('children').notNull().default(0),
    infants: smallint('infants').notNull().default(0),
    roomTypeSlug: text('room_type_slug'),
    locale: text('locale').notNull(),
    preferredChannel: text('preferred_channel').notNull(),
    guestName: text('guest_name'),
    phoneE164: text('phone_e164'),
    email: text('email'),
    note: text('note'),
    contactHmac: text('contact_hmac'),
    aliasRefCodes: text('alias_ref_codes')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    relatedRequestIds: uuid('related_request_ids')
      .array()
      .notNull()
      .default(sql`'{}'::uuid[]`),
    consentVersion: text('consent_version').notNull(),
    consentAt: instant('consent_at').notNull(),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    refHost: text('ref_host'),
    landingPath: text('landing_path'),
    subSource: text('sub_source'),
    suspiciousFlags: text('suspicious_flags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    duplicateCount: integer('duplicate_count').notNull().default(0),
    lastDuplicateAt: instant('last_duplicate_at'),
    ipHmac: bytea('ip_hmac'),
    replyBy: instant('reply_by').notNull(),
    overdueNotifiedAt: instant('overdue_notified_at'),
    assignedUserId: uuid('assigned_user_id'),
    claimedAt: instant('claimed_at'),
    declineReasonCode: text('decline_reason_code'),
    declineNote: text('decline_note'),
    quoteId: uuid('quote_id'),
    reservationId: uuid('reservation_id'),
    convertedAt: instant('converted_at'),
    convertedBy: uuid('converted_by'),
    offerSnapshot: jsonb('offer_snapshot'),
    lastActivityAt: instant('last_activity_at').notNull(),
    piiPurgedAt: instant('pii_purged_at'),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => [
    unique('website_booking_request_property_id_key').on(t.propertyId, t.id),
    unique('website_booking_request_ref_code_key').on(t.propertyId, t.refCode),
    foreignKey({
      name: 'website_booking_request_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'website_booking_request_consent_fk',
      columns: [t.organizationId, t.consentVersion, t.locale],
      foreignColumns: [
        privacyNoticeVersion.organizationId,
        privacyNoticeVersion.version,
        privacyNoticeVersion.locale,
      ],
    }),
    foreignKey({
      name: 'website_booking_request_assigned_fk',
      columns: [t.organizationId, t.assignedUserId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'website_booking_request_converted_by_fk',
      columns: [t.organizationId, t.convertedBy],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check(
      'website_booking_request_status_check',
      sql`${t.status} IN ('new', 'in_progress', 'converted', 'declined', 'spam')`,
    ),
    check('website_booking_request_ref_code_check', sql`${t.refCode} ~ '^[0-9A-HJKMNP-TV-Z]{8}$'`),
    check('website_booking_request_stay_kind_check', sql`${t.stayKind} IN ('short', 'long')`),
    check(
      'website_booking_request_months_check',
      sql`${t.stayMonths} IS NULL OR (${t.stayKind} = 'long' AND ${t.stayMonths} BETWEEN 1 AND 24)`,
    ),
    check(
      'website_booking_request_departure_check',
      sql`(${t.departureDate} IS NULL AND ${t.stayKind} = 'long') OR (${t.departureDate} > ${t.arrivalDate} AND ${t.departureDate} <= ${t.arrivalDate} + 366)`,
    ),
    check(
      'website_booking_request_party_check',
      sql`${t.adults} BETWEEN 1 AND 12 AND ${t.children} BETWEEN 0 AND 8 AND ${t.infants} BETWEEN 0 AND 8`,
    ),
    check('website_booking_request_locale_check', sql`${t.locale} IN ('vi', 'en', 'ru')`),
    check(
      'website_booking_request_channel_check',
      sql`${t.preferredChannel} IN ('zalo', 'whatsapp', 'telegram', 'viber', 'phone', 'email')`,
    ),
    check(
      'website_booking_request_sub_source_check',
      sql`${t.subSource} IS NULL OR ${t.subSource} IN ('facebook', 'instagram', 'google', 'zalo', 'qr', 'other')`,
    ),
    check(
      'website_booking_request_text_check',
      sql`(${t.guestName} IS NULL OR char_length(${t.guestName}) <= 80) AND (${t.note} IS NULL OR char_length(${t.note}) <= 500) AND (${t.declineNote} IS NULL OR char_length(${t.declineNote}) <= 300)`,
    ),
    check(
      'website_booking_request_contact_check',
      sql`${t.piiPurgedAt} IS NOT NULL OR (${t.guestName} IS NOT NULL AND (${t.phoneE164} IS NOT NULL) <> (${t.email} IS NOT NULL) AND ${t.contactHmac} IS NOT NULL)`,
    ),
    check(
      'website_booking_request_assigned_check',
      sql`${t.status} <> 'in_progress' OR ${t.assignedUserId} IS NOT NULL`,
    ),
    check(
      'website_booking_request_declined_check',
      sql`${t.status} <> 'declined' OR ${t.declineReasonCode} IS NOT NULL`,
    ),
    check(
      'website_booking_request_decline_reason_check',
      sql`${t.declineReasonCode} IS NULL OR ${t.declineReasonCode} IN ('no_availability', 'price_not_accepted', 'guest_unreachable', 'guest_not_proceeding', 'duplicate', 'policy_mismatch', 'stale', 'erased_on_request', 'other')`,
    ),
    check(
      'website_booking_request_converted_check',
      sql`(${t.status} = 'converted') = (${t.reservationId} IS NOT NULL)`,
    ),
    check('website_booking_request_alias_check', sql`cardinality(${t.aliasRefCodes}) <= 5`),
    index('website_booking_request_queue_idx').on(t.propertyId, t.status, t.replyBy),
    index('website_booking_request_contact_idx')
      .on(t.propertyId, t.contactHmac, t.createdAt)
      .where(sql`${t.contactHmac} IS NOT NULL`),
    index('website_booking_request_assigned_idx')
      .on(t.propertyId, t.assignedUserId)
      .where(sql`${t.status} = 'in_progress'`),
  ],
);

export const publicFormNonce = pgTable(
  'public_form_nonce',
  {
    nonceHash: bytea('nonce_hash').primaryKey(),
    propertyId: uuid('property_id').notNull(),
    usedAt: instant('used_at').notNull(),
    expiresAt: instant('expires_at').notNull(),
  },
  (t) => [index('public_form_nonce_expires_idx').on(t.expiresAt)],
);

export const rateLimitCounter = pgTable(
  'rate_limit_counter',
  {
    bucketKey: text('bucket_key').notNull(),
    windowStart: instant('window_start').notNull(),
    count: integer('count').notNull().default(0),
    expiresAt: instant('expires_at').notNull(),
  },
  (t) => [
    primaryKey({ name: 'rate_limit_counter_pkey', columns: [t.bucketKey, t.windowStart] }),
    index('rate_limit_counter_expires_idx').on(t.expiresAt),
    check('rate_limit_counter_key_check', sql`char_length(${t.bucketKey}) <= 200`),
  ],
);
