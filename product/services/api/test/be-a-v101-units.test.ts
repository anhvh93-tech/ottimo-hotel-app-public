/**
 * BE-A v1.0.1 units (no database): ADR-015 / FB-R3-SEC-ARC-01 (4) – what a simulation tx refuses; the B16 controller
 * routes a dry run to `uow.simulate` only (never `uow.run`), and only B16 uses the rolled-back pattern.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isForbiddenInSimulation } from '../src/db/database';

describe('simulation tx – transaction control (FB-R3-SEC-ARC-01 (4))', () => {
  it.each([
    'COMMIT',
    'commit',
    '  COMMIT;',
    'END',
    'END TRANSACTION',
    'ABORT',
    'ROLLBACK',
    'rollback;',
    'BEGIN',
    'START TRANSACTION',
    "PREPARE TRANSACTION 'x'",
    "COMMIT PREPARED 'x'",
    "SET statement_timeout = '0'",
    'SET SESSION lock_timeout = 0',
    'set role ottimo_owner',
    'RESET ALL',
    'DISCARD ALL',
    'SELECT 1; COMMIT',
    'SELECT 1;commit',
    '/* x */ COMMIT',
    '-- note\nCOMMIT',
  ])('refuses %j', (sql) => {
    expect(isForbiddenInSimulation(sql)).toBe(true);
  });

  it.each([
    'SELECT 1',
    "SELECT set_config('lock_timeout', '1000ms', true)",
    "SET LOCAL statement_timeout = '4s'",
    'SAVEPOINT occupancy_write',
    'RELEASE SAVEPOINT occupancy_write',
    'ROLLBACK TO SAVEPOINT occupancy_write',
    'rollback to occupancy_write',
    'UPDATE reservation SET version = version + 1 WHERE id = $1',
    'INSERT INTO folio_line (description) VALUES ($1)',
    "SELECT 'commit' AS word",
    'WITH x AS (SELECT 1) UPDATE stay_night SET night_state = $1',
  ])('allows %j', (sql) => {
    expect(isForbiddenInSimulation(sql)).toBe(false);
  });
});

describe('B16 dry run wiring (ADR-015)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

  it('the B16 controller sends `dryRun: true` to uow.simulate and the write to uow.run – never the other way', () => {
    const c = src('modules/frontdesk/internal/frontdesk.controller.ts');
    const start = c.indexOf("@Operation('earlyDeparture')");
    const end = c.indexOf('@Get(', start);
    const handler = c.slice(start, end);
    const dry = handler.indexOf('isDryRun(body)');
    const sim = handler.indexOf('this.uow.simulate(');
    const run = handler.indexOf('this.uow.run(');
    expect(dry).toBeGreaterThan(0);
    expect(sim).toBeGreaterThan(dry);
    expect(run).toBeGreaterThan(sim);
    // the dry branch returns before the write
    expect(handler.slice(sim, run)).toMatch(/return preview;/);
  });

  it('Database.simulate has no commit path; uow.simulate is used by B16 only (ADR-015 point 5: a second user needs ARC)', () => {
    const d = src('db/database.ts');
    const body = d.slice(d.indexOf('async simulate<T>('), d.indexOf('async entry<T>('));
    expect(body).not.toMatch(/['"`]COMMIT/i);
    expect(body).toMatch(/finally\s*{[\s\S]*ROLLBACK/);
    const users: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.ts') && /\.simulate\(/.test(readFileSync(p, 'utf8'))) users.push(p);
      }
    };
    walk(join(__dirname, '..', 'src', 'modules'));
    expect(users.map((p) => p.slice(p.indexOf('modules/')))).toEqual([
      'modules/frontdesk/internal/frontdesk.controller.ts',
    ]);
  });
});
