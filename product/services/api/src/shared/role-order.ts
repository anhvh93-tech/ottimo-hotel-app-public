/**
 * One fixed order of the staff roles, desk roles first – how the "primary role" of a person holding several roles is
 * taken wherever it is stored (SEC-on-be-prs-135-139 section 6 option (a), FB-R5-ARC-BE-139-02):
 * - `payment.recorded_by_role` (A-40, `payments/public/payment.service.ts` `primaryRole`);
 * - `attachment.uploaded_by_role` (`files/public/attachment.service.ts`), among the roles that may upload the purpose.
 * Never the array order of `roles`: the auth guard loads them sorted by name (`ORDER BY role`), so a person
 * `collaborator` + `front_desk` would read as a CTV and `front_desk` + `sales_staff` as the desk.
 * (The audit actor role, `audit/public/actor-role.ts`, keeps its own order for maintenance / housekeeping; the desk,
 * sale and CTV roles come in the same order there.)
 */
export const STAFF_ROLE_ORDER = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
  'housekeeping',
  'maintenance',
] as const;

/** The first role of STAFF_ROLE_ORDER the person holds (and, when given, that is in `allowed`); null if none. */
export function primaryRoleOf(
  roles: readonly string[],
  allowed?: readonly string[],
): string | null {
  return (
    STAFF_ROLE_ORDER.find((r) => roles.includes(r) && (!allowed || allowed.includes(r))) ?? null
  );
}
