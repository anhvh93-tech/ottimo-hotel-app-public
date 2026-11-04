// Run-time strings of the booking form, one module per language (ARC lp-v2 3.2): the page loads only its own language
// with import(), so the English page never downloads Korean, Chinese or Russian text (JS budget).
import type { Lang } from '../../lib/langs';
import type { BookingStrings } from './types';

export type { BookingStrings, ChannelKey, EstimateStrings } from './types';

const LOADERS: Record<Lang, () => Promise<{ default: BookingStrings }>> = {
  en: () => import('./en'),
  vi: () => import('./vi'),
  ko: () => import('./ko'),
  zh: () => import('./zh'),
  ru: () => import('./ru'),
};

export async function loadBookingStrings(lang: Lang): Promise<BookingStrings> {
  return (await LOADERS[lang]()).default;
}
