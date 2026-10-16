/**
 * Worker entrypoint (same image as api, ADR-001/003).
 * R2 foundation: same startup checks as the api (config, DB role G4, production clock), shared Clock,
 * and a once-a-minute tick that runs the registered jobs through the exactly-once JobRunner
 * (architecture 9.1). pg-boss (retry/back-off, outbox dispatcher J18) replaces the plain tick in Sprint 3.
 */
import { createRuntime } from './bootstrap';
import { BUILTIN_JOBS } from './jobs/builtin-jobs';
import { JobRegistry, JobRunner } from './jobs/job-runner';
import { AuditService } from './modules/audit/public/audit.service';
import { ParameterService } from './modules/platform/public/parameter.service';

const log = (level: string, msg: string, extra: Record<string, unknown> = {}): void =>
  console.log(JSON.stringify({ level, msg, ...extra }));

async function main(): Promise<void> {
  const rt = await createRuntime((m) => log('info', m));
  const registry = new JobRegistry();
  for (const job of BUILTIN_JOBS) registry.register(job);
  const parameters = new ParameterService(rt.clock, new AuditService(rt.clock, rt.database));
  const runner = new JobRunner(rt.database, rt.clock, registry, parameters);
  log('info', 'worker started', { jobs: registry.keys() });

  let running = false;
  const tick = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      for (const key of registry.keys()) {
        try {
          const results = await runner.runDue(key);
          const done = results.filter((r) => r.status === 'done').length;
          if (done > 0) log('info', 'job done', { job: key, properties: done });
        } catch (err) {
          // Message only (no payloads); the failed slot was rolled back and is retried next tick.
          log('error', 'job failed', {
            job: key,
            err: err instanceof Error ? err.message : 'error',
          });
        }
      }
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void tick(), 60_000);
  void tick();

  const stop = async (signal: string): Promise<void> => {
    clearInterval(timer);
    await rt.shutdown();
    log('info', 'worker stopped', { signal });
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
