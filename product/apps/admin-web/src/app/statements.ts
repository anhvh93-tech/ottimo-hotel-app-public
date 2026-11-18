// FB-INV-012 – Monthly statements for long-stay guests (ARC contract `rounds/round-05/fb-inv-012/contract.md` §5,
// OpenAPI 0.3.14). Every shape comes from the generated `@ottimo/api-client` and the calls live in its
// `endpoints.ts` (`api.listMeterReadings`, `api.getBillingPeriod`…) – ARC-FE-189-05. The names below are the Desk's
// short aliases of those generated types; this file keeps only Desk helpers (months, meter parsing, usage preview,
// tones). INV 17/11: the opening reading is its own reading (`period_start` of the month opened, or `checkin` /
// `room_change_in`), typed by staff; the server answers the previous closing on it (reference only) and the gap
// (vacancy use, never billed). Billed usage = closing − opening, on the closing reading.
import type {
  BillingAlertLevel,
  BillingCandidate as ApiBillingCandidate,
  BillingCandidateRoom,
  BillingPeriod as ApiBillingPeriod,
  BillingPeriodAction,
  BillingPeriodLine,
  BillingPeriodPaymentCreate,
  BillingPeriodTotals,
  BillingWarning,
  DateRange,
  MeterReadingKind,
  MeterValueInput,
  MonthlyStatementStatus,
} from '@ottimo/api-client';

export type {
  BillingPeriodPaymentResult,
  BillingPeriodPrint,
  BillingPeriodSummary,
  BillingPeriodVoided,
  MeterException,
  MeterPair,
  MeterReading,
  MeterValue,
  MissingMeterReading,
  RecordMeterReadingBody,
} from '@ottimo/api-client';

export type BillingPeriod = ApiBillingPeriod;
export type BillingCandidate = ApiBillingCandidate;
export type StatementStatus = MonthlyStatementStatus;
export type StatementKind = ApiBillingPeriod['kind'];
/** BR-LS-02: day 05 due today, from 06 overdue, +3 days alert (red for manager), +10 days escalate. */
export type AlertLevel = BillingAlertLevel;
export type StatementAction = BillingPeriodAction;
export type MeterType = 'electricity' | 'water';
/** Opening: `checkin`, `period_start`, `room_change_in`. Closing: `period_end`, `room_change_out`, `checkout`. */
export type ReadingKind = MeterReadingKind;
export const OPENING_KINDS: readonly ReadingKind[] = ['checkin', 'period_start', 'room_change_in'];
export const isOpeningKind = (k: ReadingKind) => OPENING_KINDS.includes(k);
export type Period = DateRange;
export type MeterInput = MeterValueInput;
export type ReadingStatus = ApiBillingCandidate['readingStatus'];
/** BE-190-02/12 `rooms[]`: readings of the utility period, the next opening, and which reading opens the month. */
export type CandidateRoom = BillingCandidateRoom;
export type StatementLine = BillingPeriodLine;
export type StatementTotals = BillingPeriodTotals;
export type RecordStatementPaymentBody = BillingPeriodPaymentCreate;

export const KNOWN_WARNINGS = [
  'METER_ANOMALY',
  'RENT_ALREADY_POSTED',
  'SERVICE_LINE_ON_OTHER_STATEMENT',
  'PHOTO_WAIVED',
  'OPENING_BELOW_PREVIOUS_CLOSING',
  'READING_LATE',
] as const;
export type KnownWarningCode = (typeof KNOWN_WARNINGS)[number];

/**
 * OpenAPI `BillingWarning` = `code` + open fields (see its description); an unknown code is shown generically and
 * still confirmed. The fields the Desk reads, read with these types.
 */
export type StatementWarning = BillingWarning & {
  roomNo?: string;
  meter?: MeterType;
  consumption?: number;
  threshold?: number;
  opening?: number;
  previousClosing?: number;
};

/** `YYYY-MM` of a `YYYY-MM-DD` day. */
export const monthOf = (day: string) => day.slice(0, 7);

/** `YYYY-MM` shifted by `n` months. */
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Last day (`YYYY-MM-DD`) of a `YYYY-MM` month. */
export function lastDayOf(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m, 0));
  return `${month}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Month whose end-of-month readings the desk is most likely entering on `day`: the current month on its last day,
 * otherwise the month before (day 01 still closes it, BR-LS-10).
 */
export const readingMonthOn = (day: string) =>
  day === lastDayOf(monthOf(day)) ? monthOf(day) : shiftMonth(monthOf(day), -1);

/**
 * Typed meter value cut to the unit of the server (BR-LS-11, ARC-FE-189-08): kWh whole, m³ one decimal; the extra
 * digits are DROPPED on the typed text (no float maths), so the preview matches the server.
 */
export function parseMeter(raw: string, type: MeterType): number | null {
  const s = raw.trim().replace(',', '.');
  const m = /^(\d+)(?:\.(\d*))?$/.exec(s);
  if (!m) return null;
  if (type === 'electricity') return Number(m[1]);
  return Number(`${m[1]}.${(m[2] ?? '').slice(0, 1) || '0'}`);
}

/**
 * Billed usage PREVIEW of one meter (BR-LS-11/12): closing − opening; meter replaced = (old final − opening) +
 * (closing − new start); rollover = (max + 1 − opening) + closing. Once saved the desk shows the server's
 * `consumption`, never this number. The exception fields are optional in the schema; the server refuses an
 * exception without them (VALIDATION_FAILED), so a missing one counts as 0 here.
 */
export function meterUsage(opening: number, m: MeterInput, type: MeterType): number {
  const e = m.exception;
  const raw =
    e?.type === 'replaced'
      ? (e.oldFinal ?? 0) - opening + (m.value - (e.newStart ?? 0))
      : e?.type === 'rollover'
        ? (e.maxValue ?? 0) + 1 - opening + m.value
        : m.value - opening;
  return type === 'water' ? Math.round(raw * 10) / 10 : Math.round(raw);
}

/** Tone of a statement row/chip – only the 80/15/5 palette (contract §6.1: Earth Brown for overdue, no extra red). */
export function statusTone(
  status: StatementStatus,
  alert: AlertLevel | null | undefined,
): { tone: 'neutral' | 'oak' | 'ink' | 'long'; className?: string } {
  if (status === 'paid') return { tone: 'long' };
  if (status === 'void') return { tone: 'neutral' };
  if (alert && alert !== 'due_today')
    return { tone: 'neutral', className: `stmt-overdue${alert === 'overdue' ? '' : ' strong'}` };
  if (alert === 'due_today') return { tone: 'oak' };
  if (status === 'draft') return { tone: 'neutral' };
  return { tone: 'ink' };
}
