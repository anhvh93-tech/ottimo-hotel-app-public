# SEC – Review phần chênh PR #99 (BE-A2, PR-A1b, V5-15) từ `ba99bdb8` tới `92d16358`

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:

| PR | Nhánh | Bản SEC đã review | HEAD lúc đọc | CI lúc đọc |
|---|---|---|---|---|
| #99 | `r5-a1b` | `ba99bdb8` (`SEC-on-be-prs-106-99-checkout.md`, DUYỆT để gộp sau #106) | **`92d16358`**, hết DRAFT | Lượt `92d16358` đang chạy; lượt `6abefc9f` bị hủy (bị lượt mới thay) |

Phần chênh của chính PR gồm 2 commit, không tính các lần gộp `main`:
- `6d8456a5` (PR99-01): `folio.service.ts` `tryEarnCommissions`, test mới `v105-commission-anchor.test.ts`;
- `9bbd15e9` (PR99-02, ARC A2-01, A2-02):
  - `checkout.service.ts`: `departedAt` và `Retry-After`;
  - `fridge.ts` `countInWindow`, `minibar.service.ts` `countWindow`;
  - `stay-departure.ts` (dời từ `reservations.service.ts`), `StayInfo.stayDepartureDate`;
  - test.

Có 4 merge `main` vào nhánh. Ba merge không có hunk tự sửa (`git show --cc` rỗng). Merge `63492b7d` chỉ ghép tay `audit-log.controller.ts`: hai bộ lọc `overdueOnly` (#99) và `action`/`removalsOnly`/`reductionsOnly` (#108) nằm cạnh nhau, đều dùng tham số `ph()`, không nối chuỗi. Phạm vi "FD/FDL chỉ thấy dòng của mình" giữ nguyên.

Cách kiểm:
- Đọc diff hai commit trên và hunk ghép của `63492b7d` bằng `git show`. Không checkout nhánh vào bản làm việc chung, không chạy test, không gọi staging hay production.
- Đúng như BE-A2 nói, phần chênh **không** đụng `use-case-denial.ts`, `overdue-checkout.ts`, `createVietQr`, `overdueGate`, `readInput`. `checkout.service.ts` chỉ đổi 2 hunk (dòng ~1225 và ~1469).
- `openapi.yaml` của nhánh: `checkOut` không có `x-write-roles`, nên cổng chung của #103 không chặn trước cổng vai/trần riêng của #99. Thứ tự ở `SEC-on-be-prs-106-99-checkout.md` 2.1 giữ nguyên.

Tệp này không có bí mật, mật khẩu, mã đơn hay dữ liệu khách.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #99 | `92d16358` | **DUYỆT** | CI xanh trên đúng SHA. #99 và #127 (`r5-text-strip`) cùng sửa `resolveCheckoutAt`: #127 thêm trường `typed` vào `CheckoutAtInput`. PR gộp sau phải gộp `main` trước và qua typecheck. **Tag v1.0.5 có #99 thì phải có #127** (mục 2) |

0 Blocker · 0 Major · 0 Minor · 1 Suggestion (99D-01). ESC mới: **không**. Thẻ cũ: A1B-01 (Minor) do #127 làm; A1B-02, A1B-03 (Suggestion) vẫn Open, không đổi.

---

## 1. PR99-01: mốc hoa hồng `folio.settled_at`: đạt, và chặt hơn trước

- Trước: một khoản thu `pending`/`disputed` giữ hoa hồng nếu `p.created_at > reservation.actual_checkout_at`. Sau 0.3.13, `actual_checkout_at` là giờ quầy **khai** (`checkoutAt`). Nên khoản `finalPayment` của B18, hay VietQR thu tại quầy, bị đọc là "tiền sau khi trả phòng".
- Nay: so với `folio.settled_at`. Giá trị này chỉ `settle()` ghi, một lần, bằng `this.clock.now()` của máy chủ, trong giao dịch B18. Không đường nào ghi lại cột này.
- Về bảo mật, thay đổi này tốt hơn. Trước đây mốc hoa hồng đi theo giờ do client gửi lên (trong biên ngày đi và dung sai). Lễ tân chỉnh `checkoutAt` là đổi được một khoản thu thành "trước" hay "sau" khi trả phòng, tức đổi lúc hoa hồng của sale/CTV được tính. Nay mốc là giờ máy chủ, client không chạm tới.
- Câu SQL vẫn dùng tham số, chỉ đổi `JOIN reservation` thành `JOIN folio` theo `p.folio_id`. Không thêm cột nào vào kết quả.
- Có 5 test: DOM ca 1; `finalPayment` chuyển khoản lúc B18; đơn quá ngày đi; ARC 3.1 ca 2 (nợ thu sau B18 chờ đối soát); ca 4 (khoản sale tự ghi còn `pending` vẫn giữ, BR-527).
- Luật nghiệp vụ (khoản nào giữ, khoản nào không) là việc của DOM, ARC. SEC không xét lại.

## 2. PR99-02: `actual_checkout_at` = giờ khai ở mọi B18: đạt về bảo mật, kèm một điều kiện của tag

Thay đổi: `departedAt = d.checkout.at` cho mọi B18. Trước đây chỉ khi gửi `checkoutAt`; nay cả khi chỉ gõ `checkoutTime` (giờ quy đổi). Giá trị này ghi vào `reservation.actual_checkout_at`, `registration` (`stay_ended_at`, khai báo lúc đi BR-604) và lần ở gần nhất của hồ sơ khách.

Những gì giữ `ctx.now` (giờ máy chủ):
- audit (`occurred_at`), các chuyển trạng thái;
- `post_checkout_window_until`, `debt_opened_at`;
- `folio.settled_at` (mốc hoa hồng ở mục 1).

Nhờ vậy:
- **Không mốc tiền nào đi theo giờ khai.** Cửa sổ phát sinh sau trả phòng, ngày mở nợ và mốc hoa hồng đều không lùi được bằng cách khai giờ sớm.
- **Dấu vết đủ:** audit B18 có cả `after.checkoutAt` (giờ khai) lẫn `occurred_at` (lúc bấm). Khai sớm hơn dung sai thì phải có `checkoutTimeNote`, đi qua bộ đọc chữ D12c và vào audit. Đường quá ngày đi thì cần `overdueReason`.
- **Biên của giờ khai giữ nguyên** (`resolveCheckoutAt` của #106): trong ngày đi, cửa sổ sau nửa đêm, hoặc tối hôm trước khi đồng hồ máy chủ đang trong cửa sổ đó; không sau giờ máy chủ cộng dung sai.

Điều kiện của tag:
- Trước #99, chỉ `checkoutAt` gửi lên mới thành giờ rời thật. Nay giờ quy đổi từ `checkoutTime` cũng vậy. Ca của thẻ A1A-01 (giờ rời sớm hơn giờ nhận phòng thật, ghi vào khai báo lưu trú) nay mở cho cả nhánh quy đổi.
- #127 (`r5-text-strip` @ `cfa10ab8`, BE-A1) đã sửa ở `resolveCheckoutAt`:
  - `notBeforeCheckIn` áp cho mọi `checkoutAt` gửi lên;
  - ứng viên quy đổi sớm hơn giờ nhận phòng bị bỏ; không còn ứng viên nào thì 422 `DATE_INVALID`;
  - đúng hai ý của A1A-01.
- Vì vậy SEC đề nghị: **tag v1.0.5 có #99 thì có cả #127.** Thẻ A1B-01 (Minor, ký tự điều khiển trong `Fields.text`) cũng nằm ở #127 và đã có hạn "trước tag v1.0.5".
- SEC sẽ review #127 riêng khi ORC giao. Tệp này không duyệt #127.
- Test `PR99-02` (chỉ `checkoutTime`, sớm 40 phút, có ghi chú) kiểm `actual_checkout_at` và `registration` bằng giờ đã gõ.

## 3. ARC A2-02: `Retry-After: 1` trên `CONCURRENT_UPDATE` ở lượt đọc lại: đạt

- Lỗi ném trong giao dịch của `UnitOfWork`, nên giao dịch rollback và chỗ giữ `Idempotency-Key` rollback theo. Lượt gửi lại cùng khóa chạy lại từ đầu trên trạng thái mới (ví dụ 422 `NOT_ALLOWED` trên `overdueReason` khi đơn đã được gia hạn). Lượt đó không phát lại 409.
- Header cùng giá trị với `concurrencyProblem` (`shared/problem.ts`: 55P03, 40P01, 40001 → 409 + `Retry-After: 1`). Bộ lọc lỗi chép `options.headers` vào phản hồi như mọi 409 khác. Thân lỗi không có gì mới.
- Gửi lại sau 1 giây vẫn chịu giới hạn chung SR-RL-09. Không mở đường dò hay vượt chặn nào.
- Chưa test nào kiểm header này (thẻ 99D-01).

## 4. ARC A2-01: một luật cửa sổ đếm tủ lạnh: đạt

- `countInWindow` (`fridge.ts`) nay là luật duy nhất cho cả chặn B18 / `minibarUncheckedRooms` lẫn `MinibarStandard.latestCheck`. Đơn quá ngày đi tính lượt đếm từ ngày đi **thực tế** (`stayDepartureDate`, gồm đơn con gia hạn, BR-422). Đơn con đọc theo đơn chính.
- Phạm vi đọc không đổi: ai đọc được đơn nào vẫn như cũ. `stayInfo` của đơn chính chỉ dùng lấy ngày.
- Thiếu `business_date` thì coi là ngoài cửa sổ, tức "cần đếm lại", là hướng an toàn.
- Liên quan V516-01 (Major, đếm lại tủ đã bù hàng làm giảm dòng minibar không qua BR-438). Trước đây Desk báo "cần đếm lại" một tủ đã đếm, nên số lượt đếm lại thừa nhiều hơn. Hai cửa sổ nay khớp nhau, nên lối của V516-01 ít bị mở hơn. V516-01 vẫn Open ở BE-A2, không đổi.
- `stayDepartureDateOf` dời nguyên văn từ `reservations.service.ts` sang `public/stay-departure.ts`: cùng câu SQL có tham số, cùng điều kiện trạng thái.

---

## 5. Thẻ

#### FB-R5-SEC-BE-99D-01
- Mức độ: Suggestion
- Người nhận: BE-A2 (cùng PR nếu còn sửa, không thì PR sau)
- Vị trí: `product/services/api/test/integration/v105-overdue-checkout.test.ts`
- Vấn đề: không test nào kiểm `Retry-After: 1` ở 409 `CONCURRENT_UPDATE` của lượt đọc lại quá ngày đi. Cũng chưa có ca "gửi lại cùng `Idempotency-Key` sau 409 thì chạy lại trên trạng thái mới".
- Vì sao quan trọng: Desk dựa vào header để tự gửi lại. Nếu sau này 409 bị lưu vào khóa idempotency, lượt gửi lại sẽ phát lại 409 mãi, và không test nào đỏ.
- Đề xuất sửa: một ca giữ khóa đơn ở giao dịch khác giữa lượt đọc đầu và lượt đọc lại (hoặc gia hạn B13 xen giữa). Kiểm 409 có `Retry-After: 1`. Gửi lại cùng khóa thì ra kết quả của trạng thái mới, không có `Idempotent-Replayed`.
- Trạng thái: Open

---

## 6. Giới hạn

- SEC không chạy test ở lượt này. Lượt trước SEC chạy 54/54 test V5-10/V5-15 ở `ba99bdb8`; lượt này dựa vào CI của `92d16358`.
- SEC không review luật nghiệp vụ hoa hồng và minibar (DOM, ARC), cũng không review #127.
- SEC không approve hay comment trên GitHub; ORC gộp.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review phần chênh PR #99 (BE-A2 V5-15) ba99bdb8 → 92d16358: DUYỆT** (rounds/round-05/reviews/SEC-on-be-pr-99-delta.md). PR99-01: mốc hoa hồng nay là folio.settled_at (giờ máy chủ, settle() ghi một lần), không còn theo checkoutAt do client gửi, chặt hơn trước. PR99-02: actual_checkout_at/stay_ended_at = giờ khai ở mọi B18; audit, post_checkout_window_until, debt_opened_at, settled_at giữ ctx.now; biên giờ khai không đổi. Vì nhánh quy đổi checkoutTime nay cũng ghi giờ rời thật, tag v1.0.5 có #99 phải có #127 (A1A-01 notBeforeCheckIn mọi nhánh, A1B-01); PR gộp sau gộp main trước (trường typed). A2-02 Retry-After: 1 đúng khuôn concurrencyProblem, rollback cả khóa idempotency. A2-01 một luật countInWindow, phạm vi đọc không đổi. Merge 63492b7d ghép overdueOnly với bộ lọc #108 đúng tham số. Thẻ mới: 99D-01 (Suggestion, test Retry-After). | SEC |`
