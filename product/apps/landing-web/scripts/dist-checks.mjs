// Checks on the built site (dist/) – ADR-014 2.4 (no inline code), 2.5 (brand palette only), 2.6 (nothing from
// another origin), 3.3 (hreflang), 5 (SEO), 7 + 9 (byte budgets), concept 11.2 (hero budgets), US-151 AC3 (no form,
// no OTA link). Pure functions over the files; used by src/checks/dist.test.ts (CI: `test` after `build`) and by
// scripts/check-dist.mjs (CLI report). Each check returns a list of problems – empty = pass.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

/** OTTIMO Brand Guidelines v1.0, palette 80/15/5 + White (CLAUDE.md "Thương hiệu OTTIMO"). */
export const PALETTE = {
  ivory: '#f4f0e8',
  cream: '#ede6d8',
  stone: '#6b6760',
  ink: '#2b2b28',
  oak: '#b08d57',
  earth: '#7a5c44',
  sage: '#8a9079',
  white: '#ffffff',
};

/** Budgets (bytes, 1 kB = 1000 B). Concept 11.2 (hero per DPR) and ADR-014 7.7 / 9. */
export const BUDGET = {
  heroAvif480: 20_000, // phone DPR 1
  heroAvif960: 50_000, // phone DPR 2–3, desktop DPR 1
  heroAvif1600: 120_000, // desktop DPR 2
  imageMax: 450_000, // any image variant
  distTotal: 80_000_000,
  jsGzPerPage: 15_000, // content pages
  cssGzPerPage: 15_000,
  htmlGz: 25_000,
  fontFile: 30_000,
};

const OTA = /\b(booking\.com|agoda\.|airbnb\.|traveloka\.|expedia\.|trip\.com|hotels\.com)/i;
// Tags that load something when the page opens.
const LOADING_TAGS = new Set([
  'script',
  'link',
  'img',
  'source',
  'iframe',
  'video',
  'audio',
  'track',
  'embed',
  'object',
  'image',
  'use',
  'input',
]);
const LINK_LOADS = new Set([
  'stylesheet',
  'preload',
  'modulepreload',
  'icon',
  'apple-touch-icon',
  'manifest',
  'prefetch',
  'prerender',
  'mask-icon',
]);
const NAMED_COLORS =
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(
    ' ',
  );
export const COLOR_PROPS =
  /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?|box-shadow|text-shadow|stop-color|flood-color|lighting-color|text-emphasis-color|scrollbar-color)$/;

// ---------- reading dist ----------

export function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

/** Root-relative URL path of an HTML file: dist/vi/index.html → /vi/, dist/404.html → /404/. */
export function pagePath(dist, file) {
  const rel = path.relative(dist, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel.replace(/\.html$/, '')}/`;
}

/**
 * @param {string} dist
 * @returns {{ dist: string, files: string[], html: { file: string, path: string, source: string }[] }}
 */
export function loadDist(dist) {
  const files = listFiles(dist);
  const html = files
    .filter((f) => f.endsWith('.html'))
    .map((file) => ({ file, path: pagePath(dist, file), source: readFileSync(file, 'utf8') }));
  return { dist, files, html };
}

/** Minimal tag scanner for the generated HTML (Astro escapes "<" in text; JSON-LD escapes it as <). */
export function tags(source) {
  const out = [];
  const re =
    /<([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/g;
  for (const m of source.matchAll(re)) {
    const attrs = {};
    for (const a of (m[2] ?? '').matchAll(
      /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g,
    )) {
      attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
    }
    out.push({ name: m[1].toLowerCase(), attrs, index: m.index, raw: m[0] });
  }
  return out;
}

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function scriptBodies(source) {
  return [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({
    attrs: m[1],
    body: m[2],
  }));
}

/** Visible text of a page: tags, scripts and the JSON-LD block removed, entities decoded. */
export function visibleText(source) {
  return decode(
    source
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))),
  );
}

function urlsOf(tag) {
  const a = tag.attrs;
  const list = [];
  for (const key of ['src', 'href', 'data', 'poster', 'xlink:href']) if (a[key]) list.push(a[key]);
  for (const key of ['srcset', 'imagesrcset'])
    if (a[key])
      list.push(
        ...a[key]
          .split(',')
          .map((s) => s.trim().split(/\s+/)[0])
          .filter(Boolean),
      );
  return list;
}

function isSameOrigin(url, siteOrigin) {
  if (url.startsWith('//')) return false;
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || url.startsWith('#'))
    return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    try {
      return new URL(url).origin === siteOrigin;
    } catch {
      return false;
    }
  }
  return true; // relative path
}

// ---------- checks ----------

/** ADR-014 2.4: no executable inline script, no <style>, no style= / on*= attributes, no javascript: URL. */
export function checkInlineCode({ html }) {
  const problems = [];
  for (const page of html) {
    for (const s of scriptBodies(page.source)) {
      const isJsonLd = /type\s*=\s*"application\/ld\+json"/i.test(s.attrs);
      const hasSrc = /\ssrc\s*=/.test(s.attrs);
      if (!isJsonLd && !hasSrc) problems.push(`${page.path}: inline <script>`);
      if (hasSrc && s.body.trim()) problems.push(`${page.path}: <script src> with inline body`);
      if (isJsonLd) {
        try {
          JSON.parse(s.body);
        } catch {
          problems.push(`${page.path}: JSON-LD does not parse`);
        }
      }
    }
    for (const t of tags(page.source)) {
      if (t.name === 'style') problems.push(`${page.path}: <style> element`);
      for (const [k, v] of Object.entries(t.attrs)) {
        if (k === 'style') problems.push(`${page.path}: style= on <${t.name}>`);
        if (/^on[a-z]+$/.test(k)) problems.push(`${page.path}: ${k}= on <${t.name}>`);
        if (/^\s*javascript:/i.test(v))
          problems.push(`${page.path}: javascript: URL on <${t.name}>`);
      }
    }
  }
  return problems;
}

/** ADR-014 2.6 + SEC C-1: nothing loads from another origin; no iframe/embed; JS sets no cookie, calls no network. */
export function checkThirdParty({ html, files }, siteUrl, { bookingRequest = false } = {}) {
  const problems = [];
  const origin = new URL(siteUrl).origin;
  for (const page of html) {
    for (const t of tags(page.source)) {
      if (['iframe', 'embed', 'object', 'frame'].includes(t.name))
        problems.push(`${page.path}: <${t.name}>`);
      if (!LOADING_TAGS.has(t.name)) continue;
      if (t.name === 'link') {
        const rel = (t.attrs.rel ?? '').toLowerCase().split(/\s+/);
        if (rel.includes('preconnect') || rel.includes('dns-prefetch'))
          problems.push(`${page.path}: <link rel=${t.attrs.rel}> to ${t.attrs.href}`);
        if (!rel.some((r) => LINK_LOADS.has(r))) continue; // canonical / alternate: references, not loads
        for (const u of urlsOf(t))
          if (!u.startsWith('/') || u.startsWith('//'))
            problems.push(
              `${page.path}: <link rel=${t.attrs.rel}> loads ${u} (must be same-origin, root-relative)`,
            );
        continue;
      }
      for (const u of urlsOf(t)) {
        if (u.startsWith('data:') && t.name !== 'img')
          problems.push(`${page.path}: data: URL on <${t.name}>`);
        else if (!u.startsWith('data:') && !isSameOrigin(u, origin))
          problems.push(`${page.path}: <${t.name}> loads ${u} from another origin`);
      }
    }
  }
  for (const file of files.filter((f) => f.endsWith('.css'))) {
    const css = readFileSync(file, 'utf8');
    for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g))
      if (!isSameOrigin(m[2], origin) && !m[2].startsWith('data:'))
        problems.push(`${path.basename(file)}: url(${m[2]}) from another origin`);
    if (/@import\s+(url\()?['"]?(https?:)?\/\//.test(css))
      problems.push(`${path.basename(file)}: remote @import`);
  }
  for (const file of files.filter((f) => f.endsWith('.js'))) {
    const js = readFileSync(file, 'utf8');
    // fetch() is allowed only for the booking request (same origin – absolute URLs are refused just below).
    const banned = ['document.cookie', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'EventSource'];
    if (!bookingRequest) banned.push('fetch(');
    for (const bad of banned)
      if (js.includes(bad))
        problems.push(`${path.basename(file)}: uses ${bad} (the page sends nothing anywhere)`);
    // XML namespace names (createElementNS) are identifiers, not requests.
    const remote = (js.match(/https?:\/\/[^\s"'`]+/g) ?? []).filter(
      (u) => !/^http:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink|1999\/xhtml)$/.test(u),
    );
    if (remote.length)
      problems.push(`${path.basename(file)}: absolute URL(s) ${remote.join(', ')}`);
  }
  return problems;
}

/**
 * Positioning and wording (FB-INV-002, concept 2.3–2.4, DOM landing-positioning) on everything a visitor or a search
 * engine reads: visible text, <title>, meta and JSON-LD. No room count, never "apartment"/"căn", no self-claimed hotel
 * class, no plain "Book"/"Đặt phòng" button (option A is a request), "meter" only in the long-stay FAQ.
 */
export const BANNED = [
  /apartment/i,
  /serviced/i,
  /căn hộ/iu,
  /(?<!\p{L})căn(?!\p{L})/iu,
  /\bten (rooms|apartments|names)\b/i,
  /(?<!\p{L})mười(?!\p{L})/iu,
  /\b10 (căn|phòng|rooms|apartments)\b/iu,
  /numberOfRooms/,
  /The Pine|The Ember|The Mist/,
  /monthly agreement/i,
  /hợp đồng theo tháng/iu,
  /\blease\b/i,
  /thuê tháng/iu,
  /bốn hạng phòng/iu,
  /\bis a hotel\b/i,
  /là khách sạn/iu,
  /\b\d\s*-?\s*(star|sao)\b/iu,
  /luxury hotel|sang trọng/iu,
  // "extra bed" is no longer banned: Premium has a 1.4 m extra bed (INV 22/10, replaces 4c "sofa"). copy.test.ts
  // keeps it to the Premium room and the capacity note.
  /instant confirmation|xác nhận ngay/iu,
];

export function checkWording({ html }) {
  const problems = [];
  for (const page of html) {
    const scripts = [
      ...page.source.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ),
    ]
      .map((m) => m[1])
      .join(' ');
    const metas = tags(page.source)
      .filter((x) => x.name === 'meta' && x.attrs.content)
      .map((x) => x.attrs.content)
      .join(' ');
    const all = `${visibleText(page.source)} ${metas} ${scripts}`;
    for (const re of BANNED) {
      const m = all.match(re);
      if (m) problems.push(`${page.path}: banned wording "${m[0]}" (${re})`);
    }
    const body = page.source.split(/<body[^>]*>/)[1] ?? '';
    const hotel = (visibleText(body).match(/hotel|khách sạn/giu) ?? []).length;
    if (hotel > 3)
      problems.push(`${page.path}: "hotel/khách sạn" ${hotel}× (concept 2.4 allows 3 comparisons)`);
    for (const m of body.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const label = visibleText(m[2]).replace(/\s+/g, ' ').trim();
      if (/^(book|đặt phòng|book now)$/iu.test(label))
        problems.push(
          `${page.path}: <${m[1]}> labelled "${label}" – use "Request to book" (concept T5)`,
        );
    }
    const why = body.match(/<section[^>]*id="why"[\s\S]*?<\/section>/)?.[0] ?? '';
    if (/meter|công tơ/iu.test(visibleText(why)))
      problems.push(`${page.path}: "meter/công tơ" in #why (concept N3)`);
  }
  return problems;
}

/** Exactly one <h1> per page (concept 11.1). */
export function checkSingleH1({ html }) {
  return html
    .map((p) => [p.path, (p.source.match(/<h1[\s>]/gi) ?? []).length])
    .filter(([, n]) => n !== 1)
    .map(([p, n]) => `${p}: ${n} <h1>`);
}

/**
 * Forms and OTA links. `bookingRequest` = the booking form is rendered (review build or feature on).
 *  - Not rendered (production today, concept 5.5 "chat"): no form or input of any kind (US-151 AC3, SEC UXD-03).
 *  - Rendered: SEC UXD-08 – the <form> is `hidden` and has NO `action` (the module script shows it and posts JSON to the
 *    same origin; without JavaScript it can never be submitted); a honeypot named `website`, kept off screen by class;
 *    an unticked consent box; no file input (ADR-014 4.6).
 * Never a link to an OTA (US-151 AC3).
 */
export function checkForms({ html }, { bookingRequest = false } = {}) {
  const problems = [];
  for (const page of html) {
    const t = tags(page.source);
    for (const x of t) {
      if (x.name === 'a' && OTA.test(x.attrs.href ?? ''))
        problems.push(`${page.path}: OTA link ${x.attrs.href}`);
      if (!['form', 'input', 'textarea', 'select'].includes(x.name)) continue;
      if (!bookingRequest) {
        problems.push(`${page.path}: <${x.name}> while the booking form is off`);
        continue;
      }
      if (x.name === 'form') {
        if (x.attrs.hidden === undefined)
          problems.push(`${page.path}: <form> not rendered hidden (SEC UXD-08)`);
        if (x.attrs.action !== undefined)
          problems.push(`${page.path}: <form action> present (SEC UXD-08)`);
      }
      if (x.name === 'input' && (x.attrs.type ?? '').toLowerCase() === 'file')
        problems.push(`${page.path}: file input (no documents at this step – ADR-014 4.6)`);
      if (x.name === 'input' && x.attrs.type === 'checkbox' && x.attrs.checked !== undefined)
        problems.push(`${page.path}: pre-ticked checkbox ${x.attrs.name} (SEC C-3)`);
    }
    if (bookingRequest && t.some((x) => x.name === 'form')) {
      const hp = t.find((x) => x.name === 'input' && x.attrs.name === 'website');
      if (!hp) problems.push(`${page.path}: honeypot input "website" missing (ADR-014 4.4)`);
      else if (hp.attrs.tabindex !== '-1' || hp.attrs.autocomplete !== 'off')
        problems.push(`${page.path}: honeypot must be tabindex=-1 autocomplete=off (SEC UXD-05)`);
    }
  }
  return problems;
}

/**
 * Where a rendered form sends (US-155 v1.0): `data-transport` is `preview` (never sends) or `api`; the api form names a
 * property slug (`PropertySlug` ^[a-z0-9-]{2,40}$), a published notice version (`consentVersion`) and an API base that
 * is empty (same origin – the contract route, CSP connect-src 'self') or exactly `apiOrigin` (https origin, no path).
 * Pages without the form, and builds without it, link to no privacy page unless it is published (`privacy`).
 */
export function checkFormEndpoint(
  { html },
  { bookingRequest = false, apiOrigin = '', privacy } = {},
) {
  const problems = [];
  const published = privacy ?? bookingRequest;
  for (const page of html) {
    const t = tags(page.source);
    for (const a of t.filter((x) => x.name === 'a' && /\/privacy\//.test(x.attrs.href ?? '')))
      if (!published)
        problems.push(`${page.path}: link to ${a.attrs.href} but no privacy page is published`);
    const form = t.find((x) => x.name === 'form');
    if (!form) continue;
    const mode = form.attrs['data-transport'];
    if (!['preview', 'api'].includes(mode))
      problems.push(`${page.path}: form data-transport "${mode}" (preview | api)`);
    if (mode !== 'api') continue;
    if (!/^[a-z0-9-]{2,40}$/.test(form.attrs['data-property'] ?? ''))
      problems.push(`${page.path}: live form without a property slug`);
    if (!/^\d{4}-\d{2}-\d{2}(\.\d{1,2})?$/.test(form.attrs['data-consent-version'] ?? ''))
      problems.push(`${page.path}: live form without a privacy notice version`);
    const api = form.attrs['data-api'] ?? '';
    if (api !== '' && api !== apiOrigin)
      problems.push(
        `${page.path}: form posts to ${api} (expected same origin or ${apiOrigin || 'none'})`,
      );
    if (
      api !== '' &&
      !/^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(api) &&
      !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(api)
    )
      problems.push(`${page.path}: API base ${api} is not an https origin`);
  }
  return problems;
}

function head(page) {
  const t = tags(page.source);
  const meta = (key, value) =>
    t.find((x) => x.name === 'meta' && x.attrs[key] === value)?.attrs.content;
  return {
    lang: t.find((x) => x.name === 'html')?.attrs.lang,
    title: page.source.match(/<title>([^<]*)<\/title>/)?.[1],
    description: meta('name', 'description'),
    robots: meta('name', 'robots'),
    themeColor: meta('name', 'theme-color'),
    canonical: t.find((x) => x.name === 'link' && x.attrs.rel === 'canonical')?.attrs.href,
    alternates: t
      .filter((x) => x.name === 'link' && x.attrs.rel === 'alternate' && x.attrs.hreflang)
      .map((x) => ({ hreflang: x.attrs.hreflang, href: x.attrs.href })),
    og: Object.fromEntries(
      t
        .filter((x) => x.name === 'meta' && x.attrs.property?.startsWith('og:'))
        .map((x) => [x.attrs.property, x.attrs.content]),
    ),
    twitterCard: meta('name', 'twitter:card'),
    suggest: t.filter((x) => x.attrs['data-suggest'] !== undefined),
    jsonLd: scriptBodies(page.source)
      .filter((s) => /application\/ld\+json/.test(s.attrs))
      .map((s) => JSON.parse(s.body)),
  };
}

/**
 * ADR-014 3.3 + 5: published pages (those with a canonical) carry html lang = path language, canonical = self,
 * hreflang for every language + x-default = English of the same page, two-way; hidden suggestion strips with
 * data-nosnippet; title ≤ 60, description ≤ 160, Open Graph, JSON-LD LodgingBusiness. 404 pages: noindex only.
 */
export function checkSeo({ html, dist }, { siteUrl, langs, indexable }) {
  const problems = [];
  const site = siteUrl.replace(/\/+$/, '');
  const langOf = (p) =>
    langs.includes(p.split('/')[1]) && p.split('/')[1] !== 'en' ? p.split('/')[1] : 'en';
  const published = html.filter((p) => !/\/404\/$/.test(p.path));
  const heads = new Map(html.map((p) => [p.path, head(p)]));
  for (const page of html) {
    const h = heads.get(page.path);
    const lang = langOf(page.path);
    if (h.lang !== lang)
      problems.push(`${page.path}: <html lang="${h.lang}"> but path language is ${lang}`);
    if (!h.title || h.title.length > 60) problems.push(`${page.path}: title missing or > 60 chars`);
    if (!h.description || h.description.length > 160)
      problems.push(`${page.path}: description missing or > 160 chars`);
    if ((h.themeColor ?? '').toLowerCase() !== PALETTE.ivory)
      problems.push(`${page.path}: theme-color is not Ivory`);
    const isPublished = published.includes(page);
    const wantRobots = indexable && isPublished ? 'index, follow' : 'noindex, nofollow';
    if (h.robots !== wantRobots)
      problems.push(`${page.path}: robots "${h.robots}", expected "${wantRobots}"`);
    if (!isPublished) {
      if (h.canonical || h.alternates.length)
        problems.push(`${page.path}: 404 page must not declare canonical/hreflang`);
      continue;
    }
    if (h.canonical !== `${site}${page.path}`)
      problems.push(`${page.path}: canonical ${h.canonical}`);
    const slug = lang === 'en' ? page.path : page.path.replace(/^\/[a-z]{2}\//, '/');
    const expected = [
      ...langs.map((l) => [l, `${site}${l === 'en' ? slug : `/${l}${slug}`}`]),
      ['x-default', `${site}${slug}`],
    ];
    const got = new Map(h.alternates.map((a) => [a.hreflang, a.href]));
    if (got.size !== expected.length || h.alternates.length !== expected.length)
      problems.push(
        `${page.path}: hreflang set ${[...got.keys()].join(',')} – expected ${expected.map((e) => e[0]).join(',')}`,
      );
    for (const [l, href] of expected)
      if (got.get(l) !== href)
        problems.push(`${page.path}: hreflang ${l} → ${got.get(l)} (expected ${href})`);
    // two-way: every alternate page lists this page under this page's language
    for (const [l, href] of expected.filter(([l]) => l !== 'x-default')) {
      const other = heads.get(href.slice(site.length));
      if (!other) problems.push(`${page.path}: alternate ${l} ${href} is not a built page`);
      else if (
        !other.alternates.some((a) => a.hreflang === lang && a.href === `${site}${page.path}`)
      )
        problems.push(`${page.path}: ${href} does not link back with hreflang ${lang}`);
    }
    const otherLangs = langs.filter((l) => l !== lang);
    const strips = h.suggest.map((t) => t.attrs['data-suggest']).sort();
    if (strips.join() !== [...otherLangs].sort().join())
      problems.push(`${page.path}: suggestion strips ${strips.join(',')}`);
    for (const s of h.suggest) {
      if (s.attrs.hidden === undefined)
        problems.push(`${page.path}: suggestion strip ${s.attrs['data-suggest']} not hidden`);
      if (s.attrs['data-nosnippet'] === undefined)
        problems.push(`${page.path}: suggestion strip without data-nosnippet`);
      if (s.attrs.lang !== s.attrs['data-suggest'])
        problems.push(`${page.path}: suggestion strip lang ≠ its language`);
    }
    for (const k of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:type'])
      if (!h.og[k]) problems.push(`${page.path}: ${k} missing`);
    if (h.og['og:url'] !== `${site}${page.path}`)
      problems.push(`${page.path}: og:url ${h.og['og:url']}`);
    if (h.og['og:image']?.startsWith(site)) {
      try {
        statSync(path.join(dist, h.og['og:image'].slice(site.length)));
      } catch {
        problems.push(`${page.path}: og:image file ${h.og['og:image']} not in dist`);
      }
    } else problems.push(`${page.path}: og:image must be an absolute URL on ${site}`);
    if (h.twitterCard !== 'summary_large_image') problems.push(`${page.path}: twitter:card`);
    const graph = h.jsonLd.flatMap((d) => d['@graph'] ?? [d]);
    const lodging = graph.find((n) => n['@type'] === 'LodgingBusiness' || n['@type'] === 'Hotel');
    if (!lodging) problems.push(`${page.path}: JSON-LD LodgingBusiness missing`);
    else
      for (const k of ['name', 'address', 'telephone', 'image', 'url'])
        if (!lodging[k]) problems.push(`${page.path}: JSON-LD LodgingBusiness.${k} missing`);
    if (graph.some((n) => n.aggregateRating || n.review))
      problems.push(`${page.path}: self-served ratings in JSON-LD`);
    if (graph.some((n) => 'numberOfRooms' in n))
      problems.push(`${page.path}: room count in JSON-LD (FB-INV-002 point 1)`);
  }
  return problems;
}

/** Sitemap with xhtml:link for every language + x-default, published pages only; robots.txt by build mode. */
export function checkSitemapRobots({ dist, html }, { siteUrl, langs, indexable }) {
  const problems = [];
  const site = siteUrl.replace(/\/+$/, '');
  const read = (f) => {
    try {
      return readFileSync(path.join(dist, f), 'utf8');
    } catch {
      problems.push(`${f} missing`);
      return '';
    }
  };
  const index = read('sitemap-index.xml');
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!maps.length) problems.push('sitemap-index.xml lists no sitemap');
  const xml = maps.map((u) => read(u.slice(site.length + 1))).join('\n');
  const locs = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const published = html.filter((p) => !/\/404\/$/.test(p.path)).map((p) => `${site}${p.path}`);
  if ([...locs].sort().join() !== [...published].sort().join())
    problems.push(`sitemap URLs ${locs.join(', ')} ≠ published pages ${published.join(', ')}`);
  for (const block of xml.split('<url>').slice(1)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    const langsIn = [...block.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]).sort();
    const want = [...langs, 'x-default'].sort();
    if (langsIn.join() !== want.join())
      problems.push(`sitemap ${loc}: hreflang ${langsIn.join(',')}`);
  }
  const robots = read('robots.txt');
  if (indexable) {
    if (!/Allow: \/\n/.test(robots) || !robots.includes(`Sitemap: ${site}/sitemap-index.xml`))
      problems.push('robots.txt (production) must allow / and point to the sitemap');
    if (!robots.includes('Disallow: /v1/')) problems.push('robots.txt must disallow /v1/');
  } else if (!/Disallow: \/\s*$/m.test(robots))
    problems.push('robots.txt (preview build) must disallow everything');
  return problems;
}

/** Brand Guidelines v1.0: every colour in built CSS, HTML (inline SVG, meta) and SVG files is in the palette. */
export function checkBrandColors({ files, html }) {
  const problems = [];
  const allowed = new Set(Object.values(PALETTE));
  // Fully transparent hex (#0000, #00000000 – how minifiers write `transparent`) is not a colour.
  const hexes = (text) =>
    [...text.matchAll(/#([0-9a-f]{3,8})\b/gi)]
      .map((m) => m[1])
      .filter((h) => !((h.length === 4 && h[3] === '0') || (h.length === 8 && h.endsWith('00'))))
      .map((h) => normalizeHex(h));
  for (const file of files.filter((f) => /\.(css|svg)$/.test(f))) {
    const text = readFileSync(file, 'utf8');
    for (const hex of hexes(text))
      if (!allowed.has(hex))
        problems.push(`${path.basename(file)}: ${hex} not in the brand palette`);
    if (/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\(/i.test(text))
      problems.push(`${path.basename(file)}: functional colour notation`);
    if (file.endsWith('.css'))
      problems.push(...namedColors(text).map((n) => `${path.basename(file)}: named colour ${n}`));
  }
  for (const page of html) {
    for (const t of tags(page.source)) {
      for (const k of ['fill', 'stroke', 'color', 'stop-color', 'content']) {
        const v = t.attrs[k];
        if (!v) continue;
        if (k === 'content' && t.attrs.name !== 'theme-color') continue;
        if (/^#/.test(v) && !allowed.has(normalizeHex(v.slice(1))))
          problems.push(`${page.path}: ${k}="${v}" on <${t.name}>`);
        if (k !== 'content' && !/^(none|currentcolor|#[0-9a-f]+)$/i.test(v))
          problems.push(`${page.path}: ${k}="${v}" on <${t.name}>`);
      }
    }
  }
  return problems;
}

function normalizeHex(h) {
  const x = h.toLowerCase();
  const full = x.length === 3 || x.length === 4 ? [...x].map((c) => c + c).join('') : x;
  return `#${full.slice(0, 6)}`;
}

/** Named colours used as values of colour properties in a stylesheet. */
export function namedColors(css) {
  const found = [];
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/gi)) {
    if (!COLOR_PROPS.test(m[1].toLowerCase())) continue;
    for (const word of m[2].toLowerCase().match(/[a-z]+/g) ?? [])
      if (NAMED_COLORS.includes(word) && !m[2].toLowerCase().includes(`--brand-${word}`))
        found.push(`${m[1]}: ${word}`);
  }
  return found;
}

/** Byte budgets (ADR-014 7.7, 9; concept 11.2 hero per DPR). */
export function checkBudgets({ dist, files, html }, { bookingRequest: bookingForm = false } = {}) {
  const problems = [];
  const size = (f) => statSync(f).size;
  const gz = (f) => gzipSync(readFileSync(f)).length;
  const total = files.reduce((n, f) => n + size(f), 0);
  if (total > BUDGET.distTotal) problems.push(`dist ${total} B > ${BUDGET.distTotal}`);
  for (const f of files.filter((f) => /\.(avif|webp|jpe?g|png)$/.test(f)))
    if (size(f) > BUDGET.imageMax)
      problems.push(`${path.basename(f)} ${size(f)} B > ${BUDGET.imageMax}`);
  const hero = (w) =>
    files.find((f) => new RegExp(`/hero-facade-dusk-${w}\\.[\\w-]+\\.avif$`).test(f));
  for (const [w, max] of [
    [480, BUDGET.heroAvif480],
    [960, BUDGET.heroAvif960],
    [1600, BUDGET.heroAvif1600],
  ]) {
    const f = hero(w);
    if (!f) problems.push(`hero AVIF ${w} w missing`);
    else if (size(f) > max) problems.push(`hero AVIF ${w} w ${size(f)} B > ${max}`);
  }
  for (const f of files.filter((f) => /\.(woff2?|ttf|otf)$/.test(f))) {
    const name = path.basename(f);
    if (!name.endsWith('.woff2')) problems.push(`${name}: only woff2 is shipped`);
    const allowed =
      /^(lora|be-vietnam-pro)-(latin|latin-ext|vietnamese)-\d{3}-(normal|italic)\./.test(name) ||
      (bookingForm && /^jetbrains-mono-latin-400-normal\./.test(name));
    if (!allowed)
      problems.push(
        `${name}: font outside Lora + Be Vietnam Pro (latin/latin-ext/vietnamese) or, with the form, JetBrains Mono latin 400`,
      );
    if (size(f) > BUDGET.fontFile) problems.push(`${name} ${size(f)} B > ${BUDGET.fontFile}`);
  }
  for (const page of html) {
    const t = tags(page.source);
    const local = (u) => path.join(dist, u.replace(/^\//, '').split('?')[0]);
    const js = t.filter((x) => x.name === 'script' && x.attrs.src).map((x) => local(x.attrs.src));
    const css = t
      .filter((x) => x.name === 'link' && x.attrs.rel === 'stylesheet')
      .map((x) => local(x.attrs.href));
    const jsGz = js.reduce((n, f) => n + gz(f), 0);
    const cssGz = css.reduce((n, f) => n + gz(f), 0);
    if (jsGz > BUDGET.jsGzPerPage)
      problems.push(`${page.path}: JS ${jsGz} B gzip > ${BUDGET.jsGzPerPage}`);
    if (cssGz > BUDGET.cssGzPerPage)
      problems.push(`${page.path}: CSS ${cssGz} B gzip > ${BUDGET.cssGzPerPage}`);
    const htmlGz = gzipSync(page.source).length;
    if (htmlGz > BUDGET.htmlGz)
      problems.push(`${page.path}: HTML ${htmlGz} B gzip > ${BUDGET.htmlGz}`);
  }
  return problems;
}

/**
 * Photos (concept 8.3, US-153 AC2/AC5): every <img> has width/height/alt; only the hero is eager (+ fetchpriority);
 * phone sources never offer more than 960 w.
 */
export function checkImages({ html }) {
  const problems = [];
  for (const page of html) {
    const t = tags(page.source);
    for (const img of t.filter((x) => x.name === 'img')) {
      const a = img.attrs;
      if (!a.width || !a.height) problems.push(`${page.path}: <img ${a.src}> without width/height`);
      if (!a.alt?.trim()) problems.push(`${page.path}: <img ${a.src}> without alt`);
      const hero = /hero-facade-dusk/.test(a.src ?? '');
      if (hero && (a.loading === 'lazy' || a.fetchpriority !== 'high'))
        problems.push(`${page.path}: hero must be eager + fetchpriority=high`);
      if (!hero && a.loading !== 'lazy') problems.push(`${page.path}: <img ${a.src}> not lazy`);
    }
    for (const s of t.filter(
      (x) => x.name === 'source' && /max-width:\s*767px/.test(x.attrs.media ?? ''),
    )) {
      const widths = (s.attrs.srcset ?? '')
        .split(',')
        .map((c) => Number(c.trim().split(/\s+/)[1]?.replace('w', '')));
      if (widths.some((w) => w > 960))
        problems.push(`${page.path}: phone <source> offers ${Math.max(...widths)} w (> 960)`);
    }
  }
  return problems;
}

/**
 * Every visible character is covered by the self-hosted subsets (latin, latin-ext, vietnamese – concept 3.3):
 * no glyph falls back to Arial/Georgia. Ranges are read from the built CSS @font-face rules.
 */
export function checkGlyphCoverage({ files, html }) {
  const css = files
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  // U+0100-02BA, U+0131, or the wildcard form minifiers emit (U+?? = U+0000-00FF).
  const ranges = [...css.matchAll(/unicode-range:\s*([^;}]+)/g)].flatMap((m) =>
    m[1].split(',').map((r) => {
      const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
      if (!b && a.includes('?'))
        return [parseInt(a.replace(/\?/g, '0'), 16), parseInt(a.replace(/\?/g, 'F'), 16)];
      return [parseInt(a, 16), parseInt(b ?? a, 16)];
    }),
  );
  if (!ranges.length) return ['no unicode-range in the built CSS'];
  const covered = (cp) => cp <= 0x20 || ranges.some(([a, b]) => cp >= a && cp <= b);
  const problems = [];
  for (const page of html) {
    const missing = new Set(
      [...visibleText(page.source)].filter((ch) => !covered(ch.codePointAt(0))),
    );
    if (missing.size)
      problems.push(
        `${page.path}: characters outside the font subsets: ${[...missing].map((c) => `${c} U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(', ')}`,
      );
  }
  return problems;
}

export function runAll(dist, opts) {
  const d = loadDist(dist);
  return {
    inlineCode: checkInlineCode(d),
    thirdParty: checkThirdParty(d, opts.siteUrl, opts),
    singleH1: checkSingleH1(d),
    forms: checkForms(d, opts),
    formEndpoint: checkFormEndpoint(d, opts),
    wording: checkWording(d),
    seo: checkSeo(d, opts),
    sitemapRobots: checkSitemapRobots(d, opts),
    brandColors: checkBrandColors(d),
    budgets: checkBudgets(d, opts),
    images: checkImages(d),
    glyphs: checkGlyphCoverage(d),
  };
}
