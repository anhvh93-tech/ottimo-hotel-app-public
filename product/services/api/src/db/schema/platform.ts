/** platform module tables (erd 4.1): organization, property, parameters, document counters, dev clock. */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  date,
  foreignKey,
  jsonb,
  pgTable,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auditColumns, instant } from './common';

export const organization = pgTable(
  'organization',
  {
    id: uuid('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    status: text('status').notNull().default('active'),
    ...auditColumns(),
  },
  (t) => [check('organization_status_check', sql`${t.status} IN ('active', 'suspended')`)],
);

export const property = pgTable(
  'property',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    address: text('address'),
    mapUrl: text('map_url'),
    phonePublic: text('phone_public'),
    timezone: text('timezone').notNull().default('Asia/Ho_Chi_Minh'),
    currency: char('currency', { length: 3 }).notNull().default('VND'),
    monthCloseDay: smallint('month_close_day'),
    houseRulesI18n: jsonb('house_rules_i18n'),
    wifiInfoI18n: jsonb('wifi_info_i18n'),
    status: text('status').notNull().default('active'),
    ...auditColumns(),
  },
  (t) => [
    unique('property_org_code_key').on(t.organizationId, t.code),
    // Target of the (organization_id, property_id) pair FKs: a child row can never point to a
    // property of another organization (erd 1, K11).
    unique('property_org_id_key').on(t.organizationId, t.id),
    check('property_status_check', sql`${t.status} IN ('active', 'inactive')`),
    check('property_currency_check', sql`${t.currency} = 'VND'`),
    check('property_month_close_day_check', sql`${t.monthCloseDay} BETWEEN 1 AND 28`),
  ],
);

/**
 * Parameter catalogue (erd 4.1 config_parameter_def). No RLS: global catalogue, no tenant data
 * (erd 2.3 exception list). `bounds` holds the SEC hard limits of security parameters
 * (OpenAPI setParameter.x-security-parameters is the source; synced by migration).
 */
export const configParameterDef = pgTable(
  'config_parameter_def',
  {
    key: text('key').primaryKey(),
    valueSchema: text('value_schema').notNull(),
    editRoles: text('edit_roles').array().notNull(),
    brRef: text('br_ref'),
    snapshotInto: text('snapshot_into'),
    isSecurity: boolean('is_security').notNull().default(false),
    bounds: jsonb('bounds'),
    defaultValue: jsonb('default_value'),
  },
  (t) => [
    check(
      'config_parameter_def_edit_roles_check',
      sql`${t.editRoles} <@ ARRAY['owner', 'manager']::text[] AND cardinality(${t.editRoles}) > 0`,
    ),
    check(
      'config_parameter_def_security_owner_only',
      sql`NOT ${t.isSecurity} OR ${t.editRoles} = ARRAY['owner']::text[]`,
    ),
  ],
);

/** Effective-dated parameter values per property (erd 4.1, section 9). Past values are never edited. */
export const configParameter = pgTable(
  'config_parameter',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    key: text('key')
      .notNull()
      .references(() => configParameterDef.key),
    value: jsonb('value').notNull(),
    effectiveFrom: date('effective_from', { mode: 'string' }).notNull(),
    statusLabel: text('status_label'),
    reason: text('reason'),
    ...auditColumns(),
  },
  (t) => [
    unique('config_parameter_property_key_from_key').on(t.propertyId, t.key, t.effectiveFrom),
    foreignKey({
      name: 'config_parameter_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    // Status label of BR section 13 (GD, NGANH, PL, INV-004…), combinable with '+' (DS-E: 'INV-006+NGANH').
    // A code, never free text.
    check(
      'config_parameter_status_label_check',
      sql`${t.statusLabel} IS NULL OR ${t.statusLabel} ~ '^[A-Z0-9-]{1,16}(\\+[A-Z0-9-]{1,16}){0,3}$'`,
    ),
  ],
);

/**
 * Document number counters (erd 10). property_id NULL = organisation-wide counter (KH-).
 * Allocation: DocNumberService only (INSERT … ON CONFLICT DO UPDATE … RETURNING in the business tx).
 */
export const docSequence = pgTable(
  'doc_sequence',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    propertyId: uuid('property_id'),
    docType: text('doc_type').notNull(),
    periodKey: text('period_key').notNull(),
    prefix: text('prefix').notNull(),
    padWidth: smallint('pad_width').notNull(),
    nextValue: bigint('next_value', { mode: 'number' }).notNull(),
  },
  (t) => [
    uniqueIndex('doc_sequence_property_uk')
      .on(t.propertyId, t.docType, t.periodKey)
      .where(sql`${t.propertyId} IS NOT NULL`),
    uniqueIndex('doc_sequence_org_uk')
      .on(t.organizationId, t.docType, t.periodKey)
      .where(sql`${t.propertyId} IS NULL`),
    foreignKey({
      name: 'doc_sequence_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('doc_sequence_next_value_check', sql`${t.nextValue} >= 1`),
    check('doc_sequence_pad_width_check', sql`${t.padWidth} BETWEEN 1 AND 12`),
  ],
);

/**
 * Shared fake clock for dev/test/staging (ADR-008): one row, read by api and worker.
 * No row = system time. Production refuses to start when a row exists (SR-SECR-05).
 * No RLS: no tenant data (erd 2.3 exception list).
 */
export const devClock = pgTable(
  'dev_clock',
  {
    id: smallint('id').primaryKey().default(1),
    offsetMs: bigint('offset_ms', { mode: 'number' }).notNull().default(0),
    frozenAt: instant('frozen_at'),
    updatedAt: instant('updated_at').notNull(),
  },
  (t) => [check('dev_clock_single_row', sql`${t.id} = 1`)],
);
