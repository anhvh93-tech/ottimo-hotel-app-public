/**
 * TestSupportModule – test-only endpoints of docs/api/openapi.test.yaml (ADR-008, BUG-R1-SEC-08):
 *   GET/POST /__test__/clock            MutableClock (dev_clock shared by api + worker)
 *   POST     /__test__/jobs/{key}/run   run a scheduled job now through the exactly-once runner
 *
 * Safety (SR-SECR-05): this folder is the ONLY place the strings "__test__" / "TestSupportModule" may
 * appear in src/ (CI scans the production bundle). main.ts loads it with a dynamic import only when
 * INCLUDE_TEST_SUPPORT=1 and APP_ENV ≠ production; Dockerfile.api deletes dist/test-support unless built
 * with --build-arg INCLUDE_TEST_SUPPORT=1. Every call needs X-Test-Token AND an owner session, and is
 * written to audit_event (category config).
 */
import { timingSafeEqual } from 'node:crypto';
import {
  Body,
  type CanActivate,
  Controller,
  type DynamicModule,
  type ExecutionContext,
  Get,
  HttpCode,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, type Clock, MutableClock } from '../clock';
import { DATABASE, Database } from '../db/database';
import { JobRegistry, JobRunner, type JobRunResult } from '../jobs/job-runner';
import { AuditService } from '../modules/audit/public/audit.service';
import {
  AuthGuard,
  type GuardedRequest,
  type StaffPrincipal,
  tenantOf,
} from '../shared/http/auth.guard';
import { PublicRoute } from '../shared/http/operation';
import { problem } from '../shared/problem';

export const TEST_SUPPORT_TOKEN = Symbol('TEST_SUPPORT_TOKEN');

interface TestRequest extends GuardedRequest {
  testPrincipal?: StaffPrincipal;
}

@Injectable()
export class TestSupportGuard implements CanActivate {
  constructor(
    @Inject(TEST_SUPPORT_TOKEN) private readonly token: string,
    @Inject(AuthGuard) private readonly auth: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<TestRequest>();
    const raw = req.headers['x-test-token'];
    const given = Buffer.from(Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? ''), 'utf8');
    const expected = Buffer.from(this.token, 'utf8');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw problem('UNAUTHENTICATED');
    }
    const principal = await this.auth.authenticate(req);
    if (!principal.roles.includes('owner')) throw problem('FORBIDDEN_ACTION');
    req.testPrincipal = principal;
    return true;
  }
}

const clockBody = z.discriminatedUnion('op', [
  z.object({ op: z.literal('set'), at: z.string().datetime({ offset: true }) }),
  z.object({ op: z.literal('advance'), advanceMs: z.number().int() }),
  z.object({ op: z.literal('freeze') }),
  z.object({ op: z.literal('unfreeze') }),
  z.object({ op: z.literal('reset') }),
]);

const jobBody = z
  .object({
    propertyId: z.string().uuid().optional(),
    slot: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
  })
  .optional();

function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    throw problem('VALIDATION_FAILED', {
      errors: r.error.issues.map((i) => ({
        field: i.path.join('.') || 'body',
        code: 'VALIDATION_FAILED',
      })),
    });
  }
  return r.data;
}

@Controller('__test__')
@PublicRoute() // outside the OpenAPI-driven global guard; TestSupportGuard applies instead
@UseGuards(TestSupportGuard)
export class TestClockController {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private mutable(): MutableClock {
    if (!(this.clock instanceof MutableClock)) {
      throw problem('VALIDATION_FAILED', { detail: 'CLOCK_MODE is not mutable' });
    }
    return this.clock;
  }

  @Get('clock')
  get(): { now: string; mode: string; offsetMs: number } {
    if (!(this.clock instanceof MutableClock)) {
      return { now: this.clock.now().toISOString(), mode: 'system', offsetMs: 0 };
    }
    const s = this.clock.snapshot();
    return { now: s.now.toISOString(), mode: s.mode, offsetMs: s.offsetMs };
  }

  @Post('clock')
  @HttpCode(200)
  async set(
    @Body() body: unknown,
    @Req() req: TestRequest,
  ): Promise<{ now: string; mode: string; offsetMs: number }> {
    const input = parse(clockBody, body);
    const clock = this.mutable();
    const before = clock.now().toISOString();
    const s =
      input.op === 'set'
        ? await clock.set(new Date(input.at))
        : input.op === 'advance'
          ? await clock.advance(input.advanceMs)
          : input.op === 'freeze'
            ? await clock.freeze()
            : input.op === 'unfreeze'
              ? await clock.unfreeze()
              : await clock.reset();
    const p = req.testPrincipal as StaffPrincipal;
    await this.db.withContext(tenantOf(p), (tx) =>
      this.audit.record(tx, {
        category: 'config',
        action: 'test.clock_changed',
        entityType: 'dev_clock',
        before: { now: before },
        after: { op: input.op, now: s.now.toISOString(), mode: s.mode },
        requestId: req.id,
        sessionId: p.sessionId,
      }),
    );
    return { now: s.now.toISOString(), mode: s.mode, offsetMs: s.offsetMs };
  }
}

@Controller('__test__/jobs')
@PublicRoute()
@UseGuards(TestSupportGuard)
export class TestJobsController {
  constructor(
    @Inject(JobRegistry) private readonly registry: JobRegistry,
    @Inject(JobRunner) private readonly runner: JobRunner,
    @Inject(DATABASE) private readonly db: Database,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Post(':jobKey/run')
  @HttpCode(200)
  async run(
    @Param('jobKey') jobKey: string,
    @Body() body: unknown,
    @Req() req: TestRequest,
  ): Promise<{ status: string; stats: Record<string, unknown> }> {
    if (!this.registry.get(jobKey)) throw problem('NOT_FOUND');
    const input = parse(jobBody, body ?? undefined) ?? {};
    const p = req.testPrincipal as StaffPrincipal;
    const propertyId = input.propertyId ?? p.propertyId;
    const properties = (await this.runner.listProperties()).filter(
      (x) => x.organizationId === p.organizationId && x.propertyId === propertyId,
    );
    const target = properties[0];
    if (!target) throw problem('NOT_FOUND');
    const result: JobRunResult = await this.runner.runOnce(jobKey, target, input.slot);
    await this.db.withContext({ ...tenantOf(p), propertyId: target.propertyId }, (tx) =>
      this.audit.record(tx, {
        category: 'config',
        action: 'test.job_run',
        entityType: 'job',
        entityId: jobKey,
        after: { status: result.status, slot: input.slot ?? null },
        requestId: req.id,
        sessionId: p.sessionId,
      }),
    );
    return { status: result.status, stats: result.stats };
  }
}

@Module({})
export class TestSupportModule {
  static register(opts: { token: string }): DynamicModule {
    return {
      module: TestSupportModule,
      controllers: [TestClockController, TestJobsController],
      providers: [{ provide: TEST_SUPPORT_TOKEN, useValue: opts.token }, TestSupportGuard],
    };
  }
}
