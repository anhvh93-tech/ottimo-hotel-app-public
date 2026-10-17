/**
 * BE-B Sprint 4 – S4-10 (rest of BUG-R2-038): createVietQr `purpose=check_in` / `check_out` (OpenAPI 0.3.7) on the
 * real PostgreSQL through HTTP. Numbers from the QA oracle BR-402-01: at 11:00 on the arrival day the QR of the
 * check-in step is capped at `CheckInPreview.amountDueAtCheckinVnd` (1.710.000 = balance 1.500.000 + early surcharge
 * 210.000), not at the balance due now; once confirmed, B9 needs no payment (0.3.7 bổ sung 1). The check-out QR is
 * capped at `CheckoutSummary.amountDueAtCheckoutVnd`. Field cross-checks 422 NOT_ALLOWED, SAL/CTV 403, wrong state /
 * day 409 INVALID_TRANSITION. Fake clock, FAKE data.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { addDays } from '../../src/shared/time';
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

const ROLES = {
  owner: ['owner'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  sal: ['sales_staff'],
};
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' };

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; input: Record<string, any>; expected: Record<string, any> }>;
};
const o = ORACLES.examples.find((x) => x.id === 'BR-402-01');

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('createVietQr check_in / check_out (BE-B Sprint 4, S4-10)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  if (!o) throw new Error('oracle BR-402-01 missing');
  const input = o.input;
  const expected = o.expected;
  const dates = Object.keys(input.nightRatesVnd as Record<string, number>);
  const arrivalAt = `${input.arrivalDate}T${input.checkinTime}:00+07:00`;

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử QR' });
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
    await at('2026-10-15T09:00:00+07:00');
    const put = await c.owner!.send('PUT', url('/parameters/payment_receiving_account'), {
      value: ACCOUNT,
      effectiveFrom: '2026-10-15',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    expect(put.statusCode, put.body).toBe(200);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  function url(path = '') {
    return `${P(t)}${path}`;
  }
  async function at(iso: string) {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  }
  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const totals = async (folioId: string) =>
    (await c.fd!.get(url(`/folios/${folioId}`))).json().totals as {
      balanceDueVnd: number;
      creditVnd: number;
    };
  const book = async (room: string): Promise<Booking> => {
    await at('2026-10-15T10:00:00+07:00');
    const res = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      nightlyRates: dates.map((date) => ({ date, amountVnd: input.nightRatesVnd[date] })),
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: input.depositPaidVnd },
    });
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const qr = (who: string, b: Booking, body: Record<string, unknown>) =>
    c[who]!.send('POST', url(`/folios/${b.folioId}/vietqr`), body);
  const confirm = (paymentId: string) =>
    c.fd!.send('POST', url(`/payments/${paymentId}/actions/confirm-received`), {});
  const preview = async (b: Booking) => {
    const pv = await c.fd!.get(
      url(`/reservations/${b.id}/check-in-preview?checkinTime=${input.checkinTime}`),
    );
    expect(pv.statusCode, pv.body).toBe(200);
    return pv.json() as { amountDueAtCheckinVnd: number; balanceDueVnd: number };
  };
  const checkIn = async (b: Booking, extra: Record<string, unknown> = {}) =>
    c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/check-in`),
      {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: input.checkinTime,
        applyEarlySurcharge: true,
        expectedSurchargeVnd: input.earlySurchargeVnd,
        ...extra,
      },
      { 'if-match': `"${(await get(b.id)).version}"` },
    );
  const qrCount = async (b: Booking) =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM payment WHERE folio_id = $1 AND method = 'vietqr'`,
          [b.folioId],
        ),
      )
    ).rows[0]!.n;

  it('TC-L3-079 (b): 11:00 on arrival – QR check_in 1.710.000 (amountDueAtCheckinVnd, > balance 1.500.000); +1 → 422 max; confirmed → due 0 → B9 without payment', async () => {
    const b = await book('201');
    await at(arrivalAt);
    expect(await preview(b)).toMatchObject({
      balanceDueVnd: expected.balanceDueBeforeCheckinVnd,
      amountDueAtCheckinVnd: expected.amountDueAtCheckinVnd,
    });
    // as before 0.3.7 the plain balance QR stays capped at the balance due now
    const plain = await qr('fd', b, { amountVnd: expected.amountDueAtCheckinVnd });
    expect(plain.statusCode).toBe(422);
    expect(plain.json()).toMatchObject({ max: expected.balanceDueBeforeCheckinVnd });
    const over = await qr('fd', b, {
      amountVnd: expected.paymentCapVnd + 1,
      purpose: 'check_in',
      checkinTime: input.checkinTime,
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({
      errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: expected.paymentCapVnd,
    });
    const ok = await qr('fd', b, {
      amountVnd: expected.amountDueAtCheckinVnd,
      purpose: 'check_in',
      checkinTime: input.checkinTime,
    });
    expect(ok.statusCode, ok.body).toBe(201);
    expect(ok.json().payment).toMatchObject({
      type: 'charge',
      method: 'vietqr',
      status: 'pending',
      amountVnd: expected.amountDueAtCheckinVnd,
    });
    // no folio line is written by the QR (surcharge only at B9)
    expect(await totals(b.folioId)).toMatchObject({
      balanceDueVnd: expected.balanceDueBeforeCheckinVnd,
    });
    const conf = await confirm(ok.json().payment.id);
    expect(conf.statusCode, conf.body).toBe(200);
    expect((await preview(b)).amountDueAtCheckinVnd).toBe(0);
    const ci = await checkIn(b);
    expect(ci.statusCode, ci.body).toBe(200);
    expect(ci.json().status).toBe('in_house');
    expect(await totals(b.folioId)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('field cross-checks 422 NOT_ALLOWED; SAL → 403; wrong day / state → 409 INVALID_TRANSITION – nothing written', async () => {
    const b = await book('202');
    await at(arrivalAt);
    const amountVnd = 100_000;
    const notAllowed = async (body: Record<string, unknown>, field: string) => {
      const r = await qr('fd', b, { amountVnd, ...body });
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toContainEqual({ field, code: 'NOT_ALLOWED' });
    };
    await notAllowed({ purpose: 'balance', checkinTime: '11:00' }, 'checkinTime');
    await notAllowed({ checkinTime: '11:00' }, 'checkinTime');
    await notAllowed({ purpose: 'check_in', checkoutAt: arrivalAt }, 'checkoutAt');
    await notAllowed({ purpose: 'check_out', addPriorNight: true }, 'addPriorNight');
    await notAllowed({ purpose: 'deposit', extraNightRateVnd: 500_000 }, 'extraNightRateVnd');
    await notAllowed({ purpose: 'check_in', priorNightRateVnd: 500_000 }, 'priorNightRateVnd');
    const enumBad = await qr('fd', b, { amountVnd, purpose: 'check-in' });
    expect(enumBad.statusCode).toBe(422);

    const sal = await qr('sal', b, { amountVnd, purpose: 'check_in' });
    expect(sal.statusCode, sal.body).toBe(403);

    // the day before arrival at 10:00 (not the B9a window) → 409
    await at(`${addDays(input.arrivalDate, -1)}T10:00:00+07:00`);
    const early = await qr('fd', b, { amountVnd, purpose: 'check_in' });
    expect(early.statusCode, early.body).toBe(409);
    expect(early.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'confirmed' });
    await at(arrivalAt);
    const out = await qr('fd', b, { amountVnd, purpose: 'check_out' });
    expect(out.statusCode, out.body).toBe(409);
    expect(out.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'confirmed' });
    expect(await qrCount(b)).toBe(0);
  });

  it('check_out (S4-47): in_house on the departure day – cap = CheckoutSummary.amountDueAtCheckoutVnd at checkoutAt; check_in on in_house → 409', async () => {
    const b = await book('203');
    await at(arrivalAt);
    const ci = await checkIn(b, {
      payment: { type: 'charge', method: 'cash', amountVnd: expected.paymentCapVnd },
    });
    expect(ci.statusCode, ci.body).toBe(200);
    const again = await qr('fd', b, { amountVnd: 100_000, purpose: 'check_in' });
    expect(again.statusCode).toBe(409);

    const leaveAt = `${input.departureDate}T14:00:00+07:00`;
    await at(`${input.departureDate}T09:00:00+07:00`);
    const sum = await c.fd!.get(
      url(`/reservations/${b.id}/checkout-summary?checkoutAt=${encodeURIComponent(leaveAt)}`),
    );
    expect(sum.statusCode, sum.body).toBe(200);
    const due = sum.json().amountDueAtCheckoutVnd as number;
    expect(due).toBeGreaterThan(0); // late check-out at 14:00 adds a surcharge not on the folio yet
    expect((await totals(b.folioId)).balanceDueVnd).toBe(0);
    const over = await qr('fd', b, {
      amountVnd: due + 1,
      purpose: 'check_out',
      checkoutAt: leaveAt,
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({ max: due });
    const ok = await qr('fd', b, { amountVnd: due, purpose: 'check_out', checkoutAt: leaveAt });
    expect(ok.statusCode, ok.body).toBe(201);
    expect(ok.json().payment).toMatchObject({ type: 'charge', amountVnd: due, status: 'pending' });
    expect((await totals(b.folioId)).balanceDueVnd).toBe(0);
  });
});
