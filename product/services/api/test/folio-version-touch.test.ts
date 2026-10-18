/**
 * ARC 16.29 (N-6) – architecture: `folio.version` goes up with EVERY money change of a folio. Every function of
 * src/modules that writes `folio_line` or `payment` (INSERT / UPDATE) must call `touch(` (FolioService.touch, in
 * the same transaction, under the folio lock) – or be listed below with the reason it changes no money. A new
 * writer without `touch` fails here (no DB).
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

/** `file#function` → why it may write without touching the folio's version. */
const NO_MONEY_CHANGE: Record<string, string> = {
  'folio/public/folio.service.ts#linkLine': 'links a pending FOC line to its approval request only',
  'folio/internal/foc.service.ts#request':
    'links the FOC line to its request – the line itself is written by insertLine (touch)',
  'payments/public/payment-expiry.ts#expirePendingPayments':
    'J24: a pending VietQR (never counted in the money) expires; bulk job without folio locks',
};

const WRITER =
  /\b(INSERT INTO folio_line|UPDATE folio_line|INSERT INTO payment\b|UPDATE payment\b)/;
const METHOD = /^ {2}(?:private |public |protected )?(?:static )?(?:async )?([A-Za-z0-9_]+)\s*[(<]/;
const FUNCTION = /^(?:export )?(?:async )?function\s+([A-Za-z0-9_]+)/;

interface Writer {
  where: string;
  fn: string;
  touches: boolean;
}

function writers(): Writer[] {
  const out: Writer[] = [];
  for (const f of files(MODULES)) {
    const lines = readFileSync(f, 'utf8').split('\n');
    const rel = relative(MODULES, f).split(sep).join('/');
    lines.forEach((line, i) => {
      if (!WRITER.test(line)) return;
      // the enclosing class method (2-space indent) or top-level function
      let start = -1;
      let name = '?';
      let top = false;
      for (let j = i; j >= 0; j -= 1) {
        const m = METHOD.exec(lines[j]!);
        const fnm = FUNCTION.exec(lines[j]!);
        if (m && !['if', 'for', 'while', 'switch', 'return', 'await'].includes(m[1]!)) {
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
      out.push({ where: `${rel}#${name}`, fn: name, touches: /\btouch\(/.test(body) });
    });
  }
  return out;
}

describe('ARC 16.29 (N-6) – folio.version moves with every money change', () => {
  it('every writer of folio_line / payment calls touch( or is listed as changing no money', () => {
    const all = writers();
    expect(all.length).toBeGreaterThan(10);
    const missing = [
      ...new Set(all.filter((w) => !w.touches && !NO_MONEY_CHANGE[w.where]).map((w) => w.where)),
    ];
    expect(missing).toEqual([]);
  });

  it('the exemption list holds only real writers (a writer that went away leaves the list)', () => {
    const where = new Set(writers().map((w) => w.where));
    expect(Object.keys(NO_MONEY_CHANGE).filter((k) => !where.has(k))).toEqual([]);
  });
});
