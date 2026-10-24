// The dist checks must catch what they claim to catch: each rule is run against a small broken site.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as checks from '../../scripts/dist-checks.mjs';

const dir = mkdtempSync(path.join(tmpdir(), 'landing-dist-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function site(files: Record<string, string>) {
  const root = mkdtempSync(path.join(dir, 's-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  return checks.loadDist(root);
}
const page = (body: string, head = '') =>
  `<!DOCTYPE html><html lang="en"><head><title>t</title>${head}</head><body>${body}</body></html>`;

describe('dist checks catch violations', () => {
  it('inline script, <style>, style= and on*=', () => {
    const d = site({
      'index.html': page(
        '<h1>x</h1><script>alert(1)</script><p style="color:red" onclick="x()">y</p>',
        '<style>p{}</style>',
      ),
    });
    expect(checks.checkInlineCode(d)).toHaveLength(4);
  });

  it('a Google Fonts stylesheet, an iframe map and a CDN script', () => {
    const d = site({
      'index.html': page(
        '<h1>x</h1><iframe src="https://www.google.com/maps/embed"></iframe><script type="module" src="https://cdn.example.com/a.js"></script>',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora"><link rel="preconnect" href="https://fonts.gstatic.com">',
      ),
      '_astro/a.css': 'body{background:url(https://example.com/bg.png)}',
      '_astro/a.js': 'document.cookie="a=1";fetch("/v1/x")',
    });
    const problems = checks.checkThirdParty(d, 'https://ottimo.vn');
    expect(problems.join('\n')).toMatch(/iframe/);
    expect(problems.join('\n')).toMatch(/fonts\.googleapis/);
    expect(problems.join('\n')).toMatch(/preconnect/);
    expect(problems.join('\n')).toMatch(/cdn\.example\.com/);
    expect(problems.join('\n')).toMatch(/example\.com\/bg\.png/);
    expect(problems.join('\n')).toMatch(/document\.cookie/);
    expect(problems.join('\n')).toMatch(/fetch\(/);
  });

  it('zero or two H1, a form, an OTA link', () => {
    const d = site({
      'index.html': page(
        '<h1>a</h1><h1>b</h1><form><input name="x"></form><a href="https://www.booking.com/hotel/vn/x">x</a>',
      ),
      'vi/index.html': page('<h2>no h1</h2>'),
    });
    expect(checks.checkSingleH1(d)).toHaveLength(2);
    expect(checks.checkForms(d)).toHaveLength(3); // booking request off: form + input + OTA link
  });

  it('form rendered: hidden, no action, honeypot, unticked consent (SEC UXD-08); fetch only same origin', () => {
    const ok = site({
      'index.html': page(
        '<h1>x</h1><form id="bk-form" method="post" hidden><input name="guestName"><input type="checkbox" name="consent">' +
          '<input name="website" tabindex="-1" autocomplete="off"></form>',
      ),
      '_astro/f.js': 'fetch("/v1/public/properties/ottimo/form-token")',
    });
    expect(checks.checkForms(ok, { bookingRequest: true })).toEqual([]);
    expect(checks.checkThirdParty(ok, 'https://ottimo.vn', { bookingRequest: true })).toEqual([]);
    expect(checks.checkThirdParty(ok, 'https://ottimo.vn')).toHaveLength(1); // fetch while off
    const bad = site({
      'index.html': page(
        '<h1>x</h1><form action="/v1/public/x" method="post"><input type="file" name="id">' +
          '<input type="checkbox" name="consent" checked></form>',
      ),
      '_astro/f.js': 'fetch("https://api.example.com/x")',
    });
    const problems = checks.checkForms(bad, { bookingRequest: true }).join('\n');
    expect(problems).toMatch(/not rendered hidden/);
    expect(problems).toMatch(/action/);
    expect(problems).toMatch(/file input/);
    expect(problems).toMatch(/pre-ticked/);
    expect(problems).toMatch(/honeypot/);
    expect(
      checks.checkThirdParty(bad, 'https://ottimo.vn', { bookingRequest: true }).join('\n'),
    ).toMatch(/api\.example\.com/);
  });

  it('wording: room count, "apartment", plain "Book" button, meter in #why, any hotel word, fees, old names', () => {
    const d = site({
      'index.html': page(
        '<h1>x</h1><section id="why"><p>Utilities by meter</p></section><p>Ten apartments in Da Lat</p><a href="#book">Book</a>' +
          '<p>The care of a small hotel. Giường phụ có phụ thu. Online requests open soon. Standard Studio · City View</p>' +
          '<p>a [[1.4 m]] extra bed</p>',
      ),
      'vi/index.html': page('<h1>x</h1><p>Không như một khách sạn.</p>'),
    });
    const problems = checks.checkWording(d).join('\n');
    expect(problems).toMatch(/apartment/);
    expect(problems).toMatch(/ten \(rooms\|apartments\|names\)/);
    expect(problems).toMatch(/labelled "Book"/);
    expect(problems).toMatch(/#why/);
    expect(problems).toMatch(/small hotel/);
    expect(problems).toMatch(/phụ thu/);
    expect(problems).toMatch(/open soon/);
    expect(problems).toMatch(/Standard Studio/);
    expect(problems).toMatch(/by meter/);
    expect(problems).toMatch(/copy markup/);
    // a single "khách sạn" is enough since INV 24/10 (was: up to 3 comparisons)
    expect(problems).toMatch(/\/vi\/: "hotel\/khách sạn" 1×/);
  });

  it('a terracotta accent, a named colour and rgb() in CSS', () => {
    const d = site({
      'index.html': page('<h1>x</h1><svg><path fill="#C0634A"></path></svg>'),
      '_astro/a.css': 'a{color:#c0634a}b{background:rgb(1,2,3)}i{border:1px solid red}',
    });
    const problems = checks.checkBrandColors(d).join('\n');
    expect(problems).toMatch(/#c0634a not in the brand palette/);
    expect(problems).toMatch(/functional colour/);
    expect(problems).toMatch(/named colour .*red/);
    expect(problems).toMatch(/fill="#C0634A"/);
  });

  it('missing hreflang back-link and x-default', () => {
    const head = (self: string, alts: string) =>
      `<meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#F4F0E8"><meta name="description" content="d"><link rel="canonical" href="https://ottimo.vn${self}">${alts}`;
    const d = site({
      'index.html': page(
        '<h1>x</h1>',
        head(
          '/',
          '<link rel="alternate" hreflang="en" href="https://ottimo.vn/"><link rel="alternate" hreflang="vi" href="https://ottimo.vn/vi/">',
        ),
      ),
      'vi/index.html': page('<h1>x</h1>', head('/vi/', '')).replace('lang="en"', 'lang="vi"'),
    });
    const problems = checks
      .checkSeo(d, { siteUrl: 'https://ottimo.vn', langs: ['en', 'vi'], indexable: false })
      .join('\n');
    expect(problems).toMatch(/x-default/);
    expect(problems).toMatch(/does not link back/);
  });

  it('a character outside the font subsets', () => {
    const d = site({
      'index.html': page('<h1>Go →</h1>'),
      '_astro/a.css': '@font-face{font-family:x;src:url(/a.woff2);unicode-range:U+??,U+131}',
    });
    expect(checks.checkGlyphCoverage(d).join('\n')).toMatch(/U\+2192/);
  });
});
