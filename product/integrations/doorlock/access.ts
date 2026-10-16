// Door access helpers shared by the core (BE-A) and every DoorLockAdapter. Owner: INT.
// BR-403 v0.3.4: validity window (actual check-in if earlier → agreed late check-out or grace); 6 random
// digits by default, no weak code; birthday code = ddmm + 3 random digits; at most 2 key cards per room.
import { randomInt } from 'node:crypto';
import {
  IntegrationError,
  isoInstant,
  localDate,
  type IsoInstant,
  type LocalDate,
} from '../contracts/common.js';
import type { AddKeyCardRequest, CreateDoorCodeRequest } from '../contracts/doorlock.js';

export const MAX_KEY_CARDS_PER_ROOM = 2;
export const DOOR_CODE_DEFAULT_DIGITS = 6;
export const DOOR_CODE_MIN_DIGITS = 6;
export const DOOR_CODE_MAX_DIGITS = 10;
export const BIRTHDAY_CODE_RANDOM_DIGITS = 3;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const OFFSET_RE = /^[+-](0\d|1[0-4]):[0-5]\d$/;
/** Random internal reference only – never a name, phone or birthday (SEC-08). */
const LABEL_RE = /^[A-Za-z0-9_-]{1,32}$/;
const CARD_UID_RE = /^[A-Za-z0-9]{4,32}$/;

export interface DoorValidityInput {
  arrivalDate: LocalDate | string;
  departureDate: LocalDate | string;
  /** Property offset, default Asia/Ho_Chi_Minh '+07:00' (no DST). */
  utcOffset?: string;
  /** Standard check-in time (parameter), default '14:00'. */
  checkInTime?: string;
  /** Standard check-out time (parameter), default '12:00'. */
  checkOutTime?: string;
  /** Confirmed early check-in time on the arrival date. */
  earlyCheckInTime?: string;
  /**
   * Actual check-in instant (B9a, e.g. 04:40). Used as validFrom when earlier than the standard/early
   * check-in time (BR-403 v0.3.4, FB-R2-DOM-INT-01).
   */
  actualCheckInAt?: IsoInstant | string;
  /** Agreed late check-out time on the departure date (BR-403/412). Wins over everything below. */
  lateCheckOutTime?: string;
  /** Parameter `late_grace_until` (BR-412, '12:30'). Applies only when `sameDayArrival === false`. */
  lateGraceUntil?: string;
  /**
   * Core-computed: a confirmed/hold reservation arrives in this room on the departure date (BR-412). Grace is
   * applied only when this is explicitly false – unknown means no grace (standard check-out time).
   */
  sameDayArrival?: boolean;
}

function hhmm(value: string, field: string): string {
  if (!TIME_RE.test(value)) throw new IntegrationError('INVALID_REQUEST', `${field} must be HH:mm`);
  return value;
}

/**
 * Validity window of a guest code/card (BR-403 v0.3.4, DOM S3-16):
 * - validFrom = arrival date + standard (or confirmed early) check-in time, or the actual check-in instant
 *   when that is earlier;
 * - validTo = departure date + agreed late check-out time; none agreed → `late_grace_until` when no guest
 *   arrives in the room that day; otherwise the standard check-out time.
 * The core still revokes the code immediately at check-out (B18) – the window is only the upper bound.
 */
export function computeDoorValidity(input: DoorValidityInput): {
  validFrom: IsoInstant;
  validTo: IsoInstant;
} {
  const arrival = localDate(input.arrivalDate);
  const departure = localDate(input.departureDate);
  const offset = input.utcOffset ?? '+07:00';
  if (!OFFSET_RE.test(offset))
    throw new IntegrationError('INVALID_REQUEST', 'utcOffset must be ±HH:mm');
  if (departure <= arrival) {
    throw new IntegrationError('INVALID_REQUEST', 'departureDate must be after arrivalDate');
  }
  const from = hhmm(input.earlyCheckInTime ?? input.checkInTime ?? '14:00', 'checkInTime');
  const standardTo = hhmm(input.checkOutTime ?? '12:00', 'checkOutTime');
  let to = standardTo;
  if (input.lateCheckOutTime !== undefined) {
    to = hhmm(input.lateCheckOutTime, 'lateCheckOutTime');
  } else if (input.lateGraceUntil !== undefined && input.sameDayArrival === false) {
    const grace = hhmm(input.lateGraceUntil, 'lateGraceUntil');
    if (grace > standardTo) to = grace;
  }
  let validFrom = isoInstant(`${arrival}T${from}:00${offset}`);
  if (input.actualCheckInAt !== undefined) {
    const actual = isoInstant(input.actualCheckInAt);
    if (Date.parse(actual) < Date.parse(validFrom)) validFrom = actual;
  }
  const validTo = isoInstant(`${departure}T${to}:00${offset}`);
  assertValidityWindow(validFrom, validTo);
  return { validFrom, validTo };
}

/**
 * Weak code (BR-403 v0.3.4): all digits identical (000000, 777777) or a run of consecutive digits going up or
 * down (123456, 654321; wrapping 9→0 counts: 789012). Refused by every adapter and never generated.
 */
export function isWeakDoorCode(code: string): boolean {
  if (!/^\d+$/.test(code)) return true;
  const d = [...code].map(Number);
  const steps = d.slice(1).map((x, i) => (x - (d[i] as number) + 10) % 10);
  return steps.every((s) => s === 0) || steps.every((s) => s === 1) || steps.every((s) => s === 9);
}

/**
 * True when `code` is only the guest's date of birth without the 3 random digits (BR-403: not accepted).
 * The adapter never sees the date of birth (C3) – the core (BE-A) calls this before setDoorCredential.
 */
export function matchesBirthdayWithoutRandom(
  code: string,
  dateOfBirth: LocalDate | string,
): boolean {
  const dob = localDate(dateOfBirth);
  const yyyy = dob.slice(0, 4);
  const yy = dob.slice(2, 4);
  const mm = dob.slice(5, 7);
  const dd = dob.slice(8, 10);
  const forms = [
    dd + mm,
    dd + mm + yy,
    dd + mm + yyyy,
    yy + mm + dd,
    yyyy + mm + dd,
    mm + dd,
    mm + dd + yy,
    mm + dd + yyyy,
  ];
  return forms.includes(code);
}

function randomDigits(n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += String(randomInt(0, 10));
  return out;
}

/**
 * n random digits from the OS CSPRNG (SR-LOCK-01), never a weak code. Uniqueness on the lock / 90-day reuse /
 * birthday check: the core, in DB.
 */
export function generateDoorCode(digits: number = DOOR_CODE_DEFAULT_DIGITS): string {
  if (!Number.isInteger(digits) || digits < DOOR_CODE_MIN_DIGITS || digits > DOOR_CODE_MAX_DIGITS) {
    throw new IntegrationError('INVALID_REQUEST', 'Door code length must be 6–10');
  }
  let code: string;
  do code = randomDigits(digits);
  while (isWeakDoorCode(code));
  return code;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Birthday code, only when the guest asks: ddmm + 3 random digits (BR-403, ESC-011 A). */
export function generateBirthdayDoorCode(ddmm: string): string {
  const m = /^(\d{2})(\d{2})$/.exec(ddmm);
  const day = Number(m?.[1]);
  const month = Number(m?.[2]);
  if (!m || month < 1 || month > 12 || day < 1 || day > (DAYS_IN_MONTH[month - 1] as number)) {
    throw new IntegrationError('INVALID_REQUEST', 'Birthday must be ddmm');
  }
  let code: string;
  do code = ddmm + randomDigits(BIRTHDAY_CODE_RANDOM_DIGITS);
  while (isWeakDoorCode(code));
  return code;
}

export function assertValidityWindow(validFrom: IsoInstant, validTo: IsoInstant): void {
  const from = Date.parse(isoInstant(validFrom));
  const to = Date.parse(isoInstant(validTo));
  if (!(from < to))
    throw new IntegrationError('INVALID_REQUEST', 'validFrom must be before validTo');
}

export function assertLabel(label: string): void {
  if (!LABEL_RE.test(label)) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      'label must be an internal reference [A-Za-z0-9_-]{1,32}',
    );
  }
}

/** Shared request checks; error messages never contain the code. */
export function assertCreateDoorCode(req: CreateDoorCodeRequest): void {
  if (!/^\d{6,10}$/.test(req.code)) {
    throw new IntegrationError('INVALID_REQUEST', 'Door code must be 6–10 digits');
  }
  if (isWeakDoorCode(req.code)) {
    throw new IntegrationError('INVALID_REQUEST', 'Door code is too easy to guess');
  }
  if (req.kind !== 'guest' && req.kind !== 'staff') {
    throw new IntegrationError('INVALID_REQUEST', 'kind must be guest or staff');
  }
  if (!req.lockRef) throw new IntegrationError('INVALID_REQUEST', 'lockRef is required');
  assertLabel(req.label);
  assertValidityWindow(req.validFrom, req.validTo);
}

export function assertAddKeyCard(req: AddKeyCardRequest): void {
  if (!req.lockRef) throw new IntegrationError('INVALID_REQUEST', 'lockRef is required');
  if (!CARD_UID_RE.test(req.keyCardUid)) {
    throw new IntegrationError('INVALID_REQUEST', 'keyCardUid must be 4–32 letters/digits');
  }
  assertLabel(req.label);
  assertValidityWindow(req.validFrom, req.validTo);
}

/** `cardsIssued` per room-stay: 0–2 (OpenAPI DoorCredentialInput, BR-403/511). */
export function assertCardsIssued(n: number): void {
  if (!Number.isInteger(n) || n < 0 || n > MAX_KEY_CARDS_PER_ROOM) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      `cardsIssued must be 0–${MAX_KEY_CARDS_PER_ROOM}`,
    );
  }
}
