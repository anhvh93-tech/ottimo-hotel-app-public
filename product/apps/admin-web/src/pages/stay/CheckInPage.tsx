import {
  isApiError,
  type CheckInBody,
  type CheckInCondition,
  type FocRequestInput,
  type PaymentMethod,
  type Registration,
  type Reservation,
} from '@ottimo/api-client';
import { hasKey, useI18n } from '@ottimo/i18n';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  ConfirmDialog,
  Field,
  Icon,
  Modal,
  Stepper,
  Switch,
} from '@ottimo/ui';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../app/api';
import { listApprovals } from '../../app/approvals';
import { useCatalog } from '../../app/catalog';
import { dayMonth } from '../../app/reservations';
import { useRules } from '../../app/rules';
import { timeHHmm, todayLocal } from '../../app/dates';
import { useToast } from '../../app/toast';
import { lineLabel } from '../../app/folio';
import { Page, Topbar } from '../../components/AppShell';
import { DeviceBlocked, ErrorBlock, LoadingBlock } from '../../components/states';
import { OccupancyField, type Occupancy } from '../../components/OccupancyField';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { DocsList, VerifyList, reviewReady } from '../registration/DocsPanel';
import { useSubmit } from './common';
import { FOC_REASONS } from './foc';
import { PartySourceField, needsPartySource, usePartySource } from './PartySource';
import {
  CheckInPayment,
  emptyInlinePay,
  inlinePayment,
  type InlinePay,
  type InlinePayBlock,
} from './CheckInPayment';
import { Code } from '../../app/mono';

const LEAD_PLUS = ['owner', 'manager', 'front_desk_lead'];
const COND_LABEL: Record<CheckInCondition['code'], string> = {
  not_unassigned: 'checkin.cond.not_unassigned',
  capacity_within_max: 'checkin.cond.capacity',
  room_ready: 'checkin.cond.room_ready',
  balance_paid: 'checkin.cond.balance_paid',
  main_guest_document: 'checkin.cond.main_guest_document',
  document_check_block: 'checkin.cond.document_ok',
};
const STEPS = [
  'checkin.step.docs',
  'checkin.step.verify',
  'checkin.step.register',
  'checkin.step.handover',
];

/**
 * H13 Nhận phòng (S06, US-025/026, B9): conditions from `previewCheckIn` on top (each unmet one says
 * what to do), then 4 steps – documents (C3), checks, registration, hand-over. C3 steps only on a
 * device the owner granted (SR-DEV); elsewhere the conditions and folio stay visible. The button opens
 * when "house rules sent" is ticked (and "told the guest" when a surcharge is shown) – the door/card
 * box is optional (PO 16/10, US-025 AC7). Conflicts/busy follow DS 6.21.
 */
export function CheckInPage({ reservationId }: { reservationId: string }) {
  const { t, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles, deviceTrusted } = useSession();
  const { online, since } = useOnline();
  const navigate = useNavigate();
  const toast = useToast();
  const ids = useId();
  const lead = roles.some((r) => LEAD_PLUS.includes(r));
  const catalog = useCatalog(propertyId);
  const rules = useRules(propertyId, roles);
  const R = { propertyId, reservationId };

  const res = useResource(
    async () => (await api.getReservation(R)).data,
    [propertyId, reservationId],
  );
  const r = res.state.data;
  const [step, setStep] = useState(0);
  const [early, setEarly] = useState(false);
  const [time, setTime] = useState('');
  const debouncedTime = useDebounced(early ? time : '', 300);
  const preview = useResource(
    async () => (await api.previewCheckIn(R, debouncedTime || undefined)).data,
    [propertyId, reservationId, debouncedTime],
  );
  const p = preview.state.data;
  const folio = useResource(
    async () => (r ? (await api.getFolio({ propertyId, folioId: r.folioId })).data : null),
    [propertyId, r?.folioId],
  );
  // FE-S4-02 (OpenAPI 0.3.7 checkIn bổ sung 1 (a)): the lead approved this desk's request today → B9 again
  // with its id and the payment (the desk checks in – no second request, money taken then).
  const roomApproval = useResource(
    async () =>
      lead || !r
        ? null
        : ((
            await listApprovals(propertyId, ['approved'], {
              // BUG-R2-107: page through (own requests only for FD); stop at the first match.
              maxPages: 10,
              find: (a) =>
                a.type === 'checkin_room_not_ready' &&
                a.reservationCode === r.code &&
                !!a.decidedAt &&
                todayLocal(undefined, new Date(a.decidedAt)) === todayLocal(),
            })
          )[0] ?? null),
    [propertyId, lead, r?.code],
  );
  const approved = roomApproval.state.data ?? null;
  const reloadApproval = () => {
    roomApproval.reload();
    preview.reload();
  };
  const [registration, setRegistration] = useState<Registration | null>(null);
  useEffect(() => {
    if (!deviceTrusted || !r?.registrationId) return;
    let stale = false;
    api.getRegistration({ propertyId, registrationId: r.registrationId }).then(
      (x) => !stale && setRegistration(x.data),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [deviceTrusted, propertyId, r?.registrationId]);

  const [toldGuest, setToldGuest] = useState(false);
  const [timeNote, setTimeNote] = useState('');
  const [askFoc, setAskFoc] = useState(false);
  const [focReason, setFocReason] = useState<FocRequestInput['reasonCode'] | ''>('');
  const [focNote, setFocNote] = useState('');
  const [cards, setCards] = useState(1);
  const [houseRules, setHouseRules] = useState(false);
  const [door, setDoor] = useState(false);
  const [roomReason, setRoomReason] = useState('');
  const [docReason, setDocReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [fixGuests, setFixGuests] = useState(false);
  const [waitingLead, setWaitingLead] = useState(false);
  useEffect(() => {
    if (approved) setWaitingLead(false);
  }, [approved]);
  const [verifyTried, setVerifyTried] = useState(false);
  /** S4-10: cash / transfer / POS collected together with B9 (`checkIn.payment`). */
  const [pay, setPay] = useState<InlinePay>(emptyInlinePay);
  // BUG-R2-052: fields with an input show their message there; the others are named in the alert.
  const act = useSubmit({
    bound: [
      'checkinTime',
      'checkinTimeNote',
      'roomNotReadyOverride.reason',
      'documentBlockOverride.reason',
      'payment.posAuthCode',
      'payment.note',
    ],
    labels: {
      addPriorNight: t('checkin.prior_night_submit'),
      priorNightRateVnd: t('checkin.prior_night_submit'),
      cardsIssued: t('handover.cards'),
      houseRulesSent: t('ci.house_rules_sent'),
      doorAccessHandedOver: t('checkin.door_handed_over'),
      applyEarlySurcharge: t('ci.told_guest'),
      expectedSurchargeVnd: t('ci.told_guest'),
      documentBlockOverride: t('ci.doc_blocked_title'),
      roomNotReadyOverride: t('checkin.cond.room_ready'),
      payment: t('ci.due_title'),
    },
  });

  const reloadAll = () => {
    res.reload();
    preview.reload();
    folio.reload();
  };

  if (!r && res.state.status === 'error')
    return (
      <>
        <Topbar title={t('drawer.action.check_in')} />
        <Page>
          <ErrorBlock
            titleKey="ci.error_title"
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
        <Topbar title={t('drawer.action.check_in')} />
        <Page>
          <LoadingBlock />
        </Page>
      </>
    );

  const room = r.segments?.[0]?.roomNo ?? '';
  const roomInfo = catalog.rooms.find((x) => x.id === r.segments?.[0]?.roomId);
  const guest = r.booker?.displayName ?? '';
  const conds = p?.conditions ?? [];
  const cond = (code: CheckInCondition['code']) => conds.find((c) => c.code === code);
  const balance = folio.state.data?.totals.balanceDueVnd ?? r.balanceDueVnd ?? 0;
  const extraLines = (folio.state.data?.lines ?? []).filter(
    (l) => l.category === 'extra_person' && l.lineState === 'posted',
  );
  const sur = p?.earlyCheckinSurcharge;
  const amount = sur?.amountVnd ?? 0;
  // BUG-R2-127 (P1): B9a only when the night before is free (`priorNight.available`, BR-906). Taken → no prior
  // night is offered, sent or collected; before the day rollover the guest cannot be checked in (BR-417).
  const priorTaken = !!sur?.addsPreviousNight && p?.priorNight?.available === false;
  const priorNight = !!sur?.addsPreviousNight && !priorTaken;
  const roomCond = cond('room_ready');
  const docCond = cond('document_check_block');
  const ooo = roomCond && !roomCond.met && roomCond.detail === 'OOO';
  const stdIn = p?.standardCheckinTime?.slice(0, 5) ?? rules.checkinTime;
  // FE-S3-05: FD + room not ready + reason → the button sends a request (202), it does not check in.
  const requestOnly =
    !lead && !approved && !!roomCond && !roomCond.met && !ooo && roomReason.trim().length >= 3;
  /** FD, room still not ready, the lead approved the request today (FE-S4-02). */
  const roomApproved = !lead && !!approved && !!roomCond && !roomCond.met && !ooo;
  const docsMain = !!registration?.documents.some((d) => d.isMain);
  const statusText = p?.roomStatus ? t(`status.room.${p.roomStatus}`) : '';
  const foreign =
    registration?.kind === 'foreigner_temp_residence' || registration?.kind === 'mixed';
  const deadline = p?.registrationDeadlinePreview;

  const needTold = early && amount > 0 && !priorTaken;
  // S4-10 (BUG-R2-038, BR-402 v0.3.6): what B9 needs collected = balance + the charge / B9a night it is
  // about to post (server `amountDueAtCheckinVnd`) − a FOC asked on that charge (not collected now).
  const focAsked = needTold && toldGuest && askFoc && focReason && !priorNight ? amount : 0;
  const balanceNow = p?.balanceDueVnd ?? balance;
  // ARC 0.3.7 bổ sung 4: the server's figure in full (B9a step, person fee, credit, clamped once) – no
  // client addition; only the FOC asked in THIS call (not known to the preview) is taken off (BR-402).
  const due = Math.max(
    0,
    (priorTaken ? balanceNow : (p?.amountDueAtCheckinVnd ?? balanceNow)) - focAsked,
  );
  // B9 carries the payment (cash/transfer/POS) for the amount the desk really took (FE-S4-01).
  const payCheck = inlinePayment(pay, due);
  const payInline = !requestOnly && due > 0 && payCheck.ok;
  // FE-S4-02 (ARC 0.3.7): a request to the lead (202) records no money – the balance is collected at the
  // B9 call after approval, so it does not block sending the request.
  const balanceCovered = due === 0 || payInline || requestOnly;
  const payBlockText = (b: InlinePayBlock): string =>
    b.kind === 'cash_short'
      ? t('ci.submit_cash_short', { amount: money(b.shortVnd) })
      : b.kind === 'short'
        ? t('ci.submit_pay_short', { amount: money(b.shortVnd) })
        : b.kind === 'over'
          ? t('ci.submit_pay_over', { amount: money(b.dueVnd) })
          : b.kind === 'amount_needed'
            ? t('ci.submit_pay_amount_needed')
            : b.kind === 'pos_code'
              ? t('ci.submit_pos_code')
              : t('ci.submit_needs_pay', { amount: money(due) });
  // Unmet conditions that block the button (a reason typed for the room / document exception counts).
  const blocking = conds.filter((c) => {
    if (c.code === 'balance_paid') return !c.met && !balanceCovered;
    if (c.met) return false;
    if (c.code === 'room_ready' && !ooo && (roomApproved || roomReason.trim().length >= 3))
      return false;
    if (c.code === 'document_check_block' && lead && docReason.trim().length >= 3) return false;
    return true;
  });
  const canSubmit =
    online &&
    houseRules &&
    !priorTaken &&
    (!needTold || toldGuest) &&
    blocking.length === 0 &&
    !waitingLead;
  // FE-S3-04: the first missing thing, said next to the locked button (aria-describedby).
  const priorTakenText = t('checkin.prior_night_taken', {
    date: p?.priorNight?.date ? p.priorNight.date.split('-').reverse().slice(0, 2).join('/') : '',
  });
  const whyLocked = priorTaken
    ? priorTakenText
    : !houseRules
      ? t('ci.submit_needs_rules')
      : needTold && !toldGuest
        ? t('ci.submit_needs_told')
        : blocking.length === 1 && blocking[0]!.code === 'balance_paid'
          ? payCheck.ok
            ? t('ci.submit_needs_pay', { amount: money(due) })
            : payBlockText(payCheck.block)
          : blocking.length
            ? t('ci.submit_needs_conditions', { n: blocking.length })
            : waitingLead
              ? t('ci.waiting_lead')
              : null;
  const payLine = payInline
    ? t('ci.effect_pay', {
        amount: money(payCheck.ok ? payCheck.amountVnd : due),
        method: t(
          pay.method === 'cash'
            ? 'pay.cash'
            : pay.method === 'bank_transfer'
              ? 'pay.bank_transfer'
              : 'pay.card',
        ),
      })
    : null;

  const submit = async () => {
    const body: CheckInBody = {
      // Not early → no typed time (the server uses its clock / standard time – E03-07).
      checkinTime: early && time ? time : undefined,
      checkinTimeNote: early && timeNote.trim() ? timeNote.trim() : undefined,
      applyEarlySurcharge: needTold && toldGuest,
      expectedSurchargeVnd: needTold && toldGuest ? amount : undefined,
      requestFocForSurcharge:
        needTold && toldGuest && askFoc && focReason
          ? {
              kind: 'foc',
              amountVnd: amount,
              reasonCode: focReason,
              note: focNote.trim() || undefined,
            }
          : undefined,
      roomNotReadyOverride: roomApproved
        ? { reason: approved?.reasonNote || undefined, approvalRequestId: approved!.id }
        : roomCond && !roomCond.met && roomReason.trim()
          ? { reason: roomReason.trim() }
          : undefined,
      documentBlockOverride:
        docCond && !docCond.met && lead && docReason.trim()
          ? { reason: docReason.trim() }
          : undefined,
      cardsIssued: cards,
      houseRulesSent: true,
      doorAccessHandedOver: door,
      addPriorNight: priorNight || undefined,
      // ARC 16.18 (vòng sửa 5): H13 has no box to change the B9a night's rate – the suggested one is never sent
      // (absent = the server's default night; a rate sent would be recorded as typed by the desk).
      payment:
        payInline && payCheck.ok
          ? {
              type: 'charge',
              method: pay.method as PaymentMethod,
              amountVnd: payCheck.amountVnd,
              note: pay.method === 'bank_transfer' ? pay.note.trim() || undefined : undefined,
              posAuthCode: pay.method === 'card_pos' ? pay.pos.trim() : undefined,
            }
          : undefined,
    };
    let failed: unknown = null;
    const out = await act.submit((idem) =>
      api.checkIn(R, body, r.version, idem).catch((e: unknown) => {
        failed = e;
        throw e;
      }),
    );
    setConfirm(false);
    if (!out) {
      // Re-read the preview; only a changed surcharge asks to confirm "told the guest" again (DS 6.3).
      preview.reload();
      folio.reload();
      if (isApiError(failed) && failed.code === 'SURCHARGE_CHANGED') setToldGuest(false);
      return;
    }
    if (out.status === 202) {
      setWaitingLead(true);
      return;
    }
    const done = out.data as Reservation;
    toast(
      t('checkin.done', {
        room,
        deadline: done.registrationDeadlineAt ? dateTime(done.registrationDeadlineAt) : '',
      }),
    );
    navigate(`/reservations/${reservationId}`);
  };

  const errorExtra = () => {
    if (isApiError(act.error) && act.error.code === 'CHECKIN_CONDITIONS_NOT_MET') {
      const unmet = (act.error.problem as { unmet?: string[] }).unmet ?? [];
      return t('error.CHECKIN_CONDITIONS_NOT_MET', {
        unmet: unmet
          .map((c) => (c in COND_LABEL ? t(COND_LABEL[c as CheckInCondition['code']]) : c))
          .join('; '),
      });
    }
    return null;
  };

  const condDetail = (c: CheckInCondition) => {
    switch (c.code) {
      case 'room_ready':
        return t('ci.cond_room', { room, status: statusText });
      case 'balance_paid':
        return c.met ? null : t('ci.cond_balance', { amount: money(due) });
      case 'main_guest_document':
        return c.met ? null : t('ci.cond_doc');
      case 'capacity_within_max':
        return c.met
          ? t('ci.cond_capacity_ok', {
              n: r.adults + (r.children6to11 ?? 0),
              room,
              max: roomInfo?.maxOccupancy ?? '–',
            })
          : null;
      case 'document_check_block':
        // FE-S3-18: never "Đã đủ" before any document was checked.
        if (c.met && registration && registration.documents.length === 0)
          return t('ci.cond_doc_check_pending');
        return c.met && registration && !foreign ? t('ci.cond_na_citizen') : null;
      default:
        return null;
    }
  };

  // FE-S3-18: a step is "done" only when it really is (main document; checks noted; register later).
  const stepDone = [
    docsMain,
    docsMain && !!registration && reviewReady(registration, ['party_count']),
    step > 2,
    false,
  ];
  const steps = (
    <ol className="progress-steps" aria-label={t('checkin.steps_label')}>
      {STEPS.map((k, i) => (
        <li
          key={k}
          className={stepDone[i] && i !== step ? 'done' : undefined}
          aria-current={i === step ? 'step' : undefined}
        >
          {t(k)}
        </li>
      ))}
    </ol>
  );

  const conditionsCard = (
    <section className="card" aria-labelledby={`${ids}-cond`}>
      <h2 className="label-h" id={`${ids}-cond`}>
        {t('checkin.cond.title')}
      </h2>
      {!p ? (
        preview.state.status === 'error' ? (
          <Alert
            tone="bad"
            actions={
              <Button size="sm" onClick={preview.reload}>
                {t('common.retry')}
              </Button>
            }
          >
            {act.text(preview.state.error)}
          </Alert>
        ) : (
          <LoadingBlock rows={2} />
        )
      ) : (
        <ul className="conds">
          {conds.map((c) => {
            const pendingCheck =
              c.code === 'document_check_block' &&
              c.met &&
              !!registration &&
              registration.documents.length === 0;
            return (
              <li key={c.code} className={pendingCheck ? undefined : c.met ? 'met' : 'unmet'}>
                <Icon name={pendingCheck ? 'question' : c.met ? 'check' : 'x'} />
                <div className="grow">
                  <b>{t(COND_LABEL[c.code])}</b>
                  {condDetail(c) ? <div className="li-s">{condDetail(c)}</div> : null}
                  {!c.met && c.code === 'not_unassigned' ? (
                    <div className="li-s">{t('error.RESERVATION_UNASSIGNED')}</div>
                  ) : null}
                  {!c.met && c.code === 'capacity_within_max' ? (
                    <Alert tone="bad" title={t('ci.capacity_block_title')}>
                      {t('rsv.capacity_conflict_body', {
                        n: r.adults + (r.children6to11 ?? 0),
                        room,
                        max: roomInfo?.maxOccupancy ?? '–',
                      })}
                      <div className="row wrap mt-4">
                        <Link className="btn sm" to={`/reservations/${reservationId}`}>
                          {t('ci.capacity_fix_move')}
                        </Link>
                        <Button size="sm" onClick={() => setFixGuests(true)}>
                          {t('checkin.fix_guest_count')}
                        </Button>
                      </div>
                    </Alert>
                  ) : null}
                  {!c.met && c.code === 'room_ready' ? (
                    ooo ? (
                      <div className="li-s">{t('ci.ooo_never')}</div>
                    ) : roomApproved ? (
                      <Chip tone="ok" icon="check">
                        {t('ci.room_approved', { name: approved?.approverName ?? '' })}
                      </Chip>
                    ) : (
                      <>
                        <div className="li-s">
                          {lead
                            ? t('checkin.room_not_ready_lead', { room, status: statusText })
                            : t('checkin.room_not_ready', { room, status: statusText })}
                        </div>
                        <Field
                          label={t('ci.reason')}
                          required
                          error={act.fields['roomNotReadyOverride.reason']}
                        >
                          {(fp) => (
                            <input
                              {...fp}
                              className="input"
                              maxLength={500}
                              value={roomReason}
                              onChange={(e) => setRoomReason(e.target.value)}
                            />
                          )}
                        </Field>
                      </>
                    )
                  ) : null}
                  {c.code === 'balance_paid' && extraLines.length ? (
                    // 0.3.6 add. 4: extra-guest fee as the server posted it (collected at the desk,
                    // not covered by the OTA) – the folio lines with their bill labels.
                    <ul className="list-plain li-s">
                      {extraLines.map((l) => (
                        <li key={l.id}>
                          {lineLabel(t, l)} · {money(l.amountVnd)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {!c.met && c.code === 'balance_paid' ? (
                    <Button size="sm" onClick={() => setStep(3)}>
                      {t('ci.pay_open')}
                    </Button>
                  ) : null}
                  {!c.met && c.code === 'main_guest_document' && deviceTrusted ? (
                    <Button size="sm" onClick={() => setStep(0)}>
                      {t('ci.go_docs')}
                    </Button>
                  ) : null}
                  {!c.met && c.code === 'document_check_block' ? (
                    <div className="stack">
                      <b>{t('ci.doc_blocked_title')}</b>
                      <div className="li-s">{t('ci.doc_blocked_body')}</div>
                      {lead ? (
                        <Field
                          label={t('ci.reason')}
                          required
                          error={act.fields['documentBlockOverride.reason']}
                        >
                          {(fp) => (
                            <textarea
                              {...fp}
                              className="input"
                              maxLength={500}
                              value={docReason}
                              onChange={(e) => setDocReason(e.target.value)}
                            />
                          )}
                        </Field>
                      ) : (
                        <div className="li-s">{t('ci.block_fd')}</div>
                      )}
                    </div>
                  ) : null}
                </div>
                {pendingCheck ? (
                  <Chip tone="neutral" icon="question">
                    {t('checkin.verify.result.unknown')}
                  </Chip>
                ) : (
                  <Chip tone={c.met ? 'ok' : 'bad'}>{t(c.met ? 'ci.met' : 'ci.unmet')}</Chip>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {r.depositShortfall ? (
        <Alert tone="info">
          {t('ci.shortfall_accepted', {
            who: r.depositShortfall.acceptedByName,
            amount: money(balance),
          })}
        </Alert>
      ) : null}
      {p?.warnings?.map((w) => {
        // FE-S3-13: our own sentence per code (never the server `detail`); unknown codes skipped.
        const text =
          w.code === 'extra_guest_kit_not_ready'
            ? t('checkin.kit_not_ready', { room })
            : w.code === 'pending_online_checkin'
              ? t('checkin.docs.from_app')
              : hasKey(`checkin.warn.${w.code}`)
                ? t(`checkin.warn.${w.code}`)
                : null;
        return text ? (
          <Alert
            key={w.code}
            tone="warn"
            icon={w.code === 'extra_guest_kit_not_ready' ? 'sofa' : 'alert'}
          >
            {text}
          </Alert>
        ) : null;
      })}
      {r.extraGuestCount ? (
        <Chip tone="warn" icon="sofa">
          {t('occ.kit_chip', { n: r.extraGuestCount })}
        </Chip>
      ) : null}
    </section>
  );

  // B9 itself needs a granted device (DEVICE_NOT_TRUSTED) – elsewhere only conditions + folio.
  const c3Blocked = !deviceTrusted;
  let body: ReactNode = null;
  if (c3Blocked) {
    body = (
      <>
        <DeviceBlocked />
        <p className="li-s">{t('ci.untrusted_note')}</p>
      </>
    );
  } else if (step === 0) {
    body = registration ? (
      <DocsList
        registration={registration}
        reservation={r}
        onChange={(x) => {
          setRegistration(x);
          preview.reload();
        }}
      />
    ) : (
      <LoadingBlock rows={2} />
    );
  } else if (step === 1) {
    body =
      registration && registration.documents.length === 0 ? (
        <div className="card stack">
          <p>{t('checkin.verify.empty')}</p>
          <Button onClick={() => setStep(0)}>{t('ci.go_docs')}</Button>
        </div>
      ) : registration ? (
        <>
          <VerifyList
            registration={registration}
            departureDate={r.departureDate}
            onChange={(x) => {
              setRegistration(x);
              preview.reload();
            }}
          />
          {verifyTried && !reviewReady(registration, ['party_count']) ? (
            <Alert tone="bad">{t('checkin.verify.note_required')}</Alert>
          ) : null}
        </>
      ) : (
        <LoadingBlock rows={2} />
      );
  } else if (step === 2) {
    body = (
      <div className="card stack">
        <b>{t(foreign ? 'reg.type.foreigner' : 'reg.type.citizen')}</b>
        {deadline ? (
          <p>
            {t(foreign ? 'ci.deadline_foreign' : 'ci.deadline_citizen', {
              in: timeHHmm(new Date()),
              deadline: dateTime(deadline),
            })}
          </p>
        ) : null}
        {!foreign ? <p className="li-s">{t('ci.deadline_citizen_late')}</p> : null}
        <div className="row wrap">
          <Button onClick={() => setStep(3)}>{t('reg.later')}</Button>
          {r.registrationId ? (
            <Link className="btn" to={`/registration/${r.registrationId}`}>
              {t('ci.reg_now')}
            </Link>
          ) : null}
        </div>
      </div>
    );
  } else {
    body = (
      <div className="stack">
        <section className="card stack" aria-labelledby={`${ids}-time`}>
          <h2 className="label-h" id={`${ids}-time`}>
            {t('ci.time_title')}
          </h2>
          <Switch
            checked={early}
            onChange={(v) => {
              setEarly(v);
              setToldGuest(false);
            }}
          >
            {t('ci.early_toggle')}
          </Switch>
          {!early ? (
            <p className="li-s">
              {t('ci.time_default', { std: stdIn })} {t('ci.time_default_help')}
            </p>
          ) : (
            <>
              <Field
                label={t('checkin.time')}
                help={t('checkin.time_hint')}
                error={act.fields.checkinTime}
              >
                {(fp) => (
                  <input
                    {...fp}
                    type="time"
                    className="input"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      setToldGuest(false);
                    }}
                  />
                )}
              </Field>
              {act.fields.checkinTimeNote || timeNote ? (
                // E03-07 TIME_NOTE_REQUIRED: a time well before "now" needs a note (3–300).
                <Field
                  label={t('checkin.time_note')}
                  help={t('stay.time_note_help')}
                  required
                  error={act.fields.checkinTimeNote}
                >
                  {(fp) => (
                    <input
                      {...fp}
                      className="input"
                      maxLength={300}
                      value={timeNote}
                      onChange={(e) => setTimeNote(e.target.value)}
                    />
                  )}
                </Field>
              ) : null}
              <div aria-live="polite">
                {!time ? null : priorTaken ? (
                  <Alert tone="bad">{priorTakenText}</Alert>
                ) : priorNight ? (
                  <Alert tone="info">
                    {t('checkin.prior_night', {
                      date: p?.priorNight?.date
                        ? p.priorNight.date.split('-').reverse().slice(0, 2).join('/')
                        : '',
                      amount: money(amount),
                    })}{' '}
                    {t('rate.prior_night_tier')}
                  </Alert>
                ) : amount > 0 ? (
                  <p>
                    <b>{t('sur.early_fee', { amount: money(amount), pct: sur?.tierPct ?? 0 })}</b>
                  </p>
                ) : (
                  <p>{t('sur.early_zero', { std: stdIn })}</p>
                )}
              </div>
              {amount > 0 && !priorTaken ? (
                <>
                  <Checkbox checked={toldGuest} onChange={setToldGuest}>
                    {t('ci.told_guest')}
                  </Checkbox>
                  {!priorNight ? (
                    <>
                      <Switch checked={askFoc} onChange={setAskFoc}>
                        {t('ci.ask_foc')}
                      </Switch>
                      {askFoc ? (
                        <fieldset className="fieldset-plain">
                          <legend className="li-s">{t('ci.ask_foc_help')}</legend>
                          {FOC_REASONS.map((o) => (
                            <label key={o.value} className="check">
                              <input
                                type="radio"
                                name={`${ids}-foc`}
                                checked={focReason === o.value}
                                onChange={() => setFocReason(o.value)}
                              />
                              {t(o.key)}
                            </label>
                          ))}
                          <Field label={t('stay.note')}>
                            {(fp) => (
                              <input
                                {...fp}
                                className="input"
                                maxLength={300}
                                value={focNote}
                                onChange={(e) => setFocNote(e.target.value)}
                              />
                            )}
                          </Field>
                        </fieldset>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </section>

        <section className="card stack" aria-labelledby={`${ids}-pay`}>
          <h2 className="label-h" id={`${ids}-pay`}>
            {t('ci.pay_title')}
          </h2>
          {online ? (
            <CheckInPayment
              reservation={r}
              due={due}
              breakdown={{
                balanceVnd: balanceNow,
                earlyVnd: needTold && !priorNight ? amount : 0,
                priorNightVnd: needTold && priorNight ? amount : 0,
                focAskedVnd: focAsked,
              }}
              qrInput={{
                checkinTime: early && time ? time : undefined,
                addPriorNight: priorNight || undefined,
              }}
              pay={pay}
              onPay={setPay}
              requestOnly={requestOnly}
              // DOM (f): a check-in VietQR made earlier and still waiting is confirmed here (above what is
              // due now → a note); QR of other purposes stay with the drawer / money screens.
              pendingQr={(folio.state.data?.payments ?? []).find(
                (x) =>
                  x.method === 'vietqr' && x.status === 'pending' && x.qrPurpose === 'check_in',
              )}
              fields={act.fields}
              onPaid={() => {
                folio.reload();
                preview.reload();
                res.reload();
              }}
            />
          ) : due > 0 ? (
            // FE-S3-12: offline never shows "Đã thanh toán đủ" while money is still owed.
            <p className="li-s">{t('rsv.need_online')}</p>
          ) : (
            <Chip tone="ok" icon="check">
              {t('drawer.folio.settled')}
            </Chip>
          )}
        </section>

        <section className="card stack" aria-labelledby={`${ids}-door`}>
          <h2 className="label-h" id={`${ids}-door`}>
            {t('ci.door_title')}
          </h2>
          {/* FE-S3-08 (BR-403): the validity the desk types into the lock app – arrival time → departure. */}
          <dl className="dl">
            <dt>{t('ci.door_valid')}</dt>
            <dd className="num">
              {t('ci.door_valid_value', {
                from: `${early && time ? time : stdIn} ${dayMonth(r.arrivalDate)}`,
                to: `${r.agreedCheckoutTime?.slice(0, 5) ?? rules.checkoutTime} ${dayMonth(r.departureDate)}`,
              })}
            </dd>
            <dt>{t('ci.door_lock')}</dt>
            <dd>TTLock · {room}</dd>
          </dl>
          <ol className="list-plain li-s">
            <li>{t('ci.door_step1', { room })}</li>
            <li>{t('ci.door_step2')}</li>
            <li>{t('ci.door_step3')}</li>
          </ol>
          <div className="field">
            <span className="label-h" id={`${ids}-cards`}>
              {t('handover.cards')}
            </span>
            <Stepper
              value={cards}
              min={0}
              max={2}
              onChange={setCards}
              labelledBy={`${ids}-cards`}
              describedBy={`${ids}-cards-h`}
              decLabel={t('rooms.dec')}
              incLabel={t('rooms.inc')}
            />
            <div className="help" id={`${ids}-cards-h`}>
              {t('handover.cards_help')}
            </div>
          </div>
          <Checkbox checked={houseRules} onChange={setHouseRules}>
            {t('ci.house_rules_sent')} *
          </Checkbox>
          <span className="li-s">{t('ci.house_rules_help')}</span>
          <Checkbox checked={door} onChange={setDoor}>
            {t('checkin.door_handed_over')}
          </Checkbox>
          <span className="li-s">{t('ci.door_optional')}</span>
          <p className="li-s">{t('ci.door_not_stored')}</p>
        </section>

        <section className="card" aria-labelledby={`${ids}-eff`}>
          <h2 className="label-h" id={`${ids}-eff`}>
            {t('ci.effects_title')}
          </h2>
          <ul className="list-plain">
            <li>{t('ci.effect_status', { room })}</li>
            {deadline ? <li>{t('ci.effect_deadline', { deadline: dateTime(deadline) })}</li> : null}
            {needTold && toldGuest ? (
              <li>{t('ci.effect_fee', { amount: money(amount) })}</li>
            ) : null}
            {payLine ? <li>{payLine}</li> : null}
          </ul>
        </section>
      </div>
    );
  }

  const next = () => {
    // Missing companions do not block check-in (BR-402 (3)) – only fail/unverified document checks.
    if (step === 1 && registration && !reviewReady(registration, ['party_count'])) {
      setVerifyTried(true);
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };
  // BUG-R2-032: step 3 → 4 is "Tiếp tục: Giao mã & hoàn tất", not "Nhận phòng căn {room}".
  const nextKey = ['ci.go_verify', 'ci.go_register', 'ci.go_handover'][step];

  return (
    <>
      <Topbar title={t('checkin.title', { room, guest })} sub={<Code>{r.code}</Code>} />
      <Page>
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('ci.offline', { time: since ? timeHHmm(since) : '' })}
          </Alert>
        ) : null}
        {steps}
        <div className="cols-2">
          <div className="stack">{conditionsCard}</div>
          <div className="stack">
            {body}
            {waitingLead ? (
              <Alert
                tone="info"
                icon="hourglass"
                actions={
                  // FE-S4-02: once the lead approved, the desk checks in (and collects) from here.
                  <Button size="sm" onClick={reloadApproval}>
                    {t('common.reload')}
                  </Button>
                }
              >
                {t('ci.waiting_lead')}
              </Alert>
            ) : null}
            {act.code === 'CHECKIN_CONDITIONS_NOT_MET' ? (
              <Alert tone="bad">{errorExtra()}</Alert>
            ) : act.code === 'SURCHARGE_CHANGED' ? (
              <Alert tone="bad">{act.text()}</Alert>
            ) : (
              act.view(
                undefined,
                act.code === 'VERSION_CONFLICT' ? (
                  <Button size="sm" onClick={reloadAll}>
                    {t('common.reload')}
                  </Button>
                ) : undefined,
              )
            )}
          </div>
        </div>
        <div className="wiz-foot">
          {step === 0 || c3Blocked ? (
            <Link className="btn ghost" to={`/reservations/${reservationId}`}>
              {t('ci.back_to_booking')}
            </Link>
          ) : (
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              {t('common.back')}
            </Button>
          )}
          {!online ? (
            <>
              <span className="li-s">{t('ci.offline_short')}</span>
              <Button variant="pri" aria-disabled="true" onClick={() => undefined}>
                {t('rsv.need_online')}
              </Button>
            </>
          ) : c3Blocked ? null : step < 3 ? (
            <Button variant="pri" onClick={next}>
              {t(nextKey!)}
            </Button>
          ) : (
            <>
              {whyLocked ? (
                <span className="li-s" id={`${ids}-why`}>
                  {whyLocked}
                </span>
              ) : null}
              <Button
                variant="pri"
                aria-disabled={!canSubmit || undefined}
                aria-describedby={whyLocked ? `${ids}-why` : undefined}
                busy={act.busy}
                busyLabel={act.busyLabel}
                onClick={() => canSubmit && setConfirm(true)}
              >
                {act.label(
                  requestOnly
                    ? t('ci.send_lead')
                    : priorNight && needTold
                      ? t('checkin.prior_night_submit')
                      : t('ci.submit', { room }),
                )}
              </Button>
            </>
          )}
        </div>
      </Page>
      {confirm ? (
        <ConfirmDialog
          danger={false}
          title={
            requestOnly ? t('ci.request_title', { room }) : t('ci.confirm_title', { room, guest })
          }
          body={requestOnly ? t('ci.request_effect') : t('ci.effect_status', { room })}
          keepLabel={t('confirm.keep')}
          confirmLabel={requestOnly ? t('ci.send_lead') : t('ci.submit', { room })}
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setConfirm(false)}
          onConfirm={() => void submit()}
        >
          {deadline && !requestOnly ? (
            <p className="li-s">{t('ci.effect_deadline', { deadline: dateTime(deadline) })}</p>
          ) : null}
          {needTold && toldGuest && !requestOnly ? (
            <p className="li-s">{t('ci.effect_fee', { amount: money(amount) })}</p>
          ) : null}
          {payLine ? <p className="li-s">{payLine}</p> : null}
          {act.view()}
        </ConfirmDialog>
      ) : null}
      {fixGuests ? (
        <FixGuestsDialog
          reservation={r}
          onClose={() => setFixGuests(false)}
          onSaved={() => {
            setFixGuests(false);
            reloadAll();
          }}
        />
      ) : null}
    </>
  );
}

/** DOM G-6: fix the real guest count without leaving check-in (`updateReservation`, If-Match). */
function FixGuestsDialog({
  reservation: r,
  onClose,
  onSaved,
}: {
  reservation: Reservation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const act = useSubmit({ bound: ['partyChangeSource', 'otaModificationRef'] });
  const [occ, setOcc] = useState<Occupancy>({
    adults: r.adults,
    children6to11: r.children6to11 ?? 0,
    childrenUnder6: r.childrenUnder6 ?? 0,
  });
  // 0.3.6 add. 4: an OTA booking before check-in says where the change comes from.
  const askSource = needsPartySource(r);
  const source = usePartySource();
  const save = async () => {
    const out = await act.submit(() =>
      api.updateReservation(
        { propertyId, reservationId: r.id },
        askSource ? { ...occ, ...source.body() } : occ,
        r.version,
      ),
    );
    if (out) onSaved();
  };
  return (
    <Modal
      open
      size="sm"
      title={t('checkin.fix_guest_count')}
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
      {act.view()}
      <OccupancyField value={occ} onChange={setOcc} enforceMax={false} />
      {askSource ? <PartySourceField reservation={r} state={source} fields={act.fields} /> : null}
    </Modal>
  );
}
