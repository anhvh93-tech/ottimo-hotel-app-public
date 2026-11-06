/**
 * Manager-only audit gate (SEC FB-R5-SEC-BE-131-01, ARC FB-R5-ARC-BE-131-01; audit/public/audit-visibility), no DB:
 * - the scan: every `FROM` / `JOIN audit_event` in `src` (migrations aside) sits in a file that applies BOTH
 *   `auditVisibleWhere` and `redactAuditFields` at least as many times as it reads the table – or in the list of
 *   exceptions below, each with its reason. A third reader of the audit log cannot slip past the gate;
 * - the folio module declares the commission as manager-only in this process (folio/audit-entities.ts);
 * - the helpers: OWN/MGR read in full; below them the commission rows and the `commissionVnd` key go.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import '../src/modules/folio/audit-entities';
import {
  auditVisibleWhere,
  managerOnlyAuditSnapshot,
  redactAuditFields,
  seesFullAudit,
} from '../src/modules/audit/public/audit-visibility';
import { applyPct } from '../src/modules/reservations/public/pricing';

/** Test-only rate (SEC G3) – an odd value unrelated to any real table; the room amount is an odd test value too. */
const test_rate_short = 1.37;
const test_room_vnd = 1_234_500;

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'migrations' ? [] : files(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

const rel = (f: string) => relative(SRC, f).split(sep).join('/');

/** Readers of audit_event that never show a row to a caller below OWN/MGR – with the reason. */
const EXCEPTIONS: Record<string, string> = {
  'modules/housekeeping/internal/work-orders.service.ts':
    'history[] of a work order: `work_order.*` rows of that entity only, never a commission row',
  'modules/identity/internal/auth.service.ts':
    'MFA lockout: SELECT 1 on `mfa.verify_failed` rows, nothing returned to the caller',
  'modules/audit/public/line-reductions.ts':
    'BR-438 count: returns { actorUserId, n } only (OWN-only "Cần chú ý"), no before/after',
};

const READ = /\b(?:FROM|JOIN)\s+audit_event\b/gi;
const count = (src: string, re: RegExp) => [...src.matchAll(re)].length;

describe('manager-only audit gate (SEC 131-01, ARC 131-01)', () => {
  it('every read of audit_event in src goes through auditVisibleWhere + redactAuditFields, or is a listed exception', () => {
    const readers = files(SRC)
      .map((f) => ({ r: rel(f), src: readFileSync(f, 'utf8') }))
      .filter(({ src }) => count(src, READ) > 0);
    // Sanity: the scan sees the two gated readers and the listed exceptions.
    expect(readers.map((x) => x.r).sort()).toEqual(
      [
        'modules/audit/internal/audit-log.controller.ts',
        'modules/reservations/internal/rack.service.ts',
        ...Object.keys(EXCEPTIONS),
      ].sort(),
    );
    const offenders = readers
      .filter(({ r }) => !(r in EXCEPTIONS))
      .filter(
        ({ src }) =>
          count(src, /\bauditVisibleWhere\(/g) < count(src, READ) ||
          count(src, /\bredactAuditFields\(/g) < 2 * count(src, READ),
      )
      .map(({ r }) => r);
    expect(offenders).toEqual([]);
  });

  it('the folio module declares the commission manager-only (rows commission.*, key commissionVnd)', () => {
    const s = managerOnlyAuditSnapshot();
    expect(s.entityTypes).toContain('commission');
    expect(s.fields).toContain('commissionVnd');
  });

  it('OWN/MGR read in full; FD, FDL, SAL, CTV, HK get the clause and the redaction', () => {
    const params: unknown[] = [];
    const ph = (v: unknown) => {
      params.push(v);
      return `$${params.length}`;
    };
    for (const roles of [['owner'], ['manager'], ['front_desk', 'manager']]) {
      expect(seesFullAudit(roles)).toBe(true);
      expect(auditVisibleWhere('e', ph, roles)).toEqual([]);
    }
    expect(params).toEqual([]);
    for (const roles of [
      ['front_desk'],
      ['front_desk_lead'],
      ['sales_staff'],
      ['collaborator'],
      ['housekeeping'],
    ]) {
      expect(seesFullAudit(roles)).toBe(false);
      params.length = 0;
      const where = auditVisibleWhere('e', ph, roles);
      expect(where).toEqual([`COALESCE(e.entity_type, '') <> ALL($1::text[])`]);
      expect(params[0]).toContain('commission');
    }

    // SEC G3 (FB-R5-SEC-BE-149-01): the named test rate, the amounts computed from it – only the keys matter here.
    const commissionVnd = applyPct(test_room_vnd, test_rate_short, 1);
    const line = { roomVnd: test_room_vnd, nights: 2, commissionVnd, sync: 'confirmed' };
    const row = {
      status: 'projected',
      ratePct: test_rate_short,
      baseVnd: test_room_vnd,
      amountVnd: commissionVnd,
    };
    expect(redactAuditFields('folio', line, ['manager'])).toBe(line);
    expect(redactAuditFields('commission', row, ['owner'])).toBe(row);
    expect(redactAuditFields('folio', line, ['front_desk'])).toEqual({
      roomVnd: test_room_vnd,
      nights: 2,
      sync: 'confirmed',
    });
    // A manager-only row that got past the clause still shows nothing.
    expect(redactAuditFields('commission', row, ['front_desk_lead'])).toBeNull();
    // Nothing to hide → the same object; null stays null.
    const plain = { amountVnd: 35_000, category: 'minibar' };
    expect(redactAuditFields('folio_line', plain, ['front_desk'])).toBe(plain);
    expect(redactAuditFields('folio', null, ['front_desk'])).toBeNull();
  });
});
