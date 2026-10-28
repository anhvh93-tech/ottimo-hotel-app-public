/**
 * Worker entrypoint (same image as api, ADR-001/003).
 * R2 foundation: same startup checks as the api (config, DB role G4, production clock), shared Clock,
 * and a once-a-minute tick that runs the registered jobs through the exactly-once JobRunner
 * (architecture 9.1). pg-boss (retry/back-off, outbox dispatcher J18) replaces the plain tick in Sprint 3.
 */
import { createRuntime } from './bootstrap';
import { JobRunner } from './jobs/job-runner';
import { createEmailAdapter } from './jobs/email-adapter';
import { StaffEmailDispatcher } from './jobs/email-dispatch';
import { buildWorkerJobs } from './worker-jobs';

const log = (level: string, msg: string, extra: Record<string, unknown> = {}): void =>
  console.log(JSON.stringify({ level, msg, ...extra }));

/** Error fields safe to log: constructor name and a short code, never the message (SEC S-1). */
function errorTag(err: unknown): { err: string; code?: string } {
  const name = err instanceof Error ? err.name : 'error';
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^[A-Za-z0-9_.:-]{1,40}$/.test(code)
    ? { err: name, code }
    : { err: name };
}

async function main(): Promise<void> {
  const rt = await createRuntime((m) => log('info', m));
  // Every job of the worker (one list per module – worker-jobs.ts; BUG-R3-037: compared with the api's registry).
  const { registry, parameters } = buildWorkerJobs({
    clock: rt.clock,
    database: rt.database,
    env: rt.env,
  });
  const runner = new JobRunner(rt.database, rt.clock, registry, parameters);
  // Staff e-mail (INT R3, outbox `staff.email`): production = Google Workspace SMTP; a bad smtp configuration
  // (missing app password file…) throws here and the worker refuses to start.
  const email = await createEmailAdapter(rt.env, rt.config.appEnv, rt.clock);
  const emailDispatcher = email.adapter
    ? new StaffEmailDispatcher(rt.database, rt.clock, email.adapter, log)
    : null;
  if (email.smtpMode === 'app_password') {
    // SEC FB-R3-SEC-INT-EMAIL-01: the app password opens the whole mailbox (IMAP) and bypasses 2-step verification.
    log(
      'warn',
      'email app_password mode: wider-scoped credential on this server – prefer EMAIL_SMTP_MODE=relay',
      {
        ref: 'FB-R3-SEC-INT-EMAIL-01',
      },
    );
  }
  if (email.provider === 'smtp' && email.adapter) {
    // Login check only (no mail sent); a failure is logged with a code, the outbox keeps retrying.
    const h = await email.adapter.healthCheck({
      propertyId: '-',
      credentialsRef: 'env:EMAIL_SMTP',
      requestId: 'startup',
    });
    log(h.status === 'ok' ? 'info' : 'error', 'email smtp check', {
      status: h.status,
      ...(h.detail ? { code: h.detail } : {}),
    });
  }
  log('info', 'worker started', { jobs: registry.keys(), email: email.provider });

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
      if (emailDispatcher) {
        try {
          for (const p of await runner.listProperties()) {
            const st = await emailDispatcher.runForProperty(p);
            if (st.done + st.retry + st.dead + st.deferred > 0) {
              log('info', 'email dispatch', { ...st });
            }
          }
        } catch (err) {
          // SEC S-1: name + code only – a DB/library message may carry values.
          log('error', 'email dispatch failed', errorTag(err));
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
