/**
 * Guest-session principal (ADR-006) – the AuthGuard delegates operations whose x-roles contain `guest`
 * to the resolver the guest-portal module registers under GUEST_SESSION_RESOLVER (same pattern as
 * CSRF_VERIFIER). Without a resolver, guest operations answer 401 (fail closed).
 */
import type { OperationMeta } from '../openapi-types';

export const GUEST_SESSION_RESOLVER = Symbol('GUEST_SESSION_RESOLVER');

export interface GuestPrincipal {
  kind: 'guest';
  /** guest_session.id (uuid) – also the idempotency principal (`guest_session`). */
  sessionId: string;
  tokenId: string;
  reservationId: string;
  organizationId: string;
  propertyId: string;
  /** R2: always 1 (SEC ĐK-1). */
  level: number;
  locale: 'vi' | 'en' | 'ru';
}

export interface GuestSessionResolver {
  /**
   * Cookie → session → principal. Throws 401 UNAUTHENTICATED (no cookie), 401 GUEST_LINK_INVALID
   * (revoked/expired), 403 GUEST_VERIFICATION_REQUIRED (x-guest-level above the session level).
   */
  resolve(
    req: { headers: Record<string, string | string[] | undefined> },
    operation: OperationMeta,
  ): Promise<GuestPrincipal>;
}
