/**
 * ARC FB-R3-ARC-Q51-02 + SEC FB-R3-SEC-Q51-02 – unit, no database: parameter history is append-only except ONE path –
 * `ParametersService.cancelScheduled` (OpenAPI 0.3.8 `cancelScheduledParameter`) deletes a row not yet in force. No other
 * source file may `DELETE FROM config_parameter` (the 0084 trigger also refuses a row in force or past).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'migrations' ? [] : files(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

describe('config_parameter rows are deleted by cancelScheduled only', () => {
  it('one DELETE statement, in ParametersService.cancelScheduled', () => {
    const hits: string[] = [];
    for (const p of files(SRC)) {
      const text = readFileSync(p, 'utf8');
      const re = /DELETE\s+FROM\s+config_parameter\b/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const before = text.slice(0, m.index);
        const method = before.lastIndexOf('  async ');
        const name = /async (\w+)/.exec(text.slice(method))?.[1] ?? '?';
        hits.push(`${relative(SRC, p)}#${name}`);
      }
    }
    expect(hits).toEqual(['modules/platform/internal/parameters.service.ts#cancelScheduled']);
  });

  it('the 0084 migration guards the table with a BEFORE DELETE trigger', () => {
    const sql = readFileSync(
      join(SRC, 'db', 'migrations', '0084_parameter_cancel_scheduled.sql'),
      'utf8',
    );
    expect(sql).toMatch(
      /CREATE TRIGGER config_parameter_delete_future_only BEFORE DELETE ON config_parameter/,
    );
  });
});
