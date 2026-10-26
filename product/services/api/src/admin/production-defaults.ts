/**
 * Production defaults of the one-time bootstrap (R3-OPS-02, `production-bootstrap-cli.ts`). REAL property data,
 * no guest/booking data and no secret:
 * - organisation + property OTTIMO Đà Lạt (BR-001 time zone);
 * - the 3 internal room groups and the 10 units (investor brief "Quy mô"; BR-110 base/max occupancy per unit,
 *   ESC-014; BR-012 room names – BL 4.1 mapping; public room types per INV 26/10, BR v0.4.4);
 * - sales channels with the BR-901 commission rates;
 * - the BR section 13 defaults of every catalogue key that has NO catalogue default (`config_parameter_def.
 *   default_value IS NULL`), plus the few keys WITH a catalogue default whose production value differs or must
 *   carry its source (document retention keys, BR v0.4.4). Values were taken from the QA DS-E fixture, which
 *   mirrors BR section 13; `status` is the label of that row (INV-0xx decided, INV-DDMM = INV answer of that day,
 *   GD = [GIẢ ĐỊNH], PL = lawyer/accountant, NGANH = DOM) and must match `config_parameter_status_label_check`
 *   (`^[A-Z0-9-]{1,16}(\+[A-Z0-9-]{1,16}){0,3}$` – no '/'). Checked against BR v0.4.4 section 13 (DOM, 26/10);
 *   check-in keys per BR v0.4.6 (BR-401/BR-411, INV 26/10).
 * Deliberately NOT here (INV types them in the app after the first sign-in): room list prices
 * (`room_list_price`, BR-101), `ota_base_rate` (BR-103), `payment_receiving_account` (BR-521, R3-Q51 screen), the
 * Wi-Fi password (BR-012 (7), ESC-022 B), minibar items and their prices, `shift_max_hours` (no BR value).
 */

export const PRODUCTION_ORGANIZATION = { code: 'OTTIMO', name: 'OTTIMO Boutique Stay' } as const;
export const PRODUCTION_PROPERTY = {
  code: 'DLT',
  name: 'OTTIMO Đà Lạt',
  timezone: 'Asia/Ho_Chi_Minh',
} as const;

export interface ProductionRoomGroup {
  code: string;
  name: string;
  sortOrder: number;
  baseOccupancy: number;
  maxOccupancy: number;
}

/** Internal groups (investor brief: Lầu 1–2 / Căn N / Căn N+); occupancy = BR-110 group defaults. */
export const PRODUCTION_ROOM_GROUPS: readonly ProductionRoomGroup[] = [
  { code: 'L12', name: 'Lầu 1–2', sortOrder: 1, baseOccupancy: 2, maxOccupancy: 3 },
  { code: 'N', name: 'Căn N', sortOrder: 2, baseOccupancy: 4, maxOccupancy: 5 },
  { code: 'NPLUS', name: 'Căn N+', sortOrder: 3, baseOccupancy: 3, maxOccupancy: 4 },
];

export interface ProductionRoom {
  roomNo: string;
  /** BR-012 room name (BL 4.1 mapping – [GIẢ ĐỊNH] until INV's table). */
  name: string;
  group: string;
  baseOccupancy: number;
  maxOccupancy: number;
  /**
   * BR-012 public room type (e-brochure 2026, 4 types) – BR v0.4.4, INV 26/10: City View = 101, 201; Garden
   * View = 102, 103, 202, 203; 301/401 = Signature two bedrooms; 302/402 = Premium one bedroom + 1. The Desk has
   * no field to edit it, so the label must be right at bootstrap.
   */
  publicRoomType: string | null;
}

/**
 * The 4 public room type labels (e-brochure, landing concept section 4). Their slug (`slugOf`,
 * `modules/public-site/internal/website-request-rules.ts`) MUST equal the landing room slugs
 * (`apps/landing-web/src/content/en.ts` rooms.items[].slug): a web request carries the slug, and the Desk flags
 * `room_type_unmatched` / shows no room type when no sellable room has a label with that slug.
 */
export const STUDIO_CITY = 'Standard Studio · City View';
export const STUDIO_GARDEN = 'Standard Studio · Garden View';
export const PREMIUM_ONE_BEDROOM = 'Premium · One Bedroom + 1';
export const SIGNATURE_TWO_BEDROOMS = 'Signature · Two Bedrooms';

export const PRODUCTION_ROOMS: readonly ProductionRoom[] = [
  {
    roomNo: '101',
    name: 'The Amber',
    group: 'L12',
    baseOccupancy: 2,
    maxOccupancy: 3,
    publicRoomType: STUDIO_CITY,
  },
  {
    roomNo: '102',
    name: 'The Fern',
    group: 'L12',
    baseOccupancy: 2,
    maxOccupancy: 3,
    publicRoomType: STUDIO_GARDEN,
  },
  {
    roomNo: '103',
    name: 'The Bloom',
    group: 'L12',
    baseOccupancy: 2,
    maxOccupancy: 3,
    publicRoomType: STUDIO_GARDEN,
  },
  {
    roomNo: '201',
    name: 'The Mist',
    group: 'L12',
    baseOccupancy: 2,
    maxOccupancy: 3,
    publicRoomType: STUDIO_CITY,
  },
  {
    roomNo: '202',
    name: 'The Valley',
    group: 'L12',
    baseOccupancy: 2,
    maxOccupancy: 3,
    publicRoomType: STUDIO_GARDEN,
  },
  {
    roomNo: '203',
    name: 'The Sage',
    group: 'L12',
    baseOccupancy: 2,
    maxOccupancy: 3,
    publicRoomType: STUDIO_GARDEN,
  },
  {
    roomNo: '301',
    name: 'The Velvet',
    group: 'N',
    baseOccupancy: 4,
    maxOccupancy: 5,
    publicRoomType: SIGNATURE_TWO_BEDROOMS,
  },
  {
    roomNo: '302',
    name: 'The Ivory',
    group: 'NPLUS',
    baseOccupancy: 3,
    maxOccupancy: 4,
    publicRoomType: PREMIUM_ONE_BEDROOM,
  },
  {
    roomNo: '401',
    name: 'The Pine',
    group: 'N',
    baseOccupancy: 4,
    maxOccupancy: 5,
    publicRoomType: SIGNATURE_TWO_BEDROOMS,
  },
  {
    roomNo: '402',
    name: 'The Ember',
    group: 'NPLUS',
    baseOccupancy: 3,
    maxOccupancy: 4,
    publicRoomType: PREMIUM_ONE_BEDROOM,
  },
];

/** BR-901 channels (one `direct` channel – ARC A-17; traveloka/google have no BR-901 rate yet → not created). */
export const PRODUCTION_CHANNELS = [
  { code: 'direct', name: 'Trực tiếp', group: 'direct', commissionPct: '0', requiresOtaRef: false },
  {
    code: 'collaborator',
    name: 'CTV / môi giới',
    group: 'agent',
    commissionPct: '0',
    requiresOtaRef: false,
  },
  { code: 'airbnb', name: 'Airbnb', group: 'ota', commissionPct: '15.5', requiresOtaRef: true },
  { code: 'booking', name: 'Booking.com', group: 'ota', commissionPct: '15', requiresOtaRef: true },
  { code: 'agoda', name: 'Agoda', group: 'ota', commissionPct: '18', requiresOtaRef: true },
  { code: 'expedia', name: 'Expedia', group: 'ota', commissionPct: '18', requiresOtaRef: true },
  { code: 'tripcom', name: 'Trip.com', group: 'ota', commissionPct: '15', requiresOtaRef: true },
  {
    code: 'internal',
    name: 'Nội bộ',
    group: 'internal',
    commissionPct: '0',
    requiresOtaRef: false,
  },
];

/** Catalogue keys without a default that INV enters in the app – never written by the bootstrap. */
export const INV_ENTERS_KEYS: readonly string[] = [
  'payment_receiving_account',
  'ota_base_rate',
  'shift_max_hours',
];

export interface ProductionParameter {
  key: string;
  br: string;
  status: string;
  value: unknown;
}

export const PRODUCTION_PARAMETERS: readonly ProductionParameter[] = [
  { key: 'timezone', br: 'BR-001', status: 'NGANH', value: 'Asia/Ho_Chi_Minh' },
  { key: 'business_day_rollover', br: 'BR-010', status: 'NGANH', value: '06:00' },
  { key: 'fx_usd_vnd', br: 'BR-004', status: 'GD', value: 26200 },
  { key: 'rounding.night_rate', br: 'BR-005', status: 'INV-004', value: 1000 },
  { key: 'rounding.monthly_rent', br: 'BR-005', status: 'INV-004', value: 10000 },
  { key: 'rounding.deposit', br: 'BR-005', status: 'INV-004', value: 100000 },
  { key: 'rounding.fee', br: 'BR-005', status: 'INV-004', value: 1000 },
  { key: 'night_from_month_divisor', br: 'BR-101', status: 'INV-004', value: 12 },
  { key: 'long_stay_daily_divisor', br: 'BR-102', status: 'NGANH', value: 30 },
  { key: 'weekend_uplift_pct', br: 'BR-103', status: 'INV-004', value: 15 },
  { key: 'weekend_nights', br: 'BR-103', status: 'INV-004', value: ['FRI', 'SAT'] },
  { key: 'weekend_uplift_channels', br: 'BR-103', status: 'INV-004', value: 'all' },
  {
    key: 'special_dates',
    br: 'BR-104',
    status: 'INV-004+GD',
    value: [
      { name: 'Tết Nguyên đán 2027', from: '2027-02-05', to: '2027-02-11' },
      { name: '30/4–1/5', from: '2027-04-30', to: '2027-05-02' },
      { name: 'Giỗ Tổ Hùng Vương 2027', from: '2027-04-16', to: '2027-04-17' },
      { name: 'Đêm trước Quốc khánh 2027', from: '2027-09-01', to: '2027-09-02' },
      { name: 'Quốc khánh', from: '2027-09-02', to: '2027-09-03' },
      { name: 'Giáng sinh – Năm mới', from: '2026-12-24', to: '2027-01-02' },
    ],
  },
  { key: 'special_uplift_pct', br: 'BR-104', status: 'INV-004+GD', value: 30 },
  { key: 'special_uplift_channels', br: 'BR-104', status: 'INV-004', value: 'all' },
  { key: 'rate_floor_pct', br: 'BR-105', status: 'GD', value: 70 },
  { key: 'rate_ceiling_pct', br: 'BR-105', status: 'GD', value: 250 },
  {
    key: 'los_discount',
    br: 'BR-107',
    status: 'INV-004',
    value: [
      { minNights: 7, pct: 10 },
      { minNights: 14, pct: 15 },
    ],
  },
  { key: 'long_stay_compare_from_nights', br: 'BR-108', status: 'INV-004', value: 15 },
  { key: 'long_stay_required_from_nights', br: 'BR-108', status: 'INV-004', value: 28 },
  { key: 'foreigner_surcharge_pct', br: 'BR-109', status: 'INV-004', value: 10 },
  { key: 'extra_adult_fee', br: 'BR-110', status: 'INV-004', value: 150000 },
  { key: 'adult_from_age', br: 'BR-110', status: 'INV-004', value: 12 },
  { key: 'child_free_under_age', br: 'BR-110', status: 'INV-004', value: 6 },
  { key: 'child_fee_6_11', br: 'BR-110', status: 'INV-004', value: 100000 },
  { key: 'return_guest_code', br: 'BR-111', status: 'GD', value: 'OTTIMO-BACK5' },
  { key: 'return_guest_pct', br: 'BR-111', status: 'GD', value: 5 },
  { key: 'stackable', br: 'BR-111', status: 'GD', value: false },
  { key: 'booking_window_days', br: 'BR-112', status: 'GD', value: 365 },
  { key: 'short_stay_max_nights', br: 'BR-112', status: 'GD', value: 27 },
  {
    key: 'min_stay',
    br: 'BR-113',
    status: 'INV-004',
    value: [
      { arrivalWeekdays: ['FRI', 'SAT'], nights: 2, channels: 'all' },
      { arrivalOnSpecialDates: true, nights: 2, channels: 'all' },
    ],
  },
  { key: 'min_stay_orphan_night_exception', br: 'BR-113', status: 'NGANH', value: true },
  { key: 'rent_reminder_days', br: 'BR-207', status: 'GD', value: 7 },
  { key: 'rent_overdue_alert_days', br: 'BR-207', status: 'GD', value: 3 },
  { key: 'rent_overdue_escalate_days', br: 'BR-207', status: 'GD', value: 10 },
  { key: 'lease_renewal_offer_days', br: 'BR-211', status: 'GD', value: 30 },
  { key: 'commission_payable_day', br: 'BR-212', status: 'INV-005', value: 1 },
  { key: 'commission_pay_by_day', br: 'BR-212', status: 'INV-005', value: 10 },
  { key: 'deposit_refund_working_days', br: 'BR-214', status: 'INV-006', value: 7 },
  { key: 'hold_hours_options', br: 'BR-302', status: 'INV-006', value: [12, 24, 48] },
  { key: 'hold_hours_default', br: 'BR-302', status: 'INV-006', value: 24 },
  { key: 'hold_latest_time_on_arrival', br: 'BR-302', status: 'NGANH', value: '12:00' },
  { key: 'hold_expiry_reminder_hours', br: 'BR-303', status: 'INV-006', value: 2 },
  { key: 'hold_extension_max_hours', br: 'BR-303', status: 'INV-006', value: 24 },
  { key: 'quote_validity_days', br: 'BR-304', status: 'INV-006', value: 3 },
  { key: 'short_stay_deposit_pct', br: 'BR-305', status: 'INV-006', value: 30 },
  {
    key: 'deposit_base',
    br: 'BR-305',
    status: 'NGANH',
    value: 'room_total_after_calendar_and_discount',
  },
  {
    key: 'cancel_policy_direct',
    br: 'BR-309',
    status: 'INV-006',
    value: [
      { minDays: 7, refundPct: 100 },
      { minDays: 3, refundPct: 50 },
      { minDays: 0, refundPct: 0 },
    ],
  },
  { key: 'cancel_peak_no_refund', br: 'BR-309', status: 'INV-006', value: true },
  { key: 'reschedule_max_times', br: 'BR-309', status: 'INV-006', value: 1 },
  { key: 'reschedule_window_months', br: 'BR-309', status: 'INV-006', value: 3 },
  { key: 'force_majeure_reschedule_months', br: 'BR-309', status: 'INV-006', value: 3 },
  { key: 'no_show_call_time', br: 'BR-311', status: 'INV-006', value: '18:00' },
  { key: 'no_show_mark_time', br: 'BR-311', status: 'INV-006', value: '23:00' },
  {
    key: 'early_termination',
    br: 'BR-313',
    status: 'INV-006',
    value: [
      { minDays: 30, forfeitPct: 50 },
      { minDays: 0, forfeitPct: 100 },
    ],
  },
  { key: 'conflict_resolve_minutes_urgent', br: 'BR-317', status: 'NGANH', value: 60 },
  { key: 'conflict_urgent_window_hours', br: 'BR-317', status: 'NGANH', value: 24 },
  { key: 'conflict_resolve_deadline_far', br: 'BR-317', status: 'NGANH', value: '12:00' },
  { key: 'channel_sync_outage_alert_minutes', br: 'BR-317', status: 'NGANH', value: 15 },
  { key: 'manual_close_when_rooms_left_le', br: 'BR-317', status: 'NGANH', value: 1 },
  { key: 'group_rooming_list_days', br: 'BR-323', status: 'INV-006', value: 3 },
  { key: 'group_min_rooms', br: 'BR-324', status: 'INV-006', value: 2 },
  // BR v0.4.6 (INV 26/10, FB-INV-004): check-in from 12:00 when the unit is VI/VC (always ready by 14:00).
  { key: 'checkin_time', br: 'BR-401', status: 'INV-2610', value: '12:00' },
  { key: 'checkout_time', br: 'BR-401', status: 'GD', value: '12:00' },
  // BR v0.3.9 (INV 19/10): door code = 8 random digits, birthday variant removed.
  { key: 'door_code_min_digits', br: 'BR-403', status: 'INV-1910+SEC', value: 8 },
  // Obsolete since BR v0.3.9 (birthday variant removed); written only because the catalogue has no default.
  { key: 'birthday_code_random_digits', br: 'BR-403', status: 'OBSOLETE', value: 3 },
  { key: 'door_lock_vendor', br: 'BR-403', status: 'INV-TT', value: 'TTLock' },
  {
    // BR v0.4.6: 0 % from 12:00 (`checkin_time`), 30 % 10:00–11:59, 50 % 06:00–09:59 (tier bounds ESC-007).
    key: 'early_checkin_tiers',
    br: 'BR-411',
    status: 'INV-007+INV-2610',
    value: [
      { from: '10:00', to: '12:00', pct: 30 },
      { from: '06:00', to: '10:00', pct: 50 },
    ],
  },
  {
    key: 'late_checkout_tiers',
    br: 'BR-412',
    status: 'INV-007',
    value: [
      { after: '12:00', until: '15:00', pct: 30 },
      { after: '15:00', until: '18:00', pct: 50 },
    ],
  },
  { key: 'late_grace_until', br: 'BR-412', status: 'INV-007', value: '12:30' },
  { key: 'late_grace_requires_no_same_day_arrival', br: 'BR-412', status: 'INV-007', value: true },
  { key: 'ota_surcharge_base', br: 'BR-415', status: 'INV-007', value: 'direct_current_rate' },
  { key: 'long_stay_free_late_until', br: 'BR-413', status: 'INV-007', value: '15:00' },
  { key: 'extension_max_nights', br: 'BR-421', status: 'GD', value: 7 },
  { key: 'extension_payment_deadline', br: 'BR-423', status: 'GD', value: '14:00' },
  {
    key: 'early_departure_refund',
    br: 'BR-428',
    status: 'INV-006',
    value: { minNoticeDays: 1, refundPct: 50 },
  },
  {
    key: 'checkout_reminders',
    br: 'BR-425',
    status: 'GD',
    value: {
      before: ['20:00-1d', '09:00', '11:00'],
      overdueWithSameDayArrival: '12:00',
      overdueOtherwise: '12:31',
    },
  },
  { key: 'post_checkout_charge_hours', br: 'BR-427', status: 'INV-007', value: 24 },
  {
    key: 'foc_limits',
    br: 'BR-433',
    status: 'INV-007',
    value: {
      front_desk_lead: { perTimeVnd: 300000, perMonthVnd: 1500000 },
      manager: { perTime: 'one_night_rate' },
      owner: { perTime: 'unlimited' },
    },
  },
  {
    key: 'foc_approval_push_roles',
    br: 'BR-432',
    status: 'NGANH',
    value: 'lowest_sufficient_role_plus_manager',
  },
  { key: 'foc_self_apply.front_desk.per_time', br: 'BR-436', status: 'INV-007', value: 100000 },
  { key: 'foc_self_apply.front_desk.per_month', br: 'BR-436', status: 'INV-007', value: 500000 },
  {
    key: 'foc_self_apply.front_desk.categories',
    br: 'BR-436',
    status: 'INV-007',
    value: ['minibar'],
  },
  { key: 'foc_alert_pct_of_room_revenue', br: 'BR-435', status: 'INV-007', value: 3 },
  { key: 'foc_alert_count_per_approver', br: 'BR-435', status: 'INV-007', value: 10 },
  // BR v0.4.4 (INV 26/10): electricity in VND/kWh; water in VND per PERSON per MONTH, pro-rated by the days
  // stayed (the key changed meaning from VND/m³). No code reads either key in v1.0 (utilities stay on paper
  // until v1.3, US-064/065 use the new meaning).
  { key: 'electricity_price', br: 'BR-501', status: 'INV-2610+PL', value: 5000 },
  { key: 'water_price', br: 'BR-501', status: 'INV-2610+PL', value: 100000 },
  { key: 'meter_anomaly_factor', br: 'BR-503', status: 'GD', value: 2 },
  { key: 'meter_anomaly_default_kwh', br: 'BR-503', status: 'GD', value: 300 },
  { key: 'meter_anomaly_default_m3', br: 'BR-503', status: 'GD', value: 10 },
  { key: 'utility_bill_due_days', br: 'BR-504', status: 'GD', value: 5 },
  { key: 'adhoc_cleaning_fee', br: 'BR-506', status: 'INV-005', value: 100000 },
  { key: 'laundry_price_per_kg', br: 'BR-507', status: 'GD', value: 30000 },
  { key: 'smoking_fee', br: 'BR-511', status: 'GD', value: 500000 },
  { key: 'key_card_fee', br: 'BR-511', status: 'GD', value: 200000 },
  { key: 'key_cards_per_booking', br: 'BR-511', status: 'GD', value: 2 },
  { key: 'lost_found_keep_days', br: 'BR-513', status: 'GD', value: 30 },
  { key: 'lost_found_notify_hours', br: 'BR-513', status: 'GD', value: 24 },
  // INV 26/10: list prices include VAT 8 %; the end date of the 8 % rate is pending the accountant (ESC-033).
  { key: 'vat_rate', br: 'BR-523', status: 'INV-2610+PL', value: 8 },
  { key: 'prices_include_vat', br: 'BR-523', status: 'INV-008+INV-2610', value: true },
  { key: 'business_entity_type', br: 'BR-524', status: 'INV-TT+PL', value: 'enterprise' },
  { key: 'bank_reconcile_alert_days', br: 'BR-527', status: 'GD', value: 2 },
  { key: 'no_deposit_max_lead_days', br: 'BR-527', status: 'INV-006+NGANH', value: 2 },
  { key: 'no_deposit_hold_until', br: 'BR-527', status: 'INV-006+NGANH', value: '18:00' },
  { key: 'cash_variance_requires_reason', br: 'BR-526', status: 'NGANH', value: true },
  {
    key: 'registration_deadline_vn',
    br: 'BR-602',
    status: 'PL',
    value: { before: '23:00', lateArrivalFrom: '23:00', lateArrivalDeadlineNextDay: '08:00' },
  },
  { key: 'registration_deadline_foreigner_hours', br: 'BR-603', status: 'PL', value: 12 },
  { key: 'registration_deadline_foreigner_mode', br: 'BR-603', status: 'PL', value: 'hours_only' },
  { key: 'registration_reminder_before_minutes', br: 'BR-603', status: 'NGANH', value: 120 },
  { key: 'registration_digest_times', br: 'BR-611', status: 'INV-010', value: ['22:00', '07:00'] },
  { key: 'visa_expiry_warning_days.long_stay', br: 'BR-605', status: 'GD', value: 30 },
  { key: 'visa_expiry_warning_days.short_stay', br: 'BR-605', status: 'GD', value: 14 },
  // BR v0.4.4 (INV 26/10 "3 months"): consenting guests' document images are kept 90 days after check-out;
  // v1.0 uses 30 = the current catalogue maximum (0003_parameter_bounds, 0–30), raised to 90 in v1.0.1 (DOM T2,
  // migration by BE-C, SEC review).
  {
    key: 'id_image_retention_days_after_checkout',
    br: 'BR-610',
    status: 'INV-2610+SEC',
    value: 30,
  },
  // BR v0.4.4: images of a declaration never confirmed – 7 days after the stay (catalogue maximum, bounds 1–7;
  // the group includes people who did not consent, so INV's "3 months" does not apply). Equal to the catalogue
  // default; written so the production value carries its source.
  { key: 'id_image_unconfirmed_max_days', br: 'BR-609', status: 'NGANH+SEC', value: 7 },
  // BR v0.4.4 (INV 26/10): pre-fill document profiles anonymised 3 months after the last check-out (security
  // parameter – SEC bounds 1–12 in OpenAPI x-security-parameters; catalogue default 12).
  { key: 'document_profile_retention_months', br: 'BR-610', status: 'INV-2610', value: 3 },
  { key: 'id_image_purge_max_hours', br: 'BR-609', status: 'PL+SEC', value: 24 },
  { key: 'minor_data_age_threshold', br: 'BR-612', status: 'PL', value: 16 },
  { key: 'stocktake_variance_approval_pct', br: 'BR-705', status: 'GD', value: 5 },
  { key: 'expiry_warning_days', br: 'BR-706', status: 'NGANH', value: 7 },
  { key: 'hk_self_inspection_enabled', br: 'BR-802', status: 'GD', value: false },
  { key: 'vacant_reinspect_days', br: 'BR-805', status: 'NGANH', value: 3 },
  { key: 'ooo_reopen_buffer_days', br: 'BR-804', status: 'NGANH', value: 1 },
  { key: 'room_status_reconcile_time', br: 'BR-806', status: 'NGANH', value: '07:00' },
  { key: 'daily_clean_status_time', br: 'BR-802', status: 'INV-008', value: '07:00' },
  { key: 'linen_change_every_nights', br: 'BR-807', status: 'INV-008', value: 3 },
  { key: 'long_stay_cleaning_window', br: 'BR-807', status: 'NGANH', value: ['09:00', '11:00'] },
  {
    key: 'extra_guest_kit_items',
    br: 'BR-812',
    status: 'INV-014+GD',
    value: [
      { item: 'blanket', qty: 1, stock: false },
      { item: 'bath_towel', qty: 1, stock: false },
      { item: 'face_towel', qty: 1, stock: false },
      { item: 'toothbrush', qty: 1, stock: true, stockCode: 'ban_chai' },
      { item: 'amenity_kit', qty: 1, stock: true, stockCode: 'bo_ve_sinh' },
    ],
  },
  { key: 'extra_guest_kit_due', br: 'BR-812', status: 'NGANH', value: 'booking_checkin_time' },
  { key: 'extra_guest_kit_midstay_due_minutes', br: 'BR-812', status: 'GD', value: 60 },
  {
    key: 'wo_sla',
    br: 'BR-809',
    status: 'GD',
    value: {
      high: { ackMinutes: 15, planHours: 2 },
      medium: { doneHours: 24 },
      low: { doneHours: 72 },
    },
  },
  { key: 'maintenance_due_warning_days', br: 'BR-810', status: 'NGANH', value: 7 },
  { key: 'guest_request_response_minutes', br: 'BR-811', status: 'GD', value: 10 },
  { key: 'front_desk_hours', br: 'BR-811', status: 'GD', value: ['07:00', '22:00'] },
  {
    key: 'short_stay_commission_pct',
    br: 'BR-903',
    status: 'INV-005',
    value: { collaborator: 8, staff: 3 },
  },
  { key: 'contingency_sheet_time', br: 'BR-961', status: 'NGANH', value: '06:30' },
  { key: 'offline_backfill_max_hours', br: 'BR-963', status: 'NGANH', value: 24 },
  { key: 'power_outage_escalate_hours', br: 'BR-964', status: 'GD', value: 4 },
  { key: 'rounding.ota_rate', br: 'BR-005', status: 'INV-004', value: 10000 },
  {
    key: 'max_open_holds_per_user',
    br: 'BR-302',
    status: 'INV-017',
    value: { collaborator: 3, sales_staff: 5 },
  },
  { key: 'staff_payment_backdate_max_hours', br: 'BR-527', status: 'NGANH', value: 24 },
  {
    key: 'lease_terms',
    br: 'BR-201',
    status: 'INV-005',
    value: [
      {
        months: 1,
        discountPct: 0,
        depositFactorVn: '0.5',
        depositFactorForeign: '1',
        billingCycleMonths: 1,
        commissionStaffPct: '3',
        commissionCollaboratorPct: '5',
      },
      {
        months: 3,
        discountPct: 5,
        depositFactorVn: '1',
        depositFactorForeign: '1',
        billingCycleMonths: 3,
        commissionStaffPct: '4',
        commissionCollaboratorPct: '6',
      },
      {
        months: 6,
        discountPct: 8,
        depositFactorVn: '1',
        depositFactorForeign: '1.5',
        billingCycleMonths: 3,
        commissionStaffPct: '5',
        commissionCollaboratorPct: '7',
      },
      {
        months: 12,
        discountPct: 12,
        depositFactorVn: '1',
        depositFactorForeign: '2',
        billingCycleMonths: 3,
        commissionStaffPct: '6',
        commissionCollaboratorPct: '8.3',
      },
      {
        months: 24,
        discountPct: 15,
        depositFactorVn: '2',
        depositFactorForeign: '2',
        billingCycleMonths: 3,
        commissionStaffPct: '4',
        commissionCollaboratorPct: '6',
      },
    ],
  },
  {
    key: 'utility_estimate',
    br: 'BR-205',
    status: 'GD',
    value: {
      vn: { kwhPerPerson: 120, m3PerPersonTenths: 35 },
      foreign: { kwhPerPerson: 170, m3PerPersonTenths: 40 },
    },
  },
  {
    key: 'damage_catalog',
    br: 'BR-512',
    status: 'GD',
    value: [
      { code: 'bath_towel', name: 'Khăn tắm', priceVnd: 150000 },
      { code: 'glass', name: 'Ly', priceVnd: 50000 },
      { code: 'remote', name: 'Remote', priceVnd: 200000 },
    ],
  },
];
