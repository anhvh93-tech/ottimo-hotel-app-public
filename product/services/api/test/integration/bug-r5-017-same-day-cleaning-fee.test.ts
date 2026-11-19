/**
 * BUG-R5-017 (P2, ARC-on-be-pr-200 phụ lục 19/11) on the real PostgreSQL through the HTTP API:
 * - `long_stay_cleaning_fee_by_room` saved twice the same day (effectiveFrom = today) → 200 both; the value in force
 *   is the second table; the second audit row has `before` = the first table and `after.sameDayOverride`;
 *   a folio line posted between the two saves keeps its price; MGR may overwrite too (A101);
 * - any other key (`adhoc_cleaning_fee`) saved again today → 422 VALIDATION_FAILED, `effectiveFrom: ALREADY_IN_FORCE`.
 * The kill-switch tests (`public-site-r3-bed`, `v104-notice-allowlist`) cover the first exception.
 * Fake clock (T0 = Thu 15/10/2026 09:00 VN). FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, setStayStatus } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const KEY = 'long_stay_cleaning_fee_by_room';
const TODAY = '2026-10-15';

describe.skipIf(!HAS_DB)(
  'BUG-R5-017 – same-day edit of the long-stay cleaning price table only',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let folioId: string;
    const c: Record<string, Client> = {};

    const url = (p = '') => `${P(t)}${p}`;
    const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
      (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
    const put = (who: string, key: string, value: unknown) =>
      c[who]!.send('PUT', url(`/parameters/${key}`), {
        value,
        effectiveFrom: TODAY,
        reason: 'Go-live cleaning price check',
      });
    const audits = () =>
      q<{ actor_user_id: string; before: Json; after: Json }>(
        `SELECT actor_user_id, before, after FROM audit_event
        WHERE action = 'config.changed' AND entity_id = $1 ORDER BY occurred_at, id`,
        [KEY],
      );
    const todayRow = async (key: string) =>
      (
        await q<{ value: Json }>(
          `SELECT value FROM config_parameter WHERE key = $1 AND effective_from = $2`,
          [key, TODAY],
        )
      ).map((r) => r.value);
    const cleanAndPrice = async () => {
      const r = await c.fd!.send('POST', url(`/folios/${folioId}/lines`), {
        chargeCode: 'adhoc_cleaning_fee',
        quantity: 1,
        serviceDate: TODAY,
      });
      expect(r.statusCode, r.body).toBe(201);
      const rows = await q<{ a: string }>(
        `SELECT amount_vnd::text AS a FROM folio_line WHERE folio_id = $1 AND category = 'cleaning'
        ORDER BY posted_at, id`,
        [folioId],
      );
      return rows.map((x) => Number(x.a));
    };

    beforeAll(async () => {
      db = appDatabase(4);
      t = await createTenant(db, {
        users: { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] },
      });
      ids = await seedBooking(db, t);
      await setParam(db, t, KEY, {}, '2026-10-02'); // start from an empty table, like production before go-live
      fa = await startFeatureApp(db);
      for (const u of ['own', 'mgr', 'fd']) c[u] = Client.of(fa, t, u);
      fa.clock.set(T0);
      await touchSessions(db, t, T0);
      const s = await seedStay(db, t, ids, {
        status: 'in_house',
        roomNo: '202',
        stayType: 'long',
        departure: '2026-12-15',
      });
      await setStayStatus(db, t, s.reservationId, 'in_house', {
        actualCheckinAt: new Date('2026-10-15T08:00:00+07:00'),
      });
      const [f] = await q<{ folio_id: string }>(`SELECT folio_id FROM reservation WHERE id = $1`, [
        s.reservationId,
      ]);
      folioId = f!.folio_id;
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    it('(1) OWN saves the table twice today → 200 both; the 2nd is in force; audit keeps the 1st; a line posted between keeps its price', async () => {
      const first = { '202': 120_000, '301': 200_000 }; // typo on 202
      const second = { '202': 150_000, '301': 200_000 };
      const r1 = await put('own', KEY, first);
      expect(r1.statusCode, r1.body).toBe(200);
      expect(await cleanAndPrice()).toEqual([120_000]);

      const r2 = await put('own', KEY, second);
      expect(r2.statusCode, r2.body).toBe(200);
      expect(r2.json()).toMatchObject({ value: second });
      expect(await todayRow(KEY)).toEqual([second]); // overwritten, not a 2nd row

      const a = await audits();
      expect(a).toHaveLength(2);
      expect(a[0]!.before).toEqual({ value: {} });
      expect(a[1]).toMatchObject({
        actor_user_id: t.users.own!.id,
        before: { value: first },
        after: { value: second, sameDayOverride: true },
      });

      // The line charged at 120.000 stays; the next clean is 150.000.
      expect(await cleanAndPrice()).toEqual([120_000, 150_000]);
    });

    it('(2) MGR may overwrite today too (A101)', async () => {
      const third = { '202': 150_000, '301': 200_000, '402': 200_000 };
      const r = await put('mgr', KEY, third);
      expect(r.statusCode, r.body).toBe(200);
      expect(await todayRow(KEY)).toEqual([third]);
      const a = await audits();
      expect(a).toHaveLength(3);
      expect(a[2]).toMatchObject({
        actor_user_id: t.users.mgr!.id,
        before: { value: { '202': 150_000, '301': 200_000 } },
        after: { value: third, sameDayOverride: true },
      });
    });

    it('(2b) the shape check still runs before a same-day overwrite', async () => {
      const r = await put('own', KEY, { '202': 150_500 });
      expect(r.statusCode).toBe(422);
      expect(r.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE' });
      expect(await todayRow(KEY)).toEqual([{ '202': 150_000, '301': 200_000, '402': 200_000 }]);
    });

    it('(3) any other key saved again today → 422 VALIDATION_FAILED, effectiveFrom: ALREADY_IN_FORCE; value unchanged', async () => {
      const r1 = await put('own', 'adhoc_cleaning_fee', 110_000);
      expect(r1.statusCode, r1.body).toBe(200);
      const r2 = await put('own', 'adhoc_cleaning_fee', 120_000);
      expect(r2.statusCode).toBe(422);
      expect(r2.json()).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'effectiveFrom', code: 'ALREADY_IN_FORCE' }],
      });
      expect(await todayRow('adhoc_cleaning_fee')).toEqual([110_000]);
    });
  },
);
