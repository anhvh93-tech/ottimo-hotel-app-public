import { Button, Icon } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { deskUrl } from '../app/config';

/**
 * BUG-R3-052 / ARC-RN103-02: the session may only set up 2-step verification (`Me.mfaEnrollmentRequired` /
 * `403 MFA_ENROLLMENT_REQUIRED`) – an owner/manager without 2-step under `MFA_ENFORCED`, or anyone who just
 * signed in with a recovery code (lost phone → set up the authenticator app again). The set-up (QR code,
 * 10 recovery codes) is on OTTIMO Desk, not on the phone that has to scan the code. Every other screen of this
 * app would fail, so the app says so instead of "the connection may be weak", links to Desk and offers sign
 * out (sign in here again once 2-step is on).
 *
 * FB-R4-UXD-MOB-P450-01: the next step (`staff.mfa_enroll_desk` – open Desk on a computer, then sign in here
 * again) is always shown, also where there is no Desk link (localhost, preview). The Desk link is the main
 * action of the screen (`btn pri`, icon `monitor`); sign out stays secondary.
 */
export function EnrollOnDeskPage({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const desk = deskUrl();
  return (
    <main id="main" className="center-page hk">
      <div className="card hk-stack">
        <p className="hk-brand">
          OTTIMO <span className="hk-brand-sub">Staff</span>
        </p>
        <h1 className="m-0">{t('auth.enroll.title')}</h1>
        <p className="m-0">{t('error.MFA_ENROLLMENT_REQUIRED')}</p>
        <p className="li-s m-0">{t('staff.mfa_enroll_desk')}</p>
        {desk ? (
          <a className="btn pri xl block" href={desk} target="_blank" rel="noopener noreferrer">
            <Icon name="monitor" />
            {/* Product name + address: not copy to translate. */}
            <span>OTTIMO Desk · {desk.replace(/^https:\/\//, '').replace(/\/$/, '')}</span>
          </a>
        ) : null}
        <Button className="xl" block onClick={onLogout}>
          {t('shell.logout')}
        </Button>
      </div>
    </main>
  );
}
