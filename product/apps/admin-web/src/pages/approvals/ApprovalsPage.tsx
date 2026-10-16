import { isApiError, type ApprovalRequest } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, StateView } from '@ottimo/ui';
import { useState } from 'react';
import { api } from '../../app/api';
import { useLiveReload } from '../../app/live';
import { timeHHmm } from '../../app/dates';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';

export const APPROVAL_TYPE: Record<string, string> = {
  foc: 'foc.kind_foc',
  special_discount: 'foc.kind_discount',
  refund: 'refund.title',
  checkin_room_not_ready: 'checkin.cond.room_ready',
  late_checkout_conflict: 'drawer.action.late_checkout',
  no_show_restore: 'drawer.action.restore_no_show',
};
export const FOC_REASON: Record<string, string> = {
  regular_vip: 'foc.r_regular',
  room_ready_no_impact: 'foc.r_room_ready',
  service_recovery: 'foc.r_recovery',
  long_stay_guest: 'foc.r_long',
  other: 'foc.r_other',
};
const STATUS_TONE = {
  pending: 'warn',
  escalated: 'warn',
  approved: 'ok',
  rejected: 'bad',
  cancelled: 'neutral',
} as const;

/**
 * H17 17.2 Cần duyệt (S23, US-007, SM-10): pending/escalated requests with amount, reason, sender and
 * the approver's remaining monthly limit; approve / reject by re-entering the login password (R2 – PIN
 * from R3). Someone else deciding first → `approval.already_done` + reload.
 */
export function ApprovalsPage() {
  const { t, vnd, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { online, since } = useOnline();
  const { state, reload } = useResource(
    async () =>
      (await api.listApprovalRequests({ propertyId })).data.data.filter((a) =>
        ['pending', 'escalated'].includes(a.status),
      ),
    [propertyId],
  );
  useLiveReload(propertyId, reload);
  const [deciding, setDeciding] = useState<{ a: ApprovalRequest; approve: boolean } | null>(null);
  const rows = state.data ?? [];

  return (
    <>
      <Topbar title={t('nav.approvals')} />
      <Page>
        {!online ? (
          <Alert tone="warn">{t('approval.offline', { time: since ? timeHHmm(since) : '' })}</Alert>
        ) : null}
        {state.status === 'error' && !state.data ? (
          <ErrorBlock
            titleKey="approval.error_title"
            error={state.error}
            onRetry={reload}
            autoRetrySeconds={state.autoRetrySeconds}
          />
        ) : !state.data ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <StateView icon="check" title={t('approval.empty_title')}>
            {t('approval.empty_body')}
          </StateView>
        ) : (
          <ul className="list-plain">
            {rows.map((a) => (
              <li key={a.id} className="card">
                <div className="row wrap">
                  <div className="grow">
                    <b>
                      {a.reservationCode} · {t(APPROVAL_TYPE[a.type] ?? 'nav.approvals')} ·{' '}
                      {vnd(a.amountVnd)}
                    </b>
                    <div className="li-s">
                      {FOC_REASON[a.reasonCode] ? t(FOC_REASON[a.reasonCode]!) : null}
                      {a.reasonNote ? ` · "${a.reasonNote}"` : ''} ·{' '}
                      {t('approval.sent_by', { who: a.requestedBy, time: dateTime(a.requestedAt) })}
                    </div>
                    {a.refundDestination ? (
                      <div className="li-s">
                        {t(
                          a.refundDestination.method === 'cash' ? 'pay.cash' : 'pay.bank_transfer',
                        )}
                        {a.refundDestination.accountNoLast4
                          ? ` · ••${a.refundDestination.accountNoLast4}`
                          : ''}
                      </div>
                    ) : null}
                  </div>
                  <Chip tone={STATUS_TONE[a.status]}>{t(`approval.status.${a.status}`)}</Chip>
                  <Button disabled={!online} onClick={() => setDeciding({ a, approve: false })}>
                    {t('approval.reject')}
                  </Button>
                  <Button
                    variant="pri"
                    disabled={!online}
                    onClick={() => setDeciding({ a, approve: true })}
                  >
                    {t('approval.approve')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Page>
      {deciding ? (
        <DecideDialog
          request={deciding.a}
          approve={deciding.approve}
          onClose={() => setDeciding(null)}
          onDone={() => {
            setDeciding(null);
            reload();
          }}
        />
      ) : null}
    </>
  );
}

function DecideDialog({
  request: a,
  approve,
  onClose,
  onDone,
}: {
  request: ApprovalRequest;
  approve: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, vnd, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const [secret, setSecret] = useState('');
  const [note, setNote] = useState('');
  const act = useSubmit();
  const A = { propertyId, approvalId: a.id };
  const submit = async () => {
    const out = await act.submit((idem) =>
      approve
        ? api.approveRequest(
            A,
            { authMethod: 'password', secret, note: note.trim() || undefined },
            idem,
          )
        : api.rejectRequest(A, { authMethod: 'password', secret, reason: note.trim() }, idem),
    );
    setSecret('');
    if (out) {
      toast(t(`approval.status.${out.data.status}`));
      onDone();
    }
  };
  const e = act.error;
  const already =
    isApiError(e) && e.code === 'INVALID_TRANSITION'
      ? t('approval.already_done', {
          who: String((e.problem as Record<string, unknown>).approverName ?? ''),
          time: dateTime(String((e.problem as Record<string, unknown>).decidedAt ?? '')),
        })
      : null;
  return (
    <Modal
      open
      size="sm"
      title={
        approve
          ? t('approval.approve_title', { amount: vnd(a.amountVnd), code: a.reservationCode ?? '' })
          : t('approval.reject_title', { code: a.reservationCode ?? '' })
      }
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant={approve ? 'pri' : 'danger'}
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={secret.length < 6 || (!approve && note.trim().length < 3)}
            onClick={() => void submit()}
          >
            {act.label(t(approve ? 'approval.approve' : 'approval.reject'))}
          </Button>
        </>
      }
    >
      <p className="li-s">{approve ? t('approval.approve_body') : t('approval.reject_effect')}</p>
      {!approve ? (
        <Field label={t('approval.reject_reason')} required error={act.fields.reason}>
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={500}
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
            />
          )}
        </Field>
      ) : (
        <Field label={t('stay.note')}>
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={300}
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
            />
          )}
        </Field>
      )}
      <Field label={t('approval.pin_label')} required error={act.fields.secret}>
        {(p) => (
          <input
            {...p}
            type="password"
            autoComplete="current-password"
            className="input"
            value={secret}
            onChange={(ev) => setSecret(ev.target.value)}
          />
        )}
      </Field>
      {already ? (
        <Alert tone="warn">{already}</Alert>
      ) : act.code === 'REAUTH_FAILED' ? null : (
        act.view()
      )}
    </Modal>
  );
}
