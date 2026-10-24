import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Icon, Modal, OfflineBar } from '@ottimo/ui';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../app/api';
import { timeHHmm } from '../app/dates';
import { useLiveEvents } from '../app/live';
import { readSession, writeSession } from '../app/storage';
import { useNarrow } from '../hooks/useMedia';
import { useOnline } from '../hooks/useOnline';
import {
  NAV,
  SECTION_LABEL,
  homePath,
  isVisible,
  itemOfPath,
  labelFor,
  mobileBar,
  type NavItem,
  type Section,
} from '../session/nav';
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

/** Menu items this person may see on this device (screens + role cards + trusted device – H02). */
function useMenuItems(): NavItem[] {
  const session = useSession();
  const access = {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  };
  return NAV.filter((n) => isVisible(n, access));
}

type NavCounts = Partial<Record<NonNullable<NavItem['count']>, number>>;
const COUNT_PAGE = 50;
const COUNT_EVENTS = ['website_request.changed'] as const;

/**
 * Menu numbers (hi-fi `.nav a .badge`). `webreq_new` (US-155, v1.0): website requests still `new` = nobody picked
 * them up – the server scopes SAL to unassigned `new` + own, so `status=new` is exactly what the person can pick up.
 * Live on SSE `website_request.changed` (1 s burst), poll + focus fallback; 50 or more shows "50+". Errors → no number.
 */
function useNavCounts(items: NavItem[]): NavCounts {
  const propertyId = useSession().property?.propertyId ?? '';
  const wantWebreq = items.some((n) => n.count === 'webreq_new');
  const [counts, setCounts] = useState<NavCounts>({});
  const load = useCallback(() => {
    if (!wantWebreq || !propertyId) return;
    api.listWebsiteBookingRequests({ propertyId }, { status: ['new'], limit: COUNT_PAGE }).then(
      (out) =>
        setCounts({
          webreq_new: out.data.page.nextCursor ? COUNT_PAGE : out.data.data.length,
        }),
      () => setCounts({}),
    );
  }, [propertyId, wantWebreq]);
  useEffect(load, [load]);
  useLiveEvents(propertyId, load, {
    events: COUNT_EVENTS,
    debounceMs: 1000,
    enabled: wantWebreq && !!propertyId,
  });
  return wantWebreq ? counts : {};
}

/** The number on a menu item; the visual badge is hidden from screen readers, a sentence is read instead. */
function NavCount({ n }: { n?: number }) {
  const { t } = useI18n();
  if (!n) return null;
  const shown = n >= COUNT_PAGE ? `${COUNT_PAGE}+` : String(n);
  return (
    <>
      <span className="badge" aria-hidden="true">
        {shown}
      </span>
      <span className="sr-only">{t('nav.website_requests_new', { n: shown })}</span>
    </>
  );
}

/**
 * H02 Desk shell: sidebar menu built from `screens`, device chip, skip link. At ≤ 860 px (hifi hides the
 * sidebar) the H24 bottom bar + "Thêm" take its place (UXR S4 P-02) – one menu at any width.
 */
export function AppShell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const narrow = useNarrow();
  const items = useMenuItems();
  const counts = useNavCounts(items);

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
    <div className={`shell app-shell${narrow ? ' is-narrow' : ''}`}>
      <a className="skip" href="#main">
        {t('shell.skip')}
      </a>
      {narrow ? null : (
        <nav className="side" aria-label={t('shell.main_nav')}>
          <div className="brand">
            OTTIMO<small>BOUTIQUE STAY · DESK</small>
          </div>
          <PropertySwitch />
          <NavSections items={items} counts={counts} />
          <div className="side-foot">
            <DeviceChip />
          </div>
        </nav>
      )}
      <div className="content">
        <Outlet />
      </div>
      {narrow ? <MobileNav items={items} counts={counts} /> : null}
    </div>
  );
}

function PropertySwitch() {
  const session = useSession();
  const navigate = useNavigate();
  return (
    <button
      className="prop-switch"
      type="button"
      onClick={() =>
        session.me && session.me.properties.length > 1 ? navigate('/select-property') : undefined
      }
      aria-disabled={!session.me || session.me.properties.length < 2}
    >
      <Icon name="home" />
      <span className="grow">{session.property?.name}</span>
    </button>
  );
}

function DeviceChip() {
  const { t } = useI18n();
  const { deviceTrusted } = useSession();
  return deviceTrusted ? (
    <Chip tone="ok" icon="shield">
      {t('nav.device_trusted')}
    </Chip>
  ) : (
    <Chip tone="warn" icon="monitor">
      {t('nav.device_untrusted')}
    </Chip>
  );
}

/** Sidebar sections (and the same list inside "Thêm" on a phone). */
function NavSections({
  items,
  counts = {},
  onPick,
}: {
  items: NavItem[];
  counts?: NavCounts;
  onPick?: () => void;
}) {
  const { t } = useI18n();
  const { roles } = useSession();
  return (
    <div className="nav">
      {SECTIONS.map((sec) => {
        const inSec = items.filter((n) => n.section === sec);
        if (inSec.length === 0) return null;
        return (
          <div key={sec} style={{ display: 'contents' }}>
            <div className="sec">{t(SECTION_LABEL[sec])}</div>
            {inSec.map((n) => (
              <NavLink key={n.id} to={n.path} data-screen={n.screen} onClick={onPick}>
                <Icon name={n.icon} />
                <span>{t(labelFor(n, roles))}</span>
                {n.count ? <NavCount n={counts[n.count]} /> : null}
                {n.kbd && !onPick ? <kbd aria-hidden="true">{n.kbd}</kbd> : null}
              </NavLink>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Phone bottom bar (hi-fi H24 `.m-nav`, ≤ 5 entries – H02 2.2): four screens of the role + "Thêm", a drawer
 * with every other menu item, the property and the device chip (UXR S4 P-02: Nhật ký tiền, Tham số…).
 */
function MobileNav({ items, counts }: { items: NavItem[]; counts: NavCounts }) {
  const { t } = useI18n();
  const { roles } = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { bar, more } = mobileBar(items, roles);
  const inMore = !!itemOfPath(more, pathname);
  return (
    <>
      <nav className="m-nav app-mnav" aria-label={t('shell.main_nav')}>
        {bar.map((n) => (
          <NavLink key={n.id} to={n.path} data-screen={n.screen}>
            <Icon name={n.icon} />
            <span>{t(n.short ?? labelFor(n, roles))}</span>
            {n.count ? <NavCount n={counts[n.count]} /> : null}
          </NavLink>
        ))}
        {more.length ? (
          <button
            type="button"
            className={inMore ? 'is-current' : undefined}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
            <span>{t('nav.more')}</span>
          </button>
        ) : null}
      </nav>
      <Modal
        open={open}
        variant="drawer"
        title={t('nav.more')}
        closeLabel={t('common.close')}
        onClose={() => setOpen(false)}
      >
        <div className="m-more">
          <PropertySwitch />
          <NavSections items={more} counts={counts} onPick={() => setOpen(false)} />
          <div className="mt-8">
            <DeviceChip />
          </div>
        </div>
      </Modal>
    </>
  );
}

export interface TopbarProps {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}

/**
 * Page header (title, subtitle, actions, user menu) + offline bar under it. On a phone a page that is not
 * on the bottom bar gets "Quay lại" (UXR S4 P-02) – back in the app history, or home after a deep link.
 */
export function Topbar({ title, sub, actions }: TopbarProps) {
  const { t } = useI18n();
  const { online, since } = useOnline();
  const narrow = useNarrow();
  const items = useMenuItems();
  const { roles } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const onBar = mobileBar(items, roles).bar.some((n) => n.path === location.pathname);
  const home = homePath(roles);
  const back = narrow && !onBar && location.pathname !== home;
  return (
    <>
      <header className="topbar">
        {back ? (
          <button
            type="button"
            className="btn icon-btn topbar-back"
            aria-label={t('common.back')}
            onClick={() => (location.key !== 'default' ? navigate(-1) : navigate(home))}
          >
            <Icon name="chevron" />
          </button>
        ) : null}
        <h1>
          {title}
          {sub ? <span className="sub">{sub}</span> : null}
        </h1>
        {actions ? <div className="topbar-acts">{actions}</div> : null}
        <UserMenu />
      </header>
      {!online ? (
        <OfflineBar>
          {t('shell.offline_readonly', { time: timeHHmm(since ?? new Date()) })}
        </OfflineBar>
      ) : null}
      <MfaNudge />
    </>
  );
}

const NUDGE_LATER_KEY = 'ottimo.mfaNudgeLater';

/**
 * SEC 06.3 / 06.15: owner/manager without 2FA while `MFA_ENFORCED = false` (`Me.mfaRequiredButMissing`) and
 * accounts with ≤ 3 recovery codes (`Me.recoveryCodesLow`) see a reminder on every screen. "Để sau" hides
 * it for this tab session only (UI flag, wiped at sign-out). Not on the 2FA screen itself.
 * [CHỜ UXD] placement in the R3 hi-fi (hi-fi 01-login 1.4 shows the banner, not where it sits).
 */
function MfaNudge() {
  const { t } = useI18n();
  const { me } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [later, setLater] = useState(() => readSession(NUDGE_LATER_KEY) === '1');
  if (later || location.pathname === '/security') return null;
  const missing = me?.mfaRequiredButMissing === true;
  const low = me?.recoveryCodesLow === true;
  if (!missing && !low) return null;
  return (
    <div style={{ padding: '8px 16px 0' }}>
      <Alert
        tone="warn"
        icon="shield"
        actions={
          <>
            <Button size="sm" onClick={() => navigate(missing ? '/enroll-2fa' : '/security')}>
              {t(missing ? 'mfa.nudge_cta' : 'mfa.regen')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                writeSession(NUDGE_LATER_KEY, '1');
                setLater(true);
              }}
            >
              {t('mfa.nudge_later')}
            </Button>
          </>
        }
      >
        {t(missing ? 'mfa.nudge' : 'mfa.codes_low_short')}
      </Alert>
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="page" tabIndex={-1}>
      {children}
    </main>
  );
}
