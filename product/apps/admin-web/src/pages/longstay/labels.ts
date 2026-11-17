import { translate, type Args, type Locale } from '@ottimo/i18n';
import type {
  BillingPeriod,
  StatementLine,
  StatementStatus,
  StatementWarning,
} from '../../app/statements';

type T = (key: string, args?: Args) => string;

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_EN_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** A calendar day (`YYYY-MM-DD`) as the guest reads it: EN "05 Dec 2026", VI "05/12/2026". */
export function dayText(locale: Locale, day: string | null | undefined): string {
  if (!day) return '';
  const [y, m, d] = day.split('-');
  return locale === 'en' ? `${d} ${MONTHS_EN[Number(m) - 1]} ${y}` : `${d}/${m}/${y}`;
}

/** A day without the year (the sheet header carries it): EN "05 Dec", VI "05/12". */
export function shortDay(locale: Locale, day: string): string {
  const [, m, d] = day.split('-');
  return locale === 'en' ? `${d} ${MONTHS_EN[Number(m) - 1]}` : `${d}/${m}`;
}

/** A month (`YYYY-MM`): EN "December 2026", VI "12/2026". */
export function monthText(locale: Locale, month: string): string {
  const [y, m] = month.split('-');
  return locale === 'en' ? `${MONTHS_EN_LONG[Number(m) - 1]} ${y}` : `${m}/${y}`;
}

/** Group digits like the Desk (vi-VN: 8.500.000), for both languages on the sheet. */
export const num = (n: number, digits = 0) =>
  new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

/** Signed amount: −690. */
export const signedNum = (n: number) => (n < 0 ? `−${num(-n)}` : num(n));

/** Meter value: electricity whole kWh, water one decimal (BR-LS-11). */
export const meterNum = (n: number, unit: StatementLine['unit'] | 'kwh' | 'm3') =>
  num(n, unit === 'm3' ? 1 : 0);

/** Label of a statement line in one language (`labelKey` + params; dates formatted for that language). */
export function lineText(locale: Locale, line: StatementLine): string {
  const params: Args = {};
  for (const [k, v] of Object.entries(line.labelParams ?? {}))
    params[k] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? shortDay(locale, v) : v;
  // The prior-period reason is internal text: never on the line label the guest reads.
  delete params.reason;
  const label = translate(locale, line.labelKey, params);
  return line.kind === 'service' && line.serviceDate
    ? `${label} · ${shortDay(locale, line.serviceDate)}`
    : label;
}

export const STATUS_KEY: Record<StatementStatus, string> = {
  draft: 'stmt.status.draft',
  issued: 'stmt.status.issued',
  partially_paid: 'stmt.status.partially_paid',
  paid: 'stmt.status.paid',
  void: 'stmt.status.void',
};

export function statusText(t: T, p: Pick<BillingPeriod, 'status' | 'alertLevel' | 'overdueDays'>) {
  if (p.alertLevel === 'due_today') return t('stmt.alert.due_today');
  if (p.alertLevel) return t('stmt.alert.overdue_days', { days: p.overdueDays });
  return t(STATUS_KEY[p.status]);
}

export function warningText(t: T, w: StatementWarning): string {
  const meter = w.meter ? t(`stmt.meter.${w.meter}`) : '';
  return t(`stmt.warning.${w.code}`, {
    room: w.roomNo ?? '',
    meter,
    consumption: w.consumption ?? '',
    threshold: w.threshold ?? '',
  });
}
