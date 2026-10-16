// BankFeedAdapter contract (README section 3.2b v0.2) – incoming-money notices for VietQR (R3, SEC-06). Owner: INT.
import type { HealthStatus, InboundHttp, IntegrationContext, IsoInstant } from './common.js';

export type BankFeedProvider = 'sepay' | 'payos';

export interface BankFeedEvent {
  providerTxnId: string;
  accountNo: string;
  amountVnd: number;
  transferContent: string;
  bankTime: IsoInstant;
}

export type VerifyNotificationResult =
  | { ok: true; event: BankFeedEvent }
  | { ok: false; reason: 'invalid_signature' | 'source_not_allowed' | 'malformed' };

export interface BankFeedTransaction {
  accountNo: string;
  amountVnd: number;
  transferContent: string;
}

export interface BankFeedAdapter {
  readonly provider: BankFeedProvider;
  verifyNotification(ctx: IntegrationContext, req: InboundHttp): Promise<VerifyNotificationResult>;
  /** Re-fetch through the provider API before crediting (mandatory when the provider has no HMAC). */
  fetchTransaction(
    ctx: IntegrationContext,
    providerTxnId: string,
  ): Promise<BankFeedTransaction | null>;
  healthCheck(ctx: IntegrationContext): Promise<HealthStatus>;
}
