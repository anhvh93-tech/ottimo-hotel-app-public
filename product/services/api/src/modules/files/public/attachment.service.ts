/**
 * Operational attachments (OpenAPI 0.3.6 B-01; SEC s3-checklist I1–I7) – NOT identity documents (SEC I4:
 * closed `purpose` list, guest-web never calls it). C2: encrypted with a DEK per file (EncryptedBlobService),
 * no trusted device / step-up / c3_access_log.
 *
 * Who may upload / read, per purpose (SEC I1, PO 16/10 E15-02):
 * | purpose          | upload                     | read                                                   |
 * | deposit_receipt  | FD+, SAL, CTV              | FD+; the uploader (SAL/CTV) while the booking is theirs |
 * | penalty_evidence | FD+                        | FD+                                                    |
 * | meter            | FD+, MT                    | FD+                                                    |
 * | work_order       | FD+, HK, MT                | FD+; HK/MT: own uploads (work orders are R2-S4)         |
 * | inspection       | FD+, HK                    | FD+; HK: own uploads                                   |
 * | refund_proof     | OWN, MGR, FDL, FD          | OWN, MGR; FD/FDL: own uploads                          |
 * Wrong role for the purpose on upload → 403 (+ access.denied); not visible on read → 404.
 * Retention (SEC I5) – J16 (`purgeDue`): purge at `retention_anchor_at` + parameter; the anchor is set by
 * the owning flow (`bindTo`/`setRetentionAnchor`: reconciliation, checkout, closing).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { type AttachmentPurpose, ATTACHMENT_PURPOSES } from '../../../db/schema';
import { problem } from '../../../shared/problem';
import { inSavepoint } from '../../../shared/savepoint';
import { localDate } from '../../../shared/time';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { BlobGoneError, EncryptedBlobService } from './encrypted-blob.service';
import type { NormalizedImage } from './image-pipeline';

export { ATTACHMENT_PURPOSES };
export type { AttachmentPurpose };

export interface AttachmentActor {
  userId: string;
  roles: readonly string[];
}

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const MGR_PLUS = ['owner', 'manager'];

export const UPLOAD_ROLES: Record<AttachmentPurpose, readonly string[]> = {
  deposit_receipt: [...FD_PLUS, 'sales_staff', 'collaborator'],
  penalty_evidence: FD_PLUS,
  meter: [...FD_PLUS, 'maintenance'],
  work_order: [...FD_PLUS, 'housekeeping', 'maintenance'],
  inspection: [...FD_PLUS, 'housekeeping'],
  refund_proof: FD_PLUS,
};

/** Read without being the uploader. */
const READ_ALL_ROLES: Record<AttachmentPurpose, readonly string[]> = {
  deposit_receipt: FD_PLUS,
  penalty_evidence: FD_PLUS,
  meter: FD_PLUS,
  work_order: FD_PLUS,
  inspection: FD_PLUS,
  refund_proof: MGR_PLUS,
};

/** Read own uploads. */
const READ_OWN_ROLES: Record<AttachmentPurpose, readonly string[]> = {
  deposit_receipt: ['sales_staff', 'collaborator'],
  penalty_evidence: [],
  meter: [],
  work_order: ['housekeeping', 'maintenance'],
  inspection: ['housekeeping'],
  refund_proof: ['front_desk_lead', 'front_desk'],
};

/**
 * Purposes whose owning flow exists in R2 (money rows of BE-B, penalty evidence of the checkout). Work
 * orders, inspections and meter readings land in Sprint 4/R3: until their record exists an upload could
 * never be bound, so it is refused (SEC FB-R2-SEC-BE-38 option 2) – 422 NOT_IN_LIST.
 */
export const PURPOSES_ACCEPTED_NOW: readonly AttachmentPurpose[] = [
  'deposit_receipt',
  'penalty_evidence',
  'refund_proof',
];

/** SEC I7 – technical limit (counts every purpose). */
export const ATTACHMENTS_PER_USER_PER_DAY = 50;

interface AttachmentRow {
  id: string;
  purpose: AttachmentPurpose;
  reservation_id: string | null;
  blob_key: string;
  mime: 'image/jpeg' | 'image/webp';
  size_bytes: number;
  data_key_id: string;
  uploaded_by: string;
  purged_at: Date | null;
  bound_ref_type: string | null;
  bound_ref_id: string | null;
}

const has = (roles: readonly string[], allowed: readonly string[]) =>
  roles.some((r) => allowed.includes(r));

export function canUpload(roles: readonly string[], purpose: AttachmentPurpose): boolean {
  return has(roles, UPLOAD_ROLES[purpose]);
}

@Injectable()
export class AttachmentService {
  constructor(
    @Inject(EncryptedBlobService) private readonly blobs: EncryptedBlobService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Optional() @Inject(ModuleRef) private readonly moduleRef?: ModuleRef,
  ) {}

  /** Worker / tests without a Nest container: the port given directly. */
  private salesPort?: ReservationSalesPort;

  withSalesPort(port: ReservationSalesPort): this {
    this.salesPort = port;
    return this;
  }

  /**
   * Resolved lazily: the reservations module depends (through folio/payments) on ATTACHMENT_USAGE, so a
   * constructor dependency back to RESERVATION_SALES_PORT would be a provider cycle at bootstrap.
   */
  private get sales(): ReservationSalesPort | undefined {
    if (this.salesPort) return this.salesPort;
    try {
      return this.moduleRef?.get<ReservationSalesPort>(RESERVATION_SALES_PORT, { strict: false });
    } catch {
      return undefined;
    }
  }

  async upload(
    tx: Tx,
    actor: AttachmentActor,
    input: { purpose: AttachmentPurpose; reservationId: string | null },
    image: NormalizedImage,
  ): Promise<{ id: string; purpose: AttachmentPurpose; sizeBytes: number }> {
    const now = this.clock.now();
    // SEC BE-49: count and insert under a per-user lock (two parallel uploads cannot both pass at 49).
    await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [
      `attachment-upload:${actor.userId}`,
    ]);
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM attachment WHERE uploaded_by = $1 AND uploaded_at > $2`,
      [actor.userId, new Date(now.getTime() - 86_400_000)],
    );
    if ((rows[0]?.n ?? 0) >= ATTACHMENTS_PER_USER_PER_DAY) {
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': '3600' } });
    }
    if (input.reservationId) await this.assertReservationVisible(tx, actor, input.reservationId);
    const id = uuidv7();
    const stored = await this.blobs.put(
      tx,
      { purpose: 'attachment', table: 'attachment', recordId: id },
      image,
    );
    await tx.query(
      `INSERT INTO attachment (id, organization_id, property_id, purpose, reservation_id, blob_key, mime,
         size_bytes, ciphertext_sha256, data_key_id, uploaded_by, uploaded_by_role, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        input.purpose,
        input.reservationId,
        stored.blobKey,
        stored.mime,
        stored.sizeBytes,
        stored.ciphertextSha256,
        stored.dataKeyId,
        actor.userId,
        primaryRole(actor.roles, UPLOAD_ROLES[input.purpose]),
        now,
      ],
    );
    return { id, purpose: input.purpose, sizeBytes: stored.sizeBytes };
  }

  /** getAttachment: decrypted bytes when the caller may see this attachment, else 404. */
  async read(
    tx: Tx,
    actor: AttachmentActor,
    id: string,
  ): Promise<{ data: Buffer; mime: 'image/jpeg' | 'image/webp' }> {
    const row = await this.visibleRow(tx, actor, id);
    if (!row) throw problem('NOT_FOUND');
    try {
      const data = await this.blobs.read(tx, {
        table: 'attachment',
        recordId: row.id,
        blobKey: row.blob_key,
        dataKeyId: row.data_key_id,
      });
      return { data, mime: row.mime };
    } catch (err) {
      if (err instanceof BlobGoneError) throw problem('NOT_FOUND');
      throw err;
    }
  }

  /**
   * ARC 4.3 / BE-B `AttachmentUsage`: the id is a live attachment of this property with this purpose, the
   * caller may see it and (when given) it belongs to the booking – else 422 NOT_IN_LIST on `field`.
   */
  async assertUsable(
    tx: Tx,
    actor: AttachmentActor,
    id: string,
    purpose: AttachmentPurpose,
    scope: { reservationId?: string | null; field?: string } = {},
  ): Promise<void> {
    const field = scope.field ?? 'attachmentId';
    const invalid = () =>
      problem('VALIDATION_FAILED', { errors: [{ field, code: 'NOT_IN_LIST' }] });
    if (!UUID.test(id)) throw invalid();
    const row = await this.visibleRow(tx, actor, id);
    if (!row || row.purpose !== purpose) throw invalid();
    if (scope.reservationId && row.reservation_id && row.reservation_id !== scope.reservationId) {
      throw invalid();
    }
    // One file, one money row (a receipt cannot justify two payments).
    if (row.bound_ref_id) throw invalid();
  }

  /**
   * Links the file to the record that uses it (payment, folio_line, approval_request…). One file, one
   * record: binding is a compare-and-set (`bound_ref_id IS NULL`), so two concurrent money rows cannot share
   * a receipt (ARC FB-S3-27 (7)) – the loser gets 422 NOT_IN_LIST.
   */
  async bindTo(
    tx: Tx,
    id: string,
    ref: { type: string; id: string },
    opts: { retentionAnchorAt?: Date; field?: string } = {},
  ): Promise<void> {
    const r = await tx.query(
      `UPDATE attachment SET bound_ref_type = $2, bound_ref_id = $3,
              retention_anchor_at = COALESCE($4, retention_anchor_at)
        WHERE id = $1 AND purged_at IS NULL AND bound_ref_id IS NULL`,
      [id, ref.type, ref.id, opts.retentionAnchorAt ?? null],
    );
    if ((r.rowCount ?? 0) === 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: opts.field ?? 'attachmentId', code: 'NOT_IN_LIST' }],
      });
    }
  }

  /** Start of the retention period (SEC I5): reconciled, checkout, closed… Idempotent. */
  async setRetentionAnchor(
    tx: Tx,
    where: { id?: string; reservationId?: string; purpose: AttachmentPurpose },
    at: Date,
  ): Promise<number> {
    // ARC FB-S3-31 (2): never "every file of this purpose".
    if (!where.id && !where.reservationId) {
      throw new Error('setRetentionAnchor needs an attachment id or a reservation id');
    }
    const r = await tx.query(
      `UPDATE attachment SET retention_anchor_at = $4
        WHERE purpose = $3 AND purged_at IS NULL
          AND ($1::uuid IS NULL OR id = $1) AND ($2::uuid IS NULL OR reservation_id = $2)
          AND (retention_anchor_at IS NULL OR retention_anchor_at < $4)`,
      [where.id ?? null, where.reservationId ?? null, where.purpose, at],
    );
    return r.rowCount ?? 0;
  }

  /**
   * J16 (SEC I5, SEC BE-38): purge attachments whose anchor + retention has passed, and uploads never bound
   * to a record within `attachment_unbound_days`. Each file in its own SAVEPOINT (one bad row does not stop
   * the run). Returns purged count + failures.
   */
  async purgeDue(
    tx: Tx,
    now: Date,
    timezone: string,
  ): Promise<{ purged: number; failed: number; errors: string[] }> {
    const today = localDate(now, timezone);
    const days = await this.params.get<number>(tx, 'deposit_receipt_retention_days', today);
    const months = await this.params.get<number>(tx, 'attachment_ops_retention_months', today);
    const unboundDays = await this.params.get<number>(tx, 'attachment_unbound_days', today);
    const { rows } = await tx.query<{
      id: string;
      blob_key: string;
      data_key_id: string;
      reason: 'retention' | 'unbound';
    }>(
      `SELECT id, blob_key, data_key_id,
              CASE WHEN bound_ref_id IS NULL AND uploaded_at + make_interval(days => $4) <= $1
                   THEN 'unbound' ELSE 'retention' END AS reason
         FROM attachment
        WHERE purged_at IS NULL
          AND ( (bound_ref_id IS NULL AND uploaded_at + make_interval(days => $4) <= $1)
             OR (retention_anchor_at IS NOT NULL
                 AND ((purpose IN ('deposit_receipt', 'refund_proof')
                       AND retention_anchor_at + make_interval(days => $2) <= $1)
                   OR (purpose IN ('work_order', 'inspection', 'penalty_evidence', 'meter')
                       AND retention_anchor_at + make_interval(months => $3) <= $1))))
        ORDER BY id LIMIT 500 FOR UPDATE SKIP LOCKED`,
      [now, days, months, unboundDays],
    );
    let purged = 0;
    const errors: string[] = [];
    for (const row of rows) {
      const err = await inSavepoint(tx, async () => {
        await this.blobs.purge(
          tx,
          {
            blobKey: row.blob_key,
            dataKeyId: row.data_key_id,
            subjectType: 'attachment',
            subjectId: row.id,
          },
          row.reason === 'unbound' ? 'SEC-BE-38' : 'SEC-I5',
        );
        await tx.query(`UPDATE attachment SET purged_at = $2, purge_reason = $3 WHERE id = $1`, [
          row.id,
          now,
          row.reason,
        ]);
      });
      if (err) errors.push(`attachment ${row.id}: ${err.name}`);
      else purged++;
    }
    return { purged, failed: errors.length, errors };
  }

  private async visibleRow(
    tx: Tx,
    actor: AttachmentActor,
    id: string,
  ): Promise<AttachmentRow | null> {
    if (!UUID.test(id)) return null;
    const { rows } = await tx.query<AttachmentRow>(
      `SELECT id, purpose, reservation_id, blob_key, mime, size_bytes, data_key_id, uploaded_by, purged_at,
              bound_ref_type, bound_ref_id
         FROM attachment WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row || row.purged_at) return null;
    if (has(actor.roles, READ_ALL_ROLES[row.purpose])) return row;
    if (row.uploaded_by !== actor.userId || !has(actor.roles, READ_OWN_ROLES[row.purpose])) {
      return null;
    }
    // SAL/CTV: the booking must still be theirs (SEC I1).
    if (row.purpose === 'deposit_receipt' && row.reservation_id) {
      if (!(await this.ownsReservation(tx, actor, row.reservation_id))) return null;
    }
    return row;
  }

  private async assertReservationVisible(
    tx: Tx,
    actor: AttachmentActor,
    reservationId: string,
  ): Promise<void> {
    // Through the reservations port (no read of another zone's table – ARC 4.3).
    const own = this.sales ? await this.sales.ownership(tx, reservationId) : null;
    if (!own) throw problem('NOT_FOUND');
    const staffWide = has(actor.roles, FD_PLUS);
    if (!staffWide && own.createdBy !== actor.userId && own.closerUserId !== actor.userId) {
      throw problem('NOT_FOUND');
    }
  }

  private async ownsReservation(
    tx: Tx,
    actor: AttachmentActor,
    reservationId: string,
  ): Promise<boolean> {
    if (!this.sales) return false;
    const own = await this.sales.ownership(tx, reservationId);
    return !!own && (own.createdBy === actor.userId || own.closerUserId === actor.userId);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function primaryRole(roles: readonly string[], allowed: readonly string[]): string {
  return roles.find((r) => allowed.includes(r)) ?? roles[0] ?? 'unknown';
}
