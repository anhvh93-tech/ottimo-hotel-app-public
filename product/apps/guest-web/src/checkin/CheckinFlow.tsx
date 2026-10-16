import { Alert, Button, Icon, Skeleton, StateView } from '@ottimo/ui';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  guestApi,
  isApiError,
  newIdempotencyKey,
  type CheckinStep,
  type GuestStay,
  type OnlineCheckin,
} from '../app/api';
import { NOTICE_VERSION, RETENTION_DAYS_DEFAULT } from '../app/config';
import { shownLocale, useT } from '../app/i18n';
import { missingStep, problemText, terminalOf } from '../app/problem';
import { ARRIVAL_NOTE_MAX, cleanNote, containsCardNumber } from '../app/validation';
import { DocumentsStep } from './DocumentsStep';
import { etaSlots, slotOf, type EtaChoice } from './eta';

type UiStep = Exclude<CheckinStep, undefined>;
const ORDER: UiStep[] = ['notice', 'documents', 'eta', 'consent', 'done'];

function stepFrom(oci: OnlineCheckin): UiStep {
  if (oci.completedAt || oci.currentStep === 'done') return 'done';
  if (!oci.noticeAccepted) return 'notice';
  return oci.currentStep && ORDER.includes(oci.currentStep) ? oci.currentStep : 'documents';
}

function asStep(s: string | undefined): UiStep | undefined {
  return s && (ORDER as string[]).includes(s) ? (s as UiStep) : undefined;
}

export interface CheckinFlowProps {
  stay: GuestStay;
  online: boolean;
  onExit: () => void;
  /** Every fresh OnlineCheckin (level-1 keys only) – the stay page shows the "done" card from it. */
  onCheckinChange?: (oci: OnlineCheckin) => void;
  onFatal: (e: unknown) => void;
}

/** H18 18.2–18.5: notice → (1) documents → (2) arrival time → (3) consent → done (US-107). */
export function CheckinFlow({ stay, online, onExit, onFatal, onCheckinChange }: CheckinFlowProps) {
  const { t, locale, shortDate } = useT();
  const [oci, setOciState] = useState<OnlineCheckin>();
  // "Add at reception" choices: the contract only takes them with completeOnlineCheckin, so they live
  // in page memory until then (indices only – no personal data).
  const [deferred, setDeferred] = useState<Set<number>>(new Set());
  const changeRef = useRef(onCheckinChange);
  changeRef.current = onCheckinChange;
  const setOci = useCallback((next: OnlineCheckin) => {
    setOciState(next);
    changeRef.current?.(next);
  }, []);
  const [step, setStep] = useState<UiStep>('notice');
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'closed'>('loading');
  const [alert, setAlert] = useState<string>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  /** Problems shared by every call: page-level ones leave the flow, the rest become an alert. */
  const handle = useCallback(
    (e: unknown) => {
      const term = terminalOf(e);
      if (term === 'checkin_closed') return setState('closed');
      if (term) return onFatal(e);
      const missing = asStep(missingStep(e));
      if (missing) {
        setStep(missing);
        setAlert(undefined);
        return;
      }
      if (isApiError(e) && e.code === 'RATE_LIMITED') return onFatal(e);
      setAlert(problemText(t, e));
    },
    [onFatal, t],
  );

  const load = useCallback(async () => {
    setState('loading');
    try {
      const next = await guestApi.getCheckin();
      setOci(next);
      setDeferred(new Set(next.deferredPeople ?? []));
      setStep(stepFrom(next));
      setState('ready');
    } catch (e) {
      if (terminalOf(e)) handle(e);
      else setState('error');
    }
  }, [handle, setOci]);

  useEffect(() => {
    if (!stay.onlineCheckinAvailable)
      setState('closed'); // 0.3.3: show 18.5 at once, no error round trip
    else void load();
  }, [load, stay.onlineCheckinAvailable]);

  // a11y: each step change moves focus to the step title.
  useEffect(() => {
    if (state === 'ready') headingRef.current?.focus();
  }, [step, state]);

  const go = (next: UiStep) => {
    setAlert(undefined);
    setStep(next);
  };

  const back = () => {
    const i = ORDER.indexOf(step);
    if (step === 'notice' || step === 'documents' || step === 'done' || i <= 0) onExit();
    else go(ORDER[i - 1]!);
  };

  const titleKey: Record<UiStep, string> = {
    notice: 'gw.notice_title',
    documents: 'guest.oci.step1',
    eta: 'guest.oci.step2',
    consent: 'guest.oci.step3',
    done: 'guest.oci.step3',
  };

  if (state === 'closed') {
    return (
      <div className="m-body">
        <StateView icon="check" title={t('guest.oci.closed_desk')}>
          {t('gw.closed_body')}
        </StateView>
        <Button block onClick={onExit}>
          {t('gw.back_home')}
        </Button>
      </div>
    );
  }
  if (state === 'loading' || !oci) {
    return state === 'error' ? (
      <div className="m-body">
        <StateView
          kind="error"
          title={t('guest.error_title')}
          action={<Button onClick={() => void load()}>{t('common.retry')}</Button>}
        >
          {t('guest.error_body')}
        </StateView>
      </div>
    ) : (
      <div className="m-body" aria-busy="true">
        <p className="sr-only" role="status">
          {t('common.loading')}
        </p>
        <Skeleton height={28} width="50%" />
        <div style={{ height: 10 }} />
        <Skeleton height={140} />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="m-body">
        <div className="state">
          <div className="ill">
            <Icon name="check" />
          </div>
          <h2 ref={headingRef} tabIndex={-1}>
            {t('guest.oci.done_title', { date: shortDate(stay.arrivalDate) })}
          </h2>
          {/* ĐK-6: R2 wording – the desk hands over the door code, the page never shows it. */}
          <p>{t('guest.oci.done_body', { time: stay.checkinTime })}</p>
          {oci.deferredPeople?.length ? (
            <p className="li-s">
              {t('gw.oci_done_card_deferred', { k: oci.deferredPeople.length })}
            </p>
          ) : null}
          <p className="li-s">{t('gw.done_desk_check')}</p>
          <Button onClick={onExit}>{t('gw.back_home')}</Button>
        </div>
      </div>
    );
  }

  const stepper =
    step === 'notice' ? null : (
      <ol className="progress-steps" aria-label={t('gw.steps_label')}>
        {(['documents', 'eta', 'consent'] as const).map((s, i) => {
          const cur = ORDER.indexOf(step);
          const idx = ORDER.indexOf(s);
          return (
            <li
              key={s}
              className={idx < cur ? 'done' : undefined}
              aria-current={s === step ? 'step' : undefined}
            >
              {t(`guest.oci.step${i + 1}`)}
            </li>
          );
        })}
      </ol>
    );

  return (
    <>
      <div className="m-top" style={{ position: 'static' }}>
        <button type="button" className="btn icon-btn" aria-label={t('common.back')} onClick={back}>
          ‹
        </button>
        <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: '1.25rem', flex: 1 }}>
          {t(titleKey[step])}
        </h1>
      </div>
      {alert ? (
        <div style={{ padding: '12px 16px 0' }}>
          <Alert tone="bad" role="alert">
            {alert}
          </Alert>
        </div>
      ) : null}
      {step === 'notice' ? (
        <NoticeStep
          onRead={async () => {
            try {
              const next = await guestApi.updateCheckin({
                noticeVersion: NOTICE_VERSION,
                currentStep: 'documents',
              });
              setOci(next);
              go('documents');
            } catch (e) {
              handle(e);
            }
          }}
        />
      ) : null}
      {step === 'documents' ? (
        <DocumentsStep
          oci={oci}
          online={online}
          stepper={stepper}
          deferred={deferred}
          onDeferredChange={setDeferred}
          onUploaded={setOci}
          onProblem={handle}
          onNext={async () => {
            try {
              setOci(await guestApi.updateCheckin({ currentStep: 'eta' }));
              go('eta');
            } catch (e) {
              handle(e);
            }
          }}
        />
      ) : null}
      {step === 'eta' ? (
        <EtaStep
          stay={stay}
          oci={oci}
          stepper={stepper}
          onBack={back}
          onSave={async (choice, note) => {
            try {
              const next = await guestApi.updateCheckin({
                etaTime: choice.etaTime,
                lateArrival: choice.late,
                ...(note ? { arrivalNote: note } : {}),
                currentStep: 'consent',
              });
              setOci(next);
              go('consent');
              return true;
            } catch (e) {
              if (isApiError(e) && e.fieldErrors.some((f) => f.code === 'CARD_NUMBER_DETECTED')) {
                return 'card';
              }
              handle(e);
              return false;
            }
          }}
        />
      ) : null}
      {step === 'consent' ? (
        <ConsentStep
          oci={oci}
          stepper={stepper}
          onBack={back}
          onSubmit={async (decision, idempotencyKey) => {
            try {
              if (decision) {
                setOci(
                  await guestApi.recordConsent({
                    purpose: 'P02B_ID_IMAGE_RETENTION',
                    decision,
                    personIndex: 1,
                    noticeVersion: NOTICE_VERSION,
                    // The language the guest actually read (RU falls back to EN per key – R-CON-02).
                    locale: shownLocale(locale, 'guest.oci.consent'),
                    channel: 'guest_app',
                  }),
                );
              }
              const uploaded = new Set(oci.uploadedPeople ?? []);
              const deferredPeople = [...deferred]
                .filter((p) => p >= 1 && p <= oci.requiredPeople && !uploaded.has(p))
                .sort((a, b) => a - b);
              const done = await guestApi.completeCheckin(
                deferredPeople.length ? { deferredPeople } : {},
                idempotencyKey,
              );
              setOci(done);
              go('done');
            } catch (e) {
              handle(e);
            }
          }}
        />
      ) : null}
    </>
  );
}

function Foot({ children }: { children: ReactNode }) {
  return <div className="wiz-foot">{children}</div>;
}

function NoticeStep({ onRead }: { onRead: () => Promise<void> }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="m-body">
        <p>{t('guest.oci.why')}</p>
        <div className="quote-text">{t('gw.notice_body')}</div>
        <p className="li-s" style={{ marginTop: 8 }}>
          {t('gw.notice_version', { v: NOTICE_VERSION })}
        </p>
      </div>
      <Foot>
        <span />
        <Button
          variant="pri"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            await onRead();
            setBusy(false);
          }}
        >
          {t('gw.notice_read')}
        </Button>
      </Foot>
    </>
  );
}

function EtaStep({
  stay,
  oci,
  stepper,
  onBack,
  onSave,
}: {
  stay: GuestStay;
  oci: OnlineCheckin;
  stepper: ReactNode;
  onBack: () => void;
  onSave: (choice: EtaChoice, note: string) => Promise<boolean | 'card'>;
}) {
  const { t } = useT();
  const slots = etaSlots(stay.checkinTime);
  const [choice, setChoice] = useState<string | undefined>(() =>
    slotOf(slots, oci.etaTime, oci.lateArrival),
  );
  // arrivalNote is write-only (ĐK-2): kept in this component only, never read back from the server.
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const picked = slots.find((s) => s.id === choice);
    if (!picked) return;
    const clean = cleanNote(note);
    if (containsCardNumber(clean)) {
      setNoteError(t('error.CARD_NUMBER_DETECTED'));
      return;
    }
    setBusy(true);
    const r = await onSave(picked, clean);
    setBusy(false);
    if (r === 'card') setNoteError(t('error.CARD_NUMBER_DETECTED'));
  };

  return (
    <>
      <div className="m-body">
        {stepper}
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="lbl" style={{ fontWeight: 500, marginBottom: 6 }}>
            {t('guest.oci.arrival')}
          </legend>
          {slots.map((s) => (
            <label className="choice" key={s.id}>
              <input
                type="radio"
                name="eta"
                value={s.id}
                checked={choice === s.id}
                onChange={() => setChoice(s.id)}
              />
              <span>{s.late ? t('guest.oci.arrival_late') : s.label}</span>
            </label>
          ))}
        </fieldset>
        <p className="li-s" style={{ marginTop: 8 }}>
          {t('gw.late_r2')}
        </p>
        <div className={`field${noteError ? ' invalid' : ''}`} style={{ marginTop: 8 }}>
          <label htmlFor="gw-note">{t('guest.oci.note')}</label>
          <textarea
            className="input"
            id="gw-note"
            maxLength={ARRIVAL_NOTE_MAX}
            value={note}
            aria-invalid={noteError ? true : undefined}
            aria-describedby={noteError ? 'gw-note-err' : undefined}
            autoComplete="off"
            onChange={(e) => {
              setNote(e.target.value);
              setNoteError(undefined);
            }}
          />
          {noteError ? (
            <div className="err" id="gw-note-err" role="alert">
              {noteError}
            </div>
          ) : null}
        </div>
      </div>
      <Foot>
        <Button variant="ghost" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button variant="pri" busy={busy} disabled={!choice} onClick={() => void submit()}>
          {t('common.next')}
        </Button>
      </Foot>
    </>
  );
}

function ConsentStep({
  oci,
  stepper,
  onBack,
  onSubmit,
}: {
  oci: OnlineCheckin;
  stepper: ReactNode;
  onBack: () => void;
  onSubmit: (decision: 'granted' | 'refused' | undefined, key: string) => Promise<void>;
}) {
  const { t } = useT();
  // R-CON-01: nothing pre-selected, two equal choices.
  const [decision, setDecision] = useState<'granted' | 'refused'>();
  const [busy, setBusy] = useState(false);
  const key = useRef<string>(undefined);
  const canSubmit = Boolean(decision) || Boolean(oci.consentRecorded);

  return (
    <>
      <div className="m-body">
        {stepper}
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="lbl" style={{ fontWeight: 600, marginBottom: 6 }}>
            {t('guest.oci.consent_q')}
          </legend>
          <label className="choice">
            <input
              type="radio"
              name="consent"
              value="granted"
              checked={decision === 'granted'}
              onChange={() => setDecision('granted')}
            />
            <span>{t('guest.oci.consent', { days: RETENTION_DAYS_DEFAULT })}</span>
          </label>
          <label className="choice">
            <input
              type="radio"
              name="consent"
              value="refused"
              checked={decision === 'refused'}
              onChange={() => setDecision('refused')}
            />
            <span>{t('guest.oci.consent_no')}</span>
          </label>
        </fieldset>
        <p className="li-s" style={{ marginTop: 8 }}>
          {t('guest.oci.consent_optional')}
        </p>
        <p className="li-s">{t('guest.oci.companions_at_desk')}</p>
        <p className="li-s">{t('guest.oci.withdraw_hint')}</p>
      </div>
      <Foot>
        <Button variant="ghost" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button
          variant="pri"
          busy={busy}
          disabled={!canSubmit}
          onClick={async () => {
            key.current ??= newIdempotencyKey(); // one key per click, reused on retry
            setBusy(true);
            await onSubmit(decision, key.current);
            setBusy(false);
          }}
        >
          {t('guest.oci.submit')}
        </Button>
      </Foot>
    </>
  );
}
