import { describe, expect, it } from 'vitest';
import { IntegrationError } from '../contracts/common.js';
import { EnvCredentialProvider } from './env-credential-provider.js';

const files: Record<string, string> = {
  '/run/secrets/vnpay_hash': 'hash-from-file\n',
  '/run/secrets/empty': '\n',
};
const readFile = (p: string) => {
  const v = files[p];
  if (v === undefined) throw new Error(`ENOENT ${p}`);
  return v;
};

const env = {
  APP_ENV: 'dev',
  SESSION_SECRET: 's'.repeat(32),
  PAYMENT_VNPAY_MODE: 'sandbox',
  PAYMENT_VNPAY_TMN_CODE: 'TMN01',
  PAYMENT_VNPAY_HASH_SECRET_FILE: '/run/secrets/vnpay_hash',
  PAYMENT_VNPAY_PAY_URL: '',
  PAYMENT_MOMO_MODE: 'off',
  CHANNEL_PROVIDER: 'mock',
};

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'none';
  } catch (e) {
    expect(e).toBeInstanceOf(IntegrationError);
    return (e as IntegrationError).code;
  }
}

describe('EnvCredentialProvider', () => {
  it('returns the prefix group with names stripped and reads <NAME>_FILE', async () => {
    const p = new EnvCredentialProvider(env, { readFile });
    const c = await p.get('env:PAYMENT_VNPAY');
    expect(c).toEqual({ MODE: 'sandbox', TMN_CODE: 'TMN01', HASH_SECRET: 'hash-from-file' });
    expect(Object.isFrozen(c)).toBe(true);
    expect(Object.keys(c)).not.toContain('HASH_SECRET_FILE');
  });

  it('accepts an env already resolved by config.ts resolveFileSecrets (same value in X and X_FILE)', async () => {
    const resolved = { ...env, PAYMENT_VNPAY_HASH_SECRET: 'hash-from-file' };
    const c = await new EnvCredentialProvider(resolved, { readFile }).get('env:PAYMENT_VNPAY');
    expect(c.HASH_SECRET).toBe('hash-from-file');
  });

  it('refuses X and X_FILE with different values, without leaking either', async () => {
    const both = { ...env, PAYMENT_VNPAY_HASH_SECRET: 'other-value' };
    const p = new EnvCredentialProvider(both, { readFile });
    const err = await p.get('env:PAYMENT_VNPAY').catch((e: unknown) => e as IntegrationError);
    expect(err).toBeInstanceOf(IntegrationError);
    expect((err as IntegrationError).code).toBe('CONFIG');
    expect((err as IntegrationError).message).toMatch(/PAYMENT_VNPAY_HASH_SECRET_FILE/);
    expect((err as IntegrationError).message).not.toMatch(
      /other-value|hash-from-file|run\/secrets/,
    );
  });

  it('reports an unreadable secret file as CONFIG without the path', async () => {
    const p = new EnvCredentialProvider({ PAYMENT_MOMO_SECRET_KEY_FILE: '/missing' }, { readFile });
    const err = (await p.get('env:PAYMENT_MOMO').catch((e: unknown) => e)) as IntegrationError;
    expect(err.code).toBe('CONFIG');
    expect(err.message).not.toContain('/missing');
  });

  it('refuses refs outside the integration groups (core secrets stay out of reach)', async () => {
    const p = new EnvCredentialProvider(env, { readFile });
    expect(await codeOf(p.get('env:SESSION'))).toBe('CONFIG');
    expect(await codeOf(p.get('env:APP'))).toBe('CONFIG');
    expect(await codeOf(p.get('PAYMENT_VNPAY'))).toBe('CONFIG');
    expect(await codeOf(p.get('env:payment_vnpay'))).toBe('CONFIG');
    expect(await codeOf(p.get('env:PAYMENT_'))).toBe('CONFIG');
  });

  it('treats empty values and empty files as unset; nothing configured → CONFIG', async () => {
    const p = new EnvCredentialProvider(
      { EINVOICE_MISA_APP_ID: '', EINVOICE_MISA_PASSWORD_FILE: '/run/secrets/empty' },
      { readFile },
    );
    expect(await codeOf(p.get('env:EINVOICE_MISA'))).toBe('CONFIG');
  });

  it('snapshots env at construction and caches per ref', async () => {
    const live: Record<string, string> = { CHANNEL_PROVIDER: 'mock' };
    let reads = 0;
    const p = new EnvCredentialProvider(
      { ...live, CHANNEL_BEDS24_REFRESH_TOKEN_FILE: '/run/secrets/vnpay_hash' },
      { readFile: (path) => (reads++, readFile(path)) },
    );
    live.CHANNEL_PROVIDER = 'beds24';
    expect((await p.get('env:CHANNEL')).PROVIDER).toBe('mock');
    await p.get('env:CHANNEL');
    expect(reads).toBe(1);
  });
});
