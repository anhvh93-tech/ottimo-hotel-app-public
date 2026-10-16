/**
 * Global response serializer (SR-AZ-04): every handler bound to an OpenAPI operation has its return
 * value rebuilt by the role serializer before Fastify writes it. Routes outside the contract
 * (@PublicRoute: /health, test-support) are left as they are. Errors never pass here (ProblemFilter).
 * Idempotent replays go through the same path, so a stored response is filtered for the current caller.
 * SEC-BE-33 (3) safety net: a staff request whose role decision was deferred by the guard (idempotent replay
 * lookup) and never applied by the UnitOfWork is refused here (403 + access.denied) instead of answered –
 * a handler that skips `uow.run` can no longer fail open.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, mergeMap } from 'rxjs';
import { AuthGuard, type GuardedRequest } from '../http/auth.guard';
import { serializeResponse } from './serializer';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SerializeInterceptor');

  constructor(@Inject(AuthGuard) private readonly guard: AuthGuard) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const req = http.getRequest<GuardedRequest>();
    const auth = req.ottimoAuth;
    if (!auth) return next.handle();
    const guestCall = !!auth.guest || auth.operation.roles.includes('guest');
    return next.handle().pipe(
      mergeMap(async (body: unknown) => {
        if (auth.principal && !auth.enforced && !auth.allowed) {
          this.logger.error(`role decision never applied for ${auth.operationId} – refused`);
          await this.guard.enforce(req);
        }
        const reply = http.getResponse<{ statusCode?: number }>();
        return serializeResponse(auth.operationId, reply.statusCode, body, {
          // A guest-session caller is the role `guest` (rbac D-codes: no staff deny applies) and only
          // receives properties up to its session level (x-guest-level, SEC ĐK-2).
          // openGuestSession (security: [], x-roles [guest]) answers at level 1 before the cookie exists.
          roles: auth.principal?.roles ?? (guestCall ? ['guest'] : []),
          c3: auth.operation.c3Log,
          ...(guestCall ? { guestLevel: auth.guest?.level ?? 1 } : {}),
        });
      }),
    );
  }
}
