import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Icon } from '@ottimo/ui';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { fieldErrors, problemView } from '../app/problem';
import { SecondFactorField, secondFactor } from '../components/SecondFactorField';
import { isStrongReauthError } from '../components/StrongReauthDialog';
import { useToast } from '../app/toast';
import { useOnline } from '../hooks/useOnline';
import { useAfterLoginPath } from './LoginPage';
import { useSession } from '../session/SessionProvider';

/** V-10: SEC minimum for new passwords (OpenAPI changeMyPassword.newPassword.minLength). */
export const PASSWORD_MIN = 10;

/** H01 1.2 – change the temporary password (US-001 AC4) or change it voluntarily from the user menu. */
export function ChangePasswordPage() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const afterLogin = useAfterLoginPath();
  const { online } = useOnline();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // S2 (0.3.8, SEC 06.25 – BE-C 8712822): + TOTP / recovery code once 2FA is on.
  const [factor, setFactor] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);

  if (session.status === 'loading') return null;
  if (session.status === 'anonymous') return <Navigate to="/login" replace />;

  const forced = session.mustChangePassword;
  const hasMfa = session.me?.mfaEnabled === true;
  const name = (session.me?.displayName ?? '').trim().toLowerCase();
  const lenOk = next.length >= PASSWORD_MIN;
  const nameOk = next.length > 0 && (!name || !next.toLowerCase().includes(name));

  const checkRepeat = () =>
    setErrors((e) => ({ ...e, repeat: repeat && repeat !== next ? t('pw.mismatch') : '' }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!current) errs.currentPassword = t('common.required');
    if (!next) errs.newPassword = t('common.required');
    else if (!lenOk) errs.newPassword = t('field_error.password_short', { min: PASSWORD_MIN });
    else if (next === current) errs.newPassword = t('field_error.password_reused');
    if (repeat !== next) errs.repeat = t('pw.mismatch');
    const second = secondFactor(factor, useRecovery);
    if (hasMfa && !second.totpCode && !second.recoveryCode) errs.factor = t('common.required');
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    setBanner(null);
    try {
      await session.changePassword({
        currentPassword: current,
        newPassword: next,
        ...(hasMfa ? second : {}),
      });
      toast(t('common.saved'));
      navigate(afterLogin(), { replace: true });
    } catch (err) {
      setFactor('');
      if (isApiError(err) && err.code === 'REAUTH_FAILED') {
        // 0.3.4 Q4: field error, not an expired session (UNAUTHENTICATED is handled globally).
        // With 2FA: one sentence for both factors (SEC 06.20), the current password is emptied too.
        if (hasMfa) {
          setCurrent('');
          setBanner(t('reauth.s2_failed'));
        } else setErrors({ currentPassword: t('field_error.current_password_wrong') });
      } else if (isStrongReauthError(err)) {
        setErrors({ factor: t('common.required') });
      } else if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        setErrors(fieldErrors(t, err, { min: PASSWORD_MIN }));
      } else {
        setBanner(problemView(t, err).text);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-page">
      <form className="card" onSubmit={onSubmit} noValidate aria-labelledby="pw-h">
        <h2 id="pw-h">{forced ? t('pw.title') : t('shell.change_password')}</h2>
        {forced ? <p className="muted">{t('pw.lead')}</p> : null}
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('login.offline')}
          </Alert>
        ) : null}
        {banner ? <Alert tone="bad">{banner}</Alert> : null}
        <Field label={t('auth.current_password')} required error={errors.currentPassword}>
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
        </Field>
        {hasMfa ? (
          <SecondFactorField
            value={factor}
            onChange={setFactor}
            useRecovery={useRecovery}
            error={errors.factor}
            onToggle={() => {
              setUseRecovery((v) => !v);
              setFactor('');
            }}
          />
        ) : null}
        <Field label={t('pw.new')} required error={errors.newPassword}>
          {(p) => (
            <>
              <input
                {...p}
                aria-describedby={[p['aria-describedby'], 'pw-rules'].filter(Boolean).join(' ')}
                className="input"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
              <ul className="rules" id="pw-rules">
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
            </>
          )}
        </Field>
        <Field label={t('pw.repeat')} required error={errors.repeat || undefined}>
          {(p) => (
            <input
              {...p}
              className="input"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              onBlur={checkRepeat}
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
          {t('pw.submit')}
        </Button>
        {!forced ? (
          <Button variant="ghost" block style={{ marginTop: 8 }} onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        ) : (
          <Button
            variant="ghost"
            block
            style={{ marginTop: 8 }}
            onClick={() => void session.logout()}
          >
            {t('shell.logout')}
          </Button>
        )}
      </form>
    </div>
  );
}
