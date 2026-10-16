/** US-002 endpoints: listUsers, createUser, updateUser, setUserRoles (owner only – x-roles). */
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { parseBody } from '../../platform/public/validation';
import { normalizeName } from '../../guests/public/normalize';
import { type HttpRequest, type Reply, principalOf } from './auth.controller';
import { type UserDto, UsersService } from './users.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const displayName = z
  .string()
  .transform((s) => normalizeName(s))
  .pipe(
    z
      .string()
      .min(1)
      .max(80)
      .refine((s) => /\p{L}/u.test(s) && !/\d/.test(s), { params: { code: 'NAME_INVALID' } }),
  );

const propertyRole = z.object({ propertyId: z.string().regex(UUID), role: z.string() });

const createSchema = z.object({
  username: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(
      z
        .string()
        .min(3)
        .max(64)
        .regex(/^[a-z0-9._-]+$/),
    ),
  displayName,
  phone: z.string().max(32).optional(),
  initialPassword: z.string().min(1).max(256),
  roles: z.array(propertyRole).min(1).max(64),
});

const updateSchema = z.object({
  displayName: displayName.optional(),
  status: z.enum(['active', 'disabled']).optional(),
  resetPassword: z.string().min(1).max(256).optional(),
});

const rolesSchema = z.object({ roles: z.array(propertyRole).max(64) });

export function pageOf(query: { cursor?: string; limit?: string }): {
  cursor?: string;
  limit: number;
} {
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'limit', code: 'VALUE_OUT_OF_RANGE' }],
    });
  }
  if (query.cursor !== undefined && !UUID.test(query.cursor)) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'cursor', code: 'VALIDATION_FAILED' }],
    });
  }
  return { ...(query.cursor ? { cursor: query.cursor } : {}), limit };
}

@Controller('v1/users')
export class UsersController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
  ) {}

  @Get()
  @Operation('listUsers')
  async list(@Req() req: HttpRequest, @Query() query: { cursor?: string; limit?: string }) {
    const p = principalOf(req);
    const page = pageOf(query);
    return this.db.withContext(tenantOf(p), (tx) => this.users.list(tx, p.userId, page), {
      readOnly: true,
    });
  }

  @Post()
  @Operation('createUser')
  async create(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<UserDto> {
    const input = parseBody(createSchema, body);
    const p = principalOf(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 201,
      body: await this.users.create(tx, p.userId, { ...input, requestId: req.id }),
    }));
    return applyResult(reply, result);
  }

  @Patch(':userId')
  @Operation('updateUser')
  async update(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<UserDto> {
    if (!UUID.test(userId)) throw problem('NOT_FOUND');
    const input = parseBody(updateSchema, body);
    const version = expectedVersion(req);
    const p = principalOf(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.users.update(tx, p.userId, userId, version, input, req.id),
    }));
    reply.header('etag', etag(result.body.version));
    return applyResult(reply, result);
  }

  @Put(':userId/roles')
  @Operation('setUserRoles')
  async setRoles(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<UserDto> {
    if (!UUID.test(userId)) throw problem('NOT_FOUND');
    const input = parseBody(rolesSchema, body);
    const version = expectedVersion(req);
    const p = principalOf(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.users.setRoles(tx, p.userId, userId, version, input.roles, req.id),
    }));
    reply.header('etag', etag(result.body.version));
    return applyResult(reply, result);
  }
}
