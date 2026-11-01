// Vietnamese run-time strings of the booking form (concept 5.3–5.4). Estimate: CPY lp-v2-copy.md 2.1 (01/11/2026).
import type { BookingStrings } from './types';

const strings: BookingStrings = {
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
  // U+00A0: the number never leaves its word (CPY 13.5, FB-R4-UXD-FE-04)
  nights: (n) => `${n}\u00a0đêm`,
  roomHint: (lo, hi) =>
    lo
      ? `${lo}–${hi} khách. Số lớn hơn là khi thêm một khách (ngủ sofa, hoặc giường phụ 1,4 m ở hạng Premium); chi phí đã gồm trong báo giá.`
      : 'Chúng tôi sẽ gợi ý phòng hợp với số khách.',
  longHint: (n) => `${n}\u00a0đêm. Chúng tôi sẽ báo giá ở dài ngày.`,
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
    'Yêu cầu trực tuyến đang tạm dừng. Vui lòng nhắn chúng tôi qua ',
    ' hoặc gọi ',
    '. Chúng tôi sẽ trả lời sớm nhất có thể.',
  ],
  reload: 'Trang vừa được cập nhật. Vui lòng tải lại trang rồi gửi lại yêu cầu.',
  sending: 'Đang gửi…',
  notSent: 'Bản xem trước: yêu cầu chưa được gửi. Vui lòng nhắn chúng tôi qua Zalo.',
  estimate: {
    label: 'Giá ước tính',
    // CPY lp-v2-copy 14.1 (BUG-R4-003)
    final: 'Chưa giữ phòng cho bạn. Giá chính thức và phòng trống được xác nhận trong báo giá.',
    guests: (n) => `Cho ${n}\u00a0khách.`,
    prompt: 'Chọn hạng phòng và ngày ở để xem giá ước tính.',
    anyRoom: 'Chọn một hạng phòng để xem giá ước tính, hoặc để chúng tôi gợi ý trong báo giá.',
    loading: 'Đang tính giá…',
    total: (amount, nights) => `${amount} cho ${nights}`,
    perNight: (amount) => `Khoảng ${amount} mỗi đêm`,
    longStay: 'Đã gồm ưu đãi ở dài ngày.',
    unavailable:
      'Chưa có giá ước tính trực tuyến cho ngày này. Chúng tôi sẽ báo giá riêng cho bạn.',
    error: 'Chưa tải được giá ước tính. Giá sẽ có trong báo giá chúng tôi gửi bạn.',
    currency: 'Giá tính bằng VND.',
    taxIn: 'Đã gồm thuế.',
    taxOut: 'Chưa gồm thuế.',
    extraGuest: 'Đã gồm thêm một khách.',
    sentWith: 'Giá ước tính này được gửi kèm yêu cầu của bạn.',
    live: (amount, nights) => `Giá ước tính mới: ${amount} cho ${nights}`,
    done: 'Giá ước tính',
    // CPY lp-v2-copy 13.3 (Lượt 3, 01/11): minimum stay, status line when the estimate goes away
    minStay: (n) =>
      `Với ngày bạn chọn, thời gian ở tối thiểu là ${n}\u00a0đêm. Chọn ở dài hơn để xem giá ước tính, hoặc cứ gửi yêu cầu, chúng tôi sẽ gợi ý cho bạn.`,
    liveCleared: 'Đã xóa giá ước tính.',
  },
  // ESC-043 (INV 01/11): by the month or from the BR-108 threshold (30 nights) – no figure (CPY lp-v2-copy 12.1)
  priceMonthlyOffer: {
    label: 'Ưu đãi riêng cho kỳ ở dài',
    text: 'Với kỳ ở từ một tháng, chúng tôi chuẩn bị mức giá riêng theo ngày ở của bạn, gửi kèm báo giá.',
    // CPY lp-v2-copy 13.2: spoken line of the offer (zh full stop "。", no digit)
    live: 'Ưu đãi riêng cho kỳ ở dài. Với kỳ ở từ một tháng, chúng tôi chuẩn bị mức giá riêng theo ngày ở của bạn, gửi kèm báo giá.',
  },
};

export default strings;
