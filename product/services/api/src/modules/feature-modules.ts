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
import { IdentityModule } from './identity/identity.module';
import type { IdentityOptions } from './identity/public/identity-options';
import { PaymentsModule } from './payments/payments.module';
import { PlatformModule } from './platform/platform.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SalesModule } from './sales/sales.module';

export function featureModules(identity: IdentityOptions): Array<DynamicModule | Type<unknown>> {
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
