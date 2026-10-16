/**
 * issueGuestLink / revokeGuestLink (US-106 AC1; SR-GST-01/04; A22a, A114). The token is returned ONCE:
 * the idempotency row keeps no body (storeBody: false), so a replayed request never shows the link again.
 */
import { Controller, Delete, HttpCode, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { GuestPortalService } from './guest-portal.service';

export const GUEST_BASE_URL = Symbol('GUEST_BASE_URL');

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('v1/properties/:propertyId/reservations/:reservationId/guest-link')
export class GuestLinksController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(GuestPortalService) private readonly portal: GuestPortalService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(GUEST_BASE_URL) private readonly guestBaseUrl: string,
  ) {}

  @Post()
  @Operation('issueGuestLink')
  async issue(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('reservationId') reservationId: string,
  ) {
    if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
    const p = req.ottimoAuth?.principal;
    if (!p) throw problem('UNAUTHENTICATED');
    reply.header('Cache-Control', 'no-store');
    reply.header('Referrer-Policy', 'no-referrer');
    const result = await this.uow.run(
      req,
      async (tx) => ({
        status: 201,
        body: await this.portal.issueLink(
          tx,
          { userId: p.userId, requestId: req.id },
          reservationId,
          this.guestBaseUrl,
        ),
      }),
      { storeBody: false },
    );
    return applyResult(reply, result);
  }

  @Delete()
  @HttpCode(204)
  @Operation('revokeGuestLink')
  async revoke(@Req() req: GuardedRequest, @Param('reservationId') reservationId: string) {
    if (!UUID.test(reservationId)) throw problem('NOT_FOUND');
    const p = req.ottimoAuth?.principal;
    if (!p) throw problem('UNAUTHENTICATED');
    await this.db.withContext(tenantOf(p), async (tx) => {
      const own = await this.portal.bookingVisible(tx, reservationId);
      if (!own) throw problem('NOT_FOUND');
      const n = await this.portal.revokeAll(tx, reservationId, 'revoked');
      await this.audit.record(tx, {
        category: 'security',
        action: 'guest_link.revoked',
        entityType: 'reservation',
        entityId: reservationId,
        reason: `tokens:${n}`,
        requestId: req.id,
      });
    });
  }
}
