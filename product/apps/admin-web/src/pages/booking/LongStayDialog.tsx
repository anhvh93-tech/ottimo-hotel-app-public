import {
  isApiError,
  newIdempotencyKey,
  type DirectSource,
  type GuestSummary,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { readDraft, removeDraft, writeDraft } from '../../app/clientData';
import { useBusinessDay, useBusinessDayChange } from '../../app/businessDay';
import { timeHHmm } from '../../app/dates';
import { notifyChanged } from '../../app/live';
import { isRetryable, useWrite } from '../../app/useWrite';
import { parseVnd } from '../../app/money';
import { fieldErrorText, problemView } from '../../app/problem';
import { addDays, dayMonth, nightsBetween, rsvErrorText } from '../../app/reservations';
import { useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { normalizePhone } from '../../app/validation';
import { GuestPicker } from '../../components/GuestPicker';
import { OccupancyField, type Occupancy } from '../../components/OccupancyField';
import { useOnline } from '../../hooks/useOnline';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { monoArgs } from '../../app/mono';
import { ContactMatches, type WebRequestLink } from '../webreq/ContactMatches';
import { LONG_STAY_SOURCES } from './directSources';

export interface LongStayPrefill {
  roomId?: string;
  arrivalDate?: string;
  departureDate?: string;
  /** R3 v1.0 (US-155 AC2): a long stay asked on the website – guests and the linked request. */
  occ?: Occupancy;
  webRequest?: WebRequestLink;
}

interface Form {
  roomId: string;
  arrivalDate: string;
  departureDate: string;
  occ: Occupancy;
  guest: GuestSummary | null;
  phone: string;
  /** BUG-R3-019: the server requires a source on a direct booking (US-155) – same options as H09. */
  directSource: DirectSource;
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
  // BUG-R2-211 (BR-010): the business day, not the calendar day.
  const today = useBusinessDay();
  const [form, setForm] = useState<Form>(() => {
    const draft = !prefill ? readDraft(DRAFT_KEY) : null;
    // A draft saved before BUG-R3-019 has no source → the H09 default.
    if (draft)
      return { directSource: 'zalo_phone', ...(JSON.parse(draft) as Partial<Form>) } as Form;
    const arrival = prefill?.arrivalDate ?? today;
    return {
      roomId: prefill?.roomId ?? '',
      arrivalDate: arrival,
      departureDate: prefill?.departureDate ?? addDays(arrival, 182),
      occ: prefill?.occ ?? { adults: 1, children6to11: 0, childrenUnder6: 0 },
      guest: null,
      phone: prefill?.webRequest?.contact?.phone ?? '',
      directSource: 'zalo_phone',
      rent: '',
      deposit: '',
      contractRef: '',
      note: '',
    };
  });
  // The default arrival follows the server's business day while it is untouched.
  useBusinessDayChange(today, (was, now) =>
    setForm((f) =>
      f.arrivalDate === was && f.departureDate === addDays(was, 182)
        ? { ...f, arrivalDate: now, departureDate: addDays(now, 182) }
        : f,
    ),
  );
  const [draftAt, setDraftAt] = useState<string | null>(null);
  const [autoReturning, setAutoReturning] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requestError, setRequestError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const idem = useRef<{ body: string; key: string } | null>(null);
  const write = useWrite();
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
        // US-155 AC2: from a website request the server sets the source (Website) itself.
        directSource: prefill?.webRequest ? undefined : form.directSource,
        allowUnassigned: false,
        manualLongStay: {
          monthlyRentVnd: parseVnd(form.rent) ?? 0,
          depositHeldVnd: form.deposit ? (parseVnd(form.deposit) ?? 0) : undefined,
          externalContractRef: form.contractRef.trim() || undefined,
          note: form.note.trim() || undefined,
        },
        websiteBookingRequestId: prefill?.webRequest?.id,
      };
      const sig = JSON.stringify(body);
      if (idem.current?.body !== sig) idem.current = { body: sig, key: newIdempotencyKey() };
      const key = idem.current.key;
      // DS 6.21: CONCURRENT_UPDATE / SERVICE_UNAVAILABLE → automatic resend with the same key.
      const res = await write.run(() => api.createReservation({ propertyId }, body, key));
      removeDraft(DRAFT_KEY);
      notifyChanged();
      toast(t('booking.toast.created', { code: res.data.code }));
      onCreated(res.data);
    } catch (err) {
      if (isRetryable(err)) return;
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
          {prefill?.webRequest
            ? monoArgs(t, 'webreq.booking_from', { code: prefill.webRequest.code }, ['code'])
            : t('lsm.title')}{' '}
          <Chip tone="info">{t('status.booking.long_term')}</Chip>
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
              busyLabel={write.busyLabel ?? t('common.saving')}
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
        {prefill?.webRequest ? (
          <Alert tone="info" icon="globe" role="note">
            {t('webreq.booking_hint')}
          </Alert>
        ) : null}
        {!online ? <Alert tone="warn">{t('bk.offline')}</Alert> : null}
        {write.notice}
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
          {prefill?.webRequest?.contact ? (
            <ContactMatches
              contact={prefill.webRequest.contact}
              chosen={form.guest}
              onPick={(guest) => set({ guest })}
            />
          ) : null}
          <GuestPicker
            label={t('booking.field.guest')}
            required
            initialText={form.guest?.displayName}
            error={errors.bookerGuestId}
            onSelect={(guest) => {
              // Same as H09 (FB-R2-DOM-FE-02, D-6): a guest who stayed before → preselect "Khách quay lại".
              const auto = !!guest.lastStayDate && form.directSource === 'zalo_phone';
              set(auto ? { guest, directSource: 'returning' } : { guest });
              setAutoReturning(auto ? guest.lastStayDate! : null);
            }}
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
        {!prefill?.webRequest ? (
          <div className="g-2">
            <Field
              label={t('bk.source')}
              required
              error={errors.directSource}
              help={
                autoReturning && form.directSource === 'returning'
                  ? t('bk.source_auto_returning', { date: dayMonth(autoReturning) })
                  : undefined
              }
            >
              {(p) => (
                <select
                  {...p}
                  className="input"
                  value={form.directSource}
                  onChange={(e) => set({ directSource: e.target.value as DirectSource })}
                >
                  {LONG_STAY_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.key)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
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
