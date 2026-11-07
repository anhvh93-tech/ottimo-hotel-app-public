/**
 * Manager-only audit gate (SEC FB-R5-SEC-BE-131-01, ARC FB-R5-ARC-BE-131-01; audit/public/audit-visibility), no DB:
 * - the scan: every read of `audit_event` in the code of `src` (migrations and comments aside; after FROM, JOIN or a
 *   comma, with ONLY, quotes or a schema too – ARC FB-R5-ARC-BE-149-01) sits in a file that applies BOTH
 *   `auditVisibleWhere` and `redactAuditFields` at least as many times as it reads the table – or in the list of
 *   exceptions below, each with its reason and its number of reads. A third reader of the audit log, or one more read
 *   in an exception, cannot slip past the gate;
 * - the folio module declares the commission as manager-only in this process (folio/audit-entities.ts);
 * - the helpers: OWN/MGR read in full; below them the commission rows and the `commissionVnd` key go.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
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

/**
 * Readers of audit_event that never show a row to a caller below OWN/MGR – with the reason and the number of reads the
 * review saw (ARC FB-R5-ARC-BE-149-01 (2)): the exception covers those reads, not the whole file, so one more read in
 * such a file is red until it is reviewed too.
 */
const EXCEPTIONS: Record<string, { reason: string; reads: number }> = {
  'modules/housekeeping/internal/work-orders.service.ts': {
    reason:
      'history[] of a work order: `work_order.*` rows of that entity only, never a commission row',
    reads: 1,
  },
  'modules/identity/internal/auth.service.ts': {
    reason: 'MFA lockout: SELECT 1 on `mfa.verify_failed` rows, nothing returned to the caller',
    reads: 1,
  },
  'modules/audit/public/line-reductions.ts': {
    reason: 'BR-438 count: returns { actorUserId, n } only (OWN-only "Cần chú ý"), no before/after',
    reads: 1,
  },
};

/**
 * A read of the table (ARC FB-R5-ARC-BE-149-01 (1)): after FROM, JOIN or a comma (`FROM a, audit_event e`, with or
 * without a space), also `FROM ONLY`, `"audit_event"`, `public.audit_event` and `"public"."audit_event"`. Not a
 * partition (`audit_event_p202611`): migration 0001 revokes every partition from ottimo_app, so the database refuses
 * that read itself.
 */
const READ = /(?:\b(?:FROM|JOIN)\s+|,\s*)(?:ONLY\s+)?(?:"?\w+"?\.)?"?audit_event\b/gi;
const count = (src: string, re: RegExp) => [...src.matchAll(re)].length;

/**
 * The code of a file without its comments (ARC FB-R5-ARC-BE-149-01 (1)). The TypeScript parser decides what a comment
 * is, so the SQL of a string or template stays as written (a `//` in a URL too), and a comment that names the table –
 * or a gate helper – counts for nothing.
 */
const printer = ts.createPrinter({ removeComments: true });
const code = (file: string, src: string) =>
  printer.printFile(ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS));

describe('manager-only audit gate (SEC 131-01, ARC 131-01)', () => {
  it('every read of audit_event in src goes through auditVisibleWhere + redactAuditFields, or is a listed exception', () => {
    const readers = files(SRC)
      .map((f) => ({ f, raw: readFileSync(f, 'utf8') }))
      // Only a file that names the table is parsed: taking the comments out never adds a read.
      .filter(({ raw }) => /audit_event/i.test(raw))
      .map(({ f, raw }) => {
        const src = code(f, raw);
        return { r: rel(f), src, reads: count(src, READ) };
      })
      .filter(({ reads }) => reads > 0);
    // Sanity: the scan sees the two gated readers and the listed exceptions.
    expect(readers.map((x) => x.r).sort()).toEqual(
      [
        'modules/audit/internal/audit-log.controller.ts',
        'modules/reservations/internal/rack.service.ts',
        ...Object.keys(EXCEPTIONS),
      ].sort(),
    );
    // ARC FB-R5-ARC-BE-149-01 (2): each exception has exactly the reads its review saw.
    expect(
      Object.fromEntries(
        readers.filter(({ r }) => r in EXCEPTIONS).map(({ r, reads }) => [r, reads]),
      ),
    ).toEqual(Object.fromEntries(Object.entries(EXCEPTIONS).map(([r, e]) => [r, e.reads])));
    const offenders = readers
      .filter(({ r }) => !(r in EXCEPTIONS))
      .filter(
        ({ src, reads }) =>
          count(src, /\bauditVisibleWhere\(/g) < reads ||
          count(src, /\bredactAuditFields\(/g) < 2 * reads,
      )
      .map(({ r }) => r);
    expect(offenders).toEqual([]);
  });

  // ARC FB-R5-ARC-BE-149-01 (4): the regex and the comment stripping on sample strings, so neither is loosened later.
  it('S5–S8: a comma join, FROM ONLY, a quoted name, a schema – each is one read (as FROM / JOIN are)', () => {
    for (const sql of [
      'SELECT 1 FROM app_user u, audit_event e WHERE e.actor_user_id = u.id', // S5
      'SELECT 1 FROM app_user u,audit_event e', // S5, no space after the comma: still the comma, then the name
      'SELECT 1 FROM ONLY audit_event e', // S6
      'SELECT 1 FROM "audit_event" e', // S7
      'SELECT 1 FROM public.audit_event e', // S8
      'SELECT 1 FROM "public"."audit_event" e',
      'SELECT 1 FROM audit_event e',
      'SELECT 1 FROM app_user u\n  left join\n    audit_event e ON e.actor_user_id = u.id',
    ]) {
      expect(count(sql, READ), sql).toBe(1);
    }
  });

  it('a comment that names the table or a gate helper counts for nothing; the SQL of a template stays', () => {
    const src = [
      '/** Reads FROM audit_event (doc only). */',
      '// JOIN audit_event e – and redactAuditFields(x) in a comment',
      "const q = `SELECT 1 FROM audit_event e WHERE e.note <> 'http://x' /* SQL, not TS */`;",
      'const r = 1; /* , audit_event */',
    ].join('\n');
    expect(count(src, READ)).toBe(4);
    const c = code('sample.ts', src);
    expect(count(c, READ)).toBe(1);
    expect(c).toContain("FROM audit_event e WHERE e.note <> 'http://x' /* SQL, not TS */");
    expect(count(c, /\bredactAuditFields\(/g)).toBe(0);
  });

  it('not a read: the writer, a string that names the table, an index name, a partition', () => {
    for (const s of [
      'INSERT INTO audit_event (organization_id, occurred_at) VALUES ($1, $2)',
      "for (const table of ['audit_event', 'c3_access_log']) run(table);",
      "primaryKey({ name: 'audit_event_pkey', columns: [t.id, t.occurredAt] })",
      'SELECT 1 FROM audit_event_p202611 e', // revoked from ottimo_app (migration 0001)
      'CREATE INDEX x ON audit_event (a), audit_event_property_actor_idx',
    ]) {
      expect(count(s, READ), s).toBe(0);
    }
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
