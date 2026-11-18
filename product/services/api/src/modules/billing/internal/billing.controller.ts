/**
 * Long stay billing (OpenAPI 0.3.14-draft tag `billing`, contract FB-INV-012 mục 5). Every response `no-store`.
 * - listMeterReadings          GET  /v1/properties/{propertyId}/reservations/{reservationId}/meter-readings
 * - recordMeterReading         POST …/reservations/{reservationId}/meter-readings              (Idempotency-Key)
 * - voidMeterReading           POST …/meter-readings/{readingId}/void                          (Idempotency-Key)
 * - listBillingCandidates      GET  …/billing-periods/candidates?month=
 * - createBillingPeriod        POST …/reservations/{reservationId}/billing-periods             (Idempotency-Key)
 * - listBillingPeriods         GET  …/billing-periods
 * - getBillingPeriod           GET  …/billing-periods/{billingPeriodId}                         (ETag)
 * - updateBillingPeriod        PATCH …/billing-periods/{billingPeriodId}                        (If-Match)
 * - issueBillingPeriod         POST …/billing-periods/{billingPeriodId}/issue                   (If-Match + Idempotency-Key)
 * - voidBillingPeriod          POST …/billing-periods/{billingPeriodId}/void                    (Idempotency-Key)
 * - recordBillingPeriodPayment POST …/billing-periods/{billingPeriodId}/payments                (Idempotency-Key)
 * - getBillingPeriodPrint      GET  …/billing-periods/{billingPeriodId}/print   (audit billing_period.printed)
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { MeterReadingsService } from './meter-readings.service';
import { AuditService } from '../../audit/public/audit.service';
import { recordUseCaseDenial } from '../../audit/public/use-case-denial';
import { OUTSIDE_DESK_OWNER_ONLY, StatementsService } from './statements.service';
import { type BillingActor, UUID } from './stay';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

@Controller('v1/properties/:propertyId')
export class BillingController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(MeterReadingsService) private readonly meters: MeterReadingsService,
    @Inject(StatementsService) private readonly statements: StatementsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private principal(req: GuardedRequest) {
    const p = req.ottimoAuth?.principal;
    if (!p?.propertyId) throw problem('UNAUTHENTICATED');
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    return p;
  }

  private actor(req: GuardedRequest): BillingActor {
    const p = req.ottimoAuth?.principal;
    if (!p?.propertyId) throw problem('UNAUTHENTICATED');
    return { userId: p.userId, roles: p.roles, requestId: req.id };
  }

  private read<T>(
    req: GuardedRequest,
    reply: Reply,
    fn: (tx: Parameters<Parameters<Database['withContext']>[1]>[0], a: BillingActor) => Promise<T>,
  ) {
    const p = this.principal(req);
    reply.header('Cache-Control', 'no-store');
    return this.db.withContext(tenantOf(p), (tx) => fn(tx, this.actor(req)), { readOnly: true });
  }

  private async write(
    req: GuardedRequest,
    reply: Reply,
    status: number,
    fn: (tx: Parameters<Parameters<UnitOfWork['run']>[1]>[0], a: BillingActor) => Promise<unknown>,
  ) {
    const a = this.actor(req);
    reply.header('Cache-Control', 'no-store');
    const result = await this.uow.run(req, async (tx) => {
      const out = await fn(tx, a);
      return { status, body: out };
    });
    const version = (result.body as { version?: unknown } | null)?.version;
    if (typeof version === 'number') reply.header('ETag', `"${version}"`);
    return applyResult(reply, result);
  }

  // ───────────── meter readings (A88 / A89) ─────────────

  @Get('reservations/:reservationId/meter-readings')
  @Operation('listMeterReadings')
  listReadings(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') id: string,
  ) {
    return this.read(req, reply, (tx) => this.meters.list(tx, id));
  }

  @Post('reservations/:reservationId/meter-readings')
  @Operation('recordMeterReading')
  recordReading(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') id: string,
    @Body() body: unknown,
  ) {
    return this.write(req, reply, 201, (tx, a) => this.meters.record(tx, a, id, body));
  }

  @Post('meter-readings/:readingId/void')
  @HttpCode(200)
  @Operation('voidMeterReading')
  voidReading(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('readingId') id: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    return this.write(req, reply, 200, (tx, a) => this.meters.void(tx, a, id, body));
  }

  // ───────────── statements (A121 / A122 / A58) ─────────────

  @Get('billing-periods/candidates')
  @Operation('listBillingCandidates')
  candidates(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Query('month') month?: string,
  ) {
    return this.read(req, reply, (tx, a) => this.statements.candidates(tx, a, month));
  }

  @Post('reservations/:reservationId/billing-periods')
  @Operation('createBillingPeriod')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') id: string,
    @Body() body: unknown,
  ) {
    return this.write(
      req,
      reply,
      201,
      async (tx, a) => (await this.statements.create(tx, a, id, body)).body,
    );
  }

  @Get('billing-periods')
  @Operation('listBillingPeriods')
  list(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Query() query: Record<string, string | undefined>,
  ) {
    return this.read(req, reply, (tx, a) =>
      this.statements.list(tx, a, {
        status: query.status,
        month: query.month,
        overdue: query.overdue,
        roomId: query.roomId,
        cursor: query.cursor,
        limit: query.limit,
      }),
    );
  }

  @Get('billing-periods/:billingPeriodId')
  @Operation('getBillingPeriod')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    const out = await this.read(req, reply, (tx, a) => this.statements.get(tx, a, id));
    reply.header('ETag', `"${out.version}"`);
    return out.body;
  }

  @Patch('billing-periods/:billingPeriodId')
  @HttpCode(200)
  @Operation('updateBillingPeriod')
  update(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    return this.write(
      req,
      reply,
      200,
      async (tx, a) =>
        (await this.statements.update(tx, a, id, body, req.ottimoAuth?.ifMatchVersion)).body,
    );
  }

  @Post('billing-periods/:billingPeriodId/issue')
  @HttpCode(200)
  @Operation('issueBillingPeriod')
  issue(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    return this.write(
      req,
      reply,
      200,
      async (tx, a) =>
        (await this.statements.issue(tx, a, id, body, req.ottimoAuth?.ifMatchVersion)).body,
    );
  }

  @Post('billing-periods/:billingPeriodId/void')
  @HttpCode(200)
  @Operation('voidBillingPeriod')
  voidStatement(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    return this.write(
      req,
      reply,
      200,
      async (tx, a) =>
        (await this.statements.void(tx, a, id, body, req.ottimoAuth?.ifMatchVersion)).body,
    );
  }

  @Post('billing-periods/:billingPeriodId/payments')
  @Operation('recordBillingPeriodPayment')
  pay(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    return this.write(req, reply, 201, (tx, a) => this.statements.recordPayment(tx, a, id, body));
  }

  /**
   * FB-INV-012 §12.2 (A128): "đã thu ngoài Desk" – x-roles OWN/MGR + trusted device from the spec (SEC 12-02); a
   * manager outside the go-live scope → 403 + exactly one access.denied (written after the rollback).
   */
  @Post('billing-periods/:billingPeriodId/settle-outside-desk')
  @Operation('settleBillingPeriodOutsideDesk')
  async settleOutsideDesk(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    try {
      return await this.write(req, reply, 201, (tx, a) =>
        this.statements.settleOutsideDesk(tx, a, id, body, req.ottimoAuth?.ifMatchVersion),
      );
    } catch (err) {
      await recordUseCaseDenial(this.audit, req, err, 'settleBillingPeriodOutsideDesk', [
        OUTSIDE_DESK_OWNER_ONLY,
      ]);
      throw err;
    }
  }

  @Get('billing-periods/:billingPeriodId/print')
  @Operation('getBillingPeriodPrint')
  print(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('billingPeriodId') id: string,
  ) {
    if (!UUID.test(id)) throw problem('NOT_FOUND');
    const p = this.principal(req);
    reply.header('Cache-Control', 'no-store');
    // Not read-only: the print is audited (billing_period.printed, contract 9.5).
    return this.db.withContext(tenantOf(p), (tx) => this.statements.print(tx, this.actor(req), id));
  }
}
