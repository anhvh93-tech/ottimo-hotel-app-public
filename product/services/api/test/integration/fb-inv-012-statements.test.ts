/**
 * FB-INV-012 (R5, INV 17/11; contract rounds/round-05/fb-inv-012/contract.md mục 8 BE 2–10) – meter readings and monthly
 * statements of a long stay on the real PostgreSQL, through the HTTP API (guard, serializer, unit of work). DOM's
 * example stay: rent 8.500.000, arrival 20/11/2026, out 20/02/2027, room 202. Fake clock, FAKE data only.
 * INV 17/11 bổ sung: the opening reading of each period is typed; opening − previous closing = gap, never billed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import {
  HAS_DB,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam as setTenantParam,
} from '../helpers/tenant';

const at = (iso: string) => new Date(iso);
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  hk: ['housekeeping'],
  mt: ['maintenance'],
  sal: ['sales_staff'],
  ctv: ['collaborator'],
};

describe.skipIf(!HAS_DB)('FB-INV-012 – meter readings + monthly statements (long stay)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let ids1: BookingIds;
  let stay: string;
  let folioId: string;
  let room202: string;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = [], i = 0) =>
    (await db.withContext(t.ctx(i), (tx) => tx.query<R>(sql, p))).rows;
  const api = (
    who: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH',
    path: string,
    opts: { json?: unknown; ifMatch?: number; idem?: string } = {},
  ) => staff(fa, tok(who), null, method, `${P(t)}${path}`, opts);
  const now = async (iso: string) => {
    fa.clock.set(at(iso));
    await touchSessions(db, t, fa.clock.now());
  };
  const reading = (who: string, body: Json) =>
    api(who, 'POST', `/reservations/${stay}/meter-readings`, {
      json: { roomId: room202, photoWaived: true, note: 'Photo sent later', ...body },
    });
  const create = (who: string, month: string, kind?: string) =>
    api(who, 'POST', `/reservations/${stay}/billing-periods`, {
      json: { month, ...(kind ? { kind } : {}) },
    });
  const get = async (id: string) =>
    (await api('fd', 'GET', `/billing-periods/${id}`)).json() as Json;
  const issue = async (who: string, id: string, ack = true, extra: { idem?: string } = {}) => {
    const v = (await get(id)).version as number;
    return api(who, 'POST', `/billing-periods/${id}/issue`, {
      json: { acknowledgeWarnings: ack },
      ifMatch: v,
      ...extra,
    });
  };
  const folioLines = (chargeCode: string) =>
    q<{
      id: string;
      quantity: string;
      unit_price_vnd: string;
      amount_vnd: string;
      vat_rate_pct: string | null;
      reversal_of_id: string | null;
      limit_ref_vnd: string | null;
      category: string;
      period_from: string | null;
    }>(
      `SELECT id, quantity::text, unit_price_vnd::text, amount_vnd::text, vat_rate_pct::text, reversal_of_id,
              limit_ref_vnd::text, category, period_from::text
         FROM folio_line WHERE folio_id = $1 AND charge_code = $2 ORDER BY posted_at, id`,
      [folioId, chargeCode],
    );
  const folioTotal = async () =>
    Number(
      (
        await q<{ s: string }>(
          'SELECT COALESCE(sum(amount_vnd), 0)::text AS s FROM folio_line WHERE folio_id = $1',
          [folioId],
        )
      )[0]!.s,
    );
  const postService = async (category: string, date: string, amount: number, related?: string) => {
    const folios = fa.app.get(FolioService);
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await folios.postLines(
            tx,
            folioId,
            [
              {
                category: category as 'cleaning',
                description: `${category} test`,
                quantity: 1,
                unitPriceVnd: amount,
                serviceDate: date,
                source: 'manual',
                ...(related ? { relatedLineId: related } : {}),
              },
            ],
            { userId: t.users.own!.id },
          )
        )[0] as string,
    );
  };

  let nov: Json;
  let dec: Json;
  let cleaning: string;
  let fnb: string;

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { properties: 2, users: ROLES });
    ids = await seedBooking(db, t);
    ids1 = await seedBooking(db, t, 1);
    const s = await seedStay(db, t, ids, {
      status: 'in_house',
      stayType: 'long',
      arrival: '2026-11-20',
      departure: '2027-02-20',
      roomNo: '202',
      bookerName: 'Nguyễn Văn Minh',
    });
    stay = s.reservationId;
    room202 = ids.rooms['202'] as string;
    await q(
      `UPDATE reservation SET manual_long_stay = '{"monthly_rent_vnd": 8500000}'::jsonb WHERE id = $1`,
      [stay],
    );
    folioId = (
      await q<{ folio_id: string }>('SELECT folio_id FROM reservation WHERE id = $1', [stay])
    )[0]!.folio_id;
    fa = await startFeatureApp(db);
    await now('2026-11-20T14:00:00+07:00');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('check-in reading: photo required; FD cannot waive it (A89 simplified); water fraction dropped', async () => {
    const noPhoto = await api('fd', 'POST', `/reservations/${stay}/meter-readings`, {
      json: {
        roomId: room202,
        kind: 'checkin',
        readOn: '2026-11-20',
        electricity: { value: 1250 },
        water: { value: 35.27 },
      },
    });
    expect(noPhoto.statusCode).toBe(422);
    expect(noPhoto.json().errors).toEqual([{ field: 'photoAttachmentId', code: 'REQUIRED' }]);
    const fdWaive = await reading('fd', {
      kind: 'checkin',
      readOn: '2026-11-20',
      electricity: { value: 1250 },
      water: { value: 35.27 },
    });
    expect(fdWaive.statusCode).toBe(403);
    const badPhoto = await api('fd', 'POST', `/reservations/${stay}/meter-readings`, {
      json: {
        roomId: room202,
        kind: 'checkin',
        readOn: '2026-11-20',
        electricity: { value: 1250 },
        water: { value: 35.27 },
        photoAttachmentId: uuidv7(),
      },
    });
    expect(badPhoto.statusCode).toBe(422);
    expect(badPhoto.json().errors[0]).toMatchObject({
      field: 'photoAttachmentId',
      code: 'NOT_IN_LIST',
    });
    const ok = await reading('fdl', {
      kind: 'checkin',
      readOn: '2026-11-20',
      electricity: { value: 1250 },
      water: { value: 35.27 },
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.headers['cache-control']).toBe('no-store');
    expect(ok.json()).toMatchObject({
      kind: 'checkin',
      electricity: { value: 1250 },
      water: { value: 35.2 },
      photoWaived: true,
    });
    const dup = await reading('fdl', {
      kind: 'checkin',
      readOn: '2026-11-20',
      electricity: { value: 1250 },
      water: { value: 35.2 },
    });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().code).toBe('READING_EXISTS');
  });

  it('November statement (partial first month at check-in, INV 17/11): 3.113.000; folio monthly_rent line', async () => {
    const r = await create('fd', '2026-11');
    expect(r.statusCode).toBe(201);
    nov = r.json();
    expect(nov).toMatchObject({
      status: 'draft',
      kind: 'regular',
      month: '2026-11',
      code: null,
      guestDisplayName: 'N. Minh',
      roomNos: ['202'],
      rentPeriod: { from: '2026-11-20', to: '2026-11-30' },
      dueDate: '2026-11-20',
      totals: { totalVnd: 3_113_000, roundingVnd: 0, balanceVnd: 3_113_000 },
      availableActions: ['update', 'issue', 'void'],
    });
    expect(nov.lines).toEqual([
      expect.objectContaining({
        kind: 'rent',
        quantity: 11,
        unit: 'day',
        unitPriceNetVnd: 283_000,
        amountVnd: 3_113_000,
        folioLineId: null,
      }),
    ]);
    expect(JSON.stringify(nov)).not.toMatch(/Nguyễn Văn|phone|email|nationality/);
    const again = await create('fd', '2026-11');
    expect(again.statusCode).toBe(409);
    expect(again.json()).toMatchObject({ code: 'STATEMENT_EXISTS', billingPeriodId: nov.id });
    const before = await folioTotal();
    const idem = uuidv7();
    const i1 = await issue('fd', nov.id, true, { idem });
    expect(i1.statusCode).toBe(200);
    expect(i1.json()).toMatchObject({ status: 'issued', code: 'TT-2611-202' });
    // Same Idempotency-Key → same answer, nothing written twice.
    const i2 = await api('fd', 'POST', `/billing-periods/${nov.id}/issue`, {
      json: { acknowledgeWarnings: true },
      ifMatch: nov.version,
      idem,
    });
    expect(i2.statusCode).toBe(200);
    expect(i2.json().code).toBe('TT-2611-202');
    const rent = await folioLines('monthly_rent');
    expect(rent).toHaveLength(1);
    expect(rent[0]).toMatchObject({
      category: 'room',
      quantity: '11.00',
      unit_price_vnd: '283000',
      amount_vnd: '3113000',
      limit_ref_vnd: '283000',
      period_from: '2026-11-20',
    });
    expect((await folioTotal()) - before).toBe(3_113_000);
    nov = await get(nov.id); // read as FD: void of an issued statement is FDL+ (contract mục 4)
    expect(nov.availableActions).toEqual(['record_payment', 'print']);
    const asFdl = (await api('fdl', 'GET', `/billing-periods/${nov.id}`)).json();
    expect(asFdl.availableActions).toEqual(['record_payment', 'print', 'void']);
  });

  it('payments: partial, over balance → 422, full → paid; reversing a receipt goes back (A34)', async () => {
    const over = await api('fd', 'POST', `/billing-periods/${nov.id}/payments`, {
      json: { method: 'vietqr', amountVnd: 3_113_001 },
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({ code: 'AMOUNT_OVER_BALANCE', balanceVnd: 3_113_000 });
    const p1 = await api('own', 'POST', `/billing-periods/${nov.id}/payments`, {
      json: { method: 'vietqr', amountVnd: 1_000_000 },
    });
    expect(p1.statusCode).toBe(201);
    expect(p1.json().billingPeriod).toMatchObject({
      status: 'partially_paid',
      totals: { paidVnd: 1_000_000, balanceVnd: 2_113_000 },
    });
    expect(p1.json().payment).toMatchObject({
      method: 'vietqr',
      amountVnd: 1_000_000,
      reconciliation: 'pending',
    });
    const pay = await q<{ billing_period_id: string; type: string }>(
      'SELECT billing_period_id, type FROM payment WHERE id = $1',
      [p1.json().payment.id],
    );
    expect(pay[0]).toEqual({ billing_period_id: nov.id, type: 'charge' });
    const p2 = await api('own', 'POST', `/billing-periods/${nov.id}/payments`, {
      json: { method: 'vietqr', amountVnd: 2_113_000 },
    });
    expect(p2.statusCode).toBe(201);
    expect(p2.json().billingPeriod).toMatchObject({
      status: 'paid',
      totals: { balanceVnd: 0 },
      availableActions: ['print'],
    });
    const rev = await api('own', 'POST', `/payments/${p2.json().payment.id}/actions/reverse`, {
      json: { reason: 'Entered twice by mistake' },
    });
    expect(rev.statusCode).toBeLessThan(300);
    expect(await get(nov.id)).toMatchObject({
      status: 'partially_paid',
      paidAt: null,
      totals: { paidVnd: 1_000_000, balanceVnd: 2_113_000 },
    });
    const hasPay = await api('fdl', 'POST', `/billing-periods/${nov.id}/void`, {
      json: { reason: 'Wrong statement' },
    });
    expect(hasPay.statusCode).toBe(409);
    expect(hasPay.json().code).toBe('STATEMENT_HAS_PAYMENTS');
  });

  it('closing of November + services; draft computed on read; DOM numbers 613.440 / 89.250 / 9.502.690 → 9.502.000', async () => {
    await now('2026-11-25T10:00:00+07:00');
    const early = await reading('own', {
      kind: 'period_end',
      periodMonth: '2026-11',
      readOn: '2026-11-25',
      electricity: { value: 1392 },
      water: { value: 38.6 },
    });
    expect(early.statusCode).toBe(422);
    expect(early.json()).toMatchObject({
      code: 'READING_OUT_OF_WINDOW',
      windowFrom: '2026-11-30',
      windowTo: '2026-12-01',
    });
    cleaning = await postService('cleaning', '2026-11-25', 150_000);
    fnb = await postService('fnb', '2026-11-28', 150_000);
    const laundry = await postService('laundry', '2026-11-26', 80_000);
    await postService('foc', '2026-11-26', -80_000, laundry); // FOC → net 0 → left out
    await postService('laundry', '2026-12-02', 50_000); // next service period
    await now('2026-11-30T20:00:00+07:00');
    const lower = await reading('own', {
      kind: 'period_end',
      periodMonth: '2026-11',
      readOn: '2026-11-30',
      electricity: { value: 1200 },
      water: { value: 38.6 },
    });
    expect(lower.statusCode).toBe(422);
    expect(lower.json()).toMatchObject({
      code: 'METER_LOWER_THAN_PREVIOUS',
      meter: 'electricity',
      previousValue: 1250,
      previousKind: 'checkin',
    });
    const close = await reading('own', {
      kind: 'period_end',
      periodMonth: '2026-11',
      readOn: '2026-11-30',
      electricity: { value: 1392 },
      water: { value: 38.67 },
    });
    expect(close.statusCode).toBe(201);
    expect(close.json()).toMatchObject({
      consumption: { electricity: 142, water: 3.4 },
      water: { value: 38.6 },
    });

    await now('2026-12-01T09:00:00+07:00');
    const r = await create('fd', '2026-12');
    expect(r.statusCode).toBe(201);
    dec = r.json();
    const byKind = (k: string) => dec.lines.filter((l: Json) => l.kind === k);
    expect(byKind('rent')).toEqual([
      expect.objectContaining({ quantity: 1, unit: 'month', amountVnd: 8_500_000 }),
    ]);
    expect(byKind('electricity')).toEqual([
      expect.objectContaining({
        quantity: 142,
        unit: 'kwh',
        unitPriceNetVnd: 4000,
        vatRatePct: 8,
        netVnd: 568_000,
        vatVnd: 45_440,
        amountVnd: 613_440,
        meter: { from: 1250, to: 1392, exception: null },
        roomNo: '202',
      }),
    ]);
    expect(byKind('water')).toEqual([
      expect.objectContaining({
        quantity: 3.4,
        unit: 'm3',
        unitPriceNetVnd: 25_000,
        vatRatePct: 5,
        netVnd: 85_000,
        vatVnd: 4_250,
        amountVnd: 89_250,
      }),
    ]);
    expect(
      byKind('service')
        .map((l: Json) => l.folioLineId)
        .sort(),
    ).toEqual([cleaning, fnb].sort());
    expect(dec.totals).toMatchObject({
      netVnd: 9_453_000,
      vatVnd: 49_690,
      roundingVnd: -690,
      totalVnd: 9_502_000,
    });
    expect(byKind('rounding')).toEqual([
      expect.objectContaining({ amountVnd: -690, labelKey: 'bill.line.statement_rounding' }),
    ]);
    expect(dec.warnings.map((w: Json) => w.code)).toContain('PHOTO_WAIVED');
    expect(dec).toMatchObject({
      dueDate: '2026-12-05',
      rentPeriod: { from: '2026-12-01', to: '2026-12-31' },
      utilityPeriod: { from: '2026-11-01', to: '2026-11-30' },
    });
  });

  it('moving a service line (FD) and the prior adjustment (FDL+ only); a line outside the period → NOT_IN_LIST', async () => {
    const moved = await api('fd', 'PATCH', `/billing-periods/${dec.id}`, {
      json: { excludedFolioLineIds: [fnb] },
      ifMatch: dec.version,
    });
    expect(moved.statusCode).toBe(200);
    expect(moved.json().totals.totalVnd).toBe(9_352_000);
    const stale = await api('fd', 'PATCH', `/billing-periods/${dec.id}`, {
      json: { excludedFolioLineIds: [] },
      ifMatch: dec.version,
    });
    expect(stale.statusCode).toBe(412);
    const bad = await api('fd', 'PATCH', `/billing-periods/${dec.id}`, {
      json: { excludedFolioLineIds: [uuidv7()] },
      ifMatch: moved.json().version,
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors[0]).toEqual({ field: 'excludedFolioLineIds[0]', code: 'NOT_IN_LIST' });
    const fdAdj = await api('fd', 'PATCH', `/billing-periods/${dec.id}`, {
      json: { priorAdjustment: { amountVnd: -10_000, reason: 'Late wifi fix' } },
      ifMatch: moved.json().version,
    });
    expect(fdAdj.statusCode).toBe(403);
    const back = await api('fdl', 'PATCH', `/billing-periods/${dec.id}`, {
      json: { excludedFolioLineIds: [] },
      ifMatch: moved.json().version,
    });
    expect(back.statusCode).toBe(200);
    expect(back.json().totals.totalVnd).toBe(9_502_000);
    dec = back.json();
  });

  it('issue: warnings must be acknowledged; folio lines of contract 2.4; folio grows by the posted part; two concurrent issues → one wins', async () => {
    const noAck = await issue('fd', dec.id, false);
    expect(noAck.statusCode).toBe(422);
    expect(noAck.json().code).toBe('WARNINGS_NOT_ACKNOWLEDGED');
    expect(noAck.json().warnings.map((w: Json) => w.code)).toContain('PHOTO_WAIVED');
    const before = await folioTotal();
    const v = (await get(dec.id)).version as number;
    const [a, b] = await Promise.all([
      api('fd', 'POST', `/billing-periods/${dec.id}/issue`, {
        json: { acknowledgeWarnings: true },
        ifMatch: v,
      }),
      api('fdl', 'POST', `/billing-periods/${dec.id}/issue`, {
        json: { acknowledgeWarnings: true },
        ifMatch: v,
      }),
    ]);
    const codes = [a.statusCode, b.statusCode].sort();
    expect(codes[0]).toBe(200);
    expect([409, 412]).toContain(codes[1]);
    const issued = await get(dec.id);
    expect(issued).toMatchObject({
      status: 'issued',
      code: 'TT-2612-202',
      totals: { totalVnd: 9_502_000 },
    });
    expect(issued.lines.every((l: Json) => typeof l.folioLineId === 'string')).toBe(true);
    // Posted by the statement: rent + electricity + water + rounding (the services were already on the folio).
    expect((await folioTotal()) - before).toBe(8_500_000 + 613_440 + 89_250 - 690);
    const el = await folioLines('electricity');
    expect(el).toEqual([
      expect.objectContaining({
        category: 'utilities',
        quantity: '142.00',
        unit_price_vnd: '4320',
        amount_vnd: '613440',
        vat_rate_pct: '8.00',
      }),
    ]);
    const wa = await folioLines('water');
    expect(wa).toEqual([
      expect.objectContaining({
        quantity: '3.40',
        unit_price_vnd: '26250',
        amount_vnd: '89250',
        vat_rate_pct: '5.00',
      }),
    ]);
    expect(await folioLines('statement_rounding')).toEqual([
      expect.objectContaining({ category: 'adjustment', amount_vnd: '-690' }),
    ]);
    // A statement line cannot be reduced by hand (FOC) – BR-LS-16 instead.
    const audit = await q<{ action: string }>(
      `SELECT action FROM audit_event WHERE entity_id = $1 ORDER BY occurred_at`,
      [dec.id],
    );
    expect(audit.map((x) => x.action)).toContain('billing_period.issued');
    // One live statement per service line (UK on folio_line_id WHERE active).
    await expect(
      q(
        `INSERT INTO billing_period_line (id, organization_id, property_id, billing_period_id, kind, folio_line_id,
           posted_by_statement, quantity, unit, unit_price_net_vnd, net_vnd, vat_vnd, amount_vnd, label_key, sort_order, created_at)
         SELECT $1, organization_id, property_id, $2, 'service', $3, false, 1, 'item', 150000, 150000, 0, 150000, 'x', 99, now()
           FROM billing_period WHERE id = $2`,
        [uuidv7(), nov.id, cleaning],
      ),
    ).rejects.toThrow(/billing_period_line_live_folio_line_key/);
  });

  it('print: issued only, VietQR null without receiving account, initials only, audit printed', async () => {
    const draftPrint = await create('fd', '2027-01');
    expect(draftPrint.statusCode).toBe(201);
    const refused = await api('fd', 'GET', `/billing-periods/${draftPrint.json().id}/print`);
    expect(refused.statusCode).toBe(409);
    const p = await api('fd', 'GET', `/billing-periods/${dec.id}/print`);
    expect(p.statusCode).toBe(200);
    expect(p.json()).toMatchObject({
      code: 'TT-2612-202',
      guest: { fullName: 'Nguyễn Văn Minh' },
      property: { displayName: 'Test property 0' },
      vietqr: null,
    });
    expect(JSON.stringify(p.json())).not.toMatch(/phone"|nationality|documentNo/);
    const audit = await q<{ action: string }>(
      `SELECT action FROM audit_event WHERE entity_id = $1`,
      [dec.id],
    );
    expect(audit.map((x) => x.action)).toContain('billing_period.printed');
    // The January draft is voided again (made here only for the draft print check).
    expect(
      (
        await api('fd', 'POST', `/billing-periods/${draftPrint.json().id}/void`, {
          json: { reason: 'Made too early' },
        })
      ).statusCode,
    ).toBe(200);
  });

  it('void an unpaid issued statement: FD 403, FDL reverses its lines; replacement gets -R1; used reading cannot be voided', async () => {
    const readings = (await (await api('fd', 'GET', `/reservations/${stay}/meter-readings`)).json())
      .items as Json[];
    const checkin = readings.find((r) => r.kind === 'checkin')!;
    const used = await api('fd', 'POST', `/meter-readings/${checkin.id}/void`, {
      json: { reason: 'Typed wrong' },
    });
    expect(used.statusCode).toBe(409);
    expect(used.json()).toMatchObject({
      code: 'READING_ON_ISSUED_STATEMENT',
      statementCode: 'TT-2612-202',
    });
    const fd = await api('fd', 'POST', `/billing-periods/${dec.id}/void`, {
      json: { reason: 'Wrong water reading' },
    });
    expect(fd.statusCode).toBe(403);
    const before = await folioTotal();
    const v = await api('fdl', 'POST', `/billing-periods/${dec.id}/void`, {
      json: { reason: 'Wrong water reading' },
    });
    expect(v.statusCode).toBe(200);
    expect(v.json()).toMatchObject({ status: 'void', canReplace: true });
    expect((await folioTotal()) - before).toBe(-(8_500_000 + 613_440 + 89_250 - 690));
    expect((await folioLines('electricity')).map((l) => l.reversal_of_id !== null)).toEqual([
      false,
      true,
    ]);
    const again = await create('fd', '2026-12');
    expect(again.statusCode).toBe(201);
    expect(again.json().replacesId).toBe(dec.id);
    const i = await issue('fd', again.json().id);
    expect(i.statusCode).toBe(200);
    expect(i.json()).toMatchObject({ code: 'TT-2612-202-R1', totals: { totalVnd: 9_502_000 } });
    dec = i.json();
  });

  it('overdue derived on read: 05 due_today, 06 overdue, 08 alert, 15 escalate (criterion 8)', async () => {
    const level = async (iso: string) => {
      await now(iso);
      const r = await api('fd', 'GET', `/billing-periods?overdue=true&month=2026-12`);
      expect(r.statusCode).toBe(200);
      return (r.json().data as Json[]).map((x) => [x.code, x.alertLevel, x.overdueDays]);
    };
    expect(await level('2026-12-04T10:00:00+07:00')).toEqual([]);
    expect(await level('2026-12-05T10:00:00+07:00')).toEqual([['TT-2612-202-R1', 'due_today', 0]]);
    expect(await level('2026-12-06T10:00:00+07:00')).toEqual([['TT-2612-202-R1', 'overdue', 1]]);
    expect(await level('2026-12-08T10:00:00+07:00')).toEqual([['TT-2612-202-R1', 'alert', 3]]);
    expect(await level('2026-12-15T10:00:00+07:00')).toEqual([['TT-2612-202-R1', 'escalate', 10]]);
  });

  it('INV 17/11: the opening of December is typed; gap = opening − previous closing, stored and NOT billed', async () => {
    await now('2026-12-01T09:30:00+07:00');
    const lower = await reading('own', {
      kind: 'period_start',
      periodMonth: '2026-12',
      readOn: '2026-12-01',
      electricity: { value: 1390 },
      water: { value: 38.6 },
    });
    expect(lower.statusCode).toBe(422);
    expect(lower.json()).toMatchObject({
      code: 'METER_LOWER_THAN_PREVIOUS',
      meter: 'electricity',
      previousValue: 1392,
      previousKind: 'period_end',
    });
    const open = await reading('own', {
      kind: 'period_start',
      periodMonth: '2026-12',
      readOn: '2026-12-01',
      electricity: { value: 1395 },
      water: { value: 38.9 },
    });
    expect(open.statusCode).toBe(201);
    expect(open.json()).toMatchObject({
      previousClosing: { electricity: 1392, water: 38.6 },
      gap: { electricity: 3, water: 0.3 },
    });
    const stored = await q<{ electricity_gap: string; water_gap: string }>(
      'SELECT electricity_gap::text, water_gap::text FROM meter_reading WHERE id = $1',
      [open.json().id],
    );
    expect(stored[0]).toEqual({ electricity_gap: '3', water_gap: '0.3' });
    await now('2026-12-31T20:00:00+07:00');
    const close = await reading('own', {
      kind: 'period_end',
      periodMonth: '2026-12',
      readOn: '2026-12-31',
      electricity: { value: 1500 },
      water: { value: 41 },
    });
    expect(close.statusCode).toBe(201);
    expect(close.json().consumption).toMatchObject({ electricity: 105, water: 2.1 });
    await now('2027-01-01T09:00:00+07:00');
    const jan = await create('fd', '2027-01');
    expect(jan.statusCode).toBe(201);
    const el = (jan.json().lines as Json[]).find((l) => l.kind === 'electricity')!;
    expect(el).toMatchObject({ quantity: 105, meter: { from: 1395, to: 1500 } }); // 1392 → 1395 not billed
    // Voiding the closing (not on an issued statement) → the draft recomputes: reading missing at issue.
    const v = await api('fd', 'POST', `/meter-readings/${close.json().id}/void`, {
      json: { reason: 'Typed wrong' },
    });
    expect(v.statusCode).toBe(200);
    expect((await get(jan.json().id)).missingReadings).toEqual([
      { roomId: room202, roomNo: '202', kind: 'period_end', periodMonth: '2026-12' },
    ]);
    const missing = await issue('fd', jan.json().id);
    expect(missing.statusCode).toBe(422);
    expect(missing.json().code).toBe('METER_READING_MISSING');
    expect(
      (
        await reading('own', {
          kind: 'period_end',
          periodMonth: '2026-12',
          readOn: '2026-12-31',
          electricity: { value: 1500 },
          water: { value: 41 },
        })
      ).statusCode,
    ).toBe(201);
    const i = await issue('fd', jan.json().id);
    expect(i.statusCode).toBe(200);
    expect(i.json().code).toBe('TT-2701-202');
  });

  it('final statement (BR-LS-04): rent × months − rent of earlier statements = 5.387.000; kind regular refused', async () => {
    await now('2027-01-01T09:40:00+07:00');
    expect(
      (
        await reading('own', {
          kind: 'period_start',
          periodMonth: '2027-01',
          readOn: '2027-01-01',
          electricity: { value: 1500 },
          water: { value: 41 },
        })
      ).statusCode,
    ).toBe(201);
    await now('2027-01-31T20:00:00+07:00');
    expect(
      (
        await reading('own', {
          kind: 'period_end',
          periodMonth: '2027-01',
          readOn: '2027-01-31',
          electricity: { value: 1620 },
          water: { value: 44 },
        })
      ).statusCode,
    ).toBe(201);
    await now('2027-02-01T09:00:00+07:00');
    const regular = await create('fd', '2027-02', 'regular');
    expect(regular.statusCode).toBe(422);
    expect(regular.json()).toMatchObject({
      errors: [{ field: 'kind', code: 'NOT_ALLOWED' }],
      allowed: ['final'],
    });
    const fin = await create('fd', '2027-02');
    expect(fin.statusCode).toBe(201);
    expect(fin.json()).toMatchObject({
      kind: 'final',
      rentPeriod: { from: '2027-02-01', to: '2027-02-19' },
    });
    expect((fin.json().lines as Json[]).find((l) => l.kind === 'rent')).toMatchObject({
      amountVnd: 5_387_000,
    });
    const mar = await create('fd', '2027-03');
    expect(mar.statusCode).toBe(422);
    expect(mar.json().errors).toEqual([{ field: 'month', code: 'NOT_ALLOWED' }]);
  });

  it('roles (criterion 9): HK, MT, SAL, CTV → 403 everywhere; desk roles read', async () => {
    for (const who of ['own', 'mgr', 'fdl', 'fd']) {
      expect((await api(who, 'GET', `/billing-periods?month=2026-12`)).statusCode).toBe(200);
      expect((await api(who, 'GET', `/reservations/${stay}/meter-readings`)).statusCode).toBe(200);
      expect((await api(who, 'GET', `/billing-periods/candidates?month=2027-02`)).statusCode).toBe(
        200,
      );
    }
    for (const who of ['hk', 'mt', 'sal', 'ctv']) {
      expect((await api(who, 'GET', `/billing-periods?month=2026-12`)).statusCode).toBe(403);
      expect((await api(who, 'GET', `/reservations/${stay}/meter-readings`)).statusCode).toBe(403);
      expect((await api(who, 'GET', `/billing-periods/${dec.id}/print`)).statusCode).toBe(403);
      expect((await create(who, '2027-02')).statusCode).toBe(403);
      expect(
        (
          await api(who, 'POST', `/billing-periods/${dec.id}/payments`, {
            json: { method: 'cash', amountVnd: 1000 },
          })
        ).statusCode,
      ).toBe(403);
    }
  });

  it('OWN-only parameters: MGR 403, out of bounds 422, OWN schedules VAT 10 % from 01/01/2027', async () => {
    const put = (who: string, key: string, value: unknown, effectiveFrom = '2027-03-01') =>
      api(who, 'PUT', `/parameters/${key}`, {
        json: { value, effectiveFrom, reason: 'FB-INV-012 test' },
      });
    expect((await put('mgr', 'utility_vat_rate', { electricity: 10, water: 5 })).statusCode).toBe(
      403,
    );
    const vat = await put('own', 'utility_vat_rate', { electricity: 7, water: 5 });
    expect(vat.statusCode).toBe(422);
    const price = await put('own', 'utility_unit_price', {
      electricityVndPerKwh: 30_000,
      waterVndPerM3: 25_000,
    });
    expect(price.statusCode).toBe(422);
    expect(price.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', max: 20_000 });
    const rules = await put('own', 'monthly_statement_rules', {
      rentTiming: 'arrears',
      dueDay: 40,
      totalRoundingVnd: 1000,
      partialFirstMonthRent: 'at_checkin',
      readingWindow: { daysBeforeMonthEnd: 0, daysAfter: 1 },
    });
    expect(rules.statusCode).toBe(422);
    expect((await put('own', 'utility_vat_rate', { electricity: 10, water: 5 })).statusCode).toBe(
      200,
    );
  });

  it('RLS (criterion 10): statements and readings of another property → 404', async () => {
    const other = await seedStay(db, t, ids1, {
      status: 'in_house',
      stayType: 'long',
      arrival: '2026-11-01',
      departure: '2027-05-01',
      propertyIndex: 1,
    });
    const bp = uuidv7();
    await q(
      `INSERT INTO billing_period (id, organization_id, property_id, folio_id, reservation_id, statement_month, kind, created_at, updated_at)
       SELECT $1, organization_id, property_id, folio_id, id, '2026-12-01', 'regular', now(), now() FROM reservation WHERE id = $2`,
      [bp, other.reservationId],
      1,
    );
    expect((await api('own', 'GET', `/billing-periods/${bp}`)).statusCode).toBe(404);
    expect(
      (await api('own', 'GET', `/reservations/${other.reservationId}/meter-readings`)).statusCode,
    ).toBe(404);
    expect(
      (await api('own', 'GET', `/billing-periods?month=2026-12`))
        .json()
        .data.map((x: Json) => x.id),
    ).not.toContain(bp);
  });
});

describe.skipIf(!HAS_DB)('FB-INV-012 – rules other than the defaults (criterion 4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let stay: string;
  let room: string;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const q = async (sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query(sql, p))).rows;
  const api = (method: 'GET' | 'POST', path: string, json?: unknown) =>
    staff(fa, tok('own'), null, method, `${P(t)}${path}`, json === undefined ? {} : { json });
  const setParam = (key: string, value: unknown, from: string) =>
    setTenantParam(db, t, key, value, from);
  const now = async (iso: string) => {
    fa.clock.set(new Date(iso));
    await touchSessions(db, t, fa.clock.now());
  };
  const reading = (body: Json) =>
    api('POST', `/reservations/${stay}/meter-readings`, {
      roomId: room,
      photoWaived: true,
      note: 'Photo sent later',
      ...body,
    });

  beforeAll(async () => {
    db = appDatabase(4);
    t = await createTenant(db, { users: { own: ['owner'] } });
    const ids = await seedBooking(db, t);
    stay = (
      await seedStay(db, t, ids, {
        status: 'in_house',
        stayType: 'long',
        arrival: '2026-11-01',
        departure: '2027-05-01',
        roomNo: '203',
      })
    ).reservationId;
    room = ids.rooms['203'] as string;
    await q(
      `UPDATE reservation SET manual_long_stay = '{"monthly_rent_vnd": 9000000}'::jsonb WHERE id = $1`,
      [stay],
    );
    await setParam(
      'monthly_statement_rules',
      {
        rentTiming: 'arrears',
        dueDay: 10,
        totalRoundingVnd: 100,
        partialFirstMonthRent: 'at_checkin',
        readingWindow: { daysBeforeMonthEnd: 1, daysAfter: 2 },
      },
      '2026-10-01',
    );
    // Unit price by the last day of the utility period; VAT by the issue date (BR-LS-07/08).
    await setParam(
      'utility_unit_price',
      { electricityVndPerKwh: 3500, waterVndPerM3: 20_000 },
      '2026-12-01',
    );
    await setParam('utility_vat_rate', { electricity: 10, water: 5 }, '2027-01-01');
    fa = await startFeatureApp(db);
    await now('2026-11-01T14:00:00+07:00');
    expect(
      (
        await reading({
          kind: 'checkin',
          readOn: '2026-11-01',
          electricity: { value: 100 },
          water: { value: 10 },
        })
      ).statusCode,
    ).toBe(201);
    await now('2026-11-29T20:00:00+07:00'); // daysBeforeMonthEnd 1 → 29/11 accepted
    expect(
      (
        await reading({
          kind: 'period_end',
          periodMonth: '2026-11',
          readOn: '2026-11-29',
          electricity: { value: 200 },
          water: { value: 12 },
        })
      ).statusCode,
    ).toBe(201);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('arrears + dueDay 10: December bills November rent; unit price of 30/11 (4.000), VAT of today (8 %)', async () => {
    await now('2026-12-02T09:00:00+07:00');
    expect(
      (await api('POST', `/reservations/${stay}/billing-periods`, { month: '2026-11' })).statusCode,
    ).toBe(422);
    const r = await api('POST', `/reservations/${stay}/billing-periods`, { month: '2026-12' });
    expect(r.statusCode).toBe(201);
    const b = r.json() as Json;
    expect(b).toMatchObject({
      dueDate: '2026-12-10',
      rentPeriod: { from: '2026-11-01', to: '2026-11-30' },
    });
    expect((b.lines as Json[]).find((l) => l.kind === 'electricity')).toMatchObject({
      quantity: 100,
      unitPriceNetVnd: 4000,
      vatRatePct: 8,
      amountVnd: 432_000,
    });
    const i = await api('POST', `/billing-periods/${b.id}/issue`, { acknowledgeWarnings: true });
    expect(i.statusCode).toBe(428); // If-Match required
  });

  it('VAT 10 % once issued on/after 01/01/2027; unit price of 31/12 (3.500); code format unchanged', async () => {
    await now('2026-12-31T20:00:00+07:00');
    expect(
      (
        await reading({
          kind: 'period_start',
          periodMonth: '2026-12',
          readOn: '2026-11-30',
          electricity: { value: 200 },
          water: { value: 12 },
        })
      ).statusCode,
    ).toBe(201);
    expect(
      (
        await reading({
          kind: 'period_end',
          periodMonth: '2026-12',
          readOn: '2026-12-31',
          electricity: { value: 300 },
          water: { value: 13 },
        })
      ).statusCode,
    ).toBe(201);
    await now('2027-01-02T09:00:00+07:00');
    const r = await api('POST', `/reservations/${stay}/billing-periods`, { month: '2027-01' });
    expect(r.statusCode).toBe(201);
    const el = (r.json().lines as Json[]).find((l) => l.kind === 'electricity');
    expect(el).toMatchObject({
      quantity: 100,
      unitPriceNetVnd: 3500,
      vatRatePct: 10,
      netVnd: 350_000,
      vatVnd: 35_000,
      amountVnd: 385_000,
    });
    const v = (await (await api('GET', `/billing-periods/${r.json().id}`)).json())
      .version as number;
    const i = await staff(
      fa,
      tok('own'),
      null,
      'POST',
      `${P(t)}/billing-periods/${r.json().id}/issue`,
      { json: { acknowledgeWarnings: true }, ifMatch: v },
    );
    expect(i.statusCode).toBe(200);
    expect(i.json().code).toBe('TT-2701-203');
    expect(i.json().ratesSnapshot).toMatchObject({
      utilityVatRate: { electricity: 10, asOf: '2027-01-02' },
      utilityUnitPrice: { electricityVndPerKwh: 3500, asOf: '2026-12-31' },
    });
    // totalRoundingVnd 100: rounded down to the hundred.
    expect(i.json().totals.totalVnd % 100).toBe(0);
  });
});
