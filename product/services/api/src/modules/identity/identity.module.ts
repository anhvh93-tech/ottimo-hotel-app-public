/**
 * identity module (architecture 5.1): login/sessions (US-001), users & roles (US-002), trusted devices
 * (US-142). Global so other modules can use SessionService / RateLimiter (public/).
 * Registers SessionPolicyInterceptor globally (idle timeout, user status, temporary password) and the
 * CSRF_VERIFIER used by the AuthGuard (CSRF/Origin are checked there).
 */
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CLOCK, type Clock } from '../../clock';
import { CSRF_VERIFIER } from '../../shared/http/csrf';
import { AuthController } from './internal/auth.controller';
import { AuthService } from './internal/auth.service';
import { DevicesController } from './internal/devices.controller';
import { DevicesService } from './internal/devices.service';
import { MeService } from './internal/me.service';
import { SessionPolicyInterceptor } from './internal/session-policy.interceptor';
import { UsersController } from './internal/users.controller';
import { UsersService } from './internal/users.service';
import { IDENTITY_OPTIONS, type IdentityOptions } from './public/identity-options';
import { RATE_LIMITER, RateLimiter } from './public/rate-limiter';
import { SessionService } from './public/session.service';
import { PasswordReauth } from './public/password-reauth';
import { defineAuditEntity } from '../audit/public/audit-fields';

// Audit allowlists (SR-AUD-03) of the entities this module writes.
defineAuditEntity('app_user', [
  'clientOrigin',
  'lockCount',
  'until',
  'username',
  'roles',
  'displayName',
  'status',
  'passwordReset',
]);
defineAuditEntity('trusted_device', ['name', 'deviceKind', 'expiresAt', 'revokedAt']);

@Global()
@Module({})
export class IdentityModule {
  static register(options: IdentityOptions): DynamicModule {
    return {
      module: IdentityModule,
      controllers: [AuthController, UsersController, DevicesController],
      providers: [
        { provide: IDENTITY_OPTIONS, useValue: options },
        {
          provide: RATE_LIMITER,
          useFactory: (clock: Clock) => new RateLimiter(clock),
          inject: [CLOCK],
        },
        SessionService,
        // AuthGuard (BE-A) checks X-CSRF-Token through this verifier (shared/http/csrf.ts).
        { provide: CSRF_VERIFIER, useExisting: SessionService },
        MeService,
        PasswordReauth,
        AuthService,
        UsersService,
        DevicesService,
        SessionPolicyInterceptor,
        { provide: APP_INTERCEPTOR, useExisting: SessionPolicyInterceptor },
      ],
      exports: [IDENTITY_OPTIONS, RATE_LIMITER, SessionService, CSRF_VERIFIER, PasswordReauth],
    };
  }
}
