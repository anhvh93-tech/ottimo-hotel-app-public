// assertSafeConfig – the ONE place that decides whether the integration configuration is safe
// (README 1.3, ARC-12, SEC-04, SR-SECR-05). Owner: INT. Called at startup by services/api config.ts
// (api + worker) so there is no `if (APP_ENV === 'production')` scattered in adapter code.
// Messages name variables, never their values.
import { IntegrationError } from '../contracts/common.js';

type Env = Readonly<Record<string, string | undefined>>;

/** Allowed values per selector variable (README section 4). Unset = 'off' (or the listed default). */
export const INTEGRATION_SELECTORS: Readonly<Record<string, readonly string[]>> = {
  CHANNEL_PROVIDER: ['off', 'mock', 'beds24'],
  PAYMENT_VIETQR_MODE: ['off', 'mock', 'production'], // VietQR has no sandbox (string generation only)
  PAYMENT_VNPAY_MODE: ['off', 'mock', 'sandbox', 'production'],
  PAYMENT_MOMO_MODE: ['off', 'mock', 'sandbox', 'production'],
  BANKFEED_PROVIDER: ['off', 'mock', 'sepay', 'payos'],
  EINVOICE_PROVIDER: ['off', 'mock', 'misa'],
  DOORLOCK_PROVIDER: ['off', 'manual', 'mock', 'ttlock'],
  // INV 23/10/2026: Google Workspace SMTP replaces Amazon SES for v1.0 – `ses`/`resend` had no adapter and are gone.
  EMAIL_PROVIDER: ['off', 'mock', 'smtp'],
  // SEC FB-R3-SEC-INT-EMAIL-01: relay (by VPS IP, no password – default) | app_password (fallback, warned).
  EMAIL_SMTP_MODE: ['relay', 'app_password'],
  ZALO_PROVIDER: ['off', 'manual_copy', 'zns'],
};

export const PAYMENT_METHODS = ['vietqr', 'vnpay', 'momo'] as const;
const SCENARIO_VARS = /^[A-Z][A-Z0-9_]*_MOCK_SCENARIO$/;
/** Any selector, including ones added later (BLOBSTORE_PROVIDER, …). */
const SELECTOR_VARS = /_(PROVIDER|MODE)$/; // same match as the R1 check in services/api config.ts
const UNSAFE_IN_PRODUCTION = ['mock', 'sandbox'];
/** Gateways that charge real money at MODE=production – only allowed when APP_ENV=production (SEC-INT-05b). */
const LIVE_MONEY_MODES = ['PAYMENT_VNPAY_MODE', 'PAYMENT_MOMO_MODE'];

const val = (env: Env, k: string) => (env[k] ?? '').trim();

/**
 * No longer read by anything (FB-R2-SEC-INT-06, FB-R2-ARC-BE-S3-29): the VietQR receiving account is ONLY the
 * `payment_receiving_account` parameter (OWN + re-auth + audit + push – SEC F3). A value here would let
 * someone believe they changed the account without any audit trail → refuse in every environment.
 */
export const RETIRED_VIETQR_ACCOUNT_VARS = [
  'PAYMENT_VIETQR_BANK_BIN',
  'PAYMENT_VIETQR_ACCOUNT_NO',
  'PAYMENT_VIETQR_ACCOUNT_NAME',
] as const;

/**
 * Retired e-mail variables: EMAIL_SMTP_URL would carry the password inside a plain environment variable
 * (smtps://user:pass@host). The password is only EMAIL_SMTP_PASSWORD_FILE (INT R3 e-mail).
 */
export const RETIRED_EMAIL_VARS = ['EMAIL_SMTP_URL', 'EMAIL_SES_REGION'] as const;

/** Real e-mail providers accepted in production (2FA / receiving-account e-mails are SEC requirements of v1.0). */
export const PRODUCTION_EMAIL_PROVIDERS = ['smtp'] as const;

/**
 * Returns the list of problems (empty = safe). `appEnv` is APP_ENV already validated by the caller.
 * All environments: known selectors must hold an allowed value; PAYMENT_METHODS_ENABLED must list
 * known gateways; PAYMENT_VIETQR_BANK_BIN/ACCOUNT_NO/ACCOUNT_NAME must be empty (retired, SEC-INT-06).
 * EMAIL_SMTP_URL / EMAIL_SES_REGION must be empty (retired); staging/production: EMAIL_SMTP_PASSWORD only via _FILE.
 * production additionally: EMAIL_PROVIDER=smtp; no *_PROVIDER/*_MODE = mock|sandbox (rule a), every method
 * in PAYMENT_METHODS_ENABLED at MODE=production (rule b), no *_MOCK_SCENARIO set. mock/sandbox is
 * matched case-insensitively (selectors not in INTEGRATION_SELECTORS, FB-R2-SEC-INT-05a).
 * Outside production: PAYMENT_VNPAY_MODE / PAYMENT_MOMO_MODE = production refused (real money from a
 * test environment, FB-R2-SEC-INT-05b); VietQR stays allowed (R2 uses a test account – P-R2-6).
 */
export function findUnsafeIntegrationConfig(env: Env, appEnv: string): string[] {
  const problems: string[] = [];

  for (const [name, allowed] of Object.entries(INTEGRATION_SELECTORS)) {
    const v = val(env, name);
    if (v !== '' && !allowed.includes(v)) {
      problems.push(`${name} must be one of ${allowed.join('|')}`);
    }
  }
  for (const name of Object.keys(env)) {
    const m = /^PAYMENT_([A-Z0-9]+)_MODE$/.exec(name);
    if (m && !(PAYMENT_METHODS as readonly string[]).includes((m[1] as string).toLowerCase())) {
      problems.push(`${name} is not a known payment gateway (${PAYMENT_METHODS.join('|')})`);
    }
  }

  for (const name of RETIRED_VIETQR_ACCOUNT_VARS) {
    if (val(env, name) !== '') {
      problems.push(
        `${name} is no longer read – set the receiving account in the payment_receiving_account parameter`,
      );
    }
  }

  for (const name of RETIRED_EMAIL_VARS) {
    if (val(env, name) !== '') {
      problems.push(
        `${name} is no longer read – use EMAIL_SMTP_HOST/_PORT/_USER + EMAIL_SMTP_PASSWORD_FILE`,
      );
    }
  }
  // The SMTP app password only from a secret file outside dev/test (SEC SR-KEY-10): `env` here is the
  // resolved environment, so a value that came from the file always has its _FILE next to it.
  if (
    (appEnv === 'staging' || appEnv === 'production') &&
    val(env, 'EMAIL_SMTP_PASSWORD') !== '' &&
    val(env, 'EMAIL_SMTP_PASSWORD_FILE') === ''
  ) {
    problems.push(
      'EMAIL_SMTP_PASSWORD must come from EMAIL_SMTP_PASSWORD_FILE (secret file), not the environment',
    );
  }

  // Google Chat webhook of the booking-request room (ARC gchat-booking-request-notify 3.2): the URL carries `key` +
  // `token` (anyone holding it posts into the staff room) – only from the worker-only secret file.
  if (
    (appEnv === 'staging' || appEnv === 'production') &&
    val(env, 'BOOKING_REQUEST_CHAT_WEBHOOK_URL') !== '' &&
    val(env, 'BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE') === ''
  ) {
    problems.push(
      'BOOKING_REQUEST_CHAT_WEBHOOK_URL must come from BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE (secret file), not the environment',
    );
  }

  const enabledRaw = val(env, 'PAYMENT_METHODS_ENABLED');
  const enabled = enabledRaw === '' ? [] : enabledRaw.split(',').map((s) => s.trim());
  for (const method of enabled) {
    if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
      problems.push(
        `PAYMENT_METHODS_ENABLED contains an unknown method (${PAYMENT_METHODS.join('|')})`,
      );
    }
  }

  if (appEnv === 'production') {
    const unsafe = Object.keys(env)
      .filter(
        (k) => SELECTOR_VARS.test(k) && UNSAFE_IN_PRODUCTION.includes(val(env, k).toLowerCase()),
      )
      .sort();
    if (unsafe.length > 0) {
      problems.push(`mock/sandbox adapters forbidden in production: ${unsafe.join(', ')}`);
    }
    for (const method of enabled) {
      if (!(PAYMENT_METHODS as readonly string[]).includes(method)) continue;
      const modeVar = `PAYMENT_${method.toUpperCase()}_MODE`;
      if (val(env, modeVar) !== 'production') {
        problems.push(`${modeVar} must be production when ${method} is in PAYMENT_METHODS_ENABLED`);
      }
    }
    const email = val(env, 'EMAIL_PROVIDER');
    if (!(PRODUCTION_EMAIL_PROVIDERS as readonly string[]).includes(email)) {
      problems.push(
        `EMAIL_PROVIDER must be ${PRODUCTION_EMAIL_PROVIDERS.join('|')} in production (security e-mails, SEC 06.15/06.33/Q51-6)`,
      );
    }
    const scenarios = Object.keys(env)
      .filter((k) => SCENARIO_VARS.test(k) && val(env, k) !== '')
      .sort();
    if (scenarios.length > 0) {
      problems.push(`mock scenarios forbidden in production: ${scenarios.join(', ')}`);
    }
  } else {
    for (const name of LIVE_MONEY_MODES) {
      if (val(env, name).toLowerCase() === 'production') {
        problems.push(`${name}=production is only allowed when APP_ENV=production`);
      }
    }
  }
  return problems;
}

/** Throws IntegrationError('CONFIG') listing every problem; the process must not start. */
export function assertSafeConfig(env: Env, appEnv: string): void {
  const problems = findUnsafeIntegrationConfig(env, appEnv);
  if (problems.length > 0) {
    throw new IntegrationError(
      'CONFIG',
      `Unsafe integration configuration: ${problems.join('; ')}`,
    );
  }
}

// ───────────────────────── Google Chat webhook (booking-request room) ─────────────────────────

/** Longest webhook URL accepted (a real one is ≈ 180 characters). */
export const CHAT_WEBHOOK_MAX_LENGTH = 512;
const CHAT_WEBHOOK_PATH = /^\/v1\/spaces\/[A-Za-z0-9_-]{1,64}\/messages$/;

export type BookingChatWebhook =
  | { mode: 'off' }
  | { mode: 'on'; url: string }
  | { mode: 'invalid'; code: 'CHAT_WEBHOOK_URL_INVALID' };

/**
 * The booking-request Chat webhook (ARC gchat-booking-request-notify 3.3 + 8.7 G1; SEC GCHAT-02): empty → off;
 * accepted only as `https://chat.googleapis.com/v1/spaces/<id>/messages?key=…&token=…` – exact host (lower case),
 * no user info, no port, query = exactly `key` and `token`, once each, non-empty, ≤ 512 characters. Anything else
 * → `invalid` (the caller turns it off and logs the code – never the value). `threadKey`, `messageId`,
 * `messageReplyOption` are added by the code at send time, never taken from the file.
 */
export function parseBookingChatWebhook(raw: string | undefined): BookingChatWebhook {
  const v = (raw ?? '').trim();
  if (v === '') return { mode: 'off' };
  const invalid = { mode: 'invalid', code: 'CHAT_WEBHOOK_URL_INVALID' } as const;
  if (v.length > CHAT_WEBHOOK_MAX_LENGTH || /\s/.test(v)) return invalid;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return invalid;
  }
  if (u.protocol !== 'https:') return invalid;
  if (u.hostname !== 'chat.googleapis.com') return invalid;
  // The literal itself must read exactly so (no upper case, trailing dot, dot segments or encoded path the URL
  // parser would normalise away).
  if (
    !/^https:\/\/chat\.googleapis\.com\/v1\/spaces\/[A-Za-z0-9_-]{1,64}\/messages\?[^#]*$/.test(v)
  ) {
    return invalid;
  }
  if (u.username !== '' || u.password !== '' || u.port !== '' || u.hash !== '') return invalid;
  if (!CHAT_WEBHOOK_PATH.test(u.pathname)) return invalid;
  const keys = [...u.searchParams.keys()];
  if (keys.length !== 2 || [...keys].sort().join(',') !== 'key,token') return invalid;
  if ((u.searchParams.get('key') ?? '') === '' || (u.searchParams.get('token') ?? '') === '') {
    return invalid;
  }
  return { mode: 'on', url: u.toString() };
}
