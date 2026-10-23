/**
 * FB-R3-SEC-BE-B-03 (SEC s1 D.4): the role of the person behind a money audit, captured at the time (a role can change
 * later). The highest staff role held; the system actor of the jobs (nil uuid) is `system`.
 */
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const ORDER = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'maintenance',
  'sales_staff',
  'housekeeping',
  'collaborator',
];

export function actorRoleOf(userId: string | null, roles: readonly string[]): string {
  if (userId === null || userId === SYSTEM_USER_ID) return 'system';
  return ORDER.find((r) => roles.includes(r)) ?? roles[0] ?? 'unknown';
}
