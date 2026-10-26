# FB-INV-005 – Giá tháng và giá đêm độc lập, INV tự nhập (đánh giá DOM)

- Tác giả: DOM | Round 3 – Phản hồi & sửa | Ngày: 26/10/2026
- Nguồn: `04-investor-feedback/FB-INV-005.md` (INV 26/10, sau UAT B1); BR v0.4.6 (BR-101, 102, 104, 105, 107, 114, 203); `rounds/round-03/inv-golive-checklist.md` (B2 30/10–01/11, ngày chạy D 02–05/11).
- Kết luận ngắn: **chặn ý INV ở B2 nếu không sửa** (Desk chỉ cho nhập giá tháng, giá đêm khóa = giá tháng ÷ 12). **Phần mềm đã gần sẵn:** CSDL lưu giá đêm riêng từng dòng giá, API `PATCH /rooms/{id}` đã nhận `listPrice.nightlyListPriceVnd` tùy chọn. Chỉ cần **FE mở ô giá đêm** (khoảng 3 giờ) + QA → **đề xuất làm trước B2 (hạn gộp 29/10)**. Phần dọn BE (bắt buộc giá đêm, bỏ hẳn ÷ 12 ở seed/nhập danh mục) để v1.0.1.

## 1. Ý INV và cách hiểu

> "cái giá phòng theo tháng chia 12 để ra giá ngày, tôi muốn 2 cái này là độc lập luôn, tự tôi nhập"

- Bỏ quan hệ "giá đêm niêm yết = giá tháng ÷ 12" (BR-101, ESC-004 phương án B phần giá nền). Mỗi căn có **hai giá do OWN nhập**: giá tháng (dài hạn) và giá đêm (ngắn ngày). Đúng phương án **C** của câu Q1 (BR mục câu hỏi mở, dòng ~712).
- **Không** đụng tới: lịch giá cuối tuần +15 % / ngày đặc biệt +30 % (BR-104), giảm theo số đêm (BR-107), giá OTA nền theo nhóm (BR-103), giá đêm quy đổi dài hạn = tiền thuê HĐ ÷ 30 (BR-102). Giả định này cần INV xác nhận nhẹ → **ESC-036** (mặc định A: lịch giá vẫn cộng trên giá đêm INV nhập).
- Nhược điểm phương án C (đã nêu ở Q1): dễ lệch giữa giá tháng và giá đêm, thêm việc nhập. Giảm bằng cảnh báo mềm trên Desk (mục 4) và việc OWN tự kiểm.

## 2. Ảnh hưởng tới quy tắc (BR v0.4.7 – DOM áp cùng lượt FE/QA, không áp lẻ)

Không áp BR ngay hôm nay: đổi nhãn BR-101 mà oracle/BE test chưa đổi sẽ làm CI đỏ (validator kiểm nhãn INV-004 của 10 dòng BR-101). DOM sửa BR + oracle trong cùng lượt với FE/QA.

| BR | Đổi gì | Mức |
|---|---|---|
| BR-101 | "Giá niêm yết mỗi căn gồm **giá tháng** và **giá đêm**, **OWN nhập riêng**, có ngày hiệu lực (BR-006). Hai giá **độc lập**, hệ thống không suy ra giá này từ giá kia. Giá đêm là giá **đêm ngày thường, kênh Trực tiếp, cho định mức** (BR-110), đã gồm VAT (BR-523); bội số 1.000 (BR-005)." Ví dụ: bảng giá khởi tạo = số hiện hành (101: 8.000.000/tháng · 667.000/đêm …) chỉ là **giá đề xuất** tới khi OWN nhập ở B2. Nhãn: INV 26/10 (FB-INV-005) | Sửa |
| BR-102 | Không đổi công thức (tiền thuê **HĐ** ÷ 30). Thêm một câu: "không liên quan giá đêm niêm yết BR-101" để tránh hiểu nhầm | Chú thích |
| BR-104 | Không đổi. "Giá nền Trực tiếp/CTV = giá đêm niêm yết (BR-101)" – nay là số OWN nhập. Ví dụ 792.000 (căn 202) giữ làm ví dụ | Không |
| BR-105 | Sàn/trần (đang [GIẢ ĐỊNH], chưa code cho giá niêm yết) – đề xuất dùng làm **cảnh báo mềm** khi OWN nhập giá đêm (mục 4) | Gợi ý |
| BR-107, 110, 411–417, 421 | Tính trên giá đêm từng đêm → cơ chế không đổi, số mới theo giá OWN nhập | Không |
| BR-114 | Công thức không đổi (min giá đêm ngày thường Trực tiếp). **Con số "chỉ từ 667.000" phụ thuộc giá đêm căn 101 OWN nhập ở B2** → kiểm lại ngay sau B2, sửa landing cùng ngày nếu khác (BR-114 (3)) | Theo dõi |
| BR-203 | Không đổi (tiền thuê = giá **tháng** × hệ số NN × giảm kỳ hạn). Ví dụ Daniel giữ | Không |
| Mục 13 | `night_from_month_divisor` → **không dùng** (đánh dấu OBSOLETE, ẩn khỏi màn Tham số ở v1.0.1) | Sửa |
| Q1 (câu hỏi mở) | Ghi: 26/10 INV chuyển phần giá nền sang C (FB-INV-005); phần lịch giá giữ B | Lịch sử |

Oracle `br-examples.json`: BR-101-01…10 đổi từ `calc: nightlyListPrice` (÷ 12) sang dòng "giá nhập = giá lưu" (calc null) với số giữ nguyên; BR-114-05 đã ghi chú phụ thuộc. Số giữ nguyên → các oracle dùng 667.000/792.000… **không đổi**.

## 3. Mã nguồn – giá đêm đang suy ra ở đâu

| Chỗ | Hiện trạng | Cần gì |
|---|---|---|
| CSDL `room_list_price` (`services/api/src/db/schema/rooms.ts` dòng 119–143) | Lưu **cả hai cột** `monthly_list_price_vnd`, `nightly_list_price_vnd`, mỗi cột > 0 | Không cần migration |
| Đọc giá khi tính đơn/báo giá (`reservations/public/pricing.service.ts` 67–230, `sales/internal/quote-pricing.ts` 482–489, `reservations/public/stay-night-pricing.ts` 147, `reservations.service.ts` 369) | Đọc thẳng `nightly_list_price_vnd` | Không đổi |
| Dài hạn (`quote-pricing.ts` 376, 497–503) | Đọc `monthly_list_price_vnd` | Không đổi |
| `PATCH /rooms/{id}` (`platform/internal/rooms.service.ts` 414–418; `platform.controller.ts` 108–109; OpenAPI `RoomPatch.listPrice`) | `nightlyListPriceVnd` **tùy chọn**; thiếu thì ÷ `night_from_month_divisor` | **Đủ dùng trước D.** v1.0.1: bắt buộc giá đêm (bỏ nhánh ÷), kiểm bội 1.000. Hiện **chưa có test** nhánh có giá đêm riêng |
| `POST /rooms` (`rooms.service.ts` 278) | Chỉ nhận giá tháng, tự ÷ 12 | Desk không có nút "Thêm căn" → không ảnh hưởng B2. v1.0.1: nhận giá đêm |
| Nhập danh mục / seed (`platform/public/room-catalog-import.ts` 78; `db/seed/ds-e.ts` 329; `tests/fixtures/seed/ds-e.json`) | Tự ÷ 12, so `expectedNightlyListPriceVnd` | Chỉ staging/test. v1.0.1: đọc giá đêm từ fixture |
| `production-bootstrap` (`admin/production-bootstrap.ts` 187) | **Không tạo giá** – "INV enters prices in the app" | Không đổi. Giá thật nhập ở B2 qua Desk |
| `production-defaults.ts` 197 | `night_from_month_divisor` = 12 (INV-004) | v1.0.1: OBSOLETE (như `birthday_code_random_digits`) |
| **Desk "Danh mục căn" → ngăn kéo căn** (`apps/admin-web/src/pages/RoomDrawer.tsx` 74–76, 125–126, 317–327; `app/money.ts` 10) | Ô giá tháng nhập được; **ô giá đêm `readOnly`**, hiện `nightlyFromMonthly(monthly)`; gửi PATCH **chỉ** giá tháng | **Chặn ý INV.** Mở ô giá đêm, gửi cả hai |
| Chữ Desk (`design/copy/strings-vi.json` 950, 953; `strings-en.json` 950, 953) | "Giá đêm niêm yết = giá tháng ÷ 12 … do hệ thống tính", "Tự tính: giá tháng ÷ 12" | Sửa chữ (UXD duyệt) |
| Mock MSW (`apps/admin-web/src/mocks/seed.ts` 144, `handlers.ts` 815) | ÷ 12 | Theo PATCH thật |
| Màn "Tham số" | Hiện `night_from_month_divisor`; đổi số này hiện vẫn đổi giá đêm của lần sửa giá sau | Sau khi FE luôn gửi giá đêm, tham số không còn tác dụng. v1.0.1 ẩn |

## 4. Yêu cầu sửa (đề xuất cho PO/ARC giao)

**Gói D-min – trước B2 (gộp trước 29/10, có trên production image dùng cho B2):**
1. **FE** – `RoomDrawer`: ô giá đêm nhập được như ô giá tháng (định dạng VND, `parseVnd`); điền sẵn giá đêm hiện hành, căn chưa có giá → để trống; **bỏ** tự tính ÷ 12. Đổi một trong hai ô → `priceChanged`, gửi `listPrice` **đủ cả** `monthlyListPriceVnd` + `nightlyListPriceVnd` + ngày hiệu lực + lý do. Kiểm tại ô: rỗng/0 → `AMOUNT_NOT_POSITIVE` (khóa lỗi `listPrice.nightlyListPriceVnd`); không chia hết 1.000 → lỗi tại ô (BR-005). **Cảnh báo mềm, không chặn**: giá đêm < giá tháng ÷ 30 ("giá đêm đang thấp hơn giá thuê tháng quy ra ngày – kiểm lại?"). Sửa mock + test Vitest `rooms.test.tsx` ("nightly price is computed" → "nightly price is entered").
2. **UXD** – chữ VI/EN: `rooms.night_auto` → "Giá đêm ngày thường, kênh Trực tiếp. Cuối tuần, ngày lễ cộng thêm theo lịch giá." (EN tương ứng); `rooms.footnote` → "Giá tháng và giá đêm nhập riêng (BR-101). Đổi giá có ngày hiệu lực; đơn, báo giá đã có giữ giá cũ (BR-006)." Desk là UI nội bộ nhưng vẫn theo Brand Guidelines (Be Vietnam Pro, không emoji, giọng điềm tĩnh).
3. **BE** – không sửa mã. ARC/BE xác nhận nhánh `lp.nightlyListPriceVnd` + thêm 1 test tích hợp `PATCH` có giá đêm riêng (101: tháng 8.000.000, đêm 650.000 → báo giá đêm thứ Ba = 650.000, thứ Bảy = 747.500 → 748.000).
4. **QA** – test API trên; sửa e2e `tests/e2e/serial/platform-mutations.serial.spec.ts` 169–210 (kỳ vọng "10.200.000 ÷ 12" → giá đêm gửi kèm); hồi quy báo giá/đặt phòng/gia hạn đọc giá mới; smoke staging B2 nhập giá cả 10 căn.
5. **DOM** – BR v0.4.7 + oracle BR-101 (mục 2), cùng commit với QA.
6. **CPY/FE-LP** – sau B2, DOM báo con số "chỉ từ" theo giá đêm căn rẻ nhất OWN nhập (BR-114); landing giá chưa đăng trước D nên không chặn.

**Gói v1.0.1 (dọn):** BE bắt buộc `nightlyListPriceVnd` ở `PATCH listPrice` và `POST /rooms` (ARC sửa OpenAPI, sinh lại `api-client`); bỏ nhánh ÷ ở `rooms.service.ts`, `room-catalog-import.ts`; `ds-e.json` thêm giá đêm từng căn (giữ số cũ); `night_from_month_divisor` OBSOLETE, ẩn khỏi màn Tham số; sửa ~6 file test BE (`platform-catalog`, `rbac-sprint1`, `sales`, `be-b-units`, `reservations-pricing`, `helpers/feature-app`).

## 5. Ước công

| Vai | D-min (trước B2) | v1.0.1 |
|---|---|---|
| FE | ~3 giờ (ô nhập, kiểm, cảnh báo, mock, test) | – |
| UXD | ~20 phút (chữ VI/EN) | – |
| BE | ~30 phút (xác nhận + 1 test) | ~3–4 giờ |
| ARC | ~15 phút duyệt | ~30 phút (contract) |
| QA | ~2 giờ | ~2 giờ |
| DOM | ~45 phút | – |
| OPS | 1 lượt build rc + deploy staging/production trước B2 (đi chung lượt sửa khác nếu có) | – |

## 6. Có chặn ngày D không

- **Có, nếu không làm D-min.** B2 (30/10–01/11) là lúc OWN nhập giá thật cho 10 căn trên production. Desk hiện ép giá đêm = giá tháng ÷ 12 – trái ý INV. Không có đường vòng sạch: nhập giá tháng = giá đêm × 12 thì giá tháng sai (BR-203 báo giá dài hạn, HĐ dài hạn dùng giá tháng); OPS/đội không được nhập giá thay bằng tài khoản OWN.
- Nếu không kịp D-min: B2 nhập giá tháng thật, giá đêm tạm = ÷ 12; sau v1.0.1 OWN nhập lại giá đêm với ngày hiệu lực. Rủi ro: mọi đơn/báo giá ngắn ngày tạo trong khoảng này **giữ giá ÷ 12** (BR-006 snapshot), lễ tân phải sửa tay từng đơn; landing "chỉ từ" có thể sai số.
- Rủi ro của D-min thấp: chỉ đổi một màn, CSDL và API đã có sẵn trường, không migration, không đổi luồng tính tiền.
- **Đề xuất: làm D-min trước B2 (P1), dọn BE ở v1.0.1 (P2).**

## 7. Việc cho INV (qua ORC)
- ESC-036 (Bình thường, trước B2): lịch giá cuối tuần/lễ vẫn cộng trên giá đêm anh/chị nhập? Đề xuất A (giữ).
- Mang tới B2 bảng 10 căn × (giá tháng, giá đêm ngày thường). Giá đêm là giá khách trả trực tiếp, đã gồm VAT, cho định mức.
