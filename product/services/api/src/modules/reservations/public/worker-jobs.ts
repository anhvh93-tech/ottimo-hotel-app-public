/**
 * Reservation jobs for the worker process (no Nest container there – worker.ts composes plain objects).
 * Same classes as the api module, so the worker and the test-support job endpoint behave identically.
 * The worker builds the same FolioService/PaymentService (money bridge is mandatory – ARC-BE-S2-04).
 */
import type { Clock } from '../../../clock';
import type { JobDefinition } from '../../../jobs/job-runner';
import {
  holdExpiryJob,
  leaseNightsJob,
  roomBlockActivationJob,
} from '../../../jobs/reservation-jobs';
import { ApprovalService } from '../../approvals/public/approval.service';
import type { AuditService } from '../../audit/public/audit.service';
import { EventsService } from '../../events/public/events.service';
import { provideFocDecisionHooksForWorker } from '../../folio/public/foc-worker-hooks';
import { FolioService } from '../../folio/public/folio.service';
import { provideFolioRefundRouting } from '../../folio/public/refund-routing';
import { PaymentService } from '../../payments/public/payment.service';
import { ChannelsService } from '../../platform/public/channels';
import { DocNumberService } from '../../platform/public/doc-number.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { LeadsService } from '../../sales/public/leads.service';
import { MoneyBridge } from '../internal/money-bridge';
import { ReservationsService } from '../internal/reservations.service';
import { RoomBlocksService } from '../internal/room-blocks.service';
import { OccupancyService } from './occupancy.service';
import { PricingService } from './pricing.service';
import { ReservationHooks } from './reservation-hooks';
import { ReservationStayPort } from './stay-port';
import { StayNightAllocationService } from './stay-night-allocation';

export function reservationWorkerJobs(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  /**
   * The worker's shared ReservationHooks with the other modules' listeners (worker-jobs.ts): J1 `hold.expire` emits
   * `transitioned` (cancelled) – the registration voids itself (K11), guest links die (B-13), as in the api. A bare
   * instance when omitted (tests of the job alone).
   */
  hooks?: ReservationHooks;
  /** v1.0.4 P4-10 (BUG-R3-041): J1 notices → staff inbox + SSE. A fresh instance when omitted. */
  events?: EventsService;
}): JobDefinition[] {
  return [...reservationWorkerComposition(deps).jobs];
}

/**
 * The composition behind the worker's J1 / O2 / lease.nights (exposed for test/v104-holds-units.test.ts). ONE set of shared
 * instances, like the api container:
 * - v1.0.4 P4-10 (FB-R3-ARC-BEB-WA-04): FolioService gets the ApprovalService (and DocNumberService, EventsService),
 *   and the ApprovalService gets the FolioModule hooks J1 needs (FOC / special_discount decision hooks + preLock,
 *   refund routing) – an overdue hold with a FOC request still waiting is cancelled with its request instead of
 *   failing on every tick;
 * - BUG-R3-041: ReservationsService gets EventsService (J1 notices in the inbox, hold-notices.ts).
 */
export function reservationWorkerComposition(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  hooks?: ReservationHooks;
  events?: EventsService;
}): {
  jobs: JobDefinition[];
  reservations: ReservationsService;
  approvals: ApprovalService;
  folios: FolioService;
} {
  const events = deps.events ?? new EventsService();
  const hooks = deps.hooks ?? new ReservationHooks();
  const occupancy = new OccupancyService();
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
  provideFolioRefundRouting(approvals, folios);
  provideFocDecisionHooksForWorker({
    clock: deps.clock,
    audit: deps.audit,
    parameters: deps.parameters,
    approvals,
    folios,
    hooks,
    events,
  });
  const reservations = new ReservationsService(
    new PropertyContextService(deps.clock, deps.parameters),
    new PricingService(deps.parameters),
    deps.parameters,
    occupancy,
    docNumbers,
    deps.audit,
    approvals,
    hooks,
    new MoneyBridge(folios, new PaymentService(deps.clock, deps.audit, docNumbers), folios),
    new LeadsService(deps.clock, deps.audit),
    undefined, // WEBSITE_REQUEST_PORT – not used by these jobs
    events,
  );
  return {
    jobs: [
      holdExpiryJob(reservations, deps.parameters),
      roomBlockActivationJob(new RoomBlocksService(occupancy, deps.audit), deps.parameters),
      leaseNightsJob(reservations, deps.parameters),
    ],
    reservations,
    approvals,
    folios,
  };
}

/**
 * BUG-R3-037 (BE-B): the front desk's stay port for a worker composition (frontdesk/public/worker-hooks.ts – the
 * J15 debt ports read the booking context through it). Built on the caller's shared instances (one ApprovalService,
 * one ReservationHooks, one FolioService per composition), like the api container.
 */
export function reservationStayPortForWorker(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
  approvals: ApprovalService;
  hooks: ReservationHooks;
  folios: FolioService;
  payments: PaymentService;
  docNumbers: DocNumberService;
  occupancy: OccupancyService;
  pricing: PricingService;
}): ReservationStayPort {
  return new ReservationStayPort(
    new ReservationsService(
      new PropertyContextService(deps.clock, deps.parameters),
      deps.pricing,
      deps.parameters,
      deps.occupancy,
      deps.docNumbers,
      deps.audit,
      deps.approvals,
      deps.hooks,
      new MoneyBridge(deps.folios, deps.payments, deps.folios),
      new LeadsService(deps.clock, deps.audit),
    ),
  );
}
