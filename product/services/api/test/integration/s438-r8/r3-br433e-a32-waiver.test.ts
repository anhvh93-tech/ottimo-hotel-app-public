/**
 * BR-433 (e) v0.4.3 (SEC FB-R3-SEC-FZ-02) – an A32 REDUCTION on a settled folio by someone below the owner is a waiver.
 * Oracle: DOM `round-03/outputs/DOM/s1-money-oracle.md` mục 5.5 FZ02-1…8 + I17 (fixture rows BR-433-16…19,
 * `pendingFix R3-SEC-FZ-02`), on the fixture's checked-out stays (2 equal nights N – the first 8 stays of a fixture
 * arrive on a Monday; paid in full, O 0, W 0, protected basis N):
 * - (1) the reduction adds to Σ of ESC-026 (threshold = the protected basis; owner's own reductions not counted);
 * - (2) the refund it produces = only that reduction's part of the overpayment; Σ of A32 refunds of the folio (approved +
 *   pending + new, not rejected / cancelled) > basis, or no basis → owner; else another manager / owner;
 * - (3) `reason_note` "Tự sinh từ A32: …", requested_by = origin = the person who made the A32 – never its approver.
 * FZ02-3 runs on an F&B line above the basis (a 2-night stay has no 2-night void in one A32); FZ02-5 (a FOC during the
 * stay + a reduction after) is the same Σ code path as FZ02-2 and is left to the fuzz family (QA). Fake clock, FAKE data.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, type Stay, addDays, outcome, startFixture } from './fixture';

const NOTE =
  /^Tự sinh từ A32: void dòng (tiền phòng \d{2}\/\d{2}|ăn uống \d{2}\/\d{2}) [\d.]+ – .+ – lý do: Sửa theo khách$/;
const vnd = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

describe.skipIf(!HAS_DB)(
  'BR-433 (e) – A32 reduction after check-out is a waiver (FZ02-1…8, I17)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
    });
    afterAll(async () => {
      await x?.close();
    });

    const refunds = (s: { id: string }) =>
      x.q(
        `SELECT id, amount_vnd::int AS amount, requested_by, required_role, status, origin_actor_id, reason_note
         FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
        [s.id],
      );
    const alerted = async (s: { id: string }) =>
      (await x.q('SELECT 1 FROM foc_stay_alert WHERE stay_root_reservation_id = $1', [s.id]))
        .length > 0;
    const reductions = (s: Stay) =>
      x.q(
        `SELECT reduced_vnd::int AS vnd, actor_role AS role FROM folio_settled_reduction
        WHERE folio_id = $1 ORDER BY created_at, id`,
        [s.folioId],
      );
    const decideRefund = async (id: string, verb: 'approve' | 'reject', who: string) => {
      const [{ version }] = await x.q('SELECT version FROM approval_request WHERE id = $1', [id]);
      return x.c[who]!.send('POST', x.url(`/approval-requests/${id}/actions/${verb}`), {
        authMethod: 'password',
        secret: TEST_PASSWORD,
        expectedVersion: Number(version),
        ...(verb === 'reject' ? { reason: 'Không đồng ý hoàn' } : {}),
      });
    };
    /** The stay's two nights – equal (Monday arrival), N each. */
    const nights = async (s: Stay) => {
      const live = (await x.liveLineIds(s, 'room')).map((l: any) => ({
        id: l.id as string,
        amount: l.amountVnd as number,
      }));
      expect(live).toHaveLength(2);
      expect(live[0]!.amount).toBe(live[1]!.amount);
      return { n1: live[0]!, n2: live[1]!, N: live[0]!.amount };
    };
    const voidLine = (s: Stay, lineId: string, who = 'mgr') =>
      x.adjust(s, lineId, { voidLine: true }, undefined, who)();

    it('FZ02-1: MGR voids one night → ONE A32 refund N by the MGR, manager level (Σ = basis); that MGR → 403, another MGR → 200; Σ ESC-026 = N = threshold → no alert', async () => {
      const s = await x.checkedOutStay();
      const { n1, N } = await nights(s);
      expect(outcome(await voidLine(s, n1.id))).toMatch(/^201/);
      const [r] = await refunds(s);
      expect(r).toMatchObject({
        amount: N,
        requested_by: x.t.users.mgr!.id,
        origin_actor_id: x.t.users.mgr!.id,
        required_role: 'manager',
        status: 'pending',
      });
      expect(r.reason_note).toMatch(NOTE);
      expect(r.reason_note).toContain(`tiền phòng`);
      expect(r.reason_note).toContain(` ${vnd(N)} – `);
      expect(await reductions(s)).toEqual([{ vnd: N, role: 'manager' }]);
      expect(await alerted(s)).toBe(false);
      const self = await decideRefund(r.id, 'approve', 'mgr');
      expect(self.statusCode, self.body).toBe(403);
      expect(self.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
      const lead = await decideRefund(r.id, 'approve', 'lead');
      expect(lead.statusCode, lead.body).toBe(403);
      const other = await decideRefund(r.id, 'approve', 'mgr2');
      expect(other.statusCode, other.body).toBe(200);
    }, 180_000);

    it('FZ02-2: then the MGR voids a paid F&B line 70.000 → second A32 refund 70.000, Σ N + 70.000 > N → OWNER; Σ ESC-026 > N → owner told', async () => {
      const s = await x.checkedOutStay({ big: 70_000 });
      const { n1, N } = await nights(s);
      expect(outcome(await voidLine(s, n1.id))).toMatch(/^201/);
      expect(outcome(await voidLine(s, s.bigLineId!))).toMatch(/^201/);
      const rs = await refunds(s);
      expect(rs).toMatchObject([
        { amount: N, required_role: 'manager', status: 'pending' },
        {
          amount: 70_000,
          required_role: 'owner',
          status: 'pending',
          origin_actor_id: x.t.users.mgr!.id,
        },
      ]);
      expect(rs[1].reason_note).toMatch(NOTE);
      expect(rs[1].reason_note).toContain('ăn uống');
      expect(await alerted(s)).toBe(true);
      const mgr2 = await decideRefund(rs[1].id, 'approve', 'mgr2');
      expect(mgr2.statusCode, mgr2.body).toBe(403);
      expect(mgr2.json().code).toBe('APPROVAL_LIMIT_EXCEEDED');
      const own = await decideRefund(rs[1].id, 'approve', 'owner');
      expect(own.statusCode, own.body).toBe(200);
    }, 180_000);

    it('FZ02-3 (F&B above the basis): the MGR voids a paid line 1.500.000 > N → A32 refund 1.500.000 waits for the OWNER; owner told', async () => {
      const s = await x.checkedOutStay({ big: 1_500_000 });
      const { N } = await nights(s);
      expect(N).toBeLessThan(1_500_000);
      expect(outcome(await voidLine(s, s.bigLineId!))).toMatch(/^201/);
      expect(await refunds(s)).toMatchObject([
        { amount: 1_500_000, required_role: 'owner', origin_actor_id: x.t.users.mgr!.id },
      ]);
      expect(await alerted(s)).toBe(true);
    }, 180_000);

    it('FZ02-4: the MGR voids every night → no basis left: the refund that empties it waits for the OWNER; owner told', async () => {
      const s = await x.checkedOutStay();
      const { n1, n2, N } = await nights(s);
      expect(outcome(await voidLine(s, n1.id))).toMatch(/^201/);
      expect(outcome(await voidLine(s, n2.id))).toMatch(/^201/);
      expect(await refunds(s)).toMatchObject([
        { amount: N, required_role: 'manager' },
        { amount: N, required_role: 'owner' },
      ]);
      expect(await reductions(s)).toEqual([
        { vnd: N, role: 'manager' },
        { vnd: N, role: 'manager' },
      ]);
      expect(await alerted(s)).toBe(true);
    }, 180_000);

    it('FZ02-6: the OWNER voids a night herself → not counted (no A32 origin, no alert); the refund follows the plain BR-522 path', async () => {
      const s = await x.checkedOutStay();
      const { n1, N } = await nights(s);
      expect(outcome(await voidLine(s, n1.id, 'owner'))).toMatch(/^201/);
      const [r] = await refunds(s);
      expect(r).toMatchObject({
        amount: N,
        requested_by: x.t.users.owner!.id,
        origin_actor_id: null,
        required_role: 'manager',
      });
      expect(r.reason_note).toBeNull();
      expect(await alerted(s)).toBe(false);
    }, 180_000);

    it('FZ02-7: a charge posted after check-out (unpaid, W) voided by the MGR → no overpayment, no refund; Σ ESC-026 +70.000 (≤ N, no alert)', async () => {
      const s = await x.checkedOutStay();
      const late = await x.lateCharge(s, 70_000, s.departure);
      expect(outcome(await voidLine(s, late))).toMatch(/^201/);
      expect(await refunds(s)).toEqual([]);
      expect(await reductions(s)).toEqual([{ vnd: 70_000, role: 'manager' }]);
      expect(await alerted(s)).toBe(false);
    }, 180_000);

    it('FZ02-8: FZ02-1, the OWNER rejects the N refund; the MGR voids the F&B 70.000 → refund 70.000 ONLY (Σ = 70.000 → manager); the credit N + 70.000 stays, J15 does not close', async () => {
      const s = await x.checkedOutStay({ big: 70_000 });
      const { n1, N } = await nights(s);
      expect(outcome(await voidLine(s, n1.id))).toMatch(/^201/);
      const [r1] = await refunds(s);
      const no = await decideRefund(r1.id, 'reject', 'owner');
      expect(no.statusCode, no.body).toBe(200);
      expect(outcome(await voidLine(s, s.bigLineId!))).toMatch(/^201/);
      expect(await refunds(s)).toMatchObject([
        { id: r1.id, status: 'rejected' },
        { amount: 70_000, required_role: 'manager', status: 'pending' },
      ]);
      expect((await x.folio(s.folioId)).totals.creditVnd).toBe(N + 70_000);
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      await x.runJ15();
      expect((await x.folio(s.folioId)).status).toBe('settled');
      const [item] = await x.q(
        `SELECT count(*)::int AS n FROM attention_event
        WHERE kind = 'closed_reservation_credit' AND ref_id = $1 AND resolved_at IS NULL`,
        [s.id],
      );
      expect(item.n).toBe(1);
    }, 180_000);

    it('BB07-1 / I16 guard: a night raised by hand after check-out then lowered back is not a waiver (nothing recorded)', async () => {
      const s = await x.checkedOutStay();
      const { n1, N } = await nights(s);
      expect(outcome(await x.adjust(s, n1.id, { newUnitPriceVnd: N + 500_000 })())).toMatch(/^201/);
      const raised = (await x.liveLineIds(s, 'room')).find((l: any) => l.amountVnd === N + 500_000);
      expect(outcome(await x.adjust(s, raised.id, { newUnitPriceVnd: N })())).toMatch(/^201/);
      expect(await reductions(s)).toEqual([]);
      expect(await refunds(s)).toEqual([]);
    }, 180_000);
  },
);
