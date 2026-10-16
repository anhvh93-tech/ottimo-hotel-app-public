/**
 * Role gate of the BE-C Sprint 3 operations (crypto stepUp, files, registration, guest-portal), generated
 * from QA's product/tests/fixtures/rbac-cases.json – same harness as rbac-sprint2-beb.test.ts:
 * expected 2xx → the gate lets it through (not 401/403/500 – minimal payloads, 404/409/412/422 are fine);
 * 403 → FORBIDDEN_ACTION; 401 → a guest cookie on a staff route / a staff cookie on a guest route.
 * Staff calls carry a trusted-device cookie and an open step-up window, so only the ROLE decides.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
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
  subject: string;
  roles: string[];
  expected: '2xx' | '401' | '403';
}

const OPS = [
  'stepUp',
  'uploadAttachment',
  'getAttachment',
  'listRegistrations',
  'getRegistration',
  'addGuestDocument',
  'updateGuestDocument',
  'getGuestDocumentSensitive',
  'getDocumentImage',
  'purgeRegistrationImages',
  'recordImageConsent',
  'completeRegistrationReview',
  'recordDocumentCheck',
  'getPortalData',
  'transitionRegistration',
  'listC3AccessLog',
  'issueGuestLink',
  'revokeGuestLink',
  'getGuestStay',
  'setGuestLocale',
  'getOnlineCheckin',
  'updateOnlineCheckin',
  'uploadGuestDocument',
  'recordGuestConsent',
  'completeOnlineCheckin',
];

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Sprint 3 operations (BE-C)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let device: string;
  let guestSid: string;
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
    const ids = await seedBooking(db, t);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db);
    // A real level-1 guest session for the `guest` cases.
    const { reservationId } = await seedStay(db, t, ids);
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
      .replace('{transition}', 'mark-sent')
      .replace('{checkCode}', 'name_match')
      .replace(/\{[A-Za-z]+Id\}/g, () => uuidv7());
  }

  it('covers every BE-C Sprint 3 operation of the fixture (openGuestSession is public – skipped there)', () => {
    expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
  });

  it.each(CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const))(
    '%s',
    async (_name, c) => {
      const headers: Record<string, string> = { 'if-match': '"999"' };
      if (c.expected === '401') {
        // staff route: a guest cookie never authenticates; guest route: a staff-like cookie never does.
        headers.cookie = c.roles.includes('guest')
          ? `ottimo_sid=${randomBytes(32).toString('base64url')}`
          : `ottimo_gsid=${randomBytes(32).toString('base64url')}`;
      } else if (c.roles.includes('guest')) {
        headers.cookie = `ottimo_gsid=${guestSid}`;
        if (c.method !== 'GET') headers['idempotency-key'] = randomUUID();
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
