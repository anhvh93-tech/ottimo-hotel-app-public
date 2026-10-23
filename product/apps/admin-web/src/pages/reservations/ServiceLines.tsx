import type { Folio, FolioLine, RetainLine } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Chip, Field } from '@ottimo/ui';
import { lineLabel, signed } from '../../app/folio';

/** A service line the desk may keep on cancel / no-show (`CancellationQuote.serviceLines` shape). */
export interface ServiceLine {
  lineId: string;
  category: FolioLine['category'];
  labelKey?: string;
  labelParams?: Record<string, string | number>;
  serviceDate?: string;
  amountVnd: number;
  performed?: boolean;
}
export type KeepState = Record<string, { on: boolean; reason: string }>;

/** 0.3.7 D1 (S4-08, ARC giả định DOM): categories of a "service line" (reversed unless kept). */
export const SERVICE_CATEGORIES: ReadonlyArray<FolioLine['category']> = [
  'early_checkin',
  'late_checkout',
  'minibar',
  'fnb',
  'laundry',
  'cleaning',
  'service_fee',
  'utilities',
];

/** Lines kept with a usable reason – sent identically to the dry run and to the write. */
export function retainLinesOf(keep: KeepState): RetainLine[] {
  return Object.entries(keep)
    .filter(([, k]) => k.on && k.reason.trim().length >= 3)
    .map(([lineId, k]) => ({ lineId, reason: k.reason.trim() }));
}
/** A ticked line without its reason (≥ 3 characters) blocks the irreversible button. */
export const keepIncomplete = (keep: KeepState) =>
  Object.values(keep).some((k) => k.on && k.reason.trim().length < 3);

/**
 * No-show has no dry run (0.3.7 D1): the live service lines come from `getFolio` – posted, not a
 * reversal, not reversed – with their approved FOC/discount netted in. `performed` (only a hint: the desk
 * decides) follows the server's no-show rule: service day **≤** the BUSINESS day (0.3.7 bổ sung 3,
 * BR-309-09; R3-Q39 #12 – R2 used `<` and the calendar day, so a pickup of today was never hinted by day).
 */
export function serviceLinesOfFolio(folio: Folio, businessDay: string): ServiceLine[] {
  const posted = folio.lines.filter((l) => l.lineState === 'posted');
  const reversed = new Set(posted.map((l) => l.reversalOfId).filter(Boolean));
  return posted
    .filter(
      (l) => SERVICE_CATEGORIES.includes(l.category) && !l.reversalOfId && !reversed.has(l.id),
    )
    .map((l) => {
      const ext = l as FolioLine & {
        labelKey?: string;
        labelParams?: Record<string, string | number>;
      };
      return {
        lineId: l.id,
        category: l.category,
        labelKey: ext.labelKey,
        labelParams: ext.labelParams,
        serviceDate: l.serviceDate,
        amountVnd:
          l.amountVnd +
          posted.filter((x) => x.relatedLineId === l.id).reduce((a, x) => a + x.amountVnd, 0),
        performed: !!l.serviceDate && l.serviceDate <= businessDay,
      };
    });
}

/**
 * S4-08 (BR-309 v0.3.4 – cancel and no-show): every service line is reversed unless the desk keeps
 * it (already used, or already cost OTTIMO money with a third party) – with a reason.
 */
export function ServiceLinesPicker({
  lines,
  keep,
  onChange,
  showErrors,
  summary,
}: {
  lines: ServiceLine[];
  keep: KeepState;
  onChange: (k: KeepState) => void;
  showErrors: boolean;
  summary?: { reversedVnd?: number; retainedVnd?: number };
}) {
  const { t, vnd, money } = useI18n();
  if (!lines.length) return null;
  // FE-S4-14: a ticked line without its reason is not kept yet → the summary (which would contradict the
  // tick) gives way to what is missing; the reason field says it as help from the tick on.
  const waiting = keepIncomplete(keep);
  const set = (id: string, patch: Partial<KeepState[string]>) =>
    onChange({ ...keep, [id]: { on: false, reason: '', ...keep[id], ...patch } });
  return (
    <fieldset className="fieldset-plain stack">
      <legend className="label-h">{t('svc.title')}</legend>
      <p className="li-s">{t('svc.help')}</p>
      {lines.map((l) => {
        const k = keep[l.lineId];
        const label = lineLabel(t, {
          id: l.lineId,
          category: l.category,
          description: l.category,
          serviceDate: l.serviceDate,
          quantity: 1,
          unitPriceVnd: l.amountVnd,
          amountVnd: l.amountVnd,
          lineState: 'posted',
          postedAt: '',
          labelKey: l.labelKey,
          labelParams: l.labelParams,
        } as FolioLine);
        return (
          <div key={l.lineId} className="stack">
            {/* FE-S4-16: [tick + line] [chip] [amount] – the accessible name stays `svc.keep`. */}
            <div className="svc-line">
              <label className="check">
                <input
                  type="checkbox"
                  aria-label={t('svc.keep', { label, amount: money(l.amountVnd) })}
                  checked={!!k?.on}
                  onChange={(e) => set(l.lineId, { on: e.target.checked })}
                />
                <span>{label}</span>
              </label>
              <span>
                {l.performed ? (
                  <Chip tone="neutral" icon="check">
                    {t('svc.performed')}
                  </Chip>
                ) : null}
              </span>
              <span className="amt num">{signed(vnd, l.amountVnd)}</span>
            </div>
            {k?.on ? (
              <Field
                label={t('svc.reason')}
                required
                help={t('svc.reason_needed')}
                error={
                  showErrors && k.reason.trim().length < 3
                    ? t('field_error.reason_required')
                    : undefined
                }
              >
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    maxLength={300}
                    value={k.reason}
                    onChange={(e) => set(l.lineId, { reason: e.target.value })}
                  />
                )}
              </Field>
            ) : null}
          </div>
        );
      })}
      {summary && waiting ? (
        <p className="li-s" role="status">
          {t('svc.reason_needed')}
        </p>
      ) : summary && (summary.reversedVnd !== undefined || summary.retainedVnd !== undefined) ? (
        <p className="li-s num">
          {t('svc.summary', {
            reversed: money(summary.reversedVnd ?? 0),
            retained: money(summary.retainedVnd ?? 0),
          })}
        </p>
      ) : null}
    </fieldset>
  );
}
