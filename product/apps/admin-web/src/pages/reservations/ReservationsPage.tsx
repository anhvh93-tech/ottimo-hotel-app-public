import type { ReservationStatus } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Button, Chip, StateView } from '@ottimo/ui';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { useLiveReload } from '../../app/live';
import { STATUS_KEY, STATUS_TONE, channelName, dayMonth } from '../../app/reservations';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { labelFor, NAV } from '../../session/nav';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { BookingDialog } from '../booking/BookingDialog';
import { LongStayDialog } from '../booking/LongStayDialog';
import { CheckInPage } from '../stay/CheckInPage';
import { CheckOutPage } from '../stay/CheckOutPage';
import { ReservationDrawer } from './ReservationDrawer';

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
type Filter = 'active' | 'all' | 'manual';
const ACTIVE: ReservationStatus[] = ['hold', 'confirmed', 'in_house'];

/**
 * Đơn đặt phòng (S04) – list + `/reservations/:id` deep link to the H11 drawer. Filter "HĐ ngoài hệ
 * thống" = H10 10.2 (`externalContract=true`, US-017 AC5a). SAL/CTV see only their own (server scope).
 */
export function ReservationsPage() {
  const params = useParams();
  // `/reservations/:id/check-in` (H13, S06) and `/reservations/:id/check-out` (H16, S07): full pages.
  const [id, sub] = (params['*'] ?? '').split('/');
  if (id && sub === 'check-in') return <CheckInPage key={id} reservationId={id} />;
  if (id && sub === 'check-out') return <CheckOutPage key={id} reservationId={id} />;
  return <ReservationsList openId={id || null} />;
}

function ReservationsList({ openId }: { openId: string | null }) {
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const catalog = useCatalog(propertyId);
  const navigate = useNavigate();
  const fd = roles.some((r) => FD_PLUS.includes(r));
  const [filter, setFilter] = useState<Filter>('active');
  // FE-S3-21: H04 links here with `?q=<room>` after a stop-sale warning.
  const [search] = useSearchParams();
  const [q, setQ] = useState(search.get('q') ?? '');
  const query = useDebounced(q.trim(), 300);
  const [dialog, setDialog] = useState<'booking' | 'long' | null>(null);
  const { state, reload } = useResource(
    async () =>
      (
        await api.listReservations(
          { propertyId },
          {
            status: filter === 'active' ? ACTIVE : undefined,
            externalContract: filter === 'manual' ? true : undefined,
            q: query.length >= 2 ? query : undefined,
            limit: 100,
          },
        )
      ).data.data,
    [propertyId, filter, query],
  );
  useLiveReload(propertyId, reload);
  const nav = NAV.find((n) => n.id === 'reservations')!;
  const rows = state.data ?? [];

  return (
    <>
      <Topbar
        title={t(labelFor(nav, roles))}
        actions={
          fd ? (
            <>
              <Button icon="calendar" disabled={!online} onClick={() => setDialog('long')}>
                {t('lsm.title')}
              </Button>
              <Button
                variant="pri"
                icon="plus"
                disabled={!online}
                onClick={() => setDialog('booking')}
              >
                {t('bk.new_cta')}
              </Button>
            </>
          ) : undefined
        }
      />
      <Page>
        <div className="page-head">
          <div className="seg" role="group" aria-label={t('users.col_status')}>
            <button
              type="button"
              aria-pressed={filter === 'active'}
              onClick={() => setFilter('active')}
            >
              {t('rsv.filter_active')}
            </button>
            <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              {t('reg2.tab_all')}
            </button>
            {fd ? (
              <button
                type="button"
                aria-pressed={filter === 'manual'}
                onClick={() => setFilter('manual')}
              >
                {t('lsm.filter_chip')}
              </button>
            ) : null}
          </div>
          <label className="search">
            <span className="sr-only">{t('shell.search_label')}</span>
            <input
              type="search"
              value={q}
              placeholder={t('rsv.search_placeholder')}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        {state.status === 'error' && !state.data ? (
          <ErrorBlock titleKey="common.error_generic_title" error={state.error} onRetry={reload} />
        ) : state.status === 'loading' && !state.data ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          // FB-R2-UXD-FE-S2-07: real empty states, not a "–" row.
          query ? (
            <StateView icon="search" title={t('rsv.search_empty', { q: query })} />
          ) : (
            <StateView
              icon="calendar"
              title={t('rsv.list_empty_title')}
              action={
                fd ? (
                  <Button
                    variant="pri"
                    icon="plus"
                    disabled={!online}
                    onClick={() => setDialog('booking')}
                  >
                    {t('bk.new_cta')}
                  </Button>
                ) : undefined
              }
            >
              {t('rsv.list_empty_body')}
            </StateView>
          )
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t(labelFor(nav, roles))}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('lsm.col_code')}</th>
                  <th scope="col">{t('rooms.col_room')}</th>
                  <th scope="col">{t('crm.col_name')}</th>
                  <th scope="col">{t('rsv.dates')}</th>
                  <th scope="col">{t('booking.field.channel')}</th>
                  <th scope="col">{t('users.col_status')}</th>
                  {fd ? (
                    <th className="r" scope="col">
                      {t('drawer.folio.balance')}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={openId === r.id ? 'is-editing' : undefined}>
                    <td>
                      <button
                        type="button"
                        className="btn ghost sm mono"
                        onClick={() => navigate(`/reservations/${r.id}`)}
                      >
                        {r.code}
                      </button>
                    </td>
                    <td>{r.roomNo ?? <Chip tone="bad">{t('rsv.conflict_chip')}</Chip>}</td>
                    <td>{r.guestDisplayName}</td>
                    <td>
                      {dayMonth(r.arrivalDate)} → {dayMonth(r.departureDate)}
                    </td>
                    <td>{channelName(catalog.channels, r.channelCode)}</td>
                    <td>
                      <Chip tone={STATUS_TONE[r.status]}>{t(STATUS_KEY[r.status])}</Chip>
                      {r.stayType === 'long' ? (
                        <>
                          {' '}
                          <Chip>{t('lsm.pending_r3')}</Chip>
                        </>
                      ) : null}
                    </td>
                    {fd ? (
                      <td className="r num">
                        {r.balanceDueVnd !== undefined
                          ? `${vnd(r.balanceDueVnd)} ${t('common.vnd_unit')}`
                          : ''}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
      {openId ? (
        <ReservationDrawer reservationId={openId} onClose={() => navigate('/reservations')} />
      ) : null}
      {dialog === 'booking' ? (
        <BookingDialog
          onClose={() => setDialog(null)}
          onCreated={(r) => {
            setDialog(null);
            navigate(`/reservations/${r.id}`);
          }}
          onLongStay={() => setDialog('long')}
        />
      ) : null}
      {dialog === 'long' ? (
        <LongStayDialog
          onClose={() => setDialog(null)}
          onCreated={(r) => {
            setDialog(null);
            navigate(`/reservations/${r.id}`);
          }}
          onShortStay={() => setDialog('booking')}
        />
      ) : null}
    </>
  );
}
