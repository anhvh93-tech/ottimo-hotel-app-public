/**
 * Public "Yêu cầu đặt phòng" endpoints (OpenAPI tag public-site; US-155; ADR-014 4.4; SEC ARC-13, 23):
 * - getPublicFormToken          GET  /v1/public/properties/{propertySlug}/form-token
 * - createWebsiteBookingRequest POST /v1/public/properties/{propertySlug}/booking-requests  (202)
 * Step 0 (in RAM, before any database access – ARC-13, C-11): 30 calls per hour per IP (IPv6 /64) counting
 * every answer incl. 4xx → 429 + Retry-After; at most 4 calls in flight, no queue → 503 SERVICE_UNAVAILABLE.
 * Step 1: Origin = LANDING_BASE_URL (missing / `null` / other → 403); JSON only (422); body ≤ 8 KB (413).
 * Cookies are ignored (a staff or guest session changes nothing, no user id is written). `Cache-Control: no-store`.
 * Logs: method/route/status/time only (the global request log – no body, no query of these routes).
 */
import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { problem } from '../../../shared/problem';
import { RateLimiter } from '../../identity/public/rate-limiter';
import { PublicBookingService } from './public-booking.service';
import { PUBLIC_SITE_OPTIONS, type PublicSiteOptions } from './public-site.options';
import { ipBuckets } from './website-request-rules';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const PUBLIC_RAM_RULE = { limit: 30, windowMs: 60 * 60_000 } as const;
export const PUBLIC_MAX_IN_FLIGHT = 4;
export const PUBLIC_MAX_BODY_BYTES = 8 * 1024;

const header = (req: GuardedRequest, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

@Controller('v1/public/properties/:propertySlug')
export class PublicSiteController {
  private readonly ram: RateLimiter;
  private inFlight = 0;

  constructor(
    @Inject(PublicBookingService) private readonly booking: PublicBookingService,
    @Inject(PUBLIC_SITE_OPTIONS) private readonly options: PublicSiteOptions,
    @Inject(CLOCK) clock: Clock,
  ) {
    this.ram = new RateLimiter(clock);
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
