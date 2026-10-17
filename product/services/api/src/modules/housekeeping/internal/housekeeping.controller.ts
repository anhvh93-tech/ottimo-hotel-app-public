/**
 * Housekeeping + maintenance endpoints (OpenAPI 0.3.7 nhóm H – BE-C R2 Sprint 4): listRoomStatuses,
 * transitionRoomStatus, getInspectionChecklist, recordInspection, listInspections, listHkTasks, createHkTask,
 * transitionHkTask, listWorkOrders, createWorkOrder, getWorkOrder, updateWorkOrder, transitionWorkOrder,
 * listAssignableStaff (bổ sung 3).
 * Roles come from the operation's x-roles (guard); row scope (HK T / own_or_room_today, MT read only) and
 * field masks are applied by the services. Writes go through UnitOfWork (Idempotency-Key, If-Match).
 */
import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { ROOM_STATUS_CODES } from '../../../db/schema/frontdesk';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { rejectDryRun } from '../../../shared/http/dry-run';
import { Operation } from '../../../shared/http/operation';
import { expectedVersion, setETag } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { parseInstant } from '../../payments/public/payment.service';
import { parseBody } from '../../platform/public/validation';
import { localeOf } from './checklist';
import { type HkCtx, HousekeepingService } from './housekeeping.service';
import { WorkOrdersService } from './work-orders.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pathId(v: string): string {
  if (!UUID.test(v)) throw problem('NOT_FOUND');
  return v.toLowerCase();
}

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p?.propertyId) throw problem('UNAUTHENTICATED');
  return p;
}

function asBody(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw problem('VALIDATION_FAILED', { errors: [{ field: 'body', code: 'VALIDATION_FAILED' }] });
  }
  return raw as Record<string, unknown>;
}

/** `performedAt` (B): ISO instant of the device. */
function performedAt(raw: unknown): Date {
  if (raw === undefined || raw === null) {
    throw problem('VALIDATION_FAILED', { errors: [{ field: 'performedAt', code: 'REQUIRED' }] });
  }
  const d = parseInstant('performedAt', typeof raw === 'string' ? raw : String(raw));
  return d as Date;
}

const roomTransitionSchema = z.object({
  event: z.enum(['start_cleaning', 'finish_cleaning', 'needs_cleaning']),
  expectedFrom: z.enum(ROOM_STATUS_CODES),
  performedAt: z.string().max(40),
  taskId: z.string().regex(UUID).optional(),
});

const inspectionSchema = z.object({
  checklistVersion: z.number().int().min(1),
  items: z
    .array(
      z.object({
        code: z.string().min(1).max(64),
        passed: z.boolean(),
        note: z.string().max(1000).optional(),
      }),
    )
    .max(64),
  photoAttachmentIds: z.array(z.string().regex(UUID)).max(16).optional(),
  performedAt: z.string().max(40),
});

@Controller('v1/properties/:propertyId')
export class HousekeepingController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(HousekeepingService) private readonly hk: HousekeepingService,
    @Inject(WorkOrdersService) private readonly wo: WorkOrdersService,
  ) {}

  private ctx(tx: Tx, req: GuardedRequest): Promise<HkCtx> {
    const p = principal(req);
    return this.hk.ctx(tx, { userId: p.userId, roles: p.roles, requestId: req.id });
  }

  private read<T>(req: GuardedRequest, fn: (tx: Tx, c: HkCtx) => Promise<T>): Promise<T> {
    const p = principal(req);
    return this.db.withContext(tenantOf(p), async (tx) => fn(tx, await this.ctx(tx, req)), {
      readOnly: true,
    });
  }

  // ───────────── room statuses (S10) ─────────────

  @Get('room-statuses')
  @Operation('listRoomStatuses')
  listRoomStatuses(@Req() req: GuardedRequest, @Query('filter') filter?: string) {
    return this.read(req, (tx, c) => this.hk.listRoomStatuses(tx, c, filter));
  }

  @Post('rooms/:roomId/status-transitions')
  @Operation('transitionRoomStatus')
  async transitionRoomStatus(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('roomId') roomId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(roomId);
    rejectDryRun(raw);
    const b = parseBody(roomTransitionSchema, raw);
    const at = performedAt(b.performedAt);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return {
        status: 200,
        body: await this.hk.transitionRoomStatus(tx, c, id, {
          event: b.event,
          expectedFrom: b.expectedFrom,
          performedAt: at,
          ...(b.taskId ? { taskId: b.taskId.toLowerCase() } : {}),
        }),
      };
    });
    return applyResult(reply, result);
  }

  // ───────────── inspections (US-055) ─────────────

  @Get('assignable-staff')
  @Operation('listAssignableStaff')
  listAssignableStaff(@Req() req: GuardedRequest, @Query('department') department?: string) {
    return this.read(req, (tx) => this.hk.listAssignableStaff(tx, department));
  }

  @Get('inspection-checklist')
  @Operation('getInspectionChecklist')
  getInspectionChecklist(@Req() req: GuardedRequest, @Query('roomId') roomId?: string) {
    if (roomId !== undefined && !UUID.test(roomId)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'roomId', code: 'NOT_IN_LIST' }] });
    }
    const locale = localeOf(req.headers['accept-language']);
    return this.read(req, (tx, c) =>
      this.hk.getInspectionChecklist(tx, c, roomId?.toLowerCase(), locale),
    );
  }

  @Post('rooms/:roomId/inspections')
  @Operation('recordInspection')
  async recordInspection(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('roomId') roomId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(roomId);
    rejectDryRun(raw);
    const b = parseBody(inspectionSchema, raw);
    const at = performedAt(b.performedAt);
    const locale = localeOf(req.headers['accept-language']);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return {
        status: 201,
        body: await this.hk.recordInspection(
          tx,
          c,
          id,
          {
            checklistVersion: b.checklistVersion,
            items: b.items,
            photoAttachmentIds: (b.photoAttachmentIds ?? []).map((x) => x.toLowerCase()),
            performedAt: at,
          },
          locale,
        ),
      };
    });
    return applyResult(reply, result);
  }

  @Get('rooms/:roomId/inspections')
  @Operation('listInspections')
  listInspections(
    @Req() req: GuardedRequest,
    @Param('roomId') roomId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const id = pathId(roomId);
    const locale = localeOf(req.headers['accept-language']);
    return this.read(req, (tx, c) =>
      this.hk.listInspections(
        tx,
        c,
        id,
        {
          ...(from !== undefined ? { from } : {}),
          ...(to !== undefined ? { to } : {}),
          ...(cursor !== undefined ? { cursor } : {}),
          ...(limit !== undefined ? { limit } : {}),
        },
        locale,
      ),
    );
  }

  // ───────────── tasks (US-054) ─────────────

  @Get('hk-tasks')
  @Operation('listHkTasks')
  listHkTasks(
    @Req() req: GuardedRequest,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.read(req, (tx, c) =>
      this.hk.listHkTasks(tx, c, {
        ...(date !== undefined ? { date } : {}),
        ...(status !== undefined ? { status } : {}),
      }),
    );
  }

  @Post('hk-tasks')
  @Operation('createHkTask')
  async createHkTask(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() raw: unknown,
  ) {
    rejectDryRun(raw);
    const body = asBody(raw);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return { status: 201, body: await this.hk.createHkTask(tx, c, body) };
    });
    return applyResult(reply, result);
  }

  @Post('hk-tasks/:taskId/actions/:action')
  @Operation('transitionHkTask')
  async transitionHkTask(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('taskId') taskId: string,
    @Param('action') action: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(taskId);
    rejectDryRun(raw);
    const body = asBody(raw);
    const at = performedAt(body.performedAt);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return { status: 200, body: await this.hk.transitionHkTask(tx, c, id, action, body, at) };
    });
    return applyResult(reply, result);
  }

  // ───────────── work orders (S11) ─────────────

  @Get('work-orders')
  @Operation('listWorkOrders')
  listWorkOrders(
    @Req() req: GuardedRequest,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.read(req, (tx, c) =>
      this.wo.list(tx, c, {
        ...(status !== undefined ? { status } : {}),
        ...(cursor !== undefined ? { cursor } : {}),
        ...(limit !== undefined ? { limit } : {}),
      }),
    );
  }

  @Post('work-orders')
  @Operation('createWorkOrder')
  async createWorkOrder(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() raw: unknown,
  ) {
    rejectDryRun(raw);
    const body = asBody(raw);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return { status: 201, body: await this.wo.create(tx, c, body) };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Get('work-orders/:workOrderId')
  @Operation('getWorkOrder')
  async getWorkOrder(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('workOrderId') workOrderId: string,
  ) {
    const id = pathId(workOrderId);
    const out = await this.read(req, (tx, c) => this.wo.get(tx, c, id));
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Patch('work-orders/:workOrderId')
  @Operation('updateWorkOrder')
  async updateWorkOrder(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('workOrderId') workOrderId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(workOrderId);
    rejectDryRun(raw);
    const body = asBody(raw);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return { status: 200, body: await this.wo.update(tx, c, id, expectedVersion(req), body) };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Post('work-orders/:workOrderId/actions/:action')
  @Operation('transitionWorkOrder')
  async transitionWorkOrder(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('workOrderId') workOrderId: string,
    @Param('action') action: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(workOrderId);
    rejectDryRun(raw);
    const body = asBody(raw);
    const result = await this.uow.run(req, async (tx) => {
      const c = await this.ctx(tx, req);
      return {
        status: 200,
        body: await this.wo.transition(tx, c, id, action, expectedVersion(req), body),
      };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }
}
