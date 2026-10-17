# Ảnh landing mock v1 – nguồn và giấy phép

- Chủ sở hữu ảnh: OTTIMO Boutique Stay (INV gửi qua Google Drive "OTTIMO BOUTIQUE STAY", 17/10/2026). Quyền dùng ảnh cho website/quảng cáo: **chờ INV xác nhận** (ESC-020 L6).
- Ảnh gốc PNG nằm ở `00-brief/context/landing/raw/` (ngoài git). Thư mục này chỉ chứa bản đã tối ưu.
- Sinh bằng `product/design/landing/tools/optimize-images.mjs` (sharp): WebP q72 + AVIF q50, rộng 480 / 960 / 1600 px, sRGB, **đã xóa metadata** (EXIF/XMP/ICC). Ảnh có kênh alpha được trải nền Ivory.
- Tên tệp: `<id>-<rộng>.<webp|avif>`. Tổng dung lượng: 4.54 MB (18 ảnh × 3 cỡ × 2 định dạng).
- Kiểm theo SEC (FB-R2-SEC-UXD-02) cho cả 18 ảnh: không người; không cận khóa cửa/bàn phím; không số căn; không màn hình/giấy tờ/Wi-Fi. Ảnh `detail-laundry-desk` có tay nắm khóa điện tử ở xa (không cận, không đọc được hãng) – chấp nhận; `city-living` có khóa cửa nhỏ ở nền – chấp nhận. TV trong phòng chỉ hiện logo OTTIMO – chấp nhận. Tạp chí trên bàn (Kinfolk, Vogue) là đạo cụ, không phải logo đối tác.
- Hạng phòng ghi theo đối chiếu ảnh với trang e-brochure (cột "Trang brochure") – xem `concept.md` mục 6.

| # | ID | Nguồn (thư mục/tệp) | Gốc (px) | Hạng phòng / khu | Trang brochure | Dùng ở | Cỡ lớn nhất |
|---|---|---|---|---|---|---|---|
| 1 | `hero-facade-dusk` | `raw/mat-tien-sanh/04.1.png` | 1792×2432 | Exterior | p33 | Hero (LCP) | 1600×2171 |
| 2 | `lobby` | `raw/mat-tien-sanh/01b.png` | 5704×3803 | Lobby | p31 | About · Lobby | 1600×1067 |
| 3 | `aerial-hillside` | `raw/mat-tien-sanh/05.2.png` | 4164×6250 | Exterior | – | Location | 1600×2402 |
| 4 | `city-living` | `raw/phong-3/03.png` | 5971×3981 | Standard Studio · City View | p8 | Room 01 cover | 1600×1067 |
| 5 | `city-bed` | `raw/phong-3/06.png` | 5821×3880 | Standard Studio · City View | p10 | Room 01 | 1600×1066 |
| 6 | `city-view` | `raw/phong-3/08.png` | 3761×5645 | Standard Studio · City View | p12 | Room 01 | 1600×2401 |
| 7 | `garden-oak` | `raw/phong-1/1.png` | 5978×3979 | Standard Studio · Garden View (light oak) | p14 | Room 02 cover | 1600×1065 |
| 8 | `garden-navy` | `raw/phong-2/05.png` | 5487×3658 | Standard Studio · Garden View (navy) | p19 | Room 02 | 1600×1067 |
| 9 | `garden-balcony` | `raw/phong-1/7.png` | 5739×3826 | Standard Studio · Garden View | p13 | Room 02 | 1600×1067 |
| 10 | `premium-kitchen` | `raw/phong-5/5.png` | 5809×3874 | Premium · One Bedroom + 1 | p23 | Room 03 cover | 1600×1067 |
| 11 | `premium-bed` | `raw/phong-5/2.png` | 5830×3891 | Premium · One Bedroom + 1 | p21 | Room 03 | 1600×1068 |
| 12 | `premium-living` | `raw/phong-5/4.png` | 5718×3827 | Premium · One Bedroom + 1 | p23 | Room 03 | 1600×1071 |
| 13 | `signature-dining` | `raw/phong-4/3.png` | 5628×3756 | Signature · Two Bedrooms | p25 | Room 04 cover | 1600×1068 |
| 14 | `signature-bed` | `raw/phong-4/6.png` | 5793×3870 | Signature · Two Bedrooms | p28 | Room 04 | 1600×1069 |
| 15 | `signature-bath` | `raw/phong-4/5.png` | 5858×3905 | Signature · Two Bedrooms | p27 | Room 04 | 1600×1067 |
| 16 | `detail-laundry-desk` | `raw/phong-2/02.png` | 5831×3889 | Standard Studio · Garden View (navy) | p17 | Why OTTIMO | 1600×1067 |
| 17 | `detail-kitchen` | `raw/phong-1/3.png` | 5706×3804 | Standard Studio · Garden View (light oak) | p15 | Amenities | 1600×1067 |
| 18 | `detail-balcony-sunset` | `raw/phong-2/06.png` | 5804×3857 | Standard Studio · Garden View (navy) | p30 | Location quote | 1600×1063 |
