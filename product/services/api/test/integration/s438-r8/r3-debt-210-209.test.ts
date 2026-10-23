/**
 * R3 Sprint 1 – lượt kiểm tiền bước 1–2 (BE-B): BUG-R2-210 (R3-Q21) + BUG-R2-209 (R3-Q20) in ONE change of
 * `CheckoutService.writeDebt` (ARC `round-03/outputs/ARC/s1-contracts.md` 5.2, ARC `openapi-0.3.7.md` 16.31.2 (b)).
 * Oracle: DOM `round-03/outputs/DOM/s1-money-oracle.md` mục 2 (210-A, 210-A tiếp, 210-B, 210-B tiếp, 210-C) and
 * mục 3 (209-A … 209-E); fixture rows BR-525-02 and BR-525-33 (`tests/fixtures/br-examples.json`).
 *
 * Time mapping (the fixture checks out at 11:00, the oracle at 10:00 – only the hour moves): departure D = "16/11",
 * window until D+1 11:00 = "17/11 10:00"; "hạn 19/11" = D+3, "hạn 20/11" = D+4. 209-B: the fixture's B18 debt is due
 * D+5 (the oracle's "30/11" – a due date the J15 default would never give); what is checked is that it is KEPT.
 * A debt "written before 0076" (210) is made the only way it can exist on a fresh DB: a real debt, then its 0076 cycle
 * columns put back to what a pre-0076 row has (`debt_opened_at` NULL, recorded/base 0 – migration 0076 defaults).
 * Real HTTP for every money step, the real J15 unit (FolioService.closeAfterWindow + ReservationHooks), fake clock,
 * FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  'R3-Q21/Q20 – BUG-R2-210 + BUG-R2-209: writeDebt appends to / opens the debt by the number (ARC 16.31.2 b, s1-contracts 5.2)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    type S = Awaited<ReturnType<Fx['checkedOutStay']>>;
    const open = async (s: S) => (await x.openDebtOf(s))?.openDebtVnd ?? 0;
    const due = async (s: S) => (await x.folio(s.folioId)).totals.balanceDueVnd as number;
    const cycle = async (s: S) =>
      (
        await x.q(
          `SELECT debt_due_date::text AS due, debt_recorded_vnd::bigint::int AS rec, debt_opened_at IS NOT NULL AS has_cycle,
                  checkout_mode AS mode
             FROM reservation WHERE id = $1`,
          [s.id],
        )
      )[0] as { due: string; rec: number; has_cycle: boolean; mode: string };
    /** Amounts of the money audits `reservation.debt_on_checkout` of the stay, oldest first. */
    const debtAudits = async (s: S) =>
      (
        await x.q(
          `SELECT before, after FROM audit_event WHERE action = 'reservation.debt_on_checkout' AND entity_id = $1
            ORDER BY occurred_at, id`,
          [s.id],
        )
      ).map((r: any) => r.after.debtVnd as number);
    const lastAudit = async (s: S) =>
      (
        await x.q(
          `SELECT before, after FROM audit_event WHERE action = 'reservation.debt_on_checkout' AND entity_id = $1
            ORDER BY occurred_at DESC, id DESC LIMIT 1`,
          [s.id],
        )
      )[0] as { before: any; after: any };
    /** `debt_recorded` notifications per role of the stay (OWN, MGR) – each debt record tells both once. */
    const told = async (s: S) => {
      const [r] = await x.q(
        `SELECT count(*) FILTER (WHERE user_id = $2)::int AS own, count(*) FILTER (WHERE user_id = $3)::int AS mgr2
           FROM staff_notification WHERE kind = 'debt_recorded' AND ref_id = $1`,
        [s.id, x.t.users.owner!.id, x.t.users.mgr2!.id],
      );
      return r as { own: number; mgr2: number };
    };
    const inAttention = async (s: S) =>
      ((await x.c.mgr2!.get(x.url('/attention'))).json().data as any[])
        .filter((i) => i.kind === 'checkout_debt')
        .some((i) => (i.reservationIds ?? []).includes(s.id));
    /** What a booking written by the app before 0076 holds: a debt without a cycle. */
    const asPre0076 = (s: S) =>
      x.q(
        `UPDATE reservation SET debt_opened_at = NULL, debt_recorded_vnd = 0, debt_base_vnd = 0 WHERE folio_id = $1`,
        [s.folioId],
      );
    const j15 = async (s: S) => (await x.j15Unit(s)()).json().status as string;
    const D = (s: S, n: number) => addDays(s.departure, n);
    /** A32 +`byVnd` on a live line; returns the replacement's id (same category and service date). */
    const raiseLive = async (s: S, category: string, lineId: string, byVnd: number) => {
      const lines = (await x.folio(s.folioId)).lines as any[];
      const cur = lines.find((l) => l.id === lineId);
      const r = await x.adjust(s, lineId, {
        newUnitPriceVnd: cur.unitPriceVnd + byVnd,
        reason: 'Sửa giá ghi thiếu',
      })();
      expect(r.statusCode, r.body).toBe(201);
      return ((await x.liveLineIds(s, category)) as any[]).find(
        (l) => l.serviceDate === cur.serviceDate && l.unitPriceVnd === cur.unitPriceVnd + byVnd,
      ).id as string;
    };
    const liveFnb = async (s: S, amount: number) =>
      ((await x.liveLineIds(s, 'fnb')) as any[]).find((l) => l.amountVnd === amount).id as string;

    // ───────────────────────────── BUG-R2-210 – DOM oracle mục 2 ─────────────────────────────

    it('210-A + 210-A tiếp: old G-4 debt 100.000 (pre-0076) + minibar 70.000 in the window; MGR reverses 834.000 → B 1.004.000, O 934.000 (not 834.000), W 70.000, record 834.000, OLD due date kept; J15 → +70.000, O = B = 1.004.000, due kept, closed', async () => {
      const s = await x.checkedOutStay({ big: 834_000 });
      // Old app: G-4 reversal of the 100.000 transfer → debt 100.000, due D+3 (business date D + 3).
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      await asPre0076(s);
      expect(await cycle(s)).toMatchObject({ mode: 'debt', has_cycle: false, due: D(s, 3) });
      await x.at(`${s.departure}T15:30:00+07:00`);
      await x.lateCharge(s, 70_000, s.departure); // minibar after check-out (window charge)
      expect(await due(s)).toBe(170_000);
      // Read path before the deploy write: the same definition – the window charge is not debt.
      expect(await open(s)).toBe(100_000);
      const toldBefore = await told(s);

      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
      expect(await due(s)).toBe(1_004_000);
      expect(await open(s), 'O = old debt 100.000 + 834.000').toBe(934_000);
      expect((await due(s)) - (await open(s)), 'W').toBe(70_000);
      const a = await lastAudit(s);
      expect(a.after).toMatchObject({ debtVnd: 834_000, dueDate: D(s, 3), openDebtVnd: 934_000 });
      expect(a.before).toMatchObject({ openDebtVnd: 100_000, actorRole: 'manager' });
      expect(await cycle(s)).toMatchObject({ has_cycle: true, rec: 934_000, due: D(s, 3) });
      expect(await told(s)).toEqual({ own: toldBefore.own + 1, mgr2: toldBefore.mgr2 + 1 });
      expect(await inAttention(s)).toBe(true);

      // 210-A tiếp: J15 at the end of the window.
      await x.at(`${D(s, 1)}T11:00:00+07:00`);
      expect(await j15(s)).toBe('closed_with_debt');
      expect((await debtAudits(s)).slice(-2)).toEqual([834_000, 70_000]);
      expect(await open(s)).toBe(1_004_000);
      expect(await due(s)).toBe(1_004_000);
      expect(await cycle(s)).toMatchObject({ rec: 1_004_000, due: D(s, 3) });
      expect(await told(s)).toEqual({ own: toldBefore.own + 2, mgr2: toldBefore.mgr2 + 2 });
      expect((await x.folio(s.folioId)).status).toBe('closed');
    }, 120_000);

    it('210-B + 210-B tiếp: old B18 debt 2.000.000 (pre-0076), MGR asks a write-off of 1.500.000 (> basis → OWN); MGR reverses 916.000 → O 2.916.000, still pending; OWN approves → 1.500.000 applied, not capped, not cancelled, O 1.416.000, credit 0', async () => {
      const s = await x.checkedOutStay({
        big: 916_000,
        b18Debt: { unpaid: 2_000_000, finalPay: 0 },
      });
      await asPre0076(s);
      expect(await open(s)).toBe(2_000_000);
      const w = await x.writeOff(s, s.bigLineId!, 1_500_000)();
      expect(outcome(w)).toBe('201 pending eff 1500000');
      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
      expect(await open(s), 'O = 2.000.000 + 916.000').toBe(2_916_000);
      expect((await x.state(s)).writeOffs).toEqual(['pending:1500000']);

      const ok = await x.decide(w.json().id, 'approve')();
      expect(outcome(ok)).toBe('200 approved eff 1500000');
      const st = await x.state(s);
      // `applied_cap_vnd` = what was applied (1.500.000 = the whole request); `applied_capped` audit: none.
      expect(st.writeOffs).toEqual(['approved:1500000/cap 1500000']);
      expect(st).toMatchObject({ openDebtVnd: 1_416_000, credit: 0, due: 1_416_000 });
      const capped = await x.q(
        `SELECT 1 FROM audit_event WHERE action = 'approval.applied_capped' AND entity_id = $1`,
        [w.json().id],
      );
      expect(capped).toEqual([]);
    }, 120_000);

    it('210-C: no old debt, B = 0; MGR reverses 500.000 → new debt O 500.000, due = business date + 3', async () => {
      const s = await x.checkedOutStay({ big: 500_000 });
      expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
      expect(await open(s)).toBe(500_000);
      expect(await cycle(s)).toMatchObject({ has_cycle: true, rec: 500_000, due: D(s, 3) });
      expect(await debtAudits(s)).toEqual([500_000]);
    }, 120_000);

    // ───────────────────────────── BUG-R2-209 – DOM oracle mục 3 ─────────────────────────────

    it('209-A (BR-525-02): minibar 70.000 at 15:00, MGR reverses 100.000 at 17:00 → O 100.000 due D+3; nobody pays; J15 → audits [100.000, 70.000], OWN + MGR told a second time, debt_recorded_vnd 170.000, O 170.000, due D+3 kept, closed', async () => {
      const s = await x.checkedOutStay();
      await x.lateCharge(s, 70_000, s.departure);
      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      expect(await open(s)).toBe(100_000);
      expect(await cycle(s)).toMatchObject({ rec: 100_000, due: D(s, 3) });
      expect(await told(s)).toEqual({ own: 1, mgr2: 1 });

      await x.at(`${D(s, 1)}T11:00:00+07:00`);
      expect(await j15(s)).toBe('closed_with_debt');
      expect(await debtAudits(s)).toEqual([100_000, 70_000]);
      expect(await told(s)).toEqual({ own: 2, mgr2: 2 });
      expect(await cycle(s)).toMatchObject({ rec: 170_000, due: D(s, 3) });
      expect(await open(s)).toBe(170_000);
      expect((await x.folio(s.folioId)).status).toBe('closed');
      const a = await lastAudit(s);
      expect(a.before).toMatchObject({ openDebtVnd: 100_000, actorRole: 'system' });
      expect(a.after).toMatchObject({ debtVnd: 70_000, openDebtVnd: 170_000, dueDate: D(s, 3) });
    }, 120_000);

    it('209-B (BR-525-33 corporate): B18 debt 200.000 due D+5 (set by the manager) + minibar 70.000 unpaid → J15: audits [200.000, 70.000], O 270.000, due D+5 kept, told again', async () => {
      const s = await x.checkedOutStay({ b18Debt: { unpaid: 200_000, finalPay: 0 } });
      expect(await cycle(s)).toMatchObject({ rec: 200_000, due: D(s, 5) });
      await x.lateCharge(s, 70_000, s.departure);
      await x.at(`${D(s, 1)}T11:00:00+07:00`);
      expect(await j15(s)).toBe('closed_with_debt');
      // B18 writes its own audit (the check-out); the J15 record is the 70.000.
      expect((await debtAudits(s)).slice(-1)).toEqual([70_000]);
      expect(await open(s)).toBe(270_000);
      expect(await cycle(s)).toMatchObject({ rec: 270_000, due: D(s, 5) });
      expect((await told(s)).own).toBeGreaterThanOrEqual(1);
    }, 120_000);

    it('209-C (BR-525-33 paidBeforeJ15): as 209-A but FD collects 100.000 at 18:00 → O 0 (dormant cycle: no checkout_debt item); J15 → NEW debt 70.000 due (D+1)+3 = D+4, not the old D+3', async () => {
      const s = await x.checkedOutStay();
      await x.lateCharge(s, 70_000, s.departure);
      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      await x.at(`${s.departure}T18:00:00+07:00`);
      expect((await x.collect(s, 100_000)()).statusCode).toBe(201);
      expect(await due(s)).toBe(70_000);
      expect(await open(s)).toBe(0);
      expect(await inAttention(s), 'dormant cycle is not a debt').toBe(false);
      // still nothing to chase days later inside the window (an old due date never turns "critical")
      await x.at(`${D(s, 1)}T10:59:00+07:00`);
      expect(await inAttention(s)).toBe(false);

      await x.at(`${D(s, 1)}T11:00:00+07:00`);
      expect(await j15(s)).toBe('closed_with_debt');
      expect(await debtAudits(s)).toEqual([100_000, 70_000]);
      expect(await cycle(s)).toMatchObject({ rec: 70_000, due: D(s, 4) });
      expect(await open(s)).toBe(70_000);
      expect(await inAttention(s)).toBe(true);
      expect((await lastAudit(s)).before).toMatchObject({ openDebtVnd: 0 });
    }, 120_000);

    it('209-D (race, sequential both orders): J15 and a 100.000 reversal at the end of the window → both orders O 170.000, due (D+1)+3, records {100.000, 70.000}', async () => {
      for (const order of ['reverse first', 'J15 first'] as const) {
        const s = await x.checkedOutStay();
        await x.lateCharge(s, 70_000, s.departure);
        await x.at(`${D(s, 1)}T11:00:00+07:00`);
        if (order === 'reverse first') {
          expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
          expect(await j15(s)).toBe('closed_with_debt');
        } else {
          expect(await j15(s)).toBe('closed_with_debt');
          expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
        }
        expect(await open(s), order).toBe(170_000);
        expect(await cycle(s), order).toMatchObject({ rec: 170_000, due: D(s, 4) });
        expect([...(await debtAudits(s))].sort(), order).toEqual([100_000, 70_000].sort());
        expect((await x.folio(s.folioId)).status).toBe('closed');
      }
    }, 180_000);

    it('209-D (race, forced behind the folio lock): J15 ‖ reversal = the same steps one after the other, both orders, deadlocks +0', async () => {
      await x.race(
        '209-D J15 ‖ reverse',
        async () => {
          const s = await x.checkedOutStay();
          await x.lateCharge(s, 70_000, s.departure);
          await x.at(`${D(s, 1)}T11:00:00+07:00`);
          return { s, a: x.reverse(s.transferId), b: x.j15Unit(s) };
        },
        (order, _seq, st) => {
          expect(st, order).toMatchObject({
            folio: 'closed',
            due: 170_000,
            openDebtVnd: 170_000,
            debtAudits: 2,
          });
        },
        1,
      );
    }, 240_000);

    // ───────── FB-R3-ARC-BEB-S1-01 / FB-R3-SEC-BE-B-01: W_old through A32 replacement chains ─────────

    it('210-A32 (ARC S1-01 probe): old debt 100.000; A32 +10.000 three times on the pre-checkout fnb line (chain of 3) + window charge 70.000 raised to 75.000 → W 105.000, O 100.000; reverse 834.000 → O 934.000; J15 → O = B', async () => {
      const s = await x.checkedOutStay({ big: 834_000 });
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      await asPre0076(s);
      await x.at(`${s.departure}T15:30:00+07:00`);
      let big = await liveFnb(s, 834_000);
      for (let i = 0; i < 3; i++) big = await raiseLive(s, 'fnb', big, 10_000);
      expect(await due(s)).toBe(130_000);
      expect(await open(s), 'the 30.000 increase is a window charge').toBe(100_000);
      const late = await x.lateCharge(s, 70_000, s.departure);
      await raiseLive(s, 'fnb', late, 5_000);
      expect(await due(s)).toBe(205_000);
      expect(await open(s), 'W = 30.000 + 75.000').toBe(100_000);
      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
      expect(await due(s)).toBe(1_039_000);
      expect(await open(s)).toBe(934_000);
      await x.at(`${D(s, 1)}T11:00:00+07:00`);
      expect(await j15(s)).toBe('closed_with_debt');
      expect(await open(s)).toBe(1_039_000);
    }, 180_000);

    it('FB-R3-SEC-BE-B-01 (SEC S5): old debt 100.000; MGR raises the room line 1.000 at a time, 60 times → O stays 100.000 at every step; past the chain cap (64) the line counts 0 in W → O never below 100.000', async () => {
      const s = await x.checkedOutStay();
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      await asPre0076(s);
      let room = ((await x.liveLineIds(s, 'room')) as any[])[0].id as string;
      for (let i = 1; i <= 70; i++) {
        room = await raiseLive(s, 'room', room, 1_000);
        const o = await open(s);
        if (i <= 60) expect(o, `after A32 #${i}`).toBe(100_000);
        else expect(o, `after A32 #${i} (chain cap)`).toBeGreaterThanOrEqual(100_000);
        expect(o).toBeLessThanOrEqual(await due(s));
      }
    }, 300_000);

    it('209-E (B = O): debt 100.000, no window charge → J15 only closes: no new record, nobody told again', async () => {
      const s = await x.checkedOutStay();
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      const before = await told(s);
      await x.at(`${D(s, 1)}T11:00:00+07:00`);
      // FB-R3-ARC-BEB-S1-02: through the real job (JobRunner) – its `hasOpenDebt` safety net (X = B, nothing written)
      const stats = await x.runJ15();
      expect(stats.closedWithDebt).toBeGreaterThanOrEqual(1);
      expect((await x.folio(s.folioId)).status).toBe('closed');
      expect(await debtAudits(s)).toEqual([100_000]);
      expect(await told(s)).toEqual(before);
      expect(await cycle(s)).toMatchObject({ rec: 100_000, due: D(s, 3) });
      expect(await open(s)).toBe(100_000);
    }, 120_000);
  },
);
