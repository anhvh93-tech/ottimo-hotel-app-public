# SEC – LP-v2: thông báo xử lý dữ liệu tiếng Hàn / Trung giản thể / Nga + rủi ro API giá ước tính công khai

- Tác giả: SEC | Round 4 – gói LP-v2, Bước: Sản xuất (lượt A) | Ngày 01/11/2026
- Căn cứ: `rounds/round-04/plan-lp-v2.md` (G1–G5); FB-INV-008, FB-INV-009; ESC-041 (C, chạy từ v1.0.1), ESC-042 (B); `rounds/round-03/outputs/SEC/esc041-gchat-full-details.md` mục 1.2 và L2; `product/apps/landing-web/src/content/privacy.ts` (version `2026-10-24` đang chạy); `product/infra/server/bin/publish-privacy-notice.sh` + `.sql`; migration `0086_public_site_us155.sql`; `Caddyfile.landing`; DOM `rounds/round-04/outputs/DOM/web-price-estimate-rules.md` và DOM ESC-043 (đọc lúc 01/11, bản đang soạn song song).
- Không sửa mã, không commit. Không có dữ liệu khách thật, URL webhook, khóa hay mật khẩu trong tệp này. Mọi câu về luật là **câu hỏi cho luật sư**, không phải kết luận pháp lý. Thiết kế ARC `rounds/round-04/outputs/ARC/lp-v2-design.md` chưa có lúc viết; mục 9 là yêu cầu độc lập để ARC đối chiếu.

> **Lượt 2 (01/11, Phản hồi & sửa) thay các chỗ mâu thuẫn bên dưới.** INV quyết ESC-044 = cho phép dịch **không giới hạn**, và ESC-043 = **không hiện giá tháng** trên web. Chỗ nào ở mục 0, 3 (Δ5), 4–6 (câu Δ5), 8 (thư luật sư), 9 (giá tháng) nói khác thì đọc theo mục **L2** ngay dưới.

## L2. Lượt 2 – theo quyết định INV ngày 01/11

### L2.1 Quyết định đầu vào
- **ESC-044:** INV chọn "Cho phép, ko giới hạn". Lễ tân được dùng công cụ dịch bên ngoài (Google Dịch…) cho nội dung khách gửi. Không bắt buộc bỏ tên/liên hệ. INV chịu trách nhiệm. Câu Δ5 nay là **bắt buộc** trong `V3` (không còn "chỉ khi A") và phải nói đúng: nội dung đem dịch có thể gồm tên, liên hệ và lời nhắn.
- **ESC-043:** web **không hiện giá tháng**. Bỏ dòng "khách hộ chiếu nước ngoài". Bỏ câu hỏi luật sư về giá theo giấy tờ.

### L2.2 Câu Δ5 mới – thay câu Δ5 ở mục 3 và ở mục 4, 5, 6
Vị trí giữ nguyên: đoạn cuối mục "Who else receives it" (sau đoạn Google Chat), ở cả 5 ngôn ngữ của `V3`.

| Ngôn ngữ | Câu |
|---|---|
| EN | `If you write in a language our team does not read, we may use a translation service, such as Google Translate, to understand your request. The text we translate may include your name, contact and message. The service's servers may be outside Viet Nam.` |
| VI | `Nếu bạn viết bằng ngôn ngữ nhân viên OTTIMO không đọc được, OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để hiểu yêu cầu của bạn. Nội dung được dịch có thể gồm tên, liên hệ và lời nhắn của bạn. Máy chủ của dịch vụ này có thể đặt ngoài Việt Nam.` |
| ko | `저희 직원이 읽지 못하는 언어로 작성하신 경우, 요청 내용을 이해하기 위해 Google 번역 같은 번역 서비스를 이용할 수 있습니다. 번역하는 내용에는 고객님의 성함, 연락처, 메시지가 포함될 수 있습니다. 이 서비스의 서버는 베트남 밖에 있을 수 있습니다.` |
| zh | `如果您使用我们的员工无法阅读的语言填写，我们可能会使用 Google 翻译等翻译服务来理解您的申请。翻译的内容可能包括您的姓名、联系方式和留言。该服务的服务器可能位于越南境外。` |
| ru | `Если вы пишете на языке, которого не знают наши сотрудники, мы можем воспользоваться сервисом перевода, например, Google Переводчиком, чтобы понять ваш запрос. Переводимый текст может включать ваше имя, контакт и сообщение. Серверы этого сервиса могут находиться за пределами Вьетнама.` |

Trong khối `ts` ở mục 4–6, comment `// Δ5 – chỉ khi ESC-044 = A` đổi thành `// Δ5 – ESC-044 (INV 01/11)`, câu thay bằng câu ở bảng trên. Các câu khác của thông báo **không đổi**. Câu "Only our reception, our managers and the sales staff… can see them" vẫn đúng: câu này nói về máy chủ OTTIMO; bên ngoài nhận dữ liệu được liệt kê ở "Who else receives it".

Không chọn cách viết "we never translate your name…": INV không giới hạn, nên câu đó sẽ hứa quá việc làm thật.

### L2.3 API giá ước tính – sửa theo ESC-043 (thay chỗ tương ứng ở mục 9)
- 9.2 cột "Được trả": **bỏ** "phí dịch vụ tháng", "mức 'từ' giá tháng (và dòng hộ chiếu nước ngoài…)". Cột "Không bao giờ trả": **thêm** "mọi giá tháng (tiền thuê, phí dịch vụ, giảm kỳ hạn, phụ thu +10 % BR-109)".
- **SR-PE-19 (Must, mới):** phản hồi công khai không có số nào cho thuê theo tháng. Yêu cầu `stayKind = long`/có `months` → trả một trạng thái không có số (ARC đặt tên, ví dụ `quote_only`), hoặc 400 nếu ARC chọn không nhận tham số tháng. Không tính giá tháng phía server cho route này. Snapshot của POST yêu cầu dài hạn không lưu giá tháng (nếu DOM vẫn muốn lưu cho lễ tân thì tính trong Desk, không qua route công khai).
- SR-PE-02: bỏ vế "(ESC-043 câu 2 A hiện cả hai dòng, không cần hỏi)". Luật "không bao giờ hỏi quốc tịch/giấy tờ" **giữ**.
- 9.5 thêm **ca 12:** gọi với `months=6` → không có trường tiền nào trong JSON.

### L2.4 Thư luật sư – bản thay mục 8 (bỏ câu 5 cũ, sửa câu 4, đánh số lại)

Ghi chú cho INV ở đầu mục 8: bỏ câu "DOM có câu hỏi về giá theo giấy tờ… đã gộp ở câu 5". Phần thân thư giữ đoạn mở, câu 1–3 như mục 8; **câu 4 thay bằng**:

4. **Công cụ dịch.** Khi khách viết bằng ngôn ngữ nhân viên không đọc được, nhân viên dùng dịch vụ dịch bên ngoài (ví dụ Google Dịch, bản dành cho người dùng phổ thông, không có hợp đồng xử lý dữ liệu riêng) để hiểu yêu cầu. Nội dung đem dịch có thể gồm tên, liên hệ và lời nhắn. Nhân viên có thể dịch cả trang bằng tính năng dịch của trình duyệt. Máy chủ của dịch vụ có thể ngoài Việt Nam. Thông báo thêm câu đính kèm (5 ngôn ngữ). (a) Việc này có thuộc diện chuyển dữ liệu cá nhân ra nước ngoài, cần đưa vào hồ sơ (nếu có) cùng Google Workspace không? (b) Câu thông báo đã đủ chưa? (c) Dùng bản dịch vụ không có hợp đồng xử lý dữ liệu có vướng nghĩa vụ của bên kiểm soát dữ liệu không?

**Câu 5 cũ (giá theo giấy tờ) bỏ.** **Câu 6 cũ (luật nước ngoài) thành câu 5**, giữ nguyên chữ. Câu "giá chỉ bằng VND" trong câu đó vẫn đúng. Phần "Đính kèm" giữ nguyên.

### L2.5 Rủi ro còn lại INV chấp nhận (ESC-044, 01/11)
| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| RR-T1 | Tên, liên hệ, lời nhắn của khách được gửi tới dịch vụ dịch bên ngoài, máy chủ có thể ngoài Việt Nam. Bản phổ thông không có hợp đồng xử lý dữ liệu, nên bên cung cấp xử lý theo chính sách của họ (có thể lưu hoặc dùng để cải thiện dịch vụ). OTTIMO không xóa được bản đó khi khách xin xóa (WR8). | Trung bình | **INV chấp nhận 01/11.** Thông báo `V3` nêu việc này (L2.2). Pháp lý: luật sư xem (thư câu 4). |
| RR-T2 | Tính năng "Dịch trang này" của trình duyệt trên các màn hình **danh sách** của Desk gửi dữ liệu của **nhiều khách cùng lúc**, kể cả khách OTA và khách đang ở, những người không đọc thông báo website. | Trung bình | **INV chấp nhận** trong phạm vi "nội dung khách gửi". SEC khuyến nghị (không bắt buộc, sổ tay): dịch trên màn hình **một yêu cầu**, không dịch trang danh sách. |
| RR-T3 | Màn hình **giấy tờ tùy thân / thanh toán** của Desk (dữ liệu rất nhạy cảm) bị dịch cả trang. | Cao nếu xảy ra | **SEC hiểu quyết định ESC-044 chỉ áp cho nội dung khách gửi, không gồm giấy tờ và thanh toán.** Sổ tay giữ luật: không dịch các màn hình này. FE-A nên thêm `translate="no"` cho các vùng đó ở v1.1. Việc này không cản dịch lời nhắn. **ORC xác nhận cách hiểu này với INV**; nếu INV muốn bao cả giấy tờ thì SEC mở ESC riêng. |
| RR-T4 | Thông báo cho khách lưu trú (`privacy-2026-10-v2`, trên Desk/app) chưa nêu việc dịch. Áp dụng nếu nhân viên dịch tin nhắn của khách đang ở qua Zalo. | Thấp | Đưa vào version kế tiếp của thông báo khách lưu trú (v1.1, SEC). |

Mục 0 dòng "ESC mới" và mục 11 phần ESC-044 nay đọc là: **ESC-044 đã quyết 01/11 – cho phép không giới hạn, INV chấp nhận RR-T1, RR-T2.**

### L2.6 Dòng decision-log đề xuất (Lượt 2)
| 2026-11-01 | 4 | **SEC – LP-v2 Lượt 2 theo ESC-044 và ESC-043 (INV 01/11)**. Thông báo `V3` (5 ngôn ngữ) có câu bắt buộc về dịch vụ dịch: nội dung đem dịch có thể gồm tên, liên hệ, lời nhắn; máy chủ có thể ngoài Việt Nam. Thư luật sư: câu 4 sửa theo thực tế mới, bỏ câu giá theo giấy tờ. INV chấp nhận RR-T1 (bên dịch không có hợp đồng xử lý dữ liệu, không xóa được khi khách xin xóa) và RR-T2 (dịch cả trang danh sách). SEC giữ luật: không dịch cả trang các màn hình giấy tờ/thanh toán (RR-T3, chờ ORC xác nhận với INV). API giá: SR-PE-19, không trả giá tháng. | SEC | ESC-044, ESC-043 do INV quyết; phần còn lại thuộc quyền SEC |

---

## 0. Kết luận nhanh

| Câu | SEC chốt |
|---|---|
| ko/zh/ru đăng cùng version nào | **Không bao giờ** đăng dưới `2026-10-24`, và **không gắn thêm** vào `2026-10-31` sau khi bản này đã đăng. LP-v2 đăng **một version mới cho cả 5 ngôn ngữ cùng lúc** (gọi tạm `V3`, nhãn = ngày chốt chữ LP-v2, ví dụ `2026-11-0X`). Lý do: nút chọn ngôn ngữ và `hreflang` làm đổi byte trang `/privacy/` và `/vi/privacy/`, mà luật FB-01 cấm đổi byte khi giữ version (mục 2.2). Nếu landing của v1.0.1 và LP-v2 phát hành chung một lượt thì dùng luôn `2026-10-31` cho 5 ngôn ngữ. |
| Câu ưu tiên bản dịch | Chỉ trên trang ko/zh/ru: "Đây là bản dịch. Nếu khác với bản tiếng Anh hoặc tiếng Việt, áp dụng bản tiếng Anh và tiếng Việt." Hỏi luật sư có nên chọn riêng tiếng Việt (mục 2.5, thư câu 2). |
| Bản dịch | Đã soạn đủ 3 ngôn ngữ: văn bản `V3`/`2026-10-31` đầy đủ, dạng chép thẳng vào `privacy.ts` (mục 4–6), kèm các câu khác của `2026-10-24` (Δ) và chữ ô đồng ý (mục 7). **Người bản xứ đọc lại là điều kiện chặn phát hành** từng ngôn ngữ. |
| Phát hiện ảnh hưởng **v1.0.1** (không chỉ LP-v2) | **Major:** dòng nhỏ dưới ô đồng ý (`consentMore`) hứa "we delete these details within 180 days". Theo ESC-042 B, bản sao trong Google Chat không có thời hạn → câu này thành sai ở mức C. Sửa trong `2026-10-31`: "…from our server within 180 days" (mục 1). |
| ESC mới | **ESC-044** – lễ tân dán lời nhắn tiếng Hàn/Trung/Nga vào công cụ dịch (Google Dịch…) = thêm một bên nhận ngoài Việt Nam mà thông báo chưa nêu. Đề xuất A (cho phép, chỉ lời nhắn, ghi vào thông báo `V3`). Mặc định A nếu chưa trả lời. |
| API giá ước tính | Làm được với mức rủi ro còn lại **Thấp**, nếu đủ 14 yêu cầu Must (SR-PE-01…14, mục 9.4). Ba điểm SEC khác bản DOM: **không trả `toTotal`** và **không nhận số tiền từ trình duyệt** (server tự tính lại khi nhận yêu cầu); dòng chi tiết **theo nhóm, không gắn ngày**; cảnh báo "căn thiếu giá" gửi OWN **tối đa 1 lần/căn/ngày** (tránh dùng API công khai để spam thông báo). |
| Luật nước ngoài | Câu hỏi mới cho luật sư: trang tiếng Trung/Nga/Hàn có làm OTTIMO bị coi là "nhắm tới" thị trường đó (PIPL Trung Quốc, Luật 152-FZ Nga về lưu dữ liệu công dân Nga tại Nga, PIPA Hàn Quốc) không. Đội giảm tín hiệu: chỉ VND, không tên miền/quảng cáo nước đó trong gói này. |

---

## 1. Phát hiện cho v1.0.1 – sửa trước khi chốt `2026-10-31`

**SEC-LP2-01 – Major – `product/apps/landing-web/src/content/en.ts` / `vi.ts`, khóa `form.consentMore`**
- Vấn đề: câu hiện tại EN `If you do not book, we delete these details within 180 days.` / VI `Nếu bạn không đặt phòng, OTTIMO xóa thông tin này trong tối đa 180 ngày.` Ở mức C (ESC-041), tên, liên hệ, lời nhắn được chép vào phòng Google Chat; ESC-042 B chốt **không nêu thời hạn** cho bản sao này, xóa cả phòng mỗi năm một lần. Vậy câu ngay dưới ô đồng ý hứa nhiều hơn việc OTTIMO làm. Bản `esc041-gchat-full-details.md` 1.2 (7) của SEC ghi "Giữ" – viết trước khi INV chọn B, nay sai.
- Sửa (vào **cùng** version `2026-10-31`, vì comment đầu `privacy.ts` quy định đổi A.1/A.2 → version mới; `2026-10-31` chưa đăng nên gộp được):
  - EN: `If you do not book, we delete these details from our server within 180 days. We reply only from the channels listed on this page.`
  - VI: `Nếu bạn không đặt phòng, thông tin này được xóa khỏi máy chủ của OTTIMO trong tối đa 180 ngày. OTTIMO chỉ trả lời từ các kênh ghi trên trang này.`
- Ai: FE-B (v1.0.1 landing), UXD duyệt giọng. QA đối chiếu chữ. Câu `consent` (A.1) giữ nguyên.

**SEC-LP2-02 – Minor – đoạn 2 "How long we keep it" của `2026-10-31`**
- L2.1 phương án 2 ghi câu `This period applies to our server; …` "thêm cuối đoạn 2". Cuối đoạn 2 lúc đó là câu IP băm 30 ngày, nên "This period" sẽ bị hiểu là 30 ngày. Chốt chữ: dùng số nhiều và đặt cuối cùng.
  - EN: `These periods apply to our server; the copy in our staff chat is handled as described under “Who else receives it”.`
  - VI: `Các thời hạn này áp dụng cho máy chủ của OTTIMO; bản sao trong phòng trò chuyện nội bộ được xử lý như mô tả ở mục “Bên khác nhận thông tin”.`
- Nghĩa không đổi so với quyết định INV ở ESC-042 B; chỉ sửa câu chữ (quyền SEC).

---

## 2. Chiến lược version

### 2.1 Hiện trạng
| Version | Ngôn ngữ | Trạng thái |
|---|---|---|
| `2026-10-24` | en, vi | Đang chạy trên ottimo.vn từ 30/10, đã ghi bằng `publish-privacy-notice --apply`, băm `d35d2810…` / `940bd18b…`. |
| `2026-10-31` | en, vi | Đang soạn cho v1.0.1 (ESC-041 C + ESC-042 B + 2 sửa ở mục 1). Chưa có trong `privacy.ts`. Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-10-31'` của ARC/BE đã dùng nhãn này. |
| `V3` (LP-v2) | en, vi, ko, zh, ru | Tệp này. |

**Nhãn `2026-10-31` giữ nguyên** dù chữ chốt muộn hơn ngày 31/10: nó đã được nối vào hằng ★2 và test của BE; nhãn chỉ là định danh, thứ tự thời gian do `published_at` quyết.

### 2.2 Hệ quả của FB-01 ("một (version, locale) = một chuỗi byte", băm cả tệp HTML)
1. Bất kỳ thay đổi byte nào trên trang privacy (nút chọn ngôn ngữ thêm ko/zh/ru, thẻ `hreflang`, tên tệp CSS có băm đổi vì thêm `@font-face` cho chữ Hàn/Trung/Nga, chân trang) → **phải có version mới** cho trang đó. LP-v2 chắc chắn đổi byte trang en/vi → `V3` là bắt buộc, không phải lựa chọn.
2. Không thể "thêm ko/zh/ru vào `2026-10-31`" ở một lượt landing sau: trang en/vi của lượt sau đã khác byte so với bản đã ghi `2026-10-31` → `deploy-landing.sh` từ chối (đúng thiết kế).
3. Không thể đăng ko/zh/ru dưới `2026-10-24`: SQL từ chối đăng version cũ khi đã có version sau đang hiệu lực, và chữ `2026-10-24` thiếu đoạn Google Chat trong khi tin Chat mức C đã chạy.

### 2.3 Quyết định SEC (quyền SEC – yêu cầu kỹ thuật về thông báo)
- **D1 – Đồng bộ (lockstep):** mỗi lượt landing có đổi trang privacy đăng **một** version cho **mọi** ngôn ngữ đang phát hành, trong **một** giao dịch `publish-privacy-notice`. Form ở mọi ngôn ngữ gửi cùng `consentVersion`. Mở rộng luật ARC-17 ("vi và en cùng version") ra 5 ngôn ngữ. Lý do: một mốc để luật sư, QA, ★2 và sổ xóa cùng nhìn; công cụ ghi đơn giản; sửa một lỗi chính tả tiếng Hàn = version mới cho cả 5, chấp nhận vì việc ghi đã tự động.
- **D2 – Thứ tự:**
  - Trường hợp dự kiến: landing v1.0.1 đăng `2026-10-31` (en, vi) trước; LP-v2 đăng `V3` (5 ngôn ngữ) sau, nhãn = ngày chốt chữ LP-v2, phải **lớn hơn** `2026-10-31`; trùng ngày với một lần đăng khác thì thêm `.1`.
  - Nếu hai lượt gộp thành một: một version `2026-10-31` cho 5 ngôn ngữ, không có `V3`.
  - LP-v2 **không** phát hành trước khi `2026-10-31` (hoặc chữ tương đương) đã sẵn sàng: mọi version sau `2026-10-31` phải giữ đoạn Google Chat (**luật đơn điệu**), nếu không ★2 sẽ gửi chi tiết khách vào Chat cho người đọc một thông báo không nói việc đó.
- **D3 – Chữ en/vi của `V3`** = chữ `2026-10-31` + (nếu INV chọn ESC-044 A) một câu về công cụ dịch. Không thêm câu nào khác. Đã xét và **không** thêm câu "giá ước tính khách đã thấy" vào "What we collect": đó là số suy từ ngày + hạng đã liệt kê, không phải dữ liệu về con người (với điều kiện SR-PE-11).
- **D4 – Phát hành từng ngôn ngữ:** người bản xứ chưa duyệt ngôn ngữ nào thì **dời cả ngôn ngữ đó** (trang chủ, form, privacy, 404). Không phát hành trang tiếng Hàn kèm thông báo chưa duyệt, không trỏ form tiếng Hàn sang thông báo tiếng Anh (FK `consent_version + locale` không cho, và ghi sai ngôn ngữ khách đã đọc – tiền lệ decision-log 17/10 về RU). Thêm một ngôn ngữ ở lượt sau = version mới cho cả 5 (D1).
- **D5 – Sửa sau khi đăng:** người bản xứ hoặc luật sư sửa câu nào sau khi đăng → version kế tiếp, không gỡ trang đang chạy (giống mục 1.3 bước 5 bản ESC-041).

### 2.4 Việc kỹ thuật kèm theo (cho ARC duyệt, OPS/BE/FE làm – mức **Must** cho LP-v2)
| # | Việc | Ai |
|---|---|---|
| SR-LC-01 | Migration chỉ thêm: CHECK `locale` của `privacy_notice_version` và `website_booking_request` nhận thêm `ko`, `zh` (`ru` đã có). Mã locale trong DB/URL: `ko`, `zh`, `ru`; HTML `lang`/`hreflang` là `ko`, `zh-Hans`, `ru` (FE/ARC chốt, nhất quán). | BE, ARC |
| SR-LC-02 | API form nhận `locale` theo enum 5 giá trị. Không có dòng `privacy_notice_version` (consentVersion, locale) đang hiệu lực → **422 `PUBLIC_FORM_NOT_READY`**, không để lỗi FK thành 500. | BE |
| SR-LC-03 | ★2 (`CHAT_DETAILS_MIN_NOTICE_VERSION`) đúng cho mọi locale: so theo `published_at` của dòng (version, locale) khách đã đồng ý. Test: yêu cầu `ko` + `V3` + mức C → có chi tiết; yêu cầu `en` + `2026-10-24` + mức C → mẫu A. | BE, QA |
| SR-LC-04 | `publish-privacy-notice.sh/.sql` bỏ danh sách cố định `vi`,`en`: đọc danh sách locale + đường dẫn từ một manifest trong image (ví dụ `/srv/landing/privacy-manifest.json` do build sinh); đọc version qua thuộc tính máy đọc `data-notice-version="…"` trên trang (thay vì grep chữ "Version"/"Phiên bản" – ko "버전", zh "版本", ru "Версия"); kiểm băm **khác nhau từng đôi**; kiểm `data-consent-version` trên trang chủ của mọi locale; một giao dịch cho mọi locale; supersede theo từng locale; audit liệt kê đủ locale + băm. Thiếu một locale có trong manifest → từ chối cả lượt. Test OPS thêm ca 5 locale và ca thiếu 1 locale. | OPS, ARC duyệt, SEC duyệt lại |
| SR-LC-05 | `deploy-landing.sh` (FB-01) kiểm mọi locale trong manifest. | OPS |
| SR-LC-06 | Caddy: bỏ chặn `/ru`, mở `/ko`, `/zh` chỉ khi build có locale đó; locale chưa phát hành vẫn 404; `check-caddy-landing.sh` thêm ca. | OPS, FE-B |
| SR-LC-07 | Font chữ Hàn/Trung/Nga **tự host** (CSP `font-src 'self'` đã khóa). Không Google Fonts/CDN: câu "loads nothing from other companies" trong thông báo phải còn đúng. | UXD, FE-B |
| SR-LC-08 | Thêm kênh trả lời mới trong form (KakaoTalk, WeChat, LINE, Telegram…) = phải sửa thông báo (tên bên truyền tin, máy chủ ngoài VN) → version mới. Không thêm kênh mà không qua SEC. | PO, SEC |

### 2.5 Câu ưu tiên giữa các bản
- Đặt **chỉ trên trang ko/zh/ru**, ngay dưới đoạn mở đầu (đề xuất FE thêm trường tùy chọn `translationNote?: string` vào `PrivacyCopy`):
  - EN gốc (để đối chiếu): `This is a translation. If it differs from the English or Vietnamese version, the English and Vietnamese versions apply.`
  - ko: `이 문서는 번역본입니다. 영어 또는 베트남어 원문과 다른 부분이 있으면 영어 및 베트남어 원문이 적용됩니다.`
  - zh: `本页为译文。如与英文或越南文版本有出入，以英文和越南文版本为准。`
  - ru: `Это перевод. Если он расходится с английской или вьетнамской версией, применяются английская и вьетнамская версии.`
- Không thêm câu ưu tiên vào trang en/vi trong `V3` (giữ chữ đã gửi luật sư). Hai câu hỏi để luật sư quyết (thư câu 2): có nên chỉ để **tiếng Việt** là bản chính; và câu này có bị coi là bất lợi cho người tiêu dùng không (điều khoản không rõ thường được giải thích theo hướng có lợi cho người tiêu dùng). Dù câu nói gì, **chất lượng bản dịch mới là biện pháp bảo vệ thật** → người bản xứ đọc là chặn (D4).

### 2.6 Quy trình phát hành `V3`
1. INV trả lời ESC-044 (hoặc dùng mặc định A) → SEC chốt chữ en/vi `V3`.
2. Người bản xứ (INV mời) đọc ko/zh/ru: đối chiếu **nghĩa** với bản EN, không viết lại nội dung. Sửa gửi về SEC; SEC sửa trong tệp này, ghi ai đọc (vai, không tên) và ngày.
3. FE-B chép vào `privacy.ts` + `consent`/`consentMore` ở tệp chữ từng ngôn ngữ; đặt `VERSION` = nhãn `V3`.
4. CI: `check:dist`, Playwright, kiểm 5 trang privacy hiện đúng version; QA đối chiếu chữ trên trang với mục 4–7 tệp này (so từng câu, không chỉ nhìn).
5. INV gửi luật sư thư mục 8 + bản dịch (tham khảo, **không chặn**, giống `2026-10-31`).
6. OPS `publish-privacy-notice` (bản mở rộng SR-LC-04), chạy thử rồi `--apply`; dòng `2026-10-31` của en/vi được `superseded_at`.
7. SEC ghi một dòng decision-log xác nhận băm 5 trang.

---

## 3. Văn bản nguồn EN/VI dùng để dịch (`V3` = `2026-10-31` + câu ESC-044)

Các câu **không ghi chú** = nguyên văn `2026-10-24` trong `privacy.ts`. Các câu khác:

| Mã | Vị trí | `2026-10-24` | `2026-10-31` / `V3` |
|---|---|---|---|
| Δ1 | How we handle it, đoạn 1 | 2 câu | + `To alert the team on duty, a copy of your request is also posted to our private staff chat, as described below.` |
| Δ2 | Who else receives it, đoạn 3 | không có | Đoạn Google Chat (L2.1 + câu cuối phương án 2 – ESC-042 B) |
| Δ3 | How long we keep it, đoạn 2 | kết thúc ở "Backups expire within 35 days." | + `The one-way encrypted form of your IP address is deleted within 30 days.` + câu "These periods…" (mục 1, SEC-LP2-02) |
| Δ4 | Your rights, đoạn 2, câu cuối | `…we stop contacting you and delete the request.` | `…delete the request, including any copy left in our staff chat.` |
| Δ5 | Who else receives it, đoạn 4 | không có | **Chỉ `V3`, chỉ khi ESC-044 = A:** câu công cụ dịch |
| Δ6 | ô đồng ý `consentMore` | `…within 180 days.` | `…from our server within 180 days.` (mục 1) |
| Δ7 | ko/zh/ru | – | câu ưu tiên bản dịch (mục 2.5) |

Câu Δ5 nguồn:
- EN: `If you write in a language our team does not read, we may copy your message – without your name or contact – into a translation service, such as Google Translate, to understand it. Its servers may be outside Viet Nam.`
- VI: `Nếu bạn viết bằng ngôn ngữ nhân viên OTTIMO không đọc được, OTTIMO có thể chép lời nhắn của bạn – không kèm tên và liên hệ – vào một dịch vụ dịch, như Google Dịch, để hiểu nội dung. Máy chủ của dịch vụ này có thể đặt ngoài Việt Nam.`

Ghi chú dịch chung: giữ nguyên chữ Latinh cho OTTIMO Boutique Stay, Google Workspace, Google Chat, Zalo (VNG), WhatsApp (Meta), Nhân Hòa, tên pháp nhân và địa chỉ (`${legal.*}` lấy từ `site.ts`, không dịch). Giọng: ngắn, lịch sự, điềm tĩnh, không emoji; tiếng Hàn dùng 합니다체 và "고객님"; tiếng Trung dùng "您"; tiếng Nga dùng "вы" viết thường (chuẩn văn bản thông báo công khai). Tên mục trong câu tham chiếu (Δ3) phải trùng **chính xác** tiêu đề mục ở cùng ngôn ngữ. `anchor` của cả ko/zh/ru dùng `booking-requests` (ASCII, tránh lỗi mã hóa link từ form).

---

## 4. Tiếng Hàn (`ko`) – `V3` đầy đủ

```ts
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
        // Δ5 – chỉ khi ESC-044 = A
        '저희 직원이 읽지 못하는 언어로 작성하신 경우, 내용을 이해하기 위해 성함과 연락처를 제외한 메시지만 Google 번역 같은 번역 서비스에 입력할 수 있습니다. 이 서비스의 서버는 베트남 밖에 있을 수 있습니다.',
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
```

**Câu của `2026-10-24` (chỉ để đối chiếu, không đăng):** Δ1 = hai câu đầu của đoạn; Δ2, Δ5 không có; Δ3 kết thúc ở `백업은 35일 이내에 만료됩니다.`; Δ4 câu cuối = `동의를 철회하시면 연락을 중단하고 요청을 삭제합니다.`

---

## 5. Tiếng Trung giản thể (`zh`) – `V3` đầy đủ

```ts
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
        // Δ5 – chỉ khi ESC-044 = A
        '如果您使用我们的员工无法阅读的语言留言，我们可能会将您的留言（不含姓名和联系方式）复制到 Google 翻译等翻译服务中，以理解其内容。该服务的服务器可能位于越南境外。',
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
```

**Câu của `2026-10-24` (đối chiếu):** Δ1 = hai câu đầu; Δ2, Δ5 không có; Δ3 kết thúc ở `备份在 35 天内过期。`; Δ4 câu cuối = `如您撤回同意，我们将停止联系您并删除该申请。`

---

## 6. Tiếng Nga (`ru`) – `V3` đầy đủ

```ts
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
        // Δ5 – chỉ khi ESC-044 = A
        'Если вы пишете на языке, которого не знают наши сотрудники, мы можем скопировать ваше сообщение — без имени и контактов — в сервис перевода, например Google Переводчик, чтобы понять его. Серверы этого сервиса могут находиться за пределами Вьетнама.',
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
```

**Câu của `2026-10-24` (đối chiếu):** Δ1 = hai câu đầu; Δ2, Δ5 không có; Δ3 kết thúc ở `Резервные копии истекают в течение 35 дней.`; Δ4 câu cuối = `Если вы отзываете согласие, мы прекращаем связываться с вами и удаляем запрос.`

---

## 7. Chữ ô đồng ý trên form (A.1 `consent`, A.2 `consentMore`, nhãn link)

Thuộc văn bản pháp lý (comment đầu `privacy.ts`), SEC soạn, CPY không viết lại nghĩa; UXD chỉ chỉnh xuống dòng/độ dài.

| Khóa | ko | zh | ru |
|---|---|---|---|
| `consent` | 이 양식의 정보를 OTTIMO가 이 요청에 답변하는 데에만 사용하는 것에 동의합니다. | 我同意 OTTIMO 仅将本表单中的信息用于回复本次申请。 | Я даю согласие OTTIMO использовать данные из этой формы только для ответа на этот запрос. |
| `consentMore` (`V3`, Δ6) | 예약하지 않으시면 이 정보는 180일 이내에 OTTIMO 서버에서 삭제됩니다. 답변은 이 페이지에 안내된 채널로만 드립니다. | 如您未预订，我们会在 180 天内从我们的服务器删除这些信息。我们只会通过本页列出的渠道回复您。 | Если вы не забронируете номер, мы удалим эти данные с нашего сервера в течение 180 дней. Мы отвечаем только через каналы, указанные на этой странице. |
| `consentMore` (`2026-10-24`, đối chiếu) | 예약하지 않으시면 이 정보는 180일 이내에 삭제됩니다. 답변은 이 페이지에 안내된 채널로만 드립니다. | 如您未预订，我们会在 180 天内删除这些信息。我们只会通过本页列出的渠道回复您。 | Если вы не забронируете номер, мы удалим эти данные в течение 180 дней. Мы отвечаем только через каналы, указанные на этой странице. |
| `privacy` (nhãn link) | 개인정보 처리 안내 | 隐私声明 | Уведомление о конфиденциальности |

Câu tiếng Nga dùng "Я даю согласие" để không phải chia giống (согласен/согласна).

---

## 8. Thư ngắn để INV gửi luật sư (kèm bản dịch)

> **Ghi chú cho anh/chị (INV) – không gửi phần này.** Giống thư 30/10: để luật sư tham khảo, **không chặn** phát hành. Đính kèm mục 3 (bảng Δ, EN/VI), mục 4–7 (bản dịch). DOM có câu hỏi về giá theo giấy tờ (ESC-043 câu 2) – đã gộp ở câu 5 để anh/chị gửi một thư. Không đính kèm dữ liệu khách, URL webhook hay mật khẩu. Có trả lời thì chuyển nguyên văn cho ORC.

---

**Kính gửi Luật sư ……………………,**

Bổ sung cho các thư ngày 26/10 và 30/10/2026, OTTIMO Boutique Stay (Công ty Cổ phần UTMG Living, MST 5801551657) dự kiến thêm **tiếng Hàn, tiếng Trung giản thể và tiếng Nga** cho website ottimo.vn sau ngày 02/11/2026, kèm bản dịch thông báo xử lý dữ liệu của form "Yêu cầu đặt phòng". Bản dịch do đội kỹ thuật làm và người bản xứ đọc lại; nội dung không đổi so với bản tiếng Anh/tiếng Việt Luật sư đã xem, trừ các điểm ở câu 3–4. Xin Luật sư tham khảo; trả lời "Đồng ý" hoặc "Sửa: …".

1. **Bản dịch.** Thông báo bằng tiếng nước ngoài có cần người dịch có chứng chỉ hoặc công chứng không, hay người bản xứ đọc lại là đủ?
2. **Bản nào là bản chính.** Trang tiếng Hàn/Trung/Nga ghi: "Đây là bản dịch. Nếu khác với bản tiếng Anh hoặc tiếng Việt, áp dụng bản tiếng Anh và tiếng Việt." (a) Có nên chỉ để **tiếng Việt** là bản chính không? (b) Có cần thêm câu ưu tiên giữa tiếng Anh và tiếng Việt trên hai trang đó không? (c) Câu này có bị coi là điều khoản bất lợi cho người tiêu dùng không?
3. **Dòng dưới ô đồng ý.** Đổi "OTTIMO xóa thông tin này trong tối đa 180 ngày" thành "…xóa **khỏi máy chủ của OTTIMO** trong tối đa 180 ngày", vì bản sao trong Google Chat được xóa khi không còn cần và khi khách yêu cầu (đã báo trong thư 30/10). Như vậy có đủ rõ không?
4. **Công cụ dịch** (nếu chủ đầu tư chọn): khi khách viết bằng ngôn ngữ nhân viên không đọc được, nhân viên chép **riêng lời nhắn** (không tên, không liên hệ) vào dịch vụ dịch như Google Dịch, máy chủ có thể ngoài Việt Nam. Thông báo thêm một câu nêu việc này. Việc này có thuộc diện chuyển dữ liệu cá nhân ra nước ngoài cần đưa vào hồ sơ (nếu có) cùng Google Workspace không?
5. **Giá theo giấy tờ** (câu của đội nghiệp vụ). Form sẽ hiện giá ước tính; giá thuê tháng của khách dùng hộ chiếu nước ngoài cao hơn 10 % và có thể hiện thành một dòng riêng. Hiện công khai hai mức giá theo loại giấy tờ có vướng quy định về phân biệt đối xử hoặc niêm yết giá không? Giá ước tính đã gồm VAT và ghi "ước tính – giá cuối trong báo giá" – như vậy có đủ không?
6. **Luật nước ngoài.** Có website tiếng Trung/Nga/Hàn có làm OTTIMO thuộc phạm vi luật dữ liệu của nước đó không – ví dụ Luật Bảo vệ thông tin cá nhân của Trung Quốc (với người ở Trung Quốc), Luật Liên bang 152-FZ của Nga (yêu cầu lưu dữ liệu công dân Nga trên máy chủ tại Nga), Luật Bảo vệ thông tin cá nhân của Hàn Quốc? OTTIMO không có hiện diện ở các nước này, giá chỉ bằng VND, không dùng tên miền hay quảng cáo nhắm các nước này trong đợt này. Nếu cần tư vấn luật sư nước ngoài, xin Luật sư cho biết.

Trân trọng,
…………………… – Công ty Cổ phần UTMG Living – OTTIMO Boutique Stay · info@ottimo.vn

**Đính kèm:** bảng thay đổi EN/VI; bản dịch tiếng Hàn, Trung giản thể, Nga; chữ ô đồng ý 5 ngôn ngữ.

---

## 9. API công khai giá ước tính (FB-INV-009) – đánh giá rủi ro

### 9.1 Phạm vi và giả định
- Một endpoint đọc, công khai, không đăng nhập, gọi từ form trên ottimo.vn qua proxy Caddy cùng origin (như `form-token`). Tên/đường dẫn do ARC chốt; dưới đây gọi `GET …/price-estimate`.
- Đầu vào: hạng căn (slug công khai), ngày đến + ngày đi **hoặc** số tháng, số người lớn / trẻ 6–11 / trẻ < 6. Đầu ra theo DOM (BR-115/116): mức "từ", dòng chi tiết, trạng thái `ok | min_stay | over_capacity | not_open | unavailable`.
- Chung tiến trình api và pool DB với Desk (một bản chạy). Không có CDN.

### 9.2 Phân loại dữ liệu
| Được trả (công khai) | **Không bao giờ** trả |
|---|---|
| Tổng ước tính mức "từ" của hạng (VND, số nguyên), số đêm/tháng, dòng chi tiết **theo nhóm** ("3 đêm × 760.000", không gắn ngày), dòng giảm 7/14 đêm, dòng phụ thu khách thêm, phí dịch vụ tháng, mức "từ" giá tháng (và dòng hộ chiếu nước ngoài nếu ESC-043 câu 2 = A), cờ "đã gồm thuế", trạng thái, ngày `not_open` | Giá OTA nền (BR-103) tách riêng, giá kênh khác (CTV, OTA), hoa hồng, biên, sàn/trần (BR-105), **`toTotal`** và giá từng căn, số phòng/tên căn, **số căn** của hạng, tình trạng trống/đơn đặt, giá thỏa thuận, mã khách quay lại (BR-111), FOC, giá HĐ dài hạn và giá đêm quy đổi (BR-102 b), chế độ ngang giá đang dùng, id nội bộ (uuid), thời điểm/người sửa giá, phiên bản tham số dạng đọc được |

### 9.3 Mối đe dọa và mức rủi ro (trước → sau khi đủ yêu cầu 9.4)
| # | Mối đe dọa (STRIDE) | Trước | Sau | Yêu cầu chính |
|---|---|---|---|---|
| T1 | **Lộ dữ liệu kinh doanh** do phản hồi thừa trường (dùng lại DTO/hàm nội bộ của Desk) (I) | Cao | Thấp | SR-PE-01, 02, 12 |
| T2 | **Đổi tham số để lấy giá kín**: thêm `channel=ota`, `promoCode`, `ratePlan`, `roomId`, `nationality` (E/I) | Cao | Thấp | SR-PE-02, 03 |
| T3 | **Dò công suất/tình trạng trống**: so phản hồi giữa các ngày, hoặc trạng thái "hết phòng" (I) | Trung bình | Thấp | SR-PE-04; còn lại: `unavailable` do ngừng bán/OOO (xem 9.6) |
| T4 | **Suy giá từng căn/số căn** từ `toTotal` hoặc danh sách căn (I) | Trung bình | Thấp | SR-PE-05 |
| T5 | **Cào toàn bộ lịch giá** (365 ngày × 4 hạng × số đêm) (I) | Cao (khả năng) / Thấp–TB (tác động) | Trung bình–Thấp, **chấp nhận** | SR-PE-07, 15, 17, 18. Không chặn được hoàn toàn: giá trực tiếp vốn là thứ khách hỏi là có. Không "giấu giá với bot" (trả giá khác cho bot = lừa dối) |
| T6 | **Lạm dụng tài nguyên / DoS** làm chậm Desk (cùng tiến trình + pool DB); ghi DB mỗi lần đếm giới hạn (D) | Trung bình | Thấp | SR-PE-07, 08, 10 |
| T7 | **Giả số ước tính** gửi kèm yêu cầu ("web của anh/chị ghi 1.000 đ") để ép giá lễ tân (T) | Trung bình | Thấp | SR-PE-06 |
| T8 | **Cache**: giá cũ sau khi OWN đổi (sai giá); khóa cache dựng từ query thô → tràn bộ nhớ; cache chung trả nhầm (T/D) | Trung bình | Thấp | SR-PE-09 |
| T9 | **Spam thông báo OWN** qua nhánh "căn thiếu giá → server cảnh báo OWN" của DOM mục 8 (D) | Trung bình | Thấp | SR-PE-12 |
| T10 | **Riêng tư**: log ngày/hạng kèm IP thành dấu vết duyệt web; lưu trình duyệt (I) | Thấp | Thấp | SR-PE-11 – đạt thì thông báo **không** cần thêm câu |
| T11 | Mở thêm đường proxy trên landing làm rộng bề mặt tấn công (E) | Thấp | Thấp | SR-PE-10 |

Ngang giá với OTA (OTA dùng bot so giá) là rủi ro **hợp đồng**, không phải bảo mật: DOM ESC-043 câu 1. SEC chỉ yêu cầu chế độ `web_estimate.parity_mode` không lộ ra phản hồi và mỗi lần OWN đổi được ghi `audit_event`.

### 9.4 Yêu cầu bảo mật cho ARC/BE/OPS/FE

**Must – thiếu một thì SEC không duyệt phát hành LP-v2:**
- **SR-PE-01 – Phản hồi theo danh sách cho phép.** DTO công khai riêng, dựng từ kết quả `PricingService` bằng ánh xạ tường minh (không spread object nội bộ). Test hợp đồng: tập khóa JSON (cả lồng nhau) của mọi trạng thái **bằng đúng** danh sách cho phép; thêm khóa → test đỏ. Không có khóa nào trong cột "Không bao giờ" (9.2).
- **SR-PE-02 – Kênh và tham số cố định phía server.** Kênh = Trực tiếp, chế độ ngang giá = tham số Desk; schema `additionalProperties: false`; không nhận `channel`, `ratePlan`, `promoCode`, `nationality`, `document`, `roomId`, `currency`, `source`, `mode`. Tham số lạ → 400 mã chung. Không bao giờ hỏi quốc tịch/giấy tờ (ESC-043 câu 2 A hiện cả hai dòng, không cần hỏi).
- **SR-PE-03 – Kiểm đầu vào.** Slug theo regex hiện có; `roomType` thuộc danh sách hạng công khai đang bán; ngày ISO; ngày đến trong [hôm nay giờ VN, +365] (BR-112); ngắn ngày 1–27 đêm, tháng 1–24; số người theo đúng CHECK của `website_booking_request`; query ≤ 256 byte. Lỗi không nêu quy tắc nội bộ (không nhắc sàn/trần, không nhắc số căn).
- **SR-PE-04 – Không phụ thuộc đơn đặt.** Hàm tính **không đọc** `reservation`, giữ chỗ, hold, `room_status` dọn buồng. Test: chiếm hết căn của một hạng bằng đơn trên staging → thân phản hồi trùng byte với trước đó.
- **SR-PE-05 – Theo hạng, không theo căn.** Chỉ trả mức "từ". **`toTotal` không nằm trong phản hồi công khai** (với hạng 2 căn, `toTotal` chính là giá căn kia). `toTotal` và chi tiết đêm có ngày do server tính lúc lưu yêu cầu (SR-PE-06).
- **SR-PE-06 – Không tin số tiền từ trình duyệt.** POST `booking-requests` **không nhận** trường số tiền (có thì bỏ qua). Server tính lại ước tính bằng cùng hàm, ngay trong giao dịch nhận yêu cầu, và lưu snapshot DOM mục 9 (`fromTotal`, `toTotal`, chi tiết, chế độ, thời điểm, phiên bản tham số). Desk ghi rõ "ước tính lúc khách gửi". Không cần token ký mới (tránh thêm một khóa bí mật).
- **SR-PE-07 – Giới hạn tần suất trong bộ nhớ.** Không ghi `rate_limit_counter` cho mỗi lần tra giá (tránh khuếch đại ghi DB khi bị dội). Hằng bảo mật ban đầu: theo HMAC IP: 30 lần/10 phút và 200 lần/ngày; theo /48 IPv6: 400 lần/ngày; toàn hệ thống: 10 lần/giây. Vượt → 429 `RATE_LIMITED` + `Retry-After` (theo IP) hoặc 503 (toàn hệ thống). Bộ đếm tách khỏi bộ đếm POST yêu cầu đặt phòng (`ipPerHour: 5`): tra giá không ăn hạn mức gửi yêu cầu và ngược lại. ARC được chỉnh ±50 % có ghi decision-log; ngoài khoảng đó hỏi SEC. IP chỉ dùng dạng HMAC với nhãn riêng (ví dụ `ip:pe:`), không ghi ra đĩa.
- **SR-PE-08 – Bảo vệ Desk + công tắc.** Tính trong giao dịch READ ONLY, `statement_timeout` ≤ 1 giây; tối đa 4 phép tính đồng thời, vượt → 503 ngay (không xếp hàng). Tham số `public_price_estimate_enabled` (chỉ OWN đổi, mặc định **false**, ghi `audit_event` `security`), tắt → 404 như không có route; FE ẩn khối giá, form vẫn gửi được. Độc lập với `public_booking_requests_enabled`.
- **SR-PE-09 – Cache an toàn.** Nếu cache: khóa dựng từ đầu vào **đã kiểm và chuẩn hóa**, LRU giới hạn (ví dụ ≤ 5.000 mục), vô hiệu khi giá/lịch giá/tham số `web_estimate.*` đổi **hoặc** TTL ≤ 60 giây (để web = Desk, QA mục 11 DOM). HTTP: `Cache-Control: no-store` như các phản hồi public hiện có; không `public`, không `ETag`/`Last-Modified` lộ thời điểm sửa giá.
- **SR-PE-10 – Caddy.** Thêm đúng một matcher `GET ^/v1/public/properties/[a-z0-9-]{2,40}/<tên ARC>$`, cùng công tắc `LANDING_PUBLIC_API`, giới hạn độ dài query. `check-caddy-landing.sh`: thêm ca 200; giữ 404 cho `/availability`, `/offers`, POST lên route giá, đường dẫn con. CSP giữ `connect-src 'self'`, không CORS.
- **SR-PE-11 – Riêng tư.** Không cookie; **không thêm** khóa `localStorage`/`sessionStorage` (thông báo hứa chỉ nhớ ngôn ngữ). Log api cho route này không có query string, không IP; log truy cập Caddy giữ luật hiện có (bỏ query, IP /24). Chỉ số DATA chỉ đếm tổng theo ngày (số lượt tra, số lượt có giá), không theo IP/phiên. Muốn phân tích sâu hơn → hỏi SEC trước (có thể phải sửa thông báo).
- **SR-PE-12 – Lỗi và cảnh báo.** problem+json mã chung, không stack, không tên bảng/căn. Nhánh DOM "căn thiếu giá → cảnh báo OWN": khử trùng **tối đa 1 thông báo/căn/ngày**, không phụ thuộc số lượt gọi (khách ngoài không thể tạo hàng loạt thông báo).
- **SR-PE-13 – Chỉ VND.** Không quy đổi ngoại tệ, không gọi dịch vụ tỷ giá bên ngoài (giữ đúng "không tải gì từ công ty khác"; giảm tín hiệu "nhắm thị trường nước ngoài" – thư câu 6). Định dạng số theo ngôn ngữ làm phía trình duyệt bằng `Intl`.
- **SR-PE-14 – Header.** `X-Robots-Tag: noindex`, `Content-Type: application/json`, chỉ GET (HEAD tùy ARC), không JSONP/callback.

**Should – nên làm cùng đợt:**
- SR-PE-15 – FE chỉ gọi khi đủ hạng + ngày/tháng hợp lệ, debounce ≥ 400 ms, không gọi lúc tải trang; lỗi/429 → ẩn khối giá (DOM mục 8).
- SR-PE-16 – OPS cảnh báo khi 429 + 503 của route vượt 200/giờ, và khi công tắc đổi; báo cáo tuần số lượt tra (tổng).
- SR-PE-17 – Dòng chi tiết theo nhóm giá (DOM mục 7 đã đúng hướng), không mảng giá từng đêm có ngày.
- SR-PE-18 – Không có endpoint lịch giá, giá cả năm, hay tra nhiều hạng/nhiều khoảng ngày trong một lần gọi.

### 9.5 Ca kiểm bắt buộc (QA chạy, SEC xem kết quả)
1. Mọi trạng thái: tập khóa JSON = danh sách cho phép; không chuỗi nào chứa số phòng (`101`…`402`), `ota`, `floor`, `commission`.
2. Thêm `channel=ota`, `promoCode=OTTIMO-BACK5`, `nationality=KR`, `roomId=…` → 400, không đổi giá.
3. Chiếm hết căn của "Signature Two-Bedroom" bằng đơn staging → phản hồi trùng byte.
4. Hạng 2 căn khác giá → phản hồi chỉ có mức "từ"; Desk thấy cả "từ" và "đến" trong yêu cầu.
5. POST yêu cầu kèm `estimate: 1000` → Desk hiện số server tính.
6. 31 lần/10 phút cùng IP → lần 31 nhận 429; POST yêu cầu đặt phòng từ IP đó vẫn được nhận.
7. Dội 50 lần/giây trong 30 giây → Desk vẫn mở được danh sách yêu cầu dưới 2 giây; không dòng mới trong `rate_limit_counter` cho route giá.
8. OWN đổi giá một căn trên Desk staging → web ra số mới trong ≤ 60 giây.
9. Công tắc tắt → 404; form vẫn gửi được.
10. Một căn giá 0, gọi 100 lần → OWN nhận đúng 1 thông báo.
11. Log api + Caddy sau ca 6: không có query string, không IP đầy đủ.

### 9.6 Rủi ro còn lại
| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| PE-RR1 | Đối thủ/OTA cào toàn bộ giá trực tiếp | Thấp (chấp nhận) | Bản chất của FB-INV-009. Rủi ro hợp đồng ngang giá do DOM ESC-043 câu 1 xử lý. |
| PE-RR2 | Trạng thái `unavailable` và mức "từ" đổi khi một căn bị khóa OOO → người ngoài thấy được hạng nào đang bảo trì ngày nào | Thấp | Chấp nhận theo DOM mục 2. Sổ tay: **không dùng OOO để giữ căn** cho khách/chủ (nếu dùng, web sẽ lộ). |
| PE-RR3 | Giới hạn tần suất trong bộ nhớ mất khi api khởi động lại; sai nếu sau này chạy nhiều bản | Thấp | Giới hạn toàn hệ thống + công tắc là lưới cuối. Chạy nhiều bản → ARC chuyển sang bộ đếm chung. |

---

## 10. Locale mới và tin Google Chat – yêu cầu kèm (BE/INT/QA)

Tên và lời nhắn bằng chữ Hàn/Trung/Nga đi vào `chatSafeText` (mức C) và luật V-09. Thêm vào bộ test BUG-R3-058 / GCHAT-07 (Minor, trước khi đặt C đã có điều kiện riêng; với LP-v2 là **Must trước khi mở ko/zh/ru**):
- Tên miền dùng **dấu chấm chữ Hán `。` (U+3002)**: `evil。com/login` – trình duyệt và IDNA coi `。` là dấu chấm tên miền; NFKC **không** đổi ký tự này. Phải bị vô hiệu như `.`. Cùng ca: `．` (U+FF0E), `｡` (U+FF61), `ｈｔｔｐｓ：／／`, `＜users/all＞`.
- Tên miền giả bằng chữ Kirin: `оttimo.vn` (chữ `о` Kirin), và dạng `xn--…`: vô hiệu như mọi tên miền.
- Số giấy tờ nước ngoài trong lời nhắn: số đăng ký cư trú Hàn `YYMMDD-NNNNNNN`, số căn cước Trung Quốc 18 ký tự (có thể tận cùng `X`), hộ chiếu Nga dạng `NN NN NNNNNN`: `looksLikeIdNumber`/`looksLikeSensitiveNumber` che hoặc gắn cờ. Dữ liệu thử phải là số giả, sinh trong test.
- Desk hiện ngôn ngữ khách (FB-INV-008): chỉ là nhãn từ enum, không render HTML từ dữ liệu khách.

---

## 11. ESC, giả định, dòng decision-log đề xuất

**ESC mới: `02-escalations/ESC-044.md`** – lễ tân dùng công cụ dịch bên ngoài cho lời nhắn khách. A (đề xuất): cho phép, chỉ chép lời nhắn, không tên/liên hệ, ghi một câu vào thông báo `V3`, cấm "Dịch trang này" của trình duyệt trên Desk. B: không dùng công cụ dịch, trả lời tiếng Anh. C: nút dịch trong Desk qua dịch vụ trả phí có hợp đồng (v1.1 sớm nhất). Mặc định A.

**Giả định đã dùng**
- G-SEC-1: landing v1.0.1 đăng `2026-10-31` trước LP-v2 (plan: LP-v2 "cùng hoặc sau v1.0.1"). Nếu gộp → một version cho 5 ngôn ngữ (D2).
- G-SEC-2: nhãn `2026-10-31` giữ nguyên dù chốt chữ muộn hơn (đã nối vào hằng ★2).
- G-SEC-3: chỉ số đếm truy cập C+ chưa bật trên landing (không thấy trong mã) → không đưa câu C+ vào `V3`. Bật C+ cùng LP-v2 thì SEC cấp bản dịch câu đó trước khi chốt.
- G-SEC-4: form chỉ có kênh trả lời Zalo/WhatsApp/gọi/email; Telegram/Viber chỉ là link khách tự mở (`Contact.astro`) → không phải bên nhận dữ liệu từ form.
- G-SEC-5: K1 (quản lý phòng Chat xóa được tin webhook) đã/ sẽ đạt như điều kiện của mức C; câu Δ4 phụ thuộc K1.

**Dòng decision-log đề xuất (ORC chép, SEC là người quyết)**

| 2026-11-01 | 4 | **SEC – LP-v2 thông báo xử lý dữ liệu ko/zh/ru** (`rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md`): (1) version đồng bộ cho mọi ngôn ngữ, đăng một giao dịch; LP-v2 đăng version mới cho 5 ngôn ngữ (nhãn = ngày chốt chữ, > `2026-10-31`), không gắn ko/zh/ru vào `2026-10-24`/`2026-10-31` đã đăng; gộp chung lượt với v1.0.1 thì dùng `2026-10-31` cho 5 ngôn ngữ; mọi version sau `2026-10-31` giữ đoạn Google Chat; (2) trang ko/zh/ru có câu "bản EN/VI áp dụng khi khác biệt", hỏi luật sư có chọn riêng VI; (3) người bản xứ duyệt là điều kiện phát hành từng ngôn ngữ, chưa duyệt thì dời cả ngôn ngữ; (4) `consentMore` sửa "…from our server within 180 days" ngay trong `2026-10-31` (SEC-LP2-01, Major, v1.0.1); câu "These periods apply to our server…" đặt cuối đoạn 2; (5) SR-LC-01…08 (migration locale, 422 khi thiếu thông báo, công cụ ghi đọc manifest + `data-notice-version`, font tự host). | SEC | Quyền SEC (yêu cầu kỹ thuật về thông báo); nội dung theo ESC-041 C, ESC-042 B |
| 2026-11-01 | 4 | **SEC – API giá ước tính công khai** (cùng tệp, mục 9): Must SR-PE-01…14 – phản hồi theo danh sách cho phép, không `toTotal`/giá căn/số căn/giá OTA/sàn/chế độ ngang giá; kênh cố định phía server, không tham số lạ, không hỏi quốc tịch; không đọc đơn đặt; POST yêu cầu không nhận số tiền, server tự tính snapshot; giới hạn trong bộ nhớ 30/10 phút, 200/ngày theo IP, 10/giây toàn hệ thống, tách khỏi hạn mức POST; READ ONLY, timeout 1 giây, ≤ 4 phép tính đồng thời; công tắc `public_price_estimate_enabled` (OWN, mặc định tắt); cache khóa chuẩn hóa + vô hiệu khi đổi giá hoặc ≤ 60 giây, HTTP `no-store`; một route Caddy; không cookie/lưu trình duyệt mới, log không query/IP; cảnh báo OWN tối đa 1/căn/ngày; chỉ VND. Rủi ro còn lại Thấp. | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |

---

## 12. Báo cáo

- **Đã làm:** bản dịch thông báo xử lý dữ liệu tiếng Hàn, Trung giản thể, Nga (version mới đầy đủ + các câu khác của `2026-10-24`) và chữ ô đồng ý; chiến lược version theo FB-01; câu ưu tiên bản dịch; thư luật sư (gộp câu hỏi giá theo giấy tờ của DOM); đánh giá rủi ro API giá ước tính (11 mối đe dọa, 14 Must, 4 Should, 11 ca kiểm); yêu cầu kèm cho locale mới và tin Chat; phát hiện SEC-LP2-01 (Major, v1.0.1) và SEC-LP2-02; mở ESC-044.
- **File tạo/sửa:** tệp này; `02-escalations/ESC-044.md` (mới); `02-escalations/escalations-index.md` (thêm dòng ESC-044).
- **Giả định:** mục 11.
- **Rủi ro/vướng mắc:** (1) SEC-LP2-01 phải vào landing v1.0.1, nếu không câu dưới ô đồng ý sai khi mức C chạy; (2) công cụ `publish-privacy-notice` hiện cố định vi+en – thiếu SR-LC-04 thì LP-v2 không ghi được phiên bản; (3) bản dịch là của đội, chưa có người bản xứ – chặn phát hành tới khi có; (4) câu hỏi luật nước ngoài (thư câu 6) chưa có trả lời, SEC không kết luận.
- **Việc chưa xong:** đối chiếu với thiết kế ARC `lp-v2-design.md` khi có (bước Review chéo: `reviews/SEC-on-ARC.md`); nhận sửa từ người bản xứ; review diff BE/OPS/FE-B ở bước sau.
