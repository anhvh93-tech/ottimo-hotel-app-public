import { Icon, OfflineBar } from '@ottimo/ui';
import { useEffect, useRef, useState } from 'react';
import {
  guestApi,
  isApiError,
  type GuestSession,
  type GuestStay,
  type OnlineCheckin,
} from '../app/api';
import { GUEST_LOCALES, isGuestLocale, useT, type GuestLocale } from '../app/i18n';
import { terminalOf } from '../app/problem';
import { useOnline } from '../app/useOnline';
import { CheckinFlow } from '../checkin/CheckinFlow';
import { HomePage } from './HomePage';
import { InfoPage } from './InfoPage';
import { RequestsPage } from './RequestsPage';
import { SkipLink, TopBar } from './TerminalPage';

type View = 'home' | 'requests' | 'info' | 'checkin';

const LANG_KEYS: Record<GuestLocale, string> = {
  vi: 'guest.lang.vi',
  en: 'guest.lang.en',
  ru: 'guest.lang.ru',
};

export interface ShellProps {
  session?: GuestSession;
  stay: GuestStay;
  onLocale: (l: GuestLocale) => void;
  /** `GuestSession.localeChosenByGuest` – false = the server picked it from profile/browser. */
  localeChosen: boolean;
  /** 401 / GUEST_STAY_ENDED / 429 anywhere → whole-page state. */
  onFatal: (e: unknown) => void;
  onReloadStay: () => Promise<void>;
}

function LanguageSelect({
  onChange,
  chosen,
}: {
  onChange: (l: GuestLocale) => void;
  chosen: boolean;
}) {
  const { t, locale } = useT();
  return (
    <>
      <label className="gw-lang">
        <Icon name="globe" />
        <span className="sr-only">{t('guest.lang')}</span>
        <select
          className="lang-select"
          aria-describedby="gw-lang-state"
          value={locale}
          onChange={(e) => isGuestLocale(e.target.value) && onChange(e.target.value)}
        >
          {GUEST_LOCALES.map((l) => (
            <option key={l} value={l} lang={l}>
              {t(LANG_KEYS[l])}
            </option>
          ))}
        </select>
      </label>
      {/* Outside the label (not part of the select's name), read as its description (0.3.7 bổ sung 1 #12). */}
      <span className="sr-only" id="gw-lang-state">
        {chosen ? t('gw.lang_chosen') : t('gw.lang_auto')}
      </span>
    </>
  );
}

export function GuestShell({
  session,
  stay,
  onLocale,
  localeChosen,
  onFatal,
  onReloadStay,
}: ShellProps) {
  const { t } = useT();
  const online = useOnline();
  const [view, setView] = useState<View>('home');
  // Progress of online check-in, for the "done" card on the stay page (H18 18.5). Best effort: if it
  // cannot be read the page simply keeps the "check in online" card.
  const [checkin, setCheckin] = useState<OnlineCheckin>();
  const available = stay.onlineCheckinAvailable;
  useEffect(() => {
    if (!available) return;
    let alive = true;
    guestApi.getCheckin().then(
      (c) => alive && setCheckin(c),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [available]);
  const mainRef = useRef<HTMLElement>(null);
  const shownView = useRef(view);

  // a11y: moving between tabs/flow puts focus on the new page heading (screen readers announce it).
  // Compared with the last view, not a "first run" flag: StrictMode runs mount effects twice in dev.
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    mainRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, [view]);

  const changeLocale = async (next: GuestLocale) => {
    onLocale(next);
    try {
      await guestApi.setLocale(next);
      await onReloadStay(); // houseRules are rendered by the server in the session language
    } catch (e) {
      if (terminalOf(e) || (isApiError(e) && e.code === 'RATE_LIMITED')) onFatal(e);
      // network: the page language already switched locally; the server keeps the old one
    }
  };

  // H23: Lưu trú · Yêu cầu · Thông tin. The bill tab never in R2 (ĐK-6).
  const tabs: { id: Exclude<View, 'checkin'>; label: string; icon: 'home' | 'chat' | 'info' }[] = [
    { id: 'home', label: t('guest.tab.home'), icon: 'home' },
    { id: 'requests', label: t('guest.tab.requests'), icon: 'chat' },
    { id: 'info', label: t('guest.tab.info'), icon: 'info' },
  ];

  return (
    <div className="guest-app touch">
      <SkipLink />
      <TopBar>
        <LanguageSelect onChange={(l) => void changeLocale(l)} chosen={localeChosen} />
      </TopBar>
      {!online ? (
        <OfflineBar>
          {view === 'checkin' ? t('gw.offline_upload') : t('guest.offline_banner')}
        </OfflineBar>
      ) : null}
      <main id="main" ref={mainRef}>
        {view === 'checkin' ? (
          <CheckinFlow
            stay={stay}
            online={online}
            onExit={() => {
              setView('home');
              void onReloadStay();
            }}
            onFatal={onFatal}
            onCheckinChange={setCheckin}
          />
        ) : view === 'info' ? (
          <InfoPage stay={stay} />
        ) : view === 'requests' ? (
          <RequestsPage stay={stay} online={online} onFatal={onFatal} />
        ) : (
          <HomePage
            localeChosen={localeChosen}
            session={session}
            stay={stay}
            checkin={checkin}
            onCheckin={() => setView('checkin')}
            onInfo={() => setView('info')}
          />
        )}
      </main>
      {view !== 'checkin' ? (
        <nav className="m-nav" aria-label={t('gw.nav_label')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={view === tab.id ? 'page' : undefined}
              onClick={() => setView(tab.id)}
            >
              <Icon name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
