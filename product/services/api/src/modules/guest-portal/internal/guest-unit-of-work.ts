/**
 * Unit of work for guest-session writes (ADR-009 idempotency with principal_type `guest_session`, same
 * rules as the staff UnitOfWork): tenant context of the booking (actor `guest`), Idempotency-Key claimed
 * in the business transaction, replay of a completed key, 422 on a reused key, 409 while in progress.
 * Responses of guest writes contain no C2/C3 (OnlineCheckin), so they are stored for replay as they are.
 */
import { Inject, Injectable } from '@nestjs/common';
import {
  DATABASE,
  DEFAULT_LOCK_TIMEOUT_MS,
  Database,
  type TenantContext,
  type Tx,
  pgCode,
} from '../../../db/database';
import type { GuardedRequest } from '../../../shared/http/auth.guard';
import type { GuestPrincipal } from '../../../shared/http/guest-session';
import {
  type UnitOfWorkResult,
  type UseCaseResult,
  requestHash,
} from '../../../shared/http/unit-of-work';
import { ProblemError, problem } from '../../../shared/problem';

export function guestContext(g: GuestPrincipal): TenantContext {
  return {
    organizationId: g.organizationId,
    propertyId: g.propertyId,
    userId: null,
    actorType: 'guest',
  };
}

function header(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

function pathOf(url: string): string {
  const q = url.indexOf('?');
  return q < 0 ? url : url.slice(0, q);
}

@Injectable()
export class GuestUnitOfWork {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async run<T>(
    req: GuardedRequest,
    guest: GuestPrincipal,
    handler: (tx: Tx) => Promise<UseCaseResult<T>>,
  ): Promise<UnitOfWorkResult<T>> {
    const auth = req.ottimoAuth;
    const key = auth?.operation.idempotencyKey ? header(req, 'idempotency-key') : undefined;
    return this.db.withContext(guestContext(guest), async (tx) => {
      if (key) {
        const replay = await this.claim(tx, guest, key, {
          method: req.method.toUpperCase(),
          path: pathOf(req.url),
          hash: requestHash(req.method, pathOf(req.url), req.body ?? null),
        });
        if (replay) {
          if (replay.status >= 400) {
            const b = replay.body as { code?: string };
            throw new ProblemError(b.code ?? 'INTERNAL_ERROR');
          }
          return { ...(replay as UseCaseResult<T>), replayed: true };
        }
      }
      const out = await handler(tx);
      if (key) {
        await tx.query(
          `UPDATE idempotency_key SET state = 'completed', response_status = $3, response_body = $4
            WHERE principal_type = 'guest_session' AND principal_id = $1 AND key = $2`,
          [guest.sessionId, key, out.status, JSON.stringify(out.body ?? null)],
        );
      }
      return { ...out, replayed: false };
    });
  }

  private async claim(
    tx: Tx,
    guest: GuestPrincipal,
    key: string,
    req: { method: string; path: string; hash: string },
  ): Promise<UseCaseResult<unknown> | null> {
    await tx.query(`SELECT set_config('lock_timeout', '3000ms', true)`);
    let inserted: boolean;
    try {
      const r = await tx.query(
        `INSERT INTO idempotency_key (principal_type, principal_id, key, organization_id, method, path,
           request_hash, state)
         VALUES ('guest_session', $1, $2, $3, $4, $5, $6, 'in_progress')
         ON CONFLICT DO NOTHING RETURNING key`,
        [guest.sessionId, key, guest.organizationId, req.method, req.path, req.hash],
      );
      inserted = (r.rowCount ?? 0) === 1;
    } catch (err) {
      if (pgCode(err) === '55P03') throw problem('IDEMPOTENCY_IN_PROGRESS');
      throw err;
    }
    await tx.query(`SELECT set_config('lock_timeout', $1, true)`, [`${DEFAULT_LOCK_TIMEOUT_MS}ms`]);
    if (inserted) return null;
    const { rows } = await tx.query<{
      method: string;
      path: string;
      request_hash: string;
      state: string;
      response_status: number | null;
      response_body: unknown;
    }>(
      `SELECT method, path, request_hash, state, response_status, response_body FROM idempotency_key
        WHERE principal_type = 'guest_session' AND principal_id = $1 AND key = $2`,
      [guest.sessionId, key],
    );
    const row = rows[0];
    if (!row) throw problem('IDEMPOTENCY_IN_PROGRESS');
    if (row.method !== req.method || row.path !== req.path || row.request_hash !== req.hash) {
      throw problem('IDEMPOTENCY_KEY_REUSED');
    }
    if (row.state !== 'completed' || row.response_status === null) {
      throw problem('IDEMPOTENCY_IN_PROGRESS');
    }
    return { status: row.response_status, body: row.response_body };
  }
}
