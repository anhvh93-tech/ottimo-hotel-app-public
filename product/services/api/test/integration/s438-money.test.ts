/**
 * BE-A – S4-38 adversarial money verification fixes (commit 08dabd3 findings, DOM BR v0.3.8 S4-38 addendum) on the
 * real PostgreSQL through HTTP, numbers from the QA oracle br-examples.json where DOM wrote one:
 * - S438-MOVE-01/02/03/04, REGR-02/03: K12 swap and B12 restore are OTTIMO room moves (BR-429 (b2) fee min +
 *   protected base, BR-424 origin room); a released occupancy row is reused (no 23505); pre-0059 rows fall back to
 *   the room history.
 * - S438-MOVE-05 / PAY-03 (BR-107-05/-06): a typed price is the night's calendar price – the tier applies on it.
 * - S438-CANCEL-01/-02 (BR-309-11/-12): required deposit after B7/B8; peak night on the nights the booking has.
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
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' };

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('S4-38 money fixes (BE-A)', () => {
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
    guest = await seedGuestRow(db, t, { name: 'Khách Kiểm Chứng' });
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
          new Date('2028-12-31T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'fdl');
    await setPassword(db, t, 'own');
    // The VietQR receiving account (FAKE) – the QR cap cases (S4-10) need one.
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
  const patch = async (id: string, body: Record<string, unknown>) =>
    c.fd!.send('PATCH', url(`/reservations/${id}`), body, {
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
  /** S4-35 via adjustFolioLine: the price typed for a night (its calendar price). */
  const typeNight = async (b: Booking, date: string, priceVnd: number) => {
    const folio = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
    const r = await c.mgr!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${await lineId(b.folioId, 'room', date)}/adjustments`),
      { newUnitPriceVnd: priceVnd, reason: 'Giá thỏa thuận với khách' },
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
  const noShow = async (b: Booking, day: string) => {
    await at(`${day}T23:30:00+07:00`);
    const r = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe máy' });
    expect(r.statusCode, r.body).toBe(200);
  };
  const origin = async (id: string) =>
    (
      await q<{ room_no: string | null }>(
        `SELECT rm.room_no FROM reservation r LEFT JOIN room rm ON rm.id = r.origin_room_id WHERE r.id = $1`,
        [id],
      )
    )[0]!.room_no;
  const differenceOf = async (folioId: string) => sum(folioId, 'room_change_difference');

  // ───────────────────────────── group A – K12 swap, B12 restore, origin, protected base ─────────────────────────────

  it('S438-MOVE-01: swap 202 (3 adults, fee 300.000) ↔ 302 (3 adults) – OTTIMO move: fee 300.000 → 0 on A; B keeps base 3 (3 → 2 → 3 adults: 0)', async () => {
    await at('2027-10-20T10:00:00+07:00');
    const a = await direct('202', '2027-11-23', '2027-11-25', 500_000, { adults: 3 });
    const b = await direct('302', '2027-11-23', '2027-11-25', 600_000, { adults: 3 });
    expect(await sum(a.folioId, 'extra_person')).toBe(300_000);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
    const sw = await act(a.id, 'swap-room', {
      otherReservationId: b.id,
      otherVersion: (await get(b.id)).version,
      reason: 'Đổi chéo để gom căn trống',
    });
    expect(sw.statusCode, sw.body).toBe(200);
    expect(await sum(a.folioId, 'extra_person')).toBe(0);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
    const bases = await q<{ base: number }>(
      `SELECT extra_person_base AS base FROM stay_night WHERE reservation_id = $1 AND night_state <> 'void'`,
      [b.id],
    );
    expect(bases.map((x) => Number(x.base))).toEqual([3, 3]);
    expect((await patch(b.id, { adults: 2 })).statusCode).toBe(200);
    expect((await patch(b.id, { adults: 3 })).statusCode).toBe(200);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
  });

  it('S438-MOVE-02: Agoda 203 swapped with a direct 101 by OTTIMO, then the guest asks 401 – difference vs 203 = 2 × 250.000, origin 203', async () => {
    await at('2027-10-20T10:00:00+07:00');
    const o = await agoda('203', '2027-11-30', '2027-12-02', 1_600_000);
    const d = await direct('101', '2027-11-30', '2027-12-02', 400_000);
    const sw = await act(o.id, 'swap-room', {
      otherReservationId: d.id,
      otherVersion: (await get(d.id)).version,
      reason: 'Gom căn cho đoàn',
    });
    expect(sw.statusCode, sw.body).toBe(200);
    expect(await origin(o.id)).toBe('203');
    const mv = await moveShown(o.id, {
      roomId: ids.rooms['401'] as string,
      reasonCode: 'guest_request',
    });
    expect(mv.preview.folioDeltaVnd).toBe(500_000);
    expect(await differenceOf(o.folioId)).toBe(500_000);
  });

  it('S438-MOVE-03 / REGR-02: Agoda 203 no-show → MGR restores into 101 → the guest asks 401 – 2 × 250.000 (origin 203)', async () => {
    await at('2027-12-20T10:00:00+07:00');
    const o = await agoda('203', '2028-01-18', '2028-01-20', 1_600_000);
    await noShow(o, '2028-01-18');
    await at('2028-01-18T23:40:00+07:00');
    const r = await act(
      o.id,
      'restore-no-show',
      { reason: 'Khách tới muộn', roomId: ids.rooms['101'] },
      'mgr',
    );
    expect(r.statusCode, r.body).toBe(200);
    expect(await origin(o.id)).toBe('203');
    await at('2028-01-18T23:50:00+07:00');
    const mv = await moveShown(o.id, {
      roomId: ids.rooms['401'] as string,
      reasonCode: 'guest_request',
    });
    expect(mv.preview.folioDeltaVnd).toBe(500_000);
    expect(await differenceOf(o.folioId)).toBe(500_000);
  });

  it('S438-MOVE-04: no-show restored into the unassigned lane (203 sold again) → B7a assign 201 = 200 (the released occupancy row is reused)', async () => {
    await at('2028-02-01T10:00:00+07:00');
    const o = await agoda('203', '2028-02-15', '2028-02-17', 1_600_000);
    await noShow(o, '2028-02-15');
    await direct('203', '2028-02-16', '2028-02-17', 300_000);
    await at('2028-02-16T01:30:00+07:00');
    const r = await act(
      o.id,
      'restore-no-show',
      { reason: 'Khách tới muộn, xe trễ', allowUnassigned: true },
      'mgr',
    );
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json()).toMatchObject({ status: 'confirmed', conflictState: 'open' });
    expect(await origin(o.id)).toBe('203');
    const as = await act(o.id, 'assign-room', {
      roomId: ids.rooms['201'],
      resolution: 'reassigned_same_group',
    });
    expect(as.statusCode, as.body).toBe(200);
    const occ = await q<{ room_no: string; active: boolean }>(
      `SELECT rm.room_no, o.active FROM room_occupancy o JOIN reservation_segment s ON s.id = o.reservation_segment_id
         JOIN room rm ON rm.id = o.room_id WHERE s.reservation_id = $1`,
      [o.id],
    );
    expect(occ).toEqual([{ room_no: '201', active: true }]);
  });

  it('S438-REGR-03: direct 302 (3 adults) no-show → MGR restores into 202 (base 2) – fee 0, base 3 kept: 3 → 2 → 3 adults still 0', async () => {
    await at('2027-03-01T10:00:00+07:00');
    const b = await direct('302', '2027-03-29', '2027-03-31', 600_000, { adults: 3 });
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
    await noShow(b, '2027-03-29');
    await at('2027-03-29T23:40:00+07:00');
    const r = await act(
      b.id,
      'restore-no-show',
      { reason: 'Khách đến muộn', roomId: ids.rooms['202'] },
      'mgr',
    );
    expect(r.statusCode, r.body).toBe(200);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
    expect((await patch(b.id, { adults: 2 })).statusCode).toBe(200);
    expect((await patch(b.id, { adults: 3 })).statusCode).toBe(200);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
  });

  it('S438-REGR-02/-03 (rows before 0059): origin and protected base come back from the room history', async () => {
    await at('2026-10-20T10:00:00+07:00');
    // origin: OTTIMO 203 → 101, column wiped as before 0059, then the guest asks 401 → 250.000 a night.
    const o = await agoda('203', '2026-11-16', '2026-11-18', 1_600_000);
    await moveShown(o.id, { roomId: ids.rooms['101'] as string, reasonCode: 'property_fault' });
    await q('UPDATE reservation SET origin_room_id = NULL WHERE id = $1', [o.id]);
    const mv = await moveShown(o.id, {
      roomId: ids.rooms['401'] as string,
      reasonCode: 'guest_request',
    });
    expect(mv.preview.folioDeltaVnd).toBe(500_000);
    // base: OTTIMO 402 (base 4) → 203 with 3 adults, base wiped, then 3 → 2 → 3 adults → still 0.
    const b = await direct('402', '2026-11-24', '2026-11-26', 700_000, { adults: 3 });
    await moveShown(b.id, { roomId: ids.rooms['203'] as string, reasonCode: 'property_fault' });
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
    await q('UPDATE stay_night SET extra_person_base = NULL WHERE reservation_id = $1', [b.id]);
    expect((await patch(b.id, { adults: 2 })).statusCode).toBe(200);
    expect((await patch(b.id, { adults: 3 })).statusCode).toBe(200);
    expect(await sum(b.folioId, 'extra_person')).toBe(0);
  });

  // ───────────────────────────── BR-107-05 / -06 – a typed price is the calendar price ─────────────────────────────

  it('BR-107-05 (S438-PAY-03): s1 B13 over 7 nights tiers the typed night (4.320.000); s2 B7 under 7 nights gives it back (3.987.000)', async () => {
    const o = oracle('BR-107-05');
    // s1 – 101, 6 nights in house, 23/11 typed 600.000, +1 night 28/11.
    await at('2026-10-20T10:00:00+07:00');
    const s1 = await direct('101', o.input.s1.stay[0], o.input.s1.stay[1], 1_300_000);
    expect((await get(s1.id)).totalRoomVnd).toBe(o.input.s1.roomTotalVnd);
    await typeNight(s1, '2026-11-23', o.input.s1.manualCalendarVnd['2026-11-23']);
    expect((await get(s1.id)).totalRoomVnd).toBe(o.expected.s1.totalBeforeExtendVnd);
    await at('2026-11-22T15:00:00+07:00');
    await ready('101');
    const pv = (
      await c.fd!.get(url(`/reservations/${s1.id}/check-in-preview?checkinTime=15:00`))
    ).json();
    const ci = await act(s1.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
      ...(pv.amountDueAtCheckinVnd > 0
        ? { payment: { type: 'charge', method: 'cash', amountVnd: pv.amountDueAtCheckinVnd } }
        : {}),
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2026-11-26T10:00:00+07:00');
    const ext = await act(s1.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const after1 = await get(s1.id);
    expect(after1.totalRoomVnd).toBe(o.expected.s1.totalVnd);
    expect(
      after1.nightlyRates.find((n: { date: string }) => n.date === '2026-11-23').amountVnd,
    ).toBe(o.expected.s1.manualNightAfterVnd);
    // s2 – 202, 7 nights, 10/11 typed 700.000 (630.000 at −10 %), guest shortens to 5 nights.
    await at('2026-10-20T10:00:00+07:00');
    const s2 = await direct('202', o.input.s2.stay[0], o.input.s2.stay[1], 1_600_000);
    expect((await get(s2.id)).totalRoomVnd).toBe(o.input.s2.roomTotalVnd);
    await typeNight(s2, '2026-11-10', o.input.s2.manualCalendarVnd['2026-11-10']);
    const typed = (await get(s2.id)).nightlyRates.find(
      (n: { date: string }) => n.date === '2026-11-10',
    );
    expect(typed.amountVnd).toBe(o.expected.s2.manualNightBeforeVnd);
    const mv = await moveShown(s2.id, {
      arrivalDate: o.input.s2.shortenTo[0],
      departureDate: o.input.s2.shortenTo[1],
      reasonCode: 'guest_request',
    });
    expect(mv.res.totalRoomVnd).toBe(o.expected.s2.totalVnd);
    expect(
      mv.res.nightlyRates.find((n: { date: string }) => n.date === '2026-11-10').amountVnd,
    ).toBe(o.expected.s2.manualNightAfterVnd);
  });

  it('BR-107-06 (S438-MOVE-05): B7 over the 7-night mark with a typed night – (a) 7 → 6 nights 4.898.000, (b) 6 → 7 nights 5.122.000', async () => {
    const o = oracle('BR-107-06');
    await at('2027-09-20T10:00:00+07:00');
    const a = await direct('202', o.input.a.stay[0], o.input.a.stay[1], 1_600_000);
    await typeNight(a, '2027-10-26', o.input.a.manualCalendarVnd['2027-10-26']);
    const ma = await moveShown(a.id, {
      arrivalDate: o.input.a.shortenTo[0],
      departureDate: o.input.a.shortenTo[1],
      reasonCode: 'guest_request',
    });
    expect(ma.res.totalRoomVnd).toBe(o.expected.a.totalVnd);
    expect(
      ma.res.nightlyRates.find((n: { date: string }) => n.date === '2027-10-26').amountVnd,
    ).toBe(o.expected.a.manualNightVnd);
    const b = await direct('202', o.input.b.stay[0], o.input.b.stay[1], 1_500_000);
    await typeNight(b, '2027-11-16', o.input.b.manualCalendarVnd['2027-11-16']);
    const mb = await moveShown(b.id, {
      arrivalDate: o.input.b.extendTo[0],
      departureDate: o.input.b.extendTo[1],
      reasonCode: 'guest_request',
    });
    expect(mb.res.totalRoomVnd).toBe(o.expected.b.totalVnd);
    expect(
      mb.res.nightlyRates.find((n: { date: string }) => n.date === '2027-11-16').amountVnd,
    ).toBe(o.expected.b.manualNightVnd);
  });

  // ───────────────────────────── BR-309-11 / -12 – cancellation fee base ─────────────────────────────

  const cancelQuote = async (b: Booking, day: string) => {
    await at(`${day}T10:00:00+07:00`);
    const r = await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true });
    expect(r.statusCode, r.body).toBe(200);
    return r.json().cancellation as { retainedVnd: number; refundableVnd: number };
  };
  const payDeposit = async (b: Booking, amountVnd: number) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
      type: 'deposit',
      method: 'cash',
      amountVnd,
    });
    expect([200, 201], r.body).toContain(r.statusCode);
  };

  it('BR-309-11 (S438-CANCEL-01): the required deposit follows the room money after B7/B8 – x6 1.600.000 / x6b 500.000 (+1.100.000 back) / x6bLate kept → 1.584.000', async () => {
    const o = oracle('BR-309-11');
    const fee = o.expected.feeVnd as Record<string, number>;
    const back = o.expected.refundVnd as Record<string, number>;
    // x6: 202, 2 → 7 nights (guest), +1.100.000 deposit, cancel 2 days before.
    await at('2027-01-20T10:00:00+07:00');
    const x6 = await direct('202', '2027-02-22', '2027-02-24', 500_000);
    const m6 = await moveShown(x6.id, { departureDate: '2027-03-01', reasonCode: 'guest_request' });
    expect(m6.res.totalRoomVnd).toBe(o.input.x6.roomTotalVnd);
    expect(m6.res.depositRequiredVnd).toBe(o.expected.depositRequiredForFeeVnd.x6);
    await payDeposit(x6, 1_100_000);
    expect(await cancelQuote(x6, '2027-02-20')).toMatchObject({
      retainedVnd: fee.x6,
      refundableVnd: back.x6,
    });
    // x6b: 203, 7 → 2 nights 10 days before arrival, cancel 2 days before.
    await at('2027-01-20T10:00:00+07:00');
    const x6b = await direct('203', '2027-02-22', '2027-03-01', 1_600_000);
    await at('2027-02-12T10:00:00+07:00');
    const m6b = await moveShown(x6b.id, {
      departureDate: '2027-02-24',
      reasonCode: 'guest_request',
    });
    expect(m6b.res.depositRequiredVnd).toBe(o.expected.depositRequiredForFeeVnd.x6b);
    expect(await cancelQuote(x6b, '2027-02-20')).toMatchObject({
      retainedVnd: fee.x6b,
      refundableVnd: back.x6b,
    });
    // x6bLate: the same shortening 5 days before arrival keeps the former required deposit.
    await at('2027-01-20T10:00:00+07:00');
    const late = await direct('203', '2027-03-08', '2027-03-15', 1_600_000);
    await at('2027-03-03T10:00:00+07:00');
    const ml = await moveShown(late.id, {
      departureDate: '2027-03-10',
      reasonCode: 'guest_request',
    });
    expect(ml.res.totalRoomVnd).toBe(o.input.x6bLate.roomTotalVnd);
    expect(ml.res.depositRequiredVnd).toBe(o.expected.depositRequiredForFeeVnd.x6bLate);
    expect(await cancelQuote(late, '2027-03-06')).toMatchObject({
      retainedVnd: fee.x6bLate,
      refundableVnd: back.x6bLate,
    });
  });

  it('BR-309-12 (S438-CANCEL-02): peak night on the nights the booking has now (moved into Giỗ Tổ → no refund); a paid booking moved out of it keeps no refund', async () => {
    const o = oracle('BR-309-12');
    const fee = o.expected.feeVnd as Record<string, number>;
    const back = o.expected.refundVnd as Record<string, number>;
    await at('2027-03-01T10:00:00+07:00');
    const x1 = await direct(
      '202',
      o.input.x1.from[0],
      o.input.x1.from[1],
      o.input.x1.depositPaidVnd,
    );
    await moveShown(x1.id, {
      arrivalDate: o.input.x1.to[0],
      departureDate: o.input.x1.to[1],
      reasonCode: 'guest_request',
    });
    expect(await cancelQuote(x1, '2027-04-01')).toMatchObject({
      retainedVnd: fee.x1,
      refundableVnd: back.x1,
    });
    await at('2027-03-01T10:00:00+07:00');
    const x1b = await direct(
      '203',
      o.input.x1b.from[0],
      o.input.x1b.from[1],
      o.input.x1b.depositPaidVnd,
    );
    await moveShown(x1b.id, {
      arrivalDate: o.input.x1b.to[0],
      departureDate: o.input.x1b.to[1],
      reasonCode: 'guest_request',
    });
    expect(await cancelQuote(x1b, '2027-03-25')).toMatchObject({
      retainedVnd: fee.x1b,
      refundableVnd: back.x1b,
    });
  });

  // ───────────────────────────── group B – B9a / B18 amounts = what they write ─────────────────────────────

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
  const qrCap = async (b: Booking, body: Record<string, unknown>) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), {
      purpose: 'check_in',
      ...body,
    });
    return r;
  };
  const totals = async (b: Booking) =>
    (await c.fd!.get(url(`/folios/${b.folioId}`))).json().totals as {
      balanceDueVnd: number;
      creditVnd: number;
      totalVnd: number;
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

  it('BR-417-04 (S438-PAY-01, S438-DOM-01): B9a on a Saturday – default 767.000 (that night), 7 nights −10 %: due 3.180.000 = QR cap = B9a; typed 667.000 → 3.090.000', async () => {
    const o = oracle('BR-417-04');
    // Same pattern as the oracle (Sun–Fri, Saturday before): 06–12/12/2026, room 101.
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('101', '2026-12-06', '2026-12-12', o.input.depositPaidVnd);
    expect((await get(b.id)).totalRoomVnd).toBe(o.input.roomTotalVnd);
    await at('2026-12-06T04:30:00+07:00');
    await ready('101');
    const pv = await checkInPreview(b);
    expect(pv.priorNight).toMatchObject({
      date: '2026-12-05',
      defaultRateVnd: o.expected.priorNightDefaultVnd,
    });
    expect(pv.amountDueAtCheckinVnd).toBe(o.expected.amountDueAtCheckinVnd);
    const typed = o.expected.ifDeskTypes667000 as {
      totalVnd: number;
      amountDueAtCheckinVnd: number;
    };
    const qTyped = await qrCap(b, {
      amountVnd: typed.amountDueAtCheckinVnd + 1,
      addPriorNight: true,
      priorNightRateVnd: 667_000,
    });
    expect(qTyped.json(), qTyped.body).toMatchObject({ max: typed.amountDueAtCheckinVnd });
    const q = await qrCap(b, { amountVnd: o.expected.qrCheckInMaxVnd + 1, addPriorNight: true });
    expect(q.json()).toMatchObject({ max: o.expected.qrCheckInMaxVnd });
    const ci = await checkIn(b, {
      addPriorNight: true,
      priorNightRateVnd: o.expected.priorNightDefaultVnd,
      expectedSurchargeVnd: o.expected.priorNightDefaultVnd,
      ...pay(o.expected.amountDueAtCheckinVnd),
    });
    expect(ci.statusCode, ci.body).toBe(200);
    expect((await get(b.id)).totalRoomVnd).toBe(o.expected.totalVnd);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BR-417-05 (S438-PAY-02): B9a with a third adult – the due includes the fee of the added night (2.200.000)', async () => {
    const o = oracle('BR-417-05');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('102', o.input.stay[0], o.input.stay[1], 500_000, {
      adults: o.input.adults,
    });
    expect((await totals(b)).balanceDueVnd).toBe(o.input.balanceDueVnd);
    await at('2026-11-10T04:30:00+07:00');
    await ready('102');
    const pv = await checkInPreview(b);
    expect(pv.priorNight.defaultRateVnd).toBe(o.input.priorNightVnd);
    expect(pv.amountDueAtCheckinVnd).toBe(o.expected.amountDueAtCheckinVnd);
    const ci = await checkIn(b, {
      addPriorNight: true,
      priorNightRateVnd: o.input.priorNightVnd,
      expectedSurchargeVnd: o.input.priorNightVnd,
      ...pay(o.expected.amountDueAtCheckinVnd),
    });
    expect(ci.statusCode, ci.body).toBe(200);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BR-417-06 (S438-REGR-01): folio in credit 1.584.000, B9a typed 1.000.000 – everything counted, then clamped: due 0, no QR; credit 584.000 after B9a', async () => {
    const o = oracle('BR-417-06');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('202', '2026-12-08', '2026-12-10', 500_000);
    const due = (await totals(b)).balanceDueVnd;
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd: due,
    });
    expect([200, 201], r.body).toContain(r.statusCode);
    for (const d of ['2026-12-08', '2026-12-09']) {
      const f = await c.fd!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${await lineId(b.folioId, 'room', d)}/foc`),
        { kind: 'foc', amountVnd: 792_000, reasonCode: 'service_recovery' },
      );
      expect(f.statusCode, f.body).toBe(201);
      const ap = await c.mgr!.send(
        'POST',
        url(`/approval-requests/${f.json().id}/actions/approve`),
        {
          authMethod: 'password',
          secret: TEST_PASSWORD,
        },
      );
      expect(ap.statusCode, ap.body).toBe(200);
    }
    expect((await totals(b)).creditVnd).toBe(o.input.creditVnd);
    await at('2026-12-08T04:30:00+07:00');
    await ready('202');
    const pv = await checkInPreview(b);
    expect(pv.priorNight.defaultRateVnd).toBe(o.input.priorNightDefaultVnd);
    const q = await qrCap(b, {
      amountVnd: 1_000,
      addPriorNight: true,
      priorNightRateVnd: o.input.priorNightTypedVnd,
    });
    expect(q.statusCode, q.body).toBe(422);
    expect(q.json()).toMatchObject({ max: o.expected.amountDueAtCheckinVnd });
    const ci = await checkIn(b, {
      addPriorNight: true,
      priorNightRateVnd: o.input.priorNightTypedVnd,
      expectedSurchargeVnd: o.input.priorNightTypedVnd,
    });
    expect(ci.statusCode, ci.body).toBe(200);
    expect((await totals(b)).creditVnd).toBe(o.expected.creditAfterB9Vnd);
  });

  it('BR-416-04 (S438-PAY-04): the same Saturday night by B13 (X) and by B18 "one more night" (Y) – 777.000 each, 4.929.000 each', async () => {
    const o = oracle('BR-416-04');
    await at('2026-10-20T10:00:00+07:00');
    const x = await direct('102', o.input.stay[0], o.input.stay[1], 1_400_000);
    const y = await direct('103', o.input.stay[0], o.input.stay[1], 1_400_000);
    await stayIn(x, '102', o.input.stay[0]);
    await stayIn(y, '103', o.input.stay[0]);
    await at('2026-11-27T10:00:00+07:00');
    expect((await act(x.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    const night = (r: { nightlyRates: Array<{ date: string; amountVnd: number }> }) =>
      r.nightlyRates.find((n) => n.date === '2026-11-28')?.amountVnd;
    const gx = await get(x.id);
    expect(night(gx)).toBe(o.expected.nightVnd.x);
    expect(gx.totalRoomVnd).toBe(o.expected.totalVnd.x);
    await at(o.input.y.leaveAt);
    const s = (
      await c.fd!.get(url(`/reservations/${y.id}/checkout-summary?checkoutTime=19:00`))
    ).json();
    expect(s.extraNightRequired).toBe(true);
    expect(s.extraNightDefaultRateVnd).toBe(o.input.y.extraNightRateVnd);
    const out = await act(y.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: o.input.y.extraNightRateVnd },
      ...(s.amountDueAtCheckoutVnd > 0
        ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd } }
        : {}),
    });
    expect(out.statusCode, out.body).toBe(200);
    const gy = await get(y.id);
    expect(night(gy)).toBe(o.expected.nightVnd.y);
    expect(gy.totalRoomVnd).toBe(o.expected.totalVnd.y);
    expect(await totals(y)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BR-416-05 (S438-FOC-02): B18 extra night with an approved FOC on a re-tiered night – the summary includes the FOC that follows: 370.000 = what B18 needs', async () => {
    const o = oracle('BR-416-05');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('402', o.input.stay[0], o.input.stay[1], 1_900_000);
    expect((await get(b.id)).totalRoomVnd).toBe(o.input.roomTotalVnd);
    const f = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${await lineId(b.folioId, 'room', '2026-11-10')}/foc`),
      {
        kind: 'foc',
        amountVnd: o.input.approvedFocVnd['2026-11-10'],
        reasonCode: 'service_recovery',
      },
    );
    expect(f.statusCode, f.body).toBe(201);
    const ap = await c.mgr!.send('POST', url(`/approval-requests/${f.json().id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    await stayIn(b, '402', o.input.stay[0]);
    expect((await totals(b)).balanceDueVnd).toBe(0);
    await at(o.input.leaveAt);
    const s = (
      await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=19:00`))
    ).json();
    expect(s.amountDueAtCheckoutVnd).toBe(o.expected.amountDueAtCheckoutVnd);
    const out = await act(b.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: s.extraNightDefaultRateVnd },
      finalPayment: { type: 'charge', method: 'cash', amountVnd: s.amountDueAtCheckoutVnd },
    });
    expect(out.statusCode, out.body).toBe(200);
    const t2 = await totals(b);
    expect(t2).toMatchObject({
      balanceDueVnd: 0,
      creditVnd: 0,
      totalVnd: o.expected.folioTotalVnd,
    });
  });

  // ───────────────────────────── group C – FOC on an OTA room-change difference ─────────────────────────────

  it('S438-FOC-04: Agoda 203 → 401 (guest), FOC 250.000 on the 20/12 difference, then → 402 (guest) – the FOC follows (208.000), preview −42.000 = write, total 1.808.000', async () => {
    await at('2027-11-20T10:00:00+07:00');
    const o = await agoda('203', '2027-12-20', '2027-12-22', 1_600_000);
    await moveShown(o.id, { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' });
    expect(await differenceOf(o.folioId)).toBe(500_000);
    const diff20 = await lineId(o.folioId, 'room_change_difference', '2027-12-20');
    const f = await c.fd!.send('POST', url(`/folios/${o.folioId}/lines/${diff20}/foc`), {
      kind: 'foc',
      amountVnd: 250_000,
      reasonCode: 'service_recovery',
    });
    expect(f.statusCode, f.body).toBe(201);
    const ap = await c.mgr!.send('POST', url(`/approval-requests/${f.json().id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    expect(await totals(o)).toMatchObject({ totalVnd: 1_850_000, balanceDueVnd: 250_000 });
    const mv = await moveShown(o.id, {
      roomId: ids.rooms['402'] as string,
      reasonCode: 'guest_request',
    });
    expect(mv.preview.folioDeltaVnd).toBe(-42_000);
    expect(await differenceOf(o.folioId)).toBe(416_000);
    expect(await totals(o)).toMatchObject({ totalVnd: 1_808_000, balanceDueVnd: 208_000 });
    const list = (await c.mgr!.get(url('/approval-requests?status=approved&limit=100'))).json();
    const req = (list.data as Array<{ id: string }>).find((x) => x.id === f.json().id);
    expect(req).toMatchObject({ focState: 'applied', effectiveAmountVnd: 208_000 });
  });
});
