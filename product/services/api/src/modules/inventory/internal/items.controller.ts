/**
 * Minibar catalogue endpoints (OpenAPI tag inventory; US-066, US-003 AC2) – BE-D Sprint 4:
 * - listItems   GET   /v1/properties/{propertyId}/items            OWN/MGR/FDL/FD/HK (cost price OWN/MGR only)
 * - createItem  POST  /v1/properties/{propertyId}/items            OWN/MGR (A91), Idempotency-Key, 201 + ETag
 * - updateItem  PATCH /v1/properties/{propertyId}/items/{itemId}   OWN/MGR (A91), If-Match, 200 + ETag
 */
import { Body, Controller, Get, Inject, Param, Patch, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { stripControlChars } from '../../../shared/validation';
import { parseBody } from '../../platform/public/validation';
import { ItemsService } from './items.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** erd 9.1b money bound (every VND amount of a catalogue/FOC ≤ 100.000.000). */
const MAX_VND = 100_000_000;

const text = (max: number) =>
  z
    .string()
    .transform((s) => stripControlChars(s).trim())
    .pipe(z.string().min(1).max(max));
/**
 * Whole numbers in [min, max]. zod 4 reports `.int()` as `invalid_type` without the input, which the shared mapper
 * reads as REQUIRED – a refinement keeps "2.5 chai" a VALIDATION_FAILED and the bounds VALUE_OUT_OF_RANGE.
 */
const whole = (min: number, max: number) =>
  z
    .number()
    .min(min)
    .max(max)
    .refine(Number.isInteger, { params: { code: 'VALIDATION_FAILED' } });
const vnd = whole(0, MAX_VND);

/** OpenAPI ItemInput (required: code, name, unit, minibarStandardQty). */
const itemInput = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{1,32}$/),
  name: z
    .object({
      vi: text(100).optional(),
      en: text(100).optional(),
      ru: text(100).optional(),
    })
    .refine((n) => !!(n.vi ?? n.en ?? n.ru), { path: ['vi'], params: { code: 'REQUIRED' } }),
  unit: text(20),
  costPriceVnd: vnd.optional(),
  salePriceVnd: vnd.nullable().optional(),
  minibarStandardQty: whole(0, 50),
  minStockQty: whole(0, 100_000).optional(),
  isActive: z.boolean().optional(),
});

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p?.propertyId) throw problem('UNAUTHENTICATED');
  return p;
}

@Controller('v1/properties/:propertyId/items')
export class ItemsController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(ItemsService) private readonly items: ItemsService,
  ) {}

  @Get()
  @Operation('listItems')
  list(@Req() req: GuardedRequest) {
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => ({ data: await this.items.list(tx) }),
      { readOnly: true },
    );
  }

  @Post()
  @Operation('createItem')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    const input = parseBody(itemInput, body);
    const result = await this.uow.run<Record<string, unknown>>(req, async (tx) => ({
      status: 201,
      body: await this.items.create(tx, input, req.id),
    }));
    reply.header('etag', etag(Number(result.body.version)));
    return applyResult(reply, result);
  }

  @Patch(':itemId')
  @Operation('updateItem')
  async update(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(itemId)) throw problem('NOT_FOUND');
    const input = parseBody(itemInput, body);
    const version = expectedVersion(req);
    const result = await this.uow.run<Record<string, unknown>>(req, async (tx) => ({
      status: 200,
      body: await this.items.update(tx, itemId, version, input, req.id),
    }));
    reply.header('etag', etag(Number(result.body.version)));
    return applyResult(reply, result);
  }
}
