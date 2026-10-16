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

export function createHttpAdapter(opts: HttpOptions): FastifyAdapter {
  const adapter = new FastifyAdapter({
    trustProxy: opts.trustProxy,
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
  // multipart/form-data (document images, attachments – SR-FILE-02): the raw body as a Buffer, parsed in
  // memory by files/public/multipart.ts (no temp file in clear – SR-FILE-04). Larger than 4 × 10 MB images
  // + JSON → 413 PAYLOAD_TOO_LARGE before any handler (Caddy caps the body at 25 MB in front – SEC C3).
  adapter
    .getInstance()
    .addContentTypeParser(
      'multipart/form-data',
      { parseAs: 'buffer', bodyLimit: MULTIPART_BODY_LIMIT },
      (_req: unknown, body: Buffer | string, done: (err: Error | null, body?: unknown) => void) =>
        done(null, body),
    );
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
