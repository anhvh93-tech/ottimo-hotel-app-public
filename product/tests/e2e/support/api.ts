// Thin API client for E2E on the real stack (Playwright request API). Contract: docs/api/openapi.yaml.
//  - staff session = cookie ottimo_sid (sent explicitly, so one APIRequestContext can serve many users)
//  - write methods carry X-CSRF-Token (= Me.csrfToken) + Origin (SR-SES-04)
//  - Idempotency-Key (UUID) / If-Match on demand (ADR-009, "Khóa lạc quan")
//  - endpoint availability probe: a route that is not built yet answers 404 to an anonymous call,
//    a built staff route answers 401 (AuthGuard runs before any lookup) – used to mark cases "pending"
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import {
  API_URL,
  AUTH_DIR,
  GUEST_COOKIE,
  ORIGIN,
  SEED_PASSWORD,
  SESSION_COOKIE,
  TEST_TOKEN,
  WEB_URL,
} from './env.js';

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
}

export interface ApiResult<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string>;
  setCookies: string[];
  res: APIResponse;
}

const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
  const res = await ctx.fetch(`${o.base ?? API_URL}${path}`, {
    method: m,
    headers,
    params,
    ...(o.body !== undefined ? { data: o.body } : {}),
    failOnStatusCode: false,
    maxRedirects: 0,
  });
  const text = await res.text();
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
export async function isAvailable(
  ctx: APIRequestContext,
  method: string,
  path: string,
): Promise<boolean> {
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
  const r = await login(ctx, username, password, base);
  if (r.status === 429) throw new LoginRateLimited(`login ${username}: 429 RATE_LIMITED`);
  expect(r.status, `login ${username}: ${JSON.stringify(r.body)}`).toBe(200);
  expect(r.token, `login ${username}: no ${SESSION_COOKIE} cookie`).toBeTruthy();
  return { username, token: r.token!, me: r.body as Me };
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
    if (me.status === 200) {
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

/** An owner session for /__test__ calls: cache first, then login on the api, then through Caddy (other IP). */
async function ownerForTestSupport(ctx: APIRequestContext): Promise<StaffSession | null> {
  const hit = await cachedSession(ctx, 'qa.owner');
  if (hit) return hit;
  if (!SEED_PASSWORD) return null;
  for (const base of [API_URL, WEB_URL]) {
    const r = await loginRaw(ctx, 'qa.owner', SEED_PASSWORD, base).catch(() => null);
    if (r?.status === 200 && r.token) {
      const s = { username: 'qa.owner', token: r.token, me: r.body as Me };
      storeSession(s);
      return s;
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
  if (!TEST_TOKEN || resetUnavailable) return false;
  const owner = await ownerForTestSupport(ctx);
  if (!owner) {
    console.log(`[e2e] reset giới hạn (${why}): không có phiên qa.owner – bỏ qua`);
    return false;
  }
  for (const usernamePrefix of prefixes) {
    const r = await call<{ users?: number }>(ctx, 'POST', '/__test__/rate-limits/reset', {
      session: owner,
      headers: { 'x-test-token': TEST_TOKEN },
      body: { usernamePrefix },
    });
    if (r.status === 404) {
      resetUnavailable = true; // build without TestSupportModule / older build without this route
      console.log(`[e2e] reset giới hạn (${why}): /__test__/rate-limits/reset chưa có trên build`);
      return false;
    }
    if (r.status !== 200) {
      console.log(`[e2e] reset giới hạn (${why}) ${usernamePrefix}: HTTP ${r.status}`);
      return false;
    }
  }
  return true;
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

/** Business date "today" of the stack (getHealth.time is +07:00 and follows the MutableClock). */
export async function stackToday(ctx: APIRequestContext): Promise<string> {
  const r = await call<{ time: string }>(ctx, 'GET', '/health');
  return r.body.time.slice(0, 10);
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
