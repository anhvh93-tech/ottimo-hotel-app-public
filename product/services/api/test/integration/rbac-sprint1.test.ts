/**
 * Role gate of the BE-B Sprint 1 operations, generated from QA's product/tests/fixtures/rbac-cases.json
 * (itself generated from OpenAPI x-roles). Each case runs with a fresh session of a user holding exactly
 * the case's roles: expected 2xx → the role gate lets it through (status is neither 401 nor 403 – payloads
 * are minimal, so 404/409/412/422 are fine); 403 → FORBIDDEN_ACTION; 401 → guest cookie is not a staff session.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import {
  TEST_PASSWORD,
  type FeatureApp,
  seedSprint1Params,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';
import { hash } from '@node-rs/argon2';

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
  'logout',
  'changeMyPassword',
  'getMe',
  'listUsers',
  'createUser',
  'updateUser',
  'setUserRoles',
  'listTrustedDevices',
  'trustCurrentDevice',
  'revokeTrustedDevice',
  'listRoomGroups',
  'listRooms',
  'createRoom',
  'updateRoom',
  'listParameters',
  'getParameterHistory',
  'setParameter',
  'searchGuests',
  'createGuest',
  'lookupGuestByContact',
  'getGuest',
  'updateGuest',
];

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Sprint 1 operations (BE-B)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  const userByRoles = new Map<string, string>();
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    const roleSets = [
      ...new Set(CASES.filter((c) => c.expected !== '401').map((c) => c.roles.join('+'))),
    ];
    const users: Record<string, string[]> = { target: ['front_desk'] };
    roleSets.forEach((rs, i) => {
      users[`u${i}`] = rs.split('+');
    });
    t = await createTenant(db, { users });
    roleSets.forEach((rs, i) => userByRoles.set(rs, t.users[`u${i}`]!.id));
    await seedSprint1Params(db, t);
    const h = await hash(TEST_PASSWORD);
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query('UPDATE app_user SET password_hash = $1', [h]);
      const g = uuidv7();
      await tx.query(
        `INSERT INTO room_group (id, organization_id, property_id, code, name, base_occupancy, max_occupancy, created_at, updated_at)
         VALUES ($1, $2, $3, 'L12', 'Lầu 1–2', 2, 3, $4, $4)`,
        [g, t.organizationId, t.propertyIds[0], T0],
      );
      ids.roomGroupId = g;
      ids.roomId = uuidv7();
      await tx.query(
        `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, base_occupancy, max_occupancy,
           public_slug, active_from, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '101', 2, 3, $5, '2026-10-01', $6, $6)`,
        [
          ids.roomId,
          t.organizationId,
          t.propertyIds[0],
          g,
          randomBytes(9).toString('base64url'),
          T0,
        ],
      );
      ids.guestId = uuidv7();
      await tx.query(
        `INSERT INTO guest (id, organization_id, code, full_name, name_search, phone_e164, created_at, updated_at)
         VALUES ($1, $2, 'KH-9001', 'Khách Mẫu', 'KHACH MAU', '84900000001', $3, $3)`,
        [ids.guestId, t.organizationId, T0],
      );
    });
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
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

  function request(c: RbacCase): { url: string; body?: unknown; headers: Record<string, string> } {
    const url = c.path
      .replace('{propertyId}', t.propertyIds[0]!)
      .replace('{userId}', t.users.target!.id)
      .replace('{roomId}', ids.roomId!)
      .replace('{guestId}', ids.guestId!)
      .replace('{deviceId}', uuidv7())
      .replace('{key}', 'night_from_month_divisor');
    const headers: Record<string, string> = { 'if-match': '"999"' };
    const bodies: Record<string, unknown> = {
      changeMyPassword: { currentPassword: TEST_PASSWORD, newPassword: 'short' },
      createUser: {
        username: `u.${randomUUID().slice(0, 8)}`,
        displayName: 'Người Thử',
        initialPassword: 'Fake-initial-pass-1',
        roles: [{ propertyId: t.propertyIds[0], role: 'housekeeping' }],
      },
      updateUser: { displayName: 'Tên Mới' },
      setUserRoles: { roles: [{ propertyId: t.propertyIds[0], role: 'front_desk' }] },
      trustCurrentDevice: {
        name: `Máy ${randomUUID().slice(0, 6)}`,
        deviceKind: 'desk',
        currentPassword: TEST_PASSWORD,
        hardeningChecklistConfirmed: true,
      },
      revokeTrustedDevice: {},
      createRoom: {
        roomNo: `${Math.floor(Math.random() * 900) + 100}`,
        roomGroupId: ids.roomGroupId,
        monthlyListPriceVnd: 9_000_000,
      },
      updateRoom: { name: 'X' },
      setParameter: { value: 12, effectiveFrom: '2026-10-20', reason: 'Kiểm thử vai' },
      createGuest: { fullName: 'Khách Thử', email: `k.${randomUUID().slice(0, 8)}@example.com` },
      lookupGuestByContact: { phone: '0900000001' },
      updateGuest: { preferredLocale: 'en' },
    };
    const body = bodies[c.operationId];
    return { url, ...(c.method === 'GET' ? {} : { body: body ?? {} }), headers };
  }

  it('covers every Sprint 1 operation of the fixture', () => {
    expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
  });

  it.each(CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const))(
    '%s',
    async (_name, c) => {
      const r = request(c);
      const headers: Record<string, string> = { ...r.headers };
      if (c.expected === '401') {
        headers.cookie = `ottimo_gsid=${randomBytes(32).toString('base64url')}`;
      } else {
        const token = await freshSession(userByRoles.get(c.roles.join('+'))!);
        headers.cookie = `ottimo_sid=${token}`;
        if (c.method !== 'GET') {
          headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
          headers['idempotency-key'] = randomUUID();
        }
      }
      const res = await fa.app.inject({
        method: c.method as 'GET',
        url: r.url,
        headers,
        ...(r.body === undefined ? {} : { payload: r.body as object }),
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
