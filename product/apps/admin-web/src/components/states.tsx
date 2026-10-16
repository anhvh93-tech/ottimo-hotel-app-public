import { useI18n } from '@ottimo/i18n';
import { Button, Skeleton, StateView } from '@ottimo/ui';
import { Link } from 'react-router-dom';
import { problemView } from '../app/problem';
import { homePath } from '../session/nav';
import { useSession } from '../session/SessionProvider';
import { useDelayed } from '../hooks/useDelayed';
import { Page, Topbar } from './AppShell';

/** H02 2.3 – route outside `screens` (server would answer 403 FORBIDDEN_ACTION). */
export function NoAccess() {
  const { t } = useI18n();
  const { roles } = useSession();
  return (
    <StateView
      kind="error"
      icon="lock"
      title={t('shell.no_access_title')}
      action={
        <Link className="btn" to={homePath(roles)}>
          {t('shell.go_home')}
        </Link>
      }
    >
      {t('shell.no_access_body')}
    </StateView>
  );
}

export function NoAccessPage({ titleKey = 'nav.me' }: { titleKey?: string }) {
  const { t } = useI18n();
  return (
    <>
      <Topbar title={t(titleKey)} />
      <Page>
        <NoAccess />
      </Page>
    </>
  );
}

/** H02 2.3 – C3 screen on a device the owner has not granted (403 DEVICE_NOT_TRUSTED). */
export function DeviceBlocked() {
  const { t } = useI18n();
  return (
    <StateView kind="error" icon="monitor" title={t('device.blocked_title')}>
      {t('device.blocked_body')}
    </StateView>
  );
}

/** Screens of later sprints: the menu entry exists (role nav is final) but the page is not built yet. */
export function ComingSoonPage({ titleKey }: { titleKey: string }) {
  const { t } = useI18n();
  return (
    <>
      <Topbar title={t(titleKey)} />
      <Page>
        <StateView icon="clock" title={t('shell.coming_title')}>
          {t('shell.coming_body', { screen: t(titleKey) })}
        </StateView>
      </Page>
    </>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  const show = useDelayed(true);
  if (!show) return null;
  return (
    <div className="cards" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={i === 0 ? 36 : 56} />
      ))}
    </div>
  );
}

/** C29 error state with Thử lại + reference code (requestId) for 5xx. */
export function ErrorBlock({
  titleKey,
  error,
  onRetry,
}: {
  titleKey: string;
  error: unknown;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const view = problemView(t, error);
  return (
    <StateView
      kind="error"
      title={t(titleKey)}
      action={<Button onClick={onRetry}>{t('common.retry')}</Button>}
    >
      {view.text}
    </StateView>
  );
}
