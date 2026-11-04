/**
 * v1.0.4 #70 release condition (BUG-R4-037, ARC (A), DOM-on-v104-pr68-docs 7.1) on PostgreSQL: a property WITHOUT an
 * `ota_base_rate` row (production after its first bootstrap – INV_ENTERS_KEYS) takes an OTA booking sent without a
 * price and without an OTA amount at the room's nightly list price of each night through the OTA calendar (BR-103:
 * one price for every channel) instead of 422. The nights keep the BUG-R2-017 shape (`calendar`, `calendarVnd`), so
 * `stay_night.calendar_rate_vnd` is not NULL and the BUG-R4-037 data check does not flag them. A room without a list
 * price for a night still gets 422 nightlyRates REQUIRED. FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('v1.0.4 #70 – OTA booking without a price, no ota_base_rate row', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let fd: Client;

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { fd: ['front_desk'] } });
    ids = await seedBooking(db, t, 0, { otaBaseRate: false });
    guest = await seedGuestRow(db, t, { name: 'Nguyễn Văn Thử' });
    fa = await startFeatureApp(db);
    fd = Client.of(fa, t, 'fd');
    const now = new Date('2026-10-15T09:00:00+07:00');
    fa.clock.set(now);
    await touchSessions(db, t, now);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  /** Booking.com, Fri 23/10 → Mon 26/10 (3 nights), no nightlyRates, no otaRoomAmountVnd. */
  const ota = (roomId: string) => ({
    roomId,
    channelId: ids.channels.booking,
    arrivalDate: '2026-10-23',
    departureDate: '2026-10-26',
    adults: 2,
    bookerGuestId: guest,
    paymentModel: 'ota_prepaid',
    otaRef: `BK${randomUUID().slice(0, 8)}`,
  });

  it('the row is really missing for this property', async () => {
    expect(await q(`SELECT 1 FROM config_parameter WHERE key = 'ota_base_rate'`)).toEqual([]);
  });

  it('201 at the list price of the room (203: 792.000) through the OTA calendar, calendar_rate_vnd stored', async () => {
    const res = await fd.send('POST', `${P(t)}/reservations`, ota(ids.rooms['203'] as string));
    expect(res.statusCode, res.body).toBe(201);
    const r = res.json();
    // Fri/Sat: 792.000 × 1,15 = 910.800 → 910.000; Sun: 792.000 → 790.000 (OTA rounding 10.000, BR-005) – the same
    // as `ota_base_rate` L12 = 792.000.
    const want = [910_000, 910_000, 790_000];
    expect(r.nightlyRates.map((n: { amountVnd: number }) => n.amountVnd)).toEqual(want);
    expect(r.nightlyRates.map((n: { calendarRateVnd: number }) => n.calendarRateVnd)).toEqual(want);
    expect(r.totalRoomVnd).toBe(2_610_000);

    const snap = await q<{ s: { nights: Array<Record<string, unknown>> } }>(
      'SELECT pricing_snapshot AS s FROM reservation WHERE id = $1',
      [r.id],
    );
    expect(snap[0]?.s.nights.map((n) => [n.source, n.calendarVnd, n.amountVnd])).toEqual(
      want.map((v) => ['calendar', v, v]),
    );
    const nights = await q<{ cal: string | null; gross: string }>(
      `SELECT calendar_rate_vnd AS cal, room_revenue_gross_vnd AS gross FROM stay_night
        WHERE reservation_id = $1 ORDER BY stay_date`,
      [r.id],
    );
    expect(nights.map((n) => [Number(n.cal), Number(n.gross)])).toEqual(want.map((v) => [v, v]));
    expect(nights.every((n) => n.cal !== null)).toBe(true);
  });

  it('a room without a list price for the stay → 422 nightlyRates REQUIRED, nothing written', async () => {
    const roomId = uuidv7();
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, base_occupancy, max_occupancy,
           public_slug, active_from, created_at, updated_at)
         VALUES ($1, $2, $3, $4, '901', 2, 3, $5, '2026-10-01', $6, $6)`,
        [
          roomId,
          t.organizationId,
          t.propertyIds[0],
          ids.groups.L12,
          randomBytes(9).toString('base64url'),
          T0,
        ],
      ),
    );
    const res = await fd.send('POST', `${P(t)}/reservations`, ota(roomId));
    expect(res.statusCode, res.body).toBe(422);
    expect(res.json().errors).toContainEqual({ field: 'nightlyRates', code: 'REQUIRED' });
    expect(await q('SELECT 1 FROM reservation_segment WHERE room_id = $1', [roomId])).toEqual([]);
  });
});
