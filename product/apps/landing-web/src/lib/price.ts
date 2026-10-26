// Money on the landing (FB-INV-004 F9, BR-114; content-guide currency rule, same as Desk `common.currency_vnd`):
// full number with the locale's grouping + unit – EN "667,000 VND", VI "667.000 đ". Never shortened ("667k").
// The copy never writes the number or the unit itself: hero.from / hero.fromTerms receive this string.
import type { Lang } from './i18n';

const UNIT: Record<Lang, string> = { en: 'VND', vi: 'đ' };
const LOCALE: Record<Lang, string> = { en: 'en-US', vi: 'vi-VN' };

export function formatVnd(amount: number, lang: Lang): string {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error(`formatVnd: ${amount} is not a VND amount`);
  const n = new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 0 }).format(amount);
  return `${n} ${UNIT[lang]}`;
}
