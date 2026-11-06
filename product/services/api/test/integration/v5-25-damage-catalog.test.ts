/**
 * V5-25 – `damage_catalog` (BR-512; pulled from R5-B-05 by ORC 06/11, same kind as BUG-R5-003) through the API and
 * the database:
 * - a broken table already stored (written another way – v1.0.4 had no save rule) never gives a 500: getChargeCatalog,
 *   addFolioLine, getFolio and getBill all answer; a null / broken item is left out, the good ones apply; not a list
 *   → no table, damage goes "outside the table" (DOM rules-v1.0.5 13.2). Before this PR a single `null` item made every
 *   bill and folio of the property fail (TypeError on `d.code`) until the next business day;
 * - the Desk save (`PUT /parameters/damage_catalog`) refuses a wrong shape with 422 PARAM_OUT_OF_RANGE and the value in
 *   force stays (DOM 13.4, QA T-13-5); the production / DS-E value and `[]` are saved (plan V5-25 AC2, T-13-6).
 * Fake clock: Thu 05/11/2026 09:00 (VN). Fake data only.
 */
import { Logger } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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

type Line = {
  id: string;
  category: string;
  amountVnd: number;
  chargeCode?: string | null;
  labelKey: string;
  labelParams?: Record<string, unknown>;
};

describe.skipIf(!HAS_DB)('V5-25 – damage_catalog: defensive read and save rule', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let folioId: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Đền Bù' });
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
  const folioAndBill = async () => {
    const folio = await c.fd!.get(url(`/folios/${folioId}`));
    const bill = await c.fd!.get(url(`/folios/${folioId}/bill`));
    return { folio, bill };
  };
  const damageLines = (body: { lines: Line[] }) =>
    body.lines.filter((l) => l.category === 'damage');
  const put = (value: unknown, effectiveFrom = TODAY, who = 'mgr') =>
    c[who]!.send('PUT', url('/parameters/damage_catalog'), {
      value,
      effectiveFrom,
      reason: REASON,
    });

  it('a null item (the v1.0.4 500) and broken items stored: catalogue, addFolioLine, getFolio and getBill answer; the good items apply; one warning without the value', async () => {
    resetDamageCatalogReadLog();
    const warn = vi.spyOn(Logger.prototype, 'warn');
    try {
      await setParam(
        db,
        t,
        'damage_catalog',
        [
          null,
          DAMAGE_DEFAULT[0],
          { ...DAMAGE_DEFAULT[1], priceVnd: -1 },
          42,
          { code: 'Remote TV', name: 'Remote', priceVnd: 200_000 },
          DAMAGE_DEFAULT[2],
        ],
        '2026-10-02',
      );
      expect(await damageCodes()).toEqual([
        ['damage.bath_towel', 'Khăn tắm', 150_000],
        ['damage.remote', 'Remote', 200_000],
      ]);
      const added = await addDamage('damage.bath_towel');
      expect(added.statusCode, added.body).toBe(201);
      expect(damageLines(added.json())).toEqual([
        expect.objectContaining({
          amountVnd: 150_000,
          chargeCode: 'damage.bath_towel',
          labelKey: 'bill.line.damage',
          labelParams: expect.objectContaining({ item: 'Khăn tắm', qty: 1 }),
        }),
      ]);
      // An item left out is not in the catalogue: the desk uses "outside the table" (MGR+ prices it).
      const glass = await addDamage('damage.glass');
      expect(glass.statusCode, glass.body).toBe(422);
      expect(glass.json().errors).toEqual(
        expect.arrayContaining([{ field: 'chargeCode', code: 'NOT_IN_LIST' }]),
      );
      const { folio, bill } = await folioAndBill();
      expect(folio.statusCode, folio.body).toBe(200);
      expect(bill.statusCode, bill.body).toBe(200);
      expect(damageLines(bill.json())).toEqual([
        expect.objectContaining({ labelParams: expect.objectContaining({ item: 'Khăn tắm' }) }),
      ]);
      const lines = warn.mock.calls
        .map((a) => String(a[0]))
        .filter((m) => m.includes('parameter damage_catalog') && m.includes(t.propertyIds[0]!));
      // One line for the stored value (not one per read), never the value or a guest's name.
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/4 of 6 items left out, first value\[0\] REQUIRED/);
      expect(lines[0]).not.toMatch(/bath_towel|Khăn|Remote|glass|Đền Bù/);
    } finally {
      warn.mockRestore();
    }
  });

  it('not a list stored → no table: catalogue without damage items, getFolio and getBill still 200 (the line keeps its text)', async () => {
    await setParam(
      db,
      t,
      'damage_catalog',
      { code: 'glass', name: 'Ly', priceVnd: 50_000 },
      '2026-10-03',
    );
    expect(await damageCodes()).toEqual([]);
    const { folio, bill } = await folioAndBill();
    expect(folio.statusCode, folio.body).toBe(200);
    expect(bill.statusCode, bill.body).toBe(200);
    expect(damageLines(bill.json())).toHaveLength(1);
    expect(damageLines(bill.json())[0]!.amountVnd).toBe(150_000);
  });

  it('T-13-5 over HTTP: wrong shapes → 422 PARAM_OUT_OF_RANGE (field, code, min/max), nothing written', async () => {
    const before = await rowsOf();
    const cases: Array<[unknown, Record<string, unknown>]> = [
      [
        [{ ...DAMAGE_DEFAULT[1], priceVnd: 0 }],
        {
          errors: [{ field: 'value[0].priceVnd', code: 'VALUE_OUT_OF_RANGE' }],
          min: 1_000,
          max: 20_000_000,
        },
      ],
      [
        [{ ...DAMAGE_DEFAULT[1], priceVnd: 20_001_000 }],
        { errors: [{ field: 'value[0].priceVnd', code: 'VALUE_OUT_OF_RANGE' }], max: 20_000_000 },
      ],
      [[DAMAGE_DEFAULT[0], null], { errors: [{ field: 'value[1]', code: 'REQUIRED' }] }],
      [
        [DAMAGE_DEFAULT[1], DAMAGE_DEFAULT[1]],
        { errors: [{ field: 'value[1].code', code: 'DUPLICATE' }] },
      ],
      [
        [DAMAGE_DEFAULT[1], { code: 'glass_2', name: 'ly', priceVnd: 60_000 }],
        { errors: [{ field: 'value[1].name', code: 'DUPLICATE' }] },
      ],
      [
        [{ ...DAMAGE_DEFAULT[1], unit: 'cái' }],
        { errors: [{ field: 'value[0].unit', code: 'NOT_ALLOWED' }] },
      ],
      [
        [{ ...DAMAGE_DEFAULT[1], code: 'Glass' }],
        { errors: [{ field: 'value[0].code', code: 'VALIDATION_FAILED' }] },
      ],
      [{ code: 'glass' }, { errors: [{ field: 'value', code: 'VALIDATION_FAILED' }] }],
    ];
    for (const [value, expected] of cases) {
      const res = await put(value, TODAY);
      expect(res.statusCode, `${JSON.stringify(value)} ${res.body}`).toBe(422);
      expect(res.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', ...expected });
    }
    expect(await rowsOf()).toEqual(before);
  });

  it('T-13-6: the production / DS-E value is saved from today and read back; [] is saved for a later date', async () => {
    const ok = await put(DAMAGE_DEFAULT, TODAY);
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await rowsOf()).at(-1)).toEqual({ f: TODAY, v: DAMAGE_DEFAULT });
    expect(await damageCodes()).toEqual([
      ['damage.bath_towel', 'Khăn tắm', 150_000],
      ['damage.glass', 'Ly', 50_000],
      ['damage.remote', 'Remote', 200_000],
    ]);
    expect((await addDamage('damage.glass')).statusCode).toBe(201);
    const { bill } = await folioAndBill();
    expect(bill.statusCode, bill.body).toBe(200);
    expect(damageLines(bill.json()).map((l) => l.labelParams?.item)).toEqual(['Khăn tắm', 'Ly']);
    const empty = await put([], '2026-11-20');
    expect(empty.statusCode, empty.body).toBe(200);
    // FD cannot change the table (owner, manager only – unchanged).
    expect((await put(DAMAGE_DEFAULT, '2026-11-21', 'fd')).statusCode).toBe(403);
  });
});
