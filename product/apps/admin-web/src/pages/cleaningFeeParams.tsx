import { Field } from '@ottimo/ui';

/**
 * FB-INV-012 §12.4 (H3, A101): `long_stay_cleaning_fee_by_room` = `{"<room no>": VND}`, default `{}`. Edited as one
 * price per room of the catalogue (blank = the room is not in the table → the standard `adhoc_cleaning_fee`), never
 * as raw JSON. Mirrors the server hook (0–5,000,000, a multiple of 1,000, a room of the property); the server stays
 * the judge (422 PARAM_OUT_OF_RANGE / VALIDATION_FAILED).
 */
type T = (key: string, args?: Record<string, string | number>) => string;

export const LSCF_KEY = 'long_stay_cleaning_fee_by_room';
const MAX = 5_000_000;
const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const entries = (v: unknown): Array<[string, number]> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.entries(v as Record<string, unknown>)
        .filter((e): e is [string, number] => typeof e[1] === 'number')
        .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    : [];

/** "101: 150.000 · 102: 150.000" – or "Not set" for `{}`. */
export function formatLscf(t: T, v: unknown): string {
  const e = entries(v);
  if (!e.length) return t('params.lscf.empty');
  if (e.length > 4) return t('params.lscf.rooms_n', { n: e.length });
  return e.map(([room, n]) => `${room}: ${fmt(n)}`).join(' · ');
}

export const lscfDraft = (v: unknown): Record<string, string> =>
  Object.fromEntries(entries(v).map(([room, n]) => [room, String(n)]));

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
    if (!(n >= 0 && n <= MAX && n % 1000 === 0))
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
}: {
  t: T;
  rooms: string[];
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
      <p className="li-s">{t('params.lscf.help')}</p>
      <div className="g-3">
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
                  value={draft[room] ?? ''}
                  onChange={(e) => onChange(room, e.target.value)}
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
