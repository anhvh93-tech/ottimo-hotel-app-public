/**
 * BE-A Sprint 3 – Response & fix (reviews s3-ARC / s3-SEC / s3-DOM, OpenAPI 0.3.6 bổ sung 1 + 2) on the real
 * PostgreSQL through HTTP:
 * - ARC-01 / DOM-16 (S3-13): extra-person fee per night from `effectiveFrom`, kept by the folio sync after an
 *   extension; the new night gets its fee.
 * - ARC-06 / DOM-17 / DOM-18 (S3-11, S3-12): one live late-checkout charge; no silent skip; an approved FOC
 *   follows the re-computed charge at check-out (net 0).
 * - DOM-20 (S3-10): an open `checkin_room_not_ready` request is cancelled as superseded by the check-in.
 * - DOM-28 (S3-14): a `hold` arriving the same day removes the BR-412 grace.
 * - E05-11 / DOM-19 (S3-9): "check out – charge one more night"; the post-midnight window.
 * - ARC-08: changeRoom only today. DOM-25: an extension voids the agreed late checkout.
 * - E04-06 / DOM-23: B16 OTA retained amount, back-dated notice evidence, EarlyDepartureResult.
 * - ARC-05: OTA stay extended by a child booking checks out on the child's departure (checkoutAt).
 * - ARC-09: the SSE listener reconnects after its connection is killed. SEC-39: idempotency keys expire.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { IDEMPOTENCY_PURGE_JOB } from '../../src/jobs/builtin-jobs';
import { SseHub } from '../../src/modules/events/internal/sse-hub';
import { publishSse } from '../../src/modules/events/public/events.service';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
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
}

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'], sal: ['sales_staff'] };

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('front desk – Sprint 3 review fixes (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const companions: string[] = [];
  const c: Record<string, Client> = {};

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
          new Date('2027-01-31T00:00:00Z'),
        ],
      ),
    );
    return token;
  };

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Hoàng Minh Khách' });
    companions.push(await seedGuestRow(db, t, { name: 'Đỗ Bạn Một' }));
    companions.push(await seedGuestRow(db, t, { name: 'Đỗ Bạn Hai' }));
    fa = await startFeatureApp(db, {
      override: (b) =>
        b
          .overrideProvider(FrontdeskPorts)
          .useValue(
            new FrontdeskPorts(
              new DocsOk(),
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
    await setPassword(db, t, 'own');
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
  const version = async (id: string) =>
    (await c.fd!.get(url(`/reservations/${id}`))).json().version as number;
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${await version(id)}"`,
    });
  const create = async (body: Record<string, unknown>) => {
    const res = await c.fd!.send('POST', url('/reservations'), body);
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const direct = (room: string, from: string, to: string, paid: number) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: paid },
    });
  const ota = (room: string, from: string, to: string, amount: number) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: amount,
      arrivalDate: from,
      departureDate: to,
    });
  const checkIn = async (b: Booking, time = '15:00') => {
    const r = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: time,
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  const live = (folioId: string, category: string) =>
    q<{ amount_vnd: number; service_date: string; charge_code: string | null }>(
      `SELECT l.amount_vnd, l.service_date::text AS service_date, l.charge_code FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = $2 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.service_date, l.posted_at`,
      [folioId, category],
    );

  it('ARC-01 / DOM-16: an adult added from 03/11 → 150.000 per night from that night; extension keeps it and adds one', async () => {
    await at('2026-11-02T15:00:00+07:00');
    const b = await direct('202', '2026-11-02', '2026-11-05', 2_376_000);
    await checkIn(b);
    await at('2026-11-03T10:00:00+07:00');
    const add = (guestId: string, more: Record<string, unknown> = {}) =>
      c.fd!.send('POST', url(`/reservations/${b.id}/party`), {
        role: 'companion',
        guestId,
        effectiveFrom: '2026-11-03',
        ...more,
      });
    expect((await add(companions[0]!)).statusCode).toBe(201); // fills the 2nd booked adult
    // The 3rd adult: surcharge > 0 needs a decision (DOM S3-12) – never skipped silently.
    const silent = await add(companions[1]!);
    expect(silent.statusCode, silent.body).toBe(422);
    expect(silent.json().errors).toContainEqual({
      field: 'applyExtraPersonSurcharge',
      code: 'SURCHARGE_DECISION_REQUIRED',
    });
    const third = await add(companions[1]!, {
      applyExtraPersonSurcharge: true,
      expectedSurchargeVnd: 300_000,
    });
    expect(third.statusCode, third.body).toBe(201);
    expect(
      (await live(b.folioId, 'extra_person')).map((l) => [l.service_date, l.amount_vnd]),
    ).toEqual([
      ['2026-11-03', 150_000],
      ['2026-11-04', 150_000],
    ]);
    // B13 + 1 night: the folio sync keeps both nights and adds the new one (FB-R2-ARC-BE-S3-01).
    await at('2026-11-04T10:00:00+07:00');
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect(
      (await live(b.folioId, 'extra_person')).map((l) => [l.service_date, l.amount_vnd]),
    ).toEqual([
      ['2026-11-03', 150_000],
      ['2026-11-04', 150_000],
      ['2026-11-05', 150_000],
    ]);
    // ARC-24.6: the 3rd adult leaves on 05/11 – tonight's fee goes, the nights already stayed keep theirs.
    await at('2026-11-05T09:00:00+07:00');
    const party = await c.fd!.get(url(`/reservations/${b.id}/party`));
    const member = (
      party.json().members as Array<{ id: string; guestId?: string; guest?: { id: string } }>
    ).find((x) => (x.guestId ?? x.guest?.id) === companions[1]);
    expect(member, party.body).toBeDefined();
    const rm = await c.fd!.send(
      'DELETE',
      url(`/reservations/${b.id}/party/${member!.id}`),
      undefined,
      {
        'if-match': `"${party.json().version}"`,
      },
    );
    expect(rm.statusCode, rm.body).toBe(204);
    expect(
      (await live(b.folioId, 'extra_person')).map((l) => [l.service_date, l.amount_vnd]),
    ).toEqual([
      ['2026-11-03', 150_000],
      ['2026-11-04', 150_000],
    ]);
    expect((await c.fd!.get(url(`/reservations/${b.id}`))).json().adults).toBe(2);
    await at('2026-11-04T10:00:00+07:00');
    // ARC-08 (0.3.6 bổ sung): a room change only takes effect today.
    const later = await act(b.id, 'change-room', {
      newRoomId: ids.rooms['203'],
      effectiveDate: '2026-11-05',
      cause: 'guest_request',
      reason: 'Đổi ngày mai',
    });
    expect(later.statusCode).toBe(422);
    expect(later.json().errors).toContainEqual({ field: 'effectiveDate', code: 'DATE_INVALID' });
  });

  it('ARC-06 / DOM-17 / DOM-18: one live late charge; an approved FOC follows the re-computed charge at check-out', async () => {
    await at('2026-11-09T15:00:00+07:00');
    const b = await direct('101', '2026-11-09', '2026-11-11', 1_334_000);
    await checkIn(b);
    await at('2026-11-10T10:00:00+07:00');
    const late = (body: Record<string, unknown>) => act(b.id, 'late-checkout', body);
    const silent = await late({ checkoutTime: '17:00' });
    expect(silent.statusCode).toBe(422);
    expect(silent.json().errors).toContainEqual({
      field: 'applySurcharge',
      code: 'SURCHARGE_DECISION_REQUIRED',
    });
    const at17 = await late({
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: 334_000,
    });
    expect(at17.statusCode, at17.body).toBe(200);
    const at15 = await late({
      checkoutTime: '15:00',
      applySurcharge: true,
      expectedSurchargeVnd: 200_000,
    });
    expect(at15.statusCode, at15.body).toBe(200);
    expect((await live(b.folioId, 'late_checkout')).map((l) => l.amount_vnd)).toEqual([200_000]);
    // Back to 17:00 with a FOC request; the manager approves it.
    const foc = await late({
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: 334_000,
      requestFocForSurcharge: { amountVnd: 334_000, reasonCode: 'regular_vip' },
    });
    expect(foc.statusCode, foc.body).toBe(200);
    expect((await live(b.folioId, 'late_checkout')).map((l) => l.amount_vnd)).toEqual([334_000]);
    const [req] = await q<{ id: string }>(
      `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'foc' AND status = 'pending'`,
      [b.id],
    );
    const ap = await c.own!.send('POST', url(`/approval-requests/${req!.id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    // Guest leaves at 13:00: 30 % = 200.000 < 334.000 → automatic; FOC carried = min(334.000, 200.000).
    await at('2026-11-11T13:00:00+07:00');
    const out = await act(b.id, 'check-out', { checkoutTime: '13:00' });
    expect(out.statusCode, out.body).toBe(200);
    expect((await live(b.folioId, 'late_checkout')).map((l) => l.amount_vnd)).toEqual([200_000]);
    expect((await live(b.folioId, 'foc')).map((l) => l.amount_vnd)).toEqual([-200_000]);
  });

  it('DOM-20: a pending "check in on an unready room" request is cancelled (superseded) by the check-in', async () => {
    await at('2026-11-09T14:30:00+07:00');
    const setStatus = (s: string) =>
      db.withContext(t.ctx(), (tx) =>
        tx.query(
          `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (room_id) DO UPDATE SET status = $4`,
          [
            ids.rooms['102'],
            t.organizationId,
            t.propertyIds[0],
            s,
            new Date('2026-11-09T07:00:00Z'),
          ],
        ),
      );
    await setStatus('VD');
    const b = await direct('102', '2026-11-09', '2026-11-10', 750_000);
    const ask = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '14:30',
      roomNotReadyOverride: { reason: 'Khách chờ ở sảnh' },
    });
    expect(ask.statusCode, ask.body).toBe(202);
    await setStatus('VC');
    await checkIn(b, '14:30');
    const [r] = await q<{ status: string; decision_note: string }>(
      'SELECT status, decision_note FROM approval_request WHERE id = $1',
      [ask.json().id],
    );
    expect(r).toMatchObject({ status: 'cancelled' });
    expect(r!.decision_note).toMatch(/^superseded/);
  });

  it('DOM-28: a hold arriving the same day removes the grace (12:20 → 30 %)', async () => {
    await at('2026-11-16T15:00:00+07:00');
    const a = await direct('103', '2026-11-16', '2026-11-18', 1_500_000);
    await checkIn(a);
    const svc = fa.app.get(ReservationsService);
    await db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, async (tx) => {
      const ctx = await svc.context(tx, { userId: t.users.fd!.id, roles: ['front_desk'] });
      return svc.createHold(tx, ctx, {
        roomId: ids.rooms['103']!,
        channelId: ids.channels.direct!,
        arrivalDate: '2026-11-18',
        departureDate: '2026-11-19',
        adults: 2,
        children6to11: 0,
        childrenUnder6: 0,
        bookerGuestId: guest,
        holdHours: 24,
      });
    });
    await at('2026-11-18T12:20:00+07:00');
    const s = (
      await c.fd!.get(url(`/reservations/${a.id}/checkout-summary?checkoutTime=12:20`))
    ).json();
    expect(s.lateCheckoutSurcharge).toMatchObject({ tierPct: 30, amountVnd: 225_000 });
  });

  it('E05-11: departure after the last tier = "check out – charge one more night" in one transaction', async () => {
    await at('2026-11-16T15:00:00+07:00');
    const b = await direct('201', '2026-11-16', '2026-11-18', 1_416_000);
    await checkIn(b);
    await at('2026-11-18T19:00:00+07:00');
    const s = (
      await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=19:00`))
    ).json();
    expect(s).toMatchObject({
      extraNightRequired: true,
      extraNightDefaultRateVnd: 708_000,
      extraNightAvailable: true,
      postMidnightWindow: false,
      lateCheckoutSurcharge: { amountVnd: 0 },
    });
    const missing = await act(b.id, 'check-out', { checkoutTime: '19:00' });
    expect(missing.statusCode).toBe(422);
    expect(missing.json().errors).toContainEqual({
      field: 'extraNight',
      code: 'LATE_CHECKOUT_AFTER_LIMIT',
    });
    const out = await act(b.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: 708_000 },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: 708_000 },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(out.json().reservation).toMatchObject({
      status: 'checked_out',
      departureDate: '2026-11-19',
    });
    const rooms = await live(b.folioId, 'room');
    expect(rooms.find((l) => l.service_date === '2026-11-18')).toMatchObject({
      amount_vnd: 708_000,
      charge_code: 'extra_night',
    });
    expect(await live(b.folioId, 'late_checkout')).toEqual([]);
    const audit = await q<{ action: string }>(
      `SELECT action FROM audit_event WHERE entity_id = $1 AND action = 'reservation.extra_night_on_checkout'`,
      [b.id],
    );
    expect(audit).toHaveLength(1);
  });

  it('DOM-19 (b) / DOM-25: extension voids the agreed late checkout; leaving at 01:00 in the post-midnight window is a plain B18', async () => {
    await at('2026-11-23T15:00:00+07:00');
    const b = await direct('301', '2026-11-23', '2026-11-24', 958_000);
    await checkIn(b);
    await at('2026-11-23T16:00:00+07:00');
    const late = await act(b.id, 'late-checkout', {
      checkoutTime: '15:00',
      applySurcharge: true,
      expectedSurchargeVnd: 287_000,
    });
    expect(late.statusCode, late.body).toBe(200);
    expect((await live(b.folioId, 'late_checkout')).map((l) => l.amount_vnd)).toEqual([287_000]);
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect(ext.json().reservation.agreedCheckoutTime ?? null).toBeNull();
    expect(await live(b.folioId, 'late_checkout')).toEqual([]);
    // 25/11 01:00 (business date 24/11 = departure − 1, calendar date = departure): no surcharge.
    await at('2026-11-25T01:00:00+07:00');
    const s = (
      await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=01:00`))
    ).json();
    expect(s).toMatchObject({ postMidnightWindow: true, extraNightRequired: false });
    const out = await act(b.id, 'check-out', {
      checkoutTime: '01:00',
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.balanceDueVnd },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await live(b.folioId, 'late_checkout')).toEqual([]);
  });

  it('E04-06 / DOM-23: B16 – OTA retained amount (required), back-dated notice needs evidence, EarlyDepartureResult', async () => {
    await at('2026-11-30T15:00:00+07:00');
    const o = await ota('302', '2026-11-30', '2026-12-02', 1_800_000);
    await checkIn(o);
    await at('2026-11-30T20:00:00+07:00');
    const noAmount = await act(o.id, 'early-departure', {
      newDepartureDate: '2026-12-01',
      noticeGivenAt: '2026-11-30T20:00:00+07:00',
    });
    expect(noAmount.json().errors).toContainEqual({ field: 'otaRetainedVnd', code: 'REQUIRED' });
    const ok = await act(o.id, 'early-departure', {
      newDepartureDate: '2026-12-01',
      noticeGivenAt: '2026-11-30T20:00:00+07:00',
      otaRetainedVnd: 900_000,
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({
      reservation: { departureDate: '2026-12-01' },
      earlyDepartureFeeVnd: 900_000,
      refundVnd: 0,
      refundRequestId: null,
    });
    const d = await direct('203', '2026-11-30', '2026-12-03', 2_376_000);
    await checkIn(d, '20:00');
    const notOta = await act(d.id, 'early-departure', {
      newDepartureDate: '2026-12-02',
      noticeGivenAt: '2026-11-30T20:00:00+07:00',
      otaRetainedVnd: 1,
    });
    expect(notOta.json().errors).toContainEqual({ field: 'otaRetainedVnd', code: 'NOT_ALLOWED' });
    const backdated = await act(d.id, 'early-departure', {
      newDepartureDate: '2026-12-02',
      noticeGivenAt: '2026-11-29T20:00:00+07:00',
    });
    expect(backdated.json().errors).toContainEqual({
      field: 'noticeEvidence',
      code: 'EVIDENCE_REQUIRED',
    });
    const withProof = await act(d.id, 'early-departure', {
      newDepartureDate: '2026-12-02',
      noticeGivenAt: '2026-11-29T20:00:00+07:00',
      noticeEvidence: { note: 'Tin nhắn Zalo khách gửi tối 29/11' },
    });
    expect(withProof.statusCode, withProof.body).toBe(200);
    // dropped 02/12 (Wed 792.000, net) – notice 3 days → 50 % = 396.000 refund, 396.000 fee.
    expect(withProof.json()).toMatchObject({ earlyDepartureFeeVnd: 396_000, refundVnd: 396_000 });
  });

  it('ARC-05: OTA stay extended by a child booking checks out on the child departure (checkoutAt) – one late quote', async () => {
    await at('2026-12-07T15:00:00+07:00');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms['302']]),
    );
    const o = await ota('302', '2026-12-07', '2026-12-09', 1_800_000);
    await checkIn(o);
    await at('2026-12-08T10:00:00+07:00');
    const ext = await act(o.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect(ext.json().childReservation).toMatchObject({ departureDate: '2026-12-10' });
    // B15 runs on the primary booking only; the child answers 409.
    const childLate = await act(ext.json().childReservation.id, 'late-checkout', {
      checkoutTime: '13:00',
      dryRun: true,
    });
    expect(childLate.statusCode).toBe(409);
    await at('2026-12-10T11:05:00+07:00');
    const s = (await c.fd!.get(url(`/reservations/${o.id}/checkout-summary`))).json();
    const out = await act(o.id, 'check-out', {
      checkoutTime: '11:00',
      checkoutAt: '2026-12-10T11:00:00+07:00',
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.balanceDueVnd },
    });
    expect(out.statusCode, out.body).toBe(200);
    const st = await q<{ status: string }>(
      'SELECT status FROM reservation WHERE id = $1 OR parent_reservation_id = $1 ORDER BY created_at',
      [o.id],
    );
    expect(st.map((x) => x.status)).toEqual(['checked_out', 'checked_out']);
  });

  it('ARC-09: the SSE listener reconnects after its connection is killed – the next event still arrives', async () => {
    const hub = fa.app.get(SseHub);
    const got: string[] = [];
    const unsubscribe = await hub.subscribe({
      propertyId: t.propertyIds[0]!,
      userId: randomUUID(),
      roles: ['front_desk'],
      send: (type, data) => {
        got.push(`${type}:${data.id}`);
        return true;
      },
      close: () => undefined,
    });
    try {
      const pid = hub.listenerPid;
      expect(pid).not.toBeNull();
      await db.withContext(t.ctx(), (tx) => tx.query('SELECT pg_terminate_backend($1)', [pid]));
      const id = randomUUID();
      const deadline = Date.now() + 8_000;
      while (!got.includes(`room.status_changed:${id}`) && Date.now() < deadline) {
        await db.withContext(t.ctx(), (tx: Tx) =>
          publishSse(tx, 'room.status_changed', id, { roles: ['front_desk'] }),
        );
        await new Promise((r) => setTimeout(r, 250));
      }
      expect(got).toContain(`room.status_changed:${id}`);
      expect(hub.listenerPid).not.toBe(pid);
    } finally {
      unsubscribe();
    }
  });

  it('SEC-BE-39: idempotency.purge deletes keys older than idempotency_ttl_hours (48), keeps fresh ones', async () => {
    const now = new Date('2026-12-10T12:00:00+07:00');
    const old = randomUUID();
    const fresh = randomUUID();
    for (const [key, hours] of [
      [old, 49],
      [fresh, 1],
    ] as const) {
      await q(
        `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
           request_hash, state, response_status, response_body, created_at)
         VALUES ('user', $1, $2, $3, 'POST', '/x', 'h', 'completed', 200, '{}', $4)`,
        [t.users.fd!.id, key, t.organizationId, new Date(now.getTime() - hours * 3_600_000)],
      );
    }
    const out = await db.withContext(t.ctx(), (tx) =>
      IDEMPOTENCY_PURGE_JOB.handler(tx, {
        now,
        organizationId: t.organizationId,
        propertyId: t.propertyIds[0]!,
        timezone: 'Asia/Ho_Chi_Minh',
        date: '2026-12-10',
        slot: 'tick',
      }),
    );
    expect(out).toMatchObject({ deleted: expect.any(Number) });
    const left = await q<{ key: string }>(
      'SELECT key FROM idempotency_key WHERE key = ANY($1::text[])',
      [[old, fresh]],
    );
    expect(left.map((r) => r.key)).toEqual([fresh]);
  });
});
