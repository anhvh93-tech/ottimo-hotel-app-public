// Russian run-time strings of the booking form – CPY rounds/round-04/outputs/CPY/lp-v2-copy.md sections 2.2 and 4
// (01/11/2026). Plural forms by Intl.PluralRules('ru') (UXD lp-v2 1.5, CPY 4.2): 1 ночь · 3 ночи · 5 ночей · 21 ночь.
// Hotline in sentences = the international number (CPY 1.3). Native-speaker review pending (SEC D4).
import type { BookingStrings } from './types';

const rules = new Intl.PluralRules('ru');
/** one / few / many (CPY 4.2 plural): 1, 21 → one; 2–4, 22–24 → few; 0, 5–20, 11–14 → many. */
export function plural(n: number, one: string, few: string, many: string): string {
  const r = rules.select(n);
  return r === 'one' ? one : r === 'few' ? few : many;
}
/** Genitive after "в течение" (CPY 4.2 gen): 1, 21 → singular; everything else → plural. */
export function gen(n: number, sg: string, pl: string): string {
  return rules.select(n) === 'one' ? sg : pl;
}

// U+00A0: the number never leaves its word (CPY 13.5, FB-R4-UXD-FE-04)
const nights = (n: number) => `${n}\u00a0${plural(n, 'ночь', 'ночи', 'ночей')}`;
const dur = (m: number) =>
  m % 60 === 0 ? `${m / 60} ${gen(m / 60, 'часа', 'часов')}` : `${m} ${gen(m, 'минуты', 'минут')}`;

const strings: BookingStrings = {
  // phone: genitive – used only in e.phone ("номер телефона")
  chName: { zalo: 'Zalo', whatsapp: 'WhatsApp', phone: 'телефона' },
  thanks: (name) => `Спасибо, ${name}. Это запрос, а не бронирование.`,
  next: {
    zalo: 'Чтобы получить ответ быстрее, откройте Zalo и пришлите нам этот номер.',
    whatsapp: 'Мы напишем вам в WhatsApp.',
    phone: 'Мы вам позвоним.',
    email: 'Мы ответим по электронной почте.',
  },
  when: {
    withinMinutes: (m, open, close) =>
      `Мы ответим в течение ${dur(m)} (${open}–${close} по времени Далата).`,
    nextMorning: (by, open) => `Ресепшн открывается в ${open}. Мы ответим до ${by}.`,
    callNow: (m) =>
      `Вы приезжаете сегодня вечером, поэтому мы свяжемся с вами в течение ${m} ${gen(m, 'минуты', 'минут')}.`,
  },
  fallback: [
    'Если до ',
    ' мы с вами не связались, позвоните по номеру ',
    ' или напишите в Zalo, указав этот номер.',
  ],
  nights,
  roomHint: (lo, hi) =>
    lo
      ? `Гостей: ${lo}–${hi}. Большее число — с ещё одним гостем (на диване или, в Premium, на дополнительной кровати 1,4 м); это учтено в предложении.`
      : 'Мы подберём номер для вашей компании.',
  longHint: (n) => `${nights(n)}. Мы предложим цену для долгого проживания.`,
  summary: (n) => `Проверьте ${n} ${plural(n, 'поле', 'поля', 'полей')}`,
  e: {
    inReq: 'Выберите дату заезда.',
    outReq: 'Выберите дату выезда.',
    arrReq: 'Выберите дату заезда.',
    range: (max) => `Выберите дату с сегодняшнего дня по ${max}.`,
    order: 'Дата выезда должна быть позже даты заезда.',
    cap: (n) =>
      `В этом номере могут жить до ${n} гостей (дети до 6 лет не учитываются). Выберите номер побольше или «Любой, на ваш выбор».`,
    name: 'Укажите ваше имя.',
    phone: (c) => `Укажите номер ${c}, по которому с вами можно связаться.`,
    email: 'Укажите email в формате name@example.com.',
    card: 'Пожалуйста, удалите номер карты из комментария.',
    consent: 'Отметьте согласие, чтобы мы могли ответить.',
    idNumber: 'На этом этапе номер документа не нужен. Пожалуйста, удалите его.',
    phoneCountry: 'Проверьте номер. Номера за пределами Вьетнама начинаются с + и кода страны.',
    server: 'Проверьте это поле.',
  },
  net: {
    network:
      'Не удалось отправить запрос. Проверьте подключение и попробуйте ещё раз или напишите нам в Zalo.',
    busy: 'Сейчас у нас много запросов. Напишите нам в Zalo или позвоните по номеру +84 84 444 0909.',
    rate: 'С этого подключения отправлено слишком много запросов. Попробуйте позже или напишите нам в Zalo.',
  },
  notReady: [
    'Онлайн-запросы сейчас временно не принимаются. Напишите нам в ',
    ' или позвоните по номеру ',
    '. Мы ответим как можно скорее.',
  ],
  reload: 'Страница обновилась. Перезагрузите её и отправьте запрос ещё раз.',
  sending: 'Отправляем…',
  notSent: 'Предпросмотр: запрос не отправлен. Напишите нам в Zalo.',
  estimate: {
    label: 'Ориентировочная цена',
    // CPY lp-v2-copy 14.1 (BUG-R4-003); after «для» only two forms – gen(), not plural()
    final: 'Это ещё не бронирование. Итоговую цену и наличие подтвердим в предложении.',
    guests: (n) => `Для ${n}\u00a0${gen(n, 'гостя', 'гостей')}.`,
    prompt: 'Выберите номер и даты, чтобы увидеть ориентировочную цену.',
    anyRoom:
      'Выберите номер, чтобы увидеть цену, или доверьте выбор нам — мы предложим вариант в ответе.',
    loading: 'Считаем цену…',
    total: (amount, n) => `${amount} за ${n}`,
    perNight: (amount) => `В среднем около ${amount} за ночь`,
    longStay: 'С учётом цены для долгого проживания.',
    unavailable: 'Для этих дат онлайн-оценки нет. Мы укажем цену в предложении.',
    error: 'Не удалось загрузить оценку. Цену мы укажем в предложении.',
    currency: 'Цены во вьетнамских донгах (VND).',
    taxIn: 'Налоги включены.',
    taxOut: 'Без учёта налогов.',
    extraGuest: 'С учётом ещё одного гостя.',
    sentWith: 'Эта оценка придёт к нам вместе с запросом.',
    live: (amount, n) => `Ориентировочная цена обновлена: ${amount} за ${n}`,
    done: 'Ориентировочная цена',
    // CPY lp-v2-copy 13.3 (Lượt 3, 01/11): minimum stay, status line when the estimate goes away
    minStay: (n) =>
      `На эти даты минимальный срок проживания — ${nights(n)}. Выберите больше ночей, чтобы увидеть ориентировочную цену, или отправьте запрос как есть: мы предложим варианты.`,
    liveCleared: 'Ориентировочная цена сброшена.',
  },
  // ESC-043 (INV 01/11): by the month or from the BR-108 threshold (30 nights) – no figure (CPY lp-v2-copy 12.1)
  priceMonthlyOffer: {
    label: 'Особое предложение для долгого проживания',
    text: 'Для проживания от месяца мы подготовим цену под ваши даты — она будет в предложении, которое мы пришлём.',
    // CPY lp-v2-copy 13.2: spoken line of the offer (zh full stop "。", no digit)
    live: 'Особое предложение для долгого проживания. Для проживания от месяца мы подготовим цену под ваши даты — она будет в предложении, которое мы пришлём.',
  },
};

export default strings;
