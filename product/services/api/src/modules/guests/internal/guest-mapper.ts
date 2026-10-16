/**
 * Guest / GuestSummary JSON from a `guest` row. Role filtering (x-visible-to, x-rbac-field – US-003 AC1)
 * is done by the shared serializer (src/shared/serialization) for every @Operation response; this mapper
 * only renames columns and leaves out empty values (absent, never null). guests.test.ts checks the
 * resulting JSON per role.
 */
import { maskPhone, phoneForApi } from '../public/normalize';

/** Copy without null/undefined values. */
export function dropEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null) out[k] = v;
  return out as Partial<T>;
}

export interface GuestRow {
  id: string;
  code: string;
  full_name: string;
  name_search: string;
  phone_e164: string | null;
  email_norm: string | null;
  messaging_handles: Record<string, string> | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality_code: string | null;
  is_foreigner: boolean;
  preferred_locale: string | null;
  preferred_contact: string | null;
  company_name: string | null;
  tax_code: string | null;
  tags: string[] | null;
  service_notes: string[] | null;
  free_note: string | null;
  id_doc_last4: string | null;
  crm_consent: string;
  created_by: string | null;
  version: number;
}

export interface GuestWarning {
  code: 'possible_duplicate_name_dob';
  guestId: string;
  guestCode: string;
}

export function guestDto(row: GuestRow, warnings?: GuestWarning[]): Record<string, unknown> {
  return dropEmpty({
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    phone: row.phone_e164 ? phoneForApi(row.phone_e164) : null,
    email: row.email_norm,
    messagingHandles: row.messaging_handles,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationalityCode: row.nationality_code,
    isForeigner: row.is_foreigner,
    preferredLocale: row.preferred_locale,
    preferredContact: row.preferred_contact,
    companyName: row.company_name,
    taxCode: row.tax_code,
    tags: row.tags,
    serviceNotes: row.service_notes,
    freeNote: row.free_note,
    idDocLast4: row.id_doc_last4,
    crmConsent: row.crm_consent,
    warnings: warnings ?? null,
    version: row.version,
  });
}

export function summaryDto(row: GuestRow): Record<string, unknown> {
  return dropEmpty({
    id: row.id,
    code: row.code,
    displayName: row.full_name,
    nationalityCode: row.nationality_code,
    phoneMasked: row.phone_e164 ? maskPhone(row.phone_e164) : null,
    tags: row.tags && row.tags.length ? row.tags : null,
  });
}
