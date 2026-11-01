// Privacy notice for the booking request form (US-155 AC4, SEC C-3 (a), UXD-04; SEC landing-booking review,
// Appendix A.4 – structure and limits; BR-911…916 – what the request holds and how it is handled). Published at
// /privacy/ and /<lang>/privacy/ for every published language together with the form. INV accepted the ESC-001 risk (24/10): no lawyer review before
// v1.0, shortest retention – so every period below is the UPPER bound of the SEC parameter range (erd 4.14), which
// keeps the sentence true whatever value the owner sets inside the range.
//
// `version` is what the form sends as `consentVersion`; the server must publish the same `privacy_notice_version` for
// EVERY published language in one transaction (SEC ARC-17, extended by SEC LP-v2 D1 "lockstep" and ARC lp-v2 3.6).
// Change any sentence below (or A.1/A.2 consent text in content/<lang>.ts) → new version for all languages.
//
// LP-v2 (R4): text = SEC rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md – EN/VI = `2026-10-31` text (ESC-041 C,
// ESC-042 B: Google Chat copy has no stated period; SEC-LP2-02 "These periods…" at the end) + Δ5 translation-service
// sentence (ESC-044 + INV 01/11 question 9: any Desk screen – SEC review of LP-v2 code section 3 (L3): read and reply, name, contact, stay details, message); ko/zh/ru = SEC sections 4–6 + translation precedence note
// (Δ7). The page carries the version for machines too: <meta name="ottimo-notice-version"> (ARC D11) and
// data-notice-version on the notice body (SEC SR-LC-04) – both from VERSION below, read by OPS publish-privacy-notice.
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
  /**
   * ko/zh/ru only (SEC LP-v2 2.5, Δ7): "This is a translation. If it differs from the English or Vietnamese version,
   * the English and Vietnamese versions apply." Shown under the intro.
   */
  translationNote?: string;
  /** Anchor the form links to (SEC UXD-04 point 3). */
  anchor: string;
  sections: PrivacySection[];
  version: string;
  back: string;
}

/**
 * TEMPORARY LABEL (nhãn tạm – SEC LP-v2 2.3 D2 "V3"): one version for en, vi, ko, zh, ru. SEC sets the final label (the
 * day the LP-v2 text is final, after the native-speaker review – later than `2026-10-31`) before OPS publishes it.
 */
const VERSION = '2026-11-01';
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
        'Your details are stored on our server in Viet Nam. Only our reception, our managers and the sales staff assigned to your request can see them. To alert the team on duty, a copy of your request is also posted to our private staff chat, as described below.',
        'Nothing is sent to you automatically when you press Send. We reply ourselves, through the channel you chose, from the official OTTIMO accounts listed on this website.',
      ],
    },
    {
      h: 'Who else receives it',
      p: [
        'Our server provider in Viet Nam (Nhân Hòa) stores the data for us.',
        'When we reply, the app you chose – Zalo (VNG) or WhatsApp (Meta) – or our email provider (Google Workspace) carries the messages under its own privacy policy. Their servers may be outside Viet Nam.',
        'When you send a request, we post your name, contact, preferred channel, dates, number of guests and message to a private chat used only by our managers and reception, on Google Chat (Google Workspace). We do this only so that the person on duty can reply to you quickly. Google stores these messages on its servers, which may be outside Viet Nam. Messages in this chat are not deleted automatically. We delete your copy when it is no longer needed to reply to you, or when you ask us to delete your request.',
        // Δ5 – ESC-044 + INV 01/11 câu 9 (mọi màn hình Desk) – SEC review LP-v2 code mục 3
        'We may use a translation service, such as Google Translate, to read your request and reply to you. The text we translate may include your name, contact, stay details and message. The service’s servers may be outside Viet Nam.',
      ],
    },
    {
      h: 'How long we keep it',
      p: [
        'If you book, your details move to your guest profile, and the notice for staying guests applies.',
        'If you do not book, the request closes after at most 60 days without contact, and your name, contact and message are deleted within 180 days of sending at the latest. Requests marked as spam are deleted within 7 days. Backups expire within 35 days. The one-way encrypted form of your IP address is deleted within 30 days. These periods apply to our server; the copy in our staff chat is handled as described under “Who else receives it”.',
      ],
    },
    {
      h: 'Your rights',
      p: [
        `You can ask to see, correct or delete your details, or withdraw your consent. Message us on Zalo or email ${email}, with your request number if you have it.`,
        'Before we act, we check that the request comes from the phone number or email on your booking request, and we send copies only to that contact. If you withdraw your consent, we stop contacting you and delete the request, including any copy left in our staff chat.',
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
        'Thông tin được lưu trên máy chủ của OTTIMO tại Việt Nam. Chỉ lễ tân, quản lý và nhân viên bán phòng được giao yêu cầu của bạn mới xem được. Để báo cho nhân viên đang trực, một bản sao yêu cầu của bạn cũng được đăng vào phòng trò chuyện nội bộ của OTTIMO, như mô tả dưới đây.',
        'Hệ thống không tự gửi tin cho bạn khi bạn bấm gửi. OTTIMO tự trả lời qua kênh bạn chọn, từ các tài khoản chính thức ghi trên website này.',
      ],
    },
    {
      h: 'Bên khác nhận thông tin',
      p: [
        'Nhà cung cấp máy chủ tại Việt Nam (Nhân Hòa) lưu trữ dữ liệu cho OTTIMO.',
        'Khi OTTIMO trả lời, ứng dụng bạn chọn – Zalo (VNG) hoặc WhatsApp (Meta) – hoặc nhà cung cấp email của OTTIMO (Google Workspace) truyền tin nhắn theo chính sách riêng của họ. Máy chủ của họ có thể đặt ngoài Việt Nam.',
        'Khi bạn gửi yêu cầu, OTTIMO đăng tên, liên hệ, kênh bạn chọn, ngày ở, số khách và lời nhắn của bạn vào một phòng trò chuyện nội bộ chỉ dành cho quản lý và lễ tân, trên Google Chat (Google Workspace). Việc này chỉ để người đang trực trả lời bạn nhanh hơn. Google lưu các tin này trên máy chủ của họ, có thể đặt ngoài Việt Nam. Tin trong phòng này không tự xóa. OTTIMO xóa bản sao của bạn khi không còn cần để trả lời bạn, hoặc khi bạn yêu cầu xóa.',
        // Δ5 – ESC-044 + INV 01/11 câu 9 (mọi màn hình Desk) – SEC review LP-v2 code mục 3
        'OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc yêu cầu và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Máy chủ của dịch vụ này có thể đặt ngoài Việt Nam.',
      ],
    },
    {
      h: 'Thời gian lưu',
      p: [
        'Nếu bạn đặt phòng, thông tin chuyển sang hồ sơ khách và áp dụng thông báo dành cho khách lưu trú.',
        'Nếu bạn không đặt phòng, yêu cầu tự đóng sau tối đa 60 ngày không trao đổi; tên, liên hệ và lời nhắn bị xóa chậm nhất 180 ngày kể từ lúc gửi. Yêu cầu bị đánh dấu spam được xóa trong 7 ngày. Bản sao lưu tự hết hạn trong 35 ngày. Địa chỉ IP ở dạng đã mã hóa một chiều được xóa trong 30 ngày. Các thời hạn này áp dụng cho máy chủ của OTTIMO; bản sao trong phòng trò chuyện nội bộ được xử lý như mô tả ở mục “Bên khác nhận thông tin”.',
      ],
    },
    {
      h: 'Quyền của bạn',
      p: [
        `Bạn có thể yêu cầu xem, sửa, xóa thông tin hoặc rút lại sự đồng ý. Vui lòng nhắn Zalo hoặc gửi email ${email}, kèm mã yêu cầu nếu bạn còn giữ.`,
        'Trước khi thực hiện, OTTIMO kiểm tra yêu cầu đến từ đúng số điện thoại hoặc email ghi trên yêu cầu đặt phòng, và chỉ gửi bản sao tới liên hệ đó. Khi bạn rút lại sự đồng ý, OTTIMO ngừng liên hệ và xóa yêu cầu, kể cả bản sao còn lại trong phòng trò chuyện nội bộ.',
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

// SEC lp-v2-privacy-and-api.md section 4 (ko) – translation by the team; native-speaker review pending (SEC D4).
const ko: PrivacyCopy = {
  title: '개인정보 처리 안내 · OTTIMO Boutique Stay',
  description:
    'OTTIMO Boutique Stay가 이 웹사이트의 예약 요청과 함께 보내 주신 정보를 처리하는 방법을 안내합니다.',
  label: '개인정보',
  h1: '개인정보 처리 안내',
  intro:
    '이 안내는 이 웹사이트의 예약 요청 양식에 적용됩니다. 수집하는 정보, 목적, 보관 기간, 문의 방법을 설명합니다.',
  // Δ7
  translationNote:
    '이 문서는 번역본입니다. 영어 또는 베트남어 원문과 다른 부분이 있으면 영어 및 베트남어 원문이 적용됩니다.',
  anchor: 'booking-requests',
  sections: [
    {
      h: '운영자',
      p: [
        `OTTIMO Boutique Stay는 ${legal.name}(세금 코드 ${legal.taxCode}, 주소 ${legal.address})가 운영합니다.`,
        `고객님의 정보에 관한 문의는 이메일(${email}) 또는 Zalo(${phone.local})로 보내 주십시오.`,
      ],
    },
    {
      h: '수집하는 정보',
      p: [
        '성함, 연락 방법 한 가지(Zalo, WhatsApp 또는 전화용 전화번호, 또는 이메일 주소), 숙박 날짜, 성인 수와 연령대별 어린이 수, 원하시는 객실 유형, 메시지.',
        '이와 함께 양식을 보내신 페이지와 링크에 포함된 캠페인 표시를 쿠키 없이 보관하며, 악용 방지를 위해 IP 주소를 단방향 암호화한 형태로 보관합니다.',
      ],
    },
    {
      h: '목적',
      p: [
        '요청에 답변하고 요금을 안내하며, 동의하시는 경우 객실을 잡아 두기 위해서입니다. 또한 양식이 악용되지 않도록 보호하기 위해서입니다.',
        '이 정보는 광고에 사용하지 않으며, 홍보성 안내를 보내지 않습니다.',
      ],
    },
    {
      h: '처리 근거',
      p: ['양식의 체크박스로 해 주신 고객님의 동의입니다. 동의는 언제든지 철회하실 수 있습니다.'],
    },
    {
      h: '처리 방법',
      p: [
        // Δ1: câu thứ 3 chỉ có từ 2026-10-31
        '고객님의 정보는 베트남에 있는 OTTIMO 서버에 저장됩니다. 리셉션, 관리자, 그리고 고객님의 요청을 배정받은 판매 담당 직원만 볼 수 있습니다. 근무 중인 직원에게 알리기 위해, 요청 사본이 아래 설명과 같이 OTTIMO 내부 직원 채팅방에도 게시됩니다.',
        '보내기를 누르셔도 고객님께 자동으로 발송되는 메시지는 없습니다. 이 웹사이트에 안내된 OTTIMO 공식 계정에서, 고객님이 선택하신 채널로 직원이 직접 답변드립니다.',
      ],
    },
    {
      h: '정보를 받는 다른 곳',
      p: [
        '베트남의 서버 제공업체(Nhân Hòa)가 OTTIMO를 대신하여 데이터를 저장합니다.',
        '답변을 보낼 때에는 고객님이 선택하신 앱인 Zalo(VNG) 또는 WhatsApp(Meta), 또는 OTTIMO의 이메일 제공업체(Google Workspace)가 각자의 개인정보 처리방침에 따라 메시지를 전달합니다. 이들의 서버는 베트남 밖에 있을 수 있습니다.',
        // Δ2
        '요청을 보내시면 고객님의 성함, 연락처, 선택하신 채널, 숙박 날짜, 인원수와 메시지를 Google Chat(Google Workspace)의 비공개 채팅방에 게시합니다. 이 채팅방은 OTTIMO의 관리자와 리셉션만 사용합니다. 이는 근무 중인 직원이 빠르게 답변드리기 위한 목적으로만 이루어집니다. Google은 이 메시지를 자사 서버에 저장하며, 서버는 베트남 밖에 있을 수 있습니다. 이 채팅방의 메시지는 자동으로 삭제되지 않습니다. 고객님께 답변하는 데 더 이상 필요하지 않을 때, 또는 요청 삭제를 원하실 때 고객님의 사본을 삭제합니다.',
        // Δ5 – ESC-044 + INV 01/11 câu 9 (mọi màn hình Desk) – SEC review LP-v2 code mục 3
        '요청 내용을 읽고 답변드리기 위해 Google 번역 같은 번역 서비스를 이용할 수 있습니다. 번역하는 내용에는 고객님의 성함, 연락처, 숙박 정보, 메시지가 포함될 수 있습니다. 이 서비스의 서버는 베트남 밖에 있을 수 있습니다.',
      ],
    },
    {
      h: '보관 기간',
      p: [
        '예약하시면 정보는 투숙객 프로필로 옮겨지며, 투숙객 대상 안내가 적용됩니다.',
        // Δ3: hai câu cuối chỉ có từ 2026-10-31
        '예약하지 않으시면, 연락이 없는 상태로 최대 60일이 지나면 요청이 종료되고, 성함, 연락처, 메시지는 보내신 날로부터 늦어도 180일 이내에 삭제됩니다. 스팸으로 표시된 요청은 7일 이내에 삭제됩니다. 백업은 35일 이내에 만료됩니다. 단방향 암호화된 형태의 IP 주소는 30일 이내에 삭제됩니다. 이 기간들은 OTTIMO 서버에 적용되며, 직원 채팅방의 사본은 ‘정보를 받는 다른 곳’에 설명된 대로 처리됩니다.',
      ],
    },
    {
      h: '고객님의 권리',
      p: [
        `고객님은 정보의 열람, 정정, 삭제를 요청하시거나 동의를 철회하실 수 있습니다. Zalo 메시지 또는 이메일(${email})로 연락해 주시고, 요청 번호가 있으면 함께 알려 주십시오.`,
        // Δ4
        '처리하기 전에 요청이 예약 요청에 적힌 전화번호 또는 이메일에서 온 것인지 확인하며, 사본은 해당 연락처로만 보내 드립니다. 동의를 철회하시면 연락을 중단하고, 직원 채팅방에 남은 사본을 포함하여 요청을 삭제합니다.',
      ],
    },
    {
      h: '참고해 주십시오',
      p: [
        '본인의 전화번호 또는 이메일만 입력해 주십시오. 다른 사람의 연락처를 입력하시면 그분이 저희 답변을 받게 됩니다.',
        '카드 번호, 신분증 번호, 건강 정보는 적지 말아 주십시오.',
      ],
    },
    {
      h: '쿠키',
      p: [
        '이 웹사이트는 쿠키를 설정하지 않으며, 다른 회사의 콘텐츠를 불러오지 않습니다. 선택하신 언어만 고객님의 브라우저에 기억됩니다.',
      ],
    },
    {
      h: '불만 제기',
      p: [
        '저희 답변으로 우려가 해결되지 않으면 베트남의 개인정보 보호 담당 기관에 불만을 제기하실 수 있습니다.',
      ],
    },
  ],
  version: `버전 ${VERSION}. 이전 버전은 보관되며, 요청하시면 제공해 드립니다.`,
  back: '홈으로 돌아가기',
};

// SEC lp-v2-privacy-and-api.md section 5 (zh) – translation by the team; native-speaker review pending (SEC D4).
const zh: PrivacyCopy = {
  title: '隐私声明 · OTTIMO Boutique Stay',
  description: 'OTTIMO Boutique Stay 如何处理您通过本网站预订申请提交的信息。',
  label: '隐私',
  h1: '隐私声明',
  intro: '本声明适用于本网站的预订申请表：我们收集哪些信息、用途、保存多久，以及如何就此联系我们。',
  // Δ7
  translationNote: '本页为译文。如与英文或越南文版本有出入，以英文和越南文版本为准。',
  anchor: 'booking-requests',
  sections: [
    {
      h: '我们是谁',
      p: [
        `OTTIMO Boutique Stay 由 ${legal.name} 运营，税号 ${legal.taxCode}，地址：${legal.address}。`,
        `如对您的信息有任何疑问，请发送邮件至 ${email}，或通过 Zalo 联系 ${phone.local}。`,
      ],
    },
    {
      h: '我们收集的信息',
      p: [
        '您的姓名；一种联系方式——用于 Zalo、WhatsApp 或电话的手机号码，或一个电子邮箱地址；入住日期；成人人数及按年龄段划分的儿童人数；您希望的房型；以及您的留言。',
        '此外，我们会在不使用 Cookie 的情况下记录您提交表单的页面和链接中的推广活动标签，并以单向加密形式保存您的 IP 地址，用于防止滥用。',
      ],
    },
    {
      h: '用途',
      p: [
        '用于回复您的申请、提供报价，并在您同意时为您保留房间；以及保护表单免遭滥用。',
        '我们不会将这些信息用于广告，也不会向您发送促销信息。',
      ],
    },
    {
      h: '法律依据',
      p: ['您在表单上勾选同意框所给予的同意。您可随时撤回同意。'],
    },
    {
      h: '我们如何处理',
      p: [
        // Δ1: câu thứ 3 chỉ có từ 2026-10-31
        '您的信息存储在我们位于越南的服务器上。只有我们的前台、管理人员以及负责您申请的销售人员可以查看。为通知当班人员，您的申请副本也会发布到我们的内部员工聊天室，详见下文。',
        '您点击发送后，系统不会自动向您发送任何消息。我们会通过您选择的渠道，从本网站列出的 OTTIMO 官方账号亲自回复您。',
      ],
    },
    {
      h: '其他接收方',
      p: [
        '我们在越南的服务器提供商（Nhân Hòa）代我们存储数据。',
        '我们回复时，您选择的应用——Zalo（VNG）或 WhatsApp（Meta）——或我们的电子邮件服务商（Google Workspace）将按照其各自的隐私政策传递消息。其服务器可能位于越南境外。',
        // Δ2
        '您提交申请后，我们会将您的姓名、联系方式、所选渠道、入住日期、人数和留言发布到 Google Chat（Google Workspace）上的一个内部聊天室，该聊天室仅供我们的管理人员和前台使用。此举仅为让当班人员尽快回复您。Google 将这些消息存储在其服务器上，服务器可能位于越南境外。该聊天室中的消息不会自动删除。当不再需要用于回复您时，或在您要求删除申请时，我们会删除您的副本。',
        // Δ5 – ESC-044 + INV 01/11 câu 9 (mọi màn hình Desk) – SEC review LP-v2 code mục 3
        '我们可能会使用 Google 翻译等翻译服务来阅读您的申请并回复您。翻译的内容可能包括您的姓名、联系方式、入住信息和留言。该服务的服务器可能位于越南境外。',
      ],
    },
    {
      h: '保存期限',
      p: [
        '如您完成预订，您的信息将转入您的住客档案，并适用住客须知。',
        // Δ3: hai câu cuối chỉ có từ 2026-10-31
        '如您未预订，申请在最长 60 天无联系后关闭，您的姓名、联系方式和留言最迟在提交后 180 天内删除。被标记为垃圾信息的申请在 7 天内删除。备份在 35 天内过期。单向加密形式的 IP 地址在 30 天内删除。上述期限适用于我们的服务器；员工聊天室中的副本按“其他接收方”中所述方式处理。',
      ],
    },
    {
      h: '您的权利',
      p: [
        `您可以要求查看、更正或删除您的信息，或撤回您的同意。请通过 Zalo 联系我们或发送邮件至 ${email}，如有申请编号，请一并提供。`,
        // Δ4
        '在处理之前，我们会核实请求是否来自您预订申请中填写的手机号码或电子邮箱，并且只会将副本发送至该联系方式。如您撤回同意，我们将停止联系您，并删除该申请，包括员工聊天室中留存的副本。',
      ],
    },
    {
      h: '请注意',
      p: [
        '请只填写您本人的手机号码或电子邮箱。如填写他人的联系方式，对方将收到我们的回复。',
        '请不要填写银行卡号、证件号码或健康信息。',
      ],
    },
    {
      h: 'Cookie',
      p: ['本网站不设置 Cookie，也不加载任何其他公司的内容。您选择的语言仅保存在您的浏览器中。'],
    },
    {
      h: '投诉',
      p: ['如我们的答复未能解决您的疑虑，您可以向越南负责个人数据保护的主管机关投诉。'],
    },
  ],
  version: `版本 ${VERSION}。以往版本均予保存，可应要求提供。`,
  back: '返回首页',
};

// SEC lp-v2-privacy-and-api.md section 6 (ru) – translation by the team; native-speaker review pending (SEC D4).
const ru: PrivacyCopy = {
  title: 'Уведомление о конфиденциальности · OTTIMO Boutique Stay',
  description:
    'Как OTTIMO Boutique Stay обрабатывает данные, которые вы отправляете с запросом на бронирование на этом сайте.',
  label: 'Конфиденциальность',
  h1: 'Уведомление о конфиденциальности',
  intro:
    'Это уведомление касается формы запроса на бронирование на этом сайте: какие данные мы собираем, зачем, как долго храним и как связаться с нами по этому поводу.',
  // Δ7
  translationNote:
    'Это перевод. Если он расходится с английской или вьетнамской версией, применяются английская и вьетнамская версии.',
  anchor: 'booking-requests',
  sections: [
    {
      h: 'Кто мы',
      p: [
        `Оператор OTTIMO Boutique Stay — ${legal.name}, налоговый код ${legal.taxCode}, адрес: ${legal.address}.`,
        `По любым вопросам о ваших данных пишите на ${email} или в Zalo по номеру ${phone.local}.`,
      ],
    },
    {
      h: 'Какие данные мы собираем',
      p: [
        'Ваше имя; один способ связи — номер телефона для Zalo, WhatsApp или звонка либо адрес электронной почты; даты проживания; число взрослых и детей по возрастным группам; желаемый тип номера; ваше сообщение.',
        'Вместе с ними мы сохраняем страницу, с которой отправлена форма, и метки кампании из ссылки — без файлов cookie, — а также ваш IP-адрес в необратимо зашифрованном виде для защиты от злоупотреблений.',
      ],
    },
    {
      h: 'Зачем',
      p: [
        'Чтобы ответить на ваш запрос, сообщить цену и, если вы согласны, придержать для вас номер; а также чтобы защитить форму от злоупотреблений.',
        'Мы не используем эти данные для рекламы и не присылаем вам предложений.',
      ],
    },
    {
      h: 'На каком основании',
      p: ['Ваше согласие, выраженное отметкой в форме. Вы можете отозвать его в любое время.'],
    },
    {
      h: 'Как мы обращаемся с данными',
      p: [
        // Δ1: câu thứ 3 chỉ có từ 2026-10-31
        'Ваши данные хранятся на нашем сервере во Вьетнаме. Видеть их могут только сотрудники нашей стойки регистрации, руководители и менеджеры по продажам, которым поручен ваш запрос. Чтобы оповестить дежурных сотрудников, копия вашего запроса также публикуется в нашем закрытом служебном чате, как описано ниже.',
        'Когда вы нажимаете «Отправить», вам ничего не приходит автоматически. Мы отвечаем сами — через выбранный вами канал, с официальных аккаунтов OTTIMO, указанных на этом сайте.',
      ],
    },
    {
      h: 'Кто ещё получает данные',
      p: [
        'Наш хостинг-провайдер во Вьетнаме (Nhân Hòa) хранит данные по нашему поручению.',
        'Когда мы отвечаем, выбранное вами приложение — Zalo (VNG) или WhatsApp (Meta) — либо наш почтовый сервис (Google Workspace) передаёт сообщения в соответствии со своей политикой конфиденциальности. Их серверы могут находиться за пределами Вьетнама.',
        // Δ2
        'Когда вы отправляете запрос, мы публикуем ваше имя, контакт, выбранный канал связи, даты, число гостей и сообщение в закрытом чате Google Chat (Google Workspace), которым пользуются только наши руководители и сотрудники стойки регистрации. Мы делаем это только для того, чтобы дежурный сотрудник смог быстро вам ответить. Google хранит эти сообщения на своих серверах, которые могут находиться за пределами Вьетнама. Сообщения в этом чате не удаляются автоматически. Мы удаляем вашу копию, когда она больше не нужна для ответа вам или когда вы просите удалить ваш запрос.',
        // Δ5 – ESC-044 + INV 01/11 câu 9 (mọi màn hình Desk) – SEC review LP-v2 code mục 3
        'Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы прочитать ваш запрос и ответить вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и сообщение. Серверы этого сервиса могут находиться за пределами Вьетнама.',
      ],
    },
    {
      h: 'Как долго мы храним данные',
      p: [
        'Если вы забронируете номер, ваши данные переходят в ваш профиль гостя, и к ним применяется уведомление для проживающих гостей.',
        // Δ3: hai câu cuối chỉ có từ 2026-10-31
        'Если вы не забронируете номер, запрос закрывается не позднее чем через 60 дней без общения, а ваше имя, контакт и сообщение удаляются не позднее чем через 180 дней после отправки. Запросы, отмеченные как спам, удаляются в течение 7 дней. Резервные копии истекают в течение 35 дней. Необратимо зашифрованный IP-адрес удаляется в течение 30 дней. Эти сроки относятся к нашему серверу; копия в служебном чате обрабатывается, как описано в разделе «Кто ещё получает данные».',
      ],
    },
    {
      h: 'Ваши права',
      p: [
        `Вы можете попросить показать, исправить или удалить ваши данные либо отозвать согласие. Напишите нам в Zalo или на ${email}, указав номер запроса, если он у вас есть.`,
        // Δ4
        'Прежде чем выполнить просьбу, мы проверяем, что она пришла с номера телефона или адреса электронной почты, указанных в запросе на бронирование, и отправляем копии только на этот контакт. Если вы отзываете согласие, мы прекращаем связываться с вами и удаляем запрос, включая копию, оставшуюся в служебном чате.',
      ],
    },
    {
      h: 'Обратите внимание',
      p: [
        'Указывайте только свой номер телефона или адрес электронной почты. Если вы укажете чужой, наш ответ получит этот человек.',
        'Пожалуйста, не указывайте номера банковских карт, документов и сведения о здоровье.',
      ],
    },
    {
      h: 'Файлы cookie',
      p: [
        'Этот сайт не устанавливает файлы cookie и ничего не загружает с ресурсов других компаний. Выбранный вами язык запоминается только в вашем браузере.',
      ],
    },
    {
      h: 'Жалобы',
      p: [
        'Если наш ответ не решил ваш вопрос, вы можете подать жалобу в орган Вьетнама, отвечающий за защиту персональных данных.',
      ],
    },
  ],
  version: `Версия ${VERSION}. Предыдущие версии сохраняются и предоставляются по запросу.`,
  back: 'На главную',
};

export const PRIVACY_NOTICE: { version: string } & Record<Lang, PrivacyCopy> = {
  version: VERSION,
  en,
  vi,
  ko,
  zh,
  ru,
};
