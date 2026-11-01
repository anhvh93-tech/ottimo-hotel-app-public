# SEC review mã LP-v2 – nhánh `lp-v2-be` và `lp-v2-fe`

- Người review: SEC | Round 4 – gói LP-v2 – Bước: Review chéo | Ngày 01/11/2026
- Phạm vi: `git diff origin/lp-v2...origin/lp-v2-be` (đến `63c5731e`) và `git diff origin/lp-v2...origin/lp-v2-fe` (đến `5db7df80`), nền `origin/lp-v2` = `8363650c` (OpenAPI 0.3.9-draft). Đọc mã, không chạy test, không sửa mã, không commit.
- Đối chiếu: `rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` (SR-PE-01…19, SR-LC-01…08, mục 10, L2), `outputs/BE/lp-v2-be.md`, `outputs/FE/lp-v2-fe.md`, decision-log 01/11 (dòng mới nhất: INV chọn 9 = Google Dịch dùng được trên **mọi** màn hình Desk, kể cả giấy tờ và thanh toán).
- Không có dữ liệu khách thật, khóa hay URL bí mật trong tệp này.

## 0. Kết luận

| Nhánh | Kết luận | Lý do ngắn |
|---|---|---|
| `lp-v2-be` | **Đạt có điều kiện** | Đủ phần lớn Must: DTO theo danh sách cho phép (có test tập khóa + chuỗi cấm), không `toTotal`/số căn/giá OTA/chế độ ngang giá, không đọc đơn đặt (có test tĩnh), không giá tháng (SR-PE-19), token `pe1` ký bằng `keyedHash('public_estimate')` so khớp mọi đầu vào, server tính lại khi nhận yêu cầu, READ ONLY + `statement_timeout` 1 s, bulkhead riêng 2, cache 60 s + xóa khi đổi tham số, `no-store` + `noindex`, công tắc `public_show_prices` chỉ OWN + audit `security` + có hiệu lực ngay, 422 `PUBLIC_FORM_NOT_READY`, NFKC + số giấy tờ Hàn/Trung/Nga, migration 0090 chỉ nới. **1 Major** (thứ tự bộ đếm làm một IP tắt được ô giá của mọi người). |
| `lp-v2-fe` | **Đạt có điều kiện** | CSP không đổi (`connect-src 'self'`, `font-src 'self'`), font tự host (Vite đóng gói, nguồn CJK ghim sha512 và có kiểm), không request ra ngoài, không cookie/khóa lưu mới (e2e kiểm), chỉ `textContent`, `credentials: 'omit'`, theo tháng không gọi API, token chỉ gửi khi khớp lựa chọn. Bản dịch ko/zh/ru **trùng từng chuỗi** với SEC mục 4–6 + L2.2 (so bằng script: 41/41 chuỗi mỗi ngôn ngữ); en/vi đúng Δ1–Δ5; `consentMore` 5 ngôn ngữ đúng "from our server"; `<meta name="ottimo-notice-version">` + `data-notice-version` cùng một hằng. **1 Major** (câu Δ5 phải sửa theo quyết định 9B – SEC cấp chữ ở mục 3). |

Không có Blocker. SEC **không duyệt phát hành LP-v2** tới khi đủ các điều kiện ở mục 4 (gồm 2 Major dưới đây và các phần OPS chưa có trên hai nhánh).

## 1. Thẻ cho BE (`lp-v2-be`)

### FB-R4-SEC-BE-01
- Mức độ: Major
- Vị trí: `product/services/api/src/modules/public-site/internal/public-site.controller.ts`, `guardedEstimate` (bộ đếm `pubest:all` trước bộ đếm theo IP)
- Vấn đề: bộ đếm toàn hệ thống được `hit` **trước** khi kiểm hạn mức IP. Lượt gọi đã bị 429 theo IP vẫn ăn hạn mức 10 lần/giây chung. Một máy duy nhất gửi đều ≥ 10 lần/giây (ngay cả khi mọi lượt của nó đều 429) giữ cửa sổ chung luôn đầy → mọi khách khác nhận 503 → ô giá ẩn trên mọi trang, kéo dài bao lâu tùy kẻ tấn công. Giới hạn theo IP (SR-PE-07) vì vậy không bảo vệ được tính năng.
- Vì sao quan trọng: giá ước tính là lý do của FB-INV-009; một IP đơn lẻ tắt được nó với chi phí gần bằng 0. Desk không bị ảnh hưởng (lượt bị từ chối rẻ), nên không phải Blocker.
- Đề xuất sửa: thứ tự `consume` theo IP (10 phút, ngày, /48) → rồi mới `retryAfter` + `hit` bộ đếm chung → bulkhead. Lượt bị 429 theo IP không được đếm vào bộ đếm chung. Thêm test: một IP gửi 200 lần trong 5 giây (đều 429 sau lượt 30), IP thứ hai vẫn nhận 200. Áp cùng thứ tự cho trần "600 lần tính mới/giờ/cơ sở" nếu sau này đặt trước kiểm IP (hiện đã đặt sau – đúng).
- Trạng thái: Open

### FB-R4-SEC-BE-02
- Mức độ: Minor
- Vị trí: `price-estimate.service.ts` – `compute()` (nhánh slug lạ) và `forRequest()` dùng hằng `28`; `public-rate.ts` dùng tham số `pr.longStayRequiredFromNights`
- Vấn đề: hai nguồn cho cùng một mốc. INV 01/11 đổi mốc sang **30 đêm**. Khi OWN đặt tham số 30, khoảng 28–29 đêm: slug thật trả `stayKind: short` + giá, slug lạ trả `stayKind: long`; `seen.stayKind` của yêu cầu lưu `long` trong khi số khách thấy là giá đêm. Không lộ dữ liệu (tên hạng vốn công khai) nhưng là phép thử phân biệt được slug hợp lệ và làm bản ghi Desk sai loại.
- Vì sao quan trọng: tính nhất quán của snapshot trên Desk; luật SR-PE-03 "lỗi không nêu quy tắc nội bộ" muốn mọi nhánh trả cùng hình dạng.
- Đề xuất sửa: một hàm duy nhất đọc tham số mốc (cùng giao dịch), dùng cho cả ba chỗ. DOM xác nhận giá trị 30 theo bảng giá mới.
- Trạng thái: Open

### FB-R4-SEC-BE-03
- Mức độ: Minor
- Vị trí: `website-requests.service.ts` `priceEstimateRecord` – Desk chỉ thấy phần `seen`; `atSubmit` (gồm `toTotalVnd`) lưu nhưng không hiện
- Vấn đề: SR-PE-06 / ca 9.5 số 4 ("Desk thấy cả 'từ' và 'đến'") chưa có trên Desk. Về bảo mật đã đạt (số `seen` lấy từ token đã ký, trình duyệt không giả được), nhưng lễ tân chưa thấy số server tính lại lúc nhận và chênh lệch nếu giá đã đổi.
- Vì sao quan trọng: mối đe dọa T7 (khách dùng số web để ép giá) được chặn tốt hơn khi lễ tân thấy cả hai số.
- Đề xuất sửa: ARC thêm trường chỉ đọc (ví dụ `atSubmit.fromTotalVnd`, `toTotalVnd`, `priceChangedSinceSeen`) vào `PublicPriceEstimateRecord` (chỉ thêm), FE-A hiện ở S35. Có thể để v1.0.x sau LP-v2.
- Trạng thái: Open

### FB-R4-SEC-BE-04
- Mức độ: Suggestion
- Vị trí: `price-estimate.service.ts` `forRequest()` – tính lại trong giao dịch POST không có `statement_timeout`
- Vấn đề: route công khai GET có trần 1 s, còn bước tính lại trong POST thì không. POST đã có 5 lần/giờ/IP + bulkhead 4 nên rủi ro thấp.
- Đề xuất sửa: đo thời gian tính lại; nếu > 1 s thì bỏ `atSubmit` (giữ `seen`), hoặc đặt `SET LOCAL statement_timeout` cho cả giao dịch POST ở mức chấp nhận được (ví dụ 3 s).
- Trạng thái: Open

### FB-R4-SEC-BE-05
- Mức độ: Suggestion
- Vị trí: `public-rate.ts` `estimatePublicRate` – `losDiscountPct` trả mức bậc đầy đủ khi sàn `ota_floor` chỉ chặn một phần đêm
- Vấn đề: `losDiscountVnd` nhỏ hơn `pct × roomSubtotalVnd` → người ngoài suy được sàn OTA đang chặn đêm nào (lộ nhẹ "chế độ ngang giá" – cột "Không bao giờ trả" 9.2). FE hiện không in %, nên khách không thấy sai.
- Đề xuất sửa: khi sàn chặn bất kỳ đêm nào, trả `losDiscountPct` = 0 hoặc % thực tế làm tròn. Ghi chú cho DOM (ngoài phạm vi SEC): với "một mức giá" INV chốt 01/11, chế độ `ota_floor` có thể nuốt hết giảm theo số đêm trên web – DOM xem có nên chuyển `direct`.
- Trạng thái: Open

## 2. Thẻ cho FE (`lp-v2-fe`)

### FB-R4-SEC-FE-01
- Mức độ: Major
- Vị trí: `product/apps/landing-web/src/content/privacy.ts` – đoạn Δ5 ở mục "Who else receives it" của 5 ngôn ngữ (FE chép đúng SEC L2.2; lỗi nằm ở chữ của SEC)
- Vấn đề: câu hiện tại chỉ hứa dịch **khi** khách viết bằng ngôn ngữ nhân viên không đọc được, và chỉ "để hiểu yêu cầu". Decision-log 01/11 (dòng mới nhất, câu 9): INV cho dùng Google Dịch trên **mọi màn hình Desk**, không giới hạn. Thực tế sẽ gồm dịch cả trang bằng trình duyệt (có thể bật "luôn dịch"), dịch cả yêu cầu viết bằng tiếng Anh, và dịch câu trả lời gửi khách. Câu có điều kiện vì vậy hứa ít hơn việc làm thật.
- Vì sao quan trọng: đây là văn bản pháp lý, bị băm và ghi version khi đăng; sai thì phải đăng version mới. Chưa đăng (nhãn tạm `2026-11-01`) nên sửa bây giờ không tốn gì.
- Đề xuất sửa: thay Δ5 bằng chữ ở **mục 3** (5 ngôn ngữ). Không đổi câu nào khác. Người bản xứ đọc lại câu mới cùng lượt đọc ko/zh/ru (đã là điều kiện D4). Test `copy.test.ts` (nếu so chữ) cập nhật theo.
- Trạng thái: Open

### FB-R4-SEC-FE-02
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/content/privacy.ts` – `const VERSION = '2026-11-01'` (nhãn tạm)
- Vấn đề: nhãn tạm có thể lọt lên production nếu không ai đổi. Theo SEC D2, nhãn = ngày chốt chữ sau người bản xứ, phải > `2026-10-31` và v1.0.1 (`2026-10-31`) đăng trước.
- Đề xuất sửa: SEC báo nhãn thật khi chữ chốt; FE đổi hằng. Thêm một kiểm trong `check:dist` hoặc `deploy-landing.sh`: version thông báo của bản dựng production phải > version đang hiệu lực trên máy chủ (OPS đọc từ `privacy-notice.log`).
- Trạng thái: Open

### FB-R4-SEC-FE-03
- Mức độ: Suggestion
- Vị trí: `product/tests/e2e/landing/lp-v2.landing.spec.ts` (khoảng dòng 209)
- Vấn đề: e2e kiểm `localStorage` chỉ còn `ottimo.lang` và không cookie, nhưng không kiểm `sessionStorage` và IndexedDB.
- Đề xuất sửa: thêm `sessionStorage.length === 0` và `indexedDB.databases()` rỗng sau khi tra giá + gửi yêu cầu, để câu "chỉ nhớ ngôn ngữ" trong thông báo có test giữ.
- Trạng thái: Open

## 3. Câu Δ5 mới (L3 – theo quyết định 9B của INV, thay L2.2)

Quyền SEC (chữ thông báo). Vị trí giữ nguyên: đoạn cuối mục "Who else receives it" ở cả 5 ngôn ngữ. Bỏ điều kiện "nếu bạn viết bằng ngôn ngữ…", thêm "trả lời bạn" và "thông tin lưu trú" (ngày, số khách – màn hình Desk dịch cả trang sẽ gửi các trường này).

| Ngôn ngữ | Câu |
|---|---|
| EN | `We may use a translation service, such as Google Translate, to read your request and reply to you. The text we translate may include your name, contact, stay details and message. The service’s servers may be outside Viet Nam.` |
| VI | `OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc yêu cầu và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Máy chủ của dịch vụ này có thể đặt ngoài Việt Nam.` |
| ko | `요청 내용을 읽고 답변드리기 위해 Google 번역 같은 번역 서비스를 이용할 수 있습니다. 번역하는 내용에는 고객님의 성함, 연락처, 숙박 정보, 메시지가 포함될 수 있습니다. 이 서비스의 서버는 베트남 밖에 있을 수 있습니다.` |
| zh | `我们可能会使用 Google 翻译等翻译服务来阅读您的申请并回复您。翻译的内容可能包括您的姓名、联系方式、入住信息和留言。该服务的服务器可能位于越南境外。` |
| ru | `Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы прочитать ваш запрос и ответить вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и сообщение. Серверы этого сервиса могут находиться за пределами Вьетнама.` |

Comment trong `privacy.ts`: `// Δ5 – ESC-044 + INV 01/11 câu 9 (mọi màn hình Desk) – SEC review LP-v2 code mục 3`.

Câu "Only our reception, our managers and the sales staff… can see them" giữ nguyên: câu đó nói về máy chủ OTTIMO; bên ngoài nhận dữ liệu đã liệt kê ở "Who else receives it".

**Thư luật sư (L2.4) – câu 4 sửa theo:** "Nhân viên được dùng dịch vụ dịch bên ngoài (ví dụ Google Dịch bản phổ thông, không có hợp đồng xử lý dữ liệu) trên **mọi màn hình** phần mềm quản lý, kể cả dịch cả trang bằng trình duyệt và dịch câu trả lời. Với khách gửi yêu cầu qua website, nội dung có thể gồm tên, liên hệ, thông tin lưu trú, lời nhắn. Với khách đang lưu trú, có thể gồm cả thông tin giấy tờ tùy thân và thanh toán hiện trên màn hình." Giữ (a)–(c), thêm **(d)**: "Thông báo cho khách lưu trú có cần nêu việc này không, và việc gửi thông tin giấy tờ tùy thân tới dịch vụ dịch có cần căn cứ riêng ngoài sự đồng ý chung không?"

## 4. Điều kiện để SEC duyệt phát hành LP-v2

| # | Điều kiện | Ai | Nguồn |
|---|---|---|---|
| C1 | Sửa FB-R4-SEC-BE-01 (thứ tự bộ đếm) + test | BE | mục 1 |
| C2 | Δ5 mới (mục 3) trong `privacy.ts` 5 ngôn ngữ; người bản xứ đọc cả câu mới | FE-B, INV mời người đọc | FB-R4-SEC-FE-01, D4 |
| C3 | Nhãn version thật, > `2026-10-31`; v1.0.1 đã đăng `2026-10-31` trước | SEC, FE-B, OPS | FB-R4-SEC-FE-02, D2 |
| C4 | Caddy: đúng một matcher `GET ^/v1/public/properties/[a-z0-9-]{2,40}/price-estimate$`, giới hạn độ dài query, cùng công tắc `LANDING_PUBLIC_API`; mở `/ko`, `/zh`, `/ru`; `check-caddy-landing.sh` có ca 200 và ca 404 (POST lên route giá, đường dẫn con, `/availability`) – **chưa có trên hai nhánh** | OPS | SR-PE-10, SR-LC-06 |
| C5 | `publish-privacy-notice` + `deploy-landing.sh` đọc 5 locale (manifest/`LANDING_LOCALES`, `data-notice-version`), băm khác nhau từng đôi, một giao dịch – **chưa có** | OPS, SEC duyệt lại | SR-LC-04/05 |
| C6 | `docker-compose.prod.yml`: biến `LANDING_LOCALES` truyền vào api (thiếu thì api luôn `en,vi` và form ko/zh/ru nhận 422) | OPS | BE mục 6 |
| C7 | Mục 10 (chatSafeText với `。` `．` `｡`, tên miền Kirin/`xn--`, số giấy tờ nước ngoài) + GCHAT-07 trên nhánh Google Chat, trước khi mở ko/zh/ru | BE (nhánh gchat), QA | SEC mục 10 |
| C8 | QA chạy 12 ca SEC 9.5 trên staging **qua Caddy thật** (ca 6 xác nhận IP khách đến được api qua `TRUST_PROXY` – nếu sai, mọi khách chung một bộ đếm 30/10 phút) + ca mới của BE-01 | QA | 9.5 |
| C9 | Cảnh báo 429/503 của route và cảnh báo khi đổi `public_show_prices` | OPS | SR-PE-16 (Should – không chặn) |

## 5. Đối chiếu yêu cầu (tóm tắt)

| Mã | Kết quả | Ghi chú |
|---|---|---|
| SR-PE-01 | Đạt | `publicEstimateDto` dựng từng trường; test tập khóa + chuỗi cấm (số phòng, uuid căn, `toTotal`, `floor`, `commission`). |
| SR-PE-02 | Đạt (lệch chấp nhận) | Tham số lạ/lặp → 422 `VALIDATION_FAILED` thay vì 400 (BE L5): mã chung, không lộ quy tắc – SEC chấp nhận. Kênh cố định `direct`. |
| SR-PE-03 | Đạt | Query ≤ 256 byte, regex slug, số nguyên 1–3 chữ số, cửa sổ đặt phòng. Lỗi chỉ trả tên trường (cắt 40 ký tự). |
| SR-PE-04 | Đạt | SQL chỉ đọc `room`, `room_group`, `room_block` (OOO), `room_list_price`; test tĩnh. OOO lộ một phần = PE-RR2 đã chấp nhận. |
| SR-PE-05 | Đạt | Chỉ mức "từ"; `toTotal` chỉ trong `atSubmit` nội bộ. |
| SR-PE-06 | Đạt (xem BE-03) | Không nhận số tiền từ trình duyệt; token HMAC so khớp mọi đầu vào, so chữ ký thời gian hằng; sai/hết hạn → 202 + `offer_unverified`. |
| SR-PE-07 | **Chưa đạt** | Hằng đúng, bộ đếm RAM, không ghi `rate_limit_counter`, tách khỏi form; thứ tự sai → BE-01. |
| SR-PE-08 | Đạt | READ ONLY, 1 s, bulkhead 2 (≤ 4), 503 không xếp hàng; `public_show_prices` OWN-only, mặc định false, audit `security`, ghi đè ngay trong ngày (kill switch), cần cả `public_booking_requests_enabled`. |
| SR-PE-09 | Đạt | Khóa từ đầu vào đã chuẩn hóa, LRU 1.000, TTL 60 s, xóa khi đổi tham số; `no-store`, không ETag. |
| SR-PE-10 | Chưa có | OPS – C4. |
| SR-PE-11 | Đạt | Log request chỉ route template; không khóa lưu mới (e2e); log thiếu giá chỉ có uuid nội bộ. |
| SR-PE-12 | Đạt (lệch chấp nhận) | Log 1 lần/căn/ngày thay vì thông báo OWN (BE L9) – không tạo được hàng loạt thông báo. |
| SR-PE-13/14 | Đạt | Chỉ VND, `Intl` phía trình duyệt; `noindex`, JSON, chỉ GET. |
| SR-PE-15 | Đạt | Debounce 400 ms, không gọi lúc tải trang, theo tháng không gọi, 429 dừng tới khi tải lại, 3 s bỏ. |
| SR-PE-17/18 | Đạt | Không dòng theo ngày ra ngoài; một hạng, một khoảng ngày mỗi lần gọi. |
| SR-PE-19 | Đạt | `long` và ≥ mốc → `monthly_offer`, không số, không token; route không đọc giá tháng; snapshot không có giá tháng. |
| SR-LC-01/02 | Đạt | Migration 0090 chỉ nới CHECK + cột `price_estimate` (CHECK object) + 4 khóa tham số; 422 `PUBLIC_FORM_NOT_READY` thay lỗi FK. |
| SR-LC-03 | Ngoài nhánh | Nhánh Google Chat – C7. |
| SR-LC-04…06 | Chưa có | OPS – C4, C5. FE đã có `data-notice-version` + meta và dist-check. |
| SR-LC-07 | Đạt | Font ko/zh/ru tự host; nguồn CJK `npm pack` ghim + so `integrity` trước khi giải nén; CSP không đổi. |
| Mục 10 (BE phần nhận diện số) | Đạt | NFKC trước luật thẻ/giấy tờ; mẫu `YYMMDD-NNNNNNN`, 17 số + số/X, `NN NN NNNNNN`. Khe còn lại (gạch Unicode, nhiều dấu cách) thuộc GCHAT-07 đã biết. |
| Thông báo ko/zh/ru | Đạt | Trùng từng chuỗi với SEC mục 4–6 + L2.2 (script so 41/41 mỗi ngôn ngữ); câu Δ7 chỉ trên ko/zh/ru. Δ5 sẽ đổi theo mục 3. |
| `consentMore` | Đạt | 5 ngôn ngữ đúng "from our server" (SEC-LP2-01, mục 7). |

## 6. Rủi ro còn lại

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| PE-RR1 | Cào toàn bộ giá trực tiếp | Thấp – chấp nhận | Như mục 9.6. |
| PE-RR2 | OOO của hạng lộ qua `on_request`/mức "từ" | Thấp – chấp nhận | Sổ tay: không dùng OOO để giữ căn. |
| PE-RR3 | Bộ đếm RAM mất khi khởi động lại; sai nếu nhiều bản api | Thấp – chấp nhận | Như cũ. |
| PE-RR4 (mới) | Nhiều IP (≈ 20) dùng hết trần 600 lần tính mới/giờ bằng truy vấn khác nhau → ô giá 503 phần còn lại của giờ | Thấp | Form vẫn gửi được, cache vẫn trả. OPS cảnh báo (C9) là đủ ở quy mô 10 căn. |
| RR-T3 | Màn hình giấy tờ/thanh toán bị dịch cả trang | Cao nếu xảy ra – **INV chấp nhận 01/11 (câu 9)** | SEC ghi nhận; không còn là luật sổ tay. Gợi ý (không bắt buộc, FE-A v1.1): `translate="no"` chỉ trên ô **số** giấy tờ/số tài khoản – không cản dịch tên hay lời nhắn, giảm dữ liệu gửi đi mà không trái quyết định INV. |
| RR-T4 | Thông báo cho khách lưu trú (`privacy-2026-10-v2`) chưa nêu việc dịch, mà nay việc dịch có thể chạm cả giấy tờ/thanh toán của mọi khách (cả khách OTA) từ ngày D | **Trung bình** (nâng từ Thấp) | Ngoài phạm vi mã LP-v2. SEC đề nghị ORC giao SEC soạn câu bổ sung cho thông báo khách lưu trú, đi cùng v1.0.1 thay vì v1.1; thư luật sư câu 4 (d). |

## 7. Điểm làm tốt
- BE: tách hẳn hàm tính nội bộ và DTO công khai, có test hợp đồng tập khóa và test tĩnh "không đọc đơn đặt" – đúng tinh thần danh sách cho phép, không dựa vào việc nhớ bỏ trường.
- BE: token `pe1` không thêm bí mật mới (HKDF `public_estimate`), có miền tách, so thời gian hằng, và server vẫn tính lại – hai lớp chống giả số.
- FE: bản dịch thông báo chép không lệch một ký tự; font CJK cắt theo ký tự trang với nguồn ghim `integrity`, giữ đúng câu "không tải gì từ công ty khác"; e2e kiểm không cookie và không khóa lưu mới.
