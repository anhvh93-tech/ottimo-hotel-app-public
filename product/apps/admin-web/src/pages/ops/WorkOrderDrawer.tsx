import {
  deriveIdempotencyKey,
  type Severity,
  type WorkOrder,
  type WorkOrderAction,
} from '@ottimo/api-client';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Modal, Seg } from '@ottimo/ui';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { useBusinessDay } from '../../app/businessDay';
import { timeHHmm } from '../../app/dates';
import { dayMonth } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { FilePicker, useSubmit } from '../stay/common';
import { SEVERITIES, SEV_TONE, WO_ACTION_KEY, WO_CATEGORY_KEY, WO_STATUS } from './opsLabels';
import { BlockDialog, blockSentence } from './WorkOrderForms';

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];

/** "Hạn" of a work order (BR-809): paused while waiting for parts, overdue in red, else the next deadline. */
export function dueText(
  t: (k: string, a?: Record<string, string | number>) => string,
  w: WorkOrder,
  now: number,
  tz?: string,
): { text: string; bad: boolean } | null {
  if (w.status === 'done' || w.status === 'cancelled') return null;
  if (w.status === 'waiting_parts' && w.partsExpectedDate)
    return { text: t('wo.due.paused', { date: dayMonth(w.partsExpectedDate) }), bad: false };
  const due = w.status === 'new' && w.ackDueAt ? w.ackDueAt : w.resolveDueAt;
  if (!due) return null;
  const ms = Date.parse(due) - now;
  if (ms < 0 || w.isOverdue)
    return { text: t('wo.due.overdue', { m: Math.max(1, Math.round(-ms / 60_000)) }), bad: true };
  if (w.status === 'new' && w.ackDueAt)
    return {
      text: t('wo.due.ack', { time: timeHHmm(new Date(due), tz), m: Math.round(ms / 60_000) }),
      bad: false,
    };
  return { text: t('wo.due.resolve', { when: timeHHmm(new Date(due), tz) }), bad: false };
}

/** One history line (US-062 AC2 – who, when, old → new). */
function historyLine(
  t: (k: string, a?: Record<string, string | number>) => string,
  h: NonNullable<WorkOrder['history']>[number],
): string {
  const who = h.actorName ?? '';
  const st = (s: string | null | undefined) =>
    s && WO_STATUS[s as WorkOrder['status']]
      ? t(WO_STATUS[s as WorkOrder['status']].key)
      : (s ?? '');
  switch (h.change) {
    case 'created':
      return t('wo.log.created', { who });
    case 'status':
      return t('wo.log.status', { who, from: st(h.from), to: st(h.to) });
    case 'severity':
      return t('wo.log.severity', {
        who,
        from: h.from ? t(`wo.sev.${h.from}`) : '',
        to: h.to ? t(`wo.sev.${h.to}`) : '',
      });
    case 'assignee':
      return t('wo.log.assignee', { who, to: h.to ?? '' });
    case 'block_requested':
      return t('wo.log.block_requested', { who });
    case 'block':
      return t('wo.log.block', { who });
    case 'parts_expected_date':
      return t('wo.log.parts_date', { who, date: h.to ? dayMonth(h.to) : '' });
    case 'note':
      return t('wo.log.note', { who, note: h.note ?? '' });
    default:
      return who;
  }
}

/**
 * S11 – work order detail for the desk (US-062): severity (editable, If-Match), what was reported, deadline,
 * block, remedy hint (AC3), history (AC2) and ONLY the SM-04 actions the server allows (`allowedActions`).
 * "Sửa xong" of an order with a block shows its consequences first (US-135: reopening, VD, cleaning task).
 */
export function WorkOrderDrawer({
  workOrder: w,
  onClose,
  onChanged,
}: {
  workOrder: WorkOrder;
  onClose: () => void;
  onChanged: (w: WorkOrder) => void;
}) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles, property } = useSession();
  const { online } = useOnline();
  const toast = useToast();
  const ids = useId();
  const tz = property?.timezone;
  const fd = roles.some((r) => FD_PLUS.includes(r));
  const room = roomLabel({ roomNo: w.roomNo, name: w.roomName }, 'staff');
  const [open, setOpen] = useState<WorkOrderAction | 'block' | null>(null);
  const sevAct = useSubmit();
  const quick = useSubmit();
  const actions = (w.allowedActions ?? []).map((a) => a.action as WorkOrderAction);
  const due = dueText(t, w, Date.now(), tz);
  const st = WO_STATUS[w.status];
  const block =
    w.roomBlock && ['planned', 'active'].includes(w.roomBlock.status) ? w.roomBlock : null;

  const changeSeverity = async (severity: Severity) => {
    if (severity === w.severity) return;
    const out = await sevAct.submit(() =>
      api.updateWorkOrder({ propertyId, workOrderId: w.id }, { severity }, w.version),
    );
    if (out) {
      toast(t('wo.severity_saved', { code: w.code }));
      onChanged(out.data);
    }
  };
  // accept / resume need no input – one click (SM-04 W2, W3 back).
  const run = async (action: 'accept' | 'resume') => {
    const out = await quick.submit((idem) =>
      api.transitionWorkOrder({ propertyId, workOrderId: w.id }, action, {}, w.version, idem),
    );
    if (out) {
      toast(t('wo.updated_toast', { code: w.code }));
      onChanged(out.data);
    }
  };

  const footer = !online ? (
    <Button variant="pri" disabled>
      {t('rsv.need_online')}
    </Button>
  ) : (
    <>
      {actions.includes('cancel') ? (
        <Button variant="ghost" onClick={() => setOpen('cancel')}>
          {t(WO_ACTION_KEY.cancel!)}
        </Button>
      ) : null}
      {actions.includes('reopen') ? (
        <Button onClick={() => setOpen('reopen')}>{t(WO_ACTION_KEY.reopen!)}</Button>
      ) : null}
      {actions.includes('wait-parts') ? (
        <Button onClick={() => setOpen('wait-parts')}>{t(WO_ACTION_KEY['wait-parts']!)}</Button>
      ) : null}
      {w.blockRequested && !block && fd ? (
        <Button onClick={() => setOpen('block')}>{t('wo.block_by_request')}</Button>
      ) : null}
      {actions.includes('resume') ? (
        <Button variant="pri" busy={quick.busy} onClick={() => void run('resume')}>
          {t(WO_ACTION_KEY.resume!)}
        </Button>
      ) : null}
      {actions.includes('accept') ? (
        <Button variant="pri" busy={quick.busy} onClick={() => void run('accept')}>
          {t(WO_ACTION_KEY.accept!)}
        </Button>
      ) : null}
      {actions.includes('complete') ? (
        <Button variant="pri" onClick={() => setOpen('complete')}>
          {t(WO_ACTION_KEY.complete!)}
        </Button>
      ) : null}
    </>
  );

  return (
    <Modal
      open
      variant="drawer"
      title={`${w.code} · ${w.title}`}
      meta={room}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={footer}
    >
      <div className="stack">
        <div className="row wrap">
          <Chip tone={st.tone} icon={st.icon}>
            {t(st.key)}
          </Chip>
          <Chip tone={SEV_TONE[w.severity]} icon="alert">
            {t(`wo.sev.${w.severity}`)}
          </Chip>
          {w.category ? <Chip icon="wrench">{t(WO_CATEGORY_KEY[w.category])}</Chip> : null}
          {w.source === 'guest_app' ? (
            <Chip tone="ink" icon="chat">
              {t('wo.source.guest_app')}
            </Chip>
          ) : null}
          {w.blockRequested ? (
            <Chip tone="warn" icon="lock">
              {t('wo.chip.block_requested')}
            </Chip>
          ) : null}
        </div>
        {w.remedySuggested ? (
          <Alert tone="bad" actions={<Link to="/rack">{t('today.open_rack')}</Link>}>
            {t('wo.remedy_desk', { room })}
          </Alert>
        ) : null}
        {due ? <p className={due.bad ? 'countdown bad' : 'li-s'}>{due.text}</p> : null}
        <p>{w.description}</p>
        <div className="li-s">
          {w.reportedBy ? t('wo.reported_by', { name: w.reportedBy }) : null}
          {w.assigneeName ? ` · ${t('wo.assignee', { name: w.assigneeName })}` : ''}
        </div>
        {w.photoAttachmentIds?.length ? (
          <p className="li-s">
            {t('wo.photos_reported')}: {w.photoAttachmentIds.length}
          </p>
        ) : null}
        {block ? (
          <Alert tone="warn" icon="lock">
            {blockSentence(t, block)}
          </Alert>
        ) : null}
        {w.partsNote ? <p className="li-s">{t('wo.parts_info', { note: w.partsNote })}</p> : null}
        {w.resultNote ? (
          <p className="li-s">{t('wo.result_info', { note: w.resultNote })}</p>
        ) : null}
        {fd && !['done', 'cancelled'].includes(w.status) ? (
          <div>
            <span className="label-h" id={`${ids}-sev`}>
              {t('wo.severity_label')}
            </span>
            <Seg
              labelledBy={`${ids}-sev`}
              value={w.severity}
              disabled={!online || sevAct.busy}
              onChange={(v) => void changeSeverity(v)}
              options={SEVERITIES.map((s) => ({ value: s, label: t(`wo.sev.${s}`) }))}
            />
            {sevAct.view()}
          </div>
        ) : null}
        {quick.view()}
        {w.history?.length ? (
          <section aria-labelledby={`${ids}-log`}>
            <h3 className="label-h" id={`${ids}-log`}>
              {t('wo.log')}
            </h3>
            <ul className="list-plain li-s">
              {w.history.map((h, i) => (
                <li key={i}>
                  {dateTime(h.at)} · {historyLine(t, h)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      {open === 'wait-parts' ? (
        <WaitPartsDialog w={w} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {open === 'complete' ? (
        <CompleteDialog w={w} room={room} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {open === 'cancel' ? (
        <NoteActionDialog
          w={w}
          action="cancel"
          title={t('wo.cancel_title', { code: w.code })}
          label={t('wo.cancel_reason')}
          effect={block ? t('wo.cancel_effect_block', { room }) : undefined}
          onClose={() => setOpen(null)}
          onDone={done}
        />
      ) : null}
      {open === 'reopen' ? (
        <NoteActionDialog
          w={w}
          action="reopen"
          title={t('wo.reopen_title', { code: w.code })}
          label={t('wo.reopen_note')}
          onClose={() => setOpen(null)}
          onDone={done}
        />
      ) : null}
      {open === 'block' ? (
        <BlockDialog
          workOrder={w}
          onClose={() => setOpen(null)}
          onDone={() => {
            setOpen(null);
            void api.getWorkOrder({ propertyId, workOrderId: w.id }).then(
              (x) => onChanged(x.data),
              () => undefined,
            );
          }}
        />
      ) : null}
    </Modal>
  );

  function done(next: WorkOrder) {
    setOpen(null);
    onChanged(next);
  }
}

/** W3 – parts note (required) + expected date (required for medium / low – pauses the deadline). */
function WaitPartsDialog({
  w,
  onClose,
  onDone,
}: {
  w: WorkOrder;
  onClose: () => void;
  onDone: (w: WorkOrder) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const businessDay = useBusinessDay(); // BR-010 (night window)
  const toast = useToast();
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const act = useSubmit({ bound: ['note', 'partsExpectedDate'] });
  const high = w.severity === 'high';
  const ready = note.trim().length >= 3 && (high || !!date);
  const save = async () => {
    const out = await act.submit((idem) =>
      api.transitionWorkOrder(
        { propertyId, workOrderId: w.id },
        'wait-parts',
        { note: note.trim(), partsExpectedDate: date || undefined },
        w.version,
        idem,
      ),
    );
    if (out) {
      toast(t('wo.updated_toast', { code: w.code }));
      onDone(out.data);
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('wo.wait_title', { code: w.code })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!ready}
            onClick={() => void save()}
          >
            {act.label(t('wo.action.wait_parts_save'))}
          </Button>
        </>
      }
    >
      <Field label={t('wo.parts_note')} required error={act.fields.note}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      <Field
        label={t('wo.parts_date')}
        help={high ? undefined : t('wo.parts_date_help')}
        required={!high}
        error={act.fields.partsExpectedDate}
      >
        {(p) => (
          <input
            {...p}
            type="date"
            className="input"
            min={businessDay}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}
      </Field>
      {high ? <Alert tone="warn">{t('wo.parts_high_note')}</Alert> : null}
      {act.view()}
    </Modal>
  );
}

/**
 * W4 – result (required) + photo after the repair (required for Gấp / Trong ngày – DOM D-15). With a block
 * the consequences come first in a confirm box (US-135, US-062 AC1): reopening on every channel, room "VD",
 * housekeeping task "Dọn sau sửa chữa".
 */
function CompleteDialog({
  w,
  room,
  onClose,
  onDone,
}: {
  w: WorkOrder;
  room: string;
  onClose: () => void;
  onDone: (w: WorkOrder) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [result, setResult] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [confirming, setConfirming] = useState(false);
  const act = useSubmit({ bound: ['resultNote', 'photoAttachmentIds'] });
  const photoRequired = w.severity === 'high' || w.severity === 'medium';
  const block = w.roomBlock && w.roomBlock.status === 'active' ? w.roomBlock : null;
  const ready = result.trim().length >= 3 && (!photoRequired || !!photo);
  const save = async () => {
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
      return api.transitionWorkOrder(
        { propertyId, workOrderId: w.id },
        'complete',
        { resultNote: result.trim(), photoAttachmentIds: photoIds },
        w.version,
        idem,
      );
    });
    setConfirming(false);
    if (!out) return;
    toast(block ? t('wo.reopened', { room }) : t('wo.closed_toast', { code: w.code }));
    onDone(out.data);
  };
  return (
    <>
      <Modal
        open={!confirming}
        size="sm"
        title={t('wo.done_title', { code: w.code })}
        onClose={onClose}
        closeLabel={t('common.close')}
        dirty={!!result || !!photo}
        footer={
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              variant="pri"
              busy={act.busy}
              busyLabel={act.busyLabel}
              disabled={!ready}
              onClick={() => (block ? setConfirming(true) : void save())}
            >
              {act.label(t('wo.done_confirm'))}
            </Button>
          </>
        }
      >
        <Field label={t('wo.result')} required error={act.fields.resultNote}>
          {(p) => (
            <textarea
              {...p}
              className="input"
              rows={3}
              maxLength={500}
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
          )}
        </Field>
        <FilePicker
          label={t('wo.photos_after')}
          file={photo}
          onChange={setPhoto}
          required={photoRequired}
          error={act.fields.photoAttachmentIds}
        />
        <p className="caption">
          {photoRequired ? t('wo.photo_required') : null} {t('wo.no_photo_desk')}
        </p>
        {act.view()}
      </Modal>
      {confirming && block ? (
        <ConfirmDialog
          danger={false}
          title={t('wo.done_title', { code: w.code })}
          body={t('wo.done_effects_title')}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('wo.done_confirm')}
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setConfirming(false)}
          onConfirm={() => void save()}
        >
          <ul className="list-plain li-s">
            <li>{t('wo.done_effect_unblock', { room })}</li>
            <li>{t('wo.done_effect_vd')}</li>
            <li>{t('wo.done_effect_task')}</li>
          </ul>
          {act.view()}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

/** W5 cancel (reason) / W6 reopen (note) – one required text; cancel with a block says it reopens. */
function NoteActionDialog({
  w,
  action,
  title,
  label,
  effect,
  onClose,
  onDone,
}: {
  w: WorkOrder;
  action: 'cancel' | 'reopen';
  title: string;
  label: string;
  effect?: string;
  onClose: () => void;
  onDone: (w: WorkOrder) => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [text, setText] = useState('');
  const field = action === 'cancel' ? 'cancelReason' : 'note';
  const act = useSubmit({ bound: [field] });
  const save = async () => {
    const out = await act.submit((idem) =>
      api.transitionWorkOrder(
        { propertyId, workOrderId: w.id },
        action,
        action === 'cancel' ? { cancelReason: text.trim() } : { note: text.trim() },
        w.version,
        idem,
      ),
    );
    if (out) {
      toast(t('wo.updated_toast', { code: w.code }));
      onDone(out.data);
    }
  };
  return (
    <Modal
      open
      size="sm"
      role={action === 'cancel' ? 'alertdialog' : undefined}
      title={title}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('confirm.keep')}</Button>
          <Button
            variant={action === 'cancel' ? 'danger' : 'pri'}
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={text.trim().length < 3}
            onClick={() => void save()}
          >
            {act.label(t(WO_ACTION_KEY[action]!))}
          </Button>
        </>
      }
    >
      {effect ? <Alert tone="warn">{effect}</Alert> : null}
      <Field label={label} required error={act.fields[field]}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
      </Field>
      {act.view()}
    </Modal>
  );
}
