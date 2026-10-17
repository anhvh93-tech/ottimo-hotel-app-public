# Landing page OTTIMO – thiết kế (UXD)

Trang giới thiệu OTTIMO trên tên miền gốc (ví dụ `ottimo.vn` – tên miền thật chờ INV). Khách tìm hiểu, hỏi phòng, chat Zalo. Các app vẫn ở `desk.`, `staff.`, `g.` (`hosting-plan.md` 5.1).

## Trong thư mục
| Tệp | Nội dung |
|---|---|
| `concept.md` | Mục tiêu, đối tượng, sơ đồ trang (12 mục), dàn ý chữ VI, hướng hình ảnh A + biến thể B, bảng ô ảnh, đường ống ảnh + mục tiêu LCP, a11y AA, SEO/Open Graph, đặc tả nút "Đặt phòng" và "Chat Zalo", điểm chạm Zalo OA, dự thảo ESC |
| `mock/index.html` | Mock hi-fi một tệp, ưu tiên điện thoại, tiếng Việt. Mở thẳng bằng trình duyệt |

## Xem mock
- Mở `mock/index.html` bằng trình duyệt (không cần máy chủ). Cần mạng để tải font Google; không có ảnh hay script bên ngoài.
- Thanh "Mock landing" trên cùng (không thuộc trang thật):
  - **Hướng**: A (kem – sồi, đề xuất) / B (đất nung dẫn dắt).
  - **Giao diện**: Tự động / Sáng / Tối.
  - **Nhãn ô ảnh & ghi chú**: hiện hoặc ẩn mã ô ảnh, chip "chờ INV" và ghi chú mock.
- Bấm thử được: ô Hỏi phòng trống (kiểm ngày, soạn tin nhắn), hộp Chat, menu điện thoại, dải ảnh căn, hỏi đáp.
- Ô ảnh trung tính có mã (HERO-01, ROOM-S-01…) – ảnh thật chưa tải từ Drive. Ánh xạ ô ↔ thư mục Drive: `concept.md` mục 6.

## Trạng thái
- v0.1 – 17/10/2026 – bản nháp chờ review (UXR, PO; khuyến nghị FE, DOM, SEC, DATA, OPS).
- Đã kiểm bằng trình duyệt không giao diện (Chromium) ở 320 / 375 / 1280px, sáng/tối, A/B: không cuộn ngang, không trùng id, tham chiếu ARIA đúng, một H1, vùng chạm ≥ 44px (trừ link nằm trong câu).
- Chờ INV: màu chủ đạo (Q1), ảnh và quyền dùng ảnh (Q2), công khai giá (Q3), kênh chat khách nước ngoài (Q4) – `concept.md` mục 15.

## Bước sau
- Ảnh tối ưu (AVIF/WebP/JPEG nhiều cỡ) vào thư mục ứng dụng ARC chốt (`product/apps/booking-web/` đề xuất). **Không** đưa ảnh gốc vào git.
- FE dựng từ mock khi PO đưa story landing vào sprint; dùng token, không dùng màu tùy tiện.
