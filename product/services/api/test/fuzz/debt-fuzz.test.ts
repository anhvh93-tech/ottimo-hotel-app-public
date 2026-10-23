/**
 * R3-Q30 – fuzz công nợ (QA test plan `rounds/round-03/qa/s1-test-plan.md` mục 3; DOM oracle mục 8 + 5.4 I16;
 * SEC `reviews/s1-SEC-on-BE-B.md` "Ca QA phải đưa vào fuzz" #1–#5; SEC D.3 (e)).
 *
 * NOT part of `pnpm test`: runs only with FUZZ set (it is long) and a database (HAS_DB):
 *   FUZZ=smoke  → 2 chains per family (harness check, a few minutes)
 *   FUZZ=1      → the plan's counts (≥ 620 chains; D8 run on the build with steps 1–6 merged)
 *   FUZZ_FAMILIES=FZ-01,FZ-08   only these families      FUZZ_SEED=1000   first seed (chain i uses seed + i)
 *   FUZZ_BE83=1 → also BE-83 / ESC-026 A / BR-433 (d): families FZ-09…11, invariants I8, I13, I16 and the directed
 *                 SEC cases. Set it once BE-B merged step 4 with the FB-R3-SEC-BE-B-07 fix – before, main has the R2
 *                 per-request limit and these would only re-find the known Blocker.
 *   FUZZ_SHRINK=1 → shrink each failing chain to a short reproducer (logged)   FUZZ_LOG_DIR=…  (default fuzz-logs/)
 * Every step of every chain is a JSONL record (op, outcomes, clock, raw rows, ref, API view, violations): the
 * critic reads those files (mục 3.5), not this test's summary. Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, outcome, startFixture } from '../integration/s438-r8/fixture';
import { isWarning } from './invariants';
import { readRaw, refView } from './ref-ledger';
import {
  FAMILIES,
  type Family,
  NOT_BUILT,
  type Op,
  Runner,
  genChain,
  logDir,
  shrink,
} from './runner';

const MODE = process.env.FUZZ ?? '';
const BE83 = process.env.FUZZ_BE83 === '1';
const SEED = Number(process.env.FUZZ_SEED ?? 1000);
const PLAN_COUNTS: Record<Family, number> = {
  'FZ-01': 200,
  'FZ-02': 100,
  'FZ-06': 40,
  'FZ-07': 50,
  'FZ-08': 40,
  'FZ-09': 50,
  'FZ-10': 50,
  'FZ-11': 40,
  'FZ-12': 40,
};
const chainsOf = (f: Family) =>
  MODE === 'smoke' ? 2 : Number(process.env.FUZZ_CHAINS ?? PLAN_COUNTS[f]);
const selected = (process.env.FUZZ_FAMILIES?.split(',') ?? Object.keys(FAMILIES)) as Family[];

describe.skipIf(!HAS_DB || !MODE)('R3-Q30 fuzz công nợ (BR-525 (ii), I1–I16)', () => {
  let x: Fx;
  let dir: string;
  const summary: any[] = [];
  beforeAll(async () => {
    x = await startFixture();
    dir = logDir();
  }, 120_000);
  afterAll(async () => {
    if (dir)
      writeFileSync(
        join(dir, 'summary.json'),
        JSON.stringify({ be83: BE83, notBuilt: NOT_BUILT, summary }, null, 2),
      );
    await x?.close();
  });

  // ─── self-check of the reference ledger on oracle cases (test plan 3.2): refLedger must give the DOM numbers ───
  it('refLedger self-check: 210-A (BR-525-36) and 208-A (BR-525-29) give the oracle numbers', async () => {
    const now = () => new Date((x.fa.clock as any).now()).toISOString();
    // 210-A: legacy G-4 debt 100.000, minibar 70.000 at 15:00, MGR reverses 834.000 at 17:00
    const s = await x.checkedOutStay({ big: 834_000 });
    expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
    await x.q(
      `UPDATE reservation SET debt_opened_at = NULL, debt_recorded_vnd = 0, debt_base_vnd = 0 WHERE folio_id = $1`,
      [s.folioId],
    );
    await x.lateCharge(s, 70_000, s.departure);
    await x.at(`${s.departure}T17:00:00+07:00`);
    expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
    const r1 = refView(await readRaw(x.q, s.folioId, s.id), now());
    expect({ B: r1.B, O: r1.O, W: r1.W }).toEqual({ B: 1_004_000, O: 934_000, W: 70_000 });
    // 208-A: reverse 100.000 (O 100.000), minibar 70.000, FD collects 100.000 → O 0, W 70.000
    const t = await x.checkedOutStay();
    await x.lateCharge(t, 70_000, t.departure);
    await x.at(`${t.departure}T17:00:00+07:00`);
    expect((await x.reverse(t.transferId)()).statusCode).toBe(200);
    expect(refView(await readRaw(x.q, t.folioId, t.id), now()).O).toBe(100_000);
    expect((await x.collect(t, 100_000)()).statusCode).toBe(201);
    const r2 = refView(await readRaw(x.q, t.folioId, t.id), now());
    expect({ B: r2.B, O: r2.O, W: r2.W }).toEqual({ B: 70_000, O: 0, W: 70_000 });
  }, 180_000);

  // ─── directed SEC cases (B.5 #1–#4, FB-07 / BB07-1–2, void then write off again) – need BE-83 merged ───
  describe.skipIf(!BE83)('SEC directed (BE-83 + BR-433 (d))', () => {
    const debtStay = async (unpaid = 5_000_000) => {
      const s = await x.checkedOutStay({ b18Debt: { unpaid, finalPay: 0 } });
      const raw = await readRaw(x.q, s.folioId, s.id);
      const basis = refView(raw, new Date(x.fa.clock.now()).toISOString()).basisVnd;
      return { s, basis, line: s.bigLineId! };
    };
    it('B.5 #1–#2: MGR 450.000 then 450.000 → 2nd pending OWN; Σ = basis self-applies, +1.000 → pending', async () => {
      const { s, basis, line } = await debtStay();
      const first = outcome(await x.writeOff(s, line, Math.min(450_000, basis))());
      expect(first).toMatch(/^201 approved/);
      expect(outcome(await x.writeOff(s, line, 450_000)())).toMatch(/^201 pending/);
      const b = await debtStay();
      expect(outcome(await x.writeOff(b.s, b.line, b.basis)())).toMatch(/^201 approved/);
      expect(outcome(await x.writeOff(b.s, b.line, 1_000)())).toMatch(/^201 pending/);
    }, 300_000);
    it('B.5 #3: rejected / cancelled do not count, pending counts', async () => {
      const { s, basis, line } = await debtStay();
      const p = await x.writeOff(s, line, basis + 1_000)();
      expect(outcome(p)).toMatch(/^201 pending/);
      expect((await x.decide(p.json().id, 'reject')()).statusCode).toBe(200);
      expect(outcome(await x.writeOff(s, line, basis)())).toMatch(/^201 approved/);
    }, 300_000);
    it('B.5 #4: two MGR requests at once, together above the basis → exactly one self-applied', async () => {
      const { s, basis, line } = await debtStay();
      const half = Math.ceil((basis * 0.6) / 1_000) * 1_000;
      const res = await x.interleaved(s.folioId, [
        x.writeOff(s, line, half),
        x.writeOff(s, line, half, { who: 'mgr2' }),
      ]);
      const outs = res.map(outcome).sort();
      expect(outs.filter((o) => /approved/.test(o))).toHaveLength(1);
      expect(outs.filter((o) => /pending/.test(o))).toHaveLength(1);
    }, 300_000);
    it('FB-07 / BB07-1: A32 raises the room line, MGR writes off 4.000.000, A32 lowers it back → pending OWN; Σ applied 0', async () => {
      const { s, basis } = await debtStay();
      const room = await x.roomLineOf(s);
      const line = (await x.folio(s.folioId)).lines.find((l: any) => l.id === room);
      const up = await x.adjust(s, room, { newUnitPriceVnd: 5_000_000, reason: 'Sửa giá' })();
      expect(up.statusCode, up.body).toBe(201);
      const wo = outcome(await x.writeOff(s, s.bigLineId!, 4_000_000)());
      expect(wo, 'BB07-1: must wait for OWN').toMatch(/^201 pending/);
      const raised = (await x.liveLineIds(s, 'room')).find(
        (l: any) => l.unitPriceVnd === 5_000_000,
      );
      expect(
        outcome(
          await x.adjust(s, raised.id, { newUnitPriceVnd: line.unitPriceVnd, reason: 'Sửa lại' })(),
        ),
      ).toMatch(/^201/);
      const ref = refView(
        await readRaw(x.q, s.folioId, s.id),
        new Date(x.fa.clock.now()).toISOString(),
      );
      expect({ basis: ref.basisVnd, applied: ref.writeOffBySubOwnerVnd }).toEqual({
        basis,
        applied: 0,
      });
    }, 300_000);
    it('SEC #3: void the line carrying a write-off (window part), write off again → Σ applied below OWN ≤ basis, O never drops through A32', async () => {
      const { s, basis, line } = await debtStay();
      expect(outcome(await x.writeOff(s, line, basis)())).toMatch(/^201 approved/);
      const before = refView(
        await readRaw(x.q, s.folioId, s.id),
        new Date(x.fa.clock.now()).toISOString(),
      );
      const v = await x.adjust(s, line, { voidLine: true, reason: 'Ghi nhầm khoản' })();
      expect([201, 409]).toContain(v.statusCode);
      expect(outcome(await x.writeOff(s, await x.roomLineOf(s), basis)())).toMatch(/^201 pending/);
      const after = refView(
        await readRaw(x.q, s.folioId, s.id),
        new Date(x.fa.clock.now()).toISOString(),
      );
      expect(after.writeOffBySubOwnerVnd).toBeLessThanOrEqual(basis);
      expect(after.O).toBeGreaterThanOrEqual(Math.min(before.O, Math.max(0, after.B)));
    }, 300_000);
  });

  // ─── random chains ───
  for (const fam of selected) {
    const def = FAMILIES[fam];
    if (!def) continue;
    const skip = def.be83 && !BE83;
    it.skipIf(skip)(
      `${fam} – ${def.title}: ${chainsOf(fam)} chain(s), 0 violation of I1–I16`,
      async () => {
        const runner = new Runner(
          x,
          { be83: BE83, q23: process.env.FUZZ_Q23 === '1' },
          join(dir, `${fam}.jsonl`),
        );
        let other: { x: Fx; runner: Runner } | null = null;
        if (fam === 'FZ-06') {
          const x2 = await startFixture();
          other = {
            x: x2,
            runner: new Runner(
              x2,
              { be83: BE83, q23: process.env.FUZZ_Q23 === '1' },
              join(dir, `${fam}-org2.jsonl`),
            ),
          };
        }
        const bad: any[] = [];
        try {
          for (let i = 0; i < chainsOf(fam); i++) {
            const seed = SEED + i;
            const res = await runner.chain(fam, seed);
            if (other) {
              // FZ-06: the same chain on a second organisation, then the first org's numbers must not have moved
              const snap = await runner.codeView((await lastStay(x)) as any);
              await other.runner.chain(fam, seed);
              const again = await runner.codeView((await lastStay(x)) as any);
              if (JSON.stringify(snap) !== JSON.stringify(again))
                res.violations.push({
                  inv: 'FZ-06',
                  msg: `org 1 view moved: ${JSON.stringify(snap)} → ${JSON.stringify(again)}`,
                  step: -1,
                  op: 'org2 chain',
                });
            }
            summary.push({
              family: fam,
              seed,
              steps: res.steps,
              violations: res.violations.filter((v) => !isWarning(v)).length,
              warnings: res.violations.filter(isWarning).length,
              deadlocks: res.deadlocks,
              http5xx: res.http5xx,
            });
            const hard = res.violations.filter((v) => !isWarning(v));
            if (res.violations.length > hard.length)
              writeFileSync(
                join(dir, `${fam}-${seed}-warnings.json`),
                JSON.stringify({ seed, warnings: res.violations.filter(isWarning) }, null, 2),
              );
            if (hard.length) {
              let reproducer: Op[] | null = null;
              if (process.env.FUZZ_SHRINK === '1') {
                const inv = hard[0]!.inv;
                const shrinkRunner = new Runner(
                  x,
                  { be83: BE83, q23: process.env.FUZZ_Q23 === '1' },
                  join(dir, `${fam}-${seed}-shrink.jsonl`),
                );
                reproducer = await shrink(
                  async (ops) => (await shrinkRunner.chain(fam, seed, ops)).violations,
                  res.ops,
                  inv,
                );
              }
              bad.push({ seed, first: hard.slice(0, 5), reproducer });
              writeFileSync(
                join(dir, `${fam}-${seed}-violations.json`),
                JSON.stringify(
                  { seed, violations: res.violations, ops: res.ops, reproducer },
                  null,
                  2,
                ),
              );
            }
          }
        } finally {
          await other?.x.close();
        }
        expect(bad, `violations – raw log in ${dir}`).toEqual([]);
      },
      24 * 3600_000,
    );
  }

  it('generator is deterministic (replay = same chain)', () => {
    expect(JSON.stringify(genChain('FZ-01', 42))).toBe(JSON.stringify(genChain('FZ-01', 42)));
  });
});

async function lastStay(x: Fx) {
  const [r] = await x.q(
    `SELECT id, folio_id AS "folioId" FROM reservation WHERE actual_checkout_at IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
  );
  return r;
}
