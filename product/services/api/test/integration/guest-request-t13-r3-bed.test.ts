/**
 * R3-Q15 – T13 `guest_request.purge` (US-109 AC3, US-110 AC4; SEC s1 B.7) on the real PostgreSQL – BE-D R3 Sprint 1.
 * - a CLOSED request whose `closed_at` is `retention.guest_request_months` (12) or more ago loses `note` and
 *   `reply_note` (row, type, status, times kept); `note_purged_at` set; one `purge_journal` row (ids only);
 * - just before the deadline nothing happens; an OPEN request is never touched whatever its age;
 * - the linked hk_task note → NULL and the work order description → fixed text, `version` bumped (PWA resync);
 * - the audit row carries counts only, never the text; a second run purges nothing (idempotent);
 * - a `declined` + `other` request (reply note required by CHECK) can be purged (CHECK relaxed once purged).
 * Fake clock; FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import { GUEST_REQUEST_PURGE_JOB_KEY } from '../../src/modules/guest-portal/public/guest-request-jobs';
import { GUEST_WORK_ORDER_FIXED_DESCRIPTION } from '../../src/modules/housekeeping/public/guest-request-text-purge';
import { type FeatureApp, startFeatureApp } from '../helpers/feature-app';
import { seedStay, setStayStatus } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const SECRET_NOTE = 'Ghi chu rieng cua khach 7788';

describe.skipIf(!HAS_DB)('R3-Q15 T13 guest_request.purge (BE-D R3 Sprint 1)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let reservationId: string;
  let roomId: string;
  const rq: Record<string, string> = {};
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const property = () => ({
    propertyId: t.propertyIds[0]!,
    organizationId: t.organizationId,
    timezone: 'Asia/Ho_Chi_Minh',
  });
  const run = async (iso: string) => {
    fa.clock.set(new Date(iso));
    return (await fa.app.get(JobRunner).runOnce(GUEST_REQUEST_PURGE_JOB_KEY, property())).stats;
  };

  async function insertRequest(opts: {
    status: 'new' | 'done' | 'declined';
    closedAt: string | null;
    createdAt: string;
    declined?: 'other' | 'duplicate';
    withWork?: boolean;
  }): Promise<string> {
    const id = uuidv7();
    await q(
      `INSERT INTO guest_request (id, organization_id, property_id, reservation_id, room_id, type, note, status,
         routed_to, ack_due_at, declined_reason_code, reply_note, closed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'report_issue', $6, $7, 'maintenance', $8, $9, $10, $11, $8, $8)`,
      [
        id,
        t.organizationId,
        t.propertyIds[0],
        reservationId,
        roomId,
        SECRET_NOTE,
        opts.status,
        new Date(opts.createdAt),
        opts.declined ?? null,
        opts.status === 'new' ? null : 'Da xu ly xong',
        opts.closedAt ? new Date(opts.closedAt) : null,
      ],
    );
    if (opts.withWork) {
      const task = uuidv7();
      await q(
        `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
           source, guest_request_id, note, priority_rank, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'guest_request', 'done', '2025-10-01', 'guest_app', $6, $7, 3, $8, $8)`,
        [
          task,
          t.organizationId,
          t.propertyIds[0],
          roomId,
          reservationId,
          id,
          SECRET_NOTE,
          new Date(opts.createdAt),
        ],
      );
      await q(
        `INSERT INTO work_order (id, organization_id, property_id, code, room_id, title, description, category,
           severity, status, source, guest_request_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'Khách báo hỏng – căn 202', $6, 'other', 'medium', 'new', 'guest_app', $7,
                 $8, $8)`,
        [
          uuidv7(),
          t.organizationId,
          t.propertyIds[0],
          `WO-T13-${id.slice(-4)}`,
          roomId,
          SECRET_NOTE,
          id,
          new Date(opts.createdAt),
        ],
      );
    }
    return id;
  }

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { own: ['owner'], fd: ['front_desk'] } });
    ids = await seedBooking(db, t);
    fa = await startFeatureApp(db);
    const stay = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: '202',
      departure: '2026-10-17',
    });
    reservationId = stay.reservationId;
    roomId = (await q<{ id: string }>(`SELECT id FROM room WHERE room_no = '202'`))[0]!.id;
    // Closed 15/10/2025 08:00 VN: due at 15/10/2026 08:00 (12 months – DRA T13).
    rq.old = await insertRequest({
      status: 'done',
      closedAt: '2025-10-15T08:00:00+07:00',
      createdAt: '2025-10-14T10:00:00+07:00',
      withWork: true,
    });
    // Closed 15/10/2025 10:00 VN: due at 15/10/2026 10:00 – still kept at 09:00.
    rq.later = await insertRequest({
      status: 'declined',
      declined: 'other',
      closedAt: '2025-10-15T10:00:00+07:00',
      createdAt: '2025-10-15T09:30:00+07:00',
    });
    // Open for more than a year (data error / forgotten): never purged by T13.
    rq.open = await insertRequest({
      status: 'new',
      closedAt: null,
      createdAt: '2025-01-01T09:00:00+07:00',
    });
    // Online check-in arrival note (C2, D23 – FB-R3-SEC-BED-01).
    await q(
      `INSERT INTO online_checkin (id, organization_id, property_id, reservation_id, current_step, arrival_note,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'done', $5, $6, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        reservationId,
        SECRET_NOTE,
        new Date('2026-10-14T10:00:00+07:00'),
      ],
    );
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('catalogue: retention.guest_request_months defaults to 12 (DRA T13), OWN only', async () => {
    const def = await q<{ default_value: unknown; edit_roles: string[] }>(
      `SELECT default_value, edit_roles FROM config_parameter_def WHERE key = 'retention.guest_request_months'`,
    );
    expect(def[0]).toEqual({ default_value: 12, edit_roles: ['owner'] });
  });

  it('just before the deadline: nothing is purged', async () => {
    expect(await run('2026-10-15T07:59:00+07:00')).toEqual({
      purged: 0,
      linkedWork: 0,
      arrivalNotes: 0,
    });
    const rows = await q<{ note: string | null }>('SELECT note FROM guest_request WHERE id = $1', [
      rq.old,
    ]);
    expect(rows[0]?.note).toBe(SECRET_NOTE);
  });

  it('at the deadline: note + reply note emptied, row kept, linked work stripped, journal + audit without text', async () => {
    expect(await run('2026-10-15T09:00:00+07:00')).toEqual({
      purged: 1,
      linkedWork: 2,
      arrivalNotes: 0,
    });
    const [r] = await q<Record<string, unknown>>('SELECT * FROM guest_request WHERE id = $1', [
      rq.old,
    ]);
    expect(r).toMatchObject({
      note: null,
      reply_note: null,
      status: 'done',
      type: 'report_issue',
      version: 2,
    });
    expect(r?.note_purged_at).toEqual(new Date('2026-10-15T09:00:00+07:00'));
    const task = await q<{ note: string | null; version: number }>(
      'SELECT note, version FROM hk_task WHERE guest_request_id = $1',
      [rq.old],
    );
    expect(task).toEqual([{ note: null, version: 2 }]);
    const wo = await q<{ description: string; version: number }>(
      'SELECT description, version FROM work_order WHERE guest_request_id = $1',
      [rq.old],
    );
    expect(wo).toEqual([{ description: GUEST_WORK_ORDER_FIXED_DESCRIPTION, version: 2 }]);
    const journal = await q<Record<string, unknown>>(
      `SELECT subject_type, subject_id, policy_key, action FROM purge_journal WHERE subject_id = $1`,
      [rq.old],
    );
    expect(journal).toEqual([
      {
        subject_type: 'guest_request',
        subject_id: rq.old,
        policy_key: 'T13',
        action: 'null_columns',
      },
    ]);
    const audit = await q<{ after: unknown; action: string }>(
      `SELECT action, after FROM audit_event WHERE action = 'retention.guest_request_note_purged'`,
    );
    expect(audit).toEqual([
      {
        action: 'retention.guest_request_note_purged',
        after: { policyKey: 'T13', count: 1, linkedWork: 2, arrivalNotes: 0 },
      },
    ]);
    // The other two are untouched.
    const rest = await q<{ id: string; note: string | null }>(
      'SELECT id, note FROM guest_request WHERE id = ANY($1::uuid[]) ORDER BY id',
      [[rq.later, rq.open]],
    );
    expect(rest.every((x) => x.note === SECRET_NOTE)).toBe(true);
  });

  it('a second run the same minute purges nothing (idempotent); the declined `other` one goes at its own deadline', async () => {
    expect(await run('2026-10-15T09:00:00+07:00')).toEqual({
      purged: 0,
      linkedWork: 0,
      arrivalNotes: 0,
    });
    expect(await run('2026-10-15T10:00:00+07:00')).toEqual({
      purged: 1,
      linkedWork: 0,
      arrivalNotes: 0,
    });
    const [r] = await q<Record<string, unknown>>(
      'SELECT note, reply_note, declined_reason_code, status FROM guest_request WHERE id = $1',
      [rq.later],
    );
    expect(r).toEqual({
      note: null,
      reply_note: null,
      declined_reason_code: 'other',
      status: 'declined',
    });
    expect(await run('2026-10-15T10:01:00+07:00')).toEqual({
      purged: 0,
      linkedWork: 0,
      arrivalNotes: 0,
    });
  });

  it('while the stay runs: an open request and the arrival note are never purged, even years later', async () => {
    expect(await run('2028-01-01T09:00:00+07:00')).toEqual({
      purged: 0,
      linkedWork: 0,
      arrivalNotes: 0,
    });
    const [r] = await q<{ note: string | null }>('SELECT note FROM guest_request WHERE id = $1', [
      rq.open,
    ]);
    expect(r?.note).toBe(SECRET_NOTE);
    const [n] = await q<{ arrival_note: string | null }>(
      'SELECT arrival_note FROM online_checkin WHERE reservation_id = $1',
      [reservationId],
    );
    expect(n?.arrival_note).toBe(SECRET_NOTE);
  });

  it('SEC BED-01/02: stay ended (check-out 17/10/2026 11:00) → open request + arrival note purged 12 months later, once', async () => {
    await setStayStatus(db, t, reservationId, 'checked_out', {
      actualCheckoutAt: new Date('2026-10-17T11:00:00+07:00'),
    });
    expect(await run('2027-10-17T10:59:00+07:00')).toEqual({
      purged: 0,
      linkedWork: 0,
      arrivalNotes: 0,
    });
    expect(await run('2027-10-17T11:00:00+07:00')).toEqual({
      purged: 1,
      linkedWork: 0,
      arrivalNotes: 1,
    });
    const [r] = await q<Record<string, unknown>>(
      'SELECT note, reply_note, status FROM guest_request WHERE id = $1',
      [rq.open],
    );
    expect(r).toEqual({ note: null, reply_note: null, status: 'new' });
    const [n] = await q<{ id: string; arrival_note: string | null }>(
      'SELECT id, arrival_note FROM online_checkin WHERE reservation_id = $1',
      [reservationId],
    );
    expect(n?.arrival_note).toBeNull();
    const journal = await q<Record<string, unknown>>(
      `SELECT subject_type, policy_key, action FROM purge_journal WHERE subject_id = $1`,
      [n?.id],
    );
    expect(journal).toEqual([
      { subject_type: 'online_checkin', policy_key: 'T13', action: 'null_columns' },
    ]);
    expect(await run('2027-10-17T11:01:00+07:00')).toEqual({
      purged: 0,
      linkedWork: 0,
      arrivalNotes: 0,
    });
    // No audit / journal row anywhere carries the text.
    const leaks = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event WHERE after::text LIKE '%7788%' OR before::text LIKE '%7788%'`,
    );
    expect(leaks[0]?.n).toBe(0);
  });
});
