import type { RegistrationSummary } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Chip, Icon, StateView } from '@ottimo/ui';
import { api } from '../../app/api';
import { useLiveReload } from '../../app/live';
import { Code } from '../../app/mono';
import { useStaffRoomLabel } from '../../app/rooms';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useNow } from '../../hooks/useNow';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';

type T = (key: string, args?: Record<string, string | number>) => string;

function durationText(t: T, ms: number) {
  const total = Math.floor(ms / 60_000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? t('common.duration_hm', { h, m }) : t('common.duration_m', { m });
}

/** Overdue first, then the earliest deadline; no deadline yet last. */
function byUrgency(a: RegistrationSummary, b: RegistrationSummary) {
  const over = Number(b.deadlineLabel === 'overdue') - Number(a.deadlineLabel === 'overdue');
  if (over) return over;
  if (a.deadlineAt && b.deadlineAt) return a.deadlineAt.localeCompare(b.deadlineAt);
  return Number(!a.deadlineAt) - Number(!b.deadlineAt);
}

/**
 * H14 on a device the owner has not granted (UXR S4 P-06, J6 "Khai báo quá hạn – làm ngay" from H24 on the
 * owner's phone): the list of bookings to register – room, booking code, guest's display name, status, IDs
 * received, deadline – so the owner knows which ones to chase. Nothing C3: `listRegistrations` returns no ID data
 * and is not a trusted-device operation (rbac S09); the detail (IDs, portal data) still opens only on a granted
 * desk computer, so rows are not links.
 * SEC `s4-SEC.md` C.11 (agreed 18/10) – kept only while: (1) no ID field is added here or to `RegistrationSummary`
 * without SEC; (2) rows stay non-clickable; (3) the list is never written to local/session storage or IndexedDB
 * (memory only – `useResource`). Tests: `s4-feb-uxr.test.tsx` "SEC C.11 conditions".
 */
export function RegistrationReadOnly() {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const room = useStaffRoomLabel(propertyId);
  const now = useNow(60_000);
  const { state, reload } = useResource(
    async () => (await api.listRegistrations({ propertyId }, 'action_needed')).data.data,
    [propertyId],
  );
  useLiveReload(propertyId, reload);
  const rows = [...(state.data ?? [])].sort(byUrgency);

  const deadline = (r: RegistrationSummary) => {
    if (r.deadlineLabel === 'at_checkin') return t('reg2.at_checkin');
    if (r.deadlineLabel === 'needs_update') return t('status.reg.needs_update');
    if (!r.deadlineAt) return t('reg2.deadline_pending');
    if (r.deadlineLabel === 'overdue')
      return t('reg.deadline_overdue', {
        duration: durationText(t, Math.max(0, now - Date.parse(r.deadlineAt))),
      });
    return `${t('reg.deadline', { time: dateTime(r.deadlineAt) })} · ${t('reg.deadline_left', {
      duration: durationText(t, Math.max(0, Date.parse(r.deadlineAt) - now)),
    })}`;
  };

  return (
    <>
      <Topbar title={t('nav.registration')} />
      <Page>
        <Alert tone="warn" icon="monitor" title={t('device.blocked_title')}>
          {t('reg.untrusted_body')}
        </Alert>
        {state.status === 'error' && !state.data ? (
          <ErrorBlock
            titleKey="reg2.error_title"
            error={state.error}
            onRetry={reload}
            autoRetrySeconds={state.autoRetrySeconds}
          />
        ) : !state.data ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <StateView icon="check" title={t('reg2.empty_title')}>
            {t('reg2.empty_body')}
          </StateView>
        ) : (
          <ul className="list-none stack" aria-label={t('nav.registration')}>
            {rows.map((r) => {
              const over = r.deadlineLabel === 'overdue';
              return (
                <li key={r.id} className={`task ${over ? 'urgent' : 'soon'}`}>
                  <span className="ic">
                    <Icon name="id" />
                  </span>
                  <div className="grow">
                    <div className="li-t">
                      {[r.roomNo ? room(r.roomNo) : '', r.guestDisplayName ?? '']
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    <div className="li-s">
                      <Code>{r.reservationCode}</Code> · {t(`status.reg.${r.status}`)} ·{' '}
                      {t('reg.untrusted_ids', { n: r.submittedCount, total: r.requiredCount })}
                    </div>
                    <div className="mt-4">
                      {over ? (
                        <Chip tone="bad" icon="alert">
                          {deadline(r)}
                        </Chip>
                      ) : (
                        <span className="li-s">{deadline(r)}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Page>
    </>
  );
}
