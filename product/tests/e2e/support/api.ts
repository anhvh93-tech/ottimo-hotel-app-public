// Thin API client for E2E on the real stack (Playwright request API). Contract: docs/api/openapi.yaml.
//  - staff session = cookie ottimo_sid (sent explicitly, so one APIRequestContext can serve many users)
//  - write methods carry X-CSRF-Token (= Me.csrfToken) + Origin (SR-SES-04)
//  - Idempotency-Key (UUID) / If-Match on demand (ADR-009, "Khóa lạc quan")
//  - endpoint availability probe: a route that is not built yet answers 404 to an anonymous call,
//    a built staff route answers 401 (AuthGuard runs before any lookup) – used to mark cases "pending"
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';
import {
  API_URL,
  AUTH_DIR,
  GUEST_COOKIE,
  LOCAL_CLOCK,
  ORIGIN,
  SEED_PASSWORD,
  SESSION_COOKIE,
  SUBJECTS,
  TEST_TOKEN,
  WEB_URL,
} from './env.js';
import { secretOfUri, stepOf } from './totp.js';
import {
  TOTP_DIR,
  TOTP_ENROLL,
  hasTotpSecret,
  markTotpStepUsed,
  nextTotpCode,
  saveTotpSecret,
} from './totp-store.js';

export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
  errors?: Array<{ field?: string; code?: string }>;
  [k: string]: unknown;
}

export interface MeProperty {
  propertyId: string;
  name: string;
  timezone: string;
  roles: string[];
  screens: string[];
  deviceTrusted?: boolean;
}

export interface Me {
  id: string;
  displayName: string;
  csrfToken: string;
  activePropertyId?: string;
  properties: MeProperty[];
  mustChangePassword?: boolean;
  /** US-143 (OpenAPI 0.3.8): restricted session – only the 2FA enrolment endpoints (SEC 06.4, ARC 12.3). */
  mfaEnrollmentRequired?: boolean;
  mfaEnabled?: boolean;
}

export interface StaffSession {
  username: string;
  token: string;
  me: Me;
}

export interface CallOptions {
  session?: StaffSession | null;
  /** Raw Cookie header (overrides session), e.g. a revoked/old cookie or a guest cookie. */
  cookie?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** true → fresh UUID; string → that key. */
  idempotencyKey?: boolean | string;
  ifMatch?: string;
  /** Default true for write methods with a session. */
  csrf?: boolean;
  headers?: Record<string, string>;
  /** Base URL override, e.g. WEB_URL to go through Caddy (another client IP for SR-RL-01 per-IP limits). */
  base?: string;
  /** true → return a staff 429 RATE_LIMITED as is (a case that asserts SR-RL-09 itself). */
  noRateLimitWait?: boolean;
}

export interface ApiResult<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string>;
  setCookies: string[];
  res: APIResponse;
}

const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Harness waits caused by SR-RL-09 in this worker (reported by the S3 test report, BUG-R2-051). */
export const rateLimitWaits = { count: 0, seconds: 0, resets: 0 };

export function uuid(): string {
  return randomUUID();
}

/** Short unique suffix for throwaway records (usernames, phones, e-mails). */
export function uniq(len = 6): string {
  return randomBytes(8).toString('hex').slice(0, len);
}

/** Letters-only suffix for person names: V-01 (EP00 3) forbids digits in fullName/displayName. */
export function uniqName(len = 6): string {
  return Array.from(randomBytes(len), (b) => String.fromCharCode(97 + (b % 26))).join('');
}

// ───────────────────────── fake phone numbers that do not repeat ─────────────────────────
// BR-951: a phone belongs to one live guest profile → a repeated number is 409 DUPLICATE_GUEST while building data
// (breg-3 / TC-L3-013 in S3, TC-L2-103 in S4: "0939 + 6 random digits" = 10⁶ numbers, birthday clashes on long-lived
// stacks). Now: value = clock in 0.1 s (strictly increasing per process) × 100 + Playwright parallel slot × 10 + a
// random digit per process, mod 5·10⁸, written as a VN mobile 0[35789] + 8 digits (normalizePhone: 84 + 9 digits).
//   - no repeat inside one run (workers have different slots; the main process takes slot 9);
//   - none across runs for ~5.8 days, as long as one process makes ≤ 10 numbers a second on average;
//   - two runs on the same stack at the same 0.1 s differ by the random digit (9 in 10).
// What is left (wrap-around, a seed profile with the same number) is covered by createFakeGuest's retry.
const PHONE_LEAD = ['3', '5', '7', '8', '9'] as const;
const PHONE_SLOT = ((): number => {
  const p = Number(process.env.TEST_PARALLEL_INDEX);
  return Number.isInteger(p) && p >= 0 ? p % 10 : 9;
})();
const PHONE_SALT = randomBytes(1)[0]! % 10;
let phoneTick = 0;

/** Fake VN mobile, 10 digits (0[35789]xxxxxxxx), not repeated – see above. */
export function fakeMobile(): string {
  phoneTick = Math.max(phoneTick + 1, Math.floor(Date.now() / 100));
  const v = (phoneTick * 100 + PHONE_SLOT * 10 + PHONE_SALT) % 500_000_000;
  return `0${PHONE_LEAD[Math.floor(v / 100_000_000)]}${String(v % 100_000_000).padStart(8, '0')}`;
}

/**
 * POST /guests for a throwaway profile while building data. 409 DUPLICATE_GUEST on `phone` (a profile left by another
 * run – not the subject of the case) → try again with a new `fakeMobile()`, at most 3 calls, annotation `harness`.
 * Only for numbers the harness made up: a case that checks duplicate phones calls `call` itself.
 */
export async function createFakeGuest<T = { id: string }>(
  ctx: APIRequestContext,
  s: StaffSession,
  body: Record<string, unknown>,
): Promise<ApiResult<T>> {
  let b = body;
  for (let attempt = 1; ; attempt++) {
    const r = await call<T>(ctx, 'POST', `/v1/properties/${propertyIdOf(s)}/guests`, {
      session: s,
      idempotencyKey: true,
      body: b,
    });
    const p = r.body as Problem;
    const phoneClash =
      r.status === 409 &&
      p?.code === 'DUPLICATE_GUEST' &&
      (p.errors ?? []).some((e) => e.field === 'phone');
    if (!phoneClash || b.phone === undefined || attempt >= 3) return r;
    try {
      test.info().annotations.push({
        type: 'harness',
        description: `createGuest: SĐT giả trùng hồ sơ có sẵn (409 DUPLICATE_GUEST, lần ${attempt}) – thử số khác`,
      });
    } catch {
      /* outside a test (global setup) */
    }
    b = { ...b, phone: fakeMobile() };
  }
}

export function fillPath(path: string, params: Record<string, string>): string {
  return path.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k];
    if (v === undefined) throw new Error(`path ${path}: missing {${k}}`);
    return encodeURIComponent(v);
  });
}

export async function call<T = unknown>(
  ctx: APIRequestContext,
  method: string,
  path: string,
  o: CallOptions = {},
): Promise<ApiResult<T>> {
  const m = method.toUpperCase();
  const headers: Record<string, string> = { accept: 'application/json', ...(o.headers ?? {}) };
  const cookie = o.cookie ?? (o.session ? `${SESSION_COOKIE}=${o.session.token}` : undefined);
  if (cookie) headers.cookie = cookie;
  if (WRITE.has(m) && o.session && o.csrf !== false) {
    headers['x-csrf-token'] = o.session.me.csrfToken;
    headers.origin = ORIGIN;
  }
  if (o.idempotencyKey) {
    headers['idempotency-key'] = o.idempotencyKey === true ? uuid() : o.idempotencyKey;
  }
  if (o.ifMatch !== undefined) headers['if-match'] = o.ifMatch;
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(o.query ?? {})) if (v !== undefined) params[k] = String(v);
  const send = () =>
    ctx.fetch(`${o.base ?? API_URL}${path}`, {
      method: m,
      headers,
      params,
      ...(o.body !== undefined ? { data: o.body } : {}),
      failOnStatusCode: false,
      maxRedirects: 0,
    });
  let res = await send();
  let text = await res.text();
  // SR-RL-09 (600 requests/min per staff user – STAFF_REQUESTS_PER_MINUTE): every worker of the suite shares the
  // seed users qa.*, so the harness itself can exceed the window. Since the fix of BUG-R2-051 the guard's window
  // runs on the monotonic process clock and /__test__/rate-limits/reset clears it → reset once and resend the
  // SAME request (the guard refuses before any handler/idempotency record – safe for writes). No test support
  // (or an older build): wait Retry-After (≤ 65 s, test timeout extended), at most twice.
  let resetTried = false;
  for (
    let attempt = 0;
    res.status() === 429 && o.session && !o.noRateLimitWait && attempt < 3;
    attempt++
  ) {
    if (!/"RATE_LIMITED"/.test(text)) break;
    if (!resetTried && !resetting) {
      resetTried = true;
      if (await resetRateLimits(ctx, `SR-RL-09 429 ${m} ${path.split('?')[0]}`)) {
        rateLimitWaits.resets++;
        res = await send();
        text = await res.text();
        continue;
      }
    }
    const wait = Number(res.headers()['retry-after'] ?? NaN);
    if (!(wait > 0 && wait <= 65)) break;
    rateLimitWaits.count++;
    rateLimitWaits.seconds += wait;
    console.log(`[e2e] SR-RL-09 429 ${m} ${path.split('?')[0]} → chờ ${wait} giây (BUG-R2-051)`);
    try {
      test.info().setTimeout(test.info().timeout + (wait + 10) * 1000);
    } catch {
      /* outside a test (global setup) – nothing to extend */
    }
    await new Promise((r) => setTimeout(r, wait * 1000 + 250));
    res = await send();
    text = await res.text();
  }
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    /* non-JSON body kept as text */
  }
  return {
    status: res.status(),
    body: body as T,
    headers: res.headers(),
    setCookies: res
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value),
    res,
  };
}

/** Assert an RFC 9457 problem with the given status (+ code). Returns the problem. */
export function expectProblem(r: ApiResult, status: number, code?: string): Problem {
  const p = (r.body ?? {}) as Problem;
  expect(r.status, `HTTP ${r.status} ${JSON.stringify(r.body)}`).toBe(status);
  if (code) expect(p.code, JSON.stringify(p)).toBe(code);
  return p;
}

export function etag(r: ApiResult): string | undefined {
  return r.headers.etag;
}

export function versionTag(v: number | string | undefined): string {
  return `"${v ?? 0}"`;
}

// ───────────────────────── endpoint availability ─────────────────────────

const probeCache = new Map<string, boolean>();
const ANY_UUID = '00000000-0000-7000-8000-000000000000';

/**
 * true when the route exists on the build. Anonymous call: built staff route → 401 (guard first),
 * built public route (login) → 4xx other than 404, route not built → 404 (Fastify "unmatched").
 */
/**
 * Probes run in their OWN request context: the test's `request` fixture keeps a cookie jar, so after a login made
 * inside the same test (freshSession of an account not cached yet) an "anonymous" probe would carry that session and
 * a property-scoped route with a random id would answer 404 → wrongly "not on the build" (QA S3: TC-L4-062 skipped).
 */
let probeCtx: Promise<APIRequestContext> | null = null;
function probeContext(): Promise<APIRequestContext> {
  probeCtx ??= playwrightRequest.newContext();
  return probeCtx;
}

export async function isAvailable(
  _ctx: APIRequestContext,
  method: string,
  path: string,
): Promise<boolean> {
  const ctx = await probeContext();
  const concrete = path.replace(/\{(\w+)\}/g, (_, k: string) =>
    k === 'key' ? 'probe_key' : ANY_UUID,
  );
  const key = `${method.toUpperCase()} ${concrete}`;
  const hit = probeCache.get(key);
  if (hit !== undefined) return hit;
  // a 404 is re-checked once and never cached: a transient miss must not silently skip a whole test
  // (retest 16/10: TC-NT-008 skipped once while listAuditEvents was on the build)
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await call(ctx, method, concrete, {
      body: WRITE.has(method.toUpperCase()) ? {} : undefined,
      csrf: false,
    });
    if (r.status !== 404 && r.status !== 405) {
      probeCache.set(key, true);
      return true;
    }
    await new Promise((res) => setTimeout(res, 300));
  }
  return false;
}

/** Skip the current test with the TC code when one of the endpoints is not built yet. */
export async function requireEndpoints(
  ctx: APIRequestContext,
  tc: string,
  eps: Array<[method: string, path: string, operationId: string]>,
): Promise<void> {
  const missing: string[] = [];
  for (const [m, p, op] of eps) if (!(await isAvailable(ctx, m, p))) missing.push(op);
  test.skip(missing.length > 0, `${tc}: chờ endpoint ${missing.join(', ')} (chưa có trên build)`);
}

// ───────────────────────── sessions ─────────────────────────

export class LoginRateLimited extends Error {}

interface SessionFile {
  apiUrl: string;
  sessions: Record<string, { token: string }>;
}

const SESSION_FILE = `${AUTH_DIR}sessions.json`;

function readSessionFile(): SessionFile {
  try {
    const f = JSON.parse(readFileSync(SESSION_FILE, 'utf8')) as SessionFile;
    if (f.apiUrl === API_URL) return f;
  } catch {
    /* none yet */
  }
  return { apiUrl: API_URL, sessions: {} };
}

function writeSessionFile(f: SessionFile): void {
  mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${SESSION_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(f), { mode: 0o600 });
  renameSync(tmp, SESSION_FILE);
}

export function sessionTokenFrom(setCookies: string[]): string | undefined {
  for (const c of setCookies) {
    const first = c.split(';')[0] ?? '';
    const eq = first.indexOf('=');
    if (eq > 0 && first.slice(0, eq).trim() === SESSION_COOKIE) {
      const v = decodeURIComponent(first.slice(eq + 1).trim());
      if (v) return v;
    }
  }
  return undefined;
}

/** One login call, no retry – for cases that assert the limits themselves (limits/, TC-NT-043). */
export async function loginRaw(
  ctx: APIRequestContext,
  username: string,
  password: string,
  base?: string,
): Promise<ApiResult<Me | Problem> & { token?: string }> {
  const r = await call<Me | Problem>(ctx, 'POST', '/v1/auth/login', {
    body: { username, password },
    headers: { origin: ORIGIN },
    ...(base ? { base } : {}),
  });
  return { ...r, token: sessionTokenFrom(r.setCookies) };
}

/**
 * Login as a test step. A 429 RATE_LIMITED caused by the harness's own login volume (SR-RL-01: one IP for
 * the whole CI run) is not the behaviour under test: reset the limiter (test-support) and retry ONCE.
 * An account lockout of a qa.e2e.lock.* account survives the reset (RESET_PREFIXES), so it still answers 429.
 */
export async function login(
  ctx: APIRequestContext,
  username: string,
  password: string,
  base?: string,
): Promise<ApiResult<Me | Problem> & { token?: string }> {
  const r = await loginRaw(ctx, username, password, base);
  if (r.status !== 429 || !(await resetRateLimits(ctx, `429 khi đăng nhập ${username}`))) return r;
  return loginRaw(ctx, username, password, base);
}

export async function getMe(ctx: APIRequestContext, token: string): Promise<ApiResult<Me>> {
  return call<Me>(ctx, 'GET', '/v1/me', { cookie: `${SESSION_COOKIE}=${token}` });
}

/**
 * Fresh login (not cached) – for tests that revoke / log out / need a second session.
 * A 429 (SR-RL-01 20 logins/IP/15 min: every CI login comes from one IP) is NOT a product failure here:
 * the harness clears the limiter through /__test__/rate-limits/reset and retries ONCE; a second 429
 * throws LoginRateLimited (sessionOrSkip turns it into a skip). Tests that assert the limit itself call
 * loginRaw() and run in project "limits" (serial, after rbac + api) – never through this helper.
 */
export async function freshSession(
  ctx: APIRequestContext,
  username: string,
  password = SEED_PASSWORD ?? '',
  base?: string,
): Promise<StaffSession> {
  let r = await login(ctx, username, password, base);
  if (r.status === 429) throw new LoginRateLimited(`login ${username}: 429 RATE_LIMITED`);
  if (r.status === 401 && (r.body as Problem)?.code === 'MFA_REQUIRED') {
    // BUG-R3-015: account with 2FA (stack MFA_ENFORCED=true) – step 2 with the test TOTP of E2E_TOTP_DIR
    if (!hasTotpSecret(username))
      throw new Error(
        `login ${username}: 401 MFA_REQUIRED – tài khoản đã bật 2FA; đặt E2E_TOTP_DIR chứa ${username}.secret (tests/README.md)`,
      );
    const m = await call<Me | Problem>(ctx, 'POST', '/v1/auth/login/mfa', {
      body: {
        mfaToken: (r.body as Problem & { mfaToken?: string }).mfaToken,
        totpCode: await nextTotpCode(username),
      },
      headers: { origin: ORIGIN },
      ...(base ? { base } : {}),
    });
    r = { ...m, token: sessionTokenFrom(m.setCookies) };
  }
  expect(r.status, `login ${username}: ${JSON.stringify(r.body)}`).toBe(200);
  expect(r.token, `login ${username}: no ${SESSION_COOKIE} cookie`).toBeTruthy();
  let s: StaffSession = { username, token: r.token!, me: r.body as Me };
  // Only DS-E accounts are enrolled/failed here; a throwaway account (qa.e2e.*) is returned as the stack gives it –
  // the case decides (it may still have to change its temporary password first, SR-AUTH-05).
  if (s.me.mfaEnrollmentRequired && (SUBJECTS as readonly string[]).includes(username))
    s = await enrolOrFail(ctx, s, password);
  return s;
}

/**
 * BUG-R3-015: OWN/MGR without 2FA on a stack with MFA_ENFORCED=true get a restricted session (SEC 06.4 – every other
 * call answers 403 MFA_ENROLLMENT_REQUIRED). With E2E_TOTP_ENROLL=1 + E2E_TOTP_DIR the harness enrols the account
 * (setup → confirm) and stores the secret + recovery codes there (0600); otherwise the case fails with the reason
 * instead of skipping for an unrelated one ("DS-E chưa nạp đủ 10 căn").
 */
async function enrolOrFail(
  ctx: APIRequestContext,
  s: StaffSession,
  password: string,
): Promise<StaffSession> {
  if (!TOTP_ENROLL || !TOTP_DIR)
    throw new Error(
      `${s.username}: phiên hạn chế (MFA_ENROLLMENT_REQUIRED) – tài khoản cần đăng ký 2FA trước; đặt E2E_TOTP_DIR + E2E_TOTP_ENROLL=1 hoặc đăng ký tay rồi cất secret vào E2E_TOTP_DIR`,
    );
  const setup = await call<{ otpauthUri: string }>(ctx, 'POST', '/v1/me/2fa/setup', {
    session: s,
    body: { currentPassword: password },
  });
  expect(setup.status, `startMy2faSetup ${s.username}`).toBe(200);
  const uri = new URL(setup.body.otpauthUri.replace('otpauth://', 'https://'));
  const base32 = uri.searchParams.get('secret') ?? '';
  secretOfUri(setup.body.otpauthUri); // label/issuer/length checks (SEC 06.7–06.8)
  saveTotpSecret(s.username, base32);
  const conf = await call<{ recoveryCodes: string[] }>(ctx, 'POST', '/v1/me/2fa/confirm', {
    session: s,
    body: { totpCode: await nextTotpCode(s.username) },
  });
  expect(conf.status, `confirmMy2fa ${s.username}`).toBe(200);
  saveTotpSecret(s.username, base32, conf.body.recoveryCodes ?? []);
  markTotpStepUsed(s.username, stepOf(Date.now()));
  const token = sessionTokenFrom(conf.setCookies);
  expect(token, `confirmMy2fa ${s.username}: phiên mới (06.10)`).toBeTruthy();
  const me = await getMe(ctx, token!);
  expect(me.status).toBe(200);
  console.log(`[e2e] ${s.username}: đã đăng ký 2FA thử (secret cất ở E2E_TOTP_DIR)`);
  return { username: s.username, token: token!, me: me.body };
}

/** Per-worker memory of validated sessions (avoids re-reading the file; getMe still re-validates). */
const memSessions = new Map<string, string>();

async function cachedSession(
  ctx: APIRequestContext,
  username: string,
): Promise<StaffSession | null> {
  const tokens = [memSessions.get(username), readSessionFile().sessions[username]?.token];
  for (const token of tokens) {
    if (!token) continue;
    const me = await getMe(ctx, token);
    // BUG-R3-015: a restricted "enrol 2FA first" session (SEC 06.4) is not a usable session – log in again
    if (me.status === 200 && !me.body.mfaEnrollmentRequired) {
      memSessions.set(username, token);
      return { username, token, me: me.body };
    }
  }
  memSessions.delete(username);
  return null;
}

function storeSession(s: StaffSession): void {
  memSessions.set(s.username, s.token);
  const g = readSessionFile();
  g.sessions[s.username] = { token: s.token };
  writeSessionFile(g);
}

/**
 * Cached session of a DS-E account, shared by every worker (e2e/.auth/sessions.json) and every run while
 * valid. A new login happens ONLY when the cached session was revoked/expired (getMe → 401) – e.g. after
 * logout. Flows that revoke sessions on purpose (changeMyPassword, role change, reset, disable) use their
 * own throwaway accounts qa.e2e.* (createThrowawayUser), never a DS-E account.
 */
export async function session(ctx: APIRequestContext, username: string): Promise<StaffSession> {
  const hit = await cachedSession(ctx, username);
  if (hit) return hit;
  const s = await freshSession(ctx, username);
  storeSession(s);
  return s;
}

// ───────────────────────── rate-limit reset (openapi.test.yaml testResetRateLimits) ─────────────────────────

/**
 * Username prefixes whose DB counters (login lockout, re-auth lock) are cleared by a harness reset.
 * Deliberately NOT "qa.": the endpoint also turns status 'locked' → 'active', which would unlock the
 * DS-E account qa.locked (admin-locked on purpose, TC-NT-005) – BUG-R2-014. Nor "qa.e2e.": the lockout
 * test accounts qa.e2e.lock.* must keep their lock while TC-NT-043 runs. The in-memory windows (login per
 * IP, guest lookup) are cleared by every call whatever the prefix.
 */
export const RESET_PREFIXES = ['qa.owner', 'qa.mgr', 'qa.fd', 'qa.hk', 'qa.mt', 'qa.sal', 'qa.ctv'];

let resetUnavailable = false;
/** true while resetRateLimits runs – its own owner session/getMe must not trigger another reset. */
let resetting = false;

/** An owner session for /__test__ calls: cache first, then login on the api, then through Caddy (other IP). */
async function ownerForTestSupport(ctx: APIRequestContext): Promise<StaffSession | null> {
  const hit = await cachedSession(ctx, 'qa.owner');
  if (hit) return hit;
  if (!SEED_PASSWORD) return null;
  for (const base of [API_URL, WEB_URL]) {
    const r = await loginRaw(ctx, 'qa.owner', SEED_PASSWORD, base).catch(() => null);
    if (r?.status === 200 && r.token && !(r.body as Me).mfaEnrollmentRequired) {
      const s = { username: 'qa.owner', token: r.token, me: r.body as Me };
      storeSession(s);
      return s;
    }
    // BUG-R3-015: owner with 2FA (or still to enrol) on a MFA_ENFORCED stack – the full login path
    if (r?.status === 200 || (r?.status === 401 && (r.body as Problem)?.code === 'MFA_REQUIRED')) {
      const s = await freshSession(ctx, 'qa.owner', SEED_PASSWORD, base).catch(() => null);
      if (s) {
        storeSession(s);
        return s;
      }
    }
  }
  return null;
}

/**
 * POST /__test__/rate-limits/reset (X-Test-Token + owner session) for each prefix. Returns false – and the
 * caller keeps the original 429 – when the stack has no test support (no TEST_SUPPORT_TOKEN, production
 * image, INCLUDE_TEST_SUPPORT=0) or no owner session can be obtained.
 */
export async function resetRateLimits(
  ctx: APIRequestContext,
  why: string,
  prefixes: string[] = RESET_PREFIXES,
): Promise<boolean> {
  resetting = true;
  try {
    if (!TEST_TOKEN || resetUnavailable) return false;
    const owner = await ownerForTestSupport(ctx);
    if (!owner) {
      console.log(`[e2e] reset giới hạn (${why}): không có phiên qa.owner – bỏ qua`);
      return false;
    }
    for (const usernamePrefix of prefixes) {
      const r = await call<{ users?: number }>(ctx, 'POST', '/__test__/rate-limits/reset', {
        noRateLimitWait: true,
        session: owner,
        headers: { 'x-test-token': TEST_TOKEN },
        body: { usernamePrefix },
      });
      if (r.status === 404) {
        resetUnavailable = true; // build without TestSupportModule / older build without this route
        console.log(
          `[e2e] reset giới hạn (${why}): /__test__/rate-limits/reset chưa có trên build`,
        );
        return false;
      }
      if (r.status !== 200) {
        console.log(`[e2e] reset giới hạn (${why}) ${usernamePrefix}: HTTP ${r.status}`);
        return false;
      }
    }
    return true;
  } finally {
    resetting = false;
  }
}

/** Like session(), but turns an IP login rate-limit (SR-RL-01, 20/IP/15 min) into a skip, not a red. */
export async function sessionOrSkip(
  ctx: APIRequestContext,
  username: string,
): Promise<StaffSession> {
  try {
    return await session(ctx, username);
  } catch (e) {
    if (e instanceof LoginRateLimited) {
      test.skip(true, `môi trường: ${e.message} (SR-RL-01 20 lần/IP/15 phút) – chạy lại sau`);
    }
    throw e;
  }
}

export function forgetSession(username: string): void {
  memSessions.delete(username);
  if (!existsSync(SESSION_FILE)) return;
  const f = readSessionFile();
  delete f.sessions[username];
  writeSessionFile(f);
}

export function propertyIdOf(s: StaffSession): string {
  const id = s.me.activePropertyId ?? s.me.properties[0]?.propertyId;
  if (!id) throw new Error(`${s.username}: no property in getMe`);
  return id;
}

/** A syntactically valid guest cookie (staff routes must refuse it – SR-SES-09). */
export function fakeGuestCookie(): string {
  return `${GUEST_COOKIE}=${randomBytes(32).toString('base64url')}`;
}

export function needSeedPassword(): void {
  test.skip(
    !SEED_PASSWORD,
    'Thiếu QA_SEED_PASSWORD (env hoặc product/.env) – không đăng nhập được tài khoản qa.*',
  );
}

// ───────────────────────── /__test__ (openapi.test.yaml) ─────────────────────────

export async function testClock(
  ctx: APIRequestContext,
  owner: StaffSession,
  token: string,
  body: Record<string, unknown>,
): Promise<ApiResult<{ now: string; mode: string }>> {
  return call(ctx, 'POST', '/__test__/clock', {
    session: owner,
    body,
    headers: { 'x-test-token': token },
  });
}

/**
 * `GET /health` time of the stack. BUG-R2-222 (1): staging/production answer 404 to /health from the Internet (SEC
 * OPS-12) and run the system clock – with E2E_LOCAL_CLOCK=1 the host clock (+07:00) is used instead. Never set it
 * for a stack with a moved MutableClock.
 */
export async function healthTime(
  ctx: APIRequestContext,
): Promise<{ status: number; body: { time: string } }> {
  if (LOCAL_CLOCK)
    return {
      status: 200,
      body: { time: new Date(Date.now() + 7 * 3_600_000).toISOString().replace('Z', '+07:00') },
    };
  return call<{ time: string }>(ctx, 'GET', '/health');
}

/**
 * Business date "today" of the stack (getHealth.time is +07:00 and follows the MutableClock). BR-010: the business
 * day changes at `business_day_rollover` (DS-E 06:00), not at midnight – between 00:00 and 05:59 it is the
 * PREVIOUS calendar date (QA S3 testing 17/10: the calendar date made TC-L2-014/053, TC-L5-005/023 red after midnight).
 */
export async function stackToday(ctx: APIRequestContext, rollover = '06:00'): Promise<string> {
  const r = await healthTime(ctx);
  const date = r.body.time.slice(0, 10);
  if (r.body.time.slice(11, 16) >= rollover) return date;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * S2 proof (OpenAPI 0.3.8 `StrongReauth`, ARC s1-contracts 1.2 – CỔNG S2) for a DS-E account: the seed password.
 * DS-E accounts have no 2FA on the E2E stack (MFA_ENFORCED=false in dev/CI), so the password alone is S2 there.
 * Sent ONLY by the session that owns that password (never in a request of another role). A DS-E account with
 * 2FA would need `totpCode` too – pass `extra`.
 */
export function seedReauth(extra: { totpCode?: string; recoveryCode?: string } = {}): {
  password: string;
  totpCode?: string;
  recoveryCode?: string;
} {
  return { password: SEED_PASSWORD ?? '', ...extra };
}

/**
 * S2 of the DS-E account `username` on any stack (BUG-R3-015): the seed password, plus a fresh TOTP code when the
 * account has a test secret in E2E_TOTP_DIR (stack MFA_ENFORCED=true). Use it wherever a DS-E OWN/MGR sends S2.
 */
export async function seedReauthFor(
  username: string,
): Promise<{ password: string; totpCode?: string }> {
  return hasTotpSecret(username)
    ? seedReauth({ totpCode: await nextTotpCode(username) })
    : seedReauth();
}

/** Owner creates a throwaway account (must change password on first login – SR-AUTH-05). */
export async function createThrowawayUser(
  ctx: APIRequestContext,
  owner: StaffSession,
  role: string,
  prefix = 'qa.e2e',
): Promise<{
  id: string;
  username: string;
  password: string;
  version: number;
  body: Record<string, unknown>;
}> {
  const username = `${prefix}.${uniq(8)}`;
  const password = `E2e-${uniq(12)}-tmp`;
  const r = await call<{ id: string; version: number }>(ctx, 'POST', '/v1/users', {
    session: owner,
    idempotencyKey: true,
    body: {
      username,
      displayName: `Qa Tam ${role.replace(/[^a-z]/g, ' ')} ${uniqName(4)}`,
      initialPassword: password,
      roles: [{ propertyId: propertyIdOf(owner), role }],
      reauth: await seedReauthFor(owner.username), // CỔNG S2 (SEC 06.26): createUser needs S2
    },
  });
  expect(r.status, `createUser ${username}: ${JSON.stringify(r.body)}`).toBe(201);
  return {
    id: r.body.id,
    username,
    password,
    version: r.body.version,
    body: r.body as unknown as Record<string, unknown>,
  };
}

/** Log in with a temporary password and replace it (SR-AUTH-05) – returns the live session + new password. */
export async function activateUser(
  ctx: APIRequestContext,
  u: { username: string; password: string },
  base?: string,
): Promise<{ session: StaffSession; password: string }> {
  const s = await freshSession(ctx, u.username, u.password, base);
  const newPassword = `E2e-${uniq(12)}-ok`;
  if (s.me.mustChangePassword !== false) {
    const r = await call(ctx, 'POST', '/v1/me/password', {
      session: s,
      body: { currentPassword: u.password, newPassword },
    });
    expect(r.status, `changeMyPassword ${u.username}: ${JSON.stringify(r.body)}`).toBe(204);
    // SR-SES-02: a password change revokes every session and issues a fresh cookie for this client
    // (auth.service changeMyPassword) – continue with the rotated token, the old one is now 401.
    const token = sessionTokenFrom(r.setCookies) ?? s.token;
    const me = await getMe(ctx, token);
    expect(me.status).toBe(200);
    return { session: { ...s, token, me: me.body }, password: newPassword };
  }
  return { session: s, password: u.password };
}
