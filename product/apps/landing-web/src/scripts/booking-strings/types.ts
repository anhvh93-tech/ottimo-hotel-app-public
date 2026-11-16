// Shape of the strings the booking-request script writes at run time (concept 5.3, 5.4; mock v1.2.1 `T`). Static
// labels of the form live in the page copy (content/<lang>.ts). One module per language (./en.ts … ./ru.ts), loaded
// with import() by the page language (ARC lp-v2 3.2): the English page never downloads Korean, Chinese or Russian.
export type ChannelKey = 'zalo' | 'whatsapp' | 'phone' | 'email';

export interface BookingStrings {
  chName: Record<'zalo' | 'whatsapp' | 'phone', string>;
  thanks: (name: string) => string;
  next: Record<ChannelKey, string>;
  /** Public promise of the 202 response (`promise.kind`, BR-912 (4)) – never the internal replyBy. */
  when: {
    withinMinutes: (minutes: number, open: string, close: string) => string;
    nextMorning: (by: string, open: string) => string;
    callNow: (minutes: number) => string;
  };
  /** "If you have not heard from us by {time}, call {hotline} or message us on Zalo with this number." */
  fallback: readonly [string, string, string];
  roomHint: (lo: string | null, hi: string | null) => string;
  summary: (n: number) => string;
  e: {
    /** Move-in date missing. */
    arrReq: string;
    /** FB-INV-010: number of months missing (the select always holds one – kept for the server REQUIRED code). */
    monthsReq: string;
    range: (max: string) => string;
    cap: (n: string) => string;
    name: string;
    phone: (channel: string) => string;
    email: string;
    card: string;
    consent: string;
    /** Server ID_NUMBER_DETECTED (SEC ARC-08): no documents at this step. */
    idNumber: string;
    /** Server PHONE_INVALID / PHONE_COUNTRY_CODE_REQUIRED (V-02). */
    phoneCountry: string;
    /** Any other field the server refused. */
    server: string;
  };
  net: { network: string; busy: string; rate: string };
  /**
   * The form is not taking requests right now (404 / PUBLIC_FORM_NOT_READY – switch off on the server): text around
   * the Zalo link and the hotline link, "… message us on [Zalo] or call [08.4444.0909]."
   */
  notReady: readonly [string, string, string];
  /** NOTICE_VERSION_INVALID: the privacy notice changed since the page loaded. */
  reload: string;
  sending: string;
  /** Review build only: the request is validated but never sent (no endpoint yet). */
  notSent: string;
  /**
   * Price box of the form (FB-INV-010 Dot 1, CPY Dot 1 section 7 – replaces the LP-v2 nightly estimate and the
   * ESC-043 monthly invitation): the listed monthly rate of the chosen room type, and the total for the months chosen.
   * `amount` is already formatted with its unit (formatVnd). Never "≈", never "!".
   */
  estimate: EstimateStrings;
}

export interface EstimateStrings {
  /** Box title (all states with a number). */
  label: string;
  /** Main line, "From {amount} / month" – same words as the room card (Copy.rooms.fromPrice). */
  fromMonth: (amount: string) => string;
  /** Right under the main line – same words as Copy.rooms.priceNote. */
  note: string;
  /**
   * Total for the months chosen (`longStay.totalVnd` = listed monthly rate × months): `months` = the label of the
   * chosen option in the form ("6 months", "1 year"). Shown only from 2 months on.
   */
  total: (amount: string, months: string) => string;
  /** No room is held until the deposit is received. */
  final: string;
  /** S0: room type or move-in date missing. */
  prompt: string;
  /** S1: "Any room" chosen. */
  anyRoom: string;
  /** S2: waiting > 300 ms. */
  loading: string;
  /** S6: the API has no figure for this request (priceAvailable false). */
  unavailable: string;
  /** S7: 429 / 5xx / network / > 3 s. */
  error: string;
  currency: string;
  taxIn: string;
  taxOut: string;
  /** Under the submit button while a number is shown (the rate travels with the request). */
  sentWith: string;
  /** role=status sentence (screen readers only). */
  live: (amount: string) => string;
  /** Thank-you state, next to the request number. */
  done: string;
  /**
   * Status line only (screen readers – CPY 13.3, FB-R4-UXD-FE-09): read when the box goes back to S0/S1 after a
   * number was shown; the old price sentence is emptied first.
   */
  liveCleared: string;
}
