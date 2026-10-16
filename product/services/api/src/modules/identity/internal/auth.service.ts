/**
 * US-001: login, logout, change own password (SR-AUTH-02…05, SR-SES-01…06, SR-RL-01).
 * - Generic 401 for unknown user / wrong password / disabled / hard-locked account (TC-NT-005); argon2 is
 *   always run, and the unknown-user branch runs the same number of database round trips as a wrong
 *   password, so timing does not reveal whether the username exists (SR-AUTH-04, FB-R2-SEC-BE-11).
 * - login_lockout parameter: N consecutive failures → temporary lock (locked_until only – status stays
 *   active), attempts during the lock → 429 RATE_LIMITED with Retry-After; the K-th lock within the
 *   window → hard lock (status locked, locked_until NULL) until an owner unlocks (updateUser status=active).
 * - A lock (temporary or hard) only blocks NEW sign-ins: live sessions keep working (SR-AUTH-04 v0.3,
 *   FB-R2-SEC-BE-05 – otherwise anyone knowing a username could sign a front-desk agent out mid-shift).
 *   To end the sessions of a person the owner disables the account (updateUser status=disabled).
 * - The failure counter is incremented atomically (UPDATE … SET n = n + 1 RETURNING, row lock held to
 *   COMMIT), so N wrong passwords sent in parallel count N (FB-R2-ARC-BE-03 / SEC-BE-04); a successful
 *   sign-in re-checks the lock under the same row lock.
 * - Per-IP limit (20/15 min) in memory (RateLimiter); reaching it writes audit_event security once per
 *   window (FB-R2-SEC-BE-14).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { ProblemError, problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { IdentityParamsService, type LockoutPolicy } from '../public/identity-params';
import { hashPassword, passwordPolicyErrors, verifyPassword } from '../public/passwords';
import { RATE_LIMITER, RATE_RULES, type RateLimiter } from '../public/rate-limiter';
import {
  type ClientOrigin,
  type NewSession,
  type SessionPolicy,
  SessionService,
} from '../public/session.service';
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

/** Counter state read back by the atomic increment (registerFailure). */
interface CounterRow {
  failed_login_count: number;
  lock_count_24h: number;
  locked_until: Date | null;
  status: 'active' | 'locked' | 'disabled';
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

/** Hard lock = status locked without an end (legacy rows may still carry a past locked_until). */
function isHardLocked(u: { status: string; locked_until: Date | null }): boolean {
  return u.status === 'disabled' || (u.status === 'locked' && !u.locked_until);
}

function retryAfter(until: Date, now: Date): ProblemError {
  const wait = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000));
  return problem('RATE_LIMITED', { headers: { 'Retry-After': String(wait) } });
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(MeService) private readonly me: MeService,
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiter,
    @Inject(IdentityParamsService) private readonly identityParams: IdentityParamsService,
  ) {}

  async login(input: LoginInput): Promise<{ me: Me; session: NewSession }> {
    await this.limitIp(input);

    // The AuthGuard already refused an Origin outside the configured lists; here it decides the client
    // type (admin-web vs staff PWA → session lifetime SR-SES-03, trusted devices SR-DEV-04). A staff
    // session is only opened from a staff origin: guest-web or a missing Origin → 403 once origins are
    // configured (SR-SES-09, FB-R2-SEC-BE-12). null = origins not configured (dev/test only).
    const kind = this.sessions.originKind(input.origin);
    if (kind === 'unknown') throw problem('FORBIDDEN_ACTION', { detail: 'Origin' });
    const clientOrigin: ClientOrigin = kind === 'staff_pwa' ? 'staff_pwa' : 'admin';

    const found = await this.db.entry(async (tx) => {
      const r = await tx.query<FoundUser>('SELECT * FROM auth_find_user($1)', [input.username]);
      return r.rows[0];
    });
    if (!found) {
      await verifyPassword(null, input.password); // same cost as a real check
      // Same shape as a wrong password of an existing user (one property): three more round trips
      // (roles, parameters, failure write) – FB-R2-SEC-BE-11.
      for (let i = 0; i < 3; i++) {
        await this.db.entry((tx) => tx.query('SELECT * FROM auth_find_user($1)', [input.username]));
      }
      throw problem('UNAUTHENTICATED');
    }
    const now = this.clock.now();
    if (found.locked_until && found.locked_until > now) throw retryAfter(found.locked_until, now);
    const passwordOk = await verifyPassword(found.password_hash, input.password);

    // Everything else runs under RLS in the user's organisation (first property with a live role).
    const orgCtx: TenantContext = {
      organizationId: found.organization_id,
      propertyId: null,
      userId: found.user_id,
      actorType: 'user',
    };
    // Roles + strictest session_policy / login_lockout across the user's properties (0.3.4).
    const params = await this.identityParams.forUser(orgCtx);
    const activePropertyId = params.propertyIds[0] ?? null;
    const ctx: TenantContext = { ...orgCtx, propertyId: activePropertyId };
    const hardLocked = isHardLocked(found);

    if (!passwordOk || hardLocked) {
      const locked = await this.db.withContext(ctx, async (tx) => {
        const lockedUntil = hardLocked
          ? null
          : await this.registerFailure(tx, found, input, params.lockout);
        await this.audit.record(tx, {
          category: 'security',
          action: hardLocked ? 'auth.login_refused' : 'auth.login_failed',
          entityType: 'app_user',
          entityId: found.user_id,
          requestId: input.requestId,
          ...this.ip(input.ip),
        });
        return lockedUntil;
      });
      // A parallel request locked the account first: same answer as an attempt during the lock.
      if (locked) throw retryAfter(locked, now);
      throw problem('UNAUTHENTICATED');
    }
    if (found.mfa_enabled) {
      // TODO(R3, SR-AUTH-06 / FB-R2-SEC-BE-19): 401 MFA_REQUIRED + short-lived single-use mfaToken that
      // shares the login lockout counter; the session is issued only after the second factor.
      throw problem('MFA_REQUIRED');
    }

    const outcome = await this.db.withContext(ctx, async (tx) => {
      // Re-check the lock under the row lock: a parallel wrong-password burst may have locked the account
      // after our first read (FB-R2-ARC-BE-03). Legacy temporary locks (status locked + locked_until) are
      // turned back to active here.
      const { rows } = await tx.query<CounterRow>(
        `UPDATE app_user SET failed_login_count = 0, locked_until = NULL, status = 'active', last_login_at = $2
          WHERE id = $1 AND (status = 'active' OR (status = 'locked' AND locked_until IS NOT NULL))
            AND (locked_until IS NULL OR locked_until <= $2)
          RETURNING failed_login_count`,
        [found.user_id, now],
      );
      if (rows.length === 0) {
        const cur = await tx.query<CounterRow>(
          'SELECT failed_login_count, lock_count_24h, locked_until, status FROM app_user WHERE id = $1',
          [found.user_id],
        );
        const u = cur.rows[0];
        return { refused: u?.locked_until && u.locked_until > now ? u.locked_until : null };
      }
      const session = await this.sessions.create(tx, {
        userId: found.user_id,
        organizationId: found.organization_id,
        activePropertyId,
        clientOrigin,
        ip: input.ip,
        userAgent: input.userAgent,
        policy: params.session,
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
    if ('refused' in outcome) {
      if (outcome.refused) throw retryAfter(outcome.refused, now);
      throw problem('UNAUTHENTICATED');
    }
    return outcome;
  }

  /**
   * SR-RL-01 per-IP limit. The first refusal of a window is written to the security log (SR-RL 13,
   * FB-R2-SEC-BE-14): audit_event needs an organisation, so it goes to the organisation of the username
   * that was tried (none → application log only). Never the password, never the raw IP (ip_hmac).
   */
  private async limitIp(input: LoginInput): Promise<void> {
    const ipKey = `login:ip:${input.ip ?? '-'}`;
    try {
      this.limiter.consume(ipKey, RATE_RULES.loginPerIp);
    } catch (err) {
      if (this.limiter.firstRefusal(ipKey)) await this.recordIpLimit(input);
      throw err;
    }
  }

  private async recordIpLimit(input: LoginInput): Promise<void> {
    const found = await this.db.entry(async (tx) => {
      const r = await tx.query<FoundUser>('SELECT * FROM auth_find_user($1)', [input.username]);
      return r.rows[0];
    });
    if (!found) {
      this.logger.warn(`auth.ip_rate_limited requestId=${input.requestId}`);
      return;
    }
    const ctx: TenantContext = {
      organizationId: found.organization_id,
      propertyId: null,
      userId: found.user_id,
      actorType: 'user',
    };
    await this.db.withContext(ctx, (tx) =>
      this.audit.record(tx, {
        category: 'security',
        action: 'auth.ip_rate_limited',
        entityType: 'app_user',
        entityId: found.user_id,
        requestId: input.requestId,
        ...this.ip(input.ip),
      }),
    );
  }

  /**
   * Count one wrong password atomically and lock when the policy says so. Returns the lock end only when
   * a PARALLEL request had already locked the account (this attempt then answers 429 like any attempt
   * during the lock); the attempt that reaches the threshold itself still answers 401 (SR-AUTH-04: the
   * 6th attempt gets 429).
   */
  private async registerFailure(
    tx: Tx,
    u: FoundUser,
    input: LoginInput,
    policy: LockoutPolicy,
  ): Promise<Date | null> {
    const now = this.clock.now();
    // Atomic increment: the row lock is held until COMMIT, so parallel failures serialise here.
    const { rows } = await tx.query<CounterRow>(
      `UPDATE app_user SET failed_login_count = failed_login_count + 1 WHERE id = $1
        RETURNING failed_login_count, lock_count_24h, locked_until, status`,
      [u.user_id],
    );
    const c = rows[0];
    if (!c) return null;
    if (c.locked_until && c.locked_until > now) {
      // Locked meanwhile by a parallel request: this attempt happened "during the lock" → 429.
      await tx.query(`UPDATE app_user SET failed_login_count = 0 WHERE id = $1`, [u.user_id]);
      return c.locked_until;
    }
    if (isHardLocked(c) || c.failed_login_count < policy.maxFailures) return null;

    // Lock. Previous lock still inside the window (its locked_until − lock length ≥ now − window)?
    const windowStart = now.getTime() - policy.lockWindowHours * 3_600_000;
    const prevLockAt = c.locked_until
      ? c.locked_until.getTime() - policy.lockMinutes * 60_000
      : null;
    const lockCount = prevLockAt !== null && prevLockAt >= windowStart ? c.lock_count_24h + 1 : 1;
    const hard = lockCount >= policy.hardLockAfterLocks;
    const until = hard ? null : new Date(now.getTime() + policy.lockMinutes * 60_000);
    // Temporary lock: locked_until only (status stays active). Hard lock: status locked, no end.
    // Neither revokes live sessions (FB-R2-SEC-BE-05).
    await tx.query(
      `UPDATE app_user SET failed_login_count = 0, locked_until = $2, lock_count_24h = $3,
           status = CASE WHEN $4 THEN 'locked' ELSE status END
        WHERE id = $1`,
      [u.user_id, until, lockCount, hard],
    );
    await this.audit.record(tx, {
      category: 'security',
      action: hard ? 'auth.account_hard_locked' : 'auth.account_locked',
      entityType: 'app_user',
      entityId: u.user_id,
      requestId: input.requestId,
      after: { lockCount, until: until ? until.toISOString() : null },
    });
    return null;
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
      /** Strictest session_policy of the user, read BEFORE the unit of work (IdentityParamsService). */
      sessionPolicy: SessionPolicy;
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
      policy: input.sessionPolicy,
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
