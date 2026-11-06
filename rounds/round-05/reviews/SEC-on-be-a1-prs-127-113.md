# SEC – Review PR #127 (`r5-text-strip`) và PR #113 (`r5-v5-46-server`) của BE-A1

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng (thứ tự gộp ORC giao: #127 → #113):

| PR | Nhánh | HEAD SEC đọc | Gốc so sánh | Trạng thái lúc đọc |
|---|---|---|---|---|
| **#127** | `r5-text-strip` | **`5c66ca15`** (commit `cfa10ab8` + gộp `main`) | `da596507` (merge-base với `main`) | DRAFT. CI đang chạy |
| **#113** | `r5-v5-46-server` | **`fc81e03d`** (commit `7feb3475`, `108a1466` + 3 lần gộp `main`) | `da596507` | DRAFT. CI đang chạy |

- #127 sửa thẻ SEC trên #106: **FB-R5-SEC-BE-A1A-01** (giờ rời không sớm hơn giờ nhận phòng thật) và **FB-R5-SEC-BE-A1B-01** (`Fields.text` bỏ ký tự điều khiển). Cùng PR có DOM PR106-01 và ARC A1-01.
- #113 là phần máy chủ của V5-46: thẻ **FB-R5-SEC-BE-V546-01** (Major) cộng **FB-R5-ARC-BE-V546-01**.
- Bốn lần gộp `main` (`5c66ca15`, `dc4d57c2`, `ea3887a5`, `fc81e03d`) không có hunk tự sửa (`git show --cc` rỗng).
- `git merge-tree`:
  - #127 và #113 gộp sạch với `main` @ `31636794` và gộp sạch với nhau;
  - #127 với #99 @ `92d16358` **xung đột một chỗ**, `frontdesk/audit-entities.ts` (mục 1.4).

Cách kiểm:
- Đọc diff bằng `git diff da596507 <HEAD>` và `git show`. Không checkout nhánh nào trong thư mục chính.
- Chạy test trong worktree riêng ở scratchpad, với một PostgreSQL 17 tạm (vai `ottimo_app`/`ottimo_migrator` như CI):
  - #127: hai tệp test của PR, 31/31 qua;
  - #113: tệp test của PR, 6/6 qua;
  - thêm tệp probe của SEC, không commit.
- Probe đường quá ngày đi của #99 sau khi có #127: SEC gộp tạm `5c66ca15` vào `92d16358` trong worktree riêng, chỉ ở máy, không đẩy lên. Xung đột allowlist được giải bằng cách giữ cả hai danh sách.
- gitleaks v8.21.2 (đúng image và `.github/gitleaks.toml` của CI) trên commit của hai PR, và trên cây tệp đổi. Không có phát hiện nào trong tệp của hai PR.
- Không gọi staging hay production.

Tệp này không có bí mật, mật khẩu, IP hay dữ liệu khách. Số giấy tờ và số thẻ trong tệp là số mẫu (`079000000000`, `C1234567`, `4111…`).

---

## 0. Kết luận

| PR | Kết luận | Thẻ |
|---|---|---|
| **#127** @ `5c66ca15` | **DUYỆT.** Gộp khi hết DRAFT và CI xanh trên đúng SHA. A1A-01 và A1B-01 → **Done**. | 0 Blocker · 0 Major · 1 Minor (127-01) · 0 Suggestion |
| **#113** @ `fc81e03d` | **DUYỆT.** Gộp **sau #127**, khi hết DRAFT và CI xanh. FB-R5-SEC-BE-V546-01 → **Done** khi gộp. | 0 Blocker · 0 Major · 0 Minor · 1 Suggestion (113-01) |

Không thẻ nào là điều kiện gộp.
- **127-01** (Minor): bộ lọc ký tự dùng chung còn sót một số ký tự ẩn và surrogate lẻ. Hệ quả:
  - một lý do bắt buộc chỉ gồm ký tự ẩn vẫn được nhận;
  - trên đường quá ngày đi của #99, surrogate lẻ còn ra 500.

  Bản sửa đúng như SEC đã đề xuất và thử ở #106. Phần còn sót nằm ở danh sách ký tự có từ trước. SEC khuyến nghị làm 127-01 **trước tag v1.0.5**, tốt nhất ngay trong #127 vì PR còn DRAFT. SEC đã thử, xem mục 3.
- **#113 lên cùng tag hoặc sau #107**: #107 đã gộp (`1c155881`), nên luật SEC 04/11 đã thỏa.

Nếu một trong hai PR thêm commit chạm mã nguồn (`src/`) trước khi hết DRAFT, SEC đọc lại phần chênh. Commit chỉ gộp `main` hoặc chỉ sửa test thì không cần.

Câu hỏi của ORC, trả lời ngắn:

| Câu hỏi | Trả lời | Mục |
|---|---|---|
| #127: bản sửa có đúng bản SEC đã thử không? | **Đúng.** `stripControlChars(v).trim().replace(/\s+/g, ' ')` đặt trước mọi kiểm. Chữ rỗng sau khi bỏ thì xử như vắng. Kiểm số thẻ chạy trên chữ đã bỏ ký tự ẩn. Bản này áp cho mọi chỗ gọi `Fields.text`: 37 chỗ, cộng 1 chỗ `quotes.text(` là hàm khác, thành con số "38" PR ghi | 1.2 |
| #127: A1A-01 có áp ở mọi nhánh không? | **Có.** Cả `checkoutAt` gửi lên lẫn nhánh quy đổi, ở cả tóm tắt, QR và B18. Đường quá ngày đi của #99 cũng dùng chung hàm này | 1.1 |
| #127: còn đường lọt không? | Bidi override/embedding/isolate, LRM/RLM, ZWSP/ZWNJ/ZWJ, C0/C1: **bỏ hết**. NBSP và các khoảng trắng Unicode khác: đổi thành dấu cách. **Còn sót**: tag chars, U+2060–2064, U+00AD, U+061C, chữ đệm Hangul, variation selector, surrogate lẻ… → thẻ 127-01 | 1.2 |
| #127: có phá log/audit, có lộ dữ liệu khách trong lỗi không? | **Không.** Lỗi 422 chỉ có `field` + `code`. Ca 500 còn lại chỉ log mã lỗi PostgreSQL. Allowlist audit gộp theo hợp (union), không mất khóa nào | 1.3 |
| #113: bị từ chối có lưu gì không, kể cả `write_count`? | **Không.** Cả lệnh rollback: 6 bảng (test PR), dòng `online_checkin` và `write_count` (test PR), `idempotency_key` (probe SEC: 0 dòng; dùng lại cùng khóa cho ghi chú sạch → 201) | 2.2 |
| #113: lỗi 422 có lặp lại số khách gõ không? | **Không.** Chỉ `field` + `code`, không `detail`. Test kiểm thân lỗi không chứa số. Probe 15 dạng lách đều 422 đúng mã | 2.3, 2.4 |
| #113: E2E có dùng dữ liệu thật không? Có chuỗi giống khóa bí mật không? | **Không.** Chỉ hằng `FAKE_ID = '079000000000'`, khóa idempotency là `randomUUID()`. gitleaks: 0 phát hiện. Tên hằng `SECRETS` trong test tích hợp chứa số mẫu, entropy thấp, không bị bắt. Nên đổi tên: thẻ 113-01 | 2.5 |

ESC mới: **không**.

---

## 1. PR #127 @ `5c66ca15`

### 1.1 A1A-01: giờ rời không sớm hơn giờ nhận phòng thật

`resolveCheckoutAt` (`frontdesk/internal/checkout-at.ts`) thêm `notBeforeCheckIn(i, at)`: `!checkedInAt || at >= checkedInAt`.

| Nhánh | Trước (#106) | Nay | Bằng chứng |
|---|---|---|---|
| `checkoutAt` gửi lên, sớm hơn `actual_checkin_at` | Chỉ chặn ở "tối hôm trước". Ngày đi và cửa sổ sau nửa đêm vẫn nhận (PU1) | `null` → 422 `DATE_INVALID`, `field` = `checkoutAt` | Unit PU1: gửi 00:30 → `null`; 01:00 và 01:10 → nhận. Tích hợp A1A-01: 422 ở tóm tắt, QR và B18; đếm lại `audit_event`, `payment`, trạng thái đơn đều không đổi |
| Quy đổi (gõ giờ, hoặc giờ hẹn hay giờ chuẩn) | Ứng viên có thể sớm hơn giờ nhận phòng | Bỏ ứng viên sớm hơn. Hết ứng viên → 422 `DATE_INVALID`: `field` = `checkoutTime` nếu lễ tân gõ giờ, `checkoutAt` nếu không | Unit: gõ 00:30 → 25/11 00:30 (`afterNow`). Tích hợp: chỉ gõ 00:30 → `TIME_AFTER_ACTION`, không ghi gì |
| Chưa có giờ nhận phòng (`null`) | Không biên | Không biên | Unit |
| Quá ngày đi (#99) | Chưa có | Cùng hàm `CheckoutService.resolveCheckoutAt`. `departedAt = d.checkout.at` là chỗ duy nhất ghi `reservation.actual_checkout_at`. `registration.actual_checkout_at` lấy cùng giá trị qua `onCheckedOut` | Đọc mã `92d16358`. Bản gộp tạm #99 + #127: test #99 vẫn qua (trừ ca probe cố ý dùng hết đơn) |

Lỗi chỉ có `field` + `code`, không nhắc lại giờ gửi lên hay giờ nhận phòng. Đúng đề xuất của SEC, DOM và ARC (ARC ghi vào 0.3.14).

PR106-01 (cờ `typed`): "tối hôm trước" chỉ còn là ứng viên khi lễ tân gõ giờ. Thay đổi này làm giờ rời máy chủ tự chọn ít khi sớm hơn thực tế, và không có tác động bảo mật. Desk v1.0.4 bị 422 ở ca "gõ 23:50 lúc 01:05" tới khi FE-A V5-10 lên. Lỗi này an toàn: không QR nào được tạo.

### 1.2 A1B-01: `Fields.text` bỏ ký tự điều khiển

- Thứ tự mới trong `Fields.text`:
  1. Kiểu khác chuỗi → `VALIDATION_FAILED`, như cũ.
  2. `stripControlChars` → `trim` → gộp khoảng trắng.
  3. Rỗng → `REASON_REQUIRED`/`REQUIRED` khi bắt buộc, `undefined` khi không.
  4. Độ dài tối thiểu, rồi tối đa, tính trên chữ đã bỏ. Chữ lưu vì vậy không bao giờ dài quá giới hạn.
  5. `containsCardNumber` trên chữ đã bỏ.
- Đúng từng chữ bản SEC đã thử ở `SEC-on-be-prs-106-99-checkout.md` mục 5.
- Test đơn vị và tích hợp viết ký tự ẩn bằng escape `\uXXXX`. SEC quét toàn diff của hai PR tìm ký tự thật (C0, C1, NBSP, U+00AD, U+200B–200F, U+202A–202E, U+2060–206F, U+FEFF, tag chars): 0 chỗ.
- Tích hợp đọc lại `audit_event.reason` và `reservation_change.reason`: còn `Khách đi sớm gnirts`. NUL không còn gây 500.

Probe SEC (đơn vị, 36 ký tự; chèn giữa chữ và lý do bắt buộc `min: 3` chỉ gồm ký tự đó):

| Nhóm | Ký tự | Kết quả @ `5c66ca15` |
|---|---|---|
| Điều khiển | NUL, BEL, DEL, NEL (C1) | Bỏ. Chỉ gồm ký tự này → `REASON_REQUIRED` |
| Bidi | LRE, RLO, PDF, LRI, PDI, LRM, RLM | Bỏ. Chỉ gồm → `REASON_REQUIRED` |
| Rộng 0 | ZWSP, ZWNJ, ZWJ | Bỏ. Chỉ gồm → `REASON_REQUIRED` |
| Khoảng trắng Unicode | NBSP, U+202F, U+2028, U+3000, BOM (U+FEFF) | Đổi thành dấu cách (`\s`). Chỉ gồm → `REASON_REQUIRED` |
| **Còn sót** | U+061C (ALM, dấu bidi), U+2060 (WJ), U+2062, U+206A, U+00AD, U+180E, U+3164 và U+115F (chữ đệm Hangul), U+FE0F, U+034F, U+2800, tag chars U+E0001 và U+E0041, U+FFF9, U+1D173, surrogate lẻ U+D800/U+DC00 | **Giữ nguyên.** Lý do chỉ gồm 3 ký tự này **được nhận** |
| Số thẻ có ký tự ẩn xen giữa | U+200B, U+2060, tag U+E0020 | `CARD_NUMBER_DETECTED`: bộ dò dùng `Default_Ignorable_Code_Point` trên bản sao để kiểm |

Probe tích hợp trên bản gộp tạm #99 + #127, đường quá ngày đi (MGR, 1 đêm):
- `overdueReason` = 3 × U+2060 → **200**. `after.overdue.reason` lưu chuỗi không thấy được. `REASON_REQUIRED` bị vượt qua, với đúng chữ OWN dùng để hậu kiểm MGR.
- `overdueReason` có U+D800 → **500** `INTERNAL_ERROR`, cả lệnh rollback.
  - Nguyên nhân: PostgreSQL `22P02` (`json_errsave_error`) khi ghi `after` kiểu jsonb.
  - Log chỉ có `code=22P02 routine=json_errsave_error`, không có thân lệnh.
  - Đây cùng loại với lỗi NUL mà A1B-01 vừa sửa.
- Surrogate lẻ vào cột kiểu text (`checkoutTimeNote`, ghi chú khách) thì thành U+FFFD và không lỗi.

Kết luận: A1B-01 **Done** đúng như thẻ. Phần còn sót là danh sách ký tự trong `shared/validation.ts`, có từ SEC-BE-44, và đề xuất ở #106 của SEC cũng chưa xét tới. SEC mở thẻ **127-01**, không giữ A1B-01 mở.

### 1.3 Log, audit, lỗi trả về

- Lỗi 422 mới (`DATE_INVALID` trên `checkoutTime`, `REQUIRED`/`REASON_REQUIRED` khi chỉ có ký tự ẩn) chỉ có `field` + `code`.
- Không thêm log nào. `ProblemFilter` vẫn chỉ ghi mã, ràng buộc và routine của PostgreSQL.
- ARC A1-01 dời `systemTime`, `extraNight`, `postMidnightWindow` sang `frontdesk/audit-entities.ts`:
  - `defineAuditEntity` gộp theo hợp các danh sách cùng thực thể (`audit-fields.ts` dòng 23–24), và vẫn chạy kiểm `FORBIDDEN` cho từng khóa;
  - `lateSurchargeVnd`, `checkoutMode` vốn đã có ở frontdesk;
  - không thêm khóa nào chứa dữ liệu khách;
  - T10-1 đọc lại audit thấy đủ khóa.
- Chữ đã bỏ ký tự ẩn được lưu vào `audit_event.reason` và `reservation_change.reason`. Không có gì ghi hai chỗ.

### 1.4 Khác

- **Xung đột với #99** ở `frontdesk/audit-entities.ts`: #99 thêm `overdue`, #127 thêm 3 khóa B18, cùng cuối một danh sách.
  - PR gộp sau phải **giữ cả bốn khóa**.
  - Bỏ `overdue` thì `after.overdue` bị allowlist cắt mà không báo lỗi, và `overdueOnly` trả rỗng. T15-9 và T15-12 sẽ bắt được.
  - Bỏ 3 khóa B18 thì T10-1 bắt được.
  - SEC đã giải tạm bằng cách giữ cả hai: test #99 qua.
- Con số "38 chỗ gọi `.text(`" gồm 37 chỗ `Fields.text` và 1 chỗ `QuotesService.text` (`quotes.controller.ts` dòng 246, hàm khác). Không ảnh hưởng gì, chỉ ghi lại cho đúng.

---

## 2. PR #113 @ `fc81e03d`

### 2.1 Phạm vi và thứ tự kiểm

- Đúng hai ô khách gõ: `createGuestRequest.note` (`guest-requests.service.ts` `note()`) và `updateOnlineCheckin.arrivalNote` (`guest-portal.service.ts` `update`).
- Các thao tác khác của cổng khách không có ô chữ tự do: `completeOnlineCheckin` chỉ có `deferredPeople`; `transitionGuestRequest` (`replyNote`) là ô nhân viên nhập. Không áp cho `replyNote`, `registration` hay ô nhân viên nhập. Đúng thẻ V546-01 ý 3.
- Thứ tự kiểm:
  1. Độ dài.
  2. `containsCardNumber`: luật V-09 gốc HOẶC `looksLikeCard`, không đổi, giữ mã cấp trên `CARD_NUMBER_DETECTED`.
  3. Sau cùng mới `looksLikeIdNumber`.

  Chuỗi vừa có thẻ vừa giống giấy tờ ra mã thẻ. Ca hồi quy `4111 1111 11-11 1111` chỉ luật gốc bắt được, và test kiểm cả hai vế. Đúng ARC V546-01 ý 1–2.

### 2.2 Bị từ chối thì không lưu gì

| Đường | Cơ chế | Bằng chứng |
|---|---|---|
| `createGuestRequest` | `note()` chạy trước mọi lệnh ghi. Trước đó chỉ có `ctx()` (chỉ đọc). Không `INSERT guest_request`, không việc HK, không phiếu MT, không audit, không thông báo, không outbox | Test PR: 3 loại × 4 chuỗi, đếm 6 bảng không đổi, không ghi chú nào trong DB chứa số |
| `updateOnlineCheckin` | `ensureRow` và `countWrite` chạy trước, nhưng lỗi `ID_NUMBER_DETECTED` được gom vào `errors` và ném trước `UPDATE`. `withContext` hủy cả giao dịch, nên `write_count` cũng không tăng | Test PR: cả dòng `online_checkin` không đổi, `write_count`/`write_count_date` kiểm riêng, 6 bảng không đổi |
| `Idempotency-Key` | `claim()` chèn `idempotency_key` (có `request_hash` của thân lệnh) trong cùng giao dịch, nên lỗi làm rollback cả dòng này | **Probe SEC**: sau khi bị từ chối còn 0 dòng với khóa đó. Gửi lại cùng khóa với ghi chú sạch → 201 (không `IDEMPOTENCY_KEY_REUSED`), sau đó còn 1 dòng |

Lần bị từ chối không tính vào hạn SR-RL-05. Nhánh thẻ hiện nay cũng vậy. Việc này không mở đường dò: bộ dò là hàm thuần trên chữ khách gửi, không đọc dữ liệu đã lưu.

### 2.3 Lỗi 422

- `note`: `fieldError('note', 'ID_NUMBER_DETECTED')` → `VALIDATION_FAILED`, `errors[{ field, code }]`, `extras` rỗng.
- `arrivalNote`: cùng dạng, gom chung với lỗi trường khác nếu có.
- Không `detail`.
- Test kiểm khóa của mỗi lỗi đúng bằng `['code', 'field']`, và thân lỗi không chứa `079000000000`, `079 000 000 000`, `C1234567`, `9001019`.

### 2.4 Dạng lách (probe SEC)

15 dạng, mỗi dạng chạy ở cả hai ô. Tất cả đều **422 `ID_NUMBER_DETECTED`**:
- số chia nhóm bằng NBSP, U+2060, tag U+E0020, U+200B, xuống dòng, dấu chấm, gạch nối;
- từng chữ số cách nhau bằng dấu cách;
- chữ số toàn chiều rộng, chữ số Ả Rập–Ấn;
- `%E2%80%8B` nằm giữa số;
- hộ chiếu chữ thường `c1234567`;
- số viết ngược trong RLO;
- CMND 9 số;
- số có dấu chấm câu ở cuối.

Surrogate lẻ trong ghi chú khách → 201/200, lưu thành U+FFFD, không 500.

Bộ dò dùng chung đã được SEC review ở Round 4. Danh sách che thừa đã biết vẫn giữ: ba số phòng liền nhau, số 9 chữ số trần.

### 2.5 Log, E2E, gitleaks

- **Log:** test PR bắt log yêu cầu (pino mức trace) và stdout/stderr khi gửi số mẫu: không có số nào. Mã nguồn mới không ghi log.
- **E2E** (`v5-46-guest-id-number.r5.spec.ts`):
  - bỏ `page.route`, nên số mẫu nay tới máy chủ của stack đang test;
  - máy chủ từ chối và không lưu gì. Spec đọc lại qua API khách: vẫn ở bước `eta`, `etaTime` rỗng, danh sách yêu cầu trống;
  - `writesWithNumber` bảo đảm trang chỉ gửi số đúng một lần;
  - chỉ dùng hằng `FAKE_ID = '079000000000'`. Bỏ `fakeCccd()`, đúng SEC FE-V546-03;
  - spec chỉ chạy đúng trên stack có #113, tức CI dựng từ cùng commit. Nếu chạy spec này lên một staging còn ở v1.0.4, số mẫu sẽ được lưu vào staging. Đó chỉ là số mẫu, nên QA chỉ cần không làm vậy.
- **gitleaks** (`ghcr.io/gitleaks/gitleaks:v8.21.2`, `.github/gitleaks.toml`):
  - lịch sử `da596507..5c66ca15` và `da596507..fc81e03d`: không có phát hiện;
  - quét cây tệp không theo git (`--no-git`) có 2 phát hiện, cả hai ở `test/fuzz/invariants.ts`. Tệp này có từ trước, hai PR không đụng tới, nên nằm ngoài phạm vi review này;
  - khóa idempotency trong test là `randomUUID()`, không hằng nào tên KEY/TOKEN;
  - test tích hợp có `const SECRETS = [FAKE_CCCD, '079 000 000 000', …]`. Luật `generic-api-key` không bắt, vì sau dấu `=` là `[`, không phải chuỗi entropy cao. Tên này dễ gây nhầm và dễ bị bắt nếu sau này ai sửa thành một chuỗi: thẻ 113-01.

---

## 3. Thẻ

### FB-R5-SEC-BE-127-01
- Mức độ: **Minor**. Không chặn gộp #127 hay #99. Khuyến nghị làm trước tag v1.0.5.
- Người nhận: BE-A1 (ngay trong #127, PR còn DRAFT; hoặc một PR nhỏ kế tiếp).
- Vị trí:
  - `product/services/api/src/shared/validation.ts` `CONTROL_CHARS` (dòng 26–28 @ `5c66ca15`), qua `stripControlChars`. Hàm này dùng ở `Fields.text` (37 chỗ gọi), `requireReason`, `optionalText`, `guest-requests.service.ts` `note()`, và các tệp `housekeeping`, `work-orders`, `inventory/items`, `folio-lines`;
  - `guest-portal.service.ts` `stripControl` (dòng 841 @ `fc81e03d`): bản riêng, chỉ bỏ C0 + DEL, cho `arrivalNote`.
- Vấn đề:
  - Danh sách ký tự viết tay. Nó bỏ C0, C1, U+200B–200F, U+202A–202E, U+2066–2069, nhưng sót các ký tự ẩn khác mà bộ dò số thẻ/giấy tờ đã coi là ẩn (`\p{Default_Ignorable_Code_Point}`): U+2060–2064, U+206A–206F, U+00AD, U+061C, U+180E, U+3164, U+115F, U+FFA0, U+FE00–FE0F, U+E0100–E01EF, U+034F, tag chars U+E0001 và U+E0020–E007F, U+FFF9–FFFB, U+1D173–1D17A. Cũng sót surrogate lẻ (`\p{Cs}`).
  - Probe mục 1.2:
    - một lý do bắt buộc chỉ gồm 3 × U+2060 vẫn được nhận và lưu. Trên #99 đó là `after.overdue.reason`;
    - `"ok"` + một câu viết bằng tag chars qua được `min: 3`, dài 36 đơn vị;
    - `overdueReason` có U+D800 → 500 (`22P02` khi ghi jsonb).
- Vì sao quan trọng:
  - Câu "chỉ toàn ký tự ẩn thì xử như vắng" của A1B-01 chỉ đúng với các ký tự trong danh sách. Mọi lý do bắt buộc (V-08: khóa phòng, hủy, quá ngày đi…) đều điền được bằng một chuỗi không thấy được. Người làm vẫn có tên trong audit, nhưng phần lý do mất giá trị hậu kiểm.
  - Tag chars mang được cả một câu chữ ASCII ẩn trong lý do. OWN không thấy câu này, còn bản xuất hay công cụ đọc audit về sau thì đọc được.
  - Trên đường quá ngày đi, surrogate lẻ cho 500 thay vì 422. Cùng loại với lỗi NUL của A1B-01.
  - Không lộ dữ liệu: log chỉ có mã lỗi. Từ Desk gần như không gõ được các ký tự này, chủ yếu vào qua API hoặc khi dán.
- Đề xuất sửa (không đổi hợp đồng, không migration):
  1. `CONTROL_CHARS = /[^\P{Cc}\t\n\r]|[\p{Cf}\p{Default_Ignorable_Code_Point}\p{Cs}]/gu;`
     - Như vậy bộ lọc cùng tập "ẩn" với bản sao kiểm của `sensitive-number.ts`, thêm `Cf` và surrogate lẻ.
     - Tab, xuống dòng, CR giữ như nay. Dấu thanh tiếng Việt dạng NFD (`\p{Mn}`) không bị đụng.
     - Chuỗi emoji nối bằng ZWJ vốn đã bị tách từ trước, vì ZWJ có trong danh sách cũ.
     - SEC đã thử regex này trên chữ Việt (NFC và NFD), Hàn, Trung, Nga, Ả Rập, emoji: không đổi.
     - Tùy chọn: đọc U+2800 như khoảng trắng, như bộ dò đang làm.
  2. `arrivalNote` dùng `stripControlChars` chung thay `stripControl` riêng, để cả hệ thống chỉ còn một luật.
  3. Test:
     - `be-a1-v105-units` (`Fields.text`): U+2060 × 3, chỉ tag chars, U+00AD, U+061C, U+FE0F, U+3164 → xử như vắng; U+D800 giữa chữ → bị bỏ;
     - sau khi #99 gộp: `v105-overdue-checkout`, `overdueReason` có U+D800 → 200 (hoặc 422 `REASON_REQUIRED` khi chỉ còn ký tự ẩn), không 500.
  4. SEC đã thử ý 1 trong worktree riêng @ `5c66ca15` và chạy toàn bộ test API. Kết quả trên PostgreSQL tạm, `--maxWorkers=4`, trừ `production-bootstrap`: **187 tệp qua, 2 tệp tự bỏ qua; 4764 ca qua, 19 ca bỏ qua, 1 todo, 0 ca hỏng.** Không test cũ nào đổi kết quả. Trên bản gộp tạm #99 + #127 có regex mới, `overdueReason` = 3 × U+2060 → 422 `REASON_REQUIRED`, không ghi gì; `overdueReason` có U+D800 → 200, lưu `Khách đi sớm` (đã bỏ ký tự). Trong tệp này chỉ T15-2 hỏng, vì ca probe đã dùng hết đơn S1 trước nó, như dự kiến. BE vẫn chạy lại cả bộ trên CI khi làm thẻ.
- Hạn: trước tag v1.0.5. Không kịp thì SEC chấp nhận mức **Low** tới v1.0.6. ORC ghi Deferred có hạn vào decision-log.
- Trạng thái: Open

### FB-R5-SEC-BE-113-01
- Mức độ: **Suggestion**
- Người nhận: BE-A1
- Vị trí: `product/services/api/test/integration/v546-guest-id-number.test.ts`: hằng `SECRETS` (dòng 60), `TABLES` (dòng 62–69).
- Vấn đề:
  1. `SECRETS` chứa số mẫu, không phải bí mật.
     - Hôm nay gitleaks không bắt, vì giá trị là một mảng.
     - Nếu ai đó sửa thành `const SECRETS = '…'` với một chuỗi dài, luật `generic-api-key` sẽ bắt và CI đỏ.
     - Người đọc cũng dễ tưởng tệp có bí mật thật.
  2. `TABLES` chưa có `idempotency_key`. Probe SEC cho thấy dòng này không còn sau khi bị từ chối, nhưng chưa test nào giữ điều đó.
- Vì sao quan trọng: `request_hash` của một thân lệnh có số giấy tờ không được lưu. Một bản sửa sau này của `GuestUnitOfWork`, chẳng hạn ghi khóa ở giao dịch riêng, có thể làm hỏng điều đó mà không ai biết.
- Đề xuất sửa:
  - đổi tên thành `MUST_NOT_APPEAR` hoặc `SAMPLE_NUMBERS`;
  - thêm `idempotency_key` vào ca đếm bảng, lọc theo khóa test gửi (`idem`), vì bảng này không theo tenant;
  - thêm một ca "dùng lại cùng khóa với ghi chú sạch → 201".
- Trạng thái: Open

### Trạng thái thẻ cũ
- FB-R5-SEC-BE-A1A-01 → **Done** @ `5c66ca15`.
- FB-R5-SEC-BE-A1B-01 → **Done** @ `5c66ca15`. Phần ký tự còn sót chuyển sang 127-01.
- FB-R5-SEC-BE-V546-01 → **Done** khi #113 gộp (@ `fc81e03d`): đủ ý 1–5. Ý 6 (chủ việc, ghi vào plan) đã có.

---

## 4. Yêu cầu bảo mật

SEC sửa `product/docs/security/security-requirements.md`, dòng **SR-INP-05**: ô chữ tự do bỏ ký tự điều khiển và ký tự định dạng ẩn trước khi kiểm độ dài và lưu. Tập ký tự là Cc trừ tab, xuống dòng và CR; Cf; Default_Ignorable; surrogate lẻ. Chữ chỉ còn ký tự ẩn hoặc khoảng trắng thì xử như vắng. Hạn v1.0.5 theo 127-01, không kịp thì v1.0.6. SEC thêm một dòng vào lịch sử thay đổi, ghi cả phần sửa SR-PAY-10 cho #119 (`SEC-on-pr-119-delta-and-105-03.md`).

---

## 5. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | SEC – review PR #127 (BE-A1, r5-text-strip) @ 5c66ca15: DUYỆT; PR #113 (BE-A1, r5-v5-46-server) @ fc81e03d: DUYỆT, gộp sau #127, cả hai khi hết DRAFT và CI xanh đúng SHA. #127: A1A-01 Done (checkoutAt gửi lên sớm hơn actual_checkin_at → 422 DATE_INVALID ở tóm tắt, QR, B18; nhánh quy đổi bỏ ứng viên sớm hơn; đường quá ngày đi của #99 dùng chung hàm); A1B-01 Done (Fields.text = stripControlChars + trim + gộp khoảng trắng trước mọi kiểm, rỗng = vắng, số thẻ kiểm trên chữ đã bỏ, đúng bản SEC thử; test viết escape); lỗi chỉ field + code; allowlist gộp theo hợp. FB-R5-SEC-BE-127-01 Minor: CONTROL_CHARS còn sót Default_Ignorable/Cf (tag chars, U+2060, U+00AD, U+061C, chữ đệm Hangul, VS) và surrogate lẻ – lý do bắt buộc chỉ gồm ký tự ẩn vẫn được nhận, overdueReason có U+D800 → 500 (22P02 jsonb) sau #99; sửa một regex dùng chung + arrivalNote dùng hàm chung; trước tag v1.0.5, không kịp SEC chấp nhận Low tới v1.0.6. Khi gộp #99 sau #127 giữ cả overdue và 3 khóa B18 ở frontdesk/audit-entities.ts. #113: chặn ID_NUMBER_DETECTED đúng hai ô khách gõ, thẻ trước giấy tờ sau (containsCardNumber giữ nguyên), từ chối thì rollback cả lệnh (6 bảng, online_checkin, write_count, idempotency_key – probe SEC), 422 không lặp số, 15 dạng lách đều chặn, log sạch, E2E chỉ số mẫu, gitleaks 0. FB-R5-SEC-BE-V546-01 Done khi gộp; 113-01 Suggestion (đổi tên hằng SECRETS, test đếm idempotency_key). SR-INP-05 thêm luật bỏ ký tự ẩn. Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-a1-prs-127-113.md |`

---

## 6. Điểm làm tốt

- #127 sửa đúng **một** chỗ cho cả 37 chỗ gọi, như SEC đề xuất. Mỗi ca mới được chạy thử trên mã cũ để chắc nó hỏng ở đó, và test đếm lại `audit_event`, `payment`, trạng thái đơn, không chỉ xem mã trả về.
- #113 giữ nguyên nhánh thẻ (`containsCardNumber`) thay vì chép mẫu website hẹp hơn, và có ca hồi quy chứng minh điều đó. Test kiểm `write_count` riêng, bắt cả log pino lẫn stdout/stderr.
- E2E của #113 chạy với máy chủ thật, đọc lại qua API khách để chứng minh không lưu gì, và kiểm trang chỉ gửi số đúng một lần.

---

## 7. Phạm vi và giới hạn

- SEC không review phần nghiệp vụ của PR106-01 (thuộc DOM) và chữ hợp đồng 0.3.14 (thuộc ARC). Bộ chọn và bước UI của E2E thuộc FE và QA.
- Bản gộp tạm #99 + #127, worktree, tệp probe và PostgreSQL tạm chỉ nằm trong scratchpad, xóa sau review. Không commit hay đẩy gì lên `r5-text-strip`, `r5-v5-46-server` hay `r5-a1b`.
- SEC không approve hay gộp trên GitHub. ORC gộp.

---

## 8. #127 delta `5c66ca15..ad507f94` và PR #143 @ `d574b518` (bổ sung 07/11/2026)

Round 5 · bước **Review** · SEC.
- Cách đọc: `git show` từng commit của phần chênh; `git show --remerge-diff` cho 3 merge (`15c9cb85`, `3075a6b1`, `ad6b40ab`) và merge gộp `17cbcd6f`; diff ba chấm của #143 với `main`. Không chạy test trên máy, dựa vào CI ở đúng SHA.
- #127 đã được ORC gộp vào `main` ở `17cbcd6f`, đúng head `ad507f94`. Phần này là xác nhận sau khi gộp.
- Mục này không có bí mật, mã đơn hay dữ liệu khách. Chỉ nhắc các số mẫu giả theo tên hằng.

### 8.1 Kết luận

| PR | SHA | Kết luận | Ghi chú |
|---|---|---|---|
| #127 (đã gộp `17cbcd6f`) | `ad507f94` | **DUYỆT** phần chênh | CI ở `ad507f94`: `format · lint · audit · test · build` xanh. E2E smoke, gitleaks, shellcheck còn đang chạy lúc đọc |
| #143 (DRAFT, chỉ test) | `d574b518` | **DUYỆT** | Gộp khi CI xanh trên đúng SHA. Mọi job đang chờ lúc đọc |

0 Blocker · 0 Major · 1 Minor mới (127-02, chuyện có từ trước, không nằm trong phần chênh) · không ESC.

| Thẻ | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-SEC-BE-127-01 (Minor) | **Done @ `ad507f94`** (`6a670f3a`), đã lên `main` | Mục 8.2 |
| FB-R5-SEC-BE-113-01 (Suggestion) | **Done ở #143 @ `d574b518`**. Đóng hẳn khi #143 gộp | Mục 8.4 |
| FB-R5-SEC-BE-127-02 (Minor) | Open (mới) | Mục 8.5 |

### 8.2 127-01 đã sửa, không có gì làm yếu bộ lọc hay bộ dò
- `shared/validation.ts`: `CONTROL_CHARS = /[^\P{Cc}\t\n\r]|[\p{Cf}\p{Default_Ignorable_Code_Point}\p{Cs}]/gu`. Khớp từng ký tự với ý 1 của thẻ.
  - Tập mới là tập **cha** của danh sách cũ: C0, C1, DEL thuộc Cc; U+200B–200F, U+202A–202E, U+2066–2069 thuộc Cf. Không ký tự nào trước đây bị bỏ mà nay lại được giữ.
  - Tab, LF, CR giữ như cũ. U+2800 (tùy chọn) không làm. Bộ dò vẫn đọc U+2800 là khoảng trắng, nên không có kẽ hở mới.
- `arrivalNote` dùng `stripControlChars` chung. Bản riêng `stripControl` (chỉ C0 + DEL) đã bị xóa. Thứ tự giữ nguyên: bỏ ký tự → `trim` → ≤ 300 → `containsCardNumber` → `looksLikeIdNumber` (V5-46 của #113, còn nguyên sau merge `ad6b40ab`).
- Bỏ thêm ký tự trước khi dò không làm yếu bộ dò, vì ba lý do:
  - các ký tự này không phải chữ số hay dấu phân cách;
  - bộ dò (`sensitive-number.ts`) vốn đã bỏ `Default_Ignorable`;
  - bỏ đi chỉ có thể làm các nhóm số liền nhau hơn, tức là dễ bị bắt hơn, không khó hơn.
- Test:
  - unit `be-a1-v105-units`: 9 chuỗi chỉ gồm ký tự ẩn (U+2060, tag chars, U+00AD, U+061C, VS16, chữ đệm Hangul, U+2062/206A/180E, U+FFF9/034F/1D173, surrogate lẻ) → `REASON_REQUIRED`; `"ok"` + tag chars → `REASON_REQUIRED`; surrogate lẻ giữa chữ bị bỏ; chữ Việt NFC/NFD, Hàn, Trung, Nga, Ả Rập, emoji giữ nguyên;
  - integration `v105-overdue-checkout`: `overdueReason` chỉ gồm ký tự ẩn → 422; lý do có U+D800 + U+2060 + tag → 200 và lưu bản sạch (trước đây là 500, `22P02`).

  Chuỗi test viết bằng escape, không có ký tự ẩn thật trong tệp. Đủ ý 3 của thẻ.

### 8.3 Các merge giữ nguyên mã PR
- `15c9cb85` là merge duy nhất có hunk tự ghép, ở `frontdesk/audit-entities.ts`. Kết quả giữ **cả hai**: `systemTime`, `extraNight`, `postMidnightWindow` (B18) và `overdue` (V5-15). Mỗi khóa xuất hiện đúng một lần, cùng ở module `frontdesk`, đúng yêu cầu ghi ở mục 5. Không thêm khóa nào khác vào allowlist.
- `3075a6b1`, `ad6b40ab` (main @ `74189d2c`, gồm #113) và merge gộp `17cbcd6f`: `--remerge-diff` rỗng, không tự sửa hunk nào.
- `ad507f94` chỉ thêm test cho ARC 127-01 (nhánh "không còn ứng viên", trường nào nhận 422). Không đụng bộ lọc hay đường ghi.

### 8.4 PR #143 (113-01): đạt
- Hằng `SECRETS` đổi tên thành `MUST_NOT_APPEAR`, có chú thích "số mẫu giả, không phải bí mật". Đủ ý 1.
- Ca mới cho `createGuestRequest` có chữ chứa số giấy tờ, gửi kèm `Idempotency-Key`:
  - bị từ chối thì **0 dòng** `idempotency_key` cho khóa đó;
  - gửi lại cùng khóa với chữ sạch → **201** và đúng 1 dòng, dòng này không chứa số mẫu nào.

  Ca tự chứng minh là nó đọc thấy bảng: đếm 1 sau lần 201, nên số 0 trước đó có nghĩa thật, không phải do RLS che. 201 thay vì 422 `IDEMPOTENCY_KEY_REUSED` cũng cho thấy hash của thân lệnh bị từ chối không được lưu. Đủ ý 2.
- `updateOnlineCheckin` (PUT) không khai báo `Idempotency-Key` trong `openapi.yaml`, nên ca idempotency không áp cho nó. Lần từ chối của nó đã có ca so dòng `online_checkin` giữ. Đồng ý không phủ thêm.
- `KNOWN_OVERBLOCK` (3 số phòng liền nhau, một số 9 chữ số) ghim đúng các ca chặn thừa SEC đã chấp nhận từ PR #24 (G2). Bộ dò đổi thì test báo ngay.
- E2E: hai chỗ kiểm chặt hơn (`etaTime` không có mặt trong body; danh sách khớp `{ data: [] }`). Không nới gì.

### 8.5 Thẻ mới

#### FB-R5-SEC-BE-127-02
- Mức độ: Minor
- Người nhận: BE-D, cùng PR-B3 vì 5B-1 sửa đích hoàn tiền trong chính tệp này. Không thì BE-B, một PR nhỏ. Hạn v1.0.6. Không chặn tag v1.0.5.
- Vị trí: `payments/internal/refunds.service.ts` dòng 118–119 (`CONTROL_CHARS = /[\u0000-\u001f\u007f]/g`, bản riêng) và dòng 452 (`accountHolder`) @ `ad507f94`.
- Vấn đề: tên chủ tài khoản nhận hoàn tiền vẫn dùng bộ lọc riêng chỉ có C0 + DEL. Đây là ô chữ tự do cuối cùng chưa theo luật chung của 127-01 / SR-INP-05:
  - tên chỉ gồm ký tự ẩn (ví dụ 3 × U+2060) qua được `REQUIRED`;
  - ký tự đảo chiều (U+202E) đổi được cách tên hiện ra trước người duyệt.
- Vì sao quan trọng: người duyệt hoàn tiền (MGR/OWN) dựa vào tên chủ tài khoản để đối chiếu với khách. Tên rỗng thật hoặc hiển thị đảo làm mất giá trị của bước đối chiếu đó. Rủi ro thấp: số tài khoản vẫn kiểm chặt (6–19 chữ số, không nhận số thẻ), và ngân hàng thường hiện tên thật khi chuyển.
- Đề xuất sửa: thay bằng `stripControlChars` của `shared/validation.ts`, xóa hằng riêng. Thêm một unit/integration: `accountHolder` chỉ có ký tự ẩn → 422 `REQUIRED`; có U+202E → lưu bản đã bỏ.
- Trạng thái: Open

### 8.6 Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | SEC – delta #127 5c66ca15..ad507f94 (đã gộp 17cbcd6f): DUYỆT. FB-R5-SEC-BE-127-01 Done – một regex chung (Cc trừ tab/LF/CR, Cf, Default_Ignorable, surrogate lẻ) cho mọi ô chữ tự do, arrivalNote bỏ bản riêng, tập mới bao trọn tập cũ, bộ dò thẻ/giấy tờ không yếu đi; merge 15c9cb85 giữ cả overdue và 3 khóa B18 ở frontdesk/audit-entities.ts, các merge khác không tự sửa hunk. PR #143 @ d574b518 (chỉ test): DUYỆT, FB-R5-SEC-BE-113-01 Done (MUST_NOT_APPEAR; createGuestRequest bị từ chối không để dòng idempotency_key, gửi lại cùng khóa với chữ sạch → 201, 1 dòng sạch), gộp khi CI xanh. Thẻ mới FB-R5-SEC-BE-127-02 Minor: accountHolder hoàn tiền còn bộ lọc riêng C0+DEL – chuyển sang stripControlChars trong PR-B3 hoặc v1.0.6, không chặn tag. Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-a1-prs-127-113.md |`
