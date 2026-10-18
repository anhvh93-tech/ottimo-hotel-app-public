/**
 * BE-A – A7-01 (P1, ARC `openapi-0.3.7.md` 16.21; DATA Q-10 / BR-215 / BR-209 / BR-210; US-017 AC5a): a manual
 * long stay has its nights in `stay_night` (`lease_allocation`, `stay_type long`), allocated per contract month,
 * through create, B13, B14, B16, cancellation and the one-time back-fill – and they NEVER make a folio line.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
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
  contractMonthTotals,
  leaseNightAmounts,
} from '../../src/modules/reservations/internal/lease-nights';
import { divideRoundVnd } from '../../src/modules/platform/public/money';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
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
class MinibarCounted implements FrontdeskMinibarPort {
  async checkoutStatus(): Promise<MinibarCheckoutStatus> {
    return { required: false, checked: true };
  }
  async onCheckedOut(): Promise<string | null> {
    return null;
  }
}

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Array<{ id: string; input: any; expected: any }> };
const oracle = (id: string) => ORACLES.examples.find((e) => e.id === id)!;

describe('A7-01 – Q-10 allocation of a lease (pure)', () => {
  it('BR-215-01: lease from 15/10/2026 at 11.130.000 – contract month 1 = 15/10–14/11 (31 nights), 359.032 a night, the remainder on 14/11 (359.040), Σ = the rent', () => {
    const o = oracle('BR-215-01');
    const nights = leaseNightAmounts('2026-10-15', '2026-11-15', o.input.monthlyRentVnd, 371_000);
    expect(nights.length).toBe(o.expected.contractMonthNights);
    expect(nights[0]).toEqual({ date: '2026-10-15', amountVnd: o.expected.perNightVnd });
    expect(nights[30]).toEqual({ date: '2026-11-14', amountVnd: 359_040 });
    expect(nights.reduce((a, n) => a + n.amountVnd, 0)).toBe(o.input.monthlyRentVnd);
  });
  it('BR-215-02: lease from 1/11 – 30 nights of 371.000; two months then 5 odd days at the nightly equivalent (BR-210-01: 371.000 × 5)', () => {
    const o = oracle('BR-215-02');
    const odd = oracle('BR-210-01');
    const nights = leaseNightAmounts(
      '2026-11-01',
      '2027-01-06',
      o.input.monthlyRentVnd,
      odd.input.longStayNightRateVnd,
    );
    expect(
      nights
        .filter((n) => n.date < '2026-12-01')
        .every((n) => n.amountVnd === o.expected.perNightVnd),
    ).toBe(true);
    const totals = contractMonthTotals('2026-11-01', nights);
    expect(totals.slice(0, 2).map((m) => m.totalVnd)).toEqual([11_130_000, 11_130_000]);
    expect(nights.filter((n) => n.date >= '2027-01-01').map((n) => n.amountVnd)).toEqual(
      Array(odd.input.days).fill(odd.input.longStayNightRateVnd),
    );
    expect(nights.filter((n) => n.date >= '2027-01-01').reduce((a, n) => a + n.amountVnd, 0)).toBe(
      odd.expected.rentVnd,
    );
  });
  it('DOM D-A7-1: a departure one day before the month mark (start + 3 months − 1 day) counts 3 whole contract months – the last 29 nights = 324.482 × 28 + 324.504, total 28.230.000 (not 27.926.000); two days short → the nights after the last mark are odd days', () => {
    const rent = 9_410_000;
    // D-A7-2: the odd-day price rounds to the nearest 1.000 (9.410.000 ÷ 30 = 313.666,67 → 314.000).
    const odd = divideRoundVnd(rent, 30, 1_000);
    expect(odd).toBe(314_000);
    const n = leaseNightAmounts('2027-04-01', '2027-06-30', rent, odd);
    const june = n.filter((x) => x.date >= '2027-06-01');
    expect(june.length).toBe(29);
    expect(june.slice(0, 28).every((x) => x.amountVnd === 324_482)).toBe(true);
    expect(june[28]).toEqual({ date: '2027-06-29', amountVnd: 324_504 });
    expect(n.reduce((a, x) => a + x.amountVnd, 0)).toBe(28_230_000);
    const short = leaseNightAmounts('2027-04-01', '2027-06-29', rent, odd);
    expect(short.filter((x) => x.date >= '2027-06-01').map((x) => x.amountVnd)).toEqual(
      Array(28).fill(314_000),
    );
  });
  it('BR-209: a lease from 31/01 – the contract months end on 28/02 and 31/03 (computed from the arrival, never chained)', () => {
    const nights = leaseNightAmounts('2027-01-31', '2027-03-31', 9_000_000, 300_000);
    const totals = contractMonthTotals('2027-01-31', nights);
    expect(totals.map((m) => [m.from, m.to, m.totalVnd])).toEqual([
      ['2027-01-31', '2027-02-28', 9_000_000],
      ['2027-02-28', '2027-03-31', 9_000_000],
    ]);
    expect(nights.length).toBe(28 + 31);
  });
});

describe.skipIf(!HAS_DB)('A7-01 – lease nights of a manual long stay (HTTP)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const ROLES = { mgr: ['manager'], fd: ['front_desk'] };

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Hợp Đồng Dài' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new MinibarCounted()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
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
          new Date('2036-12-31T00:00:00Z'),
        ],
      ),
    );
    for (const u of Object.keys(ROLES)) {
      c[u] = Client.of(fa, t, u);
      c[u]!.deviceToken = token;
    }
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (p = '') => `${P(t)}${p}`;
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
  const lease = async (room: string, from: string, to: string, rent = 9_000_000) => {
    const r = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate: from,
      departureDate: to,
      adults: 1,
      bookerGuestId: guest,
      paymentModel: 'direct',
      manualLongStay: { monthlyRentVnd: rent },
    });
    expect(r.statusCode, r.body).toBe(201);
    return r.json() as { id: string; folioId: string };
  };
  const nights = (id: string) =>
    q<{
      d: string;
      a: string;
      room: string;
      state: string;
      src: string;
      type: string;
      cal: string | null;
    }>(
      `SELECT n.stay_date::text AS d, n.room_revenue_vnd::text AS a, rm.room_no AS room, n.night_state AS state,
              n.rate_source AS src, n.stay_type AS type, n.calendar_rate_vnd::text AS cal
         FROM stay_night n LEFT JOIN room rm ON rm.id = n.room_id
        WHERE n.reservation_id = $1 ORDER BY n.stay_date`,
      [id],
    );
  const live = async (id: string) => (await nights(id)).filter((n) => n.state !== 'void');
  /** The invariant: no room / extra-person line on the folio of a manual long stay. */
  const roomLines = async (folioId: string) =>
    Number(
      (
        await q<{ n: number }>(
          `SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1 AND category IN ('room', 'extra_person')`,
          [folioId],
        )
      )[0]!.n,
    );
  const ready = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const monthSum = (rows: Array<{ d: string; a: string }>, from: string, to: string) =>
    rows.filter((n) => n.d >= from && n.d < to).reduce((a, n) => a + Number(n.a), 0);

  it('create → B13 → B14 → B16: lease nights sold, `long`, `lease_allocation`, no calendar; Σ each contract month = the rent, odd days at rent ÷ 30; the room follows B14; B16 voids the dropped nights – and the folio never gets a room / extra-person line', async () => {
    await at('2027-02-01T10:00:00+07:00');
    const b = await lease('202', '2027-03-01', '2027-05-01');
    let n = await live(b.id);
    expect(n.length).toBe(61);
    expect(new Set(n.map((x) => `${x.state}/${x.src}/${x.type}/${x.cal}/${x.room}`))).toEqual(
      new Set(['sold/lease_allocation/long/null/202']),
    );
    expect(monthSum(n, '2027-03-01', '2027-04-01')).toBe(9_000_000);
    expect(monthSum(n, '2027-04-01', '2027-05-01')).toBe(9_000_000);
    expect(await roomLines(b.folioId)).toBe(0);
    // Check-in, then B13 + 10 nights: 10 odd days of 300.000 (BR-210, 9.000.000 ÷ 30).
    await at('2027-03-01T15:00:00+07:00');
    await ready('202');
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2027-04-20T10:00:00+07:00');
    const ext = await act(b.id, 'extend', { nights: 10 });
    expect(ext.statusCode, ext.body).toBe(200);
    n = await live(b.id);
    expect(n.length).toBe(71);
    expect(n.filter((x) => x.d >= '2027-05-01').map((x) => Number(x.a))).toEqual(
      Array(10).fill(300_000),
    );
    expect(await roomLines(b.folioId)).toBe(0);
    // B14 (OTTIMO) from 25/04 to 203: the nights from that day are in 203, amounts unchanged.
    await at('2027-04-25T10:00:00+07:00');
    await ready('203');
    const body = {
      newRoomId: ids.rooms['203'],
      effectiveDate: '2027-04-25',
      cause: 'property_fault',
      reason: 'Điều hòa hỏng',
    };
    const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json().folioDeltaVnd).toBe(0);
    const mv = await act(b.id, 'change-room', {
      ...body,
      applyDifference: true,
      expectedDeltaVnd: 0,
    });
    expect(mv.statusCode, mv.body).toBe(200);
    n = await live(b.id);
    expect(n.length).toBe(71);
    expect(n.filter((x) => x.d < '2027-04-25').every((x) => x.room === '202')).toBe(true);
    expect(n.filter((x) => x.d >= '2027-04-25').every((x) => x.room === '203')).toBe(true);
    expect(monthSum(n, '2027-04-01', '2027-05-01')).toBe(9_000_000);
    expect(await roomLines(b.folioId)).toBe(0);
    // B16: leaves on 05/05 – the nights from 05/05 are void, nothing posted for them.
    await at('2027-04-28T10:00:00+07:00');
    const lines0 = (
      await q<{ n: number }>('SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1', [
        b.folioId,
      ])
    )[0]!.n;
    const ed = await act(b.id, 'early-departure', {
      newDepartureDate: '2027-05-05',
      noticeGivenAt: '2027-04-28T10:00:00+07:00',
    });
    expect(ed.statusCode, ed.body).toBe(200);
    n = await nights(b.id);
    expect(n.filter((x) => x.state !== 'void').length).toBe(65);
    expect(n.filter((x) => x.d >= '2027-05-05').every((x) => x.state === 'void')).toBe(true);
    expect(await roomLines(b.folioId)).toBe(0);
    expect(
      (
        await q<{ n: number }>('SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1', [
          b.folioId,
        ])
      )[0]!.n,
    ).toBe(lines0);
  });

  it('cancellation voids every lease night; the back-fill job (one-time, idempotent) gives a pre-release manual long stay its nights with the same allocation, and does nothing the second time', async () => {
    await at('2027-06-01T10:00:00+07:00');
    const x = await lease('301', '2027-07-01', '2027-08-01', 11_500_000);
    expect((await live(x.id)).length).toBe(31);
    const cx = await act(x.id, 'cancel', { reasonCode: 'found_other' }, 'mgr');
    expect(cx.statusCode, cx.body).toBe(200);
    expect((await live(x.id)).length).toBe(0);
    expect(await roomLines(x.folioId)).toBe(0);
    // A booking from before the release: no nights.
    const old = await lease('302', '2027-07-01', '2027-09-15', 11_000_000);
    const want = (await live(old.id)).map((r) => [r.d, r.a]);
    // (stay_night rows are never deleted – the legacy state is "no live night")
    await q(
      `UPDATE stay_night SET prev_state = night_state, night_state = 'void', voided_at = $2,
              void_reason = 'date_change' WHERE reservation_id = $1`,
      [old.id, fa.clock.now()],
    );
    expect((await live(old.id)).length).toBe(0);
    const svc = fa.app.get(ReservationsService);
    const run = () =>
      db.withContext(t.ctx(), (tx) => svc.backfillLeaseNights(tx, fa.clock.now(), '2027-06-01'));
    expect(await run()).toEqual({ bookings: 1, nights: want.length });
    expect((await live(old.id)).map((r) => [r.d, r.a])).toEqual(want);
    expect(await run()).toEqual({ bookings: 0, nights: 0 });
    // DATA / OPS checks (16.21): no open manual long stay without nights; Σ per whole contract month = the rent.
    const missing = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM reservation r
        WHERE r.external_contract AND r.status <> 'cancelled'
          AND NOT EXISTS (SELECT 1 FROM stay_night n WHERE n.reservation_id = r.id AND n.night_state <> 'void')`,
    );
    expect(missing[0]!.n).toBe(0);
    const rows = await live(old.id);
    expect(monthSum(rows, '2027-07-01', '2027-08-01')).toBe(11_000_000);
    expect(monthSum(rows, '2027-08-01', '2027-09-01')).toBe(11_000_000);
    expect(await roomLines(old.folioId)).toBe(0);
  });

  it('K-02 (BE-D getTonightKpi): a manual long stay in house counts as an occupied room through its lease night', async () => {
    await at('2027-10-01T10:00:00+07:00');
    const b = await lease('401', '2027-10-05', '2027-11-05');
    await at('2027-10-05T15:00:00+07:00');
    await ready('401');
    expect(
      (await act(b.id, 'check-in', { cardsIssued: 1, houseRulesSent: true, checkinTime: '15:00' }))
        .statusCode,
    ).toBe(200);
    await at('2027-10-06T20:00:00+07:00');
    const kpi = await c.mgr!.get(url('/dashboard/tonight'));
    expect(kpi.statusCode, kpi.body).toBe(200);
    expect(kpi.json().occupiedRooms).toBeGreaterThanOrEqual(1);
  });
});
