/**
 * BUG-R3-012 (fuzz R3-Q30 final run 24/10, critic s1-money-critic-final B-1; FZ-01 seed 60164):
 * J15 `closeAfterWindow` answers `waiting_refund` whenever a refund request is open – also when the credit is gone
 * and the guest now OWES money. The folio stays `settled` for ever, the debt is never recorded (no journal, no
 * OWN/MGR notice, openDebtVnd 0 instead of max(0, B)). Root cause BUG-R3-013: an open refund request is not
 * re-planned when the credit shrinks (late charge after check-out). Was gated by FUZZ_KNOWN_BUGS=1 – fixed by BE-B
 * (refunds re-planned on every credit change, J15 waits only for money to pay back), now always runs. FAKE data.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from '../integration/s438-r8/fixture';
import { decideV } from './runner';

describe.skipIf(!HAS_DB)('BUG-R3-012 open refund blocks J15 when the guest owes', () => {
  let x: Fx;
  beforeAll(async () => {
    x = await startFixture();
  }, 120_000);
  afterAll(async () => {
    await x?.close();
  });
  it('credit → auto refund approved; a late charge above the credit → guest owes; past the window J15 must record the debt (not wait)', async () => {
    const s = await x.checkedOutStay({ big: 300_000 });
    await x.at(`${s.departure}T15:00:01+07:00`);
    expect(
      outcome(await x.adjust(s, s.bigLineId!, { voidLine: true, reason: 'Ghi nhầm' })()),
    ).toMatch(/^201/);
    const [r] = await x.q(
      `SELECT id FROM approval_request WHERE type = 'refund' AND target_id = $1 AND status = 'pending'`,
      [s.id],
    );
    expect(r).toBeTruthy();
    await x.at(`${s.departure}T15:00:02+07:00`);
    expect((await decideV(x, r.id, 'approve', 'owner')()).statusCode).toBe(200);
    await x.at(`${s.departure}T15:00:03+07:00`);
    await x.lateCharge(s, 500_000, s.departure); // guest now owes 200.000
    const f = await x.folio(s.folioId);
    expect(f.totals.balanceDueVnd).toBe(200_000);
    await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
    await x.runJ15();
    const after = await x.folio(s.folioId);
    const od = (await x.openDebtOf(s))?.openDebtVnd ?? 0;
    expect({ status: after.status, openDebtVnd: od }).toEqual({
      status: 'closed',
      openDebtVnd: 200_000,
    });
  }, 240_000);
});
