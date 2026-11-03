/**
 * R4 v1.0.3 – BUG-R3-032 staff security e-mail on Nest/Fastify + PostgreSQL (RLS on, ottimo_app):
 * `setMyEmail` (S2 + Idempotency-Key), `updateUser.email`, `Me.email` / `securityEmailMissing`, migration 0091,
 * the `email_changed` dispatcher path (self / previous / owner) and the 7-day purge.
 * Cases T1–T24 of ARC v1.0.3-contract-email 6 + SEC-on-v1.0.3-contract-email (01, 02, 04, 05, 08, 11, 14).
 * Fake data only: every address is on the reserved `.test` domain.
 */
import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  IntegrationError,
  type NotificationAdapter,
  type NotificationMessage,
} from '@ottimo/integrations/contracts';
import type { Database } from '../../src/db/database';
import { EMAIL_CHANGE_PURGE_JOB } from '../../src/jobs/builtin-jobs';
import { StaffEmailDispatcher } from '../../src/jobs/email-dispatch';
import type { PropertyRef } from '../../src/jobs/job-runner';
import { base32Decode, totpAt, totpStep } from '../../src/modules/identity/public/totp';
import {
  Client,
  type FeatureApp,
  TEST_PASSWORD,
  cookieValue,
  seedSprint1Params,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const TZ = 'Asia/Ho_Chi_Minh';
const FROM = 'OTTIMO Desk <Info@Example.test>';
const WRONG = 'Wrong-pass-2026!';

class RecordingAdapter implements NotificationAdapter {
  sent: NotificationMessage[] = [];
  failWith: (m: NotificationMessage) => IntegrationError | null = () => null;
  async send(_ctx: unknown, m: NotificationMessage) {
    const e = this.failWith(m);
    if (e) throw e;
    this.sent.push(m);
    return { status: 'sent' as const, providerMsgId: m.idempotencyKey };
  }
  async healthCheck() {
    return { status: 'ok' as const, checkedAt: '2026-10-15T09:00:00+07:00' as never };
  }
}

describe.skipIf(!HAS_DB)('v1.0.3 security e-mail (BUG-R3-032)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  const secrets = new Map<string, Buffer>();

  const USERS = {
    own: ['owner'],
    own2: ['owner'],
    mgr: ['manager'],
    fd: ['front_desk'],
    fd2: ['front_desk'],
    fd3: ['front_desk'],
    multi: ['front_desk'],
    hk: ['housekeeping'],
    temp: ['front_desk'],
    enr: ['manager'],
    mfa: ['front_desk_lead'],
    race: ['front_desk'],
    idem: ['front_desk_lead'],
    nomail: ['manager'],
  };

  const addr = (name: string) => `${name}-${t.organizationId.slice(-6)}@example.test`;
  const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    db.withContext(t.ctx(), (tx) => tx.query<R>(sql, params));
  const setRaw = (tt: TestTenant, user: string, value: string | null) =>
    db.withContext(tt.ctx(), (tx) =>
      tx.query('UPDATE app_user SET email = $2 WHERE id = $1', [tt.users[user]!.id, value]),
    );
  const version = async (user: string, tt: TestTenant = t) =>
    (
      await db.withContext(tt.ctx(), (tx) =>
        tx.query<{ version: number }>('SELECT version FROM app_user WHERE id = $1', [
          tt.users[user]!.id,
        ]),
      )
    ).rows[0]!.version;
  const failures = async (user: string) =>
    (
      await q<{ n: number }>('SELECT approval_pin_failed_count AS n FROM app_user WHERE id = $1', [
        t.users[user]!.id,
      ])
    ).rows[0]!.n;
  const count = async (sql: string, params: unknown[] = [], tt: TestTenant = t) =>
    (await db.withContext(tt.ctx(), (tx) => tx.query<{ n: number }>(sql, params))).rows[0]!.n;
  const stepups = (user: string) =>
    count(
      `SELECT count(*)::int AS n FROM audit_event WHERE entity_id = $1 AND action LIKE 'stepup.s2_%'`,
      [t.users[user]!.id],
    );
  const changes = (user: string, tt: TestTenant = t) =>
    count(
      'SELECT count(*)::int AS n FROM user_email_change WHERE user_id = $1',
      [tt.users[user]!.id],
      tt,
    );

  const putEmail = (
    user: string,
    email: string | null,
    reauth: Record<string, unknown> | null = { password: TEST_PASSWORD },
    headers: Record<string, string> = {},
    tt: TestTenant = t,
  ) =>
    Client.of(fa, tt, user).send(
      'PUT',
      '/v1/me/email',
      { email, ...(reauth !== null ? { reauth } : {}) },
      headers,
    );
  const patchUser = async (
    caller: string,
    target: string,
    body: Record<string, unknown>,
    tt: TestTenant = t,
  ) =>
    Client.of(fa, tt, caller).send('PATCH', `/v1/users/${tt.users[target]!.id}`, body, {
      'if-match': `"${await version(target, tt)}"`,
    });

  /** Full enrolment through the API (mfa-us143 pattern); returns the new full session client. */
  async function enroll(user: string): Promise<Client> {
    const res = await fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t.users[user]!.username, password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    const c = new Client(fa, cookieValue(res, 'ottimo_sid')!);
    const setup = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    expect(setup.statusCode).toBe(200);
    const uri = new URL(setup.json().otpauthUri.replace('otpauth://', 'https://'));
    secrets.set(user, base32Decode(uri.searchParams.get('secret')!));
    const conf = await c.send('POST', '/v1/me/2fa/confirm', { totpCode: code(user) });
    expect(conf.statusCode).toBe(200);
    return new Client(fa, cookieValue(conf, 'ottimo_sid')!);
  }
  const code = (user: string) => totpAt(secrets.get(user)!, totpStep(fa.clock.now()));

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, { properties: 2, users: USERS });
    await seedSprint1Params(db, t);
    for (const u of Object.keys(USERS)) await setPassword(db, t, u);
    // multi works at both properties; own owns only property 0 (T22).
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
         VALUES ($1, $2, $3, 'front_desk', $4)`,
        [t.users.multi!.id, t.propertyIds[1], t.organizationId, T0],
      ),
    );
    fa = await startFeatureApp(db, { emailFrom: FROM });
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  // ───────────────────────────── setMyEmail ─────────────────────────────

  it('T1: reauth missing → 422 STRONG_REAUTH_REQUIRED (field reauth), not counted, nothing written', async () => {
    const res = await putEmail('fd', addr('fd'), null);
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toEqual([{ field: 'reauth', code: 'STRONG_REAUTH_REQUIRED' }]);
    expect(await failures('fd')).toBe(0);
    expect(await changes('fd')).toBe(0);
  });

  it('T2: wrong password → 401 REAUTH_FAILED, counted on SR-RL-02, nothing written', async () => {
    const res = await putEmail('fd', addr('fd'), { password: WRONG });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('REAUTH_FAILED');
    expect(await failures('fd')).toBe(1);
    expect(await changes('fd')).toBe(0);
    // a success clears the counter (shared S2 rule)
    expect((await putEmail('fd', addr('fd'))).statusCode).toBe(200);
    expect(await failures('fd')).toBe(0);
  });

  it('T7 + EM-05 + EM-11: bad shape / 255 chars / shared mailbox → 422 before S2, no value echoed, no factor burnt', async () => {
    const cases: Array<[string, string]> = [
      ['nope', 'EMAIL_INVALID'],
      [
        `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(57)}.test`,
        'EMAIL_INVALID',
      ],
      ['a@b.c,d@e.f', 'EMAIL_INVALID'],
      ['"x"@y.vn', 'EMAIL_INVALID'],
      ['nguyễn@x.vn', 'EMAIL_INVALID'],
      ['a@localhost', 'EMAIL_INVALID'],
      ['', 'EMAIL_INVALID'],
      [' INFO@example.TEST ', 'EMAIL_SHARED_MAILBOX'],
    ];
    const before = await stepups('fd2');
    for (const [email, c] of cases) {
      const res = await putEmail('fd2', email, { password: WRONG });
      expect({ email, status: res.statusCode }).toEqual({ email, status: 422 });
      expect(res.json().errors).toEqual([{ field: 'email', code: c }]);
      expect(res.body).not.toContain('@');
    }
    // checked before S2: the wrong password was never tried
    expect(await failures('fd2')).toBe(0);
    expect(await stepups('fd2')).toBe(before);
    // updateUser takes the same rule
    const u = await patchUser('own', 'fd2', {
      email: 'info@example.test',
      reauth: { password: WRONG },
    });
    expect(u.statusCode).toBe(422);
    expect(u.json().errors).toEqual([{ field: 'email', code: 'EMAIL_SHARED_MAILBOX' }]);
    expect(await failures('own')).toBe(0);
  });

  it('T7 (TOTP): a refused address does not consume the code – the same code then succeeds', async () => {
    const c = await enroll('mfa');
    fa.clock.advance(30_000);
    const totp = code('mfa');
    const bad = await c.send('PUT', '/v1/me/email', {
      email: 'not-an-address',
      reauth: { password: TEST_PASSWORD, totpCode: totp },
    });
    expect(bad.statusCode).toBe(422);
    const missing = await c.send('PUT', '/v1/me/email', {
      email: addr('mfa'),
      reauth: { password: TEST_PASSWORD },
    });
    expect(missing.statusCode).toBe(422);
    expect(missing.json().errors).toEqual([
      { field: 'reauth.totpCode', code: 'STRONG_REAUTH_REQUIRED' },
    ]);
    const ok = await c.send('PUT', '/v1/me/email', {
      email: addr('mfa'),
      reauth: { password: TEST_PASSWORD, totpCode: totp },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ email: addr('mfa') });
  });

  it('T21 + EM-01: no Idempotency-Key → 428; replay with the same key + same TOTP → stored 200, nothing counted or written twice', async () => {
    const c = await enroll('idem');
    const noKey = await fa.app.inject({
      method: 'PUT',
      url: '/v1/me/email',
      headers: c.headers({}, true),
      payload: { email: addr('idem'), reauth: { password: TEST_PASSWORD } },
    });
    expect(noKey.statusCode).toBe(428);
    fa.clock.advance(30_000);
    const key = randomUUID();
    const body = {
      email: addr('idem'),
      reauth: { password: TEST_PASSWORD, totpCode: code('idem') },
    };
    const first = await c.send('PUT', '/v1/me/email', body, { 'idempotency-key': key });
    expect(first.statusCode).toBe(200);
    expect(first.headers['cache-control']).toBe('no-store');
    const granted = await stepups('idem');
    const again = await c.send('PUT', '/v1/me/email', body, { 'idempotency-key': key });
    expect(again.statusCode).toBe(200);
    expect(again.headers['idempotent-replayed']).toBe('true');
    expect(again.json()).toEqual({ email: addr('idem') });
    expect(await failures('idem')).toBe(0);
    expect(await stepups('idem')).toBe(granted); // no stepup.s2_failed / granted for the replay
    expect(await changes('idem')).toBe(1);
  });

  it('T8: same address, other case → 200, no audit, no change row, no e-mail, version unchanged', async () => {
    await setRaw(t, 'fd3', addr('fd3'));
    const v = await version('fd3');
    const outbox = await count(
      `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'staff.email' AND payload->'userIds' ? $1`,
      [t.users.fd3!.id],
    );
    const res = await putEmail('fd3', `  ${addr('fd3').toUpperCase()} `);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ email: addr('fd3') });
    expect(await version('fd3')).toBe(v);
    expect(await changes('fd3')).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int AS n FROM audit_event WHERE entity_id = $1 AND action = 'user.email_changed'`,
        [t.users.fd3!.id],
      ),
    ).toBe(0);
    expect(
      await count(
        `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'staff.email' AND payload->'userIds' ? $1`,
        [t.users.fd3!.id],
      ),
    ).toBe(outbox);
  });

  it('T20: temporary-password session and 2FA-enrolment session → 403 like every other operation', async () => {
    await q('UPDATE app_user SET must_change_password = true WHERE id = $1', [t.users.temp!.id]);
    const a = await putEmail('temp', addr('temp'));
    expect(a.statusCode).toBe(403);
    expect(a.json().code).toBe('PASSWORD_CHANGE_REQUIRED');
    await q('UPDATE user_session SET enrollment_only = true WHERE user_id = $1', [t.users.enr!.id]);
    const b = await putEmail('enr', addr('enr'));
    expect(b.statusCode).toBe(403);
    expect(b.json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(await changes('temp')).toBe(0);
    expect(await changes('enr')).toBe(0);
  });

  it('EM-08: two concurrent changes of one person both record a distinct old address (row lock)', async () => {
    await setRaw(t, 'race', addr('race-a'));
    const [x, y] = await Promise.all([
      putEmail('race', addr('race-x')),
      putEmail('race', addr('race-y')),
    ]);
    expect([x.statusCode, y.statusCode]).toEqual([200, 200]);
    const { rows } = await q<{ old: string }>(
      'SELECT old_email::text AS old FROM user_email_change WHERE user_id = $1 ORDER BY changed_at, id',
      [t.users.race!.id],
    );
    const olds = rows.map((r) => r.old).sort();
    expect(olds).toHaveLength(2);
    expect(olds).toContain(addr('race-a'));
    expect(olds.filter((o) => o === addr('race-a'))).toHaveLength(1);
  });

  // ───────────────────────────── updateUser.email ─────────────────────────────

  it('T3: MGR PATCH /users/{OWN} with email → 403 at the role guard, nothing written', async () => {
    const res = await patchUser('mgr', 'own', {
      email: addr('x'),
      reauth: { password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(403);
    expect(await changes('own')).toBe(0);
    expect(await failures('mgr')).toBe(0);
  });

  let deniedOwnerBody: Record<string, unknown> = {};

  it('T4 + EM-02 + EM-14: OWN → another OWN → 403 before S2, access.denied TARGET_OWNER, no stepup', async () => {
    const before = await stepups('own');
    const res = await patchUser('own', 'own2', {
      email: addr('x'),
      reauth: { password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('FORBIDDEN_ACTION');
    expect(res.body).not.toContain('@');
    deniedOwnerBody = { ...res.json(), requestId: undefined };
    expect(await stepups('own')).toBe(before);
    const { rows } = await q<{ reason: string; after: unknown }>(
      `SELECT reason, after FROM audit_event WHERE action = 'access.denied' AND entity_id = $1`,
      [t.users.own2!.id],
    );
    expect(rows.map((r) => r.reason)).toEqual(['TARGET_OWNER']);
    expect(JSON.stringify(rows[0]!.after)).not.toContain('@');
    expect(await changes('own2')).toBe(0);
  });

  it('T22 + EM-02 + EM-14: OWN owning 1 of the 2 properties of the person → 403 before S2, same body, reason OTHER_PROPERTY', async () => {
    const before = await stepups('own');
    const res = await patchUser('own', 'multi', {
      email: addr('multi'),
      reauth: { password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(403);
    expect({ ...res.json(), requestId: undefined }).toEqual(deniedOwnerBody);
    expect(await stepups('own')).toBe(before);
    const { rows } = await q<{ reason: string }>(
      `SELECT reason FROM audit_event WHERE action = 'access.denied' AND entity_id = $1`,
      [t.users.multi!.id],
    );
    expect(rows.map((r) => r.reason)).toEqual(['OTHER_PROPERTY']);
    expect(await changes('multi')).toBe(0);
  });

  it('T5: OWN PATCH /users/{self} with email → 422 NOT_ALLOWED_FOR_SELF (field email), no S2', async () => {
    const before = await stepups('own');
    const res = await patchUser('own', 'own', {
      email: addr('own'),
      reauth: { password: WRONG },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toEqual([{ field: 'email', code: 'NOT_ALLOWED_FOR_SELF' }]);
    expect(await failures('own')).toBe(0);
    expect(await stepups('own')).toBe(before);
  });

  it('T6 + EM-11: OWN sets the e-mail of FD (S2) → 200, User.email, version + 1, masked audit, notices to FD + owners, no address anywhere else', async () => {
    const v = await version('hk');
    const res = await patchUser('own', 'hk', {
      email: ` ${addr('hk').toUpperCase()}`,
      reauth: { password: TEST_PASSWORD },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe(addr('hk'));
    expect(res.json().version).toBe(v + 1);
    const { rows: audit } = await q<{ before: unknown; after: unknown; category: string }>(
      `SELECT before, after, category FROM audit_event WHERE entity_id = $1 AND action = 'user.email_changed'`,
      [t.users.hk!.id],
    );
    expect(audit).toEqual([
      {
        category: 'security',
        before: { emailMasked: null },
        after: { emailMasked: 'h***@e***.test', via: 'owner' },
      },
    ]);
    const { rows: change } = await q<{ old_email: string | null; via: string; changed_by: string }>(
      'SELECT old_email::text AS old_email, via, changed_by FROM user_email_change WHERE user_id = $1',
      [t.users.hk!.id],
    );
    expect(change).toEqual([{ old_email: null, via: 'owner', changed_by: t.users.own!.id }]);
    const { rows: notes } = await q<{ user_id: string; ref_code: string }>(
      `SELECT user_id, ref_code FROM staff_notification
        WHERE kind = 'account_security_change' AND ref_id = $1 ORDER BY user_id`,
      [t.users.hk!.id],
    );
    expect(notes.map((n) => n.user_id).sort()).toEqual(
      [t.users.hk!.id, t.users.own!.id, t.users.own2!.id].sort(),
    );
    expect(notes.every((n) => n.ref_code === 'user.email_changed')).toBe(true);
    const leaks = await count(
      `SELECT count(*)::int AS n FROM (
         SELECT payload::text AS s FROM outbox_message WHERE organization_id = $1
         UNION ALL SELECT coalesce(ref_code, '') FROM staff_notification WHERE organization_id = $1
         UNION ALL SELECT coalesce(before::text, '') || coalesce(after::text, '') FROM audit_event
          WHERE organization_id = $1) x WHERE s LIKE '%@example.test%'`,
      [t.organizationId],
    );
    expect(leaks).toBe(0);
    // listUsers (owner) shows it in full; removing it (null) works the same way
    const list = await Client.of(fa, t, 'own').get('/v1/users?limit=100');
    const hk = (list.json().data as Array<{ id: string; email: string | null }>).find(
      (u) => u.id === t.users.hk!.id,
    );
    expect(hk?.email).toBe(addr('hk'));
    const removed = await patchUser('own', 'hk', {
      email: null,
      reauth: { password: TEST_PASSWORD },
    });
    expect(removed.statusCode).toBe(200);
    expect(removed.json().email).toBeNull();
    expect(await changes('hk')).toBe(2);
  });

  it('T9: the outbox row of email_changed holds ids only (no @)', async () => {
    const { rows } = await q<{ payload: Record<string, unknown> }>(
      `SELECT payload FROM outbox_message WHERE topic = 'staff.email' AND payload->>'template' = 'email_changed'
        AND payload->'userIds' ? $1 ORDER BY created_at, id`,
      [t.users.hk!.id],
    );
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(Object.keys(r.payload).sort()).toEqual(
        ['emailChangeId', 'owners', 'template', 'userIds'].sort(),
      );
      expect(r.payload.owners).toBe(true);
      expect(JSON.stringify(r.payload)).not.toContain('@');
    }
  });

  // ───────────────────────────── getMe ─────────────────────────────

  it('T15: getMe – owner/manager without e-mail → securityEmailMissing; other roles never; own address in full', async () => {
    const me = async (user: string) => (await Client.of(fa, t, user).get('/v1/me')).json();
    expect(await me('nomail')).toMatchObject({ email: null, securityEmailMissing: true });
    expect(await me('fd2')).toMatchObject({ email: null, securityEmailMissing: false });
    expect(await me('fd')).toMatchObject({ email: addr('fd'), securityEmailMissing: false });
    expect((await putEmail('nomail', addr('nomail'))).statusCode).toBe(200);
    expect(await me('nomail')).toMatchObject({
      email: addr('nomail'),
      securityEmailMissing: false,
    });
  });

  // ───────────────────────────── log hook ─────────────────────────────

  it('T16: no request-log line carries an address (accepted, refused, replayed)', async () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) {
        lines.push(String(chunk));
        cb();
      },
    });
    const logged = await startFeatureApp(db, {
      logStream: sink,
      logLevel: 'trace',
      emailFrom: FROM,
    });
    try {
      const c = Client.of(logged, t, 'fd2');
      const key = randomUUID();
      const body = { email: addr('logged'), reauth: { password: TEST_PASSWORD } };
      expect(
        (await c.send('PUT', '/v1/me/email', body, { 'idempotency-key': key })).statusCode,
      ).toBe(200);
      expect(
        (await c.send('PUT', '/v1/me/email', body, { 'idempotency-key': key })).statusCode,
      ).toBe(200);
      expect(
        (
          await c.send('PUT', '/v1/me/email', {
            email: 'bad@@example.test',
            reauth: { password: WRONG },
          })
        ).statusCode,
      ).toBe(422);
      expect((await c.get('/v1/me')).statusCode).toBe(200);
    } finally {
      await logged.close();
    }
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((l) => l.includes('example.test'))).toEqual([]);
  });

  // ───────────────────────────── migration 0091 ─────────────────────────────

  it('T18: 0091 – CHECK on app_user.email, user_email_change RLS ENABLE + FORCE, tenant policy, no DELETE grant', async () => {
    const { rows } = await db.pool.query<{
      on: boolean;
      forced: boolean;
      del: boolean;
      sel: boolean;
      ins: boolean;
      upd: boolean;
      pol: number;
      chk: number;
    }>(
      `SELECT c.relrowsecurity AS on, c.relforcerowsecurity AS forced,
              has_table_privilege('ottimo_app', 'user_email_change', 'DELETE') AS del,
              has_table_privilege('ottimo_app', 'user_email_change', 'SELECT') AS sel,
              has_table_privilege('ottimo_app', 'user_email_change', 'INSERT') AS ins,
              has_table_privilege('ottimo_app', 'user_email_change', 'UPDATE') AS upd,
              (SELECT count(*)::int FROM pg_policies WHERE tablename = 'user_email_change'
                 AND policyname = 'tenant_isolation') AS pol,
              (SELECT count(*)::int FROM pg_constraint WHERE conname = 'app_user_email_check') AS chk
         FROM pg_class c WHERE c.relname = 'user_email_change' AND c.relnamespace = 'public'::regnamespace`,
    );
    expect(rows[0]).toEqual({
      on: true,
      forced: true,
      del: false,
      sel: true,
      ins: true,
      upd: true,
      pol: 1,
      chk: 1,
    });
    // the CHECK refuses an empty / @-less value written past the API
    for (const bad of ['', 'ab', 'nobody.example.test']) {
      await expect(setRaw(t, 'fd2', bad)).rejects.toMatchObject({ code: '23514' });
    }
    // another organisation sees none of the rows
    const other = await createTenant(db, { users: { o: ['owner'] } });
    expect(await count('SELECT count(*)::int AS n FROM user_email_change', [], other)).toBe(0);
    expect(await count('SELECT count(*)::int AS n FROM user_email_change')).toBeGreaterThan(0);
  });

  // ───────────────────────────── 7-day purge ─────────────────────────────

  it('T19: email_change.purge – old address of a row > 7 days → NULL (+ purge_journal), a 2-day-old row kept', async () => {
    const oldId = uuidv7();
    const recentId = uuidv7();
    const now = new Date(T0.getTime() + 10 * 86_400_000);
    await db.withContext(t.ctx(), async (tx) => {
      for (const [id, days] of [
        [oldId, 8],
        [recentId, 2],
      ] as const) {
        await tx.query(
          `INSERT INTO user_email_change (id, organization_id, user_id, old_email, changed_by, via, changed_at)
           VALUES ($1, $2, $3, $4, $3, 'self', $5)`,
          [
            id,
            t.organizationId,
            t.users.fd2!.id,
            addr(`old${days}`),
            new Date(now.getTime() - days * 86_400_000),
          ],
        );
      }
    });
    const stats = await db.withContext(t.ctx(), (tx) =>
      EMAIL_CHANGE_PURGE_JOB.handler(tx, {
        now,
        organizationId: t.organizationId,
        propertyId: t.propertyIds[0]!,
        timezone: TZ,
        date: '2026-10-25',
        slot: '03:00',
      }),
    );
    expect(stats).toMatchObject({ purged: expect.any(Number) });
    const { rows } = await q<{ id: string; old_email: string | null }>(
      'SELECT id, old_email::text AS old_email FROM user_email_change WHERE id = ANY($1::uuid[])',
      [[oldId, recentId]],
    );
    const byId = Object.fromEntries(rows.map((r) => [r.id, r.old_email]));
    expect(byId[oldId]).toBeNull();
    expect(byId[recentId]).toBe(addr('old2'));
    expect(
      await count(
        `SELECT count(*)::int AS n FROM purge_journal WHERE subject_id = $1
           AND subject_type = 'user_email_change' AND action = 'null_columns'`,
        [oldId],
      ),
    ).toBe(1);
  });
});

// ───────────────────────────── dispatcher (email_changed) ─────────────────────────────

describe.skipIf(!HAS_DB)(
  'v1.0.3 email_changed through the dispatcher (T10–T14, T23, T24, Q2)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let now: Date;
    const clock = { now: () => now };

    beforeAll(async () => {
      db = appDatabase(6);
      fa = await startFeatureApp(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    async function scenario(users: Record<string, string[]>) {
      const t = await createTenant(db, { users });
      for (const u of Object.keys(users)) await setPassword(db, t, u);
      const addr = (name: string) => `${name}-${t.organizationId.slice(-6)}@example.test`;
      const setRaw = (user: string, value: string | null) =>
        db.withContext(t.ctx(), (tx) =>
          tx.query('UPDATE app_user SET email = $2 WHERE id = $1', [t.users[user]!.id, value]),
        );
      const put = async (user: string, email: string | null) => {
        const res = await Client.of(fa, t, user).send('PUT', '/v1/me/email', {
          email,
          reauth: { password: TEST_PASSWORD },
        });
        expect(res.statusCode).toBe(200);
      };
      const adapter = new RecordingAdapter();
      const logs: string[] = [];
      const d = new StaffEmailDispatcher(db, clock, adapter, (level, msg, extra) =>
        logs.push(JSON.stringify({ level, msg, ...extra })),
      );
      const p: PropertyRef = {
        propertyId: t.propertyIds[0]!,
        organizationId: t.organizationId,
        timezone: TZ,
      };
      const rows = () =>
        db.withContext(
          t.ctx(),
          async (tx) =>
            (
              await tx.query<{
                status: string;
                last_error: string | null;
                payload: Record<string, unknown>;
              }>(
                `SELECT status, last_error, payload FROM outbox_message WHERE topic = 'staff.email' ORDER BY created_at, id`,
              )
            ).rows,
        );
      const changes = () =>
        db.withContext(
          t.ctx(),
          async (tx) =>
            (
              await tx.query<{
                id: string;
                old_email: string | null;
                old_notified_at: Date | null;
              }>(
                `SELECT id, old_email::text AS old_email, old_notified_at FROM user_email_change ORDER BY changed_at, id`,
              )
            ).rows,
        );
      const sentTo = () => adapter.sent.map((m) => [m.to, m.params.audience]);
      return { t, addr, setRaw, put, adapter, logs, d, p, rows, changes, sentTo };
    }

    const fresh = () => {
      now = new Date(T0.getTime() + 3_600_000);
    };

    it('T10: A → X – X (self), A (previous), the other owner (owner); done; old address cleared', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'], own: ['owner'] });
      await s.setRaw('fd', s.addr('fd-a'));
      await s.setRaw('own', s.addr('own'));
      await s.put('fd', s.addr('fd-x'));
      const st = await s.d.runForProperty(s.p);
      expect(st).toMatchObject({ sent: 3, done: 1, dead: 0 });
      expect(s.sentTo().sort()).toEqual(
        [
          [s.addr('fd-x'), 'self'],
          [s.addr('fd-a'), 'previous'],
          [s.addr('own'), 'owner'],
        ].sort(),
      );
      expect(s.adapter.sent.every((m) => m.templateId === 'email_changed')).toBe(true);
      expect(s.adapter.sent.every((m) => m.params.via === 'self')).toBe(true);
      for (const m of s.adapter.sent) expect(JSON.stringify(m.params)).not.toContain('@');
      const [c] = await s.changes();
      expect(c!.old_email).toBeNull();
      expect(c!.old_notified_at).not.toBeNull();
      const [r] = await s.rows();
      expect(r!.status).toBe('done');
      expect((r!.payload.sentUserIds as string[]).includes(c!.id)).toBe(true);
      expect(s.logs.join('\n')).not.toContain('@');
    });

    it('updateUser.email by an owner → every copy carries via = owner (CPY: the person did not change it)', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'], own: ['owner'], own2: ['owner'] });
      await s.setRaw('fd', s.addr('fd-a'));
      await s.setRaw('own2', s.addr('own2'));
      const v = await db.withContext(
        s.t.ctx(),
        async (tx) =>
          (
            await tx.query<{ version: number }>('SELECT version FROM app_user WHERE id = $1', [
              s.t.users.fd!.id,
            ])
          ).rows[0]!.version,
      );
      const res = await Client.of(fa, s.t, 'own').send(
        'PATCH',
        `/v1/users/${s.t.users.fd!.id}`,
        { email: s.addr('fd-x'), reauth: { password: TEST_PASSWORD } },
        { 'if-match': `"${v}"` },
      );
      expect(res.statusCode).toBe(200);
      await s.d.runForProperty(s.p);
      expect(s.sentTo().sort()).toEqual(
        [
          [s.addr('fd-x'), 'self'],
          [s.addr('fd-a'), 'previous'],
          [s.addr('own2'), 'owner'],
        ].sort(),
      );
      expect(s.adapter.sent.every((m) => m.params.via === 'owner')).toBe(true);
    });

    it('Q2: first address (old NULL) – no previous copy; self + owner only', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'], own: ['owner'] });
      await s.setRaw('own', s.addr('own'));
      await s.put('fd', s.addr('fd-x'));
      await s.d.runForProperty(s.p);
      expect(s.sentTo().sort()).toEqual(
        [
          [s.addr('fd-x'), 'self'],
          [s.addr('own'), 'owner'],
        ].sort(),
      );
      expect((await s.changes())[0]!.old_email).toBeNull();
    });

    it('T11: A → X → Y before the worker runs – previous #1 to A, #2 to X, both self copies to Y', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'], own: ['owner'] });
      await s.setRaw('fd', s.addr('a'));
      await s.put('fd', s.addr('x'));
      now = new Date(now.getTime() + 60_000);
      await s.put('fd', s.addr('y'));
      await s.d.runForProperty(s.p);
      const prev = s.adapter.sent.filter((m) => m.params.audience === 'previous').map((m) => m.to);
      expect(prev).toEqual([s.addr('a'), s.addr('x')]);
      const self = s.adapter.sent.filter((m) => m.params.audience === 'self').map((m) => m.to);
      expect(self).toEqual([s.addr('y'), s.addr('y')]);
      expect((await s.changes()).every((c) => c.old_email === null)).toBe(true);
    });

    it('T12: removal (null) – previous to the old address + owner, no self', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'], own: ['owner'] });
      await s.setRaw('fd', s.addr('fd-a'));
      await s.setRaw('own', s.addr('own'));
      await s.put('fd', null);
      await s.d.runForProperty(s.p);
      expect(s.sentTo().sort()).toEqual(
        [
          [s.addr('fd-a'), 'previous'],
          [s.addr('own'), 'owner'],
        ].sort(),
      );
    });

    it('T13: retry after a temporary SMTP error does not e-mail again who already got it', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'], own: ['owner'] });
      await s.setRaw('fd', s.addr('fd-a'));
      await s.setRaw('own', s.addr('own'));
      await s.put('fd', s.addr('fd-x'));
      let failOnce = true;
      s.adapter.failWith = (m) => {
        if (m.params.audience === 'owner' && failOnce) {
          failOnce = false;
          return new IntegrationError('UNAVAILABLE', 'down', { providerMessage: 'SMTP:421' });
        }
        return null;
      };
      const first = await s.d.runForProperty(s.p);
      expect(first.retry).toBe(1);
      expect((await s.changes())[0]!.old_email).toBe(s.addr('fd-a')); // kept until the row ends
      now = new Date(now.getTime() + 2 * 60_000);
      const second = await s.d.runForProperty(s.p);
      expect(second).toMatchObject({ done: 1 });
      const tos = s.adapter.sent.map((m) => m.to);
      expect(tos.sort()).toEqual([s.addr('fd-x'), s.addr('fd-a'), s.addr('own')].sort());
      expect(new Set(tos).size).toBe(tos.length);
      expect((await s.changes())[0]!.old_email).toBeNull();
    });

    it('T14 (BUG-R3-032 main case): owner with an address → receiving_account_changed is done, not dead NO_RECIPIENT', async () => {
      fresh();
      const s = await scenario({ own: ['owner'] });
      await s.put('own', s.addr('own'));
      await s.d.runForProperty(s.p); // email_changed (self only)
      s.adapter.sent = [];
      await db.withContext(s.t.ctx(), (tx) =>
        tx.query(
          `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
         VALUES ($1, $2, $3, 'staff.email', $4, $5)`,
          [
            uuidv7(),
            s.t.organizationId,
            s.t.propertyIds[0],
            JSON.stringify({ template: 'receiving_account_changed', userIds: [], owners: true }),
            `test:${uuidv7()}`,
          ],
        ),
      );
      const st = await s.d.runForProperty(s.p);
      expect(st).toMatchObject({ sent: 1, done: 1, dead: 0 });
      expect(s.sentTo()).toEqual([[s.addr('own'), 'owner']]);
      const rows = await s.rows();
      expect(rows.map((r) => r.status)).toEqual(['done', 'done']);
    });

    it('dedupe: the sole owner changing their own address gets self + previous only (no owner copy)', async () => {
      fresh();
      const s = await scenario({ own: ['owner'] });
      await s.setRaw('own', s.addr('a'));
      await s.put('own', s.addr('x'));
      await s.d.runForProperty(s.p);
      expect(s.sentTo().sort()).toEqual(
        [
          [s.addr('x'), 'self'],
          [s.addr('a'), 'previous'],
        ].sort(),
      );
    });

    it('T23 + EM-04: the sole owner REMOVES their address – the old address still gets previous; done', async () => {
      fresh();
      const s = await scenario({ own: ['owner'] });
      await s.setRaw('own', s.addr('a'));
      await s.put('own', null);
      const st = await s.d.runForProperty(s.p);
      expect(st).toMatchObject({ sent: 1, done: 1, dead: 0 });
      expect(s.sentTo()).toEqual([[s.addr('a'), 'previous']]);
      expect((await s.changes())[0]!.old_email).toBeNull();
    });

    it('T24 + EM-04: the adapter refuses the new address X – previous still reaches A; RECIPIENT_SKIPPED', async () => {
      fresh();
      const s = await scenario({ own: ['owner'] });
      await s.setRaw('own', s.addr('a'));
      await s.put('own', s.addr('x'));
      s.adapter.failWith = (m) =>
        m.to === s.addr('x') ? new IntegrationError('INVALID_REQUEST', 'refused') : null;
      const st = await s.d.runForProperty(s.p);
      expect(st).toMatchObject({ sent: 1, done: 1 });
      expect(s.sentTo()).toEqual([[s.addr('a'), 'previous']]);
      const [r] = await s.rows();
      expect(r!.status).toBe('done');
      expect(r!.last_error).toBe('RECIPIENT_SKIPPED');
    });

    it('nobody to tell (no address before or after) → dead NO_RECIPIENT, change row still closed', async () => {
      fresh();
      const s = await scenario({ fd: ['front_desk'] });
      // an e-mail is set then removed by SQL before the worker: no self, previous NULL, no owner
      await s.put('fd', s.addr('fd'));
      await s.setRaw('fd', null);
      await db.withContext(s.t.ctx(), (tx) =>
        tx.query('UPDATE user_email_change SET old_email = NULL'),
      );
      const st = await s.d.runForProperty(s.p);
      expect(st).toMatchObject({ dead: 1 });
      expect((await s.rows())[0]!.last_error).toBe('NO_RECIPIENT');
      expect((await s.changes())[0]!.old_notified_at).not.toBeNull();
    });
  },
);
