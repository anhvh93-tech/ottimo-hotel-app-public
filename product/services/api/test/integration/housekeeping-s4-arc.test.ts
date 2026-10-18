/**
 * ARC review Sprint 4 of the housekeeping module (`reviews/s4-ARC.md`, BE-C – tuần Ổn định) on PostgreSQL through
 * the real endpoints:
 * - FB-R2-ARC-BE-S4-01 (+ -06): a PWA offline queue replayed at once (start → finish → inspection) is checked
 *   against the device times of the room's actions, not the server time an action was received at;
 * - -05: a task is never completed before it was started;
 * - -02 / 16.19 bổ sung 3: the HK room path holds the room with KEY SHARE (does not wait for a count/refill,
 *   still waits for a booking command holding it FOR UPDATE, two HK still queue), only cleaning tasks, and a
 *   charged guest-request task takes its folio (L3) BEFORE the task (L4) – money oracle + sequential control;
 * - -03: one "guest in the room" definition (departure day not checked out; room-move day);
 * - -09 (BE-C port for BE-D): `lastFullCleanAt` with the BR-506-03 oracle.
 * Real adapters on both sides: BE-D's GuestRequestStatusPort (`lockForFee`, guest-portal) and BE-C's
 * GuestRequestWorkAdapter. Fake data only.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  FULL_CLEAN_TASK_TYPES,
  GUEST_REQUEST_WORK_PORT,
  type GuestRequestWorkPort,
} from '../../src/modules/housekeeping/public/guest-request-work.port';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import { callName } from '../../src/modules/registration/public/call-name';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const TODAY = '2026-10-15';
const MIN = 60_000;
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; input: any; expected: any }>;
};

const sleep = (ms: number) => new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), ms));

describe.skipIf(!HAS_DB)('housekeeping – ARC review Sprint 4 (S4-01/02/03/05/09)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const uid = (u: string) => t.users[u]!.id;
  const NOW = new Date(T0.getTime() + 120 * MIN); // 11:00 local
  const ago = (min: number) => new Date(NOW.getTime() - min * MIN).toISOString();

  beforeAll(async () => {
    db = appDatabase(12);
    fa = await startFeatureApp(db);
  });
  beforeEach(async () => {
    t = await createTenant(db, {
      users: {
        fd: ['front_desk'],
        fdl: ['front_desk_lead'],
        hk: ['housekeeping'],
        hk2: ['housekeeping'],
        mt: ['maintenance'],
      },
    });
    ids = await seedBooking(db, t);
    await at(NOW);
  });
  afterEach(() => fa.clock.set(T0));
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  async function at(when: Date): Promise<void> {
    fa.clock.set(when);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE user_session SET idle_expires_at = $1, expires_at = $1', [
        new Date(when.getTime() + 3_600_000),
      ]),
    );
  }

  const room = (no: string) => ids.rooms[no] as string;
  const q = <R extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    db.withContext(t.ctx(), async (tx) => (await tx.query<R>(sql, params)).rows);
  const call = (u: string, method: 'GET' | 'POST', path: string, json?: unknown) =>
    staff(fa, tok(u), null, method, `${P(t)}${path}`, json === undefined ? {} : { json });
  const transition = (u: string, roomNo: string, body: Record<string, unknown>) =>
    call(u, 'POST', `/rooms/${room(roomNo)}/status-transitions`, body);

  async function setStatus(roomNo: string, status: string) {
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, since = EXCLUDED.since`,
      [room(roomNo), t.organizationId, t.propertyIds[0], status, T0],
    );
  }

  async function task(
    roomNo: string,
    type: string,
    o: {
      status?: string;
      assigned?: string;
      reservationId?: string;
      guestRequestId?: string;
      doneAt?: Date;
    } = {},
  ) {
    const id = uuidv7();
    await q(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
         source, assigned_user_id, guest_request_id, done_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual', $9, $10, $11, $12, $12)`,
      [
        id,
        t.organizationId,
        t.propertyIds[0],
        room(roomNo),
        o.reservationId ?? null,
        type,
        o.status ?? 'open',
        TODAY,
        o.assigned ? uid(o.assigned) : null,
        o.guestRequestId ?? null,
        o.doneAt ?? null,
        T0,
      ],
    );
    return id;
  }

  const history = (roomNo: string) =>
    q<{ to_state: string; performed_at: Date | null }>(
      `SELECT to_state, performed_at FROM state_transition WHERE machine = 'SM-03' AND entity_id = $1
        ORDER BY occurred_at, id`,
      [room(roomNo)],
    );

  // ───────────────────────── S4-01 / S4-06 / S4-05 ─────────────────────────

  it('S4-01 (US-058, SR-PWA-05): an offline queue start 10:00 → finish 10:30 → inspection 10:40 synced at 11:00 → 200/200/201, room VI, SM-03 keeps the device times; an item 20 min before the last action → 422, within the 5 min clock skew → accepted', async () => {
    await setStatus('201', 'VD');
    await task('201', 'checkout_clean', { assigned: 'hk' });
    const start = await transition('hk', '201', {
      event: 'start_cleaning',
      expectedFrom: 'VD',
      performedAt: ago(60),
    });
    expect(start.statusCode, start.body).toBe(200);
    const finish = await transition('hk', '201', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: ago(30),
    });
    expect(finish.statusCode, finish.body).toBe(200);
    expect(finish.json().status).toBe('VC');
    const cl = (await call('fdl', 'GET', `/inspection-checklist?roomId=${room('201')}`)).json() as {
      version: number;
      items: Array<{ code: string }>;
    };
    const inspect = await call('fdl', 'POST', `/rooms/${room('201')}/inspections`, {
      checklistVersion: cl.version,
      items: cl.items.map((i) => ({ code: i.code, passed: true })),
      performedAt: ago(20),
    });
    expect(inspect.statusCode, inspect.body).toBe(201);
    expect(inspect.json()).toMatchObject({ result: 'pass', roomStatusAfter: 'VI' });
    expect((await history('201')).map((h) => [h.to_state, h.performed_at?.toISOString()])).toEqual([
      ['CL', ago(60)],
      ['VC', ago(30)],
      ['VI', ago(20)],
    ]);

    // Same device clock, the finish 20 min before the start → 422; 3 min before (clock skew) → accepted.
    await setStatus('202', 'VD');
    await task('202', 'checkout_clean', { assigned: 'hk' });
    expect(
      (
        await transition('hk', '202', {
          event: 'start_cleaning',
          expectedFrom: 'VD',
          performedAt: ago(10),
        })
      ).statusCode,
    ).toBe(200);
    const early = await transition('hk', '202', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: ago(30),
    });
    expect(early.statusCode).toBe(422);
    expect(early.json().errors).toEqual([
      { field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' },
    ]);
    const skew = await transition('hk', '202', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: ago(13),
    });
    expect(skew.statusCode, skew.body).toBe(200);
  });

  it('S4-05: a task completed before it was started (device time) → 422; after the start → 200, done_at = the device time', async () => {
    const id = await task('203', 'adhoc_clean', { assigned: 'hk' });
    const act = (action: string, performedAt: string) =>
      call('hk', 'POST', `/hk-tasks/${id}/actions/${action}`, { performedAt });
    expect((await act('start', ago(10))).statusCode).toBe(200);
    const before = await act('complete', ago(30));
    expect(before.statusCode).toBe(422);
    expect(before.json().errors).toEqual([
      { field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' },
    ]);
    expect((await act('complete', ago(8))).statusCode).toBe(200);
    const [row] = await q<{ status: string; started_at: Date; done_at: Date }>(
      'SELECT status, started_at, done_at FROM hk_task WHERE id = $1',
      [id],
    );
    expect(row).toEqual({
      status: 'done',
      started_at: new Date(ago(10)),
      done_at: new Date(ago(8)),
    });
  });

  it('BUG-R2-199 (BUG-R2-163): start / complete / cancel with a device time before the task was created → 422 performedAt; within the 5 min clock skew → accepted', async () => {
    // Tasks created at NOW − 40' (server time).
    const created = new Date(NOW.getTime() - 40 * MIN);
    const mk = async (type: string) => {
      const id = await task('202', type, { assigned: 'hk' });
      await q('UPDATE hk_task SET created_at = $2 WHERE id = $1', [id, created]);
      return id;
    };
    const act = (
      id: string,
      action: string,
      performedAt: string,
      body: Record<string, unknown> = {},
    ) => call('hk', 'POST', `/hk-tasks/${id}/actions/${action}`, { performedAt, ...body });
    const refused = [{ field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' }];
    const a = await mk('adhoc_clean');
    const early = await act(a, 'start', ago(60)); // 20' before the task existed
    expect(early.statusCode).toBe(422);
    expect(early.json().errors).toEqual(refused);
    const earlyDone = await act(a, 'complete', ago(50));
    expect(earlyDone.statusCode).toBe(422);
    expect(earlyDone.json().errors).toEqual(refused);
    expect((await act(a, 'start', ago(43))).statusCode).toBe(200); // 3' before: clock skew
    expect((await act(a, 'complete', ago(30))).statusCode).toBe(200);
    const b = await mk('stayover_clean');
    const earlyCancel = await act(b, 'cancel', ago(55), { cancelReasonCode: 'dnd' });
    expect(earlyCancel.statusCode).toBe(422);
    expect(earlyCancel.json().errors).toEqual(refused);
    expect((await act(b, 'cancel', ago(20), { cancelReasonCode: 'dnd' })).statusCode).toBe(200);
    const [row] = await q<{ status: string }>('SELECT status FROM hk_task WHERE id = $1', [b]);
    expect(row?.status).toBe('cancelled');
  });

  // ───────────────────────── S4-02 ─────────────────────────

  it('S4-02 (2): finish_cleaning naming a minibar refill task → 422 taskId NOT_IN_LIST, nothing written', async () => {
    await setStatus('103', 'CL');
    const refill = await task('103', 'minibar_refill', { assigned: 'hk' });
    const res = await transition('hk', '103', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: ago(5),
      taskId: refill,
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toEqual([{ field: 'taskId', code: 'NOT_IN_LIST' }]);
    expect(await history('103')).toEqual([]);
    expect(
      (await q<{ status: string }>('SELECT status FROM hk_task WHERE id = $1', [refill]))[0],
    ).toEqual({ status: 'open' });
  });

  it('S4-02 (1): the HK room path takes the room with KEY SHARE – it does not wait for a count/refill holding KEY SHARE, it waits for a booking command holding FOR UPDATE, and two HK on one room still queue (one 200, one 409)', async () => {
    const hold = (sql: string, roomNo: string) => {
      let release!: () => void;
      let locked!: () => void;
      const ready = new Promise<void>((r) => (locked = r));
      const gate = new Promise<void>((r) => (release = r));
      const done = db.withContext(t.ctx(), async (tx) => {
        await tx.query(sql, [room(roomNo)]);
        locked();
        await gate;
      });
      return { ready, release, done };
    };
    // A count / refill (onRefillDone, recordMinibarCheck) holds the room KEY SHARE: HK goes through at once.
    await setStatus('301', 'VD');
    await task('301', 'checkout_clean', { assigned: 'hk' });
    const share = hold('SELECT 1 FROM room WHERE id = $1 FOR KEY SHARE', '301');
    await share.ready;
    const through = await Promise.race([
      transition('hk', '301', { event: 'start_cleaning', expectedFrom: 'VD', performedAt: ago(1) }),
      sleep(3000),
    ]);
    share.release();
    await share.done;
    expect(through).not.toBe('timeout');
    expect(through !== 'timeout' && through.statusCode).toBe(200);

    // B7/B9/B13/B14/B18 hold the room FOR UPDATE (L2): HK waits until that command ends.
    await setStatus('302', 'VD');
    await task('302', 'checkout_clean', { assigned: 'hk' });
    const excl = hold('SELECT 1 FROM room WHERE id = $1 FOR UPDATE', '302');
    await excl.ready;
    let settled = false;
    const waiting = transition('hk', '302', {
      event: 'start_cleaning',
      expectedFrom: 'VD',
      performedAt: ago(1),
    }).then((r) => {
      settled = true;
      return r;
    });
    await sleep(400);
    expect(settled).toBe(false);
    excl.release();
    await excl.done;
    expect((await waiting).statusCode).toBe(200);

    // Two HK, same room, same queued action: one applies it, the other gets 409 with currentState CL.
    await setStatus('101', 'VD');
    await task('101', 'checkout_clean');
    const both = await Promise.all(
      ['hk', 'hk2'].map((u) =>
        transition(u, '101', { event: 'start_cleaning', expectedFrom: 'VD', performedAt: ago(2) }),
      ),
    );
    expect(both.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    expect(both.find((r) => r.statusCode === 409)?.json()).toMatchObject({ currentState: 'CL' });
    expect((await history('101')).map((h) => h.to_state)).toEqual(['CL']);
  });

  /** A booking in house in `roomNo` with a charged "Dọn thêm" (BR-506, 100.000) and its HK task. */
  async function chargedRequest(roomNo: string, reservationId?: string) {
    const stay = reservationId
      ? { reservationId }
      : await seedStay(db, t, ids, {
          roomNo,
          status: 'in_house',
          arrival: '2026-10-14',
          departure: '2026-10-17',
        });
    const requestId = uuidv7();
    await q(
      `INSERT INTO guest_request (id, organization_id, property_id, reservation_id, room_id, type, status,
         routed_to, ack_due_at, acknowledged_at, fee_vnd_snapshot, fee_accepted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'extra_cleaning', 'acknowledged', 'housekeeping', $6, $6, 100000, $6, $6, $6)`,
      [requestId, t.organizationId, t.propertyIds[0], stay.reservationId, room(roomNo), T0],
    );
    const taskId = await task(roomNo, 'guest_request', {
      assigned: 'hk',
      reservationId: stay.reservationId,
      guestRequestId: requestId,
    });
    await q('UPDATE guest_request SET hk_task_id = $2 WHERE id = $1', [requestId, taskId]);
    const [f] = await q<{ folio_id: string }>('SELECT folio_id FROM reservation WHERE id = $1', [
      stay.reservationId,
    ]);
    return { reservationId: stay.reservationId, requestId, taskId, folioId: f!.folio_id };
  }

  const money = async (folioId: string) => {
    const lines = await q<{ charge_code: string | null; category: string; amount: string }>(
      `SELECT charge_code, category, amount_vnd::text AS amount FROM folio_line
        WHERE folio_id = $1 AND reversal_of_id IS NULL ORDER BY category, charge_code`,
      [folioId],
    );
    return {
      fees: lines.filter((l) => l.charge_code === 'adhoc_cleaning').map((l) => Number(l.amount)),
      total: lines.reduce((s, l) => s + Number(l.amount), 0),
    };
  };

  it('S4-02 (3) / 16.19 bổ sung 3: completing a charged guest-request task takes the folio (L3) BEFORE the task (L4) – while the folio is held the task is not locked; the fee is posted once (100.000), as in the sequential run', async () => {
    const a = await chargedRequest('202');
    // Something holds the folio (a payment, a folio line, B18 after lockRooms).
    let release!: () => void;
    let locked!: () => void;
    const ready = new Promise<void>((r) => (locked = r));
    const gate = new Promise<void>((r) => (release = r));
    const holder = db.withContext(t.ctx(), async (tx) => {
      await tx.query('SELECT 1 FROM folio WHERE id = $1 FOR UPDATE', [a.folioId]);
      locked();
      await gate;
    });
    await ready;
    const complete = call('hk', 'POST', `/hk-tasks/${a.taskId}/actions/complete`, {
      performedAt: ago(1),
    });
    await sleep(400);
    // The HK command waits on the folio WITHOUT holding the task: another command can still lock the task.
    const probe = await db.withContext(
      t.ctx(),
      async (tx) =>
        (await tx.query('SELECT 1 FROM hk_task WHERE id = $1 FOR UPDATE NOWAIT', [a.taskId]))
          .rowCount,
    );
    expect(probe).toBe(1);
    release();
    await holder;
    const res = await complete;
    expect(res.statusCode, res.body).toBe(200);
    expect(await money(a.folioId)).toEqual({ fees: [100_000], total: 100_000 });
    const [gr] = await q<{ status: string; line: string | null }>(
      'SELECT status, fee_folio_line_id AS line FROM guest_request WHERE id = $1',
      [a.requestId],
    );
    expect(gr?.status).toBe('done');
    expect(gr?.line).not.toBeNull();

    // Sequential control: the same request completed with nothing in the way → the same money.
    const b = await chargedRequest('203');
    const seq = await call('hk', 'POST', `/hk-tasks/${b.taskId}/actions/complete`, {
      performedAt: ago(1),
    });
    expect(seq.statusCode, seq.body).toBe(200);
    expect(await money(b.folioId)).toEqual(await money(a.folioId));
  });

  it('S4-02 race (money oracle + sequential control): HK completes charged requests while the desk posts folio lines on the same folio – no 40P01 / 409 / 500, each fee once, totals equal to the sequential run', async () => {
    const rounds = 4;
    const run = async (roomNo: string, parallel: boolean) => {
      const first = await chargedRequest(roomNo);
      const reqs = [first];
      for (let i = 1; i < rounds; i++) reqs.push(await chargedRequest(roomNo, first.reservationId));
      const statuses: number[] = [];
      for (const [i, r] of reqs.entries()) {
        const hk = () =>
          call('hk', 'POST', `/hk-tasks/${r.taskId}/actions/complete`, { performedAt: ago(1) });
        const line = () =>
          call('fd', 'POST', `/folios/${first.folioId}/lines`, {
            category: 'fnb',
            description: `Nước ${i}`,
            quantity: 1,
            unitPriceVnd: 20_000,
            serviceDate: TODAY,
          });
        const out = parallel ? await Promise.all([hk(), line()]) : [await hk(), await line()];
        statuses.push(...out.map((x) => x.statusCode));
      }
      return { statuses, money: await money(first.folioId) };
    };
    const raced = await run('301', true);
    const sequential = await run('302', false);
    expect(raced.statuses.filter((s) => ![200, 201].includes(s))).toEqual([]);
    expect(raced.money.fees).toEqual(Array(rounds).fill(100_000));
    expect(raced.money).toEqual(sequential.money);
    expect(raced.money.total).toBe(rounds * (100_000 + 20_000));
  });

  // ───────────────────────── S4-03 ─────────────────────────

  it('S4-03 + DATA A7-03: one "guest in the room" definition – departure day not checked out: derived status OC, guest shown, no mismatch; past the departure, not checked out: still in the room (no mismatch); room-move day: only the new room holds the guest (no false mismatch on the old room)', async () => {
    // 401: departs today, still in house, no room_status row (derived).
    await seedStay(db, t, ids, {
      roomNo: '401',
      status: 'in_house',
      arrival: '2026-10-13',
      departure: TODAY,
      bookerName: 'Đoàn Văn Đi',
    });
    // 402 → 102 today (B14): old segment ends today, new one starts today; B14 set 402 VD and 102 OC.
    const moved = await seedStay(db, t, ids, {
      roomNo: '402',
      status: 'in_house',
      arrival: '2026-10-13',
      departure: '2026-10-18',
      bookerName: 'Lý Thị Chuyển',
    });
    await q(`UPDATE reservation_segment SET to_date = $2 WHERE reservation_id = $1`, [
      moved.reservationId,
      TODAY,
    ]);
    await q(
      `INSERT INTO reservation_segment (id, organization_id, property_id, reservation_id, room_id, from_date,
         to_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, '2026-10-18', $7, $7)`,
      [
        randomUUID(),
        t.organizationId,
        t.propertyIds[0],
        moved.reservationId,
        room('102'),
        TODAY,
        T0,
      ],
    );
    await setStatus('402', 'VD');
    await setStatus('102', 'OC');
    // DATA A7-03: 201 still in house one day past its departure (not checked out, not extended), room OD → the
    // guest is in the room: no `room_status_mismatch` (BR-806 – the desk checks out or extends instead).
    await seedStay(db, t, ids, {
      roomNo: '201',
      status: 'in_house',
      arrival: '2026-10-12',
      departure: '2026-10-14',
      bookerName: 'Trần Văn Quá',
    });
    await setStatus('201', 'OD');
    const list = (await call('fdl', 'GET', '/room-statuses')).json().data as Array<{
      roomNo: string;
      status: string;
      currentGuest?: string;
    }>;
    const of = (no: string) => list.find((r) => r.roomNo === no)!;
    expect(of('401')).toMatchObject({ status: 'OC', currentGuest: 'Đoàn Văn Đi' });
    expect(of('402').currentGuest).toBeUndefined();
    expect(of('102')).toMatchObject({ status: 'OC', currentGuest: 'Lý Thị Chuyển' });
    expect(of('201')).toMatchObject({ status: 'OD', currentGuest: 'Trần Văn Quá' });
    const attention = (await call('fd', 'GET', '/attention')).json().data as Array<{
      kind: string;
      roomNos?: string[];
    }>;
    const mismatch = attention.find((i) => i.kind === 'room_status_mismatch')?.roomNos ?? [];
    for (const no of ['401', '402', '102', '201']) expect(mismatch).not.toContain(no);
  });

  // ───────────────────────── BR-614 ─────────────────────────

  it('BR-614 (rbac D01, UXR P-33): housekeeping gets the CALL name + room only – "Phạm Gia Huy" → "Huy", the Korean passport "KIM MIN JUN" linked to the booker → "Kim", next arrival "Trần Thị Mai" → "Mai"; the full name never reaches HK; the desk keeps it; MT gets no name', async () => {
    const huy = await seedStay(db, t, ids, {
      roomNo: '101',
      status: 'in_house',
      arrival: '2026-10-14',
      departure: '2026-10-17',
      bookerName: 'Phạm Gia Huy',
    });
    const kim = await seedStay(db, t, ids, {
      roomNo: '102',
      status: 'in_house',
      arrival: '2026-10-14',
      departure: '2026-10-17',
      bookerName: 'Kim Min Jun',
    });
    await seedStay(db, t, ids, {
      roomNo: '103',
      status: 'confirmed',
      arrival: '2026-10-16',
      departure: '2026-10-18',
      bookerName: 'Trần Thị Mai',
    });
    void huy;
    // Kim's passport, entered by the desk for the booker (partyMemberId = the booking id – ARC 16.22).
    await db.withContext(t.ctx(), (tx) => fa.app.get(RegistrationService).backfill(tx));
    const [reg] = await q<{ id: string }>('SELECT id FROM registration WHERE reservation_id = $1', [
      kim.reservationId,
    ]);
    const device = await t.deviceToken(0);
    const doc = await staff(
      fa,
      tok('fd'),
      device,
      'POST',
      `${P(t)}/registrations/${reg!.id}/documents`,
      {
        multipart: [
          {
            name: 'data',
            value: JSON.stringify({
              partyMemberId: kim.reservationId,
              docType: 'passport',
              fullNameOnDoc: 'KIM MIN JUN',
              docNumber: 'M12345678',
              gender: 'male',
              dateOfBirth: '1991-03-04',
              nationalityCode: 'KOR',
              passportExpiryDate: '2032-01-01',
              visaKind: 'visa_exempt',
              visaValidUntil: '2026-12-01',
              entryDate: '2026-10-13',
              isMain: true,
            }),
            contentType: 'application/json',
          },
        ],
      },
    );
    expect(doc.statusCode, doc.body).toBe(201);
    for (const no of ['101', '102', '103']) await task(no, 'adhoc_clean', { assigned: 'hk' });

    const list = async (u: string) => {
      const res = await call(u, 'GET', '/room-statuses');
      expect(res.statusCode, res.body).toBe(200);
      return {
        raw: res.body,
        of: (no: string) =>
          (res.json().data as Array<Record<string, unknown>>).find((r) => r.roomNo === no)!,
      };
    };
    const hk = await list('hk');
    expect(hk.of('101').currentGuest).toBe('Huy');
    expect(hk.of('102').currentGuest).toBe('Kim');
    expect(hk.of('103').nextArrival).toMatchObject({ date: '2026-10-16', guestDisplayName: 'Mai' });
    for (const full of [
      'Phạm Gia Huy',
      'Kim Min Jun',
      'KIM MIN JUN',
      'Trần Thị Mai',
      'Phạm',
      'Min Jun',
    ]) {
      expect(hk.raw).not.toContain(full);
    }
    // The desk keeps the full name; maintenance never gets a name.
    const fd = await list('fdl');
    expect(fd.of('101').currentGuest).toBe('Phạm Gia Huy');
    expect(fd.of('103').nextArrival).toMatchObject({ guestDisplayName: 'Trần Thị Mai' });
    const mt = await list('mt');
    expect(mt.of('101').currentGuest).toBeUndefined();
    expect(mt.of('103').nextArrival).not.toHaveProperty('guestDisplayName');
    // The call-name rule itself: no name → none (the room number only); a single word stays.
    expect(callName('', null)).toBeNull();
    expect(callName('  ', undefined)).toBeNull();
    expect(callName('Agoda', null)).toBe('Agoda');
    expect(callName('Daniel Weber', null)).toBe('Weber');
  });

  // ───────────────────────── S4-09 port ─────────────────────────

  it('S4-09 (BE-D port): lastFullCleanAt – BR-506-03 oracle (priority clean at check-in is not a full clean), the types of FULL_CLEAN_TASK_TYPES, a guest_request task only when its request is named, cancelled / outside the window never', async () => {
    const o = ORACLES.examples.find((x) => x.id === 'BR-506-03')!;
    const port = fa.app.get<GuestRequestWorkPort>(GUEST_REQUEST_WORK_PORT);
    const last = (roomNo: string, since: string, until: string, requestIds?: string[]) =>
      db.withContext(t.ctx(), (tx) =>
        port.lastFullCleanAt(tx, {
          roomId: room(roomNo),
          since: new Date(since),
          until: new Date(until),
          ...(requestIds ? { fullCleanRequestIds: requestIds } : {}),
        }),
      );
    // The oracle: check-in 11:00, priority clean done 11:40, request 20:00 → no full clean (fee 0 → BE-D).
    for (const d of o.input.tasksDone as Array<{ type: string; doneAt: string }>) {
      await task(o.input.roomNo, d.type, { status: 'done', doneAt: new Date(d.doneAt) });
    }
    expect(await last(o.input.roomNo, o.input.checkinAt, o.input.requestAt)).toBeNull();
    // Each type of the oracle's table, alone in its own room.
    const rooms = ['301', '302', '101', '102'];
    for (const [i, [type, counts]] of Object.entries(
      o.expected.countsAsFullClean as Record<string, boolean>,
    ).entries()) {
      const no = rooms[i]!;
      const doneAt = new Date('2026-10-20T15:00:00+07:00');
      await task(no, type, { status: 'done', doneAt });
      expect(await last(no, o.input.checkinAt, o.input.requestAt), type).toEqual(
        counts ? doneAt : null,
      );
      expect(FULL_CLEAN_TASK_TYPES.includes(type), type).toBe(counts);
    }
    // An earlier "Dọn thêm" task counts only when the caller names its request; a cancelled clean never; a clean
    // after `until` neither.
    const reqDone = new Date('2026-10-20T16:00:00+07:00');
    const stay = await seedStay(db, t, ids, { roomNo: '401', status: 'in_house' });
    const reqId = uuidv7();
    await q(
      `INSERT INTO guest_request (id, organization_id, property_id, reservation_id, room_id, type, status,
         routed_to, ack_due_at, closed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'extra_cleaning', 'done', 'housekeeping', $6, $6, $6, $6)`,
      [reqId, t.organizationId, t.propertyIds[0], stay.reservationId, room('401'), T0],
    );
    await task('401', 'guest_request', { status: 'done', doneAt: reqDone, guestRequestId: reqId });
    const cancelled = await task('401', 'stayover_clean', { status: 'cancelled' });
    await task('401', 'adhoc_clean', {
      status: 'done',
      doneAt: new Date('2026-10-20T21:00:00+07:00'),
    });
    expect(await last('401', o.input.checkinAt, o.input.requestAt)).toBeNull();
    expect(await last('401', o.input.checkinAt, o.input.requestAt, [reqId])).toEqual(reqDone);
    // BE-D's proposed `taskStatus` (ARC S4-07) – status of the linked task, null when unknown.
    const status = (id: string) => db.withContext(t.ctx(), (tx) => port.taskStatus!(tx, id));
    expect(await status(cancelled)).toBe('cancelled');
    expect(await status(uuidv7())).toBeNull();
  });
});
