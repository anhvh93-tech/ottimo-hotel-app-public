/**
 * BUG-R3-037 (P1, OPS `j15-folio-close-check.md`): J15 `folio.close` run by the WORKER's JobRunner – the registry
 * and composition worker.ts ticks (src/worker-jobs.ts → folio/public/worker-jobs.ts), NOT the api's registry that
 * every other J15 test reaches through test-support. Money steps go through the real api (HTTP, fixture.ts); only
 * J15 runs in the worker composition, so every effect below comes from the worker's own hooks:
 * - front desk debt ports (`debtOnCheckout` / `openDebt`): ONE debt `post_checkout_unpaid`, OWN + MGR told;
 * - events: "Cần chú ý" `closed_reservation_credit` opened for a credit not routed (BUG-R3-002) and resolved when
 *   the folio closes (BUG-R3-034);
 * - approvals: refund requests above the credit left re-planned (BUG-R3-012/013 – refund routing of the folio,
 *   `refund` preLock + decision hook of payments).
 * `runOnce` on the test's own property (= one property of the worker's `runDue` tick) – other test files share the
 * database. Fake clock, FAKE data only.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobRunner } from '../../../src/jobs/job-runner';
import { buildWorkerJobs } from '../../../src/worker-jobs';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, type Stay, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)('BUG-R3-037 – J15 folio.close through the worker JobRunner', () => {
  let x: Fx;
  let worker: JobRunner;
  beforeAll(async () => {
    x = await startFixture();
    // The worker process composition, on the fixture's database and fake clock.
    const { registry, parameters } = buildWorkerJobs({
      clock: x.fa.clock,
      database: x.db,
      env: { APP_ENV: 'test', BLOBSTORE_PROVIDER: 'memory' },
    });
    worker = new JobRunner(x.db, x.fa.clock, registry, parameters);
  });
  afterAll(async () => {
    await x?.close();
  });

  const runWorkerJ15 = async () => {
    const p = (await worker.listProperties()).find((r) => r.propertyId === x.t.propertyIds[0])!;
    const out = await worker.runOnce('folio.close', p);
    expect(out.stats.failed, JSON.stringify(out.stats)).toBe(0);
    return out.stats as { closed: number; closedWithDebt: number; waitingRefund: number };
  };
  const refunds = (s: { id: string }) =>
    x.q(
      `SELECT id, amount_vnd::int AS amount, status, requested_by, required_role, refund_source,
              auto_cancel_reason
         FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
      [s.id],
    );
  const creditItems = async (s: { id: string }) =>
    (
      await x.q(
        `SELECT count(*)::int AS n FROM attention_event
          WHERE kind = 'closed_reservation_credit' AND ref_id = $1 AND resolved_at IS NULL`,
        [s.id],
      )
    )[0].n as number;
  /** A posted line written straight in the table (no API, no hook) – what J15 alone must cope with. */
  const rawLine = async (s: Stay, amountVnd: number) => {
    const [src] = await x.q(
      `SELECT id FROM folio_line WHERE folio_id = $1 AND category = 'room' ORDER BY posted_at LIMIT 1`,
      [s.folioId],
    );
    await x.q(
      `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category, revenue_group,
         description, quantity, unit_price_vnd, amount_vnd, service_date, line_state, source, posted_at, created_at,
         post_checkout)
       SELECT $2, organization_id, property_id, folio_id, reservation_id, 'fnb', 'other', 'Phát sinh ghi thẳng', 1,
              $3, $3, service_date, 'posted', 'manual', $4, $4, true
         FROM folio_line WHERE id = $1`,
      [src.id, uuidv7(), amountVnd, new Date(`${s.departure}T16:00:00+07:00`)],
    );
  };
  /** A void of the paid F&B line (A32 by the MGR) → the A32 refund request of that amount (pending). */
  const pendingA32Refund = async (big: number) => {
    const s = await x.checkedOutStay({ big });
    expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
    const [r] = await refunds(s);
    expect(r).toMatchObject({ amount: big, status: 'pending', refund_source: 'a32' });
    return { s, r };
  };

  it('DOM example: 70.000 found after check-out and not paid → before the window nothing; after it ONE debt (front desk port), OWN + MGR told, folio closed; a paid folio closes without debt; a second run does nothing', async () => {
    const s = await x.checkedOutStay();
    const paid = await x.checkedOutStay();
    await x.at(`${s.departure}T15:00:00+07:00`);
    await x.lateCharge(s, 70_000, s.departure);
    await x.at(`${addDays(s.departure, 1)}T10:59:00+07:00`);
    await runWorkerJ15();
    expect((await x.folio(s.folioId)).status).toBe('settled');
    await x.at(`${addDays(s.departure, 1)}T11:01:00+07:00`);
    const stats = await runWorkerJ15();
    expect(stats.closedWithDebt).toBeGreaterThanOrEqual(1);
    expect(await x.folio(s.folioId)).toMatchObject({ status: 'closed', billNo: s.billNo });
    expect((await x.folio(paid.folioId)).status).toBe('closed');
    expect(await x.openDebtOf(s)).toMatchObject({
      reservationId: s.id,
      balanceDueVnd: 70_000,
      openDebtVnd: 70_000,
      dueDate: addDays(addDays(s.departure, 1), 3),
    });
    expect(await x.openDebtOf(paid)).toBeNull();
    const [r] = await x.q(
      `SELECT checkout_mode, debt_reason, debt_recorded_vnd::int AS recorded FROM reservation WHERE id = $1`,
      [s.id],
    );
    expect(r).toEqual({
      checkout_mode: 'debt',
      debt_reason: 'post_checkout_unpaid',
      recorded: 70_000,
    });
    const told = await x.q(
      `SELECT user_id FROM staff_notification WHERE kind = 'debt_recorded' AND ref_id = $1`,
      [s.id],
    );
    expect(told.map((u) => u.user_id).sort()).toEqual(
      [x.t.users.owner!.id, x.t.users.mgr!.id, x.t.users.mgr2!.id].sort(),
    );
    const audits = await x.q(
      `SELECT action, after FROM audit_event
        WHERE (action = 'folio.closed' AND entity_id = $1)
           OR (action = 'reservation.debt_on_checkout' AND entity_id = $2)
        ORDER BY action`,
      [s.folioId, s.id],
    );
    expect(audits).toMatchObject([
      { action: 'folio.closed', after: { status: 'closed', balanceDueVnd: 70_000 } },
      { action: 'reservation.debt_on_checkout', after: { debtVnd: 70_000, openDebtVnd: 70_000 } },
    ]);
    // Idempotent: nothing more to close, no second debt.
    expect((await runWorkerJ15()).closedWithDebt).toBe(0);
    expect(
      await x.q(`SELECT 1 FROM staff_notification WHERE kind = 'debt_recorded' AND ref_id = $1`, [
        s.id,
      ]),
    ).toHaveLength(told.length);
  }, 180_000);

  it('BUG-R3-002 / BUG-R3-034: a credit not routed to a refund → the worker J15 waits and opens "Cần chú ý" closed_reservation_credit; once the credit is gone, the next run closes the folio and resolves the item', async () => {
    const s = await x.checkedOutStay();
    const p = await x.pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: 50_000,
      note: 'Khách đưa thừa',
    });
    expect(p.statusCode, p.body).toBe(201);
    const [req] = await refunds(s);
    expect(req).toMatchObject({ amount: 50_000, requested_by: x.t.users.fd!.id });
    expect((await x.cancelReq(req.id, 'fd')()).statusCode).toBe(200);
    await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
    expect((await runWorkerJ15()).waitingRefund).toBeGreaterThanOrEqual(1);
    expect((await x.folio(s.folioId)).status).toBe('settled');
    expect(await creditItems(s)).toBe(1);
    // The credit goes (a charge written straight in the table – no api hook resolves the item) → only J15 does.
    await rawLine(s, 50_000);
    expect((await x.folio(s.folioId)).totals.creditVnd).toBe(0);
    const stats = await runWorkerJ15();
    expect(stats.closed).toBeGreaterThanOrEqual(1);
    expect((await x.folio(s.folioId)).status).toBe('closed');
    expect(await creditItems(s)).toBe(0);
  }, 180_000);

  it('BUG-R3-012 (J15 alone): an approved A32 refund left with no credit → the worker J15 closes the request (refund decision hook), records the 200.000 debt, closes the folio, resolves the item', async () => {
    const { s, r } = await pendingA32Refund(300_000);
    const [{ version }] = await x.q('SELECT version FROM approval_request WHERE id = $1', [r.id]);
    const ok = await x.c.owner!.send('POST', x.url(`/approval-requests/${r.id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      expectedVersion: Number(version),
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(await creditItems(s)).toBe(1);
    await rawLine(s, 500_000);
    await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
    expect((await runWorkerJ15()).waitingRefund).toBe(0);
    expect(await refunds(s)).toMatchObject([
      { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
    ]);
    expect((await x.folio(s.folioId)).status).toBe('closed');
    expect((await x.openDebtOf(s))?.openDebtVnd).toBe(200_000);
    expect(await creditItems(s)).toBe(0);
  }, 180_000);

  it('BUG-R3-013 (J15 alone): a pending A32 request 300.000 above a credit of 200.000 → the worker J15 cancels it `superseded` and asks 200.000 again through the folio refund routing (A32 source, requester and level kept); it waits', async () => {
    const { s, r } = await pendingA32Refund(300_000);
    await rawLine(s, 100_000);
    await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
    expect((await runWorkerJ15()).waitingRefund).toBeGreaterThanOrEqual(1);
    expect(await refunds(s)).toMatchObject([
      { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
      {
        amount: 200_000,
        status: 'pending',
        refund_source: 'a32',
        requested_by: x.t.users.mgr!.id,
        required_role: r.required_role,
      },
    ]);
    expect((await x.folio(s.folioId)).status).toBe('settled');
  }, 180_000);
});
