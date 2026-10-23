import {
  isApiError,
  newIdempotencyKey,
  type Guest,
  type GuestInput,
  type GuestSummary,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Field, Modal } from '@ottimo/ui';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { useBusinessDay } from '../app/businessDay';
import { timeHHmm } from '../app/dates';
import { fieldErrorText, fieldErrors, problemView } from '../app/problem';
import { readDraft, removeDraft, writeDraft } from '../app/clientData';
import { useToast } from '../app/toast';
import { checkEmail, checkName, checkTaxCode, normalizePhone } from '../app/validation';
import { useOnline } from '../hooks/useOnline';
import { usePropertyId, useSession } from '../session/SessionProvider';
import {
  GUEST_LOCALES,
  GUEST_TAGS,
  NATIONALITIES,
  SERVICE_NOTES,
  countryName,
} from './guestCatalog';

type Contact = 'phone' | 'zalo' | 'whatsapp' | 'kakaotalk' | 'email';

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  whatsapp: string;
  preferredContact: Contact | '';
  dateOfBirth: string;
  nationalityCode: string;
  preferredLocale: 'vi' | 'en' | 'ru';
  tag: string;
  companyName: string;
  taxCode: string;
  serviceNotes: string[];
  freeNote: string;
}

const EMPTY: FormState = {
  fullName: '',
  phone: '',
  email: '',
  whatsapp: '',
  preferredContact: '',
  dateOfBirth: '',
  nationalityCode: 'VN',
  preferredLocale: 'vi',
  tag: '',
  companyName: '',
  taxCode: '',
  serviceNotes: [],
  freeNote: '',
};

function fromGuest(g: Guest): FormState {
  return {
    fullName: g.fullName,
    phone: g.phone ?? '',
    email: g.email ?? '',
    whatsapp: g.messagingHandles?.whatsapp ?? '',
    preferredContact: (g.preferredContact as Contact | undefined) ?? '',
    dateOfBirth: g.dateOfBirth ?? '',
    nationalityCode: g.nationalityCode ?? 'VN',
    preferredLocale: (g.preferredLocale as FormState['preferredLocale'] | undefined) ?? 'vi',
    tag: g.tags?.[0] ?? '',
    companyName: g.companyName ?? '',
    taxCode: g.taxCode ?? '',
    serviceNotes: g.serviceNotes ?? [],
    freeNote: g.freeNote ?? '',
  };
}

interface Duplicate {
  field: 'phone' | 'email';
  match?: GuestSummary;
}

export interface GuestFormDialogProps {
  /** Edit mode when given. */
  guest?: Guest;
  /** Quick create from the guest picker: name typed in the search box. */
  prefillName?: string;
  onClose: () => void;
  onSaved: (guest: Guest) => void;
  /** Open another existing profile (duplicate found). */
  onOpenGuest: (guestId: string) => void;
  /** Booking context only: use the existing profile instead (crm.duplicate_use). */
  onUseGuest?: (guest: GuestSummary) => void;
}

/** H06 6.2 – guest profile form with duplicate blocking (US-071, US-072). No ID-document field (AC3). */
export function GuestFormDialog({
  guest,
  prefillName,
  onClose,
  onSaved,
  onOpenGuest,
  onUseGuest,
}: GuestFormDialogProps) {
  // DOB_FUTURE is checked by the API against the business day (guests.service, BR-010).
  const businessDay = useBusinessDay();
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const { online } = useOnline();
  const ids = useId();
  const roles = session.roles;
  const fdPlus = roles.some((r) =>
    ['owner', 'manager', 'front_desk_lead', 'front_desk'].includes(r),
  );
  const canTag = fdPlus || roles.includes('sales_staff');
  const draftKey = `ottimo.draft.guest.${session.me?.id ?? 'anon'}`;
  const isCreate = !guest;

  const initial = guest ? fromGuest(guest) : { ...EMPTY, fullName: prefillName ?? '' };
  const [form, setForm] = useState<FormState>(() => {
    if (!isCreate || prefillName) return initial;
    try {
      const saved = readDraft(draftKey);
      return saved ? { ...EMPTY, ...(JSON.parse(saved) as Partial<FormState>) } : initial;
    } catch {
      return initial;
    }
  });
  const [draftAt, setDraftAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ text: string; existingId?: string } | null>(null);
  const [dup, setDup] = useState<Duplicate | null>(null);
  const [busy, setBusy] = useState(false);
  const idemKey = useRef(newIdempotencyKey());
  const formRef = useRef<HTMLFormElement>(null);
  // EP00 0.2.1: focus jumps to the first invalid field.
  const focusFirstInvalid = () =>
    setTimeout(
      () => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      0,
    );
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  // DS D5: the create form keeps a draft in memory (per user, never Web Storage – FB-R2-SEC-FE-01);
  // it survives closing the dialog and an expired session of the same user, not sign-out or reload.
  useEffect(() => {
    if (!isCreate || !dirty) return;
    writeDraft(draftKey, JSON.stringify(form));
    setDraftAt(new Date());
  }, [form, dirty, isCreate, draftKey]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    idemKey.current = newIdempotencyKey();
  };

  const msg = (code: string, args: Record<string, string | number> = {}) =>
    fieldErrorText(t, { field: '', code }, args);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const name = checkName(form.fullName);
    if (name) e.fullName = msg(name, { max: 120 });
    if (!form.phone.trim() && !form.email.trim()) e.phone = msg('CONTACT_REQUIRED');
    if (form.phone.trim()) {
      const p = normalizePhone(form.phone);
      if ('error' in p) e.phone = msg(p.error);
    }
    if (form.email.trim() && checkEmail(form.email)) e.email = msg('EMAIL_INVALID');
    if (form.whatsapp.length > 64) e.whatsapp = msg('TOO_LONG', { max: 64 });
    const channelEmpty =
      (form.preferredContact === 'email' && !form.email.trim()) ||
      ((form.preferredContact === 'phone' || form.preferredContact === 'zalo') &&
        !form.phone.trim()) ||
      ((form.preferredContact === 'whatsapp' || form.preferredContact === 'kakaotalk') &&
        !form.whatsapp.trim());
    if (form.preferredContact && channelEmpty)
      e.preferredContact = msg('CONTACT_CHANNEL_EMPTY', {
        channel: contactLabel(form.preferredContact),
      });
    if (fdPlus) {
      if (form.dateOfBirth && form.dateOfBirth > businessDay)
        e.dateOfBirth = t('field_error.not_in_list');
      if (form.taxCode.trim() && checkTaxCode(form.taxCode)) e.taxCode = t('invoice.tax_id_error');
      if (form.taxCode.trim() && !form.companyName.trim()) e.companyName = t('common.required');
      if (form.freeNote.length > 1000) e.freeNote = msg('TOO_LONG', { max: 1000 });
    }
    return e;
  };

  function contactLabel(c: Contact): string {
    return c === 'phone'
      ? t('crm.pref_phone')
      : c === 'zalo'
        ? t('crm.pref_zalo')
        : c === 'email'
          ? t('booking.email')
          : c === 'whatsapp'
            ? 'WhatsApp'
            : 'KakaoTalk';
  }

  /** US-072: check the phone/email when leaving the field (server checks again on save). */
  const lookup = async (field: 'phone' | 'email') => {
    const value = form[field].trim();
    if (!value) {
      if (dup?.field === field) setDup(null);
      return;
    }
    if (field === 'phone' && 'error' in normalizePhone(value)) return;
    if (field === 'email' && checkEmail(value)) return;
    try {
      const { data } = await api.lookupGuestByContact(
        { propertyId },
        field === 'phone' ? { phone: value } : { email: value },
      );
      const other = data.matches.find((m) => m.id !== guest?.id);
      // 0.3.4 Q1: SAL/CTV get `{ matches: [], match: possible_duplicate }` for a profile outside
      // their scope – warn "ask the front desk" without any id/name (FB-R2-QA-FE-03, BUG-R2-008).
      const possible = !other && data.match === 'possible_duplicate';
      setDup(
        other ? { field, match: other } : possible ? { field } : dup?.field === field ? null : dup,
      );
    } catch {
      /* lookup is only an early warning – save re-checks */
    }
  };

  const buildBody = (): GuestInput => {
    const body: GuestInput = {
      fullName: form.fullName.trim().replace(/\s+/g, ' '),
      nationalityCode: form.nationalityCode,
      preferredLocale: form.preferredLocale,
    };
    if (form.phone.trim()) body.phone = form.phone.trim();
    if (form.email.trim()) body.email = form.email.trim().toLowerCase();
    if (form.whatsapp.trim()) body.messagingHandles = { whatsapp: form.whatsapp.trim() };
    if (form.preferredContact) body.preferredContact = form.preferredContact;
    if (canTag) body.tags = form.tag ? [form.tag] : [];
    if (fdPlus) {
      if (form.dateOfBirth) body.dateOfBirth = form.dateOfBirth;
      if (form.companyName.trim()) body.companyName = form.companyName.trim();
      if (form.taxCode.trim()) body.taxCode = form.taxCode.replace(/\s/g, '');
      body.serviceNotes = form.serviceNotes;
      if (form.freeNote.trim()) body.freeNote = form.freeNote.trim();
    }
    return body;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setBanner({ text: t('error.VALIDATION_FAILED', { n: Object.keys(e).length }) });
      focusFirstInvalid();
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const { data } = guest
        ? await api.updateGuest({ propertyId, guestId: guest.id }, buildBody(), guest.version)
        : await api.createGuest({ propertyId }, buildBody(), idemKey.current);
      if (isCreate) removeDraft(draftKey);
      toast(t('crm.saved', { code: data.code }));
      onSaved(data);
    } catch (err) {
      if (isApiError(err) && err.code === 'DUPLICATE_GUEST') {
        const p = err.problem as { existingGuestId?: string; existingGuestCode?: string };
        if (p.existingGuestId) {
          setBanner({
            text: t('error.DUPLICATE_GUEST', { guest: p.existingGuestCode ?? '' }),
            existingId: p.existingGuestId,
          });
        } else {
          // Outside the caller's scope (0.3.4 Q5): no id/code – same "ask the front desk" sentence.
          const field = err.fieldErrors.find((f) => f.code === 'DUPLICATE_GUEST')?.field;
          const target = field?.replace(/^body\./, '') === 'email' ? 'email' : 'phone';
          setDup({ field: target });
          setBanner({ text: t('field_error.possible_duplicate_other') });
        }
      } else if (
        isApiError(err) &&
        (err.code === 'VALIDATION_FAILED' || err.code === 'CARD_NUMBER_DETECTED')
      ) {
        const fe = fieldErrors(t, err);
        if (err.code === 'CARD_NUMBER_DETECTED' && !Object.keys(fe).length)
          fe.freeNote = t('error.CARD_NUMBER_DETECTED');
        setErrors(fe);
        setBanner({ text: t('error.VALIDATION_FAILED', { n: Object.keys(fe).length }) });
        focusFirstInvalid();
      } else {
        setBanner({ text: problemView(t, err).text });
      }
    } finally {
      setBusy(false);
    }
  };

  const dupOwnName = dup?.match?.displayName;
  const dupText = dup
    ? dupOwnName
      ? t('error.DUPLICATE_GUEST', { guest: `${dupOwnName} (${dup.match?.code ?? ''})` })
      : t('field_error.possible_duplicate_other')
    : null;
  const formId = `${ids}-form`;

  return (
    <Modal
      open
      size="lg"
      title={guest ? t('crm.edit_title', { code: guest.code }) : t('crm.title_new')}
      meta={draftAt ? t('crm.draft_saved', { time: timeHHmm(draftAt) }) : undefined}
      closeLabel={t('common.close')}
      onClose={() => {
        if (isCreate) removeDraft(draftKey);
        onClose();
      }}
      dirty={dirty}
      unsavedLabels={{
        title: t('common.unsaved_title'),
        body: t('common.unsaved_body'),
        keep: t('common.unsaved_keep'),
        discard: t('common.unsaved_discard'),
      }}
      footer={
        <>
          {isCreate ? (
            <Button onClick={onClose}>{t('booking.close_draft')}</Button>
          ) : (
            <Button onClick={onClose}>{t('common.cancel')}</Button>
          )}
          <Button
            type="submit"
            form={formId}
            variant="pri"
            busy={busy}
            busyLabel={t('common.saving')}
            disabled={!online || Boolean(dup)}
          >
            {dup ? t('crm.save_blocked') : t('crm.save')}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} onSubmit={onSubmit} noValidate>
        {dup && dupOwnName && dup.match ? (
          <Alert
            tone="bad"
            icon="users"
            title={dupText}
            actions={
              <>
                {onUseGuest ? (
                  <Button size="sm" variant="pri" onClick={() => onUseGuest(dup.match!)}>
                    {t('crm.duplicate_use')}
                  </Button>
                ) : null}
                <Button size="sm" onClick={() => onOpenGuest(dup.match!.id)}>
                  {t('crm.duplicate_open')}
                </Button>
              </>
            }
          />
        ) : null}
        {banner ? (
          <Alert
            tone="bad"
            actions={
              banner.existingId ? (
                <Button size="sm" onClick={() => onOpenGuest(banner.existingId!)}>
                  {t('crm.duplicate_open')}
                </Button>
              ) : undefined
            }
          >
            {banner.text}
          </Alert>
        ) : null}
        <div className="g-2">
          <Field className="span-2" label={t('crm.f_name')} required error={errors.fullName}>
            {(p) => (
              <input
                {...p}
                className="input"
                autoComplete="off"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
              />
            )}
          </Field>
          <Field
            label={t('booking.field.phone')}
            error={
              errors.phone ??
              (dup?.field === 'phone'
                ? dupOwnName
                  ? t('crm.phone_taken', {
                      code: dup.match?.code ?? '',
                      phone: dup.match?.phoneMasked ?? '',
                    })
                  : dupText
                : undefined) ??
              undefined
            }
          >
            {(p) => (
              <input
                {...p}
                className="input num"
                inputMode="tel"
                autoComplete="off"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                onBlur={() => void lookup('phone')}
              />
            )}
          </Field>
          <Field
            label={t('booking.email')}
            help={t('crm.contact_rule')}
            error={errors.email ?? (dup?.field === 'email' ? (dupText ?? undefined) : undefined)}
          >
            {(p) => (
              <input
                {...p}
                className="input"
                type="email"
                inputMode="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => void lookup('email')}
              />
            )}
          </Field>
          <Field label={t('crm.f_handles')} error={errors.whatsapp}>
            {(p) => (
              <input
                {...p}
                className="input"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
              />
            )}
          </Field>
          <Field label={t('crm.f_pref')} error={errors.preferredContact}>
            {(p) => (
              <select
                {...p}
                className="input"
                value={form.preferredContact}
                onChange={(e) => set('preferredContact', e.target.value as Contact | '')}
              >
                <option value="">–</option>
                {(['zalo', 'phone', 'whatsapp', 'kakaotalk', 'email'] as Contact[]).map((c) => (
                  <option key={c} value={c}>
                    {contactLabel(c)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {fdPlus ? (
            <Field label={t('crm.f_dob')} error={errors.dateOfBirth}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set('dateOfBirth', e.target.value)}
                />
              )}
            </Field>
          ) : null}
          <Field label={t('crm.f_nat')} error={errors.nationalityCode}>
            {(p) => (
              <select
                {...p}
                className="input"
                value={form.nationalityCode}
                onChange={(e) => set('nationalityCode', e.target.value)}
              >
                {NATIONALITIES.map((c) => (
                  <option key={c} value={c}>
                    {countryName(c, locale)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {/* BUG-R2-179 (US-048 AC3, BR-610): the last 4 of the ID, only when the server gives them (the guest agreed
              to be remembered – P05); the full number lives in the stay declaration only. */}
          {guest?.idDocLast4 ? (
            <div className="field">
              <span className="label-h" id={`${ids}-iddoc`}>
                {t('crm.f_id_doc')}
              </span>
              <p className="mono" aria-labelledby={`${ids}-iddoc`}>
                …{guest.idDocLast4}
              </p>
              <span className="help">{t('crm.f_id_doc_help')}</span>
            </div>
          ) : null}
          <Field label={t('crm.f_lang')}>
            {(p) => (
              <select
                {...p}
                className="input"
                value={form.preferredLocale}
                onChange={(e) =>
                  set('preferredLocale', e.target.value as FormState['preferredLocale'])
                }
              >
                {GUEST_LOCALES.map((l) => (
                  <option key={l.value} value={l.value} lang={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {canTag ? (
            <Field label={t('crm.f_tags')}>
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={form.tag}
                  onChange={(e) => set('tag', e.target.value)}
                >
                  <option value="">{t('crm.tag_none')}</option>
                  {GUEST_TAGS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {t(g.label)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          ) : null}
          {fdPlus ? (
            <>
              <Field
                label={t('crm.f_company')}
                required={Boolean(form.taxCode.trim())}
                error={errors.companyName}
              >
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    maxLength={200}
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('invoice.tax_id')} error={errors.taxCode}>
                {(p) => (
                  <input
                    {...p}
                    className="input num"
                    inputMode="numeric"
                    value={form.taxCode}
                    onChange={(e) => set('taxCode', e.target.value)}
                  />
                )}
              </Field>
              <fieldset
                className="field span-2"
                style={{ border: 0, padding: 0, margin: '0 0 14px' }}
              >
                <legend
                  className="lbl"
                  style={{ fontWeight: 500, fontSize: '.8125rem', marginBottom: 4 }}
                >
                  {t('crm.f_service')}
                </legend>
                <div className="row">
                  {SERVICE_NOTES.map((s) => (
                    <Checkbox
                      key={s.value}
                      checked={form.serviceNotes.includes(s.value)}
                      onChange={(on) =>
                        set(
                          'serviceNotes',
                          on
                            ? [...form.serviceNotes, s.value]
                            : form.serviceNotes.filter((x) => x !== s.value),
                        )
                      }
                    >
                      {t(s.label)}
                    </Checkbox>
                  ))}
                </div>
                <span className="help">{t('crm.svc_help')}</span>
              </fieldset>
              <Field
                className="span-2"
                label={t('crm.f_note')}
                help={t('crm.note_hint')}
                error={errors.freeNote}
              >
                {(p) => (
                  <textarea
                    {...p}
                    className="input"
                    maxLength={1000}
                    value={form.freeNote}
                    onChange={(e) => set('freeNote', e.target.value)}
                  />
                )}
              </Field>
            </>
          ) : null}
        </div>
        <Alert tone="info" icon="id" role="note">
          {t('crm.no_id_note')}
        </Alert>
      </form>
    </Modal>
  );
}
