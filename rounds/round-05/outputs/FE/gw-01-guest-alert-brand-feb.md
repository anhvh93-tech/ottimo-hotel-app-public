# FE-B – GW-01: khung thông tin trên trang khách theo bảng màu OTTIMO (+ ARC 107-01 mock)

- Round 5, bước Phản hồi & sửa · FE-B · 07/11/2026
- Thẻ: FB-R5-UXD-FE-GW-01 (Major, `rounds/round-05/reviews/UXD-on-fe-prs-98-102-107.md` mục 4); FB-R5-ARC-FE-107-01 (Minor, `rounds/round-05/reviews/ARC-on-fe-prs-98-102-107.md` mục 3).
- Nhánh `r5-fe-gw-alert-brand`, cắt từ `origin/main` `75eec566`, đã merge `main` mới (không rebase).

## 1. GW-01 – việc đã làm
- Trang khách chỉ có một khung `Alert tone="info"`: "Lễ tân trả lời từ 07:00" ở tab Yêu cầu, khi khách chọn loại yêu cầu ngoài giờ lễ tân (trước 07:00 hoặc từ 22:00, giờ Đà Lạt).
- Trước: nền `--info-bg` #E0E8EF, viền và icon `--info` #3E5E78 (xanh lam, ngoài bảng màu brand).
- Sau: chỉ thêm một luật trong `product/apps/guest-web/src/styles.css`:
  - `.guest-app .alert.info { background: var(--cream); border-color: var(--sage); color: var(--ink); }`
  - nền Cream #EDE6D8, viền Sage #8A9079 1 px, tiêu đề, nội dung và icon Ink #2B2B28 (icon vẽ bằng `currentColor`).
- Không đụng `@ottimo/ui`, token `--info` hay Desk. Luật gắn vào `.guest-app` nên chỉ áp cho trang khách. Trang khách chỉ có giao diện sáng (DS 11.5).

## 2. Kiểm
- Đo trên trình duyệt thật (mock MSW, 390 × 844, đồng hồ trang cố định 23:30 giờ Đà Lạt), cả VI, EN, RU:

| | Nền | Viền | Chữ / icon |
|---|---|---|---|
| Trước | rgb(224, 232, 239) | rgb(62, 94, 120) | icon rgb(62, 94, 120) |
| Sau | rgb(237, 230, 216) Cream | rgb(138, 144, 121) Sage | rgb(43, 43, 40) Ink |

- axe (WCAG 2.2 AA): 0 lỗi critical/serious ở cả 3 ngôn ngữ, trước và sau. Ink trên Cream đạt tương phản 11,4:1.
- E2E mới `product/tests/e2e/ui/gw-01-guest-alert-brand.r5.spec.ts` (project desk-chromium, stack thật): đơn xác nhận + link khách, đồng hồ trang 23:30, mở tab Yêu cầu → Khác. Ca kiểm `getComputedStyle` của khung (nền Cream, viền Sage, icon và tiêu đề Ink) và chạy axe. jsdom không đọc `var()`, nên ca này không viết bằng vitest. Ở máy không có stack; chạy trên CI.
- `prettier`, `eslint`, `tsc` (guest-web, tests), vitest guest-web xanh.

## 3. Ảnh (mock MSW, dữ liệu giả; SEC kiểm ảnh mới)
- `rounds/round-05/outputs/FE/screenshots/gw-01-request-after-hours-390-vi-before.png`
- `rounds/round-05/outputs/FE/screenshots/gw-01-request-after-hours-390-vi-after.png`
- `rounds/round-05/outputs/FE/screenshots/gw-01-request-after-hours-390-en-before.png`
- `rounds/round-05/outputs/FE/screenshots/gw-01-request-after-hours-390-en-after.png`
- Ảnh chỉ có khách mẫu của mock (link `demo-in-house-link-…`), không có tên, số giấy tờ hay số điện thoại thật.
- Ghi nhận ngoài phạm vi: bản RU của trang dùng chữ EN dự phòng ở nhiều khóa (hành vi có sẵn, không do PR này).

## 4. ARC 107-01 – mock guest-web đúng dạng máy chủ
- `product/apps/guest-web/src/mocks/handlers.ts`:
  - `PUT /v1/guest/online-checkin`, `arrivalNote`: dài hơn 300 ký tự → `VALIDATION_FAILED` + mã trường `TOO_LONG` (trước đây gộp vào mã thẻ); có số thẻ → 422 mã cấp trên `CARD_NUMBER_DETECTED` + `errors[{ field: 'arrivalNote' }]`.
  - `POST /v1/guest/requests`: số thẻ trong `note` và kịch bản `requestFail: 'CARD_NUMBER_DETECTED'` → 422 mã cấp trên `CARD_NUMBER_DETECTED`.
  - Nhánh số giấy tờ giữ `VALIDATION_FAILED` + mã trường `ID_NUMBER_DETECTED`.
- Vitest mới: mock gốc (không `server.use`) trả dạng của máy chủ và trang hiện câu số thẻ. `sensitiveNumberOf` đọc cả hai dạng nên các ca cũ vẫn xanh (guest-web 100/100).
- ARC 107-02 (bỏ `page.route` trong `v5-46-guest-id-number.r5.spec.ts`) thuộc BE-A1 trong PR máy chủ; FE-B review khi BE-A1 gửi.

## 5. Giả định, ESC
- Không có ESC mới.
- Giả định: chỉ một khung `info` trên trang khách hiện nay; khung `info` thêm sau này cũng theo luật này.
