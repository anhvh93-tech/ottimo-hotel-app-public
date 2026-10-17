import {
  isApiError,
  type DocType,
  type DocumentCheckCode,
  type GuestDocumentInput,
  type GuestDocumentMasked,
  type GuestDocumentSensitive,
  type Party,
  type Registration,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Chip, Field, Icon, Modal, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { C3_TTL_MS } from '../../app/c3';
import { problemView } from '../../app/problem';
import { useToast } from '../../app/toast';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { StepUpDialog, useSubmit, useUnsavedLabels } from '../stay/common';
import { useC3DocReveal } from './docImages';
import {
  deadlineOf,
  docRowId,
  earliestPurge,
  focusDocRow,
  isGuestUploadUnlinked,
  pendingDocs,
  useFocusPendingOnce,
  useUnlinkedAttention,
} from './partyDocs';

export const DOC_LABEL: Record<DocType, string> = {
  cccd: 'ci.doc.cccd',
  passport: 'ci.doc.passport',
  child_personal_id: 'ci.doc.child',
  other: 'checkin.docs.field.doc_type',
};

/** Effective result of a check: the desk's manual mark wins over the system result (EP06 3.2). */
export const resultOf = (c: GuestDocumentMasked['checks'][number]) =>
  c.manualResult ?? (c.result === 'ok' ? 'pass' : c.result === 'warning' ? 'fail' : c.result);

type Gender = 'male' | 'female' | 'other';
type VisaKind = 'visa' | 'visa_exempt' | 'temp_residence_card';

/**
 * H13 13.2 / H14 – documents per person (C3). After saving only the last 4 characters are shown; the
 * full number and the photos need step-up and auto-hide after 60 s, when the tab is hidden, on leaving
 * and on sign-out (`useC3DocReveal`, SEC FE-06 / B5). No download button; nothing is written to browser
 * storage. FB-R2-SEC-FE-07: documents the guest sent through the link that wait to be linked to a person
 * (a person left the party) carry "Chờ gắn người – tự xóa lúc …", a banner leads to them, and "Gắn người"
 * opens the edit box with the "Người trong đoàn" choice.
 */
export function DocsList({
  registration,
  reservation,
  onChange,
  focusPending = false,
}: {
  registration: Registration;
  reservation: Pick<Reservation, 'adults' | 'children6to11' | 'childrenUnder6' | 'booker'>;
  onChange: (r: Registration) => void;
  /** Focus the first document waiting to be linked (H14 opened from "Cần chú ý"). */
  focusPending?: boolean;
}) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const [adding, setAdding] = useState(false);
  /** S4-39: the document whose "Gắn người" box is open (also opened by 409 DOCUMENT_UNCLAIMED_EXISTS). */
  const [linking, setLinking] = useState<string | null>(null);
  const attention = useUnlinkedAttention(propertyId, [registration.id, registration.version]);
  const pending = pendingDocs(registration, attention.flagged(registration.reservationId));
  const pendingIds = new Set(pending.map((d) => d.id));
  const firstPending = pending[0];
  const earliest = earliestPurge(pending);
  useFocusPendingOnce(focusPending, firstPending);
  const required =
    registration.requiredCount ||
    reservation.adults + (reservation.children6to11 ?? 0) + (reservation.childrenUnder6 ?? 0);
  const docs = [...registration.documents].sort((a, b) => Number(b.isMain) - Number(a.isMain));
  const missing = Math.max(0, required - docs.length);
  return (
    <div className="stack">
      {firstPending ? (
        <Alert
          tone="warn"
          actions={
            <Button size="sm" onClick={() => focusDocRow(firstPending.id)}>
              {t('reg.link.go')}
            </Button>
          }
        >
          {earliest
            ? t('reg.link.banner', { n: pending.length, time: dateTime(earliest) })
            : t('reg.link.banner_soon', { n: pending.length })}
        </Alert>
      ) : null}
      <p className="li-s" role="status">
        {t('checkin.docs.progress', { have: docs.length, need: required })}
      </p>
      {docs.length === 0 ? <p className="muted">{t('checkin.docs.empty')}</p> : null}
      <ul className="list-none">
        {docs.map((d) => (
          <DocRow
            key={d.id}
            doc={d}
            pending={pendingIds.has(d.id)}
            registration={registration}
            onChange={onChange}
            linking={linking === d.id}
            onLink={(open) => setLinking(open ? d.id : null)}
          />
        ))}
        {Array.from({ length: missing }, (_, i) => (
          <li key={`m${i}`} className="person">
            <div className="grow">
              <b>{t('guest.oci.person_n', { n: docs.length + i + 1 })}</b>
              <div className="li-s">{t('ci.doc_missing')}</div>
            </div>
            {i === 0 ? (
              <Button size="sm" onClick={() => setAdding(true)}>
                {t('checkin.docs.manual')}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {missing === 0 ? (
        <Button size="sm" className="self-end" onClick={() => setAdding(true)}>
          {t('checkin.docs.manual')}
        </Button>
      ) : null}
      {adding ? (
        <ManualDocDialog
          registration={registration}
          bookerName={reservation.booker?.displayName}
          first={docs.length === 0}
          onOpenPending={
            firstPending
              ? () => {
                  setAdding(false);
                  // After the box has closed (it gives focus back to "Nhập tay" when it unmounts).
                  setTimeout(() => focusDocRow(firstPending.id), 0);
                }
              : undefined
          }
          onOpenDocument={(documentId) => {
            // 0.3.7 409 DOCUMENT_UNCLAIMED_EXISTS names the waiting document: open exactly that one.
            setAdding(false);
            setTimeout(() => {
              focusDocRow(documentId);
              setLinking(documentId);
            }, 0);
          }}
          onClose={() => setAdding(false)}
          onSaved={(r) => {
            setAdding(false);
            onChange(r);
          }}
        />
      ) : null}
    </div>
  );
}

function DocRow({
  doc,
  pending,
  registration,
  onChange,
  linking,
  onLink,
}: {
  doc: GuestDocumentMasked;
  /** Waiting to be linked to a person (FB-R2-SEC-FE-07). */
  pending: boolean;
  registration: Registration;
  onChange: (r: Registration) => void;
  /** The "Gắn người" box of this document is open. */
  linking: boolean;
  onLink: (open: boolean) => void;
}) {
  const { t, locale, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const reveal = useC3DocReveal();
  const shown = reveal.value;
  const full = shown?.full ?? null;
  const [stepUp, setStepUp] = useState<'show' | 'edit' | null>(null);
  const [editing, setEditing] = useState<GuestDocumentSensitive | null>(null);
  const [error, setError] = useState<unknown>(null);
  const G = { propertyId, registrationId: registration.id };
  const images = doc.imageIds ?? [];
  const hasNumber = Boolean(doc.docNumberLast4);

  const load = async (then: 'show' | 'edit') => {
    setError(null);
    try {
      if (then === 'show')
        await reveal.show(
          hasNumber
            ? async () => (await api.getGuestDocumentSensitive(G, doc.id, 'registration')).data
            : null,
          images,
          async (imageId) => (await api.getDocumentImage(G, doc.id, imageId, 'registration')).data,
          (e) =>
            isApiError(e) && e.code === 'REAUTH_REQUIRED'
              ? 'rethrow'
              : isApiError(e) && e.status === 404
                ? 'deleted'
                : 'failed',
        );
      else setEditing((await api.getGuestDocumentSensitive(G, doc.id, 'registration')).data);
    } catch (e) {
      if (isApiError(e) && e.code === 'REAUTH_REQUIRED') setStepUp(then);
      else setError(e);
    }
  };

  const label = !hasNumber
    ? null
    : doc.docType === 'passport'
      ? t('ci.passport_masked', { last4: doc.docNumberLast4 })
      : doc.docType === 'child_personal_id'
        ? t('ci.child_doc', { last4: doc.docNumberLast4 })
        : t('ci.doc_masked', { type: t(DOC_LABEL[doc.docType]), last4: doc.docNumberLast4 });
  const name = doc.fullNameOnDoc || t('reg.link.no_fields');
  const deadline = deadlineOf(doc);
  const line = [
    // S4-39: the "Khách n" slot the guest used – the same number the party-removal box asks about.
    doc.captureMethod === 'guest_upload' && doc.personIndex
      ? t('guest.oci.person_n', { n: doc.personIndex })
      : null,
    full?.docNumber ? null : label,
    images.length ? t('ci.photo_count', { n: images.length }) : null,
    doc.captureMethod === 'guest_upload' ? t('checkin.docs.from_app') : null,
  ].filter((x): x is string => !!x);
  return (
    <li className="person" id={docRowId(doc.id)} tabIndex={-1}>
      <div className="grow">
        <b>
          {name}
          {doc.nationalityCode ? ` · ${doc.nationalityCode}` : ''}
          {doc.isMain ? ` · ${t('rsv.booker')}` : ''}
        </b>
        <div className="li-s">
          {full?.docNumber ? (
            <>
              <span className="mono">{full.docNumber}</span>
              {line.length ? ' · ' : ''}
            </>
          ) : null}
          {line.join(' · ')}
        </div>
        {shown?.photos.length ? (
          <div className="row wrap">
            {shown.photos.map((p, i) =>
              p.url !== null ? (
                <img
                  key={p.url}
                  src={p.url}
                  alt={t('ci.photo_alt', { n: i + 1, total: shown.photos.length, name })}
                  draggable={false}
                  style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }}
                />
              ) : (
                <p key={`x${i}`} className="li-s">
                  {t(p.deleted ? 'ci.photo_deleted' : 'ci.photo_error')}
                </p>
              ),
            )}
          </div>
        ) : null}
        {shown ? (
          <div className="caption">{t('ci.full_autohide', { seconds: C3_TTL_MS / 1000 })}</div>
        ) : null}
        {error ? <Alert tone="bad">{problemView(t, error, locale).text}</Alert> : null}
      </div>
      {pending ? (
        <Chip tone="warn">
          {deadline
            ? t('reg.link.pending_chip', { time: dateTime(deadline) })
            : t('reg.link.pending_chip_soon')}
        </Chip>
      ) : (
        <Chip tone="ok">{t('guest.chip.doc_ok')}</Chip>
      )}
      {isGuestUploadUnlinked(doc) ? (
        // S4-39: link with `GuestDocumentLink` – no C3 read, nothing to type again. Also for an ID the guest
        // sent that waits for nobody (0.3.7: the other slots keep no deadline after a removal).
        <Button size="sm" variant={pending ? 'pri' : 'ghost'} onClick={() => onLink(true)}>
          {t('reg.link.action')}
        </Button>
      ) : null}
      {hasNumber || images.length ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => (shown ? reveal.hide() : void load('show'))}
        >
          {shown ? t('ci.view_hide') : t('ci.view_full')}
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => void load('edit')}>
        {t('rooms.edit')}
      </Button>
      {stepUp ? (
        <StepUpDialog
          onClose={() => setStepUp(null)}
          onDone={() => {
            const then = stepUp;
            setStepUp(null);
            void load(then);
          }}
        />
      ) : null}
      {linking ? (
        <LinkDocDialog
          registration={registration}
          doc={doc}
          pending={pending}
          onClose={() => onLink(false)}
          onSaved={(r) => {
            onLink(false);
            onChange(r);
          }}
        />
      ) : null}
      {editing ? (
        <ManualDocDialog
          registration={registration}
          first={false}
          initial={editing}
          doc={doc}
          pending={pending}
          onClose={() => setEditing(null)}
          onSaved={(r) => {
            setEditing(null);
            onChange(r);
          }}
        />
      ) : null}
    </li>
  );
}

type PartyMember = NonNullable<Party['members']>[number];
const memberName = (m: PartyMember) => m.guest?.displayName ?? m.childDisplayName ?? '';

/** Every field the manual-entry box has an input for (BUG-R2-091 – the head counts them). */
const DOC_FIELDS = [
  'docType',
  'docNumber',
  'fullNameOnDoc',
  'dateOfBirth',
  'gender',
  'nationalityCode',
  'address',
  'passportIssueDate',
  'issuingPlace',
  'passportExpiryDate',
  'visaKind',
  'visaNumber',
  'visaValidUntil',
  'entryDate',
  'entryPort',
  'entryPurpose',
  'noEntryRecord',
  'partyMemberId',
];

/**
 * S4-39 (0.3.7 `GuestDocumentLink`; SEC FE-07 step 4, SEC 9.6 e (2)): "Gắn người" for a document the guest
 * sent through the link that nobody owns – choose a person still in the party (nothing pre-selected; people
 * who already have a document are locked) and send ONLY `partyMemberId`: no step-up read of the C3 fields,
 * nothing typed again. 409 PARTY_DUPLICATE / 422 NOT_IN_LIST → the party is read again.
 */
function LinkDocDialog({
  registration,
  doc,
  pending,
  onClose,
  onSaved,
}: {
  registration: Registration;
  doc: GuestDocumentMasked;
  pending: boolean;
  onClose: () => void;
  onSaved: (r: Registration) => void;
}) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useSubmit({ bound: ['partyMemberId'] });
  const [stepUp, setStepUp] = useState(false);
  const party = useResource(
    async () =>
      (await api.listParty({ propertyId, reservationId: registration.reservationId })).data,
    [propertyId, registration.reservationId],
  );
  const members = party.state.data?.members ?? [];
  const otherMain = registration.documents.some((d) => d.id !== doc.id && d.isMain);
  const taken = (m: PartyMember) =>
    registration.documents.some((d) => d.id !== doc.id && d.partyMemberId === m.id) ||
    (m.role === 'booker' && otherMain);
  const free = members.filter((m) => !taken(m));
  const [memberId, setMemberId] = useState('');
  const [touched, setTouched] = useState(false);
  const due = deadlineOf(doc);
  const deadline = due ? dateTime(due) : null;
  const slot =
    doc.personIndex && doc.captureMethod === 'guest_upload'
      ? t('guest.oci.person_n', { n: doc.personIndex })
      : null;

  const save = async () => {
    setTouched(true);
    if (!memberId) return;
    const out = await act.submit(() =>
      api.updateGuestDocument(
        { propertyId, registrationId: registration.id },
        doc.id,
        { partyMemberId: memberId },
        registration.version,
      ),
    );
    if (out) {
      const linked = members.find((m) => m.id === memberId);
      toast(t('reg.link.linked_toast', { name: linked ? memberName(linked) : '' }));
      onSaved(out.data);
      return;
    }
    if (act.code === 'REAUTH_REQUIRED') setStepUp(true);
  };
  // Someone took the person or the person left the party meanwhile → read the party again.
  const code = act.code;
  const reloadParty = party.reload;
  useEffect(() => {
    if (code === 'PARTY_DUPLICATE' || code === 'VALIDATION_FAILED') reloadParty();
  }, [act.error, code, reloadParty]);

  return (
    <Modal
      open
      size="sm"
      title={t('reg.link.action')}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={!!memberId}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!party.state.data || free.length === 0}
            onClick={() => void save()}
          >
            {act.label(t('reg.link.action'))}
          </Button>
        </>
      }
    >
      <p>
        <b>{[slot, doc.fullNameOnDoc || t('reg.link.no_fields')].filter(Boolean).join(' · ')}</b>
      </p>
      <p className="li-s">{t('reg.link.dialog_help')}</p>
      {code === 'REAUTH_REQUIRED' ? null : act.view()}
      {party.state.status === 'error' && !party.state.data ? (
        <Alert
          tone="bad"
          actions={
            <Button size="sm" onClick={party.reload}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('reg.link.party_error')}
        </Alert>
      ) : (
        <Field
          label={t('reg.link.member')}
          required={free.length > 0}
          error={touched && !memberId ? t('common.required') : act.fields.partyMemberId}
          help={
            party.state.data && free.length === 0
              ? deadline
                ? t('reg.link.no_member', { time: deadline })
                : t('reg.link.no_member_soon')
              : pending
                ? deadline
                  ? t('reg.link.member_help_pending', { time: deadline })
                  : t('reg.link.member_help_pending_soon')
                : t('reg.link.member_help')
          }
        >
          {(p) => (
            <select
              {...p}
              className="input"
              value={memberId}
              disabled={!party.state.data}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">{t('reg.link.member_placeholder')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id} disabled={taken(m)}>
                  {taken(m) ? t('reg.link.has_doc', { name: memberName(m) }) : memberName(m)}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}
      {stepUp ? (
        <StepUpDialog
          onClose={() => setStepUp(false)}
          onDone={() => {
            setStepUp(false);
            void save();
          }}
        />
      ) : null}
    </Modal>
  );
}

/**
 * H13 "Nhập tay giấy tờ" (FE-S3-02): every field the portal forms need – gender; VN: address; passport:
 * issue date / place, entry type, visa number (not for visa-exempt), visa validity, entry date / port /
 * purpose and "Có dấu / chứng nhận nhập cảnh" (unticked = `noEntryRecord`, BR-613 c). Add = multipart
 * `addGuestDocument` (images in memory only); edit = `updateGuestDocument` with If-Match.
 *
 * FB-R2-SEC-FE-07: editing a document the guest sent through the link that no person owns yet asks
 * "Người trong đoàn" (people still in the party, nothing pre-selected) and sends `partyMemberId` – required
 * when the document waits to be linked (it is deleted at its deadline otherwise). OpenAPI 0.3.6 keeps
 * `GuestDocumentInput` whole (docType, fullNameOnDoc, docNumber required): the fields come pre-filled from
 * the step-up read, the desk confirms or types them in the same box.
 * 0.3.7 (S4-39): "Gắn người" no longer comes here – `LinkDocDialog` sends `GuestDocumentLink` only. "Nhập tay"
 * repeating the number of a waiting document → 409 `DOCUMENT_UNCLAIMED_EXISTS` with its id → the box offers to
 * open exactly that document (`onOpenDocument`); an older server answers 409 `PARTY_DUPLICATE` without an id
 * and the box points to the waiting documents (`onOpenPending`).
 */
export function ManualDocDialog({
  registration,
  bookerName,
  first,
  initial,
  doc,
  pending = false,
  onOpenPending,
  onOpenDocument,
  onClose,
  onSaved,
}: {
  registration: Registration;
  bookerName?: string;
  first: boolean;
  /** Full values (after step-up) → edit mode. */
  initial?: GuestDocumentSensitive;
  /** Edit mode: the masked row (capture method, linked person, deadline). */
  doc?: GuestDocumentMasked;
  /** The document waits to be linked to a person (FB-R2-SEC-FE-07). */
  pending?: boolean;
  /** Add mode: the booking has documents waiting to be linked – close and go to them. */
  onOpenPending?: () => void;
  /** Add mode, 0.3.7: 409 `DOCUMENT_UNCLAIMED_EXISTS` named the waiting document – close and open it. */
  onOpenDocument?: (documentId: string) => void;
  onClose: () => void;
  onSaved: (r: Registration) => void;
}) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const unsaved = useUnsavedLabels();
  // BUG-R2-091: fields with an input → the head says "Còn {n} ô cần sửa", the message sits at the field.
  const act = useSubmit({ bound: DOC_FIELDS });
  const ids = useId();
  // ── "Người trong đoàn" (FB-R2-SEC-FE-07) ──
  const linkable = !!initial && !!doc && isGuestUploadUnlinked(doc);
  const party = useResource(
    async () =>
      linkable
        ? (await api.listParty({ propertyId, reservationId: registration.reservationId })).data
        : null,
    [linkable, propertyId, registration.reservationId],
  );
  const members = party.state.data?.members ?? [];
  const otherMain = registration.documents.some((d) => d.id !== doc?.id && d.isMain);
  /** A person who already has another document cannot take this one (409 PARTY_DUPLICATE). */
  const taken = (m: PartyMember) =>
    registration.documents.some((d) => d.id !== doc?.id && d.partyMemberId === m.id) ||
    (m.role === 'booker' && otherMain);
  const free = members.filter((m) => !taken(m));
  const [memberId, setMemberId] = useState('');
  const deadline = doc && deadlineOf(doc) ? dateTime(deadlineOf(doc)!) : null;
  const [docType, setDocType] = useState<DocType>(initial?.docType ?? 'cccd');
  const [form, setForm] = useState({
    docNumber: initial?.docNumber ?? '',
    fullNameOnDoc: initial?.fullNameOnDoc ?? (first ? (bookerName ?? '') : ''),
    dateOfBirth: initial?.dateOfBirth ?? '',
    nationalityCode: initial?.nationalityCode ?? '',
    passportIssueDate: initial?.passportIssueDate ?? '',
    issuingPlace: initial?.issuingPlace ?? '',
    passportExpiryDate: initial?.passportExpiryDate ?? '',
    visaNumber: initial?.visaNumber ?? '',
    visaValidUntil: initial?.visaValidUntil ?? '',
    entryDate: initial?.entryDate ?? '',
    entryPort: initial?.entryPort ?? '',
    entryPurpose: initial?.entryPurpose ?? '',
    address: initial?.address ?? '',
  });
  const [gender, setGender] = useState<Gender | ''>(
    ((initial as { gender?: Gender } | undefined)?.gender ?? '') as Gender | '',
  );
  const [visaKind, setVisaKind] = useState<VisaKind | ''>(
    (initial?.visaKind as VisaKind | undefined) ?? '',
  );
  const [hasEntry, setHasEntry] = useState(initial?.noEntryRecord !== true);
  const [images, setImages] = useState<File[]>([]);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const passport = docType === 'passport';
  const dirty =
    (!initial &&
      (Object.values(form).some(Boolean) || images.length > 0 || !!gender || !!visaKind)) ||
    !!memberId;
  const opt = (v: string) => v.trim() || undefined;

  const [missing, setMissing] = useState<Record<string, string>>({});
  const save = async () => {
    // FE-S3-04: the button stays usable; empty required fields are said at the field.
    const req: Record<string, string> = {};
    if (!form.docNumber.trim()) req.docNumber = t('common.required');
    if (!form.fullNameOnDoc.trim()) req.fullNameOnDoc = t('common.required');
    // Waiting to be linked → the person is required, unless nobody in the party can take it (said below).
    if (linkable && pending && free.length > 0 && !memberId)
      req.partyMemberId = t('common.required');
    setMissing(req);
    if (Object.keys(req).length) return;
    const data: GuestDocumentInput = {
      ...(linkable && memberId ? { partyMemberId: memberId } : {}),
      docType,
      isMain: initial ? undefined : first,
      fullNameOnDoc: form.fullNameOnDoc.trim(),
      docNumber: form.docNumber.replace(/\s/g, '').toUpperCase(),
      dateOfBirth: opt(form.dateOfBirth),
      gender: gender || undefined,
      nationalityCode: passport ? form.nationalityCode.trim().toUpperCase() || undefined : 'VNM',
      address: passport ? undefined : opt(form.address),
      passportIssueDate: passport ? opt(form.passportIssueDate) : undefined,
      issuingPlace: passport ? opt(form.issuingPlace) : undefined,
      passportExpiryDate: passport ? opt(form.passportExpiryDate) : undefined,
      visaKind: passport ? visaKind || undefined : undefined,
      visaNumber: passport && visaKind !== 'visa_exempt' ? opt(form.visaNumber) : undefined,
      visaValidUntil: passport ? opt(form.visaValidUntil) : undefined,
      entryDate: passport && hasEntry ? opt(form.entryDate) : undefined,
      entryPort: passport ? opt(form.entryPort) : undefined,
      entryPurpose: passport ? opt(form.entryPurpose) : undefined,
      noEntryRecord: passport ? !hasEntry : undefined,
      captureMethod: 'manual',
    };
    const G = { propertyId, registrationId: registration.id };
    const out = await act.submit((idem) =>
      initial
        ? api.updateGuestDocument(G, initial.id, data, registration.version)
        : api.addGuestDocument(G, data, images.slice(0, 4), idem),
    );
    if (out) {
      setImages([]);
      const linked = members.find((m) => m.id === memberId);
      toast(linked ? t('reg.link.linked_toast', { name: memberName(linked) }) : t('common.saved'));
      onSaved(out.data);
    } else if (linkable) {
      // The person may have left the party meanwhile (422 partyMemberId NOT_IN_LIST) – read it again.
      party.reload();
    }
  };

  const f: Record<string, string | undefined> = { ...missing, ...act.fields };
  const unclaimedProblem = isApiError(act.error)
    ? (act.error.problem as { documentId?: unknown; personIndex?: unknown })
    : undefined;
  const unclaimed =
    typeof unclaimedProblem?.documentId === 'string'
      ? {
          documentId: unclaimedProblem.documentId,
          personIndex:
            typeof unclaimedProblem.personIndex === 'number'
              ? unclaimedProblem.personIndex
              : undefined,
        }
      : null;
  const text = (
    k: keyof typeof form,
    label: string,
    extra: { type?: string; max?: number } = {},
  ) => (
    <Field label={label} error={f[k]}>
      {(p) => (
        <input
          {...p}
          type={extra.type ?? 'text'}
          className="input"
          maxLength={extra.max}
          value={form[k]}
          onChange={set(k)}
        />
      )}
    </Field>
  );
  return (
    <Modal
      open
      title={t('ci.manual_title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={dirty}
      unsavedLabels={unsaved}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            onClick={() => void save()}
          >
            {act.label(t('ci.manual_save'))}
          </Button>
        </>
      }
    >
      {!initial && act.code === 'DOCUMENT_UNCLAIMED_EXISTS' && unclaimed && onOpenDocument ? (
        <Alert
          tone="warn"
          actions={
            <Button size="sm" onClick={() => onOpenDocument(unclaimed.documentId)}>
              {t('reg.link.open_pending')}
            </Button>
          }
        >
          {unclaimed.personIndex
            ? t('reg.link.dup_unclaimed', { n: unclaimed.personIndex })
            : t('reg.link.dup_pending')}
        </Alert>
      ) : !initial && act.code === 'PARTY_DUPLICATE' && onOpenPending ? (
        <Alert
          tone="warn"
          actions={
            <Button size="sm" onClick={onOpenPending}>
              {t('reg.link.open_pending')}
            </Button>
          }
        >
          {t('reg.link.dup_pending')}
        </Alert>
      ) : (
        act.view()
      )}
      {linkable ? (
        party.state.status === 'error' && !party.state.data ? (
          <Alert
            tone="bad"
            actions={
              <Button size="sm" onClick={party.reload}>
                {t('common.retry')}
              </Button>
            }
          >
            {t('reg.link.party_error')}
          </Alert>
        ) : (
          <Field
            label={t('reg.link.member')}
            required={pending && free.length > 0}
            error={f.partyMemberId}
            help={
              pending && party.state.data && free.length === 0
                ? deadline
                  ? t('reg.link.no_member', { time: deadline })
                  : t('reg.link.no_member_soon')
                : pending
                  ? deadline
                    ? t('reg.link.member_help_pending', { time: deadline })
                    : t('reg.link.member_help_pending_soon')
                  : t('reg.link.member_help')
            }
          >
            {(p) => (
              <select
                {...p}
                className="input"
                value={memberId}
                disabled={!party.state.data}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="">{t('reg.link.member_placeholder')}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id} disabled={taken(m)}>
                    {taken(m) ? t('reg.link.has_doc', { name: memberName(m) }) : memberName(m)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )
      ) : null}
      <Field label={t('checkin.docs.field.doc_type')}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
          >
            <option value="cccd">{t('ci.doc.cccd')}</option>
            <option value="passport">{t('ci.doc.passport')}</option>
            <option value="child_personal_id">{t('ci.doc.child')}</option>
          </select>
        )}
      </Field>
      <div className="g-2">
        <Field label={t('checkin.docs.field.doc_no')} required error={f.docNumber}>
          {(p) => (
            <input
              {...p}
              className="input mono"
              autoComplete="off"
              value={form.docNumber}
              onChange={set('docNumber')}
            />
          )}
        </Field>
        <Field label={t('checkin.docs.field.full_name')} required error={f.fullNameOnDoc}>
          {(p) => (
            <input
              {...p}
              className="input"
              autoComplete="off"
              value={form.fullNameOnDoc}
              onChange={set('fullNameOnDoc')}
            />
          )}
        </Field>
        {text('dateOfBirth', t('checkin.docs.field.dob'), { type: 'date' })}
        <div className="field">
          <span className="label-h" id={`${ids}-g`}>
            {t('checkin.docs.field.gender')}
          </span>
          <Seg
            labelledBy={`${ids}-g`}
            value={gender}
            onChange={setGender}
            options={[
              { value: 'male', label: t('reg.value.gender.male') },
              { value: 'female', label: t('reg.value.gender.female') },
              { value: 'other', label: t('reg.value.gender.other') },
            ]}
          />
        </div>
        {passport ? (
          <>
            {text('nationalityCode', t('checkin.docs.field.nationality'), { max: 3 })}
            {text('passportIssueDate', t('checkin.docs.field.passport_issue_date'), {
              type: 'date',
            })}
            {text('issuingPlace', t('checkin.docs.field.issuing_place'), { max: 100 })}
            {text('passportExpiryDate', t('checkin.docs.field.passport_expiry'), {
              type: 'date',
            })}
          </>
        ) : (
          text('address', t('checkin.docs.field.address'), { max: 300 })
        )}
      </div>
      {passport ? (
        <>
          <div className="field">
            <span className="label-h" id={`${ids}-vk`}>
              {t('checkin.docs.field.visa_kind')}
            </span>
            <Seg
              labelledBy={`${ids}-vk`}
              value={visaKind}
              onChange={setVisaKind}
              options={[
                { value: 'visa', label: t('reg.value.visa_kind.visa') },
                { value: 'visa_exempt', label: t('reg.value.visa_kind.visa_exempt') },
                {
                  value: 'temp_residence_card',
                  label: t('reg.value.visa_kind.temp_residence_card'),
                },
              ]}
            />
          </div>
          <div className="g-2">
            {visaKind !== 'visa_exempt'
              ? text('visaNumber', t('checkin.docs.field.visa_number'), { max: 20 })
              : null}
            {text('visaValidUntil', t('checkin.docs.field.visa'), { type: 'date' })}
          </div>
          <Checkbox checked={hasEntry} onChange={setHasEntry}>
            {t('checkin.verify.entry_record')}
          </Checkbox>
          <div className="g-2">
            {hasEntry
              ? text('entryDate', t('checkin.docs.field.entry_date'), { type: 'date' })
              : null}
            {text('entryPort', t('checkin.docs.field.entry_port'), { max: 100 })}
            {text('entryPurpose', t('checkin.docs.field.entry_purpose'), { max: 100 })}
          </div>
          <p className="li-s">{t('ci.manual_note')}</p>
        </>
      ) : null}
      {initial ? null : (
        <Field label={t('checkin.docs.scan')} error={f.image}>
          {(p) => (
            <input
              {...p}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files ?? []).slice(0, 4))}
            />
          )}
        </Field>
      )}
    </Modal>
  );
}

const CHECK_LABEL: Record<DocumentCheckCode, string> = {
  name_match: 'checkin.verify.name',
  passport_valid_through_departure: 'checkin.verify.passport',
  passport_valid_at_arrival: 'checkin.verify.passport_at_arrival',
  visa_valid_through_departure: 'checkin.verify.visa',
  visa_valid_at_arrival: 'checkin.verify.visa_at_arrival',
  stay_within_visa: 'checkin.verify.stay_within_visa',
  entry_record_present: 'checkin.verify.entry_record',
  party_count: 'checkin.verify.headcount',
};

/**
 * H13 13.3 – three results only (Đạt · Không đạt · Chưa kiểm được), never "Đạt" without data; every
 * "Không đạt"/"Chưa kiểm được" needs a handling note (3–500) before the review can be completed.
 * Saved per check with `recordDocumentCheck` (If-Match = registration version).
 */
export function VerifyList({
  registration,
  departureDate,
  onChange,
}: {
  registration: Registration;
  departureDate: string;
  onChange: (r: Registration) => void;
}) {
  const { t, date } = useI18n();
  return (
    <div className="stack">
      {registration.documents.map((d) => (
        <div key={d.id} className="card">
          <b>
            {d.fullNameOnDoc}
            {d.nationalityCode ? ` · ${d.nationalityCode}` : ''}
          </b>
          <ul className="list-none">
            {d.checks
              .filter((c) => c.result !== 'not_applicable')
              .map((c) => (
                <CheckRow
                  key={c.code}
                  check={c}
                  label={t(CHECK_LABEL[c.code], {
                    date: date(departureDate),
                    need: registration.requiredCount,
                  })}
                  documentId={d.id}
                  registration={registration}
                  onChange={onChange}
                />
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CheckRow({
  check,
  label,
  documentId,
  registration,
  onChange,
}: {
  check: GuestDocumentMasked['checks'][number];
  label: string;
  documentId: string;
  registration: Registration;
  onChange: (r: Registration) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const act = useSubmit();
  const [note, setNote] = useState(check.handledNote ?? '');
  const [mark, setMark] = useState<'pass' | 'fail' | null>(check.manualResult ?? null);
  const result = resultOf(check);
  const needsNote = check.result === 'fail' || check.result === 'unverified';
  const save = async (manual: 'pass' | 'fail' | null) => {
    if (note.trim().length < 3) return;
    const out = await act.submit(() =>
      api.recordDocumentCheck(
        { propertyId, registrationId: registration.id },
        documentId,
        check.code,
        { note: note.trim(), manualResult: manual ?? undefined },
        registration.version,
      ),
    );
    if (out) onChange(out.data);
  };
  const tone = result === 'pass' ? 'ok' : result === 'fail' ? 'bad' : 'warn';
  const resultKey =
    result === 'pass'
      ? 'checkin.verify.result.pass'
      : result === 'fail'
        ? 'checkin.verify.result.fail'
        : 'checkin.verify.result.unknown';
  // DS 6.4 / FE-S3-17: three looks – Đạt (ok), Không đạt (fail), Chưa kiểm được (dashed, "?").
  const cls = result === 'pass' ? 'ok' : result === 'fail' ? 'fail' : 'unknown';
  return (
    <li className={`chk3 ${cls}`}>
      <Icon name={result === 'pass' ? 'check' : result === 'fail' ? 'x' : 'question'} />
      <div className="grow">
        <b>{label}</b>
        {check.result === 'unverified' && !check.manualResult ? (
          <div className="li-s">{t('checkin.verify.unknown_help')}</div>
        ) : null}
        {needsNote ? (
          <div className="stack">
            {check.result === 'unverified' ? (
              <div className="row wrap">
                <Button size="sm" aria-pressed={mark === 'pass'} onClick={() => setMark('pass')}>
                  {t('checkin.verify.mark_pass')}
                </Button>
                <Button size="sm" aria-pressed={mark === 'fail'} onClick={() => setMark('fail')}>
                  {t('checkin.verify.mark_fail')}
                </Button>
              </div>
            ) : null}
            <Field
              label={t('checkin.verify.note_label')}
              required
              error={act.fields.note}
              help={check.handledByName}
            >
              {(p) => (
                <input
                  {...p}
                  className="input"
                  maxLength={500}
                  placeholder={t('checkin.verify.note_placeholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() =>
                    note.trim() !== (check.handledNote ?? '') &&
                    (check.result !== 'unverified' || mark) &&
                    void save(mark)
                  }
                />
              )}
            </Field>
            {check.result === 'unverified' && mark && note.trim().length >= 3 ? (
              <Button size="sm" busy={act.busy} onClick={() => void save(mark)}>
                {t('common.save')}
              </Button>
            ) : null}
            {act.view()}
          </div>
        ) : null}
      </div>
      <Chip tone={tone} icon={result === 'unverified' ? 'question' : undefined}>
        {t(resultKey)}
      </Chip>
    </li>
  );
}

/** EP06 3.3: every fail/unverified check has a note (and a manual mark when unverified). */
export function reviewReady(r: Registration, skip: DocumentCheckCode[] = []): boolean {
  return r.documents.every((d) =>
    d.checks.every(
      (c) =>
        skip.includes(c.code) ||
        !(c.result === 'fail' || c.result === 'unverified') ||
        (Boolean(c.handledNote) && (c.result !== 'unverified' || Boolean(c.manualResult))),
    ),
  );
}
