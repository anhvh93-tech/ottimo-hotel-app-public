/**
 * Process-wide cap of uploads in flight (ARC FB-R2-ARC-BE-S3-18, SEC FB-R2-SEC-BE-47; s3-blocker-verification).
 * The slot is taken by the multipart body parser (src/http.ts `readMultipart`) BEFORE a single byte of the
 * body is read – after the route check and the real session check – and held until the response is sent
 * or the request aborted (Fastify `onResponse` / `onRequestAbort`). Beyond MAX_UPLOADS_IN_FLIGHT the request
 * is refused at once with 503 + Retry-After and its body is never buffered: at most
 * MAX_UPLOADS_IN_FLIGHT × MULTIPART_BODY_LIMIT bytes of upload bodies live in memory. One api replica on
 * a small VPS (hosting plan): a technical constant, not a business parameter.
 */
import { problem } from '../../../shared/problem';

export const MAX_UPLOADS_IN_FLIGHT = 4;

let inFlight = 0;

/** Takes a slot; null when the gate is full. The returned release is idempotent. */
export function tryAcquireUploadSlot(): (() => void) | null {
  if (inFlight >= MAX_UPLOADS_IN_FLIGHT) return null;
  inFlight++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    inFlight--;
  };
}

/** 503 SERVICE_UNAVAILABLE (Retry-After: 5) – the same retry contract as other 503s (send again, same key). */
export function uploadGateFull(): Error {
  return problem('SERVICE_UNAVAILABLE', {
    detail: 'too many uploads in progress',
    headers: { 'Retry-After': '5' },
  });
}

/** Runs `fn` inside its own slot (non-HTTP callers and tests); 503 when the gate is full. */
export async function withUploadGate<T>(fn: () => Promise<T>): Promise<T> {
  const release = tryAcquireUploadSlot();
  if (!release) throw uploadGateFull();
  try {
    return await fn();
  } finally {
    release();
  }
}

/** Test support: current number of uploads holding a slot. */
export function uploadsInFlight(): number {
  return inFlight;
}
