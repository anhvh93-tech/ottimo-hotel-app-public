// VietQR PaymentAdapter (README 3.2, P-R2-6). Owner: INT.
// VietQR has no gateway: createPayment only builds the EMVCo string; confirmation comes from the bank feed
// (R3, BankFeedAdapter) or a staff "money received" click (SM-12). No network, no logging.
import {
  isoInstant,
  IntegrationError,
  type CredentialProvider,
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
  maskAccountNo,
  normalizeTransferContent,
  validateReceivingAccount,
  type VietQrReceivingAccount,
} from './emvco.js';

/**
 * BE-B supplies this: reads the property's `payment_receiving_account` parameter (OWN-only, re-auth, audit,
 * push – SEC F3). Return null when the parameter is not set → the adapter falls back to PAYMENT_VIETQR_*.
 */
export type ReceivingAccountSource = (
  ctx: IntegrationContext,
) => Promise<VietQrReceivingAccount | null>;

export interface VietQrAdapterOptions {
  /** Fallback source: credentials.get(ctx.credentialsRef), ref 'env:PAYMENT_VIETQR' → BANK_BIN, ACCOUNT_NO, ACCOUNT_NAME. */
  credentials: CredentialProvider;
  receivingAccount?: ReceivingAccountSource;
  /** Injected clock (ADR-008) for healthCheck.checkedAt. */
  now?: () => IsoInstant;
}

export interface VietQrPrepareRequest {
  /** Server-computed (balance due or deposit shortfall – SEC F1). */
  amountVnd: number;
  /** Reservation code or bill number, e.g. 'OTM-00171' → 'OTM00171'. */
  transferContent: string;
}

export interface VietQrPrepared {
  qrPayload: string;
  /** Locally drawn SVG (SEC F2). */
  qrSvg: string;
  amountVnd: number;
  transferContent: string;
  bankBin: string;
  accountNoMasked: string;
  accountName: string;
  accountSource: 'parameter' | 'env';
}

const NOT_CONFIGURED = 'VietQR receiving account not configured';

export class VietQrPaymentAdapter implements PaymentAdapter {
  readonly gateway = 'vietqr' as const;
  private readonly credentials: CredentialProvider;
  private readonly receivingAccount: ReceivingAccountSource | undefined;
  private readonly now: () => IsoInstant;

  constructor(opts: VietQrAdapterOptions) {
    this.credentials = opts.credentials;
    this.receivingAccount = opts.receivingAccount;
    this.now = opts.now ?? (() => isoInstant('2026-10-16T09:00:00+07:00'));
  }

  /** Resolves the receiving account: parameter first, then env. CONFIG when neither is usable. */
  async resolveAccount(
    ctx: IntegrationContext,
  ): Promise<{ account: VietQrReceivingAccount; source: 'parameter' | 'env' }> {
    const fromParam = this.receivingAccount ? await this.receivingAccount(ctx) : null;
    if (fromParam) return { account: validateReceivingAccount(fromParam), source: 'parameter' };

    let creds: Readonly<Record<string, string>>;
    try {
      creds = await this.credentials.get(ctx.credentialsRef);
    } catch (e) {
      if (e instanceof IntegrationError && e.code === 'CONFIG') {
        throw new IntegrationError('CONFIG', NOT_CONFIGURED);
      }
      throw e;
    }
    const bankBin = creds['BANK_BIN'];
    const accountNo = creds['ACCOUNT_NO'];
    const accountName = creds['ACCOUNT_NAME'];
    if (!bankBin || !accountNo || !accountName)
      throw new IntegrationError('CONFIG', NOT_CONFIGURED);
    return {
      account: validateReceivingAccount({ bankBin, accountNo, accountName }),
      source: 'env',
    };
  }

  async prepare(ctx: IntegrationContext, req: VietQrPrepareRequest): Promise<VietQrPrepared> {
    const transferContent = normalizeTransferContent(req.transferContent);
    const { account, source } = await this.resolveAccount(ctx);
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
      accountNoMasked: maskAccountNo(account.accountNo),
      accountName: account.accountName,
      accountSource: source,
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
