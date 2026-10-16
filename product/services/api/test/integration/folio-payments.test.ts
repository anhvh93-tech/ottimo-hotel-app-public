/**
 * Folio + payments (BE-B Sprint 2) end to end on Nest/Fastify + PostgreSQL with the real reservations module
 * (BE-A): quote → hold → confirmDeposit (B4, US-086 AC1/AC2/AC5, BR-305, US-085 AC4) → folio lines from the
 * snapshot, commission projected + stay_night allocation (BR-903, erd 8), createDepositNotice (A53),
 * getFolio (scope M, CTV totals only), requestFoc + approval hooks (US-007 AC1, BR-434, DATA FB-02),
 * listCommissions (US-087 AC2), K8 grants.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { type SalesIds, refreshSessions, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface Booking {
  id: string;
  code: string;
  folioId: string;
  quoteId: string;
  version: number;
  holdExpiresAt: string;
}

describe.skipIf(!HAS_DB)('folio + payments – deposits, folio view, FOC, commissions', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: SalesIds;
  let guestSal: string;
  let guestCtv: string;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        owner: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        sal2: ['sales_staff'],
        ctv: ['collaborator'],
        ctv2: ['collaborator'],
      },
    });
    ids = await seedSales(db, t);
    guestSal = await seedGuest(db, t, t.users.sal!.id);
    guestCtv = await seedGuest(db, t, t.users.ctv!.id);
    for (const u of ['owner', 'mgr', 'fdl', 'fd']) await setPassword(db, t, u);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  /**
   * Quote + hold of 7 nights from Monday `arrivalDate` (each week has one Fri + Sat night → 202 costs
   * 5.205.000 like BR-107-01); 3 adults by default (BR-305-02: +1.050.000 extra-person fee).
   */
  async function hold(
    who: 'sal' | 'ctv',
    arrivalDate: string,
    opts: { adults?: number; room?: '101' | '202' } = {},
  ): Promise<Booking> {
    const c = Client.of(fa, t, who);
    const q = await c.send('POST', `${P(t)}/quotes`, {
      type: 'short',
      roomId: ids.rooms[opts.room ?? '202'],
      arrivalDate,
      nights: 7,
      adults: opts.adults ?? 3,
      channelId: who === 'ctv' ? ids.channels.collaborator : ids.channels.zalo_phone,
      guestId: who === 'ctv' ? guestCtv : guestSal,
    });
    expect(q.statusCode, q.body).toBe(201);
    const h = await c.send('POST', `${P(t)}/quotes/${q.json().id}/actions/create-hold`, {
      holdHours: 24,
    });
    expect(h.statusCode, h.body).toBe(201);
    const r = h.json();
    return {
      id: r.id,
      code: r.code,
      folioId: r.folioId,
      quoteId: q.json().id,
      version: r.version,
      holdExpiresAt: r.hold.expiresAt,
    };
  }

  const confirm = (who: string, b: Booking, body: unknown, ifMatch: string | null = null) =>
    Client.of(fa, t, who).send(
      'POST',
      `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
      body,
      ifMatch === '' ? {} : { 'if-match': ifMatch ?? `"${b.version}"` },
    );
  const deposit = (amountVnd: number, extra: Record<string, unknown> = {}) => ({
    payment: { type: 'deposit', method: 'bank_transfer', amountVnd, ...extra },
  });
  const status = async (id: string) =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ status: string; version: number }>(
          'SELECT status, version FROM reservation WHERE id = $1',
          [id],
        ),
      )
    ).rows[0]!;
  const folio = async (who: string, id: string) =>
    (await Client.of(fa, t, who).get(`${P(t)}/folios/${id}`)).json();

  it('US-086 AC2 + AC1 + AC5: short deposit recorded, hold kept (200 – A-13); top-up confirms (BR-305 1.600.000)', async () => {
    const b = await hold('sal', '2026-11-09');
    expect((await confirm('sal', b, deposit(1_000_000), '')).statusCode).toBe(428);
    expect((await confirm('sal', b, deposit(1_000_000), '"77"')).json().code).toBe(
      'VERSION_CONFLICT',
    );

    // 0.3.5 A-13: money was written → 200, booking stays `hold`, depositPaidVnd tells what is missing.
    const short = await confirm('sal', b, deposit(1_000_000, { note: 'CK Vietcombank' }));
    expect(short.statusCode, short.body).toBe(200);
    expect(short.json()).toMatchObject({
      status: 'hold',
      depositRequiredVnd: 1_600_000,
      depositPaidVnd: 1_000_000,
    });
    expect((await status(b.id)).status).toBe('hold');
    b.version = short.json().version;

    const ok = await confirm('sal', b, deposit(600_000, { method: 'cash' }));
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().status).toBe('confirmed');
    expect(ok.headers.etag).toBe(`"${ok.json().version}"`);

    const { rows: pays } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{
        code: string;
        method: string;
        reconciliation: string;
        amount_vnd: number;
        recorded_by: string;
      }>(
        `SELECT code, method, reconciliation, amount_vnd, recorded_by FROM payment WHERE folio_id = $1 ORDER BY code`,
        [b.folioId],
      ),
    );
    expect(pays).toHaveLength(2);
    expect(pays[0]).toMatchObject({
      method: 'bank_transfer',
      reconciliation: 'pending',
      amount_vnd: 1_000_000,
    });
    // SEC-BE-22: a sale's receipt waits for the desk check whatever the method.
    expect(pays[1]).toMatchObject({
      method: 'cash',
      reconciliation: 'pending',
      amount_vnd: 600_000,
    });
    expect(pays[0]!.code).toMatch(/^PT-\d{6}$/);
    expect(pays[0]!.recorded_by).toBe(t.users.sal!.id);

    // Folio: 7 room lines from the snapshot (5.205.000) tied to their stay_night + 7 extra-person lines.
    const f = await folio('fd', b.folioId);
    const room = f.lines.filter((l: { category: string }) => l.category === 'room');
    expect(room).toHaveLength(7);
    expect(f.lines.filter((l: { category: string }) => l.category === 'extra_person')).toHaveLength(
      7,
    );
    expect(f.totals).toEqual({
      roomVnd: 5_205_000,
      otherVnd: 1_050_000,
      focVnd: 0,
      totalVnd: 6_255_000,
      paidVnd: 1_600_000,
      paidViaOtaVnd: 0,
      depositHeldVnd: 1_600_000,
      balanceDueVnd: 4_655_000, // BR-305-02 dueAtCheckinVnd
    });
    const { rows: nights } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ night_state: string; n: number }>(
        `SELECT n.night_state, count(*)::int AS n FROM stay_night n
           JOIN folio_line l ON l.stay_night_id = n.id AND l.category = 'room'
          WHERE n.reservation_id = $1 GROUP BY n.night_state`,
        [b.id],
      ),
    );
    expect(nights).toEqual([{ night_state: 'sold', n: 7 }]);

    // Money audit: receipts + postings with the booking code, actor = the sale (US-006, BR-008).
    const { rows: audit } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ action: string; category: string; actor_user_id: string }>(
        `SELECT action, category, actor_user_id FROM audit_event
          WHERE entity_code = $1 AND category = 'money' ORDER BY occurred_at, id`,
        [b.code],
      ),
    );
    expect(audit.filter((a) => a.action === 'payment.recorded')).toHaveLength(2);
    expect(audit.map((a) => a.action)).toEqual(
      expect.arrayContaining(['folio.charges_posted', 'reservation.deposit_confirmed']),
    );
    expect(audit.every((a) => a.actor_user_id === t.users.sal!.id)).toBe(true);

    // Lead of the quote → won (SM-09); sale commission projected 3 % (BR-903 staff).
    const leads = (await Client.of(fa, t, 'sal').get(`${P(t)}/leads`)).json();
    expect(leads.data.some((l: { status: string }) => l.status === 'won')).toBe(true);
    const com = (await Client.of(fa, t, 'sal').get(`${P(t)}/commissions`)).json();
    expect(com.data).toEqual([
      expect.objectContaining({
        reservationCode: b.code,
        payeeType: 'staff',
        ratePctSnapshot: 3,
        baseAmountVnd: 5_205_000,
        amountVnd: 156_150,
        status: 'projected',
      }),
    ]);
    expect(com.data[0]).not.toHaveProperty('payeeName');

    // B4 once only.
    const again = await confirm('sal', b, deposit(100_000), `"${ok.json().version}"`);
    expect(again.json().code).toBe('INVALID_TRANSITION');
  });

  it('scope and roles: CTV has no B4 (403), another SAL 404, FD may confirm any hold', async () => {
    const b = await hold('sal', '2026-11-16');
    expect((await confirm('ctv', b, deposit(1_600_000))).statusCode).toBe(403);
    expect((await confirm('sal2', b, deposit(1_600_000))).statusCode).toBe(404);
    const fd = await confirm('fd', b, deposit(1_600_000, { method: 'vietqr' }));
    expect(fd.statusCode, fd.body).toBe(200);
  });

  it('two confirmations of one hold at once: exactly one 200, the other refused (row lock + If-Match)', async () => {
    const b = await hold('sal', '2027-01-25');
    const res = await Promise.all([
      confirm('fd', b, deposit(1_600_000)),
      confirm('sal', b, deposit(1_600_000, { method: 'cash' })),
    ]);
    const codes = res.map((r) => r.statusCode).sort();
    expect(codes[0]).toBe(200);
    expect([409, 412]).toContain(codes[1]);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT count(*)::int AS n FROM payment WHERE folio_id = $1`, [b.folioId]),
    );
    expect(rows).toEqual([{ n: 1 }]); // the refused one rolled back its receipt
  });

  it('payment field rules (BA EP02 10.6): type, POS code, card number, attachment, exactly one source', async () => {
    const b = await hold('sal', '2026-11-23');
    const errs = async (body: unknown) => (await confirm('fd', b, body)).json();
    expect((await errs(deposit(1_600_000, { type: 'charge' }))).errors).toEqual([
      { field: 'payment.type', code: 'NOT_IN_LIST' },
    ]);
    expect((await errs(deposit(1_600_000, { method: 'card_pos' }))).errors).toEqual([
      { field: 'payment.posAuthCode', code: 'REQUIRED' },
    ]);
    expect((await errs(deposit(0))).errors).toEqual([
      { field: 'payment.amountVnd', code: 'AMOUNT_NOT_POSITIVE' },
    ]);
    expect((await errs(deposit(1_600_000, { note: 'the 4111 1111 1111 1111' }))).code).toBe(
      'CARD_NUMBER_DETECTED',
    );
    expect(
      (await errs(deposit(1_600_000, { attachmentId: '0192a1b0-0000-7000-8000-0000000af001' })))
        .errors,
    ).toEqual([{ field: 'payment.attachmentId', code: 'NOT_IN_LIST' }]);
    expect(
      (
        await errs({
          ...deposit(1_600_000),
          existingPaymentId: '0192a1b0-0000-7000-8000-0000000af001',
        })
      ).errors,
    ).toEqual([{ field: 'payment', code: 'REQUIRED' }]);
    expect(
      (await errs({ existingPaymentId: '0192a1b0-0000-7000-8000-0000000af001' })).errors,
    ).toEqual([{ field: 'existingPaymentId', code: 'NOT_IN_LIST' }]);
    const pos = await confirm(
      'fd',
      b,
      deposit(1_600_000, { method: 'card_pos', posAuthCode: 'A1B2C3' }),
    );
    expect(pos.statusCode, pos.body).toBe(200);
  });

  it('existingPaymentId: a succeeded deposit of the same folio counts', async () => {
    const b = await hold('sal', '2026-11-30');
    const first = await confirm('fd', b, deposit(1_600_000 - 1));
    expect(first.statusCode, first.body).toBe(200);
    expect(first.json().status).toBe('hold');
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ id: string }>(`SELECT id FROM payment WHERE folio_id = $1`, [b.folioId]),
    );
    // Nothing new written and still short → 422 with the amounts (safe to resend).
    const again = await confirm('fd', b, { existingPaymentId: rows[0]!.id });
    expect(again.statusCode).toBe(422);
    expect(again.json()).toMatchObject({
      code: 'DEPOSIT_INSUFFICIENT',
      depositRequiredVnd: 1_600_000,
      depositPaidVnd: 1_599_999,
      shortfallVnd: 1,
    });
    const top = await confirm('fd', b, deposit(1));
    expect(top.statusCode, top.body).toBe(200);
  });

  it('US-085 AC4: after the hold deadline only money received before it confirms; later money → 409 HOLD_EXPIRED', async () => {
    const b = await hold('sal', '2026-12-07');
    const deadline = new Date(b.holdExpiresAt);
    const after = new Date(deadline.getTime() + 60_000);
    await refreshSessions(db, t, after);
    fa.clock.set(after);
    try {
      const late = await confirm('fd', b, deposit(1_600_000));
      expect(late.json().code).toBe('HOLD_EXPIRED');
      const early = await confirm(
        'fd',
        b,
        deposit(1_600_000, { receivedAt: new Date(deadline.getTime() - 3_600_000).toISOString() }),
      );
      expect(early.statusCode, early.body).toBe(200);
    } finally {
      await refreshSessions(db, t, T0);
      fa.clock.set(T0);
    }
  });

  it('BR-903 + erd 8: CTV closer 8 % = 416.400 projected at B4 and allocated over the sold nights', async () => {
    const b = await hold('ctv', '2027-01-18', { adults: 2 });
    const ok = await confirm('fd', b, deposit(1_600_000));
    expect(ok.statusCode, ok.body).toBe(200);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ stay_date: string; agent: number; staff: number; revenue: number }>(
        `SELECT stay_date::text, agent_commission_vnd AS agent, staff_commission_vnd AS staff,
                room_revenue_vnd AS revenue
           FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold' ORDER BY stay_date`,
        [b.id],
      ),
    );
    expect(rows.map((r) => r.revenue)).toEqual([
      713_000, 713_000, 713_000, 713_000, 820_000, 820_000, 713_000,
    ]);
    expect(rows.reduce((a, r) => a + Number(r.agent), 0)).toBe(416_400);
    expect(rows.map((r) => Number(r.agent))).toEqual([
      57_040, 57_040, 57_040, 57_040, 65_600, 65_600, 57_040,
    ]);
    expect(rows.every((r) => Number(r.staff) === 0)).toBe(true);
    const ctv = (await Client.of(fa, t, 'ctv').get(`${P(t)}/commissions`)).json();
    expect(ctv.data).toHaveLength(1);
    expect(ctv.data[0]).toMatchObject({
      payeeType: 'agent',
      amountVnd: 416_400,
      reservationCode: b.code,
    });
    expect(ctv.totals).toEqual({ projectedVnd: 416_400, earnedVnd: 0, paidVnd: 0 });
    expect((await Client.of(fa, t, 'ctv2').get(`${P(t)}/commissions`)).json().data).toEqual([]);
    const own = (
      await Client.of(fa, t, 'owner').get(`${P(t)}/commissions?status=projected`)
    ).json();
    expect(
      own.data.find((c: { reservationCode: string }) => c.reservationCode === b.code),
    ).toMatchObject({ payeeName: 'ctv' });
    expect((await Client.of(fa, t, 'fd').get(`${P(t)}/commissions`)).statusCode).toBe(403);
  });

  it('getFolio scope (rbac note 4): CTV owner sees only room total + deposit held, others 404', async () => {
    const b = await hold('ctv', '2026-12-14', { adults: 2 });
    expect((await confirm('fd', b, deposit(1_600_000))).statusCode).toBe(200);
    const ctv = await Client.of(fa, t, 'ctv').get(`${P(t)}/folios/${b.folioId}`);
    expect(ctv.statusCode).toBe(200);
    const body = ctv.json();
    expect(body).not.toHaveProperty('lines');
    expect(body).not.toHaveProperty('payments');
    expect(body.totals).toEqual({ roomVnd: 5_205_000, depositHeldVnd: 1_600_000 });
    expect((await Client.of(fa, t, 'ctv2').get(`${P(t)}/folios/${b.folioId}`)).statusCode).toBe(
      404,
    );
    expect((await Client.of(fa, t, 'sal').get(`${P(t)}/folios/${b.folioId}`)).statusCode).toBe(404);
    expect(
      (await Client.of(fa, t, 'fd').get(`${P(t)}/folios/00000000-0000-7000-8000-000000000000`))
        .statusCode,
    ).toBe(404);
  });

  it('createDepositNotice (A53): CTV own hold → 202 + push to FD/FDL; FD 403; others 404; handled at B4', async () => {
    const b = await hold('ctv', '2026-11-09', { adults: 2, room: '101' });
    const url = `${P(t)}/reservations/${b.id}/deposit-notices`;
    const res = await Client.of(fa, t, 'ctv').send('POST', url, {
      amountVnd: 1_200_000,
      note: 'Khách CK lúc 10h',
    });
    expect(res.statusCode, res.body).toBe(202);
    expect((await Client.of(fa, t, 'fd').send('POST', url, { amountVnd: 1 })).statusCode).toBe(403);
    expect((await Client.of(fa, t, 'ctv2').send('POST', url, { amountVnd: 1 })).statusCode).toBe(
      404,
    );
    expect(
      (
        await Client.of(fa, t, 'ctv').send('POST', url, {
          amountVnd: 1,
          attachmentId: '0192a1b0-0000-7000-8000-0000000af001',
        })
      ).json().errors,
    ).toEqual([{ field: 'attachmentId', code: 'NOT_IN_LIST' }]);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ payload: { kind: string; userIds: string[]; refCode: string } }>(
        `SELECT payload FROM outbox_message WHERE topic = 'staff.push' AND payload->>'kind' = 'deposit_notice'
            AND payload->>'refId' = $1`,
        [b.id],
      ),
    );
    expect(rows).toHaveLength(1);
    expect(new Set(rows[0]!.payload.userIds)).toEqual(new Set([t.users.fd!.id, t.users.fdl!.id]));
    expect(JSON.stringify(rows[0]!.payload)).not.toContain('1200000'); // no amount in a push (C2)
    const required = (await folio('fd', b.folioId)).totals; // still a hold – nothing posted yet
    expect(required.totalVnd).toBe(0);
    const ok = await confirm('fd', b, deposit(1_300_000)); // 101: 4.380.000 × 30 % → 1.300.000
    expect(ok.statusCode, ok.body).toBe(200);
    const { rows: n } = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT status FROM deposit_notice WHERE reservation_id = $1`, [b.id]),
    );
    expect(n).toEqual([{ status: 'handled' }]);
  });

  it('requestFoc (US-007 AC1, BR-434): pending → FDL approves → posted; reject → rejected; room FOC lowers stay_night (DATA FB-02)', async () => {
    const b = await hold('sal', '2027-01-11');
    expect((await confirm('fd', b, deposit(1_600_000))).statusCode).toBe(200);
    const f0 = await folio('fd', b.folioId);
    const extras = f0.lines.filter((l: { category: string }) => l.category === 'extra_person');
    const roomLine = f0.lines.find((l: { category: string }) => l.category === 'room');
    const foc = (who: string, lineId: string, body: Record<string, unknown>) =>
      Client.of(fa, t, who).send('POST', `${P(t)}/folios/${b.folioId}/lines/${lineId}/foc`, body);

    const req1 = await foc('fd', extras[0].id, {
      kind: 'foc',
      amountVnd: 150_000,
      reasonCode: 'service_recovery',
    });
    expect(req1.statusCode, req1.body).toBe(201);
    expect(req1.json()).toMatchObject({ status: 'pending', type: 'foc', amountVnd: 150_000 });
    let f = await folio('fd', b.folioId);
    expect(f.pendingApprovals).toBe(1);
    expect(f.totals.focVnd).toBe(0); // pending FOC does not reduce the balance (SM-10 A1)

    const approve = await Client.of(fa, t, 'fdl').send(
      'POST',
      `${P(t)}/approval-requests/${req1.json().id}/actions/approve`,
      { authMethod: 'password', secret: TEST_PASSWORD },
    );
    expect(approve.statusCode, approve.body).toBe(200);
    f = await folio('fd', b.folioId);
    const focLine = f.lines.find((l: { category: string }) => l.category === 'foc');
    expect(focLine).toMatchObject({
      amountVnd: -150_000,
      lineState: 'posted',
      relatedLineId: extras[0].id,
    });
    expect(f.totals.focVnd).toBe(150_000);
    expect(f.totals.balanceDueVnd).toBe(4_655_000 - 150_000);

    const over = await foc('fd', extras[0].id, {
      kind: 'foc',
      amountVnd: 1,
      reasonCode: 'service_recovery',
    });
    expect(over.json().errors).toEqual([{ field: 'amountVnd', code: 'VALUE_OUT_OF_RANGE' }]);
    const sd = await foc('fd', extras[1].id, {
      kind: 'special_discount',
      amountVnd: 1000,
      reasonCode: 'regular_vip',
    });
    expect(sd.json().errors).toEqual([{ field: 'kind', code: 'NOT_IN_LIST' }]);
    expect(
      (await foc('fd', focLine.id, { kind: 'foc', amountVnd: 1, reasonCode: 'regular_vip' })).json()
        .code,
    ).toBe('INVALID_TRANSITION');

    // Rejected → the line is rejected and the charge stays payable (A5).
    const req2 = await foc('fd', extras[1].id, {
      kind: 'foc',
      amountVnd: 50_000,
      reasonCode: 'regular_vip',
    });
    const rej = await Client.of(fa, t, 'fdl').send(
      'POST',
      `${P(t)}/approval-requests/${req2.json().id}/actions/reject`,
      { authMethod: 'password', secret: TEST_PASSWORD, reason: 'Không đủ điều kiện' },
    );
    expect(rej.statusCode, rej.body).toBe(200);
    f = await folio('fd', b.folioId);
    expect(
      f.lines.find((l: { approvalRequestId?: string }) => l.approvalRequestId === req2.json().id)
        .lineState,
    ).toBe('rejected');
    expect(f.totals.focVnd).toBe(150_000);

    // Owner within own limit → self-applied (A2) on the ROOM night: stay_night discount + complimentary.
    const own = await foc('owner', roomLine.id, {
      kind: 'special_discount',
      amountVnd: roomLine.amountVnd,
      reasonCode: 'regular_vip',
    });
    expect(own.json().status).toBe('approved');
    const { rows: night } = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT n.room_revenue_gross_vnd AS gross, n.discount_vnd AS discount, n.room_revenue_vnd AS revenue,
                n.is_complimentary AS comp
           FROM stay_night n JOIN folio_line l ON l.stay_night_id = n.id WHERE l.id = $1`,
        [roomLine.id],
      ),
    );
    expect(night).toEqual([
      { gross: roomLine.amountVnd, discount: roomLine.amountVnd, revenue: 0, comp: true },
    ]);
    // SAL/CTV have no A35.
    expect(
      (await foc('sal', roomLine.id, { kind: 'foc', amountVnd: 1, reasonCode: 'regular_vip' }))
        .statusCode,
    ).toBe(403);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ action: string }>(
        `SELECT action FROM audit_event WHERE category = 'money' AND entity_code = $1 AND action LIKE 'folio.foc_%'`,
        [b.code],
      ),
    );
    expect(rows.map((r) => r.action)).toEqual(
      expect.arrayContaining(['folio.foc_requested', 'folio.foc_posted', 'folio.foc_rejected']),
    );
  });

  it('SEC-BE-22: sale receipts stay pending + desk push; backdating > 24 h refused; amount capped; FD unchanged', async () => {
    const b = await hold('sal', '2027-02-01');
    const back3d = new Date(T0.getTime() - 3 * 86_400_000).toISOString();
    expect(
      (await confirm('sal', b, deposit(1_600_000, { method: 'cash', receivedAt: back3d }))).json()
        .errors,
    ).toEqual([{ field: 'payment.receivedAt', code: 'DATE_INVALID' }]);
    const tooHigh = await confirm('sal', b, deposit(160_000_000, { method: 'cash' }));
    expect(tooHigh.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'payment.amountVnd', code: 'AMOUNT_TOO_HIGH' }],
    });
    const ok = await confirm(
      'sal',
      b,
      deposit(tooHigh.json().max > 0 ? 2_000_000 : 0, { method: 'cash' }),
    );
    expect(ok.statusCode, ok.body).toBe(200);
    // The cap is the stay total (room + extra-person fee of the quote; this week has Tết nights – BR-104).
    expect(tooHigh.json().max).toBe((await folio('fd', b.folioId)).totals.totalVnd);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT p.reconciliation, a.after->>'recordedByRole' AS role
           FROM payment p JOIN audit_event a ON a.entity_id = p.id::text AND a.action = 'payment.recorded'
          WHERE p.folio_id = $1`,
        [b.folioId],
      ),
    );
    expect(rows).toEqual([{ reconciliation: 'pending', role: 'sales_staff' }]);
    const { rows: push } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ ids: string[] }>(
        `SELECT payload->'userIds' AS ids FROM outbox_message
          WHERE payload->>'kind' = 'deposit_unverified' AND payload->>'refId' = $1`,
        [b.id],
      ),
    );
    expect(new Set(push[0]!.ids)).toEqual(
      new Set([t.users.fd!.id, t.users.fdl!.id, t.users.mgr!.id]),
    );
    // FD: cash is not_required as before; FD may exceed the cap with a reason in the note.
    const c = await hold('sal', '2027-02-08');
    const fd = await confirm(
      'fd',
      c,
      deposit(7_000_000, { method: 'cash', note: 'Khách trả trước toàn bộ' }),
    );
    expect(fd.statusCode, fd.body).toBe(200);
    const { rows: fdPay } = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT reconciliation FROM payment WHERE folio_id = $1`, [c.folioId]),
    );
    expect(fdPay).toEqual([{ reconciliation: 'not_required' }]);
  });

  it('SEC-BE-22 (2): an overdue hold is never rescued by a sale; FD gets HOLD_EXPIRED + expiredAt for late money', async () => {
    const b = await hold('sal', '2027-02-15');
    const deadline = new Date(b.holdExpiresAt);
    const after = new Date(deadline.getTime() + 60_000);
    await refreshSessions(db, t, after);
    fa.clock.set(after);
    try {
      const early = new Date(deadline.getTime() - 3_600_000).toISOString();
      const sal = await confirm('sal', b, deposit(1_600_000, { receivedAt: early }));
      expect(sal.statusCode).toBe(409);
      expect(sal.json()).toMatchObject({ code: 'HOLD_EXPIRED' });
      expect(new Date(sal.json().expiredAt).getTime()).toBe(deadline.getTime());
    } finally {
      await refreshSessions(db, t, T0);
      fa.clock.set(T0);
    }
  });

  it('SEC-BE-21: dryRun is refused (422) on money endpoints that do not compute – nothing written', async () => {
    const b = await hold('sal', '2027-02-22');
    const noKey = (url: string, body: unknown) =>
      fa.app.inject({
        method: 'POST',
        url,
        headers: Client.of(fa, t, 'ctv').headers({}, true),
        payload: body as object,
      });
    const res = await Client.of(fa, t, 'sal').send(
      'POST',
      `${P(t)}/reservations/${b.id}/actions/confirm-deposit`,
      { ...deposit(1_600_000), dryRun: true },
      { 'if-match': `"${b.version}"` },
    );
    expect(res.json().errors).toEqual([{ field: 'dryRun', code: 'NOT_ALLOWED' }]);
    const ctvHold = await hold('ctv', '2027-03-01', { adults: 2 });
    const n = await noKey(`${P(t)}/reservations/${ctvHold.id}/deposit-notices`, {
      amountVnd: 1,
      dryRun: true,
    });
    expect(n.statusCode).toBe(422);
    expect(n.json().errors).toEqual([{ field: 'dryRun', code: 'NOT_ALLOWED' }]);
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT count(*)::int AS n FROM deposit_notice WHERE reservation_id = $1`, [
        ctvHold.id,
      ]),
    );
    expect(rows).toEqual([{ n: 0 }]);
  });

  it('DOM-BE-01: cancelling a confirmed booking reverses room + extra-person lines and books the retained deposit (BR-309 < 3 days → 100 % kept)', async () => {
    const b = await hold('sal', '2026-10-16', { adults: 3 });
    // 16/10 (Fri) – one 7-night stay starting tomorrow: deposit fully kept when cancelled today (< 3 days).
    const ok = await confirm('fd', b, deposit(2_000_000));
    expect(ok.statusCode, ok.body).toBe(200);
    const before = await folio('fd', b.folioId);
    expect(before.totals.totalVnd).toBeGreaterThan(0);
    const cancel = await Client.of(fa, t, 'fd').send(
      'POST',
      `${P(t)}/reservations/${b.id}/actions/cancel`,
      { reasonCode: 'price', dryRun: false },
      { 'if-match': `"${ok.json().version}"` },
    );
    expect(cancel.statusCode, cancel.body).toBe(200);
    const after = await folio('fd', b.folioId);
    const reversals = after.lines.filter((l: { reversalOfId?: string }) => l.reversalOfId);
    expect(reversals).toHaveLength(14); // 7 room + 7 extra-person
    const fee = after.lines.filter((l: { category: string }) => l.category === 'cancellation_fee');
    expect(fee).toHaveLength(1);
    expect(after.totals).toMatchObject({
      roomVnd: 0,
      otherVnd: fee[0].amountVnd,
      paidVnd: 2_000_000,
      balanceDueVnd: fee[0].amountVnd - 2_000_000,
    });
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT status FROM commission WHERE reservation_id = $1`, [b.id]),
    );
    expect(rows.every((r) => r.status === 'void')).toBe(true);
    const { rows: audit } = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT 1 FROM audit_event WHERE entity_code = $1 AND action = 'folio.stay_reversed'`,
        [b.code],
      ),
    );
    expect(audit).toHaveLength(1);
  });

  it('DOM-BE-02: fewer guests → extra-person lines reversed by the resync, balance follows', async () => {
    const b = await hold('sal', '2027-03-08');
    const ok = await confirm('fd', b, deposit(1_600_000));
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await folio('fd', b.folioId)).totals.otherVnd).toBe(1_050_000);
    const patch = await Client.of(fa, t, 'fd').send(
      'PATCH',
      `${P(t)}/reservations/${b.id}`,
      { adults: 2 },
      { 'if-match': `"${ok.json().version}"` },
    );
    expect(patch.statusCode, patch.body).toBe(200);
    const f = await folio('fd', b.folioId);
    expect(f.totals).toMatchObject({
      roomVnd: 5_205_000,
      otherVnd: 0,
      balanceDueVnd: 5_205_000 - 1_600_000,
    });
  });

  it('DOM-BE-03 (D-8) + BE-02: 5 → 7 nights re-tiers BR-107 on every night; folio follows (4.079.000 → 5.205.000)', async () => {
    const c = Client.of(fa, t, 'sal');
    const q = await c.send('POST', `${P(t)}/quotes`, {
      type: 'short',
      roomId: ids.rooms['202'],
      arrivalDate: '2027-03-15',
      nights: 5,
      adults: 2,
      channelId: ids.channels.zalo_phone,
      guestId: guestSal,
    });
    expect(q.json().roomTotalVnd).toBe(4_079_000); // 4 × 792.000 + Fri 911.000
    const h = (
      await c.send('POST', `${P(t)}/quotes/${q.json().id}/actions/create-hold`, { holdHours: 24 })
    ).json();
    const ok = await Client.of(fa, t, 'fd').send(
      'POST',
      `${P(t)}/reservations/${h.id}/actions/confirm-deposit`,
      deposit(1_300_000),
      { 'if-match': `"${h.version}"` },
    );
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await folio('fd', h.folioId)).totals.roomVnd).toBe(4_079_000);
    const move = await Client.of(fa, t, 'fd').send(
      'POST',
      `${P(t)}/reservations/${h.id}/actions/move`,
      {
        arrivalDate: '2027-03-15',
        departureDate: '2027-03-22',
        reasonCode: 'guest_request',
        mode: 'change',
      },
      { 'if-match': `"${ok.json().version}"` },
    );
    expect(move.statusCode, move.body).toBe(200);
    const f = await folio('fd', h.folioId);
    expect(f.totals.roomVnd).toBe(5_205_000);
    expect(
      f.lines.filter(
        (l: { category: string; reversalOfId?: string }) => l.category === 'room' && l.reversalOfId,
      ),
    ).toHaveLength(5);
  });

  it('K8: folio_line and payment amounts are append-only for ottimo_app (column grants only on state)', async () => {
    const { rows } = await db.pool.query<{
      t: string;
      u: boolean;
      d: boolean;
      i: boolean;
      amount: boolean;
    }>(
      `SELECT t, has_table_privilege('ottimo_app', t, 'UPDATE') AS u,
              has_table_privilege('ottimo_app', t, 'DELETE') AS d,
              has_table_privilege('ottimo_app', t, 'INSERT') AS i,
              has_column_privilege('ottimo_app', t, 'amount_vnd', 'UPDATE') AS amount
         FROM unnest(ARRAY['folio_line', 'payment']) AS t`,
    );
    for (const r of rows) expect(r).toEqual({ t: r.t, u: false, d: false, i: true, amount: false });
  });
});
