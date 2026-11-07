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
import { errorTag, safeCode, writeErrorLine, writeLogLine } from './shared/log-line';
import { buildWorkerChat } from './worker-chat';
import { buildWorkerJobs } from './worker-jobs';
import { createWorkerTick, installWorkerCrashLines } from './worker-loop';

const log = writeLogLine;
// Before anything can fail outside main(): a crash line is JSON with the class name and code, never the message.
installWorkerCrashLines();

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
    // `detail` comes from the adapter: logged only when it is a short code (mapSmtpError tag), never as text.
    const code = safeCode(h.detail);
    log(h.status === 'ok' ? 'info' : 'error', 'email smtp check', {
      status: h.status,
      ...(code ? { code } : h.detail ? { code: 'UNKNOWN' } : {}),
    });
  }
  // Google Chat room of the website booking requests (outbox `staff.chat`, ARC gchat-booking-request-notify): a
  // missing or invalid webhook / level / Desk link turns Chat off (logged with a code) – it never stops the worker.
  const chat = buildWorkerChat({
    database: rt.database,
    clock: rt.clock,
    env: rt.env,
    appEnv: rt.config.appEnv,
    parameters,
    log,
  });
  log('info', 'worker started', {
    jobs: registry.keys(),
    email: email.provider,
    chat: chat.config.target.mode,
  });

  // The tick (worker-loop.ts, V5-42): every job, then the e-mail and Chat outboxes; error lines = name + code only.
  const tick = createWorkerTick({
    runner,
    jobKeys: registry.keys(),
    email: emailDispatcher,
    chat: chat.dispatcher,
    log,
  });
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
  // One JSON line like every other (ARC FB-R4-ARC-BE-PR24PM-04), name + code only – never `err.message` (SEC S-1).
  writeErrorLine('worker failed', errorTag(err));
  process.exit(1);
});
