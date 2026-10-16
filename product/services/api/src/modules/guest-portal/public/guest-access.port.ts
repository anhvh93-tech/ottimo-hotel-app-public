/**
 * GuestAccessPort (ARC s3-contract 4.3, B-13, SEC G4) – implements BE-A's consumer interface
 * `FrontdeskGuestAccessPort` (frontdesk/public/ports.ts) and is bound under FD_GUEST_ACCESS_PORT by
 * GuestPortalModule, replacing the no-op: cancel / no-show / relocation revoke every guest link and
 * session of the booking in the caller's transaction. restoreNoShow never re-opens them.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type { FrontdeskGuestAccessPort } from '../../frontdesk/public/ports';
import { GuestPortalService } from '../internal/guest-portal.service';

@Injectable()
export class GuestAccessPort implements FrontdeskGuestAccessPort {
  constructor(@Inject(GuestPortalService) private readonly portal: GuestPortalService) {}

  revokeAllForReservation(
    tx: Tx,
    reservationId: string,
    reason: 'cancelled' | 'no_show' | 'relocated' | 'revoked' = 'revoked',
  ): Promise<number> {
    return this.portal.revokeAll(tx, reservationId, reason);
  }
}
