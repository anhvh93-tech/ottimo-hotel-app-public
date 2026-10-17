import { Button, Icon, Skeleton, StateView } from '@ottimo/ui';
import { compareRoomNo, roomLabel, useI18n } from '@ottimo/i18n';
import { useMemo, useState } from 'react';
import { useHkData } from '../app/data';
import { effectiveRoomStatus } from '../app/overlay';
import { asRoom } from '../app/rooms';
import { href } from '../app/router';
import { arrivalText, inFilter, type RoomFilter } from '../app/tasks';
import { localDate } from '../app/time';
import { useQueue } from '../queue/QueueProvider';
import { CallDesk, QueuedChip, RoomNo, RoomStatusChip, TopBar, UpdatedAt } from '../ui/parts';

const FILTER_KEYS: Record<RoomFilter, string> = {
  all: 'hk.filter.all',
  dirty: 'hk.filter.dirty',
  occupied: 'hk.filter.occupied',
  ready: 'hk.filter.ready',
  ooo: 'hk.filter.ooo',
};

/** H19 19.2 – "Các căn": the 10 rooms, plain-sentence status, next arrival, filters (US-052). */
export function RoomsPage() {
  const { t } = useI18n();
  const data = useHkData();
  const { items } = useQueue();
  const [filter, setFilter] = useState<RoomFilter>('all');
  const today = localDate();

  const rooms = useMemo(
    () =>
      [...(data.rooms?.data ?? [])]
        .sort((a, b) => compareRoomNo(a.roomNo, b.roomNo))
        .map((r) => ({ room: r, eff: effectiveRoomStatus(r, items) })),
    [data.rooms, items],
  );
  const count = (f: RoomFilter) => rooms.filter((r) => inFilter(r.eff.value, f)).length;
  const shown = rooms.filter((r) => inFilter(r.eff.value, filter));

  return (
    <>
      <TopBar
        title={t('nav.rooms_status')}
        sub={<UpdatedAt savedAt={data.savedAt} fromCache={data.fromCache} />}
      />
      <div className="m-body">
        {data.status === 'loading' && !data.rooms ? (
          <div aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton height={56} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </div>
        ) : data.status === 'error' && !data.rooms ? (
          <StateView
            kind="error"
            title={t('hk.rooms_error_title')}
            action={
              <div className="hk-stack">
                <Button variant="pri" block className="xl" onClick={() => void data.refresh()}>
                  {t('common.retry')}
                </Button>
                <CallDesk block />
              </div>
            }
          >
            {t('hk.error_body')}
          </StateView>
        ) : (
          <>
            <div className="filters" role="group" aria-label={t('hk.filter_label')}>
              {(Object.keys(FILTER_KEYS) as RoomFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {t(FILTER_KEYS[f], { n: count(f) })}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <StateView
                icon="filter"
                title={t('hk.filter_empty_title')}
                action={
                  <button type="button" className="btn xl" onClick={() => setFilter('all')}>
                    {t('hk.filter.show_all')}
                  </button>
                }
              >
                {t('hk.filter_empty_body', { n: rooms.length })}
              </StateView>
            ) : (
              <ul className="hk-list">
                {shown.map(({ room, eff }) => {
                  const arrival = arrivalText(room, t, today);
                  return (
                    <li key={room.roomId}>
                      <a
                        className="hk-card rowlink"
                        href={href({ name: 'room', roomId: room.roomId })}
                        aria-label={[
                          `${t('hk.wo.room')} ${roomLabel(asRoom(room), 'staff', { separator: ', ' })}`,
                          t(`hk.status.${eff.value}`),
                          arrival,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      >
                        <RoomNo no={room.roomNo} name={room.roomName} />
                        <span className="grow">
                          <RoomStatusChip status={eff.value} />
                          {eff.queued ? <QueuedChip /> : null}
                          <span className="meta">
                            {room.currentGuest ? (
                              <span>{t('hk.guest_first_name', { name: room.currentGuest })}</span>
                            ) : null}
                            {arrival ? <span>{arrival}</span> : null}
                          </span>
                        </span>
                        <Icon name="chevron" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
