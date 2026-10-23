import {
  isApiError,
  type Room,
  type RoomGroup,
  type RoomPatch,
  type RoomUpdateResult,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field, Modal, Stepper, Switch } from '@ottimo/ui';
import { useId, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { useBusinessDay, useBusinessDayChange } from '../app/businessDay';
import { nightlyFromMonthly, parseVnd } from '../app/money';
import { fieldErrors, problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { useOnline } from '../hooks/useOnline';
import { usePropertyId } from '../session/SessionProvider';

interface Conflict {
  reservationCode?: string;
  stayFrom?: string;
  stayTo?: string;
  guestCount?: number;
}

const BASE_MIN = 1;
const BASE_MAX = 10; // RoomPatch.baseOccupancy maximum

/** H04 4.2 – edit one unit: capacity steppers (max ∈ {base, base+1} – ESC-014), list price, stop-sale. */
export function RoomDrawer({
  room,
  groups,
  onClose,
  onSaved,
  onReload,
}: {
  room: Room;
  groups: RoomGroup[];
  onClose: () => void;
  onSaved: (room: RoomUpdateResult) => void;
  onReload: () => void;
}) {
  const { t, vnd, date } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const { online } = useOnline();
  const ids = useId();
  // R3-Q39 #8 (BR-010): the list price takes effect from the BUSINESS day – at 02:40 that is still
  // yesterday, so a price set then applies to tonight (rooms.service accepts ≥ ctx.today).
  const today = useBusinessDay();
  const initialBase = room.baseOccupancy ?? 1;
  const initialMax = room.maxOccupancy ?? initialBase + 1;
  const initialMonthly = room.currentListPrice?.monthlyListPriceVnd;

  const [name, setName] = useState(room.name ?? '');
  // 0.3.4 Q6: bedSetup (free text, ≤ 100). bedCount/areaM2 are in the contract but not in hi-fi H04 yet.
  const [bedSetup, setBedSetup] = useState(room.bedSetup ?? '');
  const [groupId, setGroupId] = useState(room.roomGroupId);
  const [base, setBase] = useState(initialBase);
  const [max, setMax] = useState(initialMax);
  const [monthlyText, setMonthlyText] = useState(
    initialMonthly !== undefined ? vnd(initialMonthly) : '',
  );
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  // The default follows the server's business day while it is untouched.
  useBusinessDayChange(today, (was, now) => setEffectiveFrom((v) => (v === was ? now : v)));
  const [reason, setReason] = useState('');
  const [sellable, setSellable] = useState(room.isSellable);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ text: string; conflict?: boolean } | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [busy, setBusy] = useState(false);

  const monthly = parseVnd(monthlyText);
  const priceChanged = monthlyText.trim() !== '' && monthly !== initialMonthly;
  const nightly = monthly !== null ? nightlyFromMonthly(monthly) : null;
  const dirty =
    name !== (room.name ?? '') ||
    bedSetup !== (room.bedSetup ?? '') ||
    groupId !== room.roomGroupId ||
    base !== initialBase ||
    max !== initialMax ||
    sellable !== room.isSellable ||
    priceChanged ||
    reason !== '';

  const changeBase = (v: number) => {
    setBase(v);
    // Maximum follows the standard (+1 sofa) – the only allowed pair besides max = base.
    setMax(v + 1);
    setConflicts(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.length > 60) e.name = t('field_error.too_long', { max: 60 });
    if (bedSetup.length > 100) e.bedSetup = t('field_error.too_long', { max: 100 });
    if (max !== base && max !== base + 1) e.maxOccupancy = t('field.MAX_OCCUPANCY_RANGE');
    if (priceChanged) {
      if (monthly === null || monthly <= 0)
        e['listPrice.monthlyListPriceVnd'] = t('field_error.amount_not_positive');
      if (!effectiveFrom) e['listPrice.effectiveFrom'] = t('common.required');
      else if (effectiveFrom < today) e['listPrice.effectiveFrom'] = t('booking.error.past_date');
      if (reason.trim().length < 3) e['listPrice.reason'] = t('field_error.reason_required');
    }
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setConflicts(null);
    if (Object.keys(e).length) {
      setBanner({ text: t('error.VALIDATION_FAILED', { n: Object.keys(e).length }) });
      return;
    }
    const patch: RoomPatch = {};
    if (name !== (room.name ?? '')) patch.name = name.trim();
    if (bedSetup !== (room.bedSetup ?? '')) patch.bedSetup = bedSetup.trim() || null;
    if (groupId !== room.roomGroupId) patch.roomGroupId = groupId;
    if (base !== initialBase) patch.baseOccupancy = base;
    if (max !== initialMax || base !== initialBase) patch.maxOccupancy = max;
    if (sellable !== room.isSellable) patch.isSellable = sellable;
    if (priceChanged && monthly !== null) {
      patch.listPrice = { effectiveFrom, monthlyListPriceVnd: monthly, reason: reason.trim() };
    }
    setBusy(true);
    setBanner(null);
    try {
      const { data } = await api.updateRoom({ propertyId, roomId: room.id }, patch, room.version);
      toast(t('rooms.saved', { room: room.roomNo }));
      onSaved(data);
    } catch (err) {
      if (isApiError(err) && err.code === 'CAPACITY_BELOW_BOOKINGS') {
        setConflicts((err.problem.conflicts ?? []) as Conflict[]);
      } else if (isApiError(err) && err.code === 'VALIDATION_FAILED') {
        const fe = fieldErrors(t, err);
        setErrors(fe);
        setBanner({ text: t('error.VALIDATION_FAILED', { n: Object.keys(fe).length }) });
      } else {
        setBanner({
          text: problemView(t, err).text,
          conflict: isApiError(err) && err.code === 'VERSION_CONFLICT',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const formId = `${ids}-form`;
  return (
    <Modal
      open
      variant="drawer"
      title={t('rooms.edit_title', { room: room.roomNo, name: room.name ?? '' })}
      closeLabel={t('common.close')}
      onClose={onClose}
      dirty={dirty}
      unsavedLabels={{
        title: t('common.unsaved_title'),
        body: t('common.unsaved_body'),
        keep: t('common.unsaved_keep'),
        discard: t('common.unsaved_discard'),
      }}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            form={formId}
            variant="pri"
            busy={busy}
            busyLabel={t('common.saving')}
            disabled={!online || !dirty}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate>
        {banner ? (
          <Alert
            tone="bad"
            actions={
              banner.conflict ? (
                <Button size="sm" onClick={onReload}>
                  {t('common.retry')}
                </Button>
              ) : undefined
            }
          >
            {banner.text}
          </Alert>
        ) : null}
        <div className="g-2">
          <Field label={t('rooms.name')} error={errors.name}>
            {(p) => (
              <input
                {...p}
                className="input"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>
          <Field label={t('rooms.col_group')} error={errors.roomGroupId}>
            {(p) => (
              <select
                {...p}
                className="input"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field label={t('rooms.col_beds')} error={errors.bedSetup}>
          {(p) => (
            <input
              {...p}
              className="input"
              value={bedSetup}
              maxLength={100}
              onChange={(e) => setBedSetup(e.target.value)}
            />
          )}
        </Field>
        <fieldset className="card inset">
          <legend className="label-h">{t('rooms.capacity')}</legend>
          <div className="occ-row">
            <div className="occ">
              <span id={`${ids}-base`}>{t('rooms.col_base')}</span>
              <Stepper
                value={base}
                min={BASE_MIN}
                max={BASE_MAX}
                onChange={changeBase}
                labelledBy={`${ids}-base`}
                decLabel={`${t('rooms.dec')} ${t('rooms.col_base')}`}
                incLabel={`${t('rooms.inc')} ${t('rooms.col_base')}`}
              />
            </div>
            <div className={`occ field flush${errors.maxOccupancy || conflicts ? ' invalid' : ''}`}>
              <span id={`${ids}-max`}>{t('rooms.col_max')}</span>
              <Stepper
                value={max}
                min={base}
                max={base + 1}
                onChange={(v) => {
                  setMax(v);
                  setConflicts(null);
                }}
                labelledBy={`${ids}-max`}
                describedBy={errors.maxOccupancy || conflicts ? `${ids}-max-e` : undefined}
                decLabel={`${t('rooms.dec')} ${t('rooms.col_max')}`}
                incLabel={`${t('rooms.inc')} ${t('rooms.col_max')}`}
                invalid={Boolean(errors.maxOccupancy || conflicts)}
              />
            </div>
          </div>
          <p className="caption mt-8">{t('rooms.capacity_help')}</p>
          {errors.maxOccupancy ? (
            <div className="field invalid mt-8">
              <div className="err" id={`${ids}-max-e`} role="alert">
                {errors.maxOccupancy}
              </div>
            </div>
          ) : null}
          {conflicts ? (
            <div className="mt-8">
              <Alert tone="bad" id={`${ids}-max-e`} title={t('rooms.below_title', { max })}>
                <span>{t('rooms.below_body')}</span>
                <ul className="err-list">
                  {conflicts.map((c, i) => (
                    <li key={c.reservationCode ?? i}>
                      {t('rooms.below_item', {
                        code: c.reservationCode ?? '',
                        from: date(c.stayFrom),
                        to: date(c.stayTo),
                        n: c.guestCount ?? '',
                      })}
                    </li>
                  ))}
                </ul>
              </Alert>
            </div>
          ) : null}
        </fieldset>
        <fieldset className="card inset">
          <legend className="label-h">{t('rooms.price')}</legend>
          <div className="g-2">
            <Field label={t('rooms.col_month')} error={errors['listPrice.monthlyListPriceVnd']}>
              {(p) => (
                <div className="input-affix">
                  <input
                    {...p}
                    className="input num"
                    inputMode="numeric"
                    value={monthlyText}
                    onChange={(e) => setMonthlyText(e.target.value)}
                    onBlur={() => monthly !== null && setMonthlyText(vnd(monthly))}
                  />
                  <span className="affix">{t('common.vnd_unit')}</span>
                </div>
              )}
            </Field>
            <Field label={t('rooms.col_night')} help={t('rooms.night_auto')}>
              {(p) => (
                <div className="input-affix">
                  <input
                    {...p}
                    className="input num"
                    readOnly
                    value={nightly !== null ? vnd(nightly) : ''}
                  />
                  <span className="affix">{t('common.vnd_unit')}</span>
                </div>
              )}
            </Field>
          </div>
          {priceChanged ? (
            <div className="g-2">
              <Field
                label={t('config.effective_from')}
                required
                error={errors['listPrice.effectiveFrom']}
              >
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    type="date"
                    min={today}
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                  />
                )}
              </Field>
              <Field label={t('rooms.reason')} required error={errors['listPrice.reason']}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    value={reason}
                    maxLength={500}
                    onChange={(e) => setReason(e.target.value)}
                  />
                )}
              </Field>
            </div>
          ) : null}
          <p className="caption">{t('rooms.snapshot_note')}</p>
        </fieldset>
        <div className="row">
          <Switch checked={sellable} onChange={setSellable} describedBy={`${ids}-stop`}>
            {t('rooms.selling')}
          </Switch>
          <span className="caption" id={`${ids}-stop`}>
            {t('rooms.stop_help')}
          </span>
        </div>
      </form>
    </Modal>
  );
}
