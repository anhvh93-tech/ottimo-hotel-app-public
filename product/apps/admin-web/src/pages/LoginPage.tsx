import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field } from '@ottimo/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { fieldErrors, problemView } from '../app/problem';
import { useOnline } from '../hooks/useOnline';
import { NAV, canOpen, homePath } from '../session/nav';
import { useSession } from '../session/SessionProvider';

type Banner = {
  tone: 'bad' | 'warn' | 'info';
  title?: string;
  text: string;
  role?: 'alert' | 'status';
  /** 429: text computed from the remaining lock time at render. */
  rateLimited?: boolean;
} | null;

/** Where to go after sign-in: the deep link the user opened if their role may open it (US-001 AC2). */
export function useAfterLoginPath() {
  const location = useLocation();
  const session = useSession();
  return () => {
    const from = (location.state as { from?: string } | null)?.from;
    const access = {
      roles: session.roles,
      screens: session.screens,
      deviceTrusted: session.deviceTrusted,
    };
    const item = from ? NAV.find((n) => from.startsWith(n.path)) : undefined;
    if (from && item && canOpen(item, access)) return from;
    return homePath(session.roles);
  };
}

/** H01 1.1 – staff sign-in. One generic error sentence for wrong name/password (SR-AUTH-04). */
export function LoginPage() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { online } = useOnline();
  const afterLogin = useAfterLoginPath();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<Banner>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const userRef = useRef<HTMLInputElement>(null);

  // 429: lock the button until Retry-After passes (H01 variant).
  // The banner text is derived from `lockedUntil` on every tick, so the minutes count down and the
  // banner disappears when the lock ends (FB-R2-UXD-FE-05).
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        setBanner(null);
      }
      setTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  if (session.status === 'authenticated') {
    if (session.mustChangePassword)
      return <Navigate to="/change-password" replace state={location.state} />;
    if (!session.property) return <Navigate to="/select-property" replace />;
    return <Navigate to={afterLogin()} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim().toLowerCase();
    const next: Record<string, string> = {};
    if (!name) next.username = t('common.required');
    if (!password) next.password = t('common.required');
    setErrors(next);
    if (Object.keys(next).length) {
      setBanner(null);
      userRef.current?.form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await session.login(name, password);
      // Navigation happens on the re-render above.
    } catch (err) {
      setPassword('');
      if (!isApiError(err)) {
        setBanner({ tone: 'bad', text: problemView(t, err).text });
      } else if (err.isNetwork) {
        setBanner({ tone: 'warn', text: t('login.offline') });
      } else if (err.code === 'RATE_LIMITED') {
        setLockedUntil(Date.now() + (err.retryAfterSeconds ?? 900) * 1000);
        setBanner({ tone: 'bad', text: '', rateLimited: true });
      } else if (err.code === 'MFA_REQUIRED') {
        // R3: TOTP step (auth.totp.*). R2 only reserves the place.
        setBanner({
          tone: 'info',
          text: `${t('error.MFA_REQUIRED')} ${t('auth.mfa_later')}`,
          role: 'status',
        });
      } else if (err.code === 'PASSWORD_CHANGE_REQUIRED') {
        await session.refresh().catch(() => undefined);
        navigate('/change-password', { replace: true, state: location.state });
      } else if (err.code === 'DEVICE_NOT_TRUSTED') {
        setBanner({
          tone: 'warn',
          title: t('device.blocked_title'),
          text: t('error.DEVICE_NOT_TRUSTED'),
        });
      } else if (err.code === 'VALIDATION_FAILED') {
        setErrors(fieldErrors(t, err));
      } else if (err.status === 401 || err.status === 403) {
        // Wrong name/password, locked or disabled account: same sentence (SR-AUTH-04).
        setBanner({ tone: 'bad', text: t('auth.login.error_generic') });
      } else {
        setBanner({ tone: 'bad', text: problemView(t, err).text });
      }
    } finally {
      setBusy(false);
    }
  };

  const locked = lockedUntil !== null && Date.now() < lockedUntil;
  const bannerText = banner?.rateLimited
    ? t('error.RATE_LIMITED', {
        minutes: Math.max(1, Math.ceil(((lockedUntil ?? Date.now()) - Date.now()) / 60_000)),
      })
    : banner?.text;

  return (
    <div className="center-page">
      <form className="card" onSubmit={onSubmit} noValidate aria-labelledby="login-h">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          OTTIMO<small>BOUTIQUE STAY · DESK</small>
        </div>
        <h2 id="login-h" style={{ marginBottom: 16 }}>
          {t('login.title')}
        </h2>
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('login.offline')}
          </Alert>
        ) : null}
        {session.expired && !banner ? (
          <Alert tone="info" role="status">
            {t('error.UNAUTHENTICATED')}
          </Alert>
        ) : null}
        {banner ? (
          <Alert tone={banner.tone} title={banner.title} role={banner.role ?? 'alert'}>
            {bannerText}
          </Alert>
        ) : null}
        <Field label={t('auth.login.username')} required error={errors.username}>
          {(p) => (
            <input
              {...p}
              ref={userRef}
              name="username"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('login.password')} required error={errors.password}>
          {(p) => (
            <div className="input-affix">
              <input
                {...p}
                className="input"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn ghost sm"
                style={{ borderRadius: 0 }}
                aria-pressed={showPw}
                onClick={() => setShowPw((v) => !v)}
              >
                {t(showPw ? 'login.hide_password' : 'login.show_password')}
              </button>
            </div>
          )}
        </Field>
        <div style={{ marginTop: 16 }}>
          <Button
            type="submit"
            variant="pri"
            block
            busy={busy}
            busyLabel={t('login.submitting')}
            disabled={locked}
          >
            {t('login.submit')}
          </Button>
        </div>
        <p className="muted" style={{ fontSize: '.75rem', margin: '14px 0 0' }}>
          {t('login.no_signup')}
        </p>
      </form>
    </div>
  );
}
