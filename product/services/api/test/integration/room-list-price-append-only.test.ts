/**
 * Migration 0094 – a list price row whose date has come (effective_from ≤ today in the PROPERTY's time zone) cannot
 * be deleted, by ottimo_app or anyone below the table owner (SEC ED-02, rounds/round-04/reviews/SEC-on-plan-v1.0.4.md
 * 3.2). The trigger reads the DB's real clock (`now()`), so the rows here are placed relative to it, never to the
 * MutableClock of the services; the service-level tests (BUG-R4-015, rooms-scheduled-prices-v101) cancel rows that
 * are future for both clocks. FAKE data only.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { seedSales } from '../helpers/sales-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const REFUSED = /^room_list_price: applied price row is append-only$/;

describe.skipIf(!HAS_DB)(
  'room_list_price – applied rows cannot be deleted (0094, SEC ED-02)',
  () => {
    let db: Database;
    let t: TestTenant;
    const roomOf: string[] = [];

    /** Local calendar date in `tz` shifted by `days`, from the DB clock (the one the trigger reads). */
    const localDate = async (tz: string, days = 0) =>
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ d: string }>(`SELECT ((now() AT TIME ZONE $1)::date + $2::int)::text AS d`, [
            tz,
            days,
          ]),
        )
      ).rows[0]!.d;
    const insertRow = (i: number, effectiveFrom: string) =>
      db.withContext(t.ctx(i), (tx) =>
        tx.query(
          `INSERT INTO room_list_price (id, organization_id, property_id, room_id, effective_from,
           monthly_list_price_vnd, nightly_list_price_vnd, reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 9000000, 750000, 'test', $6, $6)`,
          [uuidv7(), t.organizationId, t.propertyIds[i], roomOf[i], effectiveFrom, T0],
        ),
      );
    /** DELETE as ottimo_app (the app pool) in the row's property context. */
    const deleteRow = async (i: number, effectiveFrom: string) =>
      (
        await db.withContext(t.ctx(i), (tx) =>
          tx.query(`DELETE FROM room_list_price WHERE room_id = $1 AND effective_from = $2`, [
            roomOf[i],
            effectiveFrom,
          ]),
        )
      ).rowCount;
    const setTimezone = (i: number, tz: string) =>
      db.withContext(t.ctx(i), (tx) =>
        tx.query(`UPDATE property SET timezone = $2 WHERE id = $1`, [t.propertyIds[i], tz]),
      );

    beforeAll(async () => {
      db = appDatabase(2);
      t = await createTenant(db, { properties: 2 });
      for (const i of [0, 1]) roomOf[i] = (await seedSales(db, t, i)).rooms['101'];
    });
    afterAll(async () => {
      await db?.close();
    });

    it('(a) a past row (the seed row 2026-10-01) → refused with the fixed message, the row stays', async () => {
      await expect(deleteRow(0, '2026-10-01')).rejects.toThrow(REFUSED);
      const left = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT 1 FROM room_list_price WHERE room_id = $1 AND effective_from = '2026-10-01'`,
          [roomOf[0]],
        ),
      );
      expect(left.rowCount).toBe(1);
    });

    it('(b) a future row (tomorrow in the property time zone) → deleted', async () => {
      const tomorrow = await localDate('Asia/Ho_Chi_Minh', 1);
      await insertRow(0, tomorrow);
      expect(await deleteRow(0, tomorrow)).toBe(1);
    });

    it("(c) today in the PROPERTY's time zone is refused, even where it is still yesterday (UTC / far west)", async () => {
      // Kiritimati (UTC+14) has passed local midnight while UTC and Pago Pago (UTC−11) have not: the same calendar date
      // is "today" for property 0 (refused) and a future date for property 1 (allowed) – the trigger uses each
      // property's own zone, not the session or server zone.
      await setTimezone(0, 'Pacific/Kiritimati');
      await setTimezone(1, 'Pacific/Pago_Pago');
      try {
        const today0 = await localDate('Pacific/Kiritimati');
        const today1 = await localDate('Pacific/Pago_Pago');
        expect(today0 > today1).toBe(true); // 25 hours apart: always a different date
        await insertRow(0, today0);
        await expect(deleteRow(0, today0)).rejects.toThrow(REFUSED);
        await insertRow(1, today0);
        expect(await deleteRow(1, today0)).toBe(1);
      } finally {
        await setTimezone(0, 'Asia/Ho_Chi_Minh');
        await setTimezone(1, 'Asia/Ho_Chi_Minh');
      }
    });

    it('a time zone the server cannot read → refused (fail closed)', async () => {
      const future = await localDate('Asia/Ho_Chi_Minh', 30);
      await insertRow(0, future);
      // property.timezone has no CHECK; an unknown zone makes AT TIME ZONE fail inside the trigger
      await setTimezone(0, 'Mars/Olympus_Mons');
      try {
        await expect(deleteRow(0, future)).rejects.toThrow();
      } finally {
        await setTimezone(0, 'Asia/Ho_Chi_Minh');
      }
      expect(await deleteRow(0, future)).toBe(1);
    });

    it('(d) the trigger is enabled in origin mode (tgenabled = O); the function is SECURITY INVOKER with a fixed search_path', async () => {
      const rows = await db.withContext(t.ctx(), (tx) =>
        tx.query<{ tgname: string; tgenabled: string; prosecdef: boolean; proconfig: string[] }>(
          `SELECT g.tgname, g.tgenabled, f.prosecdef, f.proconfig
           FROM pg_trigger g JOIN pg_proc f ON f.oid = g.tgfoid
          WHERE g.tgrelid = 'room_list_price'::regclass AND NOT g.tgisinternal`,
        ),
      );
      expect(rows.rows).toEqual([
        {
          tgname: 'room_list_price_append_only',
          tgenabled: 'O',
          prosecdef: false,
          proconfig: ['search_path=pg_catalog, pg_temp'],
        },
      ]);
    });
  },
);
