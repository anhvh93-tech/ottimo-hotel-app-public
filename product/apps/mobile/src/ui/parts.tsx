// Shared pieces of the PWA screens – hi-fi H19–H22 markup with the DS classes of hifi.css
// (`.hk` density: text ≥ 16 px, controls ≥ 48 px, primary button 56 px).
import { Icon, type IconName } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useEffect, useState, type ReactNode } from 'react';
import type { RoomStatusCode, Severity, WorkOrderStatus } from '../app/api';
import { deskPhone, telHref } from '../app/config';
import { goBack, href, type Route } from '../app/router';
import type { Mode } from '../app/session';
import { ddmm, hhmm } from '../app/time';
import { useInbox } from '../app/notifications';
import { useQueue } from '../queue/QueueProvider';
import { waitingActions } from '../queue/queue';

type ChipTone = 'ok' | 'warn' | 'bad' | 'oak' | 'ink' | 'neutral';

export function Chip({
  tone,
  icon,
  children,
}: {
  tone: ChipTone;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <span className={`chip ${tone}`}>
      {icon ? <Icon name={icon} size="sm" /> : null}
      <span>{children}</span>
    </span>
  );
}

/** DS 2.3 / tokens.json `status.room` – tone + icon + plain sentence, never the code (DS 9 HK column). */
const ROOM_TONE: Record<RoomStatusCode, { tone: ChipTone; icon: IconName }> = {
  VC: { tone: 'oak', icon: 'sparkle' },
  VI: { tone: 'ok', icon: 'shield' },
  VD: { tone: 'warn', icon: 'broom' },
  CL: { tone: 'oak', icon: 'broom' },
  OC: { tone: 'ink', icon: 'user' },
  OD: { tone: 'warn', icon: 'user' },
  OOO: { tone: 'bad', icon: 'lock' },
};

export function RoomStatusChip({ status }: { status: RoomStatusCode }) {
  const { t } = useI18n();
  const s = ROOM_TONE[status];
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {t(`hk.status.${status}`)}
    </Chip>
  );
}

/** EP07-08 8.3: shown on a card whose change is still on the phone. */
export function QueuedChip() {
  const { t } = useI18n();
  return (
    <Chip tone="neutral" icon="hourglass">
      {t('hk.chip.queued')}
    </Chip>
  );
}

const SEVERITY: Record<Severity, { tone: ChipTone; icon?: IconName; key: string }> = {
  high: { tone: 'bad', icon: 'alert', key: 'wo.sev.high' },
  medium: { tone: 'warn', icon: 'clock', key: 'wo.sev.medium' },
  low: { tone: 'neutral', key: 'wo.sev.low' },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const { t } = useI18n();
  const s = SEVERITY[severity];
  return (
    <Chip tone={s.tone} icon={s.icon}>
      {t(s.key)}
    </Chip>
  );
}

export function WoStatusChip({ status }: { status: WorkOrderStatus }) {
  const { t } = useI18n();
  return status === 'in_progress' ? (
    <Chip tone="ink" icon="wrench">
      {t('wo.status.in_progress')}
    </Chip>
  ) : status === 'done' ? (
    <Chip tone="ok" icon="check">
      {t('wo.status.done')}
    </Chip>
  ) : (
    <Chip tone="neutral">{t(`wo.status.${status}`)}</Chip>
  );
}

/** Big room number + room name under it (DS 11.3: PWA "401 / The Pine", name 16 px). */
export function RoomNo({
  no,
  name,
  id,
  aria,
}: {
  no: string;
  name?: string | null;
  id?: string;
  /** "Căn 401, The Pine" – read instead of "401The Pine" when the card is labelled by this (DS 11.3). */
  aria?: string;
}) {
  return (
    <span className="hk-roomno" id={id} aria-label={aria}>
      <span className="room">{no}</span>
      {name ? <span className="rm-name">{name}</span> : null}
    </span>
  );
}

export function TopBar({
  title,
  sub,
  back,
  right,
  ownOfflineNote,
}: {
  title: ReactNode;
  sub?: ReactNode;
  back?: Route;
  right?: ReactNode;
  /** The screen says itself what works offline (H21 report) – no second banner on top (UXR P-31). */
  ownOfflineNote?: boolean;
}) {
  const { t } = useI18n();
  return (
    <>
      <header className="m-top">
        {back ? (
          <button
            type="button"
            className="btn icon-btn hk-back"
            aria-label={t('common.back')}
            onClick={() => goBack(back)}
          >
            <Icon name="chevron" />
          </button>
        ) : null}
        <h1 tabIndex={-1} data-autofocus>
          {title}
          {sub ? <span className="sub">{sub}</span> : null}
        </h1>
        {right}
        <Bell />
      </header>
      <NetworkBar hideOffline={ownOfflineNote} />
    </>
  );
}

/** Bell with the unread count (ADR-005 mục 4 – in-app inbox). */
function Bell() {
  const { t } = useI18n();
  const inbox = useInbox();
  if (!inbox) return null;
  const n = inbox.unread;
  return (
    <a
      className="btn icon-btn hk-bell"
      href={href({ name: 'notifications' })}
      aria-label={n ? t('staff.notif.bell', { n }) : t('shell.notifications')}
    >
      <Icon name="bell" />
      {n ? (
        <span className="hk-badge" aria-hidden="true">
          {n > 9 ? '9+' : n}
        </span>
      ) : null}
    </a>
  );
}

/** Offline banner + "n thao tác đang chờ gửi" pill at the top of every screen (DS 6.18). */
export function NetworkBar({ hideOffline }: { hideOffline?: boolean } = {}) {
  const { t } = useI18n();
  const { online, items, rejected, paused } = useQueue();
  // Same count as "Thao tác trên máy" (UXR P-07).
  const n = waitingActions(items).length;
  return (
    <>
      {!online && !hideOffline ? (
        <div className="offline-bar" role="status">
          <Icon name="offline" />
          <span className="grow">{t('hk.offline_bar')}</span>
        </div>
      ) : null}
      {paused ? (
        <div className="offline-bar" role="status">
          <Icon name="lock" />
          <span className="grow">{t('hk.queue.relogin_title')}</span>
        </div>
      ) : null}
      {n > 0 || rejected.length > 0 ? (
        <div className="hk-pills">
          {n > 0 ? (
            <a className="qpill" href={href({ name: 'queue' })}>
              <Icon name="hourglass" />
              <span>{t('hk.queue_pill', { n })}</span>
            </a>
          ) : null}
          {rejected.length > 0 ? (
            <a className="qpill review" href={href({ name: 'queue' })}>
              <Icon name="alert" />
              <span>{t('hk.queue.review', { n: rejected.length })}</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** "Hôm nay 15/10 · cập nhật 10:42" – or "Dữ liệu lúc 10:42" when the screen shows the offline copy. */
export function UpdatedAt({ savedAt, fromCache }: { savedAt?: number; fromCache: boolean }) {
  const { t } = useI18n();
  if (!savedAt || !Number.isFinite(savedAt)) return null;
  if (fromCache) return <>{t('hk.data_as_of', { time: hhmm(savedAt) })}</>;
  return <>{t('hk.updated_at', { date: ddmm(savedAt), time: hhmm(savedAt) })}</>;
}

export function CallDesk({ block }: { block?: boolean }) {
  const { t } = useI18n();
  const tel = telHref(deskPhone());
  if (!tel) return null;
  return (
    <a className={`btn xl${block ? ' block' : ''}`} href={tel}>
      {t('hk.call_desk')}
    </a>
  );
}

export function BottomNav({ mode, current }: { mode: Mode; current: Route['name'] }) {
  const { t } = useI18n();
  const items: { route: Route; icon: IconName; label: string; match: Route['name'][] }[] =
    mode === 'mt'
      ? [
          {
            route: { name: 'wo' },
            icon: 'wrench',
            label: t('nav.work_orders'),
            match: ['wo', 'wo_detail'],
          },
          {
            route: { name: 'rooms' },
            icon: 'rack',
            label: t('nav.rooms_status'),
            match: ['rooms', 'room'],
          },
          {
            route: { name: 'report' },
            icon: 'alert',
            label: t('nav.report_issue'),
            match: ['report'],
          },
          { route: { name: 'me' }, icon: 'user', label: t('nav.me'), match: ['me', 'queue'] },
        ]
      : [
          // P-27: short label – "Việc của tôi" broke into two lines at 360 px.
          { route: { name: 'tasks' }, icon: 'broom', label: t('nav.tasks'), match: ['tasks'] },
          {
            route: { name: 'rooms' },
            icon: 'rack',
            label: t('nav.rooms_status'),
            match: ['rooms', 'room', 'inspect'],
          },
          {
            route: { name: 'report' },
            icon: 'alert',
            label: t('nav.report_issue'),
            match: ['report'],
          },
          { route: { name: 'me' }, icon: 'user', label: t('nav.me'), match: ['me', 'queue'] },
        ];
  return (
    <nav className="m-nav" aria-label={t('shell.main_nav')}>
      {items.map((i) => (
        <a
          key={i.route.name}
          href={href(i.route)}
          aria-current={i.match.includes(current) ? 'page' : undefined}
        >
          <Icon name={i.icon} />
          <span>{i.label}</span>
        </a>
      ))}
    </nav>
  );
}

/** Toast "Căn 202: Đã dọn – chờ kiểm  [Hoàn tác (10)]" – role=status, stops counting on focus (DS 6.18). */
export function ToastDock() {
  const { t } = useI18n();
  const { toast, undo, freeze, release, closeToast } = useQueue();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!toast) return;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [toast]);
  if (!toast) return null;
  if (toast.kind === 'info') {
    return (
      <div className="toast-dock app">
        <div className="toast">
          <Icon name="check" />
          <span className="grow" role="status">
            {toast.text}
          </span>
          <button type="button" className="btn" onClick={closeToast} aria-label={t('common.close')}>
            <Icon name="x" />
          </button>
        </div>
      </div>
    );
  }
  const left =
    toast.frozen !== undefined
      ? Math.ceil(toast.frozen / 1000)
      : Math.max(0, Math.ceil((toast.until - Date.now()) / 1000));
  return (
    <div className="toast-dock app">
      <div className="toast">
        <Icon name="check" />
        {/* Live region = the sentence only: the countdown in the button is not read every second. */}
        <span className="grow" role="status">
          {toast.text}
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => void undo(toast.itemId)}
          onFocus={() => freeze(toast.itemId)}
          onBlur={() => release(toast.itemId)}
        >
          <Icon name="undo" />
          <span>{t('hk.undo_btn', { s: left })}</span>
        </button>
      </div>
    </div>
  );
}
