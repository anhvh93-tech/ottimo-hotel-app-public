/**
 * BUG-R3-037 (P1, BE-B): J15 `folio.close` for the worker process (worker.ts ticks worker-jobs.ts – no Nest
 * container there). Until v1.0.0-rc.4 the job was registered only by FolioModule (the api registry, which never
 * ticks), so no folio was ever closed.
 *
 * J15 needs what FolioModule gives it, built here from the same classes on ONE set of shared instances:
 * - FolioService with DocNumberService, ApprovalService and EventsService – "Cần chú ý" `closed_reservation_credit`
 *   is opened for a credit not routed yet (BUG-R3-002) and resolved when the folio closes (BUG-R3-034);
 * - ReservationHooks with the front desk's debt ports (`debtOnCheckout`, `openDebt` – frontdesk/public/worker-hooks,
 *   same wiring function as FrontdeskModule): what is owed after the window becomes ONE debt (BR-427 (d), BR-525);
 * - ApprovalService with the folio's refund routing and the payments module's `refund` decision hooks (same wiring
 *   functions as FolioModule / PaymentsModule): refund requests above the credit left are re-planned
 *   (BUG-R3-012/013 – autoCancel / cancelApproved / submit), a cancelled one purges its account (SEC-BE-45).
 * The FOC / special_discount / damage_pricing decision hooks of FolioModule are NOT wired: J15 never decides such a
 * request (refundsDownToCredit touches `refund` requests only) – `folioWorkerComposition().approvals
 * .decisionHooks()` is checked by test/worker-jobs.test.ts.
 */
import type { Clock } from '../../../clock';
import type { Database } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import { ApprovalService } from '../../approvals/public/approval.service';
import type { AuditService } from '../../audit/public/audit.service';
import { cryptoServiceFromEnv } from '../../crypto/public/factory';
import { EventsService } from '../../events/public/events.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { EncryptedBlobService } from '../../files/public/encrypted-blob.service';
import { blobStoreFromEnv } from '../../files/public/factory';
import { frontdeskWorkerHooks } from '../../frontdesk/public/worker-hooks';
import { PaymentService } from '../../payments/public/payment.service';
import { paymentsWorkerHooks } from '../../payments/public/worker-hooks';
import { ChannelsService } from '../../platform/public/channels';
import { DocNumberService } from '../../platform/public/doc-number.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { StayNightAllocationService } from '../../reservations/public/stay-night-allocation';
import { folioCloseJob } from './folio-close-job';
import { FolioService } from './folio.service';
import { provideFolioRefundRouting } from './refund-routing';

export interface FolioWorkerDeps {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  database: Database;
  env?: NodeJS.ProcessEnv;
}

/** The composition behind the worker's J15 (exposed for the wiring test). */
export function folioWorkerComposition(deps: FolioWorkerDeps): {
  jobs: JobDefinition[];
  folios: FolioService;
  approvals: ApprovalService;
  hooks: ReservationHooks;
} {
  const env = deps.env ?? process.env;
  const events = new EventsService();
  const docNumbers = new DocNumberService(deps.clock, deps.parameters);
  const approvals = new ApprovalService(deps.clock, deps.parameters, deps.audit, events);
  const folios = new FolioService(
    deps.clock,
    deps.audit,
    deps.parameters,
    new ChannelsService(),
    new StayNightAllocationService(deps.clock),
    docNumbers,
    approvals,
    events,
  );
  const hooks = new ReservationHooks();
  const payments = new PaymentService(deps.clock, deps.audit, docNumbers, folios, deps.parameters);
  const crypto = cryptoServiceFromEnv(env, deps.clock);
  const attachments = new AttachmentService(
    new EncryptedBlobService(crypto, blobStoreFromEnv(env), deps.clock, deps.database),
    deps.clock,
    deps.parameters,
  );
  const shared = {
    clock: deps.clock,
    audit: deps.audit,
    parameters: deps.parameters,
    events,
    approvals,
    folios,
    payments,
    docNumbers,
    attachments,
  };
  provideFolioRefundRouting(approvals, folios);
  paymentsWorkerHooks({ ...shared, database: deps.database, crypto });
  frontdeskWorkerHooks({ ...shared, hooks });
  return { jobs: [folioCloseJob(deps.database, folios, hooks)], folios, approvals, hooks };
}

/** Worker composition (worker-jobs.ts: one line, like the other modules). */
export function folioWorkerJobs(deps: FolioWorkerDeps): JobDefinition[] {
  return folioWorkerComposition(deps).jobs;
}
