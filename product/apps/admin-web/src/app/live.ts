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
 * - Sprint 4 (H03/H24 – EP01 §4): `useLiveEvents` tells the screen WHICH events arrived in a burst so it
 *   re-reads only the blocks they touch; poll ticks, focus and a reconnect after a drop pass `ALL`.
 */
type Listener = (kind: string) => void;
const listeners = new Set<Listener>();

export function notifyChanged(kind = 'reservation.changed') {
  listeners.forEach((l) => l(kind));
}

const RELOAD_EVENTS = ['reservation.changed', 'room.status_changed', 'attention.changed'];
export const POLL_MS = 30_000;
/** Pseudo event kind: poll tick, tab focus, reconnect after a drop – re-read everything. */
export const ALL_EVENTS = '*';

export interface LiveState {
  /** SSE dropped and has not reconnected yet (data may be old). */
  stale: boolean;
}

export interface LiveOptions {
  /** SSE event types to listen to (default: reservation, room status, attention). */
  events?: readonly string[];
  /** Burst window – several events in it give one call (rack 150 ms; dashboard 1 s – EP01 §4). */
  debounceMs?: number;
  /** false = no stream, no poll, no listener (e.g. a menu number the person's role does not show). Default true. */
  enabled?: boolean;
}

export function useLiveEvents(
  propertyId: string,
  onEvents: (kinds: ReadonlySet<string>) => void,
  opts: LiveOptions = {},
): LiveState {
  const [stale, setStale] = useState(false);
  const cbRef = useRef(onEvents);
  cbRef.current = onEvents;
  const events = (opts.events ?? RELOAD_EVENTS).join(' ');
  const debounceMs = opts.debounceMs ?? 150;
  const enabled = opts.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = new Set<string>();
    // Several events in a burst (e.g. move = 2 reservations) → one call with every kind seen.
    const soon = (kind: string) => {
      pending.add(kind);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const kinds = pending;
        pending = new Set();
        cbRef.current(kinds);
      }, debounceMs);
    };
    const local: Listener = (kind) => soon(kind);
    listeners.add(local);
    const onFocus = () => document.visibilityState !== 'hidden' && soon(ALL_EVENTS);
    window.addEventListener('focus', onFocus);

    let poll: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (!poll) poll = setInterval(() => cbRef.current(new Set([ALL_EVENTS])), POLL_MS);
    };
    const stopPolling = () => {
      clearInterval(poll);
      poll = undefined;
    };

    let source: EventSource | undefined;
    const sseAvailable = typeof EventSource !== 'undefined' && apiMode() === 'server';
    if (sseAvailable) {
      source = new EventSource(eventStreamPath(propertyId), { withCredentials: true });
      let opened = false;
      let dropped = false;
      source.onopen = () => {
        // Reconnected after a drop: events were missed – read everything again (EP01 §4).
        if (dropped) soon(ALL_EVENTS);
        opened = true;
        dropped = false;
        setStale(false);
        stopPolling();
      };
      source.onerror = () => {
        // BUG-R2-029: a non-200 answer (404 while `streamEvents` is not deployed) closes the stream for
        // good (readyState CLOSED) – go quietly to polling, no "Đang kết nối lại…". Only a stream that
        // was open and dropped (EventSource reconnecting) is shown as stale.
        if (source?.readyState === EventSource.CLOSED) source.close();
        // Never connected (endpoint missing, first attempt failing): poll quietly.
        const isStale = opened && source?.readyState !== EventSource.CLOSED;
        if (isStale) dropped = true;
        setStale(isStale);
        startPolling();
      };
      for (const ev of events.split(' ')) source.addEventListener(ev, () => soon(ev));
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
  }, [propertyId, events, debounceMs, enabled]);

  return { stale };
}

export function useLiveReload(propertyId: string, reload: () => void): LiveState {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  return useLiveEvents(propertyId, () => reloadRef.current());
}
