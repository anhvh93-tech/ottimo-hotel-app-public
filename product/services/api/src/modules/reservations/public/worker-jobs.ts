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
import { FolioService } from '../../folio/public/folio.service';
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
}): JobDefinition[] {
  const occupancy = new OccupancyService();
  const docNumbers = new DocNumberService(deps.clock, deps.parameters);
  const folios = new FolioService(
    deps.clock,
    deps.audit,
    deps.parameters,
    new ChannelsService(),
    new StayNightAllocationService(deps.clock),
  );
  const reservations = new ReservationsService(
    new PropertyContextService(deps.clock, deps.parameters),
    new PricingService(deps.parameters),
    deps.parameters,
    occupancy,
    docNumbers,
    deps.audit,
    new ApprovalService(deps.clock, deps.parameters, deps.audit),
    new ReservationHooks(),
    new MoneyBridge(folios, new PaymentService(deps.clock, deps.audit, docNumbers), folios),
    new LeadsService(deps.clock, deps.audit),
  );
  return [
    holdExpiryJob(reservations, deps.parameters),
    roomBlockActivationJob(new RoomBlocksService(occupancy, deps.audit), deps.parameters),
    leaseNightsJob(reservations, deps.parameters),
  ];
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
