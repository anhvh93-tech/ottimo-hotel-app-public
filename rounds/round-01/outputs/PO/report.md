# Báo cáo PO – Round 1 · Bước 2 (Sản xuất) · Đợt 1
- Ngày: 15/10/2026 | Vai: PO

> Ghi chú ORC: PO không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nguyên nội dung PO gửi, với sự đồng ý của INV.

## 1. Đã làm gì
- Viết PRD MVP nháp `product/docs/PRD.md`:
  - Bối cảnh rút từ BL mục 7–8; tầm nhìn và 6 nguyên tắc sản phẩm.
  - 5 mục tiêu kinh doanh: công suất ≥ 80%, 4–6 căn dài hạn, kênh trực tiếp ≥ 35%, GOP ≥ 60%, khai báo đúng hạn.
  - 12 chỉ số thành công có số đích.
  - 5 nhóm người dùng, kèm định hướng "không được thấy" để BA làm RBAC.
  - 16 phân hệ M0–M15, bảng MVP R2/R3/sau MVP, 11 hạng mục ngoài phạm vi.
  - Luồng khách và luồng nhân viên, yêu cầu phi chức năng, 12 giả định.
- Viết backlog `03-backlog/backlog.md`: 19 epic, 132 story (71 Must R2, 14 Must R3, 33 Should, 11 Could, 3 R4+). Có MoSCoW, round, nguồn BL.
- Viết tiêu chí Given/When/Then cho 71/71 story Must R2, mỗi story ít nhất 2 tiêu chí.
- Gắn các lỗi BL 8.2 vào story:
  - #1 → US-027; #2 → US-026; #3 → US-044; #5 → US-019/061; #7 → US-011
  - #8/#29 → US-010; #9 → US-047; #18 → US-023; #19 → US-083/085
  - #24 → US-007; #27 → US-003/048/087; #30 → US-018

## 2. File tạo/sửa
- `product/docs/PRD.md` (tạo mới)
- `03-backlog/backlog.md` (sửa)
- `rounds/round-01/outputs/PO/report.md` (tạo mới)

## 3. Giả định
1. Đích kênh trực tiếp ≥ 35% doanh thu phòng; GOP ≥ 60%; đích S1–S12 là do đội đề xuất.
2. Không có vai F&B/kế toán riêng. Quản lý thuộc nhóm chủ đầu tư (U1). Lễ tân trưởng là lễ tân có thêm quyền duyệt FOC trong hạn mức (hạn mức chờ ESC).
3. Booking engine công khai chỉ là Should R3 (US-131). Khách tìm phòng qua OTA và Zalo/CTV.
4. Khóa cửa: trong MVP lễ tân nhập mã tay (US-128); tích hợp API để R4+.
5. R2 chỉ ghi nhận thanh toán + VietQR. VNPay/MoMo, MISA, Zalo ZNS, channel manager thật làm ở R3.
6. App khách: VI/EN ở R2, tiếng Nga ở R3. Mẫu tin nhắn và văn bản báo giá có tiếng Nga ngay từ R2.
7. Lễ tân dùng máy tính, buồng phòng/sale dùng điện thoại; không yêu cầu chạy offline hoàn toàn.
8. P&L ở R3: nhập chi phí trong app, chưa tính thuê nhà/khấu hao.
9. Quyết định phạm vi thuộc quyền PO: ranh giới MVP theo PRD mục 5.2–5.3; ca/chấm công và ký số hợp đồng nằm ngoài MVP (BL 9 #13, #17); cảnh báo lệch mục tiêu là Could R4+ (BL 9 #25).

## 4. Rủi ro / vướng mắc
- **R2 nặng:** 71 story Must R2. Đã ghi thứ tự ưu tiên khi thiếu thời gian (PRD D6, backlog mục 1). Cần ARC/ORC ước lượng năng lực; có thể dời một phần EP07/EP14 sang R3.
- **Con số trong tiêu chí chưa phải mã BR:** nếu DOM đổi công thức thì phải sửa tiêu chí (ví dụ US-081 AC1, US-027). Nếu không thay kịp sẽ có rủi ro trượt tiêu chí QC B3.
- **Phụ thuộc BA:** US-002/003/020/048/080/087 cần `rbac-matrix.md`; US-020/053/061 cần `state-machines.md`.
- **Chính sách chưa chốt:** US-021 (hủy/hoàn cọc), US-085 (giữ chỗ hết hạn), US-028 (giá gia hạn), US-007 (hạn mức FOC), US-049 (thời hạn lưu ảnh) đều đã gắn "chờ ESC".
- **Story mới không có trong BL:** US-024, US-124, US-127, US-132. Nhờ DOM xác nhận khi review.

## 5. Việc chưa xong
- Đợt 3: thay con số bằng mã BR-xxx; bổ sung tiêu chí theo `use-cases.md` của BA; viết tiêu chí cho Must R3 nếu kịp.
- Cùng DOM gom 26 câu hỏi BL mục 9 thành ESC (dự kiến ≤ 9) hoặc ghi decision-log.
- Bước 3: review UXR, UXD, QA, DATA.
- Cùng ORC lập `plan.md` Round 2.
