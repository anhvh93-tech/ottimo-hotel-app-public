// MSW mock of the property Wi-Fi (V5-58, OpenAPI 0.3.13 `getPropertyWifi`, `setPropertyWifi` + bổ sung 1, 1d, 1e, 1f),
// mirroring the server of PR #120 @ f1ac530b (`platform/internal/property-wifi.controller.ts`):
// - GET S36 (OWN, MGR, FDL, FD), PUT A101 (OWN, MGR); `Cache-Control: no-store` on every answer, 422 included;
// - order: shape (`ssid` 1–32 bytes UTF-8 without control characters → `VALUE_OUT_OF_RANGE` + top-level `max: 32`;
//   password empty or 8–63 printable ASCII) → room number as a word of its own / staff sign-in name → `NOT_ALLOWED`
//   → the caller's own sign-in password (SR-RL-15: only when every other check passed, and only a non-empty
//   password that differs from the stored one; every comparison counts; from the 6th in the window the comparison
//   is skipped and the save goes on);
// - the PUT answer never carries `password` (`passwordSet`); audit `config` `property.wifi_changed` with
//   `before.ssid`, `after.ssid`, `after.passwordChanged` only – never a password. Error bodies never echo a value.
// Test values only: no real network name or password lives here.
import type { Role } from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { MOCK_PASSWORD, type MockUser } from './seed';

type Guard = { user: MockUser; roles: Role[] } | Response;
interface Ctx {
  guard: (request: StrictRequest<DefaultBodyType>, allowed: Role[] | 'any') => Guard;
  problem: (
    status: number,
    code: string,
    extra?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) => Response;
  users: () => MockUser[];
  roomNos: () => string[];
}

const READ: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const WRITE: Role[] = ['owner', 'manager'];
const NO_STORE = { 'cache-control': 'no-store' };
/** SR-RL-15: 5 comparisons per caller per 24 h window; the 6th and later are skipped (never a 429). */
export const WIFI_COMPARE_LIMIT = 5;

export interface MockWifiAudit {
  occurredAt: string;
  actorType: 'user';
  actorUserId: string;
  actorName: string;
  category: 'config';
  action: 'property.wifi_changed';
  entityType: 'property';
  before: { ssid: string | null };
  after: { ssid: string; passwordChanged: boolean };
}

function makeState() {
  return {
    /** `null` = not entered yet (production before V5-58 ships: the stay page says "ask reception"). */
    wifi: null as { ssid: string; password: string } | null,
    audit: [] as MockWifiAudit[],
    /** SR-RL-15 counter `wifi_pw_cmp:<user_id>` (one window in the mock). */
    compares: new Map<string, number>(),
    /** `security` audit actions written by the comparison (tests read them – no value inside). */
    security: [] as Array<{ action: string; actorUserId: string }>,
  };
}

const isResponse = (g: Guard): g is Response => g instanceof Response;
const bytes = (s: string) => new TextEncoder().encode(s).length;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;

export function createWifiMock(ctx: Ctx) {
  let st = makeState();
  const prop = '*/v1/properties/:propertyId';
  const refuse = (errors: Array<{ field: string; code: string }>, max?: number) =>
    ctx.problem(422, 'VALIDATION_FAILED', { errors, ...(max ? { max } : {}) }, NO_STORE);

  const handlers = [
    http.get(`${prop}/wifi`, ({ request }) => {
      const g = ctx.guard(request, READ);
      if (isResponse(g)) return g;
      const w = st.wifi;
      return HttpResponse.json(
        w
          ? { configured: true, ssid: w.ssid, password: w.password, passwordSet: w.password !== '' }
          : { configured: false },
        { headers: NO_STORE },
      );
    }),
    http.put(`${prop}/wifi`, async ({ request }) => {
      const g = ctx.guard(request, WRITE);
      if (isResponse(g)) return g;
      const raw = (await request.json()) as Record<string, unknown>;
      const extra = Object.keys(raw).filter((k) => k !== 'ssid' && k !== 'password');
      if (typeof raw.ssid !== 'string' || typeof raw.password !== 'string' || extra.length)
        return refuse([{ field: 'body', code: 'VALIDATION_FAILED' }]);
      const ssid = raw.ssid.trim();
      const password = raw.password;
      const errors: Array<{ field: string; code: string }> = [];
      const ssidOk = ssid !== '' && bytes(ssid) <= 32 && !CONTROL.test(ssid);
      if (!ssidOk) errors.push({ field: 'ssid', code: 'VALUE_OUT_OF_RANGE' });
      const passwordOk =
        password === '' ||
        (password.length >= 8 && password.length <= 63 && /^[\x20-\x7e]+$/.test(password));
      if (!passwordOk) errors.push({ field: 'password', code: 'VALUE_OUT_OF_RANGE' });
      if (ssidOk) {
        // A room number as a word of its own (`OTTIMO 401`, `ottimo-202`; `OTTIMO401` passes – DOM 120-01 for 0.3.14).
        const words = ssid.toLowerCase().split(/[^\p{L}\p{N}]+/u);
        const rooms = new Set(ctx.roomNos().map((n) => n.toLowerCase()));
        // Any sign-in name of the property's staff, disabled accounts included (SEC ARC-04 (a)).
        const logins = new Set(ctx.users().map((u) => u.username.toLowerCase()));
        if (words.some((w) => rooms.has(w)) || logins.has(ssid.toLowerCase()))
          errors.unshift({ field: 'ssid', code: 'NOT_ALLOWED' });
      }
      // PR #120 ce81ba5c (SEC FB-R5-SEC-BE-V558-01): compare (and count) only when EVERY other check passed.
      if (errors.length === 0 && passwordOk && password !== '' && password !== st.wifi?.password) {
        const n = (st.compares.get(g.user.id) ?? 0) + 1;
        st.compares.set(g.user.id, n);
        if (n > WIFI_COMPARE_LIMIT) {
          if (n === WIFI_COMPARE_LIMIT + 1)
            st.security.push({
              action: 'property.wifi_password_check_skipped',
              actorUserId: g.user.id,
            });
        } else if (password === MOCK_PASSWORD) {
          st.security.push({
            action: 'property.wifi_password_matches_login',
            actorUserId: g.user.id,
          });
          errors.push({ field: 'password', code: 'NOT_ALLOWED' });
        }
      }
      if (errors.length)
        return refuse(
          errors,
          errors.some((e) => e.field === 'ssid' && e.code === 'VALUE_OUT_OF_RANGE')
            ? 32
            : undefined,
        );
      const before = st.wifi;
      st.wifi = { ssid, password };
      st.audit.unshift({
        occurredAt: new Date().toISOString(),
        actorType: 'user',
        actorUserId: g.user.id,
        actorName: g.user.displayName,
        category: 'config',
        action: 'property.wifi_changed',
        entityType: 'property',
        before: { ssid: before?.ssid ?? null },
        after: { ssid, passwordChanged: (before?.password ?? null) !== password },
      });
      return HttpResponse.json(
        { configured: true, ssid, passwordSet: password !== '' },
        { headers: NO_STORE },
      );
    }),
    // `listAuditEvents` for the Wi-Fi page only (`action=property.wifi_changed`); any other query falls through to
    // the money log mock (stay.ts) – this handler is registered before it.
    http.get(`${prop}/audit-events`, ({ request }) => {
      const q = new URL(request.url).searchParams;
      if (!q.getAll('action').includes('property.wifi_changed')) return undefined;
      const g = ctx.guard(request, READ);
      if (isResponse(g)) return g;
      const full = g.roles.includes('owner') || g.roles.includes('manager');
      const limit = Number(q.get('limit') ?? 50);
      const data = st.audit
        .filter((e) => !q.get('category') || e.category === q.get('category'))
        .filter((e) => full || e.actorUserId === g.user.id)
        .slice(0, limit)
        // `AuditEvent` has no actor id field – the mock keeps it only for the FD/FDL "own rows" scope.
        .map((e) => {
          const out: Partial<MockWifiAudit> = { ...e };
          delete out.actorUserId;
          return out;
        });
      return HttpResponse.json({ data, page: { hasMore: false } });
    }),
  ];

  return {
    handlers,
    get state() {
      return st;
    },
    reset() {
      st = makeState();
    },
  };
}
