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
  /**
   * ADR-015 (FB-R3-SEC-ARC-01): true ONLY on the `tx` of Database.simulate – a transaction that is always rolled back
   * and that the database itself refuses to commit (simulation_guard). Use cases read their dry-run mode from here,
   * never from a flag a caller passes.
   */
  readonly simulation?: true;
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
  /** Longest wait for a row/table lock in this transaction (default DEFAULT_LOCK_TIMEOUT_MS). */
  lockTimeoutMs?: number;
}

/**
 * Technical limits of every transaction (FB-R2-SEC-BE-23): a request never waits forever for a lock held by a
 * slow transaction (pool exhaustion) – 55P03 → 409 CONCURRENT_UPDATE; a runaway statement is cancelled
 * (57014 → 503). Long reports set their own `SET LOCAL statement_timeout`.
 */
export const DEFAULT_LOCK_TIMEOUT_MS = 5_000;
export const DEFAULT_STATEMENT_TIMEOUT_MS = 15_000;

export const SET_CONTEXT_SQL =
  "SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true), " +
  "set_config('app.user_id', $3, true), set_config('app.actor_type', $4, true), " +
  "set_config('lock_timeout', $5, true), set_config('statement_timeout', $6, true)";

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
        `${options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS}ms`,
        `${DEFAULT_STATEMENT_TIMEOUT_MS}ms`,
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
   * ADR-015 / FB-R3-SEC-ARC-01: a WRITE transaction that never ends any other way than ROLLBACK – the preview of an
   * operation whose numbers only exist after its writes (B16 `earlyDeparture` `dryRun`). Its own connection and its own
   * code path (no shared "commit on success" branch):
   * - BEGIN, then the same tenant/RLS context as `withContext` (transaction-local lock/statement timeouts);
   * - first write: a `simulation_guard` row whose DEFERRABLE INITIALLY DEFERRED constraint trigger always raises, so
   *   the database refuses to end this transaction with a commit whatever the code does (the stand-in for READ ONLY
   *   of the SEC A3 dry runs);
   * - `fn` gets a Tx with `ctx.simulation = true` whose `query` refuses transaction control (end/abort/begin, SET
   *   without LOCAL, RESET, DISCARD, session advisory locks) and whose `db` (drizzle) throws; SAVEPOINT / RELEASE /
   *   ROLLBACK TO stay allowed – the guard row is inserted at the top level BEFORE `fn`, so no savepoint can undo it,
   *   they cannot end the transaction, and the occupancy writes use them (23P01 handling – SEC FB-R3-SEC-BE-A-01);
   * - FB-R3-SEC-BE-A-02 (b): the transaction id read right after the guard must still be the current one when `fn`
   *   returns – a transaction ended by any path the statement filter missed is reported (500), never answered;
   * - ROLLBACK in `finally`, success or not; a failed ROLLBACK destroys the connection (never back to the pool).
   * The caller keeps the "inside a unit of work" marker (UnitOfWork.simulate) so no second connection is opened.
   */
  async simulate<T>(
    ctx: TenantContext,
    fn: (tx: Tx) => Promise<T>,
    options: { lockTimeoutMs: number; statementTimeoutMs: number },
  ): Promise<T> {
    const uow = unitOfWorkScope.getStore();
    if (uow !== undefined) {
      throw new Error(`nested database connection inside the unit of work of ${uow}`);
    }
    if (!ctx.organizationId || !ctx.propertyId) {
      throw new Error('Database.simulate needs a property context');
    }
    const client = await this.pool.connect();
    let broken = false;
    try {
      await client.query('BEGIN');
      await client.query(SET_CONTEXT_SQL, [
        ctx.organizationId,
        ctx.propertyId,
        ctx.userId ?? '',
        ctx.actorType,
        `${options.lockTimeoutMs}ms`,
        `${options.statementTimeoutMs}ms`,
      ]);
      await client.query(
        'INSERT INTO simulation_guard (organization_id, property_id) VALUES ($1, $2)',
        [ctx.organizationId, ctx.propertyId],
      );
      const before = await client.query<{ id: string }>('SELECT txid_current()::text AS id');
      const result = await fn(makeSimulationTx(client, { ...ctx, simulation: true }));
      const after = await client.query<{ id: string | null }>(
        'SELECT txid_current_if_assigned()::text AS id',
      );
      if (after.rows[0]?.id !== before.rows[0]?.id) {
        throw new Error('simulation transaction was ended inside the handler (ADR-015)');
      }
      return result;
    } finally {
      try {
        await client.query('ROLLBACK');
      } catch {
        broken = true; // connection unusable: destroy it instead of returning it to the pool
      }
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

/**
 * Transaction control a simulation tx refuses (FB-R3-SEC-ARC-01 (4)): anything that could end the transaction or
 * leak a setting to the pooled connection. Checked at the start of the text and after every `;`, on the raw text AND
 * with comments removed (a quote holding `--` cannot hide a statement – SEC FB-R3-SEC-BE-A-01 (2)).
 * This is a REMINDER for developers, not the security boundary: the boundary is the `simulation_guard` row (the
 * database refuses the commit) plus the transaction-id check of Database.simulate.
 */
const SIMULATION_FORBIDDEN =
  /(^|;)\s*(commit\b|end\b|abort\b|begin\b|start\s+transaction\b|prepare\s+transaction\b|rollback\b(?!\s+to\b)|reset\b|discard\b|set\b(?!\s+local\b))/i;
/** BE-B FB-R3-BE-B-BE-A-03 (b): a SESSION advisory lock outlives the rollback (the pooled connection keeps it). */
const SESSION_ADVISORY_LOCK = /\bpg_(try_)?advisory_lock(_shared)?\s*\(/i;

export function isForbiddenInSimulation(text: string): boolean {
  const bare = text.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, ' ');
  return (
    SIMULATION_FORBIDDEN.test(text) ||
    SIMULATION_FORBIDDEN.test(bare) ||
    SESSION_ADVISORY_LOCK.test(text)
  );
}

/** FB-R3-SEC-BE-A-02 (a) / BE-B 03 (a): drizzle on a simulation tx could send BEGIN/COMMIT itself – refused. */
const NO_DRIZZLE_IN_SIMULATION = new Proxy({} as NodePgDatabase<Schema>, {
  get() {
    throw new Error('drizzle (tx.db) is not available inside a simulation (ADR-015)');
  },
});

function makeSimulationTx(client: PoolClient, ctx: TenantContext): Tx {
  const inner = makeTx(client, ctx);
  return {
    ctx,
    db: NO_DRIZZLE_IN_SIMULATION,
    query: <R extends QueryResultRow>(text: string, params?: readonly unknown[]) => {
      if (isForbiddenInSimulation(text)) {
        return Promise.reject(
          new Error('transaction control is not allowed inside a simulation (ADR-015)'),
        );
      }
      return inner.query<R>(text, params);
    },
  };
}

/** Postgres error code helper (e.g. 23505 unique_violation, 23P01 exclusion_violation). */
export function pgCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code)
    : undefined;
}
