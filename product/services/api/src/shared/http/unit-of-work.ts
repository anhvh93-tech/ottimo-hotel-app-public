/**
 * Write use cases: one transaction = tenant context → Idempotency-Key → role decision → business → stored
 * response → COMMIT (coding-standards 6 "Giao dịch", 7.5; ADR-009 point 8; erd 4.12 idempotency_key).
 *
 * Idempotency (operations that declare Idempotency-Key):
 * - INSERT state='in_progress' as the first write of the business transaction. A concurrent request with
 *   the same key waits on the primary key; if the first one is still running after `lockTimeoutMs`
 *   → 409 IDEMPOTENCY_IN_PROGRESS. If the first one rolled back, the key is gone and this one proceeds.
 * - Key already completed with the same request hash → stored response, header Idempotent-Replayed: true,
 *   without re-checking If-Match or roles (offline retries after success get the old result, not 412).
 * - Same key, different method/path/body → 422 IDEMPOTENCY_KEY_REUSED.
 * - Before COMMIT the row becomes 'completed' with the response; for C3 endpoints only status + id are
 *   stored (`storeBody: false` – erd 4.12).
 * - Commit-then-fail: a use case that must keep its writes AND answer with an error (SM-10 A4: the request
 *   moves to `escalated`, the approver gets 403 APPROVAL_LIMIT_EXCEEDED) returns `{ fail: problem(...) }`.
 *   The transaction commits (with the problem stored as the idempotent response) and the problem is thrown
 *   afterwards; a replay of that key throws the same problem again.
 */
import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, Database, type Tx, pgCode } from '../../db/database';
import { ProblemError, problem } from '../problem';
import { AuthGuard, type GuardedRequest, tenantOf } from './auth.guard';

export interface UseCaseResult<T> {
  status: number;
  body: T;
}

/** Commit the transaction, then answer with this problem (see "Commit-then-fail" above). */
export interface UseCaseFailure {
  fail: ProblemError;
}

function isFailure(r: unknown): r is UseCaseFailure {
  return typeof r === 'object' && r !== null && (r as UseCaseFailure).fail instanceof ProblemError;
}

function replayFailure(stored: UseCaseResult<unknown>): ProblemError | null {
  if (stored.status < 400) return null;
  const body = stored.body as { code?: unknown } | null;
  if (!body || typeof body.code !== 'string') return null;
  const { code, detail, errors } = body as Record<string, unknown> & { code: string };
  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!['type', 'title', 'status', 'code', 'detail', 'requestId', 'errors'].includes(k))
      extras[k] = v;
  }
  return new ProblemError(code, {
    ...(typeof detail === 'string' ? { detail } : {}),
    ...(Array.isArray(errors) ? { errors: errors as never } : {}),
    extras,
  });
}

export interface UnitOfWorkResult<T> extends UseCaseResult<T> {
  replayed: boolean;
}

export interface RunOptions {
  /** false for responses that contain C3: only status and `id` are stored for replay. */
  storeBody?: boolean;
  lockTimeoutMs?: number;
}

interface KeyRow {
  method: string;
  path: string;
  request_hash: string;
  state: 'in_progress' | 'completed';
  response_status: number | null;
  response_body: unknown;
}

/** Stable JSON (sorted keys) so the same logical body always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export function requestHash(method: string, path: string, body: unknown): string {
  return createHash('sha256')
    .update(`${method.toUpperCase()} ${path}\n${canonicalJson(body)}`)
    .digest('hex');
}

function headerValue(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

function pathOf(url: string): string {
  const q = url.indexOf('?');
  return q < 0 ? url : url.slice(0, q);
}

@Injectable()
export class UnitOfWork {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(AuthGuard) private readonly guard: AuthGuard,
  ) {}

  async run<T>(
    req: GuardedRequest,
    handler: (tx: Tx) => Promise<UseCaseResult<T> | UseCaseFailure>,
    options: RunOptions = {},
  ): Promise<UnitOfWorkResult<T>> {
    const out = await this.runInner<T>(req, handler, options);
    if ('fail' in out) throw out.fail;
    return out;
  }

  private async runInner<T>(
    req: GuardedRequest,
    handler: (tx: Tx) => Promise<UseCaseResult<T> | UseCaseFailure>,
    options: RunOptions,
  ): Promise<UnitOfWorkResult<T> | UseCaseFailure> {
    const auth = req.ottimoAuth;
    if (!auth?.principal) throw new Error('UnitOfWork.run() needs an authenticated staff request');
    const principal = auth.principal;
    const body = req.body as { dryRun?: unknown } | undefined;
    const dryRun = !!body && typeof body === 'object' && body.dryRun === true;
    const key =
      auth.operation.idempotencyKey && !dryRun ? headerValue(req, 'idempotency-key') : undefined;

    return this.db.withContext(tenantOf(principal), async (tx) => {
      if (key) {
        const hash = requestHash(req.method, pathOf(req.url), req.body ?? null);
        const replay = await this.claimKey(tx, principal.userId, principal.organizationId, key, {
          method: req.method.toUpperCase(),
          path: pathOf(req.url),
          hash,
          lockTimeoutMs: options.lockTimeoutMs ?? 3_000,
        });
        if (replay) {
          const failure = replayFailure(replay);
          if (failure) return { fail: failure };
          return { ...(replay as UseCaseResult<T>), replayed: true };
        }
      }
      await this.guard.enforce(req);
      const outcome = await handler(tx);
      const result: UseCaseResult<unknown> = isFailure(outcome)
        ? { status: outcome.fail.status, body: outcome.fail.toBody() }
        : outcome;
      if (key) {
        const stored =
          options.storeBody === false && !isFailure(outcome)
            ? pickId(result.body)
            : ((result.body as unknown) ?? null);
        await tx.query(
          `UPDATE idempotency_key SET state = 'completed', response_status = $4, response_body = $5
            WHERE principal_type = 'user' AND principal_id = $1 AND key = $2 AND organization_id = $3`,
          [principal.userId, key, principal.organizationId, result.status, JSON.stringify(stored)],
        );
      }
      if (isFailure(outcome)) return outcome;
      return { ...(outcome as UseCaseResult<T>), replayed: false };
    });
  }

  /** Returns the stored response when the key was already completed, otherwise claims the key. */
  private async claimKey(
    tx: Tx,
    userId: string,
    organizationId: string,
    key: string,
    req: { method: string; path: string; hash: string; lockTimeoutMs: number },
  ): Promise<UseCaseResult<unknown> | null> {
    await tx.query(`SELECT set_config('lock_timeout', $1, true)`, [`${req.lockTimeoutMs}ms`]);
    let inserted: boolean;
    try {
      const r = await tx.query(
        `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
           request_hash, state)
         VALUES ('user', $1, $2, $3, $4, $5, $6, 'in_progress')
         ON CONFLICT DO NOTHING RETURNING key`,
        [userId, key, organizationId, req.method, req.path, req.hash],
      );
      inserted = (r.rowCount ?? 0) === 1;
    } catch (err) {
      if (pgCode(err) === '55P03') throw problem('IDEMPOTENCY_IN_PROGRESS');
      throw err;
    }
    await tx.query(`SELECT set_config('lock_timeout', '0', true)`);
    if (inserted) return null;

    const { rows } = await tx.query<KeyRow>(
      `SELECT method, path, request_hash, state, response_status, response_body FROM idempotency_key
        WHERE principal_type = 'user' AND principal_id = $1 AND key = $2`,
      [userId, key],
    );
    const row = rows[0];
    if (!row) throw problem('IDEMPOTENCY_IN_PROGRESS'); // other tenant/row vanished: let the client retry
    if (row.method !== req.method || row.path !== req.path || row.request_hash !== req.hash) {
      throw problem('IDEMPOTENCY_KEY_REUSED');
    }
    if (row.state !== 'completed' || row.response_status === null) {
      throw problem('IDEMPOTENCY_IN_PROGRESS');
    }
    return { status: row.response_status, body: row.response_body };
  }
}

function pickId(body: unknown): unknown {
  if (body && typeof body === 'object' && 'id' in body) return { id: (body as { id: unknown }).id };
  return null;
}

/** Write a UnitOfWork result to a Fastify reply (status + Idempotent-Replayed header). */
export function applyResult<T>(
  reply: { status(code: number): unknown; header(name: string, value: string): unknown },
  result: UnitOfWorkResult<T>,
): T {
  reply.status(result.status);
  if (result.replayed) reply.header('Idempotent-Replayed', 'true');
  return result.body;
}
