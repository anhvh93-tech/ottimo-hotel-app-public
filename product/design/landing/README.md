# Landing page OTTIMO – thiết kế (UXD)

Trang giới thiệu OTTIMO trên tên miền gốc (tên miền thật chờ INV). Khách xem hạng phòng, tiện nghi, vị trí rồi gửi **yêu cầu đặt phòng** (về Desk, nguồn website – INV chọn ESC-020 L7-A ngày 17/10) hoặc chat Zalo; WhatsApp/Telegram/Viber nằm trong mục "Other channels". Các app vẫn ở `desk.`, `staff.`, `g.`. Mọi thứ theo **OTTIMO Brand Guidelines v1.0**.

## Trong thư mục
| Tệp | Nội dung |
|---|---|
| `concept.md` | Concept v1.2.1 (theo FB-INV-002 + phản biện thiết kế + SEC UXD-04…08; bảng "đã sửa theo phản biện" ở mục 0.1): định vị boutique stay + lời hứa kép, từ dùng/tránh, sơ đồ 8 mục + bộ lọc quyết định, thang khoảng cách, thẻ phòng, form "Request to book" (trường, lỗi, trang cảm ơn, công tắc chat/request/live, chuyển sang B), kênh chat, kết quả kiểm, bàn giao FE |
| `mock/index.html` | Mock hi-fi v1.2.1 một tệp, EN mặc định + nút VI, ảnh thật, form giả lập gửi. Mở thẳng bằng trình duyệt |
| `mock/img/` | 18 ảnh × 480/960/1600 px × WebP + AVIF (4,54 MB; v1.2 dùng 9 ảnh), `CREDITS.md` (nguồn từng ảnh), `manifest.json` |
| `mock/shots/` | Ảnh chụp v1.2.1: điện thoại 375 px (EN, VI), 320 px, máy tính 1280 px; cả trang (điện thoại tách 2 phần); mục Book và trang cảm ơn – 9 tệp, ~1,4 MB |
| `tools/optimize-images.mjs` | Script sharp: ảnh gốc PNG (ngoài git) → WebP/AVIF, xóa metadata, sinh CREDITS.md |

## Xem mock
- Mở `mock/index.html` (cần mạng cho Google Fonts – chỉ ở mock; bản thật tự host font).
- Nút **EN / VI** trên header đổi ngôn ngữ. Thanh "MOCK" trên cùng có: **Notes** (mã ảnh, chỗ chờ INV, dữ liệu gửi về Desk), **Form: on/off** (xem trạng thái trước khi form được bật – nút Đặt phòng mở Zalo), **Submit** (giả lập kết quả server: gửi được, mất mạng, 503 bận, 429).
- Thu hẹp cửa sổ dưới 768 px để thấy thanh dính đáy (Request to book + Chat on Zalo, cùng thứ bậc với hero; ẩn khi hero, form, mục Liên hệ hoặc chân trang đang trên màn hình) và hàng thẻ phòng vuốt ngang.
- Thử nguồn Facebook: mở `index.html?utm_source=facebook#book`, bật Notes, gửi form.

## Chạy lại ảnh
```
node product/design/landing/tools/optimize-images.mjs            # WebP + AVIF
node product/design/landing/tools/optimize-images.mjs --no-avif  # chỉ WebP
```
Cần ảnh gốc ở `00-brief/context/landing/raw/` (không có trong git).

## Trạng thái
- **v1.2.1 – 17/10/2026** – Phản hồi & sửa theo phản biện thiết kế (N1–N4, T1–T9), SEC UXD-04…08, DOM (tên khóa tham số) và PO: chân trang một dòng; một thứ bậc nút hero = thanh đáy; link Zalo ở header ≥ 768 px; điện nước sang FAQ; câu đồng ý SEC Phụ lục A; form một cách liên hệ, trẻ em theo nhóm tuổi. Đã kiểm 320/375/768/1280 × EN/VI + quét 392 bề rộng: không cuộn ngang, một H1, axe-core 0 lỗi, tương phản thấp nhất 4,53, 0 glyph dự phòng, 0 từ cấm, ngân sách đạt (DPR 2 mở trang 302/320 KB). Chờ ORC trình INV. Trả lời: `rounds/round-02/responses/landing-v12-UXD.md`.
- **v1.2 – 17/10/2026** – theo FB-INV-002 + ghi chú định vị DOM: không nhắc số phòng; boutique stay, lời hứa kép; form yêu cầu đặt phòng (L7-A, chờ INV chọn); Zalo là kênh chính; bố cục 8 mục. Đã kiểm 320/375/1280 × EN/VI + quét 392 bề rộng: không cuộn ngang, một H1, axe-core 0 lỗi (cả trạng thái form lỗi và trang cảm ơn), tương phản thấp nhất 4,53, 0 glyph font dự phòng, 0 từ cấm (concept mục 12). Chờ review UXR, PO; khuyến nghị FE-LP, DOM, SEC, ARC.
- v1.1 – 17/10/2026 – sửa theo kiểm độc lập brand + a11y (concept mục 13.2), chờ review (UXR, PO; khuyến nghị FE, DOM, SEC). Đã kiểm 320/375/1280 px × EN/VI: không cuộn ngang, một H1, tương phản AA mọi cặp (thấp nhất 4,53), axe-core 0 lỗi, 0 glyph font dự phòng, logo đạt cỡ tối thiểu; ngân sách dung lượng theo DPR ở concept mục 11.2.
- Chờ INV: duyệt câu chữ L5 (danh sách ở `concept.md` mục 15.1), bảng ghép tên phòng ↔ căn ↔ hạng, logo SVG, quyền dùng ảnh, giá "từ", link Zalo OA (`concept.md` mục 15).
