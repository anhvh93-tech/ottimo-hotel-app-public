/**
 * INT R3 – staff e-mail dispatcher (outbox `staff.email`, SEC 06.15 / 06.33 / Q51-6) on PostgreSQL as ottimo_app
 * (RLS on). The adapter is a recording fake (the SMTP wire level is tested in integrations/notification/smtp.test.ts
 * against a local fake SMTP server). Fake data only; addresses use the reserved .test domain.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  IntegrationError,
  type NotificationAdapter,
  type NotificationMessage,
} from '@ottimo/integrations/contracts';
import type { Database } from '../../src/db/database';
import {
  EMAIL_MAX_ATTEMPTS,
  StaffEmailDispatcher,
  formatLocalTime,
} from '../../src/jobs/email-dispatch';
import type { PropertyRef } from '../../src/jobs/job-runner';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const TZ = 'Asia/Ho_Chi_Minh';

class RecordingAdapter implements NotificationAdapter {
  sent: NotificationMessage[] = [];
  /** Called before each send: return an error to throw for this message. */
  failWith: (m: NotificationMessage) => IntegrationError | null = () => null;
  async send(_ctx: unknown, m: NotificationMessage) {
    const e = this.failWith(m);
    if (e) throw e;
    this.sent.push(m);
    return { status: 'sent' as const, providerMsgId: m.idempotencyKey };
  }
  async healthCheck() {
    return { status: 'ok' as const, checkedAt: '2026-10-15T09:00:00+07:00' as never };
  }
}

describe.skipIf(!HAS_DB)('staff e-mail dispatcher (outbox staff.email)', () => {
  let db: Database;
  let t: TestTenant;
  let p: PropertyRef;
  let now: Date;
  let adapter: RecordingAdapter;
  let logs: string[];
  let d: StaffEmailDispatcher;
  const clock = { now: () => now };
  const email = (name: string) => `${name}-${t.organizationId.slice(-6)}@example.test`;

  async function setEmail(user: string, value: string | null) {
    await db.withContext(t.ctx(), (tx) =>
      tx.query('UPDATE app_user SET email = $2 WHERE id = $1', [t.users[user]!.id, value]),
    );
  }
  /** Same row shape as MfaStore.email (identity/public/mfa-store.ts). */
  async function enqueue(payload: Record<string, unknown>, topic = 'staff.email'): Promise<string> {
    const id = uuidv7();
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, t.organizationId, t.propertyIds[0], topic, JSON.stringify(payload), `test:${id}`],
      ),
    );
    return id;
  }
  async function row(id: string) {
    return db.withContext(t.ctx(), async (tx) => {
      const { rows } = await tx.query<{
        status: string;
        attempts: number;
        payload: Record<string, unknown>;
        last_error: string | null;
        next_attempt_at: Date | null;
        dispatched_at: Date | null;
      }>(
        'SELECT status, attempts, payload, last_error, next_attempt_at, dispatched_at FROM outbox_message WHERE id = $1',
        [id],
      );
      return rows[0]!;
    });
  }

  beforeAll(() => {
    db = appDatabase(5);
  });
  afterAll(async () => {
    await db.close();
  });
  beforeEach(async () => {
    t = await createTenant(db, {
      users: { fd: ['front_desk'], own1: ['owner'], own2: ['owner'], mgr: ['manager'] },
    });
    p = { propertyId: t.propertyIds[0]!, organizationId: t.organizationId, timezone: TZ };
    now = new Date(T0.getTime() + 3_600_000);
    adapter = new RecordingAdapter();
    logs = [];
    d = new StaffEmailDispatcher(db, clock, adapter, (level, msg, extra) =>
      logs.push(JSON.stringify({ level, msg, ...extra })),
    );
    await setEmail('fd', email('fd'));
    await setEmail('own1', email('own1'));
    await setEmail('own2', null); // an owner without an address is simply not e-mailed
    await setEmail('mgr', email('mgr'));
  });

  it('06.15: the person (self) + every owner with an address; manager not; done once; no address stored', async () => {
    const id = await enqueue({
      template: 'mfa_recovery_code_used',
      userIds: [t.users.fd!.id],
      owners: true,
    });
    const st = await d.runForProperty(p);
    expect(st).toEqual({ sent: 2, done: 1, retry: 0, dead: 0 });
    const byTo = Object.fromEntries(adapter.sent.map((m) => [m.to, m]));
    expect(Object.keys(byTo).sort()).toEqual([email('fd'), email('own1')].sort());
    expect(byTo[email('fd')]!.params).toMatchObject({ audience: 'self', staffName: 'fd' });
    expect(byTo[email('own1')]!.params).toMatchObject({ audience: 'owner', staffName: 'fd' });
    expect(byTo[email('fd')]!.params.occurredAt).toMatch(
      /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} \(GMT\+7\)$/,
    );
    expect(
      adapter.sent.every((m) => m.channel === 'email' && m.templateId === 'mfa_recovery_code_used'),
    ).toBe(true);
    const r = await row(id);
    expect(r.status).toBe('done');
    expect(r.attempts).toBe(1);
    expect(r.dispatched_at).not.toBeNull();
    expect(JSON.stringify(r.payload)).not.toContain('@');
    // Nothing left: a second tick sends nothing.
    expect(await d.runForProperty(p)).toEqual({ sent: 0, done: 0, retry: 0, dead: 0 });
    expect(adapter.sent).toHaveLength(2);
  });

  it('06.33 operator reset: only the person (owners=false); a locked account still gets it', async () => {
    await db.withContext(t.ctx(), (tx) =>
      tx.query(`UPDATE app_user SET status = 'locked' WHERE id = $1`, [t.users.own1!.id]),
    );
    await enqueue({
      template: 'mfa_reset_by_operator',
      userIds: [t.users.own1!.id],
      owners: false,
    });
    await d.runForProperty(p);
    expect(adapter.sent.map((m) => m.to)).toEqual([email('own1')]);
    expect(adapter.sent[0]!.params.audience).toBe('self');
  });

  it('temporary failure → failed with back-off; not before next_attempt_at; then done', async () => {
    adapter.failWith = () =>
      new IntegrationError('UNAVAILABLE', 'down', { providerMessage: 'ECONNECTION' });
    const id = await enqueue({ template: 'mfa_reset', userIds: [t.users.fd!.id], owners: false });
    expect(await d.runForProperty(p)).toMatchObject({ retry: 1, sent: 0 });
    let r = await row(id);
    expect(r).toMatchObject({ status: 'failed', attempts: 1, last_error: 'ECONNECTION' });
    expect(r.next_attempt_at!.getTime()).toBe(now.getTime() + 60_000);
    adapter.failWith = () => null;
    expect(await d.runForProperty(p)).toMatchObject({ sent: 0, done: 0 }); // too early
    now = new Date(now.getTime() + 60_000);
    expect(await d.runForProperty(p)).toMatchObject({ sent: 1, done: 1 });
    r = await row(id);
    expect(r).toMatchObject({ status: 'done', attempts: 2, last_error: null });
  });

  it('a retry never e-mails twice the recipients already served', async () => {
    adapter.failWith = (m) =>
      m.to === email('own1')
        ? new IntegrationError('AUTH', 'bad password', { providerMessage: 'EAUTH:535' })
        : null;
    const id = await enqueue({
      template: 'mfa_recovery_code_used',
      userIds: [t.users.fd!.id],
      owners: true,
    });
    await d.runForProperty(p);
    const firstRound = adapter.sent.map((m) => m.to);
    expect((await row(id)).status).toBe('failed');
    adapter.failWith = () => null;
    now = new Date(now.getTime() + 60_000);
    await d.runForProperty(p);
    const all = adapter.sent.map((m) => m.to);
    expect(all.sort()).toEqual([email('fd'), email('own1')].sort());
    expect(all.filter((x) => firstRound.includes(x))).toHaveLength(firstRound.length);
    expect((await row(id)).status).toBe('done');
  });

  it('a refused address (INVALID_REQUEST) is skipped, the others still get it; row done', async () => {
    adapter.failWith = (m) =>
      m.to === email('fd') ? new IntegrationError('INVALID_REQUEST', 'refused') : null;
    const id = await enqueue({
      template: 'mfa_recovery_code_used',
      userIds: [t.users.fd!.id],
      owners: true,
    });
    await d.runForProperty(p);
    expect(adapter.sent.map((m) => m.to)).toEqual([email('own1')]);
    const r = await row(id);
    expect(r).toMatchObject({ status: 'done', last_error: 'RECIPIENT_SKIPPED' });
  });

  it(`after ${EMAIL_MAX_ATTEMPTS} attempts the row is dead (logged as error, without addresses)`, async () => {
    adapter.failWith = () => new IntegrationError('TIMEOUT', 't');
    const id = await enqueue({ template: 'mfa_reset', userIds: [t.users.fd!.id], owners: true });
    for (let i = 0; i < EMAIL_MAX_ATTEMPTS; i++) {
      await d.runForProperty(p);
      now = new Date(now.getTime() + 4 * 3_600_000);
    }
    const r = await row(id);
    expect(r).toMatchObject({ status: 'dead', attempts: EMAIL_MAX_ATTEMPTS });
    expect(logs.some((l) => l.includes('"email dead"'))).toBe(true);
    expect(logs.join()).not.toContain('@');
    expect(await d.runForProperty(p)).toEqual({ sent: 0, done: 0, retry: 0, dead: 0 });
  });

  it('nobody with an address, or an unknown template → dead with a reason; other topics untouched', async () => {
    await setEmail('fd', null);
    const a = await enqueue({ template: 'mfa_reset', userIds: [t.users.fd!.id], owners: false });
    const b = await enqueue({ template: 'not_a_template', userIds: [t.users.fd!.id] });
    const push = await enqueue({ kind: 'x', userIds: [t.users.fd!.id] }, 'staff.push');
    await d.runForProperty(p);
    expect(await row(a)).toMatchObject({ status: 'dead', last_error: 'NO_RECIPIENT' });
    expect(await row(b)).toMatchObject({ status: 'dead', last_error: 'BAD_TEMPLATE' });
    expect(await row(push)).toMatchObject({ status: 'pending', attempts: 0 });
    expect(adapter.sent).toHaveLength(0);
  });

  it('a row left in_flight by a crashed worker is taken again after the lease', async () => {
    const id = await enqueue({ template: 'mfa_reset', userIds: [t.users.fd!.id], owners: false });
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE outbox_message SET status = 'in_flight', attempts = 1, next_attempt_at = $2 WHERE id = $1`,
        [id, new Date(now.getTime() + 5 * 60_000)],
      ),
    );
    expect(await d.runForProperty(p)).toMatchObject({ sent: 0 });
    now = new Date(now.getTime() + 5 * 60_000);
    expect(await d.runForProperty(p)).toMatchObject({ sent: 1, done: 1 });
    expect((await row(id)).attempts).toBe(2);
  });

  it('Q51-6 receiving_account_changed: owners only, effective date formatted, no account data', async () => {
    await enqueue({
      template: 'receiving_account_changed',
      userIds: [],
      owners: true,
      effectiveDate: '2026-10-25',
    });
    await d.runForProperty(p);
    expect(adapter.sent.map((m) => m.to)).toEqual([email('own1')]);
    expect(adapter.sent[0]!.params).toMatchObject({
      audience: 'owner',
      effectiveDate: '25/10/2026',
    });
  });

  it('formatLocalTime uses the property time zone', () => {
    expect(formatLocalTime(new Date('2026-10-23T07:05:00Z'), TZ)).toBe('23/10/2026 14:05 (GMT+7)');
  });
});
