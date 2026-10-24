/**
 * crypto module tables (ADR-013, erd 4.7 `data_key`, `purge_journal`, `retention_run`) – BE-C Sprint 3,
 * migration 0050_crypto_files_be_c.
 *
 * - data_key: one data-encryption key (DEK) per C3 record/file, wrapped by the KEK (never in the DB).
 *   Destroy = wrapped_key NULL + destroyed_at (crypto-shredding). Only CryptoService reads this table
 *   (SR-KEY-02 – test/crypto-boundary.test.ts).
 * - purge_journal: IDs + time of every destroy/delete, replayed after a backup restore (SR-RET-03, SR-BAK-06).
 *   Append-only (ottimo_app: SELECT, INSERT).
 * - retention_run: what a retention run did (counts only, no personal data – SEC 7). Append-only.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea, instant } from './common';
import { property } from './platform';

export const DATA_KEY_PURPOSES = [
  'guest_document',
  'document_image',
  'door_credential',
  'payee',
  'child_data',
  'mfa_secret',
  'refund_account',
  'push_keys',
  'attachment',
] as const;
export type DataKeyPurpose = (typeof DATA_KEY_PURPOSES)[number];

export const dataKey = pgTable(
  'data_key',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    purpose: text('purpose').notNull(),
    subjectId: uuid('subject_id').notNull(),
    /** nonce(12) | tag(16) | AES-256-GCM(DEK) under the KEK of `kek_version`; NULL once destroyed. */
    wrappedKey: bytea('wrapped_key'),
    kekVersion: integer('kek_version').notNull(),
    createdAt: instant('created_at').notNull(),
    expiresAt: instant('expires_at'),
    destroyedAt: instant('destroyed_at'),
  },
  (t) => [
    // 0053: tenant pair for the FKs of the C3 rows (ARC FB-S3-22).
    unique('data_key_property_id_key').on(t.propertyId, t.id),
    foreignKey({
      name: 'data_key_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check(
      'data_key_purpose_check',
      sql`${t.purpose} IN ('guest_document', 'document_image', 'door_credential', 'payee', 'child_data', 'mfa_secret', 'refund_account', 'push_keys', 'attachment')`,
    ),
    check(
      'data_key_destroyed_check',
      sql`(${t.destroyedAt} IS NULL) = (${t.wrappedKey} IS NOT NULL)`,
    ),
    index('data_key_subject_idx').on(t.propertyId, t.subjectId),
    index('data_key_kek_version_idx')
      .on(t.kekVersion)
      .where(sql`${t.destroyedAt} IS NULL`),
  ],
);

export const PURGE_ACTIONS = ['destroy_dek', 'delete_blob', 'null_columns', 'anonymize'] as const;
export type PurgeAction = (typeof PURGE_ACTIONS)[number];

export const purgeJournal = pgTable(
  'purge_journal',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    policyKey: text('policy_key').notNull(),
    action: text('action').notNull(),
    purgedAt: instant('purged_at').notNull(),
  },
  (t) => [
    foreignKey({
      name: 'purge_journal_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check(
      'purge_journal_action_check',
      sql`${t.action} IN ('destroy_dek', 'delete_blob', 'null_columns', 'anonymize', 'delete_row')`,
    ),
    index('purge_journal_property_purged_idx').on(t.propertyId, t.purgedAt),
  ],
);

export const retentionRun = pgTable(
  'retention_run',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    runAt: instant('run_at').notNull(),
    policyKey: text('policy_key').notNull(),
    itemsCount: integer('items_count').notNull(),
    status: text('status').notNull(),
    error: text('error'),
  },
  (t) => [
    foreignKey({
      name: 'retention_run_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    check('retention_run_status_check', sql`${t.status} IN ('done', 'failed')`),
    index('retention_run_property_run_idx').on(t.propertyId, t.policyKey, t.runAt),
  ],
);
