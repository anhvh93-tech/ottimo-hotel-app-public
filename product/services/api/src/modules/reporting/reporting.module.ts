/**
 * reporting module (architecture 5.1 `reporting` – M1 Tổng quan / Hôm nay; BE-D, R2 Sprint 4, ORC 17/10):
 * - getTonightKpi, getArrivalsDepartures (DashboardController – read model, SELECT only);
 * - "Cần chú ý" sources US-012 AC7/AC8 (`vip_arrival`, `foc_threshold`) registered on the events hub;
 * - US-136 AC2/AC4: B11/B12 notices (`no_show_marked`/`no_show_restored`, `ota_no_show_report`) through the
 *   reservations module's event port (ReservationHooks 'transitioned' – same transaction);
 * - J2 `hold.remind` (US-085 AC2) registered for the api/test-support job endpoint (the worker registers it
 *   in worker.ts).
 * Other zones through their public API only (FolioService, ReservationHooks, frontdesk stay-rules, events).
 *
 * READ MODEL (ARC openapi-0.3.7.md 11.4 – accepted with conditions C1–C6): the module only SELECTs the tables
 * of other modules listed in REPORTING_READ_TABLES, in the caller's read-only transaction (RLS); it never writes
 * them – "Cần chú ý" items go through EventsService, the one write is the J2 slot in `job_run` (architecture 9.1
 * job pattern). `guest` is read for the booker's name (D01, already in ReservationSummary) and `tags` (VIP
 * filter, never returned). A new table here = ARC review; test/module-boundaries.test.ts enforces both rules.
 */
import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { CLOCK, type Clock } from '../../clock';
import { JobRegistry } from '../../jobs/job-runner';
import { EventsService } from '../events/public/events.service';
import { ParameterService } from '../platform/public/parameter.service';
import { ReservationHooks } from '../reservations/public/reservation-hooks';
import { REPORTING_ATTENTION_SOURCES } from './internal/attention-sources';
import { DashboardController } from './internal/dashboard.controller';
import { DashboardService } from './internal/dashboard.service';
import { wireNoShowNotices } from './internal/no-show-notices';
import { holdReminderJob } from './public/hold-reminder-job';

/** C5: every table the reporting module reads (SELECT only). Adding one needs ARC review. */
export const REPORTING_READ_TABLES = [
  'reservation',
  'reservation_segment',
  'stay_night',
  'room',
  'room_block',
  'checkout_confirmation',
  'channel',
  'guest',
  'folio_line',
  'approval_request',
] as const;

/** C6: the only table the module writes – the exactly-once slot of its J2 job (architecture 9.1). */
export const REPORTING_WRITE_TABLES = ['job_run'] as const;

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class ReportingModule implements OnModuleInit {
  constructor(
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  onModuleInit(): void {
    for (const source of REPORTING_ATTENTION_SOURCES) this.events.registerAttentionSource(source);
    // Same wiring as the worker (public/worker-hooks.ts).
    wireNoShowNotices(this.hooks, this.events, this.clock);
    const j2 = holdReminderJob(this.events, this.params);
    if (!this.jobs.get(j2.key)) this.jobs.register(j2);
  }
}
