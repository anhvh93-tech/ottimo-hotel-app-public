import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig, parseTrustProxy, resolveFileSecrets } from '../src/config';

const KEY32 = 'k'.repeat(32);
const KEK = Buffer.alloc(32, 1).toString('base64');
const base = { APP_ENV: 'dev', DATABASE_URL: 'postgres://ottimo_app:x@localhost:5432/ottimo' };
const prod = {
  ...base,
  APP_ENV: 'production',
  SESSION_SECRET: KEY32,
  ID_HASH_KEY: KEY32,
  LOG_IP_HMAC_KEY: KEY32,
  DATA_KEK_CURRENT: KEK,
};

describe('loadConfig (SR-SECR-05)', () => {
  it('accepts a minimal dev config with empty keys', () => {
    const c = loadConfig(base);
    expect(c.appEnv).toBe('dev');
    expect(c.trustProxy).toBe(false);
  });

  it('rejects a missing or unknown APP_ENV', () => {
    expect(() => loadConfig({ ...base, APP_ENV: undefined })).toThrow(ConfigError);
    expect(() => loadConfig({ ...base, APP_ENV: 'development' })).toThrow(ConfigError);
  });

  it('accepts a complete production config', () => {
    expect(loadConfig(prod).appEnv).toBe('production');
  });

  it('stops production when a key is missing or too short', () => {
    expect(() => loadConfig({ ...prod, SESSION_SECRET: '' })).toThrow(/SESSION_SECRET/);
    expect(() => loadConfig({ ...prod, LOG_IP_HMAC_KEY: 'short' })).toThrow(/LOG_IP_HMAC_KEY/);
    expect(() => loadConfig({ ...prod, DATA_KEK_CURRENT: 'abc' })).toThrow(/DATA_KEK_CURRENT/);
  });

  it('forbids CLOCK_OVERRIDE and mock/sandbox adapters in production', () => {
    expect(() => loadConfig({ ...prod, CLOCK_OVERRIDE: '2026-10-15T09:00:00+07:00' })).toThrow(
      /CLOCK_OVERRIDE/,
    );
    expect(() => loadConfig({ ...prod, PAYMENT_VNPAY_MODE: 'mock' })).toThrow(/PAYMENT_VNPAY_MODE/);
    const sandbox = { ...prod, PAYMENT_MOMO_MODE: 'sandbox' };
    expect(() => loadConfig(sandbox)).toThrow(/PAYMENT_MOMO_MODE/);
    const live = { ...prod, PAYMENT_VNPAY_MODE: 'production', PAYMENT_MOMO_MODE: 'off' };
    expect(loadConfig(live).appEnv).toBe('production');
  });

  it('never puts a secret value in the error message', () => {
    try {
      loadConfig({ ...prod, SESSION_SECRET: 'tooShortSecretValue' });
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).not.toContain('tooShortSecretValue');
    }
  });
});

describe('parseTrustProxy (FB-R1-ARC-OPS-04)', () => {
  it('defaults to trusting nobody', () => {
    expect(parseTrustProxy(undefined)).toBe(false);
    expect(parseTrustProxy('')).toBe(false);
  });

  it('refuses "true" and hop counts, parses IP/CIDR lists', () => {
    expect(() => parseTrustProxy('true')).toThrow(ConfigError);
    expect(() => parseTrustProxy('1')).toThrow(ConfigError);
    expect(parseTrustProxy('172.30.0.10, 10.0.0.0/8')).toEqual(['172.30.0.10', '10.0.0.0/8']);
    expect(() => parseTrustProxy('caddy')).toThrow(ConfigError);
  });
});

describe('resolveFileSecrets (FB-R1-SEC-OPS-10)', () => {
  it('reads X from X_FILE', () => {
    const env = resolveFileSecrets({ SESSION_SECRET_FILE: '/run/secrets/s' }, () => 'v\n');
    expect(env.SESSION_SECRET).toBe('v');
  });

  it('refuses X and X_FILE together', () => {
    expect(() =>
      resolveFileSecrets({ SESSION_SECRET: 'a', SESSION_SECRET_FILE: '/x' }, () => 'b'),
    ).toThrow(ConfigError);
  });
});
