// Zalo channel guards (owner: INT). Pure functions, no network, no DB.
// Source: SEC review `rounds/round-02/reviews/landing-zalo-SEC.md`
//   - FB-R2-SEC-INT-10 (C-7): allowed variables per template AND per channel; forbidden data never rendered.
//   - FB-R2-SEC-INT-14 (C-9): integration_log rows for Zalo carry an allowlist of fields only.
// The core (NotificationService, R3 US-126) must call `checkTemplateVariables` before every send on
// `zalo_zns` / `zalo_oa` and map a violation to HTTP 422 without sending.
import type { NotificationChannel } from '../contracts/notification.js';

export type ZaloChannel = Extract<NotificationChannel, 'zalo_zns' | 'zalo_oa'>;

export const ZALO_TEMPLATE_KEYS = [
  'zns.booking_confirmed',
  'zns.arrival_reminder',
  'zns.checkout_reminder',
  'zns.payment_confirmed',
  'zns.payment_request',
  'zns.utility_bill',
  'zns.stay_feedback',
  'zns.direct_voucher',
] as const;
export type ZaloTemplateKey = (typeof ZALO_TEMPLATE_KEYS)[number];

/**
 * Variable names that must never reach Zalo (ZNS or OA), whatever the template.
 * Door codes, ID documents, birth dates, verification codes, guest tokens (C-6/C-7, SR-MSG-02, SR-LOCK-03).
 * `room_no` / `room_name` are listed because a unit number tells a stranger who sleeps where;
 * templates use the public room type name (`room_type_name`) instead.
 */
export const ZALO_FORBIDDEN_VARS: readonly string[] = [
  'door_code',
  'pin',
  'passcode',
  'verification_code',
  'otp',
  'auth_code',
  'id_number',
  'id_doc_no',
  'passport_no',
  'id_photo',
  'date_of_birth',
  'dob',
  'room_no',
  'room_name',
  'wifi_password',
  'token',
  'guest_token',
];

/** Money is allowed only on bill / payment templates. */
const MONEY_VARS = new Set(['amount', 'paid', 'balance', 'discount']);
const MONEY_TEMPLATES = new Set<ZaloTemplateKey>([
  'zns.payment_confirmed',
  'zns.payment_request',
  'zns.utility_bill',
  'zns.direct_voucher',
]);

/**
 * template_variable_policy(template_key, channel, allowed_vars[]) – kept in code (reviewed in PRs),
 * not in DB, so an OWN screen cannot widen it. `zalo_oa` (consultation message) uses the same lists.
 * Button URLs (guest-page link with notify token) are NOT template variables: the adapter builds them
 * in memory at send time and never stores them (FB-R2-SEC-INT-09).
 */
const ALLOWED: Record<ZaloTemplateKey, readonly string[]> = {
  'zns.booking_confirmed': [
    'customer_name',
    'booking_code',
    'room_type_name',
    'checkin_date',
    'checkout_date',
    'nights',
  ],
  'zns.arrival_reminder': [
    'customer_name',
    'booking_code',
    'checkin_date',
    'checkin_time',
    'address',
    'parking_note',
  ],
  'zns.checkout_reminder': ['customer_name', 'booking_code', 'checkout_date', 'checkout_time'],
  'zns.payment_confirmed': ['customer_name', 'bill_no', 'amount', 'paid', 'balance'],
  'zns.payment_request': ['customer_name', 'contract_code', 'period', 'amount', 'due_date'],
  'zns.utility_bill': [
    'customer_name',
    'contract_code',
    'period',
    'kwh',
    'm3',
    'amount',
    'due_date',
  ],
  'zns.stay_feedback': ['customer_name', 'booking_code', 'checkout_date'],
  'zns.direct_voucher': ['customer_name', 'voucher_code', 'discount', 'expiry_date'],
};

export function allowedTemplateVars(
  templateKey: ZaloTemplateKey,
  channel: ZaloChannel,
): readonly string[] {
  void channel; // same list for both Zalo channels today; the signature keeps the per-channel axis (C-7)
  return ALLOWED[templateKey];
}

export type TemplateVarViolation =
  | { kind: 'unknown_template'; templateKey: string }
  | { kind: 'forbidden'; key: string }
  | { kind: 'not_allowed'; key: string }
  | { kind: 'money_outside_bill'; key: string };

export type TemplateVarCheck =
  { ok: true } | { ok: false; code: 'TEMPLATE_VAR_REJECTED'; violations: TemplateVarViolation[] };

const isZaloTemplateKey = (k: string): k is ZaloTemplateKey =>
  (ZALO_TEMPLATE_KEYS as readonly string[]).includes(k);

/**
 * Checks parameter NAMES only (values are never inspected or echoed, so the result is safe to log).
 * Any violation => do not send; the core answers 422.
 */
export function checkTemplateVariables(
  templateKey: string,
  channel: ZaloChannel,
  params: Readonly<Record<string, unknown>>,
): TemplateVarCheck {
  if (!isZaloTemplateKey(templateKey)) {
    return {
      ok: false,
      code: 'TEMPLATE_VAR_REJECTED',
      violations: [{ kind: 'unknown_template', templateKey }],
    };
  }
  const allowed = new Set(allowedTemplateVars(templateKey, channel));
  const violations: TemplateVarViolation[] = [];
  for (const raw of Object.keys(params)) {
    const key = raw.toLowerCase();
    if (ZALO_FORBIDDEN_VARS.some((f) => key === f || key.includes(f))) {
      violations.push({ kind: 'forbidden', key: raw });
    } else if (MONEY_VARS.has(key) && !MONEY_TEMPLATES.has(templateKey)) {
      violations.push({ kind: 'money_outside_bill', key: raw });
    } else if (!allowed.has(raw)) {
      violations.push({ kind: 'not_allowed', key: raw });
    }
  }
  return violations.length
    ? { ok: false, code: 'TEMPLATE_VAR_REJECTED', violations }
    : { ok: true };
}

/** The only fields an integration_log row for Zalo may hold (FB-R2-SEC-INT-14 item 2). */
export interface ZaloIntegrationLogEntry {
  templateKey: string;
  channel: ZaloChannel;
  errorCode: string | null;
  providerMsgId: string | null;
  at: string;
  costUnits: number | null;
}

/**
 * Builds an integration_log row from whatever the adapter has at hand, copying allowlisted fields only.
 * Phone, template_data, access_token, guest token, request/response bodies are dropped by construction.
 */
export function toZaloIntegrationLog(
  src: Readonly<Record<string, unknown>> & { channel: ZaloChannel },
): ZaloIntegrationLogEntry {
  const str = (v: unknown): string | null =>
    typeof v === 'string' && v.length > 0 && v.length <= 128 ? v : null;
  const num = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
  return {
    templateKey: str(src.templateKey) ?? 'unknown',
    channel: src.channel,
    errorCode: str(src.errorCode),
    providerMsgId: str(src.providerMsgId),
    at: str(src.at) ?? 'unknown',
    costUnits: num(src.costUnits),
  };
}
