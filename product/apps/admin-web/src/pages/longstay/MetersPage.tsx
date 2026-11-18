import { deriveIdempotencyKey, isApiError, type Role } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, StateView } from '@ottimo/ui';
import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../../app/api';
import { useBusinessDay } from '../../app/businessDay';
import { problemView } from '../../app/problem';
import {
  meterUsage,
  parseMeter,
  readingMonthOn,
  shiftMonth,
  type BillingCandidate,
  type CandidateRoom,
  type MeterException,
  type MeterReading,
  type MeterType,
  type RecordMeterReadingBody,
} from '../../app/statements';
import { useToast } from '../../app/toast';
import { useWrite } from '../../app/useWrite';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MeterCheckinDialog } from './MeterCheckinDialog';
import { BelowDialog, HistoryDialog, LowerDialog, TYPES, UNIT } from './MeterDialogs';
import { dayText, meterNum, monthText } from './labels';

const LEADS: Role[] = ['owner', 'manager', 'front_desk_lead'];
export const isLead = (roles: Role[]) => roles.some((r) => LEADS.includes(r));

interface Row {
  candidate: BillingCandidate;
  room: CandidateRoom;
  readings: MeterReading[];
}

/**
 * S12 – end-of-month meter readings (FB-INV-012, contract §6.2; ARC-FE-189-01). One row per long-stay room. For month
 * M the desk enters TWO readings per meter: Closing M (`period_end`, against the opening of M already on record) and
 * Opening M+1 (`period_start`, required, never pre-filled; the closing just typed is shown as the reference). Save =
 * two POSTs, each with its own Idempotency-Key and its own photo upload (one file binds to one record).
 */
export function MetersPage() {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const today = useBusinessDay();
  const [month, setMonth] = useState(() => readingMonthOn(today));
  const ids = useId();
  const rows = useResource<Row[]>(async () => {
    const c = (await api.listBillingCandidates({ propertyId }, shiftMonth(month, 1))).data;
    const out = await Promise.all(
      c.items.map(async (candidate) => {
        const readings = (
          await api.listMeterReadings({ propertyId, reservationId: candidate.reservationId })
        ).data.items;
        return (candidate.rooms ?? []).map((room) => ({
          candidate,
          room,
          readings: readings.filter((r) => r.roomId === room.roomId),
        }));
      }),
    );
    return out.flat();
  }, [propertyId, month]);

  return (
    <>
      <Topbar
        title={t('meters.title')}
        sub={t('meters.subtitle', { month: monthText(locale, month) })}
      />
      <Page>
        <div className="row wrap mb-16">
          <label className="lbl" htmlFor={`${ids}-m`}>
            {t('meters.month')}
          </label>
          <input
            id={`${ids}-m`}
            className="input"
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </div>
        <p className="li-s mb-8">{t('meters.help')}</p>
        {rows.state.status === 'error' ? (
          <ErrorBlock
            titleKey="meters.load_error"
            error={rows.state.error}
            onRetry={rows.reload}
            autoRetrySeconds={rows.state.autoRetrySeconds}
          />
        ) : !rows.state.data ? (
          <LoadingBlock />
        ) : !rows.state.data.length ? (
          <StateView icon="sparkle" title={t('meters.empty')}>
            {t('meters.empty_body')}
          </StateView>
        ) : (
          <div className="table-wrap">
            <table className="table meters-table">
              <caption className="sr-only">
                {t('meters.subtitle', { month: monthText(locale, month) })}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t('meters.col_room')}</th>
                  <th scope="col">{t('stmt.meter.electricity')} (kWh)</th>
                  <th scope="col">{t('stmt.meter.water')} (m³)</th>
                  <th scope="col">{t('meters.col_photo')}</th>
                  <th scope="col">{t('meters.col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.state.data.map((row) => (
                  <MeterRow
                    key={`${row.candidate.reservationId}-${row.room.roomId}`}
                    row={row}
                    month={month}
                    today={today}
                    onSaved={rows.reload}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
    </>
  );
}

interface Draft {
  closing: string;
  opening: string;
  closingEx: MeterException | null;
  openingEx: MeterException | null;
}
const EMPTY: Draft = { closing: '', opening: '', closingEx: null, openingEx: null };

const latest = (list: MeterReading[], ok: (r: MeterReading) => boolean) =>
  list.filter((r) => !r.voided && ok(r)).at(-1);

function MeterRow({
  row,
  month,
  today,
  onSaved,
}: {
  row: Row;
  month: string;
  today: string;
  onSaved: () => void;
}) {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const lead = isLead(session.roles);
  const { candidate, room, readings } = row;
  const next = shiftMonth(month, 1);
  const openM = latest(
    readings,
    (r) =>
      (r.kind === 'period_start' && r.periodMonth === month) ||
      ((r.kind === 'checkin' || r.kind === 'room_change_in') && r.readOn.slice(0, 7) === month),
  );
  const closeM = latest(readings, (r) => r.kind === 'period_end' && r.periodMonth === month);
  const openNext = latest(readings, (r) => r.kind === 'period_start' && r.periodMonth === next);
  const needNext = room.nextOpening !== 'not_needed';
  const toClose = !closeM;
  const toOpen = needNext && !openNext;
  // BR-LS-10 window: last day of M … end of day 01 of M+1; after it FDL+ records late with a reason (BE-190-03).
  const windowEnd = `${next}-01`;
  const late = today > windowEnd;

  const [draft, setDraft] = useState<Record<MeterType, Draft>>({
    electricity: { ...EMPTY },
    water: { ...EMPTY },
  });
  const [ack, setAck] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [waived, setWaived] = useState(false);
  const [note, setNote] = useState('');
  const [lateReason, setLateReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [lower, setLower] = useState<MeterType | null>(null);
  const [below, setBelow] = useState<{ type: MeterType; previous: number } | null>(null);
  const [history, setHistory] = useState(false);
  const [checkin, setCheckin] = useState(false);
  const closeW = useWrite();
  const openW = useWrite();
  const upC = useWrite();
  const upO = useWrite();
  const fileRef = useRef<HTMLInputElement>(null);
  const ids = useId();

  useEffect(() => {
    if (!photo || typeof URL.createObjectURL !== 'function') return setPreview(null);
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set = (type: MeterType, patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, [type]: { ...d[type], ...patch } }));

  /** Opening of M for a meter (read-only reference of the closing). */
  const openingValue = (type: MeterType) => openM?.[type].value ?? null;
  /** Reference of the next opening: the closing on record, else the closing being typed. */
  const lastClosing = (type: MeterType) =>
    closeM ? closeM[type].value : parseMeter(draft[type].closing, type);

  const busy = closeW.busy || openW.busy || upC.busy || upO.busy;
  const blockedLate = late && !lead;

  const body = (
    kind: 'period_end' | 'period_start',
    values: Record<MeterType, number>,
    photoAttachmentId: string | null,
  ): RecordMeterReadingBody => ({
    roomId: room.roomId,
    kind,
    periodMonth: kind === 'period_end' ? month : next,
    readOn: today,
    electricity: {
      value: values.electricity,
      exception: kind === 'period_end' ? draft.electricity.closingEx : draft.electricity.openingEx,
    },
    water: {
      value: values.water,
      exception: kind === 'period_end' ? draft.water.closingEx : draft.water.openingEx,
    },
    // Both flags have a schema default; the generated body type lists them, so they are always sent.
    ...(photoAttachmentId ? { photoAttachmentId, photoWaived: false } : { photoWaived: true }),
    note: note.trim() || null,
    acknowledgeLowerThanPrevious: kind === 'period_start' && ack,
    ...(late ? { lateReason: lateReason.trim() } : {}),
  });

  const save = async (opts: { ack?: boolean } = {}) => {
    setBanner(null);
    const errs: Record<string, string> = {};
    const closing = {} as Record<MeterType, number>;
    const opening = {} as Record<MeterType, number>;
    for (const type of TYPES) {
      if (toClose) {
        const c = parseMeter(draft[type].closing, type);
        if (c === null) errs[`${type}.closing`] = t('common.required');
        else closing[type] = c;
      }
      if (toOpen) {
        const o = parseMeter(draft[type].opening, type);
        if (o === null) errs[`${type}.opening`] = t('common.required');
        else opening[type] = o;
      }
    }
    if (!photo && !waived) errs.photo = t('meters.photo_required');
    if (waived && note.trim().length < 3) errs.note = t('meters.void_reason_required');
    if (late && lateReason.trim().length < 3) errs.late = t('meters.void_reason_required');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // BR-LS-12: closing below the opening of M is never saved as typed – ask why first.
    if (toClose) {
      const low = TYPES.find((type) => {
        const o = openingValue(type);
        return o !== null && closing[type] < o && !draft[type].closingEx;
      });
      if (low) return setLower(low);
    }
    // BE-190-01: opening below the last closing – warn, then save with acknowledgement.
    const acked = opts.ack || ack;
    if (toOpen && !acked) {
      const lowOpen = TYPES.find((type) => {
        const prev = lastClosing(type);
        return prev !== null && opening[type] < prev && !draft[type].openingEx;
      });
      if (lowOpen) return setBelow({ type: lowOpen, previous: lastClosing(lowOpen)! });
    }
    const upload = async (w: typeof upC) =>
      photo
        ? (
            await w.run((key) =>
              api.uploadAttachment(
                { propertyId },
                photo,
                'meter',
                deriveIdempotencyKey(key, 'attachment'),
                candidate.reservationId,
              ),
            )
          ).data.id
        : null;
    let saved = false;
    try {
      if (toClose) {
        const id = await upload(upC);
        await closeW.run((key) =>
          api.recordMeterReading(
            { propertyId, reservationId: candidate.reservationId },
            body('period_end', closing, id),
            key,
          ),
        );
        saved = true;
      }
      if (toOpen) {
        const id = await upload(upO);
        const b = body('period_start', opening, id);
        if (acked) b.acknowledgeLowerThanPrevious = true;
        await openW.run((key) =>
          api.recordMeterReading({ propertyId, reservationId: candidate.reservationId }, b, key),
        );
        saved = true;
      }
      toast(t('meters.saved', { room: room.roomNo }));
      setAck(false);
      onSaved();
    } catch (err) {
      if (saved) onSaved();
      if (isApiError(err) && err.status >= 400 && err.status < 500) {
        closeW.renewKey();
        openW.renewKey();
      }
      if (isApiError(err) && err.code === 'METER_LOWER_THAN_PREVIOUS') {
        setLower((err.problem.meter as MeterType | undefined) ?? 'electricity');
        return;
      }
      if (isApiError(err) && err.code === 'OPENING_BELOW_PREVIOUS_CLOSING') {
        const type = (err.problem.meter as MeterType | undefined) ?? 'electricity';
        const previous = Number(err.problem.previousValue ?? lastClosing(type) ?? 0);
        setBelow({ type, previous });
        return;
      }
      setBanner(problemView(t, err).text);
    }
  };

  const history$ = history ? (
    <HistoryDialog
      rooms={candidate.roomNos.join(', ')}
      readings={readings}
      onClose={() => setHistory(false)}
      onChanged={() => {
        setHistory(false);
        onSaved();
      }}
    />
  ) : null;

  return (
    <tr>
      <th scope="row">
        {room.roomNo} · {candidate.guestDisplayName ?? ''}
        {readings.length ? (
          <div>
            <Button size="sm" variant="ghost" onClick={() => setHistory(true)}>
              {t('meters.history')}
            </Button>
          </div>
        ) : null}
        {history$}
        {/* No opening for M of a stay that came in during M: its check-in reading (INV 17/11, ARC-FE-189-01/09 –
            only when the server says the month opens with `checkin`). */}
        {!openM && room.openingKind === 'checkin' ? (
          <div>
            <Button size="sm" icon="camera" onClick={() => setCheckin(true)}>
              {t('meters.checkin_enter')}
            </Button>
          </div>
        ) : null}
        {checkin ? (
          <MeterCheckinDialog
            reservationId={candidate.reservationId}
            roomId={room.roomId}
            roomNo={room.roomNo}
            month={month}
            segmentFrom={room.segmentFrom}
            today={today}
            lead={lead}
            onClose={() => setCheckin(false)}
            onSaved={() => {
              setCheckin(false);
              onSaved();
            }}
          />
        ) : null}
      </th>
      {TYPES.map((type) => {
        const unit = UNIT[type];
        const name = t(`stmt.meter.${type}`);
        const o = openingValue(type);
        const c = parseMeter(draft[type].closing, type);
        const usage =
          o !== null && c !== null && (c >= o || draft[type].closingEx)
            ? meterUsage(o, { value: c, exception: draft[type].closingEx }, type)
            : null;
        const prev = lastClosing(type);
        const n = parseMeter(draft[type].opening, type);
        const gap = prev !== null && n !== null ? n - prev : null;
        const shownGap = gap === null ? null : type === 'water' ? Math.round(gap * 10) / 10 : gap;
        const savedGap = openNext?.gap?.[type];
        const used = closeM?.consumption?.[type];
        return (
          <td key={type} className="meter-cell">
            <div className="meter-group">
              <div className="label-h">
                {t('meters.group_closing', { month: monthText(locale, month) })}
              </div>
              {closeM ? (
                <>
                  <span className="mono">
                    {o !== null ? `${meterNum(o, unit)} → ` : ''}
                    {meterNum(closeM[type].value, unit)}
                  </span>
                  {typeof used === 'number' ? (
                    <div className="li-s">{t('meters.usage', { usage: meterNum(used, unit) })}</div>
                  ) : null}
                  {closeM[type].exception ? (
                    <Chip tone="oak" icon={null}>
                      {t(`meters.exception.${closeM[type].exception!.type}`)}
                    </Chip>
                  ) : null}
                </>
              ) : (
                <>
                  {o !== null ? (
                    <p className="li-s">
                      {/* Label in Be Vietnam Pro, the figure in Mono (UXD-189-14). */}
                      {t('meters.opening_of', { value: '\u0000' })
                        .split('\u0000')
                        .map((part, i) =>
                          i ? (
                            <span key={i}>
                              <span className="mono">{meterNum(o, unit)}</span>
                              {part}
                            </span>
                          ) : (
                            <span key={i}>{part}</span>
                          ),
                        )}
                    </p>
                  ) : (
                    <Alert tone="warn">{t('meters.opening_missing')}</Alert>
                  )}
                  <Field label={t('meters.closing')} required error={errors[`${type}.closing`]}>
                    {(p) => (
                      <input
                        {...p}
                        className="input num mono"
                        inputMode="decimal"
                        autoComplete="off"
                        value={draft[type].closing}
                        onChange={(e) => set(type, { closing: e.target.value, closingEx: null })}
                        aria-label={`${name} – ${t('meters.closing')} – ${room.roomNo}`}
                      />
                    )}
                  </Field>
                  {usage !== null ? (
                    <p className="li-s">
                      {t('meters.usage_preview', { usage: meterNum(usage, unit) })}
                    </p>
                  ) : null}
                  {draft[type].closingEx ? (
                    <Chip tone="oak" icon={null}>
                      {t(`meters.exception.${draft[type].closingEx!.type}`)}
                    </Chip>
                  ) : null}
                </>
              )}
            </div>
            {needNext ? (
              <div className="meter-group">
                <div className="label-h">
                  {t('meters.group_opening', { month: monthText(locale, next) })}
                </div>
                {openNext ? (
                  <>
                    <span className="mono">{meterNum(openNext[type].value, unit)}</span>
                    {typeof savedGap === 'number' && savedGap > 0 ? (
                      <div className="li-s meter-gap">
                        {t('meters.gap_saved', { gap: meterNum(savedGap, unit) })}
                      </div>
                    ) : typeof savedGap === 'number' && savedGap < 0 ? (
                      <div className="li-s meter-gap">
                        {t('meters.below_saved', { gap: meterNum(-savedGap, unit) })}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Field
                      label={t('meters.opening')}
                      required
                      error={errors[`${type}.opening`]}
                      help={
                        prev !== null
                          ? t('meters.last_closing', { value: meterNum(prev, unit) })
                          : t('meters.last_closing_pending')
                      }
                    >
                      {(p) => (
                        <input
                          {...p}
                          className="input num mono"
                          inputMode="decimal"
                          autoComplete="off"
                          value={draft[type].opening}
                          onChange={(e) => {
                            set(type, { opening: e.target.value, openingEx: null });
                            setAck(false);
                          }}
                          aria-label={`${name} – ${t('meters.opening')} – ${room.roomNo}`}
                        />
                      )}
                    </Field>
                    {shownGap !== null && shownGap > 0 ? (
                      <p className="li-s meter-gap" role="status">
                        {t('meters.gap', { gap: meterNum(shownGap, unit) })}
                      </p>
                    ) : shownGap !== null && shownGap < 0 && !draft[type].openingEx ? (
                      <Alert tone="warn" role="status">
                        {t('meters.below_inline', {
                          opening: meterNum(n!, unit),
                          previous: meterNum(prev!, unit),
                        })}
                      </Alert>
                    ) : null}
                    {draft[type].openingEx ? (
                      <Chip tone="oak" icon={null}>
                        {t(`meters.exception.${draft[type].openingEx!.type}`)}
                      </Chip>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </td>
        );
      })}
      <td>
        {toClose || toOpen ? (
          <>
            <Field
              label={t('meters.photo')}
              required={!waived}
              error={errors.photo}
              help={t('meters.photo_help')}
            >
              {(p) => (
                <div className="stack">
                  <input
                    {...p}
                    ref={fileRef}
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    tabIndex={-1}
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                  {photo ? (
                    <div className="row meter-photo">
                      {preview ? <img src={preview} alt="" width={48} height={48} /> : null}
                      <span className="li-s grow">{photo.name}</span>
                    </div>
                  ) : null}
                  <Button size="sm" icon="camera" onClick={() => fileRef.current?.click()}>
                    {photo ? t('meters.photo_change') : t('meters.photo_pick')}
                  </Button>
                </div>
              )}
            </Field>
            {lead ? (
              <label className="row">
                <input
                  type="checkbox"
                  checked={waived}
                  onChange={(e) => setWaived(e.target.checked)}
                />{' '}
                {t('meters.photo_waive')}
              </label>
            ) : null}
            {waived ? (
              <Field label={t('meters.note')} required error={errors.note}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    value={note}
                    maxLength={300}
                    onChange={(e) => setNote(e.target.value)}
                  />
                )}
              </Field>
            ) : null}
          </>
        ) : closeM?.photoWaived ? (
          <Chip tone="neutral" icon={null}>
            {t('meters.photo_waived_chip')}
          </Chip>
        ) : (
          <Chip tone="long" icon="camera">
            {t('meters.photo_saved')}
          </Chip>
        )}
      </td>
      <td>
        {toClose || toOpen ? (
          <>
            <Chip tone="neutral" icon={null}>
              {t('meters.missing')}
            </Chip>
            {late ? (
              lead ? (
                <Field
                  label={t('meters.late_reason')}
                  required
                  error={errors.late}
                  help={t('meters.late', { date: dayText(locale, windowEnd) })}
                >
                  {(p) => (
                    <input
                      {...p}
                      className="input"
                      value={lateReason}
                      maxLength={300}
                      onChange={(e) => setLateReason(e.target.value)}
                    />
                  )}
                </Field>
              ) : (
                <Alert tone="info">
                  {t('meters.late_fd', { date: dayText(locale, windowEnd) })}
                </Alert>
              )
            ) : null}
            <div className="mt-8">
              <Button
                variant="pri"
                size="sm"
                disabled={blockedLate}
                onClick={() => void save()}
                busy={busy}
                busyLabel={closeW.busyLabel ?? openW.busyLabel ?? t('common.saving')}
                aria-describedby={banner ? `${ids}-err` : undefined}
              >
                {closeW.label(t('meters.save'))}
              </Button>
            </div>
            {closeW.notice}
            {openW.notice}
            {banner ? (
              <div id={`${ids}-err`}>
                <Alert tone="bad">{banner}</Alert>
              </div>
            ) : null}
          </>
        ) : (
          <Chip tone="long" icon="check">
            {t('meters.recorded', { initials: closeM?.readByInitials ?? '' })}
          </Chip>
        )}
        {lower ? (
          <LowerDialog
            type={lower}
            lead={lead}
            opening={openingValue(lower) ?? 0}
            closing={parseMeter(draft[lower].closing, lower) ?? 0}
            onWrongEntry={() => {
              setLower(null);
              setErrors((x) => ({ ...x, [`${lower}.closing`]: t('meters.fix_entry') }));
            }}
            onException={(ex) => {
              set(lower, { closingEx: ex });
              setLower(null);
            }}
            onClose={() => setLower(null)}
          />
        ) : null}
        {below ? (
          <BelowDialog
            type={below.type}
            lead={lead}
            opening={parseMeter(draft[below.type].opening, below.type) ?? 0}
            previous={below.previous}
            onWrongEntry={() => {
              setBelow(null);
              setErrors((x) => ({ ...x, [`${below.type}.opening`]: t('meters.fix_opening') }));
            }}
            onException={(ex) => {
              set(below.type, { openingEx: ex });
              setBelow(null);
            }}
            onSaveAnyway={() => {
              setBelow(null);
              setAck(true);
              void save({ ack: true });
            }}
            onClose={() => setBelow(null)}
          />
        ) : null}
      </td>
    </tr>
  );
}
