/**
 * After BUG-R3-012/013 (reviews `s1-ARC-on-bug-012-013.md`, `s1-SEC-on-bug-012-013.md`; contract 0.3.8 bổ sung 6):
 * - ARC FB-R3-ARC-BUG012-01: `approveRequest` of a refund asking more than the credit still free (rawCreditVnd − the
 *   other approved refunds not paid) re-plans (the request `superseded`, the right amount asked again) and answers 409
 *   INVALID_TRANSITION (currentState cancelled, autoCancelReason superseded) – nothing approved;
 * - SEC FB-1213-01: a replacement never needs a LOWER level than what it replaces;
 * - SEC FB-1213-02: the OWNER's action replacing a request keeps the old requester (else nobody could decide it – F8).
 * Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, type Stay, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  'BUG-R3-012/013 follow-ups – approval guard, replacement level and requester',
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
        `SELECT id, amount_vnd::int AS amount, status, requested_by, required_role, refund_source, auto_cancel_reason
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
    /** A posted charge written straight in the table – a path that forgot the K11-06 rule. */
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
    const postLine = (s: Stay, amountVnd: number, who: string) =>
      x.c[who]!.send('POST', x.url(`/folios/${s.folioId}/lines`), {
        category: 'fnb',
        description: 'Phát sinh sau trả phòng',
        quantity: 1,
        unitPriceVnd: amountVnd,
        serviceDate: s.departure,
      });
    const maxNight = async (s: Stay) =>
      Math.max(
        ...((await x.liveLineIds(s, 'room')) as any[]).map((l: any) => l.amountVnd as number),
      );

    it('ARC BUG012-01: pending refund 300.000, the credit drops to 100.000 by a path with no hook → approve → 409 superseded, nothing approved; 100.000 asked again (same source, same requester)', async () => {
      const s = await x.checkedOutStay({ big: 300_000 });
      expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
      const [r] = await refunds(s);
      expect(r).toMatchObject({ amount: 300_000, status: 'pending', required_role: 'manager' });
      await rawLine(s, 200_000);
      const res = await decideRefund(r.id, 'approve', 'mgr2');
      expect(res.statusCode, res.body).toBe(409);
      expect(res.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'cancelled',
        autoCancelReason: 'superseded',
      });
      expect(await refunds(s)).toMatchObject([
        { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
        {
          amount: 100_000,
          status: 'pending',
          refund_source: 'a32',
          requested_by: x.t.users.mgr!.id,
        },
      ]);
      // Within the credit: approved as usual.
      const [, again] = await refunds(s);
      const ok = await decideRefund(again.id, 'approve', 'mgr2');
      expect(ok.statusCode, ok.body).toBe(200);
    }, 180_000);

    it('ARC BUG012-01: the credit still free counts the OTHER approved refunds not paid', async () => {
      const s = await x.checkedOutStay({ big: 300_000 });
      expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
      const [r1] = await refunds(s);
      expect((await decideRefund(r1.id, 'approve', 'mgr2')).statusCode).toBe(200);
      // A receipt above what is due → a second request 50.000 (owner – the folio has an A32).
      const p = await x.pay(s.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 50_000,
        note: 'Khách đưa thừa',
      });
      expect(p.statusCode, p.body).toBe(201);
      const [, r2] = await refunds(s);
      expect(r2).toMatchObject({ amount: 50_000, status: 'pending' });
      // 30.000 written with no hook: credit 320.000, 300.000 already approved → free 20.000 < 50.000.
      await rawLine(s, 30_000);
      const res = await decideRefund(r2.id, 'approve', 'owner');
      expect(res.statusCode, res.body).toBe(409);
      const all = await refunds(s);
      expect(all).toMatchObject([
        { id: r1.id, status: 'approved' },
        { id: r2.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
        { amount: 20_000, status: 'pending' },
      ]);
    }, 180_000);

    it('SEC FB-1213-01: an OWNER-level A32 request replaced at an amount the manager could decide stays OWNER', async () => {
      const s = await x.checkedOutStay({ big: 3_000_000 });
      const N = await maxNight(s);
      // Lower the F&B line by N + 100.000 → A32 refund above the basis → owner.
      const low = await x.adjust(s, s.bigLineId!, { newUnitPriceVnd: 3_000_000 - (N + 100_000) })();
      expect(outcome(low)).toMatch(/^201/);
      const [r] = await refunds(s);
      expect(r).toMatchObject({
        amount: N + 100_000,
        required_role: 'owner',
        refund_source: 'a32',
      });
      // A late charge 200.000 → replaced by N − 100.000 (≤ basis: re-routed alone it would be manager).
      const l = await postLine(s, 200_000, 'fd');
      expect(l.statusCode, l.body).toBe(201);
      expect(await refunds(s)).toMatchObject([
        { id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
        { amount: N - 100_000, status: 'pending', required_role: 'owner', refund_source: 'a32' },
      ]);
    }, 180_000);

    it('SEC FB-1213-02: the OWNER posting a charge that replaces a desk-made request keeps the desk as requester – the owner can still decide it', async () => {
      const s = await x.checkedOutStay({ big: 300_000 });
      expect(outcome(await x.adjust(s, s.bigLineId!, { voidLine: true })())).toMatch(/^201/);
      const [r1] = await refunds(s);
      expect((await decideRefund(r1.id, 'approve', 'mgr2')).statusCode).toBe(200);
      const p = await x.pay(s.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 50_000,
        note: 'Khách đưa thừa',
      });
      expect(p.statusCode, p.body).toBe(201);
      const [, r2] = await refunds(s);
      expect(r2).toMatchObject({
        amount: 50_000,
        requested_by: x.t.users.fd!.id,
        required_role: 'owner',
        refund_source: 'other',
      });
      const l = await postLine(s, 30_000, 'owner');
      expect(l.statusCode, l.body).toBe(201);
      const all = await refunds(s);
      expect(all[1]).toMatchObject({
        id: r2.id,
        status: 'cancelled',
        auto_cancel_reason: 'superseded',
      });
      expect(all[2]).toMatchObject({
        amount: 20_000,
        status: 'pending',
        requested_by: x.t.users.fd!.id,
        required_role: 'owner',
      });
      const own = await decideRefund(all[2].id, 'approve', 'owner');
      expect(own.statusCode, own.body).toBe(200);
    }, 180_000);
  },
);
