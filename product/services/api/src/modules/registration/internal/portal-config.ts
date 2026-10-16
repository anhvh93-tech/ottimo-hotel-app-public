/**
 * Addresses of the declaration portals (BR-606; ARC FB-R2-ARC-BE-S3-20: from configuration, one source with
 * INT's README): GUEST_REGISTRATION_PORTAL_URL_FOREIGNER / GUEST_REGISTRATION_PORTAL_URL_VN, https only.
 * Defaults = the two portals named by BR-606 / EP06 5.1. Staff log in themselves (R-REG-06) – no credential.
 */
import type { PortalKind } from './rules';

export const PORTAL_URLS = Symbol('PORTAL_URLS');

export type PortalUrls = Readonly<Record<PortalKind, string>>;

export const DEFAULT_PORTAL_URLS: PortalUrls = {
  foreigner_temp_residence: 'https://tbltkbtt.bocongan.gov.vn',
  vn_citizen_stay: 'https://dichvucong.bocongan.gov.vn',
};

function httpsUrl(name: string, raw: string | undefined, fallback: string): string {
  const v = (raw ?? '').trim();
  if (v === '') return fallback;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    throw new Error(`${name} must be an https URL`);
  }
  if (u.protocol !== 'https:') throw new Error(`${name} must be an https URL`);
  return u.toString().replace(/\/$/, '');
}

export function portalUrlsFromEnv(env: NodeJS.ProcessEnv): PortalUrls {
  return {
    foreigner_temp_residence: httpsUrl(
      'GUEST_REGISTRATION_PORTAL_URL_FOREIGNER',
      env.GUEST_REGISTRATION_PORTAL_URL_FOREIGNER,
      DEFAULT_PORTAL_URLS.foreigner_temp_residence,
    ),
    vn_citizen_stay: httpsUrl(
      'GUEST_REGISTRATION_PORTAL_URL_VN',
      env.GUEST_REGISTRATION_PORTAL_URL_VN,
      DEFAULT_PORTAL_URLS.vn_citizen_stay,
    ),
  };
}
