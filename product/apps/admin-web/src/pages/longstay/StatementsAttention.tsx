import { useI18n } from '@ottimo/i18n';
import { statementsApi } from '../../app/statements';
import { useResource } from '../../hooks/useResource';
import { NAV, isVisible } from '../../session/nav';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import type { ExtraAttentionLine } from '../dashboard/parts';
import { num } from './labels';

/**
 * H03 "Cần chú ý" (FB-INV-012, contract §6.4, BR-LS-02; UXD-189-08): statements due today and overdue, from
 * `listBillingPeriods?overdue=true`, as rows of the SAME list (same task row, counted in the badge). The row opens
 * S16 on the Overdue tab (Issued when only due today). Oak when due, Earth Brown when overdue – no extra red.
 * Nothing for people without S16, and nothing when the read fails (S16 shows the error).
 */
export function useStatementAttention(): ExtraAttentionLine[] {
  const session = useSession();
  const item = NAV.find((n) => n.id === 'statements')!;
  const allowed = isVisible(item, {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  });
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const res = useResource(
    async () =>
      allowed
        ? (await statementsApi.listBillingPeriods(propertyId, { overdue: true })).data.items
        : [],
    [propertyId, allowed],
  );
  const items = res.state.data ?? [];
  if (!allowed || !items.length) return [];
  const dueToday = items.filter((s) => s.alertLevel === 'due_today');
  const overdue = items.filter((s) => s.alertLevel && s.alertLevel !== 'due_today');
  const lines: ExtraAttentionLine[] = [];
  if (overdue.length) {
    const amount = overdue.reduce((sum, s) => sum + s.balanceVnd, 0);
    lines.push({
      key: 'stmt-overdue',
      text: t('stmt.attention_overdue_amount', { n: overdue.length, amount: num(amount) }),
      icon: 'alert',
      tone: 'soon',
      toneClass: 'stmt-attn stmt-attn-late',
      to: `${item.path}?tab=overdue`,
    });
  }
  if (dueToday.length)
    lines.push({
      key: 'stmt-due-today',
      text: t('stmt.attention_due_today', { n: dueToday.length }),
      icon: 'bill',
      tone: 'soon',
      toneClass: 'stmt-attn',
      to: `${item.path}?tab=issued`,
    });
  return lines;
}
