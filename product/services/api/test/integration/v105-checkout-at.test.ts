/**
 * BE-A1 v1.0.5 – V5-10 (OpenAPI 0.3.13 `checkOut` "Quy đổi giờ trả"; contract 0.3.13 1.1, 1.19; BUG-R4-036,
 * BUG-R4-051; BE C0313-01, 07, 08, 09) on the real PostgreSQL through HTTP: ONE `checkoutAt` for the check-out summary,
 * the `check_out` VietQR and B18; the B18 button from 00:00 of the departure day on the stay's effective departure.
 * Tests T10-1…T10-5, T10-8, T10-9 of the contract; T15-15 (no check_out on the primary's own departure while an
 * extension child is in force). Fake clock, FAKE data (rollover 06:00, standard check-out 12:00, tolerance 30 min).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../src/modules/reservations/public/sales-port';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

class DocsOk implements FrontdeskRegistrationPort {
  async checkinDocumentStatus(): Promise<CheckinDocumentStatus> {
    return {
      mainGuestDocument: true,
      documentCheckBlock: false,
      pendingOnlineCheckin: false,
      visaExpiresBeforeDeparture: false,
      passportExpiresDuringStay: false,
    };
  }
  async deadlinePreview(): Promise<Date | null> {
    return null;
  }
  async onCheckedIn(): Promise<Date | null> {
    return null;
  }
  async onCheckInUndone() {}
  async onDepartureChanged() {}
  async onRoomChanged() {}
  async onPartyChanged() {}
  async onPartyMemberRemoved() {}
  async onCheckedOut() {}
  async onReservationVoided() {}
  async earliestVisaValidUntil(): Promise<string | null> {
    return null;
  }
}

const ROLES = { owner: ['owner'], fd: ['front_desk'] };
/** Fake receiving account (same test values as vietqr-stay-step.test.ts). */
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' };

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('V5-10 – one checkoutAt: summary, QR, B18 (BE-A1)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Giờ Trả' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    const token = randomBytes(32).toString('base64url');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at, expires_at)
         VALUES ($1, $2, $3, 'desk', 'desk', $4, $5, $6)`,
        [
          uuidv7(),
          t.organizationId,
          t.propertyIds[0],
          sha256Hex(token),
          new Date('2026-10-01T00:00:00Z'),
          new Date('2027-12-31T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    await setPassword(db, t, 'owner');
    // 0.3.8 (R3-Q51): the receiving account takes effect from the next business day.
    await at('2026-11-01T09:00:00+07:00');
    const put = await c.owner!.send('PUT', url('/parameters/payment_receiving_account'), {
      value: ACCOUNT,
      effectiveFrom: '2026-11-02',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    expect(put.statusCode, put.body).toBe(200);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown) =>
    c.fd!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
  const totals = async (folioId: string) =>
    (await c.fd!.get(url(`/folios/${folioId}`))).json().totals as {
      balanceDueVnd: number;
      creditVnd: number;
    };
  const create = async (body: Record<string, unknown>): Promise<Booking> => {
    // Booked ahead (the tests move the clock forward and back).
    await at('2026-11-10T10:00:00+07:00');
    let res = await c.fd!.send('POST', url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.fd!.send('POST', url('/reservations'), {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        },
      });
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const direct = (room: string, from: string, to: string) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
    });
  /** Check-in at 15:00 on `from` with the folio paid in full (so a check-out without surcharge owes 0). */
  const stay = async (b: Booking, from: string) => {
    await at(`${from}T15:00:00+07:00`);
    const due = (await totals(b.folioId)).balanceDueVnd;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect([200, 201], p.body).toContain(p.statusCode);
    }
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
  };
  const summary = async (id: string, query: string) => {
    const r = await c.fd!.get(url(`/reservations/${id}/checkout-summary?${query}`));
    expect(r.statusCode, r.body).toBe(200);
    return r.json();
  };
  const qr = (b: Booking, body: Record<string, unknown>) =>
    c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), body);
  const checkOuts = (r: { allowedActions?: Array<{ event: string }> }) =>
    (r.allowedActions ?? []).map((a) => a.event).filter((e) => e === 'check_out');

  it('T10-1 (BUG-R4-051): 07:00 on the departure day typing 05:30 → that morning, no surcharge, note required; B18 records 05:30', async () => {
    const b = await direct('101', '2026-11-21', '2026-11-23');
    await stay(b, '2026-11-21');
    await at('2026-11-23T07:00:00+07:00');
    const s = await summary(b.id, 'checkoutTime=05:30');
    expect(s).toMatchObject({
      checkoutAt: '2026-11-23T05:30:00.000+07:00',
      checkoutTime: '05:30',
      checkoutTimeNoteRequired: true,
      checkoutAtAfterNow: false,
      postMidnightWindow: true,
      extraNightRequired: false,
      lateCheckoutSurcharge: { amountVnd: 0 },
      amountDueAtCheckoutVnd: 0,
    });
    // Typed time only (as before 0.3.13): read as 23/11 05:30, so only the note is missing – no extra night, no 422 time.
    const noNote = await act(b.id, 'check-out', { checkoutTime: '05:30' });
    expect(noNote.statusCode).toBe(422);
    expect(noNote.json().errors).toEqual([
      { field: 'checkoutTimeNote', code: 'TIME_NOTE_REQUIRED' },
    ]);
    const out = await act(b.id, 'check-out', {
      checkoutTime: '05:30',
      checkoutAt: s.checkoutAt,
      checkoutTimeNote: 'Khách đi sớm, ca đêm ghi sau',
    });
    expect(out.statusCode, out.body).toBe(200);
    const [audit] = await q<{ after: Record<string, unknown> }>(
      `SELECT after FROM audit_event WHERE entity_id = $1 AND action = 'reservation.checked_out'`,
      [b.id],
    );
    // The departure time recorded and the clock time it was recorded at (allowlist SR-AUD-03 – read back).
    expect(audit!.after).toMatchObject({
      checkoutTime: '05:30',
      systemTime: '07:00',
      lateSurchargeVnd: 0,
      checkoutMode: 'desk',
      postMidnightWindow: true,
    });
  });

  it('T10-2: 01:05 on departure + 1 typing 01:00 → departure + 1 01:00, after the last tier: extra night', async () => {
    const b = await direct('102', '2026-11-21', '2026-11-23');
    await stay(b, '2026-11-21');
    await at('2026-11-24T01:05:00+07:00');
    const s = await summary(b.id, 'checkoutTime=01:00');
    expect(s).toMatchObject({
      checkoutAt: '2026-11-24T01:00:00.000+07:00',
      postMidnightWindow: false,
      extraNightRequired: true,
      checkoutAtAfterNow: false,
      checkoutTimeNoteRequired: false,
    });
    const out = await act(b.id, 'check-out', { checkoutTime: '01:00' });
    expect(out.statusCode).toBe(422);
    expect(out.json().errors).toContainEqual({
      field: 'extraNight',
      code: 'LATE_CHECKOUT_AFTER_LIMIT',
    });
  });

  it('T10-3 (BUG-R4-036): check_out from 00:00 of the departure day for FD; 00:30 typing 00:20 is a plain B18', async () => {
    const b = await direct('103', '2026-11-22', '2026-11-24');
    await stay(b, '2026-11-22');
    await at('2026-11-23T23:50:00+07:00');
    expect(checkOuts(await get(b.id))).toEqual([]);
    await at('2026-11-24T00:30:00+07:00');
    expect(checkOuts(await get(b.id))).toEqual(['check_out']);
    const s = await summary(b.id, 'checkoutTime=00:20');
    expect(s).toMatchObject({
      checkoutAt: '2026-11-24T00:20:00.000+07:00',
      postMidnightWindow: true,
      lateCheckoutSurcharge: { amountVnd: 0 },
      checkoutTimeNoteRequired: false,
      checkoutAtAfterNow: false,
    });
    const out = await act(b.id, 'check-out', { checkoutTime: '00:20', checkoutAt: s.checkoutAt });
    expect(out.statusCode, out.body).toBe(200);
  });

  it('T10-4: a typed time ahead of the server clock + tolerance → summary flag, B18 422 TIME_AFTER_ACTION', async () => {
    const b = await direct('201', '2026-11-21', '2026-11-23');
    await stay(b, '2026-11-21');
    await at('2026-11-23T10:00:00+07:00');
    const s = await summary(b.id, 'checkoutTime=11:00');
    expect(s).toMatchObject({
      checkoutAt: '2026-11-23T11:00:00.000+07:00',
      checkoutAtAfterNow: true,
    });
    const typed = await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(typed.statusCode).toBe(422);
    expect(typed.json().errors).toEqual([{ field: 'checkoutTime', code: 'TIME_AFTER_ACTION' }]);
    const sent = await act(b.id, 'check-out', {
      checkoutTime: '11:00',
      checkoutAt: s.checkoutAt,
    });
    expect(sent.json().errors).toEqual([{ field: 'checkoutAt', code: 'TIME_AFTER_ACTION' }]);
    // Within the tolerance it goes through.
    const ok = await act(b.id, 'check-out', { checkoutTime: '10:20' });
    expect(ok.statusCode, ok.body).toBe(200);
  });

  it('T10-9 + T10-5 (C0313-01): a checkoutAt ahead → QR 422 and nothing written; the same checkoutAt gives summary = QR cap = B18 cap', async () => {
    const b = await direct('202', '2026-11-21', '2026-11-23');
    await stay(b, '2026-11-21');
    const leaveAt = '2026-11-23T14:00:00+07:00';
    // 13:00: one hour before the departure the desk typed.
    await at('2026-11-23T13:00:00+07:00');
    const ahead = await summary(b.id, `checkoutAt=${encodeURIComponent(leaveAt)}`);
    expect(ahead).toMatchObject({
      checkoutAt: '2026-11-23T14:00:00.000+07:00',
      checkoutAtAfterNow: true,
    });
    const [before] = await q<{ n: number }>('SELECT count(*)::int AS n FROM audit_event');
    const refused = await qr(b, {
      purpose: 'check_out',
      checkoutAt: ahead.checkoutAt,
      amountVnd: 1,
    });
    expect(refused.statusCode, refused.body).toBe(422);
    expect(refused.json().errors).toEqual([{ field: 'checkoutAt', code: 'TIME_AFTER_ACTION' }]);
    const [after] = await q<{ n: number }>('SELECT count(*)::int AS n FROM audit_event');
    expect(after!.n).toBe(before!.n);
    expect(
      await q('SELECT id FROM payment WHERE folio_id = $1 AND method = $2', [b.folioId, 'vietqr']),
    ).toEqual([]);
    // `amountDueNow` (confirmPaymentReceived) uses the same rule – refused through the port.
    const port = fa.app.get<ReservationSalesPort>(RESERVATION_SALES_PORT, { strict: false });
    await expect(
      db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, (tx) =>
        port.amountDueNowFor(tx, {
          reservationId: b.id,
          purpose: 'check_out',
          actor: { userId: t.users.fd!.id, roles: ['front_desk'] },
          checkoutAt: new Date(leaveAt),
        }),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    // 14:00: the summary's checkoutAt is forwarded to the QR and to B18 – one number everywhere.
    await at('2026-11-23T14:05:00+07:00');
    const s = await summary(b.id, 'checkoutTime=14:00');
    expect(s.checkoutAt).toBe('2026-11-23T14:00:00.000+07:00');
    const due = s.amountDueAtCheckoutVnd as number;
    expect(due).toBe(s.lateCheckoutSurcharge.amountVnd);
    expect(due).toBeGreaterThan(0);
    const cap = await qr(b, {
      purpose: 'check_out',
      checkoutAt: s.checkoutAt,
      amountVnd: due + 1,
    });
    expect(cap.statusCode).toBe(422);
    expect(cap.json()).toMatchObject({ max: due });
    const body = {
      checkoutTime: '14:00',
      checkoutAt: s.checkoutAt,
      applyLateSurcharge: true,
      expectedSurchargeVnd: due,
    };
    const over = await act(b.id, 'check-out', {
      ...body,
      finalPayment: { type: 'charge', method: 'cash', amountVnd: due + 1 },
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({
      errors: [{ field: 'finalPayment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: due,
    });
    const out = await act(b.id, 'check-out', {
      ...body,
      finalPayment: { type: 'charge', method: 'cash', amountVnd: due },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b.folioId)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('T10-8 (C0313-07): departure 24/11, 01:05 on 24/11 typing 23:50 → 23/11 23:50, no surcharge; QR and B18 take it', async () => {
    const b = await direct('203', '2026-11-22', '2026-11-24');
    await stay(b, '2026-11-22');
    await at('2026-11-24T01:05:00+07:00');
    const s = await summary(b.id, 'checkoutTime=23:50');
    expect(s).toMatchObject({
      checkoutAt: '2026-11-23T23:50:00.000+07:00',
      checkoutTime: '23:50',
      postMidnightWindow: true,
      lateCheckoutSurcharge: { amountVnd: 0 },
      extraNightRequired: false,
      checkoutTimeNoteRequired: true,
      checkoutAtAfterNow: false,
      amountDueAtCheckoutVnd: 0,
    });
    const cap = await qr(b, { purpose: 'check_out', checkoutAt: s.checkoutAt, amountVnd: 1 });
    expect(cap.statusCode).toBe(422);
    expect(cap.json()).toMatchObject({ max: 0 });
    // Sent as `checkoutAt` (business date = departure − 1): accepted now (was 422 DATE_INVALID).
    const out = await act(b.id, 'check-out', {
      checkoutTime: '23:50',
      checkoutAt: s.checkoutAt,
      checkoutTimeNote: 'Khách đi tối qua, ca đêm ghi',
    });
    expect(out.statusCode, out.body).toBe(200);
  });

  it('a checkoutAt the evening before is refused outside the post-midnight window (422 DATE_INVALID)', async () => {
    const b = await direct('301', '2026-11-22', '2026-11-24');
    await stay(b, '2026-11-22');
    await at('2026-11-24T07:00:00+07:00');
    const r = await c.fd!.get(
      url(
        `/reservations/${b.id}/checkout-summary?checkoutAt=${encodeURIComponent('2026-11-23T23:50:00+07:00')}`,
      ),
    );
    expect(r.statusCode).toBe(422);
    expect(r.json().errors).toEqual([{ field: 'checkoutAt', code: 'DATE_INVALID' }]);
  });

  it('T15-15 (C0313-09): OTA stay extended by a child – no check_out on the primary departure, check_out on the child departure', async () => {
    await at('2026-11-21T15:00:00+07:00');
    const o = await create({
      roomId: ids.rooms['302'],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: 1_800_000,
      arrivalDate: '2026-11-21',
      departureDate: '2026-11-23',
    });
    await at('2026-11-21T15:00:00+07:00');
    const ci = await act(o.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2026-11-22T10:00:00+07:00');
    const ext = await act(o.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect(ext.json().childReservation).toMatchObject({ departureDate: '2026-11-24' });
    await at('2026-11-23T10:00:00+07:00');
    const primary = await get(o.id);
    expect(primary.stayDepartureDate).toBe('2026-11-24');
    expect(checkOuts(primary)).toEqual([]);
    await at('2026-11-24T00:30:00+07:00');
    expect(checkOuts(await get(o.id))).toEqual(['check_out']);
    await at('2026-11-24T10:00:00+07:00');
    expect(checkOuts(await get(o.id))).toEqual(['check_out']);
    // The child booking never offers B18 (the server checks out the primary only).
    expect(checkOuts(await get(ext.json().childReservation.id))).toEqual([]);
  });
});
