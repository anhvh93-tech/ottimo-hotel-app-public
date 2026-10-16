/**
 * confirmDeposit (B4, US-086 AC1/AC2/AC5) and createDepositNotice (A53, US-086 AC4) – paths under
 * /reservations/{id}, implemented by payments (BE-B) through the reservations port (BE-A).
 * Body checks happen before the unit of work; the card number never enters (R-PAY-01, V-09).
 */
import { Body, Controller, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { type FieldError, problem } from '../../../shared/problem';
import { optionalText } from '../../../shared/validation';
import { parseBody } from '../../platform/public/validation';
import { type DepositPaymentInput, DepositsService } from './deposits.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const money = z.number().int().max(Number.MAX_SAFE_INTEGER);

const paymentCreate = z.object({
  type: z.string(),
  method: z.string(),
  amountVnd: money,
  receivedAt: z.string().optional(),
  posAuthCode: z.string().max(12).optional(),
  note: z.string().max(300).optional(),
  billingPeriodId: z.string().optional(),
  attachmentId: z.string().optional(),
});

const confirmSchema = z.object({
  payment: paymentCreate.optional(),
  existingPaymentId: z.string().regex(UUID).optional(),
});

const noticeSchema = z.object({
  amountVnd: money,
  attachmentId: z.string().optional(),
  note: z.string().max(500).optional(),
});

const DEPOSIT_METHODS = ['vietqr', 'bank_transfer', 'cash', 'card_pos'] as const;

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

/** BA EP02 10.6 field rules of `payment` (all errors at once). */
export function depositPayment(raw: z.infer<typeof paymentCreate>): DepositPaymentInput {
  const errors: FieldError[] = [];
  if (raw.type !== 'deposit') errors.push({ field: 'payment.type', code: 'NOT_IN_LIST' });
  if (!(DEPOSIT_METHODS as readonly string[]).includes(raw.method)) {
    errors.push({ field: 'payment.method', code: 'NOT_IN_LIST' });
  }
  if (raw.amountVnd <= 0) errors.push({ field: 'payment.amountVnd', code: 'AMOUNT_NOT_POSITIVE' });
  let receivedAt: Date | null = null;
  if (raw.receivedAt !== undefined) {
    const t = ISO_INSTANT.test(raw.receivedAt) ? Date.parse(raw.receivedAt) : Number.NaN;
    if (Number.isNaN(t)) errors.push({ field: 'payment.receivedAt', code: 'DATE_INVALID' });
    else receivedAt = new Date(t);
  }
  const auth = raw.posAuthCode?.trim() || null;
  if (raw.method === 'card_pos' && !auth) {
    errors.push({ field: 'payment.posAuthCode', code: 'REQUIRED' });
  }
  if (auth && !/^[A-Za-z0-9]{1,12}$/.test(auth)) {
    errors.push({ field: 'payment.posAuthCode', code: 'VALIDATION_FAILED' });
  }
  // Long-stay billing periods (US-119 AC5) are R3; uploads of receipts arrive with the attachment module.
  if (raw.billingPeriodId !== undefined) {
    errors.push({ field: 'payment.billingPeriodId', code: 'NOT_IN_LIST' });
  }
  if (raw.attachmentId !== undefined) {
    errors.push({ field: 'payment.attachmentId', code: 'NOT_IN_LIST' });
  }
  if (errors.length) throw problem('VALIDATION_FAILED', { errors });
  return {
    method: raw.method as DepositPaymentInput['method'],
    amountVnd: raw.amountVnd,
    receivedAt,
    posAuthCode: auth,
    note: optionalText('payment.note', raw.note, 300),
  };
}

@Controller('v1/properties/:propertyId/reservations/:reservationId')
export class DepositsController {
  constructor(
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(DepositsService) private readonly deposits: DepositsService,
  ) {}

  @Post('actions/confirm-deposit')
  @Operation('confirmDeposit')
  async confirm(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
    const input = parseBody(confirmSchema, body);
    if ((input.payment === undefined) === (input.existingPaymentId === undefined)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'payment', code: 'REQUIRED' }] });
    }
    const payment = input.payment ? depositPayment(input.payment) : null;
    const version = expectedVersion(req);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const out = await this.deposits.confirm(
        tx,
        { userId: p.userId, roles: p.roles },
        reservationId,
        version,
        { payment, existingPaymentId: input.existingPaymentId ?? null },
        req.id,
      );
      return 'fail' in out ? out : { status: 200, body: out.body };
    });
    if (typeof result.body.version === 'number') reply.header('etag', etag(result.body.version));
    return applyResult(reply, result);
  }

  @Post('deposit-notices')
  @Operation('createDepositNotice')
  async notice(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
    const input = parseBody(noticeSchema, body);
    const errors: FieldError[] = [];
    if (input.amountVnd <= 0) errors.push({ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' });
    // Receipt images need uploadAttachment (registration/attachments, Sprint 3) – refused until then.
    if (input.attachmentId !== undefined)
      errors.push({ field: 'attachmentId', code: 'NOT_IN_LIST' });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const note = optionalText('note', input.note, 500);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      await this.deposits.notice(
        tx,
        { userId: p.userId, roles: p.roles },
        reservationId,
        { amountVnd: input.amountVnd, note },
        req.id,
      );
      return { status: 202, body: null };
    });
    applyResult(reply, result);
  }
}
