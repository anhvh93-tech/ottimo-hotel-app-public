// "From X / month" on the room cards (FB-INV-010 Dot 1, CPY Dot 1 section 2; OpenAPI 0.3.13 add-on 2
// getPublicMonthlyRates). The HTML of every card says "Monthly rate on request"; the live-form build asks the API ONCE
// when the page loads and, for each room type with a positive figure, shows "From X / month" and the taxes + note
// line instead. Room types missing from the answer, a 404 (prices off), an error or a slow answer leave the static
// text – never "From" without a number, never a 0.
import type { Lang } from '../lib/langs';
import { formatVnd, monthlyFromBySlug, type PublicMonthlyRates } from './booking-logic';

/** Fill the cards from a 200 answer. Returns the slugs that got a figure. */
export function fillRoomPrices(root: ParentNode, body: PublicMonthlyRates, lang: Lang): string[] {
  const bySlug = monthlyFromBySlug(body);
  const done: string[] = [];
  root.querySelectorAll<HTMLElement>('[data-room-price]').forEach((card) => {
    const vnd = bySlug.get(card.dataset.roomPrice ?? '');
    const fallback = card.querySelector<HTMLElement>('[data-rp-fallback]');
    const from = card.querySelector<HTMLElement>('[data-rp-from]');
    const amt = from?.querySelector<HTMLDataElement>('.rp-amt');
    const noteIn = card.querySelector<HTMLElement>('[data-rp-note="in"]');
    const noteOut = card.querySelector<HTMLElement>('[data-rp-note="out"]');
    if (!vnd || !fallback || !from || !amt || !noteIn || !noteOut) return;
    amt.textContent = formatVnd(vnd, lang);
    amt.value = String(vnd);
    fallback.hidden = true;
    from.hidden = false;
    noteIn.hidden = !body.taxIncluded;
    noteOut.hidden = body.taxIncluded;
    done.push(card.dataset.roomPrice ?? '');
  });
  return done;
}
