/**
 * BUG-R3-003 (QA 23/10, fuzz R3-Q30 FZ-01 seed 10128 step 17): when the protected limit basis is tiny (room night
 * lowered by A32 after check-out), a MGR `debt_write_off` above the basis goes `pending` with
 * required_role = front_desk_lead instead of owner (BR-433 (a): Σ > basis → OWN; BR-525: only MGR+ write off debt).
 * Was gated by FUZZ_KNOWN_BUGS=1 – fixed by BE-B, now always runs. FAKE data.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, outcome, startFixture } from '../integration/s438-r8/fixture';

describe.skipIf(!HAS_DB)('BUG-R3-003 write-off routed to the lead', () => {
  let x: Fx;
  beforeAll(async () => {
    x = await startFixture();
  }, 120_000);
  afterAll(async () => {
    await x?.close();
  });
  it('O > 0, every night lowered/voided to a basis of 1.000; MGR write-off 2.000 → pending OWN; the lead cannot approve it', async () => {
    const s = await x.checkedOutStay();
    expect((await x.reverse(s.transferId)()).statusCode).toBe(200); // O 100.000
    await x.lateCharge(s, 2_000_000, s.departure); // window money so the room lines can be reduced (≤ W)
    const nights = (await x.liveLineIds(s, 'room')) as any[];
    for (const [i, n] of nights.entries()) {
      const body =
        i === 0
          ? { voidLine: true, reason: 'Ghi nhầm' }
          : { newUnitPriceVnd: 1_000, reason: 'Sửa giá' };
      expect(outcome(await x.adjust(s, n.id, body)())).toMatch(/^201/);
    }
    const fnb = (await x.liveLineIds(s, 'fnb')) as any[];
    const r = await x.writeOff(s, fnb[0].id, 2_000)();
    expect(outcome(r)).toMatch(/^201 pending/);
    const [a] = await x.q(
      'SELECT required_role, limit_basis_vnd FROM approval_request WHERE id = $1',
      [r.json().id],
    );
    const lead = await x.decide(r.json().id, 'approve', 'lead')();
    expect({ requiredRole: a.required_role, leadApprove: lead.statusCode }).toEqual({
      requiredRole: 'owner',
      leadApprove: 403,
    });
  }, 180_000);
});
