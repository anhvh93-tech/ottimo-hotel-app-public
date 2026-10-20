import { Alert, Icon, Skeleton, StateView } from '@ottimo/ui';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { useMemo, useState } from 'react';
import { useHkActions, type RefuseReason } from '../app/actions';
import type { HkTask, RoomStatusEntry } from '../app/api';
import { useHkData } from '../app/data';
import { effectiveRoomStatus, effectiveTaskStatus, eventsFor } from '../app/overlay';
import { asRoom } from '../app/rooms';
import { goBack, href, navigate } from '../app/router';
import { canWriteRooms, type StaffSession } from '../app/session';
import {
  arrivalText,
  CLEAN_TYPES,
  completeLabel,
  isKit,
  sortByPriority,
  taskTitle,
} from '../app/tasks';
import { hhmm, businessDate } from '../app/time';
import { actionText, rejectionText } from '../queue/messages';
import { useQueue } from '../queue/QueueProvider';
import { QueuedChip, RoomStatusChip, TopBar } from '../ui/parts';

/** H20 20.1 / 20.4 – one room: its tasks today, the next allowed step (SM-03 – server `allowedEvents`). */
export function RoomPage({
  session,
  roomId,
  refuse,
}: {
  session: StaffSession;
  roomId: string;
  refuse?: boolean;
}) {
  const { t } = useI18n();
  const data = useHkData();
  const { items, rejected, queue, resend } = useQueue();
  const act = useHkActions(session);
  const today = businessDate();
  const room = data.rooms?.data.find((r) => r.roomId === roomId);

  const tasks = useMemo(
    () =>
      sortByPriority((data.tasks?.data ?? []).filter((x) => x.roomId === roomId))
        .map((task) => ({ task, st: effectiveTaskStatus(task, items) }))
        .filter((x) => x.st.value !== 'cancelled' && x.st.value !== 'done'),
    [data.tasks, roomId, items],
  );

  if (!room) {
    return (
      <>
        <TopBar title={t('nav.rooms_status')} back={{ name: 'rooms' }} />
        <div className="m-body">
          {data.status === 'loading' ? (
            <Skeleton height={120} />
          ) : (
            <StateView kind="error" title={t('hk.rooms_error_title')}>
              {t('hk.error_body')}
            </StateView>
          )}
        </div>
      </>
    );
  }

  const eff = effectiveRoomStatus(room, items);
  const events = eventsFor(eff.value, room.allowedEvents, eff.queued);
  const label = roomLabel(asRoom(room), 'staff');
  const cleanTask = tasks.find((x) => CLEAN_TYPES.includes(x.task.type))?.task;
  const stayTask = tasks.find(
    (x) => x.task.type === 'stayover_clean' || x.task.type === 'long_stay_clean',
  )?.task;
  const occupied = eff.value === 'OC' || eff.value === 'OD' || Boolean(room.currentGuest);
  const writable = canWriteRooms(session);
  const arrival = arrivalText(room, t, today);
  const startedNote = eff.value === 'CL' && !eff.queued;
  const finishHelp = events.includes('finish_cleaning');
  // Latest refusal for this room (409 from the queue) – shown on the spot as well as in "Cần xem lại".
  const refused = [...rejected].reverse().find((i) => i.roomId === roomId);

  if (refuse && stayTask && writable) {
    return <RefuseSheet session={session} room={room} task={stayTask} />;
  }

  const finish = () => act.roomStatus(room, 'finish_cleaning', eff.value, cleanTask, occupied);
  const start = () => act.roomStatus(room, 'start_cleaning', eff.value, cleanTask);

  let main: JSX.Element | null = null;
  if (writable && events.includes('start_cleaning')) {
    main = (
      <button type="button" className="btn pri xl block" onClick={() => void start()}>
        {t('hk.action.start_cleaning')}
      </button>
    );
  } else if (writable && events.includes('finish_cleaning')) {
    main = (
      <button type="button" className="btn pri xl block" onClick={() => void finish()}>
        {t('hk.action.finish_cleaning')}
      </button>
    );
  } else if (events.includes('inspect')) {
    main = (
      <a className="btn pri xl block" href={href({ name: 'inspect', roomId })}>
        {t('hk.insp.title', { room: label })}
      </a>
    );
  }

  return (
    <>
      <TopBar
        title={t('hk.room_title', { room: label })}
        back={{ name: session.mode === 'mt' ? 'rooms' : 'tasks' }}
      />
      <div className="m-body hk-stack">
        <div className="hk-top-chips">
          <RoomStatusChip status={eff.value} />
          {eff.queued ? <QueuedChip /> : null}
        </div>
        {refused ? (
          <Alert
            tone="bad"
            title={rejectionText(refused, t).title}
            actions={
              <>
                {queue.canResend(refused) ? (
                  <button
                    type="button"
                    className="btn pri"
                    onClick={() =>
                      void resend(
                        refused.id,
                        t('hk.queue.resent_toast', { room: label, action: actionText(refused, t) }),
                        t('hk.undone'),
                      )
                    }
                  >
                    {t('hk.queue.resend', { action: actionText(refused, t) })}
                  </button>
                ) : null}
                <a className="btn" href={href({ name: 'queue' })}>
                  {t('hk.queue_title')}
                </a>
              </>
            }
          >
            {rejectionText(refused, t).body}
          </Alert>
        ) : null}

        {tasks.length === 0 ? (
          <StateView icon="check" title={t('hk.room_no_task_title')}>
            {t('hk.room_no_task_body')}
          </StateView>
        ) : (
          tasks.map(({ task, st }) => (
            <RoomTask
              key={task.id}
              session={session}
              task={task}
              queued={st.queued}
              writable={writable}
            />
          ))
        )}

        {/* No empty bordered card when there is nothing to say (seen on room 101, S4 UXD screenshots). */}
        {arrival || startedNote || finishHelp ? (
          <div className="card hk-info">
            {arrival ? <p className="m-0">{arrival}</p> : null}
            {startedNote ? (
              <p className="m-0 li-s">{t('hk.started_at', { time: hhmm(room.since) })}</p>
            ) : null}
            {finishHelp ? (
              <p className="m-0 li-s">
                {occupied ? t('hk.finish_help_occupied') : t('hk.finish_help_vacant')}
              </p>
            ) : null}
          </div>
        ) : null}

        <a className="btn xl block" href={href({ name: 'report', roomId })}>
          <Icon name="alert" />
          <span>{t('hk.report_this_room')}</span>
        </a>
      </div>
      {main ? <div className="wiz-foot hk-foot">{main}</div> : null}
    </>
  );
}

function RoomTask({
  session,
  task,
  queued,
  writable,
}: {
  session: StaffSession;
  task: HkTask;
  queued: boolean;
  writable: boolean;
}) {
  const { t } = useI18n();
  const act = useHkActions(session);
  const cleaning = CLEAN_TYPES.includes(task.type);
  return (
    <section className={`hk-card${isKit(task) ? ' kit' : ''}`} aria-label={taskTitle(task, t)}>
      <div className="what m-0">
        <b>{taskTitle(task, t)}</b>
        {queued ? <QueuedChip /> : null}
        {task.type === 'checkout_clean' ? (
          <ul className="hk-steps">
            {task.linenChange !== false ? <li>{t('hk.linen_change')}</li> : null}
            <li>{t('hk.step.bath')}</li>
            <li>{t('hk.step.kitchen')}</li>
            <li>{t('hk.step.amenity')}</li>
          </ul>
        ) : task.linenChange ? (
          <div className="meta">
            <span>{t('hk.linen_change')}</span>
          </div>
        ) : null}
        {task.note ? (
          <p className="mt-8 m-0">
            {task.source === 'guest_app' ? t('hk.req_note', { note: task.note }) : task.note}
          </p>
        ) : null}
      </div>
      {!cleaning && writable ? (
        <button
          type="button"
          className="btn xl block mt-8"
          onClick={() => void act.completeTask(task)}
        >
          <Icon name="check" />
          <span>{completeLabel(task, t)}</span>
        </button>
      ) : null}
      {(task.type === 'stayover_clean' || task.type === 'long_stay_clean') && writable ? (
        <a
          className="btn xl block mt-8"
          href={href({ name: 'room', roomId: task.roomId, refuse: true })}
        >
          {t('hk.task.guest_refused')}
        </a>
      ) : null}
    </section>
  );
}

/** H20 20.4 – "Khách không muốn dọn": reason required (SM-14, rbac note 33). */
function RefuseSheet({
  session,
  room,
  task,
}: {
  session: StaffSession;
  room: RoomStatusEntry;
  task: HkTask;
}) {
  const { t } = useI18n();
  const act = useHkActions(session);
  const [reason, setReason] = useState<RefuseReason | null>(null);
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const noteOk = reason !== 'other' || note.trim().length >= 3;
  const label = roomLabel(asRoom(room), 'staff');

  const save = async () => {
    setTried(true);
    if (!reason || !noteOk) return;
    await act.refuseTask(task, reason, note.trim() || undefined);
    navigate({ name: 'tasks' }, true);
  };

  const options: { value: RefuseReason; key: string }[] = [
    { value: 'dnd', key: 'hk.refuse.dnd' },
    { value: 'guest_refused', key: 'hk.refuse.said_no' },
    { value: 'other', key: 'hk.refuse.other' },
  ];

  return (
    <>
      <TopBar
        title={t('hk.room_title', { room: label })}
        back={{ name: 'room', roomId: room.roomId }}
      />
      <div className="m-body hk-stack">
        <h2 className="hk-h2">{t('hk.refuse_title')}</h2>
        <fieldset className="fieldset-plain">
          <legend>{t('hk.task.refused_reason')}</legend>
          {options.map((o) => (
            <label key={o.value} className="choice">
              <input
                type="radio"
                name="refuse"
                value={o.value}
                checked={reason === o.value}
                onChange={() => setReason(o.value)}
              />
              <span>{t(o.key)}</span>
            </label>
          ))}
          {tried && !reason ? (
            <p className="help err" role="alert">
              {t('common.required')}
            </p>
          ) : null}
        </fieldset>
        {reason === 'other' ? (
          <div className="field">
            <label htmlFor="refuse-note">{t('hk.refuse.other')}</label>
            <textarea
              id="refuse-note"
              className="input"
              maxLength={300}
              value={note}
              aria-invalid={tried && !noteOk ? true : undefined}
              aria-describedby={tried && !noteOk ? 'refuse-note-err' : undefined}
              onChange={(e) => setNote(e.target.value)}
            />
            {tried && !noteOk ? (
              <p className="help err" id="refuse-note-err">
                {t('common.required')}
              </p>
            ) : null}
          </div>
        ) : null}
        <p className="li-s m-0">{t('hk.refuse_effect')}</p>
      </div>
      <div className="wiz-foot hk-foot two">
        <button
          type="button"
          className="btn xl"
          onClick={() => goBack({ name: 'room', roomId: room.roomId })}
        >
          {t('common.back')}
        </button>
        <button type="button" className="btn pri xl" onClick={() => void save()}>
          {t('hk.refuse_save')}
        </button>
      </div>
    </>
  );
}
