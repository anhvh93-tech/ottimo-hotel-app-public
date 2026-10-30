/**
 * Google Chat in a process that loads ONLY the worker (ARC gchat-booking-request-notify 5.2 tests 7–8, 8.11; lesson
 * of PR #14 / BUG-R3-037: what the Nest modules register does not exist in the worker). The child
 * (test/helpers/worker-only-child.ts `run-chat`) builds buildWorkerJobs + buildWorkerChat exactly like src/worker.ts,
 * runs `web_request.sla` / `public_site.cleanup`, then one dispatcher run that posts to a local fake webhook.
 * The webhook URL comes from a secret FILE (BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE) like on the server.
 * Fake data only.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client as PgClient } from 'pg';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { FakeChatServer } from '../helpers/fake-chat-webhook';
import { seedBooking } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';
import { inWorkerProcess } from '../helpers/worker-process';

const WEBHOOK =
  'https://chat.googleapis.com/v1/spaces/AAAAfake02/messages?key=fakeKeyCanary&token=fakeTokenCanary';
const NAME = 'Canary Worker Only';
const NOTICE = '2026-10-24';

type ChatRun = {
  ok: boolean;
  mode: 'on' | 'off';
  jobs: Record<string, { status: string; stats: Record<string, number> }>;
  stats: Record<string, number>;
  logs: Array<{ level: string; msg: string; extra: Record<string, unknown> }>;
  moduleFiles: string[];
};

describe.skipIf(!HAS_DB)('Google Chat in the worker-only process (tests 7–8)', () => {
  let db: Database;
  let t: TestTenant;
  let dir: string;
  const server = new FakeChatServer();

  const secretFile = (name: string, value: string) => {
    const p = join(dir, name);
    writeFileSync(p, value, { mode: 0o600 });
    return p;
  };
  const run = async (o: {
    now: string;
    jobs?: string[];
    chatEnv: Record<string, string>;
  }): Promise<ChatRun> => {
    const r = await inWorkerProcess<ChatRun>({
      cmd: 'run-chat',
      propertyId: t.propertyIds[0],
      now: new Date(o.now).toISOString(),
      jobs: o.jobs ?? [],
      chatEnv: o.chatEnv,
      fakeUrl: server.url,
    });
    expect(r.moduleFiles).toEqual([]);
    expect(r.ok).toBe(true);
    const all = JSON.stringify(r.logs);
    for (const c of [
      'fakeKeyCanary',
      'fakeTokenCanary',
      'chat.googleapis',
      'key=',
      'token=',
      NAME,
    ]) {
      expect(all).not.toContain(c);
    }
    return r;
  };
  const msg = (r: ChatRun, m: string) => r.logs.filter((l) => l.msg === m);

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'gchat-secrets-'));
    db = appDatabase(3);
    t = await createTenant(db, { users: { fdl: ['front_desk_lead'], mgr: ['manager'] } });
    await seedBooking(db, t);
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      await pg.query(
        `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
         VALUES ($1, $2, 'vi', $3, '/vi/privacy/', '2026-10-24T00:00:00Z')`,
        [t.organizationId, NOTICE, 'c'.repeat(64)],
      );
      await pg.query('COMMIT');
    } finally {
      await pg.end();
    }
    await server.start();
  }, 120_000);
  afterAll(async () => {
    await server.stop();
    await db?.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('(7) web_request.sla writes the 07:30 nudge and the dispatcher posts it – all in the worker-only process', async () => {
    const id = uuidv7();
    // Phone request at 23:20 last night: reply_by 08:15 (call window), so 07:30 is the morning nudge, not overdue.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO website_booking_request (id, organization_id, property_id, ref_code, status, arrival_date,
           departure_date, stay_kind, adults, locale, preferred_channel, guest_name, phone_e164, contact_hmac,
           consent_version, consent_at, reply_by, last_activity_at, created_at, updated_at)
         VALUES ($1, $2, $3, 'W0RK3R0N', 'new', '2026-11-20', '2026-11-22', 'short', 2, 'vi', 'phone', $4,
           '84900000018', 'hmac-w', $5, $6, $7, $6, $6, $6)`,
        [
          id,
          t.organizationId,
          t.propertyIds[0],
          NAME,
          NOTICE,
          new Date('2026-11-09T23:20:00+07:00'),
          new Date('2026-11-10T08:15:00+07:00'),
        ],
      ),
    );
    const r = await run({
      now: '2026-11-10T07:30:00+07:00',
      jobs: ['web_request.sla'],
      chatEnv: {
        BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE: secretFile('ok', `${WEBHOOK}\n`),
        BOOKING_REQUEST_CHAT_DETAIL_LEVEL: 'C',
        ADMIN_BASE_URL: 'https://desk.ottimo.vn',
      },
    });
    expect(r.mode).toBe('on');
    expect(r.jobs['web_request.sla']).toMatchObject({
      status: 'done',
      stats: { escalated: 0, morning: 1 },
    });
    expect(r.stats).toMatchObject({ sent: 1, done: 1, dead: 0 });
    expect(msg(r, 'chat: on')).toHaveLength(1);
    expect(msg(r, 'chat detail level')).toEqual([
      { level: 'info', msg: 'chat detail level', extra: { level: 'C' } },
    ]);
    expect(r.logs.filter((l) => l.level === 'error')).toEqual([]);
    const sent = server.requests.find((x) => x.text.includes('W0RK3R0N'));
    expect(sent!.text.split('\n')).toEqual([
      '[test] Chưa có người nhận · W0RK3R0N',
      'Nhận lúc 23:20 (ngoài giờ trực) · hạn phản hồi 08:15',
      `Mở Desk: https://desk.ottimo.vn/website-requests/${id}`,
    ]);
    expect(sent!.query.threadKey).toBe(id);
  }, 180_000);

  it('(8) empty secret file → chat: off; invalid URL / level → error code, Chat off, the other jobs still run', async () => {
    const empty = await run({
      now: '2026-11-10T09:00:00+07:00',
      chatEnv: { BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE: secretFile('empty', '') },
    });
    expect(empty.mode).toBe('off');
    expect(msg(empty, 'chat: off')).toEqual([
      { level: 'info', msg: 'chat: off', extra: { reason: 'NOT_CONFIGURED' } },
    ]);
    expect(msg(empty, 'chat detail level')[0]!.extra).toEqual({ level: 'A' });

    const bad = await run({
      now: '2026-11-10T09:05:00+07:00',
      jobs: ['public_site.cleanup'],
      chatEnv: {
        BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE: secretFile(
          'bad',
          'https://chat.googleapis.com.evil.test/v1/spaces/AAAA/messages?key=fakeKeyCanary&token=fakeTokenCanary',
        ),
        BOOKING_REQUEST_CHAT_DETAIL_LEVEL: 'full',
      },
    });
    expect(bad.mode).toBe('off');
    expect(bad.logs.filter((l) => l.level === 'error')).toEqual([
      { level: 'error', msg: 'chat config invalid', extra: { code: 'CHAT_DETAIL_LEVEL_INVALID' } },
      {
        level: 'error',
        msg: 'chat webhook config invalid',
        extra: { code: 'CHAT_WEBHOOK_URL_INVALID' },
      },
    ]);
    expect(msg(bad, 'chat detail level')[0]!.extra).toEqual({ level: 'A' });
    expect(bad.jobs['public_site.cleanup']).toMatchObject({ status: 'done' });
  }, 180_000);
});
