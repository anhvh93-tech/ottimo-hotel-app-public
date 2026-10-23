import { isApiError, type My2faSetup } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, QrCode } from '@ottimo/ui';
import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../app/api';
import { problemView } from '../app/problem';
import { RecoveryCodesPanel } from '../components/RecoveryCodes';
import { useOnline } from '../hooks/useOnline';
import { useSession } from '../session/SessionProvider';
import { useAfterLoginPath } from './LoginPage';
import { normalizeTotp } from './MfaStep';

type Step = 'install' | 'scan' | 'codes';

/** Setup key of the otpauth URI, in groups of 4 for typing by hand. Empty when the URI has none. */
export function manualKey(uri: string): string {
  try {
    const secret = new URL(uri).searchParams.get('secret') ?? '';
    return (secret.match(/.{1,4}/g) ?? []).join(' ');
  } catch {
    return '';
  }
}

/**
 * H01 1.4 – turn on 2-step verification (US-143 AC1, AC3 a; SEC A.2–A.3). Forced when the session is the
 * restricted one (`Me.mfaEnrollmentRequired`, SEC 06.4 – the API answers 403 to anything else); otherwise
 * opened from "Xác thực 2 bước". Three steps: install the app → password, QR + setup key, first code →
 * 10 recovery codes once. The secret and the codes live only in this component's state.
 * [CHỜ UXD] hi-fi R3 of US-143 – layout follows hi-fi 01-login 1.4 (R1) + brand OTTIMO tokens.
 */
export function Enroll2faPage() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const afterLogin = useAfterLoginPath();
  const { online } = useOnline();
  const [step, setStep] = useState<Step>('install');
  const [password, setPassword] = useState('');
  const [setup, setSetup] = useState<My2faSetup | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [errors, setErrors] = useState<{ password?: string; code?: string }>({});
  const [banner, setBanner] = useState<{ tone: 'bad' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  // Latched at open: confirming ends the restricted mode (refresh), but Finish still returns to the work.
  const wasForced = useRef(false);
  if (session.enrollmentRequired) wasForced.current = true;
  const forced = wasForced.current;
  // ARC 0.3.8 bổ sung 1 (12.3): signed in with a recovery code → restricted session with 2FA still on →
  // re-enroll on the new phone (US-143 AC3 a). Latched like `forced`.
  const wasReenroll = useRef(false);
  if (session.enrollmentRequired && session.me?.mfaEnabled) wasReenroll.current = true;
  const reenroll = wasReenroll.current;

  if (session.status === 'loading') return null;
  if (session.status === 'anonymous') return <Navigate to="/login" replace />;
  // Already on and no fresh codes to show → nothing to do here.
  if (session.me?.mfaEnabled && !codes && !session.enrollmentRequired)
    return <Navigate to="/security" replace />;

  const start = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrors({ password: t('common.required') });
      return;
    }
    setBusy(true);
    setBanner(null);
    setErrors({});
    try {
      const { data } = await api.startMy2faSetup(password);
      setSetup(data);
      setCode('');
      setTimeout(() => codeRef.current?.focus(), 0);
    } catch (err) {
      if (isApiError(err) && err.code === 'REAUTH_FAILED') {
        setErrors({ password: t('field_error.current_password_wrong') });
      } else if (isApiError(err) && err.status === 409) {
        await session.refresh().catch(() => undefined);
        setBanner({ tone: 'info', text: t('mfa.already_on') });
      } else {
        setBanner({ tone: 'bad', text: problemView(t, err).text });
      }
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    const value = normalizeTotp(code);
    if (value.length !== 6) {
      setErrors({ code: t(value ? 'auth.totp.error' : 'common.required') });
      codeRef.current?.focus();
      return;
    }
    setBusy(true);
    setBanner(null);
    setErrors({});
    try {
      const { data } = await api.confirmMy2fa(value);
      setSetup(null);
      setCodes(data.recoveryCodes);
      setStep('codes');
      // New session (SEC 06.10): reload Me for the new CSRF token; the restricted mode is over.
      await session.refresh().catch(() => undefined);
      session.clearAmr();
    } catch (err) {
      setCode('');
      if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        setErrors({ code: t('auth.totp.error') });
        codeRef.current?.focus();
      } else if (isApiError(err) && err.status === 409) {
        // The pending secret expired / was replaced, or 2FA is already on (lost answer).
        const me = await session.refresh().catch(() => null);
        setSetup(null);
        const on = me?.mfaEnabled && !me.mfaEnrollmentRequired;
        setBanner({ tone: 'info', text: t(on ? 'mfa.already_on' : 'mfa.qr_expired') });
      } else {
        setBanner({ tone: 'bad', text: problemView(t, err).text });
      }
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    // Codes leave with the component (unmount) – no copy anywhere else.
    navigate(forced ? afterLogin() : '/security', { replace: true });
  };

  const stepClass = (s: Step) => {
    const order: Step[] = ['install', 'scan', 'codes'];
    return order.indexOf(s) < order.indexOf(step) ? 'done' : undefined;
  };

  return (
    <div className="center-page">
      <div className="card" style={{ maxWidth: 520 }} aria-labelledby="enroll-h" role="region">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          OTTIMO<small>BOUTIQUE STAY · DESK</small>
        </div>
        <ol className="progress-steps">
          {(['install', 'scan', 'codes'] as Step[]).map((s, i) => (
            <li key={s} className={stepClass(s)} aria-current={s === step ? 'step' : undefined}>
              {t(`auth.enroll.step${i + 1}`)}
            </li>
          ))}
        </ol>
        <h2 id="enroll-h">{t(reenroll ? 'mfa.reenroll_title' : 'auth.enroll.title')}</h2>
        {forced ? (
          <Alert tone="info" icon="shield" role="status">
            {t(reenroll ? 'mfa.reenroll_lead' : 'mfa.enroll_required')}
          </Alert>
        ) : null}
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('login.offline')}
          </Alert>
        ) : null}
        {banner ? (
          <Alert tone={banner.tone} role={banner.tone === 'bad' ? 'alert' : 'status'}>
            {banner.text}
            {session.me?.mfaEnabled && !session.enrollmentRequired && !codes ? (
              <div>
                <Link to="/security">{t('shell.security')}</Link>
              </div>
            ) : null}
          </Alert>
        ) : null}

        {step === 'install' ? (
          <>
            <p className="muted">{t('auth.enroll.step1_help')}</p>
            <Button variant="pri" block onClick={() => setStep('scan')}>
              {t('mfa.installed')}
            </Button>
          </>
        ) : null}

        {step === 'scan' && !setup ? (
          <form onSubmit={start} noValidate>
            <p className="muted">{t('mfa.enroll_password')}</p>
            <Field label={t('auth.current_password')} required error={errors.password}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
            <Button
              type="submit"
              variant="pri"
              block
              busy={busy}
              busyLabel={t('common.loading')}
              disabled={!online}
            >
              {t('mfa.enroll_start')}
            </Button>
          </form>
        ) : null}

        {step === 'scan' && setup ? (
          <form onSubmit={confirm} noValidate>
            <p className="muted">{t('auth.enroll.step2_help')}</p>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <QrCode value={setup.otpauthUri} label={t('mfa.qr_label')} size={184} />
              <div className="stack grow">
                <div className="li-s">{t('mfa.manual_key_label')}</div>
                <code className="mono" style={{ wordBreak: 'break-word' }}>
                  {manualKey(setup.otpauthUri)}
                </code>
              </div>
            </div>
            <Field label={t('auth.enroll.confirm')} required error={errors.code}>
              {(p) => (
                <input
                  {...p}
                  ref={codeRef}
                  className="input code-input"
                  name="totpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={9}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              )}
            </Field>
            <Button
              type="submit"
              variant="pri"
              block
              busy={busy}
              busyLabel={t('common.saving')}
              disabled={!online}
            >
              {t('auth.totp.submit')}
            </Button>
          </form>
        ) : null}

        {step === 'codes' && codes ? (
          <>
            <Alert tone="ok" role="status">
              {t('auth.enroll.done')}
            </Alert>
            {session.me?.soleOwner ? (
              <Alert tone="info" icon="shield">
                {t('auth.enroll.single_owner')}
              </Alert>
            ) : null}
            <RecoveryCodesPanel
              codes={codes}
              userLabel={session.me?.displayName ?? ''}
              onDone={finish}
            />
          </>
        ) : null}

        {step !== 'codes' ? (
          forced ? (
            <Button
              variant="ghost"
              block
              style={{ marginTop: 8 }}
              onClick={async () => {
                await session.logout();
                navigate('/login', { replace: true });
              }}
            >
              {t('shell.logout')}
            </Button>
          ) : (
            <Button variant="ghost" block style={{ marginTop: 8 }} onClick={() => navigate(-1)}>
              {t('common.back')}
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
