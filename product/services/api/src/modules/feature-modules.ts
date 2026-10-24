/**
 * Feature modules of the api – the ONE list (FB-R2-ARC-BE-12): main.ts imports exactly this; tests import
 * the same list so the guard, interceptors and controllers run as in production.
 * Sprint 1: platform, identity, guests (BE-B); audit S27, approvals S23 (BE-A). Later sprints append here.
 */
import type { DynamicModule, Type } from '@nestjs/common';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditModule } from './audit/audit.module';
import { FolioModule } from './folio/folio.module';
import { GuestsModule } from './guests/guests.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { IdentityModule } from './identity/identity.module';
import { InventoryModule } from './inventory/inventory.module';
import type { IdentityOptions } from './identity/public/identity-options';
import { PaymentsModule } from './payments/payments.module';
import { EventsModule } from './events/events.module';
import { FrontdeskModule } from './frontdesk/frontdesk.module';
import { PlatformModule } from './platform/platform.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SalesModule } from './sales/sales.module';
import { CryptoModule } from './crypto/crypto.module';
import { FilesModule } from './files/files.module';
import { GuestPortalModule } from './guest-portal/guest-portal.module';
import { RegistrationModule } from './registration/registration.module';
import { ReportingModule } from './reporting/reporting.module';
import { PublicSiteModule } from './public-site/public-site.module';

export function featureModules(
  identity: IdentityOptions,
  /** Resolved environment (bootstrap: `X_FILE` secrets read) – keys, blob store, guest-web origin (BE-C). */
  runtimeEnv: NodeJS.ProcessEnv = process.env,
): Array<DynamicModule | Type<unknown>> {
  return [
    PlatformModule,
    IdentityModule.register(identity),
    GuestsModule,
    AuditModule,
    ApprovalsModule,
    // Sprint 2 (BE-B): folio, sales (quotes/leads/commissions), payments (deposits).
    FolioModule,
    SalesModule,
    PaymentsModule,
    // Sprint 2 (BE-A): rack, bookings, inventory (ADR-009), OOO blocks, hold expiry.
    ReservationsModule,
    // Sprint 3 (BE-A): events hub (SSE, staff inbox, "Cần chú ý"), front desk (check-in … check-out, party).
    EventsModule,
    FrontdeskModule,
    // Sprint 3 (BE-B): inventory (minibar counts).
    InventoryModule,
    // Sprint 3 (BE-C): crypto (CryptoService, step-up), files (pipeline, attachments), registration
    // (documents, declaration, J16), guest-portal (guest link, online check-in level 1).
    CryptoModule.register({ env: runtimeEnv }),
    FilesModule.register({ env: runtimeEnv }),
    RegistrationModule.register({ env: runtimeEnv }),
    GuestPortalModule.register({ env: runtimeEnv }),
    // Sprint 4 (BE-C): housekeeping + maintenance (room statuses, tasks, inspections, work orders, J8/J11).
    HousekeepingModule,
    // Sprint 4 (BE-D): reporting – Tổng quan / Hôm nay reads, "Cần chú ý" sources, B11/B12 notices, J2.
    ReportingModule,
    // R3 Sprint 1 (BE-D): public-site – website booking requests + Desk queue S35 (US-155, R3-Q06).
    PublicSiteModule.register({ env: runtimeEnv }),
  ];
}

/**
 * Origin part of comma-separated URLs. Production code takes the validated origins from config.ts
 * (`allowedOrigins.admin/staffPwa`, FB-R2-ARC-BE-12 b); kept for scripts/tests.
 */
export function originsFrom(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new URL(s).origin);
}
