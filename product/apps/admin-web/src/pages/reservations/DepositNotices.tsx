import type { Reservation } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button } from '@ottimo/ui';
import { useEffect, useState } from 'react';
import { api } from '../../app/api';
import { timeHHmm } from '../../app/dates';
import { usePropertyId, useSession } from '../../session/SessionProvider';

/**
 * BUG-R2-081 / US-086 AC4 (0.3.7 add. 1): in "Xác nhận cọc" (H11) the desk sees what the CTV / sale reported
 * – amount, time of the latest report (`updatedAt`), note, who, and the receipt photo – to check it against
 * the bank statement before B4. Only `open` notices (the one still waiting). The photo is fetched on demand
 * (`getAttachment`, C2 – no trusted device needed), kept as an object URL in memory and revoked on hide/close.
 */
export function DepositNotices({ reservation: r }: { reservation: Reservation }) {
  const { t, money, date } = useI18n();
  const open = (r.depositNotices ?? []).filter((n) => n.status === 'open');
  if (!open.length) return null;
  return (
    <Alert tone="info" icon="bill" title={t('rsv.notice.heading')} role="note">
      {open.map((n) => (
        <NoticeLine key={n.id} n={n} code={r.code} money={money} date={date} />
      ))}
      <div className="li-s">{t('rsv.notice.check')}</div>
    </Alert>
  );
}

type Notice = NonNullable<Reservation['depositNotices']>[number];

function NoticeLine({
  n,
  code,
  money,
  date,
}: {
  n: Notice;
  code: string;
  money: (v: number) => string;
  date: (v: string) => string;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { property } = useSession();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const at = n.updatedAt ?? n.createdAt;
  const when = `${timeHHmm(new Date(at), property?.timezone)} ${date(at.slice(0, 10))}`;
  const show = async () => {
    if (!n.attachmentId) return;
    setBusy(true);
    setFailed(false);
    try {
      const blob = (await api.getAttachment({ propertyId, attachmentId: n.attachmentId })).data;
      setUrl(URL.createObjectURL(blob));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack mt-4">
      <div>
        <b>
          {n.createdByName
            ? t('rsv.notice.line', { who: n.createdByName, amount: money(n.amountVnd), time: when })
            : t('rsv.notice.line_noname', { amount: money(n.amountVnd), time: when })}
        </b>
      </div>
      {n.note ? <div>{t('rsv.notice.note', { note: n.note })}</div> : null}
      {n.attachmentId ? (
        url ? (
          <div className="stack">
            <img className="photo" src={url} alt={t('rsv.notice.photo_alt', { code })} />
            <Button size="sm" onClick={() => setUrl(null)}>
              {t('rsv.notice.photo_hide')}
            </Button>
          </div>
        ) : (
          <Button size="sm" icon="camera" busy={busy} onClick={() => void show()}>
            {t('rsv.notice.photo')}
          </Button>
        )
      ) : (
        <div className="li-s">{t('rsv.notice.no_photo')}</div>
      )}
      {failed ? <div className="li-s">{t('rsv.notice.photo_error')}</div> : null}
    </div>
  );
}
