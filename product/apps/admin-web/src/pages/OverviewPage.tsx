import type { ApprovalRequest, Role } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Icon } from '@ottimo/ui';
import { Link } from 'react-router-dom';
import { APPROVAL_TYPE } from '../app/folio';
import { Code } from '../app/mono';
import { dayMonth } from '../app/reservations';
import { Page, Topbar } from '../components/AppShell';
import type { ResourceState } from '../hooks/useResource';
import { usePropertyId, useSession } from '../session/SessionProvider';
import { AttentionBlock, LiveBadge, SkeletonRows, formatPct } from './dashboard/parts';
import { useDashboard } from './dashboard/useDashboard';
import { Kpi } from './TodayPage';

type Variant = 'mgmt' | 'lead' | 'desk';
const STATUS_TONE = {
  pending: 'warn',
  escalated: 'warn',
  approved: 'ok',
  rejected: 'bad',
  cancelled: 'neutral',
} as const;

/** H24 24.2 – what the "Cần duyệt" block holds for each role. */
export function overviewVariant(roles: Role[]): Variant {
  if (roles.includes('owner') || roles.includes('manager')) return 'mgmt';
  return roles.includes('front_desk_lead') ? 'lead' : 'desk';
}

/**
 * H24 Tổng quan (S02; phone first, same data on the desk): Cần duyệt → Cần chú ý → Đêm nay
 * (FB-R1-UXR-UXD-03), live over SSE. ADR/RevPAR are R3 – not drawn. Approving opens H17 (password, R2) –
 * never one tap here. "Tonight" = `TonightKpi.businessDate` (US-010 AC3), not the phone's clock. Each block
 * loads and fails on its own: a KPI error never hides "Cần chú ý" and the other way round.
 *
 * By role (H24 24.2 – the server filters what each role may receive: `listApprovalRequests` x-scope,
 * `listAttentionItems` BR-907): OWN everything; MGR the same minus the FOC alert; FDL "Cần duyệt" = the
 * requests within their limit that they may decide (not their own), no monthly amounts / FOC alert; FD sees
 * tonight's KPIs and operational alerts, and instead of "Cần duyệt" only the status of the requests they sent
 * (FD cannot open H17 – rows are not links).
 */
export function OverviewPage() {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const { roles, me } = useSession();
  const variant = overviewVariant(roles);
  const d = useDashboard(propertyId, { approvals: true });
  const k = d.kpi.data;
  const all = d.approvals!;
  // Own request: `requestedById` (contract-ahead R3, used only when present), else the display name.
  const own = (a: ApprovalRequest) =>
    a.requestedById ? a.requestedById === me?.id : a.requestedBy === me?.displayName;
  const rows = all.data
    ? variant === 'desk'
      ? all.data
          .filter(own)
          .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
          .slice(0, 5)
      : all.data.filter(
          (a) => ['pending', 'escalated'].includes(a.status) && (variant === 'mgmt' || !own(a)),
        )
    : undefined;
  const approvals = { ...all, data: rows } as ResourceState<ApprovalRequest[]>;

  return (
    <>
      <Topbar
        title={t('nav.overview')}
        sub={k ? t('ov.subtitle', { date: dayMonth(k.businessDate) }) : undefined}
        actions={<LiveBadge stale={d.stale} />}
      />
      <Page>
        <div className="cols-2">
          <div>
            <section aria-labelledby="ov-appr">
              <h2 className="grp-h" id="ov-appr">
                {variant === 'desk'
                  ? t('ov.my_requests_n', { n: rows?.length ?? 0 })
                  : t('ov.approvals_n', { n: rows?.length ?? 0 })}
              </h2>
              <Approvals state={approvals} onRetry={d.reload.approvals} mine={variant === 'desk'} />
            </section>
            <section aria-labelledby="ov-attn">
              <h2 className="grp-h" id="ov-attn">
                {t('ov.attention_n', { n: d.attention.data?.length ?? 0 })}
              </h2>
              <AttentionBlock
                compact
                state={d.attention}
                onReload={d.reload.attention}
                emptyTitleKey="ov.attn_empty_title"
                emptyBodyKey="ov.attn_empty_body"
              />
            </section>
          </div>
          <section aria-labelledby="ov-tonight">
            <h2 className="grp-h" id="ov-tonight">
              {t('ov.tonight')}
            </h2>
            {!k && d.kpi.status === 'error' ? (
              <Alert
                tone="bad"
                title={t('ov.kpi_error')}
                actions={
                  <Button size="sm" onClick={d.reload.kpi}>
                    {t('common.retry')}
                  </Button>
                }
              >
                {t('common.error_network_body')}
              </Alert>
            ) : !k ? (
              <SkeletonRows rows={2} height={80} />
            ) : (
              <>
                <div className="kpis two">
                  <Kpi
                    wide
                    label={t('today.kpi_occupancy')}
                    value={formatPct(locale, k.occupancyPct)}
                    note={t('today.kpi_occupancy_note', {
                      sold: k.occupiedRooms,
                      sellable: k.availableRoomsNet,
                      blocked: k.oooRooms ?? 0,
                    })}
                  />
                  <Kpi
                    label={t('ov.kpi_arr_dep')}
                    value={`${k.arrivals ?? 0} / ${k.departures ?? 0}`}
                  />
                  <Kpi label={t('today.kpi_in_house')} value={k.inHouse ?? 0} />
                </div>
                <p className="caption mt-8">{t('ov.kpi_note')}</p>
              </>
            )}
          </section>
        </div>
      </Page>
    </>
  );
}

/**
 * "Cần duyệt" – pending/escalated requests; each row opens H17 where the decision is taken. `mine` (FD): the
 * requests the desk sent, with their status, as plain rows.
 */
function Approvals({
  state,
  onRetry,
  mine,
}: {
  state: ResourceState<ApprovalRequest[]>;
  onRetry: () => void;
  mine?: boolean;
}) {
  const { t, money } = useI18n();
  const rows = state.data;
  if (!rows && state.status === 'error')
    return (
      <Alert
        tone="bad"
        title={t('ov.approvals_error')}
        actions={
          <Button size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      >
        {t('common.error_network_body')}
      </Alert>
    );
  if (!rows) return <SkeletonRows rows={1} height={56} />;
  if (!rows.length)
    return <p className="li-s">{t(mine ? 'ov.my_requests_empty' : 'ov.approvals_empty')}</p>;
  return (
    <ul className="list-none stack">
      {rows.map((a) => {
        const body = (
          <>
            <span className="ic">
              <Icon name="check" />
            </span>
            <div className="grow">
              <div className="li-t">
                {t('ov.approval_item', {
                  what: t(APPROVAL_TYPE[a.type] ?? 'nav.approvals'),
                  amount: money(a.amountVnd),
                })}
              </div>
              <div className="li-s">
                <Code>{a.reservationCode}</Code>
                {mine ? '' : ` · ${a.requestedBy}`}
                {a.reasonNote ? ` · "${a.reasonNote}"` : ''}
              </div>
              {mine ? (
                <div className="mt-4">
                  <Chip tone={STATUS_TONE[a.status]}>{t(`approval.status.${a.status}`)}</Chip>
                </div>
              ) : null}
            </div>
          </>
        );
        return (
          <li key={a.id}>
            {mine ? (
              <div className={`task ${a.status === 'rejected' ? 'urgent' : 'soon'}`}>{body}</div>
            ) : (
              <Link className="task soon rowlink" to="/approvals">
                {body}
                <Icon name="chevron" />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
