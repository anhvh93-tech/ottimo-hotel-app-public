import { Alert, Button } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useState, type FormEvent } from 'react';
import { isApiError, staffApi, type Me } from '../app/api';
import { useOnline } from '../app/useOnline';

/** Sign-in of OTTIMO Staff (US-001; same API as Desk). The role decides the screens after sign-in. */
export function LoginPage({
  expired,
  pending,
  onSignedIn,
}: {
  /** Session ended while working – the queue is kept and resumes after sign-in (hi-fi 21.3). */
  expired?: boolean;
  pending?: number;
  onSignedIn: (me: Me) => void;
}) {
  const { t } = useI18n();
  const online = useOnline();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!username.trim() || !password) return;
    if (!online) {
      setError(t('login.offline'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const me = await staffApi.login(username.trim(), password);
      setPassword('');
      onSignedIn(me);
    } catch (err) {
      if (isApiError(err) && err.code === 'RATE_LIMITED') {
        setError(
          t('error.RATE_LIMITED', {
            minutes: Math.max(1, Math.ceil((err.retryAfterSeconds ?? 900) / 60)),
          }),
        );
      } else if (isApiError(err) && err.code === 'MFA_REQUIRED') {
        setError(`${t('error.MFA_REQUIRED')} ${t('auth.mfa_later')}`);
      } else if (isApiError(err) && err.status === 401) {
        setError(t('auth.login.error_generic'));
      } else {
        setError(t('common.error_network_body'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main" className="center-page hk">
      <form className="card hk-stack" onSubmit={(e) => void submit(e)} noValidate>
        <h1 className="hk-brand">
          OTTIMO <span className="hk-brand-sub">Staff</span>
        </h1>
        <p className="li-s m-0">{t('staff.login_sub')}</p>
        {expired ? (
          <Alert tone="warn" title={t('hk.queue.relogin_title')}>
            {pending ? t('hk.queue.relogin_body', { n: pending }) : t('error.UNAUTHENTICATED')}
          </Alert>
        ) : null}
        {!online ? <Alert tone="warn">{t('login.offline')}</Alert> : null}
        <div className="field">
          <label htmlFor="login-user">{t('auth.login.username')}</label>
          <input
            id="login-user"
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            aria-invalid={tried && !username.trim() ? true : undefined}
            onChange={(e) => setUsername(e.target.value)}
          />
          {tried && !username.trim() ? <p className="help err">{t('common.required')}</p> : null}
        </div>
        <div className="field">
          <label htmlFor="login-pass">{t('login.password')}</label>
          <div className="hk-pass">
            <input
              id="login-pass"
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              aria-invalid={tried && !password ? true : undefined}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              aria-pressed={show}
              aria-controls="login-pass"
              onClick={() => setShow((s) => !s)}
            >
              {show ? t('login.hide_password') : t('login.show_password')}
            </button>
          </div>
          {tried && !password ? <p className="help err">{t('common.required')}</p> : null}
        </div>
        {error ? (
          <Alert tone="bad" role="alert">
            {error}
          </Alert>
        ) : null}
        <Button
          type="submit"
          variant="pri"
          block
          className="xl"
          busy={busy}
          busyLabel={t('login.submitting')}
        >
          {t('login.submit')}
        </Button>
        <p className="li-s m-0">{t('login.no_signup')}</p>
      </form>
    </main>
  );
}
