// VietQR PaymentAdapter (README 3.2, P-R2-6). Owner: INT.
// VietQR has no gateway: createPayment only builds the EMVCo string; confirmation comes from the bank feed
// (R3, BankFeedAdapter) or a staff "money received" click (SM-12). No network, no logging.
import {
  IntegrationError,
  type HealthStatus,
  type InboundHttp,
  type IntegrationContext,
  type IsoInstant,
} from '../../contracts/common.js';
import type {
  CallbackAck,
  CallbackAckOutcome,
  CreatePaymentRequest,
  CreatePaymentResult,
  PaymentAdapter,
  PaymentStatusResult,
  VerifyCallbackResult,
} from '../../contracts/payment.js';
import { renderQrSvg } from '../../qr/svg.js';
import {
  buildVietQrPayload,
  normalizeTransferContent,
  validateReceivingAccount,
  type VietQrReceivingAccount,
} from './emvco.js';

/**
 * BE-B supplies this: reads the property's `payment_receiving_account` parameter (OWN-only, re-auth, audit,
 * push, 24-hour warning – SEC F3). It is the ONLY source of the receiving account (FB-R2-SEC-INT-06,
 * FB-R2-ARC-BE-S3-29): no fallback to environment variables, so changing the account always leaves an audit
 * trail. Return null when the parameter is not set.
 */
export type ReceivingAccountSource = (
  ctx: IntegrationContext,
) => Promise<VietQrReceivingAccount | null>;

export interface VietQrAdapterOptions {
  receivingAccount: ReceivingAccountSource;
  /** Injected Clock (ADR-008) for healthCheck.checkedAt – required (FB-R2-ARC-BE-S3-29). */
  now: () => IsoInstant;
}

export interface VietQrPrepareRequest {
  /** Server-computed (balance due or deposit shortfall – SEC F1). */
  amountVnd: number;
  /** Reservation code or bill number, e.g. 'OTM-00171' → 'OTM00171'. */
  transferContent: string;
}

/** No masked account here: the one mask is BE-B `maskedAccountNo` ('9704••••1234', FB-R2-ARC-BE-S3-29). */
export interface VietQrPrepared {
  qrPayload: string;
  /** Locally drawn SVG (SEC F2). */
  qrSvg: string;
  amountVnd: number;
  transferContent: string;
  bankBin: string;
  accountName: string;
}

const NOT_CONFIGURED = 'VietQR receiving account not configured';

export class VietQrPaymentAdapter implements PaymentAdapter {
  readonly gateway = 'vietqr' as const;
  private readonly receivingAccount: ReceivingAccountSource;
  private readonly now: () => IsoInstant;

  constructor(opts: VietQrAdapterOptions) {
    this.receivingAccount = opts.receivingAccount;
    this.now = opts.now;
  }

  /** The `payment_receiving_account` parameter, validated. Not set → CONFIG (BE-B: 409 PAYMENT_NOT_CONFIGURED). */
  async resolveAccount(ctx: IntegrationContext): Promise<VietQrReceivingAccount> {
    const account = await this.receivingAccount(ctx);
    if (!account) throw new IntegrationError('CONFIG', NOT_CONFIGURED);
    return validateReceivingAccount(account);
  }

  async prepare(ctx: IntegrationContext, req: VietQrPrepareRequest): Promise<VietQrPrepared> {
    const transferContent = normalizeTransferContent(req.transferContent);
    const account = await this.resolveAccount(ctx);
    const qrPayload = buildVietQrPayload({
      bankBin: account.bankBin,
      accountNo: account.accountNo,
      amountVnd: req.amountVnd,
      transferContent,
    });
    return {
      qrPayload,
      qrSvg: renderQrSvg(qrPayload, { title: `VietQR ${transferContent}` }),
      amountVnd: req.amountVnd,
      transferContent,
      bankBin: account.bankBin,
      accountName: account.accountName,
    };
  }

  /** `description` is the transfer content (reservation code / bill number only – SEC F1). */
  async createPayment(
    ctx: IntegrationContext,
    req: CreatePaymentRequest,
  ): Promise<CreatePaymentResult> {
    const prepared = await this.prepare(ctx, {
      amountVnd: req.amountVnd,
      transferContent: req.description,
    });
    return { qrPayload: prepared.qrPayload };
  }

  /** VietQR has no callback; any call to a VietQR webhook is refused (not fail-open – SEC-03). */
  async verifyCallback(ctx: IntegrationContext, req: InboundHttp): Promise<VerifyCallbackResult> {
    void ctx;
    void req; // never read: nothing to verify against
    return { ok: false, reason: 'source_not_allowed' };
  }

  callbackAck(outcome: CallbackAckOutcome): CallbackAck {
    void outcome;
    return { status: 404, headers: { 'content-type': 'text/plain' }, body: 'Not Found' };
  }

  /** No provider to ask: stays pending until bank feed (R3) or staff confirmation. */
  async queryStatus(ctx: IntegrationContext, paymentCode: string): Promise<PaymentStatusResult> {
    void ctx;
    void paymentCode;
    return { status: 'pending' };
  }

  async healthCheck(ctx: IntegrationContext): Promise<HealthStatus> {
    try {
      await this.resolveAccount(ctx);
      return { status: 'ok', checkedAt: this.now() };
    } catch (e) {
      if (e instanceof IntegrationError && e.code === 'CONFIG') {
        return { status: 'down', checkedAt: this.now(), detail: 'not_configured' };
      }
      throw e;
    }
  }
}
