import {
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
import { FilePicker, MoneyField, StepUpDialog, amountOf, useSubmit } from '../stay/common';

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

function auditLabel(
  t: (k: string, a?: Record<string, string | number>) => string,
  e: AuditEvent,
  vnd: (n: number) => string,
) {
  const before = (e.before ?? {}) as Record<string, unknown>;
  const after = (e.after ?? {}) as Record<string, unknown>;
  switch (e.action) {
    case 'payment.recorded':
      return t('mlog.a_payment');
    case 'payment.recorded_by_staff':
      return t('mlog.a_staff_payment');
    case 'folio.line_added':
      return t('mlog.a_line_added');
    case 'approval.approved':
      return t('mlog.a_foc_approved');
    case 'reservation.closer_changed':
      return t('mlog.a_closer_changed', {
        from: String(before.closer ?? ''),
        to: String(after.closer ?? ''),
      });
    case 'deposit.shortfall_accepted':
      return t('mlog.a_shortfall_accepted', { amount: vnd(Number(after.shortfallVnd ?? 0)) });
    default:
      return e.action;
  }
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
  const money = (o: unknown) => {
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
                  <td>{auditLabel(t, e, vnd)}</td>
                  <td className="mono">{e.entityCode}</td>
                  <td className="num">
                    {money(e.before)} → {money(e.after)}
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
  const { t, vnd, dateTime } = useI18n();
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
      toast(t('co.recon_ok'));
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
        <StateView icon="check" title={t('mlog.empty_title')}>
          {t('co.recon_explain')}
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
                        <Chip tone="warn">
                          {t('pay.recorded_by_staff', {
                            role: t(ROLE_KEY[String(p.recordedByRole)] ?? 'role.sales_staff'),
                          })}
                        </Chip>
                      </div>
                    ) : null}
                    {(p.pendingDays ?? 0) > 2 ? (
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
                      <Chip tone="warn">{t('pay.pending_reconcile')}</Chip>
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
  const { t, vnd, dateTime } = useI18n();
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
        <StateView icon="check" title={t('approval.empty_title')}>
          {t('approval.empty_body')}
        </StateView>
      ) : (
        <ul className="list-plain">
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
                      {a.refundedVnd ? ` (−${vnd(a.refundedVnd)})` : ''}
                    </b>
                    <div className="li-s">
                      {a.reasonNote ? `"${a.reasonNote}" · ` : ''}
                      {t('approval.sent_by', { who: a.requestedBy, time: dateTime(a.requestedAt) })}
                    </div>
                    <div className="li-s">
                      {t('refund.method')}:{' '}
                      {method
                        ? `${t(cash ? 'pay.cash' : method === 'bank_transfer' ? 'pay.bank_transfer' : 'pay.card')}${a.refundDestination?.accountNoLast4 ? ` · ••${a.refundDestination.accountNoLast4}` : ''}`
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
      {a.status === 'approved' ? <p className="li-s">{t('approval.status.pending')}</p> : null}
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
  const { t, vnd } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const cash = a.refundDestination?.method === 'cash';
  const left = a.amountVnd - (a.refundedVnd ?? 0);
  const [amount, setAmount] = useState(vnd(left));
  const [ref, setRef] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [full, setFull] = useState<RefundDestination | null>(null);
  const [stepUp, setStepUp] = useState(false);
  const act = useSubmit();
  const A = { propertyId, approvalId: a.id };

  const showAccount = async () => {
    try {
      setFull((await api.getRefundDestination(A)).data);
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
          await api.uploadAttachment({ propertyId }, proof, 'refund_proof', `${idem}-a`)
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
      toast(t('refund.paid', { amount: vnd(out.data.amountVnd) }));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t(cash ? 'refund.execute_cash' : 'refund.execute_transfer')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={!proof && cash}
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
          <dl className="dl">
            <dt>{t('refund.bank_bin')}</dt>
            <dd className="mono">{full.bankBin}</dd>
            <dt>{t('refund.account_no')}</dt>
            <dd className="mono">{full.accountNo}</dd>
            <dt>{t('refund.account_holder')}</dt>
            <dd>{full.accountHolder}</dd>
          </dl>
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
        required={cash}
      />
      {act.code === 'SELF_APPROVAL_FORBIDDEN' ? (
        <Alert tone="bad">{t('refund.self_execute_forbidden')}</Alert>
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
