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
