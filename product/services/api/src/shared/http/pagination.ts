/**
 * Cursor pagination (OpenAPI "Phân trang", coding-standards 7.4): `{ data, page: { nextCursor, limit } }`,
 * `limit` ≤ 100, no offset. The cursor is an opaque base64url JSON of the last row's sort key; a cursor
 * that does not decode is 422 (never a server error).
 */
import { problem } from '../problem';

export const MAX_LIMIT = 100;

export interface PageInfo {
  nextCursor: string | null;
  limit: number;
}

export function parseLimit(raw: unknown, defaultLimit: number): number {
  if (raw === undefined || raw === null || raw === '') return defaultLimit;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'limit', code: 'VALUE_OUT_OF_RANGE' }],
    });
  }
  return n;
}

export function encodeCursor(key: readonly (string | number)[]): string {
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64url');
}

/** Decodes a cursor made by encodeCursor with `arity` string/number parts. */
export function decodeCursor(raw: unknown, arity: number): (string | number)[] | null {
  if (raw === undefined || raw === null || raw === '') return null;
  try {
    if (typeof raw !== 'string' || raw.length > 512) throw new Error('bad');
    const v = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as unknown;
    if (
      !Array.isArray(v) ||
      v.length !== arity ||
      !v.every((x) => typeof x === 'string' || typeof x === 'number')
    ) {
      throw new Error('bad');
    }
    return v as (string | number)[];
  } catch {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'cursor', code: 'VALIDATION_FAILED' }],
    });
  }
}

/** Build the page from `limit + 1` fetched rows. */
export function page<T>(
  rows: T[],
  limit: number,
  keyOf: (row: T) => (string | number)[],
): { data: T[]; page: PageInfo } {
  const more = rows.length > limit;
  const data = more ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  return { data, page: { nextCursor: more && last ? encodeCursor(keyOf(last)) : null, limit } };
}
