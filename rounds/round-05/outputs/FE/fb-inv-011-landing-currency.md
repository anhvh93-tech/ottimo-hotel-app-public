# FE – FB-INV-011 landing: giá ước tính theo tiền tệ của ngôn ngữ (Round 5 – Sản xuất)

Nhánh `r5-fb011-fe-currency`. Hợp đồng: `rounds/round-05/fb-inv-011/contract.md` (khối `fx` tùy chọn của `getPublicMonthlyRates`). Phụ thuộc PR BE `r5-fb011-be-fx`, nhưng merge độc lập được: thiếu `fx` thì trang y như hiện nay (chỉ VND).

## Đã làm
- `src/scripts/fx.ts` (mới, logic thuần): en→USD, ko→KRW, zh→CNY, ru→RUB, vi→không quy đổi. `fxQuote()` đọc `fx` từ body dạng `unknown` (không phụ thuộc type sinh từ OpenAPI). Trả `null` (chỉ VND) khi: không có `fx`/`null`, `base` khác VND, thiếu mã tiền của trang, tỷ giá không phải số hữu hạn, nằm ngoài khoảng hợp lý, `asOf` sai định dạng/ngày không có thật, cũ hơn 7 ngày, hoặc sớm hơn hôm nay quá 1 ngày.
- Quy đổi = VND ÷ rate, làm tròn LÊN theo bước của hợp đồng (USD 1, KRW 1.000, CNY 1, RUB 100); có chặn nhiễu dấu phẩy động (thương chẵn không bị đẩy lên). Định dạng `Intl.NumberFormat` theo locale của trang (`style: currency`, 0 số lẻ): en `US$334`, ko `₩468,000`, zh `¥2,415`, ru `29 400 ₽`.
- Thẻ phòng (`room-prices.ts`): dưới dòng "From 8,500,000 VND / month" thêm 2 dòng tạo bằng `textContent`: "≈ US$334 / month" và "Estimate at the 17 Nov 2026 rate. Payment in VND." Gọi lại không nhân đôi; không có tỷ giá thì gỡ 2 dòng.
- Ô giá trong form (`price-estimate.ts` + `monthlyView`/`estimateView`): cùng 2 dòng ngay dưới số VND (cả khi hiện số "From" của monthly-rates trước khi chọn ngày, lẫn khi có báo giá theo ngày). Dòng tổng tiền giữ VND.
- Chuỗi 5 ngôn ngữ (`booking-strings/*.ts`, khóa `estimate.fx`): giọng brand, không emoji, không "!". VI có chuỗi nhưng không bao giờ hiện.
- CSS trong file riêng `src/styles/fx.css` (import ở `Rooms.astro`, `BookingForm.astro`), chỉ token brand (Stone Grey, cỡ 15 px như dòng ghi chú). Cố ý KHÔNG sửa `landing.css` để stylesheet chung của `Base` – và byte trang `/privacy/` – không đổi.

## Kiểm thử
- Unit (vitest): `fx.test.ts` (12 ca: chọn tiền theo ngôn ngữ, thiếu/hỏng `fx`, số lạ, tuổi tỷ giá, làm tròn lên, nhiễu float, chuỗi 5 ngôn ngữ, view form không đổi khi không có tỷ giá); thêm ca vào `room-prices.test.ts` (có/không fx, không nhân đôi, textContent chống chèn HTML) và `price-estimate.test.ts` (ô form có/không fx). Toàn bộ landing-web: 321/321.
- Playwright `tests/e2e/landing/fx.landing.spec.ts`: TC-LP-080 × 5 ngôn ngữ ở 360 px (thẻ + ô form, không tràn ngang, không phần tử nào ra ngoài ô giá, axe 0, CSP 0, console sạch); TC-LP-081 × 6 (không fx, fx null, cũ 8 ngày, thiếu USD, USD = 0, USD dạng chuỗi → chỉ VND, không có "≈"). Cả bộ landing: 164/164.
- Byte trang privacy (3 bản build `dist`, `dist-booking-preview`, `dist-booking-live`): sha1 trước/sau giống hệt.

## Giả định
- Khoảng tỷ giá hợp lý (VND/1 đơn vị): USD 10.000–65.000, KRW 7–50, CNY 1.400–9.000, RUB 100–800. Ngoài khoảng → chỉ VND (chặn gõ nhầm khi OWN ghi đè trên Desk).
- Chấp nhận `asOf` sớm 1 ngày so với "hôm nay" theo múi giờ khách sạn.
- Ngày trên chú thích: en "17 Nov 2026", ko "2026년 11월 17일", zh "2026年11月17日", ru "17.11.2026" (dạng ngắn tiếng Nga kết thúc bằng "г." sẽ thành "г.." trước câu sau).
- Chỉ quy đổi số theo tháng; dòng tổng nhiều tháng vẫn chỉ VND. Dòng trạng thái cho trình đọc màn hình giữ nguyên (đọc VND).
- Bản dịch ko/zh/ru do FE viết theo giọng brand; nên để CPY rà ở bước Review.

## Rủi ro / việc chưa xong
- Nếu monthly-rates trả về chậm hơn lần báo giá đầu tiên của form, ô form chưa có dòng "≈" cho tới lần đổi giá trị tiếp theo (hiếm, giới hạn 3 s).
