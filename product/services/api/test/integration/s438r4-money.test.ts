/**
 * BE-A – S4-38 re-verification round 4 (commit 365486f findings, `s4-money-recheck4.md`; DOM/SEC 18/10) on the
 * real PostgreSQL through HTTP:
 * - BUG-R2-146 (SEC): an approver locked at login never confirms – the same 401 as every invalid account.
 * - BUG-R2-145: the OTTIMO min only after an OTTIMO move that follows the guest's last own move.
 * - BUG-R2-149/150/153/154/148: the BR-416-06 path (checks before the password, idempotent replay, the FOC
 *   approver, alerts, the BR-433 basis of the one-night charge).
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { requestHash } from '../../src/shared/http/unit-of-work';
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
  own2: ['owner'],
  mTemp: ['manager'],
  // BUG-R2-146 (SEC BE-59): one account per invalid state; BUG-R2-154: a desk user and a manager to lock.
  mDis: ['manager'],
  mHard: ['manager'],
  mMust: ['manager'],
  mMfa: ['manager'],
  mRev: ['manager'],
  mOther: ['manager'],
  fd4: ['front_desk'],
  mgr2: ['manager'],
};
const APPROVERS_TO_SET = [
  'mTemp',
  'mDis',
  'mHard',
  'mMust',
  'mMfa',
  'mRev',
  'mOther',
  'fd4',
  'mgr2',
];

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
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456782', accountName: 'OTTIMO TEST' };

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
  /** ARC 16.13/16.14 (BE-B port): what the inventory says, per reservation (empty = all counted). */
  readonly unchecked = new Map<
    string,
    Array<{
      roomId: string;
      roomNo: string;
      reason?: 'never_counted' | 'stay_continued' | 'new_fill';
    }>
  >();
  readonly continued: Array<{ reservationId: string; roomId: string; reason: string }> = [];
  async uncheckedRooms(_tx: unknown, reservationId: string) {
    return this.unchecked.get(reservationId) ?? [];
  }
  async onStayContinued(
    _tx: unknown,
    reservationId: string,
    roomId: string,
    reason: 'room_entered' | 'extended',
  ): Promise<void> {
    this.continued.push({ reservationId, roomId, reason });
  }
}
const minibar = new SpyMinibarPort();

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('S4-38 re-verification round 4 – money fixes (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES, properties: 2 });
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
    c.fd4!.deviceToken = token;
    c.mgr!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'fdl');
    await setPassword(db, t, 'own');
    await setPassword(db, t, 'fd');
    for (const u of APPROVERS_TO_SET) await setPassword(db, t, u);
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

  // ───────────────────────────── BUG-R2-146 – an approver locked at login ─────────────────────────────

  const counter = async (user: string) =>
    Number(
      (
        await q<{ n: number }>(
          'SELECT approval_pin_failed_count AS n FROM app_user WHERE id = $1',
          [t.users[user]!.id],
        )
      )[0]!.n,
    );
  const lateFeeBody = (
    fee: number,
    more: Record<string, unknown> = {},
    extra: Record<string, unknown> = {},
  ) => ({
    checkoutTime: '19:00',
    lateFeeInsteadOfNight: {
      amountVnd: fee,
      reason: 'Căn có khách đến, không dời được',
      authMethod: 'password',
      secret: TEST_PASSWORD,
      ...more,
    },
    ...extra,
  });
  const withoutRequestId = (b: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(b).filter(([k]) => k !== 'requestId'));

  // ───────────────────────────── BUG-R2-145 – the room bought after the guest's own move ─────────────────────────────

  const plus = (d: string, n: number) => {
    const x = new Date(`${d}T00:00:00Z`);
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
  };
  /**
   * S4-09: Agoda 202 Mon–Wed, B13 2 child nights (Wed, Thu) in 202; Tue a B14 to `to` until the OTA departure
   * (`to` sold from Wed), the return recorded Wed; options Thu; B18 Fri 19:00 (the added night = Fri). `blockFri` =
   * 202 sold from Fri (BR-416-06 path, confirmed by the manager).
   */
  const s409 = async (
    mon: string,
    to: string | null,
    cause: 'guest_request' | 'property_fault',
    blockFri = false,
  ) => {
    await at(`${plus(mon, -40)}T09:00:00+07:00`);
    const ota = await create({
      roomId: ids.rooms['202'],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: 1_600_000,
      arrivalDate: mon,
      departureDate: plus(mon, 2),
    });
    if (to) await direct(to, plus(mon, 2), plus(mon, 6), 900_000);
    if (blockFri) await direct('202', plus(mon, 4), plus(mon, 6), 600_000);
    await stayIn(ota, '202', mon);
    await at(`${mon}T18:00:00+07:00`);
    expect((await act(ota.id, 'extend', { nights: 2 })).statusCode).toBe(200);
    const child = (
      await q<{ id: string }>('SELECT id FROM reservation WHERE parent_reservation_id = $1', [
        ota.id,
      ])
    )[0]!.id;
    if (to) {
      const tue = plus(mon, 1);
      await at(`${tue}T10:00:00+07:00`);
      await ready(to);
      const body = {
        newRoomId: ids.rooms[to],
        effectiveDate: tue,
        cause,
        reason: 'Khách muốn đổi căn',
        stayScope: 'until_parent_departure',
      };
      const dry = await act(ota.id, 'change-room', { ...body, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      // OTA guest move: the difference vs the origin room (101 cheaper → 0; 302 → 125.000), shown then saved.
      const mv = await act(ota.id, 'change-room', {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: dry.json().folioDeltaVnd,
      });
      expect(mv.statusCode, mv.body).toBe(200);
      await at(`${plus(mon, 2)}T10:00:00+07:00`);
      await ready('202');
      const back = await c.fd!.send(
        'PATCH',
        url(`/reservations/${child}`),
        { roomReturnRecorded: true },
        { 'if-match': `"${(await get(child)).version}"` },
      );
      expect(back.statusCode, back.body).toBe(200);
    }
    await at(`${plus(mon, 3)}T10:00:00+07:00`);
    const opt = await options(ota);
    const fri = plus(mon, 4);
    await at(`${fri}T19:00:00+07:00`);
    const s = await summary(ota);
    return { ota, opt, s, fri };
  };
  const childNight = async (ota: Booking, date: string) =>
    Number(
      (
        await q<{ g: string }>(
          `SELECT n.room_revenue_gross_vnd::text AS g FROM stay_night n JOIN reservation r ON r.id = n.reservation_id
            WHERE r.parent_reservation_id = $1 AND n.stay_date = $2 AND n.night_state <> 'void'`,
          [ota.id, date],
        )
      )[0]?.g ?? NaN,
    );

  it('BUG-R2-145 (BR-417, S4-09): Agoda 202 + 2 child nights, the guest asks 101 until the OTA departure and comes back – the Friday added night is 202’s 911.000 (not min with 101 = 767.000), keep null; B18 = QR cap = write; total 4.095.000', async () => {
    const r = await s409('2028-07-03', '101', 'guest_request');
    expect(r.opt.currentBookingRateVnd).toBeNull();
    expect(r.opt.nights[0]).toMatchObject({ date: r.fri, defaultRateVnd: 911_000 });
    expect(await b18Shown(r.ota, r.fri, 911_000)).toBeGreaterThan(0);
    expect(await childNight(r.ota, r.fri)).toBe(911_000);
    expect((await totals(r.ota)).totalVnd).toBe(4_095_000);
  });

  it('BUG-R2-145: same with a dearer room (302) – 911.000, keep null; control OTTIMO (property_fault) to 101 and back – 911.000', async () => {
    const dear = await s409('2028-07-31', '302', 'guest_request');
    expect(dear.opt.currentBookingRateVnd).toBeNull();
    expect(dear.opt.nights[0]).toMatchObject({ date: dear.fri, defaultRateVnd: 911_000 });
    expect(dear.s.extraNightDefaultRateVnd).toBe(911_000);
    const fault = await s409('2028-07-17', '101', 'property_fault');
    expect(fault.opt.nights[0]).toMatchObject({ date: fault.fri, defaultRateVnd: 911_000 });
    expect(fault.s.extraNightDefaultRateVnd).toBe(911_000);
  });

  it('BUG-R2-145 / BR-416-06: as the main case but 202 sold from Friday – lateFeeAsNightVnd = QR cap (lateFeeAsNight) = the line written = 911.000', async () => {
    const r = await s409('2028-08-14', '101', 'guest_request', true);
    expect(r.s).toMatchObject({ extraNightAvailable: false, lateFeeAsNightVnd: 911_000 });
    const due = r.s.amountDueAtCheckoutVnd as number;
    const out = await act(
      r.ota.id,
      'check-out',
      lateFeeBody(
        911_000,
        { approverUsername: t.users.mgr!.username },
        {
          ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
        },
      ),
    );
    expect(out.statusCode, out.body).toBe(200);
    const late = await q<{ a: string }>(
      `SELECT amount_vnd::text AS a FROM folio_line WHERE folio_id = $1 AND charge_code = 'late_fee_as_night'
          AND reversal_of_id IS NULL`,
      [r.ota.folioId],
    );
    expect(late.map((x) => Number(x.a))).toEqual([911_000]);
    expect(await totals(r.ota)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BUG-R2-146 (SEC BE-59): a manager locked at login (`locked_until` 2031) with the right password → the same 401 as an unknown name, nothing written, caller +1 / approver +0; the eligible manager → 200, FOC 396.000, folio 1.980.000', async () => {
    await at('2029-12-01T10:00:00+07:00');
    const b = await direct('203', '2030-01-15', '2030-01-17', 500_000);
    await direct('203', '2030-01-17', '2030-01-18', 300_000);
    await q("UPDATE app_user SET locked_until = '2031-01-01T00:00:00Z' WHERE id = $1", [
      t.users.mTemp!.id,
    ]);
    await stayIn(b, '203', '2030-01-15');
    await at('2030-01-17T19:00:00+07:00');
    const fee = (await summary(b)).lateFeeAsNightVnd as number;
    expect(fee).toBe(792_000);
    const pay = { finalPayment: { type: 'charge', method: 'cash', amountVnd: 396_000 } };
    const foc = { requestFoc: { amountVnd: 396_000, reasonCode: 'service_recovery' } };
    const fd0 = await counter('fd');
    const locked = await act(
      b.id,
      'check-out',
      lateFeeBody(fee, { approverUsername: t.users.mTemp!.username, ...foc }, pay),
    );
    expect(locked.statusCode, locked.body).toBe(401);
    const unknown = await act(
      b.id,
      'check-out',
      lateFeeBody(fee, { approverUsername: 'khong.co.ai', ...foc }, pay),
    );
    expect(unknown.statusCode, unknown.body).toBe(401);
    expect(withoutRequestId(locked.json())).toEqual(withoutRequestId(unknown.json()));
    expect(locked.json()).toMatchObject({
      code: 'REAUTH_FAILED',
      errors: [{ field: 'lateFeeInsteadOfNight.secret', code: 'REAUTH_FAILED' }],
    });
    const noPay = await act(
      b.id,
      'check-out',
      lateFeeBody(fee, { approverUsername: t.users.mTemp!.username }),
    );
    expect(noPay.statusCode, noPay.body).toBe(401);
    expect(await get(b.id)).toMatchObject({ status: 'in_house' });
    expect(await q('SELECT 1 FROM approval_request WHERE target_id = $1', [b.id])).toEqual([]);
    expect(
      await q(
        "SELECT 1 FROM audit_event WHERE entity_id = $1 AND action = 'reservation.late_fee_instead_of_night'",
        [b.id],
      ),
    ).toEqual([]);
    expect(await counter('fd')).toBe(fd0 + 3);
    expect(await counter('mTemp')).toBe(0);
    const ok = await act(
      b.id,
      'check-out',
      lateFeeBody(fee, { approverUsername: t.users.mgr!.username, ...foc }, pay),
    );
    expect(ok.statusCode, ok.body).toBe(200);
    expect(await sum(b.folioId, 'foc')).toBe(-396_000);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0, totalVnd: 1_980_000 });
  });

  it('BUG-R2-146 (SEC BE-59, 6 more states): disabled, hard-locked, must change password, MFA, a manager of another property, a revoked role – all the same 401 as an unknown name, right password, nothing counted for them', async () => {
    await at('2029-12-01T10:00:00+07:00');
    const b = await direct('201', '2030-02-12', '2030-02-14', 500_000);
    await direct('201', '2030-02-14', '2030-02-15', 300_000);
    const id = (u: string) => t.users[u]!.id;
    await q("UPDATE app_user SET status = 'disabled' WHERE id = $1", [id('mDis')]);
    await q("UPDATE app_user SET status = 'locked' WHERE id = $1", [id('mHard')]);
    await q('UPDATE app_user SET must_change_password = true WHERE id = $1', [id('mMust')]);
    await q(
      "UPDATE app_user SET mfa_enabled = true, mfa_secret_enc = '\\x00'::bytea WHERE id = $1",
      [id('mMfa')],
    );
    await q('UPDATE user_property_role SET revoked_at = $2 WHERE user_id = $1', [
      id('mRev'),
      new Date('2029-12-01T00:00:00Z'),
    ]);
    await q('UPDATE user_property_role SET revoked_at = $2 WHERE user_id = $1', [
      id('mOther'),
      new Date('2029-12-01T00:00:00Z'),
    ]);
    await db.withContext(t.ctx(1), (tx) =>
      tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
         VALUES ($1, $2, $3, 'manager', $4)`,
        [id('mOther'), t.propertyIds[1], t.organizationId, new Date('2029-12-01T00:00:00Z')],
      ),
    );
    await stayIn(b, '201', '2030-02-12');
    await at('2030-02-14T19:00:00+07:00');
    const fee = (await summary(b)).lateFeeAsNightVnd as number;
    await q(
      'UPDATE app_user SET approval_pin_failed_count = 0, approval_pin_locked_until = NULL WHERE id = $1',
      [t.users.fd!.id],
    );
    const reference = await act(
      b.id,
      'check-out',
      lateFeeBody(fee, { approverUsername: 'khong.co.ai' }),
    );
    expect(reference.statusCode, reference.body).toBe(401);
    for (const u of ['mDis', 'mHard', 'mMust', 'mMfa', 'mRev', 'mOther']) {
      // The caller's own counter would lock it after 5 failures (SEC BE-60) – reset between the probes.
      await q(
        'UPDATE app_user SET approval_pin_failed_count = 0, approval_pin_locked_until = NULL WHERE id = $1',
        [t.users.fd!.id],
      );
      const r = await act(
        b.id,
        'check-out',
        lateFeeBody(fee, { approverUsername: t.users[u]!.username }),
      );
      expect(r.statusCode, `${u}: ${r.body}`).toBe(401);
      expect(withoutRequestId(r.json()), u).toEqual(withoutRequestId(reference.json()));
      expect(await counter(u), u).toBe(0);
    }
    expect(await get(b.id)).toMatchObject({ status: 'in_house' });
  });

  // ───────────────────────────── BUG-R2-149 – every check before the password ─────────────────────────────

  it('BUG-R2-149 (SEC BE-64): mid-stay 10:00 without checkoutTime – wrong and right password both 422 checkoutTime REQUIRED; amountVnd missing 422; kind special_discount 422 NOT_IN_LIST; requestFoc.secret 422 NOT_ALLOWED; 19:00 before the departure day 409 – counters 0/0', async () => {
    await at('2029-12-01T10:00:00+07:00');
    const b = await direct('202', '2030-02-19', '2030-02-21', 500_000);
    await direct('202', '2030-02-21', '2030-02-22', 300_000);
    await stayIn(b, '202', '2030-02-19');
    await at('2030-02-20T10:00:00+07:00');
    const fd0 = await counter('fd');
    const mgr0 = await counter('mgr');
    const name = { approverUsername: t.users.mgr!.username };
    const noTime = (more: Record<string, unknown>) => {
      const x = lateFeeBody(792_000, { ...name, ...more }) as Record<string, unknown>;
      delete x.checkoutTime;
      return x;
    };
    for (const secret of ['Sai-mat-khau-9', TEST_PASSWORD]) {
      const r = await act(b.id, 'check-out', noTime({ secret }));
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toEqual([{ field: 'checkoutTime', code: 'REQUIRED' }]);
    }
    const noAmount = await act(
      b.id,
      'check-out',
      lateFeeBody(792_000, { ...name, amountVnd: undefined }),
    );
    expect(noAmount.statusCode, noAmount.body).toBe(422);
    expect(noAmount.json().errors).toEqual([
      expect.objectContaining({ field: 'lateFeeInsteadOfNight.amountVnd' }),
    ]);
    const kind = await act(
      b.id,
      'check-out',
      lateFeeBody(792_000, {
        ...name,
        requestFoc: {
          kind: 'special_discount',
          amountVnd: 100_000,
          reasonCode: 'service_recovery',
        },
      }),
    );
    expect(kind.statusCode, kind.body).toBe(422);
    expect(kind.json().errors).toEqual([
      { field: 'lateFeeInsteadOfNight.requestFoc.kind', code: 'NOT_IN_LIST' },
    ]);
    const secretFoc = await act(
      b.id,
      'check-out',
      lateFeeBody(792_000, {
        ...name,
        requestFoc: { amountVnd: 100_000, reasonCode: 'service_recovery', secret: 'x' },
      }),
    );
    expect(secretFoc.statusCode, secretFoc.body).toBe(422);
    expect(secretFoc.json().errors).toEqual([
      { field: 'lateFeeInsteadOfNight.requestFoc.secret', code: 'NOT_ALLOWED' },
    ]);
    const early = await act(b.id, 'check-out', lateFeeBody(792_000, name));
    expect(early.statusCode, early.body).toBe(409);
    expect(await counter('fd')).toBe(fd0);
    expect(await counter('mgr')).toBe(mgr0);
  });

  // ───────────────────────────── BUG-R2-150 – a completed key answers first ─────────────────────────────

  it('BUG-R2-150 (ARC 16.13 step 0, SEC mục 9): B18 lateFee + cash 792.000 → 200; the same key again (even a wrong password) → 200 replayed, nothing counted or written; another amount → 422 IDEMPOTENCY_KEY_REUSED; another desk user → 409 at the read-only step; a plain B18 replays unchanged', async () => {
    await at('2030-03-20T10:00:00+07:00');
    const b = await direct('203', '2030-04-16', '2030-04-18', 500_000);
    await direct('203', '2030-04-18', '2030-04-19', 300_000);
    const plain = await direct('202', '2030-04-16', '2030-04-18', 500_000);
    await stayIn(b, '203', '2030-04-16');
    await stayIn(plain, '202', '2030-04-16');
    await at('2030-04-18T19:00:00+07:00');
    const key = randomUUID();
    const body = lateFeeBody(
      792_000,
      { approverUsername: t.users.mgr!.username },
      { finalPayment: { type: 'charge', method: 'cash', amountVnd: 792_000 } },
    );
    const send = async (who: string, k: string, payload: Record<string, unknown>) =>
      c[who]!.send('POST', url(`/reservations/${b.id}/actions/check-out`), payload, {
        'idempotency-key': k,
        'if-match': `"${(await get(b.id)).version}"`,
      });
    const first = await send('fd', key, body);
    expect(first.statusCode, first.body).toBe(200);
    const fd0 = await counter('fd');
    const mgr0 = await counter('mgr');
    const audits = async () =>
      (await q('SELECT 1 FROM audit_event WHERE entity_id = $1', [b.id])).length;
    const a0 = await audits();
    const again = await send('fd', key, body);
    expect(again.statusCode, again.body).toBe(200);
    expect(again.headers['idempotent-replayed']).toBe('true');
    const wrong = await send('fd', key, {
      ...body,
      lateFeeInsteadOfNight: {
        ...(body.lateFeeInsteadOfNight as object),
        secret: 'Sai-mat-khau-7',
      },
    });
    expect(wrong.statusCode, wrong.body).toBe(200);
    expect(wrong.headers['idempotent-replayed']).toBe('true');
    const other = await send('fd', key, {
      ...body,
      lateFeeInsteadOfNight: { ...(body.lateFeeInsteadOfNight as object), amountVnd: 700_000 },
    });
    expect(other.statusCode, other.body).toBe(422);
    expect(other.json().code).toBe('IDEMPOTENCY_KEY_REUSED');
    const fd4 = await send('fd4', key, body);
    expect(fd4.statusCode, fd4.body).toBe(409);
    expect(fd4.json().code).toBe('INVALID_TRANSITION');
    expect(await counter('fd')).toBe(fd0);
    expect(await counter('fd4')).toBe(0);
    expect(await counter('mgr')).toBe(mgr0);
    expect(await audits()).toBe(a0);
    expect(await totals(b)).toMatchObject({ totalVnd: 2_376_000, balanceDueVnd: 0, creditVnd: 0 });
    const told = await q(
      `SELECT 1 FROM staff_notification WHERE user_id = $1 AND kind = 'account_security_change' AND ref_id = $2`,
      [t.users.mgr!.id, b.id],
    );
    expect(told.length).toBe(1);
    // A plain B18 (the extra night is sellable here) replays unchanged.
    const pkey = randomUUID();
    const pbody = {
      checkoutTime: '19:00',
      extraNight: { rateVnd: 792_000 },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: 792_000 },
    };
    const ifMatch = `"${(await get(plain.id)).version}"`;
    const p1 = await c.fd!.send('POST', url(`/reservations/${plain.id}/actions/check-out`), pbody, {
      'idempotency-key': pkey,
      'if-match': ifMatch,
    });
    expect(p1.statusCode, p1.body).toBe(200);
    const p2 = await c.fd!.send('POST', url(`/reservations/${plain.id}/actions/check-out`), pbody, {
      'idempotency-key': pkey,
      'if-match': ifMatch,
    });
    expect(p2.statusCode, p2.body).toBe(200);
    expect(p2.headers['idempotent-replayed']).toBe('true');
  });

  // ───────────────────────────── BUG-R2-153 / BUG-R2-148 / BR-416-07 – the FOC of the one-night charge ─────────────────────────────

  const foc = (b: Booking) =>
    q<{ by: string; role: string; method: string; status: string; amount: string }>(
      `SELECT approver_id::text AS by, approver_role_snapshot AS role, auth_method AS method, status,
              amount_vnd::text AS amount
         FROM approval_request WHERE target_id = $1 AND type = 'foc'`,
      [b.id],
    );

  it('BUG-R2-153 / BR-416-07: a manager calls, the owner confirms, FOC 200.000 – approved by the OWNER (role owner, password), cash 592.000 → 0/0; audit approverRole owner, no username', async () => {
    const o = oracle('BR-416-07');
    await at('2029-12-01T10:00:00+07:00');
    const b = await direct('203', '2030-01-29', '2030-01-31', 500_000);
    await direct('203', '2030-01-31', '2030-02-01', 300_000);
    await stayIn(b, '203', '2030-01-29');
    await at('2030-01-31T19:00:00+07:00');
    const out = await act(
      b.id,
      'check-out',
      lateFeeBody(
        792_000,
        {
          approverUsername: t.users.own!.username,
          requestFoc: { amountVnd: 200_000, reasonCode: 'service_recovery' },
        },
        { finalPayment: { type: 'charge', method: 'cash', amountVnd: 592_000 } },
      ),
      'mgr',
    );
    expect(out.statusCode, out.body).toBe(200);
    expect(await foc(b)).toEqual([
      {
        by: t.users.own!.id,
        role: o.expected.ownConfirms.approverRole,
        method: o.expected.ownConfirms.authMethod,
        status: 'approved',
        amount: '200000',
      },
    ]);
    const audit = await q<{ role: string; name: string | null }>(
      `SELECT after ->> 'approverRole' AS role, after ->> 'confirmedByUsername' AS name FROM audit_event
        WHERE entity_id = $1 AND action = 'reservation.late_fee_instead_of_night'`,
      [b.id],
    );
    expect(audit).toEqual([{ role: 'owner', name: null }]);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BUG-R2-148 / BR-416-07: the BR-433 basis of the one-night charge is the charge – a manager confirming their own B18 waives 911.000 (Friday) and 1.030.000 (Giỗ Tổ) in full → 200, due 0, approved by the manager with a password', async () => {
    const o = oracle('BR-416-07');
    await at('2030-08-20T10:00:00+07:00');
    const fri = await direct('203', o.input.stay[0], o.input.stay[1], 500_000);
    await direct('203', o.input.stay[1], '2030-09-22', 500_000);
    await stayIn(fri, '203', o.input.stay[0]);
    await at(`${o.input.stay[1]}T19:00:00+07:00`);
    const s1 = await summary(fri);
    expect(s1.lateFeeAsNightVnd).toBe(o.input.lateFeeAsNightVnd);
    const out = await act(
      fri.id,
      'check-out',
      lateFeeBody(o.input.lateFeeAsNightVnd, {
        requestFoc: { amountVnd: o.input.lateFeeAsNightVnd, reasonCode: 'service_recovery' },
      }),
      'mgr',
    );
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(fri)).toMatchObject({ balanceDueVnd: o.expected.mgrWaivesAll.dueVnd });
    expect(await foc(fri)).toEqual([
      expect.objectContaining({ by: t.users.mgr!.id, role: 'manager', method: 'password' }),
    ]);
    await at('2027-03-01T10:00:00+07:00');
    const gio = await direct('203', '2027-04-14', '2027-04-16', 500_000);
    await direct('203', '2027-04-16', '2027-04-18', 600_000);
    await stayIn(gio, '203', '2027-04-14');
    await at('2027-04-16T19:00:00+07:00');
    const s2 = await summary(gio);
    expect(s2.lateFeeAsNightVnd).toBe(1_030_000);
    const out2 = await act(
      gio.id,
      'check-out',
      lateFeeBody(1_030_000, {
        requestFoc: { amountVnd: 1_030_000, reasonCode: 'service_recovery' },
      }),
      'mgr',
    );
    expect(out2.statusCode, out2.body).toBe(200);
    expect(await totals(gio)).toMatchObject({ balanceDueVnd: 0 });
  });

  // ───────────────────────────── BUG-R2-154 – who hears of a lock ─────────────────────────────

  it('BUG-R2-154 (SEC BE-62): a desk user types a wrong password 5 times for a manager – both locked; security_alert to the manager, the desk user and every owner; then 429', async () => {
    await at('2029-12-01T10:00:00+07:00');
    const b = await direct('301', '2030-03-05', '2030-03-07', 600_000);
    await direct('301', '2030-03-07', '2030-03-08', 400_000);
    await stayIn(b, '301', '2030-03-05');
    await at('2030-03-07T19:00:00+07:00');
    const fee = (await summary(b)).lateFeeAsNightVnd as number;
    // BUG-R2-165 (SEC 12.1 (3)): If-Match is checked before the password – the current version.
    const ifMatch = `"${(await get(b.id)).version}"`;
    const wrongTry = () =>
      c.fd4!.send(
        'POST',
        url(`/reservations/${b.id}/actions/check-out`),
        lateFeeBody(fee, { approverUsername: t.users.mgr2!.username, secret: 'Sai-mat-khau-5' }),
        { 'if-match': ifMatch },
      );
    for (let i = 0; i < 5; i += 1) {
      const r = await wrongTry();
      expect(r.statusCode, r.body).toBe(401);
    }
    const alerts = await q<{ u: string }>(
      `SELECT user_id::text AS u FROM staff_notification WHERE kind = 'security_alert'`,
    );
    const told = new Set(alerts.map((a) => a.u));
    for (const u of ['mgr2', 'fd4', 'own', 'own2']) expect(told.has(t.users[u]!.id), u).toBe(true);
    const locked = await wrongTry();
    expect(locked.statusCode, locked.body).toBe(429);
  });

  // ───────────────────────────── DOM 18/10 – BR-417-12, BR-417-13, BR-309-16 ─────────────────────────────

  it('BR-417-12 (T15): agreed 202 at 650.000, B13 onto Giỗ Tổ (a calendar night), then B18 Saturday – the special night is skipped: 650.000 (not 911.000), preview = QR cap = write', async () => {
    const o = oracle('BR-417-12');
    await at('2027-03-01T10:00:00+07:00');
    const b = await direct('202', '2027-04-14', '2027-04-16', 400_000, {
      nightlyRates: typed('2027-04-14', 2, o.input.agreedNightVnd),
    });
    await stayIn(b, '202', '2027-04-14');
    await at('2027-04-15T10:00:00+07:00');
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect(await b18Shown(b, '2027-04-17', o.expected.b18SuggestedVnd)).toBeGreaterThan(0);
  });

  it('BR-417-13 (T19, T1/T2): a calendar booking in 101 moved by OTTIMO to 401 – the added night is 667.000 (101’s bounds), not 401’s floor 740.000: B13 and the B7 preview alike', async () => {
    const o = oracle('BR-417-13');
    await at('2028-09-20T10:00:00+07:00');
    const inHouse = await direct(o.input.boughtRoomNo, '2028-10-16', '2028-10-18', 400_000);
    const before = await direct(o.input.boughtRoomNo, '2028-10-23', '2028-10-25', 400_000);
    await stayIn(inHouse, o.input.boughtRoomNo, '2028-10-16');
    await b14(inHouse, o.input.currentRoomNo, '2028-10-17', o.input.reasonCode);
    await at('2028-10-17T11:00:00+07:00');
    const opt = await options(inHouse);
    expect(opt.nights[0]).toMatchObject({
      date: '2028-10-18',
      defaultRateVnd: o.expected.addedNightVnd,
    });
    // DOM 18/10: the desk's bounds span both rooms ONLY when the min applies (here: 667.000 is writable).
    expect(opt.nights[0].floorVnd).toBeLessThanOrEqual(o.expected.addedNightVnd);
    expect(opt.nights[0].floorVnd).toBeLessThan(o.input.currentFloorVnd);
    expect((await act(inHouse.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect(await grossOn(inHouse, '2028-10-18')).toBe(o.expected.addedNightVnd);
    await at('2028-09-21T10:00:00+07:00');
    const mv = await moveShown(before.id, {
      roomId: ids.rooms[o.input.currentRoomNo] as string,
      departureDate: '2028-10-26',
      reasonCode: o.input.reasonCode,
    });
    expect(mv.res.totalRoomVnd).toBe(3 * o.expected.addedNightVnd);
  });

  it('BR-309-16 (F4/F5): deposit 500.000 moved 5 days before the old arrival – reason other then cancelled: refund 250.000, fee 250.000; force majeure then cancelled: refund 0, fee 500.000', async () => {
    const o = oracle('BR-309-16');
    const refund = o.expected.refundVnd as Record<string, number>;
    const fee = o.expected.feeVnd as Record<string, number>;
    await at('2028-10-20T10:00:00+07:00');
    const other = await direct('203', '2028-11-21', '2028-11-23', o.input.depositPaidVnd);
    const fm = await direct('203', '2028-11-28', '2028-11-30', o.input.depositPaidVnd);
    await at('2028-11-16T10:00:00+07:00');
    await moveShown(
      other.id,
      {
        arrivalDate: '2028-12-12',
        departureDate: '2028-12-14',
        reasonCode: 'other',
        note: 'Đoàn thay đổi lịch',
      },
      'mgr',
    );
    await at('2028-11-23T10:00:00+07:00');
    await moveShown(
      fm.id,
      {
        arrivalDate: '2029-01-09',
        departureDate: '2029-01-11',
        reasonCode: 'force_majeure',
        mode: 'postpone_instead_of_cancel',
        note: 'Đèo Prenn đóng – ảnh thông báo',
      },
      'mgr',
    );
    const quote = async (b: Booking, day: string) => {
      await at(`${day}T10:00:00+07:00`);
      const r = await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true });
      expect(r.statusCode, r.body).toBe(200);
      return r.json().cancellation as { retainedVnd: number; refundableVnd: number };
    };
    expect(await quote(other, '2028-11-24')).toMatchObject({
      refundableVnd: refund.other,
      retainedVnd: fee.other,
    });
    expect(await quote(fm, '2028-11-24')).toMatchObject({
      refundableVnd: refund.fm,
      retainedVnd: fee.fm,
    });
  });

  it('ARC 16.13/16.14 (BUG-R2-144/136, BE-A part): B14 and B13 tell the minibar port the stay goes on (room_entered / extended); the checkout summary copies minibarUncheckedRooms with its reason and B18 is blocked until counted', async () => {
    await at('2030-04-01T10:00:00+07:00');
    const b = await direct('202', '2030-05-06', '2030-05-08', 500_000);
    await stayIn(b, '202', '2030-05-06');
    minibar.continued.length = 0;
    await b14(b, '203', '2030-05-07', 'property_fault');
    await at('2030-05-07T11:00:00+07:00');
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect(minibar.continued).toEqual([
      { reservationId: b.id, roomId: ids.rooms['203'], reason: 'room_entered' },
      { reservationId: b.id, roomId: ids.rooms['203'], reason: 'extended' },
    ]);
    const old = {
      roomId: ids.rooms['202'] as string,
      roomNo: '202',
      reason: 'stay_continued' as const,
    };
    minibar.unchecked.set(b.id, [old]);
    await at('2030-05-09T10:00:00+07:00');
    const s = await summary(b, '10:00');
    expect(s.minibarUncheckedRooms).toEqual([old]);
    expect(s.blockers).toContain('minibar_not_checked');
    const out = await act(b.id, 'check-out', { checkoutTime: '10:00' });
    expect(out.statusCode, out.body).toBe(409);
    expect(out.json().code).toBe('MINIBAR_NOT_CHECKED');
    minibar.unchecked.delete(b.id);
  });

  it('SEC 11.4: a key still in progress → 409 IDEMPOTENCY_IN_PROGRESS at step 0; a sellable night with a wrong password → 422 NOT_ALLOWED; a booking never moved keeps its own room bounds (401: floor 740.000) – counters 0/0', async () => {
    await at('2030-05-20T10:00:00+07:00');
    const b = await direct('203', '2030-06-11', '2030-06-13', 500_000);
    const own401 = await direct('401', '2030-06-11', '2030-06-13', 700_000);
    await stayIn(b, '203', '2030-06-11');
    await stayIn(own401, '401', '2030-06-11');
    await at('2030-06-12T10:00:00+07:00');
    const o401 = await options(own401);
    expect(o401.nights[0].floorVnd).toBe(740_000);
    await at('2030-06-13T19:00:00+07:00');
    const fd0 = await counter('fd');
    const mgr0 = await counter('mgr');
    const path = url(`/reservations/${b.id}/actions/check-out`);
    const body = lateFeeBody(792_000, {
      approverUsername: t.users.mgr!.username,
      secret: 'Sai-mat-khau-3',
    });
    // The night is sellable (203 free on the 13th): NOT_ALLOWED before any password.
    const sellable = await act(b.id, 'check-out', body);
    expect(sellable.statusCode, sellable.body).toBe(422);
    expect(sellable.json().errors).toEqual([
      { field: 'lateFeeInsteadOfNight', code: 'NOT_ALLOWED' },
    ]);
    const key = randomUUID();
    await q(
      `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
         request_hash, state)
       VALUES ('user', $1, $2, $3, 'POST', $4, $5, 'in_progress')`,
      [t.users.fd!.id, key, t.organizationId, path, requestHash('POST', path, body)],
    );
    const running = await c.fd!.send('POST', path, body, {
      'idempotency-key': key,
      'if-match': `"${(await get(b.id)).version}"`,
    });
    expect(running.statusCode, running.body).toBe(409);
    expect(running.json().code).toBe('IDEMPOTENCY_IN_PROGRESS');
    expect(await counter('fd')).toBe(fd0);
    expect(await counter('mgr')).toBe(mgr0);
  });

  it('ARC 16.16 bổ sung 2 (deadlock class): folio commands (addFolioLine, recordPayment) racing B13 and B18 never answer 500 – the booking is locked FOR NO KEY UPDATE, a deadlock left would be 409 CONCURRENT_UPDATE', async () => {
    await at('2030-06-20T10:00:00+07:00');
    const b = await direct('302', '2030-07-08', '2030-07-10', 600_000);
    await stayIn(b, '302', '2030-07-08');
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      await at(`2030-07-09T1${i}:00:00+07:00`);
      const version = (await get(b.id)).version;
      const [ext, line, pay] = await Promise.all([
        c.fd!.send(
          'POST',
          url(`/reservations/${b.id}/actions/extend`),
          { nights: 1 },
          {
            'if-match': `"${version}"`,
          },
        ),
        c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
          category: 'fnb',
          description: 'Bữa tối',
          quantity: 1,
          unitPriceVnd: 100_000,
          serviceDate: '2030-07-09',
        }),
        c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
          type: 'charge',
          method: 'cash',
          amountVnd: 10_000,
        }),
      ]);
      statuses.push(ext.statusCode, line.statusCode, pay.statusCode);
      // Before the fix the booking lock (FOR UPDATE) deadlocked with the folio commands ~10 times in these 6
      // rounds (40P01 → 409 CONCURRENT_UPDATE); now they simply wait for each other.
      for (const r of [ext, line, pay]) expect([200, 201], r.body).toContain(r.statusCode);
    }
    // B18 at the (extended) departure racing a payment and a line.
    const dep = (await get(b.id)).departureDate as string;
    await at(`${dep}T10:00:00+07:00`);
    const due = (await totals(b)).balanceDueVnd;
    const [out, line, pay] = await Promise.all([
      act(b.id, 'check-out', {
        checkoutTime: '10:00',
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      }),
      c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
        category: 'fnb',
        description: 'Nước',
        quantity: 1,
        unitPriceVnd: 20_000,
        serviceDate: dep,
      }),
      c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: 20_000,
      }),
    ]);
    for (const r of [out, line, pay]) {
      expect(r.statusCode, r.body).not.toBe(500);
      if (r.statusCode === 409) expect(r.json().code, r.body).not.toBe('CONCURRENT_UPDATE');
    }
    expect(statuses).not.toContain(500);
    // K11-07 (money oracle, not only "no 500"): a desk check-out never leaves the folio owing for a line that is not
    // a post-checkout charge; a refused B18 leaves the stay in house.
    const money = async (x: Booking) => {
      const [r] = await q<{ status: string; mode: string | null; folio: string }>(
        `SELECT r.status, r.checkout_mode AS mode, f.status AS folio FROM reservation r
           JOIN folio f ON f.id = r.folio_id WHERE r.id = $1`,
        [x.id],
      );
      const late = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1 AND category = 'fnb' AND post_checkout
            AND reversal_of_id IS NULL`,
        [x.folioId],
      );
      return { ...r!, due: (await totals(x)).balanceDueVnd, postCheckoutLines: Number(late[0]!.n) };
    };
    const m1 = await money(b);
    if (out.statusCode === 200) {
      expect(m1.status).toBe('checked_out');
      if (m1.due > 0) expect(m1.postCheckoutLines, JSON.stringify(m1)).toBeGreaterThan(0);
    } else {
      expect(m1.status, JSON.stringify(m1)).toBe('in_house');
    }
    // K11-07 / K11-01: B18 with a zero balance and NO finalPayment (no payment locks the folio for it) ‖ a line.
    for (let i = 0; i < 6; i += 1) {
      const arrival = plus('2030-08-05', i * 7); // Mondays (no minimum stay)
      const departure = plus(arrival, 1);
      await at('2030-07-20T10:00:00+07:00');
      const z = await direct('301', arrival, departure, 600_000);
      await stayIn(z, '301', arrival);
      const owe = (await totals(z)).balanceDueVnd;
      if (owe > 0) {
        expect(
          (
            await c.fd!.send('POST', url(`/folios/${z.folioId}/payments`), {
              type: 'charge',
              method: 'cash',
              amountVnd: owe,
            })
          ).statusCode,
        ).toBe(201);
      }
      await at(`${departure}T10:00:00+07:00`);
      const v = (await get(z.id)).version;
      const [o, l] = await Promise.all([
        c.fd!.send(
          'POST',
          url(`/reservations/${z.id}/actions/check-out`),
          { checkoutTime: '10:00' },
          { 'if-match': `"${v}"` },
        ),
        c.fd!.send('POST', url(`/folios/${z.folioId}/lines`), {
          category: 'fnb',
          description: 'Nước',
          quantity: 1,
          unitPriceVnd: 120_000,
          serviceDate: departure,
        }),
      ]);
      const m = await money(z);
      const seen = JSON.stringify({ b18: o.statusCode, line: l.statusCode, ...m });
      expect(l.statusCode, seen).toBe(201);
      if (o.statusCode === 200) {
        // B18 first: the line is a post-checkout charge (BR-427 c).
        expect([m.status, m.mode, m.postCheckoutLines], seen).toEqual(['checked_out', 'desk', 1]);
      } else {
        // The line first: B18 refuses on the balance – the stay stays in house, the folio open.
        expect([o.statusCode, o.json().code, m.status, m.folio, m.due], seen).toEqual([
          409,
          'BALANCE_DUE',
          'in_house',
          'open',
          120_000,
        ]);
      }
    }
  });
});
