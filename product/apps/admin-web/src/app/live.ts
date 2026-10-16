import { eventStreamPath } from '@ottimo/api-client';
import { useEffect, useRef, useState } from 'react';
import { apiMode } from './config';

/**
 * Keeps screens such as the rack current (architecture §12, OpenAPI `streamEvents`).
 *
 * - Same tab: every successful write calls `notifyChanged()` → listeners reload at once.
 * - Other users: SSE `GET /v1/properties/{id}/events` (light events, the client re-reads the API).
 *   When EventSource is unavailable (tests, old browser), in mock mode, or the stream drops, the hook
 *   falls back to polling and to reloading when the tab regains focus. While the stream is down the
 *   screen shows `fo.rack.stale` with the time of the last good load.
 */
type Listener = (kind: string) => void;
const listeners = new Set<Listener>();

export function notifyChanged(kind = 'reservation.changed') {
  listeners.forEach((l) => l(kind));
}

const RELOAD_EVENTS = ['reservation.changed', 'room.status_changed', 'attention.changed'];
export const POLL_MS = 30_000;

export interface LiveState {
  /** SSE dropped and has not reconnected yet (data may be old). */
  stale: boolean;
}

export function useLiveReload(propertyId: string, reload: () => void): LiveState {
  const [stale, setStale] = useState(false);
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Several events in a burst (e.g. move = 2 reservations) → one reload.
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(() => reloadRef.current(), 150);
    };
    const local: Listener = () => soon();
    listeners.add(local);
    const onFocus = () => document.visibilityState !== 'hidden' && soon();
    window.addEventListener('focus', onFocus);

    let poll: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (!poll) poll = setInterval(() => reloadRef.current(), POLL_MS);
    };
    const stopPolling = () => {
      clearInterval(poll);
      poll = undefined;
    };

    let source: EventSource | undefined;
    const sseAvailable = typeof EventSource !== 'undefined' && apiMode() === 'server';
    if (sseAvailable) {
      source = new EventSource(eventStreamPath(propertyId), { withCredentials: true });
      source.onopen = () => {
        setStale(false);
        stopPolling();
      };
      source.onerror = () => {
        // EventSource retries by itself; meanwhile poll so the screen does not go silently old.
        setStale(true);
        startPolling();
      };
      for (const ev of RELOAD_EVENTS) source.addEventListener(ev, soon);
    } else {
      startPolling();
    }

    return () => {
      clearTimeout(timer);
      stopPolling();
      listeners.delete(local);
      window.removeEventListener('focus', onFocus);
      source?.close();
    };
  }, [propertyId]);

  return { stale };
}
