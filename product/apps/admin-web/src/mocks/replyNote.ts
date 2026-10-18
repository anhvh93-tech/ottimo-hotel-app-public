/**
 * Mock copy of the server checks on a staff `replyNote` (EP14 v0.3 mục 4.4 – luật B-15, SEC `reviews/s4-SEC.md`
 * C.6 V2 + bổ sung 18/10; BE-D `guest-portal/internal/guest-request-rules.ts` `hasSensitiveDigits`, FB-R2-SEC-BE-77).
 * Same order as the server: card number (Luhn, original text) → `CARD_NUMBER_DETECTED`, then the digits rule →
 * `SENSITIVE_DATA_DETECTED`. Only `replyNote` (visible to anyone with the guest link) goes through it – the
 * guest's own `note` never does.
 */

const luhnValid = (digits: string) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
};

/** V-09 `containsCardNumber`: any 13–19 digit window (spaces / dashes between digits) passing Luhn. */
export function containsCardNumber(text: string): boolean {
  for (const c of text.match(/\d(?:[ -]?\d){12,18}/g) ?? []) {
    const digits = c.replace(/[ -]/g, '');
    for (let len = 13; len <= Math.min(19, digits.length); len++)
      for (let start = 0; start + len <= digits.length; start++)
        if (luhnValid(digits.slice(start, start + len))) return true;
  }
  return false;
}

// Step 3 tokens (same expressions as BE-D): a near date and VND money with its unit become `|`.
const B15_DATE = /(?<!\p{Nd}|\p{Nd}[./-])(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?!\p{Nd})/gu;
const B15_MONEY =
  /(?<![\p{L}\p{Nd}]|\p{Nd}[.,])([1-9]\d{0,2}(?:([.,\s])\d{3}(?:\2\d{3})*)?|[1-9]\d{3,9})\s?(?:đồng|vnđ|vnd|đ|₫)(?![\p{L}\p{Nd}])/giu;

function isNearDate(day: number, month: number, year: number, currentYear: number): boolean {
  if (Math.abs(year - currentYear) > 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Luật B-15: a run of ≥ 6 digits left after removing near dates, priced amounts and list boundaries. */
export function hasSensitiveDigits(
  text: string,
  publicPhone: string | null,
  currentYear: number,
): boolean {
  const checked = text
    .normalize('NFKC')
    .replace(B15_DATE, (all, d: string, _sep: string, m: string, y: string) =>
      isNearDate(Number(d), Number(m), Number(y), currentYear) ? '|' : all,
    )
    .replace(B15_MONEY, (all, amount: string) => {
      const digits = amount.replace(/\D/g, '');
      return digits.length <= 10 && (digits.length < 6 || digits.endsWith('000')) ? '|' : all;
    })
    // SEC s7 (18/10): `, ` / `; ` (with whitespace after) separates a list – `Phòng 202, 203, 204`.
    .replace(/[,;]\s+/gu, '|');
  const compact = checked.replace(/[\s.,\-_+()\p{Pd}]/gu, '');
  const runs = compact.match(/\p{Nd}{6,}/gu) ?? [];
  const hotline = (publicPhone ?? '').replace(/\D/g, '');
  const tail = (s: string) => s.slice(-9);
  return runs.some(
    (run) => !(hotline.length >= 9 && run.length >= 9 && tail(run) === tail(hotline)),
  );
}

/** Field errors of a trimmed, non-empty `replyNote` (empty / REQUIRED / TOO_LONG are checked by the caller). */
export function replyNoteErrors(
  note: string,
  opts: { publicPhone: string | null; currentYear: number },
): Array<{ field: string; code: string }> {
  if (containsCardNumber(note)) return [{ field: 'replyNote', code: 'CARD_NUMBER_DETECTED' }];
  if (hasSensitiveDigits(note, opts.publicPhone, opts.currentYear))
    return [{ field: 'replyNote', code: 'SENSITIVE_DATA_DETECTED' }];
  return [];
}
