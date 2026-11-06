/**
 * V5-30 – commission without a rate in code (FB-R4-SEC-BE-01, SEC G3; contract 0.3.13 1.10, 1.24; DOM rules-v1.0.5
 * 4.1, 7.3) on Nest/Fastify + PostgreSQL, for a property where OWN has not typed the commission table yet
 * (a new bootstrap / a new seed – the code holds no default rate):
 * - T30-1 / T30-5: calculateQuote with a sale or CTV closer → 200, `commission.status = rate_missing`, no rate,
 *   no amount (not 0); the quote is saved and the booking confirmed without any `commission` row (no 500);
 * - `not_applicable` without a payee; FD/FDL still get no commission object (SR-AZ-04);
 * - T30-3: `listParameters.missing[]` – OWN and MGR (same role filter as `data`), FDL has no property;
 * - T30-2: OWN types a test rate → `computed`; the next commission sync of the booking creates the row (DOM 7.3).
 * SEC G3: the only rate here is the test value `test_rate_short`. FAKE data only (`@example.test`).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { applyPct } from '../../src/modules/reservations/public/pricing';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type SalesIds, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

/** Test-only rate (SEC G3) – an odd value unrelated to any real table. */
const test_rate_short = 1.37;
const KEY = 'short_stay_commission_pct';

describe.skipIf(!HAS_DB)('V5-30 – commission status, missing[] (contract 0.3.13 1.10)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: SalesIds;
  let guestSal: string;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        owner: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        ctv: ['collaborator'],
      },
    });
    ids = await seedSales(db, t, 0, { skipParams: [KEY] });
    guestSal = await seedGuest(db, t, t.users.sal!.id);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const calc = (who: string, body: Record<string, unknown> = {}) =>
    Client.of(fa, t, who).send('POST', `${P(t)}/quotes/calculate`, {
      type: 'short',
      roomId: ids.rooms['202'],
      arrivalDate: '2026-11-09',
      nights: 7,
      adults: 3,
      channelId: ids.channels.direct,
      ...body,
    });
  const commissionRows = async (reservationId: string) =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{
          status: string;
          payee_type: string;
          rate: string;
          base: number;
          amount: number;
        }>(
          `SELECT status, payee_type, rate_pct_snapshot::text AS rate, base_amount_vnd AS base,
                  amount_vnd AS amount
             FROM commission WHERE reservation_id = $1 ORDER BY created_at`,
          [reservationId],
        ),
      )
    ).rows;
  const listParams = (who: string) => Client.of(fa, t, who).get(`${P(t)}/parameters`);

  let bookingId = '';
  let roomTotalVnd = 0;

  it('T30-1 / T30-5: SAL and CTV closers → 200, rate_missing without rate or amount; remainder = total', async () => {
    const sal = await calc('sal');
    expect(sal.statusCode, sal.body).toBe(200);
    const q = sal.json();
    expect(q.commission).toEqual({ status: 'rate_missing', ruleRef: 'BR-903' });
    expect(q.commission).not.toHaveProperty('ratePct');
    expect(q.commission).not.toHaveProperty('amountVnd');
    expect(q.ottimoRemainingVnd).toBe(q.totalVnd);
    roomTotalVnd = q.roomTotalVnd;

    const ctv = await calc('ctv', { channelId: ids.channels.collaborator });
    expect(ctv.statusCode, ctv.body).toBe(200);
    expect(ctv.json().commission).toEqual({ status: 'rate_missing', ruleRef: 'BR-903' });
    expect(ctv.json()).not.toHaveProperty('ottimoRemainingVnd'); // CTV never sees the remainder
  });

  it('no payee → not_applicable (OWN/MGR); FD/FDL get no commission object (SR-AZ-04)', async () => {
    for (const who of ['owner', 'mgr']) {
      const r = await calc(who);
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json().commission).toEqual({ status: 'not_applicable', ruleRef: 'BR-903' });
    }
    // A manager quoting for a sale closer: the sale's payee → rate_missing.
    const forSal = await calc('mgr', { closerUserId: t.users.sal!.id });
    expect(forSal.json().commission.status).toBe('rate_missing');
    for (const who of ['fd', 'fdl']) {
      const r = await calc(who, { closerUserId: t.users.sal!.id });
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json()).not.toHaveProperty('commission');
    }
  });

  it('rate_missing: the quote is saved, the booking confirmed – no commission row, no 500 (DOM 7.3)', async () => {
    const c = Client.of(fa, t, 'sal');
    const q = await c.send('POST', `${P(t)}/quotes`, {
      type: 'short',
      roomId: ids.rooms['202'],
      arrivalDate: '2026-11-09',
      nights: 7,
      adults: 3,
      channelId: ids.channels.direct,
      guestId: guestSal,
    });
    expect(q.statusCode, q.body).toBe(201);
    const saved = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ commission_vnd: number | null; ottimo: number; total: number }>(
        `SELECT commission_vnd, ottimo_remaining_vnd AS ottimo, total_vnd AS total FROM quote WHERE id = $1`,
        [q.json().id],
      ),
    );
    expect(saved.rows[0]).toMatchObject({ commission_vnd: null });
    const h = await c.send('POST', `${P(t)}/quotes/${q.json().id}/actions/create-hold`, {
      holdHours: 24,
    });
    expect(h.statusCode, h.body).toBe(201);
    bookingId = h.json().id;
    const ok = await c.send(
      'POST',
      `${P(t)}/reservations/${bookingId}/actions/confirm-deposit`,
      { payment: { type: 'deposit', method: 'bank_transfer', amountVnd: 1_600_000 } },
      { 'if-match': `"${h.json().version}"` },
    );
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().status).toBe('confirmed');
    expect(await commissionRows(bookingId)).toEqual([]);
    const list = await Client.of(fa, t, 'sal').get(`${P(t)}/commissions`);
    expect(list.statusCode, list.body).toBe(200);
    expect(list.json().data).toEqual([]);
  });

  it('T30-3: listParameters.missing[] names the key for OWN and MGR (same filter as data); FDL has no property', async () => {
    const own = await listParams('owner');
    expect(own.statusCode, own.body).toBe(200);
    expect(own.json().missing).toEqual(expect.arrayContaining([KEY, 'payment_receiving_account']));
    expect(own.json().data.map((p: { key: string }) => p.key)).not.toContain(KEY);
    // Names only, sorted, never a key that has a value.
    const missing: string[] = own.json().missing;
    expect([...missing].sort()).toEqual(missing);
    const valued = new Set(own.json().data.map((p: { key: string }) => p.key));
    expect(missing.filter((k) => valued.has(k))).toEqual([]);

    const mgr = (await listParams('mgr')).json();
    expect(mgr.missing).toContain(KEY);
    // SEC Q51-1: MGR never sees the owner-only key – neither its value nor its name.
    expect(mgr.missing).not.toContain('payment_receiving_account');

    const fdl = await listParams('fdl');
    expect(fdl.statusCode, fdl.body).toBe(200);
    expect(fdl.json()).not.toHaveProperty('missing');
    expect((await listParams('fd')).statusCode).toBe(403);
  });

  it('T30-2: OWN types a test rate → computed; missing[] drops the key; the next sync creates the commission row', async () => {
    await setParam(db, t, KEY, { staff: test_rate_short, collaborator: test_rate_short });

    const q = (await calc('sal')).json();
    expect(q.commission).toEqual({
      status: 'computed',
      ratePct: test_rate_short,
      baseVnd: roomTotalVnd,
      amountVnd: applyPct(roomTotalVnd, test_rate_short, 1),
      ruleRef: 'BR-903',
    });
    expect(q.ottimoRemainingVnd).toBe(q.totalVnd - q.commission.amountVnd);
    expect((await listParams('owner')).json().missing).not.toContain(KEY);

    // DOM 7.3: the booking confirmed while the rate was missing gets its row at the next sync (people change →
    // resync), at the rate in force on that day (no snapshot was taken).
    expect(await commissionRows(bookingId)).toEqual([]);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ version: number }>('SELECT version FROM reservation WHERE id = $1', [bookingId]),
    );
    const patch = await Client.of(fa, t, 'fd').send(
      'PATCH',
      `${P(t)}/reservations/${bookingId}`,
      { adults: 2 },
      { 'if-match': `"${rows[0]!.version}"` },
    );
    expect(patch.statusCode, patch.body).toBe(200);
    const after = await commissionRows(bookingId);
    expect(after).toEqual([
      {
        status: 'projected',
        payee_type: 'staff',
        rate: String(test_rate_short),
        base: roomTotalVnd,
        amount: applyPct(roomTotalVnd, test_rate_short, 1),
      },
    ]);
  });
});
