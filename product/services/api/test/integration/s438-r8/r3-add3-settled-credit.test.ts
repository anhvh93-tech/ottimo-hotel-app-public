/**
 * OpenAPI 0.3.8 bổ sung 3 (ARC s1-contracts 13.2 – FB-R3-ARC-FUZZ-01/02, BUG-R3-002; BR-522 K11-06, oracle I4) + SEC
 * FB-R3-SEC-FZ-01:
 * - a money change BY A PERSON on a settled folio that leaves an overpayment → ONE refund request by that person, same
 *   transaction (`FolioService.afterSettledMoneyChange` – adjustFolioLine, recordPayment, confirmPaymentReceived);
 * - money arriving with nobody behind it → no request (requested_by must be a person): J15 `waiting_refund` + "Cần chú
 *   ý"; the desk asks it with `createRefundRequest` on the SETTLED folio → MGR approves, pays out → J15 closes;
 * - `createRefundRequest` on a closed folio → 409 FOLIO_LOCKED;
 * - A32 raise leaving less credit than the open request → refundPlan cancels it `superseded` and asks the right amount;
 * - SEC FZ-01: a `debt_write_off` stored with `required_role` below manager (before BUG-R3-003) is still decided by
 *   MGR+ only.
 * Fake clock, FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AttachmentService } from '../../../src/modules/files/public/attachment.service';
import { TEST_PASSWORD } from '../../helpers/feature-app';
import { HAS_DB } from '../../helpers/tenant';
import { type Fx, type Stay, addDays, outcome, startFixture } from './fixture';

describe.skipIf(!HAS_DB)(
  '0.3.8 bổ sung 3 – overpayment after check-out (K11-06) + SEC FZ-01',
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
        `SELECT id, amount_vnd::int AS amount, reason_code, requested_by, required_role, status, origin_actor_id,
              reason_note, auto_cancel_reason
         FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
        [s.id],
      );
    const creditItems = async (s: { id: string }) =>
      (
        await x.q(
          `SELECT count(*)::int AS n FROM attention_event
          WHERE kind = 'closed_reservation_credit' AND ref_id = $1 AND resolved_at IS NULL`,
          [s.id],
        )
      )[0].n as number;
    const decideRefund = async (id: string, verb: 'approve' | 'reject', who: string) => {
      const [{ version }] = await x.q('SELECT version FROM approval_request WHERE id = $1', [id]);
      return x.c[who]!.send('POST', x.url(`/approval-requests/${id}/actions/${verb}`), {
        authMethod: 'password',
        secret: TEST_PASSWORD,
        expectedVersion: Number(version),
        ...(verb === 'reject' ? { reason: 'Không đồng ý hoàn' } : {}),
      });
    };
    const proof = (who: string, reservationId: string) =>
      x.db.withContext(
        { ...x.t.ctx(), userId: x.t.users[who]!.id, actorType: 'user' } as any,
        async (tx) =>
          (
            await x.fa.app
              .get(AttachmentService)
              .upload(
                tx,
                { userId: x.t.users[who]!.id, roles: x.t.users[who]!.roles },
                { purpose: 'refund_proof', reservationId },
                { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
              )
          ).id,
      );
    const nights = async (s: Stay) => {
      const live = await x.liveLineIds(s, 'room');
      return live.map((l: any) => ({ id: l.id as string, amount: l.amountVnd as number }));
    };

    it('QR confirmed by the desk after check-out, above what is due → refund request of exactly the excess, by that person', async () => {
      const s = await x.checkedOutStay();
      const now = new Date(`${s.departure}T15:00:00+07:00`);
      const qrId = uuidv7();
      // A QR shown at the desk at check-out (its money arrived later – the cash was taken meanwhile): FAKE row.
      await x.q(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, created_at, created_by,
         updated_at, qr_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, 'charge', 'vietqr', 'pending', 120000, 'pending', $7, $8, 'front_desk', $9,
               $8, $9, 'balance')`,
        [
          qrId,
          x.t.organizationId,
          x.t.propertyIds[0],
          `QR-ADD3-${qrId.slice(-6)}`,
          s.folioId,
          s.id,
          new Date(now.getTime() + 86_400_000),
          x.t.users.fd!.id,
          new Date(`${s.departure}T10:30:00+07:00`),
        ],
      );
      const c = await x.c.fd!.send('POST', x.url(`/payments/${qrId}/actions/confirm-received`), {
        note: 'Khách chuyển sau khi trả phòng',
      });
      expect(c.statusCode, c.body).toBe(200);
      const f = await x.folio(s.folioId);
      expect({ status: f.status, credit: f.totals.creditVnd }).toEqual({
        status: 'settled',
        credit: 120_000,
      });
      expect(await refunds(s)).toMatchObject([
        {
          amount: 120_000,
          reason_code: 'overpayment',
          requested_by: x.t.users.fd!.id,
          required_role: 'manager',
          status: 'pending',
          origin_actor_id: null,
        },
      ]);
      expect(await creditItems(s)).toBe(1);
    }, 180_000);

    it('recordPayment by the desk above what is due after check-out → refund request by the desk (K11-06)', async () => {
      const s = await x.checkedOutStay();
      const p = await x.pay(s.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 50_000,
        note: 'Khách đưa thừa',
      });
      expect(p.statusCode, p.body).toBe(201);
      expect(await refunds(s)).toMatchObject([
        { amount: 50_000, requested_by: x.t.users.fd!.id, status: 'pending' },
      ]);
      expect(await creditItems(s)).toBe(1);
    }, 180_000);

    it('money with nobody behind it → no request; J15 waiting_refund + item → FD createRefundRequest on the SETTLED folio → MGR approves, the lead pays → J15 closes', async () => {
      const s = await x.checkedOutStay();
      const id = uuidv7();
      const at = new Date(`${s.departure}T16:00:00+07:00`);
      await x.at(at.toISOString());
      // A gateway payment confirmed automatically (no person – the future INT path, nothing to reconcile): FAKE row.
      await x.q(
        `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, provider, provider_txn_id, received_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'charge', 'vnpay', 'not_required', 50000, 'succeeded', 'vnpay', $8, $7, $7,
               $7)`,
        [
          id,
          x.t.organizationId,
          x.t.propertyIds[0],
          `PAY-AUTO-${id.slice(-6)}`,
          s.folioId,
          s.id,
          at,
          `FAKE-TXN-${id.slice(-8)}`,
        ],
      );
      expect(await refunds(s)).toEqual([]);
      // The stay's own transfer has arrived in the bank (the overpayment is backed by settled money – DOM BE-14 b/c).
      await x.q(
        `UPDATE payment SET reconciliation = 'reconciled', reconciled_at = $2, reconciled_by = $3,
              reconciled_by_role = 'manager', version = version + 1
        WHERE id = $1`,
        [s.transferId, at, x.t.users.mgr!.id],
      );
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      expect((await x.runJ15()).waitingRefund).toBeGreaterThanOrEqual(1);
      expect((await x.folio(s.folioId)).status).toBe('settled');
      expect(await creditItems(s)).toBe(1);

      // The desk asks it on the settled folio (window over – J15 waits for it).
      const over = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/refund-requests`), {
        amountVnd: 60_000,
        reason: 'Khách trả thừa qua cổng',
      });
      expect(over.statusCode, over.body).toBe(422);
      expect(over.json().max).toBe(50_000);
      const r = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/refund-requests`), {
        amountVnd: 50_000,
        reason: 'Khách trả thừa qua cổng',
      });
      expect(r.statusCode, r.body).toBe(201);
      const [req] = await refunds(s);
      expect(req).toMatchObject({
        amount: 50_000,
        requested_by: x.t.users.fd!.id,
        status: 'pending',
      });
      const dest = await x.c.fd!.send(
        'PUT',
        x.url(`/approval-requests/${req.id}/refund-destination`),
        { method: 'cash' },
      );
      expect(dest.statusCode, dest.body).toBe(200);
      const ok = await decideRefund(req.id, 'approve', 'mgr');
      expect(ok.statusCode, ok.body).toBe(200);
      // Paid out by another desk person (never the requester – SEC F8).
      const paid = await x.c.lead!.send(
        'POST',
        x.url(`/approval-requests/${req.id}/actions/execute-cash-refund`),
        {
          amountVnd: 50_000,
          paidAt: new Date(`${addDays(s.departure, 1)}T13:00:00+07:00`).toISOString(),
          attachmentId: await proof('lead', s.id),
        },
      );
      expect(outcome(paid)).toMatch(/^20/);
      await x.at(`${addDays(s.departure, 1)}T14:00:00+07:00`);
      await x.runJ15();
      const f = await x.folio(s.folioId);
      expect({ status: f.status, credit: f.totals.creditVnd }).toEqual({
        status: 'closed',
        credit: 0,
      });
    }, 180_000);

    it('createRefundRequest on a closed folio → 409 FOLIO_LOCKED', async () => {
      const s = await x.checkedOutStay();
      await x.at(`${addDays(s.departure, 1)}T13:00:00+07:00`);
      await x.runJ15();
      expect((await x.folio(s.folioId)).status).toBe('closed');
      const r = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/refund-requests`), {
        amountVnd: 10_000,
        reason: 'Thử',
      });
      expect(r.statusCode, r.body).toBe(409);
      expect(r.json().code).toBe('FOLIO_LOCKED');
    }, 180_000);

    it('FUZZ-02: an A32 raise leaves less credit than the open request → cancelled `superseded`, the right amount asked again (A32 origin kept)', async () => {
      const s = await x.checkedOutStay();
      const [n1, n2] = await nights(s);
      const low = await x.adjust(s, n1!.id, { newUnitPriceVnd: n1!.amount - 100_000 })();
      expect(outcome(low)).toMatch(/^201/);
      const [first] = await refunds(s);
      expect(first).toMatchObject({
        amount: 100_000,
        requested_by: x.t.users.mgr!.id,
        origin_actor_id: x.t.users.mgr!.id,
        status: 'pending',
      });
      const raise = await x.adjust(s, n2!.id, { newUnitPriceVnd: n2!.amount + 40_000 })();
      expect(outcome(raise)).toMatch(/^201/);
      const after = await refunds(s);
      expect(after).toMatchObject([
        { id: first.id, status: 'cancelled', auto_cancel_reason: 'superseded' },
        {
          amount: 60_000,
          status: 'pending',
          origin_actor_id: x.t.users.mgr!.id,
          reason_note: first.reason_note,
        },
      ]);
      expect((await x.folio(s.folioId)).totals.creditVnd).toBe(60_000);
      // The person behind the A32 never decides the replacement.
      const self = await decideRefund(after[1].id, 'approve', 'mgr');
      expect(self.statusCode, self.body).toBe(403);
    }, 180_000);

    it('SEC FZ-01: a pending debt_write_off stored with required_role front_desk_lead → the lead cannot approve nor reject (403)', async () => {
      const s = await x.checkedOutStay();
      const [n1] = await nights(s);
      const id = uuidv7();
      const now = new Date(`${s.departure}T15:00:00+07:00`);
      await x.q(
        `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
         target_code, folio_line_id, amount_vnd, reason_code, reason_note, requested_by, requested_at, required_role,
         created_at, created_by, updated_at)
       VALUES ($1, $2, $3, 'foc', 'pending', 'reservation', $4, $5, $6, 10000, 'debt_write_off', 'Dòng cũ', $7, $8,
               'front_desk_lead', $8, $7, $8)`,
        [id, x.t.organizationId, x.t.propertyIds[0], s.id, s.code, n1!.id, x.t.users.mgr!.id, now],
      );
      for (const verb of ['approve', 'reject'] as const) {
        const r = await x.decide(id, verb, 'lead')();
        expect(r.statusCode, r.body).toBe(403);
        expect(r.json().code).toBe('APPROVAL_LIMIT_EXCEEDED');
      }
      const [row] = await x.q('SELECT status FROM approval_request WHERE id = $1', [id]);
      expect(row.status).toBe('pending');
    }, 180_000);
  },
);
