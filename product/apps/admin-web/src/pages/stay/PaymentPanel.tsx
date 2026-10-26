import type { Payment, PaymentMethod, Reservation, VietQrResult } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { useToast } from '../../app/toast';
import { VietQrCard, qrOverDue } from '../../components/VietQrCard';
import { usePropertyId } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';

type Method = 'vietqr' | 'cash' | 'bank_transfer' | 'card_pos';

/**
 * BUG-R3-017: a cash / POS card payment taken on the check-out bill step for money B18 itself posts (one-night late fee,
 * extra night) – not recorded now (`recordPayment` refuses more than the folio owes without a note), written by
 * "Hoàn tất" as `checkOut.finalPayment` in the same transaction.
 */
export interface StagedPayment {
  method: 'cash' | 'card_pos';
  amountVnd: number;
  posAuthCode?: string;
}

/**
 * H16 16.3 / H13 13.5 "Thu tiền": VietQR drawn in the bundle from the server `qrPayload` (SEC F2 –
 * amount and transfer content come from the server, never typed into the QR by the client), then
 * "Ghi nhận đã thu" (`confirmPaymentReceived`: pending → succeeded, still "chờ đối soát"); cash with
 * change due; bank transfer typed by hand ("chờ đối soát"); POS card with the approval code only
 * (never a card number – V-09). One Idempotency-Key per button (double click = one payment).
 */
export function PaymentPanel({
  reservation,
  balanceVnd,
  purpose = 'balance',
  checkout,
  onPaid,
  onStale,
}: {
  reservation: Reservation;
  balanceVnd: number;
  purpose?: 'balance' | 'deposit';
  /**
   * H16 step 3 (0.3.7 S4-10, bổ sung 4): the QR of the check-out step – capped by `amountDueAtCheckoutVnd` at this
   * time, with the typed extra-night rate or the one-night late fee (BR-416-06), not by the folio balance.
   */
  checkout?: {
    checkoutAt?: string;
    extraNightRateVnd?: number;
    lateFeeAsNight?: boolean;
    /**
     * BUG-R3-017: what the folio owes NOW (`CheckoutSummary.balanceDueVnd`). Cash / POS card above it (up to
     * `balanceVnd`, the due at check-out) is handed to `onStage` – sent with "Hoàn tất" as `finalPayment`.
     */
    folioBalanceVnd?: number;
    onStage?: (p: StagedPayment) => void;
  };
  onPaid: (p: Payment) => void;
  /** N-6 (ARC 16.29): the folio changed meanwhile (412) – the caller reads it again; the panel keeps its input. */
  onStale?: () => void;
}) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const folio = { propertyId, folioId: reservation.folioId };
  const [method, setMethod] = useState<Method>('vietqr');
  const [amount, setAmount] = useState(balanceVnd > 0 ? vnd(balanceVnd) : '');
  const [cash, setCash] = useState('');
  const [note, setNote] = useState('');
  const [pos, setPos] = useState('');
  /** BUG-R3-017: more than the due at check-out typed for a payment written with "Hoàn tất". */
  const [stageError, setStageError] = useState<string | null>(null);
  const [qr, setQr] = useState<VietQrResult | null>(null);
  const qrAct = useSubmit();
  const payAct = useSubmit();
  // N-6 (ARC 16.29): 412 – the folio moved on; the caller reloads it, the panel keeps the amount typed.
  const stale = payAct.code === 'VERSION_CONFLICT';
  useEffect(() => {
    if (stale) onStale?.();
    // once per failed save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payAct.error]);
  const payView = () =>
    stale ? <Alert tone="warn">{t('folio.changed_reload')}</Alert> : payAct.view();
  const value = amountOf(amount);
  const change = method === 'cash' ? amountOf(cash) - value : 0;

  useEffect(() => {
    setAmount(balanceVnd > 0 ? vnd(balanceVnd) : '');
    setQr(null);
    // only when the server balance changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceVnd]);

  const createQr = async () => {
    if (!(value > 0)) return;
    const out = await qrAct.submit((idem) =>
      api.createVietQr(
        folio,
        checkout
          ? {
              amountVnd: value,
              purpose: 'check_out',
              checkoutAt: checkout.checkoutAt,
              extraNightRateVnd: checkout.extraNightRateVnd,
              lateFeeAsNight: checkout.lateFeeAsNight,
            }
          : { amountVnd: value, purpose },
        idem,
      ),
    );
    if (out) setQr(out.data);
  };

  const over = qr ? qrOverDue(qr.payment, payAct.error) : null;
  const confirmQr = async () => {
    if (!qr) return;
    if (over !== null && note.trim().length < 3) return;
    const out = await payAct.submit((idem) =>
      api.confirmPaymentReceived(
        { propertyId },
        qr.payment.id,
        { note: note.trim() || undefined },
        idem,
      ),
    );
    if (out) {
      toast(t('pay.record', { amount: money(out.data.amountVnd) }));
      setQr(null);
      setNote('');
      onPaid(out.data);
    }
  };

  const record = async () => {
    if (!(value > 0)) return;
    // BUG-R3-017: the late fee of one night / the extra night is posted by B18, so the folio owes less now than the bill
    // shows. Cash and POS card above what the folio owes go with "Hoàn tất" (`finalPayment`, capped by the server at
    // the due at check-out) – never recorded now (422 `note` REASON_REQUIRED, no note box for them).
    const stage = checkout?.onStage;
    if (
      stage &&
      (method === 'cash' || method === 'card_pos') &&
      checkout?.folioBalanceVnd !== undefined &&
      value > checkout.folioBalanceVnd
    ) {
      if (value > balanceVnd) {
        setStageError(t('co.pay_at_complete_over', { max: money(balanceVnd) }));
        return;
      }
      stage({
        method,
        amountVnd: value,
        posAuthCode: method === 'card_pos' ? pos.trim() : undefined,
      });
      setPos('');
      setCash('');
      return;
    }
    const out = await payAct.submit((idem) =>
      api.recordPayment(
        folio,
        {
          type: purpose === 'deposit' ? 'deposit' : 'charge',
          method: method as PaymentMethod,
          amountVnd: value,
          note: note.trim() || undefined,
          posAuthCode: method === 'card_pos' ? pos.trim() : undefined,
        },
        idem,
      ),
    );
    if (out) {
      toast(t('pay.record', { amount: money(out.data.amountVnd) }));
      setNote('');
      setPos('');
      setCash('');
      onPaid(out.data);
    }
  };

  const methods: Array<{ value: Method; label: string }> = [
    { value: 'vietqr', label: t('pay.vietqr') },
    { value: 'cash', label: t('pay.cash') },
    { value: 'bank_transfer', label: t('pay.bank_transfer') },
    { value: 'card_pos', label: t('pay.card') },
  ];

  return (
    <div className="stack">
      <span className="label-h" id={`${ids}-m`}>
        {t('pay.method')}
      </span>
      <Seg
        labelledBy={`${ids}-m`}
        options={methods}
        value={method}
        onChange={(m) => {
          setMethod(m);
          setQr(null);
        }}
      />
      <MoneyField
        label={t('co.amount')}
        value={amount}
        onChange={(v) => {
          setAmount(v);
          setQr(null);
          setStageError(null);
        }}
        error={stageError ?? payAct.fields.amountVnd ?? qrAct.fields.amountVnd}
        required
      />

      {method === 'vietqr' ? (
        qr ? (
          <div className="card">
            {/* FE-S3-07 / DS 6.16 + DS 11.6 B1: shared card – one block per fact, codes in mono. */}
            <VietQrCard qr={qr} />
            <p className="li-s" role="status">
              {t('pay.qr_waiting')}
            </p>
            {over !== null ? (
              <Alert tone="warn">
                {t('pay.qr_over_note', {
                  amount: money(qr.payment.amountVnd),
                  max: money(over),
                })}
              </Alert>
            ) : null}
            <Field
              label={t('co.txn_ref')}
              required={over !== null}
              error={
                over !== null && note.trim().length < 3
                  ? t('field_error.reason_required')
                  : payAct.fields.note
              }
            >
              {(p) => (
                <input
                  {...p}
                  className="input"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
            </Field>
            <p className="li-s">{t('pay.error_not_received')}</p>
            {over !== null ? null : payView()}
            <Button
              variant="pri"
              busy={payAct.busy}
              busyLabel={payAct.busyLabel}
              onClick={() => void confirmQr()}
            >
              {payAct.label(t('pay.record', { amount: money(qr.payment.amountVnd) }))}
            </Button>
          </div>
        ) : (
          <>
            {qrAct.view()}
            <Button
              variant="pri"
              icon="scan"
              busy={qrAct.busy}
              busyLabel={qrAct.busyLabel}
              disabled={!(value > 0)}
              onClick={() => void createQr()}
            >
              {qrAct.label(t('pay.vietqr_create', { amount: money(value) }))}
            </Button>
          </>
        )
      ) : (
        <>
          {method === 'cash' ? (
            <>
              <MoneyField label={t('co.cash_received')} value={cash} onChange={setCash} />
              {change > 0 ? (
                <p className="num" role="status">
                  {t('co.change_due', { amount: money(change) })}
                </p>
              ) : cash.trim() && change < 0 ? (
                <p className="num" role="status">
                  {t('pay.cash_short', { amount: money(-change) })}
                </p>
              ) : null}
            </>
          ) : null}
          {method === 'card_pos' ? (
            <Field
              label={t('co.pos_code')}
              help={t('co.pos_no_card')}
              error={payAct.fields.posAuthCode}
              required
            >
              {(p) => (
                <input
                  {...p}
                  className="input mono"
                  maxLength={12}
                  autoComplete="off"
                  value={pos}
                  onChange={(e) => setPos(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                />
              )}
            </Field>
          ) : null}
          {method === 'bank_transfer' ? (
            <>
              <Field label={t('co.txn_ref')} error={payAct.fields.note}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                )}
              </Field>
              <p className="li-s">
                <Chip tone="warn" icon="hourglass" className="recon">
                  {t('pay.pending_reconcile')}
                </Chip>{' '}
                {t('rsv.reconcile_note')}
              </p>
            </>
          ) : null}
          {payView()}
          <Button
            variant="pri"
            busy={payAct.busy}
            busyLabel={payAct.busyLabel}
            disabled={!(value > 0) || (method === 'card_pos' && !pos.trim())}
            onClick={() => void record()}
          >
            {payAct.label(t('pay.record', { amount: money(value) }))}
          </Button>
        </>
      )}
    </div>
  );
}
