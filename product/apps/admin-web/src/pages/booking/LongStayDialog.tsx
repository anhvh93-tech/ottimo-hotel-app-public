import {
  isApiError,
  newIdempotencyKey,
  type GuestSummary,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { readDraft, removeDraft, writeDraft } from '../../app/clientData';
import { timeHHmm, todayLocal } from '../../app/dates';
import { notifyChanged } from '../../app/live';
import { parseVnd } from '../../app/money';
import { fieldErrorText, problemView } from '../../app/problem';
import { addDays, nightsBetween, rsvErrorText } from '../../app/reservations';
import { useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { normalizePhone } from '../../app/validation';
import { GuestPicker } from '../../components/GuestPicker';
import { OccupancyField, type Occupancy } from '../../components/OccupancyField';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId, useSession } from '../../session/SessionProvider';

export interface LongStayPrefill {
  roomId?: string;
  arrivalDate?: string;
  departureDate?: string;
}

interface Form {
  roomId: string;
  arrivalDate: string;
  departureDate: string;
  occ: Occupancy;
  guest: GuestSummary | null;
  phone: string;
  rent: string;
  deposit: string;
  contractRef: string;
  note: string;
}

/** Draft key scoped to the signed-in user (FB-R2-SEC-FE-05). */
const draftKey = (userId: string | undefined) => `booking.longStay.${userId ?? 'anon'}`;

/**
 * H10 Đơn dài hạn nhập tay (US-017 AC5a – temporary R2). The booking only occupies the room on the
 * rack (anti double-booking, KPIs); the paper contract, billing periods and deposit stay outside the
 * app: no nightly prices, no payment here, `paymentModel=direct` on a direct channel (no channel field).
 */
export function LongStayDialog({
  prefill,
  onClose,
  onCreated,
  onShortStay,
}: {
  prefill?: LongStayPrefill;
  onClose: () => void;
  onCreated: (r: Reservation) => void;
  onShortStay: () => void;
}) {
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const { roles, me } = useSession();
  const DRAFT_KEY = draftKey(me?.id);
  const rules = useRules(propertyId, roles);
  const catalog = useCatalog(propertyId);
  const toast = useToast();
  const { online } = useOnline();
  const today = todayLocal();
  const [form, setForm] = useState<Form>(() => {
    const draft = !prefill ? readDraft(DRAFT_KEY) : null;
    if (draft) return JSON.parse(draft) as Form;
    const arrival = prefill?.arrivalDate ?? today;
    return {
      roomId: prefill?.roomId ?? '',
      arrivalDate: arrival,
      departureDate: prefill?.departureDate ?? addDays(arrival, 182),
      occ: { adults: 1, children6to11: 0, childrenUnder6: 0 },
      guest: null,
      phone: '',
      rent: '',
      deposit: '',
      contractRef: '',
      note: '',
    };
  });
  const [draftAt, setDraftAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const idem = useRef<{ body: string; key: string } | null>(null);
  const set = (patch: Partial<Form>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      writeDraft(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
    setDraftAt(timeHHmm(new Date()));
    setRequestError(null);
  };

  const rooms = catalog.rooms.filter((r) => r.isSellable !== false || r.id === form.roomId);
  const room = catalog.rooms.find((r) => r.id === form.roomId);
  const direct = catalog.channels.find((c) => c.channelGroup === 'direct' && c.isActive);
  const nights = nightsBetween(form.arrivalDate, form.departureDate);
  const months = Math.floor(nights / 30);
  const belowThreshold = nights > 0 && nights < rules.longStayFromNights;

  useEffect(() => {
    if (!form.roomId && rooms[0]) set({ roomId: rooms[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.roomId) e.roomId = t('common.required');
    if (!form.arrivalDate) e.arrivalDate = t('common.required');
    else if (form.arrivalDate < today) e.arrivalDate = t('booking.error.past_date');
    if (nights <= 0)
      e.departureDate = fieldErrorText(t, { field: 'departureDate', code: 'DATE_ORDER' });
    else if (belowThreshold)
      e.departureDate = t('lsm.below_threshold', { n: nights, min: rules.longStayFromNights });
    if (!form.guest) e.bookerGuestId = t('common.required');
    else if (!form.guest.phoneMasked) {
      const p = normalizePhone(form.phone);
      if ('error' in p) e.phone = t('error.PHONE_REQUIRED');
    }
    if (!((parseVnd(form.rent) ?? 0) > 0)) e.rent = t('field_error.amount_not_positive');
    if (form.deposit && parseVnd(form.deposit) === null)
      e.deposit = t('field_error.amount_not_positive');
    if (room && form.occ.adults + form.occ.children6to11 > (room.maxOccupancy ?? 99))
      e.occ = t('error.CAPACITY_EXCEEDED', { room: room.roomNo, max: room.maxOccupancy ?? '' });
    return e;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !online) return;
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length || !direct) return;
    setBusy(true);
    try {
      if (form.guest && !form.guest.phoneMasked) {
        const p = normalizePhone(form.phone);
        if ('value' in p) {
          const g = (await api.getGuest({ propertyId, guestId: form.guest.id })).data;
          await api.updateGuest(
            { propertyId, guestId: g.id },
            { fullName: g.fullName, phone: `+${p.value}` },
            g.version,
          );
        }
      }
      const body = {
        roomId: form.roomId,
        channelId: direct.id,
        arrivalDate: form.arrivalDate,
        departureDate: form.departureDate,
        adults: form.occ.adults,
        children6to11: form.occ.children6to11,
        childrenUnder6: form.occ.childrenUnder6,
        bookerGuestId: form.guest!.id,
        paymentModel: 'direct' as const,
        allowUnassigned: false,
        manualLongStay: {
          monthlyRentVnd: parseVnd(form.rent) ?? 0,
          depositHeldVnd: form.deposit ? (parseVnd(form.deposit) ?? 0) : undefined,
          externalContractRef: form.contractRef.trim() || undefined,
          note: form.note.trim() || undefined,
        },
      };
      const sig = JSON.stringify(body);
      if (idem.current?.body !== sig) idem.current = { body: sig, key: newIdempotencyKey() };
      const res = await api.createReservation({ propertyId }, body, idem.current.key);
      removeDraft(DRAFT_KEY);
      notifyChanged();
      toast(t('booking.toast.created', { code: res.data.code }));
      onCreated(res.data);
    } catch (err) {
      if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        const out: Record<string, string> = {};
        for (const fe of err.fieldErrors) {
          const field = fe.field.replace(/^manualLongStay\.monthlyRentVnd$/, 'rent');
          out[field] =
            fe.code === 'MANUAL_LONG_STAY_BELOW_THRESHOLD'
              ? t('lsm.below_threshold', { n: nights, min: rules.longStayFromNights })
              : fieldErrorText(t, fe);
        }
        setErrors(out);
      } else if (isApiError(err) && err.code === 'CAPACITY_EXCEEDED') {
        setErrors({ occ: rsvErrorText(t, err, { roomNo: room?.roomNo }) });
      } else if (isApiError(err) && err.code === 'PHONE_REQUIRED') {
        setErrors({ phone: t('error.PHONE_REQUIRED') });
      } else setRequestError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      title={
        <>
          {t('lsm.title')} <Chip tone="info">{t('status.booking.long_term')}</Chip>
        </>
      }
      meta={draftAt ? t('crm.draft_saved', { time: draftAt }) : undefined}
      closeLabel={t('common.close')}
      onClose={onClose}
      footer={
        <>
          <Button className="left" onClick={onClose}>
            {t('booking.close_draft')}
          </Button>
          {online ? (
            <Button
              variant="pri"
              type="submit"
              form="longstay-form"
              busy={busy}
              busyLabel={t('common.saving')}
            >
              {t('lsm.create')}
            </Button>
          ) : (
            <Button variant="pri" disabled>
              {t('bk.create_offline')}
            </Button>
          )}
        </>
      }
    >
      <form id="longstay-form" onSubmit={(e) => void submit(e)} noValidate>
        <Alert tone="info" role="note" title={t('lsm.flag')}>
          {t('lsm.flag_body')}
        </Alert>
        {!online ? <Alert tone="warn">{t('bk.offline')}</Alert> : null}
        {requestError ? (
          <Alert tone="bad">
            {isApiError(requestError) && requestError.status === 409
              ? rsvErrorText(t, requestError, { roomNo: room?.roomNo, canSeeGuest: true })
              : problemView(t, requestError).text}
          </Alert>
        ) : null}
        <div className="g-3">
          <Field label={t('booking.field.room')} required error={errors.roomId}>
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
          <Field label={t('lsm.move_in')} required error={errors.arrivalDate}>
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                min={today}
                value={form.arrivalDate}
                onChange={(e) => set({ arrivalDate: e.target.value })}
              />
            )}
          </Field>
          <Field
            label={t('lsm.move_out')}
            required
            error={errors.departureDate}
            help={nights > 0 ? t('lsm.duration', { months, nights }) : undefined}
          >
            {(p) => (
              <input
                {...p}
                className="input"
                type="date"
                min={form.arrivalDate}
                value={form.departureDate}
                onChange={(e) => set({ departureDate: e.target.value })}
              />
            )}
          </Field>
        </div>
        {belowThreshold ? (
          <Button size="sm" className="mb-12" onClick={onShortStay}>
            {t('lsm.to_short')}
          </Button>
        ) : null}
        <div className="g-2">
          <GuestPicker
            label={t('booking.field.guest')}
            required
            initialText={form.guest?.displayName}
            error={errors.bookerGuestId}
            onSelect={(guest) => set({ guest })}
          />
          {form.guest && !form.guest.phoneMasked ? (
            <Field label={t('booking.field.phone')} required error={errors.phone}>
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
          ) : null}
        </div>
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
          error={errors.occ}
          footnote={t('lsm.extra_note')}
        />
        <div className="g-3">
          <Field label={t('lsm.rent')} required help={t('lsm.rent_help')} error={errors.rent}>
            {(p) => (
              <div className="input-affix">
                <input
                  {...p}
                  className="input num"
                  inputMode="numeric"
                  value={form.rent}
                  onChange={(e) => set({ rent: e.target.value })}
                  onBlur={() => {
                    const n = parseVnd(form.rent);
                    if (n !== null) set({ rent: vnd(n) });
                  }}
                />
                <span className="affix">{t('common.vnd_unit')}</span>
              </div>
            )}
          </Field>
          <Field label={t('lsm.deposit')} help={t('lsm.deposit_help')} error={errors.deposit}>
            {(p) => (
              <div className="input-affix">
                <input
                  {...p}
                  className="input num"
                  inputMode="numeric"
                  value={form.deposit}
                  onChange={(e) => set({ deposit: e.target.value })}
                  onBlur={() => {
                    const n = parseVnd(form.deposit);
                    if (n !== null) set({ deposit: vnd(n) });
                  }}
                />
                <span className="affix">{t('common.vnd_unit')}</span>
              </div>
            )}
          </Field>
          <Field label={t('lsm.contract_ref')}>
            {(p) => (
              <input
                {...p}
                className="input mono"
                maxLength={64}
                value={form.contractRef}
                onChange={(e) => set({ contractRef: e.target.value })}
              />
            )}
          </Field>
        </div>
        <Field label={t('lsm.note')}>
          {(p) => (
            <textarea
              {...p}
              className="input"
              maxLength={500}
              value={form.note}
              onChange={(e) => set({ note: e.target.value })}
            />
          )}
        </Field>
        <p className="li-s">{t('lsm.not_generated')}</p>
      </form>
    </Modal>
  );
}
