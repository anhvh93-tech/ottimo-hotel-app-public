/**
 * registration module (BE-C Sprint 3; EP06 v0.2, SM-05, SEC s3-checklist B/C/E): documents (C3), images,
 * checks, P02b consent, semi-automatic declaration (portal data + K6…K10), early purge, C3 access log
 * (S28), J16 retention job, J5 deadline reminders/digest, "Cần chú ý" sources registration_due /
 * registration_overdue / visa_expiring (BUG-R2-034/035). Global exports:
 * - FD_REGISTRATION_PORT (BE-A frontdesk) → RegistrationPortService;
 * - RegistrationService (guest-portal uploads and consent).
 * Listens to ReservationHooks: `created` → K1 record; `cancelled`/`no_show` → K11 void + images now;
 * restore of a no-show → K12; `stay_changed` → requiredCount (K9/K13).
 */
import {
  type DynamicModule,
  Global,
  Inject,
  Module,
  type OnModuleInit,
  Optional,
} from '@nestjs/common';
import { CLOCK, type Clock } from '../../clock';
import { JobRegistry } from '../../jobs/job-runner';
import { EventsService } from '../events/public/events.service';
import { ParameterService } from '../platform/public/parameter.service';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { FD_REGISTRATION_PORT } from '../frontdesk/public/ports';
import { ReservationHooks } from '../reservations/public/reservation-hooks';
import { registrationAttentionSources } from './internal/attention-sources';
import { C3LogService } from './internal/c3-log.service';
import { RegistrationDeadlineJob } from './internal/deadline-job';
import { RegistrationController } from './internal/registration.controller';
import { RegistrationService } from './internal/registration.service';
import { PORTAL_URLS, portalUrlsFromEnv } from './internal/portal-config';
import { RetentionService } from './internal/retention.service';
import { RegistrationPartyLink } from './public/party-port';
import { RegistrationPortService } from './public/registration.port';
import { registrationSummary } from './public/stay-facts';
import { retentionJob } from './public/worker-jobs';

// Audit allowlists (SR-AUD-03): state facts only – never a document field, name or note text.
// BUG-R2-083: `unclaimedDocuments` = how many unlinked guest-link documents a party removal / claim touched.
// S4-39: `guestUploadPersonIndex` = the desk's slot answer of removePartyMember (a number 2…20 or `none`).
defineAuditEntity('registration', [
  'checkCode',
  'manualResult',
  'imagesPurgeReason',
  'unclaimedDocuments',
  'guestUploadPersonIndex',
]);
defineAuditEntity('consent_record', ['purpose', 'decision', 'channel']);

@Global()
@Module({})
export class RegistrationModule implements OnModuleInit {
  constructor(
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(RetentionService) private readonly retention: RetentionService,
    @Inject(RegistrationService) private readonly regs: RegistrationService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  /** `env`: GUEST_REGISTRATION_PORTAL_URL_* (https, defaults BR-606) – resolved environment of bootstrap. */
  static register(options: { env?: NodeJS.ProcessEnv } = {}): DynamicModule {
    return {
      module: RegistrationModule,
      controllers: [RegistrationController],
      providers: [
        { provide: PORTAL_URLS, useValue: portalUrlsFromEnv(options.env ?? process.env) },
        RegistrationService,
        RetentionService,
        C3LogService,
        RegistrationPortService,
        { provide: FD_REGISTRATION_PORT, useExisting: RegistrationPortService },
        RegistrationPartyLink,
      ],
      exports: [
        RegistrationPartyLink,
        RegistrationService,
        RetentionService,
        RegistrationPortService,
        FD_REGISTRATION_PORT,
      ],
    };
  }

  onModuleInit(): void {
    const job = retentionJob(this.retention);
    if (!this.jobs.get(job.key)) this.jobs.register(job);
    if (this.events) {
      const j5 = new RegistrationDeadlineJob(
        this.regs,
        this.params,
        this.clock,
        this.events,
      ).definition();
      if (!this.jobs.get(j5.key)) this.jobs.register(j5);
      for (const source of registrationAttentionSources(this.regs)) {
        this.events.registerAttentionSource(source);
      }
    }
    this.hooks.on('created', async (tx, e) => {
      await this.regs.ensure(tx, e.reservationId);
    });
    this.hooks.on('transitioned', async (tx, e) => {
      if (e.status === 'cancelled' || e.status === 'no_show') {
        await this.regs.onReservationVoided(tx, e.reservationId);
      } else if (e.previousStatus === 'no_show' && e.status === 'confirmed') {
        await this.regs.onReservationRestored(tx, e.reservationId);
      }
    });
    this.hooks.on('stay_changed', async (tx, e) => {
      await this.regs.onPartyChanged(tx, e.reservationId, e.personsTotal);
    });
    // BUG-R2-031 (BE-A): Reservation.registrationId/Status/DeadlineAt without reservations reading `registration`.
    this.hooks.provideRegistrationSummary(registrationSummary);
  }
}
