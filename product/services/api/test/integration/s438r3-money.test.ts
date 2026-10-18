/**
 * BE-A – S4-38 re-verification round 3 (commit 42fb458 findings, `s4-money-recheck3.md`; DOM BR v0.3.8 bổ sung
 * 18/10) on the real PostgreSQL through HTTP:
 * - BUG-R2-134 (BR-417-07, BR-429 (b1)): the agreed price belongs to the room where it was typed; a guest move →
 *   the new room's calendar; after an OTTIMO move min(what the guest bought, the room now); BR-105 clamp.
 * - BUG-R2-139 (BR-416-06): the night of the departure day cannot be sold → a late charge of one night (MGR+).
 * - BUG-R2-136 (BE-A part): B14 asks the minibar port for the old room's refill.
 * - Gaps: BR-110-17 (OTA child night base), BR-309-15 (late date move locks the refund tier), BR-309 (v) (no held
 *   level on a hold).
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { createHttpAdapter } from '../../src/http';
import { NoGuestAccessPort } from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskMinibarPort,
  type FrontdeskRegistrationPort,
  type MinibarCheckoutStatus,
} from '../../src/modules/frontdesk/public/ports';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../src/modules/reservations/public/sales-port';
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

/** FAKE receiving account (VietQR cap cases). */
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456781', accountName: 'OTTIMO TEST' };

/** B14 restock spy (BUG-R2-136, BE-A part): the minibar port of the desk, recording `onCheckedOut`. */
class SpyMinibarPort implements FrontdeskMinibarPort {
  readonly checkedOut: Array<{ reservationId: string; roomId: string }> = [];
  async checkoutStatus(): Promise<MinibarCheckoutStatus> {
    return { required: false, checked: true };
  }
  async onCheckedOut(_tx: unknown, reservationId: string, roomId: string): Promise<string | null> {
    this.checkedOut.push({ reservationId, roomId });
    return null;
  }
}
const minibar = new SpyMinibarPort();

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('S4-38 re-verification round 3 – money fixes (BE-A)', () => {
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
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, minibar),
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
    c.mgr!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'fdl');
    await setPassword(db, t, 'own');
    await setPassword(db, t, 'fd');
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
  const ready = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
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

  const agoda3 = (room: string, from: string, to: string, amount: number) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.agoda,
      adults: 3,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: amount,
      arrivalDate: from,
      departureDate: to,
    });
  const grossOn = async (b: Booking, date: string) =>
    Number(
      (
        await q<{ g: string }>(
          `SELECT room_revenue_gross_vnd::text AS g FROM stay_night
            WHERE reservation_id = $1 AND stay_date = $2 AND night_state <> 'void'`,
          [b.id, date],
        )
      )[0]?.g ?? NaN,
    );
  /** B14 by the desk: dry run, then the move with the amount shown (room made ready first). */
  const b14 = async (b: Booking, room: string, day: string, cause: string) => {
    await at(`${day}T10:00:00+07:00`);
    await ready(room);
    return changeRoomShown(b, room, day, cause);
  };
  /** B18 19:00 with the extra night at the suggested rate: summary = QR `check_out` cap = what B18 takes. */
  const b18Shown = async (b: Booking, day: string, rate: number) => {
    await at(`${day}T19:00:00+07:00`);
    const s = await summary(b);
    expect(s).toMatchObject({ extraNightRequired: true, extraNightDefaultRateVnd: rate });
    const due = s.amountDueAtCheckoutVnd as number;
    const cap = await qr(b, { purpose: 'check_out', amountVnd: due + 1 });
    expect(cap.statusCode, cap.body).toBe(422);
    expect(cap.json()).toMatchObject({ max: due });
    const out = await act(b.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: rate },
      ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    return due;
  };

  // ───────────────────────────── BUG-R2-134 – BR-417-07: the agreed price belongs to its room ─────────────────────────────

  it('BUG-R2-134 / BR-417-07: agreed 201 at 700.000, the guest asks 401 from 02/03 – B13 suggests and writes 1.042.000 (left untouched: `default`, ARC 16.18), "Giữ giá đơn" null; B18 Friday = 401 Friday, preview = QR cap = write', async () => {
    const o = oracle('BR-417-07');
    const want = o.expected.suggestedExtendNightVnd as Record<string, number>;
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('201', '2027-03-01', '2027-03-04', 600_000, {
      nightlyRates: typed('2027-03-01', 3, o.input.agreedNightVnd),
    });
    await stayIn(b, '201', '2027-03-01');
    await b14(b, o.input.toRoomNo, o.input.moveOn, 'guest_request');
    expect(await grossOn(b, '2027-03-02')).toBe(o.input.calendarVnd['401']);
    await at('2027-03-03T10:00:00+07:00');
    const opt = await options(b);
    expect(opt.currentBookingRateVnd).toBeNull();
    expect(opt.nights[0]).toMatchObject({
      date: o.input.extendNight,
      defaultRateVnd: want.guestRequest,
    });
    expect(opt.nights[0].defaultRateVnd).toBeGreaterThanOrEqual(opt.nights[0].floorVnd);
    const friday = opt.nights[1].defaultRateVnd as number;
    expect(friday).toBe(1_198_000); // 401 Friday: 1.042.000 × 1,15 (BR-104)
    // ARC 16.18 (vòng sửa 5): the Desk sends a price only when the cell was edited – a typed night (even at the
    // suggested number) would be the reference of the next added night (BR-417 appendix 5A, AN-23).
    const ext = await act(b.id, 'extend', {
      nights: 1,
      nightlyRates: [
        { date: o.input.extendNight, amountVnd: opt.nights[0].defaultRateVnd, edited: false },
      ],
    });
    expect(ext.statusCode, ext.body).toBe(200);
    expect(await grossOn(b, o.input.extendNight)).toBe(want.guestRequest);
    await b18Shown(b, '2027-03-05', friday);
    expect((await get(b.id)).totalRoomVnd).toBe(700_000 + 3 * 1_042_000 + friday);
  });

  it('BUG-R2-134: more guest moves in house – 302 at 1.000.000 → 101: B13 667.000, B18 Friday 767.000, total 3.768.000; 202 at 650.000 → 301: 958.000 / 1.102.000 / 4.626.000; 302 at 1.100.000 → 102: 750.000 / 863.000 / 4.213.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const cases = [
      {
        room: '302',
        to: '101',
        from: '2027-03-15',
        rate: 1_000_000,
        b13: 667_000,
        fri: 767_000,
        total: 3_768_000,
      },
      {
        room: '202',
        to: '301',
        from: '2027-06-07',
        rate: 650_000,
        b13: 958_000,
        fri: 1_102_000,
        total: 4_626_000,
      },
      {
        room: '302',
        to: '102',
        from: '2027-06-21',
        rate: 1_100_000,
        b13: 750_000,
        fri: 863_000,
        total: 4_213_000,
      },
    ];
    for (const k of cases) {
      await at('2026-10-20T10:00:00+07:00');
      const day = (n: number) => {
        const d = new Date(`${k.from}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 10);
      };
      const b = await direct(k.room, k.from, day(3), 1_000_000, {
        nightlyRates: typed(k.from, 3, k.rate),
      });
      await stayIn(b, k.room, k.from);
      await b14(b, k.to, day(1), 'guest_request');
      await at(`${day(2)}T10:00:00+07:00`);
      const opt = await options(b);
      expect(opt.currentBookingRateVnd).toBeNull();
      expect(opt.nights[0]).toMatchObject({ date: day(3), defaultRateVnd: k.b13 });
      expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
      expect(await grossOn(b, day(3))).toBe(k.b13);
      await b18Shown(b, day(4), k.fri);
      expect((await get(b.id)).totalRoomVnd).toBe(k.total);
    }
  });

  it('BUG-R2-134 controls: no move → the agreed 650.000 (BR-421-01); OTTIMO B14 to a dearer room → min(700.000, 402) = 700.000, kept for the next extension; OTTIMO to a cheaper room → min(1.000.000, 101) = 667.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const still = await direct('203', '2027-07-05', '2027-07-08', 500_000, {
      nightlyRates: typed('2027-07-05', 3, 650_000),
    });
    const fault = await direct('103', '2027-07-19', '2027-07-22', 700_000, {
      nightlyRates: typed('2027-07-19', 3, 700_000),
    });
    const cheaper = await direct('302', '2027-07-26', '2027-07-29', 900_000, {
      nightlyRates: typed('2027-07-26', 3, 1_000_000),
    });
    await stayIn(still, '203', '2027-07-05');
    await at('2027-07-07T10:00:00+07:00');
    const o1 = await options(still);
    expect(o1.currentBookingRateVnd).toBe(650_000);
    expect(o1.nights[0]).toMatchObject({ date: '2027-07-08', defaultRateVnd: 650_000 });
    // property_fault 103 → 402: the guest keeps the deal, never above 402's calendar.
    await stayIn(fault, '103', '2027-07-19');
    await b14(fault, '402', '2027-07-20', 'property_fault');
    await at('2027-07-21T10:00:00+07:00');
    const o2 = await options(fault);
    expect(o2.currentBookingRateVnd).toBe(700_000);
    expect(o2.nights[0]).toMatchObject({ date: '2027-07-22', defaultRateVnd: 700_000 });
    expect((await act(fault.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect(await grossOn(fault, '2027-07-22')).toBe(700_000);
    const o2b = await options(fault);
    expect(o2b.nights[0]).toMatchObject({ date: '2027-07-23', defaultRateVnd: 700_000 });
    // property_fault 302 → 101: min(1.000.000, 101's 667.000).
    await stayIn(cheaper, '302', '2027-07-26');
    await b14(cheaper, '101', '2027-07-27', 'property_fault');
    await at('2027-07-28T10:00:00+07:00');
    const o3 = await options(cheaper);
    expect(o3.nights[0]).toMatchObject({ date: '2027-07-29', defaultRateVnd: 667_000 });
    expect(o3.currentBookingRateVnd).toBe(667_000);
  });

  it('BR-429 (b1) bổ sung 18/10 (BUG-R2-134): a calendar booking OTTIMO put in a dearer room – B9a, B13 and B18 cost min(room bought, room now): 792.000 / 792.000 / Friday 911.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b9a = await direct('202', '2027-08-10', '2027-08-12', 500_000);
    const stay = await direct('202', '2027-08-02', '2027-08-05', 700_000);
    // B7 property_fault 202 → 401 before arrival, then B9a Mon 09/08.
    const mv = await moveShown(b9a.id, {
      roomId: ids.rooms['401'] as string,
      reasonCode: 'property_fault',
    });
    expect(mv.preview.folioDeltaVnd).toBe(0);
    const dueA = (await totals(b9a)).balanceDueVnd + 792_000;
    await b9aShown(b9a, '401', '2027-08-10', 792_000, dueA);
    // In house 202 → 401 (property_fault): B13 Thu 05/08, then B18 Fri 06/08.
    await stayIn(stay, '202', '2027-08-02');
    await b14(stay, '401', '2027-08-03', 'property_fault');
    await at('2027-08-04T10:00:00+07:00');
    const opt = await options(stay);
    // ARC 16.6 (a) rule 3: the OTTIMO min is the booking's price for a calendar booking too.
    expect(opt.currentBookingRateVnd).toBe(792_000);
    expect(opt.nights[0]).toMatchObject({ date: '2027-08-05', defaultRateVnd: 792_000 });
    expect((await act(stay.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect(await grossOn(stay, '2027-08-05')).toBe(792_000);
    await b18Shown(stay, '2027-08-06', 911_000);
    expect((await get(stay.id)).totalRoomVnd).toBe(4 * 792_000 + 911_000);
  });

  it('BR-429 (b1) bổ sung 18/10 (move planner): force_majeure postpone with OTTIMO room 401 → 202 – the new nights cost min(401, 202) = 202 calendar (1.584.000, not 401’s 2.084.000)', async () => {
    await at('2027-07-20T10:00:00+07:00');
    const b = await direct('401', '2027-09-07', '2027-09-09', 700_000);
    expect((await get(b.id)).totalRoomVnd).toBe(2_084_000);
    const mv = await moveShown(
      b.id,
      {
        roomId: ids.rooms['202'] as string,
        arrivalDate: '2027-11-09',
        departureDate: '2027-11-11',
        mode: 'postpone_instead_of_cancel',
        reasonCode: 'force_majeure',
        note: 'Đèo Prenn đóng – ảnh thông báo',
      },
      'mgr',
    );
    expect(mv.res.totalRoomVnd).toBe(1_584_000);
  });

  it('BR-417-10 (DOM 18/10, r3-1): Agoda self-assigned 203 moved by OTTIMO to 401 (B14 property_fault) – the direct child nights cost min(203, 401): B13 Wednesday 792.000, B18 Thursday 792.000 (preview = QR cap = write); a guest move to 401 → 1.042.000', async () => {
    const o = oracle('BR-417-10');
    const cal = o.input.calendarVnd as Record<string, number>;
    const agoda2 = (from: string, to: string) =>
      create({
        roomId: ids.rooms[o.input.bookedRoomNo],
        channelId: ids.channels.agoda,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_prepaid',
        otaRef: `AG${randomUUID().slice(0, 8)}`,
        otaRoomAmountVnd: 1_600_000,
        arrivalDate: from,
        departureDate: to,
      });
    await at('2028-09-01T10:00:00+07:00');
    const fault = await agoda2('2028-10-02', '2028-10-04');
    const guestMove = await agoda2('2028-10-09', '2028-10-11');
    await stayIn(fault, o.input.bookedRoomNo, '2028-10-02');
    await b14(fault, o.input.toRoomNo, '2028-10-03', o.input.moveReasonCode);
    await at('2028-10-03T11:00:00+07:00');
    const opt = await options(fault);
    expect(opt.nights[0]).toMatchObject({
      date: '2028-10-04',
      defaultRateVnd: o.expected.childNightDefaultVnd,
    });
    expect(Math.min(cal['203']!, cal['401']!)).toBe(o.expected.childNightDefaultVnd);
    const ext = await act(fault.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const child = (
      await q<{ g: string }>(
        `SELECT n.room_revenue_gross_vnd::text AS g FROM stay_night n JOIN reservation r ON r.id = n.reservation_id
          WHERE r.parent_reservation_id = $1 AND n.stay_date = '2028-10-04' AND n.night_state <> 'void'`,
        [fault.id],
      )
    )[0]?.g;
    expect(Number(child)).toBe(o.expected.childNightDefaultVnd);
    await b18Shown(fault, '2028-10-05', o.expected.childNightDefaultVnd);
    // control: the guest asked for 401 – its calendar.
    await stayIn(guestMove, o.input.bookedRoomNo, '2028-10-09');
    await b14(guestMove, o.input.toRoomNo, '2028-10-10', 'guest_request');
    await at('2028-10-10T11:00:00+07:00');
    const g = await options(guestMove);
    expect(g.nights[0]).toMatchObject({
      date: '2028-10-11',
      defaultRateVnd: o.expected.guestRequestMoveDefaultVnd,
    });
  });

  // ───────────────────────────── BUG-R2-139 – BR-416-06: the night of the departure day cannot be sold ─────────────────────────────

  it('BUG-R2-139 / BR-416-06: 203 leaves 19:00, the night is sold to an arrival – no night; summary = QR cap (lateFeeAsNight) = B18 = a late charge of one night 792.000, OWN/MGR confirms at the desk (same 401 for a wrong name / password / role), FOC 50 % → 396.000; control with the room free', async () => {
    const o = oracle('BR-416-06');
    const fee = o.expected.lateCheckoutFeeVnd as number;
    await at('2030-03-20T10:00:00+07:00');
    const b = await direct(o.input.roomNo, o.input.stay[0], o.input.stay[1], 500_000);
    await direct(o.input.roomNo, o.input.stay[1], '2030-04-19', 300_000);
    const self = await direct(o.input.roomNo, '2030-04-23', '2030-04-25', 500_000);
    await direct(o.input.roomNo, '2030-04-25', '2030-04-26', 300_000);
    const free = await direct('202', o.input.stay[0], o.input.stay[1], 500_000);
    await stayIn(b, o.input.roomNo, o.input.stay[0]);
    await stayIn(free, '202', o.input.stay[0]);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, paidVnd: o.input.paidVnd });
    await at(o.input.leftAt);
    const s = await summary(b);
    expect(s).toMatchObject({
      extraNightRequired: true,
      extraNightAvailable: false,
      lateFeeAsNightVnd: fee,
      amountDueAtCheckoutVnd: o.expected.amountDueAtCheckoutVnd,
      lateCheckoutSurcharge: { tierPct: 100, amountVnd: fee },
    });
    // The QR cap through the reservations port (BE-B passes `lateFeeAsNight` from createVietQr).
    const port = fa.app.get<ReservationSalesPort>(RESERVATION_SALES_PORT, { strict: false });
    const actor = { userId: t.users.fd!.id, roles: ['front_desk'] };
    const due = (more: Record<string, unknown>, now = false) =>
      db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, (tx) =>
        (now ? port.amountDueNowFor : port.amountDueFor).call(port, tx, {
          reservationId: b.id,
          purpose: 'check_out',
          actor,
          ...more,
        }),
      );
    expect(await due({ lateFeeAsNight: true })).toBe(o.expected.qrCheckOutMaxVnd);
    expect(await due({})).toBe(0);
    await expect(due({ extraNightRateVnd: o.input.departureNightVnd })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(await due({ lateFeeAsNight: true, extraNightRateVnd: 792_000 }, true)).toBe(fee);
    const viaHttp = await qr(b, { purpose: 'check_out', amountVnd: 1 });
    expect(viaHttp.statusCode, viaHttp.body).toBe(422);
    expect(viaHttp.json()).toMatchObject({ max: 0 });
    // B18 by the desk: the manager's credentials.
    const mgrName = t.users.mgr!.username;
    const lateFee = (more: Record<string, unknown> = {}) => ({
      checkoutTime: o.expected.recordedCheckoutTime,
      lateFeeInsteadOfNight: {
        amountVnd: fee,
        reason: 'Căn có khách đến, không dời được',
        approverUsername: mgrName,
        authMethod: 'password',
        secret: TEST_PASSWORD,
        ...more,
      },
    });
    const none = await act(b.id, 'check-out', { checkoutTime: '19:00' });
    expect(none.statusCode, none.body).toBe(422);
    expect(none.json().errors).toEqual([
      expect.objectContaining({
        field: 'lateFeeInsteadOfNight',
        code: 'LATE_CHECKOUT_AFTER_LIMIT',
      }),
    ]);
    const night = await act(b.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: o.input.departureNightVnd },
    });
    expect(night.statusCode, night.body).toBe(409);
    const noName = await act(b.id, 'check-out', lateFee({ approverUsername: undefined }));
    expect(noName.statusCode, noName.body).toBe(422);
    const pin = await act(b.id, 'check-out', lateFee({ authMethod: 'pin' }));
    expect(pin.statusCode, pin.body).toBe(422);
    expect(pin.json().errors).toEqual([
      { field: 'lateFeeInsteadOfNight.authMethod', code: 'NOT_IN_LIST' },
    ]);
    const counters = async () =>
      Object.fromEntries(
        (
          await q<{ id: string; n: number }>(
            `SELECT id::text AS id, approval_pin_failed_count AS n FROM app_user WHERE id = ANY($1::uuid[])`,
            [[t.users.fd!.id, t.users.mgr!.id]],
          )
        ).map((r) => [r.id === t.users.fd!.id ? 'fd' : 'mgr', Number(r.n)]),
      );
    // SEC BE-59/60: one 401 for a wrong password, an unknown name, a user without the role; the caller's counter
    // moves every time, the approver's only for its own wrong password.
    const tried = 'Sai-mat-khau-1';
    for (const wrong of [
      { secret: tried },
      { approverUsername: 'khong.co.ai' },
      { approverUsername: t.users.fd!.username },
    ]) {
      const r = await act(b.id, 'check-out', lateFee(wrong));
      expect(r.statusCode, r.body).toBe(401);
      expect(r.json()).toMatchObject({
        code: 'REAUTH_FAILED',
        errors: [{ field: 'lateFeeInsteadOfNight.secret', code: 'REAUTH_FAILED' }],
      });
      expect(r.body).not.toContain(tried);
    }
    expect(await counters()).toEqual({ fd: 3, mgr: 1 });
    // SEC BE-61: the password tried is nowhere – audit, idempotency record (and the Problem bodies above).
    const leaks = await q<{ n: number }>(
      `SELECT (SELECT count(*) FROM audit_event
                WHERE concat(before::text, after::text, reason) LIKE '%' || $1 || '%'
                   OR concat(before::text, after::text, reason) LIKE '%khong.co.ai%')::int
            + (SELECT count(*) FROM idempotency_key k WHERE row_to_json(k)::text LIKE '%' || $1 || '%')::int AS n`,
      [tried],
    );
    expect(leaks[0]!.n).toBe(0);
    const stale = await act(b.id, 'check-out', lateFee({ amountVnd: 700_000 }));
    expect(stale.statusCode, stale.body).toBe(409);
    expect(stale.json().code).toBe('SURCHARGE_CHANGED');
    const tooMuch = await act(b.id, 'check-out', {
      ...lateFee({ requestFoc: { amountVnd: fee + 1, reasonCode: 'service_recovery' } }),
    });
    expect(tooMuch.statusCode, tooMuch.body).toBe(422);
    const withSecret = await act(b.id, 'check-out', {
      ...lateFee({
        requestFoc: { amountVnd: 396_000, reasonCode: 'service_recovery', secret: 'x' },
      }),
    });
    expect(withSecret.statusCode, withSecret.body).toBe(422);
    const out = await act(b.id, 'check-out', {
      ...lateFee({ requestFoc: { amountVnd: 396_000, reasonCode: 'service_recovery' } }),
      finalPayment: { type: 'charge', method: 'cash', amountVnd: 396_000 },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await counters()).toEqual({ fd: 3, mgr: 0 });
    const told = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM staff_notification
        WHERE user_id = $1 AND kind = 'account_security_change' AND ref_id = $2`,
      [t.users.mgr!.id, b.id],
    );
    expect(told[0]!.n).toBe(1);
    const late = await q<{ a: string; code: string | null }>(
      `SELECT l.amount_vnd::text AS a, l.charge_code AS code FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'late_checkout' AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [b.folioId],
    );
    expect(late).toEqual([{ a: String(fee), code: 'late_fee_as_night' }]);
    expect(await sum(b.folioId, 'foc')).toBe(-396_000);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    expect(await get(b.id)).toMatchObject({
      status: 'checked_out',
      departureDate: o.input.stay[1],
      totalRoomVnd: o.input.paidVnd,
    });
    const audit = await q<{ actor: string; by: string; channel: string; method: string }>(
      `SELECT actor_user_id::text AS actor, after ->> 'confirmedBy' AS by, after ->> 'channel' AS channel,
              after ->> 'authMethod' AS method
         FROM audit_event WHERE entity_id = $1 AND action = 'reservation.late_fee_instead_of_night'`,
      [b.id],
    );
    expect(audit).toEqual([
      { actor: t.users.fd!.id, by: t.users.mgr!.id, channel: 'desk', method: 'password' },
    ]);
    const focApproval = await q<{ by: string; status: string }>(
      `SELECT approver_id::text AS by, status FROM approval_request WHERE target_id = $1 AND type = 'foc'`,
      [b.id],
    );
    expect(focApproval).toEqual([{ by: t.users.mgr!.id, status: 'approved' }]);
    // control: the same departure with the room free – the night is sold (summary = QR cap = B18).
    expect(await b18Shown(free, o.input.stay[1], o.input.departureNightVnd)).toBe(
      o.input.departureNightVnd,
    );
    expect((await get(free.id)).totalRoomVnd).toBe(2_376_000);
    // A manager doing B18 confirms with their own password (no name).
    await stayIn(self, o.input.roomNo, '2030-04-23');
    await at('2030-04-25T19:00:00+07:00');
    const own = await act(
      self.id,
      'check-out',
      {
        ...lateFee({ approverUsername: undefined }),
        finalPayment: { type: 'charge', method: 'cash', amountVnd: fee },
      },
      'mgr',
    );
    expect(own.statusCode, own.body).toBe(200);
  });

  // ───────────────────────────── BUG-R2-136 (BE-A part) – B14 refills the old room's minibar ─────────────────────────────

  it('BUG-R2-136 / BR-703-01 (BE-A part): B14 202 → 203 asks the minibar port for the old room’s refill (same port as B18) and is never blocked by it', async () => {
    await at('2028-06-20T10:00:00+07:00');
    const b = await direct('202', '2028-08-07', '2028-08-09', 500_000);
    await stayIn(b, '202', '2028-08-07');
    minibar.checkedOut.length = 0;
    await b14(b, '203', '2028-08-08', 'property_fault');
    expect(minibar.checkedOut).toEqual([{ reservationId: b.id, roomId: ids.rooms['202'] }]);
  });

  // ───────────────────────────── BR-110-17 – the direct child night of an OTA booking ─────────────────────────────

  it('BR-110-17: Agoda 302 for 3 adults (base 3) moved to 202 – B9a child night fee 0 after an OTTIMO move (protected base), 150.000 after a guest move; the OTA nights carry no fee', async () => {
    const o = oracle('BR-110-17');
    const fee = o.expected.b9aChildNightFeeVnd as Record<string, number>;
    await at('2028-07-01T10:00:00+07:00');
    const ottimo = await agoda3('302', '2028-08-15', '2028-08-17', 2_400_000);
    const guestMove = await agoda3('302', '2028-08-22', '2028-08-24', 2_400_000);
    await moveShown(ottimo.id, {
      roomId: ids.rooms['202'] as string,
      reasonCode: 'property_fault',
    });
    await moveShown(guestMove.id, {
      roomId: ids.rooms['202'] as string,
      reasonCode: 'guest_request',
    });
    for (const [b, day, key] of [
      [ottimo, '2028-08-15', 'ottimo'],
      [guestMove, '2028-08-22', 'guest'],
    ] as const) {
      await at(`${day}T04:30:00+07:00`);
      await ready('202');
      const pv = await checkInPreview(b);
      expect(pv.priorNight).toMatchObject({ available: true, createsChildReservation: true });
      const rate = pv.priorNight.defaultRateVnd as number;
      const ci = await checkIn(b, {
        addPriorNight: true,
        priorNightRateVnd: rate,
        expectedSurchargeVnd: rate,
        ...(pv.amountDueAtCheckinVnd > 0 ? pay(pv.amountDueAtCheckinVnd) : {}),
      });
      expect(ci.statusCode, ci.body).toBe(200);
      const prior = new Date(`${day}T00:00:00Z`);
      prior.setUTCDate(prior.getUTCDate() - 1);
      const priorDate = prior.toISOString().slice(0, 10);
      const feeLines = await lines(b.folioId, 'extra_person');
      expect(feeLines.filter(([d]) => d === priorDate).reduce((a, x) => a + x[1], 0)).toBe(
        fee[key],
      );
      expect(feeLines.filter(([d]) => d !== priorDate).reduce((a, x) => a + x[1], 0)).toBe(0);
    }
  });

  // ───────────────────────────── BR-309 (iv)/(v) bổ sung 18/10 ─────────────────────────────

  const cancelQuote = async (b: Booking, day: string) => {
    await at(`${day}T10:00:00+07:00`);
    const r = await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true });
    expect(r.statusCode, r.body).toBe(200);
    return r.json().cancellation as { retainedVnd: number; refundableVnd: number };
  };

  it('BR-309-15 (S438R3-GAP-Q1): a guest date move 5 days before the old arrival, then a cancellation 60 days ahead – refund 250.000 (the 50 % tier of the move), fee 250.000; a move ≥ 7 days ahead keeps 100 %', async () => {
    const o = oracle('BR-309-15');
    await at('2028-07-20T10:00:00+07:00');
    const late = await direct('203', '2028-08-22', '2028-08-24', o.input.depositPaidVnd);
    const early = await direct('203', '2028-09-26', '2028-09-28', o.input.depositPaidVnd);
    expect((await get(late.id)).depositRequiredVnd).toBe(o.input.depositRequiredVnd);
    await at('2028-08-17T10:00:00+07:00');
    await moveShown(late.id, {
      arrivalDate: '2028-10-17',
      departureDate: '2028-10-19',
      reasonCode: 'guest_request',
    });
    expect(await cancelQuote(late, '2028-08-18')).toMatchObject({
      refundableVnd: o.expected.refundVnd,
      retainedVnd: o.expected.feeVnd,
    });
    await at('2028-09-10T10:00:00+07:00');
    await moveShown(early.id, {
      arrivalDate: '2028-11-14',
      departureDate: '2028-11-16',
      reasonCode: 'guest_request',
    });
    expect(await cancelQuote(early, '2028-09-11')).toMatchObject({
      refundableVnd: o.input.depositPaidVnd,
      retainedVnd: 0,
    });
  });

  it('BR-309 example (DOM 18/10, Gaps (3)): 2 × 550.000 (500.000 is below the floor of 201) paid 1.000.000, one night 100 % special discount before arrival – value 550.000, required 300.000 → fee 300.000, refund 700.000', async () => {
    await at('2028-08-01T10:00:00+07:00');
    const b = await direct('201', '2028-09-04', '2028-09-06', 1_000_000, {
      nightlyRates: typed('2028-09-04', 2, 550_000),
    });
    expect(await get(b.id)).toMatchObject({ totalRoomVnd: 1_100_000, depositRequiredVnd: 300_000 });
    const line = (
      await q<{ id: string }>(
        `SELECT id FROM folio_line WHERE folio_id = $1 AND category = 'room' AND service_date = '2028-09-05'
            AND line_state = 'posted' AND reversal_of_id IS NULL`,
        [b.folioId],
      )
    )[0]!.id;
    const d = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${line}/foc`), {
      kind: 'special_discount',
      amountVnd: 550_000,
      reasonCode: 'service_recovery',
    });
    expect(d.statusCode, d.body).toBe(201);
    const ap = await c.own!.send('POST', url(`/approval-requests/${d.json().id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    expect(await cancelQuote(b, '2028-09-03')).toMatchObject({
      retainedVnd: 300_000,
      refundableVnd: 700_000,
    });
  });

  it('BR-309 (v) bổ sung 18/10: a hold has no held level – S4-35 on a hold always asks 30 % of the current room money (2 × 540.000 → 300.000)', async () => {
    await at('2028-08-20T10:00:00+07:00');
    const qt = await c.fd!.send('POST', url('/quotes'), {
      type: 'short',
      roomId: ids.rooms['201'],
      arrivalDate: '2028-09-12',
      nights: 2,
      adults: 2,
      channelId: ids.channels.direct,
      guestId: guest,
    });
    expect(qt.statusCode, qt.body).toBe(201);
    const h = await c.fd!.send('POST', url(`/quotes/${qt.json().id}/actions/create-hold`), {
      holdHours: 48,
    });
    expect(h.statusCode, h.body).toBe(201);
    const hold = h.json() as { id: string };
    // A held level that would have come from elsewhere is ignored on a hold.
    await q(
      `UPDATE reservation SET pricing_snapshot = pricing_snapshot || '{"depositHeldVnd": 600000}'::jsonb
        WHERE id = $1`,
      [hold.id],
    );
    const port = fa.app.get(StayNightPricingPort);
    for (const serviceDate of ['2028-09-12', '2028-09-13']) {
      await db.withContext(t.ctx(), (tx) =>
        port.setNightRate(tx, {
          reservationId: hold.id,
          serviceDate,
          category: 'room',
          unitPriceVnd: 540_000,
          userId: t.users.mgr!.id,
          reason: 'Giá thỏa thuận với khách',
        }),
      );
    }
    expect(await get(hold.id)).toMatchObject({ status: 'hold', depositRequiredVnd: 300_000 });
  });
});

describe('SEC BE-61: a secret at any depth never reaches the log', () => {
  it('lateFeeInsteadOfNight.secret and reauth.secret are masked, an error keeps its message', async () => {
    const lines: string[] = [];
    const logStream = new Writable({
      write(chunk: Buffer, _enc, cb) {
        lines.push(chunk.toString());
        cb();
      },
    });
    const app = createHttpAdapter({
      logLevel: 'info',
      trustProxy: false,
      logStream,
    }).getInstance() as unknown as {
      log: { info(o: Record<string, unknown>, msg: string): void };
      close(): Promise<unknown>;
    };
    app.log.info(
      {
        body: { lateFeeInsteadOfNight: { secret: 'Pw-Leak-1', reason: 'r' } },
        reauth: { secret: 'Pw-Leak-2' },
        err: new Error('boom-visible'),
      },
      'probe',
    );
    await app.close();
    const all = lines.join('');
    expect(all).toContain('probe');
    expect(all).toContain('boom-visible');
    expect(all).not.toContain('Pw-Leak');
  });
});
