# FB-INV-004 – Giờ nhận phòng, giá "chỉ từ" trên landing, đo truy cập

- Ngày: 26/10/2026 (trong buổi B1) | Người gửi: INV | Ghi: ORC

## Nguyên văn
> Tôi có 2 ý cần bạn chỉnh cho lần sắp tới. check in 12h:00 ko phải 14:00 như bữa giờ chúng ta trao đổi
>
> Landing page nên thêm thông tin là chỉ từ 700k để khách staycation ko bỏ đi khi ko thấy giá.
>
> Tôi muốn phát triển trên funtion để đo truy cập hoặc collect data khách hàng

Trả lời thêm (AskUserQuestion 26/10): **giữ trả phòng 12:00, nhận phòng từ 12:00** – nhận từ 12:00 nếu phòng đã sẵn sàng, phòng chắc chắn sẵn sàng lúc 14:00, không tính phụ thu nhận sớm từ 12:00.

## Phân loại

| # | Ý | Loại | Ưu tiên | Vai | Đích |
|---|---|---|---|---|---|
| 1 | Nhận phòng từ 12:00 (trả 12:00 giữ nguyên; phòng chắc chắn sẵn sàng 14:00; không phụ thu nhận sớm từ 12:00) | Quy tắc nghiệp vụ | P1 – trước ngày D 02/11 | DOM (BR-401, BR nhận sớm), BE-A (tham số mặc định), CPY/FE-LP (landing), INT/UXD (mẫu tin, trang khách) | rc.2 / landing |
| 2 | Landing thêm giá "chỉ từ 700.000đ" để khách staycation không bỏ đi | Nội dung bán hàng | P2 | DOM kiểm giá thật có mức ≤ 700.000đ (đúng sự thật quảng cáo), CPY viết câu, FE-LP áp | landing-v kế tiếp |
| 3 | Đo truy cập / thu thập dữ liệu khách từ website | Tính năng mới | P2 | DATA (kế hoạch đo), SEC (NĐ 13/2023, cookie, CSP), PO (phạm vi) | đề xuất + ESC, v1.0.x/v1.1 |

## Trạng thái
- Mở. ORC giao việc 26/10.
