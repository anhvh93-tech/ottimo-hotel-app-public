import { NAV, type NavItem } from './nav';

const PROBE_ORIGIN = 'https://desk.invalid';
// Backslash and the percent-encoded backslash / control characters (%5C, %00–%1F, %7F).
const UNSAFE_TEXT = /\\|%5c|%[01][0-9a-f]|%7f/i;
const hasControl = (s: string) =>
  [...s].some((ch) => {
    const c = ch.charCodeAt(0);
    return c < 0x20 || c === 0x7f;
  });
const unsafe = (s: string) => UNSAFE_TEXT.test(s) || hasControl(s);

/**
 * R3-Q31 / SEC E (GHSA-wrjc-x8rr-h8h6): a "return to" path is only followed when it is a plain path of
 * THIS app – one leading "/", no "//", no backslash (raw or encoded), no scheme, no control character, and
 * it still resolves to the same origin. Anything else → null (the caller goes home). Never pass a string
 * from the query or the hash to `navigate()` without this check.
 */
export function safeInternalPath(from: unknown): string | null {
  if (typeof from !== 'string' || from.length === 0 || from.length > 2048) return null;
  if (!from.startsWith('/') || from.startsWith('//')) return null;
  if (unsafe(from)) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(from);
  } catch {
    return null;
  }
  if (decoded.startsWith('//') || unsafe(decoded)) return null;
  try {
    if (new URL(from, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return null;
  } catch {
    return null;
  }
  return from;
}

/** Menu item a path belongs to – whole segments only (`/overview` matches `/overview/x`, not `/overviewx`). */
export function navItemOf(path: string): NavItem | undefined {
  const pathname = path.split(/[?#]/)[0]!;
  return NAV.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`));
}
