import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useState } from 'react';
import { problemView } from '../../app/problem';
import {
  isOpeningKind,
  parseMeter,
  statementsApi,
  type MeterException,
  type MeterReading,
  type MeterType,
} from '../../app/statements';
import { usePropertyId } from '../../session/SessionProvider';
import { meterNum } from './labels';

export const TYPES: MeterType[] = ['electricity', 'water'];
export const UNIT = { electricity: 'kwh', water: 'm3' } as const;

/** Meter replaced / rolled over (BR-LS-12) – FDL+ only, the caller hides it for FD. */
function ExceptionForm({
  type,
  mode,
  onBack,
  onException,
}: {
  type: MeterType;
  mode: 'replaced' | 'rollover';
  onBack: () => void;
  onException: (e: MeterException) => void;
}) {
  const { t } = useI18n();
  const [oldFinal, setOldFinal] = useState('');
  const [newStart, setNewStart] = useState('0');
  const [replacedOn, setReplacedOn] = useState('');
  const [maxValue, setMaxValue] = useState(type === 'electricity' ? '99999' : '9999.9');
  const [err, setErr] = useState<string | null>(null);
  const confirm = () => {
    if (mode === 'replaced') {
      const a = parseMeter(oldFinal, type);
      const b = parseMeter(newStart, type);
      if (a === null || b === null || !replacedOn) return setErr(t('common.required'));
      onException({ type: 'replaced', oldFinal: a, newStart: b, replacedOn });
    } else {
      const m = parseMeter(maxValue, type);
      if (m === null) return setErr(t('common.required'));
      onException({ type: 'rollover', maxValue: m });
    }
  };
  const num = (label: string, value: string, set: (v: string) => void, help?: string) => (
    <Field label={label} required help={help}>
      {(p) => (
        <input
          {...p}
          className="input num mono"
          inputMode="decimal"
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </Field>
  );
  return (
    <div className="stack">
      {mode === 'replaced' ? (
        <>
          {num(t('meters.old_final'), oldFinal, setOldFinal)}
          {num(t('meters.new_start'), newStart, setNewStart)}
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
        </>
      ) : (
        num(t('meters.max_value'), maxValue, setMaxValue, t('meters.max_value_help'))
      )}
      {err ? <Alert tone="bad">{err}</Alert> : null}
      <div className="row">
        <Button onClick={onBack}>{t('common.back')}</Button>
        <Button variant="pri" onClick={confirm}>
          {t('meters.use_exception')}
        </Button>
      </div>
    </div>
  );
}

/**
 * BR-LS-12, closing below the opening: Wrong entry (anyone) / Meter replaced / Meter rolled over (FDL+, A89).
 * The server answers 422 METER_LOWER_THAN_PREVIOUS without an exception – never saved as typed.
 */
export function LowerDialog({
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
  const unit = UNIT[type];
  return (
    <Modal
      open
      size="sm"
      title={t('meters.lower_title', { meter: t(`stmt.meter.${type}`) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      role="alertdialog"
      footer={mode === 'choose' ? <Button onClick={onClose}>{t('common.back')}</Button> : undefined}
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
      ) : (
        <ExceptionForm
          type={type}
          mode={mode}
          onBack={() => setMode('choose')}
          onException={onException}
        />
      )}
    </Modal>
  );
}

/**
 * BE-190-01, opening below the last closing (INV 17/11: warn, do not block): Wrong entry / Meter replaced (FDL+,
 * sends an exception) / Save anyway (any FD+, sends `acknowledgeLowerThanPrevious` with a NEW Idempotency-Key).
 */
export function BelowDialog({
  type,
  lead,
  opening,
  previous,
  onWrongEntry,
  onException,
  onSaveAnyway,
  onClose,
}: {
  type: MeterType;
  lead: boolean;
  opening: number;
  previous: number;
  onWrongEntry: () => void;
  onException: (e: MeterException) => void;
  onSaveAnyway: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'choose' | 'replaced'>('choose');
  const unit = UNIT[type];
  return (
    <Modal
      open
      size="sm"
      title={t('meters.below_title', { meter: t(`stmt.meter.${type}`) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      role="alertdialog"
      footer={mode === 'choose' ? <Button onClick={onClose}>{t('common.back')}</Button> : undefined}
    >
      <p>
        {t('meters.below_body', {
          opening: meterNum(opening, unit),
          previous: meterNum(previous, unit),
        })}
      </p>
      {mode === 'choose' ? (
        <div className="stack">
          <Button onClick={onWrongEntry}>{t('meters.wrong_entry')}</Button>
          <Button disabled={!lead} onClick={() => setMode('replaced')}>
            {t('meters.exception.replaced')}
          </Button>
          <Button onClick={onSaveAnyway}>{t('meters.save_anyway')}</Button>
          {!lead ? <Alert tone="info">{t('meters.ask_lead_replaced')}</Alert> : null}
        </div>
      ) : (
        <ExceptionForm
          type={type}
          mode="replaced"
          onBack={() => setMode('choose')}
          onException={onException}
        />
      )}
    </Modal>
  );
}

/** Readings of one stay (voided ones marked) – "Nhập sai" = void then enter again (contract §2.1). */
export function HistoryDialog({
  rooms,
  readings,
  onClose,
  onChanged,
}: {
  rooms: string;
  readings: MeterReading[];
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
      title={t('meters.history_title', { room: rooms })}
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
            {[...readings].reverse().map((r) => (
              <tr key={r.id} className={r.voided ? 'muted' : undefined}>
                <td>
                  {date(r.readOn)}
                  <div className="li-s">{t(`meters.kind.${r.kind}`)}</div>
                </td>
                {TYPES.map((type) => {
                  const unit = UNIT[type];
                  const gap = r.gap?.[type];
                  const used = r.consumption?.[type];
                  return (
                    <td key={type}>
                      <span className="mono">{meterNum(r[type].value, unit)}</span>
                      {isOpeningKind(r.kind) && typeof gap === 'number' && gap > 0 ? (
                        <div className="li-s meter-gap">
                          {t('meters.gap_saved', { gap: meterNum(gap, unit) })}
                        </div>
                      ) : null}
                      {isOpeningKind(r.kind) && typeof gap === 'number' && gap < 0 ? (
                        <div className="li-s meter-gap">
                          {t('meters.below_saved', { gap: meterNum(-gap, unit) })}
                        </div>
                      ) : null}
                      {typeof used === 'number' ? (
                        <div className="li-s">
                          {t('meters.usage', { usage: meterNum(used, unit) })}
                        </div>
                      ) : null}
                      {r[type].exception ? (
                        <Chip tone="oak" icon={null}>
                          {t(`meters.exception.${r[type].exception!.type}`)}
                        </Chip>
                      ) : null}
                    </td>
                  );
                })}
                <td>
                  {r.voided ? (
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
