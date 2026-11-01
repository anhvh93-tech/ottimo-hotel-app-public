// Estimated price in the "Plan your stay" form (LP-v2, FB-INV-009; UXD lp-v2-design 3, ARC lp-v2 2.8, CPY lp-v2 2).
// A box under "Room type": the listed rate for the chosen room type, dates and party, from the Desk price list
// through getPublicPriceEstimate. It never blocks the submit button, never holds a room, keeps nothing in the browser
// (no cookie, no storage – SEC SR-PE-11) and only ever shows "estimated" numbers with the final-rate sentence.
//
// States (UXD 3.3): S0 idle (dates/room missing) · S1 "Any room" · S2 calculating (after 300 ms) · S3 price by the
// night · S4 a long stay by the night (API `monthly_offer` – the API owns the threshold) and S5 by the month (not
// asked) = the monthly special-offer invitation WITHOUT a figure and without the "Estimated rate" title (ESC-043,
// INV 01/11; CPY 12.1; BE 63c5731e – no estimateToken, nothing sent with the request) · S6 no online figure (on
// request, minimum stay, party too large – BE lp-v2 6) · S7 not available now. The API answers `no-store`: the page
// keeps no answer, every settled change asks again (BE lp-v2 L2).
// The box stays hidden until the first answer with prices (a 404 = prices off: hidden for the rest of the visit,
// exactly the LP-v1 form – ARC 2.8). After that, errors show S7 (neutral, no number); 429 stops further calls.
// Screen readers: one role=status line, written 700 ms after the result settles and only when it changed (UXD 3.6).
import type { Lang } from '../lib/langs';
import {
  estimateQuery,
  estimateSearch,
  estimateView,
  monthlyOfferView,
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
  /** null = this build never asks for prices (review build). */
  fetchEstimate: ((search: string, signal: AbortSignal) => Promise<EstimateOutcome>) | null;
  now: () => number;
}

export interface EstimateBox {
  /** Re-evaluate after a change in the form (debounced 400 ms). */
  update(): void;
  /** Token of the number on screen, only if it was computed for exactly these values (ARC 2.7). */
  tokenFor(v: FormValues): string | undefined;
  /** Thank-you line for the estimate sent with the request. */
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
  /** What is on screen: the search it was computed for + the answer. */
  let shown: { search: string; body: PublicPriceEstimate; view: EstimateView } | null = null;

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
    if (d.sentWith) d.sentWith.hidden = !shown;
    if (opts.live !== undefined) say(opts.live);
  }

  function showPrompt(kind: 'idle' | 'any-room') {
    shown = null;
    render(kind, [el('p', 'est-idle', kind === 'any-room' ? E.anyRoom : E.prompt)]);
  }

  function showBusy() {
    render('busy', [label(), el('span', 'est-skel'), el('p', 'est-line', E.loading)], {
      busy: true,
    });
    const skel = d.box.querySelector('.est-skel');
    skel?.setAttribute('aria-hidden', 'true');
  }

  function showError() {
    shown = null;
    render('error', [el('p', 'est-msg', E.error)], { live: E.error });
  }

  function showOffer() {
    shown = null;
    const O = d.strings.priceMonthlyOffer;
    const title = el('p', 'est-lbl', O.label);
    title.id = 'bk-est-h';
    render('offer', [title, el('p', 'est-msg', O.text)], {
      live: monthlyOfferView(d.strings).live,
    });
  }

  function showAnswer(search: string, body: PublicPriceEstimate) {
    const view = estimateView(body, d.strings, d.lang, { capacity: d.ctx().capacity });
    if (view.kind === 'offer') return showOffer();
    if (view.kind === 'unavailable') {
      shown = null;
      render('unavailable', [el('p', 'est-msg', view.live)], { live: view.live });
      return;
    }
    shown = { search, body, view };
    const main = el('p', 'est-main');
    const [before, amount, after] = view.main ?? ['', '', ''];
    const data = el('data', 'est-amt', amount) as HTMLDataElement;
    data.value = String(view.value ?? '');
    main.append(before, data, after);
    const parts: HTMLElement[] = [label(), main];
    for (const line of view.lines) parts.push(el('p', 'est-line', line));
    parts.push(el('p', 'est-note', view.note.join(' ')));
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
      if (!pricesOn) shown = null;
      else if (q === 'monthly') showOffer();
      else showPrompt(q);
      if (d.sentWith) d.sentWith.hidden = true;
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
        showAnswer(search, out.body);
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
    tokenFor(v) {
      if (!shown?.body.estimateToken) return undefined;
      const q = estimateQuery(v, d.ctx());
      if (typeof q === 'string' || estimateSearch(q) !== shown.search) return undefined;
      if (shown.body.expiresAt && Date.parse(shown.body.expiresAt) <= d.now()) return undefined;
      return shown.body.estimateToken;
    },
    doneLine() {
      return shown?.view.done ?? '';
    },
    off() {
      disabled = true;
      ctrl?.abort();
      clearTimeout(debounce);
      clearTimeout(busyTimer);
      shown = null;
      d.box.hidden = true;
      d.box.replaceChildren();
      if (d.sentWith) d.sentWith.hidden = true;
    },
  };
  return box;
}
