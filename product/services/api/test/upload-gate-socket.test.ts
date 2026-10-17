/**
 * Upload slots on a REAL socket (s3-blocker-reverification – repro `leak.ts`): the Fastify adapter of the api
 * (src/http.ts) listening on 127.0.0.1, raw HTTP/1.1 over net.connect, a stand-in session check (no DB).
 * - a client that goes away while its session is being checked never holds a slot;
 * - a client that goes away while its body is read gives its slot back at once;
 * - after many such clients a normal upload still gets through;
 * - one slow session (or one network) cannot hold every slot;
 * - a guest cookie never opens a staff route's body, and the other way round.
 */
import net from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MULTIPART_SESSION_CHECK, createHttpAdapter } from '../src/http';
import {
  MAX_UPLOADS_IN_FLIGHT,
  MAX_UPLOADS_PER_IP,
  MAX_UPLOADS_PER_SESSION,
  STAFF_RESERVED_SLOTS,
  uploadsInFlight,
} from '../src/modules/files/public/upload-gate';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHECK_MS = 80;
const GUEST = '/v1/guest/online-checkin/documents';
const STAFF = '/v1/properties/0192a1b0-0000-7000-8000-000000000001/attachments';

describe('upload slots on a real socket', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;
  let port = 0;

  beforeAll(async () => {
    app = createHttpAdapter({ trustProxy: false, logLevel: 'silent' }).getInstance();
    // Stand-in for UploadSessionCheck: a slow lookup; the cookie value is the session.
    app[MULTIPART_SESSION_CHECK] = async (
      headers: Record<string, string | undefined>,
      kind: 'staff' | 'guest',
    ) => {
      await sleep(CHECK_MS);
      const m = /ottimo_(g?sid)=([^;\s]+)/.exec(headers.cookie ?? '');
      if (!m || (m[1] === 'gsid') !== (kind === 'guest')) return null;
      return `${kind}:${m[2]}`;
    };
    app.post(GUEST, async () => ({ ok: true }));
    app.post('/v1/properties/:propertyId/attachments', async () => ({ ok: true }));
    await app.listen({ port: 0, host: '127.0.0.1' });
    port = app.server.address().port;
  });
  afterAll(async () => app?.close());

  /** Raw request: headers + `sent` bytes of a `length`-byte body; resolves with the status line, or on abort. */
  function request(opts: {
    path?: string;
    cookie: string;
    length?: number;
    sent?: number;
    abortAfterMs?: number;
  }): { done: Promise<string>; socket: net.Socket } {
    const length = opts.length ?? 10;
    const sent = opts.sent ?? length;
    const socket = net.connect(port, '127.0.0.1');
    const done = new Promise<string>((resolve) => {
      let buf = '';
      socket.on('connect', () => {
        socket.write(
          `POST ${opts.path ?? GUEST} HTTP/1.1\r\nHost: x\r\nCookie: ${opts.cookie}\r\n` +
            `Content-Type: multipart/form-data; boundary=xx\r\nContent-Length: ${length}\r\n` +
            `Connection: close\r\n\r\n${'z'.repeat(sent)}`,
        );
        if (opts.abortAfterMs !== undefined) {
          setTimeout(() => {
            socket.destroy();
            resolve('aborted');
          }, opts.abortAfterMs);
        }
      });
      socket.on('data', (d) => {
        buf += d.toString();
      });
      socket.on('end', () => resolve(buf.split('\r\n')[0] ?? ''));
      socket.on('close', () => resolve(buf.split('\r\n')[0] || 'closed'));
      socket.on('error', () => resolve('error'));
    });
    return { done, socket };
  }

  const guestCookie = (s: string) => `__Host-ottimo_gsid=${s.padEnd(43, 'x')}`;
  const staffCookie = (s: string) => `ottimo_sid=${s.padEnd(43, 'y')}`;

  it('client gone during the session check → no slot is ever taken', async () => {
    for (let i = 0; i < 6; i++) {
      await request({ cookie: guestCookie(`a${i}`), length: 1000, sent: 100, abortAfterMs: 20 })
        .done;
    }
    await sleep(CHECK_MS + 200);
    expect(uploadsInFlight()).toBe(0);
  });

  it('client gone while the body is read → the slot comes back at once', async () => {
    await request({
      cookie: guestCookie('b'),
      length: 1000,
      sent: 100,
      abortAfterMs: CHECK_MS + 100,
    }).done;
    await sleep(200);
    expect(uploadsInFlight()).toBe(0);
  });

  it('after many clients gone a normal upload still gets through', async () => {
    for (let i = 0; i < 6; i++) {
      await request({ cookie: guestCookie(`c${i}`), length: 1000, sent: 10, abortAfterMs: 20 })
        .done;
    }
    await sleep(CHECK_MS + 200);
    expect(await request({ cookie: guestCookie('legit') }).done).toBe('HTTP/1.1 200 OK');
    expect(uploadsInFlight()).toBe(0);
  });

  it('one slow session holds at most MAX_UPLOADS_PER_SESSION slots; another session still uploads', async () => {
    expect(MAX_UPLOADS_PER_SESSION).toBe(2);
    // Session A: two slow uploads (body never completed) hold two slots…
    const slow = [0, 1].map(() =>
      request({ cookie: guestCookie('slowA'), length: 1000, sent: 10 }),
    );
    await sleep(CHECK_MS + 100);
    expect(uploadsInFlight()).toBe(2);
    // … its third is refused for the session (429), not for everyone.
    expect(await request({ cookie: guestCookie('slowA') }).done).toBe(
      'HTTP/1.1 429 Too Many Requests',
    );
    // Session B on the same network gets through (third slot of this IP).
    expect(await request({ cookie: guestCookie('B') }).done).toBe('HTTP/1.1 200 OK');
    // A third slow guest (session C, same network) → 3 in flight: the guest share is full (one slot stays
    // for the desk) and this network's GUEST cap too – another guest gets 503, while a staff upload from the
    // very same address still goes through (separate staff IP cap + the reserved slot).
    const third = request({ cookie: guestCookie('C'), length: 1000, sent: 10 });
    await sleep(CHECK_MS + 100);
    expect(uploadsInFlight()).toBe(MAX_UPLOADS_PER_IP);
    expect(await request({ cookie: guestCookie('D') }).done).toBe(
      'HTTP/1.1 503 Service Unavailable',
    );
    expect(await request({ path: STAFF, cookie: staffCookie('s') }).done).toBe('HTTP/1.1 200 OK');
    // Slow clients give up → every slot comes back.
    for (const r of [...slow, third]) r.socket.destroy();
    await sleep(200);
    expect(uploadsInFlight()).toBe(0);
  });

  it('a guest cookie never opens a staff upload route, nor a staff cookie the guest route (401, body unread)', async () => {
    expect(
      await request({ path: STAFF, cookie: guestCookie('g'), length: 1000, sent: 10 }).done,
    ).toBe('HTTP/1.1 401 Unauthorized');
    expect(
      await request({ path: GUEST, cookie: staffCookie('s'), length: 1000, sent: 10 }).done,
    ).toBe('HTTP/1.1 401 Unauthorized');
    expect(await request({ path: STAFF, cookie: staffCookie('s') }).done).toBe('HTTP/1.1 200 OK');
    expect(uploadsInFlight()).toBe(0);
  });
});

/**
 * s3-round4-verification: the client sends its WHOLE body, then closes the socket before the api answers
 * (browser tab closed, Caddy timeout). `req.aborted` stays false → Fastify runs neither onRequestAbort nor
 * onResponse; the slot must still come back (onSend + reply socket 'close'). Prod-like: behind a trusted
 * proxy, the client IP from X-Forwarded-For; the handler takes 200 ms (guard + DB + sharp).
 */
describe('upload slots – client gone after its full body, behind a proxy', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;
  let port = 0;
  const HANDLER_MS = 200;
  /** Guest handlers currently holding a request body (round-5 verification: bounded by the slots). */
  let running = 0;
  let peakRunning = 0;

  beforeAll(async () => {
    app = createHttpAdapter({ trustProxy: ['127.0.0.1'], logLevel: 'silent' }).getInstance();
    app[MULTIPART_SESSION_CHECK] = async (
      headers: Record<string, string | undefined>,
      kind: 'staff' | 'guest',
    ) => {
      await sleep(5);
      const m = /ottimo_(g?sid)=([^;\s]+)/.exec(headers.cookie ?? '');
      if (!m || (m[1] === 'gsid') !== (kind === 'guest')) return null;
      return `${kind}:${m[2]}`;
    };
    app.post(GUEST, async () => {
      running++;
      peakRunning = Math.max(peakRunning, running);
      try {
        await sleep(HANDLER_MS);
        return { ok: true };
      } finally {
        running--;
      }
    });
    app.post('/v1/properties/:propertyId/attachments', async () => {
      await sleep(HANDLER_MS);
      return { ok: true };
    });
    await app.listen({ port: 0, host: '127.0.0.1' });
    port = app.server.address().port;
  });
  afterAll(async () => app?.close());

  function send(opts: {
    path?: string;
    cookie: string;
    ip: string;
    body?: string;
    length?: number | null;
    chunked?: boolean;
    abortAfterMs?: number;
  }): { done: Promise<string>; socket: net.Socket } {
    const body = opts.body ?? '0123456789';
    const socket = net.connect(port, '127.0.0.1');
    const done = new Promise<string>((resolve) => {
      let buf = '';
      socket.on('connect', () => {
        const length =
          opts.chunked || opts.length === null
            ? ''
            : `Content-Length: ${opts.length ?? body.length}\r\n`;
        const chunked = opts.chunked ? 'Transfer-Encoding: chunked\r\n' : '';
        const payload = opts.chunked ? `${body.length.toString(16)}\r\n${body}\r\n0\r\n\r\n` : body;
        socket.write(
          `POST ${opts.path ?? GUEST} HTTP/1.1\r\nHost: x\r\nX-Forwarded-For: ${opts.ip}\r\n` +
            `Cookie: ${opts.cookie}\r\nContent-Type: multipart/form-data; boundary=xx\r\n${length}${chunked}` +
            `Connection: close\r\n\r\n${payload}`,
        );
        if (opts.abortAfterMs !== undefined) {
          setTimeout(() => {
            socket.destroy();
            resolve('aborted');
          }, opts.abortAfterMs);
        }
      });
      socket.on('data', (d) => {
        buf += d.toString();
      });
      socket.on('close', () => resolve(buf.split('\r\n')[0] || 'closed'));
      socket.on('error', () => resolve('error'));
    });
    return { done, socket };
  }

  const guestCookie = (s: string) => `__Host-ottimo_gsid=${s.padEnd(43, 'x')}`;
  const staffCookie = (s: string) => `ottimo_sid=${s.padEnd(43, 'y')}`;

  it('whole body sent, client gone before the reply (2 networks × 2 sessions): the slot stays while the handler runs, then comes back', async () => {
    for (const [sess, ip] of [
      ['g1', '10.0.0.1'],
      ['g1', '10.0.0.1'],
      ['g2', '10.0.0.2'],
      ['g2', '10.0.0.2'],
    ] as const) {
      expect(await send({ cookie: guestCookie(sess), ip, abortAfterMs: 60 }).done).toBe('aborted');
      // The handler still holds the body: its slot is NOT given back on the closed socket…
      expect(uploadsInFlight()).toBe(1);
      expect(running).toBe(1);
      // … but as soon as it replies (onSend runs even with the client gone).
      await sleep(HANDLER_MS + 100);
      expect(running).toBe(0);
      expect(uploadsInFlight()).toBe(0);
    }
    expect(await send({ cookie: guestCookie('g3'), ip: '10.0.0.3' }).done).toBe('HTTP/1.1 200 OK');
    expect(await send({ path: STAFF, cookie: staffCookie('s1'), ip: '10.0.0.9' }).done).toBe(
      'HTTP/1.1 200 OK',
    );
    expect(uploadsInFlight()).toBe(0);
  });

  it('round-5 verification: full bodies sent then closed, one after another – handlers holding a body ≤ per-session cap; many sessions ≤ process cap', async () => {
    // One session, one network, 8 sends in a row, each closed right after its whole body.
    peakRunning = 0;
    for (let i = 0; i < 8; i++) {
      await send({ cookie: guestCookie('flood'), ip: '10.4.0.1', abortAfterMs: 15 }).done;
    }
    expect(peakRunning).toBeLessThanOrEqual(MAX_UPLOADS_PER_SESSION);
    await sleep(HANDLER_MS + 200);
    expect(uploadsInFlight()).toBe(0);
    // Many sessions on many networks at once: never more handlers than slots.
    peakRunning = 0;
    await Promise.all(
      Array.from(
        { length: 10 },
        (_, i) =>
          send({ cookie: guestCookie(`many${i}`), ip: `10.5.0.${i + 1}`, abortAfterMs: 15 }).done,
      ),
    );
    expect(peakRunning).toBeLessThanOrEqual(MAX_UPLOADS_IN_FLIGHT);
    await sleep(HANDLER_MS + 200);
    expect(running).toBe(0);
    expect(uploadsInFlight()).toBe(0);
  });

  it('staff and guests behind the same NAT have separate IP caps', async () => {
    // Three slow guest uploads from one address hold that address's GUEST cap…
    const slow = Array.from({ length: MAX_UPLOADS_PER_IP }, (_, i) =>
      send({ cookie: guestCookie(`nat${i}`), ip: '10.6.0.1', length: 1000 }),
    );
    for (let i = 0; i < 100 && uploadsInFlight() < MAX_UPLOADS_PER_IP; i++) await sleep(10);
    expect(uploadsInFlight()).toBe(MAX_UPLOADS_PER_IP);
    // … the desk on the same address still uploads (staff cap of that address untouched, reserved slot).
    expect(await send({ path: STAFF, cookie: staffCookie('desk-nat'), ip: '10.6.0.1' }).done).toBe(
      'HTTP/1.1 200 OK',
    );
    for (const r of slow) r.socket.destroy();
    await sleep(200);
    expect(uploadsInFlight()).toBe(0);
  });

  it(`guests can never take the desk's reserved slot (${STAFF_RESERVED_SLOTS}): guest share full → 503, staff upload still 200`, async () => {
    const guestShare = MAX_UPLOADS_IN_FLIGHT - STAFF_RESERVED_SLOTS;
    // Slow guests (body never completed) from different sessions and networks fill the guest share.
    const slow = Array.from({ length: guestShare }, (_, i) =>
      send({ cookie: guestCookie(`slow${i}`), ip: `10.1.0.${i + 1}`, length: 1000 }),
    );
    for (let i = 0; i < 100 && uploadsInFlight() < guestShare; i++) await sleep(10);
    expect(uploadsInFlight()).toBe(guestShare);
    expect(await send({ cookie: guestCookie('late'), ip: '10.1.0.99' }).done).toBe(
      'HTTP/1.1 503 Service Unavailable',
    );
    expect(await send({ path: STAFF, cookie: staffCookie('desk'), ip: '10.2.0.1' }).done).toBe(
      'HTTP/1.1 200 OK',
    );
    for (const r of slow) r.socket.destroy();
    await sleep(200);
    expect(uploadsInFlight()).toBe(0);
  });

  it('no Content-Length (chunked or missing) → 422 before the body is read, no slot', async () => {
    expect(await send({ cookie: guestCookie('c1'), ip: '10.3.0.1', chunked: true }).done).toBe(
      'HTTP/1.1 422 Unprocessable Entity',
    );
    // No length at all = no body for HTTP/1.1: refused by Fastify before the parser (400 → 422 in the api's
    // ProblemFilter) – never 2xx, never a slot.
    expect(await send({ cookie: guestCookie('c2'), ip: '10.3.0.2', length: null }).done).toMatch(
      /^HTTP\/1\.1 4(00|22) /,
    );
    expect(uploadsInFlight()).toBe(0);
  });
});
