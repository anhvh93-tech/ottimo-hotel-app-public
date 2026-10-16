import { useI18n } from '@ottimo/i18n';
import { Chip, Icon, OfflineBar } from '@ottimo/ui';
import { useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { timeHHmm } from '../app/dates';
import { useOnline } from '../hooks/useOnline';
import { NAV, SECTION_LABEL, isVisible, labelFor, type Section } from '../session/nav';
import { useSession } from '../session/SessionProvider';
import { UserMenu } from './UserMenu';

const SECTIONS: Section[] = ['top', 'ops', 'sales', 'admin'];

function isTyping(el: Element | null) {
  return (
    !!el &&
    (el.matches('input,textarea,select,[contenteditable="true"]') ||
      !!el.closest('[role="dialog"],[role="alertdialog"]'))
  );
}

/** H02 Desk shell: sidebar menu built from `screens`, device chip, skip link. */
export function AppShell() {
  const { t } = useI18n();
  const session = useSession();
  const navigate = useNavigate();
  const access = {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  };
  const items = NAV.filter((n) => isVisible(n, access));

  // Shortcut R = room rack (H02 2.1), only when not typing.
  useEffect(() => {
    const rack = items.find((n) => n.kbd === 'R');
    if (!rack) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === 'r' || e.key === 'R') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isTyping(document.activeElement)
      ) {
        navigate(rack.path);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, navigate]);

  return (
    <div className="shell app-shell">
      <a className="skip" href="#main">
        {t('shell.skip')}
      </a>
      <nav className="side" aria-label={t('shell.main_nav')}>
        <div className="brand">
          OTTIMO<small>BOUTIQUE STAY · DESK</small>
        </div>
        <button
          className="prop-switch"
          type="button"
          onClick={() =>
            session.me && session.me.properties.length > 1
              ? navigate('/select-property')
              : undefined
          }
          aria-disabled={!session.me || session.me.properties.length < 2}
        >
          <Icon name="home" />
          <span className="grow">{session.property?.name}</span>
        </button>
        <div className="nav">
          {SECTIONS.map((sec) => {
            const inSec = items.filter((n) => n.section === sec);
            if (inSec.length === 0) return null;
            return (
              <div key={sec} style={{ display: 'contents' }}>
                <div className="sec">{t(SECTION_LABEL[sec])}</div>
                {inSec.map((n) => (
                  <NavLink key={n.id} to={n.path} data-screen={n.screen}>
                    <Icon name={n.icon} />
                    <span>{t(labelFor(n, session.roles))}</span>
                    {n.kbd ? <kbd aria-hidden="true">{n.kbd}</kbd> : null}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
        <div className="side-foot">
          {session.deviceTrusted ? (
            <Chip tone="ok" icon="shield">
              {t('nav.device_trusted')}
            </Chip>
          ) : (
            <Chip tone="warn" icon="monitor">
              {t('nav.device_untrusted')}
            </Chip>
          )}
        </div>
      </nav>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

export interface TopbarProps {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}

/** Page header (title, subtitle, actions, user menu) + offline bar under it. */
export function Topbar({ title, sub, actions }: TopbarProps) {
  const { t } = useI18n();
  const { online, since } = useOnline();
  return (
    <>
      <header className="topbar">
        <h1>
          {title}
          {sub ? <span className="sub">{sub}</span> : null}
        </h1>
        {actions}
        <UserMenu />
      </header>
      {!online ? (
        <OfflineBar>
          {t('shell.offline_readonly', { time: timeHHmm(since ?? new Date()) })}
        </OfflineBar>
      ) : null}
    </>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="page" tabIndex={-1}>
      {children}
    </main>
  );
}
