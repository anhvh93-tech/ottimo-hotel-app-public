/**
 * Round 2 Sprint 1 review fixes of BE-B (identity, platform, guests) on Nest/Fastify + PostgreSQL:
 * - login lockout under parallel attempts (FB-R2-ARC-BE-03 / SEC-BE-04), locks never end live sessions
 *   (SEC-BE-05), temporary lock shown as `locked` and unlocked by the owner, per-IP limit audited (SEC-BE-14);
 * - account-wide changes need every property of the person (SEC-BE-07), never on oneself (SEC-BE-15);
 * - forbidden role + invalid body → 403 + access.denied for every Idempotency-Key write of BE-B (BUG-R2-005);
 * - parameters: hold_hours_default ∈ options (BUG-R2-007), foc_limits & co (ARC-BE-10), session_policy /
 *   login_lockout are owner-only security parameters with SEC bounds, applied as the strictest value
 *   across the user's properties (OpenAPI 0.3.4);
 * - guests: SAL/CTV probes through create/update count + audit (SEC-BE-09), lookup `match` (BUG-R2-008),
 *   possibleDuplicate flag (Q7), concurrent duplicate create (ARC-BE-15);
 * - rooms: bedSetup / bedCount / areaM2 (Q6); concurrent LAST_OWNER (ARC-BE-15).
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
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
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

const FUTURE = '2026-10-20';
const REASON = 'Điều chỉnh theo chính sách mới của khách sạn';

describe.skipIf(!HAS_DB)('BE-B review fixes (R2 Sprint 1)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;

  beforeAll(async () => {
    db = appDatabase(12);
    t = await createTenant(db, {
      properties: 2,
      users: {
        owner: ['owner'],
        owner2: ['owner'],
        mgr: ['manager'],
        fd: ['front_desk'],
        fd2: ['front_desk'],
        hk: ['housekeeping'],
        sal: ['sales_staff'],
        ctv: ['collaborator'],
        ctv2: ['collaborator'],
        burst: ['front_desk'],
        hard: ['front_desk'],
        temp: ['front_desk'],
        twoProps: ['front_desk'],
        strict: ['front_desk'],
      },
    });
    await seedSprint1Params(db, t);
    await seedSprint1Params(db, t, 1);
    await setParam(db, t, 'hold_hours_options', [12, 24, 48], '2026-10-01');
    await setParam(db, t, 'hold_hours_default', 24, '2026-10-01');
    // twoProps / strict also hold a role at property 1 (owned by nobody of this tenant except owner2 below).
    await db.withContext(t.ctx(), async (tx) => {
      for (const u of ['twoProps', 'strict']) {
        await tx.query(
          `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
           VALUES ($1, $2, $3, 'front_desk', $4)`,
          [t.users[u]!.id, t.propertyIds[1], t.organizationId, T0],
        );
      }
    });
    for (const u of ['burst', 'hard', 'temp', 'strict', 'fd', 'owner']) await setPassword(db, t, u);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const login = (username: string, password = TEST_PASSWORD, remoteAddress = '10.0.0.1') =>
    fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username, password },
      remoteAddress,
    });

  const audits = async (entityId: string, action: string) =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ category: string; reason: string | null; after: unknown }>(
          `SELECT category, reason, after FROM audit_event WHERE entity_id = $1 AND action = $2`,
          [entityId, action],
        ),
      )
    ).rows;

  describe('login lockout (SR-AUTH-04)', () => {
    it('10 wrong passwords in parallel lock the account: the next right password gets 429', async () => {
      const u = t.users.burst!;
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => login(u.username, 'Wrong-pass-123', `10.1.0.${i}`)),
      );
      // Every attempt was counted (no lost update): the 5th locked, later ones were "during the lock".
      expect(results.map((r) => r.statusCode).sort()).toEqual([
        401, 401, 401, 401, 401, 429, 429, 429, 429, 429,
      ]);
      const right = await login(u.username, TEST_PASSWORD, '10.1.1.1');
      expect(right.statusCode).toBe(429);
      expect(Number(right.headers['retry-after'])).toBeGreaterThan(800);
      expect(await audits(u.id, 'auth.account_locked')).toHaveLength(1);
    });

    it('a temporary lock never ends a live session; it shows as `locked`; the owner unlocks it', async () => {
      const u = t.users.temp!;
      const me = new Client(fa, u.sessionToken);
      for (let i = 0; i < 5; i++) await login(u.username, 'Wrong-pass-123', '10.2.0.1');
      expect((await login(u.username, TEST_PASSWORD, '10.2.0.2')).statusCode).toBe(429);
      // The front-desk agent already signed in keeps working (FB-R2-SEC-BE-05).
      expect((await me.get('/v1/me')).statusCode).toBe(200);
      const status = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ status: string }>(`SELECT status FROM app_user WHERE id = $1`, [u.id]),
      );
      expect(status.rows[0]!.status).toBe('active');

      const owner = Client.of(fa, t, 'owner');
      const list = await owner.get('/v1/users?limit=100');
      const row = list.json().data.find((x: { id: string }) => x.id === u.id);
      expect(row.status).toBe('locked');
      const unlock = await owner.send(
        'PATCH',
        `/v1/users/${u.id}`,
        { status: 'active', reauth: { password: TEST_PASSWORD } },
        { 'if-match': `"${row.version}"` },
      );
      expect(unlock.statusCode).toBe(200);
      expect(unlock.json().status).toBe('active');
      expect((await login(u.username, TEST_PASSWORD, '10.2.0.3')).statusCode).toBe(200);
    });

    it('a hard lock (status locked) blocks sign-in with the generic 401 but keeps live sessions', async () => {
      const u = t.users.hard!;
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE app_user SET status = 'locked', locked_until = NULL WHERE id = $1`, [
          u.id,
        ]),
      );
      expect((await login(u.username, TEST_PASSWORD, '10.3.0.1')).statusCode).toBe(401);
      expect((await new Client(fa, u.sessionToken).get('/v1/me')).statusCode).toBe(200);
    });

    it('the per-IP limit (20 / 15 min) answers 429 and writes one security event per window', async () => {
      const u = t.users.fd!;
      const codes: number[] = [];
      for (let i = 0; i < 23; i++) {
        codes.push((await login(u.username, 'Wrong-pass-123', '10.9.9.9')).statusCode);
      }
      expect(codes.slice(20)).toEqual([429, 429, 429]);
      const rows = await audits(u.id, 'auth.ip_rate_limited');
      expect(rows).toEqual([expect.objectContaining({ category: 'security' })]);
      // Reset the agent's failure counter for the other tests (wrong passwords counted too).
      await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `UPDATE app_user SET failed_login_count = 0, locked_until = NULL, lock_count_24h = 0 WHERE id = $1`,
          [u.id],
        ),
      );
    });

    it('a staff session is opened only from a staff origin once origins are configured (SEC-BE-12)', async () => {
      const app2 = await startFeatureApp(db, { adminOrigins: ['https://admin.example.test'] });
      try {
        const res = await app2.app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: { username: t.users.fd!.username, password: TEST_PASSWORD },
          headers: { origin: 'https://g.example.test' },
        });
        expect(res.statusCode).toBe(403);
      } finally {
        await app2.close();
      }
    });
  });

  describe('session_policy / login_lockout: security parameters, strictest across properties', () => {
    it('owner only; SEC hard bounds per sub-key; idle ≤ max × 60', async () => {
      const put = (who: string, key: string, value: unknown) =>
        Client.of(fa, t, who).send('PUT', `${P(t)}/parameters/${key}`, {
          value,
          effectiveFrom: FUTURE,
          reason: REASON,
        });
      const ok = {
        admin: { idleMinutes: 20, maxHours: 8 },
        staff_pwa: { idleMinutes: 600, maxHours: 240 },
      };
      expect((await put('mgr', 'session_policy', ok)).statusCode).toBe(403);
      const tooLong = await put('owner', 'session_policy', {
        ...ok,
        admin: { idleMinutes: 60, maxHours: 8 },
      });
      expect(tooLong.statusCode).toBe(422);
      expect(tooLong.json().errors).toEqual([
        { field: 'value.admin.idleMinutes', code: 'PARAM_OUT_OF_RANGE' },
      ]);
      const lockout = await put('owner', 'login_lockout', {
        maxFailures: 10,
        lockMinutes: 15,
        hardLockAfterLocks: 3,
        lockWindowHours: 24,
      });
      expect(lockout.statusCode).toBe(422);
      expect((await put('owner', 'session_policy', ok)).statusCode).toBe(200);
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT category FROM audit_event WHERE action = 'config.changed' AND entity_id = 'session_policy'`,
        ),
      );
      expect(audit.rows).toEqual([{ category: 'security' }]);
    });

    it('sign-in uses the strictest session_policy of the properties where the user has a role', async () => {
      await setParam(
        db,
        t,
        'session_policy',
        {
          admin: { idleMinutes: 10, maxHours: 4 },
          staff_pwa: { idleMinutes: 4320, maxHours: 720 },
        },
        '2026-10-01',
        1,
      );
      const res = await login(t.users.strict!.username, TEST_PASSWORD, '10.4.0.1');
      expect(res.statusCode).toBe(200);
      const token = cookieValue(res, 'ottimo_sid')!;
      const s = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ idle: Date; exp: Date }>(
          `SELECT idle_expires_at AS idle, expires_at AS exp FROM user_session WHERE id = $1`,
          [sha256Hex(token)],
        ),
      );
      expect(token).toBeTruthy();
      expect(s.rows[0]!.idle.getTime() - T0.getTime()).toBe(10 * 60_000);
      expect(s.rows[0]!.exp.getTime() - T0.getTime()).toBe(4 * 3600_000);
    });
  });

  describe('users: account-wide changes (SEC-BE-07, SEC-BE-15)', () => {
    it('an owner of one property cannot reset/disable a person who also works at another property', async () => {
      const u = t.users.twoProps!;
      const owner = Client.of(fa, t, 'owner');
      const reset = await owner.send(
        'PATCH',
        `/v1/users/${u.id}`,
        { resetPassword: 'Mot-mat-khau-tam-thoi-9', reauth: { password: TEST_PASSWORD } },
        { 'if-match': '"1"' },
      );
      expect(reset.statusCode).toBe(403);
      expect(reset.json().code).toBe('FORBIDDEN_ACTION');
      const disable = await owner.send(
        'PATCH',
        `/v1/users/${u.id}`,
        { status: 'disabled', reauth: { password: TEST_PASSWORD } },
        { 'if-match': '"1"' },
      );
      expect(disable.statusCode).toBe(403);
      const denied = await audits(u.id, 'access.denied');
      expect(denied).toHaveLength(2);
      expect(denied[0]!.reason).toBe('OTHER_PROPERTY');
      // displayName stays editable by an owner of one of the person's properties.
      const rename = await owner.send(
        'PATCH',
        `/v1/users/${u.id}`,
        { displayName: 'Lễ tân Hai Cơ Sở' },
        { 'if-match': '"1"' },
      );
      expect(rename.statusCode).toBe(200);
    });

    it('never on oneself: resetPassword → 422 NOT_ALLOWED_FOR_SELF (use changeMyPassword)', async () => {
      const res = await Client.of(fa, t, 'owner').send(
        'PATCH',
        `/v1/users/${t.users.owner!.id}`,
        { resetPassword: 'Mot-mat-khau-tam-thoi-9' },
        { 'if-match': '"1"' },
      );
      expect(res.statusCode).toBe(422);
      expect(res.json().errors).toEqual([{ field: 'resetPassword', code: 'NOT_ALLOWED_FOR_SELF' }]);
    });

    it('displayName follows V-01 like guest names (BUG-R2-011)', async () => {
      for (const name of ['Qa Rbac (tạm)', 'a_b', 'a@b']) {
        const res = await Client.of(fa, t, 'owner').send('POST', '/v1/users', {
          username: `v01.${randomUUID().slice(0, 8)}`,
          displayName: name,
          initialPassword: 'Mot-mat-khau-tam-thoi-9',
          roles: [{ propertyId: t.propertyIds[0], role: 'front_desk' }],
        });
        expect({ name, status: res.statusCode, errors: res.json().errors }).toEqual({
          name,
          status: 422,
          errors: [{ field: 'displayName', code: 'NAME_INVALID' }],
        });
      }
    });

    it('two owners removing each other at the same time: exactly one wins, the other gets LAST_OWNER', async () => {
      const single = await createTenant(db, { users: { a: ['owner'], b: ['owner'] } });
      await seedSprint1Params(db, single);
      const demote = (who: string, target: string) =>
        Client.of(fa, single, who).send(
          'PUT',
          `/v1/users/${single.users[target]!.id}/roles`,
          { roles: [{ propertyId: single.propertyIds[0], role: 'manager' }] },
          { 'if-match': '"1"' },
        );
      const [r1, r2] = await Promise.all([demote('a', 'b'), demote('b', 'a')]);
      const codes = [r1.statusCode, r2.statusCode].sort();
      // The loser either sees LAST_OWNER (422) or, when its own owner role was removed first, 403/401.
      expect(codes[0]).toBe(200);
      expect([401, 403, 422]).toContain(codes[1]);
      const owners = await db.withContext(single.ctx(), (tx) =>
        tx.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM user_property_role WHERE role = 'owner' AND revoked_at IS NULL`,
        ),
      );
      expect(owners.rows[0]!.n).toBe(1);
    });
  });

  describe('forbidden role before body/password checks (BUG-R2-005)', () => {
    const cases: Array<{
      op: string;
      who: string;
      method: 'POST' | 'PUT' | 'PATCH';
      url: () => string;
      ifMatch?: boolean;
    }> = [
      { op: 'createUser', who: 'mgr', method: 'POST', url: () => '/v1/users' },
      {
        op: 'updateUser',
        who: 'mgr',
        method: 'PATCH',
        url: () => `/v1/users/${t.users.fd!.id}`,
        ifMatch: true,
      },
      {
        op: 'setUserRoles',
        who: 'mgr',
        method: 'PUT',
        url: () => `/v1/users/${t.users.fd!.id}/roles`,
        ifMatch: true,
      },
      { op: 'createRoom', who: 'fd', method: 'POST', url: () => `${P(t)}/rooms` },
      {
        op: 'updateRoom',
        who: 'fd',
        method: 'PATCH',
        url: () => `${P(t)}/rooms/${randomUUID()}`,
        ifMatch: true,
      },
      { op: 'trustCurrentDevice', who: 'fd', method: 'POST', url: () => `${P(t)}/trusted-devices` },
      {
        op: 'revokeTrustedDevice',
        who: 'mgr',
        method: 'POST',
        url: () => `${P(t)}/trusted-devices/${randomUUID()}/actions/revoke`,
      },
      { op: 'createGuest', who: 'hk', method: 'POST', url: () => `${P(t)}/guests` },
      {
        op: 'updateGuest',
        who: 'hk',
        method: 'PATCH',
        url: () => `${P(t)}/guests/${randomUUID()}`,
        ifMatch: true,
      },
    ];
    for (const c of cases) {
      it(`${c.op}: ${c.who} with an empty body → 403 + access.denied (no 422/401)`, async () => {
        const res = await Client.of(fa, t, c.who).send(
          c.method,
          c.url(),
          c.op === 'trustCurrentDevice'
            ? { currentPassword: 'sai-mat-khau', hardeningChecklistConfirmed: false }
            : {},
          c.ifMatch ? { 'if-match': '"1"' } : {},
        );
        expect({ op: c.op, status: res.statusCode, code: res.json().code }).toEqual({
          op: c.op,
          status: 403,
          code: 'FORBIDDEN_ACTION',
        });
        const rows = await db.withContext(t.ctx(), (tx) =>
          tx.query(
            `SELECT 1 FROM audit_event WHERE action = 'access.denied' AND entity_id = $1
               AND session_id = $2`,
            [c.op, sha256Hex(t.users[c.who]!.sessionToken)],
          ),
        );
        expect(rows.rows.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  describe('parameters (BUG-R2-007, FB-R2-ARC-BE-10)', () => {
    const put = (key: string, value: unknown, who = 'owner') =>
      Client.of(fa, t, who).send('PUT', `${P(t)}/parameters/${key}`, {
        value,
        effectiveFrom: FUTURE,
        reason: REASON,
      });

    it('hold_hours_default must be one of hold_hours_options; options must keep the default', async () => {
      const bad = await put('hold_hours_default', 36, 'mgr');
      expect(bad.statusCode).toBe(422);
      expect(bad.json()).toMatchObject({
        code: 'PARAM_OUT_OF_RANGE',
        allowed: [12, 24, 48],
        errors: [{ field: 'value', code: 'PARAM_OUT_OF_RANGE' }],
      });
      expect((await put('hold_hours_default', 48, 'mgr')).statusCode).toBe(200);
      // From FUTURE the default is 48 → options without 48 are refused.
      expect((await put('hold_hours_options', [12, 24], 'mgr')).statusCode).toBe(422);
      expect((await put('hold_hours_options', [12, 24, 48, 72], 'mgr')).statusCode).toBe(200);
    });

    it('foc_limits: every role, numeric VND or the documented words, FDL ≤ manager', async () => {
      const good = {
        front_desk_lead: { perTimeVnd: 300000, perMonthVnd: 1500000 },
        manager: { perTime: 'one_night_rate' },
        owner: { perTime: 'unlimited' },
      };
      for (const bad of [
        { ...good, front_desk_lead: { perTimeVnd: '300000', perMonthVnd: 1500000 } },
        { manager: good.manager, owner: good.owner },
        { ...good, front_desk: { perTimeVnd: 1 } },
        { ...good, manager: { perTimeVnd: 200000 } },
        { ...good, owner: { perTime: 'sometimes' } },
      ]) {
        const res = await put('foc_limits', bad);
        expect({ bad, status: res.statusCode }).toEqual({ bad, status: 422 });
      }
      expect((await put('foc_limits', good)).statusCode).toBe(200);
      expect((await put('foc_approval_push_roles', 'everyone', 'mgr')).statusCode).toBe(422);
      expect(
        (await put('foc_approval_push_roles', 'lowest_sufficient_role_plus_manager', 'mgr'))
          .statusCode,
      ).toBe(200);
    });
  });

  describe('guests', () => {
    let seq = 0;
    const phone = () => `0912${String(100000 + seq++).padStart(6, '0')}`;
    const create = (who: string, body: Record<string, unknown>) =>
      Client.of(fa, t, who).send('POST', `${P(t)}/guests`, body);

    it('CTV contact probes through createGuest count toward 30/hour → 429 on the 31st', async () => {
      const codes: number[] = [];
      for (let i = 0; i < 31; i++) {
        codes.push(
          (await create('ctv2', { fullName: 'Khách Thử Nghiệm', phone: phone() })).statusCode,
        );
      }
      expect(codes.slice(0, 30).every((c) => c === 201)).toBe(true);
      expect(codes[30]).toBe(429);
    });

    it('a duplicate outside the CTV scope → 409 without id + audit guest.lookup (no value)', async () => {
      const p = phone();
      expect((await create('sal', { fullName: 'Trần Thị Bích', phone: p })).statusCode).toBe(201);
      const dup = await create('ctv', { fullName: 'Trần Thị Bích', phone: p });
      expect(dup.statusCode).toBe(409);
      expect(dup.json().existingGuestId).toBeUndefined();
      const rows = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ after: unknown; sid: string }>(
          `SELECT after, session_id AS sid FROM audit_event WHERE action = 'guest.lookup'
            AND actor_user_id = $1`,
          [t.users.ctv!.id],
        ),
      );
      expect(rows.rows).toHaveLength(1);
      expect(JSON.stringify(rows.rows[0]!.after)).not.toContain(p.slice(-6));
    });

    it('lookupGuestByContact: CTV gets match=possible_duplicate for SAL’s guest (BUG-R2-008)', async () => {
      const email = `bich.${randomUUID().slice(0, 6)}@example.test`;
      expect((await create('sal', { fullName: 'Lê Văn Cường', email })).statusCode).toBe(201);
      const res = await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/guests/lookup`, { email });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ matches: [], match: 'possible_duplicate' });
      const fd = await Client.of(fa, t, 'fd').send('POST', `${P(t)}/guests/lookup`, { email });
      expect(fd.json().matches).toHaveLength(1);
      expect(fd.json().match).toBeUndefined();
    });

    it('possibleDuplicate is stored on both look-alike profiles; FD+ sees it, SAL does not', async () => {
      const a = await create('fd', {
        fullName: 'Phạm Quốc Hùng',
        phone: phone(),
        dateOfBirth: '1985-03-04',
      });
      expect(a.statusCode).toBe(201);
      const b = await create('fd', {
        fullName: 'PHAM QUOC HUNG',
        phone: phone(),
        dateOfBirth: '1985-03-04',
      });
      expect(b.json().warnings).toEqual([
        { code: 'possible_duplicate_name_dob', guestId: a.json().id, guestCode: a.json().code },
      ]);
      const list = await Client.of(fa, t, 'fd').get(`${P(t)}/guests?q=pham quoc hung`);
      const flags = list
        .json()
        .data.filter((g: { id: string }) => [a.json().id, b.json().id].includes(g.id))
        .map((g: { possibleDuplicate?: boolean }) => g.possibleDuplicate);
      expect(flags).toEqual([true, true]);
      const other = await create('fd', { fullName: 'Hoàng Minh Tâm', phone: phone() });
      expect(other.json().warnings ?? []).toEqual([]);
      const one = await Client.of(fa, t, 'fd').get(`${P(t)}/guests?q=hoang minh tam`);
      expect(one.json().data[0].possibleDuplicate).toBe(false);
      // getGuest of a flagged profile still lists the look-alike (FD+).
      const got = await Client.of(fa, t, 'fd').get(`${P(t)}/guests/${a.json().id}`);
      expect(got.json().warnings).toEqual([
        { code: 'possible_duplicate_name_dob', guestId: b.json().id, guestCode: b.json().code },
      ]);
      const sal = await Client.of(fa, t, 'sal').get(`${P(t)}/guests?q=pham quoc hung`);
      for (const g of sal.json().data) expect(g.possibleDuplicate).toBeUndefined();
    });

    it('two createGuest with the same phone at the same time: exactly one 201, one 409', async () => {
      const p = phone();
      const [r1, r2] = await Promise.all([
        create('fd', { fullName: 'Đinh Thị Hoa', phone: p }),
        create('fd2', { fullName: 'Đinh Thị Hoa', phone: p }),
      ]);
      expect([r1.statusCode, r2.statusCode].sort()).toEqual([201, 409]);
    });
  });

  describe('rooms: bed setup, bed count, area (OpenAPI 0.3.4 Q6)', () => {
    it('create, list and clear with null', async () => {
      const owner = Client.of(fa, t, 'owner');
      const groups = await owner.get(`${P(t)}/room-groups`);
      let groupId = groups.json().data[0]?.id as string | undefined;
      if (!groupId) {
        groupId = randomUUID();
        await db.withContext(t.ctx(), (tx) =>
          tx.query(
            `INSERT INTO room_group (id, organization_id, property_id, code, name, sort_order,
               base_occupancy, max_occupancy, created_at, updated_at)
             VALUES ($1, $2, $3, 'G1', 'Nhóm thử', 1, 2, 3, $4, $4)`,
            [groupId, t.organizationId, t.propertyIds[0], T0],
          ),
        );
      }
      const res = await owner.send('POST', `${P(t)}/rooms`, {
        roomNo: '9Q1',
        roomGroupId: groupId,
        monthlyListPriceVnd: 8_000_000,
        bedSetup: ' 1 giường đôi 1m8  + sofa giường ',
        bedCount: 2,
        areaM2: 32,
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({
        bedSetup: '1 giường đôi 1m8 + sofa giường',
        bedCount: 2,
        areaM2: 32,
      });
      const list = await Client.of(fa, t, 'fd').get(`${P(t)}/rooms`);
      expect(list.json().data.find((r: { id: string }) => r.id === res.json().id)).toMatchObject({
        bedCount: 2,
        areaM2: 32,
      });
      const bad = await owner.send('POST', `${P(t)}/rooms`, {
        roomNo: '9Q2',
        roomGroupId: groupId,
        monthlyListPriceVnd: 8_000_000,
        bedCount: 11,
      });
      expect(bad.json().errors).toEqual([{ field: 'bedCount', code: 'VALUE_OUT_OF_RANGE' }]);
      const cleared = await owner.send(
        'PATCH',
        `${P(t)}/rooms/${res.json().id}`,
        { bedSetup: null, areaM2: null },
        { 'if-match': `"${res.json().version}"` },
      );
      expect(cleared.statusCode).toBe(200);
      expect(cleared.json().bedSetup).toBeUndefined();
      expect(cleared.json().areaM2).toBeUndefined();
      expect(cleared.json().bedCount).toBe(2);
    });
  });
});
