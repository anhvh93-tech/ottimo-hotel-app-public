import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field } from '@ottimo/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../app/api';
import {
  EMAIL_MAX,
  emailErrorText,
  emailFieldError,
  isEmailShape,
  normalizeEmail,
  sameEmail,
  SECURITY_EMAIL_ANCHOR,
  sendWithOneKey,
} from '../app/email';
import { useOnline } from '../hooks/useOnline';
import { useSession } from '../session/SessionProvider';
import { isStrongReauthError, StrongReauthDialog } from './StrongReauthDialog';

type Notice = { tone: 'ok' | 'info'; text: string };

/**
 * "Email nhận thư bảo mật" (BUG-R3-032, OpenAPI 0.3.10 `setMyEmail`, ARC v1.0.3-contract-email 7): shows
 * `Me.email`, adds / changes / removes it behind S2 (the shared dialog with `SecondFactorField`), one
 * Idempotency-Key per Save. Format and the shared-mailbox rule are checked on the client first and again by
 * the server BEFORE S2, so a refusal there closes the dialog and points at the field. Every role has it (own
 * address); `Me.securityEmailMissing` (owner/manager without one) adds the reminder line.
 * The address is shown in JetBrains Mono; it never goes into the URL, a log or the console.
 * [CHỜ UXD] placement and copy (hi-fi R3 "Bảo mật của tôi" has no email block yet).
 */
export function SecurityEmailCard() {
  const { t } = useI18n();
  const session = useSession();
  const location = useLocation();
  const { online } = useOnline();
  const current = session.me?.email ?? null;
  const missing = session.me?.securityEmailMissing === true;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  /** Pending S2 confirm: the address to save, or `null` = remove. */
  const [confirm, setConfirm] = useState<{ email: string | null } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const showForm = editing || !current;

  // Arriving from the reminder (`#security-email`): bring the block into view and focus the field.
  useEffect(() => {
    if (location.hash !== `#${SECURITY_EMAIL_ANCHOR}`) return;
    (inputRef.current ?? headRef.current)?.focus();
  }, [location.hash]);

  const startEdit = () => {
    setValue(current ?? '');
    setError(undefined);
    setNotice(null);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail(value);
    setNotice(null);
    if (!email) {
      setError(t('common.required'));
      inputRef.current?.focus();
      return;
    }
    if (!isEmailShape(email)) {
      setError(t('secmail.invalid'));
      inputRef.current?.focus();
      return;
    }
    setError(undefined);
    // Same address: nothing to send, no code spent (the server would answer 200 without a write).
    if (sameEmail(email, current)) {
      setEditing(false);
      setNotice({ tone: 'info', text: t('secmail.unchanged') });
      return;
    }
    setConfirm({ email });
  };

  const save = async (reauth: Parameters<typeof api.setMyEmail>[0]['reauth']) => {
    const target = confirm!;
    const before = current;
    try {
      await sendWithOneKey((key) => api.setMyEmail({ email: target.email, reauth }, key));
    } catch (err) {
      // Wrong / missing factor: the dialog keeps the user inside with its own sentence.
      if (isStrongReauthError(err)) throw err;
      const fe = emailFieldError(err);
      if (!fe) throw err; // 429, 403, 5xx… – one sentence inside the dialog.
      setConfirm(null);
      setValue(target.email ?? before ?? '');
      setEditing(true);
      setError(emailErrorText(t, fe));
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    setConfirm(null);
    setEditing(false);
    setValue('');
    setNotice({
      tone: 'ok',
      text: t(
        target.email === null
          ? 'secmail.removed'
          : before
            ? 'secmail.saved'
            : 'secmail.saved_first',
      ),
    });
    // Me carries the new address and `securityEmailMissing` (reminder off once an address is on file).
    await session.refresh().catch(() => undefined);
    requestAnimationFrame(() => headRef.current?.focus());
  };

  return (
    <section
      id={SECURITY_EMAIL_ANCHOR}
      className="card stack"
      aria-labelledby={`${SECURITY_EMAIL_ANCHOR}-h`}
    >
      <h3 id={`${SECURITY_EMAIL_ANCHOR}-h`} ref={headRef} tabIndex={-1} style={{ margin: 0 }}>
        {t('secmail.title')}
      </h3>
      <p className="muted" style={{ margin: 0 }}>
        {t('secmail.lead')}
      </p>
      {missing && !current ? (
        <Alert tone="warn" icon="shield">
          {t('secmail.missing')}
        </Alert>
      ) : null}
      {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
      {current && !editing ? (
        <div className="stack" style={{ gap: 4 }}>
          <div className="label-h">{t('secmail.current')}</div>
          <div className="mono" data-testid="security-email-current">
            {current}
          </div>
          <div className="row wrap" style={{ marginTop: 8 }}>
            <Button disabled={!online} onClick={startEdit}>
              {t('secmail.change')}
            </Button>
            <Button
              variant="ghost"
              disabled={!online}
              onClick={() => {
                setNotice(null);
                setConfirm({ email: null });
              }}
            >
              {t('secmail.remove')}
            </Button>
          </div>
        </div>
      ) : null}
      {!current && !editing ? (
        <p className="muted" style={{ margin: 0 }}>
          {t('secmail.none')}
        </p>
      ) : null}
      {showForm ? (
        <form className="stack" noValidate onSubmit={submit}>
          <Field
            label={t('secmail.field')}
            required
            help={
              <>
                {t('secmail.purpose')} {t('secmail.field_help')}
              </>
            }
            error={error}
          >
            {(p) => (
              <input
                {...p}
                ref={inputRef}
                className="input mono"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                maxLength={EMAIL_MAX}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </Field>
          <div className="row wrap">
            <Button type="submit" variant="pri" disabled={!online}>
              {current ? t('secmail.save') : t('secmail.add')}
            </Button>
            {current ? (
              <Button
                onClick={() => {
                  setEditing(false);
                  setError(undefined);
                }}
              >
                {t('common.cancel')}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
      <StrongReauthDialog
        open={confirm !== null}
        title={t(confirm?.email === null ? 'secmail.s2_remove_title' : 'secmail.s2_save_title')}
        confirmLabel={t(confirm?.email === null ? 'secmail.remove' : 'secmail.save')}
        danger={confirm?.email === null}
        onClose={() => setConfirm(null)}
        onConfirm={save}
      >
        <p style={{ margin: 0 }}>
          {t(confirm?.email === null ? 'secmail.s2_remove_body' : 'secmail.s2_save_body')}
        </p>
        {confirm?.email ? (
          <p className="mono" style={{ margin: '6px 0 0' }}>
            {confirm.email}
          </p>
        ) : null}
      </StrongReauthDialog>
    </section>
  );
}
