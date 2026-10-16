// EInvoiceAdapter contract (README section 3.3 v0.2). Owner: INT. R3 – waits on ESC-008.
import type { HealthStatus, IntegrationContext, LocalDate } from './common.js';

export type VatRate = number | 'exempt' | 'not_subject';

export interface EInvoiceLine {
  name: string;
  qty: number;
  unitPriceVnd: number;
  vatRatePct: VatRate;
}

export type EInvoiceBuyer =
  { name?: string; taxCode?: string; address?: string; email?: string } | 'retail';

/** BR-524 (DOM-02): issued on business events, not per payment. */
export type EInvoiceTrigger = 'checkout' | 'long_stay_period_paid' | 'utilities_monthly' | 'manual';

export interface EInvoiceIssueRequest {
  /** Idempotency key. */
  invoiceRef: string;
  trigger: EInvoiceTrigger;
  buyer: EInvoiceBuyer;
  lines: EInvoiceLine[];
  /** From configuration (BR-523). */
  pricesIncludeVat: boolean;
  rounding: 'per_line' | 'per_invoice';
  paymentMethod: string;
  issueDate: LocalDate;
}

export interface EInvoiceIssueResult {
  providerId: string;
  number?: string;
  lookupCode?: string;
  status: 'issued' | 'pending' | 'failed';
}

export type EInvoiceStatus =
  'issued' | 'pending' | 'failed' | 'cancelled' | 'replaced' | 'adjusted';

export interface EInvoiceAdjustment {
  lines: EInvoiceLine[];
  direction: 'increase' | 'decrease';
  reason: string;
}

export interface EInvoiceAdapter {
  issue(ctx: IntegrationContext, req: EInvoiceIssueRequest): Promise<EInvoiceIssueResult>;
  getStatus(ctx: IntegrationContext, providerId: string): Promise<EInvoiceStatus>;
  downloadPdf(ctx: IntegrationContext, providerId: string): Promise<Uint8Array>;
  cancel(ctx: IntegrationContext, providerId: string, reason: string): Promise<void>;
  replace(
    ctx: IntegrationContext,
    providerId: string,
    newReq: EInvoiceIssueRequest,
  ): Promise<{ providerId: string }>;
  adjust(
    ctx: IntegrationContext,
    providerId: string,
    delta: EInvoiceAdjustment,
  ): Promise<{ providerId: string }>;
  healthCheck(ctx: IntegrationContext): Promise<HealthStatus>;
}
