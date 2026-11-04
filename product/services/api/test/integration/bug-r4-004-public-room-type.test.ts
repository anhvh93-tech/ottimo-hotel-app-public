/**
 * BUG-R4-004 (QA R4 LP-v2): `updateRoom` answered 200 but dropped `publicRoomType` (the zod schema had no key) and
 * `listRooms` never returned it – no way to set the public room type of a unit, so every web class showed "price on
 * request". Contract: OpenAPI 0.3.7 D1 `Room.publicRoomType`, `RoomInput.publicRoomType`, `RoomPatch.publicRoomType`
 * (1–60 chars, `null` = clear); 0.3.10 bổ sung 3: OWNER only (ORC R4 – manager → 403), audit `room.updated`, and
 * a room change drops the public price-estimate cache of the property. FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { PriceEstimateService } from '../../src/modules/public-site/internal/price-estimate.service';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };
const GARDEN = 'Standard Studio · Garden View';
const CITY = 'Standard Studio · City View';

describe.skipIf(!HAS_DB)('BUG-R4-004 – Room.publicRoomType is stored and returned', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    const d = new Date('2026-11-01T09:00:00+07:00');
    fa.clock.set(d);
    await touchSessions(db, t, d);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const list = async (who = 'own') => {
    const res = await c[who]!.get(url('/rooms'));
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data as Array<Record<string, unknown>>;
  };
  const roomOf = async (roomNo: string) => (await list()).find((r) => r.roomNo === roomNo)!;
  const patch = async (roomNo: string, body: Record<string, unknown>, who = 'own') => {
    const room = await roomOf(roomNo);
    return c[who]!.send('PATCH', url(`/rooms/${String(room.id)}`), body, {
      'if-match': `"${Number(room.version)}"`,
    });
  };
  const stored = async (roomNo: string) =>
    (
      await q<{ t: string | null }>(`SELECT public_room_type AS t FROM room WHERE id = $1`, [
        ids.rooms[roomNo],
      ])
    )[0]!.t;

  it('listRooms returns publicRoomType for every room (null = not set) – to every role that may list rooms', async () => {
    for (const who of ['own', 'mgr', 'fd']) {
      const rooms = await list(who);
      expect(rooms.length).toBeGreaterThan(0);
      for (const r of rooms) expect(r).toHaveProperty('publicRoomType', null);
    }
  });

  it('OWN PATCH publicRoomType → 200 with the value, stored (trimmed, inner spaces collapsed), listed, audited', async () => {
    const res = await patch('102', { publicRoomType: `  Standard Studio  · Garden View ` });
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json().publicRoomType).toBe(GARDEN);
    expect(await stored('102')).toBe(GARDEN);
    expect((await roomOf('102')).publicRoomType).toBe(GARDEN);
    const audit = await q<{ before: Record<string, unknown>; after: Record<string, unknown> }>(
      `SELECT before, after FROM audit_event WHERE entity_type = 'room' AND entity_id = $1
        AND action = 'room.updated'`,
      [ids.rooms['102']],
    );
    expect(audit).toEqual([
      { before: { publicRoomType: null }, after: { publicRoomType: GARDEN } },
    ]);
  });

  it('with a list price in the same PATCH both are stored (the QA repro)', async () => {
    const res = await patch('101', {
      publicRoomType: CITY,
      listPrice: {
        effectiveFrom: '2026-12-01',
        monthlyListPriceVnd: 8_000_000,
        nightlyListPriceVnd: 650_000,
        reason: 'BUG-R4-004 test',
      },
    });
    expect(res.statusCode, res.body).toBe(200);
    expect(await stored('101')).toBe(CITY);
    const prices = await q<{ n: number }>(
      `SELECT nightly_list_price_vnd AS n FROM room_list_price WHERE room_id = $1 AND effective_from = '2026-12-01'`,
      [ids.rooms['101']],
    );
    expect(prices).toEqual([{ n: 650_000 }]);
  });

  it('a PATCH without the key keeps the value; null clears it (audited)', async () => {
    const keep = await patch('102', { bedCount: 1 });
    expect(keep.statusCode, keep.body).toBe(200);
    expect(keep.json().publicRoomType).toBe(GARDEN);
    const cleared = await patch('102', { publicRoomType: null });
    expect(cleared.statusCode, cleared.body).toBe(200);
    expect(cleared.json().publicRoomType).toBeNull();
    expect(await stored('102')).toBeNull();
    // Same fake instant for every row → compare the set, not an order.
    const audit = await q<{ before: Record<string, unknown>; after: Record<string, unknown> }>(
      `SELECT before, after FROM audit_event WHERE entity_type = 'room' AND entity_id = $1
        AND action = 'room.updated'`,
      [ids.rooms['102']],
    );
    expect(audit).toContainEqual({
      before: { publicRoomType: GARDEN },
      after: { publicRoomType: null },
    });
  });

  it('validation: empty / blank / over 60 chars / not a string → 422 and nothing stored', async () => {
    for (const bad of ['', '   ', 'x'.repeat(61), 42]) {
      const res = await patch('103', { publicRoomType: bad });
      expect(res.statusCode, `${JSON.stringify(bad)} ${res.body}`).toBe(422);
      expect(res.json().code).toBe('VALIDATION_FAILED');
    }
    expect(await stored('103')).toBeNull();
  });

  it('owner only: MGR sending publicRoomType → 403, nothing stored (also with other fields); MGR without it → 200', async () => {
    const refused = await patch('103', { publicRoomType: GARDEN }, 'mgr');
    expect(refused.statusCode, refused.body).toBe(403);
    expect(refused.json().code).toBe('FORBIDDEN_ACTION');
    const mixed = await patch('103', { publicRoomType: null, bedCount: 2 }, 'mgr');
    expect(mixed.statusCode, mixed.body).toBe(403);
    expect(await stored('103')).toBeNull();
    const fine = await patch('103', { bedCount: 2 }, 'mgr');
    expect(fine.statusCode, fine.body).toBe(200);
    expect(fine.json().publicRoomType).toBeNull();
    // FD may not call updateRoom at all (x-roles).
    expect((await patch('103', { publicRoomType: GARDEN }, 'fd')).statusCode).toBe(403);
  });

  it('createRoom: OWN stores publicRoomType and gets it back; MGR sending it → 403 (no room created)', async () => {
    const body = (roomNo: string) => ({
      roomNo,
      roomGroupId: ids.groups.L12,
      monthlyListPriceVnd: 8_000_000,
      publicRoomType: CITY,
    });
    const created = await c.own!.send('POST', url('/rooms'), body('901'));
    expect(created.statusCode, created.body).toBe(201);
    expect(created.json().publicRoomType).toBe(CITY);
    const refused = await c.mgr!.send('POST', url('/rooms'), body('902'));
    expect(refused.statusCode, refused.body).toBe(403);
    expect(await q(`SELECT 1 FROM room WHERE room_no = '902'`)).toEqual([]);
    const plain = await c.mgr!.send('POST', url('/rooms'), {
      roomNo: '903',
      roomGroupId: ids.groups.L12,
      monthlyListPriceVnd: 8_000_000,
    });
    expect(plain.statusCode, plain.body).toBe(201);
    expect(plain.json().publicRoomType).toBeNull();
  });

  it('a committed room change drops the public price-estimate cache of the property; a refused one does not', async () => {
    const estimates = fa.app.get(PriceEstimateService);
    const spy = vi.spyOn(estimates, 'invalidate');
    try {
      const ok = await patch('202', { publicRoomType: GARDEN });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(spy).toHaveBeenCalledWith(t.propertyIds[0]);
      spy.mockClear();
      const refused = await patch('202', { publicRoomType: CITY }, 'mgr');
      expect(refused.statusCode).toBe(403);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
