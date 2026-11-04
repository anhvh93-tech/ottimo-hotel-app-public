import { Alert, Button } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isApiError, staffApi, unreachable, type Me } from '../app/api';
import { useOnline } from '../app/useOnline';

/** SEC 06.17 / 06.19: the step-2 token lives 5 minutes and dies after 5 wrong codes (same as Desk `MfaStep`). */
export const MFA_STEP_MS = 5 * 60_000;
export const MFA_MAX_FAILS = 5;

/** TOTP: digits only (a pasted "123 456" works). Recovery: Crockford base32, separators dropped. */
export function normalizeTotp(raw: string): string {
  return raw.replace(/\D/g, '');
}
export function normalizeRecoveryCode(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}
const TOTP_SHAPE = /^[0-9]{6}$/;
const RECOVERY_SHAPE = /^[0-9A-Z]{16}$/;

type Banner = { text: string; retry?: boolean } | null;

/**
 * ARC-RN103-02 – sign-in step 2 of OTTIMO Staff (US-001, US-143), like Desk `MfaStep`: the 6-digit code of the
 * authenticator app by default, "Lost your phone?" switches to a recovery code. Every wrong answer is the same
 * sentence (SEC 06.20); after 5 wrong codes or 5 minutes the token is dead, so the screen goes back to the
 * password step by itself (clock checked on a deadline – a phone asleep in a pocket does not stretch it).
 *
 * Weak network in a corridor: a request that does not reach the server never empties the code – the person taps
 * "Try again" with the same code. If the first try did reach the server (answer lost on the way back), the
 * session cookie may already be set: the retry asks `getMe` first, so a used one-time token is not counted
 * as a wrong code.
 */
export function MfaStepPage({
  mfaToken,
  onSignedIn,
  onBack,
}: {
  /** One-time token of the `401 MFA_REQUIRED` – React state of the caller only (never storage/URL/log). */
  mfaToken: string;
  onSignedIn: (me: Me) => void;
  /** Back to the password step; `note` = why (expired / too many wrong codes). */
  onBack: (note?: string) => void;
}) {
  const { t } = useI18n();
  const online = useOnline();
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [busy, setBusy] = useState(false);
  const fails = useRef(0);
  const deadline = useRef(Date.now() + MFA_STEP_MS);
  /** The last try met no server answer – it may still have signed in (see above). */
  const answerLost = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const expired = () => Date.now() >= deadline.current;

  useEffect(() => {
    const check = () => {
      if (expired()) onBackRef.current(t('mfa.step_expired'));
    };
    const id = setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [t]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const totp = mode === 'totp';

  const switchMode = () => {
    setMode(totp ? 'recovery' : 'totp');
    setCode('');
    setFieldError(null);
    setBanner(null);
  };

  const send = async () => {
    if (expired()) {
      onBack(t('mfa.step_expired'));
      return;
    }
    const value = totp ? normalizeTotp(code) : normalizeRecoveryCode(code);
    if (!value) {
      setFieldError(t('common.required'));
      inputRef.current?.focus();
      return;
    }
    // A code of the wrong shape is refused here – the server would answer 422 (not counted) anyway.
    if (!(totp ? TOTP_SHAPE : RECOVERY_SHAPE).test(value)) {
      setFieldError(t('error.MFA_INVALID'));
      inputRef.current?.focus();
      return;
    }
    // FB-R4-UXD-MOB-P450-02: the warning above already says so (and the code stays) – no second, red copy.
    if (!online) return;
    setBusy(true);
    setFieldError(null);
    setBanner(null);
    try {
      if (answerLost.current) {
        try {
          const me = await staffApi.getMe();
          answerLost.current = false;
          onSignedIn(me);
          return;
        } catch {
          /* not signed in – send the code again below */
        }
      }
      const me = await staffApi.loginMfa(
        totp ? { mfaToken, totpCode: value } : { mfaToken, recoveryCode: value },
      );
      answerLost.current = false;
      onSignedIn(me);
    } catch (err) {
      if (unreachable(err)) {
        // Keep the code: nothing reached the server, or the answer did not come back.
        answerLost.current = true;
        setBanner({ text: t('common.error_network_body'), retry: true });
        return;
      }
      answerLost.current = false;
      if (isApiError(err) && err.code === 'MFA_INVALID') {
        fails.current += 1;
        setCode('');
        if (fails.current >= MFA_MAX_FAILS) {
          onBack(t('mfa.step_expired'));
          return;
        }
        setFieldError(t('error.MFA_INVALID'));
        inputRef.current?.focus();
      } else if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        setFieldError(t('error.MFA_INVALID'));
      } else if (isApiError(err) && err.code === 'RATE_LIMITED') {
        setBanner({
          text: t('error.RATE_LIMITED', {
            minutes: Math.max(1, Math.ceil((err.retryAfterSeconds ?? 900) / 60)),
          }),
        });
      } else {
        setBanner({
          text: t('common.error_generic_body', {
            request_id: (isApiError(err) && err.requestId) || '–',
          }),
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
      <form className="card hk-stack" onSubmit={onSubmit} noValidate aria-labelledby="mfa-h">
        <p className="hk-brand">
          OTTIMO <span className="hk-brand-sub">Staff</span>
        </p>
        <h1 id="mfa-h" className="m-0">
          {t(totp ? 'auth.totp.title' : 'mfa.recovery_title')}
        </h1>
        <p className="li-s m-0">{t(totp ? 'auth.totp.help' : 'mfa.recovery_help')}</p>
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
        <div className="field">
          <label htmlFor="mfa-code">
            {t(totp ? 'auth.code_label.totp' : 'auth.code_label.recovery')}
          </label>
          <input
            id="mfa-code"
            ref={inputRef}
            name={totp ? 'totpCode' : 'recoveryCode'}
            className={totp ? 'input code-input' : 'input mono'}
            inputMode={totp ? 'numeric' : 'text'}
            // FB-R4-SEC-MOB-P450-03: a recovery code is no SMS code – keep it out of the form history.
            autoComplete={totp ? 'one-time-code' : 'off'}
            autoCapitalize={totp ? 'none' : 'characters'}
            autoCorrect="off"
            spellCheck={false}
            maxLength={totp ? 9 : 24}
            value={code}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? 'mfa-code-err' : undefined}
            onChange={(e) => {
              setCode(e.target.value);
              if (fieldError) setFieldError(null);
            }}
          />
          {fieldError ? (
            <p className="help err" id="mfa-code-err">
              {fieldError}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          variant="pri"
          block
          className="xl"
          busy={busy}
          busyLabel={t('login.submitting')}
        >
          {t(totp ? 'auth.totp.submit' : 'mfa.recovery_submit')}
        </Button>
        <Button variant="ghost" block onClick={switchMode}>
          {t(totp ? 'auth.totp.recovery' : 'mfa.use_totp')}
        </Button>
        {!totp ? <p className="li-s m-0">{t('mfa.recovery_after')}</p> : null}
        <Button variant="ghost" block onClick={() => onBack()}>
          {t('mfa.back_to_password')}
        </Button>
      </form>
    </main>
  );
}
