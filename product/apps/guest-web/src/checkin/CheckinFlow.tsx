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
import { NOTICE_TEXT_VERSIONS } from '../app/config';
import { shownLocale, useT } from '../app/i18n';
import { telHref } from '../app/link';
import { missingStep, problemText, terminalOf } from '../app/problem';
import { ARRIVAL_NOTE_MAX, cleanNote, containsCardNumber } from '../app/validation';
import { DocumentsStep } from './DocumentsStep';
import { etaSlots, LATE_ARRIVAL_FROM, slotOf, type EtaChoice } from './eta';

type UiStep = Exclude<CheckinStep, undefined>;
const ORDER: UiStep[] = ['notice', 'documents', 'eta', 'consent', 'done'];
const STEP_KEYS = ['guest.oci.step1', 'guest.oci.step2', 'guest.oci.step3'] as const;
const TITLE_KEY: Record<UiStep, string> = {
  notice: 'gw.notice_title',
  documents: 'guest.oci.step1',
  eta: 'guest.oci.step2',
  consent: 'guest.oci.step3',
  done: 'guest.oci.step3',
};

function stepFrom(oci: OnlineCheckin): UiStep {
  if (oci.completedAt || oci.currentStep === 'done') return 'done';
  if (!oci.noticeAccepted) return 'notice';
  return oci.currentStep && ORDER.includes(oci.currentStep) ? oci.currentStep : 'documents';
}

function asStep(s: string | undefined): UiStep | undefined {
  return s && (ORDER as string[]).includes(s) ? (s as UiStep) : undefined;
}

/**
 * ĐK-2 17/10 (fail closed): the page must have the text of the server's current notice version and
 * a retention period to put in the consent sentence. Otherwise it never shows a notice or a consent
 * question it cannot match – the guest is sent to the desk instead.
 */
export function legalTextReady(oci: OnlineCheckin): boolean {
  return (
    typeof oci.currentNoticeVersion === 'string' &&
    NOTICE_TEXT_VERSIONS.includes(oci.currentNoticeVersion) &&
    Number.isInteger(oci.imageRetentionDays) &&
    (oci.imageRetentionDays ?? 0) > 0
  );
}

/** Puts the user's focus on an element that may sit below the fold (locked-button click). */
function focusTarget(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView?.({ block: 'center' });
  el?.focus();
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
      <div className="m-body gw-stack" aria-busy="true">
        <p className="sr-only" role="status">
          {t('common.loading')}
        </p>
        <Skeleton height={28} width="50%" />
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

  if (!legalTextReady(oci)) {
    const tel = telHref(stay.property.phone);
    return (
      <div className="m-body">
        <StateView
          icon="info"
          title={t('gw.oci_unavailable_title')}
          action={
            tel ? (
              <a className="btn" href={tel}>
                {t('guest.contact.call')}
              </a>
            ) : undefined
          }
        >
          {t('gw.oci_unavailable_body')}
        </StateView>
        <p className="li-s">{t('gw.oci_unavailable_late', { time: LATE_ARRIVAL_FROM })}</p>
        <Button block onClick={onExit}>
          {t('gw.back_home')}
        </Button>
      </div>
    );
  }
  const noticeVersion = oci.currentNoticeVersion!;
  const retentionDays = oci.imageRetentionDays!;

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
              {t(STEP_KEYS[i]!)}
            </li>
          );
        })}
      </ol>
    );

  return (
    <>
      <div className="m-top gw-flow-top">
        <button
          type="button"
          className="btn icon-btn gw-back"
          aria-label={t('common.back')}
          onClick={back}
        >
          <Icon name="chevron" />
        </button>
        <h1 ref={headingRef} tabIndex={-1}>
          {t(TITLE_KEY[step])}
        </h1>
      </div>
      {alert ? (
        <div className="gw-pad">
          <Alert tone="bad" role="alert">
            {alert}
          </Alert>
        </div>
      ) : null}
      {step === 'notice' ? (
        <NoticeStep
          version={noticeVersion}
          onRead={async () => {
            try {
              const next = await guestApi.updateCheckin({
                noticeVersion,
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
          retentionDays={retentionDays}
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
                    noticeVersion,
                    // Exactly what the guest read: the days shown in the sentence and the language
                    // of the legal block (RU page → approved EN – decision-log 17/10, R-CON-02).
                    retentionDays,
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

/**
 * Legal text of the check-in. On the RU page it is the approved EN (decision-log 17/10): one block
 * marked `lang="en"` (WCAG 3.1.2) with `gw.legal_en_notice` right above it, so the guest sees why
 * the language changes and screen readers switch voice.
 */
function LegalBlock({ children }: { children: ReactNode }) {
  const { t, locale } = useT();
  const lang = shownLocale(locale, 'gw.notice_body');
  if (lang === locale) return <div className="gw-legal">{children}</div>;
  return (
    <>
      <p className="li-s mb-8">{t('gw.legal_en_notice')}</p>
      <div className="gw-legal" lang={lang}>
        {children}
      </div>
    </>
  );
}

/** wiz-foot with the reason a locked primary button is locked (UXD MOB-S3-05, DS C1). */
function Foot({
  children,
  reason,
  reasonId,
}: {
  children: ReactNode;
  reason?: string;
  reasonId?: string;
}) {
  return (
    <div className="wiz-foot">
      {children}
      {reason ? (
        <p className="li-s m-0 gw-foot-reason" id={reasonId}>
          {reason}
        </p>
      ) : null}
    </div>
  );
}

function NoticeStep({ version, onRead }: { version: string; onRead: () => Promise<void> }) {
  const { t, locale } = useT();
  const [busy, setBusy] = useState(false);
  const readLang = shownLocale(locale, 'gw.notice_read');
  return (
    <>
      <div className="m-body">
        <LegalBlock>
          <p>{t('guest.oci.why')}</p>
          <div className="quote-text">{t('gw.notice_body')}</div>
        </LegalBlock>
        <p className="li-s mt-8">{t('gw.notice_version', { v: version })}</p>
      </div>
      <Foot>
        <span />
        <Button
          variant="pri"
          busy={busy}
          lang={readLang === locale ? undefined : readLang}
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
    if (!picked) return focusTarget(`gw-eta-${slots[0]!.id}`);
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
        <fieldset className="gw-fieldset">
          <legend className="lbl gw-legend">{t('guest.oci.arrival')}</legend>
          {slots.map((s) => (
            <label className="choice" key={s.id}>
              <input
                type="radio"
                name="eta"
                id={`gw-eta-${s.id}`}
                value={s.id}
                checked={choice === s.id}
                onChange={() => setChoice(s.id)}
              />
              <span>{s.late ? t('guest.oci.arrival_late') : s.label}</span>
            </label>
          ))}
        </fieldset>
        <p className="li-s mt-8">{t('gw.late_r2')}</p>
        <div className={`field mt-8${noteError ? ' invalid' : ''}`}>
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
      <Foot reason={choice ? undefined : t('gw.eta_first')} reasonId="gw-eta-reason">
        <Button variant="ghost" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button
          variant="pri"
          busy={busy}
          aria-disabled={!choice || undefined}
          aria-describedby={choice ? undefined : 'gw-eta-reason'}
          onClick={() => void submit()}
        >
          {t('common.next')}
        </Button>
      </Foot>
    </>
  );
}

function ConsentStep({
  oci,
  retentionDays,
  stepper,
  onBack,
  onSubmit,
}: {
  oci: OnlineCheckin;
  retentionDays: number;
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
        <LegalBlock>
          <fieldset className="gw-fieldset">
            <legend className="lbl gw-legend strong">{t('guest.oci.consent_q')}</legend>
            <label className="choice">
              <input
                type="radio"
                name="consent"
                id="gw-consent-granted"
                value="granted"
                checked={decision === 'granted'}
                onChange={() => setDecision('granted')}
              />
              <span>{t('guest.oci.consent', { days: retentionDays })}</span>
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
          <p className="li-s mt-8">{t('guest.oci.consent_optional')}</p>
          <p className="li-s">{t('guest.oci.withdraw_hint')}</p>
        </LegalBlock>
        {/* Not legal text: stays in the page language, outside the EN block (UXD MOB-S3-01 (a)). */}
        <p className="li-s">{t('guest.oci.companions_at_desk')}</p>
      </div>
      <Foot reason={canSubmit ? undefined : t('gw.consent_first')} reasonId="gw-consent-reason">
        <Button variant="ghost" onClick={onBack}>
          {t('common.back')}
        </Button>
        <Button
          variant="pri"
          busy={busy}
          aria-disabled={!canSubmit || undefined}
          aria-describedby={canSubmit ? undefined : 'gw-consent-reason'}
          onClick={async () => {
            if (!canSubmit) return focusTarget('gw-consent-granted');
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
