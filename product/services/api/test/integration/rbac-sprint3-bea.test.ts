/**
 * Role gate of the BE-A Sprint 3 operations (front desk, party, events), generated from QA's
 * product/tests/fixtures/rbac-cases.json (OpenAPI 0.3.6 x-roles). Each case runs with a fresh session of a
 * user holding exactly the case's roles, against a real in-house booking. 2xx → the gate lets it through
 * (neither 401/403 nor 500 – business answers 404/409/412/422 are fine); 403 → FORBIDDEN_ACTION;
 * 401 → a guest cookie is not a staff session. checkIn needs a trusted device (D1): every case carries one,
 * so a 403 here is the ROLE gate. streamEvents is checked over a real socket (the stream never ends).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
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
  'previewCheckIn',
  'checkIn',
  'undoCheckIn',
  'getExtensionOptions',
  'extendStay',
  'setLateCheckout',
  'changeRoom',
  'listCheckoutReminders',
  'recordCheckoutConfirmation',
  'getCheckoutSummary',
  'checkOut',
  'earlyDeparture',
  'listParty',
  'addPartyMember',
  'removePartyMember',
  'streamEvents',
  'listMyNotifications',
  'listAttentionItems',
];

const fixture = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/rbac-cases.json'), 'utf8'),
) as { cases: RbacCase[] };
const CASES = fixture.cases.filter((c) => OPS.includes(c.operationId));

describe.skipIf(!HAS_DB)('rbac-cases.json – Sprint 3 operations (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let device: string;
  let port: number;
  const userByRoles = new Map<string, string>();
  const ref: Record<string, string> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    const roleSets = [
      ...new Set(CASES.filter((c) => c.expected !== '401').map((c) => c.roles.join('+'))),
    ];
    const users: Record<string, string[]> = { fd: ['front_desk'] };
    roleSets.forEach((rs, i) => {
      users[`u${i}`] = rs.split('+');
    });
    t = await createTenant(db, { users });
    roleSets.forEach((rs, i) => userByRoles.set(rs, t.users[`u${i}`]!.id));
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    device = await t.deviceToken();
    const guest = await seedGuestRow(db, t);
    const fd = Client.of(fa, t, 'fd');
    const res = await fd.send('POST', `${P(t)}/reservations`, {
      roomId: ids.rooms['202'],
      channelId: ids.channels.direct,
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
    await fa.app.listen(0, '127.0.0.1');
    port = (fa.app.getHttpServer().address() as AddressInfo).port;
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

  const BODIES: Record<string, unknown> = {
    checkIn: { cardsIssued: 1, houseRulesSent: true },
    undoCheckIn: { reason: 'Thử vai' },
    extendStay: { nights: 1 },
    setLateCheckout: { checkoutTime: '15:00', dryRun: true },
    changeRoom: {
      newRoomId: randomUUID(),
      effectiveDate: '2026-11-03',
      cause: 'guest_request',
      reason: 'Thử vai',
      dryRun: true,
    },
    recordCheckoutConfirmation: { channel: 'phone', replyType: 'on_time' },
    checkOut: { checkoutTime: '12:00' },
    earlyDeparture: { newDepartureDate: '2026-11-04', noticeGivenAt: '2026-10-15T08:00:00+07:00' },
    addPartyMember: { role: 'companion', guestId: randomUUID(), dryRun: true },
  };

  function request(c: RbacCase): { url: string; body?: unknown } {
    const url = c.path
      .replace('{propertyId}', t.propertyIds[0]!)
      .replace('{reservationId}', ref.reservationId!)
      .replace('{memberId}', randomUUID());
    return {
      url,
      ...(c.method === 'GET' || c.method === 'DELETE' ? {} : { body: BODIES[c.operationId] ?? {} }),
    };
  }

  it('covers every BE-A Sprint 3 operation of the fixture', () => {
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
        headers.cookie = `ottimo_sid=${token}; ottimo_did=${device}`;
        if (c.method !== 'GET') {
          headers['x-csrf-token'] = fa.sessions.csrfToken(sha256Hex(token));
          headers['idempotency-key'] = randomUUID();
        }
      }
      if (c.operationId === 'streamEvents') {
        const ctrl = new AbortController();
        const res = await fetch(`http://127.0.0.1:${port}${r.url}`, {
          headers,
          signal: ctrl.signal,
        });
        const status = res.status;
        ctrl.abort();
        if (c.expected === '2xx') expect(status).toBe(200);
        else expect(status).toBe(Number(c.expected));
        return;
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

  // SEC-BE-33 / ARC-BE-S3-04: a forbidden role with a key it COMPLETED on this very path still gets 403 on a
  // dry run (a dry run never reaches the unit of work – the guard decides; read() refuses as a second line).
  const DRY_RUN_FORBIDDEN = CASES.filter(
    (c) =>
      c.expected === '403' &&
      ['setLateCheckout', 'changeRoom', 'addPartyMember'].includes(c.operationId),
  );
  it.each(DRY_RUN_FORBIDDEN.map((c) => [`${c.id} ${c.operationId} ${c.subject}`, c] as const))(
    'dry run + completed key of the same path → 403 (%s)',
    async (_name, c) => {
      const r = request(c);
      const userId = userByRoles.get(c.roles.join('+'))!;
      const token = await freshSession(userId);
      const key = randomUUID();
      await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
             request_hash, state, response_status, response_body)
           VALUES ('user', $1, $2, $3, $4, $5, 'x', 'completed', 200, '{}')`,
          [userId, key, t.organizationId, c.method, r.url],
        ),
      );
      const res = await fa.app.inject({
        method: c.method as 'POST',
        url: r.url,
        headers: {
          cookie: `ottimo_sid=${token}; ottimo_did=${device}`,
          'x-csrf-token': fa.sessions.csrfToken(sha256Hex(token)),
          'idempotency-key': key,
        },
        payload: r.body as object,
      });
      expect(res.statusCode, res.body).toBe(403);
      expect(res.json().code).toBe('FORBIDDEN_ACTION');
    },
  );
});
