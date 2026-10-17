/**
 * Front desk endpoints (OpenAPI 0.3.6 tags checkin / stay / checkout / party): EP03-05 + US-022.
 * Roles come from x-roles (AuthGuard, before anything here); checkIn also needs a trusted device
 * (x-requires-trusted-device, guard). Writes run in ONE UnitOfWork transaction (Idempotency-Key + If-Match);
 * reads and every `dryRun` run in a READ ONLY transaction without those headers (SEC A3 / A-30 – never
 * `uow.run` for a dry run).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { expectedVersion, setETag } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { isDryRun } from '../../../shared/validation';
import { ApprovalService } from '../../approvals/public/approval.service';
import { nightsOf } from '../../reservations/public/pricing';
import type { GuestUploadChoice } from '../public/ports';
import {
  type BookingContext,
  type ReservationRow,
  asBody,
  pathId,
} from '../../reservations/public/stay-port';
import { CheckinService } from './checkin.service';
import { CheckoutService } from './checkout.service';
import { PartyService } from './party.service';
import { StayService } from './stay.service';
import { StaySupport } from './stay-support';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p?.propertyId) throw problem('UNAUTHENTICATED');
  return p;
}

/** `guestUploadPersonIndex` (0.3.7, S4-39): integer 2…20 or `none`; absent/empty = not sent. */
function queryGuestUpload(v: string | undefined): GuestUploadChoice | undefined {
  if (v === undefined || v === '') return undefined;
  if (v === 'none') return 'none';
  if (/^\d{1,2}$/.test(v)) {
    const n = Number(v);
    if (n >= 2 && n <= 20) return n;
  }
  throw problem('VALIDATION_FAILED', {
    errors: [{ field: 'guestUploadPersonIndex', code: 'NOT_IN_LIST' }],
  });
}

function queryTime(field: string, v: string | undefined): string | undefined {
  if (v === undefined || v === '') return undefined;
  if (!TIME.test(v))
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'VALIDATION_FAILED' }] });
  return v;
}

@Controller('v1/properties/:propertyId/reservations/:reservationId')
export class FrontdeskController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(StaySupport) private readonly s: StaySupport,
    @Inject(CheckinService) private readonly checkin: CheckinService,
    @Inject(StayService) private readonly stays: StayService,
    @Inject(CheckoutService) private readonly checkout: CheckoutService,
    @Inject(PartyService) private readonly party: PartyService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
  ) {}

  private ctx(tx: Tx, req: GuardedRequest): Promise<BookingContext> {
    const p = principal(req);
    return this.s.context(tx, { userId: p.userId, roles: p.roles }, req.id);
  }

  /** Read-only transaction (GET and every dry run – SEC A3). */
  private read<T>(
    req: GuardedRequest,
    fn: (tx: Tx, ctx: BookingContext) => Promise<T>,
  ): Promise<T> {
    // SEC-BE-33 / ARC-BE-S3-04 second line: a read never runs on a role the guard refused, whatever header
    // deferred the decision (the guard enforces dry runs itself – this only catches a future regression).
    if (!req.ottimoAuth?.allowed) throw problem('FORBIDDEN_ACTION');
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => fn(tx, await this.ctx(tx, req)),
      { readOnly: true },
    );
  }

  private async reservationResult(
    req: GuardedRequest,
    reply: Reply,
    fn: (tx: Tx, ctx: BookingContext) => Promise<ReservationRow>,
  ) {
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const row = await fn(tx, ctx);
      return { status: 200, body: await this.s.stay.dtoOf(tx, ctx, row) };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  // ───────────── check-in (S06) ─────────────

  @Get('check-in-preview')
  @Operation('previewCheckIn')
  preview(
    @Req() req: GuardedRequest,
    @Param('reservationId') reservationId: string,
    @Query('checkinTime') checkinTime?: string,
  ) {
    const id = pathId(reservationId);
    const t = queryTime('checkinTime', checkinTime);
    return this.read(req, (tx, ctx) => this.checkin.preview(tx, ctx, id, t));
  }

  @Post('actions/check-in')
  @Operation('checkIn')
  async checkIn(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const result = await this.uow.run<Record<string, unknown>>(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.checkin.checkIn(tx, ctx, id, expectedVersion(req), asBody(raw));
      if ('approval' in r) {
        return { status: 202, body: { ...(await this.approvals.toDto(tx, r.approval)) } };
      }
      return { status: 200, body: await this.s.stay.dtoOf(tx, ctx, r.row) };
    });
    const out = applyResult(reply, result);
    if (result.status === 200 && typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Post('actions/undo-check-in')
  @Operation('undoCheckIn')
  undo(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    return this.reservationResult(req, reply, (tx, ctx) =>
      this.checkin.undo(tx, ctx, id, expectedVersion(req), asBody(raw)),
    );
  }

  // ───────────── stay (S08) ─────────────

  @Get('extension-options')
  @Operation('getExtensionOptions')
  extensionOptions(@Req() req: GuardedRequest, @Param('reservationId') reservationId: string) {
    const id = pathId(reservationId);
    return this.read(req, (tx, ctx) => this.stays.extensionOptions(tx, ctx, id));
  }

  @Post('actions/extend')
  @Operation('extendStay')
  async extend(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.stays.extend(tx, ctx, id, expectedVersion(req), asBody(raw));
      return {
        status: 200,
        body: {
          reservation: await this.s.stay.dtoOf(tx, ctx, r.row),
          ...(r.child ? { childReservation: childSummary(r.child) } : {}),
        },
      };
    });
    const out = applyResult(reply, result) as { reservation?: { version?: number } };
    if (typeof out.reservation?.version === 'number') setETag(reply, out.reservation.version);
    return out;
  }

  @Post('actions/late-checkout')
  @Operation('setLateCheckout')
  async lateCheckout(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const body = asBody(raw);
    if (isDryRun(body)) {
      // SEC A3 [CHẶN]: no Idempotency-Key / If-Match, READ ONLY transaction – nothing can be written.
      reply.status(200);
      return this.read(req, async (tx, ctx) => {
        const r = await this.stays.lateCheckout(tx, ctx, id, null, body, true);
        return r.body;
      });
    }
    const result = await this.uow.run<Record<string, unknown>>(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.stays.lateCheckout(tx, ctx, id, expectedVersion(req), body, false);
      if (r.approval) {
        return { status: 202, body: { ...(await this.approvals.toDto(tx, r.approval)) } };
      }
      return {
        status: 200,
        body: {
          ...r.body,
          ...(r.row ? { reservation: await this.s.stay.dtoOf(tx, ctx, r.row) } : {}),
        },
      };
    });
    const out = applyResult(reply, result) as { reservation?: { version?: number } };
    if (typeof out.reservation?.version === 'number') setETag(reply, out.reservation.version);
    return out;
  }

  @Post('actions/change-room')
  @Operation('changeRoom')
  async changeRoom(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const body = asBody(raw);
    if (isDryRun(body)) {
      reply.status(200);
      return this.read(req, async (tx, ctx) => {
        const r = await this.stays.changeRoom(tx, ctx, id, null, body, true);
        if (!('preview' in r)) throw new Error('dry run wrote');
        return r.preview;
      });
    }
    return this.reservationResult(req, reply, async (tx, ctx) => {
      const r = await this.stays.changeRoom(tx, ctx, id, expectedVersion(req), body, false);
      if (!('row' in r)) throw new Error('change room without result');
      return r.row;
    });
  }

  @Post('actions/early-departure')
  @Operation('earlyDeparture')
  async earlyDeparture(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    // OpenAPI 0.3.6 bổ sung 2 (E04-06): EarlyDepartureResult.
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.stays.earlyDeparture(tx, ctx, id, expectedVersion(req), asBody(raw));
      return {
        status: 200,
        body: {
          reservation: await this.s.stay.dtoOf(tx, ctx, r.row),
          earlyDepartureFeeVnd: r.earlyDepartureFeeVnd,
          refundVnd: r.refundVnd,
          // 0.3.6 bổ sung 4 (DOM 17/10 (4)): the collected / only-reversed BR-110 fee of the dropped nights.
          extraPersonRefundVnd: r.extraPersonRefundVnd,
          extraPersonReversedVnd: r.extraPersonReversedVnd,
          refundRequestId: r.refundRequestId,
        },
      };
    });
    const out = applyResult(reply, result) as { reservation?: { version?: number } };
    if (typeof out.reservation?.version === 'number') setETag(reply, out.reservation.version);
    return out;
  }

  @Get('checkout-confirmations')
  @Operation('listCheckoutReminders')
  reminders(@Req() req: GuardedRequest, @Param('reservationId') reservationId: string) {
    const id = pathId(reservationId);
    return this.read(req, (tx, ctx) => this.stays.listReminders(tx, ctx, id));
  }

  @Post('checkout-confirmations')
  @Operation('recordCheckoutConfirmation')
  async confirm(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      return { status: 201, body: await this.stays.recordConfirmation(tx, ctx, id, asBody(raw)) };
    });
    return applyResult(reply, result);
  }

  // ───────────── check-out (S07) ─────────────

  @Get('checkout-summary')
  @Operation('getCheckoutSummary')
  summary(
    @Req() req: GuardedRequest,
    @Param('reservationId') reservationId: string,
    @Query('checkoutTime') checkoutTime?: string,
    @Query('checkoutAt') checkoutAt?: string,
  ) {
    const id = pathId(reservationId);
    const t = queryTime('checkoutTime', checkoutTime);
    let at: Date | undefined;
    if (checkoutAt !== undefined && checkoutAt !== '') {
      if (Number.isNaN(Date.parse(checkoutAt))) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'checkoutAt', code: 'DATE_INVALID' }],
        });
      }
      at = new Date(checkoutAt);
    }
    return this.read(req, (tx, ctx) =>
      this.checkout.summary(tx, ctx, id, { checkoutTime: t, checkoutAt: at }),
    );
  }

  @Post('actions/check-out')
  @Operation('checkOut')
  async checkOut(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      const r = await this.checkout.checkOut(tx, ctx, id, expectedVersion(req), asBody(raw));
      return {
        status: 200,
        body: {
          reservation: await this.s.stay.dtoOf(tx, ctx, r.row),
          billNo: r.billNo,
          createdTaskIds: r.createdTaskIds,
        },
      };
    });
    const out = applyResult(reply, result) as { reservation?: { version?: number } };
    if (typeof out.reservation?.version === 'number') setETag(reply, out.reservation.version);
    return out;
  }

  // ───────────── party (US-022) ─────────────

  @Get('party')
  @Operation('listParty')
  async listParty(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
  ) {
    const id = pathId(reservationId);
    const out = await this.read(req, (tx, ctx) => this.party.list(tx, ctx, id));
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Post('party')
  @Operation('addPartyMember')
  async addPartyMember(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Body() raw: unknown,
  ) {
    const id = pathId(reservationId);
    const body = asBody(raw);
    if (isDryRun(body)) {
      reply.status(200);
      return this.read(req, (tx, ctx) => this.party.add(tx, ctx, id, body, true));
    }
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      return { status: 201, body: await this.party.add(tx, ctx, id, body, false) };
    });
    const out = applyResult(reply, result) as { version?: number };
    if (typeof out.version === 'number') setETag(reply, out.version);
    return out;
  }

  @Delete('party/:memberId')
  @Operation('removePartyMember')
  async removePartyMember(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
    @Param('memberId') memberId: string,
    @Query('guestUploadPersonIndex') guestUploadPersonIndex?: string,
  ) {
    const id = pathId(reservationId);
    const member = pathId(memberId);
    const guestUpload = queryGuestUpload(guestUploadPersonIndex);
    const result = await this.uow.run(req, async (tx) => {
      const ctx = await this.ctx(tx, req);
      await this.party.remove(tx, ctx, id, member, expectedVersion(req), guestUpload);
      return { status: 204, body: null };
    });
    applyResult(reply, result);
    return undefined;
  }
}

/** OpenAPI ReservationSummary of the child booking (BR-422) – same room as the parent. */
function childSummary(child: ReservationRow): Record<string, unknown> {
  return {
    id: child.id,
    code: child.code,
    status: child.status,
    stayType: child.stay_type,
    arrivalDate: child.arrival_date,
    departureDate: child.departure_date,
    nights: nightsOf(child.arrival_date, child.departure_date),
    channelCode: child.channel_code,
    conflictState: child.conflict_state,
  };
}
