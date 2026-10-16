// Which UXD string keys guest-web may ship (FB-R2-SEC-MOB-01 (2)): the keys the app source actually
// names, not whole prefixes. Shared by vite.config.ts (bundle filter) and the guard tests.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FAMILIES = '(?:guest|gw|common|error|field|shell)';
/** A whole key in a string literal: 'gw.notice_body', "error.RATE_LIMITED". */
const LITERAL = new RegExp(`['"\`](${FAMILIES}\\.[A-Za-z0-9_.]+)['"\`]`, 'g');
/** A template key: `gw.doc.${type}` → every key starting with `gw.doc.`. */
const TEMPLATE = new RegExp(`\`(${FAMILIES}\\.[A-Za-z0-9_.]*)\\$\\{`, 'g');

/** SEC ĐK-6: level-2 / bill / door-code copy is never shipped in R2 (s3-checklist G8). */
export const R2_FORBIDDEN_KEYS =
  /^(guest\.verify\.|guest\.door_code|guest\.late\.(done_title|code_|how_|prompt|arrival_hint)|guest\.tab\.bill|guest\.bill\.|guest\.after_checkout\.body)/;

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
  if (R2_FORBIDDEN_KEYS.test(key)) return false;
  return used.exact.has(key) || used.prefixes.some((p) => key.startsWith(p));
}
