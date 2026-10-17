import { useI18n } from '@ottimo/i18n';
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ComingSoonPage, DeviceBlocked, NoAccessPage } from '../components/states';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { DevicesPage } from '../pages/DevicesPage';
import { GuestsPage } from '../pages/GuestsPage';
import { LoginPage } from '../pages/LoginPage';
import { ParamsPage } from '../pages/ParamsPage';
import { RoomsPage } from '../pages/RoomsPage';
import { SelectPropertyPage } from '../pages/SelectPropertyPage';
import { UsersPage } from '../pages/UsersPage';
import { NAV, canOpen, homePath, type NavItem } from '../session/nav';
import { useSession } from '../session/SessionProvider';
import { Page, Topbar } from '../components/AppShell';

// Sprint 2 booking screens are split out of the first bundle (rack/grid, forms, sale flow).
const RackPage = lazy(() =>
  import('../pages/rack/RackPage').then((m) => ({ default: m.RackPage })),
);
const ReservationsPage = lazy(() =>
  import('../pages/reservations/ReservationsPage').then((m) => ({ default: m.ReservationsPage })),
);
const QuotesPage = lazy(() =>
  import('../pages/quotes/QuotesPage').then((m) => ({ default: m.QuotesPage })),
);
// Sprint 3: registration (C3), approvals, money log + reconciliation + refunds.
const RegistrationPage = lazy(() =>
  import('../pages/registration/RegistrationPage').then((m) => ({ default: m.RegistrationPage })),
);
const ApprovalsPage = lazy(() =>
  import('../pages/approvals/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })),
);
const MoneyPage = lazy(() =>
  import('../pages/money/MoneyPage').then((m) => ({ default: m.MoneyPage })),
);
// Sprint 4 (FE-B): H03 Hôm nay (desk home – KPI, arrivals/departures, attention, guest requests) loads with
// its route so the first bundle stays < 500 KB.
const TodayPage = lazy(() => import('../pages/TodayPage').then((m) => ({ default: m.TodayPage })));
// Sprint 4 (FE-B): H24 Tổng quan – owner / manager home.
const OverviewPage = lazy(() =>
  import('../pages/OverviewPage').then((m) => ({ default: m.OverviewPage })),
);
// Sprint 4 (FE-B): S10 buồng phòng, S11 bảo trì + khóa phòng, S13 danh mục minibar.
const HousekeepingPage = lazy(() =>
  import('../pages/ops/HousekeepingPage').then((m) => ({ default: m.HousekeepingPage })),
);
const MaintenancePage = lazy(() =>
  import('../pages/ops/MaintenancePage').then((m) => ({ default: m.MaintenancePage })),
);
const MinibarPage = lazy(() =>
  import('../pages/MinibarPage').then((m) => ({ default: m.MinibarPage })),
);

function Splash() {
  const { t } = useI18n();
  return (
    <div className="center-page" aria-busy="true">
      <p className="muted">{t('common.loading')}</p>
    </div>
  );
}

/** Signed in, password changed, property chosen – otherwise redirect (US-001 AC2, AC4; H01 1.5). */
function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (session.status === 'loading') return <Splash />;
  if (session.status === 'anonymous') {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }
  if (session.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!session.property) return <Navigate to="/select-property" replace />;
  return <>{children}</>;
}

/** Route guard by screen code; the API enforces the same rule with 403 (EP00 0.4). */
function Screen({ item, children }: { item: NavItem; children: ReactNode }) {
  const { t } = useI18n();
  const session = useSession();
  if (
    !canOpen(item, {
      roles: session.roles,
      screens: session.screens,
      deviceTrusted: session.deviceTrusted,
    })
  ) {
    return <NoAccessPage titleKey={item.label} />;
  }
  if (item.needsTrustedDevice && !session.deviceTrusted) {
    return (
      <>
        <Topbar title={t(item.label)} />
        <Page>
          <DeviceBlocked />
        </Page>
      </>
    );
  }
  // Stable hook for E2E selectors by screen code (FB-R2-QA-FE-05); `display: contents` – no layout box.
  return (
    <div className="screen-root" data-screen={item.screen}>
      {children}
    </div>
  );
}

const PAGES: Record<string, () => ReactNode> = {
  today: () => <TodayPage />,
  overview: () => <OverviewPage />,
  housekeeping: () => <HousekeepingPage />,
  maintenance: () => <MaintenancePage />,
  minibar: () => <MinibarPage />,
  guests: () => <GuestsPage />,
  rooms: () => <RoomsPage />,
  params: () => <ParamsPage />,
  users: () => <UsersPage />,
  devices: () => <DevicesPage />,
  rack: () => <RackPage />,
  reservations: () => <ReservationsPage />,
  quotes: () => <QuotesPage />,
  registration: () => <RegistrationPage />,
  approvals: () => <ApprovalsPage />,
  moneylog: () => <MoneyPage />,
};

function Home() {
  const { roles } = useSession();
  return <Navigate to={homePath(roles)} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/select-property" element={<SelectPropertyPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        {NAV.map((item) => (
          <Route
            key={item.id}
            path={`${item.path}/*`}
            element={
              <Screen item={item}>
                <Suspense fallback={<Splash />}>
                  {PAGES[item.id]?.() ?? <ComingSoonPage titleKey={item.label} />}
                </Suspense>
              </Screen>
            }
          />
        ))}
        <Route path="/no-access" element={<NoAccessPage />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
