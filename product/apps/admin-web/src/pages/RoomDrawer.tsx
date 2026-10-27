import {
  isApiError,
  type Room,
  type RoomGroup,
  type RoomPatch,
  type RoomScheduledListPrice,
  type RoomUpdateResult,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Modal, Stepper, Switch } from '@ottimo/ui';
import { useId, useState, type FormEvent } from 'react';
import { api } from '../app/api';
import { useBusinessDay, useBusinessDayChange } from '../app/businessDay';
import { isVndStep, parseVnd, perDayOfMonthly } from '../app/money';
import { fieldErrors, problemView } from '../app/problem';
import { useToast } from '../app/toast';
import { timeHHmm, todayLocal } from '../app/dates';
import { dayMonth } from '../app/reservations';
import { useWrite } from '../app/useWrite';
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

/** "dd/mm HH:mm" of an instant (UXD §3.2 – who scheduled a price, when). */
const shortStamp = (iso: string) => {
  const d = new Date(iso);
  return `${dayMonth(todayLocal(undefined, d))} ${timeHHmm(d)}`;
};

interface PriceRow {
  effectiveFrom: string;
  monthlyListPriceVnd: number;
  nightlyListPriceVnd: number;
}

/**
 * 0.3.9 (BUG-R3-018 phần 1, `Room.scheduledListPrices`): the row in force on day `d` = the one with the latest
 * `effectiveFrom` ≤ `d` among `currentListPrice` ∪ `scheduledListPrices` (`skip`: leave that date out – the row a
 * cancel removes). Picking a row, not working out money.
 */
export function priceRowFor(room: Room, d: string, skip?: string): PriceRow | undefined {
  const cur = room.currentListPrice;
  const rows: PriceRow[] = [
    ...(cur?.effectiveFrom &&
    cur.monthlyListPriceVnd !== undefined &&
    cur.nightlyListPriceVnd !== undefined
      ? [cur as PriceRow]
      : []),
    ...(room.scheduledListPrices ?? []),
  ];
  return rows
    .filter((x) => x.effectiveFrom <= d && x.effectiveFrom !== skip)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

/** H04 4.2 – edit one unit: capacity steppers (max ∈ {base, base+1} – ESC-014), list price, stop-sale. */
export function RoomDrawer({
  room,
  groups,
  onClose,
  onSaved,
  onReload,
  onRoomChanged,
}: {
  room: Room;
  groups: RoomGroup[];
  onClose: () => void;
  onSaved: (room: RoomUpdateResult) => void;
  onReload: () => void;
  /** 0.3.9: the room changed while the drawer stays open (a scheduled price cancelled, or read again). */
  onRoomChanged?: (room: Room) => void;
}) {
  const { t, vnd, money, date } = useI18n();
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
  const initialNightly = room.currentListPrice?.nightlyListPriceVnd;

  const [name, setName] = useState(room.name ?? '');
  // 0.3.4 Q6: bedSetup (free text, ≤ 100). bedCount/areaM2 are in the contract but not in hi-fi H04 yet.
  const [bedSetup, setBedSetup] = useState(room.bedSetup ?? '');
  const [groupId, setGroupId] = useState(room.roomGroupId);
  const [base, setBase] = useState(initialBase);
  const [max, setMax] = useState(initialMax);
  const [monthlyText, setMonthlyText] = useState(
    initialMonthly !== undefined ? vnd(initialMonthly) : '',
  );
  // FB-INV-005 (BR-101 v0.4.7): the nightly list price is entered by the owner, never derived.
  const [nightlyText, setNightlyText] = useState(
    initialNightly !== undefined ? vnd(initialNightly) : '',
  );
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  // The default follows the server's business day while it is untouched.
  useBusinessDayChange(today, (was, now) => setEffectiveFrom((v) => (v === was ? now : v)));
  const [reason, setReason] = useState('');
  // BUG-R3-018: the owner typed in a price box (even back to the current figure).
  const [priceTouched, setPriceTouched] = useState(false);
  // 0.3.9: which box the owner typed in – a box left alone follows the row in force on the date picked.
  const [editedMonthly, setEditedMonthly] = useState(false);
  const [editedNightly, setEditedNightly] = useState(false);
  // 0.3.9: the room as last read (its version moves when a scheduled price is cancelled here).
  const [cur, setCur] = useState(room);
  const scheduled = cur.scheduledListPrices;
  // Absent = not served (role other than OWN/MGR, or a 0.3.8 server) → the BUG-R3-018 part 2 rule below.
  const known = scheduled !== undefined;
  const [cancelRow, setCancelRow] = useState<RoomScheduledListPrice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<{ field?: string; text: string } | null>(null);
  // 409 effective / only_price: the box only says why and offers "Đóng" (UXD v1.0.1 §3.4).
  const [cancelLocked, setCancelLocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const cancelWrite = useWrite();
  const [sellable, setSellable] = useState(room.isSellable);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ text: string; conflict?: boolean } | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [busy, setBusy] = useState(false);

  const monthly = parseVnd(monthlyText);
  const nightly = parseVnd(nightlyText);
  // 0.3.9: compare with the row in force on the date picked (`updateRoom.listPrice` writes BOTH prices for it).
  const baseline = known ? priceRowFor(cur, effectiveFrom || today) : undefined;
  const baseMonthly = known ? baseline?.monthlyListPriceVnd : initialMonthly;
  const baseNightly = known ? baseline?.nightlyListPriceVnd : initialNightly;
  // The row scheduled for exactly that date – saving replaces both of its prices.
  const sameDateRow = known ? scheduled.find((x) => x.effectiveFrom === effectiveFrom) : undefined;
  // A cleared box counts as a change (then it fails "amount > 0"); an untouched one does not.
  const changed = (text: string, value: number | null, initial: number | undefined) =>
    text.trim() === '' ? initial !== undefined : value !== initial;
  const valuesChanged =
    changed(monthlyText, monthly, baseMonthly) || changed(nightlyText, nightly, baseNightly);
  // FB-R3-UXD-FE-A-05: no "restate" rule any more – the boxes compare with the row in force on the date picked.
  const sameAsBaseline = priceTouched && !valuesChanged;
  const priceChanged = valuesChanged;
  /**
   * Picking date D fills the boxes with the row in force on D (contract 0.3.9 / UXD §3.5). A box the owner typed in
   * keeps what was typed; the other one follows D – so `updateRoom.listPrice` (always both prices for D) never puts
   * today's figure back on a scheduled row by accident (QA risk BUG-R3-018).
   */
  const pickDate = (d: string) => {
    setEffectiveFrom(d);
    if (!known) return;
    const row = priceRowFor(cur, d);
    if (!row) return;
    if (!editedMonthly) setMonthlyText(vnd(row.monthlyListPriceVnd));
    if (!editedNightly) setNightlyText(vnd(row.nightlyListPriceVnd));
  };
  // UXD §3.5: help under the "Hiệu lực từ / Lý do" row, full width.
  const dateHelp =
    known && effectiveFrom
      ? sameDateRow
        ? t('rooms.price_replace_scheduled', {
            date: date(effectiveFrom),
            night: money(sameDateRow.nightlyListPriceVnd),
            month: money(sameDateRow.monthlyListPriceVnd),
          })
        : t('rooms.price_for_date', { date: date(effectiveFrom) })
      : undefined;
  // Soft check only (DOM fb-inv-005 §4): a nightly price under the monthly price per day is unusual.
  const nightlyLow =
    monthly !== null && monthly > 0 && nightly !== null && nightly > 0
      ? nightly * 30 < monthly
      : false;
  // Save needs something to send; a reason alone (price unchanged) sends nothing.
  const canSave =
    name !== (room.name ?? '') ||
    bedSetup !== (room.bedSetup ?? '') ||
    groupId !== room.roomGroupId ||
    base !== initialBase ||
    max !== initialMax ||
    sellable !== room.isSellable ||
    priceChanged;
  const dirty = canSave || reason !== '';
  // UXD §3.5: the two boxes equal the row in force on D – Save stays off and says why.
  const saveWhy =
    known && sameAsBaseline && !canSave && effectiveFrom
      ? t('rooms.price_unchanged', { date: date(effectiveFrom) })
      : null;

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
      if (nightly === null || nightly <= 0)
        e['listPrice.nightlyListPriceVnd'] = t('field_error.amount_not_positive');
      else if (!isVndStep(nightly))
        e['listPrice.nightlyListPriceVnd'] = t('field_error.multiple_of_1000');
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
    if (priceChanged && monthly !== null && nightly !== null) {
      // Always both prices – the server's ÷ divisor fallback must never be reached from the Desk.
      patch.listPrice = {
        effectiveFrom,
        monthlyListPriceVnd: monthly,
        nightlyListPriceVnd: nightly,
        reason: reason.trim(),
      };
    }
    setBusy(true);
    setBanner(null);
    try {
      const { data } = await api.updateRoom({ propertyId, roomId: room.id }, patch, cur.version);
      // BUG-R3-018: a future price does not show in the catalog until its day – say when it applies.
      toast(
        patch.listPrice && patch.listPrice.effectiveFrom > today
          ? t('rooms.saved_scheduled', {
              room: room.roomNo,
              date: date(patch.listPrice.effectiveFrom),
            })
          : t('rooms.saved', { room: room.roomNo }),
      );
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

  /** UXD §3.3: the row the room goes back to from that date (and the next scheduled date, if any). */
  const cancelBody = (row: RoomScheduledListPrice) => {
    const back = priceRowFor(cur, row.effectiveFrom, row.effectiveFrom);
    if (!back) return '';
    const next = (scheduled ?? []).find((x) => x.effectiveFrom > row.effectiveFrom);
    const args = {
      date: date(row.effectiveFrom),
      room: cur.roomNo,
      night: money(back.nightlyListPriceVnd),
      month: money(back.monthlyListPriceVnd),
    };
    return next
      ? t('rooms.cancel_sched_body_until', { ...args, next: date(next.effectiveFrom) })
      : t('rooms.cancel_sched_body', args);
  };

  /** Read this room again (another person changed its prices) – the drawer keeps what was typed. */
  const refreshRoom = async () => {
    try {
      const fresh = (await api.listRooms({ propertyId })).data.data.find((x) => x.id === cur.id);
      if (fresh) {
        setCur(fresh);
        onRoomChanged?.(fresh);
      }
    } catch {
      onReload();
    }
  };

  const openCancel = (row: RoomScheduledListPrice) => {
    setCancelRow(row);
    setCancelReason('');
    setCancelError(null);
    setCancelLocked(false);
    setNotice(null);
  };

  const cancelScheduled = async (row: RoomScheduledListPrice) => {
    if (cancelReason.trim().length < 3 || cancelLocked) return;
    setCancelError(null);
    const day = date(row.effectiveFrom);
    try {
      const { data } = await cancelWrite.run((idem) =>
        api.cancelScheduledRoomListPrice(
          { propertyId, roomId: cur.id },
          { effectiveFrom: row.effectiveFrom, reason: cancelReason.trim() },
          cur.version,
          idem,
        ),
      );
      setCur(data);
      onRoomChanged?.(data);
      setCancelRow(null);
      // The boxes were following the cancelled row → they follow the row now in force on D.
      if (effectiveFrom === row.effectiveFrom) {
        const now = priceRowFor(data, effectiveFrom);
        if (now && !editedMonthly) setMonthlyText(vnd(now.monthlyListPriceVnd));
        if (now && !editedNightly) setNightlyText(vnd(now.nightlyListPriceVnd));
      }
      toast(t('rooms.cancel_sched_done', { date: day, room: cur.roomNo }));
    } catch (err) {
      if (!isApiError(err) || err.isNetwork || err.status >= 500) {
        // "Thử lại" resends with the same Idempotency-Key (useWrite keeps it after a failure).
        setCancelError({ text: problemView(t, err).text });
        return;
      }
      cancelWrite.renewKey();
      if (err.code === 'VALIDATION_FAILED') {
        setCancelError({ field: 'reason', text: t('rooms.cancel_sched_needs_reason') });
      } else if (err.code === 'INVALID_TRANSITION') {
        setCancelLocked(true);
        setCancelError({
          text:
            err.problem.currentState === 'only_price'
              ? t('rooms.cancel_sched_only', { date: day })
              : t('rooms.cancel_sched_effective', { date: day }),
        });
        await refreshRoom();
      } else if (err.code === 'NOT_FOUND') {
        setCancelRow(null);
        setNotice(t('rooms.cancel_sched_gone', { date: day }));
        await refreshRoom();
      } else if (err.code === 'VERSION_CONFLICT') {
        // Keep the reason; the room is read again (version, "giá dùng lại") – the owner may confirm again.
        setCancelError({ text: t('error.VERSION_CONFLICT') });
        await refreshRoom();
      } else {
        setCancelError({ text: problemView(t, err).text });
      }
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
          {saveWhy ? (
            <span className="li-s" id={`${ids}-save-why`}>
              {saveWhy}
            </span>
          ) : null}
          <Button
            type="submit"
            form={formId}
            variant="pri"
            busy={busy}
            busyLabel={t('common.saving')}
            disabled={!online || !canSave}
            aria-describedby={saveWhy ? `${ids}-save-why` : undefined}
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
          <div className="g-2 top">
            <Field label={t('rooms.col_month')} error={errors['listPrice.monthlyListPriceVnd']}>
              {(p) => (
                <div className="input-affix">
                  <input
                    {...p}
                    className="input num"
                    inputMode="numeric"
                    value={monthlyText}
                    onChange={(e) => {
                      setMonthlyText(e.target.value);
                      setPriceTouched(true);
                      setEditedMonthly(true);
                    }}
                    onBlur={() => monthly !== null && setMonthlyText(vnd(monthly))}
                  />
                  <span className="affix">{t('common.vnd_unit')}</span>
                </div>
              )}
            </Field>
            <Field
              label={t('rooms.col_night')}
              help={t('rooms.night_auto')}
              error={errors['listPrice.nightlyListPriceVnd']}
            >
              {(p) => (
                <div className="input-affix">
                  <input
                    {...p}
                    className="input num"
                    inputMode="numeric"
                    value={nightlyText}
                    onChange={(e) => {
                      setNightlyText(e.target.value);
                      setPriceTouched(true);
                      setEditedNightly(true);
                    }}
                    onBlur={() => nightly !== null && setNightlyText(vnd(nightly))}
                  />
                  <span className="affix">{t('common.vnd_unit')}</span>
                </div>
              )}
            </Field>
          </div>
          {nightlyLow && monthly !== null ? (
            <Alert tone="warn">
              {t('rooms.night_low', { perDay: vnd(perDayOfMonthly(monthly)) })}
            </Alert>
          ) : null}
          {known ? (
            <div className="mt-8">
              <h3 className="label-h" id={`${ids}-sched`}>
                {t('rooms.scheduled_title')}
              </h3>
              {notice ? (
                <Alert tone="info" role="status">
                  {notice}
                </Alert>
              ) : null}
              <ul className="list" aria-labelledby={`${ids}-sched`}>
                {cur.currentListPrice?.effectiveFrom &&
                cur.currentListPrice.monthlyListPriceVnd !== undefined &&
                cur.currentListPrice.nightlyListPriceVnd !== undefined ? (
                  <li>
                    <div className="grow">
                      <Chip tone="ink" icon="check">
                        {t('rooms.scheduled_current', {
                          date: date(cur.currentListPrice.effectiveFrom),
                        })}
                      </Chip>
                      <div className="num">
                        {t('rooms.scheduled_prices', {
                          night: money(cur.currentListPrice.nightlyListPriceVnd),
                          month: money(cur.currentListPrice.monthlyListPriceVnd),
                        })}
                      </div>
                    </div>
                  </li>
                ) : null}
                {scheduled.map((x) => (
                  <li
                    key={x.effectiveFrom}
                    className={x.effectiveFrom === effectiveFrom ? 'is-editing' : undefined}
                  >
                    <div className="grow">
                      <b>{t('rooms.scheduled_from', { date: date(x.effectiveFrom) })}</b>
                      <div className="num">
                        {t('rooms.scheduled_prices', {
                          night: money(x.nightlyListPriceVnd),
                          month: money(x.monthlyListPriceVnd),
                        })}
                      </div>
                      {x.reason ? (
                        <div className="li-s">
                          {t('rooms.scheduled_reason', { reason: x.reason })}
                        </div>
                      ) : null}
                      <div className="caption">
                        {x.changedBy
                          ? t('rooms.scheduled_by', {
                              by: x.changedBy,
                              at: shortStamp(x.changedAt),
                            })
                          : t('rooms.scheduled_by_system', { at: shortStamp(x.changedAt) })}
                      </div>
                    </div>
                    {!cur.currentListPrice && scheduled.length === 1 ? (
                      // UXD D9: the room's only price – no button (it would only get 409 only_price).
                      <span className="li-s">
                        {t('rooms.only_price_note', { date: date(x.effectiveFrom) })}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!online}
                        aria-label={t('rooms.cancel_scheduled_label', {
                          date: date(x.effectiveFrom),
                        })}
                        onClick={() => openCancel(x)}
                      >
                        {t('rooms.cancel_scheduled')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {scheduled.length === 0 ? (
                <p className="caption">{t('rooms.scheduled_empty')}</p>
              ) : null}
            </div>
          ) : null}
          {valuesChanged || priceTouched ? (
            <div className="g-2">
              <Field
                label={t('config.effective_from')}
                required
                error={errors['listPrice.effectiveFrom']}
              >
                {(p) => (
                  <input
                    {...p}
                    aria-describedby={
                      [p['aria-describedby'], dateHelp ? `${ids}-dhelp` : '']
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    className="input"
                    type="date"
                    min={today}
                    value={effectiveFrom}
                    onChange={(e) => pickDate(e.target.value)}
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
          {(valuesChanged || priceTouched) && dateHelp ? (
            <p className="help" id={`${ids}-dhelp`}>
              {dateHelp}
            </p>
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
      {cancelRow ? (
        <ConfirmDialog
          title={t('rooms.cancel_sched_title', {
            date: date(cancelRow.effectiveFrom),
            room: cur.roomNo,
          })}
          body={cancelBody(cancelRow)}
          keepLabel={cancelLocked ? t('common.close') : t('rooms.cancel_sched_keep')}
          confirmLabel={cancelWrite.label(t('rooms.cancel_sched_confirm'))}
          confirmDisabled={cancelLocked || cancelReason.trim().length < 3}
          confirmHelpId={
            !cancelLocked && cancelReason.trim().length < 3 ? `${ids}-cancel-why` : undefined
          }
          busy={cancelWrite.busy}
          busyLabel={cancelWrite.busyLabel ?? t('common.saving')}
          onKeep={() => setCancelRow(null)}
          onConfirm={() => void cancelScheduled(cancelRow)}
        >
          <Field
            label={t('rooms.cancel_sched_reason')}
            required
            help={t('rooms.cancel_sched_reason_help')}
            error={cancelError?.field === 'reason' ? cancelError.text : undefined}
          >
            {(p) => (
              <textarea
                {...p}
                className="input"
                rows={2}
                maxLength={500}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            )}
          </Field>
          {!cancelLocked && cancelReason.trim().length < 3 ? (
            <p className="li-s" id={`${ids}-cancel-why`}>
              {t('rooms.cancel_sched_needs_reason')}
            </p>
          ) : null}
          {cancelWrite.notice ??
            (cancelError && cancelError.field !== 'reason' ? (
              <Alert tone="bad">{cancelError.text}</Alert>
            ) : null)}
        </ConfirmDialog>
      ) : null}
    </Modal>
  );
}
