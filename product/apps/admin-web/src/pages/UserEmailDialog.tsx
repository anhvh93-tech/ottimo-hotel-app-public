import type { StrongReauth, User } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useRef, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import {
  EMAIL_MAX,
  emailErrorText,
  emailFieldError,
  isEmailShape,
  normalizeEmail,
  sameEmail,
} from '../app/email';
import { EmailConfirmBody } from '../components/SecurityEmailCard';
import { isStrongReauthError, StrongReauthDialog } from '../components/StrongReauthDialog';

/**
 * Owner sets / changes / removes the security email of a manager or staff member (OpenAPI 0.3.10
 * `updateUser.email`, ARC v1.0.3-contract-email 3.2): S2 + `If-Match` (`User.version`). Never one's own
 * (422 – `setMyEmail` on Bảo mật tài khoản) nor another owner's (403): the page keeps the button off on those
 * rows and the server refuses anyway. Format / shared mailbox come back to the field, before S2 is spent.
 * [CHỜ UXD] dialog layout (built from DS C15 modal + C3 field for now).
 */
export function UserEmailDialog({
  user,
  onClose,
  onSaved,
  onUnchanged,
  onFail,
}: {
  user: User;
  onClose: () => void;
  /** `first` = the person had no address before (no "old address" notice), `removed` = set to none. */
  onSaved: (u: User, outcome: 'saved' | 'first' | 'removed') => void;
  onUnchanged: () => void;
  /** Anything the dialog has no field for (412 VERSION_CONFLICT, 403, 5xx…) – the page shows it. */
  onFail: (err: unknown) => void;
}) {
  const { t } = useI18n();
  const current = user.email ?? null;
  const [value, setValue] = useState(current ?? '');
  const [error, setError] = useState<string | undefined>();
  const [confirm, setConfirm] = useState<{ email: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail(value);
    if (!email) return setError(t('common.required'));
    if (!isEmailShape(email)) return setError(t('secmail.invalid'));
    setError(undefined);
    if (sameEmail(email, current)) return onUnchanged();
    setConfirm({ email });
  };

  const save = async (reauth: StrongReauth) => {
    const target = confirm!;
    try {
      const { data } = await api.updateUser(user.id, { email: target.email, reauth }, user.version);
      setConfirm(null);
      // The server answers the stored (normalised) address; the outcome follows it and the address before.
      onSaved(data, !data.email ? 'removed' : current ? 'saved' : 'first');
    } catch (err) {
      if (isStrongReauthError(err)) throw err;
      setConfirm(null);
      const fe = emailFieldError(err);
      if (fe) {
        setError(emailErrorText(t, fe));
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      onFail(err);
    }
  };

  return (
    <>
      <Modal
        open={confirm === null}
        size="sm"
        title={t('users.email_title', { name: user.displayName })}
        closeLabel={t('common.close')}
        onClose={onClose}
        initialFocusRef={inputRef}
        footer={
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            {current ? (
              <Button variant="ghost" onClick={() => setConfirm({ email: null })}>
                {t('secmail.remove')}
              </Button>
            ) : null}
            <Button type="submit" form="user-email-form" variant="pri">
              {t('secmail.save')}
            </Button>
          </>
        }
      >
        <form id="user-email-form" className="stack" noValidate onSubmit={submit}>
          <Field
            label={t('secmail.field')}
            required
            help={
              <>
                {/* V5-23 FB-R4-SEC-ARC-EM-13 (copy-v1.0.5 4.16, ND 13): whose account the address is for. */}
                {t('users.email_purpose', { name: user.displayName })} {t('secmail.field_help')}
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
                autoComplete="off"
                spellCheck={false}
                maxLength={EMAIL_MAX}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </Field>
          <Alert tone="info" role="note">
            {t('users.email_body')}
          </Alert>
        </form>
      </Modal>
      <StrongReauthDialog
        open={confirm !== null}
        title={t('users.email_title', { name: user.displayName })}
        confirmLabel={t(confirm?.email === null ? 'secmail.remove' : 'secmail.save')}
        danger={confirm?.email === null}
        onClose={() => setConfirm(null)}
        onConfirm={save}
      >
        <EmailConfirmBody email={confirm?.email ?? null} body={t('users.email_body')} />
      </StrongReauthDialog>
    </>
  );
}
