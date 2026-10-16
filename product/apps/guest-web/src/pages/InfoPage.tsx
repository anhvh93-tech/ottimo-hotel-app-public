import { Icon } from '@ottimo/ui';
import type { GuestStay } from '../app/api';
import { useT } from '../app/i18n';
import { safeMapUrl, telHref } from '../app/link';

/** EP14 2.1 – tab "Thông tin": address, directions, phone, house rules + penalties (plain text). */
export function InfoPage({ stay }: { stay: GuestStay }) {
  const { t } = useT();
  const map = safeMapUrl(stay.property.mapUrl);
  const tel = telHref(stay.property.phone);
  return (
    <div className="m-body gw-stack">
      <h2 className="gw-page-title" tabIndex={-1} data-autofocus>
        {stay.property.name ?? 'OTTIMO'}
      </h2>
      {stay.property.address ? <p className="gw-pre">{stay.property.address}</p> : null}
      <div className="gw-actions">
        {map ? (
          <a className="btn" href={map} target="_blank" rel="noopener noreferrer">
            <Icon name="globe" />
            {t('gw.directions')}
          </a>
        ) : null}
        {tel ? (
          <a className="btn" href={tel}>
            {t('guest.contact.call')}
          </a>
        ) : null}
      </div>
      <section className="card" aria-labelledby="gw-rules-h">
        <h3 id="gw-rules-h">{t('gw.house_rules')}</h3>
        {/* Server-rendered text in the session language; rendered as text, never HTML (SR-INP-04). */}
        <p className="gw-pre mt-8">{stay.houseRules ?? ''}</p>
        <p className="li-s">{t('gw.rules_source')}</p>
      </section>
    </div>
  );
}
