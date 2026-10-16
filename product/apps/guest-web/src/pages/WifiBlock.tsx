import { Button } from '@ottimo/ui';
import { useState } from 'react';
import type { GuestStay } from '../app/api';
import { useT } from '../app/i18n';

/** US-108 AC2 (R2): Wi-Fi only inside its validity window – the server sends `wifi: null` before. */
export function WifiBlock({ stay }: { stay: GuestStay }) {
  const { t, shortDate } = useT();
  const [copied, setCopied] = useState(false);
  const wifi = stay.wifi;

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
    <div style={{ marginTop: 10 }}>
      <dl className="dl">
        <dt>{t('guest.wifi')}</dt>
        {wifi ? (
          <dd>
            <span className="li-s">{t('gw.wifi_name')}:</span> {wifi.ssid}
            <br />
            <span className="li-s">{t('gw.wifi_pass')}:</span>{' '}
            <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{wifi.password}</span>
          </dd>
        ) : (
          <dd>{t('gw.wifi_later', { date: shortDate(stay.arrivalDate) })}</dd>
        )}
      </dl>
      {wifi?.password ? (
        <Button size="sm" icon="copy" onClick={() => void copy()} style={{ marginTop: 8 }}>
          {t('gw.wifi_copy')}
        </Button>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {copied ? t('gw.wifi_copied') : ''}
      </p>
    </div>
  );
}
