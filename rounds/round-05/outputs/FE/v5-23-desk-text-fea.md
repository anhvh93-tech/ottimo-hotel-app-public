# FE-A – V5-23 phía Desk: lượt sửa chữ sai sự thật (Round 5, v1.0.5, bước Sản xuất)

Nhánh `r5-fe-g2-text` (từ `origin/main` 3174ce65, đã gộp main 511d7f23). PR thứ hai của Gói 2 Desk; PR thứ nhất là #166 (V5-21 + câu Desk V5-25).
Chữ lấy nguyên văn từ `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 4. Một script đọc bảng của từng mục rồi ghi vào `gen_strings.py`, nên không gõ lại chữ. Test so chữ bằng `tv(key)`.

## Đã làm gì

| Mục copy | Việc | Chỗ sửa |
|---|---|---|
| 4.1 (FB-R4-DOM-UXD-PR89-02) | Dòng phí trả sớm chọn khóa theo `noticeDays`: null hoặc rỗng → khóa gốc (đơn OTA); 0 → `_same_day`; > 0 → `_notice_one` / `_notice_other`. Xóa `bill.line.early_departure_fee_notice`. U+00A0 sau `{noticeDays}` lấy đúng từ bảng copy | `app/folio.ts` (`earlyDepartureKey`) |
| 4.2 BUG-R2-094 | Ô tìm người đi cùng mang nhãn `stay.companion_field` | `StayDialogs.tsx` (PartyDialog) |
| 4.3 BUG-R2-096 | `stay.charge_default` bỏ vế phí phạt. `stay.charge_penalty_note` chỉ ghép khi `category` là `penalty` hoặc `damage` (DOM 8.1 G6) | `StayDialogs.tsx` (AddChargeDialog) |
| 4.4 BUG-R2-098 | `StepUpDialog` nhận `purpose: 'id' \| 'account'` (mặc định `'id'`). MoneyPage truyền `'account'` → `stepup.title_account`, `stepup.body_account`. `ci.stepup_body` và `params.k.c3_stepup_minutes` đổi chữ, không còn "15 phút" | `stay/common.tsx`, `money/MoneyPage.tsx` |
| 4.7 (a) BUG-R3-028 | 6 câu bỏ "Round 3" / "R2" | chỉ chuỗi |
| 4.7 (c) | Hộp Xác nhận giờ trả: ô giờ dùng `stay.agreed_time`. Màn Trả phòng vẫn dùng `checkout.departure_time` | `StayDialogs.tsx` (ConfirmTimeDialog) |
| 4.7 (d) | `bk.room_help` đổi chữ cho đúng hành vi | chỉ chuỗi |
| 4.7 (e) | `sale.quote_expires` → "Hiệu lực đến {time}". `{time}` = `expiresAt − 1 phút`, dạng "HH:mm dd/MM/yyyy", cùng phút với tin gửi khách | `app/dates.ts` (`quoteValidUntil`), `QuotesPage.tsx`, `QuoteDialog.tsx` |
| 4.7 (f) | "Đơn của tôi" trống: sale, CTV dùng `rsv.list_empty_body_sales`. Lễ tân giữ `rsv.list_empty_body` | `ReservationsPage.tsx` |
| 4.9 BUG-R3-051 | `webreq.form_off_body` đổi chữ | chỉ chuỗi |
| 4.10 BUG-R3-055 | `declineReasonCode === 'erased_on_request'` → `webreq.pii_erased`. Ca khác giữ `webreq.pii_purged` | `WebRequestDrawer.tsx` |
| 4.11 | Đêm của đơn kênh Nội bộ: chữ phụ `folio.adjust_night_help_internal`, vẫn ghép `rate.night_now`. Ô giá trống → `folio.adjust_night_empty_internal` | `FolioDialog.tsx` |
| 4.12 UXD-F1-01 | `problemView`: 409 `INVALID_TRANSITION` → `error.INVALID_TRANSITION_generic`, không còn `"{status}"` hiện nguyên. Trang Người dùng (tự tải lại) → `error.INVALID_TRANSITION_generic_reloaded`, khóa đã có trên main từ V5-15 | `app/problem.ts`, `UsersPage.tsx` |
| 4.13 UXD P440-06 | `error.DEPOSIT_INSUFFICIENT`: `{required}`, `{paid}` có đơn vị "đ", cả ở hộp cọc lẫn đường 422 qua `rsvErrorText` | `ReservationDialogs.tsx`, `app/reservations.ts` |
| 4.14 GN-V104-QR-green-box (bản 1.3) | `sale.hold_next`, `sale.hold_next_ctv` đổi chữ, thêm `sale.hold_next_no_qr`. `{time}` lấy từ hạn giữ chỗ máy chủ trả (`hold.expiresAt`, dạng "15:30 07/11"); chưa có thì dùng `holdUntil`. Không truyền `hours`. `DepositQr` có thêm `onFail`: tạo mã lỗi hoặc `PAYMENT_NOT_CONFIGURED` thì hộp xanh ra `_no_qr`; lúc đang tạo vẫn là `sale.hold_next` | `QuoteDialog.tsx`, `DepositQr.tsx` |
| 4.15 CPY P401-11 | U+2011 ở cột EN của 25 khóa. 2 khóa (`mfa.nudge`, `mfa.enroll_required`) đã có U+2011 từ V5-40, nên chỉ đổi 23 dòng | chỉ chuỗi |
| 4.16 FB-R4-SEC-ARC-EM-13 | Hộp sửa email của OWN dùng `users.email_purpose` với `{name}` = `user.displayName` | `UserEmailDialog.tsx` |
| 4.18 | Xóa `fo.tabs.holds` khỏi `gen_strings.py` | chỉ chuỗi |
| 4.19 (PO đưa vào, quyết định 12) | `fo.rack.empty_body`, `desk_code.channel_off`, `error.DELIVERY_CHANNEL_DISABLED` đổi chữ | chỉ chuỗi |

Sinh lại chuỗi: `python3 -I design/tools/gen_strings.py` → 3535 chuỗi + 8 mẫu, chạy lại không lệch.

## File tạo/sửa

- Chuỗi:
  - `product/design/tools/gen_strings.py`: 17 dòng sửa, 15 khóa mới (nhóm "v1.0.5 V5-23 – FE-A", đặt sau nhóm V5-15 để tránh đụng chỗ các làn khác thêm trước `build()`), xóa 2 khóa, U+2011 ở 23 dòng.
  - File sinh ra: `strings-vi.json`, `strings-en.json`, `strings.js`, `strings-tables.md`.
- Mã:
  - `product/apps/admin-web/src/app/`: `dates.ts`, `folio.ts`, `problem.ts`, `reservations.ts`;
  - `product/apps/admin-web/src/pages/`: `UserEmailDialog.tsx`, `UsersPage.tsx`;
  - `pages/money/`: `MoneyPage.tsx`;
  - `pages/quotes/`: `QuoteDialog.tsx`, `QuotesPage.tsx`;
  - `pages/reservations/`: `DepositQr.tsx`, `ReservationDialogs.tsx`, `ReservationsPage.tsx`;
  - `pages/stay/`: `FolioDialog.tsx`, `StayDialogs.tsx`, `common.tsx`;
  - `pages/webreq/`: `WebRequestDrawer.tsx`.
- Test mới: `product/apps/admin-web/src/__tests__/v105-text-pass-fea.test.tsx` (19 ca).
- Test sửa theo chữ mới:
  - vitest: `folio-ed-label.test.ts` (thêm 2 ca: 0 ngày, EN số ít/số nhiều), `s3-review.test.tsx`, `v5-11-early-departure-night-fea.test.tsx`, `s4-money.test.tsx`, `v104-holds-feb.test.tsx`, `reservation.test.tsx`, `refund.test.tsx`, `params.test.tsx`, `guest-picker-race.test.tsx`, `s3-fix9.test.tsx`, `s4-25-foc.test.tsx`;
  - e2e: `tests/e2e/ui-clock/stay-writes.h15.spec.ts`, `tests/e2e/ui-clock/foc.s4.spec.ts` (ô người đi cùng).

## Giả định (UXD, DOM xem)

- H1. "Đơn Nội bộ" = kênh của đơn (`channelId`) có `channelGroup = 'internal'` trong danh mục kênh, giống cách máy chủ xét `channel_group`. Khi danh mục chưa tải xong, hộp hiện chữ phụ thường.
- H2. `folio.adjust_night_empty_internal` chỉ hiện khi ô giá **trống** (copy: "ở ô trống"). Giá trị sai khác vẫn ra `field_error.amount_not_positive`.
- H3. `problemView` luôn đổi 409 `INVALID_TRANSITION` sang câu chung. Đường của đơn đặt phòng đi qua `rsvErrorText`, vẫn nêu trạng thái. Các chỗ có câu riêng giữ nguyên câu riêng:
  - Buồng phòng: `_reloaded`;
  - Trả sớm: thứ tự 9.13;
  - Yêu cầu website;
  - Đặt lại 2 bước.
- H4. Phí trả sớm: chọn `_one` / `_other` theo luật số nhiều tiếng Anh cho cả hai ngôn ngữ của phiếu. VI hai dạng cùng chữ, nên kết quả VI không đổi.
- H5. 4.15 áp đúng 25 khóa copy liệt kê, gồm `secmail.lead` (thư) và `staff.notif.sec.*` (app nhân viên). Thư bảo mật gửi đi viết cứng trong `integrations/notification/email-templates.ts`, không đọc `strings-en.json`, nên không đổi ở đây.
- H6. 4.14: `DepositQr` gọi `onFail(false)` khi bắt đầu mỗi lần tạo mã. Bấm thử lại mà tạo được mã thì hộp xanh quay về `sale.hold_next`.

## Kiểm

- Vitest:
  - file mới: 19/19;
  - các file test đã sửa: xanh;
  - toàn bộ admin-web: kết quả ghi ở PR.
- `tsc` admin-web, `eslint`, `prettier --check` sạch.
- Chạy lại `python3 -I design/tools/gen_strings.py` không ra thay đổi (bước CI "Copy is generated").
- Thử gộp `origin/main` mới nhất sạch; đã gộp main 511d7f23 vào nhánh.
- Không có dữ liệu khách thật, số hoa hồng, IP hay khóa bí mật. Tên trong test là tên mẫu của mock.

## Rủi ro / vướng mắc

- Hai spec e2e chỉ đổi tên ô, chưa chạy Playwright ở máy (cần cả stack). CI sẽ chạy.
- PR này và #166 cùng sửa `app/problem.ts` và `gen_strings.py`, nhưng mỗi PR chèn ở chỗ khác nhau. Thử gộp hai nhánh (merge-tree): chỉ `strings.js` (một dòng, file sinh ra) đụng nhau. PR nào gộp sau thì gộp main rồi chạy lại `gen_strings.py`.

## Việc chưa xong / không thuộc PR này

- 4.8 BUG-R3-035: 2 khóa `bill.line.late_fee_as_night`, `bill.line.late_fee_after_limit` đi cùng việc của BE-B ở `folio/public/line-labels.ts`. FE không cần sửa mã: `lineLabel` dùng `labelKey` khi khóa có. FE **chưa thêm** 2 khóa này, để tránh trùng dòng với PR của BE-B. Đề xuất: BE-B thêm 2 dòng vào `gen_strings.py` cùng PR, hoặc ORC giao lại FE.
- 4.5 BUG-R2-100: copy ghi "không đổi chữ", QA xác nhận.
- 4.6 BUG-R2-218, 4.20 (a)(b), 4.21 `msg.*`: chữ khách, làn trang khách (#167, UXD đã duyệt 07/11).
- 4.17: việc của BA (V5-71).
- `design/content-guide.md` (main 511d7f23) còn dòng `fo.tabs.holds` (328) và `bill.line.early_departure_fee_notice` (2823–2824). File của UXD, FE không sửa. Đề xuất UXD dọn cùng lượt đồng bộ content-guide.
