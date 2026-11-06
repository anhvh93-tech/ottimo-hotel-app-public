/**
 * Role gate of the BE-D Round 5 operations – V5-58 getPropertyWifi (S36: OWN, MGR, FDL, FD read only) and
 * setPropertyWifi (A101: OWN, MGR) – generated from QA's product/tests/fixtures/rbac-cases.json (OpenAPI 0.3.13
 * x-roles, stable ids `RB-<operationId>-<subject>`). Each case runs with a fresh session of a user holding exactly
 * the case's roles. 2xx → the gate lets it through (neither 401/403 nor 500); 403 → FORBIDDEN_ACTION before the body
 * is read; 401 → a guest cookie is not a staff session. What each role reads and the write rules:
 * v5-58-property-wifi.test.ts.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { type FeatureApp, cookieValue, startFeatureApp } from '../helpers/feature-app';
import { seedStay } from '../helpers/registration-fixture';
import { seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface RbacCase {
  id: string;
  operationId: string;
  method: string;
  path: string;
  roles: string[];
  subject: string;
  expected: '2xx' | '401' | '403';
}

const OPS = ['getPropertyWifi', 'setPropertyWifi'];
// An open network: no comparison with the caller's login password, nothing counted.
const BODIES: Record<string, unknown> = {
  setPropertyWifi: { ssid: 'RBAC TEST NET', password: '' },
};

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Round 5 operations (BE-D, V5-58)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  const userByRoles = new Map<string, string>();
  let guestSid: string;

  beforeAll(async () => {
    db = appDatabase(5);
    const roleSets = [
      ...new Set(CASES.filter((c) => !c.roles.includes('guest')).map((c) => c.roles.join('+'))),
    ];
    const users: Record<string, string[]> = { desk: ['front_desk'] };
    roleSets.forEach((rs, i) => {
      users[`u${i}`] = rs.split('+');
    });
    t = await createTenant(db, { users });
    roleSets.forEach((rs, i) => userByRoles.set(rs, t.users[`u${i}`]!.id));
    const ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    const { reservationId } = await seedStay(db, t, ids, { status: 'in_house' });
    const deskToken = t.users.desk!.sessionToken;
    const link = await fa.app.inject({
      method: 'POST',
      url: `/v1/properties/${t.propertyIds[0]}/reservations/${reservationId}/guest-link`,
      headers: {
        cookie: `ottimo_sid=${deskToken}`,
        'x-csrf-token': fa.sessions.csrfToken(sha256Hex(deskToken)),
        'idempotency-key': randomUUID(),
      },
    });
    const token = new URL(link.json().url).pathname.slice(3);
    const open = await fa.app.inject({
      method: 'POST',
      url: '/v1/guest/sessions',
      payload: { token },
    });
    guestSid = cookieValue(open, 'ottimo_gsid') as string;
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  async function freshSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO user_session (id, organization_id, user_id, active_property_id, client_origin, created_at,
           last_active_at, idle_expires_at, expires_at)
         VALUES ($1, $2, $3, $4, 'admin', $5, $5, $6, $6)`,
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

  it('covers both V5-58 operations of the fixture (11 cases each, stable ids)', () => {
    expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
    expect(CASES).toHaveLength(OPS.length * 11);
    for (const c of CASES) expect(c.id).toBe(`RB-${c.operationId}-${c.subject}`);
    const expected = (op: string) =>
      Object.fromEntries(
        CASES.filter((c) => c.operationId === op).map((c) => [c.subject, c.expected]),
      );
    expect(expected('getPropertyWifi')).toMatchObject({
      'qa.owner': '2xx',
      'qa.mgr': '2xx',
      'qa.fdl': '2xx',
      'qa.fd': '2xx',
      'qa.hk': '403',
      'qa.mt': '403',
      'qa.sal': '403',
      'qa.ctv1': '403',
    });
    expect(expected('setPropertyWifi')).toMatchObject({
      'qa.owner': '2xx',
      'qa.mgr': '2xx',
      'qa.fdl': '403',
      'qa.fd': '403',
      'qa.fdsal': '403',
    });
  });

  it.each(CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const))(
    '%s',
    async (_name, c) => {
      const url = c.path.replace('{propertyId}', t.propertyIds[0]!);
      const headers: Record<string, string> = {};
      if (c.expected === '401') {
        headers.cookie = c.roles.includes('guest')
          ? `ottimo_gsid=${guestSid}`
          : `ottimo_sid=${await freshSession(userByRoles.get(c.roles.join('+'))!)}`;
      } else {
        const token = await freshSession(userByRoles.get(c.roles.join('+'))!);
        headers.cookie = `ottimo_sid=${token}`;
        if (c.method !== 'GET') headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
      }
      const res = await fa.app.inject({
        method: c.method as 'GET',
        url,
        headers,
        ...(c.method === 'GET' ? {} : { payload: BODIES[c.operationId] as object }),
      });
      if (c.expected === '2xx') {
        expect([401, 403, 500], `${res.statusCode} ${res.body}`).not.toContain(res.statusCode);
        expect(res.statusCode, res.body).toBe(200);
        expect(res.headers['cache-control']).toBe('no-store');
      } else if (c.expected === '403') {
        expect(res.statusCode, res.body).toBe(403);
        expect(res.json().code).toBe('FORBIDDEN_ACTION');
      } else {
        expect(res.statusCode).toBe(401);
      }
    },
  );
});
