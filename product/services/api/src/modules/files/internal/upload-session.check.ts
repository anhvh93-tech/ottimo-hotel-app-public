/**
 * Real-session check of the multipart upload routes BEFORE the body is read (s3-blocker-verification – new
 * vector of ARC FB-R2-ARC-BE-S3-03/18, SEC FB-R2-SEC-BE-47): a well-formed but fake cookie must not make the
 * api buffer up to 42 MB. Installed on the Fastify instance (src/http.ts MULTIPART_SESSION_CHECK) at module
 * init. Accepts a live staff session (auth_resolve_session: not revoked, not expired, not idle, account not
 * disabled) or a live guest session (guest_resolve_session: session and link not revoked/expired) – the same
 * SECURITY DEFINER lookups as the AuthGuard / guest resolver, which still run in full afterwards (roles,
 * device, CSRF, Origin, level). One indexed lookup per upload request; nothing is logged.
 */
import { Inject, Injectable, type OnModuleInit, Optional } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database } from '../../../db/database';
import { MULTIPART_SESSION_CHECK, type MultipartSessionCheck } from '../../../http';
import { AUTH_OPTIONS, type AuthOptions, sha256Hex } from '../../../shared/http/auth.guard';
import { cookieNames, readCookie } from '../../../shared/http/cookies';
import { guestCookieName } from '../../guest-portal/public/session-cookie';

type Headers = Record<string, string | string[] | undefined>;

@Injectable()
export class UploadSessionCheck implements OnModuleInit {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
    @Optional() @Inject(HttpAdapterHost) private readonly host?: HttpAdapterHost,
  ) {}

  onModuleInit(): void {
    const instance = this.host?.httpAdapter?.getInstance?.() as
      { [MULTIPART_SESSION_CHECK]?: MultipartSessionCheck } | undefined;
    if (instance) instance[MULTIPART_SESSION_CHECK] = (headers) => this.isLive(headers);
  }

  async isLive(headers: Headers): Promise<boolean> {
    const raw = headers.cookie;
    const cookie = Array.isArray(raw) ? raw.join('; ') : raw;
    const prefix = this.options.cookieSecurePrefix;
    const staff = readCookie(cookie, cookieNames(prefix).session);
    const guest = readCookie(cookie, guestCookieName(prefix));
    const now = this.clock.now().getTime();
    if (staff && staff.length >= 32 && staff.length <= 128) {
      const ok = await this.db.entry(async (tx) => {
        const { rows } = await tx.query<{
          revoked_at: Date | null;
          expires_at: Date;
          idle_expires_at: Date | null;
          user_status: string | null;
        }>(
          'SELECT revoked_at, expires_at, idle_expires_at, user_status FROM auth_resolve_session($1)',
          [sha256Hex(staff)],
        );
        const s = rows[0];
        return (
          !!s &&
          !s.revoked_at &&
          s.expires_at.getTime() > now &&
          (!s.idle_expires_at || s.idle_expires_at.getTime() > now) &&
          s.user_status !== 'disabled'
        );
      });
      if (ok) return true;
    }
    if (guest && guest.length >= 32 && guest.length <= 128) {
      return this.db.entry(async (tx) => {
        const { rows } = await tx.query<{
          revoked_at: Date | null;
          expires_at: Date;
          token_revoked_at: Date | null;
          token_expires_at: Date;
        }>(
          'SELECT revoked_at, expires_at, token_revoked_at, token_expires_at FROM guest_resolve_session($1)',
          [sha256Hex(guest)],
        );
        const s = rows[0];
        return (
          !!s &&
          !s.revoked_at &&
          !s.token_revoked_at &&
          s.expires_at.getTime() > now &&
          s.token_expires_at.getTime() > now
        );
      });
    }
    return false;
  }
}
