import {
  isApiError,
  newIdempotencyKey,
  type ApprovalRequest,
  type ApprovalStatus,
  type Bill,
  type CheckOutBody,
  type Folio,
  type FolioLine,
  type MinibarStandard,
} from '@ottimo/api-client';
import {
  isLocaleLoaded,
  loadLocale,
  pluralForm,
  translate,
  useI18n,
  type Args,
} from '@ottimo/i18n';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  ConfirmDialog,
  Field,
  Modal,
  Seg,
  Stepper,
  Switch,
} from '@ottimo/ui';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { listApprovals } from '../../app/approvals';
import { useBusinessDay } from '../../app/businessDay';
import { DEFAULT_ROLLOVER, checkoutInstant, timeHHmm } from '../../app/dates';
import { hasLineKey, lineLabel, signed } from '../../app/folio';
import { addDays, currentSegment } from '../../app/reservations';
import { Code, monoArgs } from '../../app/mono';
import { useDebtDefaultDueDays, useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MoneyField, STAY_WRITE_RETRY, amountOf, useSubmit } from './common';
import { PaymentPanel, type StagedPayment } from './PaymentPanel';
import { AddChargeDialog } from './StayDialogs';
import {
  FOC_CATEGORIES,
  FocRequestDialog,
  FocStateChip,
  SurchargeFocFields,
  canAskFoc,
  noSurchargeFoc,
  surchargeFocBody,
  surchargeFocMissing,
  type SurchargeFoc,
} from './foc';

const OWN_MGR = ['owner', 'manager'];
/**
 * ESC-031 (INV 26/10, ESC-024 B; BE-B `esc031-be-b.md` 4): `lateFeeInsteadOfNight.postReview` – the desk records the
 * server's one-night fee with a reason, no manager credentials, no waiver; OWN/MGR review it afterwards (OpenAPI
 * 0.3.8 addendum 8, ARC 26/10).
 */
type LateFeeBody = NonNullable<CheckOutBody['lateFeeInsteadOfNight']>;
/** How the one-night late fee is confirmed on the bill step: recorded now and reviewed later (default), or at the desk. */
type LateFeeMode = 'review' | 'desk';
/** BUG-R3-017: label keys of the methods collected with "Hoàn tất" (`finalPayment`). */
const PAY_METHOD_KEY: Record<StagedPayment['method'], string> = {
  cash: 'pay.cash',
  card_pos: 'pay.card',
};
/** B18 field errors about the departure time – fixed on step 2, where the time and its note are (KB7). */
const TIME_FIELDS = ['checkoutTime', 'checkoutAt', 'checkoutTimeNote'];
const STEPS = ['checkout.step.minibar', 'checkout.step.extras', 'checkout.step.bill'];
/** Above any stay's due: the check-out VietQR answers 422 with its cap (`max`) and writes nothing. */
const DUE_PROBE_VND = 10_000_000_000;
const EXTRAS: Array<{ key: string; preset: string }> = [
  { key: 'checkout.extras.laundry', preset: 'LAUNDRY_KG' },
  { key: 'checkout.extras.food', preset: 'FNB' },
  { key: 'checkout.extras.damage', preset: 'damage' },
  { key: 'checkout.extras.smoking', preset: 'SMOKING' },
  { key: 'checkout.extras.card', preset: 'CARD_LOST' },
];

/** GN-R4-QA-03: refund requests still in play – waiting for a decision, or approved and not fully paid out. */
const OPEN_REFUND: readonly ApprovalStatus[] = ['pending', 'escalated', 'approved'];

/**
 * GN-R4-QA-03 (QA v1.0.2 ĐK10 5.3): what the guest is still to get back from Trả sớm (B16) – Σ (`amountVnd` −
 * `refundedVnd`) of this booking's open `refund` requests with reason `early_departure` (B16 asks it on the primary
 * booking, `reservationCode`). Other reasons (`overpayment` …) and other bookings are not counted. Read from the
 * requests the API already has (`listApprovalRequests`) – no new field in v1.0.4.
 * FB-R4-UXD-FE-P432-01 (ARC 6.4, GN-R4-QA-01): `awaitingDecision` – one of those still waits for a decision (`pending` /
 * `escalated`), so charges posted after it (minibar, extras of this very page) come off at approval: the amount may go
 * down. An `approved` request has its amount fixed.
 */
export function earlyDepartureRefundPending(
  requests: readonly ApprovalRequest[],
  reservationCode: string,
): { vnd: number; awaitingDecision: boolean } {
  const open = requests.filter(
    (a) =>
      a.type === 'refund' &&
      a.reasonCode === 'early_departure' &&
      a.reservationCode === reservationCode &&
      OPEN_REFUND.includes(a.status) &&
      a.amountVnd - (a.refundedVnd ?? 0) > 0,
  );
  return {
    vnd: open.reduce((sum, a) => sum + (a.amountVnd - (a.refundedVnd ?? 0)), 0),
    awaitingDecision: open.some((a) => a.status === 'pending' || a.status === 'escalated'),
  };
}

/** ESC-031: 422 NOT_ALLOWED on `lateFeeInsteadOfNight` itself – the night of departure can be sold again. */
function lateFeeNotAllowed(e: unknown): boolean {
  return (
    isApiError(e) &&
    e.code === 'VALIDATION_FAILED' &&
    e.fieldErrors.some(
      (f) => f.field.replace(/^body\./, '') === 'lateFeeInsteadOfNight' && f.code === 'NOT_ALLOWED',
    )
  );
}

/**
 * The figures a cabinet count starts from (what is LEFT per item), from the standard read for that cabinet:
 * - DOM (e), BR-702 v0.3.8: the number the desk corrected on the folio (with a reason) wins over the last count –
 *   sending `standard − folioUsed` keeps that line (R6); another number = a new count;
 * - else the last count of this period;
 * - BUG-R2-144 / BR-703-02: counted earlier in this refill period but due again (the stay came back to the room, or
 *   was extended) – start from that count, never from a full cabinet (which would read as "nothing used" and
 *   reverse what was charged);
 * - else a full cabinet.
 */
export function minibarPrefill(std: MinibarStandard | undefined): Record<string, number> {
  const latest = std?.latestCheck?.lines;
  return Object.fromEntries(
    (std?.items ?? []).map((i) => [
      i.itemId,
      i.adjustedAfterLastCheck && typeof i.folioUsedQty === 'number'
        ? Math.max(0, i.standardQty - i.folioUsedQty)
        : (latest?.find((l) => l.itemId === i.itemId)?.remainingQty ??
          (typeof i.lastCheckUsedQty === 'number'
            ? Math.max(0, i.standardQty - i.lastCheckUsedQty)
            : i.standardQty)),
    ]),
  );
}

/**
 * H16 Trả phòng 3 bước (S07, US-035…039, B18): minibar (counts 0…standard) → extras (actual
 * departure time, late surcharge only when the desk confirms the amount – BR-414, re-priced by the
 * real time – G-10) → bill + payment (VietQR drawn locally, cash/transfer/POS, company invoice) →
 * "Hoàn tất" with the consequence box (US-135). Server blockers (balance, approvals, minibar, credit)
 * are shown in place; a credit balance needs a handling choice (`overpaymentHandling`, G-15).
 */
export function CheckOutPage({ reservationId }: { reservationId: string }) {
  const { t, vnd, money, date } = useI18n();
  const propertyId = usePropertyId();
  const { roles, property } = useSession();
  // BUG-R4-050: the instant of the typed time on the business-day axis B18 reads it on (`checkoutInstant`) – only for a
  // server that does not return `CheckoutSummary.checkoutAt` yet (≤ 0.3.12); V5-10 forwards the server's instant.
  const rollover = property?.businessDayRollover ?? DEFAULT_ROLLOVER;
  // R3-Q39 #10, #11 (BR-010): the BUSINESS day – at 02:40 the stay is still in last night's room, and the
  // debt due date counts from the business day of the write (BR-525 (i) v0.4.0).
  const today = useBusinessDay();
  const debtDays = useDebtDefaultDueDays(propertyId, roles);
  const rules = useRules(propertyId, roles);
  const { online, since } = useOnline();
  const toast = useToast();
  const ids = useId();
  const mgr = roles.some((r) => OWN_MGR.includes(r));
  const R = { propertyId, reservationId };

  const res = useResource(
    async () => (await api.getReservation(R)).data,
    [propertyId, reservationId],
  );
  const r = res.state.data;
  // K11-03 (ARC 16.19): the room the stay is in today – never `segments[0]` (the room left after a mid-stay B14).
  const here = r ? currentSegment(r.segments, today) : undefined;
  const hereRoomId = here?.roomId ?? undefined;
  const [step, setStep] = useState(0);
  const [time, setTime] = useState('');
  /** DOM rules-v1.0.5 15.2: the desk changed the time the page filled in (the desk's clock, KB7). */
  const [timeTouched, setTimeTouched] = useState(false);
  const qTime = useDebounced(time, 300);
  // V5-10 (0.3.13 1.1 ý 3, 1.19 ý 4): each read keeps the time it asked for – QR and B18 forward the `checkoutAt` of
  // a read WITH the time on screen only (DOM rules-v1.0.5 15.2: the read without a time is the agreed or standard
  // time, never the guest's).
  const sum = useResource(
    async () => ({
      summary: (await api.getCheckoutSummary(R, qTime || undefined)).data,
      askedTime: qTime,
    }),
    [propertyId, reservationId, qTime],
  );
  const s = sum.state.data?.summary;
  // 0.3.7 bổ sung 4 (minibar M-1, BR-703-01): one cabinet per (stay, room) – after B14 the old room's cabinet is
  // counted too (`CheckoutSummary.minibarUncheckedRooms`); `undefined` = the room assigned now.
  const [cabinet, setCabinet] = useState<string | undefined>(undefined);
  // BR-703-01: the old room's cabinet is offered first – once. Never over a cabinet the desk picked or counted on
  // (ARC FB-R4-ARC-FE-PR67-03: a later summary read, e.g. priced for the typed time, sent the page back to the old
  // cabinet and dropped the figures typed on this one). The desk may still count this room's cabinet first.
  const cabinetSettled = useRef(false);
  /**
   * BUG-R4-042: the cabinets counted on this page (201) or passed with nothing chargeable, `roomId` → room no. They are
   * never chosen or offered again on this page – also while the summary read after that count is on its way: until it
   * is in, the summary still lists them. The next cabinet used to be looked for in that list, so a second count made
   * before it came in sent the page back to the cabinet just counted, unnamed ("Không dùng gì – tủ đủ" there reversed
   * the minibar charged). The ref is read by the handlers after `await`; the state draws the screen.
   */
  const doneRef = useRef<ReadonlyMap<string, string>>(new Map());
  const [doneCabinets, setDoneCabinets] = useState(doneRef.current);
  const markDone = (roomId: string, roomNo: string) => {
    const next = new Map(doneRef.current).set(roomId, roomNo);
    doneRef.current = next;
    setDoneCabinets(next);
    return next;
  };
  // K11-03: the cabinet on screen is always named – read and written with its `roomId` (ARC 16.19).
  const countingRoomId = cabinet ?? hereRoomId;
  const std = useResource(
    async () =>
      countingRoomId
        ? (await api.getMinibarStandard(R, countingRoomId)).data
        : // the reservation (and so the room of today) is not known yet – no unnamed read
          new Promise<never>(() => undefined),
    [propertyId, reservationId, countingRoomId],
  );
  // s4-144 race (v1.0.4): the prefill is derived in render, so the first frame that shows a cabinet already holds
  // – and would send – the figures it starts from. It used to be copied into state by an effect one render later:
  // "Tiếp tục" pressed in between sent a full cabinet ("nothing used") and reversed the minibar already charged.
  const prefill = useMemo(() => minibarPrefill(std.state.data), [std.state.data]);
  /**
   * Figures the desk changed – for THIS standard read only: another cabinet, period or re-read drops them
   * (BUG-R4-035: after B14 the figures typed on cabinet A were sent for cabinet B in the same frame).
   */
  const [edits, setEdits] = useState<{
    of: MinibarStandard | undefined;
    left: Record<string, number>;
  }>({ of: undefined, left: {} });
  const left: Record<string, number> =
    edits.of && edits.of === std.state.data ? { ...prefill, ...edits.left } : prefill;
  const editLeft = (next: Record<string, number>) => {
    cabinetSettled.current = true;
    const of = std.state.data;
    setEdits((e) => ({ of, left: { ...(e.of === of ? e.left : {}), ...next } }));
  };
  /**
   * The standard on screen is read and is the one of the cabinet on screen (ARC FB-R4-ARC-FE-PR67-01): a switch
   * after `await` (next cabinet) or a B14 seen on a reload paints one frame with cabinet B and A's read, as
   * `useResource` starts loading in an effect. Until then nothing is edited, counted or sent.
   */
  const stdForCabinet =
    !!countingRoomId &&
    std.state.status === 'ready' &&
    (std.state.data.roomId ?? countingRoomId) === countingRoomId;
  /** Read (again) in progress, or not started for this cabinet yet: "Tiếp tục" waits (DS busy). */
  const stdWaiting = !stdForCabinet && std.state.status !== 'error';
  const [lateTold, setLateTold] = useState(false);
  // S4-25 (US-007 AC1): the late surcharge written on the way to the bill can carry a FOC request.
  const [lateFoc, setLateFoc] = useState<SurchargeFoc>(noSurchargeFoc);
  /** S4-25: FOC / special discount asked on a folio line from here (minibar, extras, a late fee on the folio). */
  const [focLine, setFocLine] = useState<FolioLine | null>(null);
  const [timeNote, setTimeNote] = useState('');
  const [extraRate, setExtraRate] = useState('');
  const [extra, setExtra] = useState<string | null>(null);
  const [invoice, setInvoice] = useState(false);
  const [inv, setInv] = useState({ companyName: '', taxCode: '', email: '', address: '' });
  const [overMode, setOverMode] = useState<'refund_request' | 'retain_with_guest_consent'>(
    'refund_request',
  );
  const [overReason, setOverReason] = useState('');
  // S4-26 (US-038 AC3, BR-525, A19): OWN/MGR may complete with a balance left as a debt (due date + reason).
  const [debtOn, setDebtOn] = useState(false);
  const [debtDue, setDebtDue] = useState('');
  const debtDefault = addDays(today, debtDays);
  // BR-525 (i): the due date starts at business day + 3 when the debt option is turned on, and follows the
  // business day / the parameter while the manager has not changed it.
  const debtDefaultRef = useRef('');
  useEffect(() => {
    if (!debtOn) return;
    setDebtDue((v) => (v === '' || v === debtDefaultRef.current ? debtDefault : v));
    debtDefaultRef.current = debtDefault;
  }, [debtOn, debtDefault]);
  const [debtReason, setDebtReason] = useState('');
  // BR-416-06 (ARC 0.3.7 bổ sung 4, 16.6 (d)): the night of departure cannot be sold → a late fee of one night,
  // confirmed at the desk by a manager (username + password; OWN/MGR: their own password) with a reason.
  // ESC-031 (ESC-024 B): by default the desk records it now and OWN/MGR review it afterwards (`postReview`) – with
  // production 2FA a password typed at the counter is always refused (fail-closed), so that path is the second choice.
  const [lfMode, setLfMode] = useState<LateFeeMode>('review');
  // SEC-sprint1 8.6 (1): the manager-password panel only where the server says 2FA is NOT enforced
  // (`getMy2fa.enforced === false` – dev/CI). Enforced (staging, production), unknown or unread → hidden.
  const [deskConfirm, setDeskConfirm] = useState(false);
  const [lfReason, setLfReason] = useState('');
  const [lfUser, setLfUser] = useState('');
  const [lfSecret, setLfSecret] = useState('');
  // Optional FOC on that fee, applied by the confirming manager within their BR-433 limit (same B18 call).
  const [lfFoc, setLfFoc] = useState<SurchargeFoc>(noSurchargeFoc);
  const [lfFocAmount, setLfFocAmount] = useState('');
  const [confirm, setConfirm] = useState(false);
  /** BUG-R3-017: cash / POS card collected on step 3, written by B18 as `finalPayment` (PaymentPanel `onStage`). */
  const [staged, setStaged] = useState<StagedPayment | null>(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [done, setDone] = useState<{ billNo: string; folioId: string } | null>(null);
  // BUG-R3-033: after B18 the Folio card shows the SERVER's settled folio (lines B18 posted, payments, 0 due) – never
  // the pre-check-out estimate (summary + staged cash), which still said "Còn phải thu" with nothing left to collect.
  const [doneFolio, setDoneFolio] = useState<Folio | null>(null);
  const [doneFolioError, setDoneFolioError] = useState<unknown>(null);
  const loadDoneFolio = (folioId: string) => {
    setDoneFolioError(null);
    api.getFolio({ propertyId, folioId }).then(
      (x) => setDoneFolio(x.data),
      (e: unknown) => setDoneFolioError(e),
    );
  };
  // GN-R4-QA-03: the refund still due from Trả sớm, read for step 3 and again for the result (after B18). Nothing is
  // read on steps 1–2. The line only informs – it never blocks "Hoàn tất"; a failed read says so (UXD P432-03).
  const refundPhase = done ? 'done' : step === 2 ? 'bill' : '';
  const rsvCode = r?.code;
  const edRefund = useResource(
    async () =>
      refundPhase && rsvCode
        ? earlyDepartureRefundPending(await listApprovals(propertyId, OPEN_REFUND), rsvCode)
        : { vnd: 0, awaitingDecision: false },
    [propertyId, rsvCode, refundPhase],
  );
  const edRefundVnd = refundPhase ? (edRefund.state.data?.vnd ?? 0) : 0;
  const edRefundMayDecrease = edRefundVnd > 0 && !!edRefund.state.data?.awaitingDecision;
  const edRefundUnread = !!refundPhase && edRefund.state.status === 'error';
  // SEC FB-R3-SEC-FE-A-16: money received but not on the folio yet lives only in this page (never in browser
  // storage – no `posAuthCode` kept anywhere) – leaving asks first: reload / close (`beforeunload`) and any link of
  // the app (capture phase, before React Router's Link handles the click).
  const holding = !!staged && !done;
  useEffect(() => {
    if (!holding) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented || e.button !== 0) return;
      if (!window.confirm(t('co.pay_at_complete_leave'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [holding, t]);
  const minibarAct = useSubmit();
  const invAct = useSubmit();
  // ARC 16.17 bổ sung (af): B18 resends a CONCURRENT_UPDATE once with the same key.
  const act = useSubmit(undefined, STAY_WRITE_RETRY);
  const lateAct = useSubmit();
  /** B18 answered TIME_NOTE_REQUIRED: the note field stays on step 2 (and takes the focus once). */
  const [noteAsked, setNoteAsked] = useState(false);
  const [focusNote, setFocusNote] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  /** The late surcharge was just written (B15): step 3 opens once the folio and booking are read again. */
  const [toBill, setToBill] = useState(false);

  useEffect(() => {
    // E03-07: the guest leaves now – never a future time, never the standard time by default. KB7 (UXR 17/10):
    // after 12:30 the default used to be 12:00 ("Trả đúng giờ – không phụ thu") and the late surcharge was
    // lost. "Now" = the desk's clock (trusted device; on the desk-clock stack the browser runs on the stack's
    // virtual clock) – the API has no clock field; B18 re-checks the time against its own clock (E03-07).
    // Post-midnight window (0.3.6 add. 2): also now, early in the departure day.
    if (s && !time) setTime(timeHHmm(new Date()));
    // first summary only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.checkoutTime]);
  useEffect(() => {
    // ready (or failed – step 3 then shows what it has and its own errors): never a button busy for ever
    if (!toBill || sum.state.status === 'loading' || res.state.status === 'loading') return;
    setToBill(false);
    setStep(2);
  }, [toBill, sum.state.status, res.state.status]);
  // "Tiếp tục" pressed while the summary is still priced for another time (typed < 300 ms ago): the click is
  // kept and carried out once the server amount for the typed time is on screen – never lost, never stale.
  const timedSummary = !!s && !!time && sum.state.data?.askedTime === time;
  const priced = !time || timedSummary;
  /**
   * V5-10 (0.3.13 1.1 ý 3, 1.19; T10-6): the ONE instant of this check-out – the server's `checkoutAt` of the last
   * summary read with the time on screen, sent as is to the check-out VietQR (and its due probe) and to B18. No read
   * with that time yet → nothing (the QR and B18 wait, like "Tiếp tục"). The desk never puts a date to the time itself,
   * except for a server without the field (≤ 0.3.12).
   */
  const checkoutAt =
    timedSummary && r
      ? (s.checkoutAt ??
        checkoutInstant(time, today, r.stayDepartureDate ?? r.departureDate, rollover))
      : undefined;
  // 0.3.13 bổ sung 1 (C0313-01): that instant is later than the server's clock + tolerance – B18 and the check-out QR
  // would answer 422 TIME_AFTER_ACTION: said under the time box, "Tiếp tục", the QR and "Hoàn tất" are off.
  const timeAfterNow = timedSummary && s.checkoutAtAfterNow === true;
  const [wantBill, setWantBill] = useState(false);
  const goBillRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!wantBill || !priced) return;
    setWantBill(false);
    goBillRef.current();
  }, [wantBill, priced]);
  useEffect(() => {
    if (!focusNote || step !== 1) return;
    noteRef.current?.focus();
    setFocusNote(false);
  }, [focusNote, step]);

  // SEC FB-R2-SEC-FE-08: the manager's password lives only while the confirmation box is open with the same
  // figures – leaving the bill step, the box closing, or the fee / waiver changing clears it.
  // ESC-031: the path in use – the desk confirmation only when it is offered (SEC 8.6).
  const lfModeNow: LateFeeMode = deskConfirm ? lfMode : 'review';
  // ESC-031 / SEC 8.6: switching to "Ghi phụ thu – quản lý xem lại" also drops a password typed in the old panel.
  const lfShownKey =
    step === 2 && s?.extraNightRequired && s.extraNightAvailable === false
      ? `${lfModeNow}|${s.lateFeeAsNightVnd ?? ''}|${lfFoc.on ? lfFocAmount || 'all' : ''}`
      : '';
  useEffect(() => {
    setLfSecret('');
  }, [lfShownKey]);
  const lfOffered =
    !!s?.extraNightRequired && s.extraNightAvailable === false && (s.lateFeeAsNightVnd ?? 0) > 0;
  useEffect(() => {
    if (!lfOffered) return;
    let stale = false;
    api.getMy2fa().then(
      (x) => !stale && setDeskConfirm(x.data.enforced === false),
      () => !stale && setDeskConfirm(false),
    );
    return () => {
      stale = true;
    };
  }, [lfOffered]);

  // BR-703-01: an unchecked cabinet of an earlier room of this stay is counted first.
  useEffect(() => {
    // Only once the reservation is here – before that every cabinet would look like an earlier room.
    if (!hereRoomId || cabinetSettled.current) return;
    const old = (s?.minibarUncheckedRooms ?? []).find(
      (c) => c.roomId !== hereRoomId && !doneRef.current.has(c.roomId),
    );
    if (step === 0 && cabinet === undefined && old) {
      cabinetSettled.current = true;
      setCabinet(old.roomId);
    }
    // once: the first summary with an old cabinet, unless the desk picked or typed before
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.minibarUncheckedRooms, hereRoomId]);
  // BUG-R4-042: the latest summary read, for the choice of the next cabinet made after `await` (the summary of the
  // press may be older – a read that came in meanwhile is used).
  const latestSummary = useRef(s);
  useEffect(() => {
    latestSummary.current = s;
  }, [s]);
  /**
   * BUG-R4-045 (FB-R4-ARC-FE-PR81-01): a cabinet counted on this page stays "counted" only until a summary read SENT
   * AFTER that count is in. A count calls `sum.reload()` in the same batch as `markDone`, and `useResource` drops every
   * older answer (`seq`), so a `ready` committed in a render that already holds the cabinet in `doneCabinets` is such a
   * read. A cabinet that read still lists is due again (B14 / B13 back to that room, a refill, the business day –
   * `reason`) and is offered again with its "Cần đếm lại" line.
   * ARC FB-R4-ARC-FE-PR83-02: only the cabinets of `doneCabinets` of THIS render are released – never `doneRef`, which
   * may already hold a count answered between the commit of this read (sent before that count – BUG-R4-042) and this
   * effect (React 18 does not order a passive effect before a later network answer).
   * B18 answered 409 MINIBAR_NOT_CHECKED (`minibarResync`): with the summary read after that answer, back to step 1 on
   * the first cabinet it lists (BR-703-01: an earlier room's first) – also when the page left step 1 before any
   * summary was in (D2). Not when the desk is on step 1 already (went back by itself, as the sentence says): the
   * cabinet on screen is never switched or read again under its hands – the figures typed stay (ARC PR83-01, PR67-03);
   * the cabinet due is offered by the release above and named on the main button.
   */
  const [minibarResync, setMinibarResync] = useState(false);
  const seenRead = useRef<Date | undefined>(undefined);
  useEffect(() => {
    if (sum.state.status !== 'ready' || sum.state.loadedAt === seenRead.current) return;
    seenRead.current = sum.state.loadedAt;
    const due = sum.state.data.summary.minibarUncheckedRooms ?? [];
    const release = [...doneCabinets.keys()].filter((id) => due.some((c) => c.roomId === id));
    if (release.length) {
      const kept = new Map([...doneRef.current].filter(([id]) => !release.includes(id)));
      doneRef.current = kept;
      setDoneCabinets(kept);
    }
    if (!minibarResync) return;
    setMinibarResync(false);
    if (step === 0) return;
    const first = due.find((c) => c.roomId !== hereRoomId) ?? due[0];
    // none listed any more (counted meanwhile elsewhere): "Hoàn tất" again
    if (!first) return;
    // (`cabinetSettled` is set already: every way to B18 went through "Tiếp tục" on step 1)
    minibarAct.reset();
    const next = first.roomId === hereRoomId ? undefined : first.roomId;
    // the cabinet already on screen: read again – a new period (refill), its last count
    if ((next ?? hereRoomId) === countingRoomId) std.reload();
    setCabinet(next);
    setStep(0);
    // per summary read; `doneCabinets` / `step` / `minibarAct` / `std` / `countingRoomId` of that render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minibarResync, sum.state]);

  // ARC 0.3.7 bổ sung 4 (S4-38, BR-416-04/05): at a typed extra-night rate the amount due is the server's too –
  // the cap of a check-out VietQR at that rate (422 AMOUNT_EXCEEDS_BALANCE `max`; nothing is written), never
  // "default due + (typed − default)" on the client (the extra night takes the BR-107 step and FOC that follow).
  const typedRate =
    s?.extraNightRequired && s.extraNightAvailable !== false ? amountOf(extraRate) : 0;
  const rateTyped = typedRate > 0 && typedRate !== (s?.extraNightDefaultRateVnd ?? 0);
  const typedKey =
    rateTyped && r && checkoutAt && !timeAfterNow ? `${checkoutAt}|${typedRate}` : '';
  const debTypedKey = useDebounced(typedKey, 300);
  const [typedDue, setTypedDue] = useState<{ key: string; due?: number; failed?: boolean } | null>(
    null,
  );
  useEffect(() => {
    if (!debTypedKey || debTypedKey !== typedKey || !r) return;
    let stale = false;
    const [at, rate] = debTypedKey.split('|') as [string, string];
    api
      .createVietQr(
        { propertyId, folioId: r.folioId },
        {
          amountVnd: DUE_PROBE_VND,
          purpose: 'check_out',
          checkoutAt: at,
          extraNightRateVnd: Number(rate),
        },
        newIdempotencyKey(),
      )
      .then(
        () => !stale && setTypedDue({ key: debTypedKey, failed: true }),
        (e: unknown) => {
          if (stale) return;
          const max =
            isApiError(e) && e.fieldErrors.some((f) => f.code === 'AMOUNT_EXCEEDS_BALANCE')
              ? Number(e.problem.max)
              : NaN;
          setTypedDue(
            Number.isFinite(max)
              ? { key: debTypedKey, due: max }
              : { key: debTypedKey, failed: true },
          );
        },
      );
    return () => {
      stale = true;
    };
    // `s` – a payment recorded or a line written changes what is due at that rate.
  }, [debTypedKey, typedKey, r, propertyId, s]);

  if (!r && res.state.status === 'error')
    return (
      <>
        <Topbar title={t('drawer.action.check_out')} />
        <Page>
          <ErrorBlock
            titleKey="co.error_title"
            error={res.state.error}
            onRetry={res.reload}
            autoRetrySeconds={res.state.autoRetrySeconds}
          />
        </Page>
      </>
    );
  if (!r)
    return (
      <>
        <Topbar title={t('drawer.action.check_out')} />
        <Page>
          <LoadingBlock />
        </Page>
      </>
    );

  const room = here?.roomNo ?? '';
  const currentRoomId = hereRoomId ?? '';
  /** The room no of a cabinet of this stay – never the room of today for another cabinet (K11-03). */
  const cabinetNo = (roomId: string | undefined) =>
    (roomId === currentRoomId ? room : undefined) ??
    s?.minibarUncheckedRooms?.find((c) => c.roomId === roomId)?.roomNo ??
    (roomId ? doneCabinets.get(roomId) : undefined) ??
    r.segments?.find((sg) => sg.roomId === roomId)?.roomNo ??
    room;
  // The choice of cabinet only when the stay has more than one to count (B14 mid-stay).
  // BUG-R4-042: a cabinet counted on this page is not offered again (the summary lists it until its next read is in).
  const cabinets = (() => {
    const list = (s?.minibarUncheckedRooms ?? []).filter((c) => !doneCabinets.has(c.roomId));
    if (!list.length) return list;
    // BUG-R4-045: a cabinet due again while another is on screen (counted, back on step 1) – the one on screen stays
    // among the choices, pressed (no switch under the desk's hands), the other one is offered next to it.
    if (cabinet && !list.some((c) => c.roomId === cabinet)) {
      if (doneCabinets.has(cabinet)) list.push({ roomId: cabinet, roomNo: cabinetNo(cabinet) });
    } else if (!list.some((c) => c.roomId === currentRoomId)) {
      if (!doneCabinets.has(currentRoomId) || cabinet === undefined)
        list.push({ roomId: currentRoomId, roomNo: room });
    }
    // UXD FB-R4-UXD-FE-PR83-01: one order, whichever cabinet is on screen or offered again – the rooms of the stay in
    // their order, this room's cabinet last (BR-703-01, as when the page opens). A button never changes place.
    const rank = (roomId: string) =>
      roomId === currentRoomId
        ? Number.MAX_SAFE_INTEGER
        : Math.max(0, r.segments?.findIndex((sg) => sg.roomId === roomId) ?? 0);
    return list.sort((a, b) => rank(a.roomId) - rank(b.roomId));
  })();
  /**
   * K11-03 (BUG-R4-042): the stay has more than one cabinet on this page – the one on screen is named on screen
   * (by the choice while two are left, then by its own line); the title only names the room of today.
   */
  const severalCabinets =
    new Set(
      [
        ...doneCabinets.keys(),
        ...(s?.minibarUncheckedRooms ?? []).map((c) => c.roomId),
        countingRoomId,
      ].filter(Boolean),
    ).size > 1;
  const guest = r.booker?.displayName ?? '';
  // BUG-R3-024: B18 runs only on the departure business day of the whole stay (child extensions included –
  // `stayDepartureDate`); before it the server answers 409 "early departure first – B16". Opened earlier (URL, history),
  // this page points to Trả sớm on the booking instead of the 3 steps – no minibar count is written, no B18 is sent.
  // The post-midnight window (business day = departure − 1, calendar day = departure – `postMidnightWindow`) is a
  // valid B18: the day before the departure waits for the summary to say which. FB-R4-ARC-FE-P432-04: a summary that
  // cannot be read then is an error with Retry, never the pointer to Trả sớm – at 03:00 in that window B16 would
  // drop and refund the night the guest just slept.
  const stayDeparture = r.stayDepartureDate ?? r.departureDate;
  if (!done && r.status === 'in_house' && today < stayDeparture && !s?.postMidnightWindow) {
    const eve = addDays(today, 1) === stayDeparture && !s;
    return (
      <>
        <Topbar title={t('checkout.title', { room, guest })} sub={<Code>{r.code}</Code>} />
        <Page>
          {eve && sum.state.status === 'error' ? (
            <ErrorBlock
              titleKey="co.error_title"
              error={sum.state.error}
              onRetry={sum.reload}
              autoRetrySeconds={sum.state.autoRetrySeconds}
            />
          ) : eve ? (
            <LoadingBlock />
          ) : (
            <section className="card stack">
              <Alert tone="info">
                {t('checkout.use_early_departure', { date: date(stayDeparture) })}
              </Alert>
              <div className="row wrap">
                <Link className="btn pri" to={`/reservations/${reservationId}`}>
                  {t('ci.back_to_booking')}
                </Link>
              </div>
            </section>
          )}
        </Page>
      </>
    );
  }
  const items = std.state.data?.items ?? [];
  const chargeable = items.some((i) => !i.isFree);
  const minibarTotal = items.reduce(
    (a, i) =>
      a +
      (i.isFree ? 0 : (i.standardQty - (left[i.itemId] ?? i.standardQty)) * (i.unitPriceVnd ?? 0)),
    0,
  );
  const lateAmount = s?.lateCheckoutSurcharge?.amountVnd ?? 0;
  // `{max}` of MINIBAR_QTY_OVER_STANDARD = standard of the item the server flagged (lines[i]).
  const badIdx = Object.keys(minibarAct.fields)
    .map((k) => /^lines\[(\d+)\]/.exec(k)?.[1])
    .find((x) => x !== undefined);
  const minibarMax = badIdx !== undefined ? (items[Number(badIdx)]?.standardQty ?? '') : '';
  const lines: FolioLine[] = s?.lines ?? [];
  const extraNightNeeded = !!s?.extraNightRequired;
  const extraUnavailable = extraNightNeeded && s?.extraNightAvailable === false;
  // E05-11: the extra night is posted inside the check-out transaction, so the summary does not
  // include it yet – balance/credit shown here are what B18 will see after that night.
  // ARC 16.18 (vòng sửa 5): the rate goes to the server only when the desk changed the box (manual night, even
  // at the suggested figure); left alone → not sent (the server's default night). A flag of the box, no number test.
  const extraEdited = extraRate !== '';
  const extraFloor = s?.extraNightFloorVnd;
  const extraCeiling = s?.extraNightCeilingVnd;
  const extraRangeError =
    extraNightNeeded &&
    !extraUnavailable &&
    extraEdited &&
    extraFloor !== undefined &&
    extraCeiling !== undefined &&
    (amountOf(extraRate) < extraFloor || amountOf(extraRate) > extraCeiling)
      ? t('field_error.value_out_of_range', { min: money(extraFloor), max: money(extraCeiling) })
      : undefined;
  const extraNightVnd =
    extraNightNeeded && !extraUnavailable
      ? amountOf(extraRate) || (s?.extraNightDefaultRateVnd ?? 0)
      : 0;
  // KB7 (UXR 17/10, G-10): the late surcharge at the typed time (server) vs the one already on the folio
  // (B15 earlier, or written on the way to step 3). A HIGHER amount needs the desk's decision (BR-414) and is
  // written to the folio before the bill step, so the amount to collect includes it; a LOWER one (or none after
  // the last tier – extra night) is reversed by B18 itself, in the guest's favour.
  const lateNew = extraNightNeeded ? 0 : lateAmount;
  const lateOld = s?.lateSurchargeRecalc?.oldVnd ?? 0;
  const lateRaise = lateNew > lateOld;
  const lateDelta = lateNew - lateOld;
  const lateTier = s?.lateSurchargeRecalc?.newTierPct ?? s?.lateCheckoutSurcharge?.tierPct ?? 0;
  // DOM rules-v1.0.5 15.1–15.2 (review #106 2.1): the fee follows the time the guest LEFT. The page fills in the desk's
  // clock (KB7) – left as it is, a guest who handed the key in at 11:40 is charged at the click (12:10). While the time
  // is still the one filled in and it costs the guest something, the box stands out for the desk to check.
  const timePrefilled = !!time && !timeTouched;
  const timePrefilledCharged = timePrefilled && (lateNew > 0 || extraNightNeeded);
  // 0.3.6 add. 2: only credit not yet covered by a refund request needs a decision.
  const credit0 = s?.unhandledCreditVnd ?? s?.creditVnd ?? 0;
  // S4-47 / ARC 0.3.7 bổ sung 4: what B18 leaves due at this time is the SERVER's figure (late charge
  // re-priced, extra night stepped, FOC that follows, credit, clamped once) – never summed here.
  const typedDueNow = rateTyped && typedDue?.key === typedKey ? typedDue : null;
  const dueComputing = rateTyped && !typedDueNow;
  // BUG-R2-139: the room is sold tonight (`extraNightAvailable = false`) → no extra night can be posted, so the
  // server's due (which prices it at the default rate) is not what is owed: the folio balance is (no night added,
  // none sent to a QR). What to charge instead waits for DOM (e.g. a late fee approved by the manager).
  const lateFeeAsNight = extraUnavailable ? s?.lateFeeAsNightVnd : undefined;
  const lateFeeMode = lateFeeAsNight !== undefined && lateFeeAsNight > 0;
  // BUG-R4-038 (BE #71, BR-421 R4): an Internal stay's night is 0 ₫, so its one-night late fee is 0 – nothing to
  // charge, nothing for a manager to confirm, and `lateFeeInsteadOfNight` is refused (422 NOT_ALLOWED): B18 goes on
  // without it, at the server's due. Other channels: unchanged (a fee above 0, or an older server without one).
  const lateFeeFree = lateFeeAsNight === 0;
  // ESC-031: recorded now, reviewed later – the server's number read-only, a reason, nothing else (no FOC, no password).
  const lfReview = lateFeeMode && lfModeNow === 'review';
  const lfFocVnd =
    lateFeeMode && !lfReview && lfFoc.on ? amountOf(lfFocAmount) || (lateFeeAsNight ?? 0) : 0;
  const lfFocBody =
    lfFocVnd > 0 ? surchargeFocBody(lfFoc, Math.min(lfFocVnd, lateFeeAsNight ?? 0)) : undefined;
  const lfFocError =
    lfFocVnd > (lateFeeAsNight ?? 0)
      ? t('foc.over_max', { amount: money(lateFeeAsNight ?? 0) })
      : act.fields['lateFeeInsteadOfNight.requestFoc.amountVnd'];
  // What the summary of the box shows as waived: the amount that would be sent (never above the fee).
  const lfFocShown = lfFocBody?.amountVnd ?? 0;
  // SEC FB-R2-SEC-FE-08: one sentence for any failed confirmation – never "wrong name" vs "wrong password" –
  // and a lock (429) says it is temporary.
  const lfAuthError =
    !lateFeeMode || lfReview
      ? undefined
      : act.code === 'REAUTH_FAILED'
        ? t('co.late_fee_auth_failed')
        : act.code === 'RATE_LIMITED'
          ? t('co.late_fee_locked', {
              minutes:
                isApiError(act.error) && act.error.retryAfterSeconds !== undefined
                  ? Math.max(1, Math.ceil(act.error.retryAfterSeconds / 60))
                  : 15,
            })
          : undefined;
  // ESC-031: what the server answered about the fee itself – said in place, in the desk's words.
  const lfNotice = (() => {
    const e = act.error;
    if (!isApiError(e)) return undefined;
    // 409 SURCHARGE_CHANGED: the summary is read again – the new number is on screen, nothing was written.
    if (e.code === 'SURCHARGE_CHANGED' && lfReview) {
      const fee = Number((e.problem as Record<string, unknown>).surchargeVnd);
      return t('co.late_fee_pr_changed', {
        amount: money(Number.isFinite(fee) ? fee : (lateFeeAsNight ?? 0)),
      });
    }
    // 422 NOT_ALLOWED on the fee: the night can be sold again (the arrival moved) – an extra night instead (step 2).
    if (lateFeeNotAllowed(e)) return t('co.late_fee_pr_not_allowed');
    return undefined;
  })();
  const actView = () =>
    lfAuthError ? (
      // ESC-031: with 2FA a password alone is always refused – point to the path that needs none.
      <Alert tone="bad">
        {lfAuthError} {t('co.late_fee_auth_try_review')}
      </Alert>
    ) : lfNotice ? (
      <Alert tone="warn">{lfNotice}</Alert>
    ) : (
      act.view()
    );
  const lfReady =
    !lateFeeMode ||
    (lfReview
      ? lfReason.trim().length >= 3
      : lfReason.trim().length >= 3 &&
        (mgr || lfUser.trim().length > 0) &&
        lfSecret.length > 0 &&
        !surchargeFocMissing(t, lfFoc) &&
        lfFocVnd <= (lateFeeAsNight ?? 0));
  const dueAtCheckout = extraUnavailable
    ? // 0.3.7 bổ sung 4: the server's due then includes the one-night late fee and never the unsold night;
      // an older server without `lateFeeAsNightVnd` → the folio balance (BUG-R2-139). A fee of 0 (BUG-R4-038):
      // the server's due too – it already takes back a late charge B18 reverses.
      lateFeeMode || lateFeeFree
      ? // the FOC asked in this B18 call is not known to the summary (like H13 – BR-402): taken off here.
        Math.max(0, (s?.amountDueAtCheckoutVnd ?? 0) - (lfFocBody?.amountVnd ?? 0))
      : Math.max(0, s?.balanceDueVnd ?? 0)
    : ((rateTyped ? typedDueNow?.due : undefined) ??
      s?.amountDueAtCheckoutVnd ??
      s?.balanceDueVnd ??
      0);
  // BUG-R3-017: cash / POS card taken on this step for money B18 itself posts (one-night late fee, extra night) – more
  // than the folio owes now, so `recordPayment` would refuse it – goes with "Hoàn tất" as `finalPayment` (capped by the
  // server at what is due after those lines). Valid only while it is not above what is due now (the time, the fee or
  // a payment changed meanwhile → the desk collects again).
  const stagedOk = staged && staged.amountVnd <= dueAtCheckout ? staged : null;
  const stagedVnd = stagedOk?.amountVnd ?? 0;
  const balance = Math.max(0, dueAtCheckout - stagedVnd);
  const paidShown = (s?.paidVnd ?? 0) + stagedVnd;
  // BR-416-06: the late fee (less the waiver sent with it) is posted by B18 too – money taken for it before is
  // not a credit to hand back.
  const lateFeeNet = lateFeeMode ? Math.max(0, (lateFeeAsNight ?? 0) - lfFocShown) : 0;
  const credit =
    balance > 0
      ? 0
      : Math.max(0, credit0 - extraNightVnd - lateFeeNet - lateDelta - (s?.balanceDueVnd ?? 0));
  const pendingFoc = lines.filter((l) => l.lineState === 'pending_approval');
  const debtActive = mgr && debtOn && balance > 0;
  // checkout.service: due > business day (≥ business day + 1); default business day + `debt_default_due_days`.
  const debtMin = addDays(today, 1);
  const debtDuePast = !!debtDue && debtDue < debtMin;
  const debtReady = !!debtDue && !debtDuePast && debtReason.trim().length >= 3;
  const reload = () => {
    sum.reload();
    res.reload();
  };

  // Cabinets still to count (current room included when it is); the old room's first (BR-703-01).
  const toCount = s?.minibarUncheckedRooms ?? [];
  /**
   * FB-R4-UXD-FE-PR81-01 (a): where "Tiếp tục" on step 1 goes – the cabinet after the one on screen (latest summary,
   * less the cabinets counted on this page and the one on screen), named on the button; none → step 2.
   */
  const nextCabinet = toCount.find(
    (c) => !doneCabinets.has(c.roomId) && c.roomId !== countingRoomId,
  );
  /**
   * Back one step. Back to step 1 (BUG-R4-047, BUG-R4-045): the cabinet on screen and the summary are read again – the
   * first count of a cabinet never refilled opens its period on the server (the read on screen still had
   * `periodId: null` → 409 MINIBAR_PERIOD_CHANGED on the next count), and a cabinet may be due again since. The
   * figures shown are then its last count (`latestCheck`).
   */
  const back = () => {
    if (step === 1) {
      std.reload();
      sum.reload();
    }
    setStep((x) => x - 1);
  };
  /**
   * BUG-R4-042: after a cabinet is counted (or passed), the next one – from the LATEST summary read (not the one of
   * the press, a closure), less every cabinet counted on this page: the summary read after a count may not be in yet.
   * None left → step 2. Never back to a cabinet counted here. `true` = another cabinet is on screen now.
   */
  const goNextCabinet = (done: ReadonlyMap<string, string>) => {
    // The ref follows every summary committed (passive effects are flushed before the press and after `await`), so
    // it is never older than the render of the press. Absent `minibarUncheckedRooms` = none due.
    const next = (latestSummary.current?.minibarUncheckedRooms ?? []).find(
      (c) => !done.has(c.roomId),
    );
    if (next) {
      setCabinet(next.roomId === currentRoomId ? undefined : next.roomId);
      return true;
    }
    // BUG-R4-045: "Chưa kiểm minibar – làm bước 1" is done now – not carried to step 2.
    if (act.code === 'MINIBAR_NOT_CHECKED') act.reset();
    setStep(1);
    return false;
  };
  const saveMinibar = async () => {
    // ARC PR67-01: only on the standard read for the cabinet on screen – before the "nothing chargeable" branch,
    // which used to skip the count while the read was missing, failed or still of the previous cabinet.
    if (!stdForCabinet || !countingRoomId) return;
    // The desk counts the cabinet on screen: a first summary coming in meanwhile no longer picks the old cabinet
    // under it (ARC PR67-03) – the next cabinet is chosen once this one is counted.
    cabinetSettled.current = true;
    if (!chargeable) {
      // Nothing to count in this cabinet: passed, never offered again on this page.
      goNextCabinet(markDone(countingRoomId, cabinetNo(countingRoomId)));
      return;
    }
    // K11-03: the cabinet on screen, by name – never "absent = the room assigned now" (a B14 since would move
    // the count to another cabinet). Only on the standard read for that very cabinet.
    if (std.state.status !== 'ready') return;
    // BUG-R4-042: the cabinet counted, kept for after `await` (the screen may have moved on by then).
    const read = std.state.data;
    const counted = read.roomId ?? countingRoomId;
    const caught: { error?: unknown } = {};
    const out = await minibarAct.submit((idem) =>
      api
        .recordMinibarCheck(
          R,
          {
            mode: 'checkout',
            // ARC 16.19: the cabinet and period of the standard the figures were typed on (`MinibarStandard.roomId`
            // – read for `countingRoomId`); a refill or another cabinet since then → 409, nothing written.
            roomId: counted,
            periodId: read.periodId ?? null,
            lines: items.map((i) => ({
              itemId: i.itemId,
              remainingQty: left[i.itemId] ?? i.standardQty,
            })),
          },
          idem,
        )
        .catch((e: unknown) => {
          caught.error = e;
          throw e;
        }),
    );
    if (!out) {
      // The cabinet was restocked while the desk was counting: read it again and stay on this step – the
      // figures typed were for the old stock (never sent again on their own).
      if (isApiError(caught.error) && caught.error.code === 'MINIBAR_PERIOD_CHANGED') {
        // The count made again is a new command (other period, other figures) – never the old key.
        minibarAct.renewKey();
        std.reload();
        sum.reload();
      }
      return;
    }
    sum.reload();
    // The cabinet the figures were counted on (201) – not the one on screen now.
    const countedNo = cabinetNo(counted);
    // FB-R4-UXD-FE-PR81-01 (b): on to another cabinet – say this one is saved (step 2 says it by itself).
    if (goNextCabinet(markDone(counted, countedNo)))
      toast(t('co.minibar_cabinet_saved', { room: countedNo }));
  };

  const saveInvoice = async () => {
    const out = await invAct.submit(() =>
      api.setInvoiceRequest(
        { propertyId, folioId: r.folioId },
        invoice
          ? {
              buyerType: 'company',
              companyName: inv.companyName.trim(),
              taxCode: inv.taxCode.trim(),
              email: inv.email.trim() || undefined,
              address: inv.address.trim() || undefined,
            }
          : { buyerType: 'individual' },
      ),
    );
    if (out) toast(t('common.saved'));
  };

  const complete = async () => {
    const lateFee: LateFeeBody | undefined = !lateFeeMode
      ? undefined
      : lfReview
        ? // ESC-031: the number the server computed (read-only here), the reason, `postReview` – nothing else.
          { amountVnd: lateFeeAsNight ?? 0, reason: lfReason.trim(), postReview: true }
        : {
            amountVnd: lateFeeAsNight ?? 0,
            reason: lfReason.trim(),
            approverUsername: mgr ? lfUser.trim() || undefined : lfUser.trim(),
            authMethod: 'password',
            secret: lfSecret,
            requestFoc: lfFocBody,
          };
    const body: CheckOutBody = {
      checkoutTime: time || s?.checkoutTime || rules.checkoutTime,
      // V5-10: the instant the bill and the QR were priced at (T10-6) – the server uses it as is.
      checkoutAt,
      checkoutTimeNote: timeNote.trim() || undefined,
      applyLateSurcharge: lateRaise && lateTold,
      expectedSurchargeVnd: lateRaise && lateTold ? lateNew : undefined,
      // E05-11: after the last late tier the check-out itself adds one night at this rate.
      extraNight:
        extraNightNeeded && !extraUnavailable
          ? { rateVnd: extraEdited ? amountOf(extraRate) : undefined }
          : undefined,
      lateFeeInsteadOfNight: lateFee,
      // BUG-R3-017: the cash / POS card payment taken on this step, written in the same transaction after the lines
      // B18 posts (contract 0.3.7 S4-47: cap = what is due after them, 422 AMOUNT_EXCEEDS_BALANCE with `max`).
      finalPayment: stagedOk
        ? {
            type: 'charge',
            method: stagedOk.method,
            amountVnd: stagedOk.amountVnd,
            posAuthCode: stagedOk.posAuthCode,
          }
        : undefined,
      overpaymentHandling: credit > 0 ? { mode: overMode, reason: overReason.trim() } : undefined,
      // S4-26: only OWN/MGR (FD/FDL → 403 on the server too); only while something is left to collect.
      debt: debtActive ? { dueDate: debtDue, reason: debtReason.trim() } : undefined,
    };
    const caught: { error?: unknown } = {};
    const out = await act.submit((idem) =>
      api.checkOut(R, body, r.version, idem).catch((e: unknown) => {
        caught.error = e;
        throw e;
      }),
    );
    setConfirm(false);
    // The manager's password is never kept after the call (SEC – it is typed for this one confirmation).
    setLfSecret('');
    if (!out) {
      sum.reload();
      const e = caught.error;
      // BUG-R4-045: a cabinet is still to count – back to step 1 with it once the summary just asked for is in.
      if (isApiError(e) && e.code === 'MINIBAR_NOT_CHECKED') setMinibarResync(true);
      // BUG-R3-024: 409 INVALID_TRANSITION – e.g. the stay was extended meanwhile: the booking is read again, and a
      // departure that is no longer today turns this page into the Trả sớm pointer (never "vừa chuyển sang Đang ở").
      if (isApiError(e) && (e.code === 'VERSION_CONFLICT' || e.code === 'INVALID_TRANSITION'))
        res.reload();
      // ESC-031: the fee changed (409) or no longer applies (422 NOT_ALLOWED) – the next "Hoàn tất" is a new command
      // with other figures (never a replay of this one); the night sellable again → back to step 2 (extra night).
      if (isApiError(e) && e.code === 'SURCHARGE_CHANGED' && lateFee) act.renewKey();
      if (lateFeeNotAllowed(e)) {
        act.renewKey();
        setStep(1);
      }
      // KB7 (3): a time problem is fixed where the time and its note are – back to step 2, note focused.
      if (
        isApiError(e) &&
        e.fieldErrors.some((fe) => TIME_FIELDS.includes(fe.field.replace(/^body\./, '')))
      ) {
        if (e.fieldErrors.some((fe) => fe.code === 'TIME_NOTE_REQUIRED')) {
          setNoteAsked(true);
          setFocusNote(true);
        }
        setStep(1);
      }
      return;
    }
    toast(t('checkout.done'));
    setStaged(null);
    const doneFolioId = out.data.reservation?.folioId ?? r.folioId;
    setDone({ billNo: out.data.billNo, folioId: doneFolioId });
    setDoneFolio(null);
    loadDoneFolio(doneFolioId);
    res.reload();
  };

  // KB7 (1): a higher late surcharge is written to the folio (B15 at the actual time, the amount the desk saw
  // and told the guest – BR-414) before the bill step, so step 3 collects it with everything else.
  // S4-48 / BUG-R2-088: the reason says what to do (tick the box), not the box's own label.
  const lateWhy = timeAfterNow
    ? t('field.TIME_AFTER_ACTION')
    : // FB-R5-UXD-FE-PR125-02: the server already said B18 will ask for the note – no going on with it empty
      // (else the desk collects the money, then "Hoàn tất" sends them back to this step).
      timedSummary && s.checkoutTimeNoteRequired && !timeNote.trim()
      ? t('field.TIME_NOTE_REQUIRED')
      : extraRangeError
        ? extraRangeError
        : dueComputing
          ? t('checkout.due_computing')
          : lateRaise && !lateTold
            ? t('co.go_bill_needs_told')
            : lateRaise
              ? surchargeFocMissing(t, lateFoc)
              : null;
  const goBill = async () => {
    if (toBill || lateAct.busy) return;
    if (!priced) {
      setWantBill(true);
      return;
    }
    if (lateWhy) return;
    if (!lateRaise) {
      setStep(2);
      return;
    }
    const caught: { error?: unknown } = {};
    const out = await lateAct.submit((idem) =>
      api
        .setLateCheckout(
          R,
          {
            checkoutTime: time,
            dryRun: false,
            applySurcharge: true,
            expectedSurchargeVnd: lateNew,
            requestFocForSurcharge: surchargeFocBody(lateFoc, lateNew),
          },
          r.version,
          idem,
        )
        .catch((e: unknown) => {
          caught.error = e;
          throw e;
        }),
    );
    sum.reload();
    res.reload();
    if (!out) {
      // A new amount must be confirmed again (the tick belongs to the amount the desk told the guest).
      if (isApiError(caught.error) && caught.error.code === 'SURCHARGE_CHANGED') setLateTold(false);
      return;
    }
    setToBill(true);
  };
  goBillRef.current = () => void goBill();
  const changeTime = (v: string) => {
    setTime(v);
    setTimeTouched(true);
    setLateTold(false);
    // KB7 (4): the red "earlier than the click" line was about the old time – a new time clears it (B18 checks
    // again on "Hoàn tất").
    act.reset();
    lateAct.reset();
    if (!timeNote.trim()) setNoteAsked(false);
  };

  const openBill = async () => {
    try {
      setBill((await api.getBill({ propertyId, folioId: r.folioId })).data);
    } catch (e) {
      act.setError(e);
    }
  };

  const steps = (
    <ol className="progress-steps" aria-label={t('checkout.steps_label')}>
      {STEPS.map((k, i) => (
        <li
          key={k}
          className={i < step ? 'done' : undefined}
          aria-current={i === step ? 'step' : undefined}
        >
          {t(k)}
        </li>
      ))}
    </ol>
  );

  // GN-R4-QA-03: under "Còn phải thu" on step 3 and on the result – the desk tells the guest what Trả sớm still owes.
  // UXD P432-01: a request still waiting for a decision may go down at approval – said in the same cell (one row).
  // UXD P432-03: a failed read is said (muted, no retry, never blocking) – never mistaken for "nothing to hand back".
  const pendingRefundRow = edRefundUnread ? (
    <tr className="sub">
      <td colSpan={2}>{t('checkout.pending_refund_unavailable')}</td>
    </tr>
  ) : edRefundVnd > 0 ? (
    <tr className="sub">
      <td colSpan={2}>
        {t('checkout.pending_refund_line', { amount: money(edRefundVnd) })}
        {edRefundMayDecrease ? (
          <div className="li-s">{t('approvals.refund_may_decrease')}</div>
        ) : null}
      </td>
    </tr>
  ) : null;

  const summaryCard = (
    <section className="card" aria-labelledby={`${ids}-sum`}>
      <h2 className="label-h" id={`${ids}-sum`}>
        {t('drawer.folio.title')}
      </h2>
      {done ? (
        doneFolio ? (
          <table className="sum">
            <tbody>
              {doneFolio.lines.map((l) => (
                <tr key={l.id} className={l.lineState === 'pending_approval' ? 'sub' : undefined}>
                  <td>
                    {lineLabel(t, l)} <FocStateChip line={l} lines={doneFolio.lines} />
                  </td>
                  <td className="r num">{signed(vnd, l.amountVnd)}</td>
                </tr>
              ))}
              {(doneFolio.totals.paidVnd ?? 0) > 0 ? (
                <tr className="sub">
                  <td>{t('drawer.folio.paid')}</td>
                  <td className="r num">−{vnd(doneFolio.totals.paidVnd ?? 0)}</td>
                </tr>
              ) : null}
              {(doneFolio.totals.refundedVnd ?? 0) > 0 ? (
                <tr className="sub">
                  <td>{t('drawer.folio.refunded')}</td>
                  <td className="r num">+{vnd(doneFolio.totals.refundedVnd ?? 0)}</td>
                </tr>
              ) : null}
              <tr className="total">
                <td>{t('checkout.summary.balance')}</td>
                <td className="r num" aria-live="polite">
                  {money(doneFolio.totals.balanceDueVnd ?? 0)}
                </td>
              </tr>
              {pendingRefundRow}
            </tbody>
          </table>
        ) : doneFolioError ? (
          <ErrorBlock
            titleKey="co.error_title"
            error={doneFolioError}
            onRetry={() => loadDoneFolio(done.folioId)}
          />
        ) : (
          <LoadingBlock rows={2} />
        )
      ) : !s ? (
        <LoadingBlock rows={2} />
      ) : (
        <table className="sum">
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className={l.lineState === 'pending_approval' ? 'sub' : undefined}>
                <td>
                  {lineLabel(t, l)} <FocStateChip line={l} lines={lines} />
                  {l.lineState === 'pending_approval' && !FOC_CATEGORIES.includes(l.category) ? (
                    <>
                      {' '}
                      <Chip tone="warn" icon="hourglass">
                        {t('approval.status.pending')}
                      </Chip>
                    </>
                  ) : null}
                  {/* S4-25: ask a FOC / discount on a charge (minibar self-waiver BR-436 included). */}
                  {!done && online && canAskFoc(lines, l) ? (
                    <>
                      {' '}
                      <Button size="sm" variant="ghost" onClick={() => setFocLine(l)}>
                        {t('foc.open_form')}
                      </Button>
                    </>
                  ) : null}
                </td>
                <td className="r num">{signed(vnd, l.amountVnd)}</td>
              </tr>
            ))}
            {extraNightVnd > 0 ? (
              <tr>
                <td>
                  {lineLabel(t, {
                    category: 'room',
                    serviceDate: r.departureDate,
                    description: 'extra_night',
                    labelKey: 'bill.line.extra_night',
                    labelParams: { date: r.departureDate },
                  } as unknown as FolioLine)}
                  {/* DOM S4-38: the calendar price; the step BR-107 is in the amount due below. */}
                  {` · ${t('rate.pre_tier_short')}`}
                </td>
                <td className="r num">{vnd(extraNightVnd)}</td>
              </tr>
            ) : null}
            {/* BUG-R2-087: what the server's "Còn phải thu" already counts but no folio line shows yet – the late
                surcharge at this time (written by B18 or on the way to the bill) and the one-night late fee. */}
            {lateDelta !== 0 ? (
              <tr>
                <td>
                  {lateOld === 0
                    ? t('co.late_row_new', { time: s.checkoutTime ?? time, pct: lateTier })
                    : lateNew > 0
                      ? t('co.late_row_change', { time: s.checkoutTime ?? time, pct: lateTier })
                      : t('co.late_row_reversed')}
                </td>
                <td className="r num">{signed(vnd, lateDelta)}</td>
              </tr>
            ) : null}
            {lateFeeMode ? (
              <tr>
                <td>{t('co.late_fee_row')}</td>
                <td className="r num">{vnd(lateFeeAsNight ?? 0)}</td>
              </tr>
            ) : null}
            {lateFeeMode && lfFocShown > 0 ? (
              <tr className="sub">
                <td>{t('co.late_fee_sum_foc')}</td>
                <td className="r num">−{vnd(lfFocShown)}</td>
              </tr>
            ) : null}
            {s.paidVnd > 0 ? (
              <tr className="sub">
                <td>{t('drawer.folio.paid')}</td>
                <td className="r num">−{vnd(s.paidVnd)}</td>
              </tr>
            ) : null}
            {stagedOk ? (
              <tr className="sub">
                <td>
                  {t('co.pay_at_complete_row', { method: t(PAY_METHOD_KEY[stagedOk.method]) })}
                </td>
                <td className="r num">−{vnd(stagedOk.amountVnd)}</td>
              </tr>
            ) : null}
            <tr className="total">
              <td>{t('checkout.summary.balance')}</td>
              <td className="r num" aria-live="polite">
                {money(balance)}
              </td>
            </tr>
            {extraUnavailable ? (
              <tr className="sub">
                <td colSpan={2}>
                  {lateFeeMode
                    ? t('co.late_fee_as_night_line', { amount: money(lateFeeAsNight ?? 0) })
                    : t('checkout.due_without_extra_night')}
                </td>
              </tr>
            ) : null}
            {step === 2 ? pendingRefundRow : null}
          </tbody>
        </table>
      )}
    </section>
  );

  const focPending = pendingFoc.map((l) => (
    <Alert key={l.id} tone="warn">
      {t('co.foc_pending', { amount: money(Math.abs(l.amountVnd)) })}{' '}
      <Link to="/approvals">{t('co.see_approval')}</Link>
    </Alert>
  ));

  const lfReasonField = (
    <Field
      label={t('co.late_fee_reason')}
      required
      error={act.fields['lateFeeInsteadOfNight.reason']}
    >
      {(p) => (
        <input
          {...p}
          className="input"
          maxLength={300}
          value={lfReason}
          onChange={(e) => setLfReason(e.target.value)}
        />
      )}
    </Field>
  );

  let body = null;
  if (done) {
    body = (
      <div className="card stack" role="status">
        <b>{t('checkout.done')}</b>
        <p>{monoArgs(t, 'co.done_tasks', { bill: done.billNo }, ['bill'])}</p>
        <div className="row wrap">
          <Button icon="printer" onClick={() => void openBill()}>
            {t('co.preview_bill')}
          </Button>
          <Link className="btn" to={`/reservations/${reservationId}`}>
            {t('ci.back_to_booking')}
          </Link>
        </div>
      </div>
    );
  } else if (step === 0) {
    const adjusted = (std.state.data?.items ?? []).filter((i) => i.adjustedAfterLastCheck);
    // BUG-R2-144 / ARC 16.14: the cabinet being counted is due again (`stay_continued` – back in the room or
    // extended after the count; `new_fill` – a new refill period); any other value but `never_counted` too.
    const countingRoomNo = cabinetNo(countingRoomId);
    const cabinetLabel = (roomId: string, roomNo: string) =>
      roomId === currentRoomId
        ? t('co.minibar_cabinet_room', { room: roomNo })
        : t('co.minibar_cabinet_old', { room: roomNo });
    const due = toCount.find((c) => c.roomId === countingRoomId);
    // FE-S4-23 (UXD): why it is counted again, by `reason`; the general sentence for an unknown value / an older
    // server without `reason`.
    const recountBodyKey =
      (
        {
          stay_continued: 'co.minibar_recount_body_stay_continued',
          new_fill: 'co.minibar_recount_body_new_fill',
          not_today: 'co.minibar_recount_body_not_today',
        } as Record<string, string>
      )[due?.reason ?? ''] ?? 'co.minibar_recount_body';
    const recount = !due
      ? false
      : due.reason !== undefined
        ? due.reason !== 'never_counted'
        : // a server before 16.14 (no `reason`): a count or a charged line of this period, yet still to count
          !std.state.data?.latestCheck &&
          (std.state.data?.items ?? []).some(
            (i) => typeof i.lastCheckUsedQty === 'number' || !!i.folioLineId,
          );
    body = (
      <section className="card stack">
        {cabinets.length > 1 ? (
          // BR-703-01 (M-1): after B14 the old room's cabinet is counted as at check-out, then this one.
          <div className="field">
            <span className="label-h" id={`${ids}-cab`}>
              {t('co.minibar_cabinet')}
            </span>
            <Seg
              labelledBy={`${ids}-cab`}
              options={cabinets.map((c) => ({
                value: c.roomId,
                label: cabinetLabel(c.roomId, c.roomNo ?? ''),
              }))}
              value={cabinet ?? currentRoomId}
              onChange={(v) => {
                cabinetSettled.current = true;
                minibarAct.reset();
                setCabinet(v === currentRoomId ? undefined : v);
              }}
            />
          </div>
        ) : severalCabinets ? (
          // K11-03 (BUG-R4-042): one cabinet left of several – the others counted on this page – still named here; the
          // title names the room of today, whichever cabinet is on screen.
          <dl className="dl">
            <dt>{t('co.minibar_cabinet_counting')}</dt>
            <dd>{cabinetLabel(countingRoomId ?? currentRoomId, countingRoomNo)}</dd>
          </dl>
        ) : null}
        {recount ? (
          // BUG-R2-144 (BR-703-02): a cabinet counted before is due again – a new count of this period.
          <Alert tone="warn" title={t('co.minibar_recount_title', { room: countingRoomNo })}>
            {t(recountBodyKey)}
          </Alert>
        ) : null}
        {adjusted.length ? (
          <Alert tone="warn" title={t('co.minibar_folio_adjusted')}>
            <ul className="list-plain">
              {adjusted.map((i) => (
                <li key={i.itemId}>
                  {t('co.minibar_folio_vs_count', {
                    item: i.itemName,
                    folio: i.folioUsedQty ?? 0,
                    count: i.lastCheckUsedQty ?? 0,
                  })}
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}
        {!std.state.data || std.state.status === 'error' ? (
          std.state.status === 'error' ? (
            <ErrorBlock titleKey="co.error_title" error={std.state.error} onRetry={std.reload} />
          ) : (
            <LoadingBlock rows={3} />
          )
        ) : !chargeable ? (
          <p>{t('checkout.minibar.empty')}</p>
        ) : (
          <>
            {/* FE-S3-14: only with the name of who checked (MinibarCheck has no name yet – ARC). */}
            {std.state.data.latestCheck?.mode === 'checkout' &&
            std.state.data.latestCheck.checkedAt &&
            (std.state.data.latestCheck as { checkedByName?: string }).checkedByName ? (
              <Alert tone="info">
                {t('checkout.minibar.from_hk', {
                  time: timeHHmm(new Date(std.state.data.latestCheck.checkedAt)),
                  who:
                    (std.state.data.latestCheck as { checkedByName?: string }).checkedByName ?? '',
                })}
              </Alert>
            ) : null}
            {/* UXD FB-R4-UXD-FE-PR67-01: read again (another cabinet after B14, a new period, a retry) – the list on
                screen is the previous read: locked and marked busy until the new one is in (figures typed now
                would be dropped without a word). The first read shows LoadingBlock above. */}
            <div className="table-wrap" aria-busy={!stdForCabinet || undefined}>
              <table className="table">
                <caption className="sr-only">{t('checkout.step.minibar')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('co.item')}</th>
                    {/* UXR P-18 (1366×768): the standard sits next to "left" – one column less, the amount
                        column is never cut. */}
                    <th scope="col" className="c">
                      {t('checkout.minibar.left_of_std')}
                    </th>
                    <th scope="col" className="c">
                      {t('checkout.minibar.used')}
                    </th>
                    <th scope="col" className="r">
                      {t('co.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => {
                    const rem = left[i.itemId] ?? i.standardQty;
                    const used = i.standardQty - rem;
                    return (
                      <tr key={i.itemId}>
                        <th scope="row" id={`${ids}-i${idx}`}>
                          {i.itemName}
                          {i.isFree
                            ? ` · ${t('checkout.minibar.free')}`
                            : ` · ${vnd(i.unitPriceVnd ?? 0)}`}
                        </th>
                        <td className="c">
                          <span className="row tight">
                            <Stepper
                              value={rem}
                              min={0}
                              max={i.standardQty}
                              onChange={(v) => editLeft({ [i.itemId]: v })}
                              labelledBy={`${ids}-i${idx}`}
                              decLabel={t('rooms.dec')}
                              incLabel={t('rooms.inc')}
                              disabled={!stdForCabinet}
                            />
                            <span className="li-s num">/ {i.standardQty}</span>
                          </span>
                        </td>
                        <td className="c num">{used}</td>
                        {/* a free item says so in its name – the amount column only carries figures */}
                        <td className="r num">
                          {i.isFree ? vnd(0) : vnd(used * (i.unitPriceVnd ?? 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="num">
              <b>
                {t('co.minibar_total')}: {vnd(minibarTotal)}
              </b>
            </p>
            {minibarAct.code === 'MINIBAR_PERIOD_CHANGED' ? (
              <Alert tone="warn" title={t('co.minibar_period_changed_title')}>
                {t('co.minibar_period_changed_body')}
              </Alert>
            ) : (
              minibarAct.view({ max: minibarMax })
            )}
          </>
        )}
      </section>
    );
  } else if (step === 1) {
    const timeError =
      act.fields.checkoutTime ?? (timeAfterNow ? t('field.TIME_AFTER_ACTION') : undefined);
    // FB-R5-UXD-FE-PR125-01: the brown ring is only a second sign – the sentence says the time was filled in by Desk and
    // costs the guest money (DOM 15.1: key returned 11:40, clicked 12:10). PR125-03: an error is the only thing shown.
    const prefilledHint = timePrefilledCharged && !timeError;
    const timeHelp = [
      r.agreedCheckoutTime ? t('co.time_from_late', { time: r.agreedCheckoutTime }) : '',
      prefilledHint ? t('checkout.time_prefilled_help') : '',
    ]
      .filter(Boolean)
      .join(' ');
    body = (
      <section className="card stack">
        <Field label={t('checkout.departure_time')} help={timeHelp || undefined} error={timeError}>
          {(p) => (
            <input
              {...p}
              type="time"
              className={`input${prefilledHint ? ' is-prefilled' : ''}`}
              data-prefilled={timePrefilled || undefined}
              value={time}
              onChange={(e) => changeTime(e.target.value)}
            />
          )}
        </Field>
        {s?.postMidnightWindow ? <Alert tone="info">{t('checkout.post_midnight')}</Alert> : null}
        {/* V5-10: the server says B18 will ask for the note (`checkoutTimeNoteRequired`) – the box is there first. */}
        {noteAsked ||
        act.fields.checkoutTimeNote ||
        timeNote ||
        (timedSummary && s.checkoutTimeNoteRequired) ? (
          <Field
            label={t('checkout.time_note')}
            help={t('stay.time_note_help')}
            required
            error={act.fields.checkoutTimeNote}
          >
            {(p) => (
              <input
                {...p}
                ref={noteRef}
                className="input"
                maxLength={300}
                value={timeNote}
                onChange={(e) => {
                  setTimeNote(e.target.value);
                  if (act.fields.checkoutTimeNote) act.reset();
                }}
              />
            )}
          </Field>
        ) : null}
        {extraNightNeeded ? (
          // E05-11: one more night instead of a late surcharge; the rate defaults to the direct
          // calendar price of that night. The room taken tonight → no extra night possible. BUG-R4-038: a fee of 0
          // (Internal) – nothing to charge, no alert here (the summary line `due_without_extra_night` says it).
          extraUnavailable ? (
            lateFeeMode ? (
              // BR-416-06: no night is added; a late fee of one night, confirmed by a manager at the desk.
              <Alert tone="warn" title={t('checkout.extra_night_title')}>
                {t('co.late_fee_as_night_body', { amount: money(lateFeeAsNight ?? 0) })}
              </Alert>
            ) : lateFeeFree ? null : (
              <Alert tone="bad" title={t('checkout.extra_night_title')}>
                {t('checkout.extra_night_unavailable')}
              </Alert>
            )
          ) : (
            <div className="stack">
              <Alert tone="warn" title={t('checkout.extra_night_title')}>
                {t('checkout.extra_night_body', { amount: money(extraNightVnd) })}
              </Alert>
              <MoneyField
                label={t('checkout.extra_night_rate_label')}
                help={
                  extraFloor !== undefined && extraCeiling !== undefined
                    ? `${t('checkout.extra_night_rate_help_tier')} ${t(
                        'checkout.extra_night_range',
                        {
                          min: money(extraFloor),
                          max: money(extraCeiling),
                        },
                      )}`
                    : t('checkout.extra_night_rate_help_tier')
                }
                required
                value={extraRate || vnd(s?.extraNightDefaultRateVnd ?? 0)}
                onChange={setExtraRate}
                error={extraRangeError ?? act.fields['extraNight.rateVnd'] ?? act.fields.extraNight}
              />
              {dueComputing ? (
                <p className="li-s" role="status">
                  {t('checkout.due_computing')}
                </p>
              ) : typedDueNow?.failed ? (
                <p className="li-s" role="status">
                  {t('checkout.typed_due_failed')}
                </p>
              ) : null}
            </div>
          )
        ) : null}
        <div aria-live="polite">
          {extraNightNeeded ? null : lateAmount > 0 ? (
            <p>
              <b>
                {t('checkout.late_fee', {
                  amount: money(lateAmount),
                  pct: s?.lateCheckoutSurcharge?.tierPct ?? 0,
                })}
              </b>
            </p>
          ) : (
            <p>{t('checkout.late_none')}</p>
          )}
          {s?.lateSurchargeRecalc && lateOld !== lateNew ? (
            <Alert tone="info">
              {t('checkout.late_recalc', {
                old: money(s.lateSurchargeRecalc.oldVnd ?? 0),
                new: money(s.lateSurchargeRecalc.newVnd ?? 0),
              })}
            </Alert>
          ) : null}
        </div>
        {lateRaise ? (
          // SURCHARGE_DECISION_REQUIRED (0.3.6): a higher surcharge needs the desk's decision – required.
          <>
            <Checkbox checked={lateTold} onChange={setLateTold}>
              {t('ci.told_guest')} *
            </Checkbox>
            <SurchargeFocFields
              value={lateFoc}
              onChange={setLateFoc}
              error={lateAct.fields['requestFocForSurcharge.note']}
            />
          </>
        ) : null}
        {lateAct.view()}
        {/* The amount and its tick are on this step now (KB7) – the "use Trả muộn" hint only before any fee. */}
        {!r.agreedCheckoutTime && lateNew === 0 ? (
          // S4-48: the standard check-out time comes from BookingRules (BR-401), not a fixed 12:00.
          <p className="li-s">{t('co.late_switch_hint_time', { time: rules.checkoutTime })}</p>
        ) : null}
        <h3 className="label-h">{t('co.extras_title')}</h3>
        <div className="row wrap">
          {EXTRAS.map((x) => (
            <Button key={x.key} size="sm" disabled={!online} onClick={() => setExtra(x.preset)}>
              {t(x.key)}
            </Button>
          ))}
        </div>
        {focPending}
      </section>
    );
  } else {
    body = (
      <div className="stack">
        {/* S4-25 / BR-426: a FOC still waiting blocks "Hoàn tất" – said on the bill step too. */}
        {focPending}
        {/* BR-416-06: decided before collecting – the optional waiver changes what the guest pays now. */}
        {lateFeeMode ? (
          <section className="card stack" aria-labelledby={`${ids}-lf`}>
            <h3 className="label-h" id={`${ids}-lf`}>
              {lfReview
                ? t('co.late_fee_pr_title', { amount: money(lateFeeAsNight ?? 0) })
                : t('co.late_fee_confirm_title', { amount: money(lateFeeAsNight ?? 0) })}
            </h3>
            {/* ESC-031: recorded now and reviewed by OWN/MGR afterwards (default), or confirmed at the desk – kept
                only where 2FA is not enforced (SEC 8.6). */}
            <Seg<LateFeeMode>
              label={t('co.late_fee_mode')}
              value={lfModeNow}
              disabled={act.busy}
              onChange={(v) => {
                setLfMode(v);
                act.reset();
              }}
              options={
                deskConfirm
                  ? [
                      { value: 'review', label: t('co.late_fee_mode_review') },
                      { value: 'desk', label: t('co.late_fee_mode_desk') },
                    ]
                  : // 2FA enforced: the name staff look for (staff-one-pager step 3), no password panel at all.
                    [{ value: 'review', label: t('co.late_fee_mode_review') }]
              }
            />
            {lfReview ? (
              <>
                <p className="li-s">{t('co.late_fee_pr_help')}</p>
                {/* The server's number, read-only: no box to change it, no waiver here (A32 later, by a manager). */}
                <dl className="dl" aria-label={t('co.late_fee_pr_sum')}>
                  <dt>{t('co.late_fee_sum_fee')}</dt>
                  <dd className="num">{money(lateFeeAsNight ?? 0)}</dd>
                </dl>
                {lfReasonField}
              </>
            ) : (
              <>
                <p className="li-s">{t('co.late_fee_confirm_help')}</p>
                {lfReasonField}
                {/* Optional waiver of that fee – applied by the confirming manager within their limit (BR-433). */}
                <SurchargeFocFields
                  value={lfFoc}
                  onChange={setLfFoc}
                  label={t('co.late_fee_foc')}
                  error={act.fields['lateFeeInsteadOfNight.requestFoc.note']}
                />
                {lfFoc.on ? (
                  <MoneyField
                    label={t('foc.amount')}
                    help={t('foc.max', { amount: money(lateFeeAsNight ?? 0) })}
                    required
                    value={lfFocAmount || vnd(lateFeeAsNight ?? 0)}
                    onChange={setLfFocAmount}
                    error={lfFocError}
                  />
                ) : null}
                {/* SEC FB-R2-SEC-FE-08: what the manager allows, right above where they type their password. */}
                <dl className="dl" aria-label={t('co.late_fee_sum_title')}>
                  <dt>{t('co.late_fee_sum_fee')}</dt>
                  <dd className="num">{money(lateFeeAsNight ?? 0)}</dd>
                  <dt>{t('co.late_fee_sum_foc')}</dt>
                  <dd className="num">{lfFocShown > 0 ? `− ${money(lfFocShown)}` : money(0)}</dd>
                  <dt>{t('co.late_fee_sum_guest')}</dt>
                  <dd className="num">{money(Math.max(0, (lateFeeAsNight ?? 0) - lfFocShown))}</dd>
                </dl>
                {/* No <form> and no username/password pair: the counter browser must not offer to save or fill
                the manager's password (SEC FE-08); the password is cleared after every call. */}
                <Field
                  label={t('co.late_fee_approver')}
                  required={!mgr}
                  help={mgr ? t('co.late_fee_approver_self') : undefined}
                  error={act.fields['lateFeeInsteadOfNight.approverUsername']}
                >
                  {(p) => (
                    <input
                      {...p}
                      className="input"
                      name="lf-confirming-manager"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={100}
                      value={lfUser}
                      onChange={(e) => setLfUser(e.target.value)}
                    />
                  )}
                </Field>
                <Field
                  label={t('co.late_fee_secret')}
                  required
                  error={lfAuthError ?? act.fields['lateFeeInsteadOfNight.secret']}
                >
                  {(p) => (
                    <input
                      {...p}
                      type="password"
                      className="input"
                      name="lf-confirming-secret"
                      autoComplete="new-password"
                      value={lfSecret}
                      onChange={(e) => setLfSecret(e.target.value)}
                    />
                  )}
                </Field>
              </>
            )}
          </section>
        ) : null}
        <section className="card stack">
          <p className="kv-big num">
            {t('bill.total')}: {money(s?.totalVnd ?? 0)}
          </p>
          {staged ? (
            // BUG-R3-017: collected, written with "Hoàn tất"; "Bỏ" if it was a mistake or the due changed.
            <Alert
              tone={stagedOk ? 'info' : 'warn'}
              actions={
                <Button
                  size="sm"
                  disabled={act.busy}
                  onClick={() => {
                    setStaged(null);
                    act.renewKey();
                  }}
                >
                  {t('co.pay_at_complete_undo')}
                </Button>
              }
            >
              {stagedOk
                ? t('co.pay_at_complete', {
                    method: t(PAY_METHOD_KEY[staged.method]),
                    amount: money(staged.amountVnd),
                  })
                : t('co.pay_at_complete_changed', { amount: money(staged.amountVnd) })}
              {stagedOk && balance > 0
                ? ` ${t('co.pay_at_complete_remaining', { amount: money(balance) })}`
                : ''}
            </Alert>
          ) : balance > 0 ? (
            online ? (
              <PaymentPanel
                reservation={r}
                balanceVnd={balance}
                checkout={{
                  checkoutAt,
                  // 0.3.13 bổ sung 1: the QR would be refused (TIME_AFTER_ACTION) – off, the reason is by "Hoàn tất".
                  qrOff: timeAfterNow,
                  // ARC 16.18: the same rule as B18 – only a rate the desk changed.
                  extraNightRateVnd:
                    extraNightNeeded && !extraUnavailable && extraEdited
                      ? amountOf(extraRate)
                      : undefined,
                  lateFeeAsNight: lateFeeMode || undefined,
                  // BUG-R3-017: cash / card above what the folio owes now → with "Hoàn tất" (`finalPayment`).
                  folioBalanceVnd: Math.max(0, s?.balanceDueVnd ?? 0),
                  onStage: (p) => {
                    setStaged(p);
                    // the next B18 carries another body – a new command, never a replay of an earlier refusal
                    act.renewKey();
                    act.reset();
                  },
                }}
                onPaid={reload}
                onStale={reload}
              />
            ) : (
              <p className="li-s">{t('rsv.need_online')}</p>
            )
          ) : (
            <Chip tone="ok">{t('drawer.folio.settled')}</Chip>
          )}
          <p className="li-s">{t('co.recon_explain')}</p>
          {balance > 0 ? <p className="li-s">{t('co.partial_hint')}</p> : null}
        </section>
        {mgr && balance > 0 ? (
          <section className="card stack" aria-label={t('co.debt_toggle')}>
            <Switch checked={debtOn} onChange={setDebtOn}>
              {t('co.debt_toggle')}
            </Switch>
            {debtOn ? (
              <>
                <p className="li-s">{t('co.debt_help', { amount: money(balance) })}</p>
                <div className="g-2">
                  <Field
                    label={t('co.debt_due')}
                    required
                    error={
                      debtDuePast
                        ? t('co.debt_due_min')
                        : (act.fields['debt.dueDate'] ?? act.fields.debt)
                    }
                  >
                    {(p) => (
                      <input
                        {...p}
                        type="date"
                        className="input"
                        min={debtMin}
                        value={debtDue}
                        onChange={(e) => setDebtDue(e.target.value)}
                      />
                    )}
                  </Field>
                  <Field label={t('co.debt_reason')} required error={act.fields['debt.reason']}>
                    {(p) => (
                      <input
                        {...p}
                        className="input"
                        maxLength={500}
                        value={debtReason}
                        onChange={(e) => setDebtReason(e.target.value)}
                      />
                    )}
                  </Field>
                </div>
              </>
            ) : null}
          </section>
        ) : null}
        {credit > 0 ? (
          <section className="card stack" aria-labelledby={`${ids}-over`}>
            <h3 className="label-h" id={`${ids}-over`}>
              {t('checkout.blocked_credit', { amount: money(credit) })}
            </h3>
            <label className="check">
              <input
                type="radio"
                name={`${ids}-om`}
                checked={overMode === 'refund_request'}
                onChange={() => setOverMode('refund_request')}
              />
              {t('checkout.overpay.refund_request', { amount: money(credit) })}
            </label>
            {mgr ? (
              <label className="check">
                <input
                  type="radio"
                  name={`${ids}-om`}
                  checked={overMode === 'retain_with_guest_consent'}
                  onChange={() => setOverMode('retain_with_guest_consent')}
                />
                {t('checkout.overpay.retain')}
              </label>
            ) : null}
            <Field label={t('ci.reason')} required error={act.fields['overpaymentHandling.reason']}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  maxLength={500}
                  value={overReason}
                  onChange={(e) => setOverReason(e.target.value)}
                />
              )}
            </Field>
          </section>
        ) : null}
        <section className="card stack">
          <Switch checked={invoice} onChange={setInvoice}>
            {t('co.invoice_toggle')}
          </Switch>
          {invoice ? (
            <div className="g-2">
              <Field label={t('co.company_name')} required error={invAct.fields.companyName}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    value={inv.companyName}
                    onChange={(e) => setInv((x) => ({ ...x, companyName: e.target.value }))}
                  />
                )}
              </Field>
              <Field label={t('co.tax_code')} required error={invAct.fields.taxCode}>
                {(p) => (
                  <input
                    {...p}
                    className="input mono"
                    inputMode="numeric"
                    value={inv.taxCode}
                    onChange={(e) => setInv((x) => ({ ...x, taxCode: e.target.value }))}
                  />
                )}
              </Field>
              <Field label={t('invoice.address')} error={invAct.fields.address}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    maxLength={300}
                    value={inv.address}
                    onChange={(e) => setInv((x) => ({ ...x, address: e.target.value }))}
                  />
                )}
              </Field>
              <Field label={t('co.invoice_email')} error={invAct.fields.email}>
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    className="input"
                    value={inv.email}
                    onChange={(e) => setInv((x) => ({ ...x, email: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          ) : null}
          {invoice ? (
            <>
              <p className="li-s">{t('co.invoice_r3')}</p>
              <Button size="sm" busy={invAct.busy} onClick={() => void saveInvoice()}>
                {t('common.save')}
              </Button>
            </>
          ) : null}
          {invAct.view()}
        </section>
        <Button icon="printer" onClick={() => void openBill()}>
          {t('co.preview_bill')}
        </Button>
      </div>
    );
  }

  // FE-S3-04: say why "Hoàn tất" is locked (first missing thing).
  const whyLocked = timeAfterNow
    ? t('field.TIME_AFTER_ACTION')
    : extraUnavailable && !lateFeeMode && !lateFeeFree
      ? t('checkout.extra_night_unavailable')
      : !lfReady
        ? lfReview
          ? t('co.late_fee_pr_needs')
          : t('co.late_fee_needs_confirm')
        : lateRaise && !lateTold
          ? t('checkout.complete_needs_told')
          : debtActive && !debtReady
            ? t('co.debt_needs')
            : credit > 0 && overReason.trim().length < 3
              ? t('checkout.overpay.needs_reason')
              : staged && !stagedOk
                ? t('co.pay_at_complete_needs')
                : null;
  // UXD P432-02: with a refund pending from Trả sớm, "Đã thu {all received}" next to it reads as what the stay cost –
  // the plain label then (button and confirmation alike); so too when that list could not be read (U5: a refund may
  // be pending). A debt keeps its own label.
  const paidLabel = balance === 0 && edRefundVnd === 0 && !edRefundUnread;
  const completeLabel = debtActive
    ? t('co.complete_debt', { amount: money(balance) })
    : paidLabel && paidShown > 0
      ? t('co.complete_paid', { amount: money(paidShown) })
      : t('checkout.complete');
  const blocked = whyLocked !== null;
  return (
    <>
      <Topbar title={t('checkout.title', { room, guest })} sub={<Code>{r.code}</Code>} />
      <Page>
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('co.offline', { time: since ? timeHHmm(since) : '' })}
          </Alert>
        ) : null}
        {done ? null : steps}
        <div className="cols-2">
          <div className="stack">
            {body}
            {done ? null : actView()}
          </div>
          <div className="stack">{summaryCard}</div>
        </div>
        {done ? null : (
          <div className="wiz-foot">
            {step === 0 ? (
              <Link className="btn ghost" to={`/reservations/${reservationId}`}>
                {t('ci.back_to_booking')}
              </Link>
            ) : (
              <Button variant="ghost" onClick={back}>
                {t('common.back')}
              </Button>
            )}
            {!online ? (
              <Button variant="pri" aria-disabled="true" onClick={() => undefined}>
                {t('rsv.need_online')}
              </Button>
            ) : step === 0 ? (
              <>
                {chargeable ? (
                  <Button
                    disabled={!stdForCabinet}
                    onClick={() =>
                      editLeft(Object.fromEntries(items.map((i) => [i.itemId, i.standardQty])))
                    }
                  >
                    {t('checkout.minibar.all_full')}
                  </Button>
                ) : null}
                {/* s4-144: while the cabinet's standard is read, the button waits (DS busy) – pressed then it
                    used to skip the count (no items yet = "nothing chargeable"). */}
                <Button
                  variant="pri"
                  busy={minibarAct.busy || stdWaiting}
                  // ARC PR67-01 (a): the standard could not be read – ErrorBlock + "Thử lại" above, no way on
                  disabled={std.state.status === 'error' && !stdForCabinet}
                  busyLabel={minibarAct.busy ? minibarAct.busyLabel : t('common.loading')}
                  onClick={() => void saveMinibar()}
                >
                  {minibarAct.label(
                    nextCabinet
                      ? t('co.go_next_cabinet', {
                          room: nextCabinet.roomNo ?? cabinetNo(nextCabinet.roomId),
                        })
                      : t('co.go_extras'),
                  )}
                </Button>
              </>
            ) : step === 1 ? (
              <>
                {/* FE-S3-04: say why the button is locked – the tick sits on this step (KB7). */}
                {lateWhy ? (
                  <span className="li-s" id={`${ids}-why1`}>
                    {lateWhy}
                  </span>
                ) : null}
                <Button
                  variant="pri"
                  aria-disabled={lateWhy ? true : undefined}
                  aria-describedby={lateWhy ? `${ids}-why1` : undefined}
                  busy={lateAct.busy || toBill || wantBill}
                  busyLabel={lateAct.busy ? lateAct.busyLabel : undefined}
                  onClick={() => void goBill()}
                >
                  {lateAct.label(t('co.go_bill'))}
                </Button>
              </>
            ) : (
              <>
                {whyLocked ? (
                  <span className="li-s" id={`${ids}-why`}>
                    {whyLocked}
                  </span>
                ) : null}
                <Button
                  variant="pri"
                  aria-disabled={blocked || undefined}
                  aria-describedby={whyLocked ? `${ids}-why` : undefined}
                  busy={act.busy}
                  busyLabel={act.busyLabel}
                  onClick={() => !blocked && setConfirm(true)}
                >
                  {act.label(completeLabel)}
                </Button>
              </>
            )}
          </div>
        )}
      </Page>
      {confirm ? (
        <ConfirmDialog
          danger={false}
          title={t('checkout.complete_confirm_title', { room })}
          body={t('co.effect_status')}
          keepLabel={t('confirm.keep')}
          confirmLabel={
            debtActive
              ? completeLabel
              : paidLabel
                ? t('co.complete_paid', { amount: money(paidShown) })
                : t('checkout.complete')
          }
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setConfirm(false)}
          onConfirm={() => void complete()}
        >
          <ul className="list-plain li-s">
            <li>{t('co.effect_bill')}</li>
            <li>{t('co.effect_door', { room })}</li>
            {r.extraGuestCount ? <li>{t('co.effect_kit_note')}</li> : null}
            {lfReview ? (
              <li>{t('co.late_fee_pr_effect', { amount: money(lateFeeAsNight ?? 0) })}</li>
            ) : null}
            {stagedOk ? (
              <li>
                {t('co.pay_at_complete_effect', {
                  method: t(PAY_METHOD_KEY[stagedOk.method]),
                  amount: money(stagedOk.amountVnd),
                })}
              </li>
            ) : null}
            {debtActive ? (
              <li>{t('co.debt_effect', { amount: money(balance), date: date(debtDue) })}</li>
            ) : null}
          </ul>
          {actView()}
        </ConfirmDialog>
      ) : null}
      {extra ? (
        <AddChargeDialog
          reservation={r}
          preset={extra}
          onClose={() => setExtra(null)}
          onDone={() => {
            setExtra(null);
            sum.reload();
          }}
        />
      ) : null}
      {focLine ? (
        <FocRequestDialog
          folioId={r.folioId}
          line={focLine}
          lines={lines}
          onClose={() => setFocLine(null)}
          onDone={() => {
            setFocLine(null);
            reload();
          }}
        />
      ) : null}
      {bill ? (
        <BillDialog bill={bill} channel={r.channelCode} onClose={() => setBill(null)} />
      ) : null}
    </>
  );
}

/**
 * H16 16.5 Phiếu thanh toán (FE-S3-06, DOM FE-03): the slip has its own title, tax code, number or
 * preview note, column headers, and every fixed label in VI with the EN line under it (`.en`,
 * `lang="en"`) when bilingual. While the dialog is open a copy sits in `<div class="print-root">` directly under
 * `<body>` (hifi.css §16 + `print.css` print only that – A4, white paper even in dark mode). Line texts come from
 * `labelKey`/`labelParams` (fallback: server description).
 */
export function BillDialog({
  bill,
  channel,
  onClose,
}: {
  bill: Bill;
  /** Channel name for "Tiền phòng {n} đêm – đã thanh toán qua {channel}" (G-13). */
  channel?: string;
  onClose: () => void;
}) {
  const { t, vnd, money, date, dateTime, locale } = useI18n();
  const ids = useId();
  const [bilingual, setBilingual] = useState(bill.locale === 'vi_en');
  // EN strings are a lazy chunk – load them for the bilingual bill even when the UI is Vietnamese.
  const [enReady, setEnReady] = useState(() => isLocaleLoaded('en'));
  useEffect(() => {
    if (!bilingual || enReady) return;
    let stale = false;
    loadLocale('en').then(
      () => !stale && setEnReady(true),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [bilingual, enReady]);

  const both = bilingual && enReady;
  const L = (key: string, args?: Args) => (
    <>
      {t(key, args)}
      {both ? (
        <span className="en" lang="en">
          {translate('en', key, args)}
        </span>
      ) : null}
    </>
  );
  /** A counted line (`<key>_one|_few|_many|_other`, BUG-R4-009): each language picks its own form. */
  const Lcount = (key: string, n: number, args?: Args) => (
    <>
      {t(`${key}_${pluralForm(locale, n)}`, args)}
      {both ? (
        <span className="en" lang="en">
          {translate('en', `${key}_${pluralForm('en', n)}`, args)}
        </span>
      ) : null}
    </>
  );
  const credit = (bill as Bill & { creditVnd?: number }).creditVnd ?? 0;
  const roomLines = bill.lines.filter((l) => l.category === 'room');
  const shown = bill.lines.filter(
    (l) => !(bill.paymentModel === 'ota_prepaid' && l.category === 'room'),
  );

  const paper = (
    <div className="bill-paper">
      <div className="hdr">
        <div>
          <b>{bill.property?.name}</b>
          <div className="li-s">{bill.property?.address}</div>
          {bill.property?.taxCode ? (
            <div className="li-s">{t('bill.tax_code', { code: bill.property.taxCode })}</div>
          ) : null}
        </div>
        <div className="r">
          {bill.billNo ? (
            <>
              <div>
                {L('bill.no')} <span className="mono">{bill.billNo}</span>
              </div>
              <div className="li-s">
                {/* 0.3.7 add. 1: a reprint shows when the folio was settled, never the print time. */}
                {t('bill.issued_at', {
                  time: dateTime(bill.settledAt ?? new Date().toISOString()),
                })}
              </div>
            </>
          ) : (
            <div className="li-s">{L('bill.preview_note')}</div>
          )}
        </div>
      </div>
      <h2>{L('bill.title')}</h2>
      <p>
        {/* FE-S4-22 (BR-012, 0.3.7 add. D1): the bill is what the guest reads – the room's NAME, never its number
            (`roomNo` only when the room has no name yet, DS 11.3). */}
        {bill.guestDisplayName} · {bill.roomName ?? bill.roomNo} · {date(bill.arrivalDate)} →{' '}
        {date(bill.departureDate)}
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">{L('bill.col_desc')}</th>
            <th scope="col" className="r">
              {L('bill.col_amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {bill.paymentModel === 'ota_prepaid' && bill.otaPrepaidVnd ? (
            <tr>
              <td>
                {Lcount('bill.ota_prepaid', roomLines.length, {
                  n: roomLines.length,
                  channel: channel ?? '',
                })}
              </td>
              <td className="r">{vnd(bill.otaPrepaidVnd)}</td>
            </tr>
          ) : null}
          {shown.map((l) => (
            <tr key={l.id}>
              <td>
                {lineLabel(t, l)}
                {/* labelKey is translatable here – free text params (item names) stay as given. */}
                {both && hasLineKey(l) ? (
                  <span className="en" lang="en">
                    {lineLabel((k, a) => translate('en', k, a), l)}
                  </span>
                ) : null}
              </td>
              <td className="r">{signed(vnd, l.amountVnd)}</td>
            </tr>
          ))}
          <tr className="total">
            <td>{L('bill.total')}</td>
            <td className="r">{vnd(bill.totalVnd)}</td>
          </tr>
          {bill.paidVnd > 0 ? (
            <tr>
              <td>{L('bill.paid')}</td>
              <td className="r">−{vnd(bill.paidVnd)}</td>
            </tr>
          ) : null}
          {(bill.refunds ?? []).map((x, i) => (
            <tr key={i}>
              <td>
                {L('bill.refund', {
                  amount: money(x.amountVnd),
                  method: t(x.method === 'cash' ? 'pay.cash' : 'pay.bank_transfer'),
                })}
              </td>
              <td className="r">{signed(vnd, x.amountVnd)}</td>
            </tr>
          ))}
          <tr className="total">
            <td>{L('bill.balance')}</td>
            <td className="r">{vnd(bill.balanceDueVnd)}</td>
          </tr>
          {credit > 0 ? (
            <tr>
              <td>{L('bill.refund_due', { amount: money(credit) })}</td>
              <td className="r">{vnd(credit)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="foot">
        {both && bill.usdReference?.totalUsd !== undefined ? (
          <p>
            {t('common.approx_usd', {
              usd: bill.usdReference.totalUsd,
              rate: vnd(bill.usdReference.rate ?? 0),
              date: date(bill.usdReference.rateUpdatedOn),
            })}
          </p>
        ) : null}
        <p>{L('bill.vat_note')}</p>
        {bill.balanceDueVnd === 0 && bill.billNo ? (
          <Chip tone="ok">{L('bill.paid_stamp')}</Chip>
        ) : null}
      </div>
    </div>
  );

  return (
    <Modal
      open
      size="lg"
      title={t('bill.title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <span className="label-h" id={`${ids}-lang`}>
            {t('bill.lang_label')}
          </span>
          <Seg
            labelledBy={`${ids}-lang`}
            value={bilingual ? 'vi_en' : 'vi'}
            onChange={(v) => setBilingual(v === 'vi_en')}
            options={[
              { value: 'vi', label: t('co.bill_vi') },
              { value: 'vi_en', label: t('co.bill_vien') },
            ]}
          />
          <Button variant="pri" icon="printer" onClick={() => window.print()}>
            {t('co.print')}
          </Button>
        </>
      }
    >
      {paper}
      {/* BUG-R3-020 (hifi.css §16): the copy the print stylesheet keeps (body > .print-root), mounted for as long as
          the dialog is open – not only around window.print(), which returns at once on iPad Safari / headless and
          is bypassed by Ctrl+P, so the whole Desk was printed. Hidden on screen. */}
      {createPortal(
        <div className="print-root" aria-hidden="true">
          {paper}
        </div>,
        document.body,
      )}
    </Modal>
  );
}
