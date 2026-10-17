import type { Payment, PaymentMethod, Reservation, VietQrResult } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Button, Chip, Field, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { useToast } from '../../app/toast';
import { VietQrCard } from '../../components/VietQrCard';
import { usePropertyId } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';

type Method = 'vietqr' | 'cash' | 'bank_transfer' | 'card_pos';

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
  onPaid,
}: {
  reservation: Reservation;
  balanceVnd: number;
  purpose?: 'balance' | 'deposit';
  onPaid: (p: Payment) => void;
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
  const [qr, setQr] = useState<VietQrResult | null>(null);
  const qrAct = useSubmit();
  const payAct = useSubmit();
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
      api.createVietQr(folio, { amountVnd: value, purpose }, idem),
    );
    if (out) setQr(out.data);
  };

  const confirmQr = async () => {
    if (!qr) return;
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
        }}
        error={payAct.fields.amountVnd ?? qrAct.fields.amountVnd}
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
            <p className="li-s">{t('pay.error_not_received')}</p>
            {payAct.view()}
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
          {payAct.view()}
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
