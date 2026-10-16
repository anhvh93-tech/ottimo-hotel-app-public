/**
 * Request validation helpers for feature modules: zod → 422 VALIDATION_FAILED with `errors[]` whose
 * codes follow the OpenAPI "Mã lỗi theo trường" table (REQUIRED, TOO_LONG, VALUE_OUT_OF_RANGE…).
 * Field paths use the JSON path of the request (`listPrice.reason`, `roles[0].propertyId`).
 */
import { z } from 'zod';
import { type FieldError, problem } from '../../../shared/problem';

function pathOf(path: readonly PropertyKey[]): string {
  let out = '';
  for (const p of path) {
    if (typeof p === 'number') out += `[${p}]`;
    else out += out ? `.${String(p)}` : String(p);
  }
  return out || 'body';
}

function codeOf(issue: z.core.$ZodIssue): string {
  // A custom refinement may carry its own field code (e.g. NAME_INVALID).
  if (issue.code === 'custom') {
    const p = (issue as { params?: { code?: unknown } }).params;
    if (p && typeof p.code === 'string') return p.code;
    return 'VALIDATION_FAILED';
  }
  if (issue.code === 'invalid_type' && (issue as { input?: unknown }).input === undefined) {
    return 'REQUIRED';
  }
  if (issue.code === 'too_big')
    return issue.origin === 'string' ? 'TOO_LONG' : 'VALUE_OUT_OF_RANGE';
  if (issue.code === 'too_small') {
    return issue.origin === 'string' && issue.minimum === 1 ? 'REQUIRED' : 'VALUE_OUT_OF_RANGE';
  }
  if (issue.code === 'invalid_value') return 'NOT_IN_LIST';
  return 'VALIDATION_FAILED';
}

export function fieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((i) => ({ field: pathOf(i.path), code: codeOf(i) }));
}

/** Parse a request body; any problem → 422 VALIDATION_FAILED with per-field codes. */
export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  const r = schema.safeParse(body ?? {});
  if (!r.success) throw problem('VALIDATION_FAILED', { errors: fieldErrors(r.error) });
  return r.data;
}

export function fail(field: string, code: string, status = 'VALIDATION_FAILED'): never {
  throw problem(status, { errors: [{ field, code }] });
}

/**
 * V-09 (card numbers) lives in src/shared/validation.ts (shared with BE-A); re-exported here so module code
 * has one import for request validation.
 */
export {
  assertNoCardNumber,
  containsCardNumber as looksLikeCardNumber,
} from '../../../shared/validation';

/** Reason text V-08 (3–500 after trim) + V-09. */
export const reasonSchema = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length >= 3 && s.length <= 500, { params: { code: 'REASON_REQUIRED' } });

export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) => {
      const d = new Date(`${s}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    },
    { params: { code: 'DATE_INVALID' } },
  );
