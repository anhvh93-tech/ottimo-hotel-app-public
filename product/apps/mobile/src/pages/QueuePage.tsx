import { Alert, StateView } from '@ottimo/ui';
import { useI18n } from '@ottimo/i18n';
import { useState } from 'react';
import { hhmm } from '../app/time';
import { actionText, rejectionText } from '../queue/messages';
import { useQueue } from '../queue/QueueProvider';
import type { QueueItem } from '../queue/queue';
import { TopBar } from '../ui/parts';

const BUSY = new Set([
  'CONCURRENT_UPDATE',
  'SERVICE_UNAVAILABLE',
  'IDEMPOTENCY_IN_PROGRESS',
  'RATE_LIMITED',
]);

/** H21 21.3 – "Thao tác trên máy": waiting to send / needs review (US-058, ADR-005). Never drops silently. */
export function QueuePage() {
  const { t } = useI18n();
  const { waiting, rejected, online, sendNow, dismiss, paused } = useQueue();
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  // The work order of a report is shown once ("Báo sự cố + n ảnh"); its photos are part of it.
  const pending = waiting.filter((i) => i.kind !== 'attachment');
  const retrying = waiting.find((i) => i.nextAttemptAt && i.lastError);

  const send = async () => {
    setSending(true);
    const before = pending.length;
    const res = await sendNow();
    setSending(false);
    if (res.sent + res.applied > 0 && !res.stopped) {
      setSentInfo(t('hk.queue.sent_all', { n: Math.min(before, res.sent + res.applied) }));
    }
  };

  const status = (i: QueueItem) => {
    if (i.state === 'held') return t('hk.queue.tapped_at', { time: hhmm(i.tappedAt) });
    if (i.lastError && BUSY.has(i.lastError)) return t('hk.queue.busy_retry');
    return online ? t('hk.queue.sending', { n: 1, total: pending.length }) : t('hk.queue.waiting');
  };

  return (
    <>
      <TopBar title={t('hk.queue_title')} back={{ name: 'me' }} />
      <div className="m-body hk-stack">
        {paused ? (
          <Alert tone="warn" title={t('hk.queue.relogin_title')}>
            {t('hk.queue.relogin_body', { n: pending.length })}
          </Alert>
        ) : null}
        {sentInfo ? <Alert tone="ok">{sentInfo}</Alert> : null}
        {retrying && online && retrying.nextAttemptAt ? (
          <Alert
            tone="warn"
            title={t('hk.queue.retry_title')}
            actions={
              <button type="button" className="btn" disabled={sending} onClick={() => void send()}>
                {t('hk.queue.send_now')}
              </button>
            }
          >
            {t('hk.queue.retry_body', { time: hhmm(retrying.nextAttemptAt) })}
          </Alert>
        ) : null}

        {pending.length === 0 && rejected.length === 0 ? (
          <StateView icon="check" title={t('hk.queue.empty_title')}>
            {t('hk.queue.empty_body')}
          </StateView>
        ) : null}

        {pending.length ? (
          <section aria-labelledby="q-pending">
            <h2 className="grp-h" id="q-pending">
              {t('hk.queue.pending', { n: pending.length })}
            </h2>
            <ul className="hk-list">
              {pending.map((i) => (
                <li key={i.id} className="hk-card">
                  <div className="hd">
                    <span className="room">{i.roomNo}</span>
                    <b className="grow">{actionText(i, t)}</b>
                  </div>
                  <div className="meta">
                    <span>{t('hk.queue.tapped_at', { time: hhmm(i.tappedAt) })}</span>
                    <span>{status(i)}</span>
                  </div>
                </li>
              ))}
            </ul>
            {online && !paused ? (
              <button
                type="button"
                className="btn pri xl block mt-8"
                disabled={sending}
                aria-busy={sending || undefined}
                onClick={() => void send()}
              >
                {t('hk.queue.send_now')}
              </button>
            ) : null}
          </section>
        ) : null}

        {rejected.length ? (
          <section aria-labelledby="q-review">
            <h2 className="grp-h" id="q-review">
              {t('hk.queue.review', { n: rejected.length })}
            </h2>
            {rejected.map((i) => {
              const msg = rejectionText(i, t);
              return (
                <Alert
                  key={i.id}
                  tone="bad"
                  title={msg.title}
                  actions={
                    <button type="button" className="btn" onClick={() => void dismiss(i.id)}>
                      {t('hk.queue.ack')}
                    </button>
                  }
                >
                  {msg.body}
                </Alert>
              );
            })}
          </section>
        ) : null}

        {pending.length ? <p className="li-s">{t('hk.queue.keep_note')}</p> : null}
      </div>
    </>
  );
}
