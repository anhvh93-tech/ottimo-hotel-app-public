/** EP10 endpoints: searchGuests, createGuest, lookupGuestByContact, getGuest, updateGuest. */
import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { localDateSchema, parseBody } from '../../platform/public/validation';
import { type Caller, type GuestInput, GuestsService } from './guests.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (max: number) => z.string().max(max);

const guestInput = z.object({
  fullName: z.string().max(400).optional(),
  phone: text(40).nullable().optional(),
  email: text(300).nullable().optional(),
  messagingHandles: z.record(z.string(), z.string().max(200)).nullable().optional(),
  dateOfBirth: localDateSchema.nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).nullable().optional(),
  nationalityCode: text(8).nullable().optional(),
  preferredLocale: z.enum(['vi', 'en', 'ru']).nullable().optional(),
  preferredContact: z
    .enum(['phone', 'zalo', 'whatsapp', 'kakaotalk', 'email'])
    .nullable()
    .optional(),
  companyName: text(400).nullable().optional(),
  taxCode: text(40).nullable().optional(),
  tags: z.array(z.string().max(200)).max(50).nullable().optional(),
  serviceNotes: z.array(z.string().max(200)).max(50).nullable().optional(),
  freeNote: text(4000).nullable().optional(),
});

const lookupSchema = z.object({
  phone: text(40).optional(),
  email: text(300).optional(),
});

function caller(req: GuardedRequest): Caller & { p: NonNullable<ReturnType<typeof principal>> } {
  const p = principal(req);
  return { userId: p.userId, roles: p.roles, p };
}

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

@Controller('v1/properties/:propertyId/guests')
export class GuestsController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(GuestsService) private readonly guests: GuestsService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
  ) {}

  @Get()
  @Operation('searchGuests')
  async search(
    @Req() req: GuardedRequest,
    @Query() query: { q?: string; picker?: string; cursor?: string; limit?: string },
  ) {
    const c = caller(req);
    const q = query.q?.trim();
    const errors = [];
    if (q !== undefined && q !== '' && (q.length < 2 || q.length > 60)) {
      errors.push({ field: 'q', code: 'VALUE_OUT_OF_RANGE' });
    }
    if (query.picker !== undefined && query.picker !== 'true' && query.picker !== 'false') {
      errors.push({ field: 'picker', code: 'VALIDATION_FAILED' });
    }
    const limit = query.limit === undefined ? 50 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      errors.push({ field: 'limit', code: 'VALUE_OUT_OF_RANGE' });
    }
    if (query.cursor !== undefined && !UUID.test(query.cursor)) {
      errors.push({ field: 'cursor', code: 'VALIDATION_FAILED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    return this.db.withContext(
      tenantOf(c.p),
      (tx) =>
        this.guests.search(tx, c, {
          q: q || undefined,
          picker: query.picker === 'true',
          cursor: query.cursor,
          limit,
        }),
      { readOnly: true },
    );
  }

  @Post()
  @Operation('createGuest')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    const input = parseBody(guestInput, body) as GuestInput;
    const c = caller(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 201,
      body: await this.guests.create(tx, c, input, req.id),
    }));
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Post('lookup')
  @Operation('lookupGuestByContact')
  async lookup(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    const input = parseBody(lookupSchema, body);
    const c = caller(req);
    // Read-only by contract (no Idempotency-Key) but writes the audit row → read-write transaction.
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.guests.lookup(tx, c, input, req.id),
    }));
    reply.header('cache-control', 'no-store');
    return applyResult(reply, result);
  }

  @Get(':guestId')
  @Operation('getGuest')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('guestId') guestId: string,
  ) {
    if (!UUID.test(guestId)) throw problem('NOT_FOUND');
    const c = caller(req);
    const body = await this.db.withContext(tenantOf(c.p), (tx) => this.guests.get(tx, c, guestId), {
      readOnly: true,
    });
    reply.header('etag', etag(body.version as number));
    return body;
  }

  @Patch(':guestId')
  @Operation('updateGuest')
  async update(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('guestId') guestId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(guestId)) throw problem('NOT_FOUND');
    const input = parseBody(guestInput, body) as GuestInput;
    const version = expectedVersion(req);
    const c = caller(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.guests.update(tx, c, guestId, version, input, req.id),
    }));
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }
}
