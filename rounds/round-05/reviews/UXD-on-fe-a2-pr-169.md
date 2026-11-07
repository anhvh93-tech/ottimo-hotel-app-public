# UXD review – FE-A2 PR #169 @ `d8712188` (V5-12: "Tổng cộng" ở bước Bill)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng: PR #169, `CheckOutPage.tsx` (`billTotalVnd`) và test `v5-12-bill-total-fea.test.tsx` (7 ca). Lỗi BUG-R4-052 (P3).
- Đối chiếu: hi-fi H16 Trả phòng, chữ `bill.total`, `bill.balance`, `co.late_row_*`, `co.late_fee_row`, `checkout.extra_night_*`; copy-v1.0.5 bản 2.8 mục 9.19 (viết ở lượt này).
- Cách kiểm: worktree tạm của `refs/pull/169/head`; admin-web mock (Vite, cổng 5364) mở bằng Playwright headless, lễ tân `qa.fd`, đơn Phạm Huy (201), đồng hồ trình duyệt đặt cố định trong ngày 07/11. Ở 1440 px và 390 px, VI và EN. Ảnh chụp chỉ để trong scratchpad, không commit.

## 0. Kết luận

**DUYỆT.** Số trên thẻ nay bằng tổng các dòng của bảng folio ngay dưới, và bằng "Còn phải thu" khi khách chưa trả gì. Không đổi màu, font, bố cục.

Câu hỏi của FE-A2: **có**, đổi nhãn khi tổng có dòng chưa ghi. Khóa mới `bill.total_estimate` VI "Tổng cộng (dự tính)" / EN "Total (estimate)", viết ở copy-v1.0.5 bản 2.8 mục 9.19. FE-A2 thêm khóa này. Không chặn #169.

| Thẻ | Mức | Nội dung | Chặn #169 |
|---|---|---|---|
| FB-R5-UXD-FE-169-01 | Minor | Thêm `bill.total_estimate`, đổi nhãn thẻ khi bảng có dòng chưa ghi | Không. Nên có cùng #169 hoặc PR ngay sau |

## 1. Kiểm trên mock

| Ca | Thẻ đầu bước Bill | Bảng folio | Còn phải thu |
|---|---|---|---|
| VI 1440, trả 19:30 (sau mốc cuối) | Tổng cộng: 3.168.000 đ | 3 × 820.000 + Đêm thêm 07/11 708.000 | 3.168.000 đ |
| VI 390, trả 19:30 | Tổng cộng: 3.168.000 đ | như trên | như trên |
| EN 390, trả 19:30 | Total: 3,168,000 VND | 3 × 820,000 + Extra night of 07/11 708,000 | 3,168,000 VND |
| VI 1440, trả 14:00, đã báo khách | Tổng cộng: 2.672.000 đ | 3 × 820.000 + Phụ thu trả muộn (14:00) 212.000 (đã ghi) | 2.672.000 đ |
| EN 390, trả 14:00, đã báo khách | Total: 2,672,000 VND | như trên | như trên |

- `scrollWidth` = `clientWidth` ở mọi ca, không tràn.
- Trước #169, ca 19:30 hiện "Tổng cộng: 2.460.000 đ" trên bảng có dòng 708.000 (lỗi QA). Nay khớp.
- Ca phụ thu đã báo khách: dòng được ghi trên đường sang bước Bill (BR-414), nên ở bước Bill không còn dòng chưa ghi. Ca này giữ "Tổng cộng", không "(dự tính)".
- Nhãn mới đo thử trong trang (thay chữ tại chỗ): "Tổng cộng (dự tính): 3.168.000 đ" và "Total (estimate): 3,168,000 VND" vẫn một dòng ở 390 px (cao 21 px như trước).

## 2. Chọn chữ

- Nên đổi nhãn. Số trên thẻ nay gồm dòng chỉ ghi khi bấm Hoàn tất. Đêm thêm hiện giá lịch, trước giảm theo số đêm, nên số máy chủ tính lúc Hoàn tất có thể khác (FE-A2 nêu ở giới hạn còn lại). Thêm nữa, "Xem Phiếu thanh toán" ngay dưới vẫn in tổng đã ghi (2.460.000 ở ca 19:30). Nhãn "dự tính" giải thích vì sao hai số khác nhau.
- Chỉ đổi nhãn, không thêm dòng giải thích. Các dòng phụ thu trong bảng đã có hậu tố "(dự tính)" / "(estimate)", nên dùng đúng chữ đó.
- Điều kiện hiện: bảng đang có ít nhất một dòng chưa ghi (đêm thêm, `co.late_row_new`, `co.late_row_change`, `co.late_row_reversed`, `co.late_fee_row`). Không so `billTotalVnd` với `totalVnd`, vì một dòng thêm và một dòng đảo có thể bù nhau thành 0.
- `bill.total` giữ nguyên ở phiếu in và bản xem trước: ở đó số luôn là số đã ghi.

## 3. Thẻ

### FB-R5-UXD-FE-169-01

- Mức độ: Minor
- Vị trí: `apps/admin-web/src/pages/stay/CheckOutPage.tsx`, thẻ `p.kv-big` đầu bước Bill (`{t('bill.total')}: {money(billTotalVnd)}`).
- Vấn đề: thẻ nay cộng cả dòng chưa ghi nhưng nhãn vẫn là "Tổng cộng", giống hệt nhãn tổng của phiếu xem trước ngay dưới, trong khi hai số khác nhau.
- Vì sao quan trọng: lễ tân thấy hai "Tổng cộng" khác số trên cùng màn, dễ đọc nhầm khi báo khách.
- Đề xuất sửa: thêm `bill.total_estimate` vào `gen_strings.py` (VI "Tổng cộng (dự tính)", EN "Total (estimate)"), dùng khi bảng có dòng chưa ghi; thêm 2 ca test: 19:30 có "(dự tính)", 14:00 đã báo khách và trả đúng giờ chuẩn thì không. Chi tiết ở copy-v1.0.5 mục 9.19, kiểm ở mục 8.
- Trạng thái: Open.

## 4. Điểm làm tốt

- Không lấy số cần thu của máy chủ cho thẻ tổng, giải thích rõ vì sao (bậc BR-107, trừ tiền đã thu, chặn ở 0).
- Test cộng chính các dòng của bảng (`rowsSum`) thay vì so một con số viết cứng, và đột biến 7/7 đỏ.
- Nêu thẳng các giới hạn còn lại cho ARC, QA thay vì giấu.

## Dòng decision-log

| 2026-11-07 | 5 | **UXD – review FE-A2 #169 @ d8712188 (V5-12): DUYỆT.** Thẻ Tổng cộng ở bước Bill khớp tổng các dòng folio và Còn phải thu trên mock (19:30: 3.168.000; 14:00 đã báo khách: 2.672.000), VI/EN, 1440 và 390 px không tràn. Câu hỏi nhãn: có, khóa mới `bill.total_estimate` "Tổng cộng (dự tính)" / "Total (estimate)" khi bảng có dòng chưa ghi; `bill.total` giữ ở phiếu in, bản xem trước (copy-v1.0.5 bản 2.8 mục 9.19, 278 khóa). Thẻ 169-01 Minor, không chặn. Không ESC | UXD | rounds/round-05/reviews/UXD-on-fe-a2-pr-169.md |
