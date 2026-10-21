# Phản hồi của DOM – Round 2

## Thẻ SEC cho `guest-messaging-journey.md` (`reviews/landing-zalo-SEC.md` mục 4) – 17/10/2026, Sprint 4 khởi động

Thẻ được xử lý bằng cách đưa BR-971…983 vào `product/docs/business-rules.md` v0.3.5, nhóm 12B. Từ đây, BR là nguồn chính; bản nháp chỉ giữ chi tiết từng điểm chạm.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-DOM-01 | Done | BR-978 ghi đúng câu SEC: mã cửa không gửi qua Zalo (ZBS, tin OA, chat gõ tay) và không gửi qua hội thoại OTA. MVP chỉ cho xem mã trong app khách mức 2, hoặc lễ tân đọc trực tiếp/gọi điện; kênh khác chờ SEC ở R3. Ví dụ mới: khách hỏi mã qua Zalo lúc 23:00 thì lễ tân gọi điện, không gõ mã vào Zalo. **Điều kiện C-10 đã đáp ứng.** QA đổi kết quả đúng của tình huống #14 theo BR-978. |
| FB-R2-SEC-DOM-02 | Done | BR-972 thêm `contact_source` (`ota` / `guest_provided`). Liên hệ do OTA chuyển chỉ dùng cho hội thoại OTA và gọi điện vận hành. ZBS chỉ gửi khi khách tự đưa liên hệ. BR-981 nhắc lại cho đơn OTA. INT sửa `zalo-oa.md` mục 3 bước 1 cho khớp, hiện vẫn ghi "Đơn OTA của khách Việt có SĐT: gửi được ZNS". |
| FB-R2-SEC-DOM-03 | Done | BR-972 bỏ dẫn SR-DEV-08 và ghi quy tắc SEC INT-12: OA Manager bản web trên máy của cơ sở, hồ sơ trình duyệt riêng, mỗi nhân viên một tài khoản, điện thoại cá nhân chỉ cho OWN/MGR. WhatsApp/Telegram/Viber của cơ sở cũng dùng bản web. |
| FB-R2-SEC-DOM-04 | Done | BR-976: link dùng token thông báo (SEC INT-09). Chỉ vai được gửi link check-in mới chép được tin có link; CTV thấy việc nhưng không chép được. `message_log` ghi `copied`, không ghi nội dung hay link. PO đưa câu này vào AC của US-161. |
| FB-R2-SEC-DOM-05 | Done | BR-971: mã đặt trực tiếp đi bằng tin/email riêng, không nằm trong tin vận hành, bill điện tử hay lời mời đánh giá. Được in ở chân bill giấy của đơn Trực tiếp/CTV đã đồng ý. Landing không có ô đăng ký nhận ưu đãi (khớp PO EP19). |
| FB-R2-SEC-DOM-06 | Done | BR-978: tin có số tiền/VietQR (TP-00, TP-01, TP-11) kèm câu chống giả danh cố định. UXD viết câu chữ theo Brand Guidelines. |
| R2-R4-C3 (BR-525-16) | Done | DOM xác nhận số oracle BR-525-16 sau khi QA tách hai mốc (bug-list 11.35): trong cửa sổ (A+2 09:00) công nợ đang mở 100.000, trần xóa nợ 100.000, còn phải thu 120.000, void/giảm 409; hết cửa sổ (A+2 10:01) công nợ 120.000, trần 120.000, giữ hạn cũ. Khớp BR-525 (ii) và BR-427 (d). Ghi chú ở `business-rules.md` (bảng thay đổi, dòng 21/10) và decision-log 2026-10-21. |
