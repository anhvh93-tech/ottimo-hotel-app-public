// Privacy notice for the booking request form (US-155 AC4, SEC C-3 (a), UXD-04; SEC landing-booking review,
// Appendix A.4 – structure and limits; BR-911…916 – what the request holds and how it is handled). Published at
// /privacy/ and /vi/privacy/ together with the form. INV accepted the ESC-001 risk (24/10): no lawyer review before
// v1.0, shortest retention – so every period below is the UPPER bound of the SEC parameter range (erd 4.14), which
// keeps the sentence true whatever value the owner sets inside the range.
//
// `version` is what the form sends as `consentVersion`; the server must publish the same `privacy_notice_version` for
// vi and en (SEC ARC-17). Change any sentence below (or A.1/A.2 consent text in en.ts/vi.ts) → new version.
// Voice: Brand Guidelines (short, polite, calm; English leads, Vietnamese supports; no emoji).
import type { Lang } from '../lib/i18n';
import { site } from './site';

export interface PrivacySection {
  h: string;
  p: string[];
}

export interface PrivacyCopy {
  /** <title> ≤ 60 characters. */
  title: string;
  /** meta description ≤ 160 characters. */
  description: string;
  label: string;
  h1: string;
  intro: string;
  /** Anchor the form links to (SEC UXD-04 point 3). */
  anchor: string;
  sections: PrivacySection[];
  version: string;
  back: string;
}

const VERSION = '2026-10-24';
const { legal, contact, phone } = site;
const email = contact.email;

const en: PrivacyCopy = {
  title: 'Privacy notice · OTTIMO Boutique Stay',
  description:
    'How OTTIMO Boutique Stay handles the details you send with a booking request on this website.',
  label: 'Privacy',
  h1: 'Privacy notice',
  intro:
    'This notice covers the booking request form on this website: what we collect, why, for how long, and how to reach us about it.',
  anchor: 'booking-requests',
  sections: [
    {
      h: 'Who we are',
      p: [
        `OTTIMO Boutique Stay is operated by ${legal.name}, tax code ${legal.taxCode}, ${legal.address}.`,
        `For anything about your details, email ${email} or message us on Zalo at ${phone.local}.`,
      ],
    },
    {
      h: 'What we collect',
      p: [
        'Your name; one way to reach you – a phone number for Zalo, WhatsApp or a call, or an email address; your dates; the number of adults and of children by age group; the room type you prefer; and your message.',
        'With it we keep the page you sent the form from and the campaign labels in the link, without cookies, and your IP address in a one-way encrypted form to stop abuse.',
      ],
    },
    {
      h: 'Why',
      p: [
        'To answer your request, quote a price and, if you agree, hold a room for you; and to protect the form from abuse.',
        'We do not use these details for advertising and we do not send you offers.',
      ],
    },
    {
      h: 'On what basis',
      p: ['Your consent, given with the tick box on the form. You can withdraw it at any time.'],
    },
    {
      h: 'How we handle it',
      p: [
        'Your details are stored on our server in Viet Nam. Only our reception, our managers and the sales staff assigned to your request can see them.',
        'Nothing is sent to you automatically when you press Send. We reply ourselves, through the channel you chose, from the official OTTIMO accounts listed on this website.',
      ],
    },
    {
      h: 'Who else receives it',
      p: [
        'Our server provider in Viet Nam (Nhân Hòa) stores the data for us.',
        'When we reply, the app you chose – Zalo (VNG) or WhatsApp (Meta) – or our email provider (Google Workspace) carries the messages under its own privacy policy. Their servers may be outside Viet Nam.',
      ],
    },
    {
      h: 'How long we keep it',
      p: [
        'If you book, your details move to your guest profile, and the notice for staying guests applies.',
        'If you do not book, the request closes after at most 60 days without contact, and your name, contact and message are deleted within 180 days of sending at the latest. Requests marked as spam are deleted within 7 days. Backups expire within 35 days.',
      ],
    },
    {
      h: 'Your rights',
      p: [
        `You can ask to see, correct or delete your details, or withdraw your consent. Message us on Zalo or email ${email}, with your request number if you have it.`,
        'Before we act, we check that the request comes from the phone number or email on your booking request, and we send copies only to that contact. If you withdraw your consent, we stop contacting you and delete the request.',
      ],
    },
    {
      h: 'Please note',
      p: [
        'Enter only your own phone number or email. If you enter someone else’s, they will receive our reply.',
        'Please do not include card numbers, ID numbers or health information.',
      ],
    },
    {
      h: 'Cookies',
      p: [
        'This website sets no cookies and loads nothing from other companies. It remembers your language choice in your browser only.',
      ],
    },
    {
      h: 'Complaints',
      p: [
        'If our answer does not resolve your concern, you can complain to the Vietnamese authority responsible for personal data protection.',
      ],
    },
  ],
  version: `Version ${VERSION}. Earlier versions are kept and available on request.`,
  back: 'Back to the home page',
};

const vi: PrivacyCopy = {
  title: 'Thông báo xử lý dữ liệu · OTTIMO Boutique Stay',
  description:
    'Cách OTTIMO Boutique Stay xử lý thông tin bạn gửi qua yêu cầu đặt phòng trên website này.',
  label: 'Dữ liệu cá nhân',
  h1: 'Thông báo xử lý dữ liệu',
  intro:
    'Thông báo này áp dụng cho biểu mẫu yêu cầu đặt phòng trên website: thông tin thu thập, mục đích, thời gian lưu và cách liên hệ OTTIMO.',
  anchor: 'yeu-cau-dat-phong',
  sections: [
    {
      h: 'OTTIMO là ai',
      p: [
        `OTTIMO Boutique Stay do ${legal.name} vận hành, mã số thuế ${legal.taxCode}, địa chỉ ${legal.address}.`,
        `Mọi câu hỏi về thông tin của bạn, vui lòng gửi email ${email} hoặc nhắn Zalo số ${phone.local}.`,
      ],
    },
    {
      h: 'Thông tin thu thập',
      p: [
        'Tên của bạn; một cách liên hệ – số điện thoại để nhắn Zalo, WhatsApp hoặc gọi, hoặc một địa chỉ email; ngày ở; số người lớn và số trẻ em theo nhóm tuổi; hạng phòng bạn muốn; lời nhắn.',
        'Kèm theo đó là trang bạn gửi biểu mẫu và nhãn chiến dịch trong đường link, không dùng cookie, cùng địa chỉ IP ở dạng đã mã hóa một chiều để chống lạm dụng.',
      ],
    },
    {
      h: 'Mục đích',
      p: [
        'Trả lời yêu cầu, báo giá và giữ phòng khi bạn đồng ý; bảo vệ biểu mẫu khỏi lạm dụng.',
        'OTTIMO không dùng thông tin này cho quảng cáo và không gửi tin ưu đãi cho bạn.',
      ],
    },
    {
      h: 'Cơ sở pháp lý',
      p: ['Sự đồng ý của bạn ở ô đồng ý trên biểu mẫu. Bạn có thể rút lại bất cứ lúc nào.'],
    },
    {
      h: 'Cách xử lý',
      p: [
        'Thông tin được lưu trên máy chủ của OTTIMO tại Việt Nam. Chỉ lễ tân, quản lý và nhân viên bán phòng được giao yêu cầu của bạn mới xem được.',
        'Hệ thống không tự gửi tin cho bạn khi bạn bấm gửi. OTTIMO tự trả lời qua kênh bạn chọn, từ các tài khoản chính thức ghi trên website này.',
      ],
    },
    {
      h: 'Bên khác nhận thông tin',
      p: [
        'Nhà cung cấp máy chủ tại Việt Nam (Nhân Hòa) lưu trữ dữ liệu cho OTTIMO.',
        'Khi OTTIMO trả lời, ứng dụng bạn chọn – Zalo (VNG) hoặc WhatsApp (Meta) – hoặc nhà cung cấp email của OTTIMO (Google Workspace) truyền tin nhắn theo chính sách riêng của họ. Máy chủ của họ có thể đặt ngoài Việt Nam.',
      ],
    },
    {
      h: 'Thời gian lưu',
      p: [
        'Nếu bạn đặt phòng, thông tin chuyển sang hồ sơ khách và áp dụng thông báo dành cho khách lưu trú.',
        'Nếu bạn không đặt phòng, yêu cầu tự đóng sau tối đa 60 ngày không trao đổi; tên, liên hệ và lời nhắn bị xóa chậm nhất 180 ngày kể từ lúc gửi. Yêu cầu bị đánh dấu spam được xóa trong 7 ngày. Bản sao lưu tự hết hạn trong 35 ngày.',
      ],
    },
    {
      h: 'Quyền của bạn',
      p: [
        `Bạn có thể yêu cầu xem, sửa, xóa thông tin hoặc rút lại sự đồng ý. Vui lòng nhắn Zalo hoặc gửi email ${email}, kèm mã yêu cầu nếu bạn còn giữ.`,
        'Trước khi thực hiện, OTTIMO kiểm tra yêu cầu đến từ đúng số điện thoại hoặc email ghi trên yêu cầu đặt phòng, và chỉ gửi bản sao tới liên hệ đó. Khi bạn rút lại sự đồng ý, OTTIMO ngừng liên hệ và xóa yêu cầu.',
      ],
    },
    {
      h: 'Lưu ý',
      p: [
        'Chỉ ghi số điện thoại hoặc email của chính bạn. Nếu ghi của người khác, người đó sẽ nhận tin trả lời của OTTIMO.',
        'Vui lòng không ghi số thẻ, số giấy tờ hay thông tin sức khỏe.',
      ],
    },
    {
      h: 'Cookie',
      p: [
        'Website này không đặt cookie và không tải gì từ công ty khác. Lựa chọn ngôn ngữ của bạn chỉ được nhớ trong trình duyệt của bạn.',
      ],
    },
    {
      h: 'Khiếu nại',
      p: [
        'Nếu câu trả lời của OTTIMO chưa giải quyết được băn khoăn của bạn, bạn có thể khiếu nại tới cơ quan có thẩm quyền về bảo vệ dữ liệu cá nhân tại Việt Nam.',
      ],
    },
  ],
  version: `Phiên bản ${VERSION}. Các phiên bản trước được lưu lại và cung cấp khi bạn yêu cầu.`,
  back: 'Về trang chủ',
};

export const PRIVACY_NOTICE: { version: string } & Record<Lang, PrivacyCopy> = {
  version: VERSION,
  en,
  vi,
};
