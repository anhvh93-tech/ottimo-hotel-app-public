import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip } from '@ottimo/ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../app/api';
import { Page, Topbar } from '../components/AppShell';
import { RecoveryCodesPanel } from '../components/RecoveryCodes';
import { ErrorBlock, LoadingBlock } from '../components/states';
import { StrongReauthDialog } from '../components/StrongReauthDialog';
import { useResource } from '../hooks/useResource';
import { useSession } from '../session/SessionProvider';

/** Recovery codes left at or under this → remind to create a new set (SEC 06.15). */
export const RECOVERY_LOW = 3;

/**
 * "Xác thực 2 bước" (SEC 06.35, US-143 AC3): status, recovery codes left, create a new set (S2), turn off
 * for voluntary roles only (S2), the sole-owner reminder (ESC-027 B, AC3 c) and the notice after a sign-in
 * with a recovery code (AC3 a). Opened from the user menu; every role.
 * [CHỜ UXD] hi-fi R3 "Bảo mật của tôi" – built from DS cards/alerts for now.
 */
export function SecurityPage() {
  const { t, dateTime } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const { state, reload } = useResource(() => api.getMy2fa().then((r) => r.data), []);
  const [dialog, setDialog] = useState<'regen' | 'disable' | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  const s = state.data;
  return (
    <>
      <Topbar title={t('shell.security')} />
      <Page>
        <div className="stack" style={{ maxWidth: 640 }}>
          {state.status === 'error' && !s ? (
            <ErrorBlock titleKey="shell.security" error={state.error} onRetry={reload} />
          ) : !s ? (
            <LoadingBlock />
          ) : codes ? (
            <section className="card" aria-labelledby="codes-h">
              <h3 id="codes-h">{t('auth.enroll.step3')}</h3>
              <RecoveryCodesPanel
                codes={codes}
                userLabel={session.me?.displayName ?? ''}
                onDone={() => {
                  setCodes(null);
                  reload();
                  void session.refresh().catch(() => undefined);
                }}
              />
            </section>
          ) : (
            <section className="card stack" aria-labelledby="mfa-status-h">
              <div className="row">
                <h3 id="mfa-status-h" className="grow" style={{ margin: 0 }}>
                  {t('shell.security')}
                </h3>
                <Chip tone={s.enabled ? 'ok' : 'neutral'} icon={s.enabled ? 'check' : 'shield'}>
                  {s.enabled
                    ? s.enrolledAt
                      ? t('mfa.status_on', { date: dateTime(s.enrolledAt) })
                      : t('mfa.status_on_nodate')
                    : t('mfa.status_off')}
                </Chip>
              </div>
              {s.required ? <p className="muted">{t('mfa.required_note')}</p> : null}
              {s.soleOwner ? (
                <Alert tone="info" icon="shield">
                  {t('auth.enroll.single_owner')}
                </Alert>
              ) : null}
              {s.enabled ? (
                <>
                  {typeof s.recoveryCodesRemaining === 'number' ? (
                    s.recoveryCodesRemaining <= RECOVERY_LOW ? (
                      <Alert tone="warn">
                        {t('mfa.codes_low', { n: s.recoveryCodesRemaining })}
                      </Alert>
                    ) : (
                      <p>{t('mfa.codes_left', { n: s.recoveryCodesRemaining })}</p>
                    )
                  ) : null}
                  <div className="row wrap">
                    <Button icon="key" onClick={() => setDialog('regen')}>
                      {t('mfa.regen')}
                    </Button>
                    {!s.required ? (
                      <Button variant="danger" onClick={() => setDialog('disable')}>
                        {t('mfa.disable')}
                      </Button>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  {s.required ? <Alert tone="warn">{t('mfa.nudge')}</Alert> : null}
                  <div>
                    <Link className="btn pri" to="/enroll-2fa">
                      {t('mfa.nudge_cta')}
                    </Link>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
        <StrongReauthDialog
          open={dialog === 'regen'}
          title={t('mfa.regen')}
          confirmLabel={t('mfa.regen')}
          onClose={() => setDialog(null)}
          onConfirm={async (reauth) => {
            const { data } = await api.regenerateMyRecoveryCodes(reauth);
            setDialog(null);
            setCodes(data.recoveryCodes);
          }}
        >
          {t('mfa.regen_note')}
        </StrongReauthDialog>
        <StrongReauthDialog
          open={dialog === 'disable'}
          title={t('mfa.disable')}
          confirmLabel={t('mfa.disable')}
          danger
          onClose={() => setDialog(null)}
          onConfirm={async (reauth) => {
            await api.disableMy2fa(reauth);
            // Every session is revoked, this one too (SEC 06.25).
            await session.logout();
            navigate('/login', { replace: true });
          }}
        >
          {t('mfa.disable_note')}
        </StrongReauthDialog>
      </Page>
    </>
  );
}
