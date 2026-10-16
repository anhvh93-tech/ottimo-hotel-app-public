import { useCallback, useEffect, useRef, useState } from 'react';

export type ResourceState<T> =
  | { status: 'loading'; data?: T; error?: undefined }
  | { status: 'ready'; data: T; error?: undefined; loadedAt: Date }
  | { status: 'error'; data?: T; error: unknown };

/** Minimal fetch-on-mount hook with reload; stale responses (deps changed) are ignored. */
export function useResource<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const seq = useRef(0);

  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ status: 'loading', data: s.data }));
    load().then(
      (data) => id === seq.current && setState({ status: 'ready', data, loadedAt: new Date() }),
      (error: unknown) =>
        id === seq.current && setState((s) => ({ status: 'error', error, data: s.data })),
    );
    // `deps` is the caller's dependency list for `load`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const mutate = useCallback((update: (data: T) => T) => {
    setState((s) => (s.status === 'ready' ? { ...s, data: update(s.data) } : s));
  }, []);

  return { state, reload: run, mutate };
}
