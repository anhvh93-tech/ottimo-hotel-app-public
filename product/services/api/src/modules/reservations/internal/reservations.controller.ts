/**
 * HTTP endpoints of the reservations module (OpenAPI tags rack, reservations, maintenance room-blocks;
 * EP02 + EP11 R2 + US-139). Roles come from x-roles (AuthGuard, before anything here runs); data scopes
 * (SAL/CTV own, own_direct_only, own_hold_only) are applied in SQL by the services; responses pass the role
 * serializer (x-visible-to). Writes run in ONE UnitOfWork transaction (Idempotency-Key, If-Match).
 */
import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { parseLimit } from '../../../shared/http/pagination';
import { expectedVersion, setETag } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { isDryRun } from '../../../shared/validation';
import { ApprovalService } from '../../approvals/public/approval.service';
import { ParameterService } from '../../platform/public/parameter.service';
import type { BookingContext } from './booking-context';
import { nightsOf } from '../public/pricing';
import { Fields, asBody, pathId } from './inputs';
import { RackService } from './rack.service';
import { loadReservation } from './reservation-store';
import { ReservationsService } from './reservations.service';
import { RoomBlocksService, toRoomBlockDto } from './room-blocks.service';

/** Longest availability search (SEC-BE-28) – technical bound, not a business rule. */
const MAX_AVAILABILITY_NIGHTS = 90;

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p?.propertyId) throw problem('UNAUTHENTICATED');
  return p;
}

@Controller('v1/properties/:propertyId')
export class ReservationsController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(ReservationsService) private readonly reservations: ReservationsService,
    @Inject(RackService) private readonly rackService: RackService,
    @Inject(RoomBlocksService) private readonly blocks: RoomBlocksService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(ParameterService) private readonly params: ParameterService,
  ) {}

  private read<T>(
    req: GuardedRequest,
    fn: (tx: Tx, ctx: BookingContext) => Promise<T>,
  ): Promise<T> {
    // SEC-BE-33 second line: never read for a role the guard refused (dry runs included).
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    const p = principal(req);
    return this.db.withContext(
      tenantOf(p),
      async (tx) =>
        fn(tx, await this.reservations.context(tx, { userId: p.userId, roles: p.roles }, req.id)),
      { readOnly: true },
    );
  }

  private ctx(tx: Tx, req: GuardedRequest): Promise<BookingContext> {
    const p = principal(req);
    return this.reservations.context(tx, { userId: p.userId, roles: p.roles }, req.id);
  }

  // ───────────── rack / availability ─────────────

  @Get('rack')
  @Operation('getRack')
  getRack(@Req() req: GuardedRequest, @Query('from') from?: string, @Query('days') days?: string) {
    return this.read(req, (tx, ctx) => this.rackService.rack(tx, ctx, { from, days }));
  }

  @Get('availability')
  @Operation('searchAvailability')
  searchAvailability(
    @Req() req: GuardedRequest,
    @Query('arrival') arrival?: string,
    @Query('departure') departure?: string,
    @Query('roomId') roomId?: string,
    @Query('roomGroupId') roomGroupId?: string,
    @Query('adults') adults?: string,
    @Query('reservationId') reservationId?: string,
  ) {
    const f = new Fields({
      arrival,
      departure,
      roomId,
      roomGroupId,
      adults: adults === undefined ? undefined : Number(adults),
      reservationId,
    });
    const from = f.date('arrival', true);
    const to = f.date('departure', true);
    const room = f.uuid('roomId', false);
    const group = f.uuid('roomGroupId', false);
    const persons = f.int('adults', { required: false, min: 1, max: 20, fallback: 2 }) as number;
    const forReservation = f.uuid('reservationId', false);
    f.done();
    if ((to as string) <= (from as string)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'departure', code: 'DATE_ORDER' }] });
    }
    // SEC-BE-28: bounded range (technical limit; longer stays are contracts – BR-108).
    if (nightsOf(from as string, to as string) > MAX_AVAILABILITY_NIGHTS) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'departure', code: 'VALUE_OUT_OF_RANGE' }],
        extras: { max: MAX_AVAILABILITY_NIGHTS },
      });
    }
    return this.read(req, async (tx, ctx) => {
      const a = await this.rackService.availability(tx, ctx.today, {
        roomId: room,
        roomGroupId: group,
        fromDate: from as string,
        toDate: to as string,
        persons,
        reservationId: forReservation,
      });
      return {
        arrival: from,
        departure: to,
        ...(a.requestedRoom ? { requestedRoom: a.requestedRoom } : {}),
        alternatives: a.alternatives.map((x) => ({
          roomId: x.roomId,
          roomNo: x.roomNo,
          roomGroupCode: x.roomGroupCode,
          available: true,
          upgrade: x.upgrade,
          ...(x.orphanNight !== undefined ? { orphanNight: x.orphanNight } : {}),
        })),
      };
    });
  }

  /** 0.3.5 A-07: parameter values the booking/hold/quote forms need (read-only, no commission/security). */
  @Get('booking-rules')
  @Operation('getBookingRules')
  getBookingRules(@Req() req: GuardedRequest) {
    return this.read(req, async (tx, ctx) => {
      const g = <T>(key: string) => this.params.get<T>(tx, key, ctx.today);
      return {
        businessDate: ctx.today,
        holdHoursOptions: await g<number[]>('hold_hours_options'),
        holdHoursDefault: await g<number>('hold_hours_default'),
        holdLatestTimeOnArrival: await g<string>('hold_latest_time_on_arrival'),
        holdExtensionMaxHours: await g<number>('hold_extension_max_hours'),
        quoteValidityDays: await g<number>('quote_validity_days'),
        shortStayDepositPct: await g<number>('short_stay_deposit_pct'),
        longStayCompareFromNights: await g<number>('long_stay_compare_from_nights'),
        longStayRequiredFromNights: await g<number>('long_stay_required_from_nights'),
        noShowCallTime: await g<string>('no_show_call_time'),
        noShowMarkTime: await g<string>('no_show_mark_time'),
        checkinTime: await g<string>('checkin_time'),
        checkoutTime: await g<string>('checkout_time'),
      };
    });
  }

  // ───────────── reservations ─────────────

  @Get('reservations')
  @Operation('listReservations')
  list(
    @Req() req: GuardedRequest,
    @Query('status') status?: string,
    @Query('stayFrom') stayFrom?: string,
    @Query('stayTo') stayTo?: string,
    @Query('q') q?: string,
    @Query('externalContract') externalContract?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const n = parseLimit(limit, 50);
    return this.read(req, (tx, ctx) =>
      this.rackService.list(tx, ctx, {
        status,
        stayFrom,
        stayTo,
        q,
        externalContract,
        cursor,
        limit: n,
      }),
    );
  }

  @Post('reservations')
  @Operation('createReservation')
  async create(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() raw: unknown,
  ) {
    const body = asBody(raw);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const { row } = await this.reservations.create(tx, ctx, body);
      return { status: 201, body: await this.reservations.dtoOf(tx, ctx, row) };
    });
    const out = applyResult(reply, result) as { id?: string; version?: number };
    if (out.id)
      reply.header(
        'Location',
        `/v1/properties/${principal(req).propertyId}/reservations/${out.id}`,
      );
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Get('reservations/:reservationId')
  @Operation('getReservation')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
  ) {
    const id = pathId(reservationId);
    const dto = await this.read(req, (tx, ctx) => this.reservations.dto(tx, ctx, id));
    setETag(reply, dto.version as number);
    return dto;
  }

  @Patch('reservations/:reservationId')
  @Operation('updateReservation')
  update(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    return this.write(req, reply, (tx, ctx) =>
      this.reservations.update(tx, ctx, id, expectedVersion(req), asBody(raw)),
    );
  }

  @Get('reservations/:reservationId/history')
  @Operation('getReservationHistory')
  history(@Req() req: GuardedRequest, @Param('reservationId') reservationId: string) {
    const id = pathId(reservationId);
    return this.read(req, async (tx, ctx) => {
      const row = await loadReservation(tx, id, ctx.actor);
      return { data: await this.rackService.history(tx, ctx, row) };
    });
  }

  @Post('reservations/:reservationId/actions/extend-hold')
  @Operation('extendHold')
  extendHold(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    return this.write(req, reply, (tx, ctx) =>
      this.reservations.extendHold(tx, ctx, id, expectedVersion(req), asBody(raw)),
    );
  }

  @Post('reservations/:reservationId/actions/cancel')
  @Operation('cancelReservation')
  async cancel(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const body = asBody(raw);
    if (isDryRun(body)) {
      // US-135: the dialog content – no Idempotency-Key / If-Match, nothing written.
      reply.status(200);
      return this.read(req, async (tx, ctx) => {
        const r = await this.reservations.cancel(tx, ctx, id, null, body, true);
        return {
          reservation: await this.reservations.dtoOf(tx, ctx, r.row),
          cancellation: r.cancellation,
        };
      });
    }
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.reservations.cancel(tx, ctx, id, expectedVersion(req), body, false);
      return {
        status: 200,
        body: {
          reservation: await this.reservations.dtoOf(tx, ctx, r.row),
          cancellation: r.cancellation,
        },
      };
    });
    const out = applyResult(reply, result) as { reservation?: { version?: number } };
    if (typeof out.reservation?.version === 'number') setETag(reply, out.reservation.version);
    return out;
  }

  @Post('reservations/:reservationId/actions/move')
  @Operation('moveReservation')
  move(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    return this.write(req, reply, (tx, ctx) =>
      this.reservations.move(tx, ctx, id, expectedVersion(req), asBody(raw)),
    );
  }

  @Post('reservations/:reservationId/actions/mark-no-show')
  @Operation('markNoShow')
  markNoShow(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    return this.write(req, reply, (tx, ctx) =>
      this.reservations.markNoShow(tx, ctx, id, expectedVersion(req), asBody(raw)),
    );
  }

  @Post('reservations/:reservationId/actions/restore-no-show')
  @Operation('restoreNoShow')
  async restoreNoShow(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const result = await this.uow.run<Record<string, unknown>>(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.reservations.restoreNoShow(
        tx,
        ctx,
        id,
        expectedVersion(req),
        asBody(raw),
      );
      if ('approval' in r) {
        return { status: 202, body: { ...(await this.approvals.toDto(tx, r.approval)) } };
      }
      return { status: 200, body: await this.reservations.dtoOf(tx, ctx, r.row) };
    });
    const out = applyResult(reply, result) as Record<string, unknown>;
    if (result.status === 200 && typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Post('reservations/:reservationId/actions/assign-room')
  @Operation('assignRoom')
  assignRoom(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    return this.write(req, reply, (tx, ctx) =>
      this.reservations.assignRoom(tx, ctx, id, expectedVersion(req), asBody(raw)),
    );
  }

  @Post('reservations/:reservationId/actions/swap-room')
  @Operation('swapRoom')
  async swapRoom(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const rows = await this.reservations.swapRoom(tx, ctx, id, expectedVersion(req), asBody(raw));
      const reservations = [];
      for (const r of rows) reservations.push(await this.reservations.dtoOf(tx, ctx, r));
      return { status: 200, body: { reservations } };
    });
    return applyResult(reply, result);
  }

  // ───────────── overbooking incidents (BR-312, erd 7) ─────────────

  @Get('overbooking-incidents')
  @Operation('listOverbookingIncidents')
  listIncidents(@Req() req: GuardedRequest, @Query('status') status?: string) {
    if (status !== undefined && status !== 'open' && status !== 'resolved') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'status', code: 'NOT_IN_LIST' }] });
    }
    return this.read(req, async (tx, ctx) => ({
      data: await this.incidents(tx, ctx, status ?? null, null),
    }));
  }

  @Post('overbooking-incidents/:incidentId/actions/resolve-external')
  @Operation('resolveOverbookingExternal')
  async resolveExternal(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('incidentId') incidentId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(incidentId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      await this.reservations.resolveExternal(tx, ctx, id, asBody(raw));
      const [dto] = await this.incidents(tx, ctx, null, id);
      return { status: 200, body: dto };
    });
    return applyResult(reply, result);
  }

  private async incidents(tx: Tx, ctx: BookingContext, status: string | null, id: string | null) {
    const { rows } = await tx.query<{
      id: string;
      reservation_id: string;
      code: string;
      room_no: string | null;
      stay_from: string;
      stay_to: string;
      conflicting: string[] | null;
      source: string;
      status: string;
      resolution: string | null;
      cost_vnd: number | null;
      detected_at: Date;
      resolved_at: Date | null;
    }>(
      `SELECT i.id, i.reservation_id, r.code, rm.room_no, i.stay_from::text AS stay_from, i.stay_to::text AS stay_to,
              (SELECT array_agg(x.code ORDER BY x.code) FROM reservation x
                WHERE x.id = ANY(i.conflicting_reservation_ids)) AS conflicting,
              i.source, i.status, i.resolution, i.cost_vnd, i.detected_at, i.resolved_at
         FROM overbooking_incident i
         JOIN reservation r ON r.id = i.reservation_id
         LEFT JOIN room rm ON rm.id = i.requested_room_id
        WHERE ($1::text IS NULL OR i.status = $1) AND ($2::uuid IS NULL OR i.id = $2)
        ORDER BY i.detected_at DESC
        LIMIT 200`,
      [status, id],
    );
    return rows.map((i) => ({
      id: i.id,
      reservationId: i.reservation_id,
      reservationCode: i.code,
      ...(i.room_no ? { requestedRoomNo: i.room_no } : {}),
      stayFrom: i.stay_from,
      stayTo: i.stay_to,
      conflictingReservationCodes: i.conflicting ?? [],
      source: i.source,
      status: i.status,
      ...(i.resolution ? { resolution: i.resolution } : {}),
      ...(i.cost_vnd !== null ? { costVnd: i.cost_vnd } : {}),
      detectedAt: ctx.iso(i.detected_at),
      ...(i.resolved_at ? { resolvedAt: ctx.iso(i.resolved_at) } : {}),
    }));
  }

  // ───────────── room blocks (SM-02) ─────────────

  @Get('room-blocks')
  @Operation('listRoomBlocks')
  listBlocks(@Req() req: GuardedRequest, @Query('from') from?: string, @Query('to') to?: string) {
    return this.read(req, async (tx) => ({ data: await this.blocks.list(tx, { from, to }) }));
  }

  @Post('room-blocks')
  @Operation('createRoomBlock')
  async createBlock(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() raw: unknown,
  ) {
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      return { status: 201, body: toRoomBlockDto(await this.blocks.create(tx, ctx, asBody(raw))) };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Patch('room-blocks/:roomBlockId')
  @Operation('updateRoomBlock')
  async updateBlock(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('roomBlockId') roomBlockId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(roomBlockId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      return {
        status: 200,
        body: toRoomBlockDto(
          await this.blocks.update(tx, ctx, id, expectedVersion(req), asBody(raw)),
        ),
      };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Post('room-blocks/:roomBlockId/actions/:action')
  @Operation('transitionRoomBlock')
  async transitionBlock(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('roomBlockId') roomBlockId: string,
    @Param('action') action: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(roomBlockId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      return {
        status: 200,
        body: toRoomBlockDto(await this.blocks.transition(tx, ctx, id, action, asBody(raw))),
      };
    });
    return applyResult(reply, result);
  }

  // ───────────── shared write wrapper (Reservation response + ETag) ─────────────

  private async write(
    req: GuardedRequest,
    reply: Reply,
    fn: (tx: Tx, ctx: BookingContext) => Promise<import('./reservation-store').ReservationRow>,
  ) {
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const row = await fn(tx, ctx);
      return { status: 200, body: await this.reservations.dtoOf(tx, ctx, row) };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }
}
