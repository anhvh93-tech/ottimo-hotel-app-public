/**
 * Transactions with an RLS tenant context (erd 2.2, coding-standards 6 "Ngữ cảnh RLS").
 *
 * Every query runs inside a transaction whose FIRST statement is
 *   SELECT set_config('app.organization_id',$1,true), set_config('app.property_id',$2,true),
 *          set_config('app.user_id',$3,true), set_config('app.actor_type',$4,true)
 * `is_local = true` scopes the values to the transaction, so a pooled connection handed to the next
 * request carries no context ('' → NULLIF → NULL → policies match 0 rows). There is deliberately no
 * API that runs a query on a bare pool connection.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as schema from './schema';
import type { ActorType } from './schema';

export const DATABASE = Symbol('DATABASE');

export interface TenantContext {
  organizationId: string | null;
  propertyId: string | null;
  userId: string | null;
  actorType: ActorType;
}

export type Schema = typeof schema;

export interface Tx {
  readonly ctx: TenantContext;
  /** Drizzle bound to this transaction's connection. */
  readonly db: NodePgDatabase<Schema>;
  /** Parameterised SQL on this transaction's connection (never interpolate user data into text). */
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<R>>;
}

export interface TxOptions {
  isolation?: 'read committed' | 'repeatable read' | 'serializable';
  readOnly?: boolean;
}

export const SET_CONTEXT_SQL =
  "SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true), " +
  "set_config('app.user_id', $3, true), set_config('app.actor_type', $4, true)";

/** Context used by the SECURITY DEFINER entry functions only (no tenant visible). */
export const NO_TENANT: TenantContext = {
  organizationId: null,
  propertyId: null,
  userId: null,
  actorType: 'system',
};

/**
 * Marks code running inside a UnitOfWork handler (shared/http/unit-of-work.ts). Opening a second
 * connection there (withContext/entry) is a programming error: the handler already holds a pooled
 * connection and row/key locks, so N concurrent requests waiting for a second connection exhaust the pool
 * (FB-R2-ARC-BE-01, coding-standards 6 "một use case = một giao dịch"). Work that needs its own
 * transaction (re-auth counters, access.denied audit) runs BEFORE or AFTER the unit of work.
 */
const unitOfWorkScope = new AsyncLocalStorage<string>();

/** Run `fn` with the "inside a unit of work" marker (label = operationId, for the error message). */
export function runInUnitOfWork<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return unitOfWorkScope.run(label, fn);
}

/** Leave the marker for code that legitimately runs after the unit of work (never inside a handler). */
export function outsideUnitOfWork<T>(fn: () => T): T {
  return unitOfWorkScope.exit(fn);
}

export class Database {
  constructor(readonly pool: Pool) {}

  /** Run `fn` in one transaction with the tenant context set first. Rolls back on any error. */
  async withContext<T>(
    ctx: TenantContext,
    fn: (tx: Tx) => Promise<T>,
    options: TxOptions = {},
  ): Promise<T> {
    const uow = unitOfWorkScope.getStore();
    if (uow !== undefined) {
      throw new Error(
        `nested database connection inside the unit of work of ${uow}: use the handler's tx ` +
          '(re-auth / access.denied belong before or after UnitOfWork.run)',
      );
    }
    const client = await this.pool.connect();
    let broken = false;
    try {
      const mode = [
        options.isolation ? `ISOLATION LEVEL ${options.isolation.toUpperCase()}` : '',
        options.readOnly ? 'READ ONLY' : '',
      ]
        .filter(Boolean)
        .join(' ');
      await client.query(mode ? `BEGIN ${mode}` : 'BEGIN');
      await client.query(SET_CONTEXT_SQL, [
        ctx.organizationId ?? '',
        ctx.propertyId ?? '',
        ctx.userId ?? '',
        ctx.actorType,
      ]);
      const result = await fn(makeTx(client, ctx));
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        broken = true; // connection unusable: destroy it instead of returning it to the pool
      }
      throw err;
    } finally {
      client.release(broken);
    }
  }

  /**
   * For the erd 2.4 entry functions (auth_find_user, auth_resolve_session…) that run before a tenant
   * is known. The context is empty, so a plain table query here sees 0 rows by construction.
   */
  async entry<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.withContext(NO_TENANT, fn);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

function makeTx(client: PoolClient, ctx: TenantContext): Tx {
  return {
    ctx,
    db: drizzle(client, { schema }),
    query: <R extends QueryResultRow>(text: string, params?: readonly unknown[]) =>
      client.query<R>(text, params as unknown[] | undefined),
  };
}

/** Postgres error code helper (e.g. 23505 unique_violation, 23P01 exclusion_violation). */
export function pgCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code)
    : undefined;
}
