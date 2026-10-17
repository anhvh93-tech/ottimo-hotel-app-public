/**
 * Dashboard endpoints (OpenAPI tag dashboard, S02 – OWN/MGR/FDL/FD by x-roles in the guard):
 * - getTonightKpi          GET /v1/properties/{propertyId}/dashboard/tonight
 * - getArrivalsDepartures  GET /v1/properties/{propertyId}/arrivals-departures?date=
 * Read-only tenant transaction (RLS). listAttentionItems / resolveAttentionEvent live in the events module.
 */
import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { problem } from '../../../shared/problem';
import { DashboardService } from './dashboard.service';

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p?.propertyId) throw problem('UNAUTHENTICATED');
  return p;
}

@Controller('v1/properties/:propertyId')
export class DashboardController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(DashboardService) private readonly dashboard: DashboardService,
  ) {}

  private read<T>(req: GuardedRequest, fn: (tx: Tx) => Promise<T>): Promise<T> {
    // SEC-BE-33 second line: a read never runs on a role the guard refused.
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    return this.db.withContext(tenantOf(principal(req)), fn, { readOnly: true });
  }

  @Get('dashboard/tonight')
  @Operation('getTonightKpi')
  tonight(@Req() req: GuardedRequest) {
    return this.read(req, (tx) => this.dashboard.tonight(tx));
  }

  @Get('arrivals-departures')
  @Operation('getArrivalsDepartures')
  arrivalsDepartures(@Req() req: GuardedRequest, @Query('date') date?: string) {
    const p = principal(req);
    return this.read(req, (tx) => this.dashboard.arrivalsDepartures(tx, p.roles, date));
  }
}
