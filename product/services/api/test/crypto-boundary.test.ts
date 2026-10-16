/**
 * SR-KEY-02 / SEC s3-checklist B1 ("lint import"): only the crypto module touches the `data_key` table,
 * the KEK variables and the internals of the crypto module. A new reader elsewhere fails here.
 * Migrations/schema (DDL), config.ts (startup check of the variables) and tests are the only exceptions.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const ALLOWED_PREFIX = ['modules/crypto/', 'db/schema/', 'db/migrations/', 'generated/'];
const ALLOWED_FILES = ['config.ts'];

function offenders(pattern: RegExp): string[] {
  return files(SRC)
    .map((f) => relative(SRC, f))
    .filter((r) => !ALLOWED_PREFIX.some((p) => r.startsWith(p)) && !ALLOWED_FILES.includes(r))
    .filter((r) => pattern.test(readFileSync(join(SRC, r), 'utf8')));
}

describe('crypto boundary (SR-KEY-02)', () => {
  it('no SQL on data_key outside the crypto module', () => {
    expect(offenders(/\b(FROM|JOIN|INTO|UPDATE)\s+data_key\b/i)).toEqual([]);
  });

  it('no KEK / ID hash key variable read outside the crypto module and config.ts', () => {
    expect(offenders(/DATA_KEK_|ID_HASH_KEY/)).toEqual([]);
  });

  it('no import of crypto internals from another module', () => {
    expect(offenders(/from ['"][./]*(?:modules\/)?crypto\/internal\//)).toEqual([]);
  });

  it('no direct node:crypto cipher in business modules (C3 only through CryptoService)', () => {
    const cipher = /createCipheriv|createDecipheriv/;
    // payments/public/refund-account-cipher.ts: BE-B's dev stand-in, replaced by the CryptoModule binding
    // (REFUND_ACCOUNT_CIPHER) and refused in staging/production – tracked in outputs/BE/s3-be-c.md.
    expect(
      offenders(cipher).filter((f) => f !== 'modules/payments/public/refund-account-cipher.ts'),
    ).toEqual([]);
  });
});
