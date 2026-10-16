// Door access helpers shared by the core (BE-A) and every DoorLockAdapter. Owner: INT.
// BR-403: code valid from check-in time to check-out time (incl. approved late check-out); 6 random digits
// by default; birthday code = ddmm + 3 random digits; at most 2 key cards per room (BR-511).
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
  /** Approved late check-out time on the departure date (BR-403). */
  lateCheckOutTime?: string;
}

function hhmm(value: string, field: string): string {
  if (!TIME_RE.test(value)) throw new IntegrationError('INVALID_REQUEST', `${field} must be HH:mm`);
  return value;
}

/** Validity window of a guest code/card: arrival + check-in time → departure + check-out time. */
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
  const to = hhmm(input.lateCheckOutTime ?? input.checkOutTime ?? '12:00', 'checkOutTime');
  return {
    validFrom: isoInstant(`${arrival}T${from}:00${offset}`),
    validTo: isoInstant(`${departure}T${to}:00${offset}`),
  };
}

function randomDigits(n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += String(randomInt(0, 10));
  return out;
}

/** n random digits from the OS CSPRNG (SR-LOCK-01). Uniqueness on the lock / 90-day reuse: core checks in DB. */
export function generateDoorCode(digits: number = DOOR_CODE_DEFAULT_DIGITS): string {
  if (!Number.isInteger(digits) || digits < DOOR_CODE_MIN_DIGITS || digits > DOOR_CODE_MAX_DIGITS) {
    throw new IntegrationError('INVALID_REQUEST', 'Door code length must be 6–10');
  }
  return randomDigits(digits);
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
  return ddmm + randomDigits(BIRTHDAY_CODE_RANDOM_DIGITS);
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
