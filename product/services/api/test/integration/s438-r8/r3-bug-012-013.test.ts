/**
 * BUG-R3-012 (P0) + BUG-R3-013 (P1) – fuzz R3-Q30 final run, critic `s1-money-critic-final.md` B-1 / M-1 (BR-522 K11-06,
 * BR-427 (d), BR-525):
 * - 013: every change that LOWERS the credit of a settled folio re-plans its open refund requests – pending ones above
 *   the credit are cancelled `superseded` and the right amount asked again (an A32 request stays one: source, note,
 *   requester); with no credit left, an approved request not paid is closed (`superseded`, audited);
 * - 012: J15 waits (`waiting_refund`) only while there is money to pay back; a guest who now owes gets the debt
 *   recorded and the folio is closed, its "Cần chú ý" closed_reservation_credit resolved.
 * Fake clock, FAKE data only.
 */

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, type Stay, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  'BUG-R3-012/013 – open refunds follow the credit after check-out; J15 never waits on no credit',
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
        `SELECT id, amount_vnd::int AS amount, status, requested_by, required_role, refund_source, origin_actor_ids,
                auto_cancel_reason, reason_note
           FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
        [s.id],
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
    const creditItems = async (s: { id: string }) =>
      (
        await x.q(
          `SELECT count(*)::int AS n FROM attention_event
            WHERE kind = 'closed_reservation_credit' AND ref_id = $1 AND resolved_at IS NULL`,
          [s.id],
        )
      )[0].n as number;
    /** A void of the paid F&B line (A32 by the MGR) → the A32 refund request of that amount, approved by the OWNER. */
    const approvedA32Refund = async (big: number) => {
      const s = await x.checkedOutStay({ big });
      expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
      const [r] = await refunds(s);
      expect(r).toMatchObject({ amount: big, status: 'pending', refund_source: 'a32' });
      const ok = await decideRefund(r.id, 'approve', 'owner');
      expect(ok.statusCode, ok.body).toBe(200);
      return { s, r };
    };
    /** A posted line written straight in the table (no API, no hook) – what J15 alone must cope with. */
    const rawLine = async (s: Stay, amountVnd: number) => {
      const [src] = await x.q(
        `SELECT id FROM folio_line WHERE folio_id = $1 AND category = 'room' ORDER BY posted_at LIMIT 1`,
        [s.folioId],
      );
      await x.q(
        `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category, revenue_group,
           description, quantity, unit_price_vnd, amount_vnd, service_date, line_state, source, posted_at, created_at,
           post_checkout)
         SELECT $2, organization_id, property_id, folio_id, reservation_id, 'fnb', 'other', 'Phát sinh ghi thẳng', 1,
                $3, $3, service_date, 'posted', 'manual', $4, $4, true
           FROM folio_line WHERE id = $1`,
        [src.id, uuidv7(), amountVnd, new Date(`${s.departure}T16:00:00+07:00`)],
      );
    };

    it('BUG-R3-012 (QA repro): approved refund 300.000, a late charge 500.000 → the approved request is closed at once; past the window J15 records the 200.000 debt and closes', async () => {
      const { s, r } = await approvedA32Refund(300_000);
      await x.lateCharge(s, 500_000, s.departure);
      const f = await x.folio(s.folioId);
      expect(f.totals.balanceDueVnd).toBe(200_000);
      expect(await refunds(s)).toMatchObject([
        { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
      ]);
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      await x.runJ15();
      const after = await x.folio(s.folioId);
      expect({
        status: after.status,
        openDebtVnd: (await x.openDebtOf(s))?.openDebtVnd ?? 0,
      }).toEqual({ status: 'closed', openDebtVnd: 200_000 });
      expect(await creditItems(s)).toBe(0);
    }, 180_000);

    it('BUG-R3-012 (J15 alone): an approved request left with no credit (charge written with no hook) → J15 closes it, records the debt, closes the folio', async () => {
      const { s, r } = await approvedA32Refund(300_000);
      await rawLine(s, 500_000);
      expect((await refunds(s))[0]).toMatchObject({ id: r.id, status: 'approved' });
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      const stats = await x.runJ15();
      expect(stats.waitingRefund).toBe(0);
      expect(await refunds(s)).toMatchObject([
        { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
      ]);
      const after = await x.folio(s.folioId);
      expect({
        status: after.status,
        openDebtVnd: (await x.openDebtOf(s))?.openDebtVnd ?? 0,
      }).toEqual({ status: 'closed', openDebtVnd: 200_000 });
      expect(await creditItems(s)).toBe(0);
    }, 180_000);

    it('J15 still waits while there is money to pay back: approved 300.000, credit 200.000 after a 100.000 charge → kept, pay-out capped at 200.000', async () => {
      const { s, r } = await approvedA32Refund(300_000);
      await x.lateCharge(s, 100_000, s.departure);
      expect(await refunds(s)).toMatchObject([{ id: r.id, status: 'approved' }]);
      expect((await x.folio(s.folioId)).totals.creditVnd).toBe(200_000);
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      expect((await x.runJ15()).waitingRefund).toBeGreaterThanOrEqual(1);
      expect((await x.folio(s.folioId)).status).toBe('settled');
    }, 180_000);

    it('BUG-R3-013: a pending A32 request 300.000, a late charge 100.000 → cancelled `superseded`, 200.000 asked again (A32 source, note and requester kept)', async () => {
      const s = await x.checkedOutStay({ big: 300_000 });
      expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
      const [first] = await refunds(s);
      await x.lateCharge(s, 100_000, s.departure);
      expect(await refunds(s)).toMatchObject([
        { id: first.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
        {
          amount: 200_000,
          status: 'pending',
          refund_source: 'a32',
          requested_by: x.t.users.mgr!.id,
          origin_actor_ids: [x.t.users.mgr!.id],
          reason_note: first.reason_note,
        },
      ]);
      expect((await x.folio(s.folioId)).totals.creditVnd).toBe(200_000);
    }, 180_000);

    it('BUG-R3-013: a pending request and a late charge above the credit → cancelled, nothing asked again; J15 records the debt', async () => {
      const s = await x.checkedOutStay({ big: 300_000 });
      expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
      await x.lateCharge(s, 350_000, s.departure);
      expect(await refunds(s)).toMatchObject([
        { status: 'cancelled', auto_cancel_reason: 'superseded' },
      ]);
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      await x.runJ15();
      expect((await x.folio(s.folioId)).status).toBe('closed');
      expect((await x.openDebtOf(s))?.openDebtVnd).toBe(50_000);
    }, 180_000);
  },
);
