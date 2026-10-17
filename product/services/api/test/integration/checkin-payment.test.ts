/**
 * BE-A Sprint 4 – M4 / S4-10 (BUG-R2-038, OpenAPI 0.3.7 `checkIn.payment`, `CheckInPreview.amountDueAtCheckinVnd`)
 * on the real PostgreSQL through HTTP, numbers from the QA oracle BR-402-01 (BR-402 v0.3.6): "đã thu đủ" is judged
 * after the early surcharge and the payment of the check-in; the pending FOC asked on the surcharge is not due
 * (min(asked, line)); the payment is capped at what the folio owes after the surcharge. Fake clock, FAKE data.
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

const ROLES = { mgr: ['manager'], fdl: ['front_desk_lead'], fd: ['front_desk'] };

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; input: Record<string, any>; expected: Record<string, any> }>;
};
const o = ORACLES.examples.find((x) => x.id === 'BR-402-01');

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('check-in payment – BR-402 v0.3.6 (BE-A Sprint 4, M4 / S4-10)', () => {
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

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Nhận Sớm' });
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
    await setPassword(db, t, 'fdl');
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
  const checkIn = async (b: Booking, extra: Record<string, unknown>) => {
    await at(`${input.arrivalDate}T${input.checkinTime}:00+07:00`);
    return c.fd!.send(
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
  };
  const foc = (amountVnd: number) => ({
    requestFocForSurcharge: { kind: 'foc', amountVnd, reasonCode: input.focRequest.reasonCode },
  });
  const pay = (amountVnd: number) => ({
    payment: { type: 'charge', method: 'cash', amountVnd },
  });
  const pendingOf = async (b: Booking) =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ id: string }>(
          `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'foc' AND status = 'pending'`,
          [b.id],
        ),
      )
    ).rows[0]!.id;
  const decide = (who: string, id: string, verb: 'approve' | 'reject') =>
    c[who]!.send('POST', url(`/approval-requests/${id}/actions/${verb}`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      ...(verb === 'reject' ? { reason: 'Không đủ điều kiện FOC' } : {}),
    });

  it('preview at 11:00: balance 1.500.000, due at check-in 1.710.000 (surcharge 210.000)', async () => {
    const b = await book('201');
    await at(`${input.arrivalDate}T${input.checkinTime}:00+07:00`);
    const pv = await c.fd!.get(
      url(`/reservations/${b.id}/check-in-preview?checkinTime=${input.checkinTime}`),
    );
    expect(pv.statusCode, pv.body).toBe(200);
    expect(pv.json()).toMatchObject({
      balanceDueVnd: expected.balanceDueBeforeCheckinVnd,
      amountDueAtCheckinVnd: expected.amountDueAtCheckinVnd,
      earlyCheckinSurcharge: { amountVnd: input.earlySurchargeVnd },
    });
    expect(
      pv.json().conditions.find((x: { code: string }) => x.code === 'balance_paid'),
    ).toMatchObject({ met: false });
  });

  it('FOC 210.000 asked with the surcharge: 1.500.000 checks in (not 1.710.000); rejected → 210.000 due', async () => {
    const b = await book('202');
    const short = await checkIn(b, { ...foc(input.focRequest.requestedVnd), ...pay(1_400_000) });
    expect(short.statusCode).toBe(409);
    expect(short.json()).toMatchObject({ unmet: ['balance_paid'] });
    // Nothing written by the refused check-in: no surcharge line, no payment.
    expect(await totals(b.folioId)).toMatchObject({
      balanceDueVnd: expected.balanceDueBeforeCheckinVnd,
    });
    const ok = await checkIn(b, {
      ...foc(input.focRequest.requestedVnd),
      ...pay(expected.requiredForBalancePaidVnd),
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().status).toBe('in_house');
    const r = await decide('fdl', await pendingOf(b), 'reject');
    expect(r.statusCode, r.body).toBe(200);
    expect((await totals(b.folioId)).balanceDueVnd).toBe(expected.afterRejectBalanceDueVnd);
  });

  it('approved → 0 due; partial FOC 100.000 → 1.610.000 required', async () => {
    const b = await book('203');
    const ok = await checkIn(b, {
      ...foc(input.focRequest.requestedVnd),
      ...pay(expected.requiredForBalancePaidVnd),
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await decide('fdl', await pendingOf(b), 'approve')).statusCode).toBe(200);
    expect((await totals(b.folioId)).balanceDueVnd).toBe(expected.afterApproveBalanceDueVnd);

    const p = await book('101');
    const less = await checkIn(p, {
      ...foc(input.partialFocRequestedVnd),
      ...pay(expected.requiredForBalancePaidVnd),
    });
    expect(less.statusCode).toBe(409);
    const enough = await checkIn(p, {
      ...foc(input.partialFocRequestedVnd),
      ...pay(expected.partialRequestRequiredVnd),
    });
    expect(enough.statusCode, enough.body).toBe(200);
  });

  it('the guest pays everything (cap 1.710.000) then the FOC is approved → 210.000 overpaid; above the cap → 422', async () => {
    const b = await book('102');
    const over = await checkIn(b, {
      ...foc(input.focRequest.requestedVnd),
      ...pay(expected.paymentCapVnd + 1000),
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({
      errors: [{ field: 'payment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: expected.paymentCapVnd,
    });
    const all = await checkIn(b, {
      ...foc(input.focRequest.requestedVnd),
      ...pay(expected.paymentCapVnd),
    });
    expect(all.statusCode, all.body).toBe(200);
    expect((await decide('fdl', await pendingOf(b), 'approve')).statusCode).toBe(200);
    expect((await totals(b.folioId)).creditVnd).toBe(expected.guestPaidAllThenApprovedOverpaidVnd);
  });

  it('0.3.7 bổ sung 1: FD + room not ready → 202 approval request; with `payment` → 422 NOT_ALLOWED and nothing written', async () => {
    const b = await book('103');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VD', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = 'VD'`,
        [ids.rooms['103'], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      ),
    );
    const asks = async () =>
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM approval_request WHERE target_id = $1 AND type = 'checkin_room_not_ready'`,
            [b.id],
          ),
        )
      ).rows[0]!.n;
    const before = await totals(b.folioId);
    const withPay = await checkIn(b, {
      roomNotReadyOverride: { reason: 'Khách chờ, buồng đang dọn' },
      ...pay(expected.requiredForBalancePaidVnd),
    });
    expect(withPay.statusCode).toBe(422);
    expect(withPay.json().errors).toContainEqual({ field: 'payment', code: 'NOT_ALLOWED' });
    expect(await asks()).toBe(0);
    expect(await totals(b.folioId)).toEqual(before);
    const ask = await checkIn(b, { roomNotReadyOverride: { reason: 'Khách chờ, buồng đang dọn' } });
    expect(ask.statusCode, ask.body).toBe(202);
    expect(await asks()).toBe(1);
  });
});
