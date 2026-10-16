/**
 * Registration port for the front desk (ARC s3-contract 4.3) – implements BE-A's consumer interface
 * `FrontdeskRegistrationPort` (frontdesk/public/ports.ts) and is bound under FD_REGISTRATION_PORT by
 * RegistrationModule, replacing the fail-closed default. Every call runs in BE-A's transaction (lock order:
 * reservation → … → registration).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
} from '../../frontdesk/public/ports';
import { RegistrationService } from '../internal/registration.service';

@Injectable()
export class RegistrationPortService implements FrontdeskRegistrationPort {
  constructor(@Inject(RegistrationService) private readonly regs: RegistrationService) {}

  checkinDocumentStatus(tx: Tx, reservationId: string): Promise<CheckinDocumentStatus> {
    return this.regs.checkinDocumentStatus(tx, reservationId);
  }

  deadlinePreview(tx: Tx, reservationId: string, at: Date): Promise<Date | null> {
    return this.regs.deadlinePreview(tx, reservationId, at);
  }

  onCheckedIn(tx: Tx, reservationId: string, actualCheckinAt: Date): Promise<Date | null> {
    return this.regs.onCheckedIn(tx, reservationId, actualCheckinAt);
  }

  onCheckInUndone(tx: Tx, reservationId: string): Promise<void> {
    return this.regs.onCheckInUndone(tx, reservationId);
  }

  onDepartureChanged(tx: Tx, reservationId: string): Promise<void> {
    return this.regs.onDepartureChanged(tx, reservationId);
  }

  async onRoomChanged(): Promise<void> {
    // BR-424: a room change is not a new declaration; the room number is read live for the portal data.
  }

  onPartyChanged(tx: Tx, reservationId: string): Promise<void> {
    return this.regs.onPartyChanged(tx, reservationId);
  }

  onPartyMemberRemoved(tx: Tx, reservationId: string, memberId: string): Promise<void> {
    return this.regs.onPartyMemberRemoved(tx, reservationId, memberId);
  }

  /** B18 and B16 (early departure = checkout for retention, DOM G-17). */
  onCheckedOut(tx: Tx, reservationId: string, actualCheckoutAt: Date): Promise<void> {
    return this.regs.onCheckedOut(tx, reservationId, actualCheckoutAt);
  }

  onReservationVoided(tx: Tx, reservationId: string): Promise<void> {
    return this.regs.onReservationVoided(tx, reservationId);
  }
}
