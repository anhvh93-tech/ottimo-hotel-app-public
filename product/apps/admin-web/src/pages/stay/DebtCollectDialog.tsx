import type { PaymentMethod, Reservation } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Button, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { useToast } from '../../app/toast';
import { LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';

type Method = 'cash' | 'bank_transfer' | 'card_pos';

/**
 * ARC 16.26 (BR-525 G-4) "Thu công nợ": a checked-out stay with an open debt takes a `charge` on its settled folio
 * (FD+), up to what is still due – all of it or a part; the bill already issued does not change. VietQR for a debt is
 * R3: cash, a transfer typed by hand (reconciled as usual – BR-527) or a POS slip. Opened from the booking drawer and
 * from the "Cần chú ý" line `checkout_debt`.
 */
export function DebtCollectDialog({
  reservationId,
  onClose,
  onDone,
}: {
  reservationId: string;
  onClose: () => void;
  /** Collected – the caller reads the booking / the attention list again. */
  onDone: () => void;
}) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const rsv = useResource(
    async () => (await api.getReservation({ propertyId, reservationId })).data,
    [propertyId, reservationId],
  );
  const r: Reservation | undefined = rsv.state.data;
  const folio = useResource(
    async () => (r?.folioId ? (await api.getFolio({ propertyId, folioId: r.folioId })).data : null),
    [propertyId, r?.folioId],
  );
  const due = folio.state.data?.totals.balanceDueVnd ?? r?.balanceDueVnd ?? 0;
  const act = useSubmit();
  const [method, setMethod] = useState<Method>('cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pos, setPos] = useState('');
  useEffect(() => {
    if (due > 0) setAmount(vnd(due));
    // the amount still due, once known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due]);
  const value = amountOf(amount);
  const over = value > due;
  const ready =
    !!r && due > 0 && value > 0 && !over && (method !== 'card_pos' || pos.trim().length > 0);

  const save = async () => {
    if (!r || !ready) return;
    const out = await act.submit((idem) =>
      api.recordPayment(
        { propertyId, folioId: r.folioId },
        {
          type: 'charge',
          method: method as PaymentMethod,
          amountVnd: value,
          note: note.trim() || undefined,
          posAuthCode: method === 'card_pos' ? pos.trim() : undefined,
        },
        idem,
      ),
    );
    if (out) {
      toast(t('debt.collected_toast', { amount: money(value), code: r.code }));
      onDone();
    }
  };

  const methods: Array<{ value: Method; label: string }> = [
    { value: 'cash', label: t('pay.cash') },
    { value: 'bank_transfer', label: t('pay.bank_transfer') },
    { value: 'card_pos', label: t('pay.card') },
  ];
  return (
    <Modal
      open
      size="sm"
      title={t('debt.collect_title', { code: r?.code ?? '' })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!ready}
            onClick={() => void save()}
          >
            {act.label(t('debt.collect_submit', { amount: money(ready ? value : 0) }))}
          </Button>
        </>
      }
    >
      {!r || !folio.state.data ? (
        <LoadingBlock rows={2} />
      ) : (
        <div className="stack">
          <p>{t('debt.collect_help', { amount: money(due) })}</p>
          {act.view({ max: due })}
          <span className="label-h" id={`${ids}-m`}>
            {t('pay.method')}
          </span>
          <Seg labelledBy={`${ids}-m`} options={methods} value={method} onChange={setMethod} />
          <MoneyField
            label={t('co.amount')}
            help={t('debt.collect_max', { amount: money(due) })}
            required
            value={amount}
            onChange={setAmount}
            error={
              over
                ? t('field_error.value_out_of_range', { min: money(1), max: money(due) })
                : act.fields.amountVnd
            }
          />
          {method === 'card_pos' ? (
            <Field label={t('co.pos_code')} help={t('co.pos_no_card')} required>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  value={pos}
                  onChange={(e) => setPos(e.target.value)}
                />
              )}
            </Field>
          ) : (
            <Field label={t('co.txn_ref')} error={act.fields.note}>
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
          )}
        </div>
      )}
    </Modal>
  );
}
