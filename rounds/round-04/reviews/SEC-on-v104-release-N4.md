# SEC – N4 sau Release v1.0.4 (thông báo khách privacy-2026-10-v2)

- Round 4 – Bước QC (sau Release). Runbook: `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md` N4 / K11. Production `sha-6414be25f20d` từ 06/11 14:10.
- Người kiểm: SEC, 06/11/2026. Chỉ đọc; không mở link khách, không bấm, không gửi gì, không chạm DB.

## Kết luận N4: ĐẠT. Có thể làm N5 (ORC báo INV mở lại check-in online).

| Mục | Nguồn | Kết quả |
|---|---|---|
| K11 (a) | ORC đo trong container `web` | `GW_V2_FILES=1`, `GW_V1_FILES=0` – đạt |
| K11 (b) | ORC đo `SQLRO` sau N3 | `privacy-2026-10-v2` (OWN đặt trên Desk ~14:16; trước đó `default:privacy-2026-10-v1`) – đạt |
| K11 (c) | SEC tải về đọc qua HTTPS (dưới đây) | 21/21 chuỗi khớp – đạt |
| S15–S16 / RG-35 staging | `v1.0.4-staging-drill.md` 5.x | đạt (lượt đồng ý thử vi/en/ru ghi đúng version) |
| Tham số giữ dữ liệu | ORC đọc | `document_profile_retention_months` 3 (≤ 3), `id_image_retention_days_after_checkout` 30 (≤ 90), `id_image_unconfirmed_max_days` 7 (≤ 7), sao lưu ≤ 35 ngày (ops-check `backup`, README) – đạt; khớp câu "3 tháng" và "35 ngày" trong `gw.notice_retention` |
| Tờ ở quầy | INV báo (N2) | Your ID details v2 đã thay – đạt (theo lời INV, SEC không thấy trực tiếp) |

## K11 (c) – cách làm và kết quả
- `curl` GET `https://g.ottimo.vn/` → 200; `index.html` nạp trực tiếp đúng 1 script `/assets/index-DRwYkXaB.js` (200, 244 074 byte). Lưu tạm ở scratchpad, không commit. sha256 (16 ký tự đầu): index `69cec42524f61ef9`, js `4b1e6c1d60bd68c2`.
- Đối chiếu nguyên văn với bảng đã duyệt `product/design/tools/strings-tables.md` nhóm "v1.0.4 P4-42 privacy-2026-10-v2" (4 đoạn) và `product/design/copy/strings-{vi,en,ru}.json` (title, version, read):
  - `gw.notice_body`, `gw.notice_retention`, `gw.notice_translation`, `gw.notice_rights` × vi/en/ru: 12/12 khớp nguyên văn.
  - `gw.notice_title`, `gw.notice_version`, `gw.notice_read` × vi/en/ru: 9/9 khớp.
- Thứ tự 4 đoạn trong cả 3 từ điển và trong chỗ hiển thị: body → retention → translation → rights (đúng SEC 6.2). Từ điển ru có đủ 4 đoạn riêng, không rơi về EN.
- Chuỗi version trong bundle: `privacy-2026-10-v2` 1 lần, `privacy-2026-10-v1` 0 lần (khớp K11 a).
- Các khóa `guest.oci.*` cùng nhóm không nằm trong phạm vi (c) theo giao việc; đã kiểm ở staging S16.

## Còn lại
- K11 (d): SEC chạy sau khách thật đầu tiên đồng ý sau N5 (chỉ số đếm).
- Không ESC mới.
