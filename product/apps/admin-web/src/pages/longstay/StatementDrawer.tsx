import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, Seg } from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseVnd } from '../../app/money';
import { problemView } from '../../app/problem';
import {
  statementsApi,
  statusTone,
  type BillingPeriod,
  type StatementLine,
} from '../../app/statements';
import { useToast } from '../../app/toast';
import { useWrite } from '../../app/useWrite';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
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
    async () => (await statementsApi.getBillingPeriod(propertyId, id)).data,
    [propertyId, id],
  );
  const [acked, setAcked] = useState<Set<number>>(new Set());
  const [banner, setBanner] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [replaceMonth, setReplaceMonth] = useState<{ month: string; reservationId: string } | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const issueW = useWrite();
  const replaceW = useWrite();
  useEffect(() => {
    setAcked(new Set());
    setBanner(null);
    setVoiding(false);
    setPaying(false);
    setReplaceMonth(null);
  }, [id]);

  const p = res.state.data;
  const can = (a: BillingPeriod['availableActions'][number]) => !!p?.availableActions.includes(a);
  const applied = (next: BillingPeriod) => {
    res.mutate(() => next);
    onChanged();
  };

  const patch = async (body: Parameters<typeof statementsApi.updateBillingPeriod>[3]) => {
    if (!p) return;
    setBanner(null);
    try {
      applied((await statementsApi.updateBillingPeriod(propertyId, p.id, p.version, body)).data);
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
        statementsApi.issueBillingPeriod(propertyId, p.id, p.version, p.warnings.length > 0, key),
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
        statementsApi.createBillingPeriod(
          propertyId,
          replaceMonth.reservationId,
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
                    {t('stmt.col_qty')} × {t('stmt.col_unit_price')}
                  </th>
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
                                  ...p.excludedLines.map((x) => x.folioLineId!),
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
                  <th scope="row" colSpan={3}>
                    {t('stmt.subtotal')}
                  </th>
                  <td className="r num">{num(p.totals.netVnd)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={3}>
                    {t('stmt.vat_total')}
                  </th>
                  <td className="r num">{num(p.totals.vatVnd)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={3}>
                    {t('stmt.rounding')}
                  </th>
                  <td className="r num">{signedNum(p.totals.roundingVnd)}</td>
                </tr>
                <tr className="total">
                  <th scope="row" colSpan={3}>
                    {t('stmt.total')}
                  </th>
                  <td className="r num">{num(p.totals.totalVnd)}</td>
                </tr>
                {p.totals.paidVnd > 0 ? (
                  <tr>
                    <th scope="row" colSpan={3}>
                      {t('stmt.paid')}
                    </th>
                    <td className="r num">−{num(p.totals.paidVnd)}</td>
                  </tr>
                ) : null}
                <tr className="total">
                  <th scope="row" colSpan={3}>
                    {t('stmt.balance')}
                  </th>
                  <td className="r num">{num(p.totals.balanceVnd)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {p.excludedLines.length ? (
            <section className="stack">
              <h3 className="label-h">{t('stmt.moved_title')}</h3>
              <ul className="list-plain">
                {p.excludedLines.map((l) => (
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
                            excludedFolioLineIds: p.excludedLines
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
          {l.meter ? (
            <div className="li-s mono">
              {meterNum(l.meter.from, l.unit)} → {meterNum(l.meter.to, l.unit)}
            </div>
          ) : null}
        </td>
        <td className="r num nowrap">
          {l.kind === 'rounding' || l.kind === 'prior_adjustment'
            ? ''
            : `${meterNum(l.quantity, l.unit)}${unit ? ` ${unit}` : ''} × ${num(l.unitPriceNetVnd)}`}
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
          <td colSpan={4}>
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
  const [amount, setAmount] = useState(String(p.totals.balanceVnd));
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
        statementsApi.recordBillingPeriodPayment(propertyId, p.id, { method, amountVnd: n }, key),
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
        await statementsApi.voidBillingPeriod(propertyId, p.id, reason.trim())
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
