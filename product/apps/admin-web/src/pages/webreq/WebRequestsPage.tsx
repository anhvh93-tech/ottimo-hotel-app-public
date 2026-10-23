import {
  isApiError,
  type Role,
  type WebsiteBookingRequest,
  type WebsiteBookingRequestStatus,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Chip, Field, StateView } from '@ottimo/ui';
import { useCallback, useId, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../app/api';
import { timeHHmm } from '../../app/dates';
import { useLiveEvents } from '../../app/live';
import { Code } from '../../app/mono';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import {
  CHANNEL_ICON,
  CHANNEL_KEY,
  DEFAULT_STATUSES,
  STATUSES,
  WR_STATUS,
  cleanRefCode,
  guestsText,
  sourceText,
  stayText,
} from './labels';
import { WebRequestDrawer } from './WebRequestDrawer';

const LEADS: Role[] = ['owner', 'manager', 'front_desk_lead'];
export const FORM_SWITCH_KEY = 'public_booking_requests_enabled';
const PAGE = 50;
const LIVE_EVENTS = ['website_request.changed'] as const;

/**
 * Form switch `public_booking_requests_enabled` (OWN-only security parameter, US-155 AC4): read by the roles that
 * may read parameters (OWN/MGR/FDL – `getParameterHistory`); FD/SAL do not call it (no denied-access noise).
 * `false` → banner "form is off"; unknown (key not seeded yet, no right, error) → nothing is claimed.
 */
function useFormSwitch(propertyId: string, roles: Role[]): boolean | null {
  const canRead = roles.some((r) => LEADS.includes(r));
  const res = useResource(async () => {
    if (!canRead) return null;
    try {
      const out = await api.getParameterHistory({ propertyId, key: FORM_SWITCH_KEY });
      return out.data.current?.value === true;
    } catch {
      return null;
    }
  }, [propertyId, canRead]);
  return res.state.data ?? null;
}

/**
 * S35 "Yêu cầu từ website" (US-155 AC2, AC6, AC8 – Desk part, R3-Q06): the queue (server order: `new` by `replyBy`,
 * then latest change), status chips, "only mine", search by request code only (contact data never goes in the URL –
 * SEC ARC-12), page by page; a row opens the detail drawer at `/website-requests/:requestId`. The list shows no name /
 * phone (EP19 3.3). Live: SSE `website_request.changed` (1 s burst), poll + focus fallback.
 */
export function WebRequestsPage() {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { roles, me, property } = useSession();
  const { online } = useOnline();
  const navigate = useNavigate();
  const params = useParams();
  const openId = params['*'] || null;
  const ids = useId();
  const now = useNow(30_000);
  const formOn = useFormSwitch(propertyId, roles);

  const [statuses, setStatuses] = useState<WebsiteBookingRequestStatus[]>(DEFAULT_STATUSES);
  const [refText, setRefText] = useState('');
  const [refCode, setRefCode] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | undefined>();
  const [onlyMine, setOnlyMine] = useState(false);
  const [more, setMore] = useState<{ rows: WebsiteBookingRequest[]; cursor?: string } | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);

  const statusKey = statuses.join(',');
  const list = useResource(async () => {
    setMore(null);
    const out = await api.listWebsiteBookingRequests(
      { propertyId },
      { status: refCode ? undefined : statuses, refCode: refCode ?? undefined, limit: PAGE },
    );
    return out.data;
  }, [propertyId, statusKey, refCode]);
  const reload = list.reload;
  useLiveEvents(
    propertyId,
    useCallback(() => reload(), [reload]),
    {
      events: LIVE_EVENTS,
      debounceMs: 1000,
    },
  );

  const firstPage = list.state.data;
  const nextCursor = more ? more.cursor : (firstPage?.page.nextCursor ?? undefined);
  const hasMore = !!nextCursor;
  const all = [...(firstPage?.data ?? []), ...(more?.rows ?? [])];
  const rows = onlyMine ? all.filter((r) => r.assignedUserId === me?.id) : all;
  const newCount = all.filter((r) => r.status === 'new').length;
  const filtered = !!refCode || onlyMine || statusKey !== DEFAULT_STATUSES.join(',');

  const loadMore = async () => {
    if (!nextCursor || moreBusy) return;
    setMoreBusy(true);
    try {
      const out = await api.listWebsiteBookingRequests(
        { propertyId },
        {
          status: refCode ? undefined : statuses,
          refCode: refCode ?? undefined,
          cursor: nextCursor,
          limit: PAGE,
        },
      );
      setMore((m) => ({
        rows: [...(m?.rows ?? []), ...out.data.data],
        cursor: out.data.page.nextCursor ?? undefined,
      }));
    } finally {
      setMoreBusy(false);
    }
  };

  const toggleStatus = (s: WebsiteBookingRequestStatus) => {
    const next = statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s];
    // No chip = the default filter (EP19 3.2).
    setStatuses(next.length ? STATUSES.filter((x) => next.includes(x)) : DEFAULT_STATUSES);
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    if (!refText.trim()) {
      setRefCode(null);
      setRefError(undefined);
      return;
    }
    const code = cleanRefCode(refText);
    if (!code) {
      setRefError(t('webreq.search_hint'));
      return;
    }
    setRefError(undefined);
    setRefCode(code);
  };
  const clearFilters = () => {
    setStatuses(DEFAULT_STATUSES);
    setRefText('');
    setRefCode(null);
    setRefError(undefined);
    setOnlyMine(false);
  };
  const refInvalid =
    isApiError(list.state.error) && list.state.error.code === 'VALIDATION_FAILED' && !!refCode;

  return (
    <>
      <Topbar
        title={t('nav.website_requests')}
        sub={firstPage ? t('webreq.count_new', { n: newCount }) : undefined}
      />
      <Page>
        <div className="stack">
          {formOn === false ? (
            <Alert tone="info" icon="globe" title={t('webreq.form_off_title')}>
              {t('webreq.form_off_body')}
              {roles.includes('owner') ? <div>{t('webreq.form_off_owner')}</div> : null}
            </Alert>
          ) : null}
          <div className="webreq-filters">
            <div role="group" aria-labelledby={`${ids}-st`}>
              <span className="label-h" id={`${ids}-st`}>
                {t('webreq.filter_label')}
              </span>
              <div className="row wrap">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    aria-pressed={statuses.includes(s)}
                    disabled={!!refCode}
                    onClick={() => toggleStatus(s)}
                  >
                    {t(WR_STATUS[s].key)}
                  </Button>
                ))}
              </div>
            </div>
            <form className="row wrap" onSubmit={search} role="search">
              <Field
                label={t('webreq.search_label')}
                error={refError ?? (refInvalid ? t('webreq.search_hint') : undefined)}
              >
                {(p) => (
                  <input
                    {...p}
                    className="input mono"
                    value={refText}
                    maxLength={11}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setRefText(e.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" icon="search">
                {t('webreq.search_btn')}
              </Button>
            </form>
            <Checkbox checked={onlyMine} onChange={setOnlyMine}>
              {t('webreq.only_mine')}
            </Checkbox>
            {filtered ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                {t('webreq.clear_filters')}
              </Button>
            ) : null}
          </div>

          {!firstPage && list.state.status === 'error' && !refInvalid ? (
            <ErrorBlock
              titleKey="webreq.error_title"
              error={list.state.error}
              onRetry={list.reload}
              autoRetrySeconds={list.state.autoRetrySeconds}
            />
          ) : !firstPage && !refInvalid ? (
            <LoadingBlock rows={5} />
          ) : rows.length === 0 ? (
            filtered ? (
              <StateView
                icon="filter"
                title={t('webreq.empty_filtered')}
                action={<Button onClick={clearFilters}>{t('webreq.clear_filters')}</Button>}
              />
            ) : (
              <StateView
                icon="globe"
                title={t(formOn === false ? 'webreq.empty_form_off' : 'webreq.empty')}
              />
            )
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">{t('webreq.col.code')}</th>
                    <th scope="col">{t('webreq.col.sent')}</th>
                    <th scope="col">{t('webreq.col.stay')}</th>
                    <th scope="col">{t('webreq.col.guests')}</th>
                    <th scope="col">{t('webreq.col.room_type')}</th>
                    <th scope="col">{t('webreq.col.channel')}</th>
                    <th scope="col">{t('webreq.col.source')}</th>
                    <th scope="col">{t('webreq.col.reply_by')}</th>
                    <th scope="col">{t('webreq.col.flags')}</th>
                    <th scope="col">{t('webreq.col.assignee')}</th>
                    <th scope="col">{t('webreq.col.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <Row
                      key={r.id}
                      r={r}
                      now={now}
                      tz={property?.timezone}
                      meId={me?.id}
                      onOpen={() => navigate(`/website-requests/${r.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hasMore && rows.length ? (
            <div>
              <Button busy={moreBusy} disabled={!online} onClick={() => void loadMore()}>
                {t('webreq.load_more')}
              </Button>
            </div>
          ) : null}
        </div>
      </Page>
      {openId ? (
        <WebRequestDrawer
          requestId={openId}
          onClose={() => navigate('/website-requests')}
          onChanged={reload}
        />
      ) : null}
    </>
  );
}

function Row({
  r,
  now,
  tz,
  meId,
  onOpen,
}: {
  r: WebsiteBookingRequest;
  now: number;
  tz?: string;
  meId?: string;
  onOpen: () => void;
}) {
  const { t, dateTime } = useI18n();
  const st = WR_STATUS[r.status];
  const open = r.status === 'new' || r.status === 'in_progress';
  const flags = r.suspiciousFlags ?? [];
  return (
    <tr>
      <td>
        <button type="button" className="btn ghost sm mono" onClick={onOpen}>
          {r.refCode}
        </button>
      </td>
      <td>{dateTime(r.createdAt)}</td>
      <td>
        {stayText(t, r)}
        {r.stayKind === 'long' ? (
          <div>
            <Chip tone="long" icon="calendar">
              {t('webreq.long_stay')}
            </Chip>
          </div>
        ) : null}
      </td>
      <td>{guestsText(t, r)}</td>
      <td>{r.roomTypeLabel ?? (r.roomType ? r.roomType : t('webreq.room_any'))}</td>
      <td>
        <Chip icon={CHANNEL_ICON[r.preferredChannel]}>{t(CHANNEL_KEY[r.preferredChannel])}</Chip>
      </td>
      <td>{sourceText(t, r)}</td>
      <td>
        {open ? (
          r.isReplyOverdue ? (
            <span className="countdown bad">
              {t('webreq.overdue', {
                m: Math.max(1, Math.round((now - Date.parse(r.replyBy)) / 60_000)),
              })}
            </span>
          ) : (
            t('webreq.reply_by', { time: timeHHmm(new Date(r.replyBy), tz) })
          )
        ) : (
          '—'
        )}
        {r.arrivesToday && open ? (
          <div>
            <Chip tone="warn" icon="clock">
              {t('webreq.arrives_today')}
            </Chip>
          </div>
        ) : null}
      </td>
      <td>
        <div className="row wrap">
          {flags.slice(0, 2).map((f) => (
            <Chip key={f} tone="warn">
              {t(`webreq.flag.${f}`)}
            </Chip>
          ))}
          {flags.length > 2 ? <Chip>{`+${flags.length - 2}`}</Chip> : null}
        </div>
      </td>
      <td>
        {r.assignedUserId ? (
          r.assignedUserId === meId ? (
            t('webreq.you')
          ) : (
            r.assignedUserName
          )
        ) : (
          <span className="muted">{t('webreq.unassigned')}</span>
        )}
      </td>
      <td>
        <Chip tone={st.tone} icon={st.icon}>
          {t(st.key)}
        </Chip>
        {r.reservationCode ? (
          <div className="li-s">
            <Code>{r.reservationCode}</Code>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
