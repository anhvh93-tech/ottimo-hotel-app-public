import { useI18n } from '@ottimo/i18n';
import { StateView } from '@ottimo/ui';
import { Link } from 'react-router-dom';
import { weekdayDate } from '../app/dates';
import { Page, Topbar } from '../components/AppShell';
import { NAV, isVisible } from '../session/nav';
import { useSession } from '../session/SessionProvider';

/**
 * H03 "Hôm nay" – Sprint 1 skeleton. Arrivals/departures, "Cần chú ý" and KPIs come with their APIs
 * (getArrivalsDepartures, listAttentionItems, getTonightKpi – Sprint 3/4); until then the page shows
 * the designed empty state.
 */
export function TodayPage() {
  const { t, locale } = useI18n();
  const session = useSession();
  const tz = session.property?.timezone;
  const rack = NAV.find((n) => n.id === 'rack')!;
  const canRack = isVisible(rack, {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  });
  return (
    <>
      <Topbar
        title={t('today.title')}
        sub={t('shell.subtitle', {
          property: session.property?.name ?? '',
          date: weekdayDate(locale, tz),
        })}
      />
      <Page>
        <StateView
          icon="sparkle"
          title={t('today.empty_title')}
          action={
            canRack ? (
              <Link className="btn" to={rack.path}>
                {t('today.open_rack')}
              </Link>
            ) : undefined
          }
        >
          {t('today.empty_body')}
        </StateView>
      </Page>
    </>
  );
}
