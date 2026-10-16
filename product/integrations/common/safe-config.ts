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
  EMAIL_PROVIDER: ['off', 'mock', 'ses', 'resend', 'smtp'],
  ZALO_PROVIDER: ['off', 'manual_copy', 'zns'],
};

export const PAYMENT_METHODS = ['vietqr', 'vnpay', 'momo'] as const;
const SCENARIO_VARS = /^[A-Z][A-Z0-9_]*_MOCK_SCENARIO$/;
/** Any selector, including ones added later (BLOBSTORE_PROVIDER, …). */
const SELECTOR_VARS = /_(PROVIDER|MODE)$/; // same match as the R1 check in services/api config.ts
const UNSAFE_IN_PRODUCTION = ['mock', 'sandbox'];

const val = (env: Env, k: string) => (env[k] ?? '').trim();

/**
 * Returns the list of problems (empty = safe). `appEnv` is APP_ENV already validated by the caller.
 * All environments: known selectors must hold an allowed value; PAYMENT_METHODS_ENABLED must list
 * known gateways. production additionally: no *_PROVIDER/*_MODE = mock|sandbox (rule a), every method
 * in PAYMENT_METHODS_ENABLED at MODE=production (rule b), no *_MOCK_SCENARIO set.
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
      .filter((k) => SELECTOR_VARS.test(k) && UNSAFE_IN_PRODUCTION.includes(val(env, k)))
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
    const scenarios = Object.keys(env)
      .filter((k) => SCENARIO_VARS.test(k) && val(env, k) !== '')
      .sort();
    if (scenarios.length > 0) {
      problems.push(`mock scenarios forbidden in production: ${scenarios.join(', ')}`);
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
