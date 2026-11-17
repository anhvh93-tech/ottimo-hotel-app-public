/**
 * FB-INV-011 (R5, INV 17/11; contract rounds/round-05/fb-inv-011/contract.md) – BE on the real PostgreSQL:
 * job `fx.refresh` (stub source – never the network), stored `fx_rates.vietcombank`, failure keeps the old rates and
 * warns OWN once a day, the setParameter hooks (`fx_rates.vietcombank` worker-only, `fx_rate_overrides` allowlist),
 * and the optional `fx` block of getPublicMonthlyRates (7-day rule, override). Fake clock, FAKE data only.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import type { Database } from '../../src/db/database';
import { JobRegistry, JobRunner, type PropertyRef } from '../../src/jobs/job-runner';
import { EventsService } from '../../src/modules/events/public/events.service';
import { ParameterService } from '../../src/modules/platform/public/parameter.service';
import { PriceEstimateService } from '../../src/modules/public-site/internal/price-estimate.service';
import {
  FX_FETCH_FAILED_DEDUPE,
  FX_REFRESH_JOB_KEY,
  fxRefreshJob,
} from '../../src/modules/public-site/public/fx-refresh-job';
import { FxSourceFailure } from '../../src/modules/public-site/public/fx-rates';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { staff } from '../helpers/registration-fixture';
import { seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';
import { VCB_SAMPLE_RATES, VCB_SAMPLE_XML, vcbBoard } from '../helpers/vietcombank-fx-sample';

const TZ = 'Asia/Ho_Chi_Minh';
const at = (iso: string) => new Date(iso);

describe.skipIf(!HAS_DB)('FB-INV-011 – Vietcombank rates, OWN override, monthly-rates `fx`', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let prop: PropertyRef;
  let runner: JobRunner;
  let service: PriceEstimateService;
  const tok = (u: string) => t.users[u]!.sessionToken;
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const putParam = (who: string, key: string, value: unknown, effectiveFrom: string) =>
    staff(fa, tok(who), null, 'PUT', `${P(t)}/parameters/${key}`, {
      json: { value, effectiveFrom, reason: 'FB-INV-011 test' },
    });

  let source = vi.fn<() => Promise<string>>();
  const log = vi.fn();
  /** A new job instance = a worker (re)start (its per-process attempt memory is empty). */
  const startWorker = () => {
    const registry = new JobRegistry();
    registry.register(
      fxRefreshJob({
        events: fa.app.get(EventsService),
        params: fa.app.get(ParameterService),
        mode: 'vietcombank',
        source: () => source(),
        log,
      }),
    );
    runner = new JobRunner(db, fa.clock, registry, fa.app.get(ParameterService));
  };
  const run = async () => (await runner.runOnce(FX_REFRESH_JOB_KEY, prop)).stats;
  const monthly = async () => {
    // Past the 60 s cache of the answer.
    fa.clock.set(new Date(fa.clock.now().getTime() + 61_000));
    return service.publicMonthlyRates(
      { organizationId: t.organizationId, propertyId: t.propertyIds[0] as string, timezone: TZ },
      '',
    );
  };
  const alerts = () =>
    q<{ resolved_at: Date | null; details: Record<string, unknown> }>(
      `SELECT resolved_at, details FROM attention_event WHERE dedupe_key = $1 ORDER BY created_at`,
      [FX_FETCH_FAILED_DEDUPE],
    );
  const autoRows = () =>
    q<{ effective_from: string; value: { asOf: string; rates: Record<string, number> } }>(
      `SELECT effective_from::text AS effective_from, value FROM config_parameter
        WHERE key = 'fx_rates.vietcombank' ORDER BY effective_from`,
    );

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: { own: ['owner'], mgr: ['manager'] } });
    await seedBooking(db, t);
    await q(`UPDATE room SET public_room_type = 'Premium · One Bedroom + 1'`);
    // Both public switches on (rows written directly – the readiness rules of the form are tested elsewhere).
    for (const key of ['public_booking_requests_enabled', 'public_show_prices']) {
      await q(
        `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from, reason,
           created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'true'::jsonb, '2026-10-01', 'test', now(), now())`,
        [uuidv7(), t.organizationId, t.propertyIds[0], key],
      );
    }
    prop = {
      propertyId: t.propertyIds[0] as string,
      organizationId: t.organizationId,
      timezone: TZ,
    };
    fa = await startFeatureApp(db);
    fa.clock.set(at('2026-11-17T09:00:00+07:00'));
    await touchSessions(db, t, fa.clock.now());
    service = fa.app.get(PriceEstimateService);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('no rate yet → monthly-rates has no `fx` (catalogue default {} is no rate)', async () => {
    const r = await monthly();
    expect(r.roomTypes).toBeDefined();
    expect(r).not.toHaveProperty('fx');
  });

  it('start-up run stores the 4 SELL rates of the board; next ticks of the day do nothing', async () => {
    startWorker();
    source = vi.fn(async () => VCB_SAMPLE_XML);
    expect(await run()).toEqual({ fx: 'stored', asOf: '2026-11-17' });
    expect(source).toHaveBeenCalledTimes(1);
    expect(await autoRows()).toEqual([
      {
        effective_from: '2026-11-17',
        value: {
          asOf: '2026-11-17',
          publishedAt: '2026-11-17T12:05:08+07:00',
          rates: VCB_SAMPLE_RATES,
        },
      },
    ]);
    expect(await run()).toEqual({ fx: 'current' });
    expect(source).toHaveBeenCalledTimes(1);
    const r = await monthly();
    expect(r.fx).toEqual({
      base: 'VND',
      source: 'vietcombank',
      asOf: '2026-11-17',
      rates: VCB_SAMPLE_RATES,
    });
  });

  it('next day, source down: rates kept, one line logged with the code, ONE OWN alert for the day; hourly retry only', async () => {
    fa.clock.set(at('2026-11-18T06:30:00+07:00'));
    startWorker(); // restart: first tick tries even before 07:30
    source = vi.fn(async () => {
      throw new FxSourceFailure('FX_TIMEOUT');
    });
    expect(await run()).toEqual({ fx: 'failed', code: 'FX_TIMEOUT' });
    expect(log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining('fx rates fetch failed'),
      expect.objectContaining({ code: 'FX_TIMEOUT', ownWarned: true, storedAsOf: '2026-11-17' }),
    );
    // Before 07:30 and within the hour: no new call.
    expect(await run()).toEqual({ fx: 'wait' });
    fa.clock.set(at('2026-11-18T07:40:00+07:00'));
    expect(await run()).toEqual({ fx: 'failed', code: 'FX_TIMEOUT' });
    expect(source).toHaveBeenCalledTimes(2);
    const a = await alerts();
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ resolved_at: null, details: { check: 'fx_rate_fetch_failed' } });
    // OWN closes the item the same day; another failure that day opens nothing new.
    await q(`UPDATE attention_event SET resolved_at = now() WHERE dedupe_key = $1`, [
      FX_FETCH_FAILED_DEDUPE,
    ]);
    fa.clock.set(at('2026-11-18T08:45:00+07:00'));
    expect(await run()).toMatchObject({ fx: 'failed' });
    expect(await alerts()).toHaveLength(1);
    // Rates of yesterday still served (1 day old).
    expect((await monthly()).fx).toMatchObject({ source: 'vietcombank', asOf: '2026-11-17' });
    expect(await autoRows()).toHaveLength(1);
  });

  it('a malformed board (out-of-band rate) is a failure too; then a good board of the day is stored', async () => {
    fa.clock.set(at('2026-11-18T09:50:00+07:00'));
    source = vi.fn(async () =>
      vcbBoard('11/18/2026', '8:30:00 AM', {
        USD: '259.30',
        KRW: '20.10',
        CNY: '3,925.00',
        RUB: '330.00',
      }),
    );
    expect(await run()).toEqual({ fx: 'failed', code: 'FX_RATE_OUT_OF_RANGE' });
    fa.clock.set(at('2026-11-18T10:55:00+07:00'));
    source = vi.fn(async () =>
      vcbBoard('11/18/2026', '8:30:00 AM', {
        USD: '25,940.00',
        KRW: '20.10',
        CNY: '3,925.00',
        RUB: '330.00',
      }),
    );
    expect(await run()).toEqual({ fx: 'stored', asOf: '2026-11-18' });
    expect((await autoRows()).map((r) => [r.effective_from, r.value.asOf])).toEqual([
      ['2026-11-17', '2026-11-17'],
      ['2026-11-18', '2026-11-18'],
    ]);
    expect((await monthly()).fx).toEqual({
      base: 'VND',
      source: 'vietcombank',
      asOf: '2026-11-18',
      rates: { USD: 25_940, KRW: 20.1, CNY: 3_925, RUB: 330 },
    });
  });

  it('setParameter: fx_rates.vietcombank is worker-only (403, logged); fx_rate_overrides – OWN only, allowlist, band', async () => {
    await touchSessions(db, t, fa.clock.now());
    const auto = await putParam(
      'own',
      'fx_rates.vietcombank',
      { asOf: '2026-11-18', rates: {} },
      '2026-11-19',
    );
    expect(auto.statusCode, auto.body).toBe(403);
    const denied = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_event
        WHERE action = 'access.denied' AND entity_id = 'fx_rates.vietcombank'`,
    );
    expect(denied[0]?.n).toBe(1);
    expect(
      (await putParam('mgr', 'fx_rate_overrides', { USD: 25_500 }, '2026-11-19')).statusCode,
    ).toBe(403);
    const eur = await putParam('own', 'fx_rate_overrides', { EUR: 29_000 }, '2026-11-19');
    expect(eur.statusCode, eur.body).toBe(422);
    expect(eur.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'value.EUR', code: 'NOT_ALLOWED' }],
    });
    const low = await putParam('own', 'fx_rate_overrides', { USD: 255 }, '2026-11-19');
    expect(low.statusCode, low.body).toBe(422);
    expect(low.json()).toMatchObject({
      code: 'PARAM_OUT_OF_RANGE',
      errors: [{ field: 'value.USD', code: 'PARAM_OUT_OF_RANGE' }],
      min: 10_000,
      max: 60_000,
    });
    expect(await autoRows()).toHaveLength(2);
  });

  it('Vietcombank stale (> 7 days) → no `fx`; OWN override from today → `fx` manual with that code only', async () => {
    fa.clock.set(at('2026-11-27T10:00:00+07:00'));
    await touchSessions(db, t, fa.clock.now());
    expect(await monthly()).not.toHaveProperty('fx');
    const ok = await putParam('own', 'fx_rate_overrides', { USD: 25_500 }, '2026-11-27');
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await monthly()).fx).toEqual({
      base: 'VND',
      source: 'manual',
      asOf: '2026-11-27',
      rates: { USD: 25_500 },
    });
    // The worker comes back: the fresh board fills the other codes, USD stays OWN's.
    startWorker();
    source = vi.fn(async () =>
      vcbBoard('11/27/2026', '8:30:00 AM', {
        USD: '25,950.00',
        KRW: '20.20',
        CNY: '3,930.00',
        RUB: '331.00',
      }),
    );
    expect(await run()).toEqual({ fx: 'stored', asOf: '2026-11-27' });
    expect((await alerts()).every((x) => x.resolved_at !== null)).toBe(true);
    expect((await monthly()).fx).toEqual({
      base: 'VND',
      source: 'manual',
      asOf: '2026-11-27',
      rates: { USD: 25_500, KRW: 20.2, CNY: 3_930, RUB: 331 },
    });
  });
});
