export type ApiMode = 'mock' | 'server';

/** Dev defaults to the MSW mock (BE-C codes the guest portal in parallel); production always uses the server. */
export function apiMode(): ApiMode {
  if (!import.meta.env.DEV) return 'server';
  return import.meta.env.VITE_API_MODE === 'server' ? 'server' : 'mock';
}

/** Public desk phone shown when no session exists yet (expired link page). Optional, not a secret. */
export function fallbackDeskPhone(): string | undefined {
  const v = import.meta.env.VITE_DESK_PHONE;
  return v && /^\+?[0-9 ]{6,20}$/.test(v) ? v : undefined;
}

/**
 * Versions of the data-processing notice whose text ships in design/copy (`NOTICE_PARAGRAPHS` …).
 * The server tells the current one (`OnlineCheckin.currentNoticeVersion`, 0.3.6 addendum). A version
 * not listed here – or no version at all – means the page has no matching text: the flow fails closed
 * and sends the guest to the desk (ARC/SEC ĐK-2 17/10). Add a version only together with its text.
 * v1.0.4 P4-42 (SEC-on-plan-v1.0.4 6.4 ý 1): only v2 – the page no longer carries the v1 text, so a server
 * still on `privacy-2026-10-v1` fails closed until OWN sets the Desk parameter to v2.
 */
export const NOTICE_TEXT_VERSIONS: readonly string[] = ['privacy-2026-10-v2'];

/**
 * The notice of `privacy-2026-10-v2`, one paragraph per key, in the order of SEC-on-plan-v1.0.4 6.2 (under
 * `gw.notice_title`, before `gw.notice_read`). The words live in `gen_strings.py`, group
 * `v1.0.4 P4-42 privacy-2026-10-v2` – changing their meaning means a new version.
 */
export const NOTICE_PARAGRAPHS = [
  'gw.notice_body',
  'gw.notice_retention',
  'gw.notice_translation',
  'gw.notice_rights',
] as const;
