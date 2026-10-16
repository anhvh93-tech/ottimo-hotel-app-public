import { describe, expect, it } from 'vitest';
import { IntegrationError } from '../contracts/common.js';
import { assertSafeConfig, findUnsafeIntegrationConfig } from './safe-config.js';

// Values copied from product/.env.example (integration part).
const devExample = {
  CHANNEL_PROVIDER: 'off',
  CHANNEL_MOCK_SCENARIO: 'ok',
  PAYMENT_METHODS_ENABLED: 'vietqr',
  PAYMENT_MOCK_SCENARIO: 'ok',
  PAYMENT_VIETQR_MODE: 'off',
  PAYMENT_VNPAY_MODE: 'off',
  PAYMENT_MOMO_MODE: 'off',
  BANKFEED_PROVIDER: 'off',
  EINVOICE_PROVIDER: 'off',
  DOORLOCK_PROVIDER: 'manual',
  EMAIL_PROVIDER: 'mock',
  ZALO_PROVIDER: 'manual_copy',
  BLOBSTORE_PROVIDER: 'local',
};

const prodOk = {
  PAYMENT_METHODS_ENABLED: 'vietqr,vnpay',
  PAYMENT_VIETQR_MODE: 'production',
  PAYMENT_VNPAY_MODE: 'production',
  PAYMENT_MOMO_MODE: 'off',
  CHANNEL_PROVIDER: 'beds24',
  BANKFEED_PROVIDER: 'off',
  EINVOICE_PROVIDER: 'off',
  DOORLOCK_PROVIDER: 'manual',
  EMAIL_PROVIDER: 'ses',
  ZALO_PROVIDER: 'manual_copy',
};

describe('findUnsafeIntegrationConfig / assertSafeConfig (README 1.3)', () => {
  it('accepts .env.example in dev, test and staging, and an empty env everywhere', () => {
    for (const appEnv of ['dev', 'test', 'staging']) {
      expect(findUnsafeIntegrationConfig(devExample, appEnv)).toEqual([]);
    }
    for (const appEnv of ['dev', 'test', 'staging', 'production']) {
      expect(() => assertSafeConfig({}, appEnv)).not.toThrow();
    }
  });

  it('accepts a correct production config (off is always valid)', () => {
    expect(findUnsafeIntegrationConfig(prodOk, 'production')).toEqual([]);
  });

  it('rule (a): production refuses any *_PROVIDER/*_MODE at mock or sandbox, including future selectors', () => {
    const cases: Record<string, string>[] = [
      { PAYMENT_VNPAY_MODE: 'sandbox' },
      { PAYMENT_VIETQR_MODE: 'mock', PAYMENT_METHODS_ENABLED: '' },
      { BANKFEED_PROVIDER: 'mock' },
      { CHANNEL_PROVIDER: 'mock' },
      { DOORLOCK_PROVIDER: 'mock' },
      { EMAIL_PROVIDER: 'mock' },
      { SMS_PROVIDER: 'sandbox' },
      { BLOBSTORE_PROVIDER: 'MOCK' }, // FB-R2-SEC-INT-05a: case-insensitive for unknown selectors
      { SMS_PROVIDER: 'Sandbox' },
    ];
    for (const c of cases) {
      const [name] = Object.keys(c);
      expect(() => assertSafeConfig({ ...prodOk, ...c }, 'production')).toThrow(
        new RegExp(name as string),
      );
      expect(
        findUnsafeIntegrationConfig({ ...prodOk, PAYMENT_VNPAY_MODE: 'sandbox', ...c }, 'staging'),
      ).toEqual([]);
    }
  });

  it('rule (b): every enabled method must be at MODE=production in production', () => {
    const p = findUnsafeIntegrationConfig(
      { ...prodOk, PAYMENT_METHODS_ENABLED: 'vietqr,vnpay,momo' },
      'production',
    );
    expect(p).toEqual([
      'PAYMENT_MOMO_MODE must be production when momo is in PAYMENT_METHODS_ENABLED',
    ]);
    // .env.example copied to production unchanged → refused (vietqr enabled but off)
    expect(() => assertSafeConfig(devExample, 'production')).toThrow(
      /PAYMENT_VIETQR_MODE must be production/,
    );
    // dev: enabled-but-off only hides the method
    expect(findUnsafeIntegrationConfig({ PAYMENT_METHODS_ENABLED: 'vietqr' }, 'dev')).toEqual([]);
  });

  it('FB-R2-SEC-INT-05b: VNPay/MoMo at MODE=production refused outside production; VietQR allowed', () => {
    for (const appEnv of ['dev', 'test', 'staging']) {
      expect(findUnsafeIntegrationConfig({ PAYMENT_VNPAY_MODE: 'production' }, appEnv)).toEqual([
        'PAYMENT_VNPAY_MODE=production is only allowed when APP_ENV=production',
      ]);
      expect(findUnsafeIntegrationConfig({ PAYMENT_MOMO_MODE: 'production' }, appEnv)).toHaveLength(
        1,
      );
      expect(findUnsafeIntegrationConfig({ PAYMENT_VIETQR_MODE: 'production' }, appEnv)).toEqual(
        [],
      );
    }
    expect(findUnsafeIntegrationConfig(prodOk, 'production')).toEqual([]);
  });

  it('production refuses *_MOCK_SCENARIO', () => {
    expect(() =>
      assertSafeConfig({ ...prodOk, CHANNEL_MOCK_SCENARIO: 'ok' }, 'production'),
    ).toThrow(/CHANNEL_MOCK_SCENARIO/);
    expect(
      findUnsafeIntegrationConfig({ ...prodOk, CHANNEL_MOCK_SCENARIO: '' }, 'production'),
    ).toEqual([]);
  });

  it('all environments: unknown selector values, gateways and methods are refused', () => {
    expect(findUnsafeIntegrationConfig({ PAYMENT_VIETQR_MODE: 'sandbox' }, 'dev')).toEqual([
      'PAYMENT_VIETQR_MODE must be one of off|mock|production',
    ]);
    expect(findUnsafeIntegrationConfig({ CHANNEL_PROVIDER: 'Mock' }, 'dev')).toHaveLength(1);
    expect(findUnsafeIntegrationConfig({ PAYMENT_ZALOPAY_MODE: 'off' }, 'dev')).toHaveLength(1);
    expect(
      findUnsafeIntegrationConfig({ PAYMENT_METHODS_ENABLED: 'vietqr, cash' }, 'dev'),
    ).toHaveLength(1);
  });

  it('throws IntegrationError CONFIG listing variables, never values', () => {
    const env = {
      ...prodOk,
      PAYMENT_VNPAY_MODE: 'sandbox',
      PAYMENT_VNPAY_HASH_SECRET: 'topsecretvalue',
    };
    try {
      assertSafeConfig(env, 'production');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(IntegrationError);
      expect((e as IntegrationError).code).toBe('CONFIG');
      expect((e as IntegrationError).retryable).toBe(false);
      expect((e as Error).message).not.toContain('topsecretvalue');
    }
  });
});
