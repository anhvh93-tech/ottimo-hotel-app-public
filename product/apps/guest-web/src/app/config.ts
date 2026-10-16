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
 * Versions of the data-processing notice whose text ships in design/copy (`gw.notice_body` …).
 * The server tells the current one (`OnlineCheckin.currentNoticeVersion`, 0.3.6 addendum). A version
 * not listed here – or no version at all – means the page has no matching text: the flow fails closed
 * and sends the guest to the desk (ARC/SEC ĐK-2 17/10). Add a version only together with its text.
 */
export const NOTICE_TEXT_VERSIONS: readonly string[] = ['privacy-2026-10-v1'];
