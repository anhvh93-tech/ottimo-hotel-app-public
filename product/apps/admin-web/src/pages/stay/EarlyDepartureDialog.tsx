import {
  deriveIdempotencyKey,
  isApiError,
  newIdempotencyKey,
  type EarlyDepartureBody,
  type EarlyDepartureResult,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, Chip, Field, Modal } from '@ottimo/ui';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../app/api';
import { useBusinessDay } from '../../app/businessDay';
import { useCatalog } from '../../app/catalog';
import {
  DEFAULT_ROLLOVER,
  daysBetween,
  inEarlyHours,
  minCalendarDay,
  msUntilNextRollover,
  timeHHmm,
  todayLocal,
} from '../../app/dates';
import { isVndStep, parseVnd } from '../../app/money';
import { fieldErrors } from '../../app/problem';
import { addDays, channelName, currentSegment, dayMonth } from '../../app/reservations';
import { LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { isVisible, navItemByPath } from '../../session/nav';
import { FilePicker, MoneyField, useSubmit, useUnsavedLabels } from './common';
import type { StayDialogProps } from './StayDialogs';

type Phase = 'input' | 'preview' | 'done';
type Draft = Omit<EarlyDepartureBody, 'dryRun' | 'expectedRefundVnd' | 'expectedFeeVnd'>;
type T = ReturnType<typeof useI18n>['t'];
/** Fields with an input in step 1 – a 422 on them is said under the input (UXD v1.0.1 §2.7). */
const BOUND = ['newDepartureDate', 'noticeGivenAt', 'otaRetainedVnd', 'noticeEvidence'];
const TZ = 'Asia/Ho_Chi_Minh';
/** UXD v1.0.1 §2.4: the preview runs again 400 ms after the last change. */
export const PREVIEW_DEBOUNCE_MS = 400;
const nowLocal = () => {
  const d = new Date();
  return { date: todayLocal(TZ, d), time: timeHHmm(d, TZ) };
};
const fieldOf = (f: string) => {
  const k = f.replace(/^body\./, '');
  return BOUND.find((b) => k === b || k.startsWith(`${b}.`));
};

/**
 * V5-11 (OpenAPI 0.3.13 bổ sung 1 `earlyDeparture`, `Problem.minNewDepartureDate` / `useCheckout`; DOM rules-v1.0.5
 * 2.1 (2)–(3)): what a 409 `INVALID_TRANSITION` of B16 between 00:00 and the rollover tells the desk to do instead –
 * pick a date from `minNewDepartureDate`, or use Trả phòng (`useCheckout`). Any other 409 → `null` (as before).
 */
export function nightHint(e: unknown): { useCheckout: true } | { minDate: string } | null {
  if (!isApiError(e) || e.code !== 'INVALID_TRANSITION') return null;
  if (e.problem.useCheckout === true) return { useCheckout: true };
  const min = e.problem.minNewDepartureDate;
  return typeof min === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(min) ? { minDate: min } : null;
}

/**
 * The lease end of a manual long stay: OpenAPI 0.3.12 `Reservation.manualLongStay.leaseEndDate` (LocalDate, read
 * only – P4-00 (b)); absent (server before v1.0.4) → `departureDate`.
 * TODO(P4-31 phase B): read the generated type once api-client carries 0.3.12 and drop the cast.
 */
export function leaseEndOf(r: Reservation): string {
  const mls = r.manualLongStay as { leaseEndDate?: string | null } | undefined;
  return mls?.leaseEndDate ?? r.departureDate;
}

/**
 * H15 15.7 Trả sớm (B16, US-137, US-135 – OpenAPI 0.3.9; UXD `v1.0.1-early-departure-and-prices.md` §2). One Modal lg,
 * three steps: ① date + notice time (the preview `dryRun=true` runs by itself, debounced; the OTA amount / proof
 * boxes appear when the server asks), ② preview (server figures only, "told the guest" tick before the danger
 * button), ③ result. The write sends the SAME body + `expectedRefundVnd`/`expectedFeeVnd` of the last preview,
 * If-Match = its `reservation.version`, a new Idempotency-Key. There is no write without a preview: a server that
 * cannot preview (422 dryRun NOT_ALLOWED) leaves the box locked.
 */
export function EarlyDepartureDialog({
  reservation: r,
  onClose,
  onDone,
  onReload,
}: StayDialogProps & { onReload?: () => unknown }) {
  const { t, money, date } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const catalog = useCatalog(propertyId);
  const { roles, screens, deviceTrusted, property } = useSession();
  const navigate = useNavigate();
  const ids = useId();
  const R = { propertyId, reservationId: r.id };
  const guest = r.booker?.displayName ?? '';
  // BR-010 / UXD G1–G2: min = max(floor, arrival + 1), max = departure − 1.
  const today = useBusinessDay();
  const roomNo = currentSegment(r.segments, today)?.roomNo ?? '';
  const channel = channelName(catalog.channels, r.channelCode, r.channelId);
  // V5-11 (0.3.13 bổ sung 1; DOM rules-v1.0.5 2.1 (2)–(3); UXD copy-v1.0.5 9.13): the floor is the business day, but
  // from 00:00 to the rollover ("W") the CALENDAR day – the night of the business day is already slept and B16 never
  // drops it. The Desk fills in its estimate (`minCalendarDay`); a 409 `minNewDepartureDate` of the server replaces
  // it (`serverMin`) for the help line and the client check. 409 `useCheckout`: B16 does not apply, Trả phòng does.
  const rollover = property?.businessDayRollover ?? DEFAULT_ROLLOVER;
  const [serverMin, setServerMin] = useState<string | null>(null);
  const [serverCheckout, setServerCheckout] = useState(false);
  // FB-R5-UXD-FE-142-01 (like R3-Q36 at the rollover): a dialog left open re-renders at the next 00:00, so the night
  // floor below applies at once – not at the next click. A rollover with "00:00" = the calendar midnight.
  const [midnight, setMidnight] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setMidnight((x) => x + 1), msUntilNextRollover(TZ, '00:00') + 250);
    return () => clearTimeout(id);
  }, [midnight]);
  // ARC review #142 §3: floor = max(business day, calendar day), the server's `minCalendarDate`.
  const estimate = minCalendarDay(today, TZ, new Date());
  /** W: before the rollover AND business day < calendar day (UXD 9.13, DOM-142-01; server `inEarlyHours`). */
  const night = inEarlyHours(today, TZ, new Date(), rollover);
  // …and on the next focus too (a timer late after sleep): a field the desk enters re-reads the clock.
  useEffect(() => {
    const recheck = () => {
      const now = new Date();
      if (
        minCalendarDay(today, TZ, now) !== estimate ||
        inEarlyHours(today, TZ, now, rollover) !== night
      )
        setMidnight((x) => x + 1);
    };
    document.addEventListener('focusin', recheck);
    return () => document.removeEventListener('focusin', recheck);
  }, [today, rollover, estimate, night]);
  const floor = serverMin ?? estimate;
  const minDate = floor > r.arrivalDate ? floor : addDays(r.arrivalDate, 1);
  /** Order of UXD 9.13 for a 409 `INVALID_TRANSITION` (preview and write): useCheckout → minNewDepartureDate → generic. */
  const applyHint = (e: unknown) => {
    const h = nightHint(e);
    if (!h) return false;
    if ('useCheckout' in h) setServerCheckout(true);
    else setServerMin(h.minDate);
    return true;
  };
  // 0.3.9 bổ sung 1 (FB-R3-UXD-FE-A-06): the whole stay, child extensions included (BR-422); absent = old server.
  const stayEnd = r.stayDepartureDate ?? r.departureDate;
  // BUG-R4-014 (ORC phương án b): a monthly lease keeps B16 to end the stay on the Desk, but BR-428 (refund / fee /
  // notice) is not its rule – BR-313 v0.5.1 is (ESC-045 câu 4): the guest forfeits the whole deposit, no clawback.
  // FB-R4-DOM-FE-A-01: only a date BEFORE the lease end breaks the lease; on or after it the nights left are
  // extension nights and the normal BR-428 path applies – no BR-313 line. The lease end is the primary's
  // v1.0.4 P4-31 (ARC tech plan v1.0.3 4, plan-v1.0.4 6.1): the lease end is `manualLongStay.leaseEndDate`, which a
  // B13 extension does not move (the server's B13 on a manual lease moves `departureDate`). Older server: the
  // primary's `departureDate` ("Ngày ra (theo HĐ)") as before.
  const leaseEnd = leaseEndOf(r);
  const breaksLease = (leaving: string) => r.stayType === 'long' && leaving < leaseEnd;
  const maxDate = addDays(stayEnd, -1);
  // UXD 9.13: in W a stay leaving on (or before) the calendar day has no date to choose – Trả phòng, said without a
  // B16 call (instead of `none_possible`); the server says the same with 409 `useCheckout`.
  const useCheckout = serverCheckout || (night && stayEnd <= estimate);
  const checkoutShown = useRef(false);
  useEffect(() => {
    if (!useCheckout || checkoutShown.current) return;
    checkoutShown.current = true;
    // The booking is re-read (not B16): the drawer behind and the "Trả phòng ngay" button follow `allowedActions`.
    onReload?.();
  }, [useCheckout, onReload]);
  const [opened] = useState(nowLocal);
  const [newDate, setNewDate] = useState(minDate);
  const dateRef = useRef<HTMLInputElement>(null);
  const lease = breaksLease(newDate);
  const [noticeDate, setNoticeDate] = useState(opened.date);
  const [noticeTime, setNoticeTime] = useState(opened.time);
  const [otaText, setOtaText] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<{ file: File; id?: string; error?: string } | null>(null);
  const [told, setTold] = useState(false);
  const [phase, setPhase] = useState<Phase>('input');
  const [versionAlert, setVersionAlert] = useState(false);
  /** Amounts the desk had confirmed when the server answered 409 AMOUNT_CHANGED (chips "Vừa đổi"). */
  const [was, setWas] = useState<{ refund: number; fee: number } | null>(null);
  const [fatal, setFatal] = useState(false);
  const [result, setResult] = useState<EarlyDepartureResult | null>(null);
  const act = useSubmit({ bound: BOUND });
  const questionRef = useRef<HTMLHeadingElement>(null);
  const changedRef = useRef<HTMLDivElement>(null);

  // ---- step 1: inputs, client checks (no call while a box is wrong) ----
  const noticeLocal = noticeDate && noticeTime ? `${noticeDate}T${noticeTime}` : '';
  const backdated = !!noticeLocal && noticeLocal < `${opened.date}T${opened.time}`;
  const [asked, setAsked] = useState<{ evidence: boolean; otaMax?: number }>({ evidence: false });
  const evidenceShown = asked.evidence || backdated;
  const otaShown = asked.otaMax !== undefined;
  const otaValue = parseVnd(otaText);
  const range = { min: date(minDate), max: date(maxDate) };
  const clientErrors: Record<string, string> = {};
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(newDate);
  // UXD 9.13 + FB-R5-UXD-FE-142-01: below the night floor – the server's, or the Desk's own in W (a dialog opened
  // before 00:00 and used after it) – the 9.13 sentence with "Dùng {date}" under it, not the generic range. Only when
  // that floor is what sets the minimum (not arrival + 1); out of W and past the last date: the range as before.
  const nightFloor = serverMin ?? (night ? estimate : null);
  const belowNightFloor =
    validDate && !!nightFloor && minDate === nightFloor && newDate < nightFloor;
  if (belowNightFloor)
    clientErrors.newDepartureDate = t('early_departure.err.min_date', { date: date(minDate) });
  else if (!validDate || newDate < minDate || newDate > maxDate)
    clientErrors.newDepartureDate = t('early_departure.err.date_range', range);
  if (!noticeLocal) clientErrors.noticeGivenAt = t('common.required');
  else {
    const n = nowLocal();
    if (noticeLocal > `${n.date}T${n.time}`)
      clientErrors.noticeGivenAt = t('early_departure.err.notice_future');
  }
  if (otaShown && otaText.trim()) {
    if (otaValue === null || !isVndStep(otaValue))
      clientErrors.otaRetainedVnd = t('field_error.multiple_of_1000');
    else if (otaValue > asked.otaMax!)
      clientErrors.otaRetainedVnd = t('early_departure.err.ota_over_max', {
        max: money(asked.otaMax!),
      });
  }
  const evidence =
    evidenceShown && note.trim().length >= 3
      ? { note: note.trim(), ...(photo?.id ? { attachmentId: photo.id } : {}) }
      : undefined;
  const draft: Draft = {
    newDepartureDate: newDate,
    noticeGivenAt: noticeLocal ? `${noticeLocal}:00+07:00` : '',
    ...(otaShown && otaText.trim() && otaValue !== null ? { otaRetainedVnd: otaValue } : {}),
    ...(evidence ? { noticeEvidence: evidence } : {}),
  };
  const photoBusy = !!photo && !photo.id && !photo.error;
  const sig =
    useCheckout || Object.keys(clientErrors).length || photoBusy ? '' : JSON.stringify(draft);
  const debounced = useDebounced(sig, PREVIEW_DEBOUNCE_MS);

  // ---- the preview (dryRun) ----
  const [tick, setTick] = useState(0);
  const [preview, setPreview] = useState<{
    sig: string;
    tick: number;
    data?: EarlyDepartureResult;
    error?: unknown;
  } | null>(null);
  useEffect(() => {
    if (!debounced || debounced !== sig) return;
    let stale = false;
    const at = tick;
    // ARC 10.3: an older preview is cancelled, not only ignored.
    const ctl = new AbortController();
    api
      .earlyDeparture(
        R,
        { ...(JSON.parse(debounced) as Draft), dryRun: true },
        undefined,
        undefined,
        ctl.signal,
      )
      .then(
        (x) => {
          if (stale) return;
          setPreview({ sig: debounced, tick: at, data: x.data });
          setAsked((a) => ({
            // Once shown, the proof box stays (the contract keeps `evidenceRequired` true with proof sent).
            evidence: a.evidence || x.data.evidenceRequired === true,
            otaMax: x.data.otaRetainedMaxVnd,
          }));
        },
        (error: unknown) => {
          if (stale) return;
          setPreview({ sig: debounced, tick: at, error });
          // V5-11: 409 with `minNewDepartureDate` / `useCheckout` – nothing was computed, follow the server.
          applyHint(error);
        },
      );
    return () => {
      stale = true;
      ctl.abort();
    };
    // `R` is rebuilt each render from the same ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, sig, tick, propertyId, r.id]);
  const current = preview && preview.sig === sig && preview.tick === tick ? preview : null;
  // FB-R3-UXD-FE-A-12 (DS 4): the skeleton only after 300 ms of waiting; the status text shows at once.
  const waitKey = sig && !current ? `${sig}|${tick}` : '';
  const [slowFor, setSlowFor] = useState('');
  useEffect(() => {
    if (!waitKey) return;
    const timer = setTimeout(() => setSlowFor(waitKey), 300);
    return () => clearTimeout(timer);
  }, [waitKey]);
  const slow = !!waitKey && slowFor === waitKey;
  const p = current?.data;
  const previewError = current?.error;
  const isApi = isApiError(previewError);
  const failed =
    previewError !== undefined && (!isApi || previewError.isNetwork || previewError.status >= 500);
  // A server before BE-A (422 dryRun NOT_ALLOWED) or an answer without the 0.3.9 fields: never guess the money.
  const unavailable =
    (isApi &&
      previewError.fieldErrors.some((fe) => fe.field.replace(/^body\./, '') === 'dryRun')) ||
    (!!p && p.droppedNights === undefined);
  const serverFieldErrors =
    isApi && !unavailable ? fieldText(t, previewError, money, asked.otaMax, range) : {};
  const otherPreviewError =
    previewError !== undefined &&
    !failed &&
    !unavailable &&
    !nightHint(previewError) &&
    !(isApi && previewError.fieldErrors.some((fe) => fieldOf(fe.field)));
  const writeFieldErrors = isApiError(act.error)
    ? fieldText(t, act.error, money, asked.otaMax, range)
    : {};
  const errors = { ...serverFieldErrors, ...writeFieldErrors, ...clientErrors };
  const evidenceRequired = p?.evidenceRequired === true;
  const needsOta = p?.otaRetainedRequired === true;
  const needsEvidence = evidenceRequired && note.trim().length < 3;
  const ready = !!p && !unavailable && !needsOta && !needsEvidence;
  const toPreviewWhy = ready
    ? null
    : needsOta || needsEvidence
      ? t('early_departure.to_preview_needs')
      : t('early_departure.to_preview_wait');

  // Focus the step heading, or the 409 alert, when they appear (UXD §2.11).
  useEffect(() => {
    if (phase === 'preview') (was ? changedRef.current : questionRef.current)?.focus();
  }, [phase, was]);
  // V5-11 (UXD 9.13): the "use Trả phòng" alert takes the focus (it comes after a click); a 409 on the write puts the
  // focus on the date box, where its sentence is.
  const checkoutRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (useCheckout) checkoutRef.current?.focus();
  }, [useCheckout]);
  const [focusDate, setFocusDate] = useState(0);
  useEffect(() => {
    if (focusDate && phase === 'input') dateRef.current?.focus();
  }, [focusDate, phase]);
  // The new preview after a 409 asks for missing data again → back to step 1.
  useEffect(() => {
    if (phase === 'preview' && p && (needsOta || needsEvidence)) setPhase('input');
  }, [phase, p, needsOta, needsEvidence]);
  // FB-R5-UXD-FE-142-01: step 2 never waits for a preview that cannot run. A box turned wrong while it is open (00:00
  // passed: the chosen date is now below the night floor) → back to step 1 like a 409 on the write, focus on the date.
  const clientErrorKey = Object.keys(clientErrors).join();
  useEffect(() => {
    if (phase !== 'preview' || !clientErrorKey) return;
    setWas(null);
    setTold(false);
    setPhase('input');
    setFocusDate((n) => n + 1);
  }, [phase, clientErrorKey]);

  const choosePhoto = async (file: File | null) => {
    if (!file) {
      setPhoto(null);
      return;
    }
    setPhoto({ file });
    // One key per chosen photo (upload before the preview / write – derived like the other evidence uploads).
    const photoKey = newIdempotencyKey();
    try {
      const up = await api.uploadAttachment(
        { propertyId },
        file,
        'penalty_evidence',
        deriveIdempotencyKey(photoKey, 'attachment'),
        r.id,
      );
      setPhoto({ file, id: up.data.id });
    } catch (e) {
      setPhoto({ file, error: act.text(e) });
    }
  };

  // ---- step 2 → write ----
  const save = async () => {
    // ARC 10.3: the expected amounts come only from the preview of exactly this input.
    if (!p || !ready || !told || act.busy || current?.sig !== JSON.stringify(draft)) return;
    const caught: { error?: unknown } = {};
    const out = await act.submit((idem) =>
      api
        .earlyDeparture(
          R,
          {
            ...draft,
            expectedRefundVnd: p.refundVnd ?? 0,
            expectedFeeVnd: p.earlyDepartureFeeVnd,
            dryRun: false,
          },
          p.reservation.version,
          idem,
        )
        .catch((e: unknown) => {
          caught.error = e;
          throw e;
        }),
    );
    if (out) {
      setResult(out.data);
      setPhase('done');
      return;
    }
    const e = caught.error;
    // Network / 5xx: "Thử lại" resends with the SAME key (a replay returns the first result).
    if (!isApiError(e) || e.isNetwork || e.status >= 500) return;
    // Any other answer means nothing was written: the next send is a new command.
    act.renewKey();
    if (e.code === 'AMOUNT_CHANGED') {
      act.reset();
      setWas({ refund: p.refundVnd ?? 0, fee: p.earlyDepartureFeeVnd });
      setTold(false);
      setTick((n) => n + 1);
    } else if (e.code === 'VERSION_CONFLICT') {
      act.reset();
      setWas(null);
      setTold(false);
      setVersionAlert(true);
      setPhase('input');
      onReload?.();
      setTick((n) => n + 1);
    } else if (e.code === 'VALIDATION_FAILED') {
      setTold(false);
      setPhase('input');
    } else if (nightHint(e)) {
      // V5-11 (UXD 9.13): 00:00 passed between the preview and the click – nothing written. Like 412: back to step 1,
      // the server's floor said under the date (focus on it), or the pointer to Trả phòng.
      act.reset();
      setWas(null);
      setTold(false);
      setPhase('input');
      applyHint(e);
      setFocusDate((n) => n + 1);
    } else setFatal(true);
  };
  const commitFailed =
    act.error !== null &&
    (!isApiError(act.error) || act.error.isNetwork || act.error.status >= 500);

  const at = phase === 'input' ? 0 : phase === 'preview' ? 1 : 2;
  const steps = (
    <ol className="progress-steps" aria-label={t('early_departure.steps_label')}>
      {(['step_input', 'step_preview', 'step_result'] as const).map((k, i) => (
        <li
          key={k}
          className={i < at ? 'done' : undefined}
          aria-current={i === at ? 'step' : undefined}
        >
          {t(`early_departure.${k}`)}
        </li>
      ))}
    </ol>
  );

  // ---- step 3: result ----
  if (phase === 'done' && result) {
    const access = { roles, screens, deviceTrusted };
    const refunds = navItemByPath('/audit');
    const registration = navItemByPath('/registration');
    const leaving = result.reservation.departureDate;
    // V5-11 (UXD 9.13): the server alone says whether Trả phòng is open now. Comparing `leaving` with the business
    // day hid "Trả phòng ngay" (and said `later_hint`) from 00:00 to the rollover, when B16 leaves on the calendar
    // day and B18 is already open (V5-10). B18 opens on the departure day only, so a later date has no `check_out`.
    const canCheckOut = (result.reservation.allowedActions ?? []).some(
      (a) => a.event === 'check_out',
    );
    const nights = result.droppedNights ?? [];
    const leaseDone = breaksLease(leaving);
    const leaseOnly = leaseDone && !hasMoney(result);
    const finish = () => onDone(result.reservation);
    return (
      <Modal
        open
        size="lg"
        title={t('early_departure.title', { room: roomNo, guest })}
        onClose={finish}
        closeLabel={t('common.close')}
        footer={
          canCheckOut ? (
            <>
              <Button onClick={finish}>{t('common.close')}</Button>
              <Button variant="pri" onClick={() => navigate(`/reservations/${r.id}/check-out`)}>
                {t('early_departure.checkout_now')}
              </Button>
            </>
          ) : (
            <Button variant="pri" onClick={finish}>
              {t('common.close')}
            </Button>
          )
        }
      >
        {steps}
        <Alert
          tone="ok"
          role="status"
          title={t('early_departure.done_title', { date: date(leaving) })}
        >
          <ul className="list-plain">
            <li>
              {t('early_departure.done_nights', {
                n: nights.length,
                dates: nights.map((x) => dayMonth(x.date)).join(', '),
              })}
            </li>
            {result.earlyDepartureFeeVnd > 0 ? (
              <li>
                {t('early_departure.done_fee', { amount: money(result.earlyDepartureFeeVnd) })}
                {/* UXD 9.13: the fee line carries the business day (BR-010) – read again now (05:59 → 06:00). */}
                {night ? ` ${t('early_departure.fee_business_date', { date: date(today) })}` : null}
              </li>
            ) : null}
            {result.refundRequestId ? (
              <li>
                {t('early_departure.done_refund', { amount: money(result.refundVnd ?? 0) })}{' '}
                <Chip tone="warn" icon="hourglass">
                  {t('approval.status.pending')}
                </Chip>{' '}
                {refunds && isVisible(refunds, access) ? (
                  <Link to="/audit?tab=refund">{t('early_departure.view_refund')}</Link>
                ) : null}
              </li>
            ) : leaseOnly ? null : (
              <li>{t('early_departure.no_refund')}</li>
            )}
            {(result.childBookings ?? [])
              .filter((c) => c.cancelled)
              .map((c) => (
                <li key={c.reservationId}>
                  {t('early_departure.done_child_cancelled', { code: c.code })}
                </li>
              ))}
          </ul>
        </Alert>
        {result.registrationNeedsUpdate ? (
          // HR-09: a legal reminder stays on screen – never a toast.
          <Alert
            tone="warn"
            role="note"
            actions={
              registration && isVisible(registration, access) ? (
                <Link to="/registration?view=needs_update">{t('early_departure.reg_open')}</Link>
              ) : undefined
            }
          >
            {t('early_departure.reg_reminder', { date: date(leaving) })}
          </Alert>
        ) : null}
        {leaseDone ? <LeaseRule reservation={r} step="result" /> : null}
        {leaseOnly ? null : (
          <details>
            <summary>{t('early_departure.show_calc')}</summary>
            <Figures p={result} otaRetained={draft.otaRetainedVnd} />
          </details>
        )}
        <p className="li-s">
          {canCheckOut
            ? t('early_departure.checkout_now_hint')
            : t('early_departure.later_hint', { date: date(leaving) })}
        </p>
      </Modal>
    );
  }

  // ---- V5-11 (UXD 9.13): `useCheckout` – the stay leaves on the calendar day, Trả phòng applies, nothing written ----
  if (useCheckout) {
    const checkOutOpen = (r.allowedActions ?? []).some((a) => a.event === 'check_out');
    return (
      <Modal
        open
        size="lg"
        title={t('early_departure.title', { room: roomNo, guest })}
        onClose={onClose}
        closeLabel={t('common.close')}
        footer={
          checkOutOpen ? (
            <>
              <Button onClick={onClose}>{t('common.close')}</Button>
              <Button variant="pri" onClick={() => navigate(`/reservations/${r.id}/check-out`)}>
                {t('early_departure.checkout_now')}
              </Button>
            </>
          ) : (
            <Button variant="pri" onClick={onClose}>
              {t('common.close')}
            </Button>
          )
        }
      >
        <div tabIndex={-1} ref={checkoutRef}>
          <Alert tone="info" role="alert">
            {t('early_departure.use_checkout')}
          </Alert>
        </div>
      </Modal>
    );
  }

  const inPreview = phase === 'preview';
  const fieldCount = Object.keys({ ...serverFieldErrors, ...writeFieldErrors }).length;
  const confirmWhy = !ready
    ? t('early_departure.to_preview_wait')
    : !told
      ? t('early_departure.confirm_needs_told')
      : null;
  return (
    <Modal
      open
      size="lg"
      title={t('early_departure.title', { room: roomNo, guest })}
      onClose={onClose}
      dirty={
        !act.busy &&
        (inPreview ||
          !!note.trim() ||
          !!otaText.trim() ||
          !!photo ||
          newDate !== minDate ||
          backdated)
      }
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        fatal ? (
          <Button variant="pri" onClick={() => onDone()}>
            {t('common.close')}
          </Button>
        ) : inPreview ? (
          <>
            <Button disabled={act.busy} onClick={() => setPhase('input')}>
              {t('common.edit_back')}
            </Button>
            {confirmWhy ? (
              <span className="li-s" id={`${ids}-why`}>
                {confirmWhy}
              </span>
            ) : null}
            <Button
              variant="danger"
              busy={act.busy}
              busyLabel={act.busyLabel ?? t('common.saving')}
              aria-disabled={confirmWhy ? true : undefined}
              aria-describedby={confirmWhy ? `${ids}-why` : undefined}
              onClick={() => void save()}
            >
              {commitFailed ? t('common.retry') : t('early_departure.confirm')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            {toPreviewWhy ? (
              <span className="li-s" id={`${ids}-why`}>
                {toPreviewWhy}
              </span>
            ) : null}
            <Button
              variant="pri"
              aria-disabled={toPreviewWhy ? true : undefined}
              aria-describedby={toPreviewWhy ? `${ids}-why` : undefined}
              onClick={() => {
                if (!ready) return;
                setVersionAlert(false);
                act.reset();
                setPhase('preview');
              }}
            >
              {t('early_departure.to_preview')}
            </Button>
          </>
        )
      }
    >
      {steps}
      {inPreview ? (
        <section className="stack" aria-labelledby={`${ids}-q`}>
          <h3 id={`${ids}-q`} tabIndex={-1} ref={questionRef}>
            {t('early_departure.preview_question', { guest, date: date(newDate) })}
          </h3>
          <p className="li-s">{t('early_departure.preview_note')}</p>
          {was && p ? (
            <div tabIndex={-1} ref={changedRef}>
              <Alert tone="warn" role="alert">
                {t('early_departure.amount_changed', {
                  refund: money(p.refundVnd ?? 0),
                  fee: money(p.earlyDepartureFeeVnd),
                })}
              </Alert>
            </div>
          ) : null}
          {!p ? (
            <>
              <p className="li-s" role="status">
                {t('early_departure.preview_loading')}
              </p>
              <LoadingBlock rows={3} />
            </>
          ) : (
            <>
              {/* BUG-R4-014: a lease shows BR-313 instead of the BR-428 rows. Should the server ever put money on a
                  lease (not in v1.0 – manual lease nights carry 0), its figures stay visible: never confirm unseen money. */}
              {lease && !hasMoney(p) ? null : (
                <Figures
                  p={p}
                  otaRetained={draft.otaRetainedVnd}
                  was={was}
                  feeDate={night ? today : undefined}
                />
              )}
              {lease ? <LeaseRule reservation={r} step="preview" /> : null}
              <Consequences p={p} newDate={newDate} />
              <Checkbox checked={told} onChange={setTold}>
                {t(
                  lease && !hasMoney(p)
                    ? 'early_departure.told_guest_lease'
                    : 'early_departure.told_guest',
                )}
              </Checkbox>
            </>
          )}
          {commitFailed ? (
            <Alert tone="bad">{t('early_departure.commit_failed')}</Alert>
          ) : (
            act.view()
          )}
        </section>
      ) : (
        <>
          {versionAlert ? (
            <Alert tone="bad">{t('early_departure.err.version_conflict')}</Alert>
          ) : null}
          {fieldCount ? (
            <Alert tone="bad">{t('error.VALIDATION_FAILED', { n: fieldCount })}</Alert>
          ) : null}
          <p className="li-s">
            {t('early_departure.stay_now', {
              range: `${dayMonth(r.arrivalDate)} → ${dayMonth(stayEnd)} · ${t('booking.field.nights', { n: daysBetween(r.arrivalDate, stayEnd) })}`,
            })}
          </p>
          <Field
            label={t('early_departure.new_date')}
            required
            help={t('early_departure.new_date_help', { min: date(minDate), max: date(maxDate) })}
            error={errors.newDepartureDate}
          >
            {(fp) => (
              <input
                {...fp}
                ref={dateRef}
                type="date"
                className="input"
                min={minDate}
                max={maxDate}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            )}
          </Field>
          {belowNightFloor ? (
            // UXD 9.13: only fills the box (the preview then runs by itself, as for any date); focus stays on it.
            <div className="row mb-16">
              <Button
                size="sm"
                onClick={() => {
                  setNewDate(minDate);
                  dateRef.current?.focus();
                }}
              >
                {t('early_departure.use_min_date', { date: date(minDate) })}
              </Button>
            </div>
          ) : null}
          <fieldset className="fieldset-plain">
            <legend className="label-h">{t('early_departure.notice_at')}</legend>
            <div className="g-2 top">
              <Field
                label={t('early_departure.notice_date')}
                required
                help={t('early_departure.notice_at_help')}
                error={errors.noticeGivenAt}
              >
                {(fp) => (
                  <input
                    {...fp}
                    type="date"
                    className="input"
                    max={opened.date}
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('early_departure.notice_time')} required help={t('stay.late_help')}>
                {(fp) => (
                  <input
                    {...fp}
                    type="time"
                    className="input"
                    value={noticeTime}
                    onChange={(e) => setNoticeTime(e.target.value)}
                  />
                )}
              </Field>
            </div>
            {/* BR-428 notice days mean nothing for a lease (BR-313 v0.5.1: forfeit whatever the notice). */}
            {p?.noticeDays !== undefined && !lease ? (
              <p className="li-s">
                {t('early_departure.notice_days', {
                  n: p.noticeDays,
                  date: p.noticeBusinessDate ? dayMonth(p.noticeBusinessDate) : '',
                })}
              </p>
            ) : null}
            {p?.noticeBusinessDate && p.noticeBusinessDate !== noticeDate ? (
              <p className="li-s">
                {t('early_departure.notice_after_midnight', {
                  date: dayMonth(p.noticeBusinessDate),
                })}
              </p>
            ) : null}
          </fieldset>
          {evidenceShown ? (
            <fieldset className="fieldset-plain">
              <legend className="label-h">{t('early_departure.evidence_title')}</legend>
              <p className="li-s">
                {t(
                  evidenceRequired || !p
                    ? 'early_departure.evidence_why'
                    : 'early_departure.evidence_optional',
                )}
              </p>
              <Field
                label={t('early_departure.evidence_note')}
                required={evidenceRequired}
                error={errors.noticeEvidence}
              >
                {(fp) => (
                  <textarea
                    {...fp}
                    className="input"
                    rows={2}
                    maxLength={500}
                    placeholder={t('early_departure.evidence_note_ph')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                )}
              </Field>
              <FilePicker
                label={t('early_departure.evidence_photo')}
                file={photo?.file ?? null}
                onChange={(f) => void choosePhoto(f)}
                error={photo?.error}
              />
            </fieldset>
          ) : null}
          {otaShown ? (
            <MoneyField
              label={t('early_departure.ota_retained')}
              required
              value={otaText}
              onChange={setOtaText}
              help={t('early_departure.ota_retained_help', {
                channel,
                max: money(asked.otaMax!),
              })}
              error={errors.otaRetainedVnd}
            />
          ) : null}
          <div aria-live="polite" role="status" className="li-s">
            {failed || unavailable || !sig ? null : !current ? (
              <>
                {t('early_departure.preview_loading')}
                {slow ? <LoadingBlock rows={1} /> : null}
              </>
            ) : needsOta ? (
              t('early_departure.ota_needed', { channel })
            ) : needsEvidence ? (
              t('early_departure.evidence_needed')
            ) : p ? (
              t('move.removed_nights', {
                n: p.droppedNights?.length ?? 0,
                dates: (p.droppedNights ?? []).map((x) => dayMonth(x.date)).join(', '),
              })
            ) : null}
          </div>
          {failed ? (
            <Alert
              tone="bad"
              actions={
                <Button size="sm" onClick={() => setTick((n) => n + 1)}>
                  {t('common.retry')}
                </Button>
              }
            >
              {t('early_departure.preview_failed')}
            </Alert>
          ) : unavailable ? (
            <Alert tone="warn">{t('early_departure.preview_unavailable')}</Alert>
          ) : otherPreviewError ? (
            <Alert tone="bad">{act.text(previewError)}</Alert>
          ) : null}
        </>
      )}
    </Modal>
  );
}

/** The server's preview / result carries a refund or a fee. */
const hasMoney = (x: EarlyDepartureResult) => (x.refundVnd ?? 0) > 0 || x.earlyDepartureFeeVnd > 0;

/**
 * BUG-R4-014: BR-313 v0.5.1 (ESC-045 câu 4) for a monthly lease left before its end – the deposit is held outside the
 * app. INV ESC-048 = B (03/11): rent paid up to the lease end → not a breach, the deposit is settled (BR-214). The
 * Desk v1.0 does not know whether the last rent period is paid (rent is recorded outside the app, no billing
 * periods), so it never states one outcome: a check line, then the two branches in the order the desk checks them –
 * paid, then not paid with what is still due nested under it (FB-R4-UXD-FE-26). ORC 03/11: no "signed before
 * 01/11/2026" branch – OTTIMO has no older paper lease (BR-107 v0.5.1). On the result step the check line becomes a
 * done note (FB-R4-UXD-FE-29); the branches stay as the reference.
 */
function LeaseRule({
  reservation: r,
  step,
}: {
  reservation: StayDialogProps['reservation'];
  step: 'preview' | 'result';
}) {
  const { t, money } = useI18n();
  const deposit = r.manualLongStay?.depositHeldVnd;
  return (
    <Alert tone="warn" role="note" title={t('early_departure.lease_title')}>
      <p>
        {t(step === 'result' ? 'early_departure.lease_done_note' : 'early_departure.lease_check')}
      </p>
      <ul className="list-plain">
        <li>{t('early_departure.lease_rule_paid')}</li>
        <li>
          {deposit
            ? t('early_departure.lease_rule', { amount: money(deposit) })
            : t('early_departure.lease_rule_no_amount')}
          <ul className="list-plain li-s">
            <li>{t('early_departure.lease_still_due')}</li>
          </ul>
        </li>
      </ul>
    </Alert>
  );
}

/** 422 field errors in this dialog's own words (UXD §2.3 `err.*`). */
function fieldText(
  t: T,
  e: unknown,
  money: (n: number) => string,
  otaMax: number | undefined,
  range: { min: string; max: string },
): Record<string, string> {
  if (!isApiError(e)) return {};
  const base = fieldErrors(t, e);
  const out: Record<string, string> = {};
  for (const fe of e.fieldErrors) {
    const f = fieldOf(fe.field);
    if (!f || f in out) continue;
    if (f === 'otaRetainedVnd' && fe.code === 'VALUE_OUT_OF_RANGE') {
      const max = typeof e.problem.max === 'number' ? e.problem.max : otaMax;
      out[f] = t('early_departure.err.ota_over_max', { max: money(max ?? 0) });
    } else if (f === 'otaRetainedVnd' && fe.code === 'REQUIRED')
      out[f] = t('early_departure.err.ota_required');
    else if (f === 'noticeEvidence') out[f] = t('early_departure.err.evidence_required');
    else if (f === 'newDepartureDate' && fe.code === 'DATE_INVALID')
      out[f] = t('early_departure.err.date_range', range);
    else if (f === 'noticeGivenAt' && fe.code === 'DATE_INVALID')
      out[f] = t('early_departure.err.notice_future');
    else out[f] = base[fe.field.replace(/^body\./, '')] ?? t('field_error.generic');
  }
  return out;
}

/** Night table + "Cách tính" – the server's figures only, never worked out here (UXD §2.5). */
function Figures({
  p,
  otaRetained,
  was,
  feeDate,
}: {
  p: EarlyDepartureResult;
  otaRetained?: number;
  was?: { refund: number; fee: number } | null;
  /** V5-11 (UXD 9.13): 00:00 to the rollover – the business day the fee line is posted on (BR-010). */
  feeDate?: string;
}) {
  const { t, vnd, money, date } = useI18n();
  const nights = p.droppedNights ?? [];
  const policy = nights.some((n) => !n.ota);
  const ota = nights.some((n) => n.ota);
  const refund = p.refundVnd ?? 0;
  const changed = (now: number, before: number | undefined): ReactNode =>
    before !== undefined && before !== now ? (
      <>
        {' '}
        <Chip tone="warn" icon="alert">
          {t('early_departure.changed_chip')}
        </Chip>
        <div className="li-s">{t('early_departure.was', { amount: money(before) })}</div>
      </>
    ) : null;
  return (
    <>
      <table className="sum">
        <caption className="label-h">{t('early_departure.nights_title')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('move.col_night')}</th>
            <th scope="col">{t('early_departure.col_booking')}</th>
            <th scope="col">{t('rooms.col_room')}</th>
            <th scope="col">{t('early_departure.col_basis')}</th>
            <th scope="col" className="r">
              {t('early_departure.col_amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {nights.map((n) => (
            <tr key={`${n.reservationCode}-${n.date}`}>
              <td>{dayMonth(n.date)}</td>
              <td className="mono">{n.reservationCode}</td>
              <td>{n.roomNo ?? t('early_departure.room_unassigned')}</td>
              <td>
                {n.ota ? (
                  <Chip tone="neutral" icon="globe">
                    {t('early_departure.basis_ota')}
                  </Chip>
                ) : (
                  <Chip tone="ink" icon="bill">
                    {t('early_departure.basis_policy')}
                  </Chip>
                )}
              </td>
              <td className="r num">{vnd(n.netVnd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="li-s">{t('early_departure.nights_note')}</p>
      <table className="sum">
        <caption className="label-h">{t('early_departure.calc_title')}</caption>
        <tbody>
          {policy && p.droppedNetVnd !== undefined ? (
            <tr>
              <td>{t('early_departure.row_base')}</td>
              <td className="r num">{vnd(p.droppedNetVnd)}</td>
            </tr>
          ) : null}
          {/* DOM ED-02 / ARC 11.1: notice days only apply to non-OTA nights. */}
          {policy && p.noticeDays !== undefined ? (
            <tr>
              <td>{t('early_departure.row_notice')}</td>
              <td className="r num">{t('early_departure.notice_value', { n: p.noticeDays })}</td>
            </tr>
          ) : null}
          {policy && p.refundableVnd !== undefined ? (
            <tr>
              <td>
                {t('early_departure.row_refundable')}
                {p.refundableVnd === 0 && (p.droppedNetVnd ?? 0) > 0 ? (
                  <div className="li-s">{t('early_departure.no_refund_notice')}</div>
                ) : null}
              </td>
              <td className="r num">{vnd(p.refundableVnd)}</td>
            </tr>
          ) : null}
          {/* ARC 10.2 / 11.1 (phương án A): the policy part actually inside the refund – the server's figure. */}
          {policy && p.refundCapped && p.refundablePaidVnd !== undefined ? (
            <tr>
              <td>{t('early_departure.row_refundable_after_cap')}</td>
              <td className="r num">{vnd(p.refundablePaidVnd)}</td>
            </tr>
          ) : null}
          {p.extraPersonRefundVnd ? (
            <tr>
              <td>{t('early_departure.row_extra_refund')}</td>
              <td className="r num">{vnd(p.extraPersonRefundVnd)}</td>
            </tr>
          ) : null}
          {p.extraPersonReversedVnd ? (
            <tr className="sub">
              <td>{t('early_departure.row_extra_reversed')}</td>
              <td className="r num">{vnd(p.extraPersonReversedVnd)}</td>
            </tr>
          ) : null}
          {p.roomChangeDifferenceVnd ? (
            <tr>
              <td>{t('early_departure.row_room_change')}</td>
              <td className="r num">{vnd(p.roomChangeDifferenceVnd)}</td>
            </tr>
          ) : null}
          {p.roomChangeDifferenceReversedVnd ? (
            <tr className="sub">
              <td>{t('early_departure.row_room_change_reversed')}</td>
              <td className="r num">{vnd(p.roomChangeDifferenceReversedVnd)}</td>
            </tr>
          ) : null}
          {ota ? (
            <tr>
              <td>
                {t('early_departure.row_ota_retained')}
                <div className="li-s">{t('early_departure.ota_room_note')}</div>
              </td>
              <td className="r num">{vnd(otaRetained ?? 0)}</td>
            </tr>
          ) : null}
          <tr className="total">
            <td>
              {t('early_departure.row_refund')}
              {changed(refund, was?.refund)}
              {!p.refundCapped ? (
                <div className="li-s">
                  {refund > 0
                    ? t('early_departure.row_refund_help')
                    : t('early_departure.no_refund')}
                </div>
              ) : null}
            </td>
            <td className="r num">{money(refund)}</td>
          </tr>
          <tr className="total">
            <td>
              {t('early_departure.row_fee')}
              {changed(p.earlyDepartureFeeVnd, was?.fee)}
              {feeDate && p.earlyDepartureFeeVnd > 0 ? (
                <div className="li-s">
                  {t('early_departure.fee_business_date', { date: date(feeDate) })}
                </div>
              ) : null}
            </td>
            <td className="r num">{money(p.earlyDepartureFeeVnd)}</td>
          </tr>
        </tbody>
      </table>
      {p.refundCapped ? (
        <Alert tone="warn" role="note">
          {refund > 0
            ? t('early_departure.refund_capped', { amount: money(refund) })
            : t('early_departure.refund_capped_zero')}
        </Alert>
      ) : null}
    </>
  );
}

/** "Sau khi xác nhận" – consecutive nights of one room are shown as a range ending the day after the last night. */
function Consequences({ p, newDate }: { p: EarlyDepartureResult; newDate: string }) {
  const { t, date, money } = useI18n();
  const byRoom = new Map<string, string[]>();
  for (const n of p.droppedNights ?? []) {
    const k = n.roomNo ?? t('early_departure.room_unassigned');
    byRoom.set(k, [...(byRoom.get(k) ?? []), n.date]);
  }
  const ranges: Array<{ room: string; range: string }> = [];
  for (const [room, days] of byRoom) {
    const sorted = [...new Set(days)].sort();
    let from = sorted[0]!;
    let prev = from;
    const flush = (end: string) => {
      const n = Math.round((Date.parse(end) - Date.parse(from)) / 86_400_000);
      ranges.push({
        room,
        range: `${dayMonth(from)} → ${dayMonth(end)} · ${t('booking.field.nights', { n })}`,
      });
    };
    for (const d of sorted.slice(1)) {
      if (d !== addDays(prev, 1)) {
        flush(addDays(prev, 1));
        from = d;
      }
      prev = d;
    }
    flush(addDays(prev, 1));
  }
  return (
    <section>
      <h4 className="label-h">{t('early_departure.effects_title')}</h4>
      <ul className="consequence">
        {ranges.map((x) => (
          <li key={`${x.room}-${x.range}`}>
            {t('early_departure.effect_nights', { room: x.room, range: x.range })}
          </li>
        ))}
        <li>{t('early_departure.effect_departure', { date: date(newDate) })}</li>
        {p.earlyDepartureFeeVnd > 0 ? (
          <li>{t('early_departure.effect_fee', { amount: money(p.earlyDepartureFeeVnd) })}</li>
        ) : null}
        {(p.childBookings ?? []).map((c) => (
          <li key={c.reservationId}>
            {t(
              c.cancelled
                ? 'early_departure.effect_child_cancelled'
                : 'early_departure.effect_child_shortened',
              { code: c.code, n: c.droppedNightCount },
            )}
          </li>
        ))}
        {p.registrationNeedsUpdate ? <li>{t('early_departure.effect_registration')}</li> : null}
        <li>{t('early_departure.effect_door', { date: date(newDate) })}</li>
        {/* DOM ED-06 / ARC 11.3: until v1.1 no channel link – the desk reopens the nights on the OTA extranets. */}
        <li>{t('early_departure.effect_ota_reopen')}</li>
      </ul>
    </section>
  );
}
