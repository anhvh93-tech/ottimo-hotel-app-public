import { isApiError, type StrongReauth } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { problemView } from '../app/problem';
import { normalizeRecoveryCode, normalizeTotp } from '../pages/MfaStep';
import { useSession } from '../session/SessionProvider';

/** The server answered "S2 failed or missing" – the dialog keeps the user inside and says so. */
export function isStrongReauthError(e: unknown): boolean {
  if (!isApiError(e)) return false;
  if (e.code === 'REAUTH_FAILED') return true;
  return (
    e.code === 'VALIDATION_FAILED' &&
    e.fieldErrors.some((f) => f.code === 'STRONG_REAUTH_REQUIRED' || f.field.startsWith('reauth'))
  );
}

export interface StrongReauthDialogProps {
  open: boolean;
  /** Dialog title – the action being confirmed (e.g. "Tạo bộ mã mới"). Defaults to `reauth.s2_title`. */
  title?: ReactNode;
  /** One sentence about what happens (e.g. `mfa.regen_note`). */
  children?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  /**
   * Runs the S2 operation with the factors (OpenAPI 0.3.8 `StrongReauth`, sent inside THAT request – no
   * token, no window). Throw the ApiError: `REAUTH_FAILED` / `STRONG_REAUTH_REQUIRED` stay in the dialog
   * with one sentence; anything else shows the problem text.
   */
  onConfirm: (reauth: StrongReauth) => Promise<void>;
}

/**
 * S2 – shared strong re-authentication dialog (SEC A.5, ARC s1-contracts 1.2): password + current TOTP (or
 * a recovery code). The fields are cleared after every attempt and when the dialog closes; nothing is kept.
 * Account without 2FA (only while `MFA_ENFORCED = false`): password only. A failure never says which
 * factor was wrong (SEC 06.20). Two S2 actions within 30 s need the NEXT code ("Chờ mã mới").
 * [CHỜ UXD] hi-fi R3 of this dialog – built on the DS modal (C15) for now.
 */
export function StrongReauthDialog(props: StrongReauthDialogProps) {
  if (!props.open) return null;
  return <StrongReauthInner {...props} />;
}

function StrongReauthInner({
  title,
  children,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: StrongReauthDialogProps) {
  const { t } = useI18n();
  const { me } = useSession();
  const hasMfa = me?.mfaEnabled === true;
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; code?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setPassword('');
    setCode('');
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = useRecovery ? normalizeRecoveryCode(code) : normalizeTotp(code);
    const next: typeof errors = {};
    if (!password) next.password = t('common.required');
    if (hasMfa && !value) next.code = t('common.required');
    setErrors(next);
    if (next.password || next.code) return;
    const reauth: StrongReauth = { password };
    if (hasMfa) {
      if (useRecovery) reauth.recoveryCode = value;
      else reauth.totpCode = value;
    }
    setBusy(true);
    setBanner(null);
    try {
      await onConfirm(reauth);
      setPassword('');
      setCode('');
    } catch (err) {
      // Never keep the factors after an attempt (each TOTP works once anyway).
      setPassword('');
      setCode('');
      if (isStrongReauthError(err)) {
        setFailed(true);
        setBanner(t('reauth.s2_failed'));
        pwRef.current?.focus();
      } else {
        setBanner(problemView(t, err).text);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={title ?? t('reauth.s2_title')}
      onClose={close}
      closeLabel={t('common.close')}
      size="sm"
      initialFocusRef={pwRef}
      footer={
        <>
          <Button onClick={close}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            form="s2-form"
            variant={danger ? 'danger' : 'pri'}
            busy={busy}
            busyLabel={t('common.saving')}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form id="s2-form" onSubmit={submit} noValidate className="stack">
        {children ? <div>{children}</div> : null}
        <p className="muted" style={{ margin: 0 }}>
          {t(hasMfa ? 'reauth.s2_help' : 'reauth.s2_help_password')}
        </p>
        {banner ? (
          <Alert tone="bad">
            {banner}
            {failed && hasMfa && !useRecovery ? <div>{t('reauth.s2_wait_code')}</div> : null}
          </Alert>
        ) : null}
        <Field label={t('reauth.s2_password_label')} required error={errors.password}>
          {(p) => (
            <input
              {...p}
              ref={pwRef}
              className="input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        {hasMfa ? (
          <>
            <Field
              label={t(useRecovery ? 'auth.code_label.recovery' : 'auth.code_label.totp')}
              required
              error={errors.code}
            >
              {(p) => (
                <input
                  {...p}
                  className={useRecovery ? 'input mono' : 'input code-input'}
                  name={useRecovery ? 'recoveryCode' : 'totpCode'}
                  inputMode={useRecovery ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  spellCheck={false}
                  maxLength={useRecovery ? 24 : 9}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              )}
            </Field>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUseRecovery((v) => !v);
                setCode('');
                setErrors({});
              }}
            >
              {t(useRecovery ? 'mfa.use_totp' : 'auth.totp.recovery')}
            </Button>
          </>
        ) : null}
      </form>
    </Modal>
  );
}
