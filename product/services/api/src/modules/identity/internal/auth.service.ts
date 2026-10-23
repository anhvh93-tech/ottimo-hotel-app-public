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
import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type TenantContext, type Tx } from '../../../db/database';
import { sha256Hex } from '../../../shared/http/auth.guard';
import { ProblemError, problem } from '../../../shared/problem';
import { IDENTITY_OPTIONS, type IdentityOptions } from '../public/identity-options';
import { MFA_REQUIRED_ROLES, MfaStore } from '../public/mfa-store';
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

/** mfaToken lifetime and failures per token (SEC 06.17, 06.19). */
export const MFA_TOKEN_TTL_MS = 5 * 60_000;
export const MFA_TOKEN_MAX_FAILURES = 5;

export interface LoginMfaInput {
  mfaToken: string;
  totpCode?: string | undefined;
  recoveryCode?: string | undefined;
  ip: string | undefined;
  userAgent: string | undefined;
  origin: string | undefined;
  deviceToken: string | undefined;
  requestId: string;
}

interface ChallengeRow {
  user_id: string;
  client_origin: ClientOrigin;
  expires_at: Date;
  failed_count: number;
  used_at: Date | null;
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
    @Inject(MfaStore) private readonly mfa: MfaStore,
    @Inject(IDENTITY_OPTIONS) private readonly options: IdentityOptions,
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
      // SR-AUTH-06 (SEC 06.17): no session yet – a single-use 5-minute mfaToken bound to the user and the client.
      // The failure counter is NOT reset by a right password alone (a TOTP guesser would otherwise reset it by
      // signing in again); the full success of loginMfa resets it.
      const token = randomBytes(32).toString('base64url');
      await this.db.withContext(ctx, async (tx) => {
        await tx.query(`DELETE FROM mfa_login_challenge WHERE user_id = $1 AND expires_at <= $2`, [
          found.user_id,
          now,
        ]);
        await tx.query(
          `INSERT INTO mfa_login_challenge (token_hash, organization_id, user_id, client_origin, created_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            sha256Hex(token),
            found.organization_id,
            found.user_id,
            clientOrigin,
            now,
            new Date(now.getTime() + MFA_TOKEN_TTL_MS),
          ],
        );
      });
      throw problem('MFA_REQUIRED', { extras: { mfaToken: token } });
    }
    // SEC 06.4: MFA_ENFORCED and an owner/manager without 2FA → restricted session (enrolment only).
    const enrollmentOnly =
      this.options.mfaEnforced === true && (await this.requiresMfa(orgCtx, found.user_id));

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
        amr: 'pwd',
        enrollmentOnly,
      });
      await this.audit.record(tx, {
        category: 'access',
        action: 'auth.login_succeeded',
        entityType: 'app_user',
        entityId: found.user_id,
        requestId: input.requestId,
        sessionId: session.id,
        after: { clientOrigin, amr: 'pwd' },
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

  /** Live owner/manager role at any property (SEC 06.2). */
  async requiresMfa(ctx: TenantContext, userId: string): Promise<boolean> {
    return this.db.withContext(
      { ...ctx, propertyId: null },
      async (tx) => {
        const { rows } = await tx.query(
          `SELECT 1 FROM user_property_role
            WHERE user_id = $1 AND revoked_at IS NULL AND role = ANY($2::text[]) LIMIT 1`,
          [userId, [...MFA_REQUIRED_ROLES]],
        );
        return rows.length > 0;
      },
      { readOnly: true },
    );
  }

  /**
   * Login step 2 (loginMfa, SEC 06.17–06.22). Every failure is the same 401 MFA_INVALID; a wrong code counts on
   * the token (5 → dead) AND on the login lockout counter of SR-AUTH-04 (5 → temporary lock → 429 Retry-After,
   * K locks → hard lock; live sessions are not ended). Success: token used, counters reset, NEW session with
   * mfa_at/amr. One transaction under the user's organisation and the DEK property, challenge row and user row
   * locked (FOR UPDATE): two requests with the same token or the same code serialise – one wins.
   */
  async loginMfa(input: LoginMfaInput): Promise<{ me: Me; session: NewSession }> {
    const kind = this.sessions.originKind(input.origin);
    if (kind === 'unknown') throw problem('FORBIDDEN_ACTION', { detail: 'Origin' });
    this.limiter.consume(`login:ip:${input.ip ?? '-'}`, RATE_RULES.loginPerIp);
    const tokenHash = sha256Hex(input.mfaToken);
    const ref = await this.db.entry(async (tx) => {
      const r = await tx.query<{ user_id: string; organization_id: string }>(
        'SELECT * FROM auth_mfa_challenge_resolve($1)',
        [tokenHash],
      );
      return r.rows[0];
    });
    if (!ref) throw problem('MFA_INVALID');
    const orgCtx: TenantContext = {
      organizationId: ref.organization_id,
      propertyId: null,
      userId: ref.user_id,
      actorType: 'user',
    };
    const params = await this.identityParams.forUser(orgCtx);
    const activePropertyId = params.propertyIds[0] ?? null;
    const ctx = await this.mfa.keyContext({ ...orgCtx, propertyId: activePropertyId }, ref.user_id);
    const now = this.clock.now();

    const outcome = await this.db.withContext(ctx, async (tx) => {
      const { rows: ch } = await tx.query<ChallengeRow>(
        `SELECT user_id, client_origin, expires_at, failed_count, used_at FROM mfa_login_challenge
          WHERE token_hash = $1 FOR UPDATE`,
        [tokenHash],
      );
      const c = ch[0];
      const u = await this.mfa.lockUser(tx, ref.user_id);
      const counters = async () =>
        (
          await tx.query<CounterRow>(
            'SELECT failed_login_count, lock_count_24h, locked_until, status FROM app_user WHERE id = $1',
            [ref.user_id],
          )
        ).rows[0];
      const before = await counters();
      if (
        !c ||
        !u ||
        !before ||
        c.used_at !== null ||
        c.expires_at <= now ||
        c.failed_count >= MFA_TOKEN_MAX_FAILURES ||
        (kind !== null && kind !== c.client_origin) ||
        !u.mfa_enabled ||
        isHardLocked(before)
      ) {
        return { kind: 'invalid' as const };
      }
      if (before.locked_until && before.locked_until > now) {
        return { kind: 'locked' as const, until: before.locked_until };
      }
      const factor = await this.mfa.consumeSecondFactor(tx, u, input);
      if (!factor) {
        const failed = c.failed_count + 1;
        await tx.query(
          `UPDATE mfa_login_challenge SET failed_count = $2::smallint,
               used_at = CASE WHEN $2::int >= $3::int THEN $4::timestamptz ELSE used_at END
            WHERE token_hash = $1`,
          [tokenHash, failed, MFA_TOKEN_MAX_FAILURES, now],
        );
        const found: FoundUser = {
          user_id: u.id,
          organization_id: u.organization_id,
          password_hash: '',
          status: before.status,
          locked_until: before.locked_until,
          failed_login_count: before.failed_login_count,
          must_change_password: false,
          mfa_enabled: true,
        };
        await this.registerFailure(
          tx,
          found,
          { ...input, username: u.username, password: '' },
          params.lockout,
        );
        // One mfa.verify_failed per user and minute (SEC 06.34 "gộp theo phút"); never the code.
        const { rows: recent } = await tx.query(
          `SELECT 1 FROM audit_event WHERE entity_id = $1 AND action = 'mfa.verify_failed'
              AND occurred_at >= date_trunc('minute', $2::timestamptz) LIMIT 1`,
          [u.id, now],
        );
        if (recent.length === 0) {
          await this.mfa.record(tx, 'mfa.verify_failed', u.id, { requestId: input.requestId });
        }
        const after = await counters();
        const lockedNow =
          !!after &&
          (isHardLocked(after) || (after.locked_until !== null && after.locked_until > now));
        if (lockedNow) {
          // SEC 06.19: a lock reached through TOTP → security audit + alert to the user and the owners.
          await this.mfa.record(tx, 'mfa.locked', u.id, { requestId: input.requestId });
          await this.mfa.notify(tx, u.id, 'mfa.locked', { owners: true, kind: 'security_alert' });
        }
        return { kind: 'invalid' as const };
      }
      await tx.query(`UPDATE mfa_login_challenge SET used_at = $2 WHERE token_hash = $1`, [
        tokenHash,
        now,
      ]);
      await tx.query(
        `UPDATE app_user SET failed_login_count = 0, locked_until = NULL, status = 'active', last_login_at = $2
          WHERE id = $1`,
        [u.id, now],
      );
      const session = await this.sessions.create(tx, {
        userId: u.id,
        organizationId: u.organization_id,
        activePropertyId,
        clientOrigin: c.client_origin,
        ip: input.ip,
        userAgent: input.userAgent,
        policy: params.session,
        amr: factor.method,
      });
      await this.audit.record(tx, {
        category: 'access',
        action: 'auth.login_succeeded',
        entityType: 'app_user',
        entityId: u.id,
        requestId: input.requestId,
        sessionId: session.id,
        after: { clientOrigin: c.client_origin, amr: factor.method },
        ...this.ip(input.ip),
      });
      if (factor.method === 'recovery_code') {
        await this.mfa.recoveryCodeUsed(tx, u.id, factor.recoveryCodesRemaining ?? 0, {
          requestId: input.requestId,
          sessionId: session.id,
          channel: 'login',
        });
      }
      return { kind: 'ok' as const, session };
    });
    if (outcome.kind === 'locked') throw retryAfter(outcome.until, now);
    if (outcome.kind !== 'ok') throw problem('MFA_INVALID');
    const me = await this.db.withContext(
      { ...orgCtx, propertyId: activePropertyId },
      (tx) =>
        this.me.build(tx, {
          userId: ref.user_id,
          sessionId: outcome.session.id,
          activePropertyId,
          deviceToken: input.deviceToken,
        }),
      { readOnly: true },
    );
    return { me, session: outcome.session };
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
