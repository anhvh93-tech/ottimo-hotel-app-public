// Monthly price box of the "Plan your stay" form (FB-INV-010 Dot 1 – replaces the LP-v2 nightly estimate and the
// ESC-043 monthly invitation; UXD lp-v2-design 3, ARC lp-v2 2.8, CPY Dot 1 section 7). A box under "Room type": the
// listed monthly rate of the chosen room type at the move-in date and the total for the months chosen, from the Desk
// price list through getPublicPriceEstimate (stayType=long&months=n). It never blocks the submit button, never holds
// a room, keeps nothing in the browser (no cookie, no storage – SEC SR-PE-11) and always says the final rate comes in
// the quote.
//
// States (UXD 3.3): S0 idle (room missing / party too large) · S1 "Any room" · S2 calculating (after 300 ms) ·
// S3 price ("From X / month", the total from 2 months on) · S6 no online figure (on request, party too large – BE) ·
// S7 not available now. While a room type is chosen but no move-in date yet, the box shows that type's
// "From X / month" from getPublicMonthlyRates (loaded once with the page – no token, no total) when it has one.
// The API answers `no-store`: the page keeps no answer, every settled change asks again (BE lp-v2 L2).
// The box stays hidden until the first answer with prices (a 404 = prices off: hidden for the rest of the visit,
// exactly the LP-v1 form – ARC 2.8). After that, errors show S7 (neutral, no number); 429 stops further calls.
// Screen readers: one role=status line, written 700 ms after the result settles and only when it changed (UXD 3.6);
// emptied at once when the price goes away, so it never holds an old price (FB-R4-UXD-FE-09).
import type { Lang } from '../lib/langs';
import {
  estimateQuery,
  estimateSearch,
  estimateView,
  joinSentences,
  monthlyView,
  type EstimateView,
  type FormValues,
  type PublicPriceEstimate,
} from './booking-logic';
import type { EstimateOutcome } from './booking-transport';
import type { BookingStrings } from './booking-strings';

export interface EstimateDeps {
  box: HTMLElement;
  live: HTMLElement;
  sentWith: HTMLElement | null;
  strings: BookingStrings;
  lang: Lang;
  /** Current values of the form. */
  values: () => FormValues;
  /** Room capacity of the selected room type (data-cap), today and the last bookable day. */
  ctx: () => { today: string; max: string; capacity: number | null };
  /** Label of the chosen months option ("6 months", "1 year") for the total line. */
  monthsLabel: () => string;
  /** "From" figure of a room type from getPublicMonthlyRates (page load), if the page has one. */
  monthlyFrom: (roomType: string) => { vnd: number; taxIncluded: boolean } | undefined;
  /** null = this build never asks for prices (review build). */
  fetchEstimate: ((search: string, signal: AbortSignal) => Promise<EstimateOutcome>) | null;
  now: () => number;
}

export interface EstimateBox {
  /** Re-evaluate after a change in the form (debounced 400 ms). */
  update(): void;
  /** getPublicMonthlyRates answered with figures: prices are on – show the box (with its prompt) at once. */
  pricesKnown(): void;
  /** Token of the number on screen, only if it was computed for exactly these values (ARC 2.7). */
  tokenFor(v: FormValues): string | undefined;
  /** Thank-you line for the rate sent with the request. */
  doneLine(): string;
  /** The form is not taking requests: hide the box and stop. */
  off(): void;
}

const DEBOUNCE_MS = 400;
const SHOW_BUSY_AFTER_MS = 300;
const LIVE_DELAY_MS = 700;

export function initEstimate(d: EstimateDeps): EstimateBox {
  const E = d.strings.estimate;
  let disabled = !d.fetchEstimate;
  let blocked = false; // 429 – no new call until reload
  let pricesOn = false; // a 200 came back once: the box is shown from now on
  let seq = 0;
  let ctrl: AbortController | null = null;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let busyTimer: ReturnType<typeof setTimeout> | undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;
  let lastLive = '';
  /** What is on screen: the search it was computed for (null = monthly-rates figure, no token) + the answer. */
  let shown: {
    search: string | null;
    body: PublicPriceEstimate | null;
    view: EstimateView;
  } | null = null;

  if (d.sentWith) d.sentWith.textContent = E.sentWith;

  const el = (tag: string, cls: string, text?: string) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function label() {
    const p = el('p', 'est-lbl', E.label);
    p.id = 'bk-est-h';
    return p;
  }

  function say(text: string) {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      if (text && text !== lastLive) {
        d.live.textContent = text;
        lastLive = text;
      }
    }, LIVE_DELAY_MS);
  }

  /** Empty the status line now (no announcement): it must never keep a price that is gone. */
  function silence() {
    clearTimeout(liveTimer);
    d.live.textContent = '';
    lastLive = '';
  }

  function render(
    state: string,
    children: HTMLElement[],
    opts: { busy?: boolean; live?: string } = {},
  ) {
    d.box.dataset.state = state;
    if (opts.busy) {
      // keep the old number, faded (UXD S2), add the placeholder line
      d.box.setAttribute('aria-busy', 'true');
      d.box.classList.add('is-busy');
      if (!d.box.querySelector('.est-amt')) d.box.replaceChildren(...children);
      return;
    }
    d.box.removeAttribute('aria-busy');
    d.box.classList.remove('is-busy');
    d.box.replaceChildren(...children);
    // the rate travels with the request only with a token (an estimate for exactly these values)
    if (d.sentWith) d.sentWith.hidden = !shown?.body?.estimateToken;
    if (opts.live !== undefined) say(opts.live);
  }

  function showPrompt(kind: 'idle' | 'any-room') {
    const hadNumber = !!d.box.querySelector('.est-amt');
    shown = null;
    silence(); // the old price leaves the status line at once (FB-R4-UXD-FE-09)
    if (hadNumber) say(E.liveCleared); // CPY 13.3: only after a number was on screen
    render(kind, [el('p', 'est-idle', kind === 'any-room' ? E.anyRoom : E.prompt)]);
  }

  function showBusy() {
    // est-wait is never faded: only an old number is (FB-R4-UXD-FE-07 – contrast of the waiting line)
    render('busy', [label(), el('span', 'est-skel'), el('p', 'est-wait', E.loading)], {
      busy: true,
    });
    const skel = d.box.querySelector('.est-skel');
    skel?.setAttribute('aria-hidden', 'true');
  }

  function showError() {
    shown = null;
    render('error', [el('p', 'est-msg', E.error)], { live: E.error });
  }

  function showView(view: EstimateView, search: string | null, body: PublicPriceEstimate | null) {
    if (view.kind === 'unavailable') {
      shown = null;
      render('unavailable', [el('p', 'est-msg', view.live)], { live: view.live });
      return;
    }
    shown = { search, body, view };
    // "From <amount> / month" on one line: the amount in Lora 28 px, the words around it in the quieter 15 px of
    // the line (ko "월 …부터", zh "每月 … 起"); the amount itself never breaks (U+00A0 before VND – FB-R4-UXD-FE-04).
    const [before, amount, after] = view.main ?? ['', '', ''];
    const main = el('p', 'est-main est-main--month');
    const data = el('data', 'est-amt', amount) as HTMLDataElement;
    data.value = String(view.value ?? '');
    if (before) main.append(before);
    main.append(data);
    // vi "…VND/tháng": a break chance before the slash, so the line never runs out of a 360 px box
    if (after.startsWith('/')) main.append(document.createElement('wbr'));
    if (after) main.append(after);
    const parts: HTMLElement[] = [label(), main];
    for (const line of view.lines) parts.push(el('p', 'est-line', line));
    parts.push(el('p', 'est-note', joinSentences(view.note, d.lang)));
    render('price', parts, { live: view.live });
  }

  function reveal() {
    if (!pricesOn) {
      pricesOn = true;
      d.box.hidden = false;
    }
  }

  async function run() {
    if (disabled) return;
    const v = d.values();
    const c = d.ctx();
    const q = estimateQuery(v, c);
    ctrl?.abort();
    clearTimeout(busyTimer);
    if (typeof q === 'string') {
      seq++;
      if (d.sentWith) d.sentWith.hidden = true;
      const from = q === 'no-date' ? d.monthlyFrom(v.roomType) : undefined;
      if (from) {
        reveal();
        showView(monthlyView(from.vnd, from.taxIncluded, d.strings, d.lang), null, null);
      } else if (!pricesOn) {
        shown = null;
        silence();
      } else showPrompt(q === 'any-room' ? 'any-room' : 'idle');
      return;
    }
    const search = estimateSearch(q);
    if (blocked) {
      seq++;
      if (pricesOn) showError();
      return;
    }
    const mine = ++seq;
    const ac = new AbortController();
    ctrl = ac;
    shown = shown && shown.search === search ? shown : null;
    if (d.sentWith) d.sentWith.hidden = true;
    if (pricesOn) busyTimer = setTimeout(() => mine === seq && showBusy(), SHOW_BUSY_AFTER_MS);
    const out = await d.fetchEstimate!(search, ac.signal);
    clearTimeout(busyTimer);
    if (mine !== seq || out.kind === 'aborted') return; // a newer request owns the box
    switch (out.kind) {
      case 'ok':
        reveal();
        showView(
          estimateView(out.body, d.strings, d.lang, {
            capacity: d.ctx().capacity,
            monthsLabel: d.monthsLabel(),
          }),
          search,
          out.body,
        );
        return;
      case 'off':
        box.off();
        return;
      case 'invalid':
        if (pricesOn) showPrompt('idle');
        return;
      case 'rate':
        blocked = true;
        if (pricesOn) showError();
        return;
      default:
        if (pricesOn) showError();
    }
  }

  const box: EstimateBox = {
    update() {
      if (disabled) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => void run(), DEBOUNCE_MS);
    },
    pricesKnown() {
      if (disabled || pricesOn) return;
      reveal();
      box.update();
    },
    tokenFor(v) {
      if (!shown?.search || !shown.body?.estimateToken) return undefined;
      const q = estimateQuery(v, d.ctx());
      if (typeof q === 'string' || estimateSearch(q) !== shown.search) return undefined;
      if (shown.body.expiresAt && Date.parse(shown.body.expiresAt) <= d.now()) return undefined;
      return shown.body.estimateToken;
    },
    doneLine() {
      return shown?.body?.estimateToken ? shown.view.done : '';
    },
    off() {
      disabled = true;
      ctrl?.abort();
      clearTimeout(debounce);
      clearTimeout(busyTimer);
      shown = null;
      silence();
      d.box.hidden = true;
      d.box.replaceChildren();
      if (d.sentWith) d.sentWith.hidden = true;
    },
  };
  return box;
}
