# SEC – Phản hồi thẻ gửi SEC, Round 5

- Người trả lời: SEC. Ngày: 06/11/2026 (khuya).
- Thẻ nhận, từ `rounds/round-05/reviews/BE-on-contract-0.3.13.md` mục 7:
  - `FB-R5-BE-ARC-C0313-22`: gửi ARC; ORC nhờ SEC xác nhận phần S6;
  - `FB-R5-BE-ARC-C0313-23`: gửi ARC và SEC.
- Căn cứ:
  - `rounds/round-05/reviews/SEC-on-bug-r5-002.md` mục S6, S8;
  - `SEC-on-contract-0.3.13.md` mục 5;
  - `product/docs/security/security-requirements.md` mục 13 (SR-RL).
- Đã sửa: `security-requirements.md`, thêm **SR-RL-10** (luật chốt cho C0313-23).

| ID | Trạng thái (phần SEC) | Tóm tắt |
|---|---|---|
| FB-R5-BE-ARC-C0313-22 (Minor) | Done – SEC xác nhận có điều kiện | `afterClosure` tính lúc đọc **đủ để hiển thị**. **Không đủ cho bộ lọc tuần S6**: bộ lọc phải đọc giá trị audit ghi lúc ghi, nên ý 3 của BE (allowlist + test) là **bắt buộc**. Chi tiết ở mục 1 |
| FB-R5-BE-ARC-C0313-23 (Suggestion) | Done – SEC chốt luật SR-RL-10 | Mỗi lần so đều đếm, kể cả khi không trùng. Bộ đếm lưu ở PostgreSQL theo người gọi, tách khỏi khóa đăng nhập. Tối đa 5 lần trong 24 giờ; quá ngưỡng thì bỏ qua phép so. Bộ đếm và audit `security` commit trước khi trả 422. Chi tiết ở mục 2 |

**Tổng: 2 thẻ, 2 Done (phần SEC), 0 Rejected, 0 Deferred, 0 Escalated.** Cả hai không đổi kiểu sinh: không thêm mã lỗi, không thêm 429. ARC ghi chữ vào hợp đồng trong delta tài liệu tới; BE làm trong PR V5-48 (thẻ 22) và PR V5-58 (thẻ 23). Thẻ vẫn Open ở phía ARC/BE cho tới khi có chữ và test.

---

## 1. C0313-22 – `afterClosure` tính lúc đọc có đủ cho S6 không

S6 có hai nửa:
- (a) **hiển thị** cờ trên màn duyệt hoàn và Nhật ký tiền;
- (b) **bộ lọc tuần** `listAuditEvents.afterClosureOnly`. Bộ lọc này là kiểm soát phát hiện duy nhất của OWN cho đường này, cho tới v1.0.6.

### 1.1 Đồng ý cho (a)

BE đề xuất tính `Payment.afterClosure` lúc đọc. SEC đồng ý, với 2 điều kiện:
- So bằng **`payment.created_at` do server ghi** với `cancelled_at`/`no_show_marked_at`. Không so bằng ngày nhận tiền mà người dùng nhập. Nếu so bằng ngày người dùng nhập, khoản thu muộn có thể ghi lùi ngày về trước lúc hủy để trông như bình thường.
- `Payment.afterClosure` **chỉ để hiển thị**. Các quyết định lúc ghi **không** đọc trường này:
  - V5-48: 422/409, luôn `pending`;
  - 5B-1: hoàn tự tạo, nơi nhận cố định;
  - S5.
  Các quyết định đó đọc trạng thái đơn dưới khóa đơn, trong cùng giao dịch, như `payments.service.ts` đang làm ở `record`.

### 1.2 Không đủ cho (b), nên ý 3 của BE là bắt buộc

- Đơn có thể được khôi phục sau đó: B12 no-show ở v1.0.5, 5B-2 từ 0.3.14. Khi đó cờ tính lúc đọc thành `false`.
- Nếu bộ lọc tuần tính lúc đọc, chuỗi "hủy → ghi khoản thu muộn → khôi phục" sẽ **xóa dấu vết khỏi bộ lọc**. Đây đúng là chuỗi S6 cần cho OWN thấy.
- Vì vậy:
  1. `afterClosureOnly` lọc theo **`after.afterClosure = true` trong `audit_event`**, tức giá trị ghi lúc ghi. Không tính lại từ trạng thái đơn hiện tại.
  2. Allowlist audit thêm khóa, như BE ý 3:
     - `payment`: `afterClosure`, `reservationStatus`;
     - `deposit_notice`: `afterClosure`.
  3. Mục `deposit_after_cancel`/`payment_after_cancel` đóng bằng "Không thấy tiền" (S8) cũng phải hiện trong bộ lọc tuần. Audit của `resolveAttentionEvent` cho các mục này mang `afterClosure: true`, và khóa này có trong allowlist của thực thể tương ứng. Nếu ARC muốn, có thể thay bằng: bộ lọc nhận theo loại mục; khi đó ghi rõ điều này trong mô tả `afterClosureOnly`.
  4. Không khóa nào chứa dữ liệu khách: chỉ cờ, trạng thái đơn, mã.

### 1.3 Test bắt buộc (BE, PR V5-48; QA dẫn vào ca)

- Đọc lại `audit_event`: thấy `after.afterClosure = true` và `after.reservationStatus`. Phải đọc từ bảng, không chỉ kiểm phản hồi API. Thẻ 04 và 10 đã cho thấy kiểm phản hồi API là chưa đủ.
- `afterClosureOnly` trả **đúng một dòng** cho ca h1 của QA.
- **Ca khôi phục**: hủy → ghi khoản thu muộn → khôi phục no-show (B12). Sau đó `Payment.afterClosure` đọc `false`, nhưng `afterClosureOnly` **vẫn trả dòng đó**. Khi có 5B-2 (0.3.14), lặp lại ca này với `restoreHold`.
- Mục đóng bằng "Không thấy tiền" có trong bộ lọc tuần, kèm người bấm và giờ bấm (S8).

### 1.4 `refundRequestId` (ý 2 của BE)

- SEC thích phương án "chưa trả tới 0.3.14", vì ít bề mặt hơn.
- Nếu ARC muốn trả ngay ở v1.0.5, đọc từ audit `payment.recorded`, thì SEC cũng không phản đối. Điều kiện: chỉ trả khi người đọc đã thấy được yêu cầu hoàn đó theo phạm vi hiện có. Đây chỉ là mã, không có dữ liệu khách.

---

## 2. C0313-23 – phép so mật khẩu người gọi ở `setPropertyWifi`

### 2.1 Rủi ro

BE nêu đúng. Người cầm một **phiên** OWN/MGR bị lộ mà không biết mật khẩu vẫn dò được mật khẩu của chủ phiên:
- gửi mật khẩu Wi-Fi đoán thử;
- nhận 422 `NOT_ALLOWED` nghĩa là đoán đúng;
- đoán sai thì Wi-Fi bị ghi đè; GET trả mật khẩu cũ nên kẻ dò ghi trả lại được.

Như vậy phiên lộ thành mật khẩu lộ, và mật khẩu đó có thể đang dùng ở nơi khác. Giới hạn chung 600 lượt/phút/người (SR-RL-09) không đủ chặn kiểu dò này.

### 2.2 SEC chọn

Phương án (b) của BE, với 3 chỉnh:
- đếm cả lần so không trùng;
- bộ đếm lưu ở PostgreSQL;
- bộ đếm commit riêng.

Luật được ghi thành **SR-RL-10**:

1. **Mỗi lần so đều đếm**, dù trùng hay không. Với kẻ dò, "không trùng" là kết quả thường gặp; chỉ đếm lần trùng thì không chặn được gì.
   - Chỉ so (và đếm) khi `password` đã qua kiểm dạng (8–63 ký tự ASCII in được) và khác mật khẩu Wi-Fi đang lưu.
   - Mạng mở (chuỗi rỗng), hoặc chỉ đổi `ssid`: không so, không đếm.
2. **Ngưỡng**: 5 lần so trong 24 giờ, theo người gọi (`user_id`). Cửa sổ cố định được.
   - Bộ đếm lưu ở **PostgreSQL**, cập nhật nguyên tử. Lý do: đây là bộ đếm xác thực theo người dùng (SR-RL mục 13, "bắt buộc PostgreSQL"). Bộ đếm RAM sẽ reset mỗi lần deploy.
   - Dùng cùng nơi lưu với bộ đếm xác nhận lại (SR-RL-02), nhưng **khóa đếm riêng**.
   - **Không** cộng vào `login_lockout`, **không** khóa tài khoản. Nếu cộng vào, một phiên bị lộ có thể khóa chủ tài khoản ra ngoài.
3. **Trong ngưỡng**: so như hợp đồng hiện tại (một lần argon2 verify trên hash của người gọi).
   - Trùng → 422 `NOT_ALLOWED` (`field` = `password`). Ghi thêm audit `security` `property.wifi_password_matches_login`, không có giá trị.
   - Không trùng → lưu như thường.
4. **Quá ngưỡng**: bỏ qua phép so, các luật khác vẫn áp, và lưu như thường.
   - Ghi audit `security` `property.wifi_password_check_skipped` một lần mỗi cửa sổ, không có giá trị.
   - Phản hồi giống hệt bình thường: không 429, không mã mới, không đổi kiểu sinh.
   - Người dùng thật đổi Wi-Fi quá 5 lần một ngày rất hiếm. Cái giá là có thể lọt một lần dùng trùng mật khẩu đăng nhập, chấp nhận được.
5. **Bộ đếm và audit `security` ghi ở giao dịch riêng, commit trước khi trả 422**, giống bộ đếm sai đăng nhập. Nếu ghi chung giao dịch của PUT, 422 làm rollback và mất cả bộ đếm lẫn audit của lần đoán trúng.
6. Không ghi mật khẩu (Wi-Fi hay đăng nhập) vào audit, log, thông báo hay phản hồi, như hợp đồng 1.23 đã ghi.

### 2.3 Test bắt buộc (BE, PR V5-58; QA dẫn vào ca)

- Lần so thứ 6 trong cửa sổ bị bỏ qua: PUT bằng chính mật khẩu đăng nhập của người gọi trả 200, và có audit `property.wifi_password_check_skipped`.
- Bộ đếm còn nguyên sau khi khởi động lại API (vì lưu ở PostgreSQL).
- Lần so trùng: trả 422. Audit `property.wifi_password_matches_login` và bộ đếm vẫn còn trong DB sau khi request bị rollback.
- Bộ đếm `login_lockout` của người gọi không đổi; tài khoản không bị khóa.
- Chỉ đổi `ssid`, hoặc mạng mở: không tăng bộ đếm.
- Không có chuỗi mật khẩu thử nào xuất hiện trong audit, log hay phản hồi.
