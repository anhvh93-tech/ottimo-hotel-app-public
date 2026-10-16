/**
 * HTTP foundation on a real Nest/Fastify app + PostgreSQL: OpenAPI-driven guard (x-roles, 401/403/404,
 * trusted device), Idempotency-Key (428, replay, reuse, concurrency), problem+json, request id,
 * and the test-support endpoints (X-Test-Token + owner).
 */
import 'reflect-metadata';
import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { MutableClock, SystemClock } from '../../src/clock';
import { PgClockStore } from '../../src/db/clock-store';
import { createHttpAdapter } from '../../src/http';
import type { Database, Tx } from '../../src/db/database';
import { DocNumberService } from '../../src/modules/platform/public/doc-number.service';
import type { GuardedRequest } from '../../src/shared/http/auth.guard';
import { Operation } from '../../src/shared/http/operation';
import { UnitOfWork, applyResult } from '../../src/shared/http/unit-of-work';
import { problem } from '../../src/shared/problem';
import TestSupport from '../../src/test-support';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

let calls = 0;

@Controller('v1/properties/:propertyId')
class ProbeController {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly docs: DocNumberService,
  ) {}

  @Get('dashboard/tonight')
  @Operation('getTonightKpi')
  tonight(@Param('propertyId') propertyId: string): { propertyId: string } {
    return { propertyId };
  }

  /** Stand-in for createReservation: allocates a real code in the business transaction. */
  @Post('reservations')
  @Operation('createReservation')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: { fail?: boolean },
  ) {
    const result = await this.uow.run(req, async (tx: Tx) => {
      calls++;
      const code = await this.docs.allocate(tx, 'reservation');
      if (body?.fail) throw problem('ROOM_UNAVAILABLE', { extras: { conflicts: [] } });
      await new Promise((r) => setTimeout(r, 150));
      return { status: 201, body: { id: randomUUID(), code } };
    });
    return applyResult(reply, result);
  }

  @Get('registrations/:registrationId/portal-data')
  @Operation('getPortalData')
  portal(): { ok: true } {
    return { ok: true };
  }

  @Get('boom')
  @Operation('getTonightKpi')
  boom(): never {
    throw new Error('SELECT secret FROM table_name failed');
  }
}

@Controller('v1')
class NoOperationController {
  @Get('forgotten')
  forgotten(): string {
    return 'should never be reachable';
  }
}

describe.skipIf(!HAS_DB)(
  'HTTP foundation (guard · idempotency · problem+json · test-support)',
  () => {
    let db: Database;
    let app: NestFastifyApplication;
    let t: TestTenant;
    let other: TestTenant;
    let clock: MutableClock;
    const token = 'x'.repeat(40);

    beforeAll(async () => {
      db = appDatabase(10);
      t = await createTenant(db, {
        users: {
          owner: ['owner'],
          fd: ['front_desk'],
          hk: ['housekeeping'],
          fdsal: ['front_desk', 'sales_staff'],
        },
        now: new Date(),
      });
      other = await createTenant(db, { users: { owner: ['owner'] }, now: new Date() });
      clock = new MutableClock(
        new PgClockStore(db.pool, process.env.DATABASE_URL as string),
        new SystemClock(),
      );
      await clock.start();
      const moduleRef = await Test.createTestingModule({
        imports: [
          AppModule.register({
            clock,
            db: { ping: async () => true, close: async () => undefined },
            database: db,
            auth: { cookieSecurePrefix: false },
            imports: [TestSupport.register({ token })],
          }),
        ],
        controllers: [ProbeController, NoOperationController],
      }).compile();
      app = moduleRef.createNestApplication<NestFastifyApplication>(
        createHttpAdapter({ logLevel: 'silent', trustProxy: false }),
      );
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    });
    afterAll(async () => {
      await clock.reset();
      await clock.stop();
      await app?.close();
      await db.close();
    });

    const cookie = (user: string, extra = '') =>
      `ottimo_sid=${t.users[user]!.sessionToken}${extra}`;
    const get = (url: string, headers: Record<string, string> = {}) =>
      app.inject({ method: 'GET', url, headers });
    const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
      app.inject({ method: 'POST', url, payload: body as object, headers });
    const P = () => `/v1/properties/${t.propertyIds[0]}`;

    it('401 UNAUTHENTICATED as problem+json without a session', async () => {
      const res = await get(`${P()}/dashboard/tonight`);
      expect(res.statusCode).toBe(401);
      expect(res.headers['content-type']).toContain('application/problem+json');
      expect(res.json()).toMatchObject({
        type: '/problems/unauthenticated',
        status: 401,
        code: 'UNAUTHENTICATED',
      });
      expect(res.json().requestId).toBe(res.headers['x-request-id']);
    });

    it('roles from x-roles: owner and front desk allowed, housekeeping 403 + audit access.denied', async () => {
      expect((await get(`${P()}/dashboard/tonight`, { cookie: cookie('owner') })).statusCode).toBe(
        200,
      );
      expect((await get(`${P()}/dashboard/tonight`, { cookie: cookie('fd') })).statusCode).toBe(
        200,
      );
      const denied = await get(`${P()}/dashboard/tonight`, {
        cookie: cookie('hk'),
        'x-request-id': 'req-denied-0001',
      });
      expect(denied.statusCode).toBe(403);
      expect(denied.json().code).toBe('FORBIDDEN_ACTION');
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT category, action, entity_id, actor_user_id FROM audit_event WHERE request_id = 'req-denied-0001'`,
        ),
      );
      expect(audit.rows).toEqual([
        {
          category: 'access',
          action: 'access.denied',
          entity_id: 'getTonightKpi',
          actor_user_id: t.users.hk!.id,
        },
      ]);
    });

    it('another organisation’s property id → 404 (no existence leak); malformed id → 404', async () => {
      const res = await get(`/v1/properties/${other.propertyIds[0]}/dashboard/tonight`, {
        cookie: cookie('owner'),
      });
      expect(res.statusCode).toBe(404);
      expect(
        (await get('/v1/properties/not-a-uuid/dashboard/tonight', { cookie: cookie('owner') }))
          .statusCode,
      ).toBe(404);
    });

    it('a route without @Operation is never served (default deny → 500, no data)', async () => {
      const res = await get('/v1/forgotten', { cookie: cookie('owner') });
      expect(res.statusCode).toBe(500);
      expect(res.json().code).toBe('INTERNAL_ERROR');
      expect(res.body).not.toContain('should never be reachable');
    });

    it('500 hides internals (no SQL, table names or stack)', async () => {
      const res = await get(`${P()}/boom`, { cookie: cookie('owner') });
      expect(res.statusCode).toBe(500);
      expect(res.body).not.toMatch(/SELECT|table_name|at .*\.ts/);
    });

    it('x-requires-trusted-device: 403 DEVICE_NOT_TRUSTED without/with a foreign device, 200 with a granted one', async () => {
      const url = `${P()}/registrations/${randomUUID()}/portal-data`;
      expect((await get(url, { cookie: cookie('fd') })).json().code).toBe('DEVICE_NOT_TRUSTED');
      const foreign = await other.deviceToken();
      expect((await get(url, { cookie: cookie('fd', `; ottimo_did=${foreign}`) })).statusCode).toBe(
        403,
      );
      const did = await t.deviceToken();
      expect((await get(url, { cookie: cookie('fd', `; ottimo_did=${did}`) })).statusCode).toBe(
        200,
      );
    });

    describe('Idempotency-Key (ADR-009 point 8)', () => {
      it('428 PRECONDITION_REQUIRED when missing; 422 when not a UUID', async () => {
        const res = await post(`${P()}/reservations`, {}, { cookie: cookie('fd') });
        expect(res.statusCode).toBe(428);
        expect(res.json().code).toBe('PRECONDITION_REQUIRED');
        const bad = await post(
          `${P()}/reservations`,
          {},
          { cookie: cookie('fd'), 'idempotency-key': 'abc' },
        );
        expect(bad.json().code).toBe('VALIDATION_FAILED');
      });

      it('same key + same body → stored response replayed (Idempotent-Replayed), business runs once', async () => {
        const key = randomUUID();
        const before = calls;
        const first = await post(
          `${P()}/reservations`,
          { a: 1 },
          { cookie: cookie('fd'), 'idempotency-key': key },
        );
        const again = await post(
          `${P()}/reservations`,
          { a: 1 },
          { cookie: cookie('fd'), 'idempotency-key': key },
        );
        expect(first.statusCode).toBe(201);
        expect(again.statusCode).toBe(201);
        expect(again.json()).toEqual(first.json());
        expect(again.headers['idempotent-replayed']).toBe('true');
        expect(calls - before).toBe(1);
      });

      it('same key + different body → 422 IDEMPOTENCY_KEY_REUSED', async () => {
        const key = randomUUID();
        await post(
          `${P()}/reservations`,
          { a: 1 },
          { cookie: cookie('fd'), 'idempotency-key': key },
        );
        const res = await post(
          `${P()}/reservations`,
          { a: 2 },
          { cookie: cookie('fd'), 'idempotency-key': key },
        );
        expect(res.statusCode).toBe(422);
        expect(res.json().code).toBe('IDEMPOTENCY_KEY_REUSED');
      });

      it('two concurrent requests with one key → business runs once, both get the same code', async () => {
        const key = randomUUID();
        const before = calls;
        const [a, b] = await Promise.all([
          post(`${P()}/reservations`, { c: 1 }, { cookie: cookie('fd'), 'idempotency-key': key }),
          post(`${P()}/reservations`, { c: 1 }, { cookie: cookie('fd'), 'idempotency-key': key }),
        ]);
        expect([a.statusCode, b.statusCode]).toEqual([201, 201]);
        expect(a.json().code).toBe(b.json().code);
        expect(calls - before).toBe(1);
      });

      it('a failed business call rolls back key and code: the retry succeeds without a gap', async () => {
        const key = randomUUID();
        const fail = await post(
          `${P()}/reservations`,
          { fail: true },
          { cookie: cookie('fd'), 'idempotency-key': key },
        );
        expect(fail.statusCode).toBe(409);
        expect(fail.json()).toMatchObject({ code: 'ROOM_UNAVAILABLE', conflicts: [] });
        const last = await post(
          `${P()}/reservations`,
          {},
          { cookie: cookie('fd'), 'idempotency-key': randomUUID() },
        );
        const retry = await post(
          `${P()}/reservations`,
          {},
          { cookie: cookie('fd'), 'idempotency-key': key },
        );
        const n = (c: string) => Number(c.slice(4));
        expect(n(retry.json().code)).toBe(n(last.json().code) + 1);
      });

      it('roles are checked after the replay lookup: housekeeping → 403, key not kept', async () => {
        const key = randomUUID();
        const res = await post(
          `${P()}/reservations`,
          {},
          { cookie: cookie('hk'), 'idempotency-key': key },
        );
        expect(res.statusCode).toBe(403);
        const keys = await db.withContext(t.ctx(), (tx) =>
          tx.query('SELECT 1 FROM idempotency_key WHERE key = $1', [key]),
        );
        expect(keys.rowCount).toBe(0);
      });

      it('a user with two roles gets the union (front_desk + sales_staff)', async () => {
        const res = await post(
          `${P()}/reservations`,
          {},
          { cookie: cookie('fdsal'), 'idempotency-key': randomUUID() },
        );
        expect(res.statusCode).toBe(201);
      });
    });

    describe('test-support (openapi.test.yaml)', () => {
      const T = '/__test__';
      it('needs X-Test-Token AND an owner session', async () => {
        expect((await get(`${T}/clock`, { cookie: cookie('owner') })).statusCode).toBe(401);
        expect(
          (await get(`${T}/clock`, { cookie: cookie('fd'), 'x-test-token': token })).statusCode,
        ).toBe(403);
        expect((await get(`${T}/clock`, { 'x-test-token': token })).statusCode).toBe(401);
        expect(
          (await get(`${T}/clock`, { cookie: cookie('owner'), 'x-test-token': 'y'.repeat(40) }))
            .statusCode,
        ).toBe(401);
        expect(
          (await get(`${T}/clock`, { cookie: cookie('owner'), 'x-test-token': token })).statusCode,
        ).toBe(200);
      });

      it('sets, advances and resets the shared clock; each call is audited', async () => {
        const h = {
          cookie: cookie('owner'),
          'x-test-token': token,
          'x-request-id': 'req-clock-0001',
        };
        const set = await post(`${T}/clock`, { op: 'set', at: '2026-10-15T22:59:00+07:00' }, h);
        expect(set.statusCode).toBe(200);
        expect(set.json().mode).toBe('offset');
        await post(`${T}/clock`, { op: 'freeze' }, h);
        // set while frozen pins the exact instant (no milliseconds elapsed between calls)
        expect(
          (await post(`${T}/clock`, { op: 'set', at: '2026-10-15T22:59:00+07:00' }, h)).json().mode,
        ).toBe('frozen');
        const adv = await post(`${T}/clock`, { op: 'advance', advanceMs: 120_000 }, h);
        expect(adv.json()).toMatchObject({ now: '2026-10-15T16:01:00.000Z', mode: 'frozen' });
        expect(clock.now().toISOString()).toBe('2026-10-15T16:01:00.000Z');
        expect((await post(`${T}/clock`, { op: 'warp' }, h)).json().code).toBe('VALIDATION_FAILED');
        expect((await post(`${T}/clock`, { op: 'reset' }, h)).json().mode).toBe('system');
        const audit = await db.withContext(t.ctx(), (tx) =>
          tx.query(`SELECT action FROM audit_event WHERE request_id = 'req-clock-0001'`),
        );
        expect(audit.rows.length).toBeGreaterThanOrEqual(4);
        expect(audit.rows.every((r) => r.action === 'test.clock_changed')).toBe(true);
      });

      it('runs a job now through the exactly-once runner; unknown job → 404', async () => {
        const h = { cookie: cookie('owner'), 'x-test-token': token };
        const first = await post(`${T}/jobs/log.partitions/run`, {}, h);
        expect(first.statusCode).toBe(200);
        expect(['done', 'skipped_already_ran']).toContain(first.json().status);
        expect((await post(`${T}/jobs/log.partitions/run`, {}, h)).json().status).toBe(
          'skipped_already_ran',
        );
        expect((await post(`${T}/jobs/nope/run`, {}, h)).statusCode).toBe(404);
      });

      it('resets lockouts of the prefixed accounts of the caller organisation only (FB-R2-QA-BE-07)', async () => {
        const h = { cookie: cookie('owner'), 'x-test-token': token };
        const lock = (tenant: TestTenant, user: string) =>
          db.withContext(tenant.ctx(), (tx) =>
            tx.query(
              `UPDATE app_user SET failed_login_count = 3, approval_pin_failed_count = 4,
                 approval_pin_locked_until = now() + interval '15 minutes' WHERE id = $1`,
              [tenant.users[user]!.id],
            ),
          );
        await lock(t, 'hk');
        await lock(t, 'fd');
        await lock(other, 'owner');
        const res = await post(`${T}/rate-limits/reset`, { usernamePrefix: 't.hk.' }, h);
        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ users: 1 });
        const counters = async (tenant: TestTenant, user: string) =>
          (
            await db.withContext(tenant.ctx(), (tx) =>
              tx.query<{ f: number; a: number }>(
                'SELECT failed_login_count AS f, approval_pin_failed_count AS a FROM app_user WHERE id = $1',
                [tenant.users[user]!.id],
              ),
            )
          ).rows[0];
        expect(await counters(t, 'hk')).toEqual({ f: 0, a: 0 });
        expect(await counters(t, 'fd')).toEqual({ f: 3, a: 4 }); // other prefix
        expect(await counters(other, 'owner')).toEqual({ f: 3, a: 4 }); // other organisation
        expect((await post(`${T}/rate-limits/reset`, { usernamePrefix: 'x' }, h)).statusCode).toBe(
          422,
        );
      });

      it('keeps hard-locked accounts locked; lifts only temporary locks (BUG-R2-014)', async () => {
        const h = { cookie: cookie('owner'), 'x-test-token': token };
        const set = (user: string, lockedUntil: string | null) =>
          db.withContext(t.ctx(), (tx) =>
            tx.query(
              `UPDATE app_user SET status = 'locked', failed_login_count = 5,
                 locked_until = $2::timestamptz WHERE id = $1`,
              [t.users[user]!.id, lockedUntil],
            ),
          );
        await set('hk', null); // like seed qa.locked: intentional, owner-only unlock
        await set('fd', '2099-01-01T00:00:00Z'); // temporary lockout
        const res = await post(`${T}/rate-limits/reset`, { usernamePrefix: 't.' }, h);
        expect(res.statusCode).toBe(200);
        const state = async (user: string) =>
          (
            await db.withContext(t.ctx(), (tx) =>
              tx.query<{ status: string; lu: Date | null; f: number }>(
                'SELECT status, locked_until AS lu, failed_login_count AS f FROM app_user WHERE id = $1',
                [t.users[user]!.id],
              ),
            )
          ).rows[0];
        expect(await state('hk')).toEqual({ status: 'locked', lu: null, f: 0 });
        expect(await state('fd')).toEqual({ status: 'active', lu: null, f: 0 });
        await db.withContext(t.ctx(), (tx) =>
          tx.query(`UPDATE app_user SET status = 'active' WHERE id = $1`, [t.users.hk!.id]),
        );
      });
    });
  },
);
