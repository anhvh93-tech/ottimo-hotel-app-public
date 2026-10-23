/**
 * Staff sessions (erd 4.2 user_session, SR-SES-01…06).
 * - Token: 256-bit random, cookie only; DB keeps SHA-256 (user_session.id).
 * - Lifetime by client (parameter session_policy – strictest across the user's properties,
 *   IdentityParamsService; SR-SES-03): idle_expires_at slides on activity, expires_at is the hard maximum.
 *   Checked on every request by the AuthGuard; slid by SessionPolicyInterceptor.
 * - CSRF token = HMAC-SHA256(SESSION_SECRET, session id) – synchroniser token bound to the session,
 *   returned in Me.csrfToken, sent back in X-CSRF-Token (SR-SES-04). No extra column needed.
 * - revokeAll(): role change, disable, password reset/change (SR-SES-06) – same transaction as the change.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { sha256Hex } from '../../../shared/http/auth.guard';
import { cookieNames } from '../../../shared/http/cookies';
import { IDENTITY_OPTIONS, type IdentityOptions } from './identity-options';

export type ClientOrigin = 'admin' | 'staff_pwa';

export type RevokeReason =
  | 'logout'
  | 'role_changed'
  | 'disabled'
  | 'password_reset'
  | 'password_changed'
  | 'mfa_disabled'
  | 'mfa_enrolled'
  | 'mfa_reset'
  | 'admin';

/** How the session was authenticated (user_session.amr, SEC 06.21). */
export type SessionAmr = 'pwd' | 'totp' | 'recovery_code';

export interface SessionPolicy {
  admin: { idleMinutes: number; maxHours: number };
  staff_pwa: { idleMinutes: number; maxHours: number };
}

export interface NewSession {
  token: string;
  id: string;
  expiresAt: Date;
  idleExpiresAt: Date;
  clientOrigin: ClientOrigin;
}

const MINUTE = 60_000;

@Injectable()
export class SessionService {
  private readonly csrfKey: Buffer;
  readonly names: { session: string; device: string };

  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDENTITY_OPTIONS) private readonly options: IdentityOptions,
  ) {
    // dev/test without SESSION_SECRET: random per process (tokens die on restart – acceptable there).
    this.csrfKey = options.sessionSecret
      ? Buffer.from(options.sessionSecret, 'utf8')
      : randomBytes(32);
    this.names = cookieNames(options.cookieSecurePrefix);
  }

  async create(
    tx: Tx,
    input: {
      userId: string;
      organizationId: string;
      activePropertyId: string | null;
      clientOrigin: ClientOrigin;
      ip?: string | undefined;
      userAgent?: string | undefined;
      policy: SessionPolicy;
      /** 0.3.8 (US-143): second factor passed now (amr totp/recovery_code); default password only. */
      amr?: SessionAmr;
      /** 0.3.8 (SEC 06.4): restricted session – only the 2FA enrolment operations. */
      enrollmentOnly?: boolean;
    },
  ): Promise<NewSession> {
    const now = this.clock.now();
    const p = input.policy[input.clientOrigin];
    const expiresAt = new Date(now.getTime() + p.maxHours * 60 * MINUTE);
    const idleExpiresAt = new Date(
      Math.min(now.getTime() + p.idleMinutes * MINUTE, expiresAt.getTime()),
    );
    const token = randomBytes(32).toString('base64url');
    const id = sha256Hex(token);
    await tx.query(
      `INSERT INTO user_session (id, organization_id, user_id, active_property_id, client_origin, created_at,
         last_active_at, idle_expires_at, expires_at, ip_hmac, user_agent, mfa_at, amr, enrollment_only)
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        input.organizationId,
        input.userId,
        input.activePropertyId,
        input.clientOrigin,
        now,
        idleExpiresAt,
        expiresAt,
        this.ipHmac(input.ip),
        input.userAgent ? input.userAgent.slice(0, 200) : null,
        input.amr === 'totp' || input.amr === 'recovery_code' ? now : null,
        input.amr ?? 'pwd',
        input.enrollmentOnly === true,
      ],
    );
    return { token, id, expiresAt, idleExpiresAt, clientOrigin: input.clientOrigin };
  }

  /** Revoke every live session of the user (optionally except one), same transaction as the change. */
  async revokeAll(
    tx: Tx,
    userId: string,
    reason: RevokeReason,
    exceptSessionId?: string,
  ): Promise<number> {
    const r = await tx.query(
      `UPDATE user_session SET revoked_at = $2, revoked_reason = $3
        WHERE user_id = $1 AND revoked_at IS NULL AND ($4::text IS NULL OR id <> $4)`,
      [userId, this.clock.now(), reason, exceptSessionId ?? null],
    );
    return r.rowCount ?? 0;
  }

  async revoke(tx: Tx, sessionId: string, reason: RevokeReason): Promise<void> {
    await tx.query(
      `UPDATE user_session SET revoked_at = $2, revoked_reason = $3 WHERE id = $1 AND revoked_at IS NULL`,
      [sessionId, this.clock.now(), reason],
    );
  }

  csrfToken(sessionId: string): string {
    return createHmac('sha256', this.csrfKey).update(`csrf:${sessionId}`).digest('base64url');
  }

  verifyCsrf(sessionId: string, token: string | undefined): boolean {
    if (!token) return false;
    const expected = Buffer.from(this.csrfToken(sessionId));
    const given = Buffer.from(token);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  /** Classify the request Origin; null when Origin checking is not configured (dev/test only). */
  originKind(origin: string | undefined): ClientOrigin | 'unknown' | null {
    const { adminOrigins, pwaOrigins } = this.options;
    if (adminOrigins.length === 0 && pwaOrigins.length === 0) return null;
    if (!origin) return 'unknown';
    if (adminOrigins.includes(origin)) return 'admin';
    if (pwaOrigins.includes(origin)) return 'staff_pwa';
    return 'unknown';
  }

  ipHmac(ip: string | undefined): string | null {
    if (!ip || !this.options.ipHmacKey) return null;
    return createHmac('sha256', this.options.ipHmacKey).update(ip).digest('hex');
  }

  private secure(): string {
    // __Host- needs Secure; dev over plain HTTP (prefix off) drops Secure (WebKit ignores it on http).
    return this.options.cookieSecurePrefix ? '; Secure' : '';
  }

  sessionCookie(s: NewSession): string {
    const persist =
      s.clientOrigin === 'staff_pwa'
        ? `; Max-Age=${Math.floor((s.expiresAt.getTime() - this.clock.now().getTime()) / 1000)}`
        : '';
    return `${this.names.session}=${s.token}; HttpOnly${this.secure()}; SameSite=Lax; Path=/${persist}`;
  }

  clearSessionCookie(): string {
    return `${this.names.session}=; HttpOnly${this.secure()}; SameSite=Lax; Path=/; Max-Age=0`;
  }

  deviceCookie(token: string, expiresAt: Date): string {
    return `${this.names.device}=${token}; HttpOnly${this.secure()}; SameSite=Strict; Path=/; Expires=${expiresAt.toUTCString()}`;
  }
}
