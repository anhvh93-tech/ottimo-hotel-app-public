import type { StrongReauth } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field } from '@ottimo/ui';
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
 * Body of the S2 dialog for a security email write (UXD FB-R4-UXD-FE-EM-07): the address about to be saved
 * first, labelled, so a typo is caught before the password is typed; then one sentence on who is told.
 * Removing has no address line. Used by the own block and by the owner's dialog on Người dùng & vai.
 */
export function EmailConfirmBody({ email, body }: { email: string | null; body: string }) {
  const { t } = useI18n();
  return (
    <>
      {email ? (
        <div>
          <div className="label-h">{t('secmail.new_label')}</div>
          <div className="mono" data-testid="s2-new-email">
            {email}
          </div>
        </div>
      ) : null}
      <p style={{ margin: email ? '12px 0 0' : 0 }}>{body}</p>
    </>
  );
}

/**
 * "Email nhận thông báo bảo mật" (BUG-R3-032, OpenAPI 0.3.10 `setMyEmail`, ARC v1.0.3-contract-email 7):
 * shows `Me.email`, adds / changes / removes it behind S2 (the shared dialog with `SecondFactorField`), one
 * Idempotency-Key per Save. Format and the shared-mailbox rule are checked on the client first and again by
 * the server BEFORE S2, so a refusal there closes the dialog and points at the field. Every role has it (own
 * address); `Me.securityEmailMissing` (owner/manager without one) adds the reminder line. After a save the
 * address shown is the one the server answered (trimmed, lower case) until `Me` is reloaded.
 * The address is shown in JetBrains Mono (`.mono`, DS 13 px); it never goes into the URL, a log or the console.
 * UXD review v1.0.3 (FB-R4-UXD-FE-EM-01..11) applied.
 */
export function SecurityEmailCard() {
  const { t } = useI18n();
  const session = useSession();
  const location = useLocation();
  const { online } = useOnline();
  const meEmail = session.me?.email ?? null;
  /** The server's `{email}` answer – shown until `Me` carries it (refresh may fail). */
  const [answered, setAnswered] = useState<{ email: string | null } | null>(null);
  const current = answered ? answered.email : meEmail;
  const missing = session.me?.securityEmailMissing === true && !current;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  /** Pending S2 confirm: the address to save, or `null` = remove. */
  const [confirm, setConfirm] = useState<{ email: string | null } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const showForm = editing || !current;

  // A reloaded `Me` is the source again.
  useEffect(() => setAnswered(null), [meEmail]);

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

  const save = async (reauth: StrongReauth) => {
    const target = confirm!;
    const before = current;
    let saved: string | null;
    /** `Me` was already reloaded to find out what is stored. */
    let reloaded = false;
    try {
      const { data } = await sendWithOneKey((key) =>
        api.setMyEmail({ email: target.email, reauth }, key),
      );
      saved = data?.email ?? null;
    } catch (err) {
      // Wrong / missing factor (`reauth`, `reauth.totpCode`): the dialog keeps the user inside and marks
      // its own field – never the email field.
      if (isStrongReauthError(err)) throw err;
      const fe = emailFieldError(err);
      if (fe) {
        setConfirm(null);
        setValue(target.email ?? before ?? '');
        setEditing(true);
        setError(emailErrorText(t, fe));
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      // Still 409 IDEMPOTENCY_IN_PROGRESS after the resends, network, 5xx…: the first request may have been
      // saved (ARC FB-R4-ARC-FE-31-03). Reload Me and go by what is really stored; otherwise one sentence
      // inside the dialog as before.
      const me = await session.refresh().catch(() => null);
      if (!me || !sameEmail(me.email, target.email)) throw err;
      saved = me.email ?? null;
      reloaded = true;
    }
    setConfirm(null);
    setEditing(false);
    setValue('');
    setAnswered({ email: saved });
    setNotice({
      tone: 'ok',
      text: t(
        saved === null ? 'secmail.removed' : before ? 'secmail.saved' : 'secmail.saved_first',
      ),
    });
    // Me carries the new address and `securityEmailMissing` (reminder off once an address is on file).
    if (!reloaded) await session.refresh().catch(() => undefined);
    requestAnimationFrame(() => headRef.current?.focus());
  };

  return (
    <section
      id={SECURITY_EMAIL_ANCHOR}
      className="card stack"
      aria-labelledby={`${SECURITY_EMAIL_ANCHOR}-h`}
    >
      <div className="row">
        <h3
          id={`${SECURITY_EMAIL_ANCHOR}-h`}
          ref={headRef}
          tabIndex={-1}
          className="grow"
          style={{ margin: 0 }}
        >
          {t('secmail.title')}
        </h3>
        <Chip tone={current ? 'ok' : 'neutral'} icon={current ? 'check' : 'shield'}>
          {t(current ? 'secmail.status_set' : 'secmail.status_unset')}
        </Chip>
      </div>
      <p className="muted">{t('secmail.lead')}</p>
      {missing ? <Alert tone="warn">{t('secmail.missing')}</Alert> : null}
      {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
      {current && !editing ? (
        <div>
          <div className="label-h">{t('secmail.current')}</div>
          <div className="mono" data-testid="security-email-current">
            {current}
          </div>
          <div className="row wrap" style={{ marginTop: 12 }}>
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
      {!current && !editing && !missing ? <p className="muted">{t('secmail.none')}</p> : null}
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
        <EmailConfirmBody
          email={confirm?.email ?? null}
          body={t(confirm?.email === null ? 'secmail.s2_remove_body' : 'secmail.s2_save_body')}
        />
      </StrongReauthDialog>
    </section>
  );
}
