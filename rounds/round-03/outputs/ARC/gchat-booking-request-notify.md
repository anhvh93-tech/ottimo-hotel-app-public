# ARC – Báo yêu cầu đặt phòng website vào Google Chat (thiết kế ngắn)

- Round 3 · Bước: Sản xuất (thiết kế nhỏ sau `v1.0.0` = `8b3aec8`) · Tác giả: ARC · Ngày 30/10/2026
- Nguồn: decision-log 30/10 (INV "đăng tin vào google chat nha"), ORC bổ sung (phòng riêng, biến môi trường riêng), US-155, BR-912, ESC-002 A, BUG-R3-032, BUG-R3-041.
- Người review bắt buộc: SEC (dữ liệu ra dịch vụ ngoài, bí mật webhook), BE (khả thi). Khuyến nghị: OPS (bí mật, compose), INT (client HTTP Google Chat).
- Trạng thái: đề xuất, chưa có mã. Không đổi API contract công khai và không đổi chữ cho khách.
- **Lượt 2 (30/10, Phản hồi & sửa):** áp quyết định INV 30/10 ("Thêm cả hai", ESC-041 = C, C chạy ngay từ v1.0.1) và SEC (FB-R3-SEC-ARC-GCHAT-01/02, `outputs/SEC/esc041-gchat-full-details.md` ★1–★8). **Chỗ nào Lượt 2 khác mục 0–7 thì Lượt 2 thắng** – xem mục 8 cuối tệp. Mục 0–7 giữ nguyên để đối chiếu.

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

---

## 8. Lượt 2 – Phản hồi & sửa (30/10/2026)

Nguồn:
- decision-log 30/10: INV "Thêm cả hai"; INV ESC-041 = C; INV "C không cần chờ" (mức C ngay từ v1.0.1, thông báo version mới phát hành cùng v1.0.1); SEC ESC-041 C.
- `02-escalations/ESC-041.md`; `reviews/SEC-on-us155-enable.md` mục 4 (FB-R3-SEC-ARC-GCHAT-01, -02); `outputs/SEC/esc041-gchat-full-details.md` (★1–★8, N1–N6); `qa/qa3-rc1.md` mục 21.1.
- Đọc lại mã `main`: `public-booking.service.ts` (kiểm `guestName`/`note` lúc nhận, `validate` kiểm `consentVersion`), `website-request-rules.ts` (`replyPlan`, `CALL_WINDOW`, `looksLikeIdNumber`, `looksLikeCard`, `containsUrl`), `public/worker-jobs.ts` (`web_request.sla`, `web_request.purge`), `website-requests.service.ts` (WR8 `erase`), migration `0086` (`consent_version` FK tới `privacy_notice_version`, cột `published_at`).

### 8.0 Kết luận nhanh – thay mục 0 ở những dòng sau

| Câu | Lượt 1 | Lượt 2 (chốt) |
|---|---|---|
| Nội dung | Thông tin chuyến đi, không PII | **Cấu hình được theo mức A / B / C** (8.2). Thiếu hoặc sai cấu hình → **A**. Giá trị mục tiêu trên production v1.0.1 là **C** (INV) |
| Chặn theo thông báo | – | Chi tiết (B/C) chỉ gửi cho yêu cầu khách gửi theo thông báo **`2026-10-31`** trở đi (SEC ★2). Yêu cầu theo `2026-10-24` luôn ra mẫu A, dù cấu hình là C (8.3) |
| Ai đổi mức | – | Biến môi trường của worker `BOOKING_REQUEST_CHAT_DETAIL_LEVEL`, OPS đặt trong `.env` máy chủ, khởi động lại worker. **Không** có công tắc trên Desk, không `config_parameter`, không API |
| Tin quá hạn | Should | **Must** (INV). Mốc BR-912 (2) giữ nguyên |
| Ngoài giờ trực | Tin mới gửi ngay; nhắc 07:30 "tự nhiên" qua `reply_by` | Tin mới **gửi ngay** (Must). Nhắc buổi sáng là **kind riêng** `web_request_morning` lúc 07:30. Lý do: kênh `phone` đẩy `reply_by` tới 08:15 (`CALL_WINDOW` 08:00), nên mốc quá hạn cũ rơi vào 08:30 chứ không phải 07:30 (8.4) |
| Xóa theo yêu cầu (WR8), hạn lưu | – | Webhook **không xóa được tin**. Điều kiện chạy C: phòng **tắt lịch sử** (tin tự xóa sau 24 giờ, SEC ★1). Thêm tin báo "đã xóa" trong luồng + xóa tay ngay nếu được. Phương án dự phòng (Chat app tự xóa tin) có ước lượng riêng (8.6) |
| Chữ khách nhập | – | Làm sạch theo SEC ★5: vô hiệu `<`/`>`, link, tên miền, backtick; lời nhắn trong khối mã; cắt độ dài; dòng "Mở Desk" luôn cuối (8.5) |
| Migration | Không | **Vẫn không** |
| Công | ≈ 2,75 | **≈ 5,75 công** tính năng (Must + Should), cắt được ≈ 0,75. Việc kèm (thông báo, landing) ≈ 0,85. Dự phòng ★1 cách 3 nếu cần: +2,5–3 công (8.9) |
| Phát hành | v1.0.1 | Vẫn v1.0.1 (04/11), thứ tự triển khai ở 8.8. Đặt C ngay ở lượt deploy nếu ★1, ★4, ★7 xong trước; nếu chưa thì deploy với A rồi đổi `.env` sau. Lịch BE căng (R11) |

### 8.1 Các kind của topic `staff.chat`

| Kind | Khi nào ghi outbox | Điểm phát | Nội dung | Dedupe key | Ưu tiên |
|---|---|---|---|---|---|
| `web_request_new` | Yêu cầu mới được tạo (mọi giờ, kể cả 22:00–07:00) | `PublicBookingService.store()` (như Lượt 1) | Theo **mức hiệu lực** A/B/C (8.2, 8.3) | `staff.chat:web_request_new:<id>` | Must |
| `web_request_overdue` | Cùng lúc `web_request.sla` đặt `overdue_notified_at` | `web_request.sla` (như Lượt 1) | Luôn mẫu A | `staff.chat:web_request_overdue:<id>` | **Must** |
| `web_request_morning` | 07:30, yêu cầu tới trong ca đêm vừa qua và vẫn `new` (8.4) | `web_request.sla`, nhánh thứ hai | Luôn mẫu A | `staff.chat:web_request_morning:<id>` | **Must** (mới) |
| `web_request_erased` | WR8 `erase` thành công, và tin `web_request_new` của yêu cầu đó đã đăng | Nhánh `erase` trong `website-requests.service.ts`, cùng giao dịch | Chỉ mã + câu nhắc (8.6) | `staff.chat:web_request_erased:<id>` | Should |

- Tin nhắc lại (overdue, morning, erased) **luôn mẫu A**, trả lời trong luồng của tin đầu (`threadKey = requestId`). Chi tiết khách chỉ đi **một lần**, ở tin đầu (SEC ★6).
- `enqueueStaffChat` ném lỗi khi gặp kind ngoài danh sách cho phép (như Lượt 1). Bộ phát vẫn chỉ claim `topic = 'staff.chat'`.
- Quy tắc bỏ qua lúc gửi giữ như mục 1.4, có hai chỉnh:
  - `SKIPPED_GONE` (đã spam, đã xóa, đã `pii_purged_at`) **không áp** cho `web_request_erased`;
  - `SKIPPED_HANDLED` áp cho `web_request_overdue` và `web_request_morning` khi yêu cầu không còn `new` hoặc đã có `assigned_user_id`.

### 8.2 Mức nội dung A / B / C

Theo ESC-041. Mức được đọc **lúc gửi**, không phải lúc ghi outbox. OPS hạ C → A thì các tin chưa gửi ra mẫu A ngay sau khi khởi động lại worker.

| Mức | Trường trong tin `web_request_new` | Cột renderer được đọc |
|---|---|---|
| **A – tối thiểu** (mẫu SEC 4.1) | mã; giờ nhận (thêm "ngoài giờ trực" nếu có); hạn phản hồi; mức gấp "cần gọi ngay"; "cần xem kỹ"; link Desk; `[staging]` | Không có cột C2. Được đọc `arrival_date` chỉ để tính mức gấp, không in ra |
| **B – thêm chuyến đi** | A + ngày đến (và ngày đi nếu có); số đêm hoặc số tháng; người lớn / trẻ em / trẻ dưới 2 tuổi; ngắn ngày hoặc theo tháng | Như A, thêm `departure_date, stay_kind, stay_months, adults, children, infants` |
| **C – đầy đủ** | B + tên khách; liên hệ (SĐT E.164 **hoặc** email, đúng cái khách đã nhập); kênh liên hệ ưu tiên; lời nhắn (đã làm sạch, 8.5) | Như B, thêm **chỉ** `guest_name, phone_e164, email, preferred_channel, note` |

- Không mức nào gửi: `decline_note`, `contact_hmac`, `ip_hmac`, UTM, trang giới thiệu, `room_type_slug`, tên cờ nghi ngờ (khớp câu thông báo SEC 1.2 (2) và ghi chú luật sư: "tên, số điện thoại hoặc email, kênh, lời nhắn"; không có hạng phòng, câu hỏi Q4).
- Form chỉ cho **một** liên hệ: kênh `email` thì không có SĐT, các kênh khác thì không có email. Mức C in đúng liên hệ đó.

Mẫu tin (dữ liệu minh họa, không phải khách thật). Thứ tự dòng cố định; **dòng "Mở Desk" luôn là dòng cuối** (SEC ★5 ý 5), để tin cắt ngắn trên điện thoại vẫn còn mã, giờ, hạn ở đầu.

Mức A:

```
Yêu cầu đặt phòng mới · REQ-7K3P9QXA
Nhận lúc 23:40 (ngoài giờ trực) · hạn phản hồi 07:15
Mở Desk: https://desk.ottimo.vn/website-requests/<requestId>
```

Mức C (mức B = bỏ ba dòng `Khách`, `Liên hệ`, `Lời nhắn`):

````
Yêu cầu đặt phòng mới · REQ-7K3P9QXA
Nhận lúc 23:40 (ngoài giờ trực) · hạn phản hồi 07:15
Đến 06/11 – đi 09/11 · 3 đêm · Ngắn ngày
2 người lớn, 1 trẻ em
Khách: Tran Thi Mau
Liên hệ: +84900000000 · kênh: Zalo
Lời nhắn:
```
Cho mình hỏi có chỗ đậu xe máy không ạ.
```
Mở Desk: https://desk.ottimo.vn/website-requests/<requestId>
````

- Dài hạn: `Đến 01/12 · 3 tháng · Theo tháng`. Không rõ thời gian ở: `Đến 06/11 · chưa rõ thời gian ở`.
- Không có lời nhắn: bỏ cả khối `Lời nhắn`.
- Nhãn kênh cố định (Zalo, WhatsApp, Telegram, Viber, Điện thoại, Email), không in giá trị thô.
- SĐT in nguyên E.164, không định dạng lại (tránh lỗi kiểu BUG-R3-049).

**Tách mã để mẫu A/B không bao giờ chạm cột C2.** Luật Lượt 1 "SQL renderer không có cột C2" không còn giữ được, vì mức C phải đọc chúng. Thay bằng:
- `renderWebsiteRequestChat` đọc một câu **cơ sở** không chứa cột C2. Giữ khóa tĩnh như Lượt 1 test 3.
- Chỉ khi mức hiệu lực = C mới gọi hàm thứ hai `readChatContact(tx, id)`, câu SQL chỉ chọn đúng 5 cột ở bảng trên.
- Test khóa (SEC ★6):
  - mức A, B và mọi yêu cầu bị chặn theo 8.3: `tx.query` không bao giờ nhận câu có `guest_name|phone_e164|email|note|preferred_channel` (spy);
  - câu `readChatContact` không bao giờ có `decline_note|contact_hmac|ip_hmac` (khóa tĩnh).
- Outbox vẫn chỉ giữ id ở mọi mức. Chữ dựng lúc gửi rồi bỏ, không lưu, không log.

### 8.3 Cấu hình mức và chặn theo phiên bản thông báo

**Cấu hình mức** (SEC ★3). ARC chọn **biến môi trường**, không chọn `config_parameter`: INV muốn không có công tắc trên Desk, mà `config_parameter` thì sửa được qua Desk/API.

| Biến | Giá trị | Không đặt / sai |
|---|---|---|
| `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` | `A` \| `B` \| `C` (sau `trim().toUpperCase()`) | Không đặt → `A`. Sai → `A` + log `error 'chat config invalid' {code:'CHAT_DETAIL_LEVEL_INVALID'}` một lần, không chặn worker |

- Chỉ worker nhận biến này. Api và web không nhận.
- Đây không phải bí mật, nên ở trong `.env`, không cần tệp bí mật.
- Lúc khởi động, worker log một lần `info 'chat detail level' {level}` và `chat: on|off`. Không log URL.

**Chặn theo phiên bản thông báo** (SEC ★2). Mức hiệu lực của một yêu cầu = mức cấu hình, **trừ khi** khách gửi yêu cầu theo thông báo cũ hơn thông báo nêu Google Chat. Khi đó mức hiệu lực là A.
- Hằng trong mã `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-10-31'` (đúng số SEC chốt; SEC chốt chữ ngày khác thì BE đổi hằng trước khi gắn tag). Dùng hằng, không dùng biến môi trường, để OPS không thể cấu hình sai điều kiện này.
- So sánh bằng `published_at` trong `privacy_notice_version`, không so chuỗi (so chữ thì `.10` đứng trước `.2`):
  - lấy `published_at` sớm nhất của phiên bản hằng (cùng tổ chức, mọi ngôn ngữ);
  - lấy `published_at` của `consent_version` + `locale` của yêu cầu (FK đã có, migration 0086);
  - nhỏ hơn → A.
- Phiên bản hằng **chưa có trong bảng** (landing chưa phát hành hoặc OPS chưa chạy `publish-privacy-notice.sh`) → mọi yêu cầu ra mẫu A. Đây là trạng thái bình thường trong lúc triển khai, chỉ đếm `levelCapped` trong log `info 'chat dispatch'`.
- Hệ quả:
  - Yêu cầu từ lúc bật form (31/10) tới khi landing mới lên đều ra mẫu A, kể cả tin nhắc lại của chúng.
  - Trang landing cũ còn trong bộ nhớ đệm của khách vẫn hợp lệ thêm 7 ngày (`superseded_at` + 7 ngày, kiểm trong `PublicBookingService.validate`). Các yêu cầu đó cũng tự ra mẫu A.
  - Landing và api phát hành lệch ngày nhau cũng không làm lộ dữ liệu.

**Đổi mức sau này** (ví dụ hạ về A): OPS sửa `.env` production (báo INV trước khi sửa, theo luật đã có), chạy `docker compose up -d worker`, kiểm dòng log `chat detail level`. Mức mới áp cho mọi tin chưa gửi. Tin đã đăng không sửa được (8.6).

### 8.4 Quá hạn và nhắc buổi sáng

**Quá hạn** (`web_request_overdue`, Must): giữ đúng đường Lượt 1 mục 4.1. Mốc = `reply_by + (escalate − response)`:

| Yêu cầu tới lúc | Mốc quá hạn (mặc định 15/30 phút) |
|---|---|
| Trong giờ trực | Phút 30 sau khi nhận |
| Ngoài giờ, đến đêm nay (`call_now`) | Phút 45, **kể cả ban đêm** |
| Ngoài giờ, kênh khác `phone` | 07:30 |
| Ngoài giờ, kênh `phone` | 08:30 (`CALL_WINDOW` bắt đầu 08:00) |
| 21:00–22:00, kênh `phone` | 08:30 hôm sau |

**Nhắc buổi sáng** (`web_request_morning`, Must, mới): để mọi yêu cầu ban đêm còn bỏ ngỏ đều được nhắc đúng 07:30, như INV nói.
- **Ca đêm vừa qua** = từ `front_desk_hours.to` hôm qua tới `front_desk_hours.from` hôm nay, theo múi giờ property.
- Mốc nhắc = `front_desk_hours.from + web_request_escalate_minutes`, tức 07:30 với mặc định. Không thêm tham số.
- Đây là nhánh thứ hai trong `web_request.sla`, chạy **sau** nhánh quá hạn trong cùng handler. Điều kiện:
  - giờ địa phương ≥ mốc nhắc và < `front_desk_hours.to`;
  - yêu cầu `status = 'new'`, `assigned_user_id IS NULL`, `pii_purged_at IS NULL`, `created_at` thuộc ca đêm vừa qua;
  - **bỏ qua** nếu `overdue_notified_at >= front_desk_hours.from hôm nay`. Đây là trường hợp tin quá hạn vừa đăng sáng nay (thường đúng 07:30 với kênh khác `phone`); bỏ qua để không có hai tin cùng lúc.
- Ghi outbox với `ON CONFLICT (dedupe_key) DO NOTHING`, nên chạy mỗi tick vẫn chỉ ra một tin. Không cần cột đánh dấu, không migration. Số dòng quét tối đa bằng trần yêu cầu mỗi ngày.
- Worker ngừng lúc 07:30 và chạy lại lúc 10:00 thì vẫn nhắc, nếu yêu cầu còn `new`. Sau `front_desk_hours.to` thì không nhắc nữa.
- Yêu cầu "cần gọi ngay" đã có tin quá hạn ban đêm vẫn được nhắc buổi sáng nếu còn `new`.

Một yêu cầu ban đêm còn bỏ ngỏ nhận các tin sau, tất cả trong một luồng, nhiều nhất 3 tin:
1. Tin mới, gửi ngay, có chi tiết theo mức hiệu lực.
2. Nếu cần gọi ngay: tin quá hạn ở phút 45, ban đêm.
3. 07:30: tin nhắc buổi sáng, hoặc tin quá hạn (kênh khác `phone`).
4. Kênh `phone`: thêm tin quá hạn lúc 08:30.

Mẫu tin nhắc (mẫu A):

```
Chưa có người nhận · REQ-7K3P9QXA
Nhận lúc 23:40 (ngoài giờ trực) · hạn phản hồi 07:15
Mở Desk: https://desk.ottimo.vn/website-requests/<requestId>
```

Tin quá hạn đổi dòng 2 thành `· đã quá hạn phản hồi 07:15` (như Lượt 1).

**Để chủ đầu tư thấy.** Chủ đầu tư là thành viên phòng (SEC ★4).
- Should: tin quá hạn và tin buổi sáng mở đầu bằng `<users/all>`, để mọi thành viên nhận thông báo kể cả khi đặt phòng ở chế độ "chỉ khi được nhắc tên".
- Đây là cú pháp do mã đặt. Chữ khách nhập không thể tạo ra nó (8.5).
- INT kiểm webhook có nhận cú pháp này không. Không được thì bỏ, phần còn lại không đổi. PO quyết (Q5).

### 8.5 Mức C: xử lý tên, liên hệ, lời nhắn (SEC ★5)

Tên và lời nhắn do người ngoài gõ, rồi đi vào phòng nhân viên tin tưởng. Phải coi là **dữ liệu không tin cậy**: có thể chứa link lừa, cú pháp nhắc tên, cú pháp link mang chữ giả, hoặc số giấy tờ.

**Đã có lúc nhận form** (mã `main`, không đổi):
- `note` ≤ 500 ký tự, `guestName` ≤ 80, qua `normalizeFreeText`;
- có dãy giống số thẻ (`looksLikeCard`, Luhn) → 422 `CARD_NUMBER_DETECTED`;
- có số giống CCCD, CMND hay hộ chiếu (`looksLikeIdNumber`; SR-LOG-04, ARC-08, BUG-R3-009) → 422 `ID_NUMBER_DETECTED`.

Bộ lọc số giấy tờ là hai hàm này. "FB-05" trong dự án là chuyện khác: thẻ DATA về `confirmed_at`/`ota_booked_at`, và thẻ gợi ý của PR #15.

**Lúc dựng tin**: hàm mới `chatSafeText(text, {maxChars, singleLine})` trong `chat-message.ts`, áp cho tên và lời nhắn, chạy theo thứ tự:
1. **Chạy lại** `looksLikeCard` và `looksLikeIdNumber`, phòng dòng cũ hoặc bộ lọc đổi về sau. Trúng thì thay **cả trường** bằng `(có dãy số giống giấy tờ hoặc thẻ – xem trên Desk)`.
2. Bỏ ký tự điều khiển và ký tự đổi hướng chữ (U+202A–202E, U+2066–2069, U+200E/F). Giữ `\n` cho lời nhắn. Tên gộp thành một dòng. Lời nhắn gộp dòng trống, tối đa 8 dòng.
3. Vô hiệu cú pháp Google Chat:
   - `<` → `‹`, `>` → `›`: chặn `<users/all>`, `<users/…>`, `<url|chữ>`;
   - bỏ dấu backtick, để không thoát được khỏi khối mã.
4. Vô hiệu link và tên miền: `://` → `[:]//`, dấu chấm trong cụm dạng tên miền → `[.]` (dùng cùng mẫu với `containsUrl`). Yêu cầu có cờ `contains_url` thì dòng `Lời nhắn:` thêm `(có link – không bấm, xem trên Desk)`.
5. Cắt theo code point, không cắt đôi ký tự ghép: tên ≤ 80, lời nhắn ≤ **500**. Phần bị cắt thay bằng `… (xem đủ trên Desk)`.
6. Đặt lời nhắn trong khối mã ` ``` `, để Chat hiện nguyên chữ, không đổi kiểu chữ, không tự tạo link. Tên nằm sau nhãn cố định `Khách:` và chỉ một dòng, nên không giả được dòng hệ thống.

Liên hệ:
- SĐT đã qua `normalizePhone` (E.164). Email đã qua kiểm định dạng.
- Email vẫn đi qua bước 3 (`<`/`>`), nhưng **không** qua bước 4 (vô hiệu tên miền), để người trực đọc đúng địa chỉ. Email chứa tên miền nên Chat có thể tự biến nó thành link `mailto:`. INT kiểm; nếu có thì chấp nhận, vì `mailto:` không mở trang web. SEC xác nhận ở Q3.

Thân tin ≤ 4 KB: mức C lớn nhất khoảng 2 KB (tên 80 + lời nhắn 500 ký tự tiếng Việt).

Không bao giờ log chữ tin, ở mọi mức và mọi cấp log (như Lượt 1). Test dùng giá trị canh (canary) cho tên, SĐT, email, lời nhắn, rồi kiểm toàn bộ log của bộ test không chứa các giá trị đó.

### 8.6 Xóa theo yêu cầu (WR8) và hạn lưu – giới hạn và cách làm

**Giới hạn** (nêu rõ để không hứa sai):
- Webhook đến của Google Chat **chỉ đăng được tin**: không sửa, không xóa.
- Muốn máy tự xóa tin thì phải có một Chat app gửi bằng tài khoản dịch vụ và Chat API. Thiết kế Lượt 1 không có phần này (mục 7).
- Vì vậy WR8 `erase` (xóa C2 ngay) và `web_request.purge` (xóa C2 theo hạn lưu) chỉ xóa trong DB. **Bản sao tên, liên hệ, lời nhắn trong tin Chat mức C vẫn còn** cho tới khi Google xóa theo cài đặt phòng, hoặc có người xóa tay.
- Mặc định Google Chat giữ tin vô thời hạn. Nếu để vậy, câu "xóa chậm nhất 180 ngày" và "xóa khi rút đồng ý" trong thông báo sẽ thành sai (SEC ★1).

**Cách làm** – SEC ★1 là **Blocker cho C**. Xóa tay không được là cách duy nhất.

1. **Tắt lịch sử phòng** (ARC và SEC đề xuất): tin tự xóa sau 24 giờ, và INV khóa trong Admin console để thành viên không bật lại được. Desk vẫn là nguồn chính, nên mất tin cũ trong Chat không làm mất việc. INT kiểm trên phòng thử 3 điều:
   - tin do webhook đăng có bị xóa sau 24 giờ;
   - luồng trả lời (`threadKey`) vẫn chạy khi lịch sử tắt;
   - quản lý phòng xóa được tin do webhook đăng.
2. Không tắt được lịch sử → quy tắc lưu giữ Google Vault ≤ 7 ngày. Vault chỉ có ở một số gói Workspace. Phải nâng gói thì là chi phí: ORC mở ESC, chưa bật C.
3. Dự phòng, nếu 1 không được và INV không muốn tốn tiền cho 2: đổi webhook sang **Chat app** gửi bằng tài khoản dịch vụ. Một job mỗi ngày xóa tin của chính app sau 7 ngày (`spaces.messages.delete`).
   - Lưu `name` của tin do Google trả về vào `payload` của dòng outbox sau khi gửi. Đây không phải dữ liệu khách. Không cần migration.
   - Thêm bí mật dạng tệp (khóa JSON tài khoản dịch vụ, chỉ worker đọc) và một Google Cloud project (miễn phí). Bỏ được bí mật URL webhook.
   - Ước lượng ở 8.9. ARC sẽ viết thiết kế chi tiết **chỉ khi** INT báo cách 1 không được.

**Thêm, cho WR8** (SEC N1):
- Tin báo trong luồng `web_request_erased` (Should). Khi `erase` thành công và tin đầu của yêu cầu đã đăng, đăng trả lời trong luồng: `Đã xóa dữ liệu của REQ-7K3P9QXA theo yêu cầu của khách. Quản lý phòng xóa tin đầu của luồng này nếu còn.` Không có PII.
- Xóa tay: nếu quản lý phòng xóa được tin của webhook, người làm WR8 (OWN, MGR hoặc FDL) báo quản lý phòng xóa ngay. Nếu không xóa được thì tin tự mất sau 24 giờ (cách 1). BA ghi vào sổ tay, ngay sau bước bấm Xóa trên Desk.
- Bản sao trong sao lưu của Google nằm ngoài tầm OTTIMO (SEC RR2). Thông báo không hứa gì về phần này.

### 8.7 Điều kiện SEC – áp vào thiết kế

**FB-R3-SEC-ARC-GCHAT-02** (SEC-on-us155-enable 4.2) và **★1–★8** (esc041-gchat-full-details 3.1):

| Ý SEC | Áp thế nào | Ai |
|---|---|---|
| G1. Query trong tệp bí mật chỉ có `key` và `token` | Thêm vào luật 3.3: `searchParams` có đúng 2 khóa `key`, `token`, mỗi khóa đúng 1 lần, không rỗng. Khác → không hợp lệ. `threadKey`, `messageId`, `messageReplyOption` chỉ do mã thêm vào lúc gửi, bằng `URLSearchParams.set` trên **bản sao** của URL đã kiểm, không bao giờ ghép chuỗi | INT |
| G2. `init-secrets.sh --set-booking-chat` | `umask 077`; `read -rs`, không echo, không vào lịch sử shell. Kiểm URL bằng **cùng luật** trước khi ghi: gọi lệnh kiểm trong image worker, ví dụ `node dist/tools/check-chat-webhook.js`, đọc từ stdin, trả 0/1, không in URL. Sai → báo "URL không hợp lệ", không ghi. Đúng → ghi tệp tạm cùng thư mục rồi `mv`, chủ uid 1000, quyền 0400, in `chat webhook: set (<độ dài> ký tự)` | OPS (INT viết lệnh kiểm) |
| G3. `ADMIN_BASE_URL` | Worker kiểm lúc khởi động: `https:`, không userinfo, không cổng, path là `/`. Production phải đúng host `desk.ottimo.vn` (danh sách host theo `APP_ENV`, OPS cung cấp cho staging). Sai → Chat `off`, log `error ... CHAT_LINK_BASE_INVALID` | BE |
| G4. Xoay khi có sự kiện | Ghi vào runbook OPS: 3 trường hợp bắt buộc xoay. Cách xoay: INV xóa webhook (cũng là **công tắc tắt khẩn**) → tạo webhook mới → `--set-booking-chat` → khởi động lại worker. Công tắc thứ hai, riêng cho phần PII: hạ `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` | OPS |
| G5. Chống tin giả | Sổ tay và phần mô tả phòng có 3 câu SEC, cộng câu N5: tin thật luôn kết thúc bằng dòng "Mở Desk" tới `desk.ottimo.vn`; lời nhắn của khách nằm trong khung chữ đơn sắc, mọi link trong đó đã bị vô hiệu | BA/PO |
| G6. Thành viên phòng | Theo ★4 bên dưới | INV, BA |
| G7. Staging | Phòng thử riêng hoặc tệp rỗng, không bao giờ URL production. Được đặt C **chỉ khi** webhook trỏ phòng thử và dữ liệu là dữ liệu thử (★3) | OPS, QA |
| ★1 Tin tự xóa | 8.6 | INT kiểm, INV cài đặt |
| ★2 Chặn theo thông báo | 8.3 (hằng `CHAT_DETAILS_MIN_NOTICE_VERSION`) | BE |
| ★3 Cấu hình an toàn | 8.3 (biến môi trường, thiếu hoặc sai → A, log mức lúc khởi động) | BE, OPS |
| ★4 Thành viên, tài khoản | Hướng dẫn I1 cho INV (thay câu "chủ và người trực" ở mục 6):<br>- chỉ tài khoản @ottimo.vn, tắt người ngoài tổ chức;<br>- chỉ OWN, MGR, FDL, FD; không SAL, CTV, HK, MT; không tài khoản dùng chung;<br>- bắt buộc xác minh 2 bước;<br>- trong phòng không có app hay webhook nào khác ngoài "Desk OTTIMO";<br>- gỡ người nghỉ việc cùng lúc khóa Desk; OWN rà thành viên mỗi tháng | INV, OPS (runbook), BA (checklist nghỉ việc) |
| ★5 Chống chèn | 8.5 | BE, INT |
| ★6 Chỉ tin đầu có chi tiết | 8.1, 8.2 | BE |
| ★7 Điện thoại thành viên | Sổ tay và INV phổ biến:<br>- ẩn nội dung thông báo trên màn hình khóa;<br>- tắt email thông báo tin chưa đọc của Chat;<br>- quản lý thiết bị cơ bản;<br>- không dùng tài khoản cá nhân, không chép chi tiết ra ngoài.<br>Không có phần mã | INV, BA |
| ★8 Thông báo đã đăng | 8.8 bước 5 | FE-B, OPS |

Giữ từ Lượt 1:
- bí mật dạng tệp `booking_request_chat_webhook`, chỉ worker đọc, quyền 0400, có trong `PLAIN_SECRETS`;
- so host tuyệt đối, `redirect: 'error'`, timeout 5 s;
- không log URL, `key`, `token` hay thông điệp lỗi của undici;
- tệp rỗng hoặc URL sai → `off`, không chặn worker.

### 8.8 Thứ tự triển khai v1.0.1

| # | Bước | Ai | Ghi chú |
|---|---|---|---|
| 1 | Chốt chữ thông báo `2026-10-31` (UXD duyệt giọng). Chữ `{chatRetention…}` điền sau bước 3 | SEC, UXD | Nếu số version đổi thì BE đổi hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` trước khi gắn tag |
| 2 | Code v1.0.1 (thiếu cấu hình → A), review ARC + SEC, CI | BE, INT, OPS | |
| 3 | INT kiểm ★1, ★5 và các điểm 8.13 trên **phòng thử** bằng dữ liệu giả. INV tạo phòng thật "OTTIMO – Yêu cầu đặt phòng" theo ★4, tắt lịch sử (★1), phổ biến ★7 | INT, INV | Kết quả ★1 quyết định chữ `{chatRetention…}` và việc có bật được C hay không |
| 4 | Staging: `--set-booking-chat` với phòng thử; `.env` staging `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C`; landing staging có thông báo mới; QA chạy test 10–14 (8.11) và gửi SEC **chữ** tin thử ở cả 3 mức (N6) | OPS, FE-B, QA, SEC | Chỉ dữ liệu giả |
| 5 | Production: OPS chạy `init-secrets.sh` **trước** lượt deploy (R1; tệp rỗng là đủ). ORC báo INV thay đổi `.env` production `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C`, rồi deploy v1.0.1. Sau đó phát hành landing có thông báo mới (`deploy-landing.sh`) và ghi phiên bản bằng `publish-privacy-notice.sh` (chạy thử → thật, đối chiếu băm) | OPS, FE-B, ORC | Đặt C ngay nếu ★1, ★4, ★7 đã xong ở bước 3. Nếu chưa xong thì đặt A, rồi đổi `.env` sau khi xong |
| 6 | SEC ghi một dòng decision-log xác nhận đủ ★1–★8 | SEC | Theo SEC 3. Đã đặt C ở bước 5 mà ★2 giữ mẫu A cho tới khi bước 5 xong phần landing, nên dòng này có thể ghi sau deploy, miễn trước tin mức C đầu tiên |
| 7 | INV tạo webhook "Desk OTTIMO"; OPS hướng dẫn INV dán URL bằng `--set-booking-chat` trên máy chủ; khởi động lại worker; log `chat: on`, `chat detail level C` | INV, OPS | Không dán URL vào chat hay repo |
| 8 | QA gửi một yêu cầu thử trên production bằng dữ liệu giả rõ ràng (tên `TEST QA`, SĐT thử), thấy tin mức C trong ≤ 2 phút, đánh spam trên Desk. Quản lý phòng xóa tin thử | QA, INV | |

- Về dữ liệu, thứ tự landing và api không quan trọng nhờ ★2 (SEC 1.3).
- Bật form trước v1.0.1 (INV đã chốt) không ảnh hưởng thiết kế: các yêu cầu đó gửi theo `2026-10-24`, nên tin của chúng luôn ra mẫu A.

### 8.9 Ước lượng công mới

| Vai | Việc | Lượt 1 | Lượt 2 |
|---|---|---|---|
| INT | Kiểm URL (thêm luật query, lệnh kiểm cho `init-secrets`); client Chat. Kiểm trên phòng thử: `threadKey`, `messageId`, `<users/all>`, ★5 (5 ca SEC), tắt lịch sử với tin webhook và luồng, quản lý phòng xóa tin webhook, `mailto:` | 0,25 | **0,5** |
| BE | Phần Lượt 1 (1,5) + mức A/B/C và chặn theo thông báo (0,5) + `readChatContact` và `chatSafeText` (0,35) + nhắc buổi sáng (0,4) + kiểm `ADMIN_BASE_URL` (0,1) + `web_request_erased` (0,15, Should) | 1,5 | **3,0** |
| OPS | Phần Lượt 1 + biến `.env` của worker, `init-secrets` kiểm URL trước khi ghi, runbook (xoay, tắt khẩn, đổi mức, ★4), `ops-check` `chat_dead` (sau D) | 0,25 | **0,5** |
| QA | Test 10–14 trên staging + hồi quy form, `web_request.sla`, `erase` | 0,5 | **1,0** |
| SEC | Review thiết kế Lượt 2 + diff + chữ tin 3 mức | 0,25 | **0,5** |
| BA/PO | Sổ tay: cài phòng, ★7, chống tin giả, xóa tay khi WR8, checklist nghỉ việc; release notes | – | **0,25** |
| **Tổng tính năng** | | ≈ 2,75 | **≈ 5,75** |

Ngoài tổng trên:
- **Việc kèm**: FE-B dựng landing có thông báo mới (0,5); OPS chạy `publish-privacy-notice.sh` (0,1); SEC chốt chữ (0,25, phần lớn đã làm). Tổng ≈ 0,85.
- **Dự phòng ★1 cách 3** (Chat app tự xóa tin), chỉ khi cần: INT 1 (xác thực tài khoản dịch vụ, client Chat API, xóa tin), BE 0,75 (lưu `name`, job xóa hằng ngày), OPS 0,5 (Cloud project, bí mật khóa JSON, runbook), QA 0,5, SEC 0,25. Tổng **≈ 3 công**, làm chậm C khoảng một tuần.

Cắt nếu thiếu thời gian, dời sang v1.0.2 (phần Must vẫn đủ):
- `web_request_erased`: BE 0,15;
- `<users/all>`: ≈ 0,1;
- `ops-check chat_dead`: OPS ≈ 0,1;
- một phần hồi quy QA: ≈ 0,25.

Tổng cắt được ≈ 0,6–0,75 công.

**Không cắt**: chặn theo thông báo (★2), `chatSafeText` (★5), nhắc buổi sáng và tin quá hạn (INV yêu cầu).

### 8.10 Rủi ro thêm

| # | Rủi ro | Mức | Giảm thiểu |
|---|---|---|---|
| R9 | Bản sao PII trong phòng Chat còn sau khi đã xóa trên Desk (WR8, hạn lưu) | **Trung bình** | 8.6: tắt lịch sử là điều kiện chạy C; tin báo trong luồng; xóa tay ngay khi làm được |
| R10 | Chữ khách nhập thành công cụ lừa trong phòng nhân viên (link, `<users/all>`, giả dòng hệ thống) | Trung bình | `chatSafeText` 8.5; INT kiểm 5 ca SEC trên phòng thử |
| R11 | **Lịch v1.0.1 (04/11) căng**: BE ≈ 3 công tính từ 31/10, trùng đào tạo 31/10–01/11 và ngày D 02/11 | Trung bình–cao | ORC xếp một BE riêng cho việc này; cắt Should theo 8.9; thiết kế độc lập và không migration, nên trễ thì đưa Chat vào rc sau của v1.0.1. Trễ mốc v1.0.1 thì ORC báo INV |
| R12 | ★1 không đạt (không tắt được lịch sử, Vault tốn tiền) | Trung bình | Chạy A hoặc B trong lúc làm cách 3 (≈ 3 công) hoặc chờ ESC. Mã v1.0.1 không phải đổi gì để chạy A/B |
| R13 | OPS đặt C trước khi thông báo mới được đăng | Thấp | ★2 tự giữ mẫu A |
| R14 | Sai giá trị cấu hình (`c`, có khoảng trắng, `D`) | Thấp | `trim().toUpperCase()`; sai → A + log error, OPS bắt bằng `ERROR [` sau deploy |

### 8.11 Test – thay và thêm vào mục 5.2

**Unit**
- **1 (thêm):**
  - luật query chỉ `key`/`token`: ca `&threadKey=x`, `&key=a&key=b`, `&foo=1`;
  - lệnh kiểm cho `init-secrets` trả 0/1 và không in URL;
  - `ADMIN_BASE_URL` sai → `CHAT_LINK_BASE_INVALID`.
- **3 (thay):** render theo bảng mức × loại lưu trú × giờ (trong giờ, ngoài giờ, cần gọi ngay) × có cờ × kênh (`phone`, `email`).
  - **Mẫu A** (gồm cả ca C bị chặn theo thông báo): đưa vào dòng có ngày, số khách, loại lưu trú, tên, SĐT, email, lời nhắn. Đầu ra không chứa:
    - ngày `dd/MM` của ngày đến;
    - các chữ "người lớn", "trẻ em", "đêm", "tháng", "Theo tháng", "Ngắn ngày";
    - tên, SĐT, email, lời nhắn.
  - **Mẫu B**: có thông tin chuyến đi; không có tên, liên hệ, lời nhắn.
  - **Mẫu C**: có tên, đúng một liên hệ, nhãn kênh, lời nhắn trong khối mã; dòng cuối là "Mở Desk".
  - Spy: mẫu A/B không gọi câu SQL có cột C2. Câu `readChatContact` (khóa tĩnh) không có `decline_note|contact_hmac|ip_hmac`.
- **3a (mới) `chatSafeText`:**
  - thay cả trường: CCCD 12 số, CMND 9 số, hộ chiếu `B1234567`, số thẻ Luhn;
  - đầu ra không còn `<` hay `>`: tên `<users/all>`, lời nhắn `<https://evil.example|Mở Desk>`;
  - `evil.example/login` → `evil[.]example/login`; `https://x.y` → `https[:]//x[.]y`;
  - ```` ``` ```` và `` ` `` bị bỏ; `*x*` giữ nguyên trong khối mã;
  - ký tự đổi hướng chữ bị bỏ; tên nhiều dòng thành 1 dòng; lời nhắn 9 dòng thành 8;
  - 501 ký tự → cắt, thêm `… (xem đủ trên Desk)`; emoji và ký tự ghép không bị cắt đôi.
- **3b (mới) cấu hình:** không đặt → A; `c` → C; ` C ` → C; `D` → A + error.

**Tích hợp (DB thật)**
- **5 (thay) `web_request.sla`**, múi giờ `Asia/Ho_Chi_Minh`, tick qua nửa đêm:
  - quá hạn trong giờ: phút 30;
  - cần gọi ngay lúc 23:00: phút 45;
  - ngoài giờ kênh `zalo`: 07:30 có `overdue`, **không** có `morning`;
  - ngoài giờ kênh `phone`: 07:30 có `morning`, 08:30 có `overdue`;
  - 21:30 kênh `phone`: không có `morning` (tới trong giờ), quá hạn 08:30;
  - đã "Nhận xử lý" → 0 dòng;
  - chạy mỗi tick vẫn đúng 1 dòng cho mỗi kind;
  - worker chạy lại lúc 10:00 vẫn có `morning`; sau 22:00 không có `morning`.
- **6 (thêm) chặn theo thông báo (★2):**
  - `consent_version = 2026-10-24` + cấu hình C → chữ tin không chứa tên, SĐT, lời nhắn, ngày đến, số khách (ca SEC);
  - yêu cầu theo `2026-10-31` → mẫu C;
  - phiên bản hằng chưa có trong bảng → A + `levelCapped`;
  - hạ C → A rồi gửi dòng còn chờ → mẫu A.
- **6a (mới, Should) WR8:**
  - `erase` sau khi tin đầu đã gửi → 1 dòng `web_request_erased`, gửi được dù `pii_purged_at` đã đặt;
  - `erase` khi tin đầu chưa gửi (Chat `off`) → 0 dòng;
  - tin `web_request_new` còn chờ của yêu cầu vừa xóa → `SKIPPED_GONE`.
- **Log canh:** toàn bộ log của bộ test không chứa tên, SĐT, email, lời nhắn canh, `chat.googleapis`, `key=`, `token=`.

**Chỉ worker (test 7, 8):**
- khởi động với `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` → log `chat detail level` đúng, không có URL;
- `run-job web_request.sla` ghi được dòng `web_request_morning` trong tiến trình chỉ-worker.

**Staging (QA, phòng thử, dữ liệu giả):**
- **10 (giữ).**
- **11:** mức C – chữ đúng mẫu; 5 ca chèn của SEC ★5: không ai bị nhắc, không link nào bấm được ngoài link Desk. Gửi SEC **chữ** tin ở 3 mức (N6).
- **12:** yêu cầu lúc 22:30 (đặt tạm `front_desk_hours` trên stack thử) → tin tới ngay; 07:30 có tin nhắc trong cùng luồng.
- **13 (★1):** phòng tắt lịch sử → tin biến mất sau khoảng 24 giờ. INT ghi kết quả; đây là điều kiện để bật C.
- **14:** `erase` trên Desk → có tin báo trong luồng; quản lý phòng xóa được tin đầu (ghi kết quả).

### 8.12 Trả lời thẻ SEC

| Thẻ | Mức | Trạng thái | Xử lý |
|---|---|---|---|
| FB-R3-SEC-ARC-GCHAT-01 | Major | **Done** (SEC ghi hết hiệu lực vì INV quyết ESC-041 = C) | Mẫu A = đúng mẫu SEC 4.1 (thay mục 2.2). A cũng là giá trị khi thiếu cấu hình. B/C chỉ có khi cấu hình đặt **và** yêu cầu qua chặn theo thông báo ★2 (8.3). Test 3 có đủ ca SEC |
| FB-R3-SEC-ARC-GCHAT-02 | Minor | **Done** (phần thiết kế) | G1–G3, G7 vào thiết kế và test (8.7, 8.11). G4 vào runbook OPS; G5, G6 vào sổ tay BA và hướng dẫn I1. ORC giao |
| ★1–★8 (esc041-gchat-full-details 3.1) | Điều kiện bật C | Đã đưa vào thiết kế | Bảng 8.7. ★1 phụ thuộc kết quả INT trên phòng thử |

### 8.13 Câu hỏi còn lại (không có ESC mới)

**SEC**
- Q1. Đồng ý chọn biến môi trường cho mức (không dùng `config_parameter`, 8.3), và hằng trong mã cho phiên bản tối thiểu?
- Q2. ★1 cách 3 (Chat app tự xóa tin sau 7 ngày, ≈ 3 công) có được coi là đủ thay cho tắt lịch sử không, nếu INT báo cách 1 không được?
- Q3. Email ở mức C: không vô hiệu tên miền trong email (để đọc đúng địa chỉ); Chat có thể tự tạo link `mailto:`. Chấp nhận không?

**PO**
- Q4. Có cần thêm **hạng phòng** vào mẫu B/C không? Câu thông báo `2026-10-31` chưa nêu hạng phòng, nên muốn thêm thì phải báo SEC trước khi chốt chữ.
- Q5. Thêm `<users/all>` vào tin quá hạn và tin buổi sáng (Should)? Mọi thành viên sẽ nhận thông báo, kể cả ban đêm với yêu cầu "cần gọi ngay".
- Q6. Vẫn mỗi kind một tin (không nhắc lặp tới khi có người nhận)? ARC đề xuất không thêm tin thứ tư khi trễ câu hứa công khai 60 phút, vì Desk đã tô quá hạn.

**ORC**
- Q7. Lịch: BE ≈ 3 công tính từ 31/10, trùng đào tạo và ngày D. Cần xếp người; nếu thiếu thì cắt theo 8.9.
- Q8. Nếu ★1 cách 1 không được: mở ESC cho Vault (chi phí), hay giao ARC thiết kế cách 3? Trong lúc chờ thì production chạy A.

**INT** – kiểm trên phòng thử, ghi kết quả vào báo cáo INT:
- `messageId`, `threadKey`, `<users/all>` qua webhook;
- 5 ca chèn của ★5, `mailto:`;
- tắt lịch sử: có áp cho tin webhook và cho luồng không;
- quản lý phòng có xóa được tin do webhook đăng không.

### 8.14 Không đổi so với Lượt 1

- Topic `staff.chat`; outbox chỉ chứa id; ghi trong cùng giao dịch.
- Bộ phát chạy trong worker: claim, lease 2 phút, ngân sách 1 phút, back-off, `dead`, stale 12 giờ.
- Phòng Chat riêng; URL webhook là bí mật dạng tệp.
- Không migration, không đổi OpenAPI, không đổi Desk (FE), không sửa `staff.push`.
- Landing chỉ đổi chữ thông báo (việc kèm, FE-B).
