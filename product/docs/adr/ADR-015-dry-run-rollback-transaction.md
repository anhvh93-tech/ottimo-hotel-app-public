# ADR-015 – Tính thử (`dryRun`) cho thao tác tính và ghi xen kẽ: giao dịch luôn ROLLBACK

- Trạng thái: **Đề xuất** (chờ review bắt buộc BE, SEC) | Người quyết: ARC | Ngày: 27/10/2026 | Round 3 – Phản hồi & sửa, bản vá v1.0.1 (04/11)
- Liên quan: OpenAPI 0.3.9 (`earlyDeparture`), US-135, US-137, FB-R3-DOM-BA-02 (Blocker), SEC A3 (0.3.6 – `setLateCheckout` `dryRun` readOnly), SEC-BE-21 (fail-closed `dryRun`), ADR-009 (idempotency), `rounds/round-03/outputs/ARC/contract-v1.0.1.md`.

## 1. Bối cảnh
- Hợp đồng hứa "hủy đơn, trả sớm, đặt trả muộn hỗ trợ `dryRun`" (US-135: hộp xác nhận phải nêu hậu quả tiền **trước** thao tác không đảo ngược). B16 trả sớm chưa có `dryRun`; FE-A dừng vì không được tự tính tiền ở client.
- Mẫu hiện có: `setLateCheckout`, `addPartyMember` tính thử trong giao dịch **readOnly** (`read()`, SEC A3); `cancelReservation`, `changeRoom` dùng một hàm tính chung.
- B16 khác: hàm `StayService.earlyDeparture` **ghi rồi mới tính được** – giải phóng occupancy, void đêm, `resyncStay` folio (gồm đồng bộ `ota_collect` của đơn OTA trả trước), đảo chênh lệch đổi phòng, ghi dòng phí, **sau đó** mới đọc `unhandledCreditVnd` để trần số hoàn. Không chạy được trong giao dịch readOnly. Viết lại phần tính bằng công thức riêng thì dễ lệch với lần ghi thật (đúng loại lỗi tiền đã gặp ở R3: BUG-R3-012/013/014).

## 2. Quyết định
1. Với thao tác có tính và ghi xen kẽ (hiện chỉ B16), tính thử chạy **chính hàm ghi** trong một giao dịch **luôn ROLLBACK** (`uow.simulate` hoặc tương đương):
   - cùng ngữ cảnh tenant/RLS, cùng thứ tự khóa (đơn → căn → folio, K11-01), `lock_timeout` ngắn;
   - **không** đi qua `idempotency_key`, không cần `If-Match` (như mọi `dryRun`);
   - `ROLLBACK` trong `finally`, kể cả khi thành công; không bao giờ `COMMIT`.
2. Trong chế độ dry, hàm bỏ các bước có tác dụng **ngoài** giao dịch hoặc tiêu sequence: tạo yêu cầu duyệt (`approvals.submit` – mã yêu cầu), gắn tệp, audit. Thông báo SSE (`pg_notify`) và outbox nằm trong giao dịch nên tự mất khi rollback. Bước nào gọi ra ngoài tiến trình (HTTP, email, file) trong đường đi của hàm thì phải tách trước khi dùng mẫu này.
3. Kết quả trả về: số tính được + đơn **đang lưu** (đọc lại sau rollback hoặc chụp trước khi ghi) để `version` dùng cho `If-Match` lần ghi.
4. Lần ghi thật nhận số client đã hiện (`expectedRefundVnd`, `expectedFeeVnd`); server tính lại trong giao dịch ghi, lệch → `409 AMOUNT_CHANGED`, không ghi gì.
5. Thao tác chỉ đọc mà tính được (setLateCheckout, addPartyMember…) **giữ** giao dịch readOnly (SEC A3) – mẫu rollback chỉ dùng khi readOnly không làm được.
6. Fail-closed (SEC-BE-21): khai `dryRun` trong hợp đồng làm guard bỏ hai header; handler chưa cài nhánh tính thử phải từ chối `dryRun: true` (422 `NOT_ALLOWED`). 0.3.9 thêm chốt này vào controller B16 cho tới khi BE-A cài.

## 3. Phương án đã cân nhắc
- **A. Giao dịch luôn ROLLBACK (chọn)** – một hàm, số tính thử = số ghi theo cấu tạo. Nhược: giữ khóa dòng đơn/căn/folio vài chục ms khi tính thử; chạy các câu ghi rồi bỏ (tốn hơn readOnly, chấp nhận được với 10 căn).
- **B. Tách hàm tính chỉ đọc** (`planEarlyDeparture`) – đúng tinh thần SEC A3. Nhược: phải mô phỏng `resyncStay` và đồng bộ `ota_collect` để ra số dư sau thay đổi; hai đường tính, dễ lệch. Cho phép BE-A chọn nếu chứng minh bằng test so hai đường trên đủ oracle.
- **C. SAVEPOINT trong `uow.run` rồi `ROLLBACK TO SAVEPOINT`** – vẫn mở giao dịch ghi có idempotency; dễ lỡ COMMIT phần ngoài savepoint. Bỏ.
- **D. Client tự tính** – vi phạm "không tính tiền ở client". Bỏ.

## 4. Hệ quả
- Tốt: hộp xác nhận B16 hiện đúng số sẽ ghi; không có công thức thứ hai.
- Phải chấp nhận: tính thử B16 khóa dòng ngắn; mỗi bước có tác dụng ngoài giao dịch thêm vào `earlyDeparture` sau này phải có nhánh dry (test "tính thử không để lại gì" bắt lỗi này).
- Test bắt buộc (BE-A): (1) đếm dòng `reservation_change`, `stay_night` (trạng thái), `folio_line`, `approval_request`, `audit_event`, `idempotency_key`, outbox trước/sau `dryRun` – không đổi; `reservation.version` không đổi; (2) cùng dữ liệu: `dryRun` và lần ghi cho cùng số trên oracle BR-428-01…06; (3) lệch số → 409, không ghi; (4) chốt fail-closed bị gỡ đúng lúc cài.

## 5. Điều kiện xem lại
- Thêm thao tác thứ hai cần mẫu này → gom `uow.simulate` thành tiện ích chung có test kiến trúc (giống `parameters-delete-architecture.test.ts`).
- Đo p95 tính thử B16 > 300 ms trên staging → xem lại phương án B.
