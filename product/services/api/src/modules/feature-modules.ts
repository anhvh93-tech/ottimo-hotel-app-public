/**
 * Feature modules of the api (BE-B Sprint 1: platform, identity, guests). main.ts imports them; tests
 * import the same list so the guard, interceptors and controllers run exactly as in production.
 * BE-A / later sprints append their modules here.
 */
import type { DynamicModule, Type } from '@nestjs/common';
import { GuestsModule } from './guests/guests.module';
import { IdentityModule } from './identity/identity.module';
import type { IdentityOptions } from './identity/public/identity-options';
import { PlatformModule } from './platform/platform.module';

export function featureModules(identity: IdentityOptions): Array<DynamicModule | Type<unknown>> {
  return [PlatformModule, IdentityModule.register(identity), GuestsModule];
}

/** Allowed Origin values from the environment (SR-SES-04): origin part of the URLs, comma-separated. */
export function originsFrom(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => new URL(s).origin);
}
