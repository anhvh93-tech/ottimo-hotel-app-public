# ARC review PR #127, #113, #114 (BE-A1) – V5-10 phần sau, V5-46 phía máy chủ, V5-11

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR đã review (cả ba đều DRAFT, cùng gốc gộp `da596507`; ORC đã merge `main` vào để gitleaks dùng allowlist mới):

  | PR | Nhánh | HEAD | Quy mô (so với `da596507`) | Việc |
  |---|---|---|---|---|
  | [#127](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/127) | `r5-text-strip` | **`5c66ca15`** | 7 tệp, +296/−47 | DOM PR106-01, SEC A1A-01, SEC A1B-01, ARC A1-01 (sau #106 `e74d8820`) |
  | [#113](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/113) | `r5-v5-46-server` | **`fc81e03d`** | 4 tệp, +393/−38 | V5-46 phía máy chủ (SEC V546-01 Major, ARC V546-01) |
  | [#114](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/114) | `r5-a2` | **`f730b691`** | 8 tệp, +587/−8 | V5-11 (PR-A2): Trả sớm và phí giữ lại 00:00–05:59 |

  Ba head không đổi trong lúc review (kiểm lại bằng `gh pr view` lúc viết tệp này).
- Đối chiếu:
  - hợp đồng 0.3.13: `contract-0.3.13.md` mục 1.1, 1.12, 1.19, 1.21 (V5-11), 1.27; danh sách 0.3.14 ở `ARC-on-be-pr-106-99-checkout.md` mục 4;
  - `openapi.yaml`: `checkOut` mục "Quy đổi giờ trả" và bổ sung 1 (dòng 4164–4198), `getCheckoutSummary` (3951–3960), `earlyDeparture` (3992–4012), `createGuestRequest` (9477–9516), `updateOnlineCheckin` (9286–9297), bảng mã `ID_NUMBER_DETECTED` (272);
  - review trước: ARC `ARC-on-be-pr-106-99-checkout.md` (mục 1.4, thẻ A1-01, mục 3.2), SEC `SEC-on-be-prs-106-99-checkout.md` (A1A-01, A1B-01, mục 5), DOM `DOM-on-be-prs-106-99-checkout.md` (PR106-01, mục 5), ARC `ARC-on-fe-prs-98-102-107.md` (thẻ BE-V546-01);
  - ERD `folio_line.service_date` (không đổi cột, không migration).
- Cách kiểm:
  - Đọc mã bằng `git show`/`git diff` trên ref riêng `refs/remotes/arc/pr*`. Không checkout nhánh nào trong thư mục chính.
  - Hai worktree tách riêng trong scratchpad (`arc-a1-wt`, `arc-a1-mut`), `pnpm install --offline`, PostgreSQL 17 riêng (container `arc-a1-review-pg`, chỉ `127.0.0.1`, mật khẩu CI công khai của repo). Xóa hết sau review.
  - Ba cây gộp, theo đúng thứ tự ORC giao (#127 → #113 → #114), xung đột gỡ như mục 0.2:

    | Cây | Kết quả |
    |---|---|
    | A: `main` @ `22a661c7` + #127 + #113 + #114 | `tsc --noEmit` sạch. 4 tệp của ba PR: 48/48 ca qua. Toàn bộ API (trừ `production-bootstrap`): 188 tệp qua, 2 tự bỏ qua, **1 ca hỏng không liên quan** (mục 6.1; chạy lại tệp đó 3/3 qua). 4780 ca qua |
    | B: cây A + #99 @ `92d16358` | `tsc` sạch. 9 tệp V5-10/11/15/46 (gồm `v105-overdue-checkout`, `v105-commission-anchor`, `checkout-due`, `vietqr-stay-step`): 97/97 qua. **Toàn bộ API: 192 tệp qua, 2 tự bỏ qua, 4822 ca qua, 0 hỏng** |
    | C: `main` @ `7e1b6aa1` (đã có #99 và #105) + #127 + #113 + #114 | `tsc` sạch. Toàn bộ API: kết quả ở mục 4 |
  - Thử đột biến: 15 đột biến nhỏ trên cây A, mỗi lần một chỗ, chạy lại tệp test của PR đó, rồi trả mã về. Bảng ở từng mục.
  - CI lúc commit: cả ba PR xanh `format · lint · audit · test · build`. #113 xanh cả job E2E (spec V5-46 chạy với máy chủ thật). #114 và #127 còn đang chạy E2E. #127 hỏng job `infra scripts (shellcheck)` ở bước `postgres-log-terse` (mục 6.2, không do #127). #127 và #114 đang báo CONFLICTING với `main` vì #99 và #105 đã gộp (mục 0.2).
- Không gọi staging hay production. Tệp này không có bí mật, IP máy chủ hay dữ liệu khách. Số trong probe là số giả.

## 0. Kết luận

| PR | Kết luận | Thẻ ARC | Điều kiện gộp |
|---|---|---|---|
| **#127** @ `5c66ca15` | **DUYỆT.** 0 Blocker, 0 Major | 127-01 (Minor) | Merge `main` (đã có #99) và gỡ xung đột `frontdesk/audit-entities.ts` như mục 0.2; CI xanh, chạy lại job `infra scripts` |
| **#113** @ `fc81e03d` | **DUYỆT.** 0 Blocker, 0 Major | 113-01 (Suggestion) | CI xanh, **gồm job E2E**: lần đầu spec `v5-46-guest-id-number.r5.spec.ts` chạy với máy chủ thật, không `page.route` |
| **#114** @ `f730b691` | **DUYỆT.** 0 Blocker, 0 Major | 114-01 (Minor), 114-02 (Suggestion) | Gộp sau #127 và #113. Merge `main`, gỡ xung đột `allowed-actions.ts` và tệp test như mục 0.2; CI xanh |

- ARC không approve hay merge trên GitHub; ORC gộp.
- Cả ba PR đúng luật PR: không sửa `openapi.yaml`, không sửa tệp sinh, không migration, không đổi mã lỗi đang có. Riêng #114 đổi kết quả của vài ca trong W từ 422 `DATE_INVALID` sang 409 `INVALID_TRANSITION`: đúng hợp đồng 0.3.13 bổ sung 1 (mục 3.1). Test chỉ dùng dữ liệu giả.
- Hai thẻ Minor (127-01, 114-01) là test cho hai câu ARC chốt ở mục 1.2 và 3.2. **Không chặn gộp.** ARC khuyên làm cùng commit merge `main` sắp tới, vì cả hai PR đều phải merge lại: mỗi thẻ khoảng 20–30 dòng test, không đổi mã.
- Hai thẻ của ARC đã xong, ARC kiểm lại mã: **FB-R5-ARC-BE-A1-01** (mục 1.4) và **FB-R5-ARC-BE-V546-01** (mục 2.2). BE-A1 ghi Done ở `responses/BE-responses.md`.

### 0.1 Không phá #99

- #99 đã gộp vào `main` trong lúc ARC review (`9373c03d`). Cây B (gộp #99 @ `92d16358` sau ba PR) và cây C (ba PR trên `main` mới) đều chạy đủ test V5-15.
- `overdueReason` của #99 đọc bằng `f.text('overdueReason', 500, { required: true, min: 3 })` (`checkout.service.ts` `readInput`), tức đúng `Fields.text` mà #127 sửa. Lời BE-A1 đúng: khi hai bên cùng trên `main`, lý do quá ngày đi được bỏ ký tự ẩn, không cần sửa gì thêm ở #99.
- Biên giờ nhận phòng (A1A-01) nằm trong `resolveCheckoutAt`, nên áp cả cho đường quá ngày đi. Đây đúng là điều kiện T15 (quyết định 29 của PO): tag có #99 thì phải có #127. Sau khi cả hai lên, `actual_checkout_at` và khai báo lúc đi không bao giờ sớm hơn giờ nhận phòng.
- `deposit_forfeit` ở B18 (#114) nay lấy `ctx.today`. Trên đường quá ngày đi của #99, dòng này mang ngày nghiệp vụ lúc ghi, không mang ngày đi. Đúng luật DOM 2.1 (5) "ngày nghiệp vụ lúc thao tác". DOM xác nhận ở review của DOM (BE-A1 đã hỏi).

### 0.2 Xung đột gộp và cách gỡ (ARC đã thử, CI phải xanh lại)

| Khi gộp | Tệp | Cách gỡ |
|---|---|---|
| #127 vào `main` có #99 | `frontdesk/audit-entities.ts`, cuối mảng `reservation` | Giữ **cả hai** khối: `overdue` (của #99) và `systemTime`, `extraNight`, `postMidnightWindow` (của #127). Thứ tự không ảnh hưởng (`defineAuditEntity` gộp hợp) |
| #114 vào `main` có #99 | `reservations/internal/allowed-actions.ts`, trước `earlyDepartureOpen` | Giữ `checkOutOverdueOpen` và chú thích của nó (của #99). Thay chú thích một dòng cũ của `earlyDepartureOpen` bằng chú thích mới của #114. Thân hàm của #114 không xung đột |
| #114 sau #127 | `test/be-a1-v105-units.test.ts`, cuối tệp | Giữ cả hai khối `describe` (A1B-01 của #127, V5-11 của #114). Phần import tự gộp |

- BE-A1 merge `main`, không rebase (luật của ORC). Commit merge chỉ gỡ đúng như bảng thì ARC không cần đọc lại.
- Commit có thêm test của thẻ 127-01 hoặc 114-01 thì ARC chỉ đọc phần test.

---

## 1. PR #127 – V5-10 phần sau (`r5-text-strip`)

### 1.1 Đúng hợp đồng và đúng cách ARC tả

- **PR106-01 (`checkout-at.ts` 91, `checkout.service.ts` 694):**
  - `CheckoutAtInput.typed` = `q.checkoutTime !== undefined`, đặt ở **một** chỗ (`CheckoutService.resolveCheckoutAt`). Mọi đường (tóm tắt, QR, `amountDueNow`, B18) qua chỗ đó.
  - Ứng viên (ngày đi − 1, `t`) chỉ dựng khi `typed`. Đường `sent` giữ nguyên.
  - Đúng ARC mục 1.4 và DOM PR106-01.
- **A1A-01:**
  - `notBeforeCheckIn` áp cho mọi `checkoutAt` gửi lên (dòng 86) và lọc mọi ứng viên của nhánh quy đổi (dòng 94).
  - Biên lấy `actual_checkin_at` của **đơn chính** (`row` là đơn chính ở cả bốn đường). Đúng nghĩa: lượt ở bắt đầu lúc nhận phòng của đơn chính. Đổi phòng hay gia hạn không đổi mốc này.
  - Đơn chưa có `actual_checkin_at` thì không có biên, như cũ. Đơn `in_house` luôn có giờ này.
- **A1B-01 (`inputs.ts` `Fields.text`):** đúng bản SEC đã thử (SEC mục 5):
  - thứ tự `stripControlChars` → `trim` → gộp khoảng trắng;
  - độ dài, độ dài tối thiểu và V-09 đều tính trên chữ đã bỏ ký tự ẩn;
  - chỉ còn ký tự ẩn thì xử như vắng.
  - Tab, xuống dòng vẫn là khoảng trắng: `CONTROL_CHARS` không gồm `\t \n \r`.
  - ARC đã đọc đủ 38 chỗ gọi `.text(` (frontdesk, reservations): lý do, ghi chú, `childName`, `reasonCode`, `posAuthCode`, `externalContractRef`. Không ô nào cần giữ ký tự điều khiển. Dò số thẻ chặt hơn (luật V-09 gốc nay cũng bắt số thẻ chèn U+200B), không lỏng hơn.
  - Không đổi mã lỗi: ca trước đây trả 500 (NUL vào jsonb `22P05`) nay trả 200 hoặc 422 bằng mã có sẵn.
- **ARC A1-01:** ba khóa mới thật sang `frontdesk/audit-entities.ts`, hai khóa trùng bỏ khỏi danh sách reservations, chú thích đúng. Hành vi không đổi: T10-1 vẫn đọc lại đủ khóa. **Thẻ đóng phía ARC.**

### 1.2 Câu hỏi của BE-A1: mã lỗi khi hết ứng viên – **ARC chốt `DATE_INVALID`**

| Ca | Phản hồi | ARC |
|---|---|---|
| `checkoutAt` gửi lên sớm hơn giờ nhận phòng (mọi nhánh: ngày đi, cửa sổ sau nửa đêm, tối hôm trước, quá ngày đi) | 422 `VALIDATION_FAILED`, `errors[{ field: checkoutAt, code: DATE_INVALID }]` | **Chốt.** Cùng mã, cùng `field` với "sai ngày" đã có. Desk V5-10 chỉ gửi lại `checkoutAt` của tóm tắt, nên ca này chỉ đến từ client gọi thẳng API |
| Không gửi `checkoutAt`, có gửi `checkoutTime`, mọi ứng viên đều sớm hơn giờ nhận phòng | 422, `errors[{ field: checkoutTime, code: DATE_INVALID }]` | **Chốt.** `field` chỉ đúng ô người dùng đã nhập. Không dùng `TIME_AFTER_ACTION`, vì giờ này không ở tương lai |
| Không gửi giờ nào (giờ hẹn hoặc giờ chuẩn), mọi ứng viên đều sớm hơn giờ nhận phòng | 422, `field = checkoutAt` | **Chốt.** Không có ô nào sai; `checkoutAt` là trường client cần gửi để gỡ. Thực tế không gặp, vì nhận phòng chỉ có ở ngày đến |
| Gõ 00:30 khi nhận phòng 01:00 cùng đêm (PU1) | Ứng viên 24/11 00:30 bị bỏ, còn 25/11 00:30 ở tương lai → B18 422 `TIME_AFTER_ACTION`, tóm tắt có `checkoutAtAfterNow` | **Chấp nhận.** Luật "bỏ ứng viên trước giờ nhận phòng, rồi chọn như cũ" cho kết quả xác định. Desk V5-10 hiện ngày 25/11 trên tóm tắt, lễ tân thấy ngay là sai |

- Không có mã mới, không đổi schema. ARC ghi vào 0.3.14 (mục 5, ý 1–2).
- Câu "Tóm tắt không trả 422 theo giờ gõ" (`getCheckoutSummary`, dòng 3959) thêm "trừ 422 `DATE_INVALID` của luật giờ nhận phòng". Câu này vốn để nói `TIME_AFTER_ACTION`/`TIME_NOTE_REQUIRED`.
- `amountDueNow` không đổi hành vi: `checkoutAt` lưu lúc tạo QR đã qua biên. Nếu có lỗi 4xx, `payments.service` vẫn trả số dư folio như cũ.

### 1.3 Test và đột biến

- Unit (`be-a1-v105-units`): PR106-01 (giờ hẹn, giờ chuẩn, gõ 01:00, gõ 17:00), PU1 (gửi 00:30/01:00/01:10, gõ 00:30, không có giờ nhận phòng), `Fields.text` (NUL, U+202E…U+202C, U+200B, BEL, tab, chỉ ký tự ẩn, độ dài tối thiểu, số thẻ nối U+200B).
- Integration (`v105-checkout-at`, Postgres thật): ba ca mới. Ca A1A-01 đếm lại `audit_event`, `payment` và trạng thái đơn sau ba lần 422. Ca A1B-01 đọc lại `audit_event.reason` và `reservation_change.reason` trong DB.

| Đột biến | Kết quả |
|---|---|
| M1: bỏ `i.typed` (dựng lại tối hôm trước từ giờ hẹn/giờ chuẩn) | Bắt: 2 ca hỏng (unit + integration PR106-01) |
| M2: bỏ `notBeforeCheckIn` ở nhánh `sent` | Bắt: 3 ca |
| M3: bỏ lọc ứng viên theo giờ nhận phòng | Bắt: 3 ca |
| M4: `field` luôn là `checkoutAt` | **Sống**: thẻ 127-01 |
| M5: bỏ `stripControlChars` trong `Fields.text` | Bắt: 3 ca |

### FB-R5-ARC-BE-127-01
- Mức độ: Minor
- Vị trí:
  - `product/services/api/src/modules/frontdesk/internal/checkout-at.ts` dòng 95 (`if (candidates.length === 0) return null;`) @ `5c66ca15`;
  - `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` dòng 698 (chọn `field` = `checkoutTime` hay `checkoutAt`);
  - `test/be-a1-v105-units.test.ts`, `test/integration/v105-checkout-at.test.ts`.
- Vấn đề:
  - Nhánh "không còn ứng viên nào sau khi lọc theo giờ nhận phòng" không có ca test nào chạy qua.
  - Đột biến M4 (luôn trả `field = checkoutAt`) vẫn để mọi test qua.
  - Đây chính là câu chữ BE-A1 hỏi và ARC vừa chốt ở mục 1.2 cho 0.3.14.
- Vì sao quan trọng: hợp đồng sẽ ghi `field` theo ô client đã gửi. Không có test thì lần sửa sau có thể đổi `field` mà CI không báo. Desk đọc `field` để tô đỏ đúng ô.
- Đề xuất sửa (chỉ test):
  - Unit: đi 24/11, `checkedInAt` = 24/11 13:00, giờ máy chủ 24/11 14:00. Gõ 12:00 (`typed: true`) → `null`. Không gõ, giờ chuẩn 12:00 (`typed: false`) → `null`.
  - Integration: dựng đơn bằng `setStayStatus(…, { actualCheckinAt })` sau giờ gõ của ngày đi.
    - B18 chỉ gửi `checkoutTime: '12:00'` → 422 `errors[{ field: checkoutTime, code: DATE_INVALID }]`;
    - tóm tắt không gửi giờ → 422 `field = checkoutAt`;
    - đếm lại `audit_event`, `payment`: không đổi.
  - Làm cùng commit merge `main` sắp tới, nếu kịp. Không chặn gộp.
- Trạng thái: Done – BE-A1 @ `ad507f94` (unit + integration), ARC kiểm ở mục 9

### 1.4 Ghi chú cho vai khác (không phải thẻ)

- **FE-A (#125, V5-10 Desk):** sau #127, tóm tắt lần đầu chưa gõ giờ trong cửa sổ sau nửa đêm trả giờ chuẩn của **ngày đi**, có `checkoutAtAfterNow = true`. Không lấy số này làm giờ điền sẵn (DOM mục 5). Desk v1.0.4 tạo QR cho ca "gõ 23:50 lúc 01:05" sẽ bị 422 tới khi #125 lên. DOM đã chấp nhận.
- **SEC (không thẻ, v1.0.6 nếu SEC muốn):** `shared/validation.ts` `CONTROL_CHARS` chưa gồm vài ký tự định dạng ẩn khác. Probe của ARC: U+061C (dấu chữ Ả Rập, ký tự định hướng), U+2060 (word joiner), U+00AD, U+180E, U+2061, U+FFF9 vẫn còn sau `stripControlChars`. Không ký tự nào trong số này đảo được thứ tự chữ như U+202E. Nới tập là việc của hàm dùng chung (`requireReason`, `optionalText`, `Fields.text`), không thuộc #127.

---

## 2. PR #113 – V5-46 phía máy chủ (`r5-v5-46-server`)

### 2.1 Đúng hợp đồng

- `createGuestRequest.note` (`guest-requests.service.ts` `note()`):
  - thứ tự: kiểu → `stripControlChars` + `trim` → bắt buộc/độ dài → `containsCardNumber` (mã cấp trên `CARD_NUMBER_DETECTED`, như cũ) → `looksLikeIdNumber` → 422 `VALIDATION_FAILED`, `errors[{ field: note, code: ID_NUMBER_DETECTED }]`;
  - đúng ví dụ `idInNote` của `openapi.yaml` (9516).
  - `note()` chạy trước câu đếm SR-RL-05, trước `INSERT guest_request` và trước khi chép sang việc HK hay phiếu MT. Bị chặn thì không ghi gì.
- `updateOnlineCheckin.arrivalNote` (`guest-portal.service.ts` `update`):
  - lỗi gom vào `errors`, rồi `throw` trước `UPDATE online_checkin` và `audit.record`, nên cả lệnh bị bỏ (giờ đến, bước);
  - `countWrite` tăng `write_count` trước đó nhưng nằm trong cùng giao dịch, nên rollback cùng (`withContext`).
- Chỉ hai ô khách gõ. Không áp cho `replyNote`, `registration` hay ô nhân viên. Đúng plan V5-46 và SEC V546-01.
- Chỉ gọi hàm có sẵn của `shared/sensitive-number.ts`. Không sửa bộ dò, không chép `sensitiveNumberKind` của website.
- Câu hỏi của BE-A1: ở `arrivalNote`, mã giấy tờ là mã trường dưới `VALIDATION_FAILED`, còn mã thẻ là mã cấp trên. **ARC xác nhận** giữ như vậy ở v1.0.5. Guest-web (#107) đọc được cả hai dạng. Câu chữ đã có trong danh sách 0.3.14 (thống nhất `CARD_NUMBER_DETECTED`), không đổi hành vi.

### 2.2 Ba ý của FB-R5-ARC-BE-V546-01: **đã làm đủ, ARC đóng thẻ phía ARC**

| Ý | Bằng chứng |
|---|---|
| (1) Nhánh thẻ không bị thu hẹp | `containsCardNumber` đứng trước ở cả hai ô. Ca hồi quy `Thẻ 4111 1111 11-11 1111` có `expect(looksLikeCard) = false` và `containsCardNumber = true`, nên ca luôn có nghĩa. Đột biến M9 (đổi sang `looksLikeCard`) bị bắt |
| (2) Không đổi dạng mã thẻ | Ca `CARD_AND_ID` và ca hồi quy kiểm `code: CARD_NUMBER_DETECTED` cấp trên ở cả hai ô |
| (3) Bộ đếm SR-RL-05 | `write_count`, `write_count_date` đọc lại sau 4 lần chặn giấy tờ và 2 lần chặn thẻ: không đổi |
| Chữ sạch vẫn qua | Số phòng (có "và"), chuyến bay, giờ, ngày, số tiền có đơn vị, SĐT `+84`, mã đặt chỗ: 201 ở `createGuestRequest`, 200 ở `arrivalNote`. Ca đối chứng: ghi chú sạch vẫn chép sang `hk_task.note` và `work_order.description` |
| E2E không `page.route` | Spec đọc 422 thật của máy chủ, kiểm thân lỗi không chứa số, đọc lại qua API khách là không lưu gì (bước vẫn `eta`, danh sách yêu cầu rỗng) |

- Test đếm lại 6 bảng (`guest_request`, `hk_task`, `work_order`, `audit_event`, `staff_notification`, `outbox_message`) và bắt log yêu cầu (pino mức `trace`) cùng stdout/stderr: số giả không có ở đâu.

| Đột biến | Kết quả |
|---|---|
| M6: bỏ kiểm giấy tờ ở `note()` | Bắt |
| M7: bỏ kiểm giấy tờ ở `arrivalNote` | Bắt |
| M8: kiểm giấy tờ trước thẻ ở `note()` | Bắt (ca thẻ cạnh số giấy tờ) |
| M9: `containsCardNumber` → `looksLikeCard` ở `note()` | Bắt (ca hồi quy) |

### FB-R5-ARC-BE-113-01
- Mức độ: Suggestion
- Vị trí:
  - `product/tests/e2e/ui/v5-46-guest-id-number.r5.spec.ts` dòng 163 (`after.body.etaTime ?? null`) và 204 (`(mine.body as { data?: unknown[] }).data ?? []`) @ `fc81e03d`;
  - `product/services/api/test/integration/v546-guest-id-number.test.ts` dòng 51 (`CLEAN_TEXTS`).
- Vấn đề:
  - Hai assert E2E vẫn qua nếu trường bị đổi tên hoặc thân phản hồi đổi dạng: `?? []` và `?? null` biến "không có trường" thành "rỗng". Hiện API trả `{ data: [...] }` (`guest-requests.controller.ts` 80), nên test đang đúng.
  - Bộ dò có hai ca chặn thừa đã biết, SEC chấp nhận từ PR #24 (G2): ba số phòng không có chữ xen giữa, và số 9 chữ số trần. Probe của ARC: `phòng 201 202 203` → giấy tờ; `Booking 123456789` → giấy tờ. `CLEAN_TEXTS` chỉ có `Phòng 202 và 203` (có "và"), nên test không ghi lại hai ca này cho cổng khách.
- Vì sao quan trọng:
  - Assert chặt thì lần đổi dạng thân phản hồi sẽ làm E2E hỏng đúng chỗ.
  - Khách ở nhiều căn có thể gõ "phòng 201 202 203 cần thêm khăn" và nhận câu "Không cần gửi giấy tờ". Ca này không lộ dữ liệu, chỉ gây khó hiểu. Ghi vào test thì DOM, CPY và QA biết hành vi này có chủ đích, và lần sửa bộ dò sau sẽ thấy ngay.
- Đề xuất sửa:
  - E2E: `expect(mine.body).toMatchObject({ data: [] })`; `expect(after.body).toHaveProperty('etaTime', null)` (hoặc đúng giá trị rỗng API trả).
  - Integration: thêm mảng `KNOWN_OVERBLOCK` (hai chuỗi trên) với `expect` 422 `ID_NUMBER_DETECTED`, kèm chú thích "chặn thừa đã chấp nhận, SEC PR24 G2".
  - CPY/UXD (không phải việc BE): câu `error.ID_NUMBER_DETECTED` trên trang khách có thể thêm gợi ý "viết số phòng cách nhau bằng dấu phẩy". Theo hướng thẻ SEC PR24-03 cho website.
  - Làm khi tiện, hoặc v1.0.6.
- Trạng thái: Done (phần BE) – PR #143 @ `d574b518`, ARC kiểm ở mục 10. Gợi ý chữ cho CPY/UXD để v1.0.6

---

## 3. PR #114 – V5-11 (`r5-a2`)

### 3.1 Đúng hợp đồng

- `earlyDeparture` (`stay.service.ts` 1426–1456):
  - W và "ngày lịch tối thiểu" lấy từ `shared/business-day.ts` (`dayClock`, `inEarlyHours`, `minCalendarDate`). Đây là một chỗ dùng chung với V5-10, đúng mục 1.21 "một hàm ngày lịch tối thiểu".
  - Trong W: ngày đi hiệu lực ≤ ngày lịch → 409 `INVALID_TRANSITION` + `currentState: in_house` + `useCheckout: true`. `newDepartureDate` < D+1 → 409 + `minNewDepartureDate` = D+1. Cả `dryRun`, không ghi gì.
  - Ngoài W: `minDeparture` = ngày nghiệp vụ, giữ 422 `DATE_INVALID` như cũ.
  - Hai trường mở rộng có ở bảng mã (`openapi.yaml` 224) và schema `Problem` (10750–10758). Không mã mới.
- `allowedActions.early_departure` (`allowed-actions.ts` 82): cửa sổ [max(ngày lịch tối thiểu, ngày đến + 1), ngày đi − 1]. Builder duy nhất (`reservations.service.ts` 443) truyền `calendarDate`, nên nút và máy chủ cùng luật.
- `serviceDate` của dòng phí giữ lại = ngày nghiệp vụ lúc thao tác, đủ bốn loại hợp đồng kể:
  - `cancellation_fee`, `no_show_fee`: qua `VoidStayInput.businessDate`, do `cancel` (3051) và `markNoShow` (4410) truyền `ctx.today`. Đường hủy đơn OTA (BR-310) cũng đi qua `cancel`, nên cũng được truyền;
  - `early_departure_fee` (gồm phần `ota_retained`): `ctx.today` thay ngày rời mới;
  - `deposit_forfeit` (B18): `ctx.today` thay ngày đi.
  - ARC đã rà mọi chỗ gọi `money.voided`: hai chỗ còn lại (4767, 4848) có `retainedVnd: 0`.
- Không đổi cột, không migration. ERD `folio_line.service_date` giữ nghĩa "ngày dịch vụ". DATA (để biết): phí giữ lại ghi lúc 00:00–05:59 nay vào doanh thu khác của ngày nghiệp vụ trước, đúng BR-010.

### 3.2 Ba câu BE-A1 hỏi ARC

| # | Câu hỏi | ARC |
|---|---|---|
| a | `useCheckout` khi ngày đi hiệu lực **≤** ngày lịch, không chỉ "=" | **Chốt "≤".** Trong W ở ngày nghiệp vụ D: ngày đi = D thì hôm nay vẫn là ngày Trả phòng (`isCheckoutDay`), khách đã ở qua đêm D, B18 tính đêm thêm. Ngày đi < D là đơn quá ngày đi, đi đường V5-15 (OWN/MGR). Cả hai ca không có ngày rời hợp lệ nào. Theo đúng chữ "=" thì máy chủ sẽ gợi ý `minNewDepartureDate` = D+1, tức sau ngày đi hiện tại: gợi ý sai. 0.3.14 sửa chữ (mục 5, ý 3). Test: thẻ 114-01 |
| b | Kiểm W đặt sau khuôn thân lệnh, sau 404, `If-Match`, `in_house`, đơn chính | **Chốt.** "Trước mọi kiểm ngày khác" nghĩa là trước mọi kiểm **giá trị** của `newDepartureDate`. 422 dạng thân lệnh (kể cả `noticeGivenAt` ở tương lai) vẫn trả trước. Đó là lỗi của ô khác, sửa xong thì gặp 409 gợi ý. Thứ tự này cùng mẫu V5-15 (khuôn → vai/trạng thái → luật ngày). 0.3.14 ghi rõ (mục 5, ý 3) |
| c | `deposit_forfeit` sau nửa đêm ghi ngày hôm trước | Luật nghiệp vụ: DOM quyết. Về kỹ thuật: đúng chữ hợp đồng (`openapi.yaml` 4011 kể `deposit_forfeit` trong danh sách), một dòng, test có ca 02:00 |

### 3.3 Test và đột biến

- Integration (`v105-early-hours`, oracle đọc từ `tests/fixtures/br-examples.json`): T-11-1…T-11-5, T-11-7, T-11-8, ca "đến 20/10 gửi 20/10 → 409 không 422", `deposit_forfeit` lúc 02:00.
  - T-11-2 kiểm lại đơn, đêm, folio, yêu cầu duyệt, audit sau cả `dryRun` lẫn lần ghi.
  - T-11-4 làm B18 thật sau 409 `useCheckout`, phụ thu 0.
- Unit: `allowedActions.early_departure` theo ngày lịch tối thiểu, cả biên ngày đến + 1.

| Đột biến | Kết quả |
|---|---|
| M10: `<=` → `===` ở `useCheckout` | **Sống**: thẻ 114-01 |
| M11: bỏ 409 `minNewDepartureDate` | Bắt: 3 ca |
| M12: `voidStay` về ngày lịch | Bắt: T-11-7, T-11-8 |
| M13: `deposit_forfeit` về ngày đi | Bắt |
| M14: `early_departure_fee` về ngày rời mới | Bắt: T-11-1 |
| M15: `allowedActions` bỏ ngày lịch tối thiểu | Bắt: 2 ca unit |

### FB-R5-ARC-BE-114-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/frontdesk/internal/stay.service.ts` dòng 1438 (`if (eff.departureDate <= clock.calendarDate)`) @ `f730b691`; `test/integration/v105-early-hours.test.ts`.
- Vấn đề:
  - ARC chốt "≤" ở mục 3.2 (a), nhưng chỉ có ca "=" (T-11-4, đi 21/10 lúc 03:00 ngày 21/10).
  - Đột biến M10 (`===`) để mọi test qua. Lúc đó lượt có ngày đi = D, gọi lúc 03:00 ngày D+1, nhận 409 `minNewDepartureDate` = D+1. Đó là gợi ý sai ARC vừa nêu.
- Vì sao quan trọng: hành vi này sắp vào chữ hợp đồng 0.3.14. Desk V5-11 (FE-A) dựa vào `useCheckout` để chuyển sang hộp Trả phòng thay vì báo "chọn ngày từ D+1".
- Đề xuất sửa (chỉ test, khoảng 25 dòng, theo mẫu T-11-4):
  - Đơn 19–20/10 còn `in_house`, đồng hồ 03:00 ngày 21/10 (ngày nghiệp vụ 20/10 = ngày đi).
  - B16 `dryRun` và lần ghi → 409 `useCheckout: true`, không có `minNewDepartureDate`; đơn, folio, audit không đổi.
  - Có thể thêm ca quá ngày đi (đi 19/10, 03:00 ngày 21/10) cùng kết quả.
  - Làm cùng commit merge `main` (#114 phải merge lại sau #127). Không chặn gộp.
- Trạng thái: Open

### FB-R5-ARC-BE-114-02
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/reservations/public/folio-sync-port.ts` dòng 36 (`businessDate?: LocalDate`); `folio/public/folio.service.ts` dòng 1710 (`throw new Error('voidStay: retainedVnd > 0 without businessDate')`) @ `f730b691`.
- Vấn đề:
  - `businessDate` là trường tùy chọn, chỉ được kiểm lúc chạy, và chỉ khi có tiền giữ lại.
  - Hiện cả hai chỗ gọi có tiền giữ lại đều truyền. Nhưng chỗ gọi mới quên truyền thì `tsc` không báo. Lỗi chỉ hiện khi có đơn hủy thật có phí giữ lại: 500, cả lệnh hủy rollback.
- Vì sao quan trọng: không sai tiền (lỗi an toàn), nhưng lễ tân không hủy được đơn. Lỗi chỉ thấy ở production, với đúng loại đơn có cọc.
- Đề xuất sửa:
  - Đổi thành `businessDate: LocalDate` (bắt buộc). Bốn chỗ gọi `money.voided` (3041, 4400, 4767, 4848) đều truyền `ctx.today`.
  - Giữ dòng `throw` làm lưới cuối, hoặc bỏ.
  - Không đổi hành vi, không cần test mới. Làm khi tiện, hoặc v1.0.6. BE-B là người giữ `folio.service.ts`, chỉ cần biết.
- Trạng thái: Open

---

## 4. Cây C – ba PR trên `main` mới @ `7e1b6aa1` (đã có #99 và #105)

- Dựng đúng thứ tự gộp sẽ xảy ra: `main` @ `7e1b6aa1` → #127 (gỡ `audit-entities.ts`) → #113 (sạch) → #114 (gỡ `allowed-actions.ts` và tệp test). Gỡ đúng như bảng 0.2.
- `tsc --noEmit` sạch.
- Toàn bộ API (trừ `production-bootstrap`): **194 tệp qua, 2 tự bỏ qua, 4835 ca qua, 0 hỏng.**
- Chạy riêng 9 tệp V5-10/11/15/46/48 trên cây này: 102/102 qua. Gồm các tệp của #99 (`v105-overdue-checkout`, `v105-overdue-checkout-units`, `v105-commission-anchor`) và của #105 (`v5-48-units`, `v5-48-closed-booking-money`); cả hai PR đã ở trên `main`.
- Vậy ba PR không phá #99 hay #105 trên `main` hiện tại. `money.voided` của #114 và nhánh hủy QR `pending` của V5-48 cùng chạy trong giao dịch hủy mà không xung đột.

---

## 5. Danh sách ARC đưa vào hợp đồng 0.3.14 (chỉ chữ, không đổi schema)

Bổ sung và làm rõ danh sách ở `ARC-on-be-pr-106-99-checkout.md` mục 4. Ý 1, 2 thay hai ý cùng số ở đó.

1. **Quy đổi giờ trả – tối hôm trước (DOM PR106-01):** ứng viên (ngày đi − 1, `t`) chỉ dựng khi `checkoutTime` được gửi. Giờ hẹn và giờ chuẩn luôn là giờ của ngày đi.
2. **Biên giờ nhận phòng (SEC A1A-01), một luật cho tóm tắt, QR `check_out`, `amountDueNow` và B18, cả đường quá ngày đi:**
   - `checkoutAt` gửi lên sớm hơn `actual_checkin_at` của đơn chính → 422 `DATE_INVALID`, `field` = `checkoutAt`, ở mọi nhánh.
   - Không gửi `checkoutAt`: bỏ mọi ứng viên sớm hơn giờ nhận phòng rồi chọn như cũ. Không còn ứng viên → 422 `DATE_INVALID`, `field` = `checkoutTime` nếu có gửi `checkoutTime`, ngược lại `field` = `checkoutAt`.
   - `getCheckoutSummary`: câu "không trả 422 theo giờ gõ" thêm "trừ `DATE_INVALID` của biên giờ nhận phòng".
3. **`earlyDeparture` trong W (V5-11):**
   - (1) đọc là "ngày đi hiệu lực của lượt **≤** D+1 (ngày lịch)" → `useCheckout`, thay "= D+1";
   - thứ tự: sau khuôn thân lệnh (422 dạng của mọi trường), 404, 412 `If-Match` (lần ghi), 409 trạng thái/đơn chính; trước mọi kiểm giá trị của `newDepartureDate`.
4. **Chữ tự do D12c (SEC A1B-01):** mọi ô chữ tự do của frontdesk và reservations bỏ ký tự điều khiển và ký tự định dạng ẩn trước khi kiểm độ dài và V-09. Chỉ còn ký tự ẩn thì xử như vắng (`REQUIRED`/`REASON_REQUIRED` nếu bắt buộc). Ghi một câu ở mô tả chung V-09, không lặp ở từng lệnh.
5. Giữ nguyên: dạng mã `ID_NUMBER_DETECTED` (mã trường) / `CARD_NUMBER_DETECTED` (mã cấp trên) ở cổng khách – mục "thống nhất câu chữ `CARD_NUMBER_DETECTED`" đã có trong danh sách.

---

## 6. Ghi chú ngoài phạm vi ba PR

### 6.1 Test chập chờn của V5-25 (#96, BE-C)

### FB-R5-ARC-BE-96-01
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/v5-25-early-departure-broken.test.ts` dòng 170 (trên `main`): `expect(res.body).not.toMatch(/150|minNoticeDays|refundPct/)`.
- Vấn đề:
  - Regex chạy trên **toàn bộ** thân phản hồi, gồm cả `requestId` ngẫu nhiên.
  - Ở cây A, ca này hỏng một lần vì `requestId` = `1503222a-…` chứa "150". Chạy lại tệp đó thì 3/3 qua.
  - Xác suất một UUID chứa chuỗi "150" vào khoảng 0,7 %, nên CI sẽ đỏ ngẫu nhiên khoảng 1 lần trên 140 lần chạy.
- Vì sao quan trọng: CI đỏ không do mã làm mọi PR phải chạy lại. Lần sau có thể có người nới hoặc bỏ assert để qua, trong khi assert này giữ luật "không lộ giá trị tham số" (SEC V525-01).
- Đề xuất sửa: bỏ `requestId` trước khi so (`const { requestId, ...rest } = res.json(); expect(JSON.stringify(rest)).not.toMatch(…)`), hoặc dùng `/\b150\b/` cho phần số. ORC chuyển BE-C.
- Trạng thái: Open

### 6.2 Job `infra scripts (shellcheck)` của #127

- Run `42275992250`, bước `postgres-log-terse.test.sh` (OPS): 11 qua, 2 hỏng, đều ở lần chạy đối chứng "the default run did not show the values".
- #127 không đổi tệp nào dưới `infra/`. Cùng job ở #113 và #114 (cùng `main` được merge vào) đều xanh.
- ARC đánh giá đây là lần chạy chập chờn của test hạ tầng (lần đối chứng phụ thuộc thời gian log của container). ORC chạy lại job. Hỏng lần nữa thì chuyển OPS.

---

## 7. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-07 | 5 | ARC – review kỹ thuật PR #127, #113, #114 (BE-A1): #127 @ 5c66ca15 DUYỆT (PR106-01 cờ typed, A1A-01 biên giờ nhận phòng ở mọi nhánh, A1B-01 Fields.text bỏ ký tự điều khiển cho 38 chỗ gọi, ARC A1-01 đóng; ARC chốt 422 DATE_INVALID field checkoutTime khi gõ giờ mà hết ứng viên, field checkoutAt khi không gửi giờ; 127-01 Minor test cho nhánh này); #113 @ fc81e03d DUYỆT (thẻ trước rồi giấy tờ, không ghi gì, write_count giữ, ARC V546-01 đóng; gộp khi E2E máy chủ thật xanh; 113-01 Suggestion); #114 @ f730b691 DUYỆT (W dùng minCalendarDate chung, 409 useCheckout khi ngày đi hiệu lực ≤ ngày lịch – ARC chốt ≤, minNewDepartureDate, phí giữ lại theo ngày nghiệp vụ; 114-01 Minor test cho ≤, 114-02 Suggestion businessDate bắt buộc). Không phá #99: overdueReason dùng Fields.text, cây main + ba PR + #99 chạy đủ bộ API xanh (4822 ca). Xung đột khi gộp sau #99: audit-entities.ts (#127), allowed-actions.ts (#114), tệp test (#114 sau #127) – giữ cả hai phía. Năm ý chữ vào 0.3.14. FB-R5-ARC-BE-96-01 (BE-C): test V5-25 chập chờn vì regex chạy trên requestId; quyền ARC (kiến trúc, hợp đồng, chuẩn test), luật deposit_forfeit theo DOM | ARC | rounds/round-05/reviews/ARC-on-be-a1-prs-127-113-114.md |`

## 8. Điểm làm tốt

- Mỗi luật một chỗ: biên giờ nhận phòng và cờ `typed` nằm trong `resolveCheckoutAt`; W và ngày lịch tối thiểu nằm trong `shared/business-day.ts`. Bên gọi chỉ truyền dữ liệu. Đường quá ngày đi của #99 tự hưởng biên mới, không phải sửa gì.
- Test đọc lại DB và log, không chỉ đọc phản hồi: đếm 6 bảng và `write_count` sau mỗi lần chặn, bắt log pino mức `trace`, đọc `audit_event.reason` sau khi bỏ ký tự ẩn, đọc oracle BR từ `br-examples.json`. 13/15 đột biến bị bắt.
- `Fields.text` sửa một lần cho 38 chỗ gọi, đúng bản SEC đã thử. Ca hồi quy thẻ ở #113 tự kiểm điều kiện của nó (`looksLikeCard = false`), nên ca không mất nghĩa khi bộ dò đổi.

---

## 9. Delta #127 @ `ad507f94` (đọc sau khi đã gộp)

- Lời giao: ORC, sau lượt review ở trên. #127 @ `ad507f94` đã vào `main` qua merge `17cbcd6f` (03:20:49). Merge này ngoài ý muốn: một lệnh `git pull` trong thư mục chung gặp `FETCH_HEAD` có `refs/pull/127/head`. Vì vậy đây là review sau gộp; lỗi nếu có sẽ đi bằng PR sửa tiếp.
- **Kết luận: DUYỆT @ `ad507f94`.** 0 Blocker, 0 Major, không thẻ mới. Không cần PR sửa tiếp.
- Delta so với `5c66ca15` (ARC đã duyệt), theo first-parent:

  | Commit | Nội dung | Kiểm |
  |---|---|---|
  | `15c9cb85` | merge `main` @ `be756770` (có #99) | `git show --remerge-diff`: chỉ `frontdesk/audit-entities.ts` xung đột, gỡ đúng mục 0.2 – giữ 3 khóa B18 (`systemTime`, `extraNight`, `postMidnightWindow`) và `overdue`; chú thích thêm "next to `overdue`" |
  | `56b1ae66` | ca `overdueReason` chỉ có ký tự ẩn, hoặc dưới 3 ký tự sau khi bỏ → 422 `REASON_REQUIRED` | test |
  | `3075a6b1` | merge `main` | remerge-diff rỗng (không sửa tay) |
  | `6a670f3a` | SEC 127-01: một bộ lọc ký tự ẩn cho mọi chữ tự do, kể cả `arrivalNote` | mục 9.1 |
  | `ad6b40ab` | merge `main` @ `74189d2c` (có #105, #113) | remerge-diff rỗng |
  | `ad507f94` | test cho ARC 127-01 | mục 9.2 |

### 9.1 Bộ lọc ký tự ẩn (SEC 127-01)

- `shared/validation.ts`: `CONTROL_CHARS = /[^\P{Cc}\t\n\r]|[\p{Cf}\p{Default_Ignorable_Code_Point}\p{Cs}]/gu`.
  - Bỏ: mọi Cc trừ tab, LF, CR; mọi Cf; mọi Default_Ignorable; surrogate lẻ.
  - Có cờ `u`, nên cặp surrogate hợp lệ (emoji) là một code point, không khớp `\p{Cs}`. Chỉ surrogate lẻ bị bỏ.
  - Dấu thanh tiếng Việt dạng NFD (Mn) giữ nguyên.
- Sáu ký tự ARC ghi ở mục 1.4 (U+061C, U+2060, U+00AD, U+180E, U+2061, U+FFF9) nay đều bị bỏ. Ghi chú đó đóng.
- Chấp nhận, không thẻ:
  - ZWJ U+200D là Cf, nên chuỗi emoji ghép (gia đình…) tách thành từng emoji;
  - ZWNJ U+200C bị bỏ (dùng cho tiếng Ba Tư, Hindi; không thuộc 5 ngôn ngữ OTTIMO);
  - VS16 bị bỏ, ký hiệu giữ nguyên.
- `guest-portal.service.ts`: bỏ bản `stripControl` riêng (chỉ C0 + DEL); `arrivalNote` dùng chung `stripControlChars`. Đúng hướng "mỗi luật một chỗ".
- Tác động rộng: `stripControlChars` còn được gọi ở housekeeping, work order, refund, guest request, items, folio line. Mọi chỗ đó nay dùng bộ lọc rộng hơn; toàn bộ API vẫn xanh (dưới đây).
- Surrogate lẻ trước đây làm 500 (22P02 khi ghi jsonb audit). Nay hết ở mọi đường qua `Fields.text`/`stripControlChars`. Đường chữ tự do nào không qua hàm này vẫn có thể 500; SEC 127-02 (bộ lọc `accountHolder` của refund) là một ca như thế, SEC đang theo.

### 9.2 Test cho FB-R5-ARC-BE-127-01

Đúng đề xuất của thẻ, và đủ các ý ORC nêu:
- Unit: đi 24/11, nhận phòng 13:00 ngày 24/11, giờ máy chủ 14:00 → gõ 12:00 (`typed: true`) và không gõ (`typed: false`) đều `null`; ca đối chứng 13:30 vẫn ra giờ.
- Integration `v105-checkout-at.test.ts`: đơn 30/11 → 01/12, `setStayStatus(… actualCheckinAt 01/12 13:00)`, đồng hồ 01/12 14:00:
  - B18 chỉ gửi `checkoutTime: '12:00'` → 422 `[{ field: checkoutTime, code: DATE_INVALID }]`;
  - tóm tắt `?checkoutTime=12:00` → `checkoutTime`;
  - tóm tắt không giờ, và QR `check_out` không giờ → `checkoutAt`;
  - B18 gửi `checkoutAt` 12:30 (trước giờ nhận phòng) → `checkoutAt`;
  - đếm `audit_event`, `payment` và trạng thái đơn trước/sau: không đổi;
  - đối chứng: tóm tắt `checkoutTime=13:45` qua.

Đột biến (worktree tạm, PostgreSQL 17 riêng; mỗi lần một chỗ, chạy 5 tệp: units, `v105-checkout-at`, `v105-overdue-checkout`, `v546-guest-id-number`, `guest-portal`):

| # | Đột biến | Kết quả |
|---|---|---|
| F1 | `field` luôn `checkoutAt` (M4 cũ của thẻ 127-01) | Đỏ (ca ARC 127-01) – đúng như BE-A1 nói |
| F2 | `field` bỏ qua `checkoutAt` đã gửi | Đỏ (2 ca, gồm PU1 của SEC A1A-01) |
| F3 | Nhánh "không còn ứng viên" trả ứng viên đầu thay vì `null` | Đỏ (unit + integration) |
| S1 | Trả về regex cũ | Đỏ (3 ca) |
| S2 | Bỏ `\p{Cs}` | Đỏ (2 ca, gồm T15-5 ghi lý do có surrogate lẻ) |
| S3 | `arrivalNote` không qua `stripControlChars` | Đỏ (`guest-portal`) |

Chạy trên `ad507f94`: `tsc --noEmit` sạch; 6 tệp liên quan 82/82; **toàn bộ API (trừ `production-bootstrap`): 193 tệp qua, 2 tự bỏ qua, 4828 ca qua, 0 hỏng.**

## 10. PR #143 `r5-v5-46-tests` @ `d574b518` (BE-A1, chỉ test) – cho FB-R5-ARC-BE-113-01

- **Kết luận: DUYỆT @ `d574b518`.** 0 Blocker, 0 Major, không thẻ mới. Điều kiện gộp: CI xanh, **gồm job E2E** (spec `v5-46-guest-id-number.r5.spec.ts` chạy với máy chủ thật; ARC không chạy Playwright tại máy).
- 2 tệp, +64/−7, không chạm mã sản phẩm.

| Ý của thẻ 113-01 | #143 | Kiểm |
|---|---|---|
| E2E `?? null` | `expect(after.body).not.toHaveProperty('etaTime')` | Đúng hơn đề xuất của ARC: máy chủ bỏ hẳn trường khi chưa có giờ đến (`guest-portal.service.ts` 460: `...(row?.eta_time ? { etaTime } : {})`), và hợp đồng khai `etaTime` là `LocalTime`, không nullable |
| E2E `?? []` | `expect(mine.body).toMatchObject({ data: [] })` | `toMatchObject` so mảng đúng độ dài, nên ghim được cả dạng thân lẫn danh sách rỗng |
| Ghim chặn thừa đã biết | `KNOWN_OVERBLOCK` = "phòng 201 202 203 cần thêm khăn", "Booking 123456789" → 422 `ID_NUMBER_DETECTED` ở **cả** `note` (`createGuestRequest`) và `arrivalNote` (online check-in) | `refusedAsId` so đúng `errors[{ field, code }]` và không có số nào trong thân phản hồi. Chú thích ghi rõ "SEC PR24 G2, chặn thừa đã chấp nhận" |
| (SEC 113-01, cùng PR) | lệnh bị từ chối không để lại dòng `idempotency_key`; cùng khóa với chữ sạch → 201, đúng 1 dòng; `request_hash`/`response_body` không chứa số mẫu | Đúng SR về idempotency: lệnh bị từ chối ở khâu đọc thân không tiêu khóa |
| Gợi ý chữ cho khách (dấu phẩy giữa số phòng) | không có | Việc của CPY/UXD, v1.0.6 – không thuộc PR này |

Đột biến trên bộ dò (`shared/sensitive-number.ts` `idIn`), chạy tệp integration của #143 và bản trên `main` để so:

| # | Đột biến | #143 | Bản trên `main` |
|---|---|---|---|
| K1 | Bỏ luật 9 chữ số | Đỏ (ca ARC 113-01) | Xanh |
| K2 | Ba nhóm 3 chữ số không còn là giấy tờ | Đỏ (ca ARC 113-01) | Xanh |

→ Đổi bộ dò ở hai ca này giờ hiện ra trong CI. Trước #143 thì không.

Chạy: `v546-guest-id-number.test.ts` 8/8 trên `d574b518`, PostgreSQL 17 mới.

## 11. Dòng decision-log đề xuất cho mục 9–10 (ORC ghi khi commit)

`| 2026-11-07 | 5 | ARC – #127 delta @ ad507f94 (đọc sau gộp, merge 17cbcd6f ngoài ý muốn) DUYỆT, không cần PR sửa tiếp: remerge-diff 15c9cb85 chỉ audit-entities.ts, giữ 3 khóa B18 và overdue; 3075a6b1, ad6b40ab không sửa tay; bộ lọc ký tự ẩn chung (Cc trừ tab/LF/CR, Cf, Default_Ignorable, surrogate lẻ) cho mọi chữ tự do kể cả arrivalNote; test 127-01 đủ (gõ giờ → checkoutTime; không giờ, QR, checkoutAt gửi lên → checkoutAt; không ghi gì), F1/F2/F3/S1–S3 đều đỏ; toàn bộ API 4828 ca qua. ARC 127-01 Done. PR #143 @ d574b518 (chỉ test) DUYỆT: not.toHaveProperty('etaTime') đúng máy chủ và hợp đồng, toMatchObject({ data: [] }), KNOWN_OVERBLOCK ghim ở note và arrivalNote (K1/K2 đỏ trên #143, xanh trên main), lệnh bị từ chối không tiêu Idempotency-Key; điều kiện gộp CI xanh gồm E2E. ARC 113-01 Done phần BE, gợi ý chữ cho CPY/UXD để v1.0.6 | ARC | rounds/round-05/reviews/ARC-on-be-a1-prs-127-113-114.md |`
