/**
 * Desk queue "Yêu cầu từ website" (S35; OpenAPI tag website-requests; US-155 AC2, AC3, AC8 – R3-Q06):
 * - listWebsiteBookingRequests      GET  /v1/properties/{propertyId}/website-booking-requests
 * - getWebsiteBookingRequest        GET  …/website-booking-requests/{requestId}            (ETag)
 * - transitionWebsiteBookingRequest POST …/website-booking-requests/{requestId}/actions/{action}
 *                                   (Idempotency-Key + If-Match; claim, release, decline, mark-spam, reopen, erase)
 * - lookupWebsiteBookingRequests    POST …/website-booking-requests/lookup  (OWN/MGR/FDL, 20/hour/user, no-store)
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { RateLimiter } from '../../identity/public/rate-limiter';
import { WebsiteRequestsService } from './website-requests.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const LOOKUP_RULE = { limit: 20, windowMs: 60 * 60_000 } as const;

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

@Controller('v1/properties/:propertyId/website-booking-requests')
export class WebsiteRequestsController {
  private readonly lookups: RateLimiter;

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(WebsiteRequestsService) private readonly requests: WebsiteRequestsService,
    @Inject(CLOCK) clock: Clock,
  ) {
    this.lookups = new RateLimiter(clock);
  }

  private principal(req: GuardedRequest) {
    const p = req.ottimoAuth?.principal;
    if (!p?.propertyId) throw problem('UNAUTHENTICATED');
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    return p;
  }

  @Get()
  @Operation('listWebsiteBookingRequests')
  list(
    @Req() req: GuardedRequest,
    @Query('status') status?: string,
    @Query('refCode') refCode?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const p = this.principal(req);
    return this.db.withContext(
      tenantOf(p),
      (tx) =>
        this.requests.list(
          tx,
          { userId: p.userId, roles: p.roles },
          {
            ...(status !== undefined ? { status } : {}),
            ...(refCode !== undefined ? { refCode } : {}),
            ...(cursor !== undefined ? { cursor } : {}),
            ...(limit !== undefined ? { limit } : {}),
          },
        ),
      { readOnly: true },
    );
  }

  @Post('lookup')
  @HttpCode(200)
  @Operation('lookupWebsiteBookingRequests')
  lookup(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    const p = this.principal(req);
    reply.header('Cache-Control', 'no-store');
    this.lookups.consume(`webreq-lookup:${p.userId}`, LOOKUP_RULE);
    return this.db.withContext(tenantOf(p), (tx) =>
      this.requests.lookup(tx, { userId: p.userId, roles: p.roles, requestId: req.id }, obj(body)),
    );
  }

  @Get(':requestId')
  @Operation('getWebsiteBookingRequest')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('requestId') id: string,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    const p = this.principal(req);
    const out = await this.db.withContext(
      tenantOf(p),
      (tx) => this.requests.get(tx, { userId: p.userId, roles: p.roles }, id),
      { readOnly: true },
    );
    reply.header('ETag', `"${out.version}"`);
    return out.body;
  }

  @Post(':requestId/actions/:action')
  @HttpCode(200)
  @Operation('transitionWebsiteBookingRequest')
  async transition(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('requestId') id: string,
    @Param('action') action: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    const p = req.ottimoAuth?.principal;
    if (!p?.propertyId) throw problem('UNAUTHENTICATED');
    const result = await this.uow.run(req, async (tx) => {
      const out = await this.requests.transition(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        id,
        action,
        obj(body),
        req.ottimoAuth?.ifMatchVersion,
      );
      return { status: 200, body: out.body };
    });
    const version = (result.body as { version?: number }).version;
    if (typeof version === 'number') reply.header('ETag', `"${version}"`);
    return applyResult(reply, result);
  }
}
