import { isApiError, type Bill, type CheckOutBody, type FolioLine } from '@ottimo/api-client';
import { isLocaleLoaded, loadLocale, translate, useI18n, type Args } from '@ottimo/i18n';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  ConfirmDialog,
  Field,
  Modal,
  Seg,
  Stepper,
  Switch,
} from '@ottimo/ui';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { timeHHmm } from '../../app/dates';
import { hasLineKey, lineLabel } from '../../app/folio';
import { useRules } from '../../app/rules';
import { useToast } from '../../app/toast';
import { Page, Topbar } from '../../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useDebounced } from '../../hooks/useDebounced';
import { useOnline } from '../../hooks/useOnline';
import { useResource } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';
import { PaymentPanel } from './PaymentPanel';
import { AddChargeDialog } from './StayDialogs';

const OWN_MGR = ['owner', 'manager'];
const STEPS = ['checkout.step.minibar', 'checkout.step.extras', 'checkout.step.bill'];
const EXTRAS: Array<{ key: string; preset: string }> = [
  { key: 'checkout.extras.laundry', preset: 'LAUNDRY_KG' },
  { key: 'checkout.extras.food', preset: 'FNB' },
  { key: 'checkout.extras.damage', preset: 'damage' },
  { key: 'checkout.extras.smoking', preset: 'SMOKING' },
  { key: 'checkout.extras.card', preset: 'CARD_LOST' },
];

/**
 * H16 Trả phòng 3 bước (S07, US-035…039, B18): minibar (counts 0…standard) → extras (actual
 * departure time, late surcharge only when the desk confirms the amount – BR-414, re-priced by the
 * real time – G-10) → bill + payment (VietQR drawn locally, cash/transfer/POS, company invoice) →
 * "Hoàn tất" with the consequence box (US-135). Server blockers (balance, approvals, minibar, credit)
 * are shown in place; a credit balance needs a handling choice (`overpaymentHandling`, G-15).
 */
export function CheckOutPage({ reservationId }: { reservationId: string }) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const rules = useRules(propertyId, roles);
  const { online, since } = useOnline();
  const toast = useToast();
  const ids = useId();
  const mgr = roles.some((r) => OWN_MGR.includes(r));
  const R = { propertyId, reservationId };

  const res = useResource(
    async () => (await api.getReservation(R)).data,
    [propertyId, reservationId],
  );
  const r = res.state.data;
  const [step, setStep] = useState(0);
  const [time, setTime] = useState('');
  const qTime = useDebounced(time, 300);
  const sum = useResource(
    async () => (await api.getCheckoutSummary(R, qTime || undefined)).data,
    [propertyId, reservationId, qTime],
  );
  const s = sum.state.data;
  const std = useResource(
    async () => (await api.getMinibarStandard(R)).data,
    [propertyId, reservationId],
  );
  const [left, setLeft] = useState<Record<string, number>>({});
  const [lateTold, setLateTold] = useState(false);
  const [timeNote, setTimeNote] = useState('');
  const [extraRate, setExtraRate] = useState('');
  const [extra, setExtra] = useState<string | null>(null);
  const [invoice, setInvoice] = useState(false);
  const [inv, setInv] = useState({ companyName: '', taxCode: '', email: '', address: '' });
  const [overMode, setOverMode] = useState<'refund_request' | 'retain_with_guest_consent'>(
    'refund_request',
  );
  const [overReason, setOverReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [done, setDone] = useState<{ billNo: string } | null>(null);
  const minibarAct = useSubmit();
  const invAct = useSubmit();
  const act = useSubmit();

  useEffect(() => {
    const items = std.state.data?.items;
    if (!items) return;
    const latest = std.state.data?.latestCheck?.lines;
    setLeft(
      Object.fromEntries(
        items.map((i) => [
          i.itemId,
          latest?.find((l) => l.itemId === i.itemId)?.remainingQty ?? i.standardQty,
        ]),
      ),
    );
  }, [std.state.data]);
  useEffect(() => {
    // E03-07: never a future time – before the agreed/standard time the default is "now"; in the
    // post-midnight window (0.3.6 add. 2) the guest leaves now, early in the departure day.
    if (s && !time) {
      const now = timeHHmm(new Date());
      const std = s.checkoutTime.slice(0, 5);
      setTime(s.postMidnightWindow || (now >= '06:00' && now < std) ? now : std);
    }
    // first summary only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.checkoutTime]);

  if (!r && res.state.status === 'error')
    return (
      <>
        <Topbar title={t('drawer.action.check_out')} />
        <Page>
          <ErrorBlock
            titleKey="co.error_title"
            error={res.state.error}
            onRetry={res.reload}
            autoRetrySeconds={res.state.autoRetrySeconds}
          />
        </Page>
      </>
    );
  if (!r)
    return (
      <>
        <Topbar title={t('drawer.action.check_out')} />
        <Page>
          <LoadingBlock />
        </Page>
      </>
    );

  const room = r.segments?.[0]?.roomNo ?? '';
  const guest = r.booker?.displayName ?? '';
  const items = std.state.data?.items ?? [];
  const chargeable = items.some((i) => !i.isFree);
  const minibarTotal = items.reduce(
    (a, i) =>
      a +
      (i.isFree ? 0 : (i.standardQty - (left[i.itemId] ?? i.standardQty)) * (i.unitPriceVnd ?? 0)),
    0,
  );
  const lateAmount = s?.lateCheckoutSurcharge?.amountVnd ?? 0;
  // `{max}` of MINIBAR_QTY_OVER_STANDARD = standard of the item the server flagged (lines[i]).
  const badIdx = Object.keys(minibarAct.fields)
    .map((k) => /^lines\[(\d+)\]/.exec(k)?.[1])
    .find((x) => x !== undefined);
  const minibarMax = badIdx !== undefined ? (items[Number(badIdx)]?.standardQty ?? '') : '';
  const lines: FolioLine[] = s?.lines ?? [];
  const extraNightNeeded = !!s?.extraNightRequired;
  const extraUnavailable = extraNightNeeded && s?.extraNightAvailable === false;
  // E05-11: the extra night is posted inside the check-out transaction, so the summary does not
  // include it yet – balance/credit shown here are what B18 will see after that night.
  const extraNightVnd =
    extraNightNeeded && !extraUnavailable
      ? amountOf(extraRate) || (s?.extraNightDefaultRateVnd ?? 0)
      : 0;
  // 0.3.6 add. 2: only credit not yet covered by a refund request needs a decision.
  const credit0 = s?.unhandledCreditVnd ?? s?.creditVnd ?? 0;
  const balance = Math.max(0, (s?.balanceDueVnd ?? 0) + extraNightVnd - credit0);
  const credit = Math.max(0, credit0 - extraNightVnd - (s?.balanceDueVnd ?? 0));
  const pendingFoc = lines.filter((l) => l.lineState === 'pending_approval');
  const reload = () => {
    sum.reload();
    res.reload();
  };

  const saveMinibar = async () => {
    if (!chargeable) {
      setStep(1);
      return;
    }
    const out = await minibarAct.submit((idem) =>
      api.recordMinibarCheck(
        R,
        {
          mode: 'checkout',
          lines: items.map((i) => ({
            itemId: i.itemId,
            remainingQty: left[i.itemId] ?? i.standardQty,
          })),
        },
        idem,
      ),
    );
    if (out) {
      sum.reload();
      setStep(1);
    }
  };

  const saveInvoice = async () => {
    const out = await invAct.submit(() =>
      api.setInvoiceRequest(
        { propertyId, folioId: r.folioId },
        invoice
          ? {
              buyerType: 'company',
              companyName: inv.companyName.trim(),
              taxCode: inv.taxCode.trim(),
              email: inv.email.trim() || undefined,
              address: inv.address.trim() || undefined,
            }
          : { buyerType: 'individual' },
      ),
    );
    if (out) toast(t('common.saved'));
  };

  const complete = async () => {
    const body: CheckOutBody = {
      checkoutTime: time || s?.checkoutTime || rules.checkoutTime,
      checkoutTimeNote: timeNote.trim() || undefined,
      applyLateSurcharge: lateAmount > 0 && lateTold,
      expectedSurchargeVnd: lateAmount > 0 && lateTold ? lateAmount : undefined,
      // E05-11: after the last late tier the check-out itself adds one night at this rate.
      extraNight: extraNightNeeded ? { rateVnd: extraNightVnd } : undefined,
      overpaymentHandling: credit > 0 ? { mode: overMode, reason: overReason.trim() } : undefined,
    };
    const out = await act.submit((idem) => api.checkOut(R, body, r.version, idem));
    setConfirm(false);
    if (!out) {
      sum.reload();
      if (isApiError(act.error) && act.error.code === 'VERSION_CONFLICT') res.reload();
      return;
    }
    toast(t('checkout.done'));
    setDone({ billNo: out.data.billNo });
    res.reload();
  };

  const openBill = async () => {
    try {
      setBill((await api.getBill({ propertyId, folioId: r.folioId })).data);
    } catch (e) {
      act.setError(e);
    }
  };

  const steps = (
    <ol className="progress-steps" aria-label={t('checkout.steps_label')}>
      {STEPS.map((k, i) => (
        <li
          key={k}
          className={i < step ? 'done' : undefined}
          aria-current={i === step ? 'step' : undefined}
        >
          {t(k)}
        </li>
      ))}
    </ol>
  );

  const summaryCard = (
    <section className="card" aria-labelledby={`${ids}-sum`}>
      <h2 className="label-h" id={`${ids}-sum`}>
        {t('drawer.folio.title')}
      </h2>
      {!s ? (
        <LoadingBlock rows={2} />
      ) : (
        <table className="sum">
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className={l.lineState === 'pending_approval' ? 'sub' : undefined}>
                <td>
                  {lineLabel(t, l)}
                  {l.lineState === 'pending_approval' ? (
                    <>
                      {' '}
                      <Chip tone="warn" icon="hourglass">
                        {t('approval.status.pending')}
                      </Chip>
                    </>
                  ) : null}
                </td>
                <td className="r num">{vnd(l.amountVnd)}</td>
              </tr>
            ))}
            {extraNightVnd > 0 ? (
              <tr>
                <td>
                  {lineLabel(t, {
                    category: 'room',
                    serviceDate: r.departureDate,
                    description: 'extra_night',
                    labelKey: 'bill.line.extra_night',
                    labelParams: { date: r.departureDate },
                  } as unknown as FolioLine)}
                </td>
                <td className="r num">{vnd(extraNightVnd)}</td>
              </tr>
            ) : null}
            {s.paidVnd > 0 ? (
              <tr className="sub">
                <td>{t('drawer.folio.paid')}</td>
                <td className="r num">−{vnd(s.paidVnd)}</td>
              </tr>
            ) : null}
            <tr className="total">
              <td>{t('checkout.summary.balance')}</td>
              <td className="r num" aria-live="polite">
                {money(balance)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );

  let body = null;
  if (done) {
    body = (
      <div className="card stack" role="status">
        <b>{t('checkout.done')}</b>
        <p>{t('co.done_tasks', { bill: done.billNo })}</p>
        <div className="row wrap">
          <Button icon="printer" onClick={() => void openBill()}>
            {t('co.preview_bill')}
          </Button>
          <Link className="btn" to={`/reservations/${reservationId}`}>
            {t('ci.back_to_booking')}
          </Link>
        </div>
      </div>
    );
  } else if (step === 0) {
    body = (
      <section className="card stack">
        {!std.state.data ? (
          std.state.status === 'error' ? (
            <ErrorBlock titleKey="co.error_title" error={std.state.error} onRetry={std.reload} />
          ) : (
            <LoadingBlock rows={3} />
          )
        ) : !chargeable ? (
          <p>{t('checkout.minibar.empty')}</p>
        ) : (
          <>
            {/* FE-S3-14: only with the name of who checked (MinibarCheck has no name yet – ARC). */}
            {std.state.data.latestCheck?.mode === 'checkout' &&
            std.state.data.latestCheck.checkedAt &&
            (std.state.data.latestCheck as { checkedByName?: string }).checkedByName ? (
              <Alert tone="info">
                {t('checkout.minibar.from_hk', {
                  time: timeHHmm(new Date(std.state.data.latestCheck.checkedAt)),
                  who:
                    (std.state.data.latestCheck as { checkedByName?: string }).checkedByName ?? '',
                })}
              </Alert>
            ) : null}
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">{t('checkout.step.minibar')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('co.item')}</th>
                    <th scope="col" className="c">
                      {t('co.std')}
                    </th>
                    <th scope="col" className="c">
                      {t('checkout.minibar.left')}
                    </th>
                    <th scope="col" className="c">
                      {t('checkout.minibar.used')}
                    </th>
                    <th scope="col" className="r">
                      {t('co.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => {
                    const rem = left[i.itemId] ?? i.standardQty;
                    const used = i.standardQty - rem;
                    return (
                      <tr key={i.itemId}>
                        <th scope="row" id={`${ids}-i${idx}`}>
                          {i.itemName}
                          {i.isFree
                            ? ` · ${t('checkout.minibar.free')}`
                            : ` · ${vnd(i.unitPriceVnd ?? 0)}`}
                        </th>
                        <td className="c num">{i.standardQty}</td>
                        <td className="c">
                          <Stepper
                            value={rem}
                            min={0}
                            max={i.standardQty}
                            onChange={(v) => setLeft((x) => ({ ...x, [i.itemId]: v }))}
                            labelledBy={`${ids}-i${idx}`}
                            decLabel={t('rooms.dec')}
                            incLabel={t('rooms.inc')}
                          />
                        </td>
                        <td className="c num">{used}</td>
                        <td className="r num">
                          {i.isFree
                            ? t('checkout.minibar.free')
                            : vnd(used * (i.unitPriceVnd ?? 0))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="num">
              <b>
                {t('co.minibar_total')}: {vnd(minibarTotal)}
              </b>
            </p>
            {minibarAct.view({ max: minibarMax })}
          </>
        )}
      </section>
    );
  } else if (step === 1) {
    body = (
      <section className="card stack">
        <Field
          label={t('checkout.departure_time')}
          help={
            r.agreedCheckoutTime
              ? t('co.time_from_late', { time: r.agreedCheckoutTime })
              : undefined
          }
          error={act.fields.checkoutTime}
        >
          {(p) => (
            <input
              {...p}
              type="time"
              className="input"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setLateTold(false);
              }}
            />
          )}
        </Field>
        {s?.postMidnightWindow ? <Alert tone="info">{t('checkout.post_midnight')}</Alert> : null}
        {act.fields.checkoutTimeNote || timeNote ? (
          <Field
            label={t('checkout.time_note')}
            help={t('stay.time_note_help')}
            required
            error={act.fields.checkoutTimeNote}
          >
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={300}
                value={timeNote}
                onChange={(e) => setTimeNote(e.target.value)}
              />
            )}
          </Field>
        ) : null}
        {extraNightNeeded ? (
          // E05-11: one more night instead of a late surcharge; the rate defaults to the direct
          // calendar price of that night. The room taken tonight → no extra night possible.
          extraUnavailable ? (
            <Alert tone="bad" title={t('checkout.extra_night_title')}>
              {t('checkout.extra_night_unavailable')}
            </Alert>
          ) : (
            <div className="stack">
              <Alert tone="warn" title={t('checkout.extra_night_title')}>
                {t('checkout.extra_night_body', { amount: money(extraNightVnd) })}
              </Alert>
              <MoneyField
                label={t('checkout.extra_night_rate_label')}
                help={t('checkout.extra_night_rate_help')}
                required
                value={extraRate || vnd(s?.extraNightDefaultRateVnd ?? 0)}
                onChange={setExtraRate}
                error={act.fields['extraNight.rateVnd'] ?? act.fields.extraNight}
              />
            </div>
          )
        ) : null}
        <div aria-live="polite">
          {extraNightNeeded ? null : lateAmount > 0 ? (
            <p>
              <b>
                {t('checkout.late_fee', {
                  amount: money(lateAmount),
                  pct: s?.lateCheckoutSurcharge?.tierPct ?? 0,
                })}
              </b>
            </p>
          ) : (
            <p>{t('checkout.late_none')}</p>
          )}
          {s?.lateSurchargeRecalc ? (
            <Alert tone="info">
              {t('checkout.late_recalc', {
                old: money(s.lateSurchargeRecalc.oldVnd ?? 0),
                new: money(s.lateSurchargeRecalc.newVnd ?? 0),
              })}
            </Alert>
          ) : null}
        </div>
        {lateAmount > 0 ? (
          // SURCHARGE_DECISION_REQUIRED (0.3.6): a surcharge > 0 needs the desk's decision – required.
          <Checkbox checked={lateTold} onChange={setLateTold}>
            {t('ci.told_guest')} *
          </Checkbox>
        ) : null}
        {!r.agreedCheckoutTime ? <p className="li-s">{t('co.late_switch_hint')}</p> : null}
        <h3 className="label-h">{t('co.extras_title')}</h3>
        <div className="row wrap">
          {EXTRAS.map((x) => (
            <Button key={x.key} size="sm" disabled={!online} onClick={() => setExtra(x.preset)}>
              {t(x.key)}
            </Button>
          ))}
        </div>
        {pendingFoc.map((l) => (
          <Alert key={l.id} tone="warn">
            {t('co.foc_pending', { amount: money(Math.abs(l.amountVnd)) })}{' '}
            <Link to="/approvals">{t('co.see_approval')}</Link>
          </Alert>
        ))}
      </section>
    );
  } else {
    body = (
      <div className="stack">
        <section className="card stack">
          <p className="kv-big num">
            {t('bill.total')}: {money(s?.totalVnd ?? 0)}
          </p>
          {balance > 0 ? (
            online ? (
              <PaymentPanel reservation={r} balanceVnd={balance} onPaid={reload} />
            ) : (
              <p className="li-s">{t('rsv.need_online')}</p>
            )
          ) : (
            <Chip tone="ok">{t('drawer.folio.settled')}</Chip>
          )}
          <p className="li-s">{t('co.recon_explain')}</p>
          {balance > 0 ? <p className="li-s">{t('co.partial_hint')}</p> : null}
        </section>
        {credit > 0 ? (
          <section className="card stack" aria-labelledby={`${ids}-over`}>
            <h3 className="label-h" id={`${ids}-over`}>
              {t('checkout.blocked_credit', { amount: money(credit) })}
            </h3>
            <label className="check">
              <input
                type="radio"
                name={`${ids}-om`}
                checked={overMode === 'refund_request'}
                onChange={() => setOverMode('refund_request')}
              />
              {t('checkout.overpay.refund_request', { amount: money(credit) })}
            </label>
            {mgr ? (
              <label className="check">
                <input
                  type="radio"
                  name={`${ids}-om`}
                  checked={overMode === 'retain_with_guest_consent'}
                  onChange={() => setOverMode('retain_with_guest_consent')}
                />
                {t('checkout.overpay.retain')}
              </label>
            ) : null}
            <Field label={t('ci.reason')} required error={act.fields['overpaymentHandling.reason']}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  maxLength={500}
                  value={overReason}
                  onChange={(e) => setOverReason(e.target.value)}
                />
              )}
            </Field>
          </section>
        ) : null}
        <section className="card stack">
          <Switch checked={invoice} onChange={setInvoice}>
            {t('co.invoice_toggle')}
          </Switch>
          {invoice ? (
            <div className="g-2">
              <Field label={t('co.company_name')} required error={invAct.fields.companyName}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    value={inv.companyName}
                    onChange={(e) => setInv((x) => ({ ...x, companyName: e.target.value }))}
                  />
                )}
              </Field>
              <Field label={t('co.tax_code')} required error={invAct.fields.taxCode}>
                {(p) => (
                  <input
                    {...p}
                    className="input mono"
                    inputMode="numeric"
                    value={inv.taxCode}
                    onChange={(e) => setInv((x) => ({ ...x, taxCode: e.target.value }))}
                  />
                )}
              </Field>
              <Field label={t('invoice.address')} error={invAct.fields.address}>
                {(p) => (
                  <input
                    {...p}
                    className="input"
                    maxLength={300}
                    value={inv.address}
                    onChange={(e) => setInv((x) => ({ ...x, address: e.target.value }))}
                  />
                )}
              </Field>
              <Field label={t('co.invoice_email')} error={invAct.fields.email}>
                {(p) => (
                  <input
                    {...p}
                    type="email"
                    className="input"
                    value={inv.email}
                    onChange={(e) => setInv((x) => ({ ...x, email: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          ) : null}
          {invoice ? (
            <>
              <p className="li-s">{t('co.invoice_r3')}</p>
              <Button size="sm" busy={invAct.busy} onClick={() => void saveInvoice()}>
                {t('common.save')}
              </Button>
            </>
          ) : null}
          {invAct.view()}
        </section>
        <Button icon="printer" onClick={() => void openBill()}>
          {t('co.preview_bill')}
        </Button>
      </div>
    );
  }

  // FE-S3-04: say why "Hoàn tất" is locked (first missing thing).
  const whyLocked = extraUnavailable
    ? t('checkout.extra_night_unavailable')
    : lateAmount > 0 && !lateTold
      ? t('ci.told_guest')
      : credit > 0 && overReason.trim().length < 3
        ? t('checkout.overpay.needs_reason')
        : null;
  const blocked = whyLocked !== null;
  return (
    <>
      <Topbar title={t('checkout.title', { room, guest })} sub={r.code} />
      <Page>
        {!online ? (
          <Alert tone="warn" icon="offline">
            {t('co.offline', { time: since ? timeHHmm(since) : '' })}
          </Alert>
        ) : null}
        {done ? null : steps}
        <div className="cols-2">
          <div className="stack">
            {body}
            {done ? null : act.view()}
          </div>
          <div className="stack">{summaryCard}</div>
        </div>
        {done ? null : (
          <div className="wiz-foot">
            {step === 0 ? (
              <Link className="btn ghost" to={`/reservations/${reservationId}`}>
                {t('ci.back_to_booking')}
              </Link>
            ) : (
              <Button variant="ghost" onClick={() => setStep((x) => x - 1)}>
                {t('common.back')}
              </Button>
            )}
            {!online ? (
              <Button variant="pri" aria-disabled="true" onClick={() => undefined}>
                {t('rsv.need_online')}
              </Button>
            ) : step === 0 ? (
              <>
                {chargeable ? (
                  <Button
                    onClick={() =>
                      setLeft(Object.fromEntries(items.map((i) => [i.itemId, i.standardQty])))
                    }
                  >
                    {t('checkout.minibar.all_full')}
                  </Button>
                ) : null}
                <Button
                  variant="pri"
                  busy={minibarAct.busy}
                  busyLabel={minibarAct.busyLabel}
                  onClick={() => void saveMinibar()}
                >
                  {minibarAct.label(t('co.go_extras'))}
                </Button>
              </>
            ) : step === 1 ? (
              <Button variant="pri" onClick={() => setStep(2)}>
                {t('co.go_bill')}
              </Button>
            ) : (
              <>
                {whyLocked ? (
                  <span className="li-s" id={`${ids}-why`}>
                    {whyLocked}
                  </span>
                ) : null}
                <Button
                  variant="pri"
                  aria-disabled={blocked || undefined}
                  aria-describedby={whyLocked ? `${ids}-why` : undefined}
                  busy={act.busy}
                  busyLabel={act.busyLabel}
                  onClick={() => !blocked && setConfirm(true)}
                >
                  {act.label(
                    balance === 0 && (s?.paidVnd ?? 0) > 0
                      ? t('co.complete_paid', { amount: money(s?.paidVnd ?? 0) })
                      : t('checkout.complete'),
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </Page>
      {confirm ? (
        <ConfirmDialog
          danger={false}
          title={t('checkout.complete_confirm_title', { room })}
          body={t('co.effect_status')}
          keepLabel={t('confirm.keep')}
          confirmLabel={
            balance === 0
              ? t('co.complete_paid', { amount: money(s?.paidVnd ?? 0) })
              : t('checkout.complete')
          }
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setConfirm(false)}
          onConfirm={() => void complete()}
        >
          <ul className="list-plain li-s">
            <li>{t('co.effect_bill')}</li>
            <li>{t('co.effect_door', { room })}</li>
            {r.extraGuestCount ? <li>{t('co.effect_kit_note')}</li> : null}
          </ul>
          {act.view()}
        </ConfirmDialog>
      ) : null}
      {extra ? (
        <AddChargeDialog
          reservation={r}
          preset={extra}
          onClose={() => setExtra(null)}
          onDone={() => {
            setExtra(null);
            sum.reload();
          }}
        />
      ) : null}
      {bill ? (
        <BillDialog bill={bill} channel={r.channelCode} onClose={() => setBill(null)} />
      ) : null}
    </>
  );
}

/**
 * H16 16.5 Phiếu thanh toán (FE-S3-06, DOM FE-03): the slip has its own title, tax code, number or
 * preview note, column headers, and every fixed label in VI with the EN line under it (`.en`,
 * `lang="en"`) when bilingual. Printing renders a copy into `<div class="print-root">` directly under
 * `<body>` (hifi.css §16 prints only that, A5, white paper even in dark mode). Line texts come from
 * `labelKey`/`labelParams` (fallback: server description).
 */
export function BillDialog({
  bill,
  channel,
  onClose,
}: {
  bill: Bill;
  /** Channel name for "Tiền phòng {n} đêm – đã thanh toán qua {channel}" (G-13). */
  channel?: string;
  onClose: () => void;
}) {
  const { t, vnd, money, date, dateTime } = useI18n();
  const ids = useId();
  const [bilingual, setBilingual] = useState(bill.locale === 'vi_en');
  // EN strings are a lazy chunk – load them for the bilingual bill even when the UI is Vietnamese.
  const [enReady, setEnReady] = useState(() => isLocaleLoaded('en'));
  useEffect(() => {
    if (!bilingual || enReady) return;
    let stale = false;
    loadLocale('en').then(
      () => !stale && setEnReady(true),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [bilingual, enReady]);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) return;
    window.print();
    setPrinting(false);
  }, [printing]);

  const both = bilingual && enReady;
  const L = (key: string, args?: Args) => (
    <>
      {t(key, args)}
      {both ? (
        <span className="en" lang="en">
          {translate('en', key, args)}
        </span>
      ) : null}
    </>
  );
  const credit = (bill as Bill & { creditVnd?: number }).creditVnd ?? 0;
  const roomLines = bill.lines.filter((l) => l.category === 'room');
  const shown = bill.lines.filter(
    (l) => !(bill.paymentModel === 'ota_prepaid' && l.category === 'room'),
  );

  const paper = (
    <div className="bill-paper">
      <div className="hdr">
        <div>
          <b>{bill.property?.name}</b>
          <div className="li-s">{bill.property?.address}</div>
          {bill.property?.taxCode ? (
            <div className="li-s">{t('bill.tax_code', { code: bill.property.taxCode })}</div>
          ) : null}
        </div>
        <div className="r">
          {bill.billNo ? (
            <>
              <div>
                {L('bill.no')} <span className="mono">{bill.billNo}</span>
              </div>
              <div className="li-s">
                {t('bill.issued_at', { time: dateTime(new Date().toISOString()) })}
              </div>
            </>
          ) : (
            <div className="li-s">{L('bill.preview_note')}</div>
          )}
        </div>
      </div>
      <h2>{L('bill.title')}</h2>
      <p>
        {bill.guestDisplayName} · {bill.roomNo} · {date(bill.arrivalDate)} →{' '}
        {date(bill.departureDate)}
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">{L('bill.col_desc')}</th>
            <th scope="col" className="r">
              {L('bill.col_amount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {bill.paymentModel === 'ota_prepaid' && bill.otaPrepaidVnd ? (
            <tr>
              <td>{L('bill.ota_prepaid', { n: roomLines.length, channel: channel ?? '' })}</td>
              <td className="r">{vnd(bill.otaPrepaidVnd)}</td>
            </tr>
          ) : null}
          {shown.map((l) => (
            <tr key={l.id}>
              <td>
                {lineLabel(t, l)}
                {/* labelKey is translatable here – free text params (item names) stay as given. */}
                {both && hasLineKey(l) ? (
                  <span className="en" lang="en">
                    {lineLabel((k, a) => translate('en', k, a), l)}
                  </span>
                ) : null}
              </td>
              <td className="r">{vnd(l.amountVnd)}</td>
            </tr>
          ))}
          <tr className="total">
            <td>{L('bill.total')}</td>
            <td className="r">{vnd(bill.totalVnd)}</td>
          </tr>
          {bill.paidVnd > 0 ? (
            <tr>
              <td>{L('bill.paid')}</td>
              <td className="r">−{vnd(bill.paidVnd)}</td>
            </tr>
          ) : null}
          {(bill.refunds ?? []).map((x, i) => (
            <tr key={i}>
              <td>
                {L('bill.refund', {
                  amount: money(x.amountVnd),
                  method: t(x.method === 'cash' ? 'pay.cash' : 'pay.bank_transfer'),
                })}
              </td>
              <td className="r">{vnd(x.amountVnd)}</td>
            </tr>
          ))}
          <tr className="total">
            <td>{L('bill.balance')}</td>
            <td className="r">{vnd(bill.balanceDueVnd)}</td>
          </tr>
          {credit > 0 ? (
            <tr>
              <td>{L('bill.refund_due', { amount: money(credit) })}</td>
              <td className="r">{vnd(credit)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="foot">
        {both && bill.usdReference?.totalUsd !== undefined ? (
          <p>
            {t('common.approx_usd', {
              usd: bill.usdReference.totalUsd,
              rate: vnd(bill.usdReference.rate ?? 0),
              date: date(bill.usdReference.rateUpdatedOn),
            })}
          </p>
        ) : null}
        <p>{L('bill.vat_note')}</p>
        {bill.balanceDueVnd === 0 && bill.billNo ? (
          <Chip tone="ok">{L('bill.paid_stamp')}</Chip>
        ) : null}
      </div>
    </div>
  );

  return (
    <Modal
      open
      size="lg"
      title={t('bill.title')}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <span className="label-h" id={`${ids}-lang`}>
            {t('bill.lang_label')}
          </span>
          <Seg
            labelledBy={`${ids}-lang`}
            value={bilingual ? 'vi_en' : 'vi'}
            onChange={(v) => setBilingual(v === 'vi_en')}
            options={[
              { value: 'vi', label: t('co.bill_vi') },
              { value: 'vi_en', label: t('co.bill_vien') },
            ]}
          />
          <Button variant="pri" icon="printer" onClick={() => setPrinting(true)}>
            {t('co.print')}
          </Button>
        </>
      }
    >
      {paper}
      {/* Only while printing: the copy the print stylesheet keeps (body > .print-root). */}
      {printing
        ? createPortal(
            <div className="print-root" aria-hidden="true">
              {paper}
            </div>,
            document.body,
          )
        : null}
    </Modal>
  );
}
