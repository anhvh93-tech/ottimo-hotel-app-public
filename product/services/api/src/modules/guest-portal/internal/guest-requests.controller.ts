/**
 * Guest requests (OpenAPI tags guest-portal / guest-requests; EP14 3–4) – BE-D Sprint 4.
 * Guest (level-1 session, x-after-checkout blocked – SR-GST-11):
 * - listGuestRequestOptions GET  /v1/guest/request-options
 * - listMyRequests          GET  /v1/guest/requests
 * - createGuestRequest      POST /v1/guest/requests   (Idempotency-Key – GuestUnitOfWork, 201)
 * Staff (S30 – x-roles FD+, HK, MT; HK/MT scope routed_to_me):
 * - listGuestRequests       GET  /v1/properties/{propertyId}/guest-requests?status=
 * - transitionGuestRequest  POST /v1/properties/{propertyId}/guest-requests/{requestId}/actions/{action}
 * Every guest response: `Referrer-Policy: no-referrer`; the request list (the guest's notes, D23) `no-store`.
 */
import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import type { GuestPrincipal } from '../../../shared/http/guest-session';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { GuestPortalService } from './guest-portal.service';
import { GuestRequestsService } from './guest-requests.service';
import { GuestUnitOfWork, guestContext } from './guest-unit-of-work';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = ['acknowledge', 'complete', 'decline'] as const;

function guestOf(req: GuardedRequest): GuestPrincipal {
  const g = req.ottimoAuth?.guest;
  if (!g) throw problem('UNAUTHENTICATED');
  return g;
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function guestHeaders(reply: Reply): void {
  reply.header('Referrer-Policy', 'no-referrer');
  reply.header('Cache-Control', 'no-store');
}

@Controller('v1/guest')
export class GuestRequestsGuestController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(GuestPortalService) private readonly portal: GuestPortalService,
    @Inject(GuestRequestsService) private readonly requests: GuestRequestsService,
    @Inject(GuestUnitOfWork) private readonly uow: GuestUnitOfWork,
  ) {}

  @Get('request-options')
  @Operation('listGuestRequestOptions')
  options(@Req() req: GuardedRequest, @Res({ passthrough: true }) reply: Reply) {
    guestHeaders(reply);
    const g = guestOf(req);
    return this.db.withContext(
      guestContext(g),
      async (tx) => ({
        data: await this.requests.options(tx, await this.portal.activeStay(tx, g)),
      }),
      { readOnly: true },
    );
  }

  @Get('requests')
  @Operation('listMyRequests')
  mine(@Req() req: GuardedRequest, @Res({ passthrough: true }) reply: Reply) {
    guestHeaders(reply);
    const g = guestOf(req);
    return this.db.withContext(
      guestContext(g),
      async (tx) => {
        await this.portal.activeStay(tx, g);
        return { data: await this.requests.listMine(tx, g) };
      },
      { readOnly: true },
    );
  }

  @Post('requests')
  @Operation('createGuestRequest')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    guestHeaders(reply);
    const g = guestOf(req);
    const result = await this.uow.run(req, g, async (tx) => ({
      status: 201,
      body: await this.requests.create(tx, g, await this.portal.activeStay(tx, g), obj(body)),
    }));
    return applyResult(reply, result);
  }
}

@Controller('v1/properties/:propertyId/guest-requests')
export class GuestRequestsStaffController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(GuestRequestsService) private readonly requests: GuestRequestsService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
  ) {}

  private principal(req: GuardedRequest) {
    const p = req.ottimoAuth?.principal;
    if (!p?.propertyId) throw problem('UNAUTHENTICATED');
    return p;
  }

  private read<T>(req: GuardedRequest, fn: (tx: Tx) => Promise<T>): Promise<T> {
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    return this.db.withContext(tenantOf(this.principal(req)), fn, { readOnly: true });
  }

  @Get()
  @Operation('listGuestRequests')
  list(@Req() req: GuardedRequest, @Query('status') status?: string) {
    const p = this.principal(req);
    return this.read(req, async (tx) => ({
      data: await this.requests.list(tx, { userId: p.userId, roles: p.roles }, status),
    }));
  }

  @Post(':requestId/actions/:action')
  @Operation('transitionGuestRequest')
  async transition(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('requestId') requestId: string,
    @Param('action') action: string,
    @Body() body: unknown,
  ) {
    const p = this.principal(req);
    if (!UUID.test(requestId) || !(ACTIONS as readonly string[]).includes(action)) {
      throw problem('NOT_FOUND');
    }
    const result = await this.uow.run<Record<string, unknown>>(req, async (tx) => ({
      status: 200,
      body: await this.requests.transition(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        requestId,
        action,
        obj(body),
      ),
    }));
    return applyResult(reply, result);
  }
}
