/** identity module tables (erd 4.2): users, roles per property, sessions, trusted devices. */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  smallint,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, bytea, citext, instant } from './common';
import { organization, property } from './platform';

/** The 8 staff roles (decision-log BA, rbac-matrix 1). Order = display order only. */
export const STAFF_ROLES = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'housekeeping',
  'maintenance',
  'sales_staff',
  'collaborator',
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const appUser = pgTable(
  'app_user',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    // Unique across the whole system: login needs no organisation code (BE-ARC-01b).
    username: citext('username').notNull().unique(),
    email: citext('email'),
    displayName: text('display_name').notNull(),
    phone: text('phone'),
    passwordHash: text('password_hash').notNull(),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    passwordChangedAt: instant('password_changed_at'),
    approvalPinHash: text('approval_pin_hash'),
    approvalPinFailedCount: integer('approval_pin_failed_count').notNull().default(0),
    approvalPinLockedUntil: instant('approval_pin_locked_until'),
    rolesVersion: integer('roles_version').notNull().default(1),
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    mfaSecretEnc: bytea('mfa_secret_enc'),
    // 0.3.8 (US-143, erd 4.15): SHA-256 hex of each unused recovery code (16 chars base32, ≥ 80 bit).
    mfaRecoveryCodesHash: text('mfa_recovery_codes_hash').array(),
    // 0.3.8: secret waiting for confirmMy2fa (10 min); one DEK per enrolment (`mfa_data_key_id`) under the
    // property `mfa_key_property_id` (data_key is property-level RLS) – used by the pending and the live secret.
    mfaPendingSecretEnc: bytea('mfa_pending_secret_enc'),
    mfaPendingExpiresAt: instant('mfa_pending_expires_at'),
    mfaDataKeyId: uuid('mfa_data_key_id'),
    mfaKeyPropertyId: uuid('mfa_key_property_id'),
    // TOTP anti-replay (SEC 06.18): last 30-second step accepted, updated atomically (only increases).
    mfaLastUsedStep: bigint('mfa_last_used_step', { mode: 'number' }),
    mfaEnrolledAt: instant('mfa_enrolled_at'),
    mfaResetAt: instant('mfa_reset_at'),
    status: text('status').notNull().default('active'),
    failedLoginCount: integer('failed_login_count').notNull().default(0),
    lockedUntil: instant('locked_until'),
    lockCount24h: integer('lock_count_24h').notNull().default(0),
    lastLoginAt: instant('last_login_at'),
    ...auditColumns(),
  },
  (t) => [
    unique('app_user_org_id_key').on(t.organizationId, t.id),
    check('app_user_status_check', sql`${t.status} IN ('active', 'locked', 'disabled')`),
  ],
);

/** Role of a user at a property (erd 4.2). Permission = union of non-revoked roles (rbac 1.2). */
export const userPropertyRole = pgTable(
  'user_property_role',
  {
    userId: uuid('user_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    role: text('role').notNull(),
    grantedBy: uuid('granted_by'),
    grantedAt: instant('granted_at').notNull(),
    revokedAt: instant('revoked_at'),
  },
  (t) => [
    primaryKey({ name: 'user_property_role_pkey', columns: [t.userId, t.propertyId, t.role] }),
    foreignKey({
      name: 'user_property_role_user_fk',
      columns: [t.organizationId, t.userId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'user_property_role_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check(
      'user_property_role_role_check',
      sql`${t.role} IN ('owner', 'manager', 'front_desk_lead', 'front_desk', 'housekeeping', 'maintenance', 'sales_staff', 'collaborator')`,
    ),
    index('user_property_role_property_idx').on(t.propertyId, t.role),
  ],
);

/** Device granted access to C3 data by an owner (SR-DEV-01…09). */
export const trustedDevice = pgTable(
  'trusted_device',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    name: text('name').notNull(),
    deviceKind: text('device_kind').notNull(),
    // SHA-256 (hex) of the __Host-ottimo_did cookie (256-bit random); the cookie itself is never stored.
    tokenHash: text('token_hash').notNull().unique(),
    hardeningChecklistVersion: text('hardening_checklist_version'),
    checklistConfirmedBy: uuid('checklist_confirmed_by'),
    createdBy: uuid('created_by'),
    createdAt: instant('created_at').notNull(),
    expiresAt: instant('expires_at').notNull(),
    lastSeenAt: instant('last_seen_at'),
    revokedAt: instant('revoked_at'),
    revokedBy: uuid('revoked_by'),
    revokeReason: text('revoke_reason'),
  },
  (t) => [
    unique('trusted_device_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'trusted_device_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('trusted_device_kind_check', sql`${t.deviceKind} IN ('desk', 'facility_mobile')`),
    check(
      'trusted_device_mobile_max_30d',
      sql`${t.deviceKind} <> 'facility_mobile' OR ${t.expiresAt} <= ${t.createdAt} + interval '30 days'`,
    ),
  ],
);

/** Staff session (erd 4.2). id = SHA-256 (hex) of the session cookie value. */
export const userSession = pgTable(
  'user_session',
  {
    id: text('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),
    activePropertyId: uuid('active_property_id'),
    clientOrigin: text('client_origin').notNull(),
    trustedDeviceId: uuid('trusted_device_id').references(() => trustedDevice.id),
    createdAt: instant('created_at').notNull(),
    lastActiveAt: instant('last_active_at').notNull(),
    idleExpiresAt: instant('idle_expires_at').notNull(),
    expiresAt: instant('expires_at').notNull(),
    revokedAt: instant('revoked_at'),
    revokedReason: text('revoked_reason'),
    ipHmac: text('ip_hmac'),
    userAgent: text('user_agent'),
    stepupUntil: instant('stepup_until'),
    // 0.3.8 (SEC 06.4, 06.21): second factor passed at (null = password only), method, restricted session.
    mfaAt: instant('mfa_at'),
    amr: text('amr'),
    enrollmentOnly: boolean('enrollment_only').notNull().default(false),
  },
  (t) => [
    foreignKey({
      name: 'user_session_user_fk',
      columns: [t.organizationId, t.userId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    foreignKey({
      name: 'user_session_property_fk',
      columns: [t.organizationId, t.activePropertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('user_session_origin_check', sql`${t.clientOrigin} IN ('admin', 'staff_pwa')`),
    check(
      'user_session_revoked_reason_check',
      sql`${t.revokedReason} IS NULL OR ${t.revokedReason} IN ('logout', 'role_changed', 'disabled', 'password_reset', 'password_changed', 'mfa_disabled', 'mfa_enrolled', 'mfa_reset', 'admin')`,
    ),
    check(
      'user_session_amr_check',
      sql`${t.amr} IS NULL OR ${t.amr} IN ('pwd', 'totp', 'recovery_code')`,
    ),
    index('user_session_user_idx').on(t.userId),
    index('user_session_expires_idx').on(t.expiresAt),
  ],
);

/**
 * Second login step (0.3.8, SEC 06.17, erd 4.15): `mfaToken` returned with 401 MFA_REQUIRED. Only its SHA-256
 * is stored; single use, 5 minutes, ≤ 5 failures, bound to the user and the client. No grant to ottimo_app:
 * read/written only through the SECURITY DEFINER functions auth_mfa_challenge_* (migration 0079).
 */
export const mfaLoginChallenge = pgTable(
  'mfa_login_challenge',
  {
    tokenHash: text('token_hash').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    userId: uuid('user_id').notNull(),
    clientOrigin: text('client_origin').notNull(),
    createdAt: instant('created_at').notNull(),
    expiresAt: instant('expires_at').notNull(),
    failedCount: smallint('failed_count').notNull().default(0),
    usedAt: instant('used_at'),
  },
  (t) => [
    foreignKey({
      name: 'mfa_login_challenge_user_fk',
      columns: [t.organizationId, t.userId],
      foreignColumns: [appUser.organizationId, appUser.id],
    }),
    check('mfa_login_challenge_origin_check', sql`${t.clientOrigin} IN ('admin', 'staff_pwa')`),
    index('mfa_login_challenge_user_idx').on(t.userId),
    index('mfa_login_challenge_expires_idx').on(t.expiresAt),
  ],
);
