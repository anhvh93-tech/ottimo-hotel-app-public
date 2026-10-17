# FB-INV-002 – Góp ý landing page (bản mẫu v1.1)

- Ngày: 17/10/2026 · Round 2 (Sprint 4, luồng LP-v1) · Ghi bởi: ORC
- Bản xem: `product/design/landing/mock/index.html` v1.1 (UXD)

## Nguyên văn
> 1. content: ko muốn mention số phòng
> 2. content: ko muốn khách hiểu lầm đây là căn hộ dịch vụ, có thể ở lưu trú như một boutique stay, tức là mình viết sao để cả 2 tệp khách này đều happy vì trang bị của căn hộ thì sẽ khiến cho các khách đặt khách sạn cảm thấy vượt mong đợi của họ. còn khách lưu trú thì thấy đây đúng là thứ mà sinh ra cho họ
> 3. có chức năng đặt phòng trực tiếp trên fanpage và trả về cái phần mềm quản trị chúng ta đang build, sẽ định danh là khách đến từ website
> 4. Chức năng chat tư vấn phần lớn trả về zalo OA, hạn chết các platform khác (telegram, whatapp, ... cũng có nhưng mà khó tìm một xíu, có drive về fanpage pacebook tại: https://www.facebook.com/profile.php?id=100091335431646
> 5. Và hiện tại, tôi thấy nội dung bố cục đang hơi rối, chưa mượt lắm.

## Phân loại
| # | Ý | Loại | Ưu tiên | Vai | Xử lý |
|---|---|---|---|---|---|
| 1 | Không nhắc số lượng phòng/căn (bỏ "10 căn", "Ten apartments"…) | Nội dung | P2 | UXD | Sửa ở concept/mock v1.2 |
| 2 | Định vị: **boutique stay**, không để khách hiểu là "căn hộ dịch vụ". Viết cho hai nhóm khách cùng hài lòng: khách đặt kiểu khách sạn thấy tiện nghi căn hộ **vượt mong đợi**; khách ở dài thấy đây **sinh ra cho họ** | Nội dung, định vị | P2 | UXD (+ DOM soát) | Viết lại theo Brand Guidelines (định vị "giữa khách sạn và boutique stay") |
| 3 | **Đặt phòng trực tiếp** từ website (nút "Book now" trên Facebook trỏ về đây) → đổ vào Desk, nguồn = **website** | Tính năng mới (đổi ESC-020 L2 từ A sang B) | P1 | PO, ARC, SEC, BE-D, FE-LP | Dựa trên US-155 (yêu cầu đặt phòng vào Desk). Cần INV chốt hình thức – xem câu hỏi bên dưới |
| 4 | Chat: **Zalo OA là kênh chính**; WhatsApp/Telegram/Viber vẫn có nhưng để ở chỗ phụ; thêm link **Facebook fanpage** | Nội dung, bố cục | P2 | UXD, FE-LP | Thanh nút dính đáy chỉ còn Zalo + "Đặt phòng"; các kênh khác trong mục "Kênh khác"; Facebook ở chân trang + phần liên hệ (chỉ là liên kết, không nhúng plugin Facebook) |
| 5 | Bố cục **rối, chưa mượt** | Thiết kế | P1 | UXD | Làm lại kiến trúc trang: ít mục hơn, nhịp đọc rõ, nhiều khoảng trắng (Brand: Calm) |

## Câu cần INV xác nhận (ý 3)
Đội đề xuất **A**:
- **A.** Ở v1 là **"Yêu cầu đặt phòng"**: khách chọn ngày, số người, hạng phòng, để lại tên + SĐT/Zalo. Yêu cầu vào Desk với nguồn "website" (nút trên Facebook gắn nhãn "website · facebook"). Lễ tân/sale xác nhận qua Zalo, giữ chỗ, gửi QR cọc. Không thanh toán online.
- B. Như A, nhưng khách xem được phòng trống + giá thật trước khi gửi (US-131). Muộn hơn khoảng 1 sprint.
- C. Đặt và trả tiền ngay (cần cổng VNPay/MoMo – ESC-010). Round 4.

Lưu ý pháp lý (ESC-001 LZ-8): website có chức năng đặt hàng có thể phải **thông báo với Bộ Công Thương** trước khi chạy thật. Đội vẫn làm tính năng; chỉ bật trên mạng khi luật sư xác nhận hoặc đã thông báo.

## Xác nhận của INV (17/10/2026)
> "Đồng ý A: yêu cầu đặt phòng vào Desk (nguồn website/facebook), lễ tân xác nhận qua Zalo, chưa thanh toán online."

→ Ý 3 = **A**. Các ý 1, 2, 4, 5 INV không sửa cách hiểu của ORC → làm như bảng trên.
