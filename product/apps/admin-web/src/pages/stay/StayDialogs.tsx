import {
  deriveIdempotencyKey,
  isApiError,
  newIdempotencyKey,
  type FocRequestInput,
  type FolioLine,
  type AvailabilityResult,
  type GuestSummary,
  type ChangeRoomPreview,
  type ChargeCatalogItem,
  type ExtensionOptions,
  type LateCheckoutResult,
  type Party,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox, ConfirmDialog, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { api } from '../../app/api';
import { addDays, currentSegment, dayMonth, suggestionsOf } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { useBusinessDay } from '../../app/businessDay';
import { timeHHmm } from '../../app/dates';
import { useCatalog } from '../../app/catalog';
import { channelName } from '../../app/reservations';
import { useRoomGroupNames } from '../../app/roomGroups';
import { useRules } from '../../app/rules';
import { problemView } from '../../app/problem';
import { LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { GuestPicker } from '../../components/GuestPicker';
import {
  FilePicker,
  MoneyField,
  STAY_WRITE_RETRY,
  amountOf,
  useSubmit,
  useUnsavedLabels,
} from './common';
import { PartySourceField, needsPartySource, usePartySource } from './PartySource';
import { unclaimedSlots } from '../registration/partyDocs';
import {
  SurchargeFocFields,
  focHeadroom,
  noSurchargeFoc,
  surchargeFocBody,
  surchargeFocMissing,
  type SurchargeFoc,
} from './foc';

export interface StayDialogProps {
  reservation: Reservation;
  onClose: () => void;
  /** Saved – the drawer reloads the reservation (and the rack via `notifyChanged`). */
  onDone: (updated?: Reservation) => void;
}

const OWN_MGR = ['owner', 'manager'];
// K11-03: the room of today (after a mid-stay B14 `segments[0]` is the room left).
/**
 * The room the stay is in on the BUSINESS day (BR-010, BUG-R2-211): at 02:40 a stay whose next segment starts on the
 * calendar day D is still in last night's room (night window – QA 24/10).
 */
function useRoomNo(r: Reservation): string {
  const day = useBusinessDay();
  return currentSegment(r.segments, day)?.roomNo ?? '';
}
const guestOf = (r: Reservation) => r.booker?.displayName ?? '';

/** H15 15.2 Gia hạn (B13, US-028): consecutive free nights only, default rate, OTA → child booking. */
export function ExtendDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const roomNo = useRoomNo(r);
  const { t, vnd, money, date } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const catalog = useCatalog(propertyId);
  const R = { propertyId, reservationId: r.id };
  const opts = useResource(async () => (await api.getExtensionOptions(R)).data, [r.id]);
  const o: ExtensionOptions | undefined = opts.state.data;
  const [n, setN] = useState(1);
  const [visaReason, setVisaReason] = useState('');
  // ARC 16.18 / BR-417 phụ lục 5A (vòng sửa 5): `nights[].defaultRateVnd` already is the agreed / min rate when the
  // booking has one (AN-45 – what "Giữ giá đơn" used to fill in), and a rate sent is recorded as typed by the desk.
  // H15 has no box to change a night's rate, so no `nightlyRates` are sent: every new night is the server's default.
  const act = useSubmit(undefined, STAY_WRITE_RETRY);
  const nights = o?.nights.slice(0, n) ?? [];
  const rateOf = (x: { defaultRateVnd?: number }) => x.defaultRateVnd ?? 0;
  const total = nights.reduce((a, x) => a + rateOf(x), 0);
  // FE-S3-03: `repricing[].nights` = nights ADDED; the button shows what the guest pays extra
  // (`deltaVnd`), `repricedTotalVnd` is the room total of the whole booking after the extension.
  const reprice = o?.repricing?.find((x) => x.nights === n);
  const extra = reprice?.deltaVnd ?? total;
  const visaAsked =
    act.fields.visaWarningAckReason !== undefined ||
    act.fields.nights === t('field.VISA_EXPIRES_BEFORE_DEPARTURE');

  const save = async () => {
    const out = await act.submit((idem) =>
      api.extendStay(
        R,
        {
          nights: n,
          visaWarningAckReason: visaReason.trim() || undefined,
        },
        r.version,
        idem,
      ),
    );
    if (out) {
      toast(
        t('stay.toast.extended', {
          n,
          date: date(out.data.reservation.departureDate ?? addDays(r.departureDate, n)),
        }),
      );
      onDone(out.data.reservation);
    } else opts.reload();
  };

  return (
    <Modal
      open
      title={t('extend.title', { room: roomNo, guest: guestOf(r) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!o || o.maxNights < 1}
            onClick={() => void save()}
          >
            {act.label(t('extend.submit', { n, amount: money(extra) }))}
          </Button>
        </>
      }
    >
      {!o ? (
        <LoadingBlock rows={2} />
      ) : (
        <>
          <fieldset className="fieldset-plain">
            {/* DOM S4-38: the night prices are calendar prices; the BR-107 step is in the server total below. */}
            <legend className="label-h">
              {t('extend.nights')} · {t('rate.pre_tier_short')}
            </legend>
            {o.nights.map((x, i) => (
              <label key={x.date} className="check">
                <input
                  type="checkbox"
                  disabled={!x.available}
                  checked={i < n && x.available}
                  onChange={() => setN(i < n ? i : i + 1)}
                />
                {dayMonth(x.date)}
                {x.available
                  ? ` · ${vnd(rateOf(x))} · ${t('extend.night_free')}`
                  : ` · ${t('extend.night_taken')}`}
              </label>
            ))}
          </fieldset>
          <p className="li-s">{t('extend.max_hint', { max: o.maxNights })}</p>
          {o.createsChildReservation ? (
            <p className="li-s">
              {t('extend.ota_child', {
                channel: channelName(catalog.channels, r.channelCode, r.channelId),
                // BUG-R2-045: the saving for the nights chosen (root field = 1 night, kept for old servers).
                amount: money(
                  o.repricing?.find((x) => x.nights === n)?.channelFeeSavingsVnd ??
                    o.channelFeeSavingsVnd ??
                    0,
                ),
              })}
            </p>
          ) : null}
          {reprice && reprice.losDiscountPct > 0 ? (
            <Alert tone="info">
              {t('extend.los_reprice', { n: (r.nights ?? 0) + n, pct: reprice.losDiscountPct })}{' '}
              <b className="num">
                {t('bill.total')}: {money(reprice.repricedTotalVnd)}
              </b>
            </Alert>
          ) : null}
          {o.exceedsShortStayLimit ? <Alert tone="warn">{t('stay.long_hint')}</Alert> : null}
          <p>{t('extend.effects', { date: date(addDays(r.departureDate, n)) })}</p>
          <p className="li-s">{t('stay.extend_door')}</p>
          {visaAsked ? (
            <>
              <Alert tone="warn">{t('field.VISA_EXPIRES_BEFORE_DEPARTURE')}</Alert>
              <Field label={t('ci.reason')} required>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    value={visaReason}
                    onChange={(e) => setVisaReason(e.target.value)}
                  />
                )}
              </Field>
            </>
          ) : null}
          {act.view()}
        </>
      )}
    </Modal>
  );
}

/**
 * H15 15.3 Trả muộn (B15, US-029): `dryRun` on every time change (read-only, SEC A3), surcharge only
 * written when the desk ticks "đã báo khách" (BR-414, `expectedSurchargeVnd`); a same-day arrival
 * removes the 12:30 grace; FD without an alternative room sends it for approval (202).
 */
export function LateCheckoutDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const roomNo = useRoomNo(r);
  const { t, money } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const rules = useRules(propertyId, roles);
  const toast = useToast();
  const R = { propertyId, reservationId: r.id };
  const [time, setTime] = useState(r.agreedCheckoutTime ?? '');
  const q = useDebounced(time, 300);
  const [res, setRes] = useState<LateCheckoutResult | null>(null);
  const [told, setTold] = useState(false);
  // S4-25 (US-007 AC1, H15 15.3): the surcharge can be written WITH a FOC request (`requestFocForSurcharge`).
  const [foc, setFoc] = useState<SurchargeFoc>(noSurchargeFoc);
  const act = useSubmit();
  const lateIds = useId();
  const mgr = roles.some((x) => OWN_MGR.includes(x));

  useEffect(() => {
    setTold(false);
    if (!/^\d{2}:\d{2}$/.test(q)) {
      setRes(null);
      return;
    }
    let stale = false;
    api.setLateCheckout(R, { checkoutTime: q, dryRun: true, applySurcharge: false }).then(
      (x) => !stale && setRes(x.data as LateCheckoutResult),
      () => !stale && setRes(null),
    );
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, r.id]);

  const amount = res?.surchargeVnd ?? 0;
  const conflict = !!res?.arrivalSameDay && !res.arrivalSameDay.alternativeRoomAvailable && !mgr;
  const save = async (requestApproval = false) => {
    const out = await act.submit((idem) =>
      api.setLateCheckout(
        R,
        {
          checkoutTime: time,
          dryRun: false,
          applySurcharge: told && amount > 0,
          expectedSurchargeVnd: told && amount > 0 ? amount : undefined,
          requestFocForSurcharge: told ? surchargeFocBody(foc, amount) : undefined,
          requestApproval: requestApproval || undefined,
        },
        r.version,
        idem,
      ),
    );
    if (!out) return;
    if (out.status === 202) {
      toast(t('late.request_sent', { time }));
      onDone();
      return;
    }
    toast(t('stay.toast.late_set', { time }));
    if (told && surchargeFocBody(foc, amount)) toast(t('foc.sent', { amount: money(amount) }));
    onDone((out.data as LateCheckoutResult).reservation);
  };

  // After the last tier the alert above the button already says why (use Gia hạn).
  const lateWhy =
    res && !res.treatAsExtension && amount > 0
      ? !told
        ? t('ci.told_guest')
        : surchargeFocMissing(t, foc)
      : null;

  return (
    <Modal
      open
      title={t('late.title', { room: roomNo, guest: guestOf(r) })}
      onClose={onClose}
      dirty={!!time && time !== (r.agreedCheckoutTime ?? '')}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          {conflict ? (
            <Button variant="pri" busy={act.busy} onClick={() => void save(true)}>
              {t('late.request_approval')}
            </Button>
          ) : (
            <>
              {/* FE-S3-04: say why the button is locked (the reason sits next to it). */}
              {lateWhy ? (
                <span className="li-s" id={`${lateIds}-why`}>
                  {lateWhy}
                </span>
              ) : null}
              <Button
                variant="pri"
                busy={act.busy}
                busyLabel={act.busyLabel}
                disabled={!res || res.treatAsExtension}
                aria-disabled={lateWhy ? true : undefined}
                aria-describedby={lateWhy ? `${lateIds}-why` : undefined}
                onClick={() => !lateWhy && void save()}
              >
                {act.label(t('late.submit', { time }))}
              </Button>
            </>
          )}
        </>
      }
    >
      <Field label={t('late.time')} help={t('stay.late_help')} error={act.fields.checkoutTime}>
        {(p) => (
          <input
            {...p}
            type="time"
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        )}
      </Field>
      <div aria-live="polite">
        {res ? (
          res.treatAsExtension ? (
            <Alert tone="warn">{t('late.treat_as_extension', { time: rules.lateLimitTime })}</Alert>
          ) : amount > 0 ? (
            <p>
              <b>{t('late.fee', { amount: money(amount), pct: res.tierPct ?? 0 })}</b>
            </p>
          ) : (
            <p>{t('late.fee_zero')}</p>
          )
        ) : null}
        {res?.arrivalSameDay ? (
          <Alert tone={conflict ? 'bad' : 'warn'}>
            {t('late.grace_off')}{' '}
            {conflict
              ? t('late.conflict_block', { eta: res.arrivalSameDay.etaTime ?? '' })
              : t('late.arrival_warning_alt', {
                  room: roomNo,
                  eta: res.arrivalSameDay.etaTime ?? '',
                })}
          </Alert>
        ) : null}
      </div>
      {amount > 0 && !res?.treatAsExtension ? (
        <>
          <Checkbox checked={told} onChange={setTold}>
            {t('ci.told_guest')}
          </Checkbox>
          <SurchargeFocFields
            value={foc}
            onChange={setFoc}
            error={act.fields['requestFocForSurcharge.note']}
          />
        </>
      ) : null}
      {res && !res.treatAsExtension ? (
        <p className="li-s">
          {t('late.effects', { time })} {t('stay.late_door_manual')}
        </p>
      ) : null}
      <p className="li-s">{t('stay.grace_rule')}</p>
      {act.view()}
    </Modal>
  );
}

/**
 * H15 15.4 Đổi phòng khi đang ở (B14, US-024 AC2–4): reason required, new unit must be VI/VC, capacity
 * is a hard block (0.3.6 A-37). Price preview with `dryRun`; the door flag resets (hand over again).
 */
export function ChangeRoomDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const roomNo = useRoomNo(r);
  // BE-A B14 (17/10): a child booking (B9a / OTA extension) shares the room – the change goes to the
  // primary booking and moves the whole stay; the drawer stays on the child.
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const parent = useResource(
    async () =>
      r.parentReservationId
        ? (await api.getReservation({ propertyId, reservationId: r.parentReservationId })).data
        : null,
    [r.parentReservationId],
  );
  const primary = r.parentReservationId ? parent.state.data : r;
  if (!primary)
    return (
      <Modal
        open
        title={t('stay.change_title', { room: roomNo, guest: guestOf(r) })}
        onClose={onClose}
        closeLabel={t('common.close')}
      >
        {parent.state.status === 'error' ? (
          <Alert
            tone="bad"
            actions={
              <Button size="sm" onClick={parent.reload}>
                {t('common.retry')}
              </Button>
            }
          >
            {problemView(t, parent.state.error, locale).text}
          </Alert>
        ) : (
          <LoadingBlock rows={2} />
        )}
      </Modal>
    );
  return (
    <ChangeRoomForm
      reservation={primary}
      shown={r}
      onClose={onClose}
      onDone={(u) => onDone(r.parentReservationId ? undefined : u)}
    />
  );
}

function ChangeRoomForm({
  reservation: r,
  shown,
  onClose,
  onDone,
}: StayDialogProps & { shown: Reservation }) {
  const roomNo = useRoomNo(r);
  const { t, money, vnd, date } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const R = { propertyId, reservationId: r.id };
  const groupNames = useRoomGroupNames(propertyId);
  // BUG-R2-211: B14 applies from the BUSINESS day (`ctx.today`, BR-010) – 00:00–05:59 is still the day before.
  const today = useBusinessDay();
  // The stay ends at the latest departure of the primary and the child the drawer shows.
  const stayEnd = shown.departureDate > r.departureDate ? shown.departureDate : r.departureDate;
  const [cause, setCause] = useState<'property_fault' | 'guest_request'>('property_fault');
  const [reason, setReason] = useState('');
  const [roomId, setRoomId] = useState('');
  const [preview, setPreview] = useState<ChangeRoomPreview | null>(null);
  const act = useSubmit(undefined, STAY_WRITE_RETRY);
  const avail = useResource(
    async () =>
      (
        await api.searchAvailability(
          { propertyId },
          { arrival: today, departure: stayEnd, reservationId: r.id },
        )
      ).data as AvailabilityResult,
    [r.id, today],
  );
  const options = (avail.state.data?.alternatives ?? []).filter(
    (x) => x.available && x.roomNo !== roomNo,
  );
  // 409 ROOM_UNAVAILABLE (busy before the effective departure) → the server's suggested free room.
  const suggested = suggestionsOf(act.error).filter((x) => x.roomNo !== roomNo);
  const target =
    options.find((x) => x.roomId === roomId) ?? suggested.find((x) => x.roomId === roomId);

  useEffect(() => {
    if (!roomId) return;
    let stale = false;
    setPreview(null);
    api
      .previewChangeRoom(R, {
        newRoomId: roomId,
        effectiveDate: today,
        cause,
        reason: reason || 'preview',
      })
      .then(
        (x) => !stale && setPreview(x.data),
        (e: unknown) => !stale && act.setError(e),
      );
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, cause, today]);

  const save = async () => {
    if (!target || reason.trim().length < 3) return;
    const out = await act.submit((idem) =>
      api.changeRoom(
        R,
        { newRoomId: roomId, effectiveDate: today, cause, reason: reason.trim() },
        r.version,
        idem,
      ),
    );
    if (out) {
      toast(t('stay.toast.moved', { room: target.roomNo }));
      onDone(out.data);
    }
  };

  return (
    <Modal
      open
      title={t('stay.change_title', { room: roomNo, guest: guestOf(r) })}
      onClose={onClose}
      dirty={!!reason.trim() || !!roomId}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!target || reason.trim().length < 3}
            onClick={() => void save()}
          >
            {act.label(t('stay.change_submit', { room: target?.roomNo ?? '' }))}
          </Button>
        </>
      }
    >
      <span className="label-h" id={`${ids}-c`}>
        {t('stay.change_cause')}
      </span>
      <Seg
        labelledBy={`${ids}-c`}
        value={cause}
        onChange={setCause}
        options={[
          { value: 'property_fault', label: t('stay.cause_fault') },
          { value: 'guest_request', label: t('stay.cause_guest') },
        ]}
      />
      <Field label={t('move.reason')} required error={act.fields.reason}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      <fieldset className="fieldset-plain">
        <legend className="label-h">{t('stay.new_room')}</legend>
        {!avail.state.data ? <LoadingBlock rows={1} /> : null}
        {avail.state.data && options.length === 0 ? (
          <Alert tone="warn">
            {t('room_change.no_rooms', { from: date(today), to: date(stayEnd) })}
          </Alert>
        ) : null}
        {options.map((x) => (
          <label key={x.roomId} className="check">
            <input
              type="radio"
              name={`${ids}-room`}
              checked={roomId === x.roomId}
              onChange={() => setRoomId(x.roomId)}
            />
            {x.roomNo}
            {/* BUG-R3-023: the group's name, not its internal code (L12 / N / NPLUS). */}
            {x.roomGroupCode ? ` · ${groupNames[x.roomGroupCode] ?? x.roomGroupCode}` : ''}
            {x.upgrade ? ` · ${t('rsv.upgrade_needs_lead')}` : ''}
          </label>
        ))}
        <p className="li-s">{t('room_change.ready_only')}</p>
      </fieldset>
      {preview?.nights.length ? (
        // Every night that moves – the child bookings' nights included (BE-A B14).
        <table className="table">
          <caption className="sr-only">{t('booking.field.rate')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('bk.night')}</th>
              <th scope="col" className="r">
                {t('bk.rate')}
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.nights.map((n) => (
              <tr key={n.date}>
                <td>{dayMonth(n.date)}</td>
                <td className="r num">
                  {n.oldRateVnd === n.newRateVnd
                    ? vnd(n.newRateVnd)
                    : `${vnd(n.oldRateVnd)} → ${vnd(n.newRateVnd)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {preview ? (
        <p className="num">
          {cause === 'property_fault' || preview.folioDeltaVnd === 0
            ? t('room_change.price_same')
            : t('room_change.price_delta', {
                amount: `${preview.folioDeltaVnd > 0 ? '+' : '−'}${money(Math.abs(preview.folioDeltaVnd))}`,
              })}
        </p>
      ) : null}
      {target ? (
        <ul className="list-plain li-s">
          <li>{t('stay.change_effect_old', { room: roomNo })}</li>
          <li>{t('stay.change_effect_door', { old: roomNo, new: target.roomNo })}</li>
          <li>{t('stay.change_effect_reg')}</li>
          <li>{t('room_change.door_reminder', { room: target.roomNo })}</li>
        </ul>
      ) : null}
      {act.view(
        undefined,
        suggested.length ? (
          <>
            {suggested.map((x) => (
              <Button key={x.roomId} size="sm" onClick={() => setRoomId(x.roomId)}>
                {t('bk.use_room', { room: x.roomNo })}
              </Button>
            ))}
          </>
        ) : undefined,
      )}
    </Modal>
  );
}

/**
 * H15 15.5 Thêm phát sinh (US-032): catalog price (not editable for fees/penalties – BR-511/512),
 * penalties need a photo or a note as evidence; the photo goes through `uploadAttachment`
 * (`penalty_evidence`) and only its id is sent with the line.
 */
export function AddChargeDialog({
  reservation: r,
  onClose,
  onDone,
  preset,
}: StayDialogProps & { preset?: string }) {
  const { t, money } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const toast = useToast();
  const catalog = useResource(
    async () => (await api.getChargeCatalog({ propertyId })).data.data,
    [propertyId],
  );
  const items: ChargeCatalogItem[] = catalog.state.data ?? [];
  const [code, setCode] = useState('');
  const item =
    items.find((x) => x.code === (code || preset)) ?? items.find((x) => x.category === preset);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const act = useSubmit();
  const houseRulesMissing = !r.houseRulesSentAt && item?.category === 'penalty';

  const save = async () => {
    if (!item) return;
    const out = await act.submit(async (idem) => {
      let evidence: string[] | undefined;
      if (photo) {
        const up = await api.uploadAttachment(
          { propertyId },
          photo,
          'penalty_evidence',
          deriveIdempotencyKey(idem, 'attachment'),
          r.id,
        );
        evidence = [up.data.id];
      }
      return api.addFolioLine(
        { propertyId, folioId: r.folioId },
        {
          chargeCode: item.code,
          quantity: Number(qty.replace(',', '.')),
          unitPriceVnd: item.priceEditable && price ? amountOf(price) : undefined,
          note: note.trim() || undefined,
          evidenceAttachmentIds: evidence,
        },
        idem,
      );
    });
    if (out) {
      setPhoto(null);
      toast(t('stay.toast.charge_added', { item: item.name }));
      onDone();
    }
  };

  return (
    <Modal
      open
      title={t('stay.add_charge')}
      onClose={onClose}
      dirty={!!note.trim() || !!photo || !!price || qty !== '1'}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!item}
            onClick={() => void save()}
          >
            {act.label(t('stay.add_charge_submit'))}
          </Button>
        </>
      }
    >
      <Field label={t('stay.charge_item')} required error={act.fields.chargeCode}>
        {(p) => (
          <select
            {...p}
            className="input"
            value={item?.code ?? ''}
            onChange={(e) => setCode(e.target.value)}
          >
            <option value="" disabled>
              {t('stay.charge_choose')}
            </option>
            {items.map((x) => (
              <option key={x.code} value={x.code}>
                {x.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      {item ? (
        <p className="li-s">
          {t('stay.charge_default', {
            amount: money(item.defaultUnitPriceVnd),
            rule: item.ruleRef ?? item.name,
          })}
        </p>
      ) : null}
      <div className="g-2">
        <Field label={t('stay.qty')} required error={act.fields.quantity}>
          {(p) => (
            <input
              {...p}
              className="input num"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          )}
        </Field>
        {item?.priceEditable ? (
          <MoneyField
            label={t('co.amount')}
            value={price}
            onChange={setPrice}
            error={act.fields.unitPriceVnd}
          />
        ) : null}
      </div>
      {item?.evidenceRequired ? (
        <>
          <FilePicker label={t('stay.add_photo')} file={photo} onChange={setPhoto} />
          <Field label={t('stay.evidence')} error={act.fields.evidenceAttachmentIds}>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>
        </>
      ) : (
        <Field label={t('stay.note')}>
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>
      )}
      {houseRulesMissing ? <Alert tone="warn">{t('co.house_rules_not_sent')}</Alert> : null}
      {act.view()}
    </Modal>
  );
}

/** H15 15.5 "Xác nhận giờ trả" (US-030): channel + reply; after 12:00 → use "Trả muộn". */
export function ConfirmTimeDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const rules = useRules(propertyId, roles);
  const toast = useToast();
  const ids = useId();
  const [channel, setChannel] = useState<'phone' | 'in_person' | 'zalo_copy'>('phone');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const act = useSubmit();
  const late = time > rules.checkoutTime;
  const save = async () => {
    const out = await act.submit((idem) =>
      api.recordCheckoutConfirmation(
        { propertyId, reservationId: r.id },
        {
          channel,
          replyType: !time ? 'on_time' : late ? 'late' : 'time',
          confirmedTime: time || undefined,
          note: note.trim() || undefined,
        },
        idem,
      ),
    );
    if (out) {
      toast(t('stay.card_answered', { time: time || rules.checkoutTime }));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('today.confirm_time')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            onClick={() => void save()}
          >
            {act.label(t('common.save'))}
          </Button>
        </>
      }
    >
      <span className="label-h" id={`${ids}-ch`}>
        {t('stay.reply_channel')}
      </span>
      <Seg
        labelledBy={`${ids}-ch`}
        value={channel}
        onChange={setChannel}
        options={[
          { value: 'phone', label: t('stay.ch_phone') },
          { value: 'in_person', label: t('stay.ch_in_person') },
          { value: 'zalo_copy', label: t('stay.ch_zalo') },
        ]}
      />
      <Field label={t('checkout.departure_time')} error={act.fields.confirmedTime}>
        {(p) => (
          <input
            {...p}
            type="time"
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        )}
      </Field>
      {late ? <Alert tone="info">{t('stay.after_noon_hint')}</Alert> : null}
      <Field label={t('stay.note')}>
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
      {act.view()}
    </Modal>
  );
}

/** H13 13.6: tick "door code / card handed over" after check-in (B-28, set once, cannot be undone). */
export function DoorHandedDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const roomNo = useRoomNo(r);
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { me } = useSession();
  const act = useSubmit();
  const save = async () => {
    const out = await act.submit(() =>
      api.updateReservation(
        { propertyId, reservationId: r.id },
        { doorAccessHandedOver: true },
        r.version,
      ),
    );
    if (out) {
      toast(
        t('ci.door_late_done', {
          time: timeHHmm(new Date()),
          user: me?.displayName ?? '',
        }),
      );
      onDone(out.data);
    }
  };
  return (
    <ConfirmDialog
      danger={false}
      title={t('ci.door_late_title', { room: roomNo })}
      body={t('ci.door_late_body')}
      keepLabel={t('confirm.keep')}
      confirmLabel={t('drawer.action.door_handed_over')}
      busy={act.busy}
      busyLabel={act.busyLabel}
      onKeep={onClose}
      onConfirm={() => void save()}
    >
      {act.view()}
    </ConfirmDialog>
  );
}

/** H13 13.6 Hoàn tác nhận phòng (B17, MGR+): same business day, reason required. */
export function UndoCheckInDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const roomNo = useRoomNo(r);
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const act = useSubmit();
  const save = async () => {
    if (reason.trim().length < 3) return;
    const out = await act.submit((idem) =>
      api.undoCheckIn({ propertyId, reservationId: r.id }, reason.trim(), r.version, idem),
    );
    if (out) {
      toast(t('stay.toast.undo_checkin', { room: roomNo }));
      onDone(out.data);
    }
  };
  return (
    <ConfirmDialog
      title={t('ci.undo_title', { room: roomNo, guest: guestOf(r) })}
      body={t('ci.undo_body')}
      keepLabel={t('confirm.keep')}
      confirmLabel={t('drawer.action.undo_checkin')}
      confirmDisabled={reason.trim().length < 3}
      busy={act.busy}
      busyLabel={act.busyLabel}
      onKeep={onClose}
      onConfirm={() => void save()}
    >
      <Field label={t('ci.reason')} required error={act.fields.reason}>
        {(p) => (
          <input
            {...p}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      {act.view()}
    </ConfirmDialog>
  );
}

/**
 * US-022 Người đi cùng (EP03-05 4.7): list + add companion/child (children: name + birth year only,
 * no CRM profile) + remove (not the booker; documents of a removed person are deleted – A-38).
 */
/** Closing reloads the booking (members may have changed) – `onDone`, not `onClose`. */
export function PartyDialog({ reservation: r, onDone }: StayDialogProps) {
  const { t, money } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const R = { propertyId, reservationId: r.id };
  const party = useResource(async () => (await api.listParty(R)).data, [r.id]);
  const p: Party | undefined = party.state.data;
  const [kind, setKind] = useState<'companion' | 'child'>('companion');
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [companion, setCompanion] = useState<GuestSummary | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const act = useSubmit({ bound: ['guestId', 'childName', 'childBirthYear'] });
  const del = useSubmit();
  const reduceAct = useSubmit({ bound: ['partyChangeSource', 'otaModificationRef'] });
  const inHouse = r.status === 'in_house';
  // CI 39010774166 suspect (a): a person joins "from tonight" = the API's business day (`BookingRules.
  // businessDate`, the same `ctx.today` the API checks `effectiveFrom` against), read when the dialog opens –
  // never the device clock, which may be on another day (clock off, page left open past midnight, the virtual
  // day of the desk-clock stack) and would get every preview refused (422 DATE_INVALID). If the rules cannot
  // be read, the device day is the fallback: the API re-checks it and a refusal is said in the dialog.
  // Fallback = the session's business day (Me.businessDate, BR-010) – never the calendar day (night window).
  const fallbackDay = useBusinessDay();
  const businessDay = useResource(
    async () => (inHouse ? (await api.getBookingRules({ propertyId })).data.businessDate : null),
    [propertyId, inHouse],
  );
  const day: string | undefined = !inHouse
    ? undefined
    : (businessDay.state.data ?? (businessDay.state.status === 'error' ? fallbackDay : undefined));
  // S4-45 (BA EP02 mục 8, khớp server): a child's year of birth is required – it alone gives the BR-110 age
  // band, the capacity (ESC-014), BR-612 and the stay declaration. 2000 … the year of the business day.
  const maxYear = Number((day ?? fallbackDay).slice(0, 4));
  const yearText = year.trim();
  const yearNum = /^\d{4}$/.test(yearText) ? Number(yearText) : NaN;
  const yearProblem =
    kind !== 'child'
      ? null
      : !yearText
        ? t('party.child_birth_year_required')
        : !(yearNum >= 2000 && yearNum <= maxYear)
          ? t('field_error.value_out_of_range', { min: 2000, max: maxYear })
          : null;
  const ready = kind === 'child' ? name.trim().length >= 2 && !yearProblem : !!companion;
  // The server's REQUIRED on the year says what to do (BA), not a bare "Bắt buộc".
  const yearServerError = isApiError(act.error)
    ? act.error.fieldErrors.some(
        (f) => f.field.replace(/^body\./, '') === 'childBirthYear' && f.code === 'REQUIRED',
      )
      ? t('party.child_birth_year_required')
      : act.fields.childBirthYear
    : undefined;
  const member = (decision: { apply: boolean; expected?: number }, dryRun = false) => {
    const common = {
      effectiveFrom: day,
      applyExtraPersonSurcharge: decision.apply,
      expectedSurchargeVnd: decision.apply ? decision.expected : undefined,
      dryRun,
    };
    return kind === 'child'
      ? {
          role: 'child' as const,
          childName: name.trim(),
          childBirthYear: Number(year) || undefined,
          ...common,
        }
      : {
          role: 'companion' as const,
          guestId: companion!.id,
          relationship: 'unknown' as const,
          ...common,
        };
  };

  // UXR #7 (BR-110, DOM S3-12): adding a person while the guest is in house may carry a per-night
  // surcharge. The amount comes from the API (`dryRun` → occupancyChange) and the desk confirms it;
  // a surcharge is never skipped silently (the API answers 422 SURCHARGE_DECISION_REQUIRED).
  const sig =
    inHouse && ready && day && (kind === 'companion' || /^\d{4}$/.test(year.trim()))
      ? [day, kind, companion?.id ?? '', name.trim(), year.trim()].join('|')
      : '';
  const debouncedSig = useDebounced(sig, 300);
  const [previewTick, setPreviewTick] = useState(0);
  const [preview, setPreview] = useState<{
    sig: string;
    tick: number;
    surchargeVnd: number;
    nights: number;
    error?: unknown;
  } | null>(null);
  useEffect(() => {
    if (!debouncedSig || debouncedSig !== sig) return;
    let stale = false;
    const tick = previewTick;
    api.addPartyMember(R, member({ apply: false }, true)).then(
      (res) =>
        !stale &&
        setPreview({
          sig: debouncedSig,
          tick,
          surchargeVnd: res.data.occupancyChange?.surchargeVnd ?? 0,
          nights: res.data.occupancyChange?.nights ?? 0,
        }),
      (error: unknown) =>
        !stale && setPreview({ sig: debouncedSig, tick, surchargeVnd: 0, nights: 0, error }),
    );
    return () => {
      stale = true;
    };
    // `member()` reads the same state `sig` encodes – re-run only when that (or a retry) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSig, sig, previewTick, propertyId, r.id]);
  const current = preview && preview.sig === sig && preview.tick === previewTick ? preview : null;
  const previewError = current?.error;
  // A day the API no longer accepts while the stay still has nights after it (the business day rolled over
  // while the dialog was open) is a retry: "Thử lại" reads the business day again, then the amount again.
  const dayRefused =
    isApiError(previewError) &&
    !!day &&
    day < r.departureDate &&
    previewError.fieldErrors.some((fe) => fe.field.replace(/^body\./, '') === 'effectiveFrom');
  const previewRetry =
    previewError !== undefined &&
    (!isApiError(previewError) ||
      previewError.isNetwork ||
      previewError.status >= 500 ||
      dayRefused);
  const retryPreview = () => {
    if (dayRefused) businessDay.reload();
    setPreviewTick((n) => n + 1);
  };
  const surcharge = current && !previewError ? current.surchargeVnd : 0;
  // In house, nothing is added before the business day is known (the button waits with the preview).
  const waiting = (!!sig && !current) || (inHouse && ready && !day);
  // The tick belongs to one person and one amount – a new amount (or person) must be confirmed again.
  const [toldFor, setToldFor] = useState<string | null>(null);
  const told = surcharge > 0 && toldFor === `${sig}|${surcharge}`;
  // S4-25 / BUG-R2-093 (BR-414 second way, US-022 AC4): write the surcharge AND ask a FOC on it – one request
  // per night (the extra-person FOC is keyed by night, BR-434); 0.3.7 has no `requestFocForSurcharge` here.
  const [partyFoc, setPartyFoc] = useState<SurchargeFoc>(noSurchargeFoc);
  const [focFailed, setFocFailed] = useState(0);
  const blockedReason =
    surcharge > 0 && !told
      ? t('party.surcharge_needs_confirm')
      : told
        ? surchargeFocMissing(t, partyFoc)
        : null;
  const helpId = `${ids}-sur`;
  // S4-45: an empty year locks "Thêm" with its reason next to the button (the UXD "… để bật nút" pattern).
  const lockReason =
    blockedReason ??
    (kind === 'child' && name.trim().length >= 2 && !yearText ? yearProblem : null);

  // Shown for the person it was about only (picking someone else clears it).
  const [surchargeProblem, setSurchargeProblem] = useState<{
    key: 'party.surcharge_required' | 'party.surcharge_changed';
    amount: number;
    sig: string;
  } | null>(null);
  const surchargeNotice = surchargeProblem?.sig === sig ? surchargeProblem : null;
  const add = async () => {
    if (!ready || waiting || previewError !== undefined || blockedReason) return;
    setSurchargeProblem(null);
    setFocFailed(0);
    const askFoc = told && !!surchargeFocBody(partyFoc, surcharge);
    // The nights' extra-person lines before the person is added: the FOC asks only this person's share.
    const before = askFoc
      ? await api.getFolio({ propertyId, folioId: r.folioId }).then(
          (x) => x.data.lines,
          () => null,
        )
      : null;
    const caught: { error?: unknown } = {};
    const out = await act.submit((idem) =>
      api
        .addPartyMember(
          R,
          member(told ? { apply: true, expected: surcharge } : { apply: false }),
          idem,
        )
        .catch((e: unknown) => {
          caught.error = e;
          throw e;
        }),
    );
    if (out) {
      setName('');
      setYear('');
      setCompanion(null);
      setToldFor(null);
      toast(t('common.saved'));
      party.reload();
      if (askFoc && day) {
        const { sent, failed } = await askNightFoc(
          propertyId,
          r.folioId,
          day,
          before,
          surchargeFocBody(partyFoc, surcharge)!,
        );
        if (sent) toast(t('party.foc_sent', { n: sent }));
        setFocFailed(failed);
      }
      setPartyFoc(noSurchargeFoc());
      return;
    }
    // 422 SURCHARGE_DECISION_REQUIRED / 409 SURCHARGE_CHANGED: say it in this dialog's words (not the
    // check-in/late check-out sentence) and read the amount again.
    const failed = caught.error;
    if (isApiError(failed)) {
      const amount = Number(failed.problem.surchargeVnd ?? surcharge);
      if (failed.code === 'SURCHARGE_CHANGED') {
        setSurchargeProblem({ key: 'party.surcharge_changed', amount, sig });
        setPreviewTick((n) => n + 1);
      } else if (failed.fieldErrors.some((fe) => fe.code === 'SURCHARGE_DECISION_REQUIRED')) {
        setSurchargeProblem({ key: 'party.surcharge_required', amount, sig });
        setPreviewTick((n) => n + 1);
      } else if (
        failed.fieldErrors.some((fe) => fe.field.replace(/^body\./, '') === 'effectiveFrom')
      ) {
        // The business day rolled over since the preview: read it again (→ a new preview and amount).
        businessDay.reload();
      }
    }
  };
  const [reduce, setReduce] = useState<{ n: number; version: number } | null>(null);
  // S4-39 (0.3.7, SEC-BE-53 main option; BUG-R2-085/090): a person without a linked ID leaves while IDs the
  // guest sent through the link wait unlinked → the desk says which "Khách n" slot was theirs, or "none".
  // Known from the masked registration when it can be read; otherwise the server asks (422 + personIndexes).
  const [slots, setSlots] = useState<number[] | null>(null);
  const [slot, setSlot] = useState<number | 'none' | null>(null);
  useEffect(() => {
    setSlots(null);
    setSlot(null);
    if (!removing || !r.registrationId) return;
    let stale = false;
    api.getRegistration({ propertyId, registrationId: r.registrationId }).then(
      (g) => {
        if (stale) return;
        const linked = g.data.documents.some((d) => d.partyMemberId === removing);
        const free = unclaimedSlots(g.data);
        setSlots(!linked && free.length ? free : null);
      },
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [removing, propertyId, r.registrationId]);
  const slotMissing = !!slots && slot === null;
  const remove = async (memberId: string) => {
    if (slotMissing) return;
    const adult = p?.members?.find((m) => m.id === memberId)?.priceAgeBand === 'adult';
    let failed: unknown = null;
    const out = await del.submit((idem) =>
      api
        .removePartyMember(
          R,
          memberId,
          p?.version ?? r.version,
          idem,
          slots ? (slot ?? undefined) : undefined,
        )
        .catch((e: unknown) => {
          failed = e;
          throw e;
        }),
    );
    if (out === undefined) {
      const asked =
        isApiError(failed) &&
        failed.fieldErrors.some(
          (fe) => fe.field.replace(/^(body|query)\./, '') === 'guestUploadPersonIndex',
        );
      if (asked) {
        // The server knows the slots: ask in this box, keep it open (nothing was removed).
        const idx = (failed as { problem: { personIndexes?: unknown } }).problem.personIndexes;
        if (Array.isArray(idx) && idx.length) setSlots(idx.map(Number));
        setSlot(null);
        del.reset();
        return;
      }
      setRemoving(null);
      return;
    }
    setRemoving(null);
    party.reload();
    // EP03-05 4.7: removing a person may lower the guest count – ask, never change it silently.
    if (adult) {
      const fresh = (await api.getReservation(R).catch(() => null))?.data;
      if (fresh && fresh.adults > 1) setReduce({ n: fresh.adults - 1, version: fresh.version });
    }
  };
  // 0.3.6 add. 4: an OTA booking before check-in says where the change comes from.
  const askSource = needsPartySource(r);
  const source = usePartySource();
  const reduceCount = async () => {
    if (!reduce) return;
    const out = await reduceAct.submit(() =>
      api.updateReservation(
        R,
        askSource ? { adults: reduce.n, ...source.body() } : { adults: reduce.n },
        reduce.version,
      ),
    );
    if (!out) return;
    setReduce(null);
    toast(t('common.saved'));
    party.reload();
  };
  const nameOf = (id: string | null) => {
    const m = p?.members?.find((x) => x.id === id);
    return m?.guest?.displayName ?? m?.childDisplayName ?? '';
  };
  const registered = ['sent', 'confirmed', 'updated'].includes(r.registrationStatus ?? '');
  return (
    <Modal
      open
      title={t('rsv.party')}
      onClose={() => onDone()}
      closeLabel={t('common.close')}
      dirty={!!name.trim() || !!companion}
      unsavedLabels={unsaved}
      footer={<Button onClick={() => onDone()}>{t('common.close')}</Button>}
    >
      {!p ? (
        <LoadingBlock rows={2} />
      ) : (
        <>
          {p.missingCount ? (
            <Alert tone="warn">{t('party.missing', { n: p.missingCount })}</Alert>
          ) : null}
          <ul className="list-none">
            {(p.members ?? []).map((m) => (
              <li key={m.id} className="person">
                <div className="grow">
                  <b>{m.guest?.displayName ?? m.childDisplayName}</b>
                  <div className="li-s">
                    {m.role === 'booker'
                      ? t('rsv.booker')
                      : m.role === 'child'
                        ? t('rsv.child')
                        : ''}
                  </div>
                </div>
                {m.role !== 'booker' ? (
                  <Button size="sm" variant="ghost" onClick={() => setRemoving(m.id)}>
                    {t('party.remove')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <fieldset className="fieldset-plain">
            <legend className="label-h">{t('rsv.add_person')}</legend>
            <span className="label-h" id={`${ids}-k`}>
              {t('rsv.person_kind')}
            </span>
            <Seg
              labelledBy={`${ids}-k`}
              value={kind}
              onChange={setKind}
              options={[
                { value: 'companion', label: t('party.kind.adult') },
                { value: 'child', label: t('rsv.child') },
              ]}
            />
            {kind === 'companion' ? (
              <GuestPicker
                label={t('booking.field.guest')}
                required
                error={act.fields.guestId}
                onSelect={(g) => setCompanion(g)}
              />
            ) : null}
            <div className="g-2">
              {kind === 'child' ? (
                <Field
                  label={t('checkin.docs.field.full_name')}
                  required
                  error={act.fields.childName}
                >
                  {(fp) => (
                    <input
                      {...fp}
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  )}
                </Field>
              ) : null}
              {kind === 'child' ? (
                <Field
                  label={t('party.child_birth_year')}
                  required
                  help={t('rsv.child_note')}
                  error={
                    yearServerError ??
                    // a typed year outside the range – said at the box; an empty box is said next to "Thêm"
                    (yearText ? (yearProblem ?? undefined) : undefined)
                  }
                >
                  {(fp) => (
                    <input
                      {...fp}
                      className="input num"
                      inputMode="numeric"
                      maxLength={4}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  )}
                </Field>
              ) : null}
            </div>
            {sig || waiting ? (
              <div aria-live="polite" className="stack">
                {previewRetry ? (
                  <Alert
                    tone="warn"
                    actions={
                      <Button size="sm" onClick={retryPreview}>
                        {t('common.retry')}
                      </Button>
                    }
                  >
                    {t('party.surcharge_preview_failed')}
                  </Alert>
                ) : previewError !== undefined ? (
                  <Alert tone="bad">{act.text(previewError)}</Alert>
                ) : waiting ? (
                  <p className="li-s" role="status">
                    {t('party.surcharge_loading')}
                  </p>
                ) : surcharge > 0 ? (
                  <>
                    <h3 className="label-h">{t('party.surcharge_title')}</h3>
                    <p>
                      <b>
                        {t('party.surcharge_line', {
                          amount: money(surcharge),
                          nights: current?.nights ?? 0,
                        })}
                      </b>
                    </p>
                    <Checkbox
                      checked={told}
                      onChange={(v) => setToldFor(v ? `${sig}|${surcharge}` : null)}
                    >
                      {t('party.surcharge_confirm', { amount: money(surcharge) })}
                    </Checkbox>
                    {told ? <SurchargeFocFields value={partyFoc} onChange={setPartyFoc} /> : null}
                  </>
                ) : (
                  <p className="li-s">{t('party.surcharge_zero')}</p>
                )}
              </div>
            ) : null}
            {surchargeNotice ? (
              <Alert tone="bad">
                {t(surchargeNotice.key, { amount: money(surchargeNotice.amount) })}
              </Alert>
            ) : (
              act.view()
            )}
            {focFailed ? (
              <Alert tone="warn">{t('party.foc_failed', { n: focFailed })}</Alert>
            ) : null}
            <Button
              busy={act.busy}
              disabled={!ready || waiting || previewError !== undefined || !!blockedReason}
              aria-describedby={lockReason ? helpId : undefined}
              onClick={() => void add()}
            >
              {t('rsv.add_submit')}
            </Button>
            {lockReason ? (
              <p className="li-s" id={helpId}>
                {lockReason}
              </p>
            ) : null}
          </fieldset>
          {del.view()}
        </>
      )}
      {removing ? (
        <ConfirmDialog
          title={t('party.remove_confirm', { name: nameOf(removing) })}
          body={registered ? t('party.remove_registered') : ''}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('party.remove')}
          busy={del.busy}
          confirmDisabled={slotMissing}
          confirmHelpId={slotMissing ? `${ids}-slot-why` : undefined}
          onKeep={() => setRemoving(null)}
          onConfirm={() => void remove(removing)}
        >
          {slots ? (
            <fieldset className="fieldset-plain stack">
              <legend className="label-h">
                {t('party.slot_question', { name: nameOf(removing) })}
              </legend>
              {slots.map((n) => (
                <label key={n} className="check">
                  <input
                    type="radio"
                    name={`${ids}-slot`}
                    checked={slot === n}
                    onChange={() => setSlot(n)}
                  />
                  {t('guest.oci.person_n', { n })}
                </label>
              ))}
              <label className="check">
                <input
                  type="radio"
                  name={`${ids}-slot`}
                  checked={slot === 'none'}
                  onChange={() => setSlot('none')}
                />
                {t('party.slot_none')}
              </label>
              <p className="li-s">{t('party.slot_help')}</p>
              {r.registrationId ? (
                // Compare the photos through the existing C3 route (H14, step-up, auto-hide).
                <a
                  className="li-s"
                  href={`/registration/${r.registrationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('party.slot_compare')}
                </a>
              ) : null}
              {slotMissing ? (
                <p className="li-s" id={`${ids}-slot-why`}>
                  {t('party.slot_required')}
                </p>
              ) : null}
            </fieldset>
          ) : null}
        </ConfirmDialog>
      ) : null}
      {reduce ? (
        <ConfirmDialog
          danger={false}
          title={t('party.reduce_count', { n: reduce.n })}
          body={t('party.reduce_count_body')}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('party.reduce_submit', { n: reduce.n })}
          busy={reduceAct.busy}
          busyLabel={reduceAct.busyLabel}
          onKeep={() => setReduce(null)}
          onConfirm={() => void reduceCount()}
        >
          {askSource ? (
            <PartySourceField reservation={r} state={source} fields={reduceAct.fields} />
          ) : null}
          {reduceAct.view()}
        </ConfirmDialog>
      ) : null}
    </Modal>
  );
}

/** EP03-05 2.6 – "Đề nghị hoàn {creditVnd}" while the folio is open (createRefundRequest, A43). */
export function RefundRequestDialog({
  reservation: r,
  creditVnd,
  onClose,
  onDone,
}: StayDialogProps & { creditVnd: number }) {
  const { t, vnd, money } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [amount, setAmount] = useState(vnd(creditVnd));
  const [reason, setReason] = useState('');
  const act = useSubmit();
  const save = async () => {
    const out = await act.submit((idem) =>
      api.createRefundRequest(
        { propertyId, folioId: r.folioId },
        { amountVnd: amountOf(amount), reason: reason.trim() },
        idem,
      ),
    );
    if (out) {
      // ADD3-01 (SEC/ARC 24/10): on a settled folio a staff member cut (A32), the server routes the request to
      // the owner – say who decides.
      toast(t(out.data.requiredRole === 'owner' ? 'refund.requested_owner' : 'refund.requested'));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('refund.request_overpayment', { amount: money(creditVnd) })}
      onClose={onClose}
      dirty={!!reason.trim()}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={reason.trim().length < 3}
            onClick={() => void save()}
          >
            {act.label(t('refund.request_overpayment', { amount: money(amountOf(amount)) }))}
          </Button>
        </>
      }
    >
      <MoneyField
        label={t('co.amount')}
        value={amount}
        onChange={setAmount}
        error={act.fields.amountVnd}
        required
      />
      <Field label={t('ci.reason')} required error={act.fields.reason}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      {/* A field error (REFUND_EXCEEDS_APPROVED + max, reason) sits under its field – not said twice. */}
      {act.fields.amountVnd || act.fields.reason ? null : act.view()}
    </Modal>
  );
}

/**
 * S4-25 / BUG-R2-093: after a person joins with the extra-person surcharge written, one FOC request per night
 * from `from` – the amount = what this addition put on that night (line now − line before), at most what is
 * left to ask on it (S4-23 (6)). Requests are sent one by one; the ones that fail are counted (folio: retry).
 */
export async function askNightFoc(
  propertyId: string,
  folioId: string,
  from: string,
  before: FolioLine[] | null,
  foc: FocRequestInput,
): Promise<{ sent: number; failed: number }> {
  const nightLines = (lines: FolioLine[]) => {
    const reversed = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
    return lines.filter(
      (l) =>
        l.category === 'extra_person' &&
        l.lineState === 'posted' &&
        !l.reversalOfId &&
        !reversed.has(l.id) &&
        !!l.serviceDate &&
        l.serviceDate >= from,
    );
  };
  const old = new Map<string, number>();
  for (const l of nightLines(before ?? [])) old.set(l.serviceDate!, l.amountVnd);
  let lines: FolioLine[];
  try {
    lines = (await api.getFolio({ propertyId, folioId })).data.lines;
  } catch {
    return { sent: 0, failed: 1 };
  }
  let sent = 0;
  let failed = 0;
  for (const l of nightLines(lines)) {
    const amountVnd = Math.min(l.amountVnd - (old.get(l.serviceDate!) ?? 0), focHeadroom(lines, l));
    if (!(amountVnd > 0)) continue;
    try {
      await api.requestFoc(
        { propertyId, folioId },
        l.id,
        { ...foc, amountVnd },
        newIdempotencyKey(),
      );
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed };
}
