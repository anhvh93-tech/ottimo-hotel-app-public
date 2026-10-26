/**
 * FB-INV-005 D-min (DOM `rounds/round-03/outputs/DOM/fb-inv-005.md` mục 4.3) – BE confirmation, no product change:
 * `PATCH /rooms/{id}` with `listPrice.monthlyListPriceVnd` AND `listPrice.nightlyListPriceVnd` stores both numbers
 * as given (the nightly price is NOT monthly ÷ `night_from_month_divisor`), and every price read after that – quote
 * (`POST /quotes/calculate`) and a new booking (`POST /reservations`) – uses the stored nightly price, with the
 * price calendar still added on top (BR-104 weekend +15 %, special dates +30 %; ESC-036 default A).
 * Fake clock: T0 = Thu 15/10/2026 09:00 (VN). DS-E rooms: 101 = 8.000.000/month (÷ 12 → 667.000),
 * 102 = 9.000.000/month (÷ 12 → 750.000).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };

describe.skipIf(!HAS_DB)(
  'FB-INV-005 – monthly and nightly list prices entered independently',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      db = appDatabase(10);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Trần Văn Thử' });
      fa = await startFeatureApp(db);
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      const d = new Date('2026-10-15T09:00:00+07:00');
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
    const roomOf = async (roomNo: string) =>
      ((await c.own!.get(url('/rooms'))).json().data as Array<Record<string, unknown>>).find(
        (r) => r.roomNo === roomNo,
      )!;
    const patchPrice = async (
      roomNo: string,
      listPrice: Record<string, unknown>,
      who: 'own' | 'mgr' = 'own',
    ) => {
      const room = await roomOf(roomNo);
      return c[who]!.send(
        'PATCH',
        url(`/rooms/${String(room.id)}`),
        { listPrice },
        {
          'if-match': `"${Number(room.version)}"`,
        },
      );
    };
    const calc = (roomNo: string, arrivalDate: string, nights: number) =>
      c.fd!.send('POST', url('/quotes/calculate'), {
        type: 'short',
        roomId: ids.rooms[roomNo],
        arrivalDate,
        nights,
        adults: 2,
        channelId: ids.channels.direct,
      });
    const rates = (body: { nightlyRates: Array<{ date: string; amountVnd: number }> }) =>
      body.nightlyRates.map((n) => [n.date, n.amountVnd]);

    it('101: PATCH monthly 8.000.000 + nightly 650.000 (from 01/11) → both stored as entered, not ÷ 12', async () => {
      const res = await patchPrice('101', {
        effectiveFrom: '2026-11-01',
        monthlyListPriceVnd: 8_000_000,
        nightlyListPriceVnd: 650_000,
        reason: 'FB-INV-005: OWN nhập giá đêm riêng',
      });
      expect(res.statusCode, res.body).toBe(200);
      // Today (15/10) the seeded price is still the current one (BR-006 effective date).
      expect(res.json().currentListPrice).toMatchObject({
        effectiveFrom: '2026-10-01',
        monthlyListPriceVnd: 8_000_000,
        nightlyListPriceVnd: 667_000,
      });
      const rows = await q<{ f: string; m: number; n: number }>(
        `SELECT effective_from::text AS f, monthly_list_price_vnd AS m, nightly_list_price_vnd AS n
         FROM room_list_price WHERE room_id = $1 ORDER BY effective_from`,
        [ids.rooms['101']],
      );
      expect(rows).toEqual([
        { f: '2026-10-01', m: 8_000_000, n: 667_000 },
        // 8.000.000 ÷ 12 would be 667.000 – the entered 650.000 wins.
        { f: '2026-11-01', m: 8_000_000, n: 650_000 },
      ]);
      const audit = await q<{ after: { listPrice: Record<string, unknown> }; reason: string }>(
        `SELECT after, reason FROM audit_event WHERE entity_type = 'room' AND entity_id = $1
         AND action = 'room.updated'`,
        [ids.rooms['101']],
      );
      expect(audit).toHaveLength(1);
      expect(audit[0]!.after.listPrice).toEqual({
        effectiveFrom: '2026-11-01',
        monthlyListPriceVnd: 8_000_000,
        nightlyListPriceVnd: 650_000,
      });
    });

    it('101 quote: weekday = stored 650.000; FRI/SAT +15 % = 747.500 → 748.000; before 01/11 the old 667.000', async () => {
      // Thu 12/11, Fri 13/11, Sat 14/11, Sun 15/11 – 4 nights, no LOS discount (< 7 nights).
      const res = await calc('101', '2026-11-12', 4);
      expect(res.statusCode, res.body).toBe(200);
      expect(rates(res.json())).toEqual([
        ['2026-11-12', 650_000],
        ['2026-11-13', 748_000],
        ['2026-11-14', 748_000],
        ['2026-11-15', 650_000],
      ]);
      expect(res.json().totalVnd).toBe(2 * 650_000 + 2 * 748_000);
      // Night of Sat 31/10 is still under the 01/10 price (667.000 + 15 % = 767.050 → 767.000); Sun 01/11 = 650.000.
      const edge = await calc('101', '2026-10-31', 2);
      expect(edge.statusCode, edge.body).toBe(200);
      expect(rates(edge.json())).toEqual([
        ['2026-10-31', 767_000],
        ['2026-11-01', 650_000],
      ]);
    });

    it('101 quote on a special date (BR-104, Christmas – New Year 24/12): 650.000 + 30 % = 845.000', async () => {
      const res = await calc('101', '2026-12-23', 2);
      expect(res.statusCode, res.body).toBe(200);
      expect(rates(res.json())).toEqual([
        ['2026-12-23', 650_000],
        ['2026-12-24', 845_000],
      ]);
    });

    it('102: MGR PATCH monthly 8.000.000 + nightly 700.000 from today → current price, new booking priced from it', async () => {
      const res = await patchPrice(
        '102',
        {
          effectiveFrom: '2026-10-15',
          monthlyListPriceVnd: 8_000_000,
          nightlyListPriceVnd: 700_000,
          reason: 'FB-INV-005: giá tháng và giá đêm độc lập',
        },
        'mgr',
      );
      expect(res.statusCode, res.body).toBe(200);
      // 8.000.000 ÷ 12 = 667.000 – not what is stored; the old ÷ 12 of 9.000.000 (750.000) is gone too.
      expect(res.json().currentListPrice).toEqual({
        effectiveFrom: '2026-10-15',
        monthlyListPriceVnd: 8_000_000,
        nightlyListPriceVnd: 700_000,
      });
      const listed = await roomOf('102');
      expect(listed.currentListPrice).toMatchObject({
        monthlyListPriceVnd: 8_000_000,
        nightlyListPriceVnd: 700_000,
      });

      // Quote first (deposit the booking needs), then the booking itself: Thu 19/11 + Fri 20/11.
      const quote = await calc('102', '2026-11-19', 2);
      expect(quote.statusCode, quote.body).toBe(200);
      expect(rates(quote.json())).toEqual([
        ['2026-11-19', 700_000],
        ['2026-11-20', 805_000],
      ]);
      const booking = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms['102'],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        arrivalDate: '2026-11-19',
        departureDate: '2026-11-21',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: quote.json().depositVnd as number,
        },
      });
      expect(booking.statusCode, booking.body).toBe(201);
      const r = booking.json();
      expect(r.nightlyRates.map((n: { amountVnd: number }) => n.amountVnd)).toEqual([
        700_000, 805_000,
      ]);
      expect(r.totalRoomVnd).toBe(1_505_000);
      const nights = await q<{ d: string; v: number }>(
        `SELECT stay_date::text AS d, room_revenue_vnd AS v FROM stay_night
        WHERE reservation_id = $1 AND night_state = 'sold' ORDER BY stay_date`,
        [r.id],
      );
      expect(nights).toEqual([
        { d: '2026-11-19', v: 700_000 },
        { d: '2026-11-20', v: 805_000 },
      ]);
    });

    it('BR-108 one-month alternative still reads the monthly price entered (102 now 8.000.000, 103 still 9.000.000)', async () => {
      // 20 nights → longStayAlternative (rent of one month + service). Only the monthly price differs between the two
      // rooms of group L12, so the alternatives differ by exactly 1.000.000 – the nightly price plays no part.
      const a102 = await calc('102', '2027-01-04', 20);
      const a103 = await calc('103', '2027-01-04', 20);
      expect(a102.statusCode, a102.body).toBe(200);
      expect(a103.statusCode, a103.body).toBe(200);
      const alt = (r: typeof a102) =>
        (r.json().longStayAlternative as { totalVnd: number }).totalVnd;
      expect(alt(a103) - alt(a102)).toBe(1_000_000);
    });
  },
);
