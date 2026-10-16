/**
 * Encrypted image blobs (ADR-013; SEC C2, C5, I2): one DEK per file through CryptoService, ciphertext in the
 * BlobStore under a random name. Used by registration (document_image), guest-portal (guest uploads) and
 * attachments – one code path, "delete = destroy DEK".
 *
 * AAD of a blob = `<table>|blob|<record id>|<kek version>` – a blob copied onto another record does not open.
 * The blob is written before COMMIT: a rolled-back use case leaves an orphan CIPHERTEXT whose DEK row was
 * rolled back too (unreadable forever). Purge destroys the DEK in the transaction and deletes the file only
 * after COMMIT (queue `blob_pending_delete`, swept after commit and by J16).
 */
import { createHash } from 'node:crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import type { DataKeyPurpose } from '../../../db/schema';
import { CryptoService } from '../../crypto/public/crypto.service';
import { BLOB_STORE, type BlobStore } from '../internal/blob-store';
import type { NormalizedImage } from './image-pipeline';

export interface StoredBlob {
  blobKey: string;
  dataKeyId: string;
  ciphertextSha256: string;
  sizeBytes: number;
  mime: NormalizedImage['mime'];
}

export interface BlobRef {
  table: string;
  recordId: string;
  blobKey: string;
  dataKeyId: string;
}

/** The blob or its key is gone (purged): callers answer 404. */
export class BlobGoneError extends Error {
  constructor() {
    super('blob purged');
    this.name = 'BlobGoneError';
  }
}

@Injectable()
export class EncryptedBlobService {
  constructor(
    @Inject(CryptoService) private readonly crypto: CryptoService,
    @Inject(BLOB_STORE) private readonly store: BlobStore,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(DATABASE) private readonly db?: Database,
  ) {}

  async put(
    tx: Tx,
    req: { purpose: DataKeyPurpose; table: string; recordId: string },
    image: NormalizedImage,
  ): Promise<StoredBlob> {
    const { dataKeyId, ciphertext } = await this.crypto.seal(
      tx,
      {
        purpose: req.purpose,
        subjectId: req.recordId,
        aad: { table: req.table, column: 'blob', recordId: req.recordId },
      },
      image.data,
    );
    const blobKey = await this.store.put(ciphertext);
    return {
      blobKey,
      dataKeyId,
      ciphertextSha256: createHash('sha256').update(ciphertext).digest('hex'),
      sizeBytes: image.data.length,
      mime: image.mime,
    };
  }

  /** Decrypted image bytes; BlobGoneError when the DEK was destroyed or the file is missing. */
  async read(tx: Tx, ref: BlobRef): Promise<Buffer> {
    const ciphertext = await this.store.get(ref.blobKey);
    if (!ciphertext) throw new BlobGoneError();
    try {
      return await this.crypto.decrypt(
        tx,
        ref.dataKeyId,
        { table: ref.table, column: 'blob', recordId: ref.recordId },
        ciphertext,
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'DataKeyDestroyedError') throw new BlobGoneError();
      throw err;
    }
  }

  /**
   * Crypto-shredding of one file, in the caller's transaction: destroy its DEK (+ purge_journal
   * `destroy_dek`) – the data is unreadable from then on – and QUEUE the ciphertext file for deletion
   * (`blob_pending_delete`). The file itself is deleted only after COMMIT (`sweepPending`): a transaction that
   * rolls back keeps both its DEK and its file (ARC FB-R2-ARC-BE-S3-17, SEC FB-R2-SEC-BE-46).
   * Idempotent; returns false when the DEK was already destroyed.
   */
  async purge(
    tx: Tx,
    ref: { blobKey: string; dataKeyId: string; subjectType: string; subjectId: string },
    policyKey: string,
  ): Promise<boolean> {
    const destroyed = await this.crypto.destroy(tx, ref.dataKeyId, {
      subjectType: ref.subjectType,
      subjectId: ref.subjectId,
      policyKey,
    });
    if (destroyed) {
      await tx.query(
        `INSERT INTO blob_pending_delete (organization_id, property_id, blob_key, subject_type, subject_id,
           policy_key, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          ref.blobKey,
          ref.subjectType,
          ref.subjectId,
          policyKey,
          this.clock.now(),
        ],
      );
    }
    return destroyed;
  }

  /**
   * Deletes queued files of the property of `tx` (committed purges only – the queue rows of a rolled-back
   * transaction never existed) and journals `delete_blob`. Run by J16 and right after the commit of the
   * request that purged (`sweepAfterCommit`). Returns the number of files handled.
   */
  async sweepPending(tx: Tx, limit = 200): Promise<number> {
    // DELETE … RETURNING claims the rows (ottimo_app has no UPDATE on the queue, so no FOR UPDATE): a
    // concurrent sweeper waits for this one and then finds them gone. A rollback after a file was removed
    // puts the row back; the next sweep deletes an already missing file (idempotent).
    const { rows } = await tx.query<{
      blob_key: string;
      subject_type: string;
      subject_id: string;
      policy_key: string;
    }>(
      `DELETE FROM blob_pending_delete
        WHERE id IN (SELECT id FROM blob_pending_delete ORDER BY id LIMIT $1)
        RETURNING blob_key, subject_type, subject_id, policy_key`,
      [limit],
    );
    for (const r of rows) {
      await this.store.delete(r.blob_key);
      await tx.query(
        `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key,
           action, purged_at)
         VALUES ($1, $2, $3, $4, $5, 'delete_blob', $6)`,
        [
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          r.subject_type,
          r.subject_id,
          r.policy_key,
          this.clock.now(),
        ],
      );
    }
    return rows.length;
  }

  /**
   * After the request's transaction committed: sweep the queue of that property in a new transaction.
   * Best effort – a failure leaves the rows for J16 (the data is already unreadable: DEK destroyed).
   */
  async sweepAfterCommit(ctx: TenantContext): Promise<void> {
    if (!this.db || !ctx.propertyId) return;
    try {
      await this.db.withContext(ctx, (tx) => this.sweepPending(tx));
    } catch (err) {
      // Never fails the request that already committed; J16 retries within the hour.
      // Error class and SQLSTATE only (no message: it could echo values).
      console.warn(
        JSON.stringify({
          level: 'warn',
          msg: 'blob sweep deferred to J16',
          err: (err as Error).name,
          code: (err as { code?: string }).code,
        }),
      );
    }
  }
}
