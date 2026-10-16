// PaymentAdapter contract (README section 3.2 v0.2). Owner: INT. R2 VietQR + Mock; R3 VNPay/MoMo.
import type { HealthStatus, InboundHttp, IntegrationContext, IsoInstant } from './common.js';

/** = payment.method in the ERD. */
export type Gateway = 'vietqr' | 'vnpay' | 'momo';
export type PaymentChannel = 'qr' | 'atm' | 'intl_card' | 'wallet';

export interface CreatePaymentRequest {
  /** payment.code 'PT-xxxxxx' – generated BEFORE calling the gateway (callback may arrive first). */
  paymentCode: string;
  amountVnd: number;
  /** ≤ 50 characters, no diacritics. */
  description: string;
  returnUrl?: string;
  expiresAt: IsoInstant;
  locale: 'vi' | 'en';
  channel?: PaymentChannel;
}

export interface CreatePaymentResult {
  redirectUrl?: string;
  /** VietQR: EMVCo/NAPAS string generated locally. */
  qrPayload?: string;
  providerRef?: string;
}

export interface PaymentCallbackEvent {
  paymentCode: string;
  providerTxnId: string;
  amount: number;
  currency: 'VND';
  providerResultCode: string;
  outcome: 'succeeded' | 'failed';
  paidAt?: IsoInstant;
}

export type PaymentCallbackRejectReason =
  'invalid_signature' | 'merchant_mismatch' | 'malformed' | 'source_not_allowed';

/** NOT fail-open (SEC-03): an event exists only if the signature is valid AND the merchant matches ctx. */
export type VerifyCallbackResult =
  { ok: true; event: PaymentCallbackEvent } | { ok: false; reason: PaymentCallbackRejectReason };

export type CallbackAckOutcome =
  'ok' | 'already_confirmed' | 'not_found' | 'invalid_amount' | 'invalid_signature' | 'error';

export interface CallbackAck {
  status: number;
  headers: Record<string, string>;
  body: string;
}

/** Subset of payment.status – the adapter never returns 'reversed' (internal operation, ARC-11). */
export interface PaymentStatusResult {
  status: 'pending' | 'succeeded' | 'failed' | 'expired';
  providerTxnId?: string;
  amount?: number;
  providerResultCode?: string;
}

export interface RefundRequest {
  /** payment.code of the REFUND row (type=refund) – idempotency key. */
  refundCode: string;
  originalPaymentCode: string;
  originalProviderTxnId: string;
  amountVnd: number;
  reason: string;
}

export interface RefundResult {
  status: 'pending' | 'succeeded' | 'failed';
  providerRefundTxnId?: string;
}

export interface PaymentAdapter {
  readonly gateway: Gateway;
  createPayment(ctx: IntegrationContext, req: CreatePaymentRequest): Promise<CreatePaymentResult>;
  verifyCallback(ctx: IntegrationContext, req: InboundHttp): Promise<VerifyCallbackResult>;
  callbackAck(outcome: CallbackAckOutcome): CallbackAck;
  queryStatus(ctx: IntegrationContext, paymentCode: string): Promise<PaymentStatusResult>;
  refund?(ctx: IntegrationContext, req: RefundRequest): Promise<RefundResult>;
  healthCheck(ctx: IntegrationContext): Promise<HealthStatus>;
}
