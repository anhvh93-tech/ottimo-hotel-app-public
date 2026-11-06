# ARC review PR #106 (PR-A1a, V5-10) và PR #99 (PR-A1b, V5-15) – trả phòng

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- Đối tượng:
  - **PR #106** `r5-a1a` @ `897656de` (BE-A1, ready). Gốc gộp `ab1fc4ae`.
  - **PR #99** `r5-a1b` @ `ba99bdb8` (BE-A2, DRAFT). Đã merge `r5-a1a` @ `897656de` và `main` @ `cf3b8cb0`. Phần riêng của #99 = `897656de..ba99bdb8` dưới `product/services/api`, vì `main` từ `ab1fc4ae` tới `cf3b8cb0` không đổi API.
  - Hai head không đổi trong lúc review.
- Đối chiếu:
  - hợp đồng 0.3.13 trên `main`: `contract-0.3.13.md` mục 1.1, 1.4, 1.16 (H-01…H-04, H-09), 1.18, 1.19, mục 2;
  - `openapi.yaml`: `checkOut` ("Quy đổi giờ trả", bổ sung 1 BE C0313-03, đơn quá ngày đi), `getCheckoutSummary`, `createVietQr.checkoutAt`, `CheckoutSummary`, `AllowedAction.overdue`, `MinibarStandard.latestCheck`, bảng mã lỗi `CONCURRENT_UPDATE`;
  - BE C0313-01/02/03/07/08/09/10 (`BE-on-contract-0.3.13.md`), chia làn ORC `5b62e3f1`;
  - DOM `DOM-on-be-prs-106-99-checkout.md` (`015bb446`) và câu hỏi ORC gửi ARC trong lúc review.
- Mã đã đọc ngoài diff:
  - `payments.service.ts` (`amountDueNow`, `createVietQr`, `qr_context`);
  - `folio.service.ts` (`settle`, `tryEarnCommissions`);
  - `inventory/internal/minibar.service.ts` (`standard`, `stay`), `inventory/internal/fridge.ts` (`currentRoomOfStay`, `stayRooms`);
  - `registration.service.ts` (`onCheckedOut`), mọi chỗ đọc `actual_checkout_at`;
  - `reporting/internal/dashboard.service.ts` (dòng "Hôm nay"), `reservations.service.ts` (`stayDepartureDate`);
  - `audit-fields.ts` (`defineAuditEntity` gộp hợp), `problem.ts`;
  - Desk trên `main`: `dates.ts` `checkoutInstant`, `CheckOutPage.tsx`.
- Kiểm:
  - `git merge-tree` với `main` @ `355a2929`: cả hai PR **gộp sạch**. Từ `4003471e` tới `355a2929`, `main` không đổi `product/services`.
  - CI:
    - #106: run `42257678219` xanh đủ job, gồm E2E smoke.
    - #99: run `42257839906` (E2E ORC chờ) đã **xong, xanh đủ job**.
  - Chạy lại ở máy. Worktree tách riêng trong scratchpad `arc-pr106-99/`, dựng từ cây gộp `main` + #99 (gồm #106). `pnpm install --offline`, PostgreSQL 17 riêng (container `arc-pr106-99-pg`). Kết quả:
    - `tsc --noEmit` sạch;
    - 6 tệp, 62 ca qua: `v105-overdue-checkout`, `v105-checkout-at`, `checkout-due`, `vietqr-stay-step`, `be-a1-v105-units`, `v105-overdue-checkout-units`.
  - Hai probe tạm, đã gỡ:
    - `resolveCheckoutAt` (mục 1.3);
    - `latestCheck` trên đơn quá ngày đi (thẻ A2-01).
  - Worktree, commit gộp tạm và container đã xóa sau khi chạy.
- Số dòng theo head của từng PR.

## 0. Kết luận

| PR | Kết luận | Thẻ ARC | Điều kiện gộp |
|---|---|---|---|
| **#106** @ `897656de` | **ĐẠT – ARC approve mã.** 0 Blocker, 0 Major | A1-01 (Suggestion) | Không. ARC đồng ý thẻ DOM PR106-01 (mục 1.4), nên làm trong PR, không chặn gộp |
| **#99** @ `ba99bdb8` | **ĐẠT CÓ ĐIỀU KIỆN** | A2-01 (**Major**), A2-02 (Minor) | (1) **DOM PR99-01** (Major): đổi mốc hoa hồng sang `folio.settled_at` (ARC chốt ở mục 3.1). (2) **A2-01**: `latestCheck` theo `countFrom`. Làm trong #99, hoặc PR riêng gộp **trước** hộp "Trả phòng quá ngày đi" của FE-A. Cả hai trước tag v1.0.5 |

- Thứ tự gộp: #106 rồi #99. Nếu #106 thêm commit (ví dụ làm PR106-01) thì #99 merge lại `r5-a1a`, không rebase. Merge `main` hiện chưa cần, vì cả hai gộp sạch.
- ARC không approve hay merge trên GitHub; ORC gộp.
- Đúng luật PR:
  - không sửa `openapi.yaml`, không sửa tệp sinh, không migration;
  - test dùng dữ liệu giả, audit không có dữ liệu khách hay tiền ngoài tập `money`.
- **Chia làn đúng `5b62e3f1` và hợp đồng mục 2:**
  - A1a làm phần nền: `resolveCheckoutAt`, `shared/business-day.ts`, `allowed-actions.ts` (`calendarDate`, `checkOutOpen`, `stayDepartureDate`). `stay-actions.ts` dùng chung `isCheckoutDay`.
  - A1b chỉ thêm nhánh `overdue` lên các hàm đó, cùng các việc hợp đồng giao cho A1b: BE 03 (thời điểm ghi) và BE 10 (`readInput` ý 2, cổng minibar).
  - A1b không sửa `checkout-at.ts` hay `business-day.ts`. Cập nhật theo A1a bằng merge (`210531b7`, `53a0c421`, `c3bfdd0c`).
- Trả lời câu ORC (DOM PR99-01, PR99-02): mục 3.1 và 3.2.

| Mục hợp đồng | #106 | #99 |
|---|---|---|
| 1.1 + 1.19 V5-10 (một `checkoutAt`; QR và `amountDueNow` có `TIME_AFTER_ACTION`; ứng viên thứ ba; QR vắng giờ quy đổi như B18) | Đúng | Không đổi phần của A1a |
| BE C0313-09 (`check_out` theo ngày đi hiệu lực, có `calendarDate`; dòng "Hôm nay" cùng luật) | Đúng | `overdue` theo cùng ngày đi hiệu lực |
| 1.4 + 1.18 V5-15 (vai/trần trước thân lệnh, `nightsNotBilled` theo lúc bấm, `overdueReason`, cấm đêm thêm, audit `after.overdue` + allowlist, `overdueOnly`, QR cùng cổng) | – | Đúng |
| 1.16 H-01…H-04, H-09 (403 không trường mở rộng, MGR chỉ `requiredRole` + `nightsNotBilled`, đúng một `access.denied`) | – | Đúng, có test đếm `access.denied` |
| BE C0313-03 (thời điểm ghi; `post_checkout_window_until` tính từ lúc ghi) | – | Đúng với B18 có `checkoutAt`. Mốc hoa hồng phải đổi theo (PR99-01). B18 chỉ gõ giờ: theo PR99-02 |
| BE C0313-10 (cổng minibar `countFrom`) | – | Cổng B18 và tóm tắt đúng. `GET minibar-standard` chưa theo (A2-01) |

---

## 1. PR #106 – V5-10

### 1.1 Đúng hợp đồng

- **Một luật, một chỗ.** `checkout-at.ts` `resolveCheckoutAt` là hàm thuần. `CheckoutService.departure()` gọi nó cho tóm tắt, trần QR, `amountDueNow` và B18.
  - Gửi `checkoutAt`: dùng nguyên, kiểm ngày (ngày đi, cửa sổ sau nửa đêm, hoặc tối hôm trước khi đồng hồ máy chủ trong cửa sổ và không trước giờ nhận phòng).
  - Không gửi: ứng viên muộn nhất không sau giờ máy chủ + dung sai, không có thì ứng viên sớm nhất.
  - `afterNow` và `noteRequired` cùng một phép so (`diff` với dung sai).
  - Đã thay `checkTypedTime` và nhánh `checkoutAt` riêng trong `decide()`. Hết hai đường đọc giờ, là gốc của BUG-R4-051.
- **C0313-01/08:**
  - `amountDueForQr` và `amountDueNow` truyền `checkoutAt` gốc (bỏ `?? ctx.now`), rồi `assertNotAfterNow` → 422, không tạo QR.
  - `amountDueNow` lỗi 4xx thì `payments.service` trả số dư folio. Đường này đã có, không đổi.
- **BE C0313-09 / BUG-R4-036:**
  - `isCheckoutDay` (ngày nghiệp vụ = ngày đi, hoặc cửa sổ sau nửa đêm) dùng chung cho `checkoutDayOpen` của B18/QR, `allowedActions.checkOutOpen` (theo `stayDepartureDate`, `calendarDate` = `localDate(ctx.now)`) và `stay-actions.ts`.
  - Bên gọi `stay-actions.ts` trên `main` đã truyền `effective_departure` (`dashboard.service.ts` 178–183).
  - `stayDepartureDate` (`reservations.service.ts`) và `effectiveStay` (`stay-support.ts`) cùng nghĩa: đơn con `in_house` của lượt đang ở.
- **Tóm tắt:** có `checkoutAt`, `checkoutTimeNoteRequired`, `checkoutAtAfterNow`. Mọi số đều theo `d.checkout`.
- **Test:**
  - T10-1…T10-5, T10-8, T10-9, T15-15, ca "tối hôm trước ngoài cửa sổ";
  - test cũ được sửa theo hành vi mới có chủ đích (C0313-08), không nới assert: `checkout-due` thêm ca "vắng giờ = 12:00 chuẩn";
  - E2E TC-L4-120 chuyển `checkoutAt` của tóm tắt cho QR.

### 1.2 Hành vi đổi cần ORC/FE biết (không phải thẻ BE)

- **Desk v1.0.4 (`main`) chỉ gửi `checkoutTime` cho B18.** Với QR, Desk tự dựng `checkoutAt` bằng `checkoutInstant`. Theo trục cũ, giờ trước 06:00 gõ sau 06:00 thành ngày đi + 1.
  - Ví dụ: 07:00 ngày đi, gõ 05:30. Desk gửi QR `checkoutAt` = ngày đi + 1 05:30.
  - Trước #106: QR có đêm thêm, sai số (BUG-R4-051).
  - Sau #106: QR 422 `TIME_AFTER_ACTION`, trong khi B18 với `checkoutTime` 05:30 vẫn qua.
  - Không sai tiền nữa, nhưng nút QR báo lỗi. **FE-A V5-10 (chuyển `checkoutAt` của tóm tắt) cần vào cùng tag v1.0.5, gộp sớm sau #106.**
- **FE-A V5-10 gửi B18 thế nào:**
  - Gửi `checkoutAt`. Nếu gửi cả `checkoutTime` thì phải là giờ địa phương của đúng `checkoutAt` đó.
  - Từ #99, gửi cả hai mà lệch giờ → 422 (mục 3.3 c).
  - Chỉ có #106 thì B18 vẫn bắt buộc `checkoutTime` (phần đó thuộc A1b). FE-A gửi cả hai cho tới khi #99 gộp.

### 1.3 Probe `resolveCheckoutAt` (đi 24/11, rollover 06:00, dung sai 15 phút)

| Ca | Kết quả | ARC |
|---|---|---|
| 01:05 ngày 24/11, không gõ, giờ chuẩn 12:00 | 23/11 12:00, `postMidnight`, `noteRequired` | Số tiền đúng (0). Giờ sai ngày → DOM PR106-01 (1.4) |
| Quá ngày đi: lúc 26/11 09:00, gửi 24/11 11:00 | Nhận, `afterNow = false` | Đúng 1.4 |
| Quá ngày đi: gửi 24/11 05:00 (cửa sổ sau nửa đêm của ngày đi) | Nhận, `postMidnight` | Đúng `openapi.yaml` (`checkOut` V5-15: "hoặc cửa sổ sau nửa đêm của ngày đó") |
| 07:00 ngày 24/11, gửi 23/11 23:50 | `null` → 422 `DATE_INVALID` | Đúng 1.19 ý 07 |

### 1.4 Thẻ DOM trên #106 – ý kiến ARC (chủ hợp đồng)

- **FB-R5-DOM-BE-PR106-01 (Minor): ARC đồng ý.**
  - Chỉ dựng ứng viên (ngày đi − 1, `t`) khi `checkoutTime` được gõ. Không dựng từ giờ hẹn hay giờ chuẩn.
  - Chữ 1.19 ý 07 hiểu hẹp lại như vậy; ARC ghi vào danh sách 0.3.14 (mục 4). Không đổi schema.
  - Cách làm:
    - `CheckoutAtInput` thêm cờ `typed`, `checkout.service.ts` đặt `typed: q.checkoutTime !== undefined`;
    - `checkout-at.ts` dòng 79 chỉ thêm `before` khi `typed`;
    - đường `sent` giữ nguyên.
  - Hệ quả DOM đã chấp nhận: QR không gửi `checkoutAt`, trong cửa sổ, `t` ≥ rollover → 422. Desk v1.0.4 gặp ở ca "gõ 23:50 lúc 01:05", tới khi FE-A V5-10 lên.
  - Làm trong #106 trước khi gộp nếu BE-A1 kịp hôm nay (khoảng 10 dòng + sửa ca "C0313-08: nothing typed"). Không thì PR riêng trước FE-A V5-10. Không chặn gộp.
- **FB-R5-DOM-BE-PR106-02 (v1.0.6):** ARC nhận vào 0.3.14 (mục 4). Không làm ở v1.0.5.
- **Biên giờ nhận phòng cho mọi nhánh `checkoutAt` gửi lên** (thẻ SEC A1A-01, DOM dẫn ở mục 5 tệp DOM): ARC đồng ý hướng này.
  - Hiện chỉ nhánh tối hôm trước có biên.
  - Thêm `at ≥ checkedInAt` cho mọi nhánh `sent` → 422 `DATE_INVALID`, `field` = `checkoutAt`.
  - Ghi vào 0.3.14. Mã nên làm cùng PR106-01 nếu tiện. Mức độ theo SEC.

### FB-R5-ARC-BE-A1-01
- Mức độ: Suggestion
- Vị trí: `product/services/api/src/modules/reservations/audit-entities.ts` 42–48 (@ `897656de`); `frontdesk/audit-entities.ts` (danh sách `reservation` của module ghi B18).
- Vấn đề:
  - Năm khóa mới đặt ở danh sách của module reservations, kèm chú thích "bị SR-AUD-03 lọc mất tới nay".
  - `defineAuditEntity` gộp hợp các danh sách cùng thực thể. `frontdesk/audit-entities.ts` đã có sẵn `lateSurchargeVnd` và `checkoutMode`, nên hai khóa này chưa từng bị lọc.
  - Chỉ `systemTime`, `extraNight`, `postMidnightWindow` là khóa mới thật.
  - #99 lại đặt `overdue` ở danh sách frontdesk.
- Vì sao quan trọng: không đổi hành vi. Chỉ là người sau đọc chú thích sai, và khóa của cùng một lệnh B18 nằm ở hai tệp.
- Đề xuất sửa:
  - Chuyển ba khóa mới sang `frontdesk/audit-entities.ts`, cạnh `overdue`. Bỏ hai khóa trùng. Sửa chú thích.
  - Làm khi tiện, ví dụ cùng commit PR106-01, hoặc ở v1.0.6.
- Trạng thái: Open

---

## 2. PR #99 – V5-15

### 2.1 Đúng hợp đồng

- **Thứ tự 1.18:**
  - Ở B18, bước kiểm trước `lateFeeInsteadOfNight` và QR, `overdueGate` (tải đơn không khóa → `overdueStay` → `assertOverdueCheckoutRole`) chạy trước `readInput`.
  - Ở controller, khi có `lateFeeInsteadOfNight`: cổng chạy trong `read` riêng, trước `lateFeeApprover`, nên không mật khẩu nào bị thử.
  - Tra `Idempotency-Key` vẫn đứng đầu.
- **Luật thuần, một chỗ:** `reservations/public/overdue-checkout.ts`, gồm `isOverdue`, `nightsNotBilled` theo `ctx.today` và `canCheckOutOverdue` (hợp vai, hằng `MGR_OVERDUE_MAX_NIGHTS = 1`, ESC-007 A). B18, QR, tóm tắt, `allowedActions` và dòng "Hôm nay" cùng đọc luật này. Test có ca dòng "Hôm nay" khớp `allowedActions`.
- **Ghi lại dưới khóa:**
  - Sau khi khóa đơn và đơn con, `overdueStay` đọc lại. Lệch trạng thái hoặc lệch ngày đi → 409 (mục 3.3 b).
  - `nightsNotBilled` dùng `ctx.today` cố định cả request, nên lúc ghi không đổi trần.
- **Đường quá ngày đi:**
  - bắt buộc `checkoutAt`; `overdueReason` qua `f.text`;
  - `extraNight`, `lateFeeInsteadOfNight` → `NOT_ALLOWED`; sau mốc cuối → `LATE_CHECKOUT_AFTER_LIMIT` ở `checkoutAt`, cả B18 lẫn QR;
  - `checkoutTimeNoteRequired = false`;
  - phụ thu theo giờ `checkoutAt` (T15-11);
  - không thêm đêm bán (T15-2 đếm dòng `room`).
- **Thời điểm ghi:**
  - `actual_checkout_at`, `registration.onCheckedOut` và `touchLastStay` lấy `departedAt`;
  - `post_checkout_window_until` vẫn do `FolioService.settle` tính từ `now` (T15-2 kiểm);
  - `debt_opened_at` vẫn theo lúc ghi.
  - Mọi chỗ đọc `actual_checkout_at` đã rà:
    - đăng ký lưu trú, mốc giữ ảnh, "Cần chú ý" của đăng ký, dòng thời gian của đơn: nên theo giờ rời thật;
    - `debt_opened_at` dạng cũ: chỉ áp dòng trước 0076;
    - **riêng `tryEarnCommissions` sai nghĩa**: mục 3.1.
- **Audit:**
  - `after.overdue` có đủ năm trường; allowlist có `overdue`; test đọc lại `audit_event`.
  - `overdueOnly` ghim `category = state` và `action`, thêm điều kiện `e.after ? 'overdue'`, sau điều kiện `x-scope own`.
  - `access.denied` ghi sau rollback qua `recordUseCaseDenial`. Chỉ ghi lý do `OVERDUE_CHECKOUT`, nên 403 khác không bị ghi hai lần.
- **Cổng minibar (phần ARC được giao):** mục 2.2.

### 2.2 Cổng minibar – `minibar-checkout.port.ts`, `ports.ts` `MinibarCountWindow`: đạt

- **Chữ ký:** `MinibarCountWindow { countFrom?: LocalDate }` đặt ở `frontdesk/public/ports.ts`. Đúng mẫu cổng do bên dùng khai báo (`FrontdeskMinibarPort` đã ở đó).
  - Tham số `window` tùy chọn, mặc định `{}`, nên bản cài và bản giả cũ vẫn khớp.
  - Inventory nhận **ngày**, không nhận cờ "quá ngày đi". Module inventory không phải biết luật V5-15.
- **`fridgeState`:**
  - Có `countFrom` thì lần đếm sống có `business_date ≥ countFrom` được tính. Không có thì giữ K11-09 (`=== today`).
  - Luật chỉ áp tủ căn đang ở (`stayIsInRoom`). Trên đơn quá ngày đi, `currentRoomOfStay` trả căn của đoạn bắt đầu muộn nhất (đã đọc `fridge.ts` 250–267), nên vẫn đúng tủ.
  - Tủ căn đã rời (B14) không lọc ngày, như R9.
  - So chuỗi `YYYY-MM-DD` là an toàn.
- **`uncheckedRooms`:** truyền `window` xuống `fridgeState`. Lần đếm trước ngày đi vẫn ra `not_today`, Desk hiện "cần đếm lại". Đúng.
- **Bên gọi:** `checkout.service.ts` 1065 đặt `countFrom` = ngày đi **hiệu lực** (`overdue.departureDate`, gồm đơn con). Tóm tắt và B18 dùng cùng `uncheckedMinibars(…, overdue)`, nên hai bên khớp nhau.
- **Test:** ba ca cổng (có và không `countFrom`, lần đếm trước ngày đi, đếm sau khi khách đi), ca B18 409 rồi đếm lại, T15-11 (lần đếm ngày đi được tính).
- **ARC giữ `countFrom` = ngày đi hiệu lực**, không mở về ngày đi − 1 cho lần đếm trong cửa sổ sau nửa đêm. Lý do: cùng mức chặt với K11-09 của đường thường lúc ≥ 06:00 ngày đi.
- **DOM PR99-03 (v1.0.6):** ARC đồng ý.
  - Cổng trả thêm `countedBeforeDeparture`: inventory nhận `departedAt` trong `window`, so với `created_at` của lần đếm sống.
  - Chỉ báo, không chặn. Đổi chữ ký cổng nhỏ, không đổi hợp đồng HTTP trừ trường hiển thị ở 0.3.14.
- **Còn hở:** `GET minibar-standard` (`latestCheck`) chưa theo cửa sổ. Thẻ A2-01.

### FB-R5-ARC-BE-A2-01
- Mức độ: **Major**
- Vị trí:
  - `product/services/api/src/modules/inventory/internal/minibar.service.ts` `standard()` 267–276 (@ `ba99bdb8`): `latest.business_date !== today && stayIsInRoom(…)` → `latest = null`;
  - hợp đồng `MinibarStandard.latestCheck` (`openapi.yaml` 13161: "nhất quán với `minibarUncheckedRooms` – `null` = tủ cần đếm (lại)").
- Vấn đề:
  - #99 mở cửa sổ `countFrom` cho blocker B18 và cho `CheckoutSummary.minibarUncheckedRooms`. `latestCheck` vẫn theo K11-09 "hôm nay".
  - Probe trên cây gộp, ca S2 của test: đi 10/01, đếm 10/01 10:00, lúc 12/01 06:30.
    - `GET minibar-standard` → `latestCheck = null`;
    - `getCheckoutSummary` (OWN, `checkoutAt` 10/01 14:00) → `blockers = []`, không có `minibarUncheckedRooms`;
    - B18 qua (T15-11).
  - Cùng một tủ, máy chủ trả hai câu trái nhau. Đây là câu BE-A2 để ngỏ ở mô tả PR.
- Vì sao quan trọng:
  - Hợp đồng ghi hai trường phải khớp nhau.
  - Trên đơn quá ngày đi, Desk mở tủ sẽ thấy "cần đếm (lại)", trong khi quầy đã đếm lúc khách đi. Lúc này căn thường đã được dọn (nút Cần dọn của V5-15), tủ có thể đã được bù hàng.
  - Đếm lại một tủ đầy thành "dùng 0" thì lần đếm mới thay lần cũ (R6), và tiền minibar đã ghi bị giảm. BR v0.5.14 (DOM review #101/#108/#110) đã xếp đếm lại minibar là sửa giảm theo BR-438 (2a); SEC V516-01 cùng hướng. Doanh thu mất mà không ai cố ý.
  - Chưa lộ ra trên `main` khi chưa có hộp "Trả phòng quá ngày đi" của FE-A. Nhưng phải xong trước khi hộp đó gộp.
- Đề xuất sửa (ARC, người giữ module inventory, chốt):
  1. Một hàm đoán duy nhất trong `inventory/internal/fridge.ts`, ví dụ `countInWindow(liveBusinessDate, today, window)`. `fridgeState` (`minibar-checkout.port.ts` 96) và `standard()` cùng gọi. Không viết lại luật ở hai nơi.
  2. `standard()` tự tính cửa sổ khi người gọi là Desk. Cần ngày đi **hiệu lực**, nên **không** viết câu SQL thứ tư cho BR-422:
     - thêm `stayDepartureDate` vào `StayInfo` (`reservations/public/sales-port.ts`), đọc trong `readStayInfo` (`reservations/public/read-port.ts`) cùng nghĩa với `Reservation.stayDepartureDate`;
     - rồi `window = isOverdue(today, stayDepartureDate) ? { countFrom: stayDepartureDate } : {}`, dùng `reservations/public/overdue-checkout.ts`.
  3. Phạm vi HK không đổi: HK chỉ đọc đơn có ngày đi = hôm nay.
  4. Test integration:
     - ca S2 → `latestCheck` có và đúng lần đếm 10/01, `minibarUncheckedRooms` rỗng;
     - đường thường lúc 07:00 ngày đi, lần đếm hôm qua → `latestCheck = null` (K11-09 giữ);
     - đơn có đơn con gia hạn → cửa sổ theo ngày đi của đơn con.
  - Làm trong #99 (đang DRAFT, khoảng 0,5 ngày). Nếu BE-A2 không kịp thì PR riêng, gộp trước hộp quá ngày đi của FE-A, cùng tag v1.0.5. ORC xếp.
- Trạng thái: Open

### FB-R5-ARC-BE-A2-02
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` 1227 (@ `ba99bdb8`): `throw problem('CONCURRENT_UPDATE')`.
- Vấn đề:
  - Bảng mã lỗi (`openapi.yaml` 124) ghi `CONCURRENT_UPDATE` "kèm header `Retry-After`". Client gửi lại cùng `Idempotency-Key`/`If-Match`.
  - Hai chỗ khác ném mã này đều kèm `Retry-After: 1`: `concurrencyProblem` (`shared/problem.ts` 179) và lần đọc lại sức chứa dưới khóa (`reservations.service.ts` 1785). Chỗ này thì không.
- Vì sao quan trọng: client đọc `Retry-After` để biết gửi lại ngay. Thiếu header thì phản hồi lệch hợp đồng, và client có thể bỏ qua bước gửi lại.
- Đề xuất sửa:
  - `problem('CONCURRENT_UPDATE', { headers: { 'Retry-After': '1' } })`.
  - Thêm một câu chú thích: lần gửi lại sẽ được quyết theo trạng thái mới, ví dụ 422 `NOT_ALLOWED` cho `overdueReason` nếu đơn vừa được gia hạn.
  - Test đơn vị nếu dựng được dễ; không bắt buộc.
- Trạng thái: Open

---

## 3. Trả lời câu hỏi

### 3.1 ORC / DOM PR99-01 – mốc "tiền về sau trả phòng" của hoa hồng: **ARC chọn `folio.settled_at`**

- **Kết luận:** câu so `p.created_at > r.actual_checkout_at` (`folio.service.ts` 1496) **sai nghĩa** từ khi #99 ghi `actual_checkout_at` = giờ rời thật.
  - DOM đã nêu đúng: mọi khoản thu `pending` trong lúc trả phòng, kể cả `finalPayment` của chính B18, thành "tiền về sau trả phòng". Hoa hồng bị giữ tới khi đối soát. BR-903 không có ý đó.
  - Chưa lộ trên Desk v1.0.4, vì Desk chưa gửi `checkoutAt` cho B18. Sẽ lộ ngay khi FE-A V5-10 gửi, hoặc ở đường quá ngày đi. Sửa trong #99, vì #99 làm đổi nghĩa.
- **Mốc chọn:** `folio.settled_at`, không dùng `state_transition` B18.
  1. Ghi đúng một lần: chỉ `FolioService.settle` ghi (`folio.service.ts` 1352, chú thích "the only place that settles a folio"). Nằm trong giao dịch B18, trước `tryEarnCommissions`, mọi đường B18 đều qua. Sau đó không đường nào xóa hay ghi lại (đã rà `settled_at` trong `src/modules`).
  2. Cùng cấp với tiền: khoản thu thuộc folio, và folio là một cho đơn chính và các đơn con.
  3. Cùng module với `tryEarnCommissions` (folio), không phải đọc bảng `state_transition` của module reservations.
  4. Không migration, không đổi hợp đồng.
  5. Giữ đúng hành vi v1.0.4. Trước #99, mốc là `ctx.now` của B18, mà `settled_at` là đồng hồ ngay sau đó trong cùng giao dịch.
     - `finalPayment` ghi trước `settle`, nên `created_at ≤ settled_at`, không bị tính. Đồng hồ giả của test cho hai giá trị bằng nhau, phép `>` vẫn loại.
     - Thu nợ sau B18: `created_at > settled_at`, vẫn bị giữ tới khi đối soát.
     - QR tạo trước B18, xác nhận sau (R3-Q30 `qrLate`): không tính, như cũ.
- **Cách sửa (BE-A2 làm trong #99, báo BE-B vì tệp của module folio):**
  - câu thứ nhất của `tryEarnCommissions` đổi thành `FROM payment p JOIN folio f ON f.id = p.folio_id WHERE p.folio_id = $1 … AND f.settled_at IS NOT NULL AND p.created_at > f.settled_at`, bỏ `JOIN reservation`, sửa danh sách tham số;
  - giữ nguyên câu thứ hai (khoản do người hưởng ghi còn `pending`/`disputed`, mọi lúc, BR-527);
  - sửa chú thích hàm: "after the check-out" = sau lúc folio được `settled` bởi B18.
- **Test:** bốn ca DOM PR99-01:
  1. thu trong lúc trả phòng → `earned` lúc B18;
  2. thu nợ sau B18 → giữ tới đối soát;
  3. đơn quá ngày đi, khoản ghi giữa giờ rời thật và lúc ghi → `earned` lúc B18;
  4. khoản do CTV ghi còn `pending` → giữ.
  - Ca 1 và 3 dùng `checkoutAt` sớm hơn khoản thu. Đọc lại `commission.status` và `recognized_at` trong DB, không chỉ đọc phản hồi.

### 3.2 ORC / DOM PR99-02 – `actual_checkout_at` khi B18 chỉ gửi `checkoutTime`: **ARC đồng ý**

- `departedAt = d.checkout.at` cho **mọi** B18 (`checkout.service.ts` 1463). Bỏ nhánh `d.checkout.sent ? … : ctx.now`.
- Lý do:
  - Từ #99, `readInput` buộc có `checkoutTime` hoặc `checkoutAt`. Vậy `d.checkout.at` luôn là giờ người ghi khai, đã qua kiểm dung sai và ghi chú. Đây cũng chính là giờ B18 dùng tính tiền.
  - Một lần trả phòng chỉ có một "giờ rời". Đúng tinh thần V5-10.
  - `recordedAt`, transition, `post_checkout_window_until`, `debt_opened_at` vẫn theo `ctx.now`.
  - Phần hoa hồng đã tách khỏi `actual_checkout_at` ở 3.1, nên đổi này không ảnh hưởng tiền.
- Hợp đồng: câu 1.18 và `checkOut` bổ sung 1 (BE C0313-03) "B18 có `checkoutAt` (mọi đường)" đổi thành "mọi B18 – giờ trả đã quy đổi". Chỉ chữ, ARC ghi vào 0.3.14 (mục 4). FE/MOB không phải đổi.
- Làm cùng commit với 3.1 (một dòng). Test: biến thể của T15-6, B18 chỉ gửi `checkoutTime` sớm hơn lúc bấm, có ghi chú → `actual_checkout_at` và giờ chuyển cho đăng ký lưu trú = giờ gõ.
- Mức độ giữ Minor theo DOM. ARC khuyên làm trong #99, nhưng không là điều kiện gộp.

### 3.3 Ba giả định BE-A2 cần ARC xác nhận

| # | Giả định | ARC |
|---|---|---|
| a | `LATE_CHECKOUT_AFTER_LIMIT` trên đơn quá ngày đi dùng `field = checkoutAt` (B18 1810, QR 935) | **Xác nhận.** Trên đường này không có `extraNight` hay `lateFeeInsteadOfNight` để gửi kèm. Cách gỡ duy nhất là sửa `checkoutAt`, hoặc B13 trước rồi ghi theo ngày mới. Ghi vào 0.3.14 |
| b | Trạng thái quá ngày đi đổi giữa lúc đọc không khóa và lúc khóa → 409 `CONCURRENT_UPDATE` | **Xác nhận, kèm `Retry-After`** (thẻ A2-02). Khe chỉ nằm giữa hai lần đọc trong cùng request, nên là tranh chấp tạm thời, không ghi gì: đúng nghĩa dòng `CONCURRENT_UPDATE`. Gửi lại cùng khóa thì cổng quyết theo trạng thái mới. Không dùng 412 `VERSION_CONFLICT`: B13 kiểu OTA thêm đơn con mà không đổi `version` của đơn chính, nên `currentVersion` sẽ trùng với số client đã gửi, gây khó hiểu. B13 trực tiếp đổi `version` thì `assertVersion` đã trả 412 trước |
| c | Gửi cả `checkoutTime` và `checkoutAt` thì phải khớp giờ, áp mọi B18 | **Xác nhận.** Đúng `checkOut` bổ sung 1 (BE C0313-03): 422, `field` = `checkoutTime`. `VALIDATION_FAILED` là mã trường đã dùng cho sai kiểu. Từ 0.3.6, hợp đồng đã ghi "chỉ kiểm khớp giờ". Desk v1.0.4 chỉ gửi `checkoutTime`, nên không vỡ. Bước kiểm trước `lateFeeInsteadOfNight` dùng chung `readInput`, nên lỗi này trả trước khi thử mật khẩu. FE-A: mục 1.2 |

### 3.4 BE-A2 hỏi `latestCheck` theo `countFrom`? **Có.** Thẻ A2-01.

---

## 4. Danh sách ARC đưa vào hợp đồng 0.3.14 (chỉ chữ, không đổi schema)

1. 1.19 ý 07: ứng viên (ngày đi − 1, `t`) chỉ khi `checkoutTime` được gõ (DOM PR106-01).
2. `checkoutAt` gửi lên không trước giờ nhận phòng thực tế, ở mọi nhánh (SEC A1A-01, DOM đồng ý).
3. 1.18 và `checkOut` BE C0313-03: "mọi B18 – giờ trả đã quy đổi" (DOM PR99-02).
4. `contract-0.3.13.md` 1.4 ý 2 thêm "hoặc cửa sổ sau nửa đêm của ngày đó". `openapi.yaml` đã có câu này, chỉ tài liệu hợp đồng thiếu.
5. Đường quá ngày đi:
   - `LATE_CHECKOUT_AFTER_LIMIT` với `field = checkoutAt`;
   - đơn đổi trạng thái giữa lúc đọc và lúc khóa → 409 `CONCURRENT_UPDATE` + `Retry-After`.
6. `MinibarStandard.latestCheck`: trên đơn quá ngày đi, tính lần đếm từ ngày đi hiệu lực, như `minibarUncheckedRooms`.
7. v1.0.6: DOM PR106-02 (khách đi tối hôm trước, quầy biết sau 06:00); DOM PR99-03 (cờ "đếm trước giờ khách rời").

Mốc hoa hồng (3.1) là luật cài đặt của BR-903, không thuộc hợp đồng HTTP. Ghi ở DOM `rules-v1.0.5.md` 15.5, BR-903 (BR v0.5.15 của DOM) và chú thích hàm.

## 5. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-07 | 5 | **ARC – review kỹ thuật PR #106 (PR-A1a, V5-10) và PR #99 (PR-A1b, V5-15)** (rounds/round-05/reviews/ARC-on-be-pr-106-99-checkout.md): #106 @ 897656de ĐẠT (approve mã; A1-01 Suggestion; đồng ý DOM PR106-01 – ứng viên tối hôm trước chỉ từ giờ gõ, nên làm trong PR, không chặn gộp); #99 @ ba99bdb8 ĐẠT CÓ ĐIỀU KIỆN: (1) DOM PR99-01 – mốc "tiền về sau trả phòng" của tryEarnCommissions = folio.settled_at (ghi một lần trong giao dịch B18, cùng module folio, không migration), (2) FB-R5-ARC-BE-A2-01 Major – GET minibar-standard latestCheck theo countFrom trên đơn quá ngày đi (một hàm đoán trong fridge.ts, StayInfo.stayDepartureDate), trong #99 hoặc PR riêng trước hộp quá ngày đi của FE-A; A2-02 Minor – CONCURRENT_UPDATE kèm Retry-After. ARC đồng ý DOM PR99-02: actual_checkout_at = giờ trả đã quy đổi cho mọi B18. Xác nhận giả định BE-A2: LATE_CHECKOUT_AFTER_LIMIT field checkoutAt; CONCURRENT_UPDATE khi trạng thái quá ngày đi đổi giữa đọc và khóa; luật khớp checkoutTime/checkoutAt áp mọi B18; countFrom = ngày đi hiệu lực. Chia làn đúng 5b62e3f1. FE-A V5-10 cần cùng tag và gộp sớm sau #106 (Desk v1.0.4 gửi QR checkoutAt theo trục cũ → 422 thay vì số sai). Bảy mục chữ vào 0.3.14 | ARC | Quyền ARC (kiến trúc, hợp đồng, chủ module inventory); BR-903 theo DOM |`

## 6. Điểm làm tốt

- `resolveCheckoutAt` và `overdue-checkout.ts` là hàm thuần, mỗi luật một chỗ, và mọi bên gọi (tóm tắt, QR, B18, `allowedActions`, dòng "Hôm nay") cùng đọc. Lỗi kiểu BUG-R4-036/051 không còn chỗ để lặp lại.
- #99 đọc lại trạng thái quá ngày đi dưới khóa, và `nightsNotBilled` lấy từ `ctx.today` cố định. Người ghi không lách được trần MGR bằng cách chọn `checkoutAt` hay bấm đúng lúc qua 06:00.
- Cổng minibar nhận `countFrom` là một ngày chứ không phải cờ nghiệp vụ, tham số tùy chọn giữ bản cài cũ. Test đọc lại `audit_event`, đếm `access.denied`, kiểm `post_checkout_window_until` trong DB, không chỉ kiểm phản hồi API.
