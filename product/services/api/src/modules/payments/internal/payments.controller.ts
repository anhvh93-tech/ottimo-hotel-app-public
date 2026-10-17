/**
 * Payments endpoints of Sprint 3 (OpenAPI 0.3.6; EP03-05 mục 2): recordPayment, listPayments,
 * confirmPaymentReceived, reconcilePayment, confirmCashHandover, reversePayment, createVietQr.
 * Body checks happen before the unit of work; never a card number (R-PAY-01, V-09). Scope M (SAL/CTV) → 404.
 */
import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { rejectDryRun } from '../../../shared/http/dry-run';
import { Operation } from '../../../shared/http/operation';
import { parseLimit } from '../../../shared/http/pagination';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { toZonedIso } from '../../../shared/time';
import { paymentDto } from '../../folio/public/folio-view';
import type { PaymentRowLite } from '../../folio/public/folio.service';
import { parseBody } from '../../platform/public/validation';
import { type ListPaymentsQuery, PaymentsService } from './payments.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const money = z.number().int().max(Number.MAX_SAFE_INTEGER);
const ROLES = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
  'housekeeping',
  'maintenance',
] as const;
const METHODS = ['vietqr', 'bank_transfer', 'cash', 'card_pos', 'vnpay', 'momo', 'ota_collect'];
const STATUSES = ['pending', 'succeeded', 'failed', 'expired', 'reversed'];

export const paymentCreateSchema = z.object({
  type: z.string().max(40),
  method: z.string().max(40),
  amountVnd: money,
  receivedAt: z.string().max(40).optional(),
  // V-09 before the length (BUG-R2-043): a card number answers CARD_NUMBER_DETECTED, not TOO_LONG.
  posAuthCode: z.string().max(64).optional(),
  note: z.string().max(300).optional(),
  billingPeriodId: z.string().max(64).optional(),
  attachmentId: z.string().max(64).optional(),
});

const confirmSchema = z
  .object({
    receivedAt: z.string().max(40).optional(),
    note: z.string().max(300).optional(),
    attachmentId: z.string().regex(UUID).optional(),
  })
  .optional();

const reconcileSchema = z.object({
  result: z.enum(['reconciled', 'disputed']),
  note: z.string().max(300).optional(),
});

const handoverSchema = z.object({
  result: z.enum(['received', 'short']),
  receivedAmountVnd: money.optional(),
  note: z.string().max(300).optional(),
});

const reverseSchema = z.object({ reason: z.string().max(500) });

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// 0.3.7 (BUG-R2-038 / S4-47; S4-10): `check_in` / `check_out` QR at the desk steps, with the time inputs of
// previewCheckIn / getCheckoutSummary that the cap is computed from (purpose cross-checks in the service).
const vietQrSchema = z.object({
  amountVnd: money,
  purpose: z.enum(['deposit', 'balance', 'check_in', 'check_out', 'billing_period']).optional(),
  checkinTime: z.string().regex(TIME).optional(),
  addPriorNight: z.boolean().optional(),
  priorNightRateVnd: money.optional(),
  checkoutAt: z.string().max(40).optional(),
  extraNightRateVnd: money.optional(),
  // 0.3.7 bổ sung 4 (BUG-R2-139, BR-416-06): `check_out` only – the late fee charged as one night.
  lateFeeAsNight: z.boolean().optional(),
  overBalanceReason: z.string().max(300).optional(),
});

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

function oneOf<T extends string>(field: string, raw: unknown, allowed: readonly T[]): T | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string' || !allowed.includes(raw as T)) {
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'NOT_IN_LIST' }] });
  }
  return raw as T;
}

@Controller('v1/properties/:propertyId')
export class PaymentsController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
  ) {}

  @Post('folios/:folioId/payments')
  @Operation('recordPayment')
  async record(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(paymentCreateSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.payments.record(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        folioId,
        input,
      );
      return { status: 201, body: await this.view(tx, row, p) };
    });
    return applyResult(reply, result);
  }

  @Get('payments')
  @Operation('listPayments')
  async list(@Req() req: GuardedRequest, @Query() query: Record<string, unknown>) {
    const q: ListPaymentsQuery = {
      reconciliation:
        oneOf('reconciliation', query.reconciliation, [
          'pending',
          'reconciled',
          'disputed',
          'not_required',
          'any',
        ] as const) ?? 'pending',
      receivedFrom: this.date('receivedFrom', query.receivedFrom),
      receivedTo: this.date('receivedTo', query.receivedTo),
      recordedBy: this.uuid('recordedBy', query.recordedBy),
      recordedByRole: oneOf('recordedByRole', query.recordedByRole, ROLES),
      method: oneOf('method', query.method, METHODS),
      status: oneOf('status', query.status, STATUSES),
      cursor: typeof query.cursor === 'string' ? query.cursor : null,
      limit: parseLimit(query.limit, 50),
    };
    const p = principal(req);
    return this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const out = await this.payments.list(tx, { userId: p.userId, roles: p.roles }, q);
        const data: Array<Record<string, unknown>> = [];
        for (const r of out.rows) {
          data.push({
            ...paymentDto(r, out.tz, {
              folioId: r.folio_id,
              ...(r.reservation_code ? { reservationCode: r.reservation_code } : {}),
              ...(await this.dueNow(tx, r, p)),
            }),
            hasAttachment: r.attachment_id !== null,
            ...PaymentsService.waiting(r, out),
          });
        }
        return {
          data,
          page: { nextCursor: out.nextCursor, limit: q.limit },
        };
      },
      { readOnly: true },
    );
  }

  @Post('payments/:paymentId/actions/confirm-received')
  @Operation('confirmPaymentReceived')
  async confirmReceived(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('paymentId') paymentId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(paymentId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(confirmSchema, body ?? undefined) ?? {};
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.payments.confirmReceived(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        paymentId,
        {
          receivedAt: input.receivedAt ?? null,
          note: input.note,
          attachmentId: input.attachmentId ?? null,
        },
      );
      return { status: 200, body: await this.view(tx, row, p) };
    });
    return applyResult(reply, result);
  }

  @Post('payments/:paymentId/actions/reconcile')
  @Operation('reconcilePayment')
  async reconcile(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('paymentId') paymentId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(paymentId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(reconcileSchema, body);
    const version = expectedVersion(req);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.payments.reconcile(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        paymentId,
        version,
        { result: input.result, note: input.note },
      );
      return { status: 200, body: await this.view(tx, row, p) };
    });
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Post('payments/:paymentId/actions/confirm-cash-handover')
  @Operation('confirmCashHandover')
  async confirmCashHandover(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('paymentId') paymentId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(paymentId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(handoverSchema, body);
    const version = expectedVersion(req);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.payments.confirmCashHandover(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        paymentId,
        version,
        {
          result: input.result,
          receivedAmountVnd: input.receivedAmountVnd ?? null,
          note: input.note,
        },
      );
      return { status: 200, body: await this.view(tx, row, p) };
    });
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Post('payments/:paymentId/actions/reverse')
  @Operation('reversePayment')
  async reverse(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('paymentId') paymentId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(paymentId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(reverseSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.payments.reverse(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        paymentId,
        input.reason,
      );
      return { status: 200, body: await this.view(tx, row, p) };
    });
    return applyResult(reply, result);
  }

  @Post('folios/:folioId/vietqr')
  @Operation('createVietQr')
  async createVietQr(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(vietQrSchema, body);
    let checkoutAt: Date | undefined;
    if (input.checkoutAt !== undefined) {
      if (Number.isNaN(Date.parse(input.checkoutAt))) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'checkoutAt', code: 'DATE_INVALID' }],
        });
      }
      checkoutAt = new Date(input.checkoutAt);
    }
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 201,
      // Only ids are kept for an idempotent replay (SEC-BE-43): never the payload with the account number.
      body: await this.payments.createVietQr(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        folioId,
        {
          amountVnd: input.amountVnd,
          purpose: input.purpose ?? null,
          overBalanceReason: input.overBalanceReason,
          stay: {
            ...(input.checkinTime !== undefined ? { checkinTime: input.checkinTime } : {}),
            ...(input.addPriorNight !== undefined ? { addPriorNight: input.addPriorNight } : {}),
            ...(input.priorNightRateVnd !== undefined
              ? { priorNightRateVnd: input.priorNightRateVnd }
              : {}),
            ...(checkoutAt ? { checkoutAt } : {}),
            ...(input.extraNightRateVnd !== undefined
              ? { extraNightRateVnd: input.extraNightRateVnd }
              : {}),
            ...(input.lateFeeAsNight !== undefined ? { lateFeeAsNight: input.lateFeeAsNight } : {}),
          },
        },
      ),
    }));
    const view = await this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const out = await this.payments.qrView(tx, result.body.paymentId);
        const tz = await this.tz(tx);
        return {
          ...out,
          payment: await this.view(tx, out.payment, p),
          receivingAccountChangedAt: toZonedIso(out.receivingAccountChangedAt, tz),
          expiredPaymentIds: result.body.expiredPaymentIds,
        };
      },
      { readOnly: true },
    );
    applyResult(reply, result);
    return view;
  }

  private async tz(tx: Tx): Promise<string> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    return rows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
  }

  private async view(
    tx: Tx,
    row: PaymentRowLite & { folio_id?: string },
    actor?: { userId: string; roles: readonly string[] },
  ): Promise<Record<string, unknown>> {
    const tz = await this.tz(tx);
    const code = row.reservation_id
      ? await this.payments.reservationCode(tx, row.reservation_id)
      : undefined;
    return paymentDto(row, tz, {
      ...(row.folio_id ? { folioId: row.folio_id } : {}),
      ...(code ? { reservationCode: code } : {}),
      ...(await this.dueNow(tx, row, actor)),
    });
  }

  /** 0.3.7 bổ sung 4 (DOM (f)): Payment.amountDueNowVnd of a pending VietQR. */
  private async dueNow(
    tx: Tx,
    row: PaymentRowLite & { folio_id?: string },
    actor?: { userId: string; roles: readonly string[] },
  ): Promise<{ amountDueNowVnd?: number }> {
    if (!actor || !row.folio_id || row.method !== 'vietqr' || row.status !== 'pending') return {};
    return {
      amountDueNowVnd: await this.payments.amountDueNow(tx, actor, {
        ...row,
        folio_id: row.folio_id,
      }),
    };
  }

  private date(field: string, raw: unknown): string | null {
    if (raw === undefined || raw === null || raw === '') return null;
    if (typeof raw !== 'string' || !DATE.test(raw) || Number.isNaN(Date.parse(raw))) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'DATE_INVALID' }] });
    }
    return raw;
  }

  private uuid(field: string, raw: unknown): string | null {
    if (raw === undefined || raw === null || raw === '') return null;
    if (typeof raw !== 'string' || !UUID.test(raw)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'NOT_IN_LIST' }] });
    }
    return raw;
  }
}
