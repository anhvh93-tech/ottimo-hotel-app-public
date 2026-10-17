/**
 * Round 6 (MONEY, s3-round5-verification) – an approved FOC through the night sync, on the real PostgreSQL and
 * the real endpoints (DOM 17/10, BR-431/BR-434: "FOC đi theo dòng mới = min(FOC đã duyệt, giá mới)", no
 * re-approval, never more; a dropped night takes its FOC with it; B8 to other dates → the new nights in order):
 * - (A) FOC 300k → B8 move to other dates → the FOC is on the first new night; PATCH people → still 300k once;
 *   booking value = rooms − 300k; the B10 fee never exceeds it.
 * - (B) FOC 200k on a night of an extension child booking → B14 property fault (resyncs parent + child) → folio
 *   total unchanged → B16 → the refund basis is the net night.
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

  it('(A) FOC 300k → B8 to other dates → follows the first new night (min) → PATCH people → kept once; value and B10 fee right', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await create({
      roomId: ids.rooms['101'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2026-12-07',
      departureDate: '2026-12-10',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
    });
    const nights0 = (await liveLines(b))
      .filter((l) => l.category === 'room')
      .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
    const focId = await requestFoc(b, nights0[0]!.id, 300_000);
    const rooms = async () =>
      (await liveLines(b))
        .filter((l) => l.category === 'room')
        .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
    const focs = async () => (await liveLines(b)).filter((l) => l.category === 'foc');
    // B8: the whole stay to other dates (guest request) – nights re-priced on the new dates.
    const mv = await act(b.id, 'move', {
      arrivalDate: '2026-12-14',
      departureDate: '2026-12-17',
      reasonCode: 'guest_request',
    });
    expect(mv.statusCode, mv.body).toBe(200);
    let r1 = await rooms();
    expect(r1.map((l) => l.serviceDate)).toEqual(['2026-12-14', '2026-12-15', '2026-12-16']);
    let f1 = await focs();
    expect(f1).toHaveLength(1);
    expect(f1[0]).toMatchObject({
      amountVnd: -Math.min(300_000, r1[0]!.amountVnd),
      relatedLineId: r1[0]!.id,
    });
    const [night] = await q<{ discount_vnd: number }>(
      `SELECT discount_vnd FROM stay_night WHERE reservation_id = $1 AND stay_date = '2026-12-14'`,
      [b.id],
    );
    expect(Number(night!.discount_vnd)).toBe(300_000);
    const roomSum = (ls: Line[]) => ls.reduce((a, l) => a + l.amountVnd, 0);
    expect(await value(b)).toBe(roomSum(r1) - 300_000);
    // The FOC line keeps its approval (no re-approval).
    const [link] = await q<{ approval_request_id: string }>(
      `SELECT approval_request_id FROM folio_line WHERE id = $1`,
      [f1[0]!.id],
    );
    expect(link!.approval_request_id).toBe(focId);
    // PATCH people (another resync): still exactly one FOC of 300k on the first night.
    const v = await version(b.id);
    const patch = await c.fd!.send(
      'PATCH',
      url(`/reservations/${b.id}`),
      { adults: 1 },
      { 'if-match': `"${v}"` },
    );
    expect(patch.statusCode, patch.body).toBe(200);
    r1 = await rooms();
    f1 = await focs();
    expect(f1.map((l) => l.amountVnd)).toEqual([-300_000]);
    expect(f1[0]!.relatedLineId).toBe(r1[0]!.id);
    expect(await value(b)).toBe(roomSum(r1) - 300_000);
    // B10 (0 % tier on the eve of arrival): the fee never exceeds the booking value.
    await at('2026-12-13T10:00:00+07:00');
    const quote = (await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true })).json()
      .cancellation as { retainedVnd: number };
    expect(quote.retainedVnd).toBeLessThanOrEqual(await value(b));
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
});
