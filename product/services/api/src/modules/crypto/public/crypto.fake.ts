/**
 * In-memory CryptoService for unit tests of other modules (BE-A, BE-B) – same contract as the real one
 * (AES-256-GCM, AAD binding, destroy = unreadable, blind index) but keys live in a Map instead of
 * `data_key`, so no database and no purge_journal. Never wire it in a running api/worker.
 *
 *   const crypto = new FakeCryptoService();
 *   const { dataKeyId, ciphertext } = await crypto.seal(tx, { purpose: 'refund_account',
 *     subjectId: approvalId, aad: { table: 'approval_request', column: 'refund_account_enc',
 *     recordId: approvalId } }, '0123456789');
 */
import { createHmac, randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { fieldAad, gcmOpen, gcmSeal } from '../internal/envelope-crypto.service';
import {
  type CryptoService,
  type KeyedHashPurpose,
  type DataKeyRequest,
  DataKeyDestroyedError,
  DecryptionError,
  type DestroyJournal,
  type FieldAad,
  type Sealed,
} from './crypto.service';

export class FakeCryptoService implements CryptoService {
  /** dataKeyId → DEK (null = destroyed). Exposed for assertions. */
  readonly keys = new Map<string, Buffer | null>();
  readonly journal: Array<DestroyJournal & { dataKeyId: string }> = [];
  private readonly hashKey = randomBytes(32);

  async createDataKey(): Promise<string> {
    const id = uuidv7();
    this.keys.set(id, randomBytes(32));
    return id;
  }

  async seal(
    tx: Tx,
    req: DataKeyRequest & { aad: FieldAad },
    plaintext: string | Buffer,
  ): Promise<Sealed> {
    const dataKeyId = await this.createDataKey();
    return { dataKeyId, ciphertext: await this.encrypt(tx, dataKeyId, req.aad, plaintext) };
  }

  async encrypt(
    _tx: Tx,
    dataKeyId: string,
    aad: FieldAad,
    plaintext: string | Buffer,
  ): Promise<Buffer> {
    const dek = this.dek(dataKeyId);
    const head = Buffer.from([0x01, 0x00, 0x01]);
    const body = gcmSeal(
      dek,
      typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext,
      fieldAad(aad, 1),
    );
    return Buffer.concat([head, body]);
  }

  async decrypt(_tx: Tx, dataKeyId: string, aad: FieldAad, ciphertext: Buffer): Promise<Buffer> {
    if (ciphertext.length < 3) throw new DecryptionError();
    return gcmOpen(this.dek(dataKeyId), ciphertext.subarray(3), fieldAad(aad, 1));
  }

  async decryptText(tx: Tx, dataKeyId: string, aad: FieldAad, ciphertext: Buffer): Promise<string> {
    return (await this.decrypt(tx, dataKeyId, aad, ciphertext)).toString('utf8');
  }

  async destroy(_tx: Tx, dataKeyId: string, journal: DestroyJournal): Promise<boolean> {
    if (!this.keys.get(dataKeyId)) return false;
    this.keys.set(dataKeyId, null);
    this.journal.push({ ...journal, dataKeyId });
    return true;
  }

  async isDestroyed(_tx: Tx, dataKeyId: string): Promise<boolean> {
    return !this.keys.get(dataKeyId);
  }

  blindIndex(value: string): string {
    return createHmac('sha256', this.hashKey).update(value, 'utf8').digest('hex');
  }

  keyedHash(purpose: KeyedHashPurpose, value: string): string {
    return createHmac('sha256', this.hashKey).update(`${purpose}|${value}`, 'utf8').digest('hex');
  }

  async rewrap(): Promise<number> {
    return 0;
  }

  private dek(id: string): Buffer {
    const k = this.keys.get(id);
    if (!k) throw new DataKeyDestroyedError();
    return k;
  }
}
