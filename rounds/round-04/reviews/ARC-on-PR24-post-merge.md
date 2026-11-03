# ARC review sau gộp – PR #24 (một bộ dò V-09 cho form và Google Chat; `shared/log-line.ts` của worker)

- Người review: ARC | Round 4 – Bước: Review (điều kiện QC v1.0.3 ĐK2(b) = ĐK12(b) QC v1.0.2) | Ngày: 03/11/2026
- Tác giả: BE-D. PR #24 `be-d/v1.0.1-text-safety`, head `ac86a772`, gộp `main` 03/11 03:40Z, merge commit `dea48d69`. Đã có SEC 3 lượt (Duyệt @ `80a73367`), QA 3 lượt (ĐẠT, 233 ca).
- Đã đọc: `gh pr view 24`, `gh pr diff 24` (14 tệp); mã trên `main` hiện tại: `modules/public-site/internal/sensitive-number.ts`, `website-request-rules.ts`, `public-booking.service.ts`, `website-requests.service.ts`, `public/chat-message.ts`, `shared/log-line.ts`, `worker.ts`, `worker-chat.ts`; test `text-safety-units.test.ts`, `gchat-units.test.ts` khối "worker log line"; `shared/validation.ts` (`containsCardNumber`) để đối chiếu; review `SEC-on-PR24-text-safety.md` (3 lượt), `qa/pr24-text-safety.md`.
- Không checkout nhánh, không commit, không đăng lên PR.

## Kết luận: **ĐẠT**

0 Blocker, 0 Major. 2 Minor + 2 Suggestion, đều đích **v1.0.4**, không chặn v1.0.3.

**Ảnh hưởng tới v1.0.3 / production:** không có.
- PR #24 đã là tổ tiên của `e5fffe05` (`git merge-base --is-ancestor dea48d69 e5fffe05` đúng), tức production v1.0.2 chạy mã này từ 03/11.
- v1.0.3 không đụng các tệp này: `git diff --stat e5fffe05 da6d6f3d` trên `modules/public-site`, `shared/log-line.ts`, `shared/validation.ts`, `worker.ts`, `worker-chat.ts` rỗng (khớp gate v1.0.3 mục 2.5 S2).
- Hai thẻ Minor dưới đây là khoảng hở **có sẵn từ trước PR #24**, không phải hồi quy.

## 1. Kiểm đã chạy

| Kiểm | Kết quả |
|---|---|
| Đường gọi (`grep` trên `src`) | `sensitiveNumberKind` dùng ở: form tên khách và ghi chú (`public-booking.service.ts` 512, 523), ghi chú từ chối (`website-requests.service.ts` 604). `chatSafeText` gọi `looksLikeSensitiveNumber` (= `sensitiveNumberKind(...) !== null`) ở 3 chỗ (thô, sau làm sạch, bản in cuối). Không còn luật thứ hai trong `chat-message.ts`. Test "one rule for the form and Chat" khóa điều này. **Đạt** |
| Ranh giới module | `sensitive-number.ts` nằm trong `public-site/internal`. `chat-message.ts` (thư mục `public/` cùng module) nhập qua `website-request-rules`. Không module khác nhập thẳng `internal/` của `public-site`. **Đạt** (xem thẻ 01 về phạm vi "một luật") |
| Chi phí và ReDoS | Đọc mã: các regex không có lặp lồng gây quay lui lũy thừa. `JOIN`, `TIGHT_JOIN` chỉ chạy trên khoảng trống giữa hai nhóm số. Vòng Luhn tuyến tính theo độ dài (≤ 7 cửa sổ mỗi vị trí). Vòng ID và thẻ dừng ở tổng 18–19 chữ số. Đo bằng `tsx` trên máy: chuỗi 11.000 ký tự số + dấu cách: 3 ms; 4.000 ký tự `d.` xen kẽ: < 1 ms. Form cắt ghi chú ở 500 ký tự trước khi dò. Test "cost" có trong bộ. **Đạt** |
| Regex có cờ `g` dùng với `.test` | Không có. Cờ `g` chỉ dùng với `replace`/`matchAll`, nên không dính `lastIndex`. **Đạt** |
| Bản kiểm không lộ ra ngoài | Bản kiểm (`digitsCopy`, `lettersCopy`) chỉ dùng trong hàm, không log, không lưu. Form lưu chữ khách gõ, không lưu bản chuẩn hóa. **Đạt** |
| `logLine` | `Object.assign({level,msg}, rest, {level,msg})`: thứ tự khóa `level`, `msg` đứng đầu như trước PR (lệnh `grep '"msg":"chat'` của README 13.2 vẫn khớp). Trường phụ không đè được `level`/`msg`. `toJSON` bị bỏ. Tôi chạy thêm: khóa `__proto__` từ `JSON.parse` bị rơi (không đổi prototype của `Object`), dòng vẫn đúng. Worker là chỗ dùng duy nhất. Dispatcher thư (v1.0.3) và Chat nhận cùng hàm `log` này. **Đạt** (thẻ 03 là Suggestion) |
| Test khóa | `gchat-units.test.ts` "worker log line": `detailLevel`, đè `level`/`msg`, `toJSON`. `text-safety-units.test.ts` 153 ca + các khối SEC/QA. QA lượt 3: api 3624/0 lỗi. CI `main` @ `e5fffe05` (run 41594706912) xanh, api cache miss. **Đạt** |

Thử vài chuỗi biên trên máy (`tsx`, chỉ dữ liệu giả):

| Chuỗi | `sensitiveNumberKind` | `containsCardNumber` (luật dùng chung cũ) |
|---|---|---|
| `CCCD 079203012345` | `id` | – |
| `4111 1111 1111 1111` | `card` | `true` |
| `4111` + ZWSP + `1111` + ZWSP + … | `card` | **`false`** |
| `41-11-11-11-11-11-11-11` (thẻ viết từng cặp, gạch nối) | **`null`** | `true` |
| `07.92.03.01.23.45` (CCCD viết từng cặp, dấu chấm) | **`null`** | – |
| `(+84) 905-111-222`; `Đến 12/11 lúc 22:30, 2 người` | `null` | `false` |

## 2. Thẻ feedback

### FB-R4-ARC-BE-PR24PM-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/shared/validation.ts` `containsCardNumber` (luật V-09 cũ, chỉ thẻ, chỉ nhóm cách bằng một dấu cách/gạch, không chuẩn hóa) và nơi gọi: `guest-portal` (`guest-requests.service.ts` 391, 649; `guest-portal.service.ts` 525), `registration/internal/rules.ts` 130, 521, `reservations/internal/inputs.ts` 167, `payments/internal/refunds.service.ts`, `platform/public/receiving-account.ts`. So với `public-site/internal/sensitive-number.ts`.
- Vấn đề: PR #24 nói "one detector" và đúng **trong `public-site`**. Toàn hệ thống vẫn có **hai luật V-09**. Luật cũ trong `shared/` không đọc được chữ số bị chen ZWSP, chữ số toàn chiều rộng, nhóm cách bằng `_` `/` `,` (BUG-R3-058 chỉ sửa cho form website). Chữ khách gõ ở cổng khách (`guest-portal`: yêu cầu, ghi chú) vẫn đi qua luật cũ. Ngược lại, luật cũ bắt được thẻ viết từng cặp có gạch nối mà luật mới bỏ lọt (thẻ 02). Hai luật cho kết quả khác nhau trên cùng chuỗi.
- Vì sao quan trọng: V-09 là một quy tắc bảo vệ dữ liệu thẻ chung cho mọi ô chữ tự do, không riêng website. Hai luật trôi dần thì mỗi lần sửa một lỗ (như BUG-R3-058) chỉ vá được một nửa hệ thống. Rủi ro thực tế thấp: dữ liệu chỉ nằm trong Desk, không đi ra Google Chat, và cổng khách đang có lượng dùng nhỏ.
- Đề xuất sửa (v1.0.4, BE-D; SEC + QA duyệt vì sẽ có thêm 422):
  1. Chuyển `sensitive-number.ts` sang `src/shared/` (thuần hàm, không phụ thuộc module). `public-site` nhập lại từ đó.
  2. `containsCardNumber` gọi nửa thẻ của bộ dò mới (`looksLikeCard`) và giữ thêm luật cũ (OR) tới khi thẻ 02 xong, để không mất ca nào đang bắt được.
  3. **Không** áp nửa ID cho `registration` (khai báo lưu trú có ô số giấy tờ hợp lệ) hay ô nhân viên nhập. Chỉ áp cho chữ khách gõ ở `guest-portal`, sau khi PO + SEC đồng ý (giống quyết định G2 của form).
  4. Thêm một test kiến trúc: ngoài `shared/` không tệp nào tự viết vòng Luhn.
- Trạng thái: Open

### FB-R4-ARC-BE-PR24PM-02
- Mức độ: Minor
- Vị trí: `sensitive-number.ts` dòng 68 `DATE` và bước `.replace(DATE, BREAK)` trong `digitsCopy`.
- Vấn đề: bước xóa ngày coi mọi cụm `\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?` là ngày, không kiểm ngày/tháng có hợp lệ. Vì vậy chuỗi số viết **từng cặp** bằng `.` `-` `/` bị xóa trước khi dò: thẻ `41-11-11-11-11-11-11-11` và CCCD `07.92.03.01.23.45` đều ra `null` (bảng mục 1). Form nhận, Chat mức C in nguyên. SEC đã ghi nhận phần CCCD ở lượt 2 (mục "Tiền tố `00`", rủi ro Thấp, không mở thẻ). ARC bổ sung: (a) phần **thẻ** cũng lọt, trong khi luật dùng chung cũ bắt được; (b) cách sửa rẻ và không tăng che thừa.
- Vì sao quan trọng: cách viết này hiếm nhưng có thật khi đọc số qua điện thoại rồi gõ lại. Đây là khe duy nhất ARC thấy mà luật mới yếu hơn luật cũ.
- Đề xuất sửa (v1.0.4, BE-D, SEC duyệt): chỉ xóa cụm khi (1) ngày 1–31 và tháng 1–12 (cả thứ tự ngày/tháng và tháng/ngày), **và** (2) cụm không nằm trong chuỗi ≥ 4 nhóm hai chữ số nối bằng cùng một dấu. Thêm 2 ca trên vào `text-safety-units.test.ts` (nhóm "phải chặn") và giữ nguyên mọi ca "không được che" (ngày, giờ) hiện có.
- Trạng thái: Open

### FB-R4-ARC-BE-PR24PM-03
- Mức độ: Suggestion
- Vị trí: `src/shared/log-line.ts`.
- Vấn đề: `JSON.stringify` ném lỗi với `BigInt` hoặc vòng tham chiếu. Hiện mọi nơi gọi chỉ truyền chuỗi/số (`errorTag` chỉ lấy tên và mã), nên chưa xảy ra. Nhưng một lời gọi log ném lỗi giữa vòng dispatcher sẽ thành lỗi job, không phải dòng log.
- Đề xuất sửa: bọc `try/catch`, lỗi thì trả `{"level":…,"msg":…,"logError":"UNSERIALIZABLE"}`. Thêm 1 ca test. Làm khi có PR chạm worker ở v1.0.4.
- Trạng thái: Open

### FB-R4-ARC-BE-PR24PM-04
- Mức độ: Suggestion
- Vị trí: `worker.ts` 140 (`console.error` thô ở `main().catch`), các tệp `jobs/*`.
- Vấn đề: `logLine` chỉ được dùng nếu người viết nhớ dùng `log`. Dòng lỗi khởi động vẫn là chữ thô, không phải JSON. Cũng chưa có gì ngăn một job mới viết `console.log(JSON.stringify({...}))` như lỗi cũ.
- Đề xuất sửa: thêm luật ESLint `no-console` cho `src/worker*.ts` và `src/jobs/**` (cho phép trong `log-line` và test). Dòng lỗi khởi động in qua `logLine('error', 'worker failed', errorTag(err))`. Không in `err.message` (giữ SEC S-1).
- Trạng thái: Open

## 3. Việc cho ORC/PO

- Đưa thẻ 01–04 vào backlog 5.6, đích v1.0.4, vai BE-D (cùng đợt ĐK13 của QC v1.0.3).
- Với ĐK12(b) QC v1.0.2 / ĐK2(b) QC v1.0.3: tệp này là review sau gộp của ARC. Không cần dòng "ARC giao cổng cho SEC + QA".

## 4. Dòng decision-log đề nghị (ORC ghi)

`| 2026-11-03 | 4 | ARC – review sau gộp PR #24 (dea48d69, BE-D: sensitive-number.ts một bộ dò V-09 cho form + Google Chat; shared/log-line.ts): ĐẠT, 0 Blocker/Major. Không ảnh hưởng v1.0.3/production (mã có trong v1.0.2; v1.0.3 không đổi các tệp này). Dời v1.0.4: PR24PM-01 (Minor, gộp luật V-09 cũ containsCardNumber của shared/validation vào bộ dò mới, chuyển sang shared/; không áp nửa ID cho registration), PR24PM-02 (Minor, bước xóa ngày làm lọt số viết từng cặp 41-11-…, 07.92.…), PR24PM-03/04 (Suggestion, logLine chịu lỗi serialize, no-console cho worker/jobs). Đóng ĐK12(b) v1.0.2 = ĐK2(b) v1.0.3 | ARC | Quyền ARC (kiến trúc, chuẩn code) |`

## 5. Điểm làm tốt

1. Gom ba luật (form, Chat, ghi chú từ chối) về một hàm có kiểu trả về `'card' | 'id' | null`, kèm test khóa "Chat và form không được lệch". Đây đúng là cách ngăn BUG-R3-057/058 quay lại.
2. Chạy luật trên cả bản đã giải mã `%XX` và bản gốc rồi OR lại (SEC PR24-02): bước chuẩn hóa chỉ được thêm phát hiện, không bớt. Nguyên tắc đơn giản, dễ kiểm.
3. `logLine` sửa đúng gốc lỗi (trường phụ đè `level`) bằng một hàm nhỏ có test, và README 13.2 ghi cả dạng dòng cũ lẫn mới cho OPS.
