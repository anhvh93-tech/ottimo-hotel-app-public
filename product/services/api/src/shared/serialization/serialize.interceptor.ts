/**
 * Global response serializer (SR-AZ-04): every handler bound to an OpenAPI operation has its return
 * value rebuilt by the role serializer before Fastify writes it. Routes outside the contract
 * (@PublicRoute: /health, test-support) are left as they are. Errors never pass here (ProblemFilter).
 * Idempotent replays go through the same path, so a stored response is filtered for the current caller.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { type Observable, map } from 'rxjs';
import type { GuardedRequest } from '../http/auth.guard';
import { serializeResponse } from './serializer';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const req = http.getRequest<GuardedRequest>();
    const auth = req.ottimoAuth;
    if (!auth) return next.handle();
    return next.handle().pipe(
      map((body: unknown) => {
        const reply = http.getResponse<{ statusCode?: number }>();
        return serializeResponse(auth.operationId, reply.statusCode, body, {
          roles: auth.principal?.roles ?? [],
          c3: auth.operation.c3Log,
        });
      }),
    );
  }
}
