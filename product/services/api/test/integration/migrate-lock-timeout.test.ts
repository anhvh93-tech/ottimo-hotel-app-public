/**
 * FB-INV-012 contract §12.6 (QA Q25): the migrator waits at most `lock_timeout` for a table lock. A pending migration
 * that needs a lock another session holds fails with 55P03 inside the timeout, nothing is recorded in
 * `__drizzle_migrations`, nothing is changed, and the error names the migration ("retry off-peak").
 * Uses a probe table of its own (not `payment`) so other suites running on the same database are never queued.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MigrationLockTimeoutError, runMigrations } from '../../src/db/migrate';
import { HAS_DB } from '../helpers/tenant';

const SRC = join(__dirname, '..', '..', 'src', 'db', 'migrations');
const PROBE = 'zz_lock_timeout_probe';
const TAG = '0999_lock_timeout_probe';

describe.skipIf(!HAS_DB)('§12.6 – migrator lock_timeout (Q25)', () => {
  const url = process.env.MIGRATION_DATABASE_URL as string;
  let dir: string;
  let holder: Client;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ottimo-mig-'));
    cpSync(SRC, dir, { recursive: true });
    const journalPath = join(dir, 'meta', '_journal.json');
    const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
      entries: Array<{
        idx: number;
        version: string;
        when: number;
        tag: string;
        breakpoints: boolean;
      }>;
    };
    const last = journal.entries[journal.entries.length - 1]!;
    journal.entries.push({
      idx: last.idx + 1,
      version: last.version,
      when: last.when + 2000,
      tag: TAG,
      breakpoints: true,
    });
    writeFileSync(journalPath, JSON.stringify(journal, null, 2));
    writeFileSync(
      join(dir, `${TAG}.sql`),
      `ALTER TABLE ${PROBE} ADD COLUMN probe_value integer;\n`,
    );

    holder = new Client({ connectionString: url });
    await holder.connect();
    await holder.query('SET ROLE ottimo_owner');
    await holder.query(`CREATE TABLE IF NOT EXISTS ${PROBE} (id integer PRIMARY KEY)`);
  });
  afterAll(async () => {
    await holder?.query('ROLLBACK').catch(() => undefined);
    await holder?.query(`DROP TABLE IF EXISTS ${PROBE}`).catch(() => undefined);
    await holder?.end();
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  const applied = async (): Promise<number> => {
    const { rows } = await holder.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations',
    );
    return rows[0]!.n;
  };

  it('a held lock → MigrationLockTimeoutError within the timeout; nothing recorded, nothing changed', async () => {
    const before = await applied();
    await holder.query('BEGIN');
    await holder.query(`LOCK TABLE ${PROBE} IN ACCESS SHARE MODE`);
    const started = Date.now();
    const err = await runMigrations(url, dir, { lockTimeout: '1s' }).catch((e: unknown) => e);
    const waited = Date.now() - started;
    await holder.query('ROLLBACK');
    expect(err).toBeInstanceOf(MigrationLockTimeoutError);
    expect((err as Error).message).toContain(TAG);
    expect((err as Error).message).toContain('retry off-peak');
    expect(waited).toBeLessThan(8000);
    expect(await applied()).toBe(before);
    const { rows } = await holder.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'probe_value'`,
      [PROBE],
    );
    expect(rows).toHaveLength(0);
  });

  it('a bad MIGRATION_LOCK_TIMEOUT stops before connecting', async () => {
    await expect(runMigrations(url, dir, { lockTimeout: '0s' })).rejects.toThrow(/1s–120s/);
    await expect(runMigrations(url, dir, { lockTimeout: '10m' })).rejects.toThrow(/1s–120s/);
  });
});
