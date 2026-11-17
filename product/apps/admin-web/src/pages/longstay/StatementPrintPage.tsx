import { isLocaleLoaded, loadLocale, translate, useI18n, type Args } from '@ottimo/i18n';
import { Button, QrCode, Seg } from '@ottimo/ui';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { statementsApi, type BillingPeriodPrint, type StatementLine } from '../../app/statements';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { dayText, lineText, meterNum, monthText, num, signedNum } from './labels';

/** Lines above this count print on A4 by default (contract §6.6 "dòng dài thì A5 tự sang A4" – UXD to confirm). */
export const A5_MAX_LINES = 9;
export type PaperSize = 'a5' | 'a4';

/** EN lead line + smaller VI line under it (contract §6.6) – always both, whatever the Desk language. */
function Bi({ k, args, as: Tag = 'span' }: { k: string; args?: Args; as?: 'span' | 'div' }) {
  return (
    <Tag className="bi">
      <span lang="en">{translate('en', k, args)}</span>
      <span className="vi" lang="vi">
        {translate('vi', k, args)}
      </span>
    </Tag>
  );
}

function BiText({ en, vi }: { en: string; vi: string }) {
  return (
    <span className="bi">
      <span lang="en">{en}</span>
      {vi !== en ? (
        <span className="vi" lang="vi">
          {vi}
        </span>
      ) : null}
    </span>
  );
}

const unitText = (l: StatementLine) => (l.unit === 'kwh' ? 'kWh' : l.unit === 'm3' ? 'm³' : '');

/**
 * The guest's monthly statement sheet (contract §6.6, brand guideline 17/10): only the 80/15/5 palette (CSS in
 * `statements.css` uses `--brand-*` only), Lora for the property name and title, Be Vietnam Pro for text, JetBrains
 * Mono for the statement code, meter readings and transfer content. No phone, e-mail, nationality or ID of the guest
 * (contract §9.1): full name and room only. The vacancy gap of a meter (INV 17/11) is internal – never printed.
 */
export function StatementSheet({ s, size }: { s: BillingPeriodPrint; size: PaperSize }) {
  const due = s.dueDate;
  const paid = s.status === 'paid';
  const voided = s.status === 'void';
  return (
    <article className={`stmt-sheet stmt-${size}`} data-paper={size} lang="en">
      <header className="stmt-hdr">
        <div>
          <div className="stmt-brand">{s.property.displayName}</div>
          <div className="stmt-muted">{s.property.addressLine}</div>
        </div>
        <div className="stmt-hdr-r">
          <h1 className="stmt-title">
            <Bi k="stmt.print.title" />
          </h1>
          <div className="mono stmt-code">{s.code}</div>
        </div>
      </header>

      <dl className="stmt-meta">
        <div>
          <dt>
            <Bi k="stmt.print.guest" />
          </dt>
          <dd>{s.guest.fullName}</dd>
        </div>
        <div>
          <dt>
            <Bi k="stmt.print.room" />
          </dt>
          <dd>{s.roomNos.join(', ')}</dd>
        </div>
        <div>
          <dt>
            <Bi k="stmt.print.month" />
          </dt>
          <dd>
            <BiText en={monthText('en', s.month)} vi={monthText('vi', s.month)} />
          </dd>
        </div>
        <div>
          <dt>
            <Bi k="stmt.print.issued" />
          </dt>
          <dd>
            <BiText
              en={dayText('en', s.issuedAt?.slice(0, 10))}
              vi={dayText('vi', s.issuedAt?.slice(0, 10))}
            />
          </dd>
        </div>
      </dl>

      <table className="stmt-table-print">
        <thead>
          <tr>
            <th scope="col">
              <Bi k="stmt.print.col_desc" />
            </th>
            <th scope="col" className="r">
              <Bi k="stmt.print.col_reading" />
            </th>
            <th scope="col" className="r">
              <Bi k="stmt.print.col_qty" />
            </th>
            <th scope="col" className="r">
              <Bi k="stmt.print.col_unit_price" />
            </th>
            <th scope="col" className="r">
              VAT
            </th>
            <th scope="col" className="r">
              <Bi k="stmt.print.col_amount" />
            </th>
          </tr>
        </thead>
        <tbody>
          {/* The rounding line is printed once, in the totals (BR-LS-09). */}
          {s.lines
            .filter((l) => l.kind !== 'rounding')
            .map((l, i) => {
              const flat = l.kind === 'rounding' || l.kind === 'prior_adjustment';
              return (
                <tr key={l.folioLineId ?? `${l.kind}-${i}`} className={`k-${l.kind}`}>
                  <td>
                    <BiText en={lineText('en', l)} vi={lineText('vi', l)} />
                  </td>
                  <td className="r mono">
                    {l.meter ? (
                      <>
                        {meterNum(l.meter.from, l.unit)} → {meterNum(l.meter.to, l.unit)}
                      </>
                    ) : null}
                  </td>
                  <td className="r">
                    {flat ? '' : `${meterNum(l.quantity, l.unit)} ${unitText(l)}`.trim()}
                  </td>
                  <td className="r">{flat ? '' : num(l.unitPriceNetVnd)}</td>
                  <td className="r">{l.vatRatePct === null ? '' : `${l.vatRatePct}%`}</td>
                  <td className="r">{signedNum(l.amountVnd)}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      <table className="stmt-totals">
        <tbody>
          <tr>
            <th scope="row">
              <Bi k="stmt.print.subtotal" />
            </th>
            <td className="r">{num(s.totals.netVnd)}</td>
          </tr>
          <tr>
            <th scope="row">
              <Bi k="stmt.print.vat" />
            </th>
            <td className="r">{num(s.totals.vatVnd)}</td>
          </tr>
          <tr>
            <th scope="row">
              <Bi k="stmt.print.rounding" />
            </th>
            <td className="r">{signedNum(s.totals.roundingVnd)}</td>
          </tr>
          <tr className="grand">
            <th scope="row">
              <Bi k="stmt.print.total" />
            </th>
            <td className="r">{num(s.totals.totalVnd)}</td>
          </tr>
          <tr>
            <th scope="row">
              <Bi k="stmt.print.paid" />
            </th>
            <td className="r">{s.totals.paidVnd ? `−${num(s.totals.paidVnd)}` : '0'}</td>
          </tr>
          <tr className="grand">
            <th scope="row">
              <Bi k="stmt.print.balance" />
            </th>
            <td className="r">{num(s.totals.balanceVnd)} VND</td>
          </tr>
        </tbody>
      </table>

      {voided ? (
        <div className="stmt-stamp void">
          <Bi k="stmt.print.void_stamp" />
        </div>
      ) : paid ? (
        <div className="stmt-stamp paid">
          <Bi k="stmt.print.paid_stamp" />
        </div>
      ) : null}

      {!voided && due && s.totals.balanceVnd > 0 ? (
        <p className="stmt-due">
          <BiText
            en={translate('en', 'stmt.print.pay_by', { date: dayText('en', due) })}
            vi={translate('vi', 'stmt.print.pay_by', { date: dayText('vi', due) })}
          />
        </p>
      ) : null}

      {s.vietqr && !voided ? (
        <section className="stmt-qr">
          <QrCode
            value={s.vietqr.payload}
            size={100}
            label={translate('en', 'stmt.print.qr_label', {
              amount: num(s.vietqr.amountVnd),
              ref: s.vietqr.transferContent,
            })}
          />
          <dl>
            <div>
              <dt>
                <Bi k="stmt.print.qr_amount" />
              </dt>
              <dd className="stmt-qr-amt">{num(s.vietqr.amountVnd)} VND</dd>
            </div>
            <div>
              <dt>
                <Bi k="stmt.print.qr_content" />
              </dt>
              <dd className="mono">{s.vietqr.transferContent}</dd>
            </div>
            <div>
              <dt>
                <Bi k="stmt.print.qr_bank" />
              </dt>
              <dd>
                {s.vietqr.bankShortName} · {s.vietqr.accountHolder} ·{' '}
                <span className="mono">{s.vietqr.accountNoMasked}</span>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <footer className="stmt-foot">
        <p>
          <Bi k="stmt.print.vat_note" />
        </p>
        <p>
          <Bi k="stmt.print.contact" /> <span className="nowrap">{s.property.hotline}</span> ·{' '}
          <span className="nowrap">{s.property.email}</span>
        </p>
        <p className="stmt-printed">
          {translate('en', 'stmt.print.printed', {
            date: dayText('en', s.printedAt.slice(0, 10)),
            by: s.printedByInitials,
          })}
        </p>
      </footer>
    </article>
  );
}

/**
 * `/print/statements/:id` (contract §6.6) – the sheet on screen with A5/A4 and Print, and the copy the print
 * stylesheet keeps (`body > .print-root`, hifi.css §16) with the paper size as a class on `.print-root`
 * (`stmt-paper-a5` / `stmt-paper-a4` → named `@page` in `statements.css`). The URL holds only the id.
 */
export function StatementPrintPage() {
  const { t } = useI18n();
  const { id = '' } = useParams();
  const propertyId = usePropertyId();
  const ids = useId();
  const res = useResource(
    async () => (await statementsApi.getBillingPeriodPrint(propertyId, id)).data,
    [propertyId, id],
  );
  const [enReady, setEnReady] = useState(() => isLocaleLoaded('en'));
  useEffect(() => {
    if (enReady) return;
    let stale = false;
    loadLocale('en').then(
      () => !stale && setEnReady(true),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [enReady]);
  const s = res.state.data;
  const [size, setSize] = useState<PaperSize | null>(null);
  const paper: PaperSize = size ?? (s && s.lines.length > A5_MAX_LINES ? 'a4' : 'a5');

  let body: ReactNode;
  if (res.state.status === 'error')
    body = <ErrorBlock titleKey="stmt.load_error" error={res.state.error} onRetry={res.reload} />;
  else if (!s || !enReady) body = <LoadingBlock />;
  else
    body = (
      <>
        <div className="stmt-preview" data-paper={paper}>
          <StatementSheet s={s} size={paper} />
        </div>
        {createPortal(
          <div className={`print-root stmt-paper-${paper}`} aria-hidden="true">
            <StatementSheet s={s} size={paper} />
          </div>,
          document.body,
        )}
      </>
    );

  return (
    <div className="stmt-print-page">
      <div className="stmt-toolbar row wrap">
        <span className="label-h" id={`${ids}-paper`}>
          {t('stmt.paper')}
        </span>
        <Seg
          labelledBy={`${ids}-paper`}
          value={paper}
          onChange={setSize}
          options={[
            { value: 'a5', label: 'A5' },
            { value: 'a4', label: 'A4' },
          ]}
        />
        <Link className="btn" to="/long-stay/statements">
          {t('common.back')}
        </Link>
        <Button variant="pri" icon="printer" disabled={!s} onClick={() => window.print()}>
          {t('stmt.print')}
        </Button>
      </div>
      {body}
    </div>
  );
}
