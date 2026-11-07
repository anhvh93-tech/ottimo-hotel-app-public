/**
 * V5-48 follow-ups from ARC (rounds/round-05/reviews/ARC-on-prs-105-119-125-128.md), on PostgreSQL:
 * - FB-R5-ARC-BE-105-01: the "after closure" flag follows the time the SERVER wrote the receipt, never the
 *   `receivedAt` the desk typed (C0313-22, DOM 1.1) – a receipt written after the cancellation with `receivedAt`
 *   back-dated before it is still `afterClosure` and still in `afterClosureOnly` (mutation m6: `received_at` instead
 *   of `created_at` must turn this red);
 * - FB-R5-ARC-BE-105-02: closing a booking expires the pending VietQR of a folio only when that booking is the
 *   folio's PRIMARY one – another booking of a shared folio leaving keeps the QR `pending` (mutation m9: dropping
 *   `f.primary_reservation_id = $2` must turn this red); the primary closing expires it (`reservation_closed`).
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { PaymentService } from '../../src/modules/payments/public/payment.service';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

describe.skipIf(!HAS_DB)('V5-48 follow-ups (ARC 105-01, 105-02)', () => {
  let x: Fx;
  beforeAll(async () => {
    process.env.BLOBSTORE_PROVIDER = 'memory'; // receipt images
    x = await startFixture();
  });
  afterAll(async () => {
    await x?.close();
  });

  type B = { id: string; code: string; version: number; folioId: string };
  /** A direct booking made by FD (with the cash deposit asked for when one is required). */
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
    return res.json() as B;
  };
  const attach = (who: string, reservationId: string) =>
    x.db.withContext(
      { ...x.t.ctx(), userId: x.t.users[who]!.id, actorType: 'user' } as any,
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
  /** A VietQR still `pending` on a folio (FAKE row, as the V5-48 file: its money "arrives" later). */
  const pendingQr = async (b: B) => {
    const id = uuidv7();
    await x.q(
      `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
         reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, created_at, created_by,
         updated_at, qr_purpose)
       VALUES ($1, $2, $3, $4, $5, $6, 'deposit', 'vietqr', 'pending', 100000, 'pending', $7, $8, 'front_desk',
               $9, $8, $9, 'deposit')`,
      [
        id,
        x.t.organizationId,
        x.t.propertyIds[0],
        `QR-ARC105-${id.slice(-6)}`,
        b.folioId,
        b.id,
        new Date('2026-12-31T06:00:00+07:00'),
        x.t.users.fd!.id,
        x.fa.clock.now(),
      ],
    );
    return id;
  };
  const statusOf = async (paymentId: string) =>
    (await x.q(`SELECT status FROM payment WHERE id = $1`, [paymentId]))[0].status as string;

  it('105-01: cancelled at T, FD records at T+1h with receivedAt = T−2h → Payment.afterClosure true and the row is in afterClosureOnly', async () => {
    await x.at('2026-11-20T10:00:00+07:00');
    const b = await confirmed('301', '2026-12-15', '2026-12-17');
    // T = 21/11 11:00 – B10.
    await x.at('2026-11-21T11:00:00+07:00');
    const cancel = await x.act(b.id, 'cancel', { reasonCode: 'found_other' });
    expect(cancel.statusCode, cancel.body).toBe(200);
    // T + 1 h: the guest's transfer shows up; the desk types the time the bank says, T − 2 h.
    await x.at('2026-11-21T12:00:00+07:00');
    const res = await x.c.fd!.send('POST', x.url(`/folios/${b.folioId}/payments`), {
      // 5B-1 (PR-B3): a booking cancelled while confirmed takes `charge` after closure (`deposit` only for a hold).
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: 300_000,
      receivedAt: '2026-11-21T09:00:00+07:00',
      note: 'Khách chuyển trước giờ hủy, ngân hàng báo muộn',
      attachmentId: await attach('fd', b.id),
    });
    expect(res.statusCode, res.body).toBe(201);
    const paymentId = res.json().id as string;
    const [row] = await x.q(`SELECT received_at, created_at FROM payment WHERE id = $1`, [
      paymentId,
    ]);
    // The premise of the case: received before the closure, written after it.
    const [r] = await x.q(`SELECT cancelled_at FROM reservation WHERE id = $1`, [b.id]);
    expect(new Date(row.received_at).getTime()).toBeLessThan(new Date(r.cancelled_at).getTime());
    expect(new Date(row.created_at).getTime()).toBeGreaterThan(new Date(r.cancelled_at).getTime());

    const onFolio = ((await x.folio(b.folioId)).payments as any[]).find((p) => p.id === paymentId);
    expect(onFolio?.afterClosure).toBe(true);
    const list = await x.c.mgr!.get(
      x.url('/audit-events?afterClosureOnly=true&from=2026-11-20&to=2026-11-22&limit=100'),
    );
    expect(list.statusCode, list.body).toBe(200);
    const rows = (list.json().data as any[]).filter((e) => e.entityId === paymentId);
    expect(rows.map((e) => e.action)).toEqual(['payment.recorded']);
    expect(rows[0].after).toMatchObject({ afterClosure: true, reservationStatus: 'cancelled' });
  }, 120_000);

  it('105-02: a shared folio – the closing booking is not its primary → the QR stays pending; the primary closing → expired (reservation_closed)', async () => {
    await x.at('2026-11-20T10:00:00+07:00');
    const primary = await confirmed('302', '2026-12-20', '2026-12-22');
    const other = await confirmed('203', '2026-12-20', '2026-12-22');
    const qr = await pendingQr(primary);
    const svc = x.fa.app.get(PaymentService);
    const expire = (reservationId: string) =>
      x.db.withContext({ ...x.t.ctx(), userId: null, actorType: 'system' } as any, (tx) =>
        svc.expirePendingQrOnClosure(tx, {
          folioId: primary.folioId,
          reservationId,
          reservationStatus: 'cancelled',
        }),
      );
    // Another booking of the folio leaves (as MoneyBridge.voided calls it with the folio it shares).
    expect(await expire(other.id)).toEqual([]);
    expect(await statusOf(qr)).toBe('pending');
    // The folio's own booking closes: its QR expires, reason reservation_closed (SM-12).
    expect(await expire(primary.id)).toEqual([qr]);
    expect(await statusOf(qr)).toBe('expired');
    const [tr] = await x.q(
      `SELECT to_state, actor_type, reason_code FROM state_transition
        WHERE machine = 'SM-12' AND entity_id = $1`,
      [qr],
    );
    expect(tr).toEqual({
      to_state: 'expired',
      actor_type: 'system',
      reason_code: 'reservation_closed',
    });
  }, 120_000);
});
