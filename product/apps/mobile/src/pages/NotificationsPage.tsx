import { Button, Icon, Skeleton, StateView, type IconName } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import type { StaffNotification } from '../app/api';
import { notifText, useInbox } from '../app/notifications';
import { navigate, type Route } from '../app/router';
import type { StaffSession } from '../app/session';
import { ddmm, hhmm } from '../app/time';
import { TopBar } from '../ui/parts';

const ICON: Partial<Record<StaffNotification['kind'], IconName>> = {
  work_order_new: 'wrench',
  work_order_high_new: 'alert',
  work_order_block_requested: 'lock',
  work_order_overdue: 'clock',
  hk_task_urgent: 'broom',
  room_awaiting_inspection: 'sparkle',
  hk_task_cancelled: 'x',
  guest_request_new: 'chat',
  guest_request_overdue: 'clock',
};

/** Where a notification leads (refType + refId); nothing for Desk-only topics. */
function target(n: StaffNotification, s: StaffSession): Route | undefined {
  if (n.refType === 'work_order' && n.refId) return { name: 'wo_detail', id: n.refId };
  if (n.refType === 'hk_task' || n.refType === 'guest_request') {
    return s.mode === 'mt' ? { name: 'wo' } : { name: 'tasks' };
  }
  return undefined;
}

/** Hộp thông báo (ADR-005 mục 4, EP07-08 mục 9): kind + room number / work order code only (SR-PWA-06). */
export function NotificationsPage({ session }: { session: StaffSession }) {
  const { t } = useI18n();
  const inbox = useInbox();
  if (!inbox) return null;

  const ref = (n: StaffNotification) =>
    !n.refCode
      ? undefined
      : n.refType === 'hk_task' || n.refType === 'guest_request'
        ? t('hk.room_title', { room: n.refCode })
        : n.refCode;

  return (
    <>
      <TopBar
        title={t('shell.notifications')}
        sub={inbox.unread ? t('staff.notif.unread', { n: inbox.unread }) : undefined}
        back={{ name: session.mode === 'mt' ? 'wo' : 'tasks' }}
      />
      <div className="m-body">
        {inbox.status === 'loading' ? (
          <div aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        ) : inbox.status === 'error' ? (
          <StateView
            kind="error"
            title={t('staff.notif.error_title')}
            action={
              <Button variant="pri" className="xl" onClick={() => void inbox.refresh()}>
                {t('common.retry')}
              </Button>
            }
          >
            {t('hk.error_body')}
          </StateView>
        ) : inbox.items.length === 0 ? (
          <StateView icon="bell" title={t('staff.notif.empty_title')}>
            {t('staff.notif.empty_body')}
          </StateView>
        ) : (
          <ul className="hk-list">
            {inbox.items.map((n) => {
              const to = target(n, session);
              const code = ref(n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`hk-card rowlink hk-notif${n.readAt ? '' : ' unread'}`}
                    onClick={() => {
                      void inbox.markRead(n.id);
                      if (to) navigate(to);
                    }}
                  >
                    <Icon name={ICON[n.kind] ?? 'bell'} />
                    <span className="grow">
                      <b className="d-block">{notifText(n, t)}</b>
                      <span className="meta">
                        {code ? <span className="mono">{code}</span> : null}
                        <span>
                          {ddmm(n.createdAt)} {hhmm(n.createdAt)}
                        </span>
                        {n.readAt ? null : (
                          <span className="sr-only">{t('staff.notif.unread', { n: 1 })}</span>
                        )}
                      </span>
                    </span>
                    {to ? <Icon name="chevron" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
