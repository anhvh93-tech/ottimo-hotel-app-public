/**
 * Round 6 (MONEY, s3-round5-verification) – an approved FOC through the night sync, on the real PostgreSQL and
 * the real endpoints (DOM 17/10, BR-431/BR-434: "FOC đi theo dòng mới = min(FOC đã duyệt, giá mới)", no
 * re-approval, never more). Where the FOC goes when the nights change is decided by DATE (DOM 17/10, S4-14,
 * rounds 7/8): a kept date keeps its FOC; dropped[i] → added[i] (ascending, nights without FOC counted);
 * a dropped date without a counterpart takes its FOC with it; room and extra-person FOC alike.
 * - (A) FOC on night 3 → B8 to other dates (k → k) → PATCH people → overlapping move (FOC stays on its date) →
 *   B10 fee ≤ booking value → B16.
 * - (B) FOC 200k on a night of an extension child booking → B14 property fault (resyncs parent + child) → folio
 *   total unchanged → B16 → the refund basis is the net night.
 * - Round 8: c2, c4, d4, i, g (s3-round7-verification) and BR-434-02/03 + g2 (br-examples, DOM S4-14).
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
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
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { applyPct } from '../../src/modules/reservations/public/pricing';
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

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('FOC through the night sync (round 6 MONEY A/B)', () => {
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
    guest = await seedGuestRow(db, t, { name: 'Kim Ota Khách' });
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
  const vacant = (room: string) =>
    q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms[room]]);
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
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  const approve = (who: string, id: string) =>
    c[who]!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  type Line = {
    id: string;
    category: string;
    amountVnd: number;
    serviceDate?: string;
    relatedLineId?: string;
    reversalOfId?: string;
    lineState: string;
  };
  /** Live posted lines (not reversals, not reversed). */
  const liveLines = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.filter((l) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id));
  };
  const requestFoc = async (b: Booking, lineId: string, amountVnd: number) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'service_recovery',
    });
    expect(r.statusCode, r.body).toBe(201);
    expect((await approve('mgr', r.json().id)).statusCode).toBe(200);
    return r.json().id as string;
  };
  const value = (b: Booking, rid = b.id) =>
    db.withContext(t.ctx(), (tx) => fa.app.get(FolioService).bookingValueVnd(tx, b.folioId, rid));

  it('(A) FOC on night 3 → B8 to other dates → new night 3 (k → k, min) → PATCH people → overlapping move keeps the FOC on its date → B10 fee ≤ value → B16 drops a night without FOC', async () => {
    await at('2026-10-20T10:00:00+07:00');
    await vacant('101');
    const b = await create({
      roomId: ids.rooms['101'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2026-12-10',
      departureDate: '2026-12-13',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
    });
    const rooms = async () =>
      (await liveLines(b))
        .filter((l) => l.category === 'room')
        .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
    const focs = async () => (await liveLines(b)).filter((l) => l.category === 'foc');
    const roomSum = (ls: Line[]) => ls.reduce((acc, l) => acc + l.amountVnd, 0);
    const nights0 = await rooms();
    expect(nights0.map((l) => l.serviceDate)).toEqual(['2026-12-10', '2026-12-11', '2026-12-12']);
    // The FOC is on night 3 – NOT night 1 (round 7: a test on night 1 passed by coincidence).
    const focId = await requestFoc(b, nights0[2]!.id, 300_000);
    /** The live FOC sits on night `rank` (1-based) of the stay, = −min(300k, that night's rate). */
    const expectFocOnNight = async (rank: number) => {
      const r = await rooms();
      const f = await focs();
      expect(f).toHaveLength(1);
      expect(f[0]).toMatchObject({
        relatedLineId: r[rank - 1]!.id,
        amountVnd: -Math.min(300_000, r[rank - 1]!.amountVnd),
      });
      const [n] = await q<{ discount_vnd: number }>(
        `SELECT discount_vnd FROM stay_night WHERE reservation_id = $1 AND stay_date = $2::date`,
        [b.id, r[rank - 1]!.serviceDate],
      );
      expect(Number(n!.discount_vnd)).toBe(-f[0]!.amountVnd);
      const [link] = await q<{ approval_request_id: string }>(
        'SELECT approval_request_id FROM folio_line WHERE id = $1',
        [f[0]!.id],
      );
      expect(link!.approval_request_id).toBe(focId); // no re-approval
      expect(await value(b)).toBe(roomSum(r) + f[0]!.amountVnd);
      return r;
    };
    // B8 to other dates (no overlap): night 3 → new night 3.
    const mv = await act(b.id, 'move', {
      arrivalDate: '2026-12-17',
      departureDate: '2026-12-20',
      reasonCode: 'guest_request',
    });
    expect(mv.statusCode, mv.body).toBe(200);
    const r1 = await expectFocOnNight(3);
    expect(r1.map((l) => l.serviceDate)).toEqual(['2026-12-17', '2026-12-18', '2026-12-19']);
    // PATCH people (another sync): the FOC stays on night 3, once.
    const patch = await c.fd!.send(
      'PATCH',
      url(`/reservations/${b.id}`),
      { adults: 1 },
      { 'if-match': `"${await version(b.id)}"` },
    );
    expect(patch.statusCode, patch.body).toBe(200);
    await expectFocOnNight(3);
    // Overlapping move (17–20 → 18–21, DOM S4-14): 19/12 is still in the stay, so it keeps its FOC (now night 2);
    // the dropped 17/12 (no FOC) maps to the added 20/12 – nothing to carry. The 19/12 line is not re-posted.
    const before19 = (await rooms()).find((l) => l.serviceDate === '2026-12-19')!;
    const mv2 = await act(b.id, 'move', {
      arrivalDate: '2026-12-18',
      departureDate: '2026-12-21',
      reasonCode: 'guest_request',
    });
    expect(mv2.statusCode, mv2.body).toBe(200);
    const r2 = await expectFocOnNight(2);
    expect(r2.map((l) => l.serviceDate)).toEqual(['2026-12-18', '2026-12-19', '2026-12-20']);
    expect(r2[1]!.id).toBe(before19.id);
    // B10 on the eve (0 % tier): the fee never exceeds the booking value.
    await at('2026-12-17T10:00:00+07:00');
    const quote = (await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true })).json()
      .cancellation as { retainedVnd: number };
    expect(quote.retainedVnd).toBeLessThanOrEqual(await value(b));
    // Check in, pay, then B16 dropping night 3 (20/12, no FOC): the FOC stays on 19/12, nothing moves.
    await at('2026-12-18T15:00:00+07:00');
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    expect((await act(b.id, 'check-in', { cardsIssued: 1, houseRulesSent: true })).statusCode).toBe(
      200,
    );
    await at('2026-12-19T10:00:00+07:00');
    const ed = await act(b.id, 'early-departure', {
      newDepartureDate: '2026-12-20',
      noticeGivenAt: '2026-12-19T10:00:00+07:00',
    });
    expect(ed.statusCode, ed.body).toBe(200);
    expect((await rooms()).map((l) => l.serviceDate)).toEqual(['2026-12-18', '2026-12-19']);
    await expectFocOnNight(2);
    // BR-428 base = the dropped night, which carries no FOC.
    expect(ed.json().refundVnd).toBe(applyPct(r2[2]!.amountVnd, 50, 1000));
  });

  it('(B) FOC 200k on an extension child night → B14 property fault keeps the folio total → B16 refund on the net night', async () => {
    await at('2026-11-16T15:00:00+07:00');
    await vacant('401');
    await vacant('402');
    const o = await ota('401', '2026-11-16', '2026-11-18', 1_800_000);
    expect((await act(o.id, 'check-in', { cardsIssued: 1, houseRulesSent: true })).statusCode).toBe(
      200,
    );
    await at('2026-11-17T09:00:00+07:00');
    const ext = await act(o.id, 'extend', { nights: 2 });
    expect(ext.statusCode, ext.body).toBe(200);
    const child = ext.json().childReservation.id as string;
    const childLive = (category: string) =>
      q<{ id: string; amount_vnd: number; service_date: string }>(
        `SELECT l.id, l.amount_vnd, l.service_date::text AS service_date FROM folio_line l
          LEFT JOIN folio_line rel ON rel.id = l.related_line_id
          WHERE l.folio_id = $1 AND l.category = $2 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
            AND COALESCE(rel.reservation_id, l.reservation_id) = $3
            AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
          ORDER BY l.service_date`,
        [o.folioId, category, child],
      );
    const childNights = await childLive('room');
    expect(childNights.map((l) => l.service_date)).toEqual(['2026-11-18', '2026-11-19']);
    await requestFoc(o, childNights[0]!.id, 200_000);
    const total = async () => (await folio(o)).totals.totalVnd as number;
    const before = await total();
    // B14 property fault – resyncs the parent AND the child (round 5); the FOC must not be counted twice.
    const ch = await act(o.id, 'change-room', {
      newRoomId: ids.rooms['402'],
      effectiveDate: '2026-11-17',
      cause: 'property_fault',
      reason: 'Bình nóng lạnh hỏng',
      oldRoomVacated: true,
    });
    expect(ch.statusCode, ch.body).toBe(200);
    expect(await total()).toBe(before);
    const live = await liveLines(o);
    expect(live.filter((l) => l.category === 'foc').map((l) => l.amountVnd)).toEqual([-200_000]);
    // The guest pays the child nights, then leaves a day early (notice the day before → 50 %, BR-428).
    const due = (await folio(o)).totals.balanceDueVnd as number;
    const paid = await c.fd!.send('POST', url(`/folios/${o.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd: due,
    });
    expect(paid.statusCode, paid.body).toBe(201);
    const nets = [...(await childLive('room')), ...(await childLive('foc'))].reduce(
      (a, l) => a + Number(l.amount_vnd),
      0,
    );
    expect(nets).toBe(childNights[0]!.amount_vnd + childNights[1]!.amount_vnd - 200_000);
    const ed = await act(o.id, 'early-departure', {
      newDepartureDate: '2026-11-18',
      noticeGivenAt: '2026-11-17T09:00:00+07:00',
      otaRetainedVnd: 0,
    });
    expect(ed.statusCode, ed.body).toBe(200);
    // Refund basis = the dropped child nights NET of the FOC (not their gross).
    expect(ed.json().refundVnd).toBe(applyPct(nets, 50, 1000));
    // DOM 17/10: a dropped night takes its FOC with it (no FOC moved anywhere else).
    expect(await childLive('foc')).toEqual([]);
    expect(await childLive('room')).toEqual([]);
  });
  // ───────────── Round 8 (s3-round7-verification; DOM 17/10 S4-14): FOC by date when the nights change ─────────────

  const direct = async (room: string, from: string, to: string, adults = 2) => {
    const body = (amountVnd: number) => ({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd },
    });
    let res = await c.fd!.send('POST', url('/reservations'), body(100_000));
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.fd!.send('POST', url('/reservations'), body(res.json().depositRequiredVnd));
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  /** Live lines of a category as [date, amount], by date. */
  const liveBy = async (b: Booking, category: string) =>
    (await liveLines(b))
      .filter((l) => l.category === category)
      .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
  /** Live reductions as [date of the reduced line, category of the reduced line, amount]. */
  const reductions = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const byId = new Map(all.map((l) => [l.id, l]));
    return (await liveLines(b))
      .filter((l) => l.category === 'foc' || l.category === 'discount')
      .map((r) => {
        const rel = byId.get(r.relatedLineId ?? '');
        return [rel?.serviceDate, rel?.category, -r.amountVnd] as const;
      })
      .sort((x, y) => `${x[0]}${x[1]}`.localeCompare(`${y[0]}${y[1]}`));
  };
  const moveTo = async (b: Booking, body: Record<string, unknown>) => {
    const r = await act(b.id, 'move', { reasonCode: 'guest_request', ...body });
    expect(r.statusCode, r.body).toBe(200);
  };
  const totalOf = async (b: Booking) => (await folio(b)).totals.totalVnd as number;

  it("(c2) B7 shorter at the front 16–20/11 → 18–20/11: the kept night keeps its 500k FOC, the dropped night's 100k FOC is cancelled – 916.000", async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('201', '2026-11-16', '2026-11-20');
    const r0 = await liveBy(b, 'room');
    await requestFoc(b, r0[2]!.id, 500_000); // 18/11
    await requestFoc(b, r0[0]!.id, 100_000); // 16/11 (dropped)
    await moveTo(b, { arrivalDate: '2026-11-18', departureDate: '2026-11-20' });
    expect((await liveBy(b, 'room')).map((l) => [l.serviceDate, l.amountVnd])).toEqual([
      ['2026-11-18', 708_000],
      ['2026-11-19', 708_000],
    ]);
    expect(await reductions(b)).toEqual([['2026-11-18', 'room', 500_000]]);
    expect(await totalOf(b)).toBe(916_000);
    expect(await value(b)).toBe(916_000);
  });

  it('(c4) B7 arrival one day later 07–10/12 → 08–10/12: the FOC of the dropped night goes with it – 1.500.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('103', '2026-12-07', '2026-12-10');
    const r0 = await liveBy(b, 'room');
    await requestFoc(b, r0[0]!.id, 750_000);
    await moveTo(b, { arrivalDate: '2026-12-08', departureDate: '2026-12-10' });
    expect(await reductions(b)).toEqual([]);
    expect(await totalOf(b)).toBe(1_500_000);
    expect(await value(b)).toBe(1_500_000);
  });

  it('(d4) B7 two nights added at the front 26–29/11 → 24–29/11: the Saturday keeps its 863k FOC – 3.113.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('102', '2026-11-26', '2026-11-29');
    const r0 = await liveBy(b, 'room');
    expect(r0.map((l) => l.amountVnd)).toEqual([750_000, 863_000, 863_000]);
    const ap = await requestFoc(b, r0[2]!.id, 863_000); // Sat 28/11
    await moveTo(b, { arrivalDate: '2026-11-24', departureDate: '2026-11-29' });
    expect(await reductions(b)).toEqual([['2026-11-28', 'room', 863_000]]);
    expect(await totalOf(b)).toBe(3_113_000);
    const [link] = await q<{ approval_request_id: string }>(
      `SELECT l.approval_request_id FROM folio_line l WHERE l.folio_id = $1 AND l.category = 'foc'
          AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [b.folioId],
    );
    expect(link!.approval_request_id).toBe(ap);
  });

  it('(i) B7 room change by OTTIMO on the same dates: 0 lines re-posted; a pending FOC approved afterwards is posted', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('101', '2026-11-23', '2026-11-27');
    const r0 = await liveBy(b, 'room');
    await requestFoc(b, r0[2]!.id, 400_000);
    const pending = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${r0[0]!.id}/foc`), {
      kind: 'foc',
      amountVnd: 100_000,
      reasonCode: 'service_recovery',
    });
    expect(pending.statusCode, pending.body).toBe(201);
    const count = async () =>
      Number(
        (
          await q<{ n: string }>('SELECT count(*)::text AS n FROM folio_line WHERE folio_id = $1', [
            b.folioId,
          ])
        )[0]!.n,
      );
    const before = await count();
    // BR-429 (b) / BR-434-06 (0.3.7, ESC-019 A): an OTTIMO move keeps the prices – a guest request re-prices.
    await moveTo(b, { roomId: ids.rooms['203'], reasonCode: 'property_fault' });
    expect(await count()).toBe(before);
    expect((await approve('mgr', pending.json().id)).statusCode).toBe(200);
    const [pl] = await q<{ line_state: string }>(
      `SELECT line_state FROM folio_line WHERE approval_request_id = $1`,
      [pending.json().id],
    );
    expect(pl!.line_state).toBe('posted');
    expect(await totalOf(b)).toBe(4 * 667_000 - 400_000 - 100_000);
  });

  it('(g) move with no date in common 02–06/11 → 16–20/11: the room FOC AND the extra-person FOC of night 3 follow to new night 3 – 3.818.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('302', '2026-11-02', '2026-11-06', 4); // standard 3 → 1 extra adult
    const rooms0 = await liveBy(b, 'room');
    const extra0 = await liveBy(b, 'extra_person');
    expect(extra0.map((l) => l.amountVnd)).toEqual([150_000, 150_000, 150_000, 150_000]);
    await requestFoc(b, rooms0[2]!.id, 300_000);
    await requestFoc(b, extra0[2]!.id, 150_000);
    await moveTo(b, { arrivalDate: '2026-11-16', departureDate: '2026-11-20' });
    expect(await reductions(b)).toEqual([
      ['2026-11-18', 'extra_person', 150_000],
      ['2026-11-18', 'room', 300_000],
    ]);
    expect(await totalOf(b)).toBe(3_818_000);
  });

  it('(BR-434-02) B7 overlapping shift 17–20/12 → 18–21/12, FOC 911k on Sat 19/12: the kept date keeps it (no slide to Sun 20/12) – 1.703.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('202', '2026-12-17', '2026-12-20');
    const r0 = await liveBy(b, 'room');
    expect(r0.map((l) => l.amountVnd)).toEqual([792_000, 911_000, 911_000]);
    const ap = await requestFoc(b, r0[2]!.id, 911_000); // Sat 19/12
    const foc0 = (await liveLines(b)).find((l) => l.category === 'foc')!;
    await moveTo(b, { arrivalDate: '2026-12-18', departureDate: '2026-12-21' });
    const r1 = await liveBy(b, 'room');
    expect(r1.map((l) => [l.serviceDate, l.amountVnd])).toEqual([
      ['2026-12-18', 911_000],
      ['2026-12-19', 911_000],
      ['2026-12-20', 792_000],
    ]);
    // Kept dates with an unchanged price: neither the 19/12 line nor its FOC is re-posted.
    expect(r1[0]!.id).toBe(r0[1]!.id);
    expect(r1[1]!.id).toBe(r0[2]!.id);
    expect((await liveLines(b)).find((l) => l.category === 'foc')!.id).toBe(foc0.id);
    expect(await reductions(b)).toEqual([['2026-12-19', 'room', 911_000]]);
    const [link] = await q<{ approval_request_id: string }>(
      'SELECT approval_request_id FROM folio_line WHERE id = $1',
      [foc0.id],
    );
    expect(link!.approval_request_id).toBe(ap);
    expect(await totalOf(b)).toBe(1_703_000);
    expect(await value(b)).toBe(1_703_000);
  });

  it('(BR-434-03) B7 shift + one more night 17–20/12 → 18–22/12, FOC 792k on Thu 17/12 (dropped) → the first added date 20/12 – 2.614.000', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('203', '2026-12-17', '2026-12-20'); // 203 = same list price as 202 (792.000)
    const r0 = await liveBy(b, 'room');
    expect(r0.map((l) => l.amountVnd)).toEqual([792_000, 911_000, 911_000]);
    const ap = await requestFoc(b, r0[0]!.id, 792_000); // Thu 17/12
    await moveTo(b, { arrivalDate: '2026-12-18', departureDate: '2026-12-22' });
    expect((await liveBy(b, 'room')).map((l) => [l.serviceDate, l.amountVnd])).toEqual([
      ['2026-12-18', 911_000],
      ['2026-12-19', 911_000],
      ['2026-12-20', 792_000],
      ['2026-12-21', 792_000],
    ]);
    expect(await reductions(b)).toEqual([['2026-12-20', 'room', 792_000]]);
    const [moved] = await q<{ approval_request_id: string; discount_vnd: string }>(
      `SELECT l.approval_request_id, n.discount_vnd::text
         FROM folio_line l JOIN stay_night n ON n.reservation_id = l.reservation_id AND n.stay_date = '2026-12-20'
          AND n.night_state <> 'void'
        WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [b.folioId],
    );
    expect(moved).toEqual({ approval_request_id: ap, discount_vnd: '792000' });
    expect(await totalOf(b)).toBe(2_614_000);
    expect(await value(b)).toBe(2_614_000);
  });

  it('(g2) overlapping shift 07–10/12 → 08–11/12: the room FOC AND the extra-person FOC of the kept 09/12 stay on 09/12', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('302', '2026-12-07', '2026-12-10', 4); // standard 3 → 1 extra adult
    const rooms0 = await liveBy(b, 'room');
    const extra0 = await liveBy(b, 'extra_person');
    expect(extra0.map((l) => l.amountVnd)).toEqual([150_000, 150_000, 150_000]);
    await requestFoc(b, rooms0[2]!.id, 300_000); // 09/12 = night 3
    await requestFoc(b, extra0[2]!.id, 150_000);
    await moveTo(b, { arrivalDate: '2026-12-08', departureDate: '2026-12-11' });
    expect(await reductions(b)).toEqual([
      ['2026-12-09', 'extra_person', 150_000],
      ['2026-12-09', 'room', 300_000],
    ]);
    const rooms1 = await liveBy(b, 'room');
    const extra1 = await liveBy(b, 'extra_person');
    expect(rooms1.map((l) => l.serviceDate)).toEqual(['2026-12-08', '2026-12-09', '2026-12-10']);
    expect(extra1.map((l) => l.serviceDate)).toEqual(['2026-12-08', '2026-12-09', '2026-12-10']);
    // The kept 09/12 lines are untouched (same price).
    expect(rooms1[1]!.id).toBe(rooms0[2]!.id);
    expect(extra1[1]!.id).toBe(extra0[2]!.id);
    const sum = (ls: Line[]) => ls.reduce((a, l) => a + l.amountVnd, 0);
    expect(await totalOf(b)).toBe(sum(rooms1) + sum(extra1) - 450_000);
  });
});
