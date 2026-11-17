// "From X / month" on the room cards (FB-INV-010 Dot 1, CPY Dot 1 section 2; OpenAPI 0.3.13 add-on 2
// getPublicMonthlyRates). The HTML of every card says "Monthly rate on request"; the live-form build asks the API ONCE
// when the page loads and, for each room type with a positive figure, shows "From X / month" and the taxes + note
// line instead. Room types missing from the answer, a 404 (prices off), an error or a slow answer leave the static
// text – never "From" without a number, never a 0.
// FB-INV-011: with a valid `fx` rate for the page currency (fx.ts – never on the vi page), two lines follow the VND
// figure: "≈ US$334 / month" and "Estimate at the 17 Nov 2026 rate. Payment in VND." – created here with textContent;
// no rate → the card is exactly the VND one.
import type { Lang } from '../lib/langs';
import { formatVnd, monthlyFromBySlug, type PublicMonthlyRates } from './booking-logic';
import { fxLines, type FxQuote, type FxStrings } from './fx';

/** Fill the cards from a 200 answer. Returns the slugs that got a figure. */
export function fillRoomPrices(
  root: ParentNode,
  body: PublicMonthlyRates,
  lang: Lang,
  opts: { fx?: FxQuote | null; strings?: FxStrings } = {},
): string[] {
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
    card.querySelectorAll('.rp-fx, .rp-fx-note').forEach((n) => n.remove());
    const fx = opts.strings ? fxLines(vnd, opts.fx ?? null, opts.strings, lang) : null;
    if (fx) {
      const line = document.createElement('p');
      line.className = 'rp-fx';
      const fxAmt = document.createElement('data');
      fxAmt.className = 'rp-fx-amt';
      fxAmt.value = String(fx.value);
      fxAmt.textContent = fx.month;
      line.append(fxAmt);
      const note = document.createElement('p');
      note.className = 'rp-fx-note';
      note.textContent = fx.note;
      from.after(line, note);
    }
    done.push(card.dataset.roomPrice ?? '');
  });
  return done;
}
