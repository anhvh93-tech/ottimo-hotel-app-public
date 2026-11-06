/**
 * Roles that make 2FA mandatory (SEC 06.2): a live role of this list at ANY property → `getMy2fa.required`, no
 * `disableMy2fa`, and with MFA_ENFORCED a restricted session (enrolment only, SEC 06.4) until 2FA is on.
 *
 * v1.0.5 V5-40 (release notes v1.0.4 "Ai bật 2 bước", DOM B.1, FB-R4-PO-BA-032-07): `front_desk_lead` joins
 * owner/manager – the desk now enforces what the team default already said. Migration 0079's
 * `auth_resolve_session().mfa_required` still lists owner/manager only (no migration in v1.0.5), so the AuthGuard
 * adds the rest of this list itself (`AuthGuard.mfaRequired`).
 *
 * No imports on purpose: the AuthGuard (shared/http) reads it without loading the identity services.
 */
export const MFA_REQUIRED_ROLES = ['owner', 'manager', 'front_desk_lead'] as const;

/** True when one of `roles` makes 2FA mandatory. */
export function isMfaRequiredRole(roles: Iterable<string>): boolean {
  for (const r of roles) {
    if ((MFA_REQUIRED_ROLES as readonly string[]).includes(r)) return true;
  }
  return false;
}
