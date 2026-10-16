// E2E environment (test-strategy section 4–5). Secrets are never written in test files:
//   QA_SEED_PASSWORD   – password of every DS-E account qa.* (seed loader reads the same variable)
//   TEST_SUPPORT_TOKEN – X-Test-Token of /__test__/* (openapi.test.yaml; only when INCLUDE_TEST_SUPPORT=1)
// Locally both may come from product/.env (read for these two keys only, never printed).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PRODUCT_DIR = fileURLToPath(new URL('../../../', import.meta.url));
export const E2E_DIR = fileURLToPath(new URL('../', import.meta.url));
/** Session cache dir (gitignored). E2E_AUTH_DIR lets two runs against two disposable stacks keep separate caches. */
export const AUTH_DIR = process.env.E2E_AUTH_DIR
  ? `${process.env.E2E_AUTH_DIR.replace(/\/$/, '')}/`
  : fileURLToPath(new URL('../.auth/', import.meta.url));

function fromDotEnv(key: string): string | undefined {
  const file = `${PRODUCT_DIR}.env`;
  if (!existsSync(file)) return undefined;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && m[1] === key) return m[2]!.replace(/^["']|["']$/g, '') || undefined;
  }
  return undefined;
}

function secret(key: string): string | undefined {
  return process.env[key] || fromDotEnv(key);
}

export const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:3000';
export const WEB_URL = process.env.E2E_WEB_URL ?? 'http://127.0.0.1:8081';
/** Origin sent on write requests (SR-SES-04: CSRF token + valid Origin). Default = admin-web origin of .env APP_BASE_URL. */
export const ORIGIN =
  process.env.E2E_ORIGIN ?? fromDotEnv('APP_BASE_URL') ?? 'http://localhost:8081';
/** guest-web origin (GUEST_BASE_URL): a staff login from it must be refused (SR-SES-09). */
export const GUEST_ORIGIN = new URL(
  process.env.E2E_GUEST_ORIGIN ?? fromDotEnv('GUEST_BASE_URL') ?? 'http://localhost:8083',
).origin;
export const SEED_PASSWORD = secret('QA_SEED_PASSWORD');
export const TEST_TOKEN = secret('TEST_SUPPORT_TOKEN');
/** Dev over HTTP drops the __Host- prefix (COOKIE_SECURE_PREFIX=false). */
export const COOKIE_PREFIX =
  (process.env.E2E_COOKIE_SECURE_PREFIX ?? fromDotEnv('COOKIE_SECURE_PREFIX') ?? 'false') === 'true'
    ? '__Host-'
    : '';
export const SESSION_COOKIE = `${COOKIE_PREFIX}ottimo_sid`;
export const GUEST_COOKIE = `${COOKIE_PREFIX}ottimo_gsid`;

/** DS-E internal accounts used as RBAC subjects (fixtures/seed/ds-e.json users; rbac-cases.json subjects). */
export const SUBJECTS = [
  'qa.owner',
  'qa.mgr',
  'qa.fdl',
  'qa.fd',
  'qa.fdsal',
  'qa.hk',
  'qa.hkmt',
  'qa.mt',
  'qa.sal',
  'qa.ctv1',
] as const;
export type Subject = (typeof SUBJECTS)[number];
