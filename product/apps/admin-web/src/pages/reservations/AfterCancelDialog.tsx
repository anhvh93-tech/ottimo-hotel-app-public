import { deriveIdempotencyKey, isApiError, type Folio } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useEffect, useRef, useState } from 'react';
import {
  afterCancelMethods,
  afterCancelType,
  dueOf,
  refundCreatedVnd,
  type AfterCancelMethod,
} from '../../app/afterCancel';
import { api } from '../../app/api';
import { problemView } from '../../app/problem';
import { fromLocalInput, toLocalInput } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { BankReferenceField, bankReferenceOf } from '../../components/BankReferenceField';
import { LoadingBlock } from '../../components/states';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { FilePicker, MoneyField, amountOf, useSubmit, useUnsavedLabels } from '../stay/common';
import type { DialogBase } from './ReservationDialogs';

const METHOD_KEY: Record<AfterCancelMethod, string> = {
  bank_transfer: 'pay.bank_transfer',
  vietqr: 'pay.vietqr',
  card_pos: 'pay.card',
};

/**
 * V5-5B 5B-1 "Ghi tiền về sau khi hủy" (contract 0.3.13 addendum 1 `recordPayment` (B), #148; DOM 11.4; UXD copy-v1.0.5
 * 9.1 v2.5): money that reached OTTIMO's account after the booking was cancelled / marked no-show. FD+ only.
 * - N = `getFolio.totals.balanceDueVnd`, read when the box opens and again after every 422; the sentences follow N.
 * - Bank transfer / VietQR: proof photo required (the owner's or a manager's bank notice – never one a sale or a CTV
 *   sent: 422 `attachmentId` NOT_IN_LIST), optional bank reference (V5-51). POS card only while N > 0 and up to N
 *   (prefilled with N): approval code only, no photo and no reference field (never a card number). The note is always
 *   required on Desk.
 * - `type` from `cancellation.cancelledFrom` (addendum 1j): `hold` → `deposit`, anything else → `charge`.
 * - The server creates the refund request max(0, amount − N) (`payment_after_cancel`, fixed destination) in the same
 *   transaction; the toast names the refund from the `openRefunds` increase, or says no refund was created.
 * - Always "Chờ đối soát". Any refusal writes nothing.
 */
export function AfterCancelDialog(props: DialogBase) {
  const { reservation: r } = props;
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const { property } = useSession();
  const tz = property?.timezone;
  const toast = useToast();
  const unsaved = useUnsavedLabels();
  const act = useSubmit({
    bound: [
      'method',
      'amountVnd',
      'receivedAt',
      'attachmentId',
      'bankReference',
      'posAuthCode',
      'note',
    ],
  });
  /** The folio read when the box opened – the base of the `openRefunds` increase. */
  const opened = useRef<Folio | null>(null);
  const [folio, setFolio] = useState<Folio | null>(null);
  const [readError, setReadError] = useState<unknown>(null);
  const [method, setMethod] = useState<AfterCancelMethod>('bank_transfer');
  const [amount, setAmount] = useState('');
  const [receivedAt, setReceivedAt] = useState(() => toLocalInput(new Date(), tz));
  const [receivedTouched, setReceivedTouched] = useState(false);
  const [proof, setProof] = useState<File | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [pos, setPos] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const folioId = r.folioId;
  const readFolio = async (): Promise<Folio | null> => {
    if (!folioId) return null;
    try {
      const f = (await api.getFolio({ propertyId, folioId })).data;
      setFolio(f);
      setReadError(null);
      opened.current ??= f;
      return f;
    } catch (e) {
      setReadError(e);
      return null;
    }
  };
  useEffect(() => {
    void readFolio();
    // once, when the box opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, folioId]);

  const due = dueOf(folio);
  const methods = afterCancelMethods(due);
  const card = method === 'card_pos';

  // Every 422: N again (another desk may have collected the fee meanwhile). A card left without N → transfer.
  useEffect(() => {
    if (!isApiError(act.error) || act.error.status !== 422) return;
    void readFolio().then((f) => {
      if (f && dueOf(f) <= 0) setMethod((m) => (m === 'card_pos' ? 'bank_transfer' : m));
    });
    // once per failed save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act.error]);

  const value = amountOf(amount);
  const receivedIso = receivedTouched ? fromLocalInput(receivedAt) : null;
  const receivedBad = receivedTouched && (!receivedIso || Date.parse(receivedIso) > Date.now());
  const noteShort = note.trim().length < 3;

  const fe = isApiError(act.error) ? act.error.fieldErrors : [];
  const has = (field: string, code: string) =>
    fe.some((x) => x.field.replace(/^body\./, '') === field && x.code === code);
  const serverMax =
    isApiError(act.error) && typeof act.error.problem.max === 'number'
      ? act.error.problem.max
      : due;
  const methodError = has('method', 'NOT_IN_LIST')
    ? due > 0
      ? t('field_error.after_cancel_method_due', { due: money(due) })
      : t('field_error.after_cancel_method')
    : act.fields.method;
  const amountError =
    touched && !(value > 0)
      ? t('field_error.amount_not_positive')
      : has('amountVnd', 'AMOUNT_EXCEEDS_BALANCE')
        ? t('field_error.after_cancel_card_max', { max: money(serverMax) })
        : act.fields.amountVnd;
  const proofError =
    (touched && !card && !proof) || has('attachmentId', 'REQUIRED')
      ? t('field_error.after_cancel_proof')
      : has('attachmentId', 'NOT_IN_LIST')
        ? t('field_error.after_cancel_proof_from_notice')
        : act.fields.attachmentId;
  const posError = touched && card && !pos.trim() ? t('common.required') : act.fields.posAuthCode;
  const noteError = touched && noteShort ? t('field_error.reason_required') : act.fields.note;
  const receivedError = receivedBad ? t('field.DATE_INVALID') : act.fields.receivedAt;

  const pick = (m: AfterCancelMethod) => {
    setMethod(m);
    act.reset();
    // ARC 105-03 ý 8: a card here only pays the fee still owed – prefilled with N (the desk may lower it).
    if (m === 'card_pos' && due > 0) setAmount(vnd(due));
  };

  const submit = async () => {
    setTouched(true);
    if (!folioId || !folio) return;
    if (!(value > 0) || noteShort || receivedBad) return;
    if (card ? !pos.trim() : !proof) return;
    const dueAtSubmit = due;
    const out = await act.submit(async (idem) => {
      const attachmentId =
        !card && proof
          ? (
              await api.uploadAttachment(
                { propertyId },
                proof,
                'deposit_receipt',
                deriveIdempotencyKey(idem, 'attachment'),
                r.id,
              )
            ).data.id
          : undefined;
      return api.recordPayment(
        { propertyId, folioId },
        {
          type: afterCancelType(r),
          method,
          amountVnd: value,
          receivedAt: receivedIso ?? undefined,
          note: note.trim(),
          posAuthCode: card ? pos.trim() : undefined,
          bankReference: card ? undefined : bankReferenceOf(bankRef),
          attachmentId,
        },
        idem,
      );
    });
    if (!out) return;
    let after: Folio | null = null;
    try {
      after = (await api.getFolio({ propertyId, folioId })).data;
    } catch {
      // the receipt is written – the sentence then uses the server rule on the N read last
    }
    const recorded = out.data.amountVnd;
    const refund = refundCreatedVnd(opened.current, after, recorded, dueAtSubmit);
    toast(
      refund > 0
        ? t('rsv.after_cancel.done', {
            amount: money(recorded),
            code: r.code,
            refund: money(refund),
          })
        : t('rsv.after_cancel.done_fee', { amount: money(recorded), code: r.code }),
    );
    props.onDone();
  };

  const dirty = !!amount.trim() || !!proof || !!bankRef.trim() || !!pos.trim() || !!note.trim();
  return (
    <Modal
      open
      size="sm"
      title={t('rsv.after_cancel.title', { code: r.code })}
      onClose={props.onClose}
      dirty={dirty}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={props.onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!folio}
            onClick={() => void submit()}
          >
            {act.label(t('rsv.after_cancel.submit'))}
          </Button>
        </>
      }
    >
      {readError && !folio ? (
        <Alert
          tone="bad"
          actions={
            <Button size="sm" onClick={() => void readFolio()}>
              {t('common.reload')}
            </Button>
          }
        >
          {problemView(t, readError).text}
        </Alert>
      ) : !folio ? (
        <LoadingBlock rows={2} />
      ) : (
        <>
          <Alert tone="warn">
            <div>
              {due > 0
                ? t('rsv.after_cancel.intro_due', { due: money(due) })
                : t('rsv.after_cancel.intro')}
            </div>
            <div>{t('rsv.after_cancel.rebook', { code: r.code })}</div>
            <div>{t('rsv.after_cancel.find_new')}</div>
          </Alert>
          <Field
            label={t('pay.method')}
            help={
              due > 0
                ? t('rsv.after_cancel.methods_hint_due', { due: money(due) })
                : t('rsv.after_cancel.methods_hint')
            }
            error={methodError}
          >
            {(p) => (
              <select
                {...p}
                className="input"
                value={method}
                onChange={(e) => pick(e.target.value as AfterCancelMethod)}
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {t(METHOD_KEY[m])}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <MoneyField
            label={t('rsv.amount_received')}
            value={amount}
            onChange={setAmount}
            error={amountError}
            required
          />
          <Field label={t('deposit.received_at')} error={receivedError}>
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                className="input num"
                max={toLocalInput(new Date(), tz)}
                value={receivedAt}
                onChange={(e) => {
                  setReceivedTouched(true);
                  setReceivedAt(e.target.value);
                }}
              />
            )}
          </Field>
          {card ? (
            <Field label={t('co.pos_code')} help={t('co.pos_no_card')} error={posError} required>
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
          ) : (
            <>
              <FilePicker
                label={t('rsv.after_cancel.proof')}
                help={t('rsv.after_cancel.proof_help')}
                file={proof}
                onChange={(f) => {
                  setProof(f);
                  // another photo is another upload – never the key of the one refused
                  act.renewKey();
                }}
                error={proofError}
                required
              />
              <BankReferenceField
                value={bankRef}
                onChange={setBankRef}
                error={act.fields.bankReference}
              />
            </>
          )}
          <Field label={t('stay.note')} required error={noteError}>
            {(p) => (
              <textarea
                {...p}
                className="input"
                rows={3}
                maxLength={500}
                placeholder={
                  card
                    ? t('rsv.after_cancel.note_hint_card')
                    : t('rsv.after_cancel.note_hint', { code: r.code })
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>
          <p className="li-s">
            <Chip tone="warn" icon="hourglass" className="recon">
              {t('pay.pending_reconcile')}
            </Chip>
            {card ? null : <> {t('rsv.reconcile_note')}</>}
          </p>
          {act.view()}
        </>
      )}
    </Modal>
  );
}
