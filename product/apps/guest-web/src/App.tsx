import { useCallback, useEffect, useRef, useState } from 'react';
import { guestApi, isApiError, type GuestSession, type GuestStay } from './app/api';
import { browserLocale, GuestI18nProvider, isGuestLocale, type GuestLocale } from './app/i18n';
import type { LinkRead } from './app/link';
import { retryMinutes, terminalOf, type Terminal } from './app/problem';
import { GuestShell } from './pages/GuestShell';
import { LoadingPage, TerminalPage, type TerminalKind } from './pages/TerminalPage';

type Boot =
  | { kind: 'loading' }
  | { kind: 'terminal'; which: TerminalKind; minutes?: number; phone?: string }
  | { kind: 'error' }
  | { kind: 'ready'; session?: GuestSession; stay: GuestStay };

const MAX_TIMEOUT = 2_147_000_000;

/**
 * guest-web root. `link` is read (and scrubbed from the address bar) in main.tsx before React renders,
 * so the token exists only in this closure until `openGuestSession` succeeds (SEC ĐK-4).
 */
export function App({ link }: { link: LinkRead }) {
  const token = useRef(link.kind === 'token' ? link.token : undefined);
  const [boot, setBoot] = useState<Boot>(
    link.kind === 'malformed' ? { kind: 'terminal', which: 'link_invalid' } : { kind: 'loading' },
  );
  const [locale, setLocale] = useState<GuestLocale>(() => browserLocale());
  const phoneRef = useRef<string | undefined>(undefined);

  const fail = useCallback((e: unknown) => {
    const which: Terminal | undefined = terminalOf(e);
    if (which && which !== 'checkin_closed') {
      setBoot({ kind: 'terminal', which, phone: phoneRef.current });
    } else if (isApiError(e) && e.code === 'RATE_LIMITED') {
      setBoot({
        kind: 'terminal',
        which: 'rate_limited',
        minutes: retryMinutes(e),
        phone: phoneRef.current,
      });
    } else {
      setBoot({ kind: 'error' });
    }
  }, []);

  const start = useCallback(async () => {
    setBoot({ kind: 'loading' });
    try {
      let session: GuestSession | undefined;
      if (token.current) {
        session = await guestApi.openSession(token.current);
        token.current = undefined; // exchanged – the cookie carries the session from now on
        if (isGuestLocale(session.locale)) setLocale(session.locale);
      }
      const stay = await guestApi.getStay();
      phoneRef.current = stay.property.phone;
      setBoot({ kind: 'ready', session, stay });
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  const started = useRef(false);
  useEffect(() => {
    if (link.kind === 'malformed' || started.current) return;
    started.current = true; // StrictMode runs effects twice – one exchange per token
    void start();
  }, [link.kind, start]);

  // Short session (SR-GST-09/05): when the server-side expiry passes, the page closes itself.
  const expiresAt = boot.kind === 'ready' ? boot.session?.expiresAt : undefined;
  useEffect(() => {
    if (!expiresAt) return;
    const ms = Date.parse(expiresAt) - Date.now();
    if (Number.isNaN(ms)) return;
    const id = setTimeout(
      () => setBoot({ kind: 'terminal', which: 'link_invalid', phone: phoneRef.current }),
      Math.min(Math.max(ms, 0), MAX_TIMEOUT),
    );
    return () => clearTimeout(id);
  }, [expiresAt]);

  const reloadStay = useCallback(async () => {
    try {
      const stay = await guestApi.getStay();
      setBoot((b) => (b.kind === 'ready' ? { ...b, stay } : b));
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  return (
    <GuestI18nProvider locale={locale}>
      {boot.kind === 'loading' ? <LoadingPage /> : null}
      {boot.kind === 'terminal' ? (
        <TerminalPage which={boot.which} minutes={boot.minutes} phone={boot.phone} />
      ) : null}
      {boot.kind === 'error' ? (
        <TerminalPage which="load_error" onRetry={() => void start()} />
      ) : null}
      {boot.kind === 'ready' ? (
        <GuestShell
          session={boot.session}
          stay={boot.stay}
          onLocale={setLocale}
          onFatal={fail}
          onReloadStay={reloadStay}
        />
      ) : null}
    </GuestI18nProvider>
  );
}
