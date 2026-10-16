/**
 * BE-C unit tests without a database (SEC s3-checklist B1, C1; SR-KEY-01/03/07; SR-FILE-01…03):
 * AES-256-GCM + AAD binding, nonce uniqueness, keyring parsing, the fake CryptoService contract, the image
 * pipeline (magic bytes, HEIC/HTML refused, EXIF removed, 40 MP limit) and the multipart parser.
 */
import { randomBytes } from 'node:crypto';
import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { fieldAad, gcmOpen, gcmSeal } from '../src/modules/crypto/internal/envelope-crypto.service';
import { KeyringError, keyringFromEnv } from '../src/modules/crypto/internal/keyring';
import { FakeCryptoService } from '../src/modules/crypto/public/crypto.fake';
import {
  DataKeyDestroyedError,
  DecryptionError,
} from '../src/modules/crypto/public/crypto.service';
import { parseStringAad } from '../src/modules/crypto/public/port-adapters';
import { normalizeImage, sniffImageType } from '../src/modules/files/public/image-pipeline';
import { parseMultipart, textPart, fileParts } from '../src/modules/files/public/multipart';
import { ProblemError } from '../src/shared/problem';
import type { Tx } from '../src/db/database';

const tx = {} as Tx;

async function problemOf(p: Promise<unknown>): Promise<{ code: string; errors: unknown }> {
  try {
    await p;
  } catch (err) {
    if (err instanceof ProblemError) return { code: err.code, errors: err.options.errors };
    throw err;
  }
  throw new Error('expected a problem');
}

describe('AES-256-GCM envelope primitives (SR-KEY-01)', () => {
  const key = randomBytes(32);
  const aad = fieldAad({ table: 'guest_document', column: 'doc_number_enc', recordId: 'r1' }, 1);

  it('round-trips and the ciphertext does not contain the plaintext', () => {
    const sealed = gcmSeal(key, Buffer.from('B12345678'), aad);
    expect(sealed.includes(Buffer.from('B12345678'))).toBe(false);
    expect(gcmOpen(key, sealed, aad).toString()).toBe('B12345678');
  });

  it('another AAD (table, column, record or key version) refuses to decrypt', () => {
    const sealed = gcmSeal(key, Buffer.from('079123456789'), aad);
    for (const other of [
      fieldAad({ table: 'guest_document', column: 'visa_number_enc', recordId: 'r1' }, 1),
      fieldAad({ table: 'guest_document', column: 'doc_number_enc', recordId: 'r2' }, 1),
      fieldAad({ table: 'approval_request', column: 'doc_number_enc', recordId: 'r1' }, 1),
      fieldAad({ table: 'guest_document', column: 'doc_number_enc', recordId: 'r1' }, 2),
    ]) {
      expect(() => gcmOpen(key, sealed, other)).toThrow(DecryptionError);
    }
  });

  it('a modified ciphertext or another key fails (tag check)', () => {
    const sealed = gcmSeal(key, Buffer.from('x'), aad);
    const bad = Buffer.from(sealed);
    bad[bad.length - 1] = (bad[bad.length - 1] ?? 0) ^ 1;
    expect(() => gcmOpen(key, bad, aad)).toThrow(DecryptionError);
    expect(() => gcmOpen(randomBytes(32), sealed, aad)).toThrow(DecryptionError);
  });

  it('never reuses a nonce (10^5 encryptions)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100_000; i++) {
      seen.add(gcmSeal(key, Buffer.from('a'), aad).subarray(0, 12).toString('hex'));
    }
    expect(seen.size).toBe(100_000);
  });

  it('refuses an AAD part containing the separator', () => {
    expect(() => fieldAad({ table: 'a|b', column: 'c', recordId: 'd' }, 1)).toThrow();
  });
});

describe('keyring from the environment (SR-KEY-03/07)', () => {
  const kek = randomBytes(32).toString('base64');
  const idKey = 'k'.repeat(40);

  it('loads the current KEK, older versions and the ID hash key', () => {
    const old = randomBytes(32).toString('base64');
    const k = keyringFromEnv({
      APP_ENV: 'production',
      DATA_KEK_CURRENT: kek,
      DATA_KEK_VERSION: '2',
      DATA_KEK_1: old,
      ID_HASH_KEY: idKey,
    });
    expect(k.currentVersion).toBe(2);
    expect(k.versions).toEqual([1, 2]);
    expect(k.kek(1).toString('base64')).toBe(old);
    expect(k.ephemeral).toBe(false);
  });

  it('staging/production refuse a missing KEK or ID hash key; errors never contain the value', () => {
    expect(() => keyringFromEnv({ APP_ENV: 'production', ID_HASH_KEY: idKey })).toThrow(
      KeyringError,
    );
    expect(() => keyringFromEnv({ APP_ENV: 'staging', DATA_KEK_CURRENT: kek })).toThrow(
      KeyringError,
    );
    try {
      keyringFromEnv({ APP_ENV: 'dev', DATA_KEK_CURRENT: 'c2hvcnQ=', ID_HASH_KEY: idKey });
    } catch (err) {
      expect(String(err)).not.toContain('c2hvcnQ=');
    }
  });

  it('dev/test without keys run with random per-process keys (flagged ephemeral)', () => {
    const k = keyringFromEnv({ APP_ENV: 'test' });
    expect(k.ephemeral).toBe(true);
    expect(k.kek(1)).toHaveLength(32);
  });

  it('a KEK of the wrong length is refused', () => {
    expect(() =>
      keyringFromEnv({ APP_ENV: 'dev', DATA_KEK_CURRENT: randomBytes(16).toString('base64') }),
    ).toThrow(/32 bytes/);
  });
});

describe('FakeCryptoService – same contract for BE-A/BE-B unit tests', () => {
  it('seal/decrypt, AAD binding, destroy makes the data unreadable, blind index is stable', async () => {
    const c = new FakeCryptoService();
    const aad = { table: 'approval_request', column: 'refund_account_enc', recordId: 'a1' };
    const s = await c.seal(tx, { purpose: 'refund_account', subjectId: 'a1', aad }, '0123456789');
    expect(await c.decryptText(tx, s.dataKeyId, aad, s.ciphertext)).toBe('0123456789');
    await expect(
      c.decryptText(tx, s.dataKeyId, { ...aad, recordId: 'a2' }, s.ciphertext),
    ).rejects.toThrow(DecryptionError);
    expect(
      await c.destroy(tx, s.dataKeyId, { subjectType: 'x', subjectId: 'a1', policyKey: 'T09' }),
    ).toBe(true);
    expect(
      await c.destroy(tx, s.dataKeyId, { subjectType: 'x', subjectId: 'a1', policyKey: 'T09' }),
    ).toBe(false);
    await expect(c.decrypt(tx, s.dataKeyId, aad, s.ciphertext)).rejects.toThrow(
      DataKeyDestroyedError,
    );
    expect(c.blindIndex('B1234567')).toBe(c.blindIndex('B1234567'));
    expect(c.blindIndex('B1234567')).not.toBe(c.keyedHash('child_name', 'B1234567'));
  });

  it("parses BE-B's string AAD", () => {
    expect(parseStringAad('approval_request|refund_account_enc|abc|1')).toEqual({
      table: 'approval_request',
      column: 'refund_account_enc',
      recordId: 'abc',
    });
  });
});

async function jpegWithExif(): Promise<Buffer> {
  return sharp({ create: { width: 64, height: 48, channels: 3, background: '#88aacc' } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'GPS 10.77,106.70 secret', Artist: 'Phone camera' } })
    .toBuffer();
}

/** PNG whose header claims width × height (CRC fixed) – decompression-bomb style input. */
async function pngClaiming(width: number, height: number): Promise<Buffer> {
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } })
    .png()
    .toBuffer();
  const out = Buffer.from(png);
  // IHDR data starts at 16 (8 signature + 4 length + 4 type); CRC covers type + data (13 bytes).
  out.writeUInt32BE(width, 16);
  out.writeUInt32BE(height, 20);
  out.writeUInt32BE(crc32(out.subarray(12, 29)) >>> 0, 29);
  return out;
}

describe('image pipeline (SEC C1, SR-FILE-01…03)', () => {
  it('sniffs JPEG/PNG/WebP by magic bytes only', async () => {
    expect(sniffImageType(await jpegWithExif())).toBe('jpeg');
    expect(sniffImageType(await pngClaiming(4, 4))).toBe('png');
    const webp = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#000' } })
      .webp()
      .toBuffer();
    expect(sniffImageType(webp)).toBe('webp');
    expect(sniffImageType(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
  });

  it('a ".jpg" that is HTML, a PDF and a HEIC header are refused with FILE_TYPE', async () => {
    for (const bad of [
      Buffer.from('<html><body>not an image</body></html>'),
      Buffer.from('%PDF-1.7\n1 0 obj'),
      Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic'), randomBytes(64)]),
    ]) {
      const p = await problemOf(normalizeImage(bad, 'image'));
      expect(p.code).toBe('FILE_REJECTED');
      expect(p.errors).toEqual([{ field: 'image', code: 'FILE_TYPE' }]);
    }
  });

  it('a JPEG magic number on a non-JPEG body is refused (decoder must agree)', async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.from('<svg onload=x>')]);
    expect((await problemOf(normalizeImage(fake))).code).toBe('FILE_REJECTED');
  });

  it('re-encodes and removes EXIF/GPS metadata', async () => {
    const input = await jpegWithExif();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const out = await normalizeImage(input);
    expect(out.mime).toBe('image/jpeg');
    const meta = await sharp(out.data).metadata();
    expect(meta.exif).toBeUndefined();
    expect(out.data.includes(Buffer.from('secret'))).toBe(false);
    expect([meta.width, meta.height]).toEqual([64, 48]);
  });

  it('refuses more than 40 MP and more than 10 MB', async () => {
    const bomb = await pngClaiming(10_000, 5_001);
    expect((await problemOf(normalizeImage(bomb))).errors).toEqual([
      { field: 'image', code: 'FILE_TOO_LARGE' },
    ]);
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(10 * 1024 * 1024)]);
    expect((await problemOf(normalizeImage(big))).errors).toEqual([
      { field: 'image', code: 'FILE_TOO_LARGE' },
    ]);
  });
});

describe('multipart parser', () => {
  const boundary = 'XyZ123';
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="data"\r\n\r\n{"a":1}\r\n`),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="p.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
    ),
    Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x0d, 0x0a]),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  it('splits text and file parts, binary-safe', () => {
    const parts = parseMultipart(body, `multipart/form-data; boundary=${boundary}`);
    expect(textPart(parts, 'data')).toBe('{"a":1}');
    expect(fileParts(parts, 'image')[0]).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x0d, 0x0a]));
  });

  it('refuses a body without boundary or a broken body', () => {
    expect(() => parseMultipart(body, 'multipart/form-data')).toThrow(ProblemError);
    expect(() =>
      parseMultipart(Buffer.from('junk'), `multipart/form-data; boundary=${boundary}`),
    ).toThrow(ProblemError);
  });
});
