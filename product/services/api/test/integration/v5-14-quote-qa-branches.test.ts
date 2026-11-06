/**
 * V5-14 / V5-22 – the branches QA found untested in PR #103 (rounds/round-05/reviews/QA-on-be-pr-103-s1.md), on the
 * real modules + PostgreSQL. Only tests, no code change. FAKE data only.
 * - FB-R5-QA-BE-S1-01 (a): a hold from a quote with typed prices AND the BR-111 return code keeps the discounted
 *   nights (665.000 / 618.000 / 752.000 – 650.000 × 95 % = 617.500 → 618.000, half up), the total, the deposit, the
 *   `manual`/`calendar` nights of the snapshot and `losDiscountPct`; (b) the BR-107 tier of T14-7 goes on through
 *   create-hold (nights 1–2 630.000 / 621.000, total and deposit = the quote).
 * - FB-R5-QA-BE-S1-02 (1): `edited` absent on a quote = not edited → the server calendar (OpenAPI QuoteInput.nightlyRates,
 *   SEC ARC-06; createReservation reads an absent flag otherwise); (2) a quote saved before V5-14 (snapshot without
 *   `nights` and `bookingRateSource`) still holds, every night `calendar`, the money of the quote.
 * - FB-R5-QA-BE-S1-03 (1): BR-105 bounds the TYPED price (calendar price, before the tier and the code): the floor +
 *   the code → 200 with the night under the floor; one step under the floor + the code → 422 RATE_OUT_OF_RANGE.
 *   (2) unsorted nightlyRates: in v5-22-rate-bounds.test.ts (with the per-night bounds of ARC S1-01 (3)).
 * - FB-R5-QA-BE-S1-04 (b): a role outside `x-roles` sending nightlyRates → 403 + access.denied WITHOUT reason
 *   WRITE_ROLES and without `after.fields` (S27 tells the two refusals apart); (c) a 422 does not burn the
 *   Idempotency-Key: create-hold with a price field → 422, the same key without it → 201; saveQuote
 *   RATE_OUT_OF_RANGE → 422, the same key with a fixed price → 201.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type SalesIds, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

/** Room 202 on a weekday (DS-E list price, rounding.night_rate 1.000). */
const R202_WEEKDAY = 792_000;
/** Lầu 1–2 (L12) floor of BR-105 (`ota_base_rate` 760.000 × 70 %, OTA unit 10.000). */
const L12_FLOOR = 530_000;
const RETURN_CODE = 'OTTIMO-BACK5';

interface Night {
  date: string;
  amountVnd: number;
  calendarRateVnd?: number;
}
interface Snapshot {
  bookingRateSource?: string;
  losDiscountPct?: number;
  nights?: Array<{ date: string; source: string; calendarVnd?: number }>;
}

describe.skipIf(!HAS_DB)(
  'V5-14 – QA S1 branches (hold with a discount, edited absent, bounds, replays)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: SalesIds;
    let guest: string;

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, {
        users: { fd: ['front_desk'], hk: ['housekeeping'] },
      });
      ids = await seedSales(db, t);
      guest = await seedGuest(db, t, t.users.fd!.id);
      fa = await startFeatureApp(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db.close();
    });

    const send = (who: string, path: string, body: unknown, h: Record<string, string> = {}) =>
      Client.of(fa, t, who).send('POST', `${P(t)}${path}`, body, h);
    const short = (extra: Record<string, unknown> = {}) => ({
      type: 'short',
      roomId: ids.rooms['202'],
      arrivalDate: '2026-11-09',
      nights: 3,
      adults: 2,
      channelId: ids.channels.direct,
      ...extra,
    });
    const rows = async <T>(sql: string, args: unknown[] = []): Promise<T[]> =>
      (await db.withContext(t.ctx(), (tx) => tx.query(sql, args))).rows as T[];
    const nightAmounts = async (id: string) =>
      (
        await rows<{ a: number }>(
          `SELECT room_revenue_gross_vnd::int AS a FROM stay_night WHERE reservation_id = $1
          ORDER BY stay_date`,
          [id],
        )
      ).map((r) => r.a);
    const booking = async (id: string) =>
      (
        await rows<{ total: number; deposit: number; snap: Snapshot }>(
          `SELECT total_room_vnd::int AS total, deposit_required_vnd::int AS deposit, pricing_snapshot AS snap
           FROM reservation WHERE id = $1`,
          [id],
        )
      )[0]!;
    const hold = (quoteId: string, body: Record<string, unknown> = { holdHours: 24 }, h = {}) =>
      send('fd', `/quotes/${quoteId}/actions/create-hold`, body, h);

    // ───────────── FB-R5-QA-BE-S1-01 ─────────────
    it('S1-01 (a): typed prices + BR-111 code → saveQuote → create-hold keeps 665.000 / 618.000 / 752.000, 2.035.000, deposit 600.000', async () => {
      const body = short({
        arrivalDate: '2026-12-21',
        returnGuestCode: RETURN_CODE,
        nightlyRates: [
          { date: '2026-12-21', amountVnd: 700_000, edited: true },
          { date: '2026-12-22', amountVnd: 650_000, edited: true },
          { date: '2026-12-23', amountVnd: R202_WEEKDAY, edited: false },
        ],
      });
      const calc = await send('fd', '/quotes/calculate', body);
      expect(calc.statusCode, calc.body).toBe(200);
      expect(calc.json().losDiscountPct).toBe(5);
      expect(calc.json().nightlyRates.map((n: Night) => [n.amountVnd, n.calendarRateVnd])).toEqual([
        [665_000, 700_000],
        // 650.000 × 95 % = 617.500 → 618.000 (rounding.night_rate 1.000, half up)
        [618_000, 650_000],
        [752_000, R202_WEEKDAY],
      ]);
      expect(calc.json()).toMatchObject({ totalVnd: 2_035_000, depositVnd: 600_000 });

      const saved = await send('fd', '/quotes', { ...body, guestId: guest });
      expect(saved.statusCode, saved.body).toBe(201);
      expect(saved.json()).toMatchObject({ totalVnd: 2_035_000, depositVnd: 600_000 });
      const h = await hold(saved.json().id);
      expect(h.statusCode, h.body).toBe(201);
      expect(h.json()).toMatchObject({ totalRoomVnd: 2_035_000, depositRequiredVnd: 600_000 });
      // Not the calendar (2.376.000 less 5 %), not a second discount on the discounted nights.
      expect(await nightAmounts(h.json().id)).toEqual([665_000, 618_000, 752_000]);
      const b = await booking(h.json().id);
      expect(b).toMatchObject({ total: 2_035_000, deposit: 600_000 });
      expect(b.snap.nights?.map((n) => [n.source, n.calendarVnd])).toEqual([
        ['manual', 700_000],
        ['manual', 650_000],
        ['calendar', R202_WEEKDAY],
      ]);
      expect(b.snap.losDiscountPct).toBe(5);
      expect(b.snap.bookingRateSource).toBe('manual_agreed');
    });

    it('S1-01 (b): BR-107 tier (7 nights) + typed prices → create-hold = the quote (nights 1–2 630.000 / 621.000)', async () => {
      const stay = { roomId: ids.rooms['101'], arrivalDate: '2026-12-07', nights: 7 };
      const plain = await send('fd', '/quotes/calculate', short(stay));
      expect(plain.statusCode, plain.body).toBe(200);
      expect(plain.json().losDiscountPct).toBe(10);
      const typedAt: Record<string, number> = { '2026-12-07': 700_000, '2026-12-08': 690_000 };
      const nightlyRates = (plain.json().nightlyRates as Night[]).map((n) =>
        typedAt[n.date] !== undefined
          ? { date: n.date, amountVnd: typedAt[n.date]!, edited: true }
          : { date: n.date, amountVnd: n.calendarRateVnd!, edited: false },
      );
      const saved = await send('fd', '/quotes', {
        ...short({ ...stay, nightlyRates }),
        guestId: guest,
      });
      expect(saved.statusCode, saved.body).toBe(201);
      const quoted = saved.json();
      expect(quoted).toMatchObject({ totalVnd: 4_431_000, depositVnd: 1_300_000 });
      const h = await hold(quoted.id);
      expect(h.statusCode, h.body).toBe(201);
      const amounts = await nightAmounts(h.json().id);
      expect(amounts.slice(0, 2)).toEqual([630_000, 621_000]);
      expect(amounts).toEqual(quoted.nightlyRates.map((n: Night) => n.amountVnd));
      const b = await booking(h.json().id);
      expect(b).toMatchObject({ total: quoted.totalVnd, deposit: quoted.depositVnd });
      expect(b.snap.bookingRateSource).toBe('manual_agreed');
    });

    // ───────────── FB-R5-QA-BE-S1-02 ─────────────
    it('S1-02 (1): `edited` absent on a quote = not edited → server calendar; saved snapshot `calendar`', async () => {
      const body = short({
        arrivalDate: '2026-11-16',
        nightlyRates: [
          { date: '2026-11-16', amountVnd: 700_000 },
          { date: '2026-11-17', amountVnd: 700_000 },
          { date: '2026-11-18', amountVnd: 700_000 },
        ],
      });
      const calc = await send('fd', '/quotes/calculate', body);
      expect(calc.statusCode, calc.body).toBe(200);
      expect(calc.json().nightlyRates.map((n: Night) => n.amountVnd)).toEqual([
        R202_WEEKDAY,
        R202_WEEKDAY,
        R202_WEEKDAY,
      ]);
      const saved = await send('fd', '/quotes', { ...body, guestId: guest });
      expect(saved.statusCode, saved.body).toBe(201);
      const [q] = await rows<{ s: Snapshot }>(
        'SELECT pricing_snapshot AS s FROM quote WHERE id = $1',
        [saved.json().id],
      );
      expect(q!.s.bookingRateSource).toBe('calendar');
      expect(q!.s.nights?.map((n) => n.source)).toEqual(['calendar', 'calendar', 'calendar']);
    });

    it('S1-02 (2): a quote saved before V5-14 (no nights[], no bookingRateSource) → create-hold 201, every night calendar, money of the quote', async () => {
      const saved = await send('fd', '/quotes', {
        ...short({ arrivalDate: '2026-11-30' }),
        guestId: guest,
      });
      expect(saved.statusCode, saved.body).toBe(201);
      await rows(
        `UPDATE quote SET pricing_snapshot = pricing_snapshot - 'nights' - 'bookingRateSource' WHERE id = $1`,
        [saved.json().id],
      );
      const [legacy] = await rows<{ s: Snapshot }>(
        'SELECT pricing_snapshot AS s FROM quote WHERE id = $1',
        [saved.json().id],
      );
      expect(legacy!.s).not.toHaveProperty('nights');
      expect(legacy!.s).not.toHaveProperty('bookingRateSource');
      const h = await hold(saved.json().id);
      expect(h.statusCode, h.body).toBe(201);
      const b = await booking(h.json().id);
      expect(b.snap.bookingRateSource).toBe('calendar');
      expect(b.snap.nights?.length).toBe(3);
      expect(b.snap.nights?.every((n) => n.source === 'calendar')).toBe(true);
      expect(b).toMatchObject({ total: saved.json().totalVnd, deposit: saved.json().depositVnd });
      expect(await nightAmounts(h.json().id)).toEqual([R202_WEEKDAY, R202_WEEKDAY, R202_WEEKDAY]);
    });

    // ───────────── FB-R5-QA-BE-S1-03 (1) ─────────────
    it('S1-03 (1): BR-105 bounds the typed price before the code – floor + code → 200 (504.000); 529.000 + code → 422', async () => {
      const mk = (amount: number) =>
        short({
          arrivalDate: '2027-01-04',
          returnGuestCode: RETURN_CODE,
          nightlyRates: [
            { date: '2027-01-04', amountVnd: amount, edited: true },
            { date: '2027-01-05', amountVnd: R202_WEEKDAY, edited: false },
            { date: '2027-01-06', amountVnd: R202_WEEKDAY, edited: false },
          ],
        });
      const ok = await send('fd', '/quotes/calculate', mk(L12_FLOOR));
      expect(ok.statusCode, ok.body).toBe(200);
      // 530.000 × 95 % = 503.500 → 504.000: under the floor after the code, and that is right (BR-107 v0.3.8).
      expect(ok.json().nightlyRates[0]).toMatchObject({
        amountVnd: 504_000,
        calendarRateVnd: L12_FLOOR,
      });
      for (const path of ['/quotes/calculate', '/quotes']) {
        const low = await send('fd', path, { ...mk(L12_FLOOR - 1_000), guestId: guest });
        expect(low.statusCode, low.body).toBe(422);
        expect(low.json()).toMatchObject({
          code: 'RATE_OUT_OF_RANGE',
          dates: ['2027-01-04'],
          min: L12_FLOOR,
        });
      }
    });

    // ───────────── FB-R5-QA-BE-S1-04 (b), (c) ─────────────
    it('S1-04 (b): HK (outside x-roles) with nightlyRates → 403; access.denied without reason WRITE_ROLES or after.fields', async () => {
      const res = await send('hk', '/quotes/calculate', short({ nightlyRates: [] }));
      expect(res.statusCode, res.body).toBe(403);
      const denied = await rows<{ reason: string | null; after: Record<string, unknown> | null }>(
        `SELECT reason, after FROM audit_event
        WHERE action = 'access.denied' AND entity_id = 'calculateQuote' AND actor_user_id = $1`,
        [t.users.hk!.id],
      );
      expect(denied).toHaveLength(1);
      expect(denied[0]!.reason).not.toBe('WRITE_ROLES');
      expect(denied[0]!.after ?? {}).not.toHaveProperty('fields');
    });

    it('S1-04 (c): create-hold with a price field → 422; the same Idempotency-Key without it → 201', async () => {
      const saved = await send('fd', '/quotes', {
        ...short({ arrivalDate: '2027-01-18' }),
        guestId: guest,
      });
      expect(saved.statusCode, saved.body).toBe(201);
      const replayId = uuidv7();
      const bad = await hold(
        saved.json().id,
        { holdHours: 24, depositVnd: 1 },
        { 'idempotency-key': replayId },
      );
      expect(bad.statusCode, bad.body).toBe(422);
      const good = await hold(saved.json().id, { holdHours: 24 }, { 'idempotency-key': replayId });
      expect(good.statusCode, good.body).toBe(201);
      expect(good.json().status).toBe('hold');
    });

    it('S1-04 (c): saveQuote 422 RATE_OUT_OF_RANGE; the same Idempotency-Key with a fixed price → 201', async () => {
      const replayId = uuidv7();
      const mk = (amount: number) => ({
        ...short({
          arrivalDate: '2027-01-25',
          nightlyRates: [
            { date: '2027-01-25', amountVnd: amount, edited: true },
            { date: '2027-01-26', amountVnd: R202_WEEKDAY, edited: false },
            { date: '2027-01-27', amountVnd: R202_WEEKDAY, edited: false },
          ],
        }),
        guestId: guest,
      });
      const bad = await send('fd', '/quotes', mk(100_000), { 'idempotency-key': replayId });
      expect(bad.statusCode, bad.body).toBe(422);
      expect(bad.json().code).toBe('RATE_OUT_OF_RANGE');
      const good = await send('fd', '/quotes', mk(700_000), { 'idempotency-key': replayId });
      expect(good.statusCode, good.body).toBe(201);
      expect(good.json().nightlyRates[0].amountVnd).toBe(700_000);
    });
  },
);
