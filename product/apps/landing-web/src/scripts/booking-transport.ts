// How a booking request leaves the page. Two transports:
//  - preview: never sends anything (review build) – "not-sent";
//  - api: the contract of OpenAPI 0.3.7 add-on 2 (ADR-014 4.3–4.4) – getPublicFormToken when the guest first touches
//    the form, wait `minDelaySeconds` by the browser clock (SEC ARC-23), POST JSON with an Idempotency-Key; on
//    FORM_TOKEN_INVALID fetch a new token, wait again and resend ONCE. Same origin by default (the landing proxies
//    `/v1/public/…` – CSP connect-src 'self'); the live build may give another API origin (lib/booking-request.ts).
// Answers that mean "the form is not taking requests right now" – 404 from either endpoint (property not active or
// `public_booking_requests_enabled = false`) and 422 PUBLIC_FORM_NOT_READY – become `not-ready`: the page points the
// guest to Zalo or a call, never pretends the request was sent (US-155 AC5).
import type { BookingAccepted, BookingDraft, PublicFormToken } from './booking-logic';

/** Field error of a 422 VALIDATION_FAILED: `field` + `code` only – the server never echoes the value (ARC-21). */
export interface FieldProblem {
  field: string;
  code: string;
}

export type Outcome =
  | { kind: 'accepted'; refCode: string; promise: BookingAccepted['promise'] }
  | { kind: 'not-sent' }
  | { kind: 'not-ready' }
  | { kind: 'invalid'; errors: FieldProblem[] }
  /** NOTICE_VERSION_INVALID: the page is older than the published privacy notice – reload, then send again. */
  | { kind: 'reload' }
  | { kind: 'busy' }
  | { kind: 'rate' }
  | { kind: 'network' };

export interface Transport {
  /**
   * Fetch a form token early (first focus on the form) – the api transport only. Resolves to `not-ready` when the
   * property is not taking requests, so the page can say so before the guest types everything; else null.
   */
  prepare(): Promise<Outcome | null>;
  send(draft: BookingDraft): Promise<Outcome>;
}

export const previewTransport: Transport = {
  async prepare() {
    return null;
  },
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

/** Problem body of a 4xx/5xx – `code` and `errors[]` only; anything unreadable → empty. */
async function problemOf(res: Response): Promise<{ code?: string; errors: FieldProblem[] }> {
  try {
    const body = (await res.json()) as { code?: unknown; errors?: unknown };
    const errors = Array.isArray(body.errors)
      ? body.errors
          .filter(
            (e): e is FieldProblem =>
              !!e && typeof e.field === 'string' && typeof e.code === 'string',
          )
          .map((e) => ({ field: e.field.replace(/^body\./, ''), code: e.code }))
      : [];
    return { code: typeof body.code === 'string' ? body.code : undefined, errors };
  } catch {
    return { errors: [] };
  }
}

/**
 * @param base `{apiOrigin}/v1/public/properties/{propertySlug}` – `apiOrigin` empty = same origin (root-relative).
 */
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
      // 404 = property not taking web requests right now (switch off at run time) → point to Zalo
      if (res.status === 404) return { ok: false, outcome: { kind: 'not-ready' } };
      if (res.status === 429) return { ok: false, outcome: { kind: 'rate' } };
      if (res.status === 503) return { ok: false, outcome: { kind: 'busy' } };
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

  return {
    async prepare() {
      pending ??= fetchToken();
      const t = await pending;
      // A refused token is not kept: the next send asks again (the switch may be on by then).
      if (!t.ok && pending) pending = null;
      return !t.ok && t.outcome.kind === 'not-ready' ? t.outcome : null;
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
        if (res.status === 404) return { kind: 'not-ready' };
        if (res.status === 503) return { kind: 'busy' };
        if (res.status === 429) return { kind: 'rate' };
        if (res.status === 422) {
          const p = await problemOf(res);
          if (p.code === 'FORM_TOKEN_INVALID' && attempt === 0) continue;
          if (p.code === 'PUBLIC_FORM_NOT_READY') return { kind: 'not-ready' };
          if (p.errors.some((e) => e.code === 'NOTICE_VERSION_INVALID')) return { kind: 'reload' };
          if (p.code === 'VALIDATION_FAILED' && p.errors.length)
            return { kind: 'invalid', errors: p.errors };
        }
        return { kind: 'network' };
      }
      return { kind: 'network' };
    },
  };
}
