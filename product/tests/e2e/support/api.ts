// Thin API client for E2E on the real stack (Playwright request API). Contract: docs/api/openapi.yaml.
//  - staff session = cookie ottimo_sid (sent explicitly, so one APIRequestContext can serve many users)
//  - write methods carry X-CSRF-Token (= Me.csrfToken) + Origin (SR-SES-04)
//  - Idempotency-Key (UUID) / If-Match on demand (ADR-009, "Khóa lạc quan")
//  - endpoint availability probe: a route that is not built yet answers 404 to an anonymous call,
//    a built staff route answers 401 (AuthGuard runs before any lookup) – used to mark cases "pending"
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';
import { API_URL, AUTH_DIR, GUEST_COOKIE, ORIGIN, SEED_PASSWORD, SESSION_COOKIE } from './env.js';

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
  const r = await call(ctx, method, concrete, {
    body: WRITE.has(method.toUpperCase()) ? {} : undefined,
    csrf: false,
  });
  const ok = r.status !== 404 && r.status !== 405;
  probeCache.set(key, ok);
  return ok;
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

export async function login(
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

export async function getMe(ctx: APIRequestContext, token: string): Promise<ApiResult<Me>> {
  return call<Me>(ctx, 'GET', '/v1/me', { cookie: `${SESSION_COOKIE}=${token}` });
}

/** Fresh login (not cached) – for tests that revoke / log out / need a second session. */
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

/** Cached session of a DS-E account (reused across workers/runs while still valid). */
export async function session(ctx: APIRequestContext, username: string): Promise<StaffSession> {
  const f = readSessionFile();
  const cached = f.sessions[username];
  if (cached) {
    const me = await getMe(ctx, cached.token);
    if (me.status === 200) return { username, token: cached.token, me: me.body };
  }
  const s = await freshSession(ctx, username);
  const g = readSessionFile();
  g.sessions[username] = { token: s.token };
  writeSessionFile(g);
  return s;
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
