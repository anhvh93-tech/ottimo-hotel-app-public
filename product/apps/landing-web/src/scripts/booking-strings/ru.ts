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
      `Вы заселяетесь сегодня вечером, поэтому мы свяжемся с вами в течение ${m} ${gen(m, 'минуты', 'минут')}.`,
  },
  fallback: [
    'Если до ',
    ' мы с вами не связались, позвоните по номеру ',
    ' или напишите в Zalo, указав этот номер.',
  ],
  roomHint: (lo, hi) =>
    lo
      ? `Гостей: ${lo}–${hi}. Большее число — с ещё одним гостем (на диване или, в Premium, на дополнительной кровати 1,4 м); это учтено в предложении.`
      : 'Мы подберём номер для вашей компании.',
  summary: (n) => `Проверьте ${n} ${plural(n, 'поле', 'поля', 'полей')}`,
  e: {
    arrReq: 'Выберите дату заезда.',
    // FB-INV-010 (CPY Dot 1 section 7): a number of months is required
    monthsReq: 'Укажите, на сколько месяцев планируете остаться.',
    range: (max) => `Выберите дату с сегодняшнего дня по ${max}.`,
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
    label: 'Цена за месяц',
    // FB-INV-010 (CPY Dot 1 section 7): main line (same words as rooms.fromPrice), the note under it, and
    // the stay total for the months chosen (listed monthly rate × months – BE getPublicPriceEstimate longStay)
    fromMonth: (amount) => `От ${amount} в\u00a0месяц`,
    note: 'Итоговую цену подтвердим, когда свяжемся с вами. Электричество и вода — по фактическому расходу.',
    total: (amount, months) => `За ${months}: от ${amount}`,
    final: 'Это ещё не бронирование. Номер закрепим за вами после получения депозита.',
    prompt: 'Выберите номер, чтобы увидеть цену за месяц.',
    anyRoom:
      'Выберите номер, чтобы увидеть цену за месяц, или доверьте выбор нам — мы предложим вариант в ответе.',
    loading: 'Считаем цену…',
    unavailable: 'Для этого номера сейчас нет онлайн-цены. Мы укажем её в предложении.',
    error: 'Не удалось загрузить цену. Мы укажем её в предложении.',
    currency: 'Цены во вьетнамских донгах (VND).',
    taxIn: 'Налоги включены.',
    taxOut: 'Без учёта налогов.',
    sentWith: 'Эта цена придёт к нам вместе с запросом.',
    live: (amount) => `Цена за месяц обновлена: от ${amount} в\u00a0месяц`,
    done: 'Цена за месяц',
    liveCleared: 'Цена за месяц сброшена.',
  },
};

export default strings;
