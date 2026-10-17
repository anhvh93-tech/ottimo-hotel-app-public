import { describe, expect, it } from 'vitest';
import { SITE_URL, alternatesFor, langOfPath, pathFor } from './i18n';
import { robotsTxt } from './robots';
import { jsonForScript } from './seo';

describe('URL rules (ADR-014 3.2)', () => {
  it('English at the root without prefix, Vietnamese under /vi/, trailing slash always', () => {
    expect(pathFor('en')).toBe('/');
    expect(pathFor('vi')).toBe('/vi/');
    expect(pathFor('en', 'rooms/the-pine')).toBe('/rooms/the-pine/');
    expect(pathFor('vi', '/rooms/the-pine/')).toBe('/vi/rooms/the-pine/');
  });

  it('reads the language of a path', () => {
    expect(langOfPath('/')).toBe('en');
    expect(langOfPath('/vi/')).toBe('vi');
    expect(langOfPath('/vintage/')).toBe('en');
    expect(langOfPath('/en/x/')).toBe('en');
  });

  it('hreflang: every language + x-default = English of the same page', () => {
    expect(alternatesFor('')).toEqual([
      { hreflang: 'en', href: `${SITE_URL}/` },
      { hreflang: 'vi', href: `${SITE_URL}/vi/` },
      { hreflang: 'x-default', href: `${SITE_URL}/` },
    ]);
  });
});

describe('robots.txt and JSON-LD', () => {
  it('preview builds block everything; production allows / except /v1/ and links the sitemap', () => {
    expect(robotsTxt(false, 'https://ottimo.vn')).toBe('User-agent: *\nDisallow: /\n');
    const prod = robotsTxt(true, 'https://ottimo.vn');
    expect(prod).toContain('Allow: /\n');
    expect(prod).toContain('Disallow: /v1/\n');
    expect(prod).toContain('Sitemap: https://ottimo.vn/sitemap-index.xml');
  });

  it('JSON for a script block cannot close the tag', () => {
    expect(jsonForScript({ a: '</script><script>alert(1)</script>' })).not.toContain('<');
  });
});
