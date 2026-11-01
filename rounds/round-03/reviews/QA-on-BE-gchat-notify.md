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

---

## Lượt 2 – test lại 98ff43bb

- Người test: QA | Round 3 – bước **Kiểm thử** (test lại bản sửa) | 31/10/2026 00:00–00:15
- Đối tượng: PR #16 head `98ff43bb` (một commit trên `9520cec1`; 5 tệp: `chat-message.ts`, `gchat-units.test.ts`, `gchat-notify.test.ts`, `outputs/BE/gchat-booking-notify.md` mục 2b, `responses/BE-gchat-notify.md` lượt 3). Đã đọc thêm `reviews/SEC-on-BE-gchat-notify.md` mục Lượt 3 (SEC đã duyệt 057, mở GCHAT-07).
- Cách test:
  - `git fetch`, checkout detached `98ff43bb` trong worktree QA, `pnpm install --frozen-lockfile --offline`, build `@ottimo/contracts` + `@ottimo/integrations`.
  - DB: container Postgres 17 tạm `qa-r057-pg`, cổng 55433 (không trùng stack khác), chạy `infra/postgres/init/02-roles.sh` như CI, test chạy với vai `ottimo_app`. Đã dừng và xóa container sau khi xong.
  - Webhook: chỉ webhook giả trong bộ test. Không gửi tin ra ngoài.
  - Chuỗi biên: tệp thử ở scratchpad (không vào repo), gọi thẳng `chatSafeText` (lời nhắn: `maxChars 500`; tên: `singleLine + plain`) và luật form (`normalizeFreeText` → `looksLikeIdNumber` / `looksLikeCard`). Chỉ dữ liệu giả: CCCD `079203012345`, thẻ thử `4111…`, SĐT `0905 111 222`, `*.example`.

### Kết luận lượt 2: **BUG-R3-057 Đã sửa – đã xác nhận.** FB-R3-QA-BE-GCHAT-01 = Done

Mọi chuỗi của FB-01, cùng 24 chuỗi mới nhắm đúng lỗi "bước làm sạch ghép số lại", nay đều bị thay bằng `CHAT_ID_REPLACEMENT`. SĐT hợp lệ vẫn hiện ở mức C. Các chuỗi còn lọt **không do bước làm sạch tạo ra**. Chúng là khe của luật số chung V-09 (form cũng nhận và lưu y nguyên), nên QA ghi vào BUG-R3-058 và FB-R3-SEC-BE-GCHAT-07 chứ không mở lại 057. Chi tiết ở thẻ 06 dưới.

QA đổi BUG-R3-057 sang **Đã sửa – đã xác nhận** (cột Fixed). Lỗi sang **Closed** khi PR #16 gộp vào `main` với job CI `format · lint · audit · test · build` xanh. Lúc 00:12 job này **đang chạy**; 6 job khác của PR đã xanh.

### 1. Kết quả chạy test (head `98ff43bb`)

| Bộ | Phạm vi | Kết quả |
|---|---|---|
| Unit Chat | `gchat-units.test.ts` (không DB) | **91/91** đạt (lượt 1: 58) |
| Tích hợp Chat | `gchat-units` + `gchat-notify` + `gchat-worker-only` (DB thật) | **116/116** đạt ở 4 múi giờ tiến trình: `Asia/Ho_Chi_Minh`, `UTC`, `America/Los_Angeles`, `Pacific/Kiritimati` |
| Toàn bộ api | `vitest run` (DB thật, có `BOOTSTRAP_*`) | **141 tệp đạt, 2 bỏ qua; 3387 ca đạt, 19 bỏ qua; 0 lỗi** (116 s). Khớp số BE báo |

Chưa chạy: lint, typecheck, format, integrations (không đổi trong commit này). Phần này dựa vào CI của PR.

### 2. Chuỗi biên – kết quả trên `98ff43bb`

"Che" = cả trường thành `(có dãy số giống giấy tờ hoặc thẻ – xem trên Desk)`. Lời nhắn thử dạng `CCCD <chuỗi> nhé`.

**2a. Chuỗi lượt 1 – tất cả bị che (tên và lời nhắn)**

| Chuỗi | Form | Tin mức C |
|---|---|---|
| `0790<ZWSP>12345678`, `079<WJ>203<WJ>012<WJ>345`, `079203<SHY>012345`, `4111<ZWSP>1111<ZWSP>1111<ZWSP>1111` | Nhận | Che |
| `079_203_012_345`, `4111_1111_1111_1111`, `079,203,012,345`, `079/203/012/345`, `079<NBSP>203<NBSP>012<NBSP>345` | Nhận | Che |
| `０７９２０３０１２３４５` (toàn độ rộng) | Nhận | Che |
| Đối chứng `079203012345` | Từ chối | Che |

**2b. Chuỗi mới cố lách – bị che (tên và lời nhắn)**

| Nhóm | Chuỗi | Tin mức C |
|---|---|---|
| Trộn ZWSP và `_` | `079_<ZWSP>203_<ZWSP>012_<ZWSP>345`, `079<ZWSP>_203<ZWSP>_012<ZWSP>_345`, `079.<ZWSP>203.<ZWSP>…` | Che (lần kiểm sau khi bỏ Cf bắt được) |
| Tách từng chữ số | ZWSP giữa mỗi chữ số; `_` giữa mỗi chữ số (CCCD và thẻ 16 số) | Che |
| Chữ số hệ khác | Devanagari `०७९२०३०१२३४५`, Thái `๐๗๙…`, Bengal `০৭৯…`, trộn `0७9२03०12३45`, Devanagari + ZWSP, Devanagari `_`, Ả Rập `_` | Che |
| Chữ số tương thích | Toán học đậm `𝟎𝟕𝟗…`, đơn cách (thẻ) `𝟺𝟷𝟷𝟷…`, chỉ số trên `⁰⁷⁹…`, khoanh tròn `⓪⑦⑨…` | Che |
| Khoảng trắng lạ | U+2009, U+3000 giữa các nhóm | Che |
| Số trong URL | `https://pay.example/?card=4111111111111111`, `…/c/4111-1111-1111-1111/x`, `…/cccd/079203012345`, `https://visa.example/B1234567/` | Che (form cũng từ chối) |
| Số thẻ trong URL có ZWSP | `https://pay.example/?c=4111<ZWSP>1111<ZWSP>1111<ZWSP>1111` | Che (form nhận) |
| Tên có `__`, hai dấu cách, xuống dòng | `0790__12345678`, `079__203__012__345`, `079  203  012  345`, `079⏎203⏎012⏎345` (cả `\r\n`, U+2028) ở **tên** | Che (`plain` gộp dấu cách, tên một dòng) |
| Lời nhắn > 8 dòng | (ca của BE) dòng 9 nối vào dòng 8 thành `079 203 012 345` | Che |

**2c. SĐT và chữ thường ở mức C**

| Lời nhắn | Tin mức C |
|---|---|
| `Gọi em số 0905 111 222 nhé`, `0905111222`, `0905.111.222`, `0905-111-222`, `0905_111_222`, `+84 905 111 222`, `+84905111222`, `84905111222`, `０９０５１１１２２２` | **Hiện như khách gõ** |
| `0905 111 222, 0905 333 444`, `Zalo 0905111222 hoặc 0283 822 1234`, `Đến 12/11/2026, đi 15/11/2026, 2 người lớn 1 trẻ 5 tuổi`, `Ngân sách 1,500,000 đ/đêm`, `Gọi sau 18:00 ngày 12.11`, `Phòng 101, 102`, `Mã đặt Agoda 1234567890` | Hiện như khách gõ |
| `0905111222,0905333444` (hai SĐT nối `,` không dấu cách) | Che thừa (20 chữ số, có đoạn qua Luhn). Form nhận. Đúng đánh đổi SEC đã chấp nhận ở lượt 3 |
| `(+84) 905-111-222` | Che. Nhưng **form đã từ chối** chuỗi này từ trước (`905-111-222` có 9 chữ số, dấu `)` chắn ngoại lệ `+`). Lỗi che thừa có sẵn ở luật form, không do PR. Ghi vào thẻ 06 |

Test tích hợp BE "render C: a valid guest phone is printed" (dòng `Liên hệ: +84905111222 · kênh: Zalo` và lời nhắn lặp lại SĐT) chạy xanh trong 116/116. Dòng `Liên hệ:` không đi qua `chatSafeText`.

**2d. Còn lọt – khe của luật chung V-09, không do bước làm sạch tạo ra**

| Chuỗi | Form | Tin mức C | Nhóm |
|---|---|---|---|
| `0790__12345678`, `079__203__012__345`, `079_/203_/012_/345` (lời nhắn) | Nhận | Lọt (y nguyên) | Nhiều ký tự tách |
| `079 - 203 - 012 - 345`, `079  203  012  345` (lời nhắn), tên `079_/203…` → `079 /203 /012 /345` | Nhận | Lọt | Nhiều ký tự tách (SEC GCHAT-07 đã ghi) |
| `079⏎203⏎012⏎345`, `4111⏎1111⏎1111⏎1111`, `079203⏎012345` (lời nhắn, cả `\r\n`, U+2028) | Nhận | Lọt (mỗi nhóm một dòng trong khối mã) | Xuống dòng (SEC GCHAT-07 đã ghi) |
| `079–203–012–345`, U+2011, `079·203·012·345`, `4111'1111'1111'1111` | Nhận | Lọt | Dấu tách hiện được ngoài bộ `[ .-_/,]` (SEC đã ghi gạch Unicode và `·`) |
| `079<CGJ U+034F>203…`, `079<VS1 U+FE00>203…`, `0790<VS16>12345678` | Nhận | Lọt. **Chat hiện liền như `079203012345`**, vì các ký tự này vô hình mà không thuộc `\p{Cf}` | Ký tự vô hình loại Mn |
| `0️⃣7️⃣9️⃣…` (keycap), `0̃7̃9̃…` (dấu kết hợp trên mỗi chữ số) | Nhận | Lọt | Dấu kết hợp (Mn/Me) |
| `079<U+3164>203…` (Hangul filler), `079<U+2800>203…` (Braille trống) | Nhận | Lọt | Ký tự trống không phải khoảng trắng |
| `pay.example/?c=4111%201111%201111%201111`, `…/079%E2%80%8B203%E2%80%8B…` | Nhận | Lọt | Mã hóa URL |

Vì sao QA **không mở lại** 057:
- Kỳ vọng của 057 là: không bước làm sạch nào được ghép ra một số mà luật không còn thấy. Ba lần kiểm, trong đó lần cuối chạy trên chính chữ in ra, giữ đúng điều này. QA không tìm được chuỗi nào mà chữ in ra **khớp** luật số nhưng vẫn lọt.
- Các chuỗi ở 2d lọt vì luật số chung không đọc được chúng, ở cả form, DB và Desk. Chat chỉ in lại y nguyên.
- SEC lượt 3 đã đánh giá các dạng cố ý che (dấu kết hợp, U+034F, VS16, `·`) là rủi ro còn lại thấp: người có giấy tờ không có lý do che số của chính mình. QA đồng ý. QA giữ mức P2 cho BUG-R3-058, và theo SEC, GCHAT-07 bước 1–3 là điều kiện trước khi đặt C.
- Ba nhóm SEC chưa liệt kê thì QA bổ sung vào thẻ 06: ký tự vô hình Mn/Default_Ignorable, ký tự trống Hangul/Braille, và mã hóa URL.

### 3. TC-GC-10 – cách BE viết ca 07:00

BE thêm ca `edges (QA TC-GC-10)` vào `gchat-notify.test.ts`. Ca này dùng kênh `phone`, ngày đến +3, và kiểm như sau:
- tick 07:29:59: cả ba yêu cầu chưa có tin;
- tick 07:30:00: 22:00:00 và 06:59:59 có `web_request_morning`, còn 07:00:00 thì `not.toContain('web_request_morning')`;
- tick 07:31: không có tin trùng.

Đánh giá: **hợp lý và đúng mã**.
- Cửa sổ ca đêm của `morningNudge` là `created_at >= hôm qua front_desk_hours.to AND < hôm nay .from`, tức [22:00, 07:00).
- `replyPlan` coi giờ trực là `within = t >= from && t < to`, tức [07:00, 22:00).
- Hai mốc khớp nhau, nửa mở cùng chiều. Vì vậy 22:00:00 là ca đêm, 07:00:00 là trong giờ, và không có yêu cầu nào vừa được nhắc sáng vừa được tính SLA trong giờ.
- `hhmm` cắt giây, nên 06:59:59 là `06:59`, ngoài giờ.

Điểm yếu nhỏ: với ca 07:00, `not.toContain` vẫn đạt nếu yêu cầu bị gửi nhầm **tin quá hạn** lúc 07:30. QA thử sửa tạm trong worktree (không commit, đã hoàn tác), thêm 3 kiểm:
- 07:30: `toEqual([])`;
- 08:29:59: `toEqual([])`;
- 08:30:00: ca 07:00 = `['web_request_overdue']`, vì `phone` trong giờ nhưng trước khung gọi 08:00, nên `reply_by` = 08:00 + 30 phút. Ca 22:00 = `['web_request_morning', 'web_request_overdue']`.

Kết quả: **đạt**. Mã đúng, chỉ cần khóa chặt hơn (thẻ 05).

### 4. Thẻ feedback mới

### FB-R3-QA-BE-GCHAT-05
- Mức độ: Suggestion
- Vị trí: `product/services/api/test/integration/gchat-notify.test.ts`, ca `edges (QA TC-GC-10)`, dòng `expect(await kinds(at0700.id)).not.toContain('web_request_morning')`
- Vấn đề: kiểm "không chứa" vẫn đạt nếu ca 07:00 bị gửi nhầm `web_request_overdue` lúc 07:30. Ca này cũng chưa khóa mốc quá hạn trong giờ của kênh `phone` (08:30).
- Vì sao quan trọng: mốc nửa mở [07:00, 22:00) phải khớp giữa `replyPlan` và `morningNudge`. Nếu sau này ai đổi một bên thành `<=`, ca này nên đỏ.
- Đề xuất sửa: 07:30 dùng `toEqual([])`; thêm tick 08:29:59 (`[]`) và 08:30:00 (`['web_request_overdue']`); khi đó ca 22:00 = `['web_request_morning', 'web_request_overdue']`. QA đã chạy thử bản này: xanh. Làm khi PR có commit kế tiếp, không cần commit riêng.
- Trạng thái: Open

### FB-R3-QA-BE-GCHAT-06
- Mức độ: Minor (không chặn gộp PR #16; đi cùng FB-R3-SEC-BE-GCHAT-07, là điều kiện trước khi đặt C)
- Vị trí: luật chung `website-request-rules.ts` (`looksLikeIdNumber`, `looksLikeCard`, `GROUPED_DIGITS`) và bản kiểm `looksLikeSensitiveNumber` trong `chat-message.ts`. Gắn với BUG-R3-058.
- Vấn đề: bảng 2d. Ngoài các nhóm SEC đã ghi trong GCHAT-07, còn 3 nhóm lọt cả form lẫn tin C:
  - (a) ký tự vô hình không thuộc `\p{Cf}`: U+034F, U+FE00–FE0F. Chat hiện số liền mạch, giống hệt ca ZWSP của 057;
  - (b) ký tự trống không phải khoảng trắng: U+3164 Hangul filler (là Default_Ignorable nhưng loại Lo, nên bước "bỏ `\p{M}`" của SEC không bắt), U+2800;
  - (c) mã hóa URL `%20`, `%E2%80%8B` giữa các nhóm.
  - Ngoài ra, luật form đang **che thừa** `(+84) 905-111-222`: form từ chối 422, khách không gửi được.
- Vì sao quan trọng: (a) là đúng dạng "vô hình rồi ghép" của 057, chỉ khác loại ký tự. Rủi ro thấp vì phải cố ý chèn (đồng ý SEC). Sửa rẻ, nên làm cùng GCHAT-07.
- Đề xuất sửa (chỉ trên bản dùng để kiểm, chữ in ra không đổi):
  - Thêm vào GCHAT-07 bước 1: bỏ `[\p{Default_Ignorable_Code_Point}\p{M}]` sau NFKC.
    - QA đã thử ở scratchpad: `looksLikeSensitiveNumber(s) || looksLikeSensitiveNumber(strip(s))` che được U+034F, VS1, VS16, keycap, dấu kết hợp, U+3164, thẻ có U+034F, U+034F + `_`.
    - Vẫn giữ nguyên: `0905 111 222 nhé`, emoji có tông da, emoji gia đình ZWJ, tên tiếng Việt, ngày, số tiền, `+84 905 111 222`, `Zalo 0905111222`.
  - Coi U+2800 là khoảng trắng.
  - Giải mã `%XX` trên bản kiểm khi chuỗi có dạng URL (không bắt buộc, rủi ro thấp nhất).
  - Ca test "không che nhầm" của BE-D: thêm `(+84) 905-111-222`; ca này phải **qua** form.
  - Khi BE-D sửa luật chung (BUG-R3-058), nên để form và Chat dùng **một** hàm kiểm duy nhất. Nếu không, hai bên sẽ lệch nhau: hiện Chat hiểu `_ / ,`, form thì không.
- Trạng thái: Open

### 5. Trạng thái thẻ lượt 1

| Thẻ | Trạng thái sau lượt 2 |
|---|---|
| FB-R3-QA-BE-GCHAT-01 (BUG-R3-057) | **Done – QA xác nhận** trên `98ff43bb` |
| FB-R3-QA-BE-GCHAT-02 (BUG-R3-058) | Chuyển BE-D (đồng ý). Bổ sung bởi thẻ 06 |
| FB-R3-QA-BE-GCHAT-03 | Chuyển PO/BA (đồng ý). Vẫn là điều kiện trước khi đặt C |
| FB-R3-QA-BE-GCHAT-04 | Chuyển OPS/INT (đồng ý) |
| TC-GC-01, 02, 06, 10 | Có trong PR, xanh. TC-GC-10 xem thẻ 05 |
| TC-GC-03–05, 07–09, 11–14 | Chưa có. Giữ ưu tiên như mục 4 lượt 1 |

### 6. Điều kiện (cập nhật)

**Gộp PR #16 (phía QA):** đạt. Còn chờ job CI `format · lint · audit · test · build` trên `98ff43bb` xanh. Không còn thẻ Major mở từ QA.

**Trước khi đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` trên production:**
- `98ff43bb` nằm trong bản v1.0.1 đã lên production; BUG-R3-057 chuyển Closed;
- FB-R3-SEC-BE-GCHAT-07 bước 1–3, kèm thẻ 06 (a) và (b), lên cùng lúc hoặc trước đó;
- TC-GC-14 có trong lượt kiểm INT trên phòng thử;
- FB-03 đã chọn dạng mã, và sổ tay WR8 ghi đúng dạng đó.

Dòng decision-log đề nghị ORC ghi:
`| 2026-10-31 | 3 | QA – test lại PR #16 head 98ff43bb: BUG-R3-057 Đã sửa – đã xác nhận (Closed khi gộp main + CI xanh). Test: gchat-units 91/91, Chat 116/116 ở 4 múi giờ tiến trình, api 3387 đạt / 0 lỗi (141 tệp). 11 chuỗi lượt 1 + 24 chuỗi mới (trộn ZWSP và _, chữ số Devanagari/Thái/Bengal/toán học, số thẻ trong URL, tên có __ hoặc xuống dòng) đều bị che; SĐT hợp lệ vẫn hiện. Còn lọt là khe của luật chung V-09 (nhiều ký tự tách, xuống dòng ở lời nhắn, gạch Unicode, U+034F/VS, U+3164, %20), không do bước làm sạch: ghi vào BUG-R3-058 + FB-06, đi cùng SEC GCHAT-07 trước khi đặt C. TC-GC-10 đúng mốc [07:00, 22:00); đề nghị khóa chặt hơn (FB-05) | QA | Quyền QA (mức lỗi, kết luận kiểm thử) |`
