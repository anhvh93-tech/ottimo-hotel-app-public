/**
 * BE-A v1.0.1 (OpenAPI 0.3.9, BUG-R3-018 part 1, FB-INV-005): `Room.scheduledListPrices` (OWN/MGR only, x-visible-to)
 * and `cancelScheduledRoomListPrice` on the real PostgreSQL through HTTP – roles (FDL/FD/SAL/CTV neither see nor
 * cancel), 404 / 409 `effective` / 409 `only_price` / 412, version + 1 and ETag, audit `room.list_price_cancelled`,
 * the price of day D falls back to the previous row, replay of the same Idempotency-Key. FAKE data only.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { PriceEstimateService } from '../../src/modules/public-site/internal/price-estimate.service';
import { Client, type FeatureApp, P, T0, startFeatureApp } from '../helpers/feature-app';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  sal: ['sales_staff'],
  ctv: ['collaborator'],
};

type Room = {
  id: string;
  roomNo: string;
  version: number;
  currentListPrice?: {
    effectiveFrom: string;
    monthlyListPriceVnd: number;
    nightlyListPriceVnd: number;
  };
  scheduledListPrices?: Array<{
    effectiveFrom: string;
    monthlyListPriceVnd: number;
    nightlyListPriceVnd: number;
    changedBy: string | null;
    changedAt: string;
    reason: string | null;
  }>;
};

describe.skipIf(!HAS_DB)(
  'rooms – scheduled list prices + cancel (OpenAPI 0.3.9, BUG-R3-018 part 1)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      db = appDatabase(5);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      // 0094: the cancelled row must be future for the DB's real clock too (trigger room_list_price_append_only);
      // the 2037 rows are quoted, so this tenant books that far ahead.
      await setParam(db, t, 'booking_window_days', 4_500, '2026-10-02');
      fa = await startFeatureApp(db);
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    const url = (path = '') => `${P(t)}${path}`;
    const rooms = async (who: string) => {
      const r = await c[who]!.get(url('/rooms'));
      expect(r.statusCode, r.body).toBe(200);
      return r.json().data as Room[];
    };
    const room = async (who: string, no: string) =>
      (await rooms(who)).find((r) => r.roomNo === no)!;
    const schedule = async (
      no: string,
      effectiveFrom: string,
      monthly: number,
      nightly: number,
    ) => {
      const r0 = await room('own', no);
      const res = await c.own!.send(
        'PATCH',
        url(`/rooms/${r0.id}`),
        {
          listPrice: {
            effectiveFrom,
            monthlyListPriceVnd: monthly,
            nightlyListPriceVnd: nightly,
            reason: 'Giá mùa lễ hội hoa',
          },
        },
        { 'if-match': `"${r0.version}"` },
      );
      expect(res.statusCode, res.body).toBe(200);
      return res.json() as Room;
    };
    const cancel = (
      who: string,
      r: Room,
      body: Record<string, unknown>,
      headers: Record<string, string> = {},
    ) =>
      c[who]!.send('POST', url(`/rooms/${r.id}/list-prices/actions/cancel-scheduled`), body, {
        'if-match': `"${r.version}"`,
        ...headers,
      });
    /** Price of one night D for room `roomNo` (BR-104 calendar on the list price row in force for D). */
    const quoteNight = async (roomNo: string, date: string) => {
      const res = await c.fd!.send('POST', url('/quotes/calculate'), {
        type: 'short',
        roomId: ids.rooms[roomNo],
        arrivalDate: date,
        nights: 1,
        adults: 2,
        channelId: ids.channels.direct,
      });
      expect(res.statusCode, res.body).toBe(200);
      return (res.json().nightlyRates as Array<{ date: string; amountVnd: number }>)[0]!.amountVnd;
    };

    it('OWN/MGR see the scheduled rows (ascending, who/why); FDL/FD/SAL/CTV do not get the field', async () => {
      const today = (await room('own', '101')).currentListPrice!.effectiveFrom;
      expect(today <= '2026-10-15').toBe(true);
      await schedule('101', '2037-12-20', 9_000_000, 800_000);
      const updated = await schedule('101', '2037-11-20', 8_600_000, 720_000);
      expect(updated.scheduledListPrices?.map((p) => p.effectiveFrom)).toEqual([
        '2037-11-20',
        '2037-12-20',
      ]);
      for (const who of ['own', 'mgr']) {
        const r = await room(who, '101');
        expect(r.scheduledListPrices, who).toEqual([
          expect.objectContaining({
            effectiveFrom: '2037-11-20',
            monthlyListPriceVnd: 8_600_000,
            nightlyListPriceVnd: 720_000,
            reason: 'Giá mùa lễ hội hoa',
            changedBy: expect.any(String),
            changedAt: expect.stringMatching(/\+07:00$/),
          }),
          expect.objectContaining({ effectiveFrom: '2037-12-20', nightlyListPriceVnd: 800_000 }),
        ]);
        // a room without scheduled rows answers an empty list
        expect((await room(who, '102')).scheduledListPrices).toEqual([]);
      }
      for (const who of ['fdl', 'fd', 'sal', 'ctv']) {
        const list = await rooms(who);
        for (const r of list) expect('scheduledListPrices' in r, `${who} ${r.roomNo}`).toBe(false);
      }
    });

    it('cancel: FDL/FD/SAL/CTV → 403; 404 / 409 effective / 409 only_price / 412 / 422; success → version + 1, ETag, audit, price falls back, replay', async () => {
      const r = await room('own', '101');
      const body = { effectiveFrom: '2037-11-20', reason: 'Nhập nhầm giá đêm' };
      for (const who of ['fdl', 'fd', 'sal', 'ctv']) {
        expect((await cancel(who, r, body)).statusCode, who).toBe(403);
      }
      expect((await cancel('own', r, { ...body, effectiveFrom: '2037-11-21' })).statusCode).toBe(
        404,
      );
      const missingReason = await cancel('own', r, { effectiveFrom: '2037-11-20', reason: 'x' });
      expect(missingReason.statusCode).toBe(422);
      expect(missingReason.json().errors).toContainEqual({
        field: 'reason',
        code: 'REASON_REQUIRED',
      });
      const extra = await cancel('own', r, { ...body, nightlyListPriceVnd: 1 });
      expect(extra.statusCode).toBe(422);
      // the row in force today
      const current = await cancel('own', r, {
        ...body,
        effectiveFrom: r.currentListPrice!.effectiveFrom,
      });
      expect(current.statusCode).toBe(409);
      expect(current.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'effective',
      });
      // stale version
      expect((await cancel('own', { ...r, version: r.version - 1 }, body)).statusCode).toBe(412);

      const before = await quoteNight('101', '2037-11-25');
      const key = randomUUID();
      const ok = await cancel('mgr', r, body, { 'idempotency-key': key });
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.headers.etag).toBe(`"${r.version + 1}"`);
      expect(ok.json()).toMatchObject({ id: r.id, version: r.version + 1 });
      expect((ok.json() as Room).scheduledListPrices?.map((p) => p.effectiveFrom)).toEqual([
        '2037-12-20',
      ]);
      const replay = await cancel('mgr', r, body, { 'idempotency-key': key });
      expect(replay.statusCode).toBe(200);
      expect(replay.headers['idempotent-replayed']).toBe('true');
      // gone: a second cancel of the same date → 404
      expect((await cancel('own', { ...r, version: r.version + 1 }, body)).statusCode).toBe(404);
      const rows = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ f: string }>(
          `SELECT effective_from::text AS f FROM room_list_price WHERE room_id = $1 ORDER BY 1`,
          [r.id],
        ),
      );
      expect(rows.rows.map((x) => x.f)).toEqual([r.currentListPrice!.effectiveFrom, '2037-12-20']);
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ category: string; before: unknown; after: unknown; reason: string }>(
          `SELECT category, before, after, reason FROM audit_event
          WHERE entity_id = $1 AND action = 'room.list_price_cancelled'`,
          [r.id],
        ),
      );
      expect(audit.rows).toEqual([
        {
          category: 'config',
          before: {
            listPrice: {
              effectiveFrom: '2037-11-20',
              monthlyListPriceVnd: 8_600_000,
              nightlyListPriceVnd: 720_000,
              reason: 'Giá mùa lễ hội hoa',
            },
          },
          after: { cancelledEffectiveFrom: '2037-11-20' },
          reason: 'Nhập nhầm giá đêm',
        },
      ]);
      // Day D (Wed 25/11/2037) now prices from the previous row (today's 667.000), not the cancelled 720.000.
      expect(before).toBe(720_000);
      expect(await quoteNight('101', '2037-11-25')).toBe(r.currentListPrice!.nightlyListPriceVnd);
    });

    it('FB-R4-BE-LPV2M-02: a committed cancel drops the public price-estimate cache of the property; a refused one does not', async () => {
      await schedule('102', '2037-12-20', 9_000_000, 800_000);
      const r = await room('own', '102');
      const estimates = fa.app.get(PriceEstimateService);
      const spy = vi.spyOn(estimates, 'invalidate');
      try {
        const refused = await cancel('own', r, {
          effectiveFrom: r.currentListPrice!.effectiveFrom,
          reason: 'Nhập nhầm giá đêm',
        });
        expect(refused.statusCode).toBe(409);
        expect(spy).not.toHaveBeenCalled();
        const ok = await cancel('own', r, {
          effectiveFrom: '2037-12-20',
          reason: 'Nhập nhầm giá đêm',
        });
        expect(ok.statusCode, ok.body).toBe(200);
        expect(spy).toHaveBeenCalledWith(t.propertyIds[0]);
      } finally {
        spy.mockRestore();
      }
    });

    it("FB-R4-SEC-BE-P411-01: 00:00 → rollover, the row of today's calendar date → 409 effective (not the 0094 trigger's 500), row kept", async () => {
      // 01:00 Asia/Ho_Chi_Minh on 16/10/2026: business date still 15/10 (rollover 06:00, BR-010), calendar date 16/10.
      // 16/10/2026 is in the past for the DB's real clock too, so a DELETE would hit the trigger (→ 500 before the fix).
      await schedule('103', '2026-10-16', 9_200_000, 770_000);
      const night = new Date('2026-10-15T18:00:00.000Z');
      fa.clock.set(night);
      await touchSessions(db, t, night);
      try {
        const r = await room('own', '103');
        expect(r.scheduledListPrices?.map((p) => p.effectiveFrom)).toContain('2026-10-16');
        for (const who of ['own', 'mgr']) {
          const res = await cancel(who, r, {
            effectiveFrom: '2026-10-16',
            reason: 'Nhập nhầm giá đêm',
          });
          expect(res.statusCode, res.body).toBe(409);
          expect(res.json()).toMatchObject({
            code: 'INVALID_TRANSITION',
            currentState: 'effective',
          });
        }
        const rows = await db.withContext(t.ctx(), (tx) =>
          tx.query<{ f: string }>(
            `SELECT effective_from::text AS f FROM room_list_price WHERE room_id = $1 AND effective_from = '2026-10-16'`,
            [r.id],
          ),
        );
        expect(rows.rows).toHaveLength(1);
        expect((await room('own', '103')).version).toBe(r.version);
      } finally {
        fa.clock.set(T0);
        await touchSessions(db, t, T0);
      }
    });

    it('409 only_price: a room created with a future activeFrom has its only row scheduled', async () => {
      const groups = (await c.own!.get(url('/room-groups'))).json().data as Array<{ id: string }>;
      const created = await c.own!.send('POST', url('/rooms'), {
        roomNo: '501',
        roomGroupId: groups[0]!.id,
        monthlyListPriceVnd: 9_000_000,
        activeFrom: '2026-12-01',
      });
      expect(created.statusCode, created.body).toBe(201);
      const r = created.json() as Room;
      expect(r.scheduledListPrices?.map((p) => p.effectiveFrom)).toEqual(['2026-12-01']);
      const res = await cancel('own', r, {
        effectiveFrom: '2026-12-01',
        reason: 'Thử hủy giá duy nhất',
      });
      expect(res.statusCode, res.body).toBe(409);
      expect(res.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'only_price' });
    });

    it('BUG-R4-015 steps 1–4: the earliest scheduled row of a room with a future activeFrom → 409 first_price; the later one can go', async () => {
      const groups = (await c.own!.get(url('/room-groups'))).json().data as Array<{ id: string }>;
      // 1. room created with a future activeFrom: its only row is scheduled
      const created = await c.own!.send('POST', url('/rooms'), {
        roomNo: '502',
        roomGroupId: groups[0]!.id,
        monthlyListPriceVnd: 10_000_000,
        activeFrom: '2026-12-30',
      });
      expect(created.statusCode, created.body).toBe(201);
      const r0 = created.json() as Room;
      // 2. cancel the only row → only_price
      const only = await cancel('own', r0, {
        effectiveFrom: '2026-12-30',
        reason: 'Thử hủy giá duy nhất',
      });
      expect(only.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'only_price' });
      // 3. a later row (future for the DB clock too – 0094); the room is not active yet, so not in the default list
      const patched = await c.own!.send(
        'PATCH',
        url(`/rooms/${r0.id}`),
        {
          listPrice: {
            effectiveFrom: '2037-01-10',
            monthlyListPriceVnd: 11_000_000,
            nightlyListPriceVnd: 917_000,
            reason: 'Giá mùa lễ hội hoa',
          },
        },
        { 'if-match': `"${r0.version}"` },
      );
      expect(patched.statusCode, patched.body).toBe(200);
      const r = patched.json() as Room;
      expect(r.scheduledListPrices?.map((p) => p.effectiveFrom)).toEqual([
        '2026-12-30',
        '2037-01-10',
      ]);
      // 4. cancel the first row → 409 first_price, nothing removed, version unchanged
      for (const who of ['own', 'mgr']) {
        const first = await cancel(who, r, {
          effectiveFrom: '2026-12-30',
          reason: 'Hủy giá đầu của căn',
        });
        expect(first.statusCode, first.body).toBe(409);
        expect(first.json()).toMatchObject({
          code: 'INVALID_TRANSITION',
          currentState: 'first_price',
        });
      }
      const after = (
        (await c.own!.get(url('/rooms?includeInactive=true'))).json().data as Room[]
      ).find((x) => x.roomNo === '502')!;
      expect(after.version).toBe(r.version);
      expect(after.scheduledListPrices?.map((p) => p.effectiveFrom)).toEqual([
        '2026-12-30',
        '2037-01-10',
      ]);
      // the later row is not the first one: it can be cancelled
      const later = await cancel('own', r, {
        effectiveFrom: '2037-01-10',
        reason: 'Nhập nhầm giá đêm',
      });
      expect(later.statusCode, later.body).toBe(200);
      expect((later.json() as Room).scheduledListPrices?.map((p) => p.effectiveFrom)).toEqual([
        '2026-12-30',
      ]);
    });
  },
);
