/**
 * Front desk – the less common stay paths on the real PostgreSQL (BE-A Sprint 3): B9a prior night (direct
 * booking + OTA child booking BR-417-01), OTA extension child (BR-422), B16 early departure (BR-428 + refund
 * request G-14), B15 conflict → FD 202 → MGR approval applies the time (A16 = D), BE-12 relocation refund,
 * G-9 deadline from actualCheckinAt (port receives the instant). FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import { PAYMENT_EXPIRY_JOB_KEY } from '../../src/jobs/payment-jobs';
import { setEta, stayView } from '../../src/modules/reservations/public/stay-view';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../src/modules/reservations/public/sales-port';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
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
  checkedIn: Array<{ id: string; at: Date }> = [];
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
  async onCheckedIn(_tx: Tx, id: string, at: Date): Promise<Date | null> {
    this.checkedIn.push({ id, at });
    return null;
  }
  async onCheckInUndone() {}
  async onDepartureChanged() {}
  async onRoomChanged() {}
  async onPartyChanged() {}
  async onPartyMemberRemoved() {}
  async onCheckedOut() {}
  async onReservationVoided() {}
  visa: string | null = null;
  async earliestVisaValidUntil(): Promise<string | null> {
    return this.visa;
  }
}

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fd: ['front_desk'],
  mt: ['maintenance'],
};

describe.skipIf(!HAS_DB)(
  'front desk – B9a / B13 OTA / B16 / B15 approval / BE-12 (BE-A Sprint 3)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    const reg = new DocsOk();
    const c: Record<string, Client> = {};

    /** Trusted device valid for 30 days (the tenant helper's device lives 1 day from T0). */
    const longDevice = async () => {
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
            new Date('2026-12-31T00:00:00Z'),
          ],
        ),
      );
      return token;
    };

    beforeAll(async () => {
      db = appDatabase(8);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Park Ji-woo' });
      fa = await startFeatureApp(db, {
        override: (b) =>
          b
            .overrideProvider(FrontdeskPorts)
            .useValue(
              new FrontdeskPorts(
                reg,
                new NoGuestAccessPort(),
                new UnwiredChildDataPort(),
                new NoMinibarPort(),
              ),
            ),
      });
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      c.fd!.deviceToken = await longDevice();
      c.mgr!.deviceToken = await longDevice();
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
    const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
      (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
    const act = (id: string, verb: string, version: number, body: unknown, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${version}"`,
      });
    const create = async (body: Record<string, unknown>, who = 'fd') => {
      const res = await c[who]!.send('POST', url('/reservations'), body);
      expect(res.statusCode, res.body).toBe(201);
      return res.json() as { id: string; code: string; version: number; folioId: string };
    };
    const direct = (over: Record<string, unknown>) => ({
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      ...over,
    });
    const ota = (over: Record<string, unknown>) => ({
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: 1_800_000,
      ...over,
    });
    const pay = async (folioId: string, amountVnd: number) => {
      const r = await c.fd!.send('POST', url(`/folios/${folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd,
      });
      expect([200, 201], r.body).toContain(r.statusCode);
    };

    it('B9a direct (BR-417 (2)): 04:40 on the arrival day → prior night added to the booking, deadline from actualCheckinAt (G-9)', async () => {
      await at('2026-10-20T04:40:00+07:00');
      const b = await create(
        direct({
          roomId: ids.rooms['201'],
          arrivalDate: '2026-10-20',
          departureDate: '2026-10-21',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 708_000 },
        }),
      );
      const p = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
      expect(p.checkinTime).toBe('04:40');
      expect(p.earlyCheckinSurcharge).toMatchObject({ addsPreviousNight: true, amountVnd: 0 });
      expect(p.priorNight).toMatchObject({
        date: '2026-10-19',
        available: true,
        defaultRateVnd: 708_000,
        createsChildReservation: false,
      });
      // FB-R2-ARC-BE-S3-07: in the B9a window a typed 14:00 is ignored – no plain B9 before the rollover.
      const missing = await act(b.id, 'check-in', b.version, {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '14:00',
      });
      expect(missing.statusCode, missing.body).toBe(409);
      expect(missing.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        availableFrom: '2026-10-20T06:00:00.000+07:00',
      });
      const noExpected = await act(b.id, 'check-in', b.version, {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
        priorNightRateVnd: 708_000,
      });
      expect(noExpected.json().errors).toContainEqual({
        field: 'expectedSurchargeVnd',
        code: 'REQUIRED',
      });
      const res = await act(b.id, 'check-in', b.version, {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
        priorNightRateVnd: 708_000,
        expectedSurchargeVnd: 708_000,
      });
      expect(res.statusCode, res.body).toBe(200);
      // ARC-BE-S3-24.3: the typed night is kept as a manual price (never re-tiered later).
      const snap = await q<{ s: { nights: Array<{ date: string; source: string }> } }>(
        'SELECT pricing_snapshot AS s FROM reservation WHERE id = $1',
        [b.id],
      );
      expect(snap[0]?.s.nights.find((x) => x.date === '2026-10-19')?.source).toBe('manual');
      expect(res.json()).toMatchObject({
        status: 'in_house',
        arrivalDate: '2026-10-19',
        nights: 2,
        totalRoomVnd: 1_416_000,
      });
      const st = await q<{ event_code: string }>(
        `SELECT event_code FROM state_transition WHERE entity_id = $1 AND machine = 'SM-01' ORDER BY occurred_at, id`,
        [b.id],
      );
      expect(st.map((x) => x.event_code)).toEqual(['B2', 'B9a']);
      const n = await q<{ rate_source: string }>(
        `SELECT rate_source FROM stay_night WHERE reservation_id = $1 AND stay_date = '2026-10-19'`,
        [b.id],
      );
      expect(n[0]?.rate_source).toBe('extra_night_early_late');
      expect(reg.checkedIn.find((x) => x.id === b.id)?.at.toISOString()).toBe(
        '2026-10-19T21:40:00.000Z',
      );
    });

    it('B9a OTA (BR-417-01): Agoda 302 at 04:40 → direct child booking in_house for the night before at 917.000', async () => {
      await at('2026-10-22T04:40:00+07:00');
      const b = await create(
        ota({ roomId: ids.rooms['302'], arrivalDate: '2026-10-22', departureDate: '2026-10-24' }),
      );
      const p = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
      expect(p.priorNight).toMatchObject({
        date: '2026-10-21',
        available: true,
        defaultRateVnd: 917_000,
        createsChildReservation: true,
      });
      const res = await act(b.id, 'check-in', b.version, {
        cardsIssued: 0,
        houseRulesSent: true,
        addPriorNight: true,
        priorNightRateVnd: 917_000,
        expectedSurchargeVnd: 917_000,
      });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json()).toMatchObject({ arrivalDate: '2026-10-22', status: 'in_house' });
      const kids = await q<{
        status: string;
        channel: string;
        arrival: string;
        total: number;
        folio_id: string;
      }>(
        `SELECT r.status, c.code AS channel, r.arrival_date::text AS arrival, r.total_room_vnd AS total, r.folio_id
         FROM reservation r JOIN channel c ON c.id = r.channel_id WHERE r.parent_reservation_id = $1`,
        [b.id],
      );
      expect(kids).toEqual([
        {
          status: 'in_house',
          channel: 'direct',
          arrival: '2026-10-21',
          total: 917_000,
          folio_id: b.folioId,
        },
      ]);
      const parent = await q<{ total: number }>(
        'SELECT total_room_vnd AS total FROM reservation WHERE id = $1',
        [b.id],
      );
      expect(parent[0]?.total).toBe(1_800_000); // OTA booking not modified
    });

    it('BR-417-02: the room had a guest the night before → priorNight unavailable, check-in 409 ROOM_UNAVAILABLE', async () => {
      await at('2026-10-25T10:00:00+07:00');
      await create(
        direct({
          roomId: ids.rooms['101'],
          arrivalDate: '2026-10-26',
          departureDate: '2026-10-28',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_400_000 },
        }),
      );
      const b = await create(
        direct({
          roomId: ids.rooms['101'],
          arrivalDate: '2026-10-28',
          departureDate: '2026-10-30',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_400_000 },
        }),
      );
      await at('2026-10-28T04:30:00+07:00');
      const p = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
      expect(p.priorNight.available).toBe(false);
      const res = await act(b.id, 'check-in', b.version, {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
        priorNightRateVnd: 667_000,
        expectedSurchargeVnd: 667_000,
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe('ROOM_UNAVAILABLE');
    });

    it('B13 OTA (BR-422): extension becomes a direct child booking, OTA booking untouched', async () => {
      await at('2026-11-02T15:00:00+07:00');
      const b = await create(
        ota({ roomId: ids.rooms['401'], arrivalDate: '2026-11-02', departureDate: '2026-11-04' }),
      );
      const ci = await act(b.id, 'check-in', b.version, { cardsIssued: 1, houseRulesSent: true });
      expect(ci.statusCode, ci.body).toBe(200);
      const opt = (await c.fd!.get(url(`/reservations/${b.id}/extension-options`))).json();
      expect(opt).toMatchObject({ createsChildReservation: true });
      expect(opt.nights[0]).toMatchObject({ date: '2026-11-04', defaultRateVnd: 1_042_000 });
      expect(opt.channelFeeSavingsVnd).toBe(188_000); // 18 % Agoda × 1.042.000
      const res = await act(b.id, 'extend', ci.json().version, { nights: 1 });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().reservation.departureDate).toBe('2026-11-04');
      expect(res.json().childReservation).toMatchObject({
        arrivalDate: '2026-11-04',
        departureDate: '2026-11-05',
        status: 'in_house',
        channelCode: 'direct',
      });
    });

    it('B16 (BR-428): 4 nights, notice 21/10 for 22/10 → nights 22–23 void, 50 % refund request, room released', async () => {
      await at('2026-10-27T15:00:00+07:00');
      const b = await create(
        direct({
          roomId: ids.rooms['203'],
          arrivalDate: '2026-10-27',
          departureDate: '2026-10-31',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 3_000_000 },
        }),
      );
      // 27 Tue 792.000, 28 Wed 792.000, 29 Thu 792.000, 30 Fri 911.000 = 3.287.000 → pay the rest
      await pay(b.folioId, 287_000);
      const ci = await act(b.id, 'check-in', b.version, { cardsIssued: 1, houseRulesSent: true });
      expect(ci.statusCode, ci.body).toBe(200);
      await at('2026-10-28T10:00:00+07:00');
      const res = await act(b.id, 'early-departure', ci.json().version, {
        newDepartureDate: '2026-10-29',
        noticeGivenAt: '2026-10-28T10:00:00+07:00',
      });
      expect(res.statusCode, res.body).toBe(200);
      // 0.3.6 bổ sung 2 (E04-06): EarlyDepartureResult.
      expect(res.json()).toMatchObject({
        reservation: { departureDate: '2026-10-29', totalRoomVnd: 1_584_000 },
        earlyDepartureFeeVnd: 851_000,
        refundVnd: 852_000,
      });
      expect(res.json().refundRequestId).toEqual(expect.any(String));
      const voided = await q<{ d: string }>(
        `SELECT stay_date::text AS d FROM stay_night WHERE reservation_id = $1 AND void_reason = 'early_departure' ORDER BY 1`,
        [b.id],
      );
      expect(voided.map((x) => x.d)).toEqual(['2026-10-29', '2026-10-30']);
      // dropped 792.000 + 911.000 = 1.703.000 → 50 % = 851.500 → 852.000 (rounding.fee)
      const refund = await q<{ type: string; amount_vnd: number }>(
        `SELECT type, amount_vnd FROM approval_request WHERE target_id = $1`,
        [b.id],
      );
      expect(refund).toEqual([{ type: 'refund', amount_vnd: 852_000 }]);
      const free = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM room_occupancy o WHERE room_id = $1 AND active
          AND stay_range && daterange('2026-10-29', '2026-10-31')`,
        [ids.rooms['203']],
      );
      expect(free[0]!.n).toBe(0);
    });

    it('B15 conflict (A16 = D): FD 409 → FD requestApproval 202 → MGR approves → agreed time applied', async () => {
      await at('2026-11-10T15:00:00+07:00');
      const b = await create(
        direct({
          roomId: ids.rooms['102'],
          arrivalDate: '2026-11-10',
          departureDate: '2026-11-11',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 750_000 },
        }),
      );
      await create(
        direct({
          roomId: ids.rooms['102'],
          arrivalDate: '2026-11-11',
          departureDate: '2026-11-12',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 750_000 },
        }),
      );
      // No other L12 room free on 11/11 (OOO blocks) → no alternative (BR-416).
      for (const no of ['101', '103', '201', '202', '203']) {
        const blk = await c.mt!.send('POST', url('/room-blocks'), {
          roomId: ids.rooms[no],
          startDate: '2026-11-11',
          endDatePlanned: '2026-11-12',
          reason: 'Bảo trì thử',
        });
        expect(blk.statusCode, blk.body).toBe(201);
      }
      const ci = await act(b.id, 'check-in', b.version, { cardsIssued: 1, houseRulesSent: true });
      expect(ci.statusCode, ci.body).toBe(200);
      const dry = await fa.app.inject({
        method: 'POST',
        url: url(`/reservations/${b.id}/actions/late-checkout`),
        headers: c.fd!.headers({}, true),
        payload: { checkoutTime: '15:00', dryRun: true },
      });
      // arrival the same day → no grace, 30 % of 750.000 = 225.000
      expect(dry.json()).toMatchObject({
        surchargeVnd: 225_000,
        arrivalSameDay: { alternativeRoomAvailable: false },
      });
      const v = ci.json().version;
      const blocked = await act(b.id, 'late-checkout', v, { checkoutTime: '15:00' });
      expect(blocked.statusCode).toBe(409);
      expect(blocked.json().code).toBe('LATE_CHECKOUT_CONFLICT');
      const ask = await act(b.id, 'late-checkout', v, {
        checkoutTime: '15:00',
        requestApproval: true,
      });
      expect(ask.statusCode, ask.body).toBe(202);
      expect(ask.json()).toMatchObject({ type: 'late_checkout_conflict', status: 'pending' });
      const inbox = (await c.mgr!.get('/v1/me/notifications?unreadOnly=true')).json();
      expect(
        inbox.data.some(
          (n: { kind: string; refId: string }) =>
            n.kind === 'approval_requested' && n.refId === ask.json().id,
        ),
      ).toBe(true);
      const ap = await c.mgr!.send(
        'POST',
        url(`/approval-requests/${ask.json().id}/actions/approve`),
        {
          authMethod: 'password',
          secret: TEST_PASSWORD,
        },
      );
      expect(ap.statusCode, ap.body).toBe(200);
      const after = (await c.fd!.get(url(`/reservations/${b.id}`))).json();
      expect(after.agreedCheckoutTime).toBe('15:00');
    });

    it('BE-12: relocation outside creates a refund request of everything paid (100 %)', async () => {
      await at('2026-10-16T10:00:00+07:00');
      const base = {
        channelId: ids.channels.agoda,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_pay_at_property',
        otaRoomAmountVnd: 1_000_000,
        roomId: ids.rooms['402'],
        arrivalDate: '2027-01-05',
        departureDate: '2027-01-06',
      };
      await create({ ...base, otaRef: `AG${randomUUID().slice(0, 8)}` });
      const kept = await create({
        ...base,
        otaRef: `AG${randomUUID().slice(0, 8)}`,
        allowUnassigned: true,
      });
      await pay(kept.folioId, 300_000);
      const inc = (await c.mgr!.get(url('/overbooking-incidents?status=open')))
        .json()
        .data.find((i: { reservationId: string }) => i.reservationId === kept.id);
      const res = await c.mgr!.send(
        'POST',
        url(`/overbooking-incidents/${inc.id}/actions/resolve-external`),
        {
          costVnd: 200_000,
          note: 'Dời sang cơ sở gần',
        },
      );
      expect(res.statusCode, res.body).toBe(200);
      const refund = await q<{ type: string; amount_vnd: number; reason_code: string }>(
        `SELECT type, amount_vnd, reason_code FROM approval_request WHERE target_id = $1`,
        [kept.id],
      );
      expect(refund).toEqual([
        { type: 'refund', amount_vnd: 300_000, reason_code: 'overbooking_relocated' },
      ]);
    });
    it('J24 payment.expire: a pending VietQR past expires_at → expired exactly once (SM-12, money audit)', async () => {
      await at('2026-10-16T10:00:00+07:00');
      const b = await create(
        direct({
          roomId: ids.rooms['301'],
          arrivalDate: '2026-12-08',
          departureDate: '2026-12-09',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 300_000 },
        }),
      );
      const id = randomUUID();
      await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `INSERT INTO payment (id, organization_id, property_id, code, folio_id, reservation_id, type, method,
           reconciliation, amount_vnd, status, expires_at, recorded_by, recorded_by_role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'charge', 'vietqr', 'pending', 200000, 'pending', $7, $8, 'front_desk', $9, $9)`,
          [
            id,
            t.organizationId,
            t.propertyIds[0],
            `PT-J24-${randomUUID().slice(0, 6)}`,
            b.folioId,
            b.id,
            new Date('2026-10-17T06:00:00+07:00'),
            t.users.fd!.id,
            new Date('2026-10-16T10:00:00+07:00'),
          ],
        ),
      );
      // S3-B3: stayInfo – booking facts without personal data, RLS only (HK minibar / payment lists).
      const port = fa.app.get<ReservationSalesPort>(RESERVATION_SALES_PORT);
      const info = await db.withContext(t.ctx(), (tx) => port.stayInfo(tx, b.id));
      expect(info).toMatchObject({
        id: b.id,
        code: b.code,
        status: 'confirmed',
        arrivalDate: '2026-12-08',
        departureDate: '2026-12-09',
        roomNo: '301',
        folioId: b.folioId,
        channelGroup: 'direct',
      });
      expect(JSON.stringify(info)).not.toMatch(/Park|Ji-woo/);
      expect(await db.withContext(t.ctx(), (tx) => port.stayInfo(tx, randomUUID()))).toBeNull();
      const runner = fa.app.get(JobRunner);
      const property = {
        propertyId: t.propertyIds[0]!,
        organizationId: t.organizationId,
        timezone: 'Asia/Ho_Chi_Minh',
      };
      await at('2026-10-17T05:59:00+07:00');
      expect((await runner.runOnce(PAYMENT_EXPIRY_JOB_KEY, property)).stats).toMatchObject({
        expired: 0,
      });
      await at('2026-10-17T06:00:00+07:00');
      const runs = await Promise.all(
        [1, 2, 3].map(() => runner.runOnce(PAYMENT_EXPIRY_JOB_KEY, property)),
      );
      expect(
        runs.reduce((a, r) => a + Number((r.stats as { expired?: number }).expired ?? 0), 0),
      ).toBe(1);
      const row = await q<{ status: string }>('SELECT status FROM payment WHERE id = $1', [id]);
      expect(row[0]?.status).toBe('expired');
      const st = await q<{ to_state: string }>(
        `SELECT to_state FROM state_transition WHERE entity_id = $1 AND machine = 'SM-12'`,
        [id],
      );
      expect(st).toEqual([{ to_state: 'expired' }]);
      const audit = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM audit_event WHERE entity_id = $1 AND action = 'payment.expired'`,
        [id],
      );
      expect(audit[0]!.n).toBe(1);
    });

    it('stayView (actor scope, H2) + setEta (online check-in → Reservation.etaTime) for BE-C', async () => {
      await at('2026-10-16T11:00:00+07:00');
      const b = await create(
        direct({
          roomId: ids.rooms['402'],
          arrivalDate: '2026-12-15',
          departureDate: '2026-12-16',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 300_000 },
        }),
      );
      const fd = { userId: t.users.fd!.id, roles: ['front_desk'] };
      const stranger = { userId: randomUUID(), roles: ['sales_staff'] };
      const v = await db.withContext(t.ctx(), (tx) => stayView(tx, b.id, fd));
      expect(v).toMatchObject({
        code: b.code,
        status: 'confirmed',
        personsTotal: 2,
        roomNo: '402',
        bookerName: 'Park Ji-woo',
        etaTime: null,
      });
      expect(await db.withContext(t.ctx(), (tx) => stayView(tx, b.id, stranger))).toBeNull();
      const now = new Date('2026-10-16T04:00:00Z');
      expect(await db.withContext(t.ctx(), (tx) => setEta(tx, b.id, '22:00', true, now))).toBe(
        true,
      );
      const after = (await c.fd!.get(url(`/reservations/${b.id}`))).json();
      expect(after.etaTime).toBe('22:00');
      const hist = await q<{ new_value: string; reason: string }>(
        `SELECT new_value, reason FROM reservation_change WHERE reservation_id = $1 AND field = 'eta_time'`,
        [b.id],
      );
      expect(hist).toEqual([{ new_value: '22:00', reason: 'online_checkin late_arrival' }]);
      const bad = db.withContext(t.ctx(), (tx) => setEta(tx, b.id, '25:00', false, now));
      await expect(bad).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    });
  },
);
