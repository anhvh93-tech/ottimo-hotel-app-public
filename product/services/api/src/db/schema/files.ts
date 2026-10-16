/**
 * files module tables (erd 4.9 `attachment`, OpenAPI 0.3.6 B-01, SEC s3-checklist I1–I7) – BE-C Sprint 3,
 * migration 0050_crypto_files_be_c.
 *
 * attachment = operational photos that are NOT identity documents (closed `purpose` list, SEC I4). C2:
 * the blob is encrypted with its own DEK (data_key purpose 'attachment'); deleting = destroying that DEK.
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
  uuid,
} from 'drizzle-orm/pg-core';
import { dataKey } from './crypto';
import { instant } from './common';
import { property } from './platform';
import { reservation } from './reservations';

export const ATTACHMENT_PURPOSES = [
  'work_order',
  'inspection',
  'penalty_evidence',
  'deposit_receipt',
  'meter',
  'refund_proof',
] as const;
export type AttachmentPurpose = (typeof ATTACHMENT_PURPOSES)[number];

export const attachment = pgTable(
  'attachment',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    purpose: text('purpose').notNull(),
    reservationId: uuid('reservation_id'),
    /** What the file was bound to after upload (payment, approval_request, work_order…) – bindTo(). */
    boundRefType: text('bound_ref_type'),
    boundRefId: uuid('bound_ref_id'),
    blobKey: text('blob_key').notNull(),
    mime: text('mime').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    ciphertextSha256: text('ciphertext_sha256').notNull(),
    dataKeyId: uuid('data_key_id').notNull(),
    uploadedBy: uuid('uploaded_by').notNull(),
    uploadedByRole: text('uploaded_by_role').notNull(),
    uploadedAt: instant('uploaded_at').notNull(),
    /** Start of the retention period (SEC I5): reconciled at, closed at, checkout… set by the owner module. */
    retentionAnchorAt: instant('retention_anchor_at'),
    purgeAfter: instant('purge_after'),
    purgedAt: instant('purged_at'),
    purgeReason: text('purge_reason'),
  },
  (t) => [
    foreignKey({
      name: 'attachment_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    foreignKey({
      name: 'attachment_reservation_fk',
      columns: [t.propertyId, t.reservationId],
      foreignColumns: [reservation.propertyId, reservation.id],
    }),
    foreignKey({
      name: 'attachment_data_key_fk',
      columns: [t.propertyId, t.dataKeyId],
      foreignColumns: [dataKey.propertyId, dataKey.id],
    }),
    check(
      'attachment_purpose_check',
      sql`${t.purpose} IN ('work_order', 'inspection', 'penalty_evidence', 'deposit_receipt', 'meter', 'refund_proof')`,
    ),
    check(
      'attachment_reservation_check',
      sql`${t.purpose} NOT IN ('deposit_receipt', 'penalty_evidence') OR ${t.reservationId} IS NOT NULL`,
    ),
    check('attachment_mime_check', sql`${t.mime} IN ('image/jpeg', 'image/webp')`),
    check(
      'attachment_purge_reason_check',
      sql`${t.purgeReason} IS NULL OR ${t.purgeReason} IN ('retention', 'manual', 'unbound')`,
    ),
    index('attachment_uploader_idx').on(t.propertyId, t.uploadedBy, t.uploadedAt),
    index('attachment_reservation_idx').on(t.propertyId, t.reservationId),
    // 0053 (ARC FB-S3-27): J16 reads retention_anchor_at (SEC I5) and unbound uploads (SEC BE-38).
    index('attachment_retention_idx')
      .on(t.propertyId, t.retentionAnchorAt)
      .where(sql`${t.purgedAt} IS NULL`),
    index('attachment_unbound_idx')
      .on(t.propertyId, t.uploadedAt)
      .where(sql`${t.purgedAt} IS NULL AND ${t.boundRefId} IS NULL`),
  ],
);

/**
 * 0053 (ARC FB-S3-17, SEC BE-46): ciphertext files to delete AFTER the transaction that destroyed their DEK
 * has committed (a rollback must never lose a file whose key is still alive). Swept after commit and by
 * J16. IDs + opaque blob key only.
 */
export const blobPendingDelete = pgTable(
  'blob_pending_delete',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    organizationId: uuid('organization_id').notNull(),
    propertyId: uuid('property_id').notNull(),
    blobKey: text('blob_key').notNull(),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    policyKey: text('policy_key').notNull(),
    createdAt: instant('created_at').notNull(),
  },
  (t) => [
    foreignKey({
      name: 'blob_pending_delete_property_fk',
      columns: [t.organizationId, t.propertyId],
      foreignColumns: [property.organizationId, property.id],
    }),
    index('blob_pending_delete_property_idx').on(t.propertyId, t.id),
  ],
);
