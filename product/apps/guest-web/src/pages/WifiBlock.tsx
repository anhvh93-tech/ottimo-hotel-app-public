import { Button } from '@ottimo/ui';
import { useState } from 'react';
import type { GuestStay } from '../app/api';
import { useT } from '../app/i18n';

/** Today's date at the property (YYYY-MM-DD, Asia/Ho_Chi_Minh). */
const propertyToday = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);

/**
 * US-108 AC2 (R2): Wi-Fi only inside its validity window – the server sends `wifi: null` before.
 * BUG-R3-021: `null` from the arrival day on (or while in house) means the property has no Wi-Fi on file yet –
 * then ask the front desk instead of promising it "on your arrival day".
 */
export function WifiBlock({ stay }: { stay: GuestStay }) {
  const { t, shortDate } = useT();
  const [copied, setCopied] = useState(false);
  const wifi = stay.wifi;
  const arrived = stay.status === 'in_house' || propertyToday() >= stay.arrivalDate;

  const copy = async () => {
    if (!wifi?.password) return;
    try {
      await navigator.clipboard.writeText(wifi.password);
      setCopied(true);
    } catch {
      /* clipboard blocked – the password stays visible to type by hand */
    }
  };

  return (
    <div className="mt-12">
      <dl className="dl">
        <dt>{t('guest.wifi')}</dt>
        {wifi ? (
          <dd>
            {/* G5 (DS 11.2): network name and password in JetBrains Mono 16 px – 0/O and 1/l/I stay apart. */}
            <span className="li-s">{t('gw.wifi_name')}:</span>{' '}
            <span className="gw-code">{wifi.ssid}</span>
            <br />
            <span className="li-s">{t('gw.wifi_pass')}:</span>{' '}
            <span className="gw-code">{wifi.password}</span>
          </dd>
        ) : (
          <dd>
            {arrived
              ? t('gw.wifi_ask_desk')
              : t('gw.wifi_later', { date: shortDate(stay.arrivalDate) })}
          </dd>
        )}
      </dl>
      {wifi?.password ? (
        <Button size="sm" icon="copy" className="mt-8" onClick={() => void copy()}>
          {t('gw.wifi_copy')}
        </Button>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {copied ? t('gw.wifi_copied') : ''}
      </p>
    </div>
  );
}
