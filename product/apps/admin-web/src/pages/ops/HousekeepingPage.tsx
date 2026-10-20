import type { HkTask, RoomStatusEntry } from '@ottimo/api-client';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, Seg, StateView } from '@ottimo/ui';
import { useId, useState } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { useBusinessDay, useBusinessDayChange } from '../../app/businessDay';
import { timeHHmm, todayLocal } from '../../app/dates';
import { useLiveReload } from '../../app/live';
import { dayMonth } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';
import {
  MANUAL_TASK_TYPES,
  ROOM_FILTERS,
  ROOM_TONE,
  STATUS_ROOM_KEY,
  TASK_CANCEL_KEY,
  TASK_STATUS,
  TASK_TYPE_KEY,
  staffRoom,
  taskTitle,
} from './opsLabels';

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
type RoomFilter = keyof typeof ROOM_FILTERS;

/**
 * S10 Buồng phòng – Desk (US-054 AC3, US-052): the front desk sees the same tasks and counter as housekeeping
 * (`listHkTasks.summary` "{done}/{total}"), live over SSE (`hk_task.changed`, `room.status_changed`), and the
 * 10 rooms with their status. FD+ may tick a task done, cancel it with a reason (SM-14) or add a task by hand
 * (A83-create); status changes of the rooms themselves stay on the housekeeping PWA.
 */
export function HousekeepingPage() {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const { roles, property } = useSession();
  const tz = property?.timezone;
  const fd = roles.some((r) => FD_PLUS.includes(r));
  const tasks = useResource(async () => (await api.listHkTasks({ propertyId })).data, [propertyId]);
  const rooms = useResource(
    async () => (await api.listRoomStatuses({ propertyId })).data,
    [propertyId],
  );
  const reloadAll = () => {
    tasks.reload();
    rooms.reload();
  };
  useLiveReload(propertyId, reloadAll);
  const [creating, setCreating] = useState(false);
  const loadedAt = tasks.state.status === 'ready' ? tasks.state.loadedAt : undefined;

  return (
    <>
      <Topbar
        title={t('nav.housekeeping')}
        sub={
          loadedAt
            ? t('hk.updated_at', { date: date(todayLocal(tz)), time: timeHHmm(loadedAt, tz) })
            : undefined
        }
        actions={
          fd ? (
            <Button icon="plus" onClick={() => setCreating(true)}>
              {t('hk.desk.new_task')}
            </Button>
          ) : undefined
        }
      />
      <Page>
        <div className="cols-2">
          <section aria-labelledby="hk-tasks">
            <div className="card-h">
              <h2 id="hk-tasks">{t('hk.desk.tasks')}</h2>
              {tasks.state.data ? (
                <Chip tone="ink" icon="check">
                  {t('hk.progress', {
                    done: tasks.state.data.summary.done ?? 0,
                    total: tasks.state.data.summary.total ?? 0,
                  })}
                </Chip>
              ) : null}
            </div>
            {!tasks.state.data && tasks.state.status === 'error' ? (
              <ErrorBlock
                titleKey="hk.error_title"
                error={tasks.state.error}
                onRetry={tasks.reload}
              />
            ) : !tasks.state.data ? (
              <LoadingBlock />
            ) : tasks.state.data.data.length === 0 ? (
              <StateView icon="broom" title={t('hk.desk.tasks_empty')} />
            ) : (
              <ul className="list card">
                {tasks.state.data.data.map((task) => (
                  <li key={task.id}>
                    <TaskRow task={task} canWrite={fd} onChanged={reloadAll} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="hk-rooms">
            <div className="card-h">
              <h2 id="hk-rooms">{t('hk.desk.rooms')}</h2>
            </div>
            {!rooms.state.data && rooms.state.status === 'error' ? (
              <ErrorBlock
                titleKey="hk.rooms_error_title"
                error={rooms.state.error}
                onRetry={rooms.reload}
              />
            ) : !rooms.state.data ? (
              <LoadingBlock />
            ) : (
              <RoomBoard rooms={rooms.state.data.data} />
            )}
          </section>
        </div>
      </Page>
      {creating ? (
        <CreateTaskDialog
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            reloadAll();
          }}
        />
      ) : null}
    </>
  );
}

function TaskRow({
  task,
  canWrite,
  onChanged,
}: {
  task: HkTask;
  canWrite: boolean;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const { property } = useSession();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { online } = useOnline();
  const act = useSubmit();
  const [cancelling, setCancelling] = useState(false);
  const tz = property?.timezone;
  const room = staffRoom(task);
  const due = task.dueAt ? timeHHmm(new Date(task.dueAt), tz) : undefined;
  const title = taskTitle(t, task, room, due);
  const st = TASK_STATUS[task.status];
  const live = task.status === 'open' || task.status === 'in_progress';

  const complete = async () => {
    const out = await act.submit((idem) =>
      api.transitionHkTask(
        { propertyId, taskId: task.id },
        'complete',
        { performedAt: new Date().toISOString() },
        idem,
      ),
    );
    if (out) {
      toast(t('hk.desk.done_toast', { type: title, room }));
      onChanged();
    }
  };

  return (
    <div className="li">
      <div>
        <div className="roomno">{task.roomNo}</div>
        {task.roomName ? <div className="li-s">{task.roomName}</div> : null}
      </div>
      <div className="grow">
        <div className="li-t">{title}</div>
        <div className="row wrap mt-4">
          <Chip tone={st.tone} icon={st.icon}>
            {task.status === 'done' && task.doneAt
              ? t('hk.done_at', { time: timeHHmm(new Date(task.doneAt), tz) })
              : t(st.key)}
          </Chip>
          {task.source === 'guest_app' ? (
            <Chip tone="ink" icon="chat">
              {t('hk.source.guest_app')}
            </Chip>
          ) : null}
          {task.carriedOver ? <Chip icon="calendar">{t('hk.task.carried_over')}</Chip> : null}
          {task.linenChange ? <Chip icon="bed">{t('hk.linen_change')}</Chip> : null}
          {due && task.type !== 'extra_guest_kit_prepare' && live ? (
            <Chip tone="warn" icon="clock">
              {t('hk.desk.due_before', { time: due })}
            </Chip>
          ) : null}
        </div>
        {task.note ? (
          <div className="li-s mt-4">
            {task.type === 'guest_request' ? t('hk.req_note', { note: task.note }) : task.note}
          </div>
        ) : null}
        {task.refillItems?.length ? (
          <div className="li-s">
            {t('hk.refill', {
              items: task.refillItems.map((i) => `${i.quantity} ${i.itemName}`).join(', '),
            })}
          </div>
        ) : null}
        {task.windowStart && task.windowEnd ? (
          <div className="li-s">
            {t('hk.window', { from: task.windowStart.slice(0, 5), to: task.windowEnd.slice(0, 5) })}
          </div>
        ) : null}
        {task.status === 'cancelled' && task.cancelReasonCode ? (
          <div className="li-s">
            {t(TASK_CANCEL_KEY[task.cancelReasonCode])}
            {task.cancelNote ? ` – ${task.cancelNote}` : ''}
          </div>
        ) : null}
        {act.view()}
      </div>
      {canWrite && live ? (
        <div className="row wrap">
          <Button
            size="sm"
            variant="pri"
            disabled={!online}
            busy={act.busy}
            busyLabel={act.busyLabel}
            onClick={() => void complete()}
          >
            {act.label(t('hk.task.complete'))}
          </Button>
          <Button size="sm" variant="ghost" disabled={!online} onClick={() => setCancelling(true)}>
            {t('hk.desk.cancel')}
          </Button>
        </div>
      ) : null}
      {cancelling ? (
        <CancelTaskDialog
          task={task}
          title={title}
          room={room}
          onClose={() => setCancelling(false)}
          onDone={() => {
            setCancelling(false);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

const CANCEL_CODES = ['guest_refused', 'dnd', 'other'] as const;

/** SM-14 cancel: reason code required, note required for "other" (0.3.7 B-05). */
function CancelTaskDialog({
  task,
  title,
  room,
  onClose,
  onDone,
}: {
  task: HkTask;
  title: string;
  room: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const [code, setCode] = useState<(typeof CANCEL_CODES)[number]>('guest_refused');
  const [note, setNote] = useState('');
  const act = useSubmit({ bound: ['cancelNote'] });
  const blocked = code === 'other' && note.trim().length < 3;
  const save = async () => {
    if (blocked) return;
    const out = await act.submit((idem) =>
      api.transitionHkTask(
        { propertyId, taskId: task.id },
        'cancel',
        {
          performedAt: new Date().toISOString(),
          cancelReasonCode: code,
          cancelNote: code === 'other' ? note.trim() : undefined,
        },
        idem,
      ),
    );
    if (out) {
      toast(t('hk.desk.cancelled_toast', { room }));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('hk.desk.cancel_title', { type: title, room })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('confirm.keep')}</Button>
          <Button
            variant="danger"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={blocked}
            onClick={() => void save()}
          >
            {act.label(t('hk.desk.cancel'))}
          </Button>
        </>
      }
    >
      <p className="li-s">{t('hk.desk.cancel_effect')}</p>
      <fieldset className="fieldset-plain">
        <legend id={`${ids}-why`}>{t('hk.task.refused_reason')}</legend>
        {CANCEL_CODES.map((c) => (
          <label key={c} className="check">
            <input
              type="radio"
              name={`${ids}-code`}
              checked={code === c}
              onChange={() => setCode(c)}
            />
            {t(TASK_CANCEL_KEY[c])}
          </label>
        ))}
      </fieldset>
      {code === 'other' ? (
        <Field label={t('stay.note')} required error={act.fields.cancelNote}>
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>
      ) : null}
      {act.view()}
    </Modal>
  );
}

/** A83-create – manual task (adhoc / stayover / priority / minibar refill), today … +7 days. */
function CreateTaskDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { rooms } = useCatalog(propertyId);
  // BUG-R2-211 (BR-010): the business day – a task made at 02:40 is on tonight's list, not tomorrow's.
  const today = useBusinessDay();
  const [roomId, setRoomId] = useState('');
  const [type, setType] = useState<HkTask['type']>('adhoc_clean');
  const [dueDate, setDueDate] = useState(today);
  useBusinessDayChange(today, (was, now) => {
    if (dueDate === was) setDueDate(now);
  });
  const [note, setNote] = useState('');
  const act = useSubmit({ bound: ['roomId', 'type', 'dueDate', 'note'] });
  const save = async () => {
    const out = await act.submit((idem) =>
      api.createHkTask(
        { propertyId },
        { roomId, type, dueDate, note: note.trim() || undefined },
        idem,
      ),
    );
    if (out) {
      toast(t('hk.desk.created', { type: t(TASK_TYPE_KEY[type]), room: staffRoom(out.data) }));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('hk.desk.new_task_title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={!!roomId || !!note}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!roomId}
            onClick={() => void save()}
          >
            {act.label(t('hk.desk.new_task'))}
          </Button>
        </>
      }
    >
      <Field label={t('booking.field.room')} required error={act.fields.roomId}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="" />
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {roomLabel(r, 'staff')}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label={t('hk.desk.task_type')} required error={act.fields.type}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as HkTask['type'])}
          >
            {MANUAL_TASK_TYPES.map((x) => (
              <option key={x} value={x}>
                {t(TASK_TYPE_KEY[x])}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label={t('hk.desk.due_date')} required error={act.fields.dueDate}>
        {(p) => (
          <input
            {...p}
            type="date"
            className="input"
            min={today}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        )}
      </Field>
      <Field label={t('hk.desk.note')} error={act.fields.note}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      {act.view()}
    </Modal>
  );
}

/** US-052: the 10 rooms with a status filter (counts per group – EP07-08 1.3). */
function RoomBoard({ rooms }: { rooms: RoomStatusEntry[] }) {
  const { t } = useI18n();
  const { property } = useSession();
  const tz = property?.timezone;
  // "Arriving today" = the business day (BUG-R2-211, display only).
  const today = useBusinessDay();
  const [filter, setFilter] = useState<RoomFilter>('all');
  const ids = useId();
  const inGroup = (f: RoomFilter, r: RoomStatusEntry) =>
    (ROOM_FILTERS[f].codes as readonly string[]).includes(r.status);
  const shown = rooms.filter((r) => inGroup(filter, r));
  return (
    <div className="stack">
      <span className="sr-only" id={`${ids}-f`}>
        {t('hk.filter_label')}
      </span>
      <Seg
        labelledBy={`${ids}-f`}
        value={filter}
        onChange={setFilter}
        options={(Object.keys(ROOM_FILTERS) as RoomFilter[]).map((f) => ({
          value: f,
          label: t(ROOM_FILTERS[f].key, { n: rooms.filter((r) => inGroup(f, r)).length }),
        }))}
      />
      {shown.length === 0 ? (
        <Alert tone="info">{t('hk.filter_empty_title')}</Alert>
      ) : (
        <ul className="list card">
          {shown.map((r) => (
            <li key={r.roomId}>
              <div className="li">
                <div>
                  <div className="roomno">{r.roomNo}</div>
                  {r.roomName ? <div className="li-s">{r.roomName}</div> : null}
                </div>
                <div className="grow">
                  <div className="row wrap">
                    <Chip tone={ROOM_TONE[r.status] ?? 'neutral'} icon="door">
                      {t(STATUS_ROOM_KEY(r.status))}
                    </Chip>
                    {r.inspectionFailed ? (
                      <Chip tone="bad" icon="alert">
                        {t('hk.desk.insp_failed')}
                      </Chip>
                    ) : null}
                    {r.openTaskIds?.length ? (
                      <Chip icon="broom">
                        {t('hk.desk.open_tasks', { n: r.openTaskIds.length })}
                      </Chip>
                    ) : null}
                  </div>
                  <div className="li-s mt-4">
                    {t('hk.desk.since', { time: timeHHmm(new Date(r.since), tz) })}
                    {r.currentGuest ? ` · ${r.currentGuest}` : ''}
                  </div>
                  {r.nextArrival?.date === today ? (
                    <div className="li-s">
                      {t('hk.arriving_today', { time: r.nextArrival.etaTime?.slice(0, 5) ?? '' })}
                    </div>
                  ) : r.nextArrival?.date ? (
                    <div className="li-s">
                      {t('hk.next_arrival', { when: dayMonth(r.nextArrival.date) })}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
