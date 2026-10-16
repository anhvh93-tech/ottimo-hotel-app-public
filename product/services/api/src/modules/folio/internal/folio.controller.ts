/**
 * Folio endpoints of Sprint 2: getFolio (S04 money block – US-020, US-119), requestFoc (A35, US-007 AC1).
 * Scope M (x-scope sales_staff: own, collaborator: own_totals_only): a SAL/CTV only reaches the folio of a
 * booking they created or closed – otherwise 404 (never 403, no existence leak). The role serializer then
 * strips lines/payments/other totals for CTV.
 */
import { Body, Controller, Get, Inject, Optional, Param, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { rejectDryRun } from '../../../shared/http/dry-run';
import { problem } from '../../../shared/problem';
import { ApprovalService } from '../../approvals/public/approval.service';
import { PasswordReauth } from '../../identity/public/password-reauth';
import { parseBody } from '../../platform/public/validation';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { optionalText } from '../../../shared/validation';
import { folioDto } from '../public/folio-view';
import { FolioService } from '../public/folio.service';
import { FolioFocService } from './foc.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FULL_SCOPE = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

const focSchema = z.object({
  kind: z.enum(['foc', 'special_discount']),
  amountVnd: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  reasonCode: z.string().min(1).max(40),
  note: z.string().max(500).optional(),
  authMethod: z.enum(['password', 'pin']).optional(),
  secret: z.string().min(6).max(256).optional(),
});

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

@Controller('v1/properties/:propertyId/folios')
export class FolioController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(FolioFocService) private readonly foc: FolioFocService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(PasswordReauth) private readonly reauth: PasswordReauth,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
  ) {}

  @Get(':folioId')
  @Operation('getFolio')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
  ) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    const p = principal(req);
    const body = await this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const folio = await this.folios.get(tx, folioId);
        if (!folio) throw problem('NOT_FOUND');
        if (!p.roles.some((r) => FULL_SCOPE.includes(r))) {
          await this.assertOwn(tx, folio.primary_reservation_id, p.userId);
        }
        const tz = await this.folios.timezone(tx);
        return folioDto(
          folio,
          await this.folios.lines(tx, folio.id),
          await this.folios.payments(tx, folio.id),
          tz,
        );
      },
      { readOnly: true },
    );
    reply.header('etag', etag(body.version as number));
    return body;
  }

  @Post(':folioId/lines/:lineId/foc')
  @Operation('requestFoc')
  async requestFoc(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Param('lineId') lineId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId) || !UUID.test(lineId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(focSchema, body);
    const note = optionalText('note', input.note, 500);
    // R2: password only (`pin` from R3 – FocRequestInput.authMethod).
    if (input.authMethod === 'pin') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'authMethod', code: 'NOT_IN_LIST' }],
      });
    }
    if (input.authMethod && !input.secret) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'secret', code: 'REQUIRED' }] });
    }
    const p = principal(req);
    // Re-authentication of the requester (BR-436 self-application) runs BEFORE the unit of work
    // (own transaction, failures counted – identity PasswordReauth).
    let reauthenticated = false;
    if (input.authMethod === 'password' && input.secret) {
      await this.reauth.verify(tenantOf(p), input.secret, {
        field: 'secret',
        purpose: 'foc',
        requestId: req.id,
      });
      reauthenticated = true;
    }
    const result = await this.uow.run(req, async (tx) => {
      const folio = await this.folios.get(tx, folioId);
      if (!folio) throw problem('NOT_FOUND');
      const own = this.reservations
        ? await this.reservations.ownership(tx, folio.primary_reservation_id)
        : null;
      const row = await this.foc.request(
        tx,
        { userId: p.userId, roles: p.roles },
        folioId,
        lineId,
        {
          kind: input.kind,
          amountVnd: input.amountVnd,
          reasonCode: input.reasonCode,
          note,
          requesterReauthenticated: reauthenticated,
        },
        { reservationCode: own?.code ?? null, requestId: req.id },
      );
      return { status: 201, body: await this.approvals.toDto(tx, row) };
    });
    return applyResult(reply, result);
  }

  private async assertOwn(tx: Tx, reservationId: string, userId: string): Promise<void> {
    const own = this.reservations ? await this.reservations.ownership(tx, reservationId) : null;
    if (!own || (own.createdBy !== userId && own.closerUserId !== userId)) {
      throw problem('NOT_FOUND');
    }
  }
}
