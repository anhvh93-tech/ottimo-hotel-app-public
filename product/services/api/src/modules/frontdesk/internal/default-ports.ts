/**
 * Defaults of the front desk ports until their owners bind an implementation (see public/ports.ts). They
 * fail CLOSED where a wrong "yes" would harm: no registration module → the booker's document is "missing"
 * (check-in blocked), no crypto → child data refused (never stored in clear).
 */
import { problem } from '../../../shared/problem';
import type {
  CheckinDocumentStatus,
  EncryptedChildData,
  FrontdeskChildDataPort,
  FrontdeskGuestAccessPort,
  FrontdeskMinibarPort,
  FrontdeskRegistrationPort,
  MinibarCheckoutStatus,
} from '../public/ports';

export class UnwiredRegistrationPort implements FrontdeskRegistrationPort {
  async checkinDocumentStatus(): Promise<CheckinDocumentStatus> {
    return {
      mainGuestDocument: false,
      documentCheckBlock: false,
      pendingOnlineCheckin: false,
      visaExpiresBeforeDeparture: false,
      passportExpiresDuringStay: false,
    };
  }
  async deadlinePreview(): Promise<Date | null> {
    return null;
  }
  async onCheckedIn(): Promise<Date | null> {
    return null;
  }
  async onCheckInUndone(): Promise<void> {}
  async onDepartureChanged(): Promise<void> {}
  async onRoomChanged(): Promise<void> {}
  async onPartyChanged(): Promise<void> {}
  async onPartyMemberRemoved(): Promise<void> {}
  async onCheckedOut(): Promise<void> {}
  async onReservationVoided(): Promise<void> {}
  async earliestVisaValidUntil(): Promise<string | null> {
    return null;
  }
}

export class NoGuestAccessPort implements FrontdeskGuestAccessPort {
  async revokeAllForReservation(): Promise<number> {
    return 0;
  }
}

export class UnwiredChildDataPort implements FrontdeskChildDataPort {
  async encryptChild(): Promise<EncryptedChildData> {
    throw problem('SERVICE_UNAVAILABLE', {
      detail: 'child data needs the crypto module (C3 is never stored in clear)',
      headers: { 'Retry-After': '60' },
    });
  }
  async destroy(): Promise<void> {
    throw problem('SERVICE_UNAVAILABLE', { headers: { 'Retry-After': '60' } });
  }
}

export class NoMinibarPort implements FrontdeskMinibarPort {
  async checkoutStatus(): Promise<MinibarCheckoutStatus> {
    return { required: false, checked: true };
  }
  async onCheckedOut(): Promise<string | null> {
    return null;
  }
}
