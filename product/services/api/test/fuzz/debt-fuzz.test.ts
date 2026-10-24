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
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from '../integration/s438-r8/fixture';
import { isWarning } from './invariants';
import { readRaw, refView } from './ref-ledger';
import {
  decideV,
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
  'FZ-13': 100,
};
const chainsOf = (f: Family) =>
  MODE === 'smoke' ? 2 : Number(process.env.FUZZ_CHAINS ?? PLAN_COUNTS[f]);
const selected = (process.env.FUZZ_FAMILIES?.split(',') ?? Object.keys(FAMILIES)) as Family[];

describe.skipIf(!HAS_DB || !MODE)('R3-Q30 fuzz công nợ (BR-525 (ii), I1–I16)', () => {
  let x: Fx;
  let dir: string;
  const summary: any[] = [];
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory'; // refund proof attachments (refundPay op)
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
    // one fake second between steps, as the runner does (the reference orders rows by time)
    await x.at(`${t.departure}T17:00:01+07:00`);
    expect((await x.collect(t, 100_000)()).statusCode).toBe(201);
    const r2 = refView(await readRaw(x.q, t.folioId, t.id), now());
    expect({ B: r2.B, O: r2.O, W: r2.W }).toEqual({ B: 70_000, O: 0, W: 70_000 });
  }, 180_000);

  // ─── directed SEC cases (B.5 #1–#4, FB-07 / BB07-1–2, void then write off again) – need BE-83 merged ───
  // ─── DOM 5.6 FZ08-1 / FZ08-3 (BR v0.4.3): the reference ledger and the API agree (old debt like new, clamped) ───
  it('FZ08-1 / FZ08-3 (oracle 5.6): cancelled write-off revives debt only within còn phải thu; a raised line is W', async () => {
    const nowIso = () => new Date(x.fa.clock.now()).toISOString();
    const step = async (s: { departure: string }, hhmmss: string) =>
      x.at(`${s.departure}T${hhmmss}+07:00`);
    // FZ08-1: old (pre-0076) debt 100.000, MGR writes it off on a night, then voids that night
    const s = await x.checkedOutStay();
    expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
    await x.q(
      `UPDATE reservation SET debt_opened_at = NULL, debt_recorded_vnd = 0, debt_base_vnd = 0 WHERE folio_id = $1`,
      [s.folioId],
    );
    await step(s, '15:00:01');
    const night = await x.roomLineOf(s);
    expect(outcome(await x.writeOff(s, night, 100_000)())).toMatch(/^201 approved/);
    await step(s, '15:00:02');
    expect(outcome(await x.adjust(s, night, { voidLine: true, reason: 'Ghi nhầm' })())).toMatch(
      /^201/,
    );
    const r1 = refView(await readRaw(x.q, s.folioId, s.id), nowIso());
    const api1 = (await x.openDebtOf(s))?.openDebtVnd ?? 0;
    expect({ refO: r1.O, apiO: api1, negB: r1.B < 0 }).toEqual({ refO: 0, apiO: 0, negB: true });
    // FZ08-3: write-off 100.000 on a 100.000 damage line, then A32 raises the line to 120.000 → B 20.000 = W, O 0
    const t = await x.checkedOutStay();
    const dmg = await x.lateCharge(t, 100_000, t.departure);
    await step(t, '15:00:01');
    expect((await x.reverse(t.transferId)()).statusCode).toBe(200);
    await step(t, '15:00:02');
    expect((await x.collect(t, 100_000)()).statusCode).toBe(201); // pays the G-4 debt → O 0, W 100.000
    await step(t, '15:00:03');
    expect(
      (await x.adjust(t, dmg, { newUnitPriceVnd: 120_000, reason: 'Sửa giá' })()).statusCode,
    ).toBe(201);
    const r3 = refView(await readRaw(x.q, t.folioId, t.id), nowIso());
    const api3 = (await x.openDebtOf(t))?.openDebtVnd ?? 0;
    expect({ refO: r3.O, apiO: api3, W: r3.W }).toEqual({ refO: 0, apiO: 0, W: r3.B });
  }, 240_000);

  // ─── DOM 5.5 FZ02 (BR-433 (e) v0.4.3, SEC FZ-02): post-checkout A32 reductions are waivers – needs BE-B ───
  describe.skipIf(process.env.FUZZ_FZ02 !== '1')('FZ02 directed (BR-433 (e), I17)', () => {
    const refunds = (s: { id: string }) =>
      x.q(
        `SELECT id, status, amount_vnd::int AS amount, requested_by, required_role, reason_note FROM approval_request
          WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
        [s.id],
      );
    const told = async (s: { id: string }) =>
      (
        await x.q(
          `SELECT count(*)::int AS n FROM staff_notification WHERE kind = 'foc_stay_total_exceeded' AND ref_id = $1`,
          [s.id],
        )
      )[0].n as number;
    const nights = async (s: any) =>
      ((await x.liveLineIds(s, 'room')) as any[]).sort((p, q) =>
        p.serviceDate < q.serviceDate ? -1 : 1,
      );
    it('FZ02-1/2: MGR voids one night → ONE auto refund (requested_by MGR, "Tự sinh từ A32"), the same MGR cannot approve; then MGR lowers a 70.000 line → second refund, Σ > basis → owner, OWN told', async () => {
      const s = await x.checkedOutStay();
      const [n1, n2] = await nights(s);
      const mb = await x.lateCharge(s, 70_000, s.departure);
      expect((await x.collect(s, 70_000)()).statusCode).toBe(201);
      const v = await x.adjust(s, n1.id, { voidLine: true, reason: 'Khiếu nại tiếng ồn' })();
      expect(outcome(v)).toMatch(/^201/);
      let rs = await refunds(s);
      expect(rs).toHaveLength(1);
      expect(rs[0]).toMatchObject({ amount: n1.unitPriceVnd, requested_by: x.t.users.mgr!.id });
      expect(String(rs[0].reason_note)).toMatch(/^Tự sinh từ A32/);
      expect((await decideV(x, rs[0].id, 'approve', 'mgr')()).statusCode).toBe(403);
      const low = await x.adjust(s, mb, { voidLine: true, reason: 'Miễn minibar' })();
      expect(outcome(low)).toMatch(/^201/);
      rs = await refunds(s);
      expect(rs).toHaveLength(2);
      if (n1.unitPriceVnd + 70_000 > Math.max(n1.unitPriceVnd, n2?.unitPriceVnd ?? 0))
        expect(rs[1].required_role).toBe('owner');
      expect(await told(s)).toBeGreaterThanOrEqual(1);
    }, 240_000);
    it('FZ02-4 (DOM 24/10, 2-night stay): MGR voids night 1 → refund manager; voids night 2 → basis null → refund owner; OWN told', async () => {
      const s = await x.checkedOutStay();
      const ns = await nights(s);
      expect(ns.length).toBe(2);
      expect(
        outcome(await x.adjust(s, ns[0].id, { voidLine: true, reason: 'Ghi nhầm' })()),
      ).toMatch(/^201/);
      let rs = await refunds(s);
      expect(rs.map((r: any) => r.required_role)).toEqual(['manager']);
      expect(
        outcome(await x.adjust(s, ns[1].id, { voidLine: true, reason: 'Ghi nhầm' })()),
      ).toMatch(/^201/);
      rs = (await refunds(s)).filter(
        (r: any) => r.status === 'pending' || r.status === 'escalated',
      );
      expect(rs.map((r: any) => r.required_role)).toEqual(['manager', 'owner']);
      expect(await told(s)).toBeGreaterThanOrEqual(1);
    }, 240_000);
    it('FZ02-7: a window charge (not paid) voided by MGR → no refund request', async () => {
      const s = await x.checkedOutStay();
      const mb = await x.lateCharge(s, 70_000, s.departure);
      expect(outcome(await x.adjust(s, mb, { voidLine: true, reason: 'Ghi nhầm' })())).toMatch(
        /^201/,
      );
      expect(await refunds(s)).toEqual([]);
    }, 240_000);
    it('FZ02-8: OWN rejects the first auto refund; a second one counts alone; the credit keeps J15 waiting', async () => {
      const s = await x.checkedOutStay();
      const [n1] = await nights(s);
      const mb = await x.lateCharge(s, 70_000, s.departure);
      expect((await x.collect(s, 70_000)()).statusCode).toBe(201);
      expect(outcome(await x.adjust(s, n1.id, { voidLine: true, reason: 'Khiếu nại' })())).toMatch(
        /^201/,
      );
      const [first] = await refunds(s);
      expect((await decideV(x, first.id, 'reject', 'owner')()).statusCode).toBe(200);
      expect(outcome(await x.adjust(s, mb, { voidLine: true, reason: 'Miễn' })())).toMatch(/^201/);
      const rs = (await refunds(s)).filter((r: any) => r.status !== 'rejected');
      expect(rs.map((r: any) => r.amount)).toContain(70_000);
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      await x.runJ15();
      expect((await x.folio(s.folioId)).status).toBe('settled');
    }, 240_000);
  });

  // ─── BE-B confirmPaymentReceived fix (ARC s1-ARC-on-add3): a QR paid late that clears the debt closes the cycle ───
  it('QR paid late clears the open debt (300.000) + 50.000 over → debt cycle closed, refund request 50.000', async () => {
    const s = await x.checkedOutStay({ big: 300_000 });
    await x.at(`${s.departure}T15:00:01+07:00`);
    expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
    expect((await x.openDebtOf(s))?.openDebtVnd).toBe(300_000);
    await x.at(`${s.departure}T15:00:02+07:00`);
    await new Runner(x, { be83: BE83 }, '/dev/null').ensureAccount();
    await x.at(`${s.departure}T15:00:03+07:00`);
    const q = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/vietqr`), {
      amountVnd: 350_000,
      overBalanceReason: 'Khách chuyển thừa',
    });
    expect(q.statusCode, q.body).toBe(201);
    const c = await x.c.fd!.send(
      'POST',
      x.url(`/payments/${q.json().payment.id}/actions/confirm-received`),
      {
        note: 'Tiền về muộn',
      },
    );
    expect(c.statusCode, c.body).toBe(200);
    expect((await x.openDebtOf(s))?.openDebtVnd ?? 0).toBe(0);
    const [r] = await x.q(
      `SELECT debt_settled_at IS NOT NULL AS settled FROM reservation WHERE id = $1`,
      [s.id],
    );
    expect(r.settled).toBe(true);
    const refunds = await x.q(
      `SELECT amount_vnd::int AS amount FROM approval_request WHERE type = 'refund' AND target_id = $1
          AND status IN ('pending', 'escalated')`,
      [s.id],
    );
    expect(refunds.map((x2: any) => x2.amount)).toEqual([50_000]);
  }, 240_000);

  // ─── critic final §4 row 14 / M-1 (ORC 24/10): the refundPay op walks the pay-out path with a destination ───
  // cash: FD sets the destination, MGR approves, a pay-out above min(left, credit) → 422, the capped one → 2xx;
  // transfer: the same with MGR2 paying (MGR approved). I23 (clamp) + every invariant judged by the runner.
  for (const [kind, req] of [
    ['cash', 0],
    ['transfer', 1],
  ] as const) {
    it(`refundPay op (${kind}): destination → approve → over the clamp refused, capped pay-out accepted (I23)`, async () => {
      const log = join(dir, `refundPay-${kind}.jsonl`);
      const ops: Op[] = [
        { k: 'qrLate', extraVnd: 300_000 },
        { k: 'refundPay', req, who: 'fd' }, // sets the destination on the pending request
        { k: 'refundApprove', req: 0, who: 'mgr' },
        { k: 'refundPay', req: 9, who: 'fd' }, // req 9: pays before the QR is reconciled → 409
        { k: 'refundPay', req, who: 'fd' }, // reconciles the QR receipt (MGR, A46)
        { k: 'refundPay', req: req + 6, who: 'fd' }, // mode "over" → 422
        { k: 'refundPay', req, who: 'fd' }, // mode "cap" → paid
      ];
      const res = await new Runner(
        x,
        { be83: BE83, fz02: true, k1106: true, add3: true },
        log,
      ).chain('FZ-01', 99_001 + req, ops);
      const steps = readFileSync(log, 'utf8')
        .trim()
        .split('\n')
        .map((l) => JSON.parse(l))
        .filter((d) => d.label);
      const out = steps.map(
        (d) => `${d.label.split(' (')[0]} → ${d.outcomes.map((o: any) => o.outcome).join(',')}`,
      );
      expect(out[1], out.join('\n')).toMatch(/^set refund destination .* → 200/);
      expect(out[2], out.join('\n')).toMatch(/→ 200 approved/);
      expect(out[3], out.join('\n')).toMatch(/^pay refund .* → 409 REFUND_SOURCE_NOT_RECONCILED/);
      expect(out[4], out.join('\n')).toMatch(/^reconcile \d+ receipt.* → 200/);
      expect(out[5], out.join('\n')).toMatch(/^pay refund .* → 422 .*REFUND_EXCEEDS_APPROVED/);
      expect(out[6], out.join('\n')).toMatch(/^pay refund .* → 20\d/);
      expect(res.violations.filter((v) => !isWarning(v))).toEqual([]);
    }, 240_000);
  }

  // ─── SEC s1-SEC-on-add3 "nhận xét": manual raise then lower after check-out, the guest paid the raise (OBSERVED) ───
  it('observation: A32 raise +300.000, guest pays it, MGR lowers back → refund 300.000 goes the `other` way (logged, not failed)', async () => {
    const s = await x.checkedOutStay();
    const line = await x.lateCharge(s, 100_000, s.departure);
    await x.at(`${s.departure}T15:00:01+07:00`);
    expect(
      (await x.adjust(s, line, { newUnitPriceVnd: 400_000, reason: 'Sửa giá' })()).statusCode,
    ).toBe(201);
    await x.at(`${s.departure}T15:00:02+07:00`);
    expect((await x.collect(s, 400_000)()).statusCode).toBe(201);
    const raised = ((await x.liveLineIds(s, 'fnb')) as any[]).find(
      (l) => l.unitPriceVnd === 400_000,
    );
    await x.at(`${s.departure}T15:00:03+07:00`);
    expect(
      (await x.adjust(s, raised.id, { newUnitPriceVnd: 100_000, reason: 'Sửa lại' })()).statusCode,
    ).toBe(201);
    const rows = await x.q(
      `SELECT amount_vnd::int AS amount, required_role, to_jsonb(a)->>'refund_source' AS source FROM approval_request a
        WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at`,
      [s.id],
    );
    const [fsr] = await x.q(
      `SELECT count(*)::int AS n FROM folio_settled_reduction WHERE folio_id = $1`,
      [s.folioId],
    );
    test_log(
      `[observation SEC add3] refunds ${JSON.stringify(rows)} folio_settled_reduction rows ${fsr.n}`,
    );
    expect(rows.reduce((t: number, r2: any) => t + r2.amount, 0)).toBe(300_000);
  }, 240_000);

  // ─── ADD3-01 (ARC probe + SEC FB-01 P1/P2): refunds of a settled folio with an A32 reduction – needs BE-B ───
  describe.skipIf(process.env.FUZZ_ADD3 !== '1')('ADD3-01 directed (I18)', () => {
    const refunds = (s: { id: string }) =>
      x.q(
        `SELECT id, amount_vnd::int AS amount, requested_by, required_role, status FROM approval_request
          WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
        [s.id],
      );
    const manual = (s: { folioId: string }, amountVnd: number) =>
      x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/refund-requests`), {
        amountVnd,
        reason: 'Khách trả thừa',
      });
    const nights = async (s: any) =>
      ((await x.liveLineIds(s, 'room')) as any[]).sort((p, q) =>
        p.serviceDate < q.serviceDate ? -1 : 1,
      );
    for (const path of ['owner rejects', 'requester cancels'] as const)
      it(`ARC probe (${path}): MGR voids F&B 1.500.000 (> basis → OWN); FD re-requests by hand → owner; the MGR who voided approves → 403`, async () => {
        const s = await x.checkedOutStay({ big: 1_500_000 });
        expect(
          (await x.adjust(s, s.bigLineId!, { voidLine: true, reason: 'Ghi nhầm' })()).statusCode,
        ).toBe(201);
        const [r] = await refunds(s);
        expect(r.required_role).toBe('owner');
        if (path === 'owner rejects')
          expect((await decideV(x, r.id, 'reject', 'owner')()).statusCode).toBe(200);
        else {
          const c = await x.cancelReq(r.id, 'mgr')();
          // either the A32 actor cannot cancel his own request, or the cancel keeps the folio on owner (below)
          if (c.statusCode >= 300) return;
        }
        const m = await manual(s, 1_500_000);
        if (m.statusCode !== 201) return; // refused outright – also safe
        expect(m.json().requiredRole ?? (await refunds(s)).pop().required_role).toBe('owner');
        expect((await decideV(x, m.json().id, 'approve', 'mgr')()).statusCode).toBe(403);
      }, 240_000);
    it('SEC P1: MGR voids a night → auto refund; MGR cancels it; FD requests by hand; the same MGR approves → 403', async () => {
      const s = await x.checkedOutStay();
      const [n1] = await nights(s);
      expect((await x.adjust(s, n1.id, { voidLine: true, reason: 'Khiếu nại' })()).statusCode).toBe(
        201,
      );
      const [r] = await refunds(s);
      const c = await x.cancelReq(r.id, 'mgr')();
      if (c.statusCode < 300) {
        const m = await manual(s, n1.unitPriceVnd);
        if (m.statusCode === 201) {
          expect((await refunds(s)).pop().required_role).toBe('owner');
          expect((await decideV(x, m.json().id, 'approve', 'mgr')()).statusCode).toBe(403);
        }
      }
    }, 240_000);
    it('SEC P2: MGR voids two nights → second refund > basis → owner; OWN rejects; FD requests by hand → owner; MGR2 approves → 403', async () => {
      const s = await x.checkedOutStay();
      const ns = await nights(s);
      for (const n of ns)
        expect(
          (await x.adjust(s, n.id, { voidLine: true, reason: 'Khiếu nại' })()).statusCode,
        ).toBe(201);
      const rs = await refunds(s);
      const top = rs.find((r: any) => r.required_role === 'owner');
      expect(top).toBeTruthy();
      expect((await decideV(x, top.id, 'reject', 'owner')()).statusCode).toBe(200);
      const m = await manual(s, top.amount);
      if (m.statusCode === 201) {
        expect((await refunds(s)).pop().required_role).toBe('owner');
        expect((await decideV(x, m.json().id, 'approve', 'mgr2')()).statusCode).toBe(403);
      }
    }, 240_000);
    it('ARC: recordPayment above due on a folio with an A32 reduction → the refund it creates waits for owner; without A32 → manager', async () => {
      const s = await x.checkedOutStay({ big: 500_000 });
      expect(
        (await x.adjust(s, s.bigLineId!, { voidLine: true, reason: 'Ghi nhầm' })()).statusCode,
      ).toBe(201);
      const before = (await refunds(s)).length;
      expect(
        (
          await x.pay(s.folioId, {
            type: 'charge',
            method: 'cash',
            amountVnd: 50_000,
            note: 'Khách đưa thừa',
          })
        ).statusCode,
      ).toBe(201);
      const after = await refunds(s);
      expect(after.length).toBeGreaterThan(before);
      expect(after.pop().required_role).toBe('owner');
      const t = await x.checkedOutStay();
      expect(
        (
          await x.pay(t.folioId, {
            type: 'charge',
            method: 'cash',
            amountVnd: 50_000,
            note: 'Khách đưa thừa',
          })
        ).statusCode,
      ).toBe(201);
      const m = await manual(t, 50_000);
      if (m.statusCode === 201) expect((await refunds(t)).pop().required_role).toBe('manager');
    }, 240_000);
  });

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
      expect((await decideV(x, p.json().id, 'reject')()).statusCode).toBe(200);
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
      // write off again whatever is open now (≤ O): a second self-apply would make Σ > basis → must wait for OWN
      const o = (await x.openDebtOf(s))?.openDebtVnd ?? 0;
      if (o > 0) {
        const again = outcome(await x.writeOff(s, await x.roomLineOf(s), Math.min(o, basis))());
        // 422 AMOUNT_EXCEEDS_BALANCE (cap of that line) is fine – what matters is the invariant below
        expect(again).toMatch(
          /^(201 (pending|approved)|422 VALIDATION_FAILED\/AMOUNT_EXCEEDS_BALANCE)/,
        );
      }
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
          {
            be83: BE83,
            q23: process.env.FUZZ_Q23 === '1',
            fz02: process.env.FUZZ_FZ02 === '1',
            k1106: process.env.FUZZ_K1106 === '1',
            add3: process.env.FUZZ_ADD3 === '1',
          },
          join(dir, `${fam}.jsonl`),
        );
        let other: { x: Fx; runner: Runner } | null = null;
        if (fam === 'FZ-06') {
          const x2 = await startFixture();
          other = {
            x: x2,
            runner: new Runner(
              x2,
              {
                be83: BE83,
                q23: process.env.FUZZ_Q23 === '1',
                fz02: process.env.FUZZ_FZ02 === '1',
                k1106: process.env.FUZZ_K1106 === '1',
                add3: process.env.FUZZ_ADD3 === '1',
              },
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
                  {
                    be83: BE83,
                    q23: process.env.FUZZ_Q23 === '1',
                    fz02: process.env.FUZZ_FZ02 === '1',
                    k1106: process.env.FUZZ_K1106 === '1',
                    add3: process.env.FUZZ_ADD3 === '1',
                  },
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

function test_log(line: string) {
  console.log(line);
  if (process.env.FUZZ_LOG_DIR)
    appendFileSync(join(process.env.FUZZ_LOG_DIR, 'observations.log'), `${line}\n`);
}

async function lastStay(x: Fx) {
  const [r] = await x.q(
    `SELECT id, folio_id AS "folioId" FROM reservation WHERE actual_checkout_at IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
  );
  return r;
}
