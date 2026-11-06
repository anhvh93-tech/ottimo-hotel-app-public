/**
 * PR-C1 (OpenAPI 0.3.13) on Nest/Fastify + the real PostgreSQL. FAKE data only.
 * - V5-1A (contract 1.8, 1.24; BR-101 (1), (4), (5)): the nightly list price is required on every write path –
 *   T1A-1 updateRoom without it → 422 REQUIRED, nothing written; T1A-2 createRoom without it → 422, no room;
 *   T1A-3 nightly 0 → 422 (not 500); T1A-4 both prices → one row with both numbers; T1A-5 the catalogue import
 *   without prices → room not for sale, static `pricegap` (ops-check V5-73) = 0. `NIGHTLY_PRICE_UNUSUAL` on both
 *   answers (saved anyway). BR-101-17 of br-examples.json drives the 422 case of room 102.
 * - V5-44 (b) (contract 1.11, T44-3): a row between the app's (fake) business date and the DB's real date passes
 *   the service check, the 0094 trigger refuses the DELETE → 409 `effective`, row and version kept, no audit.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  RoomCatalogImportError,
  importRoomCatalog,
} from '../../src/modules/platform/public/room-catalog-import';
import { Client, type FeatureApp, P, T0, startFeatureApp } from '../helpers/feature-app';
import { pricegapStatic } from '../helpers/pricegap-static';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

type Room = {
  id: string;
  roomNo: string;
  version: number;
  isSellable: boolean;
  currentListPrice?: {
    effectiveFrom: string;
    monthlyListPriceVnd: number;
    nightlyListPriceVnd: number;
  };
  warnings?: Array<{ code: string; count?: number }>;
};

const BR_101_17 = (
  JSON.parse(
    readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
  ) as {
    examples: Array<{
      id: string;
      input: {
        roomNo: string;
        before: { monthlyListPriceVnd: number; nightlyListPriceVnd: number };
        request: { monthlyListPriceVnd: number };
      };
      expected: {
        httpStatus: number;
        after: { monthlyListPriceVnd: number; nightlyListPriceVnd: number };
      };
    }>;
  }
).examples.find((e) => e.id === 'BR-101-17')!;

describe.skipIf(!HAS_DB)('V5-1A nightly list price required + V5-44 (b) (OpenAPI 0.3.13)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let own: Client;
  let mgr: Client;
  const url = (path = '') => `${P(t)}${path}`;

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { own: ['owner'], mgr: ['manager'] } });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    own = Client.of(fa, t, 'own');
    mgr = Client.of(fa, t, 'mgr');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const roomByNo = async (no: string) => {
    const r = await own.get(url('/rooms?includeInactive=true'));
    expect(r.statusCode, r.body).toBe(200);
    return (r.json().data as Room[]).find((x) => x.roomNo === no)!;
  };
  const priceRows = (roomId: string) =>
    db.withContext(t.ctx(), (tx) =>
      tx
        .query<{ f: string; m: number; n: number }>(
          `SELECT effective_from::text AS f, monthly_list_price_vnd AS m, nightly_list_price_vnd AS n
             FROM room_list_price WHERE room_id = $1 ORDER BY effective_from`,
          [roomId],
        )
        .then((r) => r.rows),
    );
  const auditCount = (action: string, entityId: string) =>
    db.withContext(t.ctx(), (tx) =>
      tx
        .query<{ n: number }>(
          `SELECT count(*)::int AS n FROM audit_event WHERE action = $1 AND entity_id = $2`,
          [action, entityId],
        )
        .then((r) => r.rows[0]!.n),
    );
  const patch = (r: Room, body: Record<string, unknown>, who = own) =>
    who.send('PATCH', url(`/rooms/${r.id}`), body, { 'if-match': `"${r.version}"` });
  const create = (body: Record<string, unknown>) =>
    own.send('POST', url('/rooms'), { roomGroupId: ids.groups.L12, ...body });

  describe('updateRoom', () => {
    it('T1A-1 / BR-101-17: room 102, monthly price only → 422 listPrice.nightlyListPriceVnd REQUIRED; price, version, audit unchanged', async () => {
      const ex = BR_101_17;
      expect(ex.expected.httpStatus).toBe(422);
      let r = await roomByNo(ex.input.roomNo);
      // the "before" of the example: 9.000.000 · 800.000 in force today
      const set = await patch(r, {
        listPrice: {
          effectiveFrom: '2026-10-15',
          ...ex.input.before,
          reason: 'Bảng giá 01/11',
        },
      });
      expect(set.statusCode, set.body).toBe(200);
      r = set.json() as Room;
      const rowsBefore = await priceRows(r.id);
      const audits = await auditCount('room.updated', r.id);
      for (const who of [own, mgr]) {
        const res = await patch(
          r,
          {
            listPrice: {
              effectiveFrom: '2026-10-15',
              monthlyListPriceVnd: ex.input.request.monthlyListPriceVnd,
              reason: 'Script quên giá đêm',
            },
          },
          who,
        );
        expect(res.statusCode, res.body).toBe(ex.expected.httpStatus);
        expect(res.json()).toMatchObject({
          code: 'VALIDATION_FAILED',
          errors: [{ field: 'listPrice.nightlyListPriceVnd', code: 'REQUIRED' }],
        });
      }
      const after = await roomByNo(ex.input.roomNo);
      expect(after.version).toBe(r.version);
      expect(after.currentListPrice).toMatchObject(ex.expected.after);
      expect(await priceRows(r.id)).toEqual(rowsBefore);
      expect(await auditCount('room.updated', r.id)).toBe(audits);
    });

    it('T1A-3: nightly 0 or negative → 422 VALUE_OUT_OF_RANGE (not 500), nothing written', async () => {
      const r = await roomByNo('103');
      const rowsBefore = await priceRows(r.id);
      for (const nightly of [0, -800_000]) {
        const res = await patch(r, {
          listPrice: {
            effectiveFrom: '2026-11-01',
            monthlyListPriceVnd: 9_000_000,
            nightlyListPriceVnd: nightly,
            reason: 'Giá mùa lễ hội hoa',
          },
        });
        expect(res.statusCode, res.body).toBe(422);
        expect(res.json().errors).toEqual([
          { field: 'listPrice.nightlyListPriceVnd', code: 'VALUE_OUT_OF_RANGE' },
        ]);
      }
      expect(await priceRows(r.id)).toEqual(rowsBefore);
    });

    it('T1A-4 + NIGHTLY_PRICE_UNUSUAL: both prices stored as given; 1.701.000 for 8.500.000 warns (saved), 1.700.000 does not', async () => {
      let r = await roomByNo('201');
      const warn = await patch(r, {
        listPrice: {
          effectiveFrom: '2026-11-01',
          monthlyListPriceVnd: 8_500_000,
          nightlyListPriceVnd: 1_701_000,
          reason: 'Giá mùa lễ hội hoa',
        },
      });
      expect(warn.statusCode, warn.body).toBe(200);
      r = warn.json() as Room;
      expect(r.warnings).toEqual([{ code: 'NIGHTLY_PRICE_UNUSUAL' }]);
      expect((await priceRows(r.id)).find((x) => x.f === '2026-11-01')).toEqual({
        f: '2026-11-01',
        m: 8_500_000,
        n: 1_701_000,
      });
      const ok = await patch(r, {
        listPrice: {
          effectiveFrom: '2026-11-01',
          monthlyListPriceVnd: 8_500_000,
          nightlyListPriceVnd: 1_700_000,
          reason: 'Sửa giá đêm gõ nhầm',
        },
      });
      expect(ok.statusCode, ok.body).toBe(200);
      r = ok.json() as Room;
      expect(r.warnings).toEqual([]);
      expect((await priceRows(r.id)).find((x) => x.f === '2026-11-01')).toEqual({
        f: '2026-11-01',
        m: 8_500_000,
        n: 1_700_000,
      });
      // no listPrice in the patch → no price warning
      const plain = await patch(r, { name: 'The Amber' });
      expect(plain.statusCode, plain.body).toBe(200);
      expect((plain.json() as Room).warnings).toEqual([]);
    });

    it('stopping sales and an unusual price: both warnings, FUTURE_RESERVATIONS_KEEP_ROOM keeps its count', async () => {
      const r = await roomByNo('202');
      const res = await patch(r, {
        isSellable: false,
        listPrice: {
          effectiveFrom: '2026-11-01',
          monthlyListPriceVnd: 9_000_000,
          nightlyListPriceVnd: 8_000_000,
          reason: 'Gõ thừa số 0',
        },
      });
      expect(res.statusCode, res.body).toBe(200);
      const codes = ((res.json() as Room).warnings ?? []).map((w) => w.code);
      expect(codes).toContain('NIGHTLY_PRICE_UNUSUAL');
      for (const w of (res.json() as Room).warnings ?? []) {
        if (w.code === 'NIGHTLY_PRICE_UNUSUAL') expect(w).toEqual({ code: w.code });
        else expect(w.count).toBeGreaterThan(0);
      }
    });
  });

  describe('createRoom', () => {
    it('T1A-2: no nightly price → 422 nightlyListPriceVnd REQUIRED, no room, no audit', async () => {
      const res = await create({ roomNo: '7N1', monthlyListPriceVnd: 8_500_000 });
      expect(res.statusCode, res.body).toBe(422);
      expect(res.json()).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'nightlyListPriceVnd', code: 'REQUIRED' }],
      });
      const left = await db.withContext(t.ctx(), (tx) =>
        tx.query(`SELECT 1 FROM room WHERE room_no = '7N1'`),
      );
      expect(left.rows).toHaveLength(0);
    });

    it('T1A-3: nightly 0 → 422 VALUE_OUT_OF_RANGE (not 500), no room', async () => {
      const res = await create({
        roomNo: '7N2',
        monthlyListPriceVnd: 8_500_000,
        nightlyListPriceVnd: 0,
      });
      expect(res.statusCode, res.body).toBe(422);
      expect(res.json().errors).toEqual([
        { field: 'nightlyListPriceVnd', code: 'VALUE_OUT_OF_RANGE' },
      ]);
      const left = await db.withContext(t.ctx(), (tx) =>
        tx.query(`SELECT 1 FROM room WHERE room_no = '7N2'`),
      );
      expect(left.rows).toHaveLength(0);
    });

    it('T1A-4: both prices → 201, one row with both numbers, audit room.created with both; 284.000 → warnings []', async () => {
      const res = await create({
        roomNo: '7N3',
        monthlyListPriceVnd: 8_500_000,
        nightlyListPriceVnd: 284_000,
      });
      expect(res.statusCode, res.body).toBe(201);
      const r = res.json() as Room;
      expect(r.warnings).toEqual([]);
      expect(r.currentListPrice).toEqual({
        effectiveFrom: '2026-10-15',
        monthlyListPriceVnd: 8_500_000,
        nightlyListPriceVnd: 284_000,
      });
      expect(await priceRows(r.id)).toEqual([{ f: '2026-10-15', m: 8_500_000, n: 284_000 }]);
      const audit = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ after: Record<string, unknown> }>(
          `SELECT after FROM audit_event WHERE action = 'room.created' AND entity_id = $1`,
          [r.id],
        ),
      );
      expect(audit.rows[0]!.after).toMatchObject({
        monthlyListPriceVnd: 8_500_000,
        nightlyListPriceVnd: 284_000,
      });
    });

    it('NIGHTLY_PRICE_UNUSUAL: 283.000 for 8.500.000 → 201 with the warning, price saved as given', async () => {
      const res = await create({
        roomNo: '7N4',
        monthlyListPriceVnd: 8_500_000,
        nightlyListPriceVnd: 283_000,
      });
      expect(res.statusCode, res.body).toBe(201);
      const r = res.json() as Room;
      expect(r.warnings).toEqual([{ code: 'NIGHTLY_PRICE_UNUSUAL' }]);
      expect(await priceRows(r.id)).toEqual([{ f: '2026-10-15', m: 8_500_000, n: 283_000 }]);
    });
  });

  describe('room catalogue import (T1A-5)', () => {
    const group = (code: string) => ({
      code,
      name: `Nhóm ${code}`,
      sortOrder: 9,
      baseOccupancy: 2,
      maxOccupancy: 3,
    });

    it('no price → room created not for sale, no row; static pricegap = 0 (and counts it once it is put on sale)', async () => {
      const out = await db.withContext(t.ctx(), (tx) =>
        importRoomCatalog(tx, {
          groups: [group('I1')],
          rooms: [
            { roomNo: '8I1', group: 'I1' },
            {
              roomNo: '8I2',
              group: 'I1',
              monthlyListPriceVnd: 8_500_000,
              nightlyListPriceVnd: 800_000,
            },
            {
              roomNo: '8I3',
              group: 'I1',
              monthlyListPriceVnd: 8_500_000,
              nightlyListPriceVnd: 1_701_000,
            },
          ],
          activeFrom: '2026-10-15',
          now: T0,
        }),
      );
      expect(out).toEqual({
        groups: 1,
        rooms: 3,
        unpriced: ['8I1'],
        nightlyPriceUnusual: ['8I3'],
      });
      const rows = await db.withContext(t.ctx(), (tx) =>
        tx
          .query<{ no: string; sellable: boolean; prices: number }>(
            `SELECT r.room_no AS no, r.is_sellable AS sellable,
                    (SELECT count(*)::int FROM room_list_price p WHERE p.room_id = r.id) AS prices
               FROM room r WHERE r.room_no IN ('8I1', '8I2', '8I3') ORDER BY 1`,
          )
          .then((r) => r.rows),
      );
      expect(rows).toEqual([
        { no: '8I1', sellable: false, prices: 0 },
        { no: '8I2', sellable: true, prices: 1 },
        { no: '8I3', sellable: true, prices: 1 },
      ]);
      // pricegap only counts rooms with a website room type: give 8I1 one (as OWN would) – still 0, not for sale
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE room SET public_room_type = 'Standard Studio' WHERE room_no = '8I1'`),
      );
      expect(await db.withContext(t.ctx(), (tx) => pricegapStatic(tx))).toBe(0);
      // control: the same room on sale without a price is exactly what the check reports
      await db.withContext(t.ctx(), async (tx) => {
        await tx.query(`UPDATE room SET is_sellable = true WHERE room_no = '8I1'`);
        expect(await pricegapStatic(tx)).toBe(1);
        await tx.query(`UPDATE room SET is_sellable = false WHERE room_no = '8I1'`);
      });
      expect(await db.withContext(t.ctx(), (tx) => pricegapStatic(tx))).toBe(0);
    });

    it.each([
      [
        'only the monthly price',
        { roomNo: '8J1', group: 'J1', monthlyListPriceVnd: 8_500_000 },
        /both required/,
      ],
      [
        'only the nightly price',
        { roomNo: '8J1', group: 'J1', nightlyListPriceVnd: 800_000 },
        /both required/,
      ],
      [
        'a nightly price of 0',
        { roomNo: '8J1', group: 'J1', monthlyListPriceVnd: 8_500_000, nightlyListPriceVnd: 0 },
        /both required/,
      ],
      [
        'the retired expectedNightlyListPriceVnd key',
        {
          roomNo: '8J1',
          group: 'J1',
          monthlyListPriceVnd: 8_500_000,
          expectedNightlyListPriceVnd: 708_000,
        },
        /retired/,
      ],
      [
        'for sale without a price',
        { roomNo: '8J1', group: 'J1', isSellable: true },
        /cannot be for sale/,
      ],
    ])('refuses %s – nothing kept', async (_case, room, message) => {
      const err = await db
        .withContext(t.ctx(), (tx) =>
          importRoomCatalog(tx, {
            groups: [group('J1')],
            rooms: [room as Parameters<typeof importRoomCatalog>[1]['rooms'][number]],
            activeFrom: '2026-10-15',
            now: T0,
          }),
        )
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(RoomCatalogImportError);
      expect(String((err as Error).message)).toMatch(message);
      const left = await db.withContext(t.ctx(), (tx) =>
        tx.query(`SELECT 1 FROM room_group WHERE code = 'J1'`),
      );
      expect(left.rows).toHaveLength(0);
    });
  });

  describe('V5-44 (b) cancelScheduledRoomListPrice – trigger 0094 refusal', () => {
    it('T44-3: a row future for the app clock but past for the DB clock → 409 effective (not 500), row, version and audit kept', async () => {
      // The trigger reads the DB's real date; the app clock is T0 (business date 15/10/2026). A row dated the day
      // before the DB's real date is in the past for the trigger and in the future for the service check.
      const { rows } = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ d: string }>(
          `SELECT ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 1)::text AS d`,
        ),
      );
      const dbYesterday = rows[0]!.d;
      expect(dbYesterday > '2026-10-16', 'the DB clock must be past the fake business date').toBe(
        true,
      );
      await touchSessions(db, t, T0);
      let r = await roomByNo('301');
      const set = await patch(r, {
        listPrice: {
          effectiveFrom: dbYesterday,
          monthlyListPriceVnd: 13_500_000,
          nightlyListPriceVnd: 1_300_000,
          reason: 'Bảng giá 01/11',
        },
      });
      expect(set.statusCode, set.body).toBe(200);
      r = set.json() as Room;
      const rowsBefore = await priceRows(r.id);
      expect(rowsBefore.map((x) => x.f)).toContain(dbYesterday);
      for (const who of [own, mgr]) {
        const res = await who.send(
          'POST',
          url(`/rooms/${r.id}/list-prices/actions/cancel-scheduled`),
          { effectiveFrom: dbYesterday, reason: 'Nhập nhầm giá đêm' },
          { 'if-match': `"${r.version}"` },
        );
        expect(res.statusCode, res.body).toBe(409);
        expect(res.json()).toMatchObject({
          code: 'INVALID_TRANSITION',
          currentState: 'effective',
        });
      }
      expect(await priceRows(r.id)).toEqual(rowsBefore);
      expect((await roomByNo('301')).version).toBe(r.version);
      expect(await auditCount('room.list_price_cancelled', r.id)).toBe(0);
    });
  });
});
