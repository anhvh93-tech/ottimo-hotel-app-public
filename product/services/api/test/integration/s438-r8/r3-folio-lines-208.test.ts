/**
 * R3 Sprint 1 – lượt kiểm tiền bước 3 (BE-B), phần `folio-lines.service.ts` của BUG-R2-208 (R3-Q19): N-7 by the
 * number (ARC `openapi-0.3.7.md` 16.31.1) + N-15 (past `post_checkout_window_until` = `closed`).
 * Rule: on a `settled` folio inside its window, A32 that REDUCES a line (void, lower price, lower quantity; the
 * reduction = line before − after) is allowed when the reduction ≤ W = max(0, B) − O (B = còn phải thu, O =
 * `openDebtVnd`); above → 409 FOLIO_LOCKED for every role, nothing written; O = 0 → as a stay without debt. Increase
 * → 201. Oracle: DOM `round-03/outputs/DOM/s1-money-oracle.md` mục 4 (208-A, B, C, D, F, G) = fixture BR-525-29…32.
 * SEC `round-03/outputs/SEC/s1-security-requirements.md` D.3 (a)(b) are 208-C; D.3 (c) (two reductions at once) is
 * read under L1 → L3 and serialised by If-Match: real races behind the folio lock below (FB-R3-SEC-BE-B-02).
 * Also here: `openDebt` null when O = 0 (208-E), no `debt_settled_at` read (ARC S1-04), pre-0076 debt keeps N-7 (SEC-01 b).
 * Not here: `Folio.totals.openDebtVnd`. Merge only after 210/209 + fix 210 are green and SEC reviewed the head SHA.
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
      expect(a.before).toMatchObject({
        openDebtVnd: 4_400_000,
        windowVnd: 90_000,
        actorRole: 'manager',
      });
      expect(a.after).toMatchObject({ reducedVnd: 90_000, openDebtVnd: 4_400_000 });
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

    // ───────── FB-R3-SEC-BE-B-01 (b): a debt written before 0076 keeps R2 N-7 ─────────
    const asPre0076 = (s: S) =>
      x.q(
        `UPDATE reservation SET debt_opened_at = NULL, debt_recorded_vnd = 0, debt_base_vnd = 0 WHERE folio_id = $1`,
        [s.folioId],
      );

    it('FB-R3-SEC-BE-B-01 (b): pre-0076 debt 100.000 + window charge 70.000 → even a reduction ≤ W (void the minibar, −1 đồng) is 409 until a debt record opens the cycle; after a G-4 record the cycle exists and 208 applies', async () => {
      const { s, m } = await start();
      await asPre0076(s);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 170_000, O: 100_000 });
      const before = await money(s);
      expect((await voidLine(s, m)).json().code).toBe('FOLIO_LOCKED');
      expect((await lower(s, m, 1)).json().code).toBe('FOLIO_LOCKED');
      expect(await money(s)).toEqual(before);
      // a new debt record (reversal of the cash receipt) opens the cycle → the window charge can be voided again
      expect((await x.reverse(s.cashId)()).statusCode).toBe(200);
      expect(outcome(await voidLine(s, m))).toMatch(/^201/);
      expect((await due(s)) - (await open(s))).toBe(0);
    }, 120_000);

    it('FB-R3-SEC-BE-B-01 (SEC S5): pre-0076 debt 100.000; MGR raises the room line 1.000 × 52 → O stays 100.000; voiding the room line → 409, nothing written', async () => {
      const s = await x.checkedOutStay();
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      await asPre0076(s);
      let room = ((await x.liveLineIds(s, 'room')) as any[])[0].id as string;
      for (let i = 0; i < 52; i++) room = await raise(s, room, 1_000);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 152_000, O: 100_000 });
      const before = await money(s);
      expect((await voidLine(s, room)).json().code).toBe('FOLIO_LOCKED');
      expect(await money(s)).toEqual(before);
    }, 300_000);

    it('ARC probe 2: pre-0076 debt 100.000, A32 decrease 834.000 → 800.000 on a pre-checkout line → 409, O 100.000', async () => {
      const s = await x.checkedOutStay({ big: 834_000 });
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      await asPre0076(s);
      expect((await lower(s, s.bigLineId!, 34_000)).json().code).toBe('FOLIO_LOCKED');
      expect(await open(s)).toBe(100_000);
    }, 120_000);

    it('208-E: debt paid back to 0 (O = 0, W 70.000) → MGR debt_write_off → 409 FOLIO_LOCKED (no debt to write off – was 422 max 0)', async () => {
      const { s, m } = await start();
      expect((await x.collect(s, 100_000)()).statusCode).toBe(201);
      expect(await x.openDebtOf(s)).toBeNull();
      const w = await x.writeOff(s, m, 10_000)();
      expect(w.statusCode, w.body).toBe(409);
      expect(w.json().code).toBe('FOLIO_LOCKED');
    }, 120_000);

    // ───────── FB-R3-SEC-BE-B-02: real races behind the folio lock (both orders = the sequence), deadlocks +0 ─────────

    const bounded = (st: any) => {
      expect(st.due).toBeGreaterThanOrEqual(st.openDebtVnd ?? 0);
      expect(st.credit).toBe(0);
    };

    it('race: void minibar 70.000 ‖ lower the room line 40.000, same If-Match (B 170.000 / O 100.000 / W 70.000) → exactly one 201, O 100.000', async () => {
      await x.race(
        '208 reduce ‖ reduce',
        async () => {
          const { s, m } = await start();
          const room = await x.roomLineOf(s);
          const unit = ((await x.folio(s.folioId)).lines as any[]).find(
            (l) => l.id === room,
          ).unitPriceVnd;
          const etag = await x.etagOf(s.folioId);
          return {
            s,
            a: x.adjust(s, m, { voidLine: true }, etag),
            b: x.adjust(s, room, { newUnitPriceVnd: unit - 40_000 }, etag),
          };
        },
        (order, seq, st) => {
          expect(seq.filter((o) => o.startsWith('201')).length, order).toBe(1);
          expect(st.openDebtVnd, order).toBe(100_000);
          bounded(st);
        },
        2,
      );
    }, 300_000);

    it('race: void minibar 70.000 ‖ MGR reverses a 300.000 transfer (G-4) → both orders = the sequence; O never below 100.000', async () => {
      await x.race(
        '208 reduce ‖ reverse',
        async () => {
          const s = await x.checkedOutStay({ big: 300_000 }); // fixed amounts: runs are compared across stays
          const m = await x.lateCharge(s, 70_000, s.departure);
          await x.at(`${s.departure}T17:00:00+07:00`);
          expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
          const etag = await x.etagOf(s.folioId);
          return { s, a: x.adjust(s, m, { voidLine: true }, etag), b: x.reverse(s.bigTransferId!) };
        },
        (order, _seq, st) => {
          expect(st.openDebtVnd, order).toBeGreaterThanOrEqual(100_000);
          bounded(st);
        },
        2,
      );
    }, 300_000);

    it('race: void a window charge ‖ OWN approves a pending debt_write_off of 3.000.000 (debt 5.000.000) → both orders = the sequence; O = 2.000.000 once approved', async () => {
      await x.race(
        '208 reduce ‖ approve write-off',
        async () => {
          const s = await x.checkedOutStay({ big: 5_000_000 });
          expect((await x.reverse(s.bigTransferId!)()).statusCode).toBe(200);
          const late = await x.lateCharge(s, 70_000, s.departure);
          const w = await x.writeOff(s, s.bigLineId!, 3_000_000)();
          expect(outcome(w)).toBe('201 pending eff 3000000');
          const etag = await x.etagOf(s.folioId);
          return {
            s,
            a: x.adjust(s, late, { voidLine: true }, etag),
            b: x.decide(w.json().id, 'approve'),
          };
        },
        (order, seq, st) => {
          expect(seq[1], order).toMatch(/^200 approved/);
          expect(st.openDebtVnd, order).toBe(2_000_000);
          bounded(st);
        },
        2,
      );
    }, 300_000);

    it('increase on a settled folio with an open debt → 201 (A32 as before), O unchanged', async () => {
      const { s, m } = await start();
      await raise(s, m, 5_000);
      expect({ B: await due(s), O: await open(s) }).toEqual({ B: 175_000, O: 100_000 });
    }, 60_000);
  },
);
