// Shape of the page copy (concept v1.2.1; CPY concept B 24/10 adds why.more and location.ask). Every published language must fill every field (ADR-014 3.4): a missing
// string is a type error at `astro check`, and copy.test.ts checks that no field is empty.
// Inline markup in copy strings: [[…]] = never break inside (`.nw`, concept T7). Nothing else is interpreted.
import type { Lang } from '../lib/i18n';

/** Text in the other language, shown on purpose (brand: English leads, Vietnamese supports). */
export interface Foreign {
  lang: Lang;
  text: string;
}

/** Slug of a public room type (OpenAPI `publicRoomType`, concept 5.2 / G-13). */
export type RoomSlug =
  | 'standard-studio-city-view'
  | 'standard-studio-garden-view'
  | 'premium-one-bedroom-1'
  | 'signature-two-bedrooms';

export interface Room {
  slug: RoomSlug;
  photo: string;
  name: string;
  altName: Foreign;
  /** Short name in the form's room select (concept T7). */
  shortName: string;
  /**
   * Standard and maximum guests (BR-110, concept 4): the maximum adds one guest on the sofa or, in Premium, on the
   * 1.4 m extra bed (INV 22/10).
   */
  sleeps: readonly [number, number];
  size: string;
  view: string;
  desc: string;
}

export interface Step {
  title: string;
  text: string;
}

/** Labels of the booking-request form (concept 5.2) – rendered only when the form is on. */
export interface FormCopy {
  title: string;
  yourStay: string;
  lengthOfStay: string;
  byNight: string;
  byMonth: string;
  checkIn: string;
  checkOut: string;
  arrival: string;
  months: readonly { value: string; label: string }[];
  adults: string;
  ages6to11: string;
  under6: string;
  roomType: string;
  anyRoom: string;
  reachYou: string;
  yourName: string;
  replyOn: string;
  phoneCall: string;
  number: { zalo: string; whatsapp: string; phone: string };
  phoneHint: string;
  note: string;
  optional: string;
  noteHint: string;
  honeypot: string;
  consent: string;
  consentMore: string;
  privacy: string;
  submit: string;
  noJs: string;
  done: {
    title: string;
    requestNumber: string;
    tonight: string;
    openZalo: string;
    again: string;
  };
}

export interface Copy {
  lang: Lang;
  meta: { title: string; description: string; ogImageAlt: string };
  skip: string;
  nav: {
    label: string;
    mobileLabel: string;
    menu: string;
    why: string;
    rooms: string;
    amenities: string;
    location: string;
    faq: string;
    contact: string;
  };
  langSwitch: { label: string };
  /** Shown only on pages in another language, written in this language (ADR-014 3.2). */
  langSuggest: { region: string; text: string; close: string };
  /**
   * The two actions of the page (concept 3.3): Plan your stay (primary, INV 24/10 – key name kept from "Request to
   * book") and Chat on Zalo (secondary).
   */
  actions: { requestToBook: string; chatOnZalo: string; chatOnPrefix: string; newTab: string };
  /** Alt text per photo id (falls back to the photo manifest). */
  photoAlt: Readonly<Record<string, string>>;
  hero: { label: string; lead: string };
  /** Hero slideshow (R3-Q52): region name, slide names, dot and pause/play labels (screen readers only). */
  carousel: {
    roledescription: string;
    label: string;
    track: string;
    slideRole: string;
    slide: (i: number, n: number) => string;
    goTo: (i: number, n: number) => string;
    pause: string;
    play: string;
  };
  /** Room photo gallery (R3-Q52, OTA style): button on the room card and the full-screen viewer. */
  gallery: {
    open: (n: number) => string;
    dialogLabel: (room: string) => string;
    track: string;
    close: string;
    prev: string;
    next: string;
    /** Screen-reader counter; lightbox.ts fills "{i}" in the copy rendered with i = "{i}". */
    counter: (i: number | string, n: number) => string;
  };
  why: {
    label: string;
    title: string;
    intro: string;
    short: { photo: string; label: string; title: string; body: string };
    long: { photo: string; label: string; title: string; body: string };
    /** Text link to #rooms under the two cards (CPY concept B 3, funnel). */
    more: string;
  };
  rooms: {
    label: string;
    title: string;
    intro: string;
    /**
     * "Rates from" line under the intro, above the room grid (FB-INV-004 F9, BR-114; CPY fallback 2.3 – in the hero
     * it pushed the two buttons below the first screen at 375 px). `price` = site.json booking.fromNightlyVnd already
     * formatted with its unit (lib/price.ts). The copy never writes a number or a unit itself.
     */
    from: (price: string) => string;
    /** Conditions right under it (BR-114 (2)): `weekend` = booking.fromWeekendNightlyVnd, formatted. */
    fromTerms: (weekend: string) => string;
    request: string;
    sleeps: (min: number, max: number) => string;
    items: readonly Room[];
    note: string;
  };
  amenities: {
    label: string;
    title: string;
    intro: string;
    groups: readonly { title: string; body: string }[];
  };
  location: {
    label: string;
    title: string;
    intro: string;
    maps: string;
    copy: string;
    copied: string;
    copyFailed: string;
    caption: string;
    head: { place: string; distance: string; time: string };
    rows: readonly { place: string; distance: string; time: string }[];
    note: string;
    /** Text link to #book after the drive times (CPY concept B 3, funnel). */
    ask: string;
  };
  book: {
    label: string;
    title: string;
    intro: string;
    steps: readonly [Step, Step, Step];
    reassure: string;
    /** Block shown while the form is off (concept 5.5 `chat`): booking goes to Zalo or a call. */
    chat: { title: string; text: string; call: string };
    form: FormCopy;
  };
  faq: {
    label: string;
    title: string;
    /** `deposit`: the first paragraph ends with the bank-details sentence (depositAccount). */
    items: readonly { id?: string; q: string; a: readonly string[]; deposit?: boolean }[];
    /**
     * Bank-details sentence of the anti-impersonation answer (SEC UXD-06). Names the deposit account holder when
     * site.json has it (ESC-008); without it, the v1.1 wording "we never change bank details by message".
     */
    depositAccount: (holder: string) => string;
  };
  contact: {
    label: string;
    title: string;
    intro: string;
    facebookLink: string;
    /** Pre-filled subject of the email link (US-151 AC1). */
    mailSubject: string;
    otherChannels: string;
    otherText: string;
    privacy: string;
  };
  footer: {
    backToTop: string;
    links: string;
    place: string;
    privacy: string;
    /** Legal line (INV 22/10): operator name, tax code and registered address come from site.json `legal`. */
    operator: string;
    taxCode: string;
  };
  sticky: { label: string };
  notFound: { title: string; heading: string; body: string; back: string };
}
