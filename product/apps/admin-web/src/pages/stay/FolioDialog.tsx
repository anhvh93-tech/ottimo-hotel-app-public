import {
  isApiError,
  type Folio,
  type FolioLine,
  type Payment,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Chip, ConfirmDialog, Field, Modal } from '@ottimo/ui';
import { useState } from 'react';
import { api } from '../../app/api';
import { lineLabel } from '../../app/folio';
import { parseVnd } from '../../app/money';
import { useToast } from '../../app/toast';
import { LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MoneyField, useSubmit } from './common';
import { FOC_CATEGORIES, FocRequestDialog, FocStateChip, canAskFoc } from './foc';

const OWN_MGR = ['owner', 'manager'];
const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
/** Lines born from the stay nights: a price only (S4-35 – `StayNightPricingPort.setNightRate`). */
const NIGHT = ['room', 'extra_person'];
/** System lines that are corrected elsewhere (FOC flow, cancellation), never adjusted here. */
const NOT_ADJUSTABLE = ['foc', 'discount', 'deposit_forfeit'];
const METHOD_KEY: Record<string, string> = {
  vietqr: 'pay.vietqr',
  cash: 'pay.cash',
  bank_transfer: 'pay.bank_transfer',
  card_pos: 'pay.card',
  ota_collect: 'pay.ota',
};

/**
 * S4-27 (US-006 AC1, US-032 AC1, US-038 AC2, US-119 AC3; BR-008): the folio with its corrections.
 * - "Điều chỉnh" a line = reversal + new line with a reason (`adjustFolioLine`, If-Match = `Folio.version`);
 *   nothing is ever deleted. Open folio: front desk and up (A31); settled folio: manager/owner only (A32).
 *   Night lines (`room`, `extra_person`) take a new price only – the night's price before the BR-107 step.
 * - "Đảo giao dịch" a payment recorded by mistake: manager/owner only (A34), reason required; the
 *   reversal is a new transaction, the original stays (409 INVALID_TRANSITION / 422 said in place – B-10).
 */
export function FolioDialog({
  reservation: r,
  onClose,
  onChanged,
}: {
  reservation: Reservation;
  onClose: () => void;
  /** A correction was written – the drawer reads the booking again. */
  onChanged: () => void;
}) {
  const { t, vnd, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const F = { propertyId, folioId: r.folioId };
  const folio = useResource(async () => (await api.getFolio(F)).data, [propertyId, r.folioId]);
  const f = folio.state.data;
  const mgr = roles.some((x) => OWN_MGR.includes(x));
  const fd = roles.some((x) => FD_PLUS.includes(x));
  const settled = f?.status !== 'open';
  const canAdjust = settled ? mgr : fd;
  const [adjusting, setAdjusting] = useState<FolioLine | null>(null);
  const [reversing, setReversing] = useState<Payment | null>(null);
  const [asking, setAsking] = useState<FolioLine | null>(null);

  const live = (f?.lines ?? []).filter((l) => l.lineState !== 'rejected');
  const reversedLines = new Set(live.map((l) => l.reversalOfId).filter(Boolean));
  const adjustable = (l: FolioLine) =>
    canAdjust &&
    l.lineState === 'posted' &&
    !l.reversalOfId &&
    !reversedLines.has(l.id) &&
    !NOT_ADJUSTABLE.includes(l.category);
  const payments = f?.payments ?? [];
  const reversedPays = new Set(payments.map((p) => p.reversalOfId).filter(Boolean));
  const reversible = (p: Payment) =>
    mgr && p.status === 'succeeded' && !p.reversalOfId && !reversedPays.has(p.id);
  const done = (next?: Folio) => {
    if (next) folio.mutate(() => next);
    else folio.reload();
    onChanged();
  };

  return (
    <Modal
      open
      size="lg"
      title={t('folio.dialog_title', { code: r.code })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      {!f ? (
        folio.state.status === 'error' ? (
          <Alert
            tone="bad"
            actions={
              <Button size="sm" onClick={folio.reload}>
                {t('common.retry')}
              </Button>
            }
          >
            {t('common.error_generic_title')}
          </Alert>
        ) : (
          <LoadingBlock rows={3} />
        )
      ) : (
        <>
          {settled ? (
            <Alert tone="info" role="note">
              {mgr ? t('folio.settled_mgr') : t('folio.settled_fd')}
            </Alert>
          ) : null}
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">{t('drawer.folio.title')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('folio.col_line')}</th>
                  <th scope="col" className="r">
                    {t('folio.col_amount')}
                  </th>
                  <th scope="col">
                    <span className="sr-only">{t('folio.adjust')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {live.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {lineLabel(t, l)}
                      {l.quantity !== 1 ? ` · ${l.quantity} × ${money(l.unitPriceVnd)}` : ''}
                      {FOC_CATEGORIES.includes(l.category) && !l.reversalOfId ? (
                        // S4-25 / BR-434: a FOC / discount says whether it waits, applies or no longer does.
                        <>
                          {' '}
                          <FocStateChip line={l} lines={f.lines} />
                        </>
                      ) : l.reversalOfId ? (
                        <>
                          {' '}
                          <Chip tone="neutral">{t('folio.reversal_chip')}</Chip>
                        </>
                      ) : reversedLines.has(l.id) ? (
                        <>
                          {' '}
                          <Chip tone="neutral">{t('folio.reversed_chip')}</Chip>
                        </>
                      ) : l.lineState === 'pending_approval' ? (
                        <>
                          {' '}
                          <Chip tone="warn" icon="hourglass">
                            {t('approval.status.pending')}
                          </Chip>
                        </>
                      ) : null}
                    </td>
                    {/* FE-S4-03: the column says "(đ)" – bare numbers in rows, the unit on the total. */}
                    <td className="r num">{vnd(l.amountVnd)}</td>
                    <td className="r">
                      {adjustable(l) ? (
                        <Button size="sm" variant="ghost" onClick={() => setAdjusting(l)}>
                          {t('folio.adjust')}
                        </Button>
                      ) : null}
                      {/* S4-25 (US-007 AC1, AC6): FOC / special discount on a charge of an open folio. */}
                      {!settled && fd && canAskFoc(f.lines, l) ? (
                        <Button size="sm" variant="ghost" onClick={() => setAsking(l)}>
                          {t('foc.open_form')}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <table className="sum mt-8">
            <tbody>
              <tr className="total">
                <td>{t('drawer.folio.balance')}</td>
                <td className="r num">{money(f.totals.balanceDueVnd ?? 0)}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="label-h mt-16">{t('folio.payments')}</h3>
          {payments.length === 0 ? (
            <p className="muted">{t('folio.payments_empty')}</p>
          ) : (
            <ul className="list-none">
              {payments.map((p) => (
                <li key={p.id} className="person">
                  <div className="grow">
                    <b className="num">{money(p.amountVnd)}</b> ·{' '}
                    {t(METHOD_KEY[p.method] ?? 'pay.method')}
                    <div className="li-s">
                      {[p.receivedAt ? dateTime(p.receivedAt) : null, p.recordedBy]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  {p.reversalOfId || p.status === 'reversed' || reversedPays.has(p.id) ? (
                    <Chip tone="neutral">{t('pay.reversed_chip')}</Chip>
                  ) : p.status === 'pending' ? (
                    <Chip tone="warn" icon="hourglass">
                      {t('approval.status.pending')}
                    </Chip>
                  ) : null}
                  {reversible(p) ? (
                    <Button size="sm" variant="ghost" onClick={() => setReversing(p)}>
                      {t('pay.reverse')}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {adjusting && f ? (
        <AdjustLineDialog
          folio={f}
          line={adjusting}
          calendarRateVnd={
            adjusting.category === 'room'
              ? r.nightlyRates?.find((n) => n.date === adjusting.serviceDate)?.calendarRateVnd
              : undefined
          }
          onClose={() => setAdjusting(null)}
          onDone={(next) => {
            setAdjusting(null);
            done(next);
          }}
          onStale={() => folio.reload()}
        />
      ) : null}
      {asking && f ? (
        <FocRequestDialog
          folioId={f.id}
          line={asking}
          lines={f.lines}
          onClose={() => setAsking(null)}
          onDone={() => {
            setAsking(null);
            done();
          }}
        />
      ) : null}
      {reversing ? (
        <ReversePaymentDialog
          payment={reversing}
          onClose={() => setReversing(null)}
          onDone={() => {
            setReversing(null);
            done();
          }}
        />
      ) : null}
    </Modal>
  );
}

/** One line: reversal + new line (BR-008). Night lines: new price only; others: quantity / price / void. */
function AdjustLineDialog({
  folio: f,
  line: l,
  calendarRateVnd,
  onClose,
  onDone,
  onStale,
}: {
  folio: Folio;
  line: FolioLine;
  /** DOM S4-38 (BR-107 v0.3.8): the night's calendar price (before the length-of-stay step) – what is typed. */
  calendarRateVnd?: number;
  onClose: () => void;
  onDone: (next: Folio) => void;
  onStale: () => void;
}) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useSubmit({ bound: ['newQuantity', 'newUnitPriceVnd', 'reason'] });
  const night = NIGHT.includes(l.category);
  const [qty, setQty] = useState(String(l.quantity));
  // A room night is priced on its calendar rate; the server applies the BR-107 step on it again.
  const basePrice = night && calendarRateVnd !== undefined ? calendarRateVnd : l.unitPriceVnd;
  const stepped = night && calendarRateVnd !== undefined && calendarRateVnd !== l.amountVnd;
  const [price, setPrice] = useState(vnd(basePrice));
  const [voidLine, setVoidLine] = useState(false);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const q = Number(qty.replace(',', '.'));
  const p = parseVnd(price);
  const qtyOk = night || voidLine || (Number.isFinite(q) && q >= 0);
  const priceOk = voidLine || (p !== null && p >= 0);
  const newAmount = voidLine ? 0 : Math.round(((night ? 1 : q) * (p ?? 0)) / 1000) * 1000;
  const changed = voidLine || (p !== null && p !== basePrice) || (!night && q !== l.quantity);
  const reasonError =
    touched && reason.trim().length < 3 ? t('field_error.reason_required') : act.fields.reason;
  // N-1 (BR-702 v0.3.8, NÊN): a minibar waiver is keyed on the item (BR-434-15) – voiding or cutting the line below
  // it puts the waiver to sleep, and it is cancelled at settlement unless the line comes back.
  const reversedIds = new Set(f.lines.map((x) => x.reversalOfId).filter(Boolean));
  // ARC 16.14: the item is `FolioLine.chargeCode` (item code, kept by an adjusted line) – never the bill name.
  const sameItem = (id?: string) => {
    const target = f.lines.find((y) => y.id === id);
    return (
      !!target &&
      (target.id === l.id ||
        (target.category === 'minibar' && !!l.chargeCode && target.chargeCode === l.chargeCode))
    );
  };
  const focOnItem =
    l.category === 'minibar'
      ? f.lines
          .filter(
            (x) =>
              FOC_CATEGORIES.includes(x.category) &&
              x.lineState !== 'rejected' &&
              !x.reversalOfId &&
              !reversedIds.has(x.id) &&
              sameItem(x.relatedLineId),
          )
          .reduce((a, x) => a + Math.abs(x.amountVnd), 0)
      : 0;
  const focAtRisk = changed && focOnItem > 0 && newAmount < focOnItem;

  const save = async () => {
    setTouched(true);
    if (!changed || !qtyOk || !priceOk || reason.trim().length < 3) return;
    const out = await act.submit((idem) =>
      api.adjustFolioLine(
        { propertyId, folioId: f.id },
        l.id,
        {
          newQuantity: night || voidLine || q === l.quantity ? undefined : q,
          newUnitPriceVnd: voidLine || p === l.unitPriceVnd ? undefined : (p ?? undefined),
          voidLine: voidLine || undefined,
          reason: reason.trim(),
        },
        f.version,
        idem,
      ),
    );
    if (out) {
      toast(t('folio.adjusted_toast'));
      onDone(out.data);
    }
  };
  const stale = act.code === 'VERSION_CONFLICT' || act.code === 'PRECONDITION_REQUIRED';
  return (
    <Modal
      open
      size="sm"
      title={t('folio.adjust_title', { label: lineLabel(t, l) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={changed || !!reason.trim()}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!changed}
            onClick={() => void save()}
          >
            {act.label(t('folio.adjust_submit'))}
          </Button>
        </>
      }
    >
      {stale ? (
        <Alert
          tone="warn"
          actions={
            <Button
              size="sm"
              onClick={() => {
                onStale();
                onClose();
              }}
            >
              {t('common.reload')}
            </Button>
          }
        >
          {act.text()}
        </Alert>
      ) : (
        act.view()
      )}
      {f.status !== 'open' ? <p className="li-s">{t('folio.settled_mgr')}</p> : null}
      {!night ? (
        <Field
          label={t('folio.adjust_qty')}
          error={!qtyOk ? t('field_error.amount_not_positive') : act.fields.newQuantity}
        >
          {(fp) => (
            <input
              {...fp}
              className="input num"
              inputMode="decimal"
              disabled={voidLine}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          )}
        </Field>
      ) : null}
      <MoneyField
        label={night ? t('folio.adjust_night_price') : t('folio.adjust_price')}
        help={
          night
            ? `${t('folio.adjust_night_help')}${
                stepped
                  ? ` ${t('rate.night_now', { amount: money(l.amountVnd), calendar: money(basePrice) })}`
                  : ''
              }`
            : undefined
        }
        value={price}
        onChange={setPrice}
        error={!priceOk ? t('field_error.amount_not_positive') : act.fields.newUnitPriceVnd}
      />
      {!night ? (
        <Checkbox checked={voidLine} onChange={setVoidLine}>
          {t('folio.adjust_void')}
        </Checkbox>
      ) : null}
      <Field label={t('folio.adjust_reason')} required error={reasonError}>
        {(fp) => (
          <input
            {...fp}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      {focAtRisk ? (
        <Alert tone="warn">{t('folio.void_minibar_foc', { amount: money(focOnItem) })}</Alert>
      ) : null}
      {changed ? (
        <p className="li-s" role="status">
          {stepped
            ? t('rate.adjust_night_effect', { old: money(l.amountVnd), new: money(newAmount) })
            : t('folio.adjust_effect', { old: money(l.amountVnd), new: money(newAmount) })}
        </p>
      ) : null}
    </Modal>
  );
}

/** US-119 AC3 (A34): a reversal transaction with a reason – the original stays (BR-008). */
function ReversePaymentDialog({
  payment: p,
  onClose,
  onDone,
}: {
  payment: Payment;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, money } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const act = useSubmit({ bound: ['reason'] });
  const [reason, setReason] = useState('');
  const method = t(METHOD_KEY[p.method] ?? 'pay.method');
  const submit = async () => {
    if (reason.trim().length < 3) return;
    const out = await act.submit((idem) =>
      api.reversePayment({ propertyId }, p.id, reason.trim(), idem),
    );
    if (out) {
      toast(t('pay.reverse_done', { amount: money(p.amountVnd) }));
      onDone();
    }
  };
  return (
    <ConfirmDialog
      title={t('pay.reverse_title', { amount: money(p.amountVnd), method })}
      body={t('pay.reverse_body', { amount: money(p.amountVnd) })}
      keepLabel={t('confirm.keep')}
      confirmLabel={t('pay.reverse')}
      busy={act.busy}
      busyLabel={act.busyLabel}
      confirmDisabled={reason.trim().length < 3}
      onKeep={onClose}
      onConfirm={() => void submit()}
    >
      {isApiError(act.error) && act.error.code === 'INVALID_TRANSITION' ? (
        <Alert tone="warn">{t('pay.reverse_invalid')}</Alert>
      ) : (
        act.view()
      )}
      <Field label={t('pay.reverse_reason')} required error={act.fields.reason}>
        {(fp) => (
          <input
            {...fp}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
    </ConfirmDialog>
  );
}
