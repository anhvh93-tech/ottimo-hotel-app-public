/**
 * identity module (architecture 5.1): login/sessions (US-001), users & roles (US-002), trusted devices
 * (US-142), two-step login + recovery codes + S2 step-up (US-143, 0.3.8). Global so other modules can use SessionService / RateLimiter (public/).
 * Registers SessionPolicyInterceptor globally (idle timeout, user status, temporary password) and the
 * CSRF_VERIFIER used by the AuthGuard (CSRF/Origin are checked there).
 */
import {
  type DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  type OnModuleInit,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CLOCK, type Clock } from '../../clock';
import { CSRF_VERIFIER } from '../../shared/http/csrf';
import { AuthController } from './internal/auth.controller';
import { AuthService } from './internal/auth.service';
import { DevicesController } from './internal/devices.controller';
import { MfaController } from './internal/mfa.controller';
import { MfaService } from './internal/mfa.service';
import { MfaStore } from './public/mfa-store';
import { StrongReauthService } from './public/strong-reauth';
import { DevicesService } from './internal/devices.service';
import { MeService } from './internal/me.service';
import { SessionPolicyInterceptor } from './internal/session-policy.interceptor';
import { UsersController } from './internal/users.controller';
import { UsersService } from './internal/users.service';
import { IDENTITY_OPTIONS, type IdentityOptions } from './public/identity-options';
import { RATE_LIMITER, RateLimiter } from './public/rate-limiter';
import { SessionService } from './public/session.service';
import { IdentityParamsService } from './public/identity-params';
import { CloserCandidatesController } from './internal/closer-candidates.controller';
import { PasswordReauth } from './public/password-reauth';
import { assertCommonPasswordList } from './public/passwords';
import './audit-entities';

/** SR-AUTH-02 start-up check: staging/production stop without the ≥ 10.000-entry offline list. */
@Injectable()
class CommonPasswordListCheck implements OnModuleInit {
  constructor(@Inject(IDENTITY_OPTIONS) private readonly options: IdentityOptions) {}
  onModuleInit(): void {
    assertCommonPasswordList(this.options.appEnv);
  }
}

@Global()
@Module({})
export class IdentityModule {
  static register(options: IdentityOptions): DynamicModule {
    return {
      module: IdentityModule,
      controllers: [
        AuthController,
        MfaController,
        UsersController,
        DevicesController,
        CloserCandidatesController,
      ],
      providers: [
        { provide: IDENTITY_OPTIONS, useValue: options },
        CommonPasswordListCheck,
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
        IdentityParamsService,
        MfaStore,
        StrongReauthService,
        MfaService,
        AuthService,
        UsersService,
        DevicesService,
        SessionPolicyInterceptor,
        { provide: APP_INTERCEPTOR, useExisting: SessionPolicyInterceptor },
      ],
      exports: [
        IDENTITY_OPTIONS,
        RATE_LIMITER,
        SessionService,
        CSRF_VERIFIER,
        PasswordReauth,
        IdentityParamsService,
        // 0.3.8 (US-143): S2 step-up for every `x-strong-reauth` operation (BE-B R3-Q51 uses it).
        StrongReauthService,
      ],
    };
  }
}
