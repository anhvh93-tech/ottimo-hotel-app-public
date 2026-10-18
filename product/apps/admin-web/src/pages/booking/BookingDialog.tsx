import {
  isApiError,
  newIdempotencyKey,
  type Channel,
  type ChannelGroup,
  type CloserCandidate,
  type RoomSuggestion,
  type DirectSource,
  type GuestSummary,
  type PaymentMethod,
  type QuoteCalculation,
  type Reservation,
  type ReservationCreate,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, ConfirmDialog, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { readDraft, removeDraft, writeDraft } from '../../app/clientData';
import { timeHHmm, todayLocal } from '../../app/dates';
import { notifyChanged } from '../../app/live';
import { parseVnd } from '../../app/money';
import { fieldErrorText } from '../../app/problem';
import {
  addDays,
  conflictsOf,
  dayMonth,
  nightsBetween,
  occupancy,
  rsvErrorText,
  suggestionsOf,
} from '../../app/reservations';
import { useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { normalizePhone } from '../../app/validation';
import { GuestPicker } from '../../components/GuestPicker';
import { OccupancyField, type Occupancy } from '../../components/OccupancyField';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { isRetryable, useWrite } from '../../app/useWrite';

export interface BookingPrefill {
  roomId?: string;
  arrivalDate?: string;
}

interface Props {
  prefill?: BookingPrefill;
  onClose: () => void;
  onCreated: (r: Reservation) => void;
  /** ≥ BR-108 nights → H10 (US-017 AC5a) with the same room/dates. */
  onLongStay: (p: { roomId: string; arrivalDate: string; departureDate: string }) => void;
}

/** Draft key scoped to the signed-in user (FB-R2-SEC-FE-05, like the guest form). */
const draftKey = (userId: string | undefined) => `booking.new.${userId ?? 'anon'}`;
const SOURCES: Array<{ value: DirectSource; key: string }> = [
  { value: 'zalo_phone', key: 'bk.src_zalo' },
  { value: 'website', key: 'bk.src_web' },
  { value: 'walk_in', key: 'bk.src_walkin' },
  { value: 'returning', key: 'bk.src_return' },
  { value: 'sales_staff', key: 'bk.src_sales' },
];
const METHODS: Array<{ value: PaymentMethod; key: string }> = [
  { value: 'vietqr', key: 'pay.vietqr' },
  { value: 'bank_transfer', key: 'pay.bank_transfer' },
  { value: 'cash', key: 'pay.cash' },
  { value: 'card_pos', key: 'pay.card' },
];
const LEAD_PLUS = ['owner', 'manager', 'front_desk_lead'];

interface Form {
  roomId: string;
  closerUserId: string;
  arrivalDate: string;
  departureDate: string;
  group: ChannelGroup;
  otaChannelId: string;
  directSource: DirectSource;
  otaRef: string;
  paymentModel: 'ota_prepaid' | 'ota_pay_at_property';
  occ: Occupancy;
  guest: GuestSummary | null;
  phone: string;
  email: string;
  eta: string;
  rates: Record<string, string>;
  /** ARC 16.18 (vòng sửa 5): nights whose rate box the desk changed – `NightRate.edited` (no number test). */
  ratesEdited: Record<string, boolean>;
  depositAmount: string;
  depositMethod: PaymentMethod;
  internalNote: string;
  rateReason: string;
  minStayReason: string;
  capacityReason: string;
}

const weekend = (date: string) => [5, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

/**
 * H09 Đặt phòng mới (S05, US-017/018/019/023, B2). Nightly prices, deposit and the extra-guest fee are
 * computed by the server (`calculateQuote`) and shown before saving (AC3/AC7); capacity is blocked at the
 * guest field (US-004 AC3); 409 ROOM_UNAVAILABLE keeps every input and offers free rooms from
 * `suggestions[]`; an OTA booking into a full room can be saved "chưa gán căn" (US-139).
 */
export function BookingDialog({ prefill, onClose, onCreated, onLongStay }: Props) {
  const { t, vnd, money, locale } = useI18n();
  const propertyId = usePropertyId();
  const { roles, me } = useSession();
  const DRAFT_KEY = draftKey(me?.id);
  const toast = useToast();
  const { online } = useOnline();
  const rules = useRules(propertyId, roles);
  const catalog = useCatalog(propertyId);
  const today = todayLocal();
  const lead = roles.some((r) => LEAD_PLUS.includes(r));

  const [form, setForm] = useState<Form>(() => {
    const draft = !prefill ? readDraft(DRAFT_KEY) : null;
    // A draft saved before `ratesEdited` existed: no box counts as edited.
    if (draft) {
      const saved = JSON.parse(draft) as Partial<Form>;
      return { ...(saved as Form), ratesEdited: saved.ratesEdited ?? {} };
    }
    const arrival = prefill?.arrivalDate ?? today;
    return {
      roomId: prefill?.roomId ?? '',
      arrivalDate: arrival,
      departureDate: addDays(arrival, 1),
      group: 'direct',
      otaChannelId: '',
      directSource: 'zalo_phone',
      closerUserId: '',
      otaRef: '',
      paymentModel: 'ota_prepaid',
      occ: { adults: 2, children6to11: 0, childrenUnder6: 0 },
      guest: null,
      phone: '',
      email: '',
      eta: '',
      rates: {},
      ratesEdited: {},
      depositAmount: '',
      depositMethod: 'vietqr',
      internalNote: '',
      rateReason: '',
      minStayReason: '',
      capacityReason: '',
    };
  });
  const [draftAt, setDraftAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<unknown>(null);
  const [conflict, setConflict] = useState<unknown>(null);
  /**
   * BUG-R2-076 (P-S4-2): a room picked from a conflict / min-stay suggestion is NOT booked at once – its
   * per-night prices and total (server `calculateQuote` for that room) are shown first, one click creates.
   */
  const [useRoom, setUseRoom] = useState<string | null>(null);
  const [rateWarn, setRateWarn] = useState(false);
  /** 0.3.5 A-20: OTA booking above the room maximum → warning + reason, saved with capacityConflict. */
  const [capWarn, setCapWarn] = useState<{ room: string; max: string; n: number } | null>(null);
  const [autoReturning, setAutoReturning] = useState<string | null>(null);
  const [minStay, setMinStay] = useState<number | null>(null);
  const [longStay, setLongStay] = useState(false);
  const [askUnassigned, setAskUnassigned] = useState(false);
  const [minStaySuggest, setMinStaySuggest] = useState<RoomSuggestion[]>([]);
  const [closers, setClosers] = useState<CloserCandidate[]>([]);
  const [busy, setBusy] = useState<'create' | 'hold' | null>(null);
  const [calc, setCalc] = useState<QuoteCalculation | null>(null);
  const [calcError, setCalcError] = useState<unknown>(null);
  const [avail, setAvail] = useState<{ available: boolean; reason?: string; alt: string[] } | null>(
    null,
  );
  const idem = useRef<{ body: string; key: string } | null>(null);
  const write = useWrite();

  const set = (patch: Partial<Form>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      writeDraft(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
    setDraftAt(timeHHmm(new Date()));
    setConflict(null);
    setRequestError(null);
  };

  const rooms = catalog.rooms.filter((r) => r.isSellable !== false || r.id === form.roomId);
  const room = catalog.rooms.find((r) => r.id === form.roomId);
  const channelsOf = (g: ChannelGroup) =>
    catalog.channels.filter((c) => c.channelGroup === g && c.isActive);
  const channel: Channel | undefined =
    form.group === 'ota'
      ? (catalog.channels.find((c) => c.id === form.otaChannelId) ?? channelsOf('ota')[0])
      : channelsOf(form.group)[0];
  const directLike = form.group === 'direct' || form.group === 'agent';
  const nights = nightsBetween(form.arrivalDate, form.departureDate);
  const datesOk = !!form.arrivalDate && !!form.departureDate && nights > 0;
  const dates = useMemo(
    () =>
      datesOk
        ? Array.from({ length: Math.min(nights, 31) }, (_, i) => addDays(form.arrivalDate, i))
        : [],
    [datesOk, nights, form.arrivalDate],
  );
  const { extra } = occupancy(form.occ.adults, form.occ.children6to11, room?.baseOccupancy ?? 2);
  const overCapacity =
    !!room && form.occ.adults + form.occ.children6to11 > (room.maxOccupancy ?? 99);

  // A-06: CTV channel → agent who closed it; direct booking from "Sale nội bộ" → staff closer.
  const closerKind =
    form.group === 'agent'
      ? 'agent'
      : form.group === 'direct' && form.directSource === 'sales_staff'
        ? 'staff'
        : null;
  // Closer candidates for the CTV channel (A-06); missing operation on an older server → empty list.
  useEffect(() => {
    if (!closerKind || closers.length) return;
    let stale = false;
    api.listCloserCandidates({ propertyId }, 'all').then(
      (r) => !stale && setClosers(r.data.data),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [closerKind, closers.length, propertyId]);

  // Default room once the catalog is loaded.
  useEffect(() => {
    if (!form.roomId && rooms[0]) set({ roomId: rooms[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length]);

  useEffect(() => {
    setLongStay(datesOk && nights >= rules.longStayFromNights);
  }, [datesOk, nights, rules.longStayFromNights]);

  // Server price preview (BR-101/104/107/110/305) for direct / agent bookings.
  const calcInput = useDebounced(
    JSON.stringify({
      roomId: form.roomId,
      arrivalDate: form.arrivalDate,
      nights,
      occ: form.occ,
      channelId: channel?.id,
      on: directLike && datesOk && !longStay && !overCapacity,
    }),
    300,
  );
  useEffect(() => {
    const p = JSON.parse(calcInput) as {
      roomId: string;
      arrivalDate: string;
      nights: number;
      occ: Occupancy;
      channelId?: string;
      on: boolean;
    };
    if (!p.on || !p.roomId || !p.channelId) {
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
          arrivalDate: p.arrivalDate,
          nights: p.nights,
          adults: p.occ.adults,
          children6to11: p.occ.children6to11,
          childrenUnder6: p.occ.childrenUnder6,
          channelId: p.channelId,
        },
      )
      .then(
        (r) => {
          if (stale) return;
          setCalc(r.data);
          setCalcError(null);
          setForm((f) => ({
            ...f,
            // BR-107 v0.3.8 (DOM S4-38): the desk types the CALENDAR rate (before the length-of-stay step) –
            // the server applies the step on what it gets, so a stepped figure here would be stepped twice.
            rates: Object.fromEntries(
              (r.data.nightlyRates ?? []).map((n) => [
                n.date,
                vnd(n.calendarRateVnd ?? n.amountVnd),
              ]),
            ),
            // The server priced the stay again (room, dates, guests): the boxes hold its rates, none edited.
            ratesEdited: {},
            depositAmount: f.depositAmount || (r.data.depositVnd ? vnd(r.data.depositVnd) : ''),
          }));
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
  }, [calcInput, propertyId, vnd]);

  // Availability of the chosen room (US-082 AC1) – a hint only; the server re-checks on save.
  const availInput = useDebounced(
    `${form.roomId}|${form.arrivalDate}|${form.departureDate}|${form.occ.adults}`,
    300,
  );
  useEffect(() => {
    const [roomId, arrival, departure, adults] = availInput.split('|');
    if (!roomId || !arrival || !departure || departure <= arrival || arrival < today) {
      setAvail(null);
      return;
    }
    let stale = false;
    api
      .searchAvailability(
        { propertyId },
        { arrival, departure, roomId, adults: Number(adults) || 1 },
      )
      .then(
        (r) =>
          !stale &&
          setAvail({
            available: r.data.requestedRoom?.available !== false,
            reason: r.data.requestedRoom?.reason,
            alt: r.data.alternatives.map((a) => a.roomNo),
          }),
        () => !stale && setAvail(null),
      );
    return () => {
      stale = true;
    };
  }, [availInput, propertyId, today]);

  const rateList = dates.map((d) => ({ date: d, raw: form.rates[d] ?? '' }));
  const calendarOf = (date: string) => {
    const n = calc?.nightlyRates?.find((x) => x.date === date);
    return n ? (n.calendarRateVnd ?? n.amountVnd) : undefined;
  };
  // 0.3.5 A-14: the server splits room total / extra-person fee – no subtraction on the client.
  const extraFee = calc?.extraPersonFeeVnd ?? 0;
  const ratesTouched = !!calc && rateList.some((r) => parseVnd(r.raw) !== calendarOf(r.date));
  // BR-107 step of this stay (server). Untouched rates → the server's stepped total; typed rates → the step
  // is applied by the server on save (no client arithmetic) – the sum shown is then the calendar sum.
  const losPct = calc?.losDiscountPct ?? 0;
  // A server without the calendar rate per night would leave stepped figures in the inputs (stepped twice on
  // save) – the rates stay read-only then (DOM S4-38).
  const ratesLocked =
    losPct > 0 && (calc?.nightlyRates ?? []).some((n) => n.calendarRateVnd === undefined);
  const roomTotal =
    calc && !ratesTouched
      ? (calc.roomTotalVnd ?? rateList.reduce((s, r) => s + (parseVnd(r.raw) ?? 0), 0))
      : rateList.reduce((s, r) => s + (parseVnd(r.raw) ?? 0), 0);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.roomId) e.roomId = t('common.required');
    if (!form.arrivalDate) e.arrivalDate = t('common.required');
    else if (form.arrivalDate < today) e.arrivalDate = t('booking.error.past_date');
    if (!datesOk)
      e.departureDate = fieldErrorText(t, { field: 'departureDate', code: 'DATE_ORDER' });
    if (!form.guest) e.bookerGuestId = t('common.required');
    if (directLike && form.guest && !form.guest.phoneMasked) {
      const p = normalizePhone(form.phone);
      if ('error' in p)
        e.phone =
          p.error === 'REQUIRED'
            ? t('error.PHONE_REQUIRED')
            : fieldErrorText(t, { field: 'phone', code: p.error });
    }
    if (form.group === 'ota' && !form.otaRef.trim()) e.otaRef = t('common.required');
    if (form.group === 'internal' && form.internalNote.trim().length < 3)
      e.internalNote = t('field_error.reason_required');
    if (overCapacity && form.group !== 'ota')
      e.occ = t('error.CAPACITY_EXCEEDED', { room: room!.roomNo, max: room!.maxOccupancy ?? '' });
    rateList.forEach((r, i) => {
      if (r.raw && !((parseVnd(r.raw) ?? 0) > 0))
        e[`nightlyRates[${i}].amountVnd`] = t('booking.error.rate_empty');
    });
    if (form.group === 'ota' && rateList.some((r) => r.raw) && rateList.some((r) => !r.raw))
      e.rates = t('booking.error.rate_empty');
    if (directLike && !((parseVnd(form.depositAmount) ?? 0) > 0))
      e.deposit = t('field_error.amount_not_positive');
    if (rateWarn && form.rateReason.trim().length < 3)
      e.rateReason = t('field_error.reason_required');
    if (capWarn && form.capacityReason.trim().length < 3)
      e.capacityReason = t('field_error.reason_required');
    if (minStay !== null && lead && form.minStayReason.trim().length < 3)
      e.minStayReason = t('field_error.reason_required');
    return e;
  }

  function body(allowUnassigned = false, roomId = form.roomId): ReservationCreate {
    // ARC 16.18 bổ sung: B1 takes every night; each says whether the desk changed its box (`edited`) – typing the
    // calendar figure again is still an edit. A night left alone is not a typed rate.
    const night = (r: { date: string; raw: string }) => ({
      date: r.date,
      amountVnd: parseVnd(r.raw) ?? 0,
      edited: !!form.ratesEdited[r.date],
    });
    const anyEdited = rateList.some((r) => form.ratesEdited[r.date]);
    const nightly =
      form.group === 'ota' || form.group === 'internal'
        ? rateList.every((r) => r.raw)
          ? rateList.map(night)
          : undefined
        : ratesTouched || anyEdited
          ? rateList.map(night)
          : undefined;
    return {
      roomId,
      channelId: channel!.id,
      arrivalDate: form.arrivalDate,
      departureDate: form.departureDate,
      adults: form.occ.adults,
      children6to11: form.occ.children6to11,
      childrenUnder6: form.occ.childrenUnder6,
      bookerGuestId: form.guest!.id,
      paymentModel: form.group === 'ota' ? form.paymentModel : 'direct',
      directSource: form.group === 'direct' ? form.directSource : undefined,
      closerUserId: closerKind && form.closerUserId ? form.closerUserId : undefined,
      otaRef: form.group === 'ota' ? form.otaRef.trim() : undefined,
      nightlyRates: nightly,
      rateOverrideReason: rateWarn ? form.rateReason.trim() : undefined,
      capacityWarningAckReason: capWarn ? form.capacityReason.trim() : undefined,
      minStayOverrideReason: minStay !== null && lead ? form.minStayReason.trim() : undefined,
      allowUnassigned,
      guestEmail: form.email.trim() || undefined,
      etaTime: form.eta || undefined,
      initialPayment: directLike
        ? {
            type: 'deposit',
            method: form.depositMethod,
            amountVnd: parseVnd(form.depositAmount) ?? 0,
          }
        : undefined,
      internalNote: form.internalNote.trim() || undefined,
    };
  }

  /** Save the phone into the guest profile first (EP02 §3.2 – SĐT of the booker). */
  async function ensurePhone() {
    if (!directLike || !form.guest || form.guest.phoneMasked) return;
    const p = normalizePhone(form.phone);
    if ('error' in p) return;
    const g = (await api.getGuest({ propertyId, guestId: form.guest.id })).data;
    await api.updateGuest(
      { propertyId, guestId: g.id },
      { fullName: g.fullName, phone: `+${p.value}` },
      g.version,
    );
    set({ guest: { ...form.guest, phoneMasked: form.phone } });
  }

  function handleError(e: unknown) {
    if (!isApiError(e)) {
      setRequestError(e);
      return;
    }
    if (e.code === 'ROOM_UNAVAILABLE') {
      setConflict(e);
      return;
    }
    if (e.code === 'CAPACITY_EXCEEDED') {
      setErrors({ occ: rsvErrorText(t, e, { roomNo: room?.roomNo }) });
      return;
    }
    if (e.code === 'PHONE_REQUIRED') {
      setErrors({ phone: t('error.PHONE_REQUIRED') });
      return;
    }
    if (e.code === 'DEPOSIT_INSUFFICIENT') {
      setErrors({ deposit: rsvErrorText(t, e, { locale }) });
      return;
    }
    if (e.code === 'VALIDATION_FAILED') {
      const out: Record<string, string> = {};
      for (const fe of e.fieldErrors) {
        if (fe.code === 'LONG_STAY_REQUIRES_CONTRACT') setLongStay(true);
        else if (fe.code === 'RATE_OUT_OF_RANGE_WARNING') setRateWarn(true);
        else if (fe.code === 'CAPACITY_EXCEEDED_WARNING')
          setCapWarn({
            room: String(e.problem.roomNo ?? room?.roomNo ?? ''),
            max: String(e.problem.max ?? room?.maxOccupancy ?? ''),
            n: form.occ.adults + form.occ.children6to11,
          });
        else if (fe.code === 'MIN_STAY_NOT_MET') {
          // 0.3.5 A-05: `minStayNights` + orphan-night rooms the desk can pick instead.
          const n = Number(e.problem.minStayNights ?? 2);
          setMinStay(n);
          setMinStaySuggest(suggestionsOf(e).filter((x) => x.orphanNight !== false));
          out.departureDate = t('field.MIN_STAY_NOT_MET', { n });
        } else if (fe.code === 'RATE_OUT_OF_RANGE') {
          out[fe.field] = t('booking.error.rate_range', {
            min: String(e.problem.min ?? ''),
            max: String(e.problem.max ?? ''),
            group: '',
          });
        } else if (!(fe.field in out))
          out[fe.field] = fieldErrorText(t, fe, { n: rules.longStayFromNights });
      }
      setErrors(out);
      if (!Object.keys(out).length && !rateWarn) setRequestError(null);
      return;
    }
    setRequestError(e);
  }

  async function submit(e?: FormEvent, opts: { allowUnassigned?: boolean; roomId?: string } = {}) {
    e?.preventDefault();
    if (busy || !online) return;
    const v = opts.roomId ? {} : validate();
    setErrors(v);
    if (Object.keys(v).length || longStay) return;
    setBusy('create');
    setRequestError(null);
    try {
      await ensurePhone();
      const b = body(opts.allowUnassigned, opts.roomId ?? form.roomId);
      const sig = JSON.stringify(b);
      if (idem.current?.body !== sig) idem.current = { body: sig, key: newIdempotencyKey() };
      const key = idem.current.key;
      // DS 6.21: CONCURRENT_UPDATE / SERVICE_UNAVAILABLE → automatic resend with the same key.
      const res = await write.run(() => api.createReservation({ propertyId }, b, key));
      removeDraft(DRAFT_KEY);
      notifyChanged();
      toast(t('booking.toast.created', { code: res.data.code }));
      onCreated(res.data);
    } catch (err) {
      if (!isRetryable(err)) handleError(err);
    } finally {
      setBusy(null);
    }
  }

  /** H09 "Giữ chỗ đến …": saveQuote → createHoldFromQuote (B1 + Q2) for direct/agent, not today. */
  async function hold() {
    if (busy || !online) return;
    const v = validate();
    delete v.deposit;
    setErrors(v);
    if (Object.keys(v).length || longStay) return;
    setBusy('hold');
    try {
      await ensurePhone();
      const quote = await api.saveQuote(
        { propertyId },
        {
          type: 'short',
          roomId: form.roomId,
          arrivalDate: form.arrivalDate,
          nights,
          adults: form.occ.adults,
          children6to11: form.occ.children6to11,
          childrenUnder6: form.occ.childrenUnder6,
          channelId: channel!.id,
          guestId: form.guest!.id,
        },
        newIdempotencyKey(),
      );
      const res = await api.createHoldFromQuote(
        { propertyId, quoteId: quote.data.id },
        { holdHours: rules.holdHoursDefault, depositMethod: 'vietqr' },
        newIdempotencyKey(),
      );
      removeDraft(DRAFT_KEY);
      notifyChanged();
      toast(t('sale.hold_created', { room: room?.roomNo ?? '', code: res.data.code }));
      onCreated(res.data);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }

  const arrivalLabel = t('booking.field.arrival');
  const departureLabel = t('booking.field.departure');

  const holdUntil = (() => {
    const cap = Date.parse(`${form.arrivalDate}T${rules.holdLatestTime}:00+07:00`);
    const at = new Date(Math.min(Date.now() + rules.holdHoursDefault * 3_600_000, cap));
    return `${timeHHmm(at)} ${dayMonth(todayLocal('Asia/Ho_Chi_Minh', at))}`;
  })();

  const conflictView = conflict ? (
    <ConflictAlert
      error={conflict}
      ota={form.group === 'ota'}
      lead={lead}
      availableBefore={avail?.available === true}
      busy={busy !== null}
      onUseRoom={(roomId) => {
        set({ roomId });
        setUseRoom(roomId);
      }}
      onSaveUnassigned={() => setAskUnassigned(true)}
    />
  ) : null;

  // BUG-R2-076: the suggested room's price before creating (direct/agent: server price of THAT room;
  // OTA: the amounts the desk typed – a room change does not reprice an OTA booking).
  const picked = useRoom && useRoom === form.roomId ? room : undefined;
  const pickedPriced = !!picked && (!directLike || calc?.roomId === picked.id);
  const pickedNights = !picked
    ? []
    : directLike
      ? (calc?.nightlyRates ?? []).map((n) => ({ date: n.date, amountVnd: n.amountVnd }))
      : rateList.map((r) => ({ date: r.date, amountVnd: parseVnd(r.raw) ?? 0 }));
  const pickedTotal = directLike
    ? (calc?.totalVnd ?? 0)
    : pickedNights.reduce((a, n) => a + n.amountVnd, 0);
  const useRoomView = picked ? (
    <Alert
      tone="info"
      role="status"
      title={t('bk.use_room_check', { room: picked.roomNo })}
      actions={
        <Button
          size="sm"
          variant="pri"
          busy={busy === 'create'}
          disabled={busy !== null || !pickedPriced}
          onClick={() => void submit(undefined, { roomId: picked.id })}
        >
          {t('bk.use_room_confirm', { room: picked.roomNo })}
        </Button>
      }
    >
      {pickedPriced ? (
        <table className="sum">
          <tbody>
            {pickedNights.map((n) => (
              <tr key={n.date}>
                <td>{dayMonth(n.date)}</td>
                <td className="r num">{vnd(n.amountVnd)}</td>
              </tr>
            ))}
            {directLike && calc?.extraPersonFeeVnd ? (
              <tr>
                <td>{t('occ.fee_line', { n: calc.extraGuestCount ?? 0, nights })}</td>
                <td className="r num">{vnd(calc.extraPersonFeeVnd)}</td>
              </tr>
            ) : null}
            <tr className="total">
              <td>{t('bk.total')}</td>
              <td className="r num">
                {vnd(pickedTotal)} {t('common.vnd_unit')}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="li-s">{t('bk.use_room_pricing', { room: picked.roomNo })}</p>
      )}
    </Alert>
  ) : null;

  const reasonText = (reason?: string) =>
    reason === 'booked'
      ? t('sale.conflict')
      : reason === 'blocked'
        ? t('status.block.ooo')
        : reason === 'not_sellable'
          ? t('config.stop_sale')
          : reason === 'capacity'
            ? t('error.CAPACITY_EXCEEDED', {
                room: room?.roomNo ?? '',
                max: room?.maxOccupancy ?? '',
              })
            : reason === 'past_date'
              ? t('booking.error.past_date')
              : '';

  return (
    <Modal
      open
      size="lg"
      title={t('booking.new.title')}
      meta={draftAt ? t('crm.draft_saved', { time: draftAt }) : undefined}
      closeLabel={t('common.close')}
      onClose={onClose}
      footer={
        <>
          <Button className="left" onClick={onClose}>
            {t('booking.close_draft')}
          </Button>
          {directLike && form.arrivalDate > today && online ? (
            <Button
              busy={busy === 'hold'}
              disabled={busy !== null || longStay}
              onClick={() => void hold()}
            >
              {t('booking.create_hold', { time: holdUntil })}
            </Button>
          ) : null}
          {online ? (
            <Button
              variant="pri"
              type="submit"
              form="booking-form"
              busy={busy === 'create'}
              busyLabel={write.busyLabel ?? t('bk.checking')}
              disabled={busy !== null || longStay}
            >
              {t('booking.create')}
            </Button>
          ) : (
            <Button variant="pri" disabled>
              {t('bk.create_offline')}
            </Button>
          )}
        </>
      }
    >
      <form id="booking-form" onSubmit={(e) => void submit(e)} noValidate>
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('bk.offline')}
          </Alert>
        ) : null}
        {catalog.status === 'error' ? (
          <Alert
            tone="bad"
            actions={
              <Button size="sm" onClick={catalog.reload}>
                {t('common.retry')}
              </Button>
            }
          >
            {t('common.error_generic_title')}
          </Alert>
        ) : null}
        {write.notice}
        {requestError ? (
          // UXR #9: ROOM_BLOCKED / ROOM_NOT_SELLABLE… need the room and dates of the conflict.
          <Alert tone="bad">
            {rsvErrorText(t, requestError, { canSeeGuest: true, roomNo: room?.roomNo, locale })}
          </Alert>
        ) : null}
        {conflictView ?? useRoomView}
        {longStay ? (
          <Alert
            tone="info"
            role="status"
            title={t('bk.long_title', { n: nights })}
            actions={
              <Button
                size="sm"
                variant="pri"
                onClick={() =>
                  onLongStay({
                    roomId: form.roomId,
                    arrivalDate: form.arrivalDate,
                    departureDate: form.departureDate,
                  })
                }
              >
                {t('bk.to_manual_long')}
              </Button>
            }
          >
            {t('bk.long_body')}
          </Alert>
        ) : null}

        <div className="g-2">
          <Field
            label={t('booking.field.room')}
            required
            error={errors.roomId}
            help={
              avail && !avail.available
                ? `${reasonText(avail.reason)}${avail.alt.length ? ` · ${t('booking.error.conflict_alt', { rooms: avail.alt.join(', ') })}` : ''}`
                : t('bk.room_help')
            }
          >
            {(p) => (
              <select
                {...p}
                className="input"
                value={form.roomId}
                onChange={(e) => set({ roomId: e.target.value })}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNo} · {r.name} ({r.baseOccupancy ?? '?'}/{r.maxOccupancy ?? '?'})
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className={`field${errors.arrivalDate || errors.departureDate ? ' invalid' : ''}`}>
            <span className="lbl" id="bk-dates-l">
              {t('booking.field.dates')}{' '}
              <span className="req" aria-hidden="true">
                *
              </span>
            </span>
            <div className="daterange" role="group" aria-labelledby="bk-dates-l">
              <input
                className="input"
                type="date"
                aria-label={arrivalLabel}
                min={today}
                value={form.arrivalDate}
                aria-invalid={errors.arrivalDate ? true : undefined}
                onChange={(e) => {
                  const a = e.target.value;
                  set({
                    arrivalDate: a,
                    departureDate: form.departureDate > a ? form.departureDate : addDays(a, 1),
                  });
                  setMinStay(null);
                }}
              />
              <span className="arrow" aria-hidden="true">
                →
              </span>
              <input
                className="input"
                type="date"
                aria-label={departureLabel}
                min={form.arrivalDate ? addDays(form.arrivalDate, 1) : today}
                value={form.departureDate}
                aria-invalid={errors.departureDate ? true : undefined}
                onChange={(e) => {
                  set({ departureDate: e.target.value });
                  setMinStay(null);
                }}
              />
            </div>
            <span className="help">
              {datesOk ? t('booking.field.nights', { n: nights }) : ''}
              {avail?.available ? ` · ${t('bk.free_ok')}` : ''}
            </span>
            {errors.arrivalDate || errors.departureDate ? (
              <div className="err" role="alert">
                <span>{errors.arrivalDate ?? errors.departureDate}</span>
              </div>
            ) : null}
          </div>
        </div>
        {minStay !== null && minStaySuggest.length ? (
          <div className="conflict-list mb-12">
            {minStaySuggest.map((x) => (
              <Button
                key={x.roomId}
                size="sm"
                disabled={busy !== null || (!!x.upgrade && !lead)}
                onClick={() => {
                  set({ roomId: x.roomId });
                  setMinStay(null);
                  setMinStaySuggest([]);
                  setUseRoom(x.roomId);
                }}
              >
                {t('bk.use_room_orphan', { room: x.roomNo })}
              </Button>
            ))}
          </div>
        ) : null}
        {minStay !== null && lead ? (
          <Field label={t('bk.reason_ph')} required error={errors.minStayReason}>
            {(p) => (
              <input
                {...p}
                className="input"
                value={form.minStayReason}
                onChange={(e) => set({ minStayReason: e.target.value })}
              />
            )}
          </Field>
        ) : null}

        <div className="field">
          <span className="lbl" id="bk-ch-l">
            {t('booking.field.channel')}{' '}
            <span className="req" aria-hidden="true">
              *
            </span>
          </span>
          <Seg
            labelledBy="bk-ch-l"
            value={form.group}
            onChange={(group) => {
              set({ group });
              setRateWarn(false);
              setCapWarn(null);
            }}
            options={[
              { value: 'direct', label: t('bk.ch_direct') },
              { value: 'agent', label: t('bk.ch_agent') },
              { value: 'ota', label: t('bk.ch_ota') },
              { value: 'internal', label: t('bk.ch_internal') },
            ]}
          />
        </div>
        {form.group === 'direct' ? (
          <div className="g-2">
            <Field
              label={t('bk.source')}
              required
              error={errors.directSource}
              help={
                autoReturning && form.directSource === 'returning'
                  ? t('bk.source_auto_returning', { date: dayMonth(autoReturning) })
                  : t('bk.source_help')
              }
            >
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={form.directSource}
                  onChange={(e) => set({ directSource: e.target.value as DirectSource })}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.key)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        ) : null}
        {closerKind ? (
          <div className="g-2">
            {/* 0.3.5 A-06: who closed the deal (commission BR-903) – from listCloserCandidates. */}
            <Field
              label={t(closerKind === 'agent' ? 'bk.closer' : 'bk.closer_sales')}
              error={errors.closerUserId}
            >
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={form.closerUserId}
                  onChange={(e) => set({ closerUserId: e.target.value })}
                >
                  <option value="">–</option>
                  {closers
                    .filter((c) => c.kind === closerKind)
                    .map((c) => (
                      <option key={c.userId} value={c.userId}>
                        {c.displayName}
                      </option>
                    ))}
                </select>
              )}
            </Field>
          </div>
        ) : null}
        {form.group === 'ota' ? (
          <div className="g-3">
            <Field label={t('bk.ota_name')} required>
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={channel?.id ?? ''}
                  onChange={(e) => set({ otaChannelId: e.target.value })}
                >
                  {channelsOf('ota').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t('booking.field.ota_code')} required error={errors.otaRef}>
              {(p) => (
                <input
                  {...p}
                  className="input mono"
                  value={form.otaRef}
                  maxLength={64}
                  onChange={(e) => set({ otaRef: e.target.value })}
                />
              )}
            </Field>
            <Field label={t('bk.payment_model')}>
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={form.paymentModel}
                  onChange={(e) => set({ paymentModel: e.target.value as Form['paymentModel'] })}
                >
                  <option value="ota_prepaid">{t('booking.field.ota_paid')}</option>
                  <option value="ota_pay_at_property">{t('bk.pay_at_property')}</option>
                </select>
              )}
            </Field>
          </div>
        ) : null}
        {form.group === 'internal' ? (
          <>
            <p className="help muted">{t('bk.internal_help')}</p>
            <Field label={t('crm.f_note')} required error={errors.internalNote}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  value={form.internalNote}
                  onChange={(e) => set({ internalNote: e.target.value })}
                />
              )}
            </Field>
          </>
        ) : null}

        <OccupancyField
          value={form.occ}
          onChange={(occ) => set({ occ })}
          room={
            room
              ? {
                  roomNo: room.roomNo,
                  baseOccupancy: room.baseOccupancy,
                  maxOccupancy: room.maxOccupancy,
                }
              : undefined
          }
          error={errors.occ ?? errors.adults}
          enforceMax={form.group !== 'ota'}
        />

        <div className="g-2">
          <GuestPicker
            label={t('booking.field.guest')}
            required
            initialText={form.guest?.displayName}
            error={errors.bookerGuestId}
            help={t('bk.guest_help')}
            onSelect={(guest) => {
              // FB-R2-DOM-FE-02 (D-6): a guest who stayed before → preselect "Khách quay lại".
              const auto = !!guest.lastStayDate && form.directSource === 'zalo_phone';
              set(auto ? { guest, directSource: 'returning' } : { guest });
              setAutoReturning(auto ? guest.lastStayDate! : null);
            }}
          />
          {directLike && form.guest && !form.guest.phoneMasked ? (
            <Field
              label={t('booking.field.phone')}
              required
              help={t('booking.field.phone_help')}
              error={errors.phone}
            >
              {(p) => (
                <input
                  {...p}
                  className="input num"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                />
              )}
            </Field>
          ) : errors.phone ? (
            <Alert tone="bad">{errors.phone}</Alert>
          ) : (
            <div />
          )}
          <Field label={t('booking.email')} help={t('booking.email_help')}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            )}
          </Field>
          <Field label={t('bk.eta')} help={t('bk.eta_help', { time: '22:00' })}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="time"
                value={form.eta}
                onChange={(e) => set({ eta: e.target.value })}
              />
            )}
          </Field>
        </div>

        {dates.length && !longStay ? (
          <div className={`field${errors.rates ? ' invalid' : ''}`}>
            <span className="lbl">{t('booking.field.rate')}</span>
            <div className="table-wrap rate-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('bk.night')}</th>
                    <th className="r">{t('rate.pre_tier')}</th>
                    <th>{t('bk.rate_source')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rateList.map((r, i) => {
                    const err = errors[`nightlyRates[${i}].amountVnd`];
                    return (
                      <tr key={r.date}>
                        <td>{dayMonth(r.date)}</td>
                        <td className="r">
                          <input
                            className="cell-input"
                            inputMode="numeric"
                            aria-label={`${t('rate.pre_tier')} ${dayMonth(r.date)}`}
                            aria-invalid={err ? true : undefined}
                            readOnly={ratesLocked || undefined}
                            value={r.raw}
                            onChange={(e) =>
                              set({
                                rates: { ...form.rates, [r.date]: e.target.value },
                                ratesEdited: { ...form.ratesEdited, [r.date]: true },
                              })
                            }
                          />
                          {err ? <div className="err">{err}</div> : null}
                        </td>
                        <td className="li-s">
                          {calc ? t(weekend(r.date) ? 'bk.src_weekend' : 'bk.src_list') : '–'}
                          {(() => {
                            // DOM S4-38: the stepped price of the night, as the server priced it (untouched).
                            const n = calc?.nightlyRates?.find((x) => x.date === r.date);
                            return losPct > 0 && n && parseVnd(r.raw) === calendarOf(r.date) ? (
                              <div>
                                {t('rate.after_tier', { pct: losPct, amount: money(n.amountVnd) })}
                              </div>
                            ) : null;
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {losPct > 0 ? (
              <span className="help">
                {ratesLocked
                  ? t('rate.tier_locked', { n: nights, pct: losPct })
                  : ratesTouched
                    ? t('rate.tier_on_save', { n: nights, pct: losPct })
                    : t('rate.tier_note', { n: nights, pct: losPct })}
              </span>
            ) : null}
            {errors.rates ? <div className="err">{errors.rates}</div> : null}
            {calcError ? (
              <span className="help">{rsvErrorText(t, calcError, { roomNo: room?.roomNo })}</span>
            ) : null}
          </div>
        ) : null}
        {capWarn ? (
          <Alert tone="warn" role="alert" title={t('booking.capacity_warning', capWarn)}>
            <Field
              label={t('booking.capacity_reason')}
              help={t('booking.capacity_reason_help')}
              required
              error={errors.capacityReason}
            >
              {(p) => (
                <input
                  {...p}
                  className="input"
                  value={form.capacityReason}
                  onChange={(e) => set({ capacityReason: e.target.value })}
                />
              )}
            </Field>
          </Alert>
        ) : null}
        {rateWarn ? (
          <Alert tone="warn" title={t('bk.ota_rate_warn')}>
            <Field label={t('bk.reason_ph')} required error={errors.rateReason}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  value={form.rateReason}
                  onChange={(e) => set({ rateReason: e.target.value })}
                />
              )}
            </Field>
          </Alert>
        ) : null}

        {directLike && calc && !longStay ? (
          <>
            <table className="sum" aria-label={t('booking.summary.total')}>
              <tbody>
                <tr>
                  <td>
                    {t('booking.field.nights', { n: nights })}
                    {losPct > 0 && ratesTouched ? ` · ${t('rate.pre_tier_short')}` : ''}
                  </td>
                  <td className="r">{vnd(roomTotal)}</td>
                </tr>
                <tr className="sub">
                  <td>
                    {calc.losDiscountPct
                      ? t('sale.los_applied', { pct: calc.losDiscountPct })
                      : t('bk.los_none')}
                  </td>
                  <td className="r" />
                </tr>
                {extraFee > 0 ? (
                  <tr>
                    <td>{t('occ.fee_line', { n: calc.extraGuestCount ?? extra, nights })}</td>
                    <td className="r">{vnd(extraFee)}</td>
                  </tr>
                ) : null}
                <tr className="total">
                  <td>{t('bk.total')}</td>
                  <td className="r">
                    {vnd(roomTotal + extraFee)} {t('common.vnd_unit')}
                  </td>
                </tr>
                <tr className="sub">
                  <td>{t('bk.deposit_line', { pct: rules.depositPct })}</td>
                  <td className="r">{vnd(calc.depositVnd ?? 0)}</td>
                </tr>
              </tbody>
            </table>
            <div className="g-2 mt-12">
              <Field label={t('rsv.amount_received')} required error={errors.deposit}>
                {(p) => (
                  <div className="input-affix">
                    <input
                      {...p}
                      className="input num"
                      inputMode="numeric"
                      value={form.depositAmount}
                      onChange={(e) => set({ depositAmount: e.target.value })}
                    />
                    <span className="affix">{t('common.vnd_unit')}</span>
                  </div>
                )}
              </Field>
              <Field label={t('pay.method')}>
                {(p) => (
                  <select
                    {...p}
                    className="input"
                    value={form.depositMethod}
                    onChange={(e) => set({ depositMethod: e.target.value as PaymentMethod })}
                  >
                    {METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {t(m.key)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          </>
        ) : null}
      </form>
      {askUnassigned ? (
        <ConfirmDialog
          danger={false}
          title={t('bk.unassigned_confirm_title')}
          body={t('bk.unassigned_confirm_body', { ota_ref: form.otaRef.trim() })}
          keepLabel={t('bk.unassigned_back')}
          confirmLabel={t('bk.save_unassigned')}
          busy={busy !== null}
          onKeep={() => setAskUnassigned(false)}
          onConfirm={() => {
            setAskUnassigned(false);
            void submit(undefined, { allowUnassigned: true });
          }}
        />
      ) : null}
    </Modal>
  );
}

/** 409 ROOM_UNAVAILABLE (US-018 AC1/AC2, US-139): who/when + free rooms from `suggestions[]`. */
function ConflictAlert({
  error,
  ota,
  lead,
  availableBefore,
  busy,
  onUseRoom,
  onSaveUnassigned,
}: {
  error: unknown;
  ota: boolean;
  lead: boolean;
  availableBefore: boolean;
  busy: boolean;
  onUseRoom: (roomId: string) => void;
  onSaveUnassigned: () => void;
}) {
  const { t } = useI18n();
  const c = conflictsOf(error)[0];
  const sugg = suggestionsOf(error);
  const buttons = sugg.map((s) => (
    <Button
      key={s.roomId}
      size="sm"
      variant={!s.upgrade && sugg[0] === s && ota ? 'pri' : 'default'}
      disabled={busy || (s.upgrade && !lead)}
      onClick={() => onUseRoom(s.roomId)}
    >
      {t('bk.use_room', { room: s.roomNo })}
      {s.upgrade ? ` · ${lead ? t('move.resolution.upgrade') : t('rsv.upgrade_needs_lead')}` : ''}
    </Button>
  ));
  if (ota) {
    const nights = [...(c?.nights ?? [])].sort();
    return (
      <Alert
        tone="warn"
        role="alert"
        title={t('bk.ota_conflict_title', {
          room: c?.roomNo ?? '',
          from: nights[0] ? dayMonth(nights[0]) : '',
          to: nights.length ? dayMonth(addDays(nights.at(-1)!, 1)) : '',
        })}
        actions={
          <>
            {buttons}
            <Button size="sm" disabled={busy} onClick={onSaveUnassigned}>
              {t('bk.save_unassigned')}
            </Button>
          </>
        }
      >
        {t('bk.ota_conflict_body')}
      </Alert>
    );
  }
  return (
    <Alert
      tone="bad"
      title={
        availableBefore
          ? t('booking.error.server_conflict')
          : rsvErrorText(t, error, { canSeeGuest: true })
      }
      actions={buttons.length ? buttons : undefined}
    >
      {sugg.length
        ? t('booking.error.conflict_alt', {
            rooms:
              sugg
                .filter((s) => !s.upgrade)
                .map((s) => s.roomNo)
                .join(', ') || '–',
          })
        : null}
    </Alert>
  );
}
