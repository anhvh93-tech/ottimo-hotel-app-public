/**
 * V5-48 (Round 5, v1.0.5, BE-B) – money on a closed booking, on PostgreSQL. BUG-R5-002; contract 0.3.13 bổ sung 1
 * mục 1.21 ý 2 (`recordPayment` (A), `confirmPaymentReceived`, `createVietQr`, `listAuditEvents.afterClosureOnly`);
 * SEC `SEC-on-bug-r5-002.md` 3.1, B002-01 and the cases (h1)–(h6) of FB-R5-SEC-QA-B002-06; SEC ARC-17 (404 before
 * the 409); BE C0313-22 ý 1 + 3 with SEC-responses 1.1–1.3:
 * - (h1) FD, FDL, MGR, OWN on `cancelled` (`hold_expired` and `found_other`) and `no_show`: cash, card_pos,
 *   ota_collect → 422 `method` NOT_IN_LIST; a transfer without image → 422 `attachmentId` REQUIRED; the image of a
 *   sale's "khách đã chuyển" notice → 422 NOT_IN_LIST; nothing written (no payment, no audit, folio version, image);
 * - (h2) a transfer / VietQR with its image → 201 `pending` for every desk role, OWN included; the audit row READ
 *   BACK from `audit_event` carries `afterClosure: true` + `reservationStatus`; `Payment.afterClosure` on read;
 * - afterClosureOnly returns exactly the receipts written after closure – and still returns the one of a no-show
 *   restored afterwards (B12), whose `Payment.afterClosure` reads false (SEC-responses 1.2, 1.3);
 * - (h3) a sale on its own cancelled hold: recordPayment still refused (422 AMOUNT_EXCEEDS_BALANCE / 403),
 *   confirmPaymentReceived → 409 + reservationStatus; CTV → 403;
 * - ARC-17: a sale on ANOTHER booking's QR / folio → 404 with no `reservationStatus`;
 * - (h4) FD+ confirmPaymentReceived on a pending QR of a closed booking → 409 + `reservationStatus`, QR untouched;
 * - (h5) createVietQr on a closed booking → 409 + `reservationStatus`, every purpose, OWN, `overBalanceReason` – no row;
 * - "nên làm cùng": J1, B10, B11 expire the folio's pending VietQR in the closing transaction (audit
 *   `payment.expired` + `reservationStatus`, SM-12 reason `reservation_closed`);
 * - (h6) MGR still reverses a receipt written on a closed booking.
 * Fake clock and FAKE data only (guest name of the fixture, `@example.test`-free).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JobRunner } from '../../src/jobs/job-runner';
import { HOLD_EXPIRY_JOB_KEY } from '../../src/jobs/reservation-jobs';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

const DESK = ['fd', 'lead', 'mgr', 'owner'] as const;
const NOTE = 'Khách chuyển sau khi hủy';

describe.skipIf(!HAS_DB)('V5-48 – money on a closed booking (BUG-R5-002, SEC B002-01)', () => {
  let x: Fx;
  beforeAll(async () => {
    // Attachments of the files module stay in memory (no blob on disk).
    process.env.BLOBSTORE_PROVIDER = 'memory';
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  type B = { id: string; code: string; folioId: string };
  const hold = async (room: string, who: 'fd' | 'sal', arrival: string, departure: string) => {
    const svc = x.fa.app.get(ReservationsService);
    const role = { fd: 'front_desk', sal: 'sales_staff' }[who];
    const user = x.t.users[who]!.id;
    const row = await x.db.withContext(
      { ...x.t.ctx(), userId: user, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: user, roles: [role] });
        return svc.createHold(tx, ctx, {
          roomId: x.ids.rooms[room]!,
          channelId: x.ids.channels.direct!,
          arrivalDate: arrival,
          departureDate: departure,
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
  const confirmed = async (room: string, arrival: string, departure: string): Promise<B> => {
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
    expect(j.status).toBe('confirmed');
    return { id: j.id, code: j.code, folioId: j.folioId };
  };
  const j1 = () =>
    x.fa.app.get(JobRunner).runOnce(HOLD_EXPIRY_JOB_KEY, {
      propertyId: x.t.propertyIds[0]!,
      organizationId: x.t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    });
  /** A `deposit_receipt` image of the booking, uploaded by `who` (fake bytes, memory blob store). */
  const attach = (who: string, reservationId: string) =>
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
              { purpose: 'deposit_receipt', reservationId },
              { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
            )
        ).id as string;
      },
    );
  /** A VietQR still `pending` on a folio (FAKE row, as v104-holds: its money "arrives" later). */
  const pendingQr = async (b: B, who: 'fd' | 'sal', amountVnd = 100_000) => {
    const id = uuidv7();
    await x.q(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, created_at, created_by,
         updated_at, qr_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, 'deposit', 'vietqr', 'pending', $7, 'pending', $8, $9, $10, $11, $9, $11,
               'deposit')`,
      [
        id,
        x.t.organizationId,
        x.t.propertyIds[0],
        `QR-V548-${id.slice(-6)}`,
        b.folioId,
        b.id,
        amountVnd,
        new Date('2026-12-31T06:00:00+07:00'),
        x.t.users[who]!.id,
        who === 'sal' ? 'sales_staff' : 'front_desk',
        x.fa.clock.now(),
      ],
    );
    return id;
  };
  const record = (b: B, body: Record<string, unknown>, who: string) =>
    x.c[who]!.send('POST', x.url(`/folios/${b.folioId}/payments`), body);
  const confirmQr = (paymentId: string, who: string) =>
    x.c[who]!.send('POST', x.url(`/payments/${paymentId}/actions/confirm-received`), {});
  const createQr = (b: B, body: Record<string, unknown>, who: string) =>
    x.c[who]!.send('POST', x.url(`/folios/${b.folioId}/vietqr`), body);
  /** Everything a refused call must leave as it was. */
  const snapshot = async (b: B) => {
    const [r] = await x.q(
      `SELECT (SELECT count(*)::int FROM payment WHERE folio_id = $1) AS payments,
              (SELECT count(*)::int FROM payment WHERE folio_id = $1 AND status = 'pending') AS pending,
              (SELECT count(*)::int FROM audit_event WHERE category = 'money' AND entity_code = $2) AS money_audits,
              (SELECT version FROM folio WHERE id = $1) AS folio_version,
              (SELECT count(*)::int FROM attachment WHERE reservation_id = $3 AND bound_ref_id IS NOT NULL) AS bound`,
      [b.folioId, b.code, b.id],
    );
    return r;
  };
  const auditOf = async (paymentId: string, action = 'payment.recorded') =>
    (
      await x.q(
        `SELECT after FROM audit_event WHERE action = $1 AND entity_type = 'payment' AND entity_id = $2`,
        [action, paymentId],
      )
    ).map((r) => r.after as Record<string, unknown>);
  const afterClosureRows = async (who = 'mgr') => {
    const res = await x.c[who]!.get(
      x.url('/audit-events?afterClosureOnly=true&from=2026-11-20&to=2026-11-22&limit=100'),
    );
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data as Array<{ action: string; entityId?: string; after?: any }>;
  };
  const paymentOnFolio = async (b: B, paymentId: string) =>
    ((await x.folio(b.folioId)).payments as any[]).find((p) => p.id === paymentId);

  // Timeline: holds 20/11 10:00 (deadline 21/11 10:00); J1 21/11 10:01; B10 21/11 11:00; B11 21/11 23:10.
  let hFd: B; // FD's hold → J1 (`hold_expired`)
  let hSal: B; // a sale's own hold → J1
  let cB: B; // confirmed → B10 `found_other`
  let cN: B; // confirmed, arrival 21/11 → B11 no-show
  const qrBefore: Record<string, string> = {};
  let noticeImg: string;

  it('setup + "nên làm cùng": J1, B10 and B11 close the bookings and expire their pending VietQR in the same transaction', async () => {
    await x.at('2026-11-20T10:00:00+07:00');
    hFd = await hold('101', 'fd', '2026-12-10', '2026-12-12');
    hSal = await hold('102', 'sal', '2026-12-10', '2026-12-12');
    cB = await confirmed('201', '2026-12-15', '2026-12-17');
    cN = await confirmed('202', '2026-11-21', '2026-11-23');
    qrBefore.hFd = await pendingQr(hFd, 'fd');
    qrBefore.cB = await pendingQr(cB, 'fd');
    qrBefore.cN = await pendingQr(cN, 'fd');
    // A sale reports "khách đã chuyển" with an image while its hold is open (SEC S7: never the proof later).
    noticeImg = await attach('sal', hSal.id);
    const notice = await x.c.sal!.send('POST', x.url(`/reservations/${hSal.id}/deposit-notices`), {
      amountVnd: 300_000,
      note: 'Khách báo đã chuyển',
      attachmentId: noticeImg,
    });
    expect(notice.statusCode, notice.body).toBe(202);

    await x.at('2026-11-21T10:01:00+07:00');
    expect((await j1()).stats).toMatchObject({ expired: 2, failed: 0 });
    await x.at('2026-11-21T11:00:00+07:00');
    const cancel = await x.act(cB.id, 'cancel', { reasonCode: 'found_other' });
    expect(cancel.statusCode, cancel.body).toBe(200);
    await x.at('2026-11-21T23:10:00+07:00');
    const ns = await x.act(cN.id, 'mark-no-show', { contactAttemptNote: 'Không liên lạc được' });
    expect(ns.statusCode, ns.body).toBe(200);

    const st = await x.q(
      `SELECT id, status, cancel_reason_code FROM reservation WHERE id = ANY($1) ORDER BY code`,
      [[hFd.id, hSal.id, cB.id, cN.id]],
    );
    expect(Object.fromEntries(st.map((r) => [r.id, [r.status, r.cancel_reason_code]]))).toEqual({
      [hFd.id]: ['cancelled', 'hold_expired'],
      [hSal.id]: ['cancelled', 'hold_expired'],
      [cB.id]: ['cancelled', 'found_other'],
      [cN.id]: ['no_show', null],
    });
    for (const [k, status] of [
      ['hFd', 'cancelled'],
      ['cB', 'cancelled'],
      ['cN', 'no_show'],
    ] as const) {
      const [p] = await x.q(`SELECT status FROM payment WHERE id = $1`, [qrBefore[k]]);
      expect(p, k).toEqual({ status: 'expired' });
      expect(await auditOf(qrBefore[k]!, 'payment.expired'), k).toEqual([
        { status: 'expired', method: 'vietqr', amountVnd: 100_000, reservationStatus: status },
      ]);
      const [tr] = await x.q(
        `SELECT from_state, to_state, actor_type, reason_code FROM state_transition
          WHERE machine = 'SM-12' AND entity_id = $1`,
        [qrBefore[k]],
      );
      expect(tr, k).toEqual({
        from_state: 'pending',
        to_state: 'expired',
        actor_type: 'system',
        reason_code: 'reservation_closed',
      });
    }
  }, 180_000);

  it('(h1) FD, FDL, MGR, OWN: cash / card_pos / ota_collect → 422 method NOT_IN_LIST, transfer without image → 422 attachmentId REQUIRED; nothing written', async () => {
    for (const b of [hFd, cB, cN]) {
      const img = await attach('fd', b.id);
      const before = await snapshot(b);
      for (const who of DESK) {
        for (const method of ['cash', 'card_pos', 'ota_collect']) {
          const res = await record(
            b,
            {
              type: 'charge',
              method,
              amountVnd: 500_000,
              note: NOTE,
              attachmentId: img,
              ...(method === 'card_pos' ? { posAuthCode: 'A1B2C3' } : {}),
            },
            who,
          );
          expect(res.statusCode, `${b.code} ${who} ${method} ${res.body}`).toBe(422);
          expect(res.json().errors, `${who} ${method}`).toEqual([
            { field: 'method', code: 'NOT_IN_LIST' },
          ]);
        }
        const noImg = await record(
          b,
          { type: 'charge', method: 'bank_transfer', amountVnd: 500_000, note: NOTE },
          who,
        );
        expect(noImg.statusCode, noImg.body).toBe(422);
        expect(noImg.json().errors).toEqual([{ field: 'attachmentId', code: 'REQUIRED' }]);
        // Both rules at once: one 422 with both fields.
        const both = await record(
          b,
          { type: 'charge', method: 'cash', amountVnd: 500_000, note: NOTE, attachmentId: '' },
          who,
        );
        expect(both.statusCode, both.body).toBe(422);
        expect(both.json().errors).toEqual([
          { field: 'method', code: 'NOT_IN_LIST' },
          { field: 'attachmentId', code: 'REQUIRED' },
        ]);
      }
      expect(await snapshot(b), b.code).toEqual(before);
    }
    // (h4)/(h5) on the no-show (before its B12 below): a pending QR cannot be confirmed, no new QR – OWN included.
    const qr = await pendingQr(cN, 'fd');
    const before = await snapshot(cN);
    for (const who of DESK) {
      const conf = await confirmQr(qr, who);
      expect(conf.statusCode, `${who} ${conf.body}`).toBe(409);
      expect(conf.json()).toMatchObject({ currentState: 'pending', reservationStatus: 'no_show' });
      const vq = await createQr(
        cN,
        { amountVnd: 100_000, purpose: 'balance', overBalanceReason: 'Thu trước dịch vụ' },
        who,
      );
      expect(vq.statusCode, `${who} ${vq.body}`).toBe(409);
      expect(vq.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'no_show',
        reservationStatus: 'no_show',
      });
    }
    expect(await snapshot(cN)).toEqual(before);
  }, 180_000);

  it('(h1) SEC S7: the image of a sale\'s "khách đã chuyển" notice is never the proof → 422 attachmentId NOT_IN_LIST, nothing written', async () => {
    const before = await snapshot(hSal);
    const res = await record(
      hSal,
      {
        type: 'deposit',
        method: 'bank_transfer',
        amountVnd: 300_000,
        note: NOTE,
        attachmentId: noticeImg,
      },
      'mgr',
    );
    expect(res.statusCode, res.body).toBe(422);
    expect(res.json().errors).toEqual([{ field: 'attachmentId', code: 'NOT_IN_LIST' }]);
    expect(await snapshot(hSal)).toEqual(before);
  }, 60_000);

  const written: Record<string, string> = {};
  it('(h2) a transfer / VietQR with its image → 201 `pending` for FD, FDL, MGR and OWN; audit_event read back has afterClosure + reservationStatus; Payment.afterClosure on read', async () => {
    const cases: Array<[B, string, string, 'cancelled' | 'no_show']> = [
      [hFd, 'fd', 'bank_transfer', 'cancelled'],
      [cB, 'lead', 'vietqr', 'cancelled'],
      [cN, 'mgr', 'bank_transfer', 'no_show'],
      [hSal, 'owner', 'bank_transfer', 'cancelled'],
    ];
    for (const [b, who, method, reservationStatus] of cases) {
      const img = await attach(who, b.id);
      const v0 = (await snapshot(b)).folio_version as number;
      const res = await record(
        b,
        { type: 'deposit', method, amountVnd: 300_000, note: NOTE, attachmentId: img },
        who,
      );
      expect(res.statusCode, `${who} ${res.body}`).toBe(201);
      const p = res.json();
      // OWN included: never "reconciled" by recording it (SEC 3.1 (d)).
      expect(p, who).toMatchObject({
        status: 'succeeded',
        reconciliation: 'pending',
        method,
        attachmentId: img,
        afterClosure: true,
      });
      written[b.code] = p.id;
      // Read back from the TABLE (C0313-22 ý 3, SEC-responses 1.3) – not only the API answer.
      expect(await auditOf(p.id), who).toEqual([
        expect.objectContaining({
          method,
          amountVnd: 300_000,
          reconciliation: 'pending',
          afterClosure: true,
          reservationStatus,
        }),
      ]);
      const [db] = await x.q(`SELECT reconciliation, attachment_id FROM payment WHERE id = $1`, [
        p.id,
      ]);
      expect(db).toEqual({ reconciliation: 'pending', attachment_id: img });
      expect((await snapshot(b)).folio_version).toBeGreaterThan(v0);
      // Payment.afterClosure is computed at read (folio view and payment list).
      expect(await paymentOnFolio(b, p.id)).toMatchObject({ afterClosure: true });
    }
    // A usual receipt never carries the flag (folio of the J1 hold: the expired QR).
    expect((await paymentOnFolio(hFd, qrBefore.hFd!)).afterClosure).toBeUndefined();
    const list = await x.c.mgr!.get(x.url('/payments?reconciliation=pending&limit=100'));
    expect(list.statusCode, list.body).toBe(200);
    const listed = (list.json().data as any[]).find((r) => r.id === written[cB.code]);
    expect(listed).toMatchObject({ afterClosure: true, reservationCode: cB.code });
  }, 180_000);

  it('afterClosureOnly (SEC S6): exactly the receipts written after closure, one per booking – FD sees only its own', async () => {
    const rows = await afterClosureRows('mgr');
    expect(
      rows.every((r) => r.action === 'payment.recorded' && r.after?.afterClosure === true),
    ).toBe(true);
    expect(rows.map((r) => r.entityId).sort()).toEqual(Object.values(written).sort());
    for (const code of [hFd.code, cB.code, cN.code, hSal.code]) {
      expect(
        rows.filter((r) => r.entityId === written[code]),
        code,
      ).toHaveLength(1);
    }
    // x-scope own: FD gets its own row only.
    expect((await afterClosureRows('fd')).map((r) => r.entityId)).toEqual([written[hFd.code]]);
    const bad = await x.c.mgr!.get(x.url('/audit-events?afterClosureOnly=yes'));
    expect(bad.statusCode, bad.body).toBe(422);
    expect(bad.json().errors).toEqual([{ field: 'afterClosureOnly', code: 'VALIDATION_FAILED' }]);
  }, 60_000);

  it('SEC-responses 1.2/1.3: no-show restored (B12) after a late receipt – Payment.afterClosure reads false, afterClosureOnly still returns the row', async () => {
    const restore = await x.act(cN.id, 'restore-no-show', { reason: 'Khách tới muộn' }, 'mgr');
    expect(restore.statusCode, restore.body).toBe(200);
    expect(restore.json().status).toBe('confirmed');
    const p = await paymentOnFolio(cN, written[cN.code]!);
    expect(p.afterClosure).toBeUndefined();
    const rows = await afterClosureRows('mgr');
    expect(rows.filter((r) => r.entityId === written[cN.code])).toHaveLength(1);
    expect(await auditOf(written[cN.code]!)).toEqual([
      expect.objectContaining({ afterClosure: true, reservationStatus: 'no_show' }),
    ]);
  }, 60_000);

  it('(h3) a sale on its own cancelled hold: recordPayment refused as before, confirmPaymentReceived → 409 + reservationStatus; CTV → 403; nothing written', async () => {
    const qr = await pendingQr(hSal, 'sal');
    const img = await attach('sal', hSal.id);
    const before = await snapshot(hSal);
    const dep = await record(
      hSal,
      { type: 'deposit', method: 'bank_transfer', amountVnd: 300_000, attachmentId: img },
      'sal',
    );
    expect(dep.statusCode, dep.body).toBe(422);
    expect(dep.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: 0,
    });
    expect(dep.json().reservationStatus).toBeUndefined();
    const charge = await record(
      hSal,
      { type: 'charge', method: 'bank_transfer', amountVnd: 300_000, attachmentId: img },
      'sal',
    );
    expect(charge.statusCode, charge.body).toBe(403);
    const conf = await confirmQr(qr, 'sal');
    expect(conf.statusCode, conf.body).toBe(409);
    expect(conf.json()).toMatchObject({
      code: 'INVALID_TRANSITION',
      currentState: 'pending',
      reservationStatus: 'cancelled',
    });
    const ctv = await record(
      hSal,
      { type: 'deposit', method: 'bank_transfer', amountVnd: 300_000, attachmentId: img },
      'ctv',
    );
    expect(ctv.statusCode, ctv.body).toBe(403);
    expect((await confirmQr(qr, 'ctv')).statusCode).toBe(403);
    expect(await snapshot(hSal)).toEqual(before);
  }, 60_000);

  it("SEC ARC-17: a sale on another booking's QR / folio → 404 with no reservationStatus (404 before 409)", async () => {
    const qr = await pendingQr(hFd, 'fd');
    const before = await snapshot(hFd);
    const conf = await confirmQr(qr, 'sal');
    expect(conf.statusCode, conf.body).toBe(404);
    expect(conf.json().reservationStatus).toBeUndefined();
    const rec = await record(
      hFd,
      { type: 'deposit', method: 'bank_transfer', amountVnd: 100_000 },
      'sal',
    );
    expect(rec.statusCode, rec.body).toBe(404);
    expect(rec.json().reservationStatus).toBeUndefined();
    const vq = await createQr(hFd, { amountVnd: 100_000, purpose: 'deposit' }, 'sal');
    expect(vq.statusCode, vq.body).toBe(404);
    expect(vq.json().reservationStatus).toBeUndefined();
    expect(await snapshot(hFd)).toEqual(before);
    // (h4) FD+ on the same pending QR of the closed booking → 409, every desk role; the QR stays pending.
    for (const who of DESK) {
      const r = await confirmQr(qr, who);
      expect(r.statusCode, `${who} ${r.body}`).toBe(409);
      expect(r.json(), who).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'pending',
        reservationStatus: 'cancelled',
      });
    }
    expect(await snapshot(hFd)).toEqual(before);
  }, 60_000);

  it('(h5) createVietQr on a closed booking → 409 + reservationStatus, every purpose, OWN and overBalanceReason included; no QR row', async () => {
    const restoredCn = cN; // confirmed again since B12 – takes a QR as usual (control)
    for (const [b, status] of [
      [hFd, 'cancelled'],
      [cB, 'cancelled'],
    ] as const) {
      const before = await snapshot(b);
      for (const [who, body] of [
        ['fd', { amountVnd: 100_000, purpose: 'deposit' }],
        ['lead', { amountVnd: 100_000, purpose: 'balance' }],
        ['mgr', { amountVnd: 900_000, purpose: 'balance', overBalanceReason: 'Thu trước dịch vụ' }],
        ['owner', { amountVnd: 100_000 }],
        [
          'owner',
          { amountVnd: 100_000, purpose: 'check_out', checkoutAt: '2026-11-21T11:00:00+07:00' },
        ],
        // Body rules come after the closed-booking rule (V5-48 order): even a bad amount gets the 409.
        ['fd', { amountVnd: 0, purpose: 'deposit' }],
      ] as const) {
        const r = await createQr(b, body, who);
        expect(r.statusCode, `${b.code} ${who} ${r.body}`).toBe(409);
        expect(r.json(), `${b.code} ${who}`).toMatchObject({
          code: 'INVALID_TRANSITION',
          currentState: status,
          reservationStatus: status,
        });
      }
      expect(await snapshot(b), b.code).toEqual(before);
    }
    // The no-show case ran before B12 ((h4)/(h5) no_show). Once restored the booking takes the usual path again
    // (no receiving account in this tenant → 409 PAYMENT_NOT_CONFIGURED, i.e. past the closed-booking rule).
    const ok = await createQr(restoredCn, { amountVnd: 100_000, purpose: 'balance' }, 'fd');
    expect(ok.statusCode, ok.body).toBe(409);
    expect(ok.json()).toMatchObject({ code: 'PAYMENT_NOT_CONFIGURED' });
    expect(ok.json().reservationStatus).toBeUndefined();
  }, 120_000);

  it('(h6) MGR still reverses a receipt written on a closed booking', async () => {
    const res = await x.reverse(written[cB.code]!, 'Ghi nhầm đơn')();
    expect(res.statusCode, res.body).toBe(200);
    const [p] = await x.q(`SELECT status FROM payment WHERE id = $1`, [written[cB.code]]);
    expect(p).toEqual({ status: 'reversed' });
  }, 60_000);
});
