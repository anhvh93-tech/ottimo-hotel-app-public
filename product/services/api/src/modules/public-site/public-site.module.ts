/**
 * public-site module (erd 4.14; architecture 5.1 – new in R3 Sprint 1, BE-D): "Yêu cầu đặt phòng" from the website
 * (US-155 – phương án A, ESC-020 L7-A) and its Desk queue S35 (R3-Q06). Registers:
 * - public controller (form token, create request) and Desk controller (list, get, transitions, lookup);
 * - WEBSITE_REQUEST_PORT for sales / reservations (WR1 by the system at saveQuote, WR6 at hold / booking);
 * - jobs `web_request.sla`, `web_request.stale`, `web_request.purge`, `public_site.cleanup` (also in the worker);
 * - "Cần chú ý" source `website_request_new`;
 * - the setParameter hook of `public_booking_requests_enabled` (SEC ARC-17: PUBLIC_FORM_NOT_READY + toggled
 *   notification to OWN + MGR; the property cache is dropped on change).
 * - FB-INV-011: job `fx.refresh` (fetch off in the api), setParameter hooks of `fx_rates.vietcombank` (worker only) and
 *   `fx_rate_overrides` (OWN override, allowlisted codes); `getPublicMonthlyRates` serves the optional `fx` block.
 * The public form stays OFF until OWN switches it on (default false – US-155 AC4).
 * R4 LP-v2: `getPublicPriceEstimate` (PriceEstimateService over the reservations PublicRatePort) – OFF until OWN sets
 * `public_show_prices` (default false); every parameter change of a property drops its estimate caches.
 */
import { type DynamicModule, Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import type { Tx } from '../../db/database';
import { JobRegistry } from '../../jobs/job-runner';
import { problem } from '../../shared/problem';
import { EventsService } from '../events/public/events.service';
import { ParameterService } from '../platform/public/parameter.service';
import { ParameterHooks } from '../platform/public/parameter-hooks';
import { PropertyContextService } from '../platform/public/property-context';
import { PriceEstimateService } from './internal/price-estimate.service';
import { PublicBookingService } from './internal/public-booking.service';
import { PublicSiteController } from './internal/public-site.controller';
import { PUBLIC_SITE_OPTIONS, publicSiteOptionsFrom } from './internal/public-site.options';
import { WebsiteRequestsController } from './internal/website-requests.controller';
import { WebsiteRequestsService } from './internal/website-requests.service';
import {
  FX_AUTO_KEY,
  FX_CURRENCIES,
  FX_OVERRIDE_KEY,
  FX_RATE_BOUNDS,
  fxOverridesIssue,
  isFxCurrency,
} from './public/fx-rates';
import { WEBSITE_REQUEST_PORT, WebsiteRequestPort } from './public/website-request.port';
import { publicSiteWorkerJobs, websiteRequestNewSource } from './public/worker-jobs';
import './audit-entities';

export interface PublicSiteModuleOptions {
  env?: NodeJS.ProcessEnv;
}

@Global()
@Module({})
export class PublicSiteModule implements OnModuleInit {
  constructor(
    @Inject(JobRegistry) private readonly jobs: JobRegistry,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(ParameterHooks) private readonly hooks: ParameterHooks,
    @Inject(PublicBookingService) private readonly booking: PublicBookingService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(PriceEstimateService) private readonly estimates: PriceEstimateService,
  ) {}

  static register(options: PublicSiteModuleOptions = {}): DynamicModule {
    const env = options.env ?? process.env;
    return {
      module: PublicSiteModule,
      controllers: [PublicSiteController, WebsiteRequestsController],
      providers: [
        { provide: PUBLIC_SITE_OPTIONS, useValue: publicSiteOptionsFrom(env) },
        WebsiteRequestsService,
        PriceEstimateService,
        PublicBookingService,
        WebsiteRequestPort,
        { provide: WEBSITE_REQUEST_PORT, useExisting: WebsiteRequestPort },
      ],
      exports: [WEBSITE_REQUEST_PORT, WebsiteRequestPort],
    };
  }

  onModuleInit(): void {
    // `fx.refresh` is registered here with FX_RATES_FETCH off: only the worker calls Vietcombank (egress of the worker).
    for (const job of publicSiteWorkerJobs({ events: this.events, params: this.params })) {
      if (!this.jobs.get(job.key)) this.jobs.register(job);
    }
    // FB-INV-011: the Vietcombank rates are written by the worker only (403 to anyone, logged as access.denied);
    // OWN's override is checked here (allowlisted codes, sanity band) before setParameter writes it.
    if (!this.hooks.get(FX_AUTO_KEY)) {
      this.hooks.register(FX_AUTO_KEY, {
        before: async () => {
          throw problem('FORBIDDEN_ACTION');
        },
      });
    }
    if (!this.hooks.get(FX_OVERRIDE_KEY)) {
      this.hooks.register(FX_OVERRIDE_KEY, {
        before: async (_tx: Tx, value: unknown, roles: readonly string[]) => {
          if (!roles.includes('owner')) return; // setParameter's own 403 comes first
          const issue = fxOverridesIssue(value);
          if (!issue) return;
          const code = issue.field.slice('value.'.length);
          if (issue.code === 'PARAM_OUT_OF_RANGE' && isFxCurrency(code)) {
            throw problem('PARAM_OUT_OF_RANGE', {
              errors: [issue],
              extras: { min: FX_RATE_BOUNDS[code].min, max: FX_RATE_BOUNDS[code].max },
            });
          }
          throw problem('VALIDATION_FAILED', {
            errors: [issue],
            ...(issue.code === 'NOT_ALLOWED' ? { extras: { allowed: [...FX_CURRENCIES] } } : {}),
          });
        },
      });
    }
    this.events.registerAttentionSource(websiteRequestNewSource);
    // R4 LP-v2: price / calendar / switch changes drop the estimate caches of the property at once (TTL 60 s is the
    // backstop for room list prices, which are not parameters).
    this.hooks.onChange((propertyId) => this.estimates.invalidate(propertyId));
    if (!this.hooks.get('public_booking_requests_enabled')) {
      this.hooks.register('public_booking_requests_enabled', {
        before: async (tx: Tx, value: unknown, roles: readonly string[]) => {
          // Only the owner may set this security key – anyone else gets setParameter's own 403.
          if (value !== true || !roles.includes('owner')) return;
          const missing = await this.booking.readiness(tx);
          if (missing.length > 0) throw problem('PUBLIC_FORM_NOT_READY', { extras: { missing } });
        },
        after: async (tx: Tx) => {
          this.booking.clearCache();
          const pc = await this.property.now(tx);
          await this.events.notify(
            tx,
            {
              kind: 'public_booking_toggled',
              roles: ['owner', 'manager'],
              refType: 'property',
              refId: pc.propertyId,
            },
            pc.now,
          );
        },
      });
    }
  }
}
