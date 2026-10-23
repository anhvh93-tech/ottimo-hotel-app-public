import type { Rack, RackRoom } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Icon, Seg } from '@ottimo/ui';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { useBusinessDay } from '../../app/businessDay';
import { timeHHmm, weekdayDate } from '../../app/dates';
import { useLiveReload } from '../../app/live';
import { STATUS_KEY, addDays, channelName, dayMonth } from '../../app/reservations';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { BookingDialog, type BookingPrefill } from '../booking/BookingDialog';
import { LongStayDialog, type LongStayPrefill } from '../booking/LongStayDialog';
import { ReservationDrawer } from '../reservations/ReservationDrawer';
import { RackGrid } from './RackGrid';
import { oooText, type RackBarX } from './rackModel';

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const DAYS = 14;

function isTyping(el: Element | null) {
  return (
    !!el &&
    (el.matches('input,textarea,select,[contenteditable="true"]') ||
      !!el.closest('[role="dialog"],[role="alertdialog"]'))
  );
}

/**
 * H08 Sơ đồ phòng (S03; US-016, US-019, US-139, US-017 AC5a). FD+ get the 14-night grid with the red
 * "Chưa gán căn" lane on top, a table view (also the screen-reader alternative of the grid) and
 * booking from an empty night; housekeeping / maintenance get the masked room list of H08 8.4 (no
 * guest name, channel or price – the API does not send them). Kept current by SSE / refetch.
 */
export function RackPage() {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const fd = session.roles.some((r) => FD_PLUS.includes(r));
  const today = useBusinessDay(); // BR-010 (night window – BUG-R2-211)
  const [from, setFrom] = useState(() => addDays(today, -2));
  const { state, reload } = useResource(
    async () => (await api.getRack({ propertyId }, { from, days: DAYS })).data,
    [propertyId, from],
  );
  const live = useLiveReload(propertyId, reload);
  const rack = state.data;

  return (
    <>
      <Topbar
        title={t('fo.rack.title')}
        sub={t('shell.subtitle', {
          property: session.property?.name ?? '',
          date: weekdayDate(locale),
        })}
      />
      <Page>
        {live.stale && state.status === 'ready' ? (
          <Alert tone="warn" icon="offline" role="status">
            {t('fo.rack.stale', { time: timeHHmm(state.loadedAt) })}
          </Alert>
        ) : null}
        {fd ? (
          <DeskRack
            rack={rack}
            state={state}
            reload={reload}
            from={from}
            setFrom={setFrom}
            today={rack?.today ?? today}
          />
        ) : (
          <HousekeepingRack rack={rack} state={state} reload={reload} />
        )}
      </Page>
    </>
  );
}

type RackState = ReturnType<typeof useResource<Rack>>['state'];

function DeskRack({
  rack,
  state,
  reload,
  from,
  setFrom,
  today,
}: {
  rack: Rack | undefined;
  state: RackState;
  reload: () => void;
  from: string;
  setFrom: (v: string) => void;
  today: string;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { online } = useOnline();
  const catalog = useCatalog(propertyId);
  const now = useNow(60_000);
  const narrow = useMedia('(max-width: 767px)');
  const [view, setView] = useState<'grid' | 'list'>(narrow ? 'list' : 'grid');
  const [group, setGroup] = useState('');
  const [drawer, setDrawer] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingPrefill | null>(null);
  const [longStay, setLongStay] = useState<LongStayPrefill | null>(null);
  const [todaySignal, setTodaySignal] = useState(0);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (narrow) setView('list');
  }, [narrow]);

  // H08 shortcuts: T = today, N = new booking (R = rack is global in AppShell).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(document.activeElement)) return;
      if (e.key === 't' || e.key === 'T') {
        setFrom(addDays(today, -2));
        setTodaySignal((n) => n + 1);
      } else if ((e.key === 'n' || e.key === 'N') && online) {
        e.preventDefault();
        returnFocus.current = document.activeElement as HTMLElement | null;
        setBooking({});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [today, online, setFrom]);

  const roomNames = useMemo(
    () => Object.fromEntries(catalog.rooms.map((r) => [r.id, r.name ?? ''])),
    [catalog.rooms],
  );
  const groups = useMemo(() => {
    return [
      ...new Set((rack?.rooms ?? []).map((r) => r.roomGroupCode).filter(Boolean)),
    ] as string[];
  }, [rack]);
  const groupNames = useRoomGroupNames(propertyId);
  const rooms = (rack?.rooms ?? []).filter((r) => !group || r.roomGroupCode === group);
  const unassigned = (rack?.unassigned ?? []) as RackBarX[];
  const noBars = !!rack && rack.rooms.every((r) => r.bars.length === 0) && unassigned.length === 0;

  const canCreate = (room: RackRoom, date: string) =>
    online && room.isSellable !== false && date >= (rack?.today ?? today);
  const openBar = (bar: RackBarX, el: HTMLElement | null) => {
    returnFocus.current = el;
    if (bar.reservationId) setDrawer(bar.reservationId);
  };
  const restoreFocus = () => {
    const el = returnFocus.current;
    setTimeout(() => el?.focus?.(), 0);
  };

  return (
    <>
      <div className="rack-tools">
        <div className="row" role="group" aria-label={t('booking.field.dates')}>
          <Button
            className="icon-btn"
            aria-label={t('rack.prev')}
            onClick={() => setFrom(addDays(from, -7))}
          >
            ‹
          </Button>
          <b className="num" aria-live="polite">
            {t('rack.range_label', {
              from: dayMonth(from),
              to: `${dayMonth(addDays(from, DAYS - 1))}/${addDays(from, DAYS - 1).slice(0, 4)}`,
            })}
          </b>
          <Button
            className="icon-btn"
            aria-label={t('rack.next')}
            onClick={() => setFrom(addDays(from, 7))}
          >
            ›
          </Button>
          <Button
            size="sm"
            aria-keyshortcuts="T"
            onClick={() => {
              setFrom(addDays(today, -2));
              setTodaySignal((n) => n + 1);
            }}
          >
            {t('fo.rack.today')}
          </Button>
        </div>
        <Seg
          label={t('rack.view_label')}
          value={view}
          onChange={setView}
          options={[
            { value: 'grid', label: t('rack.view_grid') },
            { value: 'list', label: t('rack.view_list') },
          ]}
        />
        <label className="row tight caption">
          <span>{t('rack.filter_group')}</span>
          <select className="input auto-w" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">{t('rack.all_groups')}</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {groupNames[g] ?? g}
              </option>
            ))}
          </select>
        </label>
        <span className="grow" />
        <Button icon="calendar" disabled={!online} onClick={() => setLongStay({})}>
          {t('lsm.title')}
        </Button>
        <Button
          variant="pri"
          icon="plus"
          disabled={!online}
          aria-keyshortcuts="N"
          onClick={(e) => {
            returnFocus.current = e.currentTarget;
            setBooking({});
          }}
        >
          {t('bk.new_cta')}
        </Button>
      </div>

      {!online ? (
        // H08: say why booking is locked offline (anti double-booking, BR-906).
        <Alert tone="warn" icon="offline" role="status">
          {t('rack.offline', { time: timeHHmm(new Date()) })}
        </Alert>
      ) : null}

      {state.status === 'error' && !rack ? (
        <ErrorBlock titleKey="fo.rack.error_title" error={state.error} onRetry={reload} />
      ) : !rack ? (
        <LoadingBlock rows={6} />
      ) : (
        <>
          {unassigned.length === 1 ? (
            // H08: one conflict → its own title (channel, code, guest) + Gán căn for that booking.
            <Alert
              tone="bad"
              title={t('rack.conflict_title', {
                channel: channelName(catalog.channels, unassigned[0]!.channelCode),
                code: unassigned[0]!.reservationCode ?? '',
                guest: unassigned[0]!.guestDisplayName ?? '',
              })}
              actions={
                <Button size="sm" onClick={(e) => openBar(unassigned[0]!, e.currentTarget)}>
                  {t('fo.rack.assign_room')}
                </Button>
              }
            >
              {t('fo.rack.unassigned_help')}
            </Alert>
          ) : unassigned.length > 1 ? (
            <Alert tone="bad" title={t('today.unassigned_title', { n: unassigned.length })}>
              <ul className="list-plain">
                {unassigned.map((b) => (
                  <li key={b.reservationId ?? b.from} className="mb-4">
                    {t('rack.conflict_title', {
                      channel: channelName(catalog.channels, b.channelCode),
                      code: b.reservationCode ?? '',
                      guest: b.guestDisplayName ?? '',
                    })}{' '}
                    · {dayMonth(b.from)} → {dayMonth(b.to)}{' '}
                    <Button size="sm" onClick={(e) => openBar(b, e.currentTarget)}>
                      {t('fo.rack.assign_room')}
                    </Button>
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}
          {noBars ? (
            <div className="state">
              <div className="ill">
                <Icon name="rack" />
              </div>
              <h3>{t('fo.rack.empty_title')}</h3>
              <p>{t('fo.rack.empty_body')}</p>
            </div>
          ) : null}
          {view === 'grid' ? (
            <>
              <RackGrid
                rack={rack}
                rooms={rooms}
                roomNames={roomNames}
                channels={catalog.channels}
                mode="full"
                now={now}
                label={`${t('fo.rack.title')} ${dayMonth(rack.from)} – ${dayMonth(addDays(rack.from, rack.days - 1))}`}
                canCreate={canCreate}
                onOpenBar={openBar}
                onEmptyCell={(room, date, el) => {
                  returnFocus.current = el;
                  setBooking({ roomId: room.roomId, arrivalDate: date });
                }}
                focusTodaySignal={todaySignal}
              />
            </>
          ) : narrow ? (
            <RackMobileList
              rack={rack}
              rooms={rooms}
              unassigned={unassigned}
              channels={catalog.channels}
              onOpen={(id, el) => {
                returnFocus.current = el;
                setDrawer(id);
              }}
            />
          ) : (
            <RackTable
              rack={rack}
              rooms={rooms}
              roomNames={roomNames}
              unassigned={unassigned}
              channels={catalog.channels}
              onOpen={(id, el) => {
                returnFocus.current = el;
                setDrawer(id);
              }}
            />
          )}
          <Legend />
        </>
      )}

      {drawer ? (
        <ReservationDrawer
          reservationId={drawer}
          onClose={() => {
            setDrawer(null);
            restoreFocus();
          }}
        />
      ) : null}
      {booking ? (
        <BookingDialog
          prefill={booking.roomId ? booking : undefined}
          onClose={() => {
            setBooking(null);
            restoreFocus();
          }}
          onCreated={(r) => {
            setBooking(null);
            setDrawer(r.id);
          }}
          onLongStay={(p) => {
            setBooking(null);
            setLongStay(p);
          }}
        />
      ) : null}
      {longStay ? (
        <LongStayDialog
          prefill={longStay.roomId ? longStay : undefined}
          onClose={() => {
            setLongStay(null);
            restoreFocus();
          }}
          onCreated={(r) => {
            setLongStay(null);
            setDrawer(r.id);
          }}
          onShortStay={() => {
            setLongStay(null);
            setBooking({});
          }}
        />
      ) : null}
    </>
  );
}

/** "Danh sách" view = the screen-reader alternative of the grid (H08 a11y) and the phone layout (8.3). */
function RackTable({
  rack,
  rooms,
  roomNames,
  unassigned,
  channels,
  onOpen,
}: {
  rack: Rack;
  rooms: RackRoom[];
  roomNames: Record<string, string>;
  unassigned: RackBarX[];
  channels: ReturnType<typeof useCatalog>['channels'];
  onOpen: (id: string, el: HTMLElement) => void;
}) {
  const { t } = useI18n();
  const end = addDays(rack.from, rack.days);
  const items = (bars: RackBarX[]) =>
    bars
      .filter((b) => b.to > rack.from && b.from < end)
      .sort((a, b) => a.from.localeCompare(b.from));
  const label = (b: RackBarX) =>
    b.kind === 'ooo'
      ? oooText(t, b.label)
      : [
          b.guestDisplayName,
          b.kind === 'long_stay'
            ? t('status.booking.long_term')
            : t(STATUS_KEY[b.kind as keyof typeof STATUS_KEY] ?? 'status.booking.confirmed'),
          `${dayMonth(b.from)} → ${dayMonth(b.to)}`,
          channelName(channels, b.channelCode),
        ]
          .filter(Boolean)
          .join(' · ');
  const entry = (b: RackBarX, i: number) => (
    <li key={`${b.from}-${i}`} className="mb-4">
      {b.reservationId ? (
        <button
          type="button"
          className="btn ghost sm"
          onClick={(e) => onOpen(b.reservationId!, e.currentTarget)}
        >
          {label(b)}
        </button>
      ) : (
        <span>{label(b)}</span>
      )}{' '}
      {b.externalContract ? <Chip>{t('rack.manual_badge')}</Chip> : null}{' '}
      {b.extraGuestCount ? (
        <Chip tone="info" icon="sofa">
          {t('occ.kit_chip', { n: b.extraGuestCount })}
        </Chip>
      ) : null}
    </li>
  );
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">
          {t('rack.by_room')} · {dayMonth(rack.from)} –{' '}
          {dayMonth(addDays(rack.from, rack.days - 1))}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('rack.col_room')}</th>
            <th scope="col">{t('rack.col_status')}</th>
            <th scope="col">{t('rack.col_bookings')}</th>
          </tr>
        </thead>
        <tbody>
          {unassigned.length ? (
            <tr>
              <th scope="row">{t('fo.rack.unassigned_lane', { n: unassigned.length })}</th>
              <td>
                <Chip tone="bad" icon="alert">
                  {t('rsv.conflict_chip')}
                </Chip>
              </td>
              <td>
                <ul className="list-none">{items(unassigned).map(entry)}</ul>
              </td>
            </tr>
          ) : null}
          {rooms.map((room) => (
            <tr key={room.roomId}>
              <th scope="row">
                <span className="roomno">{room.roomNo}</span> {roomNames[room.roomId]}
              </th>
              <td>
                {t(`status.room.${room.roomStatus}`)}
                {room.isSellable === false ? (
                  <>
                    {' '}
                    <Chip tone="bad">{t('rack.off_sale')}</Chip>
                  </>
                ) : null}
              </td>
              <td>
                {items(room.bars as RackBarX[]).length ? (
                  <ul className="list-none">{items(room.bars as RackBarX[]).map(entry)}</ul>
                ) : (
                  <span className="li-s">{t('sale.free')}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * H08 8.3 – phone (< 768 px): one card row per room (current / next booking + chips), 44 px targets;
 * the desktop "Danh sách" table stays as the screen-reader alternative of the grid.
 */
function RackMobileList({
  rack,
  rooms,
  unassigned,
  channels,
  onOpen,
}: {
  rack: Rack;
  rooms: RackRoom[];
  unassigned: RackBarX[];
  channels: ReturnType<typeof useCatalog>['channels'];
  onOpen: (id: string, el: HTMLElement) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="rack-list">
      {unassigned.length ? (
        <Alert
          tone="bad"
          actions={
            unassigned[0]?.reservationId ? (
              <Button
                size="sm"
                onClick={(e) => onOpen(unassigned[0]!.reservationId!, e.currentTarget)}
              >
                {t('fo.rack.assign_room')}
              </Button>
            ) : undefined
          }
        >
          {t('rack.unassigned_short', { n: unassigned.length })}
        </Alert>
      ) : null}
      <div className="grp-h">{t('rack.by_room')}</div>
      <ul className="list">
        {rooms.map((room) => {
          const bars = (room.bars as RackBarX[])
            .filter((b) => b.to > rack.today && b.kind !== 'checked_out')
            .sort((a, b) => a.from.localeCompare(b.from));
          const main = bars.find((b) => b.kind !== 'ooo');
          const ooo = bars.find((b) => b.kind === 'ooo');
          const hold = bars.find((b) => b.kind === 'hold' && b !== main);
          const body = (
            <>
              <span className="roomno">{room.roomNo}</span>
              <span className="grow">
                <span className="li-t">
                  {main
                    ? [
                        main.kind === 'long_stay' ? t('rack.long_prefix') : null,
                        main.guestDisplayName,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : t(`status.room.${room.roomStatus}`)}
                  {main && main.from === rack.today ? ` · ${t('rack.note.arrives_today')}` : ''}
                </span>
                {main ? (
                  <>
                    <br />
                    <span className="li-s">
                      {dayMonth(main.from)} → {dayMonth(main.to)}
                      {main.channelCode ? ` · ${channelName(channels, main.channelCode)}` : ''}
                    </span>
                  </>
                ) : null}
                <br />
                {main?.externalContract ? <Chip>{t('rack.manual_badge')}</Chip> : null}
                {main?.extraGuestCount ? (
                  <Chip tone="info" icon="sofa">
                    {t('occ.kit_chip', { n: main.extraGuestCount })}
                  </Chip>
                ) : null}
                {hold ? (
                  <Chip tone="warn" icon="hourglass">
                    {hold.guestDisplayName} {dayMonth(hold.from)}–{dayMonth(hold.to)}
                  </Chip>
                ) : null}
                {ooo ? (
                  <Chip tone="bad">{t('rack.ooo_until', { date: dayMonth(ooo.to) })}</Chip>
                ) : null}
                {room.isSellable === false ? <Chip tone="bad">{t('rack.off_sale')}</Chip> : null}
              </span>
            </>
          );
          return (
            <li key={room.roomId}>
              {main?.reservationId ? (
                <button
                  type="button"
                  className="rowlink"
                  onClick={(e) => onOpen(main.reservationId!, e.currentTarget)}
                >
                  {body}
                </button>
              ) : (
                <div className="li">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Legend() {
  const { t } = useI18n();
  const sw = (cls: string, key: string, extra?: ReactNode) => (
    <span className="sw">
      <span className={`bar ${cls}`} aria-hidden="true" />
      <span>{t(key)}</span>
      {extra}
    </span>
  );
  return (
    <>
      <div className="legend" role="note" aria-label={t('fo.rack.legend')}>
        <span className="label-h">{t('fo.rack.legend')}</span>
        {sw('in_house', 'status.booking.in_house')}
        {sw('confirmed', 'status.booking.confirmed')}
        {sw(
          'long_stay',
          'status.booking.long_term',
          <>
            {' '}
            <Chip>{t('rack.manual_badge')}</Chip>{' '}
            <span className="li-s">{t('rack.manual_legend')}</span>
          </>,
        )}
        {sw('hold', 'status.booking.hold')}
        <span className="sw">
          <span className="bar hold urgent" aria-hidden="true" />
          <span>{t('rack.legend_hold_urgent', { hours: 2 })}</span>
        </span>
        {sw('checked_out', 'status.booking.checked_out')}
        {sw('ooo', 'status.block.ooo')}
        {sw('conflict', 'rack.legend_unassigned')}
        <span className="sw">
          <Icon name="sofa" size="sm" />
          <span>{t('rack.legend_kit')}</span>
        </span>
      </div>
      <p className="li-s mt-8">{t('rack.hidden_note')}</p>
    </>
  );
}

/**
 * H08 8.4 – housekeeping / maintenance: room status + "guest arriving today/tomorrow" + extra-guest
 * kits, never guest names, channels or prices (`x-scope: all_masked`).
 */
function HousekeepingRack({
  rack,
  state,
  reload,
}: {
  rack: Rack | undefined;
  state: RackState;
  reload: () => void;
}) {
  const { t } = useI18n();
  if (state.status === 'error' && !rack)
    return <ErrorBlock titleKey="fo.rack.error_title" error={state.error} onRetry={reload} />;
  if (!rack) return <LoadingBlock rows={6} />;
  const tomorrow = addDays(rack.today, 1);
  return (
    <ul className="list" aria-label={t('nav.rooms_status')}>
      {rack.rooms.map((room) => {
        const bars = room.bars as RackBarX[];
        const arriving = bars.find((b) => b.from === rack.today && b.kind !== 'ooo');
        const arrivingTomorrow = bars.find((b) => b.from === tomorrow && b.kind !== 'ooo');
        const ooo = bars.find((b) => b.kind === 'ooo' && b.from <= rack.today && b.to > rack.today);
        const kit = arriving?.extraGuestCount ?? 0;
        return (
          <li key={room.roomId}>
            <div className="li">
              <span className="roomno">{room.roomNo}</span>
              <div className="grow">
                <div className="li-t">{t(`status.room.${room.roomStatus}`)}</div>
                {ooo ? (
                  <div className="li-s">{t('rack.reopen', { date: dayMonth(ooo.to) })}</div>
                ) : arriving ? (
                  <div className="li-s">{t('fo.rack.arriving_today')}</div>
                ) : arrivingTomorrow ? (
                  <div className="li-s">{t('fo.rack.arriving_tomorrow')}</div>
                ) : null}
                {kit > 0 ? (
                  <Chip tone="info" icon="sofa">
                    {t('rack.hk.kit', { n: kit })}
                  </Chip>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function useMedia(query: string): boolean {
  const get = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [query]);
  return match;
}

/** Room-group code → name for the "Nhóm căn" filter (listRoomGroups; falls back to the code). */
function useRoomGroupNames(propertyId: string): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    let stale = false;
    api.listRoomGroups({ propertyId }).then(
      (r) => !stale && setNames(Object.fromEntries(r.data.data.map((g) => [g.code, g.name]))),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [propertyId]);
  return names;
}
