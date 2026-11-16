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
    callNow: (m) => `As you move in tonight, we will contact you within ${m} minutes.`,
  },
  fallback: [
    'If you have not heard from us by ',
    ', call ',
    ' or message us on Zalo with this number.',
  ],
  roomHint: (lo, hi) =>
    lo
      ? `Sleeps ${lo}–${hi}. The higher number includes one more guest (sofa, or the 1.4 m extra bed in Premium), included in your quote.`
      : 'We suggest a room that suits your group.',
  summary: (n) => (n === 1 ? 'Please check 1 field' : `Please check ${n} fields`),
  e: {
    arrReq: 'Choose your move-in date.',
    // FB-INV-010 (CPY Dot 1 section 7): a number of months is required
    monthsReq: 'Choose how many months you plan to stay.',
    range: (max) => `Choose a date from today to ${max}.`,
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
    label: 'Monthly rate',
    // FB-INV-010 (CPY Dot 1 section 7): main line (same words as rooms.fromPrice), the note under it, and
    // the stay total for the months chosen (listed monthly rate × months – BE getPublicPriceEstimate longStay)
    fromMonth: (amount) => `From ${amount} / month`,
    note: 'Final rate confirmed when we contact you. Electricity and water billed on actual use.',
    total: (amount, months) => `For ${months}: from ${amount}`,
    // CPY Dot 1 section 7: no room held until the one-month deposit is received
    final: 'No room is held yet. Your room is confirmed once your deposit is received.',
    prompt: 'Choose a room to see its monthly rate.',
    anyRoom: 'Choose a room to see its monthly rate, or let us suggest one in your quote.',
    loading: 'Checking rates…',
    unavailable: 'No online rate for this room just now. We will include it in your quote.',
    error: 'We could not load the rate just now. Your quote will include it.',
    currency: 'Rates in Vietnamese dong (VND).',
    taxIn: 'Taxes included.',
    taxOut: 'Before taxes.',
    sentWith: 'This rate is sent with your request.',
    live: (amount) => `Monthly rate updated: from ${amount} a month`,
    done: 'Monthly rate',
    liveCleared: 'Monthly rate cleared.',
  },
};

export default strings;
