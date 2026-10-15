import { Writable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import type { TrustProxy } from '../src/config';
import { createHttpAdapter } from '../src/http';

// Minimal view of the Fastify instance (fastify is not a direct dependency of @ottimo/api).
interface Instance {
  get(path: string, handler: (req: { ip: string }) => Promise<unknown>): unknown;
  inject(opts: {
    url: string;
    headers?: Record<string, string>;
  }): Promise<{ json(): { ip: string } }>;
  close(): Promise<unknown>;
}
let instance: Instance | undefined;

afterEach(async () => {
  await instance?.close();
  instance = undefined;
});

function probe(trustProxy: TrustProxy, lines: string[] = []): Instance {
  const logStream = new Writable({
    write(chunk: Buffer, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  const adapter = createHttpAdapter({ logLevel: 'info', trustProxy, logStream });
  const app = adapter.getInstance() as unknown as Instance;
  app.get('/probe/:id', async (req) => ({ ip: req.ip }));
  instance = app;
  return app;
}

describe('trustProxy (FB-R1-ARC-OPS-04, FB-R1-SEC-OPS-08)', () => {
  it('ignores X-Forwarded-For when no proxy is trusted', async () => {
    const res = await probe(false).inject({
      url: '/probe/1',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(res.json().ip).not.toBe('1.2.3.4');
  });

  it('uses X-Forwarded-For only from a listed proxy address', async () => {
    const res = await probe(['127.0.0.1']).inject({
      url: '/probe/1',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    expect(res.json().ip).toBe('1.2.3.4');
  });
});

describe('request log (FB-R1-ARC-OPS-05, FB-R1-SEC-OPS-02, SR-LOG-01/02)', () => {
  it('logs the route template, not the query string, headers or client address', async () => {
    const lines: string[] = [];
    await probe(false, lines).inject({
      url: '/probe/42?phone=0901234567&token=tok_SECRET_123',
      headers: { authorization: 'Bearer abc_SECRET_456', 'x-forwarded-for': '1.2.3.4' },
    });
    const out = lines.join('');
    expect(out).toContain('"route":"/probe/:id"');
    const mustNotLeak = ['0901234567', 'tok_SECRET_123', 'abc_SECRET_456', '1.2.3.4', '/probe/42'];
    for (const value of mustNotLeak) {
      expect(out).not.toContain(value);
    }
  });
});
