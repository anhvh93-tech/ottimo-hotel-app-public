// E2E API – R3 Sprint 1: CỔNG S2 (ARC s1-contracts 1.2, SEC A.5 06.26–06.27) + US-143 re-enrolment (ARC 0.3.8
// bổ sung 1 mục 12.3). Test plan: rounds/round-03/qa/s1-test-plan.md (S1-SEC-11, S1-SEC-16 phần API).
// Every account here is a throwaway qa.e2e.* created by qa.owner – the S2 failures count on the throwaway owner's
// SR-RL-02 counter, never on a DS-E account. TOTP secrets/codes live only in memory (support/totp.ts) and never
// appear in an assertion message (SEC 06.22).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  activateUser,
  call,
  createThrowawayUser,
  expectProblem,
  getMe,
  login,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  sessionTokenFrom,
  uniq,
  uuid,
  type Me,
  type Problem,
  type StaffSession,
} from '../support/api.js';
import { ORIGIN, SESSION_COOKIE } from '../support/env.js';
import { secretOfUri, TotpUser } from '../support/totp.js';

const LOGIN_MFA: [string, string, string] = ['POST', '/v1/auth/login/mfa', 'loginMfa'];
const SETUP: [string, string, string] = ['POST', '/v1/me/2fa/setup', 'startMy2faSetup'];
const CONFIRM: [string, string, string] = ['POST', '/v1/me/2fa/confirm', 'confirmMy2fa'];
const USERS: [string, string, string] = ['POST', '/v1/users', 'createUser'];

test.describe.configure({ mode: 'serial' });

/** Owner creates a throwaway account with `role` (S2 by the DS-E owner), signs it in and replaces the password. */
async function liveUser(
  request: APIRequestContext,
  owner: StaffSession,
  role: string,
  prefix: string,
): Promise<{ id: string; username: string; password: string; s: StaffSession }> {
  const u = await createThrowawayUser(request, owner, role, prefix);
  const { session: s, password } = await activateUser(request, u);
  // BUG-R3-015: on a stack with MFA_ENFORCED=true a new OWN/MGR only gets the "enrol 2FA first" session – these
  // cases need a stack with the flag off (dev/CI); the enforced path is covered by ui-clock/mfa-us143-clock + QA-3.
  test.skip(
    !!s.me.mfaEnrollmentRequired,
    'stack MFA_ENFORCED=true: tài khoản tạm OWN/MGR phải đăng ký 2FA trước – ca này chạy trên stack cờ tắt',
  );
  return { id: u.id, username: u.username, password, s };
}

/** Enrol through the API: setup (password) → confirm (first TOTP). Returns the new session + codes + TOTP user. */
async function enrol(
  request: APIRequestContext,
  s: StaffSession,
  password: string,
  totp?: TotpUser,
): Promise<{ s: StaffSession; codes: string[]; totp: TotpUser }> {
  const setup = await call<{ otpauthUri: string }>(request, 'POST', '/v1/me/2fa/setup', {
    session: s,
    body: { currentPassword: password },
  });
  expect(setup.status, 'startMy2faSetup').toBe(200);
  expect(setup.headers['cache-control']).toBe('no-store');
  const key = secretOfUri(setup.body.otpauthUri);
  const t = totp ?? new TotpUser(key);
  t.rekey(key);
  const conf = await call<{ recoveryCodes: string[] }>(request, 'POST', '/v1/me/2fa/confirm', {
    session: s,
    body: { totpCode: await t.next() },
  });
  expect(conf.status, 'confirmMy2fa').toBe(200);
  expect(conf.body.recoveryCodes).toHaveLength(10);
  const token = sessionTokenFrom(conf.setCookies);
  expect(token, 'confirm issues a new session (06.10)').toBeTruthy();
  expect((await getMe(request, s.token)).status, 'other sessions revoked (06.10)').toBe(401);
  const me = await getMe(request, token!);
  return { s: { ...s, token: token!, me: me.body }, codes: conf.body.recoveryCodes, totp: t };
}

/** Password step → 401 MFA_REQUIRED + mfaToken (no cookie). */
async function mfaToken(request: APIRequestContext, username: string, password: string) {
  // login(): a harness-volume 429 (SR-RL-01 per IP) → limiter reset + one retry, like freshSession
  const r = await login(request, username, password);
  const p = expectProblem(r, 401, 'MFA_REQUIRED') as Problem & { mfaToken?: string };
  expect(r.token, 'no session cookie before step 2').toBeFalsy();
  expect(p.mfaToken).toMatch(/^[A-Za-z0-9_-]{43,}$/);
  return p.mfaToken!;
}

async function loginMfa(
  request: APIRequestContext,
  username: string,
  body: Record<string, string>,
): Promise<{ status: number; s?: StaffSession; body: Me | Problem }> {
  // like login: no session yet, so the harness adds no Origin – send it (SR-SES-04 Origin check on auth routes)
  const r = await call<Me | Problem>(request, 'POST', '/v1/auth/login/mfa', {
    body,
    headers: { origin: ORIGIN },
  });
  const token = sessionTokenFrom(r.setCookies);
  if (r.status !== 200 || !token) return { status: r.status, body: r.body };
  const me = await getMe(request, token);
  return { status: 200, s: { username, token, me: me.body }, body: r.body };
}

test.describe('R3 S1 – CỔNG S2 trên quản lý người dùng/thiết bị (SEC 06.26–06.27)', () => {
  test('S1-SEC-11 (gate): thiếu S2 → 422 STRONG_REAUTH_REQUIRED, sai → 401 REAUTH_FAILED, đúng → ghi; không ghi gì khi thiếu/sai', async ({
    request,
  }) => {
    needSeedPassword();
    await requireEndpoints(request, 'S1-SEC-11', [USERS]);
    const dsOwner = await sessionOrSkip(request, 'qa.owner');
    const pid = propertyIdOf(dsOwner);
    // A throwaway OWNER: creating it is itself an S2 escalation, done by the DS-E owner with S2.
    const own = await liveUser(request, dsOwner, 'owner', 'qa.e2e.s2own');
    const reauth = { password: own.password };
    const wrong = { password: `wrong-${uniq(10)}` };

    // createUser
    const body = (r?: unknown) => ({
      username: `qa.e2e.s2c.${uniq(8)}`,
      displayName: 'Qa Sai Tam',
      initialPassword: `E2e-${uniq(12)}-tmp`,
      roles: [{ propertyId: pid, role: 'housekeeping' }],
      ...(r ? { reauth: r } : {}),
    });
    const noS2 = body();
    const miss = await call<Problem>(request, 'POST', '/v1/users', {
      session: own.s,
      idempotencyKey: true,
      body: noS2,
    });
    const p1 = expectProblem(miss, 422, 'VALIDATION_FAILED');
    expect(JSON.stringify(p1)).toContain('STRONG_REAUTH_REQUIRED');
    const bad = await call<Problem>(request, 'POST', '/v1/users', {
      session: own.s,
      idempotencyKey: true,
      body: body(wrong),
    });
    expectProblem(bad, 401, 'REAUTH_FAILED');
    expect(JSON.stringify(bad.body)).not.toContain(wrong.password);
    const list = await call<{ data: Array<{ username: string }> }>(request, 'GET', '/v1/users', {
      session: own.s,
      query: { limit: 100 },
    });
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    expect(list.body.data.map((u) => u.username)).not.toContain(noS2.username);
    const ok = await call<{ id: string; version: number }>(request, 'POST', '/v1/users', {
      session: own.s,
      idempotencyKey: true,
      body: body(reauth),
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    const victim = ok.body;

    // setUserRoles: escalation to manager needs S2; a non-escalating change does not
    const esc = await call<Problem>(request, 'PUT', `/v1/users/${victim.id}/roles`, {
      session: own.s,
      ifMatch: `"${victim.version}"`,
      body: { roles: [{ propertyId: pid, role: 'manager' }] },
    });
    expect(JSON.stringify(expectProblem(esc, 422, 'VALIDATION_FAILED'))).toContain(
      'STRONG_REAUTH_REQUIRED',
    );
    const flat = await call<{ version: number }>(request, 'PUT', `/v1/users/${victim.id}/roles`, {
      session: own.s,
      ifMatch: `"${victim.version}"`,
      body: { roles: [{ propertyId: pid, role: 'front_desk' }] },
    });
    expect(flat.status, `không nâng quyền → không cần S2: ${JSON.stringify(flat.body)}`).toBe(200);
    const up = await call<{ version: number }>(request, 'PUT', `/v1/users/${victim.id}/roles`, {
      session: own.s,
      ifMatch: `"${flat.body.version}"`,
      body: { roles: [{ propertyId: pid, role: 'manager' }], reauth },
    });
    expect(up.status, JSON.stringify(up.body)).toBe(200);

    // updateUser: displayName alone no S2; resetPassword / status need S2
    const name = await call<{ version: number }>(request, 'PATCH', `/v1/users/${victim.id}`, {
      session: own.s,
      ifMatch: `"${up.body.version}"`,
      body: { displayName: 'Qa Doi Ten' },
    });
    expect(name.status, JSON.stringify(name.body)).toBe(200);
    const dis = await call<Problem>(request, 'PATCH', `/v1/users/${victim.id}`, {
      session: own.s,
      ifMatch: `"${name.body.version}"`,
      body: { status: 'disabled' },
    });
    expect(JSON.stringify(expectProblem(dis, 422, 'VALIDATION_FAILED'))).toContain(
      'STRONG_REAUTH_REQUIRED',
    );
    const rp = await call<Problem>(request, 'PATCH', `/v1/users/${victim.id}`, {
      session: own.s,
      ifMatch: `"${name.body.version}"`,
      body: { resetPassword: `E2e-${uniq(12)}-reset` },
    });
    expect(JSON.stringify(expectProblem(rp, 422, 'VALIDATION_FAILED'))).toContain(
      'STRONG_REAUTH_REQUIRED',
    );
    const dis2 = await call(request, 'PATCH', `/v1/users/${victim.id}`, {
      session: own.s,
      ifMatch: `"${name.body.version}"`,
      body: { status: 'disabled', reauth },
    });
    expect(dis2.status, JSON.stringify(dis2.body)).toBe(200);

    // revokeTrustedDevice: S2 before the lookup (random id → 422 without S2, 404 with S2)
    const dev = `/v1/properties/${pid}/trusted-devices/${uuid()}/actions/revoke`;
    const devNoS2 = await call<Problem>(request, 'POST', dev, {
      session: own.s,
      idempotencyKey: true,
      body: { reason: 'E2E S2' },
    });
    expect(JSON.stringify(expectProblem(devNoS2, 422, 'VALIDATION_FAILED'))).toContain(
      'STRONG_REAUTH_REQUIRED',
    );
    const withS2 = await call(request, 'POST', dev, {
      session: own.s,
      idempotencyKey: true,
      body: { reason: 'E2E S2', reauth },
    });
    expect(withS2.status, JSON.stringify(withS2.body)).toBe(404);
  });
});

test.describe('R3 S1 – US-143 E2E API: đăng nhập 2 bước, mã khôi phục, đăng ký lại (ARC 12.3)', () => {
  test('S1-SEC-16 (API) + ARC 12.3 #1–#3: mã khôi phục → phiên hạn chế 403; đăng ký lại → bí mật/bộ mã cũ chết; phiên amr=totp gọi setup → 409', async ({
    request,
  }) => {
    test.setTimeout(240_000); // up to 4 waits for the next 30 s TOTP step (anti-replay, SEC 06.18)
    needSeedPassword();
    await requireEndpoints(request, 'S1-SEC-16', [LOGIN_MFA, SETUP, CONFIRM, USERS]);
    const dsOwner = await sessionOrSkip(request, 'qa.owner');
    const pid = propertyIdOf(dsOwner);
    // front_desk_lead: voluntary 2FA (SEC 06.2) – works with MFA_ENFORCED=false (dev/CI default)
    const u = await liveUser(request, dsOwner, 'front_desk_lead', 'qa.e2e.mfa');
    const first = await enrol(request, u.s, u.password);
    const oldKey = first.totp.key;
    const oldCodes = first.codes;
    expect((await getMe(request, first.s.token)).body).toMatchObject({ mfaEnabled: true });

    // Two steps: password alone gives no session; TOTP → session amr totp (A.7 #1, #2)
    const t1 = await mfaToken(request, u.username, u.password);
    expect(
      (await call(request, 'GET', '/v1/me', { cookie: `${SESSION_COOKIE}=${t1}` })).status,
    ).toBe(401);
    const viaTotp = await loginMfa(request, u.username, {
      mfaToken: t1,
      totpCode: await first.totp.next(),
    });
    expect(viaTotp.status).toBe(200);
    expect(viaTotp.s!.me.mfaEnrollmentRequired ?? false).toBe(false);

    // ARC 12.3 #1: in through a recovery code → restricted (06.4): only the enrolment endpoints
    const viaCode = await loginMfa(request, u.username, {
      mfaToken: await mfaToken(request, u.username, u.password),
      recoveryCode: oldCodes[0]!,
    });
    expect(viaCode.status).toBe(200);
    const rc = viaCode.s!;
    expect(rc.me.mfaEnrollmentRequired).toBe(true);
    expectProblem(
      await call(request, 'GET', `/v1/properties/${pid}/guests`, {
        session: rc,
        query: { q: 'qa' },
      }),
      403,
      'MFA_ENROLLMENT_REQUIRED',
    );
    expectProblem(
      await call(request, 'POST', '/v1/me/2fa/recovery-codes', {
        session: rc,
        body: { password: u.password },
      }),
      403,
      'MFA_ENROLLMENT_REQUIRED',
    );
    expect((await call(request, 'GET', '/v1/me/2fa', { session: rc })).status).toBe(200);
    // the used recovery code is dead
    const reused = await loginMfa(request, u.username, {
      mfaToken: await mfaToken(request, u.username, u.password),
      recoveryCode: oldCodes[0]!,
    });
    expect(reused.status).toBe(401);
    expect((reused.body as Problem).code).toBe('MFA_INVALID');

    // ARC 12.3 #2: re-enrol from the restricted session → new secret + new codes; old ones dead
    const second = await enrol(request, rc, u.password, first.totp);
    expect(second.s.me.mfaEnrollmentRequired ?? false).toBe(false);
    expect(
      (
        await call(request, 'GET', `/v1/properties/${pid}/guests`, {
          session: second.s,
          query: { q: 'qa' },
        })
      ).status,
    ).toBe(200);
    expect(second.codes.some((c) => oldCodes.includes(c))).toBe(false);
    const oldTotp = await loginMfa(request, u.username, {
      mfaToken: await mfaToken(request, u.username, u.password),
      totpCode: second.totp.peek(oldKey),
    });
    expect(oldTotp.status, 'mã TOTP của bí mật cũ bị từ chối').toBe(401);
    const oldRecovery = await loginMfa(request, u.username, {
      mfaToken: await mfaToken(request, u.username, u.password),
      recoveryCode: oldCodes[1]!,
    });
    expect(oldRecovery.status, 'mã khôi phục của bộ cũ bị từ chối').toBe(401);
    const newTotp = await loginMfa(request, u.username, {
      mfaToken: await mfaToken(request, u.username, u.password),
      totpCode: await second.totp.next(),
    });
    expect(newTotp.status, 'bí mật mới đăng nhập được').toBe(200);

    // ARC 12.3 #3: a full session (amr = totp) cannot start a setup while 2FA is on → 409
    const again = await call<Problem>(request, 'POST', '/v1/me/2fa/setup', {
      session: newTotp.s!,
      body: { currentPassword: u.password },
    });
    expect(again.status, JSON.stringify(again.body)).toBe(409);
    // the old full session (before the re-enrolment) is gone
    expect((await getMe(request, viaTotp.s!.token)).status).toBe(401);
  });
});
