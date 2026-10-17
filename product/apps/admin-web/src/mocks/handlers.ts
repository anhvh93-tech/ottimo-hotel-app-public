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
import { todayLocal } from '../app/dates';
import { nameSearchKey, normalizePhone } from '../app/validation';
import { createReservationMock } from './reservations';
import { createStayMock } from './stay';
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

/** Reset state between tests / from the browser console (`__ottimoMock.reset()`). */
export const mockControl = {
  reset() {
    db = makeDb();
    reservations.reset();
    stay.reset();
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
          },
        ]
      : [],
    mustChangePassword: u.mustChangePassword === true,
    mfaEnabled: false,
  };
}

type Guard = { user: MockUser; roles: Role[] } | Response;

/** Order like the API middleware: auth → CSRF → password-change gate → If-Match → roles. */
function guard(
  request: StrictRequest<DefaultBodyType>,
  allowed: Role[] | 'any',
  opts: { ifMatch?: number; allowPasswordChange?: boolean } = {},
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
    db.sessionUserId = u.id;
    u.lastLoginAt = new Date().toISOString();
    persist();
    return HttpResponse.json(toMe(u));
  }),
  http.post(`${base}/auth/logout`, () => {
    db.sessionUserId = null;
    persist();
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${base}/me`, ({ request }) => {
    const g = guard(request, 'any', { allowPasswordChange: true });
    return isResponse(g) ? g : HttpResponse.json(toMe(g.user));
  }),
  http.post(`${base}/me/password`, async ({ request }) => {
    const g = guard(request, 'any', { allowPasswordChange: true });
    if (isResponse(g)) return g;
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    // 0.3.4 Q4: wrong confirmation = field error inside 401 REAUTH_FAILED, NOT an expired session.
    if (body.currentPassword !== MOCK_PASSWORD) return reauthFailed('currentPassword');
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

  // ---------- parameters (S24) ----------
  http.get(`${prop}/parameters`, ({ request }) => {
    const g = guard(request, ['owner', 'manager', 'front_desk_lead']);
    return isResponse(g) ? g : HttpResponse.json({ data: db.params });
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
    const { roles } = (await request.json()) as { roles: MockUser['roles'] };
    if (!roles?.length) return validation([{ field: 'roles', code: 'REQUIRED' }]);
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
  http.patch(`${base}/users/:userId`, async ({ request, params }) => {
    const u = db.users.find((x) => x.id === params.userId);
    if (!u) return problem(404, 'NOT_FOUND');
    const g = guard(request, ['owner'], { ifMatch: u.version });
    if (isResponse(g)) return g;
    const body = (await request.json()) as {
      status?: 'active' | 'disabled';
      resetPassword?: string;
      displayName?: string;
    };
    if (body.status === 'disabled' && u.id === g.user.id)
      return validation([{ field: 'status', code: 'LAST_OWNER' }]);
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
      hardeningChecklistConfirmed?: boolean;
    };
    if (body.currentPassword !== MOCK_PASSWORD) return reauthFailed('currentPassword');
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
  http.post(`${prop}/trusted-devices/:deviceId/actions/revoke`, ({ request, params }) => {
    const g = guard(request, ['owner']);
    if (isResponse(g)) return g;
    const d = db.devices.find((x) => x.id === params.deviceId);
    if (!d) return problem(404, 'NOT_FOUND');
    d.revokedAt = new Date().toISOString();
    if (d.isCurrentDevice) db.currentDeviceTrusted = false;
    return HttpResponse.json(d);
  }),
];
