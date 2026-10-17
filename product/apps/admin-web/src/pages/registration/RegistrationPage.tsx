import {
  isApiError,
  type PortalData,
  type Registration,
  type RegistrationSummary,
} from '@ottimo/api-client';
import { hasKey, useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Seg, StateView } from '@ottimo/ui';
import { useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../app/api';
import { useLiveReload } from '../../app/live';
import { C3_TTL_MS, useC3Clipboard, useC3Reveal } from '../../app/c3';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { StepUpDialog, useSubmit } from '../stay/common';
import { DocsList, VerifyList, resultOf } from './DocsPanel';
import { useUnlinkedAttention } from './partyDocs';
import { monoArgs } from '../../app/mono';

type View = 'action_needed' | 'needs_update' | 'all';
/** "Cần chú ý" of unlinked guest-link documents: buttons for the first few bookings (rows carry a chip too). */
const MAX_OPEN_BUTTONS = 5;
const OWN_MGR = ['owner', 'manager'];

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
  // FB-R2-SEC-FE-07: "Cần chú ý" data_quality / registration_party_docs_unlinked – the "Hôm nay" page is
  // still a frame, so the item is shown here, above the list it concerns.
  const unlinked = useUnlinkedAttention(propertyId);
  useLiveReload(propertyId, () => {
    reload();
    unlinked.reload();
  });
  const rows: RegistrationSummary[] = state.data ?? [];
  const item = unlinked.item;
  const flaggedIds = new Set(item?.reservationIds ?? []);
  const due = item?.dueAt ? dateTime(item.dueAt) : null;
  // The bookings named by the item may not be in the page of the list on screen (first 100 by id): each one
  // is read for its code and registration (`Reservation.registrationId`, 0.3.6) – a few at most.
  const flaggedKey = [...flaggedIds].slice(0, MAX_OPEN_BUTTONS).join(',');
  const targets = useResource(async () => {
    const ids = flaggedKey ? flaggedKey.split(',') : [];
    const found = await Promise.all(
      ids.map((reservationId) =>
        api.getReservation({ propertyId, reservationId }).then(
          (x) => x.data,
          () => null,
        ),
      ),
    );
    return found.flatMap((x) =>
      x?.registrationId ? [{ code: x.code, registrationId: x.registrationId }] : [],
    );
  }, [propertyId, flaggedKey]);

  const deadline = (r: RegistrationSummary) => {
    if (r.deadlineLabel === 'at_checkin') return <span>{t('reg2.at_checkin')}</span>;
    if (r.deadlineLabel === 'done') return <span>{t(`status.reg.${r.status}`)}</span>;
    if (r.deadlineLabel === 'needs_update') return <span>{t('status.reg.needs_update')}</span>;
    // FE-S3-12: no deadline computed yet → say so instead of "Hạn khai báo: · còn".
    if (!r.deadlineAt) return <span>{t('reg2.deadline_pending')}</span>;
    const left = Math.max(0, Date.parse(r.deadlineAt) - now);
    const over = Math.max(0, now - Date.parse(r.deadlineAt));
    return r.deadlineLabel === 'overdue' ? (
      // US-042 AC1: overdue in colour AND words.
      <Chip tone="bad" icon="alert">
        {t('reg.deadline_overdue', { duration: durationText(t, over) })}
      </Chip>
    ) : (
      <span>
        {t('reg.deadline', { time: dateTime(r.deadlineAt) })} ·{' '}
        {t('reg.deadline_left', { duration: durationText(t, left) })}
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
        {item ? (
          <Alert
            tone="warn"
            title={
              !due
                ? t('attn.data_quality', { n: item.count ?? flaggedIds.size })
                : item.count === 1 && item.refCode
                  ? t('attn.dq_party_docs_unlinked_one', { code: item.refCode, time: due })
                  : t('attn.dq_party_docs_unlinked', {
                      n: item.count ?? flaggedIds.size,
                      time: due,
                    })
            }
            actions={
              targets.state.data?.length ? (
                <>
                  {targets.state.data.map((x) => (
                    <Button
                      key={x.registrationId}
                      size="sm"
                      onClick={() => navigate(`/registration/${x.registrationId}?focus=pending`)}
                    >
                      {t('reg.link.open_booking', { code: x.code })}
                    </Button>
                  ))}
                </>
              ) : undefined
            }
          >
            {t('attn.dq_party_docs_unlinked_body')}
          </Alert>
        ) : null}
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
                    <td>
                      {t(`status.reg.${r.status}`)}
                      {flaggedIds.has(r.reservationId) ? (
                        <div>
                          <Chip tone="warn">{t('reg.link.row_chip')}</Chip>
                        </div>
                      ) : null}
                    </td>
                    <td>{deadline(r)}</td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/registration/${r.id}${flaggedIds.has(r.reservationId) ? '?focus=pending' : ''}`,
                          )
                        }
                      >
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
  const [search] = useSearchParams();
  const focusPending = search.get('focus') === 'pending';
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
  // FB-R2-SEC-FE-06: portal data hidden after 60 s / tab hidden / leaving; clipboard wiped too.
  const portalReveal = useC3Reveal<PortalData>();
  const portal = portalReveal.value;
  const clip = useC3Clipboard();
  const [copied, setCopied] = useState<string | null>(null);
  const [stepUp, setStepUp] = useState(false);
  const [code, setCode] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [purging, setPurging] = useState(false);

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
  // SEC-BE-54 (BE-C e6d1a7d): mark-sent → 409 REGISTRATION_INCOMPLETE errors[party_count] when fewer
  // documents count than people – said before the click too when the numbers already show it.
  const short = Math.max(0, reg.requiredCount - reg.submittedCount);
  const incompleteText =
    short > 0 ? t('reg2.mark_sent_incomplete', { n: short }) : t('reg2.mark_sent_incomplete_short');
  const handled = (d: Registration['documents'][number]) =>
    d.checks.filter((c) => c.handledNote).length;

  // 0.3.6 add. 3: notice version + retention days come from the server; missing → no consent
  // question at all (fail closed, same as guest-web) – never a hard-coded "30 days".
  const notice = reg.consentNotice;
  const recordConsent = async (
    doc: Registration['documents'][number],
    decision: 'granted' | 'refused',
    notice: NonNullable<Registration['consentNotice']>,
  ) => {
    const out = await consent.submit((idem) =>
      api.recordImageConsent(
        G,
        {
          partyMemberId: doc.partyMemberId ?? doc.id,
          purpose: 'P02B_ID_IMAGE_RETENTION',
          decision,
          // 0.3.6 add. 3: send back exactly the notice and days the guest was told.
          noticeVersion: notice.currentNoticeVersion,
          retentionDays: notice.imageRetentionDays,
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
      portalReveal.show(res.data);
    } catch (e) {
      if (isApiError(e) && e.code === 'REAUTH_REQUIRED') setStepUp(true);
      else portalAct.setError(e);
    }
  };
  // Copy the server value (Vietnamese, as the portal expects) – never the translated text shown.
  const copy = async (key: string, value: string) => {
    await clip.copy(value);
    setCopied(key);
  };
  const clearClipboard = () => {
    clip.clear();
    setCopied(null);
  };

  const transition = async (
    tr: 'mark-sent' | 'mark-confirmed' | 'mark-rejected',
    body: { portalReference?: string; rejectedReason?: string } = {},
  ) => {
    const out = await flow.submit((idem) =>
      api.transitionRegistration(G, tr, body, reg.version, idem),
    );
    // SEC-BE-54: fewer counted documents than people (a document waits to be linked, J16 removed one…) –
    // read the registration again so the counts and the waiting documents are current.
    if (!out && tr === 'mark-sent') reload();
    if (out) {
      set(out.data);
      setRejecting(false);
      toast(t(`status.reg.${out.data.status}`));
      if (tr === 'mark-sent') {
        portalReveal.hide();
        clearClipboard();
      }
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
          {r ? (
            <DocsList
              registration={reg}
              reservation={r}
              onChange={set}
              focusPending={focusPending}
            />
          ) : null}
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
              {d.imageIds?.length && !notice ? (
                <span className="li-s">{t('reg2.consent_not_recorded')}</span>
              ) : d.imageIds?.length && notice ? (
                <fieldset className="fieldset-plain">
                  <legend className="li-s">
                    {t('reg2.consent_q', { days: notice.imageRetentionDays })}
                  </legend>
                  <label className="check">
                    <input
                      type="radio"
                      name={`consent-${d.id}`}
                      checked={d.imageConsent === 'granted'}
                      disabled={!online || consent.busy}
                      onChange={() => void recordConsent(d, 'granted', notice)}
                    />
                    {t('checkin.consent.yes')}
                  </label>
                  <label className="check">
                    <input
                      type="radio"
                      name={`consent-${d.id}`}
                      checked={d.imageConsent === 'refused'}
                      disabled={!online || consent.busy}
                      onChange={() => void recordConsent(d, 'refused', notice)}
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
                      // FE-S3-01: label = i18n key from the server; enum/empty values have `valueKey`.
                      const empty = f.valueKey === 'reg.value.empty' || !f.value;
                      const label = hasKey(f.label) ? t(f.label) : f.label;
                      return (
                        <tr key={key}>
                          <td className="num">{fi + 1}</td>
                          <td>{label}</td>
                          <td className={empty ? 'muted' : 'mono'}>
                            {empty
                              ? t('reg.value.empty')
                              : f.valueKey && hasKey(f.valueKey)
                                ? t(f.valueKey)
                                : f.value}
                          </td>
                          <td>
                            {empty ? null : (
                              <Button
                                size="sm"
                                aria-label={`${t('reg.copy_field')} ${label}`}
                                onClick={() => void copy(key, f.value)}
                              >
                                {copied === key ? t('reg.copied') : t('reg.copy_field')}
                              </Button>
                            )}
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
                <Button onClick={() => clearClipboard()}>{t('reg2.clear_clipboard')}</Button>
              </div>
              <p className="li-s">{t('reg2.portal_autohide', { minutes: C3_TTL_MS / 60_000 })}</p>
            </>
          )}
          {portalAct.view()}
        </section>

        <section className="card stack">
          <h2 className="label-h">{t('reg2.block3')}</h2>
          {reg.status === 'scanned' ? (
            <>
              {short > 0 && flow.code !== 'REGISTRATION_INCOMPLETE' ? (
                <Alert tone="warn">{incompleteText}</Alert>
              ) : null}
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
                {/* S4-49 B1: the registration (portal) code in JetBrains Mono. */}
                {monoArgs(
                  t,
                  'reg2.sent_note',
                  { code: reg.portalReference ?? '', time: dateTime(reg.sentAt) },
                  ['code'],
                )}
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
          {flow.code === 'REGISTRATION_INCOMPLETE' ? (
            <Alert tone="bad">{incompleteText}</Alert>
          ) : (
            flow.view()
          )}
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
                : reg.imageRetentionUntil && notice
                  ? // `{days}` from the server too (UXD 17/10) – no notice → "pending", never a bare {days}.
                    t('reg2.retention_value', {
                      days: notice.imageRetentionDays,
                      date: dateTime(reg.imageRetentionUntil),
                    })
                  : t('reg2.retention_pending')}
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

/** content-guide 4: durations as "{h} giờ {m} phút" / "{m} phút" (FE-S3-14). */
function durationText(t: (k: string, a?: Record<string, string | number>) => string, ms: number) {
  const total = Math.floor(ms / 60_000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? t('common.duration_hm', { h, m }) : t('common.duration_m', { m });
}
