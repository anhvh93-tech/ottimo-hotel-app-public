import type { MovePreview } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert } from '@ottimo/ui';
import { useId, type ReactNode } from 'react';
import { dayMonth } from '../../app/reservations';

const sum = (xs: Array<number | undefined>) => xs.reduce<number>((a, x) => a + (x ?? 0), 0);

/** More nights than this → the night-by-night table is folded (FE-S4-06: long stays, monthly). */
const NIGHTS_OPEN_MAX = 7;

/** "T5 22/10" (vi) / "Thu 22/10" – content-guide 4: dates on the Desk carry the weekday (FE-S4-05). */
function nightLabel(date: string, locale: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  const day =
    locale === 'vi'
      ? dow === 0
        ? 'CN'
        : `T${dow + 1}`
      : new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
          weekday: 'short',
          timeZone: 'UTC',
        }).format(new Date(`${date}T00:00:00Z`));
  return `${day} ${dayMonth(date)}`;
}

/**
 * S4-21 (ESC-019 A, US-024 AC5–AC7; BR-429 v0.3.5): the money of a B7/B8 change as the server will
 * write it (`previewMoveReservation` – one calc with `moveReservation`). Every figure comes from the
 * server; the desk reads it to the guest before ticking "Đã báo khách số tiền mới".
 * Layout (UXD review s4, FE-S4-03…08): title → pricing basis → repriced warning → nights (folded when
 * long) → totals (signed difference as the total row, pending FOC right under it) → deposit, balance.
 * Row figures are bare numbers (`vnd`, the column says "(đ)"); the total row carries the unit.
 * `stale`: an older result kept on screen (dimmed, `aria-busy`) while the new one is computed (FE-S4-08).
 */
export function MovePreviewBox({
  preview: p,
  ota,
  stale = false,
}: {
  preview: MovePreview;
  ota: boolean;
  stale?: boolean;
}) {
  const { t, vnd, money, locale } = useI18n();
  const ids = useId();
  const focFollow = sum(p.nights.map((n) => n.focVnd));
  const pendingFoc = sum(p.nights.map((n) => n.pendingFocVnd));
  const extraOld = p.extraPersonOldVnd ?? 0;
  const extraNew = p.extraPersonNewVnd ?? 0;
  const delta = p.folioDeltaVnd;
  const basis =
    ota && p.pricingBasis === 'new_room_rate'
      ? t('move.basis.ota')
      : t(`move.basis.${p.pricingBasis}`);
  const repriced = (p.warnings ?? []).some((w) => w.code === 'MANUAL_RATE_REPRICED');

  const nightsTable = (
    <table className="sum">
      <thead>
        <tr>
          <th scope="col">{t('move.col_night')}</th>
          <th scope="col" className="r">
            {t('move.col_old')}
          </th>
          <th scope="col" className="r">
            {t('move.col_new')}
          </th>
        </tr>
      </thead>
      <tbody>
        {p.nights.map((n) => (
          <tr key={n.date}>
            <td>{nightLabel(n.date, locale)}</td>
            <td className="r num">
              {n.oldRateVnd === null || n.oldRateVnd === undefined
                ? t('move.night_added')
                : vnd(n.oldRateVnd)}
            </td>
            <td className="r num">
              {vnd(n.newRateVnd)}
              {n.roomChangeDifferenceVnd ? (
                <div className="li-s">
                  {t('move.night_ota_diff', { amount: money(n.roomChangeDifferenceVnd) })}
                </div>
              ) : null}
              {n.suggestedRateVnd ? (
                <div className="li-s">
                  {t('move.suggested', { amount: money(n.suggestedRateVnd) })}
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  let nights: ReactNode = null;
  if (p.nights.length > NIGHTS_OPEN_MAX)
    nights = (
      <details>
        <summary>{t('move.nights_toggle', { n: p.nights.length })}</summary>
        {nightsTable}
      </details>
    );
  else if (p.nights.length) nights = nightsTable;

  return (
    <section
      className="card p-12 stack"
      aria-labelledby={`${ids}-h`}
      aria-busy={stale || undefined}
    >
      <h3 className="label-h" id={`${ids}-h`}>
        {t('move.preview_title')}
      </h3>
      {stale ? (
        <p className="li-s" role="status">
          {t('move.preview_loading')}
        </p>
      ) : null}
      <div className={stale ? 'stack stale' : 'stack'}>
        <p className="li-s">{basis}</p>
        {repriced ? <Alert tone="warn">{t('move.warn.MANUAL_RATE_REPRICED')}</Alert> : null}
        {nights}
        {p.removedNights?.length ? (
          <p className="li-s">
            {t('move.removed_nights', {
              n: p.removedNights.length,
              dates: p.removedNights.map((d) => nightLabel(d, locale)).join(', '),
            })}
          </p>
        ) : null}
        <table className="sum">
          <tbody>
            {p.roomTotalOldVnd !== undefined || p.roomTotalNewVnd !== undefined ? (
              <tr>
                <td>{t('move.room_total')}</td>
                <td className="r num">
                  {vnd(p.roomTotalOldVnd ?? 0)} → {vnd(p.roomTotalNewVnd ?? 0)}
                </td>
              </tr>
            ) : null}
            {p.losDiscountPct ? (
              <tr className="sub">
                <td colSpan={2}>{t('move.discount_los', { pct: p.losDiscountPct })}</td>
              </tr>
            ) : null}
            {p.returningGuestDiscountPct ? (
              <tr className="sub">
                <td colSpan={2}>
                  {t('move.discount_returning', { pct: p.returningGuestDiscountPct })}
                </td>
              </tr>
            ) : null}
            {extraOld || extraNew ? (
              <tr>
                <td>{t('move.extra_person')}</td>
                <td className="r num">
                  {vnd(extraOld)} → {vnd(extraNew)}
                </td>
              </tr>
            ) : null}
            {p.roomChangeDifferenceVnd ? (
              <tr>
                <td>{t('move.ota_difference')}</td>
                <td className="r num">+{vnd(p.roomChangeDifferenceVnd)}</td>
              </tr>
            ) : null}
            {focFollow ? (
              <tr>
                <td>{t('move.foc_follow')}</td>
                <td className="r num">−{vnd(focFollow)}</td>
              </tr>
            ) : null}
            <tr className="total">
              <td>
                {delta > 0
                  ? t('move.delta_up')
                  : delta < 0
                    ? t('move.delta_down')
                    : t('move.delta_zero')}
              </td>
              <td className="r num">
                {delta ? `${delta > 0 ? '+' : '−'}${money(Math.abs(delta))}` : ''}
              </td>
            </tr>
            {pendingFoc ? (
              <tr className="sub">
                <td colSpan={2}>{t('move.pending_foc', { amount: money(pendingFoc) })}</td>
              </tr>
            ) : null}
            {p.depositPaidVnd !== undefined ? (
              <tr className="sub">
                <td>{t('move.deposit_paid')}</td>
                <td className="r num">{vnd(p.depositPaidVnd)}</td>
              </tr>
            ) : null}
            {p.balanceDueAfterVnd !== undefined ? (
              <tr>
                <td>{t('move.balance_after')}</td>
                <td className="r num">{vnd(p.balanceDueAfterVnd)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
