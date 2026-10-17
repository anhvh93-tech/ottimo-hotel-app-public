# SEC review – "Yêu cầu đặt phòng" từ website (US-155, phương án A) – Round 2, luồng LP-v1

- Người review: SEC | Ngày: 17/10/2026 | Bước: Review chéo (protocol mục 5: ARC → SEC bắt buộc; UXD → SEC theo yêu cầu ORC)
- Bản được review (cây làm việc, chưa commit):
  - ARC: `product/docs/api/openapi.yaml` khối "0.3.7 bổ sung 2" (`getPublicFormToken`, `createWebsiteBookingRequest`, `list/get/transitionWebsiteBookingRequest`, `getPublicAvailability`/`getPublicOffers` contract-ahead, các trường thêm ở `saveQuote`, `createHoldFromQuote`, `ReservationCreate`, ghi chú `x-security-parameters`, SSE); `rounds/round-02/outputs/ARC/openapi-0.3.7.md` mục 12; `product/docs/erd.md` mục 4.14 (+ 9.2, 9.3, 12); `product/docs/adr/ADR-014-landing-site.md` mục 1.4, 2.6, 4; `rounds/round-02/responses/ARC-responses.md` (phần thẻ SEC landing); `product/tests/fixtures/rbac-cases.json`.
  - UXD: `product/design/landing/concept.md` v1.2 (mục 5, 6, 13, 15) và `mock/index.html` v1.2 (form, ô bẫy, trang cảm ơn, kênh khác, script gửi).
- Đối chiếu: `04-investor-feedback/FB-INV-002.md`; `reviews/landing-zalo-SEC.md` (C-1…C-10, ARC-02…12, SR-RL mục 7); `security-requirements.md` v0.3 (SR-RL mục 13, SR-LOG, SR-INP, SR-DSR, SR-SECR-07); `rbac-matrix.md` mục 6 (D28); `business-rules.md` BR-112, BR-911…916; backlog US-155 AC1–AC11; ESC-001 (LZ-1, LZ-2, LZ-7, LZ-8), ESC-002 (A – dữ liệu tại VN), ESC-020 (L7); `infra/caddy/Caddyfile.prod` (snippet `access_log`).
- Cách làm: đọc hợp đồng, ERD, ADR; đối chiếu SR; đọc mã mock (form, script gửi); đọc `rbac-cases.json`. Tra văn bản mới về thương mại điện tử (mục 7). Không chạy mã server (chưa có), không đụng stack demo.
- Đánh số thẻ: tiếp số cũ – ARC từ 13, UXD từ 04.

> SEC không khẳng định "tuân thủ pháp luật". Tài liệu nêu biện pháp kỹ thuật đã/cần cài; phần pháp lý cần luật sư xác nhận (ESC-001).

**Tổng: 0 Blocker · 5 Major · 8 Minor · 3 Suggestion (16 thẻ)**

Kết luận:
- **Không có Blocker.** Hợp đồng của ARC đã áp đúng 10 trong 11 thẻ SEC trước (ARC-09 dời cùng US-158 – chấp nhận). Hướng thiết kế đúng: yêu cầu không giữ phòng, không tạo hồ sơ khách, không đọc phòng trống/hồ sơ trước khi trả lời, phản hồi không lặp lại dữ liệu khách, giới hạn đếm trong DB, hạn lưu cho mọi trạng thái.
- **Turnstile: SEC quyết KHÔNG dùng** (không bên thứ ba). Giữ tầng 1 của ADR-014 4.4; tầng 2 là thử thách tự host (proof-of-work) bật bằng tham số khi có dấu hiệu; Turnstile chỉ xét lại qua ESC (thẻ ARC-22).
- **7 điều kiện [CHẶN]** cho mốc "bật form trên production" (mục 1): giữ C-1, C-2, C-3 (mở rộng), SEC-G1/G2; thêm **C-11** (cách ly endpoint công khai khỏi Desk), **C-12** (phía Desk: phân quyền + hiển thị dữ liệu lạ an toàn + không lộ dữ liệu cá nhân ở log), **C-13** (pháp lý LZ-2, LZ-8 theo luật mới).
- Năm điểm cần sửa nhất: (1) bước 1–6 của `createWebsiteBookingRequest` chưa có giới hạn nào trước khi chạm DB, trong khi VPS dùng chung với Desk (ARC-13); (2) hợp đồng bắt buộc SĐT, còn UXD/DOM/US-155 AC1 chỉ thu **một** cách liên hệ → SEC chọn "một cách liên hệ" (ARC-14); (3) chưa có cách xóa ngay theo yêu cầu khách (ARC-16); (4) Desk hiển thị dữ liệu người lạ gõ vào – cần quy tắc hiển thị và kiểm thử (ARC-21); (5) phương án B: ảnh chụp giá do trình duyệt gửi lên có thể bị sửa mà Desk vẫn "giữ giá" theo BR-916 (ARC-18).
- **Pháp lý mới:** Luật Thương mại điện tử 2025 (số 122/2025/QH15) và NĐ 248/2026/NĐ-CP có hiệu lực từ 01/07/2026 [Nguồn – moit.gov.vn]. Câu LZ-8 trong ESC-001 còn dẫn NĐ 52/2013 + NĐ 85/2021 → ORC cần sửa câu hỏi luật sư (mục 7).
- **Ghi nhận cho ORC:** `FB-INV-002.md` đã có mục "Xác nhận của INV (17/10/2026)" chọn **A**. ADR-014, `openapi.yaml`, backlog US-155 vẫn gắn "[GIẢ ĐỊNH – chờ INV]" → ORC cho các vai bỏ nhãn. Review này coi A là đã chốt.

---

## 1. Điều kiện [CHẶN] – mốc "bật form trên production" (US-155 AC4)

SEC sẽ không xác nhận mốc này khi còn một điều kiện chưa đạt. Form vẫn được dựng và chạy ở bản thử có chặn truy cập (ARC-10).

| # | Điều kiện | Kiểm chứng | Thẻ | Trạng thái 17/10 |
|---|---|---|---|---|
| C-1 | Landing (cả `/book/`, trang cảm ơn, trang quyền riêng tư) không tải tài nguyên bên thứ ba; script form là module ngoài, không inline; CSP ADR-014 1.4 không nới. Nếu có biểu tượng "Đã thông báo Bộ Công Thương" thì ảnh tự host + thẻ `<a>`, không script/ảnh lấy từ trang của Bộ | `check-dist.mjs` + Playwright đếm request = 0 ra ngoài, không lỗi CSP | UXD-01 (cũ) | Hợp đồng/thiết kế đạt; chờ bản dựng FE-LP |
| C-2 | Hạn lưu cho **mọi** trạng thái + trần tuyệt đối; job không phụ thuộc chuyển trạng thái | Test `Clock` giả theo erd 4.14 (31 ngày → `stale`; ngày 121 → C2 rỗng; `reopen` ngày 179 → xóa ngày 180) chạy xanh trong PR BE-D | ARC-03 (cũ) | Hợp đồng **đạt**; chờ mã + test |
| C-3 | (a) Trang thông báo xử lý dữ liệu EN + VI đã luật sư duyệt, đã đăng, có dòng `privacy_notice_version` cho mỗi ngôn ngữ đang phát hành; (b) ô đồng ý không tích sẵn, một mục đích, câu chữ theo Phụ lục A; (c) bộ đếm giới hạn trong DB; (d) có thao tác **xóa ngay theo yêu cầu khách** và quy trình xác minh qua chính liên hệ trên yêu cầu; (e) server từ chối bật form khi thiếu (a) | Kiểm trang + DB; test `setParameter` | ARC-05 (cũ), **ARC-16**, **ARC-17**, **UXD-04** | (b), (c) hợp đồng đạt; (a), (d), (e) chưa |
| **C-11** *(mới)* | Endpoint công khai không làm nghẽn Desk: giới hạn trong RAM **trước mọi truy cập DB** (tính cả lần lỗi 4xx), giới hạn số request đồng thời, `statement_timeout` ngắn; thiếu `Origin`/`Origin: null` → 403; cookie nhân viên/khách bị bỏ qua; IP lấy đúng theo SR-SECR-07; khóa `PUBLIC_FORM_SIGNING_KEY_FILE` có và được kiểm khi khởi động; bộ ca chống lạm dụng ở Phụ lục B chạy xanh | Test tích hợp + test tải nhẹ trên bản thử | **ARC-13**, **ARC-15**, **ARC-23** | Chưa |
| **C-12** *(mới)* | Phía Desk: (a) ca phân quyền (SAL ngoài phạm vi → 404, CTV/HK/MT → 403, `saveQuote`/`createReservation` với yêu cầu ngoài phạm vi → 404) xanh; (b) tên/lời nhắn của người lạ hiển thị dạng chữ thường ở hàng chờ, ngăn chi tiết, thông báo; không tự tạo link; link gọi/WhatsApp chỉ dựng từ SĐT E.164 server trả; (c) log ứng dụng, log Postgres, thông báo, SSE, audit, outbox không chứa tên/SĐT/email/lời nhắn | Test E2E với chuỗi độc hại; test log; kiểm cấu hình Postgres | **ARC-19**, **ARC-21** | Chưa |
| **C-13** *(mới)* | Luật sư trả lời **LZ-2** (căn cứ xử lý) và **LZ-8** (thông báo/đăng ký website theo Luật TMĐT 2025 + NĐ 248/2026), hoặc OTTIMO đã làm thủ tục; LZ-7 bổ sung Telegram, Viber, nhà cung cấp email | Văn bản trả lời trong ESC-001 | mục 7 | Chưa (ORC sửa câu hỏi) |
| SEC-G1/G2 | Desk chạy thật đạt kiểm tra SEC cho dữ liệu khách thật (`s3-SEC.md` mục 9.5) | Theo `s3-SEC.md` | (cũ) | SEC-G1 (a) đạt; (b) và G2 chưa |

Ngoài mốc trên: phương án B chỉ được cài khi ARC-18 đã áp (ký ảnh chụp giá).

---

## 2. Kiểm lại phản hồi của ARC cho thẻ SEC trước (`responses/ARC-responses.md`)

| Thẻ | ARC ghi | SEC kiểm | Kết luận |
|---|---|---|---|
| FB-R2-SEC-ARC-02 | Done | Bước 10: 503 `SITE_BUSY` + `Retry-After`, không lưu; một thông báo OWN/ngày; biên 50–500 trong ghi chú `x-security-parameters` | **Verified (hợp đồng)** |
| FB-R2-SEC-ARC-03 | Done | erd 4.14 đủ 6 dòng hạn lưu, đọc theo ngày tạo + hoạt động cuối, `purge_journal`, `legal_hold`; `reopen` không vượt `max_age` | **Verified (hợp đồng)** – C-2 còn chờ test |
| FB-R2-SEC-ARC-04 | Done | 202 giống hệt cho ô bẫy và liên hệ vượt giới hạn; IPv6 theo /64; không đọc `guest`/`lead`/`reservation`/`room_occupancy` | **Verified**, còn một khe: phát lại cùng `Idempotency-Key` phân biệt được bản lưu thật và bản bị chặn im lặng → ARC-15 |
| FB-R2-SEC-ARC-05 | Done (kỹ thuật) | `consent` const true, `consentVersion` FK `privacy_notice_version`, bộ đếm DB | **Verified (kỹ thuật)**; câu chữ: Phụ lục A; C-3 còn mở |
| FB-R2-SEC-ARC-06 | Done | `x-allowed-origins: [landing]`; Caddy chỉ proxy 2 đường dẫn; bỏ qua cookie; `public_resolve_property` SECURITY DEFINER | **Verified (hợp đồng)**. GET form token không kiểm `Origin` – chấp nhận (không CORS nên trang lạ không đọc được token); thêm tùy chọn ở ARC-13 điểm 6 |
| FB-R2-SEC-ARC-07 | Done | `keyedHash('web_request_contact')`; khóa form ≥ 32 byte, kiểm khởi động | **Verified** |
| FB-R2-SEC-ARC-08 | Done | `ID_NUMBER_DETECTED` cho `note` và `transition.note` | **Verified**; nên áp thêm cho `guestName` (ARC-21 điểm 1) |
| FB-R2-SEC-ARC-09 | Deferred | `recordSiteEvent` cùng US-158 | **Chấp nhận dời** – SEC kiểm lại khi có US-158 |
| FB-R2-SEC-ARC-10 | Done | ADR 1.4: staging chặn bằng basic auth/IP; kiểm tên miền con trước HSTS | **Verified** |
| FB-R2-SEC-ARC-11 | Done | ADR 2.6, 6.3; CI kiểm `dist` | **Verified** |
| FB-R2-SEC-ARC-12 | Done | `x-scope: { sales_staff: unassigned_or_own }` ở list/get/transition; `rbac-cases` có ca SAL; CTV 403 | **Verified**; tinh chỉnh tối thiểu hóa ở ARC-19 |

---

## 3. Rà theo các chủ đề ORC giao

| Chủ đề | Kết quả | Thẻ |
|---|---|---|
| Lạm dụng/spam (giới hạn, ô bẫy, Turnstile) | Tầng 1 đủ cho lúc mở. Thiếu lớp chặn rẻ trước DB; trần cơ sở bị 5 IP làm đầy trong một ngày (chấp nhận – có 503 và lối Zalo). **Không Turnstile** | ARC-13, ARC-15, ARC-22, ARC-23, UXD-05 |
| Tối thiểu hóa dữ liệu cá nhân, hạn lưu | Hạn lưu tốt. Còn thu thừa: SĐT bắt buộc kể cả khi khách chọn email; tuổi chính xác của trẻ em | ARC-14, ARC-16 |
| Câu đồng ý (Luật 91/2025, NĐ 356/2025 [Bên thứ ba]; LZ-1/LZ-2) | Giữ ô đồng ý không tích sẵn tới khi luật sư trả lời LZ-2. Câu chữ + khung thông báo: Phụ lục A | UXD-04, C-3 |
| CORS/Origin | Không CORS, cùng origin qua proxy, Origin theo operation – đúng. Cần chặn rõ trường hợp **thiếu** Origin; bỏ qua cookie phải có test (rbac-cases bỏ qua operation công khai) | ARC-13 |
| Log không dữ liệu cá nhân | Caddy bỏ toàn bộ query (nên `fbclid` không vào log); log app chỉ route/mã; `errors[]` không có giá trị; idempotency chỉ lưu `refCode`/`replyBy`; thông báo/SSE không C2. Còn thiếu: log Postgres (tham số câu lệnh), lời nhắn bị từ chối vì có số giấy tờ | ARC-21 |
| Không dò phòng trống, giá | Phương án A: **đạt** – không đọc phòng trống, không trả gì về hạng; `roomType` lạ vẫn nhận; thời gian phản hồi không phụ thuộc dữ liệu. Phương án B (contract-ahead): lịch còn/hết theo hạng lộ mức lấp đầy cho đối thủ (INV cần biết khi chọn B); ảnh chụp giá phải ký | ARC-18 |
| Phân quyền phía nhân viên | Đúng hướng. Mã trường D28 (Lead) dùng lại chưa khớp; SAL thấy C2 của yêu cầu chưa nhận; báo giá cũ của SAL có thể chuyển yêu cầu đã giao cho người khác; rbac-matrix chưa có mã hành động | ARC-19 |
| Điều kiện bật production (gồm LZ-8) | Mục 1 | C-1…C-3, C-11…C-13 |

---

## 4. Thẻ cho ARC – hợp đồng 0.3.7 bổ sung 2, ERD 4.14, ADR-014 mục 4

### FB-R2-SEC-ARC-13
- Mức độ: Major · **[CHẶN] C-11 – trước khi bật form trên production**
- Vị trí: `openapi.yaml` `createWebsiteBookingRequest` mô tả "Thứ tự kiểm" bước 1–7; `getPublicFormToken`; erd 4.14 `rate_limit_counter` ("bộ đếm IP ghi trong giao dịch riêng"); ADR-014 4.4 điểm 5; `rbac-cases.json` mục `skipped` (4 operation công khai bị bỏ qua, lý do `public`)
- Vấn đề:
  - Bộ đếm IP chỉ chạy ở **bước 7**. Mọi request rơi ở bước 2–6 (tra `Idempotency-Key`, tra cơ sở theo slug, schema, ô bẫy, form token sai) **không bị đếm**, mà bước 2 và 3 đều đọc DB. Ô bẫy còn tăng bộ đếm `spam_honeypot` (chưa nói nằm ở đâu).
  - API và Postgres chạy chung VPS 2 nhân/4 GB với Desk (ADR-010). Một luồng request rác vào endpoint công khai có thể chiếm hết kết nối DB của Desk lúc lễ tân đang nhận phòng.
  - Chưa nói rõ request **không có** `Origin` (curl, bot) hay `Origin: null` thì sao. Bước 1 chỉ nói "origin app khác → 403".
  - `rbac-cases` bỏ qua operation công khai nên không có test tự động cho "cookie nhân viên gửi kèm không làm thay đổi gì" và "Origin landing gọi thao tác nhân viên → 403" (ARC-06 điểm 4 mới ghi trong DoD).
  - Giới hạn theo /64: nhà mạng và VPS hay cấp cả dải /48 hoặc /56 cho một khách hàng, nên một kẻ xấu đổi được hàng nghìn dải /64.
- Vì sao quan trọng: Desk là hệ thống vận hành chính. Form công khai không được trở thành đòn bẩy để làm chậm Desk (TM-63, ADR-010 – điểm lỗi đơn).
- Đề xuất sửa:
  1. Thêm **bước 0** trong RAM, trước mọi truy cập DB, cho mọi request tới `/v1/public/*`, tính cả kết quả 4xx: POST 30/giờ/IP, GET form token giữ 30/giờ/IP (SR-RL-10); IPv6 theo /64. Vượt → 429 `RATE_LIMITED`. Bộ đếm `spam_honeypot` cũng để RAM, ghi tổng theo ngày.
  2. Giới hạn đồng thời (bulkhead) cho module `public-site`: tối đa 4 request cùng lúc, không xếp hàng; vượt → 503 `SERVICE_UNAVAILABLE` + `Retry-After` (trang hiện khối Zalo như 503 khác). Giao dịch công khai đặt `SET LOCAL statement_timeout = '2s'`.
  3. Kết quả `public_resolve_property(slug)` cache RAM 60 giây (xóa khi đổi `public_booking_requests_enabled`).
  4. Bước 1 ghi rõ: thiếu `Origin` hoặc `Origin: null` → 403 `FORBIDDEN_ACTION`; `Content-Type` khác `application/json` → 415 hoặc 422 (ARC chọn, ghi vào mô tả).
  5. Thêm giới hạn gộp IPv6 theo /48: 40 yêu cầu/ngày (đếm DB cùng `rate_limit_counter`). **Không** gộp IPv4 theo /24: nhà mạng di động VN dùng NAT dùng chung (CGNAT), gộp sẽ chặn khách thật.
  6. (Nên) GET form token: nếu có header `Sec-Fetch-Site` mà khác `same-origin` → 403. Trình duyệt cũ không gửi header này thì cho qua.
  7. Thêm vào DoD của BE-D các ca ở Phụ lục B mục B.1 (vì `rbac-cases` không sinh ca cho operation công khai). SEC ghi bước 0, bulkhead và giới hạn /48 vào SR-RL-10/11.
- Trạng thái: Open

### FB-R2-SEC-ARC-14
- Mức độ: Major
- Vị trí: `WebsiteBookingRequestInput` (`required` có `phone`; `email` "tùy chọn; bắt buộc khi `preferredChannel = email`"; `childrenAges`); openapi-0.3.7.md 12.4 điểm 8; so với UXD concept 5.2 (một cách liên hệ; ba ô đếm người `adults`/`children` 6–11/`infants` dưới 6), US-155 AC1 ("**ít nhất một** cách liên hệ"), DOM BR-914 (1) (khóa liên hệ = SĐT **hoặc** email)
- Vấn đề:
  - Hợp đồng buộc khách chọn trả lời qua email vẫn phải nhập SĐT. Form của UXD gửi đúng một trong hai → mọi khách chọn email sẽ nhận 422 và bị đẩy sang khối "nhắn Zalo". Quan trọng hơn, đây là thu thêm dữ liệu không cần cho mục đích "trả lời yêu cầu qua email".
  - `childrenAges` thu **tuổi chính xác** của từng trẻ (0–17). Giá chỉ cần nhóm tuổi BR-110 (dưới 6, 6–11, từ 12 tính như người lớn). Đây là dữ liệu về trẻ em; quy định riêng cho dữ liệu trẻ em trong Luật 91/2025 và NĐ 356/2025 áp tới đâu [Chưa xác minh – luật sư].
- Vì sao quan trọng: Nguyên tắc tối thiểu hóa (ADR-014 4.6, DRA P01). Lệch giữa hợp đồng, form và BR thì bên nào cài cũng sai một nửa.
- Đề xuất sửa – **SEC chốt quy tắc "một cách liên hệ"**:
  1. `preferredChannel` ∈ {`zalo`, `whatsapp`, `telegram`, `viber`, `phone`} → `phone` bắt buộc, `email` **không được gửi** (gửi → 422 `NOT_ALLOWED`). `preferredChannel = email` → `email` bắt buộc, `phone` không được gửi.
  2. Khóa giới hạn 3/ngày theo liên hệ và `contact_hmac` = HMAC của đúng liên hệ đã gửi (SĐT E.164 hoặc email chuẩn hóa – BR-951), cùng khóa dẫn xuất `web_request_contact`. Cột `email` vẫn C2, xóa cùng C2.
  3. Thay `childrenAges` bằng hai số đếm theo nhóm BR-110 (ví dụ `children6to11`, `childrenUnder6`); bỏ cột `children_ages`. Khớp UXD (`infants`) – tên khóa do ARC chốt.
  4. Ghi vào ADR-014 4.5, 4.6 và mô tả schema; DOM giữ BR-914 (1) như hiện tại.
- Trạng thái: Open

### FB-R2-SEC-ARC-15
- Mức độ: Minor · thuộc C-11
- Vị trí: `createWebsiteBookingRequest` bước 2 (phát lại theo `Idempotency-Key`), bước 5 (ô bẫy), bước 9 (liên hệ vượt 3/ngày); erd mục 4.12 `idempotency_key` ("INSERT trong cùng giao dịch nghiệp vụ")
- Vấn đề:
  - Bản ghi idempotency chỉ được ghi trong giao dịch nghiệp vụ. Nhánh ô bẫy không có giao dịch nào; nhánh vượt giới hạn liên hệ chưa nói có ghi khóa không.
  - Hệ quả: gửi lại **cùng khóa** với một yêu cầu thật → nhận lại đúng `refCode` cũ kèm `Idempotent-Replayed: true`; với yêu cầu bị chặn im lặng → server chạy lại, trả `refCode` **mới**, không có header đó. Kẻ xấu dùng chênh lệch này để biết một SĐT đã gửi đủ 3 lần trong ngày – đúng điều ARC-04 muốn chặn.
  - Khách thật gửi lần 4 trong ngày (đổi ngày, gửi lại) nhận mã không tồn tại trong Desk. Khi khách nhắn Zalo kèm mã đó, lễ tân không tìm thấy.
- Vì sao quan trọng: Giữ nguyên tắc "không dò liên hệ" (ARC-04, BR-914 (1)) và không làm mất dấu yêu cầu của khách thật.
- Đề xuất sửa:
  1. Nhánh ô bẫy và nhánh vượt giới hạn liên hệ **cũng ghi** `idempotency_key` (`completed`, phản hồi giả) trong một giao dịch ngắn. Phát lại cùng khóa ở mọi nhánh cho kết quả và header giống hệt.
  2. Nhánh vượt giới hạn liên hệ: thêm mã vừa sinh vào `website_booking_request.alias_ref_codes` (mảng, tối đa 5) của yêu cầu mới nhất cùng liên hệ. `listWebsiteBookingRequests?refCode=` tìm cả mã phụ. Không trả gì thêm cho khách.
  3. Ca test (Phụ lục B.1): phát lại cùng khóa cho (a) yêu cầu lưu thật, (b) yêu cầu bị chặn theo liên hệ, (c) ô bẫy → cùng hình dạng, cùng header.
- Trạng thái: Open

### FB-R2-SEC-ARC-16
- Mức độ: Major · **[CHẶN] C-3 (d)**
- Vị trí: `transitionWebsiteBookingRequest` (claim/release/decline/mark-spam/reopen – không có xóa); erd 4.14 "tìm cho yêu cầu chủ thể dữ liệu (UC-30)"; ADR-014 4.6; SR-DSR-01 ("chỉ nhận qua app khách mức 2 hoặc tại quầy có đối chiếu giấy tờ")
- Vấn đề:
  - Người gửi form chưa phải khách: không có link app khách, chưa tới quầy. SR-DSR-01 không áp được, nên hiện **không có đường** nào để họ xin xóa.
  - Nhân viên chỉ có thể chờ hạn lưu (tới 180 ngày) hoặc "lách" bằng `mark-spam` (xóa sau ≤ 7 ngày) – làm sai số liệu spam và tầng 2 chống spam (ADR-014 4.4 dùng số `mark-spam` làm điều kiện bật).
  - Trang thông báo phải nói khách xin xóa ở đâu, trong bao lâu. Bài tổng hợp NĐ 356/2025 nêu hạn xử lý yêu cầu xóa là 20 ngày [Bên thứ ba – luật sư xác nhận, LZ-1 câu phụ 4] – ngắn hơn nhiều so với 90–180 ngày.
- Vì sao quan trọng: Quyền xóa là nghĩa vụ dễ bị kiểm tra nhất sau thông báo xử lý dữ liệu. Thiếu đường xóa thì không viết được trang thông báo đúng sự thật.
- Đề xuất sửa:
  1. Thêm hành động `erase` vào `transitionWebsiteBookingRequest`: OWN, MGR, FDL (không FD, SAL). Xóa C2 + `contact_hmac` + `ip_hmac` **ngay**, trạng thái `declined` lý do mới `erased_on_request` (chỉ hành động này đặt). Ghi `purge_journal` (`policy_key = dsr_erase`) và `audit_event category='security'` không C2. Không `reopen` được. `If-Match` bắt buộc.
  2. Xác minh: yêu cầu xóa đến từ **chính** SĐT/email trên yêu cầu (lễ tân đối chiếu bằng `lookup` theo `contact_hmac`, không đưa liên hệ vào URL), hoặc nhân viên gọi lại đúng số đó. Xin **bản sao** dữ liệu thì chỉ gửi tới đúng liên hệ trên yêu cầu. SEC thêm SR-DSR-04 cho người gửi form web.
  3. Yêu cầu đã `converted`: dữ liệu nằm ở hồ sơ khách → theo quy trình khách (SR-DSR-01, SR-RET-05).
  4. BA thêm WR8 (`new|in_progress|declined|spam → declined/erased_on_request`) vào SM-18 và mã hành động rbac.
- Trạng thái: Open

### FB-R2-SEC-ARC-17
- Mức độ: Minor · **[CHẶN] C-3 (e)**
- Vị trí: erd 9.3 `public_booking_requests_enabled` (khóa thường, OWN, bool); openapi `x-security-parameters` ghi chú; openapi-0.3.7.md 12.5 FE-LP (1) "cờ build `PUBLIC_BOOKING_FORM`"; UXD concept 5.5 `booking.mode` trong `site.json`
- Vấn đề:
  - Bật form là quyết định bắt đầu nhận dữ liệu cá nhân của người lạ từ internet, nhưng khóa này là tham số thường: audit `config`, không có điều kiện nào ở server.
  - Có **ba** công tắc cho cùng một việc: tham số server, cờ build của FE-LP, `booking.mode` của UXD. Cờ build buộc dựng lại trang – trái US-155 AC4 ("Bật/tắt form không cần dựng lại trang"). Lệch nhau thì trang có thể hiện form khi server đã tắt (vẫn an toàn nhờ 404 → khối Zalo) hoặc ngược lại.
- Vì sao quan trọng: Điều kiện C-3 phải được kiểm bằng máy, không chỉ bằng danh sách việc.
- Đề xuất sửa:
  1. `public_booking_requests_enabled` vào `x-security-parameters` (chỉ OWN, audit `security`).
  2. Đặt `true` ở staging/production → server kiểm: có dòng `privacy_notice_version` đang hiệu lực cho mỗi ngôn ngữ landing đang phát hành (`vi`, `en`; `ru` khi có trang RU); khóa ký form đã nạp. Thiếu → 422 (mã do ARC chọn, ví dụ `PRECONDITION_NOT_MET`), không đổi giá trị. Đổi thành công → thông báo OWN và MGR.
  3. Một nguồn sự thật lúc chạy: trang luôn có sẵn mã form; tham số server quyết định (form token 404 → khối Zalo). Cờ build/`booking.mode` chỉ chọn `request` hay `live` (B), không dùng để bật/tắt việc nhận dữ liệu.
- Trạng thái: Open

### FB-R2-SEC-ARC-18
- Mức độ: Major (contract-ahead phương án B – sửa trong hợp đồng ngay, cài cùng B)
- Vị trí: `PublicOfferSnapshot`, `WebsiteBookingRequestInput.offerSnapshot`, `getPublicOffers`, `getPublicAvailability`; ADR-014 4.7; DOM BR-916 (2) ("báo giá = **min**(giá chụp, giá tính lại) nếu xử lý trong 24 giờ và giá chụp ≥ tổng giá sàn")
- Vấn đề:
  - `offerSnapshot` do trình duyệt gửi lên, không có chữ ký. Ai cũng sửa được `totalVnd` xuống bất kỳ số nào ≥ giá sàn; theo BR-916 Desk sẽ báo đúng giá đó trong 24 giờ.
  - `getPublicAvailability` trả còn/hết theo ngày cho từng hạng trong 62 đêm. Hạng chỉ có 1–2 căn thì lịch này cho đối thủ thấy gần như chính xác mức lấp đầy theo ngày. Đây là lựa chọn kinh doanh, nhưng INV cần biết khi chọn B.
- Vì sao quan trọng: Sai tiền (giảm doanh thu kênh trực tiếp) và lộ thông tin kinh doanh. Sửa hợp đồng lúc này gần như không tốn gì; sửa sau khi trang đã chạy thì phải đổi cả trang lẫn Desk.
- Đề xuất sửa:
  1. `getPublicOffers` trả thêm `offerToken` cho mỗi dòng: HMAC-SHA256 bằng khóa dẫn xuất riêng `keyedHash('public_offer')` trên `propertyId | roomType | arrival | departure | adults | các nhóm tuổi | totalVnd | priceVersion | computedAt`, hạn 24 giờ.
  2. `offerSnapshot` thêm `offerToken` (bắt buộc khi có snapshot). Server lưu snapshot **chỉ khi** chữ ký đúng và khớp ngày/số người/hạng của yêu cầu; sai hoặc thiếu → không lưu snapshot, cờ `offer_unverified`, yêu cầu vẫn nhận.
  3. DOM sửa BR-916 (2): chỉ "giữ giá chụp" với snapshot đã kiểm chữ ký (ORC chuyển).
  4. ORC thêm vào nhược điểm của ESC-020 L7-B: "đối thủ xem được lịch còn/hết theo hạng phòng".
- Trạng thái: Open

### FB-R2-SEC-ARC-19
- Mức độ: Minor · thuộc C-12 (a)
- Vị trí: `WebsiteBookingRequest` (C2 gắn `x-rbac-field: D28`); `rbac-matrix.md` mục 6 dòng D28 "Lead … SAL M · CTV M"; `listWebsiteBookingRequests`/`getWebsiteBookingRequest` `x-scope: { sales_staff: unassigned_or_own }`; `createHoldFromQuote` mô tả 0.3.7 bổ sung 2; `rbac-cases.json` (`"rbac": []` cho 3 operation)
- Vấn đề:
  1. D28 là trường của **lead**, CTV được xem phần của mình (M). Dùng lại cho yêu cầu web làm sai ý nghĩa và sinh ca kiểm trường không đúng nếu sau này có màn khác dùng chung.
  2. SAL thấy tên, SĐT, lời nhắn của **mọi** yêu cầu `new` chưa ai nhận. Để quyết định nhận việc, SAL chỉ cần ngày, số khách, hạng, ngôn ngữ, kênh.
  3. SAL lưu báo giá khi yêu cầu còn của mình; sau đó yêu cầu bị trả lại và người khác nhận. SAL vẫn `createHoldFromQuote` từ báo giá cũ → yêu cầu của người khác thành `converted` và bị xóa C2.
  4. Ba operation chưa có mã hành động trong rbac-matrix (`rbac: []`).
- Vì sao quan trọng: SR-AZ-02 (phạm vi trong truy vấn), tối thiểu hóa người thấy C2.
- Đề xuất sửa:
  1. BA thêm mã trường mới **D30 – Yêu cầu đặt phòng từ website (tên, liên hệ, lời nhắn)**: OWN/MGR, FDL/FD Đầy; SAL: chưa nhận K, của mình Đầy; CTV, HK, MT, khách K. ARC đổi `x-rbac-field` sang D30.
  2. Với SAL, yêu cầu `new` chưa giao trả **không có** `guestName`, `phone`, `email`, `note` (thuộc tính vắng, không phải `null`). `claim` trả bản đầy đủ. Mỗi lần `claim` đã có audit `state` – đủ để phát hiện nhận hàng loạt.
  3. `createHoldFromQuote`: chỉ chuyển yêu cầu (WR6) khi người gọi là FD+ hoặc đang được giao yêu cầu đó; khác → vẫn tạo giữ chỗ nguồn `website`, không đổi yêu cầu, thêm mục "Cần chú ý" cho người đang xử lý.
  4. BA thêm mã hành động vào `rbac-matrix.md` cùng commit bỏ `x-round` (backlog dòng 25 đã nhắc).
  5. (Nên) `mark-spam` do SAL: FD+ thấy trong bộ lọc "Spam" tới khi xóa, mở lại được (WR5) – để không mất yêu cầu thật vì bấm nhầm.
- Trạng thái: Open

### FB-R2-SEC-ARC-20
- Mức độ: Minor
- Vị trí: erd 9.2/9.3 và ghi chú `x-security-parameters` (`retention.web_request_*`, `public_booking_request_daily_cap`, `web_request_response_minutes` = 30) so với DOM `business-rules.md` BR-911…916 (`web_inquiry.stale_days`, `web_inquiry.retention_days_spam`, `web_inquiry.retention_days_closed`, `web_inquiry.max_age_days`, `web_inquiry.ip_hmac_days`, `public_site.inquiry_daily_cap`, `public_site.spam_pow_threshold_per_week`, `web_inquiry.response_minutes` = 15)
- Vấn đề: Cùng một tham số có hai tên, có chỗ hai giá trị mặc định khác nhau. Nếu BE tạo khóa theo tên trong BR, các khóa hạn lưu và trần sẽ **không** có biên SEC và không chỉ OWN sửa.
- Vì sao quan trọng: Tham số bảo mật chỉ có nghĩa khi có một khóa duy nhất, có biên cứng (SR-RET-01, BUG-R1-SEC-02).
- Đề xuất sửa:
  1. Tên trong catalogue của ARC (erd 9.2/9.3, `x-security-parameters`) là tên chính thức. DOM sửa BR-911…916 trỏ tới đúng tên đó (ORC chuyển); BE chỉ tạo khóa có trong catalogue.
  2. `spam_pow_threshold_per_week` (điều kiện bật tầng 2) là tham số bảo mật: biên 5–50, mặc định 10.
  3. Hai con số "hạn trả lời" (30 của ARC, 15 nội bộ + 60 công khai của DOM) – không phải việc SEC, ORC xếp ARC + DOM thống nhất.
- Trạng thái: Open

### FB-R2-SEC-ARC-21
- Mức độ: Major · **[CHẶN] C-12 (b), (c)**
- Vị trí: `WebsiteBookingRequestInput.guestName`/`note` ("bỏ ký tự điều khiển"); `suspiciousFlags` `contains_url`; openapi-0.3.7.md 12.5 FE-B (3) ("nút sao chép SĐT, mở Zalo/WhatsApp/gọi"); ADR-014 4.6 ("C2 không vào log…"); BR-913 (4) ("bằng tài khoản của cơ sở … không dùng Zalo cá nhân của nhân viên")
- Vấn đề:
  1. Đây là lần đầu dữ liệu do **người lạ trên internet** gõ hiện lên màn hình nhân viên đang đăng nhập Desk. React tự thoát HTML, nhưng còn các đường khác: tự tạo link trong lời nhắn (kẻ xấu gửi link lừa đảo tới lễ tân), ký tự đảo chiều văn bản (U+202A–U+202E, U+2066–U+2069) làm tên/lời nhắn hiển thị khác nội dung thật, link dựng từ dữ liệu khách.
  2. "Bỏ ký tự điều khiển" (nhóm Cc) không bỏ được ký tự đảo chiều (nhóm Cf). Bộ nhận diện số giấy tờ chưa áp cho `guestName`.
  3. Nút "mở Zalo" từ Desk tới SĐT khách mở chat bằng **tài khoản Zalo đang đăng nhập trên máy đó** – có thể là Zalo cá nhân. Trái BR-913 (4), và trái câu chống giả danh trên trang ("OTTIMO chỉ liên hệ từ các kênh ghi trên trang này"): khách quen nhận tin từ số lạ thì kẻ lừa đảo cũng lợi dụng được.
  4. Log: chưa có test chứng minh lời nhắn bị từ chối vì có số thẻ/số giấy tờ không đi vào log (chính chuỗi số đó). Log Postgres: nếu sau này OPS bật log câu lệnh chậm, tham số câu lệnh `INSERT` (tên, SĐT) sẽ vào log.
- Vì sao quan trọng: Lỗi hiển thị dữ liệu lạ trong Desk có thể dẫn tới lừa đảo nhân viên hoặc chiếm phiên (TM-05). Log chứa dữ liệu cá nhân kéo dài thời gian lưu ngoài kiểm soát (T16 90 ngày).
- Đề xuất sửa:
  1. Server (trước kiểm độ dài): chuẩn hóa NFC; bỏ nhóm Cc và ký tự định dạng hướng (U+200E, U+200F, U+202A–U+202E, U+2066–U+2069) khỏi `guestName`, `note`, `transition.note`. Áp bộ nhận diện số thẻ/số giấy tờ cho cả `guestName`.
  2. FE-B: mọi trường của yêu cầu hiển thị dạng chữ, **không** tự tạo link (kể cả khi có cờ `contains_url` – chỉ hiện nhãn cảnh báo "Lời nhắn có đường link – không bấm"), không `dangerouslySetInnerHTML` (SR-INP-04), `white-space: pre-wrap` có giới hạn chiều cao.
  3. Link liên hệ chỉ dựng từ `phone` E.164 server trả, đúng mẫu `^\+[1-9][0-9]{7,14}$`: `tel:+…`; `https://wa.me/<chữ số>`. **Không** có nút mở chat Zalo/Telegram/Viber tới SĐT khách từ Desk; thay bằng "Sao chép SĐT" + dòng nhắc "Liên hệ bằng tài khoản OTTIMO (Zalo OA / Zalo của cơ sở) – không dùng tài khoản cá nhân" (BR-913 (4), SEC INT-12). Máy chạy Desk không cài app Zalo (SR-DEV-07/08).
  4. Thông báo, SSE, outbox, audit, `state_transition`, `purge_journal`: không C2 (hợp đồng đã ghi – thêm test snapshot).
  5. OPS (qua ORC): ghim `log_parameter_max_length = 0` và `log_parameter_max_length_on_error = 0` trong cấu hình Postgres production/staging; nếu bật `log_min_duration_statement` thì vẫn không có tham số. Áp cho cả Desk (dữ liệu C3).
  6. Ca test: Phụ lục B.2.
- Trạng thái: Open

### FB-R2-SEC-ARC-22
- Mức độ: Suggestion – **SEC quyết: không dùng Turnstile**
- Vị trí: ADR-014 4.4 tầng 2, tầng 3; ADR-014 1.4 CSP (`worker-src 'none'`); DOM `public_site.spam_pow_threshold_per_week`
- Vấn đề: ORC giao SEC chọn giữa Turnstile và "không bên thứ ba".
- Vì sao quan trọng: Turnstile gửi IP và thông tin trình duyệt của mọi người điền form sang Cloudflare (nước ngoài), phải nới CSP (`script-src`, `frame-src`), sửa thông báo xử lý dữ liệu, và trái tinh thần ESC-002 A (dữ liệu tại Việt Nam). Với một cơ sở nhỏ, lượng spam dự kiến thấp; tầng 1 + thử thách tự host là đủ.
- Đề xuất sửa (SEC chốt):
  1. **Lúc mở: tầng 1** như ADR-014 4.4 + ARC-13.
  2. **Tầng 2 – proof-of-work tự host** (ví dụ ALTCHA, lõi giấy phép MIT theo trang của nhà phát triển [Nguồn – altcha.org; đọc tệp LICENSE trong kho mã trước khi dùng]). Điều kiện bật (một trong ba): `mark-spam` > `spam_pow_threshold_per_week` hai tuần liền; chạm trần cơ sở ≥ 2 ngày trong 7 ngày; ô bẫy + form token sai > 200/ngày. Bật bằng tham số, không sửa trang.
  3. Hợp đồng ghi sẵn (contract-ahead) trường tùy chọn `pow` trong `WebsiteBookingRequestInput` và endpoint/trường cấp thử thách, để bật tầng 2 không đổi hợp đồng. Lưu ý CSP: thư viện có thể dùng Web Worker → khi bật cần `worker-src 'self'` (không `blob:`) – ARC kiểm lúc chọn thư viện.
  4. **Tầng 3 – Turnstile: không dùng.** Chỉ xét lại qua ESC mới, khi tầng 2 đã bật mà spam vẫn làm hỏng hàng chờ; lúc đó SEC đánh giá lại chuyển dữ liệu ra nước ngoài.
  5. Trần cơ sở bị làm đầy: OWN nâng trần trong biên 50–500 ngay trong ngày; không trừ lùi bộ đếm khi đánh dấu spam (tránh vòng lặp kẻ xấu làm đầy lại).
- Trạng thái: Open

### FB-R2-SEC-ARC-23
- Mức độ: Minor · thuộc C-11
- Vị trí: `getPublicFormToken` (`notBefore` = lúc cấp + 3 giây); `createWebsiteBookingRequest` bước 6 ("trang lấy mã mới và gửi lại **một** lần"); openapi-0.3.7.md 12.5 FE-LP (4)
- Vấn đề: Khi gặp `FORM_TOKEN_INVALID`, trang lấy mã mới rồi gửi lại **ngay** → mã mới chắc chắn còn trong 3 giây đầu → lần gửi lại luôn lỗi. Khách điền nhanh (tự điền của trình duyệt) hoặc để thẻ mở quá 2 giờ sẽ không gửi được.
- Vì sao quan trọng: Mất yêu cầu thật; khách nghĩ hệ thống hỏng.
- Đề xuất sửa: `PublicFormToken` thêm `minDelaySeconds` (= 3). Trang chờ đủ số giây đó (tính bằng đồng hồ của trình duyệt từ lúc nhận mã – không so với giờ máy chủ) trước khi gửi lại; hiện "Sending…" trong lúc chờ. Ca test: gửi sau 1 giây → 422 → tự gửi lại sau ≥ 3 giây → 202.
- Trạng thái: Open

---

## 5. Thẻ cho UXD – `concept.md` v1.2, `mock/index.html` v1.2

### FB-R2-SEC-UXD-04
- Mức độ: Minor · **[CHẶN] C-3 (a), (b)**
- Vị trí: mock dòng 915–918 (ô đồng ý, dòng "privacy notice, linked here before launch"), dòng 1318 (`consentVersion: 'TBD-SEC'`); concept 5.2 dòng Consent
- Vấn đề: Câu đồng ý của UXD đúng hướng (một mục đích, không tích sẵn). Còn thiếu: link tới thông báo, lớp thông báo ngắn ngay tại chỗ thu (hạn lưu, kênh trả lời), cách gán phiên bản.
- Vì sao quan trọng: Khách phải thấy những điểm chính **trước khi** gửi, không chỉ sau một link (thông báo theo lớp).
- Đề xuất sửa:
  1. Dùng câu chữ ở **Phụ lục A** (A.1, A.2) cho cả EN và VI. Chữ pháp lý không dịch máy (US-155 AC10).
  2. `consentVersion` lấy từ tệp thông báo đã phát hành cùng bản dựng (`YYYY-MM-DD`), không viết tay. Đổi chữ trong A.1/A.2 hoặc thông báo → phiên bản mới.
  3. Link "Privacy notice" mở trang `/privacy/#booking-requests` (`/vi/privacy/#yeu-cau-dat-phong`) trong cùng thẻ trình duyệt; form giữ dữ liệu khi khách quay lại (không lưu vào trình duyệt – chỉ trong bộ nhớ trang; nếu trang tải lại thì mất, chấp nhận).
  4. RU: chỉ khi có trang RU (US-156) và bản thông báo RU đã duyệt.
- Trạng thái: Open

### FB-R2-SEC-UXD-05
- Mức độ: Minor
- Vị trí: mock dòng 910–913 (ô bẫy `name="website"`, `.hp`, `autocomplete="off"`); concept 5.2 dòng Honeypot, 5.4 (trang cảm ơn)
- Vấn đề: Ô bẫy có giá trị → server trả 202 giống hệt nhưng **không lưu**. Nếu trình quản lý mật khẩu hoặc tự điền của trình duyệt điền vào ô "Website", khách thật thấy "Request sent" mà Desk không có gì. `autocomplete="off"` không phải lúc nào cũng được tôn trọng.
- Vì sao quan trọng: Mất khách thật một cách im lặng – loại lỗi khó phát hiện nhất.
- Đề xuất sửa:
  1. Ô bẫy đưa ra ngoài màn hình bằng class (không `display:none`, không `style=`); nhãn đọc được "Leave this field empty"; thêm thuộc tính bỏ qua của các trình quản lý mật khẩu phổ biến (ví dụ `data-1p-ignore`, `data-lpignore="true"`) [Chưa xác minh đủ danh sách – FE-LP tra lúc làm].
  2. QA thêm ca: tự điền trên Chrome Android, Safari iOS, Samsung Internet, một trình quản lý mật khẩu → ô bẫy luôn rỗng.
  3. Trang cảm ơn thêm một dòng lối thoát: "If you have not heard from us by {replyBy}, call 08.4444.0909 or message us on Zalo with this number." / "Nếu đến {giờ} OTTIMO chưa liên hệ, vui lòng gọi 08.4444.0909 hoặc nhắn Zalo kèm mã này." Kết hợp ARC-15 điểm 2 để lễ tân tìm được mã.
  4. Bộ đếm `spam_honeypot` theo ngày hiện cho OWN (cùng màn số liệu US-158) để thấy bất thường.
- Trạng thái: Open

### FB-R2-SEC-UXD-06
- Mức độ: Suggestion – **SEC xác nhận câu chống giả danh, có sửa**
- Vị trí: concept 6 dòng cuối ("OTTIMO only messages you from the contacts listed on this page and your booking platform's inbox. We never ask for card numbers and never change bank details by message."); DOM-06 (cũ)
- Vấn đề: Đổi sang "contacts listed on this page" là đúng (nay có Facebook). Ở Đà Lạt, lừa đặt cọc qua fanpage/Zalo giả mạo là kiểu lừa đảo phổ biến. Câu sẽ mạnh hơn nếu nêu tên chủ tài khoản nhận cọc – điều kẻ giả mạo không làm giả được trên mã QR ngân hàng.
- Vì sao quan trọng: Bảo vệ khách khỏi mất tiền dưới tên OTTIMO, dù hệ thống không bị tấn công.
- Đề xuất sửa – câu SEC chốt (UXD được biên tập nhịp chữ, giữ nghĩa):
  - EN: "We only contact you from the channels listed on this page, or your booking platform's inbox. We never ask for card numbers. Deposits go only to an account in the name of {receivingAccountHolder}, and we never change bank details by message."
  - VI: "OTTIMO chỉ liên hệ bạn qua các kênh ghi trên trang này, hoặc hộp thư của nền tảng bạn đặt phòng. OTTIMO không bao giờ hỏi số thẻ. Tiền cọc chỉ chuyển vào tài khoản đứng tên {receivingAccountHolder}; OTTIMO không bao giờ đổi số tài khoản qua tin nhắn."
  - `{receivingAccountHolder}` = tên chủ tài khoản trong tham số `payment_receiving_account` (C1 – công khai được), lấy lúc dựng trang; chờ ESC-008 (tên pháp nhân).
  - "Các kênh ghi trên trang" phải đúng là các kênh nhân viên dùng (BR-913 (4)). Nếu OTTIMO không trả lời qua Messenger, thêm: "Our Facebook page is for news. We do not confirm bookings or take deposits through Facebook messages." / "Fanpage Facebook dùng để đăng tin. OTTIMO không xác nhận đặt phòng hay nhận cọc qua tin nhắn Facebook." – INV xác nhận qua ORC.
  - Việc của INV (không phải câu hỏi, không tốn tiền – ORC đưa vào danh sách "INV cần làm" của ESC-020): đặt tên người dùng cho fanpage (thay `profile.php?id=…`), bật xác thực 2 lớp cho mọi quản trị viên fanpage, ghim một bài "Kênh chính thức của OTTIMO" có link về website.
- Trạng thái: Open

### FB-R2-SEC-UXD-07
- Mức độ: Minor
- Vị trí: mock dòng 1309–1326 (`payload()`: `stayType`, `months`, `infants`, `listingSlug`, `name`, `preferredContact`, `message`); dòng 1304 (`refCode()` dạng `XXXX-XXXX`, bảng chữ khác Crockford); concept 5.7 (link fanpage `/vi/?…utm_campaign=page_book_button#book`); concept 15.2
- Vấn đề:
  - Tên khóa và ngữ nghĩa của form khác hợp đồng (`guestName`, `preferredChannel`, `note`, `roomType`, một ô ngày). Schema có `additionalProperties: false` → gửi đúng như mock thì **mọi** yêu cầu nhận 422 và khách bị đẩy sang Zalo – các kiểm thử SEC trong Phụ lục B không chạy được.
  - Mã yêu cầu hiển thị `XXXX-XXXX`, còn Desk tìm theo `^[0-9A-Za-z]{8}$` → khách gõ có gạch nối, lễ tân dán vào ô tìm sẽ lỗi; yêu cầu không ai tìm thấy thì nằm tới hạn `stale`.
  - Hai dạng link "Book now" (UXD: trang chủ + `#book`; ARC: `/book/`) – nguồn phụ vẫn đúng nhờ UTM, nhưng cần một link chuẩn.
- Vì sao quan trọng: Form chỉ an toàn khi đúng hợp đồng đã review; lệch tên khóa dễ dẫn tới "nới schema cho chạy", mất lớp chặn trường lạ (SR-INP-01).
- Đề xuất sửa:
  1. FE-LP dùng schema zod sinh từ `WebsiteBookingRequestInput` (`packages/contracts`), không tự đặt tên khóa. Phần khác về sản phẩm (một ô ngày hay kiểu ở + số tháng, `infants`) ARC + UXD thống nhất qua ORC; SEC chỉ yêu cầu kết quả theo ARC-14.
  2. Desk bỏ gạch nối/khoảng trắng và chuyển chữ hoa trước khi tìm `refCode`; trang hiển thị nhóm 4–4 bằng khoảng trắng hẹp (UXD chọn), dùng đúng bảng chữ Crockford của server.
  3. DOM/PO chốt **một** link "Book now" cho fanpage; trang đích phải sống cả khi form tắt (ADR-014 4.2).
- Trạng thái: Open

### FB-R2-SEC-UXD-08
- Mức độ: Suggestion
- Vị trí: mock dòng 770 (`<form method="post" action="#">`), 930–944 (trang cảm ơn, nút "Open Zalo"); concept 5.4, 5.5
- Vấn đề: Mock đã làm đúng các điểm chính (không JS thì ẩn form; tên chèn bằng `textContent`; mã yêu cầu không vào URL; Facebook là link `rel="noopener noreferrer"`). Ghi lại để FE-LP giữ khi dựng thật.
- Vì sao quan trọng: Các điểm này dễ mất khi chuyển sang Astro.
- Đề xuất sửa:
  1. Thẻ `<form>` render với thuộc tính `hidden` và **không** có `action` trỏ tới API; module script mới bỏ `hidden`. Không JS → không bao giờ gửi được, kể cả bằng GET.
  2. Không đưa mã yêu cầu, tên, ngày vào URL, `#hash`, `history.pushState`, tiêu đề trang.
  3. Nút "Open Zalo" là link OA (`site.json`), không chèn dữ liệu khách. Nếu sau này thêm nút WhatsApp soạn sẵn tin (`wa.me/…?text=`), chỉ chèn mã yêu cầu – không tên, không ngày.
  4. ADR-014 4.2 ghi `rel="noopener"` cho link fanpage – ARC sửa thành `noopener noreferrer` như mock.
- Trạng thái: Open

---

## 6. Quyết định của SEC (trong quyền SEC – đề xuất dòng `decision-log.md`, ORC ghi khi commit)

- `| 2026-10-17 | 2 | Form yêu cầu đặt phòng: không dùng Cloudflare Turnstile hay captcha bên thứ ba. Tầng 1 (ô bẫy, form token, Origin, giới hạn RAM trước DB + DB, trần cơ sở 503); tầng 2 proof-of-work tự host bật bằng tham số theo điều kiện ARC-22; Turnstile chỉ xét lại qua ESC | SEC | ARC-22; ESC-002 A |`
- `| 2026-10-17 | 2 | Form chỉ thu MỘT cách liên hệ (SĐT cho Zalo/WhatsApp/Telegram/Viber/gọi, hoặc email); trẻ em đếm theo nhóm tuổi BR-110, không tuổi chính xác | SEC | ARC-14; tối thiểu hóa |`
- `| 2026-10-17 | 2 | Mã hạn lưu T19 = website_booking_request (biên ARC-03); thêm thao tác xóa ngay theo yêu cầu khách (OWN/MGR/FDL, xác minh qua chính liên hệ trên yêu cầu) | SEC | ARC-16; xác nhận giả định T19 của ARC |`
- `| 2026-10-17 | 2 | Điều kiện bật form trên production: C-1, C-2, C-3 (mở rộng), C-11, C-12, C-13, SEC-G1/G2 | SEC | landing-booking-SEC.md mục 1 |`
- `| 2026-10-17 | 2 | Không dùng tính năng đặt lịch/biểu mẫu/Lead Ads của Facebook cho "đặt phòng trên fanpage": nút fanpage chỉ là link về website (dữ liệu không nằm ở Meta) | SEC | FB-INV-002 ý 3; BR-911 (5); ESC-002 A |`

Xác nhận giả định của ARC/UXD liên quan SEC: **T19** – đồng ý. Mặc định hạn lưu trong biên ARC-03 – đồng ý. Zalo đứng đầu ở EN và VI – không ảnh hưởng bảo mật. Câu chống giả danh của UXD – đồng ý có sửa (UXD-06).

---

## 7. Pháp lý và nguồn (tra 17/10/2026 – mọi điểm cần luật sư xác nhận)

| Điểm | Nội dung | Nguồn | Mức |
|---|---|---|---|
| L-11 | Luật Thương mại điện tử số 122/2025/QH15 và NĐ 248/2026/NĐ-CP (ban hành 30/06/2026) cùng có hiệu lực từ 01/07/2026 | https://moit.gov.vn/tin-tuc/bo-cong-thuong-pho-bien-luat-thuong-mai-dien-tu-va-nghi-dinh-so-248-2026-nd-cp.html | [Nguồn] |
| L-12 | Website đã thông báo/đăng ký trước 01/07/2026 được hoạt động theo hồ sơ cũ tới hết 30/06/2027; NĐ 248/2026 hướng dẫn thủ tục thông báo, đăng ký nền tảng (khoản 4 Điều 14 của Luật) | https://thuvienphapluat.vn/phap-luat-nha-dat/toan-van-luat-thuong-mai-dien-tu-2025-luat-so-1222025qh15-moi-nhat-ra-sao-13968.html (qua tìm kiếm) | [Bên thứ ba – chưa đọc toàn văn] |
| L-13 | Website riêng của một cơ sở lưu trú có form "yêu cầu đặt phòng" (không thanh toán) có thuộc diện thông báo/đăng ký theo luật mới không | – | [Chưa xác minh – luật sư] |
| L-14 | ALTCHA: lõi (widget, thư viện xác minh) giấy phép MIT, tự host được | https://altcha.org/open-source-captcha/ | [Nguồn nhà phát triển – đọc LICENSE trong kho mã] |
| L-15 | Hạn xử lý yêu cầu xóa của chủ thể (NĐ 356/2025) – bài tổng hợp nêu 20 ngày | Như L-2 của `landing-zalo-SEC.md` | [Bên thứ ba] |

Đề nghị ORC sửa ESC-001 (không mở ESC mới):
1. **LZ-8**: thay căn cứ "NĐ 52/2013, sửa bởi NĐ 85/2021" bằng "Luật TMĐT 2025 (122/2025/QH15) + NĐ 248/2026/NĐ-CP, hiệu lực 01/07/2026"; hỏi: website OTTIMO có form yêu cầu đặt phòng (không thanh toán) có phải thông báo/đăng ký không, hồ sơ gồm gì, chân trang phải hiện thông tin doanh nghiệp nào. Ghi rõ form nay thuộc **luồng LP-v1** (không còn "v2, Round 3").
2. **LZ-2**: như cũ, sửa mốc thành LP-v1. Nếu luật sư trả lời "thuộc thực hiện thỏa thuận", ARC đổi `consent` thành tùy chọn + ghi `legal_basis`; trang đổi ô đồng ý thành dòng thông báo. Hợp đồng hiện tại không chặn hướng này.
3. **LZ-7**: thêm Telegram, Viber và nhà cung cấp hộp thư `booking@` (khi khách chọn kênh đó, SĐT/email và nội dung trao đổi đi qua máy chủ của họ, có thể ở nước ngoài).
4. Câu phụ mới gộp vào LZ-1: số trẻ em theo nhóm tuổi (không tên, không tuổi chính xác) đi kèm tên người lớn có thuộc "dữ liệu trẻ em" cần đồng ý của cha mẹ không.

---

## 8. Việc chuyển qua ORC (không phải thẻ SEC)

- **Nhãn A/B**: INV đã chọn A (`FB-INV-002.md`, mục "Xác nhận của INV") → ARC, PO, UXD bỏ "[GIẢ ĐỊNH – chờ INV]" ở ADR-014 4.1, mô tả operation, US-155, concept G-9.
- **ARC + DOM**: enum nguồn phụ khác nhau (ARC `facebook|instagram|google|zalo|qr|other|null`; BR-911 `facebook|google|direct|other`); hạn trả lời (ARC-20 điểm 3).
- **ARC + UXD**: một ô ngày hay "kiểu ở + số tháng"; `infants` (đã nằm trong ARC-14); kiểm sức chứa ở trang (UXD chặn, ADR không chặn).
- **OPS**: ARC-21 điểm 5 (log Postgres); Caddy origin landing chỉ proxy 2 đường dẫn + giới hạn body 16 KB (đã có trong ADR 1.4).
- **QA**: Phụ lục B vào bộ ca US-155 (gắn `[BLOCKED]` tới khi có mã).

## 9. Việc SEC tự làm tiếp (chưa commit)

- `security-requirements.md` v0.4: SR-RL-10/11 (bước 0 RAM, bulkhead, /48 – ARC-13), SR-RL-12…14 như `landing-zalo-SEC.md` mục 7; **SR-DSR-04** (yêu cầu của người gửi form web – ARC-16); SR-INP-07 (chuẩn hóa Unicode, bỏ ký tự hướng – ARC-21); SR-LOG-06 thêm cảnh báo "chạm trần form", "429 form > 50/giờ"; SR-LOG-07 log Postgres không tham số.
- `data-risk-assessment.md`: **T19** `website_booking_request`; dòng dữ liệu mới D30 (phối hợp BA); P01 ghi quy tắc một cách liên hệ.
- `threat-model.md`: cập nhật TM-63 (lạm dụng form – bước 0, bulkhead, chênh lệch phát lại), thêm TM-67 (giả mạo ảnh chụp giá – phương án B), TM-68 (lừa đảo nhân viên qua nội dung form).
- Khung thông báo đầy đủ (Phụ lục A.4) chuyển thành tệp trong repo landing theo phiên bản sau khi luật sư duyệt.

## 10. Điểm làm tốt (nên giữ)

- **ARC**: Không có operation "convert" riêng – mọi đường chuyển đơn đi qua cùng ràng buộc chống trùng căn, giá, hạn mức giữ chỗ. Phản hồi 202 duy nhất không có dữ liệu khách; `refCode` 40 bit ngẫu nhiên, không phải yếu tố xác minh. Hạn lưu có trần tuyệt đối và job không phụ thuộc trạng thái – đúng bài học BE-32. Phương án B ghi sẵn nhưng không cài, và chỉ trả còn/hết, không số phòng.
- **UXD**: Form chỉ thu một cách liên hệ và đếm trẻ theo nhóm tuổi – tối thiểu hóa tốt hơn hợp đồng. Không JS thì ẩn form (không bao giờ lộ dữ liệu qua URL). Lỗi 429/503 luôn có lối Zalo/gọi. Facebook là link thường có `noreferrer`, không SDK.
- **Cả hai**: Zalo đứng đầu nhưng các kênh khác vẫn một chạm; không ô nhận ưu đãi trên form (DOM-05); không tự gửi tin tới liên hệ chưa xác minh.

---

## Phụ lục A – Câu chữ đồng ý và khung thông báo xử lý dữ liệu (bản nháp SEC – luật sư duyệt, ESC-001)

Giọng văn theo Brand Guidelines: ngắn, lịch sự, điềm tĩnh; tiếng Anh dẫn, tiếng Việt hỗ trợ; không emoji. `{…}` là giá trị lấy từ cấu hình lúc dựng trang.

**A.1 Ô đồng ý** (ngay trên nút gửi; không tích sẵn; bấm vào chữ cũng tích được)
- EN: "I agree that OTTIMO may use the details in this form only to reply to this request."
- VI: "Tôi đồng ý để OTTIMO chỉ dùng thông tin trong biểu mẫu này để trả lời yêu cầu này."

**A.2 Dòng thông báo ngắn** (ngay dưới ô, luôn hiện, chữ cỡ nhỏ)
- EN: "If you do not book, we delete these details within 180 days. We reply only from the channels listed on this page. Privacy notice"
- VI: "Nếu bạn không đặt phòng, OTTIMO xóa thông tin này trong tối đa 180 ngày. OTTIMO chỉ trả lời từ các kênh ghi trên trang này. Thông báo xử lý dữ liệu"
- "180 ngày" = biên trên của `retention.web_request_max_age_days`, nên câu luôn đúng dù OWN chỉnh tham số trong biên.

**A.3 Câu lỗi** – giữ câu của UXD (concept 5.3, "Please tick the box so we can reply.").

**A.4 Mục "Booking requests / Yêu cầu đặt phòng" trong trang thông báo** (`/privacy/#booking-requests`, `/vi/privacy/#yeu-cau-dat-phong`). Viết EN trước, VI sau, mỗi ý 1–2 câu:
1. **Who we are / OTTIMO là ai**: {tên pháp nhân}, {mã số thuế}, {địa chỉ}; liên hệ về dữ liệu: {email}, Zalo {kênh chính thức}. (Chờ ESC-008.)
2. **What we collect / Thông tin thu thập**: tên gọi; **một** cách liên hệ (số điện thoại cho Zalo, WhatsApp, Telegram, Viber hoặc cuộc gọi, hoặc email); ngày ở; số người lớn và số trẻ em theo nhóm tuổi; hạng phòng mong muốn; lời nhắn. Kèm theo: trang bạn gửi form và nhãn chiến dịch trong đường link (không cookie); địa chỉ IP ở dạng đã mã hóa một chiều để chống lạm dụng.
3. **Why / Mục đích**: trả lời yêu cầu, báo giá, giữ phòng khi bạn đồng ý; bảo vệ form khỏi lạm dụng. Không dùng cho quảng cáo, không gửi tin ưu đãi.
4. **Legal basis / Căn cứ**: sự đồng ý của bạn ở ô đồng ý. [Luật sư xác nhận – LZ-2]
5. **How / Cách xử lý**: lưu trên máy chủ tại Việt Nam; chỉ nhân viên lễ tân, quản lý và nhân viên bán phòng được giao yêu cầu mới xem được; chúng tôi không tự gửi tin hay email khi bạn bấm gửi.
6. **Who else receives it / Ai khác nhận**: nhà cung cấp máy chủ tại Việt Nam {tên}; khi chúng tôi trả lời, ứng dụng bạn chọn – Zalo (VNG), WhatsApp (Meta), Telegram, Viber – hoặc nhà cung cấp email {tên} xử lý tin nhắn theo chính sách của họ, máy chủ có thể ở ngoài Việt Nam. [Luật sư – LZ-7]
7. **How long / Thời gian lưu**: thành đặt phòng → chuyển sang hồ sơ khách và áp thông báo dành cho khách lưu trú; không thành đặt phòng → yêu cầu tự đóng sau {30} ngày không trao đổi và tên, liên hệ, lời nhắn bị xóa trong tối đa 180 ngày kể từ lúc gửi; yêu cầu spam xóa trong 7 ngày; bản sao lưu tự hết hạn sau tối đa 35 ngày.
8. **Your rights / Quyền của bạn**: xem, sửa, xóa, rút đồng ý – nhắn {kênh} hoặc gửi email {email} kèm **mã yêu cầu**; chúng tôi xác minh bằng chính số điện thoại/email bạn đã ghi và trả lời trong {hạn luật định – luật sư}. Rút đồng ý thì chúng tôi ngừng liên hệ và xóa yêu cầu.
9. **Please note / Lưu ý**: chỉ ghi số điện thoại/email của chính bạn – người khác sẽ nhận tin của chúng tôi nếu bạn ghi số của họ; không ghi số thẻ, số giấy tờ hay thông tin sức khỏe.
10. **Cookies**: trang không dùng cookie theo dõi; chỉ đếm tổng số lượt theo ngày (ARC-11).
11. **Complaints / Khiếu nại**: {cơ quan có thẩm quyền về bảo vệ dữ liệu cá nhân – luật sư điền}.
12. **Version / Phiên bản**: {YYYY-MM-DD}; bản trước được lưu, xem được theo yêu cầu.

---

## Phụ lục B – Ca kiểm bắt buộc trước mốc "form" (BE-D DoD + QA)

**B.1 Endpoint công khai (C-11)**
1. 31 POST/giờ từ một IP, đều thiếu form token → lần 31 nhận 429 trước khi có truy vấn DB nào (đếm truy vấn bằng log test).
2. 10 request đồng thời giữ kết nối lâu → request thứ 5 nhận 503 `SERVICE_UNAVAILABLE`; Desk vẫn trả `listReservations` < 1 giây trong lúc đó.
3. Không `Origin` / `Origin: null` / `Origin: https://desk.<tên-miền>` → 403. `Content-Type: text/plain` → bị từ chối.
4. Gửi kèm cookie phiên nhân viên + `X-CSRF-Token` hợp lệ → kết quả giống hệt khi không có cookie; không ghi `user_id` vào bản ghi/audit.
5. `Origin: https://<tên-miền gốc>` gọi một thao tác ghi của nhân viên và của khách → 403.
6. `X-Forwarded-For` giả từ client → bộ đếm vẫn theo IP thật (SR-SECR-07).
7. Phát lại cùng `Idempotency-Key` cho: yêu cầu lưu thật, yêu cầu vượt giới hạn liên hệ, ô bẫy → cùng `refCode`, cùng header `Idempotent-Replayed` (ARC-15).
8. Gửi lần 4/ngày cùng SĐT → 202, không bản ghi mới; mã trả về tìm được trong Desk (ARC-15 điểm 2).
9. Gửi sau 1 giây → 422 `FORM_TOKEN_INVALID` → trang tự gửi lại sau ≥ 3 giây → 202 (ARC-23).
10. Thiếu `PUBLIC_FORM_SIGNING_KEY_FILE` hoặc < 32 byte khi tham số bật ở staging → dừng khởi động. Đặt `public_booking_requests_enabled = true` khi chưa có dòng `privacy_notice_version` → 422 (ARC-17).
11. 101 yêu cầu hợp lệ từ nhiều IP → yêu cầu 101 nhận 503 `SITE_BUSY`, 1 thông báo OWN (ARC-02 cũ).
12. Một dải IPv6 /48 gửi từ 41 dải /64 khác nhau trong ngày → lần 41 nhận 429 (ARC-13 điểm 5).

**B.2 Phía Desk (C-12)**
1. `guestName` = `<img src=x onerror=alert(1)>`, `note` = `Click https://evil.example/login` → hàng chờ, ngăn chi tiết, chuông thông báo hiển thị nguyên chữ, không có thẻ `<a>`, không chạy script; cờ `contains_url` hiện nhãn cảnh báo.
2. `guestName` chứa U+202E → server lưu đã bỏ ký tự này.
3. `note` chứa số CCCD 12 chữ số giả → 422 `ID_NUMBER_DETECTED`; log ứng dụng, log Caddy, log Postgres không chứa chuỗi số đó.
4. SAL: yêu cầu `new` chưa giao không có `phone`/`guestName`; sau `claim` có; yêu cầu giao cho người khác → 404 ở `get`, `transition`, `saveQuote.websiteBookingRequestId`, `createReservation.websiteBookingRequestId`.
5. SAL `createHoldFromQuote` từ báo giá cũ khi yêu cầu đã giao cho FD → giữ chỗ tạo được, yêu cầu **không** đổi (ARC-19 điểm 3).
6. CTV, HK, MT gọi 3 operation hàng chờ → 403; khách (cookie link) → 401.
7. `erase` bởi FDL → C2, `contact_hmac`, `ip_hmac` rỗng ngay; `reopen` sau đó → 409; FD gọi `erase` → 403 (ARC-16).
8. Snapshot thông báo, SSE `website_request.changed`, outbox, audit, `state_transition` của một vòng tạo → nhận → chuyển đơn: không có tên/SĐT/email/lời nhắn.
