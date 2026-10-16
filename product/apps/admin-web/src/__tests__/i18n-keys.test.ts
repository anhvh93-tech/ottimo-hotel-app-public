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
        [...used].filter((k) => !keys.has(k)),
        locale,
      ).toEqual([]);
    }
  });
});
