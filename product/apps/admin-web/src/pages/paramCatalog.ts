import type { Parameter, Role } from '@ottimo/api-client';
import { hasKey } from '@ottimo/i18n';

/**
 * How the parameter screen (H05) groups and labels keys from `listParameters`. Keys follow erd §9 /
 * business-rules §13. Unknown keys still show (group "Khác", label = key). Values/bounds come from the
 * API – nothing here is a business number.
 */
export type ParamGroup = 'booking' | 'occupancy' | 'time' | 'money' | 'security' | 'other';
export type ParamUnit =
  'hours' | 'days' | 'nights' | 'pct' | 'vnd' | 'age' | 'minutes' | 'time' | 'none';

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

/** V5-21 (copy-v1.0.5 2.4): the OTA base rate row carries the "Không cần nhập" note on H05 and in its edit box. */
export const OTA_BASE_RATE_KEY = 'ota_base_rate';

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
  // v1.0.5 V5-21 (copy-v1.0.5 2.1): the price-table keys INV edits (B1–B11 of the price-change guide, rounding.*,
  // early_checkin_tiers) get a unit; the name comes from `params.k.<key>`. Group stays "Khác" so the dictionary and the
  // manual keep saying "tab Khác".
  weekend_uplift_pct: { group: 'other', unit: 'pct' },
  weekend_nights: { group: 'other', unit: 'none' },
  weekend_uplift_channels: { group: 'other', unit: 'none' },
  special_uplift_pct: { group: 'other', unit: 'pct' },
  special_dates: { group: 'other', unit: 'none' },
  special_uplift_channels: { group: 'other', unit: 'none' },
  los_discount: { group: 'other', unit: 'none' },
  long_stay_required_from_nights: { group: 'other', unit: 'nights' },
  short_stay_max_nights: { group: 'other', unit: 'nights' },
  ota_base_rate: { group: 'other', unit: 'none' },
  early_checkin_tiers: { group: 'other', unit: 'none' },
  long_stay_compare_from_nights: { group: 'other', unit: 'nights' },
  'rounding.monthly_rent': { group: 'other', unit: 'vnd' },
  'rounding.night_rate': { group: 'other', unit: 'vnd' },
  'rounding.deposit': { group: 'other', unit: 'vnd' },
  'rounding.fee': { group: 'other', unit: 'vnd' },
  'rounding.ota_rate': { group: 'other', unit: 'vnd' },
  late_checkout_tiers: { group: 'other', unit: 'none' },
  rate_floor_pct: { group: 'other', unit: 'pct' },
  rate_ceiling_pct: { group: 'other', unit: 'pct' },
  min_stay: { group: 'other', unit: 'none' },
  min_stay_orphan_night_exception: { group: 'other', unit: 'none' },
  booking_window_days: { group: 'other', unit: 'days' },
  return_guest_code: { group: 'other', unit: 'none' },
  return_guest_pct: { group: 'other', unit: 'pct' },
  stackable: { group: 'other', unit: 'none' },
  prices_include_vat: { group: 'other', unit: 'none' },
  public_show_prices: { group: 'other', unit: 'none' },
  'web_estimate.open_until': { group: 'other', unit: 'none' },
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
  nights: 'params.unit_nights',
  minutes: 'params.unit_minutes',
  age: 'params.unit_age',
};

const CHANNEL_PREFIX = 'channel_commission_pct.';

/**
 * Human label (FB-R2-UXD-FE-03): the curated `meta.label`, else UXD's `params.k.<key>` (dots → `_`),
 * `channel_commission_pct.<channel>` → `params.k.channel_commission_pct` with {channel}; the technical
 * key only when no string exists (the key is still shown under the label as `<code>`).
 */
export function paramLabel(
  t: (k: string, args?: Record<string, string | number>) => string,
  key: string,
): string {
  const meta = paramMeta(key);
  if (meta.label) return t(meta.label);
  if (key.startsWith(CHANNEL_PREFIX) && hasKey('params.k.channel_commission_pct')) {
    return t('params.k.channel_commission_pct', { channel: key.slice(CHANNEL_PREFIX.length) });
  }
  const k = `params.k.${key.replace(/\./g, '_')}`;
  return hasKey(k) ? t(k) : key;
}

/** Who may edit a key: the API's `editableBy`; fallback mirrors rbac 5.3 (security keys → owner only). */
export function editorsOf(p: Parameter): Role[] {
  if (p.editableBy?.length) return p.editableBy;
  return p.key in SECURITY_BOUNDS ? ['owner'] : ['owner', 'manager'];
}
