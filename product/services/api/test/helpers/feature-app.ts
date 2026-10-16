/**
 * Nest/Fastify app with the BE-B feature modules (platform, identity, guests) on the real test DB,
 * driven by a FixedClock so session/idle/lock tests can move time. Requests carry the session cookie and
 * the CSRF token the identity module issues (SessionService), exactly as admin-web does.
 */
import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../src/app.module';
import { FixedClock } from '../../src/clock';
import type { Database } from '../../src/db/database';
import { createHttpAdapter } from '../../src/http';
import { featureModules } from '../../src/modules/feature-modules';
import { SessionService } from '../../src/modules/identity/public/session.service';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { T0, type TestTenant, setParam } from './tenant';

/** The parts of a light-my-request response the tests use. */
export interface LightMyRequestResponse {
  statusCode: number;
  headers: Record<string, string | string[] | number | undefined>;
  body: string;
  /** Raw bytes (binary responses: images). */
  rawPayload: Buffer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): any;
}

export const TEST_PASSWORD = 'Fake-test-pass-2026';

export interface FeatureApp {
  app: NestFastifyApplication;
  clock: FixedClock;
  sessions: SessionService;
  close(): Promise<void>;
}

export async function startFeatureApp(
  db: Database,
  opts: {
    adminOrigins?: string[];
    pwaOrigins?: string[];
    /** guest-web origins (empty = not checked, dev/test default) – SEC FB-R2-SEC-BE-50 (a). */
    guestOrigins?: string[];
    /** Replace providers (ports of other zones in BE-A Sprint 3 tests – e.g. FrontdeskPorts). */
    override?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
    /**
     * SR-RL-09 limit per staff user and minute (SEC-BE-35). The fixed test clock never ends a window, so the
     * suites run with a high limit; the rate-limit test passes the production value.
     */
    staffRequestsPerMinute?: number;
  } = {},
): Promise<FeatureApp> {
  const clock = new FixedClock(T0);
  const staffOrigins = [...(opts.adminOrigins ?? []), ...(opts.pwaOrigins ?? [])];
  const builder = Test.createTestingModule({
    imports: [
      AppModule.register({
        clock,
        db: { ping: async () => true, close: async () => undefined },
        database: db,
        auth: {
          cookieSecurePrefix: false,
          allowedOrigins: {
            staff: staffOrigins,
            guest: opts.guestOrigins ?? [],
            admin: opts.adminOrigins ?? [],
            staffPwa: opts.pwaOrigins ?? [],
          },
          staffRequestsPerMinute: opts.staffRequestsPerMinute ?? 1_000_000,
        },
        imports: featureModules({
          sessionSecret: 'test-session-secret-0123456789abcdef',
          cookieSecurePrefix: false,
          adminOrigins: opts.adminOrigins ?? [],
          pwaOrigins: opts.pwaOrigins ?? [],
          ipHmacKey: 'test-ip-hmac-key-0123456789abcdefgh',
        }),
      }),
    ],
  });
  const moduleRef = await (opts.override ? opts.override(builder) : builder).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    createHttpAdapter({ logLevel: 'silent', trustProxy: false }),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return {
    app,
    clock,
    sessions: app.get(SessionService),
    close: () => app.close(),
  };
}

/** Business parameters the Sprint 1 use cases read (values of DS-E / BR section 13). */
export async function seedSprint1Params(db: Database, t: TestTenant, propertyIndex = 0) {
  for (const [k, v] of Object.entries({
    business_day_rollover: '06:00',
    night_from_month_divisor: 12,
    'rounding.night_rate': 1000,
    minor_data_age_threshold: 16,
  })) {
    await setParam(db, t, k, v, '2026-10-01', propertyIndex);
  }
}

export async function setPassword(
  db: Database,
  t: TestTenant,
  user: string,
  plain = TEST_PASSWORD,
) {
  const h = await hash(plain);
  await db.withContext(t.ctx(), (tx) =>
    tx.query('UPDATE app_user SET password_hash = $2 WHERE id = $1', [t.users[user]!.id, h]),
  );
}

/** Thin HTTP client: session cookie + CSRF + Idempotency-Key on writes. */
export class Client {
  constructor(
    private readonly fa: FeatureApp,
    public token: string | null,
    public deviceToken: string | null = null,
  ) {}

  static of(fa: FeatureApp, t: TestTenant, user: string): Client {
    return new Client(fa, t.users[user]!.sessionToken);
  }

  headers(extra: Record<string, string> = {}, write = false): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    const cookies: string[] = [];
    if (this.token) cookies.push(`ottimo_sid=${this.token}`);
    if (this.deviceToken) cookies.push(`ottimo_did=${this.deviceToken}`);
    if (cookies.length) h.cookie = cookies.join('; ');
    if (write && this.token && !('x-csrf-token' in h)) {
      h['x-csrf-token'] = this.fa.sessions.csrfToken(sha256Hex(this.token));
    }
    return h;
  }

  get(url: string, headers: Record<string, string> = {}): Promise<LightMyRequestResponse> {
    return this.fa.app.inject({ method: 'GET', url, headers: this.headers(headers) });
  }

  send(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<LightMyRequestResponse> {
    const h = this.headers({ 'idempotency-key': randomUUID(), ...headers }, true);
    return this.fa.app.inject({
      method,
      url,
      headers: h,
      ...(body === undefined ? {} : { payload: body as object }),
    });
  }
}

export const P = (t: TestTenant, i = 0) => `/v1/properties/${t.propertyIds[i]}`;

/** Cookie value set by a response (`name=value; …`). */
export function cookieValue(res: LightMyRequestResponse, name: string): string | undefined {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const c of list) {
    const m = new RegExp(`^${name}=([^;]*)`).exec(String(c));
    if (m) return m[1];
  }
  return undefined;
}

export { T0 };
