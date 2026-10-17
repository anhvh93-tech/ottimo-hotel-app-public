/**
 * DocNumberService (BR-007, erd 10, US-023), ParameterService (erd 9, 9.1a, 9.3), audit, MutableClock over
 * dev_clock and the exactly-once JobRunner (architecture 9.1) – all on the real PostgreSQL as ottimo_app.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FixedClock, MutableClock } from '../../src/clock';
import { PgClockStore } from '../../src/db/clock-store';
import type { Database } from '../../src/db/database';
import { LOG_PARTITIONS_JOB } from '../../src/jobs/builtin-jobs';
import { type JobDefinition, JobRegistry, JobRunner } from '../../src/jobs/job-runner';
import { AuditService } from '../../src/modules/audit/public/audit.service';
import { DocNumberService } from '../../src/modules/platform/public/doc-number.service';
import { ParameterService } from '../../src/modules/platform/public/parameter.service';
import { ProblemError } from '../../src/shared/problem';
import { withDevClockLock } from '../helpers/dev-clock-lock';
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

describe.skipIf(!HAS_DB)('DocNumberService (BR-007)', () => {
  let db: Database;
  let t: TestTenant;
  const clock = new FixedClock(T0);
  let docs: DocNumberService;

  beforeAll(async () => {
    db = appDatabase(12);
    t = await createTenant(db, { properties: 2 });
    const params = new ParameterService(clock, new AuditService(clock, db));
    docs = new DocNumberService(clock, params);
  });
  afterAll(async () => db.close());

  it('50 parallel allocations → 50 consecutive codes, no duplicates (K3, US-023)', async () => {
    const codes = await Promise.all(
      Array.from({ length: 50 }, () =>
        db.withContext(t.ctx(0), (tx) => docs.allocate(tx, 'reservation')),
      ),
    );
    const sorted = [...codes].sort();
    expect(new Set(codes).size).toBe(50);
    expect(sorted[0]).toBe('OTM-00001');
    expect(sorted[49]).toBe('OTM-00050');
  });

  it('a rolled-back transaction gives its number back (no gap); a cancelled record keeps its own', async () => {
    await expect(
      db.withContext(t.ctx(0), async (tx) => {
        await docs.allocate(tx, 'quote');
        throw new Error('business failure');
      }),
    ).rejects.toThrow('business failure');
    const a = await db.withContext(t.ctx(0), (tx) => docs.allocate(tx, 'quote'));
    const b = await db.withContext(t.ctx(0), (tx) => docs.allocate(tx, 'quote'));
    expect([a, b]).toEqual(['BG-00001', 'BG-00002']);
  });

  it('counters are per property; guest codes are per organisation', async () => {
    expect(await db.withContext(t.ctx(1), (tx) => docs.allocate(tx, 'reservation'))).toBe(
      'OTM-00001',
    );
    expect(await db.withContext(t.ctx(0), (tx) => docs.allocate(tx, 'guest'))).toBe('KH-0001');
    expect(await db.withContext(t.ctx(1), (tx) => docs.allocate(tx, 'guest'))).toBe('KH-0002');
  });

  it('bill numbers reset on 1 January in the property time zone (F26-… → F27-000001)', async () => {
    const c = new FixedClock(new Date('2026-12-31T16:59:00.000Z')); // 23:59 31/12 VN
    const d = new DocNumberService(c, new ParameterService(c, new AuditService(c, db)));
    expect(await db.withContext(t.ctx(0), (tx) => d.allocate(tx, 'bill'))).toBe('F26-000001');
    expect(await db.withContext(t.ctx(0), (tx) => d.allocate(tx, 'bill'))).toBe('F26-000002');
    c.set(new Date('2026-12-31T17:00:00.000Z')); // 00:00 1/1/2027 VN
    expect(await db.withContext(t.ctx(0), (tx) => d.allocate(tx, 'bill'))).toBe('F27-000001');
  });

  it('numbers grow past the padding instead of overflowing', async () => {
    await db.withContext(t.ctx(0), (tx) => docs.allocate(tx, 'work_order')); // creates the row
    await db.withContext(t.ctx(0), (tx) =>
      tx.query(`UPDATE doc_sequence SET next_value = 100000 WHERE doc_type = 'work_order'`),
    );
    expect(await db.withContext(t.ctx(0), (tx) => docs.allocate(tx, 'work_order'))).toBe(
      'WO-100000',
    );
  });
});

describe.skipIf(!HAS_DB)('ParameterService (erd 9, 9.1a, 9.3)', () => {
  let db: Database;
  let t: TestTenant;
  const clock = new FixedClock(T0);
  let params: ParameterService;

  beforeAll(async () => {
    db = appDatabase(4);
    t = await createTenant(db, { users: { owner: ['owner'] } });
    params = new ParameterService(clock, new AuditService(clock, db));
    await setParam(db, t, 'quote_validity_days', 3, '2026-10-01');
    await setParam(db, t, 'quote_validity_days', 5, '2026-11-01');
  });
  afterAll(async () => db.close());

  it('returns the value effective on the given date (snapshot rule BR-006)', async () => {
    const at = (d: string) =>
      db.withContext(t.ctx(), (tx) => params.get<number>(tx, 'quote_validity_days', d));
    expect(await at('2026-10-15')).toBe(3);
    expect(await at('2026-11-01')).toBe(5);
    await expect(at('2026-09-30')).rejects.toThrow(/no value/);
  });

  it('falls back to the catalogue default for system/security keys', async () => {
    const v = await db.withContext(t.ctx(), (tx) =>
      params.get<number>(tx, 'c3_stepup_minutes', '2026-10-15'),
    );
    expect(v).toBe(15);
  });

  const set = (
    key: string,
    value: unknown,
    roles: string[] = ['owner'],
    effectiveFrom = '2026-10-20',
  ) =>
    db.withContext({ ...t.ctx(), userId: t.users.owner!.id, actorType: 'user' }, (tx) =>
      params.set(tx, {
        key,
        value,
        effectiveFrom,
        reason: 'test change',
        actorRoles: roles,
        today: '2026-10-15',
      }),
    );
  const codeOf = async (p: Promise<unknown>) => {
    try {
      await p;
      return 'ok';
    } catch (e) {
      return e instanceof ProblemError
        ? `${e.code}:${JSON.stringify(e.options.extras ?? {})}`
        : String(e);
    }
  };

  it('security parameters: owner only, SEC hard bounds, even for the owner', async () => {
    expect(await codeOf(set('c3_stepup_minutes', 10, ['manager']))).toBe('FORBIDDEN_ACTION:{}');
    expect(await codeOf(set('c3_stepup_minutes', 16))).toBe(
      'PARAM_OUT_OF_RANGE:{"min":1,"max":15}',
    );
    expect(await codeOf(set('guest_verify_code_channels', ['zalo', 'sms']))).toMatch(
      /^PARAM_OUT_OF_RANGE/,
    );
    expect(await codeOf(set('guest_verify_code_channels', ['zalo', 'zalo']))).toMatch(
      /^PARAM_OUT_OF_RANGE/,
    );
    expect(await codeOf(set('c3_stepup_minutes', 10))).toBe('ok');
    const audit = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ category: string }>(
        `SELECT category FROM audit_event WHERE entity_id = 'c3_stepup_minutes' AND action = 'config.changed'`,
      ),
    );
    expect(audit.rows.map((r) => r.category)).toEqual(['security']);
  });

  it('business keys: erd 9.1a bounds → PARAM_OUT_OF_RANGE; wrong type → VALIDATION_FAILED', async () => {
    expect(await codeOf(set('quote_validity_days', 31))).toBe(
      'PARAM_OUT_OF_RANGE:{"min":1,"max":30}',
    );
    expect(await codeOf(set('vat_rate', 7))).toBe('PARAM_OUT_OF_RANGE:{"allowed":[0,5,8,10]}');
    expect(await codeOf(set('quote_validity_days', '3'))).toBe('VALIDATION_FAILED:{}');
    expect(await codeOf(set('vat_rate', 10, ['manager']))).toBe('FORBIDDEN_ACTION:{}'); // owner-only key
    expect(await codeOf(set('quote_validity_days', 4))).toBe('ok');
  });

  it('never rewrites a value already in effect; past dates are refused', async () => {
    expect(await codeOf(set('quote_validity_days', 4, ['owner'], '2026-10-01'))).toBe(
      'VALIDATION_FAILED:{}',
    );
    expect(await codeOf(set('quote_validity_days', 6, ['owner'], '2026-11-01'))).toBe('ok'); // future row replaced
    const v = await db.withContext(t.ctx(), (tx) =>
      params.get<number>(tx, 'quote_validity_days', '2026-11-02'),
    );
    expect(v).toBe(6);
  });
});

describe.skipIf(!HAS_DB)('MutableClock over dev_clock – shared by api and worker (ADR-008)', () => {
  let db: Database;
  beforeAll(() => {
    db = appDatabase(3);
  });
  afterAll(async () => {
    await withDevClockLock(() =>
      new PgClockStore(db.pool, process.env.DATABASE_URL as string).save(null),
    );
    await db.close();
  });

  // S4-20: dev_clock is shared with http-foundation.test.ts (other vitest worker) – serialized by the lock.
  it('a change in one process reaches the other through NOTIFY clock_changed', async () => {
    const url = process.env.DATABASE_URL as string;
    const api = new MutableClock(new PgClockStore(db.pool, url), undefined, 60_000);
    const worker = new MutableClock(new PgClockStore(db.pool, url), undefined, 60_000);
    await withDevClockLock(async () => {
      await api.start();
      await worker.start();
      try {
        await api.set(new Date('2026-10-15T15:59:00.000Z'));
        await api.freeze();
        await expect
          .poll(() => worker.now().toISOString(), { timeout: 5_000 })
          .toBe(api.now().toISOString());
        expect(worker.mode()).toBe('frozen');
        await api.reset();
        await expect.poll(() => worker.mode(), { timeout: 5_000 }).toBe('system');
      } finally {
        await api.stop();
        await worker.stop();
      }
    });
  });
});

describe.skipIf(!HAS_DB)('JobRunner – exactly once (architecture 9.1)', () => {
  let db: Database;
  let t: TestTenant;
  const clock = new FixedClock(new Date('2026-10-15T20:30:00.000Z')); // 03:30 16/10 VN
  let runner: JobRunner;
  let runs = 0;

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db);
    await setParam(db, t, 'job_catchup_minutes', 60);
    const registry = new JobRegistry();
    registry.register(LOG_PARTITIONS_JOB);
    const counting: JobDefinition = {
      key: 'test.count',
      schedule: { kind: 'daily', at: '03:00', catchUp: 'always' },
      async handler() {
        runs++;
        return { runs };
      },
    };
    registry.register(counting);
    registry.register({
      ...counting,
      key: 'test.reminder',
      schedule: { kind: 'daily', at: '01:00', catchUp: 'window' },
    });
    const params = new ParameterService(clock, new AuditService(clock, db));
    runner = new JobRunner(db, clock, registry, params);
  });
  afterAll(async () => db.close());

  const property = () => ({
    propertyId: t.propertyIds[0]!,
    organizationId: t.organizationId,
    timezone: 'Asia/Ho_Chi_Minh',
  });

  it('runs a slot once; a second (or concurrent) run is skipped_already_ran', async () => {
    const results = await Promise.all([
      runner.runOnce('test.count', property()),
      runner.runOnce('test.count', property()),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(['done', 'skipped_already_ran']);
    expect(runs).toBe(1);
    expect((await runner.runOnce('test.count', property())).status).toBe('skipped_already_ran');
  });

  it('a failing handler rolls back job_run too, so the slot runs again later', async () => {
    const registry = new JobRegistry();
    let fail = true;
    registry.register({
      key: 'test.flaky',
      schedule: { kind: 'daily', at: '03:00', catchUp: 'always' },
      async handler() {
        if (fail) throw new Error('boom');
        return {};
      },
    });
    const r = new JobRunner(
      db,
      clock,
      registry,
      new ParameterService(clock, new AuditService(clock, db)),
    );
    await expect(r.runOnce('test.flaky', property())).rejects.toThrow('boom');
    fail = false;
    expect((await r.runOnce('test.flaky', property())).status).toBe('done');
  });

  it('a reminder slot older than job_catchup_minutes is skipped, not sent late', async () => {
    expect((await runner.runOnce('test.reminder', property())).status).toBe(
      'skipped_catchup_window',
    );
    expect((await runner.runOnce('test.reminder', property())).status).toBe('skipped_already_ran');
  });

  it('log.partitions creates next month’s partitions idempotently', async () => {
    const r = await runner.runOnce('log.partitions', property());
    expect(r.status).toBe('done');
    expect(r.stats).toEqual({ partitions: ['audit_event_p202611', 'c3_access_log_p202611'] });
  });

  it('worker_list_properties feeds runDue for every property', async () => {
    const all = await runner.listProperties();
    expect(all.map((p) => p.propertyId)).toContain(t.propertyIds[0]);
  });
});
