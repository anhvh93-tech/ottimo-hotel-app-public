/**
 * Role gate of the BE-D Sprint 4 operations (EP01 dashboard reads + resolveAttentionEvent; EP14 guest requests –
 * staff S30 and guest level 1; US-066 minibar catalogue listItems/createItem/updateItem), generated from QA's
 * product/tests/fixtures/rbac-cases.json (OpenAPI 0.3.7 x-roles). Each case runs with a fresh session of a
 * user holding exactly the case's roles. 2xx → the gate lets it through (neither 401/403 nor 500 – business
 * answers 404/409/422 are fine: resolve uses an unknown event id); 403 → FORBIDDEN_ACTION; 401 → a guest
 * cookie is not a staff session. listAttentionItems / streamEvents keep their Sprint 3 runner
 * (rbac-sprint3-bea.test.ts); what each role SEES is in dashboard-s4-bed.test.ts.
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

const OPS = [
  'getTonightKpi',
  'getArrivalsDepartures',
  'resolveAttentionEvent',
  'listGuestRequests',
  'transitionGuestRequest',
  'listMyRequests',
  'createGuestRequest',
  'listGuestRequestOptions',
  // US-066 + US-003 AC2 (moved from BE-B, ORC 17/10): minibar catalogue – what each role SEES is in
  // minibar-catalog-s4-bed.test.ts.
  'listItems',
  'createItem',
  'updateItem',
];
const ITEM = {
  code: 'rbac_water',
  name: { vi: 'Nước suối' },
  unit: 'chai',
  salePriceVnd: null,
  minibarStandardQty: 2,
};
const BODIES: Record<string, unknown> = {
  createGuestRequest: { type: 'other', note: 'Cho thêm một gối' },
  createItem: ITEM,
  updateItem: ITEM,
};

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Sprint 4 operations (BE-D)', () => {
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
    // A real level-1 guest session (booking in house) for the `guest` cases.
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

  it('covers every BE-D Sprint 4 operation of the fixture (11 cases each)', () => {
    expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
    expect(CASES).toHaveLength(OPS.length * 11);
  });

  it.each(CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const))(
    '%s',
    async (_name, c) => {
      const url = c.path
        .replace('{propertyId}', t.propertyIds[0]!)
        .replace('{eventId}', randomUUID())
        .replace('{requestId}', randomUUID())
        .replace('{itemId}', randomUUID())
        .replace('{action}', 'acknowledge');
      const headers: Record<string, string> = {};
      if (c.expected === '401') {
        // A REAL session of the other kind: staff route + live guest cookie, guest route + live staff cookie.
        headers.cookie = c.roles.includes('guest')
          ? `ottimo_gsid=${guestSid}`
          : `ottimo_sid=${await freshSession(userByRoles.get(c.roles.join('+'))!)}`;
        if (c.method !== 'GET') headers['idempotency-key'] = randomUUID();
      } else if (c.roles.includes('guest')) {
        headers.cookie = `ottimo_gsid=${guestSid}`;
        if (c.method !== 'GET') headers['idempotency-key'] = randomUUID();
      } else {
        const token = await freshSession(userByRoles.get(c.roles.join('+'))!);
        headers.cookie = `ottimo_sid=${token}`;
        if (c.method !== 'GET') {
          headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
          headers['idempotency-key'] = randomUUID();
        }
        if (c.method === 'PATCH') headers['if-match'] = '"1"';
      }
      const res = await fa.app.inject({
        method: c.method as 'GET',
        url,
        headers,
        ...(c.method === 'GET' ? {} : { payload: (BODIES[c.operationId] ?? {}) as object }),
      });
      if (c.expected === '2xx') {
        expect([401, 403, 500], `${res.statusCode} ${res.body}`).not.toContain(res.statusCode);
      } else if (c.expected === '403') {
        expect(res.statusCode, res.body).toBe(403);
        expect(res.json().code).toBe('FORBIDDEN_ACTION');
      } else {
        expect(res.statusCode).toBe(401);
      }
    },
  );
});
