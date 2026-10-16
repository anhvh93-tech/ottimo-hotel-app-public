import {
  isApiError,
  type CheckInBody,
  type CheckInCondition,
  type FocRequestInput,
  type Registration,
  type Reservation,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  ConfirmDialog,
  Field,
  Modal,
  Stepper,
  Switch,
} from '@ottimo/ui';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../app/api';
import { useCatalog } from '../../app/catalog';
import { timeHHmm } from '../../app/dates';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { DeviceBlocked, ErrorBlock, LoadingBlock } from '../../components/states';
import { OccupancyField, type Occupancy } from '../../components/OccupancyField';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { DocsList, VerifyList, reviewReady } from '../registration/DocsPanel';
import { useSubmit } from './common';
import { PaymentPanel } from './PaymentPanel';

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
const FOC_REASONS: Array<{ value: FocRequestInput['reasonCode']; key: string }> = [
  { value: 'regular_vip', key: 'foc.r_regular' },
  { value: 'room_ready_no_impact', key: 'foc.r_room_ready' },
  { value: 'service_recovery', key: 'foc.r_recovery' },
  { value: 'long_stay_guest', key: 'foc.r_long' },
  { value: 'other', key: 'foc.r_other' },
];

/**
 * H13 Nhận phòng (S06, US-025/026, B9): conditions from `previewCheckIn` on top (each unmet one says
 * what to do), then 4 steps – documents (C3), checks, registration, hand-over. C3 steps only on a
 * device the owner granted (SR-DEV); elsewhere the conditions and folio stay visible. The button opens
 * when "house rules sent" is ticked (and "told the guest" when a surcharge is shown) – the door/card
 * box is optional (PO 16/10, US-025 AC7). Conflicts/busy follow DS 6.21.
 */
export function CheckInPage({ reservationId }: { reservationId: string }) {
  const { t, vnd, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles, deviceTrusted } = useSession();
  const { online, since } = useOnline();
  const navigate = useNavigate();
  const toast = useToast();
  const ids = useId();
  const lead = roles.some((r) => LEAD_PLUS.includes(r));
  const catalog = useCatalog(propertyId);
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
  const [verifyTried, setVerifyTried] = useState(false);
  const act = useSubmit();

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
  const sur = p?.earlyCheckinSurcharge;
  const amount = sur?.amountVnd ?? 0;
  const priorNight = !!sur?.addsPreviousNight;
  const roomCond = cond('room_ready');
  const docCond = cond('document_check_block');
  const ooo = roomCond && !roomCond.met && roomCond.detail === 'OOO';
  const statusText = p?.roomStatus ? t(`status.room.${p.roomStatus}`) : '';
  const foreign =
    registration?.kind === 'foreigner_temp_residence' || registration?.kind === 'mixed';
  const deadline = p?.registrationDeadlinePreview;

  // Unmet conditions that block the button (a reason typed for the room / document exception counts).
  const blocking = conds.filter((c) => {
    if (c.met) return false;
    if (c.code === 'room_ready' && !ooo && roomReason.trim().length >= 3) return false;
    if (c.code === 'document_check_block' && lead && docReason.trim().length >= 3) return false;
    return true;
  });
  const needTold = early && amount > 0;
  const canSubmit =
    online && houseRules && (!needTold || toldGuest) && blocking.length === 0 && !waitingLead;

  const submit = async () => {
    const body: CheckInBody = {
      checkinTime: early && time ? time : (p?.standardCheckinTime ?? undefined),
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
      roomNotReadyOverride:
        roomCond && !roomCond.met && roomReason.trim() ? { reason: roomReason.trim() } : undefined,
      documentBlockOverride:
        docCond && !docCond.met && lead && docReason.trim()
          ? { reason: docReason.trim() }
          : undefined,
      cardsIssued: cards,
      houseRulesSent: true,
      doorAccessHandedOver: door,
      addPriorNight: priorNight || undefined,
      priorNightRateVnd: priorNight ? amount : undefined,
    };
    const out = await act.submit((idem) => api.checkIn(R, body, r.version, idem));
    setConfirm(false);
    if (!out) {
      // SURCHARGE_CHANGED / CHECKIN_CONDITIONS_NOT_MET: re-read the preview, ask to confirm again.
      preview.reload();
      folio.reload();
      setToldGuest(false);
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
        return c.met ? null : t('ci.cond_balance', { amount: vnd(balance) });
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
        return c.met && registration && !foreign ? t('ci.cond_na_citizen') : null;
      default:
        return null;
    }
  };

  const steps = (
    <ol className="progress-steps" aria-label={t('checkin.cond.title')}>
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

  const conditionsCard = (
    <section className="card" aria-labelledby={`${ids}-cond`}>
      <h2 className="label-h" id={`${ids}-cond`}>
        {t('checkin.cond.title')}
      </h2>
      {!p ? (
        preview.state.status === 'error' ? (
          <Alert tone="bad">{act.text(preview.state.error)}</Alert>
        ) : (
          <LoadingBlock rows={2} />
        )
      ) : (
        <ul className="conds">
          {conds.map((c) => (
            <li key={c.code} className={c.met ? 'met' : 'unmet'}>
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
                      <Field label={t('ci.reason')} required>
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
              <Chip tone={c.met ? 'ok' : 'bad'}>{t(c.met ? 'ci.met' : 'ci.unmet')}</Chip>
            </li>
          ))}
        </ul>
      )}
      {p?.warnings?.map((w) => (
        <Alert
          key={w.code}
          tone="warn"
          icon={w.code === 'extra_guest_kit_not_ready' ? 'sofa' : 'alert'}
        >
          {w.code === 'extra_guest_kit_not_ready'
            ? t('checkin.kit_not_ready', { room })
            : w.code === 'pending_online_checkin'
              ? t('checkin.docs.from_app')
              : (w.detail ?? t('ci.visa_attention'))}
        </Alert>
      ))}
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
    body = registration ? (
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
              {t('ci.time_default', { std: p?.standardCheckinTime ?? '14:00' })}{' '}
              {t('ci.time_default_help')}
            </p>
          ) : (
            <>
              <Field label={t('checkin.time')} help={t('checkin.time_hint')}>
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
              <div aria-live="polite">
                {!time ? null : priorNight ? (
                  <Alert tone="info">
                    {t('checkin.prior_night', {
                      date: p?.priorNight?.date
                        ? p.priorNight.date.split('-').reverse().slice(0, 2).join('/')
                        : '',
                      amount: vnd(amount),
                    })}
                  </Alert>
                ) : amount > 0 ? (
                  <p>
                    <b>{t('sur.early_fee', { amount: vnd(amount), pct: sur?.tierPct ?? 0 })}</b>
                  </p>
                ) : (
                  <p>{t('sur.early_zero', { std: p?.standardCheckinTime ?? '14:00' })}</p>
                )}
              </div>
              {amount > 0 ? (
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
          <p className="kv-big num">
            {t('drawer.folio.balance')}: {vnd(balance)} {t('common.vnd_unit')}
          </p>
          {balance > 0 && online ? (
            <PaymentPanel
              reservation={r}
              balanceVnd={balance}
              onPaid={() => {
                folio.reload();
                preview.reload();
                res.reload();
              }}
            />
          ) : (
            <Chip tone="ok" icon="check">
              {t('drawer.folio.settled')}
            </Chip>
          )}
          <p className="li-s">{t('ci.recon_ok')}</p>
        </section>

        <section className="card stack" aria-labelledby={`${ids}-door`}>
          <h2 className="label-h" id={`${ids}-door`}>
            {t('ci.door_title')}
          </h2>
          <ol className="list-plain li-s">
            <li>{t('ci.door_step1', { room })}</li>
            <li>{t('ci.door_step2')}</li>
            <li>{t('ci.door_step3')}</li>
          </ol>
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
          <span className="li-s" id={`${ids}-cards-h`}>
            {t('handover.cards_help')}
          </span>
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
            {needTold && toldGuest ? <li>{t('ci.effect_fee', { amount: vnd(amount) })}</li> : null}
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
  const nextKey = ['ci.go_verify', 'ci.go_register', 'ci.submit'][step];

  return (
    <>
      <Topbar title={t('checkin.title', { room, guest })} sub={r.code} />
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
              <Alert tone="info" icon="hourglass">
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
              {!houseRules ? (
                <span className="li-s" id={`${ids}-why`}>
                  {t('ci.submit_needs_rules')}
                </span>
              ) : null}
              <Button
                variant="pri"
                aria-disabled={!canSubmit || undefined}
                aria-describedby={!houseRules ? `${ids}-why` : undefined}
                busy={act.busy}
                busyLabel={act.busyLabel}
                onClick={() => canSubmit && setConfirm(true)}
              >
                {act.label(
                  priorNight && needTold
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
          title={t('ci.confirm_title', { room, guest })}
          body={t('ci.effect_status', { room })}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('ci.submit', { room })}
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setConfirm(false)}
          onConfirm={() => void submit()}
        >
          {deadline ? (
            <p className="li-s">{t('ci.effect_deadline', { deadline: dateTime(deadline) })}</p>
          ) : null}
          {needTold && toldGuest ? (
            <p className="li-s">{t('ci.effect_fee', { amount: vnd(amount) })}</p>
          ) : null}
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
  const act = useSubmit();
  const [occ, setOcc] = useState<Occupancy>({
    adults: r.adults,
    children6to11: r.children6to11 ?? 0,
    childrenUnder6: r.childrenUnder6 ?? 0,
  });
  const save = async () => {
    const out = await act.submit(() =>
      api.updateReservation({ propertyId, reservationId: r.id }, occ, r.version),
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
    </Modal>
  );
}
