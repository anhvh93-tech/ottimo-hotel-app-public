/**
 * Pure rules of the registration module (no I/O) – unit-tested with the BR examples (coding-standards 10.2).
 *
 * - validateDocumentInput  EP06 2.2 field table (normalise, then check; all errors at once).
 * - computeChecks          EP06 3.1 / BR-605 / BR-613 (c): pass | fail | unverified | not_applicable,
 *                          `blocking` for the (c) items; manual results of the desk are kept.
 * - registrationDeadline   BR-602 (VN, wall-clock date of the actual arrival) / BR-603 (foreigner: +N
 *                          hours, `hours_only` | `earlier_of`); never the business date (BR-010).
 * - nextStatus             SM-05 K2/K3/K4/K13 from the document counts.
 */
import type { DocType } from '../../../db/schema';
import { PORTAL_VALUE_VI, type PortalValueKey } from '../../../generated/portal-copy';
import { countryNameVi } from './countries';
import type { FieldError } from '../../../shared/problem';
import { containsCardNumber } from '../../../shared/validation';
import { type LocalDate, addDays, atLocal, localDate, zonedParts } from '../../../shared/time';

export const CHECK_CODES = [
  'name_match',
  'passport_valid_through_departure',
  'passport_valid_at_arrival',
  'visa_valid_through_departure',
  'visa_valid_at_arrival',
  'entry_record_present',
  'stay_within_visa',
  'party_count',
] as const;
export type CheckCode = (typeof CHECK_CODES)[number];
export type CheckResult = 'pass' | 'fail' | 'unverified' | 'not_applicable';

/** BR-613 (c): a final "fail" blocks the door code (and B9 in R2 – E03-01). */
export const BLOCKING_CODES: readonly CheckCode[] = [
  'passport_valid_at_arrival',
  'visa_valid_at_arrival',
  'entry_record_present',
];

export interface StoredCheck {
  code: CheckCode;
  result: CheckResult;
  blocking: boolean;
  manualResult: 'pass' | 'fail' | null;
  note: string | null;
  handledBy: string | null;
  handledAt: string | null;
}

export const VISA_KINDS = ['visa', 'visa_exempt', 'temp_residence_card'] as const;
export type VisaKind = (typeof VISA_KINDS)[number];

/** Clear values of one document (only in memory, encrypted before they reach the DB). */
export interface DocumentFields {
  docType: DocType;
  fullNameOnDoc: string;
  docNumber: string;
  dateOfBirth: LocalDate | null;
  gender: 'male' | 'female' | 'other' | null;
  nationalityCode: string;
  passportIssueDate: LocalDate | null;
  passportExpiryDate: LocalDate | null;
  issuingPlace: string | null;
  visaKind: VisaKind | null;
  visaNumber: string | null;
  visaValidUntil: LocalDate | null;
  entryDate: LocalDate | null;
  entryPort: string | null;
  entryPurpose: string | null;
  noEntryRecord: boolean;
  address: string | null;
}

export interface DocumentInput extends DocumentFields {
  partyMemberId: string | null;
  isMain: boolean | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DOC_TYPES: readonly DocType[] = ['cccd', 'passport', 'child_personal_id', 'other'];
const GENDERS = ['male', 'female', 'other'] as const;

function validDate(v: string): boolean {
  if (!DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Foreigner = passport of another nationality (EP06 0.1); `other` follows its nationality. */
export function isForeigner(docType: DocType, nationalityCode: string): boolean {
  if (docType === 'cccd' || docType === 'child_personal_id') return false;
  return nationalityCode !== 'VNM';
}

/** Document number as stored/compared: no spaces, upper case. */
export function normalizeDocNumber(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/** EP06 2.2. `today` = property date (no future dates). Throws nothing – returns errors. */
export function validateDocumentInput(
  raw: unknown,
  today: LocalDate,
): { value: DocumentInput | null; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const b =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const str = (k: string): string | null => {
    const v = b[k];
    if (v === undefined || v === null) return null;
    if (typeof v !== 'string') {
      errors.push({ field: k, code: 'VALIDATION_FAILED' });
      return null;
    }
    const t = v.trim();
    return t === '' ? null : t;
  };
  const date = (k: string): LocalDate | null => {
    const v = str(k);
    if (v === null) return null;
    if (!validDate(v)) {
      errors.push({ field: k, code: 'DATE_INVALID' });
      return null;
    }
    return v;
  };
  const text = (k: string, max: number): string | null => {
    const v = str(k);
    if (v === null) return null;
    if (v.length > max) errors.push({ field: k, code: 'TOO_LONG' });
    else if (containsCardNumber(v)) errors.push({ field: k, code: 'CARD_NUMBER_DETECTED' });
    return v;
  };

  const partyMemberId = str('partyMemberId');
  if (partyMemberId !== null && !UUID.test(partyMemberId)) {
    errors.push({ field: 'partyMemberId', code: 'NOT_IN_LIST' });
  }
  const docTypeRaw = str('docType');
  const docType = DOC_TYPES.find((d) => d === docTypeRaw) ?? null;
  if (!docType) errors.push({ field: 'docType', code: docTypeRaw ? 'NOT_IN_LIST' : 'REQUIRED' });
  const isMainRaw = b.isMain;
  if (isMainRaw !== undefined && typeof isMainRaw !== 'boolean') {
    errors.push({ field: 'isMain', code: 'VALIDATION_FAILED' });
  }

  const fullName = str('fullNameOnDoc');
  if (!fullName) errors.push({ field: 'fullNameOnDoc', code: 'REQUIRED' });
  else if (fullName.length > 100 || /[\d<>{}[\]\\|@#$%^*=+_~`]/.test(fullName)) {
    errors.push({ field: 'fullNameOnDoc', code: 'NAME_INVALID' });
  }

  const numberRaw = str('docNumber');
  const docNumber = numberRaw ? normalizeDocNumber(numberRaw) : null;
  if (!docNumber) errors.push({ field: 'docNumber', code: 'REQUIRED' });
  else if (docType) {
    const ok =
      docType === 'cccd' || docType === 'child_personal_id'
        ? /^[0-9]{12}$/.test(docNumber)
        : docType === 'passport'
          ? /^[A-Z0-9]{6,12}$/.test(docNumber)
          : /^[A-Z0-9-]{3,30}$/.test(docNumber);
    if (!ok) errors.push({ field: 'docNumber', code: 'DOC_NUMBER_INVALID' });
  }

  const dob = date('dateOfBirth');
  if (
    dob === null &&
    docType &&
    docType !== 'other' &&
    !errors.some((e) => e.field === 'dateOfBirth')
  ) {
    errors.push({ field: 'dateOfBirth', code: 'REQUIRED' });
  }
  if (dob && dob > today) errors.push({ field: 'dateOfBirth', code: 'DOB_FUTURE' });
  if (dob && Number(today.slice(0, 4)) - Number(dob.slice(0, 4)) > 120) {
    errors.push({ field: 'dateOfBirth', code: 'DOB_INVALID' });
  }

  const genderRaw = str('gender');
  const gender = GENDERS.find((g) => g === genderRaw) ?? null;
  if (genderRaw && !gender) errors.push({ field: 'gender', code: 'NOT_IN_LIST' });

  let nationality = str('nationalityCode');
  if (nationality !== null && !/^[A-Z]{3}$/.test(nationality)) {
    errors.push({ field: 'nationalityCode', code: 'NOT_IN_LIST' });
  }
  if (docType === 'cccd' || docType === 'child_personal_id') {
    if (nationality !== null && nationality !== 'VNM') {
      errors.push({ field: 'nationalityCode', code: 'NOT_IN_LIST' });
    }
    nationality = 'VNM';
  }
  if (docType === 'passport' && nationality === null) {
    errors.push({ field: 'nationalityCode', code: 'REQUIRED' });
  }

  const passportIssueDate = date('passportIssueDate');
  const passportExpiryDate = date('passportExpiryDate');
  if (passportIssueDate && passportIssueDate > today) {
    errors.push({ field: 'passportIssueDate', code: 'DATE_INVALID' });
  }
  if (passportIssueDate && dob && passportIssueDate <= dob) {
    errors.push({ field: 'passportIssueDate', code: 'DATE_INVALID' });
  }
  if (
    docType === 'passport' &&
    !passportExpiryDate &&
    !errors.some((e) => e.field === 'passportExpiryDate')
  ) {
    errors.push({ field: 'passportExpiryDate', code: 'REQUIRED' });
  }
  if (passportExpiryDate && passportIssueDate && passportExpiryDate <= passportIssueDate) {
    errors.push({ field: 'passportExpiryDate', code: 'DATE_ORDER' });
  }
  const issuingPlace = text('issuingPlace', 100);

  const foreign = docType ? isForeigner(docType, nationality ?? 'VNM') : false;
  const visaKindRaw = str('visaKind');
  const visaKind = VISA_KINDS.find((k) => k === visaKindRaw) ?? null;
  if (visaKindRaw && !visaKind) errors.push({ field: 'visaKind', code: 'NOT_IN_LIST' });
  const visaNumber = str('visaNumber');
  if (visaNumber && !/^[A-Za-z0-9]{3,20}$/.test(visaNumber)) {
    errors.push({ field: 'visaNumber', code: 'VALIDATION_FAILED' });
  }
  const visaValidUntil = date('visaValidUntil');
  const entryDate = date('entryDate');
  const noEntryRaw = b.noEntryRecord;
  if (noEntryRaw !== undefined && typeof noEntryRaw !== 'boolean') {
    errors.push({ field: 'noEntryRecord', code: 'VALIDATION_FAILED' });
  }
  const noEntryRecord = noEntryRaw === true;
  if (foreign) {
    if (!visaKind && !visaKindRaw) errors.push({ field: 'visaKind', code: 'REQUIRED' });
    if (
      (visaKind === 'visa' || visaKind === 'temp_residence_card') &&
      !visaNumber &&
      !errors.some((e) => e.field === 'visaNumber')
    ) {
      errors.push({ field: 'visaNumber', code: 'REQUIRED' });
    }
    if (!visaValidUntil && !errors.some((e) => e.field === 'visaValidUntil')) {
      errors.push({ field: 'visaValidUntil', code: 'REQUIRED' });
    }
  } else if (visaKind || visaNumber || visaValidUntil || entryDate || noEntryRecord) {
    // Visa/entry items only exist for foreign guests (EP06 2.2 "không áp cho khách VN").
    errors.push({ field: 'visaKind', code: 'NOT_IN_LIST' });
  }
  if (entryDate && entryDate > today)
    errors.push({ field: 'entryDate', code: 'ENTRY_DATE_FUTURE' });
  if (entryDate && dob && entryDate < dob)
    errors.push({ field: 'entryDate', code: 'DATE_INVALID' });
  if (visaValidUntil && entryDate && visaValidUntil < entryDate) {
    errors.push({ field: 'visaValidUntil', code: 'DATE_ORDER' });
  }
  if (noEntryRecord && entryDate)
    errors.push({ field: 'noEntryRecord', code: 'VALIDATION_FAILED' });
  const entryPort = text('entryPort', 100);
  const entryPurpose = text('entryPurpose', 100);
  const address = text('address', 300);

  if (errors.length > 0 || !docType || !fullName || !docNumber) return { value: null, errors };
  return {
    value: {
      partyMemberId,
      isMain: typeof isMainRaw === 'boolean' ? isMainRaw : null,
      docType,
      fullNameOnDoc: fullName,
      docNumber,
      dateOfBirth: dob,
      gender,
      nationalityCode: nationality ?? 'VNM',
      passportIssueDate,
      passportExpiryDate,
      issuingPlace,
      visaKind,
      visaNumber,
      visaValidUntil,
      entryDate,
      entryPort,
      entryPurpose,
      noEntryRecord,
      address,
    },
    errors,
  };
}

/** Name for comparison: no diacritics (đ → d), upper case, single spaces, words. */
export function nameWords(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** EP06 3.1 name_match (DOM G-5): every word of the booking name is on the document, any order. */
export function nameMatch(bookingName: string | null, docName: string): CheckResult {
  if (!bookingName) return 'unverified';
  const want = nameWords(bookingName);
  if (want.length < 2) return 'unverified';
  const have = new Set(nameWords(docName));
  return want.every((w) => have.has(w)) ? 'pass' : 'fail';
}

/** Age in whole years at `on` (BR-612 threshold – age at the arrival date). */
export function ageAt(dob: LocalDate, on: LocalDate): number {
  const [y1, m1, d1] = dob.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = on.split('-').map(Number) as [number, number, number];
  let age = y2 - y1;
  if (m2 < m1 || (m2 === m1 && d2 < d1)) age--;
  return age;
}

export interface CheckContext {
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** Name on the booking for this person (booker for the main document), null = not linked. */
  bookingName: string | null;
  /** Registration level: people with complete documents / people to declare. */
  submittedCount: number;
  requiredCount: number;
  isMain: boolean;
}

/** EP06 3.1 – automatic checks; `previous` keeps the desk's manual result/note while still relevant. */
export function computeChecks(
  doc: Pick<
    DocumentFields,
    | 'docType'
    | 'fullNameOnDoc'
    | 'nationalityCode'
    | 'passportExpiryDate'
    | 'visaKind'
    | 'visaValidUntil'
    | 'entryDate'
    | 'noEntryRecord'
  >,
  ctx: CheckContext,
  previous: readonly StoredCheck[] = [],
): StoredCheck[] {
  const foreign = isForeigner(doc.docType, doc.nationalityCode);
  const a = ctx.arrivalDate;
  const dep = ctx.departureDate;
  const results: Array<[CheckCode, CheckResult]> = [];
  results.push(['name_match', nameMatch(ctx.bookingName, doc.fullNameOnDoc)]);
  if (foreign) {
    const exp = doc.passportExpiryDate;
    const visa = doc.visaKind && doc.visaValidUntil ? doc.visaValidUntil : null;
    results.push([
      'passport_valid_through_departure',
      !exp ? 'unverified' : exp > dep ? 'pass' : 'fail',
    ]);
    results.push(['passport_valid_at_arrival', !exp ? 'unverified' : exp >= a ? 'pass' : 'fail']);
    results.push([
      'visa_valid_through_departure',
      !visa ? 'unverified' : visa >= dep ? 'pass' : 'fail',
    ]);
    results.push(['visa_valid_at_arrival', !visa ? 'unverified' : visa >= a ? 'pass' : 'fail']);
    results.push([
      'entry_record_present',
      doc.entryDate ? 'pass' : doc.noEntryRecord ? 'fail' : 'unverified',
    ]);
    results.push(['stay_within_visa', !visa ? 'unverified' : dep <= visa ? 'pass' : 'fail']);
  } else {
    for (const c of [
      'passport_valid_through_departure',
      'passport_valid_at_arrival',
      'visa_valid_through_departure',
      'visa_valid_at_arrival',
      'entry_record_present',
      'stay_within_visa',
    ] as const) {
      results.push([c, 'not_applicable']);
    }
  }
  results.push([
    'party_count',
    !ctx.isMain ? 'not_applicable' : ctx.submittedCount >= ctx.requiredCount ? 'pass' : 'fail',
  ]);

  return results.map(([code, result]) => {
    const prev = previous.find((p) => p.code === code);
    const keep = prev && prev.result === result && (result === 'fail' || result === 'unverified');
    const manualResult = keep ? prev.manualResult : null;
    return {
      code,
      result,
      blocking: isBlocking(code, result, manualResult),
      manualResult,
      note: keep ? prev.note : null,
      handledBy: keep ? prev.handledBy : null,
      handledAt: keep ? prev.handledAt : null,
    };
  });
}

/**
 * BR-613 (c) + ARC assumption 0.3.3: fail → blocking; unverified → blocking until the desk records
 * manualResult = pass; manual fail → blocking.
 */
export function isBlocking(
  code: CheckCode,
  result: CheckResult,
  manual: 'pass' | 'fail' | null,
): boolean {
  if (!BLOCKING_CODES.includes(code)) return false;
  if (result === 'pass' || result === 'not_applicable') return false;
  if (result === 'unverified') return manual !== 'pass';
  return true;
}

export interface VnDeadlineRule {
  before: string;
  lateArrivalFrom: string;
  lateArrivalDeadlineNextDay: string;
}

export type DeadlineBasis = 'vn_2300' | 'vn_0800_next' | 'foreigner_hours' | 'foreigner_earlier_of';

export interface DeadlineParams {
  vn: VnDeadlineRule;
  foreignerHours: number;
  foreignerMode: 'hours_only' | 'earlier_of';
}

function hhmm(instant: Date, tz: string): string {
  const p = zonedParts(instant, tz);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

/** BR-602: wall-clock date of the actual arrival (not the business date – BR-010). */
export function vnDeadline(
  arrivedAt: Date,
  tz: string,
  rule: VnDeadlineRule,
): { at: Date; basis: DeadlineBasis } {
  const day = localDate(arrivedAt, tz);
  if (hhmm(arrivedAt, tz) < rule.lateArrivalFrom) {
    return { at: atLocal(day, rule.before, tz), basis: 'vn_2300' };
  }
  return {
    at: atLocal(addDays(day, 1), rule.lateArrivalDeadlineNextDay, tz),
    basis: 'vn_0800_next',
  };
}

/** BR-603: actual arrival + N hours; `earlier_of` also caps at the VN evening mark when arrival is before it. */
export function foreignerDeadline(
  arrivedAt: Date,
  tz: string,
  p: DeadlineParams,
): { at: Date; basis: DeadlineBasis } {
  const plus = new Date(arrivedAt.getTime() + p.foreignerHours * 3_600_000);
  if (p.foreignerMode === 'earlier_of' && hhmm(arrivedAt, tz) < p.vn.lateArrivalFrom) {
    const evening = atLocal(localDate(arrivedAt, tz), p.vn.before, tz);
    if (evening.getTime() < plus.getTime()) return { at: evening, basis: 'foreigner_earlier_of' };
  }
  return { at: plus, basis: 'foreigner_hours' };
}

/** Deadline of the declaration (mixed/unknown = the earlier of the blocks still to do – K6). */
export function registrationDeadline(
  arrivedAt: Date,
  tz: string,
  kind: 'vn_citizen_stay' | 'foreigner_temp_residence' | 'mixed' | null,
  p: DeadlineParams,
): { at: Date; basis: DeadlineBasis } {
  const vn = vnDeadline(arrivedAt, tz, p.vn);
  const fo = foreignerDeadline(arrivedAt, tz, p);
  if (kind === 'vn_citizen_stay') return vn;
  if (kind === 'foreigner_temp_residence') return fo;
  return vn.at.getTime() <= fo.at.getTime() ? vn : fo;
}

export type RegistrationStatusValue =
  | 'none'
  | 'pre'
  | 'partial'
  | 'review'
  | 'scanned'
  | 'sent'
  | 'confirmed'
  | 'needs_update'
  | 'updated'
  | 'void';

/** SM-05 K2/K3/K4/K13: status of an open declaration from its counts (later states unchanged). */
export function nextStatus(
  current: RegistrationStatusValue,
  counts: { submitted: number; required: number; guestUploads: number },
): RegistrationStatusValue {
  if (!['none', 'pre', 'partial', 'review'].includes(current)) return current;
  if (counts.submitted === 0) return counts.guestUploads > 0 ? 'pre' : 'none';
  return counts.submitted >= counts.required ? 'review' : 'partial';
}

export type DeadlineLabel =
  'at_checkin' | 'before_deadline_today' | 'overdue' | 'done' | 'needs_update';

export function deadlineLabel(
  status: RegistrationStatusValue,
  deadlineAt: Date | null,
  checkedIn: boolean,
  now: Date,
): DeadlineLabel {
  if (status === 'needs_update') return 'needs_update';
  if (['sent', 'confirmed', 'updated', 'void'].includes(status)) return 'done';
  if (!checkedIn || !deadlineAt) return 'at_checkin';
  return now.getTime() > deadlineAt.getTime() ? 'overdue' : 'before_deadline_today';
}

/** Free-text note of a check (3–500, V-09) – returns the field error code or null. */
export function checkNoteError(note: unknown): string | null {
  if (typeof note !== 'string') return 'CHECK_NOTE_REQUIRED';
  const t = note.trim();
  if (t.length < 3 || t.length > 500) return 'CHECK_NOTE_REQUIRED';
  if (containsCardNumber(t)) return 'CARD_NUMBER_DETECTED';
  return null;
}

/** Tokens of a note that could be a document number (compared by blind index, never stored). */
/**
 * Windows of a free-text note that could be one of the declaration's document numbers (SEC
 * FB-R2-SEC-BE-48): separators `[\s.\-/]` removed first ("079 123.456-789" → one run), then every window of
 * 3…30 characters that ENDS with a known last-4 (cheap pre-filter – only those are HMAC-compared).
 * The values are compared by blind index only, never stored.
 */
export function docNumberCandidates(note: string, last4s: ReadonlySet<string>): string[] {
  const flat = note.toUpperCase().replace(/[\s.\-/]+/g, '');
  const runs = flat.match(/[A-Z0-9]{3,}/g) ?? [];
  const out = new Set<string>();
  for (const run of runs) {
    for (let end = 4; end <= run.length; end++) {
      if (!last4s.has(run.slice(end - 4, end))) continue;
      for (let len = 3; len <= Math.min(30, end); len++) out.add(run.slice(end - len, end));
    }
  }
  return [...out];
}

/**
 * B-15 rule applied to staff notes that may be shown widely (check notes, portal rejection reason – SEC
 * BE-48): six or more digits in a row once spaces, dots and dashes are removed → SENSITIVE_DATA_DETECTED
 * (document numbers, door codes, phone numbers never belong in a note).
 */
export function hasLongDigitRun(text: string): boolean {
  return /\d{6,}/.test(text.replace(/[\s.-]+/g, ''));
}

/** BR-605 visa reminder: validUntil − visa_expiry_warning_days.<stay type>. */
export function visaAlertOn(
  visaValidUntil: LocalDate | null,
  warningDays: number,
): LocalDate | null {
  return visaValidUntil ? addDays(visaValidUntil, -warningDays) : null;
}

export type PortalKind = 'foreigner_temp_residence' | 'vn_citizen_stay';

export interface PortalField {
  /** i18n key `reg.field.*` (client label in its own language). */
  label: string;
  /** Vietnamese text pasted on the Ministry of Public Security portal; '' for an empty field. */
  value: string;
  /** `reg.value.*` for enum values and empty fields (client display in its own language). */
  valueKey?: PortalValueKey;
}

export interface PortalPersonInput {
  fullNameOnDoc: string | null;
  dateOfBirth: LocalDate | null;
  gender: string | null;
  nationalityCode: string | null;
  docNumber: string;
  passportExpiryDate: LocalDate | null;
  visaKind: string | null;
  visaNumber: string | null;
  visaValidUntil: LocalDate | null;
  entryDate: LocalDate | null;
  entryPort: string | null;
  entryPurpose: string | null;
  address: string | null;
  /** BR-602 / BR-417 (4), DOM BE-22: calendar date (property time) of the ACTUAL check-in when known. */
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  roomNo: string | null;
}

/**
 * K6 portal data of one person – the ONE implementation (ARC FB-S3-20; INT's adapter no longer builds
 * fields). BR-606 order of the portal form; UXD s3 section 9; ORC 17/10: every field
 * in order, empty ones included (value '', valueKey reg.value.empty – the client shows no copy button).
 * Enum values are written in Vietnamese whatever the desk UI language (the portal is Vietnamese) and carry
 * their `reg.value.*` key. BR-605: a foreigner's departure is never declared beyond the visa.
 */
export type PortalDateFormat = 'dd/MM/yyyy' | 'yyyy-MM-dd';
export type PortalNationalityFormat = 'name_vi_alpha3' | 'alpha3';

export interface PortalFormat {
  /** `portal_date_format` (DOM S3-5 default dd/MM/yyyy – [GIẢ ĐỊNH – chờ INV, ESC-018]). */
  date: PortalDateFormat;
  /** `portal_nationality_format` (default "Tên nước tiếng Việt (alpha-3)"). */
  nationality: PortalNationalityFormat;
}

export const DEFAULT_PORTAL_FORMAT: PortalFormat = {
  date: 'dd/MM/yyyy',
  nationality: 'name_vi_alpha3',
};

export function formatPortalDate(d: LocalDate | null, fmt: PortalDateFormat): string | null {
  if (!d) return null;
  if (fmt === 'yyyy-MM-dd') return d;
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function formatNationality(
  alpha3: string | null,
  fmt: PortalNationalityFormat,
): string | null {
  if (!alpha3) return null;
  if (fmt === 'alpha3') return alpha3;
  const name = countryNameVi(alpha3);
  return name ? `${name} (${alpha3})` : alpha3;
}

export function portalFields(
  kind: PortalKind,
  p: PortalPersonInput,
  format: PortalFormat = DEFAULT_PORTAL_FORMAT,
): PortalField[] {
  const departureIso =
    kind === 'foreigner_temp_residence' && p.visaValidUntil && p.visaValidUntil < p.departureDate
      ? p.visaValidUntil
      : p.departureDate;
  const date = (d: LocalDate | null) => formatPortalDate(d, format.date);
  const departure = date(departureIso);
  const enumValue = (
    prefix: 'gender' | 'visa_kind',
    v: string | null,
  ): PortalField | string | null => {
    if (!v) return null;
    const key = `reg.value.${prefix}.${v}` as PortalValueKey;
    return key in PORTAL_VALUE_VI ? { label: '', value: PORTAL_VALUE_VI[key], valueKey: key } : v;
  };
  const rows: Array<[string, string | PortalField | null]> =
    kind === 'foreigner_temp_residence'
      ? [
          ['reg.field.full_name', p.fullNameOnDoc],
          ['reg.field.date_of_birth', date(p.dateOfBirth)],
          ['reg.field.gender', enumValue('gender', p.gender)],
          ['reg.field.nationality', formatNationality(p.nationalityCode, format.nationality)],
          ['reg.field.passport_number', p.docNumber],
          ['reg.field.passport_expiry', date(p.passportExpiryDate)],
          ['reg.field.visa_kind', enumValue('visa_kind', p.visaKind)],
          ['reg.field.visa_number', p.visaNumber],
          ['reg.field.visa_valid_until', date(p.visaValidUntil)],
          ['reg.field.entry_date', date(p.entryDate)],
          ['reg.field.entry_port', p.entryPort],
          ['reg.field.entry_purpose', p.entryPurpose],
          ['reg.field.arrival_date', date(p.arrivalDate)],
          ['reg.field.departure_date', departure],
          ['reg.field.room_no', p.roomNo],
        ]
      : [
          ['reg.field.full_name', p.fullNameOnDoc],
          ['reg.field.date_of_birth', date(p.dateOfBirth)],
          ['reg.field.gender', enumValue('gender', p.gender)],
          ['reg.field.id_number', p.docNumber],
          ['reg.field.address', p.address],
          ['reg.field.arrival_date', date(p.arrivalDate)],
          ['reg.field.departure_date', departure],
          ['reg.field.room_no', p.roomNo],
        ];
  return rows.map(([label, v]) => {
    if (v === null || v === '') return { label, value: '', valueKey: 'reg.value.empty' };
    if (typeof v === 'string') return { label, value: v };
    return { ...v, label };
  });
}

/** Clipboard text: one line per person, fields separated by tabs, empty fields left empty. */
export function portalClipboard(people: ReadonlyArray<{ fields: readonly PortalField[] }>): string {
  return people.map((p) => p.fields.map((f) => f.value).join('\t')).join('\n');
}
