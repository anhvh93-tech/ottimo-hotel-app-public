import { isApiError, newIdempotencyKey, type Parameter } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Modal, Seg } from '@ottimo/ui';
import { useId, useRef, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { useBusinessDay, useBusinessDayChange } from '../app/businessDay';
import { parseVnd } from '../app/money';
import { fieldErrors, paramProblemText, problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { useOnline } from '../hooks/useOnline';
import { useResource } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';
import {
  OTA_BASE_RATE_KEY,
  SECURITY_BOUNDS,
  UNIT_KEY,
  editorsOf,
  paramLabel,
  paramMeta,
} from './paramCatalog';
import { RECEIVING_KEY } from './ReceivingAccount';

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

/**
 * H05 5.2 – add a new effective-dated value (never edits the past – US-005 AC1) + history.
 * v1.0.4 P4-34: a row not yet in force can be cancelled here (`cancelScheduledParameter`, same rights as
 * `setParameter` per key). The receiving account is excluded – it needs S2 and has its own section.
 */
export function ParamDialog({
  param,
  options,
  onClose,
  onSaved,
  onChanged,
}: {
  param: Parameter;
  options?: unknown;
  onClose: () => void;
  onSaved: () => void;
  /** A scheduled row was cancelled – the dialog stays open; the page refreshes its list. */
  onChanged?: () => void;
}) {
  const { t, date, dateTime, locale } = useI18n();
  const propertyId = usePropertyId();
  const session = useSession();
  const toast = useToast();
  const { online } = useOnline();
  const ids = useId();
  // R3-Q39 #9 (BR-010): `effectiveFrom` and "đã lên lịch" are measured against the BUSINESS day
  // (parameters.service: `effectiveFrom ≥ ctx.today`; a row of a later day is scheduled).
  const today = useBusinessDay();
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
  const [initialFrom, setInitialFrom] = useState(today);
  useBusinessDayChange(today, (was, now) => {
    setEffectiveFrom((v) => (v === was ? now : v));
    setInitialFrom(now);
  });
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bounds = SECURITY_BOUNDS[param.key];
  const history = useResource(
    async () => (await api.getParameterHistory({ propertyId, key: param.key })).data.history,
    [propertyId, param.key],
  );

  const [cancelling, setCancelling] = useState<Parameter | null>(null);
  const mayCancel =
    param.key !== RECEIVING_KEY && editorsOf(param).some((r) => session.roles.includes(r));

  const dirty = text !== initialText || reason !== '' || effectiveFrom !== initialFrom;

  const parseValue = (): { ok: true; value: unknown } | { ok: false; error: string } => {
    if (kind === 'options') return { ok: true, value: Number(text) };
    // copy-v1.0.5 2.3: an empty time box is "Bắt buộc"; text in the wrong form says how to write a time.
    if (kind === 'time')
      return TIME_RE.test(text)
        ? { ok: true, value: text }
        : { ok: false, error: t(text.trim() ? 'params.err_time' : 'common.required') };
    if (kind === 'number') {
      const unit = paramMeta(param.key).unit;
      const n =
        unit === 'vnd'
          ? parseVnd(text)
          : /^-?\d+(\.\d+)?$/.test(text.trim())
            ? Number(text.trim())
            : null;
      // copy-v1.0.5 2.3: this box has no list – say a number is expected (was `field_error.not_in_list`).
      if (n === null || !Number.isFinite(n)) return { ok: false, error: t('params.err_number') };
      if (bounds && (n < bounds.min || n > bounds.max)) {
        return { ok: false, error: t('error.PARAM_OUT_OF_RANGE_MINMAX', bounds) };
      }
      return { ok: true, value: n };
    }
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      // copy-v1.0.5 2.3: words such as `deposit_base` live in this box too – quotes and brackets are what goes wrong.
      return { ok: false, error: t('params.err_json') };
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
        // V5-21 / V5-25 (copy-v1.0.5 2.3, 9.2, 9.4): the sentence depends on the key and on where the value is wrong.
        setErrors({
          value: paramProblemText(
            t,
            err,
            { key: param.key, unit: paramMeta(param.key).unit },
            locale,
          ),
        });
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
  const cancelColumn = mayCancel && rows.some((h) => h.effectiveFrom > today);

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
        {/* V5-21 (copy-v1.0.5 2.4; plan R5 mục 6): no per-room-group editor – say the value is not needed. */}
        {param.key === OTA_BASE_RATE_KEY ? (
          <Alert tone="info" role="note">
            {t('params.ota_base_rate_note')}
          </Alert>
        ) : null}
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
                  <th scope="col">{t('config.effective_from')}</th>
                  <th scope="col">{t('params.h_who')}</th>
                  <th scope="col" className="r">
                    {t('params.h_old')}
                  </th>
                  <th scope="col" className="r">
                    {t('params.h_new')}
                  </th>
                  <th scope="col">{t('params.reason')}</th>
                  {cancelColumn ? (
                    <th scope="col">
                      <span className="sr-only">{t('rooms.col_action')}</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((h, i) => (
                  <tr key={`${h.effectiveFrom}-${h.changedAt ?? i}`}>
                    <td>{dateTime(h.changedAt) || '–'}</td>
                    <td>
                      {date(h.effectiveFrom)}
                      {h.effectiveFrom > today ? (
                        <>
                          {' '}
                          <Chip tone="oak" icon="clock">
                            {t('params.not_yet')}
                          </Chip>
                        </>
                      ) : null}
                    </td>
                    <td>{h.changedBy ?? '–'}</td>
                    <td className="r">{rows[i + 1] ? formatParamValue(t, rows[i + 1]!) : '–'}</td>
                    <td className="r">{formatParamValue(t, h)}</td>
                    <td>{h.reason ?? ''}</td>
                    {cancelColumn ? (
                      <td>
                        {h.effectiveFrom > today ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!online}
                            aria-label={`${t('params.cancel_scheduled')}: ${date(h.effectiveFrom)}`}
                            onClick={() => setCancelling(h)}
                          >
                            {t('params.cancel_scheduled')}
                          </Button>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </form>
      {cancelling ? (
        <CancelScheduledParamDialog
          row={cancelling}
          name={name}
          onClose={() => setCancelling(null)}
          onStale={history.reload}
          onDone={() => {
            setCancelling(null);
            history.reload();
            toast(t('params.cancelled', { name }));
            onChanged?.();
          }}
        />
      ) : null}
    </Modal>
  );
}

/**
 * C16 confirm for `cancelScheduledParameter` (no S2 for these keys – the server asks it only for
 * `payment_receiving_account`). 404/409 = the row is gone or already in force: say so in the box, lock the
 * confirm button and refresh the table (pattern of RoomDrawer's scheduled price cancel).
 */
function CancelScheduledParamDialog({
  row,
  name,
  onClose,
  onDone,
  onStale,
}: {
  row: Parameter;
  name: string;
  onClose: () => void;
  onDone: () => void;
  /** The row is gone or already in force (404/409): refresh the history, keep the message on screen. */
  onStale: () => void;
}) {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const { online } = useOnline();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [banner, setBanner] = useState<{ text: string; tone: 'bad' | 'info' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  // FB-R4-SEC-FE-P434-01: after a network error / 5xx / `409 IDEMPOTENCY_IN_PROGRESS` the request may have
  // reached the server – the retry resends the SAME request (same key, same reason, so the reason is read-only
  // until then; also while a request is running – FB-R4-SEC-FE-P434-04). Any other answer ends it; the next confirm gets a new key.
  const idem = useRef(newIdempotencyKey());
  const [unsettled, setUnsettled] = useState(false);

  const confirm = async () => {
    if (locked) return;
    if (reason.trim().length < 3) {
      setReasonError(t('field_error.reason_required'));
      return;
    }
    setReasonError(undefined);
    setBanner(null);
    setBusy(true);
    const day = date(row.effectiveFrom);
    try {
      await api.cancelScheduledParameter(
        { propertyId, key: row.key },
        { effectiveFrom: row.effectiveFrom, reason: reason.trim() },
        idem.current,
      );
      onDone();
    } catch (err) {
      if (
        !isApiError(err) ||
        err.isNetwork ||
        err.status >= 500 ||
        err.code === 'IDEMPOTENCY_IN_PROGRESS'
      ) {
        setUnsettled(true);
        setBanner({ text: problemView(t, err).text, tone: 'bad' });
        return;
      }
      setUnsettled(false);
      idem.current = newIdempotencyKey();
      if (err.code === 'VALIDATION_FAILED') {
        const field = fieldErrors(t, err);
        if (field.reason) setReasonError(field.reason);
        else setBanner({ text: problemView(t, err).text, tone: 'bad' });
      } else if (err.code === 'INVALID_TRANSITION' || err.code === 'NOT_FOUND') {
        setLocked(true);
        // UXD 04/11: "gone" is not the user's mistake → info; "already in force" → bad.
        setBanner(
          err.code === 'NOT_FOUND'
            ? { text: t('params.cancel_gone', { date: day }), tone: 'info' }
            : { text: t('params.cancel_effective', { date: day }), tone: 'bad' },
        );
        onStale();
      } else {
        setBanner({ text: problemView(t, err).text, tone: 'bad' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      title={t('params.cancel_title')}
      body={t('params.cancel_body', {
        value: formatParamValue(t, row),
        date: date(row.effectiveFrom),
        name,
      })}
      keepLabel={locked ? t('common.close') : t('confirm.keep')}
      confirmLabel={t('params.cancel_scheduled')}
      busy={busy}
      confirmDisabled={!online || locked}
      onKeep={onClose}
      onConfirm={confirm}
    >
      {banner ? (
        <Alert tone={banner.tone} role={banner.tone === 'info' ? 'status' : 'alert'}>
          {banner.text}
        </Alert>
      ) : null}
      <Field label={t('params.reason')} required error={reasonError}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            readOnly={unsettled || busy}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
    </ConfirmDialog>
  );
}
