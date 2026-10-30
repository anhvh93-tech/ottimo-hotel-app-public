# ARC – Báo yêu cầu đặt phòng website vào Google Chat (thiết kế ngắn)

- Round 3 · Bước: Sản xuất (thiết kế nhỏ sau `v1.0.0` = `8b3aec8`) · Tác giả: ARC · Ngày 30/10/2026
- Nguồn: decision-log 30/10 (INV "đăng tin vào google chat nha"), ORC bổ sung (phòng riêng, biến môi trường riêng), US-155, BR-912, ESC-002 A, BUG-R3-032, BUG-R3-041.
- Người review bắt buộc: SEC (dữ liệu ra dịch vụ ngoài, bí mật webhook), BE (khả thi). Khuyến nghị: OPS (bí mật, compose), INT (client HTTP Google Chat).
- Trạng thái: đề xuất, chưa có mã. Không đổi API contract công khai và không đổi chữ cho khách.

## 0. Kết luận nhanh

| Câu | Chốt của ARC |
|---|---|
| Điểm phát | Ghi một dòng `outbox_message` topic mới **`staff.chat`** trong **cùng giao dịch** tạo yêu cầu (`PublicBookingService.store`). Worker có bộ phát riêng gửi webhook. Gửi lỗi không làm hỏng việc tạo yêu cầu |
| Nội dung | Chỉ có mã yêu cầu, ngày đến, số đêm hoặc số tháng, số khách, loại lưu trú, giờ nhận, hạn phản hồi, link Desk. **Không** có tên, SĐT, email, Zalo, ghi chú hay kênh liên hệ của khách. Payload trong outbox chỉ chứa id, còn chữ được dựng lúc gửi |
| Cấu hình | Phòng Google Chat **riêng** "OTTIMO – Yêu cầu đặt phòng", tách khỏi phòng báo động OPS (đồng ý với ORC). URL webhook là **bí mật dạng tệp** `booking_request_chat_webhook`, đọc qua `BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE`, chỉ worker được đọc. Không để trong `.env`. Tệp rỗng thì tính năng tắt êm. Chỉ nhận `https://chat.googleapis.com/v1/spaces/<id>/messages?...` |
| Nhắc lại | **Should**: tái dùng job `web_request.sla` đang chạy (BR-912 (2)), cùng nhịp đó gửi thêm một tin "chưa ai nhận" vào Chat. Trong giờ trực tin này tới ở phút 30, sớm hơn câu hứa 60 phút. Ngoài giờ trực thì tới lúc 07:30 sáng hôm sau. Riêng yêu cầu đến đêm nay thì báo ngay cả lúc đêm. Không cần job hay tham số mới |
| Migration | **Không có.** `outbox_message.topic` là text, không có CHECK, đã có index chờ gửi, quyền và RLS sẵn |
| Công | Khoảng 2,5–3 công: BE 1,5 · INT 0,25 · OPS 0,25 · QA 0,5 · SEC review 0,25 |
| Phát hành | **Gộp vào v1.0.1 (dự kiến 04/11).** Không làm hotfix riêng: đây không phải P0, cần một bí mật mới trên máy chủ, và số v1.0.1 đã dành cho bản sửa đã lên kế hoạch. Thứ tự đề xuất: v1.0.1 lên production rồi mới bật form. Nếu bật form trước 04/11 thì áp cách tạm INV đã chốt: Desk luôn mở 07:00–22:00 |

## 1. Điểm phát và đường đi

### 1.1 Mã hiện có trên `main`, tức là chỗ cần chạm

- `product/services/api/src/modules/public-site/internal/public-booking.service.ts`
  - `createWebsiteBookingRequest`, bước D: một giao dịch nghiệp vụ, `statement_timeout 2s`, khóa Idempotency-Key với principal `public_site`.
  - `store()`: INSERT `website_booking_request` (trạng thái WR0 `new`), sau đó `this.events.notify(... kind 'website_request_new', roles FDL/FD/SAL ...)`. Điểm phát mới nằm **ngay sau dòng notify này**, vẫn trong cùng `tx`.
  - Các nhánh **không** tạo yêu cầu mới thì không phát: honeypot (bước 5), quá 3 lần/ngày cùng liên hệ (bước 10, chỉ tăng `duplicate_count`), replay Idempotency-Key, lỗi kiểm tra 422/429/404.
  - Nhánh chạm trần trong ngày (bước 11, `website_request_cap_reached` gửi OWN): phát thêm là **Could** (mục 4.3).
- `product/services/api/src/modules/events/public/events.service.ts` `notify()`: ghi hộp thư và SSE, ghi outbox `staff.push`. Topic `staff.push` **không có bộ phát** (BUG-R3-041), nên không thể dựa vào đường này. Thiết kế này không sửa `staff.push`.
- `product/services/api/src/jobs/email-dispatch.ts` `StaffEmailDispatcher`: mẫu outbox → worker đã chạy production (claim `FOR UPDATE SKIP LOCKED`, lease, back-off, `dead`, log không lộ dữ liệu). Bộ phát Chat **làm theo đúng mẫu này**.
- `product/services/api/src/worker.ts`: vòng tick 60 s gọi `runner.runDue` từng job rồi `emailDispatcher.runForProperty(p)`. Bộ phát Chat chạy ngay sau email, trong `try/catch` riêng.
- `product/services/api/src/modules/public-site/public/worker-jobs.ts` `web_request.sla`: điểm phát cho tin nhắc lại (mục 4).

### 1.2 Luồng

```mermaid
sequenceDiagram
  participant G as Khách (form ottimo.vn)
  participant A as api – public-site
  participant DB as PostgreSQL
  participant W as worker – ChatDispatcher
  participant C as Google Chat (phòng Yêu cầu đặt phòng)
  G->>A: POST yêu cầu (Idempotency-Key)
  A->>DB: BEGIN · INSERT website_booking_request · notify (Desk) · INSERT outbox staff.chat {kind, requestId} ON CONFLICT (dedupe_key) DO NOTHING · COMMIT
  A-->>G: 202 {refCode, promise}
  Note over W: tick 60 s
  W->>DB: tx1: claim ≤ 5 dòng staff.chat (SKIP LOCKED) → in_flight, lease 2 phút; dựng chữ từ dòng yêu cầu (không đọc cột C2)
  W->>C: POST text (timeout 5 s, không theo redirect) – ngoài giao dịch
  C-->>W: 200 / 429 / 5xx / 4xx
  W->>DB: tx2: done | failed (back-off) | dead | skipped
```

### 1.3 Ghi vào outbox (phía api)

- Thêm một hàm công khai của module events: `enqueueStaffChat(tx, { kind, refType, refId, now })`. Module events vốn sở hữu thông báo và outbox nhân viên. Đặt hàm ở đây để public-site không ghi thẳng vào bảng hạ tầng, và module-boundaries test vẫn xanh.
- Dòng ghi vào: `topic = 'staff.chat'`, `payload = {"kind":"web_request_new","refType":"website_booking_request","refId":"<uuid>"}`. **Chỉ có id.** Ngày, số khách và các trường khác được đọc lúc gửi.
- **Idempotent**: `dedupe_key = 'staff.chat:web_request_new:<requestId>'` dùng ràng buộc UNIQUE có sẵn, kèm `ON CONFLICT (dedupe_key) DO NOTHING`. Mỗi yêu cầu nhiều nhất một dòng, dù có replay hay retry SAVEPOINT `ref_code`. Lý do: dòng outbox ghi **sau** vòng lặp SAVEPOINT, nên chỉ ghi khi INSERT đã thành công.
- **Không chặn giao dịch**: ghi outbox là một INSERT nhỏ trong cùng giao dịch và không gọi mạng. Nếu INSERT outbox lỗi thì cả yêu cầu rollback và khách nhận 5xx. Đây là đúng nguyên tắc outbox: đã có yêu cầu thì phải có tin. Rủi ro của việc này không cao hơn `notify()` hiện tại, vì `notify()` cũng ghi outbox `staff.push` trong cùng giao dịch.
- Ghi outbox kể cả khi Chat đang tắt (api không biết cấu hình của worker). Worker xử lý những dòng đó theo mục 3.3.

### 1.4 Bộ phát (phía worker) – `ChatDispatcher`

| Mục | Giá trị | Lý do |
|---|---|---|
| Claim | `topic = 'staff.chat'`, trạng thái `pending/failed` đã tới hạn, hoặc `in_flight` hết lease. `ORDER BY created_at`, `LIMIT 5`, `FOR UPDATE SKIP LOCKED`, chạy theo từng property như email | Một worker cho mỗi stack (compose), nhưng vẫn khóa đúng cách |
| Lease | 2 phút. Tổng thời gian gửi của một lượt ≤ 1 phút: hết ngân sách thì nhả các dòng còn lại (`deferred`, không tính là một lần thử) | Cùng lý do ARC-03 của email: một lượt chạy không được sống lâu hơn lease, nếu không sẽ gửi đôi |
| Timeout | 5 s mỗi POST (`AbortSignal.timeout`), `redirect: 'error'`, thân gửi ≤ 4 KB, đọc phản hồi ≤ 2 KB rồi bỏ | Chặn treo và chặn chuyển hướng (SSRF) |
| Kết quả | 2xx → `done`. 429, 5xx, timeout, lỗi mạng → `failed`, back-off `[1, 5, 15, 60, 180]` phút. 400/401/403/404 → `dead` ngay, mã `CHAT_REJECTED_<status>` (webhook đã bị xóa hoặc URL sai, thử lại cũng vô ích) | Không lặp vô hạn: tối đa 6 lần thử trong khoảng 4,5 giờ, sau đó `dead` |
| Hết hạn tin | Lúc gửi mà dòng outbox cũ quá **12 giờ** (`web_request_new`) → `done` với `last_error = 'SKIPPED_STALE'`, không gửi | Worker ngừng lâu rồi chạy lại thì không xả một loạt tin cũ. Desk vẫn là nguồn chính |
| Yêu cầu đổi trạng thái | Lúc gửi, nếu yêu cầu đã `spam`, đã xóa, hoặc đã `pii_purged_at` → `SKIPPED_GONE`. Tin nhắc lại: yêu cầu đã có người nhận hoặc không còn `new` → `SKIPPED_HANDLED` | Không báo những việc đã xong |
| Gửi đôi | Có thể xảy ra (at-least-once) nếu tiến trình chết giữa POST và tx2. Có thể giảm bằng tham số `messageId=client-<outbox-id>` trên URL (Chat từ chối id trùng). **INT kiểm trên phòng thử**: nếu webhook nhận `messageId` thì dùng, và coi 409 là `done`. Nếu không nhận thì chấp nhận gửi đôi hiếm gặp | Chặn tuyệt đối gửi đôi không đáng thêm độ phức tạp |
| Gom luồng | `threadKey=<requestId>` + `messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD`: tin nhắc lại trả lời ngay trong luồng của tin đầu. **INT kiểm trên phòng thử**; không được thì gửi tin mới | Người trực thấy hai tin của cùng yêu cầu nằm chung một chỗ |
| Tốc độ | Gửi tuần tự, nhiều nhất 5 tin mỗi tick. Google giới hạn webhook khoảng 1 tin/giây mỗi phòng (INT xác nhận con số); trần yêu cầu mỗi ngày (`public_booking_request_daily_cap`) đã giới hạn tổng số tin. Gặp 429 thì back-off | |
| Log | `outboxId`, `kind`, `attempt`, `code` (mã HTTP hoặc tên lỗi). **Không bao giờ** log URL, query `key`/`token`, chữ của tin, hay thân phản hồi. Lỗi từ `fetch` chỉ log tên lỗi kèm mã (mẫu `errorTag` trong `worker.ts`), vì thông điệp lỗi của undici có thể chứa URL | SEC S-1 |
| Đếm | Mỗi lượt có gửi gì thì log `info 'chat dispatch' {sent, done, retry, dead, skipped}`. `dead` → `error 'chat dead'`. OPS thêm kiểm `chat_dead` vào `ops-check.sh` (số dòng `staff.chat` `dead` trong 24 giờ > 0 → FAIL), báo qua phòng **OPS** bằng `ALERT_WEBHOOK_URL`. Chỉ sửa sau ngày D: SEC đã dặn không sửa `ops-check.sh` trước D | Webhook hỏng thì phòng OPS biết, không phải đợi người trực nhận ra là không có tin |

## 2. Nội dung tin – dữ liệu tối thiểu (ESC-002 A)

### 2.1 Quy tắc

- Google Chat là dịch vụ ngoài, máy chủ ở nước ngoài. ESC-002 A yêu cầu **dữ liệu khách ở Việt Nam**. Vì vậy tin nhắn không chứa bất cứ thứ gì nhận diện được người: không tên, SĐT, email, Zalo/kênh liên hệ ưu tiên, ghi chú tự do, IP, UTM hay trang giới thiệu.
- Bộ dựng tin chỉ `SELECT` các cột không thuộc nhóm C2: `ref_code, arrival_date, departure_date, stay_kind, stay_months, adults, children, infants, created_at, reply_by, status, assigned_user_id, pii_purged_at, suspicious_flags`. Câu SQL được khóa bằng test (mục 5.2): không bao giờ chứa `guest_name|phone_e164|email|note|decline_note|contact_hmac|preferred_channel|ip_hmac`.
- Outbox chỉ giữ id. Chữ được dựng lúc gửi rồi bỏ, không lưu lại.
- Chữ theo brand: ngắn, điềm tĩnh, không emoji. Đây là tin nội bộ nên viết tiếng Việt. Ngày giờ theo múi giờ property, hiện `dd/MM` và `HH:mm`.

### 2.2 Mẫu tin

Tin mới (`web_request_new`):

```
Yêu cầu đặt phòng mới · REQ-7K3P9QXA
Đến 06/11 · 3 đêm · 2 người lớn, 1 trẻ em
Ngắn ngày · nhận lúc 14:05 · hạn phản hồi 14:20
Mở Desk: https://desk.ottimo.vn/website-requests/<requestId>
```

- Dài hạn: dòng 2 là `Đến 01/12 · 3 tháng · 1 người lớn`, dòng 3 bắt đầu bằng `Theo tháng`. Nếu không có ngày đi và không có số tháng thì ghi `chưa rõ thời gian ở`.
- Đến **đêm nay** (ngày đến = ngày nghiệp vụ, khi `replyPlan` cho kết quả `call_now`): dòng 1 thành `Yêu cầu đặt phòng mới – đến đêm nay · REQ-…`.
- Có `suspicious_flags`: thêm ` · cần xem kỹ` vào cuối dòng 3. Chỉ ghi đúng cụm này, không nêu tên cờ, vì cờ `possible_duplicate` ngầm cho biết cùng một người đã gửi nhiều lần.
- Mã yêu cầu hiển thị **giống hệt cách Desk hiển thị** (FE-B xác nhận có tiền tố `REQ-` hay không). Thêm số khách trẻ dưới 2 tuổi nếu `infants > 0`.
- Không ghi hạng phòng khách chọn (`room_type_slug`). Hạng phòng không phải dữ liệu cá nhân, nhưng ghi vào thì vượt danh sách INV/ORC đã nêu. Nếu PO muốn thêm thì SEC xem (câu S3).
- Link: `ADMIN_BASE_URL` (đã có trong env của worker) + `/website-requests/<requestId>`. Màn này đã có trên Desk (`WebRequestsPage` → `/website-requests/:requestId`). Muốn mở phải đăng nhập Desk, chủ và quản lý phải qua 2 bước. Id là UUIDv7, không đoán được và không chứa dữ liệu khách.
- Môi trường khác production: thêm `[staging] ` ở đầu dòng 1.

Tin nhắc lại (`web_request_overdue`, mục 4):

```
Chưa có người nhận · REQ-7K3P9QXA
Nhận lúc 14:05 · đã quá hạn phản hồi 14:20
Mở Desk: https://desk.ottimo.vn/website-requests/<requestId>
```

## 3. Cấu hình

### 3.1 Phòng riêng hay dùng chung phòng báo động OPS

**Phòng riêng**, đồng ý với đề xuất của ORC. Về kỹ thuật không có lý do nào để dùng chung, chỉ có lý do để tách:

| Tiêu chí | Phòng riêng "OTTIMO – Yêu cầu đặt phòng" | Dùng chung phòng báo động OPS (`ALERT_WEBHOOK_URL`) |
|---|---|---|
| Người đọc | Chủ, người trực, sale, tức là người phải trả lời khách | Chủ và OPS. Người trực không cần, và không nên thấy tên máy chủ hay tên các bước kiểm |
| Nhiễu | Mỗi tin là một việc cần làm | Báo động FAIL lặp lại mỗi 6 giờ làm chìm yêu cầu khách. Ngược lại, yêu cầu khách cũng làm chìm báo động |
| Cài thông báo | Bật âm cho mọi tin, đặt giờ yên lặng của riêng phòng này trong Google Chat | Khác nhu cầu |
| Thu hồi | Xóa hoặc đổi webhook của phòng này không ảnh hưởng báo động | Đổi URL thì mất cả hai |
| Nơi giữ URL | Bí mật tệp, đọc trong container worker | `.env` máy chủ, script host đọc |

### 3.2 Biến và bí mật

- Tên biến: `BOOKING_REQUEST_CHAT_WEBHOOK_URL`, nạp qua `BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE=/run/secrets/booking_request_chat_webhook`. Hàm `resolveFileSecrets` trong `config.ts` đã xử lý dạng này.
- **Vì sao dùng tệp mà không để trong `.env` như `ALERT_WEBHOOK_URL`**: URL webhook của Google Chat chứa `key` và `token`, ai có URL là đăng được tin vào phòng nhân viên, tức là có thể giả mạo tin hoặc gửi link lừa. `ALERT_WEBHOOK_URL` do script trên máy chủ đọc, không đi vào container. URL mới thì vào container worker. Quy tắc compose của dự án (FB-R1-SEC-OPS-10, `check-compose.sh` `PLAIN_SECRETS`) cấm bí mật ở dạng biến thường vì sẽ lộ qua `docker inspect`.
- Chỉ worker được nhận bí mật này (api không gửi). Tệp thuộc uid 1000, quyền 0400, giống `email_smtp_password`.
- **Tệp rỗng thì tắt.** `init-secrets.sh` tạo sẵn tệp rỗng, không hỏi gì. Có thêm lựa chọn `--set-booking-chat` để hỏi URL bằng dấu nhắc ẩn: INV hoặc OPS tự dán URL trên máy chủ, **không** dán vào chat hay repo. Staging và production là hai thư mục bí mật riêng. Staging để rỗng, hoặc dùng webhook của một phòng thử riêng, **không bao giờ** dùng phòng thật.
- Bắt buộc: thêm `booking_request_chat_webhook` vào khối `secrets:` và danh sách secrets của worker. Thêm `BOOKING_REQUEST_CHAT_WEBHOOK_URL` vào `PLAIN_SECRETS` trong `check-compose.sh`. Thêm dòng chú thích vào `env.example` và `env.production.example` (không có giá trị).

### 3.3 Kiểm URL (chống SSRF) và tắt êm

Đặt hàm kiểm trong `product/integrations/common/safe-config.ts`, là nơi duy nhất quyết định cấu hình tích hợp có an toàn không. Worker gọi hàm này lúc khởi động:

- Rỗng hoặc không đặt → `off`.
- Hợp lệ khi: `new URL()` parse được, `protocol === 'https:'`, `hostname === 'chat.googleapis.com'` (so khớp tuyệt đối, chữ thường), không có `username`/`password`, `port === ''`, `pathname` khớp `^/v1/spaces/[A-Za-z0-9_-]{1,64}/messages$`, có tham số `key` và `token`, tổng độ dài ≤ 512.
- Không hợp lệ → **không chặn worker khởi động.** Nếu chặn thì J1, J15, J16 và email cũng dừng theo, cái giá quá lớn cho một kênh báo phụ. Thay vào đó: log `error 'chat webhook config invalid' {code: 'CHAT_WEBHOOK_URL_INVALID'}` một lần (không log giá trị), coi như `off`. Bước kiểm sau deploy của OPS (tìm `ERROR [`) sẽ bắt được dòng log này.
- Khi `off`: bộ phát vẫn chạy và chuyển các dòng `staff.chat` tới hạn sang `done`, `last_error = 'SKIPPED_DISABLED'`, chỉ log `info`. Outbox không phình (khác với `staff.push`), và lúc bật lên không xả tin cũ.
- Khi gửi: dựng URL từ bản đã kiểm, chỉ nối thêm `threadKey`, `messageReplyOption`, `messageId` qua `URLSearchParams`. Dùng `fetch` với `redirect: 'error'`. Container worker đã có mạng `egress`.

## 4. Nhắc lại khi chưa ai xử lý

### 4.1 Đề xuất: **Should**, tái dùng `web_request.sla`

- Job `web_request.sla` đã chạy mỗi tick và đặt `overdue_notified_at` đúng một lần cho mỗi yêu cầu còn `new` tại `reply_by + (web_request_escalate_minutes − web_request_response_minutes)`. Job này đang gửi `website_request_overdue` cho FDL và MGR trong Desk. Chỉ cần thêm `enqueueStaffChat(tx, {kind: 'web_request_overdue', ...})` trong cùng vòng lặp, với `dedupe_key = 'staff.chat:web_request_overdue:<id>'`.
- Mốc thời gian theo BR-912 (2)/(3), không cần tham số mới:
  - Vào trong giờ trực (07:00–22:00): hạn nội bộ 15 phút, **nhắc ở phút 30**, sớm hơn câu hứa công khai 60 phút. ORC đề xuất nhắc sau 1 giờ, nhưng như vậy là lúc lời hứa đã trễ, nên ARC chọn mốc 30 phút đã có sẵn.
  - Vào ngoài giờ trực: `reply_by` = 07:15 sáng hôm sau, **nhắc 07:30**. Tự nằm trong khung 07:00–22:00, không phải viết thêm logic giờ yên lặng.
  - Đến đêm nay (ngày đến = ngày nghiệp vụ): `reply_by` = giờ nhận + 30 phút, nhắc ở phút 45 **kể cả ban đêm**. Đây đúng là trường hợp cần đánh thức người trực (BR-912 (3)).
- Dừng nhắc: "Nhận xử lý" trên Desk chuyển yêu cầu khỏi `new`, nên job không chọn nó nữa. Nếu dòng outbox đã ghi rồi mà người trực bấm nhận trước khi tin được gửi, thì lúc gửi bộ phát thấy yêu cầu không còn `new` và chuyển `SKIPPED_HANDLED`. Mỗi yêu cầu chỉ nhắc **một lần**: không nhắc lặp, vì Desk đã có "Cần chú ý" và tô quá hạn.
- Công thêm khoảng 0,25 ngày (một lệnh gọi, một nhánh render, test). Đề xuất làm cùng v1.0.1. Nếu PO cắt thì phần chính (tin mới) vẫn đủ dùng.

### 4.2 Tin mới gửi lúc đêm

Tin mới **luôn được gửi ngay**, kể cả lúc đêm, để Chat là dòng thời gian đầy đủ. Việc đánh thức hay không do mỗi người tự đặt trong Google Chat (giờ yên lặng của phòng hoặc Không làm phiền). Hướng dẫn cài này nên đưa vào sổ tay (BA/PO). **Could**: hoãn tin mới ngoài giờ trực (trừ yêu cầu đến đêm nay) tới 07:00. Chưa cần làm, vì việc cài trên Google Chat đã giải quyết được.

### 4.3 Could khác

- Tin "Form đã nhận đủ yêu cầu hôm nay, khách mới sẽ thấy báo bận tới 00:00" ở nhánh `SITE_BUSY` (bước 11, đã có `bump` bảo đảm mỗi ngày một lần). Dedupe theo `staff.chat:web_request_cap:<property>:<ngày>`.
- Lọc tin theo `suspicious_flags` (không gửi yêu cầu có cờ `contains_url`): chưa làm, vì cụm "cần xem kỹ" là đủ.

## 5. Phạm vi mã, test, công, rủi ro, phát hành

### 5.1 Tệp và module

| Vai | Tệp | Việc |
|---|---|---|
| INT | `product/integrations/common/safe-config.ts` (+ test) | `parseBookingChatWebhook(env)` → `{mode:'off'} \| {mode:'on', url}` theo mục 3.3 |
| INT | `product/integrations/notification/google-chat.ts` (+ test, máy chủ HTTP giả theo kiểu `fake-smtp.test-support.ts`) | `postChatText(url, text, {threadKey, messageId, timeoutMs})` → `ok \| retryable(code) \| permanent(code)`. Không đưa URL vào lỗi |
| BE | `product/services/api/src/modules/events/public/events.service.ts` | `enqueueStaffChat(tx, input)`: kiểm `kind` thuộc danh sách cho phép, payload chỉ có id |
| BE | `product/services/api/src/modules/public-site/internal/public-booking.service.ts` `store()` | 1 lệnh gọi sau `notify('website_request_new')` |
| BE | `product/services/api/src/modules/public-site/public/worker-jobs.ts` `web_request.sla` | 1 lệnh gọi trong vòng lặp (Should) |
| BE | `product/services/api/src/modules/public-site/public/chat-message.ts` (mới) | `renderWebsiteRequestChat(tx, kind, refId, {timezone, adminBaseUrl, appEnv, now})` → `{text, threadKey} \| skip(code)`. Đặt trong module public-site vì chỉ module này được đọc bảng của mình (module-boundaries) |
| BE | `product/services/api/src/jobs/chat-dispatch.ts` (mới) | `ChatDispatcher`: claim, gửi, finish theo mục 1.4. Renderer được tiêm qua map `kind → render`, giống template email |
| BE | `product/services/api/src/worker.ts` | Dựng bộ phát từ config, log `chat: on/off` lúc khởi động (không log URL), gọi sau email trong `try/catch` riêng |
| BE | `product/services/api/src/config.ts` | Chỉ đọc biến qua `resolveFileSecrets` và gọi INT. Không bắt buộc trong production |
| OPS | `product/infra/docker-compose.prod.yml`, `server/bin/init-secrets.sh`, `ci/check-compose.sh`, `server/env*.example` | Mục 3.2 |
| OPS (sau ngày D) | `product/infra/server/bin/ops-check.sh` | Kiểm `chat_dead` (mục 1.4) |
| PO/BA | `product/docs/release-notes.md`, sổ tay, `integrations.md` | Dòng v1.0.1, cách cài thông báo phòng Chat, "Desk vẫn là nguồn chính" |

Không đổi OpenAPI, không đổi Desk (FE), không đổi landing. Không có **migration**: không đổi bảng, không thêm tham số `config_parameter`.

### 5.2 Test cần có

**Unit**
1. URL webhook, test dạng bảng: nhận URL chuẩn. Từ chối `http:`, host khác, `chat.googleapis.com.evil.test`, `evil.test/chat.googleapis.com`, có userinfo, có cổng, IP, sai path, thiếu `key`/`token`, quá dài. Rỗng thì `off`.
2. Client Chat (máy chủ HTTP giả): 200 → ok. 429/500/503/timeout/ECONNRESET → retryable. 400/403/404 → permanent. 302 → lỗi, không theo. Thông điệp lỗi và log **không chứa** `chat.googleapis`, `key=`, `token=`.
3. Render: ngắn ngày, dài hạn, không rõ thời gian ở, đến đêm nay, có trẻ em hoặc trẻ dưới 2 tuổi, có cờ nghi ngờ, staging có tiền tố, múi giờ `Asia/Ho_Chi_Minh` qua nửa đêm. Đưa vào một dòng có đủ tên, SĐT, email, ghi chú: chữ đầu ra **không** chứa giá trị nào trong số đó. Câu SQL của renderer không chứa tên cột C2 (khóa tĩnh).

**Tích hợp (DB thật)**

4. `createWebsiteBookingRequest` hợp lệ tạo đúng 1 dòng `staff.chat`, payload chỉ có `kind/refType/refId`. Replay cùng Idempotency-Key vẫn 1 dòng. Honeypot, quá 3 lần/ngày cùng liên hệ, 422, 429 và `SITE_BUSY` đều 0 dòng (hoặc 1 dòng cap nếu làm Could). Giao dịch lỗi sau INSERT thì 0 dòng.
5. `web_request.sla`: tới mốc thì có 1 dòng `web_request_overdue`, tick sau 0 dòng. Đã "Nhận xử lý" thì 0 dòng.
6. `ChatDispatcher` với máy chủ giả: chuyển `done` và có `dispatched_at`. 500 rồi 200 → `failed` rồi `done`, `attempts = 2`. 404 → `dead` ngay. Hết 6 lần thử → `dead`. Lease hết hạn thì dòng được lấy lại. Vượt ngân sách → `deferred`, không tính một lần thử. `off` → `SKIPPED_DISABLED`. Dòng quá 12 giờ → `SKIPPED_STALE`. Yêu cầu đã nhận trước khi gửi nhắc lại → `SKIPPED_HANDLED`. Yêu cầu bị đánh spam hoặc đã purge → `SKIPPED_GONE`. Log của cả bộ test không chứa URL hay token.

**Chỉ worker (như PR #14, `test/helpers/worker-only-child.ts`)**

7. Tiến trình con chỉ nạp những gì `src/worker.ts` nạp (không nạp `*.module.ts`): dựng được `ChatDispatcher`. `run-job web_request.sla` ghi được dòng `staff.chat`, không gặp `AuditEntityNotRegisteredError` và không có `job failed`. Thêm lệnh `run-chat-dispatch` chạy một lượt bộ phát với máy chủ giả rồi trả kết quả `RESULT`. Test **phải đỏ** nếu `chat-message.ts` chỉ được đăng ký trong `public-site.module.ts`.
8. Khởi động worker với tệp bí mật rỗng thì log `chat: off`. Với URL sai thì log `CHAT_WEBHOOK_URL_INVALID`, còn các job khác vẫn chạy (kiểm job `public_site.cleanup` có `done`).

**Hạ tầng**

9. `check-compose.sh`: worker có `booking_request_chat_webhook`, api và web không có. Biến dạng thường bị từ chối.

**Staging (QA, phòng Chat thử riêng)**

10. Gửi form trên staging → tin tới trong ≤ 2 phút, chữ đúng mẫu, có `[staging]`, link mở được Desk staging. Xóa webhook của phòng thử → `dead` + log error, không lặp. Kiểm `threadKey` và `messageId` theo mục 1.4.

### 5.3 Ước lượng công

| Vai | Việc | Công |
|---|---|---|
| INT | Kiểm URL + client Chat + test 1–2, kiểm `threadKey`/`messageId` trên phòng thử | 0,25 |
| BE | Enqueue, 2 điểm phát, renderer, dispatcher, worker, test 3–8 | 1,5 |
| OPS | Bí mật, compose, init-secrets, check-compose, env example (trước v1.0.1). `ops-check` `chat_dead` (sau D) | 0,25 |
| QA | Test 10 + hồi quy form và `web_request.sla` | 0,5 |
| SEC | Review thiết kế + diff | 0,25 |
| **Tổng** | | **khoảng 2,75 công**, vừa trong v1.0.1 nếu bắt đầu 31/10 |

### 5.4 Rủi ro

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | Thêm bí mật mới: `deploy.sh` từ chối deploy khi thiếu tệp bí mật | Trung bình (chặn deploy v1.0.1 nếu quên) | OPS chạy `init-secrets.sh` trên **cả hai** stack trước lượt deploy v1.0.1, ghi vào runbook. Tệp rỗng là đủ để deploy |
| R2 | URL webhook bị lộ thì người ngoài đăng được tin hoặc link lừa vào phòng nhân viên | Trung bình | Tệp 0400, chỉ worker đọc, không log. Nhân viên chỉ mở link `desk.ottimo.vn` (ghi vào sổ tay). Thu hồi bằng cách xóa webhook trong Chat rồi tạo cái mới |
| R3 | Người trực coi Chat là nguồn chính, Chat lỡ tin thì bỏ sót khách | Trung bình | Desk vẫn là nguồn chính ("Cần chú ý", tô quá hạn). `chat_dead` báo về phòng OPS. Sổ tay ghi rõ |
| R4 | Staging đăng nhầm vào phòng thật | Thấp | Thư mục bí mật riêng, staging rỗng hoặc phòng thử, có tiền tố `[staging]` |
| R5 | Workspace admin chưa cho người dùng thêm webhook ("incoming webhooks") | Thấp | INV, là quản trị Workspace @ottimo.vn, bật trong Admin console (mục 6). Không mất phí |
| R6 | Gửi đôi khi tiến trình chết giữa chừng | Thấp | Dùng `messageId` nếu được. Nếu không thì chấp nhận |
| R7 | Trễ tới khoảng 1–2 phút vì tick 60 s | Thấp | Đủ cho hạn nội bộ 15 phút. Nếu cần nhanh hơn thì để R4+ (LISTEN/NOTIFY) |
| R8 | Tin lúc đêm đánh thức chủ hoặc người trực | Thấp | Giờ yên lặng trên Google Chat (mục 4.2) |

### 5.5 Phát hành

- **Đề xuất: gộp vào v1.0.1 (04/11), không làm hotfix `v1.0.0 → v1.0.1` riêng.** Lý do:
  1. Theo protocol mục 9, hotfix ngoài chu trình chỉ dành cho P0. Việc này là tính năng nhỏ và đã có cách tạm (Desk luôn mở 07:00–22:00).
  2. Cần một bí mật mới trên máy chủ, nghĩa là có thao tác OPS và INV dán URL. Cũng cần SEC review, CI, staging với phòng thử, và INV duyệt production. Một lượt riêng tốn gần bằng chính v1.0.1.
  3. Số `v1.0.1` đã dành cho các bản sửa BUG-R3-032/041/042/043… Một hotfix chen trước sẽ phải đánh số lại hoặc tách nhánh.
  4. Form trên ottimo.vn **chưa bật** trên production (FE-B rà điều kiện, QA chạy đầu-cuối mục 21, Release landing, OWN bật công tắc). Khi chưa có yêu cầu thật thì chưa mất gì.
- **Thứ tự đề xuất cho ORC/PO**: v1.0.1 (có Chat) lên production → INV dán URL webhook → QA gửi một yêu cầu thử (không dữ liệu thật) và thấy tin → bật form. Nếu INV muốn bật form trước 04/11 thì áp cách tạm đã chốt và chấp nhận chỉ có thông báo trong Desk.
- Có thể làm sớm hơn nếu cần: đưa vào rc đầu tiên của v1.0.1. Thiết kế độc lập với các bản sửa khác, không đụng migration.

## 6. Câu hỏi

**SEC**
- S1. Xác nhận danh sách trường ở mục 2.1–2.2 (mã yêu cầu, ngày đến, số đêm hoặc tháng, số khách theo nhóm tuổi, loại lưu trú, giờ nhận, hạn phản hồi, link Desk có UUID, cụm "cần xem kỹ") không phải dữ liệu cá nhân theo ESC-002 A / NĐ 13, nên **không cần ESC mới**. Ý của ARC: không trường nào nhận diện được người khi đứng ngoài DB của OTTIMO.
- S2. Đồng ý giữ URL webhook ở dạng bí mật tệp chỉ worker đọc, cùng cách kiểm URL ở mục 3.3? Có cần thêm điều kiện không (ví dụ xoay URL định kỳ)?
- S3. Nếu PO muốn thêm hạng phòng khách chọn vào tin thì có được không?

**PO**
- P1. Nhắc lại ở **mốc 30 phút** của BR-912 (2) (ngoài giờ là 07:30, đến đêm nay là phút 45) thay cho mốc "1 giờ" ORC nêu: đồng ý không? Có đưa nhắc lại vào phạm vi v1.0.1 (Should) không?
- P2. Thứ tự bật form: đợi v1.0.1 có Chat (ARC đề xuất), hay bật trước với cách tạm Desk luôn mở?
- P3. Mỗi yêu cầu chỉ nhắc một lần (ARC đề xuất) hay nhắc lặp cho tới khi có người nhận?

**INV** (không có chi phí mới, không cần ESC; ORC chuyển lời)
- I1. Tạo phòng Google Chat "OTTIMO – Yêu cầu đặt phòng" (chủ và người trực). Nếu Admin console đang tắt thì bật "cho phép webhook đến". Tạo một webhook tên "Desk OTTIMO". **Không gửi URL qua chat.** OPS sẽ hướng dẫn dán URL trên máy chủ bằng dấu nhắc ẩn.
- I2. Tạo thêm một phòng thử (chỉ INV và đội) cho staging. Hoặc đồng ý để staging tắt Chat, khi đó QA kiểm bằng máy chủ giả, nhưng mất phần kiểm `threadKey`/`messageId` thật.

## 7. Ngoài phạm vi (ghi để không nhầm)

- Không sửa `staff.push` (BUG-R3-041) và không sửa thư "Security notice" (BUG-R3-032). Bộ phát Chat chỉ claim `topic = 'staff.chat'`.
- Không gửi các loại thông báo khác (hold quá hạn, J15…) qua Chat. Muốn thêm thì chỉ cần thêm `kind` và renderer, nhưng mỗi loại phải qua SEC duyệt dữ liệu trước.
- Không có Google Chat app hay bot hai chiều (bấm "Nhận xử lý" từ Chat): việc đó cần OAuth và Chat API, để sau R4 nếu cần.
