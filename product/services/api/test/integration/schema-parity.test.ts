/**
 * SQL ↔ schema parity (ARC s3-contract 4.2a-9, FB-R2-ARC-BE-S3-21). Migrations are hand-written SQL (the source
 * of truth); the drizzle `.ts` schema and the head snapshot are generated from `.ts`, so the CI step
 * "drizzle-kit generate creates nothing" only proves `.ts` = snapshot. This test closes the loop: after
 * `migrate`, it reads pg_catalog and compares with the HEAD snapshot (largest prefix in the journal):
 * - tables; columns (type, NOT NULL);
 * - CHECK constraints: names and bodies – both normalised by PostgreSQL itself (the snapshot body is
 *   re-created on an empty TEMP copy of the table and read back with pg_get_constraintdef);
 * - names of primary keys, foreign keys, unique constraints and indexes.
 * Objects drizzle cannot express (4.2a-2e) are a closed, hard-coded list below – each with its reason.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HAS_DB } from '../helpers/tenant';

const META = join(__dirname, '..', '..', 'src', 'db', 'migrations', 'meta');

/** 4.2a-2e: only in SQL – drizzle cannot express them. Name → reason. */
const SQL_ONLY_CONSTRAINTS: Record<string, string> = {
  reservation_folio_fk:
    'DEFERRABLE INITIALLY DEFERRED (0014) – booking ↔ folio created in one transaction',
  folio_primary_reservation_fk: 'DEFERRABLE INITIALLY DEFERRED (0014) – booking ↔ folio cycle',
  room_occupancy_no_overlap:
    'EXCLUDE USING gist (DEFERRABLE INITIALLY IMMEDIATE) – ADR-009 inventory',
  room_occupancy_range_check: 'CHECK on a daterange expression drizzle cannot express (0013)',
};
/** ERD: constraints that must stay DEFERRABLE in SQL (the snapshot cannot say it) → expected `INITIALLY`. */
const DEFERRABLE: Record<string, 'DEFERRED' | 'IMMEDIATE'> = {
  reservation_folio_fk: 'DEFERRED',
  folio_primary_reservation_fk: 'DEFERRED',
  minibar_check_replaced_by_fk: 'DEFERRED',
  room_occupancy_no_overlap: 'IMMEDIATE',
};
const SQL_ONLY_INDEXES: Record<string, string> = {
  guest_name_search_trgm_idx: 'GIN trigram index (pg_trgm) – guest search',
  room_occupancy_active_range_idx: 'GiST index on daterange – inventory lookups',
  room_occupancy_no_overlap: 'index behind the EXCLUDE constraint',
};
/**
 * Indexes present in BOTH (same name – the name check below passes) whose SQL definition carries an option the
 * snapshot cannot express (drizzle has no such option on an index). Name → option + reason; the option is checked
 * in pg_indexes, and no other index may carry it.
 */
const SQL_ONLY_INDEX_OPTIONS: Record<string, { option: string; reason: string }> = {
  minibar_check_live_checkout_key: {
    option: 'NULLS NOT DISTINCT',
    reason:
      '0066 (ARC 16.15/16.16): one live count per (stay, room, period) – a fridge without a fill (fill_id NULL) too',
  },
};
/** Cross-module FKs of 0014 (4.2a-2e: SQL only, each module's .ts stays independent of the others). */
const CROSS_MODULE_FKS: Record<string, string> = {
  reservation_quote_fk: 'reservations → sales (quote)',
  quote_converted_reservation_fk: 'sales → reservations',
  folio_line_reservation_fk: 'folio → reservations',
  folio_line_stay_night_fk: 'folio → reservations (stay_night)',
  payment_reservation_fk: 'payments → reservations',
  channel_fee_reservation_fk: 'folio → reservations',
  commission_reservation_fk: 'sales → reservations',
  deposit_notice_reservation_fk: 'payments → reservations',
  room_block_work_order_fk: 'reservations (room_block) → maintenance (work_order), 0056',
  hk_task_guest_request_fk: 'reservations (hk_task) → guest-portal (guest_request), 0057',
  work_order_guest_request_fk: 'maintenance (work_order) → guest-portal (guest_request), 0057',
  guest_request_work_order_fk: 'guest-portal (guest_request) → maintenance (work_order), 0057',
  website_booking_request_quote_fk: 'public-site → sales (quote), 0086',
  website_booking_request_reservation_fk: 'public-site → reservations, 0086',
  quote_website_request_fk: 'sales (quote) → public-site (website_booking_request), 0086',
};
/** Monthly partitions of the logs (BE-ARC-18) are created by log_ensure_month_partition(). */
const PARTITION = /_(y\d{4}m\d{2}|default)$/;

interface SnapColumn {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
}
interface SnapTable {
  name: string;
  columns: Record<string, SnapColumn>;
  indexes: Record<string, { name: string; isUnique: boolean }>;
  foreignKeys: Record<string, { name: string }>;
  compositePrimaryKeys: Record<string, { name: string }>;
  uniqueConstraints: Record<string, { name: string }>;
  checkConstraints: Record<string, { name: string; value: string }>;
}

function headSnapshot(): { file: string; tables: Record<string, SnapTable> } {
  const files = readdirSync(META)
    .filter((f) => /^\d{4}_snapshot\.json$/.test(f))
    .sort();
  const file = files[files.length - 1] as string;
  const journal = JSON.parse(readFileSync(join(META, '_journal.json'), 'utf8')) as {
    entries: Array<{ tag: string }>;
  };
  const largest = journal.entries
    .map((e) => e.tag.slice(0, 4))
    .sort()
    .at(-1);
  // 4.2a-2b: the head snapshot is named after the LARGEST prefix of the journal.
  expect(file).toBe(`${largest}_snapshot.json`);
  const snap = JSON.parse(readFileSync(join(META, file), 'utf8')) as {
    tables: Record<string, SnapTable>;
  };
  const tables: Record<string, SnapTable> = {};
  for (const t of Object.values(snap.tables)) tables[t.name] = t;
  return { file, tables };
}

/** Snapshot type → format_type() spelling. */
function normType(t: string): string {
  return t
    .replace(/\s+/g, '')
    .replace(/^time$/, 'timewithouttimezone')
    .replace(/^timestamp$/, 'timestampwithouttimezone')
    .replace(/^varchar/, 'charactervarying')
    .replace(/^char\(/, 'character(')
    .toLowerCase();
}

describe.skipIf(!HAS_DB)('schema parity – migrated SQL ↔ head drizzle snapshot (4.2a-9)', () => {
  let pg: Client;
  const snap = HAS_DB ? headSnapshot() : { file: '', tables: {} as Record<string, SnapTable> };

  beforeAll(async () => {
    pg = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    // The owner sees every table (RLS does not matter: only the catalogue is read).
    await pg.query('SET ROLE ottimo_owner');
  });
  afterAll(async () => {
    await pg?.end();
  });

  const tablesOf = async () =>
    (
      await pg.query<{ relname: string }>(
        `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
          ORDER BY 1`,
      )
    ).rows
      .map((r) => r.relname)
      .filter((n) => !PARTITION.test(n));

  it('every listed exception exists in SQL and is absent from the snapshot (no stale entries)', async () => {
    const names = [
      ...Object.keys(SQL_ONLY_CONSTRAINTS),
      ...Object.keys(SQL_ONLY_INDEXES),
      ...Object.keys(CROSS_MODULE_FKS),
    ];
    const { rows } = await pg.query<{ name: string }>(
      `SELECT conname AS name FROM pg_constraint WHERE conname = ANY($1::text[])
       UNION SELECT relname FROM pg_class WHERE relname = ANY($1::text[])`,
      [names],
    );
    expect(new Set(rows.map((r) => r.name))).toEqual(new Set(names));
    const inSnapshot = JSON.stringify(snap.tables);
    expect(names.filter((n) => inSnapshot.includes(`"${n}"`))).toEqual([]);
  });

  it('index options only in SQL are there (pg_indexes), on the listed indexes only; the snapshot keeps the index', async () => {
    const options = [...new Set(Object.values(SQL_ONLY_INDEX_OPTIONS).map((o) => o.option))];
    for (const option of options) {
      const { rows } = await pg.query<{ name: string }>(
        `SELECT i.indexname AS name FROM pg_indexes i
          WHERE i.schemaname = 'public' AND strpos(i.indexdef, $1) > 0
            AND NOT EXISTS (SELECT 1 FROM pg_constraint k JOIN pg_class c ON c.oid = k.conindid
                             WHERE c.relname = i.indexname)
          ORDER BY 1`,
        [option],
      );
      expect(rows.map((r) => r.name)).toEqual(
        Object.entries(SQL_ONLY_INDEX_OPTIONS)
          .filter(([, o]) => o.option === option)
          .map(([n]) => n)
          .sort(),
      );
    }
    const inSnapshot = Object.values(snap.tables).flatMap((t) =>
      Object.values(t.indexes).map((x) => x.name),
    );
    for (const name of Object.keys(SQL_ONLY_INDEX_OPTIONS)) expect(inSnapshot).toContain(name);
  });

  it('DEFERRABLE constraints of the ERD are still deferrable in SQL', async () => {
    const { rows } = await pg.query<{ name: string; deferrable: boolean; deferred: boolean }>(
      `SELECT conname AS name, condeferrable AS deferrable, condeferred AS deferred FROM pg_constraint
        WHERE conname = ANY($1::text[])`,
      [Object.keys(DEFERRABLE)],
    );
    expect(
      Object.fromEntries(
        rows.map((r) => [r.name, r.deferrable ? (r.deferred ? 'DEFERRED' : 'IMMEDIATE') : 'NO']),
      ),
    ).toEqual(DEFERRABLE);
  });

  it('same tables', async () => {
    expect(await tablesOf()).toEqual(Object.keys(snap.tables).sort());
  });

  it('same columns, types and NOT NULL', async () => {
    const { rows } = await pg.query<{ t: string; c: string; type: string; notnull: boolean }>(
      `SELECT c.relname AS t, a.attname AS c, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull
         FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
          AND a.attnum > 0 AND NOT a.attisdropped`,
    );
    const db = new Map(rows.map((r) => [`${r.t}.${r.c}`, r]));
    const diff: string[] = [];
    for (const t of Object.values(snap.tables)) {
      for (const col of Object.values(t.columns)) {
        const key = `${t.name}.${col.name}`;
        const r = db.get(key);
        if (!r) {
          diff.push(`${key}: missing in SQL`);
          continue;
        }
        db.delete(key);
        if (normType(r.type) !== normType(col.type)) diff.push(`${key}: ${r.type} ≠ ${col.type}`);
        if (r.notnull !== (col.notNull || col.primaryKey)) {
          diff.push(`${key}: NOT NULL ${r.notnull} ≠ ${col.notNull}`);
        }
      }
    }
    for (const key of db.keys())
      if (!PARTITION.test(key.split('.')[0] as string)) diff.push(`${key}: missing in snapshot`);
    expect(diff).toEqual([]);
  });

  it('same CHECK constraints – names and bodies normalised by PostgreSQL', async () => {
    const { rows } = await pg.query<{ t: string; name: string; def: string }>(
      `SELECT c.relname AS t, k.conname AS name, pg_get_constraintdef(k.oid) AS def
         FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND k.contype = 'c' AND NOT c.relispartition`,
    );
    const db = new Map(rows.map((r) => [r.name, r]));
    const diff: string[] = [];
    await pg.query('BEGIN');
    try {
      for (const t of Object.values(snap.tables)) {
        const checks = Object.values(t.checkConstraints);
        if (checks.length === 0) continue;
        const tmp = `parity_${t.name}`;
        await pg.query(`CREATE TEMP TABLE "${tmp}" (LIKE public."${t.name}") ON COMMIT DROP`);
        for (const k of checks) {
          const r = db.get(k.name);
          if (!r) {
            diff.push(`${t.name}.${k.name}: missing in SQL`);
            continue;
          }
          db.delete(k.name);
          if (r.t !== t.name) diff.push(`${k.name}: on ${r.t} ≠ ${t.name}`);
          const body = k.value.split(`"${t.name}".`).join('');
          await pg.query(
            `ALTER TABLE "${tmp}" ADD CONSTRAINT "${k.name}" CHECK (${body}) NOT VALID`,
          );
          const { rows: back } = await pg.query<{ def: string }>(
            `SELECT pg_get_constraintdef(k.oid) AS def FROM pg_constraint k
              WHERE k.conrelid = $1::regclass AND k.conname = $2`,
            [`"${tmp}"`, k.name],
          );
          const fromSnap = (back[0]?.def ?? '').replace(/ NOT VALID$/, '');
          if (fromSnap !== r.def) diff.push(`${k.name}:\n  SQL  ${r.def}\n  .ts  ${fromSnap}`);
        }
      }
    } finally {
      await pg.query('ROLLBACK');
    }
    for (const name of db.keys()) {
      if (!(name in SQL_ONLY_CONSTRAINTS)) diff.push(`${name}: CHECK only in SQL`);
    }
    expect(diff).toEqual([]);
  });

  it('same names of primary keys, foreign keys, unique constraints and indexes', async () => {
    const { rows: cons } = await pg.query<{ t: string; name: string; type: string }>(
      `SELECT c.relname AS t, k.conname AS name, k.contype AS type
         FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND k.contype IN ('p', 'f', 'u', 'x') AND NOT c.relispartition`,
    );
    const { rows: idx } = await pg.query<{ t: string; name: string }>(
      `SELECT t.relname AS t, i.relname AS name
         FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid JOIN pg_class t ON t.oid = x.indrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public' AND NOT t.relispartition
          AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = x.indexrelid)`,
    );
    const sqlNames = new Set([
      ...cons.filter((r) => !PARTITION.test(r.t)).map((r) => `${r.t}:${r.name}`),
      ...idx.filter((r) => !PARTITION.test(r.t)).map((r) => `${r.t}:${r.name}`),
    ]);
    const diff: string[] = [];
    for (const t of Object.values(snap.tables)) {
      const names = [
        ...Object.values(t.foreignKeys).map((x) => x.name),
        ...Object.values(t.uniqueConstraints).map((x) => x.name),
        ...Object.values(t.indexes).map((x) => x.name),
        ...Object.values(t.compositePrimaryKeys).map((x) => x.name),
        ...(Object.values(t.columns).some((c) => c.primaryKey) ? [`${t.name}_pkey`] : []),
      ];
      for (const n of names) {
        if (!sqlNames.delete(`${t.name}:${n}`)) diff.push(`${t.name}.${n}: missing in SQL`);
      }
    }
    for (const key of sqlNames) {
      const name = key.split(':')[1] as string;
      if (name in SQL_ONLY_CONSTRAINTS || name in SQL_ONLY_INDEXES || name in CROSS_MODULE_FKS) {
        continue;
      }
      diff.push(`${key}: only in SQL`);
    }
    expect(diff).toEqual([]);
  });
});
