import { Field } from '@ottimo/ui';

/**
 * BUG-R5-012 (FB-INV-012, contract §3): the three monthly-statement parameters read and edit as fields, never as raw
 * JSON. Shapes and limits mirror the BE setParameter hooks (`statement-math.ts`: unitPriceIssue, vatRateIssue,
 * rulesIssue); the server stays the judge (422 PARAM_OUT_OF_RANGE / VALIDATION_FAILED on `value.<field>`).
 */
type T = (key: string, args?: Record<string, string | number>) => string;

export const STATEMENT_PARAM_KEYS = [
  'utility_unit_price',
  'utility_vat_rate',
  'monthly_statement_rules',
] as const;
export type StatementParamKey = (typeof STATEMENT_PARAM_KEYS)[number];
export const isStatementParam = (key: string): key is StatementParamKey =>
  (STATEMENT_PARAM_KEYS as readonly string[]).includes(key);

type Def =
  | {
      path: string;
      label: string;
      kind: 'int';
      min: number;
      max: number;
      suffix?: (t: T) => string;
    }
  | {
      path: string;
      label: string;
      kind: 'select';
      options: (t: T) => { value: string; label: string }[];
      help?: string;
    };

const VAT_RATES = [0, 5, 8, 10];
const ROUNDING = [1, 100, 1000];
const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
const pctOptions = () => VAT_RATES.map((r) => ({ value: String(r), label: `${r}%` }));
const lowerFirst = (x: string) => x.charAt(0).toLocaleLowerCase() + x.slice(1);
const roundingLabel = (t: T, n: number) =>
  n === 1 ? t('params.stmt.rounding_1') : t('params.stmt.rounding_n', { amount: vnd(n) });

const DEFS: Record<StatementParamKey, Def[]> = {
  utility_unit_price: [
    {
      path: 'electricityVndPerKwh',
      label: 'params.stmt.electricity',
      kind: 'int',
      min: 1,
      max: 20_000,
      suffix: (t) => t('params.stmt.per_kwh'),
    },
    {
      path: 'waterVndPerM3',
      label: 'params.stmt.water',
      kind: 'int',
      min: 1,
      max: 200_000,
      suffix: (t) => t('params.stmt.per_m3'),
    },
  ],
  utility_vat_rate: [
    {
      path: 'electricity',
      label: 'params.stmt.vat_electricity',
      kind: 'select',
      options: pctOptions,
    },
    { path: 'water', label: 'params.stmt.vat_water', kind: 'select', options: pctOptions },
  ],
  monthly_statement_rules: [
    {
      path: 'rentTiming',
      label: 'params.stmt.rent_timing',
      kind: 'select',
      help: 'params.stmt.rent_help',
      options: (t) => [
        { value: 'advance', label: t('params.stmt.rent_advance') },
        { value: 'arrears', label: t('params.stmt.rent_arrears') },
      ],
    },
    { path: 'dueDay', label: 'params.stmt.due_day', kind: 'int', min: 1, max: 28 },
    {
      path: 'totalRoundingVnd',
      label: 'params.stmt.rounding',
      kind: 'select',
      options: (t) => ROUNDING.map((n) => ({ value: String(n), label: roundingLabel(t, n) })),
    },
    {
      path: 'partialFirstMonthRent',
      label: 'params.stmt.partial',
      kind: 'select',
      options: (t) => [
        { value: 'at_checkin', label: t('params.stmt.partial_at_checkin') },
        { value: 'first_statement', label: t('params.stmt.partial_first_statement') },
      ],
    },
    {
      path: 'readingWindow.daysBeforeMonthEnd',
      label: 'params.stmt.window_before',
      kind: 'int',
      min: 0,
      max: 7,
      suffix: (t) => t('params.unit_days'),
    },
    {
      path: 'readingWindow.daysAfter',
      label: 'params.stmt.window_after',
      kind: 'int',
      min: 0,
      max: 7,
      suffix: (t) => t('params.unit_days'),
    },
    {
      path: 'readingWindow.lateMaxDays',
      label: 'params.stmt.late_max',
      kind: 'int',
      min: 0,
      max: 31,
      suffix: (t) => t('params.unit_days'),
    },
  ],
};

const HELP: Partial<Record<StatementParamKey, string>> = {
  utility_unit_price: 'params.stmt.price_help',
  utility_vat_rate: 'params.stmt.vat_help',
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const get = (v: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (isObj(o) ? o[k] : undefined), v);

/** One line for the table and the history (BUG-R5-012); null when the stored value has an unexpected shape. */
export function formatStatementParam(t: T, key: StatementParamKey, v: unknown): string | null {
  if (!isObj(v)) return null;
  const n = (x: unknown) => (typeof x === 'number' ? x : null);
  if (key === 'utility_unit_price') {
    const e = n(v.electricityVndPerKwh);
    const w = n(v.waterVndPerM3);
    return e === null || w === null
      ? null
      : t('params.stmt.price_value', { electricity: vnd(e), water: vnd(w) });
  }
  if (key === 'utility_vat_rate') {
    const e = n(v.electricity);
    const w = n(v.water);
    return e === null || w === null
      ? null
      : t('params.stmt.vat_value', { electricity: e, water: w });
  }
  const w = isObj(v.readingWindow) ? v.readingWindow : null;
  const due = n(v.dueDay);
  const rounding = n(v.totalRoundingVnd);
  if (!w || due === null || rounding === null) return null;
  return [
    // UXD 195-04: summary phrases of their own, each readable alone, lower-case.
    v.rentTiming === 'arrears'
      ? t('params.stmt.sum_rent_arrears')
      : t('params.stmt.sum_rent_advance'),
    t('params.stmt.due_value', { day: due }),
    rounding === 1
      ? t('params.stmt.sum_rounding_1')
      : lowerFirst(t('params.stmt.rounding_n', { amount: vnd(rounding) })),
    v.partialFirstMonthRent === 'first_statement'
      ? t('params.stmt.sum_partial_first_statement')
      : t('params.stmt.sum_partial_at_checkin'),
    t('params.stmt.window_value', {
      before: n(w.daysBeforeMonthEnd) ?? 0,
      after: n(w.daysAfter) ?? 0,
      late: n(w.lateMaxDays) ?? 10,
    }),
  ].join(' · ');
}

export type StatementDraft = Record<string, string>;

/** The form state: one string per field path, from the value in force (or the contract default for a gap). */
export function statementDraft(key: StatementParamKey, v: unknown): StatementDraft {
  const out: StatementDraft = {};
  for (const d of DEFS[key]) {
    const x = get(v, d.path);
    out[d.path] =
      x === undefined || x === null
        ? d.path === 'readingWindow.lateMaxDays'
          ? '10'
          : ''
        : String(x);
  }
  return out;
}

/** Field checks of the BE hook; errors keyed `value.<path>` like the server's field errors. */
export function parseStatementDraft(
  t: T,
  key: StatementParamKey,
  draft: StatementDraft,
): { ok: true; value: Record<string, unknown> } | { ok: false; errors: Record<string, string> } {
  const value: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const d of DEFS[key]) {
    const raw = (draft[d.path] ?? '').trim();
    let x: unknown;
    if (d.kind === 'int') {
      const digits = raw.replace(/[.\s]/g, '');
      const n = /^\d+$/.test(digits) ? Number(digits) : NaN;
      if (!raw) errors[`value.${d.path}`] = t('common.required');
      else if (!Number.isSafeInteger(n) || n < d.min || n > d.max)
        errors[`value.${d.path}`] = t('params.stmt.range', { min: vnd(d.min), max: vnd(d.max) });
      x = n;
    } else {
      const opt = d.options(t).find((o) => o.value === raw);
      if (!opt) errors[`value.${d.path}`] = t('common.required');
      x = /^\d+$/.test(raw) ? Number(raw) : raw;
    }
    const [head, tail] = d.path.split('.') as [string, string | undefined];
    if (tail) value[head] = { ...(value[head] as Record<string, unknown> | undefined), [tail]: x };
    else value[head] = x;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function StatementParamFields({
  t,
  paramKey,
  draft,
  errors,
  onChange,
}: {
  t: T;
  paramKey: StatementParamKey;
  draft: StatementDraft;
  errors: Record<string, string>;
  onChange: (path: string, value: string) => void;
}) {
  const help = HELP[paramKey];
  return (
    <fieldset className="stmt-param-fields" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="sr-only">{t('params.new_value')}</legend>
      {help ? <p className="muted">{t(help)}</p> : null}
      <div className="g-2">
        {DEFS[paramKey].map((d) => (
          <Field
            key={d.path}
            label={t(d.label)}
            required
            help={
              d.kind === 'int'
                ? t('params.stmt.range', { min: vnd(d.min), max: vnd(d.max) })
                : d.help
                  ? t(d.help)
                  : undefined
            }
            error={errors[`value.${d.path}`]}
          >
            {(p) =>
              d.kind === 'select' ? (
                <select
                  {...p}
                  className="input"
                  value={draft[d.path] ?? ''}
                  onChange={(e) => onChange(d.path, e.target.value)}
                >
                  {d.options(t).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="input-affix">
                  <input
                    {...p}
                    className="input num"
                    inputMode="numeric"
                    value={draft[d.path] ?? ''}
                    onChange={(e) => onChange(d.path, e.target.value)}
                  />
                  {d.suffix ? <span className="affix">{d.suffix(t)}</span> : null}
                </div>
              )
            }
          </Field>
        ))}
      </div>
    </fieldset>
  );
}
