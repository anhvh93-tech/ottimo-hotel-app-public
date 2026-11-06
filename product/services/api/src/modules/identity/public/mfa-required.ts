/**
 * The ONE "must use 2FA" predicate (SEC 06.2, V5-40; SEC FB-R5-SEC-BE-D1-03, ARC FB-R5-ARC-BE-D1-02): a live
 * (not revoked) role of MFA_REQUIRED_ROLES at ANY property of the organisation – no filter on the property of the
 * session, none on the property's status. The AuthGuard, login (`AuthService.requiresMfa`) and `getMe`
 * (`mfaRequiredButMissing`, `mfaEnrollmentRequired`) call it; getMy2fa / disableMy2fa apply `isMfaRequiredRole` to
 * the same live roles. Never narrow it per property: an FDL at property B would then work without 2FA while the
 * session is at property A (SEC D1-02).
 * `user_property_role` is organisation-level under RLS: any context of the user's organisation reads every property.
 */
import type { Tx } from '../../../db/database';
import { MFA_REQUIRED_ROLES } from './mfa-roles';

export async function holdsMfaRequiredRole(tx: Tx, userId: string): Promise<boolean> {
  const { rows } = await tx.query(
    `SELECT 1 FROM user_property_role
      WHERE user_id = $1 AND revoked_at IS NULL AND role = ANY($2::text[]) LIMIT 1`,
    [userId, [...MFA_REQUIRED_ROLES]],
  );
  return rows.length > 0;
}
