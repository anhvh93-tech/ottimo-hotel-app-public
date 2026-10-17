// Shape of the page copy. Every published language must fill every field (ADR-014 3.4): a missing string is a
// type error at `astro check`, and copy.test.ts checks that no field is empty.
import type { Lang } from '../lib/i18n';

/** Text in the other language, shown on purpose (brand: English leads, Vietnamese supports). */
export interface Foreign {
  lang: Lang;
  text: string;
}

export interface LinkText {
  text: string;
}

export interface Room {
  id: 'city' | 'garden' | 'premium' | 'signature';
  index: string;
  view: string;
  name: string;
  altName: Foreign;
  sleeps: string;
  size: string;
  viewValue: string;
  description: string;
  /** Room name used in the pre-filled chat message (EN page: WhatsApp text). */
  askName: string;
  photos: readonly [string, string, string];
}

export interface Copy {
  lang: Lang;
  meta: { title: string; description: string; ogImageAlt: string };
  skip: string;
  nav: {
    label: string;
    mobileLabel: string;
    menu: string;
    rooms: string;
    why: string;
    amenities: string;
    location: string;
    faq: string;
    book: string;
  };
  langSwitch: { label: string };
  /** Shown only on pages in another language, written in this language (ADR-014 3.2). */
  langSuggest: { region: string; text: string; close: string };
  hero: {
    label: string;
    lead: string;
    support: Foreign;
    book: string;
    viewRooms: string;
    facts: readonly string[];
  };
  stay: {
    region: string;
    fewNights: { title: string; body: string; link: string };
    longer: { title: string; body: string; link: string };
  };
  about: { label: string; title: string; body: string; aside: string; quote: string };
  rooms: {
    label: string;
    title: string;
    intro: string;
    specs: { sleeps: string; size: string; view: string };
    rate: string;
    ask: string;
    /** Channel of the "Ask about this room" button: WhatsApp with a pre-filled text (EN) or Zalo (VI). */
    askChannel: 'whatsapp' | 'zalo';
    askMessage: (roomName: string) => string;
    items: readonly Room[];
    names: { label: string; text: string };
  };
  why: {
    label: string;
    title: string;
    intro: string;
    points: readonly { title: string; text: string }[];
  };
  amenities: {
    label: string;
    title: string;
    items: readonly { title: string; text: string }[];
    note: string;
  };
  location: {
    label: string;
    title: string;
    sub: string;
    body: string;
    maps: string;
    newTab: string;
    copy: string;
    copied: string;
    copyFailed: string;
    caption: string;
    head: { place: string; distance: string; time: string };
    rows: readonly { place: string; distance: string; time: string }[];
    note: string;
  };
  faq: {
    label: string;
    title: string;
    items: readonly { id?: string; q: string; a: string }[];
  };
  contact: {
    label: string;
    title: string;
    intro: string;
    /** Card order: EN puts WhatsApp/Telegram/Viber first, VI puts Zalo first (ESC-020 L2-A). */
    order: readonly ('intl' | 'zalo' | 'mail')[];
    intl: { label: string; title: string; text: string };
    zalo: { label: string; title: string; text: string; chat: string; call: string };
    mail: { label: string; title: string; subject: string };
    privacy: string;
  };
  footer: {
    backToTop: string;
    visit: string;
    contact: string;
    hotline: string;
    place: string;
    privacy: string;
  };
  sticky: { label: string; call: string; first: 'whatsapp' | 'zalo' };
  notFound: { title: string; heading: string; body: string; back: string };
}
