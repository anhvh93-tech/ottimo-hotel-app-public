// scrubCardData – README 1.8 (SEC-01 Blocker, ARC-04). Owner: INT.
// Runs on a provider payload AFTER signature verification on the raw body and BEFORE the explicit
// allowlist mapping. Drops (a) fields whose NAME looks like card data and (b) fields whose VALUE
// contains a 13–19 digit sequence (spaces/dashes ignored) that passes the Luhn check.
// It never logs and never returns names or values of what it dropped – only a count, so the caller
// can increment integration_card_data_dropped_total{provider} and raise the SEC/OWN alert.
import { IntegrationError } from '../contracts/common.js';

export interface ScrubOptions {
  /**
   * Exact key names exempt from the NAME rule only (never from the value rule), for provider fields
   * that are not card data but contain a card-like token, e.g. VNPay `vnp_CardType` ('ATM', 'QRCODE').
   */
  allowKeys?: readonly string[];
}

export interface ScrubResult<T> {
  /** Deep copy without the dropped fields/elements; `undefined` if the whole input was dropped. */
  value: T | undefined;
  /** Number of fields/elements removed (each removed subtree counts once). */
  dropped: number;
}

const MAX_DEPTH = 32;

/** Tokens that mark a card field: exact match on a key token (see keyTokens). */
const CARD_TOKENS = new Set([
  'card',
  'cards',
  'cardholder',
  'cardnumber',
  'cardno',
  'cardnum',
  'creditcard',
  'debitcard',
  'cc',
  'ccnum',
  'ccnumber',
  'ccv',
  'cvv',
  'cvv2',
  'cvc',
  'cvc2',
  'cid',
  'vcc',
  'pan',
  'expiry',
  'expiration',
  'expdate',
  'expmonth',
  'expyear',
  'track1',
  'track2',
  'trackdata',
]);
/** Words that make 'exp' a card expiry field (exp_month, expYear, exp-date). */
const EXP_COMPANIONS = new Set(['month', 'year', 'date', 'mm', 'yy', 'yyyy', 'mmyy']);

/**
 * Splits a key into lower-case tokens on '_', '-', '.', ' ' and camelCase/acronym boundaries:
 * 'vnp_CardType' → [vnp, card, type]; 'PANNumber' → [pan, number]; 'cvv2' → [cvv2].
 */
export function keyTokens(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t !== '')
    .map((t) => t.toLowerCase());
}

/**
 * README 1.8 name rule `/(^|_)(card|cc|cvv|cvc|vcc|pan|expir|cardholder)/i`, applied per token so
 * camelCase keys are caught ('creditCard', 'ccNumber') without dropping 'expiresAt', 'vnp_ExpireDate',
 * 'ccy', 'panel', 'capacity' (decision INT 16/10/2026, see INT w1-report).
 */
export function isCardKey(key: string): boolean {
  const tokens = keyTokens(key);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] as string;
    if (CARD_TOKENS.has(t)) return true;
    if (t.startsWith('card')) return true; // cardHolderName, cardexpiry…
    if (t === 'exp' && EXP_COMPANIONS.has(tokens[i + 1] ?? '')) return true;
  }
  return false;
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Maximal digit runs where single spaces/dashes between digits are ignored ('4111 1111-1111 1111'). */
const DIGIT_RUN = /\d(?:[ -]?\d)*/g;

/** true if the text contains a 13–19 digit sequence that passes Luhn. */
export function containsPan(text: string): boolean {
  for (const m of text.matchAll(DIGIT_RUN)) {
    const digits = m[0].replace(/[ -]/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits)) return true;
  }
  return false;
}

function valueHasPan(v: unknown): boolean {
  if (typeof v === 'string') return containsPan(v);
  if (typeof v === 'number') return Number.isInteger(v) && containsPan(String(v));
  if (typeof v === 'bigint') return containsPan(v.toString());
  return false;
}

/**
 * Removes card data from a parsed payload (object, array, query map or primitive).
 * Throws IntegrationError('INVALID_REQUEST') for cycles or nesting deeper than 32 – without detail.
 */
export function scrubCardData<T>(input: T, opts: ScrubOptions = {}): ScrubResult<T> {
  const allow = new Set(opts.allowKeys ?? []);
  let dropped = 0;
  const seen = new WeakSet<object>();

  const walk = (node: unknown, depth: number): { keep: boolean; out: unknown } => {
    if (depth > MAX_DEPTH)
      throw new IntegrationError('INVALID_REQUEST', 'Payload nested too deeply');
    if (node === null || typeof node !== 'object') {
      return valueHasPan(node) ? { keep: false, out: undefined } : { keep: true, out: node };
    }
    if (seen.has(node)) throw new IntegrationError('INVALID_REQUEST', 'Payload contains a cycle');
    seen.add(node);
    try {
      if (Array.isArray(node)) {
        const out: unknown[] = [];
        for (const item of node) {
          const r = walk(item, depth + 1);
          if (r.keep) out.push(r.out);
          else dropped++;
        }
        return { keep: true, out };
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (!allow.has(k) && isCardKey(k)) {
          dropped++;
          continue;
        }
        const r = walk(v, depth + 1);
        if (r.keep) out[k] = r.out;
        else dropped++;
      }
      return { keep: true, out };
    } finally {
      seen.delete(node);
    }
  };

  const r = walk(input, 0);
  if (!r.keep) dropped++;
  return { value: r.keep ? (r.out as T) : undefined, dropped };
}
