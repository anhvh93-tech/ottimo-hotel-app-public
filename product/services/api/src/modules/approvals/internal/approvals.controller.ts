/**
 * S23 – approval queue and decisions (US-007; OpenAPI tag approvals). Roles come from x-roles (guard);
 * scopes (own / within_limit_or_own) are applied in SQL by ApprovalService.list/cancel (SR-AZ-02);
 * the response passes the role serializer (approverRemainingMonthlyVnd only for OWN/MGR/FDL).
 */
import { Body, Controller, Get, Inject, Param, Post, Query, Req, Res } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database } from '../../../db/database';
import { APPROVAL_STATUSES, type ApprovalStatus } from '../../../db/schema';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { optionalText, requireReason } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { type Actor, ApprovalService } from '../public/approval.service';
import { ApproverReauth } from './reauth';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function actorOf(req: GuardedRequest): Actor {
  const p = req.ottimoAuth?.principal;
  if (!p) throw problem('UNAUTHENTICATED');
  return { userId: p.userId, roles: p.roles };
}

function approvalIdOf(id: string): string {
  if (!UUID.test(id)) throw problem('NOT_FOUND');
  return id;
}

function body(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

@Controller('v1/properties/:propertyId/approval-requests')
export class ApprovalsController {
  private readonly reauth: ApproverReauth;

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) clock: Clock,
    @Inject(AuditService) audit: AuditService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
  ) {
    this.reauth = new ApproverReauth(db, clock, audit);
  }

  @Get()
  @Operation('listApprovalRequests')
  async list(
    @Req() req: GuardedRequest,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    if (status !== undefined && !APPROVAL_STATUSES.includes(status as ApprovalStatus)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'status', code: 'NOT_IN_LIST' }] });
    }
    const n = parseLimit(limit, 50);
    const c = decodeCursor(cursor, 2);
    const actor = actorOf(req);
    const p = req.ottimoAuth?.principal;
    if (!p) throw problem('UNAUTHENTICATED');
    return this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const { rows, remainingMonthlyVnd } = await this.approvals.list(tx, actor, {
          ...(status ? { status: status as ApprovalStatus } : {}),
          limit: n,
          after: c ? { at: String(c[0]), id: String(c[1]) } : null,
        });
        const paged = page(rows, n, (r) => [r.requested_at.toISOString(), r.id]);
        const data = [];
        for (const r of paged.data)
          data.push(await this.approvals.toDto(tx, r, remainingMonthlyVnd));
        return { data, page: paged.page };
      },
      { readOnly: true },
    );
  }

  @Post(':approvalId/actions/approve')
  @Operation('approveRequest')
  async approve(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
    @Body() raw: unknown,
  ) {
    const id = approvalIdOf(approvalId);
    const b = body(raw);
    const note = optionalText('note', b.note, 300);
    const actor = actorOf(req);
    const result = await this.uow.run(req, async (tx) => {
      const method = await this.reauth.verify(
        tx.ctx,
        { authMethod: b.authMethod, secret: b.secret },
        req.id,
      );
      const out = await this.approvals.approve(tx, actor, id, {
        authMethod: method,
        note,
        requestId: req.id,
      });
      if ('escalatedTo' in out) {
        // A4 committed (status escalated, pushed to the next level) – then 403 to this approver.
        return {
          fail: problem('APPROVAL_LIMIT_EXCEEDED', { extras: { approver: out.escalatedTo } }),
        };
      }
      return { status: 200, body: await this.approvals.toDto(tx, out.row) };
    });
    return applyResult(reply, result);
  }

  @Post(':approvalId/actions/reject')
  @Operation('rejectRequest')
  async reject(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
    @Body() raw: unknown,
  ) {
    const id = approvalIdOf(approvalId);
    const b = body(raw);
    // V-08 (3–500) + V-09 before asking for the password.
    const reason = requireReason('reason', b.reason, { min: 3, max: 500 });
    const actor = actorOf(req);
    const result = await this.uow.run(req, async (tx) => {
      const method = await this.reauth.verify(
        tx.ctx,
        { authMethod: b.authMethod, secret: b.secret },
        req.id,
      );
      const row = await this.approvals.reject(tx, actor, id, {
        authMethod: method,
        reason,
        requestId: req.id,
      });
      return { status: 200, body: await this.approvals.toDto(tx, row) };
    });
    return applyResult(reply, result);
  }

  @Post(':approvalId/actions/cancel')
  @Operation('cancelRequest')
  async cancel(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('approvalId') approvalId: string,
  ) {
    const id = approvalIdOf(approvalId);
    const actor = actorOf(req);
    const result = await this.uow.run(req, async (tx) => {
      const row = await this.approvals.cancel(tx, actor, id, req.id);
      return { status: 200, body: await this.approvals.toDto(tx, row) };
    });
    return applyResult(reply, result);
  }
}
