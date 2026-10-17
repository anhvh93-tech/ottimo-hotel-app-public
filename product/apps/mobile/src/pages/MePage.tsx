import { ConfirmDialog, Icon, Seg } from '@ottimo/ui';
import { useI18n, type Locale } from '@ottimo/i18n';
import { useState } from 'react';
import { href } from '../app/router';
import type { StaffSession } from '../app/session';
import { useQueue } from '../queue/QueueProvider';
import { TopBar } from '../ui/parts';

/** "Tôi": who is signed in, interface language (VI/EN), changes on this phone, sign out (SR-PWA-04). */
export function MePage({
  session,
  onLogout,
}: {
  session: StaffSession;
  onLogout: () => Promise<void>;
}) {
  const { t, locale, setLocale } = useI18n();
  const { waiting, rejected } = useQueue();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = waiting.filter((i) => i.kind !== 'attachment').length;

  const logout = async () => {
    setBusy(true);
    try {
      await onLogout();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar title={t('nav.me')} />
      <div className="m-body hk-stack">
        <div className="card">
          <p className="m-0">
            <b>{session.me.displayName}</b>
          </p>
          <p className="li-s m-0">
            {session.roles.map((r) => t(`role.${r}`)).join(', ')} · {session.propertyName}
          </p>
        </div>
        <div className="field">
          <span className="lbl" id="me-lang">
            {t('shell.language')}
          </span>
          <Seg<Locale>
            labelledBy="me-lang"
            value={locale}
            onChange={setLocale}
            options={[
              { value: 'vi', label: <span lang="vi">{t('staff.lang.vi')}</span> },
              { value: 'en', label: <span lang="en">{t('staff.lang.en')}</span> },
            ]}
          />
        </div>
        <a className="btn xl block" href={href({ name: 'queue' })}>
          <Icon name="hourglass" />
          <span>
            {t('hk.queue_title')}
            {pending ? ` · ${t('hk.queue_pill', { n: pending })}` : ''}
            {rejected.length ? ` · ${t('hk.queue.review', { n: rejected.length })}` : ''}
          </span>
        </a>
        <button
          type="button"
          className="btn xl block"
          onClick={() => (pending ? setConfirm(true) : void logout())}
          disabled={busy}
        >
          <Icon name="out" />
          <span>{t('shell.logout')}</span>
        </button>
      </div>
      {confirm ? (
        <ConfirmDialog
          title={t('shell.logout')}
          body={t('hk.queue_logout_warn', { n: pending })}
          keepLabel={t('common.back')}
          confirmLabel={t('hk.queue.logout_anyway')}
          busy={busy}
          onKeep={() => setConfirm(false)}
          onConfirm={() => void logout()}
        />
      ) : null}
    </>
  );
}
