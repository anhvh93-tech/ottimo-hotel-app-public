// E2E API – EP00 identity (US-001, US-002; SR-AUTH, SR-SES). TC: test-cases/r1-main-flows.md.
// Destructive steps (lockout, role change, disable, reset) only touch throwaway accounts qa.e2e.* created by
// qa.owner – never the shared DS-E accounts. SR-RL-01 (20 logins/IP/15 min): freshSession() resets the limiter
// through /__test__/rate-limits/reset and retries once on 429; the disable/reset flow still goes through Caddy
// (E2E_WEB_URL, another client IP). The lockout cases (TC-NT-043) live in limits/ – serial project "limits".
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  activateUser,
  call,
  createThrowawayUser,
  expectProblem,
  freshSession,
  getMe,
  isAvailable,
  login,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  resetRateLimits,
  seedReauthFor,
  sessionOrSkip,
  uniq,
  uniqName,
  type Me,
  type Problem,
} from '../support/api.js';
import {
  COOKIE_PREFIX,
  GUEST_ORIGIN,
  ORIGIN,
  SEED_PASSWORD,
  SESSION_COOKIE,
  WEB_URL,
} from '../support/env.js';

const LOGIN: [string, string, string] = ['POST', '/v1/auth/login', 'login'];
const ME: [string, string, string] = ['GET', '/v1/me', 'getMe'];
const USERS: [string, string, string] = ['POST', '/v1/users', 'createUser'];
const ROLES: [string, string, string] = ['PUT', '/v1/users/{userId}/roles', 'setUserRoles'];
const UPDATE_USER: [string, string, string] = ['PATCH', '/v1/users/{userId}', 'updateUser'];
const PASSWORD: [string, string, string] = ['POST', '/v1/me/password', 'changeMyPassword'];
const GUESTS: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/guests',
  'searchGuests',
];
const CREATE_GUEST: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/guests',
  'createGuest',
];
const AUDIT: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/audit-events',
  'listAuditEvents',
];

/** Raw POST /v1/auth/login (custom cookie/Origin); a harness-volume 429 → reset + one retry (SR-RL-01). */
async function loginCall(
  request: APIRequestContext,
  o: Parameters<typeof call>[3],
): Promise<Awaited<ReturnType<typeof call<Me & Problem>>>> {
  const r = await call<Me & Problem>(request, 'POST', '/v1/auth/login', o);
  if (r.status !== 429 || !(await resetRateLimits(request, 'loginCall'))) return r;
  return call<Me & Problem>(request, 'POST', '/v1/auth/login', o);
}

function cookieAttrs(setCookie: string): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (const part of setCookie.split(';').slice(1)) {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k.toLowerCase()] = v.length ? v.join('=') : true;
  }
  return out;
}

test.describe('L1 – đăng nhập, phiên, vai (US-001, US-002)', { tag: ['@api', '@sprint1'] }, () => {
  test.beforeEach(() => needSeedPassword());

  test('TC-NT-001 (A) qa.fd đăng nhập → cookie phiên đúng thuộc tính, getMe vai front_desk', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-001', [LOGIN, ME]);
    const r = await login(request, 'qa.fd', SEED_PASSWORD!);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const sid = r.setCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
    expect(sid, `Set-Cookie ${SESSION_COOKIE}`).toBeTruthy();
    const a = cookieAttrs(sid!);
    expect(a.httponly).toBe(true);
    expect(String(a.samesite).toLowerCase()).toBe('lax');
    expect(a.path).toBe('/');
    expect(a.domain).toBeUndefined();
    if (COOKIE_PREFIX === '__Host-') expect(a.secure).toBe(true);
    else
      test.info().annotations.push({
        type: 'note',
        description:
          'dev HTTP: tên cookie không tiền tố __Host-, không kiểm Secure (COOKIE_SECURE_PREFIX=false)',
      });
    const me = r.body as Me;
    expect(me.csrfToken).toBeTruthy();
    const roles = me.properties.flatMap((p) => p.roles);
    expect(roles).toContain('front_desk');
    const again = await getMe(request, r.token!);
    expect(again.status).toBe(200);
    expect(again.body.id).toBe(me.id);
  });

  test('TC-SEC-020 đăng nhập cấp token mới (chống session fixation), token cũ vô hiệu', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-SEC-020', [LOGIN, ME]);
    const planted = 'A'.repeat(43);
    const r = await loginCall(request, {
      cookie: `${SESSION_COOKIE}=${planted}`,
      body: { username: 'qa.fdl', password: SEED_PASSWORD },
      // login is a public write: the api checks Origin (login CSRF, SR-SES-04) when origins are configured
      headers: { origin: ORIGIN },
    });
    expect(r.status).toBe(200);
    const sid = r.setCookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`)) ?? '';
    expect(sid).not.toContain(planted);
    expect((await getMe(request, planted)).status).toBe(401);
  });

  test('TC-SEC-024 (đăng nhập) login từ origin guest-web → 403, không cấp phiên nhân viên (SR-SES-09, FB-R2-SEC-BE-12)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-SEC-024', [LOGIN]);
    // The check only exists when the api has its origin lists (ADMIN/STAFF/GUEST_BASE_URL – required on
    // staging/production). The dev compose stack leaves them empty → origins are not checked at all.
    const foreign = await loginCall(request, {
      body: { username: 'qa.fd', password: SEED_PASSWORD },
      headers: { origin: 'https://origin-la.example' },
    });
    test.skip(
      foreign.status === 200,
      'stack không cấu hình danh sách origin (compose dev: ADMIN_BASE_URL/GUEST_BASE_URL rỗng) – kiểm trên stack có origin',
    );
    expect(foreign.status, JSON.stringify(foreign.body)).toBe(403);
    const r = await loginCall(request, {
      body: { username: 'qa.fd', password: SEED_PASSWORD },
      headers: { origin: GUEST_ORIGIN },
    });
    expectProblem(r, 403, 'FORBIDDEN_ACTION');
    expect(r.setCookies.some((c) => c.startsWith(`${SESSION_COOKIE}=`) && !/=;/.test(c))).toBe(
      false,
    );
  });

  test('TC-NT-005 tài khoản locked đăng nhập đúng mật khẩu → từ chối chung, không lộ trạng thái', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-005', [LOGIN]);
    const locked = await login(request, 'qa.locked', SEED_PASSWORD!);
    const unknown = await login(request, `nobody.${uniq()}`, 'Wrong-password-123');
    expect(locked.status, JSON.stringify(locked.body)).toBe(401);
    expect(locked.token).toBeUndefined();
    const pl = locked.body as Problem;
    const pu = unknown.body as Problem;
    expect(unknown.status).toBe(401);
    // SR-AUTH-04: same answer for "locked", "no such user", "wrong password"
    expect({ code: pl.code, title: pl.title, detail: pl.detail }).toEqual({
      code: pu.code,
      title: pu.title,
      detail: pu.detail,
    });
  });

  test('TC-NT-044 tạo tài khoản trùng tên đăng nhập → 409 USERNAME_TAKEN (không phân biệt hoa thường); mật khẩu không lộ', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-044', [LOGIN, USERS, ['GET', '/v1/users', 'listUsers']]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const u = await createThrowawayUser(request, owner, 'housekeeping', 'qa.e2e.dup');
    expect(JSON.stringify(u.body)).not.toContain(u.password);
    for (const username of [u.username, u.username.toUpperCase(), 'qa.fd']) {
      const r = await call<Problem>(request, 'POST', '/v1/users', {
        session: owner,
        idempotencyKey: true,
        body: {
          username,
          displayName: 'Qa trùng',
          initialPassword: `E2e-${uniq(12)}-tmp`,
          roles: [{ propertyId: propertyIdOf(owner), role: 'housekeeping' }],
          reauth: await seedReauthFor('qa.owner'), // CỔNG S2: S2 is checked before the username (no 422 masking the 409)
        },
      });
      expectProblem(r, 409, 'USERNAME_TAKEN');
    }
    const list = await call(request, 'GET', '/v1/users', { session: owner, query: { limit: 100 } });
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toContain(u.password);
    if (await isAvailable(request, AUDIT[0], AUDIT[1])) {
      const audit = await call(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(owner)}/audit-events`,
        {
          session: owner,
          query: { limit: 100 },
        },
      );
      expect(audit.status).toBe(200);
      expect(JSON.stringify(audit.body), 'SR-AUTH-03: mật khẩu không vào audit').not.toContain(
        u.password,
      );
    }
  });

  test('TC-NT-007 + TC-SEC-022(a) + TC-SEC-025: mật khẩu tạm; owner đổi vai → mọi phiên cũ 401, vai mới có hiệu lực', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-007', [LOGIN, ME, USERS, ROLES, PASSWORD, CREATE_GUEST]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const propertyId = propertyIdOf(owner);
    const x = await createThrowawayUser(request, owner, 'front_desk', 'qa.e2e.role');

    // TC-SEC-025 / TC-NT-037: temporary password → only changeMyPassword works
    const first = await freshSession(request, x.username, x.password);
    expect(first.me.mustChangePassword).toBe(true);
    const blocked = await call<Problem>(request, 'GET', `/v1/properties/${propertyId}/guests`, {
      session: first,
      query: { q: 'qa' },
    });
    expectProblem(blocked, 403, 'PASSWORD_CHANGE_REQUIRED');
    const { session: s1, password } = await activateUser(request, {
      username: x.username,
      password: x.password,
    });
    if (await isAvailable(request, GUESTS[0], GUESTS[1])) {
      const ok = await call(request, 'GET', `/v1/properties/${propertyId}/guests`, {
        session: s1,
        query: { q: 'qa' },
      });
      expect(ok.status, 'sau khi đổi mật khẩu gọi API khác được').toBe(200);
    }
    const s2 = await freshSession(request, x.username, password);

    // owner: front_desk → housekeeping (If-Match = CURRENT version: the password change above bumped it)
    const users = await call<{ data?: Array<{ id: string; version: number }> }>(
      request,
      'GET',
      '/v1/users',
      { session: owner, query: { limit: 100 } },
    );
    const current = (users.body.data ?? []).find((u) => u.id === x.id)?.version ?? x.version;
    const r = await call(request, 'PUT', `/v1/users/${x.id}/roles`, {
      session: owner,
      ifMatch: `"${current}"`,
      body: { roles: [{ propertyId, role: 'housekeeping' }] },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);

    // SR-SES-06: every old session is revoked at once (no waiting for re-login)
    expect((await getMe(request, s1.token)).status).toBe(401);
    expect((await getMe(request, s2.token)).status).toBe(401);

    const s3 = await freshSession(request, x.username, password);
    const roles = s3.me.properties.flatMap((p) => p.roles);
    expect(roles).toEqual(['housekeeping']);
    expect(s3.me.properties.flatMap((p) => p.screens)).not.toContain('S26');
    const denied = await call<Problem>(request, 'POST', `/v1/properties/${propertyId}/guests`, {
      session: s3,
      idempotencyKey: true,
      body: { fullName: `Qa Khach ${uniqName()}`, email: `e2e.${uniq(8)}@example.test` },
    });
    expectProblem(denied, 403, 'FORBIDDEN_ACTION');

    if (await isAvailable(request, AUDIT[0], AUDIT[1])) {
      const audit = await call(request, 'GET', `/v1/properties/${propertyId}/audit-events`, {
        session: owner,
        query: { category: 'security', limit: 100 },
      });
      expect(audit.status).toBe(200);
      expect(JSON.stringify(audit.body), 'audit security có dòng đổi vai của tài khoản').toContain(
        x.id,
      );
    }
  });

  test('TC-SEC-022(b)(c) đặt lại mật khẩu / khóa tài khoản → phiên cũ 401; mật khẩu tạm buộc đổi', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-SEC-022', [LOGIN, ME, USERS, UPDATE_USER, PASSWORD]);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const y = await createThrowawayUser(request, owner, 'front_desk', 'qa.e2e.rev');
    const { session: s1 } = await activateUser(request, y, WEB_URL);
    const list = await call<{ data: Array<{ id: string; version: number }> }>(
      request,
      'GET',
      '/v1/users',
      {
        session: owner,
        query: { limit: 100 },
      },
    );
    const v1 = list.body.data?.find((u) => u.id === y.id)?.version ?? y.version;

    const temp = `E2e-${uniq(12)}-reset`;
    const reset = await call<{ version: number }>(request, 'PATCH', `/v1/users/${y.id}`, {
      session: owner,
      ifMatch: `"${v1}"`,
      body: { resetPassword: temp, reauth: await seedReauthFor('qa.owner') }, // CỔNG S2 (SEC 06.26)
    });
    expect(reset.status, JSON.stringify(reset.body)).toBe(200);
    expect((await getMe(request, s1.token)).status, '(c) đặt lại mật khẩu thu hồi phiên').toBe(401);

    const s2 = await freshSession(request, y.username, temp, WEB_URL);
    expect(s2.me.mustChangePassword).toBe(true);

    const disable = await call(request, 'PATCH', `/v1/users/${y.id}`, {
      session: owner,
      ifMatch: `"${reset.body.version}"`,
      body: { status: 'disabled', reauth: await seedReauthFor('qa.owner') }, // CỔNG S2 (SEC 06.26)
    });
    expect(disable.status, JSON.stringify(disable.body)).toBe(200);
    expect((await getMe(request, s2.token)).status, '(b) khóa tài khoản thu hồi phiên').toBe(401);
    const again = await login(request, y.username, temp, WEB_URL);
    expect(again.status).toBe(401);
  });

  test('TC-NT-010 qa.mgr không quản lý được người dùng/vai (403, vai không đổi)', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-010', [
      LOGIN,
      ME,
      ['GET', '/v1/users', 'listUsers'],
      ROLES,
    ]);
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    expectProblem(
      await call(request, 'GET', '/v1/users', { session: mgr }),
      403,
      'FORBIDDEN_ACTION',
    );
    const self = await call(request, 'PUT', `/v1/users/${mgr.me.id}/roles`, {
      session: mgr,
      ifMatch: '"1"',
      body: { roles: [{ propertyId: propertyIdOf(mgr), role: 'owner' }] },
    });
    expectProblem(self, 403, 'FORBIDDEN_ACTION');
    const me = await getMe(request, mgr.token);
    expect(me.body.properties.flatMap((p) => p.roles)).not.toContain('owner');
  });

  // BUG-R2-005 (R2 S1): OpenAPI "Thứ tự kiểm" = … → quyền vai/phạm vi → nghiệp vụ. A forbidden role must get
  // 403 FORBIDDEN_ACTION (+ audit access.denied) even when its body is invalid or its password re-check is wrong.
  test('TC-NT-008 (thứ tự kiểm, BUG-R2-005) vai bị cấm + body sai/mật khẩu sai → 403 trước 422/401', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-008', [LOGIN, ME, USERS, CREATE_GUEST]);
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const hk = await sessionOrSkip(request, 'qa.hk');
    const fd = await sessionOrSkip(request, 'qa.fd');
    const pid = propertyIdOf(fd);
    const results = {
      createUser_mgr: await call<Problem>(request, 'POST', '/v1/users', {
        session: mgr,
        idempotencyKey: true,
        body: { username: 'x', displayName: '1' },
      }),
      createGuest_hk: await call<Problem>(request, 'POST', `/v1/properties/${pid}/guests`, {
        session: hk,
        idempotencyKey: true,
        body: { fullName: '' },
      }),
      trustCurrentDevice_fd: await call<Problem>(
        request,
        'POST',
        `/v1/properties/${pid}/trusted-devices`,
        {
          session: fd,
          idempotencyKey: true,
          body: { name: 'Qa', deviceKind: 'desk', currentPassword: 'wrong-password-e2e' },
        },
      ),
    };
    const actual = Object.fromEntries(
      Object.entries(results).map(([k, r]) => [k, `${r.status} ${r.body?.code ?? ''}`]),
    );
    expect(actual).toEqual({
      createUser_mgr: '403 FORBIDDEN_ACTION',
      createGuest_hk: '403 FORBIDDEN_ACTION',
      trustCurrentDevice_fd: '403 FORBIDDEN_ACTION',
    });
  });

  test('TC-NT-002 (A) không có cookie → 401 UNAUTHENTICATED, thân lỗi không chứa dữ liệu', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-NT-002', [ME]);
    const r = await call<Problem>(request, 'GET', '/v1/me');
    const p = expectProblem(r, 401, 'UNAUTHENTICATED');
    expect(p).not.toHaveProperty('data');
    expect(p).not.toHaveProperty('properties');
    test.info().annotations.push({
      type: 'note',
      description: 'getRack/getReservation (Sprint 2) chạy ở bộ RBAC khi có',
    });
  });
});
