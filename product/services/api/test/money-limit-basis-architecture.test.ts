/**
 * Architecture guards of BR-433 (d) v0.4.1 and BR-433 (a)(b) (ARC FB-R3-ARC-BEB-S1-08, S1-10; SEC FB-R3-SEC-BE-B-07) and
 * of the notification kind CHECK (ARC S1-09) – unit, no database (reads the source and the migrations).
 * - `stay_night.reference_rate_vnd` is written only by the reservations module's system price paths, never by A31
 *   (`stay-night-pricing.ts`, `setNightRate`);
 * - `folio.limit_basis_checkout_vnd` is written only by FolioService.settle;
 * - the limit basis is read only through `FolioService.limitBasisVnd` (no `nightRateBasis` / `folioNightBasisVnd` left);
 * - every `approvals.submit` of a waiver (`foc` / `special_discount`) hands the folio's `waiverLimitInput`;
 * - the staff_notification CHECK of the newest migration that rewrites it = STAFF_NOTIFICATION_KINDS, and it only ADDS
 *   kinds to the previous list.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STAFF_NOTIFICATION_KINDS } from '../src/db/schema/frontdesk';

const SRC = join(__dirname, '..', 'src');
const MIGRATIONS = join(SRC, 'db', 'migrations');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'migrations' ? [] : files(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}
const sources = files(join(SRC, 'modules')).map((p) => ({
  path: relative(SRC, p),
  text: readFileSync(p, 'utf8'),
}));
/** SQL text written by a file (template literals only – comments mentioning a column are fine). */
const sqlOf = (text: string) => (text.match(/`[^`]*`/g) ?? []).join('\n');

describe('BR-433 (d) v0.4.1 – who writes / reads the limit basis', () => {
  it('stay_night.reference_rate_vnd: written only by the reservations system price paths, never by setNightRate', () => {
    const writers = sources
      .filter((s) => /reference_rate_vnd\s*(=|,|\))/.test(sqlOf(s.text)))
      .filter((s) => /(INSERT INTO stay_night|UPDATE stay_night)/.test(sqlOf(s.text)))
      .map((s) => s.path)
      .sort();
    expect(writers).toEqual([
      'modules/reservations/internal/lease-nights.ts',
      'modules/reservations/internal/reservation-store.ts',
      'modules/reservations/internal/reservations.service.ts',
    ]);
    const pricing = sources.find((s) =>
      s.path.endsWith('reservations/public/stay-night-pricing.ts'),
    )!;
    expect(sqlOf(pricing.text)).not.toMatch(/reference_rate_vnd/);
  });

  it('folio.limit_basis_checkout_vnd: written only by FolioService.settle', () => {
    const hits = sources.filter((s) => /limit_basis_checkout_vnd\s*=/.test(sqlOf(s.text)));
    expect(hits.map((s) => s.path)).toEqual(['modules/folio/public/folio.service.ts']);
    const text = hits[0]!.text;
    const settle = text.slice(
      text.indexOf('  async settle('),
      text.indexOf('\n  }\n', text.indexOf('  async settle(')),
    );
    expect(settle).toMatch(/limit_basis_checkout_vnd = \$6/);
    expect((sqlOf(text).match(/limit_basis_checkout_vnd\s*=/g) ?? []).length).toBe(1);
  });

  it('the basis is read only through FolioService.limitBasisVnd (no unprotected reader left)', () => {
    for (const s of sources) {
      expect(s.text, s.path).not.toMatch(/\bnightRateBasis\b|\bfolioNightBasisVnd\b/);
    }
  });

  it('every approvals.submit of a waiver (foc / special_discount) hands waiverLimitInput (ARC S1-10)', () => {
    const calls: string[] = [];
    for (const s of sources) {
      let i = s.text.indexOf('approvals.submit(');
      while (i >= 0) {
        const call = s.text.slice(i, s.text.indexOf('});', i));
        if (/type: 'foc'|type: input\.kind|type: 'special_discount'/.test(call)) {
          calls.push(s.path);
          expect(call, s.path).toMatch(/waiverLimitInput|\.\.\.limitInput/);
        }
        i = s.text.indexOf('approvals.submit(', i + 1);
      }
    }
    expect(calls.sort()).toEqual([
      'modules/folio/internal/foc.service.ts',
      'modules/frontdesk/internal/stay-support.ts',
    ]);
  });
});

describe('staff_notification kind CHECK = STAFF_NOTIFICATION_KINDS, additions only (ARC S1-09)', () => {
  const rewrites = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ f, sql: readFileSync(join(MIGRATIONS, f), 'utf8') }))
    .filter((m) => /ADD CONSTRAINT "?staff_notification_kind_check"?/.test(m.sql));
  const kindsOf = (sql: string) => {
    const at = sql.search(/ADD CONSTRAINT "?staff_notification_kind_check"?/);
    const body = sql.slice(at, sql.indexOf(';', at));
    return [...body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!).sort();
  };

  it('the newest rewrite lists exactly the kinds of the schema', () => {
    const last = rewrites[rewrites.length - 1]!;
    expect(kindsOf(last.sql), last.f).toEqual([...STAFF_NOTIFICATION_KINDS].sort());
  });

  it('every rewrite keeps every kind of the previous one', () => {
    for (let i = 1; i < rewrites.length; i += 1) {
      const before = kindsOf(rewrites[i - 1]!.sql);
      const after = new Set(kindsOf(rewrites[i]!.sql));
      expect(
        before.filter((k) => !after.has(k)),
        `${rewrites[i]!.f} drops kinds of ${rewrites[i - 1]!.f}`,
      ).toEqual([]);
    }
  });
});
