import { StateView } from '@ottimo/ui';
import { I18nProvider, useI18n } from '@ottimo/i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ensureCsrf,
  isApiError,
  onUnauthorized,
  sendRequest,
  setCsrfToken,
  staffApi,
  type Me,
  type StaffRequest,
  unreachable,
} from './app/api';
import { HkDataProvider } from './app/data';
import { LiveProvider, type Connect } from './app/live';
import { NotificationsProvider, useInbox } from './app/notifications';
import { useRoute, type Route } from './app/router';
import { sessionFromMe, type StaffSession } from './app/session';
import { OfflineCache } from './data/cache';
import type { KvStore } from './data/store';
import { InspectionPage } from './pages/InspectionPage';
import { LoginPage } from './pages/LoginPage';
import { MePage } from './pages/MePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { QueuePage } from './pages/QueuePage';
import { ReportPage } from './pages/ReportPage';
import { RoomPage } from './pages/RoomPage';
import { RoomsPage } from './pages/RoomsPage';
import { TasksPage } from './pages/TasksPage';
import { WorkOrderPage } from './pages/WorkOrderPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { OfflineQueue } from './queue/queue';
import { QueueProvider, useQueue } from './queue/QueueProvider';
import { BottomNav, ToastDock } from './ui/parts';

type Auth =
  | { kind: 'booting' }
  | { kind: 'login'; expired: boolean }
  | { kind: 'no_role'; me: Me }
  | { kind: 'ready'; session: StaffSession };

const HK_HOME: Route = { name: 'tasks' };
const MT_HOME: Route = { name: 'wo' };
/** Screens that are a tab of the bottom bar; the others keep the tab the person came from (UXR P-27). */
const TABS: readonly Route['name'][] = ['tasks', 'rooms', 'report', 'me', 'wo', 'queue'];

/** OTTIMO Staff – housekeeping / maintenance PWA (ADR-005). No C3, no money, VI/EN. */
export function App({ store, connect }: { store: KvStore; connect?: Connect }) {
  return (
    <I18nProvider defaultLocale="vi">
      <Root store={store} connect={connect} />
    </I18nProvider>
  );
}

function Root({ store, connect }: { store: KvStore; connect?: Connect }) {
  const { t } = useI18n();
  const cache = useMemo(() => new OfflineCache(store), [store]);
  const queue = useMemo(
    () =>
      new OfflineQueue({
        store,
        send: async (req: StaffRequest) => {
          await ensureCsrf();
          return sendRequest(req);
        },
      }),
    [store],
  );
  const [auth, setAuth] = useState<Auth>({ kind: 'booting' });
  // New sign-in after sign-out = fresh toast/queue view state (nothing of the last person lingers).
  const [epoch, setEpoch] = useState(0);
  const userId = useRef<string | undefined>(undefined);

  const enter = useCallback(
    async (me: Me, offline = false) => {
      if (!offline) setCsrfToken(me.csrfToken);
      const switched = (await cache.bindUser(me.id)) === 'switched';
      if (!offline) await cache.saveMe(me);
      // Another person on this phone: their copy and queue are gone (SR-PWA-04) – reload the queue.
      if (switched || userId.current !== me.id) await queue.load();
      userId.current = me.id;
      queue.resume();
      if (!offline) void queue.flush();
      const session = sessionFromMe(me);
      setAuth(session ? { kind: 'ready', session } : { kind: 'no_role', me });
    },
    [cache, queue],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      await queue.load();
      try {
        const me = await staffApi.getMe();
        if (alive) await enter(me);
      } catch (e) {
        if (!alive) return;
        // Offline at start-up (ADR-005 đọc offline): open with the profile cached at the last sign-in; the
        // session cookie is checked again before the first write (ensureCsrf).
        // UXR P-09: a gateway answer (502/503/504 – api down, maintenance) is "no server" too, not a sign-out.
        const cached = unreachable(e) ? await cache.loadMe() : undefined;
        if (cached) {
          await enter(cached, true);
          return;
        }
        setAuth({
          kind: 'login',
          expired: isApiError(e) && e.status === 401 && queue.waiting().length > 0,
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, [enter, queue, cache]);

  useEffect(
    () =>
      onUnauthorized(() => {
        setCsrfToken(undefined);
        setAuth({ kind: 'login', expired: true });
      }),
    [],
  );
  // The queue met a 401 while sending (session ended): sign in again, the items stay on the phone.
  useEffect(
    () =>
      queue.subscribe(() => {
        if (queue.paused === 'auth') {
          setCsrfToken(undefined);
          setAuth((a) => (a.kind === 'ready' ? { kind: 'login', expired: true } : a));
        }
      }),
    [queue],
  );

  const logout = useCallback(async () => {
    try {
      await staffApi.logout();
    } catch {
      /* offline / already ended – the phone is cleared anyway */
    }
    setCsrfToken(undefined);
    await queue.clear();
    await cache.clearAll(); // SR-PWA-04: IndexedDB + Cache Storage
    try {
      const keys = (await globalThis.caches?.keys()) ?? [];
      await Promise.all(keys.map((k) => globalThis.caches.delete(k)));
    } catch {
      /* no Cache Storage */
    }
    userId.current = undefined;
    setEpoch((n) => n + 1);
    window.location.hash = '';
    setAuth({ kind: 'login', expired: false });
  }, [cache, queue]);

  return (
    <QueueProvider key={epoch} queue={queue} queuedText={t('hk.queued_toast')}>
      {auth.kind === 'booting' ? (
        <main id="main" className="center-page hk" aria-busy="true">
          <span className="sr-only">{t('common.loading')}</span>
        </main>
      ) : auth.kind === 'login' ? (
        <LoginGate expired={auth.expired} onSignedIn={(me) => void enter(me)} />
      ) : auth.kind === 'no_role' ? (
        <main id="main" className="center-page hk">
          <div className="card">
            <StateView
              icon="lock"
              title={t('shell.no_access_title')}
              action={
                <button type="button" className="btn xl" onClick={() => void logout()}>
                  {t('shell.logout')}
                </button>
              }
            >
              {t('shell.no_access_body')}
            </StateView>
          </div>
        </main>
      ) : (
        <LiveProvider propertyId={auth.session.propertyId} connect={connect}>
          <NotificationsProvider>
            <Shell session={auth.session} cache={cache} onLogout={logout} />
          </NotificationsProvider>
        </LiveProvider>
      )}
    </QueueProvider>
  );
}

function LoginGate({ expired, onSignedIn }: { expired: boolean; onSignedIn: (me: Me) => void }) {
  const { items } = useQueue();
  // P-09: the sign-in screen says how many actions are still on the phone – every one, also those in their
  // undo window (nothing leaves the phone before sign-in).
  const pending = items.filter((i) => i.kind !== 'attachment' && i.state !== 'rejected').length;
  return <LoginPage expired={expired} pending={pending} onSignedIn={onSignedIn} />;
}

/** Screen readers hear one short sentence when a notification arrives (no focus change). */
function NewNotificationAnnouncer() {
  const { t } = useI18n();
  const inbox = useInbox();
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {inbox && inbox.arrived > 0
        ? `${t('staff.notif.new_announce')}${'\u200b'.repeat(inbox.arrived % 2)}`
        : ''}
    </p>
  );
}

function Shell({
  session,
  cache,
  onLogout,
}: {
  session: StaffSession;
  cache: OfflineCache;
  onLogout: () => Promise<void>;
}) {
  const { t } = useI18n();
  const home = session.mode === 'mt' ? MT_HOME : HK_HOME;
  const route = useRoute(home);
  const mainRef = useRef<HTMLElement>(null);
  const [lastTab, setLastTab] = useState<Route['name']>(
    TABS.includes(route.name) ? route.name : home.name,
  );
  useEffect(() => {
    if (TABS.includes(route.name)) setLastTab(route.name);
  }, [route.name]);
  // A room opened from "Việc của tôi" keeps "Việc" lit, from "Các căn" keeps "Các căn".
  const navCurrent = TABS.includes(route.name) ? route.name : lastTab;
  // a11y: a new screen puts focus on its heading (screen readers announce it); not on first load.
  // Compared with the last route (StrictMode runs mount effects twice in dev).
  const key = JSON.stringify(route);
  const shownKey = useRef(key);
  useEffect(() => {
    if (shownKey.current === key) return;
    shownKey.current = key;
    mainRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    // The screen body scrolls, not the document (styles.css – tab bar never covers a button).
    const body = mainRef.current?.querySelector<HTMLElement>('.m-body');
    if (body) body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [key]);

  let page: JSX.Element;
  switch (route.name) {
    case 'tasks':
      page =
        session.mode === 'mt' ? (
          <WorkOrdersPage session={session} cache={cache} />
        ) : (
          <TasksPage session={session} />
        );
      break;
    case 'rooms':
      page = <RoomsPage />;
      break;
    case 'room':
      page = <RoomPage session={session} roomId={route.roomId} refuse={route.refuse} />;
      break;
    case 'inspect':
      page = <InspectionPage session={session} cache={cache} roomId={route.roomId} />;
      break;
    case 'report':
      page = <ReportPage key={route.roomId ?? 'none'} session={session} roomId={route.roomId} />;
      break;
    case 'queue':
      page = <QueuePage />;
      break;
    case 'me':
      page = <MePage session={session} onLogout={onLogout} />;
      break;
    case 'wo':
      page = <WorkOrdersPage session={session} cache={cache} />;
      break;
    case 'wo_detail':
      page = <WorkOrderPage session={session} id={route.id} />;
      break;
    case 'notifications':
      page = <NotificationsPage session={session} />;
      break;
  }

  return (
    <HkDataProvider session={session} cache={cache}>
      <div className="staff-app touch hk">
        {/* Not href="#main": the hash is the route. */}
        <a
          className="skip"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            mainRef.current?.focus();
          }}
        >
          {t('shell.skip')}
        </a>
        <main id="main" ref={mainRef} className="staff-main" tabIndex={-1}>
          {page}
        </main>
        <ToastDock />
        <NewNotificationAnnouncer />
        <BottomNav mode={session.mode} current={navCurrent} />
      </div>
    </HkDataProvider>
  );
}
