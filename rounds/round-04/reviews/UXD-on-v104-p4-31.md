# UXD review – v1.0.4 P4-31: hộp Trả sớm chọn nhánh BR-313/BR-428 theo `leaseEndDate` (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-lease-ed` (`origin/main` @ `7b5b6117`, nhánh @ `adec2a7b`). Gồm `pages/stay/EarlyDepartureDialog.tsx`: hàm `leaseEndOf`, và `breaksLease` đọc `manualLongStay.leaseEndDate`. Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.4-fe-lease-ed.md` và test `v104-lease-end-fea.test.tsx`.
- Đối chiếu:
  - brand guideline (`00-brief/context/brand/brand-guidelines.md`);
  - bảng chữ UXD `v104-strings-table.md` mục P4-31;
  - `gen_strings.py` trên `origin/v104/uxd-strings` @ `36f38edd`;
  - FB-R4-DOM-FE-A-01, BR-214, BR-313, BR-428, BUG-R4-025.
- Ảnh: không chụp. Chữ mới của 2 khóa chỉ có sau khi P4-01 gộp. FE-A chụp hộp Trả sớm VI/EN 1366/1440 ở giai đoạn B. Đọc mã và test.

## Kết luận: ĐẠT

Mã đúng luật trong tech plan. Hộp hiện BR-313 khi `stayType = long` và ngày rời mới **trước** `leaseEndDate`. Rời trong phần gia hạn hoặc đúng ngày hết HĐ thì hộp đi theo BR-428 thường. Máy chủ cũ chưa có trường này thì hộp giữ hành vi v1.0.3. Lỗ hổng đã biết "sau B13 hộp vẫn hiện dòng BR-313" đã hết.

Chữ: mã đã dùng đúng 2 khóa có sẵn (`early_departure.lease_rule_paid`, `early_departure.row_refund_help`). UXD đã sửa chữ cả hai ở P4-01 lượt 1 (`uxd-strings` @ `36f38edd`), khớp bảng chữ. Gói này không cần đổi mã cho phần chữ. Chữ hiện đúng khi P4-01 gộp và nhánh rebase.

Thẻ 01 là gợi ý, không chặn gộp. Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Suggestion | Khung BR-313 không nói ngày hết HĐ. Sau khi gia hạn, ngày hết HĐ khác ngày đi trên khung đơn, nên lễ tân khó tự kiểm vì sao hộp chọn nhánh này |

## Duyệt chữ theo khóa (bản trên `uxd-strings`)

| Khóa | VI (rút gọn) | EN (rút gọn) | Kết quả |
|---|---|---|---|
| `early_departure.lease_rule_paid` | "… trừ điện nước, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng, hoàn phần còn lại trong 7 ngày làm việc …" | "… deduct utilities, unpaid extras (minibar, extra cleaning) and damage, then refund the rest …" | Đúng BR-214. Chờ DOM duyệt câu (plan) |
| `early_departure.row_refund_help` | "Một yêu cầu hoàn cho phần trả sớm, cần quản lý duyệt. Trả phòng không tạo lại khoản này. Nếu folio còn tiền trả thừa khác, bước Bill hỏi cách xử lý riêng phần đó." | "One refund request for the early departure … the Bill step asks how to handle that part." | Đúng BUG-R4-025, khớp BR-522 và release notes đã đính chính |

## Kiểm theo yêu cầu

| Mục | Kết quả |
|---|---|
| Brand | Đạt. Không đổi hiển thị. Khung BR-313 vẫn là `Alert` warn `role="note"` của DS |
| Khóa chữ | Không có khóa mới. 2 khóa sửa chữ đã có VI + EN trên `uxd-strings` |
| Trạng thái | Không đổi. Bản tính thử vẫn tự chạy (debounce), vẫn có trạng thái tải và lỗi như v1.0.3 |
| A11y | Không đổi |
| 1440 / 390 | Không đổi bố cục. Câu `row_refund_help` mới dài hơn (VI khoảng 170 ký tự). Câu nằm dưới dòng tổng ở bước ②, là `li-s` trong `Modal lg`. Ở 390 câu xuống 4–5 dòng, không tràn ngang. Chấp nhận được, vì đây là câu giải thích, không phải nhãn |

---

### FB-R4-UXD-FE-P431-01
- Mức độ: Suggestion
- Vị trí: `product/apps/admin-web/src/pages/stay/EarlyDepartureDialog.tsx` khối `LeaseRule` (khoảng dòng 752, `Alert` có `title={t('early_departure.lease_title')}`)
- Vấn đề: hộp hiện khoảng ở "đến → `stayEnd`" (dòng 573), tức là ngày đi **sau khi gia hạn**. Khung BR-313 chỉ có tiêu đề "Trả trước hạn hợp đồng thuê tháng", không ghi ngày hết HĐ (`leaseEndDate`). Ca mới mà gói này mở: HĐ hết 30/11, đã gia hạn tới 15/12, khách rời 20/11. Hộp đúng là hiện BR-313, nhưng trên màn không có ngày 30/11. Lễ tân phải mở hồ sơ HĐ mới biết vì sao đây là "trả trước hạn".
- Vì sao quan trọng: đây là câu lễ tân đọc cho khách ("anh rời trước hạn hợp đồng nên mất ký quỹ"). Khi ngày HĐ hiện ngay trong khung, lễ tân tin vào hộp và không phải tra thêm. Không sai nghiệp vụ, nên chỉ là gợi ý.
- Đề xuất sửa: khi `leaseEndDate` có và khác `stayEnd`, thêm một dòng `li-s` ngay dưới tiêu đề khung: "HĐ thuê tháng hết hạn {date}." / "The monthly lease ends on {date}." (`{date}` dạng dd/mm/yyyy). Khóa đề xuất: `early_departure.lease_end_line`. Nếu FE-A đồng ý, báo UXD để thêm ở P4-01 lượt 2. Không làm cũng được ở v1.0.4.
- Trạng thái: Open

## Điểm nên giữ
- `leaseEndOf` gom việc đọc trường mới vào một chỗ, có đường lùi về `departureDate`. Phase B chỉ cần bỏ ép kiểu.
- Bước Kết quả dùng cùng ngày hết HĐ với bước Xem trước, nên hai bước không nói ngược nhau.
- Test có đủ 3 ca biên: rời trong phần gia hạn, rời đúng ngày hết HĐ, rời trước ngày hết HĐ.
