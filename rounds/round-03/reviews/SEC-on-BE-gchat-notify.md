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
