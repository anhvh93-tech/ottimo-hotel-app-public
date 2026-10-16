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
  // Caddy in the internal Docker network (hosting-plan) – required in staging/production (FB-R2-SEC-BE-02).
  TRUST_PROXY: '172.18.0.2',
  // The 3 browser origins (SR-SES-04) – required in staging/production.
  ADMIN_BASE_URL: 'https://desk.example.invalid',
  STAFF_BASE_URL: 'https://staff.example.invalid/',
  GUEST_BASE_URL: 'https://g.example.invalid',
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

  it('refuses the removed CLOCK_OVERRIDE everywhere and mock/sandbox adapters in production', () => {
    expect(() => loadConfig({ ...prod, CLOCK_OVERRIDE: '2026-10-15T09:00:00+07:00' })).toThrow(
      /CLOCK_OVERRIDE/,
    );
    expect(() => loadConfig({ ...base, CLOCK_OVERRIDE: '2026-10-15T09:00:00+07:00' })).toThrow(
      /CLOCK_OVERRIDE is no longer supported/,
    );
    expect(loadConfig({ ...base, CLOCK_OVERRIDE: '' }).clockMode).toBe('system');
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

describe('CLOCK_MODE, test support, cookies (ADR-008, SR-SECR-05)', () => {
  const token = 't'.repeat(40);

  it('defaults to the system clock and allows mutable outside production only', () => {
    expect(loadConfig(base).clockMode).toBe('system');
    expect(loadConfig({ ...base, CLOCK_MODE: 'mutable' }).clockMode).toBe('mutable');
    expect(loadConfig({ ...staging, CLOCK_MODE: 'mutable' }).clockMode).toBe('mutable');
    expect(() => loadConfig({ ...prod, CLOCK_MODE: 'mutable' })).toThrow(
      /CLOCK_MODE must be system/,
    );
    expect(() => loadConfig({ ...base, CLOCK_MODE: 'fixed' })).toThrow(/CLOCK_MODE must be one of/);
  });

  it('enables test support only with INCLUDE_TEST_SUPPORT=1 and a long token, never in production', () => {
    expect(loadConfig(base).testSupport.enabled).toBe(false);
    const on = loadConfig({ ...base, INCLUDE_TEST_SUPPORT: '1', TEST_SUPPORT_TOKEN: token });
    expect(on.testSupport).toEqual({ enabled: true, token });
    expect(() => loadConfig({ ...base, INCLUDE_TEST_SUPPORT: '1' })).toThrow(/TEST_SUPPORT_TOKEN/);
    expect(() => loadConfig({ ...base, INCLUDE_TEST_SUPPORT: 'yes' })).toThrow(
      /INCLUDE_TEST_SUPPORT/,
    );
    expect(() =>
      loadConfig({ ...prod, INCLUDE_TEST_SUPPORT: '1', TEST_SUPPORT_TOKEN: token }),
    ).toThrow(/forbidden in production/);
    expect(() => loadConfig({ ...prod, TEST_SUPPORT_TOKEN: token })).toThrow(/TEST_SUPPORT_TOKEN/);
  });

  it('keeps the test token distinct from real keys', () => {
    const env = {
      ...staging,
      INCLUDE_TEST_SUPPORT: '1',
      TEST_SUPPORT_TOKEN: staging.SESSION_SECRET,
    };
    expect(() => loadConfig(env)).toThrow(/TEST_SUPPORT_TOKEN must differ from SESSION_SECRET/);
  });

  it('allows COOKIE_SECURE_PREFIX=false only in dev/test', () => {
    expect(loadConfig(base).cookieSecurePrefix).toBe(true);
    expect(loadConfig({ ...base, COOKIE_SECURE_PREFIX: 'false' }).cookieSecurePrefix).toBe(false);
    expect(() => loadConfig({ ...staging, COOKIE_SECURE_PREFIX: 'false' })).toThrow(
      /COOKIE_SECURE_PREFIX/,
    );
  });
});

describe('TRUST_PROXY required and internal-only in staging/production (FB-R2-SEC-BE-01/02)', () => {
  it('requires TRUST_PROXY in staging and production', () => {
    for (const env of [prod, staging]) {
      expect(() => loadConfig(without(env, 'TRUST_PROXY'))).toThrow(/TRUST_PROXY is required/);
      expect(() => loadConfig({ ...env, TRUST_PROXY: 'false' })).toThrow(/TRUST_PROXY is required/);
    }
    expect(loadConfig(base).trustProxy).toBe(false);
  });

  it('refuses /0 and too-wide ranges in every environment', () => {
    for (const wide of ['0.0.0.0/0', '::/0', '0.0.0.0/1', '10.0.0.0/7', 'fd00::/15']) {
      expect(() => parseTrustProxy(wide)).toThrow(/too wide/);
      expect(() => loadConfig({ ...base, TRUST_PROXY: wide })).toThrow(ConfigError);
    }
  });

  it('accepts only loopback, RFC 1918 and fc00::/7 in staging/production', () => {
    for (const ok of [
      '172.18.0.2',
      '172.18.0.0/16',
      '127.0.0.1',
      '10.0.0.0/8',
      '192.168.1.0/24',
      'fd00::/16',
      '::1',
    ]) {
      expect(loadConfig({ ...staging, TRUST_PROXY: ok }).trustProxy).toEqual([ok]);
    }
    for (const bad of [
      '8.8.8.8',
      '172.0.0.0/8',
      '172.32.0.1',
      '2001:db8::1',
      '172.18.0.2,1.2.3.4',
    ]) {
      expect(() => loadConfig({ ...prod, TRUST_PROXY: bad })).toThrow(/internal addresses only/);
    }
    // dev may list a public proxy (local experiments), still not a too-wide range
    expect(loadConfig({ ...base, TRUST_PROXY: '8.8.8.8' }).trustProxy).toEqual(['8.8.8.8']);
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
    expect(parseTrustProxy('fd00::/16,::1')).toEqual(['fd00::/16', '::1']);
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

describe('allowed origins (SR-SES-04, architecture 17)', () => {
  it('normalises the 3 base URLs to origins: staff = admin + PWA, guest separate', () => {
    expect(loadConfig(prod).allowedOrigins).toEqual({
      staff: ['https://desk.example.invalid', 'https://staff.example.invalid'],
      guest: ['https://g.example.invalid'],
    });
  });

  it('requires all three, https only, in staging and production', () => {
    for (const env of [prod, staging]) {
      for (const name of ['ADMIN_BASE_URL', 'STAFF_BASE_URL', 'GUEST_BASE_URL']) {
        expect(() => loadConfig(without(env, name))).toThrow(new RegExp(name));
      }
      expect(() => loadConfig({ ...env, GUEST_BASE_URL: 'http://g.example.invalid' })).toThrow(
        /https/,
      );
    }
    expect(() => loadConfig({ ...prod, ADMIN_BASE_URL: 'javascript:alert(1)' })).toThrow(
      /http\(s\) URL/,
    );
  });

  it('dev/test: optional; APP_BASE_URL is accepted as the admin origin', () => {
    expect(loadConfig(base).allowedOrigins).toEqual({ staff: [], guest: [] });
    expect(
      loadConfig({
        ...base,
        APP_BASE_URL: 'http://localhost:8081',
        GUEST_BASE_URL: 'http://localhost:8083',
      }).allowedOrigins,
    ).toEqual({ staff: ['http://localhost:8081'], guest: ['http://localhost:8083'] });
  });
});
