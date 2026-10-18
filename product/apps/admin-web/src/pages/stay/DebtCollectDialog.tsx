import {
  isApiError,
  type FolioLine,
  type PaymentMethod,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { lineLabel } from '../../app/folio';
import { useToast } from '../../app/toast';
import { LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';
import { canAskFoc, focHeadroom } from './foc';

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
  // N-6 (ARC 16.29): the folio changed meanwhile (412) – read it again, keep the box and what was typed.
  useEffect(() => {
    if (act.code !== 'VERSION_CONFLICT') return;
    rsv.reload();
    folio.reload();
    // once per failed save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act.error]);
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
          {act.code === 'VERSION_CONFLICT' ? (
            <Alert tone="warn">{t('folio.changed_reload')}</Alert>
          ) : (
            act.view({ max: due })
          )}
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

/**
 * ARC 16.27 (R7LOCK-02, DOM 18/10 BR-525) "Xóa nợ": OWN/MGR write a debt off with a FOC (`reasonCode =
 * debt_write_off`) on a line they pick (a room line lowers the commission base, an extra does not – BR-903), up to
 * min(what is left of the line, what is still due), with a note. A manager above one night's price → the request
 * waits for the owner (BR-433).
 */
export function DebtWriteOffDialog({
  reservationId,
  onClose,
  onDone,
}: {
  reservationId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
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
  const f = folio.state.data;
  const due = f?.totals.balanceDueVnd ?? r?.balanceDueVnd ?? 0;
  const lines: FolioLine[] = f ? f.lines.filter((l) => canAskFoc(f.lines, l)) : [];
  const act = useSubmit();
  // N-6 (ARC 16.29): the folio changed meanwhile (412) – read it again, keep the box and what was typed.
  useEffect(() => {
    if (act.code !== 'VERSION_CONFLICT') return;
    rsv.reload();
    folio.reload();
    // once per failed save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act.error]);
  const [lineId, setLineId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const line = lines.find((l) => l.id === lineId);
  // FB-R2-ARC-FE-S4-02: the server's cap = min(line, open debt − pending write-offs of the folio). The box only
  // knows the line and what is still due; a 422 AMOUNT_EXCEEDS_BALANCE brings the real `max` (0 when pending
  // requests already cover the debt) – it caps the box until another charge is picked.
  const [serverMax, setServerMax] = useState<number | null>(null);
  useEffect(() => {
    const e = act.error;
    if (
      isApiError(e) &&
      e.fieldErrors.some((x) => x.code === 'AMOUNT_EXCEEDS_BALANCE') &&
      typeof e.problem.max === 'number'
    )
      setServerMax(e.problem.max);
  }, [act.error]);
  useEffect(() => setServerMax(null), [lineId]);
  const ownMax = line && f ? Math.min(focHeadroom(f.lines, line), due) : 0;
  const max = serverMax === null ? ownMax : Math.min(ownMax, serverMax);
  useEffect(() => {
    if (max > 0) setAmount(vnd(max));
    // the default follows the line picked (and the server's cap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId, max]);
  const value = amountOf(amount);
  const over = !!line && value > max;
  const ready = !!r && !!line && value > 0 && !over && note.trim().length >= 3;

  const save = async () => {
    if (!r || !line || !ready) return;
    const out = await act.submit((idem) =>
      api.requestFoc(
        { propertyId, folioId: r.folioId },
        line.id,
        { kind: 'foc', amountVnd: value, reasonCode: 'debt_write_off', note: note.trim() },
        idem,
      ),
    );
    if (out) {
      // Applied: what the server really wrote off (`effectiveAmountVnd`), not the figure typed.
      toast(
        out.data.status === 'pending'
          ? t('debt.write_off_pending', { amount: money(value), code: r.code })
          : t('debt.write_off_done', {
              amount: money(out.data.effectiveAmountVnd ?? value),
              code: r.code,
            }),
      );
      onDone();
    }
  };

  return (
    <Modal
      open
      size="sm"
      title={t('debt.write_off_title', { code: r?.code ?? '' })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!ready}
            onClick={() => void save()}
          >
            {act.label(t('debt.write_off_submit', { amount: money(ready ? value : 0) }))}
          </Button>
        </>
      }
    >
      {!r || !f ? (
        <LoadingBlock rows={2} />
      ) : (
        <div className="stack">
          <p>{t('debt.write_off_help', { amount: money(due) })}</p>
          {roles.includes('owner') ? null : <p className="li-s">{t('debt.write_off_limit')}</p>}
          {act.code === 'VERSION_CONFLICT' ? (
            <Alert tone="warn">{t('folio.changed_reload')}</Alert>
          ) : serverMax !== null ? (
            <Alert tone="warn">
              {serverMax > 0
                ? t('debt.write_off_server_max', { amount: money(serverMax) })
                : t('debt.write_off_none_left')}
            </Alert>
          ) : (
            act.view({ max })
          )}
          <fieldset className="fieldset-plain">
            <legend className="label-h">{t('debt.write_off_line')}</legend>
            {lines.map((l) => (
              <label key={l.id} className="check">
                <input
                  type="radio"
                  name={`${ids}-line`}
                  checked={lineId === l.id}
                  onChange={() => setLineId(l.id)}
                />
                {lineLabel(t, l)} · {money(focHeadroom(f.lines, l))}
              </label>
            ))}
          </fieldset>
          {line ? (
            <MoneyField
              label={t('co.amount')}
              help={t('debt.collect_max', { amount: money(max) })}
              required
              value={amount}
              onChange={setAmount}
              error={
                over
                  ? t('field_error.value_out_of_range', { min: money(1), max: money(max) })
                  : serverMax === null
                    ? act.fields.amountVnd
                    : undefined
              }
            />
          ) : null}
          <Field label={t('debt.write_off_note')} required error={act.fields.note}>
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
        </div>
      )}
    </Modal>
  );
}
