/**
 * US-143 / SR-AUTH-06 on Nest/Fastify + PostgreSQL – the SEC mandatory cases (round-03 SEC s1 A.7) that live on
 * the server: 1–13 and 15 (14 = US-164 – BE-A, 16 = Playwright – FE-A/QA). Each block uses its own users
 * (TOTP anti-replay is per user) and moves the shared FixedClock only forward inside a block.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { PasswordReauth } from '../../src/modules/identity/public/password-reauth';
import {
  base32Decode,
  base32Encode,
  totpAt,
  totpStep,
} from '../../src/modules/identity/public/totp';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { CryptoService } from '../../src/modules/crypto/public/crypto.service';
import { resetMfaByOperator } from '../../src/modules/identity/public/operator-reset';
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

type Res = Awaited<ReturnType<Client['get']>>;

describe.skipIf(!HAS_DB)('US-143 two-step login, recovery codes, S2 (SEC A.7)', () => {
  let db: Database;
  let fa: FeatureApp;
  let enforced: FeatureApp;
  let t: TestTenant;
  const secrets = new Map<string, Buffer>();
  const codes = new Map<string, string[]>();
  const issuedTokens: string[] = [];

  const USERS = {
    own: ['owner'],
    own2: ['owner'],
    mgr: ['manager'],
    mgr2: ['manager'],
    mgr3: ['manager'],
    fd: ['front_desk'],
    fdv: ['front_desk'],
    lock: ['manager'],
    rec: ['manager'],
    rep: ['manager'],
    tok: ['manager'],
    s2: ['manager'],
    setup: ['front_desk_lead'],
    resetme: ['manager'],
    op: ['owner'],
    cp: ['manager'],
  };

  beforeAll(async () => {
    db = appDatabase(12);
    t = await createTenant(db, { users: USERS });
    await seedSprint1Params(db, t);
    for (const u of Object.keys(USERS)) await setPassword(db, t, u);
    fa = await startFeatureApp(db);
    enforced = await startFeatureApp(db, { mfaEnforced: true });
  });
  afterAll(async () => {
    await fa?.close();
    await enforced?.close();
    await db.close();
  });

  const login = (app: FeatureApp, user: string, password = TEST_PASSWORD) =>
    app.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t.users[user]!.username, password },
    });
  const loginMfa = (app: FeatureApp, body: Record<string, unknown>) =>
    app.app.inject({ method: 'POST', url: '/v1/auth/login/mfa', payload: body });
  const code = (user: string, app: FeatureApp = fa, d = 0) =>
    totpAt(secrets.get(user)!, totpStep(app.clock.now()) + d);
  const step = (app: FeatureApp = fa) => app.clock.advance(30_000);
  const strip = (r: Res) => ({ ...r.json(), requestId: undefined });

  /** Full enrolment through the API: login → setup → confirm. Returns the new full session client. */
  async function enroll(user: string, app: FeatureApp = fa): Promise<Client> {
    const res = await login(app, user);
    expect(res.statusCode).toBe(200);
    const c = new Client(app, cookieValue(res, 'ottimo_sid')!);
    const setup = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    expect(setup.statusCode).toBe(200);
    expect(setup.headers['cache-control']).toBe('no-store');
    const uri = new URL(setup.json().otpauthUri.replace('otpauth://', 'https://'));
    secrets.set(user, base32Decode(uri.searchParams.get('secret')!));
    const conf = await c.send('POST', '/v1/me/2fa/confirm', { totpCode: code(user, app) });
    expect(conf.statusCode).toBe(200);
    expect(conf.headers['cache-control']).toBe('no-store');
    codes.set(user, conf.json().recoveryCodes);
    const fresh = new Client(app, cookieValue(conf, 'ottimo_sid')!);
    expect(fresh.token).not.toBe(c.token);
    expect((await c.get('/v1/me')).statusCode).toBe(401); // every other session revoked (06.10)
    return fresh;
  }

  async function mfaToken(app: FeatureApp, user: string): Promise<string> {
    const res = await login(app, user);
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('MFA_REQUIRED');
    expect(res.headers['set-cookie']).toBeUndefined();
    issuedTokens.push(res.json().mfaToken as string);
    return res.json().mfaToken as string;
  }

  const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    db.withContext(t.ctx(), (tx) => tx.query<R>(sql, params));

  it('case 1+2: password alone gives no session; mfaToken is no cookie; TOTP → new session, amr = totp', async () => {
    fa.clock.set(T0);
    const owner = await enroll('own');
    step();
    const token = await mfaToken(fa, 'own');
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await new Client(fa, token).get('/v1/me')).statusCode).toBe(401);
    // only the SHA-256 is stored
    const stored = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM mfa_login_challenge WHERE token_hash IN ($1, $2)`,
      [token, sha256Hex(token)],
    );
    expect(stored.rows[0]!.n).toBe(1);
    const ok = await loginMfa(fa, { mfaToken: token, totpCode: code('own') });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ mfaEnabled: true, mfaEnrollmentRequired: false });
    const sid = cookieValue(ok, 'ottimo_sid')!;
    expect(sid).not.toBe(owner.token);
    const s = await q<{ amr: string; mfa_at: Date | null }>(
      `SELECT amr, mfa_at FROM user_session WHERE id = $1`,
      [sha256Hex(sid)],
    );
    expect(s.rows[0]).toMatchObject({ amr: 'totp' });
    expect(s.rows[0]!.mfa_at).not.toBeNull();
    // Me (R3-Q38): business date + rollover per property
    const me = await new Client(fa, sid).get('/v1/me');
    expect(me.json().properties[0]).toMatchObject({
      businessDate: '2026-10-15',
      businessDayRollover: '06:00',
    });
    expect(me.json().soleOwner).toBe(false); // own2 exists
  });

  it('case 3: step +2 refused; case 4: same code twice (sequential and parallel) → second 401 MFA_INVALID', async () => {
    fa.clock.set(new Date(T0.getTime() + 3600_000));
    await enroll('mgr');
    step();
    const t1 = await mfaToken(fa, 'mgr');
    expect((await loginMfa(fa, { mfaToken: t1, totpCode: code('mgr', fa, 2) })).statusCode).toBe(
      401,
    );
    const c = code('mgr');
    expect((await loginMfa(fa, { mfaToken: t1, totpCode: c })).statusCode).toBe(200);
    const t2 = await mfaToken(fa, 'mgr');
    const again = await loginMfa(fa, { mfaToken: t2, totpCode: c });
    expect(again.statusCode).toBe(401);
    expect(again.json().code).toBe('MFA_INVALID');
    step();
    const [a, b] = [await mfaToken(fa, 'mgr'), await mfaToken(fa, 'mgr')];
    const same = code('mgr');
    const both = await Promise.all([
      loginMfa(fa, { mfaToken: a, totpCode: same }),
      loginMfa(fa, { mfaToken: b, totpCode: same }),
    ]);
    expect(both.map((r) => r.statusCode).sort()).toEqual([200, 401]);
  });

  it('case 5: token single use, 5-minute life, 5 failures kill it', async () => {
    fa.clock.set(new Date(T0.getTime() + 2 * 3600_000));
    await enroll('tok');
    step();
    const used = await mfaToken(fa, 'tok');
    expect((await loginMfa(fa, { mfaToken: used, totpCode: code('tok') })).statusCode).toBe(200);
    step();
    expect((await loginMfa(fa, { mfaToken: used, totpCode: code('tok') })).statusCode).toBe(401);
    const old = await mfaToken(fa, 'tok');
    fa.clock.advance(5 * 60_000 + 1000);
    expect((await loginMfa(fa, { mfaToken: old, totpCode: code('tok') })).statusCode).toBe(401);
    const dead = await mfaToken(fa, 'tok');
    for (let i = 0; i < 4; i++) {
      expect((await loginMfa(fa, { mfaToken: dead, totpCode: '000000' })).statusCode).toBe(401);
    }
    // the 5th failure is also the 5th of the login counter → temporary lock: reset it to look at the token alone
    expect((await loginMfa(fa, { mfaToken: dead, totpCode: '000001' })).statusCode).toBe(401);
    await q(
      `UPDATE app_user SET failed_login_count = 0, locked_until = NULL, lock_count_24h = 0 WHERE id = $1`,
      [t.users.tok!.id],
    );
    step();
    expect((await loginMfa(fa, { mfaToken: dead, totpCode: code('tok') })).statusCode).toBe(401);
  });

  it('case 6: 5 wrong TOTP → temporary lock (429), live session kept, security_alert; 3rd lock → hard lock', async () => {
    fa.clock.set(new Date(T0.getTime() + 3 * 3600_000));
    await enroll('lock');
    for (let lockNo = 1; lockNo <= 3; lockNo++) {
      const tk = await mfaToken(fa, 'lock');
      for (let i = 0; i < 5; i++) {
        const r = await loginMfa(fa, { mfaToken: tk, totpCode: '999999' });
        expect(r.statusCode).toBe(401);
      }
      const locked = await login(fa, 'lock');
      if (lockNo < 3) {
        expect(locked.statusCode).toBe(429);
        fa.clock.advance(16 * 60_000);
      } else {
        expect(locked.statusCode).toBe(401); // hard lock: generic 401
      }
    }
    const u = await q<{ status: string }>(`SELECT status FROM app_user WHERE id = $1`, [
      t.users.lock!.id,
    ]);
    expect(u.rows[0]!.status).toBe('locked');
    const alerts = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM staff_notification WHERE kind = 'security_alert' AND ref_id = $1
          AND user_id IN ($1, $2)`,
      [t.users.lock!.id, t.users.own!.id],
    );
    expect(alerts.rows[0]!.n).toBeGreaterThanOrEqual(2);
    const audit = await q<{ action: string }>(
      `SELECT DISTINCT action FROM audit_event WHERE entity_id = $1 AND action LIKE 'mfa.%'`,
      [t.users.lock!.id],
    );
    expect(audit.rows.map((r) => r.action)).toEqual(
      expect.arrayContaining(['mfa.locked', 'mfa.verify_failed']),
    );
  });

  it('case 6 (b): a lock does not end the live session of the person (SR-AUTH-04)', async () => {
    fa.clock.set(new Date(T0.getTime() + 4 * 3600_000));
    const live = await enroll('mgr3');
    const tk = await mfaToken(fa, 'mgr3');
    for (let i = 0; i < 5; i++) await loginMfa(fa, { mfaToken: tk, totpCode: '999999' });
    expect((await login(fa, 'mgr3')).statusCode).toBe(429);
    expect((await live.get('/v1/me')).statusCode).toBe(200);
  });

  it('case 7: identical bodies for expired / used / wrong / replayed / bad recovery code / unknown token', async () => {
    fa.clock.set(new Date(T0.getTime() + 5 * 3600_000));
    await enroll('rep');
    step();
    const bodies: unknown[] = [];
    const used = await mfaToken(fa, 'rep');
    const c1 = code('rep');
    expect((await loginMfa(fa, { mfaToken: used, totpCode: c1 })).statusCode).toBe(200);
    bodies.push(strip(await loginMfa(fa, { mfaToken: used, totpCode: c1 }))); // used token
    const t2 = await mfaToken(fa, 'rep');
    bodies.push(strip(await loginMfa(fa, { mfaToken: t2, totpCode: c1 }))); // replayed code
    bodies.push(strip(await loginMfa(fa, { mfaToken: t2, totpCode: '123456' }))); // wrong code
    bodies.push(strip(await loginMfa(fa, { mfaToken: t2, recoveryCode: 'AAAA-BBBB-CCCC-DDDD' })));
    bodies.push(strip(await loginMfa(fa, { mfaToken: 'x'.repeat(43), totpCode: '123456' })));
    const t3 = await mfaToken(fa, 'rep');
    fa.clock.advance(6 * 60_000);
    bodies.push(strip(await loginMfa(fa, { mfaToken: t3, totpCode: code('rep') }))); // expired
    for (const b of bodies) expect(b).toEqual(bodies[0]);
    expect(bodies[0]).toMatchObject({ status: 401, code: 'MFA_INVALID' });
    expect(JSON.stringify(bodies[0])).not.toMatch(/token|expired|used/i);
    // both factors / none → 422, not counted
    const t4 = await mfaToken(fa, 'rep');
    expect((await loginMfa(fa, { mfaToken: t4 })).statusCode).toBe(422);
    expect(
      (
        await loginMfa(fa, {
          mfaToken: t4,
          totpCode: '123456',
          recoveryCode: 'AAAA-BBBB-CCCC-DDDD',
        })
      ).statusCode,
    ).toBe(422);
  });

  it('case 8: recovery code once; parallel same code → one success; audit + notification + email; ≤ 3 → low', async () => {
    fa.clock.set(new Date(T0.getTime() + 6 * 3600_000));
    await enroll('rec');
    const rc = codes.get('rec')!;
    const t1 = await mfaToken(fa, 'rec');
    const ok = await loginMfa(fa, {
      mfaToken: t1,
      recoveryCode: rc[0]!.toLowerCase().replace(/-/g, ' '),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().recoveryCodesLow).toBe(false);
    const t2 = await mfaToken(fa, 'rec');
    expect((await loginMfa(fa, { mfaToken: t2, recoveryCode: rc[0] })).statusCode).toBe(401);
    const [a, b] = [await mfaToken(fa, 'rec'), await mfaToken(fa, 'rec')];
    const par = await Promise.all([
      loginMfa(fa, { mfaToken: a, recoveryCode: rc[1] }),
      loginMfa(fa, { mfaToken: b, recoveryCode: rc[1] }),
    ]);
    expect(par.map((r) => r.statusCode).sort()).toEqual([200, 401]);
    const audit = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event WHERE entity_id = $1 AND action = 'mfa.recovery_code_used'`,
      [t.users.rec!.id],
    );
    expect(audit.rows[0]!.n).toBe(2);
    const notes = await q<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM staff_notification
        WHERE kind = 'account_security_change' AND ref_id = $1 AND ref_code = 'mfa.recovery_code_used'`,
      [t.users.rec!.id],
    );
    expect(notes.rows.map((r) => r.user_id)).toEqual(
      expect.arrayContaining([t.users.rec!.id, t.users.own!.id, t.users.own2!.id]),
    );
    const mail = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'staff.email'
          AND payload->>'template' = 'mfa_recovery_code_used' AND payload->'userIds' ? $1`,
      [t.users.rec!.id],
    );
    expect(mail.rows[0]!.n).toBe(2);
    // use 5 more → 3 left → recoveryCodesLow
    let last: Res | undefined;
    for (const c of rc.slice(2, 7)) {
      last = await loginMfa(fa, { mfaToken: await mfaToken(fa, 'rec'), recoveryCode: c });
      expect(last.statusCode).toBe(200);
    }
    expect(last!.json().recoveryCodesLow).toBe(true);
  });

  it('case 9: MFA_ENFORCED – manager without 2FA gets the restricted session; enrolment → full access', async () => {
    enforced.clock.set(new Date(T0.getTime() + 7 * 3600_000));
    const res = await login(enforced, 'mgr2');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ mfaEnrollmentRequired: true, mfaEnabled: false });
    const c = new Client(enforced, cookieValue(res, 'ottimo_sid')!);
    expect((await c.get('/v1/me')).statusCode).toBe(200);
    expect((await c.get('/v1/me/2fa')).json()).toMatchObject({
      enabled: false,
      required: true,
      enforced: true,
    });
    const blocked = await c.get(`${P(t)}/guests?q=ab`);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(
      (await c.send('POST', '/v1/me/password', { currentPassword: 'x', newPassword: 'y' })).json()
        .code,
    ).toBe('MFA_ENROLLMENT_REQUIRED');
    // a session opened before the flag (preset tenant session) is restricted too
    const old = await Client.of(enforced, t, 'mgr2').get(`${P(t)}/guests?q=ab`);
    expect(old.json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    const full = await enroll('mgr2', enforced);
    expect((await full.get('/v1/me')).json().mfaEnrollmentRequired).toBe(false);
    expect((await full.get(`${P(t)}/guests?q=ab`)).statusCode).toBe(200);
    // front desk is not concerned
    const fdRes = await login(enforced, 'fd');
    expect(fdRes.json().mfaEnrollmentRequired).toBe(false);
  });

  it('case 10: mandatory role cannot disable (403); voluntary FD disables with S2 and every session ends', async () => {
    fa.clock.set(new Date(T0.getTime() + 8 * 3600_000));
    const own = await enroll('own2');
    step();
    const r = await own.send('DELETE', '/v1/me/2fa', {
      password: TEST_PASSWORD,
      totpCode: code('own2'),
    });
    expect(r.statusCode).toBe(403);
    const fd = await enroll('fdv');
    step();
    const noFactor = await fd.send('DELETE', '/v1/me/2fa', { password: TEST_PASSWORD });
    expect(noFactor.statusCode).toBe(422);
    expect(noFactor.json().errors[0]).toMatchObject({ code: 'STRONG_REAUTH_REQUIRED' });
    const off = await fd.send('DELETE', '/v1/me/2fa', {
      password: TEST_PASSWORD,
      totpCode: code('fdv'),
    });
    expect(off.statusCode).toBe(204);
    expect((await fd.get('/v1/me')).statusCode).toBe(401);
    const row = await q<{
      mfa_enabled: boolean;
      mfa_secret_enc: Buffer | null;
      h: string[] | null;
    }>(
      `SELECT mfa_enabled, mfa_secret_enc, mfa_recovery_codes_hash AS h FROM app_user WHERE id = $1`,
      [t.users.fdv!.id],
    );
    expect(row.rows[0]).toEqual({ mfa_enabled: false, mfa_secret_enc: null, h: null });
    expect((await login(fa, 'fdv')).statusCode).toBe(200); // no second step any more
  });

  it('case 11: S2 – missing factor 422, wrong factor 401, replayed TOTP 401, right → codes regenerated', async () => {
    fa.clock.set(new Date(T0.getTime() + 9 * 3600_000));
    const c = await enroll('s2');
    step();
    const url = '/v1/me/2fa/recovery-codes';
    const missing = await c.send('POST', url, { password: TEST_PASSWORD });
    expect(missing.statusCode).toBe(422);
    expect(missing.json().errors[0].code).toBe('STRONG_REAUTH_REQUIRED');
    const wrongPw = await c.send('POST', url, {
      password: 'Wrong-pass-2026',
      totpCode: code('s2'),
    });
    expect(wrongPw.statusCode).toBe(401);
    expect(wrongPw.json().code).toBe('REAUTH_FAILED');
    const good = code('s2');
    const ok = await c.send('POST', url, { password: TEST_PASSWORD, totpCode: good });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().recoveryCodes).toHaveLength(10);
    expect(ok.headers['cache-control']).toBe('no-store');
    const replay = await c.send('POST', url, { password: TEST_PASSWORD, totpCode: good });
    expect(replay.statusCode).toBe(401);
    // old set is dead, new set works
    const t1 = await mfaToken(fa, 's2');
    expect(
      (await loginMfa(fa, { mfaToken: t1, recoveryCode: codes.get('s2')![0] })).statusCode,
    ).toBe(401);
    const t2 = await mfaToken(fa, 's2');
    expect(
      (await loginMfa(fa, { mfaToken: t2, recoveryCode: ok.json().recoveryCodes[0] })).statusCode,
    ).toBe(200);
    const audit = await q<{ action: string; after: Record<string, unknown> }>(
      `SELECT action, after FROM audit_event WHERE entity_id = $1 AND action LIKE 'stepup.%' ORDER BY occurred_at`,
      [t.users.s2!.id],
    );
    expect(audit.rows.map((r) => r.action)).toContain('stepup.s2_granted');
    expect(audit.rows.find((r) => r.action === 'stepup.s2_granted')!.after).toMatchObject({
      operationId: 'regenerateMyRecoveryCodes',
      method: 'totp',
    });
  });

  it('case 13: setup again issues a NEW secret – the old QR no longer confirms; no Idempotency replay', async () => {
    fa.clock.set(new Date(T0.getTime() + 10 * 3600_000));
    const res = await login(fa, 'setup');
    const c = new Client(fa, cookieValue(res, 'ottimo_sid')!);
    const key = { 'idempotency-key': '0192a1b0-0000-7000-8000-00000000abcd' };
    const a = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD }, key);
    const b = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD }, key);
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);
    expect(a.json().otpauthUri).not.toBe(b.json().otpauthUri);
    const secretOf = (r: Res) =>
      base32Decode(
        new URL(r.json().otpauthUri.replace('otpauth://', 'https://')).searchParams.get('secret')!,
      );
    const oldCode = totpAt(secretOf(a), totpStep(fa.clock.now()));
    const wrong = await c.send('POST', '/v1/me/2fa/confirm', { totpCode: oldCode });
    expect(wrong.statusCode).toBe(422);
    expect((await c.get('/v1/me/2fa')).json()).toMatchObject({
      enabled: false,
      pendingSetup: true,
    });
    const ok = await c.send('POST', '/v1/me/2fa/confirm', {
      totpCode: totpAt(secretOf(b), totpStep(fa.clock.now())),
    });
    expect(ok.statusCode).toBe(200);
    const fresh = new Client(fa, cookieValue(ok, 'ottimo_sid')!);
    expect(
      (await fresh.send('POST', '/v1/me/2fa/confirm', { totpCode: '123456' })).statusCode,
    ).toBe(409);
    expect(
      (await fresh.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD })).statusCode,
    ).toBe(409);
    const idem = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM idempotency_key WHERE key = $1`,
      ['0192a1b0-0000-7000-8000-00000000abcd'],
    );
    expect(idem.rows[0]!.n).toBe(0);
    const c3 = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM c3_access_log WHERE subject_type = 'mfa_secret' AND subject_id = $1 AND action = 'create'`,
      [t.users.setup!.id],
    );
    expect(c3.rows[0]!.n).toBe(3); // 2 setups + the recovery codes of the confirm
    // the first pending DEK was destroyed (crypto-shredding)
    const keys = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ live: number; dead: number }>(
        `SELECT count(*) FILTER (WHERE destroyed_at IS NULL)::int AS live,
                count(*) FILTER (WHERE destroyed_at IS NOT NULL)::int AS dead
           FROM data_key WHERE purpose = 'mfa_secret' AND subject_id = $1`,
        [t.users.setup!.id],
      ),
    );
    expect(keys.rows[0]).toEqual({ live: 1, dead: 1 });
  });

  it('resetUser2fa (SEC 06.32): owner resets another user; self → 422; not enabled → 409; manager → 403', async () => {
    fa.clock.set(new Date(T0.getTime() + 11 * 3600_000));
    const own = await enroll('op');
    const target = await enroll('resetme');
    step();
    const url = (id: string) => `/v1/users/${id}/2fa/actions/reset`;
    const self = await own.send('POST', url(t.users.op!.id), {
      reauth: { password: TEST_PASSWORD, totpCode: code('op') },
      reason: 'test self',
    });
    expect(self.statusCode).toBe(422);
    const mgr = await Client.of(fa, t, 'fd').send('POST', url(t.users.resetme!.id), {
      reauth: { password: TEST_PASSWORD },
      reason: 'not owner',
    });
    expect(mgr.statusCode).toBe(403);
    const ok = await own.send('POST', url(t.users.resetme!.id), {
      reauth: { password: TEST_PASSWORD, totpCode: code('op') },
      reason: 'lost phone',
    });
    expect(ok.statusCode).toBe(204);
    expect((await target.get('/v1/me')).statusCode).toBe(401);
    step();
    const again = await own.send('POST', url(t.users.resetme!.id), {
      reauth: { password: TEST_PASSWORD, totpCode: code('op') },
      reason: 'again',
    });
    expect(again.statusCode).toBe(409);
    const audit = await q<{ reason: string; actor: string }>(
      `SELECT reason, actor_user_id AS actor FROM audit_event WHERE entity_id = $1 AND action = 'mfa.reset_by_owner'`,
      [t.users.resetme!.id],
    );
    expect(audit.rows).toEqual([{ reason: 'lost phone', actor: t.users.op!.id }]);
    // next sign-in of the manager: no second step (2FA gone); with MFA_ENFORCED → restricted again
    expect((await login(fa, 'resetme')).statusCode).toBe(200);
    expect((await login(enforced, 'resetme')).json().mfaEnrollmentRequired).toBe(true);
  });

  it('S2 on changeMyPassword (SEC 06.25): 2FA user without factor → 422, wrong → 401, with TOTP → 204', async () => {
    fa.clock.set(new Date(T0.getTime() + 14 * 3600_000));
    const c = await enroll('cp');
    step();
    const body = { currentPassword: TEST_PASSWORD, newPassword: 'Another-fake-pass-77' };
    const missing = await c.send('POST', '/v1/me/password', body);
    expect(missing.statusCode).toBe(422);
    expect(missing.json().errors[0]).toEqual({ field: 'totpCode', code: 'STRONG_REAUTH_REQUIRED' });
    const wrong = await c.send('POST', '/v1/me/password', { ...body, totpCode: code('cp', fa, 3) });
    expect(wrong.statusCode).toBe(401);
    expect(wrong.json().errors[0]).toMatchObject({
      field: 'currentPassword',
      code: 'REAUTH_FAILED',
    });
    const ok = await c.send('POST', '/v1/me/password', { ...body, totpCode: code('cp') });
    expect(ok.statusCode).toBe(204);
    await setPassword(db, t, 'cp');
  });

  it('case 15: an approver with 2FA confirming with a password alone → the same 401 REAUTH_FAILED', async () => {
    const reauth = fa.app.get(PasswordReauth);
    await expect(
      reauth.verifyApprover(
        { ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' },
        { username: t.users.mgr!.username, password: TEST_PASSWORD },
        {
          field: 'lateFeeInsteadOfNight.secret',
          purpose: 'late_fee_as_night',
          roles: ['manager', 'owner'],
        },
      ),
    ).rejects.toMatchObject({ code: 'REAUTH_FAILED' });
  });

  it('case 12: no TOTP code, recovery code, mfaToken, secret or otpauth URI in audit, outbox, idempotency, notifications', async () => {
    const needles: string[] = ['otpauth', 'OTTIMO%3A'];
    for (const [, s] of secrets) needles.push(s.toString('hex'), base32Encode(s));
    for (const [, list] of codes) for (const c of list) needles.push(c, c.replace(/-/g, ''));
    needles.push(...issuedTokens);
    expect(issuedTokens.length).toBeGreaterThan(10);
    const dump = await q<{ j: string }>(
      `SELECT coalesce(json_agg(x)::text, '') AS j FROM (
         SELECT before::text || after::text || coalesce(reason, '') AS x FROM audit_event WHERE organization_id = $1
         UNION ALL SELECT payload::text FROM outbox_message WHERE organization_id = $1
         UNION ALL SELECT coalesce(request_hash, '') || coalesce(response_body::text, '') FROM idempotency_key
          WHERE organization_id = $1
         UNION ALL SELECT coalesce(ref_code, '') FROM staff_notification WHERE organization_id = $1) s`,
      [t.organizationId],
    );
    const text = dump.rows[0]!.j;
    expect(text.length).toBeGreaterThan(100);
    for (const n of needles) expect(text.includes(n), n.slice(0, 6)).toBe(false);
  });

  it('operator reset command (06.33): no endpoint; clears 2FA + codes, revokes sessions, audit + email', async () => {
    fa.clock.set(new Date(T0.getTime() + 13 * 3600_000));
    const before = await q<{ mfa_enabled: boolean }>(
      `SELECT mfa_enabled FROM app_user WHERE id = $1`,
      [t.users.op!.id],
    );
    expect(before.rows[0]!.mfa_enabled).toBe(true);
    const out = await resetMfaByOperator(db, {
      username: t.users.op!.username,
      operator: 'ops.test',
      ticketRef: 'VER-TEST-1',
      reason: 'lost phone and codes (test)',
      clock: fa.clock,
      crypto: fa.app.get(CryptoService),
    });
    expect(out).toMatchObject({ reset: true });
    const after = await q<{ mfa_enabled: boolean; h: string[] | null; live: number }>(
      `SELECT u.mfa_enabled, u.mfa_recovery_codes_hash AS h,
              (SELECT count(*)::int FROM user_session s WHERE s.user_id = u.id AND s.revoked_at IS NULL) AS live
         FROM app_user u WHERE u.id = $1`,
      [t.users.op!.id],
    );
    expect(after.rows[0]).toEqual({ mfa_enabled: false, h: null, live: 0 });
    const audit = await q<{ after: Record<string, unknown>; actor_type: string }>(
      `SELECT after, actor_type FROM audit_event WHERE entity_id = $1 AND action = 'mfa.reset_by_operator'`,
      [t.users.op!.id],
    );
    expect(audit.rows[0]).toMatchObject({
      actor_type: 'system',
      after: { ticketRef: 'VER-TEST-1' },
    });
    const mail = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'staff.email'
          AND payload->>'template' = 'mfa_reset_by_operator' AND payload->'userIds' ? $1`,
      [t.users.op!.id],
    );
    expect(mail.rows[0]!.n).toBe(1);
    await expect(
      resetMfaByOperator(db, {
        username: 'nobody.here',
        operator: 'ops.test',
        ticketRef: 'VER-TEST-2',
        reason: 'x',
        clock: fa.clock,
        crypto: fa.app.get(CryptoService),
      }),
    ).rejects.toThrow(/not found/);
  });
});
