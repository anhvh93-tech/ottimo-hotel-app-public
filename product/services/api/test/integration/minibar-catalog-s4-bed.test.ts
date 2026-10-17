/**
 * US-066 minibar catalogue + US-003 AC2 on the real PostgreSQL (BE-D Sprint 4, moved from BE-B):
 * - AC3 / A91: only OWN/MGR create or change items, prices, cost (FD, FDL, HK → 403);
 * - AC1 / BR-701: a complimentary item (salePriceVnd null) is counted (consumption recorded) but never charged;
 * - AC2 / BR-006: a new sale price applies to later counts – folio lines already posted keep their amount;
 * - US-003 AC2 / rbac M3, note 26: HK sees quantities, standard and missing items – never the cost price,
 *   unit prices of the count or amounts; FD sees sale prices, not the cost price;
 * - ItemInput rules (code, name, money bounds), duplicate code 422, code never edited (422 NOT_EDITABLE), If-Match 412,
 *   audit without the cost price.
 * Fake clock T0 = Thu 15/10/2026 09:00 VN. FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('US-066 minibar catalogue + US-003 AC2 (BE-D Sprint 4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const items: Record<string, { id: string; version: number }> = {};
  let x: { reservationId: string; code: string };
  let y: { reservationId: string; code: string };

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        hk: ['housekeeping'],
        sal: ['sales_staff'],
      },
    });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    // X leaves today (HK may count it); Y stays until 17/10 (the desk counts it).
    x = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: '202',
      arrival: '2026-10-13',
      departure: '2026-10-15',
    });
    y = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: '203',
      arrival: '2026-10-13',
      departure: '2026-10-17',
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const url = (path = '') => `${P(t)}/items${path}`;
  const create = (who: string, json: unknown) => staff(fa, tok(who), null, 'POST', url(), { json });
  const update = (who: string, id: string, version: number, json: unknown) =>
    staff(fa, tok(who), null, 'PATCH', url(`/${id}`), { json, ifMatch: version });
  const list = async (who: string) => {
    const r = await staff(fa, tok(who), null, 'GET', url());
    expect(r.statusCode, r.body).toBe(200);
    return Object.fromEntries(
      (r.json().data as Array<{ code: string }>).map((i) => [i.code, i]),
    ) as Record<string, Record<string, unknown>>;
  };
  const water = {
    code: 'nuoc',
    name: { vi: 'Nước suối 500ml', en: 'Mineral water 500ml' },
    unit: 'chai',
    costPriceVnd: 4000,
    salePriceVnd: null,
    minibarStandardQty: 2,
    minStockQty: 48,
  };
  const coke = {
    code: 'coca',
    name: { vi: 'Coca-Cola lon', en: 'Coca-Cola can' },
    unit: 'lon',
    costPriceVnd: 8000,
    salePriceVnd: 25_000,
    minibarStandardQty: 2,
    minStockQty: 24,
  };
  const minibarLines = (reservationId: string) =>
    q<{ amount_vnd: number; quantity: string; unit_price_vnd: number; reversal: boolean }>(
      `SELECT l.amount_vnd, l.quantity, l.unit_price_vnd, l.reversal_of_id IS NOT NULL AS reversal
         FROM folio_line l JOIN reservation r ON r.folio_id = l.folio_id
        WHERE r.id = $1 AND l.category = 'minibar' ORDER BY l.posted_at, l.id`,
      [reservationId],
    );

  it('AC3 / A91: OWN and MGR create items (ETag, complimentary flag); FD, FDL, HK cannot', async () => {
    const w = await create('own', water);
    expect(w.statusCode, w.body).toBe(201);
    expect(w.headers.etag).toBe('"1"');
    expect(w.json()).toMatchObject({
      code: 'nuoc',
      name: 'Nước suối 500ml',
      unit: 'chai',
      isFree: true,
      salePriceVnd: null,
      costPriceVnd: 4000,
      minibarStandardQty: 2,
      minStockQty: 48,
      isActive: true,
      version: 1,
    });
    items.nuoc = { id: w.json().id, version: 1 };
    const c = await create('mgr', coke);
    expect(c.statusCode, c.body).toBe(201);
    expect(c.json()).toMatchObject({ isFree: false, salePriceVnd: 25_000, costPriceVnd: 8000 });
    items.coca = { id: c.json().id, version: 1 };
    for (const who of ['fd', 'fdl', 'hk']) {
      const r = await create(who, { ...water, code: `x_${who}` });
      expect(r.statusCode, who).toBe(403);
      expect(r.json().code).toBe('FORBIDDEN_ACTION');
      const u = await update(who, items.coca.id, 1, { ...coke, salePriceVnd: 1 });
      expect(u.statusCode, who).toBe(403);
    }
    expect(
      (
        await q<{ name_i18n: Record<string, string> }>('SELECT name_i18n FROM item WHERE id = $1', [
          items.nuoc.id,
        ])
      )[0]!.name_i18n,
    ).toEqual({ vi: 'Nước suối 500ml', en: 'Mineral water 500ml' });
  });

  it('ItemInput rules: code format, name required, money bounds, duplicate code → 422', async () => {
    const cases: Array<[unknown, string, string]> = [
      [{ ...water, code: 'Nước' }, 'code', 'VALIDATION_FAILED'],
      [{ ...water, code: 'nuoc2', name: {} }, 'name.vi', 'REQUIRED'],
      [{ ...water, code: 'nuoc3', unit: '' }, 'unit', 'REQUIRED'],
      [{ ...water, code: 'nuoc4', salePriceVnd: -1 }, 'salePriceVnd', 'VALUE_OUT_OF_RANGE'],
      [
        { ...water, code: 'nuoc5', costPriceVnd: 100_000_001 },
        'costPriceVnd',
        'VALUE_OUT_OF_RANGE',
      ],
      [
        { ...water, code: 'nuoc6', minibarStandardQty: 2.5 },
        'minibarStandardQty',
        'VALIDATION_FAILED',
      ],
      [{ ...water }, 'code', 'DUPLICATE'],
    ];
    for (const [body, field, code] of cases) {
      const r = await create('own', body);
      expect(r.statusCode, JSON.stringify(body)).toBe(422);
      expect(r.json().errors, JSON.stringify(body)).toContainEqual({ field, code });
    }
  });

  it('US-003 AC2: HK sees quantities but no cost price; FD sees sale prices but no cost; SAL 403', async () => {
    const own = await list('own');
    expect(own.coca).toMatchObject({ costPriceVnd: 8000, salePriceVnd: 25_000 });
    const mgr = await list('mgr');
    expect(mgr.nuoc).toMatchObject({ costPriceVnd: 4000 });
    for (const who of ['fdl', 'fd', 'hk']) {
      const rows = await list(who);
      expect(rows.coca, who).not.toHaveProperty('costPriceVnd');
      expect(rows.coca, who).toMatchObject({
        minibarStandardQty: 2,
        minStockQty: 24,
        isFree: false,
      });
    }
    expect((await staff(fa, tok('sal'), null, 'GET', url())).statusCode).toBe(403);
  });

  it('AC1 / BR-701 + US-003 AC2: HK checkout count – free water recorded, not charged; HK never sees money', async () => {
    const std = await staff(
      fa,
      tok('hk'),
      null,
      'GET',
      `${P(t)}/reservations/${x.reservationId}/minibar-standard`,
    );
    expect(std.statusCode, std.body).toBe(200);
    for (const i of std.json().items) expect(i).not.toHaveProperty('unitPriceVnd');
    const deskStd = await staff(
      fa,
      tok('fd'),
      null,
      'GET',
      `${P(t)}/reservations/${x.reservationId}/minibar-standard`,
    );
    expect(deskStd.json().items).toContainEqual(
      expect.objectContaining({ itemId: items.coca!.id, unitPriceVnd: 25_000, isFree: false }),
    );
    const r = await staff(
      fa,
      tok('hk'),
      null,
      'POST',
      `${P(t)}/reservations/${x.reservationId}/minibar-checks`,
      {
        json: {
          mode: 'checkout',
          lines: [
            { itemId: items.nuoc!.id, remainingQty: 0 },
            { itemId: items.coca!.id, remainingQty: 1 },
          ],
        },
      },
    );
    expect(r.statusCode, r.body).toBe(201);
    const body = r.json();
    expect(body).not.toHaveProperty('totalVnd');
    for (const l of body.lines) expect(l).not.toHaveProperty('amountVnd');
    expect(body.lines).toContainEqual(
      expect.objectContaining({ itemId: items.nuoc!.id, usedQty: 2, isFree: true }),
    );
    // Only the charged item reaches the folio (25.000 × 1); the free water is consumption only.
    expect(await minibarLines(x.reservationId)).toEqual([
      { amount_vnd: 25_000, quantity: '1.00', unit_price_vnd: 25_000, reversal: false },
    ]);
    const used = await q<{ used: number }>(
      `SELECT (l.standard_qty - l.remaining_qty) AS used FROM minibar_check_line l
         JOIN minibar_check c ON c.id = l.check_id WHERE c.reservation_id = $1 AND l.item_id = $2`,
      [x.reservationId, items.nuoc!.id],
    );
    expect(used).toEqual([{ used: 2 }]);
  });

  it('AC2 / BR-006: a new sale price applies to the next counts; the posted line keeps 25.000; If-Match 412', async () => {
    const stale = await update('own', items.coca!.id, 7, { ...coke, salePriceVnd: 30_000 });
    expect(stale.statusCode).toBe(412);
    expect(stale.json().code).toBe('VERSION_CONFLICT');
    // FB-R2-ARC-BE-S3-32: the code never moves (column grants of 0042) – 422 NOT_EDITABLE, nothing written.
    const moved = await update('own', items.coca!.id, 1, { ...coke, code: 'coca_new' });
    expect(moved.statusCode, moved.body).toBe(422);
    expect(moved.json().errors).toEqual([{ field: 'code', code: 'NOT_EDITABLE' }]);
    const u = await update('own', items.coca!.id, 1, {
      ...coke,
      salePriceVnd: 30_000,
      costPriceVnd: 9000,
    });
    expect(u.statusCode, u.body).toBe(200);
    expect(u.headers.etag).toBe('"2"');
    expect(u.json()).toMatchObject({ salePriceVnd: 30_000, version: 2 });
    const r = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${y.reservationId}/minibar-checks`,
      {
        json: {
          mode: 'checkout',
          lines: [
            { itemId: items.nuoc!.id, remainingQty: 2 },
            { itemId: items.coca!.id, remainingQty: 0 },
          ],
        },
      },
    );
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().totalVnd).toBe(60_000);
    expect(await minibarLines(y.reservationId)).toEqual([
      { amount_vnd: 60_000, quantity: '2.00', unit_price_vnd: 30_000, reversal: false },
    ]);
    expect(await minibarLines(x.reservationId)).toEqual([
      { amount_vnd: 25_000, quantity: '1.00', unit_price_vnd: 25_000, reversal: false },
    ]);
    // Audit: config item.updated with the sale price; the cost price only as "changed" (C2).
    const audit = await q<{ before: Record<string, unknown>; after: Record<string, unknown> }>(
      `SELECT before, after FROM audit_event WHERE action = 'item.updated' AND entity_id = $1`,
      [items.coca!.id],
    );
    expect(audit).toHaveLength(1);
    expect(audit[0]!.before).toMatchObject({ salePriceVnd: 25_000 });
    expect(audit[0]!.after).toMatchObject({ salePriceVnd: 30_000, costChanged: true });
    expect(JSON.stringify(audit[0])).not.toContain('costPriceVnd');
    // Deactivated item leaves the standard fridge (no longer asked at the next count).
    const off = await update('mgr', items.nuoc!.id, 1, { ...water, isActive: false });
    expect(off.statusCode, off.body).toBe(200);
    const std = await staff(
      fa,
      tok('fd'),
      null,
      'GET',
      `${P(t)}/reservations/${y.reservationId}/minibar-standard`,
    );
    expect((std.json().items as Array<{ itemId: string }>).map((i) => i.itemId)).toEqual([
      items.coca!.id,
    ]);
  });
});
