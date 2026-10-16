/**
 * US-001: login, logout, change own password (SR-AUTH-02…05, SR-SES-01…06, SR-RL-01).
 * - Generic 401 for unknown user / wrong password / disabled / hard-locked account (TC-NT-005); argon2 is
 *   always run so timing does not reveal whether the username exists.
 * - login_lockout parameter: N consecutive failures → temporary lock (status locked + locked_until),
 *   attempts during the lock → 429 RATE_LIMITED with Retry-After; the K-th lock within the window →
 *   locked until an owner unlocks (updateUser status=active).
 * - Per-IP limit (20/15 min) in memory (RateLimiter).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { localDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { hashPassword, passwordPolicyErrors, verifyPassword } from '../public/passwords';
import { RATE_LIMITER, RATE_RULES, type RateLimiter } from '../public/rate-limiter';
import { type ClientOrigin, type NewSession, SessionService } from '../public/session.service';
import { type Me, MeService } from './me.service';

interface FoundUser {
  user_id: string;
  organization_id: string;
  password_hash: string;
  status: 'active' | 'locked' | 'disabled';
  locked_until: Date | null;
  failed_login_count: number;
  must_change_password: boolean;
  mfa_enabled: boolean;
}

interface LockoutPolicy {
  maxFailures: number;
  lockMinutes: number;
  hardLockAfterLocks: number;
  lockWindowHours: number;
}

export interface LoginInput {
  username: string;
  password: string;
  ip: string | undefined;
  userAgent: string | undefined;
  origin: string | undefined;
  deviceToken: string | undefined;
  requestId: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(MeService) private readonly me: MeService,
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiter,
  ) {}

  async login(input: LoginInput): Promise<{ me: Me; session: NewSession }> {
    const ipKey = `login:ip:${input.ip ?? '-'}`;
    this.limiter.consume(ipKey, RATE_RULES.loginPerIp);

    // The AuthGuard already refused an Origin outside the configured list; here it only decides the
    // client type (admin-web vs staff PWA → session lifetime, SR-SES-03; trusted devices SR-DEV-04).
    const kind = this.sessions.originKind(input.origin);
    const clientOrigin: ClientOrigin = kind === 'staff_pwa' ? 'staff_pwa' : 'admin';

    const found = await this.db.entry(async (tx) => {
      const r = await tx.query<FoundUser>('SELECT * FROM auth_find_user($1)', [input.username]);
      return r.rows[0];
    });
    if (!found) {
      await verifyPassword(null, input.password); // same cost as a real check
      throw problem('UNAUTHENTICATED');
    }
    const now = this.clock.now();
    if (found.status === 'locked' && found.locked_until && found.locked_until > now) {
      const wait = Math.ceil((found.locked_until.getTime() - now.getTime()) / 1000);
      throw problem('RATE_LIMITED', { headers: { 'Retry-After': String(wait) } });
    }
    const passwordOk = await verifyPassword(found.password_hash, input.password);

    // Everything else runs under RLS in the user's organisation (first property with a live role).
    const orgCtx: TenantContext = {
      organizationId: found.organization_id,
      propertyId: null,
      userId: found.user_id,
      actorType: 'user',
    };
    const activePropertyId = await this.db.withContext(orgCtx, async (tx) => {
      const props = await this.me.properties(tx, found.user_id);
      return [...props.keys()][0] ?? null;
    });
    const ctx: TenantContext = { ...orgCtx, propertyId: activePropertyId };
    const hardLocked =
      found.status === 'disabled' || (found.status === 'locked' && !found.locked_until);

    if (!passwordOk || hardLocked) {
      await this.db.withContext(ctx, async (tx) => {
        if (!hardLocked) await this.registerFailure(tx, found, input.requestId);
        await this.audit.record(tx, {
          category: 'security',
          action: hardLocked ? 'auth.login_refused' : 'auth.login_failed',
          entityType: 'app_user',
          entityId: found.user_id,
          requestId: input.requestId,
          ...this.ip(input.ip),
        });
      });
      throw problem('UNAUTHENTICATED');
    }
    if (found.mfa_enabled) {
      // TODO(R3, SR-AUTH-06): 401 MFA_REQUIRED + short-lived mfaToken → POST /v1/auth/login/mfa.
      throw problem('MFA_REQUIRED');
    }

    return this.db.withContext(ctx, async (tx) => {
      await tx.query(
        `UPDATE app_user SET failed_login_count = 0, locked_until = NULL,
             status = CASE WHEN status = 'locked' THEN 'active' ELSE status END, last_login_at = $2
          WHERE id = $1`,
        [found.user_id, now],
      );
      const policy = await this.sessions.policy(tx, localDate(now, 'UTC'));
      const session = await this.sessions.create(tx, {
        userId: found.user_id,
        organizationId: found.organization_id,
        activePropertyId,
        clientOrigin,
        ip: input.ip,
        userAgent: input.userAgent,
        policy,
      });
      await this.audit.record(tx, {
        category: 'access',
        action: 'auth.login_succeeded',
        entityType: 'app_user',
        entityId: found.user_id,
        requestId: input.requestId,
        sessionId: session.id,
        after: { clientOrigin },
        ...this.ip(input.ip),
      });
      const me = await this.me.build(tx, {
        userId: found.user_id,
        sessionId: session.id,
        activePropertyId,
        deviceToken: input.deviceToken,
      });
      return { me, session };
    });
  }

  private async registerFailure(tx: Tx, u: FoundUser, requestId: string): Promise<void> {
    const now = this.clock.now();
    const policy = await this.params.get<LockoutPolicy>(tx, 'login_lockout', localDate(now, 'UTC'));
    const failures = u.failed_login_count + 1;
    if (failures < policy.maxFailures) {
      await tx.query(`UPDATE app_user SET failed_login_count = $2 WHERE id = $1`, [
        u.user_id,
        failures,
      ]);
      return;
    }
    // Lock. Previous lock still inside the window (its locked_until − lock length ≥ now − window)?
    const windowStart = now.getTime() - policy.lockWindowHours * 3_600_000;
    const prevLockAt = u.locked_until
      ? u.locked_until.getTime() - policy.lockMinutes * 60_000
      : null;
    const { rows } = await tx.query<{ lock_count_24h: number }>(
      `SELECT lock_count_24h FROM app_user WHERE id = $1`,
      [u.user_id],
    );
    const lockCount =
      prevLockAt !== null && prevLockAt >= windowStart ? (rows[0]?.lock_count_24h ?? 0) + 1 : 1;
    const hard = lockCount >= policy.hardLockAfterLocks;
    const until = hard ? null : new Date(now.getTime() + policy.lockMinutes * 60_000);
    await tx.query(
      `UPDATE app_user SET failed_login_count = 0, status = 'locked', locked_until = $2,
           lock_count_24h = $3, roles_version = roles_version + 1
        WHERE id = $1`,
      [u.user_id, until, lockCount],
    );
    if (hard) await this.sessions.revokeAll(tx, u.user_id, 'admin');
    await this.audit.record(tx, {
      category: 'security',
      action: 'auth.account_locked',
      entityType: 'app_user',
      entityId: u.user_id,
      requestId,
      after: { lockCount, until: until ? until.toISOString() : null },
    });
  }

  async logout(tx: Tx, sessionId: string, requestId: string): Promise<void> {
    await this.sessions.revoke(tx, sessionId, 'logout');
    await this.audit.record(tx, {
      category: 'access',
      action: 'auth.logout',
      entityType: 'app_user',
      ...(tx.ctx.userId ? { entityId: tx.ctx.userId } : {}),
      requestId,
      sessionId,
    });
  }

  /**
   * Own password change (SR-AUTH-05). Revokes EVERY session of the user and issues a fresh one for this
   * client (SR-SES-02 new token after a password change; SR-SES-06) – the caller stays signed in with the
   * new cookie and must re-read Me (new csrfToken).
   */
  async changeMyPassword(
    tx: Tx,
    input: {
      userId: string;
      sessionId: string;
      currentPassword: string;
      newPassword: string;
      ip: string | undefined;
      userAgent: string | undefined;
      requestId: string;
    },
  ): Promise<NewSession> {
    const { rows } = await tx.query<{
      username: string;
      password_hash: string;
      client_origin: ClientOrigin;
      active_property_id: string | null;
    }>(
      `SELECT u.username, u.password_hash, s.client_origin, s.active_property_id
         FROM app_user u JOIN user_session s ON s.user_id = u.id AND s.id = $2
        WHERE u.id = $1`,
      [input.userId, input.sessionId],
    );
    const u = rows[0];
    if (!u) throw problem('UNAUTHENTICATED');
    // currentPassword was verified by PasswordReauth (shared counter) before this transaction.
    const errors = passwordPolicyErrors(
      'newPassword',
      input.newPassword,
      u.username,
      input.currentPassword,
    );
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const now = this.clock.now();
    await tx.query(
      `UPDATE app_user SET password_hash = $2, must_change_password = false, password_changed_at = $3,
           roles_version = roles_version + 1, updated_at = $3, version = version + 1
        WHERE id = $1`,
      [input.userId, await hashPassword(input.newPassword), now],
    );
    await this.sessions.revokeAll(tx, input.userId, 'password_changed');
    const session = await this.sessions.create(tx, {
      userId: input.userId,
      organizationId: tx.ctx.organizationId as string,
      activePropertyId: u.active_property_id,
      clientOrigin: u.client_origin,
      ip: input.ip,
      userAgent: input.userAgent,
      policy: await this.sessions.policy(tx, localDate(now, 'UTC')),
    });
    await this.audit.record(tx, {
      category: 'security',
      action: 'user.password_changed',
      entityType: 'app_user',
      entityId: input.userId,
      requestId: input.requestId,
      sessionId: session.id,
    });
    return session;
  }

  private ip(ip: string | undefined): { ipHmac?: string } {
    const h = this.sessions.ipHmac(ip);
    return h ? { ipHmac: h } : {};
  }
}
