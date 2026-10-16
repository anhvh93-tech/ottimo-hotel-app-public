/**
 * Envelope encryption over PostgreSQL `data_key` (ADR-013) – the production CryptoService.
 *
 * Wrapped DEK  = nonce(12) | tag(16) | AES-256-GCM_KEK(DEK)   AAD "data_key|<dekId>|<kekVersion>"
 * Ciphertext   = 0x01 | kekVersion(uint16 BE) | nonce(12) | tag(16) | AES-256-GCM_DEK(plaintext)
 *                AAD "<table>|<column>|<recordId>|<kekVersion>" (SR-KEY-01) – the version is the one the
 *                DEK was wrapped with when the value was sealed, kept in the header so a KEK rotation
 *                (re-wrap) does not invalidate stored values.
 * Nonces: 96 random bits per encryption (node:crypto CSPRNG).
 */
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import {
  type CryptoService,
  type DataKeyRequest,
  DataKeyDestroyedError,
  DecryptionError,
  type DestroyJournal,
  type FieldAad,
  type Sealed,
} from '../public/crypto.service';
import type { Keyring } from './keyring';

export const KEYRING = Symbol('KEYRING');

const FORMAT_V1 = 0x01;
const NONCE = 12;
const TAG = 16;
const HEADER = 1 + 2 + NONCE + TAG;

export function gcmSeal(key: Buffer, plaintext: Buffer, aad: string): Buffer {
  const nonce = randomBytes(NONCE);
  const c = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: TAG });
  c.setAAD(Buffer.from(aad, 'utf8'));
  const ct = Buffer.concat([c.update(plaintext), c.final()]);
  return Buffer.concat([nonce, c.getAuthTag(), ct]);
}

export function gcmOpen(key: Buffer, sealed: Buffer, aad: string): Buffer {
  if (sealed.length < NONCE + TAG) throw new DecryptionError();
  const d = createDecipheriv('aes-256-gcm', key, sealed.subarray(0, NONCE), {
    authTagLength: TAG,
  });
  d.setAAD(Buffer.from(aad, 'utf8'));
  d.setAuthTag(sealed.subarray(NONCE, NONCE + TAG));
  try {
    return Buffer.concat([d.update(sealed.subarray(NONCE + TAG)), d.final()]);
  } catch {
    throw new DecryptionError();
  }
}

export function fieldAad(aad: FieldAad, kekVersion: number): string {
  for (const part of [aad.table, aad.column, aad.recordId]) {
    if (!part || part.includes('|')) throw new Error('invalid AAD part');
  }
  return `${aad.table}|${aad.column}|${aad.recordId}|${kekVersion}`;
}

function wrapAad(dekId: string, kekVersion: number): string {
  return `data_key|${dekId}|${kekVersion}`;
}

interface KeyRow {
  wrapped_key: Buffer | null;
  kek_version: number;
  destroyed_at: Date | null;
}

@Injectable()
export class EnvelopeCryptoService implements CryptoService {
  constructor(
    @Inject(KEYRING) private readonly keyring: Keyring,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async createDataKey(tx: Tx, req: DataKeyRequest): Promise<string> {
    const { organizationId, propertyId } = tx.ctx;
    if (!organizationId || !propertyId) throw new Error('data_key needs a property context');
    const id = uuidv7();
    const version = this.keyring.currentVersion;
    const dek = randomBytes(32);
    try {
      const wrapped = gcmSeal(this.keyring.kek(version), dek, wrapAad(id, version));
      await tx.query(
        `INSERT INTO data_key (id, organization_id, property_id, purpose, subject_id, wrapped_key,
           kek_version, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          organizationId,
          propertyId,
          req.purpose,
          req.subjectId,
          wrapped,
          version,
          this.clock.now(),
          req.expiresAt ?? null,
        ],
      );
    } finally {
      dek.fill(0);
    }
    return id;
  }

  async seal(
    tx: Tx,
    req: DataKeyRequest & { aad: FieldAad },
    plaintext: string | Buffer,
  ): Promise<Sealed> {
    const dataKeyId = await this.createDataKey(tx, req);
    return { dataKeyId, ciphertext: await this.encrypt(tx, dataKeyId, req.aad, plaintext) };
  }

  async encrypt(
    tx: Tx,
    dataKeyId: string,
    aad: FieldAad,
    plaintext: string | Buffer,
  ): Promise<Buffer> {
    const { dek, version } = await this.unwrap(tx, dataKeyId);
    try {
      const body = gcmSeal(
        dek,
        typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext,
        fieldAad(aad, version),
      );
      const head = Buffer.alloc(3);
      head.writeUInt8(FORMAT_V1, 0);
      head.writeUInt16BE(version, 1);
      return Buffer.concat([head, body]);
    } finally {
      dek.fill(0);
    }
  }

  async decrypt(tx: Tx, dataKeyId: string, aad: FieldAad, ciphertext: Buffer): Promise<Buffer> {
    if (ciphertext.length < HEADER || ciphertext.readUInt8(0) !== FORMAT_V1) {
      throw new DecryptionError();
    }
    const sealedVersion = ciphertext.readUInt16BE(1);
    const { dek } = await this.unwrap(tx, dataKeyId);
    try {
      return gcmOpen(dek, ciphertext.subarray(3), fieldAad(aad, sealedVersion));
    } finally {
      dek.fill(0);
    }
  }

  async decryptText(tx: Tx, dataKeyId: string, aad: FieldAad, ciphertext: Buffer): Promise<string> {
    return (await this.decrypt(tx, dataKeyId, aad, ciphertext)).toString('utf8');
  }

  async destroy(tx: Tx, dataKeyId: string, journal: DestroyJournal): Promise<boolean> {
    const now = this.clock.now();
    const r = await tx.query(
      `UPDATE data_key SET wrapped_key = NULL, destroyed_at = $2
        WHERE id = $1 AND destroyed_at IS NULL`,
      [dataKeyId, now],
    );
    if ((r.rowCount ?? 0) === 0) return false;
    await tx.query(
      `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key,
         action, purged_at)
       VALUES ($1, $2, $3, $4, $5, 'destroy_dek', $6)`,
      [
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        journal.subjectType,
        journal.subjectId,
        journal.policyKey,
        now,
      ],
    );
    return true;
  }

  async isDestroyed(tx: Tx, dataKeyId: string): Promise<boolean> {
    const { rows } = await tx.query<{ destroyed: boolean }>(
      'SELECT destroyed_at IS NOT NULL AS destroyed FROM data_key WHERE id = $1',
      [dataKeyId],
    );
    return rows[0]?.destroyed ?? true;
  }

  blindIndex(value: string): string {
    return createHmac('sha256', this.keyring.idHashKey).update(value, 'utf8').digest('hex');
  }

  keyedHash(purpose: 'child_name', value: string): string {
    const key = Buffer.from(
      hkdfSync('sha256', this.keyring.idHashKey, Buffer.alloc(0), `ottimo:${purpose}:v1`, 32),
    );
    return createHmac('sha256', key).update(value, 'utf8').digest('hex');
  }

  async rewrap(tx: Tx, limit = 500): Promise<number> {
    const current = this.keyring.currentVersion;
    const { rows } = await tx.query<{ id: string; wrapped_key: Buffer; kek_version: number }>(
      `SELECT id, wrapped_key, kek_version FROM data_key
        WHERE destroyed_at IS NULL AND kek_version <> $1
        ORDER BY id LIMIT $2 FOR UPDATE`,
      [current, limit],
    );
    let n = 0;
    for (const row of rows) {
      const dek = gcmOpen(
        this.keyring.kek(row.kek_version),
        row.wrapped_key,
        wrapAad(row.id, row.kek_version),
      );
      try {
        const wrapped = gcmSeal(this.keyring.kek(current), dek, wrapAad(row.id, current));
        await tx.query('UPDATE data_key SET wrapped_key = $2, kek_version = $3 WHERE id = $1', [
          row.id,
          wrapped,
          current,
        ]);
        n++;
      } finally {
        dek.fill(0);
      }
    }
    return n;
  }

  private async unwrap(tx: Tx, dataKeyId: string): Promise<{ dek: Buffer; version: number }> {
    const { rows } = await tx.query<KeyRow>(
      'SELECT wrapped_key, kek_version, destroyed_at FROM data_key WHERE id = $1',
      [dataKeyId],
    );
    const row = rows[0];
    if (!row || row.destroyed_at || !row.wrapped_key) throw new DataKeyDestroyedError();
    const dek = gcmOpen(
      this.keyring.kek(row.kek_version),
      row.wrapped_key,
      wrapAad(dataKeyId, row.kek_version),
    );
    return { dek, version: row.kek_version };
  }
}
