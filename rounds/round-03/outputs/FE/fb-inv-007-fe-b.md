# FE-B – Landing: ô số liên hệ luôn ghi "Số điện thoại" – FB-INV-007

- Vai: FE-B | Round 3 – bước Phản hồi & sửa | Ngày: 30/10/2026
- Căn cứ: `04-investor-feedback/FB-INV-007.md`, brand guideline (EN dẫn, VI hỗ trợ, ngắn, không emoji).
- Nhánh `fe/fb-inv-007-phone-label`.

## Đã làm
- Nhãn ô số **luôn** là "Phone number" (EN) / "Số điện thoại" (VI) cho Zalo, WhatsApp và Gọi điện. Giữ nguyên 4 lựa chọn "Reply on / Trả lời qua" (Zalo chọn sẵn, WhatsApp, Gọi điện, Email).
- Bỏ cơ chế đổi nhãn theo kênh: `content/types.ts` khóa `number: { zalo, whatsapp, phone }` → `phoneNumber: string`; `BookingForm.astro` còn một `<label for="f-phone">`; `booking-form.ts` bỏ dòng ẩn/hiện `.c-lab`.
- Gợi ý mã quốc gia **đã có sẵn** dưới ô từ trước, giữ nguyên chữ: "Add the country code if outside Viet Nam, e.g. +44." / "Số nước ngoài, thêm mã quốc gia, ví dụ +44." (không thêm dòng mới).
- Không đổi dữ liệu gửi lên máy chủ (`booking-logic.ts` không sửa; trường `phone`, `preferredChannel` như cũ).

## Kiểm
- Trang privacy không đổi byte. Dựng theo đúng tham số image CI (`LANDING_SITE_URL=https://ottimo.vn LANDING_INDEXABLE=true LANDING_BOOKING_FORM=true LANDING_PROPERTY_SLUG=dlt`), trước và sau khi sửa:
  - `/privacy/` `d35d2810f341c1cf6d4b9079ba1d21281902f259f9ca6b05a4673c188d3c327a`
  - `/vi/privacy/` `940bd18b6701e93dfa520ee87463a776ae0bb98c8d964b2dbd1276767a88776a`
  - So `dist` trước/sau: chỉ đổi `index.html`, `vi/index.html` và tệp script của form.
  - Lưu ý: dựng thiếu `LANDING_SITE_URL`/`LANDING_INDEXABLE` thì băm khác (`79c8d55f…`, `c6dfbb09…`) ngay cả trên `main` – không phải do bản sửa này.
- Test mới TC-LP-036 (`tests/e2e/landing/form.landing.spec.ts`), EN và VI ở 390 px: 4 lựa chọn, Zalo chọn sẵn; qua Zalo/WhatsApp/Gọi điện nhãn vẫn đúng một chữ, gợi ý đúng chữ; nhãn và gợi ý nằm trong cột ô, không cuộn ngang.
- Vitest landing 208/208; Playwright landing (axe, CSP, budget) 56/56; `astro check` 0 lỗi; eslint, prettier sạch.

## Giả định
- UXD chưa có bản chốt chữ riêng cho FB-INV-007: dùng chữ "Phone number"/"Số điện thoại" có sẵn trong bộ chữ (đã duyệt cho kênh Gọi điện) và gợi ý mã quốc gia có sẵn. UXD/QA rà ở bước Kiểm thử.

## Việc chưa xong
- Phát hành: tag landing mới + INV duyệt Release; OPS so băm 2 trang privacy với `state/privacy-notice.log` trước khi duyệt (số ở trên).
