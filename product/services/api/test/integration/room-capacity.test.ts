/**
 * ĐK-S2-2 / QC-S2-01 (BUG-R2-025): ROOM_CAPACITY_CHECK wired to the reservations table (US-004, BR-110,
 * OpenAPI `updateRoom` 409 CAPACITY_BELOW_BOOKINGS). Lowering `maxOccupancy` below the counted head count
 * (adults + children 6–11; under 6 never count) of a confirmed / in-house / live-hold booking with a night
 * ≥ today on the room → 409 with `conflicts[]`; anything else saves. Plus the race guard of booking writes
 * (assertCapacityStable) and the room lock taken by a head-count change. FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { OccupancyService } from '../../src/modules/reservations/public/occupancy.service';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { ProblemError } from '../../src/shared/problem';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'], sal: ['sales_staff'] };

describe.skipIf(!HAS_DB)('room capacity vs bookings (ĐK-S2-2, US-004 / BR-110)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Lê Thị Hoa' });
    fa = await startFeatureApp(db);
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    await at('2026-10-15T09:00:00+07:00');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  async function at(iso: string) {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  }
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const direct = (over: Record<string, unknown> = {}) => ({
    channelId: ids.channels.direct,
    directSource: 'zalo_phone',
    adults: 2,
    bookerGuestId: guest,
    paymentModel: 'direct',
    initialPayment: { type: 'deposit', method: 'cash', amountVnd: 2_000_000 },
    ...over,
  });
  async function book(body: Record<string, unknown>) {
    const res = await c.fd!.send('POST', url('/reservations'), direct(body));
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as { id: string; code: string; version: number };
  }
  async function room(roomNo: string) {
    const list = (await c.own!.get(url('/rooms'))).json().data as Array<{
      id: string;
      roomNo: string;
      maxOccupancy: number;
      baseOccupancy: number;
      version: number;
    }>;
    return list.find((r) => r.roomNo === roomNo)!;
  }
  async function setMax(roomNo: string, maxOccupancy: number, who = 'own') {
    const r = await room(roomNo);
    return c[who]!.send(
      'PATCH',
      url(`/rooms/${r.id}`),
      { maxOccupancy },
      { 'if-match': `"${r.version}"` },
    );
  }

  it('confirmed future booking above the new max → 409 CAPACITY_BELOW_BOOKINGS with conflicts[], nothing saved', async () => {
    const r = await book({
      roomId: ids.rooms['301'],
      arrivalDate: '2026-11-03',
      departureDate: '2026-11-06',
      adults: 5,
    });
    const before = await room('301');
    expect(before.maxOccupancy).toBe(5);
    const res = await setMax('301', 4);
    expect(res.statusCode, res.body).toBe(409);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.json()).toMatchObject({
      code: 'CAPACITY_BELOW_BOOKINGS',
      status: 409,
      conflicts: [
        { reservationCode: r.code, stayFrom: '2026-11-03', stayTo: '2026-11-06', guestCount: 5 },
      ],
    });
    const after = await room('301');
    expect(after).toMatchObject({ maxOccupancy: 5, version: before.version });
    // Manager (S25) gets the same answer – the check is not role-dependent.
    expect((await setMax('301', 4, 'mgr')).json().code).toBe('CAPACITY_BELOW_BOOKINGS');
  });

  it('children 6–11 count, children under 6 do not (BR-110); head count = new max is allowed', async () => {
    // 302: base 3, max 4. 3 adults + 1 child 8 y + 2 under 6 → counted 4.
    const r = await book({
      roomId: ids.rooms['302'],
      arrivalDate: '2026-11-10',
      departureDate: '2026-11-12',
      adults: 3,
      children6to11: 1,
      childrenUnder6: 2,
    });
    const res = await setMax('302', 3);
    expect(res.statusCode, res.body).toBe(409);
    expect(res.json().conflicts).toEqual([
      { reservationCode: r.code, stayFrom: '2026-11-10', stayTo: '2026-11-12', guestCount: 4 },
    ]);
    // 401: base 4, max 5. 4 adults + 2 under 6 → counted 4 = new max 4 → saved.
    await book({
      roomId: ids.rooms['401'],
      arrivalDate: '2026-11-10',
      departureDate: '2026-11-12',
      adults: 4,
      childrenUnder6: 2,
    });
    const ok = await setMax('401', 4);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().maxOccupancy).toBe(4);
    // Raising back never checks bookings.
    expect((await setMax('401', 5)).statusCode).toBe(200);
  });

  it('several bookings: one row per booking, ordered by stay; bookings that still fit are not listed', async () => {
    const a = await book({
      roomId: ids.rooms['402'],
      arrivalDate: '2026-12-01',
      departureDate: '2026-12-03',
      adults: 4,
    });
    const b = await book({
      roomId: ids.rooms['402'],
      arrivalDate: '2026-11-20',
      departureDate: '2026-11-22',
      adults: 3,
      children6to11: 1,
    });
    await book({
      roomId: ids.rooms['402'],
      arrivalDate: '2026-11-25',
      departureDate: '2026-11-27',
      adults: 3,
    });
    const res = await setMax('402', 3);
    expect(res.statusCode).toBe(409);
    expect(res.json().conflicts.map((x: { reservationCode: string }) => x.reservationCode)).toEqual(
      [b.code, a.code],
    );
  });

  it('cancelled bookings and stays whose last night is before today do not block', async () => {
    // 101: base 2, max 3.
    const past = await book({
      roomId: ids.rooms['101'],
      arrivalDate: '2026-10-15',
      departureDate: '2026-10-16',
      adults: 3,
    });
    const cancelled = await book({
      roomId: ids.rooms['101'],
      arrivalDate: '2026-11-15',
      departureDate: '2026-11-17',
      adults: 3,
    });
    expect((await setMax('101', 2)).statusCode).toBe(409);
    const v = (await c.fd!.get(url(`/reservations/${cancelled.id}`))).json().version;
    const cx = await c.mgr!.send(
      'POST',
      url(`/reservations/${cancelled.id}/actions/cancel`),
      { reasonCode: 'found_other', note: 'Khách đổi kế hoạch' },
      { 'if-match': `"${v}"` },
    );
    expect(cx.statusCode, cx.body).toBe(200);
    // Still today = 15/10: the night of 15/10 counts.
    const today = await setMax('101', 2);
    expect(today.statusCode).toBe(409);
    expect(today.json().conflicts).toEqual([
      { reservationCode: past.code, stayFrom: '2026-10-15', stayTo: '2026-10-16', guestCount: 3 },
    ]);
    // Next business day: departure 16/10 = no night ≥ today any more → saved.
    await at('2026-10-16T09:00:00+07:00');
    try {
      const ok = await setMax('101', 2);
      expect(ok.statusCode, ok.body).toBe(200);
      expect((await setMax('101', 3)).statusCode).toBe(200);
    } finally {
      await at('2026-10-15T09:00:00+07:00');
    }
  });

  it('in-house booking blocks; a live hold blocks, an expired hold (J1 not run yet) does not', async () => {
    // 103 in-house (fake status set directly – check-in flow is covered elsewhere).
    const inHouse = await book({
      roomId: ids.rooms['103'],
      arrivalDate: '2026-10-15',
      departureDate: '2026-10-18',
      adults: 3,
    });
    await q(`UPDATE reservation SET status = 'in_house', actual_checkin_at = now() WHERE id = $1`, [
      inHouse.id,
    ]);
    const ih = await setMax('103', 2);
    expect(ih.statusCode).toBe(409);
    expect(ih.json().conflicts[0]).toMatchObject({ reservationCode: inHouse.code, guestCount: 3 });

    // 102: live hold of 3 adults (24 h).
    const svc = fa.app.get(ReservationsService);
    const hold = await db.withContext(
      { ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.sal!.id, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms['102']!,
          channelId: ids.channels.direct!,
          arrivalDate: '2026-10-25',
          departureDate: '2026-10-27',
          adults: 3,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 24,
        });
      },
    );
    const live = await setMax('102', 2);
    expect(live.statusCode).toBe(409);
    expect(live.json().conflicts).toEqual([
      { reservationCode: hold.code, stayFrom: '2026-10-25', stayTo: '2026-10-27', guestCount: 3 },
    ]);
    await at('2026-10-16T09:00:01+07:00');
    try {
      expect((await setMax('102', 2)).statusCode).toBe(200);
    } finally {
      await at('2026-10-15T09:00:00+07:00');
    }
  });

  it('a booking moved to another room no longer blocks its old room (inactive segment)', async () => {
    // 201 → 202 (both Studio, base 2, max 3).
    const r = await book({
      roomId: ids.rooms['201'],
      arrivalDate: '2026-12-10',
      departureDate: '2026-12-12',
      adults: 3,
    });
    expect((await setMax('201', 2)).statusCode).toBe(409);
    const v = (await c.fd!.get(url(`/reservations/${r.id}`))).json().version;
    const mv = await c.fd!.send(
      'POST',
      url(`/reservations/${r.id}/actions/move`),
      // OTTIMO's move (a guest request needs the told-the-guest amount since 0.3.7 – ESC-019 A).
      { roomId: ids.rooms['202'], reasonCode: 'property_fault' },
      { 'if-match': `"${v}"` },
    );
    expect(mv.statusCode, mv.body).toBe(200);
    expect((await setMax('201', 2)).statusCode).toBe(200);
    const blocked = await setMax('202', 2);
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().conflicts[0].reservationCode).toBe(r.code);
  });

  it('race guard: a booking write whose room max changed after it was read → 409 CONCURRENT_UPDATE', async () => {
    const svc = fa.app.get(ReservationsService);
    const occ = fa.app.get(OccupancyService);
    const roomId = ids.rooms['203']!;
    const err = await db
      .withContext(t.ctx(), async (tx) => {
        const rm = (await svc.room(tx, roomId))!;
        expect(rm.max_occupancy).toBe(3);
        // A concurrent updateRoom commits while our booking write is between "read" and "lock".
        await db.withContext(t.ctx(), (tx2) =>
          tx2.query('UPDATE room SET max_occupancy = 2, base_occupancy = 2 WHERE id = $1', [
            roomId,
          ]),
        );
        await occ.lockRooms(tx, [roomId]);
        await svc.assertCapacityStable(tx, [rm]);
        return null;
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProblemError);
    expect((err as ProblemError).code).toBe('CONCURRENT_UPDATE');
    // Unchanged value → no error.
    await db.withContext(t.ctx(), async (tx) => {
      const rm = (await svc.room(tx, roomId))!;
      await occ.lockRooms(tx, [roomId]);
      await svc.assertCapacityStable(tx, [rm]);
    });
    await q('UPDATE room SET max_occupancy = 3 WHERE id = $1', [roomId]);
  });

  it('a head-count change waits for a concurrent capacity change (room lock) and sees its result', async () => {
    // 203 max 3. Booking of 2 adults; the manager lowers max to 2 (no conflict yet) while the desk raises the
    // head count to 3 – whichever commits second must see the first: never 3 guests in a max-2 room.
    const r = await book({
      roomId: ids.rooms['203'],
      arrivalDate: '2026-12-20',
      departureDate: '2026-12-22',
      adults: 2,
    });
    const rm = await room('203');
    const v = (await c.fd!.get(url(`/reservations/${r.id}`))).json().version;
    const [lower, raise] = await Promise.all([
      c.own!.send(
        'PATCH',
        url(`/rooms/${rm.id}`),
        { maxOccupancy: 2 },
        {
          'if-match': `"${rm.version}"`,
        },
      ),
      c.fd!.send('PATCH', url(`/reservations/${r.id}`), { adults: 3 }, { 'if-match': `"${v}"` }),
    ]);
    const after = await q<{ max_occupancy: number; adults: number }>(
      `SELECT rm.max_occupancy, r.adults FROM reservation r JOIN room rm ON rm.id = $2 WHERE r.id = $1`,
      [r.id, rm.id],
    );
    expect(after[0]!.adults).toBeLessThanOrEqual(after[0]!.max_occupancy);
    // Exactly one of the two wins (or the loser gets a retryable 409).
    expect(
      [lower.statusCode, raise.statusCode].filter((s) => s === 200).length,
    ).toBeGreaterThanOrEqual(1);
    for (const res of [lower, raise]) {
      if (res.statusCode !== 200) {
        expect(['CAPACITY_BELOW_BOOKINGS', 'CAPACITY_EXCEEDED', 'CONCURRENT_UPDATE']).toContain(
          res.json().code,
        );
      }
    }
  });
});
