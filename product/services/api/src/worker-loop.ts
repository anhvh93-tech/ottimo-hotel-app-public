/**
 * The worker's once-a-minute tick and its crash lines (V5-42, SEC FB-R4-SEC-BE-BED-02/03/05, SEC S-1).
 * Extracted from worker.ts so a test drives the SAME loop with a job, an e-mail run and a Chat run that throw.
 *
 * Every error line of the worker carries the job (or the step) and `errorTag(err)` = class name + safe code
 * (SQLSTATE `22P02`, `ECONNREFUSED`…), never `err.message`, `err.stack`, `String(err)` or the error object: a
 * PostgreSQL, SMTP or HTTP message can quote the value that failed (a guest e-mail, a name, a token).
 */
import type { ChatDispatchStats } from './jobs/chat-dispatch';
import type { EmailDispatchStats } from './jobs/email-dispatch';
import type { JobRunResult, PropertyRef } from './jobs/job-runner';
import { errorTag, writeErrorLine } from './shared/log-line';

export type WorkerLog = (
  level: 'info' | 'warn' | 'error',
  msg: string,
  extra?: Record<string, unknown>,
) => void;

export interface WorkerTickDeps {
  /** JobRunner (runDue: every property, first error re-thrown after the others ran). */
  runner: {
    runDue(key: string): Promise<JobRunResult[]>;
    listProperties(): Promise<PropertyRef[]>;
  };
  /** Job keys in run order (registry.keys()). */
  jobKeys: readonly string[];
  /** Staff e-mail outbox; null when EMAIL_PROVIDER=off. */
  email: { runForProperty(p: PropertyRef): Promise<EmailDispatchStats> } | null;
  /** Google Chat outbox (always built; a disabled target finishes rows as SKIPPED_DISABLED). */
  chat: { runForProperty(p: PropertyRef): Promise<ChatDispatchStats> };
  log: WorkerLog;
}

/**
 * One tick: every job, then the e-mail outbox, then the Chat outbox – each in its own try/catch, so a failure in one
 * never delays the others. A tick still running when the next one is due is skipped (no overlap).
 */
export function createWorkerTick(deps: WorkerTickDeps): () => Promise<void> {
  const { runner, log } = deps;
  let running = false;
  return async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      for (const key of deps.jobKeys) {
        try {
          const results = await runner.runDue(key);
          const done = results.filter((r) => r.status === 'done').length;
          if (done > 0) log('info', 'job done', { job: key, properties: done });
        } catch (err) {
          // Name + code only (SQLSTATE kept), never `err.message` (SEC S-1, FB-R4-SEC-BE-BED-05). The failed slot
          // was rolled back and is retried next tick.
          log('error', 'job failed', { job: key, ...errorTag(err) });
        }
      }
      if (deps.email) {
        try {
          for (const p of await runner.listProperties()) {
            const st = await deps.email.runForProperty(p);
            if (st.done + st.retry + st.dead + st.deferred > 0) {
              log('info', 'email dispatch', { ...st });
            }
          }
        } catch (err) {
          log('error', 'email dispatch failed', errorTag(err));
        }
      }
      // After e-mail, in its own try/catch: a Chat problem never delays the e-mail outbox (and vice versa).
      try {
        for (const p of await runner.listProperties()) {
          const st = await deps.chat.runForProperty(p);
          if (st.done + st.retry + st.dead + st.skipped + st.deferred > 0) {
            log('info', 'chat dispatch', { ...st });
          }
        }
      } catch (err) {
        log('error', 'chat dispatch failed', errorTag(err));
      }
    } finally {
      running = false;
    }
  };
}

/**
 * Last line of a worker that crashes outside the tick (a rejected promise nobody awaited, an exception thrown from a
 * timer or an event handler). Node's own report prints the message and the stack; this one prints one JSON line on
 * stderr with the class name and code, then exits 1 as Node would (the container restarts the worker).
 */
export function installWorkerCrashLines(proc: NodeJS.Process = process): void {
  const fatal =
    (msg: string) =>
    (err: unknown): void => {
      writeErrorLine(msg, errorTag(err));
      proc.exit(1);
    };
  proc.on('uncaughtException', fatal('worker uncaught exception'));
  proc.on('unhandledRejection', fatal('worker unhandled rejection'));
}
