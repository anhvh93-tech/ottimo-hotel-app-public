/**
 * Optimistic locking with ETag / If-Match (ADR-009, OpenAPI "Khóa lạc quan", coding-standards 6).
 *
 * - GET of an editable resource sends `ETag: "<version>"` (setETag).
 * - PATCH / state actions declare If-Match: the guard requires it (428 PRECONDITION_REQUIRED) and parses it
 *   into `req.ottimoAuth.ifMatchVersion` (malformed → 422). Idempotent replays skip the comparison because
 *   UnitOfWork returns the stored response before the use case runs.
 * - The use case compares inside its transaction:
 *     UPDATE … SET …, version = version + 1 WHERE id = $1 AND version = $2
 *   0 rows → versionedUpdate() → 412 VERSION_CONFLICT with `currentVersion` (Problem extension in the
 *   OpenAPI example), or 404 when the row is not visible (other property / out of scope).
 *   The contract's code for "If-Match lệch" is VERSION_CONFLICT (412); there is no PRECONDITION_FAILED code.
 */
import type { Tx } from '../../db/database';
import { problem } from '../problem';
import type { GuardedRequest } from './auth.guard';

/** `"7"`, `W/"7"` or bare `7` → 7. Anything else (lists, `*`, non-integers) → null. */
export function parseEntityTag(raw: string): number | null {
  const m = /^\s*(?:W\/)?("?)(\d{1,9})\1\s*$/.exec(raw);
  if (!m) return null;
  const n = Number(m[2]);
  return Number.isSafeInteger(n) ? n : null;
}

export function etag(version: number): string {
  return `"${version}"`;
}

export function setETag(
  reply: { header(name: string, value: string): unknown },
  version: number,
): void {
  reply.header('ETag', etag(version));
}

/** Version sent by the client (operation must declare If-Match; the guard already enforced presence). */
export function expectedVersion(req: GuardedRequest): number {
  const v = req.ottimoAuth?.ifMatchVersion;
  if (v === undefined)
    throw problem('PRECONDITION_REQUIRED', { detail: 'If-Match header is required' });
  return v;
}

/** In-memory comparison after `SELECT … FOR UPDATE`. */
export function assertVersion(currentVersion: number, expected: number): void {
  if (currentVersion !== expected) {
    throw problem('VERSION_CONFLICT', { extras: { currentVersion } });
  }
}

/**
 * Run a versioned UPDATE (`… WHERE id = … AND version = <expected>`). When it touches 0 rows, read the
 * current version with `currentVersionSql` (one parameter: the id) and throw 412 or 404.
 */
export async function versionedUpdate(
  tx: Tx,
  updateSql: string,
  params: readonly unknown[],
  check: { id: string; currentVersionSql: string },
): Promise<void> {
  const r = await tx.query(updateSql, params);
  if ((r.rowCount ?? 0) > 0) return;
  const cur = await tx.query<{ version: number }>(check.currentVersionSql, [check.id]);
  const row = cur.rows[0];
  if (!row) throw problem('NOT_FOUND');
  throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.version } });
}
