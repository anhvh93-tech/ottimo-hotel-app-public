import type { Payment, Reservation, VietQrResult } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { useToast } from '../../app/toast';
import { VietQrCard, qrOverDue } from '../../components/VietQrCard';
import { usePropertyId } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';

export type CheckInPayMethod = 'vietqr' | 'cash' | 'bank_transfer' | 'card_pos';

/** What the desk collects WITH the check-in (`checkIn.payment` – cash, transfer, POS). */
export interface InlinePay {
  method: CheckInPayMethod;
  /** Bank reference / sender (transfer); never a card number (V-09). */
  note: string;
  /** POS approval code only. */
  pos: string;
  /** Cash the guest handed over – typed by the desk (required): the change is computed from it. */
  cash: string;
  /** Transfer / POS: the amount the desk actually received – typed (required), recorded as is. */
  amount: string;
}
export const emptyInlinePay = (): InlinePay => ({
  method: 'vietqr',
  note: '',
  pos: '',
  cash: '',
  amount: '',
});

/** Why the payment taken with B9 is not ready – the sentence next to the locked button. */
export type InlinePayBlock =
  | { kind: 'qr' }
  | { kind: 'amount_needed' }
  | { kind: 'cash_short'; shortVnd: number }
  | { kind: 'short'; shortVnd: number }
  | { kind: 'over'; dueVnd: number }
  | { kind: 'pos_code' };

/**
 * FB-R2-UXD-FE-S4-01 (Blocker, sai tiền): the amount recorded with B9 is the money the desk really took.
 * - Cash: "Tiền khách đưa" is required; less than the amount due → blocked (nothing is sent); more → the
 *   amount due is recorded and the change is given back.
 * - Transfer / POS: the amount received is required and must equal the amount due (less → blocked;
 *   more → blocked: an overpayment is not recorded silently at check-in).
 * - VietQR: never inline – confirmed received before B9.
 */
export function inlinePayment(
  pay: InlinePay,
  due: number,
): { ok: true; amountVnd: number; changeVnd: number } | { ok: false; block: InlinePayBlock } {
  if (pay.method === 'vietqr') return { ok: false, block: { kind: 'qr' } };
  if (pay.method === 'cash') {
    const received = amountOf(pay.cash);
    if (!(received > 0)) return { ok: false, block: { kind: 'amount_needed' } };
    if (received < due)
      return { ok: false, block: { kind: 'cash_short', shortVnd: due - received } };
    return { ok: true, amountVnd: due, changeVnd: received - due };
  }
  const got = amountOf(pay.amount);
  if (!(got > 0)) return { ok: false, block: { kind: 'amount_needed' } };
  if (got < due) return { ok: false, block: { kind: 'short', shortVnd: due - got } };
  if (got > due) return { ok: false, block: { kind: 'over', dueVnd: due } };
  if (pay.method === 'card_pos' && !pay.pos.trim())
    return { ok: false, block: { kind: 'pos_code' } };
  return { ok: true, amountVnd: got, changeVnd: 0 };
}

/** One line of "what has to be collected now" (all amounts from `previewCheckIn`). */
export interface DueBreakdown {
  balanceVnd: number;
  earlyVnd: number;
  priorNightVnd: number;
  focAskedVnd: number;
}

/**
 * S4-10 (BUG-R2-038, US-025 AC3; BR-402 v0.3.6): H13 collects `CheckInPreview.amountDueAtCheckinVnd` –
 * the balance plus the early-check-in charge / B9a night the check-in is about to post, minus a FOC
 * asked on that charge. Cash / transfer / POS go WITH the check-in (`checkIn.payment`: nothing is
 * written if B9 fails) for the amount the desk really took (FE-S4-01); VietQR is created for the amount
 * due (`purpose=check_in`) and confirmed received first – B9 then finds the folio paid.
 * FE-S4-02: a front-desk request to the lead (202, room not ready) records no payment (ARC 0.3.7) – only
 * VietQR (taken beforehand) is offered, and the sentence says the money is collected after approval.
 */
export function CheckInPayment({
  reservation: r,
  due,
  breakdown,
  qrInput,
  pay,
  onPay,
  fields,
  onPaid,
  requestOnly = false,
  pendingQr,
}: {
  reservation: Reservation;
  due: number;
  breakdown: DueBreakdown;
  /** What the server needs to compute the same cap for a `check_in` VietQR. */
  qrInput: { checkinTime?: string; addPriorNight?: boolean; priorNightRateVnd?: number };
  pay: InlinePay;
  onPay: (p: InlinePay) => void;
  /** Field errors of the last B9 attempt (`payment.*`). */
  fields: Record<string, string>;
  onPaid: (p: Payment) => void;
  /** The button sends a request to the lead (202) – no payment goes with it. */
  requestOnly?: boolean;
  /**
   * A check-in VietQR made earlier and still waiting (folio payments – e.g. before the page was reloaded): confirm
   * it rather than draw another (a new QR expires it). DOM (f): above what is due now → a note is required.
   */
  pendingQr?: Payment;
}) {
  const { t, vnd, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const [qr, setQr] = useState<VietQrResult | null>(null);
  const [qrNote, setQrNote] = useState('');
  const qrAct = useSubmit();
  const payAct = useSubmit();
  const set = (patch: Partial<InlinePay>) => onPay({ ...pay, ...patch });
  const method: CheckInPayMethod = requestOnly ? 'vietqr' : pay.method;
  const check = inlinePayment({ ...pay, method }, due);
  const change = check.ok ? check.changeVnd : 0;

  // A QR is for one amount: a new amount (time, FOC, payment elsewhere) needs a new code.
  useEffect(() => {
    setQr(null);
  }, [due]);

  const createQr = async () => {
    if (!(due > 0)) return;
    const out = await qrAct.submit((idem) =>
      api.createVietQr(
        { propertyId, folioId: r.folioId },
        { amountVnd: due, purpose: 'check_in', ...qrInput },
        idem,
      ),
    );
    if (out) setQr(out.data);
  };
  const waiting = qr?.payment ?? pendingQr;
  const over = qrOverDue(waiting, payAct.error);
  const confirmQr = async () => {
    if (!waiting) return;
    if (over !== null && qrNote.trim().length < 3) return;
    const out = await payAct.submit((idem) =>
      api.confirmPaymentReceived(
        { propertyId },
        waiting.id,
        { note: qrNote.trim() || undefined },
        idem,
      ),
    );
    if (out) {
      toast(t('pay.record', { amount: money(out.data.amountVnd) }));
      setQr(null);
      setQrNote('');
      onPaid(out.data);
    }
  };

  // Note + "Ghi nhận đã thu" of the QR waiting (made now or earlier); DOM (f): above what is due now → note required.
  const confirmFields = waiting ? (
    <>
      {over !== null ? (
        <Alert tone="warn">
          {t('pay.qr_over_note', { amount: money(waiting.amountVnd), max: money(over) })}
        </Alert>
      ) : null}
      <Field
        label={t('co.txn_ref')}
        required={over !== null}
        error={
          over !== null && qrNote.trim().length < 3
            ? t('field_error.reason_required')
            : payAct.fields.note
        }
      >
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={300}
            value={qrNote}
            onChange={(e) => setQrNote(e.target.value)}
          />
        )}
      </Field>
      <p className="li-s">{t('pay.error_not_received')}</p>
      {over !== null ? null : payAct.view()}
      <Button
        variant="pri"
        busy={payAct.busy}
        busyLabel={payAct.busyLabel}
        onClick={() => void confirmQr()}
      >
        {payAct.label(t('pay.record', { amount: money(waiting.amountVnd) }))}
      </Button>
    </>
  ) : null;

  const methods: Array<{ value: CheckInPayMethod; label: string }> = [
    { value: 'vietqr', label: t('pay.vietqr') },
    { value: 'cash', label: t('pay.cash') },
    { value: 'bank_transfer', label: t('pay.bank_transfer') },
    { value: 'card_pos', label: t('pay.card') },
  ];
  const { balanceVnd, earlyVnd, priorNightVnd, focAskedVnd } = breakdown;
  // FE-S4-12: the "current balance" line only when something is added or taken off.
  const parts = !!(earlyVnd || priorNightVnd || focAskedVnd);

  return (
    <div className="stack">
      <table className="sum">
        <tbody>
          {parts ? (
            <tr>
              <td>{t('ci.due_balance')}</td>
              <td className="r num">{vnd(balanceVnd)}</td>
            </tr>
          ) : null}
          {earlyVnd ? (
            <tr>
              <td>{t('ci.due_early')}</td>
              <td className="r num">+{vnd(earlyVnd)}</td>
            </tr>
          ) : null}
          {priorNightVnd ? (
            <tr>
              <td>{t('ci.due_prior_night')}</td>
              <td className="r num">+{vnd(priorNightVnd)}</td>
            </tr>
          ) : null}
          {focAskedVnd ? (
            <tr>
              <td>{t('ci.due_foc')}</td>
              <td className="r num">−{vnd(focAskedVnd)}</td>
            </tr>
          ) : null}
          <tr className="total">
            <td>{t('ci.due_title')}</td>
            <td className="r num">{money(due)}</td>
          </tr>
        </tbody>
      </table>
      {due > 0 ? (
        <>
          {requestOnly ? (
            <p className="li-s" role="status">
              {t('ci.pay_after_lead', { amount: money(due) })}
            </p>
          ) : (
            <>
              <span className="label-h" id={`${ids}-m`}>
                {t('pay.method')}
              </span>
              <Seg
                labelledBy={`${ids}-m`}
                options={methods}
                value={pay.method}
                onChange={(m) => set({ method: m })}
              />
            </>
          )}
          {method === 'vietqr' ? (
            qr ? (
              <div className="card inset stack">
                <VietQrCard qr={qr} />
                <p className="li-s" role="status">
                  {t('pay.qr_waiting')}
                </p>
                {confirmFields}
              </div>
            ) : pendingQr ? (
              <div className="card inset stack">
                <p role="status">
                  {t('pay.qr_pending_earlier', {
                    amount: money(pendingQr.amountVnd),
                    time: pendingQr.expiresAt ? dateTime(pendingQr.expiresAt) : '–',
                  })}
                </p>
                {confirmFields}
                {/* The guest has not paid that code: a new one for the amount due now (the old one expires). */}
                {qrAct.view()}
                <Button
                  variant="ghost"
                  icon="scan"
                  busy={qrAct.busy}
                  busyLabel={qrAct.busyLabel}
                  onClick={() => void createQr()}
                >
                  {qrAct.label(t('pay.vietqr_create', { amount: money(due) }))}
                </Button>
              </div>
            ) : (
              <>
                {requestOnly ? null : <p className="li-s">{t('ci.pay_qr_first')}</p>}
                {qrAct.view()}
                <Button
                  icon="scan"
                  busy={qrAct.busy}
                  busyLabel={qrAct.busyLabel}
                  onClick={() => void createQr()}
                >
                  {qrAct.label(t('pay.vietqr_create', { amount: money(due) }))}
                </Button>
              </>
            )
          ) : (
            <>
              {method === 'cash' ? (
                <>
                  <MoneyField
                    label={t('co.cash_received')}
                    value={pay.cash}
                    onChange={(v) => set({ cash: v })}
                    error={fields['payment.amountVnd']}
                    required
                  />
                  {change > 0 ? (
                    <p className="num" role="status">
                      {t('co.change_due', { amount: money(change) })}
                    </p>
                  ) : null}
                </>
              ) : (
                <MoneyField
                  label={t('ci.pay_received')}
                  value={pay.amount}
                  onChange={(v) => set({ amount: v })}
                  error={fields['payment.amountVnd']}
                  required
                />
              )}
              {method === 'card_pos' ? (
                <Field
                  label={t('co.pos_code')}
                  help={t('co.pos_no_card')}
                  error={fields['payment.posAuthCode']}
                  required
                >
                  {(p) => (
                    <input
                      {...p}
                      className="input mono"
                      maxLength={12}
                      autoComplete="off"
                      value={pay.pos}
                      onChange={(e) => set({ pos: e.target.value.replace(/[^A-Za-z0-9]/g, '') })}
                    />
                  )}
                </Field>
              ) : null}
              {method === 'bank_transfer' ? (
                <>
                  <Field label={t('co.txn_ref')} error={fields['payment.note']}>
                    {(p) => (
                      <input
                        {...p}
                        className="input"
                        maxLength={300}
                        value={pay.note}
                        onChange={(e) => set({ note: e.target.value })}
                      />
                    )}
                  </Field>
                  {/* FE-S4-09: the reconciliation sentence only for a hand-recorded transfer. */}
                  <p className="li-s">
                    <Chip tone="warn" icon="hourglass" className="recon">
                      {t('pay.pending_reconcile')}
                    </Chip>{' '}
                    {t('ci.recon_ok')}
                  </p>
                </>
              ) : null}
              <p className="li-s" role="status">
                {t('ci.pay_inline', { amount: money(check.ok ? check.amountVnd : due) })}
              </p>
            </>
          )}
        </>
      ) : (
        <Chip tone="ok" icon="check">
          {t('drawer.folio.settled')}
        </Chip>
      )}
    </div>
  );
}
