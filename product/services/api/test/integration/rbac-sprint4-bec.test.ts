/**
 * Role gate of the BE-C Sprint 4 operations (OpenAPI 0.3.7 nhóm H – housekeeping, inspections, work orders),
 * generated from QA's product/tests/fixtures/rbac-cases.json – same harness as rbac-sprint3-bec.test.ts:
 * expected 2xx → the gate lets it through (not 401/403/500 – minimal payloads, 404/409/412/422 are fine);
 * 403 → FORBIDDEN_ACTION; 401 → a guest cookie on a staff route.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { type FeatureApp, startFeatureApp } from '../helpers/feature-app';
import { seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface RbacCase {
  id: string;
  operationId: string;
  method: string;
  path: string;
  subject: string;
  roles: string[];
  expected: '2xx' | '401' | '403';
}

const OPS = [
  'listRoomStatuses',
  'transitionRoomStatus',
  'listInspections',
  'recordInspection',
  'getInspectionChecklist',
  'listHkTasks',
  'createHkTask',
  'transitionHkTask',
  'listWorkOrders',
  'createWorkOrder',
  'getWorkOrder',
  'updateWorkOrder',
  'transitionWorkOrder',
];

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Sprint 4 operations (BE-C, nhóm H)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let device: string;
  const userByRoles = new Map<string, string>();

  beforeAll(async () => {
    db = appDatabase(10);
    const roleSets = [
      ...new Set(
        CASES.filter((c) => c.expected !== '401' && !c.roles.includes('guest')).map((c) =>
          c.roles.join('+'),
        ),
      ),
    ];
    const users: Record<string, string[]> = { desk: ['front_desk'] };
    roleSets.forEach((rs, i) => {
      users[`u${i}`] = rs.split('+');
    });
    t = await createTenant(db, { users });
    roleSets.forEach((rs, i) => userByRoles.set(rs, t.users[`u${i}`]!.id));
    await seedBooking(db, t);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  /** A fresh session with an open step-up window (C3 routes then depend on the role only). */
  async function freshSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO user_session (id, organization_id, user_id, active_property_id, client_origin, created_at,
           last_active_at, idle_expires_at, expires_at, stepup_until)
         VALUES ($1, $2, $3, $4, 'admin', $5, $5, $6, $6, $6)`,
        [
          sha256Hex(token),
          t.organizationId,
          userId,
          t.propertyIds[0],
          T0,
          new Date(T0.getTime() + 3_600_000),
        ],
      ),
    );
    return token;
  }

  function url(c: RbacCase): string {
    return c.path
      .replace('{propertyId}', t.propertyIds[0]!)
      .replace('{action}', c.operationId === 'transitionHkTask' ? 'start' : 'accept')
      .replace(/\{[A-Za-z]+Id\}/g, () => uuidv7());
  }

  it('covers every BE-C Sprint 4 operation of the fixture', () => {
    expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
  });

  it.each(CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const))(
    '%s',
    async (_name, c) => {
      const headers: Record<string, string> = { 'if-match': '"999"' };
      if (c.expected === '401') {
        // staff route: a guest cookie never authenticates; guest route: a staff-like cookie never does.
        headers.cookie = `ottimo_gsid=${randomBytes(32).toString('base64url')}`;
      } else {
        const token = await freshSession(userByRoles.get(c.roles.join('+'))!);
        headers.cookie = `ottimo_sid=${token}; ottimo_did=${device}`;
        if (c.method !== 'GET') {
          headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
          headers['idempotency-key'] = randomUUID();
        }
      }
      const res = await fa.app.inject({
        method: c.method as 'GET',
        url: url(c),
        headers,
        ...(c.method === 'GET' || c.method === 'DELETE' ? {} : { payload: {} }),
      });
      if (c.expected === '2xx') {
        expect([401, 403, 500], `${res.statusCode} ${res.body}`).not.toContain(res.statusCode);
      } else if (c.expected === '403') {
        expect(res.statusCode).toBe(403);
        expect(res.json().code).toBe('FORBIDDEN_ACTION');
      } else {
        expect(res.statusCode).toBe(401);
      }
    },
  );
});
