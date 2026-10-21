# SEC review – Landing page + Zalo OA (Round 2, trước Sprint 4)

- Người review: SEC | Ngày: 17/10/2026 | Bước: Review chéo (protocol mục 5: ARC → SEC bắt buộc; INT → SEC bắt buộc; UXD, DOM → SEC theo yêu cầu ORC)
- Bản được review (chưa commit, đọc từ cây làm việc):
  - UXD: `product/design/landing/concept.md` v0.1, `product/design/landing/mock/index.html`
  - ARC: `product/docs/adr/ADR-014-landing-site.md` (Đề xuất, 17/10)
  - INT: `product/docs/integrations/zalo-oa.md` v0.1, `02-escalations/ESC-021.md`
  - DOM: `rounds/round-02/outputs/DOM/guest-messaging-journey.md` v0.1
- Đối chiếu: `product/docs/security/security-requirements.md` v0.3 (SR-*), `threat-model.md` (TM-21, TM-55, TM-60, TM-61, TM-62), `data-risk-assessment.md` (P01–P11, T05/T10), ADR-006, ESC-010, ESC-020, `infra/caddy/Caddyfile.prod` (log đã xóa header, che IP /24), `erd.md` (`consent_record`, `message_log`).
- Cách làm: đọc tài liệu, đối chiếu SR, quét mock tìm tài nguyên ngoài và API lưu trữ. Tra văn bản pháp luật qua trang tổng hợp (mục 8). Không gọi API Zalo, không mở link Drive.
- Đánh số thẻ: tiếp số cũ (ARC …01, INT …06). UXD và DOM bắt đầu từ 01.

> SEC không khẳng định "tuân thủ pháp luật". Tài liệu này nêu biện pháp kỹ thuật đã/cần cài; phần pháp lý cần luật sư xác nhận (ESC-001).

**Tổng: 0 Blocker · 12 Major · 13 Minor · 4 Suggestion (29 thẻ)**

Kết luận:
- Không có Blocker: chưa có mã nào chạy, các bản đều là thiết kế. Hướng chung tốt: landing tĩnh, không bên thứ ba, form không tạo lead/giữ chỗ, token Zalo mã hóa, opt-out.
- **10 điều kiện [CHẶN]** (mục 1). Mỗi điều kiện gắn với một mốc bật tính năng. SEC sẽ không cho qua mốc đó nếu điều kiện chưa đạt.
- Hai việc cần chốt sớm nhất: (1) quy tắc thiết bị/tài khoản cho chat OA (INT-12) – vì ESC-021 A cho chat OA chạy ngay trong Sprint 4; (2) cách gắn link check-in vào tin tự động (INT-09) – SEC chốt ở thẻ này.
- **Lưu ý pháp lý mới**: theo các trang tổng hợp, **NĐ 356/2025/NĐ-CP thay NĐ 13/2023 từ 01/01/2026** (mục 8). Các bản nháp còn dẫn NĐ 13. Cần đổi căn cứ và đưa vào danh sách luật sư.

---

## 1. Các điều kiện [CHẶN]

| # | Điều kiện | Mốc bị chặn | Thẻ |
|---|---|---|---|
| C-1 | Bản dựng landing production không gọi tài nguyên bên thứ ba khi tải trang; không script/style inline (trừ JSON-LD); qua CSP ADR-014 mục 1.4 (`expected-headers.sh` + Playwright không lỗi CSP) | Cổng LP-v1 (lên mạng) | UXD-01 |
| C-2 | `booking_inquiry` có hạn xóa cho **mọi** trạng thái (kể cả `new`, `in_progress`) và trần tuyệt đối; job xóa không phụ thuộc chuyển trạng thái | Bật form (US-155) | ARC-03 |
| C-3 | Trang thông báo xử lý dữ liệu có phiên bản đã đăng; ô đồng ý không tích sẵn, chỉ một mục đích; bộ đếm giới hạn của form nằm trong DB | Bật form (US-155) | ARC-05 |
| C-4 | Webhook Zalo: chữ ký trên body thô, so sánh hằng thời gian, kiểm `oa_id`/`app_id`, chống lặp, không log body | Bật webhook Zalo | INT-07 |
| C-5 | Token Zalo mã hóa qua `CryptoService` với khóa riêng dạng tệp; OAuth có `state` gắn phiên, PKCE, kiểm `oa_id`; chỉ OWN trên thiết bị được cấp | Kết nối Zalo thật | INT-08 |
| C-6 | Link khách trong tin tự động dùng **token thông báo** theo thẻ INT-09 (mức 1, hạn ngắn, 1 token/đơn, không lưu bản gốc); chỉ gửi tới SĐT đã xác nhận | Gửi tin tự động có link | INT-09 |
| C-7 | Danh sách biến cho phép theo mẫu **và theo kênh**; không mã cửa, số giấy tờ, mã xác minh, số căn trước ngày đến trong ZNS/OA | Gửi tin tự động | INT-10 |
| C-8 | Tin marketing (ZNS Tag 3, broadcast nhắm theo SĐT) chỉ khi có `consent_record` P06 của chính người nhận; có cách từ chối; không gửi khách OTA | Gửi tin marketing | INT-11 |
| C-9 | Thông báo xử lý dữ liệu nêu Zalo (VNG) là bên nhận; log/bảng gửi tin không chứa SĐT, nội dung tin, token | Gửi tin tự động | INT-14 |
| C-10 | BR-978 không cho gửi mã cửa qua Zalo (ZNS/OA) và hội thoại chat | Đưa BR-978 vào `business-rules.md` | DOM-01 |

Ngoài ra vẫn giữ chặn cũ: **không nhận dữ liệu khách thật** vào hệ thống tới khi đạt SEC-G1 (a) + SEC-G2 (`s3-SEC.md` mục 9.5). Form web (US-155) và tin tự động đều là dữ liệu khách thật.

---

## 2. Thẻ cho ARC – `ADR-014-landing-site.md`

### FB-R2-SEC-ARC-02
- Mức độ: Major
- Vị trí: ADR-014 mục 4.4 điểm 4 ("trần 500/ngày/cơ sở – vượt trần thì trả `202` nhưng bỏ"); mục 4.8 `x-rate-limit` của `createBookingInquiry`
- Vấn đề: Khi chạm trần cơ sở, server trả `202` giống thành công nhưng **bỏ** yêu cầu. Kẻ xấu chỉ cần nhiều IP để làm đầy trần. Từ đó mọi khách thật trong ngày thấy "Đã gửi" nhưng yêu cầu biến mất. Trần 500/ngày cũng quá rộng cho 10 căn (số yêu cầu thật ước vài chục/ngày).
- Vì sao quan trọng: Mất khách thật mà không ai biết. Đây là tấn công từ chối dịch vụ rẻ tiền nhắm vào doanh thu kênh trực tiếp (PRD G3).
- Đề xuất sửa:
  1. Vượt trần cơ sở: **không** giả thành công. Trả `503` mã `SITE_BUSY` + `Retry-After`; trang hiện "Vui lòng nhắn Zalo hoặc gọi …". Gửi **một** cảnh báo OWN mỗi ngày.
  2. Trần là tham số bảo mật `public_site.inquiry_daily_cap`: mặc định 100, biên 50–500 (SEC đặt biên, `x-security-parameters`).
  3. Ô bẫy (honeypot) vẫn trả `202` giống hệt – đúng, giữ nguyên.
  4. Test: gửi 101 yêu cầu hợp lệ → yêu cầu 101 nhận `503`, không có bản ghi mới, có 1 cảnh báo.
- Trạng thái: Open

### FB-R2-SEC-ARC-03
- Mức độ: Major · **[CHẶN] C-2 – trước khi bật form (US-155)**
- Vị trí: ADR-014 mục 4.6 "Thời hạn lưu"; mục 4.9 job `booking_inquiry.purge`
- Vấn đề: Hạn xóa chỉ có cho `spam` (7 ngày), `closed` (90 ngày), `converted` (xóa ngay). Yêu cầu nằm ở `new` hoặc `in_progress` mãi (không ai đóng) thì giữ tên, SĐT, email, lời nhắn **vô thời hạn**. `reopen` từ `closed` cũng có thể kéo dài mãi. Đây đúng là lỗi đã gặp ở FB-R2-SEC-BE-32 (ảnh giấy tờ kẹt ở trạng thái chưa xác nhận).
- Vì sao quan trọng: Giữ dữ liệu cá nhân quá mục đích là rủi ro pháp lý trực tiếp. DRA T10 (lead không chốt) đặt trần 12 tháng; yêu cầu web chưa thành lead phải ngắn hơn.
- Đề xuất sửa (SEC đặt biên, DOM/PO đặt mặc định trong biên):
  | Tham số | Mặc định | Biên SEC |
  |---|---|---|
  | `web_inquiry.stale_days` – không hoạt động thì tự `closed` lý do `stale` | 30 | 7–60 |
  | `web_inquiry.retention_days_closed` – xóa trường C2 | 90 | 30–90 |
  | `web_inquiry.retention_days_spam` – xóa cả bản ghi | 7 | 1–7 |
  | `web_inquiry.max_age_days` – trần tuyệt đối từ `created_at`, mọi trạng thái trừ `converted` | 180 | 90–180 |
  | `ip_hmac` – đặt NULL | 30 | 7–30 |
  - Job xóa đọc theo **ngày tạo + hoạt động cuối**, không chờ sự kiện chuyển trạng thái. `reopen` không vượt `max_age_days`.
  - Ghi `purge_journal` (chỉ ID) như SR-RET-03.
  - Test với `Clock` giả: yêu cầu `new` 31 ngày → `closed/stale`; 121 ngày → trường C2 rỗng; `reopen` ngày 179 → vẫn xóa ngày 180.
- Trạng thái: Open

### FB-R2-SEC-ARC-04
- Mức độ: Minor
- Vị trí: ADR-014 mục 4.4 điểm 4 ("3/ngày/liên hệ … → `429`"); mục 4.3 `refCode`
- Vấn đề:
  - Vượt giới hạn **theo liên hệ** trả `429`. Kẻ xấu gửi 3 lần với SĐT của người khác: (a) biết SĐT đó vừa được dùng hôm nay (dò), (b) chặn khách thật gửi trong ngày.
  - Giới hạn IP chưa nói IPv6. Kẻ xấu đổi địa chỉ trong cùng dải /64 rất dễ.
  - ADR chưa ghi rõ nguyên tắc "không dò tài khoản" để BE giữ khi sửa sau này.
- Vì sao quan trọng: Yêu cầu ORC: endpoint công khai không được để lộ ai đã có hồ sơ/đã gửi.
- Đề xuất sửa:
  1. Vượt giới hạn liên hệ → `202` giống hệt, không tạo bản ghi mới; tăng `duplicate_count` và gắn cờ `repeat_contact` trên yêu cầu gần nhất của liên hệ đó.
  2. Đếm IPv6 theo /64; IPv4 theo địa chỉ.
  3. Ghi vào ADR 4.3: endpoint **không** đọc `guest`, `lead`, `reservation` trước khi trả lời; mọi kết quả hợp lệ có cùng hình dạng và mã; không trả lại dữ liệu khách nhập. QA test: SĐT của khách đã có hồ sơ và SĐT mới → phản hồi giống hệt.
  4. `refCode` chỉ để tra cứu nội bộ. Không bao giờ là yếu tố xác minh (giống mã đặt phòng – SR-GST-07). Không có endpoint công khai tra theo `refCode`.
- Trạng thái: Open

### FB-R2-SEC-ARC-05
- Mức độ: Major · **[CHẶN] C-3 – trước khi bật form (US-155)**
- Vị trí: ADR-014 mục 4.5 (`consent`), 4.6 (thông báo xử lý), 6.3, 12; căn cứ pháp lý trong ADR và DRA
- Vấn đề:
  - Các bản nháp dẫn NĐ 13/2023. Theo trang tổng hợp, **NĐ 356/2025/NĐ-CP thay NĐ 13 từ 01/01/2026** [Bên thứ ba – mục 8]. Luật 91/2025 Điều 19 khoản 1 có trường hợp "thực hiện thỏa thuận của chủ thể dữ liệu" không cần đồng ý [Bên thứ ba]. Yêu cầu đặt phòng là bước **trước** thỏa thuận → có thuộc trường hợp này không: [Chưa xác minh – luật sư].
  - ADR chưa ghi: lưu **văn bản** thông báo theo phiên bản (để chứng minh khách đã thấy gì); cấm gộp mục đích khác vào ô đồng ý của form.
  - Giới hạn tần suất bằng RAM (SR-RL mục 13) mất khi deploy. Với endpoint công khai ghi dữ liệu cá nhân, phải đếm trong DB ngay từ đầu.
- Vì sao quan trọng: Form là chỗ đầu tiên OTTIMO thu dữ liệu cá nhân từ người lạ trên internet. Thiếu bằng chứng đồng ý/thông báo là lỗi pháp lý dễ bị phát hiện nhất.
- Đề xuất sửa:
  1. Giữ ô đồng ý (an toàn hơn, chờ luật sư), **không** tích sẵn, câu chữ chỉ một mục đích: "để OTTIMO liên hệ trả lời yêu cầu này". **Không** có ô nhận ưu đãi trên form (xem DOM-05).
  2. Bảng `privacy_notice_version(version, locale, body_sha256, published_at)`; `booking_inquiry.consent_version` phải trỏ bản đã đăng. Văn bản đầy đủ lưu trong repo landing theo phiên bản.
  3. Trang `/<lang>/privacy/` VI/EN/RU có trước khi bật form. Nội dung SEC soạn khung, luật sư duyệt (ESC-001).
  4. Bộ đếm `createBookingInquiry` (IP, liên hệ, trần cơ sở) dùng `rate_limit_counter` trong DB từ ngày bật.
  5. Đổi căn cứ "NĐ 13" → "Luật 91/2025 + NĐ 356/2025" trong ADR; ghi [Chưa xác minh – luật sư].
- Trạng thái: Open

### FB-R2-SEC-ARC-06
- Mức độ: Minor
- Vị trí: ADR-014 mục 1.2 và 1.4 ("proxy `/v1/public/*`"); mục 4.4 điểm 3 (kiểm `Origin`)
- Vấn đề:
  - Origin landing proxy **mọi** `/v1/public/*`, gồm cả route có sẵn `POST /v1/public/units/{unitSlug}/resend-link` (ADR-006 điểm 4). Route này không thuộc landing.
  - Tên miền gốc và `desk.`, `g.` là **cùng site** (same-site). Cookie `SameSite` không chặn được yêu cầu từ landing sang app [Nguồn: web.dev same-site]. Lớp chặn thật là `X-CSRF-Token` + danh sách `Origin` của từng app (SR-SES-04). Nếu BE gộp `LANDING_BASE_URL` vào một danh sách origin chung, một lỗi XSS ở landing sẽ thành CSRF vào Desk.
- Vì sao quan trọng: Giữ bề mặt tấn công của origin công khai nhỏ nhất; không phá ranh giới đã chốt ở SR-HDR-04.
- Đề xuất sửa:
  1. Caddy origin landing chỉ proxy 5 đường dẫn `/v1/public/properties/{slug}/(form-token|booking-inquiries|site-events|availability|offers)`; còn lại 404.
  2. Danh sách `Origin` khai **theo operation**: 5 operation `public-site` chỉ nhận `LANDING_BASE_URL`; mọi operation nhân viên/khách **không bao giờ** nhận origin landing.
  3. Endpoint `public-site` bỏ qua mọi cookie (không đọc phiên).
  4. Test: `Origin: https://<gốc>` gọi một thao tác ghi của nhân viên và của khách → 403.
  5. Hàm `public_resolve_property(slug)` theo mẫu hàm SECURITY DEFINER hiện có: `search_path = pg_catalog, public, pg_temp`, chỉ `ottimo_app` EXECUTE.
- Trạng thái: Open

### FB-R2-SEC-ARC-07
- Mức độ: Minor
- Vị trí: ADR-014 mục 4.4 (HMAC liên hệ, form token), mục 10 dòng OPS (biến mới)
- Vấn đề: Chưa nói khóa nào dùng cho HMAC SĐT/email của bộ đếm theo liên hệ. Dễ dùng nhầm `LOG_IP_HMAC_KEY` hoặc `ID_HASH_KEY`. `PUBLIC_FORM_SIGNING_KEY` chưa có trong kiểm khởi động SR-SECR-05.
- Vì sao quan trọng: Quy tắc "một khóa một mục đích" (ADR-013 điểm 5, W17). Dùng chung khóa thì lộ một mục đích kéo theo mục đích khác.
- Đề xuất sửa:
  1. HMAC liên hệ dùng `keyedHash('web_inquiry_contact')` dẫn xuất từ khóa riêng, không dùng khóa IP hay khóa giấy tờ.
  2. `PUBLIC_FORM_SIGNING_KEY_FILE` ≥ 32 byte; thiếu/yếu khi `public_site.inquiries_enabled` bật ở staging/production → dừng khởi động (thêm vào SR-SECR-05).
  3. Thêm vào sổ bí mật (SR-SECR-04): chủ sở hữu OPS, xoay 12 tháng hoặc khi nghi lộ; xoay = token form cũ hết hạn trong 2 giờ, chấp nhận.
- Trạng thái: Open

### FB-R2-SEC-ARC-08
- Mức độ: Minor
- Vị trí: ADR-014 mục 4.5 dòng `message`
- Vấn đề: Chỉ chặn số thẻ (Luhn). Khách hay tự ghi số CCCD/hộ chiếu ("CCCD của em là …") hoặc tình trạng sức khỏe vào lời nhắn. Khi đó dữ liệu C3 nằm trong trường C2, không mã hóa, giữ tới 90 ngày.
- Vì sao quan trọng: SR-C3-01/02: C3 không được nằm ngoài cột mã hóa.
- Đề xuất sửa:
  1. Dùng chung bộ nhận diện của SR-LOG-04 (CCCD 12 số, mẫu hộ chiếu/MRZ): có → `422 ID_NUMBER_DETECTED`, không lưu, trang nhắc "Không cần gửi giấy tờ ở bước này".
  2. Gợi ý dưới ô: "Không ghi số thẻ, số giấy tờ hay thông tin sức khỏe" (SR-INP-05).
- Trạng thái: Open

### FB-R2-SEC-ARC-09
- Mức độ: Minor
- Vị trí: ADR-014 mục 4.9 `web_metric_daily` (khóa chính 10 cột), mục 6.1, `recordSiteEvent` 120/giờ/IP
- Vấn đề: `path`, `ref_host`, `utm_*` là chuỗi tự do theo mẫu ký tự. Kẻ xấu gửi giá trị mới mỗi lần → bảng phình (mỗi giá trị một dòng), và mỗi sự kiện là một lần ghi DB.
- Vì sao quan trọng: Tấn công làm đầy đĩa/DB của VPS 4 GB dùng chung với Desk (ADR-010 – điểm lỗi đơn).
- Đề xuất sửa:
  1. `path` phải nằm trong danh sách đường dẫn đã phát hành (sinh lúc build, nạp vào api); khác → bỏ.
  2. `utm_*`, `ref_host`: tối đa N giá trị mới/ngày/cơ sở (vd. 200); vượt → gộp vào `other`.
  3. Gom đếm trong RAM, ghi DB mỗi phút (1 replica – đã chấp nhận). Mất tối đa 1 phút số liệu khi khởi động lại – chấp nhận.
- Trạng thái: Open

### FB-R2-SEC-ARC-10
- Mức độ: Minor
- Vị trí: ADR-014 mục 1.4 (HSTS ở tên miền gốc), mục 8 (DNS), dòng staging
- Vấn đề:
  - Từ nay tên miền gốc là "gốc tin cậy": link `g.` trong tin Zalo, nút trong mẫu ZNS (phải khớp tên miền – zalo-oa.md 2.2), email. Ai chiếm được tài khoản tên miền/DNS sẽ dựng được trang giả có chứng chỉ hợp lệ và **nhận token khách** từ nút trong tin. ADR chưa có biện pháp cho tài khoản tên miền.
  - HSTS `includeSubDomains` đặt ở tên miền gốc áp cho **mọi** tên miền con, kể cả tên miền con tương lai (vd. tên miền theo dõi email). Đúng hướng, nhưng phải kiểm trước.
  - Landing staging công khai, trông giống hệt bản thật, nhận form vào API staging.
- Vì sao quan trọng: Chiếm tên miền = lộ link khách hàng loạt và lừa đảo khách bằng chính thương hiệu OTTIMO.
- Đề xuất sửa:
  1. Việc INV (đưa vào danh sách "INV cần làm" của ESC-020 L4, không phải câu hỏi): bật xác thực 2 lớp cho tài khoản nhà đăng ký và DNS; bật khóa chuyển nhượng; tài khoản đứng tên OTTIMO, không đứng tên nhân viên.
  2. OPS thêm bản ghi CAA chỉ cho Let's Encrypt [Nguồn: RFC 8659].
  3. Trước khi bật HSTS ở tên miền gốc: OPS liệt kê mọi tên miền con, xác nhận đều chạy HTTPS.
  4. `staging.<tên-miền>` chặn bằng basic auth hoặc danh sách IP (không chỉ `noindex`).
- Trạng thái: Open

### FB-R2-SEC-ARC-11
- Mức độ: Suggestion
- Vị trí: ADR-014 mục 6.3 "Không cần banner" ("[SEC xác nhận]")
- Vấn đề: SEC xác nhận **phần kỹ thuật**: bộ đếm tổng hợp như mục 6.1 không xử lý dữ liệu cá nhân của người xem. Theo trang tổng hợp, Luật 91/2025 Điều 28 yêu cầu đồng ý khi thu thập dữ liệu qua **theo dõi** trang web [Bên thứ ba], và NĐ 356/2025 xếp "dữ liệu theo dõi hành vi trực tuyến" vào nhóm nhạy cảm [Bên thứ ba]. Vì vậy điều kiện "không theo dõi từng người" là then chốt. SEC không tìm thấy quy định riêng bắt buộc banner cookie khi không theo dõi [Chưa xác minh – luật sư].
- Vì sao quan trọng: Giữ trang nhanh, không banner; nhưng một thay đổi nhỏ (gắn pixel, nhúng bản đồ) sẽ làm mất cơ sở này.
- Đề xuất sửa:
  1. Thêm điều kiện thứ 5: không có định danh từng người xem ở bất kỳ đâu – kể cả trong RAM quá thời gian của bộ đếm giới hạn; không gửi ngày, số khách, nội dung ô Hỏi phòng vào sự kiện (concept 10.4 đã đúng).
  2. Lưu `localStorage` cho chế độ sáng/tối là tùy chọn giao diện – chấp nhận, không tính là đo lường.
  3. Test CI chặn: domain ngoài trong `dist`, thẻ `<iframe>`, `document.cookie`.
  4. Ghi câu cho thông báo quyền riêng tư: "Trang không dùng cookie theo dõi; chỉ đếm tổng số lượt theo ngày".
- Trạng thái: Open

### FB-R2-SEC-ARC-12
- Mức độ: Minor
- Vị trí: ADR-014 mục 4.6 "Quyền xem" và mục 4.8 `listBookingInquiries` (`x-roles` có `sales_staff`, chưa có `x-scope`)
- Vấn đề: `sales_staff` xem được tên, SĐT, lời nhắn của **mọi** yêu cầu, kể cả yêu cầu đã giao cho người khác. Với lead, SAL chỉ thấy lead của mình (`x-scope` M).
- Vì sao quan trọng: SR-AZ-02 (phạm vi trong truy vấn); thu hẹp người thấy dữ liệu C2.
- Đề xuất sửa: SAL thấy yêu cầu `new` chưa giao (để nhận) và yêu cầu giao cho mình; ngoài phạm vi → 404. FD+ thấy hết. Thêm ca vào bộ test SR-AZ-09 lớp 2.
- Trạng thái: Open

---

## 3. Thẻ cho INT – `zalo-oa.md` và `ESC-021.md`

### FB-R2-SEC-INT-07
- Mức độ: Major · **[CHẶN] C-4 – trước khi bật webhook Zalo**
- Vị trí: zalo-oa.md mục 1.6 (chữ ký), 4.6 (webhook vào)
- Vấn đề: Mới có "kiểm `X-ZEvent-Signature`, so sánh hằng thời gian". Còn thiếu:
  - Tính trên **body thô** (byte nhận được), không parse rồi dựng lại JSON.
  - Kiểm `app_id`/`oa_id` trong dữ liệu khớp cấu hình.
  - Chống lặp và kiểm thời điểm (`timestamp` trong dữ liệu). Zalo gửi lại tới 1 giờ sau (S22), nên cửa sổ thời gian phải dài hơn khoảng gửi lại.
  - Không log body: sự kiện `user_send_*` chứa lời nhắn của khách, sự kiện chia sẻ thông tin chứa SĐT.
  - Webhook ZNS có ký hay không [Chưa xác minh].
  - SEC không tự đọc được trang chữ ký của Zalo (tải bằng JavaScript); công thức lấy theo INT [Nguồn S23 – INT đọc]. Dạng giá trị header (có tiền tố hay không) [Chưa xác minh].
- Vì sao quan trọng: Webhook là cửa vào không cần phiên. Giả được sự kiện "đã nhận"/"khách nhắn" thì đổi được trạng thái gửi tin hoặc (giai đoạn 2) chèn tin giả vào hộp thư Desk.
- Đề xuất sửa:
  1. Thứ tự: giới hạn body 64 KB + 300/phút (SR-RL-08) → chữ ký trên body thô, `timingSafeEqual` → `app_id`/`oa_id` khớp → `timestamp` trong [now − 3 giờ, now + 5 phút] → ghi `inbox_message` với khóa duy nhất (`event_name` + id sự kiện/`msg_id`) → trả 200.
  2. Sai chữ ký → `401` không chi tiết, `signature_valid=false`, không đổi dữ liệu; tính vào cảnh báo SR-LOG-06 (≥ 5/giờ).
  3. Webhook không ký (nếu ZNS không ký): chỉ là tín hiệu, worker gọi `queryStatus` rồi mới ghi (ADR-011 B4, SR-INT-01).
  4. Log chỉ: `event_name`, kết quả kiểm, `request_id`. `inbox_message.payload` lọc theo danh sách trường cho phép, xóa sau 90 ngày (T16).
  5. `ZALO_OA_SECRET_KEY_FILE` (không để trong `.env` chung – SR-KEY-10).
  6. Mock B10 có ca: body bị đổi 1 byte, `oa_id` khác, sự kiện lặp, `timestamp` cũ 4 giờ.
- Trạng thái: **Deferred – SEC chấp nhận 21/10** → R3-Q40 (thiết kế đủ ở `zalo-oa.md` 4.12-A). **[CHẶN] C-4 giữ nguyên** tới khi mã webhook cài xong và SEC review (mục R-2)

### FB-R2-SEC-INT-08
- Mức độ: Major · **[CHẶN] C-5 – trước khi kết nối Zalo thật**
- Vị trí: zalo-oa.md mục 4.3 (khóa và token), 4.11 (biến môi trường)
- Vấn đề: SEC **đồng ý hướng** (bảng `integration_credential`, khóa riêng, một job làm mới có khóa advisory, không màn nhập tay). Còn thiếu các điểm sau:
  - Chưa nói mã hóa qua `CryptoService` (SR-KEY-01/02) và AAD.
  - Luồng OAuth chưa gắn `state` với phiên, chưa kiểm OA được cấp quyền đúng là OA của OTTIMO. Kẻ xấu gửi cho OWN một link callback của **OA của hắn** → Desk lưu token của OA giả → tin gửi khách đi từ OA giả (lừa đảo dưới tên OTTIMO).
  - Refresh token chỉ dùng 1 lần: nếu ghi DB lỗi sau khi Zalo đã đổi cặp token, token cũ đã chết.
  - Mọi bí mật đang để trong `.env`.
- Vì sao quan trọng: Ai có access token gửi được tin dưới tên OTTIMO tới SĐT bất kỳ đã giao dịch, và đọc được hội thoại (giai đoạn 2).
- Đề xuất sửa:
  1. Cột token: AES-256-GCM qua `CryptoService`, AAD `integration_credential|<cột>|<id>|<kek_version>`. `INTEGRATION_TOKEN_KEK_FILE` 32 byte, tệp riêng (SR-KEY-10). Kiểm khởi động khi `ZALO_PROVIDER=zalo` (thêm vào SR-SECR-05).
  2. "Kết nối Zalo OA": chỉ OWN, trên admin-web, thiết bị được cấp, xác nhận lại mật khẩu/PIN (và TOTP khi có). `state` ngẫu nhiên 256 bit, lưu server gắn phiên, dùng 1 lần, 10 phút; PKCE S256.
  3. Callback: OA trả về phải bằng `ZALO_OA_ID` → khác thì từ chối, không lưu token, `audit_event security`.
  4. Làm mới: giữ khóa advisory → gọi Zalo → ghi cặp mới ngay trong giao dịch ngắn. Ghi lỗi → thử ghi lại vài lần trong bộ nhớ; vẫn lỗi → `healthCheck=down`, báo OWN kết nối lại. Không gọi lại bằng refresh token cũ.
  5. HTTP client chỉ gọi host cố định (`oauth.zaloapp.com`, `openapi.zalo.me`, `business.openapi.zalo.me`), kiểm TLS, timeout ≤ 15 giây (SR-INT-02). Không log header `access_token`, `secret_key`, không log query của callback (`code`).
  6. `ZALO_APP_SECRET`, `ZALO_OA_SECRET_KEY` dạng `_FILE`, vào sổ bí mật SR-SECR-04. Zalo có cho đổi App Secret không [Chưa xác minh] – INT kiểm khi tạo App.
- Trạng thái: **Deferred – SEC chấp nhận 21/10** → R3-Q41 (thiết kế đủ ở 4.12-F, 4.11). **[CHẶN] C-5 giữ nguyên** tới khi cài và SEC review (mục R-2)

### FB-R2-SEC-INT-09
- Mức độ: Major · **[CHẶN] C-6 – trước khi gửi tin tự động có link**
- Vị trí: zalo-oa.md mục 4.8 (L-1/L-2/L-3), mục 3 bước 1, 2, 5, 6; ADR-006 điểm 4 ("tối đa 2 token/đơn")
- Vấn đề: SEC phải chọn cách đưa link khách vào tin tự động. L-1 của INT có hai chỗ chưa ổn: (a) worker **cấp lại** token chính ở tin đầu → thu hồi link lễ tân đã chép tay trước đó; (b) mỗi tin sau cấp thêm một token 7 ngày, không tính vào giới hạn → số token còn hiệu lực tăng theo số tin. Ngoài ra, SĐT gõ sai thì tin kèm link đi tới người lạ.
- Vì sao quan trọng: Link mức 1 cho xem thông tin lưu trú, Wi-Fi (từ ngày đến), gửi yêu cầu, tải giấy tờ (TM-21). Càng nhiều token sống, càng nhiều chỗ lộ.
- Đề xuất sửa – **SEC chốt (L-1 sửa)**:
  1. Worker **không bao giờ** cấp hay thu hồi token chính (`desk`/`pending`). Mọi tin tự động (và danh sách "Tin cần gửi hôm nay" – DOM-04) dùng **token thông báo** `purpose=notify`.
  2. Token thông báo: mức 1; lên mức 2 vẫn qua OTP/mã lễ tân như thường (SR-GST-07). Hạn = min(lúc cấp + 7 ngày, trả phòng + ân hạn). Dài hạn: 7 ngày, cấp mới theo tin.
  3. Mỗi đơn tối đa **1** token thông báo còn hiệu lực. Cấp mới (tin sau, gửi lại, đổi kênh) → thu hồi token thông báo trước. Tổng ≤ 3 token/đơn (chính + chờ + thông báo). ARC sửa ADR-006 điểm 4.
  4. Hủy, no-show, lễ tân cấp lại link → thu hồi cả token thông báo (SR-GST-04). Bộ đếm sai xác minh dùng chung theo đơn cho mọi token của đơn (SR-GST-08).
  5. Token gốc chỉ ở bộ nhớ worker trong lúc gọi API. Không nằm trong `outbox_message`, `notification_delivery`, `integration_log`, `tracking_id`, thông báo lỗi, log HTTP. Chung một lần gửi thì kênh dự phòng (email) dùng lại token trong bộ nhớ; lần thử lại sau thì cấp token mới.
  6. Chỉ gửi tin **có link** tự động tới SĐT/email **đã xác nhận**: khách đã nhắn/gọi từ số đó, hoặc lễ tân đánh dấu "đã xác nhận liên hệ". Chưa xác nhận → tin không link (hoặc việc cho lễ tân).
  7. `audit_event security` mỗi lần cấp: đơn, kênh, mẫu, người/hệ thống (không ghi token).
  8. Zalo nhận URL có token trong nút: SEC **chấp nhận** rủi ro còn lại (token mức 1, hạn ngắn, thu hồi được – như gửi tay qua Zalo hiện nay). SEC cập nhật TM-21/TM-55.
- Trạng thái: **Deferred – SEC chấp nhận 21/10** → R3-Q42 + US-161 AC5 (4.12-B ghi đúng quyết định SEC 17/10; L-1 cũ đã đánh dấu thay thế). **[CHẶN] C-6 giữ nguyên** (mục R-2)

### FB-R2-SEC-INT-10
- Mức độ: Major · **[CHẶN] C-7 – trước khi gửi tin tự động**
- Vị trí: zalo-oa.md mục 3.1 (tham số mẫu), 3 dòng 1 (`room_name`); mục 8 Q9 so với mục 3.1 dòng cuối
- Vấn đề:
  - Quy tắc "không mã cửa, mã xác minh, số giấy tờ" mới là câu chữ. Chưa có cơ chế chặn theo **kênh**. `message_template` (SR-MSG-01) kiểm biến theo mẫu, chưa theo kênh.
  - `zns.booking_confirmed` có `room_name`. Nếu là số căn ("Căn 301") thì một tin gửi nhầm số cho người lạ biết ai ngủ ở căn nào, ngày nào.
  - Mục 3.1 cấm mã xác minh trong ZNS, nhưng Q9 lại đề xuất mẫu xác thực ZNS. Hai chỗ mâu thuẫn (SEC trả lời ở INT-15).
- Vì sao quan trọng: Tin Zalo lưu ở máy chủ Zalo và hiện trên màn hình khóa; không thu hồi được. Đây là kênh không được chứa C3 (SR-MSG-02, SR-LOCK-03).
- Đề xuất sửa:
  1. Bảng `template_variable_policy(template_key, channel, allowed_vars[])` trong code. Kênh `zalo_zns`, `zalo_oa`: **cấm** mã cửa, số/ảnh giấy tờ, ngày sinh, mã xác minh (trừ mẫu `zns.auth_code` nếu INV bật theo INT-15), số căn trước ngày đến, số tiền ở mẫu không phải bill/thanh toán.
  2. `room_name` → tên nhóm/loại căn công khai (`public_listing`), không số căn.
  3. Render vi phạm → `422`, không gửi. Test: snapshot các khóa `template_data` của 8 mẫu.
  4. Sửa câu cuối mục 3.1: "Không mã cửa, số giấy tờ trong ZNS. Mã xác minh chỉ qua mẫu xác thực riêng khi SEC/INV bật (INT-15)".
- Trạng thái: **Verified 21/10 – lớp kiểm** (`zalo-policy.ts`, 18/18 test, `tsc` sạch). **[CHẶN] C-7 giữ** tới khi lõi gọi lớp kiểm trước mọi lần gửi (US-126 AC4) và đủ 2 điều kiện ở mục R-2 (kiểm giá trị ô chữ tự do, test 422 ở lõi)

### FB-R2-SEC-INT-11
- Mức độ: Major · **[CHẶN] C-8 – trước khi gửi bất kỳ tin marketing nào**
- Vị trí: zalo-oa.md mục 4.7 (`zalo_marketing` "bật khi … khách follow OA"), mục 3 dòng 7 (voucher Tag 3), mục 8 Q8
- Vấn đề:
  - "Khách follow OA" không phải đồng ý mà OTTIMO ghi lại được. Gửi ZNS Tag 3 **theo SĐT** là OTTIMO dùng SĐT của mình cho quảng cáo → cần đồng ý riêng P06 (DRA R-CON-01). Theo trang tổng hợp, Luật 91/2025 Điều 28 yêu cầu khách biết rõ nội dung, phương thức, tần suất và có cách từ chối [Bên thứ ba]; Điều 28 có áp cho doanh nghiệp tự quảng cáo không [Chưa xác minh – luật sư].
  - NĐ 91/2020 (tin nhắn rác) hiện áp cho SMS, email, cuộc gọi. Dự thảo thay thế do Bộ Công an đăng có **mở rộng sang ứng dụng OTT** [Nguồn – qua tìm kiếm, dự thảo, chưa đọc toàn văn]. Nghĩa là Zalo có thể sớm thuộc diện.
- Vì sao quan trọng: Q8 của INT. Gửi quảng cáo không có đồng ý: rủi ro phạt, khách báo xấu → Zalo hạ chất lượng OA (zalo-oa.md 2.6).
- Đề xuất sửa – **SEC trả lời Q8**:
  1. Tin vận hành (Tag 1, Tag 2): căn cứ "thực hiện thỏa thuận" (Luật 91 Điều 19 khoản 1) [Bên thứ ba – luật sư xác nhận] + nêu trong thông báo xử lý dữ liệu. `zalo_transactional` mặc định bật – chấp nhận.
  2. Tin marketing qua SĐT (Tag 3, voucher): chỉ khi `consent_record` P06 = `granted` của **chính người nhận** (BR-955), ghi phiên bản câu chữ, kênh, thời điểm. Câu chữ nêu nội dung, kênh Zalo, tần suất tối đa. Follow OA **không** thay được.
  3. Broadcast cho người follow OA: do Zalo quản lý (người dùng tự follow/bỏ follow, OTTIMO không dùng SĐT) – chấp nhận, nhưng không nhắm khách OTA.
  4. Cách từ chối: (a) mã `-139`/`-141` → tắt ngay; (b) nút "Không nhận ưu đãi" trong mẫu → trang `g.` với **token hủy đăng ký** riêng (HMAC, chỉ mục đích này, không đăng nhập, bấm lại không lỗi, trang không hiện dữ liệu cá nhân); (c) lễ tân tắt khi khách nhắn. Rút đồng ý có hiệu lực ngay với tin đang chờ (DOM BR-971).
  5. Khung giờ và tần suất theo DOM BR-973/974 ([08:00, 20:00), ≤ 2 tin/30 ngày) – đã chặt hơn NĐ 91/2020.
  6. Thêm câu hỏi NĐ 91 + dự thảo thay thế vào ESC-001.
- Trạng thái: **Deferred – SEC chấp nhận 21/10** → R3-Q43 (4.7, 4.12-D đúng câu trả lời Q8). **[CHẶN] C-8 giữ nguyên**. Câu NĐ 91/2020 + dự thảo OTT **đã có** ở ESC-001 LZ-5, không cần bổ sung (mục R-2)

### FB-R2-SEC-INT-12
- Mức độ: Major (điều kiện SEC đưa vào ESC-021, trước khi lễ tân chat OA với khách thật)
- Vị trí: zalo-oa.md mục 1.4, 4.7 (gạch cuối), 4.9 giai đoạn 1; ESC-021 phương án A; DOM nguyên tắc 11
- Vấn đề: Ba tài liệu nói ba kiểu về thiết bị chat:
  - INT: nhân viên chat bằng mini app OA Manager **trong Zalo cá nhân trên điện thoại cá nhân**.
  - DOM: "thiết bị của cơ sở", dẫn SR-DEV-08.
  - SR-DEV-07/08: máy quầy và thiết bị di động **đã cấp quyền** không được cài Zalo/app chat.
  Chưa có quy tắc về tài khoản quản trị OA, nghỉ việc, khách gửi ảnh giấy tờ vào chat.
- Vì sao quan trọng: Khách hay gửi ảnh CCCD/hộ chiếu qua Zalo. Ảnh nằm trên điện thoại cá nhân (C3 ngoài hệ thống – TM-17). Nhân viên nghỉ việc vẫn còn quyền đọc chat nếu không gỡ. Tài khoản quản trị OA bị chiếm thì kẻ xấu nhắn khách dưới tên OA **đã xác thực** (lừa chuyển tiền).
- Đề xuất sửa – **SEC chốt** (ghi vào hướng dẫn vận hành; ORC đưa tóm tắt vào ESC-021):
  1. Mỗi nhân viên dùng Zalo **của chính mình** làm quản trị viên OA với vai thấp nhất đủ chat. Không dùng chung một tài khoản/mật khẩu. OWN giữ vai chủ OA + 1 quản trị viên dự phòng (MGR) để không mất OA.
  2. Chỗ chat: OA Manager **bản web** trên máy quầy/máy tính bảng của cơ sở, trong **hồ sơ trình duyệt riêng** (không phải hồ sơ dùng Desk). SEC sửa SR-DEV-07/08: cấm **ứng dụng** Zalo, cho phép OA Manager web theo điều kiện này.
  3. Điện thoại cá nhân (mini app): chỉ OWN/MGR, để theo dõi ngoài giờ (giống ngoại lệ laptop SR-DEV-09). Lễ tân, sale: không.
  4. Không xin, không nhận ảnh giấy tờ, số thẻ qua chat. Có câu trả lời nhanh soạn sẵn dẫn tới link check-in. Khách đã gửi ảnh: không tải về, không chuyển tiếp, nhờ khách thu hồi. OA có xóa được tin của khách không [Chưa xác minh].
  5. Không dán dữ liệu từ "portal-data" (C3) hay mã cửa vào chat. Mã xác minh chỉ theo SR-GST-13 khi OWN bật.
  6. Nghỉ việc: gỡ quyền quản trị OA **trong ngày** (cùng lúc khóa tài khoản Desk). OWN rà danh sách quản trị viên hằng tháng.
  7. Tài khoản Zalo của quản trị viên bật lớp bảo vệ đăng nhập có sẵn của Zalo [Chưa xác minh tên tính năng].
  - Nhận xét: chat OA vẫn **tốt hơn** hiện trạng (Zalo cá nhân của nhân viên) vì thu hồi được quyền và ca sau đọc được hội thoại.
- Trạng thái: **Verified 21/10 (phần INT)** – 1.4, 4.9, 4.12-E đúng 7 quy tắc. Còn lại: SEC sửa SR-DEV-07/08 và hướng dẫn vận hành → R3-Q44, trước khi lễ tân chat OA với khách thật; ghi chú câu cuối 4.7 (mục R-2)

### FB-R2-SEC-INT-13
- Mức độ: Minor
- Vị trí: `02-escalations/ESC-021.md` (Bối cảnh, phương án A, "Nếu chưa quyết thì")
- Vấn đề:
  - ESC chưa nói các điều kiện bảo mật/pháp lý đi kèm. INV có thể hiểu "chat OA chạy ngay" là xong.
  - "Landing page tạm để nút Zalo cá nhân của cơ sở": cần rõ là số/tài khoản **của cơ sở**, không phải Zalo cá nhân của một nhân viên.
- Vì sao quan trọng: INV quyết đúng khi biết đủ việc phải làm kèm theo.
- Đề xuất sửa: Thêm một gạch đầu dòng "Điều kiện đi kèm (không tốn tiền)":
  - Lễ tân chat trên máy của cơ sở; mỗi người một tài khoản; gỡ quyền ngay khi nghỉ việc (INT-12).
  - Không nhận ảnh giấy tờ, số thẻ qua Zalo; không gửi mã cửa qua Zalo.
  - Thông báo xử lý dữ liệu nêu Zalo (VNG) nhận tên, SĐT, mã đặt phòng, ngày ở (INT-14).
  - Tin ưu đãi chỉ gửi người đã đồng ý (INT-11).
  - Zalo tạm thời: số/tài khoản Zalo đứng tên cơ sở.
- Trạng thái: Open

### FB-R2-SEC-INT-14
- Mức độ: Major · **[CHẶN] C-9 – trước khi gửi tin tự động**
- Vị trí: zalo-oa.md mục 4.4 (outbox), 4.5 (`notification_delivery`), 4.7 (bên xử lý), mục 2.7 (body API gửi có `phone`, `template_data`)
- Vấn đề:
  - Zalo/VNG nhận tên, SĐT, mã đơn, ngày ở, số tiền (bill). Phải có trong thông báo xử lý dữ liệu **trước** khi gửi (DRA P11, mục 6.2). Zalo là bên xử lý hay tự là bên kiểm soát (Zalo biết SĐT X là khách OTTIMO) – theo điều khoản ZBS [Chưa xác minh]. Máy chủ ở đâu [Chưa xác minh].
  - Theo trang tổng hợp, NĐ 356/2025 đưa "kinh doanh dịch vụ xử lý dữ liệu cá nhân" thành ngành có điều kiện [Bên thứ ba]. Việc này có áp cho Zalo khi gửi tin hộ không [Chưa xác minh – luật sư].
  - Chưa ghi rõ: client HTTP và `integration_log` không được ghi body gửi Zalo (chứa SĐT, tên).
- Vì sao quan trọng: Chuyển dữ liệu cho bên thứ ba mà khách không được báo trước là vi phạm dễ thấy nhất. Log chứa SĐT kéo dài thời gian lưu ngoài kiểm soát (log 90 ngày).
- Đề xuất sửa:
  1. INT cung cấp cho SEC: tên pháp nhân nhận dữ liệu, trường gửi đi theo từng mẫu, nơi lưu, link điều khoản ZBS. SEC cập nhật DRA P11 và khung thông báo; luật sư duyệt (ESC-001).
  2. `integration_log` cho Zalo chỉ: `template_key`, kênh, mã lỗi, `msg_id`, thời gian, `cost_units`. Không `phone`, `template_data`, token.
  3. `notification_delivery` không có cột SĐT/nội dung (bản hiện tại đã đúng – giữ).
  4. Đánh dấu "không có Zalo" lưu trên hồ sơ khách, không tạo bảng SĐT riêng.
- Trạng thái: **Điểm 2–4 Verified 21/10** (`toZaloIntegrationLog` + test chuỗi rò; 4.12-G). **Điểm 1 Deferred – SEC chấp nhận** → R3-Q45. **[CHẶN] C-9 giữ nguyên**; thêm 1 điều kiện khi gắn vào lõi (mục R-2)

### FB-R2-SEC-INT-15
- Mức độ: Suggestion
- Vị trí: zalo-oa.md mục 8 Q9 (mẫu xác thực ZNS cho mã xác minh app khách)
- Vấn đề: Q9 hỏi SEC có dùng mẫu xác thực ZNS để gửi mã mức 2 không.
- Vì sao quan trọng: Mã đi thẳng từ hệ thống tới Zalo của SĐT trên đơn → bỏ bước lễ tân dán tay (giảm TM-61 a và c).
- Đề xuất sửa – **SEC đồng ý có điều kiện** (là cách (c) của SR-GST-07; làm sau khi tin tự động chạy ổn, R3):
  1. Chỉ gửi tới SĐT trên đơn; khách **không** nhập được SĐT khác trong phiên.
  2. SĐT đổi sau khi đã cấp link → không gửi mã qua Zalo trong 24 giờ, trừ khi lễ tân xác nhận lại (như email ở SR-GST-14).
  3. Mã 6 số, CSPRNG, 10 phút, một lần, lưu băm; đếm chung SR-GST-08; tối đa 3 lần gửi/giờ/token.
  4. Tin chỉ có mã + hạn, không link, không tên căn (link ở tin khác).
  5. Không ghi mã vào `notification_delivery`, log, `outbox`.
  6. OWN bật theo cơ sở (`guest_verify_code_channels` thêm `zalo_zns_auth`), mặc định tắt. Chi phí 400 đ/tin chưa VAT (zalo-oa.md 2.4).
- Trạng thái: Open

---

## 4. Thẻ cho DOM – `guest-messaging-journey.md`

### FB-R2-SEC-DOM-01
- Mức độ: Major · **[CHẶN] C-10 – trước khi đưa BR-978 vào `business-rules.md`**
- Vị trí: mục 2 nguyên tắc 10; TP-04 (b); BR-978; tình huống QA #14
- Vấn đề: BR-978 cho gửi mã cửa bằng mẫu `door_code` đúng ngày đến, **không giới hạn kênh**. Khi có Zalo OA/ZNS, câu này cho phép mã cửa đi qua Zalo.
- Vì sao quan trọng: Tin Zalo hiện trên màn hình khóa, lưu ở máy chủ Zalo, không thu hồi được; người cầm máy khách hoặc người được chuyển tiếp vào được phòng (TM-39). INT và `integrations.md` I7 đã ghi "không gửi mã cửa qua ZNS" – BR phải khớp.
- Đề xuất sửa: BR-978 ghi: "Mã cửa **không** gửi qua Zalo (ZNS, tin OA, chat gõ tay) và không qua hội thoại OTA. MVP: chỉ xem trong app khách mức 2 (SR-GST-10) hoặc lễ tân đọc trực tiếp/gọi điện. Kênh khác cho mẫu `door_code` chờ SEC khi có khóa tự động (R3)". SEC sẽ sửa SR-LOCK-03 cùng lúc. QA tình huống #14 đổi kết quả đúng theo câu này.
- Trạng thái: Open

### FB-R2-SEC-DOM-02
- Mức độ: Major
- Vị trí: mục 0 điểm 3, mục 3 dòng OTA, mục 5, BR-972, BR-981; so với zalo-oa.md mục 3 bước 1 ("Đơn OTA của khách Việt có SĐT: gửi được ZNS")
- Vấn đề: DOM: khách OTA chỉ nhắn trong hội thoại OTA. INT: gửi ZNS tới SĐT khách OTA. Hai bản trái nhau. SĐT do OTA chuyển cho OTTIMO để phục vụ đơn; dùng nó để gửi qua Zalo là đưa dữ liệu sang thêm một bên thứ ba. Điều khoản OTA cho phép không [Chưa xác minh].
- Vì sao quan trọng: Nguyên tắc giới hạn mục đích (DRA P01, P11) và điều khoản OTA (rủi ro Z8 của INT). Lệch quy tắc thì BE sẽ cài theo bản nào cũng sai một nửa.
- Đề xuất sửa (DOM + INT thống nhất một câu trong BR-972):
  1. Mặc định: SĐT/email nhận từ OTA chỉ dùng cho hội thoại OTA và việc gọi điện vận hành.
  2. ZNS cho khách OTA chỉ khi khách **tự đưa** SĐT cho OTTIMO (check-in online, nhắn OA trước, tại quầy) và đã thấy thông báo xử lý dữ liệu, **hoặc** INT xác nhận điều khoản OTA cho phép (ghi nguồn).
  3. Lưu nguồn của từng liên hệ (`contact_source`: `ota` | `guest_provided`) để lõi chọn kênh đúng.
- Trạng thái: Open

### FB-R2-SEC-DOM-03
- Mức độ: Minor
- Vị trí: mục 2 nguyên tắc 11 ("trên thiết bị của cơ sở – … (SR-DEV-08, TM-17)"); mục 10 dòng SEC
- Vấn đề: SR-DEV-08 **cấm** cài Zalo/app chat trên thiết bị di động được cấp quyền. Dẫn SR-DEV-08 để ủng hộ chat trên thiết bị của cơ sở là ngược nghĩa.
- Vì sao quan trọng: BA/FE đọc nguyên tắc này sẽ hiểu sai yêu cầu thiết bị.
- Đề xuất sửa: Nguyên tắc 11 dẫn quy tắc SEC ở FB-R2-SEC-INT-12 (OA Manager bản web, hồ sơ trình duyệt riêng, mỗi người một tài khoản; điện thoại cá nhân chỉ OWN/MGR). Áp tương tự cho WhatsApp của cơ sở (WhatsApp Web, không cài app trên thiết bị được cấp).
- Trạng thái: Open

### FB-R2-SEC-DOM-04
- Mức độ: Minor
- Vị trí: mục 0 điểm 6 và mục 10 dòng PO ("Tin cần gửi hôm nay", sao chép một chạm); BR-976
- Vấn đề: Danh sách này sẽ sinh tin có link check-in. ADR-006 chỉ lưu băm token, nên mỗi lần chép phải cấp token. Chưa nói dùng token nào, ai được chép.
- Vì sao quan trọng: Cấp lại token chính mỗi lần chép sẽ thu hồi link khách đang dùng; CTV không được render link (SR-MSG-03).
- Đề xuất sửa: Ghi vào đề xuất story: tin có link dùng **token thông báo** như INT-09; chỉ vai có A22; `message_log` ghi `copied`, không ghi nội dung/link; CTV thấy việc nhưng không chép được tin có link.
- Trạng thái: Open

### FB-R2-SEC-DOM-05
- Mức độ: Minor
- Vị trí: TP-10 (b) "email cảm ơn có khối ưu đãi"; mục 5 quy tắc 5 và mục 10 dòng PO ("ô đồng ý nhận ưu đãi không tích sẵn" trên landing)
- Vấn đề:
  - Khối ưu đãi nằm trong email cảm ơn + bill → trộn tin vận hành với marketing, trái nguyên tắc 4 của chính DOM.
  - Ô "đăng ký nhận ưu đãi" trên landing: ai cũng nhập được SĐT/email của người khác → OTTIMO gửi quảng cáo cho người không đồng ý.
- Vì sao quan trọng: Đồng ý phải của chính chủ thể và chứng minh được (DRA R-CON-01). Tách tin thì rút đồng ý không làm mất tin vận hành.
- Đề xuất sửa:
  1. Mã đặt trực tiếp gửi bằng tin/email **riêng** (vẫn cùng thời điểm được). In ở chân bill giấy của đơn trực tiếp đã đồng ý – chấp nhận.
  2. Landing v1/v2 **không** có ô đăng ký nhận ưu đãi. Thay bằng nút "Theo dõi Zalo OA" (khách tự làm trên Zalo của mình). Nếu sau này cần: xác nhận 2 bước qua chính kênh đó (double opt-in) + SEC review.
- Trạng thái: Open

### FB-R2-SEC-DOM-06
- Mức độ: Suggestion
- Vị trí: TP-00, TP-01, TP-11 (tin có VietQR/số tiền)
- Vấn đề: Ngành lưu trú hay bị giả danh: tài khoản Zalo giả tên "OTTIMO" nhắn khách đòi chuyển cọc vào tài khoản khác.
- Vì sao quan trọng: Khách mất tiền, OTTIMO mất uy tín, dù hệ thống không bị tấn công.
- Đề xuất sửa: Thêm một câu cố định ở TP-00/TP-01 và trang Hỏi đáp landing: "OTTIMO chỉ nhắn từ Zalo OA đã xác thực/hộp thư OTA. OTTIMO không bao giờ đổi số tài khoản qua tin nhắn và không hỏi số thẻ". UXD viết câu chữ.
- Trạng thái: Open

---

## 5. Thẻ cho UXD – `concept.md` và `mock/index.html`

### FB-R2-SEC-UXD-01
- Mức độ: Minor · **[CHẶN] C-1 – cổng LP-v1 (trước khi landing lên mạng)**
- Vị trí: mock dòng 29–31 (Google Fonts), 32 (`<style>`), 420 (`style=` trên SVG), 971–1120 (`<script>` inline, `localStorage` cho thanh công cụ mock); concept 7.1 ("CSS quan trọng nội tuyến"), 5.5 ("Mock dùng Google Fonts")
- Vấn đề: Với mock thì chấp nhận. Nhưng concept 7.1 tính ngân sách LCP dựa trên **CSS nội tuyến**, trái ADR-014 mục 2.4 (cấm `<style>`, CSP `style-src 'self'`). Google Fonts gửi IP người xem sang Google ngay khi tải trang – trái điều kiện "không bên thứ ba" của mục 6.3.
- Vì sao quan trọng: FE dựng từ mock. Chép nguyên mẫu inline/Google Fonts thì CSP chặt hỏng hoặc phải nới `unsafe-inline` (SR-HDR-01 cấm), và mất cơ sở "không cần banner".
- Đề xuất sửa:
  1. Concept 7.1: bỏ giả định CSS nội tuyến; dùng một tệp CSS nhỏ có tên băm + preload. Nếu đo thấy cần CSS nội tuyến: chỉ qua băm `style-src 'self' 'sha256-…'` sinh lúc build, ARC duyệt; không bao giờ `unsafe-inline` [Nguồn: MDN style-src].
  2. Font tự host (concept 5.5 đã ghi – giữ). Bản production: 0 yêu cầu tới tên miền ngoài khi tải trang (QA kiểm bằng Playwright, đếm request).
  3. Thanh công cụ A/B/sáng-tối và `localStorage` của mock không đưa vào bản thật (trừ tùy chọn sáng/tối nếu UXD giữ – xem ARC-11).
  4. Ghi trên đầu mock: "Mock – không phải mẫu mã production".
- Trạng thái: Open

### FB-R2-SEC-UXD-02
- Mức độ: Minor
- Vị trí: concept mục 6 (ô ảnh), 5.7 (chỉ đạo ảnh), 4.8 (đánh giá), 4.9 (bản đồ), 4.10 (QR Zalo); ADR-014 mục 7.3, 7.8 (e-brochure)
- Vấn đề: Danh sách kiểm ảnh đã tốt (ADR 7.3). Còn thiếu vài điểm:
  - Ảnh mặt tiền/lối vào chụp **cận bàn phím khóa cửa** lộ hãng/mẫu khóa (giúp kẻ xấu tìm lỗi đã biết của mẫu đó).
  - Ảnh có thể lộ số căn trên cửa kèm cửa sổ/ban công (đoán căn từ ngoài phố).
  - QR Zalo OA: nếu nhúng ảnh từ máy chủ Zalo thì là tài nguyên ngoài.
  - Bản đồ tĩnh: giấy phép dữ liệu bản đồ (vd. OpenStreetMap yêu cầu ghi công) [Chưa xác minh nguồn bản đồ UXD dùng].
  - E-brochure PDF còn metadata (tác giả, đường dẫn máy).
- Vì sao quan trọng: Ảnh công khai là vĩnh viễn (ADR: ảnh trong lịch sử git). Sửa sau rất khó.
- Đề xuất sửa: Thêm vào cột kiểm của `photos.json`: không cận khóa cửa/bàn phím/biển số; không thấy màn hình, giấy tờ, Wi-Fi. QR OA và bản đồ tự host. Ghi công bản đồ theo giấy phép. PDF brochure bỏ metadata trước khi đăng. Đánh giá khách: giữ tên viết tắt + quốc gia, không ảnh đại diện (concept 4.8 đã đúng – giữ).
- Trạng thái: Open

### FB-R2-SEC-UXD-03
- Mức độ: Suggestion
- Vị trí: concept 4.3 ("Trang này không lưu thông tin bạn nhập."), 4.10 (bước 5 "ưu đãi cho lần sau"), 10.2
- Vấn đề: Câu chữ phải đúng với hệ thống: (a) câu "không lưu" chỉ đúng khi script đo lường không gửi ngày, số khách (concept 10.4 đã đúng); (b) bước 5 hứa ưu đãi cho mọi khách, nhưng ưu đãi chỉ gửi người đã đồng ý (INT-11).
- Vì sao quan trọng: Lời hứa sai trên trang công khai là rủi ro uy tín và pháp lý.
- Đề xuất sửa: Bước 5 viết "… và ưu đãi cho lần sau nếu bạn muốn nhận". Thêm câu chống giả danh ở mục Hỏi đáp (DOM-06). QA thêm ca: mở ô Hỏi phòng, nhập dữ liệu, kiểm không có request nào chứa ngày/số khách.
- Trạng thái: Open

---

## 6. SEC trả lời các câu hỏi nội bộ

| Hỏi | Từ | SEC trả lời |
|---|---|---|
| Bên thứ ba nào được tải trên landing? | PO (landing-scope mục câu hỏi nội bộ, RL7) | **Không bên nào** khi tải trang. Chỉ được **liên kết điều hướng** (khách bấm mới đi): `zalo.me`, `wa.me`, `tel:`, `mailto:`, Google Maps/Apple Maps, trang OTA. Ảnh QR, bản đồ, font, ảnh OG: tự host. Thêm GA4, pixel, iframe bản đồ/YouTube, widget chat, Turnstile → SEC review + banner đồng ý + có thể ESC (ADR 6.3) |
| v1 không có form, có cần trang quyền riêng tư? | PO, UXD (concept 13) | **Nên có (Should), không chặn LP-v1.** v1 gần như không xử lý dữ liệu cá nhân: log Caddy đã xóa header và che IP /24; bộ đếm tổng hợp. Trang ngắn nêu: không cookie theo dõi, log máy chủ giữ 90 ngày, link sang Zalo/WhatsApp/Maps theo chính sách của họ, cách liên hệ OTTIMO. Có form (US-155) thì **bắt buộc** (ARC-05) |
| "Không cần banner" (ADR 6.3) | ARC | SEC xác nhận phần kỹ thuật với 5 điều kiện (ARC-11). Kết luận pháp lý: luật sư (ESC-001) |
| Hạn lưu `booking_inquiry`, `ip_hmac` | ARC (ADR 4.6) | Bảng biên ở ARC-03 |
| SR-RL cho endpoint công khai | ARC (ADR mục 10) | Mục 7 bên dưới |
| Q5 – link khách trong tin tự động | INT | Token thông báo – INT-09 |
| Q8 – căn cứ gửi Tag 3; Zalo vào danh sách bên xử lý | INT | INT-11, INT-14 |
| Q9 – mẫu xác thực ZNS cho mã mức 2 | INT | Đồng ý có điều kiện – INT-15 |
| Thiết bị/tài khoản quản trị OA | DOM (mục 10) | INT-12 |
| Thông báo website TMĐT (NĐ 52/2013, sửa bởi NĐ 85/2021) | UXD (concept 13) | Ngoài phạm vi kỹ thuật SEC. Đồng ý thêm vào ESC-001; văn bản có thể đã thay đổi năm 2025–2026 [Chưa xác minh] |

## 7. SR-RL đề xuất cho endpoint công khai (SEC sẽ ghi vào `security-requirements.md` mục 13)

| Mã (dự kiến) | Endpoint | Ngưỡng | Nơi đếm | Khi vượt |
|---|---|---|---|---|
| SR-RL-10 | `getPublicFormToken` | 30/giờ/IP (IPv6 theo /64) | RAM (1 replica) | `429` |
| SR-RL-11 | `createBookingInquiry` | 5/giờ/IP, 20/ngày/IP; 3/ngày/liên hệ; trần cơ sở 100/ngày (biên 50–500) | **DB** (`rate_limit_counter`) | IP: `429`; liên hệ: `202` giống hệt (ARC-04); trần: `503 SITE_BUSY` (ARC-02) |
| SR-RL-12 | `recordSiteEvent` | 120/giờ/IP; giá trị mới `utm`/`ref_host` ≤ 200/ngày | RAM | Bỏ im lặng, `204` |
| SR-RL-13 | `getPublicAvailability`, `getPublicOffers` (R3) | 60/phút/IP, 1.000/ngày/IP | RAM (R3 chuyển DB theo SR-RL mục 13) | `429` |
| SR-RL-14 | Webhook Zalo | 300/phút, body ≤ 64 KB (như SR-RL-08) | RAM | `429` |

## 8. Ghi chú pháp lý và nguồn (tra 17/10/2026 – mọi điểm cần luật sư xác nhận)

| Điểm | Nội dung đội dùng | Nguồn | Mức |
|---|---|---|---|
| L-1 | Luật 91/2025/QH15 có hiệu lực 01/01/2026; Điều 19 khoản 1 có 5 trường hợp không cần đồng ý, gồm "thực hiện thỏa thuận của chủ thể dữ liệu … theo quy định của pháp luật" | https://luatvietnam.vn/tin-van-ban-moi/5-truong-hop-xu-ly-du-lieu-ca-nhan-khong-can-su-dong-y-cua-chu-the-186-103746-article.html | [Bên thứ ba – trích luật] |
| L-2 | NĐ 356/2025/NĐ-CP hướng dẫn Luật 91, hiệu lực 01/01/2026, **thay NĐ 13/2023**; bổ sung "dữ liệu theo dõi hành vi trực tuyến" vào nhóm nhạy cảm; hạn xử lý yêu cầu của chủ thể (rút đồng ý 15 ngày, xóa 20 ngày) | https://luatvietan.vn/diem-moi-cua-nghi-dinh-356-2025-so-voi-nghi-dinh-13-2023-ve-huong-dan-bao-ve-du-lieu-ca-nhan.html ; https://www.ey.com/vi_vn/technical/tax/tax-and-law-updates/nghi-dinh-so-356-2025-nd-cp-quy-dinh-chi-tiet-mot-so-dieu-va-bien-phap-thi-hanh-luat-bao-ve-du-lieu-ca-nhan | [Bên thứ ba]; EY: [qua tìm kiếm] |
| L-3 | NĐ 356/2025: kinh doanh dịch vụ xử lý dữ liệu cá nhân là ngành có điều kiện | Như L-2 (luatvietan, Điều 22) | [Bên thứ ba] |
| L-4 | Luật 91/2025 Điều 28 (dữ liệu trong dịch vụ quảng cáo): cần đồng ý, khách biết nội dung/phương thức/tần suất, có cách từ chối; thu thập qua theo dõi trang web cần đồng ý. Áp cho doanh nghiệp tự quảng cáo: chưa rõ | https://luatvietnam.vn/linh-vuc-khac/su-dung-du-lieu-ca-nhan-trong-kinh-doanh-dich-vu-quang-cao-883-103715-article.html | [Bên thứ ba]; phạm vi [Chưa xác minh] |
| L-5 | NĐ 91/2020 (chống tin nhắn rác) hiện áp cho SMS/MMS/USSD, email, cuộc gọi; dự thảo nghị định thay thế mở rộng sang ứng dụng OTT | https://bocongan.gov.vn/media/bca-media/library-20260909084715-f7e1171f-eb0c-4ae2-97ed-7017b136dc65-1-nghi-inh-thay-the-n-91.doc | [Nguồn – qua tìm kiếm; dự thảo; chưa đọc toàn văn] |
| L-6 | Tên miền gốc và tên miền con là cùng "site"; cookie `SameSite` không ngăn yêu cầu giữa chúng | https://web.dev/articles/same-site-same-origin | [Nguồn] |
| L-7 | Cookie tiền tố `__Host-` không đặt được `Domain` → tên miền anh em không ghi đè được | https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies | [Nguồn] |
| L-8 | CSP cho phép `<style>` theo băm `sha256-…` thay `unsafe-inline` | https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src | [Nguồn] |
| L-9 | Bản ghi CAA giới hạn nhà cấp chứng chỉ | https://www.rfc-editor.org/rfc/rfc8659 | [Nguồn] |
| L-10 | Công thức `X-ZEvent-Signature`, lịch gửi lại webhook | zalo-oa.md S22, S23 (INT đọc) | SEC chưa tự kiểm được [Chưa xác minh – SEC] |

Đề nghị thêm vào danh sách câu hỏi luật sư (ESC-001), không mở ESC mới:
1. Ánh xạ DRA/SR từ NĐ 13/2023 sang Luật 91/2025 + NĐ 356/2025 (đã có Q1 của DRA – nay biết tên nghị định).
2. Yêu cầu đặt phòng từ web (trước hợp đồng) có thuộc "thực hiện thỏa thuận" (Điều 19) không, hay phải xin đồng ý.
3. Điều 28 Luật 91 có áp cho OTTIMO tự gửi ưu đãi cho khách của mình không.
4. Zalo (VNG) khi gửi ZNS là bên xử lý hay bên kiểm soát; có cần hợp đồng xử lý dữ liệu riêng ngoài điều khoản ZBS; điều kiện kinh doanh dịch vụ xử lý dữ liệu (NĐ 356) có liên quan không.
5. NĐ 91/2020 và nghị định thay thế (nếu đã ban hành) có áp cho tin Zalo OA/ZNS, WhatsApp không (gộp câu 1 của DOM).

## 9. Việc SEC tự làm tiếp (không cần thẻ; chưa commit)

- `security-requirements.md` v0.4: SR-RL-10…14 (mục 7); SR-DEV-07/08 (OA Manager web, hồ sơ trình duyệt riêng); SR-LOCK-03 (không mã cửa qua Zalo/hội thoại); SR-GST mới cho token thông báo (INT-09); SR-MSG-04 (biến theo kênh – INT-10); SR-SECR-05 thêm `PUBLIC_FORM_SIGNING_KEY`, `INTEGRATION_TOKEN_KEK`, `ZALO_*`; đổi căn cứ NĐ 13 → Luật 91 + NĐ 356.
- `threat-model.md`: TM-63 lạm dụng form công khai; TM-64 lộ token Zalo/OAuth gắn OA giả; TM-65 giả webhook Zalo; TM-66 chiếm tài khoản quản trị OA để lừa khách; cập nhật TM-21 (token thông báo), TM-55 (Zalo).
- `data-risk-assessment.md`: P11 thêm chi tiết Zalo (trường, nơi lưu); D02 thêm `contact_source`; T mới cho `booking_inquiry`.
- Khung "Thông báo xử lý dữ liệu" có phiên bản cho landing + app khách (luật sư duyệt).

Dòng đề xuất cho `decision-log.md` (ORC ghi khi commit):
- `| 2026-10-17 | 2 | Tin tự động có link khách dùng token thông báo (mức 1, ≤ 7 ngày, 1 token/đơn, worker không cấp/thu hồi token chính, chỉ gửi tới liên hệ đã xác nhận); chấp nhận Zalo thấy URL có token | SEC | INT-09; TM-21 |`
- `| 2026-10-17 | 2 | Chat OA: mỗi nhân viên một tài khoản quản trị, OA Manager bản web trên máy cơ sở (hồ sơ trình duyệt riêng), điện thoại cá nhân chỉ OWN/MGR, gỡ quyền trong ngày khi nghỉ việc, không nhận ảnh giấy tờ qua chat | SEC | INT-12; sửa SR-DEV-07/08 |`
- `| 2026-10-17 | 2 | Không gửi mã cửa qua Zalo (ZNS/OA/chat) và hội thoại OTA | SEC | DOM-01; SR-LOCK-03 |`
- `| 2026-10-17 | 2 | Landing: bộ đếm tổng hợp không định danh, không bên thứ ba khi tải trang → SEC không yêu cầu banner (chờ luật sư); thêm bất kỳ công cụ theo dõi nào phải qua SEC | SEC | ARC-11 |`
- `| 2026-10-17 | 2 | Biên hạn lưu booking_inquiry và SR-RL-10…14 cho endpoint công khai | SEC | ARC-03, mục 7 |`

## 10. Điểm làm tốt (nên giữ)

- **ARC**: Form tạo `booking_inquiry` thay vì lead/giữ chỗ – chặn được cả khóa phòng hàng loạt lẫn gộp nhầm hồ sơ khách. Không tự gửi email/Zalo tới liên hệ chưa xác minh. CSP landing chặt như 3 app, cấm inline có kiểm trong CI.
- **INT**: Tra nguồn chính thức kỹ, phát hiện điều kiện gói Tăng trưởng. Không tự gửi lại khi hết thời gian chờ sau khi đã gửi. Outbox chỉ giữ tham chiếu, token mã hóa bằng khóa riêng mục đích.
- **DOM**: Tách 3 loại tin và không trộn. Mời đánh giá mọi khách, khiếu nại chỉ hoãn – đúng chính sách chống lọc đánh giá. Không ghi số giấy tờ/ngày thị thực trong tin nhắc; Wi-Fi không nằm trong tin.
- **UXD**: Không nhúng SDK Zalo/iframe bản đồ; đo lường không gửi ngày, số khách, nội dung. Đánh giá khách chỉ tên viết tắt. Mọi nút là link thật.

## R-2 – Kiểm 7 thẻ INT sau cổng QC Round 2 (SEC, 21/10/2026)

- **Nguồn:**
  - `responses/INT-responses.md` mục "Round 2 – Bước 4 sau cổng QC (R-2)";
  - `product/docs/integrations/zalo-oa.md` v0.2 mục 4.12;
  - mã `product/integrations/notification/zalo-policy.ts` và `zalo-policy.test.ts`. Mã nằm trên cây làm việc, chưa commit.
- **SEC chạy:** `vitest run notification/zalo-policy.test.ts` → **18/18 xanh**; `tsc --noEmit` của gói integrations sạch.
- **Backlog:** R3-Q40…Q45 đã có trong `03-backlog/backlog.md` mục 5.5.

| Thẻ | Kết luận SEC | [CHẶN] |
|---|---|---|
| INT-07 | Chấp nhận Deferred → R3-Q40. 4.12-A ghi đủ 6 điểm đề xuất, đúng thứ tự | C-4 giữ |
| INT-08 | Chấp nhận Deferred → R3-Q41. 4.12-F đủ 6 điểm; biến bí mật đã đổi sang `_FILE` | C-5 giữ |
| INT-09 | Chấp nhận Deferred → R3-Q42 + US-161 AC5. 4.12-B đúng quyết định SEC 17/10. Lưu ý khi cài: token thông báo lên mức 2 vẫn phải qua OTP/mã lễ tân (SR-GST-07). 4.12-B chưa ghi câu này, nhưng thẻ đã có | C-6 giữ |
| INT-10 | **Verified lớp kiểm.** Hai điều kiện thêm, phải có trước khi gỡ C-7 | C-7 giữ |
| INT-11 | Chấp nhận Deferred → R3-Q43. 4.7, 4.12-D đúng Q8 | C-8 giữ |
| INT-12 | **Verified phần INT.** Việc của SEC (SR-DEV-07/08) và hướng dẫn vận hành → R3-Q44 | Điều kiện ESC-021 giữ tới R3-Q44 |
| INT-14 | **Điểm 2–4 Verified**, điểm 1 chấp nhận Deferred → R3-Q45. Một điều kiện thêm khi gắn vào lõi | C-9 giữ |

### Đọc mã `zalo-policy.ts` – điểm tốt
- Danh sách cho phép nằm trong mã (sửa phải qua PR), không ở DB, nên màn OWN không nới được.
- Mẫu lạ bị chặn. Tên biến cấm khớp cả chuỗi con (`guest_token`, `door_code_2`…).
- Kết quả chỉ chứa tên biến, không lặp giá trị, nên log được an toàn.
- `room_name` cấm hẳn, chặt hơn đề xuất "số căn trước ngày đến": chấp nhận. `discount` ở `zns.direct_voucher` là giá trị ưu đãi, không phải tiền của bill khách: chấp nhận.
- `toZaloIntegrationLog` dựng bản ghi từ danh sách trường cho phép. SĐT, `template_data`, token, body bị bỏ theo cấu trúc; test có chuỗi rò.

### Điều kiện thêm (giữ trong C-7, C-9; thực hiện ở US-126 AC4 / R3-Q45, SEC review cùng PR gắn lõi)
1. **C-7 (a) – giá trị ô chữ tự do.** Lớp kiểm chỉ xét **tên** biến. `parking_note`, `address` (`zns.arrival_reminder`) và `customer_name` là chữ tự do: lễ tân có thể gõ "mã cổng 4829" vào ghi chú đỗ xe, và tin sẽ đi qua Zalo. Cách xử lý:
   - hoặc `parking_note`/`address` chỉ lấy từ cấu hình cố định của cơ sở (OWN sửa, có kiểm luật chữ số B-15 V2 – `hasLongDigitRun`/`hasSensitiveDigits` – lúc lưu);
   - hoặc lõi chạy luật B-15 trên giá trị các ô chữ tự do trước khi gửi, vi phạm → 422.
   - Kèm test: ghi chú có "Mã cổng 482913" → 422.
2. **C-7 (b) – test ở lõi.** NotificationService gọi `checkTemplateVariables` trước **mọi** lần gửi trên `zalo_zns`/`zalo_oa`, kể cả gửi lại và kênh dự phòng. Vi phạm → 422, không có dòng `outbox_message` đi ra ngoài. Có test.
3. **C-9 – định dạng trường log.** `errorCode` và `at` hiện nhận chuỗi bất kỳ ≤ 128 ký tự. Thông báo lỗi của Zalo có thể lặp lại SĐT. Khi gắn vào lõi:
   - `errorCode` chỉ nhận mã số của Zalo (`^-?\d{1,6}$`) hoặc mã nội bộ `^[A-Z_]{1,64}$`;
   - `at` chỉ nhận ISO-8601;
   - không bao giờ truyền `error.message` của Zalo vào;
   - thêm ca test errorCode chứa SĐT → `null`.
4. **Ghi chú tài liệu (Minor, không chặn).** Gạch cuối `zalo-oa.md` 4.7 vẫn ghi "Chat OA trên điện thoại cá nhân của nhân viên". 4.12-E thắng, nhưng INT nên sửa câu này ở lần sửa tài liệu kế tiếp cho khỏi đọc nhầm.

### ESC-001 – câu NĐ 91/2020 + OTT
ESC-001 đã có **LZ-5**: NĐ 91/2020 và dự thảo thay thế mở rộng sang OTT, áp cho Zalo OA/ZNS và WhatsApp, kèm giá trị tạm của đội. LZ-3 (Điều 28) và LZ-4 (vai của Zalo, NĐ 356/2025) cũng đã có. **SEC không bổ sung**, không đổi quyết định INV (ESC-001 = A, thuê luật sư).

Đề xuất để ORC nhắc khi gửi câu hỏi cho luật sư: nếu nghị định thay thế NĐ 91/2020 được ban hành trước tin marketing đầu tiên (R3-Q43), luật sư trả lời theo văn bản mới; khi đó DOM rà lại khung giờ và tần suất BR-973/974.

### Kết luận R-2
- **7/7 thẻ có trạng thái SEC:**
  - Verified: INT-10 (lớp kiểm), INT-12 (phần INT), INT-14 (điểm 2–4);
  - chấp nhận Deferred có mã backlog: INT-07, 08, 09, 11, 14 điểm 1.
- **Không mở lại thẻ nào.**
- **[CHẶN] C-4…C-9 giữ nguyên.** Tính năng Zalo chưa bật ở R2 (ESC-021 A: tự gửi từ R3), nên các điều kiện này không chặn cổng Round 2.
- Không có Critical/High.
