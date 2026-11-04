#!/usr/bin/env node
// Writes the Korean and Simplified Chinese font files of the landing (LP-v2, UXD lp-v2-design 1.2–1.4, ARC lp-v2 3.3):
// Noto Sans KR/SC 400 + 600 and Noto Serif KR/SC 400 (SIL OFL 1.1), CUT AT BUILD TIME TO THE CHARACTERS THE PAGES
// SHOW – not the 100+ slices of Google Fonts. Self-hosted (CSP font-src 'self', SEC SR-LC-07), woff2 only.
//
//   pnpm --filter @ottimo/landing-web build:booking-preview      # the pages with the form and the privacy notice
//   pnpm --filter @ottimo/landing-web sync:fonts:cjk             # this script, reads dist-booking-preview/
//   pnpm --filter @ottimo/landing-web build:booking-preview      # again: the CSS now names the new files
//
// Characters: the visible text of /<lang>/ (part A – what the home page and the form draw on first paint) and of
// /<lang>/privacy/, /<lang>/404/, the run-time form strings (the JS chunk of that language – errors, thank-you, price
// estimate) and every weekday/month name Intl writes for that locale (part B, only downloaded when drawn). Each role
// gets its own file: sans 400 (A, B), sans 600 (A, B – text at weight ≥ 500: labels, buttons, errors, headings h3),
// serif 400 (headings in Lora's role). The same family name with disjoint `unicode-range` = the browser fetches only
// the files whose characters are on screen. Only Han / Hangul / CJK punctuation go into these files: Latin letters and
// digits stay Lora / Be Vietnam Pro (brand), which come first in the stack (fonts-<lang>.css).
//
// Source fonts: static TTFs of @expo-google-fonts/noto-* (Google Fonts builds, OFL), fetched once with `npm pack` at a
// pinned version + sha512 into .font-src/ (gitignored – ~400 MB unpacked, never a dependency of the app or CI).
// The generated files are committed. src/styles/brand.test.ts fails when a ko/zh string has a character the files do
// not cover (run this script again), and dist-checks checkGlyphCoverage fails on any uncovered visible character.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';
import subsetFont from 'subset-font';

const APP = fileURLToPath(new URL('..', import.meta.url));
const CACHE = path.join(APP, '.font-src');

/** Pinned sources (npm registry, dist.integrity). */
export const SOURCES = {
  'noto-sans-kr': {
    spec: '@expo-google-fonts/noto-sans-kr@0.4.4',
    integrity:
      'sha512-zePBzeh74ja/0Jiw3T/9+V6Ie3+eONlIl5o1dQQYsOCmfXjJttMz0rGv1oB2AWlzX/TPiL7J3IP3M9Ga7CBvWA==',
    files: {
      400: '400Regular/NotoSansKR_400Regular.ttf',
      600: '600SemiBold/NotoSansKR_600SemiBold.ttf',
    },
  },
  'noto-serif-kr': {
    spec: '@expo-google-fonts/noto-serif-kr@0.4.4',
    integrity:
      'sha512-ny+0SGaH9ovPFKZIdNizvzahhMnzJKZHott7NND0yXQdNFfHrrizo0gPKrO+MndCgX9T62tZnef+kSymMR98wA==',
    files: { 400: '400Regular/NotoSerifKR_400Regular.ttf' },
  },
  'noto-sans-sc': {
    spec: '@expo-google-fonts/noto-sans-sc@0.4.4',
    integrity:
      'sha512-LF4+p6xdtgUArufW0K+l9/FeDiXrW8FcEkEbOPIUC5ZnPupeFVA6yY9qCZ0sBrdAeLdlusDhv0R7q2x3onXo3w==',
    files: {
      400: '400Regular/NotoSansSC_400Regular.ttf',
      600: '600SemiBold/NotoSansSC_600SemiBold.ttf',
    },
  },
  'noto-serif-sc': {
    spec: '@expo-google-fonts/noto-serif-sc@0.4.4',
    integrity:
      'sha512-RIPZykLmhdnqjaYuIVNA7btxvd8OwKNK1CSqLiszCOVJAIhkud9cSrOoecYiwU3HetKGaHEZWzD2jbWd43D6mA==',
    files: { 400: '400Regular/NotoSerifSC_400Regular.ttf' },
  },
};

/** Languages, their font families, Intl locale and the scripts their files carry. */
export const CJK = {
  ko: {
    htmlLang: 'ko',
    intl: 'ko-KR',
    sans: 'noto-sans-kr',
    serif: 'noto-serif-kr',
    familySans: 'OTTIMO Sans KR',
    familySerif: 'OTTIMO Serif KR',
    stack: {
      sans: "'Be Vietnam Pro', 'OTTIMO Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
      serif: "'Lora', 'OTTIMO Serif KR', 'AppleMyungjo', 'Noto Serif KR', serif",
    },
  },
  zh: {
    htmlLang: 'zh-Hans',
    intl: 'zh-CN',
    sans: 'noto-sans-sc',
    serif: 'noto-serif-sc',
    familySans: 'OTTIMO Sans SC',
    familySerif: 'OTTIMO Serif SC',
    stack: {
      sans: "'Be Vietnam Pro', 'OTTIMO Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
      serif: "'Lora', 'OTTIMO Serif SC', 'Songti SC', 'Noto Serif SC', serif",
    },
  },
};

/** Code points that go into the CJK files: Hangul, Han, CJK symbols and punctuation, full-width forms. */
export function isCjk(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x11ff) || // Hangul Jamo
    (cp >= 0x3000 && cp <= 0x303f) || // CJK symbols and punctuation
    (cp >= 0x3130 && cp <= 0x318f) || // Hangul compatibility Jamo
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK extension A
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK unified ideographs
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul syllables
    (cp >= 0xff00 && cp <= 0xffef) // half-width and full-width forms
  );
}

const cjkOf = (text) => [...text].filter((c) => isCjk(c.codePointAt(0)));

// ---------- reading the built pages ----------

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
const SKIP = new Set(['script', 'style', 'head', 'template', 'svg']);
const SERIF_CLASS = new Set(['h2', 'wm-name', 'lb-title', 'tagline', 'n', 'est-amt']);
const BOLD_CLASS = new Set([
  'label',
  'h3',
  'btn',
  'link',
  'link-in',
  'wm-sub',
  'h-zalo',
  'gal-open',
  'f-title',
  'err',
  'opt-box',
  'ls-link',
  'ls-close',
  'sb',
  'lp-cur',
  'lp-h',
  'f-label',
  'est-lbl',
]);

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/**
 * Text of the page by font role (CSS of styles/landing.css, privacy.css): serif = h1, .h2, wordmark, room/thank-you
 * h3, step numbers; bold = weight ≥ 500 (labels, buttons, links, h3, summary, field labels, errors…); else regular.
 * Elements with a `lang` other than the page's (language list, suggestion strips) are skipped – system fonts.
 */
export function textByRole(html, pageLang) {
  const out = { regular: '', bold: '', serif: '' };
  const body = html.split(/<body[^>]*>/)[1] ?? html;
  const stack = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)([^>]*)>|([^<]+)/g;
  for (const m of body.matchAll(re)) {
    if (m[0].startsWith('<!--')) continue;
    if (m[4] !== undefined) {
      if (stack.some((e) => e.skip)) continue;
      const text = decode(m[4]);
      const serif = stack.some((e) => e.serif);
      const bold = stack.some((e) => e.bold);
      out[serif ? 'serif' : bold ? 'bold' : 'regular'] += text;
      continue;
    }
    const [, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (close) {
      const i = stack.map((e) => e.tag).lastIndexOf(tag);
      if (i >= 0) stack.length = i;
      continue;
    }
    if (VOID.has(tag) || attrs.trim().endsWith('/')) continue;
    const classes = new Set(
      (attrs.match(/\bclass="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean),
    );
    const lang = attrs.match(/\blang="([^"]*)"/)?.[1];
    const inside = (cls) => stack.some((e) => e.classes.has(cls));
    const serif =
      tag === 'h1' ||
      [...classes].some((c) => SERIF_CLASS.has(c)) ||
      (tag === 'h3' && (inside('room') || inside('done')));
    const bold =
      !serif &&
      (['summary', 'dt', 'caption', 'strong', 'b'].includes(tag) ||
        // column heads keep the browser's bold; row heads of the drive-time table are set to 400 (.dist th)
        (tag === 'th' && !/\bscope="row"/.test(attrs)) ||
        (tag === 'label' && inside('field')) ||
        [...classes].some((c) => BOLD_CLASS.has(c)) ||
        (tag === 'a' &&
          (inside('menu-panel') ||
            inside('nav-d') ||
            inside('lp-panel') ||
            inside('summary') ||
            inside('c-list'))) ||
        (tag === 'h3' && inside('summary')));
    stack.push({
      tag,
      classes,
      serif,
      bold,
      skip: SKIP.has(tag) || (lang !== undefined && lang !== pageLang),
    });
  }
  return out;
}

/** Every weekday / month / date pattern Intl writes for the locale (form dates, estimate lines). */
export function intlText(locale) {
  let s = '';
  for (let m = 0; m < 12; m++)
    for (const d of [1, 2, 3, 4, 5, 6, 7]) {
      const date = new Date(Date.UTC(2026, m, d));
      for (const opts of [
        { weekday: 'short', day: 'numeric', month: 'short' },
        { day: 'numeric', month: 'short', year: 'numeric' },
        { day: 'numeric', month: 'long', year: 'numeric' },
        { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
        { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' },
      ])
        s += new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(date);
    }
  return s;
}

function readDist(dist, lang) {
  const read = (rel) => {
    const f = path.join(dist, rel);
    return existsSync(f) ? readFileSync(f, 'utf8') : '';
  };
  // part A also takes the production build (form off: the Zalo/call block instead of the form) when it exists
  const prod = path.join(path.dirname(dist), 'dist', lang, 'index.html');
  const home = [read(`${lang}/index.html`), existsSync(prod) ? readFileSync(prod, 'utf8') : ''];
  if (!read(`${lang}/index.html`))
    throw new Error(`${dist}/${lang}/index.html missing – run build:booking-preview first`);
  const other = [read(`${lang}/privacy/index.html`), read(`${lang}/404/index.html`)];
  if (!other[0])
    throw new Error(`${dist}/${lang}/privacy/ missing – the preview build must publish the notice`);
  const js = readdirSync(path.join(dist, '_astro'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(path.join(dist, '_astro', f), 'utf8'))
    .join('\n');
  return { home, other, js };
}

/** Character sets per file of one language. */
export function charSets(dist, lang) {
  const cfg = CJK[lang];
  const { home, other, js } = readDist(dist, lang);
  // Only characters that belong to this language: Hangul on ko, Han on zh, plus CJK punctuation/full-width forms.
  const own = (c) => {
    const cp = c.codePointAt(0);
    if (lang === 'ko') return !(cp >= 0x3400 && cp <= 0x9fff);
    return !(
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0x1100 && cp <= 0x11ff) ||
      (cp >= 0x3130 && cp <= 0x318f)
    );
  };
  const pick = (text) => new Set(cjkOf(text).filter(own));
  const a = home
    .map((h) => textByRole(h, cfg.htmlLang))
    .reduce((x, y) => ({
      regular: x.regular + y.regular,
      bold: x.bold + y.bold,
      serif: x.serif + y.serif,
    }));
  const b = other.map((h) => textByRole(h, cfg.htmlLang));
  const runtime = js + intlText(cfg.intl);
  const sansA = pick(a.regular);
  const boldA = pick(a.bold);
  const serif = pick(a.serif + b.map((x) => x.serif).join(''));
  const minus = (set, ...others) => new Set([...set].filter((c) => !others.some((o) => o.has(c))));
  // part B = characters not already in part A of the same role
  const sansB = minus(pick(b.map((x) => x.regular).join('') + runtime), sansA);
  const boldB = minus(pick(b.map((x) => x.bold).join('') + runtime), boldA);
  return { sansA, sansB, boldA, boldB, serif };
}

// ---------- unicode-range ----------

export function unicodeRange(chars) {
  const cps = [...new Set([...chars].map((c) => c.codePointAt(0)))].sort((x, y) => x - y);
  const parts = [];
  for (let i = 0; i < cps.length;) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    const hex = (n) => n.toString(16).toUpperCase();
    parts.push(i === j ? `U+${hex(cps[i])}` : `U+${hex(cps[i])}-${hex(cps[j])}`);
    i = j + 1;
  }
  return parts.join(', ');
}

// ---------- sources ----------

function source(id) {
  const src = SOURCES[id];
  const dir = path.join(CACHE, id);
  if (!existsSync(path.join(dir, 'package'))) {
    mkdirSync(dir, { recursive: true });
    const meta = JSON.parse(
      execFileSync('npm', ['pack', src.spec, '--pack-destination', dir, '--json'], {
        encoding: 'utf8',
      }),
    )[0];
    if (meta.integrity !== src.integrity)
      throw new Error(`${src.spec}: integrity ${meta.integrity} ≠ pinned ${src.integrity}`);
    const files = Object.values(src.files).map((f) => `package/${f}`);
    execFileSync('tar', ['-xzf', path.join(dir, meta.filename), '-C', dir, ...files]);
    rmSync(path.join(dir, meta.filename));
  }
  return (weight) => readFileSync(path.join(dir, 'package', src.files[weight]));
}

// ---------- output ----------

const FONT_DIR = (lang) => path.join(APP, 'src/assets/fonts', lang);
const CSS_FILE = (lang) => path.join(APP, 'src/styles', `fonts-${lang}.css`);

export function fingerprint(sets) {
  const h = createHash('sha256');
  for (const k of Object.keys(sets).sort()) h.update(`${k}:${[...sets[k]].sort().join('')}\n`);
  return h.digest('hex').slice(0, 16);
}

async function build(dist, lang) {
  const cfg = CJK[lang];
  const sets = charSets(dist, lang);
  const sans = source(cfg.sans);
  const serif = source(cfg.serif);
  const outDir = FONT_DIR(lang);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const faces = [];
  const plan = [
    ['sans', 400, 'a', sets.sansA, sans(400), cfg.familySans, '400'],
    ['sans', 400, 'b', sets.sansB, sans(400), cfg.familySans, '400'],
    ['sans', 600, 'a', sets.boldA, sans(600), cfg.familySans, '500 700'],
    ['sans', 600, 'b', sets.boldB, sans(600), cfg.familySans, '500 700'],
    ['serif', 400, 'a', sets.serif, serif(400), cfg.familySerif, '400'],
  ];
  const sizes = {};
  for (const [kind, weight, part, chars, font, family, cssWeight] of plan) {
    if (!chars.size) continue;
    const name = `ottimo-${kind}-${lang}-${weight}-${part}.woff2`;
    const text = [...chars].sort().join('');
    const woff2 = await subsetFont(font, text, { targetFormat: 'woff2' });
    writeFileSync(path.join(outDir, name), woff2);
    sizes[name] = woff2.length;
    faces.push(
      `@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-display: swap;\n` +
        `  font-weight: ${cssWeight};\n  src: url('../assets/fonts/${lang}/${name}') format('woff2');\n` +
        `  unicode-range: ${unicodeRange(chars)};\n}`,
    );
  }
  const css =
    `/* GENERATED by apps/landing-web/scripts/subset-cjk.mjs – do not edit. chars:${fingerprint(sets)}\n` +
    `   ${cfg.familySans} = Noto Sans ${lang === 'ko' ? 'KR' : 'SC'} 400/600, ${cfg.familySerif} = Noto Serif ${lang === 'ko' ? 'KR' : 'SC'} 400 (SIL OFL 1.1),\n` +
    `   cut to the characters of the /${lang}/ pages (A = home, B = privacy, 404, run-time strings). Linked by /${lang}/ only. */\n` +
    faces.join('\n') +
    `\n:root:lang(${cfg.htmlLang}) {\n  --sans: ${cfg.stack.sans};\n  --serif: ${cfg.stack.serif};\n}\n`;
  const options = (await prettier.resolveConfig(CSS_FILE(lang))) ?? {};
  writeFileSync(CSS_FILE(lang), await prettier.format(css, { ...options, parser: 'css' }));
  return { sizes, counts: Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.size])) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--dir');
  const dist = path.join(APP, i >= 0 ? process.argv[i + 1] : 'dist-booking-preview');
  for (const lang of Object.keys(CJK)) {
    const r = await build(dist, lang);
    console.log(`fonts-${lang}.css`, JSON.stringify(r));
  }
}
