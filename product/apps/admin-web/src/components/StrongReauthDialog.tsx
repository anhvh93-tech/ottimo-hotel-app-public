import { isApiError, type StrongReauth } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { problemView } from '../app/problem';
import { SecondFactorField } from './SecondFactorField';
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

/**
 * Which dialog field a `422 STRONG_REAUTH_REQUIRED` points at, if it is one the dialog shows. The name depends on
 * the operation's body (BE ead8ac83, ARC FB-R4-ARC-FE-018-01): `{…, reauth}` bodies answer `reauth` /
 * `reauth.totpCode`; the flat `StrongReauth` bodies (`disableMy2fa`, `regenerateMyRecoveryCodes`) answer
 * `password` / `totpCode`; `changeMyPassword` / `trustCurrentDevice` use `currentPassword`. So after `body.` and
 * `reauth.` are dropped: `reauth` | `password` | `currentPassword` → `password`; `totpCode` | `recoveryCode` →
 * `code` (only when the code field is on screen – a stale `Me.mfaEnabled` falls back to the one-sentence banner).
 */
export function missingFactor(e: unknown, hasMfa: boolean): 'password' | 'code' | null {
  if (!isApiError(e) || e.code !== 'VALIDATION_FAILED') return null;
  const fe = e.fieldErrors.find((f) => f.code === 'STRONG_REAUTH_REQUIRED');
  if (!fe) return null;
  const field = fe.field.replace(/^body\./, '').replace(/^reauth\./, '');
  if (field === 'reauth' || field === 'password' || field === 'currentPassword') return 'password';
  if (hasMfa && (field === 'totpCode' || field === 'recoveryCode')) return 'code';
  return null;
}

export interface StrongReauthDialogProps {
  open: boolean;
  /** Dialog title – the action being confirmed (e.g. "Tạo bộ mã mới"). Defaults to `reauth.s2_title`. */
  title?: ReactNode;
  /** One sentence about what happens (e.g. `mfa.regen_note`). */
  children?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  /**
   * v1.0.4: the caller's own fields inside `children` (e.g. the reason of `resetUser2fa`). Called on every confirm
   * together with the factor check; `false` keeps the dialog open and sends nothing. The caller shows its errors.
   */
  validate?: () => boolean;
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
 * Layout set by UXD (v1.0.3 review, round 2): `children` → factor line (`reauth.s2_help*`) → error banner →
 * password → code, 12 px apart through `.stack`, DS modal `sm` (C15).
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
  validate,
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
    const ownOk = validate ? validate() : true;
    if (next.password || next.code || !ownOk) return;
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
      // 422 STRONG_REAUTH_REQUIRED names the missing factor (`reauth` / `reauth.password` → password,
      // `reauth.totpCode` / `reauth.recoveryCode` → code): mark THAT field (BE-A v1.0.3 6), never another one.
      const missingField = missingFactor(err, hasMfa);
      if (missingField) {
        setErrors({ [missingField]: t('common.required') });
        // Both fields were just cleared: start again from the first one, as after REAUTH_FAILED (UXD EM-14).
        pwRef.current?.focus();
      } else if (isStrongReauthError(err)) {
        setFailed(true);
        // BUG-R4-024: without a code field the sentence speaks of the password only.
        setBanner(t(hasMfa ? 'reauth.s2_failed' : 'reauth.s2_failed_password'));
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
        <p className="muted">{t(hasMfa ? 'reauth.s2_help' : 'reauth.s2_help_password')}</p>
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
          <SecondFactorField
            value={code}
            onChange={setCode}
            useRecovery={useRecovery}
            error={errors.code}
            onToggle={() => {
              setUseRecovery((v) => !v);
              setCode('');
              setErrors({});
            }}
          />
        ) : null}
      </form>
    </Modal>
  );
}
