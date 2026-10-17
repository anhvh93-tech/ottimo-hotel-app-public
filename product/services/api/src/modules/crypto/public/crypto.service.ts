/**
 * CryptoService – the ONE way to encrypt C3 data (ADR-013, SR-KEY-01/02/07; SEC s3-checklist B1).
 *
 * Envelope encryption: every C3 record/file has its own data-encryption key (DEK, row in `data_key`),
 * wrapped by the KEK (env DATA_KEK_CURRENT, never in the DB). Values are AES-256-GCM with a random 96-bit
 * nonce and AAD = `table|column|record_id|kek_version` (a ciphertext moved to another row/column does not
 * decrypt). Destroy = crypto-shredding: wrapped_key NULL + destroyed_at + a purge_journal row – the data can
 * no longer be read (backups: ≤ 35 days, SR-KEY-09).
 *
 * Rules for callers (BE-A, BE-B, BE-C):
 * - Only this service reads `data_key` or the KEK (test/crypto-boundary.test.ts fails otherwise).
 * - Every method runs in the caller's transaction (`tx`) – a rolled-back use case leaves no key behind.
 * - The record id used in the AAD must be the id of the row that stores the ciphertext.
 * - One DEK per record: `seal()` creates the DEK; further columns of the same record use `encrypt()` with
 *   that `dataKeyId`.
 * - Never log, return or put in audit/outbox the plaintext or the ciphertext.
 * Tests of other modules can use `FakeCryptoService` (crypto.fake.ts) – same contract, no DB.
 */
import type { Tx } from '../../../db/database';
import type { DataKeyPurpose } from '../../../db/schema';

export type { DataKeyPurpose } from '../../../db/schema';

/** Where a ciphertext lives – bound into the AAD. */
export interface FieldAad {
  table: string;
  column: string;
  recordId: string;
}

export interface DataKeyRequest {
  purpose: DataKeyPurpose;
  /** Record the key protects (guest_document.id, document_image.id, approval_request.id…). */
  subjectId: string;
  /** Optional planned destruction time (informative; the owner module/J16 destroys it). */
  expiresAt?: Date;
}

/** purge_journal entry written with a destroy (SR-RET-03): IDs only, no personal data. */
export interface DestroyJournal {
  subjectType: string;
  subjectId: string;
  /** T01…T18, guest_request, consent_withdrawn, replaced, party_removed, void… */
  policyKey: string;
}

export interface Sealed {
  dataKeyId: string;
  ciphertext: Buffer;
}

/** The DEK was destroyed (or is not visible in this property): the data is gone – map to 404, never 500. */
/** Domains of `keyedHash` (one HKDF sub-key each). */
/** `guest_doc` (0.3.7 nhóm D A, erd 4.4): the v1 document key of a P05 guest profile (`guest.id_doc_hmac`). */
export type KeyedHashPurpose = 'child_name' | 'idempotency' | 'guest_doc';

export class DataKeyDestroyedError extends Error {
  constructor() {
    super('data key destroyed or not found');
    this.name = 'DataKeyDestroyedError';
  }
}

/** Ciphertext/AAD mismatch or tampering (GCM tag failed). */
export class DecryptionError extends Error {
  constructor() {
    super('decryption failed');
    this.name = 'DecryptionError';
  }
}

export abstract class CryptoService {
  /** New DEK wrapped by the current KEK, in the caller's transaction. Returns its id. */
  abstract createDataKey(tx: Tx, req: DataKeyRequest): Promise<string>;

  /** createDataKey + encrypt: the usual call for the first C3 value of a record. */
  abstract seal(
    tx: Tx,
    req: DataKeyRequest & { aad: FieldAad },
    plaintext: string | Buffer,
  ): Promise<Sealed>;

  /** Encrypt with an existing DEK (other columns/files of the same record). */
  abstract encrypt(
    tx: Tx,
    dataKeyId: string,
    aad: FieldAad,
    plaintext: string | Buffer,
  ): Promise<Buffer>;

  /** Throws DataKeyDestroyedError (destroyed / other property) or DecryptionError (AAD mismatch). */
  abstract decrypt(tx: Tx, dataKeyId: string, aad: FieldAad, ciphertext: Buffer): Promise<Buffer>;

  abstract decryptText(
    tx: Tx,
    dataKeyId: string,
    aad: FieldAad,
    ciphertext: Buffer,
  ): Promise<string>;

  /**
   * Crypto-shredding: wrapped_key NULL + destroyed_at (Clock) + purge_journal `destroy_dek`.
   * Idempotent: false when the key was already destroyed.
   */
  abstract destroy(tx: Tx, dataKeyId: string, journal: DestroyJournal): Promise<boolean>;

  abstract isDestroyed(tx: Tx, dataKeyId: string): Promise<boolean>;

  /** HMAC-SHA256(ID_HASH_KEY) hex of a normalised value – blind index for document numbers only. */
  abstract blindIndex(value: string): string;

  /**
   * Keyed hash for another purpose (duplicate detection without decrypting, e.g. a child's name + birth
   * year – US-022 AC3; the idempotency digest of a request carrying C3 – ARC FB-S3-19). The key is derived from ID_HASH_KEY with HKDF and the purpose as `info`, so values
   * of different purposes never compare equal (ADR-013 point 5 – one key per purpose).
   */
  abstract keyedHash(purpose: KeyedHashPurpose, value: string): string;

  /**
   * KEK rotation (SR-KEY-05): re-wrap up to `limit` live DEKs of the current property that are wrapped by
   * an older KEK version. Existing ciphertexts stay valid (their AAD carries the version they were sealed
   * with). Returns the number of keys re-wrapped.
   */
  abstract rewrap(tx: Tx, limit?: number): Promise<number>;
}
