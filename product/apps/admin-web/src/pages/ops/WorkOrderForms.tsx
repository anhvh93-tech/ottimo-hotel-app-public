import {
  deriveIdempotencyKey,
  type RoomBlock,
  type Severity,
  type WorkOrder,
  type WorkOrderCategory,
} from '@ottimo/api-client';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal, Seg, Switch } from '@ottimo/ui';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { useBusinessDay, useBusinessDayChange } from '../../app/businessDay';
import { addDays, conflictsOf, dayMonth } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { FilePicker, useSubmit, useUnsavedLabels } from '../stay/common';
import { SEVERITIES, WO_CATEGORIES, WO_CATEGORY_KEY, suggestedSeverity } from './opsLabels';

/** "khóa đêm 15/10 – 17/10, mở bán lại từ 18/10" from the server's half-open block (BR-804). */
export function blockSentence(
  t: (k: string, a?: Record<string, string | number>) => string,
  b: Pick<RoomBlock, 'startDate' | 'endDatePlanned' | 'endDateActual'>,
) {
  const reopen = b.endDateActual ?? b.endDatePlanned;
  return t('wo.block_info', {
    from: dayMonth(b.startDate),
    to: dayMonth(addDays(reopen, -1)),
    reopen: dayMonth(reopen),
  });
}

/**
 * 409 of a block (US-061 AC2/AC3, ARC A-03): guest in house → move them first; future bookings → list them
 * with a link each (move to another room first); another block → change that one. Never "save anyway".
 */
export function BlockConflict({
  error,
  room,
  onWithoutBlock,
}: {
  error: unknown;
  room: string;
  onWithoutBlock?: () => void;
}) {
  const { t } = useI18n();
  const code = (error as { code?: string } | null)?.code;
  if (code !== 'ROOM_OCCUPIED' && code !== 'ROOM_UNAVAILABLE' && code !== 'ROOM_BLOCKED')
    return null;
  const conflicts = conflictsOf(error);
  const action = onWithoutBlock ? (
    <Button size="sm" onClick={onWithoutBlock}>
      {t('wo.create_without_block')}
    </Button>
  ) : undefined;
  if (code === 'ROOM_OCCUPIED')
    return (
      <Alert tone="bad" title={t('wo.block_occupied_title')} actions={action}>
        {t('wo.block_occupied_body')}
        {conflicts.map((c) =>
          c.reservationCode ? (
            <div key={c.reservationCode}>
              <Link to={`/reservations?q=${encodeURIComponent(c.reservationCode)}`}>
                <span className="mono">{c.reservationCode}</span>
                {c.guestDisplayName ? ` · ${c.guestDisplayName}` : ''}
              </Link>
            </div>
          ) : null,
        )}
      </Alert>
    );
  if (code === 'ROOM_BLOCKED')
    return (
      <Alert tone="bad" title={t('wo.block_blocked_title', { room })} actions={action}>
        {t('wo.block_blocked_body')}
      </Alert>
    );
  return (
    <Alert
      tone="bad"
      title={t('wo.block_conflict_title', { n: conflicts.length })}
      actions={action}
    >
      {t('wo.block_conflict_dates')}
      <ul className="list-plain">
        {conflicts.map((c, i) => (
          <li key={`${c.reservationCode}-${i}`}>
            <Link to={`/reservations?q=${encodeURIComponent(c.reservationCode ?? '')}`}>
              <span className="mono">{c.reservationCode}</span>
              {c.guestDisplayName ? ` · ${c.guestDisplayName}` : ''}
              {c.nights?.length
                ? ` · ${dayMonth(c.nights[0]!)} – ${dayMonth(c.nights[c.nights.length - 1]!)}`
                : ''}
            </Link>{' '}
            <span className="li-s">({t('wo.open_booking')})</span>
          </li>
        ))}
      </ul>
    </Alert>
  );
}

/** Block dates: start ≥ today, expected done ≥ start; the server works out the reopening date (BR-804). */
function BlockFields({
  start,
  setStart,
  expected,
  setExpected,
  reason,
  setReason,
  fields,
  prefix,
}: {
  start: string;
  setStart: (v: string) => void;
  expected: string;
  setExpected: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  fields: Record<string, string>;
  prefix: string;
}) {
  const { t } = useI18n();
  // BUG-R2-211 (BR-010): the business day – a room broken at 02:40 is blocked from tonight.
  const today = useBusinessDay();
  const f = (k: string) => fields[`${prefix}${k}`];
  return (
    <div className="stack">
      <div className="g-2">
        <Field label={t('wo.block_from')} required error={f('startDate')}>
          {(p) => (
            <input
              {...p}
              type="date"
              className="input"
              min={today}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('wo.block_done_planned')} required error={f('expectedDoneDate')}>
          {(p) => (
            <input
              {...p}
              type="date"
              className="input"
              min={start || today}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          )}
        </Field>
      </div>
      <p className="caption">{t('wo.block_reopen_note')}</p>
      <Field label={t('wo.block_reason')} required error={f('reason')}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
    </div>
  );
}

/**
 * US-061 – new work order (W1) from the desk, optionally with a room block (O1): title, description (AC4:
 * required), issue type → suggested severity (BR-809, editable), optional photo, "Khóa căn" with the
 * start + expected-done dates. 409s are shown with what to do (AC2, AC3); the reopening date comes back in
 * the answer and is shown in the toast (AC1).
 */
export function CreateWorkOrderDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (w: WorkOrder) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const unsaved = useUnsavedLabels();
  const toast = useToast();
  const { rooms } = useCatalog(propertyId);
  const statuses = useResource(
    async () => (await api.listRoomStatuses({ propertyId })).data.data,
    [propertyId],
  );
  // BUG-R2-211 (BR-010): the business day, not the calendar day.
  const today = useBusinessDay();
  const ids = useId();
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<WorkOrderCategory>('other');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [block, setBlock] = useState(false);
  const [start, setStart] = useState(today);
  const [expected, setExpected] = useState(addDays(today, 1));
  // Untouched default dates follow the server's business day.
  useBusinessDayChange(today, (was, now) => {
    if (start === was) setStart(now);
    if (expected === addDays(was, 1)) setExpected(addDays(now, 1));
  });
  // The block reason follows the title (EP07-08 6.2) until the desk types its own.
  const [ownReason, setOwnReason] = useState<string | null>(null);
  const reason = ownReason ?? title;
  const act = useSubmit({
    bound: [
      'roomId',
      'title',
      'description',
      'category',
      'block.startDate',
      'block.expectedDoneDate',
      'block.reason',
    ],
  });
  const st = statuses.state.data?.find((s) => s.roomId === roomId)?.status;
  const occupied = st === 'OC' || st === 'OD';
  const suggested = suggestedSeverity(category, occupied);
  const sev = severity ?? suggested;
  const room = rooms.find((r) => r.id === roomId);
  const roomText = room ? roomLabel(room, 'staff') : '';
  const save = async (withBlock: boolean) => {
    const out = await act.submit(async (idem) => {
      const photoIds = photo
        ? [
            (
              await api.uploadAttachment(
                { propertyId },
                photo,
                'work_order',
                deriveIdempotencyKey(idem, 'attachment'),
              )
            ).data.id,
          ]
        : undefined;
      return api.createWorkOrder(
        { propertyId },
        {
          roomId,
          title: title.trim(),
          description: description.trim(),
          category,
          severity: sev,
          photoAttachmentIds: photoIds,
          blockRequested: false,
          block: withBlock
            ? { startDate: start, expectedDoneDate: expected, reason: reason.trim() }
            : undefined,
        },
        idem,
      );
    });
    if (!out) return;
    const w = out.data;
    toast(
      w.roomBlock
        ? `${t('wo.created', { code: w.code })} ${blockSentence(t, w.roomBlock)}`
        : t('wo.created', { code: w.code }),
    );
    onDone(w);
  };

  return (
    <Modal
      open
      title={t('wo.new_title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={!!(roomId || title || description)}
      unsavedLabels={unsaved}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!roomId}
            onClick={() => void save(block)}
          >
            {act.label(block ? t('wo.create_and_block') : t('wo.create'))}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label={t('hk.wo.room')} required error={act.fields.roomId}>
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
        <Field label={t('wo.title_label')} required error={act.fields.title}>
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
        </Field>
        <Field
          label={t('hk.wo.desc')}
          help={t('hk.wo.desc_required')}
          required
          error={act.fields.description}
        >
          {(p) => (
            <textarea
              {...p}
              className="input"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('hk.wo.what')} required error={act.fields.category}>
          {(p) => (
            <select
              {...p}
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkOrderCategory)}
            >
              {WO_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(WO_CATEGORY_KEY[c])}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div>
          <span className="label-h" id={`${ids}-sev`}>
            {t('wo.severity_label')}
          </span>
          <Seg
            labelledBy={`${ids}-sev`}
            value={sev}
            onChange={(v) => setSeverity(v)}
            options={SEVERITIES.map((s) => ({ value: s, label: t(`wo.sev.${s}`) }))}
          />
          <p className="caption mt-4">{t(`wo.sev.${sev}_help`)}</p>
          {roomId ? (
            <p className="caption">
              {t('wo.sev_suggested', {
                state: t(occupied ? 'wo.state.occupied' : 'wo.state.vacant'),
                sev: t(`wo.sev.${suggested}`),
              })}
            </p>
          ) : null}
        </div>
        <FilePicker label={t('hk.wo.photos')} file={photo} onChange={setPhoto} />
        <Switch checked={block} onChange={setBlock}>
          {t('hk.lock_request')}
        </Switch>
        {block ? (
          <BlockFields
            start={start}
            setStart={setStart}
            expected={expected}
            setExpected={setExpected}
            reason={reason}
            setReason={setOwnReason}
            fields={act.fields}
            prefix="block."
          />
        ) : null}
        <BlockConflict
          error={act.error}
          room={roomText}
          onWithoutBlock={() => {
            setBlock(false);
            act.reset();
            void save(false);
          }}
        />
        {act.code && ['ROOM_OCCUPIED', 'ROOM_UNAVAILABLE', 'ROOM_BLOCKED'].includes(act.code)
          ? null
          : act.view()}
      </div>
    </Modal>
  );
}

/**
 * US-019 – planned block (O1) without an incident, or "Khóa phòng theo đề nghị" of a work order
 * (`workOrderId` – the request flag clears itself). Same dates, same 409 handling.
 */
export function BlockDialog({
  workOrder,
  onClose,
  onDone,
}: {
  workOrder?: WorkOrder;
  onClose: () => void;
  onDone: (b: RoomBlock) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { rooms } = useCatalog(propertyId);
  // BUG-R2-211 (BR-010): the business day, not the calendar day.
  const today = useBusinessDay();
  const [roomId, setRoomId] = useState(workOrder?.roomId ?? '');
  const [start, setStart] = useState(today);
  const [expected, setExpected] = useState(addDays(today, 1));
  // Untouched default dates follow the server's business day.
  useBusinessDayChange(today, (was, now) => {
    if (start === was) setStart(now);
    if (expected === addDays(was, 1)) setExpected(addDays(now, 1));
  });
  const [reason, setReason] = useState(workOrder?.title ?? '');
  const act = useSubmit({ bound: ['roomId', 'startDate', 'expectedDoneDate', 'reason'] });
  const room = rooms.find((r) => r.id === roomId);
  const roomText = room ? roomLabel(room, 'staff') : '';
  const save = async () => {
    const out = await act.submit((idem) =>
      api.createRoomBlock(
        { propertyId },
        {
          roomId,
          startDate: start,
          expectedDoneDate: expected,
          reason: reason.trim(),
          workOrderId: workOrder?.id,
        },
        idem,
      ),
    );
    if (!out) return;
    toast(t('ooo.saved', { room: roomText, date: dayMonth(out.data.endDatePlanned) }));
    onDone(out.data);
  };
  return (
    <Modal
      open
      size="sm"
      title={workOrder ? t('wo.block_by_request') : t('ooo.new')}
      onClose={onClose}
      closeLabel={t('common.close')}
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
            {act.label(workOrder ? t('wo.block_by_request') : t('ooo.new'))}
          </Button>
        </>
      }
    >
      <div className="stack">
        {workOrder ? (
          <p className="li-s">
            <span className="mono">{workOrder.code}</span> ·{' '}
            {roomLabel({ roomNo: workOrder.roomNo, name: workOrder.roomName }, 'staff')}
          </p>
        ) : (
          <Field label={t('hk.wo.room')} required error={act.fields.roomId}>
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
        )}
        <BlockFields
          start={start}
          setStart={setStart}
          expected={expected}
          setExpected={setExpected}
          reason={reason}
          setReason={setReason}
          fields={act.fields}
          prefix=""
        />
        <BlockConflict error={act.error} room={roomText} />
        {act.code && ['ROOM_OCCUPIED', 'ROOM_UNAVAILABLE', 'ROOM_BLOCKED'].includes(act.code)
          ? null
          : act.view()}
      </div>
    </Modal>
  );
}
