/**
 * CryptoService on the real PostgreSQL (ADR-013; SEC B1; SR-KEY-01/02/05/09; SR-RET-03):
 * no clear value in the database, DEK per record bound to the property (RLS), destroy = crypto-shredding
 * + purge_journal, KEK rotation (re-wrap) keeps old values readable, ottimo_app cannot delete keys/journal.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FixedClock } from '../../src/clock';
import type { Database } from '../../src/db/database';
import { EnvelopeCryptoService } from '../../src/modules/crypto/internal/envelope-crypto.service';
import { staticKeyring } from '../../src/modules/crypto/internal/keyring';
import { DataKeyDestroyedError } from '../../src/modules/crypto/public/crypto.service';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('CryptoService – envelope encryption on PostgreSQL', () => {
  let db: Database;
  let t: TestTenant;
  const clock = new FixedClock(T0);
  const kek1 = randomBytes(32);
  const kek2 = randomBytes(32);
  const idKey = randomBytes(32);
  const v1 = new EnvelopeCryptoService(staticKeyring(1, new Map([[1, kek1]]), idKey), clock);

  beforeAll(async () => {
    db = appDatabase();
    t = await createTenant(db, { properties: 2 });
  });
  afterAll(async () => db.close());

  const aad = (id: string) => ({ table: 'guest_document', column: 'doc_number_enc', recordId: id });

  it('stores only the wrapped DEK; the ciphertext never contains the clear value', async () => {
    const id = uuidv7();
    const { dataKeyId, ciphertext } = await db.withContext(t.ctx(0), (tx) =>
      v1.seal(tx, { purpose: 'guest_document', subjectId: id, aad: aad(id) }, 'B98765432'),
    );
    expect(ciphertext.includes(Buffer.from('B98765432'))).toBe(false);
    const row = await db.withContext(t.ctx(0), async (tx) => {
      const r = await tx.query<{ wrapped_key: Buffer; kek_version: number; purpose: string }>(
        'SELECT wrapped_key, kek_version, purpose FROM data_key WHERE id = $1',
        [dataKeyId],
      );
      return r.rows[0];
    });
    expect(row?.purpose).toBe('guest_document');
    expect(row?.kek_version).toBe(1);
    expect(row?.wrapped_key.length).toBe(12 + 16 + 32);
    expect(
      await db.withContext(t.ctx(0), (tx) => v1.decryptText(tx, dataKeyId, aad(id), ciphertext)),
    ).toBe('B98765432');
  });

  it('a DEK of another property is invisible (RLS) – cannot decrypt from there', async () => {
    const id = uuidv7();
    const s = await db.withContext(t.ctx(0), (tx) =>
      v1.seal(tx, { purpose: 'guest_document', subjectId: id, aad: aad(id) }, 'secret'),
    );
    await expect(
      db.withContext(t.ctx(1), (tx) => v1.decrypt(tx, s.dataKeyId, aad(id), s.ciphertext)),
    ).rejects.toThrow(DataKeyDestroyedError);
  });

  it('destroy = wrapped_key NULL + destroyed_at + purge_journal; afterwards unreadable; idempotent', async () => {
    const id = uuidv7();
    const s = await db.withContext(t.ctx(0), (tx) =>
      v1.seal(tx, { purpose: 'document_image', subjectId: id, aad: aad(id) }, 'img'),
    );
    const first = await db.withContext(t.ctx(0), (tx) =>
      v1.destroy(tx, s.dataKeyId, {
        subjectType: 'document_image',
        subjectId: id,
        policyKey: 'T01',
      }),
    );
    const again = await db.withContext(t.ctx(0), (tx) =>
      v1.destroy(tx, s.dataKeyId, {
        subjectType: 'document_image',
        subjectId: id,
        policyKey: 'T01',
      }),
    );
    expect([first, again]).toEqual([true, false]);
    const state = await db.withContext(t.ctx(0), async (tx) => {
      const k = await tx.query('SELECT wrapped_key, destroyed_at FROM data_key WHERE id = $1', [
        s.dataKeyId,
      ]);
      const j = await tx.query(
        `SELECT subject_type, policy_key, action FROM purge_journal WHERE subject_id = $1`,
        [id],
      );
      return { key: k.rows[0]!, journal: j.rows };
    });
    expect(state.key.wrapped_key).toBeNull();
    expect(state.key.destroyed_at).toEqual(T0);
    expect(state.journal).toEqual([
      { subject_type: 'document_image', policy_key: 'T01', action: 'destroy_dek' },
    ]);
    await expect(
      db.withContext(t.ctx(0), (tx) => v1.decrypt(tx, s.dataKeyId, aad(id), s.ciphertext)),
    ).rejects.toThrow(DataKeyDestroyedError);
  });

  it('KEK rotation: v2 with the old KEK loaded re-wraps; old ciphertexts stay readable with v2 only', async () => {
    const id = uuidv7();
    const s = await db.withContext(t.ctx(0), (tx) =>
      v1.seal(tx, { purpose: 'guest_document', subjectId: id, aad: aad(id) }, 'old-value'),
    );
    const during = new EnvelopeCryptoService(
      staticKeyring(
        2,
        new Map([
          [1, kek1],
          [2, kek2],
        ]),
        idKey,
      ),
      clock,
    );
    let n = 0;
    for (;;) {
      const k = await db.withContext(t.ctx(0), (tx) => during.rewrap(tx, 100));
      n += k;
      if (k === 0) break;
    }
    expect(n).toBeGreaterThan(0);
    const after = new EnvelopeCryptoService(staticKeyring(2, new Map([[2, kek2]]), idKey), clock);
    expect(
      await db.withContext(t.ctx(0), (tx) =>
        after.decryptText(tx, s.dataKeyId, aad(id), s.ciphertext),
      ),
    ).toBe('old-value');
    const version = await db.withContext(t.ctx(0), async (tx) => {
      const r = await tx.query<{ kek_version: number }>(
        'SELECT kek_version FROM data_key WHERE id = $1',
        [s.dataKeyId],
      );
      return r.rows[0]?.kek_version;
    });
    expect(version).toBe(2);
  });

  it('blind index: HMAC-SHA256 with ID_HASH_KEY, stable, differs from the keyed hash of other purposes', () => {
    expect(v1.blindIndex('079123456789')).toMatch(/^[0-9a-f]{64}$/);
    expect(v1.blindIndex('079123456789')).toBe(v1.blindIndex('079123456789'));
    expect(v1.keyedHash('child_name', '079123456789')).not.toBe(v1.blindIndex('079123456789'));
  });

  it('ottimo_app cannot delete keys nor rewrite the purge journal (append-only)', async () => {
    const { rows } = await db.pool.query<{ t: string; d: boolean; u: boolean }>(
      `SELECT t, has_table_privilege('ottimo_app', t, 'DELETE') AS d, has_any_column_privilege('ottimo_app', t, 'UPDATE') AS u
         FROM unnest(ARRAY['data_key', 'purge_journal', 'retention_run', 'consent_record']) AS t ORDER BY t`,
    );
    expect(rows).toEqual([
      { t: 'consent_record', d: false, u: false },
      { t: 'data_key', d: false, u: true },
      { t: 'purge_journal', d: false, u: false },
      { t: 'retention_run', d: false, u: false },
    ]);
  });
});
