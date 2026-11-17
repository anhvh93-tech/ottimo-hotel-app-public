/**
 * FB-INV-011 – job `fx.refresh` (worker; also in the api registry for test-support `runOnce`): the Vietcombank SELL
 * rates of USD, KRW, CNY, RUB once a day, stored as the system-written parameter `fx_rates.vietcombank`
 * (fx-rates.ts). Schedule `tick` with its own gating (the worker ticks every minute):
 *   - nothing to do when the stored board is already today's (Vietnam calendar date of the board);
 *   - the FIRST tick of a worker process tries at once ("run at start-up when today's rate is missing");
 *   - afterwards at most once an hour and only from 07:30 local (Vietcombank posts the day's board in the morning;
 *     its XML asks for at most one request every 5 minutes);
 *   - FX_RATES_FETCH=off (default outside staging/production) → no network call at all.
 * A failure (network, HTTP, size, timeout, XML shape, rate out of band) keeps the stored rates (nothing written),
 * logs one line with the code (never the body) and opens ONE "Cần chú ý" item `data_quality`
 * `check = fx_rate_fetch_failed` for OWN – at most one new item per local day; the next success closes it.
 * A board older than the stored one is never written over it.
 */
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import type { JobDefinition } from '../../../jobs/job-runner';
import { writeLogLine } from '../../../shared/log-line';
import { atLocal, businessDate, zonedParts } from '../../../shared/time';
import type { EventsService } from '../../events/public/events.service';
import type { ParameterService } from '../../platform/public/parameter.service';
import {
  FX_AUTO_KEY,
  FxSourceFailure,
  fetchVietcombankXml,
  parseVietcombankXml,
  readAutoValue,
} from './fx-rates';

export const FX_REFRESH_JOB_KEY = 'fx.refresh';
/** `data_quality` check of a failed refresh (OWN only – events.service attention audience). */
export const FX_FETCH_FAILED_CHECK = 'fx_rate_fetch_failed';
export const FX_FETCH_FAILED_DEDUPE = 'fx_rate_fetch_failed';
/** Wait between two attempts of one property after the start-up one. */
export const FX_RETRY_MS = 60 * 60_000;
/** Local time from which the hourly attempts run (the start-up attempt runs whenever the worker starts). */
export const FX_DAILY_FROM_MINUTES = 7 * 60 + 30;

export type FxFetchMode = 'vietcombank' | 'off';

/** `FX_RATES_FETCH` = vietcombank | off; empty → vietcombank on staging/production, off elsewhere (CI, dev, test). */
export function fxFetchModeFrom(env: NodeJS.ProcessEnv): FxFetchMode {
  const raw = (env.FX_RATES_FETCH ?? '').trim();
  if (raw === '') {
    return env.APP_ENV === 'production' || env.APP_ENV === 'staging' ? 'vietcombank' : 'off';
  }
  if (raw === 'vietcombank' || raw === 'off') return raw;
  throw new Error('Invalid configuration: FX_RATES_FETCH must be "vietcombank" or "off"');
}

export interface FxRefreshDeps {
  events: EventsService;
  params: ParameterService;
  mode: FxFetchMode;
  /** The XML text (default: HTTPS GET of the official URL, host allowlisted). Tests pass a stub. */
  source?: () => Promise<string>;
  log?: (level: string, msg: string, extra?: Record<string, unknown>) => void;
}

async function warnOwnOncePerDay(
  tx: Tx,
  events: EventsService,
  now: Date,
  dayStart: Date,
): Promise<boolean> {
  // One open item at a time; once OWN closed it, no new one before the next local day.
  const { rows } = await tx.query<{ x: number }>(
    `SELECT 1 AS x FROM attention_event
      WHERE dedupe_key = $1 AND (resolved_at IS NULL OR created_at >= $2) LIMIT 1`,
    [FX_FETCH_FAILED_DEDUPE, dayStart],
  );
  if (rows.length > 0) return false;
  const id = await events.openAttention(tx, {
    kind: 'data_quality',
    severity: 'warning',
    dedupeKey: FX_FETCH_FAILED_DEDUPE,
    params: { check: FX_FETCH_FAILED_CHECK },
    now,
  });
  return id !== null;
}

export function fxRefreshJob(deps: FxRefreshDeps): JobDefinition {
  const source = deps.source ?? (() => fetchVietcombankXml());
  const log = deps.log ?? writeLogLine;
  /** Last attempt per property, in this process (the first tick after a start always tries). */
  const lastAttempt = new Map<string, number>();
  return {
    key: FX_REFRESH_JOB_KEY,
    schedule: { kind: 'tick' },
    async handler(tx, ctx) {
      if (deps.mode === 'off') return { fx: 'off' };
      const rollover = await deps.params.get<string>(tx, 'business_day_rollover', ctx.date);
      const today = businessDate(ctx.now, ctx.timezone, rollover);
      const { rows } = await tx.query<{ value: unknown }>(
        `SELECT value FROM config_parameter
          WHERE property_id = $1 AND key = $2 AND effective_from <= $3
          ORDER BY effective_from DESC LIMIT 1`,
        [ctx.propertyId, FX_AUTO_KEY, today],
      );
      const stored = rows[0] ? readAutoValue(rows[0].value) : null;
      // Board of today's calendar date already stored → done for the day.
      if (stored && stored.asOf >= ctx.date) return { fx: 'current' };

      const now = ctx.now.getTime();
      const last = lastAttempt.get(ctx.propertyId);
      if (last !== undefined) {
        const p = zonedParts(ctx.now, ctx.timezone);
        if (p.hour * 60 + p.minute < FX_DAILY_FROM_MINUTES) return { fx: 'wait' };
        if (now >= last && now - last < FX_RETRY_MS) return { fx: 'wait' };
      }
      lastAttempt.set(ctx.propertyId, now);

      let board: ReturnType<typeof parseVietcombankXml>;
      try {
        board = parseVietcombankXml(await source());
      } catch (err) {
        const code = err instanceof FxSourceFailure ? err.code : 'FX_UNKNOWN';
        const warned = await warnOwnOncePerDay(
          tx,
          deps.events,
          ctx.now,
          atLocal(ctx.date, '00:00', ctx.timezone),
        );
        log('warn', 'fx rates fetch failed – stored rates kept', {
          job: FX_REFRESH_JOB_KEY,
          code,
          ownWarned: warned,
          ...(stored ? { storedAsOf: stored.asOf } : {}),
        });
        return { fx: 'failed', code };
      }
      await deps.events.resolveAttention(tx, FX_FETCH_FAILED_DEDUPE, ctx.now);
      if (stored && board.asOf <= stored.asOf) return { fx: 'unchanged', asOf: stored.asOf };

      // The row of the business date (re-written the same day when a later board comes) – past rows never change.
      await tx.query(
        `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from,
           status_label, reason, created_at, created_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, NULL, $8)
         ON CONFLICT (property_id, key, effective_from) DO UPDATE
           SET value = EXCLUDED.value, reason = EXCLUDED.reason, updated_at = EXCLUDED.updated_at,
               version = config_parameter.version + 1`,
        [
          uuidv7(),
          ctx.organizationId,
          ctx.propertyId,
          FX_AUTO_KEY,
          JSON.stringify(board),
          today,
          'Vietcombank XML (FB-INV-011)',
          ctx.now,
        ],
      );
      await tx.query(`SELECT pg_notify('config_changed', $1)`, [ctx.propertyId]);
      log('info', 'fx rates stored', { job: FX_REFRESH_JOB_KEY, asOf: board.asOf });
      return { fx: 'stored', asOf: board.asOf };
    },
  };
}
