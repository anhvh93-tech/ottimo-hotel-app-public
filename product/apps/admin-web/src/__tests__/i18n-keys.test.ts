// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allKeys } from '@ottimo/i18n';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory())
      return f === '__tests__' || f === 'mocks' || f === 'test' ? [] : files(p);
    return /\.tsx?$/.test(f) && !f.endsWith('.test.tsx') ? [p] : [];
  });
}

/**
 * v1.0.4 (plan-v1.0.4 2.4): a package may use a key ARC named in 3.1 before UXD's strings round 1 (P4-01) lands.
 * Each package lists those keys in its own `pending-keys-<package>.json` next to this test (no two packages edit
 * the same list). Once a key exists in VI and EN the second test fails: delete it from the list on that rebase.
 */
const PENDING = new Set(
  Object.values(
    import.meta.glob<string[]>('./pending-keys-*.json', { eager: true, import: 'default' }),
  ).flat(),
);

describe('string keys', () => {
  it('every literal t("…") key used by admin-web exists in VI and EN', () => {
    const src = join(__dirname, '..');
    const used = new Set<string>();
    for (const f of files(src)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\bt\(\s*'([a-z_]+\.[A-Za-z0-9_.]+)'/g))
        used.add(m[1]!);
      for (const m of readFileSync(f, 'utf8').matchAll(
        /(?:label|labelOwn|titleKey|busyLabelKey): '([a-z_]+\.[A-Za-z0-9_.]+)'/g,
      ))
        used.add(m[1]!);
    }
    expect(used.size).toBeGreaterThan(100);
    for (const locale of ['vi', 'en'] as const) {
      const keys = allKeys(locale);
      expect(
        [...used].filter((k) => !keys.has(k) && !PENDING.has(k)),
        locale,
      ).toEqual([]);
    }
  });

  it('pending v1.0.4 keys are still pending (remove them from pending-keys-*.json once UXD adds them)', () => {
    const vi = allKeys('vi');
    expect([...PENDING].filter((k) => vi.has(k))).toEqual([]);
  });
});
