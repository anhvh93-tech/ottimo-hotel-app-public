# PO review DATA – Round 1, bước 3

- Người review: PO | Ngày: 15/10/2026
- Đối tượng: `product/docs/metrics-definitions.md` (v0.1)
- Góc nhìn: chỉ số có đo đúng mục tiêu PRD (G1–G5) và chỉ số thành công S1–S12 không, có giữ đúng phạm vi "tham gia nhẹ" (plan R1 quyết định P1) không, có đủ dữ liệu để R2 lưu đúng không. Đã đối chiếu PRD mục 3, `business-rules.md` (BR-215, 811, 901, 904), wireframe L2/L8, `erd.md` (có đủ `stay_night`, `checkout_started_at`, `month_close`…), ESC-008, ESC-012.
- Tổng: **0 Blocker · 0 Major · 4 Minor · 2 Suggestion**

---

### FB-R1-PO-DATA-01
- Mức độ: Minor
- Vị trí: mục 4, dòng S2 ("100% với khách nhận phòng trước 21:00")
- Vấn đề: PRD S2 đặt đích phụ "100% với khách nhận phòng **trong giờ trực lễ tân**". DATA đã đổi thành mốc cứng 21:00. Trong khi giờ trực đang là tham số `front_desk_hours` 07:00–22:00 (BR-811), và giờ khai báo ca tối do BR-611 quy định.
- Vì sao quan trọng: nếu INV đổi giờ trực thì chỉ số S2 sẽ đo sai mà không ai biết. Một con số giờ nằm ngoài BR cũng trái QC B3.
- Đề xuất sửa: định nghĩa phần phụ là "đơn có `actual_checkin_at` trong `front_desk_hours` và cách giờ kết thúc ca ít nhất X phút". X là tham số do DATA đề xuất, gửi DOM đưa vào BR mục 13, hoặc bỏ X nếu thấy không cần. PO sẽ sửa câu chữ PRD S2 cho khớp (PO-on-QA, tự nhận lỗi T8).
- Trạng thái: Open

### FB-R1-PO-DATA-02
- Mức độ: Minor
- Vị trí: Q-14 ("Chốt tháng" ngày 5), mục 6 (đối chiếu R-01…R-07 "lệch là lỗi chặn chốt"), mục 9 (`MonthClose`, `MetricRegistry`), Q-14 (pickup)
- Vấn đề: tài liệu mô tả một số **tính năng** chưa có story nào trong backlog: nút "Chốt tháng" của chủ đầu tư, chặn chốt khi đối chiếu lệch, đăng ký mã chỉ số, pickup. Plan R1 (P1) chỉ giao DATA định nghĩa công thức và dữ liệu cần lưu.
- Vì sao quan trọng: ARC đã đưa `month_close` vào ERD. Nếu không ghi rõ round thì R2 có thể bị hiểu là phải làm cả luồng chốt tháng, làm phình phạm vi lõi MVP.
- Đề xuất sửa: giữ nguyên các trường dữ liệu (chi phí thấp, đúng mục đích "không phải sửa ERD"), nhưng ghi nhãn "**R3 – chờ story PO**" cho Q-14 (chốt tháng), mục 6 và pickup. Quyết định của PO: "Chốt số liệu tháng" là story Could R3; R-01…R-07 trở thành AC của story báo cáo R3 (EP13). PO sẽ thêm ở bước 4.
- Trạng thái: Open

### FB-R1-PO-DATA-03
- Mức độ: Minor
- Vị trí: Q-10 (chia theo tháng hợp đồng); so với BR-215 ("÷ số đêm của tháng lịch")
- Vấn đề: DATA chọn cách chia hợp lý hơn và đã giải thích rõ (HĐ bắt đầu giữa tháng vẫn đúng tổng), nhưng câu chữ BR-215 vẫn nói "tháng lịch". Hai nguồn sự thật đang nói khác nhau.
- Vì sao quan trọng: khi làm báo cáo R3, BE và QA không biết theo nguồn nào.
- Đề xuất sửa: DATA gửi DOM thẻ đề nghị sửa BR-215 trỏ sang Q-10 (PO đã nêu ý này ở FB-R1-PO-DOM-09). Trong Q-10 ghi "thay thế câu 'tháng lịch' ở BR-215 – chờ DOM cập nhật".
- Trạng thái: Open

### FB-R1-PO-DATA-04
- Mức độ: Minor
- Vị trí: Q-11 (danh sách 14 kênh: Website, Zalo/điện thoại, vãng lai, khách quay lại, Sale nội bộ, CTV, 6 OTA gồm Traveloka, Google, Nội bộ); K-11
- Vấn đề: danh sách kênh của DATA khác BR-901 (Airbnb, Booking, Agoda, Expedia, Trip.com, Website/Zalo) và khác ô Kênh trên wireframe L2 (Trực tiếp, CTV, 6 OTA). Hiện chưa ai quyết R2 lưu kênh ở mức chi tiết nào.
- Vì sao quan trọng: K-11 (mục tiêu G3: kênh trực tiếp ≥ 35%) và báo cáo kênh cần dữ liệu kênh đúng ngay từ đơn đầu tiên của R2. Thiếu chi tiết thì không bổ sung ngược lại được.
- Đề xuất sửa: quyết định của PO (sẽ ghi vào US-017 ở bước 4): R2 lưu **kênh** theo danh sách BR-901 cộng "Trực tiếp", "CTV/môi giới", "Nội bộ", kèm `Channel.group` như Q-11. Đơn Trực tiếp có thêm trường không bắt buộc "**nguồn**" (Zalo/điện thoại, Website, vãng lai, khách quay lại, Sale nội bộ). Traveloka và Google chỉ thêm khi INV xác nhận có dùng (ESC-012). DATA chỉnh Q-11 theo cấu trúc "kênh + nguồn" này, K-11 tính theo `group = direct`.
- Trạng thái: Open

### FB-R1-PO-DATA-05
- Mức độ: Suggestion
- Vị trí: mục 4 dòng S5 (mẫu số "… và đã được gửi link app khách")
- Vấn đề: mẫu số của S5 chỉ gồm các đơn **đã được gửi link**. Nếu lễ tân quên gửi link thì đơn đó bị loại khỏi mẫu số, và S5 vẫn trông tốt.
- Vì sao quan trọng: S5 đo giá trị của check-in online, một tính năng lõi R2 (O-02), và nó dẫn tới S4 (nhận phòng ≤ 3 phút). Chỉ số có thể "đẹp" trong khi thực tế không ai dùng.
- Đề xuất sửa: thêm chỉ số đi kèm **S5-pre = tỉ lệ đơn đủ điều kiện đã được gửi link trước 48 giờ**. Hoặc tính S5 trên mọi đơn đủ điều kiện (có liên hệ), không lọc theo việc đã gửi link. Hiển thị cả hai.
- Trạng thái: Open

### FB-R1-PO-DATA-06
- Mức độ: Suggestion
- Vị trí: mục 2 và mục 4 (chưa có cột round hiển thị)
- Vấn đề: tài liệu chưa nói chỉ số nào hiện ở **R2** (Tổng quan: US-010 KPI đêm nay, US-011, US-012) và chỉ số nào ở **R3** (báo cáo EP13: ADR/RevPAR tháng, GOP, kênh). Wireframe L8 đã phải tự ghi "ADR/RevPAR (R3)".
- Vì sao quan trọng: FE và BE R2 cần biết công thức nào phải chạy ngay. Phần còn lại chỉ cần lưu đủ dữ liệu.
- Đề xuất sửa: thêm cột "Hiển thị từ" cho K-01…K-21 và S1–S12. Gợi ý: R2 = K-03 (đêm nay), K-01, K-02 cho Tổng quan, cùng giám sát S7 (giữ chỗ treo = 0). Còn lại là R3 hoặc R4 (đo khi INV vận hành thật).
- Trạng thái: Open

---

## Điểm làm tốt
1. **Xử lý trọn 5 lỗi số liệu BL 8.2** (#8, #11, #22, #28, #29), mỗi lỗi có bảng trước/sau bằng số. PO đã tự tính lại K-09 (15.794.500), K-10 (168.260.500), K-15 (76.039.500 → GOP 119.660.500, biên 61,1%), K-03 đêm nay (6/9 = 66,7%, khớp wireframe L8) và thấy đều khớp với BL. Đáp ứng QC A15.
2. **Mục 9 "trường dữ liệu bắt buộc gửi ARC"**, cùng nguyên tắc không xóa cứng, snapshot và bảng `StayNight`, đúng với lý do PO cho DATA tham gia ngay R1 (quyết định P1). ERD hiện đã có các trường này, nên R3 làm báo cáo không phải sửa ERD.
3. **Gắn thẳng mục tiêu PRD với chỉ số** (mục 5) và định nghĩa S1–S12 thật sự đo được (S1a/S1b tách lỗi hệ thống với đồng bộ trễ; S3 loại phiên bỏ dở). Chỗ nào là chính sách thì đánh nhãn giả định và đưa vào ESC có sẵn (O-1 → ESC-008, O-2 → ESC-012), không mở thêm ESC.
