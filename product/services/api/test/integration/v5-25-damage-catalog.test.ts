/**
 * V5-25 – `damage_catalog` (BR-512; BUG-R5-004, pulled from R5-B-05 by ORC 06/11, same kind as BUG-R5-003) through
 * the API and the database, in the order of QA's cases (rounds/round-05/qa/bug-list.md BUG-R5-004):
 * - (b) the Desk save (`PUT /parameters/damage_catalog`) refuses a table with a `null` item for today with 422
 *   PARAM_OUT_OF_RANGE; the value in force stays and getFolio, getBill, getChargeCatalog still answer 200; T-13-5
 *   over HTTP (DOM rules-v1.0.5 13.4);
 * - (d) a broken table already stored (written another way – v1.0.4 had no save rule): EVERY read path answers –
 *   getChargeCatalog, addFolioLine, getFolio, getBill, adjustFolioLine (one test each); the broken items are left out,
 *   the good ones apply; one warning without the value (DOM 13.2). Before this PR a single `null` item made every
 *   folio, bill and folio line of the property fail (TypeError on `d.code`) until the next business day;
 * - (e) not a list / `null` stored → no table: no `damage.*` item, damage outside the table still goes to MGR+ pricing;
 * - (f) a negative, missing or text price stored → that item is left out (before: negative → 500 on recording it
 *   (folio_line_sign_check), missing / text → the item vanished without a word), never a 500;
 * - (c) T-13-6: the production / DS-E value is saved from today; `[]` is saved; FD cannot save.
 * (g) is the regression run of test/integration/payments-s3.test.ts (charge catalogue, damage line, bill).
 * Fake clock: Thu 05/11/2026 09:00 (VN). Fake data only.
 */
import { Logger } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { resetDamageCatalogReadLog } from '../../src/modules/folio/internal/damage-catalog-read';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { DAMAGE_DEFAULT } from '../helpers/parameter-shape-cases';
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
const REASON = 'V5-25: kiểm dạng bảng đền bù khi lưu';
const TOWEL = DAMAGE_DEFAULT[0]!;
const GLASS = DAMAGE_DEFAULT[1]!;
const ALL_THREE = [
  ['damage.bath_towel', 'Khăn tắm', 150_000],
  ['damage.glass', 'Ly', 50_000],
  ['damage.remote', 'Remote', 200_000],
];

type Line = {
  id: string;
  category: string;
  amountVnd: number;
  chargeCode?: string | null;
  labelKey: string;
  labelParams?: Record<string, unknown>;
};

describe.skipIf(!HAS_DB)(
  'V5-25 – damage_catalog: save rule and defensive read (BUG-R5-004)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    let folioId: string;
    let warn: ReturnType<typeof vi.spyOn>;
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Thử Đền Bù' });
      // The baseline: the BR-512 table of DS-E / production in force (QA step 1).
      await setParam(db, t, 'damage_catalog', DAMAGE_DEFAULT, '2026-10-01');
      fa = await startFeatureApp(db);
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      fa.clock.set(NOW);
      await touchSessions(db, t, NOW);
      // One booking arriving today (Thursday, 1 night – no minimum stay on a Thursday arrival).
      const quote = await c.fd!.send('POST', url('/quotes/calculate'), {
        type: 'short',
        roomId: ids.rooms['101'],
        arrivalDate: TODAY,
        nights: 1,
        adults: 2,
        channelId: ids.channels.direct,
      });
      expect(quote.statusCode, quote.body).toBe(200);
      const booking = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms['101'],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        arrivalDate: TODAY,
        departureDate: '2026-11-06',
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
      folioId = booking.json().folioId as string;
      expect(folioId).toBeTruthy();
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });
    beforeEach(() => {
      resetDamageCatalogReadLog();
      warn = vi.spyOn(Logger.prototype, 'warn');
    });
    afterEach(() => warn.mockRestore());

    function url(path = '') {
      return `${P(t)}${path}`;
    }
    const rowsOf = async () =>
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ f: string; v: unknown }>(
            `SELECT effective_from::text AS f, value AS v FROM config_parameter
            WHERE key = 'damage_catalog' ORDER BY effective_from`,
          ),
        )
      ).rows;
    /** getChargeCatalog → the damage items [code, name, price]. */
    const damageCodes = async () => {
      const res = await c.fd!.get(url('/charge-catalog'));
      expect(res.statusCode, res.body).toBe(200);
      return (res.json().data as Array<{ code: string; name: string; defaultUnitPriceVnd: number }>)
        .filter((x) => x.code.startsWith('damage.'))
        .map((x) => [x.code, x.name, x.defaultUnitPriceVnd]);
    };
    const addDamage = (chargeCode: string) =>
      c.fd!.send('POST', url(`/folios/${folioId}/lines`), {
        chargeCode,
        quantity: 1,
        serviceDate: TODAY,
        note: 'Ảnh buồng phòng đính kèm',
      });
    const getFolio = async () => {
      const res = await c.fd!.get(url(`/folios/${folioId}`));
      expect(res.statusCode, res.body).toBe(200);
      return res.json() as { version: number; lines: Line[] };
    };
    const getBill = async () => {
      const res = await c.fd!.get(url(`/folios/${folioId}/bill`));
      expect(res.statusCode, res.body).toBe(200);
      return res.json() as { lines: Line[] };
    };
    const damageLines = (body: { lines: Line[] }) =>
      body.lines.filter((l) => l.category === 'damage');
    const put = (value: unknown, effectiveFrom = TODAY, who = 'mgr') =>
      c[who]!.send('PUT', url('/parameters/damage_catalog'), {
        value,
        effectiveFrom,
        reason: REASON,
      });
    /** The warnings of the damage read for this property. */
    const readWarnings = () =>
      warn.mock.calls
        .map((a: unknown[]) => String(a[0]))
        .filter(
          (m: string) => m.includes('parameter damage_catalog') && m.includes(t.propertyIds[0]!),
        );

    describe('(b) the save refuses a broken table; the value in force stays and every path answers', () => {
      it('baseline: getChargeCatalog, getFolio, getBill → 200 with the three items of DS-E', async () => {
        expect(await damageCodes()).toEqual(ALL_THREE);
        await getFolio();
        await getBill();
      });

      it('PUT the table + null for today → 422 value[3] REQUIRED, nothing written, the three paths still 200', async () => {
        const before = await rowsOf();
        const res = await put([...DAMAGE_DEFAULT, null], TODAY);
        expect(res.statusCode, res.body).toBe(422);
        expect(res.json()).toMatchObject({
          code: 'PARAM_OUT_OF_RANGE',
          errors: [{ field: 'value[3]', code: 'REQUIRED' }],
        });
        expect(await rowsOf()).toEqual(before);
        expect(await damageCodes()).toEqual(ALL_THREE);
        await getFolio();
        await getBill();
      });

      it('T-13-5 over HTTP: every wrong shape → 422 PARAM_OUT_OF_RANGE (field, code, min/max), nothing written', async () => {
        const before = await rowsOf();
        const cases: Array<[unknown, Record<string, unknown>]> = [
          [
            [{ ...GLASS, priceVnd: 0 }],
            {
              errors: [{ field: 'value[0].priceVnd', code: 'VALUE_OUT_OF_RANGE' }],
              min: 1_000,
              max: 20_000_000,
            },
          ],
          [
            [{ ...GLASS, priceVnd: 20_001_000 }],
            {
              errors: [{ field: 'value[0].priceVnd', code: 'VALUE_OUT_OF_RANGE' }],
              max: 20_000_000,
            },
          ],
          [
            [{ ...GLASS, priceVnd: -50_000 }],
            { errors: [{ field: 'value[0].priceVnd', code: 'VALUE_OUT_OF_RANGE' }] },
          ],
          [
            [{ ...GLASS, priceVnd: '50000' }],
            { errors: [{ field: 'value[0].priceVnd', code: 'VALIDATION_FAILED' }] },
          ],
          [
            [{ code: 'glass', name: 'Ly' }],
            { errors: [{ field: 'value[0].priceVnd', code: 'REQUIRED' }] },
          ],
          [[null], { errors: [{ field: 'value[0]', code: 'REQUIRED' }] }],
          [[TOWEL, 5], { errors: [{ field: 'value[1]', code: 'VALIDATION_FAILED' }] }],
          [['x'], { errors: [{ field: 'value[0]', code: 'VALIDATION_FAILED' }] }],
          [[GLASS, GLASS], { errors: [{ field: 'value[1].code', code: 'DUPLICATE' }] }],
          [
            [GLASS, { code: 'glass_2', name: 'ly', priceVnd: 60_000 }],
            { errors: [{ field: 'value[1].name', code: 'DUPLICATE' }] },
          ],
          [
            [{ ...GLASS, unit: 'cái' }],
            { errors: [{ field: 'value[0].unit', code: 'NOT_ALLOWED' }] },
          ],
          [
            [{ ...GLASS, code: 'Glass' }],
            { errors: [{ field: 'value[0].code', code: 'VALIDATION_FAILED' }] },
          ],
          [
            [{ ...GLASS, code: 'ly_đá' }],
            { errors: [{ field: 'value[0].code', code: 'VALIDATION_FAILED' }] },
          ],
          [
            Array.from({ length: 101 }, (_, i) => ({
              code: `c${i}`,
              name: `Món ${i}`,
              priceVnd: 1_000,
            })),
            { errors: [{ field: 'value', code: 'VALUE_OUT_OF_RANGE' }], max: 100 },
          ],
          [{ code: 'glass' }, { errors: [{ field: 'value', code: 'VALIDATION_FAILED' }] }],
          [null, { errors: [{ field: 'value', code: 'REQUIRED' }] }],
        ];
        for (const [value, expected] of cases) {
          const res = await put(value, TODAY);
          expect(res.statusCode, `${JSON.stringify(value).slice(0, 80)} ${res.body}`).toBe(422);
          expect(res.json(), JSON.stringify(value).slice(0, 80)).toMatchObject({
            code: 'PARAM_OUT_OF_RANGE',
            ...expected,
          });
        }
        expect(await rowsOf()).toEqual(before);
      });
    });

    describe('(d) a broken table already stored (the table + null, 5, "x"): every read path answers', () => {
      beforeAll(async () => {
        await setParam(db, t, 'damage_catalog', [...DAMAGE_DEFAULT, null, 5, 'x'], '2026-10-02');
      });

      it('getChargeCatalog → 200 with the three good items; one warning, without the value', async () => {
        expect(await damageCodes()).toEqual(ALL_THREE);
        expect(await damageCodes()).toEqual(ALL_THREE);
        const lines = readWarnings();
        // One line for the stored value (not one per read), never the value or a guest's name.
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/3 of 6 items left out, first value\[3\] REQUIRED/);
        expect(lines[0]).not.toMatch(/bath_towel|Khăn|Remote|glass|"x"|Đền Bù/);
      });

      it('addFolioLine damage.glass → 201 at 50.000 đ, labelled "Ly"', async () => {
        const added = await addDamage('damage.glass');
        expect(added.statusCode, added.body).toBe(201);
        expect(damageLines(added.json())).toEqual([
          expect.objectContaining({
            amountVnd: 50_000,
            chargeCode: 'damage.glass',
            labelKey: 'bill.line.damage',
            labelParams: expect.objectContaining({ item: 'Ly', qty: 1 }),
          }),
        ]);
      });

      it('getFolio → 200, the damage line labelled from the table', async () => {
        expect(damageLines(await getFolio()).map((l) => l.labelParams?.item)).toEqual(['Ly']);
      });

      it('getBill → 200, the damage line labelled from the table', async () => {
        expect(damageLines(await getBill()).map((l) => l.labelParams?.item)).toEqual(['Ly']);
      });

      it('adjustFolioLine (MGR voids the damage line) → 201, the folio body labels still read the table', async () => {
        const folio = await getFolio();
        const line = damageLines(folio)[0]!;
        const res = await c.mgr!.send(
          'POST',
          url(`/folios/${folioId}/lines/${line.id}/adjustments`),
          { voidLine: true, reason: 'Ghi nhầm món' },
          { 'if-match': `"${folio.version}"` },
        );
        expect(res.statusCode, res.body).toBe(201);
        expect(damageLines(res.json()).every((l) => l.labelParams?.item === 'Ly')).toBe(true);
        expect(damageLines(res.json()).map((l) => l.amountVnd)).toEqual([50_000, -50_000]);
      });
    });

    describe('(e) the whole value broken (an object, then null): no table, every path answers', () => {
      it.each([
        ['an object', { code: 'glass', name: 'Ly', priceVnd: 50_000 }, '2026-10-03'],
        ['null', null, '2026-10-04'],
      ])('%s stored → no damage.* item, getFolio / getBill 200', async (_label, value, from) => {
        await setParam(db, t, 'damage_catalog', value, from);
        expect(await damageCodes()).toEqual([]);
        // The lines recorded before keep their amounts (the label falls back, never a 500).
        expect(damageLines(await getFolio()).map((l) => l.amountVnd)).toEqual([50_000, -50_000]);
        await getBill();
        // An item of the table is now unknown: 422, never a 500.
        const glass = await addDamage('damage.glass');
        expect(glass.statusCode, glass.body).toBe(422);
        expect(glass.json().errors).toEqual(
          expect.arrayContaining([{ field: 'chargeCode', code: 'NOT_IN_LIST' }]),
        );
      });

      it('damage outside the table still goes to MGR+ pricing (BR-512): pending approval, not posted', async () => {
        const res = await c.fd!.send('POST', url(`/folios/${folioId}/lines`), {
          category: 'damage',
          description: 'Vỡ bình hoa',
          quantity: 1,
          proposedUnitPriceVnd: 300_000,
          serviceDate: TODAY,
          note: 'Ảnh buồng phòng đính kèm',
        });
        expect(res.statusCode, res.body).toBe(201);
        const approvals = await db.withContext(t.ctx(), (tx) =>
          tx.query<{ type: string; amount_vnd: number }>(
            `SELECT type, amount_vnd FROM approval_request WHERE type = 'damage_pricing'`,
          ),
        );
        expect(approvals.rows).toEqual([{ type: 'damage_pricing', amount_vnd: 300_000 }]);
      });
    });

    describe('(f) a negative, missing or text price stored: that item is left out, never a 500', () => {
      beforeAll(async () => {
        await setParam(
          db,
          t,
          'damage_catalog',
          [
            TOWEL,
            { ...GLASS, priceVnd: -50_000 },
            { code: 'remote', name: 'Remote' },
            { code: 'cup', name: 'Cốc', priceVnd: '40000' },
          ],
          '2026-10-05',
        );
      });

      it('getChargeCatalog shows only the towel; one warning names the first problem, not the value', async () => {
        expect(await damageCodes()).toEqual([['damage.bath_towel', 'Khăn tắm', 150_000]]);
        const lines = readWarnings();
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(
          /3 of 4 items left out, first value\[1\]\.priceVnd VALUE_OUT_OF_RANGE/,
        );
        expect(lines[0]).not.toMatch(/-50000|40000|Cốc|Remote/);
      });

      it('recording the negative-priced glass → 422 NOT_IN_LIST (before: 500 on folio_line_sign_check), nothing written', async () => {
        const before = (await getFolio()).lines.length;
        const glass = await addDamage('damage.glass');
        expect(glass.statusCode, glass.body).toBe(422);
        expect(glass.json().errors).toEqual(
          expect.arrayContaining([{ field: 'chargeCode', code: 'NOT_IN_LIST' }]),
        );
        expect((await getFolio()).lines.length).toBe(before);
        await getBill();
        const towel = await addDamage('damage.bath_towel');
        expect(towel.statusCode, towel.body).toBe(201);
      });
    });

    describe('(c) T-13-6: the running value is saved', () => {
      it('the production / DS-E value is saved from today and read back; [] for a later date; FD 403', async () => {
        const ok = await put(DAMAGE_DEFAULT, TODAY);
        expect(ok.statusCode, ok.body).toBe(200);
        expect((await rowsOf()).at(-1)).toEqual({ f: TODAY, v: DAMAGE_DEFAULT });
        expect(await damageCodes()).toEqual(ALL_THREE);
        expect((await addDamage('damage.remote')).statusCode).toBe(201);
        expect(damageLines(await getBill()).map((l) => l.labelParams?.item)).toEqual(
          expect.arrayContaining(['Khăn tắm', 'Remote']),
        );
        expect(readWarnings()).toEqual([]);
        const empty = await put([], '2026-11-20');
        expect(empty.statusCode, empty.body).toBe(200);
        // FD cannot change the table (owner, manager only – unchanged).
        expect((await put(DAMAGE_DEFAULT, '2026-11-21', 'fd')).statusCode).toBe(403);
      });
    });
  },
);
