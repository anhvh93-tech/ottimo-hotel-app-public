/**
 * BUG-R2-207 (money recheck 8, R8DEBT-01) – oracle BR-525-28 (`tests/fixtures/br-examples.json`).
 * The three R8DEBT-01 cases of the critic's `test/s438/r8debt/debt-paths.test.ts` (tree f6803d0), moved by QA unchanged
 * except for the gate: they run once BR-525-28 has no `pendingFix`.
 *
 * "Written off" in the open debt counts a `debt_write_off` FOC line once: posted, not a reversal, not reversed.
 * An A32 increase on the line that carries the write-off re-posts the FOC (reversal + new line) and must not count
 * it twice (BR-525 (ii): the increase is a charge inside its window, not debt).
 * - submit: G-4 debt 5.000.000 in the window, MGR self-applies s = basis − 1.000, A32 +10.000 → open 5.000.000 − s,
 *   a write-off of 5.000.000 − s → 201 pending (OWN);
 * - approval: 5.000.000 − s pending, A32 +10.000, nobody pays → OWN approves the whole request, no `applied_capped`;
 * - auto-cancel: n self-applied write-offs, the rest pending, A32 +10.000 → OWN approves, not cancelled `debt_cleared`.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, addDays, log, outcome, startFixture } from './fixture';

const ORACLE = (
  JSON.parse(
    readFileSync(join(__dirname, '../../../../../tests/fixtures/br-examples.json'), 'utf8'),
  ) as {
    examples: Array<{ id: string; pendingFix?: string; expected: any }>;
  }
).examples.find((e) => e.id === 'BR-525-28')!;
const PENDING = ORACLE.pendingFix;

describe.skipIf(!HAS_DB || Boolean(PENDING))(
  `BUG-R2-207 R8DEBT-01 – a re-posted debt_write_off FOC counts once (BR-525-28${PENDING ? `, pendingFix ${PENDING}` : ''})`,
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    // X = 5.000.000 G-4 debt in the window; n self-applied write-offs of s = basis − 1.000 on the fnb line.
    const repostStay = async (nOf: number | ((sv: number, X: number) => number)) => {
      const X = 5_000_000;
      const s = await x.checkedOutStay({ big: X });
      const b = (await x.nightBasis(s.bigLineId!))!;
      const sv = b - 1_000;
      const n = typeof nOf === 'number' ? nOf : nOf(sv, X);
      await x.at(`${s.departure}T15:00:00+07:00`);
      expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
      for (let i = 0; i < n; i++)
        expect(outcome(await x.writeOff(s, s.bigLineId!, sv)())).toBe(`201 approved eff ${sv}`);
      return { s, X, b, sv, n };
    };
    const raise = async (s: any, X: number, by = 10_000) => {
      const fnb = (await x.liveLineIds(s, 'fnb')).find((l) => l.amountVnd === X);
      const r = await x.adjust(s, fnb.id, { newUnitPriceVnd: X + by })();
      expect(outcome(r)).toMatch(/^201/);
      return (await x.liveLineIds(s, 'fnb')).find((l) => l.amountVnd === X + by).id as string;
    };

    it('R8DEBT-01 (submit): G-4 debt 5.000.000 in the window; MGR self-applies s = basis − 1.000; MGR RAISES the fnb line +10.000 (A32 allowed) → open debt must stay 5.000.000 − s (BR-525 (ii): the 10.000 is a charge inside its window); a write-off of 5.000.000 − s must be accepted (pending OWN)', async () => {
      const { s, X, b, sv } = await repostStay(1);
      const afterSelf = await x.state(s);
      const lineId = await raise(s, X);
      const afterUp = await x.state(s);
      const focRows = await x.q(
        `SELECT l.amount_vnd::int AS amount, l.reversal_of_id IS NOT NULL AS is_rev,
                EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id) AS reversed, l.approval_request_id IS NOT NULL AS linked
           FROM folio_line l WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted' ORDER BY l.created_at, l.id`,
        [s.folioId],
      );
      const ask = X - sv;
      const sub = await x.writeOff(s, lineId, ask)();
      await x.at(`${addDays(s.departure, 1)}T11:01:00+07:00`);
      const afterWindow = await x.openDebtOf(s);
      log(
        `[r8debt] R8DEBT-01 submit: ${JSON.stringify({ basis: b, X, sv, afterSelf, afterUp, focRows, ask, submit: outcome(sub), afterWindow })}`,
      );
      expect(afterSelf.openDebtVnd).toBe(X - sv);
      expect(afterUp).toMatchObject({ due: X - sv + 10_000, credit: 0 });
      expect(afterWindow).toMatchObject({ openDebtVnd: afterWindow!.balanceDueVnd });
      expect(afterUp.openDebtVnd, 'openDebtVnd after the write-off FOC was re-posted').toBe(X - sv);
      expect(outcome(sub), 'write-off of the whole open debt').toBe(`201 pending eff ${ask}`);
    }, 120_000);

    it('R8DEBT-01 (approval): pending 5.000.000 − s waits for OWN; MGR raises the fnb line +10.000; nobody pays; OWN approves → the whole request must apply (no `approval.applied_capped` "debt_collected_before_approval")', async () => {
      const { s, X, b, sv } = await repostStay(1);
      const ask = X - sv;
      const w = await x.writeOff(s, s.bigLineId!, ask)();
      expect(outcome(w)).toBe(`201 pending eff ${ask}`);
      await raise(s, X);
      const ok = await x.decide(w.json().id, 'approve')();
      const end = await x.state(s);
      const capped = await x.q(
        `SELECT reason, after FROM audit_event WHERE action = 'approval.applied_capped' AND entity_id = $1`,
        [w.json().id],
      );
      const paid = await x.q(
        `SELECT count(*)::int AS n FROM payment WHERE folio_id = $1 AND created_at >= $2`,
        [s.folioId, new Date(`${s.departure}T15:00:00+07:00`)],
      );
      const fix = await x.writeOff(s, s.bigLineId!, 1_000)();
      log(
        `[r8debt] R8DEBT-01 approval: ${JSON.stringify({ basis: b, X, sv, ask, approve: outcome(ok), end, capped, paymentsSinceReversal: paid, mgrWriteOff1000After: outcome(fix) })}`,
      );
      expect(outcome(ok), 'OWN approval of the whole open debt').toBe(`200 approved eff ${ask}`);
      expect(end).toMatchObject({ due: 10_000, credit: 0 });
      expect(capped).toEqual([]);
    }, 120_000);

    it('R8DEBT-01 (auto-cancel): n self-applied write-offs, pending the rest (> basis); MGR raises the fnb line +10.000; OWN approves → must NOT be cancelled `debt_cleared` while the guest still owes', async () => {
      const { s, X, b, sv, n } = await repostStay((sv, X) => Math.ceil(X / (2 * sv)));
      const ask = X - n * sv;
      const w = await x.writeOff(s, s.bigLineId!, ask)();
      await raise(s, X);
      const mid = await x.state(s);
      const ok = await x.decide(w.json().id, 'approve')();
      const end = await x.state(s);
      const told = await x.q(
        `SELECT count(*)::int AS n FROM staff_notification WHERE kind = 'approval_cancelled' AND ref_id = $1`,
        [w.json().id],
      );
      log(
        `[r8debt] R8DEBT-01 auto-cancel: ${JSON.stringify({ basis: b, n, X, sv, ask, submit: outcome(w), mid, approve: outcome(ok), end, toldCancelled: told })}`,
      );
      expect(outcome(w)).toBe(`201 pending eff ${ask}`);
      expect(outcome(ok), 'OWN approval while the guest still owes').toBe(
        `200 approved eff ${ask}`,
      );
      expect(end).toMatchObject({ due: 10_000, credit: 0 });
    }, 120_000);
  },
);
