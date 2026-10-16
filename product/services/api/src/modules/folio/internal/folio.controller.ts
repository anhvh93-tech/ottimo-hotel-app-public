/**
 * Folio endpoints: getFolio (S04 money block – US-020, US-119), requestFoc (A35, US-007 AC1) – Sprint 2;
 * Sprint 3 (0.3.6): getChargeCatalog, addFolioLine (A30), adjustFolioLine (A31/A32), getBill (US-037,
 * G-12/G-13), setInvoiceRequest (US-039, A38).
 * Scope M (x-scope sales_staff: own, collaborator: own_totals_only): a SAL/CTV only reaches the folio of a
 * booking they created or closed – otherwise 404 (never 403, no existence leak). The role serializer then
 * strips lines/payments/other totals for CTV.
 */
import {
  Body,
  Controller,
  Get,
  Inject,
  Optional,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { etag, expectedVersion } from '../../../shared/http/precondition';
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
import { AuditService } from '../../audit/public/audit.service';
import { folioDto } from '../public/folio-view';
import { type FolioRow, FolioService } from '../public/folio.service';
import { BillService, invoiceDto } from './bill.service';
import { FolioLinesService } from './folio-lines.service';
import { FolioFocService } from './foc.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FULL_SCOPE = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

const money = z.number().int().max(Number.MAX_SAFE_INTEGER);

const lineSchema = z.object({
  chargeCode: z.string().max(80).optional(),
  category: z.string().max(40).optional(),
  description: z.string().max(200).optional(),
  quantity: z.number().max(1_000_000),
  unitPriceVnd: money.optional(),
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  note: z.string().max(500).optional(),
  evidenceAttachmentIds: z.array(z.string().regex(UUID)).max(20).optional(),
  proposedUnitPriceVnd: money.optional(),
});

const adjustSchema = z.object({
  newQuantity: z.number().min(0).max(1_000_000).optional(),
  newUnitPriceVnd: money.optional(),
  voidLine: z.boolean().optional(),
  reason: z.string().max(500),
});

const invoiceSchema = z.object({
  buyerType: z.string().max(20),
  companyName: z.string().max(400).optional(),
  taxCode: z.string().max(40).optional(),
  email: z.string().max(400).optional(),
  address: z.string().max(600).optional(),
  einvoiceStatus: z.string().optional(),
});

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

@Controller('v1/properties/:propertyId')
export class FolioController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(FolioFocService) private readonly foc: FolioFocService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(PasswordReauth) private readonly reauth: PasswordReauth,
    @Inject(FolioLinesService) private readonly lineService: FolioLinesService,
    @Inject(BillService) private readonly bills: BillService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
  ) {}

  @Get('folios/:folioId')
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
        return this.folioBody(tx, folio);
      },
      { readOnly: true },
    );
    reply.header('etag', etag(body.version as number));
    return body;
  }

  @Post('folios/:folioId/lines/:lineId/foc')
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

  private async folioBody(tx: Tx, folio: FolioRow): Promise<Record<string, unknown>> {
    const tz = await this.folios.timezone(tx);
    const inv = await this.bills.invoice(tx, folio.id);
    return folioDto(
      folio,
      await this.folios.lines(tx, folio.id),
      await this.folios.payments(tx, folio.id),
      tz,
      inv ? invoiceDto(inv) : null,
    );
  }

  /** Booking of a folio + its stay dates and code (FD+ endpoints). */
  private async stayOf(tx: Tx, folio: FolioRow) {
    if (!this.reservations) throw new Error('reservations module not wired');
    const v = await this.reservations.reservationView(tx, folio.primary_reservation_id);
    return {
      reservationId: folio.primary_reservation_id,
      code: String(v.code),
      arrivalDate: String(v.arrivalDate),
      departureDate: String(v.departureDate),
    };
  }

  @Get('charge-catalog')
  @Operation('getChargeCatalog')
  async catalog(@Req() req: GuardedRequest) {
    const p = principal(req);
    return this.db.withContext(
      tenantOf(p),
      async (tx) => ({ data: await this.lineService.catalog(tx) }),
      {
        readOnly: true,
      },
    );
  }

  @Post('folios/:folioId/lines')
  @Operation('addFolioLine')
  async addLine(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(lineSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const folio = await this.folios.get(tx, folioId);
      if (!folio) throw problem('NOT_FOUND');
      const stay = await this.stayOf(tx, folio);
      await this.lineService.add(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        folio.id,
        input,
        stay,
      );
      const fresh = (await this.folios.get(tx, folio.id)) as FolioRow;
      return { status: 201, body: await this.folioBody(tx, fresh) };
    });
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Post('folios/:folioId/lines/:lineId/adjustments')
  @Operation('adjustFolioLine')
  async adjustLine(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Param('lineId') lineId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId) || !UUID.test(lineId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(adjustSchema, body);
    const version = expectedVersion(req);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const folio = await this.folios.get(tx, folioId);
      if (!folio) throw problem('NOT_FOUND');
      const own = this.reservations
        ? await this.reservations.ownership(tx, folio.primary_reservation_id)
        : null;
      await this.lineService.adjust(
        tx,
        { userId: p.userId, roles: p.roles, requestId: req.id },
        folio.id,
        lineId,
        version,
        input,
        own?.code ?? null,
      );
      const fresh = (await this.folios.get(tx, folio.id)) as FolioRow;
      return { status: 201, body: await this.folioBody(tx, fresh) };
    });
    reply.header('etag', etag(result.body.version as number));
    return applyResult(reply, result);
  }

  @Get('folios/:folioId/bill')
  @Operation('getBill')
  async bill(@Req() req: GuardedRequest, @Param('folioId') folioId: string) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    const p = principal(req);
    return this.db.withContext(
      tenantOf(p),
      async (tx) => {
        const folio = await this.folios.get(tx, folioId);
        if (!folio) throw problem('NOT_FOUND');
        return this.bills.bill(tx, folio);
      },
      { readOnly: true },
    );
  }

  @Put('folios/:folioId/invoice-request')
  @Operation('setInvoiceRequest')
  async setInvoice(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('folioId') folioId: string,
    @Body() body: unknown,
  ) {
    if (!UUID.test(folioId)) throw problem('NOT_FOUND');
    rejectDryRun(body);
    const input = parseBody(invoiceSchema, body);
    const p = principal(req);
    const result = await this.uow.run(req, async (tx) => {
      const folio = await this.folios.lock(tx, folioId);
      if (!folio) throw problem('NOT_FOUND');
      const row = await this.bills.setInvoice(tx, folio, { userId: p.userId }, input);
      const own = this.reservations
        ? await this.reservations.ownership(tx, folio.primary_reservation_id)
        : null;
      await this.audit.record(tx, {
        category: 'state',
        action: 'invoice_request.set',
        entityType: 'invoice_request',
        entityId: folio.id,
        ...(own ? { entityCode: own.code } : {}),
        after: { buyerType: row.buyer_type, einvoiceStatus: row.einvoice_status },
        requestId: req.id,
      });
      return { status: 200, body: invoiceDto(row) };
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
