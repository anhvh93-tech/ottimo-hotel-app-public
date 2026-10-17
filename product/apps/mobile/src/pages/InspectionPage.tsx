import { Alert, Skeleton, StateView } from '@ottimo/ui';
import { roomLabel, useI18n } from '@ottimo/i18n';
import { useEffect, useMemo, useState } from 'react';
import { useHkActions } from '../app/actions';
import {
  isApiError,
  newIdempotencyKey,
  queuedOps,
  sendRequest,
  staffApi,
  type Checklist,
} from '../app/api';
import { asRoom } from '../app/rooms';
import { goBack, navigate } from '../app/router';
import type { StaffSession } from '../app/session';
import { useHkData } from '../app/data';
import type { OfflineCache } from '../data/cache';
import { useQueue } from '../queue/QueueProvider';
import { PhotoPicker } from '../ui/PhotoPicker';
import { TopBar } from '../ui/parts';

type Load =
  | { kind: 'loading' }
  | { kind: 'ready'; checklist: Checklist }
  | { kind: 'empty' }
  | { kind: 'error' };

/**
 * H20 20.3 – inspection with the property checklist (US-055, BR-808). "Kiểm đạt" unlocks only when every
 * required item is ticked (and the room photo taken when the server asks for it – HK self-inspection).
 * Not passed → note required, room stays "Đã dọn – chờ kiểm" and the server creates a re-clean task.
 */
export function InspectionPage({
  session,
  cache,
  roomId,
}: {
  session: StaffSession;
  cache: OfflineCache;
  roomId: string;
}) {
  const { t, locale } = useI18n();
  const data = useHkData();
  const { online } = useQueue();
  const act = useHkActions(session);
  const room = data.rooms?.data.find((r) => r.roomId === roomId);
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [failing, setFailing] = useState(false);
  const [failNote, setFailNote] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const fromCache = async () => {
      const c = await cache.loadChecklist(roomId);
      if (!alive) return;
      setLoad(c ? { kind: 'ready', checklist: c.data } : { kind: 'error' });
    };
    if (!globalThis.navigator?.onLine) {
      void fromCache();
    } else {
      staffApi.getInspectionChecklist(session.propertyId, roomId, locale).then(
        async (c) => {
          await cache.saveChecklist(roomId, c, Date.now());
          if (alive) setLoad(c.items.length ? { kind: 'ready', checklist: c } : { kind: 'empty' });
        },
        () => void fromCache(),
      );
    }
    return () => {
      alive = false;
    };
  }, [cache, roomId, session.propertyId, locale]);

  const checklist = load.kind === 'ready' ? load.checklist : undefined;
  const items = useMemo(() => checklist?.items ?? [], [checklist]);
  const photoItem = items.find((i) => i.photoRequired);
  const tickItems = items.filter((i) => !i.photoRequired);
  // BR-808: the whole checklist is the condition for VC → VI – every item ticked (optional ones too,
  // otherwise they would go out as "not passed" without the note the server requires).
  const requiredLeft = tickItems.filter((i) => !ticked.has(i.code)).length;
  const photoOk = !photoItem || photos.length > 0;
  const doneCount =
    tickItems.filter((i) => ticked.has(i.code)).length + (photoItem && photoOk ? 1 : 0);
  // SR-PWA-01: inspection photos are not on the offline allow-list (SEC E07-12) → photo step needs a connection.
  const needsNetwork = Boolean(photoItem) && !online;
  const canPass = requiredLeft === 0 && photoOk && !needsNetwork && !busy;
  const label = room ? roomLabel(asRoom(room), 'staff') : '';

  const toggle = (code: string) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const submit = async (passed: boolean) => {
    if (!checklist || !room) return;
    setTried(true);
    if (!passed && failNote.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const photoIds: string[] = [];
      for (const p of photos) {
        const res = await sendRequest<{ id: string }>({
          ...queuedOps.uploadAttachment(session.propertyId, p, 'inspection'),
          idempotencyKey: newIdempotencyKey(),
        });
        photoIds.push(res.id);
      }
      const note = failNote.trim();
      await act.recordInspection(
        room,
        {
          checklistVersion: checklist.version,
          items: items.map((i) => {
            const ok = i.photoRequired ? photoOk : ticked.has(i.code);
            return ok ? { code: i.code, passed: true } : { code: i.code, passed: false, note };
          }),
          ...(photoIds.length ? { photoAttachmentIds: photoIds } : {}),
          performedAt: new Date().toISOString(),
        },
        passed,
      );
      navigate({ name: session.mode === 'mt' ? 'rooms' : 'tasks' }, true);
    } catch (e) {
      setError(
        isApiError(e) && e.code === 'FILE_REJECTED' ? t('error.FILE_REJECTED') : t('hk.error_body'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar
        title={t('hk.insp.title', { room: label })}
        sub={checklist ? t('hk.insp.progress', { n: doneCount, total: items.length }) : undefined}
        back={{ name: 'room', roomId }}
      />
      <div className="m-body hk-stack">
        {load.kind === 'loading' ? (
          <div aria-busy="true">
            <span className="sr-only">{t('common.loading')}</span>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        ) : load.kind === 'empty' ? (
          <StateView title={t('hk.insp.empty_title')}>{t('hk.insp.empty_body')}</StateView>
        ) : load.kind === 'error' || !room ? (
          <StateView
            kind="error"
            title={t('hk.error_title')}
            action={
              <button
                type="button"
                className="btn xl"
                onClick={() => goBack({ name: 'room', roomId })}
              >
                {t('common.back')}
              </button>
            }
          >
            {t('hk.error_body')}
          </StateView>
        ) : (
          <>
            <fieldset className="fieldset-plain">
              <legend>{t('hk.insp.legend')}</legend>
              {tickItems.map((i) => (
                <label key={i.code} className="check">
                  <input
                    type="checkbox"
                    checked={ticked.has(i.code)}
                    onChange={() => toggle(i.code)}
                  />
                  <span>
                    {i.label}
                    {i.required ? <span aria-hidden="true"> *</span> : null}
                  </span>
                </label>
              ))}
            </fieldset>
            {photoItem ? (
              <PhotoPicker
                photos={photos}
                onChange={setPhotos}
                max={3}
                label={`${photoItem.label} *`}
              />
            ) : null}
            {needsNetwork ? <Alert tone="warn">{t('hk.need_network')}</Alert> : null}
            {failing ? (
              <div className="field">
                <label htmlFor="insp-fail">{t('hk.insp.fail_note')}</label>
                <textarea
                  id="insp-fail"
                  className="input"
                  maxLength={300}
                  value={failNote}
                  aria-invalid={tried && failNote.trim().length < 3 ? true : undefined}
                  aria-describedby="insp-fail-help"
                  onChange={(e) => setFailNote(e.target.value)}
                />
                <p className="help" id="insp-fail-help">
                  {tried && failNote.trim().length < 3
                    ? t('common.required')
                    : t('hk.insp.fail_effect')}
                </p>
              </div>
            ) : null}
            {error ? <Alert tone="bad">{error}</Alert> : null}
          </>
        )}
      </div>
      {checklist && room ? (
        <div className="wiz-foot hk-foot two">
          {failing ? (
            <>
              <button type="button" className="btn xl" onClick={() => setFailing(false)}>
                {t('common.back')}
              </button>
              <button
                type="button"
                className="btn pri xl"
                disabled={busy || needsNetwork}
                onClick={() => void submit(false)}
              >
                {t('hk.insp.fail_save')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn xl" onClick={() => setFailing(true)}>
                {t('hk.insp.fail')}
              </button>
              <button
                type="button"
                className="btn pri xl"
                aria-disabled={!canPass || undefined}
                aria-describedby={!canPass ? 'insp-why' : undefined}
                onClick={() => canPass && void submit(true)}
              >
                {t('hk.insp.pass')}
              </button>
            </>
          )}
          {!failing && !canPass ? (
            <p className="help hk-why" id="insp-why">
              {needsNetwork
                ? t('hk.need_network')
                : t('hk.insp.progress', { n: doneCount, total: items.length })}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
