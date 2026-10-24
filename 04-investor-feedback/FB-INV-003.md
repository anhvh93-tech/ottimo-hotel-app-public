# FB-INV-003 – Góp ý landing ottimo.vn sau khi lên mạng

- Ngày: 24/10/2026 · Round 3 (đường nhanh v1.0) · Ghi bởi: ORC
- Bản xem: https://ottimo.vn (landing LP-v1, `main` 794e6f1, lên mạng 24/10 08:28)

## Nguyên văn
> landing page, cái yêu cầu đặt phòng nó chưa đúng so với việc chuyển request về cho trang quản trị.
> Cái hình chuyển trên đầu nó chưa phải là hình tôi ưng ý. tôi muốn duyệt lại hình, lựa những tấm hình thể hiện công năng và topview, đừng để thấy cây lung tung.

## Phân loại
| # | Ý | Loại | Ưu tiên | Vai | Xử lý |
|---|---|---|---|---|---|
| 1 | Mục "Yêu cầu đặt phòng" (`#book`) chỉ có nút Zalo / gọi điện; INV muốn khách gửi yêu cầu và yêu cầu vào thẳng Desk (đúng FB-INV-002 ý 3, US-155) | Tính năng (đã có trong backlog) | P1 | BE-D, FE-B, FE-LP, SEC | US-155 đã code xong ở nhánh riêng (server BE-D, màn S35 FE-B, form landing có sẵn bản `build:booking-preview`) nhưng để v1.1 vì yêu cầu phải vào **Desk thật** (production chưa dựng) và điều kiện US-155 AC4. ORC trình INV phương án |
| 2 | Ảnh chạy đầu trang chưa ưng: chọn lại ảnh thể hiện **công năng** và **góc nhìn từ trên xuống**, **không thấy cây lung tung** | Nội dung | P2 | UXD, FE-LP | ORC gửi bảng 45 ảnh gốc đánh số (`rounds/round-03/outputs/UXD/landing-photo-picker.html`); INV chọn số → FE-LP thay `HERO_SLIDES`, phát hành bằng tag `landing-v*` (INV duyệt) |

## Trạng thái
- Ý 1: chờ INV chọn phương án.
- Ý 2: chờ INV gửi số ảnh.
