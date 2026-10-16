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

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

interface MultipartRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  routeOptions?: { url?: string };
}

interface BodyStream {
  on(event: 'data', fn: (chunk: Buffer) => void): unknown;
  on(event: 'end', fn: () => void): unknown;
  on(event: 'error', fn: (err: Error) => void): unknown;
  resume(): unknown;
}

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
    size += chunk.length;
    if (size > MULTIPART_BODY_LIMIT) {
      chunks.length = 0;
      finish(httpError(413, 'body too large'));
      payload.resume(); // drain without keeping anything
      return;
    }
    chunks.push(chunk);
  });
  payload.on('end', () => finish(null, Buffer.concat(chunks, size)));
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
  // multipart/form-data (ARC FB-R2-ARC-BE-S3-03/18, SEC FB-R2-SEC-BE-47): accepted ONLY on the three upload
  // routes; anywhere else the body is refused before it is read (Fastify maps it to 415 → problem+json).
  // A request without any session cookie (staff or guest) is refused before the body is read too. The body
  // is read from the stream with its own cap (4 × 10 MB images + JSON) and kept in memory only
  // (files/public/multipart.ts – no temp file in clear, SR-FILE-04). Caddy caps the same routes (OPS).
  adapter.getInstance().addContentTypeParser('multipart/form-data', readMultipart);
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
