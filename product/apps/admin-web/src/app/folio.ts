import type { FolioLine } from '@ottimo/api-client';
import { formatLocalDate, hasKey, type Args } from '@ottimo/i18n';

type T = (key: string, args?: Args) => string;
/** ARC "nhãn dòng bill dịch được" (s3-ARC, DOM FE-03): `labelKey` (`bill.line.*`) + `labelParams`. */
type Labeled = FolioLine & { labelKey?: string; labelParams?: Record<string, string | number> };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/** FOC / special-discount reason codes → `foc.r_*` (approvals, bill `{reason}`). */
export const FOC_REASON: Record<string, string> = {
  regular_vip: 'foc.r_regular',
  room_ready_no_impact: 'foc.r_room_ready',
  service_recovery: 'foc.r_recovery',
  long_stay_guest: 'foc.r_long',
  other: 'foc.r_other',
};

/** Approval request type → label (Cần duyệt, nhật ký tiền `approval.approved`). */
export const APPROVAL_TYPE: Record<string, string> = {
  foc: 'foc.kind_foc',
  special_discount: 'foc.kind_discount',
  refund: 'refund.title',
  checkin_room_not_ready: 'approval.type.room_not_ready',
  late_checkout_conflict: 'approval.type.late_checkout',
  no_show_restore: 'approval.type.no_show_restore',
};

/**
 * UXD s3 E.1: keys with an optional param have a variant – the server sends the param → variant,
 * otherwise the base key, so a bare `{room}` is never printed.
 */
const VARIANT: Record<string, [param: string, key: string]> = {
  'bill.line.room_night': ['room', 'bill.line.room_night_room'],
  'bill.line.extra_night': ['room', 'bill.line.extra_night_room'],
  'bill.line.extra_person': ['count', 'bill.line.extra_person_count'],
  'bill.line.early_departure_fee': ['noticeDays', 'bill.line.early_departure_fee_notice'],
  'bill.line.foc': ['reason', 'bill.line.foc_reason'],
  'bill.line.discount': ['reason', 'bill.line.discount_reason'],
};

/**
 * Text of a folio / bill line in the language of `t`: the server label key (closed list, BE
 * `folio/public/line-labels.ts`) with its params – dates dd/MM, `{reason}` translated through
 * `foc.r_*`. Without a known key: the room night from `serviceDate`, otherwise the server
 * `description` (technical – shown as is so a missing key is visible in QA).
 */
/**
 * UXR P-32: one minus sign for money on the desk – the typographic "−" (U+2212) the folio uses for paid amounts,
 * never the hyphen `Intl` writes for a negative number (a FOC / reversal line).
 */
export const signed = (format: (n: number) => string, n: number): string =>
  n < 0 ? `−${format(-n)}` : format(n);

export function lineLabel(t: T, line: FolioLine): string {
  const l = line as Labeled;
  if (l.labelKey && hasKey(l.labelKey)) {
    const params: Args = {};
    for (const [k, v] of Object.entries(l.labelParams ?? {}))
      params[k] = typeof v === 'string' && isoDate.test(v) ? formatLocalDate(v).slice(0, 5) : v;
    if (params.reason !== undefined) {
      const reasonKey = FOC_REASON[String(params.reason)];
      if (reasonKey) params.reason = t(reasonKey);
      else delete params.reason;
    }
    const variant = VARIANT[l.labelKey];
    const key =
      variant && params[variant[0]] !== undefined && params[variant[0]] !== '' && hasKey(variant[1])
        ? variant[1]
        : l.labelKey;
    return t(key, params);
  }
  if (line.category === 'room' && line.serviceDate)
    return t('bill.line.room_night', { date: formatLocalDate(line.serviceDate).slice(0, 5) });
  return line.description;
}

/** True when the line has a client-translatable label (the bill can print it in VI and EN). */
export function hasLineKey(line: FolioLine): boolean {
  const key = (line as Labeled).labelKey;
  return !!key && hasKey(key);
}

/** FE-S3-10/11: refund destination names – `original_method` is not "card". */
export function methodText(t: T, method: string): string {
  return method === 'cash'
    ? t('pay.cash')
    : method === 'bank_transfer'
      ? t('pay.bank_transfer')
      : t('refund.method.original_method');
}
