// Strings the booking-request script writes at run time (concept 5.3, 5.4; mock v1.2.1 `T`). Static labels of the
// form live in the page copy (content/en.ts, vi.ts). Shipped only with the form (review build or feature on).
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
}

export const BOOKING_STRINGS: Record<'en' | 'vi', BookingStrings> = {
  en: {
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
  },
  vi: {
    chName: { zalo: 'Zalo', whatsapp: 'WhatsApp', phone: 'điện thoại' },
    thanks: (name) => `Cảm ơn ${name}. Đây là yêu cầu, chưa phải đặt phòng.`,
    next: {
      zalo: 'Để được trả lời nhanh nhất, mở Zalo và gửi mã này cho OTTIMO.',
      whatsapp: 'Chúng tôi sẽ nhắn bạn qua WhatsApp.',
      phone: 'Chúng tôi sẽ gọi cho bạn.',
      email: 'Chúng tôi sẽ trả lời qua email.',
    },
    when: {
      withinMinutes: (m, open, close) =>
        `Chúng tôi trả lời trong ${m % 60 === 0 ? `${m / 60} giờ` : `${m} phút`} (${open}–${close}, giờ Đà Lạt).`,
      nextMorning: (by, open) =>
        `Lễ tân làm việc lại từ ${open}. Chúng tôi sẽ trả lời bạn trước ${by}.`,
      callNow: (m) => `Bạn đến trong tối nay, chúng tôi sẽ liên hệ bạn trong ${m} phút.`,
    },
    fallback: ['Nếu đến ', ' chúng tôi chưa liên hệ, vui lòng gọi ', ' hoặc nhắn Zalo kèm mã này.'],
    nights: (n) => `${n} đêm`,
    roomHint: (lo, hi) =>
      lo
        ? `${lo}–${hi} khách. Số lớn hơn là khi thêm một khách (ngủ sofa, hoặc giường phụ 1,4 m ở hạng Premium); chi phí đã gồm trong báo giá.`
        : 'Chúng tôi sẽ gợi ý phòng hợp với số khách.',
    longHint: (n) => `${n} đêm. Chúng tôi sẽ báo giá ở dài ngày.`,
    summary: (n) => `Vui lòng kiểm tra ${n} mục`,
    e: {
      inReq: 'Chọn ngày nhận phòng.',
      outReq: 'Chọn ngày trả phòng.',
      arrReq: 'Chọn ngày đến.',
      range: (max) => `Chọn ngày từ hôm nay đến ${max}.`,
      order: 'Ngày trả phòng phải sau ngày nhận phòng.',
      cap: (n) =>
        `Hạng phòng này ở tối đa ${n} người (không tính trẻ dưới 6 tuổi). Chọn hạng lớn hơn, hoặc "Gợi ý giúp tôi".`,
      name: 'Cho chúng tôi biết tên của bạn.',
      phone: (c) => `Nhập số ${c} để chúng tôi liên hệ.`,
      email: 'Nhập email dạng ten@vidu.com.',
      card: 'Vui lòng xóa số thẻ khỏi ghi chú.',
      consent: 'Vui lòng đánh dấu ô đồng ý để chúng tôi trả lời.',
      idNumber: 'Không cần gửi số giấy tờ ở bước này. Vui lòng xóa số đó.',
      phoneCountry: 'Vui lòng kiểm tra lại số. Số nước ngoài bắt đầu bằng + và mã nước.',
      server: 'Vui lòng kiểm tra lại mục này.',
    },
    net: {
      network: 'Chưa gửi được yêu cầu. Kiểm tra kết nối rồi thử lại, hoặc nhắn chúng tôi qua Zalo.',
      busy: 'Chúng tôi đang nhận nhiều yêu cầu. Vui lòng nhắn Zalo hoặc gọi 08.4444.0909.',
      rate: 'Kết nối này đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau, hoặc nhắn chúng tôi qua Zalo.',
    },
    notReady: [
      'Yêu cầu trực tuyến đang tạm dừng. Vui lòng nhắn OTTIMO qua ',
      ' hoặc gọi ',
      '. OTTIMO sẽ trả lời sớm nhất có thể.',
    ],
    reload: 'Trang vừa được cập nhật. Vui lòng tải lại trang rồi gửi lại yêu cầu.',
    sending: 'Đang gửi…',
    notSent: 'Bản xem trước: yêu cầu chưa được gửi. Vui lòng nhắn chúng tôi qua Zalo.',
  },
};
