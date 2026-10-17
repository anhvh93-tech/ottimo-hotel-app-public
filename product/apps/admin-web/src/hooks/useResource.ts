import { isApiError } from '@ottimo/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { retryDelaySeconds } from '../app/problem';

export type ResourceState<T> =
  | { status: 'loading'; data?: T; error?: undefined }
  | { status: 'ready'; data: T; error?: undefined; loadedAt: Date }
  | {
      status: 'error';
      data?: T;
      error: unknown;
      /** DS 6.21: a GET answered 503 SERVICE_UNAVAILABLE reloads itself once after this many seconds. */
      autoRetrySeconds?: number;
    };

/** Minimal fetch-on-mount hook with reload; stale responses (deps changed) are ignored. */
export function useResource<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const seq = useRef(0);
  const autoRetried = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = useCallback(() => {
    const id = ++seq.current;
    clearTimeout(timer.current);
    setState((s) => ({ status: 'loading', data: s.data }));
    load().then(
      (data) => {
        if (id !== seq.current) return;
        autoRetried.current = false;
        setState({ status: 'ready', data, loadedAt: new Date() });
      },
      (error: unknown) => {
        if (id !== seq.current) return;
        let autoRetrySeconds: number | undefined;
        if (isApiError(error) && error.code === 'SERVICE_UNAVAILABLE' && !autoRetried.current) {
          autoRetried.current = true;
          autoRetrySeconds = retryDelaySeconds(error);
          timer.current = setTimeout(() => runRef.current(), autoRetrySeconds * 1000);
        }
        setState((s) => ({ status: 'error', error, data: s.data, autoRetrySeconds }));
      },
    );
    // `deps` is the caller's dependency list for `load`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    autoRetried.current = false;
    run();
    return () => clearTimeout(timer.current);
  }, [run]);

  const mutate = useCallback((update: (data: T) => T) => {
    setState((s) => (s.status === 'ready' ? { ...s, data: update(s.data) } : s));
  }, []);

  // BUG-R2-141: `reload` always reads with the LATEST inputs. A handler made in an earlier render (e.g. "save the
  // minibar, then reload the summary" while the departure time was still empty) used to call that render's `run`,
  // whose request – sent last – overwrote the answer for the current inputs. Stable identity, too.
  const reload = useCallback(() => runRef.current(), []);

  return { state, reload, mutate };
}
