# DOM – phản hồi thẻ Round 5

- Tác giả: DOM | Round 5 – Phản hồi & sửa | Ngày: 07/11/2026

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-QA-DOM-BR438-01 | Done (chọn **A**) | Xem lý do và việc theo vai ngay dưới bảng |

## FB-R5-QA-DOM-BR438-01 – vì sao chọn A

QA đúng: B18 ghi dòng trả muộn (`source = checkout`) rồi `folios.settle` trong cùng giao dịch. Kiểm A32 ở `folio-lines.service.ts` `adjust` đứng trước kiểm BR-438. Dòng B18 vì thế không bao giờ nằm trên folio mở.

Chọn A, không chọn B, vì ba lý do:

1. **Nghiệp vụ.** Sau Trả phòng, khách đã trả xong. Giảm một dòng lúc này là trả lại tiền đã thu. Ngành lưu trú để việc đó cho quản lý. Luật của ta cũng vậy: A32, và BR-433 (e) tính lần giảm này là một lần miễn.
2. **Lễ tân vẫn có đường miễn.** Đường đó làm **trước** khi bấm Trả phòng:
   - đặt giờ trả muộn (B15) → dòng trả muộn trên folio mở → gửi FOC theo BR-433 (BR-438-07);
   - lúc Trả phòng, FOC đã duyệt đi theo sang dòng B18, tối đa bằng số tiền dòng mới (`replaceLateCharge` + `syncReductions`);
   - ca phụ thu thay đêm có sẵn ô xin FOC trong lần Trả phòng (`lateFeeInsteadOfNight.requestFoc`).
3. **Phương án B mở lại việc lớn mà không thêm lợi ích.** "Gửi miễn có duyệt" trên folio đã chốt là một lối hoàn tiền thứ hai, chạy song song A32 và yêu cầu hoàn. Đi đường này cần đổi hợp đồng, đổi BE, đổi Desk ngay trước v1.0.5. Ở OTTIMO hiện nay, người trực giữ cả vai quản lý, nên sửa được theo A32, có lý do, và chủ đầu tư xem lại mỗi sáng. Khi có lễ tân riêng, lễ tân nhờ quản lý.

## Việc theo vai

- **QA:**
  - BR-438-04 thành ca A32: dòng `checkout` trên folio `settled`. FD/FDL nhận 403 `FORBIDDEN_ACTION`, **không** `requiredFlow`. MGR được, theo BR-433 (e). Bỏ `hint` khỏi `expected`;
  - TC-V105-B438-04 kiểm thêm: thân 403 không có `requiredFlow`.
- **DOM (đã làm, cùng commit này):**
  - `business-rules.md` v0.5.15: sửa ví dụ BR-438, không đổi luật;
  - `rules-v1.0.5.md`: mục 7.2 ý 3, ca T-16-4, mục 14.6;
  - review `DOM-on-be-prs-101-108-110.md` mục 3.5, dòng BR-438-04.
- **BA:** sổ tay chỗ nói miễn phụ thu trả muộn ghi một câu: "Muốn miễn phụ thu trả muộn: làm trước khi bấm **Trả phòng** (đặt giờ trả muộn rồi **Gửi miễn có duyệt**). Sau Trả phòng chỉ quản lý sửa được." Không chặn v1.0.5.
- **ARC/BE:** không có việc. Thứ tự A32 trước BR-438 là đúng ý nghiệp vụ, giữ nguyên.
