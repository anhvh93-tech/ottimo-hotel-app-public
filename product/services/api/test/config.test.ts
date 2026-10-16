import { describe, expect, it } from 'vitest';
import {
  ConfigError,
  REQUIRED_SECRETS,
  loadConfig,
  parseTrustProxy,
  resolveFileSecrets,
} from '../src/config';

/** Distinct 32-character test keys – one per purpose (ADR-013 point 5). */
const key = (c: string) => c.repeat(32);
const KEK = Buffer.alloc(32, 1).toString('base64');
const base = { APP_ENV: 'dev', DATABASE_URL: 'postgres://ottimo_app:x@localhost:5432/ottimo' };
const prod = {
  ...base,
  APP_ENV: 'production',
  SESSION_SECRET: key('s'),
  ID_HASH_KEY: key('i'),
  LOG_IP_HMAC_KEY: key('l'),
  GUEST_CODE_SIGNING_KEY: key('g'),
  DATA_KEK_CURRENT: KEK,
};
const staging = { ...prod, APP_ENV: 'staging' };
const without = (env: Record<string, string>, name: string) =>
  Object.fromEntries(Object.entries(env).filter(([k]) => k !== name));

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

  it('requires GUEST_CODE_SIGNING_KEY in staging and production (W17, BUG-R1-SEC-07)', () => {
    expect(REQUIRED_SECRETS).toContain('GUEST_CODE_SIGNING_KEY');
    expect(loadConfig(staging).appEnv).toBe('staging');
    for (const env of [prod, staging]) {
      expect(() => loadConfig(without(env, 'GUEST_CODE_SIGNING_KEY'))).toThrow(
        /GUEST_CODE_SIGNING_KEY is required/,
      );
      expect(() => loadConfig({ ...env, GUEST_CODE_SIGNING_KEY: '' })).toThrow(
        /GUEST_CODE_SIGNING_KEY is required/,
      );
      expect(() => loadConfig({ ...env, GUEST_CODE_SIGNING_KEY: 'g'.repeat(31) })).toThrow(
        /GUEST_CODE_SIGNING_KEY must be at least 32/,
      );
    }
  });

  it('requires every per-purpose key in staging and production', () => {
    for (const name of REQUIRED_SECRETS) {
      for (const env of [prod, staging]) {
        expect(() => loadConfig({ ...env, [name]: '' })).toThrow(new RegExp(`${name} is required`));
      }
    }
  });

  it('allows empty GUEST_CODE_SIGNING_KEY in dev/test but still checks its length when set', () => {
    expect(loadConfig({ ...base, APP_ENV: 'test' }).appEnv).toBe('test');
    expect(() => loadConfig({ ...base, GUEST_CODE_SIGNING_KEY: 'short' })).toThrow(
      /GUEST_CODE_SIGNING_KEY/,
    );
  });

  it('accepts GUEST_CODE_SIGNING_KEY from a Docker secret file', () => {
    const noKey = without(prod, 'GUEST_CODE_SIGNING_KEY');
    const env = resolveFileSecrets(
      { ...noKey, GUEST_CODE_SIGNING_KEY_FILE: '/run/secrets/guest_code' },
      () => `${key('g')}\n`,
    );
    expect(loadConfig(env).appEnv).toBe('production');
  });

  it('refuses the same value for two purposes, in any environment (ADR-013 point 5)', () => {
    expect(() => loadConfig({ ...prod, GUEST_CODE_SIGNING_KEY: prod.ID_HASH_KEY })).toThrow(
      /GUEST_CODE_SIGNING_KEY must differ from ID_HASH_KEY/,
    );
    expect(() => loadConfig({ ...staging, LOG_IP_HMAC_KEY: prod.SESSION_SECRET })).toThrow(
      /LOG_IP_HMAC_KEY must differ from SESSION_SECRET/,
    );
    expect(() => loadConfig({ ...prod, ID_HASH_KEY: KEK })).toThrow(
      /DATA_KEK_CURRENT must differ from ID_HASH_KEY/,
    );
    const dev = { ...base, ID_HASH_KEY: key('x'), GUEST_CODE_SIGNING_KEY: key('x') };
    expect(() => loadConfig(dev)).toThrow(/one key per purpose/);
    try {
      loadConfig({ ...prod, GUEST_CODE_SIGNING_KEY: prod.ID_HASH_KEY });
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).not.toContain(prod.ID_HASH_KEY);
    }
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

  it('applies the shared integration rules from @ottimo/integrations (W9, README 1.3)', () => {
    const enabledButOff = {
      ...prod,
      PAYMENT_METHODS_ENABLED: 'vietqr',
      PAYMENT_VIETQR_MODE: 'off',
    };
    expect(() => loadConfig(enabledButOff)).toThrow(/PAYMENT_VIETQR_MODE must be production/);
    expect(() => loadConfig({ ...prod, CHANNEL_MOCK_SCENARIO: 'ok' })).toThrow(
      /CHANNEL_MOCK_SCENARIO/,
    );
    expect(() => loadConfig({ ...base, PAYMENT_VIETQR_MODE: 'sandbox' })).toThrow(ConfigError);
    const devExample = { ...base, PAYMENT_METHODS_ENABLED: 'vietqr', PAYMENT_VIETQR_MODE: 'off' };
    expect(loadConfig({ ...devExample, CHANNEL_PROVIDER: 'mock' }).appEnv).toBe('dev');
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

  it('rejects malformed IPs and prefixes, accepts IPv6', () => {
    for (const bad of [
      '...',
      '999.1.1.1',
      '10.0.0.0/33',
      '10.0.0.0/8/1',
      '10.0.0.1/',
      '::g',
      '1.2.3',
    ]) {
      expect(() => parseTrustProxy(bad)).toThrow(ConfigError);
    }
    expect(parseTrustProxy('fd00::/8,::1')).toEqual(['fd00::/8', '::1']);
    expect(() => parseTrustProxy('fd00::/129')).toThrow(ConfigError);
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
