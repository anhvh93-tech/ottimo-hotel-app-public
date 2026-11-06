import { useI18n } from '@ottimo/i18n';
import { openRefundGroups, type OpenRefund } from '../../app/auditReason';

/**
 * V5-13 (ARC A1 (b), contract 0.3.13 `CheckoutSummary.openRefunds` / `Folio.totals.openRefunds`; UXD copy-v1.0.5
 * 9.12, U4, U5): rows under "Còn phải thu" with what OTTIMO still owes the guest back – every open refund request of
 * the stay (pending, escalated, approved and not fully paid out), whoever asked it.
 * - `refunds` undefined = the server did not send the field (older server) or the read failed: said in a dashed row
 *   (`checkout.pending_refund_unavailable`, muted, never blocking) – never shown as "nothing pending". An empty list
 *   (Σ = 0) = nothing pending: no row.
 * - `full` (Trả phòng step 3 and result, folio): the total, one dashed row per label group in the fixed order, then
 *   "may go down at approval". The contract gives no status per group, so that line is said whenever something is
 *   pending (a fixed amount is never promised – proposed to ARC: `awaitingDecision` per group, 0.3.14).
 * - `total` (Folio card of the booking drawer, U4): the total only.
 * The caller renders this only for roles that receive the field (FD+).
 */
export function OpenRefundRows({
  refunds,
  variant = 'full',
}: {
  refunds: readonly OpenRefund[] | undefined;
  variant?: 'full' | 'total';
}) {
  // FE-S4-03: bare numbers in rows – the unit is on the "Còn phải thu" total above.
  const { t, vnd } = useI18n();
  if (!refunds)
    return (
      <tr className="sub">
        <td colSpan={2}>{t('checkout.pending_refund_unavailable')}</td>
      </tr>
    );
  const groups = openRefundGroups(refunds);
  const total = groups.reduce((a, g) => a + g.vnd, 0);
  if (total <= 0) return null;
  if (variant === 'total')
    return (
      <tr className="sub">
        <td>{t('drawer.folio.open_refunds')}</td>
        <td className="r num">{vnd(total)}</td>
      </tr>
    );
  return (
    <>
      <tr>
        <td>{t('folio.open_refunds_total')}</td>
        <td className="r num">{vnd(total)}</td>
      </tr>
      {groups.map((g) => (
        <tr key={g.key} className="sub">
          <td>{t(g.key)}</td>
          <td className="r num">{vnd(g.vnd)}</td>
        </tr>
      ))}
      <tr className="sub">
        <td colSpan={2}>{t('approvals.refund_may_decrease')}</td>
      </tr>
    </>
  );
}

/** Σ `openVnd` of a stay; undefined when the field is absent (older server or unread). */
export function openRefundTotal(refunds: readonly OpenRefund[] | undefined): number | undefined {
  return refunds?.reduce((a, x) => a + x.openVnd, 0);
}
