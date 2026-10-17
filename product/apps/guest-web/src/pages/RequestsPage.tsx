import { Alert, Icon, Skeleton, StateView, type IconName } from '@ottimo/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  guestApi,
  isApiError,
  newIdempotencyKey,
  type GuestRequest,
  type GuestRequestOption,
  type GuestRequestType,
  type GuestStay,
} from '../app/api';
import { clockTime, useT } from '../app/i18n';
import { telHref } from '../app/link';
import { terminalOf } from '../app/problem';

/** The six request types (BR-811) in the order of hi-fi H23 23.2; label keys are literal (guard.test.ts). */
const TYPES: { type: GuestRequestType; key: string; icon: IconName }[] = [
  { type: 'extra_cleaning', key: 'guest.req.clean', icon: 'broom' },
  { type: 'amenities', key: 'guest.req.towels', icon: 'sparkle' },
  { type: 'report_issue', key: 'guest.req.repair', icon: 'wrench' },
  { type: 'transport_tour', key: 'guest.req.transport', icon: 'globe' },
  { type: 'late_checkout', key: 'guest.req.late', icon: 'clock' },
  { type: 'other', key: 'guest.req.other', icon: 'chat' },
];
const TYPE_KEY = Object.fromEntries(TYPES.map((x) => [x.type, x])) as Record<
  GuestRequestType,
  (typeof TYPES)[number]
>;

/** SM-15 labels + DS 2.3 tones (tokens.json `status.guestRequest`). */
const STATUS: Record<GuestRequest['status'], { key: string; tone: string; icon: IconName }> = {
  new: { key: 'guest.req.status.new', tone: 'neutral', icon: 'chat' },
  acknowledged: { key: 'guest.req.status.acknowledged', tone: 'ink', icon: 'bell' },
  in_progress: { key: 'guest.req.status.in_progress', tone: 'ink', icon: 'hourglass' },
  done: { key: 'guest.req.status.done', tone: 'ok', icon: 'check' },
  declined: { key: 'guest.req.status.declined', tone: 'neutral', icon: 'x' },
};

/**
 * Decline reason = the key named after the 0.3.7 code (`guest.req.decline.<code>`, UXD FB-R2-UXD-MOB-S4-01) –
 * the same sentence the front desk picks on the Desk. Literal keys, not a template: the bundle ships only
 * the keys the source names (guard.test.ts).
 */
const DECLINE: Record<NonNullable<GuestRequest['declinedReasonCode']>, string> = {
  not_available_now: 'guest.req.decline.not_available_now',
  outside_service_hours: 'guest.req.decline.outside_service_hours',
  needs_front_desk: 'guest.req.decline.needs_front_desk',
  duplicate: 'guest.req.decline.duplicate',
  other: 'guest.req.decline.other',
};

const UNAVAILABLE: Record<NonNullable<GuestRequestOption['unavailableReason']>, string> = {
  not_in_house: 'gw.req.not_available',
  outside_service_hours: 'guest.req.decline.outside_service_hours',
  paid_limit_reached: 'gw.req.paid_limit',
  not_offered: 'guest.req.decline.not_offered',
};

/** Front desk hours [07:00, 22:00) in the property time zone (BR-811) – the server's auto reply is the truth. */
export function isAfterHours(now = new Date()): boolean {
  const hh = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      hour12: false,
    })
      .format(now)
      .replace('24', '00'),
  );
  return hh < 7 || hh >= 22;
}

const POLL_MS = 30_000;

type ListState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; list: GuestRequest[] };

/**
 * H23 23.1 – tab "Yêu cầu" (US-109): what the guest sent and where it is (SM-15). Refreshes every 30 s
 * while the page is visible (no SSE for guests). Nothing is stored on the phone (ĐK-3) – offline shows
 * what is already on screen, and sending waits for a connection (no queue on the guest page – DS 6.19).
 */
export function RequestsPage({
  stay,
  online,
  onFatal,
}: {
  stay: GuestStay;
  online: boolean;
  onFatal: (e: unknown) => void;
}) {
  const { t } = useT();
  const [state, setState] = useState<ListState>({ kind: 'loading' });
  const [composing, setComposing] = useState(false);
  const [sentNote, setSentNote] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    // StrictMode mounts twice: set it again on every mount.
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await guestApi.listRequests();
      if (alive.current) setState({ kind: 'ready', list });
    } catch (e) {
      if (terminalOf(e)) onFatal(e);
      else if (alive.current) setState((s) => (s.kind === 'ready' ? s : { kind: 'error' }));
    }
  }, [onFatal]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!online || composing) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [online, composing, load]);

  if (composing) {
    return (
      <NewRequest
        stay={stay}
        online={online}
        onFatal={onFatal}
        onCancel={() => setComposing(false)}
        onSent={() => {
          setComposing(false);
          setSentNote(true);
          void load();
        }}
      />
    );
  }

  const tel = telHref(stay.property.phone);
  return (
    <div className="m-body gw-stack">
      <h2 className="gw-page-title" tabIndex={-1} data-autofocus>
        {t('guest.tab.requests')}
      </h2>
      {sentNote ? (
        <p className="sr-only" role="status">
          {t('guest.req.sent')}
        </p>
      ) : null}
      {sentNote ? <Alert tone="ok">{t('guest.req.sent')}</Alert> : null}
      <button
        type="button"
        className="btn pri block"
        aria-disabled={!online || undefined}
        aria-describedby={!online ? 'gw-req-net' : undefined}
        onClick={() => online && (setSentNote(false), setComposing(true))}
      >
        <Icon name="plus" />
        <span>{t('gw.req.new')}</span>
      </button>
      {!online ? (
        <p className="li-s m-0" id="gw-req-net">
          {t('gw.req.need_network')}
        </p>
      ) : null}

      {state.kind === 'loading' ? (
        <div aria-busy="true">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton height={96} />
          <Skeleton height={96} />
        </div>
      ) : state.kind === 'error' ? (
        <StateView
          kind="error"
          title={t('gw.req.error_title')}
          action={
            <div className="gw-actions">
              <button type="button" className="btn" onClick={() => void load()}>
                {t('common.retry')}
              </button>
              {tel ? (
                <a className="btn" href={tel}>
                  {t('guest.contact.call')}
                </a>
              ) : null}
            </div>
          }
        >
          {t('guest.error_body')}
        </StateView>
      ) : state.list.length === 0 ? (
        <StateView icon="chat" title={t('guest.req.empty')}>
          {t('gw.req.empty_body')}
        </StateView>
      ) : (
        <ul className="list gw-req-list">
          {state.list.map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestCard({ r }: { r: GuestRequest }) {
  const { t, money } = useT();
  const type = TYPE_KEY[r.type] ?? TYPE_KEY.other;
  const st = STATUS[r.status] ?? STATUS.new;
  return (
    <li className="card req-card">
      <span className="ic" aria-hidden="true">
        <Icon name={type.icon} />
      </span>
      <div>
        <b className="d-block">{t(type.key)}</b>
        <span className={`chip ${st.tone}`}>
          <Icon name={st.icon} size="sm" />
          <span>{t(st.key)}</span>
        </span>{' '}
        <span className="li-s">{t('gw.req.sent_at', { time: clockTime(r.createdAt) })}</span>
      </div>
      {r.note ? (
        // The guest's own words, shown as typed (plain text, never HTML).
        <p className="full m-0 gw-pre">“{r.note}”</p>
      ) : null}
      {r.feeVnd ? (
        <p className="full m-0 li-s">{t('gw.req.fee_line', { amount: money(r.feeVnd) })}</p>
      ) : null}
      {r.status === 'declined' && r.declinedReasonCode ? (
        <p className="full m-0">
          {t('gw.req.reason')} {t(DECLINE[r.declinedReasonCode])}
        </p>
      ) : null}
      {r.replyNote ? (
        <p className="full m-0 li-s">
          {t('guest.req.staff_note')}: <span lang="vi">“{r.replyNote}”</span>
        </p>
      ) : null}
      {r.autoReply ? <p className="full m-0 li-s gw-pre">{r.autoReply}</p> : null}
    </li>
  );
}

function feeText(
  o: GuestRequestOption,
  t: (k: string, a?: Record<string, string | number>) => string,
  money: (n: number) => string,
): string[] {
  const fee = o.feeVnd ?? 0;
  if (o.type === 'extra_cleaning') {
    if (fee > 0 && o.feeReason === 'second_full_clean') {
      return [
        t('gw.req.clean_second_fee', { time: o.lastFullCleanTime ?? '–', amount: money(fee) }),
        t('gw.req.clean_what'),
      ];
    }
    if (fee > 0 && o.feeReason === 'long_stay_adhoc') {
      return [t('gw.req.clean_long_fee', { amount: money(fee) }), t('gw.req.clean_what_long')];
    }
    if (fee > 0) return [t('gw.req.fee_notice', { amount: money(fee) }), t('gw.req.clean_what')];
    return [t('gw.req.clean_makeup_free')];
  }
  if (fee > 0) return [t('gw.req.fee_notice', { amount: money(fee) })];
  if (o.type === 'amenities') return [t('gw.req.towels_free')];
  if (o.type === 'report_issue') return [t('gw.req.repair_help')];
  if (o.type === 'late_checkout') return [t('gw.req.late_help')];
  return [];
}

/** H23 23.2 – choose a type; a fee is shown on the tile and must be accepted (DS 6.19, ESC-016 A). */
function NewRequest({
  stay,
  online,
  onFatal,
  onCancel,
  onSent,
}: {
  stay: GuestStay;
  online: boolean;
  onFatal: (e: unknown) => void;
  onCancel: () => void;
  onSent: () => void;
}) {
  const { t, money } = useT();
  const [options, setOptions] = useState<GuestRequestOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [type, setType] = useState<GuestRequestType | null>(null);
  const [note, setNote] = useState('');
  const [feeOk, setFeeOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const key = useRef<string>(newIdempotencyKey());
  const headRef = useRef<HTMLHeadingElement>(null);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await guestApi.listRequestOptions());
      setLoadError(false);
    } catch (e) {
      if (terminalOf(e)) onFatal(e);
      else setLoadError(true);
    }
  }, [onFatal]);
  useEffect(() => {
    void loadOptions();
    headRef.current?.focus();
  }, [loadOptions]);

  const option = options?.find((o) => o.type === type);
  const fee = option?.feeVnd ?? 0;
  const noteRequired = Boolean(option?.noteRequired);
  const noteOk = !noteRequired || note.trim().length > 0;
  const blockedBy = !online
    ? t('gw.req.need_network')
    : !option
      ? null
      : fee > 0 && !feeOk
        ? t('field.FEE_NOT_ACCEPTED')
        : null;
  const after = isAfterHours();
  const tel = telHref(stay.property.phone);

  const send = async () => {
    setTried(true);
    if (!option || blockedBy || !noteOk) return;
    setBusy(true);
    setError(null);
    try {
      await guestApi.createRequest(
        {
          type: option.type,
          ...(note.trim() ? { note: note.trim() } : {}),
          ...(fee > 0 ? { feeAccepted: true } : {}),
        },
        key.current,
      );
      onSent();
    } catch (e) {
      if (terminalOf(e)) {
        onFatal(e);
        return;
      }
      key.current = newIdempotencyKey(); // a refused request is a new attempt next time
      if (isApiError(e) && e.code === 'RATE_LIMITED') {
        setError(t('gw.req.too_many', { phone: stay.property.phone ?? '' }));
      } else if (isApiError(e) && e.code === 'VALIDATION_FAILED') {
        const codes = e.fieldErrors.map((f) => f.code);
        if (codes.includes('FEE_NOT_ACCEPTED')) {
          // The fee changed between opening and sending → show the new one, ask again (H23 23.2).
          setFeeOk(false);
          await loadOptions();
          setError(t('field.FEE_NOT_ACCEPTED'));
        } else if (codes.includes('REQUEST_TYPE_NOT_AVAILABLE')) {
          await loadOptions();
          setError(t('field.REQUEST_TYPE_NOT_AVAILABLE'));
        } else if (codes.includes('CARD_NUMBER_DETECTED')) {
          setError(t('gw.req.card_detected'));
        } else {
          setError(t('gw.req.note_required'));
        }
      } else if (isApiError(e) && e.isNetwork) {
        setError(t('gw.req.need_network'));
      } else {
        setError(t('gw.error_server', { request_id: isApiError(e) ? (e.requestId ?? '–') : '–' }));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="m-body gw-stack">
      <div className="gw-flow-head">
        <button
          type="button"
          className="icon-btn gw-back"
          aria-label={t('common.back')}
          onClick={onCancel}
        >
          <Icon name="chevron" />
        </button>
        <h2 className="gw-page-title" tabIndex={-1} ref={headRef}>
          {t('guest.req.title')}
        </h2>
      </div>
      {!options && !loadError ? (
        <div aria-busy="true">
          <span className="sr-only">{t('common.loading')}</span>
          <Skeleton height={96} />
        </div>
      ) : loadError ? (
        <StateView
          kind="error"
          title={t('gw.req.error_title')}
          action={
            <button type="button" className="btn" onClick={() => void loadOptions()}>
              {t('common.retry')}
            </button>
          }
        >
          {t('guest.error_body')}
        </StateView>
      ) : (
        <>
          <div className="req-grid" role="group" aria-label={t('guest.req.title')}>
            {TYPES.map((x) => {
              const o = options!.find((p) => p.type === x.type);
              if (!o) return null;
              const tileFee = o.feeVnd ?? 0;
              return (
                <button
                  key={x.type}
                  type="button"
                  className="req-tile"
                  aria-pressed={type === x.type}
                  aria-disabled={!o.available || undefined}
                  onClick={() => {
                    if (!o.available) return;
                    setType(x.type);
                    setFeeOk(false);
                    setError(null);
                  }}
                >
                  <Icon name={x.icon} />
                  <span>{t(x.key)}</span>
                  {!o.available && o.unavailableReason ? (
                    <span className="fee">{t(UNAVAILABLE[o.unavailableReason])}</span>
                  ) : tileFee > 0 ? (
                    <span className="fee">{t('gw.req.fee_tile', { amount: money(tileFee) })}</span>
                  ) : x.type === 'extra_cleaning' || x.type === 'amenities' ? (
                    <span className="fee">{t('gw.req.free')}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {option ? (
            <div className="card gw-stack" aria-live="polite">
              {feeText(option, t, money).map((line) => (
                <p key={line} className="m-0">
                  {line}
                </p>
              ))}
              {fee > 0 ? (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={feeOk}
                    onChange={(e) => setFeeOk(e.target.checked)}
                  />
                  <span>{t('gw.req.fee_accept', { amount: money(fee) })}</span>
                </label>
              ) : null}
              <div className="field">
                <label htmlFor="gw-req-note">
                  {noteRequired ? t('gw.req.note_label') : t('guest.req.note')}
                </label>
                <textarea
                  id="gw-req-note"
                  className="input"
                  maxLength={500}
                  value={note}
                  placeholder={t('gw.req.note_ph')}
                  aria-required={noteRequired || undefined}
                  aria-invalid={tried && !noteOk ? true : undefined}
                  aria-describedby="gw-req-note-help"
                  onChange={(e) => setNote(e.target.value)}
                />
                <p className={`help${tried && !noteOk ? ' err' : ''}`} id="gw-req-note-help">
                  {tried && !noteOk ? t('gw.req.note_required') : t('gw.req.note_help')}
                </p>
              </div>
              {after ? (
                <Alert
                  tone="info"
                  title={t('gw.req.after_hours_title')}
                  actions={
                    tel ? (
                      <a className="btn" href={tel}>
                        {t('guest.contact.call')}
                      </a>
                    ) : undefined
                  }
                >
                  {t('gw.req.after_hours_body')}
                </Alert>
              ) : (
                <p className="li-s m-0">{t('guest.req.reply_time', { minutes: 10 })}</p>
              )}
            </div>
          ) : null}
          {error ? <Alert tone="bad">{error}</Alert> : null}
        </>
      )}
      <div className="wiz-foot gw-foot">
        <button type="button" className="btn" onClick={onCancel}>
          {t('common.back')}
        </button>
        <button
          type="button"
          className="btn pri"
          aria-disabled={!option || Boolean(blockedBy) || busy || undefined}
          aria-describedby={blockedBy ? 'gw-req-why' : undefined}
          onClick={() => void send()}
        >
          {t('guest.req.send')}
        </button>
        {blockedBy ? (
          <p className="li-s m-0 gw-why" id="gw-req-why">
            {blockedBy}
          </p>
        ) : null}
      </div>
    </div>
  );
}
