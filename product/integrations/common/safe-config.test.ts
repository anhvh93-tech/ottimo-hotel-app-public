import { describe, expect, it } from 'vitest';
import { IntegrationError } from '../contracts/common.js';
import {
  assertSafeConfig,
  findUnsafeIntegrationConfig,
  parseBookingChatWebhook,
} from './safe-config.js';

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

// ARC gchat-booking-request-notify 3.3 + 8.7 G1, 8.11 test 1 (SEC GCHAT-02): fake ids/keys only.
describe('parseBookingChatWebhook', () => {
  const ok =
    'https://chat.googleapis.com/v1/spaces/AAAAbcd_-12/messages?key=fakeKey123&token=fakeTok%3D';
  it('accepts the standard URL (and keeps it as written)', () => {
    expect(parseBookingChatWebhook(ok)).toEqual({ mode: 'on', url: ok });
    expect(parseBookingChatWebhook(`  ${ok}\n`)).toEqual({ mode: 'on', url: ok });
  });
  it('empty or unset → off', () => {
    expect(parseBookingChatWebhook(undefined)).toEqual({ mode: 'off' });
    expect(parseBookingChatWebhook('')).toEqual({ mode: 'off' });
    expect(parseBookingChatWebhook('  \n')).toEqual({ mode: 'off' });
  });
  it.each([
    ['http', ok.replace('https:', 'http:')],
    ['other host', ok.replace('chat.googleapis.com', 'chat.example.com')],
    ['suffix host', ok.replace('chat.googleapis.com', 'chat.googleapis.com.evil.test')],
    ['host in path', 'https://evil.test/chat.googleapis.com/v1/spaces/AAAA/messages?key=k&token=t'],
    ['upper-case host', ok.replace('chat.googleapis.com', 'CHAT.googleapis.com')],
    ['trailing dot', ok.replace('chat.googleapis.com', 'chat.googleapis.com.')],
    ['user info', ok.replace('https://', 'https://user:pw@')],
    ['port', ok.replace('chat.googleapis.com', 'chat.googleapis.com:8443')],
    ['explicit 443', ok.replace('chat.googleapis.com', 'chat.googleapis.com:443')],
    ['IP', 'https://142.250.0.1/v1/spaces/AAAA/messages?key=k&token=t'],
    ['wrong path', ok.replace('/messages', '/members')],
    ['path traversal', 'https://chat.googleapis.com/v1/spaces/AAAA/../x/messages?key=k&token=t'],
    ['missing key', 'https://chat.googleapis.com/v1/spaces/AAAA/messages?token=t'],
    ['missing token', 'https://chat.googleapis.com/v1/spaces/AAAA/messages?key=k'],
    ['empty token', 'https://chat.googleapis.com/v1/spaces/AAAA/messages?key=k&token='],
    ['extra threadKey', `${ok}&threadKey=x`],
    ['key twice', 'https://chat.googleapis.com/v1/spaces/AAAA/messages?key=a&key=b&token=t'],
    ['extra foo', `${ok}&foo=1`],
    ['fragment', `${ok}#x`],
    ['too long', `${ok}${'A'.repeat(520)}`],
    ['not a URL', 'chat.googleapis.com/v1/spaces/AAAA/messages?key=k&token=t'],
  ])('refuses %s', (_name, url) => {
    expect(parseBookingChatWebhook(url)).toEqual({
      mode: 'invalid',
      code: 'CHAT_WEBHOOK_URL_INVALID',
    });
  });
  it('staging/production: the URL only from the _FILE secret', () => {
    const env = { ...prodOk, BOOKING_REQUEST_CHAT_WEBHOOK_URL: ok };
    const p = findUnsafeIntegrationConfig(env, 'production');
    expect(p).toEqual([
      'BOOKING_REQUEST_CHAT_WEBHOOK_URL must come from BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE (secret file), not the environment',
    ]);
    expect(p.join()).not.toContain('fakeKey123');
    expect(
      findUnsafeIntegrationConfig(
        {
          ...env,
          BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE: '/run/secrets/booking_request_chat_webhook',
        },
        'production',
      ),
    ).toEqual([]);
    expect(
      findUnsafeIntegrationConfig({ ...devExample, BOOKING_REQUEST_CHAT_WEBHOOK_URL: ok }, 'dev'),
    ).toEqual([]);
  });
});
