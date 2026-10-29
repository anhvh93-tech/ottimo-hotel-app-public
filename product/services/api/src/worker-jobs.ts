/**
 * The worker's job list (worker.ts – no Nest container there: plain objects, one `*WorkerJobs(...)` per module).
 * Extracted from worker.ts (BUG-R3-037) so a test can compare it with the jobs the Nest modules register in the
 * api's JobRegistry (test-support `runOnce`): a job registered only in a module's onModuleInit never ticks.
 */
// Every audit allowlist of the api modules: the worker imports no `*.module.ts` (BUG-R3-037/038, OPS j15-folio-close-check 10.2–10.3).
import './audit-entities';
import type { Clock } from './clock';
import type { Database } from './db/database';
import { BUILTIN_JOBS } from './jobs/builtin-jobs';
import { JobRegistry } from './jobs/job-runner';
import { paymentExpiryJob } from './jobs/payment-jobs';
import { AuditService } from './modules/audit/public/audit.service';
import { EventsService } from './modules/events/public/events.service';
import { folioWorkerJobs } from './modules/folio/public/worker-jobs';
import { lateFeeReviewOverdueJob } from './modules/frontdesk/public/late-fee-review-job';
import { frontdeskCancelHooksForWorker } from './modules/frontdesk/public/worker-hooks';
import {
  guestRequestPurgeJob,
  guestRequestSlaJob,
} from './modules/guest-portal/public/guest-request-jobs';
import { guestAccessPortForWorker } from './modules/guest-portal/public/worker-hooks';
import { guestsWorkerJobs } from './modules/guests/public/worker-jobs';
import { housekeepingWorkerJobs } from './modules/housekeeping/public/worker-jobs';
import { ParameterService } from './modules/platform/public/parameter.service';
import { publicSiteWorkerJobs } from './modules/public-site/public/worker-jobs';
import { registrationWorkerComposition } from './modules/registration/public/worker-jobs';
import { holdReminderJob } from './modules/reporting/public/hold-reminder-job';
import { reportingWorkerHooks } from './modules/reporting/public/worker-hooks';
import { ReservationHooks } from './modules/reservations/public/reservation-hooks';
import { reservationWorkerJobs } from './modules/reservations/public/worker-jobs';

export interface WorkerJobs {
  registry: JobRegistry;
  parameters: ParameterService;
}

export function buildWorkerJobs(deps: {
  clock: Clock;
  database: Database;
  env: NodeJS.ProcessEnv;
}): WorkerJobs {
  const registry = new JobRegistry();
  for (const job of BUILTIN_JOBS) registry.register(job);
  const audit = new AuditService(deps.clock, deps.database);
  const parameters = new ParameterService(deps.clock, audit);
  // ReservationHooks shared by the jobs that emit booking events (J1 `hold.expire` → `transitioned` cancelled), with
  // the listeners the api's modules put on theirs, wired by the SAME functions (no Nest container here): the
  // registration voids itself (K11), guest links and sessions die (B-13), no-show notices (reporting).
  const hooks = new ReservationHooks();
  const hookEvents = new EventsService();
  // J16 retention.purge (BE-C): hourly safety net of image/attachment deletion (SEC C5, C6); J5 registration.deadline.
  const registration = registrationWorkerComposition({
    clock: deps.clock,
    audit,
    parameters,
    database: deps.database,
    env: deps.env,
    hooks,
  });
  frontdeskCancelHooksForWorker({
    hooks,
    events: hookEvents,
    guestAccess: guestAccessPortForWorker({
      regs: registration.regs,
      parameters,
      audit,
      clock: deps.clock,
      events: hookEvents,
    }),
  });
  reportingWorkerHooks({ hooks, events: hookEvents, clock: deps.clock });
  // Business jobs (J1 hold expiry, O2 block activation – reservations module, Sprint 2).
  for (const job of reservationWorkerJobs({ clock: deps.clock, audit, parameters, hooks }))
    registry.register(job);
  for (const job of registration.jobs) registry.register(job);
  // J15 folio.close (BE-B, BUG-R3-037): window over → what is owed becomes one debt, the folio is closed.
  for (const job of folioWorkerJobs({
    clock: deps.clock,
    audit,
    parameters,
    database: deps.database,
    env: deps.env,
  }))
    registry.register(job);
  // J24 payment.expire (BE-A, Sprint 3): pending VietQR past expires_at → expired.
  registry.register(paymentExpiryJob(audit));
  // ESC-024 B / ESC-031 (BE-B, v1.0): a desk-recorded late charge of one night not reviewed in the window → OWN told.
  registry.register(lateFeeReviewOverdueJob(new EventsService(), parameters));
  // J2 hold.remind (BE-D, Sprint 4): reminder before a hold expires (US-085 AC2, BR-303).
  registry.register(holdReminderJob(new EventsService(), parameters));
  // J10 guest_request.sla (BE-D, Sprint 4): request still `new` after its reply deadline (US-110 AC2, BR-811).
  registry.register(guestRequestSlaJob(new EventsService()));
  // T13 guest_request.purge (BE-D, R3 Sprint 1 – R3-Q15): free text of closed requests after the retention.
  registry.register(
    guestRequestPurgeJob({ events: new EventsService(), params: parameters, audit }),
  );
  // J8 hk.daily + J11 work_order.sla (BE-C, Sprint 4): stay-over cleaning, carry-over, R5, work-order deadlines.
  for (const job of housekeepingWorkerJobs({ parameters, events: new EventsService() }))
    registry.register(job);
  // J25 guest.document_profile_anonymize (BE-C, Sprint 4 – T05): `document` profiles without P05.
  for (const job of guestsWorkerJobs({ clock: deps.clock, audit, parameters }))
    registry.register(job);
  // US-155 (BE-D, R3 Sprint 1): website requests – overdue reminder, WR7 stale, T19 retention, technical cleanup.
  for (const job of publicSiteWorkerJobs({ events: new EventsService(), params: parameters }))
    registry.register(job);
  return { registry, parameters };
}
