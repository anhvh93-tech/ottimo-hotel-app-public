/**
 * identity (US-001, US-002, US-142) on Nest/Fastify + PostgreSQL: login/session policy (idle, max, lock,
 * temporary password, logout), Me, users & roles (USERNAME_TAKEN, LAST_OWNER, 412, session revocation),
 * trusted devices (re-auth, checklist, admin-web only, ≤ 30 days mobile, revoke).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  cookieValue,
  seedSprint1Params,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('identity – login, sessions, users, trusted devices', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let other: TestTenant;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      properties: 2,
      users: {
        owner: ['owner'],
        owner2: ['owner'],
        mgr: ['manager'],
        fd: ['front_desk'],
        hk: ['housekeeping'],
        lockme: ['front_desk'],
        temp: ['front_desk'],
        victim: ['front_desk'],
      },
    });
    other = await createTenant(db, { users: { owner: ['owner'] } });
    await seedSprint1Params(db, t);
    for (const u of ['owner', 'fd', 'lockme', 'temp', 'victim', 'hk']) await setPassword(db, t, u);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const login = (
    username: string,
    password = TEST_PASSWORD,
    headers: Record<string, string> = {},
  ) =>
    fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username, password },
      headers,
    });

  describe('login (US-001, SR-AUTH-04, SR-SES-01/02)', () => {
    it('200 + HttpOnly SameSite=Lax cookie + Me with roles, screens, csrfToken; old token is not reused', async () => {
      const res = await login(t.users.fd!.username.toUpperCase());
      expect(res.statusCode).toBe(200);
      const setCookie = String(res.headers['set-cookie']);
      expect(setCookie).toMatch(/^ottimo_sid=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Lax; Path=\//);
      expect(setCookie).not.toContain('Domain');
      const me = res.json();
      expect(me).toMatchObject({
        id: t.users.fd!.id,
        displayName: 'fd',
        activePropertyId: t.propertyIds[0],
        mustChangePassword: false,
        mfaEnabled: false,
      });
      expect(me.properties[0].roles).toEqual(['front_desk']);
      expect(me.properties[0].screens).toContain('S05');
      expect(me.properties[0].screens).not.toContain('S26');
      expect(me.properties[0].deviceTrusted).toBe(false);
      expect(me.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      const token = cookieValue(res, 'ottimo_sid')!;
      expect(token).not.toBe(t.users.fd!.sessionToken);
      // DB keeps only the SHA-256 of the token.
      const rows = await db.withContext(t.ctx(), (tx) =>
        tx.query(`SELECT count(*)::int AS n FROM user_session WHERE id = $1`, [token]),
      );
      expect(rows.rows[0]!.n).toBe(0);
      const meAgain = await new Client(fa, token).get('/v1/me');
      expect(meAgain.statusCode).toBe(200);
      expect(meAgain.json().csrfToken).toBe(me.csrfToken);
    });

    it('unknown user and wrong password give the same 401 body', async () => {
      const a = await login('nobody.here');
      const b = await login(t.users.fd!.username, 'wrong-password-1');
      expect(a.statusCode).toBe(401);
      expect(b.statusCode).toBe(401);
      const strip = (x: Record<string, unknown>) => ({ ...x, requestId: undefined });
      expect(strip(a.json())).toEqual(strip(b.json()));
    });

    it('5 consecutive failures lock 15 min: 6th attempt → 429 Retry-After, even with the right password; unlocks after', async () => {
      for (let i = 0; i < 5; i++) {
        expect((await login(t.users.lockme!.username, 'bad-password-x')).statusCode).toBe(401);
      }
      const locked = await login(t.users.lockme!.username);
      expect(locked.statusCode).toBe(429);
      expect(locked.json().code).toBe('RATE_LIMITED');
      expect(Number(locked.headers['retry-after'])).toBeGreaterThan(800);
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT action FROM audit_event WHERE entity_id = $1 AND action = 'auth.account_locked'`,
          [t.users.lockme!.id],
        ),
      );
      expect(audit.rows).toHaveLength(1);
      fa.clock.advance(16 * 60_000);
      expect((await login(t.users.lockme!.username)).statusCode).toBe(200);
      fa.clock.set(T0);
    });

    it('disabled or hard-locked account → generic 401 + audit auth.login_refused (TC-NT-005)', async () => {
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE app_user SET status = 'locked', locked_until = NULL WHERE id = $1`, [
          t.users.hk!.id,
        ]),
      );
      const res = await login(t.users.hk!.username);
      expect(res.statusCode).toBe(401);
      expect(res.json().code).toBe('UNAUTHENTICATED');
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT 1 FROM audit_event WHERE entity_id = $1 AND action = 'auth.login_refused'`,
          [t.users.hk!.id],
        ),
      );
      expect(audit.rows.length).toBeGreaterThan(0);
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE app_user SET status = 'active' WHERE id = $1`, [t.users.hk!.id]),
      );
    });

    it('422 on a too-short username/password body', async () => {
      const res = await login('ab', 'x');
      expect(res.statusCode).toBe(422);
      expect(
        res
          .json()
          .errors.map((e: { field: string }) => e.field)
          .sort(),
      ).toEqual(['password', 'username']);
    });
  });

  describe('session policy (SR-SES-03, SR-SES-06, SR-AUTH-05)', () => {
    it('admin session: idle 30 min → 401; activity slides the idle window', async () => {
      const token = cookieValue(await login(t.users.fd!.username), 'ottimo_sid')!;
      const c = new Client(fa, token);
      fa.clock.set(new Date(T0.getTime() + 20 * 60_000));
      expect((await c.get('/v1/me')).statusCode).toBe(200); // touch at +20 min
      fa.clock.set(new Date(T0.getTime() + 45 * 60_000));
      expect((await c.get('/v1/me')).statusCode).toBe(200); // 25 min after the touch
      fa.clock.set(new Date(T0.getTime() + 76 * 60_000));
      const res = await c.get('/v1/me'); // 31 min idle
      expect(res.statusCode).toBe(401);
      fa.clock.set(T0);
    });

    it('logout → 204, cookie cleared, the old token is 401', async () => {
      const token = cookieValue(await login(t.users.fd!.username), 'ottimo_sid')!;
      const c = new Client(fa, token);
      const out = await c.send('POST', '/v1/auth/logout');
      expect(out.statusCode).toBe(204);
      expect(String(out.headers['set-cookie'])).toContain('Max-Age=0');
      expect((await c.get('/v1/me')).statusCode).toBe(401);
    });

    it('write without X-CSRF-Token → 403 FORBIDDEN_ACTION', async () => {
      const c = Client.of(fa, t, 'fd');
      const res = await c.send('POST', '/v1/auth/logout', undefined, { 'x-csrf-token': 'nope' });
      expect(res.statusCode).toBe(403);
    });

    it('temporary password: other APIs 403 PASSWORD_CHANGE_REQUIRED; change → new cookie, all old sessions 401', async () => {
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE app_user SET must_change_password = true WHERE id = $1`, [
          t.users.temp!.id,
        ]),
      );
      const res = await login(t.users.temp!.username);
      expect(res.json().mustChangePassword).toBe(true);
      const c = new Client(fa, cookieValue(res, 'ottimo_sid')!);
      const blocked = await c.get(`${P(t)}/guests?q=ab`);
      expect(blocked.statusCode).toBe(403);
      expect(blocked.json().code).toBe('PASSWORD_CHANGE_REQUIRED');
      expect((await c.get('/v1/me')).statusCode).toBe(200);

      const weak = await c.send('POST', '/v1/me/password', {
        currentPassword: TEST_PASSWORD,
        newPassword: 'short',
      });
      expect(weak.statusCode).toBe(422);
      expect(weak.json().errors[0].code).toBe('PASSWORD_TOO_SHORT');
      const wrong = await c.send('POST', '/v1/me/password', {
        currentPassword: 'not-my-password',
        newPassword: 'Another-fake-pass-99',
      });
      expect(wrong.statusCode).toBe(401);
      expect(wrong.json().code).toBe('REAUTH_FAILED');

      const ok = await c.send('POST', '/v1/me/password', {
        currentPassword: TEST_PASSWORD,
        newPassword: 'Another-fake-pass-99',
      });
      expect(ok.statusCode).toBe(204);
      const fresh = new Client(fa, cookieValue(ok, 'ottimo_sid')!);
      expect((await c.get('/v1/me')).statusCode).toBe(401);
      expect((await Client.of(fa, t, 'temp').get('/v1/me')).statusCode).toBe(401);
      const me = await fresh.get('/v1/me');
      expect(me.json().mustChangePassword).toBe(false);
      expect((await fresh.get(`${P(t)}/guests?q=ab`)).statusCode).toBe(200);
    });
  });

  describe('re-authentication counter (SR-RL-02, shared with approvals)', () => {
    it('5 wrong current passwords → locked 15 min (429, persisted on app_user) even with the right one', async () => {
      const c = Client.of(fa, t, 'hk');
      for (let i = 0; i < 5; i++) {
        const r = await c.send('POST', '/v1/me/password', {
          currentPassword: 'wrong-current-pass',
          newPassword: 'Another-fake-pass-11',
        });
        expect(r.statusCode).toBe(401);
      }
      const locked = await c.send('POST', '/v1/me/password', {
        currentPassword: TEST_PASSWORD,
        newPassword: 'Another-fake-pass-11',
      });
      expect(locked.statusCode).toBe(429);
      const row = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT approval_pin_locked_until IS NOT NULL AS locked FROM app_user WHERE id = $1`,
          [t.users.hk!.id],
        ),
      );
      expect(row.rows[0]!.locked).toBe(true);
    });
  });

  describe('users & roles (US-002, A100)', () => {
    let created: { id: string; version: number };

    it('manager → 403 on listUsers (US-002 AC4); owner lists users with roles', async () => {
      expect((await Client.of(fa, t, 'mgr').get('/v1/users')).statusCode).toBe(403);
      const res = await Client.of(fa, t, 'owner').get('/v1/users?limit=100');
      expect(res.statusCode).toBe(200);
      const fd = res.json().data.find((u: { id: string }) => u.id === t.users.fd!.id);
      expect(fd.roles).toEqual([{ propertyId: t.propertyIds[0], role: 'front_desk' }]);
      expect(fd).not.toHaveProperty('passwordHash');
    });

    it('createUser 201 (temporary password), 409 USERNAME_TAKEN (case-insensitive), 422 property not owned', async () => {
      const owner = Client.of(fa, t, 'owner');
      const username = `lan.hk.${Date.now()}`;
      const res = await owner.send('POST', '/v1/users', {
        username,
        displayName: 'Chị Lan',
        initialPassword: 'Fake-initial-pass-1',
        roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }],
      });
      expect(res.statusCode).toBe(201);
      created = res.json();
      expect(created).toMatchObject({ username, status: 'active', version: 1 });
      const again = await owner.send('POST', '/v1/users', {
        username: username.toUpperCase(),
        displayName: 'Lan Khác',
        initialPassword: 'Fake-initial-pass-1',
        roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }],
      });
      expect(again.statusCode).toBe(409);
      expect(again.json().code).toBe('USERNAME_TAKEN');
      const bad = await owner.send('POST', '/v1/users', {
        username: `x${username}`,
        displayName: 'Lan',
        initialPassword: 'Fake-initial-pass-1',
        roles: [{ propertyId: other.propertyIds[0], role: 'housekeeping' }],
      });
      expect(bad.statusCode).toBe(422);
      expect(bad.json().errors[0]).toEqual({ field: 'roles[0].propertyId', code: 'NOT_IN_LIST' });
      const login1 = await login(username, 'Fake-initial-pass-1');
      expect(login1.json().mustChangePassword).toBe(true);
    });

    it('setUserRoles: 412 on stale If-Match; change takes effect at once and revokes sessions (SR-SES-06)', async () => {
      const owner = Client.of(fa, t, 'owner');
      const victim = Client.of(fa, t, 'victim');
      expect((await victim.get('/v1/me')).statusCode).toBe(200);
      const stale = await owner.send(
        'PUT',
        `/v1/users/${t.users.victim!.id}/roles`,
        { roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }] },
        { 'if-match': '"99"' },
      );
      expect(stale.statusCode).toBe(412);
      expect(stale.json().code).toBe('VERSION_CONFLICT');
      const res = await owner.send(
        'PUT',
        `/v1/users/${t.users.victim!.id}/roles`,
        { roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }] },
        { 'if-match': '"1"' },
      );
      expect(res.statusCode).toBe(200);
      expect(res.headers.etag).toBe('"2"');
      expect(res.json().roles).toEqual([{ propertyId: t.propertyIds[0], role: 'housekeeping' }]);
      expect((await victim.get('/v1/me')).statusCode).toBe(401);
      const relog = await login(t.users.victim!.username);
      expect(relog.json().properties[0].roles).toEqual(['housekeeping']);
      expect(relog.json().properties[0].screens).toEqual([
        'S01',
        'S03',
        'S10',
        'S11',
        'S13',
        'S23',
        'S30',
      ]);
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT category FROM audit_event WHERE entity_id = $1 AND action = 'user.roles_changed'`,
          [t.users.victim!.id],
        ),
      );
      expect(audit.rows).toEqual([{ category: 'security' }]);
    });

    it('LAST_OWNER: removing the last active owner is 422; with a second owner it works', async () => {
      const single = await createTenant(db, { users: { owner: ['owner'] } });
      await seedSprint1Params(db, single);
      const c = Client.of(fa, single, 'owner');
      const res = await c.send(
        'PUT',
        `/v1/users/${single.users.owner!.id}/roles`,
        { roles: [{ propertyId: single.propertyIds[0], role: 'manager' }] },
        { 'if-match': '"1"' },
      );
      expect(res.statusCode).toBe(422);
      expect(res.json().errors).toEqual([{ field: 'roles', code: 'LAST_OWNER' }]);
      const disable = await c.send(
        'PATCH',
        `/v1/users/${single.users.owner!.id}`,
        { status: 'disabled' },
        { 'if-match': '"1"' },
      );
      expect(disable.statusCode).toBe(422);
      expect(disable.json().errors).toEqual([{ field: 'status', code: 'LAST_OWNER' }]);

      const ok = await Client.of(fa, t, 'owner').send(
        'PATCH',
        `/v1/users/${t.users.owner2!.id}`,
        { status: 'disabled' },
        { 'if-match': '"1"' },
      );
      expect(ok.statusCode).toBe(200);
      expect(ok.json().status).toBe('disabled');
      expect((await Client.of(fa, t, 'owner2').get('/v1/me')).statusCode).toBe(401);
    });

    it('updateUser resetPassword → temporary password + sessions revoked; another organisation’s user → 404', async () => {
      const owner = Client.of(fa, t, 'owner');
      const res = await owner.send(
        'PATCH',
        `/v1/users/${created.id}`,
        { resetPassword: 'Fake-reset-pass-77', displayName: 'Lan Buồng' },
        { 'if-match': `"${created.version}"` },
      );
      expect(res.statusCode).toBe(200);
      expect(res.json().displayName).toBe('Lan Buồng');
      const relog = await login(res.json().username, 'Fake-reset-pass-77');
      expect(relog.json().mustChangePassword).toBe(true);
      const foreign = await owner.send(
        'PATCH',
        `/v1/users/${other.users.owner!.id}`,
        { displayName: 'X' },
        { 'if-match': '"1"' },
      );
      expect(foreign.statusCode).toBe(404);
    });
  });

  describe('trusted devices (US-142, SR-DEV-01…06)', () => {
    it('grant from admin-web: re-auth 401, checklist 422, then 201 + Strict cookie; Me.deviceTrusted; mobile ≤ 30 days', async () => {
      const owner = Client.of(fa, t, 'owner');
      const url = `${P(t)}/trusted-devices`;
      const wrong = await owner.send('POST', url, {
        name: 'Máy quầy 1',
        deviceKind: 'desk',
        currentPassword: 'not-it-at-all',
        hardeningChecklistConfirmed: true,
      });
      expect(wrong.statusCode).toBe(401);
      expect(wrong.json().code).toBe('REAUTH_FAILED');
      const noChecklist = await owner.send('POST', url, {
        name: 'Máy quầy 1',
        deviceKind: 'desk',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: false,
      });
      expect(noChecklist.statusCode).toBe(422);
      expect(noChecklist.json().errors[0].code).toBe('CHECKLIST_REQUIRED');

      const ok = await owner.send('POST', url, {
        name: 'Máy quầy 1',
        deviceKind: 'desk',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: true,
      });
      expect(ok.statusCode).toBe(201);
      expect(String(ok.headers['set-cookie'])).toMatch(
        /^ottimo_did=[A-Za-z0-9_-]{43}; HttpOnly; SameSite=Strict; Path=\/; Expires=/,
      );
      expect(ok.json()).toMatchObject({
        name: 'Máy quầy 1',
        deviceKind: 'desk',
        isCurrentDevice: true,
      });
      expect(new Date(ok.json().expiresAt).getTime() - T0.getTime()).toBe(180 * 86_400_000);
      owner.deviceToken = cookieValue(ok, 'ottimo_did')!;
      const me = await owner.get('/v1/me');
      expect(me.json().properties[0].deviceTrusted).toBe(true);

      const dup = await owner.send('POST', url, {
        name: 'máy quầy 1',
        deviceKind: 'desk',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: true,
      });
      expect(dup.statusCode).toBe(422);
      expect(dup.json().errors[0]).toEqual({ field: 'name', code: 'DUPLICATE' });

      const tablet = await Client.of(fa, t, 'owner').send('POST', url, {
        name: 'Máy tính bảng ca đêm',
        deviceKind: 'facility_mobile',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: true,
      });
      expect(tablet.statusCode).toBe(201);
      expect(new Date(tablet.json().expiresAt).getTime() - T0.getTime()).toBe(30 * 86_400_000);

      const list = await owner.get(url);
      expect(list.statusCode).toBe(200);
      const names = list.json().data.map((d: { name: string }) => d.name);
      expect(names).toEqual(expect.arrayContaining(['Máy quầy 1', 'Máy tính bảng ca đêm']));
      expect(
        list.json().data.find((d: { name: string }) => d.name === 'Máy quầy 1').isCurrentDevice,
      ).toBe(true);

      // Revoke → effective at once; second revoke is a no-op 200; other property → 404.
      const id = ok.json().id as string;
      const rev = await owner.send('POST', `${url}/${id}/actions/revoke`, { reason: 'Mất máy' });
      expect(rev.statusCode).toBe(200);
      expect(rev.json().revokedAt).toBeDefined();
      expect((await owner.get('/v1/me')).json().properties[0].deviceTrusted).toBe(false);
      expect((await owner.send('POST', `${url}/${id}/actions/revoke`, {})).statusCode).toBe(200);
      const elsewhere = await owner.send(
        'POST',
        `/v1/properties/${other.propertyIds[0]}/trusted-devices/${id}/actions/revoke`,
        {},
      );
      expect(elsewhere.statusCode).toBe(404);
    });

    it('a staff PWA session cannot grant a device (SR-DEV-04) → 403', async () => {
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE user_session SET client_origin = 'staff_pwa' WHERE user_id = $1`, [
          t.users.owner!.id,
        ]),
      );
      const res = await Client.of(fa, t, 'owner').send('POST', `${P(t)}/trusted-devices`, {
        name: 'PWA',
        deviceKind: 'desk',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: true,
      });
      expect(res.statusCode).toBe(403);
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE user_session SET client_origin = 'admin' WHERE user_id = $1`, [
          t.users.owner!.id,
        ]),
      );
    });

    it('front desk cannot list devices (owner only) → 403', async () => {
      expect((await Client.of(fa, t, 'fd').get(`${P(t)}/trusted-devices`)).statusCode).toBe(403);
    });
  });
});

describe.skipIf(!HAS_DB)('identity – Origin classification (SR-SES-04, SR-DEV-04)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { owner: ['owner'] } });
    await seedSprint1Params(db, t);
    await setPassword(db, t, 'owner');
    fa = await startFeatureApp(db, {
      adminOrigins: ['https://desk.example.test'],
      pwaOrigins: ['https://staff.example.test'],
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const login = (origin?: string) =>
    fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t.users.owner!.username, password: TEST_PASSWORD },
      headers: origin ? { origin } : {},
    });

  it('login from an unknown Origin → 403; PWA origin → staff_pwa session (72 h idle, persistent cookie)', async () => {
    expect((await login('https://evil.example')).statusCode).toBe(403);
    const pwa = await login('https://staff.example.test');
    expect(pwa.statusCode).toBe(200);
    expect(String(pwa.headers['set-cookie'])).toContain('Max-Age=2592000');
    const token = cookieValue(pwa, 'ottimo_sid')!;
    const c = new Client(fa, token);
    const grant = await c.send(
      'POST',
      `${P(t)}/trusted-devices`,
      {
        name: 'PWA',
        deviceKind: 'desk',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: true,
      },
      { origin: 'https://staff.example.test' },
    );
    expect(grant.statusCode).toBe(403);
    const desk = await login('https://desk.example.test');
    expect(String(desk.headers['set-cookie'])).not.toContain('Max-Age');
  });
});
