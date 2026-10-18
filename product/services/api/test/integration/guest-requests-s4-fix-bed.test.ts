/**
 * EP14 fixes after the ARC review (rounds/round-02/reviews/s4-ARC.md FB-R2-ARC-BE-S4-07/-08/-09, stabilisation
 * week 18/10) on the real PostgreSQL through the HTTP surface, with BE-C's REAL GUEST_REQUEST_WORK_PORT
 * (GuestRequestWorkAdapter → HousekeepingService) and the real GUEST_REQUEST_STATUS_PORT – no fake port (S4-11):
 * - S4-07 (money): a request carried by a linked HK task is charged (BR-506) only when THAT TASK is done – the
 *   desk's `complete` never posts the fee (task open or cancelled → nothing on the folio); the fee still lands
 *   once when the task is done after the desk closed the request; a request without linked work is charged at
 *   `complete`; `decline` of an `in_progress` request whose task was cancelled (port `taskStatus`, proposed to BE-C).
 * - S4-08 (ARC 16.19 bổ sung 3 – folio L3 → hk_task L4 → guest_request L4b): forced interleavings in BOTH orders
 *   (a session parks the request row, the first command queues on it, the second queues behind the first) for
 *   decline ‖ HK complete, decline ‖ HK start, desk complete ‖ HK complete; each equal to its sequential control,
 *   never 409 CONCURRENT_UPDATE (= 40P01 / lock timeout), oracle = the `adhoc_cleaning` lines of the folio.
 *   `lockForFee` locks the folio of a fee still to post, nothing otherwise.
 * - S4-09: the "second full clean" fee decision reads housekeeping through `lastFullCleanAt` (real tasks done by
 *   HK: a priority clean and an amenities task do not count, an earlier "Dọn thêm" task does – BR-506-03).
 * - SEC BE-77 (B-15 V2): `replyNote` with a price + unit and a date near today passes; birth date / code / phone not.
 * Fake clock (15/10/2026, VN). FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { type Database, SET_CONTEXT_SQL } from '../../src/db/database';
import { GuestRequestsService } from '../../src/modules/guest-portal/internal/guest-requests.service';
import {
  type GuestRequestWork,
  UnwiredGuestRequestWorkPort,
} from '../../src/modules/guest-portal/public/guest-request-ports';
import type { HkTaskStatus } from '../../src/modules/housekeeping/public/guest-request-work.port';
import { GuestRequestStatusPort } from '../../src/modules/guest-portal/public/guest-request-status.port';
import { RATE_LIMITER, type RateLimiter } from '../../src/modules/identity/public/rate-limiter';
import {
  type FeatureApp,
  type LightMyRequestResponse,
  P,
  cookieValue,
  startFeatureApp,
} from '../helpers/feature-app';
import {
  GUEST_TEST_ORIGIN,
  guest,
  seedStay,
  setStayStatus,
  staff,
} from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const FEE = 100_000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Stay {
  reservationId: string;
  folioId: string;
  sid: string;
}

describe.skipIf(!HAS_DB)('EP14 fixes S4-07/-08/-09 – real housekeeping port (BE-D)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let svc: { work: GuestRequestWork };
  let real: GuestRequestWork;
  const stays: Record<string, Stay> = {};
  const tok = (u: string) => t.users[u]!.sessionToken;

  beforeAll(async () => {
    db = appDatabase(12);
    t = await createTenant(db, {
      users: { fd: ['front_desk'], fdl: ['front_desk_lead'], hk: ['housekeeping'] },
    });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
    svc = fa.app.get(GuestRequestsService) as unknown as { work: GuestRequestWork };
    real = svc.work;
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const now = () => fa.clock.now();
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const outcome = (r: LightMyRequestResponse) =>
    `${r.statusCode}${r.statusCode >= 400 ? `:${r.json().code}` : ''}`;

  async function stayIn(room: string, stayType: 'short' | 'long'): Promise<Stay> {
    const s = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: room,
      stayType,
      departure: stayType === 'long' ? '2026-12-15' : '2026-10-18',
    });
    await setStayStatus(db, t, s.reservationId, 'in_house', {
      actualCheckinAt: new Date('2026-10-15T08:00:00+07:00'),
    });
    const link = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${s.reservationId}/guest-link`,
    );
    expect(link.statusCode, link.body).toBe(201);
    const open = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token: new URL(link.json().url).pathname.slice(3) },
      headers: { 'x-forwarded-for': '9.9.9.9', 'accept-language': 'vi-VN' },
    });
    expect(open.statusCode, open.body).toBe(200);
    const [f] = await q<{ folio_id: string }>('SELECT folio_id FROM reservation WHERE id = $1', [
      s.reservationId,
    ]);
    return {
      reservationId: s.reservationId,
      folioId: f!.folio_id,
      sid: cookieValue(open, 'ottimo_gsid') as string,
    };
  }

  /** A guest request through the guest API; its linked task id (real adapter) read back. */
  async function request(
    stay: Stay,
    type: 'extra_cleaning' | 'amenities' = 'extra_cleaning',
    paid = true,
  ): Promise<{ id: string; task: string | null }> {
    fa.app.get<RateLimiter>(RATE_LIMITER).resetAll();
    const r = await guest(fa, stay.sid, 'POST', '/v1/guest/requests', {
      json: type === 'amenities' ? { type, note: 'Thêm 2 khăn tắm' } : { type, feeAccepted: paid },
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().feeVnd).toBe(paid && type === 'extra_cleaning' ? FEE : null);
    const [row] = await q<{ hk_task_id: string | null }>(
      'SELECT hk_task_id FROM guest_request WHERE id = $1',
      [r.json().id],
    );
    return { id: r.json().id, task: row!.hk_task_id };
  }

  const desk = (id: string, action: string, body: unknown = {}) =>
    staff(fa, tok('fd'), null, 'POST', `${P(t)}/guest-requests/${id}/actions/${action}`, {
      json: body,
    });
  const task = (who: 'hk' | 'fd', taskId: string, action: string, body: object = {}) =>
    staff(fa, tok(who), null, 'POST', `${P(t)}/hk-tasks/${taskId}/actions/${action}`, {
      json: { performedAt: now().toISOString(), ...body },
    });
  /** The BR-506 oracle: `adhoc_cleaning` lines on the stay's folio. */
  const feeLines = async (stay: Stay) =>
    q<{ id: string; amount_vnd: number }>(
      `SELECT id, amount_vnd FROM folio_line WHERE folio_id = $1 AND charge_code = 'adhoc_cleaning'
        ORDER BY created_at, id`,
      [stay.folioId],
    );
  const state = async (id: string) =>
    (
      await q<{ status: string; task: string | null; line: string | null }>(
        `SELECT g.status, t.status AS task, g.fee_folio_line_id AS line FROM guest_request g
           LEFT JOIN hk_task t ON t.id = g.hk_task_id WHERE g.id = $1`,
        [id],
      )
    )[0]!;

  it('setup 15/10 09:00: in-house stays (long = always charged, short 401); the real BE-C port is bound', async () => {
    await at('2026-10-15T09:00:00+07:00');
    expect((fa.app.get(GuestRequestsService) as GuestRequestsService).workPortWired).toBe(true);
    for (const room of ['101', '102', '103', '201', '202', '203', '301', '302', '402']) {
      stays[room] = await stayIn(room, 'long');
    }
    stays['401'] = await stayIn('401', 'short');
  });

  // ───────────────────────── S4-09: lastFullCleanAt through the port ─────────────────────────

  it('S4-09 / BR-506-03: priority clean and amenities task do not count; the task of an earlier "Dọn thêm" does → second clean 100.000 from 10:00', async () => {
    const s = stays['401']!;
    const options = async () =>
      (
        (await guest(fa, s.sid, 'GET', '/v1/guest/request-options')).json().data as Array<{
          type: string;
          feeVnd: number | null;
          feeReason: string | null;
          lastFullCleanTime: string | null;
        }>
      ).find((o) => o.type === 'extra_cleaning')!;
    // Priority clean preparing the room at check-in (data – BR-402 (1) exception): not a full clean.
    await q(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date, source,
         done_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'priority_clean', 'done', '2026-10-15', 'system', $6, $6, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        ids.rooms['401'],
        s.reservationId,
        new Date('2026-10-15T08:40:00+07:00'),
      ],
    );
    expect(await options()).toMatchObject({ feeVnd: null, lastFullCleanTime: null });
    // Towels (amenities) done by HK through the real port: not a clean.
    await at('2026-10-15T09:30:00+07:00');
    const towels = await request(s, 'amenities', false);
    expect((await task('hk', towels.task!, 'complete')).statusCode).toBe(200);
    expect(await state(towels.id)).toMatchObject({ status: 'done', task: 'done' });
    expect(await options()).toMatchObject({ feeVnd: null, lastFullCleanTime: null });
    // First "Dọn thêm" of the day is free (short stay, no full clean yet); its task done at 10:00.
    const first = await request(s, 'extra_cleaning', false);
    await at('2026-10-15T10:00:00+07:00');
    expect((await task('hk', first.task!, 'complete')).statusCode).toBe(200);
    expect(await options()).toMatchObject({
      feeVnd: FEE,
      feeReason: 'second_full_clean',
      lastFullCleanTime: '10:00',
    });
    expect(await feeLines(s)).toEqual([]);
  });

  // ───────────────────────── S4-07: no fee for work not done ─────────────────────────

  it('S4-07 (a): paid request, the desk cancels the linked task (guest refused) → complete closes it with NO fee', async () => {
    await at('2026-10-15T11:00:00+07:00');
    const s = stays['101']!;
    const r = await request(s);
    const cancel = await task('fd', r.task!, 'cancel', { cancelReasonCode: 'guest_refused' });
    expect(cancel.statusCode, cancel.body).toBe(200);
    expect(await state(r.id)).toMatchObject({ status: 'new', task: 'cancelled' }); // EP14 4.4: no change
    expect((await desk(r.id, 'acknowledge')).statusCode).toBe(200);
    const done = await desk(r.id, 'complete', { replyNote: 'Khách không cần dọn nữa' });
    expect(done.statusCode, done.body).toBe(200);
    expect(await state(r.id)).toEqual({ status: 'done', task: 'cancelled', line: null });
    expect(await feeLines(s)).toEqual([]);
  });

  it('S4-07 (a): the desk closes a paid request while its task is still open → no fee; the task cancelled afterwards → still none', async () => {
    const s = stays['101']!;
    const r = await request(s);
    expect((await desk(r.id, 'acknowledge')).statusCode).toBe(200);
    expect((await desk(r.id, 'complete')).statusCode).toBe(200);
    expect(await state(r.id)).toEqual({ status: 'done', task: 'open', line: null });
    expect(await feeLines(s)).toEqual([]);
    expect(
      (await task('fd', r.task!, 'cancel', { cancelReasonCode: 'guest_refused' })).statusCode,
    ).toBe(200);
    expect(await feeLines(s)).toEqual([]);
    expect(outcome(await task('hk', r.task!, 'complete'))).toBe('409:INVALID_TRANSITION');
  });

  it('S4-07: the desk closed the request first, HK then does the cleaning → the fee lands once, when the task is done', async () => {
    const s = stays['102']!;
    const r = await request(s);
    expect((await desk(r.id, 'acknowledge')).statusCode).toBe(200);
    expect((await desk(r.id, 'complete')).statusCode).toBe(200);
    expect(await feeLines(s)).toEqual([]);
    expect((await task('hk', r.task!, 'start')).statusCode).toBe(200);
    expect((await task('hk', r.task!, 'complete')).statusCode).toBe(200);
    const lines = await feeLines(s);
    expect(lines.map((l) => Number(l.amount_vnd))).toEqual([FEE]);
    expect(await state(r.id)).toEqual({ status: 'done', task: 'done', line: lines[0]!.id });
    const history = await q<{ to_state: string }>(
      `SELECT to_state FROM state_transition WHERE machine = 'SM-15' AND entity_id = $1 ORDER BY occurred_at, id`,
      [r.id],
    );
    expect(history.map((h) => h.to_state)).toEqual(['new', 'acknowledged', 'done']);
  });

  it('S4-07 (c): HK done → fee once; the desk completing afterwards → 409, still one line', async () => {
    const s = stays['201']!;
    const r = await request(s);
    expect((await task('hk', r.task!, 'start')).statusCode).toBe(200);
    expect((await state(r.id)).status).toBe('in_progress');
    expect((await task('hk', r.task!, 'complete')).statusCode).toBe(200);
    expect(outcome(await desk(r.id, 'complete'))).toBe('409:INVALID_TRANSITION');
    const lines = await feeLines(s);
    expect(lines.map((l) => Number(l.amount_vnd))).toEqual([FEE]);
    expect(await state(r.id)).toEqual({ status: 'done', task: 'done', line: lines[0]!.id });
  });

  it('S4-07 (b): in_progress request whose task was cancelled – decline needs the port `taskStatus` (proposed to BE-C); without it the desk completes, never charged', async () => {
    const s = stays['103']!;
    // No product path cancels a started guest-request task today (task cancel: `open` only; J8/OOO skip
    // `guest_request`) – the state is written as data to cover a future path (ARC S4-07 "khối OOO").
    const startedThenCancelled = async () => {
      const r = await request(s);
      expect((await task('hk', r.task!, 'start')).statusCode).toBe(200);
      await q(
        `UPDATE hk_task SET status = 'cancelled', cancel_reason_code = 'room_blocked', updated_at = $2
          WHERE id = $1`,
        [r.task, now()],
      );
      return r;
    };
    const without: GuestRequestWork = {
      createTask: (tx, i) => real.createTask(tx, i),
      createWorkOrder: (tx, i) => real.createWorkOrder(tx, i),
      cancelTask: (tx, id, n) => real.cancelTask(tx, id, n),
      lastFullCleanAt: (tx, i) => real.lastFullCleanAt(tx, i),
    };
    const withStatus: GuestRequestWork = {
      ...without,
      // BE-C's method when it exists, else the proposed contract on the same table.
      taskStatus: real.taskStatus
        ? (tx, id) => real.taskStatus!(tx, id)
        : async (tx, id) =>
            (
              await tx.query<{ status: HkTaskStatus }>('SELECT status FROM hk_task WHERE id = $1', [
                id,
              ])
            ).rows[0]?.status ?? null,
    };
    try {
      // Task really in progress → decline refused whatever the port.
      svc.work = withStatus;
      const busy = await request(s);
      expect((await task('hk', busy.task!, 'start')).statusCode).toBe(200);
      expect(
        outcome(await desk(busy.id, 'decline', { declinedReasonCode: 'not_available_now' })),
      ).toBe('409:INVALID_TRANSITION');
      expect((await task('hk', busy.task!, 'complete')).statusCode).toBe(200); // done → 1 line
      // Port without taskStatus: decline still refused; complete closes it with no fee.
      svc.work = without;
      const a = await startedThenCancelled();
      expect(
        outcome(await desk(a.id, 'decline', { declinedReasonCode: 'not_available_now' })),
      ).toBe('409:INVALID_TRANSITION');
      expect((await desk(a.id, 'complete')).statusCode).toBe(200);
      expect(await state(a.id)).toEqual({ status: 'done', task: 'cancelled', line: null });
      // Port with taskStatus: the in_progress request with a cancelled task can be declined.
      svc.work = withStatus;
      const b = await startedThenCancelled();
      const declined = await desk(b.id, 'decline', { declinedReasonCode: 'not_available_now' });
      expect(declined.statusCode, declined.body).toBe(200);
      expect(declined.json()).toMatchObject({ status: 'declined' });
      expect(await state(b.id)).toEqual({ status: 'declined', task: 'cancelled', line: null });
    } finally {
      svc.work = real;
    }
    expect((await feeLines(s)).map((l) => Number(l.amount_vnd))).toEqual([FEE]); // only the task done
  });

  it('S4-07: a paid request WITHOUT linked work (port not bound) is charged by the complete that closes it – once', async () => {
    const s = stays['202']!;
    svc.work = new UnwiredGuestRequestWorkPort();
    let r: { id: string; task: string | null };
    try {
      r = await request(s);
    } finally {
      svc.work = real;
    }
    expect(r.task).toBeNull();
    expect((await desk(r.id, 'acknowledge')).statusCode).toBe(200);
    expect((await desk(r.id, 'complete')).statusCode).toBe(200);
    expect(outcome(await desk(r.id, 'complete'))).toBe('409:INVALID_TRANSITION');
    const lines = await feeLines(s);
    expect(lines.map((l) => Number(l.amount_vnd))).toEqual([FEE]);
    expect(await state(r.id)).toEqual({ status: 'done', task: null, line: lines[0]!.id });
  });

  it('SEC BE-77 (B-15 V2, s4-SEC.md C.6): the desk can write a price with its unit and a date near today; a birth date, a door code or a phone is still refused', async () => {
    fa.app.get<RateLimiter>(RATE_LIMITER).resetAll();
    const s = stays['401']!;
    const tour = await guest(fa, s.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'transport_tour', note: 'Đặt xe đi Langbiang sáng mai' },
    });
    expect(tour.statusCode, tour.body).toBe(201);
    const id = tour.json().id;
    for (const replyNote of [
      'Ngày sinh khách 05-03-1990',
      'Mã cửa 482913đ',
      'Gọi 0912 345 678 giá 350.000đ',
      'Mã ４８２９１３',
    ]) {
      const r = await desk(id, 'decline', { declinedReasonCode: 'other', replyNote });
      expect(r.statusCode, replyNote).toBe(422);
      expect(r.json().errors, replyNote).toEqual([
        { field: 'replyNote', code: 'SENSITIVE_DATA_DETECTED' },
      ]);
    }
    // B-15 is the staff reply only: a guest's own note with long digit runs is accepted (Luhn only).
    const own = await guest(fa, s.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'other', note: 'Mã đặt chỗ Agoda 482913, số tôi 0912 345 678' },
    });
    expect(own.statusCode, own.body).toBe(201);
    expect((await desk(id, 'acknowledge')).statusCode).toBe(200);
    const replyNote =
      'Xe 7 chỗ 450.000đ, đón 16/10/2026 lúc 07:00 cho phòng 202, 203. Tour 1.500.000 đồng/người';
    const done = await desk(id, 'complete', { replyNote });
    expect(done.statusCode, done.body).toBe(200);
    const mine = (await guest(fa, s.sid, 'GET', '/v1/guest/requests')).json().data as Array<{
      id: string;
      replyNote?: string;
    }>;
    expect(mine.find((x) => x.id === id)).toMatchObject({ replyNote });
  });

  // ───────────────────────── S4-08: lock order, forced interleavings ─────────────────────────

  /** A session holding the request row (FOR UPDATE): the first command queues on it, the second behind. */
  async function parkRequest(requestId: string) {
    const conn = await db.pool.connect();
    await conn.query('BEGIN');
    const ctx = t.ctx();
    await conn.query(SET_CONTEXT_SQL, [
      ctx.organizationId ?? '',
      ctx.propertyId ?? '',
      ctx.userId ?? '',
      ctx.actorType,
      '20000ms',
      '30000ms',
    ]);
    await conn.query('SELECT 1 FROM guest_request WHERE id = $1 FOR UPDATE', [requestId]);
    const pid = (await conn.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!.pid;
    return {
      pid,
      release: async () => {
        try {
          await conn.query('COMMIT');
        } finally {
          conn.release();
        }
      },
    };
  }
  /** Backends waiting behind `holder`, directly or behind one that waits on it (this test's chain only). */
  const blockedBehind = async (holder: number, n: number) => {
    for (let i = 0; i < 150; i += 1) {
      const [w] = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM pg_stat_activity a
          WHERE $1 = ANY (pg_blocking_pids(a.pid))
             OR EXISTS (SELECT 1 FROM pg_stat_activity b
                         WHERE $1 = ANY (pg_blocking_pids(b.pid)) AND b.pid = ANY (pg_blocking_pids(a.pid)))`,
        [holder],
      );
      if (Number(w!.n) >= n) return Number(w!.n);
      await sleep(10);
    }
    return 0;
  };
  /** `first` gets the request row first, `second` queues behind it; both answers after the release. */
  async function forced(
    requestId: string,
    first: () => Promise<LightMyRequestResponse>,
    second: () => Promise<LightMyRequestResponse>,
  ) {
    const park = await parkRequest(requestId);
    let p1: Promise<LightMyRequestResponse> | undefined;
    let p2: Promise<LightMyRequestResponse> | undefined;
    let queued = [0, 0];
    let answeredWhileParked = true;
    try {
      p1 = first();
      queued = [await blockedBehind(park.pid, 1), 0];
      p2 = second();
      queued = [queued[0]!, await blockedBehind(park.pid, 2)];
      answeredWhileParked = await Promise.race([
        Promise.race([p1, p2]).then(() => true),
        sleep(250).then(() => false),
      ]);
    } finally {
      await park.release();
    }
    const [r1, r2] = await Promise.all([p1!, p2!]);
    return { queued, answeredWhileParked, first: outcome(r1), second: outcome(r2) };
  }
  const endState = async (stay: Stay, id: string) => {
    const lines = await feeLines(stay);
    return { ...(await state(id)), lines: lines.length };
  };

  it('S4-08: decline ‖ HK complete (paid) – sequential controls, then forced both orders: same answers, same folio, no 40P01', async () => {
    const s = stays['203']!;
    const decline = (id: string) => () =>
      desk(id, 'decline', { declinedReasonCode: 'not_available_now' });
    const complete = (taskId: string) => () => task('hk', taskId, 'complete');
    // Sequential controls.
    const a = await request(s);
    const seqDeskFirst = [outcome(await decline(a.id)()), outcome(await complete(a.task!)())];
    expect(seqDeskFirst).toEqual(['200', '409:INVALID_TRANSITION']);
    expect(await endState(s, a.id)).toEqual({
      status: 'declined',
      task: 'cancelled',
      line: null,
      lines: 0,
    });
    const b = await request(s);
    const seqHkFirst = [outcome(await complete(b.task!)()), outcome(await decline(b.id)())];
    expect(seqHkFirst).toEqual(['200', '409:INVALID_TRANSITION']);
    expect(await endState(s, b.id)).toMatchObject({ status: 'done', task: 'done', lines: 1 });
    // Forced: the desk first (it holds the task, waits on the request; HK waits on the task).
    const c = await request(s);
    const f1 = await forced(c.id, decline(c.id), complete(c.task!));
    expect(f1).toEqual({
      queued: [1, 2],
      answeredWhileParked: false,
      first: seqDeskFirst[0],
      second: seqDeskFirst[1],
    });
    expect(await endState(s, c.id)).toEqual({
      status: 'declined',
      task: 'cancelled',
      line: null,
      lines: 1,
    });
    // Forced: HK first (folio + task held, waits on the request; the desk waits on the task).
    const d = await request(s);
    const f2 = await forced(d.id, complete(d.task!), decline(d.id));
    expect(f2).toEqual({
      queued: [1, 2],
      answeredWhileParked: false,
      first: seqHkFirst[0],
      second: seqHkFirst[1],
    });
    const lines = await feeLines(s);
    expect(await endState(s, d.id)).toEqual({
      status: 'done',
      task: 'done',
      line: lines[1]!.id,
      lines: 2,
    });
    expect(lines.map((l) => Number(l.amount_vnd))).toEqual([FEE, FEE]); // b and d – one each
  });

  it('S4-08: decline ‖ HK start – sequential controls, then forced both orders: same answers, no fee, no 40P01', async () => {
    const s = stays['301']!;
    const decline = (id: string) => () => desk(id, 'decline', { declinedReasonCode: 'duplicate' });
    const start = (taskId: string) => () => task('hk', taskId, 'start');
    const a = await request(s);
    const seqDeskFirst = [outcome(await decline(a.id)()), outcome(await start(a.task!)())];
    expect(seqDeskFirst).toEqual(['200', '409:INVALID_TRANSITION']);
    const b = await request(s);
    const seqHkFirst = [outcome(await start(b.task!)()), outcome(await decline(b.id)())];
    expect(seqHkFirst).toEqual(['200', '409:INVALID_TRANSITION']);
    expect(await endState(s, b.id)).toEqual({
      status: 'in_progress',
      task: 'in_progress',
      line: null,
      lines: 0,
    });
    const c = await request(s);
    const f1 = await forced(c.id, decline(c.id), start(c.task!));
    expect(f1).toMatchObject({ queued: [1, 2], answeredWhileParked: false });
    expect([f1.first, f1.second]).toEqual(seqDeskFirst);
    expect(await endState(s, c.id)).toEqual({
      status: 'declined',
      task: 'cancelled',
      line: null,
      lines: 0,
    });
    const d = await request(s);
    const f2 = await forced(d.id, start(d.task!), decline(d.id));
    expect(f2).toMatchObject({ queued: [1, 2], answeredWhileParked: false });
    expect([f2.first, f2.second]).toEqual(seqHkFirst);
    expect(await endState(s, d.id)).toEqual({
      status: 'in_progress',
      task: 'in_progress',
      line: null,
      lines: 0,
    });
    // The two started tasks finish: one fee each.
    for (const x of [b, d]) expect((await task('hk', x.task!, 'complete')).statusCode).toBe(200);
    expect((await feeLines(s)).map((l) => Number(l.amount_vnd))).toEqual([FEE, FEE]);
  });

  it('S4-08: desk complete ‖ HK complete (paid) – sequential controls, then forced both orders: exactly one fee line per request, no 40P01', async () => {
    const s = stays['302']!;
    const complete = (id: string) => () => desk(id, 'complete');
    const hkDone = (taskId: string) => () => task('hk', taskId, 'complete');
    const acknowledged = async () => {
      const r = await request(s);
      expect((await desk(r.id, 'acknowledge')).statusCode).toBe(200);
      return r;
    };
    const a = await acknowledged();
    const seqDeskFirst = [outcome(await complete(a.id)()), outcome(await hkDone(a.task!)())];
    expect(seqDeskFirst).toEqual(['200', '200']); // the fee lands with the task
    expect(await endState(s, a.id)).toMatchObject({ status: 'done', task: 'done', lines: 1 });
    const b = await acknowledged();
    const seqHkFirst = [outcome(await hkDone(b.task!)()), outcome(await complete(b.id)())];
    expect(seqHkFirst).toEqual(['200', '409:INVALID_TRANSITION']);
    expect(await endState(s, b.id)).toMatchObject({ status: 'done', task: 'done', lines: 2 });
    const c = await acknowledged();
    const f1 = await forced(c.id, complete(c.id), hkDone(c.task!));
    expect(f1).toMatchObject({ queued: [1, 2], answeredWhileParked: false });
    expect([f1.first, f1.second]).toEqual(seqDeskFirst);
    expect(await endState(s, c.id)).toMatchObject({ status: 'done', task: 'done', lines: 3 });
    const d = await acknowledged();
    const f2 = await forced(d.id, hkDone(d.task!), complete(d.id));
    expect(f2).toMatchObject({ queued: [1, 2], answeredWhileParked: false });
    expect([f2.first, f2.second]).toEqual(seqHkFirst);
    expect(await endState(s, d.id)).toMatchObject({ status: 'done', task: 'done', lines: 4 });
    // One line per request, each linked from its request.
    const lines = await feeLines(s);
    expect(lines.map((l) => Number(l.amount_vnd))).toEqual([FEE, FEE, FEE, FEE]);
    const linked = await q<{ line: string }>(
      `SELECT fee_folio_line_id AS line FROM guest_request WHERE id = ANY($1::uuid[])`,
      [[a.id, b.id, c.id, d.id]],
    );
    expect(linked.map((x) => x.line).sort()).toEqual(lines.map((l) => l.id).sort());
  });

  it('lockForFee (16.19 bổ sung 3): holds the folio of a fee still to post; nothing for a free, declined or already charged request', async () => {
    const s = stays['402']!;
    const port = fa.app.get(GuestRequestStatusPort);
    /** Another session tries the folio with NOWAIT while `lockForFee` ran in an open transaction. */
    const folioWhileHeld = (guestRequestId: string) =>
      db.withContext(t.ctx(), async (tx) => {
        await port.lockForFee(tx, guestRequestId);
        const conn = await db.pool.connect();
        try {
          await conn.query('BEGIN');
          const ctx = t.ctx();
          await conn.query(SET_CONTEXT_SQL, [
            ctx.organizationId ?? '',
            ctx.propertyId ?? '',
            ctx.userId ?? '',
            ctx.actorType,
            '2000ms',
            '5000ms',
          ]);
          await conn.query('SELECT 1 FROM folio WHERE id = $1 FOR UPDATE NOWAIT', [s.folioId]);
          return 'free';
        } catch (e) {
          return `locked:${(e as { code?: string }).code}`;
        } finally {
          await conn.query('ROLLBACK').catch(() => undefined);
          conn.release();
        }
      });
    const paid = await request(s);
    expect(await folioWhileHeld(paid.id)).toBe('locked:55P03');
    const free = await request(s, 'amenities', false);
    expect(await folioWhileHeld(free.id)).toBe('free');
    expect(await folioWhileHeld(uuidv7())).toBe('free'); // unknown id: nothing
    expect((await task('hk', paid.task!, 'complete')).statusCode).toBe(200);
    expect(await folioWhileHeld(paid.id)).toBe('free'); // already charged
    const refused = await request(s);
    expect(
      (await desk(refused.id, 'decline', { declinedReasonCode: 'duplicate' })).statusCode,
    ).toBe(200);
    expect(await folioWhileHeld(refused.id)).toBe('free');
    expect((await feeLines(s)).map((l) => Number(l.amount_vnd))).toEqual([FEE]);
  });
});
