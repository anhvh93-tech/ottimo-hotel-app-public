/**
 * HTTP adapter + request logging policy (SR-LOG-01…04, FB-R1-ARC-OPS-04/05, FB-R1-SEC-OPS-02/08).
 * - Request log keeps only method, route TEMPLATE, status and timing: no query string, no headers,
 *   no client address (R2: add ip_hmac with LOG_IP_HMAC_KEY, SR-KEY-08).
 * - Sensitive keys are redacted wherever they appear one level deep (e.g. err.details.token).
 * - trustProxy comes from config (default: trust nobody).
 */
import { createHash, randomUUID } from 'node:crypto';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { TrustProxy } from './config';
import { tryAcquireUploadSlot, uploadRefused } from './modules/files/public/upload-gate';
import { problem } from './shared/problem';
import { SECRET_BODY_FIELDS } from './shared/secret-fields';

const SENSITIVE_KEYS = [
  'password',
  'pin',
  'otp',
  'token',
  'code',
  'secret',
  'docNumber',
  'idNumber',
  'authorization',
  'cookie',
];

export const REDACT_PATHS = [
  // One secret-field list with the idempotency hash (shared/secret-fields.ts).
  ...[...new Set([...SENSITIVE_KEYS, ...SECRET_BODY_FIELDS])].map((k) => `*.${k}`),
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-csrf-token"]',
  'res.headers["set-cookie"]',
];

interface LoggedRequest {
  id: string;
  method: string;
  routeOptions?: { url?: string };
}

interface LoggedReply {
  statusCode: number;
}

export interface HttpOptions {
  logLevel: string;
  trustProxy: TrustProxy;
  /** Test hook: capture log lines. Defaults to stdout. */
  logStream?: NodeJS.WritableStream;
}

/** Largest accepted multipart body: 4 images × 10 MB + the JSON part and headers (addGuestDocument). */
export const MULTIPART_BODY_LIMIT = 42 * 1024 * 1024;

/** Client-supplied X-Request-Id is reused only when it is a plain token (no log injection). */
const REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;

export function requestIdFrom(header: string | string[] | undefined): string {
  const v = Array.isArray(header) ? header[0] : header;
  return v && REQUEST_ID.test(v) ? v : randomUUID();
}

/**
 * The only routes that take multipart/form-data (OpenAPI: addGuestDocument, uploadGuestDocument,
 * uploadAttachment) and the session kind each accepts: a guest cookie never opens a staff route's body and a
 * staff cookie never a guest route's (s3-blocker-reverification).
 */
export const MULTIPART_ROUTES: ReadonlyMap<string, 'staff' | 'guest'> = new Map([
  ['POST /v1/properties/:propertyId/registrations/:registrationId/documents', 'staff'],
  ['POST /v1/guest/online-checkin/documents', 'guest'],
  ['POST /v1/properties/:propertyId/attachments', 'staff'],
]);

const SESSION_COOKIE = {
  staff: /(?:^|;\s*)(?:__Host-)?ottimo_sid=[^;\s]{32,}/,
  guest: /(?:^|;\s*)(?:__Host-)?ottimo_gsid=[^;\s]{32,}/,
} as const;

/**
 * Real-session check for the multipart routes, installed on the Fastify instance by the files module
 * (UploadSessionCheck – it needs the database). Called BEFORE the body is read with the kind of session the
 * route accepts; resolves to a stable key of the live session (per-session slot cap) or null. Absent = fail
 * closed.
 */
export const MULTIPART_SESSION_CHECK = Symbol.for('ottimo.multipartSessionCheck');
export type MultipartSessionCheck = (
  headers: Record<string, string | string[] | undefined>,
  kind: 'staff' | 'guest',
) => Promise<string | boolean | null>;

/** Request property holding the upload slot (released on response / abort / failed read). */
const UPLOAD_SLOT = Symbol.for('ottimo.uploadSlot');
/** Set once the body has been read and handed to the handler (s3-round5-verification). */
const UPLOAD_HANDED = Symbol.for('ottimo.uploadHanded');

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

interface Closable {
  once?(event: 'close', fn: () => void): unknown;
  removeListener?(event: 'close', fn: () => void): unknown;
}

interface RawLike extends Closable {
  destroyed?: boolean;
  aborted?: boolean;
  socket?: ({ destroyed?: boolean } & Closable) | null;
}

interface MultipartRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  routeOptions?: { url?: string };
  server?: unknown;
  ip?: string;
  raw?: RawLike;
}

interface BodyStream {
  on(event: 'data', fn: (chunk: Buffer) => void): unknown;
  on(event: 'end' | 'close' | 'aborted', fn: () => void): unknown;
  on(event: 'error', fn: (err: Error) => void): unknown;
  removeListener?(event: string, fn: (...args: never[]) => void): unknown;
  resume(): unknown;
  destroyed?: boolean;
  readableEnded?: boolean;
}

/** Releases the upload slot of a request, if it holds one (idempotent). */
export function releaseUploadSlot(req: unknown): void {
  const holder = req as { [UPLOAD_SLOT]?: () => void };
  holder[UPLOAD_SLOT]?.();
  delete holder[UPLOAD_SLOT];
}

/** The client is gone (socket closed / request destroyed) – nothing may be reserved for it any more. */
function clientGone(req: MultipartRequest, payload: BodyStream): boolean {
  return (
    !!payload.destroyed ||
    !!req.raw?.destroyed ||
    !!req.raw?.aborted ||
    !!req.raw?.socket?.destroyed
  );
}

/**
 * multipart/form-data body parser (ARC FB-R2-ARC-BE-S3-03/18, SEC FB-R2-SEC-BE-47, s3-blocker-verification
 * and re-verification). Nothing of the body is read until, in this order: the route is one of the 3 upload
 * routes (else 415 → 422); a cookie of the session kind the route accepts is present (else 401); the
 * body declares its Content-Length (else 422 – no chunked upload, so the body is held in ONE buffer) within
 * the cap (else 413); that session is REAL (else 401); the client is still connected (else nothing is
 * reserved); an upload slot is free for the process, this session and this IP (else 503 / 429 + Retry-After –
 * the body is dropped). The body is then copied into one pre-allocated buffer; a stream that closes or
 * aborts before its end fails the read and gives the slot back at once. A successful read hands the body to
 * the handler and keeps the slot until the reply is being sent (`onSend`, which runs even when the client has
 * gone – then also onResponse / onRequestAbort); a closed socket never frees it before that, because the
 * handler still holds the body.
 */
export function readMultipart(
  req: MultipartRequest,
  payload: BodyStream,
  done: (err: Error | null, body?: unknown) => void,
): void {
  const kind = MULTIPART_ROUTES.get(`${req.method} ${req.routeOptions?.url ?? ''}`);
  if (!kind) {
    done(httpError(415, 'multipart/form-data is not accepted on this route'));
    return;
  }
  const raw = req.headers.cookie;
  const cookie = Array.isArray(raw) ? raw.join('; ') : (raw ?? '');
  if (!SESSION_COOKIE[kind].test(cookie)) {
    done(httpError(401, 'session required'));
    return;
  }
  const lengthHeader = req.headers['content-length'];
  const declared = Number(Array.isArray(lengthHeader) ? lengthHeader[0] : lengthHeader);
  if (!Number.isInteger(declared) || declared <= 0) {
    done(problem('VALIDATION_FAILED', { detail: 'Content-Length required' }));
    return;
  }
  if (declared > MULTIPART_BODY_LIMIT) {
    done(httpError(413, 'body too large'));
    return;
  }
  // S4-17: one upload body per connection at a time – a pipelined upload is refused before it is read (Node
  // discards its bytes once the refusal is out) and never takes a slot.
  if (pipelinedBehindAnother(req.raw)) {
    done(
      problem('RATE_LIMITED', {
        detail: 'pipelined upload',
        headers: { 'Retry-After': '5' },
      }),
    );
    return;
  }
  const check = (req.server as { [MULTIPART_SESSION_CHECK]?: MultipartSessionCheck } | undefined)?.[
    MULTIPART_SESSION_CHECK
  ];
  if (!check) {
    done(httpError(401, 'session check unavailable'));
    return;
  }
  check(req.headers, kind).then(
    (live) => {
      if (!live) {
        done(httpError(401, 'session required'));
        return;
      }
      // Re-verification: the client may have gone away while the session was being checked.
      if (clientGone(req, payload)) {
        done(httpError(400, 'client went away'));
        return;
      }
      const session =
        typeof live === 'string'
          ? live
          : `${kind}:${createHash('sha256').update(cookie).digest('hex')}`;
      const slot = tryAcquireUploadSlot({ session, ip: req.ip ?? null, kind });
      if (typeof slot !== 'function') {
        done(uploadRefused(slot));
        return;
      }
      const holder = req as { [UPLOAD_SLOT]?: () => void; [UPLOAD_HANDED]?: boolean };
      holder[UPLOAD_SLOT] = slot;
      // Safety net WHILE the body is read: the request goes away → the slot comes back. Attached to the
      // per-request IncomingMessage only – NEVER to the socket: a keep-alive socket (Caddy's pooled upstream)
      // would keep every request and its body alive until it closes (s3-round6-verification: 672 MB held with
      // uploadsInFlight() = 0) – and removed as soon as the read ends. Once the body has been handed to the
      // handler, the handler holds it until it replies, so only onSend / onResponse / onRequestAbort give the
      // slot back (s3-round5-verification).
      const net = () => {
        if (!holder[UPLOAD_HANDED]) releaseUploadSlot(req);
      };
      req.raw?.once?.('close', net);
      readBody(payload, declared, (err, body) => {
        req.raw?.removeListener?.('close', net);
        if (err) releaseUploadSlot(req);
        else holder[UPLOAD_HANDED] = true;
        done(err, body);
      });
    },
    (err: unknown) => done(err instanceof Error ? err : new Error('session check failed')),
  );
}

/**
 * Late stream errors after a settled read (S4-17 / s3-round7 UP-2): module level, so it closes over NOTHING of
 * the read. The read's own `onError` shares its closure context with `finish` and the body buffer – left on
 * the request stream it kept up to 42 MB alive for as long as the request object lived (queued pipelined
 * responses keep it).
 */
function ignoreLateStreamError(): void {}

function readBody(
  payload: BodyStream,
  declared: number,
  done: (err: Error | null, body?: Buffer) => void,
): void {
  // One copy: straight into a buffer of the declared size (Content-Length is required above). `let` so the
  // read drops its own reference once settled – the handler is then the only holder.
  let body: Buffer | null = Buffer.allocUnsafe(declared);
  let size = 0;
  let settled = false;
  const onData = (chunk: Buffer) => {
    if (settled || !body) return;
    if (size + chunk.length > declared) {
      finish(httpError(413, 'body larger than its Content-Length'));
      payload.resume(); // drain without keeping anything
      return;
    }
    chunk.copy(body, size);
    size += chunk.length;
  };
  const onEnd = () => {
    if (size !== declared || !body) finish(httpError(400, 'body shorter than its Content-Length'));
    else finish(null, body);
  };
  const onClose = () => {
    if (!payload.readableEnded) gone();
  };
  const onError = (err: Error) => finish(err);
  const finish = (err: Error | null, out?: Buffer) => {
    if (settled) return;
    settled = true;
    body = null;
    // Nothing of this read stays referenced from the stream (its buffer belongs to the handler now). A late
    // stream error must still never be unhandled: the closure-free module-level listener takes it.
    payload.removeListener?.('data', onData);
    payload.removeListener?.('end', onEnd);
    payload.removeListener?.('aborted', gone);
    payload.removeListener?.('close', onClose);
    payload.removeListener?.('error', onError);
    payload.on('error', ignoreLateStreamError);
    done(err, out);
  };
  const gone = () => finish(httpError(400, 'client went away'));
  if (payload.destroyed) {
    gone();
    return;
  }
  payload.on('data', onData);
  payload.on('end', onEnd);
  // A stream that closes or aborts before 'end' never ends: fail now and give the slot back.
  payload.on('aborted', gone);
  payload.on('close', onClose);
  payload.on('error', onError);
}

/**
 * S4-17 / s3-round7 UP-1: an upload PIPELINED behind an unanswered request on the same connection (HTTP/1.1
 * pipelining – browsers and Caddy never do it; only a client talking to the api port directly). Node queues
 * the reply of such a request until the earlier ones are out, so its request object – and what hangs off it –
 * outlives the upload slot (released when the handler replies): enough pipelined bodies held ~1 GB past the
 * 4 × 42 MB cap. The current reply of the socket (`_httpMessage`) belongs to another request → pipelined.
 */
function pipelinedBehindAnother(raw: RawLike | undefined): boolean {
  const current = (raw?.socket as { _httpMessage?: { req?: unknown } | null } | null | undefined)
    ?._httpMessage;
  return !!current && current.req !== undefined && current.req !== raw;
}

export function createHttpAdapter(opts: HttpOptions): FastifyAdapter {
  const adapter = new FastifyAdapter({
    trustProxy: opts.trustProxy,
    // The whole request (headers + body) must arrive within 60 s – slow uploads cannot hold sockets
    // (ARC FB-R2-ARC-BE-S3-18). Responses (SSE) are not affected.
    requestTimeout: 60_000,
    // Every request has a requestId (coding-standards 12): X-Request-Id echoed back, also in Problem.requestId.
    requestIdHeader: false,
    genReqId: (req: { headers: Record<string, string | string[] | undefined> }) =>
      requestIdFrom(req.headers['x-request-id']),
    logger: {
      level: opts.logLevel,
      ...(opts.logStream ? { stream: opts.logStream } : {}),
      redact: { paths: REDACT_PATHS, censor: '[redacted]' },
      serializers: {
        req: (req: LoggedRequest) => ({
          id: req.id,
          method: req.method,
          // Route template (e.g. /v1/reservations/:id), never the raw URL with its query string.
          route: req.routeOptions?.url ?? '(unmatched)',
        }),
        res: (res: LoggedReply) => ({ statusCode: res.statusCode }),
      },
    },
  });
  // multipart/form-data: see readMultipart – route, real session, size and upload slot are checked before
  // the body is read; the body is kept in memory only (files/public/multipart.ts – no temp file in clear,
  // SR-FILE-04). Caddy caps the same routes (OPS).
  adapter.getInstance().addContentTypeParser('multipart/form-data', readMultipart);
  // The upload slot taken by readMultipart is given back (idempotently) when the reply is being sent – `onSend`
  // runs even when the client closed its socket after sending the WHOLE body (then `req.aborted` is false and
  // Fastify runs neither onRequestAbort nor onResponse – s3-round4-verification) – and on onResponse /
  // onRequestAbort. Before the body is handed to the handler, readMultipart itself gives it back when the
  // body read fails or the client goes away; after that a closed socket does not (the handler still holds
  // the body – s3-round5-verification).
  const fastify = adapter.getInstance();
  fastify.addHook('onResponse', async (req: unknown) => releaseUploadSlot(req));
  fastify.addHook('onRequestAbort', async (req: unknown) => releaseUploadSlot(req));
  fastify.addHook(
    'onSend',
    async (req: { id: string }, reply: { header(n: string, v: string): unknown }) => {
      releaseUploadSlot(req);
      reply.header('x-request-id', req.id);
    },
  );
  return adapter;
}
