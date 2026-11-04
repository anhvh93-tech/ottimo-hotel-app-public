/**
 * BUG-R4-039 (Round 4 v1.0.4) – BR-402 (1) v0.5.3 on the real PostgreSQL through HTTP, oracle BR-402-03 / BR-402-04:
 * the "room not ready" exception of B9 is for a VACANT room not cleaned yet (VD/CL) only. OC/OD (a stay is still
 * in the room), OOO, and a room another in-house stay still holds (status edited by hand) have none – for the
 * lead, the manager and the owner, and the FD approval request (202) is not created either. Until v1.0.3 the
 * server let the lead check a second booking into a room with a guest asleep in it (two `in_house` stays).
 * Fake clock (Tue 24/11/2026 = the oracle's QA-assumed arrival day of B), FAKE data only.
 */
import { randomBytes } from 'node:crypto';
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
import { Client, type FeatureApp, P, setPassword, startFeatureApp } from '../helpers/feature-app';
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
const WHO_OF_ROLE: Record<string, string> = {
  owner: 'own',
  manager: 'mgr',
  front_desk_lead: 'fdl',
  front_desk: 'fd',
};

type Oracle = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: Record<string, any>;
};
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Oracle[] };
const oracle = (id: string): Oracle => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};
// Each case drives a dozen HTTP calls per role (preview, B9, reads) – more than the default 30 s on a slow runner.
const SLOW = 180_000;
const EX = oracle('BR-402-03');
const MATRIX = oracle('BR-402-04');

type Booking = { id: string; code: string; version: number; folioId: string };
type Condition = { code: string; met: boolean; detail?: string; overridableBy?: string[] };

describe.skipIf(!HAS_DB)('check-in on an occupied room – BUG-R4-039 (BR-402 (1) v0.5.3)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const a = {} as Record<'202' | '203' | '201', Booking>;
  const b = {} as Record<'202' | '203' | '201' | '101' | '102', Booking>;
  const ARRIVAL_B = EX.input.stayB.arrivalDate as string;
  const DEPARTURE_B = EX.input.stayB.departureDate as string;

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const hm = () => new Date(fa.clock.now().getTime() + 7 * 3_600_000).toISOString().slice(11, 16);
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const book = async (room: string, arrivalDate: string, departureDate: string) => {
    const res = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate,
      departureDate,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 300_000 },
    });
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const preview = async (bk: Booking, who = 'fd') => {
    const res = await c[who]!.get(
      url(`/reservations/${bk.id}/check-in-preview?checkinTime=${hm()}`),
    );
    expect(res.statusCode, res.body).toBe(200);
    return res.json() as {
      roomStatus: string;
      conditions: Condition[];
      earlyCheckinSurcharge: { amountVnd: number };
      amountDueAtCheckinVnd: number;
    };
  };
  const roomCond = async (bk: Booking, who = 'fd') =>
    (await preview(bk, who)).conditions.find((x) => x.code === 'room_ready')!;
  /** B9 at the server clock: the early surcharge shown is confirmed and what is due is paid (cash) in the call. */
  const checkIn = async (bk: Booking, who: string, extra: Record<string, unknown> = {}) => {
    const p = await preview(bk, who);
    const surcharge = p.earlyCheckinSurcharge.amountVnd;
    const o = extra.roomNotReadyOverride as
      { reason?: string; approvalRequestId?: string } | undefined;
    const request = who === 'fd' && !!o?.reason && !o.approvalRequestId;
    return c[who]!.send(
      'POST',
      url(`/reservations/${bk.id}/actions/check-in`),
      {
        cardsIssued: 1,
        houseRulesSent: true,
        ...(surcharge > 0 ? { applyEarlySurcharge: true, expectedSurchargeVnd: surcharge } : {}),
        // 0.3.7 bổ sung 1: the FD request (202 branch) takes no money.
        ...(p.amountDueAtCheckinVnd > 0 && !request
          ? { payment: { type: 'charge', method: 'cash', amountVnd: p.amountDueAtCheckinVnd } }
          : {}),
        ...extra,
      },
      { 'if-match': `"${(await get(bk.id)).version}"` },
    );
  };
  const override = (reason = 'Khách đi xe đêm, chờ ở sảnh') => ({
    roomNotReadyOverride: { reason },
  });
  const roomStatus = async (room: string) =>
    (
      await q<{ status: string }>('SELECT status FROM room_status WHERE room_id = $1', [
        ids.rooms[room],
      ])
    )[0]?.status;
  const setStatus = (room: string, status: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id) DO UPDATE SET status = $4`,
      [
        ids.rooms[room],
        t.organizationId,
        t.propertyIds[0],
        status,
        new Date('2026-11-01T00:00:00Z'),
      ],
    );
  const statusOf = async (bk: Booking) => (await get(bk.id)).status as string;
  const requests = async (bk: Booking) =>
    (
      await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM approval_request WHERE target_id = $1 AND type = 'checkin_room_not_ready'`,
        [bk.id],
      )
    )[0]!.n;
  const priorityClean = async (bk: Booking) =>
    (
      await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM hk_task WHERE reservation_id = $1 AND type = 'priority_clean'`,
        [bk.id],
      )
    )[0]!.n;
  /** Refused with the existing BR-402 problem – nothing written (the booking, the room, no approval, no task). */
  const expectRefused = async (
    res: { statusCode: number; body: string; json: () => Record<string, unknown> },
    bk: Booking,
    room: string,
    statusBefore: string,
  ) => {
    expect(res.statusCode, res.body).toBe(409);
    expect(res.json()).toMatchObject({
      code: EX.expected.before_a_checkout.problemCode,
      unmet: EX.expected.before_a_checkout.unmet,
    });
    expect(await statusOf(bk)).toBe('confirmed');
    expect(await roomStatus(room)).toBe(statusBefore);
    expect(await requests(bk)).toBe(0);
    expect(await priorityClean(bk)).toBe(0);
  };

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Xe Đêm' });
    fa = await startFeatureApp(db, {
      override: (bd) =>
        bd.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    // A desk device valid over the whole fake clock (t.deviceToken() lasts one day from T0).
    const token = randomBytes(32).toString('base64url');
    await q(
      `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at, expires_at)
       VALUES ($1, $2, $3, 'desk', 'desk', $4, $5, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        sha256Hex(token),
        new Date('2026-10-01T00:00:00Z'),
        new Date('2027-12-31T00:00:00Z'),
      ],
    );
    for (const u of Object.keys(ROLES)) {
      c[u] = Client.of(fa, t, u);
      c[u]!.deviceToken = token;
    }
    for (const u of ['fdl', 'mgr', 'own']) await setPassword(db, t, u);

    // Stays A (in house, leaving on B's arrival day) and the bookings B arriving that day.
    await at('2026-11-20T10:00:00+07:00');
    for (const room of ['202', '203', '201'] as const)
      a[room] = await book(room, EX.input.stayA.arrivalDate, EX.input.stayA.departureDate);
    for (const room of ['202', '203', '201', '101', '102'] as const)
      b[room] = await book(room, ARRIVAL_B, DEPARTURE_B);
    await at(`${EX.input.stayA.arrivalDate}T14:30:00+07:00`);
    for (const room of ['202', '203', '201'] as const) {
      const res = await checkIn(a[room], 'fd');
      expect(res.statusCode, res.body).toBe(200);
      expect(await roomStatus(room)).toBe('OC');
    }
  }, SLOW);
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it(
    'BR-402-03: 202 – A still in house (OC) at 06:30 → no exception for the lead, manager, owner, nor an FD request; A checks out 10:15 (VD) → the lead confirms it, room OD + priority clean',
    async () => {
      const [before, after] = EX.input.cases as Array<Record<string, string>>;
      const xb = EX.expected.before_a_checkout;
      const xa = EX.expected.after_a_checkout;

      await at(before!.at!);
      const cond = await roomCond(b['202'], 'fdl');
      expect(cond).toMatchObject({ met: xb.roomReadyMet, detail: before!.roomStatus });
      expect(cond.overridableBy).toBeUndefined();
      for (const role of MATRIX.input.exceptionRoles as string[])
        await expectRefused(
          await checkIn(b['202'], WHO_OF_ROLE[role]!, override()),
          b['202'],
          '202',
          'OC',
        );
      // FD: the request to a lead is not created (0.3.7 202 branch) – the same 409.
      await expectRefused(await checkIn(b['202'], 'fd', override()), b['202'], '202', 'OC');
      expect(await statusOf(a['202'])).toBe('in_house');

      // 10:15 – A checks out (B18): the room is VD, the exception is back for the lead.
      await at(after!.aCheckedOutAt!);
      const out = await c.fd!.send(
        'POST',
        url(`/reservations/${a['202'].id}/actions/check-out`),
        { checkoutTime: hm() },
        { 'if-match': `"${(await get(a['202'].id)).version}"` },
      );
      expect(out.statusCode, out.body).toBe(200);
      expect(await roomStatus('202')).toBe(after!.roomStatus);
      const ready = await roomCond(b['202'], 'fdl');
      expect(ready).toMatchObject({ met: xa.roomReadyMet, detail: after!.roomStatus });
      expect(ready.overridableBy).toEqual(expect.arrayContaining(MATRIX.input.exceptionRoles));
      const ok = await checkIn(b['202'], 'fdl', override('Khách cũ đã trả phòng, buồng đang dọn'));
      expect(ok.statusCode, ok.body).toBe(200);
      expect(await statusOf(b['202'])).toBe(xa.stayBStatusAfter);
      expect(await roomStatus('202')).toBe(xa.roomStatusAfter);
      expect(await priorityClean(b['202'])).toBe(xa.priorityCleanTask ? 1 : 0);
    },
    SLOW,
  );

  it(
    'BR-402-04: OD (A in house, room to clean) → no exception for any role, FD request refused too',
    async () => {
      await at(`${ARRIVAL_B}T14:30:00+07:00`);
      await setStatus('203', 'OD');
      const cond = await roomCond(b['203']);
      expect(cond).toMatchObject({ met: MATRIX.expected.roomReadyMet.OD, detail: 'OD' });
      expect(cond.overridableBy).toBeUndefined();
      expect(MATRIX.expected.exceptionAllowed.OD).toBe(false);
      expect(MATRIX.expected.frontDeskRequestAllowed.OD).toBe(false);
      await expectRefused(await checkIn(b['203'], 'fd', override()), b['203'], '203', 'OD');
      for (const role of MATRIX.input.exceptionRoles as string[])
        await expectRefused(
          await checkIn(b['203'], WHO_OF_ROLE[role]!, override()),
          b['203'],
          '203',
          'OD',
        );
      // A request approved today (e.g. sent and approved under v1.0.3) does not open it either: the approval
      // path is gated by the same condition.
      const approvalId = uuidv7();
      await q(
        `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
         target_code, amount_vnd, reason_code, reason_note, requested_by, requested_at, required_role,
         approver_id, approver_role_snapshot, auth_method, decided_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'checkin_room_not_ready', 'approved', 'reservation', $4, $5, 0, 'room_not_ready',
         'Khách chờ ở sảnh', $6, $7, 'front_desk_lead', $8, 'front_desk_lead', 'password', $7, $7, $7)`,
        [
          approvalId,
          t.organizationId,
          t.propertyIds[0],
          b['203'].id,
          b['203'].code,
          t.users.fd!.id,
          fa.clock.now(),
          t.users.fdl!.id,
        ],
      );
      const approved = await checkIn(b['203'], 'fd', {
        roomNotReadyOverride: { approvalRequestId: approvalId },
      });
      expect(approved.statusCode, approved.body).toBe(409);
      expect(approved.json()).toMatchObject({
        code: 'CHECKIN_CONDITIONS_NOT_MET',
        unmet: ['room_ready'],
      });
      expect(await statusOf(b['203'])).toBe('confirmed');
      expect(await roomStatus('203')).toBe('OD');
      expect(await priorityClean(b['203'])).toBe(0);
    },
    SLOW,
  );

  it(
    'BR-402-04: VD and CL with no stay in the room → the lead confirms the exception (OD, priority clean); FD sends a request (202)',
    async () => {
      await at(`${ARRIVAL_B}T14:40:00+07:00`);
      expect(MATRIX.expected.exceptionAllowed).toMatchObject({ VD: true, CL: true });
      for (const [room, status] of [
        ['101', 'VD'],
        ['102', 'CL'],
      ] as const) {
        await setStatus(room, status);
        const cond = await roomCond(b[room]);
        expect(cond).toMatchObject({ met: MATRIX.expected.roomReadyMet[status], detail: status });
        expect(cond.overridableBy).toEqual(expect.arrayContaining(MATRIX.input.exceptionRoles));
        const ask = await checkIn(b[room], 'fd', override());
        expect(ask.statusCode, ask.body).toBe(202);
        expect(ask.json()).toMatchObject({ type: 'checkin_room_not_ready', status: 'pending' });
        const go = await checkIn(b[room], 'fdl', override());
        expect(go.statusCode, go.body).toBe(200);
        expect(await statusOf(b[room])).toBe('in_house');
        expect(await roomStatus(room)).toBe(MATRIX.expected.roomStatusAfterException);
        expect(await priorityClean(b[room])).toBe(MATRIX.expected.priorityCleanTask ? 1 : 0);
      }
    },
    SLOW,
  );

  it(
    'another stay still in house while the status was edited by hand (VD, then VC) → no exception, not even "ready"',
    async () => {
      await at(`${ARRIVAL_B}T14:50:00+07:00`);
      expect(await statusOf(a['201'])).toBe('in_house');
      await setStatus('201', 'VD');
      const vd = await roomCond(b['201'], 'fdl');
      expect(vd).toMatchObject({ met: false, detail: 'VD' });
      expect(vd.overridableBy).toBeUndefined();
      await expectRefused(await checkIn(b['201'], 'fdl', override()), b['201'], '201', 'VD');
      await expectRefused(await checkIn(b['201'], 'fd', override()), b['201'], '201', 'VD');
      await setStatus('201', 'VC');
      const vc = await roomCond(b['201']);
      expect(vc).toMatchObject({ met: false, detail: 'VC' });
      expect(vc.overridableBy).toBeUndefined();
      await expectRefused(await checkIn(b['201'], 'fd'), b['201'], '201', 'VC');
    },
    SLOW,
  );
});
