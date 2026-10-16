/**
 * Encrypted image blobs (ADR-013; SEC C2, C5, I2): one DEK per file through CryptoService, ciphertext in the
 * BlobStore under a random name. Used by registration (document_image), guest-portal (guest uploads) and
 * attachments – one code path, "delete = destroy DEK".
 *
 * AAD of a blob = `<table>|blob|<record id>|<kek version>` – a blob copied onto another record does not open.
 * The blob is written before COMMIT: a rolled-back use case leaves an orphan CIPHERTEXT whose DEK row was
 * rolled back too (unreadable forever); purge deletes the file after destroying the DEK.
 */
import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
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
   * Crypto-shredding of one file: destroy its DEK (+ purge_journal destroy_dek), delete the ciphertext
   * (+ purge_journal delete_blob). Idempotent; returns false when the DEK was already destroyed.
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
    await this.store.delete(ref.blobKey);
    if (destroyed) {
      await tx.query(
        `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key,
           action, purged_at)
         VALUES ($1, $2, $3, $4, $5, 'delete_blob', $6)`,
        [
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          ref.subjectType,
          ref.subjectId,
          policyKey,
          this.clock.now(),
        ],
      );
    }
    return destroyed;
  }
}
