import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field } from '@ottimo/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { problemView } from '../app/problem';
import { useSession } from '../session/SessionProvider';

/** SEC 06.17 / 06.19: the step-2 token lives 5 minutes and dies after 5 wrong codes. */
export const MFA_STEP_MS = 5 * 60_000;
export const MFA_MAX_FAILS = 5;

/** TOTP: digits only (a pasted "123 456" works – C31). Recovery: Crockford base32, separators dropped. */
export function normalizeTotp(raw: string): string {
  return raw.replace(/\D/g, '');
}
export function normalizeRecoveryCode(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * H01 1.3 – sign-in step 2 (US-143 AC2, AC3 a). One input (`one-time-code`), TOTP by default, "Lost your
 * phone?" switches to a recovery code. Every failure is the same sentence (SEC 06.20); after 5 failures or
 * 5 minutes the token is dead, so the screen goes back to the password step by itself.
 * [CHỜ UXD] hi-fi R3 for this screen – layout follows hi-fi 01-login 1.3 (R1).
 */
export function MfaStep({
  mfaToken,
  onBack,
}: {
  mfaToken: string;
  onBack: (note?: string) => void;
}) {
  const { t } = useI18n();
  const session = useSession();
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fails = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const id = setTimeout(() => onBackRef.current(t('mfa.step_expired')), MFA_STEP_MS);
    return () => clearTimeout(id);
  }, [t]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const switchMode = (next: 'totp' | 'recovery') => {
    setMode(next);
    setCode('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = mode === 'totp' ? normalizeTotp(code) : normalizeRecoveryCode(code);
    if (!value) {
      setError(t('common.required'));
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    setBanner(null);
    try {
      await session.loginMfa(
        mode === 'totp' ? { mfaToken, totpCode: value } : { mfaToken, recoveryCode: value },
      );
      // LoginPage re-renders as signed in and routes on.
    } catch (err) {
      setCode('');
      if (isApiError(err) && err.code === 'MFA_INVALID') {
        fails.current += 1;
        if (fails.current >= MFA_MAX_FAILS) {
          onBack(t('mfa.step_expired'));
          return;
        }
        setError(t('error.MFA_INVALID'));
        inputRef.current?.focus();
      } else if (isApiError(err) && err.isNetwork) {
        setBanner(t('login.offline'));
      } else {
        setBanner(problemView(t, err).text);
      }
    } finally {
      setBusy(false);
    }
  };

  const totp = mode === 'totp';
  return (
    <div className="center-page">
      <form className="card" onSubmit={onSubmit} noValidate aria-labelledby="mfa-h">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          OTTIMO<small>BOUTIQUE STAY · DESK</small>
        </div>
        <h2 id="mfa-h">{t(totp ? 'auth.totp.title' : 'mfa.recovery_title')}</h2>
        <p className="muted">{t(totp ? 'auth.totp.help' : 'mfa.recovery_help')}</p>
        {banner ? <Alert tone="bad">{banner}</Alert> : null}
        <Field
          label={t(totp ? 'auth.code_label.totp' : 'auth.code_label.recovery')}
          required
          error={error ?? undefined}
        >
          {(p) => (
            <input
              {...p}
              ref={inputRef}
              name={totp ? 'totpCode' : 'recoveryCode'}
              className={totp ? 'input code-input' : 'input mono'}
              inputMode={totp ? 'numeric' : 'text'}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={totp ? 9 : 24}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          )}
        </Field>
        <div style={{ marginTop: 16 }}>
          <Button type="submit" variant="pri" block busy={busy} busyLabel={t('login.submitting')}>
            {t(totp ? 'auth.totp.submit' : 'mfa.recovery_submit')}
          </Button>
        </div>
        <Button
          variant="ghost"
          block
          style={{ marginTop: 8 }}
          onClick={() => switchMode(totp ? 'recovery' : 'totp')}
        >
          {t(totp ? 'auth.totp.recovery' : 'mfa.use_totp')}
        </Button>
        {!totp ? (
          <p className="muted" style={{ fontSize: '.75rem', margin: '10px 0 0' }}>
            {t('mfa.recovery_after')}
          </p>
        ) : null}
        <Button variant="ghost" block style={{ marginTop: 8 }} onClick={() => onBack()}>
          {t('mfa.back_to_password')}
        </Button>
      </form>
    </div>
  );
}
