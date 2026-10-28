/**
 * BUG-R3-037 (P1, OPS `outputs/OPS/j15-folio-close-check.md`): J15 `folio.close` was registered only in
 * FolioModule.onModuleInit – the api's JobRegistry, which never ticks (test-support `runOnce` only) – and not in
 * the worker's list, so no folio was ever closed on staging. Here: every job a Nest module registers is in the
 * worker's list (worker-jobs.ts – the list worker.ts ticks). No database: the composition is built, nothing runs
 * (the pool points at a closed port, so a query would fail loudly).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Database } from '../src/db/database';
import { createPool } from '../src/db/pool';
import { JobRegistry } from '../src/jobs/job-runner';
import { ApprovalService } from '../src/modules/approvals/public/approval.service';
import { AuditService } from '../src/modules/audit/public/audit.service';
import { folioWorkerComposition } from '../src/modules/folio/public/worker-jobs';
import { ParameterService } from '../src/modules/platform/public/parameter.service';
import { buildWorkerJobs } from '../src/worker-jobs';
import { type FeatureApp, startFeatureApp } from './helpers/feature-app';

describe('BUG-R3-037 – the worker ticks every job the api modules register', () => {
  let db: Database;
  let fa: FeatureApp;

  beforeAll(async () => {
    db = new Database(createPool('postgres://nobody:none@127.0.0.1:1/none', { max: 1 }));
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const workerKeys = () =>
    buildWorkerJobs({
      clock: fa.clock,
      database: db,
      env: { APP_ENV: 'test', BLOBSTORE_PROVIDER: 'memory' },
    }).registry.keys();

  it('every job key of the api JobRegistry (Nest modules) is in the worker list', () => {
    const api = fa.app.get(JobRegistry, { strict: false }).keys();
    // The api list is the full one (sanity: the modules did register their jobs).
    expect(api).toEqual(expect.arrayContaining(['folio.close', 'hold.expire', 'payment.expire']));
    const worker = workerKeys();
    expect(api.filter((k) => !worker.includes(k))).toEqual([]);
  });

  it('J15 folio.close is ticked by the worker, on every tick (schedule tick)', () => {
    const { registry } = buildWorkerJobs({
      clock: fa.clock,
      database: db,
      env: { APP_ENV: 'test', BLOBSTORE_PROVIDER: 'memory' },
    });
    expect(registry.get('folio.close')?.schedule).toEqual({ kind: 'tick' });
  });

  it("the worker's J15 has the hooks FolioModule's has: debt ports of the front desk, refund routing + refund decision hooks (preLock), events", () => {
    const audit = new AuditService(fa.clock, db);
    const c = folioWorkerComposition({
      clock: fa.clock,
      audit,
      parameters: new ParameterService(fa.clock, audit),
      database: db,
      env: { APP_ENV: 'test', BLOBSTORE_PROVIDER: 'memory' },
    });
    expect(c.jobs.map((j) => j.key)).toEqual(['folio.close']);
    const ports = c.hooks as unknown as Record<string, unknown>;
    for (const p of [
      'debtOnCheckoutHandler',
      'openDebtReader',
      'debtSettledHandler',
      'debtAfterReversalHandler',
    ]) {
      expect(typeof ports[p], p).toBe('function');
    }
    // Only `refund` is decided by J15 (refundsDownToCredit) – with its preLock (ARC 16.19, BUG-R2-198).
    expect(c.approvals.decisionHooks()).toEqual([{ type: 'refund', preLock: true }]);
    const approvals = c.approvals as unknown as Record<string, unknown>;
    for (const p of ['refundRouting', 'refundMaker', 'refundApprovalCheck']) {
      expect(typeof approvals[p], p).toBe('function');
    }
    // "Cần chú ý" closed_reservation_credit (BUG-R3-002 / BUG-R3-034) and the bill number need these.
    const folios = c.folios as unknown as Record<string, unknown>;
    for (const p of ['events', 'approvals', 'docNumbers']) expect(folios[p], p).toBeDefined();
    // The api's own wiring is the same: every hook the worker's J15 has, the api's has too.
    const api = fa.app.get(ApprovalService).decisionHooks();
    expect(api).toEqual(expect.arrayContaining([{ type: 'refund', preLock: true }]));
  });
});
