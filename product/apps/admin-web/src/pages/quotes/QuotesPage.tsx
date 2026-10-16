import type { AvailabilityResult, Quote, RackRoom } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field } from '@ottimo/ui';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { todayLocal } from '../../app/dates';
import { useLiveReload } from '../../app/live';
import { addDays, dayMonth } from '../../app/reservations';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { RackGrid } from '../rack/RackGrid';
import type { RackBarX } from '../rack/rackModel';
import { ReservationDrawer } from '../reservations/ReservationDrawer';
import { QuoteDialog, type QuotePrefill } from './QuoteDialog';

type Tab = 'availability' | 'quotes';

/**
 * H12 Báo giá & giữ chỗ (S15; US-080, 082–087 R2). Sale / CTV flow: free rooms → quote (server price,
 * commission of the caller only, no "OTTIMO còn lại" for CTV) → text to send → hold. The availability
 * grid is the role-reduced rack of H08 8.4 (other bookings = "Đã kín", own holds named).
 */
export function QuotesPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('availability');
  const [quote, setQuote] = useState<QuotePrefill | null>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const restore = () => {
    const el = returnFocus.current;
    setTimeout(() => el?.focus?.(), 0);
  };

  return (
    <>
      <Topbar title={t('nav.quotes')} />
      <Page>
        <div className="tabs" role="tablist" aria-label={t('nav.quotes')}>
          <button
            type="button"
            role="tab"
            id="tab-availability"
            aria-controls="panel-availability"
            aria-selected={tab === 'availability'}
            onClick={() => setTab('availability')}
          >
            {t('nav.availability')}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-quotes"
            aria-controls="panel-quotes"
            aria-selected={tab === 'quotes'}
            onClick={() => setTab('quotes')}
          >
            {t('nav.my_quotes')}
          </button>
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'availability' ? (
            <AvailabilityPanel
              onQuote={(p, el) => {
                returnFocus.current = el;
                setQuote(p);
              }}
              onOpenReservation={(id, el) => {
                returnFocus.current = el;
                setDrawer(id);
              }}
            />
          ) : (
            <QuotesList
              onOpen={(q, el) => {
                returnFocus.current = el;
                setQuote({ quote: q });
              }}
              onOpenReservation={(id, el) => {
                returnFocus.current = el;
                setDrawer(id);
              }}
            />
          )}
        </div>
      </Page>
      {quote ? (
        <QuoteDialog
          prefill={quote}
          onClose={() => {
            setQuote(null);
            restore();
          }}
          onOpenReservation={(id) => {
            setQuote(null);
            setDrawer(id);
          }}
        />
      ) : null}
      {drawer ? (
        <ReservationDrawer
          reservationId={drawer}
          onClose={() => {
            setDrawer(null);
            restore();
          }}
        />
      ) : null}
    </>
  );
}

function AvailabilityPanel({
  onQuote,
  onOpenReservation,
}: {
  onQuote: (p: QuotePrefill, el: HTMLElement) => void;
  onOpenReservation: (id: string, el: HTMLElement) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { online } = useOnline();
  const catalog = useCatalog(propertyId);
  const now = useNow(60_000);
  const today = todayLocal();
  const [arrival, setArrival] = useState(addDays(today, 1));
  const [nights, setNights] = useState(2);
  const [adults, setAdults] = useState(2);
  const [result, setResult] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const past = arrival < today;

  const search = async (a = arrival) => {
    if (a < today || nights < 1) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.searchAvailability(
        { propertyId },
        { arrival: a, departure: addDays(a, nights), adults },
      );
      setResult(r.data);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void search();
    // First search with the defaults only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rack = useResource(
    async () => (await api.getRack({ propertyId }, { from: addDays(today, -2), days: 14 })).data,
    [propertyId],
  );
  useLiveReload(propertyId, rack.reload);
  const room = (id: string) => catalog.rooms.find((r) => r.id === id);

  return (
    <>
      {!online ? <Alert tone="warn">{t('sale.offline')}</Alert> : null}
      <form
        className="g-4"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <Field label={t('sale.arrival')} error={past ? t('booking.error.past_date') : undefined}>
          {(p) => (
            <input
              {...p}
              className="input"
              type="date"
              min={today}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('sale.nights')}>
          {(p) => (
            <input
              {...p}
              className="input"
              type="number"
              min={1}
              max={90}
              value={nights}
              onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
            />
          )}
        </Field>
        <Field label={t('occ.adults')}>
          {(p) => (
            <select
              {...p}
              className="input"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="field" style={{ alignSelf: 'end' }}>
          <Button type="submit" variant="pri" busy={busy} disabled={past || !online}>
            {t('shell.search_label')}
          </Button>
        </div>
      </form>

      {error ? (
        <ErrorBlock titleKey="sale.error_title" error={error} onRetry={() => void search()} />
      ) : null}
      {result && !error ? (
        result.alternatives.length ? (
          <>
            <p className="li-s" role="status">
              {t('sale.avail_count', {
                n: result.alternatives.length,
                from: dayMonth(result.arrival),
                to: dayMonth(result.departure),
              })}
            </p>
            <ul className="list">
              {result.alternatives.map((a) => {
                const r = room(a.roomId);
                return (
                  <li key={a.roomId}>
                    <div className="li">
                      <span className="roomno">{a.roomNo}</span>
                      <span className="grow">
                        <span className="li-t">{r?.name}</span>
                        <br />
                        <span className="li-s">
                          {t('sale.room_meta', {
                            base: r?.baseOccupancy ?? '–',
                            max: r?.maxOccupancy ?? '–',
                          })}
                        </span>
                      </span>
                      <Chip tone="ok">{t('sale.free')}</Chip>
                      <Button
                        size="sm"
                        disabled={!online}
                        onClick={(e) =>
                          onQuote(
                            { roomId: a.roomId, arrivalDate: result.arrival, nights, adults },
                            e.currentTarget,
                          )
                        }
                      >
                        {t('sale.quote_title')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="state">
            <h3>{t('sale.none_title')}</h3>
            <p>
              {t('sale.none_body', {
                dates: `${dayMonth(addDays(result.arrival, 1))} → ${dayMonth(addDays(result.departure, 1))}`,
              })}
            </p>
            <Button
              onClick={() => {
                const next = addDays(arrival, 1);
                setArrival(next);
                void search(next);
              }}
            >
              {t('sale.try_dates')}
            </Button>
          </div>
        )
      ) : null}

      <h2 className="label-h" style={{ margin: '20px 0 8px' }}>
        {t('nav.availability')} · {t('rack.by_room')}
      </h2>
      {rack.state.status === 'error' && !rack.state.data ? (
        <ErrorBlock titleKey="fo.rack.error_title" error={rack.state.error} onRetry={rack.reload} />
      ) : !rack.state.data ? (
        <LoadingBlock />
      ) : (
        <RackGrid
          rack={rack.state.data}
          rooms={rack.state.data.rooms}
          mode="availability"
          now={now}
          label={t('nav.availability')}
          canCreate={(r: RackRoom, date) =>
            online && r.isSellable !== false && date >= rack.state.data!.today
          }
          onOpenBar={(bar: RackBarX, el) =>
            bar.reservationId && onOpenReservation(bar.reservationId, el)
          }
          onEmptyCell={(r, date, el) =>
            onQuote({ roomId: r.roomId, arrivalDate: date, nights: 2, adults: 2 }, el)
          }
        />
      )}
    </>
  );
}

function QuotesList({
  onOpen,
  onOpenReservation,
}: {
  onOpen: (q: Quote, el: HTMLElement) => void;
  onOpenReservation: (id: string, el: HTMLElement) => void;
}) {
  const { t, vnd, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const catalog = useCatalog(propertyId);
  const { roles } = useSession();
  const { state, reload } = useResource(
    async () => (await api.listQuotes({ propertyId })).data.data,
    [propertyId, roles.join()],
  );
  if (state.status === 'error' && !state.data)
    return (
      <ErrorBlock titleKey="common.error_generic_title" error={state.error} onRetry={reload} />
    );
  if (!state.data) return <LoadingBlock />;
  const roomNo = (id?: string) => catalog.rooms.find((r) => r.id === id)?.roomNo ?? '';
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">{t('nav.my_quotes')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('lsm.col_code')}</th>
            <th scope="col">{t('rooms.col_room')}</th>
            <th scope="col">{t('rsv.dates')}</th>
            <th scope="col" className="r">
              {t('bk.total')}
            </th>
            <th scope="col">{t('users.col_status')}</th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((q) => (
            <tr key={q.id}>
              <td>
                <button
                  type="button"
                  className="btn ghost sm mono"
                  onClick={(e) => onOpen(q, e.currentTarget)}
                >
                  {q.code}
                </button>
              </td>
              <td>{roomNo(q.roomId)}</td>
              <td>
                {q.arrivalDate ? dayMonth(q.arrivalDate) : ''} ·{' '}
                {t('booking.field.nights', { n: q.nights ?? 0 })}
              </td>
              <td className="r num">{vnd(q.totalVnd ?? 0)}</td>
              <td>
                {q.status === 'active' ? (
                  <Chip tone="ok">{t('sale.quote_active')}</Chip>
                ) : q.status === 'converted' && q.convertedReservationId ? (
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={(e) => onOpenReservation(q.convertedReservationId!, e.currentTarget)}
                  >
                    {t('status.booking.hold')}
                  </button>
                ) : (
                  <Chip>{t('sale.quote_expires', { time: dateTime(q.expiresAt) })}</Chip>
                )}
              </td>
            </tr>
          ))}
          {state.data.length === 0 ? (
            <tr>
              <td colSpan={5} className="li-s">
                –
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
