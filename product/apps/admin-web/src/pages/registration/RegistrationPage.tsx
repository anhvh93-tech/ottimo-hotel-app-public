import {
  isApiError,
  type PortalData,
  type Registration,
  type RegistrationSummary,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Seg, StateView } from '@ottimo/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../app/api';
import { useLiveReload } from '../../app/live';
import { remaining } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { StepUpDialog, useSubmit } from '../stay/common';
import { DocsList, VerifyList, resultOf } from './DocsPanel';

type View = 'action_needed' | 'needs_update' | 'all';
const OWN_MGR = ['owner', 'manager'];
const PORTAL_HIDE_MS = 120_000;
const NOTICE_VERSION = 'privacy-2026-10-v1';

/** H14 Giấy tờ & khai báo (S09, C3 – the route itself is only reachable on a granted device). */
export function RegistrationPage() {
  const params = useParams();
  const id = params['*'] || null;
  return id ? <RegistrationDetail key={id} registrationId={id} /> : <RegistrationList />;
}

function RegistrationList() {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const navigate = useNavigate();
  const ids = useId();
  const now = useNow(60_000);
  const [view, setView] = useState<View>('action_needed');
  const { state, reload } = useResource(
    async () => (await api.listRegistrations({ propertyId }, view)).data.data,
    [propertyId, view],
  );
  useLiveReload(propertyId, reload);
  const rows: RegistrationSummary[] = state.data ?? [];

  const deadline = (r: RegistrationSummary) => {
    if (r.deadlineLabel === 'at_checkin') return <span>{t('reg2.at_checkin')}</span>;
    if (r.deadlineLabel === 'done') return <span>{t(`status.reg.${r.status}`)}</span>;
    if (r.deadlineLabel === 'needs_update') return <span>{t('status.reg.needs_update')}</span>;
    const left = remaining(r.deadlineAt, now);
    const duration = left ? `${left.h}:${left.m}` : '';
    const over = r.deadlineAt ? Math.max(0, now - Date.parse(r.deadlineAt)) : 0;
    const overMin = Math.floor(over / 60_000);
    return r.deadlineLabel === 'overdue' ? (
      // US-042 AC1: overdue in colour AND words.
      <Chip tone="bad" icon="alert">
        {t('reg.deadline_overdue', {
          duration: `${Math.floor(overMin / 60)}:${String(overMin % 60).padStart(2, '0')}`,
        })}
      </Chip>
    ) : (
      <span>
        {t('reg.deadline', { time: dateTime(r.deadlineAt) })} ·{' '}
        {t('reg.deadline_left', { duration })}
      </span>
    );
  };

  return (
    <>
      <Topbar title={t('nav.registration')} />
      <Page>
        <div className="page-head">
          <span className="sr-only" id={`${ids}-v`}>
            {t('reg2.col_status')}
          </span>
          <Seg
            labelledBy={`${ids}-v`}
            value={view}
            onChange={setView}
            options={[
              { value: 'action_needed', label: t('reg2.tab_action') },
              { value: 'needs_update', label: t('reg2.tab_update') },
              { value: 'all', label: t('reg2.tab_all') },
            ]}
          />
        </div>
        {state.status === 'error' && !state.data ? (
          <ErrorBlock
            titleKey="reg2.error_title"
            error={state.error}
            onRetry={reload}
            autoRetrySeconds={state.autoRetrySeconds}
          />
        ) : !state.data ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <StateView
            icon="check"
            title={t(view === 'needs_update' ? 'reg2.upd_empty_title' : 'reg2.empty_title')}
          >
            {t(view === 'needs_update' ? 'reg2.upd_empty_body' : 'reg2.empty_body')}
          </StateView>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t('nav.registration')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('booking.field.room')}</th>
                  <th scope="col">{t('reg2.col_guest')}</th>
                  <th scope="col">{t('reg2.col_kind')}</th>
                  <th scope="col">{t('reg2.col_people')}</th>
                  <th scope="col">{t('reg2.col_status')}</th>
                  <th scope="col">{t('reg2.col_deadline')}</th>
                  <th scope="col">{t('reg2.col_action')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.roomNo}</td>
                    <td>
                      {r.guestDisplayName}
                      <div className="li-s">{r.reservationCode}</div>
                    </td>
                    <td>
                      {t(r.kind === 'vn_citizen_stay' ? 'reg2.kind_citizen' : 'reg2.kind_foreign')}
                    </td>
                    <td className="num">
                      {r.submittedCount}/{r.requiredCount}
                    </td>
                    <td>{t(`status.reg.${r.status}`)}</td>
                    <td>{deadline(r)}</td>
                    <td>
                      <Button size="sm" onClick={() => navigate(`/registration/${r.id}`)}>
                        {r.status === 'scanned'
                          ? t('reg2.declare')
                          : r.submittedCount
                            ? t('today.open')
                            : t('reg2.add_docs')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
    </>
  );
}

/**
 * H14 14.2 – (1) checks + per-person image consent (never pre-selected) → "Đối chiếu xong" (K5);
 * (2) portal data after step-up, copy field by field, auto-hidden after 2 min / tab hidden, "Xóa bộ
 * nhớ tạm"; (3) portal reference → sent / confirmed / rejected. OWN/MGR: purge images early (A74).
 */
function RegistrationDetail({ registrationId }: { registrationId: string }) {
  const { t, locale, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const toast = useToast();
  const G = { propertyId, registrationId };
  const mgr = roles.some((r) => OWN_MGR.includes(r));
  const { state, reload, mutate } = useResource(
    async () => (await api.getRegistration(G)).data,
    [registrationId],
  );
  const reg = state.data;
  const rsv = useResource(
    async () =>
      reg
        ? (await api.getReservation({ propertyId, reservationId: reg.reservationId })).data
        : null,
    [reg?.reservationId],
  );
  const set = (r: Registration) => mutate(() => r);
  const review = useSubmit();
  const consent = useSubmit();
  const portalAct = useSubmit();
  const flow = useSubmit();
  const purge = useSubmit();
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [stepUp, setStepUp] = useState(false);
  const [code, setCode] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [purging, setPurging] = useState(false);
  const hide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && setPortal(null);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      clearTimeout(hide.current);
    };
  }, []);

  if (!reg)
    return (
      <>
        <Topbar title={t('nav.registration')} />
        <Page>
          {state.status === 'error' ? (
            <ErrorBlock titleKey="reg2.error_title" error={state.error} onRetry={reload} />
          ) : (
            <LoadingBlock />
          )}
        </Page>
      </>
    );

  const r = rsv.state.data;
  const foreign = reg.kind !== 'vn_citizen_stay';
  const handled = (d: Registration['documents'][number]) =>
    d.checks.filter((c) => c.handledNote).length;

  const recordConsent = async (
    doc: Registration['documents'][number],
    decision: 'granted' | 'refused',
  ) => {
    const out = await consent.submit((idem) =>
      api.recordImageConsent(
        G,
        {
          partyMemberId: doc.partyMemberId ?? doc.id,
          purpose: 'P02B_ID_IMAGE_RETENTION',
          decision,
          noticeVersion: NOTICE_VERSION,
          locale,
          channel: 'desk',
        },
        idem,
      ),
    );
    if (out) set(out.data);
  };

  const completeReview = async () => {
    const warningNotes = reg.documents.flatMap((d) =>
      d.checks
        .filter((c) => (c.result === 'fail' || c.result === 'unverified') && c.handledNote)
        .map((c) => ({
          documentId: d.id,
          checkCode: c.code,
          note: c.handledNote!,
          manualResult: c.result === 'unverified' ? (c.manualResult ?? undefined) : undefined,
        })),
    );
    const out = await review.submit((idem) =>
      api.completeRegistrationReview(G, { warningNotes }, reg.version, idem),
    );
    if (out) {
      set(out.data);
      toast(t(`status.reg.${out.data.status}`));
    }
  };

  const showPortal = async () => {
    portalAct.setError(null);
    try {
      const res = await api.getPortalData(G);
      setPortal(res.data);
      clearTimeout(hide.current);
      hide.current = setTimeout(() => setPortal(null), PORTAL_HIDE_MS);
    } catch (e) {
      if (isApiError(e) && e.code === 'REAUTH_REQUIRED') setStepUp(true);
      else portalAct.setError(e);
    }
  };
  const copy = async (key: string, value: string) => {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(key);
  };
  const clearClipboard = async () => {
    await navigator.clipboard?.writeText('').catch(() => undefined);
    setCopied(null);
  };

  const transition = async (
    tr: 'mark-sent' | 'mark-confirmed' | 'mark-rejected',
    body: { portalReference?: string; rejectedReason?: string } = {},
  ) => {
    const out = await flow.submit((idem) =>
      api.transitionRegistration(G, tr, body, reg.version, idem),
    );
    if (out) {
      set(out.data);
      setRejecting(false);
      toast(t(`status.reg.${out.data.status}`));
      if (tr === 'mark-sent') setPortal(null);
    }
  };

  const doPurge = async () => {
    const out = await purge.submit((idem) =>
      api.purgeRegistrationImages(G, 'guest_request', reg.version, idem),
    );
    setPurging(false);
    if (out !== undefined) reload();
  };

  return (
    <>
      <Topbar
        title={t(foreign ? 'reg.type.foreigner' : 'reg.type.citizen')}
        sub={`${reg.roomNo ?? ''} · ${reg.reservationCode}`}
        actions={
          <Link className="btn ghost" to="/registration">
            {t('common.back')}
          </Link>
        }
      />
      <Page>
        <p>
          <Chip tone={reg.status === 'confirmed' ? 'ok' : 'warn'}>
            {t(`status.reg.${reg.status}`)}
          </Chip>{' '}
          {reg.deadlineAt ? t('reg.deadline', { time: dateTime(reg.deadlineAt) }) : null}
        </p>

        <section className="card stack">
          <h2 className="label-h">{t('reg2.block1')}</h2>
          {r ? <DocsList registration={reg} reservation={r} onChange={set} /> : null}
          {r ? (
            <VerifyList registration={reg} departureDate={r.departureDate} onChange={set} />
          ) : null}
          {reg.documents.map((d) => (
            <div key={d.id} className="person">
              <div className="grow">
                <b>{d.fullNameOnDoc}</b>
                <div className="li-s">
                  {t('reg2.checks_handled', { n: handled(d) })}
                  {d.checks.some((c) => resultOf(c) === 'fail')
                    ? ` · ${t('checkin.verify.result.fail')}`
                    : ''}
                </div>
              </div>
              {d.imageIds?.length ? (
                <fieldset className="fieldset-plain">
                  <legend className="li-s">{t('reg2.consent_q')}</legend>
                  <label className="check">
                    <input
                      type="radio"
                      name={`consent-${d.id}`}
                      checked={d.imageConsent === 'granted'}
                      disabled={!online || consent.busy}
                      onChange={() => void recordConsent(d, 'granted')}
                    />
                    {t('checkin.consent.yes')}
                  </label>
                  <label className="check">
                    <input
                      type="radio"
                      name={`consent-${d.id}`}
                      checked={d.imageConsent === 'refused'}
                      disabled={!online || consent.busy}
                      onChange={() => void recordConsent(d, 'refused')}
                    />
                    {t('checkin.consent.no')}
                  </label>
                  <span className="li-s">
                    {d.imageConsent === 'not_recorded'
                      ? t('reg2.consent_not_recorded')
                      : t('checkin.consent.help')}
                  </span>
                </fieldset>
              ) : null}
            </div>
          ))}
          {consent.view()}
          {review.code === 'REGISTRATION_INCOMPLETE' ? (
            <Alert tone="bad">{t('error.REGISTRATION_INCOMPLETE')}</Alert>
          ) : (
            review.view()
          )}
          {['review', 'partial'].includes(reg.status) ? (
            <Button
              variant="pri"
              busy={review.busy}
              busyLabel={review.busyLabel}
              disabled={!online}
              onClick={() => void completeReview()}
            >
              {review.label(t('reg2.review_done'))}
            </Button>
          ) : null}
        </section>

        <section className="card stack">
          <h2 className="label-h">{t('reg2.block2')}</h2>
          <p className="li-s">{t('reg2.copy_help')}</p>
          {!portal ? (
            <Button
              disabled={!online || !['scanned', 'needs_update'].includes(reg.status)}
              onClick={() => void showPortal()}
            >
              {t('reg2.show_data')}
            </Button>
          ) : (
            <>
              {portal.people.map((p, pi) => (
                <table key={pi} className="table">
                  <caption className="sr-only">{t('reg.step.copy')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">{t('reg2.portal_field')}</th>
                      <th scope="col">{t('reg2.portal_value')}</th>
                      <th scope="col">{t('reg.copy_field')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.fields.map((f, fi) => {
                      const key = `${pi}-${fi}`;
                      return (
                        <tr key={key}>
                          <td className="num">{fi + 1}</td>
                          <td>{f.label}</td>
                          <td className="mono">{f.value}</td>
                          <td>
                            <Button size="sm" onClick={() => void copy(key, f.value)}>
                              {copied === key ? t('reg.copied') : t('reg.copy_field')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ))}
              <div className="row wrap">
                <a
                  className="btn"
                  href={portal.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('reg.step.open')}
                </a>
                <Button onClick={() => void clearClipboard()}>{t('reg2.clear_clipboard')}</Button>
              </div>
            </>
          )}
          {portalAct.view()}
        </section>

        <section className="card stack">
          <h2 className="label-h">{t('reg2.block3')}</h2>
          {reg.status === 'scanned' ? (
            <>
              <Field
                label={t('reg.code_label')}
                required
                help={t('reg2.code_help')}
                error={flow.fields.portalReference}
              >
                {(p) => (
                  <input
                    {...p}
                    className="input mono"
                    maxLength={64}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                )}
              </Field>
              <Button
                variant="pri"
                busy={flow.busy}
                busyLabel={flow.busyLabel}
                disabled={!online}
                onClick={() => void transition('mark-sent', { portalReference: code.trim() })}
              >
                {flow.label(t('reg2.mark_sent'))}
              </Button>
            </>
          ) : reg.status === 'sent' ? (
            <>
              <p>
                {t('reg2.sent_note', {
                  code: reg.portalReference ?? '',
                  time: dateTime(reg.sentAt),
                })}
              </p>
              <div className="row wrap">
                <Button
                  variant="pri"
                  busy={flow.busy}
                  disabled={!online}
                  onClick={() => void transition('mark-confirmed')}
                >
                  {t('reg2.portal_confirmed')}
                </Button>
                <Button disabled={!online} onClick={() => setRejecting(true)}>
                  {t('reg2.portal_rejected')}
                </Button>
              </div>
              {rejecting ? (
                <>
                  <Field
                    label={t('reg2.reject_reason')}
                    required
                    help={t('reg2.reject_effect')}
                    error={flow.fields.rejectedReason}
                  >
                    {(p) => (
                      <input
                        {...p}
                        className="input"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    )}
                  </Field>
                  <Button
                    busy={flow.busy}
                    onClick={() =>
                      void transition('mark-rejected', { rejectedReason: rejectReason.trim() })
                    }
                  >
                    {t('reg2.portal_rejected')}
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <p className="li-s">{t('reg2.after_sent')}</p>
          )}
          {flow.view()}
        </section>

        <section className="card stack">
          <dl className="dl">
            <dt>{t('reg2.retention')}</dt>
            <dd>
              {reg.imagesPurgedAt
                ? t('reg2.image_deleted', {
                    time: dateTime(reg.imagesPurgedAt),
                    reason: reg.imagesPurgeReason ?? '',
                  })
                : t('reg2.retention_value', { date: dateTime(reg.imageRetentionUntil) })}
            </dd>
            <dt>{t('reg2.retention_refused')}</dt>
            <dd>{t('reg2.retention_refused_value')}</dd>
          </dl>
          {mgr && reg.documents.some((d) => d.imageIds?.length) ? (
            <Button variant="danger" disabled={!online} onClick={() => setPurging(true)}>
              {t('reg2.purge_submit')}
            </Button>
          ) : null}
          {purge.view()}
        </section>
      </Page>
      {stepUp ? (
        <StepUpDialog
          onClose={() => setStepUp(false)}
          onDone={() => {
            setStepUp(false);
            void showPortal();
          }}
        />
      ) : null}
      {purging ? (
        <ConfirmDialog
          title={t('confirm.purge_images.title', { guest: reg.guestDisplayName ?? '' })}
          body={t('confirm.purge_images.body')}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('reg2.purge_submit')}
          busy={purge.busy}
          onKeep={() => setPurging(false)}
          onConfirm={() => void doPurge()}
        />
      ) : null}
    </>
  );
}
