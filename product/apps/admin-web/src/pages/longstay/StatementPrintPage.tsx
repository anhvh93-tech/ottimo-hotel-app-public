import { isLocaleLoaded, loadLocale, translate, useI18n, type Args } from '@ottimo/i18n';
import { Button, QrCode, Seg } from '@ottimo/ui';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../app/api';
import type { BillingPeriodPrint, StatementLine } from '../../app/statements';
import { ErrorBlock, LoadingBlock } from '../../components/states';
import { useResource } from '../../hooks/useResource';
import { usePropertyId } from '../../session/SessionProvider';
import { dayText, lineAmount, lineText, meterNum, num, rangeText, signedNum } from './labels';

/**
 * UXD-189-03: A5 when the printed lines (rounding not counted) are ≤ 6 – rent + electricity + water + up to 3
 * services or adjustments; from 7 lines A4. A height guard switches to A4 as well when the A5 sheet overflows.
 */
export const A5_MAX_LINES = 6;
/** Printable height of A5 portrait with the 8 mm margins of `@page stmt-a5` (210 − 16 mm). */
export const A5_PRINT_HEIGHT_MM = 194;
export type PaperSize = 'a5' | 'a4';

export const printedLines = (s: { lines: StatementLine[] }) =>
  s.lines.filter((l) => l.kind !== 'rounding').length;

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
  // The QR block needs the server's payload; amount and reference fall back to the sheet's own figures.
  const qr = s.vietqr?.payload
    ? {
        ...s.vietqr,
        payload: s.vietqr.payload,
        amountVnd: s.vietqr.amountVnd ?? s.totals.balanceVnd,
        transferContent: s.vietqr.transferContent ?? s.code ?? '',
      }
    : null;
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
          {/* UXD-189-11: "The Mist · 203" – the room name for the guest, the number in Mono. */}
          <dd>
            {s.roomNos.map((no, i) => {
              const name = s.roomNames?.[i];
              return (
                <span key={no} className="nowrap">
                  {i ? ', ' : ''}
                  {name ? <span className="stmt-room-name">{name} · </span> : null}
                  <span className={name ? 'mono' : undefined}>{no}</span>
                </span>
              );
            })}
          </dd>
        </div>
        {/* UXD-189-02: rent of M in advance, utilities and services of M−1 – both printed, no "Month". */}
        {s.rentPeriod ? (
          <div>
            <dt>
              <Bi k="stmt.print.rent_period" />
            </dt>
            <dd>
              <BiText en={rangeText('en', s.rentPeriod)} vi={rangeText('vi', s.rentPeriod)} />
            </dd>
          </div>
        ) : null}
        {s.utilityPeriod ? (
          <div>
            <dt>
              <Bi k="stmt.print.utility_period" />
            </dt>
            <dd>
              <BiText en={rangeText('en', s.utilityPeriod)} vi={rangeText('vi', s.utilityPeriod)} />
            </dd>
          </div>
        ) : null}
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
              <Bi k="stmt.print.col_vat" />
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
                  {/* UXD-189-01: utilities net + rate (VAT is one total line); rent, services "incl.". */}
                  <td className="r">
                    {l.vatRatePct != null ? (
                      `${l.vatRatePct}%`
                    ) : flat ? (
                      ''
                    ) : (
                      <BiText
                        en={translate('en', 'stmt.print.vat_incl')}
                        vi={translate('vi', 'stmt.print.vat_incl')}
                      />
                    )}
                  </td>
                  <td className="r">{signedNum(lineAmount(l))}</td>
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
          {/* UXD-189-06: issued after the due day → "due on receipt", never a date already past. */}
          {(s.issuedAt ?? '').slice(0, 10) > due ? (
            <Bi k="stmt.print.due_on_receipt" />
          ) : (
            <BiText
              en={translate('en', 'stmt.print.pay_by', { date: dayText('en', due) })}
              vi={translate('vi', 'stmt.print.pay_by', { date: dayText('vi', due) })}
            />
          )}
        </p>
      ) : null}

      {qr && !voided ? (
        <section className="stmt-qr">
          <QrCode
            value={qr.payload}
            size={size === 'a5' ? 88 : 100}
            label={translate('en', 'stmt.print.qr_label', {
              amount: num(qr.amountVnd),
              ref: qr.transferContent,
            })}
          />
          <dl>
            <div className="stmt-qr-title">
              <Bi k="stmt.print.qr_title" />
            </div>
            <div>
              <dt>
                <Bi k="stmt.print.qr_amount" />
              </dt>
              <dd className="stmt-qr-amt">{num(qr.amountVnd)} VND</dd>
            </div>
            <div>
              <dt>
                <Bi k="stmt.print.qr_content" />
              </dt>
              <dd className="mono">{qr.transferContent}</dd>
              <dd className="stmt-keep-ref">
                <Bi k="stmt.print.qr_keep_ref" />
              </dd>
            </div>
            <div>
              <dt>
                <Bi k="stmt.print.qr_bank" />
              </dt>
              <dd>
                {qr.bankShortName ? `${qr.bankShortName} · ` : ''}
                {qr.accountHolder} · <span className="mono">{qr.accountNoMasked}</span>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <footer className="stmt-foot">
        <p>
          <Bi k="stmt.print.vat_note" />
        </p>
        <div className="stmt-foot-row">
          {s.property.hotline || s.property.email ? (
            <p>
              <Bi k="stmt.print.contact" />{' '}
              {[s.property.hotline, s.property.email].filter(Boolean).map((x, i) => (
                <span key={i} className="nowrap">
                  {i ? ' · ' : ''}
                  {x}
                </span>
              ))}
            </p>
          ) : null}
          <p className="stmt-printed">
            {translate('en', 'stmt.print.printed', {
              date: dayText('en', s.printedAt.slice(0, 10)),
              by: s.printedByInitials ?? '',
            })}
          </p>
        </div>
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
    async () => (await api.getBillingPeriodPrint({ propertyId }, id)).data,
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
  const [overflow, setOverflow] = useState(false);
  const auto: PaperSize = s && (printedLines(s) > A5_MAX_LINES || overflow) ? 'a4' : 'a5';
  const paper: PaperSize = size ?? auto;
  const measure = useRef<HTMLDivElement>(null);
  // Height guard (UXD-189-03): the A5 sheet laid out off screen; taller than the A5 print area → A4 by default.
  useLayoutEffect(() => {
    const el = measure.current?.querySelector<HTMLElement>('.stmt-sheet');
    if (!el || !s || !enReady) return;
    const mm = el.scrollHeight / (96 / 25.4);
    setOverflow(mm > A5_PRINT_HEIGHT_MM);
  }, [s, enReady]);
  // UXD-189-16: say so whether the line count or the height guard picked A4.
  const switched = !size && auto === 'a4' && !!s;

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
        <div className="stmt-measure" ref={measure} aria-hidden="true">
          <StatementSheet s={s} size="a5" />
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
        {switched ? (
          <span className="li-s" role="status">
            {t('stmt.paper_switched')}
          </span>
        ) : null}
      </div>
      {body}
    </div>
  );
}
