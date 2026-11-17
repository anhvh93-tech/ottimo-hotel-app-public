import { useI18n } from '@ottimo/i18n';
import { Icon } from '@ottimo/ui';
import { Link } from 'react-router-dom';
import { statementsApi } from '../../app/statements';
import { useNarrow } from '../../hooks/useMedia';
import { useResource } from '../../hooks/useResource';
import { NAV, isVisible } from '../../session/nav';
import { usePropertyId, useSession } from '../../session/SessionProvider';

/**
 * H03 "Cần chú ý" (FB-INV-012, contract §6.4, BR-LS-02): statements due today and overdue, from
 * `listBillingPeriods?overdue=true`. No push notification this round. Hidden for people without S16, and when a
 * read fails (the statements screen shows the error) – the rest of the attention list stays usable.
 */
export function StatementsAttention() {
  const session = useSession();
  const item = NAV.find((n) => n.id === 'statements')!;
  const allowed = isVisible(item, {
    roles: session.roles,
    screens: session.screens,
    deviceTrusted: session.deviceTrusted,
  });
  if (!allowed) return null;
  return <Inner path={item.path} />;
}

function Inner({ path }: { path: string }) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const narrow = useNarrow();
  const res = useResource(
    async () => (await statementsApi.listBillingPeriods(propertyId, { overdue: true })).data.items,
    [propertyId],
  );
  const items = res.state.data;
  if (!items?.length) return null;
  const dueToday = items.filter((s) => s.alertLevel === 'due_today').length;
  const overdue = items.length - dueToday;
  const urgent = items.some((s) => s.alertLevel === 'alert' || s.alertLevel === 'escalate');
  const text = [
    dueToday ? t('stmt.attention_due_today', { n: dueToday }) : null,
    overdue ? t('stmt.attention_overdue', { n: overdue }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const ic = (
    <span className="ic">
      <Icon name={urgent ? 'alert' : 'bill'} />
    </span>
  );
  const body = (
    <div className="grow">
      <div className="li-t">{text}</div>
    </div>
  );
  // Same row as the other "Cần chú ý" lines (DS 6.20, FE-S4-27): whole-row link on a phone, "Mở" on a desk.
  return (
    <ul className="list-none stack mt-8" data-attention="statements">
      {narrow ? (
        <li>
          <Link className="task warn rowlink" to={path}>
            {ic}
            {body}
            <Icon name="chevron" />
          </Link>
        </li>
      ) : (
        <li className="task warn">
          {ic}
          {body}
          <Link className="btn sm" to={path}>
            {t('today.open')}
          </Link>
        </li>
      )}
    </ul>
  );
}
