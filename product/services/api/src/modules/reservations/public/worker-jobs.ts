/**
 * Reservation jobs for the worker process (no Nest container there – worker.ts composes plain objects).
 * Same classes as the api module, so the worker and the test-support job endpoint behave identically.
 * Folio/payments are not loaded in the worker: deposits are read straight from the ledger (MoneyBridge).
 */
import type { Clock } from '../../../clock';
import type { JobDefinition } from '../../../jobs/job-runner';
import { holdExpiryJob, roomBlockActivationJob } from '../../../jobs/reservation-jobs';
import { ApprovalService } from '../../approvals/public/approval.service';
import type { AuditService } from '../../audit/public/audit.service';
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

export function reservationWorkerJobs(deps: {
  clock: Clock;
  audit: AuditService;
  parameters: ParameterService;
}): JobDefinition[] {
  const occupancy = new OccupancyService();
  const reservations = new ReservationsService(
    new PropertyContextService(deps.clock, deps.parameters),
    new PricingService(deps.parameters),
    deps.parameters,
    occupancy,
    new DocNumberService(deps.clock, deps.parameters),
    deps.audit,
    new ApprovalService(deps.clock, deps.parameters, deps.audit),
    new ReservationHooks(),
    new MoneyBridge(),
    new LeadsService(deps.clock, deps.audit),
  );
  return [
    holdExpiryJob(reservations),
    roomBlockActivationJob(new RoomBlocksService(occupancy, deps.audit)),
  ];
}
