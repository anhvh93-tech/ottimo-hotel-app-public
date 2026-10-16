/** Same rule as the server's V-09 (CARD_NUMBER_DETECTED): a 13–19 digit run that passes Luhn. */
export function containsCardNumber(text: string): boolean {
  const runs = text.match(/\d[\d -]{11,}\d/g) ?? [];
  return runs.some((run) => {
    const digits = run.replace(/[ -]/g, '');
    return digits.length >= 13 && digits.length <= 19 && luhn(digits);
  });
}

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export const ARRIVAL_NOTE_MAX = 300;

/** Strip control characters (the server does the same – SR-INP). */
export function cleanNote(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}
