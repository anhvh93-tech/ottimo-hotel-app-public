import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
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
export function useSubmit() {
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
        setFields(fieldErrors(t, e));
      }
      return undefined;
    }
  }

  const text = (e: unknown = error, extra: Record<string, unknown> = {}) => {
    if (!e) return '';
    if (isApiError(e) && e.code === 'VALIDATION_FAILED') {
      const f = Object.values(fieldErrors(t, e));
      if (f.length) return f[0]!;
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

  return {
    submit,
    busy: write.busy,
    busyLabel: write.busyLabel,
    label: write.label,
    error,
    setError,
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
