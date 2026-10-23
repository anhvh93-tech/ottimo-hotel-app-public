/**
 * R3 Sprint 1 – lượt kiểm tiền bước 3 (BE-B), phần `folio-lines.service.ts` của BUG-R2-208 (R3-Q19): N-7 by the
 * number (ARC `openapi-0.3.7.md` 16.31.1) + N-15 (past `post_checkout_window_until` = `closed`).
 * Rule: on a `settled` folio inside its window, A32 that REDUCES a line (void, lower price, lower quantity; the
 * reduction = line before − after) is allowed when the reduction ≤ W = max(0, B) − O (B = còn phải thu, O =
 * `openDebtVnd`); above → 409 FOLIO_LOCKED for every role, nothing written; O = 0 → as a stay without debt. Increase
 * → 201. Oracle: DOM `round-03/outputs/DOM/s1-money-oracle.md` mục 4 (208-A, B, C, D, F, G) = fixture BR-525-29…32.
 * SEC `round-03/outputs/SEC/s1-security-requirements.md` D.3 (a)(b) are 208-C; D.3 (c) (two reductions at once) is
 * serialised by If-Match + L3 – the case below runs them one after the other on the same state.
 * NOT in this commit (208 rest – ARC 5.1 bước 3): `openDebt` null when O = 0 (→ 208-E FOC 409), `cycleOpenDebtVnd`
 * export, `Folio.totals.openDebtVnd`. Merge only after 210/209 are green and SEC reviewed the head SHA (SEC D.2).
 * Time mapping as `r3-debt-210-209.test.ts` (out at 11:00, window until D+1 11:00). Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  'R3-Q19 – BUG-R2-208 (folio-lines): A32 reduction on a settled folio by the number (ARC 16.31.1) + N-15',
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
    const voidLine = (s: S, lineId: string, who = 'mgr') =>
      x.adjust(s, lineId, { voidLine: true, reason: 'Ghi nhầm khoản' }, undefined, who)();
    const lower = async (s: S, lineId: string, byVnd: number, who = 'mgr') => {
      const line = ((await x.folio(s.folioId)).lines as any[]).find((l) => l.id === lineId);
      return x.adjust(
        s,
        lineId,
        { newUnitPriceVnd: line.unitPriceVnd - byVnd, reason: 'Sửa giá ghi thừa' },
        undefined,
        who,
      )();
    };
    const raise = async (s: S, lineId: string, byVnd: number) => {
      const before = ((await x.folio(s.folioId)).lines as any[]).find((l) => l.id === lineId);
      const r = await x.adjust(s, lineId, {
        newUnitPriceVnd: before.unitPriceVnd + byVnd,
        reason: 'Sửa giá ghi thiếu',
      })();
      expect(outcome(r)).toMatch(/^201/);
      const live = await x.liveLineIds(s, before.category);
      return live.find(
        (l: any) =>
          l.unitPriceVnd === before.unitPriceVnd + byVnd && l.serviceDate === before.serviceDate,
      ).id as string;
    };
    /** 208-A/B start: minibar 70.000 at 15:00, MGR reverses 100.000 at 17:00 → B 170.000, O 100.000, W 70.000. */
    const start = async (minibarAfterReversal = false) => {
      const s = await x.checkedOutStay();
      let m = '';
      if (!minibarAfterReversal) m = await x.lateCharge(s, 70_000, s.departure);
      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      if (minibarAfterReversal) m = await x.lateCharge(s, 70_000, s.departure);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 170_000, O: 100_000 });
      return { s, m };
    };
    const money = async (s: S) =>
      (
        await x.q(
          `SELECT (SELECT count(*)::int FROM folio_line WHERE folio_id = $1) AS lines,
                  (SELECT version FROM folio WHERE id = $1) AS version`,
          [s.folioId],
        )
      )[0];

    it('208-A (BR-525-29): FD collects 100.000 → O 0, W 70.000; MGR voids the minibar written by mistake → 201, B 0 (also with the minibar posted after the reversal)', async () => {
      for (const after of [false, true]) {
        const { s, m } = await start(after);
        expect((await x.collect(s, 100_000)()).statusCode).toBe(201);
        expect({ B: await due(s), O: await open(s) }).toEqual({ B: 70_000, O: 0 });
        expect(outcome(await voidLine(s, m))).toMatch(/^201/);
        expect(await due(s)).toBe(0);
      }
    }, 120_000);

    it('208-B (BR-525-30): FD collects only 50.000 → B 120.000, O 50.000, W 70.000; void minibar 70.000 → 201, B = O = 50.000; then any 1 đồng less → 409 FOLIO_LOCKED (OWN too), nothing written; variant: lowering the room line by 80.000 from the start → 409, B stays 120.000', async () => {
      const { s, m } = await start();
      expect((await x.collect(s, 50_000)()).statusCode).toBe(201);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 120_000, O: 50_000 });
      expect(outcome(await voidLine(s, m))).toMatch(/^201/);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 50_000, O: 50_000 });
      const room = await x.roomLineOf(s);
      const before = await money(s);
      for (const who of ['mgr', 'owner']) {
        const r = await lower(s, room, 1, who);
        expect(r.statusCode, r.body).toBe(409);
        expect(r.json().code).toBe('FOLIO_LOCKED');
      }
      expect(await money(s)).toEqual(before);
      expect(await due(s)).toBe(50_000);

      const v = await start();
      expect((await x.collect(v.s, 50_000)()).statusCode).toBe(201);
      const r = await lower(v.s, await x.roomLineOf(v.s), 80_000);
      expect(r.json().code).toBe('FOLIO_LOCKED');
      expect(await due(v.s)).toBe(120_000);
    }, 120_000);

    it('208-C (BR-525-31, SEC D.3 a/b): debt 5.000.000, MGR self-applies a write-off of 600.000 → O 4.400.000; A32 +10.000 × 9 on the line carrying it → B 4.490.000, O stays 4.400.000; void the debt line → 409; −90.001 → 409; −90.000 → 201, B = O = 4.400.000', async () => {
      const s = await x.checkedOutStay({ big: 5_000_000 });
      expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
      expect(outcome(await x.writeOff(s, s.bigLineId!, 600_000)())).toBe('201 approved eff 600000');
      expect(await open(s)).toBe(4_400_000);
      let line = s.bigLineId!;
      for (let i = 0; i < 9; i++) {
        line = await raise(s, line, 10_000);
        expect(await open(s), `after A32 #${i + 1}`).toBe(4_400_000);
      }
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 4_490_000, O: 4_400_000 });
      const before = await money(s);
      const v = await voidLine(s, line);
      expect(v.json().code).toBe('FOLIO_LOCKED');
      expect((await lower(s, line, 90_001)).json().code).toBe('FOLIO_LOCKED');
      expect(await money(s)).toEqual(before);
      expect(outcome(await lower(s, line, 90_000))).toMatch(/^201/);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 4_400_000, O: 4_400_000 });
      // the allowed reduction is audited with the numbers it was decided on (SEC D.4)
      const [a] = await x.q(
        `SELECT before, after FROM audit_event WHERE action = 'folio_line.adjusted' AND entity_id = $1`,
        [line],
      );
      expect(a.before).toMatchObject({ openDebtVnd: 4_400_000, windowVnd: 90_000 });
      expect(a.after).toMatchObject({ reducedVnd: 90_000 });
    }, 180_000);

    it('208-D (BR-525-32): reverse 100.000 → O 100.000; A32 +10.000 → W 10.000; FD collects 100.000 → O 0; MGR lowers 10.000 → 201, B 0 – A32 and the receipt in either order', async () => {
      for (const order of ['A32 first', 'collect first'] as const) {
        const s = await x.checkedOutStay();
        expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
        let room = await x.roomLineOf(s);
        if (order === 'A32 first') {
          room = await raise(s, room, 10_000);
          expect((await x.collect(s, 100_000)()).statusCode).toBe(201);
        } else {
          expect((await x.collect(s, 100_000)()).statusCode).toBe(201);
          room = await raise(s, room, 10_000);
        }
        expect({ B: await due(s), O: await open(s) }, order).toEqual({ B: 10_000, O: 0 });
        expect(outcome(await lower(s, room, 10_000)), order).toMatch(/^201/);
        expect(await due(s), order).toBe(0);
      }
    }, 120_000);

    it('208-F (N-15): window over at D+1 11:00, J15 not run yet (folio still settled) → MGR lowering the minibar = 409 FOLIO_LOCKED (as closed), nothing written', async () => {
      const s = await x.checkedOutStay();
      const m = await x.lateCharge(s, 70_000, s.departure);
      await x.at(`${addDays(s.departure, 1)}T11:20:00+07:00`);
      expect((await x.folio(s.folioId)).status).toBe('settled');
      const before = await money(s);
      const r = await voidLine(s, m);
      expect(r.statusCode, r.body).toBe(409);
      expect(r.json().code).toBe('FOLIO_LOCKED');
      expect(await money(s)).toEqual(before);
      // inside the window the same void (no debt at all) is allowed
      const s2 = await x.checkedOutStay();
      const m2 = await x.lateCharge(s2, 70_000, s2.departure);
      expect(outcome(await voidLine(s2, m2))).toMatch(/^201/);
    }, 120_000);

    it('208-G (SEC D.3 c): void 70.000 and FD collects 50.000 on B 170.000 / O 100.000 / W 70.000 – both orders → 201, B ends 50.000 = O; and two reductions one after the other whose sum exceeds W → exactly one 409', async () => {
      for (const order of ['collect first', 'void first'] as const) {
        const { s, m } = await start();
        if (order === 'collect first') {
          expect((await x.collect(s, 50_000)()).statusCode).toBe(201);
          expect(outcome(await voidLine(s, m))).toMatch(/^201/);
        } else {
          expect(outcome(await voidLine(s, m))).toMatch(/^201/);
          expect(await due(s)).toBe(100_000);
          expect((await x.collect(s, 50_000)()).statusCode).toBe(201);
        }
        expect({ B: await due(s), O: await open(s) }, order).toEqual({ B: 50_000, O: 50_000 });
      }
      const { s, m } = await start(); // W 70.000
      const first = await lower(s, m, 40_000);
      // W left 30.000: lowering the room line by 40.000 more would cut into the debt
      const second = await lower(s, await x.roomLineOf(s), 40_000);
      expect([first.statusCode, second.statusCode]).toEqual([201, 409]);
      expect(second.json().code).toBe('FOLIO_LOCKED');
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 130_000, O: 100_000 });
    }, 180_000);

    it('increase on a settled folio with an open debt → 201 (A32 as before), O unchanged', async () => {
      const { s, m } = await start();
      await raise(s, m, 5_000);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 175_000, O: 100_000 });
    }, 60_000);
  },
);
