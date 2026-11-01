/**
 * Public "Yêu cầu đặt phòng" endpoints (OpenAPI tag public-site; US-155; ADR-014 4.4; SEC ARC-13, 23):
 * - getPublicFormToken          GET  /v1/public/properties/{propertySlug}/form-token
 * - createWebsiteBookingRequest POST /v1/public/properties/{propertySlug}/booking-requests  (202)
 * Step 0 (in RAM, before any database access – ARC-13, C-11): 30 calls per hour per IP (IPv6 /64) counting
 * every answer incl. 4xx → 429 + Retry-After; at most 4 calls in flight, no queue → 503 SERVICE_UNAVAILABLE.
 * Step 1: Origin = LANDING_BASE_URL (missing / `null` / other → 403); JSON only (422); body ≤ 8 KB (413).
 * Cookies are ignored (a staff or guest session changes nothing, no user id is written). `Cache-Control: no-store`.
 * Logs: method/route/status/time only (the global request log – no body, no query of these routes).
 *
 * R4 LP-v2 – getPublicPriceEstimate GET /v1/public/properties/{propertySlug}/price-estimate (OpenAPI 0.3.9; ARC
 * lp-v2-design 2.5, SEC SR-PE-07/08/14): its OWN RAM counters (HMAC of the IP with the `ip:pe:` label – 30 per
 * 10 minutes and 200 per day per IP (IPv6 /64), 400 per day per IPv6 /48, 10 per second for the whole api → 503) and
 * its OWN bulkhead (2 in flight, no queue → 503): looking prices up never uses the form's 30/hour or its 4 slots.
 * No database counter (rate_limit_counter) for this GET. `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { problem } from '../../../shared/problem';
import { RateLimiter } from '../../identity/public/rate-limiter';
import { PriceEstimateService } from './price-estimate.service';
import { PublicBookingService } from './public-booking.service';
import { PUBLIC_SITE_OPTIONS, type PublicSiteOptions } from './public-site.options';
import { hmacHex, ipBuckets } from './website-request-rules';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PUBLIC_RAM_RULE = { limit: 30, windowMs: 60 * 60_000 } as const;
export const PUBLIC_MAX_IN_FLIGHT = 4;
export const PUBLIC_MAX_BODY_BYTES = 8 * 1024;
/** SEC SR-PE-07 (security constants; ARC may move them ±50 % with a decision-log line). */
export const ESTIMATE_RAM_RULES = {
  ipPer10Min: { limit: 30, windowMs: 10 * 60_000 },
  ipPerDay: { limit: 200, windowMs: 24 * 3600_000 },
  range48PerDay: { limit: 400, windowMs: 24 * 3600_000 },
  globalPerSecond: { limit: 10, windowMs: 1_000 },
} as const;
/** ARC 2.5: own bulkhead of the price route (SEC SR-PE-08: ≤ 4). */
export const ESTIMATE_MAX_IN_FLIGHT = 2;

const header = (req: GuardedRequest, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

@Controller('v1/public/properties/:propertySlug')
export class PublicSiteController {
  private readonly ram: RateLimiter;
  private inFlight = 0;
  private readonly estimateRam: RateLimiter;
  private estimateInFlight = 0;

  constructor(
    @Inject(PublicBookingService) private readonly booking: PublicBookingService,
    @Inject(PriceEstimateService) private readonly estimates: PriceEstimateService,
    @Inject(PUBLIC_SITE_OPTIONS) private readonly options: PublicSiteOptions,
    @Inject(CLOCK) clock: Clock,
  ) {
    this.ram = new RateLimiter(clock);
    this.estimateRam = new RateLimiter(clock);
  }

  /** Test support: forget the RAM windows of the price route. Never called by production code. */
  resetEstimateLimits(): void {
    this.estimateRam.resetAll();
  }

  /** Step 0 of the price route: its own counters (every call counts, 4xx included) + its own bulkhead. */
  private async guardedEstimate<T>(
    req: GuardedRequest,
    reply: Reply,
    fn: () => Promise<T>,
  ): Promise<T> {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Robots-Tag', 'noindex');
    const r = ESTIMATE_RAM_RULES;
    const global = this.estimateRam.retryAfter('pubest:all', r.globalPerSecond);
    if (global > 0) throw problem('SERVICE_UNAVAILABLE', { headers: { 'Retry-After': '1' } });
    this.estimateRam.hit('pubest:all', r.globalPerSecond);
    const b = ipBuckets((req as { ip?: string }).ip ?? '0.0.0.0');
    const host = hmacHex(this.options.ipHmacKey, `ip:pe:${b.host}`);
    this.estimateRam.consume(`pubest:10m:${host}`, r.ipPer10Min);
    this.estimateRam.consume(`pubest:d:${host}`, r.ipPerDay);
    if (b.range48) {
      const range = hmacHex(this.options.ipHmacKey, `ip:pe48:${b.range48}`);
      this.estimateRam.consume(`pubest:48:${range}`, r.range48PerDay);
    }
    if (this.estimateInFlight >= ESTIMATE_MAX_IN_FLIGHT) {
      throw problem('SERVICE_UNAVAILABLE', { headers: { 'Retry-After': '5' } });
    }
    this.estimateInFlight += 1;
    try {
      return await fn();
    } finally {
      this.estimateInFlight -= 1;
    }
  }

  @Get('price-estimate')
  @Operation('getPublicPriceEstimate')
  priceEstimate(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('propertySlug') slug: string,
  ) {
    return this.guardedEstimate(req, reply, async () => {
      const site = header(req, 'sec-fetch-site');
      if (site !== undefined && site !== 'same-origin') throw problem('FORBIDDEN_ACTION');
      if (!this.options.landingOrigin) throw problem('NOT_FOUND');
      const at = req.url.indexOf('?');
      const query = at >= 0 ? req.url.slice(at + 1) : '';
      return this.estimates.publicEstimate(await this.booking.resolve(slug), query);
    });
  }

  /** Step 0: RAM counter per IP (counts this call whatever its answer) + bulkhead. */
  private async guarded<T>(
    req: GuardedRequest,
    reply: Reply,
    fn: (ip: string) => Promise<T>,
  ): Promise<T> {
    reply.header('Cache-Control', 'no-store');
    const ip = (req as { ip?: string }).ip ?? '0.0.0.0';
    this.ram.consume(`pub:${ipBuckets(ip).host}`, PUBLIC_RAM_RULE);
    if (this.inFlight >= PUBLIC_MAX_IN_FLIGHT) {
      throw problem('SERVICE_UNAVAILABLE', { headers: { 'Retry-After': '5' } });
    }
    this.inFlight += 1;
    try {
      return await fn(ip);
    } finally {
      this.inFlight -= 1;
    }
  }

  @Get('form-token')
  @Operation('getPublicFormToken')
  formToken(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('propertySlug') slug: string,
  ) {
    return this.guarded(req, reply, async () => {
      // ARC-13 point 6: a browser that says the call is cross-site is refused; old browsers send nothing.
      const site = header(req, 'sec-fetch-site');
      if (site !== undefined && site !== 'same-origin') throw problem('FORBIDDEN_ACTION');
      if (!this.options.landingOrigin) throw problem('NOT_FOUND');
      return this.booking.formToken(slug);
    });
  }

  @Post('booking-requests')
  @HttpCode(202)
  @Operation('createWebsiteBookingRequest')
  create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('propertySlug') slug: string,
    @Body() body: unknown,
  ) {
    return this.guarded(req, reply, async (ip) => {
      // 1. Origin = landing (missing / "null" / other → 403), JSON only, ≤ 8 KB.
      const origin = header(req, 'origin');
      if (!this.options.landingOrigin) throw problem('NOT_FOUND');
      if (!origin || origin === 'null' || origin !== this.options.landingOrigin) {
        throw problem('FORBIDDEN_ACTION', { detail: 'Origin not allowed' });
      }
      const type = (header(req, 'content-type') ?? '').split(';')[0]?.trim().toLowerCase();
      if (type !== 'application/json') throw problem('VALIDATION_FAILED');
      const length = Number(header(req, 'content-length') ?? JSON.stringify(body ?? null).length);
      if (length > PUBLIC_MAX_BODY_BYTES) throw problem('PAYLOAD_TOO_LARGE');
      // 2. Idempotency-Key required.
      const key = header(req, 'idempotency-key');
      if (!key)
        throw problem('PRECONDITION_REQUIRED', { detail: 'Idempotency-Key header is required' });
      if (!UUID.test(key)) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'Idempotency-Key', code: 'VALIDATION_FAILED' }],
        });
      }
      const url = req.url.split('?')[0] as string;
      const out = await this.booking.create({
        slug,
        ip,
        idempotencyKey: key,
        method: 'POST',
        path: url,
        body,
      });
      if (out.replayed) reply.header('Idempotent-Replayed', 'true');
      reply.status(out.status);
      return out.body;
    });
  }
}
