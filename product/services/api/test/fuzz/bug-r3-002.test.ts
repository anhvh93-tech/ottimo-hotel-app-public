/**
 * BUG-R3-002 (QA 23/10, fuzz R3-Q30 FZ-01 seed 10047): a credit created AFTER check-out (A32 void on a settled folio
 * with no open debt – allowed by 208, O = 0) is never turned into a refund request; J15 then closes the folio with
 * the credit still on it (`folio.closed` audit says balanceDueVnd 0), no "Cần chú ý", nothing to pay back.
 * Expected (BR-522 / BR-525 I4 "never a credit on a closed folio"): J15 waits (`waiting_refund`) or a refund request +
 * "Cần chú ý" `closed_reservation_credit` exist. Runs with FUZZ_KNOWN_BUGS=1 (red until BE fixes it). FAKE data.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from '../integration/s438-r8/fixture';

describe.skipIf(!HAS_DB || process.env.FUZZ_KNOWN_BUGS !== '1')(
  'BUG-R3-002 credit after B18 closed by J15',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    }, 120_000);
    afterAll(async () => {
      await x?.close();
    });
    it('void a room line on a settled folio without debt → credit; J15 must not close it without a refund path', async () => {
      const s = await x.checkedOutStay();
      const room = await x.roomLineOf(s);
      const v = await x.adjust(s, room, { voidLine: true, reason: 'Ghi nhầm khoản' })();
      expect(outcome(v)).toMatch(/^201/);
      const f1 = await x.folio(s.folioId);
      expect(f1.totals.creditVnd).toBeGreaterThan(0);
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`); // past the 24 h window (D+1 11:00)
      await x.runJ15();
      const f2 = await x.folio(s.folioId);
      const [refunds] = await x.q(
        `SELECT count(*)::int AS n FROM approval_request WHERE type = 'refund' AND target_id = $1`,
        [s.id],
      );
      const [att] = await x.q(
        `SELECT count(*)::int AS n FROM attention_event WHERE ref_id = $1 AND resolved_at IS NULL`,
        [s.id],
      );
      expect(
        { status: f2.status, credit: f2.totals.creditVnd, refunds: refunds.n, attention: att.n },
        'closed with credit and no refund path',
      ).not.toMatchObject({ status: 'closed', refunds: 0, attention: 0 });
    }, 180_000);
  },
);
