/**
 * US-143 / SR-AUTH-06 on Nest/Fastify + PostgreSQL – the SEC mandatory cases (round-03 SEC s1 A.7) that live on
 * the server: 1–13 and 15 (14 = US-164 – BE-A, 16 = Playwright – FE-A/QA). Each block uses its own users
 * (TOTP anti-replay is per user) and moves the shared FixedClock only forward inside a block.
 */
import { Writable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { PasswordReauth } from '../../src/modules/identity/public/password-reauth';
import { SessionService } from '../../src/modules/identity/public/session.service';
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
    gate: ['owner'],
    promo: ['front_desk'],
    newmgr: ['manager'],
    own4: ['owner'],
    half: ['manager'],
    re: ['front_desk_lead'],
    lg: ['front_desk_lead'],
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
    // SEC condition (a)/(b): the 422 comes before the password check – same answer with a wrong password
    const missingWrong = await c.send('POST', url, { password: 'Wrong-pass-2026' });
    expect(missingWrong.statusCode).toBe(422);
    expect({ ...missingWrong.json(), requestId: undefined }).toEqual({
      ...missing.json(),
      requestId: undefined,
    });
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
    // FB-R3-SEC-BEC-06: the new session records the second factor of the S2
    const s = await q<{ amr: string; mfa_at: Date | null }>(
      `SELECT amr, mfa_at FROM user_session WHERE id = $1`,
      [sha256Hex(cookieValue(ok, 'ottimo_sid')!)],
    );
    expect(s.rows[0]!.amr).toBe('totp');
    expect(s.rows[0]!.mfa_at).not.toBeNull();
    await setPassword(db, t, 'cp');
  });

  it('case 11 (gate): S2 on createUser / setUserRoles to manager / updateUser status / revokeTrustedDevice', async () => {
    fa.clock.set(new Date(T0.getTime() + 15 * 3600_000));
    const own = await enroll('gate');
    step();
    const promo = t.users.promo!;
    const toMgr = { roles: [{ propertyId: t.propertyIds[0], role: 'manager' }] };
    const pwOnly = await own.send(
      'PUT',
      `/v1/users/${promo.id}/roles`,
      { ...toMgr, reauth: { password: TEST_PASSWORD } },
      { 'if-match': '"1"' },
    );
    expect(pwOnly.statusCode).toBe(422);
    expect(pwOnly.json().errors[0]).toEqual({
      field: 'reauth.totpCode',
      code: 'STRONG_REAUTH_REQUIRED',
    });
    const good = code('gate');
    const ok = await own.send(
      'PUT',
      `/v1/users/${promo.id}/roles`,
      { ...toMgr, reauth: { password: TEST_PASSWORD, totpCode: good } },
      { 'if-match': '"1"' },
    );
    expect(ok.statusCode).toBe(200);
    // the same proof cannot serve another operation (anti-replay)
    const reuse = await own.send('POST', '/v1/users', {
      username: `s2.${Date.now()}`,
      displayName: 'Người mới',
      initialPassword: 'Fake-initial-pass-1',
      roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }],
      reauth: { password: TEST_PASSWORD, totpCode: good },
    });
    expect(reuse.statusCode).toBe(401);
    expect(reuse.json().code).toBe('REAUTH_FAILED');
    const none = await own.send('POST', '/v1/users', {
      username: `s2b.${Date.now()}`,
      displayName: 'Người mới',
      initialPassword: 'Fake-initial-pass-1',
      roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }],
    });
    expect(none.statusCode).toBe(422);
    expect(none.json().errors[0]).toEqual({ field: 'reauth', code: 'STRONG_REAUTH_REQUIRED' });
    // display name alone: no S2
    const rename = await own.send(
      'PATCH',
      `/v1/users/${promo.id}`,
      { displayName: 'Lễ tân Mới' },
      { 'if-match': `"${ok.json().version}"` },
    );
    expect(rename.statusCode).toBe(200);
    const revoke = await own.send(
      'POST',
      `${P(t)}/trusted-devices/0192a1b0-0000-7000-8000-000000000999/actions/revoke`,
      {},
    );
    expect(revoke.statusCode).toBe(422);
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

  it('FB-R3-SEC-BEC-01: MFA_ENFORCED + temporary password – change the password first, then enrol, then work', async () => {
    enforced.clock.set(new Date(T0.getTime() + 16 * 3600_000));
    await q(`UPDATE app_user SET must_change_password = true WHERE id = $1`, [t.users.newmgr!.id]);
    const res = await login(enforced, 'newmgr');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ mustChangePassword: true, mfaEnrollmentRequired: true });
    const c = new Client(enforced, cookieValue(res, 'ottimo_sid')!);
    const early = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    expect(early.json().code).toBe('PASSWORD_CHANGE_REQUIRED');
    const newPw = 'Another-fake-pass-88';
    const changed = await c.send('POST', '/v1/me/password', {
      currentPassword: TEST_PASSWORD,
      newPassword: newPw,
    });
    expect(changed.statusCode).toBe(204);
    const c2 = new Client(enforced, cookieValue(changed, 'ottimo_sid')!);
    const me = (await c2.get('/v1/me')).json();
    expect(me).toMatchObject({ mustChangePassword: false, mfaEnrollmentRequired: true });
    // the new session is still restricted
    expect((await c2.get(`${P(t)}/guests?q=ab`)).json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    const setup = await c2.send('POST', '/v1/me/2fa/setup', { currentPassword: newPw });
    expect(setup.statusCode).toBe(200);
    const secret = base32Decode(
      new URL(setup.json().otpauthUri.replace('otpauth://', 'https://')).searchParams.get(
        'secret',
      )!,
    );
    secrets.set('newmgr', secret);
    const conf = await c2.send('POST', '/v1/me/2fa/confirm', {
      totpCode: totpAt(secret, totpStep(enforced.clock.now())),
    });
    expect(conf.statusCode).toBe(200);
    codes.set('newmgr', conf.json().recoveryCodes);
    const full = new Client(enforced, cookieValue(conf, 'ottimo_sid')!);
    expect((await full.get(`${P(t)}/guests?q=ab`)).statusCode).toBe(200);
    await setPassword(db, t, 'newmgr');
  });

  it('FB-R3-SEC-BEC-03: a password reset kills a pending mfaToken (login half-way)', async () => {
    fa.clock.set(new Date(T0.getTime() + 17 * 3600_000));
    await enroll('half');
    step();
    const pending = await mfaToken(fa, 'half');
    await db.withContext(t.ctx(), async (tx) => {
      // same effect as updateUser.resetPassword / disable / role change: SessionService.revokeAll
      await fa.app.get(SessionService).revokeAll(tx, t.users.half!.id, 'password_reset');
    });
    const r = await loginMfa(fa, { mfaToken: pending, totpCode: code('half') });
    expect(r.statusCode).toBe(401);
    expect(r.json().code).toBe('MFA_INVALID');
  });

  it('FB-R3-SEC-BEC-04 (06.35): owner sees mfaEnabled + codes left of every user, never a secret', async () => {
    fa.clock.set(new Date(T0.getTime() + 17.5 * 3600_000));
    const ownC = await enroll('own4');
    const list = await ownC.get('/v1/users?limit=100');
    expect(list.statusCode).toBe(200);
    const rows = list.json().data as Array<Record<string, unknown>>;
    const rec = rows.find((u) => u.id === t.users.rec!.id)!;
    expect(rec).toMatchObject({ mfaEnabled: true });
    expect(typeof rec.mfaRecoveryCodesRemaining).toBe('number');
    const fd = rows.find((u) => u.id === t.users.fd!.id)!;
    expect(fd).toMatchObject({ mfaEnabled: false });
    expect(fd).not.toHaveProperty('mfaRecoveryCodesRemaining');
    expect(JSON.stringify(rows)).not.toMatch(/mfa_secret|recovery_codes_hash|otpauth/);
    const fdC = new Client(fa, cookieValue(await login(fa, 'fd'), 'ottimo_sid')!);
    expect((await fdC.get('/v1/users')).statusCode).toBe(403);
  });

  it('ARC 12 #2: a user who lost the role at the DEK property still signs in with 2FA', async () => {
    const t2 = await createTenant(db, { properties: 2, users: { mp: ['manager'] } });
    await seedSprint1Params(db, t2);
    await seedSprint1Params(db, t2, 1);
    await db.withContext(t2.ctx(), (tx) =>
      tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
         VALUES ($1, $2, $3, 'manager', $4)`,
        [t2.users.mp!.id, t2.propertyIds[1], t2.organizationId, T0],
      ),
    );
    await setPassword(db, t2, 'mp');
    fa.clock.set(new Date(T0.getTime() + 18 * 3600_000));
    const res = await fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t2.users.mp!.username, password: TEST_PASSWORD },
    });
    const c = new Client(fa, cookieValue(res, 'ottimo_sid')!);
    const setup = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    const secret = base32Decode(
      new URL(setup.json().otpauthUri.replace('otpauth://', 'https://')).searchParams.get(
        'secret',
      )!,
    );
    const conf = await c.send('POST', '/v1/me/2fa/confirm', {
      totpCode: totpAt(secret, totpStep(fa.clock.now())),
    });
    expect(conf.statusCode).toBe(200);
    const keyProp = await db.withContext(t2.ctx(), (tx) =>
      tx.query<{ p: string }>(`SELECT mfa_key_property_id AS p FROM app_user WHERE id = $1`, [
        t2.users.mp!.id,
      ]),
    );
    expect(keyProp.rows[0]!.p).toBe(t2.propertyIds[0]);
    await db.withContext(t2.ctx(), (tx) =>
      tx.query(
        `UPDATE user_property_role SET revoked_at = $3 WHERE user_id = $1 AND property_id = $2`,
        [t2.users.mp!.id, t2.propertyIds[0], T0],
      ),
    );
    step();
    const first = await fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t2.users.mp!.username, password: TEST_PASSWORD },
    });
    expect(first.json().code).toBe('MFA_REQUIRED');
    const ok = await loginMfa(fa, {
      mfaToken: first.json().mfaToken,
      totpCode: totpAt(secret, totpStep(fa.clock.now())),
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().activePropertyId).toBe(t2.propertyIds[1]);
  });

  it('ARC 12 #3: recovery-code session is restricted; re-enrolment replaces secret + codes; totp session → 409', async () => {
    fa.clock.set(new Date(T0.getTime() + 19 * 3600_000));
    await enroll('re');
    const oldSecret = secrets.get('re')!;
    const oldCodes = codes.get('re')!;
    step();
    // QA 1: in through a recovery code → restricted, other APIs 403
    const viaCode = await loginMfa(fa, {
      mfaToken: await mfaToken(fa, 're'),
      recoveryCode: oldCodes[0],
    });
    expect(viaCode.statusCode).toBe(200);
    expect(viaCode.json().mfaEnrollmentRequired).toBe(true);
    const rc = new Client(fa, cookieValue(viaCode, 'ottimo_sid')!);
    expect((await rc.get(`${P(t)}/guests?q=ab`)).json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    expect(
      (await rc.send('POST', '/v1/me/2fa/recovery-codes', { password: TEST_PASSWORD })).json().code,
    ).toBe('MFA_ENROLLMENT_REQUIRED');
    // old secret still works until the new one is confirmed
    const setup = await rc.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    expect(setup.statusCode).toBe(200);
    expect((await rc.get('/v1/me/2fa')).json()).toMatchObject({
      enabled: true,
      pendingSetup: true,
    });
    const newSecret = base32Decode(
      new URL(setup.json().otpauthUri.replace('otpauth://', 'https://')).searchParams.get(
        'secret',
      )!,
    );
    const conf = await rc.send('POST', '/v1/me/2fa/confirm', {
      totpCode: totpAt(newSecret, totpStep(fa.clock.now())),
    });
    expect(conf.statusCode).toBe(200);
    const newCodes = conf.json().recoveryCodes as string[];
    expect(newCodes).toHaveLength(10);
    secrets.set('re', newSecret);
    codes.set('re', newCodes);
    expect((await rc.get('/v1/me')).statusCode).toBe(401); // other sessions revoked
    const fresh = new Client(fa, cookieValue(conf, 'ottimo_sid')!);
    expect((await fresh.get('/v1/me')).json().mfaEnrollmentRequired).toBe(false);
    expect((await fresh.get(`${P(t)}/guests?q=ab`)).statusCode).toBe(200);
    // QA 2: old TOTP and old recovery codes are dead, the new ones work
    step();
    const oldT = await loginMfa(fa, {
      mfaToken: await mfaToken(fa, 're'),
      totpCode: totpAt(oldSecret, totpStep(fa.clock.now())),
    });
    expect(oldT.statusCode).toBe(401);
    const oldR = await loginMfa(fa, {
      mfaToken: await mfaToken(fa, 're'),
      recoveryCode: oldCodes[1],
    });
    expect(oldR.statusCode).toBe(401);
    const newT = await loginMfa(fa, { mfaToken: await mfaToken(fa, 're'), totpCode: code('re') });
    expect(newT.statusCode).toBe(200);
    // QA 3: a session with amr = totp cannot start a setup while 2FA is on
    const totpSession = new Client(fa, cookieValue(newT, 'ottimo_sid')!);
    expect(
      (await totpSession.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD }))
        .statusCode,
    ).toBe(409);
    const audit = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event WHERE entity_id = $1 AND action = 'mfa.reenrolled'`,
      [t.users.re!.id],
    );
    expect(audit.rows[0]!.n).toBe(1);
  });

  it('FB-R3-SEC-BEC-02 (log part) + BEC-05: nothing secret in the request log or the Nest logger output', async () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _enc, cb) {
        lines.push(String(chunk));
        cb();
      },
    });
    const logged = await startFeatureApp(db, { logStream: sink, logLevel: 'trace' });
    const out: string[] = [];
    const origOut = process.stdout.write.bind(process.stdout);
    const origErr = process.stderr.write.bind(process.stderr);
    process.stdout.write = ((s: string | Uint8Array, ...rest: unknown[]) => {
      out.push(String(s));
      return origOut(s as string, ...(rest as []));
    }) as typeof process.stdout.write;
    process.stderr.write = ((s: string | Uint8Array, ...rest: unknown[]) => {
      out.push(String(s));
      return origErr(s as string, ...(rest as []));
    }) as typeof process.stderr.write;
    const local: string[] = [];
    try {
      logged.clock.set(new Date(T0.getTime() + 20 * 3600_000));
      const c = await enroll('lg', logged);
      local.push(base32Encode(secrets.get('lg')!), ...codes.get('lg')!);
      logged.clock.advance(30_000);
      const tk = await mfaToken(logged, 'lg');
      local.push(tk);
      const wrong = await loginMfa(logged, { mfaToken: tk, totpCode: '000000' });
      expect(wrong.statusCode).toBe(401);
      const good = code('lg', logged);
      expect((await loginMfa(logged, { mfaToken: tk, totpCode: good })).statusCode).toBe(200);
      logged.clock.advance(30_000);
      const s2bad = await c.send('POST', '/v1/me/2fa/recovery-codes', {
        password: 'Wrong-pass-2026',
        totpCode: code('lg', logged),
      });
      expect(s2bad.statusCode).toBe(401);
      const s2 = await c.send('POST', '/v1/me/2fa/recovery-codes', {
        password: TEST_PASSWORD,
        totpCode: code('lg', logged),
      });
      expect(s2.statusCode).toBe(200);
      local.push(...(s2.json().recoveryCodes as string[]));
      // malformed body (422) carrying secrets – the validation error must not echo them
      const bad = await logged.app.inject({
        method: 'POST',
        url: '/v1/auth/login/mfa',
        payload: { mfaToken: tk, totpCode: '12', recoveryCode: codes.get('lg')![0], extra: 1 },
      });
      expect(bad.statusCode).toBe(422);
      expect(bad.body).not.toContain(tk);
    } finally {
      process.stdout.write = origOut;
      process.stderr.write = origErr;
      await logged.close();
    }
    const text = lines.join('') + out.join('');
    expect(lines.length).toBeGreaterThan(5); // the request log was captured
    expect(text).toContain('/v1/auth/login/mfa');
    for (const n of [...local, 'otpauth', TEST_PASSWORD]) {
      expect(text.includes(n), n.slice(0, 4)).toBe(false);
    }
    // a 6-digit code could collide with timestamps: look for it as a logged field instead
    expect(text).not.toMatch(
      /"(totpCode|recoveryCode|mfaToken|password|currentPassword)"\s*:\s*"(?!\[)/,
    );
  });

  it('case 12: no TOTP code, recovery code, mfaToken, secret or otpauth URI in audit, outbox, idempotency, notifications', async () => {
    const needles: string[] = ['otpauth', 'OTTIMO%3A'];
    for (const [, s] of secrets) needles.push(s.toString('hex'), base32Encode(s));
    for (const [, list] of codes) for (const c of list) needles.push(c, c.replace(/-/g, ''));
    needles.push(...issuedTokens);
    expect(issuedTokens.length).toBeGreaterThan(10);
    const dump = await q<{ j: string }>(
      `SELECT coalesce(json_agg(x)::text, '') AS j FROM (
         SELECT coalesce(before::text, '') || coalesce(after::text, '') || coalesce(reason, '') AS x
           FROM audit_event WHERE organization_id = $1
         UNION ALL SELECT coalesce(payload::text, '') FROM outbox_message WHERE organization_id = $1
         UNION ALL SELECT coalesce(subject_type, '') || coalesce(action, '') || coalesce(reason_code, '')
           FROM c3_access_log WHERE organization_id = $1
         UNION ALL SELECT coalesce(request_hash, '') || coalesce(response_body::text, '') FROM idempotency_key
          WHERE organization_id = $1
         UNION ALL SELECT coalesce(ref_code, '') FROM staff_notification WHERE organization_id = $1) s`,
      [t.organizationId],
    );
    const text = dump.rows[0]!.j;
    expect(text.length).toBeGreaterThan(100);
    // FB-R3-SEC-BEC-02: the scan really reads the `after` of the 2FA audit rows (no NULL-concatenation blind spot).
    expect(text).toContain('regenerateMyRecoveryCodes');
    expect(text).toContain('recoveryCodesRemaining');
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
