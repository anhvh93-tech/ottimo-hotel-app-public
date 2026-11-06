/**
 * v1.0.5 PR-D1 (BE-D) – V5-40: the desk enforces 2FA for the front-desk lead (`front_desk_lead` in
 * MFA_REQUIRED_ROLES; release notes v1.0.4 "Ai bật 2 bước", DOM B.1, FB-R4-PO-BA-032-07). On Nest/Fastify +
 * PostgreSQL (RLS on, ottimo_app):
 * - MFA_ENFORCED: FDL without 2FA → restricted session at login (`Me.mfaEnrollmentRequired`), 403
 *   MFA_ENROLLMENT_REQUIRED elsewhere; a session opened BEFORE the flag is restricted too – migration 0079's
 *   `auth_resolve_session().mfa_required` knows owner/manager only, so this proves the guard's own check;
 * - a role given later (roles_version bump) restricts the live session of an FD who becomes FDL;
 * - enrolment → full access; FDL cannot turn 2FA off (403, mandatory role); FD, HK, SAL not concerned;
 * - MFA_ENFORCED off (dev/CI): FDL logs in normally, `mfaRequiredButMissing = true`, `getMy2fa.required = true`.
 * Fake clock, FAKE users only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { MFA_REQUIRED_ROLES, isMfaRequiredRole } from '../../src/modules/identity/public/mfa-store';
import { base32Decode, totpAt, totpStep } from '../../src/modules/identity/public/totp';
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

describe('V5-40 – MFA_REQUIRED_ROLES (unit)', () => {
  it('owner, manager and front_desk_lead – nobody else (SEC 06.2 + V5-40)', () => {
    expect([...MFA_REQUIRED_ROLES]).toEqual(['owner', 'manager', 'front_desk_lead']);
    expect(isMfaRequiredRole(['front_desk_lead'])).toBe(true);
    expect(isMfaRequiredRole(new Set(['front_desk', 'front_desk_lead']))).toBe(true);
    for (const r of ['front_desk', 'housekeeping', 'maintenance', 'sales_staff', 'collaborator']) {
      expect(isMfaRequiredRole([r]), r).toBe(false);
    }
    expect(isMfaRequiredRole([])).toBe(false);
  });
});

describe.skipIf(!HAS_DB)('V5-40 – front-desk lead must use 2FA (guard + identity)', () => {
  let db: Database;
  let fa: FeatureApp;
  let enforced: FeatureApp;
  let t: TestTenant;
  const secrets = new Map<string, Buffer>();

  const USERS = {
    lead: ['front_desk_lead'],
    lead2: ['front_desk_lead'],
    lead3: ['front_desk_lead'],
    promo: ['front_desk'],
    fd: ['front_desk'],
    hk: ['housekeeping'],
    sal: ['sales_staff'],
  };

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: USERS });
    await seedSprint1Params(db, t);
    for (const u of Object.keys(USERS)) await setPassword(db, t, u);
    fa = await startFeatureApp(db);
    enforced = await startFeatureApp(db, { mfaEnforced: true });
    fa.clock.set(new Date(T0.getTime() + 3600_000));
    enforced.clock.set(new Date(T0.getTime() + 3600_000));
  });
  afterAll(async () => {
    await fa?.close();
    await enforced?.close();
    await db?.close();
  });

  const login = (app: FeatureApp, user: string) =>
    app.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t.users[user]!.username, password: TEST_PASSWORD },
    });
  const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    db.withContext(t.ctx(), (tx) => tx.query<R>(sql, params));
  /** A plain FD+ read that a restricted session may not call. */
  const work = (c: Client) => c.get(`${P(t)}/guests?q=ab`);

  async function enroll(user: string, app: FeatureApp): Promise<Client> {
    const res = await login(app, user);
    expect(res.statusCode, res.body).toBe(200);
    const c = new Client(app, cookieValue(res, 'ottimo_sid')!);
    const setup = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    expect(setup.statusCode, setup.body).toBe(200);
    const uri = new URL(setup.json().otpauthUri.replace('otpauth://', 'https://'));
    secrets.set(user, base32Decode(uri.searchParams.get('secret')!));
    const conf = await c.send('POST', '/v1/me/2fa/confirm', {
      totpCode: totpAt(secrets.get(user)!, totpStep(app.clock.now())),
    });
    expect(conf.statusCode, conf.body).toBe(200);
    return new Client(app, cookieValue(conf, 'ottimo_sid')!);
  }

  it('MFA_ENFORCED: FDL without 2FA → restricted session at login; 403 MFA_ENROLLMENT_REQUIRED on other operations', async () => {
    const res = await login(enforced, 'lead');
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({ mfaEnrollmentRequired: true, mfaEnabled: false });
    const c = new Client(enforced, cookieValue(res, 'ottimo_sid')!);
    expect((await c.get('/v1/me')).json()).toMatchObject({
      mfaEnrollmentRequired: true,
      mfaRequiredButMissing: true,
    });
    expect((await c.get('/v1/me/2fa')).json()).toMatchObject({
      enabled: false,
      required: true,
      enforced: true,
    });
    const blocked = await work(c);
    expect(blocked.statusCode, blocked.body).toBe(403);
    expect(blocked.json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    const [s] = (
      await q<{ enrollment_only: boolean }>(
        `SELECT enrollment_only FROM user_session WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [t.users.lead!.id],
      )
    ).rows;
    expect(s).toEqual({ enrollment_only: true });
  });

  it('MFA_ENFORCED: a session opened before the flag is restricted too (guard check – 0079 SQL knows owner/manager only)', async () => {
    // The preset tenant session: enrollment_only = false and auth_resolve_session().mfa_required = false for an FDL.
    const [row] = (
      await q<{ mfa_required: boolean; enrollment_only: boolean }>(
        `SELECT mfa_required, enrollment_only FROM auth_resolve_session($1)`,
        [
          (
            await q<{ id: string }>(`SELECT id FROM user_session WHERE user_id = $1 LIMIT 1`, [
              t.users.lead2!.id,
            ])
          ).rows[0]!.id,
        ],
      )
    ).rows;
    expect(row).toEqual({ mfa_required: false, enrollment_only: false });
    const old = Client.of(enforced, t, 'lead2');
    const r = await work(old);
    expect(r.statusCode, r.body).toBe(403);
    expect(r.json().code).toBe('MFA_ENROLLMENT_REQUIRED');
    // getMe still answers (enrolment screen) and says so
    expect((await old.get('/v1/me')).json().mfaEnrollmentRequired).toBe(true);
    // the same session on the app without the flag works as before
    expect((await work(Client.of(fa, t, 'lead2'))).statusCode).toBe(200);
  });

  it('FD, HK, SAL are not concerned (no restriction, not required)', async () => {
    for (const u of ['fd', 'hk', 'sal']) {
      const res = await login(enforced, u);
      expect(res.statusCode, `${u} ${res.body}`).toBe(200);
      expect(res.json(), u).toMatchObject({
        mfaEnrollmentRequired: false,
        mfaRequiredButMissing: false,
      });
      const c = new Client(enforced, cookieValue(res, 'ottimo_sid')!);
      expect((await c.get('/v1/me/2fa')).json().required, u).toBe(false);
    }
    expect((await work(Client.of(enforced, t, 'fd'))).statusCode).toBe(200);
  });

  it('a live FD session is restricted as soon as the person becomes FDL (roles_version bump)', async () => {
    const c = Client.of(enforced, t, 'promo');
    expect((await work(c)).statusCode).toBe(200);
    await q(
      `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
       VALUES ($1, $2, $3, 'front_desk_lead', $4)`,
      [t.users.promo!.id, t.propertyIds[0], t.organizationId, enforced.clock.now()],
    );
    await q(`UPDATE app_user SET roles_version = roles_version + 1 WHERE id = $1`, [
      t.users.promo!.id,
    ]);
    const r = await work(c);
    expect(r.statusCode, r.body).toBe(403);
    expect(r.json().code).toBe('MFA_ENROLLMENT_REQUIRED');
  });

  it('enrolment → full access; FDL cannot turn 2FA off (403 mandatory role)', async () => {
    const full = await enroll('lead', enforced);
    expect((await full.get('/v1/me')).json()).toMatchObject({
      mfaEnabled: true,
      mfaEnrollmentRequired: false,
      mfaRequiredButMissing: false,
    });
    expect((await work(full)).statusCode).toBe(200);
    enforced.clock.advance(30_000);
    const off = await full.send('DELETE', '/v1/me/2fa', {
      password: TEST_PASSWORD,
      totpCode: totpAt(secrets.get('lead')!, totpStep(enforced.clock.now())),
    });
    expect(off.statusCode, off.body).toBe(403);
    expect(off.json().code).toBe('FORBIDDEN_ACTION');
    const [u] = (
      await q<{ mfa_enabled: boolean }>('SELECT mfa_enabled FROM app_user WHERE id = $1', [
        t.users.lead!.id,
      ])
    ).rows;
    expect(u).toEqual({ mfa_enabled: true });
  });

  it('MFA_ENFORCED off (dev/CI): FDL works, Desk is reminded (mfaRequiredButMissing), getMy2fa.required = true', async () => {
    const res = await login(fa, 'lead3');
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({
      mfaEnrollmentRequired: false,
      mfaRequiredButMissing: true,
    });
    const c = new Client(fa, cookieValue(res, 'ottimo_sid')!);
    expect((await c.get('/v1/me/2fa')).json()).toMatchObject({
      enabled: false,
      required: true,
      enforced: false,
    });
    expect((await work(c)).statusCode).toBe(200);
  });
});
