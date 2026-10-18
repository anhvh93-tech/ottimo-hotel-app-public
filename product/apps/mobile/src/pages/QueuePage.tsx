import { Alert, StateView } from '@ottimo/ui';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { useState } from 'react';
import { asRoom } from '../app/rooms';
import { hhmm } from '../app/time';
import { actionText, rejectionText } from '../queue/messages';
import { useQueue } from '../queue/QueueProvider';
import { waitingActions, type QueueItem } from '../queue/queue';
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
  const { queue, items, waiting, rejected, online, sendNow, dismiss, resend, paused } = useQueue();
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  // Same count as the pill (P-07). The work order of a report is shown once ("Báo sự cố + n ảnh").
  const pending = waitingActions(items);
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

  // One state per row (P-07): the tap time is already the first part of the line.
  const status = (i: QueueItem, index: number) => {
    if (!online) return t('hk.queue.waiting');
    if (i.lastError && BUSY.has(i.lastError)) return t('hk.queue.busy_retry');
    return index === 0
      ? t('hk.queue.sending', { n: 1, total: pending.length })
      : t('hk.queue.in_line');
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
              {pending.map((i, index) => (
                <li key={i.id} className="hk-card">
                  <div className="hd">
                    <span className="room">{i.roomNo}</span>
                    <b className="grow">{actionText(i, t)}</b>
                  </div>
                  <div className="meta">
                    <span>{t('hk.queue.tapped_at', { time: hhmm(i.tappedAt) })}</span>
                    <span>{status(i, index)}</span>
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
              const room = roomLabel(asRoom(i), 'staff');
              const action = actionText(i, t);
              return (
                <Alert
                  key={i.id}
                  tone="bad"
                  title={msg.title}
                  actions={
                    <>
                      {queue.canResend(i) ? (
                        <button
                          type="button"
                          className="btn pri"
                          onClick={() =>
                            void resend(
                              i.id,
                              t('hk.queue.resent_toast', { room, action }),
                              t('hk.undone'),
                            )
                          }
                        >
                          {t('hk.queue.resend', { action })}
                        </button>
                      ) : null}
                      <button type="button" className="btn" onClick={() => void dismiss(i.id)}>
                        {t('hk.queue.ack')}
                      </button>
                    </>
                  }
                >
                  {msg.body}
                  {msg.reference ? (
                    <span className="d-block li-s mt-4">
                      {t('hk.queue.ref_code', { code: msg.reference })}
                    </span>
                  ) : null}
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
