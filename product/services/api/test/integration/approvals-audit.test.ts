/**
 * BE-A Sprint 1 on a real Nest/Fastify app + PostgreSQL (ottimo_app, RLS):
 * - CSRF/Origin in the guard (SR-SES-04), If-Match/ETag → 412 VERSION_CONFLICT (ADR-009)
 * - US-007 approvals: routing by limits (BR-433), no self-approval (BR-432, K6), re-auth with the approver's
 *   own password + lock (SR-RL-02), escalation committed + 403, concurrency, scopes, push to outbox
 * - US-006 activity log: money audit, scope own, ≤ 92 days, pagination
 * - rbac-cases.json rows of these operations (role gate)
 */
import 'reflect-metadata';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Body, Controller, Global, Module, Param, Patch, Post, Req, Res } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { MutableClock, SystemClock } from '../../src/clock';
import { PgClockStore } from '../../src/db/clock-store';
import type { Database, Tx } from '../../src/db/database';
import { createHttpAdapter } from '../../src/http';
import { ApprovalsModule } from '../../src/modules/approvals/approvals.module';
import {
  ApprovalService,
  type SubmitInput,
} from '../../src/modules/approvals/public/approval.service';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { AuditService } from '../../src/modules/audit/public/audit.service';
import { type GuardedRequest, sha256Hex } from '../../src/shared/http/auth.guard';
import { CSRF_VERIFIER } from '../../src/shared/http/csrf';
import { Operation } from '../../src/shared/http/operation';
import { expectedVersion, setETag, versionedUpdate } from '../../src/shared/http/precondition';
import { UnitOfWork, applyResult } from '../../src/shared/http/unit-of-work';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

const ADMIN = 'https://desk.test';
const GUEST = 'https://g.test';
const PASSWORD = 'correct-horse-battery';
const CSRF_KEY = 'k'.repeat(40);
const csrfFor = (sessionToken: string) =>
  createHmac('sha256', CSRF_KEY)
    .update(`csrf:${sha256Hex(sessionToken)}`)
    .digest('base64url');

/** Stand-in for the identity module's SessionService (same algorithm). */
@Global()
@Module({
  providers: [
    {
      provide: CSRF_VERIFIER,
      useValue: {
        verifyCsrf: (sessionId: string, token: string | undefined) =>
          !!token &&
          token === createHmac('sha256', CSRF_KEY).update(`csrf:${sessionId}`).digest('base64url'),
      },
    },
  ],
  exports: [CSRF_VERIFIER],
})
class TestCsrfModule {}

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

/** Probe for If-Match on a real versioned row (app_user.version) and a public write (login). */
@Controller('v1')
class ProbeController {
  constructor(private readonly uow: UnitOfWork) {}

  @Patch('users/:userId')
  @Operation('updateUser')
  async update(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('userId') userId: string,
    @Body() body: { displayName: string },
  ) {
    const result = await this.uow.run(req, async (tx: Tx) => {
      await versionedUpdate(
        tx,
        `UPDATE app_user SET display_name = $3, version = version + 1 WHERE id = $1 AND version = $2`,
        [userId, expectedVersion(req), body.displayName],
        { id: userId, currentVersionSql: 'SELECT version FROM app_user WHERE id = $1' },
      );
      const { rows } = await tx.query<{ version: number }>(
        'SELECT version FROM app_user WHERE id = $1',
        [userId],
      );
      setETag(reply, rows[0]?.version ?? 0);
      return { status: 200, body: { id: userId, displayName: body.displayName, status: 'active' } };
    });
    return applyResult(reply, result);
  }

  @Post('auth/login')
  @Operation('login')
  login(): Record<string, never> {
    return {};
  }
}

const rbacCases = JSON.parse(
  readFileSync(
    join(__dirname, '..', '..', '..', '..', 'tests', 'fixtures', 'rbac-cases.json'),
    'utf8',
  ),
) as {
  cases: { id: string; operationId: string; roles: string[]; expected: string; subject: string }[];
};

describe.skipIf(!HAS_DB)(
  'BE-A Sprint 1 – CSRF, If-Match, approvals (US-007), audit log (US-006)',
  () => {
    let db: Database;
    let app: NestFastifyApplication;
    let clock: MutableClock;
    let approvals: ApprovalService;
    let audit: AuditService;
    let t: TestTenant;

    const users = {
      owner: ['owner'],
      owner2: ['owner'],
      mgr: ['manager'],
      mgr2: ['manager'],
      fdl: ['front_desk_lead'],
      fdl2: ['front_desk_lead'],
      fd: ['front_desk'],
      hk: ['housekeeping'],
      mt: ['maintenance'],
      sal: ['sales_staff'],
      ctv: ['collaborator'],
      fdsal: ['front_desk', 'sales_staff'],
      hkmt: ['housekeeping', 'maintenance'],
    };

    async function setup(): Promise<TestTenant> {
      const tenant = await createTenant(db, { users, now: new Date() });
      const pw = await hash(PASSWORD);
      await db.withContext(tenant.ctx(), async (tx) => {
        await tx.query('UPDATE app_user SET password_hash = $1 WHERE organization_id = $2', [
          pw,
          tenant.organizationId,
        ]);
      });
      await setParam(db, tenant, 'foc_limits', {
        front_desk_lead: { perTimeVnd: 300000, perMonthVnd: 1500000 },
        manager: { perTime: 'one_night_rate' },
        owner: { perTime: 'unlimited' },
      });
      await setParam(db, tenant, 'foc_approval_push_roles', 'lowest_sufficient_role_plus_manager');
      await setParam(db, tenant, 'foc_self_apply.front_desk.per_time', 100000);
      await setParam(db, tenant, 'foc_self_apply.front_desk.per_month', 500000);
      await setParam(db, tenant, 'foc_self_apply.front_desk.categories', ['minibar']);
      return tenant;
    }

    beforeAll(async () => {
      db = appDatabase(12);
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
            auth: { cookieSecurePrefix: false, allowedOrigins: { staff: [ADMIN], guest: [GUEST] } },
            imports: [TestCsrfModule, AuditModule, ApprovalsModule],
          }),
        ],
        controllers: [ProbeController],
      }).compile();
      app = moduleRef.createNestApplication<NestFastifyApplication>(
        createHttpAdapter({ logLevel: 'silent', trustProxy: false }),
      );
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
      approvals = app.get(ApprovalService);
      audit = app.get(AuditService);
      t = await setup();
    });
    afterAll(async () => {
      await clock?.stop();
      await app?.close();
      await db?.close();
    });

    const P = (tenant = t) => `/v1/properties/${tenant.propertyIds[0]}`;
    const cookie = (u: string, tenant = t) => `ottimo_sid=${tenant.users[u]!.sessionToken}`;
    const get = (url: string, u?: string, tenant = t) =>
      app.inject({ method: 'GET', url, headers: u ? { cookie: cookie(u, tenant) } : {} });
    /** Browser-like write: Origin + X-CSRF-Token + Idempotency-Key unless overridden. */
    const write = (
      method: 'POST' | 'PATCH',
      url: string,
      u: string,
      body: unknown = {},
      headers: Record<string, string | undefined> = {},
      tenant = t,
    ) => {
      const h: Record<string, string> = {
        cookie: cookie(u, tenant),
        origin: ADMIN,
        'x-csrf-token': csrfFor(tenant.users[u]!.sessionToken),
        'idempotency-key': randomUUID(),
      };
      for (const [k, v] of Object.entries(headers)) {
        if (v === undefined) delete h[k];
        else h[k] = v;
      }
      return app.inject({ method, url, payload: body as object, headers: h });
    };
    const approve = (id: string, u: string, secret = PASSWORD, tenant = t, headers = {}) =>
      write(
        'POST',
        `${P(tenant)}/approval-requests/${id}/actions/approve`,
        u,
        { authMethod: 'password', secret },
        headers,
        tenant,
      );
    const reject = (id: string, u: string, reason: unknown = 'Không đủ điều kiện', tenant = t) =>
      write(
        'POST',
        `${P(tenant)}/approval-requests/${id}/actions/reject`,
        u,
        { authMethod: 'password', secret: PASSWORD, reason },
        {},
        tenant,
      );

    async function submit(u: string, input: Partial<SubmitInput> = {}, tenant = t) {
      const user = tenant.users[u]!;
      return db.withContext({ ...tenant.ctx(), userId: user.id, actorType: 'user' }, (tx) =>
        approvals.submit(
          tx,
          { userId: user.id, roles: user.roles },
          {
            type: 'foc',
            amountVnd: 210000,
            reasonCode: 'regular_vip',
            targetType: 'reservation',
            targetId: randomUUID(),
            targetCode: 'OTM-00171',
            limitBasisVnd: 1042000,
            ...input,
          },
        ),
      );
    }

    async function auditRows(tenant: TestTenant, action: string) {
      return db.withContext(
        tenant.ctx(),
        async (tx) =>
          (
            await tx.query<{
              action: string;
              reason: string | null;
              entity_code: string | null;
              after: Record<string, unknown>;
            }>(
              `SELECT action, reason, entity_code, after FROM audit_event WHERE organization_id = $1 AND action = $2`,
              [tenant.organizationId, action],
            )
          ).rows,
      );
    }

    // ───────────────────────── CSRF / Origin (SR-SES-04) ─────────────────────────
    describe('CSRF + Origin (guard, before trusted device / idempotency / roles)', () => {
      it('staff write without Origin, with a foreign Origin, or without X-CSRF-Token → 403 + access.denied', async () => {
        const r = await submit('fd');
        for (const [headers, reason] of [
          [{ origin: undefined }, 'ORIGIN'],
          [{ origin: 'https://evil.example' }, 'ORIGIN'],
          [{ origin: GUEST }, 'ORIGIN'], // guest-web origin may not write staff operations
          [{ 'x-csrf-token': undefined }, 'CSRF'],
          [{ 'x-csrf-token': csrfFor(t.users.fd!.sessionToken) }, 'CSRF'], // token of another session
        ] as const) {
          const res = await approve(r.id, 'fdl', PASSWORD, t, headers);
          expect(res.statusCode).toBe(403);
          expect(res.json().code).toBe('FORBIDDEN_ACTION');
          const denied = await db.withContext(t.ctx(), (tx) =>
            tx.query(
              `SELECT 1 FROM audit_event WHERE organization_id = $1 AND action = 'access.denied' AND reason = $2`,
              [t.organizationId, reason],
            ),
          );
          expect(denied.rowCount).toBeGreaterThan(0);
        }
        // nothing happened to the request
        const list = await get(`${P()}/approval-requests?status=pending`, 'owner');
        expect(list.json().data.some((d: { id: string }) => d.id === r.id)).toBe(true);
      });

      it('CSRF is checked before Idempotency-Key and roles (no 428 / role 403 leak first)', async () => {
        const res = await write(
          'POST',
          `${P()}/approval-requests/${randomUUID()}/actions/approve`,
          'hk',
          {},
          {
            'x-csrf-token': undefined,
            'idempotency-key': undefined,
          },
        );
        expect(res.statusCode).toBe(403);
        expect(res.json().detail).toBe('CSRF token');
      });

      it('reads need neither; public write (login) needs an allowed Origin', async () => {
        expect((await get(`${P()}/approval-requests`, 'fd')).statusCode).toBe(200);
        const bad = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: {},
          headers: { origin: 'https://evil.example' },
        });
        expect(bad.statusCode).toBe(403);
        const ok = await app.inject({
          method: 'POST',
          url: '/v1/auth/login',
          payload: {},
          headers: { origin: GUEST },
        });
        expect(ok.statusCode).toBe(201);
      });
    });

    // ───────────────────────── If-Match / ETag ─────────────────────────
    describe('If-Match → 412 VERSION_CONFLICT (ADR-009)', () => {
      it('missing 428, malformed 422, stale 412 with currentVersion, current 200 + ETag', async () => {
        const url = `/v1/users/${t.users.hkmt!.id}`;
        expect((await write('PATCH', url, 'owner', { displayName: 'A' })).statusCode).toBe(428);
        const bad = await write('PATCH', url, 'owner', { displayName: 'A' }, { 'if-match': '*' });
        expect(bad.statusCode).toBe(422);
        const stale = await write(
          'PATCH',
          url,
          'owner',
          { displayName: 'A' },
          { 'if-match': '"7"' },
        );
        expect(stale.statusCode).toBe(412);
        expect(stale.json()).toMatchObject({ code: 'VERSION_CONFLICT', currentVersion: 1 });
        const ok = await write('PATCH', url, 'owner', { displayName: 'A' }, { 'if-match': '"1"' });
        expect(ok.statusCode).toBe(200);
        expect(ok.headers.etag).toBe('"2"');
        // the old version is now stale
        expect(
          (await write('PATCH', url, 'owner', { displayName: 'B' }, { 'if-match': '"1"' })).json(),
        ).toMatchObject({
          code: 'VERSION_CONFLICT',
          currentVersion: 2,
        });
      });
    });

    // ───────────────────────── US-007 ─────────────────────────
    describe('US-007 approvals', () => {
      it('AC1/AC2: FD request 210.000 routed to FDL; FDL approves with own password → approved, real name; audit money + push', async () => {
        const r = await submit('fd');
        expect(r).toMatchObject({ status: 'pending', required_role: 'front_desk_lead' });
        const res = await approve(r.id, 'fdl');
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({
          id: r.id,
          status: 'approved',
          approverName: 'fdl',
          approverRole: 'front_desk_lead',
          requestedBy: 'fd',
          reservationCode: 'OTM-00171',
          amountVnd: 210000,
        });
        const rows = await auditRows(t, 'approval.approved');
        expect(rows.find((x) => x.after.amountVnd === 210000)).toMatchObject({
          entity_code: 'OTM-00171',
        });
        const push = await db.withContext(t.ctx(), (tx) =>
          tx.query<{ payload: { roles: string[]; userIds: string[] } }>(
            `SELECT payload FROM outbox_message WHERE dedupe_key = $1`,
            [`approval_requested:${r.id}:front_desk_lead`],
          ),
        );
        // BR-432 v0.3: lowest sufficient role + manager; not the owner; never the requester.
        expect(push.rows[0]?.payload.roles).toEqual(['front_desk_lead', 'manager']);
        expect(push.rows[0]?.payload.userIds).not.toContain(t.users.fd!.id);
        expect(push.rows[0]?.payload.userIds).not.toContain(t.users.owner!.id);
      });

      it('AC4 / BR-432: nobody approves their own request (FDL → 403 SELF_APPROVAL_FORBIDDEN); MGR may within limit', async () => {
        const own = await submit('fdl');
        const res = await approve(own.id, 'fdl');
        expect(res.statusCode).toBe(403);
        expect(res.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
        const rej = await reject(own.id, 'fdl');
        expect(rej.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
        // DB constraint K6 holds even if code were wrong
        await expect(
          db.withContext(t.ctx(), (tx) =>
            tx.query(
              `UPDATE approval_request SET status = 'approved', approver_id = requested_by, approver_role_snapshot = 'front_desk_lead', decided_at = now() WHERE id = $1`,
              [own.id],
            ),
          ),
        ).rejects.toThrow(/approval_request_no_self_approval/);
        // another FDL can approve it
        expect((await approve(own.id, 'fdl2')).statusCode).toBe(200);
      });

      it('A2: manager submitting within 1 night is self-applied; FD minibar self-apply only after re-auth and within month', async () => {
        const m = await submit('mgr', { amountVnd: 500000 });
        expect(m).toMatchObject({
          status: 'approved',
          self_applied: true,
          approver_id: t.users.mgr!.id,
        });
        const noReauth = await submit('fd', { amountVnd: 35000, lineCategory: 'minibar' });
        expect(noReauth.status).toBe('pending');
        const ok = await submit('fd', {
          amountVnd: 35000,
          lineCategory: 'minibar',
          requesterReauthenticated: true,
        });
        expect(ok).toMatchObject({
          status: 'approved',
          self_applied: true,
          approver_role_snapshot: 'front_desk',
        });
        const notMinibar = await submit('fd', {
          amountVnd: 35000,
          lineCategory: 'late_checkout',
          requesterReauthenticated: true,
        });
        expect(notMinibar.status).toBe('pending');
      });

      it('AC3 / BR-433: 521.000 > FDL 300.000 → FDL gets 403 APPROVAL_LIMIT_EXCEEDED, request escalated (committed) → manager approves', async () => {
        const r = await submit('fd', { amountVnd: 521000 });
        expect(r.required_role).toBe('manager'); // routed directly (≤ 1 night 1.042.000)
        const pending = await submit('fd', { amountVnd: 250000 });
        // force the FDL path: FDL monthly limit used up → escalate
        const res = await approve(r.id, 'fdl');
        expect(res.statusCode).toBe(403);
        expect(res.json()).toMatchObject({ code: 'APPROVAL_LIMIT_EXCEEDED', approver: 'manager' });
        const after = await get(`${P()}/approval-requests?status=escalated`, 'owner');
        expect(after.json().data.find((d: { id: string }) => d.id === r.id)?.status).toBe(
          'escalated',
        );
        expect((await approve(r.id, 'mgr')).json().status).toBe('approved');
        // above one night → owner
        const big = await submit('fd', { amountVnd: 2000000 });
        expect(big.required_role).toBe('owner');
        const mgrTry = await approve(big.id, 'mgr');
        expect(mgrTry.json()).toMatchObject({ code: 'APPROVAL_LIMIT_EXCEEDED', approver: 'owner' });
        const push = await db.withContext(t.ctx(), (tx) =>
          tx.query<{ payload: { roles: string[] } }>(
            `SELECT payload FROM outbox_message WHERE dedupe_key = $1`,
            [`approval_requested:${big.id}:owner`],
          ),
        );
        expect(push.rows[0]?.payload.roles).toContain('owner'); // owner pushed only above manager limit
        expect((await approve(big.id, 'owner')).json().status).toBe('approved');
        expect((await approve(pending.id, 'fdl2')).statusCode).toBe(200);
      });

      it('BR-433 monthly: FDL 1.500.000/month for others – the request that goes over escalates', async () => {
        const tt = await setup();
        for (let i = 0; i < 5; i++) {
          const r = await submit('fd', { amountVnd: 300000 }, tt);
          expect((await approve(r.id, 'fdl', PASSWORD, tt)).statusCode).toBe(200);
        }
        const list = await get(`${P(tt)}/approval-requests`, 'fdl', tt);
        expect(list.json().data[0].approverRemainingMonthlyVnd).toBe(0);
        const over = await submit('fd', { amountVnd: 100000 }, tt);
        const res = await approve(over.id, 'fdl', PASSWORD, tt);
        expect(res.json()).toMatchObject({ code: 'APPROVAL_LIMIT_EXCEEDED', approver: 'manager' });
        // now routed to the manager: another FDL is refused too, and a replay of that key answers the same 403
        const key = randomUUID();
        const again = await approve(over.id, 'fdl2', PASSWORD, tt, { 'idempotency-key': key });
        expect(again.json()).toMatchObject({
          code: 'APPROVAL_LIMIT_EXCEEDED',
          approver: 'manager',
        });
        const replay = await approve(over.id, 'fdl2', PASSWORD, tt, { 'idempotency-key': key });
        expect(replay.statusCode).toBe(403);
        expect(replay.json()).toMatchObject({
          code: 'APPROVAL_LIMIT_EXCEEDED',
          approver: 'manager',
        });
        expect((await approve(over.id, 'mgr', PASSWORD, tt)).json().status).toBe('approved');
      });

      it('re-auth: wrong password 401 REAUTH_FAILED; 5 failures → 429 RATE_LIMITED even with the right one; pin → 422', async () => {
        const tt = await setup();
        const r = await submit('fd', {}, tt);
        for (let i = 0; i < 5; i++) {
          const res = await approve(r.id, 'fdl', 'wrong-password', tt);
          expect(res.statusCode).toBe(401);
          expect(res.json().code).toBe('REAUTH_FAILED');
        }
        const locked = await approve(r.id, 'fdl', PASSWORD, tt);
        expect(locked.statusCode).toBe(429);
        expect(Number(locked.headers['retry-after'])).toBeGreaterThan(0);
        expect((await auditRows(tt, 'approval.reauth_locked')).length).toBe(1);
        const pin = await write(
          'POST',
          `${P(tt)}/approval-requests/${r.id}/actions/approve`,
          'fdl2',
          { authMethod: 'pin', secret: '123456' },
          {},
          tt,
        );
        expect(pin.statusCode).toBe(422);
        // the lock is per approver: fdl2 is not affected
        expect((await approve(r.id, 'fdl2', PASSWORD, tt)).statusCode).toBe(200);
      });

      it('two approvers at once → exactly one approves, the other gets 409 INVALID_TRANSITION', async () => {
        const r = await submit('fd');
        const [a, b] = await Promise.all([approve(r.id, 'mgr'), approve(r.id, 'mgr2')]);
        expect([a.statusCode, b.statusCode].sort()).toEqual([200, 409]);
        expect([a, b].find((x) => x.statusCode === 409)?.json().code).toBe('INVALID_TRANSITION');
      });

      it('reject: reason required (422 REASON_REQUIRED), card number refused, then rejected with reason in audit', async () => {
        const r = await submit('fd');
        const short = await reject(r.id, 'fdl', 'x');
        expect(short.statusCode).toBe(422);
        expect(short.json().errors).toEqual([{ field: 'reason', code: 'REASON_REQUIRED' }]);
        const card = await reject(r.id, 'fdl', 'thẻ 4111 1111 1111 1111');
        expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
        const ok = await reject(r.id, 'fdl', 'Không đủ điều kiện FOC');
        expect(ok.json()).toMatchObject({
          status: 'rejected',
          decisionNote: 'Không đủ điều kiện FOC',
        });
        expect(
          (await auditRows(t, 'approval.rejected')).some(
            (x) => x.reason === 'Không đủ điều kiện FOC',
          ),
        ).toBe(true);
        expect((await approve(r.id, 'mgr')).statusCode).toBe(409);
      });

      it('cancel (A6): only the requester (others 404), only while pending (409 after)', async () => {
        const r = await submit('ctv', {
          type: 'quote_extension',
          amountVnd: 0,
          reasonCode: 'other',
          reasonNote: 'Khách xin thêm 2 ngày',
        });
        expect(r.required_role).toBe('manager');
        expect(
          (await write('POST', `${P()}/approval-requests/${r.id}/actions/cancel`, 'sal'))
            .statusCode,
        ).toBe(404);
        const ok = await write('POST', `${P()}/approval-requests/${r.id}/actions/cancel`, 'ctv');
        expect(ok.json().status).toBe('cancelled');
        expect(
          (await write('POST', `${P()}/approval-requests/${r.id}/actions/cancel`, 'ctv'))
            .statusCode,
        ).toBe(409);
      });

      it('list scopes in SQL: CTV/SAL own only, FDL within limit or own, OWN all; remaining monthly only for OWN/MGR/FDL', async () => {
        const tt = await setup();
        const mine = await submit(
          'ctv',
          { type: 'quote_extension', amountVnd: 0, reasonCode: 'x' },
          tt,
        );
        const fdReq = await submit('fd', {}, tt);
        const big = await submit('fd', { amountVnd: 900000 }, tt);
        const ids = async (u: string) =>
          ((await get(`${P(tt)}/approval-requests`, u, tt)).json().data as { id: string }[])
            .map((d) => d.id)
            .sort();
        expect(await ids('ctv')).toEqual([mine.id]);
        expect(await ids('sal')).toEqual([]);
        expect(await ids('fdl')).toEqual([fdReq.id]);
        expect(await ids('owner')).toEqual([mine.id, fdReq.id, big.id].sort());
        const ctvView = (await get(`${P(tt)}/approval-requests`, 'ctv', tt)).json().data[0];
        expect('approverRemainingMonthlyVnd' in ctvView).toBe(false);
        const fdlView = (await get(`${P(tt)}/approval-requests`, 'fdl', tt)).json().data[0];
        expect(fdlView.approverRemainingMonthlyVnd).toBe(1500000);
        // pagination
        const p1 = (await get(`${P(tt)}/approval-requests?limit=2`, 'owner', tt)).json();
        expect(p1.data).toHaveLength(2);
        const p2 = (
          await get(`${P(tt)}/approval-requests?limit=2&cursor=${p1.page.nextCursor}`, 'owner', tt)
        ).json();
        expect(p2.data).toHaveLength(1);
        expect(p2.page.nextCursor).toBeNull();
      });

      it('another property / organisation: approval id → 404', async () => {
        const other = await setup();
        const r = await submit('fd', {}, other);
        expect((await approve(r.id, 'fdl')).statusCode).toBe(404);
      });
    });

    // ───────────────────────── US-006 ─────────────────────────
    describe('US-006 activity log', () => {
      it('AC1: money audit written by the shared writer is listed with code, before/after, reason, actor name', async () => {
        const tt = await setup();
        const fd = tt.users.fd!;
        await db.withContext({ ...tt.ctx(), userId: fd.id, actorType: 'user' }, (tx) =>
          audit.recordMoney(tx, {
            action: 'folio_line.adjusted',
            entityType: 'approval_request',
            entityId: randomUUID(),
            entityCode: 'F26-000123',
            before: { amountVnd: 100000, internalNote: 'dropped' },
            after: { amountVnd: 90000 },
            reason: 'Sai giá',
          }),
        );
        const res = await get(`${P(tt)}/audit-events?category=money`, 'owner', tt);
        expect(res.statusCode).toBe(200);
        expect(res.json().data[0]).toMatchObject({
          actorType: 'user',
          actorName: 'fd',
          category: 'money',
          action: 'folio_line.adjusted',
          entityCode: 'F26-000123',
          before: { amountVnd: 100000 },
          after: { amountVnd: 90000 },
          reason: 'Sai giá',
        });
        expect(res.json().data[0].before.internalNote).toBeUndefined(); // allowlist (SR-AUD-03)
        expect(res.json().data[0].occurredAt).toMatch(/\+07:00$/);
      });

      it('AC2: FD/FDL see only their own events (actor filter ignored); OWN filters by actor; HK 403', async () => {
        const tt = await setup();
        const r = await submit('fd', {}, tt);
        await approve(r.id, 'fdl', PASSWORD, tt);
        const fdView = (
          await get(`${P(tt)}/audit-events?actorUserId=${tt.users.fdl!.id}`, 'fd', tt)
        ).json().data;
        expect(fdView.length).toBeGreaterThan(0);
        expect(fdView.every((e: { actorName: string }) => e.actorName === 'fd')).toBe(true);
        const ownerView = (
          await get(`${P(tt)}/audit-events?actorUserId=${tt.users.fdl!.id}`, 'owner', tt)
        ).json().data;
        expect(ownerView.map((e: { action: string }) => e.action)).toContain('approval.approved');
        expect(ownerView.every((e: { actorName: string }) => e.actorName === 'fdl')).toBe(true);
        expect((await get(`${P(tt)}/audit-events`, 'hk', tt)).statusCode).toBe(403);
      });

      it('date range ≤ 92 days, from ≤ to, valid dates, limit ≤ 100', async () => {
        const q = (s: string) => get(`${P()}/audit-events?${s}`, 'owner');
        expect((await q('from=2026-07-01&to=2026-09-30')).statusCode).toBe(200); // 92 days
        const long = await q('from=2026-07-01&to=2026-10-01');
        expect(long.statusCode).toBe(422);
        expect(long.json().errors).toEqual([{ field: 'to', code: 'DATE_RANGE_TOO_LONG' }]);
        expect((await q('from=2026-10-10&to=2026-10-01')).json().errors[0].code).toBe('DATE_ORDER');
        expect((await q('from=2026-02-30')).json().errors[0].code).toBe('DATE_INVALID');
        expect((await q('limit=101')).statusCode).toBe(422);
        expect((await q('category=bogus')).statusCode).toBe(422);
        expect((await q('cursor=not-a-cursor')).statusCode).toBe(422);
      });
    });

    // ───────────────────────── rbac-cases.json (role gate) ─────────────────────────
    describe('rbac-cases.json – role gate of BE-A operations', () => {
      const OPS = [
        'listAuditEvents',
        'listApprovalRequests',
        'approveRequest',
        'rejectRequest',
        'cancelRequest',
      ];
      const SUBJECT: Record<string, string> = {
        'qa.owner': 'owner',
        'qa.mgr': 'mgr',
        'qa.fdl': 'fdl',
        'qa.fd': 'fd',
        'qa.hk': 'hk',
        'qa.mt': 'mt',
        'qa.sal': 'sal',
        'qa.ctv1': 'ctv',
        'qa.fdsal': 'fdsal',
        'qa.hkmt': 'hkmt',
      };
      const cases = rbacCases.cases.filter((c) => OPS.includes(c.operationId));

      it('covers every role of these operations', () => {
        expect(cases.length).toBe(OPS.length * 11);
      });

      it.each(cases.map((c) => [c.id, c] as const))('%s', async (_id, c) => {
        const u = SUBJECT[c.subject];
        let res;
        if (!u) {
          // guest-session / no staff cookie → 401
          res = await app.inject({
            method: 'GET',
            url: `${P()}/approval-requests`,
            headers: { cookie: 'ottimo_gsid=x' },
          });
          expect(res.statusCode).toBe(Number(c.expected));
          return;
        }
        switch (c.operationId) {
          case 'listAuditEvents':
            res = await get(`${P()}/audit-events`, u);
            break;
          case 'listApprovalRequests':
            res = await get(`${P()}/approval-requests`, u);
            break;
          case 'approveRequest': {
            const r = await submit('ctv', {
              type: 'checkin_room_not_ready',
              amountVnd: 0,
              reasonCode: 'x',
            });
            res = await approve(r.id, u);
            break;
          }
          case 'rejectRequest': {
            const r = await submit('ctv', {
              type: 'checkin_room_not_ready',
              amountVnd: 0,
              reasonCode: 'x',
            });
            res = await reject(r.id, u);
            break;
          }
          default: {
            // A pending request of the caller (owner/manager submissions would be self-applied – A2).
            const r = await submit('ctv', {
              type: 'quote_extension',
              amountVnd: 0,
              reasonCode: 'x',
            });
            await db.withContext(t.ctx(), (tx) =>
              tx.query('UPDATE approval_request SET requested_by = $2 WHERE id = $1', [
                r.id,
                t.users[u]!.id,
              ]),
            );
            res = await write('POST', `${P()}/approval-requests/${r.id}/actions/cancel`, u);
          }
        }
        if (c.expected === '2xx') {
          expect(res.statusCode, JSON.stringify(res.json())).toBeLessThan(300);
        } else {
          expect(res.statusCode).toBe(Number(c.expected));
          if (c.expected === '403') expect(res.json().code).toBe('FORBIDDEN_ACTION');
        }
      });
    });
  },
);
