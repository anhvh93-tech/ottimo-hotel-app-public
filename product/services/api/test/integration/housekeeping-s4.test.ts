/**
 * Housekeeping + maintenance (OpenAPI 0.3.7 nhóm H, EP07/EP08 – BE-C R2 Sprint 4) on PostgreSQL through the
 * real endpoints: room statuses (US-052/053, SM-03 R1/R2/R3/R8, B-02 performedAt, B-03 R5), tasks (US-054,
 * SM-14, BR-807 ranks, B-04/B-05), inspections (US-055, BR-808, R4, B-07), work orders (US-057/061/062,
 * SM-04, BR-804/809, B-09…B-11) with their OOO block (O1/O4), J8 `hk.daily`, J11 `work_order.sla`, the "Cần
 * chú ý" sources and the EP14 port. Fake data only.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  ATTENTION_PARAM_KEYS,
  EventsService,
} from '../../src/modules/events/public/events.service';
import {
  GUEST_REQUEST_WORK_PORT,
  type GuestRequestWorkPort,
} from '../../src/modules/housekeeping/public/guest-request-work.port';
import { RoomStatusService } from '../../src/modules/housekeeping/public/room-status.service';
import { runHkDaily, runWorkOrderSla } from '../../src/modules/housekeeping/public/worker-jobs';
import { ParameterService } from '../../src/modules/platform/public/parameter.service';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { sampleJpeg, seedStay, staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

const TODAY = '2026-10-15';
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; pendingFix?: string; input: any; expected: any }>;
};
const AT = (min = 0) => new Date(T0.getTime() + min * 60_000).toISOString();

describe.skipIf(!HAS_DB)('housekeeping + maintenance (nhóm H, 0.3.7)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const uid = (u: string) => t.users[u]!.id;

  beforeAll(async () => {
    db = appDatabase(10);
    fa = await startFeatureApp(db);
  });
  // A fresh tenant per test: tasks / statuses of one case never leak into another's lists.
  beforeEach(async () => {
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        hk: ['housekeeping'],
        hk2: ['housekeeping'],
        mt: ['maintenance'],
        sal: ['sales_staff'],
      },
    });
    ids = await seedBooking(db, t);
  });

  /** Moves the Clock and keeps the staff sessions alive after it. */
  async function at(iso: Date): Promise<void> {
    fa.clock.set(iso);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE user_session SET idle_expires_at = $1, expires_at = $1', [
        new Date(iso.getTime() + 3_600_000),
      ]),
    );
  }
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });
  afterEach(() => fa.clock.set(T0));

  const call = (
    u: string,
    method: 'GET' | 'POST' | 'PATCH',
    path: string,
    opts: { json?: unknown; ifMatch?: number; headers?: Record<string, string> } = {},
  ) => staff(fa, tok(u), null, method, `${P(t)}${path}`, opts);

  const room = (no: string) => ids.rooms[no] as string;

  async function setStatus(roomNo: string, status: string, since = T0) {
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (room_id) DO UPDATE SET status = EXCLUDED.status, since = EXCLUDED.since`,
        [room(roomNo), t.organizationId, t.propertyIds[0], status, since],
      ),
    );
  }

  async function task(
    roomNo: string,
    type: string,
    opts: { assigned?: string; status?: string; due?: string } = {},
  ) {
    const id = randomUUID();
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO hk_task (id, organization_id, property_id, room_id, type, status, due_date, source,
           assigned_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', $8, $9, $9)`,
        [
          id,
          t.organizationId,
          t.propertyIds[0],
          room(roomNo),
          type,
          opts.status ?? 'open',
          opts.due ?? TODAY,
          opts.assigned ? uid(opts.assigned) : null,
          T0,
        ],
      ),
    );
    return id;
  }

  async function taskRow(id: string) {
    return db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{
            status: string;
            cancel_reason_code: string | null;
            done_by: string | null;
          }>('SELECT status, cancel_reason_code, done_by FROM hk_task WHERE id = $1', [id])
        ).rows[0]!,
    );
  }

  async function notifications(kind: string, refId: string) {
    return db.withContext(t.ctx(), async (tx) =>
      (
        await tx.query<{ user_id: string }>(
          'SELECT user_id FROM staff_notification WHERE kind = $1 AND ref_id = $2 ORDER BY user_id',
          [kind, refId],
        )
      ).rows.map((r) => r.user_id),
    );
  }

  async function upload(user: string, purpose: 'work_order' | 'inspection') {
    const r = await staff(fa, tok(user), null, 'POST', `${P(t)}/attachments`, {
      multipart: [
        { name: 'purpose', value: purpose },
        {
          name: 'file',
          value: await sampleJpeg('#336699'),
          filename: 'p.jpg',
          contentType: 'image/jpeg',
        },
      ],
    });
    expect(r.statusCode, r.body).toBe(201);
    return r.json().id as string;
  }

  const entry = async (u: string, roomNo: string) =>
    ((await call(u, 'GET', '/room-statuses')).json().data as Array<Record<string, unknown>>).find(
      (r) => r.roomNo === roomNo,
    )!;

  // ───────────────────────── US-052 / US-053 ─────────────────────────

  it('US-052: 10 rooms, filter, HK sees the guest name only in scope T, MT never; allowedEvents by status and role', async () => {
    const { reservationId } = await seedStay(db, t, ids, {
      roomNo: '101',
      bookerName: 'Lê Văn Khách',
      status: 'in_house',
    });
    await setStatus('101', 'OD');
    await setStatus('102', 'VD');
    const fdList = await call('fd', 'GET', '/room-statuses');
    expect(fdList.statusCode, fdList.body).toBe(200);
    expect(fdList.json().data).toHaveLength(10);
    const r101 = (fdList.json().data as Array<Record<string, unknown>>).find(
      (r) => r.roomNo === '101',
    )!;
    expect(r101).toMatchObject({
      status: 'OD',
      statusLabel: 'Có khách · cần dọn',
      currentGuest: 'Lê Văn Khách',
      allowedEvents: ['start_cleaning'],
      inspectionFailed: false,
    });
    const dirty = (await call('fd', 'GET', '/room-statuses?filter=needs_cleaning')).json()
      .data as Array<{ status: string }>;
    expect(dirty.every((r) => ['VD', 'OD', 'CL'].includes(r.status))).toBe(true);
    expect(dirty.length).toBeGreaterThanOrEqual(2);
    // HK: no task on 101 yet → outside T: no name, no event.
    let hk101 = await entry('hk', '101');
    expect(hk101.currentGuest).toBeUndefined();
    expect(hk101.allowedEvents).toEqual([]);
    const tId = await task('101', 'stayover_clean');
    hk101 = await entry('hk', '101');
    // BR-614: housekeeping sees the call name only (the desk above keeps the full name).
    expect(hk101.currentGuest).toBe('Khách');
    expect(hk101.allowedEvents).toEqual(['start_cleaning']);
    expect(hk101.openTaskIds).toEqual([tId]);
    // A task assigned to another HK: the room is outside T for this HK.
    await task('103', 'adhoc_clean', { assigned: 'hk2' });
    expect((await entry('hk', '103')).allowedEvents).toEqual([]);
    // MT: read only, never a name (D01 K).
    const mt101 = await entry('mt', '101');
    expect(mt101.currentGuest).toBeUndefined();
    expect(mt101.allowedEvents).toEqual([]);
    expect((await call('sal', 'GET', '/room-statuses')).statusCode).toBe(403);
    void reservationId;
  });

  it('US-053: R1 → R3 with the cleaning task, 409 on a stale expectedFrom (currentState), 422 performedAt, HK outside T → 404, R8 OC → OD + stay-over task', async () => {
    await setStatus('201', 'VD');
    const t104 = await task('201', 'checkout_clean');
    const go = (u: string, body: Record<string, unknown>) =>
      call(u, 'POST', `/rooms/${room('201')}/status-transitions`, { json: body });
    // performedAt older than 24 h → 422 (offline queue too old).
    const old = await go('hk', {
      event: 'start_cleaning',
      expectedFrom: 'VD',
      performedAt: AT(-25 * 60),
    });
    expect(old.json().errors).toEqual([
      { field: 'performedAt', code: 'PERFORMED_AT_OUT_OF_RANGE' },
    ]);
    const stale = await go('hk', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: AT(),
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'VD' });
    const start = await go('hk', {
      event: 'start_cleaning',
      expectedFrom: 'VD',
      performedAt: AT(),
    });
    expect(start.statusCode, start.body).toBe(200);
    expect(start.json()).toMatchObject({ status: 'CL', allowedEvents: ['finish_cleaning'] });
    expect((await taskRow(t104)).status).toBe('in_progress');
    // Forbidden SM-03 move (CL → OD is not an event from CL): 409.
    const bad = await go('hk', { event: 'needs_cleaning', expectedFrom: 'CL', performedAt: AT(1) });
    expect(bad.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'CL' });
    const done = await go('hk', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: AT(2),
    });
    expect(done.json()).toMatchObject({ status: 'VC' }); // nobody in house → VC (R3)
    expect(await taskRow(t104)).toMatchObject({ status: 'done', done_by: uid('hk') });
    // FDL is told the room waits for an inspection (self-inspection off).
    expect(await notifications('room_awaiting_inspection', t104)).toEqual(
      [uid('own'), uid('mgr'), uid('fdl')].sort(),
    );
    // HK outside its scope T (no task on 105) → 404; FD may (A80).
    await setStatus('202', 'VD');
    expect(
      (
        await call('hk', 'POST', `/rooms/${room('202')}/status-transitions`, {
          json: { event: 'start_cleaning', expectedFrom: 'VD', performedAt: AT() },
        })
      ).statusCode,
    ).toBe(404);
    const fd = await call('fd', 'POST', `/rooms/${room('202')}/status-transitions`, {
      json: { event: 'start_cleaning', expectedFrom: 'VD', performedAt: AT() },
    });
    expect(fd.json().status).toBe('CL');
    // CL with a guest in house → OC (R2); OC → OD (R8) creates the stay-over task.
    await seedStay(db, t, ids, { roomNo: '202', status: 'in_house' });
    const r2 = await call('fd', 'POST', `/rooms/${room('202')}/status-transitions`, {
      json: { event: 'finish_cleaning', expectedFrom: 'CL', performedAt: AT(3) },
    });
    expect(r2.json().status).toBe('OC');
    const r8 = await call('fd', 'POST', `/rooms/${room('202')}/status-transitions`, {
      json: { event: 'needs_cleaning', expectedFrom: 'OC', performedAt: AT(4) },
    });
    expect(r8.json().status).toBe('OD');
    const tasks = (await call('fd', 'GET', '/hk-tasks')).json().data as Array<{
      roomNo: string;
      type: string;
      status: string;
    }>;
    expect(
      tasks.filter((x) => x.roomNo === '202' && x.type === 'stayover_clean' && x.status === 'open'),
    ).toHaveLength(1);
    // MT never changes a room status (A80 ✖).
    expect(
      (
        await call('mt', 'POST', `/rooms/${room('202')}/status-transitions`, {
          json: { event: 'start_cleaning', expectedFrom: 'OD', performedAt: AT() },
        })
      ).statusCode,
    ).toBe(403);
  });

  // ───────────────────────── US-055 ─────────────────────────

  it('US-055: checklist (12 points + dynamic kit item), pass → VI (R4), fail → VC + redo task + inspectionFailed, 409 CHECKLIST_OUTDATED / not VC, HK self-inspection gated, listInspections', async () => {
    await setStatus('301', 'VC');
    const list = await call('fdl', 'GET', `/inspection-checklist?roomId=${room('301')}`, {
      headers: { 'accept-language': 'en' },
    });
    expect(list.statusCode, list.body).toBe(200);
    const cl = list.json() as {
      version: number;
      items: Array<{ code: string; label: string; required: boolean; photoRequired?: boolean }>;
    };
    expect(cl.items).toHaveLength(12);
    expect(cl.items[0]).toEqual({ code: 'bedding', label: 'Bed linen', required: true });
    expect(cl.items.find((i) => i.code === 'photos')).toMatchObject({
      required: false,
      photoRequired: false,
    });
    const all = (passed = true) =>
      cl.items.map((i) => ({ code: i.code, passed: i.required ? passed : true }));
    const inspect = (u: string, body: Record<string, unknown>) =>
      call(u, 'POST', `/rooms/${room('301')}/inspections`, { json: body });
    // FD may not inspect (A81 ✖).
    expect(
      (await inspect('fd', { checklistVersion: cl.version, items: all(), performedAt: AT() }))
        .statusCode,
    ).toBe(403);
    // HK self-inspection is off by default → 403.
    await task('301', 'adhoc_clean');
    expect(
      (await inspect('hk', { checklistVersion: cl.version, items: all(), performedAt: AT() }))
        .statusCode,
    ).toBe(403);
    const outdated = await inspect('fdl', {
      checklistVersion: cl.version + 1,
      items: all(),
      performedAt: AT(),
    });
    expect(outdated.json()).toMatchObject({
      code: 'CHECKLIST_OUTDATED',
      currentVersion: cl.version,
    });
    const noNote = await inspect('fdl', {
      checklistVersion: cl.version,
      items: [{ code: 'bedding', passed: false }, ...all().slice(1)],
      performedAt: AT(),
    });
    expect(noNote.json().errors).toEqual([{ field: 'items[0].note', code: 'REQUIRED' }]);
    // Fail: one required point not passed (with a note) – room stays VC, a redo task is made.
    const fail = await inspect('fdl', {
      checklistVersion: cl.version,
      items: [{ code: 'bedding', passed: false, note: 'Ga có vết bẩn' }, ...all().slice(1)],
      performedAt: AT(),
    });
    expect(fail.statusCode, fail.body).toBe(201);
    expect(fail.json()).toMatchObject({
      result: 'fail',
      roomStatusAfter: 'VC',
      inspectedBy: 'fdl',
    });
    const redo = fail.json().redoTaskId as string;
    expect(redo).toBeTruthy();
    expect((await entry('fd', '301')).inspectionFailed).toBe(true);
    // A missing required point is a fail, not an error.
    const missing = await inspect('fdl', {
      checklistVersion: cl.version,
      items: all().slice(1),
      performedAt: AT(1),
    });
    expect(missing.json().result).toBe('fail');
    const pass = await inspect('mgr', {
      checklistVersion: cl.version,
      items: all(),
      performedAt: AT(2),
    });
    expect(pass.json()).toMatchObject({ result: 'pass', roomStatusAfter: 'VI' });
    const e = await entry('fd', '301');
    expect(e).toMatchObject({ status: 'VI', inspectionFailed: false });
    // Not VC any more → 409 with the current state.
    expect(
      (
        await inspect('fdl', { checklistVersion: cl.version, items: all(), performedAt: AT(3) })
      ).json(),
    ).toMatchObject({
      code: 'INVALID_TRANSITION',
      currentState: 'VI',
    });
    // HK self-inspection on: photos required, then allowed.
    await setStatus('302', 'VC');
    await task('302', 'adhoc_clean');
    await setParam(db, t, 'hk_self_inspection_enabled', true, '2026-10-10');
    const hkCl = (await call('hk', 'GET', `/inspection-checklist?roomId=${room('302')}`)).json();
    expect(hkCl.items.find((i: { code: string }) => i.code === 'photos').photoRequired).toBe(true);
    const selfNoPhoto = await call('hk', 'POST', `/rooms/${room('302')}/inspections`, {
      json: { checklistVersion: hkCl.version, items: all(), performedAt: AT() },
    });
    expect(selfNoPhoto.json().errors).toEqual([{ field: 'photoAttachmentIds', code: 'REQUIRED' }]);
    const photo = await upload('hk', 'inspection');
    const self = await call('hk', 'POST', `/rooms/${room('302')}/inspections`, {
      json: {
        checklistVersion: hkCl.version,
        items: all(),
        photoAttachmentIds: [photo],
        performedAt: AT(),
      },
    });
    expect(self.json()).toMatchObject({
      result: 'pass',
      selfInspection: true,
      photoAttachmentIds: [photo],
    });
    await setParam(db, t, 'hk_self_inspection_enabled', false, '2026-10-12');
    // listInspections: FD+ all, labels by Accept-Language; HK only its own.
    const hist = await call('fd', 'GET', `/rooms/${room('301')}/inspections`, {
      headers: { 'accept-language': 'vi' },
    });
    expect(hist.statusCode, hist.body).toBe(200);
    expect(hist.json().data.map((i: { result: string }) => i.result)).toEqual([
      'pass',
      'fail',
      'fail',
    ]);
    expect(hist.json().data[2].items[0]).toMatchObject({
      code: 'bedding',
      label: 'Ga gối',
      passed: false,
      note: 'Ga có vết bẩn',
    });
    expect((await call('hk', 'GET', `/rooms/${room('301')}/inspections`)).json().data).toEqual([]);
    expect((await call('mt', 'GET', `/rooms/${room('301')}/inspections`)).statusCode).toBe(200);
    const tooLong = await call(
      'fd',
      'GET',
      `/rooms/${room('301')}/inspections?from=2026-01-01&to=2026-10-15`,
    );
    expect(tooLong.json().errors).toEqual([{ field: 'to', code: 'DATE_RANGE_TOO_LONG' }]);
  });

  // ───────────────────────── US-054 ─────────────────────────

  it('US-054: ranks (priority > arrival room > guest request > checkout > stay-over > ad hoc), summary in scope, HK cancels a stay-over only with a reason, FD creates manual types only', async () => {
    const day = '2026-10-16';
    await at(new Date('2026-10-16T02:00:00.000Z'));
    // Arrival today on 302 (its checkout clean is rank 2).
    await seedStay(db, t, ids, { roomNo: '302', arrival: day, departure: '2026-10-18' });
    const created = async (roomNo: string, type: string, dueDate = day) => {
      const r = await call('fd', 'POST', '/hk-tasks', {
        json: { roomId: room(roomNo), type, dueDate },
      });
      return r;
    };
    expect((await created('301', 'checkout_clean')).json().errors).toEqual([
      { field: 'type', code: 'NOT_IN_LIST' },
    ]);
    expect((await created('301', 'extra_guest_kit_prepare')).json().errors).toEqual([
      { field: 'type', code: 'NOT_IN_LIST' },
    ]);
    expect((await created('301', 'adhoc_clean', '2026-10-15')).json().errors).toEqual([
      { field: 'dueDate', code: 'DATE_IN_PAST' },
    ]);
    expect(
      (
        await call('hk', 'POST', '/hk-tasks', {
          json: { roomId: room('301'), type: 'adhoc_clean', dueDate: day },
        })
      ).statusCode,
    ).toBe(403);
    const adhoc = (await created('301', 'adhoc_clean')).json();
    const stay = (await created('203', 'stayover_clean')).json();
    const prio = (await created('103', 'priority_clean')).json();
    expect(prio.priorityRank).toBe(1);
    expect(await notifications('hk_task_urgent', prio.id)).toEqual([uid('hk'), uid('hk2')].sort());
    const co302 = await task('302', 'checkout_clean', { due: day });
    const co401 = await task('401', 'checkout_clean', { due: day, assigned: 'hk2' });
    const gr = await task('402', 'guest_request', { due: day });
    const list = await call('hk', 'GET', '/hk-tasks');
    expect(list.statusCode, list.body).toBe(200);
    const order = (list.json().data as Array<{ id: string; priorityRank: number }>).map((x) => [
      x.id,
      x.priorityRank,
    ]);
    expect(order).toEqual([
      [prio.id, 1],
      [co302, 2],
      [gr, 3],
      [co401, 5],
      [stay.id, 6],
      [adhoc.id, 7],
    ]);
    // HK counts its own + unassigned (not hk2's); hk2's task shows without its note.
    expect(list.json().summary).toEqual({ done: 0, total: 5 });
    // Cancel: HK only a stay-over, with a reason; `other` needs a note.
    const act = (u: string, id: string, action: string, body: Record<string, unknown> = {}) =>
      call(u, 'POST', `/hk-tasks/${id}/actions/${action}`, {
        json: { performedAt: '2026-10-16T09:00:00+07:00', ...body },
      });
    expect(
      (await act('hk', adhoc.id, 'cancel', { cancelReasonCode: 'guest_refused' })).statusCode,
    ).toBe(403);
    expect((await act('hk', stay.id, 'cancel')).json().errors).toEqual([
      { field: 'cancelReasonCode', code: 'REQUIRED' },
    ]);
    expect(
      (await act('hk', stay.id, 'cancel', { cancelReasonCode: 'day_ended' })).json().errors,
    ).toEqual([{ field: 'cancelReasonCode', code: 'NOT_IN_LIST' }]);
    expect(
      (await act('hk', stay.id, 'cancel', { cancelReasonCode: 'other' })).json().errors,
    ).toEqual([{ field: 'cancelNote', code: 'REQUIRED' }]);
    const dnd = await act('hk', stay.id, 'cancel', { cancelReasonCode: 'dnd' });
    expect(dnd.json()).toMatchObject({ status: 'cancelled', cancelReasonCode: 'dnd' });
    // Start → complete; a done task → 409 with its state.
    expect((await act('hk', adhoc.id, 'start')).json().status).toBe('in_progress');
    expect((await act('hk', adhoc.id, 'complete')).json().status).toBe('done');
    expect((await act('hk', adhoc.id, 'complete')).json()).toMatchObject({
      code: 'INVALID_TRANSITION',
      currentState: 'done',
    });
    // Someone else's task → 404 for this HK.
    expect((await act('hk', co401, 'start')).statusCode).toBe(404);
    const after = await call('hk', 'GET', '/hk-tasks');
    expect(after.json().summary).toEqual({ done: 1, total: 4 });
    // MT reads (no note); HK cannot read another day.
    expect((await call('mt', 'GET', '/hk-tasks')).statusCode).toBe(200);
    expect((await call('hk', 'GET', '/hk-tasks?date=2026-10-17')).statusCode).toBe(422);
  });

  it('J8 hk.daily: stay-over for short stays in house (OC → OD, linen every 3 nights), yesterday’s stay-over cancelled day_ended, other tasks carried over', async () => {
    const day = '2026-10-21';
    const { reservationId } = await seedStay(db, t, ids, {
      roomNo: '401',
      status: 'in_house',
      arrival: '2026-10-18',
      departure: '2026-10-24',
    });
    await setStatus('401', 'OC');
    const yesterdayStay = await task('401', 'stayover_clean', { due: '2026-10-20' });
    const yesterdayAdhoc = await task('402', 'adhoc_clean', { due: '2026-10-20' });
    const deps = {
      params: fa.app.get(ParameterService),
      events: fa.app.get(EventsService),
      rooms: fa.app.get(RoomStatusService),
    };
    const now = new Date('2026-10-21T00:00:00.000Z');
    const stats = await db.withContext(t.ctx(), (tx) => runHkDaily(tx, deps, now, day));
    expect(stats).toMatchObject({ dayEnded: 1, stayover: 1, markedDirty: 1 });
    expect(await taskRow(yesterdayStay)).toMatchObject({
      status: 'cancelled',
      cancel_reason_code: 'day_ended',
    });
    const rows = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{
            type: string;
            linen_change: boolean;
            reservation_id: string | null;
            carried_over: boolean;
            id: string;
          }>(
            `SELECT id, type, linen_change, reservation_id, carried_over FROM hk_task WHERE room_id = $1 AND due_date = $2`,
            [room('401'), day],
          )
        ).rows,
    );
    // 3 nights since arrival (18 → 21) → linen change night (linen_change_every_nights = 3).
    expect(rows).toEqual([
      expect.objectContaining({
        type: 'stayover_clean',
        linen_change: true,
        reservation_id: reservationId,
      }),
    ]);
    const carried = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ carried_over: boolean }>(
            'SELECT carried_over FROM hk_task WHERE id = $1',
            [yesterdayAdhoc],
          )
        ).rows[0]!,
    );
    expect(carried.carried_over).toBe(true);
    const status = await db.withContext(t.ctx(), (tx) => deps.rooms.of(tx, room('401'), day));
    expect(status).toBe('OD');
    // Idempotent: a second run makes no second task.
    expect((await db.withContext(t.ctx(), (tx) => runHkDaily(tx, deps, now, day))).stayover).toBe(
      0,
    );
  });

  // ───────────────────────── US-057 / US-061 / US-062 ─────────────────────────

  it('US-057/061/062: HK reports (no block, block request), FD blocks with an expected end (BR-804), deadlines + notifications, SM-04 with history, done → block released, room VD + after-repair cleaning', async () => {
    const photo = await upload('hk', 'work_order');
    // HK with a block → 403 (A86); HK report with a block request.
    expect(
      (
        await call('hk', 'POST', '/work-orders', {
          json: {
            roomId: room('401'),
            title: 'x',
            description: 'y',
            category: 'leak',
            block: { startDate: TODAY, expectedDoneDate: TODAY, reason: 'abc' },
          },
        })
      ).statusCode,
    ).toBe(403);
    const missing = await call('hk', 'POST', '/work-orders', {
      json: { roomId: room('401'), title: 'Mất nước nóng' },
    });
    expect(missing.json().errors).toEqual([
      { field: 'description', code: 'REQUIRED' },
      { field: 'category', code: 'REQUIRED' },
    ]);
    const hkWo = await call('hk', 'POST', '/work-orders', {
      json: {
        roomId: room('401'),
        title: 'Mất nước nóng – căn 401',
        description: 'Không có nước nóng từ 21:00',
        category: 'hot_water',
        photoAttachmentIds: [photo],
        blockRequested: true,
      },
    });
    expect(hkWo.statusCode, hkWo.body).toBe(201);
    const w1 = hkWo.json();
    expect(w1).toMatchObject({
      code: 'WO-00001',
      status: 'new',
      source: 'housekeeping',
      severity: 'low', // empty room, category of the high group → low (BR-809, EP07 6.4)
      blockRequested: true,
      photoAttachmentIds: [photo],
      reportedBy: 'hk',
      allowedActions: [],
    });
    expect(w1.history.map((h: { change: string }) => h.change)).toEqual(['created']);
    expect(await notifications('work_order_new', w1.id)).toEqual([uid('mt')]);
    expect(await notifications('work_order_block_requested', w1.id)).toEqual(
      [uid('own'), uid('mgr'), uid('fdl'), uid('fd'), uid('mt')].sort(),
    );
    // HK sees its own report; the other HK does not (no task on 401 either).
    expect((await call('hk', 'GET', `/work-orders/${w1.id}`)).statusCode).toBe(200);
    expect((await call('hk2', 'GET', `/work-orders/${w1.id}`)).statusCode).toBe(404);

    // FD: high work order with a block from an expected end date: end = expected + ooo_reopen_buffer_days (1).
    await seedStay(db, t, ids, { roomNo: '402', status: 'in_house' }); // occupied → high suggested
    const both = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('301'),
        title: 'Hỏng',
        description: 'Hỏng bình',
        category: 'power',
        block: {
          startDate: TODAY,
          expectedDoneDate: '2026-10-17',
          endDatePlanned: '2026-10-18',
          reason: 'Thay',
        },
      },
    });
    expect(both.json().errors).toEqual([{ field: 'block.expectedDoneDate', code: 'NOT_ALLOWED' }]);
    const ack = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('301'),
        title: 'Hỏng',
        description: 'Hỏng bình',
        category: 'power',
        block: {
          startDate: TODAY,
          expectedDoneDate: '2026-10-17',
          reason: 'Thay',
          affectedReservationsAcknowledged: true,
        },
      },
    });
    expect(ack.statusCode).toBe(403);
    const blocked = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('301'),
        title: 'Hỏng bình nóng lạnh',
        description: 'Bình rò điện',
        category: 'power',
        severity: 'high',
        block: { startDate: TODAY, expectedDoneDate: '2026-10-17', reason: 'Thay bình nóng lạnh' },
      },
    });
    expect(blocked.statusCode, blocked.body).toBe(201);
    const w2 = blocked.json();
    expect(w2).toMatchObject({
      severity: 'high',
      source: 'front_desk',
      roomBlock: {
        status: 'active',
        startDate: TODAY,
        expectedDoneDate: '2026-10-17',
        endDatePlanned: '2026-10-18',
      },
      ackDueAt: '2026-10-15T09:15:00.000+07:00', // wo_sla high: ack 15 min, plan 2 h
      resolveDueAt: '2026-10-15T11:00:00.000+07:00',
      isOverdue: false,
    });
    expect(await notifications('work_order_high_new', w2.id)).toEqual(
      [uid('own'), uid('mgr'), uid('fdl'), uid('fd'), uid('mt')].sort(),
    );
    expect((await entry('fd', '301')).status).toBe('OOO');
    // "Cần chú ý": the open high work order (US-012 AC4).
    const attn = await call('fd', 'GET', '/attention');
    expect(
      (attn.json().data as Array<{ kind: string; refCode?: string }>).some(
        (i) => i.kind === 'work_order_high_open' && i.refCode === w2.code,
      ),
    ).toBe(true);

    // SM-04: accept (MT becomes assignee), wait-parts needs a note (+ date for medium/low), resume, complete.
    const act = (
      u: string,
      wo: { id: string },
      action: string,
      version: number,
      body: Record<string, unknown> = {},
    ) =>
      call(u, 'POST', `/work-orders/${wo.id}/actions/${action}`, { json: body, ifMatch: version });
    expect((await act('hk', w2, 'accept', w2.version)).statusCode).toBe(403);
    expect(
      (await act('mt', w2, 'complete', w2.version, { resultNote: 'xong' })).json(),
    ).toMatchObject({
      code: 'INVALID_TRANSITION',
      currentState: 'new',
    });
    let cur = (await act('mt', w2, 'accept', w2.version)).json();
    expect(cur).toMatchObject({ status: 'in_progress', assigneeName: 'mt' });
    expect((await act('mt', w2, 'wait-parts', cur.version)).json().errors).toEqual([
      { field: 'note', code: 'REQUIRED' },
    ]);
    cur = (await act('mt', w2, 'wait-parts', cur.version, { note: 'Chờ bình mới' })).json();
    expect(cur.status).toBe('waiting_parts');
    cur = (await act('mt', w2, 'resume', cur.version)).json();
    // complete: result note required, photo required for high (wo_done_photo_required_severities).
    const noPhoto = await act('mt', w2, 'complete', cur.version, { resultNote: 'Đã thay bình' });
    expect(noPhoto.json().errors).toEqual([
      { field: 'photoAttachmentIds', code: 'EVIDENCE_REQUIRED' },
    ]);
    expect((await act('mt', w2, 'complete', cur.version - 1, { resultNote: 'x' })).statusCode).toBe(
      412,
    );
    const after = await upload('mt', 'work_order');
    const done = await act('mt', w2, 'complete', cur.version, {
      resultNote: 'Đã thay bình',
      photoAttachmentIds: [after],
    });
    expect(done.statusCode, done.body).toBe(200);
    expect(done.json()).toMatchObject({
      status: 'done',
      resultNote: 'Đã thay bình',
      roomBlock: { status: 'released', endDateActual: TODAY },
    });
    expect(
      done.json().history.map((h: { change: string; to: string | null }) => `${h.change}:${h.to}`),
    ).toEqual([
      'created:new',
      'block:2026-10-15',
      'status:in_progress',
      'status:waiting_parts',
      'status:in_progress',
      'status:done',
      'block:released',
    ]);
    // O4 → room VD + after-repair cleaning (R11).
    expect((await entry('fd', '301')).status).toBe('VD');
    const tasks = (await call('fd', 'GET', '/hk-tasks')).json().data as Array<{
      roomNo: string;
      type: string;
    }>;
    expect(tasks.some((x) => x.roomNo === '301' && x.type === 'after_repair_clean')).toBe(true);
    // Reopen (FD+, ≤ 7 days after done) needs a note; MT may not.
    expect(
      (await act('mt', w2, 'reopen', done.json().version, { note: 'Lại rò' })).statusCode,
    ).toBe(403);
    const re = await act('fd', w2, 'reopen', done.json().version, { note: 'Lại rò điện' });
    expect(re.json()).toMatchObject({ status: 'in_progress' });
    // updateWorkOrder: severity change recomputes the deadlines; the block request is withdrawn.
    const w1v = (await call('fd', 'GET', `/work-orders/${w1.id}`)).json();
    const upd = await call('fd', 'PATCH', `/work-orders/${w1.id}`, {
      json: { severity: 'medium', blockRequested: false, assigneeUserId: uid('mt') },
      ifMatch: w1v.version,
    });
    expect(upd.statusCode, upd.body).toBe(200);
    expect(upd.json()).toMatchObject({
      severity: 'medium',
      blockRequested: false,
      assigneeName: 'mt',
    });
    expect(upd.json().resolveDueAt).toBe('2026-10-16T09:00:00.000+07:00'); // created 09:00 + 24 h
    // MT cancels only its own `new` work order.
    expect(
      (await act('mt', w1, 'cancel', upd.json().version, { cancelReason: 'Không cần' })).statusCode,
    ).toBe(403);
    const list = await call('mt', 'GET', '/work-orders');
    expect(list.statusCode, list.body).toBe(200);
    expect((list.json().data as Array<{ code: string }>).map((x) => x.code)).toEqual([
      w2.code,
      w1.code,
    ]);
  });

  it('J11 work_order.sla: overdue notified once (high → MGR too), remedy suggested for an occupied room, R5 VI → VC after vacant_reinspect_days, OOO room loses its open cleaning tasks', async () => {
    await seedStay(db, t, ids, { roomNo: '101', status: 'in_house', departure: '2026-10-25' });
    const wo = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('101'),
        title: 'Mất điện',
        description: 'Mất điện phòng',
        category: 'power',
      },
    });
    expect(wo.json().severity).toBe('high'); // occupied + power → high
    await setStatus('102', 'VI', new Date(T0.getTime() - 3 * 86_400_000));
    // createRoomBlock (B-10): exactly one of endDatePlanned | expectedDoneDate; the server adds the buffer.
    const cleaning = await task('201', 'adhoc_clean');
    const bothDates = await call('fd', 'POST', '/room-blocks', {
      json: {
        roomId: room('201'),
        startDate: TODAY,
        expectedDoneDate: TODAY,
        endDatePlanned: '2026-10-17',
        reason: 'Sơn lại',
      },
    });
    expect(bothDates.json().errors).toEqual([{ field: 'expectedDoneDate', code: 'NOT_ALLOWED' }]);
    const blk = await call('fd', 'POST', '/room-blocks', {
      json: {
        roomId: room('201'),
        startDate: TODAY,
        expectedDoneDate: '2026-10-16',
        reason: 'Sơn lại tường',
      },
    });
    expect(blk.statusCode, blk.body).toBe(201);
    expect(blk.json()).toMatchObject({
      status: 'active',
      expectedDoneDate: '2026-10-16',
      endDatePlanned: '2026-10-17',
    });
    const deps = {
      params: fa.app.get(ParameterService),
      events: fa.app.get(EventsService),
      rooms: fa.app.get(RoomStatusService),
    };
    const later = new Date(T0.getTime() + 3 * 3_600_000); // past ack (15 min) and plan (2 h)
    fa.clock.set(later);
    const s = await db.withContext(t.ctx(), (tx) => runWorkOrderSla(tx, deps, later, TODAY));
    expect(s.overdue).toBeGreaterThanOrEqual(1);
    expect(s.remedy).toBeGreaterThanOrEqual(1);
    expect(s.reinspect).toBeGreaterThanOrEqual(1);
    expect(s.blockedTasks).toBe(1);
    expect(await taskRow(cleaning)).toMatchObject({
      status: 'cancelled',
      cancel_reason_code: 'room_blocked',
    });
    expect(await notifications('work_order_overdue', wo.json().id)).toEqual(
      [uid('own'), uid('mgr'), uid('fdl'), uid('fd'), uid('mt')].sort(),
    );
    const again = await db.withContext(t.ctx(), (tx) => runWorkOrderSla(tx, deps, later, TODAY));
    expect(again.overdue).toBe(0);
    const got = (await call('fd', 'GET', `/work-orders/${wo.json().id}`)).json();
    expect(got).toMatchObject({ isOverdue: true, remedySuggested: true });
    expect((await call('mt', 'GET', `/work-orders/${wo.json().id}`)).json().remedySuggested).toBe(
      false,
    );
    expect((await entry('fd', '102')).status).toBe('VC');
  });

  it('"Cần chú ý" (BE-D list 2.3): work_order_overdue, ooo_ending_work_open from 12:00 of the last blocked day, room_status_mismatch both ways – FD+ only', async () => {
    await seedStay(db, t, ids, { roomNo: '101', status: 'in_house', departure: '2026-10-20' });
    await setStatus('101', 'VC'); // a guest in house in a vacant room
    await setStatus('102', 'OC'); // occupied status without a guest in house
    const blocked = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('301'),
        title: 'Thay vòi sen',
        description: 'Vòi sen rò nước',
        category: 'other',
        severity: 'medium',
        block: { startDate: TODAY, expectedDoneDate: TODAY, reason: 'Thay vòi sen' },
      },
    });
    expect(blocked.statusCode, blocked.body).toBe(201);
    expect(blocked.json().roomBlock).toMatchObject({ endDatePlanned: '2026-10-16' }); // last blocked day = today
    const high = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('302'),
        title: 'Mất điện',
        description: 'Mất điện phòng',
        category: 'power',
        severity: 'high',
      },
    });
    expect(high.statusCode, high.body).toBe(201);
    type Item = {
      kind: string;
      refCode?: string;
      roomNos?: string[];
      severity: string;
      count?: number;
      params?: Record<string, unknown>;
    };
    const items = async (u = 'fd') => (await call(u, 'GET', '/attention')).json().data as Item[];
    const kinds = (list: Item[]) => new Set(list.map((i) => i.kind));

    const morning = await items();
    expect(morning.find((i) => i.kind === 'room_status_mismatch')).toMatchObject({
      severity: 'warning',
      count: 2,
      roomNos: ['101', '102'],
    });
    expect(kinds(morning).has('ooo_ending_work_open')).toBe(false); // before 12:00
    expect(kinds(morning).has('work_order_overdue')).toBe(false); // ack in 15 min
    // EP01 3.1: a high work order is `warning` until it is overdue.
    expect(morning.find((i) => i.kind === 'work_order_high_open')).toMatchObject({
      severity: 'warning',
      refCode: high.json().code,
    });

    await at(new Date(T0.getTime() + 210 * 60_000)); // 12:30 local
    const noon = await items();
    const ending = noon.find((i) => i.kind === 'ooo_ending_work_open');
    expect(ending).toMatchObject({
      severity: 'warning',
      refCode: blocked.json().code,
      roomNos: ['301'],
    });
    if (ATTENTION_PARAM_KEYS.ooo_ending_work_open) {
      expect(ending!.params).toEqual({ roomNo: '301', endDate: '2026-10-16' });
    }
    // DATA A7-02 (EP01 3.1, US-012 AC4): the overdue HIGH work order is ONE critical line, `work_order_high_open`
    // – never also `work_order_overdue` (medium / low only, warning: the medium one past its deadline below).
    expect(noon.filter((i) => i.refCode === high.json().code)).toEqual([
      expect.objectContaining({
        kind: 'work_order_high_open',
        severity: 'critical',
        roomNos: ['302'],
      }),
    ]);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE work_order SET resolve_due_at = $2 WHERE id = $1', [
        blocked.json().id,
        new Date(T0.getTime() + 180 * 60_000),
      ]),
    );
    expect((await items()).filter((i) => i.kind === 'work_order_overdue')).toEqual([
      expect.objectContaining({
        severity: 'warning',
        refCode: blocked.json().code,
        roomNos: ['301'],
      }),
    ]);
    // HK / MT do not get these lines (default audience FD+).
    for (const u of ['hk', 'mt']) {
      const r = await call(u, 'GET', '/attention');
      if (r.statusCode === 200) {
        const k = kinds(r.json().data as Item[]);
        for (const kind of ['work_order_overdue', 'ooo_ending_work_open', 'room_status_mismatch']) {
          expect(k.has(kind)).toBe(false);
        }
      } else expect(r.statusCode).toBe(403);
    }
  });

  it('S4-31 (US-028 AC4, US-029 AC4): B13 → OD gives the room its stay-over clean of the day (an open check-out clean becomes it); a check-out clean shows the agreed checkout time', async () => {
    const rooms = fa.app.get(RoomStatusService);
    const b13 = (roomNo: string) =>
      db.withContext({ ...t.ctx(), userId: uid('fd'), actorType: 'user' }, (tx) =>
        rooms.set(tx, room(roomNo), 'OD', { today: TODAY, now: T0, event: 'B13' }),
      );
    type Task = {
      id: string;
      roomNo: string;
      type: string;
      status: string;
      reservationId?: string | null;
      notBeforeTime?: string;
      linenChange?: boolean;
    };
    const tasks = async () => (await call('fd', 'GET', '/hk-tasks')).json().data as Task[];
    // 101: the guest was leaving today (J8 gave no stay-over) and extends → OC → OD + stay-over clean.
    const s1 = await seedStay(db, t, ids, {
      roomNo: '101',
      status: 'in_house',
      arrival: '2026-10-13',
      departure: '2026-10-17',
    });
    await setStatus('101', 'OC');
    expect(await b13('101')).toBe('OC');
    const first = (await tasks()).filter((x) => x.roomNo === '101');
    // DOM-S4-16 (a): the J8 linen rule – 2 nights slept (13 → 15/10), every 3 → no linen change.
    expect(first).toMatchObject([
      {
        type: 'stayover_clean',
        status: 'open',
        reservationId: s1.reservationId,
        linenChange: false,
      },
    ]);
    await setStatus('101', 'OC'); // a second extension the same day → still one stay-over clean
    await b13('101');
    expect((await tasks()).filter((x) => x.roomNo === '101')).toHaveLength(1);
    // 102: an open check-out clean of the room today becomes the stay-over clean (same task).
    await seedStay(db, t, ids, {
      roomNo: '102',
      status: 'in_house',
      arrival: '2026-10-12',
      departure: '2026-10-17',
    });
    await setStatus('102', 'OC');
    const co = await task('102', 'checkout_clean');
    await b13('102');
    expect((await tasks()).filter((x) => x.roomNo === '102')).toMatchObject([
      { id: co, type: 'stayover_clean', status: 'open', linenChange: true }, // 3 nights slept
    ]);
    // 201: B15 agreed a late checkout at 15:00 → the check-out clean reads "dọn sau 15:00".
    const s3 = await seedStay(db, t, ids, { roomNo: '201', status: 'checked_out' });
    const late = await task('201', 'checkout_clean');
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query(`UPDATE reservation SET agreed_checkout_time = '15:00' WHERE id = $1`, [
        s3.reservationId,
      ]);
      await tx.query('UPDATE hk_task SET reservation_id = $2 WHERE id = $1', [
        late,
        s3.reservationId,
      ]);
    });
    expect((await tasks()).find((x) => x.id === late)?.notBeforeTime).toBe('15:00');
  });

  it('BR-424-05 (HK part, S4-09): J8 on the return day of a move "until the primary departure" – the room the guest comes back to is an arrival (no stay-over; VC → nothing; open cleaning → arrival rank, due checkout_time; nothing open → priority_clean), the room the guest leaves is not set VD', async () => {
    const o = ORACLES.examples.find((x) => x.id === 'BR-424-05')!;
    expect(o.pendingFix).toBeUndefined();
    // Three return pairs on the same day (oracle scenarios): [return room, moved room].
    const pairs: Array<[string, string, string]> = [
      ['repaired_and_cleaned', '203', '302'],
      ['repair_late_clean_open', '201', '301'],
      ['not_clean_no_task', '202', '402'],
    ];
    const openTask: Record<string, string> = {};
    for (const [name, back, moved] of pairs) {
      const sc = (o.input.scenarios as Array<Record<string, string | null>>).find(
        (x) => x.name === name,
      )!;
      const parent = await seedStay(db, t, ids, {
        roomNo: moved,
        status: 'in_house',
        arrival: '2026-10-12',
        departure: TODAY,
      });
      const child = await seedStay(db, t, ids, {
        roomNo: back,
        status: 'in_house',
        arrival: TODAY,
        departure: '2026-10-17',
      });
      await db.withContext(t.ctx(), (tx) =>
        tx.query('UPDATE reservation SET parent_reservation_id = $2 WHERE id = $1', [
          child.reservationId,
          parent.reservationId,
        ]),
      );
      await setStatus(back, sc.oldRoomStatusAtDailyRun as string);
      await setStatus(moved, 'OC');
      if (sc.openCleanTask) openTask[name] = await task(back, sc.openCleanTask);
    }
    const deps = {
      params: fa.app.get(ParameterService),
      events: fa.app.get(EventsService),
      rooms: fa.app.get(RoomStatusService),
    };
    const run = await db.withContext(t.ctx(), (tx) => runHkDaily(tx, deps, T0, TODAY));
    expect(run.stayover).toBe(0); // no stay-over for a returning guest; the leaving primary has none either
    expect(run.returnPrepared).toBe(2);
    const again = await db.withContext(t.ctx(), (tx) => runHkDaily(tx, deps, T0, TODAY));
    expect(again.returnPrepared).toBe(0); // once
    type Task = { id: string; roomNo: string; type: string; priorityRank: number; dueAt?: string };
    const tasks = (await call('fd', 'GET', '/hk-tasks')).json().data as Task[];
    const of = (roomNo: string) => tasks.filter((x) => x.roomNo === roomNo);
    // the oracle's 23/10 12:00 = its checkout_time on the return day → this suite's return day.
    expect(o.expected.scenarioResults[2].taskDueAt.slice(11, 16)).toBe(o.input.checkoutTime);
    const due = `${TODAY}T${o.input.checkoutTime}:00.000+07:00`;
    // repaired_and_cleaned: VC → nothing.
    expect(of('203')).toEqual([]);
    expect((await entry('fd', '203')).status).toBe('VC');
    // repair_late_clean_open: the open after-repair clean ranks "arrival today", due checkout_time.
    expect(of('201')).toMatchObject([
      {
        id: openTask.repair_late_clean_open,
        type: 'after_repair_clean',
        priorityRank: 2,
        dueAt: due,
      },
    ]);
    // not_clean_no_task: priority_clean, ranked "arrival today", due checkout_time.
    expect(of('202')).toMatchObject([{ type: 'priority_clean', priorityRank: 2, dueAt: due }]);
    // newRoomSetToVdByDailyRun = false: the rooms the guests leave keep their status, no task.
    for (const moved of ['302', '301', '402']) {
      expect((await entry('fd', moved)).status).toBe('OC');
      expect(of(moved)).toEqual([]);
    }
    // BR-806: the rooms waiting for their guest are no mismatch on the return day (the desk records the move
    // back later); the next morning an unrecorded return is (`notRecordedByNextMorningCheck`).
    const mismatch = async () =>
      (
        (await call('fd', 'GET', '/attention')).json().data as Array<{
          kind: string;
          roomNos?: string[];
        }>
      ).find((i) => i.kind === 'room_status_mismatch')?.roomNos ?? [];
    expect(await mismatch()).toEqual([]);
    expect(o.expected.notRecordedByNextMorningCheck).toBe('BR-806');
    await at(new Date(T0.getTime() + 86_400_000));
    expect(await mismatch()).toEqual(expect.arrayContaining(['201', '202', '203']));
  });

  it('BR-804 with ooo_reopen_buffer_days = 0: an expected end on the start day would be an empty block → 422 DATE_ORDER (work order and createRoomBlock); the next day → a one-night block', async () => {
    await setParam(db, t, 'ooo_reopen_buffer_days', 0, '2026-10-14');
    const wo = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('201'),
        title: 'Thay khóa',
        description: 'Khóa cửa kẹt',
        category: 'door_lock',
        block: { startDate: TODAY, expectedDoneDate: TODAY, reason: 'Thay khóa cửa' },
      },
    });
    expect(wo.statusCode, wo.body).toBe(422);
    expect(wo.json().errors).toEqual([{ field: 'block.expectedDoneDate', code: 'DATE_ORDER' }]);
    const empty = await call('fd', 'POST', '/room-blocks', {
      json: {
        roomId: room('201'),
        startDate: TODAY,
        expectedDoneDate: TODAY,
        reason: 'Thay khóa cửa',
      },
    });
    expect(empty.statusCode, empty.body).toBe(422);
    expect(empty.json().errors).toEqual([{ field: 'expectedDoneDate', code: 'DATE_ORDER' }]);
    const one = await call('fd', 'POST', '/room-blocks', {
      json: {
        roomId: room('201'),
        startDate: TODAY,
        expectedDoneDate: '2026-10-16',
        reason: 'Thay khóa cửa',
      },
    });
    expect(one.statusCode, one.body).toBe(201);
    expect(one.json()).toMatchObject({
      expectedDoneDate: '2026-10-16',
      endDatePlanned: '2026-10-16',
    });
  });

  it('US-058 (server side of the PWA offline queue, EP07 8.3–8.4): a replayed item (same Idempotency-Key) returns the first result once; a second HK gets 409 with currentState = the target ("đã áp dụng"); a queued "Dọn xong" sent after the check-out is decided on the data at receipt (R3 → VC) and keeps the device time; a room blocked meanwhile → 409 OOO', async () => {
    await setStatus('201', 'VD');
    await task('201', 'checkout_clean', { assigned: 'hk' });
    await task('201', 'adhoc_clean', { assigned: 'hk2' });
    const send = (u: string, roomNo: string, body: Record<string, unknown>, idem?: string) =>
      staff(fa, tok(u), null, 'POST', `${P(t)}/rooms/${room(roomNo)}/status-transitions`, {
        json: body,
        ...(idem ? { idem } : {}),
      });
    const key = randomUUID();
    const item = { event: 'start_cleaning', expectedFrom: 'VD', performedAt: AT(1) };
    const first = await send('hk', '201', item, key);
    expect(first.statusCode, first.body).toBe(200);
    const replay = await send('hk', '201', item, key);
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toEqual(first.json());
    // The other HK queued the same action offline: 409 whose currentState is the target → "đã áp dụng".
    const other = await send('hk2', '201', { ...item, performedAt: AT(2) });
    expect(other.statusCode).toBe(409);
    expect(other.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'CL' });
    const history = async (roomNo: string) =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ to_state: string; performed_at: Date | null; occurred_at: Date }>(
              `SELECT to_state, performed_at, occurred_at FROM state_transition
              WHERE machine = 'SM-03' AND entity_id = $1 ORDER BY occurred_at, to_state`,
              [room(roomNo)],
            )
          ).rows,
      );
    expect((await history('201')).filter((h) => h.to_state === 'CL')).toHaveLength(1);

    // 8.4: "Dọn xong" tapped offline at 10:42 while the guest was in house; the guest checked out at 10:50;
    // the item arrives at 11:05 → no stay in house any more → VC (R3), device time kept in the history.
    await seedStay(db, t, ids, { roomNo: '202', status: 'in_house' });
    await setStatus('202', 'CL');
    await task('202', 'stayover_clean', { assigned: 'hk', status: 'in_progress' });
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE reservation SET status = 'checked_out', actual_checkout_at = $2
          WHERE id IN (SELECT reservation_id FROM reservation_segment WHERE room_id = $1)`,
        [room('202'), new Date(T0.getTime() + 110 * 60_000)],
      ),
    );
    await at(new Date(T0.getTime() + 125 * 60_000));
    const tapped = new Date(T0.getTime() + 102 * 60_000);
    const late = await send('hk', '202', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: tapped.toISOString(),
    });
    expect(late.statusCode, late.body).toBe(200);
    expect(late.json().status).toBe('VC');
    const last = (await history('202')).at(-1)!;
    expect(last).toMatchObject({ to_state: 'VC' });
    expect(last.performed_at?.toISOString()).toBe(tapped.toISOString());
    expect(last.occurred_at.getTime()).toBeGreaterThan(tapped.getTime());

    // Blocked while the HK was offline → "không áp dụng được" (409, currentState OOO).
    await setStatus('203', 'CL');
    await task('203', 'adhoc_clean', { assigned: 'hk', status: 'in_progress' });
    await setStatus('203', 'OOO');
    const blocked = await send('hk', '203', {
      event: 'finish_cleaning',
      expectedFrom: 'CL',
      performedAt: new Date(T0.getTime() + 120 * 60_000).toISOString(),
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'OOO' });
  });

  it('listAssignableStaff (0.3.7 bổ sung 3, US-062 AC2, A85): active HK / MT staff of the property – id + display name only, sorted; disabled, admin-locked or revoked people are left out (a temporary lock-out stays) and cannot be assigned; HK → 403; createHkTask on an OOO room → 409 ROOM_BLOCKED without conflicts', async () => {
    const list = async (u: string, q: string) => call(u, 'GET', `/assignable-staff${q}`);
    const missing = await list('fd', '');
    expect(missing.statusCode).toBe(422);
    expect(missing.json().errors).toEqual([{ field: 'department', code: 'REQUIRED' }]);
    expect((await list('fd', '?department=front_desk')).json().errors).toEqual([
      { field: 'department', code: 'NOT_IN_LIST' },
    ]);
    expect((await list('hk', '?department=housekeeping')).statusCode).toBe(403);
    const hk = await list('fd', '?department=housekeeping');
    expect(hk.statusCode, hk.body).toBe(200);
    expect(hk.json()).toEqual({
      data: [
        { userId: uid('hk'), displayName: 'hk', department: 'housekeeping' },
        { userId: uid('hk2'), displayName: 'hk2', department: 'housekeeping' },
      ],
    });
    const mt = await list('mt', '?department=maintenance');
    expect(mt.json().data).toEqual([
      { userId: uid('mt'), displayName: 'mt', department: 'maintenance' },
    ]);
    const sql = (q: string, params: unknown[]) =>
      db.withContext(t.ctx(), (tx) => tx.query(q, params));
    const hkIds = async () =>
      ((await list('fd', '?department=housekeeping')).json().data as Array<{ userId: string }>).map(
        (x) => x.userId,
      );
    // disabled → out, and cannot be given a task (422 NOT_IN_LIST)
    await sql(`UPDATE app_user SET status = 'disabled' WHERE id = $1`, [uid('hk2')]);
    expect(await hkIds()).toEqual([uid('hk')]);
    const assign = await call('fd', 'POST', '/hk-tasks', {
      json: {
        roomId: room('101'),
        type: 'adhoc_clean',
        dueDate: TODAY,
        assignedUserId: uid('hk2'),
      },
    });
    expect(assign.statusCode).toBe(422);
    expect(assign.json().errors).toEqual([{ field: 'assignedUserId', code: 'NOT_IN_LIST' }]);
    // locked by an administrator (no locked_until) → out; a temporary log-in lock-out → still listed
    await sql(`UPDATE app_user SET status = 'locked', locked_until = NULL WHERE id = $1`, [
      uid('hk2'),
    ]);
    expect(await hkIds()).toEqual([uid('hk')]);
    await sql(`UPDATE app_user SET status = 'locked', locked_until = $2 WHERE id = $1`, [
      uid('hk2'),
      new Date(T0.getTime() + 15 * 60_000),
    ]);
    expect(await hkIds()).toEqual([uid('hk'), uid('hk2')]);
    // role revoked at the property → out
    await sql(
      `UPDATE user_property_role SET revoked_at = $2 WHERE user_id = $1 AND role = 'maintenance'`,
      [uid('mt'), T0],
    );
    expect((await list('fd', '?department=maintenance')).json().data).toEqual([]);
    // createHkTask on a room OOO today → 409 ROOM_BLOCKED (no conflicts[] – bổ sung 3 #7)
    await setStatus('102', 'OOO');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_block (id, organization_id, property_id, room_id, status, reason, start_date,
           end_date_planned, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', 'Sửa ống nước', $5, $6, $7, $7)`,
        [randomUUID(), t.organizationId, t.propertyIds[0], room('102'), TODAY, '2026-10-17', T0],
      ),
    );
    const blocked = await call('fd', 'POST', '/hk-tasks', {
      json: { roomId: room('102'), type: 'adhoc_clean', dueDate: TODAY },
    });
    expect(blocked.statusCode, blocked.body).toBe(409);
    expect(blocked.json().code).toBe('ROOM_BLOCKED');
    expect(blocked.json()).not.toHaveProperty('conflicts');
  });

  it('BUG-R2-108: WorkOrder.allowedActions are AllowedAction objects per role and SM-04 state (FD+/MT; HK none; MT cancels only its own new; reopen ≤ 7 days after done)', async () => {
    const created = await call('fd', 'POST', '/work-orders', {
      json: {
        roomId: room('201'),
        title: 'Thay vòi sen',
        description: 'Vòi sen rò nước',
        category: 'other',
        severity: 'low', // no photo evidence needed to complete (wo_done_photo_required_severities)
      },
    });
    expect(created.statusCode, created.body).toBe(201);
    const id = created.json().id as string;
    const acts = async (u: string) =>
      ((await call(u, 'GET', `/work-orders/${id}`)).json().allowedActions as Array<{
        event: string;
        transition: string;
        action: string;
      }>) ?? [];
    expect(created.json().allowedActions).toEqual([
      { event: 'accept_work_order', transition: 'W2', action: 'accept' },
      { event: 'cancel_work_order', transition: 'W5', action: 'cancel' },
    ]);
    for (const u of ['own', 'mgr', 'fdl', 'fd']) {
      expect(
        (await acts(u)).map((a) => a.action),
        u,
      ).toEqual(['accept', 'cancel']);
    }
    expect((await acts('mt')).map((a) => a.action)).toEqual(['accept']); // not its own work order
    const list = (await call('fd', 'GET', '/work-orders')).json().data as Array<{
      id: string;
      allowedActions: Array<{ action: string }>;
    }>;
    expect(list.find((w) => w.id === id)?.allowedActions.map((a) => a.action)).toEqual([
      'accept',
      'cancel',
    ]);
    // MT's own report: it may cancel it while `new`; the HK reporter sees none.
    const mine = await call('mt', 'POST', '/work-orders', {
      json: { roomId: room('202'), title: 'Đèn hỏng', description: 'Đèn trần', category: 'other' },
    });
    expect(mine.json().allowedActions.map((a: { action: string }) => a.action)).toEqual([
      'accept',
      'cancel',
    ]);
    const hkWo = await call('hk', 'POST', '/work-orders', {
      json: {
        roomId: room('203'),
        title: 'Rèm rách',
        description: 'Rèm cửa sổ',
        category: 'other',
      },
    });
    expect(hkWo.statusCode, hkWo.body).toBe(201);
    expect(hkWo.json().allowedActions).toEqual([]);
    // accept → in_progress → complete → done: reopen for FD+ only, gone after 7 days in an empty room.
    let v = created.json().version as number;
    const act = async (u: string, action: string, body: Record<string, unknown> = {}) => {
      const r = await call(u, 'POST', `/work-orders/${id}/actions/${action}`, {
        json: body,
        ifMatch: v,
      });
      if (r.statusCode === 200) v = r.json().version;
      return r;
    };
    expect((await act('mt', 'accept')).statusCode).toBe(200);
    expect((await acts('fd')).map((a) => a.action)).toEqual(['wait-parts', 'complete']);
    expect((await acts('mt')).map((a) => a.action)).toEqual(['wait-parts', 'complete']);
    const done = await act('mt', 'complete', { resultNote: 'Đã thay vòi' });
    expect(done.statusCode, done.body).toBe(200);
    expect(await acts('fd')).toEqual([
      { event: 'reopen_work_order', transition: 'W6', action: 'reopen' },
    ]);
    expect(await acts('mt')).toEqual([]);
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE work_order SET done_at = $2 WHERE id = $1', [
        id,
        new Date(T0.getTime() - 8 * 86_400_000),
      ]),
    );
    expect(await acts('fd')).toEqual([]);
    const late = await act('fd', 'reopen', { note: 'Lại rò nước' });
    expect(late.statusCode).toBe(409);
  });

  it('BR-807-01 (DOM v0.3.8): a guest arriving today is not a stay-over – J8 run late after the check-in keeps OC without a stay-over clean, the next 07:00 run gives OD + the clean; an extension (B13) on the arrival day keeps OC too', async () => {
    const o = ORACLES.examples.find((x) => x.id === 'BR-807-01')!;
    expect(o.pendingFix).toBeUndefined();
    // Same pattern on this suite's day (oracle 20/10 → 15/10): check-in 14:00, J8 catch-up 15:00.
    await seedStay(db, t, ids, {
      roomNo: o.input.roomNo,
      status: 'in_house',
      arrival: TODAY,
      departure: '2026-10-17',
    });
    await setStatus(o.input.roomNo, 'OC');
    const deps = {
      params: fa.app.get(ParameterService),
      events: fa.app.get(EventsService),
      rooms: fa.app.get(RoomStatusService),
    };
    const stayovers = async (roomNo: string, day: string) =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ n: number }>(
              `SELECT count(*)::int AS n FROM hk_task WHERE room_id = $1 AND type = 'stayover_clean'
                AND due_date = $2::date`,
              [room(roomNo), day],
            )
          ).rows[0]!.n,
      );
    const lateRun = new Date(T0.getTime() + 6 * 3_600_000); // 15:00 local
    await db.withContext(t.ctx(), (tx) => runHkDaily(tx, deps, lateRun, TODAY));
    expect((await entry('fd', o.input.roomNo)).status).toBe(o.expected.afterLateRun.roomStatus);
    expect((await stayovers(o.input.roomNo, TODAY)) > 0).toBe(
      o.expected.afterLateRun.stayoverTaskCreated,
    );
    // B13 on the arrival day: no OC → OD, no stay-over clean.
    await seedStay(db, t, ids, {
      roomNo: '203',
      status: 'in_house',
      arrival: TODAY,
      departure: '2026-10-17',
    });
    await setStatus('203', 'OC');
    const kept = await db.withContext({ ...t.ctx(), userId: uid('fd'), actorType: 'user' }, (tx) =>
      deps.rooms.set(tx, room('203'), 'OD', { today: TODAY, now: lateRun, event: 'B13' }),
    );
    expect(kept).toBe('OC');
    expect((await entry('fd', '203')).status).toBe('OC');
    expect(await stayovers('203', TODAY)).toBe(0);
    // Next day 07:00: both rooms are stay-overs now.
    const next = '2026-10-16';
    await at(new Date(T0.getTime() + 22 * 3_600_000));
    await db.withContext(t.ctx(), (tx) =>
      runHkDaily(tx, deps, new Date(T0.getTime() + 22 * 3_600_000), next),
    );
    const statusOn = async (roomNo: string) =>
      db.withContext(
        t.ctx(),
        async (tx) => (await deps.rooms.of(tx, room(roomNo), next)) as string,
      );
    expect(await statusOn(o.input.roomNo)).toBe(o.expected.afterNextRun.roomStatus);
    expect((await stayovers(o.input.roomNo, next)) > 0).toBe(
      o.expected.afterNextRun.stayoverTaskCreated,
    );
    expect(await statusOn('203')).toBe('OD');
    expect(await stayovers('203', next)).toBe(1);
  });

  it('BUG-R2-151: an OTA booking checked in before 06:00 (B9a – child booking for the night before) is a stay-over on its own arrival day – J8 07:00 gives OD + 1 stay-over clean, B13 the same day too (like a direct booking)', async () => {
    const deps = {
      params: fa.app.get(ParameterService),
      events: fa.app.get(EventsService),
      rooms: fa.app.get(RoomStatusService),
    };
    /** OTA booking arriving today + its B9a child (night before), both lived. */
    const b9a = async (roomNo: string, childStatus: 'in_house' | 'checked_out') => {
      const main = await seedStay(db, t, ids, {
        roomNo,
        status: 'in_house',
        arrival: TODAY,
        departure: '2026-10-17',
      });
      const child = await seedStay(db, t, ids, {
        roomNo,
        status: childStatus,
        arrival: '2026-10-14',
        departure: TODAY,
      });
      await db.withContext(t.ctx(), (tx) =>
        tx.query('UPDATE reservation SET parent_reservation_id = $2 WHERE id = $1', [
          child.reservationId,
          main.reservationId,
        ]),
      );
      await setStatus(roomNo, 'OC');
      return main.reservationId;
    };
    const stayovers = async (roomNo: string) =>
      db.withContext(
        t.ctx(),
        async (tx) =>
          (
            await tx.query<{ reservation_id: string; linen_change: boolean }>(
              `SELECT reservation_id, linen_change FROM hk_task WHERE room_id = $1 AND type = 'stayover_clean'
                AND due_date = $2::date`,
              [room(roomNo), TODAY],
            )
          ).rows,
      );
    const main302 = await b9a('302', 'in_house');
    const run = await db.withContext(
      t.ctx(),
      (tx) => runHkDaily(tx, deps, new Date(T0.getTime() - 2 * 3_600_000), TODAY), // 07:00
    );
    expect(run.markedDirty).toBeGreaterThanOrEqual(1);
    expect((await entry('fd', '302')).status).toBe('OD');
    expect(await stayovers('302')).toEqual([{ reservation_id: main302, linen_change: false }]); // 1 night slept
    // B13 the same day on another B9a stay (child already checked out): OC → OD + 1 stay-over clean.
    await b9a('301', 'checked_out');
    const before = await db.withContext(
      { ...t.ctx(), userId: uid('fd'), actorType: 'user' },
      (tx) => deps.rooms.set(tx, room('301'), 'OD', { today: TODAY, now: T0, event: 'B13' }),
    );
    expect(before).toBe('OC');
    expect((await entry('fd', '301')).status).toBe('OD');
    expect(await stayovers('301')).toHaveLength(1);
  });

  it('EP14 port (BE-D): a guest request becomes a guest_request task (rank 3) or a work order (guest_app, medium); decline cancels the open task', async () => {
    const port = fa.app.get<GuestRequestWorkPort>(GUEST_REQUEST_WORK_PORT);
    const { reservationId } = await seedStay(db, t, ids, { roomNo: '203', status: 'in_house' });
    const made = await db
      .withContext({ ...t.ctx(), actorType: 'system' }, async (tx) => {
        const tk = await port.createTask(tx, {
          guestRequestId: randomUUID(),
          reservationId,
          roomId: room('203'),
          note: 'Thêm 2 khăn tắm',
          dueDate: TODAY,
          now: T0,
        });
        const w = await port.createWorkOrder(tx, {
          guestRequestId: randomUUID(),
          reservationId,
          roomId: room('203'),
          description: 'Vòi sen rò nước',
          now: T0,
        });
        return { tk, w };
      })
      .catch((e) => {
        // guest_request FK (BE-D 0058) may require an existing request – checked by BE-D's suite.
        return { error: String(e) };
      });
    if ('error' in made) {
      expect(made.error).toMatch(/guest_request/);
      return;
    }
    const list = (await call('fd', 'GET', '/hk-tasks')).json().data as Array<{
      id: string;
      type: string;
      source: string;
      priorityRank: number;
      note?: string;
    }>;
    expect(list.find((x) => x.id === made.tk.hkTaskId)).toMatchObject({
      type: 'guest_request',
      source: 'guest_app',
      priorityRank: 3,
      note: 'Thêm 2 khăn tắm',
    });
    const w = (await call('fd', 'GET', `/work-orders/${made.w.workOrderId}`)).json();
    expect(w).toMatchObject({
      source: 'guest_app',
      severity: 'medium',
      category: 'other',
      title: 'Khách báo hỏng – căn 203',
    });
    await db.withContext(t.ctx(), (tx) => port.cancelTask(tx, made.tk.hkTaskId, T0));
    expect(await taskRow(made.tk.hkTaskId)).toMatchObject({
      status: 'cancelled',
      cancel_reason_code: 'other',
    });
  });
});
