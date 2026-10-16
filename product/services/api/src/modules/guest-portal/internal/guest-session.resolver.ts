/**
 * Guest-session resolver for the AuthGuard (ADR-006, SR-GST-02/04/05; SEC G4): cookie `__Host-ottimo_gsid`
 * → SHA-256 → guest_resolve_session() (SECURITY DEFINER, before any tenant context) → principal of ONE
 * booking (x-scope `reservation`). Revoked or expired session/token → 401 GUEST_LINK_INVALID; an
 * operation above the session level → 403 GUEST_VERIFICATION_REQUIRED (R2: every session is level 1).
 */
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database } from '../../../db/database';
import { AUTH_OPTIONS, type AuthOptions, sha256Hex } from '../../../shared/http/auth.guard';
import { readCookie } from '../../../shared/http/cookies';
import type { GuestPrincipal, GuestSessionResolver } from '../../../shared/http/guest-session';
import type { OperationMeta } from '../../../shared/openapi-types';
import { problem } from '../../../shared/problem';

export function guestCookieName(securePrefix: boolean): string {
  return `${securePrefix ? '__Host-' : ''}ottimo_gsid`;
}

interface Row {
  session_id: string;
  token_id: string;
  reservation_id: string;
  property_id: string;
  organization_id: string;
  level: number;
  locale: 'vi' | 'en' | 'ru';
  expires_at: Date;
  revoked_at: Date | null;
  token_expires_at: Date;
  token_revoked_at: Date | null;
}

@Injectable()
export class GuestSessionResolverService implements GuestSessionResolver {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTH_OPTIONS) private readonly options: AuthOptions,
  ) {}

  cookieName(): string {
    return guestCookieName(this.options.cookieSecurePrefix);
  }

  async resolve(
    req: { headers: Record<string, string | string[] | undefined> },
    operation: OperationMeta,
  ): Promise<GuestPrincipal> {
    const raw = req.headers.cookie;
    const token = readCookie(Array.isArray(raw) ? raw[0] : raw, this.cookieName());
    if (!token || token.length < 32 || token.length > 128) throw problem('UNAUTHENTICATED');
    const rows = await this.db.entry(async (tx) => {
      const r = await tx.query<Row>('SELECT * FROM guest_resolve_session($1)', [sha256Hex(token)]);
      return r.rows;
    });
    const s = rows[0];
    const now = this.clock.now().getTime();
    if (
      !s ||
      s.revoked_at ||
      s.token_revoked_at ||
      s.expires_at.getTime() <= now ||
      s.token_expires_at.getTime() <= now
    ) {
      throw problem('GUEST_LINK_INVALID');
    }
    if ((operation.guestLevel ?? 1) > s.level) throw problem('GUEST_VERIFICATION_REQUIRED');
    return {
      kind: 'guest',
      sessionId: s.session_id,
      tokenId: s.token_id,
      reservationId: s.reservation_id,
      organizationId: s.organization_id,
      propertyId: s.property_id,
      level: s.level,
      locale: s.locale,
    };
  }
}
