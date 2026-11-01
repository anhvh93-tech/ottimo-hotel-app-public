# SEC – Chữ cuối cùng thông báo xử lý dữ liệu `2026-10-31` (en, vi) cho ottimo.vn

- Tác giả: SEC | Round 4 – v1.0.1 đợt 1b (`landing-v1.2.0`, việc T8 trong `rounds/round-04/plan-v1.0.1.md`) – Bước: Sản xuất | Ngày 01/11/2026
- Căn cứ: ESC-041 (C, chạy từ v1.0.1), ESC-042 (B), ESC-044 (cho phép dịch, không giới hạn) + decision-log 01/11 câu 9 (Google Dịch trên mọi màn hình Desk); `rounds/round-03/outputs/SEC/esc041-gchat-full-details.md` mục L2; `rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` mục 1 (SEC-LP2-01, SEC-LP2-02), mục 3 (bảng Δ), mục 7; `rounds/round-04/reviews/SEC-on-LP-v2-code.md` mục 3 (Δ5 L3); `product/apps/landing-web/src/content/privacy.ts` trên `main` (`2026-10-24`); renderer Chat `origin/be/gchat-booking-notify` `chat-message.ts` (đối chiếu trường gửi ở mức C).
- Chỉ en + vi. ko/zh/ru thuộc LP-v2 (version `V3` sau). Không sửa mã, không commit. Không có dữ liệu khách thật, URL webhook, khóa hay mật khẩu trong tệp này. Mọi câu về luật là câu hỏi cho luật sư, không phải kết luận pháp lý.

## 0. Kết luận

| Câu | SEC chốt |
|---|---|
| Nhãn version | **`2026-10-31`** (giữ nhãn dù chữ chốt 01/11: hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` của ★2 đã dùng nhãn này; thứ tự do `published_at` quyết – SEC LP-v2 2.1). |
| Δ5 (dịch vụ dịch bên ngoài) | **Đưa vào `2026-10-31`.** INV cho dùng Google Dịch trên mọi màn hình Desk từ 01/11, và Desk lên production trước khi thông báo này đăng. Đăng `2026-10-31` mà thiếu Δ5 thì thông báo bỏ sót một bên nhận đang có thật, trái nguyên tắc "thông báo chỉ nói điều OTTIMO làm thật". `2026-10-31` chưa đăng nên thêm được, không tốn version. |
| Δ5 sửa so với L3 | **Thêm một vế:** "The service handles this text under its own privacy policy" / "Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ". Lý do: Δ4 ("…delete the request, including any copy left in our staff chat") dễ được hiểu là OTTIMO xóa **mọi** bản sao. Bản ở dịch vụ dịch phổ thông OTTIMO không xóa được (RR-T1, INV chấp nhận 01/11). Vế mới nói đúng giới hạn đó, cùng cách nói đã dùng cho Zalo/WhatsApp/email. Không hứa gì về việc Google lưu hay không lưu. |
| ESC-041 C | Δ1 + Δ2 (Google Chat: bên nhận, dữ liệu gửi, mục đích, nơi lưu có thể ngoài Việt Nam). Trường liệt kê **khớp đúng** renderer mức C (tên, một liên hệ, kênh, ngày ở, số khách, lời nhắn; không hạng phòng, không IP). |
| ESC-042 B | Câu cuối Δ2 không nêu thời hạn; câu 180 ngày chỉ áp cho máy chủ (Δ3b, SEC-LP2-02). |
| `consentMore` (SEC-LP2-01 Major) | "…from our server within 180 days" / "…khỏi máy chủ của OTTIMO…" (Δ6). `consent` (A.1) giữ nguyên. |
| Luật sư | **Có, để tham khảo, không chặn phát hành** (ESC-041 cập nhật 30/10: luật sư lo phần pháp lý). 4 nhóm câu đổi nghĩa so với bản luật sư đã đọc – mục 4. |
| ESC mới | **Không.** |

Chữ en/vi ở đây là **chữ chung** cho `2026-10-31` và en/vi của `V3` (LP-v2). Từ nay en/vi của LP-v2 chỉ khác `2026-10-31` ở nhãn version (nút ngôn ngữ đổi byte trang nên `V3` vẫn bắt buộc – SEC LP-v2 2.2).

---

## 1. Văn bản cho FE-B – chép thẳng

### 1.1 `privacy.ts` – đầu tệp (thay dòng 1–9 và hằng `VERSION`)

```ts
// Privacy notice for the booking request form (US-155 AC4, SEC C-3 (a), UXD-04; SEC landing-booking review,
// Appendix A.4 – structure and limits; BR-911…916 – what the request holds and how it is handled). Published at
// /privacy/ and /vi/privacy/ together with the form. INV accepted the ESC-001 risk (24/10): no lawyer review before
// v1.0, shortest retention – so every period below is the UPPER bound of the SEC parameter range (erd 4.14), which
// keeps the sentence true whatever value the owner sets inside the range.
//
// Version 2026-10-31 (SEC rounds/round-04/outputs/SEC/notice-2026-10-31-final.md): ESC-041 C – Google Chat staff room
// receives the guest's details (Δ1, Δ2); ESC-042 B – no deletion period stated for the Chat copy, the 180-day promise
// covers our server only (Δ2 last sentence, Δ3); hashed IP 30 days (Δ3); withdrawal also deletes the Chat copy (Δ4);
// ESC-044 + INV 01/11 Q9 – external translation service on any Desk screen (Δ5); consentMore "from our server" (Δ6).
//
// `version` is what the form sends as `consentVersion`; the server must publish the same `privacy_notice_version` for
// vi and en (SEC ARC-17). It is also CHAT_DETAILS_MIN_NOTICE_VERSION (SEC ★2): only requests sent under this version
// or later may carry guest details to Google Chat. Change any sentence below (or A.1/A.2 consent text in en.ts/vi.ts)
// → new version.
// Voice: Brand Guidelines (short, polite, calm; English leads, Vietnamese supports; no emoji).
import type { Lang } from '../lib/i18n';
import { site } from './site';
```

`interface` giữ nguyên như `main`. Hằng:

```ts
const VERSION = '2026-10-31';
```

`PRIVACY_NOTICE` cuối tệp giữ nguyên.

### 1.2 `privacy.ts` – hai khối `en` và `vi` (thay nguyên hai khối trên `main`)

Khối dưới đây trùng từng ký tự với en/vi trên `origin/lp-v2-fe5` (`c37a0a76`), **trừ** câu Δ5 (thêm vế "chính sách riêng") và dòng comment Δ5. Dấu nháy cong (’ “ ”) giữ đúng như dưới, không đổi sang nháy thẳng.

```ts
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
        // Δ5 – translation service (ESC-044; INV 01/11 Q9: any Desk screen) – SEC notice-2026-10-31-final section 2
        'We may use a translation service, such as Google Translate, to read your request and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam.',
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
        // Δ5 – translation service (ESC-044; INV 01/11 Q9: any Desk screen) – SEC notice-2026-10-31-final section 2
        'OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc yêu cầu và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam.',
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
```

### 1.3 `en.ts` và `vi.ts` – khóa `form.consentMore` (Δ6)

```ts
// en.ts
      consentMore:
        'If you do not book, we delete these details from our server within 180 days. We reply only from the channels listed on this page.',
```

```ts
// vi.ts
      consentMore:
        'Nếu bạn không đặt phòng, thông tin này được xóa khỏi máy chủ của OTTIMO trong tối đa 180 ngày. OTTIMO chỉ trả lời từ các kênh ghi trên trang này.',
```

`consent` (A.1) và nhãn `privacy` giữ nguyên. Hai câu trên trùng từng ký tự với `origin/lp-v2-fe5`.

### 1.4 Việc kèm cho FE-B / QA
- Test có nhãn cũ: `product/tests/e2e/landing/form-live.landing.spec.ts` (`NOTICE_VERSION = '2026-10-24'`) đổi sang `2026-10-31`. Các mốc giờ `2026-10-24T…` trong `booking.test.ts` là dữ liệu thử, không phải version, không cần đổi.
- UXD chỉ được chỉnh xuống dòng hiển thị. Đổi chữ nào thì gửi lại SEC (văn bản pháp lý, đổi chữ = đổi băm).
- QA đối chiếu **từng câu** trên trang dựng với mục 1.2–1.3 (so bằng script, không chỉ nhìn), rồi kiểm băm 2 trang như D1.

---

## 2. Δ5 – vì sao đưa vào, và chữ chốt

**Quyết định (quyền SEC – chữ thông báo):** đưa Δ5 vào `2026-10-31`.

| Xét | Kết quả |
|---|---|
| Việc có thật lúc đăng không? | Có. INV cho dùng từ 01/11, mọi màn hình Desk, không giới hạn (ESC-044, câu 9). Đợt 1 (`v1.0.1`) lên trước đợt 1b. Yêu cầu từ form en/vi cũng có thể bị dịch (dịch cả trang, dịch câu trả lời). |
| Nếu thiếu? | Thông báo bỏ sót một bên nhận ngoài Việt Nam đang được dùng. Phải đăng version mới ngay sau đó. |
| Nếu thừa (nhân viên không dịch)? | Câu viết "may use", nên vẫn đúng khi không dùng. |
| Có cần thêm gate kỹ thuật như ★2? | Không làm được: dịch là thao tác người dùng trên trình duyệt. Xem RR-N1 (mục 5). |

**Chữ chốt:**
- EN: `We may use a translation service, such as Google Translate, to read your request and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam.`
- VI: `OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc yêu cầu và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam.`

Khác L3 (`SEC-on-LP-v2-code.md` mục 3) **chỉ ở câu thứ ba**. Câu 1–2 giữ nguyên văn.

---

## 3. Bảng khác biệt so với `2026-10-24`

Câu không có trong bảng = giữ nguyên văn `2026-10-24`.

| Mã | Vị trí | `2026-10-24` | `2026-10-31` | Nguồn | Đổi nghĩa? |
|---|---|---|---|---|---|
| Δ1 | How we handle it / Cách xử lý – đoạn 1 | 2 câu: lưu trên máy chủ tại Việt Nam; chỉ lễ tân, quản lý, sales được giao xem được | + câu 3: một bản sao được đăng vào phòng trò chuyện nội bộ, như mô tả dưới đây | ESC-041 C | Có (dẫn sang Δ2) |
| Δ2 | Who else receives it / Bên khác nhận thông tin – đoạn 3 (mới) | không có | Google Chat (Google Workspace): dữ liệu gửi (tên, liên hệ, kênh, ngày ở, số khách, lời nhắn); chỉ quản lý và lễ tân; mục đích duy nhất là trả lời nhanh; máy chủ có thể ngoài Việt Nam; **không tự xóa**, xóa khi không còn cần hoặc khi khách yêu cầu | ESC-041 C, ESC-042 B (L2.1 phương án 2) | **Có** – bên nhận mới ngoài Việt Nam |
| Δ5 | Who else receives it – đoạn 4 (mới) | không có | Dịch vụ dịch (như Google Dịch): đọc và trả lời; có thể gồm tên, liên hệ, thông tin lưu trú, lời nhắn; xử lý theo chính sách riêng của họ; máy chủ có thể ngoài Việt Nam | ESC-044, INV 01/11 câu 9; L3 + vế mới (mục 2) | **Có** – bên nhận mới ngoài Việt Nam, không có hợp đồng xử lý dữ liệu |
| Δ3a | How long we keep it / Thời gian lưu – đoạn 2 | kết thúc ở "Backups expire within 35 days." | + `The one-way encrypted form of your IP address is deleted within 30 days.` | SEC `esc041…` 1.2 (3) | Không (thêm cam kết có lợi cho khách) |
| Δ3b | như trên, câu cuối | không có | + `These periods apply to our server; the copy in our staff chat is handled as described under “Who else receives it”.` | ESC-042 B, SEC-LP2-02 | **Có** – lời hứa 180 ngày thu hẹp còn máy chủ OTTIMO |
| Δ4 | Your rights / Quyền của bạn – đoạn 2, câu cuối | `…we stop contacting you and delete the request.` | `…delete the request, including any copy left in our staff chat.` | SEC `esc041…` 1.2 (4) | Không (thêm cam kết có lợi cho khách) |
| Δ6 | Form – `consentMore` (en.ts / vi.ts) | `If you do not book, we delete these details within 180 days.` | `…from our server within 180 days.` | SEC-LP2-01 (Major) | **Có** – cùng ý Δ3b |
| – | Footer | `Version 2026-10-24.` | `Version 2026-10-31.` | – | – |

Không đổi: ô đồng ý `consent` (A.1), mục Who we are, What we collect, Why, On what basis, Please note, Cookies, Complaints; đoạn 1–2 của Who else receives it; đoạn 1 của How long we keep it.

Không đưa vào `2026-10-31` (đúng quyết định trước):
- Câu đếm truy cập C+ (`esc041…` 1.2 (6)) – landing v1.2.0 chưa bật đếm.
- Ba khoảng trống (b) thông báo khách lưu trú, (c) hạn lưu hồ sơ khách, (d) tên cơ quan khiếu nại – giữ câu cũ (`esc041…` 1.2 (5)).
- Câu ô đồng ý dự phòng về Google Workspace (`esc041…` 1.2 (7)) – chỉ khi luật sư yêu cầu.

---

## 4. Câu cần luật sư xem

**Có cần luật sư xem lại không:** Có, **để tham khảo, không chặn phát hành** (ESC-041 cập nhật 30/10: luật sư đã xác nhận không vướng và tự lo phần pháp lý; luật sư sửa câu nào thì làm version kế tiếp, không gỡ trang đang chạy – SEC LP-v2 D5).

| # | Câu (mã ở mục 3) | Vì sao gửi | Đã có trong thư nào |
|---|---|---|---|
| L-1 | Δ1 + Δ2 – Google Chat | Bên nhận mới, máy chủ có thể ngoài Việt Nam; bản sao không có thời hạn xóa | Ghi chú 30/10 (`esc041…` mục 2, sửa theo L2.5 phương án 2). Phụ lục phải là chữ ở mục 1.2 của tệp này. |
| L-2 | Δ5 – dịch vụ dịch | Bên nhận mới ngoài Việt Nam, bản phổ thông không có hợp đồng xử lý dữ liệu; OTTIMO không xóa được bản ở đó | Thư LP-v2 câu 4 bản L3 (`SEC-on-LP-v2-code.md` mục 3, gồm (a)–(d)). **Nay thuộc `2026-10-31`**, INV có thể gửi câu 4 này ngay, không chờ thư LP-v2. Thêm vào câu (b): "câu thông báo nói dịch vụ xử lý nội dung theo chính sách riêng của họ – như vậy đã đủ báo cho khách rằng OTTIMO không xóa được bản đó chưa?" |
| L-3 | Δ3b + Δ6 – thời hạn 180 ngày chỉ cho máy chủ | Thu hẹp lời hứa so với bản luật sư đã đọc | Thư LP-v2 câu 3 (dòng dưới ô đồng ý). Thêm Δ3b vào cùng câu. |
| L-4 | Ô đồng ý `consent` giữ nguyên dù có 2 bên nhận mới ngoài Việt Nam | Ô đồng ý không nêu riêng việc gửi ra nước ngoài | Ghi chú 30/10 câu 4. Luật sư muốn đổi thì đổi cả `consent` + version mới. |

Δ3a và Δ4 thêm cam kết có lợi cho khách, không cần hỏi riêng; vẫn đính kèm cả văn bản để luật sư đọc liền mạch.

---

## 5. Điều kiện trước khi đăng (SEC kiểm, chặn tag `landing-v1.2.0`)

Mỗi câu phải đúng **tại lúc đăng**. Thiếu điều kiện nào thì không đăng, báo SEC.

| # | Điều kiện | Câu phụ thuộc | Ai |
|---|---|---|---|
| P1 | **K1 đạt**: quản lý phòng (OWN/MGR) xóa được tin do webhook "Desk OTTIMO" đăng và tin trong luồng; tìm được theo mã `REQ-…`. Kiểm trên phòng thật bằng yêu cầu "TEST OTTIMO" (ESC-046 mặc định). Không đạt → không đăng, SEC sửa Δ2/Δ4 | Δ2 câu cuối, Δ4 | INT, INV |
| P2 | `retention.web_request_ip_hmac_days` trên production ≤ 30 | Δ3a | OPS đọc, ghi vào báo cáo đợt 1b |
| P3 | Phòng Chat thật chỉ có OWN, MGR, FDL, FD, tài khoản @ottimo.vn (★4); không SAL/CTV | Δ2 "used only by our managers and reception"; Δ1 câu 2 | INV xác nhận |
| P4 | Sổ tay có: WR8 xóa tay tin Chat trong 24 giờ (L2.2); **xóa cả phòng Chat mỗi năm một lần** có ngày cố định trong lịch OWN (ESC-042 B) | Δ2 "We delete your copy when it is no longer needed…" | BA, INV |
| P5 | Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` = `'2026-10-31'` trên bản api đang chạy | ★2 | QA đọc mã tag |
| P6 | Deploy landing rồi `publish-privacy-notice` chạy thử → `--apply` cùng phiên SSH; `form-token` 200; băm 2 trang khớp | ★8 | OPS |

Ghi chú về mức A: lúc đăng, Chat có thể vẫn chạy mức A (chỉ mã, giờ, link). Δ1/Δ2 khi đó mô tả **nhiều hơn** việc đang làm. SEC chấp nhận: thông báo phải có trước khi bật C (★2, ★8), khách đồng ý trước; câu không hứa gì sai về quyền của khách. Nếu INV chọn giữ A lâu dài (ESC-046 phương án C), SEC soạn version gọn hơn ở lượt sau.

---

## 6. Rủi ro còn lại (mới hoặc đổi)

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| RR-N1 | Yêu cầu khách gửi theo `2026-10-24` (từ 30/10) vẫn có thể bị đem dịch; thông báo họ đã đọc không nêu dịch vụ dịch. Không có gate kỹ thuật như ★2 | Thấp | Số yêu cầu ít (chưa vận hành chính thức). Thuộc phạm vi INV chấp nhận ở ESC-044. Khuyến nghị (không bắt buộc, sổ tay): với yêu cầu có version `2026-10-24`, đọc trên Desk trước, chỉ dịch lời nhắn khi cần. |
| RR-N2 | Câu "xóa khi không còn cần" (ESC-042 B) chỉ được giữ bằng lịch xóa phòng hằng năm; quên thì câu thành sai | Thấp | P4. OWN rà cùng lúc rà thành viên hằng tháng (★4). |
| RR-N3 | Bản sao lưu off-site (máy phụ ở nhà cung cấp khác tại Việt Nam, đã mã hóa `age`) chưa được nêu tên như Nhân Hòa | Thấp | Không làm câu nào sai (dữ liệu vẫn ở Việt Nam, hạn 35 ngày vẫn đúng). Khi máy phụ chạy thật, SEC thêm vào version kế tiếp (LP-v2 `V3` nếu kịp). |
| RR-T1, RR-T3, RR-T4 | Như `lp-v2-privacy-and-api.md` L2.5 và `SEC-on-LP-v2-code.md` mục 6 | Giữ | RR-T4 (thông báo khách lưu trú chưa nêu việc dịch) vẫn mở, đợt 3. |

---

## 7. Hệ quả cho LP-v2 (không thuộc `2026-10-31`)

- en/vi của `V3` phải **trùng từng ký tự** với `2026-10-31` trên `main` sau khi gộp (chỉ khác nhãn). FE-B rebase `privacy.ts` en/vi từ `main`; thêm kiểm bằng script.
- FB-R4-SEC-FE-01: phần en/vi đóng khi rebase. ko/zh/ru đổi **câu thứ ba** của Δ5 theo vế mới (người bản xứ đọc cùng lượt D4):
  - ko: `이 서비스는 해당 내용을 자체 개인정보 처리방침에 따라 처리하며, 서버는 베트남 밖에 있을 수 있습니다.`
  - zh: `该服务按其自身的隐私政策处理这些内容，其服务器可能位于越南境外。`
  - ru: `Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.`
- Nhãn `V3` > `2026-10-31` (FB-R4-SEC-FE-02, D2) giữ.

---

## 8. Dòng decision-log đề xuất (ORC ghi khi gộp)

| 2026-11-01 | 4 | **SEC – chốt chữ thông báo `2026-10-31` (en, vi)** (`rounds/round-04/outputs/SEC/notice-2026-10-31-final.md`): Δ1–Δ4 + Δ6 như bảng Δ (ESC-041 C, ESC-042 B, SEC-LP2-01/02); **Δ5 (dịch vụ dịch) đưa vào `2026-10-31`** vì INV cho dùng Google Dịch trên mọi màn hình Desk từ 01/11 – thêm vế "dịch vụ xử lý theo chính sách riêng" để Δ4 không hứa xóa bản ở dịch vụ dịch. Nhãn giữ `2026-10-31`. Đăng chỉ khi đủ P1–P6 (K1, IP ≤ 30 ngày, thành viên phòng, lịch xóa phòng hằng năm, hằng ★2, ghi version cùng phiên SSH). Luật sư xem tham khảo 4 nhóm câu, không chặn. LP-v2: en/vi `V3` = chữ này; ko/zh/ru sửa câu 3 của Δ5. | SEC | Quyền SEC (chữ thông báo, yêu cầu kỹ thuật); nội dung theo ESC-041/042/044 do INV quyết |

---

## 9. Giả định
- G1: Desk `v1.0.1` (đợt 1) lên production trước đợt 1b, và nhân viên có thể dùng Google Dịch từ lúc đó.
- G2: Renderer mức C trên `main` sau khi gộp PR #16 giữ đúng 6 nhóm trường đã đối chiếu (không hạng phòng, không IP). Đổi trường → SEC xem lại Δ2.
- G3: K1 sẽ được kiểm trên phòng thật bằng yêu cầu thử; SEC chưa tự kiểm trên Google Chat thật.
- G4: Thư/ghi chú luật sư 30/10 đã hoặc sẽ được INV gửi; luật sư trả lời thì chuyển nguyên văn cho ORC.
