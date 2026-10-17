/**
 * housekeeping module (BE-C, R2 Sprint 4 – OpenAPI 0.3.7 nhóm H; EP07/EP08): room statuses (SM-03 – the
 * RoomStatusService store moved here, B-14), housekeeping tasks (SM-14), inspections (BR-808), work orders
 * (SM-04) with their OOO blocks (through reservations/public/room-block.port), jobs J8 `hk.daily` and J11
 * `work_order.sla`, the "Cần chú ý" sources of its tables, and GUEST_REQUEST_WORK_PORT for BE-D's guest
 * requests (EP14). Global: the port and RoomStatusService are bound for the other modules.
 */
import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { JobRegistry } from '../../jobs/job-runner';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { EventsService } from '../events/public/events.service';
import { ParameterService } from '../platform/public/parameter.service';
import { housekeepingAttentionSources } from './internal/attention-sources';
import { GuestRequestWorkAdapter } from './internal/guest-request-work.adapter';
import { HousekeepingController } from './internal/housekeeping.controller';
import { HousekeepingService } from './internal/housekeeping.service';
import { WorkOrdersService } from './internal/work-orders.service';
import { GUEST_REQUEST_WORK_PORT } from './public/guest-request-work.port';
import { RoomStatusService } from './public/room-status.service';
import { housekeepingJobs } from './public/worker-jobs';

// Audit allowlists (SR-AUD-03): values of the work-order history (WorkOrder.history[] – erd 4.9) and the
// inspection result – never a guest name or a free note in before/after (notes go to `reason`).
defineAuditEntity('work_order', ['change', 'from', 'to']);
defineAuditEntity('inspection', ['result', 'selfInspection', 'checklistVersion']);

@Global()
@Module({
  controllers: [HousekeepingController],
  providers: [
    RoomStatusService,
    HousekeepingService,
    WorkOrdersService,
    GuestRequestWorkAdapter,
    { provide: GUEST_REQUEST_WORK_PORT, useExisting: GuestRequestWorkAdapter },
  ],
  // B-14: the one RoomStatusService of the app (the front desk injects this one).
  exports: [GUEST_REQUEST_WORK_PORT, HousekeepingService, RoomStatusService],
})
export class HousekeepingModule implements OnModuleInit {
  constructor(
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(RoomStatusService) private readonly rooms: RoomStatusService,
  ) {}

  onModuleInit(): void {
    for (const job of housekeepingJobs({
      params: this.params,
      events: this.events,
      rooms: this.rooms,
    })) {
      if (!this.jobs.get(job.key)) this.jobs.register(job);
    }
    for (const source of housekeepingAttentionSources())
      this.events.registerAttentionSource(source);
  }
}
