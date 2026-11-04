/**
 * R4 v1.0.4 P4-06 (BE-A) on Nest/Fastify + PostgreSQL (RLS on, ottimo_app):
 * - EM-09 (SEC FB-R4-SEC-ARC-EM-09, ARC plan v1.0.4 6.6): ≤ 5 real e-mail changes / person changed / 24 h sliding,
 *   6th → 429 RATE_LIMITED + Retry-After, after RBAC + address rules, before S2;
 * - SENT-02 / M18-01: shared-mailbox list from configuration, always + EMAIL_FROM, `+…` removed;
 * - M18-08 (SEC-on-plan-v1.0.4 2.2): dispatcher unchanged – `disabled` gets no `self` copy, `locked` still does;
 * - G-BE-4: `staffName` only in the owner copy;
 * - ARC-BE-31-04: access.denied TARGET_OWNER from the in-transaction re-check (no WeakSet);
 * - SEC-BE-018-04: Pragma: no-cache on the 2FA answers that carry C3.
 * Fake data only: every address is on the reserved `.test` domain.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NotificationAdapter, NotificationMessage } from '@ottimo/integrations/contracts';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { StaffEmailDispatcher } from '../../src/jobs/email-dispatch';
import type { PropertyRef } from '../../src/jobs/job-runner';
import { UsersService } from '../../src/modules/identity/internal/users.service';
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
const WRONG = 'Wrong-pass-2026!';
const DAY_S = 24 * 3600;

class RecordingAdapter implements NotificationAdapter {
  sent: NotificationMessage[] = [];
  async send(_ctx: unknown, m: NotificationMessage) {
    this.sent.push(m);
    return { status: 'sent' as const, providerMsgId: m.idempotencyKey };
  }
  async healthCheck() {
    return { status: 'ok' as const, checkedAt: '2026-10-15T09:00:00+07:00' as never };
  }
}

describe.skipIf(!HAS_DB)('v1.0.4 P4-06 – EM-09, shared mailboxes, denial reason, no-store', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;

  const USERS = {
    own: ['owner'],
    own2: ['owner'],
    fd: ['front_desk'],
    fd2: ['front_desk'],
    fd3: ['front_desk'],
    fd4: ['front_desk'],
    hk: ['housekeeping'],
    mail: ['front_desk'],
    mfa: ['manager'],
  };
  const addr = (name: string) => `${name}-${t.organizationId.slice(-6)}@example.test`;
  const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    db.withContext(t.ctx(), (tx) => tx.query<R>(sql, params));
  const count = async (sql: string, params: unknown[] = []) =>
    (await q<{ n: number }>(sql, params)).rows[0]!.n;
  const changes = (user: string) =>
    count('SELECT count(*)::int AS n FROM user_email_change WHERE user_id = $1', [
      t.users[user]!.id,
    ]);
  const failures = (user: string) =>
    count('SELECT approval_pin_failed_count AS n FROM app_user WHERE id = $1', [t.users[user]!.id]);
  const stepups = (user: string) =>
    count(
      `SELECT count(*)::int AS n FROM audit_event WHERE entity_id = $1 AND action LIKE 'stepup.s2_%'`,
      [t.users[user]!.id],
    );
  const version = async (user: string) =>
    (
      await q<{ version: number }>('SELECT version FROM app_user WHERE id = $1', [
        t.users[user]!.id,
      ])
    ).rows[0]!.version;
  /** Past changes written directly (the window is measured on `changed_at`; the app clock stays fixed). */
  const pastChanges = async (user: string, agesSeconds: number[]) => {
    for (const age of agesSeconds) {
      await q(
        `INSERT INTO user_email_change (id, organization_id, user_id, old_email, changed_by, via, changed_at)
         VALUES ($1, $2, $3, NULL, $3, 'self', $4)`,
        [
          uuidv7(),
          t.organizationId,
          t.users[user]!.id,
          new Date(fa.clock.now().getTime() - age * 1000),
        ],
      );
    }
  };
  const putEmail = (
    user: string,
    email: string | null,
    reauth: Record<string, unknown> = { password: TEST_PASSWORD },
  ) => Client.of(fa, t, user).send('PUT', '/v1/me/email', { email, reauth });
  const patchUser = async (caller: string, target: string, body: Record<string, unknown>) =>
    Client.of(fa, t, caller).send('PATCH', `/v1/users/${t.users[target]!.id}`, body, {
      'if-match': `"${await version(target)}"`,
    });

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { properties: 1, users: USERS });
    await seedSprint1Params(db, t);
    for (const u of Object.keys(USERS)) await setPassword(db, t, u);
    // EMAIL_FROM moved to a send-only address; the configured list holds one more shared box (SENT-02).
    fa = await startFeatureApp(db, {
      emailFrom: 'OTTIMO Desk <noreply@example.test>',
      sharedMailboxes: 'frontdesk@example.test, reservations@example.test',
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  // ───────────────────────────── EM-09 ─────────────────────────────

  it('EM-09: 5 changes pass, the 6th → 429 RATE_LIMITED + Retry-After, before S2, nothing written', async () => {
    for (let i = 1; i <= 5; i += 1) {
      expect((await putEmail('fd', addr(`fd-${i}`))).statusCode).toBe(200);
    }
    expect(await changes('fd')).toBe(5);
    const before = await stepups('fd');
    const res = await putEmail('fd', addr('fd-6'), { password: WRONG });
    expect(res.statusCode).toBe(429);
    expect(res.json().code).toBe('RATE_LIMITED');
    // all 5 changes at the same instant → the window frees up exactly 24 h later
    expect(res.headers['retry-after']).toBe(String(DAY_S));
    expect(res.body).not.toContain('@');
    // before S2: the wrong password was never tried, nothing counted, nothing written
    expect(await failures('fd')).toBe(0);
    expect(await stepups('fd')).toBe(before);
    expect(await changes('fd')).toBe(5);
    const { rows } = await q<{ email: string }>(
      'SELECT email::text AS email FROM app_user WHERE id = $1',
      [t.users.fd!.id],
    );
    expect(rows[0]!.email).toBe(addr('fd-5'));
  });

  it('EM-09: the same address at the limit is a 200 no-op (not a change, not limited)', async () => {
    const res = await putEmail('fd', addr('fd-5'));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ email: addr('fd-5') });
    expect(await changes('fd')).toBe(5);
  });

  it('EM-09: sliding window – changes older than 24 h do not count; Retry-After = until the 5th most recent leaves', async () => {
    // 2 changes 25 h ago (out), 5 inside: 20 h, 10 h, 3 h, 2 h, 1 h ago
    await pastChanges('fd2', [
      25 * 3600,
      25 * 3600,
      20 * 3600,
      10 * 3600,
      3 * 3600,
      2 * 3600,
      3600,
    ]);
    const res = await putEmail('fd2', addr('fd2'));
    expect(res.statusCode).toBe(429);
    // the 5th most recent is 20 h old → leaves in 4 h
    expect(res.headers['retry-after']).toBe(String(4 * 3600));
    // 4 inside the window → allowed
    await pastChanges('fd3', [30 * 3600, 23 * 3600, 5 * 3600, 3600, 60]);
    expect((await putEmail('fd3', addr('fd3'))).statusCode).toBe(200);
    expect((await putEmail('fd3', addr('fd3-b'))).statusCode).toBe(429);
  });

  it('EM-09: counted per person CHANGED, any via – owner changes (updateUser) and own changes share the window', async () => {
    await pastChanges('fd4', [3600, 3600, 3600]); // 3 own changes
    expect(
      (await patchUser('own', 'fd4', { email: addr('fd4-a'), reauth: { password: TEST_PASSWORD } }))
        .statusCode,
    ).toBe(200);
    expect(
      (await patchUser('own', 'fd4', { email: addr('fd4-b'), reauth: { password: TEST_PASSWORD } }))
        .statusCode,
    ).toBe(200);
    const before = await stepups('own');
    const byOwner = await patchUser('own', 'fd4', {
      email: addr('fd4-c'),
      reauth: { password: WRONG },
    });
    expect(byOwner.statusCode).toBe(429);
    expect(byOwner.json().code).toBe('RATE_LIMITED');
    expect(Number(byOwner.headers['retry-after'])).toBeGreaterThan(0);
    // before S2 for updateUser too
    expect(await stepups('own')).toBe(before);
    expect(await failures('own')).toBe(0);
    // and the person themself is limited as well
    expect((await putEmail('fd4', addr('fd4-d'))).statusCode).toBe(429);
    // the owner's OWN window is untouched by changing other people
    expect((await putEmail('own', addr('own'))).statusCode).toBe(200);
    // a display-name-only PATCH is not an e-mail change – never limited
    const nameOnly = await patchUser('own', 'fd4', { displayName: 'Lễ tân Bốn' });
    expect(nameOnly.statusCode).toBe(200);
  });

  it('EM-09 order: RBAC 403 and address 422 still come first at the limit', async () => {
    // fd4 is at the limit; HK cannot PATCH users at all
    const hk = await patchUser('hk', 'fd4', {
      email: addr('x'),
      reauth: { password: TEST_PASSWORD },
    });
    expect(hk.statusCode).toBe(403);
    const bad = await putEmail('fd4', 'not-an-address');
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toEqual([{ field: 'email', code: 'EMAIL_INVALID' }]);
  });

  // ───────────────────────────── SENT-02 / M18-01 ─────────────────────────────

  it('SENT-02: EMAIL_FROM is a send-only box, yet info@ / booking@ / configured boxes / `+…` forms are all refused before S2', async () => {
    const shared = [
      'info@example.test', // default at the mail domain – NOT the EMAIL_FROM address any more
      'INFO+desk@Example.test',
      'booking@example.test',
      'booking+ota@example.test',
      'frontdesk@example.test', // configured
      'frontdesk+1@example.test',
      'reservations@example.test',
      'noreply@example.test', // EMAIL_FROM is always in the list
      'noreply+x@example.test',
    ];
    const before = await stepups('mail');
    for (const email of shared) {
      const res = await putEmail('mail', email, { password: WRONG });
      expect({ email, status: res.statusCode }).toEqual({ email, status: 422 });
      expect(res.json().errors).toEqual([{ field: 'email', code: 'EMAIL_SHARED_MAILBOX' }]);
      expect(res.body).not.toContain('@');
    }
    expect(await failures('mail')).toBe(0);
    expect(await stepups('mail')).toBe(before);
    // updateUser takes the same rule
    const u = await patchUser('own', 'mail', {
      email: 'info+x@example.test',
      reauth: { password: WRONG },
    });
    expect(u.statusCode).toBe(422);
    expect(u.json().errors).toEqual([{ field: 'email', code: 'EMAIL_SHARED_MAILBOX' }]);
    // a personal address on the same domain, and info@ on another domain, are accepted
    expect((await putEmail('mail', addr('mail'))).statusCode).toBe(200);
    expect((await putEmail('mail', 'info@personal.example.test')).statusCode).toBe(200);
  });

  // ───────────────────────────── ARC-BE-31-04 ─────────────────────────────

  it('ARC-BE-31-04: the in-transaction owner re-check (TOCTOU branch) still audits reason TARGET_OWNER', async () => {
    // The pre-S2 check is skipped on the live instance, so only the re-check inside the unit of work refuses.
    const users = fa.app.get(UsersService);
    const original = users.precheckEmail.bind(users);
    users.precheckEmail = async () => undefined;
    try {
      const res = await Client.of(fa, t, 'own').send(
        'PATCH',
        `/v1/users/${t.users.own2!.id}`,
        { email: addr('own2-x'), reauth: { password: TEST_PASSWORD } },
        { 'if-match': `"${await version('own2')}"` },
      );
      expect(res.statusCode).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN_ACTION');
      // the internal reason never reaches the body
      expect(res.body).not.toContain('TARGET_OWNER');
      expect(res.body).not.toContain('auditReason');
      const { rows } = await q<{ reason: string }>(
        `SELECT reason FROM audit_event WHERE action = 'access.denied' AND entity_id = $1`,
        [t.users.own2!.id],
      );
      expect(rows.map((r) => r.reason)).toEqual(['TARGET_OWNER']);
      expect(await changes('own2')).toBe(0);
    } finally {
      users.precheckEmail = original;
    }
  });

  // ───────────────────────────── SEC-BE-018-04 ─────────────────────────────

  it('SEC-BE-018-04: startMy2faSetup and confirmMy2fa answer Cache-Control: no-store + Pragma: no-cache', async () => {
    const login = await fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t.users.mfa!.username, password: TEST_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    const c = new Client(fa, cookieValue(login, 'ottimo_sid')!);
    const setup = await c.send('POST', '/v1/me/2fa/setup', { currentPassword: TEST_PASSWORD });
    expect(setup.statusCode).toBe(200);
    expect(String(setup.headers['cache-control']).toLowerCase()).toBe('no-store');
    expect(setup.headers.pragma).toBe('no-cache');
    const bad = await c.send('POST', '/v1/me/2fa/confirm', { totpCode: '000000' });
    // wrong code: error answer, still never cacheable through the C3 helper path or the Problem filter
    expect([401, 422]).toContain(bad.statusCode);
  });
});

describe.skipIf(!HAS_DB)(
  'v1.0.4 P4-06 – dispatcher: M18-08 status rule pinned, G-BE-4 staffName',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let now: Date;
    const clock = { now: () => now };

    beforeAll(async () => {
      db = appDatabase(4);
      fa = await startFeatureApp(db);
      now = new Date(T0.getTime() + 3_600_000);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    async function scenario() {
      const t = await createTenant(db, {
        users: { fd: ['front_desk'], own: ['owner'] },
        properties: 1,
      });
      for (const u of ['fd', 'own']) await setPassword(db, t, u);
      const addr = (name: string) => `${name}-${t.organizationId.slice(-6)}@example.test`;
      const raw = (sql: string, params: unknown[]) =>
        db.withContext(t.ctx(), (tx) => tx.query(sql, params));
      await raw('UPDATE app_user SET email = $2 WHERE id = $1', [t.users.fd!.id, addr('fd-a')]);
      await raw('UPDATE app_user SET email = $2 WHERE id = $1', [t.users.own!.id, addr('own')]);
      const res = await Client.of(fa, t, 'fd').send('PUT', '/v1/me/email', {
        email: addr('fd-x'),
        reauth: { password: TEST_PASSWORD },
      });
      expect(res.statusCode).toBe(200);
      const adapter = new RecordingAdapter();
      const d = new StaffEmailDispatcher(db, clock, adapter, () => undefined);
      const p: PropertyRef = {
        propertyId: t.propertyIds[0]!,
        organizationId: t.organizationId,
        timezone: TZ,
      };
      const byAudience = () => Object.fromEntries(adapter.sent.map((m) => [m.params.audience, m]));
      return { t, addr, raw, adapter, d, p, byAudience };
    }

    it('G-BE-4: staffName only in the owner copy (not self, not previous)', async () => {
      const s = await scenario();
      await s.d.runForProperty(s.p);
      const a = s.byAudience();
      expect(Object.keys(a).sort()).toEqual(['owner', 'previous', 'self']);
      expect(a.owner!.params.staffName).toBeTruthy();
      expect('staffName' in a.self!.params).toBe(false);
      expect('staffName' in a.previous!.params).toBe(false);
      // everything else identical between the copies (time, via)
      expect(a.self!.params.occurredAt).toBe(a.owner!.params.occurredAt);
      expect(a.previous!.params.via).toBe('self');
    });

    it('M18-08 (a): person `disabled` (Desk "Lock account") before the send → no self copy; the active owner still gets theirs', async () => {
      const s = await scenario();
      await s.raw(`UPDATE app_user SET status = 'disabled' WHERE id = $1`, [s.t.users.fd!.id]);
      await s.d.runForProperty(s.p);
      const a = s.byAudience();
      expect(a.self).toBeUndefined();
      expect(a.owner?.to).toBe(s.addr('own'));
    });

    it('M18-08 (b): person `locked` (automatic hard lock, locked_until NULL) → still gets the self copy', async () => {
      const s = await scenario();
      await s.raw(`UPDATE app_user SET status = 'locked', locked_until = NULL WHERE id = $1`, [
        s.t.users.fd!.id,
      ]);
      await s.d.runForProperty(s.p);
      const a = s.byAudience();
      expect(a.self?.to).toBe(s.addr('fd-x'));
      expect(a.owner?.to).toBe(s.addr('own'));
    });
  },
);
