# Landing page OTTIMO – thiết kế (UXD)

Trang giới thiệu OTTIMO trên tên miền gốc (tên miền thật chờ INV). Khách xem hạng phòng, tiện nghi, vị trí rồi nhắn WhatsApp/Telegram/Viber/Zalo hoặc gọi. Các app vẫn ở `desk.`, `staff.`, `g.`. Mọi thứ theo **OTTIMO Brand Guidelines v1.0**.

## Trong thư mục
| Tệp | Nội dung |
|---|---|
| `concept.md` | Concept v1.1: màu 80/15/5 + bảng tương phản, thang chữ web, logo giữ chỗ, giọng văn, sơ đồ trang, 4 hạng phòng, ánh xạ ảnh ↔ hạng, vị trí, kênh liên hệ, kết quả kiểm, bàn giao FE, câu hỏi cho INV |
| `mock/index.html` | Mock hi-fi một tệp, EN mặc định + nút VI, ảnh thật. Mở thẳng bằng trình duyệt |
| `mock/img/` | 18 ảnh × 480/960/1600 px × WebP + AVIF (4,54 MB), `CREDITS.md` (nguồn từng ảnh), `manifest.json` |
| `mock/shots/` | Ảnh chụp điện thoại 375 px (EN, VI), 320 px và máy tính 1280 px – 6 tệp, 1,35 MB |
| `tools/optimize-images.mjs` | Script sharp: ảnh gốc PNG (ngoài git) → WebP/AVIF, xóa metadata, sinh CREDITS.md |

## Xem mock
- Mở `mock/index.html` (cần mạng cho Google Fonts – chỉ ở mock; bản thật tự host font).
- Nút **EN / VI** trên header đổi ngôn ngữ. Thanh "MOCK" trên cùng có nút **Notes** để hiện mã ảnh và chỗ còn chờ INV.
- Thu hẹp cửa sổ dưới 768 px để thấy thanh liên hệ dính đáy.

## Chạy lại ảnh
```
node product/design/landing/tools/optimize-images.mjs            # WebP + AVIF
node product/design/landing/tools/optimize-images.mjs --no-avif  # chỉ WebP
```
Cần ảnh gốc ở `00-brief/context/landing/raw/` (không có trong git).

## Trạng thái
- v1.1 – 17/10/2026 – sửa theo kiểm độc lập brand + a11y (concept mục 13.2), chờ review (UXR, PO; khuyến nghị FE, DOM, SEC). Đã kiểm 320/375/1280 px × EN/VI: không cuộn ngang, một H1, tương phản AA mọi cặp (thấp nhất 4,53), axe-core 0 lỗi, 0 glyph font dự phòng, logo đạt cỡ tối thiểu; ngân sách dung lượng theo DPR ở concept mục 11.2.
- Chờ INV: bảng ghép tên phòng ↔ căn ↔ hạng, logo SVG, email chung, quyền dùng ảnh, giá "từ" (`concept.md` mục 14).
