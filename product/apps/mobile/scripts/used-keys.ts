// Which UXD string keys the staff PWA ships. The UXD files hold every app's copy (~2 400 keys × VI/EN);
// the PWA ships only the keys its source names, so the first load stays inside the ADR-005 budget
// (≤ 180 KB gzip) and no Desk-only wording (money, C3, guest documents) reaches a personal phone.
// Same approach as guest-web/build/used-keys.ts (FB-R2-SEC-MOB-01).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FAMILIES = '(?:hk|wo|nav|common|error|field|auth|login|role|retry|shell|staff)';
/** A whole key in a string literal: 'hk.status.VC', "error.RATE_LIMITED". */
const LITERAL = new RegExp(`['"\`](${FAMILIES}\\.[A-Za-z0-9_.]+)['"\`]`, 'g');
/** A template key: `hk.status.${code}` → every key starting with `hk.status.`. */
const TEMPLATE = new RegExp(`\`(${FAMILIES}\\.[A-Za-z0-9_.]*)\\$\\{`, 'g');

const SKIP_DIRS = new Set(['__tests__', 'mocks', 'test']);

export function appSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(f) ? [] : appSourceFiles(p);
    return /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}

export interface UsedKeys {
  exact: Set<string>;
  prefixes: string[];
}

export function collectUsedKeys(srcDir: string): UsedKeys {
  const exact = new Set<string>();
  const prefixes = new Set<string>();
  for (const file of appSourceFiles(srcDir)) {
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(LITERAL)) exact.add(m[1]!);
    for (const m of code.matchAll(TEMPLATE)) prefixes.add(m[1]!);
  }
  return { exact, prefixes: [...prefixes] };
}

export function isShipped(key: string, used: UsedKeys): boolean {
  if (key === '_meta') return true;
  return used.exact.has(key) || used.prefixes.some((p) => key.startsWith(p));
}
