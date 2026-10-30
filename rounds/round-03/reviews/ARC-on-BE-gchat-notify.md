# ARC review BE – tin Google Chat cho yêu cầu đặt phòng website (v1.0.1)

- Người review: ARC | Round 3 – bước **Review** (v1.0.1) | Ngày: 30/10/2026
- Đối tượng: PR #16 `be/gchat-booking-notify`, head `1420521e`, so với `main` `8dd3a651` (37 tệp, +18238/−14; trong đó 14 726 dòng là snapshot `0090`). 4 commit: `3ecd74a2` (Chat), `db29b4ca` (PN-01: migration 0090 + allowlist audit), `97bf1901` (báo cáo + decision-log), `1420521e` (định dạng snapshot 0090).
- Báo cáo tác giả: `rounds/round-03/outputs/BE/gchat-booking-notify.md` (trên nhánh).
- Đối chiếu: thiết kế ARC `outputs/ARC/gchat-booking-request-notify.md` **mục 8** (Lượt 2 thắng mục 0–7).
- Cách review: đọc diff và mã trong worktree của nhánh. So migration với nhánh `be-a-v1.0.1` (`1552e495`) và `drizzle-orm` migrator (`src/db/migrate.ts`, `test/migrations-journal.test.ts`). Chạy thử `chatSafeText` với 9 chuỗi biên (tệp test tạm, đã xóa, không để lại thay đổi trên nhánh). Xem CI của PR: 8 job bắt buộc **xanh** (format · lint · audit · test · build; docker build + E2E smoke; shellcheck; gitleaks; OpenAPI; contract; landing). **Không chạy** bộ test cần DB (dựa vào CI). Không đăng lên PR, không gộp, không commit lên `main`.

## Kết luận: **Duyệt có điều kiện**

Phần Chat đúng thiết kế 8.1–8.8 và đủ test 8.11. Không có Blocker. Có **một thẻ Major, về thứ tự migration** (GC-01). Phần Chat không cần sửa mã để gộp.

Điều kiện gộp PR #16 (ở cuối file): bỏ commit PN-01 (0090) khỏi PR này, chuyển sang một PR riêng gộp **sau** BE-A. Các thẻ Minor phải xong trước khi đặt mức **C** trên production, không chặn việc gộp.

## 1. Đối chiếu thiết kế mục 8

| Mục ARC | Cài đặt | Kết quả |
|---|---|---|
| 8.1 Bốn kind, danh sách đóng, dedupe theo `(kind, id)`, cùng giao dịch | `staff-chat.ts`: kind và refType đóng, refId phải là UUID, `ON CONFLICT (dedupe_key) DO NOTHING`, cần ngữ cảnh property. Điểm phát: `store()` sau `notify`, `web_request.sla` cùng vòng đặt `overdue_notified_at`, `erase` WR8 | Đúng |
| 8.1 Quy tắc bỏ qua | `SKIPPED_GONE` không áp cho tin xóa; `SKIPPED_HANDLED` cho tin nhắc khi không còn `new` hoặc đã có người nhận; thêm `SKIPPED_NOT_POSTED` | Đúng, hợp lý hơn thiết kế |
| 8.2 Mức A/B/C, tách SQL | `CHAT_BASE_SQL` không có cột C2. `CHAT_CONTACT_SQL` đúng 5 cột, chỉ gọi khi mức hiệu lực = C. Test spy + khóa tĩnh có. Outbox chỉ giữ id | Đúng |
| 8.2 Dòng "Mở Desk" luôn cuối | `lines.push(deskLine)` sau mọi khối, tin xóa cũng vậy | Đúng |
| 8.3 Cấu hình mức | Biến worker, `trim().toUpperCase()`, thiếu → A, sai → A + `CHAT_DETAIL_LEVEL_INVALID`. Log một lần `chat: on/off` và `chat detail level`. `check-compose.sh` cấm `BOOKING_REQUEST_CHAT_*` ở dịch vụ khác worker | Đúng |
| 8.3 Chặn theo phiên bản thông báo (★2) | Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-10-31'`. So `published_at` (min mọi ngôn ngữ) với `published_at` của `consent_version` + `locale` của yêu cầu. Chưa có trong bảng → A + `levelCapped`. Chỉ `web_request_new` được B/C (★6) | Đúng |
| 8.4 Quá hạn + nhắc 07:30 | Nhánh thứ hai trong `web_request.sla`, chạy sau nhánh quá hạn. Cửa sổ `[from + escalate, to)`. Ca đêm = `to` hôm qua → `from` hôm nay. Bỏ qua khi `overdue_notified_at ≥ from` | Đúng |
| 8.5 `chatSafeText` | Đủ 6 bước. Cắt theo grapheme (chặt hơn code point). Email không vô hiệu tên miền (Q3) | Đúng; xem GC-02 |
| 8.6 Tin xóa WR8 | Chỉ ghi khi tin đầu đã đăng hoặc còn chờ. Worker kiểm lại "đã đăng thật" (`staffChatState`). Đường đua xóa trong lúc tin đầu đang gửi được xử lý đúng | Đúng (+ giả định 2, mục 2) |
| 8.7 G1 query đúng `key`, `token` | `parseBookingChatWebhook`: so cả chuỗi gốc, host tuyệt đối, đúng 2 khóa mỗi khóa 1 lần, ≤ 512. Tham số thêm bằng `URLSearchParams.set` trên **bản sao** | Đúng |
| 8.7 G2 `init-secrets --set-booking-chat` | `[ -t 0 ]`, `read -rs`, kiểm bằng luật bash, rồi kiểm bằng `dist/tools/check-chat-webhook.js` trong image (URL qua stdin, `--network none`). Tệp tạm → `chown` → `chmod 0400` → `mv`. Chỉ in độ dài | Đúng (xem chú ý `umask` ở GC-05) |
| 8.7 G3 `ADMIN_BASE_URL` | https, không userinfo/cổng/query, path `/`, không IP; production đúng `desk.ottimo.vn`. Sai → Chat `off` | Đúng; xem GC-06 |
| 8.7 bí mật chỉ worker | Secret `booking_request_chat_webhook` chỉ worker. `PLAIN_SECRETS` có biến. Staging/production từ chối biến thường (giả định 8). `check-compose.sh` bắt 3 lỗi | Đúng |
| 1.4 Bộ phát | Như `StaffEmailDispatcher`: claim ≤ 5 `SKIP LOCKED`, lease 2 phút, ngân sách 1 phút, back-off, 4xx/redirect → `dead`, stale 12 giờ, Chat tắt → `SKIPPED_DISABLED`. Lỗi render: SAVEPOINT, log chỉ `err.name`. POST ngoài giao dịch, bỏ thân phản hồi, lỗi chỉ thành mã | Đúng |
| 8.11 Test | Unit 1–3b, tích hợp 4–6a, log canh, chỉ worker 7–8, `check-compose` có ca sai | Đủ |
| 8.14 Không migration cho phần Chat | Phần Chat không có migration. **0090 là việc khác (PN-01)**, đi chung PR | Xem GC-01 |

## 2. Hai giả định BE ORC hỏi

**Giả định 2 – tin xóa WR8 có dòng "Mở Desk": ARC chấp nhận.** Mục 8.6 coi như sửa theo giả định này.
- Bất biến chống tin giả G5/N5 ("tin thật luôn kết thúc bằng dòng Mở Desk tới `desk.ottimo.vn`") nằm trong sổ tay. Một ngoại lệ sẽ làm câu đó sai, và người trực khó phân biệt tin thật với tin giả.
- Link vẫn có ích: dòng yêu cầu còn trên Desk sau khi xóa C2 (`pii_purged_at`). Người làm WR8 mở được lịch sử để đối chiếu.
- Không có PII: chỉ mã và `requestId`.

**Giả định 5 – bỏ nhắc sáng khi đã có tin quá hạn sáng nay: ARC chấp nhận.** Đúng chữ 8.4 ("bỏ qua nếu `overdue_notified_at ≥ front_desk_hours.from` hôm nay").
- Hệ quả BE nêu (worker trở lại sau 08:30 thì yêu cầu ngoài giờ thường chỉ nhận tin quá hạn) là **tốt hơn**: chỉ một tin, mà tin quá hạn lại có `<users/all>` nên mạnh hơn tin sáng.
- Yêu cầu "cần gọi ngay" đã quá hạn từ ban đêm vẫn nhận tin sáng. Test "worker back at 10:00" khóa đúng ca này.
- Khi chạy bình thường không có tin trùng lúc 07:30: nhánh quá hạn chạy trước, cùng `now`, trong cùng handler.
- PO lưu ý: theo mặc định ORC Q5, tin sáng **không** có `<users/all>`. Thành viên đặt "chỉ khi được nhắc tên" sẽ không được báo lúc 07:30 với yêu cầu kênh `phone`, chỉ được báo lúc 08:30. Đây vẫn là câu PO Q5, không phải lỗi.

## 3. Quyết định thứ tự migration (ARC)

**Bối cảnh đã kiểm:**
- `main` dừng ở `0088` (idx 64). BE-A `be-a-v1.0.1` có `0089_simulation_guard_room_price_cancel`: tạo bảng `simulation_guard`, trigger chặn commit ADR-015, `GRANT DELETE ON room_list_price`. `when` = 0088 + 2000. **Chưa có PR.**
- PR #16 có `0090_privacy_notice_append_only` ở idx 65, `when` = 0088 + 4000. Snapshot 0090 = **nội dung 0088** (`prevId` = id 0088), tức là **không có** `simulation_guard`.
- Migrator drizzle chỉ chạy những mục có `when` lớn hơn dòng mới nhất trong `drizzle.__drizzle_migrations`.

**Hai cách gộp sai, và cái nào CI không bắt:**
1. PR #16 lên `main` và deploy trước, rồi BE-A rebase và chèn 0089 vào **trước** 0090 trong `_journal.json`. `when` vẫn tăng dần nên `migrations-journal.test.ts` xanh. Nhưng staging/production đã chạy 0090, nên **0089 bị bỏ qua im lặng**. Kết quả: không có `simulation_guard` (mất bảo đảm DB của B16 dry run, ADR-015) và hủy giá lịch sẽ lỗi quyền. **CI không bắt**, vì DB test luôn mới.
2. BE-A lên trước, PR #16 chỉ sửa `prevId` như báo cáo BE mục 1.6. Snapshot 0090 vẫn thiếu `simulation_guard`. Bước CI "drizzle-kit generate creates no file" **có bắt** (sẽ đòi tạo file DROP). Nhưng hướng dẫn của BE thiếu bước này.

**Quyết định: tách PN-01 khỏi PR #16. Phần Chat không chờ BE-A. 0090 không bao giờ lên `main` trước 0089.**

Lý do:
- Phần Chat theo thiết kế 8.14 không có migration. Gắn nó vào BE-A (chưa có PR) là đặt BE-A lên đường găng của v1.0.1, trong khi lịch đã căng (R11).
- Tách ra thì cách sai số 1 không xảy ra được, không phụ thuộc người gộp có nhớ hay không.
- PN-01 nhỏ (1 migration không đổi schema, 1 allowlist, 2 test), review lại nhanh.

Cách làm:

| # | Ai | Việc |
|---|---|---|
| 1 | BE | Trên `be/gchat-booking-notify`: `git revert --no-edit 1420521e db29b4ca`. Revert, không force-push, để giữ lịch sử review. Tệp 0090, snapshot, mục journal, `audit-entities.ts` (phần `privacy_notice_version`), `privacy-notice-append-only.test.ts` và đoạn thêm trong `worker-audit-registry.test.ts` rời PR. Sửa báo cáo mục 1.6 và dòng decision-log của BE ý (7): "PN-01 tách sang PR riêng, gộp sau BE-A". CI xanh lại |
| 2 | BE | Nhánh mới `be/privacy-notice-append-only` cắt từ `main` **sau khi PR BE-A (0089) đã gộp**: `git cherry-pick db29b4ca 1420521e`, rồi: (a) `0090_snapshot.json` = **nội dung `0089_snapshot.json`**, `id` = UUID mới, `prevId` = `018c5475-b982-44a7-93ef-731f6dac0f18` (id 0089); (b) `_journal.json` idx 66, `when` = `when` 0089 + 2000 (= `1792782169681`, giữ nguyên nếu 0089 không đổi); (c) CI "drizzle-kit generate creates no file" xanh; (d) chạy `infra/server/test/publish-privacy-notice.test.sh` trên stack đã có 0090, để thấy câu UPDATE thật của `publish-privacy-notice.sql` qua được trigger. Review: ARC + SEC (rút gọn) |
| 3 | ORC | Nên gộp PR PN-01 **trước** bước 5 của 8.8 (ghi phiên bản `2026-10-31` bằng `publish-privacy-notice.sh`), để lần thay phiên bản đầu tiên chạy qua trigger. Nếu BE-A trễ khỏi v1.0.1 thì PN-01 đi cùng BE-A ở bản sau. Trigger chỉ là lớp phòng thủ thêm, mã OPS đã chỉ-thêm-dòng, nên **không** đổi số để chen lên trước |

Luật chung, ghi vào decision-log, áp cho mọi PR có migration từ nay:
- Migration lên `main` **sau** thì lấy số kế tiếp và `when` = `when` lớn nhất trên `main` + 2000.
- Snapshot = nội dung snapshot ngay trước nó (đổi `id`/`prevId`).
- **Không bao giờ chèn** một mục vào trước mục đã có trên `main`.
- Thẻ GC-07 đề nghị CI tự kiểm luật này.

## 4. Thẻ feedback

### FB-R3-ARC-BE-GC-01
- Mức độ: Major
- Vị trí: commit `db29b4ca` + `1420521e` – `src/db/migrations/0090_privacy_notice_append_only.sql`, `meta/0090_snapshot.json`, `meta/_journal.json`; báo cáo BE mục 1.6
- Vấn đề: PR #16 mang migration 0090, có `when` lớn hơn 0089 của BE-A, trong khi 0089 chưa có PR. Có hai lỗi:
  - Nếu PR #16 lên `main` trước, rồi BE-A chèn 0089 vào trước 0090 trong journal, test journal vẫn xanh nhưng staging/production **bỏ qua 0089 im lặng** (migrator drizzle chỉ chạy `when` lớn hơn dòng mới nhất).
  - Hướng dẫn "người gộp sau sửa `prevId`" thiếu bước thay nội dung snapshot 0090 bằng snapshot 0089 (có `simulation_guard`).
- Vì sao quan trọng: mất `simulation_guard` trên production là mất bảo đảm mức DB của B16 dry run (ADR-015, FB-R3-SEC-ARC-01). Hủy giá lịch (BUG-R3-018) lỗi quyền. Phần Chat lại bị buộc vào lịch của BE-A, dù tự nó không cần migration.
- Đề xuất sửa: theo mục 3 – revert 2 commit khỏi PR #16; PN-01 thành PR riêng cắt sau khi BE-A gộp, snapshot = nội dung 0089, idx 66, `when` = 0089 + 2000, chạy `publish-privacy-notice.test.sh` với trigger.
- Trạng thái: Open

### FB-R3-ARC-BE-GC-02
- Mức độ: Minor (phải xong trước khi đặt C trên production)
- Vị trí: `src/modules/public-site/public/chat-message.ts` – `chatSafeText`, hằng `CONTROL`, `BIDI`, `DOMAIN_DOT`
- Vấn đề: ARC chạy thử, có 3 cách vượt bước 2 và bước 4:
  - `"evil​.example/login"` và `"evil.​example"` giữ nguyên dấu chấm. Ký tự rộng-0 (Cf) không bị bỏ, và nó làm hỏng điều kiện nhìn trước/nhìn sau.
  - `"x̃.com"` giữ nguyên: dấu kết hợp (\p{M}) đứng trước dấu chấm không có dạng dựng sẵn, NFC không gộp được.
  - Tên chứa ` ` (Zl) không bị gộp dòng, vì `singleLine` chỉ xét `\n`.
  - `U+061C` (dấu Ả Rập, Cf) không có trong `BIDI`.
  - Lời nhắn nằm trong khối mã nên rủi ro thấp. **Tên** (80 ký tự, ngoài khối mã) vẫn có thể thành link IDN bấm được, hoặc giả một dòng thứ hai.
- Vì sao quan trọng: SEC ★5 / R10 – chữ người ngoài gõ đi vào phòng nhân viên tin tưởng. Đây là điều kiện để bật C.
- Đề xuất sửa:
  - bỏ mọi `\p{Cf}`, trừ U+200D khi đứng giữa hai emoji; giữ `BIDI` làm tài liệu;
  - gộp `[  \u0085]` như `\n`;
  - đổi lookbehind của `DOMAIN_DOT` thành `[\p{L}\p{N}\p{M}]`, và cho phép tối đa 1 ký tự Cf đã bị bỏ trước đó (bỏ Cf trước bước 4 là đủ);
  - thêm 4 chuỗi trên vào test 3a;
  - INT thêm 2 ca (ZWSP, dấu kết hợp) vào 5 ca ★5 trên phòng thử.
- Trạng thái: Open

### FB-R3-ARC-BE-GC-03
- Mức độ: Minor
- Vị trí: `chat-message.ts` dòng 5 (chú thích dẫn tới `test/worker-chat-composition.test.ts`); báo cáo BE mục 1.6, mục 3, mục 5; decision-log dòng BE ý (7)
- Vấn đề: tệp test được dẫn không tồn tại; kiểm tra thật nằm trong `test/gchat-units.test.ts` ("chat-message.ts is wired by src/worker-chat.ts"). Báo cáo và decision-log còn ghi "0090 gộp sau 0089".
- Vì sao quan trọng: người bảo trì sau tìm không thấy test khóa bài học PR #14. Tài liệu lệch với quyết định ở mục 3.
- Đề xuất sửa: sửa chú thích sang `test/gchat-units.test.ts`; cập nhật báo cáo và decision-log theo GC-01.
- Trạng thái: Open

### FB-R3-ARC-BE-GC-04
- Mức độ: Minor (gửi ORC/OPS – thủ tục deploy, không sửa mã)
- Vị trí: `infra/docker-compose.prod.yml` secret `booking_request_chat_webhook`; `deploy.sh` dòng 109–113 (rủi ro R1)
- Vấn đề: bản v1.0.1 thêm một secret. `deploy.sh` kiểm từ trước bước pull và **từ chối sạch** khi thiếu tệp (in lệnh `init-secrets.sh`), nên không có downtime. Nhưng lượt deploy v1.0.1 sẽ hỏng nếu OPS quên.
- Vì sao quan trọng: v1.0.1 (04/11) có nhiều thay đổi đi cùng. Một lần deploy thất bại trên production phải chạy lại cả cửa sổ.
- Đề xuất sửa:
  - OPS thêm vào checklist phát hành v1.0.1: chạy `sudo …/init-secrets.sh` (không cờ) trên **staging trước, production sau**, rồi kiểm `ls -l …/secrets/booking_request_chat_webhook` (uid 1000, 0400, 0 byte) **trước** khi đẩy tag;
  - `appconfig` của image mới phải thấy `chat: off {reason: NOT_CONFIGURED}` khi tệp rỗng.
  - ARC chấp nhận thiết kế "tệp rỗng = tắt" của BE.
- Trạng thái: Open

### FB-R3-ARC-BE-GC-05
- Mức độ: Suggestion
- Vị trí: `infra/server/bin/init-secrets.sh` nhánh `--set-booking-chat`
- Vấn đề:
  - Thiết kế G2 ghi `umask 077`, nhưng nhánh này không đặt. Tệp `.tmp` được tạo với umask của sudo (thường 022), nên có một khoảnh khắc ngắn tệp đọc được với quyền 0644 trước khi `chmod 0400`. Thư mục secrets không cho user khác đi qua (đã có trong chú thích), nên rủi ro thực rất thấp.
  - Lệnh kiểm trong image trả mã khác 0/3 (ví dụ image cũ không có tool) thì chỉ dựa vào luật bash. Đúng thiết kế, nhưng không in ra cho người chạy biết.
- Vì sao quan trọng: đúng chữ G2, phòng thủ theo lớp.
- Đề xuất sửa: thêm `umask 077` đầu nhánh (hoặc tạo tệp tạm bằng `install -m 0400 -o 1000 -g 1000 /dev/null`); in `checked: bash rule only (image tool not available)` khi `rc` khác 0/3.
- Trạng thái: Open

### FB-R3-ARC-BE-GC-06
- Mức độ: Suggestion
- Vị trí: `src/worker-chat.ts` `resolveChatConfig` – `env.ADMIN_BASE_URL || env.APP_BASE_URL`
- Vấn đề: thiết kế G3 chỉ nói `ADMIN_BASE_URL`. Biến dự phòng `APP_BASE_URL` có thể là host khác Desk. Production an toàn nhờ so đúng `desk.ottimo.vn`, nhưng staging/demo có thể ra link sai mà vẫn `on`.
- Vì sao quan trọng: link "Mở Desk" là điểm neo chống tin giả.
- Đề xuất sửa: ở `staging`/`production` chỉ đọc `ADMIN_BASE_URL`; giữ dự phòng cho `dev`/`test`.
- Trạng thái: Open

### FB-R3-ARC-BE-GC-07
- Mức độ: Suggestion (BE + OPS, sau v1.0.1)
- Vị trí: `test/migrations-journal.test.ts`, `.github/workflows/ci.yml`
- Vấn đề: test journal chỉ kiểm `when` tăng dần trong **một** bản. Nó không bắt được cách sai số 1 ở mục 3 (chèn vào trước một mục đã có trên `main`).
- Vì sao quan trọng: bỏ sót migration im lặng trên staging/production là lỗi khó thấy nhất của drizzle.
- Đề xuất sửa: thêm một bước CI cho PR: journal của `origin/main` phải là **tiền tố** của journal trên nhánh (cùng `tag` và `when` theo đúng thứ tự). Mục mới chỉ được nối vào cuối, và `when` của nó phải lớn hơn mọi `when` trên `main`.
- Trạng thái: Open

## 5. Điều kiện

**Để gộp PR #16:**
1. GC-01 bước 1 xong (revert 2 commit PN-01) và CI xanh lại trên head mới.
2. GC-03 xong (chú thích + báo cáo + decision-log).
3. SEC review diff (N6) và QA đã xem theo ma trận review. ARC không cần xem lại nếu diff mới chỉ là revert cộng tài liệu.

**Để đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` trên production** (ngoài ★1–★8 của SEC):
- GC-02 đã gộp;
- INT đã kiểm trên phòng thử (★1, ★5 thêm 2 ca, `threadKey`, `<users/all>`).

**Trước lượt deploy v1.0.1:** GC-04 (OPS chạy `init-secrets.sh` trên staging rồi production).

**PR PN-01:** theo mục 3, sau BE-A.

Dòng decision-log đề nghị ORC ghi:
`| 2026-10-30 | 3 | ARC – review PR #16 Chat: Duyệt có điều kiện. Migration: PN-01 (0090) tách khỏi PR #16, thành PR riêng gộp sau BE-A 0089 (snapshot = nội dung 0089, idx 66, when = 0089 + 2000). Luật chung: migration lên main sau lấy số kế tiếp, when = max trên main + 2000, không chèn trước mục đã có. Chấp nhận giả định BE 2 (tin xóa có "Mở Desk") và 5 (bỏ nhắc sáng khi đã có tin quá hạn sáng nay) | ARC | Quyền ARC (kỹ thuật) |`

## 6. Điểm làm tốt (nên giữ)

- **Mức hiệu lực tính lúc gửi, và có hai lớp khóa.** Hằng phiên bản không cấu hình được; SQL liên hệ chỉ được gọi ở C và bị khóa bằng spy. Đây đúng là cách để "C ngay từ v1.0.1" mà không lộ dữ liệu khi landing, api và `.env` lệch thời điểm.
- **Bộ phát chép đúng mẫu email**, kể cả SAVEPOINT cho lỗi render và giảm lỗi undici về mã. Có thêm test log canh trên toàn bộ bộ test. Đường đua "xóa WR8 trong lúc tin đầu đang gửi" được nghĩ tới và xử lý bằng `staffChatState` ở cả hai phía.
- **Tách commit PN-01 ngay từ đầu, và nêu rõ phụ thuộc thứ tự gộp.** Nhờ vậy quyết định ở mục 3 chỉ cần một lệnh revert.

---

## Lượt 2 – xác nhận bản sửa (30/10/2026)

- Người review: ARC | Round 3 – bước **Phản hồi & sửa** | Đối tượng: PR #16 head `9520cec1` (so với `main` `e1b9f311`, `main` là tổ tiên của head). Trả lời của BE: `rounds/round-03/responses/BE-gchat-notify.md`.
- Commit mới: `0d13aed8`, `cac5c9cc` (revert PN-01) · `9e0e889c` (sửa theo ARC + SEC) · `9520cec1` (merge `main`, chỉ mang hồ sơ review).
- Cách kiểm: đọc diff `origin/main..9520cec1` (32 tệp, +3622/−14); chạy lại `test/gchat-units.test.ts` cục bộ (58/58); chạy thử `chatSafeText`/`chatSafeEmail` với 23 chuỗi biên (tệp test tạm, đã xóa, nhánh sạch); xem CI của PR. **Không chạy** bộ test cần DB (dựa vào CI và số BE báo). Không gộp, không đăng lên PR, không commit.

### Kết luận lượt 2: **Duyệt – phía ARC, PR #16 gộp được**

Major GC-01 đã xử lý đúng. GC-02, GC-03, GC-05, GC-06 sửa đúng đề xuất. CI xanh trên head `9520cec1`. Điều kiện còn lại để gộp không thuộc ARC (SEC xác nhận lượt 2, QA theo ma trận review).

### Đối chiếu từng thẻ

| Thẻ | Kiểm gì | Kết quả |
|---|---|---|
| GC-01 (Major) | `git diff origin/main 9520cec1 -- src/db` **rỗng**: thư mục migration dừng ở `0088`, không còn `0090_*.sql` / `0090_snapshot.json`; `_journal.json` **giống hệt** `main` (0 dòng diff). Không còn `privacy_notice_version` trong allowlist audit, không còn `privacy-notice-append-only.test.ts`, `worker-audit-registry.test.ts` không đổi so với `main`. Revert bằng 2 commit mới, không force-push. Báo cáo BE mục 1.6/5 và decision-log ý (7) ghi "PN-01 tách, PR riêng sau BE-A 0089" | **Closed** |
| GC-02 (Minor) | `FORMAT = /\p{Cf}/gu` bỏ trước bước 4, giữ U+200D chỉ giữa hai pictograph; `LINE_BREAKS` U+2028/2029/0085 → `\n`; `DOMAIN_DOT` lookbehind `[\p{L}\p{N}\p{M}]`. Chạy thử: `evil<ZWSP>.example/login` → `evil[.]example/login`; `evil.<ZWSP>example`, `evil<WJ>.<BOM>example`, `evil<SHY>.com`, `evil.c<ZWSP>om` → `[.]`; `x̃.com` → `x̃[.]com`; tên có U+2028 → một dòng; U+061C bị bỏ; `http:/<ZWSP>/evil.com` → `http[:]//evil[.]com`; dấu chấm toàn/nửa độ rộng → `[.]`; emoji gia đình ZWJ nguyên vẹn; `1.5` giữ nguyên. Test 3a có đủ 4 chuỗi ARC nêu | **Closed** |
| GC-03 (Minor) | Chú thích đầu `chat-message.ts` trỏ `test/gchat-units.test.ts` ("chat-message.ts is wired by src/worker-chat.ts") và `test/integration/gchat-worker-only.test.ts` – cả hai tồn tại. Báo cáo + decision-log khớp mục 3 | **Closed** |
| GC-04 (Minor, OPS) | Không có mã; BE ghi vào mô tả PR mục "For OPS". Vẫn là điều kiện **trước lượt deploy v1.0.1**, không chặn gộp | Chuyển OPS (Open) |
| GC-05 (Suggestion) | `umask 077` là dòng đầu nhánh `--set-booking-chat` (nhánh `exit 0` ở cuối, nên không ảnh hưởng các tệp mặc định phía sau); `rc` khác 0/3 in `checked: bash rule only (image tool not available)`. shellcheck xanh trong CI | **Closed** |
| GC-06 (Suggestion) | `resolveChatConfig`: `dev`/`test` dùng `ADMIN_BASE_URL \|\| APP_BASE_URL`, mọi `APP_ENV` khác chỉ `ADMIN_BASE_URL`. Có test "production chỉ có `APP_BASE_URL` → `off` + `CHAT_LINK_BASE_INVALID`" | **Closed** |
| GC-07 (Suggestion) | BE + OPS làm sau v1.0.1 – ARC đồng ý, giữ trong nợ kỹ thuật | Deferred |

Các sửa theo SEC (GCHAT-01 email mẫu chặt, `://` và `<>` luôn vô hiệu; 02 IPv4 + bỏ `*_~` ở tên; 04 kiểm lại `pii_purged_at` ngay trước POST mức C) ARC đã xem về mặt kiến trúc: `recheck` chỉ gắn ở mức C, chạy trong giao dịch riêng ngay trước `deliver`, câu SELECT không có cột C2 – đúng mẫu bộ phát, không thêm truy vấn cho A/B. Kết luận về nội dung bảo mật là của SEC.

Thay đổi ngoài phạm vi thẻ: `infra/server/test/publish-privacy-notice.test.sh` thêm `booking_request_chat_webhook` vào danh sách secret rỗng của stack test – cần thiết vì compose production nay khai báo secret này. Hợp lệ.

### Ghi chú mới (không chặn, không tạo thẻ)

- `x.<dấu kết hợp>com` (dấu kết hợp **sau** dấu chấm) giữ nguyên vì lookahead chỉ nhận `\p{L}`. Linkifier của Chat không coi `.̃com` là tên miền, nên ARC không đòi sửa. INT có thể thêm ca này vào lượt kiểm ★5 trên phòng thử cho chắc; nếu Chat biến nó thành link thì đổi lookahead thành `(?=\p{M}*\p{L})`.
- `http：//evil.com` (dấu hai chấm toàn độ rộng) giữ `：//` nhưng tên miền đã thành `evil[.]com`, không bấm được. Không cần sửa.

### Điều kiện còn lại

**Để gộp PR #16:**
1. ~~GC-01, GC-03, CI xanh~~ – xong (phía ARC).
2. SEC xác nhận lượt 2 cho GCHAT-01/02/04 (quyền SEC).
3. QA đã xem theo ma trận review.

**Để đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` trên production:**
- GC-02 – xong trong PR này (gộp là đủ);
- INT kiểm trên phòng thử: ★1, ★5 + 2 ca ARC (ZWSP, dấu kết hợp) + 2 ca SEC (`1.2.3.4/login`, `*TEST*`), `threadKey`, `<users/all>`, `messageId` (SEC 05);
- ★1–★8 của SEC; phiên bản thông báo `2026-10-31` đã ghi bằng `publish-privacy-notice.sh`.

**Trước lượt deploy v1.0.1:** GC-04 (OPS chạy `init-secrets.sh` không cờ trên staging rồi production, kiểm `uid 1000, 0400, 0 byte`, `appconfig` thấy `chat: off {reason: NOT_CONFIGURED}`).

**PR PN-01** (`be/privacy-notice-append-only`): theo mục 3, cắt sau khi BE-A 0089 gộp; ARC + SEC review rút gọn.

Dòng decision-log đề nghị ORC ghi:
`| 2026-10-30 | 3 | ARC – lượt 2 PR #16 (Chat, head 9520cec1): Duyệt phía ARC. GC-01 revert sạch (không migration, journal = main); GC-02/03/05/06 đóng; GC-04 chuyển OPS trước deploy v1.0.1; GC-07 sau v1.0.1. PN-01 vẫn PR riêng sau BE-A 0089 | ARC | Quyền ARC (kỹ thuật) |`
