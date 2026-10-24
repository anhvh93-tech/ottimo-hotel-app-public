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
  Optional,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { z } from 'zod';
import { v7 as uuidv7 } from 'uuid';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { ProblemError, problem } from '../../../shared/problem';
import { EventsService } from '../../events/public/events.service';
import { StrongReauthService } from '../../identity/public/strong-reauth';
import { notifyStaff } from '../public/staff-notify';
import {
  RECEIVING_ACCOUNT_KEY,
  assertReasonWithoutAccountNumber,
} from '../public/receiving-account';
import { AuditService } from '../../audit/public/audit.service';
import { assertNoCardNumber, localDateSchema, parseBody, reasonSchema } from '../public/validation';
import { ChannelsService, channelDto } from '../public/channels';
import { ParameterHooks } from '../public/parameter-hooks';
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

/** 0.3.8 `setParameter.reauth` / `cancelScheduledParameter.reauth`: S2 – password (`secret`) + TOTP or recovery code. */
const reauthSchema = z
  .object({
    authMethod: z.literal('password'),
    secret: z.string().min(6).max(256),
    totpCode: z
      .string()
      .regex(/^[0-9]{6}$/)
      .optional(),
    recoveryCode: z.string().min(1).max(32).optional(),
  })
  .strict();

const setParameterSchema = z.object({
  value: z.unknown().refine((v) => v !== undefined, { params: { code: 'REQUIRED' } }),
  effectiveFrom: localDateSchema,
  reason: reasonSchema,
  // 0.3.6 x-reauth-parameters (SEC F3) + 0.3.8 S2 (R3-Q51): payment_receiving_account only; other keys ignore it.
  reauth: reauthSchema.optional(),
});

const cancelScheduledSchema = z
  .object({
    effectiveFrom: localDateSchema,
    reason: reasonSchema,
    reauth: reauthSchema.optional(),
  })
  .strict();

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
    @Inject(StrongReauthService) private readonly strong: StrongReauthService,
    @Inject(ParameterHooks) private readonly hooks: ParameterHooks,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
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
    const receiving = key === RECEIVING_ACCOUNT_KEY;
    try {
      if (receiving) {
        // SEC F3: owner only (403 before any password check), then the owner's own password in this request.
        if (!p.roles.includes('owner')) throw problem('FORBIDDEN_ACTION');
        // FB-R3-SEC-Q51-01: no account number in the free-text reason (checked before S2 – no factor burnt).
        assertReasonWithoutAccountNumber(
          input.reason,
          (input.value as { accountNo?: unknown } | null)?.accountNo,
        );
        await this.s2(req, input.reauth, 'setParameter');
      }
      const hook = this.hooks.get(key);
      const result = await this.uow.run(req, async (tx) => {
        // Rules of another module for this key (R3 S1: public_booking_requests_enabled – SEC ARC-17).
        if (hook?.before) await hook.before(tx, input.value, p.roles);
        const dto = await this.parameters.set(tx, {
          key,
          value: input.value,
          effectiveFrom: input.effectiveFrom,
          reason: input.reason,
          roles: p.roles,
          requestId: req.id,
        });
        if (receiving) await this.receivingAccountChanged(tx, input.effectiveFrom, 'set');
        if (hook?.after) await hook.after(tx, input.value);
        return { status: 200, body: dto };
      });
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

  @Post('parameters/:key/actions/cancel-scheduled')
  @Operation('cancelScheduledParameter')
  async cancelScheduledParameter(
    @Req() req: Req,
    @Res({ passthrough: true }) reply: Reply,
    @Param('key') key: string,
    @Body() body: unknown,
  ): Promise<void> {
    if (!KEY.test(key)) throw problem('NOT_FOUND');
    const input = parseBody(cancelScheduledSchema, body);
    assertNoCardNumber('reason', input.reason);
    const p = principal(req);
    const receiving = key === RECEIVING_ACCOUNT_KEY;
    try {
      if (receiving) {
        // SEC Q51-1/Q51-4: owner only (403 before any password check), then S2 in this request.
        if (!p.roles.includes('owner')) throw problem('FORBIDDEN_ACTION');
        assertReasonWithoutAccountNumber(input.reason);
        await this.s2(req, input.reauth, 'cancelScheduledParameter');
      }
      const hook = this.hooks.get(key);
      const result = await this.uow.run(req, async (tx) => {
        await this.parameters.cancelScheduled(tx, {
          key,
          effectiveFrom: input.effectiveFrom,
          reason: input.reason,
          roles: p.roles,
          requestId: req.id,
        });
        if (receiving) await this.receivingAccountChanged(tx, input.effectiveFrom, 'cancel');
        // A cancelled scheduled change of a hooked key is a change too (US-155: `public_booking_toggled`).
        if (hook?.after) await hook.after(tx, undefined);
        return { status: 204, body: undefined };
      });
      return applyResult(reply, result);
    } catch (err) {
      if (err instanceof ProblemError && err.code === 'FORBIDDEN_ACTION') {
        await this.audit.recordDenied(tenantOf(p), {
          action: 'access.denied',
          entityType: 'config_parameter',
          entityId: key,
          requestId: req.id,
          sessionId: p.sessionId,
          after: { operationId: 'cancelScheduledParameter', roles: p.roles },
        });
      }
      throw err;
    }
  }

  /**
   * 0.3.8 S2 (SEC Q51-4, A.5) through identity's one server function, BEFORE the unit of work (counted although the
   * request fails). `reauth` missing → 422 REQUIRED (field `reauth`); `secret` = the password.
   */
  private async s2(req: Req, reauth: z.infer<typeof reauthSchema> | undefined, op: string) {
    if (!reauth) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'reauth', code: 'REQUIRED' }] });
    }
    const p = principal(req);
    await this.strong.verify(
      tenantOf(p),
      {
        password: reauth.secret,
        ...(reauth.totpCode !== undefined ? { totpCode: reauth.totpCode } : {}),
        ...(reauth.recoveryCode !== undefined ? { recoveryCode: reauth.recoveryCode } : {}),
      },
      {
        operationId: op,
        passwordField: 'reauth.secret',
        factorField: 'reauth.totpCode',
        requestId: req.id,
        sessionId: p.sessionId,
      },
    );
  }

  /**
   * SEC F3 + Q51-6: every OWN/MGR is told in the app (the effective date as the display code – never a number) and
   * every owner by email through the outbox (`staff.email`, template + date only; the dispatcher resolves the
   * addresses – an owner whose session was taken cannot hide it).
   */
  private async receivingAccountChanged(tx: Tx, effectiveFrom: string, action: 'set' | 'cancel') {
    const pc = await this.property.now(tx);
    await notifyStaff(
      tx,
      this.events,
      {
        kind: 'receiving_account_changed',
        roles: ['owner', 'manager'],
        refType: 'property',
        refId: pc.propertyId,
        refCode: effectiveFrom,
      },
      pc.now,
    );
    await tx.query(
      `INSERT INTO outbox_message (id, organization_id, property_id, topic, payload, dedupe_key)
       VALUES ($1, $2, $3, 'staff.email', $4, $5)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        pc.propertyId,
        // Q51-6 – the INT worker's contract (`int-r3-smtp`): template + owners + the effective date, no number.
        JSON.stringify({
          template: 'receiving_account_changed',
          userIds: [],
          owners: true,
          effectiveDate: effectiveFrom,
        }),
        `email:receiving_account_changed:${action}:${pc.propertyId}:${uuidv7()}`,
      ],
    );
  }
}
