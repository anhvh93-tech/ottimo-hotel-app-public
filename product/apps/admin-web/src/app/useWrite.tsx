import { isApiError, newIdempotencyKey } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button } from '@ottimo/ui';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { retryDelaySeconds } from './problem';

/**
 * DS 6.21 (ĐK-S2-3, QC-S2-02) – `409 CONCURRENT_UPDATE` and `503 SERVICE_UNAVAILABLE` mean the server
 * wrote nothing. Keep the form, show a yellow notice, wait `Retry-After` (missing → 2 s, max 10 s) and
 * resend with the SAME Idempotency-Key (and the caller's same If-Match): CONCURRENT_UPDATE up to 2
 * times, SERVICE_UNAVAILABLE once. Any other answer is handled by the caller as usual.
 */
export const AUTO_RETRIES: Record<string, number> = {
  CONCURRENT_UPDATE: 2,
  SERVICE_UNAVAILABLE: 1,
};

export const isRetryable = (e: unknown): boolean =>
  isApiError(e) && AUTO_RETRIES[e.code] !== undefined;

export interface RetryState {
  code: 'CONCURRENT_UPDATE' | 'SERVICE_UNAVAILABLE';
  phase: 'waiting' | 'trying' | 'gave_up';
  /** Seconds left before the automatic resend (phase `waiting`). */
  left: number;
  requestId?: string;
}

/**
 * One write action (one button) with its own Idempotency-Key: kept across automatic and manual
 * retries of the same input, renewed after a success (ADR-009). `run` resolves with the result or
 * rejects with the final error; while the countdown runs the button stays busy with the countdown
 * label. Leaving the screen / closing the dialog cancels the timer.
 */
export function useWrite() {
  const { t } = useI18n();
  const key = useRef(newIdempotencyKey());
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState<RetryState | null>(null);
  const wake = useRef<((go: boolean) => void) | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      wake.current?.(false);
    };
  }, []);

  const sleep = (seconds: number, code: RetryState['code']) =>
    new Promise<boolean>((resolve) => {
      let left = seconds;
      setRetry({ code, phase: 'waiting', left });
      const tick = setInterval(() => {
        left -= 1;
        if (left > 0) setRetry((r) => (r ? { ...r, left } : r));
      }, 1000);
      const timer = setTimeout(() => done(true), seconds * 1000);
      function done(go: boolean) {
        clearInterval(tick);
        clearTimeout(timer);
        wake.current = null;
        resolve(go && alive.current);
      }
      wake.current = done;
    });

  const run = useCallback(async <T,>(fn: (idempotencyKey: string) => Promise<T>): Promise<T> => {
    setBusy(true);
    setRetry(null);
    let attempts = 0;
    try {
      for (;;) {
        try {
          const out = await fn(key.current);
          key.current = newIdempotencyKey();
          if (alive.current) setRetry(null);
          return out;
        } catch (e) {
          if (!isApiError(e) || AUTO_RETRIES[e.code] === undefined) {
            if (alive.current) setRetry(null);
            throw e;
          }
          const code = e.code as RetryState['code'];
          if (attempts >= (AUTO_RETRIES[code] ?? 0)) {
            if (alive.current)
              setRetry({ code, phase: 'gave_up', left: 0, requestId: e.requestId });
            throw e;
          }
          attempts += 1;
          const go = await sleep(retryDelaySeconds(e), code);
          if (!go) {
            if (alive.current)
              setRetry({ code, phase: 'gave_up', left: 0, requestId: e.requestId });
            throw e;
          }
          setRetry({ code, phase: 'trying', left: 0 });
        }
      }
    } finally {
      if (alive.current) setBusy(false);
    }
    // `key` is a ref; `sleep` only touches refs/setters.
  }, []);

  /**
   * A new Idempotency-Key for the next call: the failure answered means the next send is a NEW command (other
   * input), not a retry – e.g. 409 MINIBAR_PERIOD_CHANGED, the desk counts again (ARC 16.16 (ab)).
   */
  const renewKey = useCallback(() => {
    key.current = newIdempotencyKey();
  }, []);

  /** "Thử lại ngay" – skip the rest of the countdown. */
  const now = useCallback(() => wake.current?.(true), []);
  /** "Dừng thử lại" – stop; the form stays, the main button becomes "Thử lại". */
  const stop = useCallback(() => wake.current?.(false), []);

  const busyLabel =
    retry?.phase === 'waiting'
      ? t('retry.countdown', { seconds: retry.left })
      : retry?.phase === 'trying'
        ? t('retry.trying')
        : undefined;

  /** Main button text: the action, or "Thử lại" after the automatic retries gave up. */
  const label = (text: string) => (retry?.phase === 'gave_up' ? t('common.retry') : text);

  const notice: ReactNode = retry ? <RetryNotice retry={retry} onNow={now} onStop={stop} /> : null;

  return { run, busy, busyLabel, label, retry, notice, now, stop, renewKey };
}

/** Yellow in-place notice (role=status – read once, the per-second countdown lives on the button). */
export function RetryNotice({
  retry,
  onNow,
  onStop,
}: {
  retry: RetryState;
  onNow: () => void;
  onStop: () => void;
}) {
  const { t } = useI18n();
  const text =
    retry.phase === 'gave_up'
      ? retry.code === 'CONCURRENT_UPDATE'
        ? t('retry.gave_up_concurrent')
        : retry.requestId
          ? t('retry.gave_up_unavailable', { request_id: retry.requestId })
          : t(`error.${retry.code}`)
      : t(`error.${retry.code}`);
  return (
    <Alert
      tone="warn"
      role="status"
      actions={
        retry.phase === 'waiting' ? (
          <>
            <Button size="sm" onClick={onNow}>
              {t('retry.now')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onStop}>
              {t('retry.stop')}
            </Button>
          </>
        ) : undefined
      }
    >
      {text}
    </Alert>
  );
}
