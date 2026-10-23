/**
 * BE-A – kiểm lại tiền lần 6 (`reviews/s4-money-recheck6.md`):
 * - BUG-R2-198 (R6LOCK-01, ARC 16.19 bổ sung 4): a decision (approve / reject / cancel) on `late_checkout_conflict`
 *   and on `no_show_restore` takes what its `onDecided` writes (booking L1; + room L2, folio L3 for the restore)
 *   BEFORE the request row (L4). Proven on real locks (a test transaction holds L1 / L2 / L3: the decision waits
 *   and the request row stays free) and raced against B18 / B13 / B12 with the serial outcome and money as oracle.
 * - BR-525 G-4 (DOM 18/10): a receipt reversed after B18 that leaves money to collect → the guest's debt (the port
 *   payments calls – ReservationHooks.debtAfterReversal), OWN + MGR told, "Cần chú ý" `checkout_debt` until paid.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { ApprovalService } from '../../src/modules/approvals/public/approval.service';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { ReservationHooks } from '../../src/modules/reservations/public/reservation-hooks';
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
class MinibarCounted implements FrontdeskMinibarPort {
  async checkoutStatus(): Promise<MinibarCheckoutStatus> {
    return { required: false, checked: true };
  }
  async onCheckedOut(): Promise<string | null> {
    return null;
  }
}

/** BR-525-01 (QA, DOM 18/10 – G-4): the oracle of the debt after a reversal. */
const BR525 = (
  JSON.parse(
    readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
  ) as { examples: Array<{ id: string; input: any; expected: any }> }
).examples.find((e) => e.id === 'BR-525-01')!;

type Booking = { id: string; code: string; version: number; folioId: string };
type Res = { statusCode: number; body: string; json(): any };
type Totals = { totalVnd: number; paidVnd: number; balanceDueVnd: number };
const day = (from: string, n: number) => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const code = (r: Res) => {
  try {
    return r.json().code as string | undefined;
  } catch {
    return undefined;
  }
};

describe.skipIf(!HAS_DB)('kiểm lại tiền lần 6 – BE-A', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };

  beforeAll(async () => {
    db = appDatabase(12);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Kiểm Lần Sáu' });
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
      await setPassword(db, t, u);
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
  const create = async (room: string, from: string, to: string): Promise<Booking> => {
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      paymentModel: 'direct',
      adults: 2,
      bookerGuestId: guest,
      arrivalDate: from,
      departureDate: to,
    };
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
  const totals = async (b: Booking): Promise<Totals> => {
    const tt = (await c.fd!.get(url(`/folios/${b.folioId}`))).json().totals;
    return { totalVnd: tt.totalVnd, paidVnd: tt.paidVnd, balanceDueVnd: tt.balanceDueVnd };
  };
  const ready = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );

  // ── real locks ──
  /** A test transaction holding `sql` until released; `pid` = its backend. */
  const hold = async (sql: string, params: unknown[]) => {
    let open!: () => void;
    const gate = new Promise<void>((r) => (open = r));
    let held!: (pid: number) => void;
    const isHeld = new Promise<number>((r) => (held = r));
    const done = db.withContext(t.ctx(), async (tx) => {
      await tx.query(sql, params);
      held((await tx.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!.pid);
      await gate;
    });
    const pid = await isHeld;
    return {
      pid,
      release: async () => {
        open();
        await done;
      },
    };
  };
  /** The backends waiting for a lock `pid` holds (polls until `n` wait, or ~4 s). */
  const waitersOf = async (pid: number, n = 1) => {
    for (let i = 0; i < 270; i += 1) {
      const rows = await q<{ pid: number }>(
        'SELECT pid FROM pg_stat_activity WHERE $1 = ANY (pg_blocking_pids(pid)) ORDER BY pid',
        [pid],
      );
      if (rows.length >= n) return rows.map((r) => Number(r.pid));
      await sleep(15);
    }
    return [];
  };
  /** Whether another transaction can lock the request row right now (NOWAIT). */
  const requestFree = (approvalId: string) =>
    db.withContext(t.ctx(), async (tx) => {
      try {
        await tx.query('SELECT id FROM approval_request WHERE id = $1 FOR UPDATE NOWAIT', [
          approvalId,
        ]);
        return true;
      } catch {
        return false;
      }
    });

  // ── decisions ──
  const approve = (id: string): Promise<Res> =>
    c.mgr!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  const reject = (id: string): Promise<Res> =>
    c.mgr!.send('POST', url(`/approval-requests/${id}/actions/reject`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      reason: 'Căn có khách đến sớm',
    });
  const cancel = (id: string): Promise<Res> =>
    c.fd!.send('POST', url(`/approval-requests/${id}/actions/cancel`), {});
  const DECIDE = { approve, reject, cancel } as const;
  type Decision = keyof typeof DECIDE;
  const requestStatus = async (approvalId: string) =>
    (
      await q<{ status: string }>('SELECT status FROM approval_request WHERE id = $1', [approvalId])
    )[0]!.status;

  // ── late_checkout_conflict ──
  /**
   * 302 d0 → d1 (917.000, paid at check-in), 402 taken d0 → d2, 302 sold again from d1: B15 14:00 on d1 has no
   * alternative room → FD asks a manager (202, `late_checkout_conflict`). `freeRoom` cancels the d1 arrival
   * afterwards (the request stays open) so B13 can extend. The clock is then d1 10:00.
   */
  const conflict = async (d0: string, freeRoom = false) => {
    await at(`${day(d0, -20)}T10:00:00+07:00`);
    const b = await create('302', d0, day(d0, 1));
    await create('402', d0, day(d0, 2));
    const arrival = await create('302', day(d0, 1), day(d0, 3));
    await at(`${d0}T15:00:00+07:00`);
    await ready('302');
    const pv = (
      await c.fd!.get(url(`/reservations/${b.id}/check-in-preview?checkinTime=15:00`))
    ).json();
    const due = pv.amountDueAtCheckinVnd as number;
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
      ...(due > 0 ? { payment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at(`${day(d0, 1)}T09:00:00+07:00`);
    const ask = await act(b.id, 'late-checkout', { checkoutTime: '14:00', requestApproval: true });
    expect(ask.statusCode, ask.body).toBe(202);
    expect(ask.json().type).toBe('late_checkout_conflict');
    if (freeRoom) {
      const cx = await act(arrival.id, 'cancel', { reasonCode: 'found_other' });
      expect(cx.statusCode, cx.body).toBe(200);
    }
    await at(`${day(d0, 1)}T10:00:00+07:00`);
    return { b, approvalId: ask.json().id as string, version: (await get(b.id)).version as number };
  };
  const b18 = (b: Booking, version: number): Promise<Res> =>
    c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/check-out`),
      { checkoutTime: '10:00' },
      {
        'if-match': `"${version}"`,
      },
    );
  const b13 = (b: Booking, version: number): Promise<Res> =>
    c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/extend`),
      { nights: 1 },
      {
        'if-match': `"${version}"`,
      },
    );
  const lcState = async (b: Booking, approvalId: string) => {
    const [r] = await q<{
      status: string;
      agreed: string | null;
      requested: string | null;
      n: number;
    }>(
      `SELECT status, to_char(agreed_checkout_time, 'HH24:MI') AS agreed,
              to_char(late_checkout_requested_time, 'HH24:MI') AS requested,
              (departure_date - arrival_date)::int AS n FROM reservation WHERE id = $1`,
      [b.id],
    );
    const tt = await totals(b);
    return {
      status: r!.status,
      nights: Number(r!.n),
      agreed: r!.agreed,
      requested: r!.requested,
      request: await requestStatus(approvalId),
      totalVnd: tt.totalVnd,
      balanceDueVnd: tt.balanceDueVnd,
    };
  };
  /** The serial outcomes (recheck6 BUG-R2-198 "Số"): the booking command first, or the decision first. */
  const lcSerial = (cmd: 'B18' | 'B13', decision: Decision, first: 'cmd' | 'decision') => {
    if (first === 'cmd') {
      return cmd === 'B18'
        ? {
            status: 'checked_out',
            nights: 1,
            agreed: null,
            requested: null,
            request: 'cancelled',
            totalVnd: 917_000,
            balanceDueVnd: 0,
          }
        : {
            status: 'in_house',
            nights: 2,
            agreed: null,
            requested: null,
            request: 'cancelled',
            totalVnd: 1_834_000,
            balanceDueVnd: 917_000,
          };
    }
    return {
      status: 'in_house',
      nights: 1,
      agreed: decision === 'approve' ? '14:00' : null,
      requested: null,
      request: { approve: 'approved', reject: 'rejected', cancel: 'cancelled' }[decision],
      totalVnd: 917_000,
      balanceDueVnd: 0,
    };
  };

  it('BUG-R2-198: late_checkout_conflict and no_show_restore declare their preLock by type (ApprovalService.decisionHooks – ARC 16.19 bổ sung 4)', () => {
    expect(fa.app.get(ApprovalService).decisionHooks()).toEqual(
      expect.arrayContaining([
        { type: 'late_checkout_conflict', preLock: true },
        { type: 'no_show_restore', preLock: true },
      ]),
    );
  });

  it('BUG-R2-198 (late_checkout_conflict): approve / reject / cancel wait for a transaction holding the booking WITHOUT taking the request row first (L1 → L4)', async () => {
    const weeks = ['2030-09-23', '2030-09-30', '2030-10-07'];
    for (const [i, decision] of (['approve', 'reject', 'cancel'] as const).entries()) {
      const { b, approvalId } = await conflict(weeks[i]!);
      const h = await hold('SELECT id FROM reservation WHERE id = $1 FOR NO KEY UPDATE', [b.id]);
      let pending: Promise<Res> | undefined;
      try {
        pending = DECIDE[decision](approvalId);
        expect((await waitersOf(h.pid)).length, `${decision} waits for the booking`).toBe(1);
        expect(await requestFree(approvalId), `${decision}: request row free while it waits`).toBe(
          true,
        );
      } finally {
        await h.release();
      }
      const r = await pending!;
      expect(r.statusCode, r.body).toBe(200);
      expect(await lcState(b, approvalId)).toEqual(lcSerial('B18', decision, 'decision'));
    }
  }, 120_000);

  it('BUG-R2-198 (late_checkout_conflict): B18 / B13 queued first (booking + room held, folio held by a test transaction) ‖ the decision → no deadlock, the decision answers 409 INVALID_TRANSITION, money as the command alone', async () => {
    const cases: Array<['B18' | 'B13', Decision, string]> = [
      ['B18', 'approve', '2030-11-04'],
      ['B18', 'reject', '2030-11-11'],
      ['B18', 'cancel', '2030-11-18'],
      ['B13', 'approve', '2030-11-25'],
    ];
    for (const [cmd, decision, d0] of cases) {
      const { b, approvalId, version } = await conflict(d0, cmd === 'B13');
      const h = await hold('SELECT id FROM folio WHERE id = $1 FOR UPDATE', [b.folioId]);
      let first: Promise<Res> | undefined;
      let second: Promise<Res> | undefined;
      try {
        first = cmd === 'B18' ? b18(b, version) : b13(b, version);
        const [cmdPid] = await waitersOf(h.pid);
        expect(cmdPid, `${cmd} waits for the folio`).toBeDefined();
        second = DECIDE[decision](approvalId);
        expect(
          (await waitersOf(cmdPid!)).length,
          `${decision} waits behind ${cmd}`,
        ).toBeGreaterThan(0);
        expect(
          await requestFree(approvalId),
          'the decision holds no request row while it waits',
        ).toBe(true);
      } finally {
        await h.release();
      }
      const [o, d] = await Promise.all([first!, second!]);
      expect(o.statusCode, `${cmd} ${o.body}`).toBe(200);
      expect([d.statusCode, code(d)], d.body).toEqual([409, 'INVALID_TRANSITION']);
      expect(await lcState(b, approvalId)).toEqual(lcSerial(cmd, decision, 'cmd'));
    }
  }, 180_000);

  it('BUG-R2-198 (late_checkout_conflict): decision ‖ B18 / B13, natural race – only serial outcomes and money, never 409 CONCURRENT_UPDATE', async () => {
    const seen: string[] = [];
    const cases: Array<['B18' | 'B13', Decision, string]> = [
      ['B18', 'approve', '2030-09-02'],
      ['B18', 'approve', '2030-09-09'],
      ['B18', 'approve', '2030-09-16'],
      ['B18', 'reject', '2030-12-02'],
      ['B13', 'approve', '2030-12-09'],
      ['B13', 'cancel', '2030-12-16'],
    ];
    for (const [cmd, decision, d0] of cases) {
      const { b, approvalId, version } = await conflict(d0, cmd === 'B13');
      const [o, d] = await Promise.all([
        cmd === 'B18' ? b18(b, version) : b13(b, version),
        DECIDE[decision](approvalId),
      ]);
      for (const r of [o, d]) {
        expect(r.statusCode, r.body).not.toBe(500);
        expect(code(r), r.body).not.toBe('CONCURRENT_UPDATE');
      }
      const s = await lcState(b, approvalId);
      if (o.statusCode === 200) {
        expect([d.statusCode, code(d)], d.body).toEqual([409, 'INVALID_TRANSITION']);
        expect(s).toEqual(lcSerial(cmd, decision, 'cmd'));
        seen.push(`${cmd}-first`);
      } else {
        expect([o.statusCode, code(o)], o.body).toEqual([412, 'VERSION_CONFLICT']);
        expect(d.statusCode, d.body).toBe(200);
        expect(s).toEqual(lcSerial(cmd, decision, 'decision'));
        seen.push(`${decision}-first`);
      }
    }
    expect(seen).toHaveLength(6);
  }, 240_000);

  // ── no_show_restore ──
  /**
   * Direct 202, Tue → Thu (2 × 792.000), deposit paid; marked no-show at 23:30; the next day 10:00 FD asks to
   * restore (outside the business day → 202, `no_show_restore`).
   */
  const noShow = async (dA: string) => {
    await at(`${day(dA, -10)}T10:00:00+07:00`);
    const b = await create('202', dA, day(dA, 2));
    await at(`${dA}T23:30:00+07:00`);
    const ns = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Không liên lạc được' });
    expect(ns.statusCode, ns.body).toBe(200);
    const marked = await totals(b);
    await at(`${day(dA, 1)}T10:00:00+07:00`);
    const ask = await act(b.id, 'restore-no-show', { reason: 'Khách tới muộn' });
    expect(ask.statusCode, ask.body).toBe(202);
    expect(ask.json().type).toBe('no_show_restore');
    return {
      b,
      approvalId: ask.json().id as string,
      version: (await get(b.id)).version as number,
      marked,
    };
  };
  const nsState = async (b: Booking, approvalId: string) => {
    const [r] = await q<{ status: string; room: string | null }>(
      `SELECT r.status, s.room_id AS room FROM reservation r
         JOIN reservation_segment s ON s.reservation_id = r.id WHERE r.id = $1`,
      [b.id],
    );
    const [n] = await q<{ n: number; sum: string }>(
      `SELECT count(*)::int AS n, COALESCE(sum(room_revenue_gross_vnd), 0)::text AS sum FROM stay_night
        WHERE reservation_id = $1 AND night_state = 'sold'`,
      [b.id],
    );
    return {
      status: r!.status,
      room: r!.room,
      soldNights: Number(n!.n),
      nightsVnd: Number(n!.sum),
      request: await requestStatus(approvalId),
      ...(await totals(b)),
    };
  };
  /** One restore (BR-315 (3) snapshot prices): 2 × 792.000 back on the folio, the deposit kept. */
  const restored = (request: string, marked: Totals) => ({
    status: 'confirmed',
    room: ids.rooms['202'],
    soldNights: 2,
    nightsVnd: 1_584_000,
    request,
    totalVnd: 1_584_000,
    paidVnd: marked.paidVnd,
    balanceDueVnd: 1_584_000 - marked.paidVnd,
  });

  it('BUG-R2-198 (no_show_restore): approve / reject wait for a transaction holding the booking, its room or its folio WITHOUT taking the request row first (L1 → L2 → L3 → L4); the restore re-posts 2 × 792.000', async () => {
    const holds: Array<[string, (b: Booking) => [string, unknown[]], Decision, string]> = [
      [
        'booking',
        (b) => ['SELECT id FROM reservation WHERE id = $1 FOR NO KEY UPDATE', [b.id]],
        'approve',
        '2031-01-07',
      ],
      [
        'room',
        () => ['SELECT id FROM room WHERE id = $1 FOR UPDATE', [ids.rooms['202']]],
        'approve',
        '2031-01-14',
      ],
      [
        'folio',
        (b) => ['SELECT id FROM folio WHERE id = $1 FOR UPDATE', [b.folioId]],
        'approve',
        '2031-01-21',
      ],
      [
        'folio',
        (b) => ['SELECT id FROM folio WHERE id = $1 FOR UPDATE', [b.folioId]],
        'reject',
        '2031-01-28',
      ],
    ];
    for (const [what, lock, decision, dA] of holds) {
      const { b, approvalId, marked } = await noShow(dA);
      const [sql, params] = lock(b);
      const h = await hold(sql, params);
      let pending: Promise<Res> | undefined;
      try {
        pending = DECIDE[decision](approvalId);
        expect((await waitersOf(h.pid)).length, `${decision} waits for the ${what}`).toBe(1);
        expect(await requestFree(approvalId), `${decision}: request row free while it waits`).toBe(
          true,
        );
      } finally {
        await h.release();
      }
      const r = await pending!;
      expect(r.statusCode, r.body).toBe(200);
      const s = await nsState(b, approvalId);
      if (decision === 'approve') {
        expect(s).toEqual(restored('approved', marked));
      } else {
        expect(s).toMatchObject({
          status: 'no_show',
          soldNights: 0,
          request: 'rejected',
          ...marked,
        });
      }
    }
  }, 180_000);

  it('BUG-R2-198 (no_show_restore): approve ‖ MGR restores directly (B12), natural race × 3 – exactly one restore, serial outcomes, money = one restore, never 409 CONCURRENT_UPDATE', async () => {
    const seen: string[] = [];
    for (const dA of ['2031-02-04', '2031-02-11', '2031-02-18']) {
      const { b, approvalId, version, marked } = await noShow(dA);
      const [m, a] = await Promise.all([
        c.mgr!.send(
          'POST',
          url(`/reservations/${b.id}/actions/restore-no-show`),
          { reason: 'Khách tới muộn' },
          { 'if-match': `"${version}"` },
        ),
        approve(approvalId),
      ]);
      for (const r of [m, a]) {
        expect(r.statusCode, r.body).not.toBe(500);
        expect(code(r), r.body).not.toBe('CONCURRENT_UPDATE');
      }
      const s = await nsState(b, approvalId);
      if (m.statusCode === 200) {
        // B12 first: the approval's B12 finds the booking confirmed → 409, the request stays open (as in sequence).
        expect([a.statusCode, code(a)], a.body).toEqual([409, 'INVALID_TRANSITION']);
        expect(s).toEqual(restored('pending', marked));
        seen.push('b12-first');
      } else {
        expect([m.statusCode, code(m)], m.body).toEqual([412, 'VERSION_CONFLICT']);
        expect(a.statusCode, a.body).toBe(200);
        expect(s).toEqual(restored('approved', marked));
        seen.push('approve-first');
      }
    }
    expect(seen).toHaveLength(3);
  }, 180_000);
  // ── BR-525 G-4: debt after a receipt reversed after check-out ──
  /** 302 Mon → Tue (917.000): bank transfers (`transfers`), the rest in cash at check-in; B18 10:00 (`checkOut`). */
  const paidByTransfer = async (d0: string, checkOut = true, transfers = [100_000]) => {
    await at(`${day(d0, -10)}T10:00:00+07:00`);
    const b = await create('302', d0, day(d0, 1));
    await at(`${d0}T15:00:00+07:00`);
    await ready('302');
    const ids: string[] = [];
    for (const amountVnd of transfers) {
      const tr = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'bank_transfer',
        amountVnd,
      });
      expect(tr.statusCode, tr.body).toBe(201);
      ids.push(tr.json().id as string);
    }
    const pv = (
      await c.fd!.get(url(`/reservations/${b.id}/check-in-preview?checkinTime=15:00`))
    ).json();
    const due = pv.amountDueAtCheckinVnd as number;
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
      ...(due > 0 ? { payment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at(`${day(d0, 1)}T10:00:00+07:00`);
    if (checkOut) {
      const out = await act(b.id, 'check-out', { checkoutTime: '10:00' });
      expect(out.statusCode, out.body).toBe(200);
    }
    expect(await totals(b)).toMatchObject({ totalVnd: 917_000, balanceDueVnd: 0 });
    return { b, transferIds: ids };
  };
  /** The port alone, the way payments calls it (L1 → L3 held first, same transaction). */
  const debtPort = (
    b: Booking,
    paymentId: string,
    dueBeforeVnd: number,
    reason = 'Chuyển khoản không về',
  ) =>
    db.withContext({ ...t.ctx(), userId: t.users.mgr!.id, actorType: 'user' }, async (tx) => {
      await fa.app.get(FolioService).lockStay(tx, b.folioId);
      return fa.app.get(ReservationHooks).debtAfterReversal(tx, {
        folioId: b.folioId,
        paymentId,
        reason,
        dueBeforeVnd,
        actor: { userId: t.users.mgr!.id, roles: ['manager'] },
      });
    });
  /** `after` of the money audits `reservation.debt_on_checkout` of a booking, oldest first. */
  const debtAuditAfter = async (b: Booking) =>
    (
      await q<{ after: any }>(
        `SELECT after FROM audit_event WHERE action = 'reservation.debt_on_checkout' AND entity_id = $1
          ORDER BY occurred_at, id`,
        [b.id],
      )
    ).map((r) => r.after);
  /** Lines posted after check-out (BR-427 (c)). */
  const postCheckoutLines = async (b: Booking) =>
    Number(
      (
        await q<{ n: number }>(
          'SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1 AND post_checkout',
          [b.folioId],
        )
      )[0]!.n,
    );
  /** MGR `reversePayment` (BE-B) – calls the port in its transaction (BUG-R2-200). */
  const reverse = async (paymentId: string, reason = 'Chuyển khoản không về') => {
    const r = await c.mgr!.send('POST', url(`/payments/${paymentId}/actions/reverse`), { reason });
    expect(r.statusCode, r.body).toBe(200);
  };
  const debtOf = async (b: Booking) =>
    (
      await q<{ status: string; mode: string | null; due: string | null; reason: string | null }>(
        `SELECT status, checkout_mode AS mode, debt_due_date::text AS due, debt_reason AS reason
           FROM reservation WHERE id = $1`,
        [b.id],
      )
    )[0];
  const debtItem = async (who: string) =>
    ((await c[who]!.get(url('/attention'))).json().data as any[]).find(
      (x) => x.kind === 'checkout_debt',
    );

  it('BR-525 G-4 (BR-525-01): B18 took 917.000 incl. a 100.000 transfer that never arrives; MGR reverses it → in the same transaction debt 100.000 (checkoutMode debt, due +3 days, reason = the reversal reason, no post_checkout line, folio stays settled), OWN + MGR told, "Cần chú ý" checkout_debt (MGR+ only) until the guest pays again', async () => {
    const { input, expected } = BR525;
    const want = expected.afterReversal;
    const d0 = '2031-03-03';
    const { b, transferIds } = await paidByTransfer(d0, true, [input.reversal.paymentVnd]);
    const billBefore = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
    await reverse(transferIds[0]!, input.reversal.reason);
    expect(await totals(b)).toMatchObject({ totalVnd: 917_000, balanceDueVnd: want.amountDueVnd });
    expect(await debtOf(b)).toEqual({
      status: 'checked_out',
      mode: 'debt',
      due: day(day(d0, 1), 3),
      reason: want.debtReason,
    });
    expect(await debtAuditAfter(b)).toEqual([
      {
        checkoutMode: 'debt',
        debtVnd: want.debtVnd,
        balanceDueVnd: want.amountDueVnd,
        dueDate: day(day(d0, 1), 3),
        // R3 (ARC 16.31.2, BUG-R2-209): the open debt after the record.
        openDebtVnd: want.debtVnd,
      },
    ]);
    // No post_checkout line, the folio stays settled with its bill: only the receipt was reversed.
    expect(await postCheckoutLines(b)).toBe(want.postCheckoutLines);
    const bill = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
    expect(bill.status).toBe(want.folioStatus);
    expect(bill.billNo).toBe(billBefore.billNo);
    // OWN + MGR of the property, never the manager who reversed.
    const told = await q<{ user_id: string }>(
      `SELECT user_id FROM staff_notification WHERE kind = 'debt_recorded' AND ref_id = $1 ORDER BY user_id`,
      [b.id],
    );
    expect(told.map((x) => x.user_id)).toContain(t.users.own!.id);
    expect(told.map((x) => x.user_id)).not.toContain(t.users.mgr!.id);
    const roles = await q<{ role: string }>(
      `SELECT DISTINCT upr.role FROM staff_notification n
         JOIN user_property_role upr ON upr.user_id = n.user_id AND upr.property_id = n.property_id
        WHERE n.kind = 'debt_recorded' AND n.ref_id = $1 ORDER BY upr.role`,
      [b.id],
    );
    expect(roles.every((x) => want.notified.includes(x.role))).toBe(true);
    const item = await debtItem('mgr');
    expect(item).toMatchObject({ kind: 'checkout_debt', source: 'computed', severity: 'warning' });
    expect(Object.keys(item.params)).toEqual(['count']);
    expect(item.reservationIds).toContain(b.id);
    expect(want.attentionOpen).toBe(true);
    expect(await debtItem('fd')).toBeUndefined();
    // The guest transfers the 100.000 again → nothing owed → the stay leaves the item.
    const again = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: input.thenGuestPaysVnd,
    });
    expect(again.statusCode, again.body).toBe(201);
    expect((await totals(b)).balanceDueVnd).toBe(expected.afterGuestPays.debtVnd);
    expect(expected.afterGuestPays.attentionOpen).toBe(false);
    expect((await debtItem('mgr'))?.reservationIds ?? []).not.toContain(b.id);
  }, 120_000);

  it('BR-525 G-4: no debt while the stay is in house or when nothing is left to collect; a second reversal adds only its own amount and keeps the first due date; past it the item is critical', async () => {
    // In house: the reversal is an ordinary balance – no debt (the port itself refuses too).
    const a = await paidByTransfer('2031-03-10', false);
    await reverse(a.transferIds[0]!);
    expect(await debtOf(a.b)).toEqual({ status: 'in_house', mode: null, due: null, reason: null });
    expect(await debtPort(a.b, a.transferIds[0]!, 0)).toMatchObject({
      recorded: false,
      reservationId: null,
    });
    // Checked out, nothing owed → the port records nothing.
    const z = await paidByTransfer('2031-03-17');
    expect(await debtPort(z.b, z.transferIds[0]!, 0)).toEqual({
      recorded: false,
      reservationId: null,
      debtVnd: 0,
      balanceDueVnd: 0,
      dueDate: null,
    });
    expect((await debtOf(z.b))!.mode).toBe('desk');
    // Two transfers (100.000 + 50.000): reversed on 25/03 (debt 100.000, due 28/03) and on 05/04 (debt +50.000 –
    // the increase only) → 150.000 owed, due 28/03 kept → critical.
    const d = await paidByTransfer('2031-03-24', true, [100_000, 50_000]);
    await reverse(d.transferIds[0]!);
    expect((await debtOf(d.b))!.due).toBe('2031-03-28');
    await at('2031-04-05T10:00:00+07:00');
    await reverse(d.transferIds[1]!, 'Đảo khoản thứ hai');
    expect(await totals(d.b)).toMatchObject({ balanceDueVnd: 150_000 });
    expect(await debtOf(d.b)).toEqual({
      status: 'checked_out',
      mode: 'debt',
      due: '2031-03-28',
      reason: 'Chuyển khoản không về',
    });
    expect((await debtAuditAfter(d.b)).map((x) => [x.debtVnd, x.balanceDueVnd])).toEqual([
      [100_000, 100_000],
      [50_000, 150_000],
    ]);
    const item = await debtItem('mgr');
    expect(item.reservationIds).toContain(d.b.id);
    expect(item.severity).toBe('critical');
  }, 120_000);
  it('BR-525 G-4 (DOM 18/10 – amount): the debt is only what the reversal added – a 70.000 charge posted after check-out (still in its window) → reversing 100.000 records 100.000, not 170.000; a 30.000 credit on the folio → reversing 100.000 records 70.000', async () => {
    const reversedDebt = async (paymentId: string) => {
      const [pay] = await q<{ after: any }>(
        `SELECT after FROM audit_event WHERE action = 'payment.reversed' AND entity_id = $1`,
        [paymentId],
      );
      return pay!.after.debtVnd as number | undefined;
    };
    // (1) Minibar 70.000 found after B18, inside post_checkout_charge_hours.
    const m = await paidByTransfer('2031-06-02');
    const late = await c.fd!.send('POST', url(`/folios/${m.b.folioId}/lines`), {
      category: 'fnb',
      description: 'Minibar phát sinh sau trả phòng',
      quantity: 1,
      unitPriceVnd: 70_000,
      serviceDate: '2031-06-03',
    });
    expect(late.statusCode, late.body).toBe(201);
    expect(await postCheckoutLines(m.b)).toBe(1);
    expect((await totals(m.b)).balanceDueVnd).toBe(70_000);
    await reverse(m.transferIds[0]!);
    expect((await totals(m.b)).balanceDueVnd).toBe(170_000);
    expect(await debtAuditAfter(m.b)).toEqual([
      {
        checkoutMode: 'debt',
        debtVnd: 100_000,
        balanceDueVnd: 170_000,
        dueDate: '2031-06-06',
        openDebtVnd: 100_000,
      },
    ]);
    expect(await reversedDebt(m.transferIds[0]!)).toBe(100_000);
    expect(await postCheckoutLines(m.b)).toBe(1);
    // (2) The folio holds a 30.000 credit (paid twice by the guest after B18).
    const r = await paidByTransfer('2031-06-09');
    const extra = await c.fd!.send('POST', url(`/folios/${r.b.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd: 30_000,
      note: 'Khách trả thêm sau trả phòng',
    });
    expect(extra.statusCode, extra.body).toBe(201);
    expect((await totals(r.b)).balanceDueVnd).toBe(0);
    await reverse(r.transferIds[0]!);
    expect((await totals(r.b)).balanceDueVnd).toBe(70_000);
    expect(await debtAuditAfter(r.b)).toEqual([
      {
        checkoutMode: 'debt',
        debtVnd: 70_000,
        balanceDueVnd: 70_000,
        dueDate: '2031-06-13',
        openDebtVnd: 70_000,
      },
    ]);
    expect(await reversedDebt(r.transferIds[0]!)).toBe(70_000);
    // The port itself: the same formula on what the caller read before (no new debt when nothing was added).
    expect(await debtPort(r.b, r.transferIds[0]!, 70_000)).toMatchObject({
      recorded: false,
      debtVnd: 0,
      balanceDueVnd: 70_000,
    });
  }, 120_000);

  it('BR-525 G-4: the default due date is the parameter `debt_default_due_days` (catalogue 0073: default 3 – DOM 18/10 [GIẢ ĐỊNH – chờ INV], OWN/MGR, 1–30) – MGR sets 10 → the next debt is due +10; 31 → 422 PARAM_OUT_OF_RANGE', async () => {
    const [def] = await q<Record<string, unknown>>(
      `SELECT key, value_schema, edit_roles, br_ref, is_security, bounds, default_value
         FROM config_parameter_def WHERE key = 'debt_default_due_days'`,
    );
    expect(def).toEqual({
      key: 'debt_default_due_days',
      value_schema: 'int',
      edit_roles: ['owner', 'manager'],
      br_ref: 'BR-525',
      is_security: false,
      bounds: { min: 1, max: 30 },
      default_value: 3,
    });
    const d0 = '2031-05-05';
    const { b, transferIds } = await paidByTransfer(d0);
    const d1 = day(d0, 1);
    const read = await c.mgr!.get(url('/parameters/debt_default_due_days'));
    expect(read.statusCode, read.body).toBe(200);
    expect(read.json().current).toMatchObject({ key: 'debt_default_due_days', value: 3 });
    const set = (value: number) =>
      c.mgr!.send('PUT', url('/parameters/debt_default_due_days'), {
        value,
        effectiveFrom: d1,
        reason: 'Hạn công nợ theo chính sách mới',
      });
    const tooFar = await set(31);
    expect([tooFar.statusCode, code(tooFar)], tooFar.body).toEqual([422, 'PARAM_OUT_OF_RANGE']);
    const ok = await set(10);
    expect(ok.statusCode, ok.body).toBe(200);
    await reverse(transferIds[0]!);
    expect(await debtOf(b)).toMatchObject({ mode: 'debt', due: day(d1, 10) });
  }, 120_000);
  it('ARC 16.26 (BR-525 G-4 – collecting the debt): openDebt gives the open debt of the stay (100.000, due by the parameter); a part paid → still open with 50.000 and debtSettled answers settled: false; the rest paid (recordPayment calls debtSettled) → closed (debt_settled_at, state audit), checkout_debt drops it, openDebt null; a new reversal re-opens it', async () => {
    const asMgr = <T>(fn: (tx: any) => Promise<T>) =>
      db.withContext({ ...t.ctx(), userId: t.users.mgr!.id, actorType: 'user' }, async (tx) => {
        await fa.app.get(FolioService).lockStay(tx, b.folioId);
        return fn(tx);
      });
    const openDebt = () => asMgr((tx) => fa.app.get(ReservationHooks).openDebt(tx, b.folioId));
    const settled = (paymentId: string) =>
      asMgr((tx) =>
        fa.app.get(ReservationHooks).debtSettled(tx, {
          folioId: b.folioId,
          paymentId,
          actor: { userId: t.users.fd!.id, roles: ['front_desk'] },
        }),
      );
    const payCash = async (amountVnd: number) => {
      const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd,
        note: 'Khách trả công nợ',
      });
      expect(r.statusCode, r.body).toBe(201);
      return r.json().id as string;
    };
    const settledAt = async () =>
      (
        await q<{ at: Date | null }>(
          'SELECT debt_settled_at AS at FROM reservation WHERE id = $1',
          [b.id],
        )
      )[0]!.at;
    const d0 = '2031-07-07';
    const d1 = day(d0, 1);
    const { b, transferIds } = await paidByTransfer(d0, true, [100_000, 50_000]);
    expect(await openDebt()).toBeNull();
    // The due date follows `debt_default_due_days` in force (an earlier case of this file set it to 10).
    const days = (await c.mgr!.get(url('/parameters/debt_default_due_days'))).json().current
      .value as number;
    await reverse(transferIds[0]!);
    expect(await openDebt()).toEqual({
      reservationId: b.id,
      reservationCode: b.code,
      reservationIds: [b.id],
      dueDate: day(d1, days),
      balanceDueVnd: 100_000,
      openDebtVnd: 100_000,
    });
    // A part paid (later than the reversal): the debt stays open with the rest.
    await at(`${d1}T10:30:00+07:00`);
    const part = await payCash(50_000);
    expect(await settled(part)).toEqual({
      settled: false,
      reservationIds: [],
      balanceDueVnd: 50_000,
      outcome: null,
    });
    expect(await openDebt()).toMatchObject({ balanceDueVnd: 50_000, openDebtVnd: 50_000 });
    expect(await settledAt()).toBeNull();
    expect((await debtItem('mgr'))?.reservationIds ?? []).toContain(b.id);
    // The rest paid: payments (BE-B `recordPayment`, debt branch) calls debtSettled in its transaction → closed.
    const rest = await payCash(50_000);
    expect(await settledAt()).toEqual(new Date(`${d1}T10:30:00+07:00`));
    const [audit] = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event
        WHERE action = 'reservation.debt_settled' AND category = 'state' AND entity_id = $1`,
      [b.id],
    );
    expect(Number(audit!.n)).toBe(1);
    expect(await openDebt()).toBeNull();
    expect((await debtItem('mgr'))?.reservationIds ?? []).not.toContain(b.id);
    // Calling it again changes nothing (already closed).
    expect(await settled(rest)).toEqual({
      settled: false,
      reservationIds: [],
      balanceDueVnd: 0,
      outcome: null,
    });
    // A new reversal (the 50.000 transfer) re-opens the debt; its first due date stays.
    await reverse(transferIds[1]!);
    expect(await settledAt()).toBeNull();
    expect(await openDebt()).toMatchObject({
      dueDate: day(d1, days),
      balanceDueVnd: 50_000,
      openDebtVnd: 50_000,
    });
    expect((await debtItem('mgr'))?.reservationIds ?? []).toContain(b.id);
  }, 120_000);
  it('ARC 16.27 (R7LOCK-01 + R7LOCK-02): J15 – window over with 70.000 owed (minibar found after check-out) and no debt → debtOnCheckout records ONE debt of 70.000 due +3 (out 16/11 → 17/11 → due 20/11), audit, OWN + MGR told, checkout_debt; a second call records nothing; MGR writes it off through requestFoc `debt_write_off`: a part → openDebt 40.000, still open; to 0 → openDebt null, the debt closed as written_off', async () => {
    const SYSTEM = { userId: '00000000-0000-0000-0000-000000000000', roles: ['owner'] };
    const hooks = fa.app.get(ReservationHooks);
    const folios = fa.app.get(FolioService);
    const d0 = '2032-11-15';
    const { b } = await paidByTransfer(d0);
    // Minibar 70.000 found at 15:00, inside the 24-hour window.
    await at('2032-11-16T15:00:00+07:00');
    const late = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category: 'fnb',
      description: 'Minibar phát sinh sau trả phòng',
      quantity: 1,
      unitPriceVnd: 70_000,
      serviceDate: '2032-11-16',
    });
    expect(late.statusCode, late.body).toBe(201);
    const [minibar] = await q<{ id: string; revenue_group: string }>(
      `SELECT id, revenue_group FROM folio_line WHERE folio_id = $1 AND post_checkout AND amount_vnd = 70000`,
      [b.folioId],
    );
    // J15 (BE-B) at 17/11 10:01 – its own transaction, system context, L1 → L3 first.
    await at('2032-11-17T10:01:00+07:00');
    const job = <T>(fn: (tx: any) => Promise<T>) =>
      db.withContext(t.ctx(), async (tx) => {
        await folios.lockStay(tx, b.folioId);
        return fn(tx);
      });
    const close = () =>
      job((tx) =>
        hooks.debtOnCheckout(tx, {
          folioId: b.folioId,
          reason: 'post_checkout_unpaid',
          dueDays: 3,
          actor: SYSTEM,
        }),
      );
    expect(await close()).toEqual({
      recorded: true,
      reservationId: b.id,
      debtVnd: 70_000,
      balanceDueVnd: 70_000,
      dueDate: '2032-11-20',
    });
    expect(await debtOf(b)).toEqual({
      status: 'checked_out',
      mode: 'debt',
      due: '2032-11-20',
      reason: 'post_checkout_unpaid',
    });
    expect(await debtAuditAfter(b)).toEqual([
      {
        checkoutMode: 'debt',
        debtVnd: 70_000,
        balanceDueVnd: 70_000,
        dueDate: '2032-11-20',
        openDebtVnd: 70_000,
      },
    ]);
    const told = (
      await q<{ user_id: string }>(
        `SELECT user_id FROM staff_notification WHERE kind = 'debt_recorded' AND ref_id = $1`,
        [b.id],
      )
    ).map((x) => x.user_id);
    expect(told).toEqual(expect.arrayContaining([t.users.own!.id, t.users.mgr!.id]));
    expect((await debtItem('mgr'))?.reservationIds ?? []).toContain(b.id);
    // The debt is open: J15 run again records nothing.
    expect(await close()).toMatchObject({ recorded: false, debtVnd: 0, balanceDueVnd: 70_000 });
    // R7LOCK-02: MGR writes the minibar line off – `requestFoc` `debt_write_off` (BE-B; self-applied within the
    // price of one night), which calls debtSettled itself when the folio owes nothing.
    const writeOff = async (amountVnd: number) => {
      const r = await c.mgr!.send('POST', url(`/folios/${b.folioId}/lines/${minibar!.id}/foc`), {
        kind: 'foc',
        amountVnd,
        reasonCode: 'debt_write_off',
        note: 'Khách không liên lạc được',
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
      expect(r.statusCode, r.body).toBe(201);
      expect(r.json()).toMatchObject({ status: 'approved', reasonCode: 'debt_write_off' });
      return r.json().id as string;
    };
    const openDebt = () => job((tx) => hooks.openDebt(tx, b.folioId));
    const settledAt = async () =>
      (
        await q<{ at: Date | null }>(
          'SELECT debt_settled_at AS at FROM reservation WHERE id = $1',
          [b.id],
        )
      )[0]!.at;
    await at('2032-11-17T10:05:00+07:00');
    const part = await writeOff(30_000);
    expect(await openDebt()).toMatchObject({
      reservationId: b.id,
      balanceDueVnd: 40_000,
      openDebtVnd: 40_000,
      dueDate: '2032-11-20',
    });
    expect(await settledAt()).toBeNull();
    // debtSettled on a debt still owed changes nothing.
    expect(
      await job((tx) =>
        hooks.debtSettled(tx, {
          folioId: b.folioId,
          paymentId: part,
          outcome: 'written_off',
          actor: { userId: t.users.mgr!.id, roles: ['manager'] },
        }),
      ),
    ).toEqual({ settled: false, reservationIds: [], balanceDueVnd: 40_000, outcome: null });
    await writeOff(40_000);
    expect((await totals(b)).balanceDueVnd).toBe(0);
    expect(await openDebt()).toBeNull();
    expect(await settledAt()).toEqual(new Date('2032-11-17T10:05:00+07:00'));
    const [settledAudit] = await q<{ after: any }>(
      `SELECT after FROM audit_event WHERE action = 'reservation.debt_settled' AND entity_id = $1`,
      [b.id],
    );
    expect(settledAudit!.after).toMatchObject({ debtOutcome: 'written_off', balanceDueVnd: 0 });
    expect((await debtItem('mgr'))?.reservationIds ?? []).not.toContain(b.id);
    // Nothing owed any more: J15 records nothing.
    expect(await close()).toMatchObject({ recorded: false, balanceDueVnd: 0 });
  }, 120_000);
  it('DOM 18/10 (BR-525) openDebtVnd – the open debt from the debt records, one source: a 100.000 receipt reversed while a 70.000 minibar line is still in its window → owed 170.000, open debt 100.000; 30.000 collected → 70.000; the window over → everything owed (140.000) is the debt', async () => {
    const d0 = '2032-12-06';
    const d1 = day(d0, 1);
    const { b, transferIds } = await paidByTransfer(d0);
    const openDebt = () =>
      db.withContext(t.ctx(), async (tx) => {
        await fa.app.get(FolioService).lockStay(tx, b.folioId);
        return fa.app.get(ReservationHooks).openDebt(tx, b.folioId);
      });
    await at(`${d1}T11:00:00+07:00`);
    const late = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category: 'fnb',
      description: 'Minibar phát sinh sau trả phòng',
      quantity: 1,
      unitPriceVnd: 70_000,
      serviceDate: d1,
    });
    expect(late.statusCode, late.body).toBe(201);
    expect(await openDebt()).toBeNull();
    await at(`${d1}T12:00:00+07:00`);
    await reverse(transferIds[0]!);
    expect(await openDebt()).toMatchObject({ balanceDueVnd: 170_000, openDebtVnd: 100_000 });
    await at(`${d1}T13:00:00+07:00`);
    const pay = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd: 30_000,
      note: 'Khách trả một phần công nợ',
    });
    expect(pay.statusCode, pay.body).toBe(201);
    expect(await openDebt()).toMatchObject({ balanceDueVnd: 140_000, openDebtVnd: 70_000 });
    // The window (24 hours from the check-out at d1 10:00) is over: everything owed is the debt.
    await at(`${day(d1, 1)}T10:01:00+07:00`);
    expect(await openDebt()).toMatchObject({ balanceDueVnd: 140_000, openDebtVnd: 140_000 });
  }, 120_000);
});
