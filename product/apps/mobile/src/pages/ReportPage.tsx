import { Alert, Icon } from '@ottimo/ui';
import { compareRoomNo, roomLabel, useI18n } from '@ottimo/i18n';
import { useEffect, useRef, useState } from 'react';
import { useHkActions } from '../app/actions';
import {
  isApiError,
  newIdempotencyKey,
  queuedOps,
  sendRequest,
  type ApiError,
  type OccupancyConflict,
  type Severity,
  type WorkOrder,
  type WorkOrderCategory,
  type WorkOrderCreate,
} from '../app/api';
import { useHkData } from '../app/data';
import { asRoom } from '../app/rooms';
import { canBlock, type StaffSession } from '../app/session';
import { addDays, localDate, shortLocalDate } from '../app/time';
import { useQueue } from '../queue/QueueProvider';
import { PhotoPicker } from '../ui/PhotoPicker';
import { CallDesk, TopBar } from '../ui/parts';

/** Quick categories of hi-fi 21.1 → contract category + suggested severity (BR-809, people can change it). */
const KINDS: { category: WorkOrderCategory; key: string; severity: Severity }[] = [
  { category: 'hot_water', key: 'hk.wo.k.hot_water', severity: 'high' },
  { category: 'power', key: 'hk.wo.k.power', severity: 'high' },
  { category: 'leak', key: 'hk.wo.k.leak', severity: 'high' },
  { category: 'door_lock', key: 'hk.wo.k.lock', severity: 'high' },
  { category: 'broken_item', key: 'hk.wo.k.broken', severity: 'medium' },
  { category: 'other', key: 'hk.wo.k.other', severity: 'medium' },
];
const SEVERITIES: { value: Severity; key: string; help: string }[] = [
  { value: 'high', key: 'wo.sev.high', help: 'wo.sev.high_help' },
  { value: 'medium', key: 'wo.sev.medium', help: 'wo.sev.medium_help' },
  { value: 'low', key: 'wo.sev.low', help: 'wo.sev.low_help' },
];

type Result = { kind: 'sent'; wo: WorkOrder } | { kind: 'queued' };
type BlockError = {
  code: 'ROOM_OCCUPIED' | 'ROOM_UNAVAILABLE' | 'ROOM_BLOCKED';
  conflicts: OccupancyConflict[];
};

const BLOCK_CODES = new Set(['ROOM_OCCUPIED', 'ROOM_UNAVAILABLE', 'ROOM_BLOCKED']);

/**
 * H21 21.1/21.2 – incident report (US-057), and H22 22.5 – new work order + room block (US-061, A86).
 * - Housekeeping: "Đề nghị khóa căn" only (`blockRequested`); works offline through the queue.
 * - Maintenance / front desk+: may block the room (O1): start + expected-done dates, reason; the server
 *   works out the back-on-sale date (BR-804) and returns it. A block touches inventory → online only,
 *   never queued (ADR-005). 409 ROOM_OCCUPIED / ROOM_UNAVAILABLE (+ bookings) / ROOM_BLOCKED are explained
 *   with what to do. A manager's "đã có phương án" never lifts the overlap check (0.3.5 A-03 – always 409),
 *   so the PWA does not offer it: the bookings are moved on the Desk first (US-061 AC2/AC3).
 */
export function ReportPage({ session, roomId }: { session: StaffSession; roomId?: string }) {
  const { t } = useI18n();
  const data = useHkData();
  const { online, queue } = useQueue();
  const act = useHkActions(session);
  const mayBlock = canBlock(session);
  const today = localDate();
  const rooms = [...(data.rooms?.data ?? [])].sort((a, b) => compareRoomNo(a.roomNo, b.roomNo));
  const [room, setRoom] = useState(roomId ?? '');
  const [kind, setKind] = useState<WorkOrderCategory | null>(null);
  const [desc, setDesc] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [blockRequested, setBlockRequested] = useState(false);
  const [block, setBlock] = useState(false);
  const [blockFrom, setBlockFrom] = useState(today);
  const [blockDone, setBlockDone] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<BlockError | null>(null);
  // Photos already on the server (a 409 on the block must not upload them twice).
  const uploaded = useRef<{ photos: Blob[]; ids: string[] }>({ photos: [], ids: [] });
  // One key per report: a resend of the same report is a replay, not a second work order (ADR-009).
  const key = useRef(newIdempotencyKey());
  const selected = rooms.find((r) => r.roomId === room);
  const descOk = desc.trim().length >= 3;
  const blockDatesOk =
    !block || (blockFrom >= today && Boolean(blockDone) && blockDone >= blockFrom);
  const blockReasonOk = !block || blockReason.trim().length >= 3;
  const full = queue.isFull(photos.length);
  const mtNew = session.mode === 'mt';

  const pickKind = (k: (typeof KINDS)[number]) => {
    setKind(k.category);
    setSeverity(k.severity);
    if (!blockReason.trim()) setBlockReason(t(k.key));
  };

  const uploadPhotos = async () => {
    if (uploaded.current.photos === photos) return uploaded.current.ids;
    const ids: string[] = [];
    for (const p of photos) {
      const res = await sendRequest<{ id: string }>({
        ...queuedOps.uploadAttachment(session.propertyId, p, 'work_order'),
        idempotencyKey: newIdempotencyKey(),
      });
      ids.push(res.id);
    }
    uploaded.current = { photos, ids };
    return ids;
  };

  const submit = async (withBlock = block) => {
    setTried(true);
    if (!selected || !descOk || (withBlock && (!blockDatesOk || !blockReasonOk))) return;
    const category = kind ?? 'other';
    const kindLabel = t(KINDS.find((k) => k.category === category)!.key);
    const title = category === 'other' ? desc.trim().slice(0, 80) : kindLabel;
    const input = {
      roomId: selected.roomId,
      roomNo: selected.roomNo,
      roomName: selected.roomName,
      title,
      description: desc.trim(),
      severity,
      category,
      blockRequested: mayBlock ? false : blockRequested,
      photos,
    };
    setBusy(true);
    setError(null);
    setBlockError(null);
    try {
      if (!online) throw new Error('offline');
      const ids = await uploadPhotos();
      const body: WorkOrderCreate = {
        roomId: input.roomId,
        title,
        description: input.description,
        severity,
        category,
        blockRequested: input.blockRequested,
        ...(ids.length ? { photoAttachmentIds: ids } : {}),
        ...(withBlock
          ? {
              block: {
                startDate: blockFrom,
                expectedDoneDate: blockDone,
                reason: blockReason.trim(),
              },
            }
          : {}),
      };
      const wo = await sendRequest<WorkOrder>({
        ...queuedOps.createWorkOrder(session.propertyId, body),
        idempotencyKey: key.current,
      });
      setResult({ kind: 'sent', wo });
    } catch (e) {
      if (isApiError(e) && BLOCK_CODES.has(e.code)) {
        key.current = newIdempotencyKey(); // refused → the next attempt is a new request
        setBlockError({
          code: e.code as BlockError['code'],
          conflicts: (e as ApiError).problem.conflicts ?? [],
        });
      } else if (isApiError(e) && !e.isNetwork && e.status !== 503 && e.status < 500) {
        key.current = newIdempotencyKey();
        setError(
          e.code === 'FILE_REJECTED'
            ? t('error.FILE_REJECTED')
            : t('error.VALIDATION_FAILED', { n: 1 }),
        );
      } else if (withBlock) {
        // A block is never queued (inventory – ADR-005): say so, keep the form.
        setError(t('hk.need_network'));
      } else if (full) {
        setError(t('hk.queue_full'));
      } else {
        await act.queueIncident(input);
        setResult({ kind: 'queued' });
      }
    } finally {
      setBusy(false);
    }
  };

  // A refusal appears under the form: bring it into view (it is also a role=alert for screen readers).
  const problemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (blockError || error) problemRef.current?.scrollIntoView?.({ block: 'center' });
  }, [blockError, error]);

  const title = mtNew ? t('wo.new_title') : t('nav.report_issue');

  if (result) {
    const b = result.kind === 'sent' ? result.wo.roomBlock : undefined;
    return (
      <>
        <TopBar title={title} />
        <div className="m-body hk-stack">
          {result.kind === 'sent' ? (
            <Alert tone="ok" title={t('hk.wo.sent_title', { code: result.wo.code })}>
              {result.wo.severity === 'high' ? t('hk.wo.sent_body_high') : t('hk.wo.sent_body')}
            </Alert>
          ) : (
            <Alert tone="warn" icon="hourglass" title={t('hk.wo.queued_title')}>
              {t('hk.wo.queued_body')}
            </Alert>
          )}
          {b ? (
            // Honest state (HR-20): "Đã khóa" only because the server answered with the block.
            <Alert tone="ok" icon="lock" title={t('hk.lock_done')}>
              {t('wo.block_info', {
                from: shortLocalDate(b.startDate),
                to: shortLocalDate(addDays(b.endDatePlanned, -1)),
                reopen: shortLocalDate(b.endDatePlanned),
              })}
            </Alert>
          ) : null}
          <a className="btn pri xl block" href={mtNew ? '#/wo' : '#/tasks'}>
            {t('hk.back_to_tasks')}
          </a>
          {result.kind === 'queued' ? <CallDesk block /> : null}
        </div>
      </>
    );
  }

  const roomText = selected ? roomLabel(asRoom(selected), 'staff') : '';
  return (
    <>
      <TopBar title={title} />
      <div className="m-body hk-stack">
        {!online ? (
          <Alert tone="warn">{block ? t('hk.need_network') : t('hk.wo.offline')}</Alert>
        ) : null}
        <div className="field">
          <label htmlFor="wo-room">{t('hk.wo.room')}</label>
          <select
            id="wo-room"
            className="input"
            value={room}
            aria-invalid={tried && !selected ? true : undefined}
            aria-describedby={tried && !selected ? 'wo-room-err' : undefined}
            onChange={(e) => {
              setRoom(e.target.value);
              setBlockError(null);
            }}
          >
            <option value="">–</option>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {roomLabel(asRoom(r), 'staff')}
              </option>
            ))}
          </select>
          {tried && !selected ? (
            <p className="help err" id="wo-room-err">
              {t('hk.wo.pick_room_title')}
            </p>
          ) : null}
        </div>

        <fieldset className="fieldset-plain">
          <legend>{t('hk.wo.what')}</legend>
          <div className="filters">
            {KINDS.map((k) => (
              <button
                key={k.category}
                type="button"
                aria-pressed={kind === k.category}
                onClick={() => pickKind(k)}
              >
                {t(k.key)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="wo-desc">
            {t('hk.wo.desc')} <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="wo-desc"
            className="input"
            maxLength={500}
            value={desc}
            aria-required="true"
            aria-invalid={tried && !descOk ? true : undefined}
            aria-describedby="wo-desc-help"
            onChange={(e) => setDesc(e.target.value)}
          />
          <p className={`help${tried && !descOk ? ' err' : ''}`} id="wo-desc-help">
            {t('hk.wo.desc_required')}
          </p>
        </div>

        <PhotoPicker photos={photos} onChange={setPhotos} max={3} label={t('hk.wo.photos')} />

        <fieldset className="fieldset-plain">
          <legend>{t('hk.wo.severity')}</legend>
          {SEVERITIES.map((s) => (
            <label key={s.value} className="choice">
              <input
                type="radio"
                name="wo-sev"
                value={s.value}
                checked={severity === s.value}
                onChange={() => setSeverity(s.value)}
              />
              <span className="hk-choice-txt">
                {t(s.key)}
                <span className="li-s d-block">{t(s.help)}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {mayBlock ? (
          <>
            <label className="check">
              <input
                type="checkbox"
                checked={block}
                onChange={(e) => {
                  setBlock(e.target.checked);
                  setBlockError(null);
                }}
              />
              <span>{t('hk.lock_request')}</span>
            </label>
            {block ? (
              <div className="card hk-stack">
                <div className="field">
                  <label htmlFor="wo-block-from">{t('wo.block_from')}</label>
                  <input
                    id="wo-block-from"
                    className="input"
                    type="date"
                    min={today}
                    value={blockFrom}
                    aria-invalid={tried && blockFrom < today ? true : undefined}
                    onChange={(e) => setBlockFrom(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="wo-block-done">{t('wo.block_done_planned')}</label>
                  <input
                    id="wo-block-done"
                    className="input"
                    type="date"
                    min={blockFrom || today}
                    value={blockDone}
                    aria-required="true"
                    aria-invalid={tried && !blockDatesOk ? true : undefined}
                    aria-describedby="wo-block-note"
                    onChange={(e) => setBlockDone(e.target.value)}
                  />
                  <p className={`help${tried && !blockDatesOk ? ' err' : ''}`} id="wo-block-note">
                    {tried && !blockDatesOk ? t('common.required') : t('wo.block_reopen_note')}
                  </p>
                </div>
                <div className="field">
                  <label htmlFor="wo-block-reason">{t('wo.block_reason')}</label>
                  <input
                    id="wo-block-reason"
                    className="input"
                    maxLength={300}
                    value={blockReason}
                    aria-required="true"
                    aria-invalid={tried && !blockReasonOk ? true : undefined}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <label className="check">
              <input
                type="checkbox"
                checked={blockRequested}
                onChange={(e) => setBlockRequested(e.target.checked)}
              />
              <span>{t('hk.wo.block_request')}</span>
            </label>
            <p className="li-s m-0">{t('hk.lock_by_others')}</p>
          </>
        )}

        <div ref={problemRef} />
        {blockError ? (
          <BlockConflictView
            error={blockError}
            room={roomText}
            busy={busy}
            onWithoutBlock={() => {
              setBlock(false);
              void submit(false);
            }}
          />
        ) : null}
        {error ? <Alert tone="bad">{error}</Alert> : null}
      </div>
      <div className="wiz-foot hk-foot">
        <button
          type="button"
          className="btn pri xl block"
          disabled={busy || (block && !online)}
          aria-busy={busy || undefined}
          onClick={() => void submit()}
        >
          <Icon name={block ? 'lock' : 'alert'} />
          <span>
            {busy && block
              ? t('hk.lock_pending')
              : block
                ? online
                  ? t('wo.create_and_block')
                  : t('hk.need_network')
                : mtNew
                  ? t('wo.create')
                  : t('hk.wo.send')}
          </span>
        </button>
      </div>
    </>
  );
}

/** US-061 AC2/AC3: what blocks the block, and what to do – never "save anyway". No guest names (rbac D18). */
function BlockConflictView({
  error,
  room,
  busy,
  onWithoutBlock,
}: {
  error: BlockError;
  room: string;
  busy: boolean;
  onWithoutBlock: () => void;
}) {
  const { t } = useI18n();
  const without = (
    <button type="button" className="btn" disabled={busy} onClick={onWithoutBlock}>
      {t('wo.create_without_block')}
    </button>
  );
  if (error.code === 'ROOM_OCCUPIED') {
    return (
      <Alert tone="bad" title={t('wo.block_occupied_title')} actions={without}>
        {t('wo.block_occupied_body')}
      </Alert>
    );
  }
  if (error.code === 'ROOM_BLOCKED') {
    return (
      <Alert tone="bad" title={t('wo.block_blocked_title', { room })} actions={without}>
        {t('staff.block_blocked_body')}
      </Alert>
    );
  }
  return (
    <Alert
      tone="bad"
      title={t('wo.block_conflict_title', { n: error.conflicts.length })}
      actions={without}
    >
      {t('wo.block_conflict_dates')}
      <ul className="hk-conflicts">
        {error.conflicts.map((c, i) => (
          <li key={`${c.reservationCode ?? 'c'}-${i}`}>
            <span className="mono">{c.reservationCode ?? '–'}</span>
            {c.stayFrom && c.stayTo
              ? ` · ${shortLocalDate(c.stayFrom)} → ${shortLocalDate(c.stayTo)}`
              : c.nights?.length
                ? ` · ${shortLocalDate(c.nights[0])} – ${shortLocalDate(c.nights[c.nights.length - 1])}`
                : ''}
          </li>
        ))}
      </ul>
    </Alert>
  );
}
