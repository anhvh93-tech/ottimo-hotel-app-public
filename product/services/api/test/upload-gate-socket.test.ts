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
  MAX_UPLOADS_PER_IP,
  MAX_UPLOADS_PER_SESSION,
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
    // The network cap: with A's two slow ones a third concurrent slow one from this IP fills it…
    const third = request({ cookie: guestCookie('C'), length: 1000, sent: 10 });
    await sleep(CHECK_MS + 100);
    expect(uploadsInFlight()).toBe(MAX_UPLOADS_PER_IP);
    expect(await request({ cookie: guestCookie('D') }).done).toBe('HTTP/1.1 429 Too Many Requests');
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
