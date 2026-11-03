// Google Chat incoming webhook client – booking-request room (ARC gchat-booking-request-notify 1.4, 3.3, 8.7;
// SEC GCHAT-02, ESC-041 ★5). Owner: INT (written by BE for v1.0.1 – INT reviews and checks threadKey / messageId on
// the test room).
//
// The URL is the one parseBookingChatWebhook() accepted; this module never validates the host (tests point it at a
// local fake server) and NEVER puts the URL, its query, the text or the response body in a result, an error or a log:
// undici's messages can carry the URL, so failures are reduced to a short code.
//
// - POST JSON `{"text": …}` (≤ 4 KB), timeout 5 s, `redirect: 'error'` (no SSRF through a redirect);
// - `threadKey` + `messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`: reminders reply in the thread of the
//   first message; `messageId=client-<id>` only when the caller asks (INT confirms the webhook accepts it);
// - query parameters are set on a COPY of the URL with URLSearchParams.set – never by string concatenation;
// - 2xx → ok; 409 with a messageId → ok (Chat refused a duplicate id: already posted);
//   408 / 429 / 5xx / timeout / network → retryable; other 4xx, a redirect, a body too large → permanent.

export const CHAT_POST_TIMEOUT_MS = 5_000;
export const CHAT_MAX_BODY_BYTES = 4_096;

export type ChatPostResult =
  { ok: true; code: string } | { ok: false; retryable: boolean; code: string };

export interface ChatPostOptions {
  /** Groups the messages of one request in one thread (the request id). */
  threadKey?: string;
  /** `client-…` id: Chat refuses a second message with the same id (at-least-once → at most one copy). */
  messageId?: string;
  timeoutMs?: number;
  /** Tests only. */
  fetchImpl?: typeof fetch;
}

const SAFE_KEY = /^[A-Za-z0-9_-]{1,64}$/;
const MESSAGE_ID = /^client-[a-z0-9-]{1,56}$/;

/** Short, value-free error code of a failed fetch (never the message: it may contain the URL). */
export function chatErrorCode(err: unknown): { retryable: boolean; code: string } {
  const e = err as { name?: unknown; cause?: unknown } | null;
  const name = typeof e?.name === 'string' ? e.name : '';
  if (name === 'TimeoutError' || name === 'AbortError') return { retryable: true, code: 'TIMEOUT' };
  const cause = (e?.cause ?? null) as { code?: unknown; message?: unknown } | null;
  const causeMsg = typeof cause?.message === 'string' ? cause.message : '';
  // fetch(…, {redirect: 'error'}) on a 3xx: TypeError('fetch failed', {cause: Error('unexpected redirect')}).
  if (/redirect/i.test(causeMsg)) return { retryable: false, code: 'CHAT_REDIRECT' };
  const code =
    typeof cause?.code === 'string' && /^[A-Z0-9_]{2,40}$/.test(cause.code) ? cause.code : '';
  if (/TIMEOUT/.test(code)) return { retryable: true, code: 'TIMEOUT' };
  return { retryable: true, code: code ? `NETWORK_${code}` : 'NETWORK' };
}

export async function postChatText(
  url: string,
  text: string,
  opts: ChatPostOptions = {},
): Promise<ChatPostResult> {
  const body = JSON.stringify({ text });
  if (Buffer.byteLength(body, 'utf8') > CHAT_MAX_BODY_BYTES) {
    return { ok: false, retryable: false, code: 'CHAT_BODY_TOO_LARGE' };
  }
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return { ok: false, retryable: false, code: 'CHAT_WEBHOOK_URL_INVALID' };
  }
  if (opts.threadKey !== undefined) {
    if (!SAFE_KEY.test(opts.threadKey))
      return { ok: false, retryable: false, code: 'BAD_THREAD_KEY' };
    target.searchParams.set('threadKey', opts.threadKey);
    target.searchParams.set('messageReplyOption', 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD');
  }
  if (opts.messageId !== undefined) {
    if (!MESSAGE_ID.test(opts.messageId))
      return { ok: false, retryable: false, code: 'BAD_MESSAGE_ID' };
    target.searchParams.set('messageId', opts.messageId);
  }
  const doFetch = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=UTF-8' },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(opts.timeoutMs ?? CHAT_POST_TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, ...chatErrorCode(err) };
  }
  // The response body is never read into a result or a log: discard it.
  try {
    await res.body?.cancel();
  } catch {
    /* already closed */
  }
  const status = res.status;
  if (status >= 200 && status < 300) return { ok: true, code: `HTTP_${status}` };
  if (status === 409 && opts.messageId !== undefined)
    return { ok: true, code: 'HTTP_409_DUPLICATE' };
  if (status >= 300 && status < 400) return { ok: false, retryable: false, code: 'CHAT_REDIRECT' };
  if (status === 408 || status === 429 || status >= 500) {
    return { ok: false, retryable: true, code: `HTTP_${status}` };
  }
  return { ok: false, retryable: false, code: `CHAT_REJECTED_${status}` };
}
