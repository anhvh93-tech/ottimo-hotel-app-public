import {
  deriveIdempotencyKey,
  isApiError,
  type CancelReasonCode,
  type CancellationQuote,
  type MovePreview,
  type MoveReasonCode,
  type Payment,
  type PaymentMethod,
  type Reservation,
  type ReservationStatus,
  type Room,
  type VietQrResult,
} from '@ottimo/api-client';
import { formatInstant, hasKey, useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, ConfirmDialog, Field, Modal } from '@ottimo/ui';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { api } from '../../app/api';
import { timeHHmm, todayLocal } from '../../app/dates';
import { notifyChanged } from '../../app/live';
import { monoArgs } from '../../app/mono';
import { parseVnd } from '../../app/money';
import { fieldErrors } from '../../app/problem';
import {
  addDays,
  currentStateOf,
  dayMonth,
  problemOf,
  rsvErrorText,
  suggestionsOf,
  type RsvErrorContext,
} from '../../app/reservations';
import type { RuleParams } from '../../app/rules';
import { useToast } from '../../app/toast';
import { isRetryable, useWrite } from '../../app/useWrite';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { DepositQr, pendingDepositQr } from './DepositQr';
import { DepositNotices } from './DepositNotices';
import { MovePreviewBox } from './MovePreviewBox';
import {
  ServiceLinesPicker,
  keepIncomplete,
  retainLinesOf,
  serviceLinesOfFolio,
  type KeepState,
  type ServiceLine,
} from './ServiceLines';
import { FilePicker, useSubmit } from '../stay/common';

export interface DialogBase {
  reservation: Reservation;
  /** Reload the reservation (after 412 / 409 INVALID_TRANSITION / partial deposit). */
  reload: () => Promise<Reservation | null>;
  onDone: (updated?: Reservation) => void;
  onClose: () => void;
  /** 409 INVALID_TRANSITION and the reload worked → the drawer closes the dialog and says why. */
  onTransitionChanged: (status: ReservationStatus) => void;
}

/**
 * Shared write runner for the drawer actions (EP00 §0.2.4): one Idempotency-Key per attempt (a network
 * retry reuses it; a new key after each success), If-Match from the reservation version.
 * - 412 VERSION_CONFLICT / 428: keep the input, button "Tải lại" reloads the version; the user saves again.
 * - 409 INVALID_TRANSITION: reload → the drawer closes the dialog with `rsv.transition_changed`;
 *   reload failed → keep the dialog, lock the main button, `rsv.transition_changed_unknown` + "Tải lại".
 * Success → `notifyChanged()` so the rack refreshes immediately.
 */
function useAction(base: DialogBase) {
  const { t, locale } = useI18n();
  const write = useWrite();
  const [error, setError] = useState<unknown>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(base.reservation.version);
  const [locked, setLocked] = useState(false);
  const busy = write.busy;

  async function run<T>(fn: (version: number, idem: string) => Promise<T>) {
    if (busy || locked) return undefined;
    setError(null);
    setFields({});
    try {
      // DS 6.21: CONCURRENT_UPDATE / SERVICE_UNAVAILABLE are retried inside `write.run` with the same
      // Idempotency-Key and the same If-Match (`version` is captured for every attempt).
      const out = await write.run((idem) => fn(version, idem));
      notifyChanged();
      return out;
    } catch (e) {
      if (isRetryable(e)) return undefined; // the retry notice keeps the form and explains
      setError(e);
      setFields(fieldErrors(t, e));
      if (isApiError(e) && e.code === 'INVALID_TRANSITION') {
        const fresh = await base.reload();
        if (fresh) {
          base.onTransitionChanged(currentStateOf(e) ?? fresh.status);
          return undefined;
        }
        setLocked(true);
      }
      return undefined;
    }
  }

  const reloadKeepInput = async () => {
    const fresh = await base.reload();
    if (!fresh) return;
    if (locked) {
      base.onTransitionChanged(fresh.status);
      return;
    }
    setVersion(fresh.version);
    setError(null);
  };

  const ctx = (extra: RsvErrorContext = {}): RsvErrorContext => ({
    locale,
    roomNo: base.reservation.segments?.[0]?.roomNo ?? undefined,
    canSeeGuest: true,
    ...extra,
  });

  const errorView = (extra?: RsvErrorContext): ReactNode => {
    if (write.notice) return write.notice;
    if (!error) return null;
    const needsReload =
      locked ||
      (isApiError(error) &&
        (error.code === 'VERSION_CONFLICT' || error.code === 'PRECONDITION_REQUIRED'));
    return (
      <Alert
        tone="bad"
        actions={
          needsReload ? (
            <Button size="sm" onClick={() => void reloadKeepInput()}>
              {t('common.reload')}
            </Button>
          ) : undefined
        }
      >
        {locked
          ? t('rsv.transition_changed_unknown')
          : Object.keys(fields).length && isApiError(error) && error.code === 'VALIDATION_FAILED'
            ? Object.values(fields)[0]
            : rsvErrorText(t, error, ctx(extra))}
      </Alert>
    );
  };

  return {
    run,
    busy,
    busyLabel: write.busyLabel,
    label: write.label,
    error,
    fields,
    errorView,
    version,
    setVersion,
    locked,
  };
}

const CANCEL_REASONS: Array<{ value: CancelReasonCode; key: string; otaOnly?: boolean }> = [
  { value: 'guest_changed_mind', key: 'cancel.reason.changed_mind' },
  { value: 'found_other', key: 'cancel.reason.found_other' },
  { value: 'price', key: 'cancel.reason.price' },
  { value: 'date_change', key: 'cancel.reason.dates' },
  { value: 'unreachable', key: 'cancel.reason.unreachable' },
  { value: 'ota_cancelled', key: 'cancel.reason.ota_cancelled', otaOnly: true },
  { value: 'other', key: 'cancel.reason.other' },
];

/**
 * US-021 + US-135: the irreversible-action box. `cancelReservation` with `dryRun=true` gives the real
 * consequence (room + dates reopened, fee kept, refund needing approval) – recomputed when the reason or
 * the OTA penalty changes; "Hủy đơn" stays locked until it is known. Reason required; the safe button
 * has focus. OTA bookings: "OTA báo hủy" + channel penalty typed from the extranet (BR-310).
 */
export function CancelDialog(
  props: DialogBase & { canPostpone: boolean; onPostpone: () => void; ota: boolean },
) {
  const { reservation: r, ota } = props;
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const helpId = useId();
  const [reason, setReason] = useState<CancelReasonCode | ''>('');
  const [note, setNote] = useState('');
  const [penalty, setPenalty] = useState('');
  // 0.3.6 add. 4 (BR-310/901): the real channel fee on the penalty, optional (else the commission rate).
  const [penaltyFee, setPenaltyFee] = useState('');
  const [quote, setQuote] = useState<CancellationQuote | null>(null);
  const [quoteError, setQuoteError] = useState<unknown>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const [touched, setTouched] = useState(false);
  // S4-08: service lines kept (with a reason) – the dry run and the write get the same list.
  const [keep, setKeep] = useState<KeepState>({});
  const retainLines = retainLinesOf(keep);
  const hold = r.status === 'hold';
  const penaltyVnd = ota && penalty.trim() ? parseVnd(penalty) : undefined;
  const inputNow = JSON.stringify({
    rc: reason,
    pen: penaltyVnd ?? null,
    keep: retainLines,
    tick: previewTick,
  });
  const previewInput = useDebounced(inputNow, 300);
  /** The dry run the dialog shows answers exactly what will be sent (S4-08: same `retainLines`). */
  const [quoteFor, setQuoteFor] = useState('');

  useEffect(() => {
    let stale = false;
    const q = JSON.parse(previewInput) as {
      rc: string;
      pen: number | null;
      keep: Array<{ lineId: string; reason: string }>;
    };
    setQuoteError(null);
    api
      .cancelReservationPreview(
        { propertyId, reservationId: r.id },
        {
          reasonCode: (q.rc || (ota ? 'ota_cancelled' : 'guest_changed_mind')) as CancelReasonCode,
          otaPenaltyVnd: ota && q.pen ? q.pen : undefined,
          retainLines: q.keep.length ? q.keep : undefined,
        },
      )
      .then(
        (res) => {
          if (stale) return;
          setQuote(res.data.cancellation);
          setQuoteFor(previewInput);
        },
        (e: unknown) => !stale && setQuoteError(e),
      );
    return () => {
      stale = true;
    };
  }, [previewInput, propertyId, r.id, ota]);
  const quoteCurrent = !!quote && quoteFor === inputNow;

  const room = r.segments?.[0]?.roomNo ?? '–';
  const from = dayMonth(r.arrivalDate);
  const to = dayMonth(r.departureDate);
  const reasonError =
    touched && !reason
      ? t('common.required')
      : touched && reason === 'other' && note.trim().length < 3
        ? t('field_error.reason_required')
        : act.fields.reasonCode;
  const penaltyError =
    ota && penalty.trim() && penaltyVnd === null
      ? t('field_error.amount_not_positive')
      : act.fields.otaPenaltyVnd;
  const penaltyFeeVnd = penaltyVnd && penaltyFee.trim() ? parseVnd(penaltyFee) : undefined;
  const penaltyFeeError =
    penaltyFee.trim() && penaltyFeeVnd === null
      ? t('field_error.amount_not_positive')
      : act.fields.otaPenaltyChannelFeeVnd;

  const confirm = async () => {
    setTouched(true);
    if (
      !quoteCurrent ||
      !reason ||
      (reason === 'other' && note.trim().length < 3) ||
      penaltyError ||
      penaltyFeeError ||
      keepIncomplete(keep)
    )
      return;
    const out = await act.run((version, idem) =>
      api.cancelReservation(
        { propertyId, reservationId: r.id },
        {
          reasonCode: reason,
          note: note.trim() || undefined,
          otaPenaltyVnd: penaltyVnd ?? undefined,
          otaPenaltyChannelFeeVnd: penaltyVnd ? (penaltyFeeVnd ?? undefined) : undefined,
          retainLines: retainLines.length ? retainLines : undefined,
        },
        version,
        idem,
      ),
    );
    if (out) {
      toast(t('rsv.toast.cancelled', { code: r.code }));
      props.onDone(out.data.reservation);
    }
  };

  let body: string;
  if (hold) {
    // Only bookings that came from a quote have a lead that goes back to "Đã báo giá" (SM-09).
    body = r.quoteId
      ? t('cancel.consequence', { room, from, to, lead: r.booker?.displayName ?? '' })
      : t('cancel.consequence_no_lead', { room, from, to });
  } else if (!quote) {
    body = t('cancel.consequence_no_lead', { room, from, to });
  } else if (quote.retainedVnd > 0 && quote.refundableVnd > 0) {
    body = t('confirm.cancel_booking.body', {
      room,
      from,
      to,
      retained: vnd(quote.retainedVnd),
      refund: vnd(quote.refundableVnd),
    });
  } else if (quote.retainedVnd > 0) {
    body = t('confirm.cancel_booking.body_no_refund', {
      room,
      from,
      to,
      retained: vnd(quote.retainedVnd),
    });
  } else if (quote.refundableVnd > 0) {
    // UXR #5: the whole deposit goes back (no fee) – never "no money was taken".
    body = t('confirm.cancel_booking.body_full_refund', {
      room,
      from,
      to,
      refund: vnd(quote.refundableVnd),
    });
  } else {
    body = t('confirm.cancel_booking.body_no_money', { room, from, to });
  }

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
      busyLabel={act.busyLabel}
      confirmDisabled={!quoteCurrent || act.locked}
      confirmHelpId={!quoteCurrent ? helpId : undefined}
      onKeep={props.onClose}
      onConfirm={() => void confirm()}
    >
      {hold ? <p className="li-s">{t('cancel.fee_none')}</p> : null}
      {quote?.refundRequestVnd && quote.refundRequestVnd !== quote.refundableVnd ? (
        <p className="li-s">
          {t('cancel.refund_request', { amount: money(quote.refundRequestVnd) })}
        </p>
      ) : null}
      <Field label={t('cancel.reason')} required error={reasonError}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value as CancelReasonCode)}
          >
            <option value="">{t('rsv.choose_reason')}</option>
            {CANCEL_REASONS.filter((o) => !o.otaOnly || ota).map((o) => (
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
      {ota ? (
        <Field
          label={t('cancel.ota_penalty')}
          help={t('cancel.ota_penalty_help')}
          error={penaltyError}
        >
          {(p) => (
            <div className="input-affix">
              <input
                {...p}
                className="input num"
                inputMode="numeric"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
              />
              <span className="affix">{t('common.vnd_unit')}</span>
            </div>
          )}
        </Field>
      ) : null}
      {ota && penaltyVnd ? (
        <Field
          label={t('cancel.ota_penalty_channel_fee')}
          help={t('cancel.ota_penalty_channel_fee_help')}
          error={penaltyFeeError}
        >
          {(p) => (
            <div className="input-affix">
              <input
                {...p}
                className="input num"
                inputMode="numeric"
                value={penaltyFee}
                onChange={(e) => setPenaltyFee(e.target.value)}
              />
              <span className="affix">{t('common.vnd_unit')}</span>
            </div>
          )}
        </Field>
      ) : null}
      {/* FE-S4-15 (DS 6.1): consequence → reason (changes the dry run) → service lines → summary. */}
      {quote?.serviceLines?.length ? (
        <ServiceLinesPicker
          lines={quote.serviceLines}
          keep={keep}
          onChange={setKeep}
          showErrors={touched}
          summary={{
            reversedVnd: quote.serviceReversedVnd,
            retainedVnd: quote.serviceRetainedVnd,
          }}
        />
      ) : null}
      {!quote && !quoteError ? (
        <p className="li-s" id={helpId} role="status">
          {t('cancel.preview_loading')}
        </p>
      ) : null}
      {quoteError ? (
        <Alert
          tone="warn"
          id={helpId}
          actions={
            <Button size="sm" onClick={() => setPreviewTick((n) => n + 1)}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('cancel.preview_failed')}
        </Alert>
      ) : null}
      {act.errorView()}
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

/**
 * B4 – US-086 AC1/AC2/AC5 (0.3.5 A-13): ≥ deposit → `confirmed`; less → still `200`, the money is
 * recorded, the booking stays on hold and the dialog shows how much is missing (no 4xx after money is
 * written – a fresh Idempotency-Key is used for the next amount).
 */
export function DepositDialog(props: DialogBase) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [r, setR] = useState(props.reservation);
  const need = r.depositRequiredVnd ?? 0;
  const paidBefore = r.depositPaidVnd ?? 0;
  const missing = Math.max(0, need - paidBefore);
  const [amount, setAmount] = useState(missing ? vnd(missing) : '');
  const [method, setMethod] = useState<PaymentMethod>('vietqr');
  const [posCode, setPosCode] = useState('');
  const [touched, setTouched] = useState(false);
  const value = parseVnd(amount) ?? 0;
  const amountError = touched && !(value > 0) ? t('field_error.amount_not_positive') : undefined;
  const ref = r.code.replace(/-/g, '');
  // S4-28: the deposit VietQR waiting on the folio (created at H12 and sent to the guest) or created here.
  const [pending, setPending] = useState<Payment | null>(null);
  const [qr, setQr] = useState<VietQrResult | null>(null);
  /** The QR payment already marked received (`confirmPaymentReceived`) – a retry only confirms the deposit. */
  const [qrReceived, setQrReceived] = useState<string | null>(null);
  const [qrExpired, setQrExpired] = useState(false);
  const qrAct = useSubmit();
  useEffect(() => {
    let stale = false;
    api.getFolio({ propertyId, folioId: r.folioId }).then(
      (f) => !stale && setPending(pendingDepositQr(f.data.payments)),
      () => undefined, // no folio read → the dialog still records the deposit by hand
    );
    return () => {
      stale = true;
    };
  }, [propertyId, r.folioId]);
  const qrPayment = qr?.payment ?? pending;
  const viaQr = method === 'vietqr' && !!qrPayment && value === qrPayment.amountVnd;

  /**
   * US-120 / SM-12: money in on the QR the guest paid → `confirmPaymentReceived` (pending → succeeded,
   * "chờ đối soát"), then B4 with `existingPaymentId` – never a second payment beside a QR left to expire.
   */
  const submitViaQr = async (paymentId: string) => {
    let version: number | undefined;
    if (qrReceived !== paymentId) {
      let failed: unknown = null;
      const ok = await qrAct.submit((idem) =>
        api.confirmPaymentReceived({ propertyId }, paymentId, {}, idem).catch((e: unknown) => {
          failed = e;
          throw e;
        }),
      );
      if (!ok) {
        // 409 INVALID_TRANSITION carries the PAYMENT state: already received → go on with B4;
        // expired → the money is recorded by hand (next press), the QR is gone.
        const state =
          isApiError(failed) && failed.code === 'INVALID_TRANSITION'
            ? (failed.problem as { currentState?: string }).currentState
            : undefined;
        if (state === 'expired') {
          qrAct.reset();
          setQr(null);
          setPending(null);
          setQrExpired(true);
        }
        if (state !== 'succeeded') return undefined;
        qrAct.reset();
      }
      setQrReceived(paymentId);
      // The payment moved the booking's version (balance) – B4 needs the fresh If-Match.
      version = (await props.reload())?.version;
    }
    return act.run((v, idem) =>
      api.confirmDeposit(
        { propertyId, reservationId: r.id },
        { existingPaymentId: paymentId },
        version ?? v,
        idem,
      ),
    );
  };

  const submit = async () => {
    setTouched(true);
    if (!(value > 0)) return;
    const out = viaQr
      ? await submitViaQr(qrPayment!.id)
      : await act.run((version, idem) =>
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
    if (!out) return;
    if (out.data.status === 'hold') {
      // Partial (A-13): stay open with the new balance; refresh the drawer behind.
      setR(out.data);
      act.setVersion(out.data.version);
      const left = Math.max(0, (out.data.depositRequiredVnd ?? 0) - (out.data.depositPaidVnd ?? 0));
      setAmount(left ? vnd(left) : '');
      setTouched(false);
      void props.reload();
      return;
    }
    toast(t('rsv.toast.confirmed', { code: r.code }));
    props.onDone(out.data);
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
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={act.locked}
            onClick={() => void submit()}
          >
            {value > 0 && value < missing
              ? t('rsv.record_partial', { amount: vnd(value) })
              : t('rsv.deposit_submit')}
          </Button>
        </>
      }
    >
      <div className="row mb-12">
        <div>
          <div className="li-s">{t('booking.summary.deposit')}</div>
          <div className="price-big">
            {vnd(need)} {t('common.vnd_unit')}
          </div>
          <div className="li-s">{monoArgs(t, 'pay.qr_note', { ref }, ['ref'])}</div>
        </div>
      </div>
      {/* FE-B – BUG-R2-081: what the CTV / sale reported (0.3.7 add. 1 `depositNotices`). */}
      <DepositNotices reservation={r} />
      {method === 'vietqr' && missing > 0 && !qrReceived ? (
        <div className="mb-12">
          <DepositQr
            reservation={r}
            pending={qr ? null : pending}
            onQr={(x) => {
              setQr(x);
              setAmount(vnd(x.payment.amountVnd));
            }}
          />
        </div>
      ) : null}
      {paidBefore > 0 && missing > 0 ? (
        <Alert tone="warn" role="status">
          {t('error.DEPOSIT_INSUFFICIENT', { required: vnd(need), paid: vnd(paidBefore) })}
        </Alert>
      ) : null}
      {qrExpired ? (
        <Alert tone="warn" role="status">
          {t('dep.qr_expired')}
        </Alert>
      ) : null}
      {qrAct.view()}
      {act.errorView({ required: need, paid: paidBefore + value })}
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
      {value > 0 && value < missing ? <p className="li-s">{t('rsv.deposit_partial')}</p> : null}
      {method === 'vietqr' && qrPayment && value > 0 && !viaQr ? (
        <p className="li-s">{t('dep.qr_amount_differs', { amount: money(qrPayment.amountVnd) })}</p>
      ) : null}
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
  const already = (r.hold?.extendedCount ?? 0) >= 1;
  const onceError =
    already ||
    (isApiError(act.error) && act.error.fieldErrors.some((f) => f.code === 'HOLD_EXTENDED_ONCE'));

  const submit = async () => {
    const out = await act.run((version, idem) =>
      api.extendHold({ propertyId, reservationId: r.id }, hours, version, idem),
    );
    if (out) {
      toast(
        t('rsv.toast.hold_extended', {
          code: r.code,
          time: out.data.hold?.expiresAt ? fmt(new Date(out.data.hold.expiresAt)) : fmt(next),
        }),
      );
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
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={act.locked || onceError}
            onClick={() => void submit()}
          >
            {t('rsv.extend_submit', { time: fmt(next) })}
          </Button>
        </>
      }
    >
      {onceError ? (
        <Alert tone="bad">{t('field_error.hold_extended_once')}</Alert>
      ) : (
        act.errorView()
      )}
      <dl className="dl">
        <dt>{t('rsv.current_expiry')}</dt>
        <dd>{fmt(current)}</dd>
        <dt>{t('rsv.new_expiry')}</dt>
        <dd>{fmt(next)}</dd>
      </dl>
      <p className="li-s mt-8">
        {t('rsv.extend_rule', { hours: rules.holdExtensionMaxHours, time: rules.holdLatestTime })}
      </p>
    </Modal>
  );
}

/**
 * DOM D-5 / OpenAPI 0.3.5 A-19 `MoveReasonCode` for B7/B8 (FB-R2-DOM-FE-01). Labels
 * `move.reason.<code>` come from UXD.
 */
const MOVE_REASONS: MoveReasonCode[] = [
  'guest_request',
  'property_fault',
  'overbooking',
  'upgrade',
  'inventory_optimize',
  'force_majeure',
  'other',
];
type MoveReason = MoveReasonCode;
const MOVE_NOTE_REQUIRED: MoveReason[] = ['other', 'force_majeure'];
const moveReasonKey = (c: MoveReason) => `move.reason.${c}`;
/** ESC-019 A / BR-429: who asked for the move decides the price – guest → new room's rate, else kept. */
const MOVE_GROUPS: Array<{ key: string; codes: MoveReason[] }> = [
  { key: 'move.group_guest', codes: ['guest_request'] },
  {
    key: 'move.group_ottimo',
    codes: ['property_fault', 'overbooking', 'upgrade', 'inventory_optimize', 'force_majeure'],
  },
  { key: 'move.group_other', codes: ['other'] },
];

/**
 * B7 (US-024 AC1, AC5–AC7) / B8 postpone (MGR+). S4-21 (ESC-019 A, BR-429 v0.3.5): every change is
 * priced by the server BEFORE saving (`previewMoveReservation` – same calc as the write). Reasons are
 * grouped "khách xin" (new room's rate) / "OTTIMO đổi" (rate kept); a guest asking for another room
 * must be told the new amount – the box "Đã báo khách số tiền mới" is required and the save sends
 * `applyDifference` + `expectedDeltaVnd` = the figure shown (409 SURCHARGE_CHANGED → check again).
 * `inventory_optimize` only while the room was not disclosed to the guest (BR-012 (4)); `upgrade` FDL+,
 * `overbooking` only for conflict bookings, `force_majeure` only when postponing. OTA keeps its dates.
 */
export function MoveDialog(
  props: DialogBase & { rooms: Room[]; ota: boolean; postpone?: boolean },
) {
  const { reservation: r, rooms, ota, postpone } = props;
  const { t, money } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const toast = useToast();
  const act = useAction(props);
  const ids = useId();
  const lead = roles.some((x) => x === 'owner' || x === 'manager' || x === 'front_desk_lead');
  const mgr = roles.some((x) => x === 'owner' || x === 'manager');
  const listReady = MOVE_REASONS.every((c) => hasKey(moveReasonKey(c)));
  const allowed = (c: MoveReason) =>
    (c !== 'upgrade' || lead) &&
    (c !== 'overbooking' || r.conflictState === 'open' || !!r.capacityConflict) &&
    (c !== 'force_majeure' || (postpone && mgr)) &&
    (c !== 'inventory_optimize' || !r.roomDisclosedToGuest);
  const currentRoom = r.segments?.[0]?.roomId ?? '';
  const [roomId, setRoomId] = useState(currentRoom ?? '');
  const [arrival, setArrival] = useState(r.arrivalDate);
  const [departure, setDeparture] = useState(r.departureDate);
  const [reason, setReason] = useState<MoveReason>(listReady ? 'guest_request' : 'other');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [told, setTold] = useState(false);
  /** 409 SURCHARGE_CHANGED: the amount the server now computes (shown until the box is ticked again). */
  const [changedTo, setChangedTo] = useState<number | null>(null);
  /** A-20: OTA moved into a smaller room → warning + reason, saved with capacityConflict. */
  const [capReason, setCapReason] = useState('');
  const capWarn =
    isApiError(act.error) &&
    act.error.fieldErrors.some((f) => f.code === 'CAPACITY_EXCEEDED_WARNING');
  const capProblem = problemOf(act.error) as Record<string, unknown> | undefined;
  const needNote = !listReady || MOVE_NOTE_REQUIRED.includes(reason);
  const noteError =
    touched && needNote && note.trim().length < 3
      ? t('field_error.reason_required')
      : act.fields.note;

  // ---- S4-21: price check before saving (debounced; same inputs as the write) ----
  const roomChanged = !postpone && !!roomId && roomId !== currentRoom;
  const datesChanged = arrival !== r.arrivalDate || departure !== r.departureDate;
  const changed = roomChanged || datesChanged;
  const [tick, setTick] = useState(0);
  const input = useDebounced(
    JSON.stringify({ roomId, arrival, departure, reason, postpone: !!postpone, tick }),
    300,
  );
  const [preview, setPreview] = useState<MovePreview | null>(null);
  const [previewError, setPreviewError] = useState<unknown>(null);
  const [previewFor, setPreviewFor] = useState('');
  useEffect(() => {
    const q = JSON.parse(input) as {
      roomId: string;
      arrival: string;
      departure: string;
      reason: MoveReason;
      postpone: boolean;
    };
    const roomMoved = !q.postpone && !!q.roomId && q.roomId !== currentRoom;
    const datesMoved = q.arrival !== r.arrivalDate || q.departure !== r.departureDate;
    // FE-S4-08: the last result stays on screen (dimmed) until the new one is in – `current` decides.
    setPreviewError(null);
    setTold(false);
    if (!roomMoved && !datesMoved) return;
    let stale = false;
    api
      .previewMoveReservation(
        { propertyId, reservationId: r.id },
        {
          roomId: roomMoved ? q.roomId : undefined,
          arrivalDate: q.arrival !== r.arrivalDate ? q.arrival : undefined,
          departureDate: q.departure !== r.departureDate ? q.departure : undefined,
          mode: q.postpone ? 'postpone_instead_of_cancel' : 'change',
          reasonCode: q.reason,
        },
      )
      .then(
        (res) => {
          if (stale) return;
          setPreview(res.data);
          setPreviewFor(input);
        },
        (e: unknown) => !stale && setPreviewError(e),
      );
    return () => {
      stale = true;
    };
  }, [input, propertyId, r.id, r.arrivalDate, r.departureDate, currentRoom]);
  const current =
    preview !== null &&
    previewFor ===
      JSON.stringify({ roomId, arrival, departure, reason, postpone: !!postpone, tick });
  // BR-429 (d) / BR-414: a guest asking for another room is told the new amount before saving.
  const needTold = reason === 'guest_request' && roomChanged;
  const suggestions = suggestionsOf(previewError ?? act.error).filter((s) => !s.upgrade);
  const whyLocked = !changed
    ? null
    : !current
      ? previewError
        ? null
        : t('move.save_needs_preview')
      : needTold && !told
        ? t('move.save_needs_told')
        : null;
  const canSave = !act.locked && (!changed || (current && (!needTold || told)));

  const submit = async () => {
    setTouched(true);
    if (!canSave) return;
    if (needNote && note.trim().length < 3) return;
    if (capWarn && capReason.trim().length < 3) return;
    let failed: unknown = null;
    const out = await act.run((version, idem) =>
      api
        .moveReservation(
          { propertyId, reservationId: r.id },
          {
            roomId: roomChanged ? roomId : undefined,
            arrivalDate: arrival !== r.arrivalDate ? arrival : undefined,
            departureDate: departure !== r.departureDate ? departure : undefined,
            mode: postpone ? 'postpone_instead_of_cancel' : 'change',
            reasonCode: reason,
            note: note.trim() || undefined,
            capacityWarningAckReason: capReason.trim() || undefined,
            applyDifference: needTold ? true : undefined,
            expectedDeltaVnd: needTold && preview ? preview.folioDeltaVnd : undefined,
          },
          version,
          idem,
        )
        .catch((e: unknown) => {
          failed = e;
          throw e;
        }),
    );
    if (!out) {
      if (isApiError(failed) && failed.code === 'SURCHARGE_CHANGED') {
        // The price moved since the guest was told: check again, tell again, tick again.
        const now = (failed.problem as { surchargeVnd?: number }).surchargeVnd;
        setChangedTo(typeof now === 'number' ? now : null);
        setTick((n) => n + 1);
      }
      return;
    }
    toast(
      t('rsv.toast.moved', {
        code: r.code,
        room: out.data.segments?.[0]?.roomNo ?? '',
        from: dayMonth(out.data.arrivalDate),
        to: dayMonth(out.data.departureDate),
      }),
    );
    props.onDone(out.data);
  };
  const surchargeChanged = isApiError(act.error) && act.error.code === 'SURCHARGE_CHANGED';
  return (
    <Modal
      open
      size="sm"
      title={postpone ? t('drawer.action.postpone') : t('move.title', { code: r.code })}
      onClose={props.onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          {whyLocked ? (
            <span className="li-s" id={`${ids}-why`}>
              {whyLocked}
            </span>
          ) : null}
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={act.locked}
            aria-disabled={!canSave || undefined}
            aria-describedby={whyLocked ? `${ids}-why` : undefined}
            onClick={() => void submit()}
          >
            {t('rsv.move_submit')}
          </Button>
        </>
      }
    >
      {capWarn ? (
        <Alert
          tone="warn"
          role="alert"
          title={t('booking.capacity_warning', {
            room: String(capProblem?.roomNo ?? ''),
            max: String(capProblem?.max ?? ''),
            n: r.adults + (r.children6to11 ?? 0),
          })}
        >
          <Field
            label={t('booking.capacity_reason')}
            help={t('booking.capacity_reason_help')}
            required
            error={
              touched && capReason.trim().length < 3 ? t('field_error.reason_required') : undefined
            }
          >
            {(p) => (
              <input
                {...p}
                className="input"
                value={capReason}
                onChange={(e) => setCapReason(e.target.value)}
              />
            )}
          </Field>
        </Alert>
      ) : surchargeChanged ? (
        <Alert tone="warn" role="alert">
          {changedTo !== null
            ? t('move.delta_changed', { amount: money(changedTo) })
            : act.errorView()}
        </Alert>
      ) : (
        act.errorView()
      )}
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
          <Field label={t('booking.field.arrival')} error={act.fields.arrivalDate}>
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
          <Field label={t('booking.field.departure')} error={act.fields.departureDate}>
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
      {listReady ? (
        <Field label={t('move.reason')} required error={act.fields.reasonCode}>
          {(p) => (
            <select
              {...p}
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value as MoveReason)}
            >
              {MOVE_GROUPS.map((grp) => {
                const codes = grp.codes.filter(allowed);
                return codes.length ? (
                  <optgroup key={grp.key} label={t(grp.key)}>
                    {codes.map((c) => (
                      <option key={c} value={c}>
                        {t(moveReasonKey(c))}
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          )}
        </Field>
      ) : null}
      {needNote ? (
        <Field label={listReady ? t('stay.note') : t('move.reason')} required error={noteError}>
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
      {!changed ? (
        <p className="li-s">
          {reason === 'guest_request'
            ? t(ota ? 'move.basis.ota' : 'move.basis.new_room_rate')
            : t('move.basis.keep_booked_rate')}
        </p>
      ) : current ? (
        <MovePreviewBox preview={preview!} ota={ota} />
      ) : preview && !previewError ? (
        <MovePreviewBox preview={preview} ota={ota} stale />
      ) : previewError ? (
        <>
          <Alert
            tone="bad"
            actions={
              isApiError(previewError) && previewError.status < 500 ? undefined : (
                <Button size="sm" onClick={() => setTick((n) => n + 1)}>
                  {t('common.retry')}
                </Button>
              )
            }
          >
            {isApiError(previewError) && previewError.status < 500
              ? rsvErrorText(t, previewError, { roomNo: undefined, canSeeGuest: true })
              : t('move.preview_failed')}
          </Alert>
          {suggestions.length ? (
            <div className="conflict-list">
              {suggestions.map((s) => (
                <Button key={s.roomId} size="sm" onClick={() => setRoomId(s.roomId)}>
                  {t('bk.use_room', { room: s.roomNo })}
                </Button>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="li-s" role="status">
          {t('move.preview_loading')}
        </p>
      )}
      {current && needTold ? (
        <Checkbox
          checked={told}
          onChange={(v) => {
            setTold(v);
            if (v) setChangedTo(null);
          }}
        >
          {t('move.told_guest')} *
        </Checkbox>
      ) : null}
    </Modal>
  );
}

const CONTACT = ['rsv.contact_noanswer', 'rsv.contact_late', 'rsv.contact_none'];

/**
 * B11 – US-136 AC2/AC3 (0.3.5 A-04): one step; the server decides the time (the button only exists
 * when `allowedActions` has `mark_no_show`); the dialog asks for the contact result (≥ 3 characters).
 */
export function NoShowDialog(props: DialogBase & { channelName: string }) {
  const { reservation: r } = props;
  const { t, vnd, locale } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [contact, setContact] = useState('');
  const [detail, setDetail] = useState('');
  const helpId = useId();
  const linesId = useId();
  const note = [contact ? t(contact) : '', detail.trim()].filter(Boolean).join(' – ');
  const room = r.segments?.[0]?.roomNo ?? '–';
  const ota = r.paymentModel !== 'direct';
  const availableFrom = problemOf(act.error)?.availableFrom;
  // S4-08 (BR-309 also on no-show): service lines from the folio (no dry run) – kept ones need a reason.
  const [lines, setLines] = useState<ServiceLine[] | null>(null);
  const [linesError, setLinesError] = useState(false);
  const [linesTick, setLinesTick] = useState(0);
  const [keep, setKeep] = useState<KeepState>({});
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    let stale = false;
    setLinesError(false);
    api.getFolio({ propertyId, folioId: r.folioId }).then(
      (f) => !stale && setLines(serviceLinesOfFolio(f.data, todayLocal())),
      () => !stale && setLinesError(true),
    );
    return () => {
      stale = true;
    };
  }, [propertyId, r.folioId, linesTick]);
  const ready = note.length >= 3 && lines !== null;

  const submit = async () => {
    setTouched(true);
    if (!ready || keepIncomplete(keep)) return;
    const retainLines = retainLinesOf(keep);
    const out = await act.run((version, idem) =>
      api.markNoShow(
        { propertyId, reservationId: r.id },
        { contactAttemptNote: note, retainLines: retainLines.length ? retainLines : undefined },
        version,
        idem,
      ),
    );
    if (out) {
      toast(t('rsv.toast.no_show', { code: r.code }));
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
              amount: vnd(r.depositPaidVnd ?? 0),
              room,
              from: dayMonth(r.arrivalDate),
              to: dayMonth(r.departureDate),
            })
      }
      keepLabel={t('noshow.keep')}
      confirmLabel={t('noshow.confirm')}
      busy={act.busy}
      busyLabel={act.busyLabel}
      confirmDisabled={!ready || act.locked}
      confirmHelpId={note.length < 3 ? helpId : lines === null ? linesId : undefined}
      onKeep={props.onClose}
      onConfirm={() => void submit()}
    >
      {typeof availableFrom === 'string' ? (
        <Alert tone="bad">
          {t('noshow.locked', { time: formatInstant(locale, availableFrom).slice(11) })}
        </Alert>
      ) : (
        act.errorView()
      )}
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
              <option key={c} value={c}>
                {t(c)}
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
      {/* FE-S4-13 (DS 7, C1): loading and failure are said, and the locked button points to them. */}
      {linesError ? (
        <Alert
          tone="warn"
          id={linesId}
          actions={
            <Button size="sm" onClick={() => setLinesTick((n) => n + 1)}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('svc.load_failed')}
        </Alert>
      ) : lines === null ? (
        <p className="li-s" role="status" id={linesId}>
          {t('svc.loading')}
        </p>
      ) : lines.length ? (
        <ServiceLinesPicker lines={lines} keep={keep} onChange={setKeep} showErrors={touched} />
      ) : null}
      {note.length < 3 ? (
        <p className="li-s" id={helpId}>
          {t('field_error.reason_required')}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}

/**
 * B12 – US-136 AC4/AC5: 200 restored, or 202 approval request for FD/FDL outside BR-315.
 * 0.3.5 A-21: when the room was resold, MGR+ restore into another free room (`roomId`) or into the
 * "Chưa gán căn" lane (`allowUnassigned`) straight from the 409.
 */
export function RestoreDialog(props: DialogBase & { requiresApproval: boolean }) {
  const { reservation: r } = props;
  const { t } = useI18n();
  const { roles } = useSession();
  const mgr = roles.some((x) => x === 'owner' || x === 'manager');
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useAction(props);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const reasonError =
    touched && reason.trim().length < 3 ? t('field_error.reason_required') : act.fields.reason;
  const resold =
    mgr && isApiError(act.error) && act.error.code === 'ROOM_UNAVAILABLE'
      ? suggestionsOf(act.error)
      : null;
  const submit = async (opts: { roomId?: string; allowUnassigned?: boolean } = {}) => {
    setTouched(true);
    if (reason.trim().length < 3) return;
    const out = await act.run((version, idem) =>
      api.restoreNoShow(
        { propertyId, reservationId: r.id },
        { reason: reason.trim(), ...opts },
        version,
        idem,
      ),
    );
    if (!out) return;
    if (out.status === 202) {
      toast(t('noshow.restore_request_sent'));
      props.onDone();
    } else {
      toast(t('rsv.toast.restored', { code: r.code }));
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
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={act.locked}
            onClick={() => void submit()}
          >
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
      {resold ? (
        <div className="conflict-list mb-12">
          {resold
            .filter((x) => !x.upgrade)
            .map((x) => (
              <Button key={x.roomId} size="sm" onClick={() => void submit({ roomId: x.roomId })}>
                {t('bk.use_room', { room: x.roomNo })}
              </Button>
            ))}
          <Button size="sm" onClick={() => void submit({ allowUnassigned: true })}>
            {t('bk.save_unassigned')}
          </Button>
        </div>
      ) : null}
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
 * B7a – US-139 AC2: free rooms for an OTA booking saved "chưa gán căn". `searchAvailability` with
 * `reservationId` (0.3.5 A-05) marks `upgrade` relative to the booking's group; upgrades are FDL+ only
 * (BR-312 (4)(ii)) – FD sees why the option is locked as visible text, not a tooltip.
 */
export function AssignRoomDialog(
  props: DialogBase & { rooms: Room[]; lead: boolean; channelLabel: string },
) {
  const { reservation: r, rooms, lead, channelLabel } = props;
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const [groupName, setGroupName] = useState(r.requestedRoomGroupCode ?? '');
  useEffect(() => {
    if (!r.requestedRoomGroupCode) return;
    let stale = false;
    api.listRoomGroups({ propertyId }).then(
      (g) =>
        !stale &&
        setGroupName(
          g.data.data.find((x) => x.code === r.requestedRoomGroupCode)?.name ??
            r.requestedRoomGroupCode!,
        ),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [propertyId, r.requestedRoomGroupCode]);
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
        {
          arrival: r.arrivalDate,
          departure: r.departureDate,
          adults: r.adults,
          reservationId: r.id,
        },
      )
      .then(
        (res) => {
          if (stale) return;
          const list = res.data.alternatives.map((a) => ({
            roomId: a.roomId,
            roomNo: a.roomNo,
            upgrade: !!a.upgrade,
          }));
          setOptions(list);
          setChoice(list.find((o) => !o.upgrade || lead)?.roomId ?? '');
        },
        (e: unknown) => !stale && setLoadError(e),
      );
    return () => {
      stale = true;
    };
  }, [propertyId, r.arrivalDate, r.departureDate, r.adults, r.id, lead]);

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
      toast(t('rsv.toast.assigned', { room: chosen.roomNo, code: r.code }));
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
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!chosen || act.locked}
            onClick={() => void submit()}
          >
            {t('rsv.assign_submit', { room: chosen?.roomNo ?? '' })}
          </Button>
        </>
      }
    >
      {/* 0.3.5 A-25: the group the channel mapped the booking to. */}
      <p>
        {r.requestedRoomGroupCode
          ? t('rsv.assign_lead', {
              channel: channelLabel,
              group: groupName,
              from: dayMonth(r.arrivalDate),
              to: dayMonth(r.departureDate),
              room: groupName,
            })
          : t('fo.rack.unassigned_help')}
      </p>
      {act.errorView()}
      {loadError ? <Alert tone="bad">{rsvErrorText(t, loadError)}</Alert> : null}
      {!options && !loadError ? <p className="li-s">{t('common.loading')}</p> : null}
      <fieldset className="fieldset-plain">
        <legend className="label-h mb-8">{t('rsv.assign_options')}</legend>
        {list.map((o, i) => (
          <label key={o.roomId} className="check card mb-8 p-8">
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
                    {t('move.resolution.upgrade')} ·{' '}
                    {lead ? t('rsv.upgrade_note') : t('rsv.upgrade_needs_lead')}
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

/**
 * A53 – CTV: "Báo đã chuyển cọc" (US-086 AC4); FD / sale confirm with B4 afterwards. S4-30: with the receipt
 * photo (`attachmentId`, accepted since 0.3.6 – SEC I1). The desk reads it back in "Xác nhận cọc"
 * (`Reservation.depositNotices[]`, 0.3.7 add. 1 – BUG-R2-081, `DepositNotices.tsx`).
 */
export function DepositNoticeDialog(props: Pick<DialogBase, 'reservation' | 'onDone' | 'onClose'>) {
  const { reservation: r } = props;
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { online } = useOnline();
  const write = useWrite();
  const busy = write.busy;
  const [amount, setAmount] = useState(r.depositRequiredVnd ? vnd(r.depositRequiredVnd) : '');
  const [note, setNote] = useState('');
  // S4-30 (US-086 AC4): the receipt photo goes with the report (`uploadAttachment purpose=deposit_receipt`,
  // the same click's key derived for the upload) – the file stays in memory only.
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<unknown>(null);
  // FB-R2-UXD-FE-S4-17: the photo upload failed (network / 5xx) – amount and photo are still here.
  const [uploadFailed, setUploadFailed] = useState(false);
  const value = parseVnd(amount) ?? 0;
  const submit = async () => {
    if (!(value > 0) || busy) return;
    setError(null);
    setUploadFailed(false);
    let atUpload = false;
    try {
      await write.run(async (idem) => {
        atUpload = !!receipt;
        const attachmentId = receipt
          ? (
              await api.uploadAttachment(
                { propertyId },
                receipt,
                'deposit_receipt',
                deriveIdempotencyKey(idem, 'attachment'),
                r.id,
              )
            ).data.id
          : undefined;
        atUpload = false;
        return api.createDepositNotice(
          { propertyId, reservationId: r.id },
          { amountVnd: value, note: note.trim() || undefined, attachmentId },
          idem,
        );
      });
      toast(t('drawer.deposit_notice.sent', { time: timeHHmm(new Date()) }));
      props.onDone();
    } catch (e) {
      if (isRetryable(e)) return;
      // A rejected file (422 FILE_REJECTED) keeps its own sentence; anything else at the upload step is
      // "photo not sent – try again".
      setUploadFailed(atUpload && !(isApiError(e) && e.status === 422));
      setError(e);
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
            busyLabel={write.busyLabel}
            disabled={!online || !(value > 0)}
            onClick={() => void submit()}
          >
            {write.label(t('drawer.action.deposit_notice'))}
          </Button>
        </>
      }
    >
      {write.notice}
      {error ? (
        <Alert tone="bad">
          {uploadFailed ? t('rsv.receipt_upload_failed') : rsvErrorText(t, error)}
        </Alert>
      ) : null}
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
      <FilePicker label={t('rsv.attach_receipt')} file={receipt} onChange={setReceipt} />
      <p className="help muted">{t('rsv.receipt_help')}</p>
      <p className="help muted">{t('drawer.deposit_notice.help')}</p>
    </Modal>
  );
}
