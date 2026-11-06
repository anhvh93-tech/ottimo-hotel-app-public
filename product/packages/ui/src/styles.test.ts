// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(new URL(import.meta.url).pathname);
const css = readFileSync(join(here, 'styles/index.css'), 'utf8');
const pkg = JSON.parse(readFileSync(join(here, '../package.json'), 'utf8')) as {
  dependencies: Record<string, string>;
};
const require = createRequire(import.meta.url);
const tokens = readFileSync(join(here, '../../../design/wireframes/assets/tokens.css'), 'utf8');

/** `@import` lines in order (comments stripped). */
const imports = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@import\s+'([^']+)'/g)].map(
  (m) => m[1]!,
);

describe('DS v0.4.1 brand fonts (S4-49 B0 + B1 – one build)', () => {
  it('B0: the generated v0.4.1 tokens are imported first (colours/type come only from tokens.css)', () => {
    expect(imports[0]).toBe('../../../../design/wireframes/assets/tokens.css');
    // v0.4.1 values the apps must pick up on the next build (DS 11.1 / 11.1.1).
    expect(tokens).toMatch(/--ink:#2B2B28/);
    expect(tokens).toMatch(/--bar-cf:#BEA174/);
    expect(tokens).toMatch(/--mono:"JetBrains Mono","Courier New"/);
  });

  it('B1: JetBrains Mono 400 + 500 self-hosted, after Be Vietnam Pro, pinned to an exact version', () => {
    const at = (s: string) => imports.indexOf(s);
    expect(at('@fontsource/jetbrains-mono/400.css')).toBeGreaterThan(
      at('@fontsource/be-vietnam-pro/600.css'),
    );
    expect(at('@fontsource/jetbrains-mono/500.css')).toBeGreaterThan(
      at('@fontsource/jetbrains-mono/400.css'),
    );
    expect(at('./app.css')).toBe(imports.length - 1);
    for (const name of [
      '@fontsource/jetbrains-mono',
      '@fontsource/lora',
      '@fontsource/be-vietnam-pro',
    ])
      expect(pkg.dependencies[name], name).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('every font face is served from the bundle – no font request leaves the site (SEC C-1)', () => {
    for (const file of imports.filter((i) => i.startsWith('@fontsource/'))) {
      const face = readFileSync(require.resolve(file), 'utf8');
      const urls = [...face.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]!);
      expect(urls.length, file).toBeGreaterThan(0);
      for (const u of urls) expect(u, file).toMatch(/^\.\/files\/[\w.-]+\.woff2?$/);
    }
    // Vietnamese and Latin subsets of the mono face exist (booking codes, Wi-Fi, VietQR content).
    const mono = readFileSync(require.resolve('@fontsource/jetbrains-mono/400.css'), 'utf8');
    expect(mono).toMatch(/font-family: 'JetBrains Mono'/);
    expect(mono).toMatch(/jetbrains-mono-vietnamese-400-normal\.woff2/);
    expect(mono).toMatch(/jetbrains-mono-latin-400-normal\.woff2/);
  });
});

describe('Desk wizard footer (FB-R5-UXD-FE-PR125-04, PR140-01/02/05)', () => {
  const app = readFileSync(join(here, 'styles/app.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const start = app.indexOf('.wiz-foot.desk-foot');
  const media = app.lastIndexOf('@media (max-width: 599px)', start);
  const block = app.slice(media, app.indexOf('\n}', start) + 2);

  it('only the Desk footer (`.desk-foot`) changes, and only under 600 px – the guest web keeps its own', () => {
    expect(media).toBeGreaterThanOrEqual(0);
    const outside = app.slice(0, media) + app.slice(media + block.length);
    expect(outside).not.toMatch(/\.wiz-foot/);
    const selectors = [...block.matchAll(/([^{}]+)\{/g)].map((m) => m[1]!.trim()).slice(1);
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(s.startsWith('.wiz-foot.desk-foot')).toBe(true);
  });

  it('wrapped: the reason on a row of its own above the buttons, the main button at the right edge', () => {
    expect(block).toMatch(/\.wiz-foot\.desk-foot\s*\{\s*flex-wrap:\s*wrap;/);
    expect(block).toMatch(/\.wiz-foot\.desk-foot > \.li-s\s*\{[^}]*order:\s*-1;/);
    expect(block).toMatch(/\.wiz-foot\.desk-foot > \.btn\.pri\s*\{\s*margin-left:\s*auto;/);
  });
});
