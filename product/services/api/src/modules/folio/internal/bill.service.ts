/**
 * Bill (US-037; EP03-05 mục 5.4; OpenAPI 0.3.3 E05-05 + 0.3.6 G-12/G-13/E05-10) and the company invoice request
 * (US-039, D16 – MISA issuance is R3: the request is stored, einvoiceStatus stays `not_requested`).
 * - Lines: posted only (pending/rejected never printed); a reversed line AND its reversal are left out (G-12:
 *   net value only, the log keeps both); FOC/discount right under the line they reduce (BR-434); order by
 *   serviceDate then postedAt.
 * - paymentModel (G-13): `ota_prepaid` → room lines hidden, one note "Đã thu qua {channel}" + otaPrepaidVnd;
 *   `ota_pay_at_property` / `direct` → nights printed.
 * - Totals from the folio (server): totalVnd, paidVnd (receipts, reversed pairs excluded), refunds[] /
 *   refundedVnd, balanceDueVnd.
 * - locale: `vi_en` when the booker is not Vietnamese or prefers another language (BR-009; the registration
 *   documents of BE-C are added when its port exposes nationality); USD reference only then (BR-004).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { type FieldError, problem } from '../../../shared/problem';
import { localDate, toZonedIso } from '../../../shared/time';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../reservations/public/sales-port';
import { folioLineDto } from '../public/folio-view';
import {
  type FolioLineRow,
  type FolioRow,
  FolioService,
  computeTotals,
  refundedOf,
} from '../public/folio.service';

const TAX_CODE = /^[0-9]{10}(-?[0-9]{3})?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InvoiceRequestRow {
  buyer_type: 'company' | 'individual' | 'retail';
  company_name: string | null;
  tax_code: string | null;
  address: string | null;
  email: string | null;
  einvoice_status: string;
}

export function invoiceDto(r: InvoiceRequestRow): Record<string, unknown> {
  return {
    buyerType: r.buyer_type,
    ...(r.company_name ? { companyName: r.company_name } : {}),
    ...(r.tax_code ? { taxCode: r.tax_code } : {}),
    ...(r.address ? { address: r.address } : {}),
    ...(r.email ? { email: r.email } : {}),
    einvoiceStatus: r.einvoice_status,
  };
}

/** G-12 + BR-434: the printable lines in bill order. */
export function billLines(lines: readonly FolioLineRow[]): FolioLineRow[] {
  const reversed = new Set(lines.filter((l) => l.reversal_of_id).map((l) => l.reversal_of_id));
  const live = lines.filter(
    (l) => l.line_state === 'posted' && !l.reversal_of_id && !reversed.has(l.id),
  );
  const reductions = (id: string) =>
    live.filter(
      (l) => l.related_line_id === id && (l.category === 'foc' || l.category === 'discount'),
    );
  const isReduction = (l: FolioLineRow) =>
    (l.category === 'foc' || l.category === 'discount') &&
    !!l.related_line_id &&
    live.some((x) => x.id === l.related_line_id);
  const main = live
    .filter((l) => !isReduction(l))
    .sort(
      (a, b) =>
        (a.service_date ?? '9999').localeCompare(b.service_date ?? '9999') ||
        a.posted_at.getTime() - b.posted_at.getTime() ||
        a.id.localeCompare(b.id),
    );
  const out: FolioLineRow[] = [];
  for (const l of main) out.push(l, ...reductions(l.id));
  return out;
}

@Injectable()
export class BillService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Optional()
    @Inject(RESERVATION_SALES_PORT)
    private readonly reservations?: ReservationSalesPort,
  ) {}

  async invoice(tx: Tx, folioId: string): Promise<InvoiceRequestRow | null> {
    const { rows } = await tx.query<InvoiceRequestRow>(
      `SELECT buyer_type, company_name, tax_code, address, email, einvoice_status
         FROM invoice_request WHERE folio_id = $1`,
      [folioId],
    );
    return rows[0] ?? null;
  }

  async bill(tx: Tx, folio: FolioRow): Promise<Record<string, unknown>> {
    if (!this.reservations) throw new Error('reservations module not wired');
    const tz = await this.folios.timezone(tx);
    const now = this.clock.now();
    const today = localDate(now, tz);
    const view = await this.reservations.reservationView(tx, folio.primary_reservation_id);
    const lines = await this.folios.lines(tx, folio.id);
    const payments = await this.folios.payments(tx, folio.id);
    const totals = computeTotals(lines, payments);
    const paymentModel = String(view.paymentModel ?? 'direct');
    let printable = billLines(lines);
    let otaPrepaidNote: string | null = null;
    let otaPrepaidVnd: number | null = null;
    // Locale (BR-009): booker nationality / preferred language.
    const booker = view.booker as
      { id?: string; displayName?: string; nationalityCode?: string } | undefined;
    let preferred: string | null = null;
    if (booker?.id) {
      const { rows } = await tx.query<{ preferred_locale: string | null }>(
        'SELECT preferred_locale FROM guest WHERE id = $1',
        [booker.id],
      );
      preferred = rows[0]?.preferred_locale ?? null;
    }
    const foreign = !!booker?.nationalityCode && booker.nationalityCode !== 'VN';
    const locale = foreign || (preferred !== null && preferred !== 'vi') ? 'vi_en' : 'vi';
    if (paymentModel === 'ota_prepaid') {
      const roomIds = new Set(printable.filter((l) => l.category === 'room').map((l) => l.id));
      const room = printable.filter(
        (l) => roomIds.has(l.id) || (!!l.related_line_id && roomIds.has(l.related_line_id)),
      );
      const roomNet = room.reduce((a, l) => a + l.amount_vnd, 0);
      printable = printable.filter((l) => !room.includes(l));
      otaPrepaidVnd = totals.paidViaOtaVnd > 0 ? totals.paidViaOtaVnd : roomNet;
      const channel = String(view.channelCode ?? 'OTA');
      otaPrepaidNote =
        locale === 'vi_en'
          ? `Đã thu qua ${channel} / Paid via ${channel}`
          : `Đã thu qua ${channel}`;
    }
    const refunds = payments
      .filter((p) => p.type === 'refund' && p.status === 'succeeded' && !p.reversal_of_id)
      .map((p) => ({
        amountVnd: -p.amount_vnd,
        paidAt: p.received_at ? toZonedIso(p.received_at, tz) : undefined,
        method: p.method,
      }));
    const segments = (view.segments as Array<{ roomNo?: string }> | undefined) ?? [];
    const { rows: prop } = await tx.query<{ name: string; address: string | null }>(
      'SELECT name, address FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    let usdReference: Record<string, unknown> | undefined;
    if (locale === 'vi_en') {
      try {
        const rate = await this.params.get<number>(tx, 'fx_usd_vnd', today);
        const { rows: fx } = await tx.query<{ effective_from: string }>(
          `SELECT effective_from::text AS effective_from FROM config_parameter
            WHERE property_id = $1 AND key = 'fx_usd_vnd' AND effective_from <= $2
            ORDER BY effective_from DESC LIMIT 1`,
          [tx.ctx.propertyId, today],
        );
        usdReference = {
          rate,
          totalUsd: Math.round((totals.totalVnd / rate) * 10) / 10,
          ...(fx[0] ? { rateUpdatedOn: fx[0].effective_from } : {}),
        };
      } catch (e) {
        if (!(e instanceof ParameterMissingError)) throw e;
      }
    }
    const code = String(view.code ?? '');
    return {
      folioId: folio.id,
      billNo: folio.bill_no,
      locale,
      property: {
        name: prop[0]?.name ?? '',
        ...(prop[0]?.address ? { address: prop[0].address } : {}),
      },
      ...(booker?.displayName ? { guestDisplayName: booker.displayName } : {}),
      ...(segments.length && segments[segments.length - 1]?.roomNo
        ? { roomNo: segments[segments.length - 1]?.roomNo }
        : {}),
      arrivalDate: view.arrivalDate,
      departureDate: view.departureDate,
      lines: printable.map((l) => folioLineDto(l, tz)),
      totalVnd: totals.totalVnd,
      paidVnd: totals.paidVnd,
      balanceDueVnd: totals.balanceDueVnd,
      ...(usdReference ? { usdReference } : {}),
      vietqrTransferContent: (folio.status === 'open' ? code : (folio.bill_no ?? code)).replace(
        /[^A-Za-z0-9]/g,
        '',
      ),
      paymentModel,
      otaPrepaidNote,
      otaPrepaidVnd,
      refunds,
      refundedVnd: refundedOf(payments),
    };
  }

  /** setInvoiceRequest (A38, US-039 AC1/AC2): validated, stored per folio; MISA issuance R3. */
  async setInvoice(
    tx: Tx,
    folio: FolioRow,
    actor: { userId: string },
    input: {
      buyerType: string;
      companyName?: string | undefined;
      taxCode?: string | undefined;
      email?: string | undefined;
      address?: string | undefined;
    },
  ): Promise<InvoiceRequestRow> {
    const errors: FieldError[] = [];
    if (input.buyerType !== 'company' && input.buyerType !== 'individual') {
      errors.push({ field: 'buyerType', code: 'NOT_IN_LIST' });
    }
    const company = input.buyerType === 'company';
    const name = input.companyName?.trim() ?? '';
    const tax = input.taxCode?.trim() ?? '';
    const email = input.email?.trim() ?? '';
    const address = input.address?.trim() ?? '';
    if (company) {
      if (!name) errors.push({ field: 'companyName', code: 'REQUIRED' });
      else if (name.length < 2) errors.push({ field: 'companyName', code: 'REQUIRED' });
      else if (name.length > 200) errors.push({ field: 'companyName', code: 'TOO_LONG' });
      if (!tax) errors.push({ field: 'taxCode', code: 'REQUIRED' });
      else if (!TAX_CODE.test(tax)) errors.push({ field: 'taxCode', code: 'TAX_CODE_INVALID' });
      if (!email) errors.push({ field: 'email', code: 'REQUIRED' });
      else if (!EMAIL.test(email) || email.length > 254) {
        errors.push({ field: 'email', code: 'EMAIL_INVALID' });
      }
    }
    if (address.length > 300) errors.push({ field: 'address', code: 'TOO_LONG' });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const existing = await this.invoice(tx, folio.id);
    if (existing && existing.einvoice_status === 'issued') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const values = company ? [name, tax, address || null, email] : [null, null, null, null];
    const { rows } = await tx.query<InvoiceRequestRow>(
      `INSERT INTO invoice_request (id, organization_id, property_id, folio_id, buyer_type, company_name, tax_code,
         address, email, created_at, created_by, updated_at)
       VALUES ($11, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $9)
       ON CONFLICT (folio_id) DO UPDATE SET buyer_type = EXCLUDED.buyer_type,
         company_name = EXCLUDED.company_name, tax_code = EXCLUDED.tax_code, address = EXCLUDED.address,
         email = EXCLUDED.email, updated_at = EXCLUDED.updated_at, version = invoice_request.version + 1
       RETURNING buyer_type, company_name, tax_code, address, email, einvoice_status`,
      [
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        folio.id,
        input.buyerType,
        ...values,
        now,
        actor.userId,
        uuidv7(),
      ],
    );
    return rows[0] as InvoiceRequestRow;
  }
}
