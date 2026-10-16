/**
 * How the parameter screen (H05) groups and labels keys from `listParameters`. Keys follow erd §9 /
 * business-rules §13. Unknown keys still show (group "Khác", label = key). Values/bounds come from the
 * API – nothing here is a business number.
 */
export type ParamGroup = 'booking' | 'occupancy' | 'time' | 'money' | 'security' | 'other';
export type ParamUnit = 'hours' | 'days' | 'pct' | 'vnd' | 'age' | 'minutes' | 'time' | 'none';

export interface ParamMeta {
  group: ParamGroup;
  label?: string;
  unit: ParamUnit;
}

export const GROUP_ORDER: ParamGroup[] = [
  'booking',
  'occupancy',
  'time',
  'money',
  'security',
  'other',
];

export const GROUP_LABEL: Record<ParamGroup, string> = {
  booking: 'params.grp_booking',
  occupancy: 'params.grp_occupancy',
  time: 'params.grp_time',
  money: 'params.grp_money',
  security: 'params.grp_security',
  other: 'params.grp_other',
};

/** Security parameters (OpenAPI setParameter.x-security-parameters): owner only, hard bounds by SEC. */
export const SECURITY_BOUNDS: Record<string, { min: number; max: number }> = {
  guest_verify_max_attempts: { min: 3, max: 5 },
  guest_level2_idle_minutes: { min: 5, max: 30 },
  guest_link_grace_hours: { min: 0, max: 24 },
  guest_verify_code_channel_minutes: { min: 5, max: 30 },
  trusted_device_days: { min: 1, max: 180 },
  trusted_device_mobile_days: { min: 1, max: 30 },
  c3_stepup_minutes: { min: 1, max: 15 },
};

const KNOWN: Record<string, ParamMeta> = {
  hold_hours_default: { group: 'booking', label: 'params.hold_hours', unit: 'hours' },
  hold_hours_options: { group: 'booking', unit: 'hours' },
  hold_expiry_reminder_hours: { group: 'booking', unit: 'hours' },
  hold_extension_max_hours: { group: 'booking', unit: 'hours' },
  quote_validity_days: { group: 'booking', label: 'params.quote_valid', unit: 'days' },
  short_stay_deposit_pct: { group: 'booking', label: 'params.deposit_pct', unit: 'pct' },
  extra_adult_fee: { group: 'occupancy', label: 'params.extra_adult', unit: 'vnd' },
  child_fee_6_11: { group: 'occupancy', label: 'params.extra_child', unit: 'vnd' },
  child_free_under_age: { group: 'occupancy', label: 'params.child_free', unit: 'age' },
  adult_from_age: { group: 'occupancy', unit: 'age' },
  checkin_time: { group: 'time', unit: 'time' },
  checkout_time: { group: 'time', unit: 'time' },
  late_grace_until: { group: 'time', unit: 'time' },
  no_show_call_time: { group: 'time', unit: 'time' },
  no_show_mark_time: { group: 'time', unit: 'time' },
  'foc_self_apply.front_desk.per_time': { group: 'money', unit: 'vnd' },
  'foc_self_apply.front_desk.per_month': { group: 'money', unit: 'vnd' },
  foc_limits: { group: 'money', unit: 'none' },
  foc_alert_pct_of_room_revenue: { group: 'money', unit: 'pct' },
  short_stay_commission_pct: { group: 'money', unit: 'none' },
  vat_rate: { group: 'money', unit: 'pct' },
  trusted_device_days: { group: 'security', unit: 'days' },
  trusted_device_mobile_days: { group: 'security', unit: 'days' },
  c3_stepup_minutes: { group: 'security', unit: 'minutes' },
  guest_verify_max_attempts: { group: 'security', unit: 'none' },
  guest_level2_idle_minutes: { group: 'security', unit: 'minutes' },
  guest_link_grace_hours: { group: 'security', unit: 'hours' },
  guest_verify_code_channel_minutes: { group: 'security', unit: 'minutes' },
  guest_verify_code_channels: { group: 'security', unit: 'none' },
};

export function paramMeta(key: string): ParamMeta {
  if (KNOWN[key]) return KNOWN[key]!;
  if (key.startsWith('channel_commission_pct.')) return { group: 'money', unit: 'pct' };
  if (key.startsWith('foc_')) return { group: 'money', unit: 'none' };
  return { group: 'other', unit: 'none' };
}

export const UNIT_KEY: Partial<Record<ParamUnit, string>> = {
  hours: 'params.unit_hours',
  days: 'params.unit_days',
  minutes: 'params.unit_minutes',
  age: 'params.unit_age',
};

export function paramLabel(t: (k: string) => string, key: string): string {
  const meta = paramMeta(key);
  return meta.label ? t(meta.label) : key;
}
