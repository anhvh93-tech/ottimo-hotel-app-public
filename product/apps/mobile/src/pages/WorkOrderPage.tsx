import { Alert, Skeleton, StateView } from '@ottimo/ui';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { useCallback, useEffect, useState } from 'react';
import {
  isApiError,
  newIdempotencyKey,
  queuedOps,
  sendRequest,
  staffApi,
  type WorkOrder,
  type WorkOrderAction,
} from '../app/api';
import { asRoom } from '../app/rooms';
import type { StaffSession } from '../app/session';
import { addDays, hhmm, ddmm, localDate, shortLocalDate } from '../app/time';
import { DONE_PHOTO_REQUIRED, nextDue } from '../app/workOrders';
import { useQueue } from '../queue/QueueProvider';
import { useLiveEvents } from '../app/live';
import { AttachmentPhotos } from '../ui/AttachmentPhotos';
import { PhotoPicker } from '../ui/PhotoPicker';
import { SeverityChip, TopBar, WoStatusChip } from '../ui/parts';

type View = 'detail' | 'done' | 'wait';

/** SM-04 fallback when the server sends no `allowedActions`. */
function actionsOf(wo: WorkOrder): WorkOrderAction[] {
  if (wo.allowedActions?.length) {
    return wo.allowedActions.map((a) => a.action as WorkOrderAction);
  }
  if (wo.status === 'new') return ['accept'];
  if (wo.status === 'in_progress') return ['wait-parts', 'complete'];
  if (wo.status === 'waiting_parts') return ['resume', 'complete'];
  return [];
}

function logText(
  h: NonNullable<WorkOrder['history']>[number],
  wo: WorkOrder,
  t: (k: string, a?: Record<string, string | number>) => string,
) {
  const who = h.actorName ?? '–';
  const status = (s?: string | null) => (s ? t(`wo.status.${s}`) : '–');
  const sev = (s?: string | null) => (s ? t(`wo.sev.${s}`) : '–');
  switch (h.change) {
    case 'created':
      return wo.source === 'housekeeping'
        ? t('wo.log.created_hk')
        : wo.source === 'guest_app'
          ? t('wo.log.created_guest')
          : t('wo.log.created', { who });
    case 'status':
      return t('wo.log.status', { who, from: status(h.from), to: status(h.to) });
    case 'severity':
      return t('wo.log.severity', { who, from: sev(h.from), to: sev(h.to) });
    case 'assignee':
      return t('wo.log.assignee', { who, to: h.to ?? '–' });
    case 'block_requested':
      return t('wo.log.block_requested', { who });
    case 'block':
      return t('wo.log.block', { who });
    case 'parts_expected_date':
      return t('wo.log.parts_date', { who, date: shortLocalDate(h.to) });
    default:
      return t('wo.log.note', { who, note: h.note ?? h.to ?? '' });
  }
}

/** H22 22.2–22.4 – one work order: pick up, waiting for parts (date), fixed (result + photos). Online only. */
export function WorkOrderPage({ session, id }: { session: StaffSession; id: string }) {
  const { t } = useI18n();
  const { online } = useQueue();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [view, setView] = useState<View>('detail');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // forms
  const [result, setResult] = useState('');
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [partsNote, setPartsNote] = useState('');
  const [partsDate, setPartsDate] = useState('');
  const [tried, setTried] = useState(false);

  const load = useCallback(async () => {
    try {
      setWo(await staffApi.getWorkOrder(session.propertyId, id));
      setState('ready');
    } catch {
      setState('error');
    }
  }, [session.propertyId, id]);
  useEffect(() => {
    void load();
  }, [load]);
  // Someone else changed this work order (SSE): re-read – only while no form is open, so a form keeps the
  // version it was opened with and the server's If-Match check still protects it.
  useLiveEvents(['work_order.changed'], () => {
    if (view === 'detail') void load();
  });

  if (state === 'loading') {
    return (
      <>
        <TopBar title={t('nav.work_orders')} back={{ name: 'wo' }} />
        <div className="m-body" aria-busy="true">
          <Skeleton height={120} />
        </div>
      </>
    );
  }
  if (state === 'error' || !wo) {
    return (
      <>
        <TopBar title={t('nav.work_orders')} back={{ name: 'wo' }} />
        <div className="m-body">
          <StateView
            kind="error"
            title={t('wo.error_title')}
            action={
              <button type="button" className="btn pri xl" onClick={() => void load()}>
                {t('common.retry')}
              </button>
            }
          >
            {online ? t('hk.error_body') : t('hk.need_network')}
          </StateView>
        </div>
      </>
    );
  }

  const room = roomLabel(asRoom(wo), 'staff');
  const actions = actionsOf(wo);
  const due = nextDue(wo, t);
  const blocked =
    wo.roomBlock && (wo.roomBlock.status === 'active' || wo.roomBlock.status === 'planned');
  const photoRequired = DONE_PHOTO_REQUIRED.includes(wo.severity);

  const run = async (action: WorkOrderAction, body: Record<string, unknown>, after?: string) => {
    setBusy(true);
    setError(null);
    try {
      const next = await staffApi.transitionWorkOrder(
        session.propertyId,
        wo,
        action,
        body,
        newIdempotencyKey(),
      );
      setWo(next);
      setView('detail');
      setNotice(after ?? null);
    } catch (e) {
      if (isApiError(e) && (e.code === 'VERSION_CONFLICT' || e.code === 'INVALID_TRANSITION')) {
        setError(t('error.VERSION_CONFLICT'));
        await load();
      } else if (isApiError(e) && e.code === 'VALIDATION_FAILED') {
        setError(t('error.VALIDATION_FAILED', { n: e.fieldErrors.length || 1 }));
      } else {
        setError(online ? t('hk.error_body') : t('hk.need_network'));
      }
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    setTried(true);
    if (result.trim().length < 3 || (photoRequired && photos.length === 0)) return;
    setBusy(true);
    try {
      const ids: string[] = [];
      for (const p of photos) {
        const r = await sendRequest<{ id: string }>({
          ...queuedOps.uploadAttachment(session.propertyId, p, 'work_order'),
          idempotencyKey: newIdempotencyKey(),
        });
        ids.push(r.id);
      }
      if (blocked) setNotice(t('wo.reopening'));
      await run(
        'complete',
        { resultNote: result.trim(), ...(ids.length ? { photoAttachmentIds: ids } : {}) },
        blocked ? t('wo.reopened', { room }) : undefined,
      );
    } catch {
      setBusy(false);
      setError(online ? t('error.FILE_REJECTED') : t('hk.need_network'));
    }
  };

  const today = localDate();
  const waitParts = async () => {
    setTried(true);
    const dateNeeded = wo.severity !== 'high';
    if (partsNote.trim().length < 3 || (dateNeeded && (!partsDate || partsDate < today))) return;
    await run('wait-parts', {
      note: partsNote.trim(),
      ...(partsDate ? { partsExpectedDate: partsDate } : {}),
    });
  };

  const header = (
    <TopBar
      title={
        <>
          <span className="mono">{wo.code}</span> · {t('hk.room_title', { room })}
        </>
      }
      back={view === 'detail' ? { name: 'wo' } : undefined}
    />
  );
  const offlineLock = !online ? <Alert tone="warn">{t('hk.need_network')}</Alert> : null;

  if (view === 'done') {
    return (
      <>
        {header}
        <div className="m-body hk-stack">
          <h2 className="hk-h2">{t('wo.done_title', { code: wo.code })}</h2>
          {!online && blocked ? <Alert tone="warn">{t('wo.done_offline')}</Alert> : offlineLock}
          <div className="field">
            <label htmlFor="wo-result">
              {t('wo.result')} <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="wo-result"
              className="input"
              maxLength={500}
              value={result}
              aria-required="true"
              aria-invalid={tried && result.trim().length < 3 ? true : undefined}
              onChange={(e) => setResult(e.target.value)}
            />
            {tried && result.trim().length < 3 ? (
              <p className="help err">{t('common.required')}</p>
            ) : null}
          </div>
          <PhotoPicker
            photos={photos}
            onChange={setPhotos}
            max={3}
            label={`${t('wo.photos_after')}${photoRequired ? ' *' : ''}`}
            describedBy="wo-photo-help"
          />
          {photoRequired ? (
            <p className={`help${tried && photos.length === 0 ? ' err' : ''}`} id="wo-photo-help">
              {t('wo.photo_required')}
            </p>
          ) : null}
          {blocked ? (
            <div className="card">
              <b>{t('wo.done_effects_title')}</b>
              <ul className="hk-steps">
                <li>{t('wo.done_effect_unblock', { room })}</li>
                <li>{t('wo.done_effect_vd')}</li>
                <li>{t('wo.done_effect_task')}</li>
              </ul>
            </div>
          ) : null}
          {notice ? <Alert tone="warn">{notice}</Alert> : null}
          {error ? <Alert tone="bad">{error}</Alert> : null}
        </div>
        <div className="wiz-foot hk-foot two">
          <button type="button" className="btn xl" onClick={() => setView('detail')}>
            {t('common.back')}
          </button>
          <button
            type="button"
            className="btn pri xl"
            disabled={busy || !online}
            aria-busy={busy || undefined}
            onClick={() => void complete()}
          >
            {online ? t('wo.done_confirm') : t('hk.need_network')}
          </button>
        </div>
      </>
    );
  }

  if (view === 'wait') {
    const dateNeeded = wo.severity !== 'high';
    return (
      <>
        {header}
        <div className="m-body hk-stack">
          <h2 className="hk-h2">{t('wo.wait_title', { code: wo.code })}</h2>
          {offlineLock}
          <div className="field">
            <label htmlFor="wo-parts">
              {t('wo.parts_note')} <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="wo-parts"
              className="input"
              maxLength={500}
              value={partsNote}
              aria-required="true"
              aria-invalid={tried && partsNote.trim().length < 3 ? true : undefined}
              onChange={(e) => setPartsNote(e.target.value)}
            />
          </div>
          {dateNeeded ? (
            <div className="field">
              <label htmlFor="wo-parts-date">
                {t('wo.parts_date')} <span aria-hidden="true">*</span>
              </label>
              <input
                id="wo-parts-date"
                className="input"
                type="date"
                min={today}
                max={addDays(today, 365)}
                value={partsDate}
                aria-required="true"
                aria-invalid={tried && (!partsDate || partsDate < today) ? true : undefined}
                aria-describedby="wo-parts-date-help"
                onChange={(e) => setPartsDate(e.target.value)}
              />
              <p className="help" id="wo-parts-date-help">
                {t('wo.parts_date_help')}
              </p>
            </div>
          ) : (
            <Alert tone="warn">{t('wo.parts_high_note')}</Alert>
          )}
          {error ? <Alert tone="bad">{error}</Alert> : null}
        </div>
        <div className="wiz-foot hk-foot two">
          <button type="button" className="btn xl" onClick={() => setView('detail')}>
            {t('common.back')}
          </button>
          <button
            type="button"
            className="btn pri xl"
            disabled={busy || !online}
            onClick={() => void waitParts()}
          >
            {online ? t('wo.action.wait_parts_save') : t('hk.need_network')}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="m-body hk-stack">
        <div className="hd hk-top-chips">
          <SeverityChip severity={wo.severity} />
          <WoStatusChip status={wo.status} />
        </div>
        <div>
          <b className="d-block">{wo.title}</b>
          {wo.description ? <p className="m-0 gw-pre">{wo.description}</p> : null}
        </div>
        {due ? (
          <p className={`countdown ${due.tone === 'neutral' ? '' : due.tone}`}>{due.text}</p>
        ) : null}
        {blocked && wo.roomBlock ? (
          <Alert tone="warn" icon="lock">
            {t('wo.block_info', {
              from: shortLocalDate(wo.roomBlock.startDate),
              to: shortLocalDate(addDays(wo.roomBlock.endDatePlanned, -1)),
              reopen: shortLocalDate(wo.roomBlock.endDatePlanned),
            })}
          </Alert>
        ) : null}
        {notice ? <Alert tone="ok">{notice}</Alert> : null}
        {error ? <Alert tone="bad">{error}</Alert> : null}
        {/* UXR P-11: what the technician did ("Đã làm gì?" at "Sửa xong"). */}
        {wo.resultNote ? (
          <p className="m-0 gw-pre">{t('wo.result_info', { note: wo.resultNote })}</p>
        ) : null}
        {/* 0.3.7 returns the report photos and the after-repair photos in one list (BE-C/ARC: separate field
            asked, P-11) – once repaired, the block is not called "Ảnh lúc báo". */}
        <AttachmentPhotos
          propertyId={session.propertyId}
          ids={wo.photoAttachmentIds ?? []}
          title={wo.doneAt ? t('wo.photos_report_and_after') : t('wo.photos_reported')}
          online={online}
        />
        {wo.history?.length ? (
          <section aria-labelledby="wo-log">
            <h2 className="grp-h" id="wo-log">
              {t('wo.log')}
            </h2>
            <ul className="tl">
              {[...wo.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className={i === 0 ? 'now' : undefined}>
                  <span className="when">
                    {ddmm(h.at)} {hhmm(h.at)}
                  </span>{' '}
                  · {logText(h, wo, t)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {offlineLock}
      </div>
      {actions.length ? (
        <div className={`wiz-foot hk-foot${actions.length > 1 ? ' two' : ''}`}>
          {actions.includes('accept') ? (
            <button
              type="button"
              className="btn pri xl block"
              disabled={busy || !online}
              onClick={() => void run('accept', {})}
            >
              {online ? t('wo.action.start') : t('hk.need_network')}
            </button>
          ) : null}
          {actions.includes('resume') ? (
            <button
              type="button"
              className="btn xl"
              disabled={busy || !online}
              onClick={() => void run('resume', {})}
            >
              {t('wo.action.resume')}
            </button>
          ) : null}
          {actions.includes('wait-parts') ? (
            <button
              type="button"
              className="btn xl"
              disabled={!online}
              onClick={() => setView('wait')}
            >
              {t('wo.action.wait_parts')}
            </button>
          ) : null}
          {actions.includes('complete') ? (
            <button
              type="button"
              className="btn pri xl"
              disabled={!online}
              onClick={() => setView('done')}
            >
              {t('wo.action.done')}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
