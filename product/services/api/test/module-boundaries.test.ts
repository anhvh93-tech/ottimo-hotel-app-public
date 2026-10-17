/**
 * Module boundaries and closed lists that a type checker cannot see (no DB):
 * - ARC B-3: `frontdesk` + `reservations` are one aggregate; NO other module imports `reservations/public/stay-port`
 *   (it re-exports reservations internals for the front desk only).
 * - coding-standards 2 [LINT]: no module imports another module's `internal/`.
 * - ARC-BE-S3-16: `ModuleRef` lookups inside src/modules only where listed with a reason (they hide provider
 *   cycles instead of removing them).
 * - OpenAPI 0.3.6 bổ sung 2 (`AuditEvent.action`): the `money` audit actions are a closed set – the server list
 *   equals the contract and every literal action passed to `recordMoney` belongs to it.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MONEY_AUDIT_ACTIONS } from '../src/modules/audit/public/money-actions';

const SRC = join(__dirname, '..', 'src');
const MODULES = join(SRC, 'modules');
const OPENAPI = join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const rel = (f: string) => relative(SRC, f).split(sep).join('/');
const moduleOf = (r: string) => (r.startsWith('modules/') ? r.split('/')[1] : null);

function imports(f: string): string[] {
  const src = readFileSync(f, 'utf8');
  return [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] as string);
}

describe('module boundaries', () => {
  it('only the front desk and reservations import reservations/public/stay-port (ARC B-3)', () => {
    const offenders = files(SRC)
      .map((f) => ({ r: rel(f), deps: imports(f) }))
      .filter(({ r }) => !['frontdesk', 'reservations'].includes(moduleOf(r) ?? ''))
      .filter(({ deps }) => deps.some((d) => /reservations\/public\/stay-port$/.test(d)))
      .map(({ r }) => r);
    expect(offenders).toEqual([]);
  });

  it("no module imports another module's internal/ (coding-standards 2)", () => {
    const offenders: string[] = [];
    for (const f of files(MODULES)) {
      const r = rel(f);
      const own = moduleOf(r);
      for (const d of imports(f)) {
        const m =
          /^\.\.\/\.\.\/([a-z-]+)\/internal\//.exec(d) ?? /^\.\.\/([a-z-]+)\/internal\//.exec(d);
        if (m && m[1] !== own) offenders.push(`${r} → ${d}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('ModuleRef only where listed (ARC-BE-S3-16)', () => {
    // Each entry = the zone that owns the removal (ReservationReadPort / constructor injection).
    const allowed: Record<string, string> = {
      'modules/files/public/attachment.service.ts':
        'BE-C: lazy RESERVATION_SALES_PORT – switch to ReservationReadPort (constructor)',
      'modules/payments/public/payment.service.ts':
        'BE-B: lazy ATTACHMENT_USAGE – constructor injection once files no longer needs reservations',
    };
    const code = (r: string) =>
      readFileSync(join(SRC, r), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
    const users = files(MODULES)
      .map(rel)
      .filter((r) => /\bModuleRef\b/.test(code(r)));
    expect(users.filter((r) => !(r in allowed))).toEqual([]);
  });
});

describe('money audit actions (closed set – OpenAPI AuditEvent.action)', () => {
  it('the server list equals the contract list', () => {
    const yaml = readFileSync(OPENAPI, 'utf8');
    const marker = 'mã lạ → `mlog.a_other`):';
    const start = yaml.indexOf(marker) + marker.length;
    const end = yaml.indexOf('`payment.recorded`: phân biệt', start);
    expect(start).toBeGreaterThan(marker.length);
    expect(end).toBeGreaterThan(start);
    const contract = [...yaml.slice(start, end).matchAll(/`([a-z_]+\.[a-z_]+)`/g)].map(
      (m) => m[1] as string,
    );
    expect([...new Set(contract)].sort()).toEqual([...MONEY_AUDIT_ACTIONS].sort());
  });

  it('every literal action given to recordMoney is in the list', () => {
    const list = new Set<string>(MONEY_AUDIT_ACTIONS);
    const unknown: string[] = [];
    for (const f of files(SRC)) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/recordMoney\(/g)) {
        const call = src.slice(m.index ?? 0, (m.index ?? 0) + 800);
        const action = /action:\s*([^,\n]+)/.exec(call)?.[1] ?? '';
        for (const lit of action.matchAll(/'([a-z_]+\.[a-z_]+)'/g)) {
          if (!list.has(lit[1] as string)) unknown.push(`${rel(f)}: ${lit[1]}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });
});

/**
 * ARC openapi-0.3.7.md 11.4 – the reporting read model (BE-D): C6 it writes nothing of another module (only
 * its J2 job slot), C5 it reads only the tables it declares. SQL keywords are upper case in this code base, so
 * `FROM`/`JOIN` are matched case-sensitively (JS `from '…'` never matches); CTE names are not tables.
 */
describe('reporting read model (ARC 11.4 C5/C6)', () => {
  const REPORTING = join(MODULES, 'reporting');
  const codeOf = (f: string) =>
    readFileSync(f, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  const declared = (name: string): string[] => {
    const src = readFileSync(join(REPORTING, 'reporting.module.ts'), 'utf8');
    const m = new RegExp(`export const ${name} = \\[([^\\]]*)\\]`).exec(src);
    return [...(m?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map((x) => x[1] as string);
  };
  const READS = declared('REPORTING_READ_TABLES');
  const WRITES = declared('REPORTING_WRITE_TABLES');

  it('declares its tables (C5)', () => {
    expect(READS.length).toBeGreaterThan(0);
    expect(WRITES).toEqual(['job_run']);
  });

  it('never writes or locks rows of other modules – only its job slot (C2, C6)', () => {
    const bad: string[] = [];
    for (const f of files(REPORTING)) {
      const code = codeOf(f);
      for (const m of code.matchAll(/\bINSERT\s+INTO\s+([a-z_][a-z0-9_]*)/g)) {
        if (!WRITES.includes(m[1] as string)) bad.push(`${rel(f)}: INSERT ${m[1]}`);
      }
      for (const m of code.matchAll(/\bUPDATE\s+([a-z_][a-z0-9_]*)\s+SET\b/g)) {
        bad.push(`${rel(f)}: UPDATE ${m[1]}`);
      }
      for (const m of code.matchAll(/\bDELETE\s+FROM\s+([a-z_][a-z0-9_]*)/g)) {
        bad.push(`${rel(f)}: DELETE ${m[1]}`);
      }
      if (/\bFOR\s+(UPDATE|SHARE|NO KEY UPDATE|KEY SHARE)\b/.test(code))
        bad.push(`${rel(f)}: row lock`);
    }
    expect(bad).toEqual([]);
  });

  it('reads only the declared tables (C5)', () => {
    const undeclared: string[] = [];
    for (const f of files(REPORTING)) {
      const code = codeOf(f);
      const ctes = new Set(
        [...code.matchAll(/(?:WITH|,)\s*([a-z_][a-z0-9_]*)\s+AS\s*\(/g)].map((m) => m[1] as string),
      );
      for (const m of code.matchAll(/\b(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)/g)) {
        const t = m[1] as string;
        if (ctes.has(t) || READS.includes(t) || WRITES.includes(t)) continue;
        undeclared.push(`${rel(f)}: ${t}`);
      }
    }
    expect(undeclared).toEqual([]);
  });
});
