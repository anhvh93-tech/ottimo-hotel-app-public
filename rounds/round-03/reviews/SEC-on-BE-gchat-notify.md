# SEC review – BE tin Google Chat cho yêu cầu đặt phòng website (PR #16, v1.0.1)

- Người review: SEC | Round 3 – Review (v1.0.1) | 30/10/2026
- Đọc tại nhánh `be/gchat-booking-notify`, commit `1420521e` (`git diff 8dd3a651..1420521e`, worktree `agent-ad2aa6ee3eefa95e9`, chỉ đọc). CI của PR xanh (lint, test, build, E2E smoke, gitleaks, shellcheck).
- Đối chiếu: `outputs/SEC/esc041-gchat-full-details.md` (★1–★8), `reviews/SEC-on-us155-enable.md` mục 4 (GCHAT-02), `outputs/ARC/gchat-booking-request-notify.md` mục 8, báo cáo `outputs/BE/gchat-booking-notify.md` (trong nhánh).
- Đã đọc toàn bộ: `chat-message.ts`, `chat-dispatch.ts`, `worker-chat.ts`, `google-chat.ts`, `safe-config.ts` (`parseBookingChatWebhook`, luật biến thường), `staff-chat.ts`, `check-chat-webhook.ts`, migration `0090`; phần diff của `worker.ts`, `worker-jobs.ts`, `public-booking.service.ts`, `website-requests.service.ts`, `events.service.ts`, `init-secrets.sh`, `docker-compose.prod.yml`, `check-compose.sh`, các tệp `env*.example`. Đối chiếu thêm `normalizeEmail` (`guests/public/normalize.ts`) và phần kiểm form (`public-booking.service.ts` 520–640). Đọc chọn lọc `gchat-units.test.ts`. SEC không chạy lại test.
- Tệp này không chứa dữ liệu thật, URL webhook hay khóa. Ví dụ tấn công chỉ dùng tên miền `evil.example`.

## Tóm tắt

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 2 |
| Suggestion | 2 |

**Kết luận: Duyệt có điều kiện.**

Điều kiện gộp:
1. **Sửa FB-R3-SEC-BE-GCHAT-01 (Major) ngay trong PR này, kèm test.** Lỗi: địa chỉ email đi vào tin mức C mà chưa vô hiệu link, nên có thể thành link lừa bấm được trong phòng nhân viên. Sửa nhỏ, khoảng 1 giờ. Thẻ này chỉ ảnh hưởng mức C. Nếu ORC buộc phải gộp trước thì production **không được đặt C** cho tới khi bản sửa lên.
2. Thứ tự migration 0089 (BE-A) → 0090 (PR này) theo báo cáo BE mục 1.6. Đổi số không được đổi nội dung trigger.

Không chặn gộp: thẻ 02, 03 nên làm trong v1.0.1 nếu kịp, không thì v1.0.2. Thẻ 04, 05 do tác giả tự cân nhắc.

Việc đặt **C trên production** vẫn theo esc041 mục 3: SEC chỉ ghi dòng decision-log xác nhận khi đủ ★1–★8. PR này đáp ứng phần mã của ★2, ★3, ★5 (sau khi sửa thẻ 01) và ★6. ★1, ★4, ★7, ★8 là việc INT, INV, OPS, FE-B, chưa xong.

## Đối chiếu yêu cầu SEC

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| GCHAT-02 – bí mật dạng tệp, chỉ worker đọc | **Đạt** | Compose: secret `booking_request_chat_webhook` chỉ khai ở worker, `_FILE=/run/secrets/…`. `check-compose.sh`: `WORKER_ONLY_SECRETS`, `PLAIN_SECRETS` có `BOOKING_REQUEST_CHAT_WEBHOOK_URL`, dịch vụ khác nhận `BOOKING_REQUEST_CHAT_*` thì FAIL. `findUnsafeIntegrationConfig` từ chối biến thường ở staging/production. `init-secrets.sh`: mặc định tạo tệp rỗng, `umask 077` (dòng 64), `read -rs`, `[ -t 0 ]`, ghi tệp tạm rồi `mv`, quyền 0400 uid 1000, chỉ in độ dài. |
| GCHAT-02 – kiểm URL, chống SSRF | **Đạt** | `parseBookingChatWebhook`: kiểm cả chuỗi gốc bằng regex neo `^https://chat\.googleapis\.com/v1/spaces/<id>/messages\?`, nên không lọt chữ hoa, dấu chấm cuối, userinfo hay `..`. Sau đó kiểm `hostname`, cổng, fragment, query đúng 2 khóa `key` và `token`, mỗi khóa một lần, không rỗng, tối đa 512 ký tự. Client: `redirect: 'error'`, timeout 5 s, `URLSearchParams.set` trên bản sao, `threadKey` và `messageId` có regex. 3xx → `dead`. `ADMIN_BASE_URL` (G3): production phải đúng `desk.ottimo.vn`, cấm IP, userinfo, cổng, path. Lệnh kiểm `check-chat-webhook.js` đọc URL từ stdin, không in gì, `docker run --network none`. |
| Không log URL, token hay nội dung | **Đạt** | Log của dispatcher chỉ có `outboxId`, `kind`, `attempt` và mã ngắn. Lỗi render chỉ log `err.name`. `chatErrorCode` không bao giờ lấy message của undici. Thân phản hồi bị `cancel()`. Log khởi động chỉ `chat: on/off` + mã lý do và `chat detail level`. `errorTag` của worker chỉ có name + code. Test "log canh" bao toàn bộ log của bộ test (tên, SĐT, email, lời nhắn, `chat.googleapis`, `key=`, `token=`). |
| ★3 – mức A/B/C, thiếu hoặc sai → A | **Đạt** | `parseChatDetailLevel`: `trim().toUpperCase()`, rỗng → A, sai → A + `CHAT_DETAIL_LEVEL_INVALID`. Compose dùng `${…:-A}`. Mức đọc lúc gửi. Chỉ worker nhận biến này (check-compose chặn dịch vụ khác). |
| ★2 – chặn theo `consent_version` / `published_at` | **Đạt** | `effectiveLevel`: so `published_at` của (`consent_version`, `locale`) với `min(published_at)` của hằng `2026-10-31` cùng tổ chức. Thiếu một trong hai giá trị, hoặc cũ hơn → A + `levelCapped`. Không so chuỗi. Migration 0090 khóa `privacy_notice_version` chỉ được thêm dòng (kể cả `ottimo_owner`), nên không ai sửa lùi được `published_at` để mở cổng. Test tích hợp có ca `2026-10-24` + C → không chi tiết. |
| ★5 – `chatSafeText` | **Đạt cho tên và lời nhắn. Chưa đạt cho email (thẻ 01)** | Đúng thứ tự ARC 8.5: kiểm lại thẻ và giấy tờ (thay cả trường), bỏ ký tự điều khiển và bidi, `<>` → `‹›`, bỏ backtick, `://` → `[:]//`, dấu chấm kiểu tên miền → `[.]`, cắt theo grapheme, lời nhắn trong khối mã, dòng "Mở Desk" luôn cuối. Email đi nhánh `domains: false` nên **không** qua bước vô hiệu link. |
| ★6 – tin nhắc giữ mẫu A | **Đạt** | `DETAIL_KINDS = ['web_request_new']`. Các kind `overdue`, `morning`, `erased` luôn A. `<users/all>` do mã đặt, chỉ ở tin quá hạn. Chữ khách nhập không tạo được cú pháp này vì `<` đã bị thay. |
| A/B không đọc cột C2 | **Đạt** | `CHAT_BASE_SQL` không có cột C2. `readChatContact` chỉ được gọi khi `level === 'C'` sau cổng ★2. Test spy kiểm A, B và mọi ca bị chặn; test khóa tĩnh kiểm `CHAT_CONTACT_SQL` đúng 5 cột. `morningNudge` chỉ chọn `id`. |
| WR8 | **Đạt** | Tin đầu chưa gửi mà yêu cầu đã xóa → `SKIPPED_GONE` (kiểm `pii_purged_at` lúc render). Xóa sau khi tin đầu đã hoặc có thể đã đăng → tin `web_request_erased` không có PII, worker kiểm lại `posted` trước khi gửi. Còn một khe nhỏ ở thẻ 04. |
| Outbox chỉ có id, không lưu chữ | **Đạt** | `enqueueStaffChat`: payload chỉ `kind/refType/refId`, `refId` phải là UUID, danh sách kind đóng, `ON CONFLICT DO NOTHING`. |

## Thẻ feedback

### FB-R3-SEC-BE-GCHAT-01
- Mức độ: Major
- Vị trí: `product/services/api/src/modules/public-site/public/chat-message.ts` `contactLines` (dòng 233–237: `chatSafeText(c.email, {…, domains: false})`); `chatSafeText` dòng 183–185; gốc ở `guests/public/normalize.ts` `normalizeEmail`.
- Vấn đề: ở mức C, email đi qua `chatSafeText` với `domains: false`, nên bỏ qua **cả** bước `://` → `[:]//`, không chỉ bước vô hiệu tên miền. `normalizeEmail` chỉ kiểm phần trước `@` dài 1–64 ký tự và không có khoảng trắng; nó **cho qua** `:`, `/`, `?`, `=`, `*`, `_`, `~`, `|`. Ví dụ email `https://evil.example/login@ottimo.vn` hợp lệ ở form (kênh Email). Tin mức C sẽ có dòng `Liên hệ: https://evil.example/login@ottimo.vn · kênh: Email`. Dòng này nằm ngoài khối mã, nên Google Chat sẽ biến nó thành link bấm được tới `evil.example`. Cờ `contains_url` không bắt được vì `containsUrl` chỉ quét tên và lời nhắn (`public-booking.service.ts:635`). Test hiện chỉ có ca email lành `a.b@example.invalid`.
- Vì sao quan trọng: đây đúng là kịch bản ★5 muốn chặn. Người ngoài đưa một link lừa vào phòng mà nhân viên tin tưởng, ngay cạnh tên khách, trông như liên hệ thật. Nó cũng phá câu chống tin giả G5/N5 trong sổ tay: "mọi link trong lời khách đã bị vô hiệu".
- Đề xuất sửa:
  1. Lúc dựng tin, email chỉ được in khi khớp mẫu chặt: phần trước `@` theo `^[a-z0-9._%+-]{1,64}$`, phần sau `@` theo đúng luật nhãn của `normalizeEmail`. Không khớp thì in `(email có ký tự đặc biệt – xem trên Desk)`. Email thật của khách gần như luôn khớp mẫu này.
  2. Phòng thủ thêm: kể cả với email, vẫn luôn chạy `://` → `[:]//` và `<>`. Chỉ giữ ngoại lệ "không đổi dấu chấm tên miền".
  3. Test 3a thêm các ca: `https://evil.example/login@ottimo.vn`, `x|y@example.invalid`, `*a*@example.invalid`, `‹users/all›@example.invalid`. Đầu ra không chứa `://`; cả trường bị thay bằng câu "xem trên Desk".
  4. (Không bắt buộc trong PR này, BE-A hoặc BE tự cân nhắc) siết `normalizeEmail` ở bước nhận form theo cùng mẫu. Thay đổi này ảnh hưởng form, nên phải báo FE-B và QA.
- Trạng thái: Open

### FB-R3-SEC-BE-GCHAT-02
- Mức độ: Minor
- Vị trí: `chat-message.ts` `DOMAIN_DOT` (dòng 144) và `contactLines` (dòng tên khách).
- Vấn đề: (a) `DOMAIN_DOT` chỉ đổi dấu chấm khi sau nó là chữ cái, nên địa chỉ IP như `1.2.3.4/login` giữ nguyên. Với lời nhắn thì không sao vì nằm trong khối mã. Nhưng **tên khách nằm ngoài khối mã** (dòng `Khách:`), nên Chat có thể tự biến một IP trần hoặc `1.2.3.4:8080/x` thành link (chưa xác minh). (b) Tên ngoài khối mã vẫn nhận định dạng `*đậm*`, `_nghiêng_`, `~gạch~`. Rủi ro này chỉ ở mức hiển thị.
- Vì sao quan trọng: tên là trường người ngoài tự gõ, đứng ngay sau nhãn hệ thống. ★5 yêu cầu "không link nào bấm được ngoài link Desk".
- Đề xuất sửa: trong `chatSafeText`, thêm luật đổi dấu chấm `[.]` cho cụm dạng IPv4 (`\d{1,3}(\.\d{1,3}){3}`). Với tên, bỏ hoặc thay `*`, `_`, `~` bằng dấu cách. Tên người thật hầu như không có các ký tự này. INT thêm vào lượt kiểm trên phòng thử hai ca: tên `1.2.3.4/login` và tên `*TEST*`.
- Trạng thái: Open

### FB-R3-SEC-BE-GCHAT-03
- Mức độ: Minor
- Vị trí: `product/infra/server/env.production.example`; runbook OPS (đổi mức); `chat-message.ts` hằng `CHAT_DETAILS_MIN_NOTICE_VERSION`.
- Vấn đề: chọn biến môi trường thay `config_parameter` (SEC đồng ý, xem Q1) nghĩa là việc đổi mức **không có `audit_event`**. Hiện chỉ còn dấu vết là dòng log `chat detail level` lúc worker khởi động. Ngoài ra, cổng ★2 chỉ có chiều "từ phiên bản X trở đi". Nếu sau này có một thông báo mới bỏ Google Chat ra khỏi danh sách bên nhận, mã vẫn gửi C.
- Vì sao quan trọng: mức C là thay đổi về dữ liệu cá nhân. Cần biết ai đổi, khi nào, theo dòng decision-log nào.
- Đề xuất sửa: (1) OPS ghi vào runbook: mỗi lần đổi `BOOKING_REQUEST_CHAT_DETAIL_LEVEL` trên production thì ORC ghi một dòng decision-log (giá trị cũ → mới, giờ, người làm, dòng SEC làm căn cứ), rồi lưu dòng log `chat detail level` sau khi khởi động lại. (2) Thêm vào chú thích trên hằng: "Thông báo nào bỏ Google Chat thì phải hạ mức về A hoặc B trước khi đăng". SEC cũng sẽ ghi điều này vào yêu cầu cho mọi version thông báo sau.
- Trạng thái: Open

### FB-R3-SEC-BE-GCHAT-04
- Mức độ: Suggestion
- Vị trí: `chat-dispatch.ts` `claim` (render ở giao dịch 1) và `deliver` (POST sau đó).
- Vấn đề: chữ mức C được dựng trong giao dịch 1 rồi mới gửi, cách nhau tối đa khoảng 65 giây (ngân sách 60 s + timeout 5 s). Nếu WR8 `erase` chạy đúng trong khe này, chi tiết khách vẫn được đăng **sau** khi đã xóa. Tin `web_request_erased` sẽ theo sau trong luồng, nên phần hậu quả đã có đường xử lý.
- Vì sao quan trọng: khe rất nhỏ, nhưng câu "xóa khi khách rút đồng ý" là cam kết đã đăng.
- Đề xuất sửa: với tin mức C, ngay trước POST chạy một câu rẻ `SELECT pii_purged_at, status … WHERE id = $1`. Nếu đã purge hoặc đã spam thì đóng `SKIPPED_GONE` và không gửi. Không làm thì BA ghi khe này vào sổ tay ở bước xóa tay WR8 (N1).
- Trạng thái: Open

### FB-R3-SEC-BE-GCHAT-05
- Mức độ: Suggestion
- Vị trí: `chat-dispatch.ts` `CHAT_USE_MESSAGE_ID = false`.
- Vấn đề: khi tắt `messageId`, nếu worker sập giữa lúc POST và giao dịch 2, hoặc mất lease, cùng một tin có thể được đăng hai lần. Ở mức C, đó là hai bản sao PII. Các bản sao này vẫn tự xóa theo ★1, nên rủi ro thấp.
- Vì sao quan trọng: mục tiêu là giảm số bản sao dữ liệu khách.
- Đề xuất sửa: INT ưu tiên kiểm `messageId` trên phòng thử. Webhook nhận tham số này thì bật `CHAT_USE_MESSAGE_ID = true` trước khi đặt C. Nếu không nhận, ghi rõ vào báo cáo INT.
- Trạng thái: Open

## Trả lời câu hỏi ARC 8.13 cho SEC

**Q1 – Biến môi trường cho mức và hằng trong mã cho phiên bản tối thiểu: ĐỒNG Ý.**
- Biến môi trường `BOOKING_REQUEST_CHAT_DETAIL_LEVEL`, chỉ worker nhận: đạt ★3. Không có công tắc trên Desk hay API, nên không có đường leo quyền nào đổi được mức. Đổi mức là đổi `.env` production, nên phải báo INV trước, như luật đã có. Thiếu hoặc sai thì về A, đã kiểm trong mã.
- Hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` trong mã: đúng ý SEC, vì OPS không thể cấu hình sai điều kiện ★2. Đổi hằng thì phải qua PR có SEC review.
- Bù cho việc không có `audit_event`: thẻ 03 (decision-log + lưu dòng log khởi động mỗi lần đổi).
- Staging: chỉ đặt C khi tệp webhook trỏ phòng thử và dữ liệu là dữ liệu thử. Đây là quy trình, mã không tự phát hiện được.

**Q3 – Email ở mức C thành link `mailto:`: CHẤP NHẬN, có điều kiện.**
- Link `mailto:` chỉ mở ứng dụng thư để soạn thư tới chính địa chỉ khách đã nhập, không mở trang web. Rủi ro thấp, ngang với việc người trực chép địa chỉ từ Desk.
- Điều kiện 1: FB-R3-SEC-BE-GCHAT-01 đã sửa. Email chỉ được in khi khớp mẫu chặt, và không bao giờ còn `://` hay `<>`.
- Điều kiện 2: INT kiểm trên phòng thử rằng Chat chỉ tạo link `mailto:`, **không** tạo thêm link `https://` cho phần tên miền. Nếu Chat có tạo link web cho tên miền thì vô hiệu luôn dấu chấm trong tên miền của email (`ten@example[.]com`). Người trực vẫn đọc đúng địa chỉ, và Desk là nơi lấy địa chỉ gốc.

## Điểm làm tốt
- Cổng ★2 so bằng `published_at` thay vì so chuỗi. Thêm vào đó, migration 0090 khóa bảng thông báo ở mức DB, kể cả với `ottimo_owner`, nên điều kiện pháp lý không thể bị sửa ngầm. Thiết kế này vượt yêu cầu.
- Tách `CHAT_BASE_SQL` và `CHAT_CONTACT_SQL`, có spy kèm khóa tĩnh, nên chứng minh được mức A/B không chạm C2. Test log canh quét toàn bộ log của bộ test, không chỉ log của một hàm.
- Phần hạ tầng chặt: kiểm URL hai lớp (bash + chính luật của worker, chạy với `--network none`, URL qua stdin). Luật `check-compose` cũng chặn dịch vụ khác nhận bí mật hay biến Chat. Cấu hình sai không làm dừng worker mà tắt êm, có log mã lỗi.

## Dòng decision-log đề xuất

| 2026-10-30 | 3 | **SEC – review PR #16 (BE tin Google Chat, v1.0.1): Duyệt có điều kiện** (`rounds/round-03/reviews/SEC-on-BE-gchat-notify.md`). Phần mã đạt GCHAT-02 (bí mật tệp chỉ worker, kiểm URL chống SSRF, không log URL/token/chữ), ★2 (cổng `published_at` + bảng thông báo chỉ-thêm-dòng), ★3 (thiếu/sai → A), ★6 và A/B không đọc C2. Điều kiện gộp: sửa FB-R3-SEC-BE-GCHAT-01 (Major – email mức C chưa vô hiệu `://`, có thể thành link lừa) kèm test. Chưa sửa thì production không được đặt C. Q1 đồng ý (biến môi trường cho mức + hằng phiên bản, đổi mức ghi decision-log). Q3 chấp nhận `mailto:` khi đã sửa thẻ 01 và INT xác nhận Chat không tạo link web cho tên miền. Đặt C vẫn chờ SEC xác nhận đủ ★1–★8. | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật) |

---

## Lượt 2 – xác nhận bản sửa (head `9520cec1`)

- Người review: SEC | Round 3 – Phản hồi & sửa | 30/10/2026
- Đọc tại worktree `agent-ad2aa6ee3eefa95e9`, nhánh `be/gchat-booking-notify`, chỉ đọc. Đối chiếu `git diff 1420521e 9e0e889c` (bản sửa) và `git diff main...9520cec1` (toàn PR). Trả lời của BE: `rounds/round-03/responses/BE-gchat-notify.md`.
- CI của PR trên head `9520cec1`: xanh (format · lint · audit · test · build, E2E smoke, gitleaks, shellcheck, API contract, landing Playwright). SEC không chạy lại bộ test. SEC chạy thử riêng các biểu thức chính quy mới trên vài chuỗi biên (chỉ dùng `evil.example`, không dữ liệu thật).

### Kết quả theo thẻ

| Thẻ | Kết quả | Bằng chứng |
|---|---|---|
| GCHAT-01 (Major) – email mức C | **Đóng** | `chatSafeEmail` (`chat-message.ts`): `trim().toLowerCase()`, dài ≤ 254, khớp `CHAT_EMAIL` `^[a-z0-9._%+-]{1,64}@(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$`. Không khớp thì cả trường thành `(email có ký tự đặc biệt – xem trên Desk)`. Mẫu không cho `:` `/` `<` `>` `*` `\|` `~`. Phòng thủ thêm: `chatSafeText` nay **luôn** đổi `://` → `[:]//` và `<>` → `‹›` ở mọi trường, email chỉ giữ dấu chấm tên miền. Test `gchat-units.test.ts` dòng 478–482 có đủ 4 ca SEC đề xuất cộng `<users/all>@…`, `a@evil.example/login`, `a@b`, `a b@…`. Ca render C kênh Email với email độc (dòng 334): chữ tin không có `evil`, dòng duy nhất có `://` là "Mở Desk". Điểm 4 (siết `normalizeEmail` ở form) chưa làm, chuyển BE-A/ORC – chấp nhận, vì phía Chat đã chặn đủ. |
| GCHAT-02 (Minor) – IPv4 và định dạng trong tên | **Đóng** | `IPV4` đổi dấu chấm cụm `d.d.d.d` → `[.]` (giá `1.5`, giờ `22.30`, ngày `1.2.2026` giữ). Tên dùng `plain: true`, bỏ `*` `_` `~`. Test dòng 517, 525. INT thêm 2 ca vào lượt ★5 trên phòng thử. |
| GCHAT-03 (Minor) – dấu vết đổi mức | **Đóng phần mã** | Chú thích trên `CHAT_DETAILS_MIN_NOTICE_VERSION` có đủ hai ý: đổi hằng phải qua PR có SEC review; thông báo sau bỏ Google Chat thì hạ mức về A/B **trước** khi đăng. Phần runbook (decision-log mỗi lần đổi + lưu dòng log `chat detail level`) còn ở OPS/ORC, là điều kiện trước C bên dưới. |
| GCHAT-04 (Suggestion) – kiểm lại trước POST | **Đóng** | Renderer mức C trả `recheck`. Dispatcher chạy `CHAT_RECHECK_SQL` = `SELECT status, pii_purged_at FROM website_booking_request WHERE id = $1` trong giao dịch riêng ngay trước `deliver`. Không thấy dòng (kể cả do RLS), `spam` hoặc đã purge → `done` + `SKIPPED_GONE`, không gửi. Câu SQL không có cột C2. Nếu câu kiểm lỗi thì ngoại lệ thoát ra trước `deliver`: không gửi, dòng outbox chờ lần sau. Đây là hướng an toàn. Mức A/B không có `recheck` (test dòng 346–349). Test tích hợp `gchat-notify.test.ts` dòng 594: purge commit giữa claim và POST → 0 request tới webhook giả, outbox `SKIPPED_GONE`. Khe còn lại chỉ là vài mili giây giữa câu kiểm và POST. SEC chấp nhận. |
| GCHAT-05 (Suggestion) – `messageId` | Chuyển INT, đồng ý | `CHAT_USE_MESSAGE_ID` vẫn `false`. Thành điều kiện ★5-bis bên dưới. |
| ARC GC-02 (phần bảo mật) – ký tự định dạng | **Đạt, còn một khe nhỏ (thẻ 06)** | `FORMAT = /\p{Cf}/gu` bỏ mọi ký tự định dạng (ZWSP, WJ, BOM, soft hyphen, U+061C, mọi dấu bidi). Chỉ giữ U+200D khi nằm giữa hai pictograph. U+2028/U+2029/U+0085 coi như xuống dòng, nên tên không giả được dòng "Mở Desk" thứ hai (test dòng 508–513). `DOMAIN_DOT` nhận `\p{M}` **trước** dấu chấm (`x̃.com`). Thứ tự đúng: bỏ Cf rồi mới vô hiệu dấu chấm, nên `evil<ZWSP>.example` và `evil<WJ>.<BOM>example` đều thành `[.]` (test dòng 498–501). |
| ARC GC-06 – gốc link Desk | **Đạt** | `resolveChatConfig`: staging/production chỉ đọc `ADMIN_BASE_URL`. Production chỉ có `APP_BASE_URL` → `off` + `CHAT_LINK_BASE_INVALID`. Tránh link "Mở Desk" trỏ nhầm host. |
| Migration 0090 rút khỏi PR (ARC GC-01) | **Đạt** | Hai commit revert `0d13aed8`, `cac5c9cc`. `git diff main...9520cec1` không có tệp nào trong `src/db/migrations/` hay `meta/`. Cây của head không có `0089`/`0090`. API GitHub của PR #16 cũng không liệt kê tệp migration. Tệp duy nhất còn nhắc tới thông báo trong hạ tầng là `publish-privacy-notice.test.sh`, và chỉ thêm tệp bí mật rỗng `booking_request_chat_webhook` cho compose của test. Đúng phạm vi. |

### Hệ quả của việc rút 0090 với ★2

Ở lượt 1, SEC tính bảng thông báo "chỉ thêm dòng" (0090) là một phần bằng chứng ★2: không ai sửa lùi được `published_at` để mở cổng. Nay 0090 chưa lên main. Cổng ★2 trong mã vẫn đúng. Vai `ottimo_app` vẫn chỉ có `SELECT` trên `privacy_notice_version` (`0086_public_site_us155.sql:178`), nên app và worker không sửa được. Còn lại vai migrator/owner. Vì vậy SEC thêm điều kiện ★2-bis trước khi đặt C (xem dưới). Điều kiện này không chặn gộp PR #16.

### Thẻ mới

### FB-R3-SEC-BE-GCHAT-06
- Mức độ: Minor
- Vị trí: `chat-message.ts` `DOMAIN_DOT` (`(?<=[\p{L}\p{N}\p{M}])[.．。｡](?=\p{L})`), tên khách ở dòng `Khách:` (ngoài khối mã); `CHAT_EMAIL` phần trước `@`.
- Vấn đề: SEC chạy thử biểu thức trên chuỗi biên. (a) Dấu kết hợp hoặc bộ chọn biến thể đứng **ngay sau** dấu chấm thì lọt: `evil.<U+FE0F>example/x`, `evil.<U+034F>example`, `evil.<U+0301>example` giữ nguyên dấu chấm. Nguyên nhân: điều kiện nhìn sau chỉ nhận chữ cái (`\p{L}`), còn các ký tự này là `\p{M}`, không phải `Cf` nên không bị bỏ ở bước trước. (b) Email `www.evil.example@example.invalid` khớp `CHAT_EMAIL` và giữ dấu chấm (đúng thiết kế Q3). Chưa xác minh Google Chat có biến các chuỗi này thành link hay không. Với (a) khả năng thấp, vì nhãn tên miền mở đầu bằng dấu kết hợp là không hợp lệ.
- Vì sao quan trọng: tên khách nằm ngoài khối mã. ★5 yêu cầu "không link nào bấm được ngoài link Desk" và phải chứng minh được, không dựa vào phỏng đoán cách Chat tự nhận link.
- Đề xuất sửa: (1) BE đổi điều kiện nhìn sau thành `(?=\p{M}*\p{L})`, kèm 3 ca test ở (a). Sửa một dòng, nên làm trong v1.0.1 nếu kịp, không thì v1.0.2. (2) INT thêm vào lượt ★5 trên phòng thử: tên `evil.<U+FE0F>example/x` (nếu chưa có bản sửa 1) và email `www.evil.example@example.invalid` ở mức C. Nếu Chat tạo link web cho phần trước `@` hoặc cho tên miền email thì áp điều kiện 2 của Q3: vô hiệu luôn dấu chấm của email.
- Trạng thái: Open

### Kết luận lượt 2 (phía SEC)

**PR #16 gộp được (phía SEC).** Không còn Blocker hay Major. Điều kiện gộp ở lượt 1 đã xong: thẻ 01 đã sửa, có test. Migration 0090 đã rút ra khỏi PR, nên thứ tự 0089 → 0090 không còn là việc của PR này mà chuyển sang PR PN-01. Thẻ 06 (Minor) không chặn gộp, vì mặc định là mức A và production chưa đặt C.

### Điều kiện còn lại trước khi production đặt mức C

SEC chỉ ghi dòng decision-log "đủ điều kiện đặt C" khi có bằng chứng cho **tất cả** các mục dưới đây.

| # | Điều kiện | Ai | Trạng thái |
|---|---|---|---|
| ★1 | Tin trong phòng tự xóa: phòng tắt lịch sử (24 giờ) và khóa trong Admin console, hoặc phương án 2/3. Kết quả kiểm ghi trong báo cáo INT. Nếu phải nâng gói (Vault) thì ORC mở ESC. | INT kiểm, INV cài | Chưa |
| ★2 | Cổng `published_at` trong mã | BE | **Đạt** (lượt 1, giữ nguyên) |
| ★2-bis | PN-01 (bảng thông báo chỉ thêm dòng) lên production theo thứ tự ARC: sau BE-A 0089. Nếu PN-01 trễ hơn ngày đặt C: OPS chụp `\dp privacy_notice_version` trên production cho thấy `ottimo_app` chỉ có `SELECT`, đồng thời runbook ghi "không chạy UPDATE/DELETE tay trên bảng này". Khi đó SEC chấp nhận tạm. | BE, OPS | Chưa |
| ★3 | Mức thiếu/sai → A, chỉ worker đọc | BE | **Đạt** về mã. Còn phần runbook ở thẻ 03: mỗi lần đổi mức trên production thì ORC ghi decision-log (cũ → mới, giờ, người làm, dòng SEC căn cứ) và lưu dòng log `chat detail level`. Đổi `.env` production thì báo INV trước. | 
| ★4 | Phòng chỉ có tài khoản @ottimo.vn của OWN/MGR/FDL/FD, bật 2 bước, không người ngoài, không app/webhook khác. Có checklist nghỉ việc, OWN rà hằng tháng. | INV làm, OPS ghi runbook | Chưa |
| ★5 | Phần mã **Đạt** (sau GCHAT-01, 02, ARC GC-02). Còn lượt kiểm INT trên phòng thử (dữ liệu giả, chụp chữ không có dữ liệu thật): các ca esc041 ★5, 2 ca GC-02 (ZWSP, dấu kết hợp), 2 ca GCHAT-02 (`1.2.3.4/login`, `*TEST*`), các ca thẻ 06, và Q3 điều kiện 2 (Chat chỉ tạo `mailto:`, không tạo link web cho tên miền email). Kết quả bắt buộc: không ai bị nhắc, không link nào bấm được ngoài link Desk. | INT (BE nếu phải sửa) | Chưa |
| ★5-bis | `messageId` (thẻ 05): Chat nhận thì bật `CHAT_USE_MESSAGE_ID = true` trước C. Không nhận thì ghi rõ trong báo cáo INT. Không chặn C. | INT, BE | Chưa |
| ★6 | Chỉ tin đầu có chi tiết | BE | **Đạt** |
| ★7 | Ẩn nội dung thông báo trên màn hình khóa, tắt email thông báo tin chưa đọc, bật quản lý thiết bị, sổ tay ghi luật không chép chi tiết ra ngoài | INV phổ biến, BA ghi sổ tay | Chưa |
| ★8 | Landing production có thông báo `2026-10-31`. `publish-privacy-notice --apply` đã ghi `vi` + `en`, mã băm khớp trang thật. Câu `{chatRetention…}` khớp kết quả ★1. | FE-B, OPS | Chưa |
| v1.0.1 | api/worker chứa PR #16 đã lên production. `appconfig` thấy `chat: on`, mức A chạy ổn ít nhất một tin thật. Tệp bí mật webhook đúng quyền: uid 1000, 0400 (ARC GC-04, checklist OPS). | OPS | Chưa |

### Dòng decision-log đề xuất (lượt 2)

| 2026-10-30 | 3 | **SEC – PR #16 (BE tin Google Chat, v1.0.1) lượt 2: gộp được (phía SEC)** (`rounds/round-03/reviews/SEC-on-BE-gchat-notify.md` mục Lượt 2, head `9520cec1`, CI xanh). Đóng GCHAT-01 (`chatSafeEmail` theo mẫu chặt, `://` và `<>` luôn bị vô hiệu ở mọi trường, có test email độc), GCHAT-02 (IPv4 + bỏ `*_~` trong tên), GCHAT-03 phần mã, GCHAT-04 (kiểm lại `status`/`pii_purged_at` trước POST ở mức C, có test tích hợp). ARC GC-02 (bỏ mọi `\p{Cf}`, U+2028/2029/0085 là xuống dòng) và GC-06 đạt. Migration 0090 đã rút khỏi PR. Thẻ mới GCHAT-06 (Minor, dấu kết hợp ngay sau dấu chấm lọt `DOMAIN_DOT`) không chặn gộp. Production **chưa** được đặt C cho tới khi đủ ★1, ★2-bis (PN-01 hoặc `ottimo_app` chỉ SELECT + runbook), ★3 runbook, ★4, ★5 lượt INT phòng thử (gồm ca thẻ 06 và `mailto:`), ★7, ★8, và v1.0.1 đã lên production. | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật) |

---

## Lượt 3 – xác nhận BUG-R3-057 (98ff43bb)

- Người review: SEC | Round 3 – Review (xác nhận bản sửa ★5) | 31/10/2026
- Đọc: `git diff 9520cec1 98ff43bb` (5 tệp: `chat-message.ts`, `gchat-units.test.ts`, `gchat-notify.test.ts`, báo cáo và trả lời BE), toàn bộ `chatSafeText` / `looksLikeSensitiveNumber` tại `98ff43bb`, cùng `looksLikeCard` / `looksLikeIdNumber` / `withoutDatesAndTimes` (`website-request-rules.ts`). Đối chiếu QA FB-01, esc041 L2.4.
- SEC chép nguyên các hàm trên ra một tệp thử ở scratchpad (không vào repo) và chạy 50 chuỗi biên bằng Node 22. Chỉ dùng dữ liệu giả: CCCD `079203012345`, CMND `123456789`, thẻ thử `4111…`, hộ chiếu `C1234567`. SEC không chạy lại bộ test của BE. CI của PR trên `98ff43bb`: gitleaks, shellcheck, OpenAPI, API contract, landing đã xanh. Job `format · lint · audit · test · build` **đang chạy** lúc SEC viết.

### Kết quả kiểm bản sửa

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| 5 ca bảng FB-01 + chữ số toàn độ rộng | **Đóng** | Cả 6 ca bị thay bằng `CHAT_ID_REPLACEMENT`, ở cả tên (`plain`) và lời nhắn. SEC chạy thêm: dấu bidi giữa các nhóm số, số nằm cuối lời nhắn dài gần 500 ký tự. Cả hai bị thay. |
| Vị trí 3 lần kiểm | **Đúng** | (1) Chữ gốc. (2) Sau Cc, `\p{Cf}`, `plain`, gộp dòng, backtick, `<>`, và **trước** `[.]`/IPv4. Thứ tự này cần thiết, vì nếu kiểm sau thì `079.203.012.345` thành `079[.]203[.]…` và luật số không đọc được nữa. (3) Trên chữ in ra sau khi cắt, `[.]`/`[:]` đọc lại như `.`/`:`. Không còn bước nào chạy sau lần kiểm cuối mà vẫn bỏ được ký tự. |
| `looksLikeSensitiveNumber` | **Đạt** | Chạy luật cũ trên 3 bản: gốc, NFKC + `\p{Nd}` → ASCII, rồi bản coi **một** `_` `/` `,` giữa hai chữ số là dấu tách (ngày, giờ che trước). Bản chuẩn hóa chỉ dùng để kiểm, không in ra. Bắt được NBSP, U+202F, U+2009, U+3000, `，`, chữ số khoanh tròn, chỉ số trên, chữ số Ả Rập. `asciiDigits` đúng với các dải `Nd` liền nhau, vì có `% 10`. Hiệu năng: lời nhắn 500 chữ số (Ả Rập, ASCII hoặc chữ số toán học) mất ≤ 2,4 ms mỗi lần gọi. Không có biểu thức nào bị quay lui theo cấp số mũ. |
| SĐT 10–11 số không bị che | **Đạt** | `0905 111 222`, `01205111222`, `+84 905 111 222` vẫn hiện. SĐT toàn độ rộng cũng hiện như khách gõ. Dòng `Liên hệ:` không đi qua `chatSafeText`. |
| Test | **Đủ cho phạm vi lỗi** | TC-GC-01 (18 chuỗi × 3 kiểu gọi), TC-GC-02 (render C), SĐT ở mức C, 7 ca không che nhầm, TC-GC-06 (≤ 4 KB). BE báo 20 ca đỏ trên mã cũ. |

### Đánh đổi che thừa: chấp nhận

Các trường hợp bị che thừa mà SEC thấy là: hai SĐT nối bằng `/` hoặc `,` không dấu cách (`0905111222/0912333444`), danh sách phòng `201,202,203`, số tiền 9 chữ số không có đơn vị (`150,000,000`), mã OTA 9 chữ số. Khi đó **cả trường** thành câu "xem trên Desk".

SEC chấp nhận đánh đổi này vì 3 lý do:
- Đây là hỏng theo hướng an toàn. Dòng "Mở Desk" luôn có, và cờ "cần gọi ngay" lấy từ trường có cấu trúc, không lấy từ lời nhắn.
- `150.000.000` (dấu chấm) vốn đã bị che từ BUG-R3-009. Dấu phẩy chỉ làm cho hai cách viết xử lý giống nhau.
- Chỉ ảnh hưởng mức C.

Đề nghị BA ghi một dòng vào sổ tay: "Lời nhắn hiện câu *có dãy số giống giấy tờ…* thì mở Desk đọc bản gốc".

### Đường lách còn lại

Đáng kể là những chuỗi **khách gõ tự nhiên** mà vẫn lọt. Các cách che cố ý (dấu kết hợp như `0̲7̲9̲…`, U+034F, VS16 giữa các chữ số; dấu `·`; viết từng cặp `07-92-03-01-23-45`, bị coi là ngày; tách số ra tên và lời nhắn) SEC coi là rủi ro còn lại thấp. Người có giấy tờ không có lý do che số của chính mình. Người ngoài chèn số của người khác thì không lộ thêm gì so với thứ họ đã có.

Các chuỗi tự nhiên vẫn lọt (chạy trên `98ff43bb`, cả lời nhắn lẫn tên trừ khi ghi chú khác):

| Khách gõ | Kết quả |
|---|---|
| `CCCD 079203012345 2 người lớn` / `CCCD 079 203 012 345 2 người` / `Phòng 2 079203012345` | Lọt. `GROUPED_DIGITS` nối với số đứng cạnh thành 13 chữ số, nên không còn đúng 9 hoặc 12. |
| `079 - 203 - 012 - 345`, `079–203–012–345` (gạch ngang dài do tự sửa chữ), U+2010, U+2011, U+2212 | Lọt |
| `079  203  012  345` (hai dấu cách), `4111  1111  1111  1111` | Lọt ở lời nhắn. Tên bị che, vì `plain` gộp dấu cách. |
| `079⏎203⏎012⏎345` (mỗi nhóm một dòng) | Lọt ở lời nhắn |
| `Hộ chiếu c1234567`, `Hộ chiếu C 1234567` | Lọt. Luật hộ chiếu phân biệt chữ hoa/thường và không cho dấu cách. |

Tất cả các khe này nằm trong **luật chung V-09 / SR-LOG-04**, không do PR #16 tạo ra. Vì vậy form cũng nhận và lưu những chuỗi này vào DB, cùng nhóm với BUG-R3-058.

### Thẻ mới

### FB-R3-SEC-BE-GCHAT-07
- Mức độ: Minor (không chặn gộp PR #16). **Là điều kiện trước khi đặt C**: xem ★5 dưới.
- Vị trí: `website-request-rules.ts` `looksLikeIdNumber` / `GROUPED_DIGITS` (luật chung); `chat-message.ts` `looksLikeSensitiveNumber` (bản chuẩn hóa dùng để kiểm).
- Vấn đề: xem bảng "Đường lách còn lại". Khe nặng nhất là một số giấy tờ đứng cạnh một số khác (`079203012345 2 người`). Đây là cách viết tự nhiên, và nó lọt cả form lẫn tin Chat mức C.
- Vì sao quan trọng: ở mức C, số CCCD sẽ có một bản sao ở bên thứ ba và nằm tới 180 ngày (RR9). Khả năng xảy ra thấp, nhưng sửa rẻ.
- Đề xuất sửa (chỉ trên bản dùng để kiểm, chữ in ra không đổi):
  1. NFKD, bỏ `\p{M}`, rồi NFKC.
  2. Đổi `\p{Pd}` và `·` thành `-`. Gộp `\s*-\s*` thành `-`. Gộp `\s+` thành một dấu cách. Coi `\n` là dấu cách.
  3. Trong một cụm số có nhiều nhóm, nếu một **dãy nhóm liền nhau** có tổng đúng 9 hoặc 12 chữ số thì coi là giấy tờ. Vẫn giữ ngoại lệ `+`, `$` và đơn vị tiền.
  4. Luật hộ chiếu nhận chữ thường và nhận một dấu cách giữa chữ và số.

  SEC đã thử phác thảo này ở scratchpad. Nó bắt được mọi ca trong bảng trên. `0905 111 222`, `0905111222 2 người`, `+84 905 111 222 3 người`, `Gọi … sau 18:00`, `Đến 12/11 - 15/11/2026, 2 phòng`, `1 500 000 đ/đêm`, `iPhone 15 Pro 256GB`, mã `7K3P9QXA` vẫn hiện bình thường.

  Lưu ý: cách cộng nhóm sẽ che thừa `84 905 111 222` (SĐT quốc tế thiếu `+`), vì nhóm cuối `905 111 222` có đúng 9 chữ số. Nếu BE chọn cách khác thì giữ được ca này. Che thừa ca này vẫn chấp nhận được.

  Cách làm gọn nhất: BE-D sửa luật chung cùng BUG-R3-058, rồi `looksLikeSensitiveNumber` dùng lại. Nếu BUG-R3-058 trễ hơn ngày đặt C, BE thêm bước này riêng vào `looksLikeSensitiveNumber`. Test: các ca trong bảng phải bị che. Các ca SĐT, ngày, giờ, tiền và các ca "không che nhầm" hiện có phải vẫn hiện.
- Trạng thái: Open

### Kết luận lượt 3

**BUG-R3-057: Đạt.** Phía SEC đồng ý đóng sau khi job `format · lint · audit · test · build` trên `98ff43bb` xanh. QA vẫn chạy lại theo lịch của QA. PR #16 gộp được (phía SEC).

**★5 trước khi đặt production mức C: Đạt có điều kiện.**
- Phần chống chèn cú pháp Chat (link, `<users/all>`, định dạng) đã đạt từ lượt 2.
- Phần lọc số giấy tờ/thẻ nay đạt với mọi khe **do các bước làm sạch tạo ra**.
- Điều kiện thêm: FB-R3-SEC-BE-GCHAT-07, bước 1–3, phải lên cùng hoặc trước lúc đặt C. Bước 4 (hộ chiếu) nên làm, không bắt buộc.
- Các điều kiện cũ của ★5 giữ nguyên: lượt INT trên phòng thử, gồm TC-GC-14 và các ca thẻ 06.

Bảng "Điều kiện còn lại trước khi production đặt mức C" (lượt 2) cập nhật dòng ★5:

| # | Điều kiện | Ai | Trạng thái |
|---|---|---|---|
| ★5 | Mã chống chèn: **Đạt**. Lọc số sau làm sạch (BUG-R3-057): **Đạt** (`98ff43bb`, chờ CI xanh). Còn: (a) GCHAT-07 bước 1–3 (số cạnh số, gạch Unicode, nhiều dấu cách, xuống dòng) lên production; (b) lượt INT trên phòng thử như lượt 2 cộng TC-GC-14 của QA; (c) v1.0.1 chứa `98ff43bb` lên production. | BE / BE-D, INT | Chưa |

### Dòng decision-log đề xuất (lượt 3)

| 2026-10-31 | 3 | **SEC – PR #16 lượt 3: BUG-R3-057 Đạt** (`rounds/round-03/reviews/SEC-on-BE-gchat-notify.md` mục Lượt 3, `98ff43bb`). `chatSafeText` kiểm số giấy tờ/thẻ ở 3 điểm: chữ gốc, sau mọi bước bỏ ký tự và trước `[.]`, rồi trên chữ in ra. `looksLikeSensitiveNumber` dùng NFKC, `\p{Nd}` → ASCII và coi một `_` `/` `,` là dấu tách. SĐT 10–11 số vẫn hiện. Chấp nhận che thừa (hai SĐT nối `/` hoặc `,`, danh sách phòng, số 9 chữ số không đơn vị): hỏng theo hướng an toàn, Desk có bản gốc. Thẻ mới GCHAT-07 (Minor): luật chung V-09 vẫn lọt số giấy tờ đứng cạnh số khác, gạch Unicode, nhiều dấu cách, xuống dòng, hộ chiếu chữ thường. Không chặn gộp. Là điều kiện ★5 trước khi đặt C (bước 1–3). Đóng 057 phía SEC khi CI của `98ff43bb` xanh. | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật) |
