import { Field } from '@ottimo/ui';

/**
 * FB-INV-012 §12.4 (H3, A101): `long_stay_cleaning_fee_by_room` = `{"<room no>": VND}`, default `{}`. Edited as one
 * price per room of the catalogue (blank = the room is not in the table → the standard `adhoc_cleaning_fee`), never
 * as raw JSON. Mirrors the server hook (1,000–5,000,000, a multiple of 1,000, a room of the property); the server stays
 * the judge (422 PARAM_OUT_OF_RANGE / VALIDATION_FAILED).
 */
type T = (key: string, args?: Record<string, string | number>) => string;

export const LSCF_KEY = 'long_stay_cleaning_fee_by_room';
// BE #200 `LONG_STAY_CLEANING_FEE_MIN_VND` / `_MAX_VND`: 1.000–5.000.000, a multiple of 1.000 (0 is refused).
const MIN = 1_000;
const MAX = 5_000_000;
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const entries = (v: unknown): Array<[string, number]> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.entries(v as Record<string, unknown>)
        .filter((e): e is [string, number] => typeof e[1] === 'number')
        .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    : [];

/** "101: 150.000 · 102: 150.000" – or "Not set" for `{}` (`short` in the history table, UXD-196-06). */
export function formatLscf(t: T, v: unknown, short = false): string {
  const e = entries(v);
  if (!e.length) return t(short ? 'params.lscf.empty_short' : 'params.lscf.empty');
  if (e.length > 4) return t('params.lscf.rooms_n', { n: e.length });
  return e.map(([room, n]) => `${room}: ${fmt(n)}`).join(' · ');
}

/** Prices shown grouped in thousands ("150.000"), like every VND field (UXD-196-07). */
export const lscfDraft = (v: unknown): Record<string, string> =>
  Object.fromEntries(entries(v).map(([room, n]) => [room, fmt(n)]));

/** On blur: "150000" → "150.000"; anything that is not a plain amount stays as typed (the check says why). */
const groupDraft = (raw: string) => {
  const s = raw.replace(/[.,\s]/g, '');
  return /^\d+$/.test(s) ? fmt(Number(s)) : raw;
};

export function parseLscfDraft(
  t: T,
  draft: Record<string, string>,
): { ok: true; value: Record<string, number> } | { ok: false; errors: Record<string, string> } {
  const value: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const [room, raw] of Object.entries(draft)) {
    const s = raw.replace(/[.,\s]/g, '');
    if (!s) continue;
    const n = /^\d+$/.test(s) ? Number(s) : NaN;
    if (!(n >= MIN && n <= MAX && n % 1000 === 0))
      errors[`room.${room}`] = t('params.lscf.price_invalid');
    else value[room] = n;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function LscfFields({
  t,
  rooms,
  draft,
  errors,
  onChange,
  standardPrice,
}: {
  t: T;
  rooms: string[];
  /** The effective `adhoc_cleaning_fee` – shown in the help and as the placeholder of a blank room. */
  standardPrice?: number | null;
  draft: Record<string, string>;
  errors: Record<string, string>;
  onChange: (room: string, v: string) => void;
}) {
  // Rooms of the catalogue, plus any room already in the table (shown so it can be cleared).
  const all = [...new Set([...rooms, ...Object.keys(draft)])].sort((a, b) =>
    a.localeCompare(b, 'en', { numeric: true }),
  );
  return (
    <fieldset className="stack">
      <legend className="label-h">{t('params.k.long_stay_cleaning_fee_by_room')}</legend>
      <p className="li-s">
        {typeof standardPrice === 'number'
          ? t('params.lscf.help', { price: `${fmt(standardPrice)} ${t('common.vnd_unit')}` })
          : t('params.lscf.help_noprice')}
      </p>
      {/* Two per row: a 7-digit price plus the VND suffix must fit (EN clipped at three). */}
      <div className="g-2">
        {all.map((room) => (
          <Field
            key={room}
            label={`${t('params.lscf.room')} ${room}`}
            error={errors[`room.${room}`] ?? errors[`value.${room}`]}
          >
            {(p) => (
              <div className="input-affix">
                <input
                  {...p}
                  className="input num"
                  inputMode="numeric"
                  placeholder={typeof standardPrice === 'number' ? fmt(standardPrice) : undefined}
                  value={draft[room] ?? ''}
                  onChange={(e) => onChange(room, e.target.value)}
                  onBlur={() => {
                    const v = draft[room] ?? '';
                    if (v && groupDraft(v) !== v) onChange(room, groupDraft(v));
                  }}
                />
                <span className="affix">{t('common.vnd_unit')}</span>
              </div>
            )}
          </Field>
        ))}
      </div>
    </fieldset>
  );
}
