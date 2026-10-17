/**
 * BE-A – S4-38 re-verification round 2 (commit 2f77889 findings, `s4-money-reverification.md`; DOM addendum 18/10:
 * BR-309-13, BR-309-14, BR-424-07) on the real PostgreSQL through HTTP. Numbers are the report's (BR v0.3.8):
 * - BUG-R2-125 (S438R2-MOVE-01): B9a / B18 added night after an OTTIMO move – preview = QR cap = write, fee at the
 *   protected base (`nightBases`).
 * - BUG-R2-126 (R2PAY-01, R2REGR-01, R2PAY-04): `bookingRateSource` on every booking (0064 back-fills old ones);
 *   a calendar booking whose nights were typed later is not an agreed one.
 * - BUG-R2-127 (R2PAY-02): B9a window with the night before taken – nothing counted, the QR option refused.
 * - BUG-R2-128 / BR-309-13 (S438R2-CANCEL-01), BR-309-14 (S438R2-CANCEL-02): required deposit after S4-35.
 * - BUG-R2-131 (R2FOC-01, R2REGR-02): the check-in gate counts a re-applied FOC on a room-change difference as room.
 * - BUG-R2-132 (R2PAY-03): `currentBookingRateVnd` is null for a calendar booking.
 * - BR-424-07 (MOVE-06): B14 with a stale `expectedDeltaVnd` at delta 0 → 409.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
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
import { StayNightPricingPort } from '../../src/modules/reservations/public/stay-night-pricing';
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

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
};

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; input: Record<string, any>; expected: Record<string, any> }>;
};
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

/** The back-fill statement of migration 0064, as written (BUG-R2-126 – legacy bookings without the flag). */
const BACKFILL_0064 = readFileSync(
  join(__dirname, '../../src/db/migrations/0064_booking_rate_source.sql'),
  'utf8',
)
  .split('--> statement-breakpoint')
  .map((s) => s.replace(/^\s*--.*$/gm, '').trim())
  .find((s) => s.startsWith('UPDATE reservation r'));

/** FAKE receiving account (VietQR cap cases). */
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456780', accountName: 'OTTIMO TEST' };

/** DS-E calendar (BR-104 weekday / Fri–Sat), 2 adults, no special date in 2028. */
const CAL = { r101: 667_000, r101Sat: 767_000, r102: 750_000, r103: 750_000, r201: 708_000 };
const CAL2 = { r202: 792_000, r203: 792_000, r203Fri: 911_000, r302: 917_000, r402: 1_000_000 };

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('S4-38 re-verification round 2 – money fixes (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Kiểm Lại' });
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
          new Date('2030-12-31T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'fdl');
    await setPassword(db, t, 'own');
    await at('2026-10-15T09:00:00+07:00');
    const put = await c.own!.send('PUT', url('/parameters/payment_receiving_account'), {
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

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
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
  const direct = (
    room: string,
    from: string,
    to: string,
    deposit: number,
    more: Record<string, unknown> = {},
  ) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: deposit },
      ...more,
    });
  const agoda = (room: string, from: string, to: string, amount: number) =>
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
  const typed = (from: string, n: number, amountVnd: number) =>
    Array.from({ length: n }, (_, i) => {
      const d = new Date(`${from}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + i);
      return { date: d.toISOString().slice(0, 10), amountVnd };
    });
  /** B7/B8 the way the Desk does it: preview, then save with the amount shown (BR-429 (d1)). */
  const moveShown = async (id: string, body: Record<string, string>, who = 'fd') => {
    const pv = await c[who]!.get(
      url(`/reservations/${id}/move-preview?${new URLSearchParams(body)}`),
    );
    expect(pv.statusCode, pv.body).toBe(200);
    const res = await act(
      id,
      'move',
      { ...body, applyDifference: true, expectedDeltaVnd: pv.json().folioDeltaVnd },
      who,
    );
    expect(res.statusCode, res.body).toBe(200);
    return { preview: pv.json(), res: res.json() };
  };
  /** B14 the way the Desk does it: dry run, then save with the amount shown. */
  const changeRoomShown = async (b: Booking, room: string, day: string, cause: string) => {
    const body = {
      newRoomId: ids.rooms[room],
      effectiveDate: day,
      cause,
      reason: 'Điều hòa hỏng',
    };
    const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const shown = dry.json().folioDeltaVnd as number;
    const res = await act(b.id, 'change-room', {
      ...body,
      applyDifference: true,
      expectedDeltaVnd: shown,
    });
    expect(res.statusCode, res.body).toBe(200);
    return shown;
  };
  /** Live posted lines of a category as [date, amount]. */
  const lines = (folioId: string, category: string) =>
    q<{ d: string | null; a: number }>(
      `SELECT l.service_date::text AS d, l.amount_vnd::bigint AS a FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = $2 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.service_date, l.posted_at`,
      [folioId, category],
    ).then((rows) => rows.map((r) => [r.d, Number(r.a)] as [string | null, number]));
  const sum = async (folioId: string, category: string) =>
    (await lines(folioId, category)).reduce((a, x) => a + x[1], 0);
  const lineId = async (folioId: string, category: string, date: string) =>
    (
      await q<{ id: string }>(
        `SELECT l.id FROM folio_line l
          WHERE l.folio_id = $1 AND l.category = $2 AND l.service_date = $3 AND l.line_state = 'posted'
            AND l.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
        [folioId, category, date],
      )
    )[0]!.id;
  /** S4-35 via adjustFolioLine (MGR): the price typed for a night (its calendar price). */
  const typeNight = async (b: Booking, date: string, priceVnd: number) => {
    const folio = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
    const r = await c.mgr!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${await lineId(b.folioId, 'room', date)}/adjustments`),
      { newUnitPriceVnd: priceVnd, reason: 'Quản lý sửa giá đêm' },
      { 'if-match': `"${folio.version}"` },
    );
    expect(r.statusCode, r.body).toBe(201);
  };
  const ready = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const flag = async (id: string) =>
    (
      await q<{ f: string | null }>(
        `SELECT pricing_snapshot ->> 'bookingRateSource' AS f FROM reservation WHERE id = $1`,
        [id],
      )
    )[0]!.f;
  const totals = async (b: Booking) =>
    (await c.fd!.get(url(`/folios/${b.folioId}`))).json().totals as {
      balanceDueVnd: number;
      creditVnd: number;
      totalVnd: number;
    };
  const checkInPreview = async (b: Booking, time?: string) => {
    const r = await c.fd!.get(
      url(`/reservations/${b.id}/check-in-preview${time ? `?checkinTime=${time}` : ''}`),
    );
    expect(r.statusCode, r.body).toBe(200);
    return r.json();
  };
  const checkIn = async (b: Booking, body: Record<string, unknown>) =>
    act(b.id, 'check-in', { cardsIssued: 1, houseRulesSent: true, ...body });
  const pay = (amountVnd: number) => ({ payment: { type: 'charge', method: 'cash', amountVnd } });
  const qr = (b: Booking, body: Record<string, unknown>) =>
    c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), body);
  const confirmQr = (paymentId: string) =>
    c.fd!.send('POST', url(`/payments/${paymentId}/actions/confirm-received`), {});
  const summary = async (b: Booking, time = '19:00') => {
    const r = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=${time}`));
    expect(r.statusCode, r.body).toBe(200);
    return r.json();
  };
  const options = async (b: Booking) => {
    const r = await c.fd!.get(url(`/reservations/${b.id}/extension-options`));
    expect(r.statusCode, r.body).toBe(200);
    return r.json();
  };
  const stayIn = async (b: Booking, room: string, day: string) => {
    await at(`${day}T15:00:00+07:00`);
    await ready(room);
    const pv = await checkInPreview(b, '15:00');
    const ci = await checkIn(b, {
      checkinTime: '15:00',
      ...(pv.amountDueAtCheckinVnd > 0 ? pay(pv.amountDueAtCheckinVnd) : {}),
    });
    expect(ci.statusCode, ci.body).toBe(200);
  };
  /** B9a at 04:30: preview = QR `check_in` cap = what B9a takes, then the folio is settled. */
  const b9aShown = async (b: Booking, room: string, day: string, rate: number, due: number) => {
    await at(`${day}T04:30:00+07:00`);
    await ready(room);
    const pv = await checkInPreview(b);
    expect(pv.priorNight).toMatchObject({ available: true, defaultRateVnd: rate });
    expect(pv.amountDueAtCheckinVnd).toBe(due);
    const cap = await qr(b, { purpose: 'check_in', amountVnd: due + 1, addPriorNight: true });
    expect(cap.statusCode, cap.body).toBe(422);
    expect(cap.json()).toMatchObject({ max: due });
    const ci = await checkIn(b, {
      addPriorNight: true,
      priorNightRateVnd: rate,
      expectedSurchargeVnd: rate,
      ...pay(due),
    });
    expect(ci.statusCode, ci.body).toBe(200);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  };

  // ───────────────────────────── BUG-R2-125 – added night after an OTTIMO move ─────────────────────────────

  it('BUG-R2-125 (BR-429 (b2), BR-417 (5)): 302 for 3 adults moved by OTTIMO to 202 (B7 property_fault) – B9a 792.000: preview = QR cap = B9a = 2.026.000, total 2.626.000, no fee on the added night', async () => {
    await at('2028-02-01T10:00:00+07:00');
    const b = await direct('302', '2028-03-07', '2028-03-09', 600_000, { adults: 3 });
    const mv = await moveShown(b.id, {
      roomId: ids.rooms['202'] as string,
      reasonCode: 'property_fault',
    });
    expect(mv.preview.folioDeltaVnd).toBe(0);
    await b9aShown(b, '202', '2028-03-07', CAL2.r202, 2_026_000);
    expect((await get(b.id)).totalRoomVnd).toBe(2 * CAL2.r302 + CAL2.r202);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
  });

  it('BUG-R2-125: K12 swap 402 (3 adults) ↔ 101 (2 adults) – B9a on the moved booking at 101 667.000: preview = QR cap = B9a = 2.067.000, no fee', async () => {
    await at('2028-02-01T10:00:00+07:00');
    const a = await direct('402', '2028-03-14', '2028-03-16', 600_000, { adults: 3 });
    const o = await direct('101', '2028-03-14', '2028-03-16', 400_000);
    const sw = await act(a.id, 'swap-room', {
      otherReservationId: o.id,
      otherVersion: (await get(o.id)).version,
      reason: 'Gom căn cho đoàn',
    });
    expect(sw.statusCode, sw.body).toBe(200);
    await b9aShown(a, '101', '2028-03-14', CAL.r101, 2_067_000);
    expect(await sum(a.folioId, 'extra_person')).toBe(0);
  });

  it('BUG-R2-125: B14 property_fault in house, B18 19:00 – 402 → 203: summary = QR cap = B18 = 792.000; 302 → 201: QR check_out 708.000 then B18 leaves no credit', async () => {
    await at('2028-02-01T10:00:00+07:00');
    const a = await direct('402', '2028-03-20', '2028-03-22', 600_000, { adults: 3 });
    const d = await direct('302', '2028-03-27', '2028-03-29', 600_000, { adults: 3 });
    // 402 → 203 (protected base 3), extra night Wed 22/03 at 203's calendar, fee 0.
    await stayIn(a, '402', '2028-03-20');
    await at('2028-03-21T10:00:00+07:00');
    await ready('203');
    expect(await changeRoomShown(a, '203', '2028-03-21', 'property_fault')).toBe(0);
    await at('2028-03-22T19:00:00+07:00');
    const s = await summary(a);
    expect(s).toMatchObject({
      extraNightRequired: true,
      extraNightDefaultRateVnd: CAL2.r203,
      amountDueAtCheckoutVnd: CAL2.r203,
    });
    const cap = await qr(a, { purpose: 'check_out', amountVnd: CAL2.r203 + 1 });
    expect(cap.statusCode, cap.body).toBe(422);
    expect(cap.json()).toMatchObject({ max: CAL2.r203 });
    const out = await act(a.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: CAL2.r203 },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: CAL2.r203 },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(a)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    expect(await sum(a.folioId, 'extra_person')).toBe(0);
    // 302 → 201: the guest pays the summary by QR first, then B18 – nothing paid twice.
    await stayIn(d, '302', '2028-03-27');
    await at('2028-03-28T10:00:00+07:00');
    await ready('201');
    expect(await changeRoomShown(d, '201', '2028-03-28', 'property_fault')).toBe(0);
    await at('2028-03-29T19:00:00+07:00');
    const s2 = await summary(d);
    expect(s2).toMatchObject({
      extraNightDefaultRateVnd: CAL.r201,
      amountDueAtCheckoutVnd: CAL.r201,
    });
    const mk = await qr(d, { purpose: 'check_out', amountVnd: CAL.r201 });
    expect(mk.statusCode, mk.body).toBe(201);
    expect((await confirmQr(mk.json().payment.id)).statusCode).toBeLessThan(300);
    const out2 = await act(d.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: CAL.r201 },
    });
    expect(out2.statusCode, out2.body).toBe(200);
    expect(await totals(d)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BUG-R2-125 control: 202 booked for 3 adults (no move) – the added night keeps its fee: B9a 2.226.000', async () => {
    await at('2028-02-01T10:00:00+07:00');
    const b = await direct('202', '2028-04-04', '2028-04-06', 600_000, { adults: 3 });
    await b9aShown(b, '202', '2028-04-04', CAL2.r202, 2_226_000);
    expect(await sum(b.folioId, 'extra_person')).toBe(450_000);
  });

  // ───────────────────────────── BUG-R2-126 / BUG-R2-132 – agreed vs calendar booking ─────────────────────────────

  it('BUG-R2-126 (BR-417 (2)): calendar bookings stay calendar after S4-35 – 203 B9a 792.000; 201 B13 708.000 (total 1.308.000); 101 B18 667.000; raised: 203 Friday 911.000, 202 Wednesday 792.000', async () => {
    await at('2028-03-01T10:00:00+07:00');
    const a = await direct('203', '2028-04-11', '2028-04-12', 300_000);
    const b = await direct('201', '2028-04-11', '2028-04-12', 300_000);
    const d = await direct('101', '2028-04-11', '2028-04-13', 400_000);
    const up = await direct('203', '2028-04-15', '2028-04-17', 600_000);
    const up2 = await direct('202', '2028-04-10', '2028-04-12', 500_000);
    for (const x of [a, b, d, up, up2]) expect(await flag(x.id)).toBe('calendar');
    await typeNight(a, '2028-04-11', 650_000);
    await typeNight(b, '2028-04-11', 600_000);
    for (const day of ['2028-04-11', '2028-04-12']) await typeNight(d, day, 600_000);
    for (const day of ['2028-04-15', '2028-04-16']) await typeNight(up, day, 900_000);
    for (const day of ['2028-04-10', '2028-04-11']) await typeNight(up2, day, 900_000);
    for (const x of [a, b, d, up, up2]) expect(await flag(x.id)).toBe('calendar');
    // 202 raised to 900.000: B18 Wed 12/04 suggests the calendar (792.000), the summary = what B18 takes.
    await stayIn(up2, '202', '2028-04-10');
    // 203: B9a Mon 10/04 = 203's calendar.
    const dueA = (await totals(a)).balanceDueVnd + CAL2.r203;
    await b9aShown(a, '203', '2028-04-11', CAL2.r203, dueA);
    // 201: B13 without a typed rate writes 708.000 – options = write.
    await stayIn(b, '201', '2028-04-11');
    await stayIn(d, '101', '2028-04-11');
    await at('2028-04-12T09:00:00+07:00');
    const opt = await options(b);
    expect(opt.currentBookingRateVnd).toBeNull();
    expect(opt.nights[0]).toMatchObject({ date: '2028-04-12', defaultRateVnd: CAL.r201 });
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect((await get(b.id)).totalRoomVnd).toBe(1_308_000);
    expect(await flag(b.id)).toBe('calendar');
    await at('2028-04-12T19:00:00+07:00');
    const s2 = await summary(up2);
    expect(s2).toMatchObject({
      extraNightDefaultRateVnd: CAL2.r202,
      amountDueAtCheckoutVnd: CAL2.r202,
    });
    // 101: B18 Thu 13/04 = 101's calendar, summary = B18.
    await at('2028-04-13T19:00:00+07:00');
    const s = await summary(d);
    expect(s).toMatchObject({
      extraNightDefaultRateVnd: CAL.r101,
      amountDueAtCheckoutVnd: CAL.r101,
    });
    const out = await act(d.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: CAL.r101 },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: CAL.r101 },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(d)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    // 203 raised to 900.000: B9a Fri 14/04 suggests 911.000 (calendar), not the typed price.
    await at('2028-04-15T04:30:00+07:00');
    await ready('203');
    const pv = await checkInPreview(up);
    expect(pv.priorNight).toMatchObject({ date: '2028-04-14', defaultRateVnd: CAL2.r203Fri });
  });

  it('BUG-R2-126 / R2PAY-04 (0064): an old booking without the flag gets it back from its booking-time nights – agreed 302 at 800.000: B9a, B13 default and B18 suggest 800.000, total 4.000.000; a calendar one stays calendar', async () => {
    expect(BACKFILL_0064).toBeDefined();
    await at('2028-04-20T10:00:00+07:00');
    const agreed = await direct('302', '2028-05-16', '2028-05-18', 600_000, {
      nightlyRates: typed('2028-05-16', 2, 800_000),
    });
    const cal = await direct('103', '2028-05-16', '2028-05-18', 500_000);
    expect(await flag(agreed.id)).toBe('manual_agreed');
    expect(await flag(cal.id)).toBe('calendar');
    // Rows written before 0064 had no flag.
    await q(
      `UPDATE reservation SET pricing_snapshot = pricing_snapshot - 'bookingRateSource' WHERE id = ANY($1::uuid[])`,
      [[agreed.id, cal.id]],
    );
    expect(await flag(agreed.id)).toBeNull();
    await q(BACKFILL_0064 as string);
    expect(await flag(agreed.id)).toBe('manual_agreed');
    expect(await flag(cal.id)).toBe('calendar');
    // B9a Mon 15/05 at the agreed price, B13 default Thu 18/05, B18 Fri 19/05: 5 × 800.000.
    const due = (await totals(agreed)).balanceDueVnd + 800_000;
    await b9aShown(agreed, '302', '2028-05-16', 800_000, due);
    await at('2028-05-17T10:00:00+07:00');
    const opt = await options(agreed);
    expect(opt.currentBookingRateVnd).toBe(800_000);
    expect(opt.nights[0]).toMatchObject({ date: '2028-05-18', defaultRateVnd: 800_000 });
    expect((await act(agreed.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    await at('2028-05-19T19:00:00+07:00');
    const s = await summary(agreed);
    expect(s).toMatchObject({
      extraNightDefaultRateVnd: 800_000,
      amountDueAtCheckoutVnd: 1_600_000,
    });
    const out = await act(agreed.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: 800_000 },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect((await get(agreed.id)).totalRoomVnd).toBe(4_000_000);
    expect(await totals(agreed)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BUG-R2-132: currentBookingRateVnd is null for calendar bookings – 101 after B9a Sat 767.000 (Tue 667.000, total 2.768.000); 202 with an S4-35 night (Thu 792.000); 103 with a typed B13 night (Thu 750.000)', async () => {
    await at('2028-04-20T10:00:00+07:00');
    const k1 = await direct('101', '2028-05-21', '2028-05-23', 400_000);
    const k2 = await direct('202', '2028-06-05', '2028-06-08', 800_000);
    const k4 = await direct('103', '2028-06-12', '2028-06-14', 500_000);
    // K1: B9a on Sunday 04:30 – the Saturday at 101's Saturday calendar.
    const due = (await totals(k1)).balanceDueVnd + CAL.r101Sat;
    await b9aShown(k1, '101', '2028-05-21', CAL.r101Sat, due);
    await at('2028-05-22T10:00:00+07:00');
    const o1 = await options(k1);
    expect(o1.currentBookingRateVnd).toBeNull();
    expect(o1.nights[0]).toMatchObject({ date: '2028-05-23', defaultRateVnd: CAL.r101 });
    expect((await act(k1.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect((await get(k1.id)).totalRoomVnd).toBe(2_768_000);
    // K2: an S4-35 night does not make the booking an agreed one.
    await typeNight(k2, '2028-06-06', 600_000);
    await stayIn(k2, '202', '2028-06-05');
    await at('2028-06-06T10:00:00+07:00');
    const o2 = await options(k2);
    expect(o2.currentBookingRateVnd).toBeNull();
    expect(o2.nights[0]).toMatchObject({ date: '2028-06-08', defaultRateVnd: CAL2.r202 });
    // K4: a typed B13 night neither.
    await stayIn(k4, '103', '2028-06-12');
    await at('2028-06-13T10:00:00+07:00');
    const e1 = await act(k4.id, 'extend', {
      nights: 1,
      nightlyRates: [{ date: '2028-06-14', amountVnd: 700_000 }],
    });
    expect(e1.statusCode, e1.body).toBe(200);
    const o4 = await options(k4);
    expect(o4.currentBookingRateVnd).toBeNull();
    expect(o4.nights[0]).toMatchObject({ date: '2028-06-15', defaultRateVnd: CAL.r103 });
    for (const x of [k1, k2, k4]) expect(await flag(x.id)).toBe('calendar');
  });

  // ───────────────────────────── BUG-R2-127 – B9a window, night before taken ─────────────────────────────

  it('BUG-R2-127 (BR-417 (1)/(5)): night before taken – 103: due 1.000.000 (not 1.750.000), QR with addPriorNight → 422 NOT_ALLOWED; 302: QR 1.234.000, B9 14:00 → 0/0; control 203 free → 1.876.000', async () => {
    await at('2028-04-20T10:00:00+07:00');
    const prev103 = await direct('103', '2028-05-08', '2028-05-10', 500_000);
    const prev302 = await direct('302', '2028-05-08', '2028-05-10', 600_000);
    const b103 = await direct('103', '2028-05-10', '2028-05-12', 500_000);
    const b302 = await direct('302', '2028-05-10', '2028-05-12', 600_000);
    const c203 = await direct('203', '2028-05-10', '2028-05-12', 500_000);
    expect((await totals(b103)).balanceDueVnd).toBe(1_000_000);
    expect((await totals(b302)).balanceDueVnd).toBe(1_234_000);
    await stayIn(prev103, '103', '2028-05-08');
    await stayIn(prev302, '302', '2028-05-08');
    await at('2028-05-10T04:30:00+07:00');
    // 103
    const pv = await checkInPreview(b103);
    expect(pv.priorNight).toMatchObject({ date: '2028-05-09', available: false });
    expect(pv.amountDueAtCheckinVnd).toBe(1_000_000);
    const withNight = await qr(b103, {
      purpose: 'check_in',
      amountVnd: 1_000_000,
      addPriorNight: true,
    });
    expect(withNight.statusCode, withNight.body).toBe(422);
    expect(withNight.json().errors).toEqual([
      expect.objectContaining({ field: 'addPriorNight', code: 'NOT_ALLOWED' }),
    ]);
    const cap = await qr(b103, { purpose: 'check_in', amountVnd: 1_000_001 });
    expect(cap.statusCode, cap.body).toBe(422);
    expect(cap.json()).toMatchObject({ max: 1_000_000 });
    // 302: the guest pays the amount shown by QR; B9 after the previous guest leaves → nothing left either way.
    const pv302 = await checkInPreview(b302);
    expect(pv302.amountDueAtCheckinVnd).toBe(1_234_000);
    const mk = await qr(b302, { purpose: 'check_in', amountVnd: 1_234_000 });
    expect(mk.statusCode, mk.body).toBe(201);
    expect((await confirmQr(mk.json().payment.id)).statusCode).toBeLessThan(300);
    await at('2028-05-10T11:00:00+07:00');
    const out = await act(prev302.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
    await ready('302');
    await at('2028-05-10T14:00:00+07:00');
    const ci = await checkIn(b302, { checkinTime: '14:00' });
    expect(ci.statusCode, ci.body).toBe(200);
    expect(await totals(b302)).toMatchObject({
      totalVnd: 1_834_000,
      balanceDueVnd: 0,
      creditVnd: 0,
    });
    // control 203: the night before is free – the B9a night counts.
    await b9aShown(c203, '203', '2028-05-10', CAL2.r203, 1_876_000);
    expect((await totals(c203)).totalVnd).toBe(2_376_000);
  });

  // ───────────────────────────── BUG-R2-128 / BR-309-13, BR-309-14 – required deposit ─────────────────────────────

  const cancelQuote = async (b: Booking, day: string) => {
    await at(`${day}T10:00:00+07:00`);
    const r = await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true });
    expect(r.statusCode, r.body).toBe(200);
    return r.json().cancellation as { retainedVnd: number; refundableVnd: number };
  };
  const refundRequests = async (b: Booking) =>
    (
      await q<{ a: string }>(
        `SELECT amount_vnd::text AS a FROM approval_request WHERE type = 'refund' AND target_id = $1
          ORDER BY requested_at, id`,
        [b.id],
      )
    ).map((r) => Number(r.a));

  it('BUG-R2-128 / BR-309-13: S4-35 recomputes the required deposit – 201 2 × 540.000 typed 2 days before: required 300.000, fee 300.000, refund 200.000 (same with a B7 in between); no-show keeps 300.000', async () => {
    const o = oracle('BR-309-13');
    const ex = o.expected.confirmed as Record<string, number>;
    const price = o.input.confirmed.editedNightVnd as number;
    await at('2028-05-20T10:00:00+07:00');
    const a = await direct('201', '2028-06-06', '2028-06-08', o.input.confirmed.depositPaidVnd);
    const b = await direct('201', '2028-06-13', '2028-06-15', o.input.confirmed.depositPaidVnd);
    const n = await direct('201', '2028-06-20', '2028-06-22', o.input.confirmed.depositPaidVnd);
    expect((await get(a.id)).depositRequiredVnd).toBe(400_000);
    // a: typed 2 days before arrival – a staff change: no "< 7 days" exception.
    await at('2028-06-04T09:00:00+07:00');
    for (const d of ['2028-06-06', '2028-06-07']) await typeNight(a, d, price);
    expect(await get(a.id)).toMatchObject({
      totalRoomVnd: ex.roomTotalVnd,
      depositRequiredVnd: ex.depositRequiredVnd,
    });
    expect(await cancelQuote(a, '2028-06-04')).toMatchObject({
      retainedVnd: ex.cancellationFeeVnd,
      refundableVnd: ex.refundVnd,
    });
    // b: the same edit, then an OTTIMO B7 that does not change the money → the same numbers.
    await at('2028-06-11T09:00:00+07:00');
    for (const d of ['2028-06-13', '2028-06-14']) await typeNight(b, d, price);
    expect((await get(b.id)).depositRequiredVnd).toBe(ex.depositRequiredVnd);
    const mv = await moveShown(b.id, {
      roomId: ids.rooms['101'] as string,
      reasonCode: 'property_fault',
    });
    expect(mv.res).toMatchObject({
      totalRoomVnd: ex.roomTotalVnd,
      depositRequiredVnd: ex.depositRequiredVnd,
    });
    expect(await cancelQuote(b, '2028-06-11')).toMatchObject({
      retainedVnd: ex.cancellationFeeVnd,
      refundableVnd: ex.refundVnd,
    });
    // n: no-show (BR-311, same base).
    await at('2028-06-18T09:00:00+07:00');
    for (const d of ['2028-06-20', '2028-06-21']) await typeNight(n, d, price);
    await at('2028-06-20T23:30:00+07:00');
    const ns = await act(n.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe máy' });
    expect(ns.statusCode, ns.body).toBe(200);
    expect(await sum(n.folioId, 'no_show_fee')).toBe(ex.noShowRetainedVnd);
    expect(await refundRequests(n)).toEqual([ex.refundVnd]);
  });

  it('BUG-R2-128: raised by S4-35 – 2 × 900.000: required 500.000, fee 500.000, refund 0; 2 × 1.000.000 with 700.000 paid: fee 600.000, refund 100.000', async () => {
    await at('2028-05-20T10:00:00+07:00');
    const a = await direct('201', '2028-06-27', '2028-06-29', 500_000);
    const b = await direct('201', '2028-07-04', '2028-07-06', 700_000);
    for (const d of ['2028-06-27', '2028-06-28']) await typeNight(a, d, 900_000);
    for (const d of ['2028-07-04', '2028-07-05']) await typeNight(b, d, 1_000_000);
    expect((await get(a.id)).depositRequiredVnd).toBe(500_000);
    expect((await get(b.id)).depositRequiredVnd).toBe(600_000);
    expect(await cancelQuote(a, '2028-06-25')).toMatchObject({
      retainedVnd: 500_000,
      refundableVnd: 0,
    });
    expect(await cancelQuote(b, '2028-07-02')).toMatchObject({
      retainedVnd: 600_000,
      refundableVnd: 100_000,
    });
  });

  it('BUG-R2-128 / BR-309-13 (hold): a price change on a hold moves the deposit it waits for – 2 × 1.000.000 → 600.000, then 2 × 540.000 → 300.000', async () => {
    const o = oracle('BR-309-13');
    const ex = o.expected.hold as Record<string, number>;
    await at('2028-06-20T10:00:00+07:00');
    const qt = await c.fd!.send('POST', url('/quotes'), {
      type: 'short',
      roomId: ids.rooms['201'],
      arrivalDate: '2028-07-11',
      nights: o.input.hold.nights,
      adults: 2,
      channelId: ids.channels.direct,
      guestId: guest,
    });
    expect(qt.statusCode, qt.body).toBe(201);
    const h = await c.fd!.send('POST', url(`/quotes/${qt.json().id}/actions/create-hold`), {
      holdHours: 48,
    });
    expect(h.statusCode, h.body).toBe(201);
    const hold = h.json() as { id: string; status: string };
    expect(hold.status).toBe('hold');
    const port = fa.app.get(StayNightPricingPort);
    const set = (serviceDate: string, unitPriceVnd: number) =>
      db.withContext(t.ctx(), (tx) =>
        port.setNightRate(tx, {
          reservationId: hold.id,
          serviceDate,
          category: 'room',
          unitPriceVnd,
          userId: t.users.mgr!.id,
          reason: 'Giá thỏa thuận với khách',
        }),
      );
    for (const d of ['2028-07-11', '2028-07-12']) await set(d, o.input.hold.nightVnd);
    expect((await get(hold.id)).depositRequiredVnd).toBe(ex.depositRequiredBeforeVnd);
    for (const d of ['2028-07-11', '2028-07-12']) await set(d, o.input.hold.editedNightVnd);
    expect(await get(hold.id)).toMatchObject({
      status: 'hold',
      depositRequiredVnd: ex.depositRequiredAfterVnd,
    });
  });

  it('BR-309-14 (S438R2-CANCEL-02): a level kept by a late guest shortening holds through later changes – 203: 7 → 2 nights (5 days), → 3 nights (3 days), OTTIMO room change: required 1.600.000 each time, fee 1.600.000', async () => {
    const o = oracle('BR-309-14');
    const steps = o.input.steps as Array<{ newStay?: string[]; roomTotalVnd: number }>;
    const req = o.expected.depositRequiredAfterEachStepVnd as number[];
    await at('2027-01-20T10:00:00+07:00');
    const b = await direct('203', o.input.stay[0], o.input.stay[1], o.input.depositPaidVnd);
    expect((await get(b.id)).totalRoomVnd).toBe(o.input.roomTotalVnd);
    await at('2027-02-17T10:00:00+07:00');
    const m1 = await moveShown(b.id, {
      departureDate: steps[0]!.newStay![1]!,
      reasonCode: 'guest_request',
    });
    expect(m1.res).toMatchObject({
      totalRoomVnd: steps[0]!.roomTotalVnd,
      depositRequiredVnd: req[0],
    });
    await at('2027-02-19T10:00:00+07:00');
    const m2 = await moveShown(b.id, {
      departureDate: steps[1]!.newStay![1]!,
      reasonCode: 'guest_request',
    });
    expect(m2.res).toMatchObject({
      totalRoomVnd: steps[1]!.roomTotalVnd,
      depositRequiredVnd: req[1],
    });
    const m3 = await moveShown(b.id, {
      roomId: ids.rooms['202'] as string,
      reasonCode: 'property_fault',
    });
    expect(m3.res).toMatchObject({
      totalRoomVnd: steps[2]!.roomTotalVnd,
      depositRequiredVnd: req[2],
    });
    expect(await cancelQuote(b, '2027-02-20')).toMatchObject({
      retainedVnd: o.expected.cancellationFeeVnd,
      refundableVnd: o.input.depositPaidVnd - o.expected.cancellationFeeVnd,
    });
  });

  // ───────────────────────────── BUG-R2-131 – check-in gate with a FOC on a room-change difference ─────────────────────────────

  const focOnDifference = async (b: Booking, date: string, amountVnd: number) => {
    const f = await c.fd!.send(
      'POST',
      url(
        `/folios/${b.folioId}/lines/${await lineId(b.folioId, 'room_change_difference', date)}/foc`,
      ),
      { kind: 'foc', amountVnd, reasonCode: 'service_recovery' },
    );
    expect(f.statusCode, f.body).toBe(201);
    const ap = await c.mgr!.send('POST', url(`/approval-requests/${f.json().id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
  };
  const gate = async (b: Booking, room: string, time: string, due: number) => {
    await ready(room);
    const pv = await checkInPreview(b, time);
    expect(pv.amountDueAtCheckinVnd).toBe(due);
    const no = await checkIn(b, { checkinTime: time });
    expect(no.statusCode, no.body).toBe(409);
    const ok = await checkIn(b, { checkinTime: time, ...pay(due) });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  };

  it('BUG-R2-131 (BR-402): Agoda 203 → 401 (guest), FOC 250.000 on the difference – after no-show + B12 the check-in asks 250.000; → 402 asks 208.000; 203 → 302 (FOC 125.000) → 401 asks 375.000; unpaid → 409', async () => {
    await at('2028-07-01T10:00:00+07:00');
    const p1 = await agoda('203', '2028-07-17', '2028-07-19', 1_600_000);
    const p2 = await agoda('203', '2028-07-24', '2028-07-26', 1_600_000);
    const p3 = await agoda('203', '2028-07-31', '2028-08-02', 1_600_000);
    // path 1: the FOC is suspended at no-show and re-applied at B12.
    await moveShown(p1.id, { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' });
    await focOnDifference(p1, '2028-07-17', 250_000);
    await at('2028-07-17T23:30:00+07:00');
    const ns = await act(p1.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe máy' });
    expect(ns.statusCode, ns.body).toBe(200);
    await at('2028-07-18T01:30:00+07:00');
    const rs = await act(p1.id, 'restore-no-show', { reason: 'Khách tới muộn, xe trễ' }, 'mgr');
    expect(rs.statusCode, rs.body).toBe(200);
    await at('2028-07-18T01:40:00+07:00');
    await gate(p1, '401', '01:40', 250_000);
    // path 2: the FOC follows the second move (208.000).
    await at('2028-07-10T10:00:00+07:00');
    await moveShown(p2.id, { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' });
    await focOnDifference(p2, '2028-07-24', 250_000);
    await moveShown(p2.id, { roomId: ids.rooms['402'] as string, reasonCode: 'guest_request' });
    await at('2028-07-24T14:00:00+07:00');
    await gate(p2, '402', '14:00', 208_000);
    // variant: 203 → 302 (125.000 a night), FOC 125.000, → 401 (250.000 a night): 500.000 − 125.000.
    await at('2028-07-20T10:00:00+07:00');
    await moveShown(p3.id, { roomId: ids.rooms['302'] as string, reasonCode: 'guest_request' });
    await focOnDifference(p3, '2028-07-31', 125_000);
    await moveShown(p3.id, { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' });
    await at('2028-07-31T14:00:00+07:00');
    await gate(p3, '401', '14:00', 375_000);
  });

  // ───────────────────────────── BR-424-07 – B14 stale amount at delta 0 ─────────────────────────────

  it('BR-424-07 (MOVE-06): B14 property_fault 202 → 203 with expectedDeltaVnd 119.000 while the delta is 0 → 409 SURCHARGE_CHANGED, nothing saved; with 0 → 200', async () => {
    const o = oracle('BR-424-07');
    await at('2028-06-20T10:00:00+07:00');
    const b = await direct('202', '2028-07-10', '2028-07-12', 500_000);
    await stayIn(b, o.input.roomNo, '2028-07-10');
    await at('2028-07-11T10:00:00+07:00');
    await ready(o.input.toRoomNo);
    const body = {
      newRoomId: ids.rooms[o.input.toRoomNo],
      effectiveDate: '2028-07-11',
      cause: o.input.cause,
      reason: 'Điều hòa hỏng',
    };
    const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json().folioDeltaVnd).toBe(o.input.folioDeltaVndAtWrite);
    const before = await get(b.id);
    const stale = await act(b.id, 'change-room', {
      ...body,
      expectedDeltaVnd: o.input.expectedDeltaVndSent,
    });
    expect(stale.statusCode, stale.body).toBe(o.expected.httpStatus);
    expect(stale.json().code).toBe(o.expected.code);
    const after = await get(b.id);
    expect(after.version).toBe(before.version);
    const rooms = await q<{ room_no: string }>(
      `SELECT rm.room_no FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
        WHERE s.reservation_id = $1 AND s.active ORDER BY s.from_date`,
      [b.id],
    );
    expect(rooms.map((r) => r.room_no)).toEqual([o.input.roomNo]);
    const ok = await act(b.id, 'change-room', { ...body, expectedDeltaVnd: 0 });
    expect(ok.statusCode, ok.body).toBe(200);
  });
});
