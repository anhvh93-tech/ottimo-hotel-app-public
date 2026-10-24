# SEC review – US-155 "Yêu cầu đặt phòng từ website" (BE-D, đưa vào v1.0)

- Người review: SEC | Ngày: 24/10/2026 | Round 3 – review bắt buộc (form công khai, dữ liệu khách chưa đăng nhập)
- Nhánh: `be-d/r3-us155-v1`, **SHA `2fdff4d`**, nằm trên `main` 91de0e7. Báo cáo: `outputs/BE/s1-be-d-us155.md`.
- Căn cứ:
  - `round-02/reviews/landing-booking-SEC.md`: 7 điều kiện [CHẶN] cho mốc "bật form trên production", gồm C-1, C-2, C-3, C-11, C-12, C-13, SEC-G1/G2; Phụ lục B là các ca kiểm bắt buộc;
  - ADR-014 mục 4.4; OpenAPI 0.3.7 bổ sung 2.
- Đã đọc:
  - `public-site.controller.ts`, `public-site.options.ts`, `form-token.ts`;
  - `public-booking.service.ts` (luồng `create`, `formToken`, `readiness`);
  - `website-requests.service.ts` (vai, xóa WR8);
  - thay đổi `auth.guard.ts`, `csrf.ts`, `config.ts`;
  - migration 0086 (RLS, quyền, hàm `public_resolve_property` SECURITY DEFINER, catalogue);
  - test `public-site-r3-bed.test.ts`, `be-d-r3-s1-units.test.ts`.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả (`example.invalid`, số điện thoại giả).

## Kết luận

| Hạng mục | Kết luận SEC |
|---|---|
| **Gộp vào `main`** | **Gộp được** ở `2fdff4d`. Không có Blocker. Có 1 Major (FB-01) phải sửa **trong round và trước khi bật form**. Gộp được vì công tắc `public_booking_requests_enabled` **mặc định tắt**: form token và lệnh gửi đều trả 404 như cơ sở không tồn tại, có test kiểm. |
| **Mốc "bật form trên production"** | **CHƯA ĐẠT.** Phần mã của C-2, C-3 (c)(d)(e), C-11 (phần lớn), C-12 (a)(c) đã có. Còn thiếu FB-01 (C-3 (d), C-12 (c)) và các ca Phụ lục B chưa có test (FB-03). Những điều kiện không thuộc mã vẫn mở: C-1 (bản dựng landing), C-3 (a) (thông báo xử lý dữ liệu đã luật sư duyệt và đã đăng), C-13 (luật sư trả lời LZ-2, LZ-8), SEC-G1/G2. Chỉ OWN bật được công tắc, và server từ chối (422 `PUBLIC_FORM_NOT_READY`) khi thiếu thông báo hoặc thiếu khóa ký. |

### Đối chiếu nhanh

| Mục | Kết quả |
|---|---|
| Form token | HMAC-SHA256 bằng khóa riêng `PUBLIC_FORM_SIGNING_KEY` (≥ 32 ký tự, nằm trong `DISTINCT_KEYS`). Token gắn với cơ sở, dùng được trong khoảng [+3 giây, +2 giờ), so chữ ký bằng `timingSafeEqual`, chỉ dùng một lần (nonce đã băm, `INSERT … ON CONFLICT DO NOTHING`). Đạt. |
| Bước 0 trước DB (C-11) | Bộ đếm trong RAM: 30 lần/giờ/IP (IPv6 tính theo /64), đếm cả lần lỗi, rồi giới hạn 4 request đồng thời → 503. SEC dò: lần 31 → 429. Đạt (đúng với 1 bản chạy; nhiều bản thì cần bộ đếm dùng chung – ghi nhận từ trước). |
| Origin, JSON, cookie | Chỉ nhận đúng `Origin` của `LANDING_BASE_URL`; thiếu, `null` hay origin khác → 403. Không phải `application/json` → 422. `Sec-Fetch-Site` khác `same-origin` → 403. SEC dò: gửi kèm cookie phiên OWN → 202 như khách thường, không cột người dùng nào được ghi. Cookie FD gọi thao tác Desk từ origin landing → 403. Header `X-Forwarded-For` giả không làm lệch bộ đếm (`trustProxy` theo cấu hình). |
| Chống spam và giới hạn | Ô bẫy → trả 202 giống hệt, không lưu. Mỗi liên hệ 3 lần/ngày, lần thứ tư im lặng. Trần ngày của cơ sở → 503 `SITE_BUSY`, báo OWN mỗi ngày một lần. PoW bật bằng tham số. Phát hiện số CCCD/thẻ trong tên và lời nhắn → 422, lỗi chỉ trả trường + mã, không nhắc lại giá trị. Đạt. |
| Phân quyền Desk (C-12 a) | FD+ thấy đủ. SAL chỉ thấy yêu cầu `new` chưa có người nhận, **không** có tên/SĐT/lời nhắn; sau khi nhận thì thấy; yêu cầu của người khác → 404. CTV → 403. Xóa WR8 chỉ OWN/MGR/FDL, phải khớp liên hệ, sau xóa thì không mở lại được. Đạt (theo test). |
| Không lộ dữ liệu cá nhân (C-12 c) | Thông báo, "Cần chú ý", audit, outbox: 0 lần có tên/SĐT/lời nhắn (SEC quét). Log của lượt chạy test: 0 lần. **`idempotency_key.response_body` của các thao tác Desk có đủ C2** (FB-01). |
| Xóa C2 khi `converted`, xóa theo yêu cầu, hạn lưu (C-2, C-3 d) | Chuyển đơn (`createReservation`/`createHoldFromQuote`) → C2 về NULL trong cùng giao dịch. Các job stale, purge, spam chạy theo tham số có biên SEC (test đồng hồ giả). Đạt, trừ bản sao C2 trong `idempotency_key` (FB-01). |
| Migration 0086 | RLS + FORCE trên 3 bảng mới. `public_resolve_property`: SECURITY DEFINER, `search_path` cố định, chỉ trả org/property/timezone của cơ sở `active` theo mã; quyền EXECUTE chỉ cấp cho `ottimo_app`. CHECK gồm tập cũ cộng giá trị mới, có test. 9 khóa bảo mật chỉ OWN sửa, có biên. Đạt. Xem FB-02. |
| `auth.guard.ts` / `csrf.ts` / `config.ts` | Chỉ thêm nhóm origin `landing` cho đúng 2 đường công khai. `LANDING_BASE_URL` bắt buộc https ở staging/production. Không nới origin của nhân viên hay khách. Đạt. |

## Kiểm đã chạy
Chạy trên worktree tách riêng ở `2fdff4d`, Postgres 17 mới, migrate từ đầu tới 0086; đã gỡ sau khi chạy.
1. `tsc --noEmit`: đạt.
2. `public-site-r3-bed.test.ts`: 19/19 đạt, cùng một ca dò của SEC.
3. `be-d-r3-s1-units`, `architecture`, `config`, `schema-parity`: **86/86 đạt**.
4. Test dò tạm của SEC (không commit, đã xóa), các ca P1, P2, P3, P5, P8 như bảng trên. P5 tìm ra FB-01.

## Thẻ feedback

### FB-R3-SEC-US155-01
- Mức độ: **Major** (phải sửa trong round; là điều kiện C-3 (d) và C-12 (c) trước khi bật form)
- Vị trí:
  - bộ đệm idempotency chung cho thao tác nhân viên: `idempotency_key.response_body` của `claim`, `decline`, `reopen`, `mark-spam` trên `/website-booking-requests/{id}/actions/*`;
  - phản hồi của `createHoldFromQuote` và `createReservation` có `websiteBookingRequestId`;
  - `website-requests.service.ts` thao tác `erase`; các job purge, stale và spam.
- Vấn đề:
  - SEC quét DB sau một vòng test: tên, SĐT và lời nhắn của người gửi nằm trong **7 dòng** `idempotency_key.response_body` (`principal_type = user`), vì phản hồi của các thao tác Desk có trả C2.
  - Khi người gửi đề nghị xóa (WR8), khi chuyển đơn, hay khi job hạn lưu xóa C2 thì bảng chính về NULL, nhưng **các bản sao này vẫn còn** tới khi hết `idempotency_ttl_hours`. Mặc định là 48 giờ, OWN/MGR chỉnh được tới **720 giờ**.
  - Riêng phản hồi của lệnh gửi công khai thì sạch: chỉ có `refCode` và `promise`.
- Vì sao quan trọng:
  - "Xóa ngay theo yêu cầu khách" (C-3 (d)) và hạn lưu cho mọi trạng thái (C-2) không còn đúng: dữ liệu của người chưa từng là khách nằm thêm tới 30 ngày ở một bảng mà job hạn lưu US-155 không biết tới.
  - Bảng này cũng không nằm trong danh sách kiểm C-12 (c).
- Đề xuất sửa (chọn một, ưu tiên a):
  - (a) Với các đường `/website-booking-requests/*`, bộ đệm idempotency chỉ lưu trạng thái, mã và `version`. Khi phát lại thì đọc lại bản ghi theo quyền hiện tại. Không lưu C2.
  - (b) Hoặc: `erase`, chuyển đơn và mọi job xóa C2 cùng xóa các dòng `idempotency_key` có `path` chứa id yêu cầu, trong cùng giao dịch (bảng đã có DELETE cho app).

  Thêm ca test: sau WR8 hoặc khi `converted`, quét `idempotency_key` thì 0 dòng có tên/SĐT/lời nhắn. QA đưa vào Phụ lục B.2 ca 8.
- Trạng thái: Open

### FB-R3-SEC-US155-02
- Mức độ: Minor
- Vị trí: `public-site.controller.ts` kiểm kích thước body (`content-length` hoặc `JSON.stringify(body)`).
- Vấn đề:
  - Giới hạn 8 KB chỉ được kiểm **sau** khi Fastify đã đọc và parse body theo giới hạn chung của ứng dụng.
  - Body không có `content-length` (chunked) vẫn được parse đầy đủ trước bước kiểm.
  - C-11 dựa vào Caddy (16 KB ở origin landing) làm lớp chặn chính.
- Đề xuất sửa:
  - đặt `bodyLimit: 8192` riêng cho 2 route công khai (cấu hình theo route của Fastify);
  - OPS xác nhận `request_body max_size 16KB` trên vhost landing, kèm ca test gửi chunked 64 KB → 413.
- Trạng thái: Open

### FB-R3-SEC-US155-03
- Mức độ: Minor (phải xong trước mốc bật form; không chặn gộp)
- Vị trí: `public-site-r3-bed.test.ts` so với Phụ lục B của `landing-booking-SEC.md`.
- Vấn đề: các ca bắt buộc **chưa có test tự động**:
  - B.1.1: lần 31 trả 429 **mà không có truy vấn DB** (đếm truy vấn);
  - B.1.2: 4 request đang chạy → request thứ 5 nhận 503, Desk vẫn nhanh;
  - B.1.4: gửi kèm cookie nhân viên (SEC đã dò tay: đạt);
  - B.1.6: `X-Forwarded-For` giả khi bật `trustProxy` thật;
  - B.1.10: dừng khởi động khi khóa < 32 ký tự (có ở mức đơn vị? cần xác nhận);
  - B.1.12: IPv6 /48;
  - B.2.1–B.2.3: chuỗi độc hại hiển thị trên Desk – phần FE;
  - B.2.8: snapshot SSE.
- Đề xuất sửa: BE-D thêm các ca phía server; QA và FE-B làm các ca E2E/FE. SEC kiểm lại trước khi INV bật form.
- Trạng thái: Open

### FB-R3-SEC-US155-04
- Mức độ: Suggestion
- Vị trí: bộ đếm RAM bước 0 và `inFlight` theo từng tiến trình.
- Vấn đề: đúng khi chạy 1 bản, đã ghi trong báo cáo. Nếu sau này chạy nhiều bản thì giới hạn nhân theo số bản.
- Đề xuất sửa: ghi vào checklist mở rộng hạ tầng (OPS); khi đó chuyển bước 0 sang bộ đếm dùng chung, hoặc đặt giới hạn tại Caddy.
- Trạng thái: Open

## Điều kiện SEC cho mốc "bật form trên production" (cập nhật 24/10)
1. Sửa FB-01 có test; FB-03 có các ca phía server; FB-02 (route `bodyLimit` + cấu hình Caddy).
2. C-1: bản dựng landing qua `check-dist` + Playwright, 0 request ra ngoài.
3. C-3 (a): thông báo xử lý dữ liệu EN + VI đã luật sư duyệt, đã đăng, đã ghi `privacy_notice_version`.
4. C-13: luật sư trả lời LZ-2, LZ-8 (ESC-001).
5. SEC-G1/G2 cho Desk chạy dữ liệu thật.
6. OPS: `LANDING_BASE_URL` (https) và secret `PUBLIC_FORM_SIGNING_KEY_FILE` riêng; Caddy chỉ proxy 2 đường dẫn, giới hạn body.

Đủ cả 6 thì SEC xác nhận mốc. Khi đó INV (OWN) mới bật công tắc.

## Điểm làm tốt
1. Công tắc mặc định tắt, chỉ OWN bật được, và server tự từ chối khi chưa đủ điều kiện pháp lý/kỹ thuật (422 `PUBLIC_FORM_NOT_READY` kèm `missing[]`).
2. Bước 0 hoàn toàn trong RAM trước mọi truy cập DB; phản hồi công khai không bao giờ lặp lại dữ liệu khách; lỗi chỉ có trường + mã.
3. Phân quyền SAL theo dữ liệu (không tên/SĐT/lời nhắn khi chưa nhận) và xóa C2 trong cùng giao dịch khi chuyển đơn. Thiết kế "dữ liệu người lạ là tạm thời" được làm đúng.

---

## Kiểm lại trên `main` `61255f1` (24/10/2026)

- `main` đã có:
  - BE-D `32e5fda`: sửa FB-01/02/03 và ARC US155-01/02, thêm migration 0087;
  - FE-B `aa2d52c`: màn Desk S35 và form landing (mặc định tắt).
- Đã đọc diff `5820a97..32e5fda`: `unit-of-work.ts` (`storeBody`), `http.ts` (`bodyLimit` cho `/v1/public/`), `website-requests.controller.ts`, `quotes.controller.ts`, `reservations.controller.ts`, migration 0087. Đã đọc thêm trả lời `responses/s1-BE-D-us155.md`.
- Kiểm đã chạy, trên worktree tách riêng ở `61255f1`, Postgres 17 mới, migrate từ đầu tới 0087; đã gỡ sau khi chạy:
  - `tsc` đạt;
  - `public-site-r3-bed`, `be-d-r3-s1-units`, `architecture` cộng ca quét của SEC: **82/82 đạt**;
  - **SEC quét lại** sau toàn bộ luồng test (nhận, từ chối, mở lại, đánh dấu spam, xóa, giữ chỗ, đơn B2): `idempotency_key.response_body`, audit, outbox, "Cần chú ý" **0 dòng** có tên/SĐT/lời nhắn. Log lượt chạy: 0 lần;
  - body JSON 20 KB gửi lên route công khai → **413** (chặn trước parse).

### Trạng thái thẻ

| ID | Mức | SEC xác nhận |
|---|---|---|
| FB-R3-SEC-US155-01 | Major | **Verified.** Thao tác chuyển trạng thái của yêu cầu, giữ chỗ `website` và đơn B2 chỉ lưu `{ id }` vào bộ đệm idempotency; khi phát lại thì đọc lại bản ghi theo quyền hiện tại, nên sau WR8 không còn C2. Có test quét bảng; SEC quét độc lập ra 0 dòng. |
| FB-R3-SEC-US155-02 | Minor | **Verified phần server.** `bodyLimit` 8 KB cho mọi route `/v1/public/`, chặn cả body chunked trước parse; SEC dò 20 KB → 413. **Còn phần OPS**: Caddy `request_body max_size 16KB` trên vhost landing, kèm ca kiểm qua Caddy. |
| FB-R3-SEC-US155-03 | Minor | **Verified phần server.** Đã có test cho B.1.1 (429 mà không mượn kết nối DB), B.1.2 (503 khi đủ 4 request đang chạy), B.1.4 (cookie), B.1.6 (`trustProxy` thật), B.1.10 (khóa ngắn hoặc trùng), B.1.12 (IPv6 /48), B.2.8 (SSE chỉ có `{ id }`). **Còn B.2.1–B.2.3** (hiển thị chuỗi độc hại trên Desk) – FE-B/QA. |
| FB-R3-SEC-US155-04 | Suggestion | Ghi nhận. OPS ghi runbook "API chạy 1 bản" (cùng ARC US155-04). |
| (ARC US155-01/02, SEC đọc kèm) | – | Đạt góc bảo mật. `public_resolve_property` chỉ trả khi đúng **một** cơ sở `active` khớp mã, nên yêu cầu không bao giờ rơi vào cơ sở của tenant khác. Trigger chỉ cho xóa dòng `spam`, cùng lớp với Q51-02. |

### Điều kiện còn lại trước khi bật form trên production (SEC xác nhận mốc khi đủ cả 7)

| # | Điều kiện | Ai làm | Trạng thái |
|---|---|---|---|
| 1 | B.2.1–B.2.3 phía Desk S35: tên/lời nhắn chứa `<img onerror>` và URL hiển thị nguyên chữ, không tạo thẻ `<a>`, có nhãn cảnh báo URL; ký tự U+202E bị bỏ; CCCD trong lời nhắn → 422 và không xuất hiện trong log Caddy/Postgres. Có test E2E hoặc FE. | FE-B + QA | Mở |
| 2 | Caddy vhost landing: chỉ proxy 2 đường dẫn công khai, `request_body max_size 16KB`; ca chunked 64 KB qua Caddy → 413. Có `LANDING_BASE_URL` (https) và secret `PUBLIC_FORM_SIGNING_KEY_FILE` riêng trên production. Runbook "API 1 bản". | OPS | **Đạt trên repo** (`751ce79`, SEC kiểm 24/10 – mục dưới). Còn bước VPS khi bật form: `LANDING_IP` trong `.env`, `LANDING_PUBLIC_API=on`, `LANDING_BASE_URL` – theo README 12.3 |
| 3 | C-1: bản dựng landing (`/book/`, trang cảm ơn, trang quyền riêng tư) qua `check-dist.mjs` + Playwright: 0 request ra bên thứ ba, không lỗi CSP. | FE-B / FE-LP + QA | Mở (FE-B báo bản prod giống hệt từng byte khi form tắt; cần chạy lại khi bật) |
| 4 | C-3 (a): thông báo xử lý dữ liệu EN + VI đã luật sư duyệt, đã đăng, đã ghi `privacy_notice_version` cho từng ngôn ngữ. Server tự chặn bật khi thiếu. | INV + luật sư, rồi OPS ghi phiên bản | Mở (ESC-001) |
| 5 | C-13: luật sư trả lời LZ-2 (căn cứ xử lý) và LZ-8 (thông báo/đăng ký website theo Luật TMĐT 2025, NĐ 248/2026), hoặc OTTIMO đã làm thủ tục. | INV + luật sư | Mở (ESC-001) |
| 6 | SEC-G1/G2: Desk chạy dữ liệu thật đạt kiểm tra SEC (`s3-SEC.md` mục 9.5). | SEC + OPS | Theo cổng phát hành v1.0 |
| 7 | E2E US-155 trên stack có `LANDING_BASE_URL` + khóa ký: form → Desk S35 → báo giá/giữ chỗ hoặc đơn đảm bảo; ca B2. | QA | Mở |

Phía server không còn thẻ SEC nào chặn mốc này.

### Điều kiện 2 – phần OPS (`751ce79`, kiểm 24/10/2026)

- Đã đọc:
  - `Caddyfile.landing`; `docker-compose.prod.yml` (landing vào mạng `edge` ở `LANDING_IP` cố định; `TRUST_PROXY = WEB_IP,LANDING_IP`; landing không vào mạng `db`, không nhận bí mật app);
  - các bước `config` của `deploy.sh` / `deploy-landing.sh`, gồm chặn `LANDING_BASE_URL` không phải https, lệch host khi `on`, `LANDING_IP` ngoài `EDGE_SUBNET`;
  - kiểm số bản api của `ops-check`; README 12.2–12.3;
  - báo cáo `outputs/OPS/v1-production.md` mục 14.
- Đã chạy, trên worktree tách riêng ở `751ce79`, image `caddy` đúng digest pin, có sẵn trên máy:
  - `check-caddy-landing.sh` → **16/16 ok**:
    - chỉ `GET …/form-token` và `POST …/booking-requests` được proxy, có XFF do Caddy đặt;
    - body khai 20 KB → 413; chunked 64 KB → 413; body quá cỡ không tới api;
    - sai phương thức, `availability`/`offers`, slug viết hoa hoặc quá ngắn, `/v1/me`, `/v1/auth/login`, `/health` → 404;
    - `LANDING_PUBLIC_API` không đặt → 404.
  - `check-compose.sh` → OK.
- Kết luận: **phần OPS của điều kiện 2 đạt trên repo.** Khi bật form, OPS làm các bước VPS theo README 12.3, sau đó gửi SEC kết quả `ops-check` cùng một lần gọi thật qua landing (form-token 200, `/v1/me` 404).
- Gợi ý (không chặn):
  1. Thêm một ca vào `check-caddy-landing.sh`: khách tự gửi `X-Forwarded-For: 1.2.3.4` → stub api nhận XFF là IP thật, không phải 1.2.3.4. Caddy mặc định không tin XFF đầu vào khi chưa cấu hình `trusted_proxies`; ca này khóa hành vi đó lại.
  2. Mạng `edge` chưa có `ip_range` cho cấp phát động. Nên đặt, ví dụ nửa trên của subnet, để Docker không bao giờ cấp `WEB_IP`/`LANDING_IP` cho container khác. Hai IP này được api tin làm proxy.

---

## Duyệt nhanh BUG-R3-008 / 009 (SEC, 24/10/2026) – `main` `4233290` (BE-D `031f183`)

### BUG-R3-009 – mẫu `looksLikeIdNumber` / `looksLikeCard`: **SEC đồng ý**
- Cách làm: bỏ ngày/giờ trước, rồi so trên **chữ số** của dãy số có nhóm. Hai chữ số liền nhau chỉ được cách bởi tối đa 1 dấu: cách, chấm hoặc gạch. Bắt khi đúng 9 hoặc 12 chữ số, trừ khi ngay trước là `+`/`$`, hoặc ngay sau là đơn vị tiền.
- SEC chạy thử trên mã của `031f183`:
  - **Chặn đúng:** `079 203 012 345`, `079-203-012-345`, `079.203.012.345`, `079  203 012 345` (hai dấu cách), `CMND 123 456 789`, `B1234567`.
  - **Thẻ** `4111.1111.1111.1111` → chặn (Luhn).
  - **Không chặn:** `0905 111 222`, `+84 905 111 222`, `84 905 111 222`, `0263 382 1234`, `23.10.2026 lúc 22:30`, `23.10 - 26.10.2026`, `100.000.000 đ`, `150 000 000 VND`, `$ 100 000 000`.
  - **Bị chặn theo hướng an toàn** (khách sửa lời nhắn là gửi được): `100.000.000` không có đơn vị; `905 111 222` (SĐT bỏ số 0 đầu).
- Đồng ý giả định của BE-D: số 9 chữ số dạng tiền mà không có đơn vị thì coi là CMND. Mục tiêu của luật này là **tối thiểu hóa dữ liệu**: không để khách vô tình gửi số giấy tờ qua form công khai. Nó không phải hàng rào chống người cố tình lách. Vì vậy chặn thừa một chuỗi hiếm còn hơn lọt số CCCD vào hàng chờ, thông báo và log.
- Còn lọt, chấp nhận được, ghi để biết:
  - `079/203/012/345` (dấu `/` được dành cho ngày);
  - hộ chiếu chữ thường `c1234567` (đã như vậy từ trước).

  Người cố tình thì luôn lách được. Hai điểm này chỉ là gợi ý (FB-05), không chặn.
- Gợi ý cho FE/UXD: câu lỗi 422 `ID_NUMBER_DETECTED` nên nói rõ "nếu là số tiền, thêm đ hoặc VND" để khách tự sửa.

### BUG-R3-008 – công tắc tắt form ngay trong ngày: **SEC đồng ý**
- Chỉ áp cho đúng một khóa (`public_booking_requests_enabled`), chỉ khi đặt về giá trị an toàn `false`, và chỉ với `effectiveFrom` = hôm nay. Vẫn chỉ OWN sửa được (`edit_roles`).
- Bật lại vẫn theo luật thường (cùng ngày → 422). Nhật ký `security` giữ giá trị cũ cùng `sameDayOverride: true`, và có thông báo OWN + MGR. Đúng hướng an toàn: tắt nhanh, bật chậm.
- `public_booking_request_pow_enabled` không cần nằm trong danh sách này, vì bật PoW là thắt chặt thêm và cũng hiệu lực từ hôm sau.

  Nếu muốn bật PoW ngay trong ngày khi đang bị spam, có thể thêm "giá trị an toàn = `true`" cho khóa này. Việc này để ARC/DOM chọn; SEC không bắt buộc.
- **BUG-R3-010** (FDL đọc được khóa công tắc): chấp nhận. Giá trị chỉ là một boolean; FDL vẫn không sửa được (403), và các khóa bảo mật khác vẫn ẩn với FDL (404).

### FB-R3-SEC-US155-05
- Mức độ: Suggestion
- Vị trí: `website-request-rules.ts` `looksLikeIdNumber`.
- Đề xuất:
  - coi `/` là dấu nhóm khi dãy có ≥ 3 nhóm và tổng đúng 9 hoặc 12 chữ số (ngày tối đa có 3 nhóm và 8 chữ số);
  - so mẫu hộ chiếu không phân biệt hoa thường;
  - thêm cả hai vào test đơn vị.
- Trạng thái: Open
