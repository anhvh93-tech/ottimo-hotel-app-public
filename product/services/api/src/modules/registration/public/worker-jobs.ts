/**
 * J16 `retention.purge` and J5 `registration.deadline` (BE-C, ARC s3-contract 4.1): job definitions for the api (RegistrationModule
 * registers it in JobRegistry, so the test-support job runner reaches it) and for the worker
 * (worker.ts composes plain objects – no Nest container there; BE-A adds ONE import line).
 * Tick schedule + hourly throttle inside the handler (architecture 9.1 has no hourly slot kind).
 */
import type { Clock } from '../../../clock';
import type { JobDefinition } from '../../../jobs/job-runner';
import type { AuditService } from '../../audit/public/audit.service';
import { C3AccessGate } from '../../crypto/public/c3-access-gate';
import { cryptoServiceFromEnv } from '../../crypto/public/factory';
import { blobStoreFromEnv } from '../../files/public/factory';
import { EventsService } from '../../events/public/events.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { EncryptedBlobService } from '../../files/public/encrypted-blob.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import type { Database } from '../../../db/database';
import { RegistrationDeadlineJob } from '../internal/deadline-job';
import { RegistrationService } from '../internal/registration.service';
import { RetentionService } from '../internal/retention.service';
import { wireRegistrationReservationHooks } from '../internal/reservation-hook-wiring';
import type { ReservationHooks } from '../../reservations/public/reservation-hooks';

export const J16_KEY = 'retention.purge';

export function retentionJob(retention: RetentionService): JobDefinition {
  return {
    key: J16_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      return { ...(await retention.run(tx, ctx.timezone)) };
    },
  };
}

/**
 * Worker composition (same classes as the api module). With `hooks` (the worker's shared ReservationHooks), the
 * registration listeners are wired on it by the SAME function as RegistrationModule – J1 `hold.expire` cancels holds
 * in the worker, and the registration of a cancelled booking voids itself (K11).
 */
export function registrationWorkerComposition(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  database: Database;
  env?: NodeJS.ProcessEnv;
  hooks?: ReservationHooks;
}): { jobs: JobDefinition[]; regs: RegistrationService } {
  const env = deps.env ?? process.env;
  const crypto = cryptoServiceFromEnv(env, deps.clock);
  const blobs = new EncryptedBlobService(crypto, blobStoreFromEnv(env), deps.clock, deps.database);
  const attachments = new AttachmentService(blobs, deps.clock, deps.parameters);
  const gate = new C3AccessGate(deps.database, deps.clock, deps.parameters, deps.audit);
  const regs = new RegistrationService(
    crypto,
    blobs,
    gate,
    deps.parameters,
    deps.audit,
    deps.clock,
    undefined,
    attachments,
  );
  const events = new EventsService();
  if (deps.hooks) wireRegistrationReservationHooks(deps.hooks, regs);
  return {
    jobs: [
      retentionJob(
        new RetentionService(regs, deps.parameters, deps.clock, attachments, blobs, events),
      ),
      // J5 registration.deadline (BUG-R2-035): reminders before the deadline + BR-611 digest marks.
      new RegistrationDeadlineJob(regs, deps.parameters, deps.clock, events).definition(),
    ],
    regs,
  };
}

/** Worker jobs only (no hook wiring). */
export function registrationWorkerJobs(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  database: Database;
  env?: NodeJS.ProcessEnv;
}): JobDefinition[] {
  return registrationWorkerComposition(deps).jobs;
}
