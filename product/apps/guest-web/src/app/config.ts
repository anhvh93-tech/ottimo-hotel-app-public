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
 * Version of the data-processing notice whose text ships in design/copy (`gw.notice_body`).
 * The contract has no read endpoint for it yet (request to ARC in s3-report); the server answers
 * 422 NOT_IN_LIST if it moved on, and the page then asks the guest to reload.
 */
export const NOTICE_VERSION = 'privacy-2026-10-v1';

/**
 * `id_image_retention_days_after_checkout` default (business-rules BR-610). Not exposed to the guest
 * API yet – shown in the consent sentence only. [GIẢ ĐỊNH MOB – chờ ARC thêm vào OnlineCheckin]
 */
export const RETENTION_DAYS_DEFAULT = 30;
