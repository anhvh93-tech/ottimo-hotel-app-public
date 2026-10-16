/**
 * Feature modules of the api – the ONE list (FB-R2-ARC-BE-12): main.ts imports exactly this; tests import
 * the same list so the guard, interceptors and controllers run as in production.
 * Sprint 1: platform, identity, guests (BE-B); audit S27, approvals S23 (BE-A). Later sprints append here.
 */
import type { DynamicModule, Type } from '@nestjs/common';
import { ApprovalsModule } from './approvals/approvals.module';
import { AuditModule } from './audit/audit.module';
import { GuestsModule } from './guests/guests.module';
import { IdentityModule } from './identity/identity.module';
import type { IdentityOptions } from './identity/public/identity-options';
import { PlatformModule } from './platform/platform.module';

export function featureModules(identity: IdentityOptions): Array<DynamicModule | Type<unknown>> {
  return [
    PlatformModule,
    IdentityModule.register(identity),
    GuestsModule,
    AuditModule,
    ApprovalsModule,
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
