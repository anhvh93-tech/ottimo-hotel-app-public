// CSP of the landing origin (ADR-014 1.4): connect-src stays 'self' unless the live form names one API origin.
import { describe, expect, it } from 'vitest';
import { apiOriginOf, securityHeaders } from './headers.mjs';

describe('landing security headers', () => {
  it("default: connect-src 'self' only, nothing inline", () => {
    const csp = securityHeaders()['Content-Security-Policy'];
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toContain("script-src 'self';");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
  });
  it('a live form on another API origin adds exactly that origin to connect-src, nothing else', () => {
    const base = securityHeaders()['Content-Security-Policy'];
    const csp = securityHeaders({ apiOrigin: 'https://desk.ottimo.vn/' })[
      'Content-Security-Policy'
    ];
    expect(csp).toBe(
      base.replace("connect-src 'self'", "connect-src 'self' https://desk.ottimo.vn"),
    );
  });
  it('refuses anything that is not an https origin (http only on loopback for tests)', () => {
    expect(apiOriginOf('http://desk.ottimo.vn')).toBeNull();
    expect(apiOriginOf('javascript:alert(1)')).toBeNull();
    expect(apiOriginOf('http://127.0.0.1:5190')).toBe('http://127.0.0.1:5190');
    expect(securityHeaders({ apiOrigin: 'http://evil.example' })['Content-Security-Policy']).toBe(
      securityHeaders()['Content-Security-Policy'],
    );
  });
});
