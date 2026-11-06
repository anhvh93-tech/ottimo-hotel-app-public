/**
 * PR-B1 (Round 5, v1.0.5, BE-B) on PostgreSQL – contract 0.3.13 V5-13, V5-18, V5-44 (a) + bổ sung 1 (BE C0313-11, 13, 14):
 * - V5-44 (a) T44-1: every `409 FOLIO_LOCKED` carries `lockReason` – `settled`, `post_checkout_window_over` (N-15),
 *   `closed` (J15), `debt_reduction_requires_write_off` (BR-525), `invoice_issued` (BE 11); a debt collection on a
 *   folio still OPEN is `409 INVALID_TRANSITION currentState open`, not a lock (BE 11);
 * - V5-13 T13-1, T13-2, T13-3, T13-5: `CheckoutSummary.openRefunds` / `Folio.totals.openRefunds` – the open refund
 *   requests of the stay by reason, whoever asked; partly paid → the rest; fully paid → empty;
 *   creditVnd − unhandledCreditVnd = min(creditVnd, Σ openVnd) (BE 14);
 * - V5-18 T18-1, T18-2: `Reservation.depositUnverifiedVnd` = the deposits waiting for reconciliation; 0 once
 *   reconciled. T18-4 (the cap) is a unit in pr-b1-units.test.ts;
 * - T13-4 / T18-3 over HTTP by role (FB-R5-SEC-BE-B1-01, SEC probe P1; SR-AZ-04): on a CTV booking the CTV reads
 *   its folio and booking without `openRefunds` / `depositUnverifiedVnd`, the sale gets 404, both get 403 on the
 *   check-out summary, FD sees both. The serializer units stay in pr-b1-units.test.ts.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { PaymentService } from '../../src/modules/payments/public/payment.service';
import { TEST_PASSWORD } from '../helpers/feature-app';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, addDays, startFixture } from './s438-r8/fixture';

describe.skipIf(!HAS_DB)('PR-B1 – lockReason, openRefunds, depositUnverifiedVnd', () => {
  let x: Fx;
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory'; // refund proof attachments
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  const expectLocked = (r: any, lockReason: string) => {
    expect(r.statusCode, r.body).toBe(409);
    expect(r.json()).toMatchObject({ code: 'FOLIO_LOCKED', lockReason });
  };
  const lowerRoom = async (s: { folioId: string; id: string }, by = 10_000, who = 'mgr') => {
    const roomLine = await x.roomLineOf(s as any);
    const line = ((await x.folio(s.folioId)).lines as any[]).find((l) => l.id === roomLine);
    return x.adjust(
      s as any,
      roomLine,
      { newUnitPriceVnd: line.unitPriceVnd - by, reason: 'Sửa giá ghi thừa' },
      undefined,
      who,
    )();
  };
  const addLine = (s: { folioId: string; departure: string }, who = 'fd') =>
    x.c[who]!.send('POST', x.url(`/folios/${s.folioId}/lines`), {
      category: 'fnb',
      description: 'Nước suối',
      quantity: 1,
      unitPriceVnd: 20_000,
      serviceDate: s.departure,
    });
  /** A direct booking made by FD with a cash deposit (the required one when `deposit` is below it). */
  const book = async (
    roomNo: string,
    arrivalDate: string,
    departureDate: string,
    deposit: number,
  ) => {
    const body = {
      roomId: x.ids.rooms[roomNo],
      channelId: x.ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'direct',
      arrivalDate,
      departureDate,
    };
    const send = (amountVnd: number) =>
      x.c.fd!.send('POST', x.url('/reservations'), {
        ...body,
        initialPayment: { type: 'deposit', method: 'cash', amountVnd },
      });
    let res = await send(deposit);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await send(res.json().depositRequiredVnd);
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as { id: string; code: string; version: number; folioId: string };
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
  const openSum = (rows: Array<{ openVnd: number }>) => rows.reduce((a, r) => a + r.openVnd, 0);

  describe('V5-44 (a) – lockReason on every FOLIO_LOCKED (T44-1)', () => {
    it('settled: a FOC request on a settled folio without debt', async () => {
      const s = await x.checkedOutStay();
      const r = await x.c.fd!.send(
        'POST',
        x.url(`/folios/${s.folioId}/lines/${await x.roomLineOf(s)}/foc`),
        { kind: 'foc', amountVnd: 10_000, reasonCode: 'regular_vip', note: 'Khách quen' },
      );
      expectLocked(r, 'settled');
    });

    it('post_checkout_window_over: past the window, J15 not run yet (adjust and add a line)', async () => {
      const s = await x.checkedOutStay();
      await x.at(`${addDays(s.departure, 1)}T11:20:00+07:00`);
      expect((await x.folio(s.folioId)).status).toBe('settled');
      const adj = await lowerRoom(s);
      expectLocked(adj, 'post_checkout_window_over');
      // Kept for the logs only – the Desk reads lockReason (V5-44).
      expect(adj.json().detail).toBe('post-checkout window over (BR-427 d)');
      expectLocked(await addLine(s), 'post_checkout_window_over');
    });

    it('closed: after J15 (adjust, add a line, refund request)', async () => {
      const s = await x.checkedOutStay();
      await x.at(`${addDays(s.departure, 1)}T12:00:00+07:00`);
      await x.runJ15();
      expect((await x.folio(s.folioId)).status).toBe('closed');
      expectLocked(await lowerRoom(s), 'closed');
      expectLocked(await addLine(s), 'closed');
      const refund = await x.c.fd!.send('POST', x.url(`/folios/${s.folioId}/refund-requests`), {
        amountVnd: 10_000,
        reason: 'Khách xin hoàn',
      });
      expectLocked(refund, 'closed');
    });

    it('debt_reduction_requires_write_off: a reduction above W while a debt is open (BR-525)', async () => {
      const s = await x.checkedOutStay();
      await x.at(`${s.departure}T17:00:00+07:00`);
      expect((await x.reverse(s.transferId)()).statusCode).toBe(200);
      expect((await x.openDebtOf(s))?.openDebtVnd).toBe(100_000);
      const r = await lowerRoom(s, 1_000);
      expectLocked(r, 'debt_reduction_requires_write_off');
      expect(r.json().detail).toMatch(/BR-525/);
    });

    it('invoice_issued: the e-invoice request of a folio whose invoice is issued (BE 11)', async () => {
      const s = await x.checkedOutStay();
      const put = () =>
        x.c.fd!.send('PUT', x.url(`/folios/${s.folioId}/invoice-request`), {
          buyerType: 'individual',
        });
      const first = await put();
      expect(first.statusCode, first.body).toBe(200);
      await x.q(`UPDATE invoice_request SET einvoice_status = 'issued' WHERE folio_id = $1`, [
        s.folioId,
      ]);
      expectLocked(await put(), 'invoice_issued');
    });

    it('BE 11: a debt collection on a folio still OPEN → INVALID_TRANSITION currentState open, nothing written', async () => {
      // Not reachable through recordPayment (it collects a debt only on a folio that is not open): the guard of the
      // shared receipt path, called as payments calls it.
      await x.at('2026-12-01T10:00:00+07:00');
      const b = await book('302', '2026-12-10', '2026-12-12', 1_000_000);
      const fd = x.t.users.fd!;
      const count = async () =>
        (await x.q(`SELECT count(*)::int AS n FROM payment WHERE folio_id = $1`, [b.folioId]))[0]
          .n as number;
      const before = await count();
      const err = await x.db
        .withContext({ ...x.t.ctx(), userId: fd.id, actorType: 'user' } as any, (tx) =>
          x.fa.app
            .get(PaymentService)
            .recordInTx(
              tx,
              { userId: fd.id, roles: fd.roles } as any,
              b.folioId,
              { type: 'charge', method: 'cash', amountVnd: 10_000 } as any,
              {
                reservationId: b.id,
                reservationCode: b.code,
                channelGroup: null,
                reservationCreatedAt: new Date(),
                debtCollection: true,
              },
            ),
        )
        .then(
          () => null,
          (e: any) => e,
        );
      expect(err?.code).toBe('INVALID_TRANSITION');
      expect(err?.options?.extras).toEqual({ currentState: 'open' });
      expect(await count()).toBe(before);
    });
  });

  describe('V5-13 – openRefunds (T13-1, T13-2, T13-3, T13-5)', () => {
    it('T13-1, T13-5: FD makes the B16 refund, the lead and MGR read the summary → early_departure + overpayment lines; Σ = credit − unhandled', async () => {
      await x.at('2026-11-20T10:00:00+07:00');
      const b = await book('301', '2026-11-24', '2026-11-28', 1_000_000);
      await x.at('2026-11-24T15:00:00+07:00');
      await x.q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [x.ids.rooms['301']]);
      const due = (await x.folio(b.folioId)).totals.balanceDueVnd as number;
      expect(
        (await x.pay(b.folioId, { type: 'charge', method: 'cash', amountVnd: due })).statusCode,
      ).toBe(201);
      const ci = await x.act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      expect(ci.statusCode, ci.body).toBe(200);
      // B16 by FD: 4 nights → 2, notice the day before → 50 % of the dropped nights asked back (`early_departure`).
      await x.at('2026-11-25T10:00:00+07:00');
      const ed = await x.act(b.id, 'early-departure', {
        newDepartureDate: '2026-11-26',
        noticeGivenAt: '2026-11-25T10:00:00+07:00',
      });
      expect(ed.statusCode, ed.body).toBe(200);
      const early = ed.json().refundVnd as number;
      expect(early).toBeGreaterThan(0);
      // The guest also paid 200.000 too much; FD asks 150.000 of it back (`overpayment`).
      const extra = await x.pay(b.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 200_000,
        note: 'Khách trả dư, hoàn khi trả phòng',
      });
      expect(extra.statusCode, extra.body).toBe(201);
      const req = await x.c.fd!.send('POST', x.url(`/folios/${b.folioId}/refund-requests`), {
        amountVnd: 150_000,
        reason: 'Khách xin hoàn phần trả dư',
      });
      expect(req.statusCode, req.body).toBe(201);
      await x.at('2026-11-26T09:00:00+07:00');
      const expected = [
        { reasonCode: 'early_departure', openVnd: early },
        { reasonCode: 'overpayment', openVnd: 150_000 },
      ];
      for (const who of ['lead', 'mgr', 'owner', 'fd']) {
        const sum = await x.c[who]!.get(x.url(`/reservations/${b.id}/checkout-summary`));
        expect(sum.statusCode, `${who} ${sum.body}`).toBe(200);
        const j = sum.json();
        expect(j.openRefunds, who).toEqual(expected);
        expect({ creditVnd: j.creditVnd, unhandledCreditVnd: j.unhandledCreditVnd }, who).toEqual({
          creditVnd: early + 200_000,
          unhandledCreditVnd: 50_000,
        });
        expect(j.creditVnd - j.unhandledCreditVnd).toBe(
          Math.min(j.creditVnd, openSum(j.openRefunds)),
        );
      }
      // The folio says the same (same query).
      const f = await x.folio(b.folioId);
      expect(f.totals.openRefunds).toEqual(expected);
      expect(f.totals.unhandledCreditVnd).toBe(50_000);
    });

    it('T13-2, T13-3: a cancellation refund (FD) – open in full, partly paid → the rest, fully paid → empty', async () => {
      await x.at('2026-11-20T10:00:00+07:00');
      const b = await book('203', '2027-01-11', '2027-01-18', 1_600_000);
      const cancel = await x.c.fd!.send(
        'POST',
        x.url(`/reservations/${b.id}/actions/cancel`),
        { reasonCode: 'found_other', note: 'Khách báo qua Zalo' },
        { 'if-match': `"${b.version}"` },
      );
      expect(cancel.statusCode, cancel.body).toBe(200);
      const approvalId = cancel.json().cancellation.refundApprovalRequestId as string;
      const asked = cancel.json().cancellation.refundRequestVnd as number;
      expect(approvalId).toEqual(expect.any(String));
      expect(asked).toBeGreaterThan(400_000);
      const totals = async (who = 'lead') =>
        (await x.c[who]!.get(x.url(`/folios/${b.folioId}`))).json().totals;
      // Made by FD, read by the lead, MGR and OWN: the reason code of the cancellation, amounts only.
      for (const who of ['lead', 'mgr', 'owner']) {
        expect((await totals(who)).openRefunds, who).toEqual([
          { reasonCode: 'found_other', openVnd: asked },
        ]);
      }
      const dest = await x.c.fd!.send(
        'PUT',
        x.url(`/approval-requests/${approvalId}/refund-destination`),
        { method: 'cash' },
      );
      expect(dest.statusCode, dest.body).toBe(200);
      const [{ version }] = await x.q('SELECT version FROM approval_request WHERE id = $1', [
        approvalId,
      ]);
      const ok = await x.c.mgr!.send(
        'POST',
        x.url(`/approval-requests/${approvalId}/actions/approve`),
        { authMethod: 'password', secret: TEST_PASSWORD, expectedVersion: Number(version) },
      );
      expect(ok.statusCode, ok.body).toBe(200);
      const payOut = async (amountVnd: number) =>
        x.c.lead!.send(
          'POST',
          x.url(`/approval-requests/${approvalId}/actions/execute-cash-refund`),
          {
            amountVnd,
            paidAt: new Date(x.fa.clock.now()).toISOString(),
            attachmentId: await proof('lead', b.id),
          },
        );
      const part = await payOut(400_000);
      expect(part.statusCode, part.body).toBe(201);
      const t2 = await totals();
      expect(t2.openRefunds).toEqual([{ reasonCode: 'found_other', openVnd: asked - 400_000 }]);
      expect(t2.creditVnd - t2.unhandledCreditVnd).toBe(
        Math.min(t2.creditVnd, openSum(t2.openRefunds)),
      );
      const rest = await payOut(asked - 400_000);
      expect(rest.statusCode, rest.body).toBe(201);
      // Empty = nothing waiting (present, not absent).
      expect((await totals()).openRefunds).toEqual([]);
    });
  });

  describe('T13-4 / T18-3 – the two FD+ amounts over HTTP, by role (FB-R5-SEC-BE-B1-01)', () => {
    it('CTV booking, transfer deposit waiting, FD cancels: CTV 200 without the fields, SAL 404, both 403 on the summary; FD sees both', async () => {
      await x.at('2026-11-20T10:00:00+07:00');
      const body = {
        roomId: x.ids.rooms['203'],
        channelId: x.ids.channels.collaborator,
        closerUserId: x.t.users.ctv!.id,
        adults: 2,
        bookerGuestId: x.guest,
        paymentModel: 'direct',
        arrivalDate: '2027-03-08',
        departureDate: '2027-03-15',
      };
      const create = (amountVnd: number) =>
        x.c.fd!.send('POST', x.url('/reservations'), {
          ...body,
          initialPayment: { type: 'deposit', method: 'cash', amountVnd },
        });
      let res = await create(1_000_000);
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
        res = await create(res.json().depositRequiredVnd);
      }
      expect(res.statusCode, res.body).toBe(201);
      const b = res.json() as { id: string; version: number; folioId: string };
      const tr = await x.pay(b.folioId, {
        type: 'deposit',
        method: 'bank_transfer',
        amountVnd: 200_000,
      });
      expect(tr.statusCode, tr.body).toBe(201);
      expect(tr.json().reconciliation).toBe('pending');

      const get = (who: string, path: string) => x.c[who]!.get(x.url(path));
      const booking = `/reservations/${b.id}`;
      const folio = `/folios/${b.folioId}`;
      const summary = `/reservations/${b.id}/checkout-summary`;
      /** The roles below FD+: the CTV who closed the booking reads it, the sale who did not gets 404. */
      const belowFdPlus = async () => {
        for (const path of [booking, folio]) {
          const ctv = await get('ctv', path);
          expect(ctv.statusCode, `ctv ${path} ${ctv.body}`).toBe(200);
          expect(ctv.body, `ctv ${path}`).not.toMatch(/openRefunds|depositUnverified/);
          const sal = await get('sal', path);
          expect(sal.statusCode, `sal ${path} ${sal.body}`).toBe(404);
          expect(sal.body, `sal ${path}`).not.toMatch(/openRefunds|depositUnverified/);
        }
        for (const who of ['ctv', 'sal']) {
          const r = await get(who, summary);
          expect(r.statusCode, `${who} summary ${r.body}`).toBe(403);
          expect(r.body, `${who} summary`).not.toMatch(/openRefunds|depositUnverified/);
        }
      };

      // T18-3: the transfer is waiting – FD sees it, the CTV sees what it may (depositPaidVnd) and nothing more.
      const fdView = (await get('fd', booking)).json();
      expect(fdView.depositUnverifiedVnd).toBe(200_000);
      const ctvView = (await get('ctv', booking)).json();
      expect(ctvView.depositPaidVnd).toBe(fdView.depositPaidVnd);
      expect(ctvView).not.toHaveProperty('depositUnverifiedVnd');
      await belowFdPlus();

      // T13-4: FD cancels → a refund request is open; only FD+ reads it.
      const cancel = await x.c.fd!.send(
        'POST',
        x.url(`/reservations/${b.id}/actions/cancel`),
        { reasonCode: 'found_other', note: 'Khách báo qua Zalo' },
        { 'if-match': `"${b.version}"` },
      );
      expect(cancel.statusCode, cancel.body).toBe(200);
      const asked = cancel.json().cancellation.refundRequestVnd as number;
      expect(asked).toBeGreaterThan(0);
      for (const who of ['fd', 'lead', 'mgr', 'owner']) {
        const f = await get(who, folio);
        expect(f.statusCode, `${who} ${f.body}`).toBe(200);
        expect(f.json().totals.openRefunds, who).toEqual([
          { reasonCode: 'found_other', openVnd: asked },
        ]);
        expect((await get(who, booking)).json().depositUnverifiedVnd, who).toBe(200_000);
      }
      const ctvFolio = (await get('ctv', folio)).json();
      expect(ctvFolio.totals).toBeDefined();
      expect(ctvFolio.totals).not.toHaveProperty('openRefunds');
      await belowFdPlus();
    });
  });

  describe('V5-18 – depositUnverifiedVnd (T18-1, T18-2)', () => {
    it('two deposits, the transfer waiting → that amount; reconciled → 0', async () => {
      await x.at('2026-11-20T10:00:00+07:00');
      const b = await book('202', '2026-12-15', '2026-12-17', 300_000);
      const view = async (who = 'fd') =>
        (await x.c[who]!.get(x.url(`/reservations/${b.id}`))).json();
      const cash = (await view()).depositPaidVnd as number;
      expect((await view()).depositUnverifiedVnd).toBe(0);
      const tr = await x.pay(b.folioId, {
        type: 'deposit',
        method: 'bank_transfer',
        amountVnd: 200_000,
      });
      expect(tr.statusCode, tr.body).toBe(201);
      expect(tr.json().reconciliation).toBe('pending');
      for (const who of ['fd', 'lead', 'mgr', 'owner']) {
        const v = await view(who);
        expect({ paid: v.depositPaidVnd, unverified: v.depositUnverifiedVnd }, who).toEqual({
          paid: cash + 200_000,
          unverified: 200_000,
        });
      }
      const rec = await x.c.mgr!.send(
        'POST',
        x.url(`/payments/${tr.json().id}/actions/reconcile`),
        { result: 'reconciled' },
        { 'if-match': `"${tr.json().version}"` },
      );
      expect(rec.statusCode, rec.body).toBe(200);
      expect((await view()).depositUnverifiedVnd).toBe(0);
    });
  });
});
