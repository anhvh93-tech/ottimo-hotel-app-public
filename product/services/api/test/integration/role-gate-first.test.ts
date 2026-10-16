/**
 * Role gate BEFORE body/password checks, one connection per request, idempotency without secrets – on the
 * production module list (featureModules: platform, identity, guests, audit, approvals) and the real DB.
 * - BUG-R2-005 / FB-R2-QA-BE-01: every implemented write operation (with or without Idempotency-Key), called by a role outside
 *   its x-roles with an EMPTY body → 403 FORBIDDEN_ACTION + exactly one audit_event access.denied
 *   (generated from the controllers' @Operation + openapi-meta, so Sprint 2 operations are covered too).
 * - ADR-009 replay: a key the user completed before losing the role still answers the stored response.
 * - FB-R2-ARC-BE-01 / -15: pool of 2 connections – 3 approvals and 5 forbidden writes at once all finish
 *   (no request waits for a second connection); a nested connection inside a unit of work is refused.
 * - FB-R2-ARC-BE-04 / -15: two concurrent FOC self-applications cannot both use the monthly remainder;
 *   owner/manager self-applications count against their own monthly limit.
 * - FB-R2-SEC-BE-06: idempotency_key.request_hash does not depend on the secret.
 */
import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import { ModulesContainer } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Database, runInUnitOfWork } from '../../src/db/database';
import { OPENAPI_META } from '../../src/generated/openapi-meta';
import {
  ApprovalService,
  type SubmitInput,
} from '../../src/modules/approvals/public/approval.service';
import { OPERATION_KEY } from '../../src/shared/http/operation';
import { canonicalJson, requestHash } from '../../src/shared/http/unit-of-work';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  seedSprint1Params,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

const STAFF_ROLES = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'housekeeping',
  'maintenance',
  'sales_staff',
  'collaborator',
] as const;

const USERS: Record<string, string[]> = {
  ...Object.fromEntries(STAFF_ROLES.map((r) => [r, [r]])),
  mgr2: ['manager'],
  fdl2: ['front_desk_lead'],
  fd2: ['front_desk'],
};

/** operationIds bound to a controller method of the running app. */
function implementedOperations(fa: FeatureApp): Set<string> {
  const ops = new Set<string>();
  for (const mod of fa.app.get(ModulesContainer).values()) {
    for (const wrapper of mod.controllers.values()) {
      const proto = (wrapper.metatype as { prototype?: object } | null)?.prototype;
      if (!proto) continue;
      for (const name of Object.getOwnPropertyNames(proto)) {
        const fn = (proto as Record<string, unknown>)[name];
        if (typeof fn !== 'function') continue;
        const op = Reflect.getMetadata(OPERATION_KEY, fn) as string | undefined;
        if (op) ops.add(op);
      }
    }
  }
  return ops;
}

async function setupTenant(db: Database): Promise<TestTenant> {
  const t = await createTenant(db, { users: USERS });
  await seedSprint1Params(db, t);
  for (const u of Object.keys(USERS)) await setPassword(db, t, u);
  await setParam(db, t, 'foc_limits', {
    front_desk_lead: { perTimeVnd: 300000, perMonthVnd: 1500000 },
    manager: { perTime: 'one_night_rate', perMonthVnd: 600000 },
    owner: { perTime: 'unlimited' },
  });
  await setParam(db, t, 'foc_approval_push_roles', 'lowest_sufficient_role_plus_manager');
  await setParam(db, t, 'foc_self_apply.front_desk.per_time', 300000);
  await setParam(db, t, 'foc_self_apply.front_desk.per_month', 500000);
  await setParam(db, t, 'foc_self_apply.front_desk.categories', ['minibar']);
  return t;
}

describe.skipIf(!HAS_DB)(
  'role gate first, one connection per request (BUG-R2-005, ARC-BE-01)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;

    beforeAll(async () => {
      db = appDatabase(6);
      fa = await startFeatureApp(db);
      t = await setupTenant(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    const submit = (u: string, input: Partial<SubmitInput> = {}, tenant = t) => {
      const user = tenant.users[u]!;
      return db.withContext({ ...tenant.ctx(), userId: user.id, actorType: 'user' }, (tx) =>
        fa.app.get(ApprovalService).submit(
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
    };

    const deniedCount = async (tenant: TestTenant, operationId: string) =>
      (
        await db.withContext(tenant.ctx(), (tx) =>
          tx.query(
            `SELECT 1 FROM audit_event
            WHERE organization_id = $1 AND action = 'access.denied' AND entity_id = $2`,
            [tenant.organizationId, operationId],
          ),
        )
      ).rowCount ?? 0;

    describe('forbidden role + empty body → 403 + access.denied (every write operation)', () => {
      const cases = () => {
        const implemented = implementedOperations(fa);
        return Object.entries(OPENAPI_META.operations)
          .filter(
            // Guest-session operations (x-roles [guest], BE-C S3) have no staff role: a staff caller is
            // 401 there, never 403 – covered by rbac-sprint3-bec.test.ts.
            ([id, m]) =>
              implemented.has(id) &&
              m.method !== 'GET' &&
              !m.public &&
              !m.trustedDevice &&
              !m.roles.includes('guest'),
          )
          .map(([id, m]) => ({
            id,
            meta: m,
            role: STAFF_ROLES.find((r) => !m.roles.includes(r) && !m.roles.includes('any_staff')),
          }))
          .filter((c) => c.role !== undefined);
      };

      it('covers the Sprint 1 operations of both BE streams', () => {
        const ids = cases().map((c) => c.id);
        for (const op of ['createUser', 'createRoom', 'trustCurrentDevice', 'rejectRequest'])
          expect(ids).toContain(op); // the four of BUG-R2-005
        expect(ids).toContain('approveRequest');
      });

      it('each → 403 FORBIDDEN_ACTION and one access.denied, never 422/401/429', async () => {
        for (const c of cases()) {
          const url = c.meta.path.replace(/\{(\w+)\}/g, (_m, name: string) =>
            name === 'propertyId' ? t.propertyIds[0]! : randomUUID(),
          );
          const before = await deniedCount(t, c.id);
          const res = await Client.of(fa, t, c.role!).send(
            c.meta.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            url,
            c.meta.method === 'DELETE' ? undefined : {},
            c.meta.ifMatch ? { 'if-match': '"1"' } : {},
          );
          expect(res.statusCode, `${c.id} as ${c.role}: ${res.body}`).toBe(403);
          expect(res.json().code, c.id).toBe('FORBIDDEN_ACTION');
          expect(await deniedCount(t, c.id), c.id).toBe(before + 1);
        }
      });

      it('wrong passwords from a forbidden role never reach the re-auth counter', async () => {
        const r = await submit('front_desk');
        for (let i = 0; i < 6; i++) {
          const res = await Client.of(fa, t, 'housekeeping').send(
            'POST',
            `${P(t)}/approval-requests/${r.id}/actions/approve`,
            { authMethod: 'password', secret: 'wrong-password' },
          );
          expect(res.statusCode).toBe(403);
        }
        const { rows } = await db.withContext(t.ctx(), (tx) =>
          tx.query<{ n: number }>(
            'SELECT approval_pin_failed_count AS n FROM app_user WHERE id = $1',
            [t.users.housekeeping!.id],
          ),
        );
        expect(rows[0]?.n).toBe(0);
      });

      it('replay: a key completed before the role was removed still returns the stored response', async () => {
        const tt = await setupTenant(db);
        const r = await submit('front_desk', {}, tt);
        const key = randomUUID();
        const url = `${P(tt)}/approval-requests/${r.id}/actions/approve`;
        const body = { authMethod: 'password', secret: TEST_PASSWORD };
        const first = await Client.of(fa, tt, 'fdl2').send('POST', url, body, {
          'idempotency-key': key,
        });
        expect(first.statusCode).toBe(200);
        // fdl2 loses the lead role (keeps an unrelated one at the property)
        await db.withContext(tt.ctx(), async (tx) => {
          await tx.query(`UPDATE user_property_role SET role = 'housekeeping' WHERE user_id = $1`, [
            tt.users.fdl2!.id,
          ]);
          await tx.query('UPDATE app_user SET roles_version = roles_version + 1 WHERE id = $1', [
            tt.users.fdl2!.id,
          ]);
        });
        const replay = await Client.of(fa, tt, 'fdl2').send('POST', url, body, {
          'idempotency-key': key,
        });
        expect(replay.statusCode).toBe(200);
        expect(replay.headers['idempotent-replayed']).toBe('true');
        const fresh = await Client.of(fa, tt, 'fdl2').send('POST', url, body);
        expect(fresh.statusCode).toBe(403);
      });
    });

    describe('connections (FB-R2-ARC-BE-01)', () => {
      it('a nested connection inside a unit of work is refused', async () => {
        await expect(
          runInUnitOfWork('probe', () => db.withContext(t.ctx(), async () => 1)),
        ).rejects.toThrow(/nested database connection inside the unit of work of probe/);
      });

      it('pool of 2: 3 approvals + 5 forbidden writes at once all finish without waiting for a connection', async () => {
        const small = appDatabase(2);
        const app2 = await startFeatureApp(small);
        try {
          const tt = await setupTenant(db);
          const reqs = await Promise.all([1, 2, 3].map(() => submit('front_desk', {}, tt)));
          const started = Date.now();
          const results = await Promise.all([
            ...reqs.map((r, i) =>
              Client.of(app2, tt, ['manager', 'mgr2', 'owner'][i]!).send(
                'POST',
                `${P(tt)}/approval-requests/${r.id}/actions/approve`,
                { authMethod: 'password', secret: TEST_PASSWORD },
              ),
            ),
            ...[1, 2, 3, 4, 5].map(() =>
              Client.of(app2, tt, 'housekeeping').send(
                'POST',
                `${P(tt)}/approval-requests/${reqs[0]!.id}/actions/reject`,
                {},
              ),
            ),
          ]);
          expect(results.slice(0, 3).map((r) => r.statusCode)).toEqual([200, 200, 200]);
          expect(results.slice(3).map((r) => r.statusCode)).toEqual([403, 403, 403, 403, 403]);
          // connectionTimeoutMillis is 5 s: a request waiting for a second connection would take that long
          expect(Date.now() - started).toBeLessThan(4_000);
        } finally {
          await app2.close();
          await small.close();
        }
      });
    });

    describe('FOC limits under concurrency (FB-R2-ARC-BE-04)', () => {
      it('two minibar self-applications of 300.000 at once with 500.000/month → exactly one approved', async () => {
        const tt = await setupTenant(db);
        const one = () =>
          submit(
            'front_desk',
            { amountVnd: 300000, lineCategory: 'minibar', requesterReauthenticated: true },
            tt,
          );
        const rows = await Promise.all([one(), one()]);
        expect(rows.map((r) => r.status).sort()).toEqual(['approved', 'pending']);
      });

      it('manager self-applications count against the manager monthly limit (600.000)', async () => {
        const tt = await setupTenant(db);
        const self = await submit('manager', { amountVnd: 500000 }, tt);
        expect(self).toMatchObject({ status: 'approved', self_applied: true });
        // 500.000 used: a second self-application of 200.000 is over the month → pending for the owner
        const second = await submit('manager', { amountVnd: 200000 }, tt);
        expect(second.status).toBe('pending');
        // and approving 200.000 for someone else escalates (A4) instead of passing
        const r = await submit('front_desk_lead', { amountVnd: 200000 }, tt);
        const res = await Client.of(fa, tt, 'manager').send(
          'POST',
          `${P(tt)}/approval-requests/${r.id}/actions/approve`,
          { authMethod: 'password', secret: TEST_PASSWORD },
        );
        expect(res.statusCode).toBe(403);
        expect(res.json()).toMatchObject({ code: 'APPROVAL_LIMIT_EXCEEDED', approver: 'owner' });
      });
    });

    describe('idempotency request hash without secrets (FB-R2-SEC-BE-06)', () => {
      it('request_hash ignores the secret and is not the plain SHA-256 of the body', async () => {
        const tt = await setupTenant(db);
        const r = await submit('front_desk', {}, tt);
        const key = randomUUID();
        const url = `${P(tt)}/approval-requests/${r.id}/actions/approve`;
        const res = await Client.of(fa, tt, 'manager').send(
          'POST',
          url,
          { authMethod: 'password', secret: TEST_PASSWORD },
          { 'idempotency-key': key },
        );
        expect(res.statusCode).toBe(200);
        const { rows } = await db.withContext(tt.ctx(), (tx) =>
          tx.query<{ request_hash: string }>(
            'SELECT request_hash FROM idempotency_key WHERE key = $1',
            [key],
          ),
        );
        const stored = rows[0]!.request_hash;
        expect(stored).toBe(
          requestHash('POST', url, { authMethod: 'password', secret: 'anything-else' }),
        );
        const plain = createHash('sha256')
          .update(
            `POST ${url}\n${canonicalJson({ authMethod: 'password', secret: TEST_PASSWORD })}`,
          )
          .digest('hex');
        expect(stored).not.toBe(plain);
      });
    });
  },
);
