/**
 * Rows, SQL and C3 field encryption of the registration module. C3 values only exist decrypted inside a
 * use case (never returned outside `…/sensitive`, never logged/audited). Each guest_document has ONE DEK
 * (`data_key_id`); every `*_enc` column is sealed with AAD `guest_document|<column>|<doc id>|<kek version>`.
 */
import type { Tx } from '../../../db/database';
import type { CryptoService } from '../../crypto/public/crypto.service';
import type { DocumentFields, StoredCheck, VisaKind } from './rules';

export interface RegRow {
  id: string;
  reservation_id: string;
  status: string;
  kind: 'vn_citizen_stay' | 'foreigner_temp_residence' | 'mixed' | null;
  required_count: number;
  submitted_count: number;
  pre_submitted_at: Date | null;
  actual_checkin_at: Date | null;
  actual_checkout_at: Date | null;
  deadline_at: Date | null;
  deadline_basis: string | null;
  sent_at: Date | null;
  portal_reference: string | null;
  confirmed_at: Date | null;
  rejected_reason: string | null;
  needs_update_reason: string | null;
  actual_departure_date: string | null;
  image_retention_until: Date | null;
  legal_hold: boolean;
  blocks_door_code: boolean;
  images_purge_scheduled_at: Date | null;
  images_purged_at: Date | null;
  images_purge_reason: string | null;
  voided_at: Date | null;
  stay_ended_at: Date | null;
  version: number;
}

export interface DocRow {
  id: string;
  registration_id: string;
  reservation_id: string;
  party_member_id: string | null;
  /**
   * SEC FB-R2-SEC-BE-73 / ARC 16.22 (0070): the BOOKER's profile when the document is the booker's – the booker is
   * a party person (`party[]` id = the booking id) without a `reservation_guest` row. Never inferred from
   * `is_main`; exclusive with `party_member_id`; at most one per declaration.
   */
  guest_id: string | null;
  person_index: number | null;
  doc_type: DocumentFields['docType'];
  is_main: boolean;
  is_foreigner: boolean;
  is_minor_data: boolean;
  full_name_on_doc: string | null;
  nationality_code: string | null;
  gender: string | null;
  doc_number_last4: string | null;
  doc_number_hmac: string | null;
  check_results: StoredCheck[];
  capture_method: string;
  data_key_id: string;
  /**
   * T03 deadline of the document. BUG-R2-083 (SEC-BE-53 fallback): set on a guest-link document nobody is
   * linked to (`person_index` ≥ 2) when a person leaves the party – J16 removes it then unless the desk links
   * it to a person still in the party first (see `isUnclaimed`).
   */
  fields_purge_after: Date | null;
  purged_at: Date | null;
  removed_at: Date | null;
  /** 0.3.7 nhóm D A.6 (0057): name + date of birth match a profile outside the booking (BR-952). */
  possible_returning_guest: boolean;
  enc: Record<EncColumn, Buffer | null>;
}

export interface ImageRow {
  id: string;
  guest_document_id: string;
  blob_key: string;
  mime: 'image/jpeg' | 'image/webp';
  data_key_id: string;
  uploaded_via: 'desk' | 'guest_app';
  uploaded_at: Date;
  delete_after: Date | null;
  deleted_at: Date | null;
  delete_reason: string | null;
}

export interface ConsentRow {
  guest_document_id: string | null;
  person_index: number | null;
  decision: 'granted' | 'refused';
  channel: string;
  recorded_at: Date;
  notice_version: string;
  /** P02b days the person read (0053, SEC ĐK-2) – null for records before 0053. */
  retention_days: number | null;
}

/** Field ↔ column of every C3 value of a document (erd 4.7). */
export const ENC_COLUMNS = {
  docNumber: 'doc_number_enc',
  dateOfBirth: 'date_of_birth_enc',
  passportIssueDate: 'passport_issue_date_enc',
  passportExpiryDate: 'passport_expiry_date_enc',
  issuingPlace: 'issuing_place_enc',
  visaKind: 'visa_kind_enc',
  visaNumber: 'visa_number_enc',
  visaValidUntil: 'visa_valid_until_enc',
  entryDate: 'entry_date_enc',
  entryPort: 'entry_port_enc',
  entryPurpose: 'entry_purpose_enc',
  noEntryRecord: 'no_entry_record_enc',
  address: 'address_enc',
} as const;
export type EncField = keyof typeof ENC_COLUMNS;
export type EncColumn = (typeof ENC_COLUMNS)[EncField];
const ENC_LIST = Object.entries(ENC_COLUMNS) as Array<[EncField, EncColumn]>;

export const REG_COLUMNS = `id, reservation_id, status, kind, required_count, submitted_count, pre_submitted_at,
  actual_checkin_at, actual_checkout_at, deadline_at, deadline_basis, sent_at, portal_reference, confirmed_at,
  rejected_reason, needs_update_reason, actual_departure_date::text, image_retention_until, legal_hold,
  blocks_door_code, images_purge_scheduled_at, images_purged_at, images_purge_reason, voided_at, stay_ended_at,
  version`;

const DOC_COLUMNS = `id, registration_id, reservation_id, party_member_id, guest_id, person_index, doc_type, is_main,
  is_foreigner, is_minor_data, full_name_on_doc, nationality_code, gender, doc_number_last4, doc_number_hmac,
  check_results, capture_method, data_key_id, fields_purge_after, purged_at, removed_at, possible_returning_guest,
  ${ENC_LIST.map(([, c]) => c).join(', ')}`;

type RawDoc = Omit<DocRow, 'enc'> & Record<EncColumn, Buffer | null>;

function toDoc(r: RawDoc): DocRow {
  const enc = {} as Record<EncColumn, Buffer | null>;
  for (const [, c] of ENC_LIST) enc[c] = r[c] ?? null;
  return { ...r, check_results: Array.isArray(r.check_results) ? r.check_results : [], enc };
}

export async function lockRegistration(tx: Tx, id: string): Promise<RegRow | null> {
  const { rows } = await tx.query<RegRow>(
    `SELECT ${REG_COLUMNS} FROM registration WHERE id = $1 FOR UPDATE`,
    [id],
  );
  return rows[0] ?? null;
}

export async function lockRegistrationOfReservation(
  tx: Tx,
  reservationId: string,
): Promise<RegRow | null> {
  const { rows } = await tx.query<RegRow>(
    `SELECT ${REG_COLUMNS} FROM registration WHERE reservation_id = $1 FOR UPDATE`,
    [reservationId],
  );
  return rows[0] ?? null;
}

export async function readRegistration(tx: Tx, id: string): Promise<RegRow | null> {
  const { rows } = await tx.query<RegRow>(`SELECT ${REG_COLUMNS} FROM registration WHERE id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
}

/** Live documents (person not removed), oldest first. */
export async function documentsOf(tx: Tx, registrationId: string): Promise<DocRow[]> {
  const { rows } = await tx.query<RawDoc>(
    `SELECT ${DOC_COLUMNS} FROM guest_document
      WHERE registration_id = $1 AND removed_at IS NULL ORDER BY created_at, id`,
    [registrationId],
  );
  return rows.map(toDoc);
}

/** SEC-BE-57: documents retired (removed) but not yet destroyed whose deadline has come (J16). */
export async function retiredDocumentsDue(
  tx: Tx,
  registrationId: string,
  now: Date,
): Promise<DocRow[]> {
  const { rows } = await tx.query<RawDoc>(
    `SELECT ${DOC_COLUMNS} FROM guest_document
      WHERE registration_id = $1 AND removed_at IS NOT NULL AND purged_at IS NULL
        AND COALESCE(fields_purge_after, removed_at) <= $2
      ORDER BY created_at, id FOR UPDATE`,
    [registrationId, now],
  );
  return rows.map(toDoc);
}

export async function documentById(
  tx: Tx,
  registrationId: string,
  documentId: string,
  opts: { lock?: boolean } = {},
): Promise<DocRow | null> {
  const { rows } = await tx.query<RawDoc>(
    `SELECT ${DOC_COLUMNS} FROM guest_document
      WHERE id = $1 AND registration_id = $2 AND removed_at IS NULL${opts.lock ? ' FOR UPDATE' : ''}`,
    [documentId, registrationId],
  );
  return rows[0] ? toDoc(rows[0]) : null;
}

export async function imagesOf(tx: Tx, registrationId: string): Promise<ImageRow[]> {
  const { rows } = await tx.query<ImageRow>(
    `SELECT id, guest_document_id, blob_key, mime, data_key_id, uploaded_via, uploaded_at, delete_after,
            deleted_at, delete_reason
       FROM document_image WHERE registration_id = $1 ORDER BY uploaded_at, id`,
    [registrationId],
  );
  return rows;
}

export async function consentsOf(tx: Tx, registrationId: string): Promise<ConsentRow[]> {
  const { rows } = await tx.query<ConsentRow>(
    `SELECT guest_document_id, person_index, decision, channel, recorded_at, notice_version, retention_days
       FROM consent_record
      WHERE registration_id = $1 AND purpose = 'P02B_ID_IMAGE_RETENTION'
      ORDER BY recorded_at, id`,
    [registrationId],
  );
  return rows;
}

/** Latest P02b decision of a person (document id, or the guest-web person index). */
export function latestConsent(
  consents: readonly ConsentRow[],
  doc: Pick<DocRow, 'id' | 'person_index'>,
): ConsentRow | null {
  let last: ConsentRow | null = null;
  for (const c of consents) {
    const mine =
      c.guest_document_id === doc.id ||
      (c.guest_document_id === null &&
        c.person_index !== null &&
        c.person_index === doc.person_index);
    if (mine) last = c;
  }
  return last;
}

/**
 * BUG-R2-083 (SEC-BE-53 fallback): a guest-link document ("Khách n", n ≥ 2) not linked to any party member,
 * left after a person was removed from the party – nobody knows whose it is. It does not count for "enough
 * people" (guest-web, BR-601), is not declared, and J16 removes it at `fields_purge_after` unless the desk
 * links it to a person still in the party (`updateGuestDocument` + `partyMemberId`).
 */
export function isUnclaimed(
  d: Pick<
    DocRow,
    'party_member_id' | 'guest_id' | 'person_index' | 'fields_purge_after' | 'removed_at'
  >,
): boolean {
  return (
    d.party_member_id === null &&
    d.guest_id === null &&
    d.person_index !== null &&
    d.person_index >= 2 &&
    d.fields_purge_after !== null &&
    d.removed_at === null
  );
}

/**
 * 0.3.7 (S4-39): a live guest-link slot "Khách n" (n ≥ 2) not linked to any party member – the slots
 * `removePartyMember` asks about (`guestUploadPersonIndex`) and the 0.3.6 fallback puts on a deadline. Slot 1
 * is the person who received the link (the booker side), never asked about.
 */
export function isOpenGuestSlot(
  d: Pick<DocRow, 'capture_method' | 'party_member_id' | 'person_index' | 'removed_at'>,
): boolean {
  return (
    d.capture_method === 'guest_upload' &&
    d.party_member_id === null &&
    d.person_index !== null &&
    d.person_index >= 2 &&
    d.removed_at === null
  );
}

/** A document whose fields the desk entered (counts for BR-601). */
export function isComplete(d: DocRow): boolean {
  return d.enc.doc_number_enc !== null && !!d.full_name_on_doc && d.purged_at === null;
}

/** A complete document that counts for BR-601 and the declaration (an unclaimed one does not). */
export function countsForDeclaration(d: DocRow): boolean {
  return isComplete(d) && !isUnclaimed(d);
}

/**
 * `partyMemberId` sent by the desk must be a person STILL in this booking's party (the FK 0053 only checks
 * that the row exists in the property): linking a document to a removed person – or to another booking's –
 * would keep it past A-38 (BUG-R2-083). Read-only check of the FK target.
 */
export async function isLiveMemberOf(
  tx: Tx,
  reservationId: string,
  memberId: string,
): Promise<boolean> {
  const { rows } = await tx.query<{ ok: boolean }>(
    `SELECT true AS ok FROM reservation_guest WHERE id = $1 AND reservation_id = $2 AND removed_at IS NULL`,
    [memberId, reservationId],
  );
  return rows.length > 0;
}

export function aadOf(docId: string, column: EncColumn) {
  return { table: 'guest_document', column, recordId: docId };
}

/** Encrypt every non-null field with the document's DEK. */
export async function encryptFields(
  tx: Tx,
  crypto: CryptoService,
  docId: string,
  dataKeyId: string,
  fields: DocumentFields,
): Promise<Record<EncColumn, Buffer | null>> {
  const out = {} as Record<EncColumn, Buffer | null>;
  for (const [field, column] of ENC_LIST) {
    const v = fields[field];
    const plain = field === 'noEntryRecord' ? (v ? 'true' : null) : (v as string | null);
    out[column] =
      plain === null || plain === undefined
        ? null
        : await crypto.encrypt(tx, dataKeyId, aadOf(docId, column), plain);
  }
  return out;
}

/** Decrypt the C3 fields of a document (DataKeyDestroyedError when purged). */
export async function decryptFields(
  tx: Tx,
  crypto: CryptoService,
  doc: DocRow,
): Promise<Omit<DocumentFields, 'docType' | 'fullNameOnDoc' | 'nationalityCode' | 'gender'>> {
  const plain: Partial<Record<EncField, string | null>> = {};
  for (const [field, column] of ENC_LIST) {
    const c = doc.enc[column];
    plain[field] = c
      ? await crypto.decryptText(tx, doc.data_key_id, aadOf(doc.id, column), c)
      : null;
  }
  return {
    docNumber: plain.docNumber ?? '',
    dateOfBirth: plain.dateOfBirth ?? null,
    passportIssueDate: plain.passportIssueDate ?? null,
    passportExpiryDate: plain.passportExpiryDate ?? null,
    issuingPlace: plain.issuingPlace ?? null,
    visaKind: (plain.visaKind as VisaKind | null | undefined) ?? null,
    visaNumber: plain.visaNumber ?? null,
    visaValidUntil: plain.visaValidUntil ?? null,
    entryDate: plain.entryDate ?? null,
    entryPort: plain.entryPort ?? null,
    entryPurpose: plain.entryPurpose ?? null,
    noEntryRecord: plain.noEntryRecord === 'true',
    address: plain.address ?? null,
  };
}

/** SET list for the encrypted columns (positional params from `start`). */
export function encSetSql(start: number): { sql: string; columns: EncColumn[] } {
  const columns = ENC_LIST.map(([, c]) => c);
  return { sql: columns.map((c, i) => `${c} = $${start + i}`).join(', '), columns };
}

export async function recordTransition(
  tx: Tx,
  entityId: string,
  from: string | null,
  to: string,
  event: string,
  at: Date,
  opts: { requestId?: string; reasonCode?: string } = {},
): Promise<void> {
  await tx.query(
    `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
       event_code, actor_type, actor_user_id, reason_code, occurred_at, request_id)
     VALUES ($1, $2, 'SM-05', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      tx.ctx.organizationId,
      tx.ctx.propertyId,
      entityId,
      from,
      to,
      event,
      tx.ctx.actorType,
      tx.ctx.actorType === 'user' ? tx.ctx.userId : null,
      opts.reasonCode ?? null,
      at,
      opts.requestId ?? null,
    ],
  );
}
