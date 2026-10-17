import {
  deriveIdempotencyKey,
  isApiError,
  type ApprovalRequest,
  type AuditEvent,
  type PaymentListItem,
  type RefundDestination,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, Seg, StateView } from '@ottimo/ui';
import { useId, useState } from 'react';
import { api } from '../../app/api';
import { todayLocal } from '../../app/dates';
import { useLiveReload } from '../../app/live';
import { addDays } from '../../app/reservations';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { C3_TTL_MS, useC3Reveal } from '../../app/c3';
import { APPROVAL_TYPE, methodText } from '../../app/folio';
import {
  FilePicker,
  MoneyField,
  StepUpDialog,
  amountOf,
  useSubmit,
  useUnsavedLabels,
} from '../stay/common';

type Tab = 'log' | 'recon' | 'refund';
const OWN_MGR = ['owner', 'manager'];
const SALES = ['sales_staff', 'collaborator'];
const ROLE_KEY: Record<string, string> = {
  sales_staff: 'role.sales_staff',
  collaborator: 'role.collaborator',
  front_desk: 'role.front_desk',
  front_desk_lead: 'role.front_desk_lead',
  manager: 'role.manager',
  owner: 'role.owner',
};
const METHOD_KEY: Record<string, string> = {
  vietqr: 'pay.vietqr',
  cash: 'pay.cash',
  bank_transfer: 'pay.bank_transfer',
  card_pos: 'pay.card',
  ota_collect: 'pay.ota',
};

/**
 * Nhật ký tiền (S27): H17 17.3 money log (read-only; FD sees only their own – server scope), H16 16.6
 * "Chờ đối soát" (MGR+ match the bank statement – A46; FD+ confirm cash a sale/CTV handed in – A46a,
 * never their own), and refunds (EP03-05 2.6): FD+ set the destination and pay CASH refunds (A47a),
 * bank transfers are paid by MGR/OWN only (A47, full account after step-up).
 */
export function MoneyPage() {
  const { t } = useI18n();
  const ids = useId();
  const [tab, setTab] = useState<Tab>('log');
  return (
    <>
      <Topbar title={t('nav.moneylog')} />
      <Page>
        <span className="sr-only" id={`${ids}-tab`}>
          {t('nav.moneylog')}
        </span>
        <Seg
          labelledBy={`${ids}-tab`}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'log', label: t('moneylog.title') },
            { value: 'recon', label: t('co.recon_title') },
            { value: 'refund', label: t('refund.title') },
          ]}
        />
        {tab === 'log' ? <MoneyLog /> : tab === 'recon' ? <Reconcile /> : <Refunds />}
      </Page>
    </>
  );
}

/**
 * FE-S3-09 / UXD s3 E.3: `AuditEvent.action` (money) is a closed list (0.3.6 add. 2, 49 codes) – one
 * sentence each. `payment.recorded` by sale/CTV → "Sale/CTV ghi nhận thu · chờ đối soát"; codes outside
 * the list → "Thao tác tiền khác" with the code in small print (never a raw code as the label).
 */
const ACTION_KEY: Record<string, string> = {
  'payment.qr_created': 'mlog.a_qr_created',
  'payment.confirmed_received': 'mlog.a_payment_confirmed',
  'payment.expired': 'mlog.a_payment_expired',
  'payment.reconciled': 'mlog.a_reconciled',
  'payment.cash_handover_confirmed': 'mlog.a_cash_handover',
  'payment.reversed': 'mlog.a_reversed',
  'payment.ota_collected': 'mlog.a_ota_collected',
  'payment.ota_collect_adjusted': 'mlog.a_ota_collect_adjusted',
  'folio.line_posted': 'mlog.a_line_added',
  'folio.line_reversed': 'mlog.a_line_reversed',
  'folio_line.adjusted': 'mlog.a_adjusted',
  'folio.settled': 'mlog.a_folio_settled',
  'folio.stay_reversed': 'mlog.a_stay_reversed',
  'folio.foc_requested': 'mlog.a_foc_requested',
  'folio.foc_posted': 'mlog.a_foc_posted',
  'folio.foc_rejected': 'mlog.a_foc_rejected',
  'folio.damage_posted': 'mlog.a_damage_posted',
  'folio.damage_rejected': 'mlog.a_damage_rejected',
  'refund.destination_set': 'mlog.a_refund_destination',
  'refund.paid': 'mlog.a_refund_paid',
  'refund.cash_paid': 'mlog.a_refund_cash_paid',
  'reservation.deposit_confirmed': 'mlog.a_deposit_confirmed',
  'reservation.no_show_deposit_retained': 'mlog.a_noshow_retained',
  'reservation.cancellation_fee': 'mlog.a_cancellation_fee',
  'reservation.debt_on_checkout': 'mlog.a_debt_on_checkout',
  'reservation.early_departure': 'mlog.a_early_departure',
  'reservation.extended': 'mlog.a_extended',
  'reservation.prior_night_added': 'mlog.a_prior_night_added',
  'reservation.extra_night_on_checkout': 'mlog.a_extra_night_on_checkout',
  'reservation.priced': 'mlog.a_priced',
  'reservation.repriced': 'mlog.a_repriced',
  'reservation.room_change_repriced': 'mlog.a_room_change_repriced',
  'commission.projected': 'mlog.a_commission_projected',
  'commission.earned': 'mlog.a_commission_earned',
  'commission.voided': 'mlog.a_commission_voided',
  'channel_fee.recorded': 'mlog.a_channel_fee_recorded',
  'channel_fee.updated': 'mlog.a_channel_fee_updated',
  'overbooking.relocation_cost': 'mlog.a_relocation_cost',
  'approval.requested': 'mlog.a_approval_requested',
  'approval.self_applied': 'mlog.a_approval_self_applied',
  'approval.rejected': 'mlog.a_approval_rejected',
  'approval.escalated': 'mlog.a_approval_escalated',
  'approval.reopened': 'mlog.a_approval_reopened',
  'approval.cancelled': 'mlog.a_approval_cancelled',
  'config.changed': 'mlog.a_receiving_account_changed',
};

function AuditAction({ e }: { e: AuditEvent }) {
  const { t, money } = useI18n();
  const before = (e.before ?? {}) as Record<string, unknown>;
  const after = (e.after ?? {}) as Record<string, unknown>;
  if (e.action === 'payment.recorded' || e.action === 'payment.recorded_by_staff') {
    const staff = SALES.includes(String(after.recordedByRole)) || e.action !== 'payment.recorded';
    const method = METHOD_KEY[String(after.method)];
    return (
      <>
        {staff ? t('mlog.a_staff_payment') : t('mlog.a_payment')}
        {!staff && method ? ` · ${t(method)}` : ''}
        {after.reconciliation === 'pending' && !staff ? (
          <>
            {' '}
            <Chip tone="warn" icon="hourglass" className="recon">
              {t('pay.pending_reconcile')}
            </Chip>
          </>
        ) : null}
      </>
    );
  }
  if (e.action === 'reservation.closer_changed')
    return (
      <>
        {t('mlog.a_closer_changed', {
          from: String(before.closer ?? ''),
          to: String(after.closer ?? ''),
        })}
      </>
    );
  if (e.action === 'deposit.shortfall_accepted')
    return (
      <>{t('mlog.a_shortfall_accepted', { amount: money(Number(after.shortfallVnd ?? 0)) })}</>
    );
  if (e.action === 'approval.approved') {
    // FOC / special discount keep "Duyệt miễn phí"; other money requests: "Duyệt yêu cầu · {type}".
    const type = String(after.type ?? '');
    if (type === 'foc' || type === 'special_discount') return <>{t('mlog.a_foc_approved')}</>;
    if (!APPROVAL_TYPE[type]) return <>{t('mlog.a_approval_approved')}</>;
    return (
      <>
        {t('mlog.a_approval_approved')} · {t(APPROVAL_TYPE[type]!)}
      </>
    );
  }
  const key = ACTION_KEY[e.action];
  if (key) return <>{t(key)}</>;
  return (
    <>
      {t('mlog.a_other')} <span className="caption mono">{e.action}</span>
    </>
  );
}

function MoneyLog() {
  const { t, vnd, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const today = todayLocal();
  const [from, setFrom] = useState(addDays(today, -7));
  const [to, setTo] = useState(today);
  const { state, reload } = useResource(
    async () =>
      (await api.listAuditEvents({ propertyId }, { category: 'money', dateFrom: from, dateTo: to }))
        .data.data,
    [propertyId, from, to],
  );
  const rows = state.data ?? [];
  const amountOfEvent = (o: unknown) => {
    const v = (o as Record<string, unknown> | undefined)?.amountVnd;
    return typeof v === 'number' ? vnd(v) : '—';
  };
  return (
    <div className="stack">
      <div className="filters row wrap">
        <Field label={t('mlog.date_from')}>
          {(p) => (
            <input
              {...p}
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('mlog.date_to')}>
          {(p) => (
            <input
              {...p}
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          )}
        </Field>
      </div>
      {state.status === 'error' && !state.data ? (
        <ErrorBlock
          titleKey="mlog.error_title"
          error={state.error}
          onRetry={reload}
          autoRetrySeconds={state.autoRetrySeconds}
        />
      ) : !state.data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <StateView icon="bill" title={t('mlog.empty_title')}>
          {t('mlog.empty_body')}
        </StateView>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{t('moneylog.title')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('mlog.time')}</th>
                <th scope="col">{t('mlog.who')}</th>
                <th scope="col">{t('mlog.action')}</th>
                <th scope="col">{t('co.recon_booking')}</th>
                <th scope="col">{t('mlog.before_after')}</th>
                <th scope="col">{t('ci.reason')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={`${e.occurredAt}-${i}`}>
                  <td className="num">{dateTime(e.occurredAt)}</td>
                  <td>{e.actorName}</td>
                  <td>
                    <AuditAction e={e} />
                  </td>
                  <td className="mono">{e.entityCode}</td>
                  <td className="num">
                    {amountOfEvent(e.before)} → {amountOfEvent(e.after)}
                  </td>
                  <td>{e.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Reconcile() {
  const { t, vnd, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const toast = useToast();
  const mgr = roles.some((r) => OWN_MGR.includes(r));
  const { state, reload } = useResource(
    async () => (await api.listPayments({ propertyId }, { reconciliation: 'pending' })).data.data,
    [propertyId],
  );
  useLiveReload(propertyId, reload);
  const act = useSubmit();
  const [disputing, setDisputing] = useState<PaymentListItem | null>(null);
  const [note, setNote] = useState('');
  const rows = state.data ?? [];

  const isCashHandover = (p: PaymentListItem) =>
    p.method === 'cash' && SALES.includes(String(p.recordedByRole));
  const [handing, setHanding] = useState<PaymentListItem | null>(null);
  const handover = async (p: PaymentListItem) => {
    setHanding(p);
    const out = await act.submit((idem) =>
      api.confirmCashHandover({ propertyId }, p.id, { result: 'received' }, p.version ?? 1, idem),
    );
    if (out) {
      toast(
        t('recon.cash_received_toast', {
          amount: money(p.amountVnd),
          code: p.reservationCode ?? '',
        }),
      );
      reload();
    }
  };
  const reconcile = async (p: PaymentListItem, result: 'reconciled' | 'disputed') => {
    const out = await act.submit((idem) =>
      api.reconcilePayment(
        { propertyId },
        p.id,
        { result, note: note.trim() || undefined },
        p.version ?? 1,
        idem,
      ),
    );
    if (out) {
      setDisputing(null);
      setNote('');
      toast(t(result === 'reconciled' ? 'co.recon_ok' : 'co.recon_missing'));
      reload();
    }
  };

  return (
    <div className="stack">
      <p className="li-s">
        {t('pay.cash_hand_in')} {t('recon.commission_note')}
      </p>
      {act.fields.receivedAmountVnd || act.fields.receivedVnd ? (
        // 422 AMOUNT_INVALID: the cash counted differs from what the sale recorded – report to the manager.
        <Alert tone="bad">
          {t('pay.cash_handover_mismatch', { amount: vnd(handing?.amountVnd ?? 0) })}
        </Alert>
      ) : (
        act.view()
      )}
      {state.status === 'error' && !state.data ? (
        <ErrorBlock
          titleKey="mlog.error_title"
          error={state.error}
          onRetry={reload}
          autoRetrySeconds={state.autoRetrySeconds}
        />
      ) : !state.data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <StateView icon="check" title={t('recon.empty_title')}>
          {t('recon.empty_body')}
        </StateView>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{t('co.recon_title')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('co.recon_time')}</th>
                <th scope="col">{t('co.recon_booking')}</th>
                <th scope="col">{t('co.recon_method')}</th>
                <th scope="col" className="r">
                  {t('co.amount')}
                </th>
                <th scope="col">{t('co.recon_by')}</th>
                <th scope="col">{t('co.txn_ref_short')}</th>
                <th scope="col">{t('reg2.col_action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="num">{dateTime(p.receivedAt)}</td>
                  <td className="mono">{p.reservationCode}</td>
                  <td>{t(METHOD_KEY[p.method] ?? 'pay.method')}</td>
                  <td className="r num">{vnd(p.amountVnd)}</td>
                  <td>
                    {p.recordedBy}
                    {SALES.includes(String(p.recordedByRole)) ? (
                      <div>
                        <Chip tone="warn" icon="hourglass" className="recon">
                          {t('pay.recorded_by_staff', {
                            role: t(ROLE_KEY[String(p.recordedByRole)] ?? 'role.sales_staff'),
                          })}
                        </Chip>
                      </div>
                    ) : null}
                    {/* FE-S3-15: the server says when it is overdue (bank_reconcile_alert_days). */}
                    {p.reconcileOverdue ? (
                      <div>
                        <Chip tone="bad">
                          {t('co.recon_overdue', { days: p.pendingDays ?? 0 })}
                        </Chip>
                      </div>
                    ) : null}
                  </td>
                  <td className="mono">{p.note ?? '—'}</td>
                  <td>
                    {isCashHandover(p) ? (
                      <Button
                        size="sm"
                        variant="pri"
                        disabled={!online || act.busy}
                        onClick={() => void handover(p)}
                      >
                        {t('pay.confirm_cash_handover')}
                      </Button>
                    ) : mgr ? (
                      <div className="row wrap">
                        <Button
                          size="sm"
                          disabled={!online || act.busy}
                          onClick={() => void reconcile(p, 'reconciled')}
                        >
                          {t('co.recon_ok')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!online}
                          onClick={() => setDisputing(p)}
                        >
                          {t('co.recon_missing')}
                        </Button>
                      </div>
                    ) : (
                      <Chip tone="warn" icon="hourglass" className="recon">
                        {t('pay.pending_reconcile')}
                      </Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {disputing ? (
        <Modal
          open
          size="sm"
          title={t('co.recon_missing')}
          onClose={() => setDisputing(null)}
          closeLabel={t('common.close')}
          footer={
            <>
              <Button onClick={() => setDisputing(null)}>{t('common.cancel')}</Button>
              <Button
                variant="danger"
                busy={act.busy}
                disabled={note.trim().length < 3}
                onClick={() => void reconcile(disputing, 'disputed')}
              >
                {t('co.recon_missing')}
              </Button>
            </>
          }
        >
          <p className="li-s">{t('co.recon_missing_effect')}</p>
          <Field label={t('ci.reason')} required>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
          </Field>
          {act.view()}
        </Modal>
      ) : null}
    </div>
  );
}

function Refunds() {
  const { t, vnd, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const { online } = useOnline();
  const mgr = roles.some((r) => OWN_MGR.includes(r));
  const { state, reload } = useResource(
    async () =>
      (await api.listApprovalRequests({ propertyId })).data.data.filter(
        (a) => a.type === 'refund' && !['cancelled', 'rejected'].includes(a.status),
      ),
    [propertyId],
  );
  const [dest, setDest] = useState<ApprovalRequest | null>(null);
  const [pay, setPay] = useState<ApprovalRequest | null>(null);
  const rows = state.data ?? [];
  return (
    <div className="stack">
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
        <StateView icon="check" title={t('refund.empty_title')}>
          {t('refund.empty_body')}
        </StateView>
      ) : (
        <ul className="list-none">
          {rows.map((a) => {
            const left = a.amountVnd - (a.refundedVnd ?? 0);
            const method = a.refundDestination?.method;
            const cash = method === 'cash';
            return (
              <li key={a.id} className="card">
                <div className="row wrap">
                  <div className="grow">
                    <b>
                      {a.reservationCode} · {vnd(a.amountVnd)}
                    </b>
                    <div className="li-s">
                      {a.reasonNote ? `"${a.reasonNote}" · ` : ''}
                      {t('approval.sent_by', { who: a.requestedBy, time: dateTime(a.requestedAt) })}
                    </div>
                    <div className="li-s">
                      {a.refundedVnd ? (
                        <div>{t('refund.paid', { amount: money(a.refundedVnd) })}</div>
                      ) : null}
                      {method
                        ? `${t('refund.method_label', { method: methodText(t, method) })}${a.refundDestination?.accountNoLast4 ? ` · ••${a.refundDestination.accountNoLast4}` : ''}`
                        : '—'}
                    </div>
                  </div>
                  <Chip tone={a.status === 'approved' ? 'ok' : 'warn'}>
                    {t(`approval.status.${a.status}`)}
                  </Chip>
                  {left > 0 && online ? (
                    <>
                      <Button size="sm" onClick={() => setDest(a)}>
                        {t('refund.set_destination')}
                      </Button>
                      {a.status === 'approved' && cash ? (
                        <Button size="sm" variant="pri" onClick={() => setPay(a)}>
                          {t('refund.execute_cash')}
                        </Button>
                      ) : null}
                      {a.status === 'approved' && method && !cash ? (
                        mgr ? (
                          <Button size="sm" variant="pri" onClick={() => setPay(a)}>
                            {t('refund.execute_transfer')}
                          </Button>
                        ) : (
                          <span className="li-s">{t('refund.transfer_waits_manager')}</span>
                        )
                      ) : null}
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {dest ? (
        <DestinationDialog
          request={dest}
          onClose={() => setDest(null)}
          onDone={() => {
            setDest(null);
            reload();
          }}
        />
      ) : null}
      {pay ? (
        <ExecuteRefundDialog
          request={pay}
          onClose={() => setPay(null)}
          onDone={() => {
            setPay(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

/** EP03-05 2.6.1 – where the money goes (FD+, A43). Bank account = C3: trusted device, Luhn-blocked. */
function DestinationDialog({
  request: a,
  onClose,
  onDone,
}: {
  request: ApprovalRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const { deviceTrusted } = useSession();
  const ids = useId();
  const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'original_method'>(
    (a.refundDestination?.method as 'cash') ?? 'cash',
  );
  const [bankBin, setBankBin] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [holder, setHolder] = useState('');
  const act = useSubmit();
  const save = async () => {
    const out = await act.submit((idem) =>
      api.setRefundDestination(
        { propertyId, approvalId: a.id },
        method === 'bank_transfer'
          ? {
              method,
              bankBin: bankBin.trim(),
              accountNo: accountNo.replace(/\s/g, ''),
              accountHolder: holder.trim() || undefined,
            }
          : { method },
        idem,
      ),
    );
    setAccountNo('');
    if (out) onDone();
  };
  return (
    <Modal
      open
      size="sm"
      title={t('refund.set_destination')}
      onClose={onClose}
      dirty={!!bankBin || !!accountNo || !!holder}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={method === 'bank_transfer' && !deviceTrusted}
            onClick={() => void save()}
          >
            {act.label(t('common.save'))}
          </Button>
        </>
      }
    >
      <span className="label-h" id={`${ids}-m`}>
        {t('refund.method')}
      </span>
      <Seg
        labelledBy={`${ids}-m`}
        value={method}
        onChange={setMethod}
        options={[
          { value: 'cash', label: t('pay.cash') },
          { value: 'bank_transfer', label: t('pay.bank_transfer') },
          { value: 'original_method', label: t('refund.method.original_method') },
        ]}
      />
      {method === 'bank_transfer' ? (
        deviceTrusted ? (
          <>
            <Field label={t('refund.bank_bin')} required error={act.fields.bankBin}>
              {(p) => (
                <input
                  {...p}
                  className="input mono"
                  inputMode="numeric"
                  maxLength={6}
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value.replace(/\D/g, ''))}
                />
              )}
            </Field>
            <Field label={t('refund.account_no')} required error={act.fields.accountNo}>
              {(p) => (
                <input
                  {...p}
                  className="input mono"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={23}
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('refund.account_holder')} error={act.fields.accountHolder}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  maxLength={70}
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                />
              )}
            </Field>
          </>
        ) : (
          <Alert tone="warn">{t('error.DEVICE_NOT_TRUSTED')}</Alert>
        )
      ) : null}

      {act.view()}
    </Modal>
  );
}

/**
 * Chi hoàn: cash → `executeCashRefund` (FD+, A47a – signed receipt photo required, payer ≠ requester);
 * transfer / original method → `executeRefund` (MGR/OWN, A47 – bank reference + proof, full account
 * shown only after step-up). The proof photo goes through `uploadAttachment purpose=refund_proof`.
 */
function ExecuteRefundDialog({
  request: a,
  onClose,
  onDone,
}: {
  request: ApprovalRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, vnd, money } = useI18n();
  const unsaved = useUnsavedLabels();
  const propertyId = usePropertyId();
  const toast = useToast();
  const cash = a.refundDestination?.method === 'cash';
  // The API asks for the proof photo for cash and for a bank transfer (EVIDENCE_REQUIRED – E15-02).
  const proofRequired = cash || a.refundDestination?.method === 'bank_transfer';
  const left = a.amountVnd - (a.refundedVnd ?? 0);
  const [amount, setAmount] = useState(vnd(left));
  const [ref, setRef] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  // FB-R2-SEC-FE-06 / FE-S3-22: the full account number hides itself like other C3 values.
  const fullReveal = useC3Reveal<RefundDestination>();
  const full = fullReveal.value;
  const [stepUp, setStepUp] = useState(false);
  const act = useSubmit();
  const A = { propertyId, approvalId: a.id };

  const showAccount = async () => {
    try {
      fullReveal.show((await api.getRefundDestination(A)).data);
    } catch (e) {
      if (isApiError(e) && e.code === 'REAUTH_REQUIRED') setStepUp(true);
      else act.setError(e);
    }
  };

  const save = async () => {
    const out = await act.submit(async (idem) => {
      let attachmentId: string | undefined;
      if (proof)
        attachmentId = (
          await api.uploadAttachment(
            { propertyId },
            proof,
            'refund_proof',
            // UXR #2: a UUID derived from the click's key (a "-a" suffix was refused with 422).
            deriveIdempotencyKey(idem, 'attachment'),
          )
        ).data.id;
      const paidAt = new Date().toISOString();
      return cash
        ? api.executeCashRefund(
            A,
            { amountVnd: amountOf(amount), paidAt, attachmentId: attachmentId ?? '' },
            idem,
          )
        : api.executeRefund(
            A,
            {
              amountVnd: amountOf(amount),
              paidAt,
              bankReference: ref.trim() || undefined,
              attachmentId,
            },
            idem,
          );
    });
    if (out) {
      setProof(null);
      toast(t('refund.paid', { amount: money(out.data.amountVnd) }));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t(cash ? 'refund.execute_cash' : 'refund.execute_transfer')}
      onClose={onClose}
      dirty={!!proof || !!ref.trim()}
      unsavedLabels={unsaved}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!proof && proofRequired}
            aria-describedby="refund-effect"
            onClick={() => void save()}
          >
            {act.label(t(cash ? 'refund.execute_cash' : 'refund.execute_transfer'))}
          </Button>
        </>
      }
    >
      <p>
        {a.reservationCode} · {vnd(left)} {t('common.vnd_unit')}
      </p>
      {!cash ? (
        full ? (
          <>
            <dl className="dl">
              <dt>{t('refund.bank_bin')}</dt>
              <dd className="mono">{full.bankBin}</dd>
              <dt>{t('refund.account_no')}</dt>
              <dd className="mono">{full.accountNo}</dd>
              <dt>{t('refund.account_holder')}</dt>
              <dd>{full.accountHolder}</dd>
            </dl>
            <p className="caption">{t('ci.full_autohide', { seconds: C3_TTL_MS / 1000 })}</p>
          </>
        ) : (
          <Button size="sm" onClick={() => void showAccount()}>
            {t('refund.show_account')}
          </Button>
        )
      ) : null}
      <MoneyField
        label={t('co.amount')}
        value={amount}
        onChange={setAmount}
        error={act.fields.amountVnd}
        required
      />
      {!cash ? (
        <Field label={t('refund.bank_reference')} required error={act.fields.bankReference}>
          {(p) => (
            <input
              {...p}
              className="input mono"
              maxLength={64}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          )}
        </Field>
      ) : null}
      <FilePicker
        label={t('refund.proof')}
        file={proof}
        onChange={setProof}
        error={act.fields.attachmentId}
        required={proofRequired}
      />
      <p id="refund-effect" className="li-s">
        {t(cash ? 'refund.execute_effect_cash' : 'refund.execute_effect_transfer', {
          amount: money(amountOf(amount)),
        })}
      </p>
      {act.code === 'SELF_REFUND_FORBIDDEN' ? (
        // UXR #8: a 403 the API explains – never "Máy chủ đang gặp sự cố".
        <Alert tone="bad">
          {t(cash ? 'refund.self_execute_forbidden' : 'refund.self_execute_forbidden_transfer')}
        </Alert>
      ) : (
        act.view()
      )}
      {stepUp ? (
        <StepUpDialog
          onClose={() => setStepUp(false)}
          onDone={() => {
            setStepUp(false);
            void showAccount();
          }}
        />
      ) : null}
    </Modal>
  );
}
