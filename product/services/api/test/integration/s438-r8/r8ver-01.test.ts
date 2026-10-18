/**
 * BUG-R2-207 (money recheck 8, R8VER-01) – oracle BR-525-28 (`tests/fixtures/br-examples.json`).
 * Cases C1, C2, C3, C6, C7 of the critic's `test/s438/v8-r8ver-0-1/r8ver01.test.ts` (tree f6803d0), moved by QA unchanged
 * except for the gate: they run once BR-525-28 has no `pendingFix`. (C0, C4, C5 are controls that already pass on
 * f6803d0; the same three scenarios are `r8ver/opendebt-probe`.)
 *
 * A posted `debt_write_off` FOC that is re-posted (its line corrected upward by A32 – the FOC follows its key: reversal +
 * new line) must count once in "written off":
 *  - G-4 reverse of the 100.000 transfer → debt 100.000 (window charges are not debt), write-off 30.000 → open 70.000.
 *    An A32 INCREASE inside the window is a window charge, not debt → open stays 70.000 (fnb line, room line, twice).
 *  - OWN approval of the whole open debt after an earlier write-off was re-posted applies the whole asked amount, no
 *    `applied_capped`; repeated A32 increases never drive the open debt to 0 (no auto-cancel `debt_cleared`).
 * Independent oracles: live write-off by SQL (posted FOC of a debt_write_off request, not a reversal, not reversed);
 * ledger balanceDue (API) = Σ posted lines − Σ succeeded payments (SQL).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays } from '../../../src/shared/time';
import { HAS_DB } from '../../helpers/tenant';
import { type Kit, log, setup } from './h';

const ORACLE = (
  JSON.parse(
    readFileSync(join(__dirname, '../../../../../tests/fixtures/br-examples.json'), 'utf8'),
  ) as {
    examples: Array<{ id: string; pendingFix?: string }>;
  }
).examples.find((e) => e.id === 'BR-525-28')!;
const PENDING = ORACLE.pendingFix;

describe.skipIf(!HAS_DB || Boolean(PENDING))(
  `BUG-R2-207 R8VER-01 – openDebtVnd after a debt_write_off FOC is re-posted (BR-525-28${PENDING ? `, pendingFix ${PENDING}` : ''})`,
  () => {
    let k: Kit;
    beforeAll(async () => {
      k = await setup();
    });
    afterAll(async () => {
      await k?.fa.close();
      await k?.db.close();
    });

    /** Independent: Σ of LIVE debt_write_off FOC (posted, not a reversal, not reversed) and the raw rows. */
    const writeOffs = async (folioId: string) => {
      const rows = await k.q(
        `SELECT l.id, l.amount_vnd::int AS amt, l.reversal_of_id IS NOT NULL AS is_reversal,
              EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id) AS reversed,
              l.approval_request_id IS NOT NULL AS linked, l.related_line_id
         FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted'
        ORDER BY l.posted_at, l.id`,
        [folioId],
      );
      const [live] = await k.q(
        `SELECT COALESCE(-sum(l.amount_vnd), 0)::int AS v FROM folio_line l
         JOIN approval_request a ON a.id = l.approval_request_id AND a.reason_code = 'debt_write_off'
        WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id)`,
        [folioId],
      );
      // What the code under test sums (checkout.service.ts debtReductionsVnd, "off" leg) – for the root cause.
      const [codeOff] = await k.q(
        `SELECT COALESCE(-sum(l.amount_vnd), 0)::int AS v FROM folio_line l
         JOIN approval_request a ON a.id = l.approval_request_id
        WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL AND a.reason_code = 'debt_write_off'`,
        [folioId],
      );
      return { rows, live: live.v as number, codeOff: codeOff.v as number };
    };
    /** Independent ledger: Σ posted lines − Σ succeeded own payments must equal the API balance due. */
    const ledger = async (folioId: string) => {
      const [m] = await k.q(
        `SELECT (SELECT COALESCE(sum(amount_vnd), 0)::bigint FROM folio_line WHERE folio_id = $1 AND line_state = 'posted') AS lines,
              (SELECT COALESCE(sum(CASE WHEN type = 'refund' THEN -amount_vnd ELSE amount_vnd END), 0)::bigint
                 FROM payment WHERE folio_id = $1 AND status = 'succeeded' AND reversal_of_id IS NULL
                   AND type <> 'security_deposit') AS paid`,
        [folioId],
      );
      const f = await k.folio(folioId);
      return { sqlDue: Number(m.lines) - Number(m.paid), apiDue: f.totals.balanceDueVnd as number };
    };
    const cycle = async (s: { id: string }) =>
      (
        await k.q(
          `SELECT debt_recorded_vnd::int AS rec, debt_base_vnd::int AS base FROM reservation WHERE id = $1`,
          [s.id],
        )
      )[0];

    const runA32 = async (folioId: string, lineId: string, plus: number) => {
      const line = ((await k.folio(folioId)).lines as any[]).find((l) => l.id === lineId);
      const r = await k.adjust(
        folioId,
        lineId,
        { newUnitPriceVnd: line.unitPriceVnd + plus, reason: 'Sửa giá ghi thiếu' },
        await k.etagOf(folioId),
      );
      expect(r.statusCode, r.body).toBe(201);
      // the current line of the key after the correction (A32 may re-post the line under a new id)
      const lines = (await k.folio(folioId)).lines as any[];
      const cur = lines.filter(
        (l) =>
          l.category === line.category &&
          l.lineState === 'posted' &&
          !l.reversalOfId &&
          l.serviceDate === line.serviceDate &&
          !lines.some((x) => x.reversalOfId === l.id),
      );
      return cur[cur.length - 1].id as string;
    };

    const scenario = async (
      a32: Array<{ on: 'fnb' | 'room'; plus: number }>,
      target: 'fnb' | 'room',
    ) => {
      const s = await k.checkedOut(); // out D 11:00, now D 15:00 (window until D+1 11:00)
      const fnb0 = (await k.addLine(s.folioId, 200_000, s.departure)).id; // window charge – not a debt
      await k.at(`${s.departure}T16:00:00+07:00`);
      expect((await k.reverse(s.transferId)).statusCode).toBe(200); // G-4 → debt 100.000
      const room0 = ((await k.folio(s.folioId)).lines as any[]).find(
        (l) => l.category === 'room' && l.lineState === 'posted' && !l.reversalOfId,
      ).id as string;
      const ids: Record<string, string> = { fnb: fnb0, room: room0 };
      const o0 = (await k.openDebtOf(s.folioId))?.openDebtVnd;
      const w = await k.writeOff(s.folioId, ids[target]!, 30_000);
      expect(w.statusCode, w.body).toBe(201);
      expect(w.json().status).toBe('approved');
      const o1 = (await k.openDebtOf(s.folioId))?.openDebtVnd;
      const steps: unknown[] = [];
      for (const x of a32) {
        ids[x.on] = await runA32(s.folioId, ids[x.on]!, x.plus);
        const wo = await writeOffs(s.folioId);
        steps.push({
          on: x.on,
          plus: x.plus,
          open: (await k.openDebtOf(s.folioId))?.openDebtVnd,
          live: wo.live,
          codeOff: wo.codeOff,
        });
      }
      const o2 = await k.openDebtOf(s.folioId);
      const wo = await writeOffs(s.folioId);
      const cyc = await cycle(s);
      const paidSince = (
        await k.q(
          `SELECT count(*)::int AS n FROM payment WHERE folio_id = $1 AND reversal_of_id IS NULL AND created_at > $2`,
          [s.folioId, new Date(`${s.departure}T15:59:00+07:00`)],
        )
      )[0].n;
      // hand oracle (BE-A 22.1 with the LIVE write-off): recorded − (paid since + live − base). paid since = 0.
      const oracleOpen = Math.max(0, Math.min(cyc.rec - (wo.live - 0), o2?.balanceDueVnd ?? 0));
      const big = await k.writeOff(s.folioId, ids.fnb!, 99_000_000);
      const led = await ledger(s.folioId);
      await k.at(`${addDays(s.departure, 1)}T11:01:00+07:00`);
      const o3 = await k.openDebtOf(s.folioId);
      const led3 = await ledger(s.folioId);
      const out = {
        a32,
        target,
        o0,
        o1,
        steps,
        cycle: cyc,
        paidSince,
        focRows: wo.rows.map((r: any) => [r.amt, r.is_reversal, r.reversed, r.linked]),
        live: wo.live,
        codeOff: wo.codeOff,
        oracleOpen,
        o2: o2 ? { open: o2.openDebtVnd, due: o2.balanceDueVnd } : null,
        submitCap: [big.statusCode, big.json().errors?.[0]?.code, big.json().max],
        ledger: led,
        afterWindow: o3 ? { open: o3.openDebtVnd, due: o3.balanceDueVnd } : null,
        ledger3: led3,
      };
      log('V8-SCN', out);
      return out;
    };

    it('C1 A32 +50.000 on the fnb line carrying the write-off (FOC re-posted) → open must stay 70.000', async () => {
      const r = await scenario([{ on: 'fnb', plus: 50_000 }], 'fnb');
      expect([r.o0, r.o1]).toEqual([100_000, 70_000]);
      expect(r.live, 'live write-off (independent)').toBe(30_000);
      expect(r.oracleOpen).toBe(70_000);
      expect(r.ledger.apiDue).toBe(r.ledger.sqlDue);
      expect.soft(r.o2?.open, 'openDebtVnd after the FOC moved').toBe(70_000);
      expect.soft(r.submitCap, 'submit cap').toEqual([422, 'AMOUNT_EXCEEDS_BALANCE', 70_000]);
    });

    it('C2 A32 +50.000 on the ROOM line carrying the write-off → open must stay 70.000', async () => {
      const r = await scenario([{ on: 'room', plus: 50_000 }], 'room');
      expect(r.live).toBe(30_000);
      expect(r.ledger.apiDue).toBe(r.ledger.sqlDue);
      expect.soft(r.o2?.open, 'openDebtVnd after the FOC moved').toBe(70_000);
      expect.soft(r.submitCap, 'submit cap').toEqual([422, 'AMOUNT_EXCEEDS_BALANCE', 70_000]);
    });

    it('C3 two A32 increases (+50.000, +20.000) on the fnb line → still 70.000 (no compounding)', async () => {
      const r = await scenario(
        [
          { on: 'fnb', plus: 50_000 },
          { on: 'fnb', plus: 20_000 },
        ],
        'fnb',
      );
      expect(r.live).toBe(30_000);
      expect(r.ledger.apiDue).toBe(r.ledger.sqlDue);
      expect.soft(r.o2?.open, 'openDebtVnd after two re-posts').toBe(70_000);
    });

    const approveCase = async (withA32: boolean) => {
      const s = await k.inHouse(3); // 3 nights: the asked write-off is above one night → OWN
      await k.checkOut(s);
      await k.at(`${s.departure}T15:00:00+07:00`);
      const big = (await k.addLine(s.folioId, 3_000_000, s.departure)).id; // window charge
      await k.at(`${s.departure}T16:00:00+07:00`);
      const cash = Number(
        (await k.q('SELECT amount_vnd FROM payment WHERE id = $1', [s.cashId]))[0].amount_vnd,
      );
      expect((await k.reverse(s.cashId, 'Tiền giả')).statusCode).toBe(200); // G-4 → debt = cash
      const room = ((await k.folio(s.folioId)).lines as any[]).find(
        (l) => l.category === 'room' && l.lineState === 'posted' && !l.reversalOfId,
      );
      const open0 = (await k.openDebtOf(s.folioId))!.openDebtVnd;
      const w0 = await k.writeOff(s.folioId, room.id, 200_000);
      expect(w0.json().status, w0.body).toBe('approved');
      const open1 = (await k.openDebtOf(s.folioId))!.openDebtVnd;
      const w = await k.writeOff(s.folioId, big, open1);
      expect(w.statusCode, w.body).toBe(201);
      expect(w.json().status, w.body).toBe('pending');
      if (withA32) {
        const r = await k.adjust(
          s.folioId,
          room.id,
          { newUnitPriceVnd: room.unitPriceVnd + 50_000, reason: 'Sửa giá ghi thiếu' },
          await k.etagOf(s.folioId),
        );
        expect(r.statusCode, r.body).toBe(201);
      }
      const open2 = (await k.openDebtOf(s.folioId))!.openDebtVnd;
      const list = await k.c.owner!.get(k.url(`/approval-requests?status=pending&limit=50`));
      const pv = ((list.json().data ?? []) as any[]).find((x) => x.id === w.json().id);
      const preview = { statusCode: list.statusCode, json: () => pv ?? {} };
      const paidSince = (
        await k.q(
          `SELECT count(*)::int AS n FROM payment WHERE folio_id = $1 AND reversal_of_id IS NULL AND created_at > $2`,
          [s.folioId, new Date(`${s.departure}T15:59:00+07:00`)],
        )
      )[0].n;
      const a = await k.approve(w.json().id);
      const [cap] = await k.q(
        `SELECT applied_cap_vnd::int AS cap, status FROM approval_request WHERE id = $1`,
        [w.json().id],
      );
      const auds = await k.q(
        `SELECT reason, after FROM audit_event WHERE action = 'approval.applied_capped' AND entity_id = $1`,
        [w.json().id],
      );
      const after = await k.openDebtOf(s.folioId);
      const wo = await writeOffs(s.folioId);
      const led = await ledger(s.folioId);
      const again = await k.writeOff(s.folioId, big, 99_000_000);
      await k.at(`${addDays(s.departure, 1)}T11:01:00+07:00`);
      const late = await k.openDebtOf(s.folioId);
      const nightRate = Number(
        (await k.q(`SELECT limit_basis_vnd FROM approval_request WHERE id = $1`, [w.json().id]))[0]
          ?.limit_basis_vnd ?? 0,
      );
      const out = {
        withA32,
        cash,
        nightRate,
        open0,
        open1,
        asked: open1,
        open2,
        paidSince,
        preview: [preview.statusCode, preview.json().effectiveAmountVnd],
        approve: [a.statusCode, a.json().status, a.json().effectiveAmountVnd],
        cap,
        audits: auds,
        after: after ? { open: after.openDebtVnd, due: after.balanceDueVnd } : null,
        live: wo.live,
        codeOff: wo.codeOff,
        ledger: led,
        capInWindow: [again.statusCode, again.json().max],
        afterWindow: late ? { open: late.openDebtVnd, due: late.balanceDueVnd } : null,
      };
      log('V8-APPROVE', out);
      return out;
    };

    it('C6 with A32 +50.000 on the room line carrying the earlier write-off → OWN approval must apply the whole asked amount', async () => {
      const r = await approveCase(true);
      expect(r.open1).toBe(r.cash - 200_000);
      expect(r.paidSince, 'no receipt while waiting').toBe(0);
      expect(r.ledger.apiDue).toBe(r.ledger.sqlDue);
      expect.soft(r.open2, 'open debt after the room line +50.000').toBe(r.cash - 200_000);
      expect.soft(r.approve, 'approve').toEqual([200, 'approved', r.cash - 200_000]);
      expect.soft(r.cap.cap, 'applied_cap_vnd').toBe(r.cash - 200_000);
      expect.soft(r.audits, 'no applied_capped: nobody paid').toEqual([]);
      expect.soft(r.live, 'live write-off = whole debt').toBe(r.cash);
    });
    it('C7 repeated A32 increases (+10.000 × up to 8) on the room line carrying a write-off never drive openDebtVnd to 0 → OWN approval applies the whole pending write-off (not auto-cancelled debt_cleared while the guest still owes)', async () => {
      const s = await k.inHouse(3);
      await k.checkOut(s);
      await k.at(`${s.departure}T15:00:00+07:00`);
      const big = (await k.addLine(s.folioId, 3_000_000, s.departure)).id; // window charge
      await k.at(`${s.departure}T16:00:00+07:00`);
      const cash = Number(
        (await k.q('SELECT amount_vnd FROM payment WHERE id = $1', [s.cashId]))[0].amount_vnd,
      );
      expect((await k.reverse(s.cashId, 'Tiền giả')).statusCode).toBe(200); // G-4 → debt = cash
      let room = ((await k.folio(s.folioId)).lines as any[]).find(
        (l) => l.category === 'room' && l.lineState === 'posted' && !l.reversalOfId,
      ).id as string;
      const w0 = await k.writeOff(s.folioId, room, 500_000);
      expect(w0.json().status, w0.body).toBe('approved');
      const open1 = (await k.openDebtOf(s.folioId))!.openDebtVnd;
      const w = await k.writeOff(s.folioId, big, open1);
      expect(w.json().status, w.body).toBe('pending');
      const opens: number[] = [];
      for (let i = 0; i < 8; i++) {
        room = await runA32(s.folioId, room, 10_000);
        const o = (await k.openDebtOf(s.folioId))!.openDebtVnd;
        opens.push(o);
        if (o === 0) break;
      }
      const wo1 = await writeOffs(s.folioId);
      const a = await k.approve(w.json().id);
      const [row] = await k.q(
        `SELECT status, auto_cancel_reason, applied_cap_vnd FROM approval_request WHERE id = $1`,
        [w.json().id],
      );
      const wo2 = await writeOffs(s.folioId);
      const led = await ledger(s.folioId);
      const [cyc] = await k.q(
        `SELECT debt_recorded_vnd::int AS rec, debt_settled_at FROM reservation WHERE id = $1`,
        [s.id],
      );
      const out = {
        cash,
        open1,
        opens,
        liveBefore: wo1.live,
        codeOffBefore: wo1.codeOff,
        approve: [
          a.statusCode,
          a.json().status,
          a.json().autoCancelReason,
          a.json().effectiveAmountVnd,
        ],
        row,
        liveAfter: wo2.live,
        trueRemainingDebt: cyc.rec - wo2.live,
        settled: cyc.debt_settled_at,
        ledger: led,
      };
      log('V8-ZERO', out);
      expect(open1).toBe(cash - 500_000);
      expect(wo1.live, 'live write-off before approval').toBe(500_000);
      expect(led.apiDue).toBe(led.sqlDue);
      expect
        .soft(opens[opens.length - 1], 'open debt after the A32s (true: cash − 500.000)')
        .toBe(cash - 500_000);
      expect
        .soft([out.approve[0], out.approve[1], out.approve[3]], 'approve')
        .toEqual([200, 'approved', cash - 500_000]);
    });
  },
);
