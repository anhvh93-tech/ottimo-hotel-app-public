import type { Bill, Commission, Folio, Reservation, ReservationStatus } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Icon, Modal } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { timeHHmm, todayLocal } from '../../app/dates';
import {
  STATUS_KEY,
  STATUS_TONE,
  channelName,
  currentSegment,
  dayMonth,
  remaining,
  rsvErrorText,
} from '../../app/reservations';
import { lineLabel, signed } from '../../app/folio';
import { Code } from '../../app/mono';
import { useRules } from '../../app/rules';
import { LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { GuestLinkPanel } from './GuestLinkPanel';
import {
  AssignRoomDialog,
  CancelDialog,
  DepositDialog,
  DepositNoticeDialog,
  ExtendHoldDialog,
  MoveDialog,
  NoShowDialog,
  RestoreDialog,
} from './ReservationDialogs';
import {
  AddChargeDialog,
  ChangeRoomDialog,
  ConfirmTimeDialog,
  DoorHandedDialog,
  ExtendDialog,
  LateCheckoutDialog,
  PartyDialog,
  RefundRequestDialog,
  UndoCheckInDialog,
} from '../stay/StayDialogs';
import { BillDialog } from '../stay/CheckOutPage';
import { FolioDialog } from '../stay/FolioDialog';

type Open =
  | 'cancel'
  | 'deposit'
  | 'extend'
  | 'move'
  | 'postpone'
  | 'noshow'
  | 'restore'
  | 'assign'
  | 'notice'
  | 'extend_stay'
  | 'late'
  | 'change_room'
  | 'charge'
  | 'confirm_time'
  | 'door'
  | 'undo'
  | 'party'
  | 'refund'
  | 'folio'
  | 'bill'
  | null;

const FD_PLUS = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const LEAD_PLUS = ['owner', 'manager', 'front_desk_lead'];

/**
 * H11 Chi tiết đơn (S04, US-020): progress, stay, guests (+ extra-guest kit), money by role, hold
 * countdown, and ONLY the buttons in `allowedActions[]` (server decides by status AND role – AC1/AC2).
 * CTV sees totals + deposit and their own projected commission (US-087); another person's booking is
 * a 404 for them (no existence leak).
 */
export function ReservationDrawer({
  reservationId,
  onClose,
}: {
  reservationId: string;
  onClose: () => void;
}) {
  const { t, vnd, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles, deviceTrusted } = useSession();
  const { online } = useOnline();
  const navigate = useNavigate();
  const rules = useRules(propertyId, roles);
  const catalog = useCatalog(propertyId);
  const now = useNow(30_000);
  const [open, setOpen] = useState<Open>(null);
  const drawerId = useId();
  // S4-29 (US-020 AC2): the settled folio of a checked-out booking – read again on every open.
  const [bill, setBill] = useState<Bill | null>(null);
  const [billError, setBillError] = useState<unknown>(null);
  const [billBusy, setBillBusy] = useState(false);
  const fd = roles.some((r) => FD_PLUS.includes(r));
  const sales = !fd && roles.some((r) => r === 'sales_staff' || r === 'collaborator');
  const ctv = !fd && roles.includes('collaborator');

  const { state, reload, mutate } = useResource(
    async () => (await api.getReservation({ propertyId, reservationId })).data,
    [propertyId, reservationId],
  );
  const [commission, setCommission] = useState<Commission | null>(null);
  const r = state.data;
  // Sprint 3: FD+ sees the live folio of a stay (extras, FOC pending, credit → refund request).
  // UXR #6: "Đã thu" comes from the folio (`totals.paidVnd`) for every role that sees the balance – it
  // is never "room total − balance" (wrong with a hold, extras, FOC or a refund).
  const [folio, setFolio] = useState<Folio | null>(null);
  // ARC 16.20 (BUG-R2-101): `balanceDueVnd` absent = nothing posted on the folio yet (a hold) – FD+ still read the
  // folio; other roles see money only where the server gives it.
  const folioId =
    r && r.stayType !== 'long' && r.folioId && (r.balanceDueVnd !== undefined || fd)
      ? r.folioId
      : null;
  const folioLines = fd && !!r && ['in_house', 'checked_out'].includes(r.status);
  const ownFolio = folio?.id === folioId ? folio : null;
  const paidVnd = ownFolio?.totals.paidVnd;
  // BUG-R2-102 / ARC 16.20: "Đã thu" = `paidVnd` (refunds not taken off), "Đã hoàn" = `refundedVnd` – the server's.
  const refundedVnd = ownFolio?.totals.refundedVnd ?? 0;
  // BUG-R2-103: with the folio lines listed below, "Còn phải thu" is said once – there, after the lines.
  const linesShown = !!folio && folioLines;
  // ARC 16.20: a folio at 0 with no posted line – "Chưa có khoản nào trên folio", never "Còn phải thu 0 đ".
  const nothingPosted =
    !!ownFolio &&
    (ownFolio.totals.balanceDueVnd ?? 0) === 0 &&
    ownFolio.lines.every((l) => l.lineState !== 'posted');
  // A hold owes the deposit still missing (BR-305) – what the desk asks the guest for.
  const depositDue =
    r?.status === 'hold' && r.depositRequiredVnd !== undefined
      ? Math.max(0, r.depositRequiredVnd - (r.depositPaidVnd ?? 0))
      : undefined;
  const rVersion = r?.version;
  useEffect(() => {
    if (!folioId) return;
    let stale = false;
    api.getFolio({ propertyId, folioId }).then(
      (x) => !stale && setFolio(x.data),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [folioId, propertyId, rVersion]);

  const code = r?.code;
  useEffect(() => {
    if (!sales || !code) return;
    let stale = false;
    api.listCommissions({ propertyId }).then(
      (res) =>
        !stale && setCommission(res.data.data.find((c) => c.reservationCode === code) ?? null),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [sales, propertyId, code]);

  const reloadNow = async (): Promise<Reservation | null> => {
    try {
      const fresh = (await api.getReservation({ propertyId, reservationId })).data;
      mutate(() => fresh);
      return fresh;
    } catch {
      reload();
      return null;
    }
  };
  const done = (updated?: Reservation) => {
    setOpen(null);
    if (updated) mutate(() => updated);
    else void reloadNow();
  };

  const openBill = async (folioIdToShow: string) => {
    setBillBusy(true);
    setBillError(null);
    try {
      setBill((await api.getBill({ propertyId, folioId: folioIdToShow })).data);
      setOpen('bill');
    } catch (e) {
      setBillError(e);
    } finally {
      setBillBusy(false);
    }
  };

  const allowed = new Map((r?.allowedActions ?? []).map((a) => [a.event, a]));
  // K11-03: the room of today, not `segments[0]` (the room left after a mid-stay B14).
  const seg = r ? currentSegment(r.segments, todayLocal()) : undefined;
  const room = catalog.rooms.find((x) => x.id === seg?.roomId);
  const chName = r ? channelName(catalog.channels, r.channelCode, r.channelId) : '';
  const ota = catalog.channels.find((c) => c.id === r?.channelId)?.channelGroup === 'ota';
  const left = r?.status === 'hold' ? remaining(r.hold?.expiresAt, now) : null;

  const [changed, setChanged] = useState<ReservationStatus | null>(null);
  const base = r
    ? {
        reservation: r,
        reload: reloadNow,
        onDone: (u?: Reservation) => {
          setChanged(null);
          done(u);
        },
        onClose: () => setOpen(null),
        // 409 INVALID_TRANSITION after a successful reload: close the dialog, say what changed here.
        onTransitionChanged: (status: ReservationStatus) => {
          setOpen(null);
          setChanged(status);
        },
      }
    : null;

  const steps =
    r?.stayType === 'long'
      ? [
          { key: 'status.booking.confirmed', done: true },
          {
            key: 'status.booking.in_house',
            done: r.status === 'in_house' || r.status === 'checked_out',
          },
        ]
      : [
          { key: 'rsv.step_booked', done: true },
          { key: 'rsv.step_hold', done: r?.status !== 'hold' },
          { key: 'rsv.step_deposit', done: !!r && !['hold'].includes(r.status) },
          { key: 'rsv.step_in', done: !!r && ['in_house', 'checked_out'].includes(r.status) },
          { key: 'rsv.step_out', done: r?.status === 'checked_out' },
        ];
  const currentStep = steps.findIndex((s) => !s.done);

  const footer = !r ? null : !online ? (
    <Button variant="pri" disabled>
      {t('rsv.need_online')}
    </Button>
  ) : (
    <>
      {allowed.has('cancel_hold') ? (
        <Button variant="danger" onClick={() => setOpen('cancel')}>
          {t('drawer.action.cancel_hold')}
        </Button>
      ) : null}
      {allowed.has('cancel') ? (
        <Button variant="ghost" onClick={() => setOpen('cancel')}>
          {t('drawer.action.cancel_booking')}
        </Button>
      ) : null}
      {allowed.has('mark_no_show') ? (
        <Button onClick={() => setOpen('noshow')}>{t('drawer.action.no_show')}</Button>
      ) : r.noShowAvailableFrom ? (
        // A-04: the server says when marking opens – never the client clock. UXR P-17: the reason sits next to
        // its button, not at the top of the panel.
        <>
          <span className="li-s" id={`${drawerId}-noshow`}>
            {t('noshow.locked', { time: timeHHmm(new Date(r.noShowAvailableFrom)) })}
          </span>
          <Button
            aria-disabled="true"
            aria-describedby={`${drawerId}-noshow`}
            onClick={() => undefined}
          >
            {t('drawer.action.no_show')}
          </Button>
        </>
      ) : null}
      {allowed.has('move') ? (
        <Button onClick={() => setOpen('move')}>{t('drawer.action.move')}</Button>
      ) : null}
      {allowed.has('extend_hold') ? (
        <Button onClick={() => setOpen('extend')}>{t('drawer.action.extend_hold')}</Button>
      ) : null}
      {ctv && r.status === 'hold' ? (
        <Button variant="pri" onClick={() => setOpen('notice')}>
          {t('drawer.action.deposit_notice')}
        </Button>
      ) : null}
      {allowed.has('confirm_deposit') ? (
        <Button variant="pri" onClick={() => setOpen('deposit')}>
          {t('drawer.action.confirm_deposit')}
        </Button>
      ) : null}
      {allowed.has('assign_room') ? (
        <Button variant="pri" onClick={() => setOpen('assign')}>
          {t('fo.rack.assign_room')}
        </Button>
      ) : null}
      {allowed.has('restore_no_show') ? (
        <Button variant="pri" onClick={() => setOpen('restore')}>
          {allowed.get('restore_no_show')?.requiresApproval
            ? t('drawer.action.request_restore')
            : t('drawer.action.restore_no_show')}
        </Button>
      ) : null}
      {allowed.has('undo_check_in') ? (
        <Button variant="ghost" onClick={() => setOpen('undo')}>
          {t('drawer.action.undo_checkin')}
        </Button>
      ) : null}
      {allowed.has('change_room') || (fd && r.parentReservationId && r.status === 'in_house') ? (
        // BE-A B14: on a child booking the change goes to the primary booking (whole stay).
        <Button onClick={() => setOpen('change_room')}>{t('drawer.action.change_room')}</Button>
      ) : null}
      {allowed.has('set_late_checkout') ? (
        <Button onClick={() => setOpen('late')}>{t('drawer.action.late_checkout')}</Button>
      ) : null}
      {allowed.has('extend_stay') ? (
        <Button onClick={() => setOpen('extend_stay')}>{t('drawer.action.extend')}</Button>
      ) : null}
      {fd && r.status === 'checked_out' && r.folioId ? (
        // S4-29 (US-020 AC2): the settled folio – number, VI / VI–EN, print again. Read-only (GET).
        <Button icon="printer" busy={billBusy} onClick={() => void openBill(r.folioId!)}>
          {t('co.preview_bill')}
        </Button>
      ) : null}
      {allowed.has('check_out') ? (
        <Button variant="pri" onClick={() => navigate(`/reservations/${r.id}/check-out`)}>
          {t('drawer.action.check_out')}
        </Button>
      ) : null}
      {allowed.has('check_in') ? (
        // H13: C3 steps only on a granted device (rbac 8.7) – elsewhere the button explains why.
        deviceTrusted || !allowed.get('check_in')?.requiresTrustedDevice ? (
          <Button variant="pri" onClick={() => navigate(`/reservations/${r.id}/check-in`)}>
            {t('drawer.action.check_in')}
          </Button>
        ) : (
          <Button
            variant="pri"
            aria-disabled="true"
            aria-describedby={`${drawerId}-checkin`}
            onClick={() => undefined}
          >
            {t('drawer.action.check_in')}
          </Button>
        )
      ) : null}
    </>
  );

  return (
    <Modal
      open
      variant="drawer"
      title={r?.booker?.displayName ?? r?.code ?? t('common.loading')}
      meta={
        r ? (
          <>
            <Code>{r.code}</Code>
            {chName ? ` · ${chName}` : ''}
          </>
        ) : undefined
      }
      closeLabel={t('common.close')}
      onClose={onClose}
      footer={footer}
    >
      {state.status === 'error' && !r ? (
        <Alert
          tone="bad"
          actions={
            <Button size="sm" onClick={reload}>
              {t('common.retry')}
            </Button>
          }
        >
          {rsvErrorText(t, state.error)}
        </Alert>
      ) : !r ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="row wrap mb-8">
            <Chip tone={STATUS_TONE[r.status]}>{t(STATUS_KEY[r.status])}</Chip>
            {r.stayType === 'long' ? (
              <Chip tone="info">{t('status.booking.long_term')}</Chip>
            ) : null}
            {r.externalContract ? <Chip tone="neutral">{t('lsm.flag')}</Chip> : null}
            {r.capacityConflict ? (
              <Chip tone="bad" icon="alert">
                {t('rsv.capacity_chip')}
              </Chip>
            ) : null}
            {r.conflictState === 'open' ? (
              <Chip tone="bad" icon="alert">
                {t('rsv.conflict_chip')}
              </Chip>
            ) : null}
          </div>
          {r.conflictState === 'open' ? (
            <Alert tone="bad" title={t('error.RESERVATION_UNASSIGNED')}>
              {t('fo.rack.unassigned_help')}
            </Alert>
          ) : null}
          {r.capacityConflict ? (
            // 0.3.5 A-20: OTA booking above the room maximum – check-in blocked until moved/fixed.
            <Alert tone="bad" icon="alert">
              {t('rsv.capacity_conflict_body', {
                n: r.adults + (r.children6to11 ?? 0),
                room: seg?.roomNo ?? '',
                max: room?.maxOccupancy ?? '',
              })}
            </Alert>
          ) : null}
          {r.status === 'hold' && left ? (
            left.ms > 0 ? (
              <Alert
                tone={left.ms < rules.holdWarnHours * 3_600_000 ? 'bad' : 'warn'}
                icon="hourglass"
                title={t('rsv.hold_expires', {
                  h: left.h,
                  m: left.m,
                  at: `${timeHHmm(new Date(r.hold!.expiresAt!))} ${dayMonth(r.hold!.expiresAt!.slice(0, 10))}`,
                })}
              >
                {t('rsv.hold_auto')}
              </Alert>
            ) : (
              <Alert tone="bad">
                {t('drawer.hold.expired', { time: dateTime(r.hold?.expiresAt) })}
              </Alert>
            )
          ) : null}

          {changed ? (
            <Alert tone="warn" role="alert">
              {t('rsv.transition_changed', { status: t(STATUS_KEY[changed]) })}
            </Alert>
          ) : null}
          {billError ? <Alert tone="bad">{rsvErrorText(t, billError)}</Alert> : null}
          {allowed.has('check_in') && !deviceTrusted ? (
            <p className="caption mb-8" id={`${drawerId}-checkin`}>
              {t('device.blocked_title')}
            </p>
          ) : null}
          <ol className="progress-steps" aria-label={t('drawer.progress.label')}>
            {steps.map((s, i) => (
              <li
                key={s.key}
                className={s.done ? 'done' : undefined}
                aria-current={i === currentStep ? 'step' : undefined}
              >
                {t(s.key)}
              </li>
            ))}
          </ol>

          <dl className="dl">
            <dt>{t('booking.field.room')}</dt>
            <dd>
              {seg?.roomNo
                ? `${seg.roomNo}${room?.name ? ` · ${room.name}` : ''}`
                : t('rack.legend_unassigned')}
            </dd>
            <dt>{t('rsv.dates')}</dt>
            <dd>
              {dayMonth(r.arrivalDate)} → {dayMonth(r.departureDate)} ·{' '}
              {t('booking.field.nights', { n: r.nights ?? 0 })}
              {r.etaTime ? ` · ${t('rsv.eta', { time: r.etaTime })}` : ''}
            </dd>
            <dt>{t('booking.field.guests')}</dt>
            <dd>
              {t('rsv.guests_line', {
                adults: r.adults,
                base: room?.baseOccupancy ?? '–',
                max: room?.maxOccupancy ?? '–',
              })}
              {r.children6to11 ? ` · ${r.children6to11} ${t('occ.children_short')}` : ''}
              {r.childrenUnder6 ? ` · ${r.childrenUnder6} ${t('occ.under6_short')}` : ''}
              {/* 0.3.6 add. 4: guests the OTA priced – people above it pay at the desk. */}
              {r.otaGuestCount ? (
                <div className="li-s">{t('rsv.ota_guest_count', { n: r.otaGuestCount })}</div>
              ) : null}
            </dd>
            <dt>{t('booking.field.channel')}</dt>
            <dd>
              {chName}
              {r.otaRef ? ` · ${r.otaRef}` : ''}
            </dd>
          </dl>

          {/* A22a: online check-in link before arrival (FD+). */}
          {fd && online && (r.status === 'hold' || r.status === 'confirmed') ? (
            <GuestLinkPanel reservation={r} />
          ) : null}
          {r.status === 'in_house' && fd ? (
            <dl className="dl mt-12">
              <dt>{t('stay.checkout_time')}</dt>
              <dd>
                {r.agreedCheckoutTime ?? t('stay.checkout_std', { time: rules.checkoutTime })}
              </dd>
              <dt>{t('stay.door')}</dt>
              <dd>
                {r.doorAccessHandedOverAt ? (
                  t('checkin.door_handed_over')
                ) : (
                  <Chip tone="warn">{t('rsv.door_not_handed')}</Chip>
                )}
                <div className="li-s">{t('stay.door_manual')}</div>
              </dd>
            </dl>
          ) : null}
          {r.status === 'in_house' && fd && online ? (
            <div className="row wrap mt-8">
              <Button size="sm" onClick={() => setOpen('charge')}>
                {t('stay.add_charge')}
              </Button>
              <Button size="sm" onClick={() => setOpen('confirm_time')}>
                {t('today.confirm_time')}
              </Button>
              {!r.doorAccessHandedOverAt ? (
                <Button size="sm" onClick={() => setOpen('door')}>
                  {t('drawer.action.door_handed_over')}
                </Button>
              ) : null}
            </div>
          ) : null}
          {r.extraGuestCount ? (
            <div className="amenity mt-12">
              <Icon name="sofa" />
              <b>{t('occ.kit_chip', { n: r.extraGuestCount })}</b>
            </div>
          ) : null}

          {r.externalContract && r.manualLongStay ? (
            <>
              <dl className="dl mt-12">
                <dt>{t('lsm.rent')}</dt>
                <dd className="num">
                  {vnd(r.manualLongStay.monthlyRentVnd ?? 0)} {t('common.vnd_unit')}
                </dd>
                {r.manualLongStay.depositHeldVnd !== undefined ? (
                  <>
                    <dt>{t('lsm.deposit')}</dt>
                    <dd className="num">
                      {vnd(r.manualLongStay.depositHeldVnd)} {t('common.vnd_unit')}
                    </dd>
                  </>
                ) : null}
                {r.manualLongStay.externalContractRef ? (
                  <>
                    <dt>{t('lsm.contract_ref')}</dt>
                    <dd className="mono">{r.manualLongStay.externalContractRef}</dd>
                  </>
                ) : null}
              </dl>
              <Alert tone="warn" role="note">
                {t('lsm.no_reminder')}
              </Alert>
            </>
          ) : null}

          {r.stayType !== 'long' && r.totalRoomVnd !== undefined ? (
            <>
              <h3 className="label-h mt-16 mb-4">{t('drawer.folio.title')}</h3>
              <table className="sum">
                <tbody>
                  <tr>
                    <td>{t('drawer.folio.room', { n: r.nights ?? 0 })}</td>
                    <td className="r">{vnd(r.totalRoomVnd)}</td>
                  </tr>
                  {r.status === 'hold' ? (
                    // ARC 16.20 (BUG-R2-101): what a hold owes is the deposit still missing (BR-305).
                    depositDue !== undefined && depositDue > 0 ? (
                      <tr className="sub">
                        <td>{t('booking.summary.deposit')}</td>
                        <td className="r">{vnd(depositDue)}</td>
                      </tr>
                    ) : null
                  ) : r.depositRequiredVnd !== undefined &&
                    r.status === 'confirmed' &&
                    r.paymentModel !== 'ota_prepaid' ? (
                    // ARC 0.3.7 bổ sung 4 #2 (BR-309-11): from `confirmed` on the figure is the base of the
                    // cancellation fee – never a new deposit to collect. UXR P-17: only while OTTIMO can still
                    // charge it (a confirmed booking not prepaid to an OTA) – not in house, not after.
                    <tr className="sub">
                      <td>{t('drawer.deposit_fee_base')}</td>
                      <td className="r">{vnd(r.depositRequiredVnd)}</td>
                    </tr>
                  ) : null}
                  {!linesShown && (r.balanceDueVnd !== undefined || nothingPosted) ? (
                    <>
                      {paidVnd !== undefined && paidVnd > 0 ? (
                        <tr className="sub">
                          <td>{t('drawer.folio.paid')}</td>
                          <td className="r">−{vnd(paidVnd)}</td>
                        </tr>
                      ) : null}
                      {refundedVnd > 0 ? (
                        <tr className="sub">
                          <td>{t('drawer.folio.refunded')}</td>
                          <td className="r">+{vnd(refundedVnd)}</td>
                        </tr>
                      ) : null}
                      {nothingPosted || r.balanceDueVnd === undefined ? (
                        <tr className="sub">
                          <td colSpan={2}>{t('drawer.folio.nothing_posted')}</td>
                        </tr>
                      ) : (
                        <tr className="total">
                          <td>{t('drawer.folio.balance')}</td>
                          <td className="r">
                            {vnd(r.balanceDueVnd)} {t('common.vnd_unit')}
                          </td>
                        </tr>
                      )}
                    </>
                  ) : null}
                </tbody>
              </table>
            </>
          ) : null}

          {sales && commission ? (
            <dl className="dl mt-12">
              <dt>{t('rsv.commission_mine')}</dt>
              <dd>
                {vnd(commission.amountVnd)} ({commission.ratePctSnapshot ?? '–'}% – BR-903) ·{' '}
                {t(`commission.status.${commission.status}`)}
              </dd>
            </dl>
          ) : null}

          {folio && folioLines ? (
            <>
              <table className="sum">
                <tbody>
                  {folio.lines
                    .filter((l) => l.category !== 'room')
                    .map((l) => (
                      <tr key={l.id} className="sub">
                        <td>
                          {lineLabel(t, l)}
                          {l.lineState === 'pending_approval' ? (
                            <>
                              {' '}
                              <Chip tone="warn" icon="hourglass">
                                {t('approval.status.pending')}
                              </Chip>
                            </>
                          ) : null}
                        </td>
                        <td className="r">{signed(vnd, l.amountVnd)}</td>
                      </tr>
                    ))}
                  {paidVnd !== undefined && paidVnd > 0 ? (
                    <tr className="sub">
                      <td>{t('drawer.folio.paid')}</td>
                      <td className="r">−{vnd(paidVnd)}</td>
                    </tr>
                  ) : null}
                  {refundedVnd > 0 ? (
                    <tr className="sub">
                      <td>{t('drawer.folio.refunded')}</td>
                      <td className="r">+{vnd(refundedVnd)}</td>
                    </tr>
                  ) : null}
                  <tr className="total">
                    <td>{t('drawer.folio.balance')}</td>
                    <td className="r">
                      {vnd(folio.totals.balanceDueVnd ?? 0)} {t('common.vnd_unit')}
                    </td>
                  </tr>
                </tbody>
              </table>
              {(folio.totals.creditVnd ?? 0) > 0 && online ? (
                <Button size="sm" onClick={() => setOpen('refund')}>
                  {t('refund.request_overpayment', { amount: money(folio.totals.creditVnd ?? 0) })}
                </Button>
              ) : null}
            </>
          ) : null}
          {fd && online && r.folioId && r.status !== 'hold' ? (
            // S4-27: every line and payment, with "Điều chỉnh" / "Đảo giao dịch" (BR-008).
            <Button size="sm" variant="ghost" onClick={() => setOpen('folio')}>
              {t('folio.open')}
            </Button>
          ) : null}

          {r.partyMissingCount || (fd && ['confirmed', 'in_house'].includes(r.status)) ? (
            <>
              <h3 className="label-h mt-16 mb-4">{t('rsv.party')}</h3>
              {r.partyMissingCount ? (
                <Alert tone="warn">{t('rsv.party_missing', { n: r.partyMissingCount })}</Alert>
              ) : null}
              {fd && online && ['confirmed', 'in_house'].includes(r.status) ? (
                <Button size="sm" onClick={() => setOpen('party')}>
                  {t('rsv.add_person')}
                </Button>
              ) : null}
            </>
          ) : null}
        </>
      )}

      {base && open === 'cancel' ? (
        <CancelDialog
          {...base}
          ota={ota}
          canPostpone={
            allowed.has('postpone') && roles.some((x) => x === 'owner' || x === 'manager')
          }
          onPostpone={() => setOpen('postpone')}
        />
      ) : null}
      {base && open === 'deposit' ? <DepositDialog {...base} /> : null}
      {base && open === 'extend' ? <ExtendHoldDialog {...base} rules={rules} /> : null}
      {base && (open === 'move' || open === 'postpone') ? (
        <MoveDialog {...base} rooms={catalog.rooms} ota={ota} postpone={open === 'postpone'} />
      ) : null}
      {base && open === 'noshow' ? <NoShowDialog {...base} channelName={chName} /> : null}
      {base && open === 'restore' ? (
        <RestoreDialog
          {...base}
          requiresApproval={!!allowed.get('restore_no_show')?.requiresApproval}
        />
      ) : null}
      {base && open === 'assign' ? (
        <AssignRoomDialog
          {...base}
          rooms={catalog.rooms}
          channelLabel={chName}
          lead={roles.some((x) => LEAD_PLUS.includes(x))}
        />
      ) : null}
      {r && open === 'extend_stay' ? (
        <ExtendDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'late' ? (
        <LateCheckoutDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'change_room' ? (
        <ChangeRoomDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'charge' ? (
        <AddChargeDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'confirm_time' ? (
        <ConfirmTimeDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'door' ? (
        <DoorHandedDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'undo' ? (
        <UndoCheckInDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'folio' ? (
        <FolioDialog
          reservation={r}
          onClose={() => setOpen(null)}
          onChanged={() => void reloadNow()}
        />
      ) : null}
      {r && open === 'party' ? (
        <PartyDialog reservation={r} onClose={() => setOpen(null)} onDone={done} />
      ) : null}
      {r && open === 'refund' && folio ? (
        <RefundRequestDialog
          reservation={r}
          creditVnd={folio.totals.creditVnd ?? 0}
          onClose={() => setOpen(null)}
          onDone={done}
        />
      ) : null}
      {r && open === 'bill' && bill ? (
        <BillDialog
          bill={bill}
          channel={chName}
          onClose={() => {
            setOpen(null);
            setBill(null);
          }}
        />
      ) : null}
      {base && open === 'notice' ? (
        <DepositNoticeDialog
          reservation={base.reservation}
          onDone={() => done()}
          onClose={base.onClose}
        />
      ) : null}
    </Modal>
  );
}
