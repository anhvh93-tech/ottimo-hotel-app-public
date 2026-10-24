/**
 * Staff directory of the property in context (OpenAPI 0.3.7 bổ sung 3 #11 – `listAssignableStaff`, US-062 AC2,
 * US-054): who may be given a housekeeping task or a work order. Written by BE-C for the housekeeping module,
 * reviewed by BE-B (owner of identity). Display names only (rbac D27 – like `WorkOrder.assigneeName`): no
 * username, phone, email or other role ever leaves here.
 *
 * "Đang hoạt động" = the account is not `disabled` and not locked by an administrator (`locked` without
 * `locked_until`, the rule of auth.service); a temporary log-in lock-out still counts – the person works today.
 * The role must be granted at the property and not revoked. Plain functions on the caller's transaction (RLS).
 */
import type { Tx } from '../../../db/database';

const ACTIVE = `NOT (u.status = 'disabled' OR (u.status = 'locked' AND u.locked_until IS NULL))`;

export interface StaffEntry {
  userId: string;
  displayName: string;
}

/** Active staff of the property holding `role`, sorted by display name (small list – no paging). */
export async function activeStaffWithRole(tx: Tx, role: string): Promise<StaffEntry[]> {
  const { rows } = await tx.query<{ id: string; display_name: string }>(
    `SELECT DISTINCT u.id, u.display_name
       FROM user_property_role r JOIN app_user u ON u.id = r.user_id
      WHERE r.property_id = $1 AND r.role = $2 AND r.revoked_at IS NULL AND ${ACTIVE}
      ORDER BY u.display_name, u.id`,
    [tx.ctx.propertyId, role],
  );
  return rows.map((r) => ({ userId: r.id, displayName: r.display_name }));
}

/** The user is active at the property with one of `roles` (server check of an assignment – 422 NOT_IN_LIST). */
export async function isActiveStaff(
  tx: Tx,
  userId: string,
  roles: readonly string[],
): Promise<boolean> {
  const { rows } = await tx.query(
    `SELECT 1 FROM user_property_role r JOIN app_user u ON u.id = r.user_id
      WHERE r.user_id = $1 AND r.property_id = $2 AND r.revoked_at IS NULL AND r.role = ANY($3::text[])
        AND ${ACTIVE}
      LIMIT 1`,
    [userId, tx.ctx.propertyId, [...roles]],
  );
  return rows.length > 0;
}

/** Display names of staff ids (rbac D27 – names only), for "người đang xử lý" labels (US-155 – BE-D). */
export async function displayNamesOf(
  tx: Tx,
  userIds: readonly string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { rows } = await tx.query<{ id: string; display_name: string }>(
    'SELECT id, display_name FROM app_user WHERE id = ANY($1::uuid[])',
    [[...new Set(userIds)]],
  );
  return new Map(rows.map((r) => [r.id, r.display_name]));
}
