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
  EMAIL_PROVIDER: 'smtp',
  ZALO_PROVIDER: 'manual_copy',
};

describe('findUnsafeIntegrationConfig / assertSafeConfig (README 1.3)', () => {
  it('accepts .env.example in dev, test and staging, and an empty env everywhere', () => {
    for (const appEnv of ['dev', 'test', 'staging']) {
      expect(findUnsafeIntegrationConfig(devExample, appEnv)).toEqual([]);
    }
    for (const appEnv of ['dev', 'test', 'staging']) {
      expect(() => assertSafeConfig({}, appEnv)).not.toThrow();
    }
    // INT R3 e-mail: production needs a real e-mail provider (security e-mails), so an empty env is refused.
    expect(findUnsafeIntegrationConfig({}, 'production')).toEqual([
      'EMAIL_PROVIDER must be smtp in production (security e-mails, SEC 06.15/06.33/Q51-6)',
    ]);
  });

  it('e-mail (INT R3): production needs smtp; ses/resend gone; SMTP URL retired; password only from a file', () => {
    for (const v of ['off', 'mock', '']) {
      expect(
        findUnsafeIntegrationConfig({ ...prodOk, EMAIL_PROVIDER: v }, 'production').join(),
      ).toMatch(/EMAIL_PROVIDER must be smtp in production/);
    }
    for (const v of ['ses', 'resend']) {
      expect(findUnsafeIntegrationConfig({ EMAIL_PROVIDER: v }, 'dev')).toEqual([
        'EMAIL_PROVIDER must be one of off|mock|smtp',
      ]);
    }
    for (const appEnv of ['dev', 'staging', 'production']) {
      expect(
        findUnsafeIntegrationConfig({ ...prodOk, EMAIL_SMTP_URL: 'smtps://u:p@h' }, appEnv).join(),
      ).toMatch(/EMAIL_SMTP_URL is no longer read/);
    }
    // Raw password in the environment: refused on staging/production, allowed in dev/test (local fake server).
    const raw = { ...prodOk, EMAIL_SMTP_PASSWORD: 'abcdabcdabcdabcd' };
    expect(findUnsafeIntegrationConfig(raw, 'production').join()).toMatch(
      /EMAIL_SMTP_PASSWORD_FILE/,
    );
    expect(findUnsafeIntegrationConfig(raw, 'staging').join()).toMatch(/EMAIL_SMTP_PASSWORD_FILE/);
    expect(findUnsafeIntegrationConfig({ EMAIL_SMTP_PASSWORD: 'abcdabcdabcdabcd' }, 'dev')).toEqual(
      [],
    );
    // Resolved from the file (bootstrap resolveFileSecrets keeps X_FILE next to X): accepted.
    const fromFile = { ...raw, EMAIL_SMTP_PASSWORD_FILE: '/run/secrets/email_smtp_password' };
    expect(findUnsafeIntegrationConfig(fromFile, 'production')).toEqual([]);
    // SEC EMAIL-01: relay (default) or app_password; anything else refused everywhere.
    for (const v of ['relay', 'app_password']) {
      expect(findUnsafeIntegrationConfig({ ...prodOk, EMAIL_SMTP_MODE: v }, 'production')).toEqual(
        [],
      );
    }
    expect(findUnsafeIntegrationConfig({ EMAIL_SMTP_MODE: 'oauth' }, 'dev')).toEqual([
      'EMAIL_SMTP_MODE must be one of relay|app_password',
    ]);
    // The message names the variable, never the value.
    expect(findUnsafeIntegrationConfig(raw, 'production').join()).not.toContain('abcdabcd');
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

  it('FB-R2-SEC-INT-06: retired PAYMENT_VIETQR_* account variables must be empty in every environment', () => {
    for (const appEnv of ['dev', 'test', 'staging', 'production']) {
      const problems = findUnsafeIntegrationConfig(
        {
          PAYMENT_VIETQR_ACCOUNT_NO: '9876543210',
          PAYMENT_VIETQR_BANK_BIN: '',
          PAYMENT_VIETQR_ACCOUNT_NAME: ' ',
          EMAIL_PROVIDER: 'smtp',
        },
        appEnv,
      );
      expect(problems).toEqual([
        'PAYMENT_VIETQR_ACCOUNT_NO is no longer read – set the receiving account in the payment_receiving_account parameter',
      ]);
      expect(problems.join()).not.toContain('9876543210');
    }
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
