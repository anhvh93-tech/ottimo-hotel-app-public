# ARC review BE-B – Sửa lỗi tiền từ fuzz R3-Q30 (BUG-R3-002/003/004)

- Người review: ARC | Round 3 – Sprint 1, bước Phản hồi & sửa (review bắt buộc cho PR tiền) | Ngày: 24/10/2026
- Đối tượng: nhánh `be-b/r3-fuzz-bugs-002-004`, commit `eee4377` (worktree `agent-a4a7a7b47e3d900bf`); báo cáo `outputs/BE/s1-be-b.md` mục 11.
- Đối chiếu:
  - `rounds/round-03/qa/bug-list.md` BUG-R3-002/003/004;
  - `rounds/round-03/qa/s1-money-critic.md`;
  - DOM oracle mục 8 (I4, I8, I13, I16);
  - BR-433 (a)(d), BR-522 K11-06, BR-525;
  - OpenAPI 0.3.8 (`createRefundRequest`, `closed_reservation_credit`).

## Kết luận
**`eee4377` gộp được.** Không có Blocker.

Có **1 Major (FUZZ-01)**. Thẻ này không chặn gộp PR, vì PR này đã tốt hơn hẳn trước: trước kia folio bị đóng mà vẫn giữ tiền dư, không ai được báo. Nhưng FUZZ-01 phải sửa trước bản dùng thử v1.0. Ngoài ra có 2 Minor và 1 quyết định cho FZ-08.

**Đã chạy** (worktree tách riêng ở `eee4377`, PostgreSQL 17 riêng):
- `tsc`: đạt;
- toàn bộ api `vitest run`: **122 tệp đạt (2 bỏ qua), 3.120 test đạt (18 bỏ qua)**. Gồm 3 ca tái hiện `test/fuzz/bug-r3-00{2,3,4}` đã bỏ cờ `FUZZ_KNOWN_BUGS` và test oracle `r3-bug-002-credit-after-checkout`. Khớp báo cáo BE-B.
- ARC **không** chạy lại fuzz đầy đủ; dựa vào số chạy lại của BE-B (270 chuỗi, I4/I8/I13/I16 = 0, deadlock 0, 5xx 0). QA/critic xác nhận ở lượt fuzz kế tiếp (cổng G1).

**Xác nhận theo từng lỗi:**
- **BUG-R3-003**: định tuyến `debt_write_off` không bao giờ thấp hơn MGR. Σ ≤ cơ sở bảo vệ → manager; vượt, hoặc cơ sở `null` (`within(x, null)` = false) → owner. Đúng BR-525 + BR-433 (a).
  - Chỗ sửa nằm ở `ApprovalService.submit`, nên mọi đường gửi xóa nợ (`waiverLimitInput`) đều đi qua.
  - FOC thường với cơ sở thấp vẫn được chuyển lễ tân trưởng, đúng BR-433 (b).
- **BUG-R3-004**: `limitBasisVnd` = `null` khi không còn dòng đêm sống (`room` hoặc `late_fee_as_night`). Số chụp lúc B18 chỉ dùng để **hạ** cơ sở. Đúng thiết kế BR-433 (d) ARC đã ghi ("sau B18 thêm min với số chụp"); trước đây trả về số chụp là lệch thiết kế.
  - Lưu ý: nếu còn dòng `late_fee_as_night` sống thì cơ sở = khoản đó. Đúng định nghĩa DOM (phụ thu thay đêm tính như một đêm).
- **BUG-R3-002**:
  - A32 giảm trên folio `settled` mà để lại tiền dư thì gọi `closeStayCredit` trong cùng giao dịch, dưới L3. `refundPlan` bù trừ với các yêu cầu hoàn đang mở. Người xin = MGR+ vừa thao tác; người duyệt phải là MGR/OWN khác (SEC F8).
  - J15 không đóng folio còn tiền dư chưa có yêu cầu hoàn: trả `waiting_refund` và mở "Cần chú ý" `closed_reservation_credit` (có dedupe).
  - Lúc chi hoàn, số chi vẫn bị kẹp theo tiền dư thật (`refunds.service`: `min(left, rawCreditVnd)`), nên không chi quá dù yêu cầu cũ lớn hơn.

## Thẻ feedback

### FB-R3-ARC-FUZZ-01
- Mức độ: Major (sửa trước bản dùng thử v1.0; không chặn gộp PR này)
- Vị trí:
  - `folio.service.ts` `closeAfterWindow` (nhánh mới `unhandledCreditVnd > 0` → `waiting_refund`);
  - `payments/internal/refunds.service.ts` `create` (`folio.status !== 'open'` → `FOLIO_LOCKED`);
  - OpenAPI `createRefundRequest` ("Folio `open`").
- Vấn đề: lưới an toàn của J15 giữ folio ở `settled` chờ một yêu cầu hoàn, nhưng **không đường nào tạo được yêu cầu đó** cho folio `settled`:
  - `createRefundRequest` chỉ nhận folio `open`;
  - J15 không tự tạo được vì `requested_by` phải là người thật;
  - mục `closed_reservation_credit` chỉ tự đóng khi "chi hoàn đủ hoặc khách để lại tiền", mà cả hai đều cần có yêu cầu hoàn trước.

  Hệ quả: folio nằm `settled` mãi, J15 thử lại mỗi giờ, "Cần chú ý" không bao giờ đóng.

  Các đường tạo tiền dư trên folio đã trả phòng mà không qua A32 (nên không có yêu cầu hoàn tự động):
  - khoản chuyển khoản VietQR về muộn lớn hơn số còn phải thu (`confirmPaymentReceived` nhánh vượt có `note`, 0.3.7 bổ sung 4);
  - khách trả qua link dư;
  - đồng bộ `ota_collect`.
- Vì sao quan trọng: đây đúng là ca I4 mà fuzz bắt (tiền của khách nằm trên folio không ai xử lý). Bản sửa hiện chuyển ca này từ "mất dấu" thành "kẹt có báo", nhưng nhân viên vẫn không làm được gì trên Desk.
- Đề xuất sửa (quyết định ARC; hợp đồng do ARC ghi ở đợt 0.3.8 bổ sung kế tiếp khi ORC giao):
  1. **Hợp đồng**: `createRefundRequest` nhận folio `open` **hoặc `settled`**. `closed` vẫn 409 `FOLIO_LOCKED`. Folio `closed` có tiền dư không còn xảy ra sau I4. Trần và người duyệt như cũ (BR-522).
  2. **Nguyên tắc K11-06 ở một chỗ**: mọi đường ghi tiền trên folio `settled` mà làm tiền dư chưa có yêu cầu hoàn > 0 thì gọi `closeStayCredit` trong cùng giao dịch, người xin = người thao tác. Gồm A32 (đã làm), `recordPayment`, `confirmPaymentReceived` do người bấm. Đường **hệ thống** (đối soát tự động, `ota_collect`) không có người xin, nên dựa vào lưới J15 + điểm 1.
  3. Test: chuyển khoản muộn dư sau trả phòng → có "Cần chú ý" → MGR tạo yêu cầu hoàn trên folio `settled` → duyệt, chi → J15 đóng. Fuzz thêm thao tác "QR về muộn dư" vào họ có trả phòng.
- Trạng thái: Open

### FB-R3-ARC-FUZZ-02
- Mức độ: Minor
- Vị trí: `folio-lines.service.ts` (khối BUG-R3-002 chỉ chạy khi `unhandledCreditVnd > 0`)
- Vấn đề: K11-06 viết "mọi thay đổi folio … chạy lại `refundPlan`". Mã chỉ chạy lại khi tiền dư **tăng** vượt phần đã yêu cầu. Trường hợp A32 **tăng** (hoặc phát sinh sau trả phòng) làm tiền dư **giảm** dưới yêu cầu hoàn đang chờ, `refundPlan` không chạy: yêu cầu cũ vẫn lớn hơn tiền dư thật. Tiền không sai, vì lúc chi đã kẹp theo `rawCreditVnd`, nhưng người duyệt thấy số sai.
- Đề xuất sửa: gọi `closeStayCredit` (hoặc chỉ `refundPlan`) cả khi `openRefundVnd > rawCreditVnd` sau thao tác (hủy/tạo lại theo DOM-S4-14). Gộp vào cùng điểm 2 của FUZZ-01.
- Trạng thái: Open

### FB-R3-ARC-FUZZ-03
- Mức độ: Minor
- Vị trí: `approval.service.ts` – hằng `DEBT_WRITE_OFF_REASON` khai thêm trong module `approvals`, còn folio có `DEBT_WRITE_OFF` riêng
- Vấn đề: hai hằng cùng giá trị ở hai module là mầm lệch tên (đúng lớp lỗi "hai định nghĩa").
- Đề xuất sửa: một hằng ở `approvals/public` (approvals sở hữu danh mục mã lý do, `FOC_REASON_CODES`); folio import hằng đó. Ngoài ra chú thích JSDoc `Reason codes of BR-432` hiện đứng trên hằng mới thay vì trên `FOC_REASON_CODES` – đổi chỗ lại.
- Trạng thái: Open

## Quyết định về phát hiện FZ-08 (nợ ghi trước 0076 "sống lại" sau khi xóa nợ bị hủy)
- **ARC: không sửa ở Sprint 1, mức P3, điều kiện kèm theo giữ nguyên** (OPS C2: staging và production dựng từ DB trống, không có nợ trước 0076 ngoài demo/QA). Đây là giới hạn đã biết của công thức suy ngược W_cũ (s1-contracts 5.2): công thức không biết R, D của nợ cũ.
- Nếu DOM chốt "nợ cũ sống lại khi khoản xóa nợ bị hủy" thì cách sửa đúng là **tạo chu kỳ cho nợ cũ ngay lần xóa nợ đầu tiên**. Dùng cùng nhánh `legacy` của `writeDebt`: `recorded` = X, `base` = Σ giảm trước lần xóa. Sau đó mọi phép tính đi theo R − D như nợ mới. Rẻ và không thêm định nghĩa.
- QA gắn FZ-08 nhãn "đã biết – dữ liệu trước 0076". Cổng G1 không tính các vi phạm của họ này, với điều kiện fuzz ghi rõ seed và họ.

## Điểm làm tốt
- Sửa đúng gốc ở chỗ dùng chung: định tuyến trong `ApprovalService`, cơ sở trong `limitBasisVnd`. Không thêm định nghĩa thứ hai.
- Ca tái hiện của QA được chuyển thành test luôn chạy. Có thêm test oracle cho cả hai nhánh của BUG-R3-002.
- Báo cáo nêu rõ vi phạm fuzz còn lại kèm seed, phạm vi và đề xuất mức, không giấu.
