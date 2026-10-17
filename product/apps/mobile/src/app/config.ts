export type ApiMode = 'mock' | 'server';

/** Dev defaults to the MSW mock (BE-C builds the housekeeping module in parallel); production uses the server. */
export function apiMode(): ApiMode {
  if (!import.meta.env.DEV) return 'server';
  return import.meta.env.VITE_API_MODE === 'server' ? 'server' : 'mock';
}

/**
 * Front desk phone for "Gọi lễ tân" (DS 6.18 – there is no API to send an error report). Public number
 * from the build config; no number → the button is not shown.
 */
export function deskPhone(): string | undefined {
  const v = import.meta.env.VITE_DESK_PHONE;
  return v && /^\+?[0-9 ]{6,20}$/.test(v) ? v : undefined;
}

export function telHref(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9+]/g, '');
  return digits.length >= 6 ? `tel:${digits}` : undefined;
}

/** 10-second undo = 10-second delayed send (ADR-005 mục 3, DS 6.18). */
export const UNDO_MS = 10_000;
/** Tasks / room status refresh while the screen is open and online (SSE comes with BE-D). */
export const REFRESH_MS = 60_000;
