# QA review BE – tin Google Chat cho yêu cầu đặt phòng website (PR #16, v1.0.1)

- Người review: QA | Round 3 – bước **Review** (trước khi gộp vào v1.0.1) | Ngày: 30/10/2026
- Đối tượng: PR #16 `be/gchat-booking-notify`, head `9520cec1` (so với `main` `84472dc7`, merge-base; 32 tệp, +3622/−14). ARC và SEC đã duyệt lượt 2.
- Đối chiếu: `outputs/ARC/gchat-booking-request-notify.md` mục 8 (8.1–8.5, 8.11), `reviews/ARC-on-BE-gchat-notify.md`, `reviews/SEC-on-BE-gchat-notify.md` (lượt 2, GCHAT-06), `outputs/SEC/esc041-gchat-full-details.md` mục L2 (bảng L2.4), `02-escalations/ESC-041.md` (C từ v1.0.1), `02-escalations/ESC-042.md` (B).
- Cách test:
  - Checkout head `9520cec1` (detached) trong worktree QA, `pnpm install --frozen-lockfile --offline`, build `@ottimo/contracts` + `@ottimo/integrations`.
  - DB: container Postgres 17 tạm (`qa-pr16-pg`, cổng 55432, chạy `infra/postgres/init/02-roles.sh` như CI), đã dừng và xóa sau khi test. Không dùng DB của stack khác.
  - Webhook: chỉ webhook giả trong bộ test (`test/helpers/fake-chat-webhook.ts`). **Không** dùng webhook thật, không gửi tin ra ngoài.
  - Thử riêng `chatSafeText` / `chatSafeEmail` và bộ lọc lúc nhận form (`normalizeFreeText`, `looksLikeIdNumber`, `looksLikeCard`) với 28 chuỗi biên. Tệp thử nằm ở scratchpad, không vào repo. Chỉ dùng dữ liệu giả: số CCCD dạng `079203012345`, thẻ thử `4111…`, `evil.example`.

## Kết luận: **Duyệt có điều kiện – không chặn gộp**

PR #16 **gộp được** về phía QA. Không có Blocker. Bộ test hiện có chạy xanh và phủ tốt phần lớn yêu cầu.

Có **1 thẻ Major (FB-01 / BUG-R3-057)**: bộ lọc số giấy tờ và số thẻ trong `chatSafeText` chạy **trước** các bước làm sạch. Vì vậy chính các bước làm sạch có thể **tạo ra** một số CCCD hoặc số thẻ liền mạch trong tin mức C. Lỗi chỉ xảy ra ở mức C. Mặc định là A, và production chưa được đặt C.

Điều kiện, theo cùng cách SEC xử lý GCHAT-01 ở lượt 1:
- QA **đề nghị sửa FB-01 ngay trong PR này**, kèm test. Sửa khoảng 2 dòng và 6 ca test.
- Nếu ORC buộc phải gộp trước thì **production không được đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C`** cho tới khi bản sửa lên. Thêm điều kiện này vào bảng "trước khi đặt C" của SEC (dòng ★5).
- Nếu C được đặt khi chưa sửa, BUG-R3-057 tự nâng lên **P0** (test-strategy mục 8: lộ dữ liệu C3 ra ngoài).

## 1. Kết quả chạy test

| Bộ | Lệnh / phạm vi | Kết quả |
|---|---|---|
| Unit Chat | `vitest run test/gchat-units.test.ts` (không DB) | **58/58** đạt |
| Tích hợp Chat | `gchat-notify.test.ts` + `gchat-worker-only.test.ts` + unit (DB thật) | **82/82** đạt |
| Múi giờ tiến trình | Như trên, chạy lại với `TZ=UTC`, `TZ=America/Los_Angeles`, `TZ=Pacific/Kiritimati` (máy QA là +07) | **82/82** đạt ở cả 3 múi giờ. Giờ nhắc 07:30 tính theo múi giờ property (`Asia/Ho_Chi_Minh`), không phụ thuộc múi giờ của máy |
| Toàn bộ api | `vitest run` (DB thật, có `BOOTSTRAP_*`) | **141 tệp đạt, 2 bỏ qua; 3353 ca đạt, 19 bỏ qua; 0 lỗi** (131 s) |
| integrations | `vitest run` (gồm `google-chat.test.ts`, `safe-config.test.ts`) | **12 tệp, 219/219** đạt |

Chưa chạy: lint, typecheck, format, shellcheck, `check-compose.sh`, E2E smoke. Phần này dựa vào CI của PR (ARC và SEC báo CI xanh trên `9520cec1`). Không có kiểm thử trên staging hay phòng Chat thử. Phần này thuộc bước 8.8 (4) và lượt INT.

## 2. Độ phủ test theo yêu cầu ORC giao

| Yêu cầu | Test hiện có (head `9520cec1`) | Đánh giá QA |
|---|---|---|
| Chọn mức A/B/C, fallback A | `gchat-units` "configuration (★3…)" (không đặt → A; `c` → C; ` C ` → C; `D` → A + `CHAT_DETAIL_LEVEL_INVALID`); worker-only (8) mức sai → mã lỗi, Chat vẫn chạy; tích hợp "C lowered to A" (mức đọc lúc gửi) | **Đủ.** Còn thiếu ca B bị chặn theo thông báo (TC-GC-03) |
| ★2 `consent_version` cũ → chỉ mẫu A | Unit `it.each` 3 ca (thông báo cũ, `2026-10-31` chưa đăng, không biết phiên bản của yêu cầu) → A + `levelCapped`, không có câu SQL C2 (spy); tích hợp "not published yet", "old-notice stays A; new-notice gets C" | **Đủ** cho C. Thiếu ca B, và ca khác ngôn ngữ (`en` đăng muộn hơn `vi`) (TC-GC-03, 04) |
| ★5 chống chèn (tên, lời nhắn) | Unit 3a + "review fixes": `<users/all>`, `<url\|chữ>`, backtick, `*x*` (tên bỏ, lời nhắn giữ trong khối mã), ký tự Cf/bidi, U+2028/2029/0085, IPv4, tên miền (kể cả ZWSP và dấu kết hợp trước dấu chấm), cắt theo grapheme, emoji ZWJ, email độc | **Tốt** về cú pháp Chat. **Thiếu**: bộ lọc số giấy tờ/thẻ không chạy lại sau khi làm sạch (FB-01). Cũng chưa có ca đầu-cuối form → tin C với chuỗi độc (TC-GC-07) |
| ★6 chỉ tin đầu có chi tiết | Unit `overdue`/`morning` ở mức C → mẫu A, không có SQL C2 hay `privacy_notice_version`; tin xóa luôn A; tích hợp "reminders go out as template A in the thread" (C cấu hình, yêu cầu theo thông báo mới, 3 dòng, không có tên) | **Đủ.** Thiếu ca B (TC-GC-05) |
| Webhook lỗi/timeout → retry, không mất tin | Client: 408/429/5xx/timeout/reset/refused → retryable, 4xx khác/3xx → permanent, mã lỗi không chứa URL. Dispatcher: 500 → 200 (back-off 1 phút), 404 → `dead`, 6 lần → `dead`, mất lease → nhận lại sau 2 phút, vượt ngân sách → hoãn không tính lượt | **Khá.** Thiếu ca timeout/reset đi qua **dispatcher** (TC-GC-08). Tin bị `dead` sau khoảng 4 giờ 20 phút thì chỉ còn dòng log (FB-04) |
| Không log URL webhook | Unit "dispatcher never logs a URL, a text or a response"; tích hợp "logs of the whole suite: no guest canary, no webhook URL/key/token"; worker-only (7, 8) | **Đủ** |
| Giờ nhắc 07:30 theo Asia/Ho_Chi_Minh | Tích hợp test 5: trong giờ phút 30; gọi ngay 23:45; `zalo` 07:30 overdue không morning; `phone` morning 07:30 + overdue 08:30; 21:30 `phone` không morning; đã nhận → 0 dòng; worker trở lại 10:00 vẫn nhắc; sau 22:00 không nhắc; QA chạy thêm 3 múi giờ tiến trình | **Tốt** với giờ trực mặc định. Thiếu giờ trực khác mặc định, các biên đúng 22:00 / 06:59 / 07:29, và yêu cầu của đêm trước nữa (TC-GC-09–12) |
| Không gửi khi tắt cấu hình | Tích hợp "Chat off → SKIPPED_DISABLED"; worker-only (8) tệp rỗng → `chat: off`, các job khác vẫn chạy; unit `resolveChatConfig` (webhook sai, `ADMIN_BASE_URL` sai → off) | **Đủ** |

## 3. Thẻ feedback

### FB-R3-QA-BE-GCHAT-01
- Mức độ: Major
- Vị trí: `product/services/api/src/modules/public-site/public/chat-message.ts` – `chatSafeText`, bước 1 (`if (looksLikeCard(text) || looksLikeIdNumber(text)) return CHAT_ID_REPLACEMENT;`) chạy trước bước 2 (bỏ `\p{Cf}`) và trước `plain` (đổi `*` `_` `~` thành dấu cách). Lỗi BUG-R3-057.
- Vấn đề: bộ lọc số giấy tờ/thẻ (ARC 8.5 bước 1) chỉ chạy trên chữ **trước** khi làm sạch. Các bước làm sạch sau đó có thể **ghép lại** một dãy số liền, và dãy này đi thẳng vào tin. QA thử trên head `9520cec1`. Cả 5 ca dưới đây đều **qua** bộ lọc lúc nhận form, rồi ra tin như sau:

  | Khách gõ (tên hoặc lời nhắn) | Form nhận? | Chữ trong tin mức C |
  |---|---|---|
  | `0790<U+200B>12345678` (ZWSP) | Nhận | `079012345678` |
  | `079<U+2060>203<U+2060>012<U+2060>345` (WJ) | Nhận | `079203012345` |
  | `079203<U+00AD>012345` (gạch nối mềm) | Nhận | `079203012345` |
  | `4111<U+200B>1111<U+200B>1111<U+200B>1111` (thẻ thử Luhn) | Nhận | `4111111111111111` |
  | Tên `079_203_012_345` hoặc `4111_1111_1111_1111` | Nhận | `Khách: 079 203 012 345` / `Khách: 4111 1111 1111 1111` (`plain` đổi `_` thành dấu cách, đúng dạng BUG-R3-009) |

  Ca đối chứng: `079203012345` gõ thẳng thì bị thay đúng bằng `(có dãy số giống giấy tờ hoặc thẻ – xem trên Desk)`.
- Vì sao quan trọng:
  - Số CCCD và số thẻ là dữ liệu C3. Ở mức C, chúng đi ra Google Chat, một bên xử lý thứ ba. Tin nằm trong phòng tới 180 ngày hoặc lâu hơn (★1 đã bỏ, RR9), và nằm trên điện thoại của thành viên (★7).
  - Ký tự rộng-0 có thể lọt vào khi khách dán số từ ứng dụng khác. Kẻ xấu cũng chèn được dễ dàng.
  - Thiết kế ARC 8.5 bước 1 viết rõ mục đích là "phòng dòng cũ hoặc bộ lọc đổi về sau". Ở đây, chính bộ lọc của PR này là thứ ghép số lại.
  - INV đã chọn C ngay từ v1.0.1 (ESC-041).
- Đề xuất sửa:
  1. Chạy lại bộ lọc **sau** bước 2 và sau `plain`, trên chữ đã làm sạch: `if (looksLikeCard(t) || looksLikeIdNumber(t)) return CHAT_ID_REPLACEMENT;`. Giữ cả lần kiểm đầu.
  2. Cho lần kiểm thêm chạy trên bản **NFKC** của `t`. Lý do: `\d` chỉ khớp chữ số ASCII, nên `０７９２０３０１２３４５` (chữ số toàn độ rộng) hiện nguyên trong tin, đọc được như một số CCCD.
  3. Thêm 6 ca trên (5 ca bảng + chữ số toàn độ rộng) vào `gchat-units.test.ts` mục 3a, kỳ vọng `CHAT_ID_REPLACEMENT`. Thêm 1 ca render C: tên `079_203_012_345` → dòng `Khách:` không chứa 12 chữ số liền hoặc tách nhóm.
  4. Gộp PR sau khi sửa. Nếu phải gộp trước thì không đặt C cho tới khi bản sửa lên production.
- Trạng thái: Open

### FB-R3-QA-BE-GCHAT-02
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/public-site/internal/website-request-rules.ts` – `normalizeFreeText` (`FORMAT_CHARS` chỉ có Cc và dấu bidi), `GROUPED_DIGITS` (chỉ cho 1 dấu cách, chấm hoặc gạch giữa các chữ số). Lỗi BUG-R3-058. Lỗi có sẵn trên `main`, không do PR #16 tạo ra.
- Vấn đề: form nhận và **lưu vào DB** số CCCD hoặc số thẻ khi các chữ số bị tách bằng ký tự ZWSP, WJ, gạch nối mềm, NBSP (trong lời nhắn), `_`, `/` hoặc `,`, hoặc viết bằng chữ số toàn độ rộng. Trái US-155 AC5 (không nhận số giấy tờ). Đây là cùng nhóm với BUG-R3-009, nhưng các dạng này hiếm hơn.
- Vì sao quan trọng:
  - Dữ liệu C3 nằm trong `website_booking_request` và hiện trên Desk.
  - Mức C làm phạm vi lộ rộng thêm.
  - FB-01 chỉ chặn được ở tin Chat, không chặn được ở DB.
- Đề xuất sửa: BE-D (chủ `website-request-rules.ts`):
  - `normalizeFreeText` bỏ mọi `\p{Cf}`, trừ U+200D giữa hai emoji, giống `chatSafeText`;
  - các luật số (`looksLikeIdNumber`, `looksLikeCard`) chạy trên bản NFKC;
  - `GROUPED_DIGITS` nhận thêm NBSP, `_`, `/`, `,` làm dấu tách nhóm;
  - kèm ca test như TC-WR-007/010.
  - Không chặn PR #16. Đích v1.0.1 nếu kịp, không thì v1.0.2.
- Trạng thái: Open

### FB-R3-QA-BE-GCHAT-03
- Mức độ: Minor
- Vị trí: tin Chat dùng `ref_code` thô, ví dụ `Chưa có người nhận · 7K3P9QXA`. BE ghi điều này ở giả định 1 trong `outputs/BE/gchat-booking-notify.md` mục 4. Ngược lại, `outputs/SEC/esc041-gchat-full-details.md` L2.2 bước 3 dặn "tìm theo mã `REQ-…`", và mẫu tin ARC 8.2 / 8.6 cũng ghi `REQ-7K3P9QXA`.
- Vấn đề: quy trình xóa tay khi khách xin xóa (WR8) dựa vào tìm kiếm trong Chat. Nếu sổ tay BA chép đúng chữ SEC L2.2 thì người làm gõ `REQ-7K3P9QXA`. Tin lại chỉ có `7K3P9QXA`, nên Chat có thể không tìm ra. Khi đó tin có chi tiết khách bị sót, không được xóa trong 24 giờ.
- Vì sao quan trọng: đây là cách duy nhất để thực hiện lời hứa "Your rights … including any copy left in our staff chat", vì ★1 đã bỏ.
- Đề xuất sửa: PO/BA chọn **một** dạng mã và dùng chung cho Desk, tin Chat, SEC L2.2 và sổ tay.
  - Cách 1 (QA đề xuất, không đổi mã): sổ tay và SEC L2.2 ghi "tìm theo 8 ký tự mã, không có `REQ-`".
  - Cách 2: thêm tiền tố ở `chat-message.ts`, và FE-B đổi Desk cho khớp.
  - INT thêm vào lượt kiểm trên phòng thử: tìm kiếm Chat theo đúng dạng mã đã chọn ra cả tin đầu lẫn tin nhắc.
- Trạng thái: Open

### FB-R3-QA-BE-GCHAT-04
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/jobs/chat-dispatch.ts` (`CHAT_BACKOFF_MINUTES`, `dead`), ARC 8.9 (`ops-check chat_dead` dời sau ngày D)
- Vấn đề: "không mất tin" chỉ đúng trong khoảng 1+5+15+60+180 phút. Google Chat lỗi lâu hơn khoảng 4 giờ 20 phút, hoặc trả 4xx (ví dụ webhook bị xóa), thì tin thành `dead`, chỉ có dòng `error 'chat dead'`. Thêm nữa, khi timeout mà Google thật ra đã đăng tin, lượt thử lại sẽ đăng **bản thứ hai** (mức C: hai bản chi tiết khách), vì `CHAT_USE_MESSAGE_ID` vẫn `false` (★5-bis).
- Vì sao quan trọng: đây là đúng thiết kế, Desk vẫn là nguồn chính. Nhưng người trực sẽ không biết Chat đã im.
- Đề xuất sửa: không sửa mã trong PR này.
  - OPS ghi vào runbook v1.0.1: lọc `chat dead` sau deploy và mỗi sáng, cho tới khi có `chat_dead`.
  - INT ưu tiên kiểm `messageId` trước khi đặt C.
- Trạng thái: Open

## 4. Test case còn thiếu (đề nghị BE thêm; QA chạy lại khi có)

Ưu tiên: **P1** = thêm cùng bản sửa FB-01, trước khi đặt C · **P2** = trong v1.0.1 · **P3** = v1.0.2.

| ID | Ưu tiên | Loại | Ca | Kỳ vọng |
|---|---|---|---|---|
| TC-GC-01 | P1 | Unit 3a | `chatSafeText` với 5 chuỗi bảng FB-01 + chữ số toàn độ rộng `０７９２０３０１２３４５`, ở cả `singleLine/plain` (tên) và `singleLine:false` (lời nhắn) | `CHAT_ID_REPLACEMENT` |
| TC-GC-02 | P1 | Unit render C | Tên `079_203_012_345`, lời nhắn `Số thẻ 4111<ZWSP>1111<ZWSP>1111<ZWSP>1111` | Không dòng nào có ≥ 9 chữ số liền hoặc tách nhóm; tin vẫn có "Mở Desk" ở dòng cuối |
| TC-GC-03 | P2 | Unit | Cấu hình **B** + thông báo cũ / `2026-10-31` chưa đăng | Mẫu A, `levelCapped: true`, không có dòng chuyến đi |
| TC-GC-04 | P3 | Tích hợp | `2026-10-31` mới đăng `vi` (T1), chưa đăng `en`. Gửi form `locale=en`, `consentVersion=2026-10-31`. Sau đó đăng `en` (T2 > T1) và gửi lại | Lần 1 bị từ chối 422 `NOTICE_VERSION_INVALID`, 0 dòng `staff.chat`. Lần 2 ra C: `req_at` = T2 ≥ `min_at` = T1. Khóa hành vi khi landing hai ngôn ngữ lên lệch ngày |
| TC-GC-05 | P2 | Unit | `web_request_overdue` / `web_request_morning` ở cấu hình **B** | Mẫu A, không dòng chuyến đi |
| TC-GC-06 | P2 | Unit | Tin mức C lớn nhất: tên 80 ký tự toàn `<` hoặc `.` xen chữ, lời nhắn 500 đơn vị UTF-16 toàn `<`, `a.b`, emoji 4 byte, chữ có dấu tổ hợp | `Buffer.byteLength(JSON.stringify({text}))` ≤ 4096. Nếu vượt, client trả `CHAT_BODY_TOO_LARGE` (permanent), dispatcher cho `dead`, và **không có tin nào**. Ước tính của QA: khoảng 2,5 KB, còn dư; nên khóa bằng test |
| TC-GC-07 | P2 | Tích hợp đầu-cuối | POST form thật, mức C, thông báo `2026-10-31`: tên `<users/all> *Admin*`, lời nhắn có `<https://evil.example\|Mở Desk>`, ```` ``` ````, `evil<ZWSP>.example/login`, 9 dòng, emoji, ký tự bidi | Tin qua webhook giả: không có `<` `>` hay backtick thô; `://` chỉ có ở dòng "Mở Desk"; tên một dòng; lời nhắn trong khối mã ≤ 8 dòng; cờ `contains_url` → "(có link – không bấm…)" |
| TC-GC-08 | P2 | Tích hợp dispatcher | Webhook giả `script=[0]` (treo) rồi `[-1]` (đóng kết nối) rồi `200`, với `CHAT_POST_TIMEOUT_MS` nhỏ | `failed` `TIMEOUT` → `failed` `NETWORK_*` → `done`; `attempts` 3; log chỉ có mã, không có `127.0.0.1`, `key=`, `token=` |
| TC-GC-09 | P2 | Tích hợp SLA | `front_desk_hours` khác mặc định (ví dụ 06:00–23:00) + `web_request_escalate_minutes` = 45 | Nhắc sáng lúc 06:45, không phải 07:30; yêu cầu lúc 22:30 (trong giờ) không có tin sáng |
| TC-GC-10 | P2 | Tích hợp SLA | Biên: yêu cầu đúng 22:00:00, 06:59:59, 07:00:00; tick 07:29:59 và 07:30:00 | 22:00 và 06:59 có tin sáng lúc 07:30:00, 07:29:59 thì chưa; 07:00 không có tin sáng (trong giờ) |
| TC-GC-11 | P3 | Tích hợp SLA | Yêu cầu của **đêm trước nữa** (ví dụ 23:00 hai ngày trước), vẫn `new` | Không có tin sáng hôm nay (ngoài cửa sổ "ca đêm vừa qua"); chỉ có tin quá hạn đã gửi trước đó |
| TC-GC-12 | P3 | Tích hợp SLA | Yêu cầu ban đêm được "Nhận xử lý" lúc 07:29, tick 07:30 | 0 dòng `web_request_morning`; dòng đã ghi trước khi nhận mà chưa gửi → `SKIPPED_HANDLED` |
| TC-GC-13 | P3 | Tích hợp | Hai tick `web_request.sla` chạy song song (2 worker hoặc chạy lại job) lúc 07:30 | Mỗi kind đúng 1 dòng (`ON CONFLICT`), không lỗi giao dịch |
| TC-GC-14 | P3 | Staging / phòng thử (INT, QA) | Các ca ★5 của SEC/ARC + `@all` gõ thường, `＜users/all＞` (toàn độ rộng), `[Mở Desk](https[:]//…)`, `xn--…[.]com`, tìm kiếm theo mã (FB-03), timeout giả rồi thử lại khi chưa có `messageId` | Không ai bị nhắc; không link nào bấm được ngoài "Mở Desk"; tìm được tin theo mã; ghi số bản tin trùng nếu có |

QA đã thử các chuỗi của TC-GC-14 trên hàm (không qua Chat thật). `@all` gõ thường, `＜users/all＞` và `﹤users/all﹥` giữ nguyên, vì Chat chỉ hiểu cú pháp nhắc tên viết bằng `<` `>` ASCII. `https：//evil.com` thành `https：//evil[.]com`. `[Mở Desk](https://evil.example)` thành `[Mở Desk](https[:]//evil[.]example)`. Chỉ phòng thử mới xác nhận được Chat có tạo link hay không.

TC-GC-04: QA đã đọc mã `main`. Khóa ngoại `website_booking_request_consent_fk` là `(organization_id, consent_version, locale)` (migration 0086, dòng 129), và `validate` kiểm `superseded_at` theo cả locale. Vì vậy hành vi đã đúng. Test chỉ để khóa lại hành vi này.

## 5. Điều kiện

**Để gộp PR #16 (phía QA):**
- Không có Blocker.
- Khuyến nghị sửa FB-01 (BUG-R3-057), thêm TC-GC-01 và TC-GC-02 ngay trong PR, rồi CI xanh lại. QA chạy lại `gchat-units` và tích hợp Chat trên head mới, khoảng 10 phút.
- Nếu ORC gộp trước: ghi rõ điều kiện dưới đây vào decision-log.

**Trước khi đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` trên production** (thêm vào bảng SEC lượt 2):
- FB-01 đã lên production, QA đã xác nhận đóng BUG-R3-057;
- TC-GC-14 có trong lượt kiểm INT trên phòng thử;
- FB-03 đã chọn dạng mã, và sổ tay WR8 ghi đúng dạng đó.

**v1.0.1 (không chặn C):** TC-GC-03 đến TC-GC-10; FB-02 (BUG-R3-058) nếu BE-D kịp; FB-04 vào runbook OPS.

Dòng decision-log đề nghị ORC ghi:
`| 2026-10-30 | 3 | QA – review PR #16 (Chat, head 9520cec1): Duyệt có điều kiện, không chặn gộp. Test: api 3353/3353 (141 tệp), Chat 82/82 ở 4 múi giờ tiến trình, integrations 219/219. BUG-R3-057 (P1): chatSafeText kiểm số giấy tờ/thẻ trước khi bỏ ký tự Cf và đổi '_' → có thể ghép ra CCCD/số thẻ trong tin mức C; đề nghị sửa trong PR, chưa sửa thì không đặt C (đặt C khi chưa sửa → P0). BUG-R3-058 (P2, main): form nhận CCCD/thẻ tách bằng ZWSP/NBSP/_/,/ hoặc chữ số toàn độ rộng. 14 test case thiếu (TC-GC-01–14) | QA | Quyền QA (mức lỗi, kết luận kiểm thử) |`

## 6. Điểm làm tốt (nên giữ)

- **Bộ test đặt khóa đúng chỗ.** Có spy trên mọi câu SQL ("A/B không bao giờ đọc C2"), có khóa tĩnh cho hằng phiên bản, và có test log canh trên **toàn bộ** bộ test. Ba khóa này giữ cho lỗi nặng nhất (lộ chi tiết ở mức A, lộ URL webhook) không quay lại khi có người sửa về sau.
- **Test SLA viết theo đúng bảng mốc ARC 8.4**, gồm cả ca khó: gọi ngay ban đêm, kênh `phone` ở 08:30, worker trở lại lúc 10:00. QA chạy ở 4 múi giờ tiến trình đều xanh, nên mốc 07:30 không phụ thuộc máy chủ.
- **Client Chat giảm mọi lỗi về mã ngắn và kiểm thử được bằng webhook giả** (treo, đóng kết nối, 3xx, 4xx, 5xx, thân > 4 KB). QA kiểm được toàn bộ PR mà không cần đụng tới Google Chat thật.
