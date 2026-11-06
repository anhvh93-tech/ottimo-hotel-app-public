/**
 * V5-25 (P1, v1.0.5) – BUG-R5-001 / BUG-R5-003 through the API and the database (DOM rules-v1.0.5 8.4, 12.1–12.4;
 * ARC 0.3.13 bổ sung 1, 1.24):
 * - (c) the Desk save (`PUT /parameters/{key}`) refuses a wrong shape with 422 PARAM_OUT_OF_RANGE and the value in
 *   force stays; the good `weekend_nights` ["FRI","SAT"] is saved and the Friday night gets the weekend uplift;
 * - (d) a broken `min_stay` already in the database (written another way) never gives a 500 on the quote, the new
 *   booking or the web estimate: not a list → no rule, a broken rule → left out, the good ones apply (DOM 12.3);
 * - (e) min_stay 2 → 3 nights from today: the 2-night Friday quote is refused with minStayNights 3;
 * - DOM 12.2 both ways, also against rows already scheduled (ARC FB-R5-ARC-BE-04: a row only scheduled counts);
 *   BUG-R5-003 (f) for the other structured keys;
 * - the read-only SQL check `scripts/v5-25-parameter-shape-check.sql` gives the same verdict as the save rules on
 *   every shared case (test/helpers/parameter-shape-cases.ts) and prints only key, effective date and ok; its guard
 *   stops a run that would see nothing (ARC FB-R5-ARC-BE-02); its two counts (DOM FB-R5-DOM-BE-PR96-02) – open
 *   bookings with a broken copied cancel policy, broken damage_catalog rows in force or scheduled – are numbers only.
 * Fake clock: Thu 05/11/2026 09:00 (VN). DS-E room 101 = 8.000.000/month → 667.000/night.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { PublicRatePort } from '../../src/modules/reservations/public/public-rate.port';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  BAD_SHAPES,
  GOOD_SHAPES,
  MIN_STAY_BAD,
  PROD_MIN_STAY,
} from '../helpers/parameter-shape-cases';
import { seedStay, setStayStatus } from '../helpers/registration-fixture';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };
const TODAY = '2026-11-05';
const NOW = new Date(`${TODAY}T09:00:00+07:00`);
const LABEL = 'Standard Studio · City View';
const REASON = 'V5-25: kiểm dạng tham số khi lưu';
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
// Fri 13/11 and Fri 20/11 2026 (no special date in November).
const FRI = '2026-11-13';
const FRI2 = '2026-11-20';

describe.skipIf(!HAS_DB)(
  'V5-25 – parameter shapes: save rules and the defensive min_stay read',
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
      guest = await seedGuestRow(db, t, { name: 'Khách Thử V525' });
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE room SET public_room_type = $1 WHERE room_no = ANY($2::text[])`, [
          LABEL,
          ['101', '201'],
        ]),
      );
      fa = await startFeatureApp(db);
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      fa.clock.set(NOW);
      await touchSessions(db, t, NOW);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    const url = (path = '') => `${P(t)}${path}`;
    const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
      (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
    const rowsOf = (key: string) =>
      q<{ f: string; v: unknown }>(
        `SELECT effective_from::text AS f, value AS v FROM config_parameter WHERE key = $1 ORDER BY effective_from`,
        [key],
      );
    const put = (key: string, value: unknown, effectiveFrom = TODAY, who = 'mgr') =>
      c[who]!.send('PUT', url(`/parameters/${key}`), { value, effectiveFrom, reason: REASON });
    const calc = (arrivalDate: string, nights: number, roomNo = '101') =>
      c.fd!.send('POST', url('/quotes/calculate'), {
        type: 'short',
        roomId: ids.rooms[roomNo],
        arrivalDate,
        nights,
        adults: 2,
        channelId: ids.channels.direct,
      });
    const book = (roomNo: string, arrivalDate: string, departureDate: string, depositVnd: number) =>
      c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms[roomNo],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        arrivalDate,
        departureDate,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: depositVnd },
      });
    const estimate = (arrival: string, departure: string) =>
      db.withContext(t.ctx(), (tx) =>
        fa.app.get(PublicRatePort).estimate(
          tx,
          LABEL,
          {
            stayType: 'short',
            arrival,
            departure,
            months: null,
            party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
          },
          TODAY,
        ),
      );
    const nightly = (body: { nightlyRates: Array<{ amountVnd: number }> }) =>
      body.nightlyRates.map((n) => n.amountVnd);

    describe('(d) a broken min_stay already stored never gives a 500 (DOM 12.3)', () => {
      it('BR-113-29: not a list (2, then {nights: 2}) → no rule: quote 200, booking 201, web estimate ok; one warning without the value', async () => {
        const warn = vi.spyOn(Logger.prototype, 'warn');
        try {
          for (const [date, value, roomNo] of [
            ['2026-10-02', 2, '101'],
            ['2026-10-03', { nights: 2 }, '201'],
          ] as Array<[string, unknown, string]>) {
            await setParam(db, t, 'min_stay', value, date);
            const quote = await calc(FRI, 1, roomNo);
            expect(quote.statusCode, quote.body).toBe(200);
            expect((await calc(FRI, 1, roomNo)).statusCode).toBe(200);
            expect((await estimate(FRI, '2026-11-14')).estimate.status).toBe('ok');
            const booking = await book(
              roomNo,
              FRI,
              '2026-11-14',
              quote.json().depositVnd as number,
            );
            expect(booking.statusCode, booking.body).toBe(201);
          }
          const lines = warn.mock.calls
            .map((a) => String(a[0]))
            .filter((m) => m.includes('parameter min_stay') && m.includes(t.propertyIds[0]!));
          // One line per stored value and property (not one per read), never the value or a guest's name.
          expect(lines).toHaveLength(2);
          for (const m of lines) {
            expect(m).toContain('not a list');
            expect(m).not.toMatch(/nights|Khách|V525/);
          }
        } finally {
          warn.mockRestore();
        }
      });

      it('BR-113-30: a list with broken rules → those rules are left out, the 2-night Friday rule still applies', async () => {
        await setParam(
          db,
          t,
          'min_stay',
          [
            PROD_MIN_STAY[0],
            { nights: 3, arrivalWeekdays: ['FRI'] },
            null,
            { nights: 2, channels: 'all' },
          ],
          '2026-10-04',
        );
        const one = await calc(FRI2, 1);
        expect(one.statusCode, one.body).toBe(422);
        expect(one.json()).toMatchObject({
          code: 'VALIDATION_FAILED',
          errors: [{ field: 'nights', code: 'MIN_STAY_NOT_MET' }],
          minStayNights: 2,
        });
        // The 3-night rule without channels is not applied: 2 nights on a Friday are fine.
        const two = await calc(FRI2, 2);
        expect(two.statusCode, two.body).toBe(200);
        expect(await estimate(FRI2, '2026-11-21')).toMatchObject({
          estimate: { status: 'min_stay', minNights: 2 },
        });
        const booking = await book('101', FRI2, '2026-11-21', 500_000);
        expect(booking.statusCode, booking.body).toBe(422);
        expect(booking.json().errors).toEqual([
          { field: 'departureDate', code: 'MIN_STAY_NOT_MET' },
        ]);
        // Back to the production value for what follows (seed-like, past date).
        await setParam(db, t, 'min_stay', PROD_MIN_STAY, '2026-10-05');
      });
    });

    describe('(c) the Desk save refuses a wrong shape and the value in force stays', () => {
      it('min_stay 2 → 422 (value VALIDATION_FAILED); the Friday rule still blocks one night, Tuesday is free', async () => {
        const before = await rowsOf('min_stay');
        const res = await put('min_stay', 2);
        expect(res.statusCode, res.body).toBe(422);
        expect(res.json()).toMatchObject({
          code: 'PARAM_OUT_OF_RANGE',
          errors: [{ field: 'value', code: 'VALIDATION_FAILED' }],
        });
        expect(await rowsOf('min_stay')).toEqual(before);
        expect(before.at(-1)).toEqual({ f: '2026-10-05', v: PROD_MIN_STAY });

        const fri = await calc(FRI, 1, '102');
        expect(fri.statusCode, fri.body).toBe(422);
        expect(fri.json()).toMatchObject({
          errors: [{ code: 'MIN_STAY_NOT_MET' }],
          minStayNights: 2,
        });
        expect((await calc('2026-11-10', 1, '102')).statusCode).toBe(200);
        expect((await calc('2026-11-10', 2, '102')).statusCode).toBe(200);
      });

      it('BUG-R5-003 (a) over HTTP: every value of QA’s list → 422 PARAM_OUT_OF_RANGE, nothing written', async () => {
        const before = await rowsOf('min_stay');
        for (const v of MIN_STAY_BAD) {
          const res = await put('min_stay', v, '2026-11-30');
          expect(res.statusCode, `${JSON.stringify(v)} ${res.body}`).toBe(422);
          expect(res.json().code).toBe('PARAM_OUT_OF_RANGE');
        }
        // ARC 1.24 extras: a missing channel lists the allowed values; nights out of range gives min/max.
        const noChannels = await put(
          'min_stay',
          [{ nights: 2, arrivalWeekdays: ['FRI'] }],
          '2026-11-30',
        );
        expect(noChannels.json()).toMatchObject({
          errors: [{ field: 'value[0].channels', code: 'REQUIRED' }],
          allowed: ['all', 'direct', 'agent', 'ota'],
        });
        const eight = await put(
          'min_stay',
          [{ nights: 8, channels: 'all', arrivalWeekdays: ['FRI'] }],
          '2026-11-30',
        );
        expect(eight.json()).toMatchObject({
          errors: [{ field: 'value[0].nights', code: 'VALUE_OUT_OF_RANGE' }],
          min: 1,
          max: 7,
        });
        expect(await rowsOf('min_stay')).toEqual(before);
      });

      it('BUG-R5-001 (c): weekend_nights ["FRI","SAT"] → 200 and Friday gets +15 %; [5,6] → 422 with the 7 codes', async () => {
        const ok = await put('weekend_nights', ['FRI', 'SAT']);
        expect(ok.statusCode, ok.body).toBe(200);
        // Thu 26/11 + Fri 27/11 (2 nights, no minimum on a Thursday arrival): 667.000 and 667.000 × 1,15 → 767.000.
        const quote = await calc('2026-11-26', 2);
        expect(quote.statusCode, quote.body).toBe(200);
        expect(nightly(quote.json())).toEqual([667_000, 767_000]);

        const bad = await put('weekend_nights', [5, 6]);
        expect(bad.statusCode, bad.body).toBe(422);
        expect(bad.json()).toMatchObject({
          code: 'PARAM_OUT_OF_RANGE',
          errors: [{ field: 'value[0]', code: 'NOT_IN_LIST' }],
          allowed: WEEKDAYS,
        });
        expect((await rowsOf('weekend_nights')).at(-1)).toEqual({ f: TODAY, v: ['FRI', 'SAT'] });
        expect(nightly((await calc('2026-11-26', 2)).json())).toEqual([667_000, 767_000]);
      });
    });

    it('(e) min_stay 2 → 3 nights from today: a 2-night Friday quote → 422 minStayNights 3, 3 nights → 200', async () => {
      const three = [{ ...PROD_MIN_STAY[0], nights: 3 }, PROD_MIN_STAY[1]];
      const res = await put('min_stay', three);
      expect(res.statusCode, res.body).toBe(200);
      const two = await calc(FRI, 2, '202');
      expect(two.statusCode, two.body).toBe(422);
      expect(two.json()).toMatchObject({
        errors: [{ code: 'MIN_STAY_NOT_MET' }],
        minStayNights: 3,
      });
      expect((await calc(FRI, 3, '202')).statusCode).toBe(200);
    });

    it('DOM 12.2 both ways (BR-113-28), also against rows already scheduled', async () => {
      // Today min_stay has a 3-night rule: short_stay_max_nights 2 → 422 min 3.
      const low = await put('short_stay_max_nights', 2);
      expect(low.statusCode, low.body).toBe(422);
      expect(low.json()).toMatchObject({
        code: 'PARAM_OUT_OF_RANGE',
        errors: [{ field: 'value', code: 'VALUE_OUT_OF_RANGE' }],
        min: 3,
      });
      // short_stay_max_nights 4 from 20/11 → a min_stay row from 10/11 (in force on 20/11 too) is capped at 4.
      expect((await put('short_stay_max_nights', 4, '2026-11-20')).statusCode).toBe(200);
      const five = await put(
        'min_stay',
        [{ nights: 5, channels: 'all', arrivalWeekdays: ['FRI'] }],
        '2026-11-10',
      );
      expect(five.statusCode, five.body).toBe(422);
      expect(five.json()).toMatchObject({
        errors: [{ field: 'value[0].nights', code: 'VALUE_OUT_OF_RANGE' }],
        min: 1,
        max: 4,
      });
      const four = await put(
        'min_stay',
        [{ nights: 4, channels: 'all', arrivalWeekdays: ['FRI'] }],
        '2026-11-10',
      );
      expect(four.statusCode, four.body).toBe(200);
      // …and short_stay_max_nights 3 from 25/11 would put the 4-night rule above it → 422 min 4.
      const three = await put('short_stay_max_nights', 3, '2026-11-25');
      expect(three.statusCode, three.body).toBe(422);
      expect(three.json()).toMatchObject({ min: 4 });
    });

    it('ARC FB-R5-ARC-BE-04 (HTTP): short_stay_max_nights for today meets a min_stay row only scheduled → 422 min 5', async () => {
      const rule = (nights: number) => [{ nights, channels: 'all', arrivalWeekdays: ['FRI'] }];
      // 3 nights from 18/11 (under short_stay 4 from 20/11), then 5 nights for 15/11–17/11 only (short_stay 27).
      expect((await put('min_stay', rule(3), '2026-11-18')).statusCode).toBe(200);
      const five = await put('min_stay', rule(5), '2026-11-15');
      expect(five.statusCode, five.body).toBe(200);
      // Today's short_stay row would be in force until 20/11 and so meet the scheduled 5-night row.
      const res = await put('short_stay_max_nights', 3);
      expect(res.statusCode, res.body).toBe(422);
      expect(res.json()).toMatchObject({
        code: 'PARAM_OUT_OF_RANGE',
        errors: [{ field: 'value', code: 'VALUE_OUT_OF_RANGE' }],
        min: 5,
      });
      expect((await rowsOf('short_stay_max_nights')).map((r) => r.f)).not.toContain(TODAY);
    });

    it('BUG-R5-003 (f) over HTTP: every structured key refuses a wrong shape with 422 PARAM_OUT_OF_RANGE', async () => {
      const date = '2026-12-01';
      for (const [key, value, field] of BAD_SHAPES) {
        const res = await put(key, value, date, key === 'lease_terms' ? 'own' : 'mgr');
        expect(res.statusCode, `${key} ${JSON.stringify(value)} ${res.body}`).toBe(422);
        expect(res.json(), `${key} ${JSON.stringify(value)}`).toMatchObject({
          code: 'PARAM_OUT_OF_RANGE',
          errors: [{ field }],
        });
      }
      expect(
        await q(`SELECT key FROM config_parameter WHERE effective_from = $1::date`, [date]),
      ).toEqual([]);
      // The good shapes are saved (owner for lease_terms – A119).
      for (const [key, value] of GOOD_SHAPES) {
        if (key === 'min_stay' || key === 'short_stay_max_nights') continue;
        const res = await put(key, value, '2026-12-02', key === 'lease_terms' ? 'own' : 'mgr');
        expect(res.statusCode, `${key} ${JSON.stringify(value)} ${res.body}`).toBe(200);
      }
    });
  },
);

describe.skipIf(!HAS_DB)(
  'V5-25 – read-only SQL check scripts/v5-25-parameter-shape-check.sql',
  () => {
    let db: Database;
    let t: TestTenant;
    let ids: BookingIds;
    let pg: PgClient;
    const SQL = readFileSync(
      join(__dirname, '../../scripts/v5-25-parameter-shape-check.sql'),
      'utf8',
    );

    beforeAll(async () => {
      db = appDatabase(3);
      t = await createTenant(db, {});
      ids = await seedBooking(db, t);
      // The owner role under forced RLS, scoped to this tenant (production runs it as ottimo_readonly, BYPASSRLS).
      pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
      await pg.connect();
      await pg.query('SET ROLE ottimo_owner');
      await pg.query(
        `SELECT set_config('app.organization_id', $1, false), set_config('app.property_id', $2, false)`,
        [t.organizationId, t.propertyIds[0]],
      );
    });
    afterAll(async () => {
      await pg?.end();
      await db?.close();
    });

    type Result = {
      command: string;
      fields: Array<{ name: string }>;
      rows: Array<Record<string, unknown>>;
    };
    const runOn = async (client: PgClient): Promise<Result[]> => {
      try {
        return (await client.query(SQL)) as unknown as Result[];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    };
    const runAll = async () => {
      const results = await runOn(pg);
      const select = results.filter((r) => r.command === 'SELECT');
      // The guard (no row on a right run), the per-row verdicts, then the two counts (DOM FB-R5-DOM-BE-PR96-02).
      expect(select.map((s) => s.fields.map((f) => f.name))).toEqual([
        ['guard'],
        ['key', 'effective_from', 'ok'],
        ['count_of', 'n'],
        ['count_of', 'n'],
      ]);
      expect(select[0]!.rows).toEqual([]);
      expect(results.at(-1)!.command).toBe('ROLLBACK');
      const counts = [select[2]!, select[3]!].map((s) => {
        expect(s.rows).toHaveLength(1);
        return [String(s.rows[0]!.count_of), Number(s.rows[0]!.n)] as const;
      });
      expect(counts.map(([k]) => k)).toEqual([
        'open_bookings_cancel_policy_broken',
        'damage_catalog_rows_broken',
      ]);
      const rows = select[1]!.rows as Array<{
        key: string;
        effective_from: Date | string;
        ok: boolean;
      }>;
      return {
        rows: rows.map((r) => ({
          key: r.key,
          // node-postgres reads a `date` as local midnight.
          f:
            r.effective_from instanceof Date
              ? [
                  r.effective_from.getFullYear(),
                  String(r.effective_from.getMonth() + 1).padStart(2, '0'),
                  String(r.effective_from.getDate()).padStart(2, '0'),
                ].join('-')
              : String(r.effective_from),
          ok: r.ok,
        })),
        cancelBroken: counts[0]![1],
        damageBroken: counts[1]![1],
      };
    };
    const run = async () => (await runAll()).rows;
    // One distinct scheduled date per case, far after the real business date of the database clock.
    let day = 0;
    const nextDate = () => {
      day += 1;
      return new Date(Date.UTC(2099, 0, 1) + day * 86_400_000).toISOString().slice(0, 10);
    };

    it('the DS-E values in force: every checked key is ok, and only key / effective_from / ok are printed', async () => {
      const rows = await run();
      expect(rows.length).toBeGreaterThanOrEqual(10);
      expect(rows.every((r) => r.ok)).toBe(true);
      expect(rows.map((r) => r.key)).toEqual(
        expect.arrayContaining([
          'min_stay',
          'weekend_nights',
          'short_stay_max_nights',
          'special_dates',
          'lease_terms',
        ]),
      );
    });

    it('same verdict as the save rules on every shared case (scheduled rows)', async () => {
      const expected = new Map<string, boolean>();
      const add = async (key: string, value: unknown, ok: boolean) => {
        const f = nextDate();
        await setParam(db, t, key, value, f);
        expected.set(`${key} ${f}`, ok);
      };
      for (const [key, value] of BAD_SHAPES) await add(key, value, false);
      for (const value of MIN_STAY_BAD) await add('min_stay', value, false);
      for (const [key, value] of GOOD_SHAPES) await add(key, value, true);
      const got = new Map((await run()).map((r) => [`${r.key} ${r.f}`, r.ok]));
      for (const [k, ok] of expected) expect(got.get(k), k).toBe(ok);
    });

    it('min_stay ↔ short_stay_max_nights over the period each row is in force (DOM 12.2)', async () => {
      // The last min_stay row (GOOD_SHAPES: a 3-night rule) stays in force; short_stay_max_nights 1 from 2100 → both
      // the short_stay row (below 3) and that min_stay row (3 > its cap 1) are reported.
      const lastMinStay = (await run()).filter((r) => r.key === 'min_stay').at(-1)!;
      await setParam(db, t, 'short_stay_max_nights', 1, '2100-01-01');
      const rows = await run();
      expect(rows.find((r) => r.key === 'short_stay_max_nights' && r.f === '2100-01-01')?.ok).toBe(
        false,
      );
      expect(rows.find((r) => r.key === 'min_stay' && r.f === lastMinStay.f)?.ok).toBe(false);
      // The DS-E row in force is not affected (its period ends before 2100).
      expect(rows.filter((r) => r.key === 'min_stay').at(0)?.ok).toBe(true);
    });

    it('ARC FB-R5-ARC-BE-04 (SQL): a min_stay row is checked only against the short_stay rows of its own period', async () => {
      // D1 < D2 < D3, after every row of the tests above. short_stay 4 [D1, D2) only meets min_stay 2 (the 5-night
      // row starts at D3, when short_stay is 29) → every row ok.
      const [D1, D2, D3] = ['2101-01-01', '2101-02-01', '2101-03-01'];
      const rule = (nights: number) => [{ nights, channels: 'all', arrivalWeekdays: ['FRI'] }];
      await setParam(db, t, 'short_stay_max_nights', 4, D1);
      await setParam(db, t, 'min_stay', rule(2), D1);
      await setParam(db, t, 'short_stay_max_nights', 29, D2);
      await setParam(db, t, 'min_stay', rule(5), D3);
      const rows = await run();
      const at = (key: string, f: string) => rows.find((r) => r.key === key && r.f === f)?.ok;
      expect(at('short_stay_max_nights', D1)).toBe(true);
      expect(at('min_stay', D1)).toBe(true);
      expect(at('short_stay_max_nights', D2)).toBe(true);
      expect(at('min_stay', D3)).toBe(true);
    });

    it('ARC FB-R5-ARC-BE-02: the guard stops the run and names the cause – never an empty result read as "all ok"', async () => {
      const stopped = async (
        url: string,
        tenant: [string, string] | null,
        cause: RegExp,
      ): Promise<void> => {
        const other = new PgClient({ connectionString: url });
        await other.connect();
        try {
          if (tenant) {
            await other.query('SET ROLE ottimo_owner');
            await other.query(
              `SELECT set_config('app.organization_id', $1, false), set_config('app.property_id', $2, false)`,
              tenant,
            );
          }
          await expect(runOn(other)).rejects.toThrow(cause);
        } finally {
          await other.end();
        }
      };
      // ottimo_app without a tenant: under RLS nothing shows (before: 0 rows and no error).
      await stopped(
        process.env.DATABASE_URL!,
        null,
        /^invalid input syntax for type boolean: "v5-25 check stopped: run as ottimo_readonly \(BYPASSRLS\)/,
      );
      // A tenant that does not exist, and a property without a row of min_stay, weekend_nights, short_stay_max_nights.
      await stopped(
        process.env.MIGRATION_DATABASE_URL!,
        [randomUUID(), randomUUID()],
        /"v5-25 check stopped: no row of min_stay, weekend_nights, short_stay_max_nights is visible"/,
      );
      const bare = await createTenant(db, {});
      await stopped(
        process.env.MIGRATION_DATABASE_URL!,
        [bare.organizationId, bare.propertyIds[0]!],
        /"v5-25 check stopped: no row of min_stay, weekend_nights, short_stay_max_nights is visible"/,
      );
    });

    it('DOM FB-R5-DOM-BE-PR96-02 (a): open bookings with a broken copied cancel policy are counted – a number only', async () => {
      const open = await seedStay(db, t, ids, { status: 'confirmed', roomNo: '202' });
      const closed = await seedStay(db, t, ids, { status: 'checked_out', roomNo: '101' });
      const copy = (id: string, policy: unknown) =>
        db.withContext(t.ctx(), (tx) =>
          tx.query(
            `UPDATE reservation SET pricing_snapshot = jsonb_set(pricing_snapshot, '{cancelPolicy}', $2::jsonb)
              WHERE id = $1`,
            [id, JSON.stringify(policy)],
          ),
        );
      const broken = async () => (await runAll()).cancelBroken;
      // No copy at all ('{}': the policy in force is used) → not counted.
      expect(await broken()).toBe(0);
      const bad: unknown[] = [
        ...BAD_SHAPES.filter(([k]) => k === 'cancel_policy_direct').map(([, v]) => v),
        [
          { minDays: 7, refundPct: 50 },
          { minDays: 7, refundPct: 20 },
        ],
        [{ minDays: 7, refundPct: 50, note: 'x' }],
        [{ minDays: 7, refundPct: '50' }],
        [{ minDays: 2.5, refundPct: 50 }],
        [null],
        '50',
        Array.from({ length: 11 }, (_, i) => ({ minDays: i, refundPct: 10 })),
      ];
      for (const v of bad) {
        await copy(open.reservationId, v);
        expect(await broken(), JSON.stringify(v)).toBe(1);
      }
      const good: unknown[] = [
        ...GOOD_SHAPES.filter(([k]) => k === 'cancel_policy_direct').map(([, v]) => v),
        null,
      ];
      for (const v of good) {
        await copy(open.reservationId, v);
        expect(await broken(), JSON.stringify(v)).toBe(0);
      }
      // A closed booking is never counted; the same copy on an in-house booking is.
      await copy(closed.reservationId, [null]);
      expect(await broken()).toBe(0);
      await copy(open.reservationId, [null]);
      await setStayStatus(db, t, open.reservationId, 'in_house');
      expect(await broken()).toBe(1);
      await copy(open.reservationId, null);
    });

    it('DOM FB-R5-DOM-BE-PR96-02 (b), QA BUG-R5-004: EVERY broken damage_catalog row counts – in force and scheduled', async () => {
      const broken = async () => (await runAll()).damageBroken;
      const item = { code: 'glass', name: 'Ly', priceVnd: 50_000 };
      expect(await broken()).toBe(0);
      // A broken row already replaced (a past period) is not counted; the broken row in force is.
      await setParam(db, t, 'damage_catalog', [null], '2026-09-30');
      await setParam(db, t, 'damage_catalog', [item], '2026-10-02');
      expect(await broken()).toBe(0);
      await setParam(db, t, 'damage_catalog', [item, null], '2026-10-03');
      expect(await broken()).toBe(1);
      // Every broken scheduled row is counted too.
      let n = 1;
      const bad: unknown[] = [
        { glass: 50_000 },
        [{ ...item, code: 'Glass' }],
        [{ ...item, priceVnd: 0 }],
        [{ ...item, priceVnd: -50_000 }],
        [{ ...item, priceVnd: '50000' }],
        [{ code: 'glass', name: 'Ly' }],
        [{ ...item, name: ' \t ' }],
        [{ ...item, name: 'x'.repeat(101) }],
        [{ ...item, note: 'x' }],
        [item, { code: 'cup', name: ' ly ', priceVnd: 40_000 }],
        [item, { ...item, name: 'Cup' }],
        Array.from({ length: 101 }, (_, i) => ({
          code: `c${i}`,
          name: `Item ${i}`,
          priceVnd: 1_000,
        })),
      ];
      for (const v of bad) {
        await setParam(db, t, 'damage_catalog', v, nextDate());
        n += 1;
        expect(await broken(), JSON.stringify(v).slice(0, 80)).toBe(n);
      }
      const good: unknown[] = [
        [],
        [item, { code: 'remote', name: 'Remote', priceVnd: 20_000_000 }],
        Array.from({ length: 100 }, (_, i) => ({
          code: `c${i}`,
          name: `${i} `.padEnd(100, 'x'),
          priceVnd: 1_000,
        })),
      ];
      for (const v of good) {
        await setParam(db, t, 'damage_catalog', v, nextDate());
        expect(await broken(), JSON.stringify(v).slice(0, 80)).toBe(n);
      }
    });
  },
);
