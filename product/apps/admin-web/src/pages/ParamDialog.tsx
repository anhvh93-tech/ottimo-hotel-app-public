import { isApiError, type Parameter } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, Seg } from '@ottimo/ui';
import { useId, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { todayLocal } from '../app/dates';
import { parseVnd } from '../app/money';
import { fieldErrors, problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { SECURITY_BOUNDS, UNIT_KEY, paramLabel, paramMeta } from './paramCatalog';

type T = (key: string, args?: Record<string, string | number>) => string;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function suffix(t: T, key: string): string {
  const unit = paramMeta(key).unit;
  if (unit === 'pct') return '%';
  if (unit === 'vnd') return t('common.vnd_unit');
  const k = UNIT_KEY[unit];
  return k ? t(k) : '';
}

export function formatParamValue(t: T, p: Pick<Parameter, 'key' | 'value'>): string {
  const v = p.value;
  if (typeof v === 'number') {
    const n = new Intl.NumberFormat('vi-VN').format(v);
    const s = suffix(t, p.key);
    return s ? `${n} ${s}`.replace(' %', '%') : n;
  }
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.every((x) => typeof x !== 'object')) {
    const s = suffix(t, p.key);
    return v.join(', ') + (s && s !== '%' ? ` ${s}` : '');
  }
  return JSON.stringify(v);
}

type Kind = 'options' | 'number' | 'time' | 'json';

/** H05 5.2 – add a new effective-dated value (never edits the past – US-005 AC1) + history. */
export function ParamDialog({
  param,
  options,
  onClose,
  onSaved,
}: {
  param: Parameter;
  options?: unknown;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { property } = useSession();
  const toast = useToast();
  const { online } = useOnline();
  const ids = useId();
  const today = todayLocal(property?.timezone);
  const name = paramLabel(t, param.key);
  const choices =
    param.key === 'hold_hours_default' && Array.isArray(options) && options.length <= 5
      ? (options as number[])
      : null;
  const kind: Kind = choices
    ? 'options'
    : typeof param.value === 'number'
      ? 'number'
      : typeof param.value === 'string' && TIME_RE.test(param.value)
        ? 'time'
        : 'json';
  const initialText =
    kind === 'json'
      ? JSON.stringify(param.value)
      : kind === 'number'
        ? String(param.value)
        : String(param.value ?? '');
  const [text, setText] = useState(initialText);
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bounds = SECURITY_BOUNDS[param.key];
  const history = useResource(
    async () => (await api.getParameterHistory({ propertyId, key: param.key })).data.history,
    [propertyId, param.key],
  );

  const dirty = text !== initialText || reason !== '' || effectiveFrom !== today;

  const parseValue = (): { ok: true; value: unknown } | { ok: false; error: string } => {
    if (kind === 'options') return { ok: true, value: Number(text) };
    if (kind === 'time')
      return TIME_RE.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: t('common.required') };
    if (kind === 'number') {
      const unit = paramMeta(param.key).unit;
      const n =
        unit === 'vnd'
          ? parseVnd(text)
          : /^-?\d+(\.\d+)?$/.test(text.trim())
            ? Number(text.trim())
            : null;
      if (n === null || !Number.isFinite(n))
        return { ok: false, error: t('field_error.not_in_list') };
      if (bounds && (n < bounds.min || n > bounds.max)) {
        return { ok: false, error: t('error.PARAM_OUT_OF_RANGE_MINMAX', bounds) };
      }
      return { ok: true, value: n };
    }
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      return { ok: false, error: t('field_error.not_in_list') };
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const parsed = parseValue();
    if (!parsed.ok) errs.value = parsed.error;
    if (!effectiveFrom) errs.effectiveFrom = t('common.required');
    else if (effectiveFrom < today) errs.effectiveFrom = t('booking.error.past_date');
    if (reason.trim().length < 3) errs.reason = t('field_error.reason_required');
    setErrors(errs);
    if (Object.keys(errs).length || !parsed.ok) return;
    setBusy(true);
    setBanner(null);
    try {
      await api.setParameter(
        { propertyId, key: param.key },
        { value: parsed.value, effectiveFrom, reason: reason.trim() },
      );
      toast(t('params.saved', { name, date: effectiveFrom.split('-').reverse().join('/') }));
      onSaved();
    } catch (err) {
      if (isApiError(err) && err.code === 'PARAM_OUT_OF_RANGE') {
        setErrors({ value: problemView(t, err).text });
      } else if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        setErrors(fieldErrors(t, err));
      } else {
        setBanner(problemView(t, err).text);
      }
    } finally {
      setBusy(false);
    }
  };

  const formId = `${ids}-f`;
  const help = bounds
    ? t('error.PARAM_OUT_OF_RANGE_MINMAX', bounds)
    : choices
      ? t('params.allowed', { values: choices.join(', ') })
      : undefined;
  const rows = history.state.data ?? [];

  return (
    <Modal
      open
      title={t('params.edit_title', { name })}
      meta={param.brRef ? <Chip tone="oak">{param.brRef}</Chip> : undefined}
      closeLabel={t('common.close')}
      onClose={onClose}
      dirty={dirty}
      unsavedLabels={{
        title: t('common.unsaved_title'),
        body: t('common.unsaved_body'),
        keep: t('common.unsaved_keep'),
        discard: t('common.unsaved_discard'),
      }}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            form={formId}
            variant="pri"
            busy={busy}
            busyLabel={t('common.saving')}
            disabled={!online}
          >
            {t('params.save')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate>
        {banner ? <Alert tone="bad">{banner}</Alert> : null}
        {kind === 'options' && choices ? (
          <div className={`field${errors.value ? ' invalid' : ''}`}>
            <span className="lbl" id={`${ids}-v`}>
              {t('params.new_value')}
            </span>
            <Seg
              labelledBy={`${ids}-v`}
              value={text}
              onChange={setText}
              options={choices.map((c) => ({
                value: String(c),
                label: `${c} ${suffix(t, param.key)}`,
              }))}
            />
            {errors.value ? (
              <div className="err" role="alert">
                {errors.value}
              </div>
            ) : null}
          </div>
        ) : (
          <Field
            label={kind === 'json' ? t('params.value_json') : t('params.new_value')}
            required
            help={help}
            error={errors.value}
          >
            {(p) =>
              kind === 'json' ? (
                <textarea
                  {...p}
                  className="input mono"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              ) : (
                <div className="input-affix">
                  <input
                    {...p}
                    className="input num"
                    type={kind === 'time' ? 'time' : 'text'}
                    inputMode={kind === 'number' ? 'numeric' : undefined}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  {suffix(t, param.key) ? (
                    <span className="affix">{suffix(t, param.key)}</span>
                  ) : null}
                </div>
              )
            }
          </Field>
        )}
        <div className="g-2">
          <Field label={t('config.effective_from')} required error={errors.effectiveFrom}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                min={today}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('params.reason')} required error={errors.reason}>
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
        {param.key.startsWith('hold_hours') ? (
          <Alert tone="info" role="note">
            {t('params.apply_note')}
          </Alert>
        ) : null}
        <h3 className="label-h" style={{ margin: '8px 0' }}>
          {t('params.history')}
        </h3>
        {rows.length === 0 ? (
          <p className="muted">
            {history.state.status === 'loading' ? t('common.loading') : t('params.history_empty')}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('params.h_when')}</th>
                  <th scope="col">{t('params.h_who')}</th>
                  <th scope="col" className="r">
                    {t('params.h_old')}
                  </th>
                  <th scope="col" className="r">
                    {t('params.h_new')}
                  </th>
                  <th scope="col">{t('params.reason')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((h, i) => (
                  <tr key={`${h.effectiveFrom}-${h.changedAt ?? i}`}>
                    <td>{dateTime(h.changedAt) || h.effectiveFrom}</td>
                    <td>{h.changedBy ?? '–'}</td>
                    <td className="r">{rows[i + 1] ? formatParamValue(t, rows[i + 1]!) : '–'}</td>
                    <td className="r">{formatParamValue(t, h)}</td>
                    <td>{h.reason ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </Modal>
  );
}
