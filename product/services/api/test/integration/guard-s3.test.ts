/**
 * BE (chung) – Sprint 3 Response & fix, the global guard on the production module list and the real DB:
 * - SEC-BE-33 / FB-R2-ARC-BE-S3-04: a forbidden role sending `dryRun: true` with ANY completed Idempotency-Key
 *   → 403 + access.denied (a dry run never reaches the unit of work, so the decision is taken in the guard);
 *   a completed key of ANOTHER method/path no longer defers the decision either.
 * - SEC-BE-34 (SR-DEV-04, D1): a staff PWA session is never on a trusted device, even with a valid device
 *   cookie (dev hosts share cookies across ports).
 * - SEC-BE-35 (SR-RL-09): 600 requests per staff user and minute → 429 RATE_LIMITED + Retry-After, one
 *   `security.rate_limited` event per window; other users are not affected.
 * Fake data only.
 */
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { STAFF_REQUESTS_PER_MINUTE } from '../../src/shared/http/auth.guard';
import {
  Client,
  type FeatureApp,
  P,
  seedSprint1Params,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('guard – Sprint 3 Response & fix (SEC-BE-33/34/35)', () => {
  let db: Database;
  let t: TestTenant;
  let fa: FeatureApp;

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, {
      users: { sal: ['sales_staff'], fd: ['front_desk'], fd2: ['front_desk'], fd3: ['front_desk'] },
    });
    await seedSprint1Params(db, t);
    fa = await startFeatureApp(db, { staffRequestsPerMinute: STAFF_REQUESTS_PER_MINUTE });
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const q = (sql: string, args: unknown[] = []) =>
    db.withContext(t.ctx(), async (tx) => (await tx.query(sql, args)).rows);
  const denied = async (op: string) =>
    (
      await q(
        `SELECT count(*)::int AS n FROM audit_event
          WHERE action = 'access.denied' AND entity_type = 'operation' AND entity_id = $1 AND actor_user_id = $2`,
        [op, t.users.sal!.id],
      )
    )[0]!.n as number;

  it('SEC-BE-33: dry run of a forbidden role with a completed key of another operation → 403 + access.denied', async () => {
    // A key the sale really completed earlier (another operation – e.g. a quote).
    const key = randomUUID();
    await q(
      `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
         request_hash, state, response_status, response_body)
       VALUES ('user', $1, $2, $3, 'POST', $4, 'x', 'completed', 201, '{}')`,
      [t.users.sal!.id, key, t.organizationId, `${P(t)}/quotes`],
    );
    const sal = Client.of(fa, t, 'sal');
    const url = `${P(t)}/reservations/${randomUUID()}/actions/late-checkout`;
    const before = await denied('setLateCheckout');
    const dry = await sal.send(
      'POST',
      url,
      { checkoutTime: '17:00', dryRun: true },
      { 'idempotency-key': key },
    );
    expect(dry.statusCode, dry.body).toBe(403);
    expect(dry.json().code).toBe('FORBIDDEN_ACTION');
    expect(await denied('setLateCheckout')).toBe(before + 1);
    // Not a dry run, same key of another path: no replay to look up → decided in the guard as well.
    const write = await sal.send(
      'POST',
      url,
      { checkoutTime: '17:00', applySurcharge: true },
      { 'idempotency-key': key, 'if-match': '"1"' },
    );
    expect(write.statusCode).toBe(403);
    expect(await denied('setLateCheckout')).toBe(before + 2);
  });

  it('SEC-BE-34: a staff PWA session with a valid device cookie → 403 DEVICE_NOT_TRUSTED; the admin-web session passes', async () => {
    const device = await t.deviceToken();
    await q(`UPDATE user_session SET client_origin = 'staff_pwa' WHERE user_id = $1`, [
      t.users.fd!.id,
    ]);
    const url = `${P(t)}/registrations/${randomUUID()}/portal-data`;
    const pwa = await new Client(fa, t.users.fd!.sessionToken, device).get(url);
    expect(pwa.statusCode).toBe(403);
    expect(pwa.json().code).toBe('DEVICE_NOT_TRUSTED');
    const desk = await new Client(fa, t.users.fd2!.sessionToken, device).get(url);
    expect(desk.json().code).not.toBe('DEVICE_NOT_TRUSTED');
    const audit = await q(
      `SELECT count(*)::int AS n FROM audit_event
        WHERE action = 'access.denied' AND entity_type = 'trusted_device' AND actor_user_id = $1`,
      [t.users.fd!.id],
    );
    expect(audit[0]!.n).toBeGreaterThanOrEqual(1);
  });

  it(`SEC-BE-35: ${STAFF_REQUESTS_PER_MINUTE} requests per user and minute, then 429 + Retry-After; one security event; others unaffected`, async () => {
    const me = Client.of(fa, t, 'fd3');
    for (let i = 0; i < STAFF_REQUESTS_PER_MINUTE; i++) {
      const r = await me.get('/v1/me');
      if (r.statusCode !== 200) throw new Error(`request ${i + 1}: ${r.statusCode} ${r.body}`);
    }
    const over = await me.get('/v1/me');
    expect(over.statusCode).toBe(429);
    expect(over.json().code).toBe('RATE_LIMITED');
    expect(Number(over.headers['retry-after'])).toBeGreaterThan(0);
    expect((await me.get('/v1/me')).statusCode).toBe(429);
    expect((await Client.of(fa, t, 'fd2').get('/v1/me')).statusCode).toBe(200);
    const events = await q(
      `SELECT count(*)::int AS n FROM audit_event WHERE action = 'security.rate_limited' AND entity_id = $1`,
      [t.users.fd3!.id],
    );
    expect(events[0]!.n).toBe(1);
    // The window ends with the minute (fixed test clock moved on).
    fa.clock.set(new Date(fa.clock.now().getTime() + 61_000));
    expect((await me.get('/v1/me')).statusCode).toBe(200);
  });
});
