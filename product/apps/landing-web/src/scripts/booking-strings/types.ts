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
  nights: (n: number) => string;
  roomHint: (lo: string | null, hi: string | null) => string;
  longHint: (n: number) => string;
  summary: (n: number) => string;
  e: {
    inReq: string;
    outReq: string;
    arrReq: string;
    range: (max: string) => string;
    order: string;
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
   * Price estimate in the form (LP-v2, FB-INV-009; CPY lp-v2 section 2, UXD lp-v2-design 3). `amount` is already
   * formatted with its unit (formatVnd), `nights` already through nights(n). Never "≈", never "!".
   */
  estimate: EstimateStrings;
  /**
   * ESC-043 (INV 01/11; CPY lp-v2-copy 12.1): by the month, or 28 nights or more by the night, the box shows no figure –
   * this invitation instead (the "Estimated rate" title is hidden in this state). No digits, no %, no amount.
   */
  priceMonthlyOffer: { label: string; text: string };
}

export interface EstimateStrings {
  /** Box title (all states with a number). */
  label: string;
  /** Always under the number: the final rate is in our quote. */
  final: string;
  /** S0: room type or dates missing. */
  prompt: string;
  /** S1: "Any room" chosen. */
  anyRoom: string;
  /** S2: waiting > 300 ms. */
  loading: string;
  /** S3 main line. */
  total: (amount: string, nights: string) => string;
  /** CPY S3 second line (average a night) – kept in the copy, NOT shown: DOM/BE lp-v2 6 (nights differ in price). */
  perNight: (amount: string) => string;
  /** S3 when a length-of-stay discount applies (BR-107) – no amount, no badge. */
  longStay: string;
  /** S6: the API has no figure for this request (priceAvailable false). */
  unavailable: string;
  /** S7: 429 / 5xx / network / > 3 s. */
  error: string;
  currency: string;
  taxIn: string;
  taxOut: string;
  /** Extra guest fee included (BR-110). */
  extraGuest: string;
  /** Under the submit button while a number is shown (the estimate travels with the request). */
  sentWith: string;
  /** role=status sentence (screen readers only). */
  live: (amount: string, nights: string) => string;
  /** Thank-you state, next to the request number. */
  done: string;
  /**
   * 200 + notes.min_stay (BE lp-v2 L12: no figure under the minimum stay). CPY to write; until then the S6 sentence.
   */
  minStay?: (minNights: number) => string;
}
