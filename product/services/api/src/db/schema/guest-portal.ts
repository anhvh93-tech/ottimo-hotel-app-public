/**
 * guest-portal module tables (ADR-006, erd 4.11, SR-GST-01…05, SEC ĐK-1…6) – BE-C Sprint 3,
 * migration 0052_guest_portal_be_c.
 *
 * - guest_access_token: the link token of a booking. Only SHA-256(token) is stored (SR-GST-01); the token
 *   is returned once by issueGuestLink. Re-issue revokes every older token and session (SR-GST-04).
 * - guest_session: cookie `__Host-ottimo_gsid` → SHA-256 in `sid_hash`. R2 = level 1 only (ĐK-1).
 * - online_checkin: progress of the online check-in (US-107, E06-06).
 * Lookups before a tenant context go through guest_resolve_token / guest_resolve_session (erd 2.4).
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  time,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { instant } from './common';
import { reservation } from './reservations';

export const guestAccessToken = pgTable(
  'guest_access_token',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    tokenHash: text('token_hash').notNull(),
    createdAt: instant('created_at').notNull(),
    createdBy: uuid('created_by'),
    expiresAt: instant('expires_at').notNull(),
    revokedAt: instant('revoked_at'),
    revokedReason: text('revoked_reason'),
  },
  (t) => [
    unique('guest_access_token_hash_key').on(t.tokenHash),
    foreignKey({
      name: 'guest_access_token_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    check(
      'guest_access_token_revoked_reason_check',
      sql`${t.revokedReason} IS NULL OR ${t.revokedReason} IN ('reissued', 'revoked', 'cancelled', 'no_show', 'relocated')`,
    ),
    index('guest_access_token_reservation_idx')
      .on(t.reservationId)
      .where(sql`${t.revokedAt} IS NULL`),
  ],
);

export const guestSession = pgTable(
  'guest_session',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    sidHash: text('sid_hash').notNull(),
    tokenId: uuid('token_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    level: smallint('level').notNull().default(1),
    locale: text('locale').notNull(),
    createdAt: instant('created_at').notNull(),
    lastActiveAt: instant('last_active_at').notNull(),
    expiresAt: instant('expires_at').notNull(),
    revokedAt: instant('revoked_at'),
  },
  (t) => [
    unique('guest_session_sid_key').on(t.sidHash),
    foreignKey({
      name: 'guest_session_token_fk',
      columns: [t.tokenId],
      foreignColumns: [guestAccessToken.id],
    }),
    check('guest_session_level_check', sql`${t.level} IN (1, 2)`),
    check('guest_session_locale_check', sql`${t.locale} IN ('vi', 'en', 'ru')`),
    index('guest_session_reservation_idx')
      .on(t.reservationId)
      .where(sql`${t.revokedAt} IS NULL`),
  ],
);

export const ONLINE_CHECKIN_STEPS = ['notice', 'documents', 'eta', 'consent', 'done'] as const;
export type OnlineCheckinStep = (typeof ONLINE_CHECKIN_STEPS)[number];

export const onlineCheckin = pgTable(
  'online_checkin',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    reservationId: uuid('reservation_id').notNull(),
    currentStep: text('current_step').notNull().default('notice'),
    etaTime: time('eta_time'),
    lateArrival: boolean('late_arrival').notNull().default(false),
    /** C2, D23 – Desk only, never back to guest-web, never in push/outbox/audit/log (ĐK-2). */
    arrivalNote: text('arrival_note'),
    deferredPeople: smallint('deferred_people')
      .array()
      .notNull()
      .default(sql`'{}'::smallint[]`),
    noticeVersion: text('notice_version'),
    noticeLocale: text('notice_locale'),
    noticeAcceptedAt: instant('notice_accepted_at'),
    completedAt: instant('completed_at'),
    /** SR-RL-05: update/complete writes counted per local day. */
    writeCount: smallint('write_count').notNull().default(0),
    writeCountDate: date('write_count_date', { mode: 'string' }),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [
    unique('online_checkin_reservation_key').on(t.reservationId),
    foreignKey({
      name: 'online_checkin_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    check(
      'online_checkin_step_check',
      sql`${t.currentStep} IN ('notice', 'documents', 'eta', 'consent', 'done')`,
    ),
    check(
      'online_checkin_note_check',
      sql`${t.arrivalNote} IS NULL OR char_length(${t.arrivalNote}) <= 300`,
    ),
  ],
);
