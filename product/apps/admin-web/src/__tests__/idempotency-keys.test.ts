// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * UXR #2 (gate S3 v2): `${idem}-a` was sent as the Idempotency-Key of every upload → 422 (the API accepts
 * only a UUID). Runtime: `test/setup.ts` fails any test whose requests carry a non-UUID key, and the mock
 * answers 422 like the API. Static: no source file may build a key by gluing text to another key.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory())
      return ['__tests__', 'mocks', 'test', 'generated', 'node_modules'].includes(f)
        ? []
        : files(p);
    return /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}

const ROOTS = [join(__dirname, '..'), join(__dirname, '../../../../packages/api-client/src')];
const sources = ROOTS.flatMap(files).map((f) => ({
  file: relative(join(__dirname, '../../../..'), f),
  text: readFileSync(f, 'utf8'),
}));

describe('Idempotency-Key is always a UUID (UXR #2)', () => {
  it('scans admin-web and api-client', () => {
    expect(sources.length).toBeGreaterThan(50);
    expect(sources.some((s) => s.file.endsWith('pages/money/MoneyPage.tsx'))).toBe(true);
    expect(sources.some((s) => s.file.endsWith('api-client/src/endpoints.ts'))).toBe(true);
  });

  it('no key is built from another key with a template literal or "+"', () => {
    const KEY = String.raw`[\w.]*(?:idem|idempotency)[\w.]*`;
    const glued = [
      new RegExp(String.raw`\$\{\s*${KEY}\s*\}`, 'gi'),
      new RegExp(String.raw`\b${KEY}\s*\+\s*['"\x60]`, 'gi'),
      new RegExp(String.raw`['"\x60]\s*\+\s*${KEY}\b`, 'gi'),
    ];
    const hits = sources.flatMap(({ file, text }) =>
      glued.flatMap((re) => [...text.matchAll(re)].map((m) => `${file}: ${m[0]}`)),
    );
    expect(hits).toEqual([]);
  });

  it('every upload before a write uses a derived UUID key (deriveIdempotencyKey)', () => {
    const calls = sources.flatMap(({ file, text }) =>
      [...text.matchAll(/api\.uploadAttachment\(([\s\S]*?)\)\s*[;)]/g)].map((m) => ({
        file,
        args: m[1]!,
      })),
    );
    // Refund proof (MoneyPage) and penalty evidence (StayDialogs) – grows when a screen adds one.
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls.filter((c) => !/deriveIdempotencyKey\(/.test(c.args))).toEqual([]);
  });
});
