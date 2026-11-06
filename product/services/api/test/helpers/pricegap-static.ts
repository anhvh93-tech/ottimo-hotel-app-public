/**
 * V5-73 / V5-1A (T1A-5): the STATIC part of ops-check `pricegap` – the one constant SQL text of `check_pricegap` in
 * `product/infra/server/bin/ops-check.sh`, read from the script itself so a test never checks a stale copy. In
 * production it runs as ottimo_readonly (BYPASSRLS, every property); here it runs in a tenant's context, so RLS
 * keeps the count to that property.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Tx } from '../../src/db/database';

const OPS_CHECK = join(__dirname, '../../../../infra/server/bin/ops-check.sh');

export function pricegapStaticSql(): string {
  const script = readFileSync(OPS_CHECK, 'utf8');
  const fn = script.indexOf('check_pricegap() {');
  if (fn < 0) throw new Error('ops-check.sh: check_pricegap not found');
  // `if out=$(psql_ro <<'SQL' 2>"$cmd_err"` – the SQL text starts on the next line and ends at a line `SQL`.
  const heredoc = script.indexOf("<<'SQL'", fn);
  const start = heredoc < 0 ? -1 : script.indexOf('\n', heredoc);
  const end = start < 0 ? -1 : script.indexOf('\nSQL\n', start);
  if (start < 0 || end < 0) throw new Error('ops-check.sh: pricegap static SQL not found');
  const sql = script.slice(start + 1, end).trim();
  if (!/^SELECT count\(\*\)/.test(sql)) throw new Error('ops-check.sh: unexpected pricegap SQL');
  return sql;
}

/** Number of sellable rooms with a website room type and no list price on their first sellable day. */
export async function pricegapStatic(tx: Tx): Promise<number> {
  const { rows } = await tx.query<{ count: string }>(pricegapStaticSql());
  return Number(rows[0]!.count);
}
