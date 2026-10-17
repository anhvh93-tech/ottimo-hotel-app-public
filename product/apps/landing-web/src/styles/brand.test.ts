// Brand Guidelines v1.0 in the landing source (ADR-014 2.5): colours only through the --brand-* tokens, which are a
// faithful copy of the Design System brand group (= the palette of CLAUDE.md). Fonts: generated, self-hosted subsets.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PALETTE, namedColors } from '../../scripts/dist-checks.mjs';
import { render as renderFonts } from '../../scripts/sync-fonts.mjs';
import { extractBrand, render as renderTokens } from '../../scripts/sync-tokens.mjs';
import { THEME_COLOR } from '../lib/i18n';

const src = fileURLToPath(new URL('..', import.meta.url));
const read = (rel: string) => readFileSync(path.join(src, rel), 'utf8');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const full = path.join(dir, n);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
// Hand-written style sources: landing.css + every component/layout/page (.astro may carry SVG attributes).
const authored = [
  path.join(src, 'styles/landing.css'),
  ...walk(path.join(src, 'components')),
  ...walk(path.join(src, 'layouts')),
  ...walk(path.join(src, 'pages')),
].filter((f) => /\.(css|astro)$/.test(f));
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

describe('brand palette (Brand Guidelines v1.0)', () => {
  it('tokens.css is the up-to-date copy of the DS brand group (pnpm sync:tokens)', async () => {
    expect(read('styles/tokens.css')).toBe(await renderTokens());
  });

  it('the DS brand group equals the guideline palette – no terracotta, nothing else', () => {
    const decls = extractBrand(read('styles/tokens.css'));
    expect(Object.fromEntries(decls.map(([k, v]) => [k, v.toLowerCase()]))).toEqual(
      Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [`--brand-${k}`, v])),
    );
  });

  it('theme-color is Ivory', () => {
    expect(THEME_COLOR.toLowerCase()).toBe(PALETTE.ivory);
  });

  it.each(authored.map((f) => [path.relative(src, f), f]))(
    '%s: no hard-coded colour',
    (_name, file) => {
      const text = stripComments(readFileSync(file, 'utf8'));
      expect(text.match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([]);
      expect(text.match(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi) ?? []).toEqual([]);
      expect(namedColors(text)).toEqual([]);
    },
  );

  it.each(authored.map((f) => [path.relative(src, f), f]))(
    '%s: colours only through --brand-* tokens; no new colour variable',
    (_name, file) => {
      const text = stripComments(readFileSync(file, 'utf8'));
      const used = [...text.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!);
      const defined = new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]!));
      const local = new Set(
        [...read('styles/landing.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]!),
      );
      for (const v of used)
        expect(v.startsWith('--brand-') || local.has(v) || defined.has(v), v).toBe(true);
      // No local custom property may hold a colour (aliases of brand tokens included).
      for (const m of text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
        expect(/--brand-|#|rgb|hsl/.test(m[2]!), `${m[1]} defines a colour`).toBe(false);
    },
  );

  it('SVG attributes in components use currentColor/none – colours come from CSS classes', () => {
    for (const f of authored.filter((x) => x.endsWith('.astro'))) {
      const attrs = [...readFileSync(f, 'utf8').matchAll(/\b(fill|stroke)="([^"]+)"/g)].map(
        (m) => m[2],
      );
      for (const a of attrs)
        expect(['none', 'currentColor'], `${path.basename(f)}: ${a}`).toContain(a);
    }
  });

  it('favicon.svg only uses palette colours', () => {
    const svg = readFileSync(path.join(src, '../public/favicon.svg'), 'utf8');
    const hexes = [...svg.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => `#${m[1]!.toLowerCase()}`);
    expect(hexes.length).toBeGreaterThan(0);
    for (const h of hexes) expect(Object.values(PALETTE)).toContain(h);
  });
});

describe('fonts (SEC C-1, concept 3)', () => {
  it('fonts.css is the up-to-date generated subset list (pnpm sync:fonts)', async () => {
    expect(read('styles/fonts.css')).toBe(await renderFonts());
  });

  it('only Lora and Be Vietnam Pro, latin/latin-ext/vietnamese, woff2, from @fontsource (no CDN)', () => {
    const css = read('styles/fonts.css');
    const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]!);
    expect(urls.length).toBe(15);
    for (const u of urls)
      expect(u).toMatch(
        /^@fontsource\/(lora|be-vietnam-pro)\/files\/[a-z-]+-(latin|latin-ext|vietnamese)-\d{3}-(normal|italic)\.woff2$/,
      );
    expect(read('styles/landing.css')).not.toMatch(/fonts\.googleapis|fonts\.gstatic|https?:\/\//);
  });
});
