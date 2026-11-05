# PO trả lời review PR #66 – ghi chép phát hành v1.0.4

- Người trả lời: PO | Ngày: 05/11/2026 | Round 4 – Bước: **Phản hồi & sửa**
- Nhánh `v104/po-release-notes`. Đã review ở `99d103a0`. Lượt sửa này có merge `origin/main` @ `617fe120`, không rebase.
- Review đã đọc:
  - `rounds/round-04/reviews/SEC-on-v104-pr66-release-notes.md` (SEC ĐẠT);
  - `rounds/round-04/reviews/DOM-on-v104-pr66-release-notes.md` (DOM ĐẠT);
  - dòng QA2 về #66 trong `01-decisions/decision-log.md` (ĐẠT CÓ ĐK).
- Chỉ sửa chữ trong `product/docs/release-notes.md`. Không đổi số tiền, quy tắc hay phạm vi.

## Từng thẻ

| Thẻ | Mức | Trạng thái | Đã sửa |
|---|---|---|---|
| FB-R4-SEC-PO-PR66-01 | Suggestion | **Fixed** | Gạch **Minibar khi đổi phòng** thêm "(chỉ dòng trùng này)" và "ghi sổ giao ca mã đơn, số tiền". Thêm "Không dùng **Bỏ cả dòng** để miễn hay giảm cho khách. Quản lý xem lại các lần bỏ dòng này." Dẫn thêm `02` mục 11.1 (gạch **Kiểm trùng**), khớp PR72-05 |
| QA2 minor, dòng BUG-R4-050 | Minor | **Fixed** | Cách làm trên bản đang chạy thêm "thu theo giá gợi ý, không sửa giá đêm thêm". ĐK của QA2 (CO-05 (b) chạy trên STG 07/11 12:35) là việc của QA, ghi chép không cần đổi |
| FB-R4-DOM-PO-PR66-01 | Minor | **Fixed** | Bước 3 **Kiểm giá** thêm "Ra số khác: giá căn chưa đổi đúng ở phần A, dừng và nhắn đội. Chọn thứ Sáu chưa qua mà còn Studio trống." #66 không ghi ngày thử cụ thể nào. PO thêm "(ngày thử 13/11–17/11)" cho khớp phần C mới của hướng dẫn chuyển giá |
| FB-R4-DOM-PO-PR66-02 | Minor | **Fixed** | "(mục 12.2)" → "(`02` mục 12.2)" |
| FB-R4-DOM-PO-PR66-03 | Minor | **Fixed** | (a) "Không bấm **Trả sớm** (trước 06:00 Desk vẫn tính là ngày hôm trước)." (b) Thêm "Khách chỉ chuyển khoản được: ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý.", khớp `02` 11.5.1 |
| FB-R4-DOM-PO-PR66-04 | Gợi ý | **Fixed (PO nhận)** | Gạch đơn quá ngày đi thêm "Chờ duyệt xong mới **Trả phòng** được. Ghi trễ ngày đi trên cổng: hỏi quản lý trước khi gửi.", khớp `02` 11.1 (b) |
| FB-R4-DOM-PO-PR66-05 | Gợi ý | **Fixed (PO nhận)** | "Lễ tân kiểm một lần ở ca đầu tiên sau khi lên, và sau mỗi lần chủ đầu tư báo đã đổi giá: báo giá thử một Studio…", khớp dòng "Kiểm sau khi chuyển giá" ở `02` |
| FB-R4-DOM-DOM-PR66-06 | Major (tài liệu DOM) | Không thuộc #66 | Đã ở `main`. #66 chỉ dẫn tới phần C, ngày thử ghi như phần C mới |

## Kiểm sau sửa

- Quét lại các dòng thêm. Không có emoji, email, mã đơn, tỷ lệ hay số tiền hoa hồng, doanh thu.
- Không ESC mới. Không giả định mới.
