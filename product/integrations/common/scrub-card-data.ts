// scrubCardData – README 1.8 (SEC-01 Blocker, ARC-04), two tiers per SEC decision 16/10/2026
// (FB-R2-SEC-INT-01/02/03). Owner: INT.
// Runs on a provider payload AFTER signature verification on the raw body and BEFORE the explicit
// allowlist mapping. Drops
//   (name)       fields whose NAME looks like card data (token rule, allowKeys exempt this rule only);
//   (value_text) Tier A – free text and every field the adapter did NOT declare: any window of 13–19
//                consecutive digits (spaces/dashes inside a digit run ignored) that passes Luhn – strict,
//                no IIN, so "card+CVV" / "card+expiry" written next to each other are caught;
//   (value_id)   Tier B – fields the adapter DECLARED in `fieldKinds` whose value is digits only:
//                dropped only when the whole value passes Luhn AND starts with a card IIN AND has a
//                length valid for that brand (CARD_IIN_TABLE). timestamp14/epochMs values that are a
//                valid date within ±2 years are kept before that check.
// Integers above Number.MAX_SAFE_INTEGER were already rounded by JSON.parse → dropped as suspect.
// It never logs and never returns values of what it dropped – only counts per rule, plus the NAMES of
// adapter-declared required keys that were dropped (the adapter's own constants, not payload data), so
// the caller raises a "Cần chú ý" item `card_suspect` instead of silently treating the payload as fine.
import { IntegrationError } from '../contracts/common.js';

/**
 * Declared kind of a provider field (Tier B). Only digit-only values of declared keys use Tier B;
 * a value with any other character, or kind 'text', uses Tier A.
 * - numericId   : transaction no., booking no., amounts – Luhn + IIN + brand length
 * - timestamp14 : yyyyMMddHHmmss (vnp_PayDate, vnp_CreateDate) – kept if a valid date within ±2 years
 * - epochMs     : 13-digit epoch milliseconds (MoMo responseTime) – kept if within ±2 years
 * - text        : explicit Tier A (same as undeclared)
 */
export type FieldKind = 'numericId' | 'timestamp14' | 'epochMs' | 'text';

export interface ScrubOptions {
  /**
   * Exact key names exempt from the NAME rule only (never from the value rules), for provider fields
   * that are not card data but contain a card-like token, e.g. VNPay `vnp_CardType` ('ATM', 'QRCODE').
   */
  allowKeys?: readonly string[];
  /** Exact key name (at any depth) → kind. Applies to the primitive value directly under that key. */
  fieldKinds?: Readonly<Record<string, FieldKind>>;
  /** Exact key names the adapter's mapping cannot work without; dropped → listed in `attention`. */
  requiredKeys?: readonly string[];
  /**
   * Current time from the injected Clock (ADR-008) for the ±2 years date window. Without it the
   * window is skipped and timestamp14/epochMs values get the plain Tier B check (still safe: 14-digit
   * yyyy… and 13-digit epoch values match no card IIN+length today).
   */
  nowMs?: number;
}

export type ScrubRule = 'name' | 'value_text' | 'value_id';

export interface ScrubAttention {
  /** Always 'card_suspect' – the caller creates a "Cần chú ý" item with this reason. */
  reason: 'card_suspect';
  /** Name of the required key (from opts.requiredKeys); never the value. */
  field: string;
  rule: ScrubRule;
}

export interface ScrubResult<T> {
  /** Deep copy without the dropped fields/elements; `undefined` if the whole input was dropped. */
  value: T | undefined;
  /** Number of fields/elements removed (each removed subtree counts once). */
  dropped: number;
  /** Same count split by rule – metric label `rule` of integration_card_data_dropped_total. */
  droppedByRule: Record<ScrubRule, number>;
  /** Required keys that were dropped (deduplicated, in payload order). Non-empty = do NOT auto-process. */
  attention: ScrubAttention[];
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
const PAN_MIN = 13;
const PAN_MAX = 19;

/**
 * Tier A: true if the text contains ANY window of 13–19 consecutive digits (after removing the
 * spaces/dashes inside a digit run) that passes Luhn – so a card glued to a CVV, expiry or phone number
 * ("4111111111111111 123", "4111 1111 1111 1111 12-28", "41111111111111111234") is still found.
 * Cost ≤ 7 Luhn checks per digit.
 */
export function containsPan(text: string): boolean {
  for (const m of text.matchAll(DIGIT_RUN)) {
    const digits = m[0].replace(/[ -]/g, '');
    const n = digits.length;
    if (n < PAN_MIN) continue;
    for (let start = 0; start + PAN_MIN <= n; start++) {
      const maxLen = Math.min(PAN_MAX, n - start);
      for (let len = PAN_MIN; len <= maxLen; len++) {
        if (luhnValid(digits.slice(start, start + len))) return true;
      }
    }
  }
  return false;
}

/**
 * Card IIN prefixes and valid lengths (Tier B). Changing this table requires SEC approval; it may only
 * be WIDENED without one (SEC w1-review). Sources (looked up 16/10/2026): SEC FB-R2-SEC-INT-01 table;
 * Wikipedia "Payment card number" – IIN ranges (https://en.wikipedia.org/wiki/Payment_card_number),
 * which follows ISO/IEC 7812-1 and the brands' published ranges. Widened by INT vs. the SEC table:
 * Diners 30 (300–309, Wikipedia lists "30"), Mir 2200–2204 (16–19).
 */
export const CARD_IIN_TABLE: readonly {
  brand: string;
  /** Inclusive prefix ranges, same number of digits on both ends. */
  ranges: readonly (readonly [string, string])[];
  lengths: readonly number[];
}[] = [
  { brand: 'visa', ranges: [['4', '4']], lengths: [13, 16, 19] },
  {
    brand: 'mastercard',
    ranges: [
      ['51', '55'],
      ['2221', '2720'],
    ],
    lengths: [16],
  },
  {
    brand: 'amex',
    ranges: [
      ['34', '34'],
      ['37', '37'],
    ],
    lengths: [15],
  },
  { brand: 'jcb', ranges: [['3528', '3589']], lengths: [16, 17, 18, 19] },
  { brand: 'unionpay', ranges: [['62', '62']], lengths: [16, 17, 18, 19] },
  {
    brand: 'discover',
    ranges: [
      ['6011', '6011'],
      ['644', '649'],
      ['65', '65'],
    ],
    lengths: [16, 17, 18, 19],
  },
  {
    brand: 'diners',
    ranges: [
      ['30', '30'],
      ['36', '36'],
      ['38', '39'],
    ],
    lengths: [14, 15, 16, 17, 18, 19],
  },
  {
    brand: 'maestro',
    ranges: [
      ['50', '50'],
      ['56', '69'],
    ],
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
  },
  { brand: 'mir', ranges: [['2200', '2204']], lengths: [16, 17, 18, 19] },
  { brand: 'napas', ranges: [['9704', '9704']], lengths: [16, 19] },
];

/** Brand whose IIN and length match `digits` (digits only), or undefined. */
export function cardBrand(digits: string): string | undefined {
  for (const row of CARD_IIN_TABLE) {
    if (!row.lengths.includes(digits.length)) continue;
    for (const [lo, hi] of row.ranges) {
      const p = digits.slice(0, lo.length);
      if (p.length === lo.length && p >= lo && p <= hi) return row.brand;
    }
  }
  return undefined;
}

/** Tier B: a digit-only value of a declared numeric field is a card only with Luhn + IIN + length. */
export function looksLikeCardNumber(digits: string): boolean {
  return /^\d+$/.test(digits) && cardBrand(digits) !== undefined && luhnValid(digits);
}

const TWO_YEARS_MS = 2 * 366 * 24 * 3600 * 1000;

/** yyyyMMddHHmmss with real calendar values, within ±2 years of nowMs (timezone-agnostic: ±1 day slack is inside the window). */
export function isRecentTimestamp14(digits: string, nowMs: number): boolean {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(digits);
  if (!m) return false;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  if (mo < 1 || mo > 12 || d < 1 || h > 23 || mi > 59 || s > 59) return false;
  const t = Date.UTC(y, mo - 1, d, h, mi, s);
  if (new Date(t).getUTCDate() !== d) return false; // 31/02 etc.
  return Math.abs(t - nowMs) <= TWO_YEARS_MS;
}

/** 13-digit epoch milliseconds within ±2 years of nowMs. */
export function isRecentEpochMs(digits: string, nowMs: number): boolean {
  if (!/^\d{13}$/.test(digits)) return false;
  return Math.abs(Number(digits) - nowMs) <= TWO_YEARS_MS;
}

/** Which value rule drops `v` (undefined = keep). `kind` undefined = undeclared → Tier A. */
function valueRule(
  v: unknown,
  kind: FieldKind | undefined,
  nowMs: number | undefined,
): ScrubRule | undefined {
  const tierB = kind !== undefined && kind !== 'text';
  let digits: string | undefined;
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) return undefined;
    // FB-R2-SEC-INT-03: already rounded by JSON.parse – real digits unknown; ids that large must be strings.
    if (!Number.isSafeInteger(v)) return tierB ? 'value_id' : 'value_text';
    digits = String(Math.abs(v));
  } else if (typeof v === 'bigint') {
    digits = (v < 0n ? -v : v).toString();
  } else if (typeof v === 'string') {
    if (!tierB || !/^\d+$/.test(v)) return containsPan(v) ? 'value_text' : undefined;
    digits = v;
  } else {
    return undefined;
  }
  if (!tierB) return containsPan(digits) ? 'value_text' : undefined;
  if (nowMs !== undefined) {
    if (kind === 'timestamp14' && isRecentTimestamp14(digits, nowMs)) return undefined;
    if (kind === 'epochMs' && isRecentEpochMs(digits, nowMs)) return undefined;
  }
  return looksLikeCardNumber(digits) ? 'value_id' : undefined;
}

/**
 * Removes card data from a parsed payload (object, array, query map or primitive).
 * Throws IntegrationError('INVALID_REQUEST') for cycles or nesting deeper than 32 – without detail.
 */
export function scrubCardData<T>(input: T, opts: ScrubOptions = {}): ScrubResult<T> {
  const allow = new Set(opts.allowKeys ?? []);
  const kinds = opts.fieldKinds ?? {};
  const required = new Set(opts.requiredKeys ?? []);
  const nowMs = opts.nowMs;
  const byRule: Record<ScrubRule, number> = { name: 0, value_text: 0, value_id: 0 };
  const attention: ScrubAttention[] = [];
  const seen = new WeakSet<object>();

  const drop = (rule: ScrubRule, key?: string) => {
    byRule[rule]++;
    if (key !== undefined && required.has(key) && !attention.some((a) => a.field === key)) {
      attention.push({ reason: 'card_suspect', field: key, rule });
    }
  };

  const walk = (
    node: unknown,
    depth: number,
    kind: FieldKind | undefined,
  ): { rule?: ScrubRule; out?: unknown } => {
    if (depth > MAX_DEPTH)
      throw new IntegrationError('INVALID_REQUEST', 'Payload nested too deeply');
    if (node === null || typeof node !== 'object') {
      const rule = valueRule(node, kind, nowMs);
      return rule ? { rule } : { out: node };
    }
    if (seen.has(node)) throw new IntegrationError('INVALID_REQUEST', 'Payload contains a cycle');
    seen.add(node);
    try {
      if (Array.isArray(node)) {
        const out: unknown[] = [];
        for (const item of node) {
          const r = walk(item, depth + 1, undefined);
          if (r.rule) drop(r.rule);
          else out.push(r.out);
        }
        return { out };
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (!allow.has(k) && isCardKey(k)) {
          drop('name', k);
          continue;
        }
        const own = Object.prototype.hasOwnProperty.call(kinds, k) ? kinds[k] : undefined;
        const r = walk(v, depth + 1, own);
        if (r.rule) drop(r.rule, k);
        else out[k] = r.out;
      }
      return { out };
    } finally {
      seen.delete(node);
    }
  };

  const r = walk(input, 0, undefined);
  if (r.rule) drop(r.rule);
  const dropped = byRule.name + byRule.value_text + byRule.value_id;
  return {
    value: r.rule ? undefined : (r.out as T),
    dropped,
    droppedByRule: byRule,
    attention,
  };
}
