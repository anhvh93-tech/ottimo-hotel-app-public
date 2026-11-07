/**
 * V5-42 (plan Gói 4; SEC FB-R4-SEC-BE-BED-02/03, BED-05; SEC S-1) on PostgreSQL as ottimo_app: the worker tick
 * (worker-loop.ts, the loop src/worker.ts runs) with the real JobRunner, the real e-mail and Chat dispatchers, and
 * errors that really quote a guest value:
 * - a job whose SQL fails on a fake guest e-mail (PostgreSQL 22P02 – its message quotes the value; checked first,
 *   so the case keeps its meaning) and a job that throws a fake token → `job failed` with the job, class and SQLSTATE;
 * - the e-mail adapter refusing with an SMTP-like reply that quotes the recipient's address (not an IntegrationError –
 *   a duck-typed error carrying provider text) → the log line AND `outbox_message.last_error` hold the code only;
 * - a Chat render that fails on the same SQL → `chat render failed` with class + SQLSTATE, `last_error` RENDER_FAILED.
 * Every console line written during the tick is captured: no fake value anywhere. Fake data only (@example.test).
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { NotificationAdapter, NotificationMessage } from '@ottimo/integrations/contracts';
import { FixedClock } from '../../src/clock';
import type { Database } from '../../src/db/database';
import { ChatDispatcher } from '../../src/jobs/chat-dispatch';
import { StaffEmailDispatcher } from '../../src/jobs/email-dispatch';
import { JobRegistry, JobRunner, type PropertyRef } from '../../src/jobs/job-runner';
import { AuditService } from '../../src/modules/audit/public/audit.service';
import type { StaffChatKind } from '../../src/modules/events/public/staff-chat';
import { ParameterService } from '../../src/modules/platform/public/parameter.service';
import type { ChatRenderer } from '../../src/modules/public-site/public/chat-message';
import { logLine } from '../../src/shared/log-line';
import { createWorkerTick } from '../../src/worker-loop';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const TZ = 'Asia/Ho_Chi_Minh';
const FAKE_TOKEN = 'tok_FAKE_v542_0123456789';

describe.skipIf(!HAS_DB)(
  'V5-42 – worker error lines on PostgreSQL (no guest value, no token)',
  () => {
    let db: Database;
    let t: TestTenant;
    let p: PropertyRef;
    const clock = new FixedClock(T0);
    const guestEmail = () => `guest-${t.organizationId.slice(-6)}@example.test`;
    const staffEmail = (u: string) => `${u}-${t.organizationId.slice(-6)}@example.test`;

    beforeAll(async () => {
      db = appDatabase(5);
      t = await createTenant(db, { users: { fd: ['front_desk'], own: ['owner'] } });
      p = { propertyId: t.propertyIds[0]!, organizationId: t.organizationId, timezone: TZ };
      for (const u of ['fd', 'own']) {
        await db.withContext(t.ctx(), (tx) =>
          tx.query('UPDATE app_user SET email = $2 WHERE id = $1', [t.users[u]!.id, staffEmail(u)]),
        );
      }
    });
    afterAll(async () => {
      vi.restoreAllMocks();
      await db.close();
    });

    /** The real JobRunner, on this test's property only (other test files share the database). */
    class OnePropertyRunner extends JobRunner {
      override async listProperties(): Promise<PropertyRef[]> {
        return [p];
      }
    }

    it('job, e-mail and Chat failures quoting a guest e-mail / a token: code-only lines and last_error', async () => {
      const registry = new JobRegistry();
      // A job whose SQL fails on a guest value (as a bad cast in a real job would).
      registry.register({
        key: 'test.v542_bad_cast',
        schedule: { kind: 'tick' },
        async handler(tx) {
          await tx.query('SELECT $1::uuid', [guestEmail()]);
          return {};
        },
      });
      registry.register({
        key: 'test.v542_token',
        schedule: { kind: 'tick' },
        async handler() {
          throw new Error(`token refresh failed for ${FAKE_TOKEN}`);
        },
      });
      const runner = new OnePropertyRunner(
        db,
        clock,
        registry,
        new ParameterService(clock, new AuditService(clock, db)),
      );
      // The PostgreSQL message really quotes the value: without V5-42 it would be in the log.
      const raw = (await runner
        .runOnce('test.v542_bad_cast', p)
        .catch((e: unknown) => e)) as Error & {
        code?: string;
      };
      expect(raw.message).toContain(guestEmail());
      expect(raw.code).toBe('22P02');

      // E-mail: the adapter refuses with an SMTP-like reply that quotes the address (duck-typed, not an
      // IntegrationError): fd's address is refused for good, the owner's server is "temporarily" down.
      const adapter: NotificationAdapter = {
        async send(_ctx: unknown, m: NotificationMessage) {
          const permanent = m.to === staffEmail('fd');
          throw Object.assign(new Error(`SMTP said no for ${m.to}`), {
            name: 'IntegrationError',
            code: permanent ? 'INVALID_REQUEST' : 'UNAVAILABLE',
            retryable: !permanent,
            providerMessage: permanent
              ? `550 5.1.1 <${m.to}>: Recipient address rejected`
              : `421 4.7.0 try later ${m.to} token=${FAKE_TOKEN}`,
          });
        },
        async healthCheck() {
          return { status: 'ok' as const, checkedAt: '2026-10-15T09:00:00+07:00' as never };
        },
      };
      // Two rows (one recipient each, claimed in id order): fd's is skipped, the owner's waits for a retry.
      const skippedId = uuidv7();
      const retryId = uuidv7();
      const chatId = uuidv7();
      await db.withContext(t.ctx(), async (tx) => {
        for (const [id, user] of [
          [skippedId, 'fd'],
          [retryId, 'own'],
        ] as const) {
          await tx.query(
            `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
           VALUES ($1, $2, $3, 'staff.email', $4, $5)`,
            [
              id,
              t.organizationId,
              p.propertyId,
              JSON.stringify({
                template: 'mfa_reset',
                userIds: [t.users[user]!.id],
                owners: false,
              }),
              `test:${id}`,
            ],
          );
        }
        await tx.query(
          `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key, created_at)
         VALUES ($1, $2, $3, 'staff.chat', $4, $5, $6)`,
          [
            chatId,
            t.organizationId,
            p.propertyId,
            JSON.stringify({ kind: 'web_request_new', refType: 'web_request', refId: uuidv7() }),
            `test:${chatId}`,
            T0,
          ],
        );
      });

      const lines: string[] = [];
      const log = (level: string, msg: string, extra: Record<string, unknown> = {}) =>
        lines.push(logLine(level, msg, extra));
      // Chat: the renderer fails on the same SQL (a request row read with a bad value).
      const failingRender: ChatRenderer = async (tx) => {
        await tx.query('SELECT $1::uuid', [guestEmail()]);
        throw new Error('unreachable');
      };
      const kinds: StaffChatKind[] = [
        'web_request_new',
        'web_request_overdue',
        'web_request_morning',
        'web_request_erased',
      ];
      const post = vi.fn(async () => ({ ok: true as const, code: 'HTTP_200' }));
      const chat = new ChatDispatcher(
        db,
        clock,
        {
          mode: 'on',
          url: `https://chat.example.test/v1/spaces/x/messages?key=k&token=${FAKE_TOKEN}`,
          level: 'A',
          linkBase: 'https://desk.ottimo.vn',
          appEnv: 'test',
        },
        Object.fromEntries(kinds.map((k) => [k, failingRender])) as Record<
          StaffChatKind,
          ChatRenderer
        >,
        post,
        log,
      );

      // Everything printed during the tick (Nest Logger, a stray console call) is captured too.
      const printed: string[] = [];
      for (const m of ['log', 'error', 'warn', 'info', 'debug'] as const) {
        vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
          printed.push(a.map(String).join(' '));
        });
      }
      const tick = createWorkerTick({
        runner,
        jobKeys: registry.keys(),
        email: new StaffEmailDispatcher(db, clock, adapter, log),
        chat,
        log,
      });
      try {
        await tick();
      } finally {
        vi.restoreAllMocks();
      }

      // The whole tick, in order. pg's DatabaseError is named `error` (its protocol message type): the SQLSTATE in
      // `code` tells OPS it is a database error.
      expect(lines.map((l) => JSON.parse(l) as Record<string, unknown>)).toEqual([
        {
          level: 'error',
          msg: 'job failed',
          job: 'test.v542_bad_cast',
          err: 'error',
          code: '22P02',
        },
        { level: 'error', msg: 'job failed', job: 'test.v542_token', err: 'Error' },
        {
          level: 'warn',
          msg: 'email recipient skipped',
          outboxId: skippedId,
          template: 'mfa_reset',
          code: 'INVALID_REQUEST',
        },
        {
          level: 'warn',
          msg: 'email retry',
          outboxId: retryId,
          template: 'mfa_reset',
          attempt: 1,
          code: 'UNAVAILABLE',
        },
        { level: 'info', msg: 'email dispatch', sent: 0, done: 1, retry: 1, dead: 0, deferred: 0 },
        {
          level: 'error',
          msg: 'chat render failed',
          outboxId: chatId,
          kind: 'web_request_new',
          err: 'error',
          code: '22P02',
        },
        {
          level: 'warn',
          msg: 'chat retry',
          outboxId: chatId,
          kind: 'web_request_new',
          attempt: 1,
          code: 'RENDER_FAILED',
        },
        {
          level: 'info',
          msg: 'chat dispatch',
          sent: 0,
          done: 0,
          retry: 1,
          dead: 0,
          skipped: 0,
          deferred: 0,
          levelCapped: 0,
        },
      ]);
      expect(post).not.toHaveBeenCalled();

      // Nothing else was printed, and no line (ours or a library's) holds a fake value.
      expect(printed).toEqual([]);
      const all = [...lines, ...printed].join('\n');
      for (const leaked of [guestEmail(), staffEmail('fd'), staffEmail('own'), FAKE_TOKEN, '@']) {
        expect(all, `leaked ${leaked}`).not.toContain(leaked);
      }

      // The outbox keeps codes only (staff.email last_error was the provider text before V5-42).
      const rows = await db.withContext(t.ctx(), async (tx) => {
        const r = await tx.query<{
          id: string;
          status: string;
          last_error: string | null;
          payload: unknown;
        }>(
          `SELECT id, status, last_error, payload FROM outbox_message WHERE id = ANY($1::uuid[]) ORDER BY id`,
          [[skippedId, retryId, chatId]],
        );
        return Object.fromEntries(r.rows.map((x) => [x.id, x]));
      });
      expect(rows[skippedId]).toMatchObject({ status: 'done', last_error: 'RECIPIENT_SKIPPED' });
      expect(rows[retryId]).toMatchObject({ status: 'failed', last_error: 'UNAVAILABLE' });
      expect(rows[chatId]).toMatchObject({ status: 'failed', last_error: 'RENDER_FAILED' });
      expect(JSON.stringify(rows)).not.toContain('@');
      expect(JSON.stringify(rows)).not.toContain(FAKE_TOKEN);
    });
  },
);
