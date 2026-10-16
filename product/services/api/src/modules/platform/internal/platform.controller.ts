/**
 * US-004 / US-005 endpoints: listRoomGroups, listRooms, createRoom, updateRoom, listParameters,
 * getParameterHistory, setParameter; listChannels (BR-901, Sprint 2).
 *
 * Field visibility (x-visible-to): Room.baseOccupancy/maxOccupancy/currentListPrice are visible to every
 * role that may call listRooms (HK/MT are refused by x-roles), so no field is removed here.
 * TODO(BE-B → BE-A serializer): switch to the shared x-visible-to serializer when it lands.
 */
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
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { ProblemError, problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { assertNoCardNumber, localDateSchema, parseBody, reasonSchema } from '../public/validation';
import { ChannelsService, channelDto } from '../public/channels';
import { PropertyContextService } from '../public/property-context';
import { type ParameterDto, ParametersService } from './parameters.service';
import { type RoomDto, RoomsService } from './rooms.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

type Req = GuardedRequest;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY = /^[a-z0-9_.<>]+$/;

function principal(req: Req) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

const money = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const occupancy = z.number().int().min(1).max(10);

// OpenAPI 0.3.4 Q6 (erd 4.1): free text in one language in R2, C0.
const bedSetup = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(1).max(100));
const bedCount = z.number().int().min(1).max(10);
const areaM2 = z.number().int().min(1).max(2_147_483_647); // contract: minimum 1 (int column)

const roomInput = z.object({
  roomNo: z.string().regex(/^[0-9A-Z]{1,6}$/),
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(60))
    .optional(),
  roomGroupId: z.string().regex(UUID),
  floor: z.number().int().min(-5).max(200).optional(),
  baseOccupancy: occupancy.optional(),
  maxOccupancy: z.number().int().min(1).max(11).optional(),
  bedSetup: bedSetup.optional(),
  bedCount: bedCount.optional(),
  areaM2: areaM2.optional(),
  monthlyListPriceVnd: money,
  activeFrom: localDateSchema.optional(),
});

const roomPatch = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(60))
    .optional(),
  roomGroupId: z.string().regex(UUID).optional(),
  baseOccupancy: occupancy.optional(),
  maxOccupancy: z.number().int().min(1).max(11).nullable().optional(),
  bedSetup: bedSetup.nullable().optional(),
  bedCount: bedCount.nullable().optional(),
  areaM2: areaM2.nullable().optional(),
  isSellable: z.boolean().optional(),
  activeTo: localDateSchema.nullable().optional(),
  listPrice: z
    .object({
      effectiveFrom: localDateSchema,
      monthlyListPriceVnd: money,
      nightlyListPriceVnd: money.optional(),
      reason: reasonSchema,
    })
    .optional(),
});

const setParameterSchema = z.object({
  value: z.unknown().refine((v) => v !== undefined, { params: { code: 'REQUIRED' } }),
  effectiveFrom: localDateSchema,
  reason: reasonSchema,
});

@Controller('v1/properties/:propertyId')
export class PlatformController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(RoomsService) private readonly rooms: RoomsService,
    @Inject(ParametersService) private readonly parameters: ParametersService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
  ) {}

  /** BR-901/112 channel list; commissionRatePct is removed for SAL/CTV by the role serializer. */
  @Get('channels')
  @Operation('listChannels')
  async listChannels(@Req() req: Req) {
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => {
        const { today } = await this.property.now(tx);
        return { data: (await this.channels.list(tx, today)).map(channelDto) };
      },
      { readOnly: true },
    );
  }

  @Get('room-groups')
  @Operation('listRoomGroups')
  async listRoomGroups(@Req() req: Req) {
    return this.db.withContext(tenantOf(principal(req)), (tx) => this.rooms.listGroups(tx), {
      readOnly: true,
    });
  }

  @Get('rooms')
  @Operation('listRooms')
  async listRooms(@Req() req: Req, @Query('includeInactive') includeInactive?: string) {
    if (
      includeInactive !== undefined &&
      includeInactive !== 'true' &&
      includeInactive !== 'false'
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'includeInactive', code: 'VALIDATION_FAILED' }],
      });
    }
    return this.db.withContext(
      tenantOf(principal(req)),
      (tx) => this.rooms.list(tx, includeInactive === 'true'),
      { readOnly: true },
    );
  }

  @Post('rooms')
  @Operation('createRoom')
  async createRoom(
    @Req() req: Req,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<RoomDto> {
    const input = parseBody(roomInput, body);
    assertNoCardNumber('bedSetup', input.bedSetup);
    const result = await this.uow.run(req, async (tx) => ({
      status: 201,
      body: await this.rooms.create(tx, input, req.id),
    }));
    reply.header('etag', etag(result.body.version));
    return applyResult(reply, result);
  }

  @Patch('rooms/:roomId')
  @Operation('updateRoom')
  async updateRoom(
    @Req() req: Req,
    @Res({ passthrough: true }) reply: Reply,
    @Param('roomId') roomId: string,
    @Body() body: unknown,
  ): Promise<RoomDto> {
    if (!UUID.test(roomId)) throw problem('NOT_FOUND');
    const input = parseBody(roomPatch, body);
    if (input.listPrice) assertNoCardNumber('listPrice.reason', input.listPrice.reason);
    assertNoCardNumber('bedSetup', input.bedSetup ?? undefined);
    const version = expectedVersion(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.rooms.update(tx, roomId, version, input, req.id),
    }));
    reply.header('etag', etag(result.body.version));
    return applyResult(reply, result);
  }

  @Get('parameters')
  @Operation('listParameters')
  async listParameters(@Req() req: Req, @Query('asOf') asOf?: string) {
    if (asOf !== undefined && !localDateSchema.safeParse(asOf).success) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'asOf', code: 'DATE_INVALID' }] });
    }
    const p = principal(req);
    return this.db.withContext(tenantOf(p), (tx) => this.parameters.list(tx, p.roles, asOf), {
      readOnly: true,
    });
  }

  @Get('parameters/:key')
  @Operation('getParameterHistory')
  async getParameterHistory(@Req() req: Req, @Param('key') key: string) {
    if (!KEY.test(key)) throw problem('NOT_FOUND');
    const p = principal(req);
    return this.db.withContext(tenantOf(p), (tx) => this.parameters.history(tx, p.roles, key), {
      readOnly: true,
    });
  }

  @Put('parameters/:key')
  @Operation('setParameter')
  async setParameter(
    @Req() req: Req,
    @Res({ passthrough: true }) reply: Reply,
    @Param('key') key: string,
    @Body() body: unknown,
  ): Promise<ParameterDto> {
    if (!KEY.test(key)) throw problem('NOT_FOUND');
    const input = parseBody(setParameterSchema, body);
    assertNoCardNumber('reason', input.reason);
    const p = principal(req);
    try {
      const result = await this.uow.run(req, async (tx) => ({
        status: 200,
        body: await this.parameters.set(tx, {
          key,
          value: input.value,
          effectiveFrom: input.effectiveFrom,
          reason: input.reason,
          roles: p.roles,
          requestId: req.id,
        }),
      }));
      return applyResult(reply, result);
    } catch (err) {
      // Owner-only keys (A102/A119): a manager is refused per key – log the denial (rbac 8.5, US-002 AC2).
      if (err instanceof ProblemError && err.code === 'FORBIDDEN_ACTION') {
        await this.audit.recordDenied(tenantOf(p), {
          action: 'access.denied',
          entityType: 'config_parameter',
          entityId: key,
          requestId: req.id,
          sessionId: p.sessionId,
          after: { operationId: 'setParameter', roles: p.roles },
        });
      }
      throw err;
    }
  }
}
