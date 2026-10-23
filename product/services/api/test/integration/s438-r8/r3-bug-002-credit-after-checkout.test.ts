/**
 * BUG-R3-002 (P0, fuzz R3-Q30 I4) – oracle of the fix (BR-522 K11-06, BR-427 (d), DOM oracle mục 8 I4 "never a credit
 * on a closed folio"):
 * - A32 reduction after check-out that leaves an overpayment → in the same transaction ONE refund request of exactly the
 *   unhandled credit (requested by the MGR, `overpayment`) + "Cần chú ý" closed_reservation_credit; J15 waits.
 * - Safety net: any overpayment without a refund request when the window ends (a receipt above what is due) → J15 keeps
 *   the folio `settled` (`waiting_refund`) and opens closed_reservation_credit – never `closed` with money of the guest.
 * Fake clock, FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)('BUG-R3-002 – a credit after check-out is never closed away', () => {
  let x: Fx;
  beforeAll(async () => {
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  const refunds = (s: { id: string }) =>
    x.q(
      `SELECT amount_vnd::int AS amount, reason_code, requested_by, status FROM approval_request
        WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at`,
      [s.id],
    );
  const credit = (s: { id: string }) =>
    x.q(
      `SELECT count(*)::int AS n FROM attention_event
        WHERE kind = 'closed_reservation_credit' AND ref_id = $1 AND resolved_at IS NULL`,
      [s.id],
    );

  it('MGR voids a night on a settled folio (O = 0) → refund request of exactly the credit + item, same transaction; J15 waits', async () => {
    const s = await x.checkedOutStay();
    const room = await x.roomLineOf(s);
    const v = await x.adjust(s, room, { voidLine: true, reason: 'Ghi nhầm khoản' })();
    expect(outcome(v)).toMatch(/^201/);
    const f = await x.folio(s.folioId);
    expect(f.totals.creditVnd).toBeGreaterThan(0);
    const reqs = await refunds(s);
    expect(reqs).toEqual([
      {
        amount: f.totals.creditVnd,
        reason_code: 'overpayment',
        requested_by: x.t.users.mgr!.id,
        status: 'pending',
      },
    ]);
    expect((await credit(s))[0].n).toBe(1);
    await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
    await x.runJ15();
    expect((await x.folio(s.folioId)).status).toBe('settled');
  }, 180_000);

  it('safety net: the guest pays above what is due after check-out (no refund request) → J15 does not close, opens closed_reservation_credit', async () => {
    const s = await x.checkedOutStay();
    const p = await x.pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: 50_000,
      note: 'Khách đưa thừa',
    });
    expect(p.statusCode, p.body).toBe(201);
    expect(await refunds(s)).toEqual([]);
    await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
    const stats = await x.runJ15();
    expect(stats.waitingRefund).toBeGreaterThanOrEqual(1);
    const f = await x.folio(s.folioId);
    expect({ status: f.status, credit: f.totals.creditVnd }).toEqual({
      status: 'settled',
      credit: 50_000,
    });
    expect((await credit(s))[0].n).toBe(1);
  }, 180_000);
});
