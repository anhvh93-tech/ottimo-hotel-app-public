import {
  isApiError,
  type WebsiteBookingRequest,
  type WebsiteBookingRequestAction,
  type WebsiteBookingRequestDeclineReason,
  type WebsiteBookingRequestTransition,
} from '@ottimo/api-client';
import { formatLocalDate, loadLocale, translate, useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Modal, StateView } from '@ottimo/ui';
import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../app/api';
import { timeHHmm } from '../../app/dates';
import { useLiveEvents } from '../../app/live';
import { monoArgs } from '../../app/mono';
import { useToast } from '../../app/toast';
import { LoadingBlock } from '../../components/states';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { QuoteDialog } from '../quotes/QuoteDialog';
import { useSubmit } from '../stay/common';
import {
  CHANNEL_KEY,
  FLAG_KEYS,
  REPLY_TEMPLATE_REASONS,
  STAFF_DECLINE_REASONS,
  WR_STATUS,
  guestsText,
  phoneDisplay,
  phoneLinks,
  sourceText,
  stayText,
} from './labels';

const CONFLICT = ['INVALID_TRANSITION', 'VERSION_CONFLICT'];
const QUOTE_ROLES = ['owner', 'manager', 'front_desk_lead', 'front_desk', 'sales_staff'];
const LIVE_EVENTS = ['website_request.changed'] as const;
const TOAST: Partial<Record<WebsiteBookingRequestAction, string>> = {
  claim: 'webreq.claimed_toast',
  release: 'webreq.released_toast',
  decline: 'webreq.declined_toast',
  'mark-spam': 'webreq.spam_toast',
  reopen: 'webreq.reopened_toast',
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * S35 detail drawer (`getWebsiteBookingRequest`, EP19 4–6): what the guest asked, contact block (only while C2 is
 * kept – links built at click time from the server's E.164 phone, SEC ARC-21), the guest's message as plain text,
 * source details, and ONLY the SM-18 actions the server lists in `allowedActions` (WR1–WR5; `erase` is not on this
 * screen yet). "Báo giá" opens H12 with the request linked (`saveQuote.websiteBookingRequestId` – US-155 AC2).
 * 409/412 → "someone else just updated it" + reload; 404 → not found / assigned to someone else.
 */
export function WebRequestDrawer({
  requestId,
  onClose,
  onChanged,
}: {
  requestId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { me, roles, property } = useSession();
  const { online } = useOnline();
  const toast = useToast();
  const navigate = useNavigate();
  const ids = useId();
  const tz = property?.timezone;
  const res = useResource(
    async () => (await api.getWebsiteBookingRequest({ propertyId, requestId })).data,
    [propertyId, requestId],
  );
  const { reload, mutate } = res;
  useLiveEvents(
    propertyId,
    useCallback(() => reload(), [reload]),
    {
      events: LIVE_EVENTS,
      debounceMs: 1000,
    },
  );
  const act = useSubmit();
  const [dialog, setDialog] = useState<'decline' | 'spam' | 'release' | 'quote' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const r = res.state.data;
  const notFound = isApiError(res.state.error) && res.state.error.code === 'NOT_FOUND';
  const can = (a: WebsiteBookingRequestAction) => !!r?.allowedActions?.some((x) => x.action === a);

  /** One transition: If-Match = version, Idempotency-Key per click (useWrite); conflicts reload. */
  const run = async (
    action: WebsiteBookingRequestAction,
    body: WebsiteBookingRequestTransition = {},
  ): Promise<boolean> => {
    if (!r) return false;
    let conflict = false;
    const out = await act.submit(async (idem) => {
      try {
        return await api.transitionWebsiteBookingRequest(
          { propertyId, requestId: r.id },
          action,
          body,
          r.version,
          idem,
        );
      } catch (e) {
        if (isApiError(e) && CONFLICT.includes(e.code)) conflict = true;
        throw e;
      }
    });
    if (out) {
      mutate(() => out.data);
      setNotice(null);
      const key = TOAST[action];
      if (key) toast(t(key, { code: r.refCode }));
      onChanged();
      return true;
    }
    if (conflict) {
      act.reset();
      setNotice(t('webreq.already_changed'));
      reload();
      onChanged();
    }
    return false;
  };

  const title = r
    ? monoArgs(t, 'webreq.detail_title', { code: r.refCode }, ['code'])
    : t('nav.website_requests');
  const isOpen = r && (r.status === 'new' || r.status === 'in_progress');
  const mine = r?.assignedUserId && r.assignedUserId === me?.id;
  const canQuote = !!isOpen && roles.some((x) => QUOTE_ROLES.includes(x));

  const footer =
    r && !notFound ? (
      !online ? (
        <Button variant="pri" disabled>
          {t('rsv.need_online')}
        </Button>
      ) : (
        <>
          {can('mark-spam') ? (
            <Button variant="ghost" onClick={() => setDialog('spam')}>
              {t('webreq.mark_spam')}
            </Button>
          ) : null}
          {can('decline') ? (
            <Button onClick={() => setDialog('decline')}>{t('webreq.decline')}</Button>
          ) : null}
          {can('release') ? (
            <Button
              busy={act.busy}
              onClick={() => (mine ? void run('release') : setDialog('release'))}
            >
              {t('webreq.release')}
            </Button>
          ) : null}
          {can('reopen') ? (
            <Button variant="pri" busy={act.busy} onClick={() => void run('reopen')}>
              {t('webreq.reopen')}
            </Button>
          ) : null}
          {canQuote ? (
            <Button icon="tag" onClick={() => setDialog('quote')}>
              {t('webreq.quote')}
            </Button>
          ) : null}
          {can('claim') ? (
            <Button variant="pri" busy={act.busy} onClick={() => void run('claim')}>
              {t('webreq.claim')}
            </Button>
          ) : null}
        </>
      )
    ) : undefined;

  return (
    <Modal
      open
      variant="drawer"
      title={title}
      meta={r ? sourceText(t, r) : undefined}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={footer}
    >
      {notFound ? (
        <StateView kind="error" icon="search" title={t('webreq.not_found')} />
      ) : !r && res.state.status === 'error' ? (
        <Alert
          tone="bad"
          title={t('webreq.error_title')}
          actions={<Button onClick={reload}>{t('common.retry')}</Button>}
        />
      ) : !r ? (
        <LoadingBlock />
      ) : (
        <div className="stack">
          {notice ? <Alert tone="warn">{notice}</Alert> : null}
          {act.view()}
          <div className="row wrap">
            <Chip tone={WR_STATUS[r.status].tone} icon={WR_STATUS[r.status].icon}>
              {t(WR_STATUS[r.status].key)}
            </Chip>
            {r.arrivesToday ? (
              <Chip tone="warn" icon="clock">
                {t('webreq.arrives_today')}
              </Chip>
            ) : null}
            {r.isReplyOverdue ? (
              <Chip tone="bad" icon="clock">
                {t('webreq.overdue', {
                  m: Math.max(1, Math.round((Date.now() - Date.parse(r.replyBy)) / 60_000)),
                })}
              </Chip>
            ) : isOpen ? (
              <Chip icon="clock">
                {t('webreq.reply_by', { time: timeHHmm(new Date(r.replyBy), tz) })}
              </Chip>
            ) : null}
            {(r.suspiciousFlags ?? [])
              .filter((f) => (FLAG_KEYS as readonly string[]).includes(f))
              .map((f) => (
                <Chip key={f} tone="warn">
                  {t(`webreq.flag.${f}`)}
                </Chip>
              ))}
            <Button
              size="sm"
              variant="ghost"
              icon="copy"
              onClick={() => void copyText(r.refCode).then((ok) => ok && toast(t('webreq.copied')))}
            >
              {t('webreq.copy_code')}
            </Button>
          </div>

          {r.status === 'converted' && r.reservationId ? (
            <Alert
              tone="ok"
              actions={
                <Link className="btn sm" to={`/reservations/${r.reservationId}`}>
                  {t('webreq.open_booking')}
                </Link>
              }
            >
              {monoArgs(t, 'webreq.converted', { code: r.reservationCode ?? '' }, ['code'])}
            </Alert>
          ) : null}
          {r.status === 'declined' && r.declineReasonCode ? (
            <p className="li-s">
              {t('webreq.declined_reason', { reason: t(`webreq.decline.${r.declineReasonCode}`) })}
              {r.declineNote ? ` – ${r.declineNote}` : ''}
            </p>
          ) : null}

          <section aria-labelledby={`${ids}-stay`}>
            <h3 className="label-h" id={`${ids}-stay`}>
              {t('webreq.sec.stay')}
            </h3>
            <dl className="webreq-kv">
              <dt>{t('webreq.col.stay')}</dt>
              <dd>
                {stayText(t, r)}
                {r.stayKind === 'long' ? (
                  <>
                    {' '}
                    <Chip tone="long" icon="calendar">
                      {t('webreq.long_stay')}
                    </Chip>
                  </>
                ) : null}
              </dd>
              <dt>{t('webreq.col.guests')}</dt>
              <dd>{guestsText(t, r)}</dd>
              <dt>{t('webreq.col.room_type')}</dt>
              <dd>{r.roomTypeLabel ?? r.roomType ?? t('webreq.room_any')}</dd>
              <dt>{t('webreq.locale')}</dt>
              <dd>{t(`webreq.locale.${r.locale}`)}</dd>
              <dt>{t('webreq.col.sent')}</dt>
              <dd>{dateTime(r.createdAt)}</dd>
              <dt>{t('webreq.col.assignee')}</dt>
              <dd>
                {r.assignedUserId
                  ? t('webreq.assignee_since', {
                      name: mine ? t('webreq.you') : (r.assignedUserName ?? ''),
                      time: r.claimedAt ? timeHHmm(new Date(r.claimedAt), tz) : '',
                    })
                  : t('webreq.unassigned')}
              </dd>
              {r.quoteId ? (
                <>
                  <dt>{t('webreq.quote')}</dt>
                  <dd>{t('webreq.has_quote')}</dd>
                </>
              ) : null}
            </dl>
            {r.duplicateCount ? (
              <p className="li-s">{t('webreq.duplicate_count', { n: r.duplicateCount })}</p>
            ) : null}
            {r.relatedRefCodes?.length ? (
              <p className="li-s">{t('webreq.related', { codes: r.relatedRefCodes.join(', ') })}</p>
            ) : null}
          </section>

          <ContactBlock r={r} />

          {r.note ? (
            <section aria-labelledby={`${ids}-note`}>
              <h3 className="label-h" id={`${ids}-note`}>
                {t('webreq.sec.note')}
              </h3>
              {/* Plain text only – never HTML, never auto-linked (SEC ARC-21, SR-INP-04). */}
              <p className="webreq-note">{r.note}</p>
            </section>
          ) : null}

          <details>
            <summary>{t('webreq.sec.source')}</summary>
            <ul className="list-plain li-s">
              <li>{sourceText(t, r)}</li>
              {r.utmSource || r.utmMedium || r.utmCampaign ? (
                <li>
                  {t('webreq.utm', {
                    source: r.utmSource ?? '—',
                    medium: r.utmMedium ?? '—',
                    campaign: r.utmCampaign ?? '—',
                  })}
                </li>
              ) : null}
              {r.refHost ? <li>{t('webreq.ref_host', { host: r.refHost })}</li> : null}
              {r.landingPath ? (
                <li>{monoArgs(t, 'webreq.landing_path', { path: r.landingPath }, ['path'])}</li>
              ) : null}
            </ul>
          </details>
        </div>
      )}

      {r && dialog === 'decline' ? (
        <DeclineDialog
          r={r}
          busy={act.busy}
          fields={act.fields}
          onClose={() => setDialog(null)}
          onSubmit={async (body) => {
            if (await run('decline', body)) setDialog(null);
          }}
        />
      ) : null}
      {r && dialog === 'spam' ? (
        <ConfirmDialog
          danger
          title={t('webreq.spam_title', { code: r.refCode })}
          body={t('webreq.spam_body')}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('webreq.mark_spam')}
          busy={act.busy}
          onKeep={() => setDialog(null)}
          onConfirm={() => void run('mark-spam').then((ok) => ok && setDialog(null))}
        />
      ) : null}
      {r && dialog === 'release' ? (
        <ConfirmDialog
          title={t('webreq.release_other_title', {
            code: r.refCode,
            name: r.assignedUserName ?? '',
          })}
          body={t('webreq.release_other_body', { name: r.assignedUserName ?? '' })}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('webreq.release')}
          busy={act.busy}
          onKeep={() => setDialog(null)}
          onConfirm={() => void run('release').then((ok) => ok && setDialog(null))}
        />
      ) : null}
      {r && dialog === 'quote' ? (
        <QuoteDialog
          prefill={{
            arrivalDate: r.arrival,
            nights: r.nights ?? undefined,
            adults: r.adults,
            children6to11: r.children,
            childrenUnder6: r.infants,
            webRequest: {
              id: r.id,
              code: r.refCode,
              locale: r.locale,
              contact: r.phone || r.email ? { phone: r.phone, email: r.email } : undefined,
            },
          }}
          onClose={() => {
            setDialog(null);
            reload();
            onChanged();
          }}
          onOpenReservation={(id) => {
            setDialog(null);
            onChanged();
            navigate(`/reservations/${id}`);
          }}
        />
      ) : null}
    </Modal>
  );
}

/** Contact (C2) – only while kept; SAL on an unassigned request sees none until they pick it up (SEC ARC-19). */
function ContactBlock({ r }: { r: WebsiteBookingRequest }) {
  const { t, date } = useI18n();
  const toast = useToast();
  const { property } = useSession();
  const ids = useId();
  if (r.status === 'converted') return null;
  const head = (
    <h3 className="label-h" id={`${ids}-c`}>
      {t('webreq.sec.contact')}
    </h3>
  );
  if (r.piiPurgedAt)
    return (
      <section aria-labelledby={`${ids}-c`}>
        {head}
        <p className="li-s">{t('webreq.pii_purged', { date: date(r.piiPurgedAt.slice(0, 10)) })}</p>
      </section>
    );
  if (!r.guestName && !r.phone && !r.email)
    return (
      <section aria-labelledby={`${ids}-c`}>
        {head}
        <p className="li-s">{t('webreq.pii_hidden_sal')}</p>
      </section>
    );
  const links = phoneLinks(r.phone);
  const hour = Number(timeHHmm(new Date(), property?.timezone).slice(0, 2));
  const outsideCallHours = hour < 8 || hour >= 21;
  const copy = (v: string) => void copyText(v).then((ok) => ok && toast(t('webreq.copied')));
  return (
    <section aria-labelledby={`${ids}-c`}>
      {head}
      <dl className="webreq-kv">
        <dt>{t('webreq.guest_name')}</dt>
        <dd>{r.guestName}</dd>
        {r.phone ? (
          <>
            <dt>{t('webreq.phone')}</dt>
            <dd className="mono">{phoneDisplay(r.phone)}</dd>
          </>
        ) : null}
        {r.email ? (
          <>
            <dt>{t('webreq.email')}</dt>
            <dd>{r.email}</dd>
          </>
        ) : null}
      </dl>
      <p className="li-s">
        {t('webreq.preferred', { channel: t(CHANNEL_KEY[r.preferredChannel]) })}
      </p>
      <div className="row wrap">
        {r.phone ? (
          <Button size="sm" icon="copy" onClick={() => copy(r.phone!)}>
            {t('webreq.copy_phone')}
          </Button>
        ) : null}
        {r.email ? (
          <Button size="sm" icon="copy" onClick={() => copy(r.email!)}>
            {t('webreq.copy_email')}
          </Button>
        ) : null}
        {links ? (
          <>
            <a className="btn sm" href={links.tel}>
              {t('webreq.call')}
            </a>
            {r.preferredChannel === 'whatsapp' ? (
              <a className="btn sm" href={links.wa} target="_blank" rel="noopener noreferrer">
                {t('webreq.whatsapp')}
              </a>
            ) : null}
          </>
        ) : null}
      </div>
      <p className="li-s">{t('webreq.own_account_hint')}</p>
      {r.preferredChannel === 'zalo' ? (
        <p className="li-s">{monoArgs(t, 'webreq.zalo_hint', { code: r.refCode }, ['code'])}</p>
      ) : null}
      {r.phone && outsideCallHours ? <p className="li-s">{t('webreq.call_window')}</p> : null}
    </section>
  );
}

/** "Đóng – không thành đơn" (EP19 6.2): reason required; `other` needs a note; suggested reply in the guest's language. */
function DeclineDialog({
  r,
  busy,
  fields,
  onClose,
  onSubmit,
}: {
  r: WebsiteBookingRequest;
  busy: boolean;
  fields: Record<string, string>;
  onClose: () => void;
  onSubmit: (body: WebsiteBookingRequestTransition) => Promise<void>;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const ids = useId();
  const [code, setCode] = useState<WebsiteBookingRequestDeclineReason | null>(null);
  const [note, setNote] = useState('');
  // The guest's language: VI or EN (RU guests get EN until RU strings are approved – US-115).
  const guestLang = r.locale === 'vi' ? 'vi' : 'en';
  const [langReady, setLangReady] = useState(guestLang === 'vi');
  useEffect(() => {
    if (guestLang === 'en') void loadLocale('en').then(() => setLangReady(true));
  }, [guestLang]);
  const needNote = code === 'other' && note.trim().length < 3;
  const blocked = !code || needNote;
  const template =
    code && REPLY_TEMPLATE_REASONS.includes(code) && langReady
      ? translate(guestLang, `webreq.reply.${code}`, {
          code: r.refCode,
          arrival: formatLocalDate(r.arrival),
          departure: formatLocalDate(r.departure ?? r.arrival),
        })
      : null;
  return (
    <Modal
      open
      size="sm"
      title={monoArgs(t, 'webreq.decline_title', { code: r.refCode }, ['code'])}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={!!note}
      footer={
        <>
          <Button onClick={onClose}>{t('confirm.keep')}</Button>
          <Button
            variant="pri"
            busy={busy}
            disabled={blocked}
            aria-describedby={blocked ? `${ids}-need` : undefined}
            onClick={() =>
              void onSubmit({ reasonCode: code!, note: note.trim() ? note.trim() : undefined })
            }
          >
            {t('webreq.decline_confirm')}
          </Button>
        </>
      }
    >
      <fieldset className="fieldset-plain">
        <legend>{t('webreq.decline_reason')}</legend>
        {STAFF_DECLINE_REASONS.map((c) => (
          <label key={c} className="check">
            <input
              type="radio"
              name={`${ids}-c`}
              checked={code === c}
              onChange={() => setCode(c)}
            />
            {t(`webreq.decline.${c}`)}
          </label>
        ))}
      </fieldset>
      {fields.reasonCode ? <p className="field-error">{fields.reasonCode}</p> : null}
      {template ? (
        <div className="stack">
          <span className="label-h">
            {t('webreq.reply_template', { lang: t(`webreq.locale.${guestLang}`) })}
          </span>
          <p className="webreq-template" lang={guestLang}>
            {template}
          </p>
          <div className="row wrap">
            <Button
              size="sm"
              icon="copy"
              onClick={() => void copyText(template).then((ok) => ok && toast(t('webreq.copied')))}
            >
              {t('webreq.copy_reply')}
            </Button>
          </div>
          <p className="li-s">{t('webreq.decline_send_first')}</p>
        </div>
      ) : null}
      <Field
        label={t('webreq.note')}
        help={t('webreq.note_hint')}
        required={code === 'other'}
        error={fields.note}
      >
        {(p) => (
          <textarea
            {...p}
            className="input"
            rows={2}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      {blocked ? (
        <p className="li-s" id={`${ids}-need`}>
          {t('webreq.decline_need')}
        </p>
      ) : null}
    </Modal>
  );
}
