import { isApiError, type BillingPeriodPatch } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, ConfirmDialog, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useId, useState, type InputHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { useBusinessDay } from '../../app/businessDay';
import { REFERENCE_LONG_NUMBER_RE, REFERENCE_RE, canSettleOutsideDesk } from '../../app/goLive';
import { parseVnd } from '../../app/money';
import { problemView } from '../../app/problem';
import { statusTone, type BillingPeriod, type StatementLine } from '../../app/statements';
import { useToast } from '../../app/toast';
import { useWrite } from '../../app/useWrite';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import {
  dayText,
  lineAmount,
  lineText,
  meterNum,
  monthText,
  num,
  signedNum,
  statusText,
  warningText,
} from './labels';

/**
 * Statement detail (FB-INV-012, contract §6.3): lines, warnings (each confirmed before Issue), move a service line
 * to the next statement, prior-period adjustment (FDL+), Issue, Void (reason), Record payment (VietQR / cash, the
 * balance by default), Print. Buttons only for what `availableActions` lists.
 */
export function StatementDrawer({
  id,
  onClose,
  onChanged,
  onOpen,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
  onOpen: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const res = useResource(
    async () => (await api.getBillingPeriod({ propertyId }, id)).data,
    [propertyId, id],
  );
  const [acked, setAcked] = useState<Set<number>>(new Set());
  const [banner, setBanner] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [replaceMonth, setReplaceMonth] = useState<{ month: string; reservationId: string } | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const [settling, setSettling] = useState(false);
  const issueW = useWrite();
  const replaceW = useWrite();
  useEffect(() => {
    setAcked(new Set());
    setBanner(null);
    setVoiding(false);
    setPaying(false);
    setSettling(false);
    setReplaceMonth(null);
  }, [id]);

  const p = res.state.data;
  const can = (a: BillingPeriod['availableActions'][number]) => !!p?.availableActions.includes(a);
  const applied = (next: BillingPeriod) => {
    res.mutate(() => next);
    onChanged();
  };

  const patch = async (body: BillingPeriodPatch) => {
    if (!p) return;
    setBanner(null);
    try {
      applied((await api.updateBillingPeriod({ propertyId }, p.id, p.version, body)).data);
    } catch (e) {
      setBanner(problemView(t, e).text);
      if (isApiError(e) && e.status === 412) res.reload();
    }
  };

  const issue = async () => {
    if (!p) return;
    setBanner(null);
    try {
      const out = await issueW.run((key) =>
        api.issueBillingPeriod({ propertyId }, p.id, p.version, p.warnings.length > 0, key),
      );
      applied(out.data);
      toast(t('stmt.issued_toast', { code: out.data.code ?? '' }));
    } catch (e) {
      setBanner(problemView(t, e).text);
      if (isApiError(e) && (e.status === 412 || e.code === 'WARNINGS_NOT_ACKNOWLEDGED')) {
        setAcked(new Set());
        res.reload();
      }
    }
  };

  const replace = async () => {
    if (!replaceMonth) return;
    try {
      const out = await replaceW.run((key) =>
        api.createBillingPeriod(
          { propertyId, reservationId: replaceMonth.reservationId },
          { month: replaceMonth.month, kind: 'regular' },
          key,
        ),
      );
      onChanged();
      onOpen(out.data.id);
    } catch (e) {
      setBanner(problemView(t, e).text);
    }
  };

  const allAcked = !!p && p.warnings.every((_, i) => acked.has(i));
  const tone = p ? statusTone(p.status, p.alertLevel) : null;

  return (
    <Modal
      open
      variant="drawer"
      size="lg"
      title={
        // UXD-189-10: a draft has no code – the title stays "Statement", the chip says Draft.
        p?.code ? (
          <>
            {t('stmt.drawer_title')} <span className="mono">{p.code}</span>
          </>
        ) : (
          t('stmt.drawer_title')
        )
      }
      meta={
        p && tone ? (
          <Chip tone={tone.tone} icon={null} className={tone.className}>
            {statusText(t, p)}
          </Chip>
        ) : undefined
      }
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        p ? (
          <>
            {can('print') ? (
              <Link className="btn" to={`/print/statements/${p.id}`}>
                {t('stmt.print')}
              </Link>
            ) : null}
            {can('void') ? (
              <Button variant="ghost" onClick={() => setVoiding(true)}>
                {t('stmt.void')}
              </Button>
            ) : null}
            {canSettleOutsideDesk(p) ? (
              // FB-INV-012 §12.2 (A128, FE-3): only when the server lists it (OWN; MGR on the backdated
              // arrival-month statement – SEC 12-02).
              <Button variant="ghost" onClick={() => setSettling(true)}>
                {t('od.action')}
              </Button>
            ) : null}
            {can('record_payment') ? (
              <Button onClick={() => setPaying(true)}>{t('stmt.record_payment')}</Button>
            ) : null}
            {can('issue') ? (
              <Button
                variant="pri"
                disabled={!allAcked}
                aria-describedby={!allAcked ? `${ids}-ack` : undefined}
                busy={issueW.busy}
                busyLabel={issueW.busyLabel}
                onClick={() => void issue()}
              >
                {issueW.label(t('stmt.issue'))}
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      {res.state.status === 'error' ? (
        <ErrorBlock titleKey="stmt.load_error" error={res.state.error} onRetry={res.reload} />
      ) : !p ? (
        <LoadingBlock />
      ) : (
        <div className="stack">
          <p>
            <b>{p.roomNos.join(', ')}</b> · {p.guestDisplayName} · {monthText(locale, p.month)}
          </p>
          <dl className="kv stmt-periods">
            {p.rentPeriod ? (
              <>
                <dt>{t('stmt.rent_period')}</dt>
                <dd>
                  {dayText(locale, p.rentPeriod.from)} – {dayText(locale, p.rentPeriod.to)}
                </dd>
              </>
            ) : null}
            {p.utilityPeriod ? (
              <>
                <dt>{t('stmt.utility_period')}</dt>
                <dd>
                  {dayText(locale, p.utilityPeriod.from)} – {dayText(locale, p.utilityPeriod.to)}
                </dd>
              </>
            ) : null}
            <dt>{t('stmt.due')}</dt>
            <dd>{dayText(locale, p.dueDate)}</dd>
          </dl>
          {p.replacesCode ? (
            <p className="li-s">
              {t('stmt.replaces')} <span className="mono">{p.replacesCode}</span>
            </p>
          ) : null}
          {p.status === 'void' && p.voidReason ? (
            <Alert tone="info">{t('stmt.voided_reason', { reason: p.voidReason })}</Alert>
          ) : null}
          {replaceMonth ? (
            <Alert
              tone="info"
              role="status"
              actions={
                <Button size="sm" variant="pri" busy={replaceW.busy} onClick={() => void replace()}>
                  {t('stmt.create_replacement')}
                </Button>
              }
            >
              {t('stmt.voided_can_replace')}
            </Alert>
          ) : null}
          {banner ? <Alert tone="bad">{banner}</Alert> : null}
          {issueW.notice}

          {p.status === 'draft' && p.warnings.length ? (
            <fieldset className="stack stmt-warnings">
              <legend className="label-h">{t('stmt.warnings_title')}</legend>
              {p.warnings.map((w, i) => (
                <Alert key={i} tone="warn">
                  <label className="row">
                    <input
                      type="checkbox"
                      checked={acked.has(i)}
                      onChange={(e) =>
                        setAcked((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(i);
                          else n.delete(i);
                          return n;
                        })
                      }
                    />{' '}
                    <span>
                      {warningText(t, w)} <b>{t('stmt.warning_checked')}</b>
                    </span>
                  </label>
                </Alert>
              ))}
              {!allAcked ? (
                <p className="li-s" id={`${ids}-ack`}>
                  {t('stmt.ack_needed')}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <div className="table-wrap">
            <table className="table stmt-lines">
              <thead>
                <tr>
                  <th scope="col">{t('stmt.col_desc')}</th>
                  <th scope="col" className="r">
                    {t('stmt.col_vat')}
                  </th>
                  <th scope="col" className="r">
                    {t('stmt.col_amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.lines
                  .filter((l) => l.kind !== 'rounding')
                  .map((l, i) => (
                    <LineRow
                      key={l.folioLineId ?? `${l.kind}-${i}`}
                      l={l}
                      onMove={
                        can('update') && l.kind === 'service' && l.folioLineId
                          ? () =>
                              void patch({
                                excludedFolioLineIds: [
                                  ...(p.excludedLines ?? []).map((x) => x.folioLineId!),
                                  l.folioLineId!,
                                ],
                              })
                          : undefined
                      }
                    />
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={2}>
                    {t('stmt.subtotal')}
                  </th>
                  <td className="r num">{num(p.totals.netVnd)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>
                    {t('stmt.vat_total')}
                  </th>
                  <td className="r num">{num(p.totals.vatVnd)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={2}>
                    {t('stmt.rounding')}
                  </th>
                  <td className="r num">{signedNum(p.totals.roundingVnd)}</td>
                </tr>
                <tr className="total">
                  <th scope="row" colSpan={2}>
                    {t('stmt.total')}
                  </th>
                  <td className="r num">{num(p.totals.totalVnd)}</td>
                </tr>
                {p.totals.paidVnd > 0 ? (
                  <tr>
                    <th scope="row" colSpan={2}>
                      {t('stmt.paid')}
                    </th>
                    <td className="r num">−{num(p.totals.paidVnd)}</td>
                  </tr>
                ) : null}
                <tr className="total">
                  <th scope="row" colSpan={2}>
                    {t('stmt.balance')}
                  </th>
                  <td className="r num">{num(p.totals.balanceVnd)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {(p.excludedLines ?? []).length ? (
            <section className="stack">
              <h3 className="label-h">{t('stmt.moved_title')}</h3>
              <ul className="list-plain">
                {(p.excludedLines ?? []).map((l) => (
                  <li key={l.folioLineId} className="row wrap">
                    <span className="grow">
                      {lineText(locale, l)} · {num(l.amountVnd)}
                    </span>
                    {can('update') ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void patch({
                            excludedFolioLineIds: (p.excludedLines ?? [])
                              .map((x) => x.folioLineId!)
                              .filter((x) => x !== l.folioLineId),
                          })
                        }
                      >
                        {t('stmt.bring_back')}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {can('prior_adjustment') ? (
            <PriorAdjustment p={p} onSave={(v) => void patch({ priorAdjustment: v })} />
          ) : null}

          {paying ? (
            <PaymentForm
              p={p}
              onDone={(next) => {
                setPaying(false);
                applied(next);
                toast(t('stmt.payment_saved'));
              }}
              onCancel={() => setPaying(false)}
            />
          ) : null}
          {settling ? (
            <SettleOutsideDeskForm
              p={p}
              onDone={(next) => {
                setSettling(false);
                applied(next);
                toast(t('od.saved'));
              }}
              onCancel={() => setSettling(false)}
            />
          ) : null}
          {voiding ? (
            <VoidForm
              p={p}
              onDone={(next, canReplace) => {
                setVoiding(false);
                applied(next);
                if (canReplace)
                  setReplaceMonth({ month: next.month, reservationId: next.reservationId });
              }}
              onCancel={() => setVoiding(false)}
            />
          ) : null}
        </div>
      )}
    </Modal>
  );
}

/**
 * One line + (draft, service) its "Move to next statement" on a row of its own under it, so the description never
 * widens the money columns (UXD-189-04).
 */
function LineRow({ l, onMove }: { l: StatementLine; onMove?: () => void }) {
  const { t, locale } = useI18n();
  const unit = l.unit === 'kwh' ? 'kWh' : l.unit === 'm3' ? 'm³' : '';
  const utility = l.kind === 'electricity' || l.kind === 'water';
  return (
    <>
      <tr className={onMove ? 'stmt-has-move' : undefined}>
        <td>
          {lineText(locale, l)}
          {l.roomNo && utility ? ` · ${l.roomNo}` : ''}
          {/* Quantity × net unit price and the meter go under the description, so the money column keeps its
              width at 390 px too (UXD-189-04). */}
          {l.kind === 'rounding' || l.kind === 'prior_adjustment' ? null : (
            <div className="li-s num">
              {`${meterNum(l.quantity, l.unit)}${unit ? ` ${unit}` : ''} × ${num(l.unitPriceNetVnd)}`}
            </div>
          )}
          {l.meter ? (
            <div className="li-s mono">
              {meterNum(l.meter.from, l.unit)} → {meterNum(l.meter.to, l.unit)}
            </div>
          ) : null}
        </td>
        <td className="r num nowrap">
          {l.vatRatePct == null
            ? l.kind === 'prior_adjustment'
              ? ''
              : t('stmt.vat_incl')
            : `${l.vatRatePct}%`}
        </td>
        <td className="r num nowrap stmt-amt">{signedNum(lineAmount(l))}</td>
      </tr>
      {onMove ? (
        <tr className="stmt-move-row">
          <td colSpan={3}>
            <Button size="sm" variant="ghost" onClick={onMove}>
              {t('stmt.move_next')}
            </Button>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function PriorAdjustment({
  p,
  onSave,
}: {
  p: BillingPeriod;
  onSave: (v: { amountVnd: number; reason: string } | null) => void;
}) {
  const { t } = useI18n();
  const [amount, setAmount] = useState(
    p.priorAdjustment ? String(p.priorAdjustment.amountVnd) : '',
  );
  const [reason, setReason] = useState(p.priorAdjustment?.reason ?? '');
  const [err, setErr] = useState<Record<string, string>>({});
  const save = () => {
    const neg = amount.trim().startsWith('-') || amount.trim().startsWith('−');
    const n = parseVnd(amount.replace(/^[-−]/, ''));
    const e: Record<string, string> = {};
    if (n === null || n === 0) e.amount = t('common.required');
    if (reason.trim().length < 3) e.reason = t('stmt.reason_required');
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ amountVnd: neg ? -n! : n!, reason: reason.trim() });
  };
  return (
    <section className="stack">
      <h3 className="label-h">{t('stmt.prior_title')}</h3>
      <p className="li-s">{t('stmt.prior_help')}</p>
      <div className="row wrap">
        <Field label={t('stmt.prior_amount')} error={err.amount}>
          {(c) => (
            <input
              {...c}
              className="input num"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('stmt.prior_reason')} error={err.reason} className="grow">
          {(c) => (
            <input
              {...c}
              className="input"
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
      </div>
      <div className="row">
        <Button size="sm" onClick={save}>
          {t('stmt.prior_save')}
        </Button>
        {p.priorAdjustment ? (
          <Button size="sm" variant="ghost" onClick={() => onSave(null)}>
            {t('stmt.prior_remove')}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function PaymentForm({
  p,
  onDone,
  onCancel,
}: {
  p: BillingPeriod;
  onDone: (next: BillingPeriod) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const [method, setMethod] = useState<'vietqr' | 'cash'>('vietqr');
  const [amount, setAmount] = useState(groupVnd(String(p.totals.balanceVnd)));
  const [err, setErr] = useState<string | null>(null);
  const write = useWrite();
  const ids = useId();
  const save = async () => {
    const n = parseVnd(amount);
    if (n === null || n <= 0) return setErr(t('common.required'));
    if (n > p.totals.balanceVnd)
      return setErr(t('stmt.amount_over_balance', { max: num(p.totals.balanceVnd) }));
    setErr(null);
    try {
      const out = await write.run((key) =>
        api.recordBillingPeriodPayment({ propertyId }, p.id, { method, amountVnd: n }, key),
      );
      // OpenAPI `BillingPeriodPaymentResult` = {billingPeriod, payment}.
      onDone(out.data.billingPeriod);
    } catch (e) {
      setErr(problemView(t, e).text);
    }
  };
  return (
    <section className="card stack" aria-labelledby={`${ids}-h`}>
      <h3 className="label-h" id={`${ids}-h`}>
        {t('stmt.record_payment')}
      </h3>
      <Seg
        label={t('stmt.pay_method')}
        value={method}
        onChange={setMethod}
        options={[
          { value: 'vietqr', label: t('stmt.pay_vietqr') },
          { value: 'cash', label: t('stmt.pay_cash') },
        ]}
      />
      {method === 'vietqr' ? <p className="li-s">{t('stmt.pay_vietqr_help')}</p> : null}
      <Field label={t('stmt.pay_amount')} required error={err ?? undefined}>
        {(c) => <VndInput {...c} value={amount} onChange={setAmount} />}
      </Field>
      {write.notice}
      <div className="row">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button
          variant="pri"
          busy={write.busy}
          busyLabel={write.busyLabel}
          onClick={() => void save()}
        >
          {write.label(t('stmt.pay_save'))}
        </Button>
      </div>
    </section>
  );
}

function VoidForm({
  p,
  onDone,
  onCancel,
}: {
  p: BillingPeriod;
  onDone: (next: BillingPeriod, canReplace: boolean) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (reason.trim().length < 3) return setErr(t('stmt.reason_required'));
    setBusy(true);
    try {
      // OpenAPI `BillingPeriodVoided`: the statement, flat, + `canReplace`.
      const { canReplace, ...next } = (
        await api.voidBillingPeriod({ propertyId }, p.id, reason.trim())
      ).data;
      onDone(next, canReplace);
    } catch (e) {
      setErr(problemView(t, e).text);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card stack">
      <h3 className="label-h">{t('stmt.void_title')}</h3>
      <p className="li-s">
        {t(p.status === 'draft' ? 'stmt.void_draft_body' : 'stmt.void_issued_body')}
      </p>
      <Field label={t('stmt.void_reason')} required error={err ?? undefined}>
        {(c) => (
          <input
            {...c}
            className="input"
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      <div className="row">
        <Button onClick={onCancel}>{t('common.back')}</Button>
        <Button variant="danger" busy={busy} onClick={() => void save()}>
          {t('stmt.void_confirm')}
        </Button>
      </div>
    </section>
  );
}

/**
 * FB-INV-012 §12.2 (A128, FE-3): "Paid outside Desk" – amount (the balance by default), date received (≤ today),
 * reason, optional reference; a confirmation says it goes into no shift, reconciliation or cash handover. Recorded
 * as a payment `outside_desk` by the server only – the method is never offered in a payment picker (SEC 12-03).
 * 403 FORBIDDEN_ACTION = owner only (SEC 12-02); DEVICE_NOT_TRUSTED = an approved device is needed.
 */
function SettleOutsideDeskForm({
  p,
  onDone,
  onCancel,
}: {
  p: BillingPeriod;
  onDone: (next: BillingPeriod) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const { deviceTrusted, roles } = useSession();
  const today = useBusinessDay();
  // UXD-196-08: a manager may record only the unpaid rent (SEC 12-02) – default to it and say so up front.
  // The server stays the judge (403 "owner only"); this only avoids the round trip.
  const managerCap = roles.includes('owner')
    ? null
    : Math.max(
        0,
        Math.min(
          p.totals.balanceVnd,
          p.lines.filter((l) => l.kind === 'rent').reduce((sum, l) => sum + l.amountVnd, 0) -
            p.totals.paidVnd,
        ),
      );
  const [amount, setAmount] = useState(groupVnd(String(managerCap ?? p.totals.balanceVnd)));
  const [receivedOn, setReceivedOn] = useState(today);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<number | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const write = useWrite();
  const ids = useId();

  const check = () => {
    const n = parseVnd(amount);
    const e: Record<string, string> = {};
    if (n === null || n <= 0) e.amount = t('common.required');
    else if (n > p.totals.balanceVnd)
      e.amount = t('stmt.amount_over_balance', { max: num(p.totals.balanceVnd) });
    if (!receivedOn) e.receivedOn = t('common.required');
    else if (receivedOn > today) e.receivedOn = t('od.date_future');
    if (reason.trim().length < 3) e.reason = t('stmt.reason_required');
    if (reference.trim() && !REFERENCE_RE.test(reference.trim()))
      e.reference = t('od.reference_invalid');
    else if (REFERENCE_LONG_NUMBER_RE.test(reference)) e.reference = t('od.reference_long_number');
    setErr(e);
    if (!Object.keys(e).length) setConfirm(n!);
  };

  const save = async (n: number) => {
    setBanner(null);
    try {
      const out = await write.run((key) =>
        api.settleBillingPeriodOutsideDesk(
          { propertyId },
          p.id,
          p.version,
          {
            amountVnd: n,
            receivedOn,
            reason: reason.trim(),
            reference: reference.trim() || null,
          },
          key,
        ),
      );
      onDone(out.data.billingPeriod);
    } catch (e) {
      setConfirm(null);
      if (isApiError(e) && e.status >= 400 && e.status < 500) write.renewKey();
      // BE #197: a long run of numerals (NOT_ALLOWED) or a card number in `reference` – said under the field.
      const refErr =
        isApiError(e) && e.fieldErrors.find((f) => f.field.replace(/^body\./, '') === 'reference');
      if (refErr) {
        setErr((x) => ({ ...x, reference: t('od.reference_long_number') }));
        return;
      }
      setBanner(
        isApiError(e) && e.code === 'FORBIDDEN_ACTION'
          ? t('od.owner_only')
          : isApiError(e) && e.code === 'DEVICE_NOT_TRUSTED'
            ? t('od.need_device')
            : problemView(t, e).text,
      );
    }
  };

  return (
    <section className="card stack" aria-labelledby={`${ids}-h`}>
      <h3 className="label-h" id={`${ids}-h`}>
        {t('od.action')}
      </h3>
      <p className="li-s">{t('od.help')}</p>
      {!deviceTrusted ? <Alert tone="warn">{t('od.need_device')}</Alert> : null}
      {banner ? <Alert tone="bad">{banner}</Alert> : null}
      <div className="row wrap">
        <Field
          label={t('stmt.pay_amount')}
          required
          error={err.amount}
          help={managerCap !== null ? t('od.manager_cap', { amount: num(managerCap) }) : undefined}
        >
          {(c) => <VndInput {...c} value={amount} onChange={setAmount} />}
        </Field>
        <Field label={t('od.received_on')} required error={err.receivedOn}>
          {(c) => (
            <input
              {...c}
              className="input"
              type="date"
              max={today}
              value={receivedOn}
              onChange={(e) => setReceivedOn(e.target.value)}
            />
          )}
        </Field>
      </div>
      <Field label={t('od.reason')} required error={err.reason} help={t('od.reason_help')}>
        {(c) => (
          <input
            {...c}
            className="input"
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
      <Field label={t('od.reference')} error={err.reference} help={t('od.reference_help')}>
        {(c) => (
          <input
            {...c}
            className="input mono"
            maxLength={64}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        )}
      </Field>
      {write.notice}
      <div className="row">
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="pri" disabled={!deviceTrusted} onClick={check}>
          {t('od.confirm')}
        </Button>
      </div>
      {confirm !== null ? (
        <ConfirmDialog
          title={t('od.confirm_title', { amount: num(confirm) })}
          body={t('od.confirm_body')}
          keepLabel={t('common.back')}
          confirmLabel={t('od.confirm')}
          danger={false}
          busy={write.busy}
          busyLabel={write.busyLabel}
          onKeep={() => setConfirm(null)}
          onConfirm={() => void save(confirm)}
        />
      ) : null}
    </section>
  );
}

/** "7901000" → "7.901.000" (UXD-196-07); anything that isn't a plain amount is left as typed. */
function groupVnd(raw: string): string {
  const n = parseVnd(raw);
  return n === null ? raw : num(n);
}

/** A VND amount field: digits while typing, grouped in thousands on blur, with the "đ" suffix. */
function VndInput({
  value,
  onChange,
  ...field
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="input-affix">
      <input
        {...field}
        className="input num"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(groupVnd(value))}
      />
      <span className="affix">{t('common.vnd_unit')}</span>
    </div>
  );
}
