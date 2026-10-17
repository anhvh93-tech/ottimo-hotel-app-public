import { ApiError, networkError, parseRetryAfter, syntheticProblem } from './errors';
import type { Problem } from './types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  /** Path params replacing `{name}` in the template. */
  path?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Version for optimistic locking – sent as `If-Match: "<version>"`. */
  ifMatch?: number | string;
  /** ADR-009: one key per user click; a network retry of the same click reuses it. */
  idempotencyKey?: string;
  /** Do not report this failure to the global `onError` (e.g. 401 of a wrong *current* password). */
  local?: boolean;
  /** multipart/form-data body (uploads – the browser sets the boundary header). Wins over `body`. */
  form?: FormData;
  /** Read the 2xx body as a Blob (images – never JSON-parsed, never cached by the client). */
  blob?: boolean;
}

export interface ApiResult<T> {
  data: T;
  status: number;
  etag?: string;
}

export interface ApiClientOptions {
  /** Origin used to resolve `/v1/...`. Defaults to `window.location.origin`. */
  baseUrl?: string;
  /** CSRF token from `Me.csrfToken`, kept in memory only (never in storage). */
  getCsrfToken?: () => string | undefined;
  /** Called for every ApiError before it is thrown (global 401/403 handling). */
  onError?: (error: ApiError) => void;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  request<T>(method: HttpMethod, template: string, options?: RequestOptions): Promise<ApiResult<T>>;
}

function buildUrl(base: string, template: string, options: RequestOptions): string {
  const pathname = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = options.path?.[name];
    if (value === undefined) throw new Error(`Missing path param ${name} for ${template}`);
    return encodeURIComponent(value);
  });
  const url = new URL(pathname, base);
  for (const [k, v] of Object.entries(options.query ?? {})) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function readProblem(res: Response): Promise<Problem> {
  const requestId = res.headers.get('x-request-id') ?? undefined;
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('json')) {
    try {
      const body = (await res.json()) as Partial<Problem>;
      if (body && typeof body.code === 'string') {
        return { ...body, requestId: body.requestId ?? requestId } as Problem;
      }
    } catch {
      /* fall through to synthetic problem */
    }
  }
  return syntheticProblem(res.status, requestId);
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const doFetch = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const base = () => options.baseUrl ?? globalThis.location?.origin ?? 'http://localhost';

  return {
    async request<T>(method: HttpMethod, template: string, req: RequestOptions = {}) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (req.body !== undefined && !req.form) headers['Content-Type'] = 'application/json';
      if (method !== 'GET') {
        const csrf = options.getCsrfToken?.();
        if (csrf) headers['X-CSRF-Token'] = csrf;
      }
      if (req.ifMatch !== undefined) headers['If-Match'] = `"${req.ifMatch}"`;
      if (req.idempotencyKey) headers['Idempotency-Key'] = req.idempotencyKey;

      let res: Response;
      try {
        res = await doFetch(buildUrl(base(), template, req), {
          method,
          headers,
          credentials: 'same-origin',
          body: req.form ?? (req.body === undefined ? undefined : JSON.stringify(req.body)),
        });
      } catch {
        const err = networkError();
        if (!req.local) options.onError?.(err);
        throw err;
      }

      if (!res.ok) {
        const err = new ApiError(
          res.status,
          await readProblem(res),
          parseRetryAfter(res.headers.get('retry-after')),
        );
        if (!req.local) options.onError?.(err);
        throw err;
      }

      const etag = res.headers.get('etag') ?? undefined;
      if (res.status === 204) return { data: undefined as T, status: res.status, etag };
      if (req.blob) return { data: (await res.blob()) as T, status: res.status, etag };
      const text = await res.text();
      return { data: (text ? JSON.parse(text) : undefined) as T, status: res.status, etag };
    },
  };
}

export function newIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

/** The API refuses any other shape with 422 (`auth.guard.ts` UUID check on `Idempotency-Key`). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isIdempotencyKey(value: string): boolean {
  return UUID_RE.test(value);
}

/** 32-bit FNV-1a over UTF-16 code units, then the murmur3 finaliser (better spread of short inputs). */
function hash32(text: string, seed: number): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Key for a sub-request of ONE user action – e.g. the photo upload that runs before the write it belongs
 * to (refund proof, penalty evidence). UXR #2: a suffix (`${key}-a`) is not a UUID and every upload got
 * 422. The derived key is a UUID (RFC 9562 version 8, "custom") and deterministic: the automatic resend
 * of the same action (DS 6.21, same `key`) derives the same upload key, so the upload is replayed instead
 * of stored twice; another `purpose` (or another action) gives another key.
 */
export function deriveIdempotencyKey(key: string, purpose: string): string {
  const input = `${key}\u0000${purpose}`;
  const hex = [0x9e3779b9, 0x85ebca77, 0xc2b2ae3d, 0x27d4eb2f]
    .map((seed) => hash32(input, seed).toString(16).padStart(8, '0'))
    .join('');
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `8${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}
