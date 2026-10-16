/**
 * Per-request session policy for authenticated staff requests (runs after the global AuthGuard, before
 * the handler – so nothing of the business runs when it refuses):
 * 1. Session still valid: not revoked, before expires_at AND idle_expires_at, user status active
 *    (SR-SES-03, SR-SES-06, erd 2.4 0.3.2) → else 401 UNAUTHENTICATED. Slides idle_expires_at.
 * 2. Temporary password (must_change_password) → 403 PASSWORD_CHANGE_REQUIRED except changeMyPassword,
 *    getMe, logout (SR-AUTH-05, OpenAPI login).
 * CSRF/Origin (SR-SES-04) are checked by the AuthGuard with SessionService as CSRF_VERIFIER.
 *
 * TODO(BE-A): moving steps 1–2 into AuthGuard.authenticate() (it already receives idle_expires_at and
 * user_status from auth_resolve_session 0.3.2) would make the 401 precede role/CSRF 403s exactly.
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
import { DATABASE, Database } from '../../../db/database';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import { problem } from '../../../shared/problem';
import { localDate } from '../../../shared/time';
import { type SessionPolicy, SessionService } from '../public/session.service';

const ALLOWED_WITH_TEMP_PASSWORD = new Set(['changeMyPassword', 'getMe', 'logout']);
/** Write last_active_at at most once a minute per session (idle precision ±1 min). */
const TOUCH_EVERY_MS = 60_000;
const POLICY_CACHE_MS = 60_000;

interface SessionStateRow {
  client_origin: 'admin' | 'staff_pwa';
  expires_at: Date;
  idle_expires_at: Date;
  revoked_at: Date | null;
  last_active_at: Date;
  status: string;
  must_change_password: boolean;
}

@Injectable()
export class SessionPolicyInterceptor implements NestInterceptor {
  private readonly policyCache = new Map<string, { policy: SessionPolicy; until: number }>();

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SessionService) private readonly sessions: SessionService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<GuardedRequest>();
    const auth = req.ottimoAuth;
    const p = auth?.principal;
    if (!auth || !p) return next.handle();

    const now = this.clock.now();
    const ctx = {
      organizationId: p.organizationId,
      propertyId: p.propertyId,
      userId: p.userId,
      actorType: 'user' as const,
    };
    const state = await this.db.withContext(ctx, async (tx) => {
      const { rows } = await tx.query<SessionStateRow>(
        `SELECT s.client_origin, s.expires_at, s.idle_expires_at, s.revoked_at, s.last_active_at,
                u.status, u.must_change_password
           FROM user_session s JOIN app_user u ON u.id = s.user_id
          WHERE s.id = $1`,
        [p.sessionId],
      );
      const s = rows[0];
      if (
        !s ||
        s.revoked_at ||
        s.status !== 'active' ||
        s.expires_at.getTime() <= now.getTime() ||
        s.idle_expires_at.getTime() <= now.getTime()
      ) {
        return null;
      }
      if (now.getTime() - s.last_active_at.getTime() >= TOUCH_EVERY_MS) {
        const policy = await this.policy(ctx.propertyId ?? ctx.organizationId, () =>
          this.sessions.policy(tx, localDate(now, 'UTC')),
        );
        const idle = new Date(
          Math.min(
            now.getTime() + policy[s.client_origin].idleMinutes * 60_000,
            s.expires_at.getTime(),
          ),
        );
        await tx.query(
          `UPDATE user_session SET last_active_at = $2, idle_expires_at = $3 WHERE id = $1`,
          [p.sessionId, now, idle],
        );
      }
      return s;
    });
    if (!state) throw problem('UNAUTHENTICATED');
    if (state.must_change_password && !ALLOWED_WITH_TEMP_PASSWORD.has(auth.operationId)) {
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
