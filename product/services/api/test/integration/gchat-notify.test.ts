/**
 * Google Chat room of the website booking requests on the real PostgreSQL (ARC gchat-booking-request-notify 5.2
 * tests 4–6 + 8.11 tests 5, 6, 6a, log canaries; SEC ESC-041 ★2/★3/★5/★6, GCHAT-02). Posts go to a LOCAL fake
 * webhook (test/helpers/fake-chat-webhook.ts) – never to Google. Fake data only (example.invalid, fake phones,
 * made-up names); canary values prove that no guest data and no webhook secret reaches a log.
 * Clock: Monday 02/11/2026 (property time Asia/Ho_Chi_Minh), desk hours 07:00–22:00 (DS-E).
 */
import { randomUUID } from 'node:crypto';
import { Client as PgClient } from 'pg';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { postChatText } from '@ottimo/integrations/notification';
import type { Database } from '../../src/db/database';
import {
  CHAT_LEASE_MS,
  CHAT_MAX_ATTEMPTS,
  CHAT_SEND_BUDGET_MS,
  CHAT_STALE_MS,
  ChatDispatcher,
  type ChatTarget,
} from '../../src/jobs/chat-dispatch';
import { JobRunner, type PropertyRef } from '../../src/jobs/job-runner';
import { type StaffChatKind, enqueueStaffChat } from '../../src/modules/events/public/staff-chat';
import { replyPlan } from '../../src/modules/public-site/internal/website-request-rules';
import type { ChatDetailLevel } from '../../src/modules/public-site/public/chat-message';
import { workerChatRenderers } from '../../src/worker-chat';
import { buildWorkerJobs } from '../../src/worker-jobs';
import { FakeChatServer } from '../helpers/fake-chat-webhook';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { staff } from '../helpers/registration-fixture';
import { seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const TZ = 'Asia/Ho_Chi_Minh';
const LANDING = 'https://ottimo.example.invalid';
const SIGNING_KEY = 'test-public-form-signing-key-0123456789abcdef';
const OLD_NOTICE = '2026-10-24';
const CHAT_NOTICE = '2026-10-31';
const WEBHOOK =
  'https://chat.googleapis.com/v1/spaces/AAAAfake01/messages?key=fakeKeyCanary&token=fakeTokenCanary';
// Canaries (ARC 8.5: no log, at any level, ever carries them).
const NAME = 'Canary Tran Thi Mau';
const PHONE = '84900000017';
const EMAIL = 'canary.guest@example.invalid';
const NOTE = 'Canary lời nhắn: có chỗ đậu xe máy không ạ';
const CANARIES = [
  NAME,
  PHONE,
  EMAIL,
  'Canary lời nhắn',
  'fakeKeyCanary',
  'fakeTokenCanary',
  'chat.googleapis',
  'key=',
  'token=',
];

const at = (local: string) => new Date(`${local}+07:00`);

describe.skipIf(!HAS_DB)('Google Chat – booking requests (outbox staff.chat)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let slug: string;
  let property: PropertyRef;
  let runner: JobRunner;
  let renderers: ReturnType<typeof workerChatRenderers>;
  const server = new FakeChatServer();
  const logs: string[] = [];
  const log = (level: string, msg: string, extra: Record<string, unknown>) =>
    logs.push(JSON.stringify({ level, msg, ...extra }));
  const env = { ...process.env };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const setNow = async (d: Date) => {
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };

  const target = (level: ChatDetailLevel = 'A'): ChatTarget => ({
    mode: 'on',
    url: WEBHOOK,
    level,
    linkBase: 'https://desk.ottimo.vn',
    appEnv: 'test',
  });
  /** The real client, aimed at the fake server (the URL argument – the secret – is ignored on purpose). */
  const dispatcher = (tg: ChatTarget, opts: { elapsed?: () => number } = {}) =>
    new ChatDispatcher(
      db,
      fa.clock,
      tg,
      renderers,
      (_url, text, o) => postChatText(server.url, text, o),
      log,
      opts,
    );

  async function chatRows(refId: string) {
    return q<{
      id: string;
      kind: string;
      payload: Record<string, unknown>;
      status: string;
      attempts: number;
      last_error: string | null;
      dispatched_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, payload->>'kind' AS kind, payload, status, attempts, last_error, dispatched_at, created_at
         FROM outbox_message WHERE topic = 'staff.chat' AND payload->>'refId' = $1 ORDER BY created_at, id`,
      [refId],
    );
  }
  const kinds = async (refId: string) => (await chatRows(refId)).map((r) => r.kind).sort();
  /** Close every open staff.chat row of this property (each test starts from an empty queue). */
  const clearQueue = () =>
    q(`UPDATE outbox_message SET status = 'done', last_error = 'TEST_CLEARED', next_attempt_at = NULL
        WHERE topic = 'staff.chat' AND status <> 'done' AND status <> 'dead'`);

  /** A request row as PublicBookingService.store writes it (reply_by from the real replyPlan). */
  async function insertRequest(o: {
    createdAt: Date;
    arrival: string;
    departure?: string | null;
    channel?: string;
    consent?: string;
    flags?: string[];
    stayKind?: 'short' | 'long';
    months?: number | null;
    email?: boolean;
  }): Promise<{ id: string; refCode: string; replyBy: Date }> {
    const channel = o.channel ?? 'zalo';
    const plan = replyPlan(
      o.createdAt,
      TZ,
      o.arrival,
      // business date (rollover 06:00)
      new Date(o.createdAt.getTime() - 6 * 3_600_000).toLocaleDateString('sv-SE', { timeZone: TZ }),
      channel,
      {
        hours: { from: '07:00', to: '22:00' },
        responseMinutes: 15,
        sameDayAfterHoursMinutes: 30,
        promiseMinutes: 60,
        promiseNextMorningBy: '09:00',
        promiseCallNowMinutes: 60,
      },
    );
    const id = uuidv7();
    const refCode = Array.from(
      { length: 8 },
      () => '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Math.floor(Math.random() * 32)],
    ).join('');
    const email = channel === 'email' || o.email;
    await q(
      `INSERT INTO website_booking_request (id, organization_id, property_id, ref_code, status, arrival_date,
         departure_date, stay_kind, stay_months, adults, children, infants, locale, preferred_channel, guest_name,
         phone_e164, email, note, contact_hmac, consent_version, consent_at, suspicious_flags, reply_by,
         last_activity_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, $8, 2, 1, 0, 'vi', $9, $10, $11, $12, $13, $14, $15, $16,
         $17::text[], $18, $16, $16, $16)`,
      [
        id,
        t.organizationId,
        t.propertyIds[0],
        refCode,
        o.arrival,
        o.departure === undefined ? '2026-11-12' : o.departure,
        o.stayKind ?? 'short',
        o.months ?? null,
        channel,
        NAME,
        email ? null : PHONE,
        email ? EMAIL : null,
        NOTE,
        `hmac-${id}`,
        o.consent ?? OLD_NOTICE,
        o.createdAt,
        o.flags ?? [],
        plan.replyBy,
      ],
    );
    return { id, refCode, replyBy: plan.replyBy };
  }
  const enqueue = (kind: StaffChatKind, refId: string, now: Date) =>
    db.withContext(t.ctx(), (tx) =>
      enqueueStaffChat(tx, { kind, refType: 'website_booking_request', refId, now }),
    );
  const sla = async (local: string) => {
    await setNow(at(local));
    return runner.runOnce('web_request.sla', property);
  };

  async function publishNotice(version: string, publishedAt: string) {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      for (const locale of ['vi', 'en']) {
        await pg.query(
          `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            t.organizationId,
            version,
            locale,
            'b'.repeat(64),
            locale === 'vi' ? '/vi/privacy/' : '/privacy/',
            publishedAt,
          ],
        );
      }
      await pg.query('COMMIT');
    } finally {
      await pg.end();
    }
  }

  beforeAll(async () => {
    process.env.LANDING_BASE_URL = `${LANDING}/`;
    process.env.PUBLIC_FORM_SIGNING_KEY = SIGNING_KEY;
    db = appDatabase(10);
    t = await createTenant(db, {
      users: { own: ['owner'], mgr: ['manager'], fdl: ['front_desk_lead'], fd: ['front_desk'] },
    });
    await seedBooking(db, t);
    slug = `gc-${randomUUID().slice(0, 8)}`;
    await q(`UPDATE property SET code = $2 WHERE id = $1`, [t.propertyIds[0], slug.toUpperCase()]);
    fa = await startFeatureApp(db);
    await setNow(at('2026-11-02T09:00:00'));
    await publishNotice(OLD_NOTICE, '2026-10-24T00:00:00Z');
    const on = await staff(
      fa,
      t.users.own!.sessionToken,
      null,
      'PUT',
      `${P(t)}/parameters/public_booking_requests_enabled`,
      {
        json: { value: true, effectiveFrom: '2026-11-02', reason: 'Bật form thử (test Chat)' },
      },
    );
    expect(on.statusCode, on.body).toBe(200);
    property = { propertyId: t.propertyIds[0]!, organizationId: t.organizationId, timezone: TZ };
    const w = buildWorkerJobs({ clock: fa.clock, database: db, env: process.env });
    runner = new JobRunner(db, fa.clock, w.registry, w.parameters);
    renderers = workerChatRenderers({ parameters: w.parameters });
    await server.start();
  });
  afterAll(async () => {
    for (const k of ['LANDING_BASE_URL', 'PUBLIC_FORM_SIGNING_KEY'] as const) {
      if (env[k] === undefined) delete process.env[k];
      else process.env[k] = env[k];
    }
    await server.stop();
    await fa?.close();
    await db?.close();
  });
  beforeEach(() => {
    server.requests.length = 0;
    server.script = [];
    server.fallback = 200;
  });

  // ───────────────────────── test 4 – the form writes one row (ids only) ─────────────────────────

  describe('form → outbox (test 4)', () => {
    let ipSeq = 10;
    const net = `10.${Math.floor(Math.random() * 250)}`;
    const nextIp = () => `${net}.${Math.floor(ipSeq / 250)}.${(ipSeq += 1) % 250}`;
    const submit = (body: Record<string, unknown>, key = randomUUID()) =>
      fa.app.inject({
        method: 'POST',
        url: `/v1/public/properties/${slug}/booking-requests`,
        headers: { 'content-type': 'application/json', 'idempotency-key': key, origin: LANDING },
        payload: JSON.stringify(body),
        remoteAddress: nextIp(),
      });
    const freshToken = async () => {
      const r = await fa.app.inject({
        method: 'GET',
        url: `/v1/public/properties/${slug}/form-token`,
      });
      expect(r.statusCode, r.body).toBe(200);
      fa.clock.set(new Date(fa.clock.now().getTime() + 5_000));
      return r.json().token as string;
    };
    let n = 0;
    const form = (token: string, extra: Record<string, unknown> = {}) => ({
      formToken: token,
      stayType: 'short',
      arrival: '2026-11-06',
      departure: '2026-11-09',
      adults: 2,
      children: 1,
      infants: 0,
      guestName: NAME,
      phone: `0900 000 0${String(10 + (n += 1)).slice(-2)}`,
      preferredChannel: 'zalo',
      note: NOTE,
      locale: 'vi',
      consent: true,
      consentVersion: OLD_NOTICE,
      landingPath: '/',
      ...extra,
    });
    const allChat = async () =>
      Number(
        (
          await q<{ n: number }>(
            `SELECT count(*)::int AS n FROM outbox_message WHERE topic = 'staff.chat'`,
          )
        )[0]!.n,
      );

    it('a new request → exactly one staff.chat row, payload = kind/refType/refId, created at the business clock', async () => {
      await setNow(at('2026-11-02T09:00:00'));
      const key = randomUUID();
      const body = form(await freshToken());
      const r = await submit(body, key);
      expect(r.statusCode, r.body).toBe(202);
      const [row] = await q<{ id: string }>(
        `SELECT id FROM website_booking_request WHERE ref_code = $1`,
        [r.json().refCode],
      );
      const rows = await chatRows(row!.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.payload).toEqual({
        kind: 'web_request_new',
        refType: 'website_booking_request',
        refId: row!.id,
      });
      expect(rows[0]).toMatchObject({ status: 'pending', attempts: 0 });
      expect(rows[0]!.created_at.getTime()).toBe(fa.clock.now().getTime());
      // Replay of the same Idempotency-Key: same answer, still one row.
      const again = await submit(body, key);
      expect(again.json().refCode).toBe(r.json().refCode);
      expect(await chatRows(row!.id)).toHaveLength(1);
    });

    it('honeypot, 422 → no row', async () => {
      const before = await allChat();
      const hp = await submit(form(await freshToken(), { website: 'http://spam.example.invalid' }));
      expect(hp.statusCode).toBe(202);
      const bad = await submit(form(await freshToken(), { consent: false }));
      expect(bad.statusCode).toBe(422);
      expect(await allChat()).toBe(before);
    });
  });

  // ───────────────────────── test 6 – dispatcher ─────────────────────────

  describe('ChatDispatcher (test 6)', () => {
    beforeEach(async () => {
      await clearQueue();
    });

    it('200 → done + dispatched_at; template A by default; threadKey = request id; nothing of the guest in the text', async () => {
      await setNow(at('2026-11-02T10:00:00'));
      const r = await insertRequest({
        createdAt: at('2026-11-02T10:00:00'),
        arrival: '2026-11-06',
        departure: '2026-11-09',
      });
      await enqueue('web_request_new', r.id, fa.clock.now());
      const st = await dispatcher(target('A')).runForProperty(property);
      expect(st).toMatchObject({ sent: 1, done: 1, retry: 0, dead: 0, skipped: 0, levelCapped: 0 });
      const [row] = await chatRows(r.id);
      expect(row).toMatchObject({ status: 'done', attempts: 1, last_error: null });
      expect(row!.dispatched_at).not.toBeNull();
      expect(server.requests).toHaveLength(1);
      const sent = server.requests[0]!;
      expect(sent.query.threadKey).toBe(r.id);
      expect(sent.query.messageReplyOption).toBe('REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD');
      expect(sent.text.split('\n')).toEqual([
        `[test] Yêu cầu đặt phòng mới · ${r.refCode}`,
        'Nhận lúc 10:00 · hạn phản hồi 10:15',
        `Mở Desk: https://desk.ottimo.vn/website-requests/${r.id}`,
      ]);
      for (const c of [NAME, PHONE, NOTE, '06/11', 'người lớn']) expect(sent.text).not.toContain(c);
    });

    it('500 then 200 → failed (back-off 1 min) then done, attempts 2', async () => {
      await setNow(at('2026-11-02T10:10:00'));
      const r = await insertRequest({ createdAt: fa.clock.now(), arrival: '2026-11-06' });
      await enqueue('web_request_new', r.id, fa.clock.now());
      server.script = [500];
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({
        retry: 1,
        done: 0,
      });
      let [row] = await chatRows(r.id);
      expect(row).toMatchObject({ status: 'failed', attempts: 1, last_error: 'HTTP_500' });
      // Not due yet.
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({
        done: 0,
        retry: 0,
      });
      await setNow(new Date(fa.clock.now().getTime() + 60_000));
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({ done: 1 });
      [row] = await chatRows(r.id);
      expect(row).toMatchObject({ status: 'done', attempts: 2, last_error: null });
    });

    it('404 → dead at once (webhook deleted), logged as error with the code only', async () => {
      await setNow(at('2026-11-02T10:20:00'));
      const r = await insertRequest({ createdAt: fa.clock.now(), arrival: '2026-11-06' });
      await enqueue('web_request_new', r.id, fa.clock.now());
      server.script = [404];
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({ dead: 1 });
      expect((await chatRows(r.id))[0]).toMatchObject({
        status: 'dead',
        attempts: 1,
        last_error: 'CHAT_REJECTED_404',
      });
      expect(logs.some((l) => l.includes('"chat dead"') && l.includes('CHAT_REJECTED_404'))).toBe(
        true,
      );
    });

    it('retryable failures: dead after the 6th attempt (back-off 1, 5, 15, 60, 180 min)', async () => {
      let now = at('2026-11-02T10:30:00');
      await setNow(now);
      const r = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      await enqueue('web_request_new', r.id, now);
      server.fallback = 503;
      for (const wait of [0, 1, 5, 15, 60, 180]) {
        now = new Date(now.getTime() + wait * 60_000);
        await setNow(now);
        await dispatcher(target()).runForProperty(property);
      }
      const [row] = await chatRows(r.id);
      expect(row).toMatchObject({
        status: 'dead',
        attempts: CHAT_MAX_ATTEMPTS,
        last_error: 'HTTP_503',
      });
      expect(server.requests).toHaveLength(6);
    });

    it('a lost lease (crash between claim and finish) is taken again after 2 minutes', async () => {
      const now = at('2026-11-02T15:00:00');
      await setNow(now);
      const r = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      await enqueue('web_request_new', r.id, now);
      await q(
        `UPDATE outbox_message SET status = 'in_flight', attempts = 1, next_attempt_at = $2
          WHERE topic = 'staff.chat' AND payload->>'refId' = $1`,
        [r.id, new Date(now.getTime() + CHAT_LEASE_MS)],
      );
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({ done: 0 });
      await setNow(new Date(now.getTime() + CHAT_LEASE_MS));
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({ done: 1 });
      expect((await chatRows(r.id))[0]).toMatchObject({ status: 'done', attempts: 2 });
    });

    it('over the 1-minute budget → the rest is deferred (attempt given back, due now)', async () => {
      const now = at('2026-11-02T15:10:00');
      await setNow(now);
      const a = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      const b = await insertRequest({ createdAt: now, arrival: '2026-11-07' });
      await enqueue('web_request_new', a.id, now);
      await enqueue('web_request_new', b.id, new Date(now.getTime() + 1));
      let ms = 0;
      // First row posted at 0 ms, then the budget is gone.
      const st = await dispatcher(target(), {
        elapsed: () => {
          const v = ms;
          ms += CHAT_SEND_BUDGET_MS;
          return v;
        },
      }).runForProperty(property);
      expect(st).toMatchObject({ done: 1, deferred: 1 });
      expect((await chatRows(b.id))[0]).toMatchObject({ status: 'pending', attempts: 0 });
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({ done: 1 });
    });

    it('Chat off → due rows closed SKIPPED_DISABLED (no post); stale > 12 h → SKIPPED_STALE', async () => {
      const now = at('2026-11-02T16:00:00');
      await setNow(now);
      const r = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      await enqueue('web_request_new', r.id, now);
      expect(await dispatcher({ mode: 'off' }).runForProperty(property)).toMatchObject({
        skipped: 1,
      });
      expect((await chatRows(r.id))[0]).toMatchObject({
        status: 'done',
        last_error: 'SKIPPED_DISABLED',
      });
      const old = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      await enqueue('web_request_new', old.id, now);
      await setNow(new Date(now.getTime() + CHAT_STALE_MS + 60_000));
      expect(await dispatcher(target()).runForProperty(property)).toMatchObject({ skipped: 1 });
      expect((await chatRows(old.id))[0]).toMatchObject({
        status: 'done',
        last_error: 'SKIPPED_STALE',
      });
      expect(server.requests).toHaveLength(0);
    });

    it('reminder of a request claimed meanwhile → SKIPPED_HANDLED; spam → SKIPPED_GONE', async () => {
      const now = at('2026-11-02T16:30:00');
      await setNow(now);
      const claimed = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      const spam = await insertRequest({ createdAt: now, arrival: '2026-11-06' });
      await enqueue('web_request_overdue', claimed.id, now);
      await enqueue('web_request_new', spam.id, now);
      await q(
        `UPDATE website_booking_request SET status = 'in_progress', assigned_user_id = $2 WHERE id = $1`,
        [claimed.id, t.users.fd!.id],
      );
      await q(`UPDATE website_booking_request SET status = 'spam' WHERE id = $1`, [spam.id]);
      expect(await dispatcher(target('C')).runForProperty(property)).toMatchObject({ skipped: 2 });
      expect((await chatRows(claimed.id))[0]!.last_error).toBe('SKIPPED_HANDLED');
      expect((await chatRows(spam.id))[0]!.last_error).toBe('SKIPPED_GONE');
      expect(server.requests).toHaveLength(0);
    });
  });

  // ───────────────────────── 8.11 test 6 – notice gate (★2) ─────────────────────────

  describe('levels and the notice gate (★2, ★3)', () => {
    beforeEach(async () => {
      await clearQueue();
    });

    it('C configured, 2026-10-31 not published yet → template A for everyone, levelCapped counted', async () => {
      const now = at('2026-11-02T17:00:00');
      await setNow(now);
      const r = await insertRequest({ createdAt: now, arrival: '2026-11-06', consent: OLD_NOTICE });
      await enqueue('web_request_new', r.id, now);
      const st = await dispatcher(target('C')).runForProperty(property);
      expect(st).toMatchObject({ done: 1, levelCapped: 1 });
      const text = server.requests[0]!.text;
      for (const c of [NAME, PHONE, 'Canary lời nhắn', '06/11', 'người lớn', 'trẻ em', 'đêm']) {
        expect(text).not.toContain(c);
      }
    });

    it('after 2026-10-31 is published: an old-notice request stays A; a new-notice request gets C', async () => {
      await publishNotice(CHAT_NOTICE, '2026-10-31T03:00:00Z');
      const now = at('2026-11-02T17:10:00');
      await setNow(now);
      const old = await insertRequest({
        createdAt: now,
        arrival: '2026-11-06',
        consent: OLD_NOTICE,
      });
      const neu = await insertRequest({
        createdAt: now,
        arrival: '2026-11-06',
        departure: '2026-11-09',
        consent: CHAT_NOTICE,
        flags: ['contains_url'],
      });
      await enqueue('web_request_new', old.id, now);
      await enqueue('web_request_new', neu.id, new Date(now.getTime() + 1));
      const st = await dispatcher(target('C')).runForProperty(property);
      expect(st).toMatchObject({ done: 2, levelCapped: 1 });
      const [a, c] = server.requests.map((x) => x.text);
      expect(a).not.toContain(NAME);
      expect(a).not.toContain('06/11');
      expect(c!.split('\n')).toEqual([
        `[test] Yêu cầu đặt phòng mới · ${neu.refCode}`,
        'Nhận lúc 17:10 · hạn phản hồi 17:25 · cần xem kỹ',
        'Đến 06/11 – đi 09/11 · 3 đêm · Ngắn ngày',
        '2 người lớn, 1 trẻ em',
        `Khách: ${NAME}`,
        `Liên hệ: +${PHONE} · kênh: Zalo`,
        'Lời nhắn (có link – không bấm, xem trên Desk):',
        '```',
        NOTE,
        '```',
        `Mở Desk: https://desk.ottimo.vn/website-requests/${neu.id}`,
      ]);
    });

    it('level read at send time: C lowered to A → a row still waiting goes out as A', async () => {
      const now = at('2026-11-02T17:20:00');
      await setNow(now);
      const r = await insertRequest({
        createdAt: now,
        arrival: '2026-11-06',
        consent: CHAT_NOTICE,
      });
      await enqueue('web_request_new', r.id, now);
      await dispatcher(target('A')).runForProperty(property);
      expect(server.requests[0]!.text).not.toContain(NAME);
      expect(server.requests[0]!.text.split('\n')).toHaveLength(3);
    });

    it('B: trip details, no guest data', async () => {
      const now = at('2026-11-02T17:30:00');
      await setNow(now);
      const r = await insertRequest({
        createdAt: now,
        arrival: '2026-12-01',
        departure: null,
        stayKind: 'long',
        months: 3,
        consent: CHAT_NOTICE,
      });
      await enqueue('web_request_new', r.id, now);
      await dispatcher(target('B')).runForProperty(property);
      const text = server.requests[0]!.text;
      expect(text).toContain('Đến 01/12 · 3 tháng · Theo tháng');
      for (const c of [NAME, PHONE, 'Canary lời nhắn', 'Zalo']) expect(text).not.toContain(c);
    });
  });

  // ───────────────────────── 8.11 test 5 – web_request.sla: overdue + 07:30 ─────────────────────────

  describe('web_request.sla → web_request_overdue / web_request_morning (test 5)', () => {
    it('in hours: overdue at minute 30, once', async () => {
      const r = await insertRequest({
        createdAt: at('2026-11-03T10:00:00'),
        arrival: '2026-11-10',
      });
      await sla('2026-11-03T10:29:00');
      expect(await kinds(r.id)).toEqual([]);
      await sla('2026-11-03T10:30:00');
      expect(await kinds(r.id)).toEqual(['web_request_overdue']);
      await sla('2026-11-03T10:31:00');
      expect(await kinds(r.id)).toEqual(['web_request_overdue']);
    });

    it('night: call-now at 23:00 → overdue 23:45; zalo → overdue 07:30 and no morning; phone → morning 07:30 + overdue 08:30; 21:30 phone → no morning, overdue 08:30', async () => {
      const callNow = await insertRequest({
        createdAt: at('2026-11-03T23:00:00'),
        arrival: '2026-11-03',
        departure: '2026-11-04',
      });
      const zalo = await insertRequest({
        createdAt: at('2026-11-03T23:10:00'),
        arrival: '2026-11-10',
      });
      const phone = await insertRequest({
        createdAt: at('2026-11-03T23:20:00'),
        arrival: '2026-11-10',
        channel: 'phone',
      });
      const late = await insertRequest({
        createdAt: at('2026-11-03T21:30:00'),
        arrival: '2026-11-10',
        channel: 'phone',
      });
      const claimed = await insertRequest({
        createdAt: at('2026-11-03T23:30:00'),
        arrival: '2026-11-10',
        channel: 'phone',
      });
      await q(
        `UPDATE website_booking_request SET status = 'in_progress', assigned_user_id = $2 WHERE id = $1`,
        [claimed.id, t.users.fd!.id],
      );
      await sla('2026-11-03T23:44:00');
      expect(await kinds(callNow.id)).toEqual([]);
      await sla('2026-11-03T23:45:00');
      expect(await kinds(callNow.id)).toEqual(['web_request_overdue']);
      await sla('2026-11-04T06:59:00');
      expect(await kinds(zalo.id)).toEqual([]);
      expect(await kinds(phone.id)).toEqual([]);
      await sla('2026-11-04T07:30:00');
      expect(await kinds(zalo.id)).toEqual(['web_request_overdue']);
      expect(await kinds(phone.id)).toEqual(['web_request_morning']);
      expect(await kinds(late.id)).toEqual([]);
      expect(await kinds(claimed.id)).toEqual([]);
      // call-now still open: its morning nudge too (overdue was at night, before 07:00).
      expect(await kinds(callNow.id)).toEqual(['web_request_morning', 'web_request_overdue']);
      await sla('2026-11-04T07:31:00');
      await sla('2026-11-04T08:30:00');
      expect(await kinds(phone.id)).toEqual(['web_request_morning', 'web_request_overdue']);
      expect(await kinds(late.id)).toEqual(['web_request_overdue']);
      expect(await kinds(zalo.id)).toEqual(['web_request_overdue']);
      expect(await kinds(claimed.id)).toEqual([]);
    });

    it("worker back at 10:00 still nudges last night's request; after 22:00 no morning nudge", async () => {
      // Call-now request at 05:00 (business date still 03/11): overdue at 05:45 at night; the worker then stops
      // before 07:30 and comes back at 10:00 – the morning nudge still goes out.
      const missed = await insertRequest({
        createdAt: at('2026-11-04T05:00:00'),
        arrival: '2026-11-03',
        departure: '2026-11-05',
        channel: 'phone',
      });
      await sla('2026-11-04T05:45:00');
      expect(await kinds(missed.id)).toEqual(['web_request_overdue']);
      await sla('2026-11-04T10:00:00');
      expect(await kinds(missed.id)).toEqual(['web_request_morning', 'web_request_overdue']);
      const tooLate = await insertRequest({
        createdAt: at('2026-11-04T23:50:00'),
        arrival: '2026-11-10',
        channel: 'phone',
      });
      await sla('2026-11-05T22:05:00');
      expect(await kinds(tooLate.id)).not.toContain('web_request_morning');
    });

    it('the reminders go out as template A in the thread, `<users/all>` on the overdue one only', async () => {
      await clearQueue();
      const now = at('2026-11-06T07:30:00');
      await setNow(now);
      const r = await insertRequest({
        createdAt: at('2026-11-05T23:40:00'),
        arrival: '2026-11-10',
        consent: CHAT_NOTICE,
      });
      await enqueue('web_request_morning', r.id, now);
      await enqueue('web_request_overdue', r.id, new Date(now.getTime() + 1));
      await dispatcher(target('C')).runForProperty(property);
      const [m, o] = server.requests;
      expect(m!.text.split('\n')[0]).toBe(`[test] Chưa có người nhận · ${r.refCode}`);
      expect(o!.text.split('\n')[0]).toBe(`<users/all> [test] Chưa có người nhận · ${r.refCode}`);
      for (const x of [m!, o!]) {
        expect(x.query.threadKey).toBe(r.id);
        expect(x.text).not.toContain(NAME);
        expect(x.text.split('\n')).toHaveLength(3);
      }
    });
  });

  // ───────────────────────── 8.11 test 6a – WR8 ─────────────────────────

  describe('WR8 erase (test 6a)', () => {
    const erase = async (id: string) => {
      const [v] = await q<{ version: number }>(
        `SELECT version FROM website_booking_request WHERE id = $1`,
        [id],
      );
      return staff(
        fa,
        t.users.fdl!.sessionToken,
        null,
        'POST',
        `${P(t)}/website-booking-requests/${id}/actions/erase`,
        {
          ifMatch: v!.version,
          json: { verificationMethod: 'called_back' },
        },
      );
    };

    it('first message posted → one web_request_erased row, sent although pii_purged_at is set', async () => {
      await clearQueue();
      const now = at('2026-11-06T09:00:00');
      await setNow(now);
      const r = await insertRequest({ createdAt: now, arrival: '2026-11-10' });
      await enqueue('web_request_new', r.id, now);
      await dispatcher(target('C')).runForProperty(property);
      const res = await erase(r.id);
      expect(res.statusCode, res.body).toBe(200);
      expect(await kinds(r.id)).toEqual(['web_request_erased', 'web_request_new']);
      server.requests.length = 0;
      expect(await dispatcher(target('C')).runForProperty(property)).toMatchObject({ done: 1 });
      expect(server.requests[0]!.text.split('\n')).toEqual([
        `[test] Đã xóa dữ liệu của ${r.refCode} theo yêu cầu của khách. Quản lý phòng xóa tin đầu của luồng này nếu còn.`,
        `Mở Desk: https://desk.ottimo.vn/website-requests/${r.id}`,
      ]);
      expect(server.requests[0]!.query.threadKey).toBe(r.id);
    });

    it('first message never posted (Chat off) → no erase row; a first message still waiting → SKIPPED_GONE', async () => {
      await clearQueue();
      const now = at('2026-11-06T09:10:00');
      await setNow(now);
      const off = await insertRequest({ createdAt: now, arrival: '2026-11-10' });
      await enqueue('web_request_new', off.id, now);
      await dispatcher({ mode: 'off' }).runForProperty(property);
      expect((await erase(off.id)).statusCode).toBe(200);
      expect(await kinds(off.id)).toEqual(['web_request_new']);

      const waiting = await insertRequest({ createdAt: now, arrival: '2026-11-10' });
      await enqueue('web_request_new', waiting.id, now);
      expect((await erase(waiting.id)).statusCode).toBe(200);
      await dispatcher(target('C')).runForProperty(property);
      const rows = await chatRows(waiting.id);
      expect(rows.find((x) => x.kind === 'web_request_new')!.last_error).toBe('SKIPPED_GONE');
      expect(rows.find((x) => x.kind === 'web_request_erased')!.last_error).toBe(
        'SKIPPED_NOT_POSTED',
      );
      expect(server.requests).toHaveLength(0);
    });
  });

  it('logs of the whole suite: no guest canary, no webhook URL/key/token (ARC 8.5, SEC S-1)', () => {
    expect(logs.length).toBeGreaterThan(0);
    const all = logs.join('\n');
    for (const c of CANARIES) expect(all).not.toContain(c);
  });
});
