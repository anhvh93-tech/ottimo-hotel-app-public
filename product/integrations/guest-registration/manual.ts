// GuestRegistrationAdapter 'manual' / semi-auto (README 3.6). Owner: INT.
// FB-R2-ARC-BE-S3-20 (ARC 17/10/2026): the portal data (field list, order, date/nationality format, BR-605
// clamp, clipboard text) has ONE implementation – BE-C `registration/internal/rules.ts` (portalFields /
// portalClipboard + portal-copy). This adapter builds no field: it only (a) hands back what the core built,
// after checking the portal address is https, and (b) validates the portal file reference typed back by
// staff. The police portals have no public API – nothing is sent anywhere, nothing is written or logged.
// Portal addresses: GUEST_REGISTRATION_PORTAL_URL_FOREIGNER / _VN, read by BE-C `portal-config.ts`.
import { IntegrationError, type IntegrationContext } from '../contracts/common.js';
import type {
  GuestRegistrationAdapter,
  GuestRegistrationPrepared,
} from '../contracts/guest-registration.js';

/** Portal file reference (EP06 5.2 `mark-sent`): 3–64 characters A–Z a–z 0–9 - / . _ */
export const PORTAL_REFERENCE_PATTERN = /^[A-Za-z0-9\-/._]{3,64}$/;

/**
 * Implemented by the core (BE-C): returns the portal data built by `registration/internal/rules.ts`,
 * C3 values decrypted only AFTER c3_access_log was written (SEC B3/E1), for one stay only (A75, SEC E3).
 */
export interface RegistrationPortalSource {
  prepare(ctx: IntegrationContext, stayId: string): Promise<GuestRegistrationPrepared>;
}

/** Trims and checks the portal reference; message never echoes the value. */
export function validatePortalReference(portalReference: string): string {
  const v = portalReference.trim();
  if (!PORTAL_REFERENCE_PATTERN.test(v)) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      'portalReference must be 3–64 characters [A-Za-z0-9-/._]',
    );
  }
  return v;
}

/** https only – the clipboard holds C3 data, staff must never be sent to a plain-http look-alike. */
export function assertPortalUrl(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new IntegrationError('CONFIG', 'Portal URL must be an https URL');
  }
  if (u.protocol !== 'https:')
    throw new IntegrationError('CONFIG', 'Portal URL must be an https URL');
  return url;
}

export class ManualGuestRegistrationAdapter implements GuestRegistrationAdapter {
  constructor(private readonly source: RegistrationPortalSource) {}

  /** Contract 3.6: delegates to the core's single implementation; no field is built here. */
  async prepare(ctx: IntegrationContext, stayId: string): Promise<GuestRegistrationPrepared> {
    if (!stayId) throw new IntegrationError('INVALID_REQUEST', 'stayId is required');
    const prepared = await this.source.prepare(ctx, stayId);
    assertPortalUrl(prepared.portalUrl);
    return prepared;
  }

  /** Validates the reference only; the core records submitter (session userId), time and state (K6). */
  async recordSubmission(
    ctx: IntegrationContext,
    stayId: string,
    portalReference: string,
  ): Promise<void> {
    void ctx;
    if (!stayId) throw new IntegrationError('INVALID_REQUEST', 'stayId is required');
    validatePortalReference(portalReference);
  }
}
