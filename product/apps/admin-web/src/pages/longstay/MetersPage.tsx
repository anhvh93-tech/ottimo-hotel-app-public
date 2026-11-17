import { isApiError, type Role } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, StateView } from '@ottimo/ui';
import { useId, useState, type FormEvent } from 'react';
import { useBusinessDay } from '../../app/businessDay';
import { problemView } from '../../app/problem';
import {
  meterUsage,
  monthOf,
  shiftMonth,
  statementsApi,
  type BillingCandidate,
  type MeterException,
  type MeterReading,
  type MeterType,
} from '../../app/statements';
import { useToast } from '../../app/toast';
import { useWrite } from '../../app/useWrite';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { meterNum, monthText } from './labels';

const LEADS: Role[] = ['owner', 'manager', 'front_desk_lead'];
export const isLead = (roles: Role[]) => roles.some((r) => LEADS.includes(r));
const TYPES: MeterType[] = ['electricity', 'water'];
const UNIT = { electricity: 'kwh', water: 'm3' } as const;

interface Row {
  candidate: BillingCandidate;
  readings: MeterReading[];
}

/** Latest valid reading of the room – its closing values are the "Last closing" reference (INV 17/11). */
function lastValid(readings: MeterReading[], roomId: string): MeterReading | undefined {
  return readings.filter((r) => !r.voidedAt && r.roomId === roomId).at(-1);
}

/**
 * S12 – end-of-month meter readings of the long stays (FB-INV-012, contract §6.2). One row per long-stay room
 * in house. INV 17/11: the OPENING reading is typed each period (required); the previous closing is shown next
 * to it only as a reference, the gap between them is vacancy loss (viewings, housekeeping) and is not billed.
 * Closing below opening → Wrong entry / Meter replaced / Meter rolled over (the last two front desk lead and up).
 */
export function MetersPage() {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const today = useBusinessDay();
  // A reading taken on day 01 still closes the month before (BR-LS-10).
  const [month, setMonth] = useState(() => shiftMonth(monthOf(today), -1));
  const ids = useId();
  const rows = useResource<Row[]>(async () => {
    const c = (await statementsApi.listBillingCandidates(propertyId, shiftMonth(month, 1))).data;
    return Promise.all(
      c.items.map(async (candidate) => ({
        candidate,
        readings: (await statementsApi.listMeterReadings(propertyId, candidate.reservationId)).data
          .items,
      })),
    );
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
                    key={row.candidate.reservationId}
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

interface MeterDraft {
  opening: string;
  closing: string;
  exception: MeterException | null;
}

const parseMeter = (raw: string, type: MeterType): number | null => {
  const s = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  // BR-LS-11: kWh whole, m³ one decimal – the extra digits are dropped (never rounded up).
  return type === 'water' ? Math.floor(n * 10 + 1e-9) / 10 : Math.floor(n);
};

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
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const lead = isLead(session.roles);
  const { candidate } = row;
  const roomNo = candidate.roomNos[0] ?? '';
  const recorded = row.readings.find(
    (r) => !r.voidedAt && r.kind === 'period_end' && r.periodMonth === month,
  );
  const previous = lastValid(
    row.readings.filter((r) => r.id !== recorded?.id),
    candidate.roomId,
  );
  const [draft, setDraft] = useState<Record<MeterType, MeterDraft>>({
    electricity: { opening: '', closing: '', exception: null },
    water: { opening: '', closing: '', exception: null },
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [waived, setWaived] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [lower, setLower] = useState<MeterType | null>(null);
  const [history, setHistory] = useState(false);
  const write = useWrite();
  const upload = useWrite();
  const ids = useId();

  const set = (type: MeterType, patch: Partial<MeterDraft>) =>
    setDraft((d) => ({ ...d, [type]: { ...d[type], ...patch } }));

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    setBanner(null);
    const errs: Record<string, string> = {};
    const values = {} as Record<MeterType, { opening: number; value: number } | null>;
    for (const type of TYPES) {
      const o = parseMeter(draft[type].opening, type);
      const c = parseMeter(draft[type].closing, type);
      if (o === null) errs[`${type}.opening`] = t('common.required');
      if (c === null) errs[`${type}.value`] = t('common.required');
      values[type] = o === null || c === null ? null : { opening: o, value: c };
    }
    if (!photo && !waived) errs.photo = t('meters.photo_required');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // BR-LS-12: closing below opening is never saved as is – ask why first.
    const low = TYPES.find(
      (type) => values[type]!.value < values[type]!.opening && !draft[type].exception,
    );
    if (low) {
      setLower(low);
      return;
    }
    try {
      let photoAttachmentId: string | null = null;
      if (photo)
        photoAttachmentId = (
          await upload.run((key) =>
            statementsApi.uploadMeterPhoto(propertyId, candidate.reservationId, photo, key),
          )
        ).data.id;
      await write.run((key) =>
        statementsApi.recordMeterReading(
          propertyId,
          candidate.reservationId,
          {
            roomId: candidate.roomId,
            kind: 'period_end',
            periodMonth: month,
            readOn: today,
            electricity: { ...values.electricity!, exception: draft.electricity.exception },
            water: { ...values.water!, exception: draft.water.exception },
            photoAttachmentId,
            photoWaived: !photo && waived,
            note: note.trim() || null,
          },
          key,
        ),
      );
      toast(t('meters.saved', { room: roomNo }));
      onSaved();
    } catch (err) {
      if (isApiError(err) && err.code === 'METER_LOWER_THAN_PREVIOUS') {
        setLower((err.problem.meter as MeterType | undefined) ?? 'electricity');
        return;
      }
      setBanner(problemView(t, err).text);
    }
  };

  if (recorded) {
    return (
      <tr>
        <th scope="row">
          {roomNo} · {candidate.guestDisplayName}
        </th>
        {TYPES.map((type) => {
          const m = recorded[type];
          return (
            <td key={type}>
              <span className="mono">
                {meterNum(m.opening, UNIT[type])} → {meterNum(m.value, UNIT[type])}
              </span>
              <div className="li-s">
                {t('meters.usage', { usage: meterNum(m.consumption, UNIT[type]) })}
              </div>
              {m.gap ? (
                <div className="li-s">
                  {t('meters.gap_saved', { gap: meterNum(m.gap, UNIT[type]) })}
                </div>
              ) : null}
              {m.exception ? (
                <Chip tone="oak" icon={null}>
                  {t(`meters.exception.${m.exception.type}`)}
                </Chip>
              ) : null}
            </td>
          );
        })}
        <td>
          {recorded.photoWaived ? (
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
          <Chip tone="long" icon="check">
            {t('meters.recorded', { initials: recorded.readByInitials })}
          </Chip>{' '}
          <Button size="sm" variant="ghost" onClick={() => setHistory(true)}>
            {t('meters.history')}
          </Button>
          {history ? (
            <HistoryDialog
              row={row}
              onClose={() => setHistory(false)}
              onChanged={() => {
                setHistory(false);
                onSaved();
              }}
            />
          ) : null}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <th scope="row">
        {roomNo} · {candidate.guestDisplayName}
        {row.readings.length ? (
          <div>
            <Button size="sm" variant="ghost" onClick={() => setHistory(true)}>
              {t('meters.history')}
            </Button>
          </div>
        ) : null}
        {history ? (
          <HistoryDialog
            row={row}
            onClose={() => setHistory(false)}
            onChanged={() => {
              setHistory(false);
              onSaved();
            }}
          />
        ) : null}
      </th>
      {TYPES.map((type) => {
        const prev = previous ? previous[type].value : null;
        const o = parseMeter(draft[type].opening, type);
        const c = parseMeter(draft[type].closing, type);
        const gap = prev !== null && o !== null ? o - prev : null;
        const usage =
          o !== null && c !== null && (c >= o || draft[type].exception)
            ? meterUsage({ opening: o, value: c, exception: draft[type].exception }, type)
            : null;
        const unit = UNIT[type];
        return (
          <td key={type} className="meter-cell">
            <Field
              label={t('meters.opening')}
              required
              error={errors[`${type}.opening`]}
              help={
                prev !== null
                  ? t('meters.last_closing', { value: meterNum(prev, unit) })
                  : t('meters.no_last_closing')
              }
            >
              {(p) => (
                <input
                  {...p}
                  className="input num mono"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft[type].opening}
                  onChange={(e) => set(type, { opening: e.target.value })}
                  aria-label={`${t(`stmt.meter.${type}`)} – ${t('meters.opening')} – ${roomNo}`}
                />
              )}
            </Field>
            {gap !== null && gap > 0 ? (
              <p className="li-s meter-gap" role="status">
                {t('meters.gap', {
                  gap: meterNum(type === 'water' ? Math.round(gap * 10) / 10 : gap, unit),
                })}
              </p>
            ) : gap !== null && gap < 0 ? (
              <Alert tone="warn" role="status">
                {t('meters.opening_below_last', { value: meterNum(prev!, unit) })}
              </Alert>
            ) : null}
            <Field label={t('meters.closing')} required error={errors[`${type}.value`]}>
              {(p) => (
                <input
                  {...p}
                  className="input num mono"
                  inputMode="decimal"
                  autoComplete="off"
                  value={draft[type].closing}
                  onChange={(e) => set(type, { closing: e.target.value, exception: null })}
                  aria-label={`${t(`stmt.meter.${type}`)} – ${t('meters.closing')} – ${roomNo}`}
                />
              )}
            </Field>
            {usage !== null ? (
              <p className="li-s">{t('meters.usage', { usage: meterNum(usage, unit) })}</p>
            ) : null}
            {draft[type].exception ? (
              <Chip tone="oak" icon={null}>
                {t(`meters.exception.${draft[type].exception.type}`)}
              </Chip>
            ) : null}
          </td>
        );
      })}
      <td>
        <Field
          label={t('meters.photo')}
          required={!waived}
          error={errors.photo}
          help={t('meters.photo_help')}
        >
          {(p) => (
            <input
              {...p}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          )}
        </Field>
        {lead ? (
          <label className="row">
            <input type="checkbox" checked={waived} onChange={(e) => setWaived(e.target.checked)} />{' '}
            {t('meters.photo_waive')}
          </label>
        ) : null}
        {waived ? (
          <Field label={t('meters.note')} required>
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
      </td>
      <td>
        <Chip tone="neutral" icon={null}>
          {t('meters.missing')}
        </Chip>
        <div className="mt-8">
          <Button
            variant="pri"
            size="sm"
            onClick={() => void save()}
            busy={write.busy || upload.busy}
            busyLabel={write.busyLabel ?? t('common.saving')}
            aria-describedby={banner ? `${ids}-err` : undefined}
          >
            {write.label(t('meters.save'))}
          </Button>
        </div>
        {write.notice}
        {banner ? (
          <div id={`${ids}-err`}>
            <Alert tone="bad">{banner}</Alert>
          </div>
        ) : null}
        {lower ? (
          <LowerDialog
            type={lower}
            lead={lead}
            opening={parseMeter(draft[lower].opening, lower) ?? 0}
            closing={parseMeter(draft[lower].closing, lower) ?? 0}
            onWrongEntry={() => {
              setLower(null);
              setErrors((x) => ({ ...x, [`${lower}.value`]: t('meters.fix_entry') }));
            }}
            onException={(ex) => {
              set(lower, { exception: ex });
              setLower(null);
            }}
            onClose={() => setLower(null)}
          />
        ) : null}
      </td>
    </tr>
  );
}

/** BR-LS-12: closing < opening – Wrong entry (anyone) / Meter replaced / Meter rolled over (FDL+, A89). */
function LowerDialog({
  type,
  lead,
  opening,
  closing,
  onWrongEntry,
  onException,
  onClose,
}: {
  type: MeterType;
  lead: boolean;
  opening: number;
  closing: number;
  onWrongEntry: () => void;
  onException: (e: MeterException) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'choose' | 'replaced' | 'rollover'>('choose');
  const [oldFinal, setOldFinal] = useState('');
  const [newStart, setNewStart] = useState('0');
  const [replacedOn, setReplacedOn] = useState('');
  const [maxValue, setMaxValue] = useState(type === 'electricity' ? '99999' : '9999.9');
  const [err, setErr] = useState<string | null>(null);
  const unit = UNIT[type];

  const confirm = () => {
    if (mode === 'replaced') {
      const a = parseMeter(oldFinal, type);
      const b = parseMeter(newStart, type);
      if (a === null || b === null || !replacedOn) return setErr(t('common.required'));
      onException({ type: 'replaced', oldFinal: a, newStart: b, replacedOn });
    } else if (mode === 'rollover') {
      const m = parseMeter(maxValue, type);
      if (m === null) return setErr(t('common.required'));
      onException({ type: 'rollover', maxValue: m });
    }
  };

  return (
    <Modal
      open
      size="sm"
      title={t('meters.lower_title', { meter: t(`stmt.meter.${type}`) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      role="alertdialog"
      footer={
        mode === 'choose' ? (
          <Button onClick={onClose}>{t('common.back')}</Button>
        ) : (
          <>
            <Button onClick={() => setMode('choose')}>{t('common.back')}</Button>
            <Button variant="pri" onClick={confirm}>
              {t('meters.use_exception')}
            </Button>
          </>
        )
      }
    >
      <p>
        {t('meters.lower_body', {
          closing: meterNum(closing, unit),
          opening: meterNum(opening, unit),
        })}
      </p>
      {mode === 'choose' ? (
        <div className="stack">
          <Button onClick={onWrongEntry}>{t('meters.wrong_entry')}</Button>
          <Button disabled={!lead} onClick={() => setMode('replaced')}>
            {t('meters.exception.replaced')}
          </Button>
          <Button disabled={!lead} onClick={() => setMode('rollover')}>
            {t('meters.exception.rollover')}
          </Button>
          {!lead ? <Alert tone="info">{t('meters.ask_lead')}</Alert> : null}
        </div>
      ) : mode === 'replaced' ? (
        <div className="stack">
          <Field label={t('meters.old_final')} required>
            {(p) => (
              <input
                {...p}
                className="input num mono"
                inputMode="decimal"
                value={oldFinal}
                onChange={(e) => setOldFinal(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('meters.new_start')} required>
            {(p) => (
              <input
                {...p}
                className="input num mono"
                inputMode="decimal"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('meters.replaced_on')} required>
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                value={replacedOn}
                onChange={(e) => setReplacedOn(e.target.value)}
              />
            )}
          </Field>
          {err ? <Alert tone="bad">{err}</Alert> : null}
        </div>
      ) : (
        <div className="stack">
          <Field label={t('meters.max_value')} required help={t('meters.max_value_help')}>
            {(p) => (
              <input
                {...p}
                className="input num mono"
                inputMode="decimal"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
            )}
          </Field>
          {err ? <Alert tone="bad">{err}</Alert> : null}
        </div>
      )}
    </Modal>
  );
}

/** Readings of one stay (all, voided ones marked) – "Nhập sai" = void then enter again (contract §2.1). */
function HistoryDialog({
  row,
  onClose,
  onChanged,
}: {
  row: Row;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const [voiding, setVoiding] = useState<MeterReading | null>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doVoid = async () => {
    if (!voiding) return;
    if (reason.trim().length < 3) return setErr(t('meters.void_reason_required'));
    setBusy(true);
    try {
      await statementsApi.voidMeterReading(propertyId, voiding.id, reason.trim());
      onChanged();
    } catch (e) {
      setErr(problemView(t, e).text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title={t('meters.history_title', { room: row.candidate.roomNos.join(', ') })}
      onClose={onClose}
      closeLabel={t('common.close')}
    >
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">{t('meters.col_date')}</th>
              <th scope="col">{t('stmt.meter.electricity')}</th>
              <th scope="col">{t('stmt.meter.water')}</th>
              <th scope="col">{t('meters.col_status')}</th>
            </tr>
          </thead>
          <tbody>
            {[...row.readings].reverse().map((r) => (
              <tr key={r.id} className={r.voidedAt ? 'muted' : undefined}>
                <td>
                  {date(r.readOn)}
                  <div className="li-s">{t(`meters.kind.${r.kind}`)}</div>
                </td>
                {TYPES.map((type) => (
                  <td key={type} className="mono">
                    {meterNum(r[type].opening, UNIT[type])} → {meterNum(r[type].value, UNIT[type])}
                    {r[type].gap ? (
                      <div className="li-s">
                        {t('meters.gap_saved', { gap: meterNum(r[type].gap!, UNIT[type]) })}
                      </div>
                    ) : null}
                  </td>
                ))}
                <td>
                  {r.voidedAt ? (
                    <Chip tone="neutral" icon={null}>
                      {t('meters.voided')}
                    </Chip>
                  ) : r.onIssuedStatement ? (
                    <span className="li-s">{t('meters.on_issued')}</span>
                  ) : (
                    <Button size="sm" onClick={() => setVoiding(r)}>
                      {t('meters.void')}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {voiding ? (
        <div className="stack mt-16">
          <Field label={t('meters.void_reason')} required error={err ?? undefined}>
            {(p) => (
              <input
                {...p}
                className="input"
                value={reason}
                maxLength={300}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
          </Field>
          <div className="row">
            <Button onClick={() => setVoiding(null)}>{t('common.back')}</Button>
            <Button variant="danger" busy={busy} onClick={() => void doVoid()}>
              {t('meters.void_confirm')}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
