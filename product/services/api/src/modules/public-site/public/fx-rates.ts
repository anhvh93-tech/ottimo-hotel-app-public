/**
 * FB-INV-011 (INV 17/11; contract `rounds/round-05/fb-inv-011/contract.md`): the landing shows "≈ US$ 334 / month"
 * next to the VND price, in the currency of the page language (EN → USD, KO → KRW, ZH → CNY, RU → RUB, VI → none).
 * Payment stays VND; the foreign number is an estimate only.
 *
 * Source: Vietcombank's public XML (SELL rate, VND for 1 unit), fetched once a day by the worker job `fx.refresh`
 * (fx-refresh-job.ts) and stored as the system-written parameter `fx_rates.vietcombank`. OWN may override any code
 * with the Desk parameter `fx_rate_overrides` (setParameter, effective-dated like every other key – source `manual`).
 * `getPublicMonthlyRates` adds the optional block `fx` (publicFxBlock) only with rates at most 7 days old.
 *
 * Safety of the parse (SEC – untrusted network input):
 *   - HTTPS to ONE host (`portal.vietcombank.com.vn`), no redirect followed, 10 s timeout, body ≤ 64 KiB;
 *   - no XML library: a DOCTYPE / ENTITY / processing instruction other than the prolog → refused (no entity
 *     expansion can happen); only `<DateTime>` and the `<Exrate …/>` attributes of the 4 allowlisted codes are read;
 *   - every rate a plain decimal ("25,930.00"), inside a sanity band per code; all 4 codes required, once each.
 */
import type { Tx } from '../../../db/database';
import { type LocalDate, isCalendarDate } from '../../../shared/time';

/** Contract allowlist: the only codes ever stored, served or accepted as an override. */
export const FX_CURRENCIES = ['USD', 'KRW', 'CNY', 'RUB'] as const;
export type FxCurrency = (typeof FX_CURRENCIES)[number];
export type FxRates = Partial<Record<FxCurrency, number>>;

export const isFxCurrency = (v: unknown): v is FxCurrency =>
  typeof v === 'string' && (FX_CURRENCIES as readonly string[]).includes(v);

/**
 * Sanity band of a rate (VND for 1 unit), inclusive. Wide enough for years of drift (USD ≈ 25.900, KRW ≈ 20,
 * CNY ≈ 3.900, RUB ≈ 330 on 17/11/2026), narrow enough to catch a unit or decimal error (×10, ÷1.000).
 * The same band checks the OWN override. Kept inside the landing's own band (landing-web `fx.ts` FX_SANE,
 * PR #186): a rate the server accepts is never one the page then hides.
 */
export const FX_RATE_BOUNDS: Readonly<Record<FxCurrency, { min: number; max: number }>> = {
  USD: { min: 10_000, max: 60_000 },
  KRW: { min: 7, max: 50 },
  CNY: { min: 1_400, max: 9_000 },
  RUB: { min: 100, max: 800 },
};

/** `fx` is served only while its `asOf` is at most this many days before the business date (contract). */
export const FX_MAX_AGE_DAYS = 7;

/** System-written key (worker only – setParameter refuses it with 403, hook in public-site.module.ts). */
export const FX_AUTO_KEY = 'fx_rates.vietcombank';
/** OWN override key: `{ "USD": 25500 }` – codes of the allowlist only, `{}` = no override. */
export const FX_OVERRIDE_KEY = 'fx_rate_overrides';

/**
 * Official public XML of Vietcombank's exchange-rate board (vietcombank.com.vn "Tỷ giá" → XML), checked 17/11/2026:
 * HTTP 200 `text/xml`, root `<ExrateList>`, `<DateTime>M/D/YYYY h:mm:ss AM|PM</DateTime>` (Vietnam time), one
 * `<Exrate CurrencyCode Buy Transfer Sell/>` per currency. The file asks for at most one request every 5 minutes –
 * the job asks at most once an hour.
 */
export const VIETCOMBANK_FX_URL =
  'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10';
/** Egress allowlist of the job: the fetcher refuses any other host (OPS: the only outbound host to open). */
export const VIETCOMBANK_FX_HOST = 'portal.vietcombank.com.vn';
export const FX_FETCH_TIMEOUT_MS = 10_000;
export const FX_MAX_BODY_BYTES = 64 * 1024;

/** Stored value of `fx_rates.vietcombank`. */
export interface FxAutoValue {
  /** Date of Vietcombank's board (`<DateTime>`, Vietnam time). */
  asOf: LocalDate;
  /** `<DateTime>` as an ISO instant with +07:00. */
  publishedAt: string;
  rates: Record<FxCurrency, number>;
}

/** Error codes of a refused source (logged and kept in the job stats – never the body). */
export type FxSourceError =
  | 'FX_HOST_NOT_ALLOWED'
  | 'FX_HTTP_STATUS'
  | 'FX_CONTENT_TYPE'
  | 'FX_TOO_LARGE'
  | 'FX_TIMEOUT'
  | 'FX_NETWORK'
  | 'FX_XML_FORBIDDEN_MARKUP'
  | 'FX_XML_SHAPE'
  | 'FX_DATE'
  | 'FX_RATE_MISSING'
  | 'FX_RATE_DUPLICATE'
  | 'FX_RATE_FORMAT'
  | 'FX_RATE_OUT_OF_RANGE';

export class FxSourceFailure extends Error {
  constructor(readonly code: FxSourceError) {
    super(code);
    this.name = 'FxSourceFailure';
  }
}

const fail = (code: FxSourceError): never => {
  throw new FxSourceFailure(code);
};

/** "25,930.00" / "20.04" / "3,923.82" → number; anything else (empty, "-", exponent, sign) → null. */
export function parseVcbNumber(raw: string): number | null {
  const s = raw.trim();
  if (!/^(\d{1,3}(,\d{3})*|\d+)(\.\d{1,6})?$/.test(s)) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Rate rounded to at most 4 decimals (the board shows 2) – a plain JSON number, never a float artefact. */
const tidy = (n: number) => Math.round(n * 10_000) / 10_000;

export function rateInBounds(code: FxCurrency, n: unknown): n is number {
  const b = FX_RATE_BOUNDS[code];
  return typeof n === 'number' && Number.isFinite(n) && n >= b.min && n <= b.max;
}

const MONTHS_OK = (m: number) => m >= 1 && m <= 12;

/**
 * Vietcombank XML → the 4 SELL rates and the board date. Throws FxSourceFailure (code only) on anything unexpected.
 * The text is never evaluated as XML by a library: no DTD, no entity, nothing outside the 2 element kinds read here.
 */
export function parseVietcombankXml(xml: string): FxAutoValue {
  if (Buffer.byteLength(xml, 'utf8') > FX_MAX_BODY_BYTES) fail('FX_TOO_LARGE');
  // No DTD / entity declaration / CDATA / processing instruction (the `<?xml …?>` prolog alone is allowed).
  if (/<!DOCTYPE|<!ENTITY|<!\[CDATA\[|<!ELEMENT|<!ATTLIST/i.test(xml))
    fail('FX_XML_FORBIDDEN_MARKUP');
  const body = xml.replace(/^\uFEFF?\s*<\?xml[^?<>]*\?>/, '');
  if (/<\?/.test(body)) fail('FX_XML_FORBIDDEN_MARKUP');
  // An entity reference other than the 5 predefined / numeric ones → refused (nothing to expand).
  if (/&(?!(amp|lt|gt|quot|apos|#\d{1,6}|#x[0-9a-f]{1,6});)/i.test(body)) {
    fail('FX_XML_FORBIDDEN_MARKUP');
  }
  const root = /<ExrateList>([\s\S]*)<\/ExrateList>/.exec(body);
  if (!root) return fail('FX_XML_SHAPE');
  const inner = root[1] as string;

  const dt =
    /<DateTime>\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)\s*<\/DateTime>/.exec(
      inner,
    );
  if (!dt) return fail('FX_DATE');
  const [, mo, d, y, hh, mi, ss, ampm] = dt as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    'AM' | 'PM',
  ];
  const month = Number(mo);
  const hour12 = Number(hh);
  if (!MONTHS_OK(month) || hour12 < 1 || hour12 > 12) fail('FX_DATE');
  const asOf = `${y}-${String(month).padStart(2, '0')}-${d.padStart(2, '0')}`;
  if (!isCalendarDate(asOf)) fail('FX_DATE');
  const hour = (hour12 % 12) + (ampm === 'PM' ? 12 : 0);
  const publishedAt = `${asOf}T${String(hour).padStart(2, '0')}:${mi}:${ss}+07:00`;

  const rates: FxRates = {};
  // SEC FB-R5-SEC-BE-187-01: tag and attributes length-capped, attribute names anchored – linear on any input.
  for (const m of inner.matchAll(/<Exrate\s([^<>]{0,1024}?)\/>/g)) {
    const attrs = new Map<string, string>();
    for (const a of (m[1] as string).matchAll(/(?<![A-Za-z])([A-Za-z]{1,32})="([^"<>]{0,64})"/g)) {
      attrs.set(a[1] as string, a[2] as string);
    }
    const code = attrs.get('CurrencyCode')?.trim();
    if (!isFxCurrency(code)) continue; // allowlist: every other currency is ignored
    if (rates[code] !== undefined) fail('FX_RATE_DUPLICATE');
    const sell = parseVcbNumber(attrs.get('Sell') ?? '');
    if (sell === null) return fail('FX_RATE_FORMAT');
    if (!rateInBounds(code, sell)) fail('FX_RATE_OUT_OF_RANGE');
    rates[code] = tidy(sell);
  }
  for (const c of FX_CURRENCIES) if (rates[c] === undefined) fail('FX_RATE_MISSING');
  return { asOf, publishedAt, rates: rates as Record<FxCurrency, number> };
}

export type FetchLike = (
  url: string,
  init: { signal: AbortSignal; redirect: 'error'; headers: Record<string, string> },
) => Promise<{
  status: number;
  headers: { get(name: string): string | null };
  body: ReadableStream<Uint8Array> | null;
}>;

/**
 * GET the Vietcombank XML: HTTPS, allowlisted host only, no redirect, timeout, size cap while reading (a missing or
 * lying Content-Length cannot make it read more). Returns the text; throws FxSourceFailure.
 */
export async function fetchVietcombankXml(
  url: string = VIETCOMBANK_FX_URL,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  timeoutMs: number = FX_FETCH_TIMEOUT_MS,
): Promise<string> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return fail('FX_HOST_NOT_ALLOWED');
  }
  if (u.protocol !== 'https:' || u.hostname !== VIETCOMBANK_FX_HOST || u.port !== '') {
    fail('FX_HOST_NOT_ALLOWED');
  }
  const signal = AbortSignal.timeout(timeoutMs);
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(u.toString(), {
      signal,
      redirect: 'error',
      headers: { accept: 'text/xml, application/xml' },
    });
  } catch (err) {
    return fail(
      signal.aborted || (err as Error)?.name === 'TimeoutError' ? 'FX_TIMEOUT' : 'FX_NETWORK',
    );
  }
  if (res.status !== 200) {
    await res.body?.cancel().catch(() => undefined);
    fail('FX_HTTP_STATUS');
  }
  const type = (res.headers.get('content-type') ?? '').toLowerCase();
  if (!/^(text|application)\/xml\b/.test(type)) {
    await res.body?.cancel().catch(() => undefined);
    fail('FX_CONTENT_TYPE');
  }
  const declared = Number(res.headers.get('content-length') ?? '0');
  if (declared > FX_MAX_BODY_BYTES) {
    await res.body?.cancel().catch(() => undefined);
    fail('FX_TOO_LARGE');
  }
  if (!res.body) return fail('FX_XML_SHAPE');
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > FX_MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        fail('FX_TOO_LARGE');
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof FxSourceFailure) throw err;
    return fail(signal.aborted ? 'FX_TIMEOUT' : 'FX_NETWORK');
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks));
}

/**
 * Value of `fx_rate_overrides` (setParameter hook): an object whose keys are allowlisted codes and whose values are
 * rates inside the sanity band. Returns the first problem as `{ field, code }` or null.
 */
export function fxOverridesIssue(value: unknown): { field: string; code: string } | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { field: 'value', code: 'VALIDATION_FAILED' };
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (!isFxCurrency(k)) return { field: `value.${k.slice(0, 20)}`, code: 'NOT_ALLOWED' };
    if (!rateInBounds(k, v)) return { field: `value.${k}`, code: 'PARAM_OUT_OF_RANGE' };
  }
  return null;
}

/** Stored auto value read back (defensive: a malformed row is treated as "no rate"). */
export function readAutoValue(v: unknown): FxAutoValue | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as { asOf?: unknown; publishedAt?: unknown; rates?: unknown };
  if (!isCalendarDate(o.asOf) || !o.rates || typeof o.rates !== 'object') return null;
  const rates: FxRates = {};
  for (const c of FX_CURRENCIES) {
    const n = (o.rates as Record<string, unknown>)[c];
    if (rateInBounds(c, n)) rates[c] = n;
  }
  return {
    asOf: o.asOf,
    publishedAt: typeof o.publishedAt === 'string' ? o.publishedAt : '',
    rates: rates as Record<FxCurrency, number>,
  };
}

const dayNumber = (d: LocalDate) => {
  const [y, m, dd] = d.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, dd) / 86_400_000;
};

/** Contract block of `getPublicMonthlyRates` (OpenAPI PublicFxRates). */
export interface PublicFxBlock {
  base: 'VND';
  source: 'vietcombank' | 'manual';
  asOf: LocalDate;
  rates: FxRates;
}

/**
 * The `fx` block for the business date `today`, or null (→ the field is left out, the landing shows VND only).
 * Per code: the OWN override in force (asOf = its effective date) else the Vietcombank rate (asOf = board date);
 * an entry older than FX_MAX_AGE_DAYS (or dated after today) is dropped – a stale override gives way to a fresh
 * Vietcombank rate of that code. `source` = `manual` as soon as one served rate is an override; `asOf` = the OLDEST
 * date of the served rates (the caption never claims a newer rate than the one used).
 */
export function publicFxBlock(
  today: LocalDate,
  auto: FxAutoValue | null,
  overrides: { value: unknown; effectiveFrom: LocalDate } | null,
): PublicFxBlock | null {
  const fresh = (asOf: LocalDate) => {
    const age = dayNumber(today) - dayNumber(asOf);
    return age >= 0 && age <= FX_MAX_AGE_DAYS;
  };
  const manual =
    overrides && fxOverridesIssue(overrides.value) === null
      ? (overrides.value as FxRates)
      : ({} as FxRates);
  const rates: FxRates = {};
  const dates: LocalDate[] = [];
  let anyManual = false;
  for (const c of FX_CURRENCIES) {
    const m = manual[c];
    if (m !== undefined && overrides && fresh(overrides.effectiveFrom)) {
      rates[c] = m;
      dates.push(overrides.effectiveFrom);
      anyManual = true;
      continue;
    }
    const a = auto?.rates[c];
    if (auto && a !== undefined && fresh(auto.asOf)) {
      rates[c] = a;
      dates.push(auto.asOf);
    }
  }
  if (dates.length === 0) return null;
  const asOf = dates.reduce((x, y) => (y < x ? y : x));
  return { base: 'VND', source: anyManual ? 'manual' : 'vietcombank', asOf, rates };
}

/** The two rows in force on `today` (one query, inside the public READ ONLY transaction). */
export async function readFxRows(
  tx: Tx,
  today: LocalDate,
): Promise<{
  auto: FxAutoValue | null;
  overrides: { value: unknown; effectiveFrom: LocalDate } | null;
}> {
  const { rows } = await tx.query<{ key: string; value: unknown; effective_from: string }>(
    `SELECT DISTINCT ON (key) key, value, effective_from::text AS effective_from
       FROM config_parameter
      WHERE property_id = $1 AND key = ANY($2::text[]) AND effective_from <= $3
      ORDER BY key, effective_from DESC`,
    [tx.ctx.propertyId, [FX_AUTO_KEY, FX_OVERRIDE_KEY], today],
  );
  const a = rows.find((r) => r.key === FX_AUTO_KEY);
  const o = rows.find((r) => r.key === FX_OVERRIDE_KEY);
  return {
    auto: a ? readAutoValue(a.value) : null,
    overrides: o ? { value: o.value, effectiveFrom: o.effective_from } : null,
  };
}
