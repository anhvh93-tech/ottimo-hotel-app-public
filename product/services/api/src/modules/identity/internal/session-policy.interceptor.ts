/**
 * Per-request session policy for authenticated staff requests (runs after the global AuthGuard, before
 * the handler – so nothing of the business runs when it refuses):
 * 1. Validity (revoked, expires_at, idle_expires_at, disabled account → 401) is decided by the AuthGuard
 *    from the single auth_resolve_session call (0.3.4 returns client_origin, last_active_at,
 *    must_change_password too – FB-R2-ARC-BE-05). This interceptor reads that state from the principal:
 *    no extra query on the request path.
 * 2. Sliding idle timeout: at most once a minute per session (idle precision ±1 min) one UPDATE moves
 *    last_active_at / idle_expires_at (session_policy by client – SR-SES-03).
 * 3. Temporary password (must_change_password) → 403 PASSWORD_CHANGE_REQUIRED except changeMyPassword,
 *    getMe, logout (SR-AUTH-05, OpenAPI login).
 * CSRF/Origin (SR-SES-04) are checked by the AuthGuard with SessionService as CSRF_VERIFIER.
 */
import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext } from '../../../db/database';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import { problem } from '../../../shared/problem';
import { IdentityParamsService } from '../public/identity-params';
import type { SessionPolicy } from '../public/session.service';

const ALLOWED_WITH_TEMP_PASSWORD = new Set(['changeMyPassword', 'getMe', 'logout']);
/** Write last_active_at at most once a minute per session (idle precision ±1 min). */
const TOUCH_EVERY_MS = 60_000;
const POLICY_CACHE_MS = 60_000;

@Injectable()
export class SessionPolicyInterceptor implements NestInterceptor {
  private readonly policyCache = new Map<string, { policy: SessionPolicy; until: number }>();

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IdentityParamsService) private readonly identityParams: IdentityParamsService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<GuardedRequest>();
    const auth = req.ottimoAuth;
    const p = auth?.principal;
    if (!auth || !p) return next.handle();
    const s = p.session;
    if (!s)
      throw new Error('AuthGuard principal without session state (auth_resolve_session < 0.3.4)');

    const now = this.clock.now();
    if (!s.lastActiveAt || now.getTime() - s.lastActiveAt.getTime() >= TOUCH_EVERY_MS) {
      const ctx: TenantContext = {
        organizationId: p.organizationId,
        propertyId: p.propertyId,
        userId: p.userId,
        actorType: 'user',
      };
      // Strictest session_policy across the user's properties (0.3.4), cached ≤ 60 s per user.
      const policy = await this.policy(
        p.userId,
        async () => (await this.identityParams.forUser(ctx)).session,
      );
      await this.db.withContext(ctx, async (tx) => {
        const idle = new Date(
          Math.min(
            now.getTime() + policy[s.clientOrigin].idleMinutes * 60_000,
            s.expiresAt.getTime(),
          ),
        );
        // Guarded by revoked_at: a revoke committed after our read is never undone.
        await tx.query(
          `UPDATE user_session SET last_active_at = $2, idle_expires_at = $3
            WHERE id = $1 AND revoked_at IS NULL`,
          [p.sessionId, now, idle],
        );
      });
    }
    if (s.mustChangePassword && !ALLOWED_WITH_TEMP_PASSWORD.has(auth.operationId)) {
      throw problem('PASSWORD_CHANGE_REQUIRED');
    }
    return next.handle();
  }

  private async policy(key: string, load: () => Promise<SessionPolicy>): Promise<SessionPolicy> {
    const nowMs = this.clock.now().getTime();
    const hit = this.policyCache.get(key);
    if (hit && hit.until > nowMs) return hit.policy;
    const policy = await load();
    this.policyCache.set(key, { policy, until: nowMs + POLICY_CACHE_MS });
    return policy;
  }
}
