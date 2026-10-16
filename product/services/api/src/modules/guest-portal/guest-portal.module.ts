/**
 * guest-portal module (BE-C Sprint 3; ADR-006, EP06 8, SEC s3-checklist G): guest link (Desk), level-1
 * guest session (cookie __Host-ottimo_gsid), online check-in. Registers:
 * - GUEST_SESSION_RESOLVER for the AuthGuard (guest operations);
 * - FD_GUEST_ACCESS_PORT (BE-A) → GuestAccessPort (B-13): the front desk module calls it in the SAME
 *   transaction when a booking becomes cancelled / no_show (one place only – ORC 16/10, BE-A hook).
 * GUEST_BASE_URL (guest-web origin) builds the link `https://<guest-web>/g/<token>`.
 */
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { defineAuditEntity } from '../audit/public/audit-fields';
import { FD_GUEST_ACCESS_PORT } from '../frontdesk/public/ports';
import { GUEST_SESSION_RESOLVER } from '../../shared/http/guest-session';
import { GuestController } from './internal/guest.controller';
import { GUEST_BASE_URL, GuestLinksController } from './internal/guest-links.controller';
import { GuestPortalService } from './internal/guest-portal.service';
import { GuestSessionResolverService } from './internal/guest-session.resolver';
import { GuestUnitOfWork } from './internal/guest-unit-of-work';
import { GuestAccessPort } from './public/guest-access.port';

defineAuditEntity('guest_access_token', []);
defineAuditEntity('online_checkin', ['hasNote', 'fields']);

export interface GuestPortalOptions {
  env?: NodeJS.ProcessEnv;
}

@Global()
@Module({})
export class GuestPortalModule {
  static register(options: GuestPortalOptions = {}): DynamicModule {
    const env = options.env ?? process.env;
    const base = (env.GUEST_BASE_URL ?? '').trim() || 'http://localhost:8083';
    return {
      module: GuestPortalModule,
      controllers: [GuestController, GuestLinksController],
      providers: [
        { provide: GUEST_BASE_URL, useValue: new URL(base).origin },
        GuestPortalService,
        GuestUnitOfWork,
        GuestSessionResolverService,
        { provide: GUEST_SESSION_RESOLVER, useExisting: GuestSessionResolverService },
        GuestAccessPort,
        { provide: FD_GUEST_ACCESS_PORT, useExisting: GuestAccessPort },
      ],
      exports: [GUEST_SESSION_RESOLVER, FD_GUEST_ACCESS_PORT, GuestAccessPort],
    };
  }
}
