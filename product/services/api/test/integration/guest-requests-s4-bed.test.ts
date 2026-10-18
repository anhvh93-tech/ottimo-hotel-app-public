/**
 * EP14 on the real PostgreSQL through the HTTP surface (BE-D Sprint 4):
 * - US-108: getGuestStay / openSession – room NAME (BR-012), never the room number; map pin from the parameter
 *   `property_map_url` (S4-51, INV pin by default; host allow-list at setParameter – 422 NOT_IN_LIST); Wi-Fi
 *   from the arrival business date;
 * - US-109: request options (in-house types, BR-506 fee – second full clean / long stay), create (validation,
 *   fee acceptance, routing, auto reply out of hours, ≤ 20 a day), the guest's own list (statusLabel VI/EN);
 * - US-110: routing to HK/MT/FD (S30 routed_to_me), SM-15 transitions + replyNote SEC B-15 rules, the BE-C work
 *   port (fake that writes a real hk_task), GuestRequestStatusPort (started / done + fee once in the folio),
 *   J10 `guest_request.sla` exactly once + "Cần chú ý" `guest_request_overdue`; after check-out → 403.
 * Fake clock (T0 = Thu 15/10/2026 09:00 VN). FAKE data only.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import type { Database, Tx } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import { GuestRequestsService } from '../../src/modules/guest-portal/internal/guest-requests.service';
import { GUEST_REQUEST_SLA_JOB_KEY } from '../../src/modules/guest-portal/public/guest-request-jobs';
import type {
  GuestRequestTaskInput,
  GuestRequestWork,
  GuestRequestWorkOrderInput,
  LastFullCleanInput,
} from '../../src/modules/guest-portal/public/guest-request-ports';
import {
  GUEST_REQUEST_WORK_PORT,
  UnwiredGuestRequestWorkPort,
} from '../../src/modules/guest-portal/public/guest-request-ports';
import { GuestRequestStatusPort } from '../../src/modules/guest-portal/public/guest-request-status.port';
import { RATE_LIMITER, type RateLimiter } from '../../src/modules/identity/public/rate-limiter';
import { type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import {
  GUEST_TEST_ORIGIN,
  guest,
  seedStay,
  setStayStatus,
  staff,
} from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const HOTLINE = '0263 3 822 822';

/**
 * BE-C's port, faked: a real hk_task row per task (the FK guest_request.hk_task_id must hold). The BR-506 read
 * `lastFullCleanAt` goes to BE-C's real adapter (ARC S4-09 – the real paths: guest-requests-s4-fix-bed.test.ts).
 */
class FakeWorkPort implements GuestRequestWork {
  real: GuestRequestWork | null = null;
  tasks: GuestRequestTaskInput[] = [];
  workOrders: GuestRequestWorkOrderInput[] = [];
  cancelled: string[] = [];
  async createTask(tx: Tx, i: GuestRequestTaskInput): Promise<{ hkTaskId: string }> {
    this.tasks.push(i);
    const id = uuidv7();
    await tx.query(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
         source, guest_request_id, note, priority_rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'guest_request', 'open', $6, 'guest_app', $7, $8, 3, $9, $9)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        i.roomId,
        i.reservationId,
        i.dueDate,
        i.guestRequestId,
        i.note,
        i.now,
      ],
    );
    return { hkTaskId: id };
  }
  async createWorkOrder(_tx: Tx, i: GuestRequestWorkOrderInput): Promise<null> {
    this.workOrders.push(i);
    return null; // work_order table is BE-C's (not migrated yet)
  }
  lastFullCleanAt(tx: Tx, i: LastFullCleanInput): Promise<Date | null> {
    return (this.real as GuestRequestWork).lastFullCleanAt(tx, i);
  }
  async cancelTask(tx: Tx, hkTaskId: string, now: Date): Promise<void> {
    this.cancelled.push(hkTaskId);
    await tx.query(
      `UPDATE hk_task SET status = 'cancelled', cancel_reason_code = 'other',
              cancel_note = 'Yêu cầu khách bị từ chối', updated_at = $2 WHERE id = $1`,
      [hkTaskId, now],
    );
  }
}

describe.skipIf(!HAS_DB)('EP14 guest requests + stay info (BE-D Sprint 4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  const work = new FakeWorkPort();
  const tok = (u: string) => t.users[u]!.sessionToken;
  const stays: Record<string, { reservationId: string; code: string; sid: string }> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        own: ['owner'],
        mgr: ['manager'],
        fd: ['front_desk'],
        fdl: ['front_desk_lead'],
        hk: ['housekeeping'],
        mt: ['maintenance'],
        sal: ['sales_staff'],
      },
    });
    ids = await seedBooking(db, t);
    await db.withContext(t.ctx(), async (tx) => {
      // BR-012 temporary mapping (BL 4.1) + public room type; the property's public hotline and Wi-Fi.
      await tx.query(
        `UPDATE room SET name = CASE room_no WHEN '202' THEN 'The Valley' WHEN '203' THEN 'The Sage'
                                             WHEN '301' THEN 'The Velvet' ELSE name END,
                         public_room_type = 'Standard Studio' WHERE room_no IN ('202', '203', '301')`,
      );
      await tx.query(
        `UPDATE property SET phone_public = $2, wifi_info_i18n = '{"ssid":"OTTIMO-Guest","password":"fake-wifi-pass"}'
          WHERE id = $1`,
        [t.propertyIds[0], HOTLINE],
      );
    });
    fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
    // Bind the fake BE-C port (the module takes GUEST_REQUEST_WORK_PORT as optional).
    work.real = fa.app.get<GuestRequestWork>(GUEST_REQUEST_WORK_PORT);
    (fa.app.get(GuestRequestsService) as unknown as { work: GuestRequestWork }).work = work;
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;

  async function sessionOf(reservationId: string, lang?: string): Promise<string> {
    const link = await staff(
      fa,
      tok('fd'),
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    expect(link.statusCode, link.body).toBe(201);
    const token = new URL(link.json().url).pathname.slice(3);
    const open = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token },
      headers: { 'x-forwarded-for': '9.9.9.9', ...(lang ? { 'accept-language': lang } : {}) },
    });
    expect(open.statusCode, open.body).toBe(200);
    expect(open.json()).not.toHaveProperty('roomNo');
    return cookieValue(open, 'ottimo_gsid') as string;
  }
  const options = async (sid: string) => {
    const r = await guest(fa, sid, 'GET', '/v1/guest/request-options');
    expect(r.statusCode, r.body).toBe(200);
    return Object.fromEntries(
      (r.json().data as Array<{ type: string }>).map((o) => [o.type, o]),
    ) as Record<string, Record<string, unknown>>;
  };
  const create = (sid: string, body: unknown) =>
    guest(fa, sid, 'POST', '/v1/guest/requests', { json: body });
  const staffList = async (who: string, status?: string) => {
    const r = await staff(
      fa,
      tok(who),
      null,
      'GET',
      `${P(t)}/guest-requests${status ? `?status=${status}` : ''}`,
    );
    return r;
  };
  const act = (who: string, id: string, action: string, body: unknown = {}) =>
    staff(fa, tok(who), null, 'POST', `${P(t)}/guest-requests/${id}/actions/${action}`, {
      json: body,
    });
  const notified = (kind: string, refId: string) =>
    q<{ username: string }>(
      `SELECT u.username FROM staff_notification n JOIN app_user u ON u.id = n.user_id
        WHERE n.kind = $1 AND n.ref_id = $2 ORDER BY u.username`,
      [kind, refId],
    ).then((rows) => rows.map((r) => r.username.split('.')[1]));

  it('setup: in-house short stay 202, confirmed stay 203 (arrives 20/10), in-house long stay 301', async () => {
    await at('2026-10-15T09:00:00+07:00');
    const a = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: '202',
      departure: '2026-10-17',
    });
    await setStayStatus(db, t, a.reservationId, 'in_house', {
      actualCheckinAt: new Date('2026-10-15T08:00:00+07:00'),
    });
    const b = await seedStay(db, t, ids, {
      roomNo: '203',
      arrival: '2026-10-20',
      departure: '2026-10-22',
    });
    const c = await seedStay(db, t, ids, {
      status: 'in_house',
      roomNo: '301',
      stayType: 'long',
      departure: '2026-12-15',
    });
    // P-S4-10: no profile language → the browser decides (none → en), so the VI sessions say vi-VN.
    stays.a = { ...a, sid: await sessionOf(a.reservationId, 'vi-VN,vi;q=0.9') };
    stays.b = { ...b, sid: await sessionOf(b.reservationId, 'en-GB,en;q=0.9') };
    stays.c = { ...c, sid: await sessionOf(c.reservationId, 'vi-VN') };
  });

  it('US-108: room NAME not number (BR-012), map pin from the parameter (INV pin), Wi-Fi from the arrival day', async () => {
    const a = await guest(fa, stays.a!.sid, 'GET', '/v1/guest/stay');
    expect(a.statusCode, a.body).toBe(200);
    expect(a.json()).not.toHaveProperty('roomNo');
    expect(a.json()).toMatchObject({
      roomName: 'The Valley',
      publicRoomType: 'Standard Studio',
      property: { mapUrl: 'https://maps.app.goo.gl/oYos42G5YvUEcDCc6', phone: HOTLINE },
      wifi: { ssid: 'OTTIMO-Guest', password: 'fake-wifi-pass' },
    });
    const b = await guest(fa, stays.b!.sid, 'GET', '/v1/guest/stay');
    expect(b.json()).toMatchObject({ roomName: 'The Sage', wifi: null });
    // Room not told to the guest yet (BR-012 (4)) → only the public room type.
    await q('UPDATE reservation SET room_disclosed_to_guest = false WHERE id = $1', [
      stays.b!.reservationId,
    ]);
    const hidden = await guest(fa, stays.b!.sid, 'GET', '/v1/guest/stay');
    expect(hidden.json()).toMatchObject({ roomName: null, publicRoomType: 'Standard Studio' });
    await q('UPDATE reservation SET room_disclosed_to_guest = true WHERE id = $1', [
      stays.b!.reservationId,
    ]);
    // OWN changes the pin in Tham số: hosts outside SEC E14-08 are refused.
    const bad = await staff(fa, tok('own'), null, 'PUT', `${P(t)}/parameters/property_map_url`, {
      json: {
        value: 'https://evil.example/maps',
        effectiveFrom: '2026-10-15',
        reason: 'Thử link khác',
      },
    });
    expect(bad.statusCode, bad.body).toBe(422);
    expect(bad.json().errors).toEqual([{ field: 'value', code: 'NOT_IN_LIST' }]);
    const good = await staff(fa, tok('own'), null, 'PUT', `${P(t)}/parameters/property_map_url`, {
      json: {
        value: 'https://www.google.com/maps/place/OTTIMO',
        effectiveFrom: '2026-10-15',
        reason: 'Ghim mới',
      },
    });
    expect(good.statusCode, good.body).toBe(200);
    const after = await guest(fa, stays.a!.sid, 'GET', '/v1/guest/stay');
    expect(after.json().property.mapUrl).toBe('https://www.google.com/maps/place/OTTIMO');
  });

  it('US-109 options: HK/MT types only in house; extra cleaning free for a short stay, charged for a long stay', async () => {
    const a = await options(stays.a!.sid);
    expect(Object.values(a).every((o) => o.available)).toBe(true);
    expect(a.extra_cleaning).toMatchObject({ feeVnd: null, feeReason: null, noteRequired: false });
    expect(a.report_issue).toMatchObject({ noteRequired: true });
    const b = await options(stays.b!.sid);
    for (const type of ['extra_cleaning', 'amenities', 'report_issue']) {
      expect(b[type], type).toMatchObject({ available: false, unavailableReason: 'not_in_house' });
    }
    for (const type of ['transport_tour', 'late_checkout', 'other']) {
      expect(b[type], type).toMatchObject({ available: true, unavailableReason: null });
    }
    const c = await options(stays.c!.sid);
    expect(c.extra_cleaning).toMatchObject({
      available: true,
      feeVnd: 100_000,
      feeReason: 'long_stay_adhoc',
    });
  });

  it("BR-506 short stay: after today's full clean (10:00) a second clean costs the fee", async () => {
    await at('2026-10-15T09:00:00+07:00');
    // BR-506-03 (v0.3.8, DOM-S4-09): a priority clean preparing the room at check-in is NOT a full clean.
    await q(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date, source,
         done_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'priority_clean', 'done', '2026-10-15', 'system', $6, $6, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        ids.rooms['202'],
        stays.a!.reservationId,
        new Date('2026-10-15T08:40:00+07:00'),
      ],
    );
    expect((await options(stays.a!.sid)).extra_cleaning).toMatchObject({
      available: true,
      feeVnd: null,
    });
    await at('2026-10-15T11:00:00+07:00');
    await q(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date, source,
         done_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'stayover_clean', 'done', '2026-10-15', 'system', $6, $6, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        ids.rooms['202'],
        stays.a!.reservationId,
        new Date('2026-10-15T10:00:00+07:00'),
      ],
    );
    expect((await options(stays.a!.sid)).extra_cleaning).toMatchObject({
      available: true,
      feeVnd: 100_000,
      feeReason: 'second_full_clean',
      lastFullCleanTime: '10:00',
    });
  });

  it('createGuestRequest validation (EP14 3.2; B-14, B-16; V-09)', async () => {
    const sid = stays.a!.sid;
    const cases: Array<[unknown, string, string]> = [
      [{}, 'type', 'REQUIRED'],
      [{ type: 'spa' }, 'type', 'NOT_IN_LIST'],
      [{ type: 'report_issue' }, 'note', 'REQUIRED'],
      [{ type: 'report_issue', note: 'ok' }, 'note', 'REQUIRED'],
      [{ type: 'other', note: 'x'.repeat(501) }, 'note', 'TOO_LONG'],
      [{ type: 'extra_cleaning' }, 'feeAccepted', 'FEE_NOT_ACCEPTED'],
      [{ type: 'extra_cleaning', feeAccepted: 'yes' }, 'feeAccepted', 'FEE_NOT_ACCEPTED'],
    ];
    for (const [body, field, code] of cases) {
      const r = await create(sid, body);
      expect(r.statusCode, JSON.stringify(body)).toBe(422);
      expect(r.json().errors, JSON.stringify(body)).toEqual([{ field, code }]);
    }
    const card = await create(sid, { type: 'other', note: 'Thẻ 4111 1111 1111 1111 trả giúp' });
    expect(card.statusCode).toBe(422);
    expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
    const early = await create(stays.b!.sid, { type: 'amenities' });
    expect(early.statusCode).toBe(422);
    expect(early.json()).toMatchObject({
      errors: [{ field: 'type', code: 'REQUEST_TYPE_NOT_AVAILABLE' }],
      unavailableReason: 'not_in_house',
    });
    expect(await q('SELECT 1 FROM guest_request')).toEqual([]);
  });

  let issue: string;
  let towels: string;
  let pickup: string;
  let paid: string;

  it('US-109/110: report at 21:59 → maintenance, due 22:09, MT + desk notified; HK task for towels; FD request at 22:00 auto-answered, due 07:10', async () => {
    await at('2026-10-15T21:59:00+07:00');
    const r = await create(stays.a!.sid, { type: 'report_issue', note: 'Không có nước nóng' });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json()).toMatchObject({
      type: 'report_issue',
      note: 'Không có nước nóng',
      status: 'new',
      statusLabel: 'Đã gửi',
      feeVnd: null,
      createdAt: '2026-10-15T21:59:00.000+07:00',
    });
    expect(r.json()).not.toHaveProperty('autoReply');
    issue = r.json().id;
    expect(work.workOrders).toEqual([
      expect.objectContaining({
        guestRequestId: issue,
        roomId: ids.rooms['202'],
        description: 'Không có nước nóng',
      }),
    ]);
    expect(await notified('guest_request_new', issue)).toEqual(['fd', 'fdl', 'mt']);
    const t2 = await create(stays.a!.sid, { type: 'amenities', note: 'Thêm 2 khăn tắm' });
    expect(t2.statusCode, t2.body).toBe(201);
    towels = t2.json().id;
    expect(work.tasks).toEqual([
      expect.objectContaining({
        guestRequestId: towels,
        note: 'Thêm 2 khăn tắm',
        dueDate: '2026-10-15',
      }),
    ]);
    expect(await notified('guest_request_new', towels)).toEqual(['fd', 'fdl', 'hk']);
    await at('2026-10-15T22:00:00+07:00');
    const late = await create(stays.b!.sid, {
      type: 'transport_tour',
      note: 'Đón sân bay Liên Khương 20/10 14:00',
    });
    expect(late.statusCode, late.body).toBe(201);
    expect(late.json()).toMatchObject({
      statusLabel: 'Sent', // session in English (Accept-Language)
      autoReply: `We received your request at 22:00. Our front desk will take care of it from 07:00. If it is urgent, please call ${HOTLINE}.`,
    });
    pickup = late.json().id;
    const row = (
      await q<{ auto_replied_at: Date | null; ack_due_at: Date; routed_to: string }>(
        'SELECT auto_replied_at, ack_due_at, routed_to FROM guest_request WHERE id = $1',
        [pickup],
      )
    )[0]!;
    expect(row).toEqual({
      auto_replied_at: new Date('2026-10-15T22:00:00+07:00'),
      ack_due_at: new Date('2026-10-16T07:10:00+07:00'),
      routed_to: 'front_desk',
    });
    expect(await notified('guest_request_new', pickup)).toEqual(['fd', 'fdl']);
  });

  it('S30 lists: FD+ everything, HK/MT only what is routed to them (US-110 AC3), SAL 403; fee hidden from HK', async () => {
    const fd = await staffList('fd');
    expect(fd.statusCode, fd.body).toBe(200);
    const all = fd.json().data as Array<Record<string, unknown>>;
    expect(all.map((x) => x.id).sort()).toEqual([issue, towels, pickup].sort());
    expect(all.find((x) => x.id === issue)).toMatchObject({
      roomNo: '202',
      roomName: 'The Valley',
      routedTo: 'maintenance',
      ackDueAt: '2026-10-15T22:09:00.000+07:00',
      isAckOverdue: false,
      note: 'Không có nước nóng',
      feeVnd: null,
    });
    const hk = (await staffList('hk')).json().data as Array<Record<string, unknown>>;
    expect(hk.map((x) => x.id)).toEqual([towels]);
    expect(hk[0]).not.toHaveProperty('feeVnd');
    expect(hk[0]).toMatchObject({ note: 'Thêm 2 khăn tắm', hkTaskId: expect.any(String) });
    expect(((await staffList('mt')).json().data as Array<{ id: string }>).map((x) => x.id)).toEqual(
      [issue],
    );
    expect((await staffList('sal')).statusCode).toBe(403);
    expect((await staffList('fd', 'bogus')).statusCode).toBe(422);
  });

  it("SM-15 transitions: HK acknowledges its own, never others'; decline FD+ only with a code; replyNote SEC B-15", async () => {
    expect((await act('hk', issue, 'acknowledge')).statusCode).toBe(404);
    const ack = await act('hk', towels, 'acknowledge');
    expect(ack.statusCode, ack.body).toBe(200);
    expect(ack.json()).toMatchObject({ status: 'acknowledged' });
    expect((await act('hk', towels, 'acknowledge')).json().code).toBe('INVALID_TRANSITION');
    expect(
      (await act('hk', towels, 'decline', { declinedReasonCode: 'duplicate' })).statusCode,
    ).toBe(403);
    // HK cannot close a request a task carries (the task's done closes it).
    expect((await act('hk', towels, 'complete')).statusCode).toBe(403);
    expect((await act('fd', pickup, 'complete')).json().code).toBe('INVALID_TRANSITION'); // still new
    expect((await act('fd', pickup, 'decline')).json().errors).toEqual([
      { field: 'declinedReasonCode', code: 'REQUIRED' },
    ]);
    expect(
      (await act('fd', pickup, 'decline', { declinedReasonCode: 'other' })).json().errors,
    ).toEqual([{ field: 'replyNote', code: 'REQUIRED' }]);
    const code = await act('fd', pickup, 'decline', {
      declinedReasonCode: 'other',
      replyNote: 'Mã cửa của bạn 482913',
    });
    expect(code.json().errors).toEqual([{ field: 'replyNote', code: 'SENSITIVE_DATA_DETECTED' }]);
    const ok = await act('fd', pickup, 'decline', {
      declinedReasonCode: 'other',
      replyNote: `Xe sân bay đã kín, gọi ${HOTLINE} để đặt xe khác`,
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({ status: 'declined', declinedReasonCode: 'other' });
    const mine = await guest(fa, stays.b!.sid, 'GET', '/v1/guest/requests');
    expect(mine.headers['cache-control']).toBe('no-store');
    expect(mine.json().data).toEqual([
      expect.objectContaining({
        id: pickup,
        status: 'declined',
        statusLabel: "Can't be done",
        declinedReasonCode: 'other',
        replyNote: `Xe sân bay đã kín, gọi ${HOTLINE} để đặt xe khác`,
      }),
    ]);
    // A's list does not contain B's request (one booking per session).
    const aList = (await guest(fa, stays.a!.sid, 'GET', '/v1/guest/requests')).json()
      .data as Array<{
      id: string;
    }>;
    expect(aList.map((x) => x.id).sort()).toEqual([issue, towels].sort());
    // Decline cancels the linked HK task (BE-C port).
    const declineTowels = await act('fd', towels, 'decline', {
      declinedReasonCode: 'not_available_now',
    });
    expect(declineTowels.statusCode, declineTowels.body).toBe(200);
    expect(work.cancelled).toHaveLength(1);
  });

  it('paid extra cleaning: fee accepted → task → started/done through GuestRequestStatusPort → fee in the folio once', async () => {
    await at('2026-10-16T08:00:00+07:00');
    // 16/10 business day: the clean of 15/10 no longer counts; today's daily clean done at 07:30 → a new one is paid.
    await q(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date, source,
         done_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'stayover_clean', 'done', '2026-10-16', 'system', $6, $6, $6)`,
      [
        uuidv7(),
        t.organizationId,
        t.propertyIds[0],
        ids.rooms['202'],
        stays.a!.reservationId,
        new Date('2026-10-16T07:30:00+07:00'),
      ],
    );
    const r = await create(stays.a!.sid, { type: 'extra_cleaning', feeAccepted: true });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json()).toMatchObject({ feeVnd: 100_000, status: 'new' });
    paid = r.json().id;
    const port = fa.app.get(GuestRequestStatusPort);
    const now = new Date('2026-10-16T08:20:00+07:00');
    await db.withContext(t.ctx(), (tx) => port.onLinkedWorkStarted(tx, paid, now));
    let row = (
      await q<{ status: string; acknowledged_at: Date | null }>(
        'SELECT status, acknowledged_at FROM guest_request WHERE id = $1',
        [paid],
      )
    )[0]!;
    expect(row).toEqual({ status: 'in_progress', acknowledged_at: now });
    await db.withContext(t.ctx(), (tx) => port.onLinkedWorkDone(tx, paid, now));
    await db.withContext(t.ctx(), (tx) => port.onLinkedWorkDone(tx, paid, now)); // repeated → no-op
    row = (
      await q<{ status: string; acknowledged_at: Date | null }>(
        'SELECT status, acknowledged_at FROM guest_request WHERE id = $1',
        [paid],
      )
    )[0]!;
    expect(row.status).toBe('done');
    const lines = await q<{
      category: string;
      amount_vnd: number;
      source: string;
      charge_code: string;
    }>(
      `SELECT l.category, l.amount_vnd, l.source, l.charge_code FROM folio_line l
         JOIN reservation r ON r.folio_id = l.folio_id WHERE r.id = $1`,
      [stays.a!.reservationId],
    );
    expect(lines).toEqual([
      {
        category: 'cleaning',
        amount_vnd: 100_000,
        source: 'guest_app',
        charge_code: 'adhoc_cleaning',
      },
    ]);
    const mine = (await guest(fa, stays.a!.sid, 'GET', '/v1/guest/requests')).json().data;
    expect(mine[0]).toMatchObject({
      id: paid,
      status: 'done',
      statusLabel: 'Hoàn thành',
      feeVnd: 100_000,
    });
    // FD acknowledges then completes the maintenance request with a reply (no fee).
    expect((await act('fd', issue, 'acknowledge')).statusCode).toBe(200);
    const done = await act('fd', issue, 'complete', { replyNote: 'Đã sửa bình nóng lạnh' });
    expect(done.statusCode, done.body).toBe(200);
    expect(done.json()).toMatchObject({ status: 'done', replyNote: 'Đã sửa bình nóng lạnh' });
    const history = await q<{ to_state: string; actor_type: string }>(
      `SELECT to_state, actor_type FROM state_transition WHERE machine = 'SM-15' AND entity_id = $1
        ORDER BY occurred_at, id`,
      [issue],
    );
    expect(history.map((h) => `${h.to_state}:${h.actor_type}`)).toEqual([
      'new:guest',
      'acknowledged:user',
      'done:user',
    ]);
  });

  it('J10 guest_request.sla: a request still new after its deadline reminds the department + desk + manager once; "Cần chú ý" FD+', async () => {
    await at('2026-10-16T09:00:00+07:00');
    const r = await create(stays.c!.sid, { type: 'other', note: 'Cho mượn bàn ủi' });
    expect(r.statusCode, r.body).toBe(201);
    const id = r.json().id;
    const runner = fa.app.get(JobRunner);
    const property = {
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    };
    await at('2026-10-16T09:09:00+07:00');
    expect((await runner.runOnce(GUEST_REQUEST_SLA_JOB_KEY, property)).stats).toEqual({
      reminded: 0,
    });
    await at('2026-10-16T09:10:00+07:00');
    expect((await runner.runOnce(GUEST_REQUEST_SLA_JOB_KEY, property)).stats).toEqual({
      reminded: 1,
    });
    expect((await runner.runOnce(GUEST_REQUEST_SLA_JOB_KEY, property)).stats).toEqual({
      reminded: 0,
    });
    // BR-811-04 (v0.3.8, DOM-S4-10): the manager is the escalation step; the owner is not told.
    expect(await notified('guest_request_overdue', id)).toEqual(['fd', 'fdl', 'mgr']);
    const attn = await staff(fa, tok('fd'), null, 'GET', `${P(t)}/attention`);
    expect(attn.json().data).toContainEqual(
      expect.objectContaining({
        kind: 'guest_request_overdue',
        severity: 'warning',
        count: 1,
        roomNos: ['301'],
        params: { count: 1 },
      }),
    );
    const list = (await staffList('fd')).json().data as Array<{
      id: string;
      isAckOverdue: boolean;
    }>;
    expect(list[0]).toMatchObject({ id, isAckOverdue: true });
    expect((await act('fd', id, 'acknowledge')).statusCode).toBe(200);
    const attn2 = await staff(fa, tok('fd'), null, 'GET', `${P(t)}/attention`);
    expect(
      (attn2.json().data as Array<{ kind: string }>).some(
        (i) => i.kind === 'guest_request_overdue',
      ),
    ).toBe(false);
  });

  it('port not bound yet (default): nothing created – HK handles its request from the list (acknowledge → complete)', async () => {
    const svc = fa.app.get(GuestRequestsService) as unknown as { work: GuestRequestWork };
    svc.work = new UnwiredGuestRequestWorkPort();
    try {
      await at('2026-10-16T09:20:00+07:00');
      const r = await create(stays.c!.sid, { type: 'amenities', note: 'Thêm nước suối' });
      expect(r.statusCode, r.body).toBe(201);
      const id = r.json().id;
      const row = (await staffList('hk')).json().data.find((x: { id: string }) => x.id === id);
      expect(row).toMatchObject({
        routedTo: 'housekeeping',
        roomNo: '301',
        roomName: 'The Velvet',
      });
      expect(row).not.toHaveProperty('hkTaskId');
      expect((await act('hk', id, 'acknowledge')).statusCode).toBe(200);
      const done = await act('hk', id, 'complete');
      expect(done.statusCode, done.body).toBe(200);
      expect(done.json()).toMatchObject({ status: 'done' });
    } finally {
      svc.work = work;
    }
  });

  it('SR-RL-05: 20 requests per booking and business day → 429; after check-out every guest request route → 403', async () => {
    fa.app.get<RateLimiter>(RATE_LIMITER).resetAll();
    const sid = stays.c!.sid;
    const today = (
      await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM guest_request WHERE reservation_id = $1 AND created_at >= $2`,
        [stays.c!.reservationId, new Date('2026-10-16T06:00:00+07:00')],
      )
    )[0]!.n;
    for (let i = today; i < 20; i += 1) {
      expect((await create(sid, { type: 'late_checkout' })).statusCode).toBe(201);
    }
    const over = await create(sid, { type: 'late_checkout' });
    expect(over.statusCode).toBe(429);
    expect(over.json().code).toBe('RATE_LIMITED');
    expect(Number(over.headers['retry-after'])).toBeGreaterThan(0);
    await setStayStatus(db, t, stays.a!.reservationId, 'checked_out', {
      actualCheckoutAt: new Date('2026-10-16T09:30:00+07:00'),
    });
    for (const [method, url] of [
      ['GET', '/v1/guest/requests'],
      ['GET', '/v1/guest/request-options'],
      ['POST', '/v1/guest/requests'],
    ] as const) {
      const r = await guest(
        fa,
        stays.a!.sid,
        method,
        url,
        method === 'POST' ? { json: { type: 'other', note: 'Cảm ơn' } } : {},
      );
      expect(r.statusCode, url).toBe(403);
      expect(r.json().code, url).toBe('GUEST_STAY_ENDED');
    }
    // Idempotent replay of a guest creation answers the same request.
    const key = randomUUID();
    const once = await guest(fa, stays.b!.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'other', note: 'Gửi lại' },
      idem: key,
    });
    const twice = await guest(fa, stays.b!.sid, 'POST', '/v1/guest/requests', {
      json: { type: 'other', note: 'Gửi lại' },
      idem: key,
    });
    expect(twice.json().id).toBe(once.json().id);
  });
});
