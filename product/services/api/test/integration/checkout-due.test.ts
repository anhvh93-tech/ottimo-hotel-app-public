/**
 * BE-A Sprint 4 – S4-47 (OpenAPI 0.3.7 `CheckoutSummary.serverTime` / `amountDueAtCheckoutVnd`, cap of
 * `checkOut.finalPayment`) on the real PostgreSQL through HTTP. Fake clock, FAKE data.
 */
import { randomBytes } from 'node:crypto';
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

const ROLES = { mgr: ['manager'], fd: ['front_desk'] };

type Booking = { id: string; code: string; version: number; folioId: string };

/**
 * BE-A Sprint 4 – S4-47 (OpenAPI 0.3.7): `CheckoutSummary.serverTime` and `amountDueAtCheckoutVnd` (late charge
 * re-computed with its FOC, extra night after the last tier – direct re-tiered, OTA child night), the cap of
 * `checkOut.finalPayment`. Each case pays exactly the summary's amount: the folio must end at 0 due / 0 credit.
 */
describe.skipIf(!HAS_DB)('check-out amount due – S4-47 (BE-A Sprint 4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Trả Muộn' });
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
    await setPassword(db, t, 'mgr');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
  const totals = async (folioId: string) =>
    (await c.fd!.get(url(`/folios/${folioId}`))).json().totals as {
      balanceDueVnd: number;
      creditVnd: number;
    };
  const pay = async (folioId: string, amountVnd: number) => {
    if (amountVnd <= 0) return;
    const r = await c.fd!.send('POST', url(`/folios/${folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd,
    });
    expect([200, 201], r.body).toContain(r.statusCode);
  };
  const create = async (body: Record<string, unknown>): Promise<Booking> => {
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
  const stay = async (b: Booking, from: string) => {
    await at(`${from}T15:00:00+07:00`);
    await pay(b.folioId, (await totals(b.folioId)).balanceDueVnd);
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
  };
  const summary = async (id: string, time: string) => {
    const r = await c.fd!.get(url(`/reservations/${id}/checkout-summary?checkoutTime=${time}`));
    expect(r.statusCode, r.body).toBe(200);
    return r.json();
  };

  it('late check-out 15:00: due = balance + surcharge; serverTime; finalPayment above it → 422, exactly it → settled at 0', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await create({
      roomId: ids.rooms['101'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2026-11-16',
      departureDate: '2026-11-18',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 400_000 },
    });
    await stay(b, '2026-11-16');
    await at('2026-11-18T15:00:00+07:00');
    const s = await summary(b.id, '15:00');
    expect(s.serverTime).toBe('2026-11-18T15:00:00.000+07:00');
    expect(s.lateCheckoutSurcharge.amountVnd).toBeGreaterThan(0);
    expect(s.amountDueAtCheckoutVnd).toBe(s.balanceDueVnd + s.lateCheckoutSurcharge.amountVnd);
    const body = {
      checkoutTime: '15:00',
      applyLateSurcharge: true,
      expectedSurchargeVnd: s.lateCheckoutSurcharge.amountVnd,
    };
    const over = await act(b.id, 'check-out', {
      ...body,
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd + 1000 },
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({
      errors: [{ field: 'finalPayment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: s.amountDueAtCheckoutVnd,
    });
    const out = await act(b.id, 'check-out', {
      ...body,
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b.folioId)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('a late charge with an approved FOC, guest leaves at 13:00: the FOC follows (min) – the due shown is what B18 leaves', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await create({
      roomId: ids.rooms['102'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2026-11-16',
      departureDate: '2026-11-18',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
    });
    await stay(b, '2026-11-16');
    await at('2026-11-17T10:00:00+07:00');
    const q17 = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=17:00`));
    const late17 = q17.json().lateCheckoutSurcharge.amountVnd as number;
    const set = await act(b.id, 'late-checkout', {
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: late17,
      requestFocForSurcharge: { amountVnd: late17, reasonCode: 'regular_vip' },
    });
    expect(set.statusCode, set.body).toBe(200);
    const [req] = (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ id: string }>(
          `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'foc' AND status = 'pending'`,
          [b.id],
        ),
      )
    ).rows;
    const ap = await c.mgr!.send('POST', url(`/approval-requests/${req!.id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    await at('2026-11-18T13:00:00+07:00');
    const s = await summary(b.id, '13:00');
    const out = await act(b.id, 'check-out', {
      checkoutTime: '13:00',
      ...(s.amountDueAtCheckoutVnd > 0
        ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd } }
        : {}),
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b.folioId)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('extra night after the last tier (19:00) on a 6-night direct stay: 7 nights re-tier BR-107 – due shown = due after B18', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await create({
      roomId: ids.rooms['103'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 3,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2026-11-23',
      departureDate: '2026-11-29',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_500_000 },
    });
    await stay(b, '2026-11-23');
    await at('2026-11-29T19:00:00+07:00');
    const s = await summary(b.id, '19:00');
    expect(s.extraNightRequired).toBe(true);
    expect(s.amountDueAtCheckoutVnd).toBeLessThan(
      s.balanceDueVnd + s.extraNightDefaultRateVnd + 150_000,
    );
    const out = await act(b.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: s.extraNightDefaultRateVnd },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b.folioId)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('extra night on an OTA stay: a direct child night (price + its BR-110 fee) – due shown = due after B18', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await create({
      roomId: ids.rooms['201'],
      channelId: ids.channels.agoda,
      adults: 3,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomBytes(4).toString('hex')}`,
      otaRoomAmountVnd: 1_600_000,
      arrivalDate: '2026-11-23',
      departureDate: '2026-11-25',
    });
    await stay(b, '2026-11-23');
    await at('2026-11-25T19:00:00+07:00');
    const s = await summary(b.id, '19:00');
    expect(s.extraNightRequired).toBe(true);
    const out = await act(b.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: s.extraNightDefaultRateVnd },
      ...(s.amountDueAtCheckoutVnd > 0
        ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd } }
        : {}),
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b.folioId)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });
});
