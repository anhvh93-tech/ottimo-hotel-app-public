/**
 * OpenAPI `Folio`, `FolioLine`, `Payment` bodies (before the role serializer: CTV loses lines, payments and
 * every total except roomVnd/depositHeldVnd – rbac note 4, SEC-ARC-15; payerName etc. by x-visible-to).
 */
import { toZonedIso } from '../../../shared/time';
import { type LabelContext, lineLabel } from './line-labels';
import {
  type FolioLineRow,
  type FolioRow,
  type PaymentRowLite,
  computeTotals,
} from './folio.service';

const iso = (d: Date | null, tz: string) => (d ? toZonedIso(d, tz) : undefined);

function defined<T extends Record<string, unknown>>(o: T): T {
  for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === null) delete o[k];
  return o;
}

export function folioLineDto(
  l: FolioLineRow,
  tz: string,
  labels: LabelContext = {},
): Record<string, unknown> {
  const { labelKey, labelParams } = lineLabel(l, labels);
  return defined({
    id: l.id,
    category: l.category,
    revenueGroup: l.revenue_group,
    description: l.description,
    labelKey,
    labelParams,
    serviceDate: l.service_date,
    quantity: Number(l.quantity),
    unitPriceVnd: l.unit_price_vnd,
    amountVnd: l.amount_vnd,
    vatRatePct: l.vat_rate_pct === null ? null : Number(l.vat_rate_pct),
    lineState: l.line_state,
    relatedLineId: l.related_line_id,
    reversalOfId: l.reversal_of_id,
    approvalRequestId: l.approval_request_id,
    postedAt: iso(l.posted_at, tz),
    postedBy: l.posted_by_name ?? (l.posted_by ? undefined : 'system'),
    // 0.3.7 bổ sung 4 (ARC 16.14, FD+ – x-visible-to): minibar = item code (kept by adjustFolioLine), system codes
    // (`late_fee_as_night`…); absent = no code.
    chargeCode: l.charge_code,
  });
}

export function paymentDto(
  p: PaymentRowLite,
  tz: string,
  extra: { folioId?: string; reservationCode?: string; amountDueNowVnd?: number } = {},
): Record<string, unknown> {
  return defined({
    id: p.id,
    code: p.code,
    type: p.type,
    method: p.method,
    amountVnd: p.amount_vnd,
    status: p.status,
    receivedAt: iso(p.received_at, tz),
    recordedBy: p.recorded_by_name,
    payerName: p.payer_name,
    cardBrand: p.card_brand,
    cardLast4: p.card_last4,
    reversalOfId: p.reversal_of_id,
    expiresAt: iso(p.expires_at, tz),
    methodDetail: p.method_detail,
    reconciliation: p.reconciliation,
    reconciledAt: iso(p.reconciled_at, tz),
    reconciledByName: p.reconciled_by_name,
    reconciliationNote: p.reconciliation_note,
    shiftId: p.shift_id,
    folioId: extra.folioId,
    reservationCode: extra.reservationCode,
    recordedByUserId: p.recorded_by,
    recordedByRole: p.recorded_by_role,
    confirmedAt: iso(p.confirmed_at, tz),
    confirmedByUserId: p.confirmed_by,
    confirmedByName: p.confirmed_by_name,
    approvalRequestId: p.approval_request_id,
    note: p.note,
    attachmentId: p.attachment_id,
    // 0.3.7 bổ sung 4 (DOM (f)): what a VietQR was for, and – pending only – what is due now for that purpose.
    qrPurpose: p.method === 'vietqr' ? (p.qr_purpose ?? undefined) : undefined,
    amountDueNowVnd:
      p.method === 'vietqr' && p.status === 'pending' ? extra.amountDueNowVnd : undefined,
    version: p.version,
  });
}

export function folioDto(
  folio: FolioRow,
  lines: FolioLineRow[],
  payments: PaymentRowLite[],
  tz: string,
  invoice: Record<string, unknown> | null = null,
  labels: LabelContext = {},
  openRefundVnd = 0,
  /** 0.3.7 bổ sung 4 (DOM (f)): Payment.amountDueNowVnd of the pending VietQR payments (id → amount). */
  dueNow: ReadonlyMap<string, number> = new Map(),
): Record<string, unknown> {
  const reservationIds = [
    folio.primary_reservation_id,
    ...new Set(
      lines
        .map((l) => l.reservation_id)
        .filter((r): r is string => !!r && r !== folio.primary_reservation_id),
    ),
  ];
  return {
    id: folio.id,
    status: folio.status,
    billNo: folio.bill_no,
    reservationIds,
    lines: lines.map((l) => folioLineDto(l, tz, labels)),
    payments: payments.map((p) =>
      paymentDto(p, tz, {
        folioId: folio.id,
        ...(dueNow.has(p.id) ? { amountDueNowVnd: dueNow.get(p.id) as number } : {}),
      }),
    ),
    totals: computeTotals(lines, payments, openRefundVnd),
    ...(invoice ? { invoiceRequest: invoice } : {}),
    pendingApprovals: lines.filter((l) => l.line_state === 'pending_approval').length,
    version: folio.version,
  };
}
