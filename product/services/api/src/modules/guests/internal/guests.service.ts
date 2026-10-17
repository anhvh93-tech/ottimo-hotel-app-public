/**
 * EP10 guest profiles – US-071 (create/edit), US-072 (duplicate blocking), US-073 (shared picker).
 * - Normalisation BR-951 (normalize.ts); phone OR e-mail required; no ID-number input (US-071 AC3).
 * - Duplicate phone/e-mail among live profiles → 409 DUPLICATE_GUEST (+ existingGuestId/Code when the
 *   caller may see that profile); race-safe through the partial unique indexes (23505 → same 409).
 * - Similar name (BR-952) + same date of birth (or same nationality when a DOB is missing) → warning only,
 *   computed on create/update with the trigram index (`%` operator, threshold 0.3 – FB-R2-ARC-BE-07) and
 *   stored as guest.possible_duplicate_at on BOTH profiles (OpenAPI 0.3.4 Q7 → GuestSummary
 *   .possibleDuplicate); getGuest only recomputes the list for a flagged profile (no scan per view).
 * - Scope (x-scope own): a caller whose roles are only sales_staff/collaborator sees the profiles they
 *   created; anything else → 404 (search/picker filter in SQL – coding-standards 7.7).
 * - SAL/CTV contact probes: searches, lookups AND create/update carrying a phone/e-mail share one counter
 *   of 30/hour/user (SR-RL-07); every contact lookup – and a create/update refused because the contact
 *   belongs to a profile outside the caller's scope – writes audit_event access `guest.lookup` without the
 *   looked-up value (FB-R2-SEC-BE-09; the controller writes it after the rollback).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import { type Tx, pgCode } from '../../../db/database';
import { type FieldError, problem } from '../../../shared/problem';
import type { LocalDate } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { RATE_LIMITER, RATE_RULES, type RateLimiter } from '../../identity/public/rate-limiter';
import { DocNumberService } from '../../platform/public/doc-number.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { looksLikeCardNumber } from '../../platform/public/validation';
import {
  isValidName,
  nameSearchKey,
  namesLookAlike,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  normalizeTaxCode,
} from '../public/normalize';
import { type GuestRow, type GuestWarning, guestDto, summaryDto } from './guest-mapper';

const FULL_SCOPE_ROLES = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const HANDLE_KEYS = ['zalo', 'whatsapp', 'kakaotalk'] as const;

export interface GuestInput {
  fullName?: string | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  messagingHandles?: Record<string, string> | null | undefined;
  dateOfBirth?: string | null | undefined;
  gender?: 'male' | 'female' | 'other' | null | undefined;
  nationalityCode?: string | null | undefined;
  preferredLocale?: 'vi' | 'en' | 'ru' | null | undefined;
  preferredContact?: 'phone' | 'zalo' | 'whatsapp' | 'kakaotalk' | 'email' | null | undefined;
  companyName?: string | null | undefined;
  taxCode?: string | null | undefined;
  tags?: string[] | null | undefined;
  serviceNotes?: string[] | null | undefined;
  freeNote?: string | null | undefined;
}

export interface Caller {
  userId: string;
  roles: readonly string[];
}

/** Only sales_staff/collaborator roles → own scope (rbac M6). A union with FD+ sees everything. */
export function ownScopeUser(c: Caller): string | null {
  return c.roles.some((r) => FULL_SCOPE_ROLES.includes(r)) ? null : c.userId;
}

const GUEST_COLUMNS = `g.id, g.code, g.full_name, g.name_search, g.phone_e164, g.email_norm, g.messaging_handles,
  g.date_of_birth::text AS date_of_birth, g.gender, g.nationality_code, g.is_foreigner, g.preferred_locale,
  g.preferred_contact, g.company_name, g.tax_code, g.tags, g.service_notes, g.free_note, g.id_doc_last4,
  g.crm_consent, g.source, g.created_by, g.possible_duplicate_at, g.version`;

/** BR-952 name similarity threshold for the trigram `%` operator (uses guest_name_search_trgm_idx). */
const NAME_SIMILARITY = '0.3';

const LIVE = 'g.merged_into_id IS NULL AND g.anonymized_at IS NULL';
/** 0.3.7 (A.6, SEC s3 7.4, rbac D10 ⁴⁰): SAL/CTV never see a `document` profile without P05. */
const NOT_DOCUMENT_ONLY = "NOT (g.source = 'document' AND g.crm_consent <> 'granted')";
/** 0.3.7 (A.5, SEC s3 7.1): fields a `document` profile without P05 may not get (422 NOT_ALLOWED). */
const DOCUMENT_LOCKED: ReadonlyArray<[keyof GuestInput, string]> = [
  ['tags', 'tags'],
  ['freeNote', 'freeNote'],
  ['serviceNotes', 'serviceNotes'],
  ['dateOfBirth', 'dateOfBirth'],
  ['gender', 'gender'],
];

interface Prepared {
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
}

function ageOn(dob: LocalDate, today: LocalDate): number {
  const [y1, m1, d1] = dob.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = today.split('-').map(Number) as [number, number, number];
  return y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
}

const blank = (v: string | null | undefined): boolean =>
  v === null || v === undefined || v.trim() === '';

@Injectable()
export class GuestsService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(DocNumberService) private readonly docs: DocNumberService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiter,
  ) {}

  /** Merge `input` over `base` (PATCH) and validate/normalise every field; collects all field errors. */
  private async prepare(
    tx: Tx,
    input: GuestInput,
    base: Prepared | null,
    caller: Caller,
    today: LocalDate,
    opts: { documentProfile?: boolean } = {},
  ): Promise<Prepared> {
    const errors: FieldError[] = [];
    const out: Prepared = base
      ? { ...base }
      : {
          full_name: '',
          name_search: '',
          phone_e164: null,
          email_norm: null,
          messaging_handles: null,
          date_of_birth: null,
          gender: null,
          nationality_code: 'VN',
          is_foreigner: false,
          preferred_locale: null,
          preferred_contact: null,
          company_name: null,
          tax_code: null,
          tags: null,
          service_notes: null,
          free_note: null,
        };

    if (input.fullName !== undefined || !base) {
      const name = normalizeName(input.fullName ?? '');
      if (!name) errors.push({ field: 'fullName', code: 'REQUIRED' });
      else if (name.length > 120) errors.push({ field: 'fullName', code: 'TOO_LONG' });
      else if (!isValidName(name)) errors.push({ field: 'fullName', code: 'NAME_INVALID' });
      out.full_name = name;
      out.name_search = nameSearchKey(name);
    }
    if (input.phone !== undefined) {
      if (blank(input.phone)) out.phone_e164 = null;
      else {
        const r = normalizePhone(input.phone as string);
        if (r.ok) out.phone_e164 = r.e164;
        else errors.push({ field: 'phone', code: r.code });
      }
    }
    if (input.email !== undefined) {
      if (blank(input.email)) out.email_norm = null;
      else {
        const e = normalizeEmail(input.email as string);
        if (e) out.email_norm = e;
        else errors.push({ field: 'email', code: 'EMAIL_INVALID' });
      }
    }
    // 0.3.7 (A.5): a profile from a document may stay without contact (it was never a CRM profile).
    if (
      !opts.documentProfile &&
      !out.phone_e164 &&
      !out.email_norm &&
      !errors.some((e) => e.field === 'phone' || e.field === 'email')
    ) {
      errors.push({ field: 'phone', code: 'CONTACT_REQUIRED' });
    }
    if (input.messagingHandles !== undefined) {
      const handles: Record<string, string> = {};
      for (const [k, raw] of Object.entries(input.messagingHandles ?? {})) {
        const v = typeof raw === 'string' ? raw.trim() : '';
        if (!v) continue;
        if (!(HANDLE_KEYS as readonly string[]).includes(k)) {
          errors.push({ field: `messagingHandles.${k}`, code: 'NOT_IN_LIST' });
        } else if (v.length > 64) {
          errors.push({ field: `messagingHandles.${k}`, code: 'TOO_LONG' });
        } else if ((k === 'zalo' || k === 'whatsapp') && /^[+\d][\d\s.-]*$/.test(v)) {
          const r = normalizePhone(v);
          if (!r.ok) errors.push({ field: `messagingHandles.${k}`, code: 'PHONE_INVALID' });
          handles[k] = r.ok ? r.e164 : v;
        } else handles[k] = v;
      }
      out.messaging_handles = Object.keys(handles).length ? handles : null;
    }
    if (input.dateOfBirth !== undefined) {
      const dob = input.dateOfBirth;
      if (dob === null) out.date_of_birth = null;
      else {
        if (dob > today) errors.push({ field: 'dateOfBirth', code: 'DOB_FUTURE' });
        else {
          const age = ageOn(dob, today);
          const minor = await this.params.get<number>(tx, 'minor_data_age_threshold', today);
          if (age > 120) errors.push({ field: 'dateOfBirth', code: 'DOB_INVALID' });
          else if (age < minor) errors.push({ field: 'dateOfBirth', code: 'DOB_MINOR' });
        }
        out.date_of_birth = dob;
      }
    }
    if (input.gender !== undefined) out.gender = input.gender;
    if (input.nationalityCode !== undefined) {
      const n = input.nationalityCode?.trim().toUpperCase() || null;
      if (n && !/^[A-Z]{2}$/.test(n))
        errors.push({ field: 'nationalityCode', code: 'NOT_IN_LIST' });
      out.nationality_code = n;
    }
    out.is_foreigner = !!out.nationality_code && out.nationality_code !== 'VN';
    if (input.preferredLocale !== undefined) out.preferred_locale = input.preferredLocale;
    if (!out.preferred_locale) out.preferred_locale = out.nationality_code === 'VN' ? 'vi' : 'en';
    if (input.preferredContact !== undefined) out.preferred_contact = input.preferredContact;
    if (out.preferred_contact) {
      const c = out.preferred_contact;
      const has =
        c === 'phone'
          ? !!out.phone_e164
          : c === 'email'
            ? !!out.email_norm
            : !!out.messaging_handles?.[c];
      if (!has) errors.push({ field: 'preferredContact', code: 'CONTACT_CHANNEL_EMPTY' });
    }
    if (input.taxCode !== undefined) {
      if (blank(input.taxCode)) out.tax_code = null;
      else {
        const t = normalizeTaxCode(input.taxCode as string);
        if (t) out.tax_code = t;
        else errors.push({ field: 'taxCode', code: 'TAX_CODE_INVALID' });
      }
    }
    if (input.companyName !== undefined) {
      const c = input.companyName?.trim() || null;
      if (c && c.length > 200) errors.push({ field: 'companyName', code: 'TOO_LONG' });
      out.company_name = c;
    }
    if (out.tax_code && !out.company_name) errors.push({ field: 'companyName', code: 'REQUIRED' });
    // D12a: collaborators neither see nor edit tags (rbac section 6) – a value they send is ignored.
    if (input.tags !== undefined && caller.roles.some((r) => r !== 'collaborator')) {
      out.tags = this.list('tags', input.tags, errors);
    }
    if (input.serviceNotes !== undefined) {
      out.service_notes = this.list('serviceNotes', input.serviceNotes, errors);
    }
    if (input.freeNote !== undefined) {
      const n = input.freeNote?.trim() || null;
      if (n && n.length > 1000) errors.push({ field: 'freeNote', code: 'TOO_LONG' });
      out.free_note = n;
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    if (out.free_note && looksLikeCardNumber(out.free_note)) {
      throw problem('CARD_NUMBER_DETECTED', {
        errors: [{ field: 'freeNote', code: 'CARD_NUMBER_DETECTED' }],
      });
    }
    return out;
  }

  /** Catalogue lists (tags, service notes): 1–40 characters, ≤ 20 entries, de-duplicated. */
  private list(field: string, values: string[] | null, errors: FieldError[]): string[] | null {
    if (!values || values.length === 0) return null;
    const out: string[] = [];
    values.forEach((v, i) => {
      const t = typeof v === 'string' ? v.trim() : '';
      if (!t || t.length > 40) errors.push({ field: `${field}[${i}]`, code: 'NOT_IN_LIST' });
      else if (!out.includes(t)) out.push(t);
    });
    if (out.length > 20) errors.push({ field, code: 'TOO_LONG' });
    return out;
  }

  private async load(tx: Tx, caller: Caller, guestId: string, lock = false): Promise<GuestRow> {
    const scope = ownScopeUser(caller);
    const { rows } = await tx.query<GuestRow>(
      `SELECT ${GUEST_COLUMNS} FROM guest g
        WHERE g.id = $1 AND ${LIVE} AND ($2::uuid IS NULL OR (g.created_by = $2 AND ${NOT_DOCUMENT_ONLY}))
        ${lock ? 'FOR UPDATE' : ''}`,
      [guestId, scope],
    );
    if (!rows[0]) throw problem('NOT_FOUND');
    return rows[0];
  }

  /** 409 DUPLICATE_GUEST when the phone or e-mail already belongs to another live profile (BR-951). */
  private async assertNoDuplicate(
    tx: Tx,
    caller: Caller,
    p: Prepared,
    selfId: string | null,
  ): Promise<void> {
    if (!p.phone_e164 && !p.email_norm) return;
    const { rows } = await tx.query<{
      id: string;
      code: string;
      created_by: string | null;
      by: string;
    }>(
      `SELECT g.id, g.code, g.created_by,
              CASE WHEN g.phone_e164 = $1 THEN 'phone' ELSE 'email' END AS by
         FROM guest g
        WHERE ${LIVE} AND ($3::uuid IS NULL OR g.id <> $3)
          AND (g.phone_e164 = $1 OR g.email_norm = $2)
        ORDER BY g.id LIMIT 1`,
      [p.phone_e164, p.email_norm, selfId],
    );
    const dup = rows[0];
    if (!dup) return;
    const scope = ownScopeUser(caller);
    const visible = scope === null || dup.created_by === scope;
    throw problem('DUPLICATE_GUEST', {
      errors: [{ field: dup.by, code: 'DUPLICATE_GUEST' }],
      extras: visible ? { existingGuestId: dup.id, existingGuestCode: dup.code } : {},
    });
  }

  /**
   * BR-952 look-alikes: similar name AND (same DOB, or same nationality when a DOB is missing). `%` with
   * pg_trgm.similarity_threshold (transaction-local) runs on the GIN trigram index; namesLookAlike then
   * applies the word-order-insensitive rule.
   */
  private async lookAlikes(tx: Tx, row: GuestRow): Promise<GuestWarning[]> {
    await tx.query(`SELECT set_config('pg_trgm.similarity_threshold', $1, true)`, [
      NAME_SIMILARITY,
    ]);
    const { rows } = await tx.query<{ id: string; code: string; name_search: string }>(
      `SELECT g.id, g.code, g.name_search FROM guest g
        WHERE g.name_search % $4 AND ${LIVE} AND g.id <> $1
          AND (($2::date IS NOT NULL AND g.date_of_birth = $2::date)
               OR (($2::date IS NULL OR g.date_of_birth IS NULL) AND $3::text IS NOT NULL
                   AND g.nationality_code = $3))
        ORDER BY similarity(g.name_search, $4) DESC LIMIT 10`,
      [row.id, row.date_of_birth, row.nationality_code, row.name_search],
    );
    return rows
      .filter((r) => namesLookAlike(r.name_search, row.name_search))
      .map((r) => ({ code: 'possible_duplicate_name_dob', guestId: r.id, guestCode: r.code }));
  }

  /** After a create/update: recompute look-alikes and store the flag on this profile and on theirs (Q7). */
  private async flagLookAlikes(tx: Tx, row: GuestRow): Promise<GuestWarning[]> {
    const found = await this.lookAlikes(tx, row);
    const now = this.clock.now();
    if (found.length) {
      // Derived flag: no version bump (would turn other clients' If-Match into 412 for nothing).
      await tx.query(
        `UPDATE guest SET possible_duplicate_at = COALESCE(possible_duplicate_at, $2)
          WHERE id = ANY($1::uuid[])`,
        [[row.id, ...found.map((w) => w.guestId)], now],
      );
      row.possible_duplicate_at = row.possible_duplicate_at ?? now;
    } else if (row.possible_duplicate_at) {
      await tx.query(`UPDATE guest SET possible_duplicate_at = NULL WHERE id = $1`, [row.id]);
      row.possible_duplicate_at = null;
    }
    return found;
  }

  private isFdPlus(caller: Caller): boolean {
    return caller.roles.some((r) => FULL_SCOPE_ROLES.includes(r));
  }

  async get(tx: Tx, caller: Caller, guestId: string): Promise<Record<string, unknown>> {
    const row = await this.load(tx, caller, guestId);
    // Only a flagged profile pays for the look-alike query; warnings are FD+ only (D29).
    const warnings =
      this.isFdPlus(caller) && row.possible_duplicate_at
        ? await this.lookAlikes(tx, row)
        : undefined;
    return guestDto(row, warnings);
  }

  /** SR-RL-07 / FB-R2-SEC-BE-09: a SAL/CTV write that carries a contact counts as a contact probe. */
  private probeLimit(caller: Caller, input: GuestInput): void {
    if (input.phone !== undefined || input.email !== undefined) this.rateLimit(caller);
  }

  async create(
    tx: Tx,
    caller: Caller,
    input: GuestInput,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const pc = await this.property.now(tx);
    const p = await this.prepare(tx, input, null, caller, pc.today);
    this.probeLimit(caller, input);
    await this.assertNoDuplicate(tx, caller, p, null);
    const code = await this.docs.allocate(tx, 'guest');
    const id = uuidv7();
    await this.write(tx, caller, 'insert', id, p, code);
    await this.audit.record(tx, {
      category: 'data',
      action: 'guest.created',
      entityType: 'guest',
      entityId: id,
      after: { code },
      requestId,
    });
    const created = await this.load(tx, { ...caller, roles: FULL_SCOPE_ROLES }, id);
    const warnings = await this.flagLookAlikes(tx, created);
    return guestDto(created, this.isFdPlus(caller) ? warnings : undefined);
  }

  async update(
    tx: Tx,
    caller: Caller,
    guestId: string,
    expectedVersion: number,
    input: GuestInput,
    requestId: string,
  ): Promise<Record<string, unknown>> {
    const pc = await this.property.now(tx);
    const row = await this.load(tx, caller, guestId, true);
    if (row.version !== expectedVersion) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.version } });
    }
    const base: Prepared = {
      full_name: row.full_name,
      name_search: row.name_search,
      phone_e164: row.phone_e164,
      email_norm: row.email_norm,
      messaging_handles: row.messaging_handles,
      date_of_birth: row.date_of_birth,
      gender: row.gender,
      nationality_code: row.nationality_code,
      is_foreigner: row.is_foreigner,
      preferred_locale: row.preferred_locale,
      preferred_contact: row.preferred_contact,
      company_name: row.company_name,
      tax_code: row.tax_code,
      tags: row.tags,
      service_notes: row.service_notes,
      free_note: row.free_note,
    };
    const documentOnly = row.source === 'document' && row.crm_consent !== 'granted';
    if (documentOnly) {
      const locked = DOCUMENT_LOCKED.filter(
        ([k]) => input[k] !== undefined && input[k] !== null,
      ).map(([, field]) => ({ field, code: 'NOT_ALLOWED' }));
      if (locked.length > 0) throw problem('VALIDATION_FAILED', { errors: locked });
    }
    const p = await this.prepare(tx, input, base, caller, pc.today, {
      documentProfile: row.source === 'document',
    });
    this.probeLimit(caller, input);
    await this.assertNoDuplicate(tx, caller, p, guestId);
    await this.write(tx, caller, 'update', guestId, p);
    const changed = (Object.keys(base) as (keyof Prepared)[]).filter(
      (k) => JSON.stringify(base[k]) !== JSON.stringify(p[k]),
    );
    await this.audit.record(tx, {
      category: 'data',
      action: 'guest.updated',
      entityType: 'guest',
      entityId: guestId,
      // C2 values never go to the audit log (SR-AUD-03): only which fields changed.
      after: { fields: changed },
      requestId,
    });
    const updated = await this.load(tx, caller, guestId);
    const warnings = await this.flagLookAlikes(tx, updated);
    return guestDto(updated, this.isFdPlus(caller) ? warnings : undefined);
  }

  private async write(
    tx: Tx,
    caller: Caller,
    mode: 'insert' | 'update',
    id: string,
    p: Prepared,
    code?: string,
  ): Promise<void> {
    const now = this.clock.now();
    const values = [
      p.full_name,
      p.name_search,
      p.phone_e164,
      p.email_norm,
      p.messaging_handles ? JSON.stringify(p.messaging_handles) : null,
      p.date_of_birth,
      p.gender,
      p.nationality_code,
      p.is_foreigner,
      p.preferred_locale,
      p.preferred_contact,
      p.company_name,
      p.tax_code,
      p.tags,
      p.service_notes,
      p.free_note,
    ];
    try {
      await tx.query('SAVEPOINT guest_write');
      if (mode === 'insert') {
        await tx.query(
          `INSERT INTO guest (full_name, name_search, phone_e164, email_norm, messaging_handles, date_of_birth,
             gender, nationality_code, is_foreigner, preferred_locale, preferred_contact, company_name, tax_code,
             tags, service_notes, free_note, id, organization_id, code, created_at, created_by, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                   $17, $18, $19, $20, $21, $20)`,
          [...values, id, tx.ctx.organizationId, code, now, caller.userId],
        );
      } else {
        await tx.query(
          `UPDATE guest SET full_name = $1, name_search = $2, phone_e164 = $3, email_norm = $4,
               messaging_handles = $5, date_of_birth = $6, gender = $7, nationality_code = $8,
               is_foreigner = $9, preferred_locale = $10, preferred_contact = $11, company_name = $12,
               tax_code = $13, tags = $14, service_notes = $15, free_note = $16,
               updated_at = $18, version = version + 1
           WHERE id = $17`,
          [...values, id, now],
        );
      }
      await tx.query('RELEASE SAVEPOINT guest_write');
    } catch (err) {
      if (pgCode(err) !== '23505') throw err;
      // Concurrent create with the same phone/e-mail: the partial unique index decided – report it.
      await tx.query('ROLLBACK TO SAVEPOINT guest_write');
      await this.assertNoDuplicate(tx, caller, p, mode === 'update' ? id : null);
      throw err;
    }
  }

  private rateLimit(caller: Caller): void {
    if (ownScopeUser(caller)) {
      this.limiter.consume(`guest-lookup:${caller.userId}`, RATE_RULES.guestLookupPerUser);
    }
  }

  async search(
    tx: Tx,
    caller: Caller,
    query: { q?: string | undefined; picker: boolean; cursor?: string | undefined; limit: number },
  ): Promise<{
    data: Record<string, unknown>[];
    page: { nextCursor: string | null; limit: number };
  }> {
    this.rateLimit(caller);
    const scope = ownScopeUser(caller);
    const q = query.q ? nameSearchKey(query.q) : null;
    const codeQ = query.q && /^KH-\d+$/i.test(query.q.trim()) ? query.q.trim().toUpperCase() : null;
    const like = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const prefix = q ? `${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    if (query.picker) {
      const limit = Math.min(query.limit, 5);
      const { rows } = await tx.query<GuestRow>(
        `SELECT ${GUEST_COLUMNS} FROM guest g
          WHERE ${LIVE} AND ($1::uuid IS NULL OR (g.created_by = $1 AND ${NOT_DOCUMENT_ONLY}))
            AND ($2::text IS NULL OR g.name_search LIKE $2 OR g.code = $3)
          ORDER BY (g.code = $3) DESC NULLS LAST, (g.name_search LIKE $4) DESC NULLS LAST, g.updated_at DESC
          LIMIT $5`,
        [scope, like, codeQ, prefix, limit],
      );
      return {
        data: rows.map((r) => summaryDto(r)),
        page: { nextCursor: null, limit },
      };
    }
    const { rows } = await tx.query<GuestRow>(
      `SELECT ${GUEST_COLUMNS} FROM guest g
        WHERE ${LIVE} AND ($1::uuid IS NULL OR (g.created_by = $1 AND ${NOT_DOCUMENT_ONLY}))
          AND ($2::text IS NULL OR g.name_search LIKE $2 OR g.code = $3)
          AND ($4::uuid IS NULL OR g.id < $4)
        ORDER BY g.id DESC LIMIT $5`,
      [scope, like, codeQ, query.cursor ?? null, query.limit + 1],
    );
    const more = rows.length > query.limit;
    const page = rows.slice(0, query.limit);
    return {
      data: page.map((r) => summaryDto(r)),
      page: { nextCursor: more ? (page[page.length - 1]?.id ?? null) : null, limit: query.limit },
    };
  }

  async lookup(
    tx: Tx,
    caller: Caller,
    input: { phone?: string | undefined; email?: string | undefined },
    requestId: string,
  ): Promise<{ matches: Record<string, unknown>[]; match?: 'possible_duplicate' }> {
    const errors: FieldError[] = [];
    let phone: string | null = null;
    let email: string | null = null;
    if (!blank(input.phone)) {
      const r = normalizePhone(input.phone as string);
      if (r.ok) phone = r.e164;
      else errors.push({ field: 'phone', code: r.code });
    }
    if (!blank(input.email)) {
      email = normalizeEmail(input.email as string);
      if (!email) errors.push({ field: 'email', code: 'EMAIL_INVALID' });
    }
    if (!errors.length && !phone && !email)
      errors.push({ field: 'phone', code: 'CONTACT_REQUIRED' });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    this.rateLimit(caller);

    const { rows } = await tx.query<GuestRow>(
      `SELECT ${GUEST_COLUMNS} FROM guest g
        WHERE ${LIVE} AND (g.phone_e164 = $1 OR g.email_norm = $2) ORDER BY g.id LIMIT 10`,
      [phone, email],
    );
    const scope = ownScopeUser(caller);
    const visible = rows.filter((r) => scope === null || r.created_by === scope);
    const hidden = rows.length - visible.length;
    await this.audit.record(tx, {
      category: 'access',
      action: 'guest.lookup',
      entityType: 'guest',
      // The looked-up phone/e-mail is never logged (SEC, BA 11.3) – only how many profiles matched.
      after: {
        by: [phone ? 'phone' : null, email ? 'email' : null].filter(Boolean),
        matches: rows.length,
      },
      requestId,
    });
    return {
      matches: visible.map((r) => summaryDto(r)),
      ...(hidden > 0 ? { match: 'possible_duplicate' as const } : {}),
    };
  }
}
