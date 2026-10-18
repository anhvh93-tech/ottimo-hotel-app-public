/**
 * ARC 16.29 (N-6) – architecture: `folio.version` goes up with EVERY money change of a folio. Every function of
 * src/modules that writes `folio_line` or `payment` (INSERT / UPDATE) must call `touch(` (FolioService.touch, in
 * the same transaction, under the folio lock) – or the STATEMENT is listed below with the reason it changes no
 * money. A new writer without `touch` fails here (no DB).
 * FB-R2-ARC-BE-S4-20 (ARC 16.30.5): comments are stripped before looking for writers and for `touch(` (a `touch(`
 * in a comment does not count, an SQL quoted in a comment is not a writer); an exemption names ONE statement of
 * one function (a second writer added to an exempt function is checked like any other).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULES = join(__dirname, '..', 'src', 'modules');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** One statement that writes without moving the folio's version – `file#function` + the statement + why. */
interface Exemption {
  where: string;
  statement: RegExp;
  reason: string;
}
const NO_MONEY_CHANGE: readonly Exemption[] = [
  {
    where: 'folio/public/folio.service.ts#linkLine',
    statement: /UPDATE folio_line SET approval_request_id = \$2 WHERE id = \$1/,
    reason: 'links a pending FOC line to its approval request only',
  },
  {
    where: 'folio/internal/foc.service.ts#request',
    statement: /UPDATE folio_line SET approval_request_id = \$2 WHERE id = \$1/,
    reason: 'links the FOC line to its request – the line itself is written by insertLine (touch)',
  },
  {
    where: 'payments/public/payment-expiry.ts#expirePendingPayments',
    statement: /UPDATE payment p SET status = 'expired'/,
    reason:
      'J24: a pending VietQR (never counted in the money) expires; bulk job without folio locks',
  },
];

const WRITER =
  /\b(INSERT INTO folio_line|UPDATE folio_line|INSERT INTO payment\b|UPDATE payment\b)/;
const METHOD = /^ {2}(?:private |public |protected )?(?:static )?(?:async )?([A-Za-z0-9_]+)\s*[(<]/;
const FUNCTION = /^(?:export )?(?:async )?function\s+([A-Za-z0-9_]+)/;
const NOT_A_METHOD = ['if', 'for', 'while', 'switch', 'return', 'await', 'catch'];

/**
 * Comments blanked out, line count kept: block comments (JSDoc included) and `//` line comments – a `//` right
 * after `:` (a URL in a string) is kept.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, (_m, before: string) => before);
}

interface Writer {
  where: string;
  /** The writing line (comments stripped), for the statement exemptions. */
  statement: string;
  touches: boolean;
}

/** The writers of one source file (`rel` = path under src/modules). */
function writersOf(rel: string, source: string): Writer[] {
  const lines = stripComments(source).split('\n');
  const out: Writer[] = [];
  lines.forEach((line, i) => {
    if (!WRITER.test(line)) return;
    // the enclosing class method (2-space indent) or top-level function
    let start = -1;
    let name = '?';
    let top = false;
    for (let j = i; j >= 0; j -= 1) {
      const m = METHOD.exec(lines[j]!);
      const fnm = FUNCTION.exec(lines[j]!);
      if (m && !NOT_A_METHOD.includes(m[1]!)) {
        start = j;
        name = m[1]!;
        break;
      }
      if (fnm) {
        start = j;
        name = fnm[1]!;
        top = true;
        break;
      }
    }
    const end = lines.findIndex((l, k) => k > i && l === (top ? '}' : '  }'));
    const body = lines.slice(start, end === -1 ? undefined : end + 1).join('\n');
    out.push({ where: `${rel}#${name}`, statement: line, touches: /\btouch\(/.test(body) });
  });
  return out;
}

const exemptionOf = (w: Writer) =>
  NO_MONEY_CHANGE.find((e) => e.where === w.where && e.statement.test(w.statement));
const missingIn = (ws: readonly Writer[]) =>
  ws.filter((w) => !w.touches && !exemptionOf(w)).map((w) => `${w.where}: ${w.statement.trim()}`);

function writers(): Writer[] {
  return files(MODULES).flatMap((f) =>
    writersOf(relative(MODULES, f).split(sep).join('/'), readFileSync(f, 'utf8')),
  );
}

describe('ARC 16.29 (N-6) – folio.version moves with every money change', () => {
  it('every writer of folio_line / payment calls touch( or is an exempt statement', () => {
    const all = writers();
    expect(all.length).toBeGreaterThan(10);
    expect(missingIn(all)).toEqual([]);
  });

  it('every exemption still names a real statement (one that went away leaves the list)', () => {
    const all = writers();
    expect(
      NO_MONEY_CHANGE.filter(
        (e) => !all.some((w) => w.where === e.where && e.statement.test(w.statement)),
      ).map((e) => e.where),
    ).toEqual([]);
  });

  it('FB-R2-ARC-BE-S4-20: the check itself – a touch( in a comment does not count; a second writer in an exempt function is checked; SQL in a comment is no writer', () => {
    const touchOnlyInComment = [
      'export class X {',
      '  async post(tx: Tx): Promise<void> {',
      "    await tx.query('INSERT INTO payment (id) VALUES ($1)', [1]);",
      '    // await this.folios.touch(tx, folioId);',
      '    /* this.folios.touch(tx, f) */',
      '  }',
      '}',
    ].join('\n');
    expect(missingIn(writersOf('payments/x.ts', touchOnlyInComment))).toHaveLength(1);

    const secondWriterInExemptFunction = [
      'export class FolioFocService {',
      '  async request(tx: Tx): Promise<void> {',
      "    await tx.query('UPDATE folio_line SET approval_request_id = $2 WHERE id = $1', [a, b]);",
      "    await tx.query(`UPDATE folio_line SET line_state = 'posted' WHERE id = $1`, [a]);",
      '  }',
      '}',
    ].join('\n');
    expect(
      missingIn(writersOf('folio/internal/foc.service.ts', secondWriterInExemptFunction)),
    ).toEqual([
      "folio/internal/foc.service.ts#request: await tx.query(`UPDATE folio_line SET line_state = 'posted' WHERE id = $1`, [a]);",
    ]);

    const sqlInComment = [
      'export class Y {',
      '  /** Writes nothing: an `UPDATE payment` happens elsewhere. */',
      '  async read(tx: Tx): Promise<void> {',
      '    // INSERT INTO folio_line is done by FolioService',
      "    await tx.query('SELECT 1');",
      '  }',
      '}',
    ].join('\n');
    expect(writersOf('folio/y.ts', sqlInComment)).toEqual([]);

    const touched = [
      'export class Z {',
      '  async post(tx: Tx): Promise<void> {',
      "    await tx.query('INSERT INTO payment (id) VALUES ($1)', [1]);",
      '    await this.folios.touch(tx, folioId); // N-6',
      '  }',
      '}',
    ].join('\n');
    expect(missingIn(writersOf('payments/z.ts', touched))).toEqual([]);
  });
});
