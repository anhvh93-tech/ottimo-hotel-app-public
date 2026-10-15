# Báo cáo DOM – Round 1, Bước 2 (Sản xuất – Đợt 1)
- Vai: DOM | Ngày: 15/10/2026 | Việc: plan R1 mục 3.1 dòng DOM, việc (1)–(3). Việc (4) là review, thuộc Bước 3.

> Ghi chú ORC: DOM không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung DOM gửi, với sự đồng ý của INV.

## 1. Đã làm gì
1. Chuẩn hóa quy tắc kinh doanh thành 129 quy tắc BR-xxx trong 12 nhóm. Mỗi quy tắc có ví dụ số, nhãn và nguồn. Đã đưa vào phí phạt thực tế ở brief mục 5: khử mùi 500k, thẻ phòng 200k, dọn lẻ 100k.
2. Lập bảng khoảng 60 tham số cấu hình (mục 13 của business-rules) để ARC thiết kế bảng cấu hình.
3. Phân loại 30 lỗi BL 8.2: Sửa 25, Cần INV 4, Bỏ 1. Thêm 8 vấn đề mới X-01 đến X-08.
4. Đề xuất phương án cho các câu Q1–Q12 thuộc nghiệp vụ, đầu vào cho Q14–Q16, và 5 câu mới Q-D1–Q-D5, gom theo nhóm ESC ở plan mục 8.
5. Viết 10 tình huống cao điểm/sự cố (S1–S10) và danh sách nghĩa vụ pháp lý VN.

Phát hiện chính:
- Hạn khai báo khách nước ngoài có thể là 12 giờ, không phải 23:00.
- Mô hình phí dài hạn mâu thuẫn giữa BL và brief.
- Khách ngắn ngày ở dài trả đắt hơn thuê tháng.

## 2. File tạo/sửa
- `product/docs/business-rules.md` (mới)
- `product/docs/baseline-issues-triage.md` (mới)
- `rounds/round-01/outputs/DOM/report.md` (mới)
- Không sửa `decision-log.md`. 11 dòng đề xuất nằm ở mục 17 của business-rules.

## 3. Giả định
- Mọi con số ở BL mục 5 là giá trị mặc định cấu hình được.
- Các chính sách BL chưa có do DOM đề xuất, gắn nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`.
- Trích dẫn luật theo hiểu biết nghiệp vụ, ghi "cần xác nhận".
- Tên trạng thái đơn: hold, confirmed, in_house, checked_out, cancelled, no_show. OOO là khối chặn tồn phòng.

## 4. Rủi ro / vướng mắc
- Nhiều con số chính sách là đề xuất. Nếu INV chọn khác thì phải sửa BR và test case; đã giảm thiểu bằng tham số cấu hình.
- Ba điểm pháp lý (hạn khai báo khách nước ngoài, giá điện bán lại, VAT) cần luật sư/kế toán xác nhận trước khi chạy thật.
- PO viết PRD song song nên tên trạng thái và con số có thể lệch; DOM sẽ đối chiếu khi review ở Bước 3.
- Các tài liệu khác phải tham chiếu mã BR, không chép lại số (tiêu chí QC B3).

## 5. Việc chưa xong
- Review PO, BA (bắt buộc), UXR, INT (khuyến nghị) ở Bước 3.
- Cùng PO viết ESC chính thức ở đợt 3.
- `nightmare-scenarios.md` đầy đủ (plan chưa giao); hiện có bản rút gọn ở mục 14 business-rules.
- Chỉ số do DATA làm trong `metrics-definitions.md`; DOM đã bàn giao quy ước BR-904 và BR-215.

---

## Bước 4 – Phản hồi & sửa (15/10/2026)

**Đã làm**
- Trả lời đủ 47 thẻ trong `rounds/round-01/responses/DOM-responses.md`: BA 17, PO 9 và 21 lỗi tự nhận (mục B). Kết quả: 47 Done, 0 Rejected, 0 Escalated, 0 Deferred. **Blocker/Major còn Open: 0.** Với BA-DOM-01, DOM không lấy `earlier_of` làm mặc định; lý do ghi trong responses.
- `business-rules.md` lên **v0.2**. Mã BR cũ giữ nguyên. Thêm 21 quy tắc mới, nên tổng từ 129 lên 150:
  - Quy ước chung: BR-010 (ngày nghiệp vụ 06:00), BR-011 (đếm ngày báo trước), BR-113 (ở tối thiểu).
  - Đặt phòng và OTA: BR-315 (khôi phục no-show), BR-316 (tự gán căn OTA), BR-317 (xử lý xung đột OTA), BR-321…326 (đơn nhóm), BR-417 (nhận phòng trước 06:00).
  - Tiền và FOC: BR-436 (lễ tân tự miễn FOC minibar), BR-526 (đóng ca), BR-527 (đối soát chuyển khoản).
  - Giấy tờ: BR-613 (hệ quả khi giấy tờ khách NN không đạt).
  - Sự cố: BR-961…964 (mất mạng, mất điện).
- Sửa khoảng 35 quy tắc. Quan trọng nhất: BR-603 (khách NN = giờ đến + 12 giờ, bỏ mốc 23:00), BR-804 (OOO nửa mở), BR-007 (`F26-000123`), BR-110 (sức chứa theo căn), BR-312 (7 điểm ưu tiên), BR-427, BR-609.
- Mục 13 có thêm hơn 40 khóa. Mục 14 có thêm S11 và S12. Lịch sử thay đổi ở mục 18.
- `baseline-issues-triage.md` lên **v0.2**: cột Round theo backlog, thêm cột Story, thêm X-09…X-12.
- Đã xử lý 3 yêu cầu của DATA do ORC chuyển: BR-215, `s2_shift_end_buffer_minutes`, `cancel_reason_code`.

**File sửa**: `product/docs/business-rules.md`, `product/docs/baseline-issues-triage.md`, `rounds/round-01/responses/DOM-responses.md` (mới), báo cáo này. Không sửa `02-escalations/`, `decision-log.md` hay file của vai khác.

**Giả định mới** (đều có nhãn GĐ/PL trong BR): lễ tân tự miễn tối đa 500.000/tháng; phát sinh sau trả phòng nhanh được ghi trong 24 giờ; phụ thu đơn OTA tính trên giá Trực tiếp; mức cọc đoàn và hạn gửi danh sách khách 3 ngày; hệ quả khi giấy tờ khách NN không đạt; hoa hồng chi trước ngày 10.

**Rủi ro / việc kéo theo**: BA, ARC, QA, PO, DATA, UXD phải cập nhật tài liệu theo v0.2 (danh sách ở responses mục 5). Đề xuất bổ sung cho ESC-001, 004, 005, 006, 007, 008, 011 nằm ở responses mục 6 để PO gom.

**Chưa xong**: `nightmare-scenarios.md` bản đầy đủ (mục 14 đã có 12 tình huống).
