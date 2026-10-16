// GuestRegistrationAdapter contract – residence declaration (README section 3.6 v0.2, ARC-14). Owner: INT.
// Only a 'semi_auto' implementation exists: no automatic filling/scraping of the police portal.
import type { IntegrationContext } from './common.js';

export type GuestRegistrationKind = 'foreigner_temp_residence' | 'vn_citizen_stay';

export interface GuestRegistrationPerson {
  personRef: string;
  kind: GuestRegistrationKind;
  /** value is C3: staff request on a trusted device only; core writes c3_access_log BEFORE returning;
   *  never via outbox/worker/log/notification. */
  fields: { label: string; value: string }[];
}

export interface GuestRegistrationPrepared {
  portalUrl: string;
  /** Mixed groups (VN + foreign) → one entry per person. */
  people: GuestRegistrationPerson[];
}

export interface GuestRegistrationAdapter {
  prepare(ctx: IntegrationContext, stayId: string): Promise<GuestRegistrationPrepared>;
  /** Submitter = userId from the session; the core records it. */
  recordSubmission(ctx: IntegrationContext, stayId: string, portalReference: string): Promise<void>;
}
