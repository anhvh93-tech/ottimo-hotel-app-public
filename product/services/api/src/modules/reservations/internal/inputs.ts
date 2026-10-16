/**
 * Field validation of the reservations endpoints (BA EP02 spec, V-01…V-11). Errors are collected and thrown
 * together as 422 VALIDATION_FAILED errors[] (EP00 0.3 "422 gom mọi lỗi trường").
 */
import { type FieldError, problem } from '../../../shared/problem';
import { containsCardNumber } from '../../../shared/validation';
import type { LocalDate, LocalTime } from '../../../shared/time';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v);
}

export function isLocalDate(v: unknown): v is LocalDate {
  if (typeof v !== 'string' || !DATE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Path id: malformed → 404 (never reveals anything). */
export function pathId(v: string): string {
  if (!UUID.test(v)) throw problem('NOT_FOUND');
  return v;
}

export function asBody(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

/** Collects field errors; `done()` throws them all at once. */
export class Fields {
  readonly errors: FieldError[] = [];

  constructor(private readonly b: Record<string, unknown>) {}

  add(field: string, code: string): void {
    if (!this.errors.some((e) => e.field === field)) this.errors.push({ field, code });
  }

  has(field: string): boolean {
    return this.errors.some((e) => e.field === field);
  }

  present(field: string): boolean {
    return this.b[field] !== undefined && this.b[field] !== null;
  }

  uuid(field: string, required: boolean): string | undefined {
    const v = this.b[field];
    if (v === undefined || v === null) {
      if (required) this.add(field, 'REQUIRED');
      return undefined;
    }
    if (!isUuid(v)) {
      this.add(field, 'NOT_IN_LIST');
      return undefined;
    }
    return v;
  }

  date(field: string, required: boolean): LocalDate | undefined {
    const v = this.b[field];
    if (v === undefined || v === null) {
      if (required) this.add(field, 'REQUIRED');
      return undefined;
    }
    if (!isLocalDate(v)) {
      this.add(field, 'DATE_INVALID');
      return undefined;
    }
    return v;
  }

  time(field: string): LocalTime | undefined {
    const v = this.b[field];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'string' || !TIME.test(v)) {
      this.add(field, 'VALIDATION_FAILED');
      return undefined;
    }
    return v;
  }

  int(field: string, opts: { required: boolean; min: number; max?: number; fallback?: number }) {
    const v = this.b[field];
    if (v === undefined || v === null) {
      if (opts.required) this.add(field, 'REQUIRED');
      return opts.fallback;
    }
    if (
      typeof v !== 'number' ||
      !Number.isSafeInteger(v) ||
      v < opts.min ||
      (opts.max !== undefined && v > opts.max)
    ) {
      this.add(field, 'VALUE_OUT_OF_RANGE');
      return opts.fallback;
    }
    return v;
  }

  money(field: string, opts: { required: boolean; positive: boolean }): number | undefined {
    const v = this.b[field];
    if (v === undefined || v === null) {
      if (opts.required) this.add(field, 'REQUIRED');
      return undefined;
    }
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) {
      this.add(field, 'AMOUNT_INVALID');
      return undefined;
    }
    if (opts.positive && v === 0) {
      this.add(field, 'AMOUNT_NOT_POSITIVE');
      return undefined;
    }
    return v;
  }

  enumOf<T extends string>(field: string, values: readonly T[], required: boolean): T | undefined {
    const v = this.b[field];
    if (v === undefined || v === null) {
      if (required) this.add(field, 'REQUIRED');
      return undefined;
    }
    if (typeof v !== 'string' || !(values as readonly string[]).includes(v)) {
      this.add(field, 'NOT_IN_LIST');
      return undefined;
    }
    return v as T;
  }

  bool(field: string): boolean | undefined {
    const v = this.b[field];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'boolean') {
      this.add(field, 'VALIDATION_FAILED');
      return undefined;
    }
    return v;
  }

  /** Free text (V-09, max length); returns trimmed text or undefined. */
  text(field: string, max: number, opts: { required?: boolean; min?: number } = {}) {
    const v = this.b[field];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      if (opts.required) this.add(field, opts.min ? 'REASON_REQUIRED' : 'REQUIRED');
      return undefined;
    }
    if (typeof v !== 'string') {
      this.add(field, 'VALIDATION_FAILED');
      return undefined;
    }
    const t = v.trim().replace(/\s+/g, ' ');
    if (opts.min !== undefined && t.length < opts.min) {
      this.add(field, 'REASON_REQUIRED');
      return undefined;
    }
    if (t.length > max) {
      this.add(field, 'TOO_LONG');
      return undefined;
    }
    if (containsCardNumber(t)) {
      this.add(field, 'CARD_NUMBER_DETECTED');
      return undefined;
    }
    return t;
  }

  done(): void {
    if (this.errors.length === 0) return;
    // A card number in free text is its own problem code (R-PAY-07, V-09).
    const card = this.errors.find((e) => e.code === 'CARD_NUMBER_DETECTED');
    if (card) throw problem('CARD_NUMBER_DETECTED', { errors: [card] });
    throw problem('VALIDATION_FAILED', { errors: this.errors });
  }
}
