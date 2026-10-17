// How a booking request leaves the page. Two transports:
//  - preview: never sends anything (review build while the feature is off) – "not-sent";
//  - api: the contract of OpenAPI 0.3.7 add-on 2 (ADR-014 4.3–4.4) – getPublicFormToken when the guest first touches
//    the form, wait `minDelaySeconds` by the browser clock (SEC ARC-23), POST JSON with an Idempotency-Key; on
//    FORM_TOKEN_INVALID fetch a new token, wait again and resend ONCE. Same origin only (CSP connect-src 'self').
//    Not wired in any build yet: the endpoints are BE-D's (lib/booking-request.ts).
import type { BookingAccepted, BookingDraft, PublicFormToken } from './booking-logic';

export type Outcome =
  | { kind: 'accepted'; refCode: string; promise: BookingAccepted['promise'] }
  | { kind: 'not-sent' }
  | { kind: 'not-ready' }
  | { kind: 'busy' }
  | { kind: 'rate' }
  | { kind: 'network' };

export interface Transport {
  /** Fetch a form token early (first focus on the form) – the api transport only. */
  prepare(): void;
  send(draft: BookingDraft): Promise<Outcome>;
}

export const previewTransport: Transport = {
  prepare() {},
  async send() {
    return { kind: 'not-sent' };
  },
};

export interface TransportDeps {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  /** Browser clock in ms (minDelaySeconds is measured by it, never against the server clock). */
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  uuid: () => string;
}

interface HeldToken {
  token: PublicFormToken;
  receivedAt: number;
}

type TokenResult = { ok: true; held: HeldToken } | { ok: false; outcome: Outcome };

/** @param base `/v1/public/properties/{propertySlug}` – same origin, root-relative. */
export function apiTransport(base: string, deps: TransportDeps): Transport {
  let pending: Promise<TokenResult> | null = null;

  const fetchToken = async (): Promise<TokenResult> => {
    try {
      const res = await deps.fetch(`${base}/form-token`, {
        credentials: 'omit',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 200) {
        const token = (await res.json()) as PublicFormToken;
        return { ok: true, held: { token, receivedAt: deps.now() } };
      }
      // 404 = property not taking web requests right now (feature off at run time) → point to Zalo
      if (res.status === 404) return { ok: false, outcome: { kind: 'not-ready' } };
      if (res.status === 429) return { ok: false, outcome: { kind: 'rate' } };
      return { ok: false, outcome: { kind: 'network' } };
    } catch {
      return { ok: false, outcome: { kind: 'network' } };
    }
  };

  const takeToken = (): Promise<TokenResult> => {
    const p = pending ?? fetchToken();
    pending = null; // a token is used once
    return p;
  };

  const waitMinDelay = async (held: HeldToken) => {
    const wait = held.token.minDelaySeconds * 1000 - (deps.now() - held.receivedAt);
    if (wait > 0) await deps.sleep(wait);
  };

  const post = async (draft: BookingDraft, held: HeldToken): Promise<Response | null> => {
    try {
      return await deps.fetch(`${base}/booking-requests`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Idempotency-Key': deps.uuid(),
        },
        body: JSON.stringify({ ...draft, formToken: held.token.token }),
      });
    } catch {
      return null;
    }
  };

  const code = async (res: Response): Promise<string | undefined> => {
    try {
      return ((await res.json()) as { code?: string }).code;
    } catch {
      return undefined;
    }
  };

  return {
    prepare() {
      pending ??= fetchToken();
    },
    async send(draft) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const t = await takeToken();
        if (!t.ok) return t.outcome;
        await waitMinDelay(t.held);
        const res = await post(draft, t.held);
        if (!res) return { kind: 'network' };
        if (res.status === 202) {
          const body = (await res.json()) as BookingAccepted;
          return { kind: 'accepted', refCode: body.refCode, promise: body.promise };
        }
        if (res.status === 503) return { kind: 'busy' };
        if (res.status === 429) return { kind: 'rate' };
        if (res.status === 422 && attempt === 0 && (await code(res)) === 'FORM_TOKEN_INVALID')
          continue;
        return { kind: 'network' };
      }
      return { kind: 'network' };
    },
  };
}
