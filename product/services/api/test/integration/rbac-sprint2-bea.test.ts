/**
 * Role gate of the BE-A Sprint 2 operations (reservations, rack, room blocks, overbooking), generated from
 * QA's product/tests/fixtures/rbac-cases.json (itself from OpenAPI x-roles). Each case runs with a fresh
 * session of a user holding exactly the case's roles, against a real booking/block: expected 2xx → the role
 * gate lets it through (neither 401/403 nor 500 – business answers 404/409/412/422 are fine); 403 →
 * FORBIDDEN_ACTION; 401 → a guest cookie is not a staff session.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type BookingIds, seedBooking, seedGuestRow } from '../helpers/reservations-fixture';
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
  'getRack',
  'searchAvailability',
  'listReservations',
  'createReservation',
  'getReservation',
  'updateReservation',
  'getReservationHistory',
  'extendHold',
  'cancelReservation',
  'moveReservation',
  'markNoShow',
  'restoreNoShow',
  'assignRoom',
  'swapRoom',
  'listOverbookingIncidents',
  'resolveOverbookingExternal',
  'listRoomBlocks',
  'createRoomBlock',
  'updateRoomBlock',
  'transitionRoomBlock',
];

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Sprint 2 operations (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const userByRoles = new Map<string, string>();
  const ref: Record<string, string> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    const roleSets = [
      ...new Set(CASES.filter((c) => c.expected !== '401').map((c) => c.roles.join('+'))),
    ];
    const users: Record<string, string[]> = { fd: ['front_desk'], mt: ['maintenance'] };
    roleSets.forEach((rs, i) => {
      users[`u${i}`] = rs.split('+');
    });
    t = await createTenant(db, { users });
    roleSets.forEach((rs, i) => userByRoles.set(rs, t.users[`u${i}`]!.id));
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    const guest = await seedGuestRow(db, t);
    const fd = Client.of(fa, t, 'fd');
    const res = await fd.send('POST', `${P(t)}/reservations`, {
      roomId: ids.rooms['202'],
      channelId: ids.channels.zalo_phone,
      directSource: 'zalo_phone',
      arrivalDate: '2026-11-03',
      departureDate: '2026-11-05',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
    });
    expect(res.statusCode, res.body).toBe(201);
    ref.reservationId = res.json().id;
    const blk = await Client.of(fa, t, 'mt').send('POST', `${P(t)}/room-blocks`, {
      roomId: ids.rooms['101'],
      startDate: '2026-12-01',
      endDatePlanned: '2026-12-03',
      reason: 'Bảo trì định kỳ',
    });
    expect(blk.statusCode, blk.body).toBe(201);
    ref.roomBlockId = blk.json().id;
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

  function request(c: RbacCase): { url: string; body?: unknown } {
    let url = c.path
      .replace('{propertyId}', t.propertyIds[0]!)
      .replace('{reservationId}', ref.reservationId!)
      .replace('{roomBlockId}', ref.roomBlockId!)
      .replace('{incidentId}', randomUUID())
      .replace('{action}', 'cancel');
    if (c.operationId === 'searchAvailability') url += '?arrival=2026-11-10&departure=2026-11-12';
    const bodies: Record<string, unknown> = {
      createReservation: { roomId: ids.rooms['301'] },
      updateReservation: { etaTime: '20:00' },
      extendHold: { extraHours: 1 },
      cancelReservation: { reasonCode: 'found_other', dryRun: true },
      moveReservation: { reasonCode: 'guest_request', roomId: ids.rooms['102'] },
      markNoShow: { contactAttemptNote: 'Không liên lạc được' },
      restoreNoShow: { reason: 'Khách đến muộn' },
      assignRoom: { roomId: ids.rooms['102'], resolution: 'reassigned_same_group' },
      swapRoom: { otherReservationId: randomUUID(), otherVersion: 1, reason: 'Đổi chéo' },
      resolveOverbookingExternal: { costVnd: 0, note: 'Dời khách' },
      createRoomBlock: {
        roomId: ids.rooms['102'],
        startDate: '2026-12-20',
        endDatePlanned: '2026-12-21',
        reason: 'Thử vai',
      },
      updateRoomBlock: { endDatePlanned: '2026-12-04' },
      transitionRoomBlock: { reason: 'Thử vai' },
    };
    return { url, ...(c.method === 'GET' ? {} : { body: bodies[c.operationId] ?? {} }) };
  }

  it('covers every BE-A Sprint 2 operation of the fixture', () => {
    expect(new Set(CASES.map((c) => c.operationId))).toEqual(new Set(OPS));
  });

  it.each(CASES.map((c) => [`${c.id} ${c.operationId} ${c.subject} → ${c.expected}`, c] as const))(
    '%s',
    async (_name, c) => {
      const r = request(c);
      // A stale If-Match keeps state-changing cases from changing the shared booking (412 after the gate).
      const headers: Record<string, string> = { 'if-match': '"999"' };
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
        expect(res.statusCode, res.body).toBe(403);
        expect(res.json().code).toBe('FORBIDDEN_ACTION');
      } else {
        expect(res.statusCode).toBe(401);
      }
    },
  );
});
