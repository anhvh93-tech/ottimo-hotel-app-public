// Dev/test seed for the MSW mock API – shapes and values follow the examples in docs/api/openapi.yaml,
// usernames follow QA DS-E (qa.*). Test-only values: never valid on any real environment.
import type {
  Guest,
  Parameter,
  Role,
  Room,
  RoomGroup,
  TrustedDevice,
  User,
} from '@ottimo/api-client';

/** Password of every mock account (dev/test only). */
export const MOCK_PASSWORD = 'ottimo-demo-2026';
export const PROPERTY_ID = '0192a1b0-0000-7000-8000-0000000000a1';
export const PROPERTY_NAME = 'OTTIMO Boutique Stay – Đà Lạt';

/** rbac-matrix.md §3 (S01…S34) – generated from the table; MGR without S26 (note 20a, R2 owner only). */
export const SCREENS: Record<Role, string[]> = {
  owner:
    'S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20 S21 S22 S23 S24 S25 S26 S27 S28 S29 S30 S31 S32 S33 S34'.split(
      ' ',
    ),
  manager:
    'S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20 S21 S22 S23 S24 S25 S27 S28 S29 S30 S31 S32 S33 S34'.split(
      ' ',
    ),
  front_desk_lead:
    'S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S18 S19 S22 S23 S24 S25 S27 S29 S30 S32 S33 S34'.split(
      ' ',
    ),
  front_desk:
    'S01 S02 S03 S04 S05 S06 S07 S08 S09 S10 S11 S12 S13 S14 S15 S16 S18 S23 S25 S27 S29 S30 S32 S34'.split(
      ' ',
    ),
  housekeeping: 'S01 S03 S10 S11 S13 S23 S30'.split(' '),
  maintenance: 'S01 S03 S10 S11 S12 S23 S30'.split(' '),
  sales_staff: 'S01 S03 S04 S14 S15 S16 S17 S23 S25 S29'.split(' '),
  collaborator: 'S01 S03 S04 S14 S15 S16 S17 S23 S25 S29'.split(' '),
};

/** US-143 mock 2FA state (SEC A) – the server keeps the secret encrypted and only hashes of the codes. */
export interface MockMfa {
  secret?: string;
  pending?: { secret: string; expiresAt: number };
  lastStep?: number;
  recovery: string[];
  enrolledAt?: string;
}

export interface MockUser extends User {
  mustChangePassword?: boolean;
  deviceTrusted?: boolean;
  mfa?: MockMfa;
}

const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const user = (
  n: number,
  username: string,
  displayName: string,
  roles: Role[],
  extra: Partial<MockUser> = {},
): MockUser => ({
  id: uid(n),
  username,
  displayName,
  status: 'active',
  roles: roles.map((role) => ({ propertyId: PROPERTY_ID, role })),
  lastLoginAt: '2026-10-16T07:55:00+07:00',
  version: 1,
  ...extra,
});

export function seedUsers(): MockUser[] {
  return [
    user(1, 'qa.owner', 'Chủ đầu tư', ['owner'], { deviceTrusted: false }),
    user(2, 'qa.mgr', 'Quân', ['manager'], { deviceTrusted: true }),
    user(3, 'qa.fdl', 'Lan', ['front_desk_lead'], { deviceTrusted: true }),
    user(4, 'qa.fd', 'Hạnh', ['front_desk'], { deviceTrusted: true }),
    user(5, 'qa.hk', 'Bích', ['housekeeping']),
    user(6, 'qa.mt', 'Tuấn', ['maintenance']),
    user(7, 'qa.sal', 'Sơn', ['sales_staff']),
    user(8, 'qa.ctv1', 'Mai', ['collaborator']),
    user(9, 'qa.temp', 'Nhân viên mới', ['front_desk'], {
      mustChangePassword: true,
      lastLoginAt: undefined,
    }),
    user(10, 'qa.locked', 'Tài khoản khóa', ['front_desk'], { status: 'disabled' }),
  ];
}

export function seedGroups(): RoomGroup[] {
  return [
    { id: uid(101), code: 'L12', name: 'Lầu 1–2', sortOrder: 1, baseOccupancy: 2, maxOccupancy: 3 },
    { id: uid(102), code: 'N', name: 'Căn N', sortOrder: 2, baseOccupancy: 4, maxOccupancy: 5 },
    {
      id: uid(103),
      code: 'NPLUS',
      name: 'Căn N+',
      sortOrder: 3,
      baseOccupancy: 3,
      maxOccupancy: 4,
    },
  ];
}

/** 10 units of OTTIMO Đà Lạt (hi-fi H04; BR-110 standard occupancy per unit; ESC-014 max = base + 1). */
export function seedRooms(): Room[] {
  const g = seedGroups();
  const rows: Array<[string, string, number, number, number]> = [
    ['101', 'The Amber', 0, 2, 8_000_000],
    ['102', 'The Fern', 0, 2, 9_000_000],
    ['103', 'The Bloom', 0, 2, 9_000_000],
    ['201', 'The Mist', 0, 2, 8_500_000],
    ['202', 'The Valley', 0, 2, 9_500_000],
    ['203', 'The Sage', 0, 2, 9_500_000],
    ['301', 'The Velvet', 1, 4, 11_500_000],
    ['302', 'The Ivory', 2, 3, 11_000_000],
    ['401', 'The Pine', 1, 4, 12_500_000],
    ['402', 'The Ember', 2, 3, 12_000_000],
  ];
  return rows.map(([roomNo, name, gi, base, monthly], i) => ({
    id: uid(201 + i),
    roomNo,
    name,
    roomGroupId: g[gi]!.id,
    floor: Number(roomNo[0]),
    baseOccupancy: base,
    maxOccupancy: base + 1,
    // Hi-fi H04 sample texts (studio / 2BR / 1BR+); real values come from DS-E seed.
    bedSetup:
      gi === 0
        ? 'Studio · 1 giường'
        : gi === 1
          ? '2 phòng ngủ · 2 giường lớn'
          : '1 giường lớn + 1 giường 1m4',
    isSellable: true,
    activeFrom: '2026-01-01',
    activeTo: null,
    currentListPrice: {
      effectiveFrom: '2026-10-15',
      monthlyListPriceVnd: monthly,
      nightlyListPriceVnd: Math.round(monthly / 12 / 1000) * 1000,
    },
    version: 1,
  }));
}

/** Future/in-house bookings used for CAPACITY_BELOW_BOOKINGS (H04 4.2 sample: OTM-0152, 302, 4 guests). */
export const BOOKED_GUESTS: Record<
  string,
  Array<{ reservationCode: string; stayFrom: string; stayTo: string; guestCount: number }>
> = {
  '302': [
    { reservationCode: 'OTM-0152', stayFrom: '2026-10-15', stayTo: '2026-10-19', guestCount: 4 },
  ],
};

const OWN = ['owner'] as Role[];
const MGMT = ['owner', 'manager'] as Role[];
const p = (
  key: string,
  value: unknown,
  brRef: string,
  editableBy: Role[],
  extra: Partial<Parameter> = {},
): Parameter => ({
  key,
  value,
  effectiveFrom: '2026-10-15',
  brRef,
  editableBy,
  changedBy: 'Chủ đầu tư',
  changedAt: '2026-10-15T09:30:00+07:00',
  ...extra,
});

/** BR §13 defaults (business-rules v0.3.1) – mock only, the API seeds the real ones. */
export function seedParams(): Parameter[] {
  return [
    p('hold_hours_options', [12, 24, 48], 'BR-302', MGMT),
    p('hold_hours_default', 24, 'BR-302', MGMT),
    p('quote_validity_days', 3, 'BR-304', MGMT),
    p('short_stay_deposit_pct', 30, 'BR-305', MGMT, {
      effectiveFrom: '2026-10-16',
      changedAt: '2026-10-16T08:00:00+07:00',
    }),
    p('extra_adult_fee', 150_000, 'BR-110', MGMT),
    p('child_fee_6_11', 100_000, 'BR-110', MGMT),
    p('child_free_under_age', 6, 'BR-110', MGMT),
    p('adult_from_age', 12, 'BR-110', MGMT),
    p('checkin_time', '14:00', 'BR-401', MGMT, { statusLabel: 'GD' }),
    p('checkout_time', '12:00', 'BR-401', MGMT, { statusLabel: 'GD' }),
    p('foc_self_apply.front_desk.per_time', 100_000, 'BR-436', OWN),
    p('foc_self_apply.front_desk.per_month', 500_000, 'BR-436', OWN),
    p('vat_rate', 8, 'BR-523', OWN, { statusLabel: 'PL' }),
    p('trusted_device_days', 180, 'SR-DEV-01', OWN),
    p('trusted_device_mobile_days', 30, 'SR-DEV-08', OWN),
    p('c3_stepup_minutes', 15, 'SR-C3-09', OWN),
    p('guest_verify_max_attempts', 5, 'SR-GST-08', OWN),
  ];
}

/** Technical bounds (erd 9.1a + x-security-parameters) enforced by the mock like the API. */
export const PARAM_BOUNDS: Record<string, { min: number; max: number } | { allowedFrom: string }> =
  {
    hold_hours_default: { allowedFrom: 'hold_hours_options' },
    quote_validity_days: { min: 1, max: 30 },
    short_stay_deposit_pct: { min: 0, max: 100 },
    extra_adult_fee: { min: 0, max: 2_000_000 },
    child_fee_6_11: { min: 0, max: 2_000_000 },
    child_free_under_age: { min: 0, max: 12 },
    adult_from_age: { min: 6, max: 18 },
    trusted_device_days: { min: 1, max: 180 },
    trusted_device_mobile_days: { min: 1, max: 30 },
    c3_stepup_minutes: { min: 1, max: 15 },
    guest_verify_max_attempts: { min: 3, max: 5 },
  };

export interface MockGuest extends Guest {
  createdBy: string;
}

export function seedGuests(): MockGuest[] {
  const g = (
    n: number,
    code: string,
    fullName: string,
    phone: string,
    email: string | undefined,
    createdBy: string,
    extra: Partial<MockGuest> = {},
  ): MockGuest => ({
    id: uid(300 + n),
    code,
    fullName,
    phone,
    email,
    nationalityCode: 'VN',
    isForeigner: false,
    preferredLocale: 'vi',
    tags: [],
    serviceNotes: [],
    crmConsent: 'granted',
    version: 1,
    createdBy,
    ...extra,
  });
  return [
    g(3, 'KH-0003', 'Nguyễn Văn An', '0901 234 567', 'an.nguyen@example.com', uid(4)),
    g(12, 'KH-0012', 'Đỗ Mai Anh', '0905 123 456', 'mai.anh@example.com', uid(4), {
      tags: ['return_guest'],
      dateOfBirth: '1994-03-12',
    }),
    g(14, 'KH-0014', 'Do Mai Anh', '0912 345 870', 'maianh.do@example.com', uid(4)),
    g(20, 'KH-0020', 'Trần Thu Hà', '0987 654 321', undefined, uid(7)),
    g(21, 'KH-0021', 'Anna Martin', '+33 6 12 34 56 78', 'anna.martin@example.com', uid(4), {
      nationalityCode: 'FR',
      isForeigner: true,
      preferredLocale: 'en',
    }),
  ];
}

export function seedDevices(): TrustedDevice[] {
  return [
    {
      id: uid(401),
      name: 'Máy quầy lễ tân 1',
      deviceKind: 'desk',
      createdByName: 'Chủ đầu tư',
      createdAt: '2026-10-15T08:00:00+07:00',
      expiresAt: '2027-04-13T08:00:00+07:00',
      lastSeenAt: '2026-10-16T07:50:00+07:00',
    },
    {
      id: uid(402),
      name: 'Laptop quản lý',
      deviceKind: 'desk',
      createdByName: 'Chủ đầu tư',
      createdAt: '2026-10-15T08:10:00+07:00',
      expiresAt: '2027-04-13T08:10:00+07:00',
    },
  ];
}
