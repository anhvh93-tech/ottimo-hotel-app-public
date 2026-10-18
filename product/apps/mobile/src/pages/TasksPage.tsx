import { Button, Icon, Skeleton, StateView } from '@ottimo/ui';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { Fragment, useMemo } from 'react';
import { useHkActions } from '../app/actions';
import type { HkTask, RoomStatusEntry } from '../app/api';
import { useHkData } from '../app/data';
import { effectiveRoomStatus, effectiveTaskStatus, eventsFor } from '../app/overlay';
import { asRoom, guestName } from '../app/rooms';
import { href, navigate } from '../app/router';
import type { StaffSession } from '../app/session';
import {
  arrivalText,
  CLEAN_TYPES,
  completeLabel,
  isKit,
  sortByPriority,
  taskGroup,
  refillText,
  taskTitle,
  type TaskGroup,
} from '../app/tasks';
import { hhmm, localDate } from '../app/time';
import { useQueue } from '../queue/QueueProvider';
import type { QueueItem } from '../queue/queue';
import { CallDesk, Chip, QueuedChip, RoomNo, RoomStatusChip, TopBar, UpdatedAt } from '../ui/parts';

const GROUPS: { id: TaskGroup; key: string }[] = [
  // UXR P-12: "first" also holds kits, urgent and timed tasks – the card says why (arrival, time), not the heading.
  { id: 'first', key: 'hk.grp.do_first' },
  { id: 'stay', key: 'hk.grp.stay' },
  { id: 'later', key: 'hk.grp.later' },
];

/** H19 19.1 – "Việc của tôi": today's tasks, one card = one room = one primary button (DS 6.18). */
export function TasksPage({ session }: { session: StaffSession }) {
  const { t } = useI18n();
  const data = useHkData();
  const { items, online } = useQueue();
  const today = localDate();

  const rooms = useMemo(() => {
    const m = new Map<string, RoomStatusEntry>();
    for (const r of data.rooms?.data ?? []) m.set(r.roomId, r);
    return m;
  }, [data.rooms]);

  const all = useMemo(() => {
    const tasks = sortByPriority(data.tasks?.data ?? []);
    return tasks.map((task) => {
      const st = effectiveTaskStatus(task, items);
      const room = rooms.get(task.roomId);
      const rs = room ? effectiveRoomStatus(room, items) : undefined;
      return {
        task,
        status: st,
        room,
        roomStatus: rs,
        group: taskGroup(task, st.value, rs?.value, room, today),
      };
    });
  }, [data.tasks, rooms, items, today]);
  const view = all.filter((v) => v.status.value !== 'cancelled');
  // UXR P-13: a task left out today ("Khách không muốn dọn", order changed…) stays visible with its reason.
  const cancelled = all.filter((v) => v.status.value === 'cancelled');

  const done = view.filter((v) => v.group === 'done');
  const total = data.tasks?.summary.total ?? view.length;
  const doneCount = Math.max(data.tasks?.summary.done ?? 0, done.length);

  return (
    <>
      <TopBar
        title={t('nav.my_tasks')}
        sub={<UpdatedAt savedAt={data.savedAt} fromCache={data.fromCache} />}
        right={
          data.tasks ? (
            <Chip tone="neutral">{t('hk.progress', { done: doneCount, total })}</Chip>
          ) : undefined
        }
      />
      <div className="m-body">
        {data.status === 'loading' && !data.tasks ? (
          <div aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton height={32} width="60%" />
            <Skeleton height={120} />
            <Skeleton height={120} />
          </div>
        ) : data.status === 'error' && !data.tasks ? (
          <StateView
            kind="error"
            title={t('hk.error_title')}
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
        ) : view.length === 0 ? (
          <StateView icon="check" title={t('hk.empty_title')}>
            {t('hk.empty_body')}
          </StateView>
        ) : (
          <>
            {GROUPS.map((g) => {
              const list = view.filter((v) => v.group === g.id);
              if (!list.length) return null;
              return (
                <Fragment key={g.id}>
                  <h2 className="grp-h">{t(g.key)}</h2>
                  {list.map((v) => (
                    <TaskCard
                      key={v.task.id}
                      session={session}
                      task={v.task}
                      queued={v.status.queued || Boolean(v.roomStatus?.queued)}
                      room={v.room}
                      roomStatus={v.roomStatus?.value}
                      roomQueued={Boolean(v.roomStatus?.queued)}
                      online={online}
                      later={g.id === 'later'}
                      today={today}
                    />
                  ))}
                </Fragment>
              );
            })}
            {done.length ? (
              <>
                <h2 className="grp-h">{t('hk.grp.done', { n: done.length })}</h2>
                {done.map((v) => (
                  <article
                    key={v.task.id}
                    className="hk-card done"
                    aria-labelledby={`done-${v.task.id}`}
                  >
                    <div className="hd">
                      <RoomNo no={v.task.roomNo} name={v.task.roomName} id={`done-${v.task.id}`} />
                      {v.status.queued ? <QueuedChip /> : null}
                    </div>
                    {/* P-13: the TASK that is done ("Bổ sung minibar – xong 09:26"), not the room status –
                        a refilled minibar in a room still to clean is not "the room is done". */}
                    <p className="li-s mt-4 m-0">
                      {v.task.doneAt
                        ? t('hk.task_done_at', {
                            task: taskTitle(v.task, t),
                            time: hhmm(v.task.doneAt),
                          })
                        : taskTitle(v.task, t)}
                    </p>
                  </article>
                ))}
              </>
            ) : null}
            {cancelled.length ? (
              <>
                <h2 className="grp-h">{t('hk.grp.cancelled', { n: cancelled.length })}</h2>
                {cancelled.map((v) => (
                  <article
                    key={v.task.id}
                    className="hk-card done"
                    aria-labelledby={`off-${v.task.id}`}
                  >
                    <div className="hd">
                      <RoomNo no={v.task.roomNo} name={v.task.roomName} id={`off-${v.task.id}`} />
                      {v.status.queued ? <QueuedChip /> : null}
                    </div>
                    <p className="li-s mt-4 m-0">
                      {[taskTitle(v.task, t), cancelReasonText(v.task, items, t)]
                        .filter(Boolean)
                        .join(' – ')}
                    </p>
                  </article>
                ))}
              </>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

function TaskCard({
  session,
  task,
  room,
  roomStatus,
  roomQueued,
  queued,
  later,
  today,
}: {
  session: StaffSession;
  task: HkTask;
  room?: RoomStatusEntry;
  roomStatus?: RoomStatusEntry['status'];
  roomQueued: boolean;
  queued: boolean;
  online: boolean;
  later: boolean;
  today: string;
}) {
  const { t } = useI18n();
  const act = useHkActions(session);
  const headId = `t-${task.id}`;
  const kit = isKit(task);
  const urgent =
    task.type === 'priority_clean' ||
    (kit && task.dueAt && Date.parse(task.dueAt) - Date.now() < 30 * 60_000);
  const events = room && roomStatus ? eventsFor(roomStatus, room.allowedEvents, roomQueued) : [];
  const cleaning = CLEAN_TYPES.includes(task.type);
  const stayover = task.type === 'stayover_clean' || task.type === 'long_stay_clean';
  const arrival = room ? arrivalText(room, t, today) : undefined;

  const start = async () => {
    if (!room || !roomStatus) return;
    await act.roomStatus(room, 'start_cleaning', roomStatus, task);
    navigate({ name: 'room', roomId: task.roomId });
  };

  let primary: JSX.Element;
  if (!cleaning) {
    // Kits, guest requests, minibar refill: one tap = done (queued, 10 s undo).
    primary = (
      <button
        type="button"
        className="btn pri xl block"
        onClick={() => void act.completeTask(task)}
      >
        <Icon name="check" />
        <span>{completeLabel(task, t)}</span>
      </button>
    );
  } else if (later) {
    primary = (
      <button type="button" className="btn xl block" aria-disabled="true">
        <Icon name="hourglass" />
        <span>{t('hk.wait_checkout')}</span>
      </button>
    );
  } else if (events.includes('start_cleaning')) {
    primary = (
      <button type="button" className="btn pri xl" onClick={() => void start()}>
        {t('hk.action.start_cleaning')}
      </button>
    );
  } else {
    // Cleaning in progress / waiting for inspection: the room screen has the next step (H20).
    primary = (
      <a className="btn pri xl" href={href({ name: 'room', roomId: task.roomId })}>
        {events.includes('finish_cleaning')
          ? t('hk.action.finish_cleaning')
          : t('hk.room_title', { room: task.roomNo })}
      </a>
    );
  }
  const refuse = stayover && !later && events.includes('start_cleaning');

  return (
    <article
      className={`hk-card${urgent ? ' urgent' : kit ? ' kit' : ''}`}
      aria-labelledby={headId}
    >
      <div className="hd">
        <RoomNo
          no={task.roomNo}
          name={task.roomName}
          id={headId}
          aria={`${t('hk.wo.room')} ${roomLabel(asRoom(task), 'staff', { separator: ', ' })}`}
        />
        {roomStatus ? <RoomStatusChip status={roomStatus} /> : null}
        {task.source === 'guest_app' ? (
          <Chip tone="ink" icon="chat">
            {t('hk.source.guest_app')}
          </Chip>
        ) : null}
        {queued ? <QueuedChip /> : null}
      </div>
      <div className="what">
        <b>{taskTitle(task, t)}</b>
        {task.type === 'extra_guest_kit_prepare' ? (
          <span className="li-s">{t('hk.task.extra_kit_items')}</span>
        ) : null}
        <div className="meta">
          {arrival ? <span>{arrival}</span> : null}
          {task.windowStart && task.windowEnd ? (
            <span>{t('hk.window', { from: task.windowStart, to: task.windowEnd })}</span>
          ) : null}
          {task.linenChange ? <span>{t('hk.linen_change')}</span> : null}
          {room && guestName(room) ? (
            <span>{t('hk.guest_first_name', { name: guestName(room) })}</span>
          ) : null}
        </div>
        {/* Guest's own words: online only, never cached (SR-PWA-01) – the cached copy has no `note`. */}
        {task.note ? (
          <p className="mt-8 m-0">
            {task.source === 'guest_app' ? t('hk.req_note', { note: task.note }) : task.note}
          </p>
        ) : null}
        {task.refillItems?.length ? (
          <p className="mt-4 m-0 li-s">{refillText(task.refillItems, t)}</p>
        ) : null}
      </div>
      <div className={`acts${refuse ? ' two' : ''}`}>
        {primary}
        {refuse ? (
          <a className="btn xl" href={href({ name: 'room', roomId: task.roomId, refuse: true })}>
            {t('hk.task.guest_refused')}
          </a>
        ) : null}
      </div>
    </article>
  );
}

type Tr = (key: string, args?: Record<string, string | number>) => string;

const CANCEL_KEY: Record<string, string> = {
  dnd: 'hk.refuse.dnd',
  guest_refused: 'hk.refuse.said_no',
  other: 'hk.refuse.other',
  reservation_changed: 'hk.cancel.reservation_changed',
  room_blocked: 'hk.cancel.room_blocked',
  day_ended: 'hk.cancel.day_ended',
};

/** Why a task left the list (P-13) – from the server, or from the action still waiting on the phone. */
function cancelReasonText(task: HkTask, items: readonly QueueItem[], t: Tr): string {
  const queued = [...items]
    .reverse()
    .find((i) => i.optimistic?.taskId === task.id && i.optimistic.taskStatus === 'cancelled');
  const body = queued?.request.body as
    { cancelReasonCode?: string; cancelNote?: string } | undefined;
  const code = task.cancelReasonCode ?? body?.cancelReasonCode;
  const note = task.cancelNote ?? body?.cancelNote;
  if (code === 'other' && note) return note;
  return code && CANCEL_KEY[code] ? t(CANCEL_KEY[code]) : '';
}
