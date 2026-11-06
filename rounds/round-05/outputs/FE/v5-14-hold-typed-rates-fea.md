# FE-A – V5-14: giữ chỗ theo đúng giá đã gõ (Desk H09)

- Round 5, bước Sản xuất · FE-A · 07/11/2026
- Nguồn: ORC giao từ BE PR #103 (`r5-s1`, chưa gộp); hợp đồng 0.3.13 mục 1.3 và 1.17; ghi chú ARC review #103 mục 6 do ORC chuyển. Theo đó, `hold()` lấy cờ `edited` từ trạng thái ô giá. Ở báo giá, vắng `edited` nghĩa là "không sửa" (khác B1), và máy chủ tính đêm không sửa theo giá lịch.
- Nhánh `r5-fe-v5-14` cắt từ `origin/main` `ba2dc355`. Thân PR ghi "gộp sau #103".

## 1. Việc đã làm (`apps/admin-web/src/pages/booking/BookingDialog.tsx`)
- **Giá gõ đi vào báo giá (`QuoteInput.nightlyRates`)**:
  - đủ mọi đêm của lượt, mỗi đêm có `edited` lấy từ ô (`ratesEdited`) và luôn gửi rõ `true` hoặc `false`;
  - đêm không sửa vẫn gửi số đang có trong ô (máy chủ bỏ qua số này nhưng vẫn đòi > 0);
  - chỉ gửi khi có ít nhất một ô đã gõ (kênh Trực tiếp hoặc CTV). Không gõ thì không gửi, máy chủ tính cả lượt như cũ.
- **Bản xem giá (`calculateQuote`)** nhận cùng các đêm đó khi mọi ô đã có số. Vì vậy tổng tiền và dòng "Cọc cần thu" trên hộp là số máy chủ tính theo giá gõ, có bậc BR-107, đúng oracle T14-7. Trước đây hộp hiện cọc theo giá lịch.
- **`hold()`**:
  - `saveQuote` mang `nightlyRates` như trên; `createHoldFromQuote` không mang trường giá nào;
  - bỏ khóa nút của v1.0.4: `aria-disabled`, dòng `booking.hold.typed_rate_locked` và `aria-describedby`;
  - bỏ vòng xóa lỗi `rates` / `nightlyRates[i]` (PR75-02). Ô giá nay được kiểm như khi "Tạo đơn": ô đã gõ rồi xóa trống thì chặn với câu "Nhập giá mỗi đêm".
- **Ô giá chỉ đọc khi lệnh giữ chỗ hoặc tạo đơn đang chạy** (plan V5-14).
- **422 `RATE_OUT_OF_RANGE` cấp trên** (V5-22: `dates[]`, `min`, `max`):
  - ở bản xem có giá gõ, ở `saveQuote` và ở `createReservation`, câu hiện ngay dưới đúng ô của đêm ngoài sàn–trần;
  - ở bản xem, bản cũ vẫn giữ trên màn, và câu tự mất khi bản xem kế tiếp qua;
  - câu dùng chung hàm `rangeSentence` với nhánh `VALIDATION_FAILED` có sẵn. Chữ (số định dạng, tên nhóm) là việc của V5-22.

## 2. Mock (`apps/admin-web/src/mocks/reservations.ts`), theo `quote-pricing.ts` của #103
- `calculate()` nhận `nightlyRates`:
  - chỉ FD+ (403), chỉ kênh `direct`/`agent` (`channelId` `NOT_IN_LIST`);
  - lỗi theo thứ tự: `DATE_INVALID`, `AMOUNT_NOT_POSITIVE`, `REQUIRED`;
  - đêm `edited = true` lấy giá gõ làm giá lịch rồi áp bậc BR-107; đêm khác giữ giá lịch;
  - ngoài 300.000–3.000.000 → 422 `RATE_OUT_OF_RANGE` kèm `dates`, `min`, `max`.
- `create-hold`:
  - có trường giá trong thân lệnh → 422 `NOT_ALLOWED` từng trường;
  - đơn giữ chỗ lấy giá lịch đã chụp trong báo giá. Trước đây mock áp bậc BR-107 hai lần cho lượt từ 7 đêm.

## 3. Test
- Vitest `v5-14-hold-typed-rates-fea.test.tsx` thay `v104-hold-typed-rate-lock.test.tsx` (ca khóa nút đã bỏ):
  - Trực tiếp và CTV, gõ một đêm:
    - không khóa nút;
    - bản xem và báo giá mang `[{edited:true}, {edited:false, số lịch}]`;
    - `createHoldFromQuote` không có giá;
    - cọc của đơn giữ chỗ = cọc trên hộp (T14-6 trên mock).
  - Không gõ: báo giá không có `nightlyRates`.
  - Ô gõ rồi xóa: giữ chỗ bị chặn với câu "Nhập giá mỗi đêm", không gửi báo giá.
  - Giá ngoài sàn–trần: câu ở đúng ô khi xem giá và khi giữ chỗ; không tạo đơn; sửa lại thì câu mất.
  - Ô giá chỉ đọc khi giữ chỗ đang chạy.
- E2E `tests/e2e/ui-clock/v5-14-hold-typed-rate.r5.spec.ts` (T14-6, desk-clock, ngày ảo riêng):
  - H09 Trực tiếp 2 đêm từ ngày mai, gõ đêm đầu = giá lịch + 50.000;
  - bản xem và `saveQuote` mang `nightlyRates` đúng cờ;
  - `createHoldFromQuote` không mang giá;
  - `depositRequiredVnd` của đơn giữ chỗ = "Cọc cần thu" trên hộp;
  - đêm đầu của đơn = giá gõ.
  - **Khi máy chủ chưa có #103**, bản xem bỏ qua giá gõ nên ca **bỏ qua** và ghi rõ lý do. Sau khi #103 gộp, cần merge main vào nhánh để CI chạy thật.
- Kiểm: vitest admin-web 994/994; `tsc` (admin-web, tests); `eslint`; `prettier`. Không sửa `openapi.yaml` hay tệp sinh: `QuoteInput.nightlyRates` đã có trong hợp đồng trên `main`.

## 4. Việc cần vai khác (không ESC)
- **UXD**: khóa `booking.hold.typed_rate_locked` nay không còn dùng. Ghi chú của khóa ghi "Bỏ khi Q1 nhận giá thỏa thuận (v1.0.5)". FE để UXD gỡ khỏi `gen_strings.py`, cùng chỗ nhắc khóa này trong ghi chú `bk.src_typed`.
- **BA / DOM**: bỏ cách làm tạm ở DOM điểm 3 và sổ tay 2.5 bước 10 (Tạo đơn thay Giữ chỗ, hoặc xóa giá rồi Điều chỉnh ở Folio), như hợp đồng 1.3.
- **QA**: chạy T14-6 trên CI sau khi #103 gộp; trước đó ca bỏ qua có chủ đích.

## 5. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - bản xem gửi giá gõ chỉ khi mọi ô đã có số. Nếu chưa đủ, bản xem theo lịch điền ô trước, rồi bản xem có giá gõ chạy tiếp;
  - nút "Tạo đơn" và "Giữ chỗ" không chờ bản xem có giá gõ (chỉ chờ bản xem của lượt, như cũ). Máy chủ vẫn tính cọc của đơn giữ chỗ từ giá gõ.
