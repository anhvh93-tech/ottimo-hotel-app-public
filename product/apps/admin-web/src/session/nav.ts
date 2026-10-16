import type { Role } from '@ottimo/api-client';
import type { IconName } from '@ottimo/ui';

/**
 * Menu model (H02). Visibility = screen code in `Me.properties[].screens` (EP00 0.4, rbac-matrix §3)
 * plus, for a few items, the role cards of hi-fi H02 2.2 (presentation only – the route guard and the
 * API are what enforce access).
 */
export type Section = 'top' | 'ops' | 'sales' | 'admin';

export interface NavItem {
  id: string;
  path: string;
  icon: IconName;
  label: string;
  /** Label for sale/CTV (their menu talks about "my" items – H02 2.2). */
  labelOwn?: string;
  screen: string;
  section: Section;
  /** Only for these roles (hi-fi role cards). Menu AND route guard use it (BUG-R2-010); the API is the real check. */
  roles?: Role[];
  /** C3 screens are hidden on devices not granted by the owner (US-142 AC2, EP00 10.4). */
  needsTrustedDevice?: boolean;
  kbd?: string;
  /** Built in this sprint; others render the "coming later" state. */
  ready?: boolean;
}

const MGMT: Role[] = ['owner', 'manager'];
const DESK: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

export const NAV: NavItem[] = [
  {
    id: 'overview',
    path: '/overview',
    icon: 'chart',
    label: 'nav.overview',
    screen: 'S02',
    section: 'top',
    roles: MGMT,
  },
  {
    id: 'approvals',
    path: '/approvals',
    icon: 'check',
    label: 'nav.approvals',
    screen: 'S23',
    section: 'top',
    roles: ['owner', 'manager', 'front_desk_lead'],
  },
  {
    id: 'today',
    path: '/today',
    icon: 'home',
    label: 'nav.today',
    screen: 'S02',
    section: 'ops',
    roles: DESK,
    ready: true,
  },
  {
    id: 'rack',
    path: '/rack',
    icon: 'rack',
    label: 'nav.rack',
    screen: 'S03',
    section: 'ops',
    // Sale/CTV see availability inside "Báo giá & giữ chỗ" (S15), not the rack (H02 2.2 role cards).
    roles: [...DESK, 'housekeeping', 'maintenance'],
    kbd: 'R',
  },
  {
    id: 'reservations',
    path: '/reservations',
    icon: 'calendar',
    label: 'nav.reservations',
    screen: 'S04',
    section: 'ops',
    roles: DESK,
  },
  {
    id: 'registration',
    path: '/registration',
    icon: 'id',
    label: 'nav.registration',
    screen: 'S09',
    section: 'ops',
    needsTrustedDevice: true,
  },
  {
    id: 'housekeeping',
    path: '/housekeeping',
    icon: 'broom',
    label: 'nav.housekeeping',
    screen: 'S10',
    section: 'ops',
  },
  {
    id: 'maintenance',
    path: '/maintenance',
    icon: 'wrench',
    label: 'nav.maintenance',
    labelOwn: 'nav.work_orders',
    screen: 'S11',
    section: 'ops',
  },
  {
    id: 'guests',
    path: '/guests',
    icon: 'users',
    label: 'nav.guests',
    labelOwn: 'nav.my_guests',
    screen: 'S14',
    section: 'sales',
    ready: true,
  },
  {
    id: 'quotes',
    path: '/quotes',
    icon: 'tag',
    label: 'nav.quotes',
    screen: 'S15',
    section: 'sales',
  },
  {
    id: 'moneylog',
    path: '/audit',
    icon: 'bill',
    label: 'nav.moneylog',
    screen: 'S27',
    section: 'admin',
    roles: DESK,
  },
  {
    id: 'rooms',
    path: '/settings/rooms',
    icon: 'bed',
    label: 'nav.rooms',
    screen: 'S25',
    section: 'admin',
    ready: true,
  },
  {
    id: 'params',
    path: '/settings/parameters',
    icon: 'sliders',
    label: 'nav.params',
    screen: 'S24',
    section: 'admin',
    ready: true,
  },
  {
    id: 'users',
    path: '/settings/users',
    icon: 'user',
    label: 'nav.users',
    screen: 'S26',
    section: 'admin',
    roles: ['owner'],
    ready: true,
  },
  {
    id: 'devices',
    path: '/settings/devices',
    icon: 'monitor',
    label: 'nav.devices',
    screen: 'S26',
    section: 'admin',
    roles: ['owner'],
    ready: true,
  },
];

export const SECTION_LABEL: Record<Section, string> = {
  top: 'nav.sec.top',
  ops: 'nav.sec.ops',
  sales: 'nav.sec.sales',
  admin: 'nav.sec.admin',
};

/** Display order of roles (EP00 1.1 `[GIẢ ĐỊNH BA]`): the first role decides the home screen. */
export const ROLE_ORDER: Role[] = [
  'owner',
  'manager',
  'front_desk_lead',
  'front_desk',
  'sales_staff',
  'collaborator',
  'housekeeping',
  'maintenance',
];

const HOME: Record<Role, string> = {
  owner: '/overview',
  manager: '/overview',
  front_desk_lead: '/today',
  front_desk: '/today',
  sales_staff: '/quotes',
  collaborator: '/quotes',
  housekeeping: '/housekeeping',
  maintenance: '/maintenance',
};

export function primaryRole(roles: Role[]): Role | undefined {
  return ROLE_ORDER.find((r) => roles.includes(r));
}

export function homePath(roles: Role[]): string {
  const role = primaryRole(roles);
  return role ? HOME[role] : '/no-access';
}

export interface Access {
  roles: Role[];
  screens: string[];
  deviceTrusted: boolean;
}

/**
 * Route guard: screen code from `screens` AND the item's role cards – the same rule as the menu, so a
 * deep link to a hidden item shows "no access" instead of a page whose API call fails (BUG-R2-010).
 * The trusted-device check is separate (the route shows DeviceBlocked instead).
 */
export function canOpen(item: NavItem, access: Access): boolean {
  if (!access.screens.includes(item.screen)) return false;
  if (item.roles && !item.roles.some((r) => access.roles.includes(r))) return false;
  return true;
}

export function isVisible(item: NavItem, access: Access): boolean {
  if (!canOpen(item, access)) return false;
  if (item.needsTrustedDevice && !access.deviceTrusted) return false;
  return true;
}

/** Sale/CTV-only accounts see "my …" labels (H02 2.2). */
export function labelFor(item: NavItem, roles: Role[]): string {
  const ownOnly = roles.every(
    (r) =>
      r === 'sales_staff' || r === 'collaborator' || r === 'housekeeping' || r === 'maintenance',
  );
  return ownOnly && item.labelOwn ? item.labelOwn : item.label;
}

export function navItemByPath(path: string): NavItem | undefined {
  return NAV.find((n) => n.path === path);
}
