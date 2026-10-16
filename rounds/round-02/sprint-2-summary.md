# Tổng kết Sprint 2 – Round 2 (Đặt phòng & room rack)

- Người viết: ORC | Ngày: 16/10/2026 | CI: run 38911271416 – **xanh 6/6 job**, E2E chạy thật **783 đạt / 0 trượt** (193 bỏ qua có lý do: tính năng Sprint 3–4 hoặc R3)
- Quyết định QC Sprint 2: **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-02/qc/s2-qc-gate.md`)

## 1. Đã làm được
- **Lịch phòng (room rack) 14 ngày:** làn "Chưa gán căn" cho đơn OTA trùng căn, nhãn "Nhập tay" cho đơn dài hạn, đồng hồ đếm ngược giữ chỗ, cờ "vượt sức chứa", dạng danh sách trên điện thoại, xem theo vai (buồng phòng không thấy tên khách).
- **Đặt phòng:** tạo / sửa / đổi căn – ngày / hủy (hiện trước số tiền hoàn và phí trước khi bấm), giá theo đêm theo lịch giá (cuối tuần +15%, lễ +30%, giảm theo số đêm, ở tối thiểu), phụ thu người, nhắc bộ đồ dùng thêm cho người ngủ sofa.
- **Chống đặt trùng ở tầng cơ sở dữ liệu:** 50 người đặt cùng một căn – một đêm cùng lúc → đúng 1 thành công, 49 bị từ chối, không lỗi hệ thống.
- **Giữ chỗ tự hết hạn**, giữ chỗ đã có tiền thì không tự hủy mà báo người phụ trách; **khóa phòng bảo trì (OOO)**; **khách không đến** + khôi phục (có duyệt); **đơn OTA nhập tay** tự lấy giá theo nhóm căn.
- **Sale/CTV:** báo giá ngắn ngày (văn bản VI/EN để gửi khách), giữ chỗ từ báo giá, gia hạn báo giá, hoa hồng chỉ thấy của mình, "báo đã chuyển cọc".
- **Tiền:** bill (folio) theo đơn, chia theo từng đêm; hủy / không đến tự đảo tiền phòng và ghi phí giữ lại; xác nhận cọc không thể ghi trùng; tiền do sale/CTV ghi phải chờ đối soát; FOC có duyệt; mọi thao tác tiền có nhật ký.
- **Chuẩn bị Sprint 4 (đi trước):** đặc tả + 6 màn thiết kế: app buồng phòng & bảo trì trên điện thoại (dùng được khi mất mạng), app khách gửi yêu cầu, màn Tổng quan cho chủ đầu tư.

## 2. Chất lượng
- Test tự động: API 1.151, web quản trị 108 – đều xanh; E2E thật 783/0.
- Review chéo: DOM 15, SEC 12, ARC 13, UXD 20 thẻ – 26/26 thẻ Blocker/Major đã xử lý. Lỗi chặn duy nhất (đơn hủy vẫn "còn phải thu") đã sửa và kiểm lại.
- Lỗi: tìm 24, P0/P1 còn mở 0. QC tìm thêm 2 lỗi P2 (kiểm sức chứa khi hạ sức chứa căn; câu báo khi hai người lưu cùng lúc) – sửa đầu Sprint 3.
- Quy tắc nghiệp vụ lên v0.3.2, hợp đồng API 0.3.5.

## 3. Điều kiện QC phải xong trước cổng Sprint 3
ĐK-S2-1 sổ lỗi (QA) · ĐK-S2-2 kiểm sức chứa căn (BE) · ĐK-S2-3 câu báo lưu đồng thời (UXD+FE) · ĐK-S2-4 bật E2E giao diện bằng trình duyệt + kiểm trợ năng (QA+OPS) · ĐK-S2-5 PO nghiệm thu 18 story · ĐK-S2-6 **staging (VPS + tên miền)** · ĐK-S2-7 SEC/DOM kiểm lại các thẻ lớn.

## 4. CẦN ANH/CHỊ QUYẾT ĐỊNH
1. **Gấp – Máy chủ chạy thử (staging):** QC lưu ý nếu tới cuối Round 2 chưa có VPS + tên miền thì phần "chạy trên môi trường thật" của QC cuối round sẽ KHÔNG ĐẠT. Cần anh/chị báo: nhà cung cấp VPS + IP, tên miền + nơi mua (không gửi mật khẩu).
2. **ESC-015** – Thêm Giỗ Tổ Hùng Vương + đêm 1/9 vào ngày lễ (+30%, ở tối thiểu 2 đêm, không hoàn cọc khi hủy). Đội đề xuất: thêm cả hai.
3. **ESC-016** – Phí dọn thêm khách ngắn ngày. Đội đề xuất: dọn bù miễn phí; lần dọn đầy đủ thứ hai trong ngày 100.000 đ. Kèm câu hỏi: có HĐ dài hạn nào đang hẹn dọn cố định hằng tuần không?
4. **ESC-017** – Giới hạn giữ chỗ CTV 3 / sale 5; tiền do sale/CTV ghi chờ đối soát, hoa hồng đạt sau đối soát. Đội đề xuất: đồng ý.
5. **Cập nhật thư viện (Dependabot, 11 đề nghị):** OPS khuyến nghị gộp 4 (công cụ CI), hoãn 2, đóng 5 (`rounds/round-02/outputs/OPS/s2-dependabot.md`). Cần anh/chị cho phép thao tác trên GitHub.

ESC-015…017 không chặn việc: hệ thống đang chạy theo phương án đội đề xuất, chỉnh được bằng tham số.

## 5. Sprint 3 (tiếp theo)
Nhận phòng / trả phòng, bill đầy đủ, VietQR, hoàn tiền, giấy tờ khách (mã hóa), khai báo lưu trú, check-in online, người đi cùng, đổi phòng khách đang ở; hợp đồng API 0.3.6; cộng các điều kiện QC ở mục 3.
