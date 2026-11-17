/**
 * FB-INV-011 (R5, INV 17/11; contract rounds/round-05/fb-inv-011/contract.md) – BE units, no database:
 * the Vietcombank XML parse (real 17/11 sample, forbidden markup, allowlist, bands), the fetcher (host allowlist,
 * no redirect, status/type/size/timeout), the `fx` block (7-day rule, override, fallback), the override check, the
 * public DTO allowlist against OpenAPI PublicFxRates, and FX_RATES_FETCH.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { publicMonthlyRatesDto } from '../src/modules/public-site/internal/price-estimate.service';
import { fxFetchModeFrom } from '../src/modules/public-site/public/fx-refresh-job';
import {
  FX_CURRENCIES,
  FX_MAX_BODY_BYTES,
  type FetchLike,
  type FxAutoValue,
  FxSourceFailure,
  VIETCOMBANK_FX_URL,
  fetchVietcombankXml,
  fxOverridesIssue,
  parseVcbNumber,
  parseVietcombankXml,
  publicFxBlock,
  readAutoValue,
} from '../src/modules/public-site/public/fx-rates';
import { VCB_SAMPLE_RATES, VCB_SAMPLE_XML, vcbBoard } from './helpers/vietcombank-fx-sample';

const SPEC = parse(
  readFileSync(join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml'), 'utf8'),
) as {
  components: {
    schemas: Record<string, { properties?: Record<string, unknown>; required?: string[] }>;
  };
};

const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof FxSourceFailure) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};
const asyncCodeOf = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
  } catch (e) {
    if (e instanceof FxSourceFailure) return e.code;
    throw e;
  }
  return 'NO_ERROR';
};

const FOUR = { USD: '25,930.00', KRW: '20.04', CNY: '3,923.82', RUB: '328.41' };

describe('parseVietcombankXml – the real 17/11/2026 board', () => {
  it('SELL rates of the 4 allowlisted codes only, board date and time (+07:00)', () => {
    const v = parseVietcombankXml(VCB_SAMPLE_XML);
    expect(v).toEqual({
      asOf: '2026-11-17',
      publishedAt: '2026-11-17T12:05:08+07:00',
      rates: VCB_SAMPLE_RATES,
    });
    expect(Object.keys(v.rates).sort()).toEqual([...FX_CURRENCIES].sort());
  });

  it('12-hour clock: 12:xx AM → 00:xx, 8 AM → 08, 12 PM → 12, 1 PM → 13', () => {
    const at = (t: string) => parseVietcombankXml(vcbBoard('1/5/2027', t, FOUR)).publishedAt;
    expect(at('12:10:00 AM')).toBe('2027-01-05T00:10:00+07:00');
    expect(at('8:35:12 AM')).toBe('2027-01-05T08:35:12+07:00');
    expect(at('12:00:00 PM')).toBe('2027-01-05T12:00:00+07:00');
    expect(at('1:00:00 PM')).toBe('2027-01-05T13:00:00+07:00');
    expect(parseVietcombankXml(vcbBoard('1/5/2027', '1:00:00 PM', FOUR)).asOf).toBe('2027-01-05');
  });

  it('an XML prolog is fine; numbers with or without thousands separators', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n${vcbBoard('11/17/2026', '8:00:00 AM', { ...FOUR, USD: '25930' })}`;
    expect(parseVietcombankXml(xml).rates.USD).toBe(25_930);
    expect(parseVcbNumber('25,930.00')).toBe(25_930);
    expect(parseVcbNumber('3,923.82')).toBe(3_923.82);
    for (const bad of ['-', '', '2.5e4', '-25930', '25.930,00', '0', '25,93', 'Infinity', '0x10']) {
      expect(parseVcbNumber(bad), bad).toBeNull();
    }
  });
});

describe('parseVietcombankXml – refused input (SEC: no DTD/entity, allowlist, bands)', () => {
  it('DOCTYPE / ENTITY (billion laughs, external entity), CDATA, processing instruction, unknown entity → FX_XML_FORBIDDEN_MARKUP', () => {
    const laughs = `<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;">]>${vcbBoard('11/17/2026', '8:00:00 AM', FOUR)}`;
    const xxe = `<!DOCTYPE x [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>${vcbBoard('11/17/2026', '8:00:00 AM', FOUR, '&xxe;')}`;
    const cdata = vcbBoard('11/17/2026', '8:00:00 AM', FOUR, '<![CDATA[x]]>');
    const pi = vcbBoard('11/17/2026', '8:00:00 AM', FOUR, '<?php echo 1; ?>');
    const ent = vcbBoard('11/17/2026', '8:00:00 AM', FOUR, '<Source>&custom;</Source>');
    for (const x of [laughs, xxe, cdata, pi, ent]) {
      expect(codeOf(() => parseVietcombankXml(x))).toBe('FX_XML_FORBIDDEN_MARKUP');
    }
    // Predefined / numeric entities are harmless (nothing is expanded anyway).
    expect(
      codeOf(() =>
        parseVietcombankXml(
          vcbBoard('11/17/2026', '8:00:00 AM', FOUR, '<Source>A &amp; B &#38;</Source>'),
        ),
      ),
    ).toBe('NO_ERROR');
  });

  it('size cap 64 KiB; no root; no / bad DateTime', () => {
    const big = vcbBoard(
      '11/17/2026',
      '8:00:00 AM',
      FOUR,
      `<!-- ${'x'.repeat(FX_MAX_BODY_BYTES)} -->`,
    );
    expect(codeOf(() => parseVietcombankXml(big))).toBe('FX_TOO_LARGE');
    expect(codeOf(() => parseVietcombankXml('<html><body>maintenance</body></html>'))).toBe(
      'FX_XML_SHAPE',
    );
    expect(codeOf(() => parseVietcombankXml('<ExrateList></ExrateList>'))).toBe('FX_DATE');
    for (const d of ['13/1/2026', '2/30/2026', '11/17/26']) {
      expect(
        codeOf(() => parseVietcombankXml(vcbBoard(d, '8:00:00 AM', FOUR))),
        d,
      ).toBe('FX_DATE');
    }
    expect(codeOf(() => parseVietcombankXml(vcbBoard('11/17/2026', '13:00:00 PM', FOUR)))).toBe(
      'FX_DATE',
    );
  });

  it('every allowlisted code once, a plain decimal inside its band; other codes ignored', () => {
    const three: Record<string, string> = { ...FOUR };
    delete three.RUB;
    expect(codeOf(() => parseVietcombankXml(vcbBoard('11/17/2026', '8:00:00 AM', three)))).toBe(
      'FX_RATE_MISSING',
    );
    const dup = vcbBoard(
      '11/17/2026',
      '8:00:00 AM',
      FOUR,
      '<Exrate CurrencyCode="USD" Sell="25,000.00" />\n',
    );
    expect(codeOf(() => parseVietcombankXml(dup))).toBe('FX_RATE_DUPLICATE');
    expect(
      codeOf(() =>
        parseVietcombankXml(vcbBoard('11/17/2026', '8:00:00 AM', { ...FOUR, KRW: '-' })),
      ),
    ).toBe('FX_RATE_FORMAT');
    // ×100 / ÷100 unit errors fall outside the band.
    for (const bad of [
      { USD: '259.30' },
      { USD: '2,593,000.00' },
      { KRW: '2,004.00' },
      { CNY: '39.24' },
      { RUB: '3.28' },
    ]) {
      expect(
        codeOf(() =>
          parseVietcombankXml(vcbBoard('11/17/2026', '8:00:00 AM', { ...FOUR, ...bad })),
        ),
        JSON.stringify(bad),
      ).toBe('FX_RATE_OUT_OF_RANGE');
    }
    // A bad number of a currency outside the allowlist never matters (EUR "-" is skipped).
    const v = parseVietcombankXml(
      vcbBoard('11/17/2026', '8:00:00 AM', { EUR: '-', JPY: 'abc', ...FOUR }),
    );
    expect(Object.keys(v.rates).sort()).toEqual(['CNY', 'KRW', 'RUB', 'USD']);
  });
});

describe('parseVietcombankXml – no super-linear regex (SEC FB-R5-SEC-BE-187-01)', () => {
  it('a 64 KiB tag of letters only (no `="`) is processed in < 200 ms', () => {
    const head = '<ExrateList><DateTime>11/17/2026 8:00:00 AM</DateTime><Exrate ';
    const tail = '/></ExrateList>';
    const xml = head + 'a'.repeat(FX_MAX_BODY_BYTES - head.length - tail.length) + tail;
    expect(Buffer.byteLength(xml)).toBeLessThanOrEqual(FX_MAX_BODY_BYTES);
    const t0 = performance.now();
    expect(codeOf(() => parseVietcombankXml(xml))).toBe('FX_RATE_MISSING');
    // Same shape with a short tag reaches the attribute regex directly.
    const inTag = `${head}${'a'.repeat(1_000)} ${tail}`;
    expect(codeOf(() => parseVietcombankXml(inTag))).toBe('FX_RATE_MISSING');
    expect(performance.now() - t0).toBeLessThan(200);
  });
});

describe('fetchVietcombankXml – egress allowlist and limits', () => {
  const stream = (chunks: string[]) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const x of chunks) c.enqueue(new TextEncoder().encode(x));
        c.close();
      },
    });
  const ok = (body: string[], headers: Record<string, string> = {}): FetchLike =>
    vi.fn(async () => ({
      status: 200,
      headers: new Headers({ 'content-type': 'text/xml; charset=utf-8', ...headers }),
      body: stream(body),
    }));

  it('official URL: https, Vietcombank host, no redirect followed, XML accepted', async () => {
    const f = ok([VCB_SAMPLE_XML.slice(0, 100), VCB_SAMPLE_XML.slice(100)]);
    const xml = await fetchVietcombankXml(VIETCOMBANK_FX_URL, f);
    expect(xml).toBe(VCB_SAMPLE_XML);
    const [url, init] = (f as unknown as { mock: { calls: Array<[string, { redirect: string }]> } })
      .mock.calls[0]!;
    expect(new URL(url).hostname).toBe('portal.vietcombank.com.vn');
    expect(init.redirect).toBe('error');
  });

  it('another host, plain http, a port, a look-alike host → refused before any network call', async () => {
    const f = ok([VCB_SAMPLE_XML]);
    for (const u of [
      'https://example.com/x.xml',
      'http://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10',
      'https://portal.vietcombank.com.vn:8443/x',
      'https://portal.vietcombank.com.vn.evil.test/x',
      'https://user@evil.test/portal.vietcombank.com.vn',
      'not a url',
    ]) {
      expect(await asyncCodeOf(fetchVietcombankXml(u, f)), u).toBe('FX_HOST_NOT_ALLOWED');
    }
    expect(f).not.toHaveBeenCalled();
  });

  it('HTTP status, content type, declared and streamed size, network error, timeout', async () => {
    const status: FetchLike = async () => ({
      status: 503,
      headers: new Headers({ 'content-type': 'text/xml' }),
      body: stream(['x']),
    });
    expect(await asyncCodeOf(fetchVietcombankXml(VIETCOMBANK_FX_URL, status))).toBe(
      'FX_HTTP_STATUS',
    );
    expect(
      await asyncCodeOf(
        fetchVietcombankXml(VIETCOMBANK_FX_URL, ok(['<html/>'], { 'content-type': 'text/html' })),
      ),
    ).toBe('FX_CONTENT_TYPE');
    expect(
      await asyncCodeOf(
        fetchVietcombankXml(VIETCOMBANK_FX_URL, ok(['x'], { 'content-length': '10000000' })),
      ),
    ).toBe('FX_TOO_LARGE');
    // No Content-Length, endless body: the read stops at the cap.
    const chunk = 'x'.repeat(16 * 1024);
    expect(
      await asyncCodeOf(fetchVietcombankXml(VIETCOMBANK_FX_URL, ok(Array(10).fill(chunk)))),
    ).toBe('FX_TOO_LARGE');
    const down: FetchLike = async () => {
      throw new TypeError('fetch failed');
    };
    expect(await asyncCodeOf(fetchVietcombankXml(VIETCOMBANK_FX_URL, down))).toBe('FX_NETWORK');
    const hang: FetchLike = (_u, init) =>
      new Promise((_, reject) =>
        init.signal.addEventListener('abort', () => reject(init.signal.reason)),
      );
    expect(await asyncCodeOf(fetchVietcombankXml(VIETCOMBANK_FX_URL, hang, 20))).toBe('FX_TIMEOUT');
  });
});

describe('publicFxBlock – 7-day rule, OWN override, fallback', () => {
  const auto = (asOf: string): FxAutoValue => ({
    asOf,
    publishedAt: `${asOf}T08:00:00+07:00`,
    rates: { ...VCB_SAMPLE_RATES },
  });

  it('Vietcombank board of today or up to 7 days old → served; 8 days or a future date → no block', () => {
    expect(publicFxBlock('2026-11-17', auto('2026-11-17'), null)).toEqual({
      base: 'VND',
      source: 'vietcombank',
      asOf: '2026-11-17',
      rates: VCB_SAMPLE_RATES,
    });
    expect(publicFxBlock('2026-11-24', auto('2026-11-17'), null)?.asOf).toBe('2026-11-17');
    expect(publicFxBlock('2026-11-25', auto('2026-11-17'), null)).toBeNull();
    expect(publicFxBlock('2026-11-16', auto('2026-11-17'), null)).toBeNull();
    expect(publicFxBlock('2026-11-17', null, null)).toBeNull();
    // Month / year boundary.
    expect(publicFxBlock('2027-01-03', auto('2026-12-27'), null)?.source).toBe('vietcombank');
    expect(publicFxBlock('2027-01-04', auto('2026-12-27'), null)).toBeNull();
  });

  it('override of one code → source manual, that code from OWN, asOf = the older date', () => {
    const b = publicFxBlock('2026-11-17', auto('2026-11-17'), {
      value: { USD: 25_500 },
      effectiveFrom: '2026-11-15',
    });
    expect(b).toEqual({
      base: 'VND',
      source: 'manual',
      asOf: '2026-11-15',
      rates: { ...VCB_SAMPLE_RATES, USD: 25_500 },
    });
  });

  it('Vietcombank down for 10 days: OWN override alone is served; `{}` = no override', () => {
    expect(
      publicFxBlock('2026-11-27', auto('2026-11-17'), {
        value: { USD: 25_500, KRW: 19 },
        effectiveFrom: '2026-11-26',
      }),
    ).toEqual({
      base: 'VND',
      source: 'manual',
      asOf: '2026-11-26',
      rates: { USD: 25_500, KRW: 19 },
    });
    expect(
      publicFxBlock('2026-11-17', auto('2026-11-17'), { value: {}, effectiveFrom: '2026-11-17' })
        ?.source,
    ).toBe('vietcombank');
  });

  it('an override older than 7 days gives way to a fresh Vietcombank rate; a malformed override is ignored', () => {
    expect(
      publicFxBlock('2026-11-17', auto('2026-11-17'), {
        value: { USD: 25_500 },
        effectiveFrom: '2026-11-01',
      }),
    ).toMatchObject({ source: 'vietcombank', rates: { USD: VCB_SAMPLE_RATES.USD } });
    for (const value of [{ EUR: 29_000 }, { USD: 2 }, 'USD=25500', [25_500], null]) {
      expect(
        publicFxBlock('2026-11-17', auto('2026-11-17'), { value, effectiveFrom: '2026-11-17' })
          ?.source,
        JSON.stringify(value),
      ).toBe('vietcombank');
    }
  });

  it('a stored row is re-checked when read (unknown code dropped, rate out of band dropped)', () => {
    expect(
      readAutoValue({
        asOf: '2026-11-17',
        publishedAt: 'x',
        rates: { USD: 25_930, EUR: 29_000, KRW: 2_004, CNY: 3_923.82, RUB: 328.41 },
      })?.rates,
    ).toEqual({ USD: 25_930, CNY: 3_923.82, RUB: 328.41 });
    expect(readAutoValue({})).toBeNull();
    expect(readAutoValue({ asOf: '17/11/2026', rates: {} })).toBeNull();
  });
});

describe('fx_rate_overrides check (setParameter hook)', () => {
  it('allowlisted codes, rate inside the band', () => {
    expect(fxOverridesIssue({})).toBeNull();
    expect(fxOverridesIssue({ USD: 25_500, KRW: 18.2, CNY: 3_520, RUB: 290 })).toBeNull();
    expect(fxOverridesIssue({ EUR: 29_000 })).toEqual({ field: 'value.EUR', code: 'NOT_ALLOWED' });
    expect(fxOverridesIssue({ usd: 25_500 })).toEqual({ field: 'value.usd', code: 'NOT_ALLOWED' });
    expect(fxOverridesIssue({ USD: 255 })).toEqual({
      field: 'value.USD',
      code: 'PARAM_OUT_OF_RANGE',
    });
    expect(fxOverridesIssue({ USD: '25500' })).toEqual({
      field: 'value.USD',
      code: 'PARAM_OUT_OF_RANGE',
    });
    for (const v of [null, [], 'x', 25_500]) {
      expect(fxOverridesIssue(v)).toEqual({ field: 'value', code: 'VALIDATION_FAILED' });
    }
  });
});

describe('getPublicMonthlyRates `fx` – allowlist (OpenAPI PublicFxRates, contract)', () => {
  const base = {
    types: [{ label: 'Premium', monthlyFromVnd: 11_500_000 }],
    computedAt: '2026-11-17T10:00:00+07:00',
    taxIncluded: true,
  };
  const schema = SPEC.components.schemas.PublicFxRates!;

  it('present: base, source, asOf, rates – keys of the schema only; 4 codes at most', () => {
    const dto = publicMonthlyRatesDto({
      ...base,
      fx: {
        base: 'VND',
        source: 'vietcombank',
        asOf: '2026-11-17',
        // A code outside the allowlist that reached the DTO is still never sent.
        rates: { ...VCB_SAMPLE_RATES, EUR: 29_057.6 } as never,
      },
    });
    expect(dto.fx).toEqual({
      base: 'VND',
      source: 'vietcombank',
      asOf: '2026-11-17',
      rates: VCB_SAMPLE_RATES,
    });
    const fx = dto.fx as Record<string, unknown>;
    expect(Object.keys(fx).sort()).toEqual(Object.keys(schema.properties ?? {}).sort());
    for (const r of schema.required ?? []) expect(fx).toHaveProperty(r);
    const ratesSchema = (schema.properties?.rates as { properties: Record<string, unknown> })
      .properties;
    expect(Object.keys(ratesSchema).sort()).toEqual([...FX_CURRENCIES].sort());
    expect(SPEC.components.schemas.PublicMonthlyRates?.properties).toHaveProperty('fx');
    expect(SPEC.components.schemas.PublicMonthlyRates?.required).not.toContain('fx');
  });

  it('absent when there is no valid rate (null) – the rest of the answer unchanged', () => {
    const without = publicMonthlyRatesDto({ ...base, fx: null });
    expect(without).not.toHaveProperty('fx');
    expect(without).toEqual(publicMonthlyRatesDto(base));
  });
});

describe('FX_RATES_FETCH', () => {
  it('default: on (vietcombank) on staging/production, off elsewhere; explicit values; anything else refused', () => {
    expect(fxFetchModeFrom({ APP_ENV: 'production' })).toBe('vietcombank');
    expect(fxFetchModeFrom({ APP_ENV: 'staging' })).toBe('vietcombank');
    expect(fxFetchModeFrom({ APP_ENV: 'test' })).toBe('off');
    expect(fxFetchModeFrom({ APP_ENV: 'development' })).toBe('off');
    expect(fxFetchModeFrom({ APP_ENV: 'production', FX_RATES_FETCH: 'off' })).toBe('off');
    expect(fxFetchModeFrom({ APP_ENV: 'test', FX_RATES_FETCH: 'vietcombank' })).toBe('vietcombank');
    expect(() => fxFetchModeFrom({ FX_RATES_FETCH: 'https://evil.test' })).toThrow(
      /FX_RATES_FETCH/,
    );
  });
});
