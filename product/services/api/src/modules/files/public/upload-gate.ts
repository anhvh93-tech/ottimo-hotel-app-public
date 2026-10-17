/**
 * Upload slots (ARC FB-R2-ARC-BE-S3-18, SEC FB-R2-SEC-BE-47; s3-blocker-verification + re-verification).
 * The slot is taken by the multipart body parser (src/http.ts `readMultipart`) BEFORE a single byte of the
 * body is read – after the route check and the real session check, and only while the client is still
 * connected. It is given back (idempotently): while the body is read, when the read fails or the client goes
 * away; once the body has been handed to the handler, ONLY when the reply starts being sent (Fastify `onSend` –
 * also when the client closed the socket after its whole body) or on onResponse / onRequestAbort – never on a
 * mere socket close, since the handler still holds the body (s3-round4/round5-verification). So the bodies
 * held by handlers are bounded by the slots. Caps:
 * - MAX_UPLOADS_IN_FLIGHT for the whole process → 503 + Retry-After (the body is never buffered), of which
 *   STAFF_RESERVED_SLOTS only staff routes may use (guest uploads can never take the desk's last slot);
 * - MAX_UPLOADS_PER_SESSION and MAX_UPLOADS_PER_IP → 429 + Retry-After, so one slow session (or one network)
 *   can never hold every slot. The IP cap counts staff and guest uploads separately (the desk and the guests
 *   may share one NAT address).
 * At most MAX_UPLOADS_IN_FLIGHT × MULTIPART_BODY_LIMIT bytes of upload bodies live in memory. One api
 * replica on a small VPS (hosting plan): technical constants, not business parameters.
 */
import { problem } from '../../../shared/problem';

export const MAX_UPLOADS_IN_FLIGHT = 4;
export const MAX_UPLOADS_PER_SESSION = 2;
export const MAX_UPLOADS_PER_IP = 3;
/** Slots of MAX_UPLOADS_IN_FLIGHT kept for staff routes (desk registration documents, attachments). */
export const STAFF_RESERVED_SLOTS = 1;

let inFlight = 0;
const perOwner = new Map<string, number>();

export type SlotRefusal = 'full' | 'session' | 'ip';

function bump(key: string, by: number): void {
  const n = (perOwner.get(key) ?? 0) + by;
  if (n <= 0) perOwner.delete(key);
  else perOwner.set(key, n);
}

/**
 * Takes a slot for `owner` (session key / client IP – both optional for non-HTTP callers). Returns an
 * idempotent release, or why it was refused.
 */
export function tryAcquireUploadSlot(
  owner: { session?: string | null; ip?: string | null; kind?: 'staff' | 'guest' } = {},
): (() => void) | SlotRefusal {
  const cap =
    owner.kind === 'guest' ? MAX_UPLOADS_IN_FLIGHT - STAFF_RESERVED_SLOTS : MAX_UPLOADS_IN_FLIGHT;
  if (inFlight >= cap) return 'full';
  const s = owner.session ? `s:${owner.session}` : null;
  const i = owner.ip ? `i:${owner.kind ?? 'any'}:${owner.ip}` : null;
  if (s && (perOwner.get(s) ?? 0) >= MAX_UPLOADS_PER_SESSION) return 'session';
  if (i && (perOwner.get(i) ?? 0) >= MAX_UPLOADS_PER_IP) return 'ip';
  inFlight++;
  if (s) bump(s, 1);
  if (i) bump(i, 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    inFlight--;
    if (s) bump(s, -1);
    if (i) bump(i, -1);
  };
}

/** The problem for a refusal: 503 when the process is full, 429 when this session / network is. */
export function uploadRefused(why: SlotRefusal): Error {
  return why === 'full'
    ? problem('SERVICE_UNAVAILABLE', {
        detail: 'too many uploads in progress',
        headers: { 'Retry-After': '5' },
      })
    : problem('RATE_LIMITED', {
        detail: 'too many uploads in progress for this session',
        headers: { 'Retry-After': '5' },
      });
}

/** Runs `fn` inside its own slot (non-HTTP callers and tests); 503 when the gate is full. */
export async function withUploadGate<T>(fn: () => Promise<T>): Promise<T> {
  const release = tryAcquireUploadSlot();
  if (typeof release !== 'function') throw uploadRefused(release);
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
