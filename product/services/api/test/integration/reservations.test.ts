/**
 * Reservations on the real PostgreSQL through the HTTP surface (BE-A Sprint 2): EP02 + EP11 R2 + US-139.
 * B2 direct/OTA/AC5a, ADR-009 double booking (20 concurrent requests), OTA unassigned lane + B7a, B7/B8,
 * B5/B10 (+ dryRun), B11/B12, B3 + J1 hold expiry exactly once, SM-02 OOO blocks, rack role views + p95,
 * availability, BR-812 kit tasks, scopes, history. Fake clock: T0 = Thu 15/10/2026 09:00 (VN).
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import { HOLD_EXPIRY_JOB_KEY } from '../../src/jobs/reservation-jobs';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  hk: ['housekeeping'],
  mt: ['maintenance'],
  sal: ['sales_staff'],
  ctv: ['collaborator'],
  sal2: ['sales_staff'],
};

describe.skipIf(!HAS_DB)('reservations – EP02 / EP11 R2 / US-139 (BE-A Sprint 2)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(30);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Nguyễn Thị Hà' });
    fa = await startFeatureApp(db);
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
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
  const direct = (over: Record<string, unknown> = {}) => ({
    roomId: ids.rooms['202'],
    channelId: ids.channels.zalo_phone,
    directSource: 'zalo_phone',
    arrivalDate: '2026-11-09',
    departureDate: '2026-11-16',
    adults: 2,
    bookerGuestId: guest,
    paymentModel: 'direct',
    initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_600_000 },
    ...over,
  });
  const ota = (over: Record<string, unknown> = {}) => ({
    roomId: ids.rooms['203'],
    channelId: ids.channels.airbnb,
    arrivalDate: '2026-12-01',
    departureDate: '2026-12-03',
    adults: 2,
    bookerGuestId: guest,
    paymentModel: 'ota_prepaid',
    otaRef: `HM${randomUUID().slice(0, 8)}`,
    otaRoomAmountVnd: 2_000_000,
    ...over,
  });
  const create = (body: Record<string, unknown>, who = 'fd') =>
    c[who]!.send('POST', url('/reservations'), body);
  const action = (
    id: string,
    verb: string,
    version: number,
    body: Record<string, unknown>,
    who = 'fd',
  ) =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${version}"`,
    });
  const get = async (id: string, who = 'fd') =>
    (await c[who]!.get(url(`/reservations/${id}`))).json();
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;

  it('B2 direct booking (US-017 AC1, BR-107/305, US-023): priced, coded, inventory + nights + folio', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const res = await create(direct());
    expect(res.statusCode, res.body).toBe(201);
    const r = res.json();
    expect(r.code).toMatch(/^OTM-\d{5}$/);
    expect(res.headers.etag).toBe(`"${r.version}"`);
    expect(res.headers.location).toContain(r.id);
    expect(r).toMatchObject({
      status: 'confirmed',
      stayType: 'short',
      totalRoomVnd: 5_205_000,
      depositRequiredVnd: 1_600_000,
      conflictState: 'none',
      extraGuestCount: 0,
      nights: 7,
    });
    expect(r.nightlyRates.map((n: { amountVnd: number }) => n.amountVnd)).toEqual([
      713_000, 713_000, 713_000, 713_000, 820_000, 820_000, 713_000,
    ]);
    expect(r.allowedActions.map((a: { event: string }) => a.event)).toEqual(['move', 'cancel']);
    const occ = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM room_occupancy o JOIN reservation_segment s ON s.id = o.reservation_segment_id
        WHERE s.reservation_id = $1 AND o.active AND o.kind = 'reservation'`,
      [r.id],
    );
    expect(occ[0]!.n).toBe(1);
    const nights = await q<{ n: number; total: number }>(
      `SELECT count(*)::int AS n, sum(room_revenue_vnd)::int AS total FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold'`,
      [r.id],
    );
    expect(nights[0]).toEqual({ n: 7, total: 5_205_000 });
    const st = await q<{ event_code: string }>(
      `SELECT event_code FROM state_transition WHERE entity_id = $1`,
      [r.id],
    );
    expect(st.map((x) => x.event_code)).toEqual(['B2']);
    const money = await q<{ action: string }>(
      `SELECT action FROM audit_event WHERE entity_id = $1 AND category = 'money'`,
      [r.id],
    );
    expect(money.map((m) => m.action)).toContain('reservation.priced');
    const outbox = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'channel.availability_changed' AND payload::text LIKE $1`,
      [`%${ids.rooms['202']}%`],
    );
    expect(outbox[0]!.n).toBeGreaterThanOrEqual(1);
  });

  it('B2 field rules: deposit, phone, capacity, direct source, past date, long stay, window', async () => {
    const r1 = await create(
      direct({
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
        arrivalDate: '2027-01-11',
        departureDate: '2027-01-18',
      }),
    );
    expect(r1.statusCode).toBe(422);
    expect(r1.json()).toMatchObject({
      code: 'DEPOSIT_INSUFFICIENT',
      depositRequiredVnd: expect.any(Number),
    });
    const noPhone = await seedGuestRow(db, t, { phone: null });
    expect((await create(direct({ bookerGuestId: noPhone }))).json().code).toBe('PHONE_REQUIRED');
    const cap = await create(direct({ adults: 4 }));
    expect(cap.statusCode).toBe(422);
    expect(cap.json()).toMatchObject({ code: 'CAPACITY_EXCEEDED', max: 3 });
    const src = await create(direct({ directSource: undefined }));
    expect(src.json().errors).toContainEqual({ field: 'directSource', code: 'REQUIRED' });
    const past = await create(direct({ arrivalDate: '2026-10-14' }));
    expect(past.json().errors).toContainEqual({ field: 'arrivalDate', code: 'DATE_IN_PAST' });
    const long = await create(direct({ arrivalDate: '2027-02-01', departureDate: '2027-03-01' }));
    expect(long.json().errors).toContainEqual({
      field: 'departureDate',
      code: 'LONG_STAY_REQUIRES_CONTRACT',
    });
    const win = await create(direct({ arrivalDate: '2027-10-20', departureDate: '2027-10-22' }));
    expect(win.json().code).toBe('OUTSIDE_BOOKING_WINDOW');
    const card = await create(direct({ internalNote: 'thẻ 4111 1111 1111 1111' }));
    expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
    const unassigned = await create(direct({ allowUnassigned: true }));
    expect(unassigned.json().errors).toContainEqual({
      field: 'allowUnassigned',
      code: 'ALLOW_UNASSIGNED_OTA_ONLY',
    });
  });

  it('US-018 AC1/AC3: overlapping booking → 409 ROOM_UNAVAILABLE + conflicts + suggestions; back-to-back is fine', async () => {
    const res = await create(
      direct({
        arrivalDate: '2026-11-15',
        departureDate: '2026-11-17',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
      }),
    );
    expect(res.statusCode).toBe(409);
    const p = res.json();
    expect(p.code).toBe('ROOM_UNAVAILABLE');
    expect(p.conflicts).toEqual([
      expect.objectContaining({
        roomNo: '202',
        nights: ['2026-11-15'],
        kind: 'reservation',
        reservationCode: expect.stringMatching(/^OTM-/),
        guestDisplayName: 'Nguyễn Thị Hà',
      }),
    ]);
    // Same group (L12) first, never the requested room, other groups flagged as upgrade (BR-316).
    expect(p.suggestions[0]).toMatchObject({ roomGroupCode: 'L12', upgrade: false });
    expect(p.suggestions.map((s: { roomNo: string }) => s.roomNo)).not.toContain('202');
    expect(p.suggestions.some((s: { upgrade: boolean }) => s.upgrade)).toBe(true);
    const next = await create(
      direct({
        arrivalDate: '2026-11-16',
        departureDate: '2026-11-18',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
      }),
    );
    expect(next.statusCode, next.body).toBe(201);
  });

  it('US-018 AC2 / ADR-009: 20 concurrent requests on the same room-night → exactly 1 succeeds', async () => {
    const bodies = Array.from({ length: 20 }, () =>
      direct({
        roomId: ids.rooms['101'],
        arrivalDate: '2026-12-08',
        departureDate: '2026-12-09',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
      }),
    );
    const before = await q<{ n: number }>(`SELECT count(*)::int AS n FROM reservation`);
    const results = await Promise.all(bodies.map((b) => create(b)));
    const codes = results.map((r) => r.statusCode).sort();
    expect(codes.filter((s) => s === 201)).toHaveLength(1);
    expect(codes.filter((s) => s === 409)).toHaveLength(19);
    for (const r of results.filter((x) => x.statusCode === 409))
      expect(r.json().code).toBe('ROOM_UNAVAILABLE');
    const after = await q<{ n: number }>(`SELECT count(*)::int AS n FROM reservation`);
    expect(after[0]!.n - before[0]!.n).toBe(1);
    const occ = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM room_occupancy WHERE room_id = $1 AND active AND stay_range && '[2026-12-08,2026-12-09)'::daterange`,
      [ids.rooms['101']],
    );
    expect(occ[0]!.n).toBe(1);
    // US-023: codes are never reused or skipped by the rolled-back requests.
    const codesAll = (await q<{ code: string }>(`SELECT code FROM reservation ORDER BY code`)).map(
      (r) => Number(r.code.slice(4)),
    );
    expect(codesAll).toEqual(codesAll.map((_, i) => codesAll[0]! + i));
  });

  it('BR-812: 3 adults in Studio 202 → kit task due 14:00 on arrival; fewer guests → task cancelled', async () => {
    const res = await create(
      direct({
        adults: 3,
        arrivalDate: '2026-11-23',
        departureDate: '2026-11-26',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 800_000 },
      }),
    );
    expect(res.statusCode, res.body).toBe(201);
    const r = res.json();
    expect(r.extraGuestCount).toBe(1);
    const tasks = await q<{ type: string; status: string; quantity: number; due_at: Date }>(
      `SELECT type, status, quantity, due_at FROM hk_task WHERE reservation_id = $1`,
      [r.id],
    );
    expect(tasks).toEqual([
      {
        type: 'extra_guest_kit_prepare',
        status: 'open',
        quantity: 1,
        due_at: new Date('2026-11-23T14:00:00+07:00'),
      },
    ]);
    const patched = await c.fd!.send(
      'PATCH',
      url(`/reservations/${r.id}`),
      { adults: 2 },
      { 'if-match': `"${r.version}"` },
    );
    expect(patched.statusCode, patched.body).toBe(200);
    expect(patched.json().extraGuestCount).toBe(0);
    const after = await q<{ status: string }>(
      `SELECT status FROM hk_task WHERE reservation_id = $1`,
      [r.id],
    );
    expect(after).toEqual([{ status: 'cancelled' }]);
    const stale = await c.fd!.send(
      'PATCH',
      url(`/reservations/${r.id}`),
      { adults: 3 },
      { 'if-match': `"${r.version}"` },
    );
    expect(stale.statusCode).toBe(412);
    expect(stale.json()).toMatchObject({ code: 'VERSION_CONFLICT', currentVersion: r.version + 1 });
    const over = await c.fd!.send(
      'PATCH',
      url(`/reservations/${r.id}`),
      { adults: 4 },
      { 'if-match': `"${r.version + 1}"` },
    );
    expect(over.json().code).toBe('CAPACITY_EXCEEDED');
  });

  it('US-139 / B7b + B7a: OTA into a full room → 409 + suggestions, then unassigned lane, then assign', async () => {
    const first = await create(ota());
    expect(first.statusCode, first.body).toBe(201);
    expect(first.json().nightlyRates.map((n: { amountVnd: number }) => n.amountVnd)).toEqual([
      1_000_000, 1_000_000,
    ]);
    const clash = await create(ota());
    expect(clash.statusCode).toBe(409);
    expect(clash.json().suggestions.length).toBeGreaterThan(0);
    const kept = await create(ota({ allowUnassigned: true }));
    expect(kept.statusCode, kept.body).toBe(201);
    const r = kept.json();
    expect(r).toMatchObject({ status: 'confirmed', conflictState: 'open', extraGuestCount: 0 });
    expect(r.segments).toEqual([expect.objectContaining({ roomId: null, roomNo: null })]);
    expect(r.allowedActions.map((a: { event: string }) => a.event)).toContain('assign_room');
    const incidents = (await c.fd!.get(url('/overbooking-incidents?status=open'))).json().data;
    expect(incidents).toContainEqual(
      expect.objectContaining({
        reservationId: r.id,
        status: 'open',
        source: 'desk',
        requestedRoomNo: '203',
      }),
    );
    const push = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'staff.push' AND payload->>'refId' = $1`,
      [r.id],
    );
    expect(push[0]!.n).toBe(1);
    const rack = (await c.fd!.get(url('/rack?from=2026-11-28&days=14'))).json();
    expect(rack.unassigned).toContainEqual(
      expect.objectContaining({ reservationId: r.id, conflictState: 'open' }),
    );
    // Upgrade (other group) needs FDL+ (BR-312 (4)(ii)); same group by FD.
    const up = await action(r.id, 'assign-room', r.version, {
      roomId: ids.rooms['301'],
      resolution: 'upgraded',
    });
    expect(up.statusCode).toBe(403);
    const wrong = await action(
      r.id,
      'assign-room',
      r.version,
      { roomId: ids.rooms['301'], resolution: 'reassigned_same_group' },
      'fdl',
    );
    expect(wrong.statusCode).toBe(422);
    const ok = await action(r.id, 'assign-room', r.version, {
      roomId: ids.rooms['201'],
      resolution: 'reassigned_same_group',
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({
      conflictState: 'resolved',
      segments: [expect.objectContaining({ roomNo: '201' })],
    });
    const resolved = (await c.fd!.get(url('/overbooking-incidents?status=resolved'))).json().data;
    expect(resolved).toContainEqual(
      expect.objectContaining({ reservationId: r.id, resolution: 'reassigned_same_group' }),
    );
  });

  it('BR-312 relocation outside (MGR+): incident resolved with cost, booking cancelled overbooking_relocated', async () => {
    await create(
      ota({ roomId: ids.rooms['402'], arrivalDate: '2027-01-05', departureDate: '2027-01-06' }),
    );
    const kept = (
      await create(
        ota({
          roomId: ids.rooms['402'],
          arrivalDate: '2027-01-05',
          departureDate: '2027-01-06',
          allowUnassigned: true,
        }),
      )
    ).json();
    const inc = (await c.mgr!.get(url('/overbooking-incidents?status=open')))
      .json()
      .data.find((i: { reservationId: string }) => i.reservationId === kept.id);
    expect(
      (
        await c.fd!.send('POST', url(`/overbooking-incidents/${inc.id}/actions/resolve-external`), {
          costVnd: 500_000,
          note: 'Dời sang cơ sở gần',
        })
      ).statusCode,
    ).toBe(403);
    const res = await c.mgr!.send(
      'POST',
      url(`/overbooking-incidents/${inc.id}/actions/resolve-external`),
      { costVnd: 500_000, note: 'Dời sang cơ sở gần' },
    );
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({
      status: 'resolved',
      resolution: 'relocated_external',
      costVnd: 500_000,
    });
    expect(await get(kept.id)).toMatchObject({
      status: 'cancelled',
      cancellation: { reasonCode: 'overbooking_relocated' },
    });
  });

  it('BR-113: Friday arrival 1 night → MIN_STAY_NOT_MET; FD override 403, FDL override with a reason → 201', async () => {
    const body = direct({
      roomId: ids.rooms['102'],
      arrivalDate: '2026-10-23',
      departureDate: '2026-10-24',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 400_000 },
    });
    const res = await create(body);
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toContainEqual({ field: 'departureDate', code: 'MIN_STAY_NOT_MET' });
    expect(
      (await create({ ...body, minStayOverrideReason: 'Khách quen, đã thỏa thuận' })).statusCode,
    ).toBe(403);
    const ok = await create({ ...body, minStayOverrideReason: 'Khách quen, đã thỏa thuận' }, 'fdl');
    expect(ok.statusCode, ok.body).toBe(201);
  });

  it('US-017 AC5a: manual long stay (externalContract) – on the rack as long_stay, no nightly prices', async () => {
    const res = await create({
      roomId: ids.rooms['302'],
      channelId: ids.channels.zalo_phone,
      directSource: 'zalo_phone',
      arrivalDate: '2026-11-01',
      departureDate: '2027-05-01',
      adults: 1,
      bookerGuestId: guest,
      paymentModel: 'direct',
      manualLongStay: {
        monthlyRentVnd: 9_500_000,
        externalContractRef: 'HĐ-2026-031',
        depositHeldVnd: 9_500_000,
      },
    });
    expect(res.statusCode, res.body).toBe(201);
    const r = res.json();
    expect(r).toMatchObject({
      stayType: 'long',
      externalContract: true,
      manualLongStay: { monthlyRentVnd: 9_500_000, externalContractRef: 'HĐ-2026-031' },
    });
    expect(r.nightlyRates).toBeUndefined();
    const nights = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM stay_night WHERE reservation_id = $1`,
      [r.id],
    );
    expect(nights[0]!.n).toBe(0);
    const rack = (await c.fd!.get(url('/rack?from=2026-11-01&days=7'))).json();
    const room = rack.rooms.find((x: { roomNo: string }) => x.roomNo === '302');
    expect(room.bars).toContainEqual(
      expect.objectContaining({ kind: 'long_stay', reservationId: r.id }),
    );
    const lr = await c.fd!.get(url('/reservations?externalContract=true'));
    expect(lr.statusCode, lr.body).toBe(200);
    const listed = lr.json().data;
    expect(listed.map((x: { id: string }) => x.id)).toContain(r.id);
    const short = await create({
      roomId: ids.rooms['302'],
      channelId: ids.channels.zalo_phone,
      directSource: 'zalo_phone',
      arrivalDate: '2027-06-01',
      departureDate: '2027-06-10',
      adults: 1,
      bookerGuestId: guest,
      paymentModel: 'direct',
      manualLongStay: { monthlyRentVnd: 9_500_000 },
    });
    expect(short.json().errors).toContainEqual({
      field: 'departureDate',
      code: 'MANUAL_LONG_STAY_BELOW_THRESHOLD',
    });
  });

  it('US-021: dryRun shows BR-309 refund without writing; cancel frees the room, voids nights, asks refund approval', async () => {
    const r = (
      await create(
        direct({
          roomId: ids.rooms['103'],
          arrivalDate: '2026-11-02',
          departureDate: '2026-11-05',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 700_000 },
        }),
      )
    ).json();
    expect(r.status).toBe('confirmed');
    const dry = await c.fd!.send(
      'POST',
      url(`/reservations/${r.id}/actions/cancel`),
      { reasonCode: 'found_other', dryRun: true },
      { 'idempotency-key': '' },
    );
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json().cancellation).toMatchObject({
      depositPaidVnd: 700_000,
      refundableVnd: 700_000,
      retainedVnd: 0,
      policyRef: 'BR-309',
    });
    expect((await get(r.id)).status).toBe('confirmed');
    const other = await action(r.id, 'cancel', r.version, { reasonCode: 'other' });
    expect(other.json().errors).toContainEqual({ field: 'note', code: 'REASON_REQUIRED' });
    const sys = await action(r.id, 'cancel', r.version, { reasonCode: 'hold_expired' });
    expect(sys.json().errors).toContainEqual({ field: 'reasonCode', code: 'NOT_IN_LIST' });
    const pen = await action(r.id, 'cancel', r.version, {
      reasonCode: 'found_other',
      otaPenaltyVnd: 100,
    });
    expect(pen.json().errors).toContainEqual({
      field: 'otaPenaltyVnd',
      code: 'OTA_PENALTY_OTA_ONLY',
    });
    const res = await action(r.id, 'cancel', r.version, {
      reasonCode: 'found_other',
      note: 'Khách báo qua Zalo',
    });
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json().reservation).toMatchObject({
      status: 'cancelled',
      cancellation: { reasonCode: 'found_other' },
      allowedActions: [],
    });
    expect(res.json().cancellation.refundApprovalRequestId).toEqual(expect.any(String));
    const free = await create(
      direct({
        roomId: ids.rooms['103'],
        arrivalDate: '2026-11-02',
        departureDate: '2026-11-05',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 700_000 },
      }),
    );
    expect(free.statusCode).toBe(201);
    const nights = await q<{ s: string; reason: string }>(
      `SELECT DISTINCT night_state AS s, void_reason AS reason FROM stay_night WHERE reservation_id = $1`,
      [r.id],
    );
    expect(nights).toEqual([{ s: 'void', reason: 'cancelled' }]);
    const again = await action(r.id, 'cancel', r.version + 1, { reasonCode: 'found_other' });
    expect(again.statusCode).toBe(409);
    expect(again.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'cancelled' });
  });

  it('US-024 B7/B8: move room + dates keeps kept-night prices; OTA dates locked; postpone is MGR+', async () => {
    const r = (
      await create(
        direct({
          roomId: ids.rooms['201'],
          arrivalDate: '2027-01-11',
          departureDate: '2027-01-13',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
        }),
      )
    ).json();
    const before = r.nightlyRates;
    const res = await action(r.id, 'move', r.version, {
      roomId: ids.rooms['101'],
      departureDate: '2027-01-14',
      reasonCode: 'guest_request',
    });
    expect(res.statusCode, res.body).toBe(200);
    const m = res.json();
    expect(m.segments[0]).toMatchObject({
      roomNo: '101',
      fromDate: '2027-01-11',
      toDate: '2027-01-14',
    });
    expect(m.nightlyRates.slice(0, 2)).toEqual(before);
    expect(m.nightlyRates).toHaveLength(3);
    expect(m.totalRoomVnd).toBe(
      m.nightlyRates.reduce((a: number, n: { amountVnd: number }) => a + n.amountVnd, 0),
    );
    const pp = await action(r.id, 'move', m.version, {
      arrivalDate: '2027-02-01',
      departureDate: '2027-02-03',
      mode: 'postpone_instead_of_cancel',
      reasonCode: 'guest_request',
    });
    expect(pp.statusCode).toBe(403);
    const pm = await action(
      r.id,
      'move',
      m.version,
      {
        arrivalDate: '2027-02-01',
        departureDate: '2027-02-03',
        mode: 'postpone_instead_of_cancel',
        reasonCode: 'guest_request',
      },
      'mgr',
    );
    expect(pm.statusCode, pm.body).toBe(200);
    const once = await action(
      r.id,
      'move',
      pm.json().version,
      {
        arrivalDate: '2027-02-05',
        departureDate: '2027-02-07',
        mode: 'postpone_instead_of_cancel',
        reasonCode: 'guest_request',
      },
      'mgr',
    );
    expect(once.statusCode).toBe(409);
    const o = (
      await create(
        ota({ roomId: ids.rooms['301'], arrivalDate: '2027-01-20', departureDate: '2027-01-22' }),
      )
    ).json();
    const locked = await action(o.id, 'move', o.version, {
      arrivalDate: '2027-01-21',
      reasonCode: 'guest_request',
    });
    expect(locked.json().errors).toContainEqual({ field: 'arrivalDate', code: 'OTA_DATES_LOCKED' });
  });

  it('K12 swapRoom: two bookings exchange rooms in one deferred check', async () => {
    const a = (
      await create(
        direct({
          roomId: ids.rooms['101'],
          arrivalDate: '2027-03-01',
          departureDate: '2027-03-03',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
        }),
      )
    ).json();
    const bRes = await create(
      direct({
        roomId: ids.rooms['102'],
        arrivalDate: '2027-03-01',
        departureDate: '2027-03-04',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
      }),
    );
    expect(bRes.statusCode, bRes.body).toBe(201);
    const b = bRes.json();
    const res = await action(a.id, 'swap-room', a.version, {
      otherReservationId: b.id,
      otherVersion: b.version,
      reason: 'Khách muốn tầng thấp',
    });
    expect(res.statusCode, res.body).toBe(200);
    const [x, y] = res.json().reservations;
    expect(x.segments[0].roomNo).toBe('102');
    expect(y.segments[0].roomNo).toBe('101');
    const stale = await action(a.id, 'swap-room', a.version, {
      otherReservationId: b.id,
      otherVersion: b.version,
      reason: 'lần hai',
    });
    expect(stale.statusCode).toBe(412);
  });

  it('US-136 B11/B12: no-show only after 23:00, never automatic; restore in the business day; later → 202 approval', async () => {
    await at('2026-10-15T10:00:00+07:00');
    const r = (
      await create(
        direct({
          roomId: ids.rooms['401'],
          arrivalDate: '2026-10-15',
          departureDate: '2026-10-17',
          directSource: 'walk_in',
          initialPayment: { type: 'charge', method: 'cash', amountVnd: 3_000_000 },
        }),
      )
    ).json();
    expect(r.status).toBe('confirmed');
    const early = await action(r.id, 'mark-no-show', r.version, {
      contactAttemptNote: 'Gọi 2 lần không nghe',
    });
    expect(early.statusCode).toBe(409);
    await at('2026-10-15T23:05:00+07:00');
    expect((await action(r.id, 'mark-no-show', r.version, {})).json().errors).toContainEqual({
      field: 'contactAttemptNote',
      code: 'REASON_REQUIRED',
    });
    const ns = await action(r.id, 'mark-no-show', r.version, {
      contactAttemptNote: 'Gọi 2 lần không nghe',
    });
    expect(ns.statusCode, ns.body).toBe(200);
    expect(ns.json().status).toBe('no_show');
    expect(
      await q(
        `SELECT 1 FROM room_occupancy o JOIN reservation_segment s ON s.id = o.reservation_segment_id WHERE s.reservation_id = $1 AND o.active`,
        [r.id],
      ),
    ).toEqual([]);
    // 01:30 next day = still business day 15/10 (BR-010) → FD restores itself (BR-315).
    await at('2026-10-16T01:30:00+07:00');
    const back = await action(r.id, 'restore-no-show', ns.json().version, {
      reason: 'Khách đến muộn, xe trễ',
    });
    expect(back.statusCode, back.body).toBe(200);
    expect(back.json().status).toBe('confirmed');
    const sold = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold'`,
      [r.id],
    );
    expect(sold[0]!.n).toBe(2);
    await at('2026-10-16T01:40:00+07:00');
    const ns2 = await action(r.id, 'mark-no-show', back.json().version, {
      contactAttemptNote: 'Khách lại không đến',
    });
    expect(ns2.statusCode).toBe(200);
    await at('2026-10-16T07:00:00+07:00');
    const late = await action(r.id, 'restore-no-show', ns2.json().version, {
      reason: 'Khách đến sáng',
    });
    expect(late.statusCode, late.body).toBe(202);
    expect(late.json()).toMatchObject({
      type: 'no_show_restore',
      status: 'pending',
      requiredRole: 'manager',
    });
    const mgr = await action(
      r.id,
      'restore-no-show',
      ns2.json().version,
      { reason: 'Quản lý đồng ý' },
      'mgr',
    );
    expect(mgr.statusCode, mgr.body).toBe(200);
    await at('2026-10-15T09:00:00+07:00');
  });

  it('US-084/085 B1 + B3 + J1: hold, extend once, then the job cancels it exactly once and frees the room', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const svc = fa.app.get(ReservationsService);
    const hold = await db.withContext(
      { ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.sal!.id, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms['203']!,
          channelId: ids.channels.zalo_phone!,
          arrivalDate: '2026-10-20',
          departureDate: '2026-10-22',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 24,
        });
      },
    );
    expect(hold.status).toBe('hold');
    expect(hold.hold_expires_at).toEqual(new Date('2026-10-16T09:00:00+07:00'));
    const v = (await get(hold.id, 'sal')).version;
    expect((await action(hold.id, 'extend-hold', v, { extraHours: 25 }, 'sal')).statusCode).toBe(
      422,
    );
    const ext = await action(hold.id, 'extend-hold', v, { extraHours: 24 }, 'sal');
    expect(ext.statusCode, ext.body).toBe(200);
    expect(ext.json().hold).toMatchObject({
      extendedCount: 1,
      expiresAt: '2026-10-17T09:00:00.000+07:00',
    });
    const twice = await action(
      hold.id,
      'extend-hold',
      ext.json().version,
      { extraHours: 1 },
      'sal',
    );
    expect(twice.statusCode).toBe(409);
    // CTV of another sale never sees it (US-087 AC2).
    expect((await c.ctv!.get(url(`/reservations/${hold.id}`))).statusCode).toBe(404);
    expect((await c.sal2!.get(url(`/reservations/${hold.id}`))).statusCode).toBe(404);

    const runner = fa.app.get(JobRunner);
    const property = {
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    };
    await at('2026-10-17T08:59:00+07:00');
    expect((await runner.runOnce(HOLD_EXPIRY_JOB_KEY, property)).stats).toMatchObject({
      expired: 0,
    });
    await at('2026-10-17T09:00:00+07:00');
    const runs = await Promise.all(
      [1, 2, 3].map(() => runner.runOnce(HOLD_EXPIRY_JOB_KEY, property)),
    );
    expect(runs.reduce((a, r) => a + Number(r.stats.expired), 0)).toBe(1);
    expect((await runner.runOnce(HOLD_EXPIRY_JOB_KEY, property)).stats).toMatchObject({
      expired: 0,
    });
    expect(await get(hold.id)).toMatchObject({
      status: 'cancelled',
      cancellation: { reasonCode: 'hold_expired' },
    });
    const st = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM state_transition WHERE entity_id = $1 AND event_code = 'B6'`,
      [hold.id],
    );
    expect(st[0]!.n).toBe(1);
    expect(
      await q(
        `SELECT 1 FROM room_occupancy WHERE room_id = $1 AND active AND stay_range && '[2026-10-20,2026-10-22)'::daterange`,
        [ids.rooms['203']],
      ),
    ).toEqual([]);
    await at('2026-10-15T09:00:00+07:00');
  });

  it('US-019 / SM-02: OOO block stops sales (rack, booking, availability); conflicts listed; extend, cancel, release', async () => {
    const blk = await c.mt!.send('POST', url('/room-blocks'), {
      roomId: ids.rooms['102'],
      startDate: '2026-12-15',
      endDatePlanned: '2026-12-18',
      reason: 'Hỏng bình nóng lạnh',
    });
    expect(blk.statusCode, blk.body).toBe(201);
    const b = blk.json();
    expect(b).toMatchObject({
      status: 'planned',
      startDate: '2026-12-15',
      endDatePlanned: '2026-12-18',
    });
    const book = await create(
      direct({
        roomId: ids.rooms['102'],
        arrivalDate: '2026-12-17',
        departureDate: '2026-12-19',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
      }),
    );
    expect(book.statusCode).toBe(409);
    expect(book.json().code).toBe('ROOM_BLOCKED');
    const av = (
      await c.sal!.get(
        url(`/availability?arrival=2026-12-17&departure=2026-12-19&roomId=${ids.rooms['102']}`),
      )
    ).json();
    expect(av.requestedRoom).toMatchObject({ available: false, reason: 'blocked' });
    expect(av.alternatives.length).toBeGreaterThan(0);
    const rack = (await c.fd!.get(url('/rack?from=2026-12-14&days=7'))).json();
    expect(rack.rooms.find((r: { roomNo: string }) => r.roomNo === '102').bars).toContainEqual(
      expect.objectContaining({ kind: 'ooo', roomBlockId: b.id }),
    );
    // A block over a booking → 409 with the booking to move first (BR-804).
    const clash = await c.mt!.send('POST', url('/room-blocks'), {
      roomId: ids.rooms['202'],
      startDate: '2026-11-10',
      endDatePlanned: '2026-11-12',
      reason: 'Sơn lại tường',
    });
    expect(clash.statusCode).toBe(409);
    expect(clash.json().conflicts[0]).toMatchObject({ roomNo: '202', kind: 'reservation' });
    expect(clash.json().conflicts[0].guestDisplayName).toBeUndefined(); // MT never sees names
    const ext = await c.mt!.send(
      'PATCH',
      url(`/room-blocks/${b.id}`),
      { endDatePlanned: '2026-12-20' },
      { 'if-match': `"${b.version}"` },
    );
    expect(ext.statusCode, ext.body).toBe(200);
    expect(
      (
        await c.mt!.send('POST', url(`/room-blocks/${b.id}/actions/cancel`), {
          reason: 'Đã sửa xong sớm',
        })
      ).json().status,
    ).toBe('cancelled');
    expect(
      (
        await create(
          direct({
            roomId: ids.rooms['102'],
            arrivalDate: '2026-12-17',
            departureDate: '2026-12-19',
            initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
          }),
        )
      ).statusCode,
    ).toBe(201);
    // Active block from today: FD cannot release without a work order (MGR+ only).
    const now = (
      await c.fd!.send('POST', url('/room-blocks'), {
        roomId: ids.rooms['301'],
        startDate: '2026-10-15',
        endDatePlanned: '2026-10-18',
        reason: 'Thấm trần',
      })
    ).json();
    expect(now.status).toBe('active');
    expect(
      (
        await c.fd!.send('POST', url(`/room-blocks/${now.id}/actions/release`), {
          reason: 'Đã sửa',
        })
      ).statusCode,
    ).toBe(403);
    const rel = await c.mgr!.send('POST', url(`/room-blocks/${now.id}/actions/release`), {
      reason: 'Đã sửa',
    });
    expect(rel.statusCode, rel.body).toBe(200);
    expect(rel.json()).toMatchObject({ status: 'released', endDateActual: '2026-10-15' });
    const list = (await c.fd!.get(url('/room-blocks?from=2026-10-01&to=2026-12-31'))).json().data;
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('US-016 AC4 rack by role: FD full + lane, HK masked, SAL availability only; p95 < 200 ms', async () => {
    const fd = (await c.fd!.get(url('/rack?from=2026-11-08&days=14'))).json();
    expect(fd).toMatchObject({ from: '2026-11-08', days: 14, today: '2026-10-15' });
    expect(fd.rooms).toHaveLength(10);
    const bar202 = fd.rooms.find((r: { roomNo: string }) => r.roomNo === '202').bars[0];
    expect(bar202).toMatchObject({
      kind: 'confirmed',
      label: 'status.booking.confirmed',
      reservationId: expect.any(String),
      guestDisplayName: 'Nguyễn Thị Hà',
      channelCode: 'zalo_phone',
    });
    const hk = (await c.hk!.get(url('/rack?from=2026-11-08&days=14'))).json();
    const hkBar = hk.rooms.find((r: { roomNo: string }) => r.roomNo === '202').bars[0];
    expect(hkBar.kind).toBe('confirmed');
    expect(hkBar.reservationId).toBeUndefined();
    expect(hkBar.guestDisplayName).toBeUndefined();
    expect(hk.unassigned).toBeUndefined();
    const sal = (await c.sal!.get(url('/rack?from=2026-11-08&days=14'))).json();
    const salBars = sal.rooms.find((r: { roomNo: string }) => r.roomNo === '202').bars;
    expect(salBars.every((b: { kind: string }) => b.kind === 'unavailable')).toBe(true);
    expect(JSON.stringify(sal)).not.toContain('Nguyễn');
    expect((await c.fd!.get(url('/rack?days=40'))).statusCode).toBe(422);
    const times: number[] = [];
    for (let i = 0; i < 40; i++) {
      const s = process.hrtime.bigint();
      expect((await c.fd!.get(url('/rack'))).statusCode).toBe(200);
      times.push(Number(process.hrtime.bigint() - s) / 1e6);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.95)]).toBeLessThan(200);
  });

  it('US-082 availability: past date flagged, free room, alternatives ≤ 6; list + history', async () => {
    const past = (
      await c.ctv!.get(
        url(`/availability?arrival=2026-10-10&departure=2026-10-12&roomId=${ids.rooms['101']}`),
      )
    ).json();
    expect(past.requestedRoom).toMatchObject({ available: false, reason: 'past_date' });
    const free = (
      await c.ctv!.get(
        url(
          `/availability?arrival=2027-04-06&departure=2027-04-08&roomId=${ids.rooms['101']}&adults=2`,
        ),
      )
    ).json();
    expect(free.requestedRoom).toMatchObject({ roomNo: '101', available: true });
    expect(free.alternatives.length).toBeLessThanOrEqual(6);
    const cap = (
      await c.ctv!.get(
        url(
          `/availability?arrival=2027-04-06&departure=2027-04-08&roomId=${ids.rooms['101']}&adults=4`,
        ),
      )
    ).json();
    expect(cap.requestedRoom.reason).toBe('capacity');
    expect(
      (await c.ctv!.get(url('/availability?arrival=2027-04-08&departure=2027-04-06'))).statusCode,
    ).toBe(422);
    const list = (await c.fd!.get(url('/reservations?status=confirmed&limit=2'))).json();
    expect(list.data).toHaveLength(2);
    expect(list.page.nextCursor).toEqual(expect.any(String));
    const page2 = (
      await c.fd!.get(url(`/reservations?status=confirmed&limit=2&cursor=${list.page.nextCursor}`))
    ).json();
    expect(page2.data[0].id).not.toBe(list.data[0].id);
    // SAL/CTV only their own bookings (US-087).
    expect((await c.ctv!.get(url('/reservations'))).json().data).toEqual([]);
    const id = list.data[0].id;
    const hist = (await c.fd!.get(url(`/reservations/${id}/history`))).json().data;
    expect(hist.map((h: { action: string }) => h.action)).toEqual(
      expect.arrayContaining([
        'reservation.transition.B2',
        'reservation.created',
        'reservation.priced',
      ]),
    );
    expect((await c.sal!.get(url(`/reservations/${id}/history`))).statusCode).toBe(403);
  });

  it('RLS: another property sees none of these bookings (404)', async () => {
    const other = await createTenant(db, { users: { fd: ['front_desk'] } });
    await seedBooking(db, other);
    const o = Client.of(fa, other, 'fd');
    const [some] = await q<{ id: string }>('SELECT id FROM reservation LIMIT 1');
    expect(
      (await o.get(`/v1/properties/${other.propertyIds[0]}/reservations/${some!.id}`)).statusCode,
    ).toBe(404);
  });
});
