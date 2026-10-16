/**
 * Minibar endpoints (OpenAPI 0.3.3 E05-04; US-035, US-003): recordMinibarCheck (A37 – FD+ and HK "today"),
 * getMinibarStandard. Money fields are removed for HK by the role serializer (x-visible-to, rbac note 26).
 */
import { Body, Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { rejectDryRun } from '../../../shared/http/dry-run';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { parseInstant } from '../../payments/public/payment.service';
import { parseBody } from '../../platform/public/validation';
import { MinibarService } from './minibar.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const checkSchema = z.object({
  mode: z.enum(['checkout', 'stayover']),
  lines: z
    .array(
      z.object({ itemId: z.string().max(64), remainingQty: z.number().int().min(0).max(1000) }),
    )
    .max(100),
  performedAt: z.string().max(40).optional(),
});

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

@Controller('v1/properties/:propertyId/reservations/:reservationId')
export class MinibarController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(MinibarService) private readonly minibar: MinibarService,
  ) {}

  @Post('minibar-checks')
  @Operation('recordMinibarCheck')
  async record(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(checkSchema, body);
    const performedAt = parseInstant('performedAt', input.performedAt ?? null);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 201,
      body: await this.minibar.record(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        reservationId,
        { mode: input.mode, lines: input.lines, performedAt },
      ),
    }));
    return applyResult(reply, result);
  }

  @Get('minibar-standard')
  @Operation('getMinibarStandard')
  async standard(@Req() req: GuardedRequest, @Param('reservationId') reservationId: string) {
    if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
    const p = principal(req);
    return this.db.withContext(
      tenantOf(p),
      (tx) => this.minibar.standard(tx, p.roles, reservationId),
      { readOnly: true },
    );
  }
}
