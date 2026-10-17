import type { Me, Role } from './api';

export type Mode = 'hk' | 'mt';

export interface StaffSession {
  me: Me;
  propertyId: string;
  propertyName: string;
  roles: Role[];
  mode: Mode;
}

const SUPERVISORS: readonly Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

/**
 * Which app a role gets (ADR-005, EP07-08 mục 1): housekeeping → tasks/rooms/inspection; maintenance →
 * work orders. Front desk and above may open the PWA too (H19: "FDL/FD xem cùng dữ liệu") and get the
 * housekeeping screens – they are the ones who inspect. Sales/agents have nothing here.
 */
export function staffMode(roles: readonly Role[]): Mode | null {
  if (roles.includes('housekeeping')) return 'hk';
  if (roles.includes('maintenance')) return 'mt';
  if (roles.some((r) => SUPERVISORS.includes(r))) return 'hk';
  return null;
}

export function sessionFromMe(me: Me): StaffSession | null {
  const prop = me.properties.find((p) => p.propertyId === me.activePropertyId) ?? me.properties[0];
  if (!prop) return null;
  const mode = staffMode(prop.roles);
  if (!mode) return null;
  return { me, propertyId: prop.propertyId, propertyName: prop.name, roles: prop.roles, mode };
}

/** Can this person record an inspection (A81: FDL+, or HK when self-inspection is on – server decides)? */
export function canInspect(s: StaffSession): boolean {
  return s.roles.some(
    (r) => r === 'housekeeping' || r === 'owner' || r === 'manager' || r === 'front_desk_lead',
  );
}

/** HK screens are read-only for maintenance (x-scope `maintenance: read_only`). */
export function canWriteRooms(s: StaffSession): boolean {
  return s.roles.some((r) => r !== 'maintenance');
}

/** A86: maintenance and front desk+ create OOO blocks; housekeeping only suggests one (`blockRequested`). */
export function canBlock(s: StaffSession): boolean {
  return s.roles.some((r) =>
    (['maintenance', 'front_desk', 'front_desk_lead', 'manager', 'owner'] as Role[]).includes(r),
  );
}
