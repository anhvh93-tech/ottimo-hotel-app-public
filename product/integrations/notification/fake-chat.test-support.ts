// Minimal local stand-in for a Google Chat incoming webhook – tests only (127.0.0.1, no TLS). Not exported from the
// package. Records each request (path + query + JSON body) and answers with the next scripted status.
import { createServer, type IncomingMessage, type Server } from 'node:http';

export interface FakeChatRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  text: string;
}

export class FakeChatServer {
  readonly requests: FakeChatRequest[] = [];
  /** Statuses answered in order; when empty, `fallback`. 0 = never answer (timeout), -1 = reset the connection. */
  script: number[] = [];
  fallback = 200;
  /** 3xx answers carry this Location. */
  location = 'https://evil.example.invalid/';
  private server: Server | null = null;
  port = 0;

  get url(): string {
    return `http://127.0.0.1:${this.port}/v1/spaces/AAAAtest01/messages?key=fake-key&token=fake-token`;
  }

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      void readBody(req).then((raw) => {
        const u = new URL(req.url ?? '/', 'http://127.0.0.1');
        let text = '';
        try {
          text = String((JSON.parse(raw) as { text?: unknown }).text ?? '');
        } catch {
          text = '';
        }
        this.requests.push({
          method: req.method ?? '',
          path: u.pathname,
          query: Object.fromEntries(u.searchParams),
          text,
        });
        const status = this.script.length > 0 ? (this.script.shift() as number) : this.fallback;
        if (status === 0) return; // hang: the client times out
        if (status === -1) {
          req.socket.destroy(); // connection reset
          return;
        }
        if (status >= 300 && status < 400) res.setHeader('location', this.location);
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end(status < 300 ? '{"name":"spaces/x/messages/y"}' : '{"error":{"message":"nope"}}');
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
    const addr = this.server.address();
    this.port = typeof addr === 'object' && addr ? addr.port : 0;
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    this.server.closeAllConnections();
    await new Promise<void>((resolve) => this.server!.close(() => resolve()));
    this.server = null;
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
