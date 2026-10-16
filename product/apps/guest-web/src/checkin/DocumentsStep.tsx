import { Alert, Button, Icon, Seg } from '@ottimo/ui';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  isApiError,
  newIdempotencyKey,
  uploadGuestDocument,
  type DocType,
  type OnlineCheckin,
} from '../app/api';
import { ImageRejected, MAX_IMAGES_PER_PERSON, normalizeImage } from '../app/image';
import { useT, type GuestLocale } from '../app/i18n';
import { problemText, terminalOf } from '../app/problem';

/** Document types a guest can photograph (children need no photo – the desk types the number). */
export type GuestDocType = Extract<DocType, 'cccd' | 'passport'>;

type Phase = 'idle' | 'preparing' | 'uploading' | 'weak' | 'error';
interface Slot {
  /** Explicit choice for this guest; undefined = not chosen (falls back to the previous guest's). */
  docType?: GuestDocType;
  phase: Phase;
  pct: number;
  error?: string;
}

/** Photos waiting for a retry. Memory only, dropped on success / leaving the step (SEC ĐK-3). */
interface Pending {
  docType: GuestDocType;
  images: Blob[];
  key: string;
}

const AUTO_RETRY_MS = 3000;
const IDLE: Slot = { phase: 'idle', pct: 0 };

/** UXD 8.3 (4): Vietnamese page → CCCD first; any other language → passport first. */
export function docTypeOrder(locale: GuestLocale): GuestDocType[] {
  return locale === 'vi' ? ['cccd', 'passport'] : ['passport', 'cccd'];
}

export interface DocumentsStepProps {
  oci: OnlineCheckin;
  online: boolean;
  stepper: ReactNode;
  /** People the guest chose to "add at reception" (`deferredPeople`, sent with completeOnlineCheckin). */
  deferred: ReadonlySet<number>;
  onDeferredChange: (next: Set<number>) => void;
  onUploaded: (oci: OnlineCheckin) => void;
  onProblem: (e: unknown) => void;
  onNext: () => Promise<void>;
}

/** H18 18.2 step 1: one slot per guest; sent photos are never shown again – only "n/m" (ĐK-3). */
export function DocumentsStep({
  oci,
  online,
  stepper,
  deferred,
  onDeferredChange,
  onUploaded,
  onProblem,
  onNext,
}: DocumentsStepProps) {
  const { t, locale } = useT();
  const required = Math.max(0, oci.requiredPeople);
  const people = Array.from({ length: required }, (_, i) => i + 1);
  const uploaded = new Set(oci.uploadedPeople ?? []);
  const uploadedCount = people.filter((p) => uploaded.has(p)).length;
  const deferredCount = people.filter((p) => !uploaded.has(p) && deferred.has(p)).length;
  const allDone = people.every((p) => uploaded.has(p) || deferred.has(p));

  const [slots, setSlots] = useState<Record<number, Slot>>({});
  const [reopen, setReopen] = useState<Set<number>>(new Set());
  const [busyNext, setBusyNext] = useState(false);
  const pending = useRef(new Map<number, Pending>());
  const retried = useRef(new Set<number>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const inputRef = useRef<HTMLInputElement>(null);
  const target = useRef<number>(0);

  useEffect(() => {
    const pend = pending.current;
    const tms = timers.current;
    return () => {
      pend.clear(); // leaving the step drops every photo still in memory
      tms.forEach(clearTimeout);
    };
  }, []);

  const slot = (p: number): Slot => slots[p] ?? IDLE;
  const patch = (p: number, s: Partial<Slot>) =>
    setSlots((all) => ({ ...all, [p]: { ...(all[p] ?? IDLE), ...s } }));

  /** Guest 1: no default. Guest 2…n: the previous guest's type, still changeable (UXD 8.3 (4)). */
  const typeOf = (p: number): GuestDocType | undefined => {
    for (let i = p; i >= 1; i--) {
      const chosen = slots[i]?.docType;
      if (chosen) return chosen;
    }
    return undefined;
  };

  const setDeferred = (p: number, on: boolean) => {
    const next = new Set(deferred);
    if (on) next.add(p);
    else next.delete(p);
    onDeferredChange(next);
  };

  const send = useCallback(
    async (person: number) => {
      const job = pending.current.get(person);
      if (!job) return;
      patch(person, { phase: 'uploading', pct: 0, error: undefined });
      try {
        const next = await uploadGuestDocument({
          personIndex: person,
          docType: job.docType,
          images: job.images,
          idempotencyKey: job.key,
          onProgress: (pct) => patch(person, { pct }),
        });
        pending.current.delete(person);
        retried.current.delete(person);
        patch(person, { phase: 'idle', pct: 0 });
        setReopen((s) => {
          const n = new Set(s);
          n.delete(person);
          return n;
        });
        onUploaded(next);
      } catch (e) {
        if (terminalOf(e)) {
          pending.current.clear();
          onProblem(e);
          return;
        }
        if (isApiError(e) && e.isNetwork) {
          // Weak network: keep the photos in memory and retry once by itself, then offer a button.
          patch(person, { phase: 'weak' });
          if (!retried.current.has(person)) {
            retried.current.add(person);
            const id = setTimeout(() => {
              timers.current.delete(id);
              void send(person);
            }, AUTO_RETRY_MS);
            timers.current.add(id);
          }
          return;
        }
        pending.current.delete(person); // rejected photos are useless – drop them
        patch(person, { phase: 'error', error: problemText(t, e) });
      }
    },
    [onProblem, onUploaded, t],
  );

  const pick = (person: number) => {
    target.current = person;
    inputRef.current?.click();
  };

  const onFiles = async (list: FileList | null) => {
    const person = target.current;
    const files = list ? Array.from(list).slice(0, MAX_IMAGES_PER_PERSON) : [];
    if (inputRef.current) inputRef.current.value = ''; // release the FileList
    const docType = typeOf(person);
    if (!person || !files.length || !docType) return;
    patch(person, { docType, phase: 'preparing', error: undefined });
    try {
      const images: Blob[] = [];
      for (const f of files) images.push(await normalizeImage(f)); // one at a time: phone memory
      pending.current.set(person, { docType, images, key: newIdempotencyKey() });
      retried.current.delete(person);
      if (deferred.has(person)) setDeferred(person, false); // the server drops it anyway once a photo exists
      await send(person);
    } catch (e) {
      const code = e instanceof ImageRejected ? e.code : 'FILE_TYPE';
      patch(person, { phase: 'error', error: t(`field.${code}`) });
    }
  };

  const summary =
    deferredCount > 0
      ? t('gw.docs_have_deferred', { n: uploadedCount, m: required, k: deferredCount })
      : uploadedCount === 0
        ? t('gw.docs_none', { m: required })
        : t('gw.docs_have', { n: uploadedCount, m: required });

  return (
    <>
      <div className="m-body">
        {stepper}
        {!online ? (
          <Alert tone="warn" icon="offline" role="status">
            {t('gw.offline_upload')}
          </Alert>
        ) : null}
        <p>{summary}</p>
        {people.map((p) => {
          const s = slot(p);
          const isUploaded = uploaded.has(p) && !reopen.has(p);
          const isDeferred = !uploaded.has(p) && deferred.has(p);
          const busy = s.phase === 'preparing' || s.phase === 'uploading';
          const type = typeOf(p);
          const ids = {
            name: `gw-p${p}-name`,
            hint: `gw-p${p}-hint`,
            type: `gw-p${p}-type`,
            first: `gw-p${p}-first`,
            defer: `gw-p${p}-defer`,
          };

          if (isUploaded || isDeferred) {
            return (
              <div
                key={p}
                className={`upload-slot${isUploaded ? ' done' : ''}`}
                style={{ marginTop: 8 }}
              >
                <span className="ill">
                  <Icon name={isUploaded ? 'check' : 'clock'} />
                </span>
                <div className="grow">
                  <b id={ids.name}>{t('guest.oci.person_n', { n: p })}</b>
                  <div className="li-s">{isUploaded ? t('gw.sent_hidden') : t('gw.deferred')}</div>
                </div>
                {isUploaded ? (
                  <Button
                    size="sm"
                    onClick={() => setReopen((r) => new Set(r).add(p))}
                    aria-describedby={ids.name}
                  >
                    {t('gw.resend')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setDeferred(p, false)}
                    aria-describedby={ids.name}
                  >
                    {t('gw.defer_undo')}
                  </Button>
                )}
              </div>
            );
          }

          return (
            <div
              key={p}
              className="upload-slot gw-slot"
              style={{ marginTop: 8 }}
              aria-busy={busy || undefined}
            >
              <span className="ill">
                <Icon name="camera" />
              </span>
              <div className="grow">
                <b id={ids.name}>{t('guest.oci.person_n', { n: p })}</b>
                <div className="li-s" id={ids.hint}>
                  {type ? t(`gw.doc_hint.${type}`) : t('guest.oci.add_doc')}
                </div>
                {busy ? (
                  <div className="li-s" role="status" aria-live="polite">
                    {t('guest.oci.uploading', {
                      n: pending.current.get(p)?.images.length ?? 1,
                      total: pending.current.get(p)?.images.length ?? 1,
                      pct: s.pct,
                    })}
                  </div>
                ) : null}
                {s.phase === 'weak' ? (
                  <div className="li-s" role="status">
                    {t('guest.oci.upload_weak')}
                  </div>
                ) : null}
                {s.phase === 'error' && s.error ? (
                  <div className="err" role="alert" style={{ color: 'var(--bad)' }}>
                    {s.error}
                  </div>
                ) : null}
              </div>
              {s.phase === 'weak' ? (
                <Button
                  size="sm"
                  variant="pri"
                  disabled={!online}
                  onClick={() => void send(p)}
                  aria-describedby={ids.name}
                >
                  {t('guest.oci.upload_retry')}
                </Button>
              ) : (
                <>
                  {/* DOM order = task order: document type → (add at reception | take photo). */}
                  <div className="gw-docs-row">
                    <span className="li-s" id={ids.type}>
                      {t('gw.doc_type')}
                    </span>
                    <Seg<GuestDocType | ''>
                      labelledBy={`${ids.name} ${ids.type}`}
                      value={type ?? ''}
                      disabled={busy}
                      onChange={(v) => v && patch(p, { docType: v, error: undefined })}
                      options={docTypeOrder(locale).map((d) => ({
                        value: d,
                        label: t(`gw.doc.${d}`),
                      }))}
                    />
                  </div>
                  <div className="gw-docs-row">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setDeferred(p, true)}
                      aria-describedby={`${ids.name} ${ids.defer}`}
                    >
                      {t('gw.defer_at_desk')}
                    </Button>
                    <Button
                      size="sm"
                      variant="pri"
                      icon="camera"
                      busy={busy}
                      disabled={!online}
                      // Focusable while locked so the reason below is announced (UXD 8.3 (3)).
                      aria-disabled={!type || undefined}
                      onClick={() => type && pick(p)}
                      aria-describedby={`${ids.name} ${type ? ids.hint : ids.first}`}
                    >
                      {s.phase === 'error' ? t('gw.take_photo_again') : t('gw.take_photo')}
                    </Button>
                  </div>
                  {!type ? (
                    <p className="li-s" id={ids.first} style={{ flexBasis: '100%', margin: 0 }}>
                      {t('gw.doc_type_first')}
                    </p>
                  ) : null}
                  <p className="li-s" id={ids.defer} style={{ flexBasis: '100%', margin: 0 }}>
                    {t('gw.defer_help')}
                  </p>
                </>
              )}
            </div>
          );
        })}
        <input
          ref={inputRef}
          className="gw-file"
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          aria-hidden="true"
          data-testid="doc-input"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <p className="li-s" style={{ marginTop: 10 }}>
          {t('gw.photo_tips')}
        </p>
      </div>
      <div className="wiz-foot">
        <span className="li-s">{t('gw.saved_progress')}</span>
        <Button
          variant="pri"
          busy={busyNext}
          disabled={!allDone}
          onClick={async () => {
            setBusyNext(true);
            await onNext();
            setBusyNext(false);
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </>
  );
}
