/**
 * VietQR (NAPAS 247 "chuyển nhanh đến tài khoản") payload for createVietQr (US-120, BR-521; SEC F1/F2).
 * The EMVCo builder and the transfer-content normalisation are INT's (`@ottimo/integrations/payment`,
 * decision-log 16/10 – built locally, no third-party QR service); this file only adapts them to the api:
 * the client draws the image from `qrPayload`, amount and content are server values (SEC F1).
 * Account masks: `maskedAccountNo` of platform/public/receiving-account.ts is the only one (ARC-BE-S3-29).
 */
import {
  buildVietQrPayload as buildEmvco,
  crc16Ccitt,
  normalizeTransferContent,
} from '@ottimo/integrations/payment';

export { crc16Ccitt };

/** Transfer content of BR-521: booking code or bill number without dashes (OTM-00171 → OTM00171). */
export function transferContentOf(code: string): string {
  return normalizeTransferContent(code);
}

export function buildVietQrPayload(input: {
  bankBin: string;
  accountNo: string;
  amountVnd: number;
  transferContent: string;
}): string {
  return buildEmvco(input);
}
