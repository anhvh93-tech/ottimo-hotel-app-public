/**
 * V5-22 – RATE_OUT_OF_RANGE with real numbers (BUG-R4-040; OpenAPI 0.3.13, contract-0.3.13 1.9 + 1.24 BE 12), on the
 * real modules + PostgreSQL:
 * - T22-1  createReservation under the floor / over the ceiling → 422 RATE_OUT_OF_RANGE with `dates[]` (every night out
 *          of range) and `min`/`max` of the first of them (BR-105 bounds of the room group);
 * - the OTA case (no reason) → 422 VALIDATION_FAILED + RATE_OUT_OF_RANGE_WARNING carries the same numbers.
 * The quote side (calculateQuote, T14-2) is in v5-14-quote-typed-rates.test.ts; extendStay (B13) in
 * bug-r4-038-internal-added-night.test.ts. FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type SalesIds, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

/** Lầu 1–2 (L12) bounds from `ota_base_rate` 760.000 × 70 % / 250 %, OTA unit 10.000 (BR-105, BUG-R2-018). */
const L12_FLOOR = 530_000;
const L12_CEILING = 1_900_000;

interface Night {
  date: string;
  amountVnd: number;
}

describe.skipIf(!HAS_DB)(
  'V5-22: createReservation RATE_OUT_OF_RANGE(_WARNING) has min/max of the first night',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: SalesIds;
    let guestFd: string;

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, { users: { fd: ['front_desk'] } });
      ids = await seedSales(db, t);
      guestFd = await seedGuest(db, t, t.users.fd!.id);
      fa = await startFeatureApp(db);
    });
    afterAll(async () => {
      await fa?.close();
      await db.close();
    });

    const send = (who: string, path: string, body: unknown) =>
      Client.of(fa, t, who).send('POST', `${P(t)}${path}`, body);
    const reservationCount = async (): Promise<number> =>
      Number(
        (
          await db.withContext(t.ctx(), (tx) =>
            tx.query<{ n: string }>('SELECT count(*) AS n FROM reservation'),
          )
        ).rows[0]!.n,
      );
    const direct = (nightlyRates: Night[], arrivalDate: string, departureDate: string) => ({
      roomId: ids.rooms['202'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate,
      departureDate,
      adults: 2,
      bookerGuestId: guestFd,
      paymentModel: 'direct',
      nightlyRates,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
    });

    it('T22-1: direct under the floor / over the ceiling → 422 RATE_OUT_OF_RANGE + dates[] + min + max', async () => {
      const before = await reservationCount();
      const low = await send(
        'fd',
        '/reservations',
        direct(
          [
            { date: '2027-01-11', amountVnd: 700_000 },
            { date: '2027-01-12', amountVnd: 529_000 },
            { date: '2027-01-13', amountVnd: 2_000_000 },
          ],
          '2027-01-11',
          '2027-01-14',
        ),
      );
      expect(low.statusCode, low.body).toBe(422);
      expect(low.json()).toMatchObject({
        code: 'RATE_OUT_OF_RANGE',
        errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
        dates: ['2027-01-12', '2027-01-13'],
        min: L12_FLOOR,
        max: L12_CEILING,
      });
      const high = await send(
        'fd',
        '/reservations',
        direct([{ date: '2027-01-11', amountVnd: 1_901_000 }], '2027-01-11', '2027-01-12'),
      );
      expect(high.statusCode, high.body).toBe(422);
      expect(high.json()).toMatchObject({
        code: 'RATE_OUT_OF_RANGE',
        dates: ['2027-01-11'],
        min: L12_FLOOR,
        max: L12_CEILING,
      });
      expect(await reservationCount()).toBe(before);
    });

    it('T22-1 edges: exactly the floor and exactly the ceiling are accepted', async () => {
      const res = await send(
        'fd',
        '/reservations',
        direct(
          [
            { date: '2027-02-01', amountVnd: L12_FLOOR },
            { date: '2027-02-02', amountVnd: L12_CEILING },
          ],
          '2027-02-01',
          '2027-02-03',
        ),
      );
      expect(res.statusCode, res.body).toBe(201);
    });

    it('OTA under the floor without a reason → 422 RATE_OUT_OF_RANGE_WARNING + dates[] + min + max', async () => {
      const res = await send('fd', '/reservations', {
        roomId: ids.rooms['202'],
        channelId: ids.channels.airbnb,
        arrivalDate: '2027-01-18',
        departureDate: '2027-01-19',
        adults: 2,
        bookerGuestId: guestFd,
        paymentModel: 'ota_prepaid',
        otaRef: `AB${randomBytes(4).toString('hex')}`,
        nightlyRates: [{ date: '2027-01-18', amountVnd: 400_000 }],
      });
      expect(res.statusCode, res.body).toBe(422);
      expect(res.json()).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE_WARNING' }],
        dates: ['2027-01-18'],
        min: L12_FLOOR,
        max: L12_CEILING,
      });
    });
  },
);
