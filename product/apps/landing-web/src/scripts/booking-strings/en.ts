// English run-time strings of the booking form (concept 5.3–5.4). Estimate: CPY lp-v2-copy.md 2.1 (01/11/2026).
import type { BookingStrings } from './types';

const strings: BookingStrings = {
  chName: { zalo: 'Zalo', whatsapp: 'WhatsApp', phone: 'phone' },
  thanks: (name) => `Thank you, ${name}. This is a request, not yet a booking.`,
  next: {
    zalo: 'For the fastest reply, open Zalo and send us this number.',
    whatsapp: 'We will message you on WhatsApp.',
    phone: 'We will call you.',
    email: 'We will reply by email.',
  },
  when: {
    withinMinutes: (m, open, close) =>
      `We reply within ${m % 60 === 0 ? (m === 60 ? '1 hour' : `${m / 60} hours`) : `${m} minutes`} (${open}–${close}, Da Lat time).`,
    nextMorning: (by, open) => `Our reception opens at ${open}. We will reply before ${by}.`,
    callNow: (m) => `As you arrive tonight, we will contact you within ${m} minutes.`,
  },
  fallback: [
    'If you have not heard from us by ',
    ', call ',
    ' or message us on Zalo with this number.',
  ],
  nights: (n) => (n === 1 ? '1 night' : `${n} nights`),
  roomHint: (lo, hi) =>
    lo
      ? `Sleeps ${lo}–${hi}. The higher number includes one more guest (sofa, or the 1.4 m extra bed in Premium), included in your quote.`
      : 'We suggest a room that suits your group.',
  longHint: (n) => `${n} nights. We will quote our long-stay rate.`,
  summary: (n) => (n === 1 ? 'Please check 1 field' : `Please check ${n} fields`),
  e: {
    inReq: 'Choose your check-in date.',
    outReq: 'Choose your check-out date.',
    arrReq: 'Choose your arrival date.',
    range: (max) => `Choose a date from today to ${max}.`,
    order: 'Check-out must be after check-in.',
    cap: (n) =>
      `This room sleeps up to ${n} (children under 6 not counted). Choose a larger room, or "Any room".`,
    name: 'Tell us your name.',
    phone: (c) => `Enter a ${c} number we can reach.`,
    email: 'Enter an email like name@example.com.',
    card: 'Please remove card numbers from the note.',
    consent: 'Please tick the box so we can reply.',
    idNumber: 'No need to send ID numbers at this step. Please remove it.',
    phoneCountry:
      'Please check the number. Numbers outside Viet Nam start with + and the country code.',
    server: 'Please check this field.',
  },
  net: {
    network:
      'We could not send your request. Check your connection and try again, or chat with us on Zalo.',
    busy: 'We are receiving many requests right now. Please message us on Zalo or call 08.4444.0909.',
    rate: 'Too many requests from this connection. Please try again later, or chat with us on Zalo.',
  },
  notReady: [
    'Online requests are paused right now. Please message us on ',
    ' or call ',
    '. We will reply as soon as we can.',
  ],
  reload: 'This page has been updated. Please reload it and send your request again.',
  sending: 'Sending…',
  notSent: 'Preview: this request was not sent. Please chat with us on Zalo.',
  estimate: {
    label: 'Estimated rate',
    final: 'Your final rate is in the quote we send.',
    prompt: 'Choose a room and your dates to see an estimate.',
    anyRoom: 'Choose a room to see an estimate, or let us suggest one in your quote.',
    loading: 'Checking rates…',
    total: (amount, nights) => `${amount} for ${nights}`,
    perNight: (amount) => `About ${amount} a night`,
    longStay: 'Includes our longer-stay rate.',
    unavailable: 'No online estimate for these dates. We will include the rate in your quote.',
    error: 'We could not load an estimate just now. Your quote will include the rate.',
    currency: 'Rates in Vietnamese dong (VND).',
    taxIn: 'Taxes included.',
    taxOut: 'Before taxes.',
    extraGuest: 'Includes one more guest.',
    sentWith: 'This estimate is sent with your request.',
    live: (amount, nights) => `Estimated rate updated: ${amount} for ${nights}`,
    done: 'Estimated rate',
  },
  // ESC-043 (INV 01/11): by the month or 28+ nights – no figure (CPY lp-v2-copy 12.1)
  priceMonthlyOffer: {
    label: 'A special offer for longer stays',
    text: 'For a month or longer, we prepare a rate around your dates. You will find it in the quote we send.',
  },
};

export default strings;
