/**
 * BUG-R3-004 (QA 23/10, fuzz R3-Q30 run 1 I16 "stored basis 911.000 > protected 0" ×42, critic s1-money-critic M-2):
 * every room night of a checked-out stay voided by A32 → BR-433 (a) "đêm `room` còn sống … không có đêm nào → chờ
 * OWN", but a MGR `debt_write_off` still self-applies with `limit_basis_vnd` = the B18 snapshot.
 * Runs with FUZZ_KNOWN_BUGS=1. FAKE data.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, outcome, startFixture } from '../integration/s438-r8/fixture';

describe.skipIf(!HAS_DB || process.env.FUZZ_KNOWN_BUGS !== '1')(
  'BUG-R3-004 write-off self-applied with no live night',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    }, 120_000);
    afterAll(async () => {
      await x?.close();
    });
    it('O > 0, all room nights voided (≤ W), MGR write-off 50.000 → pending OWN', async () => {
      const s = await x.checkedOutStay();
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200); // O 100.000
      await x.lateCharge(s, 3_000_000, s.departure); // window money: the nights can be voided (≤ W)
      for (const n of (await x.liveLineIds(s, 'room')) as any[])
        expect(outcome(await x.adjust(s, n.id, { voidLine: true, reason: 'Ghi nhầm' })())).toMatch(
          /^201/,
        );
      expect(await x.liveLineIds(s, 'room')).toHaveLength(0);
      const fnb = (await x.liveLineIds(s, 'fnb')) as any[];
      const r = await x.writeOff(s, fnb[0].id, 50_000)();
      const [a] = await x.q(
        'SELECT required_role, limit_basis_vnd FROM approval_request WHERE id = $1',
        [r.json().id],
      );
      expect({ outcome: outcome(r), requiredRole: a.required_role }).toEqual({
        outcome: expect.stringMatching(/^201 pending/),
        requiredRole: 'owner',
      });
    }, 180_000);
  },
);
