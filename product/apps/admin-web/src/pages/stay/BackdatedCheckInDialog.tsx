import { isApiError, type Reservation } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal } from '@ottimo/ui';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { useBusinessDay } from '../../app/businessDay';
import { backdateArrivalError, backdateBounds } from '../../app/goLive';
import { currentSegment } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { useSubmit } from './common';

const COND_KEY: Record<string, string> = {
  room_occupied: 'checkin.cond.room_occupied',
  document_check_block: 'checkin.cond.document_ok',
  balance_paid: 'checkin.cond.balance_paid',
};

/**
 * FB-INV-012 §12.1.2 (A127, FE-2) – "Backdated check-in" of a confirmed manual long stay whose guest is already in
 * the room: real arrival date (default the booking's), reason, key cards, and the document override only once the
 * server says the document condition is unmet. No time, surcharge, B9a or payment (the server refuses them). Opened
 * only when `allowedActions` has `check_in_backdated`. Done → the next steps: the check-in meter reading (S12, late
 * with a reason) and the arrival-month statement (S16).
 */
export function BackdatedCheckInDialog({
  reservation: r,
  onClose,
  onDone,
}: {
  reservation: Reservation;
  onClose: () => void;
  onDone: (updated: Reservation) => void;
}) {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const { deviceTrusted } = useSession();
  const toast = useToast();
  const today = useBusinessDay();
  const { earliest, latest } = backdateBounds(today);
  const roomNo =
    currentSegment(r.segments ?? [], r.arrivalDate)?.roomNo ?? r.segments?.[0]?.roomNo ?? '';
  const [arrival, setArrival] = useState(r.arrivalDate);
  // BE #197 deviation 3: the arrival can move only on a single-segment booking (else 422 arrivalDate NOT_ALLOWED).
  const arrivalFixed = (r.segments?.length ?? 1) > 1;
  const [reason, setReason] = useState('');
  const [cards, setCards] = useState('1');
  const [docReason, setDocReason] = useState('');
  const [needDoc, setNeedDoc] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Reservation | null>(null);
  const act = useSubmit({
    bound: ['arrivalDate', 'reason', 'cardsIssued', 'documentBlockOverride.reason'],
  });

  const save = async () => {
    const e: Record<string, string> = {};
    if (!arrival || arrival < earliest || arrival > latest)
      e.arrivalDate = t('bd.date_range', { from: date(earliest), to: date(latest) });
    if (reason.trim().length < 3) e.reason = t('stmt.reason_required');
    const n = Number(cards);
    // OpenAPI 0.3.15 `CheckInBackdatedInput.cardsIssued`: required, 0–2.
    if (cards.trim() === '' || !Number.isInteger(n) || n < 0 || n > 2)
      e.cardsIssued = t('bd.cards_range');
    if (needDoc && docReason.trim().length < 3) e.doc = t('stmt.reason_required');
    setErrors(e);
    if (Object.keys(e).length) return;
    const out = await act.submit((idem) =>
      api.checkInBackdated(
        { propertyId, reservationId: r.id },
        {
          arrivalDate: arrival,
          reason: reason.trim(),
          cardsIssued: n,
          ...(needDoc ? { documentBlockOverride: { reason: docReason.trim() } } : {}),
        },
        r.version,
        idem,
      ),
    );
    if (out) {
      toast(t('bd.done', { room: roomNo }));
      setDone(out.data);
    } else act.renewKey();
  };

  // 409 CHECKIN_CONDITIONS_NOT_MET: the document condition opens its override field; other conditions are said.
  const unmet =
    isApiError(act.error) && act.error.code === 'CHECKIN_CONDITIONS_NOT_MET'
      ? ((act.error.problem as { unmet?: string[] }).unmet ?? [])
      : [];
  const docUnmet = unmet.includes('document_check_block');
  useEffect(() => {
    if (docUnmet) setNeedDoc(true);
  }, [docUnmet]);
  const unmetText = unmet.length
    ? t('error.CHECKIN_CONDITIONS_NOT_MET', {
        unmet: unmet.map((c) => (COND_KEY[c] ? t(COND_KEY[c]!) : c)).join('; '),
      })
    : null;
  const fe = (k: string) => errors[k] ?? act.fields[k];

  if (done)
    return (
      <Modal
        open
        title={t('bd.done', { room: roomNo })}
        closeLabel={t('common.close')}
        onClose={() => onDone(done)}
        footer={
          <Button variant="pri" onClick={() => onDone(done)}>
            {t('common.close')}
          </Button>
        }
      >
        <div className="stack">
          <p>{t('bd.next_help')}</p>
          <div className="row wrap">
            <Link className="btn" to="/long-stay/meters">
              {t('bd.next_meter')}
            </Link>
            <Link className="btn" to="/long-stay/statements">
              {t('bd.next_statement')}
            </Link>
          </div>
        </div>
      </Modal>
    );

  return (
    <Modal
      open
      title={t('bd.checkin_title', { room: roomNo })}
      closeLabel={t('common.close')}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            disabled={!deviceTrusted}
            busy={act.busy}
            busyLabel={act.busyLabel}
            onClick={() => void save()}
          >
            {act.label(t('bd.checkin_action'))}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="li-s">{t('bd.checkin_body')}</p>
        {!deviceTrusted ? <Alert tone="warn">{t('bd.need_device')}</Alert> : null}
        {unmetText ? <Alert tone="bad">{unmetText}</Alert> : act.view()}
        <Field
          label={t('bd.arrival_real')}
          required
          error={
            isApiError(act.error) &&
            act.error.fieldErrors.some(
              (f) => f.field.replace(/^body\./, '') === 'arrivalDate' && f.code === 'NOT_ALLOWED',
            )
              ? t('bd.arrival_fixed')
              : (backdateArrivalError(t, date, act.error) ?? fe('arrivalDate'))
          }
          help={
            arrivalFixed
              ? t('bd.arrival_fixed')
              : arrival && arrival !== r.arrivalDate
                ? t('bd.arrival_moves', { from: date(r.arrivalDate), to: date(arrival) })
                : t('bd.first_of_month')
          }
        >
          {(p) => (
            <input
              {...p}
              className="input"
              type="date"
              min={earliest}
              max={latest}
              disabled={arrivalFixed}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('bd.reason')} required error={fe('reason')} help={t('bd.reason_help')}>
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('bd.cards')} required error={fe('cardsIssued')}>
          {(p) => (
            <input
              {...p}
              className="input num"
              inputMode="numeric"
              value={cards}
              onChange={(e) => setCards(e.target.value)}
            />
          )}
        </Field>
        {needDoc ? (
          <Field
            label={t('bd.doc_override')}
            required
            error={errors.doc ?? act.fields['documentBlockOverride.reason']}
            help={t('bd.doc_override_help')}
          >
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={300}
                value={docReason}
                onChange={(e) => setDocReason(e.target.value)}
              />
            )}
          </Field>
        ) : null}
      </div>
    </Modal>
  );
}
