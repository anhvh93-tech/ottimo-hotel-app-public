// VietQR payload = EMVCo Merchant-Presented QR (EMV QRCPS-MPM v1.1) with the NAPAS VietQR template
// (GUID A000000727, service QRIBFTTA = transfer to account). Built locally – no third-party API (SEC F2).
// Owner: INT. Pure TS (no Node APIs).
import { IntegrationError } from '../../contracts/common.js';

/** NAPAS application identifier for VietQR (merchant account information, tag 38). */
export const VIETQR_GUID = 'A000000727';
/** Service code: inter-bank fast transfer to an account number. */
export const VIETQR_SERVICE_TO_ACCOUNT = 'QRIBFTTA';

export interface VietQrReceivingAccount {
  /** NAPAS bank BIN, 6 digits (e.g. Vietcombank 970436). */
  bankBin: string;
  /** Beneficiary account number, 1–19 letters/digits. Never logged, never in error messages. */
  accountNo: string;
  /** Account holder name as registered at the bank (display only, not encoded in the payload). */
  accountName: string;
}

export interface VietQrPayloadInput {
  bankBin: string;
  accountNo: string;
  /** Integer VND > 0, at most 13 digits (EMV tag 54). Computed by the server (SEC F1). */
  amountVnd: number;
  /** Already-normalised transfer content (see normalizeTransferContent). */
  transferContent: string;
}

export const TRANSFER_CONTENT_MAX = 25;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over UTF-8 bytes, as EMV QRCPS section 4.7.3. */
export function crc16Ccitt(text: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(tag: string, value: string): string {
  const len = new TextEncoder().encode(value).length;
  if (len > 99) throw new IntegrationError('INVALID_REQUEST', `EMV field ${tag} too long`);
  return `${tag}${String(len).padStart(2, '0')}${value}`;
}

/**
 * Reservation code / bill number → bank transfer content: drop '-', '_', '.', '/', spaces; upper-case.
 * Only A–Z0–9 may remain, 1–25 chars (SEC F1: content = code only, no name/phone). A run of ≥ 13 digits
 * is refused so a card or account number can never end up in a bank statement line.
 */
export function normalizeTransferContent(code: string): string {
  const out = code.replace(/[-_./\s]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{1,25}$/.test(out)) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      `Transfer content must be 1–${TRANSFER_CONTENT_MAX} characters A–Z, 0–9 after normalisation`,
    );
  }
  if (/\d{13,}/.test(out)) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      'Transfer content must not contain long digit runs',
    );
  }
  return out;
}

/** '0123456789' → '••••6789'. Short numbers keep at most half their digits visible. */
export function maskAccountNo(accountNo: string): string {
  const visible = Math.min(4, Math.floor(accountNo.length / 2));
  return `••••${visible > 0 ? accountNo.slice(-visible) : ''}`;
}

/** Strips Vietnamese diacritics and upper-cases (bank account names are registered without marks). */
export function toBankName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Throws CONFIG naming only the faulty field – never the value (the account number is integrity-critical). */
export function validateReceivingAccount(acc: VietQrReceivingAccount): VietQrReceivingAccount {
  if (!/^\d{6}$/.test(acc.bankBin)) {
    throw new IntegrationError('CONFIG', 'VietQR receiving account: bankBin must be 6 digits');
  }
  if (!/^[0-9A-Za-z]{1,19}$/.test(acc.accountNo)) {
    throw new IntegrationError(
      'CONFIG',
      'VietQR receiving account: accountNo must be 1–19 letters/digits',
    );
  }
  const name = toBankName(acc.accountName);
  if (!/^[A-Z0-9 .,&()'-]{1,50}$/.test(name)) {
    throw new IntegrationError(
      'CONFIG',
      'VietQR receiving account: accountName must be 1–50 Latin characters',
    );
  }
  return { bankBin: acc.bankBin, accountNo: acc.accountNo, accountName: name };
}

function assertAmount(amountVnd: number): void {
  if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0 || String(amountVnd).length > 13) {
    throw new IntegrationError(
      'INVALID_REQUEST',
      'amountVnd must be a positive integer of at most 13 digits',
    );
  }
}

/**
 * Dynamic VietQR (point of initiation '12', amount fixed). Tag order:
 * 00 format · 01 initiation · 38 merchant account (00 GUID, 01 beneficiary {00 BIN, 01 account}, 02 service)
 * · 53 currency 704 · 54 amount · 58 country VN · 62 additional data {08 purpose = transfer content} · 63 CRC.
 */
export function buildVietQrPayload(input: VietQrPayloadInput): string {
  if (!/^\d{6}$/.test(input.bankBin) || !/^[0-9A-Za-z]{1,19}$/.test(input.accountNo)) {
    throw new IntegrationError('CONFIG', 'VietQR receiving account is invalid');
  }
  assertAmount(input.amountVnd);
  const content = normalizeTransferContent(input.transferContent);
  if (content !== input.transferContent) {
    throw new IntegrationError('INVALID_REQUEST', 'transferContent must be normalised first');
  }
  const beneficiary = tlv('00', input.bankBin) + tlv('01', input.accountNo);
  const merchant =
    tlv('00', VIETQR_GUID) + tlv('01', beneficiary) + tlv('02', VIETQR_SERVICE_TO_ACCOUNT);
  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('38', merchant) +
    tlv('53', '704') +
    tlv('54', String(input.amountVnd)) +
    tlv('58', 'VN') +
    tlv('62', tlv('08', content)) +
    '6304';
  return body + crc16Ccitt(body);
}

export type EmvTlvMap = ReadonlyMap<string, string>;

/** Parses one EMV TLV level (ASCII lengths). Throws INVALID_REQUEST on malformed input. */
export function parseEmvTlv(payload: string): EmvTlvMap {
  const out = new Map<string, string>();
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const lenStr = payload.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lenStr)) {
      throw new IntegrationError('INVALID_REQUEST', 'Malformed EMV payload');
    }
    const len = Number(lenStr);
    const value = payload.slice(i + 4, i + 4 + len);
    if (value.length !== len)
      throw new IntegrationError('INVALID_REQUEST', 'Malformed EMV payload');
    out.set(tag, value);
    i += 4 + len;
  }
  return out;
}

/** True when tag 63 holds the CRC of everything before its value. */
export function verifyEmvCrc(payload: string): boolean {
  if (payload.length < 8 || payload.slice(-8, -4) !== '6304') return false;
  return crc16Ccitt(payload.slice(0, -4)) === payload.slice(-4).toUpperCase();
}
