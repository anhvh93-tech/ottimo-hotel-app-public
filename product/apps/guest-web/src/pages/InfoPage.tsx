import { Icon } from '@ottimo/ui';
import type { GuestStay } from '../app/api';
import { useT } from '../app/i18n';
import { safeMapUrl, telHref } from '../app/link';
import { WifiBlock } from './WifiBlock';

/**
 * H23 23.3 – tab "Thông tin" (US-108 AC1, AC2 Wi-Fi part): Wi-Fi from the arrival day, standard check-in /
 * check-out times (BR-401), address + "Chỉ đường" (the Google Maps pin INV sent 17/10, stored once in the
 * property settings – P-S4-7; opened only on tap, never embedded), house rules with fees (BR-511, the
 * server's approved text in the session language – US-112 AC3), who to call. No door code in R2 (ĐK-6).
 */
export function InfoPage({ stay }: { stay: GuestStay }) {
  const { t } = useT();
  const map = safeMapUrl(stay.property.mapUrl);
  const tel = telHref(stay.property.phone);
  return (
    <div className="m-body gw-stack">
      <h2 className="gw-page-title" tabIndex={-1} data-autofocus>
        {t('guest.tab.info')}
      </h2>

      <section className="card" aria-labelledby="gw-wifi-h">
        <h3 id="gw-wifi-h" className="sr-only">
          {t('guest.wifi')}
        </h3>
        <WifiBlock stay={stay} />
      </section>

      <section className="card">
        <dl className="dl">
          <dt>{t('gw.checkin')}</dt>
          <dd>{t('guest.stay.checkin_time', { time: stay.checkinTime })}</dd>
          <dt>{t('gw.checkout')}</dt>
          <dd>{t('guest.stay.checkout_time', { time: stay.checkoutTime })}</dd>
        </dl>
      </section>

      <section className="card gw-stack" aria-labelledby="gw-place-h">
        <h3 id="gw-place-h" lang="en">
          {stay.property.name ?? 'OTTIMO'}
        </h3>
        {stay.property.address ? <p className="gw-pre m-0">{stay.property.address}</p> : null}
        {map ? (
          <a className="btn block" href={map} target="_blank" rel="noopener noreferrer">
            <Icon name="globe" />
            {t('gw.directions')}
          </a>
        ) : null}
      </section>

      <section className="card" aria-labelledby="gw-rules-h">
        <h3 id="gw-rules-h">{t('gw.house_rules')}</h3>
        {/* Server-rendered text in the session language; rendered as text, never HTML (SR-INP-04). */}
        <p className="gw-pre mt-8">{stay.houseRules ?? ''}</p>
        <p className="li-s">{t('gw.rules_source')}</p>
      </section>

      <section className="card" aria-labelledby="gw-help-h">
        <h3 id="gw-help-h">{t('guest.contact.title')}</h3>
        <p className="li-s">{t('guest.contact.hours', { from: '07:00', to: '22:00' })}</p>
        {tel ? (
          <a className="btn block mt-8" href={tel}>
            {t('guest.contact.call')}
          </a>
        ) : null}
      </section>
    </div>
  );
}
