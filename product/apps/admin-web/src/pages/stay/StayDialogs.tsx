import {
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
import { addDays, dayMonth } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { timeHHmm, todayLocal } from '../../app/dates';
import { useCatalog } from '../../app/catalog';
import { channelName } from '../../app/reservations';
import { useRules } from '../../app/rules';
import { LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { GuestPicker } from '../../components/GuestPicker';
import { FilePicker, MoneyField, amountOf, useSubmit, useUnsavedLabels } from './common';

export interface StayDialogProps {
  reservation: Reservation;
  onClose: () => void;
  /** Saved – the drawer reloads the reservation (and the rack via `notifyChanged`). */
  onDone: (updated?: Reservation) => void;
}

const OWN_MGR = ['owner', 'manager'];
const roomOf = (r: Reservation) => r.segments?.[0]?.roomNo ?? '';
const guestOf = (r: Reservation) => r.booker?.displayName ?? '';

/** H15 15.2 Gia hạn (B13, US-028): consecutive free nights only, default rate, OTA → child booking. */
export function ExtendDialog({ reservation: r, onClose, onDone }: StayDialogProps) {
  const { t, vnd, money, date } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const catalog = useCatalog(propertyId);
  const R = { propertyId, reservationId: r.id };
  const opts = useResource(async () => (await api.getExtensionOptions(R)).data, [r.id]);
  const o: ExtensionOptions | undefined = opts.state.data;
  const [n, setN] = useState(1);
  const [visaReason, setVisaReason] = useState('');
  // E04-07 "Giữ giá đơn": the booking has an agreed rate (≠ calendar) → reuse it for the new nights.
  const bookingRate = o?.currentBookingRateVnd ?? null;
  const [keep, setKeep] = useState(false);
  const act = useSubmit();
  const nights = o?.nights.slice(0, n) ?? [];
  const rateOf = (x: { defaultRateVnd?: number }) =>
    keep && bookingRate !== null ? bookingRate : (x.defaultRateVnd ?? 0);
  const total = nights.reduce((a, x) => a + rateOf(x), 0);
  // FE-S3-03: `repricing[].nights` = nights ADDED; the button shows what the guest pays extra
  // (`deltaVnd`), `repricedTotalVnd` is the room total of the whole booking after the extension.
  // `repricing` is computed on calendar prices – with the kept rate the button shows the kept
  // nights (the server re-applies BR-107 on save).
  const reprice = keep ? undefined : o?.repricing?.find((x) => x.nights === n);
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
          nightlyRates:
            keep && bookingRate !== null
              ? nights.map((x) => ({ date: x.date, amountVnd: bookingRate }))
              : undefined,
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
      title={t('extend.title', { room: roomOf(r), guest: guestOf(r) })}
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
            <legend className="label-h">{t('extend.nights')}</legend>
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
          {bookingRate !== null ? (
            <div className="stack">
              <Button size="sm" aria-pressed={keep} onClick={() => setKeep((k) => !k)}>
                {t('extend.keep_rate', { amount: money(bookingRate) })}
              </Button>
              <p className="li-s">{t('extend.keep_rate_help')}</p>
            </div>
          ) : null}
          <p className="li-s">{t('extend.max_hint', { max: o.maxNights })}</p>
          {o.createsChildReservation ? (
            <p className="li-s">
              {t('extend.ota_child', {
                channel: channelName(catalog.channels, r.channelCode, r.channelId),
                amount: money(o.channelFeeSavingsVnd ?? 0),
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
    onDone((out.data as LateCheckoutResult).reservation);
  };

  // After the last tier the alert above the button already says why (use Gia hạn).
  const lateWhy = res && !res.treatAsExtension && amount > 0 && !told ? t('ci.told_guest') : null;

  return (
    <Modal
      open
      title={t('late.title', { room: roomOf(r), guest: guestOf(r) })}
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
                  room: roomOf(r),
                  eta: res.arrivalSameDay.etaTime ?? '',
                })}
          </Alert>
        ) : null}
      </div>
      {amount > 0 && !res?.treatAsExtension ? (
        <Checkbox checked={told} onChange={setTold}>
          {t('ci.told_guest')}
        </Checkbox>
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
  const { t, money, date } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const R = { propertyId, reservationId: r.id };
  const today = todayLocal();
  const [cause, setCause] = useState<'property_fault' | 'guest_request'>('property_fault');
  const [reason, setReason] = useState('');
  const [roomId, setRoomId] = useState('');
  const [preview, setPreview] = useState<ChangeRoomPreview | null>(null);
  const act = useSubmit();
  const avail = useResource(
    async () =>
      (
        await api.searchAvailability(
          { propertyId },
          { arrival: today, departure: r.departureDate, reservationId: r.id },
        )
      ).data as AvailabilityResult,
    [r.id],
  );
  const options = (avail.state.data?.alternatives ?? []).filter(
    (x) => x.available && x.roomNo !== roomOf(r),
  );
  const target = options.find((x) => x.roomId === roomId);

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
  }, [roomId, cause]);

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
      title={t('stay.change_title', { room: roomOf(r), guest: guestOf(r) })}
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
            {t('room_change.no_rooms', { from: date(today), to: date(r.departureDate) })}
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
            {x.roomGroupCode ? ` · ${x.roomGroupCode}` : ''}
            {x.upgrade ? ` · ${t('rsv.upgrade_needs_lead')}` : ''}
          </label>
        ))}
        <p className="li-s">{t('room_change.ready_only')}</p>
      </fieldset>
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
          <li>{t('stay.change_effect_old', { room: roomOf(r) })}</li>
          <li>{t('stay.change_effect_door', { old: roomOf(r), new: target.roomNo })}</li>
          <li>{t('stay.change_effect_reg')}</li>
          <li>{t('room_change.door_reminder', { room: target.roomNo })}</li>
        </ul>
      ) : null}
      {act.view()}
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
          `${idem}-a`,
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
      title={t('ci.door_late_title', { room: roomOf(r) })}
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
      toast(t('stay.toast.undo_checkin', { room: roomOf(r) }));
      onDone(out.data);
    }
  };
  return (
    <ConfirmDialog
      title={t('ci.undo_title', { room: roomOf(r), guest: guestOf(r) })}
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
  const { t } = useI18n();
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
  const act = useSubmit();
  const del = useSubmit();
  const ready = kind === 'child' ? name.trim().length >= 2 : !!companion;
  const add = async () => {
    if (!ready) return;
    const effectiveFrom = r.status === 'in_house' ? todayLocal() : undefined;
    const out = await act.submit((idem) =>
      api.addPartyMember(
        R,
        kind === 'child'
          ? {
              role: 'child',
              childName: name.trim(),
              childBirthYear: Number(year) || undefined,
              effectiveFrom,
              applyExtraPersonSurcharge: false,
              dryRun: false,
            }
          : {
              role: 'companion',
              guestId: companion!.id,
              relationship: 'unknown',
              effectiveFrom,
              applyExtraPersonSurcharge: false,
              dryRun: false,
            },
        idem,
      ),
    );
    if (out) {
      setName('');
      setYear('');
      setCompanion(null);
      toast(t('common.saved'));
      party.reload();
    }
  };
  const [reduce, setReduce] = useState<{ n: number; version: number } | null>(null);
  const remove = async (memberId: string) => {
    const adult = p?.members?.find((m) => m.id === memberId)?.priceAgeBand === 'adult';
    const out = await del.submit((idem) =>
      api.removePartyMember(R, memberId, p?.version ?? r.version, idem),
    );
    setRemoving(null);
    if (out === undefined) return;
    party.reload();
    // EP03-05 4.7: removing a person may lower the guest count – ask, never change it silently.
    if (adult) {
      const fresh = (await api.getReservation(R).catch(() => null))?.data;
      if (fresh && fresh.adults > 1) setReduce({ n: fresh.adults - 1, version: fresh.version });
    }
  };
  const reduceCount = async () => {
    if (!reduce) return;
    const out = await del.submit(() =>
      api.updateReservation(R, { adults: reduce.n }, reduce.version),
    );
    setReduce(null);
    if (out) {
      toast(t('common.saved'));
      party.reload();
    }
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
                <Field label={t('party.child_birth_year')} help={t('rsv.child_note')}>
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
            {act.view()}
            <Button busy={act.busy} disabled={!ready} onClick={() => void add()}>
              {t('rsv.add_submit')}
            </Button>
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
          onKeep={() => setRemoving(null)}
          onConfirm={() => void remove(removing)}
        />
      ) : null}
      {reduce ? (
        <ConfirmDialog
          danger={false}
          title={t('party.reduce_count', { n: reduce.n })}
          body={t('party.reduce_count_body')}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('party.reduce_submit', { n: reduce.n })}
          busy={del.busy}
          onKeep={() => setReduce(null)}
          onConfirm={() => void reduceCount()}
        />
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
      toast(t('refund.requested'));
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
      {act.view()}
    </Modal>
  );
}
