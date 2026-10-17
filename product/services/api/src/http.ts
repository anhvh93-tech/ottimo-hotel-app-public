/**
 * HTTP adapter + request logging policy (SR-LOG-01…04, FB-R1-ARC-OPS-04/05, FB-R1-SEC-OPS-02/08).
 * - Request log keeps only method, route TEMPLATE, status and timing: no query string, no headers,
 *   no client address (R2: add ip_hmac with LOG_IP_HMAC_KEY, SR-KEY-08).
 * - Sensitive keys are redacted wherever they appear one level deep (e.g. err.details.token).
 * - trustProxy comes from config (default: trust nobody).
 */
import { randomUUID } from 'node:crypto';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { TrustProxy } from './config';
import { tryAcquireUploadSlot, uploadGateFull } from './modules/files/public/upload-gate';
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

/** The only routes that take multipart/form-data (OpenAPI: addGuestDocument, uploadGuestDocument, uploadAttachment). */
export const MULTIPART_ROUTES: ReadonlySet<string> = new Set([
  'POST /v1/properties/:propertyId/registrations/:registrationId/documents',
  'POST /v1/guest/online-checkin/documents',
  'POST /v1/properties/:propertyId/attachments',
]);

const SESSION_COOKIE = /(?:^|;\s*)(?:__Host-)?ottimo_(?:sid|gsid)=[^;\s]{32,}/;

/**
 * Real-session check for the multipart routes, installed on the Fastify instance by the files module
 * (UploadSessionCheck – it needs the database). Called BEFORE the body is read; absent = fail closed.
 */
export const MULTIPART_SESSION_CHECK = Symbol.for('ottimo.multipartSessionCheck');
export type MultipartSessionCheck = (
  headers: Record<string, string | string[] | undefined>,
) => Promise<boolean>;

/** Request property holding the upload slot (released on response / abort). */
const UPLOAD_SLOT = Symbol.for('ottimo.uploadSlot');

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

interface MultipartRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  routeOptions?: { url?: string };
  server?: unknown;
}

interface BodyStream {
  on(event: 'data', fn: (chunk: Buffer) => void): unknown;
  on(event: 'end', fn: () => void): unknown;
  on(event: 'error', fn: (err: Error) => void): unknown;
  resume(): unknown;
  destroy?(): unknown;
}

/** Releases the upload slot of a request, if it holds one (idempotent). */
export function releaseUploadSlot(req: unknown): void {
  const holder = req as { [UPLOAD_SLOT]?: () => void };
  holder[UPLOAD_SLOT]?.();
  delete holder[UPLOAD_SLOT];
}

/**
 * multipart/form-data body parser (ARC FB-R2-ARC-BE-S3-03/18, SEC FB-R2-SEC-BE-47, s3-blocker-verification).
 * Nothing of the body is read until, in this order: the route is one of the 3 upload routes (else 415 →
 * 422); a session cookie of the right shape is present (else 401); that session is REAL (staff or guest,
 * not revoked, not expired – else 401); a declared Content-Length is within the cap (else 413); an upload
 * slot is free (else 503 + Retry-After – the body is dropped). Then the body is read from the stream into
 * ONE buffer (pre-allocated from Content-Length; chunked bodies are joined once), capped at
 * MULTIPART_BODY_LIMIT (413). The slot stays taken until the response is sent (hooks below).
 */
export function readMultipart(
  req: MultipartRequest,
  payload: BodyStream,
  done: (err: Error | null, body?: unknown) => void,
): void {
  if (!MULTIPART_ROUTES.has(`${req.method} ${req.routeOptions?.url ?? ''}`)) {
    done(httpError(415, 'multipart/form-data is not accepted on this route'));
    return;
  }
  const cookie = req.headers.cookie;
  if (!SESSION_COOKIE.test(Array.isArray(cookie) ? cookie.join('; ') : (cookie ?? ''))) {
    done(httpError(401, 'session required'));
    return;
  }
  const lengthHeader = req.headers['content-length'];
  const declared = Number(Array.isArray(lengthHeader) ? lengthHeader[0] : lengthHeader);
  if (Number.isFinite(declared) && declared > MULTIPART_BODY_LIMIT) {
    done(httpError(413, 'body too large'));
    return;
  }
  const check = (req.server as { [MULTIPART_SESSION_CHECK]?: MultipartSessionCheck } | undefined)?.[
    MULTIPART_SESSION_CHECK
  ];
  if (!check) {
    done(httpError(401, 'session check unavailable'));
    return;
  }
  check(req.headers).then(
    (ok) => {
      if (!ok) {
        done(httpError(401, 'session required'));
        return;
      }
      const release = tryAcquireUploadSlot();
      if (!release) {
        done(uploadGateFull());
        return;
      }
      (req as { [UPLOAD_SLOT]?: () => void })[UPLOAD_SLOT] = release;
      readBody(
        payload,
        Number.isFinite(declared) && declared > 0 ? declared : null,
        (err, body) => {
          if (err) releaseUploadSlot(req);
          done(err, body);
        },
      );
    },
    (err: unknown) => done(err instanceof Error ? err : new Error('session check failed')),
  );
}

function readBody(
  payload: BodyStream,
  declared: number | null,
  done: (err: Error | null, body?: Buffer) => void,
): void {
  // One copy: into a buffer of the declared size; chunked bodies keep their chunks and are joined once.
  const fixed = declared !== null ? Buffer.allocUnsafe(declared) : null;
  const chunks: Buffer[] = [];
  let size = 0;
  let settled = false;
  const finish = (err: Error | null, body?: Buffer) => {
    if (settled) return;
    settled = true;
    done(err, body);
  };
  payload.on('data', (chunk: Buffer) => {
    if (settled) return;
    if (size + chunk.length > (fixed ? fixed.length : MULTIPART_BODY_LIMIT)) {
      chunks.length = 0;
      finish(httpError(413, 'body too large'));
      payload.resume(); // drain without keeping anything
      return;
    }
    if (fixed) chunk.copy(fixed, size);
    else chunks.push(chunk);
    size += chunk.length;
  });
  payload.on('end', () => {
    if (fixed) finish(null, size === fixed.length ? fixed : fixed.subarray(0, size));
    else finish(null, chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, size));
  });
  payload.on('error', (err) => finish(err));
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
  // The upload slot taken by readMultipart is given back when the response is sent or the client goes away.
  adapter.getInstance().addHook('onResponse', async (req: unknown) => releaseUploadSlot(req));
  adapter.getInstance().addHook('onRequestAbort', async (req: unknown) => releaseUploadSlot(req));
  adapter
    .getInstance()
    .addHook(
      'onSend',
      async (req: { id: string }, reply: { header(n: string, v: string): unknown }) => {
        reply.header('x-request-id', req.id);
      },
    );
  return adapter;
}
