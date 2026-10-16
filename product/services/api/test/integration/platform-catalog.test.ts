/**
 * platform (US-004 room catalogue, US-005 rule parameters) on Nest/Fastify + PostgreSQL:
 * BR-101 nightly price, ESC-014 MAX_OCCUPANCY_RANGE, DUPLICATE, 412, effective-dated price, catalogue
 * import (seed), RLS between two properties, parameter visibility/owner-only keys/bounds/audit.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { ParameterService } from '../../src/modules/platform/public/parameter.service';
import { importRoomCatalog } from '../../src/modules/platform/public/room-catalog-import';
import {
  Client,
  type FeatureApp,
  P,
  seedSprint1Params,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('platform – rooms and parameters', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let groupL12: string;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      properties: 2,
      users: {
        owner: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        hk: ['housekeeping'],
      },
    });
    await seedSprint1Params(db, t, 0);
    await seedSprint1Params(db, t, 1);
    fa = await startFeatureApp(db);
    // Catalogue of property 0 through the same import the DS-E seed uses (BR-101 checked on the way).
    await db.withContext(t.ctx(0), async (tx) => {
      const params = fa.app.get(ParameterService);
      const r = await importRoomCatalog(tx, params, {
        groups: [
          { code: 'L12', name: 'Lầu 1–2', sortOrder: 1, baseOccupancy: 2, maxOccupancy: 3 },
          { code: 'N', name: 'Căn N', sortOrder: 2, baseOccupancy: 4, maxOccupancy: 5 },
        ],
        rooms: [
          {
            roomNo: '101',
            name: 'The Amber',
            group: 'L12',
            monthlyListPriceVnd: 8_000_000,
            expectedNightlyListPriceVnd: 667_000,
          },
          {
            roomNo: '401',
            name: 'The Pine',
            group: 'N',
            monthlyListPriceVnd: 12_500_000,
            expectedNightlyListPriceVnd: 1_042_000,
          },
        ],
        activeFrom: '2026-10-01',
        now: T0,
      });
      expect(r).toEqual({ groups: 2, rooms: 2 });
    });
    // Property 1 has its own group/room – must never be visible from property 0.
    await db.withContext(t.ctx(1), async (tx) => {
      await importRoomCatalog(tx, fa.app.get(ParameterService), {
        groups: [{ code: 'X', name: 'Other', sortOrder: 1, baseOccupancy: 2, maxOccupancy: 3 }],
        rooms: [{ roomNo: '999', group: 'X', monthlyListPriceVnd: 6_000_000 }],
        activeFrom: '2026-10-01',
        now: T0,
      });
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  it('importRoomCatalog refuses a nightly price that does not match BR-101', async () => {
    await expect(
      db.withContext(t.ctx(0), (tx) =>
        importRoomCatalog(tx, fa.app.get(ParameterService), {
          groups: [{ code: 'Z', name: 'Z', sortOrder: 9, baseOccupancy: 2, maxOccupancy: 3 }],
          rooms: [
            {
              roomNo: '777',
              group: 'Z',
              monthlyListPriceVnd: 8_000_000,
              expectedNightlyListPriceVnd: 666_000,
            },
          ],
          activeFrom: '2026-10-01',
          now: T0,
        }),
      ),
    ).rejects.toThrow(/BR-101/);
  });

  it('listRoomGroups / listRooms: catalogue of the property only, current list price (BR-101)', async () => {
    const groups = await Client.of(fa, t, 'fd').get(`${P(t)}/room-groups`);
    expect(groups.statusCode).toBe(200);
    expect(groups.json().data.map((g: { code: string }) => g.code)).toEqual(['L12', 'N']);
    groupL12 = groups.json().data[0].id;
    const rooms = await Client.of(fa, t, 'sal').get(`${P(t)}/rooms`);
    expect(rooms.statusCode).toBe(200);
    expect(rooms.json().data).toEqual([
      expect.objectContaining({
        roomNo: '101',
        baseOccupancy: 2,
        maxOccupancy: 3,
        isSellable: true,
        currentListPrice: {
          effectiveFrom: '2026-10-01',
          monthlyListPriceVnd: 8_000_000,
          nightlyListPriceVnd: 667_000,
        },
        version: 1,
      }),
      expect.objectContaining({ roomNo: '401', baseOccupancy: 4, maxOccupancy: 5 }),
    ]);
  });

  it('housekeeping is refused (BUG-R1-005) → 403 + access.denied', async () => {
    const res = await Client.of(fa, t, 'hk').get(`${P(t)}/rooms`, {
      'x-request-id': 'req-hk-rooms-01',
    });
    expect(res.statusCode).toBe(403);
    const audit = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT action FROM audit_event WHERE request_id = 'req-hk-rooms-01'`),
    );
    expect(audit.rows).toEqual([{ action: 'access.denied' }]);
  });

  it('RLS: property 1 is a 404 for users without a role there; property-1 rooms never leak into property 0', async () => {
    expect((await Client.of(fa, t, 'owner').get(`${P(t, 1)}/rooms`)).statusCode).toBe(404);
    const rows = await db.withContext(t.ctx(0), (tx) =>
      tx.query(`SELECT room_no FROM room ORDER BY room_no`),
    );
    expect(rows.rows.map((r) => r.room_no)).toEqual(['101', '401']);
    const none = await db.withContext({ ...t.ctx(0), propertyId: null }, (tx) =>
      tx.query('SELECT 1 FROM room'),
    );
    expect(none.rows).toHaveLength(0);
  });

  it('createRoom: defaults from the group, nightly computed; MAX_OCCUPANCY_RANGE; DUPLICATE; unknown group', async () => {
    const owner = Client.of(fa, t, 'owner');
    const res = await owner.send('POST', `${P(t)}/rooms`, {
      roomNo: '202',
      name: 'The Valley',
      roomGroupId: groupL12,
      monthlyListPriceVnd: 9_500_000,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      roomNo: '202',
      baseOccupancy: 2,
      maxOccupancy: 3,
      activeFrom: '2026-10-15',
      currentListPrice: { nightlyListPriceVnd: 792_000, monthlyListPriceVnd: 9_500_000 },
    });
    const bad = await owner.send('POST', `${P(t)}/rooms`, {
      roomNo: '203',
      roomGroupId: groupL12,
      baseOccupancy: 2,
      maxOccupancy: 4,
      monthlyListPriceVnd: 9_500_000,
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toEqual([{ field: 'maxOccupancy', code: 'MAX_OCCUPANCY_RANGE' }]);
    const dup = await owner.send('POST', `${P(t)}/rooms`, {
      roomNo: '202',
      roomGroupId: groupL12,
      monthlyListPriceVnd: 9_500_000,
    });
    expect(dup.statusCode).toBe(422);
    expect(dup.json().errors).toEqual([{ field: 'roomNo', code: 'DUPLICATE' }]);
    const noGroup = await owner.send('POST', `${P(t)}/rooms`, {
      roomNo: '204',
      roomGroupId: uuidv7(),
      monthlyListPriceVnd: 9_500_000,
    });
    expect(noGroup.statusCode).toBe(422);
    expect(noGroup.json().errors).toEqual([{ field: 'roomGroupId', code: 'NOT_IN_LIST' }]);
    expect(
      (
        await Client.of(fa, t, 'fd').send('POST', `${P(t)}/rooms`, {
          roomNo: '205',
          roomGroupId: groupL12,
          monthlyListPriceVnd: 9_500_000,
        })
      ).statusCode,
    ).toBe(403);
  });

  it('updateRoom: 428 without If-Match, 412 stale, occupancy rule, future price keeps today’s price, audit config', async () => {
    const owner = Client.of(fa, t, 'owner');
    const list = await owner.get(`${P(t)}/rooms`);
    const room = list.json().data.find((r: { roomNo: string }) => r.roomNo === '101');
    const url = `${P(t)}/rooms/${room.id}`;
    const fa428 = await fa.app.inject({
      method: 'PATCH',
      url,
      payload: { name: 'X' },
      headers: owner.headers({}, true),
    });
    expect(fa428.statusCode).toBe(428);
    expect((await owner.send('PATCH', url, { name: 'X' }, { 'if-match': '"9"' })).statusCode).toBe(
      412,
    );
    const occ = await owner.send('PATCH', url, { baseOccupancy: 4 }, { 'if-match': '"1"' });
    expect(occ.statusCode).toBe(422);
    expect(occ.json().errors[0].code).toBe('MAX_OCCUPANCY_RANGE');
    const past = await owner.send(
      'PATCH',
      url,
      {
        listPrice: {
          effectiveFrom: '2026-10-14',
          monthlyListPriceVnd: 8_400_000,
          reason: 'Điều chỉnh',
        },
      },
      { 'if-match': '"1"' },
    );
    expect(past.statusCode).toBe(422);
    expect(past.json().errors[0]).toEqual({
      field: 'listPrice.effectiveFrom',
      code: 'DATE_IN_PAST',
    });

    const ok = await Client.of(fa, t, 'mgr').send(
      'PATCH',
      url,
      {
        maxOccupancy: null,
        baseOccupancy: 3,
        isSellable: false,
        listPrice: {
          effectiveFrom: '2026-11-01',
          monthlyListPriceVnd: 8_400_000,
          reason: 'Giá mùa cao điểm',
        },
      },
      { 'if-match': '"1"' },
    );
    expect(ok.statusCode).toBe(200);
    expect(ok.headers.etag).toBe('"2"');
    expect(ok.json()).toMatchObject({
      baseOccupancy: 3,
      maxOccupancy: 4,
      isSellable: false,
      // AC1: the new price applies from its effective date; today the old one is current.
      currentListPrice: { effectiveFrom: '2026-10-01', nightlyListPriceVnd: 667_000 },
      version: 2,
    });
    const rows = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT effective_from::text AS f, nightly_list_price_vnd AS n FROM room_list_price WHERE room_id = $1 ORDER BY 1`,
        [room.id],
      ),
    );
    expect(rows.rows).toEqual([
      { f: '2026-10-01', n: 667_000 },
      { f: '2026-11-01', n: 700_000 },
    ]);
    const audit = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT category, reason, after FROM audit_event WHERE entity_type = 'room' AND entity_id = $1`,
        [room.id],
      ),
    );
    expect(audit.rows[0]).toMatchObject({ category: 'config', reason: 'Giá mùa cao điểm' });
    expect(audit.rows[0]!.after).toMatchObject({ isSellable: false, maxOccupancy: 4 });
  });

  describe('parameters (US-005)', () => {
    it('listParameters: FDL reads operational keys but not security keys; owner sees security keys with defaults', async () => {
      const fdl = await Client.of(fa, t, 'fdl').get(`${P(t)}/parameters`);
      expect(fdl.statusCode).toBe(200);
      const keys = fdl.json().data.map((p: { key: string }) => p.key);
      expect(keys).toContain('night_from_month_divisor');
      expect(keys).not.toContain('trusted_device_days');
      expect(keys).not.toContain('session_policy');
      const own = await Client.of(fa, t, 'owner').get(`${P(t)}/parameters`);
      const td = own.json().data.find((p: { key: string }) => p.key === 'trusted_device_days');
      expect(td).toMatchObject({ value: 180, editableBy: ['owner'], brRef: 'SR-DEV-01' });
      expect((await Client.of(fa, t, 'fd').get(`${P(t)}/parameters`)).statusCode).toBe(403);
      expect(
        (await Client.of(fa, t, 'fdl').get(`${P(t)}/parameters/trusted_device_days`)).statusCode,
      ).toBe(404);
    });

    it('setParameter: manager edits an operational key (A101), history shows it; past date → DATE_IN_PAST', async () => {
      const mgr = Client.of(fa, t, 'mgr');
      const res = await mgr.send('PUT', `${P(t)}/parameters/night_from_month_divisor`, {
        value: 12,
        effectiveFrom: '2026-10-20',
        reason: 'Giữ nguyên, thử lưu lịch',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        key: 'night_from_month_divisor',
        value: 12,
        effectiveFrom: '2026-10-20',
      });
      const hist = await mgr.get(`${P(t)}/parameters/night_from_month_divisor`);
      expect(hist.json().current.effectiveFrom).toBe('2026-10-01');
      expect(hist.json().history.map((h: { effectiveFrom: string }) => h.effectiveFrom)).toEqual([
        '2026-10-20',
        '2026-10-01',
      ]);
      const past = await mgr.send('PUT', `${P(t)}/parameters/night_from_month_divisor`, {
        value: 12,
        effectiveFrom: '2026-10-01',
        reason: 'Sửa quá khứ',
      });
      expect(past.statusCode).toBe(422);
      expect(past.json().errors[0]).toEqual({ field: 'effectiveFrom', code: 'DATE_IN_PAST' });
    });

    it('owner-only keys: manager → 403 + access.denied (A102/A119); owner out of SEC bounds → 422 PARAM_OUT_OF_RANGE', async () => {
      const res = await Client.of(fa, t, 'mgr').send(
        'PUT',
        `${P(t)}/parameters/trusted_device_days`,
        { value: 90, effectiveFrom: '2026-10-16', reason: 'Rút ngắn hạn' },
        { 'x-request-id': 'req-mgr-param-01' },
      );
      expect(res.statusCode).toBe(403);
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query(`SELECT action, entity_id FROM audit_event WHERE request_id = 'req-mgr-param-01'`),
      );
      expect(audit.rows).toEqual([{ action: 'access.denied', entity_id: 'trusted_device_days' }]);

      const owner = Client.of(fa, t, 'owner');
      const out = await owner.send('PUT', `${P(t)}/parameters/trusted_device_mobile_days`, {
        value: 45,
        effectiveFrom: '2026-10-16',
        reason: 'Thử vượt biên',
      });
      expect(out.statusCode).toBe(422);
      expect(out.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', min: 1, max: 30 });
      const ok = await owner.send('PUT', `${P(t)}/parameters/trusted_device_mobile_days`, {
        value: 14,
        effectiveFrom: '2026-10-16',
        reason: 'Máy tính bảng 2 tuần',
      });
      expect(ok.statusCode).toBe(200);
      const sec = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT category FROM audit_event WHERE entity_id = 'trusted_device_mobile_days' AND action = 'config.changed'`,
        ),
      );
      expect(sec.rows).toEqual([{ category: 'security' }]);
    });

    it('9.1a bounds and structured keys → PARAM_OUT_OF_RANGE; reason with a card number → CARD_NUMBER_DETECTED', async () => {
      const owner = Client.of(fa, t, 'owner');
      const div = await owner.send('PUT', `${P(t)}/parameters/night_from_month_divisor`, {
        value: 40,
        effectiveFrom: '2026-10-16',
        reason: 'Vượt biên',
      });
      expect(div.statusCode).toBe(422);
      expect(div.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', min: 1, max: 31 });
      const hold = await owner.send('PUT', `${P(t)}/parameters/hold_hours_options`, {
        value: [24, 24],
        effectiveFrom: '2026-10-16',
        reason: 'Trùng phần tử',
      });
      expect(hold.statusCode).toBe(422);
      expect(hold.json().code).toBe('PARAM_OUT_OF_RANGE');
      const sp = await owner.send('PUT', `${P(t)}/parameters/session_policy`, {
        value: {
          admin: { idleMinutes: 30, maxHours: 9999 },
          staff_pwa: { idleMinutes: 60, maxHours: 24 },
        },
        effectiveFrom: '2026-10-16',
        reason: 'Sai cấu trúc',
      });
      expect(sp.statusCode).toBe(422);
      const card = await owner.send('PUT', `${P(t)}/parameters/night_from_month_divisor`, {
        value: 12,
        effectiveFrom: '2026-10-16',
        reason: 'thẻ 4111 1111 1111 1111',
      });
      expect(card.statusCode).toBe(422);
      expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
    });
  });
});
