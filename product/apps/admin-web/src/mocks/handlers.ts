// MSW handlers emulating the OTTIMO API contract (docs/api/openapi.yaml 0.3.x) for the endpoints admin-web
// uses in Sprint 1. Rules mirrored from the spec: x-roles → 403 FORBIDDEN_ACTION, x-visible-to field
// filtering, If-Match → 428/412, CSRF on writes, problem+json with requestId.
import {
  isIdempotencyKey,
  type Me,
  type Parameter,
  type Role,
  type Room,
} from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { businessDayLocal, DEFAULT_ROLLOVER, todayLocal } from '../app/dates';
import { nameSearchKey, normalizePhone } from '../app/validation';
import { createDashboardMock } from './dashboard';
import { createOpsMock } from './ops';
import { createReservationMock } from './reservations';
import { createStayMock } from './stay';
import { matchStep, randomBase32 } from './totp';
import {
  BOOKED_GUESTS,
  MOCK_PASSWORD,
  PARAM_BOUNDS,
  PROPERTY_ID,
  PROPERTY_NAME,
  SCREENS,
  seedDevices,
  seedGroups,
  seedGuests,
  seedParams,
  seedRooms,
  seedUsers,
  type MockGuest,
  type MockUser,
} from './seed';

const MFA_ROLES: Role[] = ['owner', 'manager'];
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** 10 recovery codes × 16 Crockford base32 chars (SEC 06.12) – raw, the Desk shows 4-4-4-4. */
function recoveryCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => CROCKFORD[x % 32]).join('');
  });
}
const CP_FIELDS = { password: 'currentPassword', factor: 'totpCode' };
const normRecovery = (c: string) => c.replace(/[\s-]/g, '').toUpperCase();

const SESSION_KEY = 'ottimo.mock.session';
const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const SALES: Role[] = ['sales_staff', 'collaborator'];

function makeDb() {
  return {
    users: seedUsers(),
    groups: seedGroups(),
    rooms: seedRooms(),
    params: seedParams(),
    history: new Map<string, Parameter[]>(),
    guests: seedGuests(),
    devices: seedDevices(),
    nextGuest: 22,
    nextDevice: 403,
    sessionUserId: null as string | null,
    csrf: 'mock-csrf',
    /** Tests: force the next matching request to fail. */
    failNext: null as null | {
      match: RegExp;
      status: number;
      body: Record<string, unknown>;
      headers?: Record<string, string>;
    },
    loginFailures: 0,
    currentDeviceTrusted: false,
    /** Deployment flag `MFA_ENFORCED` (dev/CI default false – OpenAPI 0.3.8). */
    /** `business_day_rollover` (BR-010) served in Me (R3-Q38). */
    rollover: DEFAULT_ROLLOVER,
    /** Tests: false = a server before R3-Q38 (no Me.businessDate) – the R2 fallback reads. */
    meBusinessDate: true,
    mfaEnforced: false,
    /** Current session is the restricted enrollment-only one (SEC 06.4). */
    enrollmentOnly: false,
    /** `amr` of the current session (`totp` / `recovery_code`). */
    amr: null as null | 'pwd' | 'totp' | 'recovery_code',
    mfaTokens: new Map<string, { userId: string; expiresAt: number; fails: number }>(),
    /** R3-Q51 `payment_receiving_account` rows (full number kept server side only – never answered). */
    receiving: [
      {
        bankBin: '970407',
        // Test value only (staging holder rule, SEC E.13): not a real account.
        accountNo: '19030000007777',
        accountName: 'OTTIMO TEST',
        effectiveFrom: '2026-10-01',
        changedBy: 'Chủ đầu tư',
        changedAt: '2026-10-01T09:00:00+07:00',
        reason: 'Tài khoản thử',
      },
    ] as ReceivingRow[],
    /** Masked audit trail of the receiving account (tests check no full number). */
    receivingAudit: [] as Array<Record<string, unknown>>,
  };
}

let db = makeDb();
// EP02 (Sprint 2) lives in its own module; it gets the shared guard/problem helpers and the user/room/guest
// tables through this context (no import cycle).
const reservations = createReservationMock({
  guard: (request, allowed, opts) => guard(request, allowed, opts),
  problem: (status, code, extra) => problem(status, code, extra),
  db: () => db,
  summary: (g, roles) => summary(g, roles),
});

// Sprint 3 (EP03–EP06, EP15) – reads the EP02 reservations through the same helpers.
const stay = createStayMock({
  guard: (request, allowed, opts) => guard(request, allowed, opts),
  problem: (status, code, extra, headers) => problem(status, code, extra, headers),
  db: () => db,
  rsv: () => reservations,
});

// Sprint 4 FE-B (EP07/EP08/EP14/EP09 Desk): housekeeping, work orders + room blocks, guest requests, minibar.
const ops = createOpsMock({
  guard: (request, allowed, opts) => guard(request, allowed, opts),
  problem: (status, code, extra) => problem(status, code, extra),
  db: () => db,
  rsv: () => reservations.state,
  roomStatus: () => stay.state.roomStatus,
  attachments: () => stay.state.attachments,
});

// Sprint 4 FE-B (EP01 – H03/H24): KPI, arrivals/departures, "Cần chú ý" computed from the mocks above.
const dashboard = createDashboardMock({
  guard: (request, allowed) => guard(request, allowed),
  problem: (status, code, extra) => problem(status, code, extra),
  db: () => db,
  rsv: () => reservations.state,
  extra: () => [...stay.registrationAttention(), ...ops.attentionItems()],
});

/** Reset state between tests / from the browser console (`__ottimoMock.reset()`). */
export const mockControl = {
  reset() {
    db = makeDb();
    reservations.reset();
    stay.reset();
    ops.reset();
    dashboard.reset();
    persist();
  },
  failNext(
    match: RegExp,
    status: number,
    body: Record<string, unknown>,
    headers?: Record<string, string>,
  ) {
    db.failNext = { match, status, body, headers };
  },
  signInAs(username: string) {
    db.sessionUserId = db.users.find((u) => u.username === username)?.id ?? null;
    db.enrollmentOnly = false;
  },
  /** US-143: turn 2FA on for a seed user; returns the secret and the 10 recovery codes (tests). */
  enableMfa(username: string, recovery = recoveryCodes()) {
    const u = db.users.find((x) => x.username === username)!;
    const secret = randomBase32(32);
    u.mfa = { secret, recovery: [...recovery], enrolledAt: '2026-10-22T09:00:00+07:00' };
    return { secret, recovery };
  },
  get db() {
    return db;
  },
  /** EP02 mock state (reservations, quotes, blocks…) for tests. */
  get rsv() {
    return reservations.state;
  },
  /** Sprint 3 mock state (folios, payments, approvals, registrations…) for tests. */
  get stay() {
    return stay.state;
  },
  /** Sprint 4 EP01 mock (stored "Cần chú ý" events) for tests / the H24 SSE simulation. */
  get dashboard() {
    return dashboard;
  },
  /** Sprint 4 Desk ops mock (work orders, blocks, tasks, requests, minibar meta) for tests. */
  get ops() {
    return ops.state;
  },
};

function persist() {
  try {
    sessionStorage.setItem(SESSION_KEY, db.sessionUserId ?? '');
  } catch {
    /* ignore */
  }
}

export function restoreMockSession() {
  try {
    db.sessionUserId = sessionStorage.getItem(SESSION_KEY) || null;
  } catch {
    /* ignore */
  }
}

let reqSeq = 0;
let csrfSeq = 0;

/** 0.3.4 Q4: `401 REAUTH_FAILED` always carries `errors[{field, code: REAUTH_FAILED}]`. */
function reauthFailed(field: string) {
  return problem(401, 'REAUTH_FAILED', { errors: [{ field, code: 'REAUTH_FAILED' }] });
}

/**
 * StrongReauth (S2 – SEC A.5, OpenAPI 0.3.8): missing factor → 422 STRONG_REAUTH_REQUIRED (not counted);
 * any wrong factor → the same 401 REAUTH_FAILED (`field` = `reauth`). TOTP replay refused per step.
 */
export async function strongReauth(
  u: MockUser,
  raw: unknown,
  // Operations with their own fields (changeMyPassword, trustCurrentDevice): `currentPassword` + `totpCode`.
  fields: { password: string; factor: string } = { password: 'reauth', factor: 'reauth.totpCode' },
): Promise<Response | null> {
  const r = (raw ?? {}) as { password?: string; totpCode?: string; recoveryCode?: string };
  const m = u.mfa;
  // 422 before any password check (SEC review ca 11 (a)) – never counted.
  if (!r.password) return validation([{ field: fields.password, code: 'STRONG_REAUTH_REQUIRED' }]);
  if (m?.secret && !r.totpCode && !r.recoveryCode)
    return validation([{ field: fields.factor, code: 'STRONG_REAUTH_REQUIRED' }]);
  if (r.password !== MOCK_PASSWORD) return reauthFailed(fields.password);
  if (!m?.secret) return null;
  if (r.totpCode) {
    const step = await matchStep(m.secret, r.totpCode);
    if (step === null || step <= (m.lastStep ?? -1)) return reauthFailed(fields.password);
    m.lastStep = step;
    return null;
  }
  const i = m.recovery.indexOf(normRecovery(r.recoveryCode!));
  if (i < 0) return reauthFailed(fields.password);
  m.recovery.splice(i, 1);
  return null;
}

function problem(
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  const requestId = `mock-${(++reqSeq).toString(36).padStart(4, '0')}`;
  return HttpResponse.json(
    {
      type: `/problems/${code.toLowerCase().replace(/_/g, '-')}`,
      title: code,
      status,
      code,
      requestId,
      ...extra,
    },
    {
      status,
      headers: {
        'content-type': 'application/problem+json',
        'x-request-id': requestId,
        ...headers,
      },
    },
  );
}

const validation = (errors: Array<{ field: string; code: string }>) =>
  problem(422, 'VALIDATION_FAILED', { errors });

function current(): MockUser | null {
  return db.users.find((u) => u.id === db.sessionUserId && u.status === 'active') ?? null;
}

function rolesOf(u: MockUser): Role[] {
  return u.roles.filter((r) => r.propertyId === PROPERTY_ID).map((r) => r.role);
}

function toMe(u: MockUser): Me {
  const roles = rolesOf(u);
  const screens = [...new Set(roles.flatMap((r) => SCREENS[r]))].sort();
  return {
    id: u.id,
    displayName: u.displayName,
    csrfToken: db.csrf,
    activePropertyId: PROPERTY_ID,
    properties: roles.length
      ? [
          {
            propertyId: PROPERTY_ID,
            name: PROPERTY_NAME,
            timezone: 'Asia/Ho_Chi_Minh',
            roles,
            screens,
            deviceTrusted:
              u.deviceTrusted === true || (roles.includes('owner') && db.currentDeviceTrusted),
            // 0.3.8 R3-Q38: business day at answer time (= ctx.today) + the rollover in force.
            ...(db.meBusinessDate
              ? {
                  businessDate: businessDayLocal('Asia/Ho_Chi_Minh', new Date(), db.rollover),
                  businessDayRollover: db.rollover,
                }
              : {}),
          },
        ]
      : [],
    mustChangePassword: u.mustChangePassword === true,
    ...mfaView(u),
  };
}

function mfaRequired(u: MockUser): boolean {
  return u.roles.some((r) => MFA_ROLES.includes(r.role));
}

/** Me 2FA fields (OpenAPI 0.3.8): nudge only when not enforced; restricted session when enforced. */
function mfaView(u: MockUser): Partial<Me> {
  const enabled = !!u.mfa?.secret;
  const owners = db.users.filter(
    (x) => x.status === 'active' && x.roles.some((r) => r.role === 'owner'),
  );
  const isOwner = u.roles.some((r) => r.role === 'owner');
  return {
    mfaEnabled: enabled,
    ...(!db.mfaEnforced && mfaRequired(u) && !enabled ? { mfaRequiredButMissing: true } : {}),
    ...(db.enrollmentOnly && db.sessionUserId === u.id ? { mfaEnrollmentRequired: true } : {}),
    ...(isOwner && owners.length === 1 ? { soleOwner: true } : {}),
    ...(enabled && (u.mfa?.recovery.length ?? 0) <= 3 ? { recoveryCodesLow: true } : {}),
  };
}

interface ReceivingRow {
  bankBin: string;
  accountNo: string;
  accountName: string;
  effectiveFrom: string;
  changedBy: string;
  changedAt: string;
  reason: string;
}
const RECEIVING_KEY = 'payment_receiving_account';
/** Like the server (BE-B cf0ce2f): ≥ 6 digits in a run (space-separated groups joined) or the number sent. */
function reasonHasAccountNo(reason: string, accountNo?: string): boolean {
  const joined = reason.replace(/(\d)\s+(?=\d)/g, '$1');
  return /\d{6,}/.test(joined) || (!!accountNo && joined.includes(accountNo));
}
/** Small static NAPAS table like the server's (0.3.8: unknown BIN → no bankName). */
const MOCK_BANKS: Record<string, string> = {
  '970407': 'Techcombank',
  '970436': 'Vietcombank',
  '970418': 'BIDV',
  '970415': 'VietinBank',
  '970422': 'MB',
};
/** 0.3.8 (SEC Q51-2): `•••• 1234` + bankName; the full number never leaves the mock either. */
function receivingView(r: ReceivingRow): Parameter {
  return {
    key: RECEIVING_KEY,
    value: {
      bankBin: r.bankBin,
      ...(MOCK_BANKS[r.bankBin] ? { bankName: MOCK_BANKS[r.bankBin] } : {}),
      accountNoMasked: `•••• ${r.accountNo.slice(-4)}`,
      accountName: r.accountName,
    },
    effectiveFrom: r.effectiveFrom,
    editableBy: ['owner'],
    changedBy: r.changedBy,
    changedAt: r.changedAt,
    reason: r.reason,
  };
}

type Guard = { user: MockUser; roles: Role[] } | Response;

/** Order like the API middleware: auth → CSRF → password-change gate → If-Match → roles. */
function guard(
  request: StrictRequest<DefaultBodyType>,
  allowed: Role[] | 'any',
  opts: { ifMatch?: number; allowPasswordChange?: boolean; allowEnrollment?: boolean } = {},
): Guard {
  if (db.failNext && db.failNext.match.test(new URL(request.url).pathname + ':' + request.method)) {
    const f = db.failNext;
    db.failNext = null;
    return problem(f.status, String(f.body.code ?? 'INTERNAL_ERROR'), f.body, f.headers);
  }
  const user = current();
  if (!user) return problem(401, 'UNAUTHENTICATED');
  if (request.method !== 'GET' && request.headers.get('x-csrf-token') !== db.csrf) {
    return problem(403, 'FORBIDDEN_ACTION');
  }
  if (user.mustChangePassword && !opts.allowPasswordChange)
    return problem(403, 'PASSWORD_CHANGE_REQUIRED');
  // SEC 06.4: restricted session – only getMe, getMy2fa, setup, confirm, logout.
  if (db.enrollmentOnly && !opts.allowEnrollment) return problem(403, 'MFA_ENROLLMENT_REQUIRED');
  const roles = rolesOf(user);
  if (allowed !== 'any' && !roles.some((r) => allowed.includes(r)))
    return problem(403, 'FORBIDDEN_ACTION');
  if (opts.ifMatch !== undefined) {
    const h = request.headers.get('if-match');
    if (!h) return problem(428, 'PRECONDITION_REQUIRED');
    if (h.replace(/"/g, '') !== String(opts.ifMatch)) return problem(412, 'VERSION_CONFLICT');
  }
  return { user, roles };
}

const isResponse = (g: Guard): g is Response => g instanceof Response;
const base = '*/v1';
const prop = `${base}/properties/:propertyId`;

function omit<T extends object>(o: T, keys: string[]): T {
  const out = { ...o } as Record<string, unknown>;
  for (const k of keys) delete out[k];
  return out as T;
}

function roomView(r: Room, roles: Role[]): Room {
  if (FD_PLUS.some((x) => roles.includes(x)) || SALES.some((x) => roles.includes(x))) return r;
  return omit(r, ['baseOccupancy', 'maxOccupancy', 'currentListPrice']);
}

/** x-visible-to filtering of Guest (rbac §6): absent, not null. */
function guestView(g: MockGuest, roles: Role[]) {
  const fd = FD_PLUS.some((x) => roles.includes(x));
  const sal = roles.includes('sales_staff');
  const out = omit(g, ['createdBy']) as unknown as Record<string, unknown>;
  if (!fd)
    for (const k of [
      'dateOfBirth',
      'companyName',
      'taxCode',
      'freeNote',
      'idDocLast4',
      'warnings',
      'serviceNotes',
    ])
      delete out[k];
  if (!fd && !sal) delete out.tags;
  return out;
}

function summary(g: MockGuest, roles: Role[]) {
  const digits = (g.phone ?? '').replace(/\D/g, '');
  const local = digits.startsWith('84') ? `0${digits.slice(2)}` : digits;
  const s: Record<string, unknown> = {
    id: g.id,
    code: g.code,
    displayName: g.fullName,
    nationalityCode: g.nationalityCode,
    phoneMasked: local ? `${local.slice(0, 4)}***${local.slice(-3)}` : undefined,
  };
  if (FD_PLUS.some((x) => roles.includes(x)) || roles.includes('sales_staff'))
    s.tags = g.tags ?? [];
  return s;
}

function inScope(g: MockGuest, user: MockUser, roles: Role[]) {
  return FD_PLUS.some((x) => roles.includes(x)) || g.createdBy === user.id;
}

function phoneKey(raw?: string) {
  if (!raw) return null;
  const n = normalizePhone(raw);
  return 'value' in n ? n.value : null;
}

function guestFieldErrors(body: Record<string, unknown>) {
  const errors: Array<{ field: string; code: string }> = [];
  const name = String(body.fullName ?? '').trim();
  if (!name) errors.push({ field: 'fullName', code: 'REQUIRED' });
  else if (/\d/.test(name)) errors.push({ field: 'fullName', code: 'NAME_INVALID' });
  if (!body.phone && !body.email) errors.push({ field: 'phone', code: 'CONTACT_REQUIRED' });
  if (body.phone && !phoneKey(String(body.phone)))
    errors.push({ field: 'phone', code: 'PHONE_INVALID' });
  if (body.taxCode && !/^[0-9]{10}(-?[0-9]{3})?$/.test(String(body.taxCode)))
    errors.push({ field: 'taxCode', code: 'TAX_CODE_INVALID' });
  if (typeof body.freeNote === 'string' && /(?:\d[ -]?){13,19}/.test(body.freeNote))
    errors.push({ field: 'freeNote', code: 'CARD_NUMBER_DETECTED' });
  return errors;
}

function duplicateOf(body: Record<string, unknown>, selfId?: string) {
  const pk = phoneKey(body.phone as string | undefined);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
  return db.guests.find(
    (g) =>
      g.id !== selfId &&
      ((pk && phoneKey(g.phone) === pk) || (email && g.email?.toLowerCase() === email)),
  );
}

/** 0.3.4 Q5: 409 names the clashing field; existingGuest* only when the caller may see that profile. */
function duplicateGuest(
  dup: MockGuest,
  user: MockUser,
  roles: Role[],
  body: Record<string, unknown>,
) {
  const pk = phoneKey(body.phone as string | undefined);
  const field = pk && phoneKey(dup.phone) === pk ? 'phone' : 'email';
  return problem(409, 'DUPLICATE_GUEST', {
    errors: [{ field, code: 'DUPLICATE_GUEST' }],
    ...(inScope(dup, user, roles) ? { existingGuestId: dup.id, existingGuestCode: dup.code } : {}),
  });
}

export type MockGuard = typeof guard;
export type MockProblem = (
  status: number,
  code: string,
  extra?: Record<string, unknown>,
) => Response;
export type MockDb = ReturnType<typeof makeDb>;
export type MockSummary = typeof summary;

export const handlers = [
  // UXR #2: like the API (auth.guard.ts), any Idempotency-Key that is not a UUID → 422 on every write.
  http.all(`${base}/*`, ({ request }) => {
    const key = request.headers.get('idempotency-key');
    if (key !== null && !isIdempotencyKey(key))
      return validation([{ field: 'Idempotency-Key', code: 'VALIDATION_FAILED' }]);
    return undefined;
  }),
  // EP01 first: its `GET …/attention` (full BR-907 list, incl. the stay item) wins over the S3 one in stay.ts.
  ...dashboard.handlers,
  ...ops.handlers,
  ...stay.handlers,
  ...reservations.handlers,
  // ---------- auth (S01) ----------
  http.post(`${base}/auth/login`, async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };
    if (db.loginFailures >= 5) return problem(429, 'RATE_LIMITED', {}, { 'retry-after': '900' });
    const u = db.users.find(
      (x) =>
        x.username ===
        String(username ?? '')
          .trim()
          .toLowerCase(),
    );
    if (!u || password !== MOCK_PASSWORD || u.status !== 'active') {
      db.loginFailures += 1;
      return problem(401, 'UNAUTHENTICATED');
    }
    db.loginFailures = 0;
    // SEC 06.17: 2FA on → no session yet, a one-time step-2 token (5 min).
    if (u.mfa?.secret) {
      const mfaToken = randomBase32(52);
      db.mfaTokens.set(mfaToken, { userId: u.id, expiresAt: Date.now() + 5 * 60_000, fails: 0 });
      return problem(401, 'MFA_REQUIRED', { mfaToken });
    }
    db.sessionUserId = u.id;
    db.enrollmentOnly = db.mfaEnforced && mfaRequired(u);
    db.amr = 'pwd';
    u.lastLoginAt = new Date().toISOString();
    persist();
    return HttpResponse.json(toMe(u));
  }),
  // US-143 step 2 (SEC 06.17–06.21): every failure is the same 401 MFA_INVALID.
  http.post(`${base}/auth/login/mfa`, async ({ request }) => {
    const body = (await request.json()) as {
      mfaToken?: string;
      totpCode?: string;
      recoveryCode?: string;
    };
    if (!body.mfaToken || !!body.totpCode === !!body.recoveryCode)
      return validation([{ field: 'totpCode', code: 'REQUIRED' }]);
    const invalid = () => problem(401, 'MFA_INVALID');
    const t = db.mfaTokens.get(body.mfaToken);
    if (!t || t.expiresAt < Date.now()) {
      db.mfaTokens.delete(body.mfaToken);
      return invalid();
    }
    const u = db.users.find((x) => x.id === t.userId);
    if (!u?.mfa?.secret) return invalid();
    let ok = false;
    if (body.totpCode) {
      const step = await matchStep(u.mfa.secret, body.totpCode);
      ok = step !== null && step > (u.mfa.lastStep ?? -1);
      if (ok) u.mfa.lastStep = step!;
    } else {
      const i = u.mfa.recovery.indexOf(normRecovery(body.recoveryCode!));
      ok = i >= 0;
      if (ok) u.mfa.recovery.splice(i, 1);
    }
    if (!ok) {
      t.fails += 1;
      if (t.fails >= 5) db.mfaTokens.delete(body.mfaToken);
      return invalid();
    }
    db.mfaTokens.delete(body.mfaToken);
    db.sessionUserId = u.id;
    // ARC 0.3.8 bổ sung 1 (12.3): a recovery code = the old phone is lost → restricted session for
    // EVERYONE with 2FA, only re-enrollment until a new authenticator is confirmed (US-143 AC3 a).
    db.enrollmentOnly = !body.totpCode;
    db.amr = body.totpCode ? 'totp' : 'recovery_code';
    db.csrf = `mock-csrf-${++csrfSeq}`;
    u.lastLoginAt = new Date().toISOString();
    persist();
    return HttpResponse.json(toMe(u));
  }),
  http.post(`${base}/auth/logout`, () => {
    db.sessionUserId = null;
    db.enrollmentOnly = false;
    persist();
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${base}/me`, ({ request }) => {
    const g = guard(request, 'any', { allowPasswordChange: true, allowEnrollment: true });
    return isResponse(g) ? g : HttpResponse.json(toMe(g.user));
  }),
  // ---------- 2FA (US-143, OpenAPI 0.3.8) ----------
  http.get(`${base}/me/2fa`, ({ request }) => {
    const g = guard(request, 'any', { allowEnrollment: true });
    if (isResponse(g)) return g;
    const m = g.user.mfa;
    const v = mfaView(g.user);
    return HttpResponse.json({
      enabled: !!m?.secret,
      required: mfaRequired(g.user),
      enforced: db.mfaEnforced,
      pendingSetup: !!m?.pending && m.pending.expiresAt > Date.now(),
      ...(m?.enrolledAt ? { enrolledAt: m.enrolledAt } : {}),
      ...(m?.secret ? { recoveryCodesRemaining: m.recovery.length } : {}),
      ...(v.soleOwner ? { soleOwner: true } : {}),
    });
  }),
  http.post(`${base}/me/2fa/setup`, async ({ request }) => {
    const g = guard(request, 'any', { allowEnrollment: true });
    if (isResponse(g)) return g;
    const body = (await request.json()) as { currentPassword?: string };
    if (body.currentPassword !== MOCK_PASSWORD) return reauthFailed('currentPassword');
    // 12.3 (b): 2FA on → only from a recovery-code session (re-enrollment); the old secret keeps working
    // until the new one is confirmed.
    const reenroll = !!g.user.mfa?.secret && db.amr === 'recovery_code';
    if (g.user.mfa?.secret && !reenroll) return problem(409, 'INVALID_TRANSITION');
    // Every call = a NEW pending secret (SEC 06.9) – the previous QR stops working.
    const secret = randomBase32(32);
    const expiresAt = Date.now() + 10 * 60_000;
    g.user.mfa = reenroll
      ? { ...g.user.mfa!, pending: { secret, expiresAt } }
      : { recovery: [], pending: { secret, expiresAt } };
    return HttpResponse.json(
      {
        otpauthUri: `otpauth://totp/OTTIMO:${encodeURIComponent(g.user.username)}?secret=${secret}&issuer=OTTIMO&algorithm=SHA1&digits=6&period=30`,
        expiresAt: new Date(expiresAt).toISOString(),
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  }),
  http.post(`${base}/me/2fa/confirm`, async ({ request }) => {
    const g = guard(request, 'any', { allowEnrollment: true });
    if (isResponse(g)) return g;
    const m = g.user.mfa;
    const reenroll = !!m?.secret && db.amr === 'recovery_code';
    if ((m?.secret && !reenroll) || !m?.pending || m.pending.expiresAt < Date.now())
      return problem(409, 'INVALID_TRANSITION');
    const body = (await request.json()) as { totpCode?: string };
    const step = await matchStep(m.pending.secret, String(body.totpCode ?? ''));
    if (step === null) return validation([{ field: 'totpCode', code: 'MFA_INVALID' }]);
    const codes = recoveryCodes();
    g.user.mfa = {
      secret: m.pending.secret,
      lastStep: step,
      recovery: [...codes],
      enrolledAt: new Date().toISOString(),
    };
    // SEC 06.10: other sessions revoked, a NEW session for this client – new CSRF (reload getMe).
    // Re-enrollment (12.3 c): the secret and the whole code set are replaced, session amr = totp.
    db.enrollmentOnly = false;
    db.amr = 'totp';
    db.csrf = `mock-csrf-${++csrfSeq}`;
    return HttpResponse.json(
      { recoveryCodes: codes },
      { headers: { 'cache-control': 'no-store' } },
    );
  }),
  http.post(`${base}/me/2fa/recovery-codes`, async ({ request }) => {
    const g = guard(request, 'any');
    if (isResponse(g)) return g;
    const bad = await strongReauth(g.user, await request.json());
    if (bad) return bad;
    if (!g.user.mfa?.secret) return problem(409, 'INVALID_TRANSITION');
    const codes = recoveryCodes();
    g.user.mfa.recovery = [...codes];
    return HttpResponse.json(
      { recoveryCodes: codes },
      { headers: { 'cache-control': 'no-store' } },
    );
  }),
  http.delete(`${base}/me/2fa`, async ({ request }) => {
    const g = guard(request, 'any');
    if (isResponse(g)) return g;
    if (mfaRequired(g.user)) return problem(403, 'FORBIDDEN_ACTION');
    const bad = await strongReauth(g.user, await request.json());
    if (bad) return bad;
    g.user.mfa = undefined;
    db.sessionUserId = null; // every session revoked, this one too
    persist();
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(`${base}/me/password`, async ({ request }) => {
    const g = guard(request, 'any', { allowPasswordChange: true });
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      totpCode?: string;
      recoveryCode?: string;
    };
    // 0.3.4 Q4: wrong confirmation = field error inside 401 REAUTH_FAILED, NOT an expired session.
    // 0.3.8 (SEC 06.25 – S2, BE-C 8712822): + totpCode / recoveryCode once 2FA is on.
    const bad = await strongReauth(g.user, { ...body, password: body.currentPassword }, CP_FIELDS);
    if (bad) return bad;
    if (!body.newPassword || body.newPassword.length < 10)
      return validation([{ field: 'newPassword', code: 'PASSWORD_TOO_SHORT' }]);
    if (body.newPassword === body.currentPassword || body.newPassword === g.user.username) {
      return validation([{ field: 'newPassword', code: 'PASSWORD_REUSED' }]);
    }
    g.user.mustChangePassword = false;
    // 0.3.4 Q3: every session is revoked and a new cookie issued – new CSRF token, User.version + 1.
    db.csrf = `mock-csrf-${++csrfSeq}`;
    g.user.version = (g.user.version ?? 1) + 1;
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- rooms (S25) ----------
  http.get(`${prop}/rooms`, ({ request }) => {
    const g = guard(request, [...FD_PLUS, ...SALES]);
    return isResponse(g)
      ? g
      : HttpResponse.json({ data: db.rooms.map((r) => roomView(r, g.roles)) });
  }),
  http.get(`${prop}/room-groups`, ({ request }) => {
    const g = guard(request, [...FD_PLUS, ...SALES]);
    return isResponse(g) ? g : HttpResponse.json({ data: db.groups });
  }),
  http.patch(`${prop}/rooms/:roomId`, async ({ request, params }) => {
    const room = db.rooms.find((r) => r.id === params.roomId);
    if (!room) return problem(404, 'NOT_FOUND');
    const g = guard(request, ['owner', 'manager'], { ifMatch: room.version });
    if (isResponse(g)) return g;
    const body = (await request.json()) as Record<string, unknown> & {
      listPrice?: Record<string, unknown>;
    };
    const base = (body.baseOccupancy as number | undefined) ?? room.baseOccupancy ?? 1;
    const max = (body.maxOccupancy as number | undefined) ?? room.maxOccupancy ?? base + 1;
    const errors: Array<{ field: string; code: string }> = [];
    if (max !== base && max !== base + 1)
      errors.push({ field: 'maxOccupancy', code: 'MAX_OCCUPANCY_RANGE' });
    if (body.listPrice) {
      const lp = body.listPrice;
      if (!(Number(lp.monthlyListPriceVnd) > 0))
        errors.push({ field: 'listPrice.monthlyListPriceVnd', code: 'AMOUNT_NOT_POSITIVE' });
      if (String(lp.effectiveFrom) < todayLocal())
        errors.push({ field: 'listPrice.effectiveFrom', code: 'DATE_IN_PAST' });
      if (String(lp.reason ?? '').trim().length < 3)
        errors.push({ field: 'listPrice.reason', code: 'REASON_REQUIRED' });
    }
    if (errors.length) return validation(errors);
    const conflicts = (BOOKED_GUESTS[room.roomNo] ?? []).filter((b) => b.guestCount > max);
    if (conflicts.length) return problem(409, 'CAPACITY_BELOW_BOOKINGS', { conflicts });
    Object.assign(room, {
      name: (body.name as string | undefined) ?? room.name,
      bedSetup:
        'bedSetup' in body ? ((body.bedSetup as string | null) ?? undefined) : room.bedSetup,
      roomGroupId: (body.roomGroupId as string | undefined) ?? room.roomGroupId,
      baseOccupancy: base,
      maxOccupancy: max,
      isSellable: (body.isSellable as boolean | undefined) ?? room.isSellable,
      version: room.version + 1,
    });
    if (body.listPrice && String(body.listPrice.effectiveFrom) <= todayLocal()) {
      const m = Number(body.listPrice.monthlyListPriceVnd);
      room.currentListPrice = {
        effectiveFrom: String(body.listPrice.effectiveFrom),
        monthlyListPriceVnd: m,
        nightlyListPriceVnd: Math.round(m / 12 / 1000) * 1000,
      };
    }
    // 0.3.6 A-39: stop-sale is not blocked by future bookings – it warns with their count.
    const keep =
      body.isSellable === false
        ? reservations.state.reservations.filter(
            (r) =>
              r.roomId === room.id &&
              ['hold', 'confirmed', 'in_house'].includes(r.status) &&
              r.departureDate > todayLocal(),
          ).length
        : 0;
    const warnings = keep ? [{ code: 'FUTURE_RESERVATIONS_KEEP_ROOM', count: keep }] : [];
    return HttpResponse.json({ ...room, warnings }, { headers: { etag: `"${room.version}"` } });
  }),

  // ---------- R3-Q51 receiving account (OpenAPI 0.3.8; SEC mục C) – before the generic handlers ----------
  http.get(`${prop}/parameters/${RECEIVING_KEY}`, ({ request }) => {
    const g = guard(request, ['owner']); // Q51-1: owner only, even the masked read
    if (isResponse(g)) return g;
    const today = businessDayLocal();
    const rows = [...db.receiving].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    const cur = rows.find((r) => r.effectiveFrom <= today);
    // 0.3.8 bổ sung 2 (ARC Q51-01): 404 only when there is no row at all; scheduled-only → 200, no `current`.
    if (!rows.length) return problem(404, 'NOT_FOUND');
    return HttpResponse.json({
      ...(cur ? { current: receivingView(cur) } : {}),
      history: rows.map(receivingView),
    });
  }),
  http.put(`${prop}/parameters/${RECEIVING_KEY}`, async ({ request }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      value?: { bankBin?: string; accountNo?: string; accountName?: string; [k: string]: unknown };
      effectiveFrom?: string;
      reason?: string;
      reauth?: { authMethod?: string; secret?: string; totpCode?: string; recoveryCode?: string };
    };
    if (
      reasonHasAccountNo(
        String(body.reason ?? ''),
        (body as { value?: { accountNo?: string } }).value?.accountNo,
      )
    )
      return validation([{ field: 'reason', code: 'ACCOUNT_NUMBER_NOT_ALLOWED' }]);
    if (!body.reauth) return validation([{ field: 'reauth', code: 'REQUIRED' }]);
    const bad = await strongReauth(
      g.user,
      { ...body.reauth, password: body.reauth.secret },
      { password: 'reauth.secret', factor: 'reauth.totpCode' },
    );
    if (bad) return bad;
    const v = body.value ?? {};
    const errors: Array<{ field: string; code: string }> = [];
    const extra = Object.keys(v).filter(
      (k) => !['bankBin', 'accountNo', 'accountName'].includes(k),
    );
    if (extra.length) errors.push({ field: 'value', code: 'VALIDATION_FAILED' });
    if (!/^\d{6}$/.test(String(v.bankBin ?? '')))
      errors.push({ field: 'value.bankBin', code: 'VALIDATION_FAILED' });
    if (!/^\d{6,19}$/.test(String(v.accountNo ?? '')))
      errors.push({ field: 'value.accountNo', code: 'VALIDATION_FAILED' });
    if (!/^[A-Z0-9 ]{1,50}$/.test(String(v.accountName ?? '')))
      errors.push({ field: 'value.accountName', code: 'VALIDATION_FAILED' });
    // Q51-5: from the next business day, the first time too – no "now" path.
    if (!body.effectiveFrom || body.effectiveFrom <= businessDayLocal())
      errors.push({ field: 'effectiveFrom', code: 'EFFECTIVE_FROM_TOMORROW' });
    if (String(body.reason ?? '').trim().length < 3)
      errors.push({ field: 'reason', code: 'REASON_REQUIRED' });
    if (errors.length) return validation(errors);
    const row: ReceivingRow = {
      bankBin: String(v.bankBin),
      accountNo: String(v.accountNo),
      accountName: String(v.accountName),
      effectiveFrom: body.effectiveFrom!,
      changedBy: g.user.displayName,
      changedAt: new Date().toISOString(),
      reason: String(body.reason).trim(),
    };
    // Same day as a scheduled row = edit that row.
    db.receiving = [...db.receiving.filter((r) => r.effectiveFrom !== row.effectiveFrom), row];
    const view = receivingView(row);
    db.receivingAudit.push({
      action: 'config.changed',
      after: view.value,
      effectiveFrom: row.effectiveFrom,
    });
    return HttpResponse.json(view);
  }),
  http.post(`${prop}/parameters/${RECEIVING_KEY}/actions/cancel-scheduled`, async ({ request }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      effectiveFrom?: string;
      reason?: string;
      reauth?: { secret?: string; totpCode?: string; recoveryCode?: string };
    };
    if (
      reasonHasAccountNo(
        String(body.reason ?? ''),
        (body as { value?: { accountNo?: string } }).value?.accountNo,
      )
    )
      return validation([{ field: 'reason', code: 'ACCOUNT_NUMBER_NOT_ALLOWED' }]);
    if (!body.reauth) return validation([{ field: 'reauth', code: 'REQUIRED' }]);
    const bad = await strongReauth(
      g.user,
      { ...body.reauth, password: body.reauth.secret },
      { password: 'reauth.secret', factor: 'reauth.totpCode' },
    );
    if (bad) return bad;
    if (String(body.reason ?? '').trim().length < 3)
      return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
    const row = db.receiving.find((r) => r.effectiveFrom === body.effectiveFrom);
    if (!row) return problem(404, 'NOT_FOUND');
    if (row.effectiveFrom <= businessDayLocal()) return problem(409, 'INVALID_TRANSITION');
    db.receiving = db.receiving.filter((r) => r !== row);
    db.receivingAudit.push({
      action: 'config.changed',
      after: { cancelledEffectiveFrom: row.effectiveFrom, ...(receivingView(row).value as object) },
    });
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- parameters (S24) ----------
  http.get(`${prop}/parameters`, ({ request }) => {
    const g = guard(request, ['owner', 'manager', 'front_desk_lead']);
    if (isResponse(g)) return g;
    // `asOf` like the server: per key the latest value with effectiveFrom ≤ asOf (scheduled ones included).
    const asOf = new URL(request.url).searchParams.get('asOf');
    if (!asOf) return HttpResponse.json({ data: db.params });
    const data = db.params.map((cur) => {
      const all = db.history.get(cur.key) ?? [cur];
      return (
        [...all]
          .filter((h) => h.effectiveFrom <= asOf)
          .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? cur
      );
    });
    return HttpResponse.json({ data });
  }),
  http.get(`${prop}/parameters/:key`, ({ request, params }) => {
    const g = guard(request, ['owner', 'manager', 'front_desk_lead']);
    if (isResponse(g)) return g;
    const cur = db.params.find((p) => p.key === params.key);
    if (!cur) return problem(404, 'NOT_FOUND');
    const history = db.history.get(cur.key) ?? [cur];
    return HttpResponse.json({ current: cur, history });
  }),
  http.put(`${prop}/parameters/:key`, async ({ request, params }) => {
    const cur = db.params.find((p) => p.key === params.key);
    const g = guard(request, ['owner', 'manager']);
    if (isResponse(g)) return g;
    if (!cur) return problem(404, 'NOT_FOUND');
    if (!(cur.editableBy ?? []).some((r) => g.roles.includes(r)))
      return problem(403, 'FORBIDDEN_ACTION');
    const body = (await request.json()) as {
      value: unknown;
      effectiveFrom?: string;
      reason?: string;
    };
    const errors: Array<{ field: string; code: string }> = [];
    if (!body.effectiveFrom) errors.push({ field: 'effectiveFrom', code: 'REQUIRED' });
    else if (body.effectiveFrom < todayLocal())
      errors.push({ field: 'effectiveFrom', code: 'DATE_IN_PAST' });
    if (String(body.reason ?? '').trim().length < 3)
      errors.push({ field: 'reason', code: 'REASON_REQUIRED' });
    if (typeof cur.value === 'number' && typeof body.value !== 'number')
      errors.push({ field: 'value', code: 'VALUE_INVALID' });
    if (errors.length) return validation(errors);
    const bounds = PARAM_BOUNDS[cur.key];
    if (bounds && 'allowedFrom' in bounds) {
      const allowed = (db.params.find((p) => p.key === bounds.allowedFrom)?.value ??
        []) as number[];
      if (!allowed.includes(body.value as number)) {
        return problem(422, 'PARAM_OUT_OF_RANGE', {
          allowed,
          errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
        });
      }
    } else if (bounds && 'min' in bounds) {
      const v = body.value as number;
      if (v < bounds.min || v > bounds.max) {
        return problem(422, 'PARAM_OUT_OF_RANGE', {
          ...bounds,
          errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
        });
      }
    }
    const next: Parameter = {
      ...cur,
      value: body.value,
      effectiveFrom: body.effectiveFrom!,
      reason: body.reason,
      changedBy: g.user.displayName,
      changedAt: new Date().toISOString(),
    };
    db.history.set(cur.key, [next, ...(db.history.get(cur.key) ?? [cur])]);
    if (next.effectiveFrom <= todayLocal()) Object.assign(cur, next);
    return HttpResponse.json(next);
  }),

  // ---------- guests (S14) ----------
  http.get(`${prop}/guests`, ({ request }) => {
    const g = guard(request, [...FD_PLUS, ...SALES]);
    if (isResponse(g)) return g;
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (q.length < 2) return validation([{ field: 'q', code: 'TOO_SHORT' }]);
    const key = nameSearchKey(q);
    const limit =
      url.searchParams.get('picker') === 'true' ? 5 : Number(url.searchParams.get('limit') ?? 20);
    const found = db.guests
      .filter((x) => inScope(x, g.user, g.roles))
      .filter(
        (x) => nameSearchKey(x.fullName).includes(key) || x.code.toUpperCase() === q.toUpperCase(),
      )
      .slice(0, limit);
    return HttpResponse.json({
      data: found.map((x) => summary(x, g.roles)),
      page: { nextCursor: null, limit },
    });
  }),
  http.post(`${prop}/guests/lookup`, async ({ request }) => {
    const g = guard(request, [...FD_PLUS, ...SALES]);
    if (isResponse(g)) return g;
    const body = (await request.json()) as Record<string, unknown>;
    const hit = duplicateOf(body);
    if (!hit) return HttpResponse.json({ matches: [] });
    // exists_only_or_own (0.3.4 Q1): SAL/CTV learn only that a profile exists – no id, code or name.
    if (!inScope(hit, g.user, g.roles))
      return HttpResponse.json({ matches: [], match: 'possible_duplicate' });
    return HttpResponse.json({ matches: [summary(hit, g.roles)] });
  }),
  http.post(`${prop}/guests`, async ({ request }) => {
    const g = guard(request, [...FD_PLUS, ...SALES]);
    if (isResponse(g)) return g;
    if (!request.headers.get('idempotency-key')) return problem(428, 'PRECONDITION_REQUIRED');
    const body = (await request.json()) as Record<string, unknown>;
    const errors = guestFieldErrors(body);
    if (errors.length) return validation(errors);
    const dup = duplicateOf(body);
    if (dup) return duplicateGuest(dup, g.user, g.roles, body);
    const n = db.nextGuest++;
    const guest: MockGuest = {
      ...(body as Partial<MockGuest>),
      id: `0192a1b0-0000-7000-8000-${String(300 + n).padStart(12, '0')}`,
      code: `KH-${String(n).padStart(4, '0')}`,
      fullName: String(body.fullName).trim(),
      version: 1,
      createdBy: g.user.id,
    } as MockGuest;
    db.guests.push(guest);
    return HttpResponse.json(guestView(guest, g.roles), { status: 201 });
  }),
  http.get(`${prop}/guests/:guestId`, ({ request, params }) => {
    const g = guard(request, [...FD_PLUS, ...SALES]);
    if (isResponse(g)) return g;
    const guest = db.guests.find((x) => x.id === params.guestId);
    if (!guest || !inScope(guest, g.user, g.roles)) return problem(404, 'NOT_FOUND');
    return HttpResponse.json(guestView(guest, g.roles), {
      headers: { etag: `"${guest.version}"` },
    });
  }),
  http.patch(`${prop}/guests/:guestId`, async ({ request, params }) => {
    const guest = db.guests.find((x) => x.id === params.guestId);
    if (!guest) return problem(404, 'NOT_FOUND');
    const g = guard(request, [...FD_PLUS, ...SALES], { ifMatch: guest.version });
    if (isResponse(g)) return g;
    if (!inScope(guest, g.user, g.roles)) return problem(404, 'NOT_FOUND');
    const body = (await request.json()) as Record<string, unknown>;
    const errors = guestFieldErrors(body);
    if (errors.length) return validation(errors);
    const dup = duplicateOf(body, guest.id);
    if (dup) return duplicateGuest(dup, g.user, g.roles, body);
    Object.assign(guest, body, { version: guest.version + 1 });
    return HttpResponse.json(guestView(guest, g.roles));
  }),

  // ---------- users & devices (S26 – owner) ----------
  http.get(`${base}/users`, ({ request }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const data = db.users.map((u) => omit(u, ['mustChangePassword', 'deviceTrusted']));
    return HttpResponse.json({ data, page: { nextCursor: null, limit: 100 } });
  }),
  http.put(`${base}/users/:userId/roles`, async ({ request, params }) => {
    const u = db.users.find((x) => x.id === params.userId);
    if (!u) return problem(404, 'NOT_FOUND');
    const g = guard(request, ['owner'], { ifMatch: u.version });
    if (isResponse(g)) return g;
    const { roles, reauth } = (await request.json()) as {
      roles: MockUser['roles'];
      reauth?: unknown;
    };
    if (!roles?.length) return validation([{ field: 'roles', code: 'REQUIRED' }]);
    // CỔNG S2 (BE-C ae836f7): only when the new list ADDS owner/manager (owner → manager is not one).
    const had = new Set(u.roles.map((r) => `${r.propertyId}:${r.role}`));
    const escalates = roles.some(
      (r) =>
        MFA_ROLES.includes(r.role) &&
        !had.has(`${r.propertyId}:${r.role}`) &&
        !(r.role === 'manager' && had.has(`${r.propertyId}:owner`)),
    );
    if (escalates) {
      const bad = await strongReauth(g.user, reauth);
      if (bad) return bad;
    }
    const owners = db.users.filter((x) => x.status === 'active' && rolesOf(x).includes('owner'));
    if (
      rolesOf(u).includes('owner') &&
      !roles.some((r) => r.role === 'owner') &&
      owners.length <= 1
    ) {
      return validation([{ field: 'roles', code: 'LAST_OWNER' }]);
    }
    u.roles = roles;
    u.version += 1;
    if (db.sessionUserId === u.id && u.id !== g.user.id) db.sessionUserId = null;
    return HttpResponse.json(u);
  }),
  // createUser (US-008 – S26 screen is FE-B's): always S2 (CỔNG, SEC 06.26).
  http.post(`${base}/users`, async ({ request }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      username?: string;
      displayName?: string;
      initialPassword?: string;
      roles?: MockUser['roles'];
      reauth?: unknown;
    };
    // Same order as users.controller/service (FE-B US-008): schema → S2 → password policy → 409 USERNAME_TAKEN.
    const username = String(body.username ?? '')
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9._-]{3,64}$/.test(username))
      return validation([{ field: 'username', code: username ? 'PATTERN' : 'REQUIRED' }]);
    if (!body.roles?.length) return validation([{ field: 'roles', code: 'REQUIRED' }]);
    const bad = await strongReauth(g.user, body.reauth);
    if (bad) return bad;
    const pw = String(body.initialPassword ?? '');
    const pwCode =
      pw.length < 10
        ? 'PASSWORD_TOO_SHORT'
        : pw.toLowerCase().includes(username)
          ? 'PASSWORD_SAME_AS_USERNAME'
          : /ottimo|password|12345678/i.test(pw)
            ? 'PASSWORD_TOO_COMMON'
            : null;
    if (pwCode) return validation([{ field: 'initialPassword', code: pwCode }]);
    if (db.users.some((x) => x.username === username))
      return problem(409, 'USERNAME_TAKEN', {
        errors: [{ field: 'username', code: 'USERNAME_TAKEN' }],
      });
    const u: MockUser = {
      id: `0192a1b0-0000-7000-8000-${String(900 + db.users.length).padStart(12, '0')}`,
      username,
      displayName: String(body.displayName ?? username),
      status: 'active',
      roles: body.roles ?? [],
      version: 1,
      mustChangePassword: true,
    };
    db.users.push(u);
    return HttpResponse.json(omit(u, ['mustChangePassword']), { status: 201 });
  }),
  http.patch(`${base}/users/:userId`, async ({ request, params }) => {
    const u = db.users.find((x) => x.id === params.userId);
    if (!u) return problem(404, 'NOT_FOUND');
    const g = guard(request, ['owner'], { ifMatch: u.version });
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      status?: 'active' | 'disabled';
      resetPassword?: string;
      displayName?: string;
      reauth?: unknown;
    };
    if (body.status === 'disabled' && u.id === g.user.id)
      return validation([{ field: 'status', code: 'LAST_OWNER' }]);
    // CỔNG S2: status / resetPassword on someone else (display name alone needs none).
    if (u.id !== g.user.id && (body.status !== undefined || body.resetPassword !== undefined)) {
      const bad = await strongReauth(g.user, body.reauth);
      if (bad) return bad;
    }
    if (body.resetPassword !== undefined && body.resetPassword.length < 10) {
      return validation([{ field: 'resetPassword', code: 'PASSWORD_TOO_SHORT' }]);
    }
    if (body.status) u.status = body.status;
    if (body.displayName) u.displayName = body.displayName;
    if (body.resetPassword) u.mustChangePassword = true;
    u.version += 1;
    return HttpResponse.json(u);
  }),
  http.get(`${prop}/trusted-devices`, ({ request }) => {
    const g = guard(request, ['owner']);
    return isResponse(g) ? g : HttpResponse.json({ data: db.devices });
  }),
  http.post(`${prop}/trusted-devices`, async ({ request }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      name?: string;
      deviceKind?: string;
      currentPassword?: string;
      totpCode?: string;
      recoveryCode?: string;
      hardeningChecklistConfirmed?: boolean;
    };
    // SR-DEV-02 at level S2 (0.3.8, SEC 06.27): + totpCode / recoveryCode once 2FA is on.
    const bad = await strongReauth(g.user, { ...body, password: body.currentPassword }, CP_FIELDS);
    if (bad) return bad;
    if (!body.hardeningChecklistConfirmed)
      return validation([{ field: 'hardeningChecklistConfirmed', code: 'CHECKLIST_REQUIRED' }]);
    if (db.devices.some((d) => !d.revokedAt && d.name === body.name))
      return validation([{ field: 'name', code: 'DUPLICATE' }]);
    const days = body.deviceKind === 'facility_mobile' ? 30 : 180;
    const now = new Date();
    const device = {
      id: `0192a1b0-0000-7000-8000-${String(db.nextDevice++).padStart(12, '0')}`,
      name: String(body.name),
      deviceKind: body.deviceKind as 'desk' | 'facility_mobile',
      createdByName: g.user.displayName,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + days * 86_400_000).toISOString(),
      lastSeenAt: now.toISOString(),
      isCurrentDevice: true,
    };
    db.devices.push(device);
    db.currentDeviceTrusted = true;
    return HttpResponse.json(device, { status: 201 });
  }),
  http.post(`${prop}/trusted-devices/:deviceId/actions/revoke`, async ({ request, params }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const d = db.devices.find((x) => x.id === params.deviceId);
    if (!d) return problem(404, 'NOT_FOUND');
    // CỔNG S2 (SEC 06.27).
    const { reauth } = ((await request.json().catch(() => ({}))) ?? {}) as { reauth?: unknown };
    const bad = await strongReauth(g.user, reauth);
    if (bad) return bad;
    d.revokedAt = new Date().toISOString();
    if (d.isCurrentDevice) db.currentDeviceTrusted = false;
    return HttpResponse.json(d);
  }),
];
