# BE – Báo yêu cầu đặt phòng website qua Google Chat (v1.0.1)

- Round 3 · Bước: Sản xuất · Tác giả: BE · Ngày 30/10/2026 · Nhánh `be/gchat-booking-notify`
- Căn cứ: thiết kế ARC `outputs/ARC/gchat-booking-request-notify.md` (**mục 8 – Lượt 2 thắng mục 0–7**); SEC `outputs/SEC/esc041-gchat-full-details.md` (★2, ★3, ★5, ★6); `reviews/SEC-on-us155-enable.md` mục 4 (GCHAT-02); decision-log 30/10 (INV "thêm cả hai", ESC-041 = C chạy từ v1.0.1).
- Mặc định ORC cho ARC 8.13 (PO xác nhận sau): Q4 không thêm hạng phòng; Q5 `<users/all>` chỉ ở tin quá hạn; Q6 không nhắc lặp. Cả ba là **hằng trong `chat-message.ts`**, đổi một dòng.
- Dữ liệu thử: toàn bộ giả (tên "Canary …", SĐT `849000000xx`, `example.invalid`). Không gọi Google thật: test dùng máy chủ webhook giả trên 127.0.0.1.

## 1. Đã làm gì

### 1.1 Điểm phát (api, cùng giao dịch, outbox chỉ có id)

| Kind | Điểm phát | Dedupe |
|---|---|---|
| `web_request_new` | `PublicBookingService.store()` ngay sau `notify('website_request_new')` | `staff.chat:web_request_new:<id>` |
| `web_request_overdue` | `web_request.sla`, cùng vòng lặp đặt `overdue_notified_at` | `…:web_request_overdue:<id>` |
| `web_request_morning` | `web_request.sla`, nhánh thứ hai `morningNudge` (07:30 = `front_desk_hours.from` + `web_request_escalate_minutes`, tới `front_desk_hours.to`; ca đêm hôm qua; bỏ qua nếu tin quá hạn đã ghi sáng nay) | `…:web_request_morning:<id>` |
| `web_request_erased` | WR8 `erase` (`website-requests.service.ts`), chỉ khi tin đầu đã/đang có thể đăng | `…:web_request_erased:<id>` |

- Hàm ghi: `modules/events/public/staff-chat.ts` `enqueueStaffChat` (danh sách kind đóng, refId phải là UUID, `ON CONFLICT (dedupe_key) DO NOTHING`, `created_at` = đồng hồ nghiệp vụ) + method `EventsService.enqueueStaffChat`. Không migration cho phần Chat.
- Các nhánh không tạo yêu cầu (honeypot, 422, replay, quá 3 lần/ngày, `SITE_BUSY`) không ghi gì – có test.

### 1.2 Bộ phát `ChatDispatcher` (worker – `src/jobs/chat-dispatch.ts`)

Theo mẫu `StaffEmailDispatcher`: claim ≤ 5 dòng `FOR UPDATE SKIP LOCKED` theo property, lease 2 phút, ngân sách 1 phút/lượt (`deferred`, trả lại lần thử), POST ngoài giao dịch, back-off `[1, 5, 15, 60, 180]` phút, lần 6 → `dead`; 4xx (trừ 408/429) và redirect → `dead` ngay (`CHAT_REJECTED_<status>`, `CHAT_REDIRECT`); quá 12 giờ → `SKIPPED_STALE`; Chat tắt → `SKIPPED_DISABLED` (outbox không phình, bật lên không xả tin cũ). Renderer lỗi → SAVEPOINT, thử lại như lỗi gửi. Log chỉ `outboxId`, `kind`, `attempt`, `code`; tổng mỗi lượt `info 'chat dispatch' {sent, done, retry, dead, skipped, deferred, levelCapped}`; `dead` → `error 'chat dead'`. `worker.ts` gọi sau email, `try/catch` riêng, `errorTag`.

### 1.3 Nội dung tin (`modules/public-site/public/chat-message.ts`)

- Mức A/B/C đúng bảng ARC 8.2; dòng "Mở Desk" luôn cuối; môi trường khác production có tiền tố `[<APP_ENV>] `.
- **Mức hiệu lực**: chỉ `web_request_new` được B/C (★6); B/C chỉ khi `published_at` của `consent_version`+`locale` của yêu cầu ≥ `published_at` sớm nhất của hằng `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-10-31'` (★2). Phiên bản hằng chưa có trong bảng → A cho mọi yêu cầu, đếm `levelCapped`.
- **Tách SQL**: `CHAT_BASE_SQL` không có cột C2 (khóa tĩnh + spy); `CHAT_CONTACT_SQL` đúng 5 cột `guest_name, phone_e164, email, preferred_channel, note`, chỉ gọi ở mức C.
- **`chatSafeText`** (★5): chạy lại `looksLikeCard`/`looksLikeIdNumber` → thay cả trường; bỏ ký tự điều khiển + đổi hướng; tên 1 dòng, lời nhắn ≤ 8 dòng; `<`→`‹`, `>`→`›`, bỏ backtick; `://`→`[:]//`, dấu chấm kiểu tên miền → `[.]` (email giữ tên miền); cắt theo grapheme (tên 80, lời nhắn 500) + `… (xem đủ trên Desk)`; lời nhắn trong khối mã; cờ `contains_url` → `Lời nhắn (có link – không bấm, xem trên Desk):`.
- "Cần gọi ngay" tính lại lúc gửi như `replyPlan`: ngoài giờ trực **và** ngày đến = ngày nghiệp vụ lúc nhận (`business_day_rollover`).
- Bỏ qua lúc gửi: `SKIPPED_GONE` (không còn dòng, `spam`, `pii_purged_at` – trừ tin xóa), `SKIPPED_HANDLED` (tin nhắc của yêu cầu đã nhận/không còn `new`), `SKIPPED_NOT_POSTED` (tin xóa khi tin đầu chưa từng đăng).

### 1.4 Cấu hình (worker – `src/worker-chat.ts`)

- `BOOKING_REQUEST_CHAT_WEBHOOK_URL` qua `BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE` (`resolveFileSecrets` sẵn có). Kiểm bằng `parseBookingChatWebhook` (`integrations/common/safe-config.ts`): `https`, host đúng `chat.googleapis.com` (cả chuỗi gốc), không userinfo/cổng/fragment, path `/v1/spaces/<id>/messages`, query **đúng 2 khóa `key`, `token`** mỗi khóa 1 lần, ≤ 512. Rỗng → `off`; sai → `off` + `error 'chat webhook config invalid' {code: CHAT_WEBHOOK_URL_INVALID}` – **không chặn worker**.
- `staging`/`production` từ chối biến thường `BOOKING_REQUEST_CHAT_WEBHOOK_URL` (không `_FILE`) trong `findUnsafeIntegrationConfig`, như `EMAIL_SMTP_PASSWORD`.
- `BOOKING_REQUEST_CHAT_DETAIL_LEVEL`: `trim().toUpperCase()`; thiếu → A; sai → A + `error 'chat config invalid' {code: CHAT_DETAIL_LEVEL_INVALID}`.
- `ADMIN_BASE_URL` (G3): https, không userinfo/cổng/query, path `/`, không phải IP; production đúng `https://desk.ottimo.vn`. Sai → Chat `off` + `CHAT_LINK_BASE_INVALID`.
- Khởi động log một lần: `chat: on|off` (+ `reason`) và `chat detail level {level}`. Không bao giờ log URL.
- Client `postChatText` (`integrations/notification/google-chat.ts`): JSON ≤ 4 KB, timeout 5 s, `redirect: 'error'`, `threadKey` + `messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD` đặt bằng `URLSearchParams.set` trên **bản sao** URL; bỏ thân phản hồi; lỗi chỉ thành mã (`TIMEOUT`, `NETWORK_<code>`, `HTTP_<n>`…). `messageId` có sẵn nhưng **tắt** (`CHAT_USE_MESSAGE_ID = false`) tới khi INT xác nhận webhook nhận tham số này.

### 1.5 Hạ tầng (mô tả cho OPS trong PR)

- `docker-compose.prod.yml`: secret `booking_request_chat_webhook` (chỉ worker), worker env `BOOKING_REQUEST_CHAT_WEBHOOK_URL_FILE=/run/secrets/booking_request_chat_webhook`, `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=${…:-A}`.
- `init-secrets.sh`: mặc định tạo **tệp rỗng** (uid 1000, 0400) → đủ cho `deploy.sh` (rủi ro R1). `--set-booking-chat`: `umask 077`, `read -rs`, kiểm cùng luật (bash) + lệnh kiểm trong image `dist/tools/check-chat-webhook.js` nếu image đã có (từ v1.0.1), sai → "URL không hợp lệ", không ghi; đúng → tệp tạm + `mv`, in `chat webhook: set (<n> chars)`; dòng trống = tắt Chat.
- `check-compose.sh`: `BOOKING_REQUEST_CHAT_WEBHOOK_URL` vào `PLAIN_SECRETS`; worker phải có `email_smtp_password` + `booking_request_chat_webhook` và đúng đường `_FILE`; dịch vụ khác có các secret đó hoặc biến `BOOKING_REQUEST_CHAT_*` → FAIL (đã thử bản compose sai: 3 FAIL đúng).
- `env.example`, `env.production.example`, `.env.example`: dòng `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` + chú thích (không giá trị bí mật). `server/test/publish-privacy-notice.test.sh`: thêm tệp secret rỗng.

### 1.6 PN-01 (`privacy_notice_version` chỉ-thêm-dòng) – **đã tách khỏi PR #16**

- Theo quyết định ARC (`reviews/ARC-on-BE-gchat-notify.md` mục 3, thẻ GC-01): hai commit PN-01 (`db29b4ca`, `1420521e`) đã **revert** trên nhánh này (`0d13aed8`, `cac5c9cc` – revert, không force-push). PR #16 **không còn migration nào**; phần Chat theo thiết kế 8.14 vốn không cần migration.
- PN-01 (migration chỉ-thêm-dòng + `defineAuditEntity('privacy_notice_version', …)` + test) sẽ làm lại ở nhánh riêng `be/privacy-notice-append-only`, cắt từ `main` **sau khi PR BE-A (0089) đã gộp**: cherry-pick 2 commit, snapshot = **nội dung 0089** (đổi `id`, `prevId` = id 0089), idx 66, `when` = 0089 + 2000, CI "drizzle-kit generate creates no file" xanh, chạy `infra/server/test/publish-privacy-notice.test.sh` với trigger. Chưa làm ở lượt này.

## 2a. Lượt 2 – sửa theo review ARC + SEC (30/10)

Bảng trả lời đủ thẻ: `rounds/round-03/responses/BE-gchat-notify.md`. Tóm tắt:
- **SEC GCHAT-01 (Major)**: email mức C chỉ in khi khớp mẫu chặt `CHAT_EMAIL` (`^[a-z0-9._%+-]{1,64}@` + nhãn tên miền như `normalizeEmail`); không khớp → `(email có ký tự đặc biệt – xem trên Desk)`. `://` và `<>` nay luôn bị vô hiệu ở mọi trường (kể cả email); ngoại lệ duy nhất của email là giữ dấu chấm tên miền (SEC Q3).
- **ARC GC-02 + SEC 02**: `chatSafeText` bỏ mọi `\p{Cf}` (giữ U+200D giữa hai pictograph – emoji ghép); U+2028/U+2029/U+0085 = xuống dòng; `DOMAIN_DOT` nhận `\p{M}` trước dấu chấm; dấu chấm của cụm IPv4 → `[.]`; tên (ngoài khối mã) bỏ `*` `_` `~`.
- **SEC 04**: tin mức C mang hàm `recheck`; dispatcher đọc lại `status, pii_purged_at` ngay trước POST, đã xóa/spam → `SKIPPED_GONE`, không gửi.
- **ARC GC-06**: staging/production chỉ đọc `ADMIN_BASE_URL` (dev/test giữ dự phòng `APP_BASE_URL`). **GC-05**: `umask 077` trong nhánh `--set-booking-chat`, in `checked: bash rule only (image tool not available)` khi image chưa có lệnh kiểm. **GC-03**: sửa chú thích trỏ test. **SEC 03**: chú thích trên hằng phiên bản (thông báo bỏ Google Chat → hạ mức trước khi đăng).

## 2b. Lượt 3 – sửa theo review QA (31/10, BUG-R3-057)

- **QA FB-01 / BUG-R3-057 (Major, P1)**: `chatSafeText` kiểm số giấy tờ/thẻ bằng hàm mới `looksLikeSensitiveNumber` ở **3 chỗ**: (1) trên chữ gốc như cũ; (2) **sau** mọi bước bỏ ký tự (Cc, `\p{Cf}`, `_` `*` `~` của tên, gộp dòng, backtick) và **trước** bước `[.]`/`[:]` (bước này làm `079.203.012.345` dạng IPv4 thành `079[.]203[.]012[.]345`, luật số không còn đọc được); (3) trên chữ in ra cuối cùng, đọc `[.]` như dấu chấm.
- `looksLikeSensitiveNumber` = luật V-09/SR-LOG-04 có sẵn (`looksLikeCard`, `looksLikeIdNumber`, không đổi) chạy trên chữ gốc, rồi trên bản **NFKC** (chữ số và khoảng trắng toàn độ rộng, NBSP) có mọi chữ số `\p{Nd}` đổi về ASCII (Ả Rập, Devanagari…), rồi trên bản coi **một** ký tự `_` `/` `,` giữa hai chữ số là dấu tách nhóm (ngày/giờ được che trước, giống luật form). Bản chuẩn hóa chỉ dùng để kiểm, không in ra.
- Không che nhầm: SĐT 10–11 số (cả dạng toàn độ rộng), số sau `+`, hai SĐT cách nhau `, `, ngày `12/11/2026`, số tiền có đơn vị (`1,500,000 đ`) vẫn hiện như khách gõ. Dòng `Liên hệ: +…` không đi qua `chatSafeText` nên không đổi.
- Không đụng `website-request-rules.ts` (luật form, BUG-R3-058 là việc riêng của BE-D).
- Test thêm: `gchat-units.test.ts` khối "BUG-R3-057" (TC-GC-01: 18 chuỗi × tên/lời nhắn; TC-GC-02 render C; SĐT hợp lệ ở mức C; 7 ca không che nhầm; TC-GC-06 tin C lớn nhất ≤ 4 KB, 4 biến thể) – 20 ca đỏ trên mã cũ, xanh trên mã mới. `gchat-notify.test.ts`: TC-GC-10 (22:00:00 và 06:59:59 là ca đêm, 07:00:00 trong giờ; 07:29:59 chưa nhắc, 07:30:00 nhắc).

## 2. Test (ARC 8.11)

| Nhóm | Tệp | Nội dung | Kết quả |
|---|---|---|---|
| Unit 1, 2 (INT) | `integrations/common/safe-config.test.ts`, `integrations/notification/google-chat.test.ts` | 21 ca URL sai (http, host khác, `….evil.test`, host trong path, chữ hoa, dấu chấm cuối, userinfo, cổng, IP, sai path, `..`, thiếu/rỗng key/token, `&threadKey`, `key` 2 lần, `&foo`, fragment, quá dài); biến thường bị từ chối ở production; client với máy chủ giả: 200, 409+messageId, 429/500/503/408 retryable, 400/401/403/404 permanent, 302 không theo, timeout, reset, từ chối kết nối, > 4 KB; kết quả không chứa URL/key/token | 219/219 gói integrations |
| Unit 3, 3a, 3b, khóa tĩnh | `services/api/test/gchat-units.test.ts` | Render A/B/C × ngắn/dài hạn/không rõ × trong giờ/ngoài giờ/cần gọi ngay (cả qua nửa đêm trước rollover) × cờ × kênh phone/email/zalo; spy: A/B và mọi ca bị chặn ★2 không gửi câu SQL có cột C2; C chỉ đúng `CHAT_CONTACT_SQL`; tin nhắc luôn A, `<users/all>` chỉ tin quá hạn; tin xóa; `chatSafeText` đủ ca SEC (CCCD, CMND, hộ chiếu, thẻ Luhn, `<users/all>`, `<https://evil.example\|Mở Desk>`, `evil.example/login`, `https://x.y`, backtick, `*x*`, bidi, 9 dòng → 8, 501 ký tự, emoji ghép); cấu hình mức, `ADMIN_BASE_URL`, `resolveChatConfig`; renderer chỉ được `worker-chat.ts` nối | 41/41 |
| Tích hợp 4, 5, 6, 6a, log canh | `services/api/test/integration/gchat-notify.test.ts` | Form → đúng 1 dòng (payload chỉ 3 khóa), replay vẫn 1, honeypot/422 → 0; dispatcher: done + `dispatched_at` + `threadKey`, 500→200 (attempts 2), 404 dead, 6 lần → dead, lease hết hạn lấy lại, ngân sách → deferred, off → `SKIPPED_DISABLED`, > 12 giờ → `SKIPPED_STALE`, đã nhận → `SKIPPED_HANDLED`, spam → `SKIPPED_GONE`; ★2: C + thông báo mới chưa đăng → A + `levelCapped`, sau khi đăng: yêu cầu `2026-10-24` vẫn A, `2026-10-31` ra C đúng mẫu; hạ C → A áp cho dòng đang chờ; B dài hạn; `web_request.sla` (giờ VN, qua nửa đêm): phút 30 trong giờ, 23:00 cần gọi ngay → 23:45, ngoài giờ zalo → quá hạn 07:30 không có morning, ngoài giờ phone → morning 07:30 + quá hạn 08:30, 21:30 phone → không morning, đã nhận → 0, mỗi tick vẫn 1 dòng/kind, worker trở lại 10:00 vẫn morning, sau 22:00 không morning; WR8: tin đầu đã đăng → tin xóa trong luồng (gửi được dù đã purge), Chat tắt → 0 dòng, tin đầu đang chờ → `SKIPPED_GONE` + `SKIPPED_NOT_POSTED`; **toàn bộ log của bộ test không chứa** tên/SĐT/email/lời nhắn canh, `chat.googleapis`, `key=`, `token=` | 21/21 |
| Chỉ worker 7, 8 | `services/api/test/integration/gchat-worker-only.test.ts` (+ lệnh `run-chat` trong `test/helpers/worker-only-child.ts`) | Tiến trình con chỉ nạp worker (không `*.module.ts`): URL từ **tệp** bí mật, `web_request.sla` ghi `web_request_morning`, dispatcher gửi tới máy chủ giả, log `chat: on` + `chat detail level {C}`, không lỗi; tệp rỗng → `chat: off {reason: NOT_CONFIGURED}`; URL sai + mức sai → 2 dòng error có mã, `chat: off`, `public_site.cleanup` vẫn `done` | 2/2 |
| ~~PN-01~~ (đã tách, mục 1.6) | `test/integration/privacy-notice-append-only.test.ts`, `test/worker-audit-registry.test.ts` | Đặt `superseded_at` 1 lần được; lần 2, xóa NULL, đổi sha, vừa đặt vừa đổi sha, đổi `published_at`, DELETE → `check_violation` với `ottimo_owner`; 2 trigger có trong catalogue; registry worker có `privacy_notice_version` | 8/8 + 4/4 |
| Hồi quy | `public-site-r3-bed`, `module-boundaries`, `worker-audit-registry`, `worker-jobs`, `config`, `email-dispatch`, `s438-r8`, `architecture`, `migrations-journal` | Sửa 2 kỳ vọng `{escalated: 0}` → `toMatchObject` vì job trả thêm `morning` | xanh |
| Hạ tầng 9 | `infra/ci/check-compose.sh` | OK; bản compose cố tình sai → 3 FAIL đúng | OK |

Toàn bộ `pnpm test` api + `pnpm lint` chạy cục bộ trên PostgreSQL 17 (vai `ottimo_app`) – kết quả ghi trong PR; CI là cổng cuối.

## 3. File tạo/sửa

Tạo:
- `product/integrations/notification/google-chat.ts`, `google-chat.test.ts`, `fake-chat.test-support.ts`
- `product/services/api/src/modules/events/public/staff-chat.ts`
- `product/services/api/src/modules/public-site/public/chat-message.ts`
- `product/services/api/src/jobs/chat-dispatch.ts`
- `product/services/api/src/worker-chat.ts`
- `product/services/api/src/tools/check-chat-webhook.ts`
- `product/services/api/test/gchat-units.test.ts`, `test/helpers/fake-chat-webhook.ts`, `test/integration/gchat-notify.test.ts`, `test/integration/gchat-worker-only.test.ts` (`privacy-notice-append-only.test.ts` đã revert)
- ~~`product/services/api/src/db/migrations/0090_privacy_notice_append_only.sql`, `meta/0090_snapshot.json`~~ (revert – mục 1.6)

Sửa:
- `product/integrations/common/safe-config.ts` (+ test), `product/integrations/notification/index.ts`
- `product/services/api/src/modules/events/public/events.service.ts`
- `product/services/api/src/modules/public-site/internal/public-booking.service.ts`, `internal/website-requests.service.ts`, `public/worker-jobs.ts`, `audit-entities.ts`
- `product/services/api/src/worker.ts`, `test/helpers/worker-only-child.ts`, `test/integration/public-site-r3-bed.test.ts`, `test/worker-audit-registry.test.ts`
- `product/services/api/src/db/migrations/meta/_journal.json`
- `product/infra/docker-compose.prod.yml`, `infra/server/bin/init-secrets.sh`, `infra/ci/check-compose.sh`, `infra/server/env.example`, `infra/server/env.production.example`, `infra/server/test/publish-privacy-notice.test.sh`, `product/.env.example`

Không đổi OpenAPI, Desk (FE), landing.

## 4. Giả định (BE tự quyết, trong phạm vi cài đặt)

1. **Mã yêu cầu in đúng như Desk**: Desk (`WebRequestsPage`, `WebRequestDrawer`) hiện `refCode` thô, không tiền tố → tin in `7K3P9QXA`, không `REQ-` như ví dụ ARC. FE-B/PO muốn tiền tố thì đổi một chỗ.
2. **Tin xóa (WR8) cũng kết thúc bằng dòng "Mở Desk"**, khác chữ ARC 8.6 (chỉ mã + câu nhắc), để giữ bất biến chống tin giả G5/N5 "tin thật luôn kết thúc bằng Mở Desk". Không có PII.
3. Tiền tố môi trường là `[<APP_ENV>] ` (staging → `[staging]`, test → `[test]`); production không có.
4. `messageId` tắt mặc định (`CHAT_USE_MESSAGE_ID = false`): nếu webhook từ chối tham số lạ thì mọi tin sẽ `dead`. `threadKey` bật (có trong tài liệu webhook của Google). INT kiểm cả hai trên phòng thử.
5. Tin nhắc buổi sáng: bỏ qua khi `overdue_notified_at` ≥ giờ mở cửa hôm nay (đúng ARC 8.4). Hệ quả: worker trở lại sau 08:30 thì yêu cầu ngoài giờ thường chỉ nhận tin quá hạn (một tin "chưa có người nhận" là đủ); yêu cầu "cần gọi ngay" đã quá hạn ban đêm vẫn nhận tin buổi sáng.
6. "Cần gọi ngay" tính lại lúc gửi từ `created_at`, `front_desk_hours`, `business_day_rollover` (không lưu cột mới) – khớp `replyPlan`.
7. Staging: `ADMIN_BASE_URL` chỉ cần https, không cổng, path `/`, không IP (chưa có danh sách host staging; OPS cung cấp thì thêm).
8. `staging`/`production` từ chối khởi động nếu đặt URL webhook bằng biến thường (cùng luật với mật khẩu SMTP).

## 5. Rủi ro / vướng mắc

- **R1 deploy**: thiếu tệp `booking_request_chat_webhook` → `deploy.sh` từ chối. OPS chạy `sudo …/init-secrets.sh` trên **cả staging và production** trước lượt deploy v1.0.1 (tệp rỗng là đủ).
- Migration: PR #16 không còn migration (PN-01 tách – mục 1.6). PN-01 chờ BE-A 0089 gộp.
- Lịch: phần mã đã xong; còn phụ thuộc INT kiểm trên phòng thử (★1, `threadKey`, `messageId`, `<users/all>`, ★5) trước khi đặt C.

## 6. Việc cho vai khác

- **OPS**: chạy `init-secrets.sh` hai stack trước deploy v1.0.1; `.env` `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` (staging: chỉ C với phòng thử; production: A tới khi SEC ghi đủ ★1–★8, rồi báo INV trước khi đổi); hướng dẫn INV `--set-booking-chat` + `bin/dc restart worker`, kiểm log `chat: on`, `chat detail level`; runbook (xoay URL khi có sự kiện, công tắc tắt khẩn = xóa webhook, đổi mức); `ops-check` `chat_dead` sau ngày D (dòng `staff.chat` `dead` trong 24 giờ > 0).
- **INT**: review `google-chat.ts` + `parseBookingChatWebhook` (tệp INT sở hữu, BE viết); trên phòng thử: `threadKey`, `messageId` (được thì đổi `CHAT_USE_MESSAGE_ID = true`), `<users/all>`, 5 ca ★5, `mailto:`, tắt lịch sử (★1), quản lý phòng xóa được tin webhook.
- **QA**: staging test 10–14 (ARC 8.11) bằng dữ liệu giả + gửi SEC chữ tin 3 mức (N6); hồi quy form, `web_request.sla`, WR8.
- **SEC**: review diff (N6), xác nhận Q1/Q3 ARC 8.13.
- **PO**: xác nhận Q4–Q6 (hằng `CHAT_MENTION_ALL_KINDS`, không hạng phòng, không nhắc lặp) và giả định 1 (mã không tiền tố).
- **ARC**: review PR (bắt buộc), xem giả định 2 và 5.

## 7. ESC

Không có ESC mới. Không quy tắc tiền/giá nào bị chạm; mọi điểm mở là quyết định kỹ thuật (đã ghi giả định) hoặc câu PO/INT đã có trong ARC 8.13.
