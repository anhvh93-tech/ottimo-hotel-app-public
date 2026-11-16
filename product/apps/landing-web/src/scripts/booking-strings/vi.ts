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
  roomHint: (lo, hi) =>
    lo
      ? `${lo}–${hi} khách. Số lớn hơn là khi thêm một khách (ngủ sofa, hoặc giường phụ 1,4 m ở hạng Premium); chi phí đã gồm trong báo giá.`
      : 'Chúng tôi sẽ gợi ý phòng hợp với số khách.',
  summary: (n) => `Vui lòng kiểm tra ${n} mục`,
  e: {
    arrReq: 'Chọn ngày dọn vào.',
    // FB-INV-010 (CPY Dot 1 section 7): a number of months is required
    monthsReq: 'Chọn số tháng bạn định ở.',
    range: (max) => `Chọn ngày từ hôm nay đến ${max}.`,
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
    label: 'Giá theo tháng',
    // FB-INV-010 (CPY Dot 1 section 7): main line (same words as rooms.fromPrice), the note under it, and
    // the stay total for the months chosen (listed monthly rate × months – BE getPublicPriceEstimate longStay)
    fromMonth: (amount) => `Từ ${amount}/tháng`,
    note: 'Giá chính thức xác nhận khi chúng tôi liên hệ. Điện nước tính theo thực tế.',
    total: (amount, months) => `Cho ${months}: từ ${amount}`,
    // CPY Dot 1 section 7: no room held until the one-month deposit is received
    final: 'Chưa giữ phòng cho bạn. Phòng được xác nhận khi chúng tôi nhận cọc.',
    prompt: 'Chọn hạng phòng để xem giá theo tháng.',
    anyRoom: 'Chọn một hạng phòng để xem giá theo tháng, hoặc để chúng tôi gợi ý trong báo giá.',
    loading: 'Đang tính giá…',
    unavailable: 'Chưa có giá trực tuyến cho hạng phòng này. Chúng tôi sẽ gửi trong báo giá.',
    error: 'Chưa tải được giá. Giá sẽ có trong báo giá chúng tôi gửi bạn.',
    currency: 'Giá tính bằng VND.',
    taxIn: 'Đã gồm thuế.',
    taxOut: 'Chưa gồm thuế.',
    sentWith: 'Giá này được gửi kèm yêu cầu của bạn.',
    live: (amount) => `Giá theo tháng mới: từ ${amount}/tháng`,
    done: 'Giá theo tháng',
    liveCleared: 'Đã xóa giá theo tháng.',
  },
};

export default strings;
