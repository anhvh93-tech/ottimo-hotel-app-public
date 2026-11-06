# FE-3 – V5-48 phần Desk: 409 trên đơn đã đóng ở hộp Xác nhận cọc và VietQR

- Round 5, bước Sản xuất · FE-3 · 07/11/2026
- Nhánh `r5-fe-v5-48`, cắt từ `origin/main` `64d49730`. Không rebase.
- Gộp sau #105 (`r5-v5-48`, máy chủ V5-48, SEC đã duyệt @ `9fa49550`). #105 đã gộp (`391937fe`), và nhánh đã merge `main` có #105. SEC khuyên lên cùng tag với #105, để lễ tân không gặp câu lỗi chung.
- Hợp đồng 0.3.13 bổ sung 1 (`Problem.reservationStatus`) đã có trên main, nên nhánh không mang code máy chủ.
- Chữ: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 2.1, mục 9.1a. Lấy nguyên 3 ô VI/EN.

## 1. Việc đã làm
- Trên đơn `cancelled`, `no_show`, máy chủ trả 409 `INVALID_TRANSITION` kèm `reservationStatus` cho hai lệnh `confirmPaymentReceived` và `createVietQr`. Desk đọc `reservationStatus` **trước** `currentState`, vì `currentState` ở đây là trạng thái khoản thu (UXD 9.1a, SEC 3.1).
- Câu theo vai và theo 5B-1:
  - SAL/CTV, không có vai FD+ → `error.closed_booking_payment_sales`.
  - FD+ khi 5B-1 chưa lên → `error.closed_booking_payment_no_5b1` (Tờ 2a).
  - FD+ khi nút "Ghi tiền về sau khi hủy" của 5B-1 đã có trên Desk → `error.closed_booking_payment`.

  Chọn câu bằng hằng `AFTER_CLOSURE_RECORDING_ON_DESK` (đang `false`). PR thêm nút 5B-1 (PR-B3 phía Desk, FE-A) bật hằng này và xóa khóa `_no_5b1`.

  `{status}` lấy nhãn `status.booking.*` ("Đã hủy", "Không đến").
- Áp ở mọi nơi dùng `useSubmit`: VietQR và "Ghi nhận đã thu" ở nhận phòng, trả phòng, hộp Xác nhận cọc, khối VietQR cọc (cả ở báo giá).
  - Câu chung "Đơn vừa chuyển sang…, tải lại" không còn hiện cho ca này.
  - 409 không có `reservationStatus` (máy chủ cũ) đi đường cũ.
- Hộp Xác nhận cọc:
  - Bấm xác nhận theo QR mà đơn đã đóng: QR có thể đã hết hạn cùng lúc đóng đơn (J1, B5, B10, B11 ở #105). Hộp **không** hiện "QR hết hạn, ghi như chuyển khoản tay".
    - Hộp hiện một câu 9.1a, bỏ khối QR và khóa nút chính. Không có lần bấm thứ hai sang B4.
    - Drawer phía sau đọc lại đơn.
  - Tạo VietQR mới mà đơn đã đóng: khối QR không hiện "Thử lại", không hiện nút tạo lại mã. Hộp khóa như trên, và câu chỉ hiện một lần.
- Mock theo máy chủ #105:
  - `createVietQr` trên đơn đóng → 409 có `currentState` = `reservationStatus` = trạng thái đơn. Lỗi này trả trước `PAYMENT_NOT_CONFIGURED` và mọi kiểm khác.
  - `confirm-received` → 409 có `currentState` của khoản thu và `reservationStatus` của đơn, trả trước kiểm trạng thái QR.
- Chuỗi: thêm 3 khóa 9.1a vào `gen_strings.py`, mỗi khóa một dòng. Đã sinh lại strings-vi/en.json, strings.js, strings-tables.md.

## 2. Kiểm
- vitest file mới `v5-48-closed-booking-fe3.test.tsx`, 6 ca:
  - chọn câu theo vai và theo 5B-1;
  - `rsvErrorText` cho 409 có và không có `reservationStatus`;
  - xác nhận QR sau J1, khi QR đã hết hạn cùng đơn;
  - tạo QR trên đơn Không đến;
  - máy chủ cũ (409 `expired` không có `reservationStatus`) vẫn hiện `dep.qr_expired`.
- Đột biến: cho `closedReservationStatus` luôn trả undefined thì 4/6 ca đỏ.
- admin-web toàn bộ: 1001 ca, 999 xanh. Hai ca `r3-bug-010-011-feb` đỏ vì hết giờ chờ khi máy chạy nặng; chạy riêng thì 6/6 xanh, và hai ca này không đi qua mã của PR.
- `tsc`, `eslint`, `prettier --check` xanh.
- E2E mới `product/tests/e2e/ui/v5-48-closed-booking.r5.spec.ts` (desk-chromium, stack thật, chạy trên CI):
  - qa.fd mở Xác nhận cọc trên giữ chỗ tạo từ báo giá; một tab khác hủy giữ chỗ (B5); qa.fd bấm Tạo VietQR.
  - Mong đợi: máy chủ trả 409 có `reservationStatus: cancelled`; hộp hiện câu 9.1a có "Đã hủy", không có câu "tải lại", không có "Thử lại"; nút chính khóa; folio không có khoản VietQR nào; axe 0 critical/serious.
  - Máy chủ kiểm đơn đóng trước `PAYMENT_NOT_CONFIGURED`, nên stack CI không cần tài khoản nhận.
  - Ở máy không có stack, chỉ chạy `tsc` và `eslint` cho ca này. QA đưa vào bộ v1.0.5.

## 3. Giả định và việc chuyển vai khác
- "5B-1 đã lên" nghĩa là nút ghi tiền về sau khi hủy đã có trên Desk. Desk chọn câu bằng hằng trong mã, không đọc cờ từ máy chủ. Hợp đồng không có cờ này, và nút cũng do Desk thêm.
- Vai có cả FD+ và sale thì nhận câu FD+.
- B4 `confirmDeposit` trên đơn đã hủy (nhập tay chuyển khoản, không qua QR) vẫn trả 409 `currentState` = trạng thái đơn, không có `reservationStatus`. Hộp giữ đường cũ: tải lại, đóng hộp, drawer báo "Đơn vừa chuyển sang Đã hủy".
  - UXD xem có muốn dùng câu 9.1a cho cả ca này không. Desk làm được không cần đổi hợp đồng (đọc `currentState` `cancelled`/`no_show` ở hộp Xác nhận cọc).
- FE-A (5B-1 Desk): bật `AFTER_CLOSURE_RECORDING_ON_DESK` và xóa `error.closed_booking_payment_no_5b1` cùng PR có nút.
