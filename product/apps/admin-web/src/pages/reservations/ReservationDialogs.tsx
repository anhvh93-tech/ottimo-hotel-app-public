import {
  isApiError,
  newIdempotencyKey,
  type CancelReasonCode,
  type CancellationQuote,
  type PaymentMethod,
  type Reservation,
  type Room,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, ConfirmDialog, Field, Modal } from '@ottimo/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../../app/api';
import { timeHHmm } from '../../app/dates';
import { notifyChanged } from '../../app/live';
import { parseVnd } from '../../app/money';
import { fieldErrors } from '../../app/problem';
import {
  addDays,
  dateLabels,
  dayMonth,
  rsvErrorText,
  suggestionsOf,
  type RsvErrorContext,
} from '../../app/reservations';
import type { RuleParams } from '../../app/rules';
import { useToast } from '../../app/toast';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId } from '../../session/SessionProvider';

export interface DialogBase {
  reservation: Reservation;
  /** Reload the reservation (after 412 / 409 INVALID_TRANSITION or success). */
  reload: () => Promise<Reservation | null>;
  onDone: (updated?: Reservation) => void;
  onClose: () => void;
}

/**
 * Shared write runner for the drawer actions: one Idempotency-Key per dialog (a retry of the same click
 * reuses it), If-Match from the reservation version, and the conflict rules of EP00 §0.2.4:
 * 412 VERSION_CONFLICT → keep the input, offer reload; 409 INVALID_TRANSITION → reload and say which
 * status the booking is in now. Success → `notifyChanged()` so the rack refreshes immediately.
 */
function useAction(base: DialogBase) {
  const { t, locale } = useI18n();
  const key = useRef(newIdempotencyKey());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(base.reservation.version);
  const [status, setStatus] = useState(base.reservation.status);

  async function run<T>(fn: (version: number, idem: string) => Promise<T>) {
    if (busy) return undefined;
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const out = await fn(version, key.current);
      notifyChanged();
      return out;
    } catch (e) {
      setError(e);
      setFields(fieldErrors(t, e));
      if (isApiError(e) && (e.code === 'VERSION_CONFLICT' || e.code === 'INVALID_TRANSITION')) {
        const fresh = await base.reload();
        if (fresh && e.code === 'INVALID_TRANSITION') setStatus(fresh.status);
      }
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  const reloadKeepInput = async () => {
    const fresh = await base.reload();
    if (fresh) {
      setVersion(fresh.version);
      setStatus(fresh.status);
      setError(null);
    }
  };

  const ctx = (extra: RsvErrorContext = {}): RsvErrorContext => ({
    locale,
    status,
    roomNo: base.reservation.segments?.[0]?.roomNo ?? undefined,
    canSeeGuest: true,
    ...extra,
  });

  const errorView = (extra?: RsvErrorContext): ReactNode => {
    if (!error) return null;
    const conflict = isApiError(error) && error.code === 'VERSION_CONFLICT';
    return (
      <Alert
        tone="bad"
        actions={
          conflict ? (
            <Button size="sm" onClick={() => void reloadKeepInput()}>
              {t('common.retry')}
            </Button>
          ) : undefined
        }
      >
        {Object.keys(fields).length && isApiError(error) && error.code === 'VALIDATION_FAILED'
          ? Object.values(fields)[0]
          : rsvErrorText(t, error, ctx(extra))}
      </Alert>
    );
  };

  return { run, busy, error, fields, errorView, version };
}

const CANCEL_REASONS: Array<{ value: CancelReasonCode; key: string }> = [
  { value: 'guest_changed_mind', key: 'cancel.reason.changed_mind' },
  { value: 'found_other', key: 'cancel.reason.found_other' },
  { value: 'price', key: 'cancel.reason.price' },
  { value: 'date_change', key: 'cancel.reason.dates' },
  { value: 'unreachable', key: 'cancel.reason.unreachable' },
  { value: 'other', key: 'cancel.reason.other' },
];

/**
 * US-021 + US-135: the irreversible-action box. Opening it calls `cancelReservation` with
 * `dryRun=true` to show the real consequence (room + dates reopened, fee kept, refund needing approval);
 * reason is required; the safe button has focus. MGR+ can postpone instead (B8, AC5).
 */
export function CancelDialog(props: DialogBase & { canPostpone: boolean; onPostpone: () => void }) {
  const { reservation: r } = props;
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [reason, setReason] = useState<CancelReasonCode | ''>('');
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [quoteError, setQuoteError] = useState<unknown>(null);
  const [touched, setTouched] = useState(false);
  const ids = { propertyId, reservationId: r.id };
  const hold = r.status === 'hold';

  useEffect(() => {
    let stale = false;
    api.cancelReservationPreview(ids, { reasonCode: 'guest_changed_mind' }).then(
      (res) => !stale && setQuote(res.data.cancellation),
      (e: unknown) => !stale && setQuoteError(e),
    );
    return () => {
      stale = true;
    };
    // Preview once per opened dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seg = r.segments?.[0];
  const room = seg?.roomNo ?? '–';
  const from = dayMonth(r.arrivalDate);
  const to = dayMonth(r.departureDate);
  const reasonError =
    touched && !reason
      ? t('common.required')
      : touched && reason === 'other' && note.trim().length < 3
        ? t('field_error.reason_required')
        : act.fields.reasonCode;

  const confirm = async () => {
    setTouched(true);
    if (!reason || (reason === 'other' && note.trim().length < 3)) return;
    const out = await act.run((version, idem) =>
      api.cancelReservation(
        ids,
        { reasonCode: reason, note: note.trim() || undefined },
        version,
        idem,
      ),
    );
    if (out) {
      toast(`${r.code} · ${t('status.booking.cancelled')}`);
      props.onDone(out.data.reservation);
    }
  };

  const body = hold
    ? t('cancel.consequence', { room, from, to, channels: 7, lead: r.booker?.displayName ?? '' })
    : t('confirm.cancel_booking.body', {
        room,
        from,
        to,
        retained: quote ? vnd(quote.retainedVnd) : '…',
        refund: quote ? vnd(quote.refundableVnd) : '…',
      });

  return (
    <ConfirmDialog
      title={
        hold
          ? t('cancel.title', { room })
          : t('confirm.cancel_booking.title', { code: r.code, guest: r.booker?.displayName ?? '' })
      }
      body={body}
      keepLabel={t('cancel.keep')}
      confirmLabel={hold ? t('cancel.confirm') : t('drawer.action.cancel_booking')}
      busy={act.busy}
      onKeep={props.onClose}
      onConfirm={() => void confirm()}
    >
      {hold ? <p className="li-s">{t('cancel.fee_none')}</p> : null}
      {quoteError ? <Alert tone="warn">{rsvErrorText(t, quoteError)}</Alert> : null}
      {act.errorView()}
      <Field label={t('cancel.reason')} required error={reasonError}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value as CancelReasonCode)}
          >
            <option value="">{t('rsv.choose_reason')}</option>
            {CANCEL_REASONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.key)}
              </option>
            ))}
          </select>
        )}
      </Field>
      {reason === 'other' ? (
        <Field label={t('stay.note')} required error={act.fields.note}>
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
      ) : null}
      {props.canPostpone && !hold ? (
        <Button size="sm" variant="ghost" onClick={props.onPostpone}>
          {t('drawer.action.postpone')}
        </Button>
      ) : null}
    </ConfirmDialog>
  );
}

const METHODS: Array<{ value: PaymentMethod; key: string }> = [
  { value: 'vietqr', key: 'pay.vietqr' },
  { value: 'bank_transfer', key: 'pay.bank_transfer' },
  { value: 'cash', key: 'pay.cash' },
  { value: 'card_pos', key: 'pay.card' },
];

/** B4 – US-086 AC1/AC2/AC5: ≥ deposit → confirmed; less → money kept, booking stays on hold. */
export function DepositDialog(props: DialogBase) {
  const { reservation: r } = props;
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const need = r.depositRequiredVnd ?? 0;
  const [amount, setAmount] = useState(need ? vnd(need) : '');
  const [method, setMethod] = useState<PaymentMethod>('vietqr');
  const [posCode, setPosCode] = useState('');
  const [touched, setTouched] = useState(false);
  const value = parseVnd(amount) ?? 0;
  const amountError = touched && !(value > 0) ? t('field_error.amount_not_positive') : undefined;
  const ref = r.code.replace(/-/g, '');

  const submit = async () => {
    setTouched(true);
    if (!(value > 0)) return;
    const out = await act.run((version, idem) =>
      api.confirmDeposit(
        { propertyId, reservationId: r.id },
        {
          payment: {
            type: 'deposit',
            method,
            amountVnd: value,
            posAuthCode: method === 'card_pos' ? posCode.trim() || undefined : undefined,
          },
        },
        version,
        idem,
      ),
    );
    if (out) {
      toast(`${r.code} · ${t('status.booking.confirmed')}`);
      props.onDone(out.data);
    } else {
      // AC2: the partial payment was recorded – refresh the balance shown behind the dialog.
      void props.reload();
    }
  };

  return (
    <Modal
      open
      size="sm"
      title={t('rsv.deposit_title', { code: r.code })}
      onClose={props.onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button variant="pri" busy={act.busy} onClick={() => void submit()}>
            {value > 0 && value < need
              ? t('rsv.record_partial', { amount: vnd(value) })
              : t('rsv.deposit_submit')}
          </Button>
        </>
      }
    >
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div className="li-s">{t('booking.summary.deposit')}</div>
          <div className="price-big">
            {vnd(need)} {t('common.vnd_unit')}
          </div>
          <div className="li-s">{t('pay.qr_note', { ref })}</div>
        </div>
      </div>
      {act.errorView({ required: need })}
      <div className="g-2">
        <Field
          label={t('rsv.amount_received')}
          required
          error={amountError ?? act.fields['payment.amountVnd']}
        >
          {(p) => (
            <div className="input-affix">
              <input
                {...p}
                className="input num"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="affix">{t('common.vnd_unit')}</span>
            </div>
          )}
        </Field>
        <Field label={t('pay.method')}>
          {(p) => (
            <select
              {...p}
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {t(m.key)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      {method === 'card_pos' ? (
        <Field label={t('co.txn_ref')} error={act.fields['payment.posAuthCode']}>
          {(p) => (
            <input
              {...p}
              className="input mono"
              maxLength={12}
              value={posCode}
              onChange={(e) => setPosCode(e.target.value)}
            />
          )}
        </Field>
      ) : null}
      {value > 0 && value < need ? <p className="li-s">{t('rsv.deposit_partial')}</p> : null}
      {method === 'bank_transfer' || method === 'vietqr' ? (
        <p className="li-s">{t('rsv.reconcile_note')}</p>
      ) : null}
    </Modal>
  );
}

/** B3 – US-085 AC3: once, before expiry, never past the arrival-day cap (BR-302). */
export function ExtendHoldDialog(props: DialogBase & { rules: RuleParams }) {
  const { reservation: r, rules } = props;
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const current = r.hold?.expiresAt ? new Date(r.hold.expiresAt) : new Date();
  const cap = new Date(`${r.arrivalDate}T${rules.holdLatestTime}:00+07:00`);
  const next = new Date(
    Math.min(current.getTime() + rules.holdExtensionMaxHours * 3_600_000, cap.getTime()),
  );
  const fmt = (d: Date) => `${timeHHmm(d)} ${dayMonth(d.toISOString().slice(0, 10))}`;
  const hours = Math.max(1, Math.round((next.getTime() - current.getTime()) / 3_600_000));

  const submit = async () => {
    const out = await act.run((version, idem) =>
      api.extendHold({ propertyId, reservationId: r.id }, hours, version, idem),
    );
    if (out) {
      toast(t('common.saved'));
      props.onDone(out.data);
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('rsv.extend_title')}
      onClose={props.onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button variant="pri" busy={act.busy} onClick={() => void submit()}>
            {t('rsv.extend_submit', { time: fmt(next) })}
          </Button>
        </>
      }
    >
      {act.errorView()}
      <dl className="dl">
        <dt>{t('rsv.current_expiry')}</dt>
        <dd>{fmt(current)}</dd>
        <dt>{t('rsv.new_expiry')}</dt>
        <dd>{fmt(next)}</dd>
      </dl>
      <p className="li-s" style={{ marginTop: 8 }}>
        {t('rsv.extend_rule', { hours: rules.holdExtensionMaxHours, time: rules.holdLatestTime })}
      </p>
    </Modal>
  );
}

/** B7 (US-024 AC1) / B8 postpone (MGR+): new room and/or dates, reason required; OTA keeps dates. */
export function MoveDialog(
  props: DialogBase & { rooms: Room[]; ota: boolean; postpone?: boolean },
) {
  const { reservation: r, rooms, ota, postpone } = props;
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const currentRoom = r.segments?.[0]?.roomId ?? '';
  const [roomId, setRoomId] = useState(currentRoom ?? '');
  const [arrival, setArrival] = useState(r.arrivalDate);
  const [departure, setDeparture] = useState(r.departureDate);
  // H11 dlg-move: free-text reason (DOM's reason list for B7 is still open – EP02 E02-07).
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const noteError =
    touched && note.trim().length < 3 ? t('field_error.reason_required') : act.fields.note;
  const suggestions = suggestionsOf(act.error).filter((s) => !s.upgrade);

  const submit = async (override?: string) => {
    setTouched(true);
    if (note.trim().length < 3) return;
    const target = override ?? roomId;
    if (override) setRoomId(override);
    const out = await act.run((version, idem) =>
      api.moveReservation(
        { propertyId, reservationId: r.id },
        {
          roomId: target !== currentRoom ? target : undefined,
          arrivalDate: arrival !== r.arrivalDate ? arrival : undefined,
          departureDate: departure !== r.departureDate ? departure : undefined,
          mode: postpone ? 'postpone_instead_of_cancel' : 'change',
          reasonCode: 'other',
          note: note.trim(),
        },
        version,
        idem,
      ),
    );
    if (out) {
      toast(t('common.saved'));
      props.onDone(out.data);
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={postpone ? t('drawer.action.postpone') : t('move.title', { code: r.code })}
      onClose={props.onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button variant="pri" busy={act.busy} onClick={() => void submit()}>
            {t('rsv.move_submit')}
          </Button>
        </>
      }
    >
      {act.errorView()}
      {suggestions.length ? (
        <div className="conflict-list">
          {suggestions.map((s) => (
            <Button key={s.roomId} size="sm" onClick={() => void submit(s.roomId)}>
              {t('bk.use_room', { room: s.roomNo })}
            </Button>
          ))}
        </div>
      ) : null}
      {!postpone ? (
        <Field label={t('booking.field.room')}>
          {(p) => (
            <select
              {...p}
              className="input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            >
              {rooms
                .filter((x) => x.isSellable !== false || x.id === currentRoom)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.roomNo} · {x.name} ({x.baseOccupancy ?? '?'}/{x.maxOccupancy ?? '?'})
                  </option>
                ))}
            </select>
          )}
        </Field>
      ) : null}
      {ota ? (
        <p className="li-s">{t('move.ota_dates_locked')}</p>
      ) : (
        <div className="g-2">
          <Field label={dateLabels(t).arrival} error={act.fields.arrivalDate}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                value={arrival}
                onChange={(e) => {
                  setArrival(e.target.value);
                  if (departure <= e.target.value) setDeparture(addDays(e.target.value, 1));
                }}
              />
            )}
          </Field>
          <Field label={dateLabels(t).departure} error={act.fields.departureDate}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                min={addDays(arrival, 1)}
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
              />
            )}
          </Field>
        </div>
      )}
      <Field label={t('move.reason')} required error={noteError}>
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
      <p className="li-s">{t('rsv.move_price_note')}</p>
    </Modal>
  );
}

const CONTACT = [
  { value: 'rsv.contact_noanswer' },
  { value: 'rsv.contact_late' },
  { value: 'rsv.contact_none' },
];

/** B11 – US-136 AC2/AC3: never automatic; locked until `no_show_mark_time` and a contact result. */
export function NoShowDialog(props: DialogBase & { rules: RuleParams; channelName: string }) {
  const { reservation: r, rules } = props;
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [contact, setContact] = useState('');
  const [detail, setDetail] = useState('');
  const timeOk = timeHHmm(new Date()) >= rules.noShowMarkTime;
  const note = [contact ? t(contact) : '', detail.trim()].filter(Boolean).join(' – ');
  const ready = timeOk && note.length >= 3;
  const room = r.segments?.[0]?.roomNo ?? '–';
  const ota = r.paymentModel !== 'direct';

  const submit = async () => {
    if (!ready) return;
    const out = await act.run((version, idem) =>
      api.markNoShow({ propertyId, reservationId: r.id }, note, version, idem),
    );
    if (out) {
      toast(`${r.code} · ${t('status.booking.no_show')}`);
      props.onDone(out.data);
    }
  };
  return (
    <ConfirmDialog
      title={t('noshow.title', { guest: r.booker?.displayName ?? '' })}
      body={
        ota
          ? t('noshow.consequence_ota', {
              room,
              from: dayMonth(r.arrivalDate),
              to: dayMonth(r.departureDate),
              channel: props.channelName,
            })
          : t('noshow.consequence_direct', {
              amount: vnd((r.totalRoomVnd ?? 0) - (r.balanceDueVnd ?? r.totalRoomVnd ?? 0)),
              room,
              from: dayMonth(r.arrivalDate),
              to: dayMonth(r.departureDate),
            })
      }
      keepLabel={t('noshow.keep')}
      confirmLabel={t('noshow.confirm')}
      busy={act.busy}
      onKeep={props.onClose}
      onConfirm={() => void submit()}
    >
      {act.errorView()}
      <Field label={t('noshow.contact_note')} required error={act.fields.contactAttemptNote}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          >
            <option value="">{t('rsv.choose_reason')}</option>
            {CONTACT.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.value)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label={t('stay.note')}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={400}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        )}
      </Field>
      {!ready ? (
        <p className="li-s" role="status">
          {t('noshow.locked', { time: rules.noShowMarkTime })}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}

/** B12 – US-136 AC4/AC5: 200 restored, or 202 approval request for FD/FDL outside BR-315. */
export function RestoreDialog(props: DialogBase & { requiresApproval: boolean }) {
  const { reservation: r } = props;
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const reasonError =
    touched && reason.trim().length < 3 ? t('field_error.reason_required') : act.fields.reason;
  const submit = async () => {
    setTouched(true);
    if (reason.trim().length < 3) return;
    const out = await act.run((version, idem) =>
      api.restoreNoShow({ propertyId, reservationId: r.id }, reason.trim(), version, idem),
    );
    if (!out) return;
    if (out.status === 202) {
      toast(t('noshow.restore_request_sent'));
      props.onDone();
    } else {
      toast(`${r.code} · ${t('status.booking.confirmed')}`);
      props.onDone(out.data as Reservation);
    }
  };
  return (
    <Modal
      open
      size="sm"
      role="alertdialog"
      title={t('noshow.restore_title', { code: r.code })}
      onClose={props.onClose}
      footer={
        <>
          <Button onClick={props.onClose}>{t('confirm.keep')}</Button>
          <Button variant="pri" busy={act.busy} onClick={() => void submit()}>
            {props.requiresApproval
              ? t('drawer.action.request_restore')
              : t('drawer.action.restore_no_show')}
          </Button>
        </>
      }
    >
      <p>
        {t('noshow.restore_body', {
          room: r.segments?.[0]?.roomNo ?? '–',
          from: dayMonth(r.arrivalDate),
        })}
      </p>
      {act.errorView()}
      <Field label={t('bk.reason_ph')} required error={reasonError}>
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
    </Modal>
  );
}

/**
 * B7a – US-139 AC2: choose a free room for an OTA booking saved "chưa gán căn". Suggestions come from
 * `searchAvailability` (same group first; other groups = upgrade, FDL+ only – BR-312 (4)(ii)).
 */
export function AssignRoomDialog(props: DialogBase & { rooms: Room[]; lead: boolean }) {
  const { reservation: r, rooms, lead } = props;
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [options, setOptions] = useState<Array<{
    roomId: string;
    roomNo: string;
    upgrade: boolean;
  }> | null>(null);
  const [choice, setChoice] = useState('');
  const [loadError, setLoadError] = useState<unknown>(null);

  useEffect(() => {
    let stale = false;
    api
      .searchAvailability(
        { propertyId },
        { arrival: r.arrivalDate, departure: r.departureDate, adults: r.adults },
      )
      .then(
        (res) => {
          if (stale) return;
          // Without a requested room every free room is "same group" for the UI except the ones the
          // server marks with another group code than the first (wanted) group.
          const firstGroup = res.data.alternatives[0]?.roomGroupCode;
          const list = res.data.alternatives.map((a) => ({
            roomId: a.roomId,
            roomNo: a.roomNo,
            upgrade: !!firstGroup && a.roomGroupCode !== firstGroup,
          }));
          setOptions(list);
          setChoice(list.find((o) => !o.upgrade)?.roomId ?? '');
        },
        (e: unknown) => !stale && setLoadError(e),
      );
    return () => {
      stale = true;
    };
  }, [propertyId, r.arrivalDate, r.departureDate, r.adults]);

  // A 409 while saving brings fresh suggestions – show those instead.
  const fresh = suggestionsOf(act.error);
  const list = fresh.length ? fresh : (options ?? []);
  const chosen = list.find((o) => o.roomId === choice);
  const name = (id: string) => rooms.find((x) => x.id === id)?.name ?? '';

  const submit = async () => {
    if (!chosen) return;
    const out = await act.run((version, idem) =>
      api.assignRoom(
        { propertyId, reservationId: r.id },
        {
          roomId: chosen.roomId,
          resolution: chosen.upgrade ? 'upgraded' : 'reassigned_same_group',
        },
        version,
        idem,
      ),
    );
    if (out) {
      toast(t('common.saved'));
      props.onDone(out.data);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title={t('rsv.assign_title', { code: r.code, guest: r.booker?.displayName ?? '' })}
      onClose={props.onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button variant="pri" busy={act.busy} disabled={!chosen} onClick={() => void submit()}>
            {t('rsv.assign_submit', { room: chosen?.roomNo ?? '' })}
          </Button>
        </>
      }
    >
      <p>{t('fo.rack.unassigned_help')}</p>
      {act.errorView()}
      {loadError ? <Alert tone="bad">{rsvErrorText(t, loadError)}</Alert> : null}
      {!options && !loadError ? <p className="li-s">{t('common.loading')}</p> : null}
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label-h" style={{ marginBottom: 6 }}>
          {t('move.resolution.same_group')}
        </legend>
        {list.map((o, i) => (
          <label
            key={o.roomId}
            className="check card"
            style={{ marginBottom: 6, padding: '10px 12px' }}
          >
            <input
              type="radio"
              name="assign-room"
              checked={choice === o.roomId}
              disabled={o.upgrade && !lead}
              onChange={() => setChoice(o.roomId)}
            />
            <span className="grow">
              <b>
                {o.roomNo} · {name(o.roomId)}
              </b>{' '}
              {i === 0 && !o.upgrade ? <span className="chip ok">{t('rsv.best_fit')}</span> : null}
              {o.upgrade ? (
                <>
                  <br />
                  <span className="li-s">
                    {t('move.resolution.upgrade')} · {t('rsv.upgrade_note')}
                  </span>
                </>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="li-s">{t('rsv.assign_effect')}</p>
    </Modal>
  );
}

/** A53 – CTV: "Báo đã chuyển cọc" (US-086 AC4); FD / sale confirm with B4 afterwards. */
export function DepositNoticeDialog(props: Omit<DialogBase, 'reload'>) {
  const { reservation: r } = props;
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { online } = useOnline();
  const key = useRef(newIdempotencyKey());
  const [amount, setAmount] = useState(r.depositRequiredVnd ? vnd(r.depositRequiredVnd) : '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const value = parseVnd(amount) ?? 0;
  const submit = async () => {
    if (!(value > 0) || busy) return;
    setBusy(true);
    try {
      await api.createDepositNotice(
        { propertyId, reservationId: r.id },
        { amountVnd: value, note: note.trim() || undefined },
        key.current,
      );
      toast(t('drawer.deposit_notice.sent', { time: timeHHmm(new Date()) }));
      props.onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('drawer.action.deposit_notice')}
      onClose={props.onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={busy}
            disabled={!online || !(value > 0)}
            onClick={() => void submit()}
          >
            {t('drawer.action.deposit_notice')}
          </Button>
        </>
      }
    >
      {error ? <Alert tone="bad">{rsvErrorText(t, error)}</Alert> : null}
      <Field label={t('rsv.amount_sent')} required>
        {(p) => (
          <div className="input-affix">
            <input
              {...p}
              className="input num"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="affix">{t('common.vnd_unit')}</span>
          </div>
        )}
      </Field>
      <Field label={t('stay.note')}>
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
      <p className="help muted">{t('drawer.deposit_notice.help')}</p>
    </Modal>
  );
}
