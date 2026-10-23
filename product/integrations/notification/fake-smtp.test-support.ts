// Minimal local SMTP server for tests only (no TLS, no relay, 127.0.0.1). Not exported from the package.
// Speaks just enough RFC 5321 for nodemailer: EHLO, AUTH PLAIN/LOGIN, MAIL, RCPT, DATA, RSET, NOOP, QUIT.
import { createServer, type Server, type Socket } from 'node:net';

export interface FakeMail {
  authUser: string | null;
  from: string;
  to: string[];
  data: string;
}

export interface FakeSmtpOptions {
  user: string;
  pass: string;
  /** Advertise STARTTLS (the server cannot actually do it – used to prove the client never falls back). */
  advertiseStartTls?: boolean;
  /** Recipients answered with 550. */
  rejectRcpt?: string[];
  /** Answer MAIL FROM with this code (e.g. 421 = temporary). */
  mailFromCode?: number;
}

export class FakeSmtpServer {
  readonly mails: FakeMail[] = [];
  readonly commands: string[] = [];
  private server: Server | null = null;
  port = 0;

  constructor(private readonly opts: FakeSmtpOptions) {}

  async start(): Promise<number> {
    this.server = createServer((s) => this.session(s));
    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
    const addr = this.server.address();
    this.port = typeof addr === 'object' && addr ? addr.port : 0;
    return this.port;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve(),
    );
  }

  private session(sock: Socket): void {
    const o = this.opts;
    let buf = '';
    let mode: 'cmd' | 'data' | 'auth_plain' | 'auth_login_user' | 'auth_login_pass' = 'cmd';
    let authUser: string | null = null;
    let loginUser = '';
    let from = '';
    let to: string[] = [];
    let data = '';
    const say = (l: string) => sock.write(`${l}\r\n`);
    const checkAuth = (u: string, p: string) => {
      if (u === o.user && p === o.pass) {
        authUser = u;
        say('235 2.7.0 Accepted');
      } else say('535 5.7.8 Username and Password not accepted');
    };
    say('220 fake.smtp.test ESMTP');
    sock.on('error', () => undefined);
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      for (;;) {
        if (mode === 'data') {
          const end = buf.indexOf('\r\n.\r\n');
          if (end < 0) return;
          data = buf.slice(0, end);
          buf = buf.slice(end + 5);
          this.mails.push({ authUser, from, to, data: data.replace(/^\.\./gm, '.') });
          mode = 'cmd';
          say('250 2.0.0 OK queued');
          continue;
        }
        const nl = buf.indexOf('\r\n');
        if (nl < 0) return;
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        if (mode === 'auth_plain') {
          mode = 'cmd';
          const [, u = '', p = ''] = Buffer.from(line, 'base64').toString('utf8').split('\u0000');
          checkAuth(u, p);
          continue;
        }
        if (mode === 'auth_login_user') {
          loginUser = Buffer.from(line, 'base64').toString('utf8');
          mode = 'auth_login_pass';
          say('334 UGFzc3dvcmQ6');
          continue;
        }
        if (mode === 'auth_login_pass') {
          mode = 'cmd';
          checkAuth(loginUser, Buffer.from(line, 'base64').toString('utf8'));
          continue;
        }
        const verb = line.split(' ')[0]!.toUpperCase();
        this.commands.push(verb === 'AUTH' ? 'AUTH' : verb);
        if (verb === 'EHLO' || verb === 'HELO') {
          sock.write('250-fake.smtp.test\r\n');
          if (o.advertiseStartTls) sock.write('250-STARTTLS\r\n');
          sock.write('250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        } else if (verb === 'STARTTLS') {
          say('454 4.7.0 TLS not available');
        } else if (verb === 'AUTH') {
          const [, mech = '', initial] = line.split(' ');
          if (mech.toUpperCase() === 'PLAIN') {
            if (initial) {
              const [, u = '', p = ''] = Buffer.from(initial, 'base64')
                .toString('utf8')
                .split('\u0000');
              checkAuth(u, p);
            } else {
              mode = 'auth_plain';
              say('334 ');
            }
          } else if (mech.toUpperCase() === 'LOGIN') {
            mode = 'auth_login_user';
            say('334 VXNlcm5hbWU6');
          } else say('504 5.5.4 Unrecognized authentication type');
        } else if (verb === 'MAIL') {
          if (!authUser) say('530 5.7.0 Authentication Required');
          else if (o.mailFromCode) say(`${o.mailFromCode} 4.7.0 Try again later`);
          else {
            from = /<([^>]*)>/.exec(line)?.[1] ?? '';
            to = [];
            say('250 2.1.0 OK');
          }
        } else if (verb === 'RCPT') {
          const rcpt = /<([^>]*)>/.exec(line)?.[1] ?? '';
          if (o.rejectRcpt?.includes(rcpt))
            say(`550 5.1.1 The email account ${rcpt} does not exist`);
          else {
            to.push(rcpt);
            say('250 2.1.5 OK');
          }
        } else if (verb === 'DATA') {
          mode = 'data';
          say('354 Go ahead');
        } else if (verb === 'RSET' || verb === 'NOOP') {
          say('250 2.0.0 OK');
        } else if (verb === 'QUIT') {
          say('221 2.0.0 Bye');
          sock.end();
        } else say('502 5.5.1 Unrecognized command');
      }
    });
  }
}
