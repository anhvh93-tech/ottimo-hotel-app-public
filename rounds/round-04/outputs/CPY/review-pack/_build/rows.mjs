// Builds the review rows (EN source + one target language) from lp-v2 copy sources. Read-only.
import site from './content/site.json' with { type: 'json' };

export const LANG_NAME = { en: 'English', vi: 'Tiếng Việt', ko: '한국어', zh: '简体中文', ru: 'Русский' };
const INTL = ['ko', 'zh', 'ru'];

export async function load(lang) {
  const C = (await import(`./content/${lang}.ts`))[lang];
  const B = (await import(`./bs/${lang}.ts`)).default;
  const phone = INTL.includes(lang) ? site.phone.international : site.phone.local;
  return { C, B, phone, lang };
}

const strip = (s) => String(s).replace(/\[\[|\]\]/g, '');

// Row spec: [section, key, where, getter(ctx) -> string | null, flags]
// flags: { sr: screen reader only, legal: meaning fixed by lawyer, plural: number test, note: extra note }
export function spec(en) {
  const S = [];
  const add = (sec, key, where, get, flags = {}) => S.push({ sec, key, where, get, flags });
  const sec = {
    meta: 'Browser tab and search results',
    head: 'Header, menu and language',
    act: 'Main buttons',
    hero: 'Hero and photo slideshow',
    why: 'The Stay',
    rooms: 'Rooms',
    amen: 'Amenities',
    loc: 'Location',
    book: 'Book direct (section text)',
    form: 'Form "Plan your stay": labels and hints',
    err: 'Form: checking the answers',
    est: 'Form: estimated rate',
    sent: 'Form: sending and confirmation',
    faq: 'FAQ',
    foot: 'Contact and footer',
    alt: 'Photo descriptions (read aloud by screen readers)',
    nf: 'Page not found (404)',
  };

  add(sec.meta, 'meta.title', 'Browser tab title and search result title (60 characters at most)', (x) => x.C.meta.title);
  add(sec.meta, 'meta.description', 'Search result description (160 characters at most)', (x) => x.C.meta.description);
  add(sec.meta, 'meta.ogImageAlt', 'Description of the preview image when the link is shared', (x) => x.C.meta.ogImageAlt);

  add(sec.head, 'skip', 'Skip link for keyboard users', (x) => x.C.skip, { sr: true });
  for (const k of ['why', 'rooms', 'amenities', 'location', 'faq', 'contact'])
    add(sec.head, `nav.${k}`, 'Menu item', (x) => x.C.nav[k]);
  add(sec.head, 'nav.menu', 'Menu button on phones', (x) => x.C.nav.menu);
  add(sec.head, 'nav.label', 'Name of the main menu', (x) => x.C.nav.label, { sr: true });
  add(sec.head, 'nav.mobileLabel', 'Name of the phone menu', (x) => x.C.nav.mobileLabel, { sr: true });
  add(sec.head, 'langSwitch.label', 'Language switcher button', (x) => x.C.langSwitch.label);
  add(sec.head, 'LANG_NAME', 'Language list in the switcher. Each name is written in its own language and is the same on every page', () => Object.values(LANG_NAME).join(' · '), { note: 'Not translated. Please check only the name of your language.' });
  add(sec.head, 'langSuggest.text', 'Small bar offering this language to visitors whose browser uses it, when they land on a page in another language', (x) => x.C.langSuggest.text);
  add(sec.head, 'langSuggest.close', 'Close button of that bar', (x) => x.C.langSuggest.close);
  add(sec.head, 'langSuggest.region', 'Name of that bar', (x) => x.C.langSuggest.region, { sr: true });

  add(sec.act, 'actions.requestToBook', 'Main button (header, top of page, phone bottom bar)', (x) => x.C.actions.requestToBook);
  add(sec.act, 'actions.chatOnZalo', 'Second button', (x) => x.C.actions.chatOnZalo);
  add(sec.act, 'actions.chatOnPrefix+Suffix', 'Phone bottom bar. On screens narrower than 360 px only "Zalo" is shown', (x) => `${x.C.actions.chatOnPrefix}Zalo${x.C.actions.chatOnSuffix ?? ''}`);
  add(sec.act, 'actions.newTab', 'Added after links that open in a new tab (example with the Facebook link)', (x) => `${x.C.contact.facebookLink}${x.C.actions.newTab}`, { sr: true });
  add(sec.act, 'sticky.label', 'Name of the phone bottom bar', (x) => x.C.sticky.label, { sr: true });

  add(sec.hero, 'site.tagline', 'Main heading (H1). Stays in English on every page by brand choice', () => site.tagline, { note: 'Not translated on purpose.' });
  add(sec.hero, 'hero.label', 'Small line above the main heading', (x) => x.C.hero.label);
  add(sec.hero, 'hero.lead', 'Line under the main heading', (x) => x.C.hero.lead);
  add(sec.hero, 'carousel.label', 'Name of the slideshow', (x) => x.C.carousel.label, { sr: true });
  add(sec.hero, 'carousel.roledescription', 'Type of element announced', (x) => x.C.carousel.roledescription, { sr: true });
  add(sec.hero, 'carousel.slideRole', 'Type of each slide announced', (x) => x.C.carousel.slideRole, { sr: true });
  add(sec.hero, 'carousel.track', 'Instruction for keyboard users', (x) => x.C.carousel.track, { sr: true });
  add(sec.hero, 'carousel.slide(1,6)', 'Slide position (example: slide 1 of 6)', (x) => x.C.carousel.slide(1, 6), { sr: true });
  add(sec.hero, 'carousel.goTo(1,6)', 'Dot buttons under the slideshow (example: photo 1 of 6)', (x) => x.C.carousel.goTo(1, 6), { sr: true });
  add(sec.hero, 'carousel.pause', 'Pause button', (x) => x.C.carousel.pause, { sr: true });
  add(sec.hero, 'carousel.play', 'Play button', (x) => x.C.carousel.play, { sr: true });

  add(sec.why, 'why.label', 'Small label above the section title', (x) => x.C.why.label);
  add(sec.why, 'why.title', 'Section title (core brand line)', (x) => x.C.why.title);
  add(sec.why, 'why.intro', 'Section intro', (x) => x.C.why.intro);
  for (const k of ['short', 'long']) {
    const name = k === 'short' ? 'Card 1 (short stays)' : 'Card 2 (long stays)';
    add(sec.why, `why.${k}.label`, `${name}: small label`, (x) => x.C.why[k].label);
    add(sec.why, `why.${k}.title`, `${name}: title`, (x) => x.C.why[k].title);
    add(sec.why, `why.${k}.body`, `${name}: text`, (x) => x.C.why[k].body);
  }
  add(sec.why, 'why.more', 'Text link under the cards', (x) => x.C.why.more);

  add(sec.rooms, 'rooms.label', 'Small label above the section title', (x) => x.C.rooms.label);
  add(sec.rooms, 'rooms.title', 'Section title', (x) => x.C.rooms.title);
  add(sec.rooms, 'rooms.intro', 'Section intro', (x) => x.C.rooms.intro);
  en.C.rooms.items.forEach((r, i) => {
    const n = `Room card ${i + 1} (${r.name})`;
    add(sec.rooms, `rooms.items.${i}.name`, `${n}: room name`, (x) => x.C.rooms.items[i].name);
    add(sec.rooms, `rooms.items.${i}.altName`, `${n}: room name in a second language, shown small under the name`, (x) => x.C.rooms.items[i].altName.text);
    add(sec.rooms, `rooms.items.${i}.facts`, `${n}: size · view · guests`, (x) => {
      const it = x.C.rooms.items[i];
      return `${strip(it.size)} · ${it.view} · ${x.C.rooms.sleeps(it.sleeps[0], it.sleeps[1])}`;
    });
    add(sec.rooms, `rooms.items.${i}.desc`, `${n}: description`, (x) => x.C.rooms.items[i].desc);
    add(sec.rooms, `rooms.items.${i}.shortName`, `${n}: short name in the form's room list`, (x) => x.C.rooms.items[i].shortName);
  });
  add(sec.rooms, 'rooms.request', 'Link on each room card', (x) => x.C.rooms.request);
  add(sec.rooms, 'rooms.note', 'Note under the room cards', (x) => x.C.rooms.note);
  add(sec.rooms, 'gallery.open(6)', 'Photo button on a room card (example: 6 photos)', (x) => x.C.gallery.open(6));
  add(sec.rooms, 'gallery.open(2)', 'Same button, 2 photos (plural check)', (x) => x.C.gallery.open(2), { plural: true });
  add(sec.rooms, 'gallery.dialogLabel', 'Name of the full-screen photo viewer (example with the first room)', (x) => x.C.gallery.dialogLabel(x.C.rooms.items[0].name), { sr: true });
  add(sec.rooms, 'gallery.counter(2,6)', 'Photo position in the viewer (example: photo 2 of 6)', (x) => x.C.gallery.counter(2, 6), { sr: true });
  add(sec.rooms, 'gallery.track', 'Instruction for keyboard users in the viewer', (x) => x.C.gallery.track, { sr: true });
  add(sec.rooms, 'gallery.prev', 'Viewer: previous button', (x) => x.C.gallery.prev);
  add(sec.rooms, 'gallery.next', 'Viewer: next button', (x) => x.C.gallery.next);
  add(sec.rooms, 'gallery.close', 'Viewer: close button', (x) => x.C.gallery.close);

  add(sec.amen, 'amenities.label', 'Small label above the section title', (x) => x.C.amenities.label);
  add(sec.amen, 'amenities.title', 'Section title (core brand line)', (x) => x.C.amenities.title);
  add(sec.amen, 'amenities.intro', 'Section intro', (x) => x.C.amenities.intro);
  en.C.amenities.groups.forEach((g, i) => {
    add(sec.amen, `amenities.groups.${i}.title`, `Group ${i + 1}: title`, (x) => x.C.amenities.groups[i].title);
    add(sec.amen, `amenities.groups.${i}.body`, `Group ${i + 1}: text`, (x) => x.C.amenities.groups[i].body);
  });

  add(sec.loc, 'location.label', 'Small label above the section title', (x) => x.C.location.label);
  add(sec.loc, 'location.title', 'Section title', (x) => x.C.location.title);
  add(sec.loc, 'location.intro', 'Section intro', (x) => x.C.location.intro);
  add(sec.loc, 'location.maps', 'Button under the map', (x) => x.C.location.maps);
  add(sec.loc, 'location.copy', 'Button next to the address', (x) => x.C.location.copy);
  add(sec.loc, 'location.copied', 'Message after copying', (x) => x.C.location.copied);
  add(sec.loc, 'location.copyFailed', 'Message when copying fails', (x) => x.C.location.copyFailed);
  add(sec.loc, 'location.caption', 'Title of the drive-time table', (x) => x.C.location.caption);
  add(sec.loc, 'location.head', 'Table column headings', (x) => `${x.C.location.head.place} · ${x.C.location.head.distance} · ${x.C.location.head.time}`);
  en.C.location.rows.forEach((r, i) => {
    add(sec.loc, `location.rows.${i}`, `Table row ${i + 1}: place · distance · time`, (x) => {
      const rr = x.C.location.rows[i];
      return `${rr.place} · ${rr.distance} · ${rr.time}`;
    });
  });
  add(sec.loc, 'location.note', 'Note under the table', (x) => x.C.location.note);
  add(sec.loc, 'location.ask', 'Text link after the table', (x) => x.C.location.ask);

  add(sec.book, 'book.label', 'Small label above the section title', (x) => x.C.book.label);
  add(sec.book, 'book.title', 'Section title', (x) => x.C.book.title);
  add(sec.book, 'book.intro', 'Section intro', (x) => x.C.book.intro);
  [0, 1, 2].forEach((i) => {
    add(sec.book, `book.steps.${i}.title`, `Step ${i + 1}: title`, (x) => x.C.book.steps[i].title);
    add(sec.book, `book.steps.${i}.text`, `Step ${i + 1}: text`, (x) => x.C.book.steps[i].text);
  });
  add(sec.book, 'book.reassure', 'Line under the steps', (x) => x.C.book.reassure);
  add(sec.book, 'book.chat.title', 'Box shown only while online requests are switched off: title', (x) => x.C.book.chat.title);
  add(sec.book, 'book.chat.text', 'Same box: text', (x) => x.C.book.chat.text);
  add(sec.book, 'book.chat.call', 'Same box: call button', (x) => x.C.book.chat.call);

  const F = (x) => x.C.book.form;
  add(sec.form, 'form.title', 'Form name', (x) => F(x).title, { sr: true });
  add(sec.form, 'form.yourStay', 'Group heading', (x) => F(x).yourStay);
  add(sec.form, 'form.lengthOfStay', 'Question above the two choices', (x) => F(x).lengthOfStay);
  add(sec.form, 'form.byNight', 'Choice 1', (x) => F(x).byNight);
  add(sec.form, 'form.byMonth', 'Choice 2', (x) => F(x).byMonth);
  add(sec.form, 'form.checkIn', 'Date field (by the night)', (x) => F(x).checkIn);
  add(sec.form, 'form.checkOut', 'Date field (by the night)', (x) => F(x).checkOut);
  add(sec.form, 'form.arrival', 'Date field (by the month)', (x) => F(x).arrival);
  en.C.book.form.months.forEach((m, i) => {
    add(sec.form, `form.months.${i}`, 'Length list (by the month)', (x) => F(x).months[i].label);
  });
  add(sec.form, 'form.adults', 'Guest field', (x) => F(x).adults);
  add(sec.form, 'form.ages6to11', 'Guest field', (x) => F(x).ages6to11);
  add(sec.form, 'form.under6', 'Guest field', (x) => F(x).under6);
  add(sec.form, 'form.roomType', 'Room list label', (x) => F(x).roomType);
  add(sec.form, 'form.anyRoom', 'First choice in the room list', (x) => F(x).anyRoom);
  add(sec.form, 'roomHint(2,3)', 'Hint under the room list once a room is chosen (example: sleeps 2–3)', (x) => x.B.roomHint('2', '3'));
  add(sec.form, 'roomHint(null)', 'Same hint when "Any room" is chosen', (x) => x.B.roomHint(null, null));
  for (const n of [30, 31, 32])
    add(sec.form, `longHint(${n})`, `Hint when the stay by the night is 30 nights or more (example: ${n})`, (x) => x.B.longHint(n), { plural: true });
  add(sec.form, 'form.reachYou', 'Group heading', (x) => F(x).reachYou);
  add(sec.form, 'form.yourName', 'Field', (x) => F(x).yourName);
  add(sec.form, 'form.replyOn', 'Question above the reply channels (Zalo, WhatsApp, phone call, email)', (x) => F(x).replyOn);
  add(sec.form, 'form.phoneCall', 'Reply channel choice', (x) => F(x).phoneCall);
  add(sec.form, 'form.phoneNumber', 'Field', (x) => F(x).phoneNumber);
  add(sec.form, 'form.phoneHint', 'Hint under the phone field', (x) => F(x).phoneHint);
  add(sec.form, 'form.note', 'Message field', (x) => F(x).note);
  add(sec.form, 'form.optional', 'Added after optional fields', (x) => F(x).optional);
  add(sec.form, 'form.noteHint', 'Hint under the message field', (x) => F(x).noteHint);
  add(sec.form, 'form.noteLang', 'Second hint under the message field. Only on the Korean, Chinese and Russian pages, so the English is a gloss', (x) => F(x).noteLang ?? (x.lang === 'en' ? 'You may write in your own language. A line in English helps us reply sooner.' : '–'));
  add(sec.form, 'form.honeypot', 'Hidden field that only spam robots see', (x) => F(x).honeypot, { sr: true });
  add(sec.form, 'form.consent', 'Tick box before sending', (x) => F(x).consent, { legal: true });
  add(sec.form, 'form.consentMore', 'Small text under the tick box', (x) => F(x).consentMore, { legal: true });
  add(sec.form, 'form.privacy', 'Link to the privacy notice under the tick box', (x) => F(x).privacy);
  add(sec.form, 'form.submit', 'Send button', (x) => F(x).submit);
  add(sec.form, 'form.noJs', 'Shown when the browser has JavaScript off, followed by a Zalo link', (x) => `${F(x).noJs}Zalo`);

  for (const n of [1, 2, 5])
    add(sec.err, `summary(${n})`, `Message above the form when fields need attention (example: ${n})`, (x) => x.B.summary(n), { plural: true });
  const E = (x) => x.B.e;
  add(sec.err, 'e.inReq', 'Under the check-in field', (x) => E(x).inReq);
  add(sec.err, 'e.outReq', 'Under the check-out field', (x) => E(x).outReq);
  add(sec.err, 'e.arrReq', 'Under the arrival field', (x) => E(x).arrReq);
  add(sec.err, 'e.range', 'Date outside the allowed range. {date} = the last date a guest can choose', (x) => E(x).range('{date}'));
  add(sec.err, 'e.order', 'Check-out before check-in', (x) => E(x).order);
  add(sec.err, 'e.cap(3)', 'Too many guests for the room (example: up to 3)', (x) => E(x).cap('3'));
  add(sec.err, 'e.name', 'Under the name field', (x) => E(x).name);
  for (const ch of ['zalo', 'whatsapp', 'phone'])
    add(sec.err, `e.phone(${ch})`, `Under the phone field when "${ch === 'phone' ? 'Phone call' : ch === 'zalo' ? 'Zalo' : 'WhatsApp'}" is chosen`, (x) => E(x).phone(x.B.chName[ch]));
  add(sec.err, 'e.email', 'Under the email field', (x) => E(x).email);
  add(sec.err, 'e.card', 'Card number found in the message', (x) => E(x).card);
  add(sec.err, 'e.idNumber', 'ID number found in the message', (x) => E(x).idNumber);
  add(sec.err, 'e.consent', 'Tick box not ticked', (x) => E(x).consent);
  add(sec.err, 'e.phoneCountry', 'Phone number the server could not accept', (x) => E(x).phoneCountry);
  add(sec.err, 'e.server', 'Any other field the server could not accept', (x) => E(x).server);

  const X = (x) => x.B.estimate;
  add(sec.est, 'estimate.label', 'Title of the rate box', (x) => X(x).label);
  add(sec.est, 'estimate.prompt', 'Before a room and dates are chosen', (x) => X(x).prompt);
  add(sec.est, 'estimate.anyRoom', 'When "Any room" is chosen', (x) => X(x).anyRoom);
  add(sec.est, 'estimate.loading', 'While the rate loads', (x) => X(x).loading);
  for (const n of [1, 3])
    add(sec.est, `estimate.total({amount}, ${n})`, `Main line. {amount} = the amount in VND, shown large (example: ${n} night${n > 1 ? 's' : ''})`, (x) => X(x).total('{amount}', x.B.nights(n)));
  for (const n of [1, 2, 5, 21])
    add(sec.est, `nights(${n})`, 'Number of nights, used in the main line', (x) => x.B.nights(n), { plural: true });
  for (const n of [1, 2, 5])
    add(sec.est, `estimate.guests(${n})`, 'First sentence of the note under the amount', (x) => X(x).guests(n), { plural: true });
  add(sec.est, 'estimate.final', 'Always under the amount', (x) => X(x).final);
  add(sec.est, 'estimate.currency', 'Note under the amount', (x) => X(x).currency);
  add(sec.est, 'estimate.taxIn', 'Note under the amount', (x) => X(x).taxIn);
  add(sec.est, 'estimate.taxOut', 'Note under the amount (if rates were before taxes)', (x) => X(x).taxOut);
  add(sec.est, 'estimate.extraGuest', 'Note when one more guest is included', (x) => X(x).extraGuest);
  add(sec.est, 'estimate.longStay', 'Note when a longer-stay rate applies', (x) => X(x).longStay);
  for (const n of [1, 2, 5])
    add(sec.est, `estimate.minStay(${n})`, 'When the dates are shorter than the minimum stay', (x) => X(x).minStay(n), { plural: true });
  add(sec.est, 'estimate.unavailable', 'No online rate for these dates', (x) => X(x).unavailable);
  add(sec.est, 'estimate.error', 'The rate could not load', (x) => X(x).error);
  add(sec.est, 'priceMonthlyOffer.label', 'Box title by the month, or from 30 nights (no amount shown)', (x) => x.B.priceMonthlyOffer.label);
  add(sec.est, 'priceMonthlyOffer.text', 'Box text in the same case', (x) => x.B.priceMonthlyOffer.text);
  add(sec.est, 'estimate.sentWith', 'Under the send button while an amount is shown', (x) => X(x).sentWith);
  add(sec.est, 'estimate.done', 'Confirmation screen, next to the request number', (x) => X(x).done);
  add(sec.est, 'estimate.live', 'Announced when the amount changes', (x) => X(x).live('{amount}', x.B.nights(3)), { sr: true });
  add(sec.est, 'estimate.liveCleared', 'Announced when the amount goes away', (x) => X(x).liveCleared, { sr: true });
  add(sec.est, 'priceMonthlyOffer.live', 'Announced for the long-stay box', (x) => x.B.priceMonthlyOffer.live, { sr: true });

  add(sec.sent, 'sending', 'Send button while sending', (x) => x.B.sending);
  add(sec.sent, 'form.done.title', 'Confirmation screen: title', (x) => F(x).done.title);
  add(sec.sent, 'thanks({name})', 'Confirmation screen: first line. {name} = the name the guest typed', (x) => x.B.thanks('{name}'));
  add(sec.sent, 'form.done.requestNumber', 'Confirmation screen: label of the request number', (x) => F(x).done.requestNumber);
  for (const k of ['zalo', 'whatsapp', 'phone', 'email'])
    add(sec.sent, `next.${k}`, `Confirmation screen: next step when the guest chose ${k === 'phone' ? 'a phone call' : k}`, (x) => x.B.next[k]);
  add(sec.sent, 'when.withinMinutes(60)', 'Reply promise during reception hours', (x) => x.B.when.withinMinutes(60, '07:00', '22:00'));
  add(sec.sent, 'when.nextMorning', 'Reply promise outside reception hours', (x) => x.B.when.nextMorning('09:00', '07:00'));
  add(sec.sent, 'when.callNow(60)', 'Reply promise when arriving tonight', (x) => x.B.when.callNow(60));
  add(sec.sent, 'fallback', 'Confirmation screen: last line. {time} = the reply deadline', (x) => `${x.B.fallback[0]}{time}${x.B.fallback[1]}${x.phone}${x.B.fallback[2]}`);
  add(sec.sent, 'form.done.tonight', 'Confirmation screen when arriving tonight, followed by the phone number', (x) => `${F(x).done.tonight}${x.phone}`);
  add(sec.sent, 'form.done.openZalo', 'Confirmation screen: button', (x) => F(x).done.openZalo);
  add(sec.sent, 'form.done.again', 'Confirmation screen: link', (x) => F(x).done.again);
  add(sec.sent, 'net.network', 'Sending failed (connection)', (x) => x.B.net.network);
  add(sec.sent, 'net.busy', 'Sending failed (server busy)', (x) => x.B.net.busy);
  add(sec.sent, 'net.rate', 'Sending failed (too many requests)', (x) => x.B.net.rate);
  add(sec.sent, 'notReady', 'Online requests paused (Zalo and the phone number are links)', (x) => `${x.B.notReady[0]}Zalo${x.B.notReady[1]}${x.phone}${x.B.notReady[2]}`);
  add(sec.sent, 'reload', 'The privacy notice changed while the page was open', (x) => x.B.reload);
  add(sec.sent, 'chName', 'Channel names used inside messages (Russian: genitive form for the phone)', (x) => Object.values(x.B.chName).join(' · '));

  add(sec.faq, 'faq.label', 'Small label above the section title', (x) => x.C.faq.label);
  add(sec.faq, 'faq.title', 'Section title', (x) => x.C.faq.title);
  en.C.faq.items.forEach((it, i) => {
    const legal = it.id === 'faq-real';
    add(sec.faq, `faq.items.${i}.q`, `Question ${i + 1}`, (x) => x.C.faq.items[i].q, { legal });
    it.a.forEach((_, j) => {
      add(sec.faq, `faq.items.${i}.a.${j}`, `Answer ${i + 1}, paragraph ${j + 1}`, (x) => x.C.faq.items[i].a[j], { legal });
    });
    if (it.deposit) {
      add(sec.faq, 'faq.depositAccount("")', `Answer ${i + 1}: sentence added to paragraph 1 (as on the page today)`, (x) => x.C.faq.depositAccount(''), { legal: true });
      add(sec.faq, 'faq.depositAccount(holder)', `Same sentence once the account holder is named (not on the page yet). {holder} = company name`, (x) => x.C.faq.depositAccount('{holder}'), { legal: true });
    }
  });

  add(sec.foot, 'contact.label', 'Small label above the section title', (x) => x.C.contact.label);
  add(sec.foot, 'contact.title', 'Section title', (x) => x.C.contact.title);
  add(sec.foot, 'contact.intro', 'Section intro', (x) => x.C.contact.intro);
  add(sec.foot, 'contact.facebookLink', 'Link', (x) => x.C.contact.facebookLink);
  add(sec.foot, 'contact.otherChannels', 'Small heading', (x) => x.C.contact.otherChannels);
  add(sec.foot, 'contact.otherText', 'Line under it, followed by the phone number', (x) => `${x.C.contact.otherText} ${x.phone}`);
  add(sec.foot, 'contact.privacy', 'Small note at the end of the section', (x) => x.C.contact.privacy);
  add(sec.foot, 'contact.mailSubject', 'Subject of the email when the guest taps the email link', (x) => x.C.contact.mailSubject);
  add(sec.foot, 'footer.backToTop', 'Footer logo link', (x) => `OTTIMO${x.C.footer.backToTop}`, { sr: true });
  add(sec.foot, 'footer.links', 'Name of the footer link row', (x) => x.C.footer.links, { sr: true });
  add(sec.foot, 'footer.place', 'Footer', (x) => x.C.footer.place);
  add(sec.foot, 'footer.privacy', 'Footer link', (x) => x.C.footer.privacy);
  add(sec.foot, 'footer.operator', 'Footer legal line (company name is not translated)', (x) => `${x.C.footer.operator} ${site.legal.name}`);
  add(sec.foot, 'footer.taxCode', 'Footer legal line', (x) => `${x.C.footer.taxCode} ${site.legal.taxCode}`);

  for (const k of Object.keys(en.C.photoAlt))
    add(sec.alt, `photoAlt.${k}`, `Photo "${k}"`, (x) => x.C.photoAlt[k], { sr: true });

  add(sec.nf, 'notFound.title', 'Browser tab title', (x) => x.C.notFound.title);
  add(sec.nf, 'notFound.heading', 'Heading', (x) => x.C.notFound.heading);
  add(sec.nf, 'notFound.body', 'Text', (x) => x.C.notFound.body);
  add(sec.nf, 'notFound.back', 'Button', (x) => x.C.notFound.back);
  return S;
}

export async function buildRows(lang) {
  const en = await load('en');
  const tr = await load(lang);
  const S = spec(en);
  return S.map((s, i) => ({
    n: i + 1,
    sec: s.sec,
    key: s.key,
    where: s.where,
    flags: s.flags,
    en: strip(s.get(en)),
    tr: strip(s.get(tr) ?? ''),
  }));
}
