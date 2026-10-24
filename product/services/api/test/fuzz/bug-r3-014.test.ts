/**
 * BUG-R3-014 (fuzz re-run 24/10 after BUG-R3-012/013, critic s1-money-critic-rerun; FZ-13 64023, 64053, FZ-01 60023):
 * a refund pay-out that takes the credit of a settled folio to 0 leaves the other approved requests (and the rest of
 * a partly paid one) `approved`. ARC 0.3.8 addendum 6 (s1-contracts 13.3) rule 1 lists the refund pay-out among the
 * paths that must re-plan, rule 3: no credit left ⇒ approved-but-unpaid / partly paid requests are closed
 * `superseded`. Money arriving later is then absorbed by the stale approval (the new receipt asks only for the part
 * above it) and paid out under it – without the routing new money needs (ADD3-01). Was gated by FUZZ_KNOWN_BUGS=1 –
 * fixed by BE-B (the pay-out re-plans the folio's refunds), now always runs. FAKE data, harness ops (runner.ts).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from '../integration/s438-r8/fixture';
import { type Op, Runner } from './runner';

describe.skipIf(!HAS_DB)('BUG-R3-014 pay-out to credit 0 leaves approved refunds open', () => {
  let x: Fx;
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory'; // refund proof attachments
    x = await startFixture();
  }, 120_000);
  afterAll(async () => {
    await x?.close();
  });
  it('QR excess 300.000 → request approved (cash); late charge 100.000; pay-out 200.000 (all the credit) → the 100.000 left must be closed `superseded`; a new QR 500.000 must ask for 500.000', async () => {
    const log = join(tmpdir(), `bug-r3-014-${process.pid}.jsonl`);
    const ops: Op[] = [
      { k: 'qrLate', extraVnd: 300_000 }, // K11-06: request 300.000 (FD)
      { k: 'refundPay', req: 0, who: 'fd' }, // destination cash
      { k: 'refundApprove', req: 0, who: 'mgr' },
      { k: 'late', amountVnd: 100_000 }, // credit 200.000, the approved request stays (pay-out clamps)
      { k: 'refundPay', req: 0, who: 'fd' }, // MGR reconciles the receipts
      { k: 'refundPay', req: 0, who: 'fd' }, // pays min(300.000, 200.000) = 200.000 → credit 0
      { k: 'qrLate', extraVnd: 500_000 }, // new money
    ];
    const runner = new Runner(x, { be83: false, fz02: true, k1106: true, add3: true }, log);
    const res = await runner.chain('FZ-13', 99_014, ops);
    const steps = readFileSync(log, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l))
      .filter((d) => d.label);
    const at = (i: number) => steps[i]!;
    expect(at(5).label, at(5).label).toMatch(/^pay refund 200000 /);
    expect(at(5).outcomes[0].status).toBe(201);
    const open = (i: number) =>
      at(i)
        .raw.refunds.filter(
          (r: any) =>
            ['pending', 'escalated', 'approved'].includes(r.status) && r.refundedVnd < r.amountVnd,
        )
        .map((r: any) => `${r.status} ${r.amountVnd - r.refundedVnd}`);
    // after the pay-out: credit 0 → nothing open (13.3 rule 3)
    expect({ credit: Math.max(0, -at(5).ref.B), open: open(5) }).toEqual({ credit: 0, open: [] });
    // new money gets its own request for all of it
    expect(open(6)).toEqual(['pending 500000']);
    expect(res.violations.filter((v) => v.inv === 'I24')).toEqual([]);
  }, 240_000);
});
