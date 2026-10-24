/**
 * EP11 sale endpoints (R2): calculateQuote, listQuotes, saveQuote, getQuote, getQuoteText, withdrawQuote,
 * createHoldFromQuote; leads: listLeads, createLead, changeLeadStage; listCommissions (US-087 AC2).
 * Field visibility (commission → OWN/MGR/SAL/CTV, ottimoRemainingVnd → not CTV) is applied by the shared
 * role serializer from x-visible-to; scope M (own) is filtered in SQL by the services.
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
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { LEAD_STATUSES, QUOTE_STATUSES } from '../../../db/schema/sales';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { parseLimit } from '../../../shared/http/pagination';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { rejectDryRun } from '../../../shared/http/dry-run';
import { problem } from '../../../shared/problem';
import { localDateSchema, parseBody } from '../../platform/public/validation';
import { ApprovalService } from '../../approvals/public/approval.service';
import { requireReason } from '../../../shared/validation';
import { PropertyContextService } from '../../platform/public/property-context';
import { LeadsService } from '../public/leads.service';
import { CommissionsService } from './commissions.service';
import { type QuoteInput, QuotePricingService } from './quote-pricing';
import { type Locale, QuotesService } from './quotes.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = z.string().regex(UUID);
const count = (min: number) => z.number().int().min(min).max(50);

const quoteInput = z.object({
  type: z.enum(['short', 'long']),
  roomId: uuid.optional(),
  roomGroupId: uuid.optional(),
  arrivalDate: localDateSchema,
  // SEC-BE-28: short stays end far below this (BR-108/112 reject ≥ 28 nights with field codes).
  nights: z.number().int().min(1).max(60).optional(),
  termMonths: z.number().int().min(1).max(120).optional(),
  adults: count(1),
  children6to11: count(0).optional(),
  childrenUnder6: count(0).optional(),
  guestCategory: z.enum(['vn', 'foreigner']).optional(),
  cleaningPerWeek: z.number().int().min(0).max(3).optional(),
  channelId: uuid,
  closerUserId: uuid.optional(),
  returnGuestCode: z.string().max(40).optional(),
});

// US-155 AC2 (0.3.7 bổ sung 2 – BE-D R3 S1): a quote answering a website booking request.
const saveInput = quoteInput.extend({
  guestId: uuid,
  leadId: uuid.optional(),
  websiteBookingRequestId: uuid.optional(),
});

const holdInput = z.object({
  holdHours: z.number().int().min(1).max(168),
  depositMethod: z.enum(['vietqr', 'bank_transfer', 'cash', 'vnpay', 'momo']).optional(),
});

const extendInput = z.object({ reason: z.string().max(500).optional() });

const leadInput = z.object({
  guestId: uuid,
  need: z.string().max(500).optional(),
  source: z.string().max(40).optional(),
});

const stageInput = z.object({
  toStage: z.enum(LEAD_STATUSES),
  lostReasonCode: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

/** A replayed answer stored as `{ id }` only (UseCaseResult.storeBody = false). */
function idOnly(body: Record<string, unknown> | null): body is { id: string } {
  return !!body && typeof body.id === 'string' && Object.keys(body).length === 1;
}

function caller(req: GuardedRequest) {
  const p = principal(req);
  return { userId: p.userId, roles: p.roles };
}

@Controller('v1/properties/:propertyId')
export class QuotesController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(QuotePricingService) private readonly pricing: QuotePricingService,
    @Inject(QuotesService) private readonly quotes: QuotesService,
    @Inject(LeadsService) private readonly leads: LeadsService,
    @Inject(CommissionsService) private readonly commissions: CommissionsService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
  ) {}

  @Post('quotes/calculate')
  @HttpCode(200)
  @Operation('calculateQuote')
  async calculate(@Req() req: GuardedRequest, @Body() body: unknown) {
    const input = parseBody(quoteInput, body) as QuoteInput;
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => (await this.pricing.calculate(tx, caller(req), input)).calc,
      { readOnly: true },
    );
  }

  @Get('quotes')
  @Operation('listQuotes')
  async list(
    @Req() req: GuardedRequest,
    @Query() query: { status?: string; cursor?: string; limit?: string },
  ) {
    if (
      query.status !== undefined &&
      !(QUOTE_STATUSES as readonly string[]).includes(query.status)
    ) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'status', code: 'NOT_IN_LIST' }] });
    }
    const limit = parseLimit(query.limit, 50);
    return this.db.withContext(
      tenantOf(principal(req)),
      (tx) =>
        this.quotes.list(tx, caller(req), {
          status: query.status as (typeof QUOTE_STATUSES)[number] | undefined,
          cursor: query.cursor,
          limit,
        }),
      { readOnly: true },
    );
  }

  @Post('quotes')
  @Operation('saveQuote')
  async save(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    rejectDryRun(body);
    const input = parseBody(saveInput, body) as QuoteInput & {
      guestId: string;
      leadId?: string;
      websiteBookingRequestId?: string;
    };
    const result = await this.uow.run(req, async (tx) => ({
      status: 201,
      body: await this.quotes.save(tx, caller(req), input, req.id),
    }));
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Get('quotes/:quoteId')
  @Operation('getQuote')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('quoteId') quoteId: string,
  ) {
    if (!UUID.test(quoteId)) throw problem('NOT_FOUND');
    const body = await this.db.withContext(
      tenantOf(principal(req)),
      (tx) => this.quotes.get(tx, caller(req), quoteId),
      { readOnly: true },
    );
    reply.header('etag', etag(body.version as number));
    return body;
  }

  @Get('quotes/:quoteId/text')
  @Operation('getQuoteText')
  async text(
    @Req() req: GuardedRequest,
    @Param('quoteId') quoteId: string,
    @Query('locale') locale?: string,
  ) {
    if (!UUID.test(quoteId)) throw problem('NOT_FOUND');
    if (locale !== 'vi' && locale !== 'en' && locale !== 'ru') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'locale', code: locale === undefined ? 'REQUIRED' : 'NOT_IN_LIST' }],
      });
    }
    return this.db.withContext(
      tenantOf(principal(req)),
      (tx) => this.quotes.text(tx, caller(req), quoteId, locale as Locale),
      { readOnly: true },
    );
  }

  @Post('quotes/:quoteId/actions/withdraw')
  @Operation('withdrawQuote')
  async withdraw(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('quoteId') quoteId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(quoteId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.quotes.withdraw(tx, caller(req), quoteId, req.id),
    }));
    return applyResult(reply, result);
  }

  @Post('quotes/:quoteId/actions/extend')
  @Operation('extendQuote')
  async extend(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('quoteId') quoteId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(quoteId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(extendInput, body ?? {});
    const reason = input.reason === undefined ? null : requireReason('reason', input.reason);
    const version = expectedVersion(req);
    const result = await this.uow.run(req, async (tx) => {
      const out = await this.quotes.extend(tx, caller(req), quoteId, version, reason, req.id);
      if (out.status === 202) {
        return {
          status: 202,
          body: (await this.approvals.toDto(tx, out.body)) as unknown as Record<string, unknown>,
        };
      }
      return { status: 200, body: out.body };
    });
    if (result.status === 200) reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Post('quotes/:quoteId/actions/create-hold')
  @Operation('createHoldFromQuote')
  async createHold(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('quoteId') quoteId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(quoteId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(holdInput, body);
    // R2: VNPay/MoMo are hidden until the gateways exist (R3, ESC-010).
    const depositMethod = input.depositMethod ?? 'vietqr';
    if (depositMethod === 'vnpay' || depositMethod === 'momo') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'depositMethod', code: 'NOT_IN_LIST' }],
      });
    }
    let result = await this.uow.run(req, async (tx) => {
      const view = await this.quotes.createHold(
        tx,
        caller(req),
        quoteId,
        { holdHours: input.holdHours, depositMethod },
        req.id,
      );
      // US-155 (SEC FB-R3-SEC-US155-01): a hold of a website request (only those are `website` from a quote)
      // keeps only its id in the idempotency store – the sender's contact never outlives WR8 / T19 there.
      return {
        status: 201,
        body: view,
        ...(view.directSource === 'website' ? { storeBody: false } : {}),
      };
    });
    if (result.replayed && idOnly(result.body)) {
      const id = result.body.id as string;
      result = {
        ...result,
        body: await this.db.withContext(
          tenantOf(principal(req)),
          (tx) => this.quotes.reservationView(tx, id),
          { readOnly: true },
        ),
      };
    }
    if (typeof result.body.version === 'number') reply.header('etag', etag(result.body.version));
    return applyResult(reply, result);
  }

  // ───────────── leads (SM-09) ─────────────

  @Get('leads')
  @Operation('listLeads')
  async listLeads(@Req() req: GuardedRequest, @Query() query: { cursor?: string; limit?: string }) {
    const limit = parseLimit(query.limit, 50);
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => {
        const { timezone } = await this.property.now(tx);
        return this.leads.list(tx, caller(req), { cursor: query.cursor, limit }, timezone);
      },
      { readOnly: true },
    );
  }

  @Post('leads')
  @Operation('createLead')
  async createLead(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    rejectDryRun(body);
    const input = parseBody(leadInput, body);
    const result = await this.uow.run(req, async (tx) => {
      const { timezone } = await this.property.now(tx);
      return {
        status: 201,
        body: await this.leads.create(tx, caller(req), input, timezone, req.id),
      };
    });
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Post('leads/:leadId/actions/change-stage')
  @Operation('changeLeadStage')
  async changeStage(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('leadId') leadId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(leadId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(stageInput, body);
    const version = expectedVersion(req);
    const result = await this.uow.run(req, async (tx) => {
      const { timezone } = await this.property.now(tx);
      return {
        status: 200,
        body: await this.leads.changeStage(
          tx,
          caller(req),
          leadId,
          version,
          input,
          timezone,
          req.id,
        ),
      };
    });
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  // ───────────── commissions (US-087 AC2 – projected only in R2) ─────────────

  @Get('commissions')
  @Operation('listCommissions')
  async listCommissions(
    @Req() req: GuardedRequest,
    @Query()
    query: { status?: string; dateFrom?: string; dateTo?: string; cursor?: string; limit?: string },
  ) {
    const statuses = query.status ? query.status.split(',') : [];
    const allowed = ['projected', 'earned', 'payable', 'paid', 'void'];
    const errors = [];
    if (statuses.some((s) => !allowed.includes(s)))
      errors.push({ field: 'status', code: 'NOT_IN_LIST' });
    for (const k of ['dateFrom', 'dateTo'] as const) {
      const v = query[k];
      if (v !== undefined && !localDateSchema.safeParse(v).success) {
        errors.push({ field: k, code: 'DATE_INVALID' });
      }
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const limit = parseLimit(query.limit, 50);
    return this.db.withContext(
      tenantOf(principal(req)),
      (tx) =>
        this.commissions.list(tx, caller(req), {
          statuses,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          cursor: query.cursor,
          limit,
        }),
      { readOnly: true },
    );
  }
}
