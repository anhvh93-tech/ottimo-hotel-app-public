import { isApiError } from '@ottimo/api-client';
import { hasKey, useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useState, type ReactNode } from 'react';
import { api } from '../../app/api';
import { notifyChanged } from '../../app/live';
import { parseVnd } from '../../app/money';
import { fieldErrors } from '../../app/problem';
import { rsvErrorText } from '../../app/reservations';
import { isRetryable, useWrite } from '../../app/useWrite';

/**
 * One write button on the stay screens: DS 6.21 auto-retry (`useWrite`), field errors of a 422,
 * request-level message otherwise. Success → `notifyChanged()` so rack/lists refresh.
 */
export interface SubmitFieldMap {
  /** Fields that have an input on screen – their message is shown under that input. */
  bound?: string[];
  /** Field (or field prefix before ".") → what the person sees, for fields without an input. */
  labels?: Record<string, string>;
}

export function useSubmit(map?: SubmitFieldMap) {
  const { t, locale } = useI18n();
  const write = useWrite();
  const [error, setError] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit<T>(fn: (idempotencyKey: string) => Promise<T>): Promise<T | undefined> {
    if (write.busy) return undefined;
    setError(null);
    setFields({});
    try {
      const out = await write.run(fn);
      notifyChanged();
      return out;
    } catch (e) {
      if (!isRetryable(e)) {
        setError(e);
        setFields(fieldErrors(t, e, {}, locale));
      }
      return undefined;
    }
  }

  const text = (e: unknown = error, extra: Record<string, unknown> = {}) => {
    if (!e) return '';
    if (isApiError(e) && e.code === 'VALIDATION_FAILED') {
      const f = fieldErrors(t, e, {}, locale);
      const entries = Object.entries(f);
      if (entries.length && !map) return entries[0]![1];
      if (entries.length && map) {
        // BUG-R2-052: a field without an input on screen must not show a bare "Bắt buộc" – say which
        // item it is; fields with an input → "Còn {n} ô cần sửa" (the message sits at the input).
        const unbound = entries.filter(([k]) => !map.bound?.includes(k));
        if (!unbound.length) return t('error.VALIDATION_FAILED', { n: entries.length });
        const own = (k: string) =>
          e.fieldErrors.some(
            (fe) => fe.field.replace(/^body\./, '') === k && hasKey(`field.${fe.code}`),
          );
        return unbound
          .map(([k, msg]) => {
            const label = map.labels?.[k] ?? map.labels?.[k.split('.')[0]!];
            // A code with its own sentence (`field.<CODE>`) already says what to do.
            return label && !own(k) ? t('error.field_named', { label, message: msg }) : msg;
          })
          .join(' ');
      }
    }
    return rsvErrorText(t, e, { locale, canSeeGuest: true, ...extra });
  };

  const view = (extra?: Record<string, unknown>, actions?: ReactNode): ReactNode =>
    write.notice ??
    (error ? (
      <Alert tone="bad" actions={actions}>
        {text(error, extra)}
      </Alert>
    ) : null);

  /** Forget the last failure (its alert and field messages) – the input it was about has changed. */
  const reset = () => {
    setError(null);
    setFields({});
  };

  return {
    submit,
    busy: write.busy,
    busyLabel: write.busyLabel,
    label: write.label,
    error,
    setError,
    reset,
    fields,
    text,
    view,
    code: isApiError(error) ? error.code : undefined,
  };
}

/** Amount input with the "đ" affix (V-07). */
export function MoneyField({
  label,
  value,
  onChange,
  error,
  help,
  required,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  help?: ReactNode;
  required?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Field label={label} error={error} help={help} required={required}>
      {(p) => (
        <div className="input-affix">
          <input
            {...p}
            className="input num"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="affix">{t('common.vnd_unit')}</span>
        </div>
      )}
    </Field>
  );
}

export const amountOf = (text: string) => parseVnd(text) ?? 0;

/** DS C15 / 6.2: "Bỏ các thay đổi chưa lưu?" for dialogs with typed input (FE-S3-19). */
export function useUnsavedLabels() {
  const { t } = useI18n();
  return {
    title: t('common.unsaved_title'),
    body: t('common.unsaved_body'),
    keep: t('common.unsaved_keep'),
    discard: t('common.unsaved_discard'),
  };
}

/**
 * Step-up (SR-C3-09): re-enter the login password before reading C3 data (full document number, portal
 * data, full refund account). The password is sent once and never kept in state after the call.
 */
export function StepUpDialog({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.stepUp(password);
      setPassword('');
      onDone();
    } catch (e) {
      setPassword('');
      setError(
        isApiError(e) && e.code === 'REAUTH_FAILED' ? t('error.REAUTH_FAILED') : rsvErrorText(t, e),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('ci.stepup_title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="pri" busy={busy} disabled={!password} onClick={() => void submit()}>
            {t('ci.stepup_submit')}
          </Button>
        </>
      }
    >
      <p className="li-s">{t('ci.stepup_body')}</p>
      <Field label={t('ci.stepup_label')} error={error ?? undefined} required>
        {(p) => (
          <input
            {...p}
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
          />
        )}
      </Field>
    </Modal>
  );
}

/** Read a local image file into memory only (no storage) – used for receipts / evidence uploads. */
export function FilePicker({
  label,
  file,
  onChange,
  error,
  required,
}: {
  label: ReactNode;
  file: File | null;
  onChange: (f: File | null) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} error={error} required={required}>
      {(p) => (
        <div className="row wrap">
          <input
            {...p}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
          {file ? <span className="li-s">{file.name}</span> : null}
        </div>
      )}
    </Field>
  );
}
