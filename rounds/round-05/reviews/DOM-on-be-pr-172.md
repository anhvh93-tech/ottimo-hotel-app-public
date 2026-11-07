# DOM review – BE PR #172 (V5-17: `is_complimentary` đi theo tiền, tính lại trước báo cáo ADR đầu tiên)

- Round 5 (v1.0.5) · Bước: Review · DOM · 07/11/2026
- PR #172, nhánh `r5-v5-17` @ `1a848c2a` (mã ở `6b722149`). Báo cáo: `rounds/round-05/outputs/BE/v5-17.md`.
- DOM đọc: migration `0097_complimentary_follows_revenue.sql` (hàm `reservation_is_complimentary`, hai trigger), diff `lease-nights.ts`, ràng buộc `stay_night_void_check` (8 lý do `void_reason`) ở `schema/reservations.ts`. Đối chiếu BR-904 v0.5.5, BR-105 (4), BR-421, BR-431…434, `metrics-definitions.md` Q-05, Q-10, Q-12. DOM không chạy test.
- Phạm vi DOM: luật nghiệp vụ (cờ đêm, cờ đơn, các giả định 1–4 của BE). Migration, khóa, RLS, M4d là việc ARC, SEC, OPS.
- Không có dữ liệu khách thật, không có số hoa hồng.

## 0. Kết luận

**DUYỆT về nghiệp vụ.** Luật trong PR đúng BR-904 v0.5.5. DOM xác nhận cả 4 giả định của BE. Không cần DATA định nghĩa lại Q-05, chỉ cần DATA sửa chữ (thẻ 172-01). Không ESC.

Gộp còn chờ CI: `gitleaks` đỏ ở `1a848c2a` (cùng đỏ ở #171), job test đang chạy. Không phải việc của DOM.

## 1. Luật đêm: `is_complimentary = (room_revenue_vnd = 0)` – đúng

Đây đúng cách ngành gọi "phòng miễn phí" (complimentary): đêm có khách mà tiền phòng bằng 0, không kể kênh. Đêm đó vào công suất, không vào ADR (USALI; Q-05 đã chốt).

| Ca | Cờ đêm theo PR | DOM |
|---|---|---|
| Nội bộ để trống mọi đêm (0 đ) | `true` | Đúng BR-105 (1) |
| Nội bộ có thu 300.000/đêm | `false` | Đúng BR-904 v0.5.5: đêm bán có thu, vào ADR |
| Nội bộ có thu, quản lý A31 đưa một đêm về 0 | đêm đó `true`, đơn `false` | Đúng ví dụ BR-105 (4): 2 đêm bán có thu (+600.000), 1 đêm miễn phí |
| FOC 100 % dòng `room` một đêm (BR-431) | `true` | Đúng Q-05 |
| FOC hay giảm một phần | `false` | Đúng: đêm vẫn bán, ADR lấy tiền sau giảm |
| Đảo hoặc từ chối FOC | theo tiền sau đảo | Đúng "trả lại giá trị trước đó" |
| Nội bộ 0 đ có khách vượt định mức trả phụ thu người 150.000 (BR-110) | `true` | Đúng: phụ thu người là doanh thu khác (BR-904), không biến đêm thành đêm bán |
| Đêm thuê dài hạn | `false` (tiền phân bổ Q-10 luôn > 0) | Đúng |

Ví dụ số (tháng giả định): 200 đêm bán có thu, doanh thu phòng 170.000.000; thêm 3 đêm Nội bộ có thu 300.000 và 2 đêm FOC 100 %. Trước V5-17 (cờ theo kênh): 3 đêm có thu bị đếm là miễn phí, ADR = 170.000.000 ÷ 200 = 850.000, thiếu 900.000 doanh thu và 3 đêm. Sau V5-17: ADR = 170.900.000 ÷ 203 = 841.872; 2 đêm FOC vào công suất, không vào ADR.

## 2. Luật đơn và 4 giả định của BE – DOM xác nhận

**Giả định 1 – đơn đã đóng tính theo các đêm đóng cùng (bỏ đêm `date_change`): đúng.**
- Đơn hủy, no-show, hết hạn giữ chỗ, dời khách, kênh hủy không còn đêm sống. Lấy Σ đêm sống thì mọi đơn đã hủy thành "miễn phí", sai hẳn.
- Hủy không chuyển tiền phòng. Nên "đóng đơn không bao giờ đổi cờ" là đúng nghĩa: đơn Trực tiếp hủy vẫn là đơn có thu (để tính tỷ lệ hủy theo đơn bán), đơn Nội bộ 0 đ hủy vẫn là đơn miễn phí (tách khỏi tỷ lệ hủy của đơn bán, nếu DATA cần).
- Bỏ đêm `date_change`: đúng, đó là đêm của ngày cũ, đơn không đóng cùng chúng.
- DOM rà 8 lý do của `stay_night_void_check`: `early_departure` và `lease_terminated` chỉ xảy ra khi đơn còn đêm đã ở (đêm sống), nên nhánh "đơn đóng" gần như không gặp chúng. Có gặp (đơn dài hạn kết thúc trước đêm đầu) thì vẫn đúng: đêm đóng cùng mang tiền đã định.
- No-show của đơn Trực tiếp có phí giữ lại: phí đó là dòng folio, doanh thu khác (BR-904), không chạm đêm. Cờ đơn theo tiền đêm đã định (> 0) → `false`. Đúng.

**Giả định 2 – đơn chưa có đêm (dài hạn nhập tay trước khi sinh đêm thuê) = `false`: đúng.**
- Đơn dài hạn luôn có tiền thuê. Chưa có đêm chỉ là chưa phân bổ. Khi đêm thuê được ghi, trigger AFTER INSERT tính lại.
- Hợp đồng thuê tháng 0 đ không có trong luật OTTIMO. Nếu có (người nhà ở dài hạn miễn phí), đêm phân bổ 0 đ → `true` theo đúng luật tiền. Không cần ca riêng.

**Giả định 3 – giảm cho cả nhóm/cả đơn không chạm `stay_night`: chấp nhận cho v1.0.5, kèm một luật quầy.**
- Q-05 đã ghi luật đích: giảm cho cả đơn (không gắn đêm) phải phân bổ xuống đêm theo tỷ lệ (Q-12). Hôm nay chưa có đường nào ghi loại giảm này xuống đêm, nên cờ chỉ phản ánh tiền ở mức đêm, và ADR có thể cao hơn thật ở đơn có giảm cả đơn.
- Với OTTIMO (10 căn, đoàn hiếm) ca này nhỏ. Luật quầy giữ như sổ tay: muốn **miễn cả đơn** thì tạo kênh Nội bộ (BR-105 (8), có người cho) hoặc FOC từng đêm (BR-431…434). **Không** dùng giảm cả nhóm/cả đơn 100 % để thay cho miễn phí.
- Khi PO xếp tính năng giảm cả nhóm ghi xuống đêm, cờ tự đúng nhờ trigger.

**Giả định 4 – tiền phòng âm (thoáng qua) = `false`: đúng.** Đêm tiền âm không phải đêm miễn phí; đó là lỗi tạm và đã có ràng buộc tiền.

**Giả định 5 – `updated_at` không đổi khi tính lại cờ: đúng về nghiệp vụ.** Cờ suy ra, không phải lễ tân sửa đơn. Nhật ký đơn không được hiện "đã sửa" cho việc này.

## 3. Việc DATA cần làm (phối Q-05)

DOM đã đọc `metrics-definitions.md` Q-05. Định nghĩa không đổi; chỉ hai câu cũ mô tả theo kênh. Xem thẻ 172-01.

## 4. Thẻ

### FB-R5-DOM-DATA-172-01
- Mức độ: Minor – DATA (`product/docs/metrics-definitions.md` Q-05), làm trước báo cáo ADR đầu tiên trên v1.0.5.
- Vị trí: Q-05 "Nguồn đêm miễn phí", gạch đầu "Đơn kênh `Nội bộ` giá 0 → `is_complimentary = true` ngay khi tạo".
- Vấn đề: câu vẫn mô tả cờ theo kênh. Người đọc Q-05 có thể hiểu đêm "Nội bộ có thu" cũng là đêm miễn phí, trái BR-904 v0.5.5 và PR #172.
- Vì sao quan trọng: Q-05 là nguồn của ADR và công suất. Lệch chữ thì ai viết truy vấn mới (báo cáo, kiểm M4d) dễ lọc theo kênh thay vì theo tiền.
- Đề xuất sửa:
  - thay gạch đó bằng: "Đêm có `room_revenue_vnd = 0` (mọi kênh) → `is_complimentary = true` (trigger 0097). Nội bộ để trống mọi đêm là ca hay gặp nhất; Nội bộ có thu → `false`, là đêm bán có thu";
  - thêm luật cờ đơn: "đơn còn đêm sống: Σ tiền phòng đêm sống = 0; đơn đã đóng: theo các đêm đóng cùng (bỏ đêm `date_change`), đóng đơn không đổi cờ; đơn chưa có đêm: `false`";
  - ở gạch "Giảm cho cả đơn…" thêm: "v1.0.x chưa có đường ghi loại giảm này xuống đêm; miễn cả đơn thì dùng Nội bộ hoặc FOC từng đêm".
- Trạng thái: Open

### FB-R5-DOM-BA-172-02
- Mức độ: Suggestion – BA (`guides/01` mục FOC/giảm giá; sổ tay quản lý), bản sổ tay kế tiếp.
- Vị trí: chỗ hướng dẫn quản lý miễn phí cho khách.
- Vấn đề: chưa có câu dặn "miễn cả đơn thì Nội bộ hoặc FOC từng đêm, không giảm cả nhóm 100 %" (giả định 3).
- Vì sao quan trọng: giảm cả nhóm 100 % không làm đêm thành miễn phí, nên ADR cao giả và đêm vẫn đếm là đêm bán.
- Đề xuất sửa: một câu ở mục FOC của `guides/01`: "Miễn cả đơn: tạo đơn kênh Nội bộ (có người cho, BR-105 (8)) hoặc FOC từng đêm. Không dùng giảm giá cả nhóm 100 %."
- Trạng thái: Open

## 5. Điểm làm tốt

- Một luật, một nguồn (hàm SQL dùng chung cho trigger và lượt tính lại), và mã ứng dụng ghi cùng giá trị: đọc code hay đọc DB đều thấy cùng luật.
- Chọn đúng căn cứ tiền sau giảm (`room_revenue_vnd`), không dùng `total_room_vnd` (tiền gộp), nên FOC 100 % và đơn dài hạn không bị đếm sai.
- Tự nêu và tự giải ca đơn đã hủy, thay vì để mọi đơn hủy thành "miễn phí".

## 6. Giả định

- Hợp đồng thuê tháng OTTIMO luôn có tiền thuê > 0 (BR-203).
- Không có đường nào khác ghi `stay_night` ngoài 5 tệp BE liệt kê; nếu có, trigger BEFORE vẫn giữ luật.

`| 2026-11-07 | 5 | **DOM – review BE PR #172 (V5-17, BUG-R4-043, is_complimentary theo tiền) @ 1a848c2a: DUYỆT nghiệp vụ.** Đêm = room_revenue_vnd (sau giảm) = 0, mọi kênh: Nội bộ 0 đ, FOC 100 %, A31 về 0 → true; Nội bộ có thu, giảm một phần → false; phụ thu người BR-110 không chạm cờ. DOM xác nhận 4 giả định BE: (1) đơn đã đóng theo các đêm đóng cùng, bỏ đêm date_change – đóng đơn không đổi cờ (không thì mọi đơn hủy thành miễn phí); (2) đơn chưa có đêm = false, trigger tính lại khi có đêm thuê; (3) giảm cả nhóm/cả đơn chưa ghi xuống đêm – chấp nhận v1.0.5, luật quầy: miễn cả đơn dùng Nội bộ hoặc FOC từng đêm, không giảm cả nhóm 100 %; (4) tiền âm = false. Q-05 không cần định nghĩa lại. Thẻ 172-01 Minor DATA (sửa chữ Q-05 theo tiền, thêm luật cờ đơn, trước báo cáo ADR đầu tiên), 172-02 Suggestion BA (câu miễn cả đơn ở guides/01). Gộp chờ CI: gitleaks đỏ. Không ESC | DOM | rounds/round-05/reviews/DOM-on-be-pr-172.md |`
