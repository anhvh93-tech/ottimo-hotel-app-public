/**
 * BE-A Sprint 2 response & fix (reviews DOM/SEC/ARC, QA BUG-R2-017…021, OpenAPI 0.3.5 §8) on PostgreSQL:
 * BR-107 re-tiering on a change of nights (BR-107-03/04), OTA calendar default + BR-105 group bounds,
 * EP02 3.4 check order, suggestions never in a lower group, OTA over capacity → flag (BR-110-09), internal
 * channel without min stay (BR-113-04), hold limit (BR-302-03), short deposit hold never auto-cancelled
 * (BR-303-04), restore no-show of an OTA booking / into the unassigned lane (BR-315-03/04/05), kit task due
 * (D-10), dryRun fail-closed (SEC-BE-21), lock timeout → 409 (SEC-BE-23), other people's holds → 404 (SEC-BE-29),
 * conflicts without codes for SAL/CTV (SEC-BE-25), ROOM_OCCUPIED, booking rules, job isolation (SEC-BE-24).
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import {
  HOLD_EXPIRY_JOB_KEY,
  ROOM_BLOCK_ACTIVATION_JOB_KEY,
} from '../../src/jobs/reservation-jobs';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { ReservationHooks } from '../../src/modules/reservations/public/reservation-hooks';
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
  sal: ['sales_staff'],
  ctv: ['collaborator'],
  ctv2: ['collaborator'],
};

describe.skipIf(!HAS_DB)('reservations – Sprint 2 response & fix (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(15);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Trần Văn Nam' });
    fa = await startFeatureApp(db);
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    await at('2026-10-15T09:00:00+07:00');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  async function at(iso: string) {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  }
  const direct = (over: Record<string, unknown> = {}) => ({
    roomId: ids.rooms['202'],
    channelId: ids.channels.zalo_phone,
    directSource: 'zalo_phone',
    arrivalDate: '2026-11-09',
    departureDate: '2026-11-14',
    adults: 2,
    bookerGuestId: guest,
    paymentModel: 'direct',
    initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_600_000 },
    ...over,
  });
  const ota = (over: Record<string, unknown> = {}) => ({
    roomId: ids.rooms['203'],
    channelId: ids.channels.booking,
    arrivalDate: '2026-10-23',
    departureDate: '2026-10-26',
    adults: 2,
    bookerGuestId: guest,
    paymentModel: 'ota_prepaid',
    otaRef: `BK${randomUUID().slice(0, 8)}`,
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
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const sum = (r: { nightlyRates: Array<{ amountVnd: number }> }) =>
    r.nightlyRates.reduce((a, n) => a + n.amountVnd, 0);

  it('BR-107-04 / D-8: 5 → 7 nights re-tiers every night on the agreed calendar (5.205.000)', async () => {
    const res = await create(direct());
    expect(res.statusCode, res.body).toBe(201);
    const r = res.json();
    expect(r.totalRoomVnd).toBe(4_079_000);
    expect(r.nightlyRates.map((n: { calendarRateVnd: number }) => n.calendarRateVnd)).toEqual([
      792_000, 792_000, 792_000, 792_000, 911_000,
    ]);
    const longer = await action(r.id, 'move', r.version, {
      departureDate: '2026-11-16',
      reasonCode: 'guest_request',
    });
    expect(longer.statusCode, longer.body).toBe(200);
    expect(longer.json().totalRoomVnd).toBe(5_205_000);
    expect(sum(longer.json())).toBe(5_205_000);
    // BR-107-03: back to 5 nights → no tier any more (4.079.000, not 3.672.000).
    const shorter = await action(r.id, 'move', longer.json().version, {
      departureDate: '2026-11-14',
      reasonCode: 'guest_request',
    });
    expect(shorter.statusCode, shorter.body).toBe(200);
    expect(shorter.json().totalRoomVnd).toBe(4_079_000);
  });

  it('A-19 move reasons: overbooking only when flagged, upgrade FDL+, force_majeure only as B8 + note', async () => {
    const r = (
      await create(
        direct({
          roomId: ids.rooms['101'],
          arrivalDate: '2026-11-24',
          departureDate: '2026-11-26',
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
        }),
      )
    ).json();
    const ob = await action(r.id, 'move', r.version, {
      roomId: ids.rooms['102'],
      reasonCode: 'overbooking',
    });
    expect(ob.json().errors).toContainEqual({ field: 'reasonCode', code: 'NOT_IN_LIST' });
    const up = await action(r.id, 'move', r.version, {
      roomId: ids.rooms['102'],
      reasonCode: 'upgrade',
    });
    expect(up.statusCode).toBe(403);
    const fm = await action(r.id, 'move', r.version, {
      roomId: ids.rooms['102'],
      reasonCode: 'force_majeure',
      note: 'Đèo đóng',
    });
    expect(fm.json().errors).toContainEqual({ field: 'reasonCode', code: 'NOT_IN_LIST' });
    const fmNote = await action(
      r.id,
      'move',
      r.version,
      {
        arrivalDate: '2027-01-05',
        departureDate: '2027-01-07',
        mode: 'postpone_instead_of_cancel',
        reasonCode: 'force_majeure',
      },
      'mgr',
    );
    expect(fmNote.json().errors).toContainEqual({ field: 'note', code: 'REASON_REQUIRED' });
    const ok = await action(r.id, 'move', r.version, {
      roomId: ids.rooms['102'],
      reasonCode: 'property_fault',
    });
    expect(ok.statusCode, ok.body).toBe(200);
  });

  it('BUG-R2-017: OTA without price → OTA calendar of the group (Fri/Sat 870.000, Sun 760.000)', async () => {
    const res = await create(ota());
    expect(res.statusCode, res.body).toBe(201);
    expect(res.json().nightlyRates.map((n: { amountVnd: number }) => n.amountVnd)).toEqual([
      870_000, 870_000, 760_000,
    ]);
  });

  it('BUG-R2-018: BR-105 floor/ceiling per group (Lầu 1–2: 530.000–1.900.000) for every channel', async () => {
    const body = (amount: number) =>
      direct({
        roomId: ids.rooms['203'],
        arrivalDate: '2026-11-03',
        departureDate: '2026-11-04',
        nightlyRates: [{ date: '2026-11-03', amountVnd: amount }],
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 600_000 },
      });
    expect((await create(body(529_000))).json().code).toBe('RATE_OUT_OF_RANGE');
    expect((await create(body(1_901_000))).json().code).toBe('RATE_OUT_OF_RANGE');
    const ok = await create(body(553_000));
    expect(ok.statusCode, ok.body).toBe(201);
  });

  it('BUG-R2-019: EP02 3.4 order – double booking (409) is reported before the missing deposit (422)', async () => {
    const res = await create(
      direct({
        roomId: ids.rooms['203'],
        arrivalDate: '2026-11-03',
        departureDate: '2026-11-04',
        initialPayment: undefined,
      }),
    );
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('ROOM_UNAVAILABLE');
    const free = await create(
      direct({
        roomId: ids.rooms['201'],
        arrivalDate: '2026-12-08',
        departureDate: '2026-12-09',
        initialPayment: undefined,
      }),
    );
    expect(free.statusCode).toBe(422);
    expect(free.json()).toMatchObject({
      code: 'DEPOSIT_INSUFFICIENT',
      depositPaidVnd: 0,
      shortfallVnd: expect.any(Number),
    });
  });

  it('BUG-R2-020: suggestions are the same group or higher groups only', async () => {
    await create(
      direct({
        roomId: ids.rooms['402'],
        arrivalDate: '2026-12-14',
        departureDate: '2026-12-16',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
      }),
    );
    const res = await create(
      direct({
        roomId: ids.rooms['402'],
        arrivalDate: '2026-12-14',
        departureDate: '2026-12-16',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_000_000 },
      }),
    );
    expect(res.statusCode).toBe(409);
    const groups = res.json().suggestions.map((s: { roomGroupCode: string }) => s.roomGroupCode);
    expect(groups.every((g: string) => g === 'NPLUS')).toBe(true);
  });

  it('BR-110-09 / A-20: OTA above capacity → warning, then 201 flagged, no check-in; direct still blocked', async () => {
    const body = ota({
      roomId: ids.rooms['202'],
      arrivalDate: '2026-10-15',
      departureDate: '2026-10-16',
      adults: 4,
      otaRoomAmountVnd: 900_000,
    });
    const warn = await create(body);
    expect(warn.statusCode).toBe(422);
    expect(warn.json()).toMatchObject({ roomNo: '202', max: 3 });
    expect(warn.json().errors).toContainEqual({
      field: 'adults',
      code: 'CAPACITY_EXCEEDED_WARNING',
    });
    const ok = await create({ ...body, capacityWarningAckReason: 'OTA cho đặt 4 khách' });
    expect(ok.statusCode, ok.body).toBe(201);
    const r = ok.json();
    expect(r).toMatchObject({ capacityConflict: true, conflictState: 'none' });
    expect(r.allowedActions.map((a: { event: string }) => a.event)).not.toContain('check_in');
    const rack = (await c.fd!.get(url('/rack?from=2026-10-15&days=2'))).json();
    const bar = rack.rooms
      .find((x: { roomNo: string }) => x.roomNo === '202')
      .bars.find((b: { reservationId: string }) => b.reservationId === r.id);
    expect(bar).toMatchObject({ capacityConflict: true, reservationCode: r.code });
    // Fewer guests after calling the guest → flag cleared, check-in possible today.
    const fixed = await c.fd!.send(
      'PATCH',
      url(`/reservations/${r.id}`),
      { adults: 3 },
      { 'if-match': `"${r.version}"` },
    );
    expect(fixed.statusCode, fixed.body).toBe(200);
    expect(fixed.json().capacityConflict).toBe(false);
    expect(fixed.json().allowedActions.map((a: { event: string }) => a.event)).toContain(
      'check_in',
    );
    const directOver = await create(direct({ adults: 4 }));
    expect(directOver.json().code).toBe('CAPACITY_EXCEEDED');
    expect(directOver.json().roomNo).toBe('202');
  });

  it('BR-113-04 / D-7: internal channel 1 Friday night is accepted (no minimum stay)', async () => {
    const res = await create({
      roomId: ids.rooms['301'],
      channelId: ids.channels.internal,
      arrivalDate: '2026-10-23',
      departureDate: '2026-10-24',
      adults: 1,
      bookerGuestId: guest,
      paymentModel: 'direct',
      internalNote: 'Người nhà chủ đầu tư',
    });
    expect(res.statusCode, res.body).toBe(201);
  });

  it('A-05: MIN_STAY_NOT_MET lists the orphan-night rooms of the group', async () => {
    // 101 has a stay ending Sat 24/10 and one starting Sun 25/10 → night 24/10 is an orphan.
    for (const [a, d] of [
      ['2026-10-21', '2026-10-24'],
      ['2026-10-25', '2026-10-27'],
    ] as const) {
      expect(
        (
          await create(
            direct({
              roomId: ids.rooms['101'],
              arrivalDate: a,
              departureDate: d,
              initialPayment: { type: 'deposit', method: 'cash', amountVnd: 700_000 },
            }),
          )
        ).statusCode,
      ).toBe(201);
    }
    const res = await create(
      direct({
        roomId: ids.rooms['102'],
        arrivalDate: '2026-10-24',
        departureDate: '2026-10-25',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 300_000 },
      }),
    );
    expect(res.statusCode).toBe(422);
    expect(res.json().suggestions).toContainEqual(
      expect.objectContaining({ roomNo: '101', orphanNight: true }),
    );
    const av = (
      await c.fd!.get(
        url(`/availability?arrival=2026-10-24&departure=2026-10-25&roomId=${ids.rooms['101']}`),
      )
    ).json();
    expect(av.requestedRoom).toMatchObject({ available: true, orphanNight: true });
  });

  it('BR-302-03 / SEC-BE-28: a CTV holds at most 3 open holds (created or closed)', async () => {
    const svc = fa.app.get(ReservationsService);
    const hold = (room: string, arrival: string, departure: string) =>
      db.withContext({ ...t.ctx(), userId: t.users.ctv!.id, actorType: 'user' }, async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.ctv!.id, roles: ['collaborator'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms[room]!,
          channelId: ids.channels.collaborator!,
          arrivalDate: arrival,
          departureDate: departure,
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 24,
        });
      });
    await hold('101', '2027-02-15', '2027-02-17');
    await hold('102', '2027-02-15', '2027-02-17');
    await hold('103', '2027-02-15', '2027-02-17');
    await expect(hold('201', '2027-02-15', '2027-02-17')).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    // SEC-BE-29: another CTV never sees (404) nor extends/cancels them.
    const [mine] = await q<{ id: string }>(
      `SELECT id FROM reservation WHERE created_by = $1 LIMIT 1`,
      [t.users.ctv!.id],
    );
    expect((await c.ctv2!.get(url(`/reservations/${mine!.id}`))).statusCode).toBe(404);
    expect((await action(mine!.id, 'extend-hold', 1, { extraHours: 1 }, 'ctv2')).statusCode).toBe(
      404,
    );
    expect(
      (
        await c.ctv2!.send('POST', url(`/reservations/${mine!.id}/actions/cancel`), {
          reasonCode: 'price',
          dryRun: true,
        })
      ).statusCode,
    ).toBe(404);
  });

  it('SEC-BE-25: conflicts[] carries no booking code nor name for SAL/CTV/MT callers', async () => {
    const svc = fa.app.get(ReservationsService);
    const err = await db
      .withContext({ ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' }, async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.sal!.id, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms['202']!,
          channelId: ids.channels.zalo_phone!,
          arrivalDate: '2026-11-10',
          departureDate: '2026-11-12',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 24,
        });
      })
      .catch(
        (e: { code: string; options: { extras: { conflicts: Array<Record<string, unknown>> } } }) =>
          e,
      );
    expect((err as { code: string }).code).toBe('ROOM_UNAVAILABLE');
    const conflict = (err as { options: { extras: { conflicts: Array<Record<string, unknown>> } } })
      .options.extras.conflicts[0]!;
    expect(conflict.roomNo).toBe('202');
    expect(conflict.reservationCode).toBeUndefined();
    expect(conflict.guestDisplayName).toBeUndefined();
  });

  it('BR-303-04 / D-9: a hold with a short deposit is never auto-cancelled; alerts once, MGR after 12:00 arrival day', async () => {
    await at('2026-10-15T10:00:00+07:00');
    const svc = fa.app.get(ReservationsService);
    const hold = await db.withContext(
      { ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.sal!.id, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms['401']!,
          channelId: ids.channels.zalo_phone!,
          arrivalDate: '2026-10-18',
          departureDate: '2026-10-21',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 24,
        });
      },
    );
    const part = await action(hold.id, 'confirm-deposit', hold.version, {
      payment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
    });
    expect([200, 422]).toContain(part.statusCode);
    const runner = fa.app.get(JobRunner);
    const property = {
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    };
    await at('2026-10-16T10:01:00+07:00');
    const r1 = await runner.runOnce(HOLD_EXPIRY_JOB_KEY, property);
    expect(r1.stats).toMatchObject({ keptPaid: 1, failed: 0 });
    await runner.runOnce(HOLD_EXPIRY_JOB_KEY, property);
    const pushes = await q<{ kind: string; n: number }>(
      `SELECT payload->>'kind' AS kind, count(*)::int AS n FROM outbox_message
        WHERE topic = 'staff.push' AND payload->>'refId' = $1 GROUP BY 1`,
      [hold.id],
    );
    expect(pushes).toEqual([{ kind: 'hold_overdue_with_deposit', n: 1 }]);
    await at('2026-10-18T12:00:00+07:00');
    await runner.runOnce(HOLD_EXPIRY_JOB_KEY, property);
    const mgr = await q(`SELECT 1 FROM outbox_message WHERE dedupe_key = $1`, [
      `hold_overdue_cap:${hold.id}`,
    ]);
    expect(mgr).toHaveLength(1);
    expect(
      (await q<{ status: string }>(`SELECT status FROM reservation WHERE id = $1`, [hold.id]))[0]!
        .status,
    ).toBe('hold');
    // B5 by the desk → 100 % of the money received is refundable (BR-308, no fee).
    const v = (await c.fd!.get(url(`/reservations/${hold.id}`))).json().version;
    const cancel = await action(hold.id, 'cancel', v, { reasonCode: 'unreachable' });
    expect(cancel.statusCode, cancel.body).toBe(200);
    expect(cancel.json().cancellation).toMatchObject({ refundableVnd: 500_000, retainedVnd: 0 });
    await at('2026-10-15T09:00:00+07:00');
  });

  it('SEC-BE-24: one failing hold does not block the others (savepoint per hold)', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const svc = fa.app.get(ReservationsService);
    const make = (room: string) =>
      db.withContext({ ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' }, async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.fd!.id, roles: ['front_desk'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms[room]!,
          channelId: ids.channels.zalo_phone!,
          arrivalDate: '2027-03-20',
          departureDate: '2027-03-22',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 12,
        });
      });
    const bad = await make('301');
    await make('302');
    const hooks = fa.app.get(ReservationHooks);
    hooks.on('transitioned', async (_tx, e) => {
      if (e.reservationId === bad.id) throw new Error('poison');
    });
    await at('2026-10-16T09:00:00+07:00');
    const runner = fa.app.get(JobRunner);
    const r = await runner.runOnce(HOLD_EXPIRY_JOB_KEY, {
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    });
    expect(r.stats).toMatchObject({ failed: 1 });
    expect(Number(r.stats.expired)).toBeGreaterThanOrEqual(1);
    expect(
      (await q<{ status: string }>(`SELECT status FROM reservation WHERE id = $1`, [bad.id]))[0]!
        .status,
    ).toBe('hold');
    await at('2026-10-15T09:00:00+07:00');
  });

  it('BR-315-04/05 / A-21: OTA restore by FD → 202; approved/MGR restore with the room sold again → unassigned lane', async () => {
    await at('2026-10-15T10:00:00+07:00');
    const o = (
      await create(
        ota({
          roomId: ids.rooms['402'],
          arrivalDate: '2026-10-15',
          departureDate: '2026-10-17',
          otaRoomAmountVnd: 2_000_000,
        }),
      )
    ).json();
    await at('2026-10-15T23:30:00+07:00');
    const ns = await action(o.id, 'mark-no-show', o.version, {
      contactAttemptNote: 'Không liên lạc được',
    });
    expect(ns.statusCode, ns.body).toBe(200);
    // Room sold again to a walk-in for tonight.
    const walk = await create(
      direct({
        roomId: ids.rooms['402'],
        arrivalDate: '2026-10-15',
        departureDate: '2026-10-16',
        directSource: 'walk_in',
        initialPayment: { type: 'charge', method: 'cash', amountVnd: 1_200_000 },
      }),
    );
    expect(walk.statusCode, walk.body).toBe(201);
    await at('2026-10-16T01:30:00+07:00');
    const fd = await action(o.id, 'restore-no-show', ns.json().version, {
      reason: 'Khách tới muộn',
    });
    expect(fd.statusCode, fd.body).toBe(202);
    const fdUn = await action(o.id, 'restore-no-show', ns.json().version, {
      reason: 'Khách tới muộn',
      allowUnassigned: true,
    });
    expect(fdUn.statusCode).toBe(403);
    const mgr = await action(
      o.id,
      'restore-no-show',
      ns.json().version,
      { reason: 'Khách tới muộn', allowUnassigned: true },
      'mgr',
    );
    expect(mgr.statusCode, mgr.body).toBe(200);
    expect(mgr.json()).toMatchObject({
      status: 'confirmed',
      conflictState: 'open',
      segments: [expect.objectContaining({ roomId: null })],
    });
    const inc = (await c.fd!.get(url('/overbooking-incidents?status=open'))).json().data;
    expect(inc).toContainEqual(
      expect.objectContaining({ reservationId: o.id, source: 'no_show_restore' }),
    );
    await at('2026-10-15T09:00:00+07:00');
  });

  it('D-10: kit task of a booking confirmed after check-in time is due now + 60 min, not overdue', async () => {
    await at('2026-10-15T16:00:00+07:00');
    const r = (
      await create(
        direct({
          roomId: ids.rooms['103'],
          adults: 3,
          arrivalDate: '2026-10-15',
          departureDate: '2026-10-16',
          directSource: 'walk_in',
          initialPayment: { type: 'charge', method: 'cash', amountVnd: 1_000_000 },
        }),
      )
    ).json();
    const [task] = await q<{ due_at: Date }>(
      `SELECT due_at FROM hk_task WHERE reservation_id = $1`,
      [r.id],
    );
    expect(task!.due_at).toEqual(new Date('2026-10-15T17:00:00+07:00'));
    await at('2026-10-15T09:00:00+07:00');
  });

  it('A-03 ROOM_OCCUPIED, SEC-BE-21 dryRun fail-closed, A-07 booking rules', async () => {
    await at('2026-10-15T09:00:00+07:00');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE reservation SET status = 'in_house' WHERE id = (SELECT reservation_id FROM reservation_segment WHERE room_id = $1 AND active AND from_date = '2026-10-15' LIMIT 1)`,
        [ids.rooms['103']],
      ),
    );
    const blk = await c.fd!.send('POST', url('/room-blocks'), {
      roomId: ids.rooms['103'],
      startDate: '2026-10-15',
      endDatePlanned: '2026-10-17',
      reason: 'Hỏng điều hòa',
    });
    expect(blk.statusCode).toBe(409);
    expect(blk.json().code).toBe('ROOM_OCCUPIED');
    const dry = await c.fd!.send(
      'POST',
      url('/room-blocks'),
      {
        roomId: ids.rooms['201'],
        startDate: '2027-04-01',
        endDatePlanned: '2027-04-02',
        reason: 'Thử',
        dryRun: true,
      },
      { 'idempotency-key': '' },
    );
    expect(dry.statusCode).toBe(422);
    expect(dry.json().errors).toContainEqual({ field: 'dryRun', code: 'NOT_ALLOWED' });
    expect(
      await q(`SELECT 1 FROM room_block WHERE room_id = $1 AND start_date = '2027-04-01'`, [
        ids.rooms['201'],
      ]),
    ).toEqual([]);
    const rules = (await c.ctv!.get(url('/booking-rules'))).json();
    expect(rules).toMatchObject({
      businessDate: '2026-10-15',
      holdHoursOptions: [12, 24, 48],
      noShowMarkTime: '23:00',
      checkinTime: '14:00',
    });
    const big = await c.fd!.get(url('/availability?arrival=2026-11-01&departure=2027-03-01'));
    expect(big.statusCode).toBe(422);
  });

  it('J9 ooo.activate runs on the business day (06:00), not at midnight', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const b = (
      await c.fd!.send('POST', url('/room-blocks'), {
        roomId: ids.rooms['302'],
        startDate: '2026-10-17',
        endDatePlanned: '2026-10-18',
        reason: 'Bảo trì',
      })
    ).json();
    const runner = fa.app.get(JobRunner);
    const property = {
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    };
    await at('2026-10-17T05:59:00+07:00');
    await runner.runOnce(ROOM_BLOCK_ACTIVATION_JOB_KEY, property);
    expect(
      (await q<{ status: string }>('SELECT status FROM room_block WHERE id = $1', [b.id]))[0]!
        .status,
    ).toBe('planned');
    await at('2026-10-17T06:00:00+07:00');
    await runner.runOnce(ROOM_BLOCK_ACTIVATION_JOB_KEY, property);
    expect(
      (await q<{ status: string }>('SELECT status FROM room_block WHERE id = $1', [b.id]))[0]!
        .status,
    ).toBe('active');
    await at('2026-10-15T09:00:00+07:00');
  });

  it('SEC-BE-23: a booking that waits on a held room lock answers 409 CONCURRENT_UPDATE, not forever', async () => {
    await at('2026-10-15T09:00:00+07:00');
    let release: () => void = () => undefined;
    const held = new Promise<void>((r) => {
      release = r;
    });
    const holder = db.withContext(t.ctx(), async (tx) => {
      await tx.query('SELECT id FROM room WHERE id = $1 FOR UPDATE', [ids.rooms['201']]);
      await held;
    });
    const started = Date.now();
    const res = await create(
      direct({
        roomId: ids.rooms['201'],
        arrivalDate: '2027-05-04',
        departureDate: '2027-05-06',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 600_000 },
      }),
    );
    release();
    await holder;
    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe('CONCURRENT_UPDATE');
    expect(res.headers['retry-after']).toBe('1');
    expect(Date.now() - started).toBeLessThan(8_000);
  }, 20_000);
  it('SM-09: B5 cancel and B6 expiry of a hold from a quote send its lead back to `quoted`', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const sale = c.sal!;
    const salGuest = await seedGuestRow(db, t, { createdBy: t.users.sal!.id, name: 'Khách Sale' });
    const mk = async (room: string, arrivalDate: string) => {
      const qr = await sale.send('POST', url('/quotes'), {
        type: 'short',
        roomId: ids.rooms[room],
        arrivalDate,
        nights: 2,
        adults: 2,
        channelId: ids.channels.zalo_phone,
        guestId: salGuest,
      });
      expect(qr.statusCode, qr.body).toBe(201);
      const h = await sale.send('POST', url(`/quotes/${qr.json().id}/actions/create-hold`), {
        holdHours: 12,
      });
      expect(h.statusCode, h.body).toBe(201);
      return { leadId: qr.json().leadId as string, hold: h.json() };
    };
    const leadStatus = async (id: string) =>
      (await q<{ status: string }>('SELECT status FROM lead WHERE id = $1', [id]))[0]!.status;
    const a = await mk('201', '2027-06-08');
    expect(await leadStatus(a.leadId)).toBe('holding');
    expect(
      (await action(a.hold.id, 'cancel', a.hold.version, { reasonCode: 'price' }, 'sal'))
        .statusCode,
    ).toBe(200);
    expect(await leadStatus(a.leadId)).toBe('quoted');
    const b = await mk('202', '2027-06-15');
    await at('2026-10-15T21:01:00+07:00');
    await fa.app.get(JobRunner).runOnce(HOLD_EXPIRY_JOB_KEY, {
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    });
    expect(await leadStatus(b.leadId)).toBe('quoted');
    await at('2026-10-15T09:00:00+07:00');
  });
});
