/**
 * PR-B3 (Round 5, v1.0.5, BE-D2) – 5B-1 "Tiền về sau khi hủy" on PostgreSQL. Contract 0.3.13 bổ sung 1 mục 1.21 ý 3
 * (`recordPayment` (B), `createDepositNotice`, `resolveAttentionEvent`, `listAuditEvents.afterClosureOnly`), the answer
 * of FB-R5-ARC-BE-105-03 to DOM FB-R5-DOM-ARC-105-01, SEC S2–S8 + ARC-16/20, FB-R5-SEC-BE-127-02:
 * - t1–t7 (ARC 105-03): an OTA pay-at-hotel booking cancelled with a 500.000 fee (N = 500.000):
 *   - t1 card_pos 500.000 → 201, `reconciliation` pending, no refund, no image needed;
 *   - t2 card_pos 500.001 → 422 `amountVnd` AMOUNT_EXCEEDS_BALANCE, `max` 500.000;
 *   - t3 N = 0 (after t1) → 422 `method` NOT_IN_LIST;
 *   - t4 transfer 800.000 → refund 300.000; transfer 500.000 → no refund;
 *   - t5 two card_pos 300.000 forced to race on the folio lock → one 201, one 422 `max` 200.000;
 *   - t6 cash / ota_collect with N > 0 → 422 `method` NOT_IN_LIST; card_pos without `posAuthCode` → 422 REQUIRED;
 *   - t7 no-show keeping a service line (N > 0) → card_pos up to N, the same cap;
 * - `type` (5B-1): `deposit` for a booking cancelled while a hold, `charge` otherwise – the other one → 422 NOT_ALLOWED;
 * - the refund request (S2, S3): reason `payment_after_cancel`, requested by the recorder who is also in
 *   `origin_actor_ids`, destination `original_method` fixed by the server – setRefundDestination 409, cash pay-out
 *   409, the recorder never approves or pays (also on a new request after a rejection), pay-out only once the
 *   transfer is reconciled, then paid back to the transfer;
 * - "Có thể trùng" (S4 minimum, ARC-16): `Payment.possibleDuplicateCodes`, `ApprovalRequest.possibleDuplicateCodes`
 *   for FD+, never for a sale;
 * - createDepositNotice on a closed booking (S7) → 202 + one "Cần chú ý" `deposit_after_cancel` + notification to FD+
 *   (code only); a receipt recorded after it closes the item and the notice (`handled`);
 * - "Không thấy tiền" (S8, ARC-20): note required; money audit `attention_event.resolved` READ BACK from `audit_event`
 *   with `after = {kind, afterClosure}` only, and through `listAuditEvents?afterClosureOnly=true` with no `category`
 *   (the call of the OWN weekly screen);
 * - FB-R5-SEC-BE-127-02: the refund `accountHolder` goes through the shared invisible-character filter;
 * - PR-B3b (follow-up of the #148 reviews):
 *   - FB-R5-ARC-BE-148-01 P1 (DOM 11.4 3b): the after-closure transfer reversed → its 5B-1 request `superseded`, no new
 *     request, the "Cần chú ý" credit item closed; P2: whoever recorded money BEFORE the closure is never an origin
 *     actor (MGR approves the 5B-1 request);
 *   - FB-R5-SEC-BE-148-01: an OWN only among the origin actors pays a transfer refund inside the step-up window only
 *     (401 REAUTH_REQUIRED without it), flagged `ownSelfApprovedAndPaid` in the money log;
 *   - FB-R5-SEC-BE-148-03: S2 with an OWN recorder (never approves, never pays cash);
 *   - FB-R5-ARC-BE-148-03: the edges of "Có thể trùng" (same booking, card / cash, receipts before the closure on the
 *     refund request, 25 h apart) and a second receipt after closure that leaves a handled notice alone.
 *   A case that records money and then closes the booking MOVES THE CLOCK between the two: `AFTER_CLOSURE_SQL` compares
 *   `created_at >= cancelled_at`, so a receipt and a cancellation at the same fake instant count as "after closure".
 * Fake clock and FAKE data only (fixture guest, @example.test-free, card numbers are the public test numbers).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobRunner } from '../../src/jobs/job-runner';
import { HOLD_EXPIRY_JOB_KEY } from '../../src/jobs/reservation-jobs';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { Client, TEST_PASSWORD } from '../helpers/feature-app';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

const NOTE = 'Tiền về sau khi hủy';
const PENALTY = 500_000;

describe.skipIf(!HAS_DB)('PR-B3 – 5B-1 money after closure (ARC 105-03, SEC S2–S8)', () => {
  let x: Fx;
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory';
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  type B = { id: string; code: string; folioId: string };
  let seq = 0;
  /** OTA "pay at hotel" booking (Booking.com channel), still open. */
  const otaBooking = async (room: string): Promise<B> => {
    const res = await x.c.fd!.send('POST', x.url('/reservations'), {
      roomId: x.ids.rooms[room],
      channelId: x.ids.channels.booking,
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'ota_pay_at_property',
      otaRef: `BK-PRB3-${seq++}`,
      otaRoomAmountVnd: 1_800_000,
      arrivalDate: '2026-12-10',
      departureDate: '2026-12-12',
    });
    expect(res.statusCode, res.body).toBe(201);
    const b = res.json();
    return { id: b.id, code: b.code, folioId: b.folioId };
  };
  /** Cancelled by the OTA with its fee → the fee is due, less what the folio already took. */
  const otaCancel = async (b: B, penalty = PENALTY) => {
    const cancel = await x.act(b.id, 'cancel', {
      reasonCode: 'ota_cancelled',
      otaPenaltyVnd: penalty,
    });
    expect(cancel.statusCode, cancel.body).toBe(200);
  };
  /** OTA "pay at hotel" booking cancelled by the OTA with its fee at once → the fee is due (N). */
  const otaCancelled = async (room: string, penalty = PENALTY): Promise<B> => {
    const b = await otaBooking(room);
    await otaCancel(b, penalty);
    expect((await x.folio(b.folioId)).totals.balanceDueVnd).toBe(penalty);
    return b;
  };
  const direct = async (room: string, arrival: string, departure: string): Promise<B> => {
    const body = {
      roomId: x.ids.rooms[room],
      channelId: x.ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: x.guest,
      paymentModel: 'direct',
      arrivalDate: arrival,
      departureDate: departure,
    };
    let res = await x.c.fd!.send('POST', x.url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await x.c.fd!.send('POST', x.url('/reservations'), {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        },
      });
    }
    expect(res.statusCode, res.body).toBe(201);
    const j = res.json();
    return { id: j.id, code: j.code, folioId: j.folioId };
  };
  const salHold = async (room: string): Promise<B> => {
    const svc = x.fa.app.get(ReservationsService);
    const user = x.t.users.sal!.id;
    const row = await x.db.withContext(
      { ...x.t.ctx(), userId: user, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: user, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: x.ids.rooms[room]!,
          channelId: x.ids.channels.direct!,
          arrivalDate: '2026-12-20',
          departureDate: '2026-12-22',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: x.guest,
          holdHours: 24,
        });
      },
    );
    return { id: row.id, code: row.code, folioId: (await x.get(row.id)).folioId as string };
  };
  const j1 = () =>
    x.fa.app.get(JobRunner).runOnce(HOLD_EXPIRY_JOB_KEY, {
      propertyId: x.t.propertyIds[0]!,
      organizationId: x.t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    });
  const upload = (who: string, reservationId: string, purpose = 'deposit_receipt') =>
    x.db.withContext(
      { ...x.t.ctx(), userId: x.t.users[who]!.id, actorType: 'user' },
      async (tx) => {
        const u = x.t.users[who]!;
        return (
          await x.fa.app
            .get(AttachmentService)
            .upload(
              tx,
              { userId: u.id, roles: u.roles },
              { purpose: purpose as 'deposit_receipt', reservationId },
              { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
            )
        ).id as string;
      },
    );
  const record = (b: B, body: Record<string, unknown>, who = 'fd') =>
    x.c[who]!.send('POST', x.url(`/folios/${b.folioId}/payments`), body);
  const transfer = async (
    b: B,
    amountVnd: number,
    who = 'fd',
    type = 'charge',
    extra: Record<string, unknown> = {},
  ) =>
    record(
      b,
      {
        type,
        method: 'bank_transfer',
        amountVnd,
        note: NOTE,
        attachmentId: await upload(who, b.id),
        ...extra,
      },
      who,
    );
  const card = (b: B, amountVnd: number, who = 'fd', extra: Record<string, unknown> = {}) =>
    record(
      b,
      { type: 'charge', method: 'card_pos', amountVnd, posAuthCode: 'A1B2C3', ...extra },
      who,
    );
  const refundsOf = (b: B) =>
    x.q(
      `SELECT id, status, reason_code, requested_by, origin_actor_ids, refund_method, refund_destination_set_by,
              amount_vnd, refund_source
         FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY created_at, id`,
      [b.id],
    );
  /** Everything a refused call must leave as it was. */
  const snapshot = async (b: B) =>
    (
      await x.q(
        `SELECT (SELECT count(*)::int FROM payment WHERE folio_id = $1) AS payments,
                (SELECT count(*)::int FROM audit_event WHERE category = 'money' AND entity_code = $2) AS money_audits,
                (SELECT version FROM folio WHERE id = $1) AS folio_version,
                (SELECT count(*)::int FROM approval_request WHERE target_id = $3) AS requests,
                (SELECT count(*)::int FROM attachment WHERE reservation_id = $3 AND bound_ref_id IS NOT NULL) AS bound`,
        [b.folioId, b.code, b.id],
      )
    )[0];
  const errorsOf = (res: { json(): any }) => res.json().errors;
  const paymentOnFolio = async (b: B, id: string, who = 'mgr') =>
    (
      (await x.c[who]!.get(x.url(`/folios/${b.folioId}`))).json().payments as Array<
        Record<string, any>
      >
    ).find((p) => p.id === id);
  /** approve / reject a refund (expectedVersion of the row, password re-auth). */
  const decide = async (id: string, verb: 'approve' | 'reject', who: string) =>
    x.c[who]!.send('POST', x.url(`/approval-requests/${id}/actions/${verb}`), {
      expectedVersion: Number(
        (await x.q('SELECT version FROM approval_request WHERE id = $1', [id]))[0].version,
      ),
      authMethod: 'password',
      secret: TEST_PASSWORD,
      ...(verb === 'reject' ? { reason: 'Chưa thấy tiền trên sao kê' } : {}),
    });
  const approvalOf = async (id: string, who = 'mgr') => {
    const res = await x.c[who]!.get(x.url('/approval-requests?limit=100'));
    expect(res.statusCode, res.body).toBe(200);
    return (res.json().data as any[]).find((a) => a.id === id);
  };

  let o1: B; // card slip: t1, t2, t3, t6
  let o2: B; // transfer 800.000 by FD → refund 300.000 (t4), pay-out path
  let o3: B; // transfer 500.000 → no refund (t4)
  let o4: B; // two card slips racing (t5)
  let o5: B; // transfer 900.000 by MGR → refund 400.000; rejection, new request (S2)
  let d1: B; // open booking with a transfer of the same amount as o2 ("Có thể trùng")
  let hS: B; // a sale's hold, expired → notice → receipt closes the item
  let hS2: B; // a sale's hold, expired → notice → "Không thấy tiền"
  let hSReceipt: string; // the receipt that handled hS's notice (DOM 11.4 mục 5)

  it('setup: OTA pay-at-hotel bookings cancelled with a 500.000 fee (N = 500.000), two sale holds expired by J1', async () => {
    await x.at('2026-11-20T10:00:00+07:00');
    o1 = await otaCancelled('101');
    o2 = await otaCancelled('102');
    o3 = await otaCancelled('103');
    o4 = await otaCancelled('201');
    o5 = await otaCancelled('202');
    d1 = await direct('203', '2026-12-10', '2026-12-12');
    hS = await salHold('301');
    hS2 = await salHold('302');
    await x.at('2026-11-21T10:01:00+07:00');
    expect((await j1()).stats).toMatchObject({ expired: 2, failed: 0 });
    const st = await x.q(
      `SELECT id, status, status_before_cancel FROM reservation WHERE id = ANY($1)`,
      [[o1.id, o2.id, hS.id, hS2.id]],
    );
    expect(Object.fromEntries(st.map((r) => [r.id, [r.status, r.status_before_cancel]]))).toEqual({
      [o1.id]: ['cancelled', 'confirmed'],
      [o2.id]: ['cancelled', 'confirmed'],
      [hS.id]: ['cancelled', 'hold'],
      [hS2.id]: ['cancelled', 'hold'],
    });
    await x.at('2026-11-21T12:00:00+07:00');
  }, 180_000);

  it('t2 / t6 – N = 500.000: card_pos 500.001 → 422 max 500.000; cash, ota_collect → 422 method; no posAuthCode → 422; wrong type → 422 NOT_ALLOWED; nothing written', async () => {
    const before = await snapshot(o1);
    for (const who of ['fd', 'lead', 'mgr', 'owner']) {
      const over = await card(o1, PENALTY + 1, who);
      expect(over.statusCode, `${who} ${over.body}`).toBe(422);
      expect(over.json()).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
        max: PENALTY,
      });
    }
    for (const method of ['cash', 'ota_collect']) {
      const res = await record(o1, { type: 'charge', method, amountVnd: 100_000, note: NOTE });
      expect(res.statusCode, `${method} ${res.body}`).toBe(422);
      expect(errorsOf(res), method).toContainEqual({ field: 'method', code: 'NOT_IN_LIST' });
    }
    const noAuth = await record(o1, { type: 'charge', method: 'card_pos', amountVnd: 100_000 });
    expect(noAuth.statusCode, noAuth.body).toBe(422);
    expect(errorsOf(noAuth)).toEqual([{ field: 'posAuthCode', code: 'REQUIRED' }]);
    // 5B-1 type: a booking cancelled while confirmed takes a `charge` – `deposit` → NOT_ALLOWED (card or transfer).
    const dep = await card(o1, 100_000, 'fd', { type: 'deposit' });
    expect(dep.statusCode, dep.body).toBe(422);
    expect(errorsOf(dep)).toEqual([{ field: 'type', code: 'NOT_ALLOWED' }]);
    const depTr = await transfer(o1, 100_000, 'fd', 'deposit');
    expect(errorsOf(depTr)).toEqual([{ field: 'type', code: 'NOT_ALLOWED' }]);
    // A hold cancelled by J1 takes a `deposit` – `charge` → NOT_ALLOWED.
    const ch = await transfer(hS2, 100_000, 'fd', 'charge');
    expect(ch.statusCode, ch.body).toBe(422);
    expect(errorsOf(ch)).toEqual([{ field: 'type', code: 'NOT_ALLOWED' }]);
    // Sales: still refused (V5-48), whatever the method.
    const sal = await card(o1, 100_000, 'sal');
    expect([403, 404, 422]).toContain(sal.statusCode);
    expect(await snapshot(o1)).toEqual(before);
  }, 120_000);

  it('t1 / t3 – card_pos 500.000 (no image) → 201 pending, no refund; then N = 0 → card_pos → 422 method NOT_IN_LIST', async () => {
    const res = await card(o1, PENALTY);
    expect(res.statusCode, res.body).toBe(201);
    expect(res.json()).toMatchObject({
      method: 'card_pos',
      amountVnd: PENALTY,
      status: 'succeeded',
      reconciliation: 'pending',
      afterClosure: true,
    });
    expect(res.json().attachmentId).toBeUndefined();
    expect(await refundsOf(o1)).toEqual([]);
    const [audit] = await x.q(
      `SELECT after FROM audit_event WHERE action = 'payment.recorded' AND entity_id = $1`,
      [res.json().id],
    );
    expect(audit.after).toMatchObject({
      method: 'card_pos',
      afterClosure: true,
      reservationStatus: 'cancelled',
    });
    expect((await x.folio(o1.folioId)).totals.balanceDueVnd).toBe(0);
    const before = await snapshot(o1);
    const again = await card(o1, 1);
    expect(again.statusCode, again.body).toBe(422);
    expect(errorsOf(again)).toEqual([{ field: 'method', code: 'NOT_IN_LIST' }]);
    expect(await snapshot(o1)).toEqual(before);
  }, 60_000);

  it('t5 – two card_pos 300.000 forced to race on the folio lock: one 201, the other 422 max 200.000; one receipt, no refund', async () => {
    const results = await x.interleaved(o4.folioId, [
      () => card(o4, 300_000, 'fd'),
      () => card(o4, 300_000, 'lead'),
    ]);
    const statuses = results.map((r) => r.statusCode).sort();
    expect(statuses, results.map((r) => r.body).join(' | ')).toEqual([201, 422]);
    const refused = results.find((r) => r.statusCode === 422)!;
    expect(refused.json()).toMatchObject({
      errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: 200_000,
    });
    const rows = await x.q(`SELECT amount_vnd FROM payment WHERE folio_id = $1`, [o4.folioId]);
    expect(rows).toEqual([{ amount_vnd: 300_000 }]);
    expect(await refundsOf(o4)).toEqual([]);
    // The rest (200.000) is still taken.
    expect((await card(o4, 200_000)).statusCode).toBe(201);
  }, 60_000);

  let refundO2: string;
  it('t4 – transfer 800.000 → refund 300.000 requested by the recorder (origin), destination original_method fixed; transfer 500.000 → no refund', async () => {
    const res = await transfer(o2, 800_000);
    expect(res.statusCode, res.body).toBe(201);
    expect(res.json()).toMatchObject({ reconciliation: 'pending', afterClosure: true });
    const [r] = await refundsOf(o2);
    expect(r).toEqual({
      id: expect.any(String),
      status: 'pending',
      reason_code: 'payment_after_cancel',
      requested_by: x.t.users.fd!.id,
      origin_actor_ids: [x.t.users.fd!.id],
      refund_method: 'original_method',
      refund_destination_set_by: null,
      amount_vnd: 300_000,
      refund_source: 'other',
    });
    refundO2 = r.id;
    expect(await refundsOf(o2)).toHaveLength(1);
    // Money audit of the server-set destination; "Cần chú ý" credit of the closed booking.
    const [dest] = await x.q(
      `SELECT before, after FROM audit_event WHERE action = 'refund.destination_set' AND entity_id = $1`,
      [r.id],
    );
    expect(dest).toEqual({
      before: { status: 'pending', refundMethod: null },
      after: { status: 'pending', refundMethod: 'original_method' },
    });
    const att = await x.q(
      `SELECT kind FROM attention_event WHERE ref_id = $1 AND resolved_at IS NULL`,
      [o2.id],
    );
    expect(att.map((a) => a.kind)).toContain('closed_reservation_credit');

    const exact = await transfer(o3, PENALTY);
    expect(exact.statusCode, exact.body).toBe(201);
    expect(await refundsOf(o3)).toEqual([]);
  }, 60_000);

  it('S3 – the fixed destination: setRefundDestination → 409, executeCashRefund → 409; S2 – the recorder never pays; pay-out waits for the reconciliation, then goes back to the transfer', async () => {
    const dest = await x.c.fd!.send(
      'PUT',
      x.url(`/approval-requests/${refundO2}/refund-destination`),
      {
        method: 'bank_transfer',
        bankBin: '970436',
        accountNo: '0071000123457',
        accountHolder: 'KHACH B',
      },
    );
    expect(dest.statusCode, dest.body).toBe(409);
    expect(dest.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'pending' });
    const toCash = await x.c.fd!.send(
      'PUT',
      x.url(`/approval-requests/${refundO2}/refund-destination`),
      { method: 'cash' },
    );
    expect(toCash.statusCode, toCash.body).toBe(409);
    expect((await refundsOf(o2))[0]).toMatchObject({
      refund_method: 'original_method',
      refund_destination_set_by: null,
    });
    const ok = await decide(refundO2, 'approve', 'mgr');
    expect(ok.statusCode, ok.body).toBe(200);
    const paidAt = '2026-11-21T12:00:00+07:00';
    const cash = await x.c.mgr2!.send(
      'POST',
      x.url(`/approval-requests/${refundO2}/actions/execute-cash-refund`),
      { amountVnd: 300_000, paidAt, attachmentId: await upload('mgr2', o2.id, 'refund_proof') },
    );
    expect(cash.statusCode, cash.body).toBe(409);
    const proof = await upload('mgr2', o2.id, 'refund_proof');
    const payout = (who: string) =>
      x.c[who]!.send('POST', x.url(`/approval-requests/${refundO2}/actions/execute-refund`), {
        amountVnd: 300_000,
        paidAt,
        bankReference: 'RF-PRB3-0001',
        attachmentId: proof,
      });
    const early = await payout('mgr2');
    expect(early.statusCode, early.body).toBe(409);
    expect(early.json().code).toBe('REFUND_SOURCE_NOT_RECONCILED');
    // MGR (not the recorder) reconciles the transfer against the statement.
    const [p] = await x.q(
      `SELECT id, version FROM payment WHERE folio_id = $1 AND method = 'bank_transfer'`,
      [o2.folioId],
    );
    const rec = await x.c.mgr!.send(
      'POST',
      x.url(`/payments/${p.id}/actions/reconcile`),
      { result: 'reconciled' },
      { 'if-match': `"${p.version}"` },
    );
    expect(rec.statusCode, rec.body).toBe(200);
    const paid = await payout('mgr2');
    expect(paid.statusCode, paid.body).toBe(201);
    expect(paid.json()).toMatchObject({
      type: 'refund',
      method: 'bank_transfer',
      amountVnd: -300_000,
    });
    const [done] = await x.q(`SELECT refunded_vnd FROM approval_request WHERE id = $1`, [refundO2]);
    expect(Number(done.refunded_vnd)).toBe(300_000);
  }, 120_000);

  let r1: string;
  let r2: string;
  it("S2 – MGR records 900.000: refund 400.000 in MGR's name; MGR cannot approve; after a rejection a new request by MGR2 keeps MGR in origin – MGR never approves nor pays it", async () => {
    const res = await transfer(o5, 900_000, 'mgr');
    expect(res.statusCode, res.body).toBe(201);
    const [a] = await refundsOf(o5);
    expect(a).toMatchObject({
      requested_by: x.t.users.mgr!.id,
      origin_actor_ids: [x.t.users.mgr!.id],
      amount_vnd: 400_000,
      reason_code: 'payment_after_cancel',
    });
    r1 = a.id;
    const self = await decide(r1, 'approve', 'mgr');
    expect(self.statusCode, self.body).toBe(403);
    expect(self.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
    const rej = await decide(r1, 'reject', 'owner');
    expect(rej.statusCode, rej.body).toBe(200);
    const again = await x.c.mgr2!.send('POST', x.url(`/folios/${o5.folioId}/refund-requests`), {
      amountVnd: 400_000,
      reason: 'Hoàn tiền về sau khi hủy',
    });
    expect(again.statusCode, again.body).toBe(201);
    r2 = again.json().id;
    const [row] = await x.q(
      `SELECT requested_by, origin_actor_ids FROM approval_request WHERE id = $1`,
      [r2],
    );
    expect(row.requested_by).toBe(x.t.users.mgr2!.id);
    expect(row.origin_actor_ids).toContain(x.t.users.mgr!.id);
    const dest = await x.c.fd!.send('PUT', x.url(`/approval-requests/${r2}/refund-destination`), {
      method: 'original_method',
    });
    expect(dest.statusCode, dest.body).toBe(200);
    const mgrApprove = await decide(r2, 'approve', 'mgr');
    expect(mgrApprove.statusCode, mgrApprove.body).toBe(403);
    expect(mgrApprove.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
    const own = await decide(r2, 'approve', 'owner');
    expect(own.statusCode, own.body).toBe(200);
    const pay = await x.c.mgr!.send(
      'POST',
      x.url(`/approval-requests/${r2}/actions/execute-refund`),
      {
        amountVnd: 400_000,
        paidAt: '2026-11-21T12:00:00+07:00',
        bankReference: 'RF-PRB3-0002',
        attachmentId: await upload('mgr', o5.id, 'refund_proof'),
      },
    );
    expect(pay.statusCode, pay.body).toBe(403);
    expect(pay.json().code).toBe('SELF_REFUND_FORBIDDEN');
  }, 120_000);

  it('S4 "Có thể trùng" – same amount by transfer within 24 h on another booking: codes on Payment and on the refund ApprovalRequest for FD+; a sale never gets the field', async () => {
    const dup = await transfer(d1, 800_000);
    expect(dup.statusCode, dup.body).toBe(201);
    const o2Receipt = (
      await x.q(`SELECT id FROM payment WHERE folio_id = $1 AND method = 'bank_transfer'`, [
        o2.folioId,
      ])
    )[0].id as string;
    expect((await paymentOnFolio(o2, o2Receipt))?.possibleDuplicateCodes).toEqual([d1.code]);
    expect((await paymentOnFolio(d1, dup.json().id))?.possibleDuplicateCodes).toEqual([o2.code]);
    // Card slips and receipts of another amount are never "possible duplicates".
    const o3Receipt = (
      await x.q(`SELECT id FROM payment WHERE folio_id = $1 AND method = 'bank_transfer'`, [
        o3.folioId,
      ])
    )[0].id as string;
    expect((await paymentOnFolio(o3, o3Receipt))?.possibleDuplicateCodes).toBeUndefined();
    // The refund request of o2 (approved, partly paid) carries the same codes for MGR and FD.
    const viaMgr = await approvalOf(refundO2, 'mgr');
    expect(viaMgr?.possibleDuplicateCodes).toEqual([d1.code]);
    // A receipt reversed → no longer a duplicate.
    const rev = await x.reverse(dup.json().id, 'Ghi nhầm đơn')();
    expect(rev.statusCode, rev.body).toBe(200);
    expect((await paymentOnFolio(o2, o2Receipt))?.possibleDuplicateCodes).toBeUndefined();
    expect((await approvalOf(refundO2, 'mgr'))?.possibleDuplicateCodes).toBeUndefined();
  }, 120_000);

  let noticeImg: string;
  it('S7 – createDepositNotice on a closed booking → 202, one "Cần chú ý" deposit_after_cancel for FD+ (code only), no receipt; a repeat keeps one item', async () => {
    noticeImg = await upload('sal', hS.id);
    const before = await snapshot(hS);
    const n = await x.c.sal!.send('POST', x.url(`/reservations/${hS.id}/deposit-notices`), {
      amountVnd: 300_000,
      note: 'Khách báo đã chuyển',
      attachmentId: noticeImg,
    });
    expect(n.statusCode, n.body).toBe(202);
    const again = await x.c.sal!.send('POST', x.url(`/reservations/${hS.id}/deposit-notices`), {
      amountVnd: 300_000,
      note: 'Khách báo lại',
    });
    expect(again.statusCode, again.body).toBe(202);
    const items = await x.q(
      `SELECT kind, severity, ref_code, details, resolved_at FROM attention_event
        WHERE dedupe_key = $1`,
      [`deposit_after_cancel:${hS.id}`],
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'deposit_after_cancel',
      ref_code: hS.code,
      resolved_at: null,
    });
    expect(JSON.stringify(items[0].details ?? {})).not.toContain('300000');
    const notes = await x.q(
      `SELECT user_id, ref_code FROM staff_notification WHERE kind = 'deposit_after_cancel' AND ref_id = $1`,
      [hS.id],
    );
    const told = new Set(notes.map((r) => r.user_id));
    for (const who of ['fd', 'lead', 'mgr', 'owner'])
      expect(told.has(x.t.users[who]!.id), who).toBe(true);
    expect(told.has(x.t.users.sal!.id)).toBe(false);
    expect(notes.every((r) => r.ref_code === hS.code)).toBe(true);
    // The booking is unchanged and no money was written.
    const after = await snapshot(hS);
    expect(after.payments).toBe(before.payments);
    expect((await x.q(`SELECT status FROM reservation WHERE id = $1`, [hS.id]))[0].status).toBe(
      'cancelled',
    );
    const [audit] = await x.q(
      `SELECT after FROM audit_event WHERE action = 'deposit_notice.created' AND entity_code = $1`,
      [hS.code],
    );
    expect(audit.after).toMatchObject({ status: 'open', afterClosure: true });
    // The notice image is never the proof (S7).
    const proof = await record(
      hS,
      { type: 'deposit', method: 'bank_transfer', amountVnd: 300_000, attachmentId: noticeImg },
      'fd',
    );
    expect(errorsOf(proof)).toEqual([{ field: 'attachmentId', code: 'NOT_IN_LIST' }]);
  }, 60_000);

  it('DOM 11.4 mục 5 – a receipt recorded after the notice closes the item and the notice (`handled`), refund of the whole amount (N = 0); its bank code may equal a refund pay-out code (ARC-15)', async () => {
    // The o2 pay-out above carries RF-PRB3-0001: the code of a refund never blocks a receipt (only deposit / charge).
    const res = await transfer(hS, 300_000, 'fd', 'deposit', { bankReference: 'rf-prb3-0001' });
    expect(res.statusCode, res.body).toBe(201);
    expect(res.json().bankReference).toBe('RF-PRB3-0001');
    hSReceipt = res.json().id;
    expect(
      (
        await x.q(
          `SELECT type FROM payment WHERE upper(bank_reference) = 'RF-PRB3-0001' ORDER BY type`,
        )
      ).map((r) => r.type),
    ).toEqual(['deposit', 'refund']);
    const [item] = await x.q(
      `SELECT resolved_at, resolved_by FROM attention_event WHERE dedupe_key = $1`,
      [`deposit_after_cancel:${hS.id}`],
    );
    expect(item.resolved_at).not.toBeNull();
    const notices = await x.q(
      `SELECT status, handled_payment_id FROM deposit_notice WHERE reservation_id = $1`,
      [hS.id],
    );
    expect(notices).toEqual([{ status: 'handled', handled_payment_id: res.json().id }]);
    expect(await refundsOf(hS)).toEqual([
      expect.objectContaining({ amount_vnd: 300_000, reason_code: 'payment_after_cancel' }),
    ]);
    // "Có thể trùng" for FD+ only (x-visible-to): the same 300.000 by transfer on another booking within 24 h.
    expect((await transfer(d1, 300_000)).statusCode).toBe(201);
    const asFd = await paymentOnFolio(hS, res.json().id, 'fd');
    expect(asFd?.possibleDuplicateCodes).toEqual([d1.code]);
    expect(asFd?.bankReference).toBe('RF-PRB3-0001');
    // A sale reading its own (closed) booking's folio never gets the field.
    const asSal = await x.c.sal!.get(x.url(`/folios/${hS.folioId}`));
    expect(asSal.statusCode, asSal.body).toBe(200);
    const salPayment = (asSal.json().payments as any[]).find((p) => p.id === res.json().id);
    expect(salPayment).toBeDefined();
    expect(salPayment.possibleDuplicateCodes).toBeUndefined();
    expect(salPayment.bankReference).toBeUndefined();
  }, 60_000);

  it('S8 / ARC-20 – "Không thấy tiền": note required; audit attention_event.resolved {kind, afterClosure} read back from audit_event and through afterClosureOnly with no category', async () => {
    const n = await x.c.sal!.send('POST', x.url(`/reservations/${hS2.id}/deposit-notices`), {
      amountVnd: 200_000,
      note: 'Khách báo đã chuyển',
    });
    expect(n.statusCode, n.body).toBe(202);
    const [item] = await x.q(`SELECT id FROM attention_event WHERE dedupe_key = $1`, [
      `deposit_after_cancel:${hS2.id}`,
    ]);
    const resolve = (body: Record<string, unknown>, who = 'fd') =>
      x.c[who]!.send('POST', x.url(`/attention-events/${item.id}/actions/resolve`), body);
    // FB-R5-BE-ARC-C0313-32 (e): missing, short, blank or invisible-only → 422 REASON_REQUIRED, the item stays open,
    // no audit row.
    for (const body of [
      {},
      { note: 'ab' },
      { note: '     ' },
      { note: '\u2060\u2060\u2060\u2060\u200b' },
    ]) {
      const refused = await resolve(body);
      expect(refused.statusCode, `${JSON.stringify(body)} ${refused.body}`).toBe(422);
      expect(errorsOf(refused)).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
    }
    expect(
      (await x.q(`SELECT resolved_at FROM attention_event WHERE id = $1`, [item.id]))[0]
        .resolved_at,
    ).toBeNull();
    expect(
      await x.q(
        `SELECT 1 FROM audit_event WHERE action = 'attention_event.resolved' AND entity_id = $1`,
        [item.id],
      ),
    ).toHaveLength(0);
    const ok = await resolve({ note: 'Sao kê 21/11 không có khoản này' });
    expect(ok.statusCode, ok.body).toBe(204);
    const rows = await x.q(
      `SELECT category, actor_user_id, entity_type, entity_code, before, after, reason FROM audit_event
        WHERE action = 'attention_event.resolved' AND entity_id = $1`,
      [item.id],
    );
    expect(rows).toEqual([
      {
        category: 'money',
        actor_user_id: x.t.users.fd!.id,
        entity_type: 'attention_event',
        entity_code: hS2.code,
        before: null,
        after: { kind: 'deposit_after_cancel', afterClosure: true },
        reason: null,
      },
    ]);
    // The OWN weekly screen: afterClosureOnly, no category.
    const list = await x.c.owner!.get(
      x.url('/audit-events?afterClosureOnly=true&from=2026-11-20&to=2026-11-22&limit=100'),
    );
    expect(list.statusCode, list.body).toBe(200);
    const data = list.json().data as any[];
    const mine = data.filter((r) => r.action === 'attention_event.resolved');
    expect(mine).toEqual([
      expect.objectContaining({
        category: 'money',
        entityType: 'attention_event',
        entityId: item.id,
        entityCode: hS2.code,
        after: { kind: 'deposit_after_cancel', afterClosure: true },
      }),
    ]);
    expect(JSON.stringify(mine)).not.toContain('Sao kê');
    // The other after-closure rows of this run are there too (receipts and notices).
    expect(data.some((r) => r.action === 'payment.recorded')).toBe(true);
    expect(data.some((r) => r.action === 'deposit_notice.created')).toBe(true);
    // Only this item wrote the action (the receipt that closed hS's item is not "Không thấy tiền").
    expect(
      await x.q(`SELECT 1 FROM audit_event WHERE action = 'attention_event.resolved'`),
    ).toHaveLength(1);
  }, 60_000);

  it('t7 – a no-show keeping a service line owes it (N > 0): card_pos above N → 422 max N, card_pos N → 201, no refund', async () => {
    await x.at('2026-11-25T10:00:00+07:00');
    const b = await direct('401', '2026-11-26', '2026-11-28');
    const line = await x.c.fd!.send('POST', x.url(`/folios/${b.folioId}/lines`), {
      category: 'service_fee',
      description: 'Đón sân bay',
      quantity: 1,
      unitPriceVnd: 2_000_000,
      serviceDate: '2026-11-26',
    });
    expect(line.statusCode, line.body).toBe(201);
    const lineId = (line.json().lines as any[]).find(
      (l) => l.category === 'service_fee' && !l.reversalOfId,
    ).id;
    await x.at('2026-11-26T23:30:00+07:00');
    const ns = await x.act(b.id, 'mark-no-show', {
      contactAttemptNote: 'Gọi 3 lần không nghe',
      retainLines: [{ lineId, reason: 'Xe đã đặt, không hoàn' }],
    });
    expect(ns.statusCode, ns.body).toBe(200);
    const n = (await x.folio(b.folioId)).totals.balanceDueVnd as number;
    expect(n).toBeGreaterThan(0);
    const over = await card(b, n + 1);
    expect(over.statusCode, over.body).toBe(422);
    expect(over.json()).toMatchObject({ max: n });
    const ok = await card(b, n);
    expect(ok.statusCode, ok.body).toBe(201);
    expect(ok.json()).toMatchObject({ afterClosure: true, reconciliation: 'pending' });
    expect(await refundsOf(b)).toEqual([]);
    expect((await card(b, 1)).statusCode).toBe(422);
  }, 120_000);

  it('FB-R5-SEC-BE-127-02 – accountHolder: invisible characters only → 422 REQUIRED; a bidi override is stripped before it is stored', async () => {
    await x.at('2026-11-27T10:00:00+07:00');
    const b = await direct('402', '2026-12-01', '2026-12-03');
    const due = (await x.folio(b.folioId)).totals.balanceDueVnd as number;
    const over = await record(b, {
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: due + 200_000,
      note: 'Chuyển dư',
    });
    expect(over.statusCode, over.body).toBe(201);
    const req = await x.c.fd!.send('POST', x.url(`/folios/${b.folioId}/refund-requests`), {
      amountVnd: 200_000,
      reason: 'Hoàn tiền chuyển dư',
    });
    expect(req.statusCode, req.body).toBe(201);
    const id = req.json().id as string;
    const dest = (accountHolder: string) =>
      x.c.fd!.send('PUT', x.url(`/approval-requests/${id}/refund-destination`), {
        method: 'bank_transfer',
        bankBin: '970436',
        accountNo: '0071000123457',
        accountHolder,
      });
    const invisible = await dest('⁠⁠⁠');
    expect(invisible.statusCode, invisible.body).toBe(422);
    expect(errorsOf(invisible)).toEqual([{ field: 'accountHolder', code: 'REQUIRED' }]);
    const bidi = await dest('NGUYEN ‮VAN A');
    expect(bidi.statusCode, bidi.body).toBe(200);
    // Read back through the step-up view (device of the desk, MGR inside its step-up window).
    const mgr = new Client(x.fa, x.t.users.mgr!.sessionToken, x.c.fd!.deviceToken);
    const step = await mgr.send('POST', '/v1/me/step-up', { password: TEST_PASSWORD });
    expect(step.statusCode, step.body).toBe(200);
    const view = await mgr.get(x.url(`/approval-requests/${id}/refund-destination`));
    expect(view.statusCode, view.body).toBe(200);
    expect(view.json().accountHolder).toBe('NGUYEN VAN A');
  }, 60_000);

  const transferReceipt = async (b: B) =>
    (
      await x.q(
        `SELECT id, version FROM payment
          WHERE folio_id = $1 AND method = 'bank_transfer' AND type <> 'refund' AND reversal_of_id IS NULL
          ORDER BY created_at DESC LIMIT 1`,
        [b.folioId],
      )
    )[0] as { id: string; version: number };
  const reconcile = async (b: B, who = 'mgr') => {
    const p = await transferReceipt(b);
    const res = await x.c[who]!.send(
      'POST',
      x.url(`/payments/${p.id}/actions/reconcile`),
      { result: 'reconciled' },
      { 'if-match': `"${p.version}"` },
    );
    expect(res.statusCode, res.body).toBe(200);
  };

  it('FB-R5-ARC-BE-148-01 P1 (DOM 11.4 3b) – the after-closure transfer reversed: its 5B-1 request superseded, no new request, the credit item closed', async () => {
    await x.at('2026-11-28T09:00:00+07:00');
    const b = await otaCancelled('101');
    const res = await transfer(b, 800_000);
    expect(res.statusCode, res.body).toBe(201);
    const [r] = await refundsOf(b);
    expect(r).toMatchObject({
      status: 'pending',
      reason_code: 'payment_after_cancel',
      amount_vnd: 300_000,
    });
    const credit = `closed_reservation_credit:${b.id}`;
    expect(
      (await x.q(`SELECT resolved_at FROM attention_event WHERE dedupe_key = $1`, [credit]))[0]
        .resolved_at,
    ).toBeNull();
    const rev = await x.reverse(res.json().id, 'Ghi nhầm đơn')();
    expect(rev.statusCode, rev.body).toBe(200);
    const after = await x.q(
      `SELECT id, status, auto_cancel_reason FROM approval_request
        WHERE type = 'refund' AND target_id = $1 ORDER BY created_at, id`,
      [b.id],
    );
    expect(after).toEqual([{ id: r.id, status: 'cancelled', auto_cancel_reason: 'superseded' }]);
    expect(
      (await x.q(`SELECT resolved_at FROM attention_event WHERE dedupe_key = $1`, [credit]))[0]
        .resolved_at,
    ).not.toBeNull();
    expect((await x.folio(b.folioId)).totals.balanceDueVnd).toBe(PENALTY);
  }, 60_000);

  it('FB-R5-ARC-BE-148-01 P2 – whoever recorded money BEFORE the closure is never an origin actor: the 5B-1 request has only the after-closure recorder, MGR approves it', async () => {
    await x.at('2026-11-28T10:00:00+07:00');
    const b = await otaBooking('102');
    const before = await card(b, 100_000, 'mgr', { note: 'Khách trả trước một phần' });
    expect(before.statusCode, before.body).toBe(201);
    expect(before.json().afterClosure).not.toBe(true);
    // The clock moves between the receipt and the cancellation (AFTER_CLOSURE_SQL compares with >=).
    await x.at('2026-11-28T10:05:00+07:00');
    await otaCancel(b);
    const n = (await x.folio(b.folioId)).totals.balanceDueVnd as number;
    expect(n).toBe(PENALTY - 100_000);
    const late = await transfer(b, n + 200_000);
    expect(late.statusCode, late.body).toBe(201);
    const [r] = await refundsOf(b);
    expect(r).toMatchObject({
      reason_code: 'payment_after_cancel',
      requested_by: x.t.users.fd!.id,
      origin_actor_ids: [x.t.users.fd!.id],
      amount_vnd: 200_000,
    });
    const ok = await decide(r.id, 'approve', 'mgr');
    expect(ok.statusCode, ok.body).toBe(200);
  }, 60_000);

  it('FB-R5-SEC-BE-148-01 – an OWN only among the origin actors (5B-1 request rejected, asked again by MGR2) pays the transfer only inside the step-up window, flagged ownSelfApprovedAndPaid', async () => {
    await x.at('2026-11-28T11:00:00+07:00');
    const b = await otaCancelled('103');
    const res = await transfer(b, 900_000, 'owner');
    expect(res.statusCode, res.body).toBe(201);
    const [first] = await refundsOf(b);
    expect(first).toMatchObject({
      requested_by: x.t.users.owner!.id,
      origin_actor_ids: [x.t.users.owner!.id],
      amount_vnd: 400_000,
    });
    expect((await decide(first.id, 'reject', 'mgr')).statusCode).toBe(200);
    const again = await x.c.mgr2!.send('POST', x.url(`/folios/${b.folioId}/refund-requests`), {
      amountVnd: 400_000,
      reason: 'Hoàn tiền về sau khi hủy',
    });
    expect(again.statusCode, again.body).toBe(201);
    const id = again.json().id as string;
    const [row] = await x.q(
      `SELECT requested_by, approver_id, refund_destination_set_by, origin_actor_ids FROM approval_request
        WHERE id = $1`,
      [id],
    );
    expect(row.requested_by).toBe(x.t.users.mgr2!.id);
    expect(row.origin_actor_ids).toContain(x.t.users.owner!.id);
    const dest = await x.c.fd!.send('PUT', x.url(`/approval-requests/${id}/refund-destination`), {
      method: 'original_method',
    });
    expect(dest.statusCode, dest.body).toBe(200);
    expect((await decide(id, 'approve', 'mgr')).statusCode).toBe(200);
    await reconcile(b);
    // The OWN is neither the requester, the approver nor the destination setter – only an origin actor.
    const [decided] = await x.q(
      `SELECT requested_by, approver_id, refund_destination_set_by FROM approval_request WHERE id = $1`,
      [id],
    );
    expect(Object.values(decided)).not.toContain(x.t.users.owner!.id);
    const proof = await upload('owner', b.id, 'refund_proof');
    const pay = () =>
      x.c.owner!.send('POST', x.url(`/approval-requests/${id}/actions/execute-refund`), {
        amountVnd: 400_000,
        paidAt: '2026-11-28T11:00:00+07:00',
        bankReference: 'RF-PRB3B-0001',
        attachmentId: proof,
      });
    const noStep = await pay();
    expect(noStep.statusCode, noStep.body).toBe(401);
    expect(noStep.json().code).toBe('REAUTH_REQUIRED');
    expect(
      Number(
        (await x.q(`SELECT refunded_vnd FROM approval_request WHERE id = $1`, [id]))[0]
          .refunded_vnd,
      ),
    ).toBe(0);
    const step = await x.c.owner!.send('POST', '/v1/me/step-up', { password: TEST_PASSWORD });
    expect(step.statusCode, step.body).toBe(200);
    const paid = await pay();
    expect(paid.statusCode, paid.body).toBe(201);
    const [log] = await x.q(
      `SELECT after FROM audit_event WHERE action = 'refund.paid' AND entity_id = $1`,
      [paid.json().id],
    );
    expect(log.after).toMatchObject({ recordedByRole: 'owner', ownSelfApprovedAndPaid: true });
  }, 120_000);

  it('FB-R5-SEC-BE-148-03 – S2 with an OWN recorder: the 5B-1 request in its name; the OWN approves neither it nor the one MGR2 asks again (origin), and never pays it in cash', async () => {
    await x.at('2026-11-29T10:00:00+07:00');
    const owner = x.t.users.owner!.id;
    const b = await otaCancelled('201');
    const res = await transfer(b, 900_000, 'owner');
    expect(res.statusCode, res.body).toBe(201);
    const [first] = await refundsOf(b);
    expect(first).toMatchObject({
      requested_by: owner,
      origin_actor_ids: [owner],
      amount_vnd: 400_000,
      reason_code: 'payment_after_cancel',
    });
    const self = await decide(first.id, 'approve', 'owner');
    expect(self.statusCode, self.body).toBe(403);
    expect(self.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
    expect((await decide(first.id, 'reject', 'mgr')).statusCode).toBe(200);
    const again = await x.c.mgr2!.send('POST', x.url(`/folios/${b.folioId}/refund-requests`), {
      amountVnd: 400_000,
      reason: 'Hoàn tiền về sau khi hủy',
    });
    expect(again.statusCode, again.body).toBe(201);
    const id = again.json().id as string;
    const [row] = await x.q(`SELECT origin_actor_ids FROM approval_request WHERE id = $1`, [id]);
    expect(row.origin_actor_ids).toContain(owner);
    const ownApprove = await decide(id, 'approve', 'owner');
    expect(ownApprove.statusCode, ownApprove.body).toBe(403);
    expect(ownApprove.json().code).toBe('SELF_APPROVAL_FORBIDDEN');
    // The request asked again takes a cash destination (S3 does not follow it yet – SEC 148-02, v1.0.6). The OWN
    // transfer exception never covers cash: an origin actor never pays it.
    const dest = await x.c.fd!.send('PUT', x.url(`/approval-requests/${id}/refund-destination`), {
      method: 'cash',
    });
    expect(dest.statusCode, dest.body).toBe(200);
    expect((await decide(id, 'approve', 'mgr')).statusCode).toBe(200);
    const cash = await x.c.owner!.send(
      'POST',
      x.url(`/approval-requests/${id}/actions/execute-cash-refund`),
      {
        amountVnd: 400_000,
        paidAt: '2026-11-29T10:00:00+07:00',
        attachmentId: await upload('owner', b.id, 'refund_proof'),
      },
    );
    expect(cash.statusCode, cash.body).toBe(403);
    expect(cash.json().code).toBe('SELF_REFUND_FORBIDDEN');
    expect(
      Number(
        (await x.q(`SELECT refunded_vnd FROM approval_request WHERE id = $1`, [id]))[0]
          .refunded_vnd,
      ),
    ).toBe(0);
  }, 120_000);

  it('FB-R5-ARC-BE-148-03 – the edges of "Có thể trùng" (same booking, card / cash, receipts before the closure, 25 h apart) and a second receipt after closure never re-handles a notice', async () => {
    await x.at('2026-11-30T09:00:00+07:00');
    const dupOf = async (b: B, id: string) => (await paymentOnFolio(b, id))?.possibleDuplicateCodes;
    const e1 = await direct('401', '2026-12-14', '2026-12-16');
    const e2 = await direct('402', '2026-12-14', '2026-12-16');
    /** One call after the other (never in parallel – the folio lock), each → 201; the receipt ids. */
    const ids = async (
      ...calls: Array<() => Promise<{ statusCode: number; body: string; json(): any }>>
    ) => {
      const out: string[] = [];
      for (const call of calls) {
        const done = await call();
        expect(done.statusCode, done.body).toBe(201);
        out.push(done.json().id as string);
      }
      return out;
    };
    // (A7) two transfers of the same amount on the SAME booking → no flag (DOM 148-05 may change this rule).
    const [s1, s2] = await ids(
      () => transfer(e1, 333_000),
      () => transfer(e1, 333_000),
    );
    expect(await dupOf(e1, s1!)).toBeUndefined();
    expect(await dupOf(e1, s2!)).toBeUndefined();
    // (A19) a card slip or cash of the same amount on another booking is never a duplicate, and gets no flag.
    const [tr, cd] = await ids(
      () => transfer(e2, 444_000),
      () => card(e1, 444_000, 'fd', { note: NOTE }),
      () => record(e1, { type: 'charge', method: 'cash', amountVnd: 444_000, note: NOTE }),
    );
    expect(await dupOf(e2, tr!)).toBeUndefined();
    expect(await dupOf(e1, cd!)).toBeUndefined();
    // Control: a transfer of that amount on a third booking is.
    expect((await transfer(d1, 444_000)).statusCode).toBe(201);
    expect(await dupOf(e2, tr!)).toEqual([d1.code]);
    expect(await dupOf(e1, cd!)).toBeUndefined();
    // (A9) the refund request of a booking whose only suspect receipt was recorded BEFORE the closure → no flag.
    const z = await otaBooking('202');
    const [zr] = await ids(() => transfer(z, 250_000));
    expect((await transfer(e2, 250_000)).statusCode).toBe(201);
    expect(await dupOf(z, zr!)).toEqual([e2.code]);
    await x.at('2026-11-30T09:05:00+07:00');
    await otaCancel(z, 100_000);
    const [zReq] = await refundsOf(z);
    expect(zReq).toMatchObject({ amount_vnd: 150_000, status: 'pending' });
    const zApproval = await approvalOf(zReq.id, 'mgr');
    expect(zApproval).toBeDefined();
    expect(zApproval.possibleDuplicateCodes).toBeUndefined();
    // (A5) a second receipt after closure on hS never re-handles its notice (handled by the first one).
    expect((await transfer(hS, 100_000, 'fd', 'deposit')).statusCode).toBe(201);
    expect(
      await x.q(`SELECT status, handled_payment_id FROM deposit_notice WHERE reservation_id = $1`, [
        hS.id,
      ]),
    ).toEqual([{ status: 'handled', handled_payment_id: hSReceipt }]);
    // (A8) 25 hours apart → no flag; the two of the same hour flag each other.
    const [early] = await ids(() => transfer(e1, 555_000));
    await x.at('2026-12-01T10:05:00+07:00');
    const [lateE2, lateD1] = await ids(
      () => transfer(e2, 555_000),
      () => transfer(d1, 555_000),
    );
    expect(await dupOf(e1, early!)).toBeUndefined();
    expect(await dupOf(e2, lateE2!)).toEqual([d1.code]);
    expect(await dupOf(d1, lateD1!)).toEqual([e2.code]);
  }, 180_000);
});
