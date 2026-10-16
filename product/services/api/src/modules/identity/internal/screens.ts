/**
 * Screens per role (rbac-matrix.md section 3, every cell that is not ✖) – `Me.properties[].screens`
 * builds the menu (US-002 AC1). Server-side permission is still enforced per operation (x-roles); this list
 * only decides what the client shows. Keep in sync with rbac-matrix.md section 3.
 * Rule (OpenAPI 0.3.4 Me.screens, ARC Q8): a screen is listed when the role has ✔ or ◐ AND, in the current
 * round, at least one operation of that screen is allowed to the role (x-roles). A ◐ made only of "own"
 * actions in the user menu (own password, PIN, 2FA, own sessions) is NOT a screen – so R2 manager has no
 * S26 (users, trusted devices: owner only). Add it back when PO opens device delegation to MGR (rbac 20a).
 */
import type { StaffRole } from '../../../db/schema';

const range = (from: number, to: number): string[] =>
  Array.from({ length: to - from + 1 }, (_, i) => `S${String(from + i).padStart(2, '0')}`);

const S = (...n: number[]): string[] => n.map((x) => `S${String(x).padStart(2, '0')}`);

export const SCREENS_BY_ROLE: Record<StaffRole, readonly string[]> = {
  owner: range(1, 34),
  manager: range(1, 34).filter((s) => s !== 'S26'),
  front_desk_lead: [...range(1, 16), ...S(18, 19, 22, 23, 24, 25, 27, 29, 30, 32, 33, 34)],
  front_desk: [...range(1, 16), ...S(18, 23, 25, 27, 29, 30, 32, 34)],
  housekeeping: S(1, 3, 10, 11, 13, 23, 30),
  maintenance: S(1, 3, 10, 11, 12, 23, 30),
  sales_staff: S(1, 3, 4, 14, 15, 16, 17, 23, 25, 29),
  collaborator: S(1, 3, 4, 14, 15, 16, 17, 23, 25, 29),
};

/** Union of the screens of all roles (rbac 1.2: permission = union of roles), sorted. */
export function screensFor(roles: readonly string[]): string[] {
  const set = new Set<string>();
  for (const r of roles) for (const s of SCREENS_BY_ROLE[r as StaffRole] ?? []) set.add(s);
  return [...set].sort();
}
