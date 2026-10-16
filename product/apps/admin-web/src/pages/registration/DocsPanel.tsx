import {
  isApiError,
  type DocType,
  type DocumentCheckCode,
  type GuestDocumentInput,
  type GuestDocumentMasked,
  type GuestDocumentSensitive,
  type Registration,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../../app/api';
import { useToast } from '../../app/toast';
import { usePropertyId } from '../../session/SessionProvider';
import { StepUpDialog, useSubmit } from '../stay/common';

export const DOC_LABEL: Record<DocType, string> = {
  cccd: 'ci.doc.cccd',
  passport: 'ci.doc.passport',
  child_personal_id: 'ci.doc.child',
  other: 'checkin.docs.field.doc_type',
};

/** Effective result of a check: the desk's manual mark wins over the system result (EP06 3.2). */
export const resultOf = (c: GuestDocumentMasked['checks'][number]) =>
  c.manualResult ?? (c.result === 'ok' ? 'pass' : c.result === 'warning' ? 'fail' : c.result);

const SENSITIVE_MS = 60_000;

/**
 * H13 13.2 / H14 – documents per person (C3). After saving only the last 4 characters are shown; the
 * full number needs step-up and auto-hides after 60 s (EP06 0) or when the tab is hidden (SEC B5).
 * No download button; nothing is written to browser storage.
 */
export function DocsList({
  registration,
  reservation,
  onChange,
}: {
  registration: Registration;
  reservation: Pick<Reservation, 'adults' | 'children6to11' | 'childrenUnder6' | 'booker'>;
  onChange: (r: Registration) => void;
}) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const required =
    registration.requiredCount ||
    reservation.adults + (reservation.children6to11 ?? 0) + (reservation.childrenUnder6 ?? 0);
  const docs = [...registration.documents].sort((a, b) => Number(b.isMain) - Number(a.isMain));
  const missing = Math.max(0, required - docs.length);
  return (
    <div className="stack">
      <p className="li-s" role="status">
        {t('checkin.docs.progress', { have: docs.length, need: required })}
      </p>
      {docs.length === 0 ? <p className="muted">{t('checkin.docs.empty')}</p> : null}
      <ul className="list-plain">
        {docs.map((d) => (
          <DocRow key={d.id} doc={d} registrationId={registration.id} />
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

function DocRow({ doc, registrationId }: { doc: GuestDocumentMasked; registrationId: string }) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const [full, setFull] = useState<GuestDocumentSensitive | null>(null);
  const [stepUp, setStepUp] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const hide = () => document.visibilityState === 'hidden' && setFull(null);
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      clearTimeout(timer.current);
    };
  }, []);

  const show = async () => {
    setError(null);
    try {
      const res = await api.getGuestDocumentSensitive({ propertyId, registrationId }, doc.id);
      setFull(res.data);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFull(null), SENSITIVE_MS);
    } catch (e) {
      if (isApiError(e) && e.code === 'REAUTH_REQUIRED') setStepUp(true);
      else setError(e);
    }
  };

  const label =
    doc.docType === 'passport'
      ? t('ci.passport_masked', { last4: doc.docNumberLast4 })
      : doc.docType === 'child_personal_id'
        ? t('ci.child_doc', { last4: doc.docNumberLast4 })
        : t('ci.doc_masked', { type: t(DOC_LABEL[doc.docType]), last4: doc.docNumberLast4 });
  return (
    <li className="person">
      <div className="grow">
        <b>
          {doc.fullNameOnDoc}
          {doc.nationalityCode ? ` · ${doc.nationalityCode}` : ''}
          {doc.isMain ? ` · ${t('rsv.booker')}` : ''}
        </b>
        <div className="li-s">
          {full ? <span className="mono">{full.docNumber}</span> : label}
          {doc.imageIds?.length ? ` · ${t('ci.photo_count', { n: doc.imageIds.length })}` : ''}
          {doc.captureMethod === 'guest_upload' ? ` · ${t('checkin.docs.from_app')}` : ''}
        </div>
        {error ? <Alert tone="bad">{t('error.NOT_FOUND')}</Alert> : null}
      </div>
      <Chip tone="ok" icon="check">
        {t('guest.chip.doc_ok')}
      </Chip>
      <Button size="sm" variant="ghost" onClick={() => (full ? setFull(null) : void show())}>
        {t('ci.view_full')}
      </Button>
      {stepUp ? (
        <StepUpDialog
          onClose={() => setStepUp(false)}
          onDone={() => {
            setStepUp(false);
            void show();
          }}
        />
      ) : null}
    </li>
  );
}

/** H13 "Nhập tay giấy tờ" – multipart `addGuestDocument` (data JSON + 0…4 images kept in memory only). */
export function ManualDocDialog({
  registration,
  bookerName,
  first,
  onClose,
  onSaved,
}: {
  registration: Registration;
  bookerName?: string;
  first: boolean;
  onClose: () => void;
  onSaved: (r: Registration) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useSubmit();
  const ids = useId();
  const [docType, setDocType] = useState<DocType>('cccd');
  const [form, setForm] = useState({
    docNumber: '',
    fullNameOnDoc: first ? (bookerName ?? '') : '',
    dateOfBirth: '',
    nationalityCode: '',
    passportExpiryDate: '',
    visaValidUntil: '',
    entryDate: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const passport = docType === 'passport';
  const dirty = Object.values(form).some(Boolean) || images.length > 0;

  const save = async () => {
    const data: GuestDocumentInput = {
      docType,
      isMain: first,
      fullNameOnDoc: form.fullNameOnDoc.trim(),
      docNumber: form.docNumber.replace(/\s/g, '').toUpperCase(),
      dateOfBirth: form.dateOfBirth || undefined,
      nationalityCode: passport ? form.nationalityCode.trim().toUpperCase() || undefined : 'VNM',
      passportExpiryDate: passport ? form.passportExpiryDate || undefined : undefined,
      visaValidUntil: passport ? form.visaValidUntil || undefined : undefined,
      entryDate: passport ? form.entryDate || undefined : undefined,
      captureMethod: 'manual',
    };
    const out = await act.submit((idem) =>
      api.addGuestDocument(
        { propertyId, registrationId: registration.id },
        data,
        images.slice(0, 4),
        idem,
      ),
    );
    if (out) {
      setImages([]);
      toast(t('common.saved'));
      onSaved(out.data);
    }
  };

  const f = act.fields;
  return (
    <Modal
      open
      title={t('ci.manual_title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={dirty}
      unsavedLabels={{
        title: t('common.unsaved_title'),
        body: t('common.unsaved_body'),
        keep: t('common.unsaved_keep'),
        discard: t('common.unsaved_discard'),
      }}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!form.docNumber.trim() || !form.fullNameOnDoc.trim()}
            onClick={() => void save()}
          >
            {act.label(t('ci.manual_save'))}
          </Button>
        </>
      }
    >
      {act.view()}
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
        <Field label={t('checkin.docs.field.dob')} error={f.dateOfBirth}>
          {(p) => (
            <input
              {...p}
              type="date"
              className="input"
              value={form.dateOfBirth}
              onChange={set('dateOfBirth')}
            />
          )}
        </Field>
        {passport ? (
          <>
            <Field label={t('checkin.docs.field.nationality')} error={f.nationalityCode}>
              {(p) => (
                <input
                  {...p}
                  className="input mono"
                  maxLength={3}
                  value={form.nationalityCode}
                  onChange={set('nationalityCode')}
                />
              )}
            </Field>
            <Field label={t('checkin.docs.field.passport_expiry')} error={f.passportExpiryDate}>
              {(p) => (
                <input
                  {...p}
                  type="date"
                  className="input"
                  value={form.passportExpiryDate}
                  onChange={set('passportExpiryDate')}
                />
              )}
            </Field>
            <Field label={t('checkin.docs.field.visa')} error={f.visaValidUntil}>
              {(p) => (
                <input
                  {...p}
                  type="date"
                  className="input"
                  value={form.visaValidUntil}
                  onChange={set('visaValidUntil')}
                />
              )}
            </Field>
            <Field label={t('checkin.docs.field.entry_date')} error={f.entryDate}>
              {(p) => (
                <input
                  {...p}
                  type="date"
                  className="input"
                  value={form.entryDate}
                  onChange={set('entryDate')}
                />
              )}
            </Field>
          </>
        ) : null}
      </div>
      {passport ? <p className="li-s">{t('ci.manual_note')}</p> : null}
      <Field label={t('checkin.docs.scan')} error={f.image}>
        {(p) => (
          <input
            {...p}
            id={`${ids}-img`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []).slice(0, 4))}
          />
        )}
      </Field>
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
          <ul className="conds">
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
  return (
    <li className={result === 'pass' ? 'met' : 'unmet'}>
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
      <Chip tone={tone}>{t(resultKey)}</Chip>
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
