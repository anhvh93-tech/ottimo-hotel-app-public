import type {
  ArrivalItem,
  ArrivalsDepartures,
  DepartureItem,
  DepartureReminderState,
  ReservationSummary,
  TonightKpi,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, StateView, type IconName } from '@ottimo/ui';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../app/catalog';
import { timeHHmm, weekdayDate } from '../app/dates';
import { Code } from '../app/mono';
import { channelName, remaining } from '../app/reservations';
import { findRoom } from '../app/rooms';
import { Page, Topbar } from '../components/AppShell';
import { useNow } from '../hooks/useNow';
import { useOnline } from '../hooks/useOnline';
import type { ResourceState } from '../hooks/useResource';
import { NAV, isVisible } from '../session/nav';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { AttentionBlock, SkeletonRows, formatPct } from './dashboard/parts';
import { GuestRequestsCard } from './ops/GuestRequests';
import { useDashboard } from './dashboard/useDashboard';

/** US-031 AC2 / EP03-05 4.4: same-room arrival first, then overdue > call > waiting > replied. */
const DEP_ORDER: Record<DepartureReminderState, number> = {
  overdue: 0,
  call_needed: 1,
  reminded_waiting: 2,
  replied: 3,
  checked_out: 4,
};
const DEP_CHIP: Record<
  DepartureReminderState,
  { key: string; tone: 'bad' | 'warn' | 'neutral' | 'ok' }
> = {
  overdue: { key: 'stay.card_overdue', tone: 'bad' },
  call_needed: { key: 'stay.card_call', tone: 'warn' },
  reminded_waiting: { key: 'stay.card_waiting', tone: 'neutral' },
  replied: { key: 'today.dep_replied', tone: 'ok' },
  checked_out: { key: 'status.booking.checked_out', tone: 'neutral' },
};
const REG_CHIP: Partial<
  Record<string, { key: string; tone: 'ok' | 'warn' | 'ink'; icon: IconName }>
> = {
  none: { key: 'today.no_docs', tone: 'warn', icon: 'id' },
  pre: { key: 'today.prechecked', tone: 'ok', icon: 'check' },
  partial: { key: 'status.reg.partial', tone: 'warn', icon: 'id' },
  review: { key: 'status.reg.review', tone: 'warn', icon: 'id' },
  scanned: { key: 'status.reg.scanned', tone: 'ink', icon: 'id' },
};

/**
 * H03 Hôm nay – the front desk's default screen (US-001 AC1, US-010, US-011, US-012, US-031; S4-31). Order:
 * legal/money first ("Cần chú ý"), then arrivals / departures / holds arriving. Every block loads and fails
 * on its own; SSE re-reads only what changed (EP01 §4). FD sees occupancy but no revenue (US-003 AC4 – the API
 * has no money field here). "Today" = business date from the API (BR-010), never the desk clock.
 */
export function TodayPage() {
  const { t, locale } = useI18n();
  const session = useSession();
  const propertyId = usePropertyId();
  const tz = session.property?.timezone;
  const d = useDashboard(propertyId, { board: true });
  const rack = NAV.find((n) => n.id === 'rack')!;
  const canRack = isVisible(rack, {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  });
  const board = d.board!;
  const attnCount = d.attention.data?.length;
  const nothing =
    board.data &&
    d.attention.data &&
    !board.data.arrivals.length &&
    !board.data.departures.length &&
    !board.data.holdsArrivingToday.length &&
    !d.attention.data.length &&
    !(d.requests?.data ?? []).some((r) =>
      ['new', 'acknowledged', 'in_progress'].includes(r.status),
    );
  const loadedAt = d.kpi.status === 'ready' ? d.kpi.loadedAt : undefined;

  return (
    <>
      <Topbar
        title={t('today.title')}
        sub={t('shell.subtitle', {
          property: session.property?.name ?? '',
          date: d.kpi.data
            ? weekdayDate(locale, tz, new Date(`${d.kpi.data.businessDate}T12:00:00+07:00`))
            : weekdayDate(locale, tz),
        })}
      />
      <Page>
        {d.stale ? (
          <Alert tone="warn" icon="offline">
            {t('fo.rack.stale', { time: timeHHmm(loadedAt ?? new Date(), tz) })}
          </Alert>
        ) : null}
        <KpiStrip state={d.kpi} onRetry={d.reload.kpi} canRack={canRack} />
        {nothing ? (
          <StateView
            icon="sparkle"
            title={t('today.empty_title')}
            action={
              canRack ? (
                <Link className="btn" to={rack.path}>
                  {t('today.open_rack')}
                </Link>
              ) : undefined
            }
          >
            {t('today.empty_body')}
          </StateView>
        ) : (
          <div className="cols-2 mt-16">
            <section aria-labelledby="today-attn">
              <h2 className="label-h mb-8" id="today-attn">
                {t('today.attention')}{' '}
                {attnCount ? <span className="badge">{attnCount}</span> : null}
              </h2>
              <AttentionBlock
                state={d.attention}
                onReload={d.reload.attention}
                emptyTitleKey="today.attention_empty"
              />
            </section>
            <div className="stack">
              <Board state={board} onRetry={d.reload.board} />
              <GuestRequestsCard state={d.requests!} onReload={d.reload.requests} />
            </div>
          </div>
        )}
      </Page>
    </>
  );
}

function KpiStrip({
  state,
  onRetry,
  canRack,
}: {
  state: ResourceState<TonightKpi>;
  onRetry: () => void;
  canRack: boolean;
}) {
  const { t, locale } = useI18n();
  const k = state.data;
  if (!k && state.status === 'error')
    return (
      <Alert
        tone="bad"
        title={t('ov.kpi_error')}
        actions={
          <Button size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      >
        {t('common.error_network_body')}
      </Alert>
    );
  if (!k) return <SkeletonRows rows={1} height={80} />;
  return (
    <div className="kpis">
      <Kpi label={t('today.kpi_in_house')} value={k.inHouse ?? 0} />
      <Kpi
        label={t('today.kpi_arrivals')}
        value={k.arrivals ?? 0}
        note={
          k.arrivalsCheckedIn !== undefined
            ? t('today.kpi_arrivals_note', { done: k.arrivalsCheckedIn })
            : undefined
        }
      />
      <Kpi
        label={t('today.kpi_departures')}
        value={k.departures ?? 0}
        note={
          k.departuresCheckedOut !== undefined
            ? t('today.kpi_departures_note', { done: k.departuresCheckedOut })
            : undefined
        }
      />
      <Kpi
        label={t('today.kpi_occupancy')}
        value={formatPct(locale, k.occupancyPct)}
        note={
          <>
            {t('today.kpi_occupancy_note', {
              sold: k.occupiedRooms,
              sellable: k.availableRoomsNet,
              blocked: k.oooRooms ?? 0,
            })}
            {k.holdOnlyRooms ? <div>{t('today.kpi_holds', { n: k.holdOnlyRooms })}</div> : null}
            {k.unassignedConflictReservations ? (
              <div>
                {canRack ? (
                  <Link to="/rack">
                    {t('today.kpi_unassigned', { n: k.unassignedConflictReservations })}
                  </Link>
                ) : (
                  t('today.kpi_unassigned', { n: k.unassignedConflictReservations })
                )}
              </div>
            ) : null}
          </>
        }
      />
    </div>
  );
}

export function Kpi({
  label,
  value,
  note,
  wide,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`card kpi${wide ? ' kpi-wide' : ''}`}>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      {note ? <div className="li-s">{note}</div> : null}
    </div>
  );
}

/** Arrivals / departures / holds arriving today (US-011, US-031, BR-404) – buttons from `allowedActions`. */
function Board({
  state,
  onRetry,
}: {
  state: ResourceState<ArrivalsDepartures>;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const b = state.data;
  if (!b && state.status === 'error')
    return (
      <Alert
        tone="bad"
        title={t('today.error_title')}
        actions={
          <Button size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      >
        {t('common.error_network_body')}
      </Alert>
    );
  if (!b) return <SkeletonRows rows={2} height={120} />;
  // Not checked in first, then by expected time (absent = the standard time), unassigned first.
  const arrivals = [...b.arrivals].sort(
    (x, y) =>
      Number(x.status === 'in_house') - Number(y.status === 'in_house') ||
      Number(!!x.roomNo) - Number(!!y.roomNo) ||
      (x.etaTime ?? '99').localeCompare(y.etaTime ?? '99'),
  );
  const departures = [...b.departures].sort(
    (x, y) =>
      Number(!y.hasArrivalSameRoomToday) - Number(!x.hasArrivalSameRoomToday) ||
      DEP_ORDER[x.reminderState ?? 'reminded_waiting'] -
        DEP_ORDER[y.reminderState ?? 'reminded_waiting'],
  );
  return (
    <>
      <section className="card" aria-labelledby="today-arr">
        <div className="card-h">
          <h2 id="today-arr">{t('today.arrivals', { n: arrivals.length })}</h2>
        </div>
        {arrivals.length ? (
          <ul className="list">
            {arrivals.map((r) => (
              <li key={r.id}>
                <ArrivalRow r={r} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="li-s">{t('today.arrivals_empty')}</p>
        )}
      </section>
      <section className="card" aria-labelledby="today-dep">
        <div className="card-h">
          <h2 id="today-dep">{t('today.departures', { n: departures.length })}</h2>
        </div>
        {departures.length ? (
          <ul className="list">
            {departures.map((r) => (
              <li key={r.id}>
                <DepartureRow r={r} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="li-s">{t('today.departures_empty')}</p>
        )}
      </section>
      {b.holdsArrivingToday.length ? (
        <section className="card" aria-labelledby="today-holds">
          <div className="card-h">
            <h2 id="today-holds">{t('fo.tabs.holds', { n: b.holdsArrivingToday.length })}</h2>
          </div>
          <ul className="list">
            {b.holdsArrivingToday.map((r) => (
              <li key={r.id}>
                <HoldRow r={r} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** Room number big + name under it (DS 11.3: staff see "401 · The Pine"); no room → conflict chip. */
function RoomCell({ roomNo }: { roomNo?: string | null }) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { rooms } = useCatalog(propertyId);
  if (!roomNo)
    return (
      <Chip tone="bad" icon="alert">
        {t('rsv.conflict_chip')}
      </Chip>
    );
  const name = findRoom(rooms, roomNo)?.name;
  return (
    <div>
      <div className="roomno">{roomNo}</div>
      {name ? <div className="li-s">{name}</div> : null}
    </div>
  );
}

function useRowMeta(r: ReservationSummary) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { channels } = useCatalog(propertyId);
  return [
    channelName(channels, r.channelCode),
    r.nights ? t('booking.field.nights', { n: r.nights }) : '',
  ].filter(Boolean);
}

function ArrivalRow({ r }: { r: ArrivalItem }) {
  const { t, money } = useI18n();
  const { deviceTrusted } = useSession();
  const { online } = useOnline();
  const meta = useRowMeta(r);
  const checkIn = r.allowedActions?.find((a) => a.event === 'check_in');
  const reg = REG_CHIP[String(r.registrationStatus ?? '')];
  const blockedDevice = !!checkIn?.requiresTrustedDevice && !deviceTrusted;
  return (
    <div className="li">
      <RoomCell roomNo={r.roomNo} />
      <div className="grow">
        <div className="li-t">
          <Link to={`/reservations/${r.id}`}>{r.guestDisplayName}</Link>
        </div>
        <div className="li-s">
          <Code>{r.code}</Code>
          {meta.length ? ` · ${meta.join(' · ')}` : ''}
          {r.etaTime ? ` · ${t('rsv.eta', { time: r.etaTime.slice(0, 5) })}` : ''}
        </div>
        <div className="row wrap mt-4">
          {r.status === 'in_house' ? (
            <Chip tone="ink" icon="bed">
              {t('status.booking.in_house')}
            </Chip>
          ) : reg ? (
            <Chip tone={reg.tone} icon={reg.icon}>
              {t(reg.key)}
            </Chip>
          ) : null}
          {r.status === 'confirmed' && (r.balanceDueVnd ?? 0) > 0 ? (
            <Chip tone="neutral" icon="bill">
              {t('today.balance_due', { amount: money(r.balanceDueVnd ?? 0) })}
            </Chip>
          ) : null}
        </div>
        {!r.roomNo && r.status === 'confirmed' ? (
          <p className="caption mt-4">{t('today.assign_first')}</p>
        ) : null}
        {checkIn && blockedDevice ? (
          <p className="caption mt-4" id={`arr-${r.id}-why`}>
            {t('device.blocked_title')}
          </p>
        ) : null}
      </div>
      {checkIn ? (
        !online || blockedDevice ? (
          <Button
            size="sm"
            aria-disabled="true"
            aria-describedby={blockedDevice ? `arr-${r.id}-why` : undefined}
            onClick={() => undefined}
          >
            {online ? t('drawer.action.check_in') : t('rsv.need_online')}
          </Button>
        ) : (
          <Link className="btn sm pri" to={`/reservations/${r.id}/check-in`}>
            {t('drawer.action.check_in')}
          </Link>
        )
      ) : r.status === 'confirmed' ? (
        <Link className="btn sm" to={`/reservations/${r.id}`}>
          {t('today.open_booking')}
        </Link>
      ) : null}
    </div>
  );
}

function DepartureRow({ r }: { r: DepartureItem }) {
  const { t } = useI18n();
  const { online } = useOnline();
  const meta = useRowMeta(r);
  const checkOut = r.allowedActions?.find((a) => a.event === 'check_out');
  const chip = DEP_CHIP[r.reminderState ?? 'reminded_waiting'];
  return (
    <div className="li">
      <RoomCell roomNo={r.roomNo} />
      <div className="grow">
        <div className="li-t">
          <Link to={`/reservations/${r.id}`}>{r.guestDisplayName}</Link>
        </div>
        <div className="li-s">
          <Code>{r.code}</Code>
          {meta.length ? ` · ${meta.join(' · ')}` : ''}
        </div>
        <div className="row wrap mt-4">
          <Chip tone={chip.tone} icon={chip.tone === 'neutral' ? 'clock' : undefined}>
            {t(chip.key)}
          </Chip>
          {r.hasArrivalSameRoomToday && r.status === 'in_house' ? (
            <Chip tone="warn" icon="bed">
              {t('today.same_room_arrival')}
            </Chip>
          ) : null}
        </div>
      </div>
      {checkOut ? (
        online ? (
          <Link className="btn sm pri" to={`/reservations/${r.id}/check-out`}>
            {t('drawer.action.check_out')}
          </Link>
        ) : (
          <Button size="sm" aria-disabled="true" onClick={() => undefined}>
            {t('rsv.need_online')}
          </Button>
        )
      ) : r.status === 'in_house' ? (
        <Link className="btn sm" to={`/reservations/${r.id}`}>
          {t('today.open_booking')}
        </Link>
      ) : null}
    </div>
  );
}

function HoldRow({ r }: { r: ReservationSummary }) {
  const { t, dateTime } = useI18n();
  const now = useNow(30_000);
  const left = remaining(r.holdExpiresAt, now);
  return (
    <div className="li">
      <RoomCell roomNo={r.roomNo} />
      <div className="grow">
        <div className="li-t">{r.guestDisplayName}</div>
        <div className="li-s">
          <Code>{r.code}</Code>
        </div>
        {left ? (
          <span className={`countdown ${left.ms < 2 * 3_600_000 ? 'bad' : 'warn'}`}>
            {t('today.hold_left', { h: left.h, m: left.m, at: dateTime(r.holdExpiresAt) })}
          </span>
        ) : null}
      </div>
      <Link className="btn sm" to={`/reservations/${r.id}`}>
        {t('today.open_booking')}
      </Link>
    </div>
  );
}
