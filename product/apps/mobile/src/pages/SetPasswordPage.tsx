import { Alert, Button, Icon } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { isApiError, staffApi, unreachable, type Me } from '../app/api';
import { useOnline } from '../app/useOnline';
import { normalizeRecoveryCode, normalizeTotp } from './MfaStepPage';

/** SEC minimum for new passwords (OpenAPI `changeMyPassword.newPassword.minLength`, Desk `PASSWORD_MIN`). */
export const PASSWORD_MIN = 10;
const PASSWORD_MAX = 256;

type Errors = Partial<Record<'currentPassword' | 'factor' | 'newPassword' | 'repeat', string>>;
type Banner = { text: string; retry?: boolean } | null;

/** `errors[].code` of `newPassword` (identity `passwordPolicyErrors`) → the sentence Desk shows. */
function newPasswordError(
  t: (k: string, a?: Record<string, string | number>) => string,
  code: string,
) {
  switch (code) {
    case 'PASSWORD_TOO_SHORT':
      return t('field_error.password_short', { min: PASSWORD_MIN });
    case 'PASSWORD_SAME_AS_USERNAME':
      return t('field.PASSWORD_SAME_AS_USERNAME');
    case 'PASSWORD_REUSED':
      return t('field_error.password_reused');
    case 'PASSWORD_TOO_COMMON':
      return t('field.PASSWORD_TOO_COMMON');
    case 'TOO_LONG':
      return t('field_error.too_long', { max: PASSWORD_MAX });
    default:
      return t('field_error.generic');
  }
}

/**
 * BUG-R3-052 – "Đặt mật khẩu của bạn" on the phone (US-001 AC4, Desk H01 1.2 `ChangePasswordPage`): a
 * temporary password (`Me.mustChangePassword`) opens this screen instead of screens that would all fail with
 * `403 PASSWORD_CHANGE_REQUIRED` ("mạng yếu" before). With 2-step on, the change also needs the 6-digit code (S2).
 *
 * Weak network: the fields are kept when the request does not get through ("Try again" sends the same). After
 * the change the session is new (`changeMyPassword` ends every session and sets a new cookie) → `getMe`; if only
 * that read fails, "Try again" repeats the read, not the change.
 */
export function SetPasswordPage({
  me,
  onDone,
  onLogout,
  onExpired,
}: {
  me: Me;
  onDone: (me: Me) => void;
  onLogout: () => void;
  /** The session ended (the change may have gone through with its answer lost) → sign in again. */
  onExpired: () => void;
}) {
  const { t } = useI18n();
  const online = useOnline();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [factor, setFactor] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);
  /** The change went through; only reading the new profile is left. */
  const changed = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const hasMfa = me.mfaEnabled === true;
  const name = me.displayName.trim().toLowerCase();
  const lenOk = next.length >= PASSWORD_MIN;
  const nameOk = next.length > 0 && (!name || !next.toLowerCase().includes(name));

  const focusFirstError = () =>
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );

  const finish = async () => {
    const fresh = await staffApi.getMe(); // new session → new CSRF token
    changed.current = false;
    onDone(fresh);
  };

  const send = async () => {
    if (changed.current) {
      // Only the read of the new profile is left.
    } else {
      const errs: Errors = {};
      if (!current) errs.currentPassword = t('common.required');
      if (!next) errs.newPassword = t('common.required');
      else if (!lenOk) errs.newPassword = t('field_error.password_short', { min: PASSWORD_MIN });
      else if (next === current) errs.newPassword = t('field_error.password_reused');
      if (repeat !== next) errs.repeat = t('pw.mismatch');
      const code = useRecovery ? normalizeRecoveryCode(factor) : normalizeTotp(factor);
      if (hasMfa && !code) errs.factor = t('common.required');
      setErrors(errs);
      if (Object.values(errs).some(Boolean)) {
        focusFirstError();
        return;
      }
    }
    if (!online) {
      setBanner({ text: t('login.offline') });
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      if (!changed.current) {
        const code = useRecovery ? normalizeRecoveryCode(factor) : normalizeTotp(factor);
        await staffApi.changeMyPassword({
          currentPassword: current,
          newPassword: next,
          ...(hasMfa ? (useRecovery ? { recoveryCode: code } : { totpCode: code }) : {}),
        });
        changed.current = true;
        setCurrent('');
        setFactor('');
      }
      await finish();
    } catch (err) {
      if (unreachable(err)) {
        // Fields kept; the same request (or only the read) goes again.
        setBanner({ text: t('common.error_network_body'), retry: true });
        return;
      }
      if (!isApiError(err)) {
        setBanner({ text: t('common.error_generic_body', { request_id: '–' }), retry: true });
        return;
      }
      if (err.code === 'UNAUTHENTICATED') {
        // The change may have gone through with its answer lost (old session ended): sign in again.
        onExpired();
        return;
      }
      setFactor('');
      if (err.code === 'REAUTH_FAILED') {
        if (hasMfa) {
          // One sentence for both factors (SEC 06.20).
          setCurrent('');
          setBanner({ text: t('reauth.s2_failed') });
        } else {
          setErrors({ currentPassword: t('field_error.current_password_wrong') });
          focusFirstError();
        }
      } else if (err.code === 'STRONG_REAUTH_REQUIRED') {
        setErrors({ factor: t('common.required') });
        focusFirstError();
      } else if (err.code === 'VALIDATION_FAILED') {
        const fe = err.fieldErrors.find((f) => f.field.replace(/^body\./, '') === 'newPassword');
        setErrors(fe ? { newPassword: newPasswordError(t, fe.code) } : {});
        if (!fe) setBanner({ text: t('field_error.generic') });
        focusFirstError();
      } else if (err.code === 'RATE_LIMITED') {
        setBanner({
          text: t('error.RATE_LIMITED', {
            minutes: Math.max(1, Math.ceil((err.retryAfterSeconds ?? 900) / 60)),
          }),
        });
      } else {
        setBanner({
          text: t('common.error_generic_body', { request_id: err.requestId ?? '–' }),
          retry: true,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send();
  };

  return (
    <main id="main" className="center-page hk">
      <form
        ref={formRef}
        className="card hk-stack"
        onSubmit={onSubmit}
        noValidate
        aria-labelledby="pw-h"
      >
        <p className="hk-brand">
          OTTIMO <span className="hk-brand-sub">Staff</span>
        </p>
        <h1 id="pw-h" className="m-0">
          {t('pw.title')}
        </h1>
        <p className="li-s m-0">{t('pw.lead')}</p>
        {!online ? <Alert tone="warn">{t('login.offline')}</Alert> : null}
        {banner ? (
          <Alert
            tone="bad"
            role="alert"
            actions={
              banner.retry ? (
                <Button className="xl" onClick={() => void send()} disabled={busy}>
                  {t('common.retry')}
                </Button>
              ) : undefined
            }
          >
            {banner.text}
          </Alert>
        ) : null}
        <PwField id="pw-current" label={t('auth.current_password')} error={errors.currentPassword}>
          {(p) => (
            <input
              {...p}
              className="input"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          )}
        </PwField>
        {hasMfa ? (
          <>
            <PwField
              id="pw-factor"
              label={t(useRecovery ? 'auth.code_label.recovery' : 'auth.code_label.totp')}
              error={errors.factor}
            >
              {(p) => (
                <input
                  {...p}
                  className={useRecovery ? 'input mono' : 'input code-input'}
                  name={useRecovery ? 'recoveryCode' : 'totpCode'}
                  inputMode={useRecovery ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  autoCapitalize={useRecovery ? 'characters' : 'none'}
                  spellCheck={false}
                  maxLength={useRecovery ? 24 : 9}
                  value={factor}
                  onChange={(e) => setFactor(e.target.value)}
                />
              )}
            </PwField>
            <Button
              variant="ghost"
              block
              onClick={() => {
                setUseRecovery((v) => !v);
                setFactor('');
              }}
            >
              {t(useRecovery ? 'mfa.use_totp' : 'auth.totp.recovery')}
            </Button>
          </>
        ) : null}
        <PwField id="pw-new" label={t('pw.new')} error={errors.newPassword} describedBy="pw-rules">
          {(p) => (
            <input
              {...p}
              className="input"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          )}
        </PwField>
        <ul className="rules m-0" id="pw-rules">
          <li className={lenOk ? 'ok' : undefined}>
            <Icon name={lenOk ? 'check' : 'x'} size="sm" />
            <span>{t('pw.rule_len', { n: PASSWORD_MIN })}</span>
          </li>
          <li className={nameOk ? 'ok' : undefined}>
            <Icon name={nameOk ? 'check' : 'x'} size="sm" />
            <span>{t('pw.rule_name')}</span>
          </li>
          <li>
            <Icon name="info" size="sm" />
            <span>{t('pw.rule_common')}</span>
          </li>
        </ul>
        <PwField id="pw-repeat" label={t('pw.repeat')} error={errors.repeat}>
          {(p) => (
            <input
              {...p}
              className="input"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              onBlur={() =>
                setErrors((x) => ({
                  ...x,
                  repeat: repeat && repeat !== next ? t('pw.mismatch') : undefined,
                }))
              }
            />
          )}
        </PwField>
        <Button
          type="submit"
          variant="pri"
          block
          className="xl"
          busy={busy}
          busyLabel={t('common.saving')}
        >
          {t('pw.submit')}
        </Button>
        <Button variant="ghost" block onClick={onLogout} disabled={busy}>
          {t('shell.logout')}
        </Button>
      </form>
    </main>
  );
}

interface InputProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  'aria-required': true;
}

/** Label + input + error line, same markup as the sign-in screen (`.field`, `.help.err`). */
function PwField({
  id,
  label,
  error,
  describedBy,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  describedBy?: string;
  children: (p: InputProps) => ReactNode;
}) {
  const errId = error ? `${id}-err` : undefined;
  const by = [errId, describedBy].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': by,
        'aria-required': true,
      })}
      {error ? (
        <p className="help err" id={errId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
