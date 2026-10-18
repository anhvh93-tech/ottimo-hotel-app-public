import type { ApprovalRequest } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Chip } from '@ottimo/ui';
import { listApprovals } from '../../app/approvals';
import { appliedCappedText, approvalStatusText, autoCancelText } from '../../app/auditReason';
import { APPROVAL_TYPE, FOC_REASON } from '../../app/folio';
import { useLiveReload } from '../../app/live';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';

/** How many decided requests of one's own are shown under the queue. */
const SENT_SHOWN = 5;
const TONE = { approved: 'ok', rejected: 'bad', cancelled: 'neutral' } as const;

/**
 * QA 11.33 / FB-R2-ARC-FE-S4-02: H17 under the queue – the requests the viewer sent that are now decided
 * (MGR asks the owner to write a debt off above one night, BR-433). Each says how it ended: approved in part
 * (`approval.applied_capped`), closed by the system (`autoCancelReason`) or the plain status. H24 "Yêu cầu bạn đã
 * gửi" is the front desk's; a manager's overview shows the queue instead. Newest first, the first page of each
 * status (a recent summary, not a history).
 */
export function SentRequests() {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const { me } = useSession();
  const { state, reload } = useResource(
    () => listApprovals(propertyId, ['approved', 'rejected', 'cancelled'], { maxPages: 1 }),
    [propertyId],
  );
  useLiveReload(propertyId, reload);
  // Own request: `requestedById` when the server sends it, else the display name (as H24).
  const own = (a: ApprovalRequest) =>
    a.requestedById ? a.requestedById === me?.id : a.requestedBy === me?.displayName;
  const rows = (state.data ?? []).filter(own).slice(0, SENT_SHOWN);
  if (!rows.length) return null;
  return (
    <section aria-labelledby="appr-sent">
      <h2 className="grp-h" id="appr-sent">
        {t('approval.sent_recent')}
      </h2>
      <ul className="list-none">
        {rows.map((a) => {
          const capped = appliedCappedText(t, money, a);
          return (
            <li key={a.id} className="card appr-card">
              <div className="grow">
                <b>
                  {a.reservationCode} · {t(APPROVAL_TYPE[a.type] ?? 'nav.approvals')}
                  {a.amountVnd > 0 ? ` · ${vnd(a.amountVnd)}` : ''}
                </b>
                {FOC_REASON[a.reasonCode] ? (
                  <div className="li-s">{t(FOC_REASON[a.reasonCode]!)}</div>
                ) : null}
                {a.status === 'cancelled' && a.autoCancelReason ? (
                  <div className="li-s">{autoCancelText(t, a.autoCancelReason)}</div>
                ) : null}
                {capped ? <div className="li-s">{capped}</div> : null}
              </div>
              <Chip tone={TONE[a.status as keyof typeof TONE] ?? 'neutral'}>
                {approvalStatusText(t, a)}
              </Chip>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
