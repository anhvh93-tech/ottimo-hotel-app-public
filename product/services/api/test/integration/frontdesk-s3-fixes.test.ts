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
 * - Fix round 4 (re-verification 17/10): B16 drops child-booking nights (effective departure), per-night B14 OTA
 *   difference reversed by B16, add-person preview/charge includes child nights, OTA guest count (0.3.6 bổ sung 4).
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { IDEMPOTENCY_PURGE_JOB } from '../../src/jobs/builtin-jobs';
import { SseHub } from '../../src/modules/events/internal/sse-hub';
import { publishSse } from '../../src/modules/events/public/events.service';
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
import { RegistrationPartyLink } from '../../src/modules/registration/public/party-port';
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
  visa: string | null = null;
  async earliestVisaValidUntil(): Promise<string | null> {
    return this.visa;
  }
}

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'], sal: ['sales_staff'] };

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  examples: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
  }>;
};
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('front desk – Sprint 3 review fixes (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const companions: string[] = [];
  const c: Record<string, Client> = {};
  const docs = new DocsOk();

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
          new Date('2027-06-30T00:00:00Z'),
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
        b.overrideProvider(FrontdeskPorts).useFactory({
          // The real child-data cipher (CryptoService – FK child_data_key_id → data_key).
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(docs, new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
        }),
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
    // BUG-R2-046: the FOC request carries the night basis (last night 667.000) → within the manager's
    // "≤ 1 night" limit, no escalation to the owner.
    const ap = await c.mgr!.send('POST', url(`/approval-requests/${req!.id}/actions/approve`), {
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
    // BUG-R2-045 (0.3.6 bổ sung 3): savings per number of nights = Σ default rates × the OTA commission.
    const opts = (await c.fd!.get(url(`/reservations/${o.id}/extension-options`))).json() as {
      channelFeeSavingsVnd: number;
      repricing: Array<{ nights: number; repricedTotalVnd: number; channelFeeSavingsVnd: number }>;
    };
    const [rate] = await q<{ pct: string }>(
      `SELECT r.rate_pct::text AS pct FROM channel_commission_rate r
        WHERE r.channel_id = $1 ORDER BY r.effective_from DESC LIMIT 1`,
      [ids.channels.agoda],
    );
    const pct = Number(rate!.pct);
    const fee = (base: number) => Math.round((base * pct) / 100 / 1000) * 1000;
    expect(opts.repricing.length).toBeGreaterThan(1);
    for (const r of opts.repricing) {
      expect(r.channelFeeSavingsVnd, `nights ${r.nights}`).toBe(fee(r.repricedTotalVnd));
    }
    expect(opts.channelFeeSavingsVnd).toBe(opts.repricing[0]!.channelFeeSavingsVnd);
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

  it('BUG-R2-052/031/040/047/037: arrival at 01:30 after midnight is a plain B9; Reservation 0.3.6 fields; stored room status; extension → OD; visa soft block', async () => {
    await at('2026-12-14T15:00:00+07:00');
    await q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms['101']]);
    const b = await direct('101', '2026-12-14', '2026-12-16', 1_334_000);
    // 15/12 01:30 – calendar day after the arrival, business day still 14/12 (BR-010)
    await at('2026-12-15T01:30:00+07:00');
    const pv = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
    expect(pv.earlyCheckinSurcharge).toMatchObject({ amountVnd: 0, addsPreviousNight: false });
    const ci = await act(b.id, 'check-in', { cardsIssued: 1, houseRulesSent: true });
    expect(ci.statusCode, ci.body).toBe(200);
    expect(ci.json()).toMatchObject({
      status: 'in_house',
      actualCheckinAt: '2026-12-15T01:30:00.000+07:00',
      cardsIssued: 1,
      houseRulesSentAt: '2026-12-15T01:30:00.000+07:00',
      balanceDueVnd: 0,
      registrationId: expect.any(String),
      registrationStatus: expect.any(String),
    });
    expect(await live(b.folioId, 'early_checkin')).toEqual([]);
    const rackStatus = async () =>
      (
        (await c.fd!.get(url('/rack?days=3'))).json().rooms as Array<{
          roomNo: string;
          roomStatus: string;
        }>
      ).find((r) => r.roomNo === '101')?.roomStatus;
    expect(await rackStatus()).toBe('OC');
    // BUG-R2-037: visa ends 16/12 – extending to 17/12 needs the confirmation (soft block)
    await at('2026-12-15T10:00:00+07:00');
    docs.visa = '2026-12-16';
    try {
      const soft = await act(b.id, 'extend', { nights: 1 });
      expect(soft.statusCode).toBe(422);
      expect(soft.json().errors).toContainEqual({
        field: 'visaWarningAckReason',
        code: 'VISA_EXPIRES_BEFORE_DEPARTURE',
      });
      const ok = await act(b.id, 'extend', {
        nights: 1,
        visaWarningAckReason: 'Khách đang làm thủ tục gia hạn thị thực',
      });
      expect(ok.statusCode, ok.body).toBe(200);
    } finally {
      docs.visa = null;
    }
    // BUG-R2-047 / BUG-R2-040: the stay goes on → OD, and the rack shows the stored status
    expect(await rackStatus()).toBe('OD');
  });

  it('BUG-R2-033: a document without partyMemberId is attached only on a document-number match (SEC s3 §7)', async () => {
    await at('2026-12-21T15:00:00+07:00');
    const b = await direct('102', '2026-12-21', '2026-12-23', 1_500_000);
    // 0055 (erd 4.4, SEC F03): a stored blind index is v1-shaped and exists only with the P05 consent.
    const hmac = `v1:${randomBytes(32).toString('hex')}`;
    await q(`UPDATE guest SET id_doc_hmac = $2, crm_consent = 'granted' WHERE id = $1`, [
      companions[0],
      hmac,
    ]);
    await q(`UPDATE guest SET date_of_birth = '1990-05-04' WHERE id = $1`, [companions[1]]);
    const port = fa.app.get(RegistrationPartyLink, { strict: false });
    const call = (docNumberHmac: string, fullNameOnDoc: string, dateOfBirth: string | null) =>
      db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, (tx) =>
        port.memberForDocument(tx, {
          reservationId: b.id,
          docNumberHmac,
          fullNameOnDoc,
          dateOfBirth,
          nationalityCode: 'VNM',
          isMinor: false,
          actor: { userId: t.users.fd!.id, requestId: randomUUID() },
        }),
      );
    const presentCount = async () =>
      (await c.fd!.get(url(`/reservations/${b.id}/party`))).json().presentCount as number;
    // name + date of birth of a known profile, another document number → NOT attached (only a suggestion)
    expect(await call(`other-${randomUUID()}`, 'Đỗ Bạn Hai', '1990-05-04')).toBeNull();
    expect(await presentCount()).toBe(1);
    // document number of a known profile → attached (companion, relationship unknown)
    const first = await call(hmac, 'Do Ban Mot', null);
    expect(first).toEqual(expect.any(String));
    expect(await presentCount()).toBe(2);
    expect(await call(hmac, 'Do Ban Mot', null)).toBe(first); // same person → same member, no second row
    // nothing matches → null (the desk links the document)
    expect(await call(`other-${randomUUID()}`, 'Người Lạ', null)).toBeNull();
  });

  describe('blocker verification ARC-S3-01 (17/10): extra-person fee per night in every stay change', () => {
    /** The room was left dirty/occupied by an earlier stay of this file (room status is not per date). */
    const ready = (room: string) =>
      q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2027-01-04T00:00:00Z')],
      );
    const addPerson = (id: string, body: Record<string, unknown>) =>
      c.fd!.send('POST', url(`/reservations/${id}/party`), {
        effectiveFrom: '2027-01-05',
        ...body,
      });
    const extraLines = (folioId: string) =>
      q<{ service_date: string; amount_vnd: number; description: string; reservation_id: string }>(
        `SELECT l.service_date::text AS service_date, l.amount_vnd, l.description, l.reservation_id
           FROM folio_line l
          WHERE l.folio_id = $1 AND l.category = 'extra_person' AND l.line_state = 'posted'
            AND l.reversal_of_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
          ORDER BY l.service_date`,
        [folioId],
      );

    it('a child 6–11 with a fee, then an extension: the bill counts 1 person each night, the new night is charged; B14 to a bigger room drops the fee of the moved nights only', async () => {
      await at('2027-01-04T15:00:00+07:00');
      const b = await direct('203', '2027-01-04', '2027-01-07', 2_376_000);
      await ready('203');
      await checkIn(b);
      await at('2027-01-05T10:00:00+07:00');
      // (3) a person announced for tomorrow is added tomorrow – never charged in advance
      const future = await addPerson(b.id, {
        role: 'child',
        childName: 'Bé Na',
        childBirthYear: 2018,
        effectiveFrom: '2027-01-06',
      });
      expect(future.statusCode).toBe(422);
      expect(future.json().errors).toContainEqual({ field: 'effectiveFrom', code: 'DATE_INVALID' });
      const kid = await addPerson(b.id, {
        role: 'child',
        childName: 'Bé Na',
        childBirthYear: 2018,
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: 200_000,
      });
      expect(kid.statusCode, kid.body).toBe(201);
      await at('2027-01-06T10:00:00+07:00');
      const ext = await act(b.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      expect(
        (await extraLines(b.folioId)).map((l) => [l.service_date, l.amount_vnd, l.description]),
      ).toEqual([
        ['2027-01-05', 100_000, 'extra_guest x1'],
        ['2027-01-06', 100_000, 'extra_guest x1'],
        ['2027-01-07', 100_000, 'extra_guest x1'],
      ]);
      // B14 guest_request to 301 (base 4): the moved nights carry no fee; 05/01 keeps its fee.
      await q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms['301']]);
      const body = {
        newRoomId: ids.rooms['301'],
        effectiveDate: '2027-01-06',
        cause: 'guest_request',
        reason: 'Khách muốn căn rộng hơn',
      };
      const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      const moved = await act(b.id, 'change-room', {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: dry.json().folioDeltaVnd,
      });
      expect(moved.statusCode, moved.body).toBe(200);
      expect((await extraLines(b.folioId)).map((l) => [l.service_date, l.amount_vnd])).toEqual([
        ['2027-01-05', 100_000],
      ]);
    });

    it('an OTA stay extended first (child booking), then a 3rd adult: the child night is charged too', async () => {
      await at('2027-01-04T15:00:00+07:00');
      const o = await ota('202', '2027-01-04', '2027-01-06', 1_800_000);
      await ready('202');
      await checkIn(o);
      await at('2027-01-05T09:00:00+07:00');
      const ext = await act(o.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      const childId = ext.json().childReservation.id as string;
      await at('2027-01-05T10:00:00+07:00');
      expect(
        (await addPerson(o.id, { role: 'companion', guestId: companions[0] })).statusCode,
      ).toBe(201);
      // Fix round 4 (3): the confirmed amount covers the child booking's night too (150.000 × 2).
      const dry = await addPerson(o.id, {
        role: 'companion',
        guestId: companions[1],
        dryRun: true,
      });
      expect(dry.statusCode, dry.body).toBe(200);
      expect(dry.json().occupancyChange).toMatchObject({ surchargeVnd: 300_000, nights: 2 });
      const stale = await addPerson(o.id, {
        role: 'companion',
        guestId: companions[1],
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: 150_000,
      });
      expect(stale.statusCode).toBe(409);
      expect(stale.json()).toMatchObject({ code: 'SURCHARGE_CHANGED', surchargeVnd: 300_000 });
      const third = await addPerson(o.id, {
        role: 'companion',
        guestId: companions[1],
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: 300_000,
      });
      expect(third.statusCode, third.body).toBe(201);
      const lines = await extraLines(o.folioId);
      expect(lines.map((l) => [l.service_date, l.amount_vnd, l.reservation_id])).toEqual([
        ['2027-01-05', 150_000, o.id],
        ['2027-01-06', 150_000, childId],
      ]);
      const [child] = await q<{ adults: number }>('SELECT adults FROM reservation WHERE id = $1', [
        childId,
      ]);
      expect(child?.adults).toBe(3);
    });

    it('B16 after a person added mid-stay: the dropped nights’ fee is refunded in full with the BR-428 part', async () => {
      await at('2027-01-04T15:00:00+07:00');
      const b = await direct('201', '2027-01-04', '2027-01-08', 2_832_000);
      await ready('201');
      await checkIn(b);
      await at('2027-01-05T10:00:00+07:00');
      expect(
        (await addPerson(b.id, { role: 'companion', guestId: companions[0] })).statusCode,
      ).toBe(201);
      const third = await addPerson(b.id, {
        role: 'companion',
        guestId: companions[1],
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: 450_000,
      });
      expect(third.statusCode, third.body).toBe(201);
      const pay = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: 450_000,
      });
      expect([200, 201], pay.body).toContain(pay.statusCode);
      const res = await act(b.id, 'early-departure', {
        newDepartureDate: '2027-01-06',
        noticeGivenAt: '2027-01-05T10:00:00+07:00',
      });
      expect(res.statusCode, res.body).toBe(200);
      // dropped 06 + 07: 1.416.000 net → 50 % = 708.000 kept, 708.000 + extra persons 300.000 refunded
      expect(res.json()).toMatchObject({ earlyDepartureFeeVnd: 708_000, refundVnd: 1_008_000 });
      expect((await extraLines(b.folioId)).map((l) => [l.service_date, l.amount_vnd])).toEqual([
        ['2027-01-05', 150_000],
      ]);
    });
  });

  describe('fix round 4 (re-verification 17/10): child-booking nights, per-night OTA difference, OTA guest count', () => {
    const ready = (room: string) =>
      q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2027-03-01T00:00:00Z')],
      );
    const addPerson = (id: string, body: Record<string, unknown>) =>
      c.fd!.send('POST', url(`/reservations/${id}/party`), body);
    const linesOf = (folioId: string, category: string) =>
      q<{ service_date: string; amount_vnd: number; reservation_id: string }>(
        `SELECT l.service_date::text AS service_date, l.amount_vnd, l.reservation_id FROM folio_line l
          WHERE l.folio_id = $1 AND l.category = $2 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
          ORDER BY l.service_date, l.posted_at`,
        [folioId, category],
      );
    const totals = async (folioId: string) =>
      (await c.fd!.get(url(`/folios/${folioId}`))).json().totals as {
        balanceDueVnd: number;
        paidViaOtaVnd?: number;
      };
    const pay = async (folioId: string, amountVnd: number) => {
      const r = await c.fd!.send('POST', url(`/folios/${folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd,
      });
      expect([200, 201], r.body).toContain(r.statusCode);
    };
    const refunds = (id: string) =>
      q<{ amount_vnd: number }>(
        `SELECT amount_vnd FROM approval_request WHERE type = 'refund' AND target_id = $1 ORDER BY created_at`,
        [id],
      );
    const nightNet = async (id: string, date: string) =>
      (
        await q<{ net: number }>(
          `SELECT room_revenue_vnd AS net FROM stay_night WHERE reservation_id = $1 AND stay_date = $2
              AND night_state <> 'void'`,
          [id, date],
        )
      )[0]?.net as number;
    const half = (v: number) => Math.round(v / 2 / 1000) * 1000;
    const patch = async (id: string, body: Record<string, unknown>) =>
      c.fd!.send('PATCH', url(`/reservations/${id}`), body, {
        'if-match': `"${await version(id)}"`,
      });

    it('(1)(3)(4) OTA 01–03 + child 03–05: a person joins on 03 (child nights only); the guest leaves on 04 – B16 on the primary drops the child night (one refund), B18 on 04', async () => {
      await at('2027-03-01T15:00:00+07:00');
      await ready('202');
      const o = await ota('202', '2027-03-01', '2027-03-03', 1_800_000);
      await checkIn(o);
      await at('2027-03-02T09:00:00+07:00');
      const ext = await act(o.id, 'extend', { nights: 2 });
      expect(ext.statusCode, ext.body).toBe(200);
      const childId = ext.json().childReservation.id as string;
      await at('2027-03-03T10:00:00+07:00');
      // (4) today only has child-booking nights: the person joins the stay through the primary booking.
      expect(
        (
          await addPerson(o.id, {
            role: 'companion',
            guestId: companions[0],
            effectiveFrom: '2027-03-03',
          })
        ).statusCode,
      ).toBe(201);
      const third = {
        role: 'companion',
        guestId: companions[1],
        effectiveFrom: '2027-03-03',
      };
      const dry = await addPerson(o.id, { ...third, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      expect(dry.json().occupancyChange).toMatchObject({ surchargeVnd: 300_000, nights: 2 });
      const added = await addPerson(o.id, {
        ...third,
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: 300_000,
      });
      expect(added.statusCode, added.body).toBe(201);
      expect(
        (await linesOf(o.folioId, 'extra_person')).map((l) => [
          l.service_date,
          l.amount_vnd,
          l.reservation_id,
        ]),
      ).toEqual([
        ['2027-03-03', 150_000, childId],
        ['2027-03-04', 150_000, childId],
      ]);
      await pay(o.folioId, (await totals(o.folioId)).balanceDueVnd);
      // (1) B16 runs on the primary booking only; the effective departure (05) bounds the new date.
      const onChild = await act(childId, 'early-departure', {
        newDepartureDate: '2027-03-04',
        noticeGivenAt: '2027-03-03T10:00:00+07:00',
      });
      expect(onChild.statusCode).toBe(409);
      const tooLate = await act(o.id, 'early-departure', {
        newDepartureDate: '2027-03-05',
        noticeGivenAt: '2027-03-03T10:00:00+07:00',
      });
      expect(tooLate.json().errors).toContainEqual({
        field: 'newDepartureDate',
        code: 'DATE_INVALID',
      });
      const net = await nightNet(childId, '2027-03-04');
      const ed = await act(o.id, 'early-departure', {
        newDepartureDate: '2027-03-04',
        noticeGivenAt: '2027-03-03T10:00:00+07:00',
      });
      expect(ed.statusCode, ed.body).toBe(200);
      // child night 04 (direct, notice 1 day): 50 % refunded + the collected BR-110 fee of that night 100 %.
      expect(ed.json()).toMatchObject({
        reservation: { departureDate: '2027-03-03' },
        earlyDepartureFeeVnd: net - half(net),
        refundVnd: half(net) + 150_000,
        extraPersonRefundVnd: 150_000,
        extraPersonReversedVnd: 0,
      });
      const [child] = await q<{ departure_date: string; status: string }>(
        'SELECT departure_date::text AS departure_date, status FROM reservation WHERE id = $1',
        [childId],
      );
      expect(child).toEqual({ departure_date: '2027-03-04', status: 'in_house' });
      expect((await linesOf(o.folioId, 'extra_person')).map((l) => l.service_date)).toEqual([
        '2027-03-03',
      ]);
      expect(await refunds(o.id)).toEqual([{ amount_vnd: half(net) + 150_000 }]);
      await at('2027-03-04T11:00:00+07:00');
      const out = await act(o.id, 'check-out', { checkoutTime: '11:00' });
      expect(out.statusCode, out.body).toBe(200);
      const st = await q<{ status: string }>(
        'SELECT status FROM reservation WHERE id = $1 OR parent_reservation_id = $1 ORDER BY created_at',
        [o.id],
      );
      expect(st.map((x) => x.status)).toEqual(['checked_out', 'checked_out']);
      expect(await refunds(o.id)).toHaveLength(1);
    });

    it('(1) the guest leaves on the OTA departure: the child booking none of whose nights is stayed is cancelled, its room is released', async () => {
      await at('2027-03-08T15:00:00+07:00');
      await ready('203');
      const o = await ota('203', '2027-03-08', '2027-03-10', 1_800_000);
      await checkIn(o);
      await at('2027-03-09T09:00:00+07:00');
      const ext = await act(o.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      const childId = ext.json().childReservation.id as string;
      const net = await nightNet(childId, '2027-03-10');
      await at('2027-03-09T10:00:00+07:00');
      // no OTA night is dropped → nothing for the OTA to keep (otaRetainedVnd optional)
      const ed = await act(o.id, 'early-departure', {
        newDepartureDate: '2027-03-10',
        noticeGivenAt: '2027-03-09T10:00:00+07:00',
      });
      expect(ed.statusCode, ed.body).toBe(200);
      expect(ed.json()).toMatchObject({
        reservation: { departureDate: '2027-03-10' },
        earlyDepartureFeeVnd: net - half(net),
        refundVnd: 0,
        refundRequestId: null,
      });
      const [child] = await q<{ status: string; cancel_reason_code: string }>(
        'SELECT status, cancel_reason_code FROM reservation WHERE id = $1',
        [childId],
      );
      expect(child).toEqual({ status: 'cancelled', cancel_reason_code: 'date_change' });
      const busy = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM room_occupancy WHERE room_id = $1 AND active
            AND stay_range && daterange('2027-03-10', '2027-03-11')`,
        [ids.rooms['203']],
      );
      expect(busy[0]?.n).toBe(0);
      expect((await linesOf(o.folioId, 'room')).map((l) => l.service_date)).toEqual([
        '2027-03-08',
        '2027-03-09',
      ]);
      await at('2027-03-10T11:00:00+07:00');
      const s = (await c.fd!.get(url(`/reservations/${o.id}/checkout-summary`))).json();
      const out = await act(o.id, 'check-out', {
        checkoutTime: '11:00',
        ...(s.balanceDueVnd > 0
          ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: s.balanceDueVnd } }
          : {}),
      });
      expect(out.statusCode, out.body).toBe(200);
    });

    it('(2) B14 on an OTA booking writes the difference per night; B16 reverses the dropped night’s share (refunded when collected)', async () => {
      await at('2027-03-15T15:00:00+07:00');
      await ready('201');
      const o = await ota('201', '2027-03-15', '2027-03-18', 2_400_000);
      await checkIn(o);
      await at('2027-03-16T10:00:00+07:00');
      await ready('203');
      const body = {
        newRoomId: ids.rooms['203'],
        effectiveDate: '2027-03-16',
        cause: 'guest_request',
        reason: 'Khách muốn căn có ban công',
      };
      const dry = await act(o.id, 'change-room', { ...body, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      const delta = dry.json().roomChangeDifferenceVnd as number;
      expect(delta).toBeGreaterThan(0);
      const moved = await act(o.id, 'change-room', {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: dry.json().folioDeltaVnd,
      });
      expect(moved.statusCode, moved.body).toBe(200);
      const diffs = await linesOf(o.folioId, 'room_change_difference');
      expect(diffs.map((l) => l.service_date)).toEqual(['2027-03-16', '2027-03-17']);
      expect(diffs.reduce((a, l) => a + l.amount_vnd, 0)).toBe(delta);
      await pay(o.folioId, (await totals(o.folioId)).balanceDueVnd);
      const ed = await act(o.id, 'early-departure', {
        newDepartureDate: '2027-03-17',
        noticeGivenAt: '2027-03-16T10:00:00+07:00',
        otaRetainedVnd: 0,
      });
      expect(ed.statusCode, ed.body).toBe(200);
      const dropped = diffs[1]!.amount_vnd;
      expect(ed.json()).toMatchObject({
        earlyDepartureFeeVnd: 0,
        refundVnd: dropped,
        extraPersonRefundVnd: 0,
      });
      expect(
        (await linesOf(o.folioId, 'room_change_difference')).map((l) => [
          l.service_date,
          l.amount_vnd,
        ]),
      ).toEqual([['2027-03-16', diffs[0]!.amount_vnd]]);
      expect(await refunds(o.id)).toEqual([{ amount_vnd: dropped }]);
    });

    it('(5) OTA guest count (0.3.6 bổ sung 4): Agoda 201, 2 → 3 people before check-in – guest_direct keeps the OTA count, 150.000/night at the desk; ota_modification moves it', async () => {
      await at('2027-03-20T10:00:00+07:00');
      const o = await ota('201', '2027-04-01', '2027-04-03', 1_400_000);
      expect((await c.fd!.get(url(`/reservations/${o.id}`))).json().otaGuestCount).toBe(2);
      const noSource = await patch(o.id, { adults: 3 });
      expect(noSource.statusCode).toBe(422);
      expect(noSource.json().errors).toContainEqual({
        field: 'partyChangeSource',
        code: 'REQUIRED',
      });
      const noRef = await patch(o.id, { adults: 3, partyChangeSource: 'ota_modification' });
      expect(noRef.json().errors).toContainEqual({
        field: 'otaModificationRef',
        code: 'REQUIRED',
      });
      const direct3 = await patch(o.id, { adults: 3, partyChangeSource: 'guest_direct' });
      expect(direct3.statusCode, direct3.body).toBe(200);
      expect(direct3.json()).toMatchObject({ adults: 3, otaGuestCount: 2 });
      expect(
        (await linesOf(o.folioId, 'extra_person')).map((l) => [l.service_date, l.amount_vnd]),
      ).toEqual([
        ['2027-04-01', 150_000],
        ['2027-04-02', 150_000],
      ]);
      // never in "Đã thu qua OTA": the OTA receipt still equals the room money, 300.000 due at the desk
      expect(await totals(o.folioId)).toMatchObject({
        balanceDueVnd: 300_000,
        paidViaOtaVnd: 1_400_000,
      });
      await pay(o.folioId, 300_000);
      await at('2027-04-01T15:00:00+07:00');
      await ready('201');
      await checkIn(o);
      expect((await linesOf(o.folioId, 'extra_person')).map((l) => l.amount_vnd)).toEqual([
        150_000, 150_000,
      ]);
      // in house: people change through the party (always guest_direct)
      const inHouse = await patch(o.id, {
        partyChangeSource: 'ota_modification',
        otaModificationRef: 'AGD-123456',
      });
      expect(inHouse.json().errors).toContainEqual({
        field: 'partyChangeSource',
        code: 'NOT_ALLOWED',
      });

      await at('2027-03-20T10:00:00+07:00');
      const m = await ota('202', '2027-04-01', '2027-04-03', 1_400_000);
      const modified = await patch(m.id, {
        adults: 3,
        partyChangeSource: 'ota_modification',
        otaModificationRef: 'AGD-MOD-7788',
      });
      expect(modified.statusCode, modified.body).toBe(200);
      expect(modified.json()).toMatchObject({ adults: 3, otaGuestCount: 3 });
      expect(await linesOf(m.folioId, 'extra_person')).toEqual([]);
      const hist = await q<{ reason: string | null }>(
        `SELECT reason FROM reservation_change WHERE reservation_id = $1 AND field = 'adults'`,
        [m.id],
      );
      expect(hist.map((h) => h.reason)).toEqual(['ota_modification AGD-MOD-7788']);
      const d = await direct('203', '2027-04-01', '2027-04-03', 1_584_000);
      const notOta = await patch(d.id, { adults: 3, partyChangeSource: 'guest_direct' });
      expect(notOta.json().errors).toContainEqual({
        field: 'partyChangeSource',
        code: 'NOT_ALLOWED',
      });
    });

    it('fix round 5 (C): "OTA sửa đơn" after the desk took the same count as guest_direct → OTA count follows, the fee goes', async () => {
      await at('2027-03-20T10:00:00+07:00');
      const o = await ota('202', '2027-04-05', '2027-04-07', 1_400_000);
      const direct3 = await patch(o.id, { adults: 3, partyChangeSource: 'guest_direct' });
      expect(direct3.statusCode, direct3.body).toBe(200);
      expect((await linesOf(o.folioId, 'extra_person')).map((l) => l.amount_vnd)).toEqual([
        150_000, 150_000,
      ]);
      const modified = await patch(o.id, {
        adults: 3,
        partyChangeSource: 'ota_modification',
        otaModificationRef: 'AGD-MOD-9090',
      });
      expect(modified.statusCode, modified.body).toBe(200);
      expect(modified.json()).toMatchObject({ adults: 3, otaGuestCount: 3 });
      expect(await linesOf(o.folioId, 'extra_person')).toEqual([]);
      expect((await totals(o.folioId)).balanceDueVnd).toBe(0);
      const hist = await q<{ old_value: string; new_value: string; reason: string }>(
        `SELECT old_value, new_value, reason FROM reservation_change
          WHERE reservation_id = $1 AND field = 'ota_guest_count'`,
        [o.id],
      );
      expect(hist).toEqual([
        { old_value: '2', new_value: '3', reason: 'ota_modification AGD-MOD-9090' },
      ]);
      // the same again is a no-op (nothing left to re-price)
      const again = await patch(o.id, {
        adults: 3,
        partyChangeSource: 'ota_modification',
        otaModificationRef: 'AGD-MOD-9090',
      });
      expect(again.statusCode, again.body).toBe(200);
      expect(await linesOf(o.folioId, 'extra_person')).toEqual([]);
    });

    it('fix round 5 (B), BR-424 bổ sung 17/10: OTA 203 19–21 + child 21–23, B14 on 20 to 401 moves the whole stay; a room not free for the child nights is refused before saving', async () => {
      await at('2027-04-19T15:00:00+07:00');
      await ready('203');
      const o = await ota('203', '2027-04-19', '2027-04-21', 1_800_000);
      await checkIn(o);
      await at('2027-04-20T09:00:00+07:00');
      const ext = await act(o.id, 'extend', { nights: 2 });
      expect(ext.statusCode, ext.body).toBe(200);
      const childId = ext.json().childReservation.id as string;
      const other = await ota('402', '2027-04-22', '2027-04-23', 1_000_000);
      await at('2027-04-20T10:00:00+07:00');
      const body = (room: string) => ({
        newRoomId: ids.rooms[room],
        effectiveDate: '2027-04-20',
        cause: 'guest_request',
        reason: 'Khách muốn căn rộng hơn',
      });
      // B14 runs on the primary booking (the child shares its room and folio)
      expect((await act(childId, 'change-room', { ...body('401'), dryRun: true })).statusCode).toBe(
        409,
      );
      // 402 is taken on 22 by another booking → refused before anything is saved, the night is listed
      const busy = await act(o.id, 'change-room', { ...body('402'), dryRun: true });
      expect(busy.statusCode, busy.body).toBe(409);
      expect(busy.json().code).toBe('ROOM_UNAVAILABLE');
      expect(busy.json().conflicts).toContainEqual(
        expect.objectContaining({ reservationCode: other.code, nights: ['2027-04-22'] }),
      );
      await ready('401');
      const dry = await act(o.id, 'change-room', { ...body('401'), dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      const preview = dry.json() as {
        nights: Array<{ date: string; oldRateVnd: number; newRateVnd: number }>;
        folioDeltaVnd: number;
        roomChangeDifferenceVnd: number;
      };
      expect(preview.nights.map((n) => n.date)).toEqual(['2027-04-20', '2027-04-21', '2027-04-22']);
      // child nights (direct) take the 401 calendar; the OTA night keeps its price + the difference
      const childDelta = preview.nights
        .slice(1)
        .reduce((a, n) => a + n.newRateVnd - n.oldRateVnd, 0);
      expect(childDelta).toBeGreaterThan(0);
      expect(preview.roomChangeDifferenceVnd).toBeGreaterThan(0);
      expect(preview.folioDeltaVnd).toBe(preview.roomChangeDifferenceVnd + childDelta);
      const moved = await act(o.id, 'change-room', {
        ...body('401'),
        applyDifference: true,
        expectedDeltaVnd: preview.folioDeltaVnd,
      });
      expect(moved.statusCode, moved.body).toBe(200);
      const segs = await q<{ reservation_id: string; room_no: string; f: string; t: string }>(
        `SELECT s.reservation_id, rm.room_no, s.from_date::text AS f, s.to_date::text AS t
           FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
          WHERE s.active AND s.reservation_id IN ($1, $2) ORDER BY s.from_date`,
        [o.id, childId],
      );
      expect(
        segs.map((x) => [x.reservation_id === o.id ? 'parent' : 'child', x.room_no, x.f, x.t]),
      ).toEqual([
        ['parent', '203', '2027-04-19', '2027-04-20'],
        ['parent', '401', '2027-04-20', '2027-04-21'],
        ['child', '401', '2027-04-21', '2027-04-23'],
      ]);
      const occ = await q<{ room_no: string; r: string }>(
        `SELECT rm.room_no, o.stay_range::text AS r FROM room_occupancy o JOIN room rm ON rm.id = o.room_id
          WHERE o.active AND o.room_id IN ($1, $2) AND o.stay_range && daterange('2027-04-20', '2027-04-23')
          ORDER BY lower(o.stay_range)`,
        [ids.rooms['203'], ids.rooms['401']],
      );
      expect(occ.map((x) => x.room_no)).toEqual(['401', '401']);
      expect(
        (await linesOf(o.folioId, 'room_change_difference')).map((l) => [
          l.service_date,
          l.reservation_id,
        ]),
      ).toEqual([['2027-04-20', o.id]]);
      const childRooms = await linesOf(o.folioId, 'room');
      expect(
        childRooms
          .filter((l) => l.reservation_id === childId)
          .map((l) => [l.service_date, l.amount_vnd]),
      ).toEqual(preview.nights.slice(1).map((n) => [n.date, n.newRateVnd]));
    });

    it('(5) oracles BR-110-14 / BR-110-15: Agoda 302, 3 → 4 adults before check-in by source', async () => {
      await at('2027-03-20T10:00:00+07:00');
      const kits = (id: string) =>
        q<{ quantity: number }>(
          `SELECT quantity FROM hk_task WHERE reservation_id = $1 AND type = 'extra_guest_kit_prepare'
              AND status <> 'cancelled'`,
          [id],
        );
      for (const [id, from, to] of [
        ['BR-110-14', '2027-04-10', '2027-04-12'],
        ['BR-110-15', '2027-04-12', '2027-04-14'],
      ] as const) {
        const o = oracle(id);
        const b = await create({
          roomId: ids.rooms[String(o.input.roomNo)],
          channelId: ids.channels.agoda,
          adults: Number(o.input.adultsBefore),
          bookerGuestId: guest,
          paymentModel: String(o.input.paymentModel),
          otaRef: `AG${randomUUID().slice(0, 8)}`,
          otaRoomAmountVnd: 2_400_000,
          arrivalDate: from,
          departureDate: to,
        });
        const res = await patch(b.id, {
          adults: Number(o.input.adultsAfter),
          partyChangeSource: o.input.partyChangeSource,
          ...(o.input.partyChangeSource === 'ota_modification'
            ? { otaModificationRef: 'AGD-MOD-302' }
            : {}),
        });
        expect(res.statusCode, `${id} ${res.body}`).toBe(200);
        expect(res.json().otaGuestCount, id).toBe(o.expected.otaGuestCount);
        const fee = (await linesOf(b.folioId, 'extra_person')).reduce(
          (a, l) => a + l.amount_vnd,
          0,
        );
        expect(fee, id).toBe(o.expected.extraPersonFeeVnd);
        expect(
          (await kits(b.id)).reduce((a, k) => a + k.quantity, 0),
          id,
        ).toBe(o.expected.extraGuestKits);
      }
    });
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
