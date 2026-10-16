/**
 * Refund endpoints (OpenAPI 0.3.6 A-33/A-41/A-42; EP03-05 mục 2.6): createRefundRequest, setRefundDestination,
 * getRefundDestination, executeCashRefund (A47a), executeRefund (A47).
 * C3 (D15): answers carry `Cache-Control: no-store` + `Pragma: no-cache`; setRefundDestination stores only the
 * masked answer for idempotent replay; getRefundDestination needs the trusted device (guard) and the step-up
 * window (SR-C3-09) and logs the view before answering (SR-C3-07).
 */
import {
  Body,
  Controller,
  Get,
  Inject,
  Optional,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { rejectDryRun } from '../../../shared/http/dry-run';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { paymentDto } from '../../folio/public/folio-view';
import type { PaymentRowLite } from '../../folio/public/folio.service';
import { C3AccessGate } from '../../crypto/public/c3-access-gate';
import { parseBody } from '../../platform/public/validation';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { RefundsService } from './refunds.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const money = z.number().int().max(Number.MAX_SAFE_INTEGER);

const createSchema = z.object({ amountVnd: money, reason: z.string().max(500) });
const destinationSchema = z.object({
  method: z.enum(['cash', 'bank_transfer', 'original_method']),
  bankBin: z.string().max(16).optional(),
  accountNo: z.string().max(32).optional(),
  accountHolder: z.string().max(200).optional(),
});
const cashSchema = z.object({
  amountVnd: money,
  paidAt: z.string().max(40),
  attachmentId: z.string().regex(UUID).optional(),
  note: z.string().max(300).optional(),
});
const transferSchema = z.object({
  amountVnd: money,
  paidAt: z.string().max(40),
  bankReference: z.string().max(64).optional(),
  attachmentId: z.string().regex(UUID).optional(),
  note: z.string().max(300).optional(),
});

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

function noStore(reply: Reply): void {
  reply.header('cache-control', 'no-store');
  reply.header('pragma', 'no-cache');
}

@Controller('v1/properties/:propertyId')
export class RefundsController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(RefundsService) private readonly refunds: RefundsService,
    @Inject(C3AccessGate) private readonly gate: C3AccessGate,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
  ) {}

  @Post('folios/:folioId/refund-requests')
  @Operation('createRefundRequest')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(createSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const { rows } = await tx.query<{ primary_reservation_id: string }>(
        'SELECT primary_reservation_id FROM folio WHERE id = $1',
        [folioId],
      );
      if (!rows[0]) throw problem('NOT_FOUND');
      const own = this.reservations
        ? await this.reservations.ownership(tx, rows[0].primary_reservation_id)
        : null;
      const row = await this.refunds.create(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        folioId,
        { amountVnd: input.amountVnd, reason: input.reason },
        own?.code ?? null,
      );
      return { status: 201, body: await this.refunds.dto(tx, row) };
    });
    return applyResult(reply, result);
  }

  @Put('approval-requests/:approvalId/refund-destination')
  @Operation('setRefundDestination')
  async setDestination(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
    @Body() body: unknown,
  ) {
    noStore(reply);
    if (!UUID.test(approvalId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(destinationSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.refunds.setDestination(
        tx,
        {
          userId: p.userId,
          roles: p.roles,
          requestId: req.id,
          sessionId: p.sessionId,
          trustedDeviceId: p.trustedDeviceId,
        },
        approvalId,
        input,
      );
      return { status: 200, body: await this.refunds.dto(tx, row) };
    });
    return applyResult(reply, result);
  }

  @Get('approval-requests/:approvalId/refund-destination')
  @Operation('getRefundDestination')
  async getDestination(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
  ) {
    noStore(reply);
    if (!UUID.test(approvalId)) throw problem('NOT_FOUND');
    const p = principal(req);
    // SEC B3 order: device + role (guard) → step-up window (401 REAUTH_REQUIRED) → log → data.
    await this.gate.assertStepUp(p);
    return this.db.withContext(tenantOf(p), (tx: Tx) =>
      this.refunds.getDestination(tx, p, approvalId, req.id),
    );
  }

  @Post('approval-requests/:approvalId/actions/execute-cash-refund')
  @Operation('executeCashRefund')
  async executeCash(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(approvalId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(cashSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.refunds.executeCash(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        approvalId,
        {
          amountVnd: input.amountVnd,
          paidAt: input.paidAt,
          attachmentId: input.attachmentId ?? null,
          bankReference: null,
          note: input.note,
        },
      );
      return { status: 201, body: await this.view(tx, row) };
    });
    return applyResult(reply, result);
  }

  @Post('approval-requests/:approvalId/actions/execute-refund')
  @Operation('executeRefund')
  async executeTransfer(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(approvalId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(transferSchema, body);
    const p = principal(req);
    // PO 17/10 (SEC-37): an OWN who requested / approved / routed this refund pays it only inside the step-up
    // window (re-auth at every step); the rule itself is checked again under the locks (RefundsService).
    if (p.roles.includes('owner')) {
      const self = await this.db.withContext(
        tenantOf(p),
        (tx: Tx) => this.refunds.isOwnSelfPayout(tx, approvalId, p.userId),
        { readOnly: true },
      );
      if (self) await this.gate.assertStepUp(p);
    }
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.refunds.executeTransfer(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        approvalId,
        {
          amountVnd: input.amountVnd,
          paidAt: input.paidAt,
          attachmentId: input.attachmentId ?? null,
          bankReference: input.bankReference?.trim() || null,
          note: input.note,
        },
      );
      return { status: 201, body: await this.view(tx, row) };
    });
    return applyResult(reply, result);
  }

  private async view(tx: Tx, row: PaymentRowLite & { folio_id?: string }) {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    return paymentDto(row, rows[0]?.timezone ?? 'Asia/Ho_Chi_Minh', {
      ...(row.folio_id ? { folioId: row.folio_id } : {}),
    });
  }
}
