import {
  isApiError,
  newIdempotencyKey,
  type Bill,
  type CheckOutBody,
  type FolioLine,
} from '@ottimo/api-client';
import { isLocaleLoaded, loadLocale, translate, useI18n, type Args } from '@ottimo/i18n';
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
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { timeHHmm, todayLocal } from '../../app/dates';
import { hasLineKey, lineLabel } from '../../app/folio';
import { Code, monoArgs } from '../../app/mono';
import { useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MoneyField, STAY_WRITE_RETRY, amountOf, useSubmit } from './common';
import { PaymentPanel } from './PaymentPanel';
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
  const [step, setStep] = useState(0);
  const [time, setTime] = useState('');
  const qTime = useDebounced(time, 300);
  const sum = useResource(
    async () => (await api.getCheckoutSummary(R, qTime || undefined)).data,
    [propertyId, reservationId, qTime],
  );
  const s = sum.state.data;
  // 0.3.7 bổ sung 4 (minibar M-1, BR-703-01): one cabinet per (stay, room) – after B14 the old room's cabinet is
  // counted too (`CheckoutSummary.minibarUncheckedRooms`); `undefined` = the room assigned now.
  const [cabinet, setCabinet] = useState<string | undefined>(undefined);
  const std = useResource(
    async () => (await api.getMinibarStandard(R, cabinet)).data,
    [propertyId, reservationId, cabinet],
  );
  const [left, setLeft] = useState<Record<string, number>>({});
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
  const [debtReason, setDebtReason] = useState('');
  // BR-416-06 (ARC 0.3.7 bổ sung 4, 16.6 (d)): the night of departure cannot be sold → a late fee of one night,
  // confirmed at the desk by a manager (username + password; OWN/MGR: their own password) with a reason.
  const [lfReason, setLfReason] = useState('');
  const [lfUser, setLfUser] = useState('');
  const [lfSecret, setLfSecret] = useState('');
  // Optional FOC on that fee, applied by the confirming manager within their BR-433 limit (same B18 call).
  const [lfFoc, setLfFoc] = useState<SurchargeFoc>(noSurchargeFoc);
  const [lfFocAmount, setLfFocAmount] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [done, setDone] = useState<{ billNo: string } | null>(null);
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
    const items = std.state.data?.items;
    if (!items) return;
    const latest = std.state.data?.latestCheck?.lines;
    setLeft(
      Object.fromEntries(
        items.map((i) => [
          i.itemId,
          // DOM (e), BR-702 v0.3.8: the number the desk corrected on the folio (with a reason) wins over the last
          // count – sending `standard − folioUsed` keeps that line (R6); another number = a new count.
          i.adjustedAfterLastCheck && typeof i.folioUsedQty === 'number'
            ? Math.max(0, i.standardQty - i.folioUsedQty)
            : (latest?.find((l) => l.itemId === i.itemId)?.remainingQty ??
              // BUG-R2-144 / BR-703-02: counted earlier in this refill period but due again (the stay came back
              // to the room, or was extended) – start from that count, never from a full cabinet (which would
              // read as "nothing used" and reverse what was charged).
              (typeof i.lastCheckUsedQty === 'number'
                ? Math.max(0, i.standardQty - i.lastCheckUsedQty)
                : i.standardQty)),
        ]),
      ),
    );
  }, [std.state.data]);
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
  const priced = !time || (s?.checkoutTime ?? '').slice(0, 5) === time;
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
  const lfShownKey =
    step === 2 && s?.extraNightRequired && s.extraNightAvailable === false
      ? `${s.lateFeeAsNightVnd ?? ''}|${lfFoc.on ? lfFocAmount || 'all' : ''}`
      : '';
  useEffect(() => {
    setLfSecret('');
  }, [lfShownKey]);

  // BR-703-01: an unchecked cabinet of an earlier room of this stay is counted first.
  useEffect(() => {
    // Only once the reservation is here – before that every cabinet would look like an earlier room.
    const here = r?.segments?.[0]?.roomId;
    if (!here) return;
    const old = (s?.minibarUncheckedRooms ?? []).find((c) => c.roomId !== here);
    if (step === 0 && cabinet === undefined && old) setCabinet(old.roomId);
    // first summary / reservation only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.minibarUncheckedRooms, r?.segments]);

  // ARC 0.3.7 bổ sung 4 (S4-38, BR-416-04/05): at a typed extra-night rate the amount due is the server's too –
  // the cap of a check-out VietQR at that rate (422 AMOUNT_EXCEEDS_BALANCE `max`; nothing is written), never
  // "default due + (typed − default)" on the client (the extra night takes the BR-107 step and FOC that follow).
  const typedRate =
    s?.extraNightRequired && s.extraNightAvailable !== false ? amountOf(extraRate) : 0;
  const rateTyped = typedRate > 0 && typedRate !== (s?.extraNightDefaultRateVnd ?? 0);
  const typedKey = rateTyped && r ? `${time}|${typedRate}` : '';
  const debTypedKey = useDebounced(typedKey, 300);
  const [typedDue, setTypedDue] = useState<{ key: string; due?: number; failed?: boolean } | null>(
    null,
  );
  useEffect(() => {
    if (!debTypedKey || debTypedKey !== typedKey || !r) return;
    let stale = false;
    const [hhmm, rate] = debTypedKey.split('|') as [string, string];
    api
      .createVietQr(
        { propertyId, folioId: r.folioId },
        {
          amountVnd: DUE_PROBE_VND,
          purpose: 'check_out',
          checkoutAt: /^\d{2}:\d{2}$/.test(hhmm)
            ? `${r.departureDate}T${hhmm}:00+07:00`
            : undefined,
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

  const room = r.segments?.[0]?.roomNo ?? '';
  const currentRoomId = r.segments?.[0]?.roomId ?? '';
  // The choice of cabinet only when the stay has more than one to count (B14 mid-stay).
  const cabinets = (() => {
    const list = [...(s?.minibarUncheckedRooms ?? [])];
    if (cabinet && !list.some((c) => c.roomId === cabinet)) return list;
    if (list.length && !list.some((c) => c.roomId === currentRoomId))
      list.push({ roomId: currentRoomId, roomNo: room });
    return list;
  })();
  const guest = r.booker?.displayName ?? '';
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
  const lfFocVnd = lateFeeMode && lfFoc.on ? amountOf(lfFocAmount) || (lateFeeAsNight ?? 0) : 0;
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
  const lfAuthError = !lateFeeMode
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
  const actView = () => (lfAuthError ? <Alert tone="bad">{lfAuthError}</Alert> : act.view());
  const lfReady =
    !lateFeeMode ||
    (lfReason.trim().length >= 3 &&
      (mgr || lfUser.trim().length > 0) &&
      lfSecret.length > 0 &&
      !surchargeFocMissing(t, lfFoc) &&
      lfFocVnd <= (lateFeeAsNight ?? 0));
  const balance = extraUnavailable
    ? // 0.3.7 bổ sung 4: the server's due then includes the one-night late fee and never the unsold night;
      // an older server without `lateFeeAsNightVnd` → the folio balance (BUG-R2-139).
      lateFeeMode
      ? // the FOC asked in this B18 call is not known to the summary (like H13 – BR-402): taken off here.
        Math.max(0, (s?.amountDueAtCheckoutVnd ?? 0) - (lfFocBody?.amountVnd ?? 0))
      : Math.max(0, s?.balanceDueVnd ?? 0)
    : ((rateTyped ? typedDueNow?.due : undefined) ??
      s?.amountDueAtCheckoutVnd ??
      s?.balanceDueVnd ??
      0);
  // BR-416-06: the late fee (less the waiver sent with it) is posted by B18 too – money taken for it before is
  // not a credit to hand back.
  const lateFeeNet = lateFeeMode ? Math.max(0, (lateFeeAsNight ?? 0) - lfFocShown) : 0;
  const credit =
    balance > 0
      ? 0
      : Math.max(0, credit0 - extraNightVnd - lateFeeNet - lateDelta - (s?.balanceDueVnd ?? 0));
  const pendingFoc = lines.filter((l) => l.lineState === 'pending_approval');
  const today = todayLocal(property?.timezone);
  const debtActive = mgr && debtOn && balance > 0;
  const debtDuePast = !!debtDue && debtDue < today;
  const debtReady = !!debtDue && !debtDuePast && debtReason.trim().length >= 3;
  const reload = () => {
    sum.reload();
    res.reload();
  };

  // Cabinets still to count (current room included when it is); the old room's first (BR-703-01).
  const toCount = s?.minibarUncheckedRooms ?? [];
  const nextCabinet = (doneRoom: string | undefined) =>
    toCount.find((c) => c.roomId !== (doneRoom ?? currentRoomId));
  const saveMinibar = async () => {
    if (!chargeable) {
      const next = nextCabinet(cabinet);
      if (next) setCabinet(next.roomId === currentRoomId ? undefined : next.roomId);
      else setStep(1);
      return;
    }
    const counted = cabinet;
    const caught: { error?: unknown } = {};
    const out = await minibarAct.submit((idem) =>
      api
        .recordMinibarCheck(
          R,
          {
            mode: 'checkout',
            roomId: counted,
            // ARC 16.16 (ab): the period this count was made in – a refill since then → 409, nothing written.
            periodId: std.state.data?.periodId,
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
    const next = nextCabinet(counted);
    if (next) setCabinet(next.roomId === currentRoomId ? undefined : next.roomId);
    else setStep(1);
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
    const body: CheckOutBody = {
      checkoutTime: time || s?.checkoutTime || rules.checkoutTime,
      checkoutTimeNote: timeNote.trim() || undefined,
      applyLateSurcharge: lateRaise && lateTold,
      expectedSurchargeVnd: lateRaise && lateTold ? lateNew : undefined,
      // E05-11: after the last late tier the check-out itself adds one night at this rate.
      extraNight:
        extraNightNeeded && !extraUnavailable
          ? { rateVnd: extraEdited ? amountOf(extraRate) : undefined }
          : undefined,
      lateFeeInsteadOfNight: lateFeeMode
        ? {
            amountVnd: lateFeeAsNight ?? 0,
            reason: lfReason.trim(),
            approverUsername: mgr ? lfUser.trim() || undefined : lfUser.trim(),
            authMethod: 'password',
            secret: lfSecret,
            requestFoc: lfFocBody,
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
      if (isApiError(e) && e.code === 'VERSION_CONFLICT') res.reload();
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
    setDone({ billNo: out.data.billNo });
    res.reload();
  };

  // KB7 (1): a higher late surcharge is written to the folio (B15 at the actual time, the amount the desk saw
  // and told the guest – BR-414) before the bill step, so step 3 collects it with everything else.
  // S4-48 / BUG-R2-088: the reason says what to do (tick the box), not the box's own label.
  const lateWhy = extraRangeError
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

  const summaryCard = (
    <section className="card" aria-labelledby={`${ids}-sum`}>
      <h2 className="label-h" id={`${ids}-sum`}>
        {t('drawer.folio.title')}
      </h2>
      {!s ? (
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
                <td className="r num">{vnd(l.amountVnd)}</td>
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
            {s.paidVnd > 0 ? (
              <tr className="sub">
                <td>{t('drawer.folio.paid')}</td>
                <td className="r num">−{vnd(s.paidVnd)}</td>
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
    const countingRoomId = cabinet ?? currentRoomId;
    const countingRoomNo =
      toCount.find((c) => c.roomId === countingRoomId)?.roomNo ??
      cabinets.find((c) => c.roomId === countingRoomId)?.roomNo ??
      room;
    const due = toCount.find((c) => c.roomId === countingRoomId);
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
                label:
                  c.roomId === currentRoomId
                    ? t('co.minibar_cabinet_room', { room: c.roomNo ?? '' })
                    : t('co.minibar_cabinet_old', { room: c.roomNo ?? '' }),
              }))}
              value={cabinet ?? currentRoomId}
              onChange={(v) => {
                minibarAct.reset();
                setCabinet(v === currentRoomId ? undefined : v);
              }}
            />
          </div>
        ) : null}
        {recount ? (
          // BUG-R2-144 (BR-703-02): a cabinet counted before is due again – a new count of this period.
          <Alert tone="warn" title={t('co.minibar_recount_title', { room: countingRoomNo })}>
            {t('co.minibar_recount_body')}
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
        {!std.state.data ? (
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
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">{t('checkout.step.minibar')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('co.item')}</th>
                    <th scope="col" className="c">
                      {t('co.std')}
                    </th>
                    <th scope="col" className="c">
                      {t('checkout.minibar.left')}
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
                        <td className="c num">{i.standardQty}</td>
                        <td className="c">
                          <Stepper
                            value={rem}
                            min={0}
                            max={i.standardQty}
                            onChange={(v) => setLeft((x) => ({ ...x, [i.itemId]: v }))}
                            labelledBy={`${ids}-i${idx}`}
                            decLabel={t('rooms.dec')}
                            incLabel={t('rooms.inc')}
                          />
                        </td>
                        <td className="c num">{used}</td>
                        <td className="r num">
                          {i.isFree
                            ? t('checkout.minibar.free')
                            : vnd(used * (i.unitPriceVnd ?? 0))}
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
    body = (
      <section className="card stack">
        <Field
          label={t('checkout.departure_time')}
          help={
            r.agreedCheckoutTime
              ? t('co.time_from_late', { time: r.agreedCheckoutTime })
              : undefined
          }
          error={act.fields.checkoutTime}
        >
          {(p) => (
            <input
              {...p}
              type="time"
              className="input"
              value={time}
              onChange={(e) => changeTime(e.target.value)}
            />
          )}
        </Field>
        {s?.postMidnightWindow ? <Alert tone="info">{t('checkout.post_midnight')}</Alert> : null}
        {noteAsked || act.fields.checkoutTimeNote || timeNote ? (
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
          // calendar price of that night. The room taken tonight → no extra night possible.
          extraUnavailable ? (
            lateFeeMode ? (
              // BR-416-06: no night is added; a late fee of one night, confirmed by a manager at the desk.
              <Alert tone="warn" title={t('checkout.extra_night_title')}>
                {t('co.late_fee_as_night_body', { amount: money(lateFeeAsNight ?? 0) })}
              </Alert>
            ) : (
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
              {t('co.late_fee_confirm_title', { amount: money(lateFeeAsNight ?? 0) })}
            </h3>
            <p className="li-s">{t('co.late_fee_confirm_help')}</p>
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
          </section>
        ) : null}
        <section className="card stack">
          <p className="kv-big num">
            {t('bill.total')}: {money(s?.totalVnd ?? 0)}
          </p>
          {balance > 0 ? (
            online ? (
              <PaymentPanel
                reservation={r}
                balanceVnd={balance}
                checkout={{
                  checkoutAt: /^\d{2}:\d{2}$/.test(time)
                    ? `${r.departureDate}T${time}:00+07:00`
                    : undefined,
                  // ARC 16.18: the same rule as B18 – only a rate the desk changed.
                  extraNightRateVnd:
                    extraNightNeeded && !extraUnavailable && extraEdited
                      ? amountOf(extraRate)
                      : undefined,
                  lateFeeAsNight: lateFeeMode || undefined,
                }}
                onPaid={reload}
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
                        ? t('co.debt_due_past')
                        : (act.fields['debt.dueDate'] ?? act.fields.debt)
                    }
                  >
                    {(p) => (
                      <input
                        {...p}
                        type="date"
                        className="input"
                        min={today}
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
  const whyLocked =
    extraUnavailable && !lateFeeMode
      ? t('checkout.extra_night_unavailable')
      : !lfReady
        ? t('co.late_fee_needs_confirm')
        : lateRaise && !lateTold
          ? t('checkout.complete_needs_told')
          : debtActive && !debtReady
            ? t('co.debt_needs')
            : credit > 0 && overReason.trim().length < 3
              ? t('checkout.overpay.needs_reason')
              : null;
  const completeLabel = debtActive
    ? t('co.complete_debt', { amount: money(balance) })
    : balance === 0 && (s?.paidVnd ?? 0) > 0
      ? t('co.complete_paid', { amount: money(s?.paidVnd ?? 0) })
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
              <Button variant="ghost" onClick={() => setStep((x) => x - 1)}>
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
                    onClick={() =>
                      setLeft(Object.fromEntries(items.map((i) => [i.itemId, i.standardQty])))
                    }
                  >
                    {t('checkout.minibar.all_full')}
                  </Button>
                ) : null}
                <Button
                  variant="pri"
                  busy={minibarAct.busy}
                  busyLabel={minibarAct.busyLabel}
                  onClick={() => void saveMinibar()}
                >
                  {minibarAct.label(t('co.go_extras'))}
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
              : balance === 0
                ? t('co.complete_paid', { amount: money(s?.paidVnd ?? 0) })
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
 * `lang="en"`) when bilingual. Printing renders a copy into `<div class="print-root">` directly under
 * `<body>` (hifi.css §16 prints only that, A5, white paper even in dark mode). Line texts come from
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
  const { t, vnd, money, date, dateTime } = useI18n();
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
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    window.print();
    setPrinting(false);
  }, [printing]);

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
        {bill.guestDisplayName} · {bill.roomNo} · {date(bill.arrivalDate)} →{' '}
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
              <td>{L('bill.ota_prepaid', { n: roomLines.length, channel: channel ?? '' })}</td>
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
              <td className="r">{vnd(l.amountVnd)}</td>
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
              <td className="r">{vnd(x.amountVnd)}</td>
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
          <Button variant="pri" icon="printer" onClick={() => setPrinting(true)}>
            {t('co.print')}
          </Button>
        </>
      }
    >
      {paper}
      {/* Only while printing: the copy the print stylesheet keeps (body > .print-root). */}
      {printing
        ? createPortal(
            <div className="print-root" aria-hidden="true">
              {paper}
            </div>,
            document.body,
          )
        : null}
    </Modal>
  );
}
