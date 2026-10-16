import {
  isApiError,
  newIdempotencyKey,
  type GuestSummary,
  type Quote,
  type QuoteCalculation,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { timeHHmm, todayLocal } from '../../app/dates';
import { notifyChanged } from '../../app/live';
import { isRetryable, useWrite } from '../../app/useWrite';
import { addDays, dayMonth, rsvErrorText } from '../../app/reservations';
import { useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { GuestPicker } from '../../components/GuestPicker';
import { OccupancyField, type Occupancy } from '../../components/OccupancyField';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId, useSession } from '../../session/SessionProvider';

export interface QuotePrefill {
  roomId?: string;
  arrivalDate?: string;
  nights?: number;
  adults?: number;
  /** Reopen a saved quote at the "send" step. */
  quote?: Quote;
}

type Step = 'quote' | 'send' | 'hold';
const weekend = (date: string) => [5, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

/**
 * H12 quote → send → hold (US-080, 083, 084). All amounts come from the server (`calculateQuote`,
 * recalculated on every change – AC2); the commission shown is the caller's own (US-087), CTV never
 * gets "OTTIMO còn lại" (the API omits it). Text for the guest has no commission or contact data.
 */
export function QuoteDialog({
  prefill,
  onClose,
  onOpenReservation,
}: {
  prefill: QuotePrefill;
  onClose: () => void;
  onOpenReservation: (id: string) => void;
}) {
  const { t, vnd, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const rules = useRules(propertyId, roles);
  const catalog = useCatalog(propertyId);
  const toast = useToast();
  const { online } = useOnline();
  const ctv = roles.includes('collaborator') && roles.every((r) => r === 'collaborator');
  const today = todayLocal();

  const [step, setStep] = useState<Step>(prefill.quote ? 'send' : 'quote');
  const [saved, setSaved] = useState<Quote | null>(prefill.quote ?? null);
  const [roomId, setRoomId] = useState(prefill.roomId ?? prefill.quote?.roomId ?? '');
  const [arrival, setArrival] = useState(prefill.arrivalDate ?? addDays(today, 1));
  const [nights, setNights] = useState(prefill.nights ?? 2);
  const [occ, setOcc] = useState<Occupancy>({
    adults: prefill.adults ?? 2,
    children6to11: 0,
    childrenUnder6: 0,
  });
  const [returnCode, setReturnCode] = useState('');
  const [guest, setGuest] = useState<GuestSummary | null>(null);
  const [calc, setCalc] = useState<QuoteCalculation | null>(null);
  const [calcError, setCalcError] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [guestError, setGuestError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [text, setText] = useState('');
  const [holdHours, setHoldHours] = useState(rules.holdHoursDefault);
  const [held, setHeld] = useState<Reservation | null>(null);
  const keys = useRef({ save: newIdempotencyKey(), hold: newIdempotencyKey() });
  const mgr = roles.some((r) => r === 'owner' || r === 'manager');
  const [extendReason, setExtendReason] = useState('');
  const [extendError, setExtendError] = useState<string | undefined>();
  const extendKey = useRef(newIdempotencyKey());
  // DS 6.21: busy/concurrent answers are resent automatically with the same key (own keys above).
  const write = useWrite();
  const extend = async () => {
    if (!saved || busy) return;
    if (!mgr && extendReason.trim().length < 3) {
      setExtendError(t('field_error.reason_required'));
      return;
    }
    setBusy(true);
    setError(null);
    setExtendError(undefined);
    try {
      const key = extendKey.current;
      const res = await write.run(() =>
        api.extendQuote(
          { propertyId, quoteId: saved.id },
          mgr ? undefined : extendReason.trim(),
          key,
        ),
      );
      extendKey.current = newIdempotencyKey();
      if (res.status === 202) {
        // 202: approval request `quote_extension` sent to a manager.
        toast(t('sale.extend_requested', { code: saved.code }));
        onClose();
      } else {
        setSaved(res.data as Quote);
      }
    } catch (e) {
      if (!isRetryable(e)) setError(e);
    } finally {
      setBusy(false);
    }
  };

  const room = catalog.rooms.find((r) => r.id === roomId);
  const direct = catalog.channels.find((c) => c.channelGroup === 'direct' && c.isActive);
  const agent = catalog.channels.find((c) => c.channelGroup === 'agent' && c.isActive);
  const channel = ctv ? (agent ?? direct) : direct;
  const overCapacity = !!room && occ.adults + occ.children6to11 > (room.maxOccupancy ?? 99);

  useEffect(() => {
    if (!roomId && catalog.rooms[0]) setRoomId(catalog.rooms[0].id);
  }, [roomId, catalog.rooms]);

  const input = useDebounced(
    JSON.stringify({ roomId, arrival, nights, occ, returnCode, ch: channel?.id }),
    300,
  );
  useEffect(() => {
    if (step !== 'quote') return;
    const p = JSON.parse(input) as {
      roomId: string;
      arrival: string;
      nights: number;
      occ: Occupancy;
      returnCode: string;
      ch?: string;
    };
    if (!p.roomId || !p.ch || p.arrival < today || p.nights < 1 || overCapacity) {
      setCalc(null);
      return;
    }
    let stale = false;
    api
      .calculateQuote(
        { propertyId },
        {
          type: 'short',
          roomId: p.roomId,
          arrivalDate: p.arrival,
          nights: p.nights,
          adults: p.occ.adults,
          children6to11: p.occ.children6to11,
          childrenUnder6: p.occ.childrenUnder6,
          channelId: p.ch,
          returnGuestCode: p.returnCode.trim() || undefined,
        },
      )
      .then(
        (r) => {
          if (stale) return;
          setCalc(r.data);
          setCalcError(null);
        },
        (e: unknown) => {
          if (stale) return;
          setCalc(null);
          setCalcError(e);
        },
      );
    return () => {
      stale = true;
    };
    // overCapacity derives from input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, step, propertyId, today]);

  // Text for the guest, in the chosen language (US-083 AC2).
  useEffect(() => {
    if (step !== 'send' || !saved) return;
    let stale = false;
    api.getQuoteText({ propertyId, quoteId: saved.id }, lang).then(
      (r) => !stale && setText(r.data.text),
      (e: unknown) => !stale && setError(e),
    );
    return () => {
      stale = true;
    };
  }, [step, saved, lang, propertyId]);

  const save = async () => {
    if (!guest) {
      setGuestError(t('common.required'));
      return;
    }
    if (!calc || busy) return;
    setBusy(true);
    setError(null);
    try {
      const key = keys.current.save;
      const q = await write.run(() =>
        api.saveQuote(
          { propertyId },
          {
            type: 'short',
            roomId,
            arrivalDate: arrival,
            nights,
            adults: occ.adults,
            children6to11: occ.children6to11,
            childrenUnder6: occ.childrenUnder6,
            channelId: channel!.id,
            returnGuestCode: returnCode.trim() || undefined,
            guestId: guest.id,
          },
          key,
        ),
      );
      setSaved(q.data);
      setStep('send');
    } catch (e) {
      if (!isRetryable(e)) setError(e);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast(t('msgtpl.copied'));
    } catch {
      setError(new Error('clipboard'));
    }
  };

  const createHold = async () => {
    if (!saved || busy) return;
    setBusy(true);
    setError(null);
    try {
      const key = keys.current.hold;
      const r = await write.run(() =>
        api.createHoldFromQuote(
          { propertyId, quoteId: saved.id },
          { holdHours, depositMethod: 'vietqr' },
          key,
        ),
      );
      setHeld(r.data);
      notifyChanged();
    } catch (e) {
      if (!isRetryable(e)) setError(e);
    } finally {
      setBusy(false);
    }
  };

  const rates = calc?.nightlyRates ?? [];
  const groups = [false, true]
    .map((we) => {
      const list = rates.filter((r) => weekend(r.date) === we);
      return list.length
        ? {
            we,
            n: list.length,
            rate: list[0]!.amountVnd,
            sum: list.reduce((s, x) => s + x.amountVnd, 0),
          }
        : null;
    })
    .filter((g): g is NonNullable<typeof g> => !!g);
  // 0.3.5 A-14: amounts split by the server (no client subtraction).
  const extraFee = calc?.extraPersonFeeVnd ?? 0;
  const extra =
    calc?.extraGuestCount ??
    Math.max(0, occ.adults + occ.children6to11 - (room?.baseOccupancy ?? 2));
  const quoteArrival = saved?.arrivalDate ?? arrival;
  const holdUntil = (() => {
    const cap = Date.parse(`${quoteArrival}T${rules.holdLatestTime}:00+07:00`);
    const at = new Date(Math.min(Date.now() + holdHours * 3_600_000, cap));
    return `${timeHHmm(at)} ${dayMonth(todayLocal('Asia/Ho_Chi_Minh', at))}`;
  })();
  const arrivesToday = quoteArrival === today;

  const errView =
    write.notice ??
    (error ? (
      isApiError(error) && error.code === 'QUOTE_EXPIRED' ? (
        <Alert
          tone="warn"
          role="alert"
          actions={
            <Button
              size="sm"
              variant="pri"
              onClick={() => {
                setSaved(null);
                setError(null);
                keys.current = { save: newIdempotencyKey(), hold: newIdempotencyKey() };
                setStep('quote');
              }}
            >
              {t('sale.requote')}
            </Button>
          }
        >
          {t('error.QUOTE_EXPIRED')}
        </Alert>
      ) : (
        <Alert tone="bad">{rsvErrorText(t, error, { roomNo: room?.roomNo })}</Alert>
      )
    ) : null);

  const footer =
    step === 'quote' ? (
      <>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="pri"
          busy={busy}
          busyLabel={write.busyLabel}
          disabled={!online || !calc || overCapacity || calc.availability?.available === false}
          onClick={() => void save()}
        >
          {t('sale.save_quote')}
        </Button>
      </>
    ) : step === 'send' ? (
      <>
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button
          variant="pri"
          disabled={!online || saved?.status !== 'active'}
          onClick={() => setStep('hold')}
        >
          {t('sale.to_hold')}
        </Button>
      </>
    ) : held ? (
      <>
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button variant="pri" onClick={() => onOpenReservation(held.id)}>
          {t('bk.open_booking')}
        </Button>
      </>
    ) : (
      <>
        <Button onClick={() => setStep('send')}>{t('common.back')}</Button>
        <Button
          variant="pri"
          busy={busy}
          busyLabel={write.busyLabel}
          disabled={!online || arrivesToday || quoteArrival < today}
          onClick={() => void createHold()}
        >
          {quoteArrival < today ? t('sale.hold_locked_past') : t('sale.create_hold')}
        </Button>
      </>
    );

  return (
    <Modal
      open
      size="lg"
      title={
        step === 'quote' ? (
          t('sale.quote_title')
        ) : step === 'send' ? (
          <>
            {saved?.code}{' '}
            {saved?.status === 'active' ? <Chip tone="ok">{t('sale.quote_active')}</Chip> : null}
          </>
        ) : (
          t('sale.hold_title')
        )
      }
      closeLabel={t('common.close')}
      onClose={onClose}
      footer={footer}
    >
      {!online ? <Alert tone="warn">{t('sale.offline')}</Alert> : null}
      {errView}
      {step === 'quote' ? (
        <>
          <div className="g-3">
            <Field label={t('booking.field.room')} required>
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                >
                  {catalog.rooms
                    .filter((r) => r.isSellable !== false)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNo} · {r.name} ({r.baseOccupancy ?? '?'}/{r.maxOccupancy ?? '?'})
                      </option>
                    ))}
                </select>
              )}
            </Field>
            <Field
              label={t('sale.arrival')}
              required
              error={arrival < today ? t('booking.error.past_date') : undefined}
            >
              {(p) => (
                <input
                  {...p}
                  className="input"
                  type="date"
                  min={today}
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                />
              )}
            </Field>
            <Field
              label={t('sale.nights')}
              required
              help={`${dayMonth(arrival)} → ${dayMonth(addDays(arrival, nights))}`}
            >
              {(p) => (
                <input
                  {...p}
                  className="input"
                  type="number"
                  min={1}
                  max={90}
                  value={nights}
                  onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
                />
              )}
            </Field>
          </div>
          <OccupancyField
            value={occ}
            onChange={setOcc}
            compact
            room={
              room
                ? {
                    roomNo: room.roomNo,
                    baseOccupancy: room.baseOccupancy,
                    maxOccupancy: room.maxOccupancy,
                  }
                : undefined
            }
          />
          <div className="g-2">
            <GuestPicker
              label={t('booking.field.guest')}
              required
              error={guestError}
              onSelect={(g) => {
                setGuest(g);
                setGuestError(undefined);
              }}
            />
            {!ctv ? (
              <Field label={t('sale.return_code')}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    value={returnCode}
                    onChange={(e) => setReturnCode(e.target.value)}
                  />
                )}
              </Field>
            ) : null}
          </div>
          {calcError ? (
            <Alert tone="bad">{rsvErrorText(t, calcError, { roomNo: room?.roomNo })}</Alert>
          ) : null}
          {calc?.availability?.available === false ? (
            <Alert tone="bad" title={t('sale.conflict')}>
              {calc.availability.alternatives?.length
                ? t('booking.error.conflict_alt', {
                    rooms: calc.availability.alternatives.join(', '),
                  })
                : t('sale.none_title')}
            </Alert>
          ) : null}
          {calc?.longStayAlternative?.mandatory ? (
            <Alert tone="info" title={t('bk.long_title', { n: nights })}>
              {t('sale.month_note')}
            </Alert>
          ) : null}
          {calc ? (
            <div className="card p-12">
              <table className="sum">
                <tbody>
                  {groups.map((g) => (
                    <tr key={String(g.we)}>
                      <td>
                        {t(g.we ? 'sale.nights_weekend' : 'sale.nights_weekday', {
                          n: g.n,
                          rate: vnd(g.rate),
                        })}
                      </td>
                      <td className="r">{vnd(g.sum)}</td>
                    </tr>
                  ))}
                  {calc.losDiscountPct ? (
                    <tr className="sub">
                      <td>{t('sale.los_applied', { pct: calc.losDiscountPct })}</td>
                      <td className="r" />
                    </tr>
                  ) : null}
                  {extraFee > 0 ? (
                    <tr>
                      <td>{t('occ.fee_line', { n: extra, nights })}</td>
                      <td className="r">{vnd(extraFee)}</td>
                    </tr>
                  ) : null}
                  <tr className="total">
                    <td>{t('bk.total')}</td>
                    <td className="r">
                      {vnd(calc.totalVnd ?? 0)} {t('common.vnd_unit')}
                    </td>
                  </tr>
                  <tr className="sub">
                    <td>{t('sale.deposit_due', { pct: rules.depositPct })}</td>
                    <td className="r">{vnd(calc.depositVnd ?? 0)}</td>
                  </tr>
                </tbody>
              </table>
              {calc.commission?.amountVnd !== undefined ? (
                <>
                  <hr className="hr my-8" />
                  <table className="sum">
                    <tbody>
                      <tr>
                        <td>
                          {t(ctv ? 'sale.commission_ctv' : 'sale.commission', {
                            pct: calc.commission.ratePct ?? '',
                          })}
                        </td>
                        <td className="r">{vnd(calc.commission.amountVnd)}</td>
                      </tr>
                      {calc.ottimoRemainingVnd !== undefined ? (
                        <tr>
                          <td>{t('sale.ottimo_left')}</td>
                          <td className="r">{vnd(calc.ottimoRemainingVnd)}</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </>
              ) : null}
              {calc.longStayAlternative && !calc.longStayAlternative.mandatory ? (
                <div className="card p-12 mt-12">
                  <b>{t('sale.month_option')}</b>
                  <table className="sum">
                    <tbody>
                      <tr>
                        <td>{t('sale.short_total', { n: nights })}</td>
                        <td className="r">{vnd(calc.totalVnd ?? 0)}</td>
                      </tr>
                      <tr>
                        <td>{t('sale.month_total')}</td>
                        <td className="r">{vnd(calc.longStayAlternative.totalVnd ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="li-s">{t('sale.month_note')}</p>
                </div>
              ) : null}
              <p className="li-s mt-8">
                {t('sale.price_source', { days: rules.quoteValidityDays })}
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      {step === 'send' && saved?.status === 'expired' ? (
        // US-083 AC3 / 0.3.5 A-18: MGR/OWN extend now (200); sale/CTV ask a manager (202 + reason).
        <Alert tone="warn" role="alert" title={t('error.QUOTE_EXPIRED')}>
          {!mgr ? (
            <Field label={t('bk.reason_ph')} required error={extendError}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                />
              )}
            </Field>
          ) : null}
          <div className="conflict-list">
            <Button size="sm" variant="pri" busy={busy} onClick={() => void extend()}>
              {mgr ? t('drawer.action.extend') : t('sale.ask_extend')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSaved(null);
                setError(null);
                keys.current = { save: newIdempotencyKey(), hold: newIdempotencyKey() };
                setStep('quote');
              }}
            >
              {t('sale.requote')}
            </Button>
          </div>
        </Alert>
      ) : null}
      {step === 'send' && saved ? (
        <>
          <p className="li-s">{t('sale.quote_expires', { time: dateTime(saved.expiresAt) })}</p>
          <div className="field mt-12">
            <span className="lbl" id="q-lang">
              {t('sale.text_lang')}
            </span>
            <Seg
              labelledBy="q-lang"
              value={lang}
              onChange={setLang}
              options={[
                { value: 'vi', label: <span lang="vi">Tiếng Việt</span> },
                { value: 'en', label: <span lang="en">English</span> },
              ]}
            />
          </div>
          <pre className="quote-text" lang={lang} aria-live="polite">
            {text}
          </pre>
          <Button block icon="copy" disabled={!text} onClick={() => void copy()}>
            {t('sale.copy_zalo')}
          </Button>
        </>
      ) : null}

      {step === 'hold' && saved ? (
        held ? (
          <Alert
            tone="ok"
            title={t('sale.hold_created', { room: room?.roomNo ?? '', code: held.code })}
          >
            {t('sale.hold_next', { hours: rules.holdWarnHours })}
            <div className="price-big mt-8">
              {vnd(held.depositRequiredVnd ?? saved.depositVnd ?? 0)} {t('common.vnd_unit')}
            </div>
            <div className="li-s">{t('pay.qr_note', { ref: held.code.replace(/-/g, '') })}</div>
          </Alert>
        ) : (
          <>
            {arrivesToday ? (
              <Alert tone="info" role="alert" title={t('error.HOLD_NOT_ALLOWED_TODAY')}>
                {t('sale.today_handoff')}
              </Alert>
            ) : null}
            <div className="field">
              <span className="lbl" id="h-hrs">
                {t('sale.hold_for')}
              </span>
              <Seg
                labelledBy="h-hrs"
                value={String(holdHours)}
                onChange={(v) => setHoldHours(Number(v))}
                options={rules.holdHoursOptions.map((h) => ({ value: String(h), label: `${h} h` }))}
              />
              <span className="help">{t('sale.hold_until', { time: holdUntil })}</span>
            </div>
            <div className="card p-12 mb-12">
              <div className="li-s">{t('sale.deposit_due_short')}</div>
              <div className="price-big">
                {vnd(saved.depositVnd ?? 0)} {t('common.vnd_unit')}
              </div>
              <div className="li-s">{t('sale.qr_after')}</div>
            </div>
          </>
        )
      ) : null}
    </Modal>
  );
}
