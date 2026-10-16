/**
 * Process-wide cap of uploads being processed (ARC FB-R2-ARC-BE-S3-18, SEC FB-R2-SEC-BE-47): beyond
 * MAX_IN_FLIGHT the request is refused at once with 503 + Retry-After – never queued with its body in
 * memory. One api replica on a small VPS (hosting plan): a technical constant, not a business parameter.
 */
import { problem } from '../../../shared/problem';

export const MAX_UPLOADS_IN_FLIGHT = 4;

let inFlight = 0;

/** Runs `fn` inside the gate; 503 SERVICE_UNAVAILABLE (Retry-After: 5) when the gate is full. */
export async function withUploadGate<T>(fn: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_UPLOADS_IN_FLIGHT) {
    throw problem('SERVICE_UNAVAILABLE', {
      detail: 'too many uploads in progress',
      headers: { 'Retry-After': '5' },
    });
  }
  inFlight++;
  try {
    return await fn();
  } finally {
    inFlight--;
  }
}

/** Test support: current number of uploads inside the gate. */
export function uploadsInFlight(): number {
  return inFlight;
}
