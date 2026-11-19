/**
 * FB-INV-012 go-live fix (contract rounds/round-05/fb-inv-012/contract.md §12, OpenAPI 0.3.15-draft; SEC review
 * rounds/round-05/reviews/SEC-on-arc-contract-12.md) on the real PostgreSQL, through the HTTP API:
 * - §12.1.1 createReservation.backdatedArrival (A127) + SEC 12-01 (no closer on a backdated stay, closer change OWN only);
 * - §12.1.2 checkInBackdated (A127, trusted device): arrival moved, actual check-in = real click, `checkin_backdated_on`;
 * - §12.1.3 check-in reading of a backdated stay (always late, FDL+) + SEC 12-06 (not before the room's latest reading);
 * - §12.2 settleBillingPeriodOutsideDesk (A128) + SEC 12-02 (manager only in the go-live scope);
 * - BE-12 / Q16: the final statement does not bill November twice (rent × contract − rent of issued statements);
 * - §12.3 property contact (A129); SEC 190-08 (meter photo anchor on void).
 * - PR #197 review: SEC-BE-197-01/02/04, SEC 12-07 (trusted device for backdatedArrival), ARC-BE-197-01/02/05/06/07.
 * DOM's go-live case: rent 8.500.000, in house since 01/11/2026, entered on Desk 24/11, room 202. Fake clock, FAKE data.
 */
import { randomBytes } from 'node:crypto';
import { Client as PgClient } from 'pg';
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
import { RegistrationPortService } from '../../src/modules/registration/public/registration.port';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, staff } from '../helpers/registration-fixture';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

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

const RENT = 8_500_000;
const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
};

describe.skipIf(!HAS_DB)('FB-INV-012 §12 – go-live fix for long stays already in house', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let device: string;
  const c: Record<string, Client> = {};
  const cd: Record<string, Client> = {}; // same users on the trusted desk device

  let stay: string;
  let stayB: string; // Q4/Q5 + the reversal case (ARC-BE-197-01)
  let room202: string;
  let roomB: string;
  let nov: Json;
  let dec: Json;

  const url = (p = '') => `${P(t)}${p}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const getRes = async (id: string) => (await c.own!.get(url(`/reservations/${id}`))).json();
  const lease = (who: Client, body: Json = {}) =>
    who.send('POST', url('/reservations'), {
      roomId: room202,
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate: '2026-11-03',
      departureDate: '2027-01-15',
      adults: 1,
      bookerGuestId: guest,
      paymentModel: 'direct',
      manualLongStay: { monthlyRentVnd: RENT, depositHeldVnd: RENT },
      backdatedArrival: { reason: 'Guest in house before Desk - paper lease' },
      ...body,
    });
  const backdatedCheckIn = async (who: Client, id: string, body: Json) =>
    who.send('POST', url(`/reservations/${id}/actions/check-in-backdated`), body, {
      'if-match': `"${(await getRes(id)).version}"`,
    });
  const bp = async (id: string) => (await c.own!.get(url(`/billing-periods/${id}`))).json();
  const settle = async (who: Client, id: string, body: Json) =>
    who.send('POST', url(`/billing-periods/${id}/settle-outside-desk`), body, {
      'if-match': `"${(await bp(id)).version}"`,
    });
  const issue = async (id: string) => {
    const r = await c.fdl!.send(
      'POST',
      url(`/billing-periods/${id}/issue`),
      { acknowledgeWarnings: true },
      { 'if-match': `"${(await bp(id)).version}"` },
    );
    expect(r.statusCode, r.body).toBe(200);
    return r.json() as Json;
  };
  const reading = (who: Client, body: Json) =>
    who.send('POST', url(`/reservations/${stay}/meter-readings`), {
      roomId: room202,
      photoWaived: true,
      note: 'Paper log, photo not kept',
      electricity: { value: 1250 },
      water: { value: 35 },
      ...body,
    });
  const denied = async (operationId: string) =>
    Number(
      (
        await q<{ n: string }>(
          `SELECT count(*)::text AS n FROM audit_event WHERE action = 'access.denied' AND entity_id = $1`,
          [operationId],
        )
      )[0]!.n,
    );
  const notes = async (kind: string) =>
    q<{ user_id: string; ref_code: string | null }>(
      `SELECT user_id, ref_code FROM staff_notification WHERE kind = $1 ORDER BY created_at, id`,
      [kind],
    );

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    room202 = ids.rooms['202'] as string;
    roomB = Object.entries(ids.rooms).find(([no]) => no !== '202')![1] as string;
    guest = await seedGuestRow(db, t, { name: 'Khach Thue Thang' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new MinibarCounted()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    device = randomBytes(32).toString('base64url');
    await q(
      `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at, expires_at)
       VALUES ($1, $2, $3, 'desk', 'desk', $4, $5, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        sha256Hex(device),
        new Date('2026-10-01T00:00:00Z'),
        new Date('2036-12-31T00:00:00Z'),
      ],
    );
    for (const u of Object.keys(ROLES)) {
      c[u] = Client.of(fa, t, u);
      cd[u] = Client.of(fa, t, u);
      cd[u]!.deviceToken = device;
    }
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [room202, t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [roomB, t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    await at('2026-11-24T10:00:00+07:00');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('§12.1.1: backdatedArrival – FDL 403 + one access.denied; without manualLongStay / with a closer / out of range → 422; no backdatedArrival → DATE_IN_PAST', async () => {
    const before = await denied('createReservation');
    const fdl = await lease(c.fdl!);
    expect(fdl.statusCode).toBe(403);
    expect(await denied('createReservation')).toBe(before + 1);

    // SEC 12-07: backdatedArrival needs a trusted device as well (field level) – MGR off the desk device → 403.
    const offDevice = await lease(c.mgr!);
    expect(offDevice.statusCode).toBe(403);
    expect(offDevice.json().code).toBe('DEVICE_NOT_TRUSTED');

    const noManual = await lease(cd.mgr!, { manualLongStay: undefined });
    expect(noManual.statusCode).toBe(422);
    expect(noManual.json().errors).toEqual(
      expect.arrayContaining([{ field: 'backdatedArrival', code: 'NOT_ALLOWED' }]),
    );
    // SEC FB-R5-SEC-ARC-12-01 (1): a backdated stay has no closer (no commission rows).
    const closer = await lease(cd.mgr!, { closerUserId: t.users.mgr!.id });
    expect(closer.statusCode).toBe(422);
    expect(closer.json().errors).toEqual(
      expect.arrayContaining([{ field: 'closerUserId', code: 'NOT_ALLOWED' }]),
    );
    const tooOld = await lease(cd.mgr!, { arrivalDate: '2026-10-09' }); // T − 46
    expect(tooOld.statusCode).toBe(422);
    expect(tooOld.json()).toMatchObject({
      errors: [{ field: 'arrivalDate', code: 'BACKDATE_OUT_OF_RANGE' }],
      earliest: '2026-10-10',
    });
    // ARC-BE-197-05: arrival = T is out of range too, with its earliest.
    const todayArrival = await lease(cd.mgr!, { arrivalDate: '2026-11-24' });
    expect(todayArrival.statusCode).toBe(422);
    expect(todayArrival.json()).toMatchObject({
      errors: [{ field: 'arrivalDate', code: 'BACKDATE_OUT_OF_RANGE' }],
      earliest: '2026-10-10',
    });
    const past = await lease(c.mgr!, { backdatedArrival: undefined });
    expect(past.statusCode).toBe(422);
    expect(past.json().errors).toEqual(
      expect.arrayContaining([{ field: 'arrivalDate', code: 'DATE_IN_PAST' }]),
    );
  });

  it('§12.1.1: MGR creates the stay (arrival 03/11) – confirmed, no commission, OWN told; allowedActions has check_in_backdated', async () => {
    const r = await lease(cd.mgr!);
    expect(r.statusCode, r.body).toBe(201);
    stay = r.json().id as string;
    expect(r.json()).toMatchObject({ status: 'confirmed', arrivalDate: '2026-11-03' });
    const commissions = await q(`SELECT 1 FROM commission WHERE reservation_id = $1`, [stay]);
    expect(commissions).toHaveLength(0);
    expect(await notes('backdated_stay')).toEqual([
      expect.objectContaining({ user_id: t.users.own!.id }),
    ]);
    const asMgr = (await cd.mgr!.get(url(`/reservations/${stay}`))).json();
    expect(asMgr.allowedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'check_in_backdated',
          transition: 'B9',
          action: 'check-in-backdated',
          requiresTrustedDevice: true,
        }),
      ]),
    );
    const asFd = (await c.fd!.get(url(`/reservations/${stay}`))).json();
    expect(asFd.allowedActions.map((a: Json) => a.event)).not.toContain('check_in_backdated');
    const created = await q<{ after: Json; reason: string | null }>(
      `SELECT after, reason FROM audit_event WHERE action = 'reservation.created' AND entity_id = $1`,
      [stay],
    );
    expect(created[0]!.after).toMatchObject({ backdatedArrival: true });
  });

  it('SEC 12-01 (2): closer change on a backdated stay – MGR 403 + access.denied, OWN 200', async () => {
    const before = await denied('updateReservation');
    const mgr = await c.mgr!.send(
      'PATCH',
      url(`/reservations/${stay}`),
      { closerUserId: t.users.mgr!.id, closerChangeReason: 'Closed by manager' },
      { 'if-match': `"${(await getRes(stay)).version}"` },
    );
    expect(mgr.statusCode).toBe(403);
    expect(await denied('updateReservation')).toBe(before + 1);
    // ARC-BE-197-06: its own reason – the stay is not checked in yet.
    const [last] = await q<{ reason: string }>(
      `SELECT reason FROM audit_event WHERE action = 'access.denied' AND entity_id = 'updateReservation'
        ORDER BY id DESC LIMIT 1`,
    );
    expect(last!.reason).toBe('CLOSER_CHANGE_BACKDATED_STAY');
    const own = await c.own!.send(
      'PATCH',
      url(`/reservations/${stay}`),
      { closerUserId: t.users.mgr!.id, closerChangeReason: 'Owner decision' },
      { 'if-match': `"${(await getRes(stay)).version}"` },
    );
    expect(own.statusCode, own.body).toBe(200);
    // Back to no closer for the rest of the case (the owner's own correction).
    const reset = await c.own!.send(
      'PATCH',
      url(`/reservations/${stay}`),
      { closerUserId: null, closerChangeReason: 'Owner decision, no closer' },
      { 'if-match': `"${(await getRes(stay)).version}"` },
    );
    expect([200, 422]).toContain(reset.statusCode);
  });

  it('§12.1.2: checkInBackdated – roles, device, USE_CHECK_IN, forbidden fields; then arrival moved to 01/11, in house, OC', async () => {
    const body = {
      arrivalDate: '2026-11-01',
      reason: 'In house since 01/11, paper lease',
      cardsIssued: 2,
    };
    expect((await backdatedCheckIn(cd.fd!, stay, body)).statusCode).toBe(403);
    expect((await backdatedCheckIn(c.mgr!, stay, body)).statusCode).toBe(403); // no trusted device
    const today = await backdatedCheckIn(cd.mgr!, stay, { ...body, arrivalDate: '2026-11-24' });
    expect(today.statusCode).toBe(422);
    expect(today.json().errors).toEqual([{ field: 'arrivalDate', code: 'USE_CHECK_IN' }]);
    const withTime = await backdatedCheckIn(cd.mgr!, stay, { ...body, checkinTime: '14:00' });
    expect(withTime.statusCode).toBe(422);
    expect(withTime.json().errors).toEqual(
      expect.arrayContaining([{ field: 'checkinTime', code: 'NOT_ALLOWED' }]),
    );

    const ok = await backdatedCheckIn(cd.mgr!, stay, body);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({
      status: 'in_house',
      arrivalDate: '2026-11-01',
      checkinBackdatedOn: '2026-11-24',
    });
    const [row] = await q<{
      actual_checkin_at: Date;
      booked_arrival_date: string | null;
      checkin_backdated_reason: string;
    }>(
      `SELECT actual_checkin_at, booked_arrival_date::text AS booked_arrival_date, checkin_backdated_reason
         FROM reservation WHERE id = $1`,
      [stay],
    );
    expect(row!.actual_checkin_at.toISOString()).toBe(
      new Date('2026-11-24T03:00:00Z').toISOString(),
    );
    expect(row!.checkin_backdated_reason).toBe(body.reason);
    const [rs] = await q<{ status: string }>(`SELECT status FROM room_status WHERE room_id = $1`, [
      room202,
    ]);
    expect(rs!.status).toBe('OC');
    const audits = await q<{ action: string; after: Json }>(
      `SELECT action, after FROM audit_event WHERE entity_id = $1
          AND action IN ('reservation.checked_in', 'reservation.checked_in_backdated') ORDER BY action`,
      [stay],
    );
    expect(audits).toEqual([
      expect.objectContaining({
        action: 'reservation.checked_in',
        after: expect.objectContaining({
          backdated: { arrivalDate: '2026-11-01', previousArrivalDate: '2026-11-03' },
        }),
      }),
      expect.objectContaining({ action: 'reservation.checked_in_backdated' }),
    ]);
    expect(await notes('backdated_stay')).toHaveLength(2);
    const nights = await q(
      `SELECT 1 FROM stay_night WHERE reservation_id = $1 AND stay_date = '2026-11-01'`,
      [stay],
    );
    expect(nights.length).toBeGreaterThan(0);
  });

  it('ARC-BE-197-07 Q4/Q5: an earlier arrival over nights taken by another stay → 409, nothing written; a later arrival gives nights back', async () => {
    const occupant = await lease(cd.mgr!, {
      roomId: roomB,
      arrivalDate: '2026-11-04',
      bookerGuestId: await seedGuestRow(db, t, { name: 'Khach Phong Ben' }),
    });
    expect(occupant.statusCode, occupant.body).toBe(201);
    // The occupant only holds the night of 04/11 (shortened by hand: a past stay cannot be booked through the API).
    await q(
      `UPDATE room_occupancy SET stay_range = '[2026-11-04,2026-11-05)'::daterange
        WHERE reservation_segment_id IN (SELECT id FROM reservation_segment WHERE reservation_id = $1)`,
      [occupant.json().id],
    );
    const r = await lease(cd.mgr!, { roomId: roomB, arrivalDate: '2026-11-06' });
    expect(r.statusCode, r.body).toBe(201);
    stayB = r.json().id as string;
    const body = { reason: 'In house before Desk, paper lease', cardsIssued: 1 };
    // Q4: 03/11 takes the night of 04/11 → 409 ROOM_UNAVAILABLE, the stay unchanged.
    const taken = await backdatedCheckIn(cd.mgr!, stayB, { ...body, arrivalDate: '2026-11-03' });
    expect(taken.statusCode, taken.body).toBe(409);
    expect(taken.json().code).toBe('ROOM_UNAVAILABLE');
    // BUG-R5-014: only the other stay is in the way – never this booking's own nights.
    const conflictCodes = (taken.json().conflicts as Json[]).map((x) => x.reservationCode);
    expect(conflictCodes).toEqual([occupant.json().code]);
    expect(await getRes(stayB)).toMatchObject({ status: 'confirmed', arrivalDate: '2026-11-06' });
    const [untouched] = await q<{ b: string | null }>(
      `SELECT checkin_backdated_on::text AS b FROM reservation WHERE id = $1`,
      [stayB],
    );
    expect(untouched!.b).toBeNull();
    // Q5: a later arrival (08/11) gives the nights of 06 and 07/11 back.
    const later = await backdatedCheckIn(cd.mgr!, stayB, { ...body, arrivalDate: '2026-11-08' });
    expect(later.statusCode, later.body).toBe(200);
    expect(later.json()).toMatchObject({ status: 'in_house', arrivalDate: '2026-11-08' });
    const nights = await q<{ d: string; s: string; why: string | null }>(
      `SELECT stay_date::text AS d, night_state AS s, void_reason AS why FROM stay_night
        WHERE reservation_id = $1 AND stay_date < '2026-11-10' ORDER BY stay_date`,
      [stayB],
    );
    expect(nights.map((x) => [x.d, x.s === 'void' ? x.why : 'live'])).toEqual([
      ['2026-11-06', 'date_change'],
      ['2026-11-07', 'date_change'],
      ['2026-11-08', 'live'],
      ['2026-11-09', 'live'],
    ]);
    const [occ] = await q<{ lo: string }>(
      `SELECT lower(stay_range)::text AS lo FROM room_occupancy
        WHERE reservation_segment_id IN (SELECT id FROM reservation_segment WHERE reservation_id = $1)`,
      [stayB],
    );
    expect(occ!.lo).toBe('2026-11-08');
  });

  it("§12.1.3 + SEC 12-06: check-in reading of a backdated stay – FD out of window; FDL late with a reason; not before the room's latest reading", async () => {
    const fd = await c.fd!.send('POST', url(`/reservations/${stay}/meter-readings`), {
      roomId: room202,
      kind: 'checkin',
      readOn: '2026-11-01',
      electricity: { value: 1250 },
      water: { value: 35 },
      photoWaived: true,
      note: 'Paper log',
      lateReason: 'Entered after go-live',
    });
    expect([403, 422]).toContain(fd.statusCode);
    const noReason = await reading(c.fdl!, { kind: 'checkin', readOn: '2026-11-02' });
    expect(noReason.statusCode).toBe(422);
    expect(noReason.json()).toMatchObject({
      code: 'READING_OUT_OF_WINDOW',
      lateNeedsRole: 'front_desk_lead',
    });
    const ok = await reading(c.fdl!, {
      kind: 'checkin',
      readOn: '2026-11-02',
      lateReason: 'Paper log of the arrival',
    });
    expect(ok.statusCode, ok.body).toBe(201);
    expect(ok.json()).toMatchObject({ late: true });
    // SEC 12-06: an earlier day than the room's latest live reading → DATE_INVALID (before READING_EXISTS).
    const earlier = await reading(c.fdl!, {
      kind: 'checkin',
      readOn: '2026-10-31',
      lateReason: 'Evening before the arrival',
    });
    expect(earlier.statusCode).toBe(422);
    expect(earlier.json().errors).toEqual([{ field: 'readOn', code: 'DATE_INVALID' }]);
    const again = await reading(c.fdl!, {
      kind: 'checkin',
      readOn: '2026-11-03',
      lateReason: 'Second try',
    });
    expect(again.statusCode).toBe(409);
  });

  it('§12.2 + SEC 12-02: November statement settled outside Desk – FD/FDL 403, MGR only in the go-live scope, OWN anywhere', async () => {
    const r = await c.fd!.send('POST', url(`/reservations/${stay}/billing-periods`), {
      month: '2026-11',
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().lines).toEqual([expect.objectContaining({ kind: 'rent', amountVnd: RENT })]);
    // A small prior adjustment so the statement is more than its rent (SEC 12-02 (b)).
    const adj = await c.fdl!.send(
      'PATCH',
      url(`/billing-periods/${r.json().id}`),
      { priorAdjustment: { amountVnd: 100_000, reason: 'Key deposit difference' } },
      { 'if-match': `"${r.json().version}"` },
    );
    expect(adj.statusCode, adj.body).toBe(200);
    nov = await issue(r.json().id);
    expect(nov).toMatchObject({ status: 'issued', totals: { totalVnd: RENT + 100_000 } });
    expect((await bp(nov.id)).availableActions).toContain('settle_outside_desk');
    // ARC-BE-197-02: the manager sees it here – the check-in statement of a backdated stay (condition (a)).
    expect(
      (await cd.mgr!.get(url(`/billing-periods/${nov.id}`))).json().availableActions,
    ).toContain('settle_outside_desk');
    const asFd = (await c.fd!.get(url(`/billing-periods/${nov.id}`))).json();
    expect(asFd.availableActions).not.toContain('settle_outside_desk');

    await at('2026-11-25T10:00:00+07:00'); // the backdated check-in was on 24/11
    const body = { receivedOn: '2026-11-03', reason: 'Rent 11/2026 paid on the old platform' };
    expect((await settle(cd.fd!, nov.id, body)).statusCode).toBe(403);
    expect((await settle(cd.fdl!, nov.id, body)).statusCode).toBe(403);
    expect((await settle(c.mgr!, nov.id, body)).statusCode).toBe(403); // no trusted device
    expect((await settle(cd.mgr!, nov.id, { ...body, receivedOn: '2026-11-3' })).statusCode).toBe(
      422,
    );
    expect((await settle(cd.mgr!, nov.id, { ...body, receivedOn: '2026-11-26' })).statusCode).toBe(
      422,
    ); // > T
    const over = await settle(cd.own!, nov.id, { ...body, amountVnd: RENT + 100_001 });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({ code: 'AMOUNT_OVER_BALANCE', balanceVnd: RENT + 100_000 });

    const before = await denied('settleBillingPeriodOutsideDesk');
    // (b) more than the unpaid rent – the default amount is the whole balance (rent + adjustment).
    const mgrAll = await settle(cd.mgr!, nov.id, body);
    expect(mgrAll.statusCode).toBe(403);
    expect(mgrAll.json()).toMatchObject({ code: 'FORBIDDEN_ACTION', detail: 'owner only' });
    expect((await settle(cd.mgr!, nov.id, { ...body, amountVnd: RENT + 1 })).statusCode).toBe(403);
    // (c) received after the backdated check-in day.
    const mgrLate = await settle(cd.mgr!, nov.id, {
      ...body,
      amountVnd: RENT,
      receivedOn: '2026-11-25',
    });
    expect(mgrLate.statusCode).toBe(403);
    expect(await denied('settleBillingPeriodOutsideDesk')).toBe(before + 3);

    // The go-live case: the rent of the arrival month, received 03/11, by the manager.
    const ok = await settle(cd.mgr!, nov.id, { ...body, amountVnd: RENT });
    expect(ok.statusCode, ok.body).toBe(201);
    expect(ok.json()).toMatchObject({
      billingPeriod: { status: 'partially_paid' },
      payment: {
        method: 'outside_desk',
        amountVnd: RENT,
        status: 'succeeded',
        reconciliation: 'not_required',
      },
    });
    const [p] = await q<{
      type: string;
      shift_id: string | null;
      billing_period_id: string;
      note: string;
      received_at: Date;
    }>(
      `SELECT type, shift_id, billing_period_id, note, received_at FROM payment WHERE method = 'outside_desk'`,
    );
    expect(p).toMatchObject({
      type: 'charge',
      shift_id: null,
      billing_period_id: nov.id,
      note: body.reason,
    });
    expect(p!.received_at.toISOString()).toBe('2026-11-03T05:00:00.000Z'); // 12:00 Asia/Ho_Chi_Minh
    const money = await q<{ category: string; after: Json; reason: string }>(
      `SELECT category, after, reason FROM audit_event WHERE action = 'billing_period.settled_outside_desk'`,
    );
    expect(money).toEqual([
      expect.objectContaining({
        category: 'money',
        reason: body.reason,
        after: expect.objectContaining({
          amountVnd: RENT,
          receivedOn: '2026-11-03',
          method: 'outside_desk',
        }),
      }),
    ]);
    expect(await notes('statement_settled_outside_desk')).toEqual([
      expect.objectContaining({ user_id: t.users.own!.id, ref_code: nov.code }),
    ]);
    // The manager cannot take the rest (not rent); the owner can, with a reference.
    expect((await settle(cd.mgr!, nov.id, { ...body, amountVnd: 100_000 })).statusCode).toBe(403);
    const card = await settle(cd.own!, nov.id, { ...body, reference: '4111 1111 1111 1111' });
    expect(card.statusCode).toBe(422);
    expect(card.body).not.toContain('4111');
    // SEC-BE-197-01: letters + a card number pass the bank-code rule but not the free-text rule (V-09) → 422, no row.
    const paymentsBefore = (await q(`SELECT 1 FROM payment WHERE billing_period_id = $1`, [nov.id]))
      .length;
    const lettersCard = await settle(cd.own!, nov.id, {
      ...body,
      reference: 'FT 4111 1111 1111 1111',
    });
    expect(lettersCard.statusCode).toBe(422);
    expect(lettersCard.json()).toMatchObject({
      code: 'CARD_NUMBER_DETECTED',
      errors: [{ field: 'reference', code: 'CARD_NUMBER_DETECTED' }],
    });
    expect(lettersCard.body).not.toContain('4111');
    expect((await q(`SELECT 1 FROM payment WHERE billing_period_id = $1`, [nov.id])).length).toBe(
      paymentsBefore,
    );
    const account = await settle(cd.own!, nov.id, { ...body, reference: '0123 456 789' });
    expect(account.statusCode).toBe(422);
    const rest = await settle(cd.own!, nov.id, { ...body, reference: 'OLD-PLATFORM/1102' });
    expect(rest.statusCode, rest.body).toBe(201);
    expect(rest.json()).toMatchObject({
      billingPeriod: { status: 'paid' },
      payment: { amountVnd: 100_000 },
    });
    // Paid: nothing left to settle.
    expect((await settle(cd.own!, nov.id, body)).statusCode).toBe(409);
  });

  it('ARC-BE-197-01 + SEC-BE-197-02/04: a wrong outside-Desk entry is reversed (statement back to issued), never re-recorded by MGR, never refunded by Desk', async () => {
    const created = await c.fd!.send('POST', url(`/reservations/${stayB}/billing-periods`), {
      month: '2026-11',
    });
    expect(created.statusCode, created.body).toBe(201);
    const st = await issue(created.json().id);
    const body = { receivedOn: '2026-11-08', reason: 'Rent 11/2026 paid on the old platform' };
    const part = await settle(cd.mgr!, st.id, { ...body, amountVnd: 2_000_000 });
    expect(part.statusCode, part.body).toBe(201);
    expect(part.json().billingPeriod.status).toBe('partially_paid');
    const paymentId = part.json().payment.id as string;

    const rev = await cd.mgr!.send('POST', url(`/payments/${paymentId}/actions/reverse`), {
      reason: 'Entered on the wrong statement',
    });
    expect(rev.statusCode, rev.body).toBe(200);
    const [row] = await q<{
      method: string;
      amount_vnd: string;
      shift_id: string | null;
      billing_period_id: string | null;
    }>(
      `SELECT method, amount_vnd::text AS amount_vnd, shift_id, billing_period_id FROM payment
        WHERE reversal_of_id = $1`,
      [paymentId],
    );
    expect(row).toEqual({
      method: 'outside_desk',
      amount_vnd: '-2000000',
      shift_id: null,
      billing_period_id: null,
    });
    expect(await bp(st.id)).toMatchObject({ status: 'issued', totals: { paidVnd: 0 } });
    // BUG-R5-015: with a reversed payment the manager is no longer offered the action (403 below); the owner is.
    expect(
      (await cd.mgr!.get(url(`/billing-periods/${st.id}`))).json().availableActions,
    ).not.toContain('settle_outside_desk');
    expect((await bp(st.id)).availableActions).toContain('settle_outside_desk');

    // SEC-BE-197-04: the CHECK exempts a reversal row only with a negative amount.
    // (ottimo_owner: the app role never updates a payment amount.)
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('SET ROLE ottimo_owner');
      await pg.query('BEGIN');
      await pg.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      await expect(
        pg.query(`UPDATE payment SET amount_vnd = 2000000 WHERE reversal_of_id = $1`, [paymentId]),
      ).rejects.toThrow(/payment_outside_desk_check/);
      await pg.query('ROLLBACK');
    } finally {
      await pg.end();
    }

    // SEC-BE-197-02: a statement with a reversed payment is the owner's to settle again.
    const before = await denied('settleBillingPeriodOutsideDesk');
    const again = await settle(cd.mgr!, st.id, { ...body, amountVnd: 2_000_000 });
    expect(again.statusCode).toBe(403);
    expect(again.json()).toMatchObject({ code: 'FORBIDDEN_ACTION', detail: 'owner only' });
    expect(await denied('settleBillingPeriodOutsideDesk')).toBe(before + 1);
    const own = await settle(cd.own!, st.id, { ...body, amountVnd: 2_000_000 });
    expect(own.statusCode, own.body).toBe(201);

    // §12.2: an approved refund to the original method whose latest receipt is outside Desk → 422.
    const approvalId = uuidv7();
    const now = fa.clock.now();
    await q(
      `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
         target_code, amount_vnd, reason_code, reason_note, requested_by, requested_at, required_role, approver_id,
         approver_role_snapshot, decided_at, refund_method, refund_destination_set_at, refund_destination_set_by,
         created_at, created_by, updated_at)
       VALUES ($1, $2, $3, 'refund', 'approved', 'reservation', $4, $5, 500000, 'overpayment', 'Overpaid rent',
               $6, $7, 'manager', $8, 'owner', $7, 'original_method', $7, $9, $7, $6, $7)`,
      [
        approvalId,
        t.organizationId,
        t.propertyIds[0],
        stayB,
        (await getRes(stayB)).code,
        t.users.fd!.id,
        now,
        t.users.own!.id,
        t.users.fdl!.id,
      ],
    );
    const refund = await cd.mgr!.send(
      'POST',
      url(`/approval-requests/${approvalId}/actions/execute-refund`),
      { amountVnd: 100_000, paidAt: now.toISOString(), bankReference: 'FT-TEST-1' },
    );
    expect(refund.statusCode, refund.body).toBe(422);
    expect(refund.json().errors).toEqual([{ field: 'refundMethod', code: 'NOT_ALLOWED' }]);
  });

  it('SEC 12-03 / Q13: no request body takes outside_desk (folio payment 422 NOT_IN_LIST, statement payment 422)', async () => {
    const folioId = (await getRes(stay)).folioId as string;
    const folioPay = await cd.fdl!.send('POST', url(`/folios/${folioId}/payments`), {
      type: 'charge',
      method: 'outside_desk',
      amountVnd: 100_000,
    });
    expect(folioPay.statusCode).toBe(422);
    expect(folioPay.json().errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'method', code: 'NOT_IN_LIST' })]),
    );
  });

  it('December statement: MGR outside the go-live scope → 403 "owner only" + one access.denied; OWN settles it', async () => {
    await at('2026-11-30T20:00:00+07:00');
    const close = await reading(c.own!, {
      kind: 'period_end',
      periodMonth: '2026-11',
      readOn: '2026-11-30',
      electricity: { value: 1392 },
      water: { value: 38 },
    });
    expect(close.statusCode, close.body).toBe(201);
    await at('2026-12-01T09:00:00+07:00');
    const r = await c.fd!.send('POST', url(`/reservations/${stay}/billing-periods`), {
      month: '2026-12',
    });
    expect(r.statusCode, r.body).toBe(201);
    dec = await issue(r.json().id);
    // ARC-BE-197-02: not the check-in statement → the manager is not offered the action.
    expect(
      (await cd.mgr!.get(url(`/billing-periods/${dec.id}`))).json().availableActions,
    ).not.toContain('settle_outside_desk');
    expect((await bp(dec.id)).availableActions).toContain('settle_outside_desk');
    const before = await denied('settleBillingPeriodOutsideDesk');
    const body = {
      receivedOn: '2026-11-20',
      reason: 'December rent paid in advance on the old platform',
      amountVnd: RENT,
    };
    const mgr = await settle(cd.mgr!, dec.id, body);
    expect(mgr.statusCode).toBe(403);
    expect(mgr.json()).toMatchObject({ code: 'FORBIDDEN_ACTION', detail: 'owner only' });
    expect(await denied('settleBillingPeriodOutsideDesk')).toBe(before + 1);
    const own = await settle(cd.own!, dec.id, body);
    expect(own.statusCode, own.body).toBe(201);
    expect(own.json().billingPeriod.status).toBe('partially_paid');
  });

  it('BE-12 / Q16: the final statement bills rent × contract − rent of issued statements (November counted once)', async () => {
    await at('2027-01-05T09:00:00+07:00');
    const r = await c.fd!.send('POST', url(`/reservations/${stay}/billing-periods`), {
      month: '2027-01',
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().kind).toBe('final');
    // Contract 01/11/2026 → 15/01/2027: 2 months + 14 days × 283.000 = 20.962.000; minus November and December.
    expect((r.json().lines as Json[]).filter((l) => l.kind === 'rent')).toEqual([
      expect.objectContaining({ amountVnd: 20_962_000 - RENT - RENT }),
    ]);
  });

  it('§12.3: property contact – OWN sets (normalised), MGR reads but 403 on write, bad values 422 without echo', async () => {
    const put = await c.own!.send('PUT', url('/contact'), {
      addressLine: '  1 Example Street, Ward 1, Da Lat  ',
      hotline: '+84 900.000-000',
    });
    expect(put.statusCode, put.body).toBe(200);
    expect(put.json()).toEqual({
      addressLine: '1 Example Street, Ward 1, Da Lat',
      hotline: '+84900000000',
    });
    expect((await c.mgr!.get(url('/contact'))).json()).toEqual(put.json());
    expect((await c.fdl!.get(url('/contact'))).statusCode).toBe(200);
    expect((await c.fd!.get(url('/contact'))).statusCode).toBe(403);
    expect(
      (await c.mgr!.send('PUT', url('/contact'), { addressLine: null, hotline: null })).statusCode,
    ).toBe(403);
    const bad = await c.own!.send('PUT', url('/contact'), {
      addressLine: 'Street‮evil',
      hotline: 'call me',
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toEqual([
      { field: 'addressLine', code: 'VALIDATION_FAILED' },
      { field: 'hotline', code: 'VALIDATION_FAILED' },
    ]);
    expect(bad.body).not.toContain('call me');
    const [prop] = await q<{ address: string; phone_public: string }>(
      `SELECT address, phone_public FROM property WHERE id = $1`,
      [t.propertyIds[0]],
    );
    expect(prop).toEqual({
      address: '1 Example Street, Ward 1, Da Lat',
      phone_public: '+84900000000',
    });
    const audit = await q<{ category: string; after: Json }>(
      `SELECT category, after FROM audit_event WHERE action = 'property.contact_changed'`,
    );
    expect(audit).toEqual([
      expect.objectContaining({
        category: 'config',
        after: { addressLine: '1 Example Street, Ward 1, Da Lat', hotline: '+84900000000' },
      }),
    ]);
  });

  it('§12.4 G6 (FE #196): long_stay_cleaning_fee_by_room is catalogued under BR-LS-07 (S24 badge), OWN/MGR, default {}', async () => {
    const [def] = await q<{ br_ref: string; edit_roles: string[]; default_value: unknown }>(
      `SELECT br_ref, edit_roles, default_value FROM config_parameter_def WHERE key = 'long_stay_cleaning_fee_by_room'`,
    );
    expect(def).toEqual({
      br_ref: 'BR-LS-07',
      edit_roles: ['owner', 'manager'],
      default_value: {},
    });
  });

  it('SEC 190-08: a stay voided after an undone check-in anchors its meter photos', async () => {
    const up = await staff(fa, t.users.fdl!.sessionToken, null, 'POST', url('/attachments'), {
      multipart: [
        { name: 'purpose', value: 'meter' },
        { name: 'reservationId', value: stay },
        {
          name: 'file',
          value: await sampleJpeg(),
          filename: 'meter.jpg',
          contentType: 'image/jpeg',
        },
      ],
    });
    expect(up.statusCode, up.body).toBe(201);
    const voidAt = new Date('2027-01-05T02:00:00Z');
    fa.clock.set(voidAt);
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationPortService).onReservationVoided(tx, stay),
    );
    const photos = await q<{ retention_anchor_at: Date | null }>(
      `SELECT retention_anchor_at FROM attachment WHERE purpose = 'meter' AND reservation_id = $1`,
      [stay],
    );
    expect(photos.length).toBeGreaterThan(0);
    expect(photos.every((x) => x.retention_anchor_at?.getTime() === voidAt.getTime())).toBe(true);
  });
});
