# UXD review – FE-B PR #167 @ `838be376` (Gói 2 phía khách: V5-23, V5-24)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng: PR #167 (`r5-feb-g2-guest`) @ `838be376`, merge base `fc4c2b08`. Báo cáo FE-B `rounds/round-05/outputs/FE/v5-24-g2-guest-feb.md`.
- Đối chiếu: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 2.7 – mục 4.6 (`gw.lang_auto`, `gw.lang_auto_sr`), 4.20 (a)(b), 4.21, 5.1, 5.2, 5.3, 8.
- Cách kiểm: worktree tạm của `refs/pull/167/head` trong scratchpad; script so từng byte giá trị trong copy với `strings-{vi,en,ru}.json` của PR (khóa "giữ nguyên" so với merge base); grep mục 8; guest-web mock (Vite, cổng 5363) mở bằng Playwright headless ở **390 px**, RU/EN/VI theo Accept-Language, các lý do phí dọn được bật bằng cờ cục bộ trong mock (không đẩy lên PR); build production rồi phục vụ `dist` với đúng CSP của `Caddyfile.prod`. Ảnh chụp chỉ để trong scratchpad, không commit.

## 0. Kết luận

**DUYỆT.** Chữ đúng từng byte, giao diện 390 px không tràn ở cả 3 ngôn ngữ, font JetBrains Mono tải đủ dưới CSP production và CSP không bị nới. Hai thẻ dưới đây đều là lỗi có từ trước, **không chặn #167**.

Trước khi gộp: #167 phải gộp `main` một lần nữa và chạy lại `gen_strings.py`. Gộp thử với `main` @ `8700dd82` chỉ xung đột ở `wireframes/assets/strings.js` (tệp sinh một dòng). Sinh lại thì hết xung đột, 31/31 kỳ vọng vẫn đúng.

| Thẻ | Mức | Nội dung | Chặn #167 |
|---|---|---|---|
| FB-R5-UXD-FEB-167-01 | Minor | Trang Yêu cầu ở RU phần lớn là tiếng Anh (25 khóa `gw.req.*`/`guest.req.*`, nhãn tab `guest.tab.requests`), dòng EN dự phòng không gắn `lang="en"` | Không (có từ trước) |
| FB-R5-UXD-FEB-167-02 | Minor | RU `guest.oci.done_title`: "До встречи 9 нояб.." – hai dấu chấm | Không (có từ trước) |

## 1. So chữ từng byte

- 31 kỳ vọng, **0 lệch**, không có thay đổi nào ngoài copy.
- Khóa đổi so với merge base: VI 10, EN 6, RU 12; không xóa khóa nào.
  - 4.6: `gw.lang_auto` EN/VI/RU viết lại (không nói "theo trình duyệt"), `gw.lang_auto_sr` mới cho `#gw-lang-state`.
  - 4.20 (a)(b): `gw.req.clean_second_fee`, `gw.req.clean_makeup_free`, `sale.quote_text`, `msg.booking_confirmed`, `msg.deposit_received`, `msg.hot_water_issue` VI "căn" → "phòng". Khóa 4.20 (c) (`gw.room` VI, `bill.line.*`) giữ tới v1.0.6.
  - 4.21: bỏ "!" ở `guest.late.done_title`, `msg.house_rules_smoking`, `msg.hot_water_issue`; RU "Здравствуйте, {name}!" giữ đúng ngoại lệ.
  - 5.1: 7 chuỗi RU "номер"; `sale.quote_text` RU dòng 4 "Предоплата, чтобы закрепить номер: {deposit}…"; `gw.req.clean_long_fee` RU "При долгом проживании уборка не входит в стоимость…", EN "Cleaning isn't included in long stays…", VI giữ nguyên.
- Mục 8: `strings-ru.json` và `quote-copy.ts` 0 "апартамент", 0 "Депозит"; `clean_long_fee` RU không còn "аренд"; không còn "căn" đứng riêng trong khóa 4.20 (a)(b); `quote-copy.ts` mang `sale.quote_text` VI và RU mới.
- Kiểm tự động 5.3 (bước 1–4) có trong `guest-copy-lint.test.ts`.

## 2. Trang khách ở 390 px

| Màn | RU | EN | VI |
|---|---|---|---|
| Trang chủ: dòng `gw.lang_auto` dưới lời chào | "Язык можно сменить вверху страницы." | "You can change the language at the top of the page." | "Bạn có thể đổi ngôn ngữ ở đầu trang." |
| `#gw-lang-state` (sr-only) | "Язык выбран автоматически" | "Language selected for you" | "Ngôn ngữ đã chọn sẵn cho bạn" |
| Lưu trú `guest.stay.checkin_time` | "…(номер всегда готов к 14:00)" | đúng | đúng |
| Check-in online xong `guest.oci.done_body` | "…если номер уже готов…" | đúng | đúng |
| Yêu cầu dọn – lần hai có phí | đúng chữ 5.1 | đúng | "Phòng đã được dọn đầy đủ lúc 10:15…" |
| Yêu cầu dọn – dài hạn | "При долгом проживании…" | "Cleaning isn't included in long stays…" | giữ nguyên |
| Yêu cầu dọn – dọn bù miễn phí | đúng | đúng | "Hôm nay phòng chưa được dọn…" |

- `scrollWidth` = `clientWidth` = 390 ở mọi màn đã mở; câu dài nhất của thẻ phí xuống dòng gọn trong thẻ 358 px.
- Thẻ Wi-Fi (link đang ở) hiện `.mono` đúng font, không lệch dòng.

## 3. Font (5.2, BUG-R4-017)

- `vite.config.ts`: `build.assetsInlineLimit` là hàm, trả `false` cho `.woff`/`.woff2`, tài sản khác giữ mặc định. CSP không đổi (`font-src 'self'`).
- Build production: CSS 0 `data:font`; 24 tệp `jetbrains-mono-*.woff(2)` dưới `/assets/`.
- Phục vụ `dist` với CSP của `Caddyfile.prod`: `document.fonts.load` cho mặt 400 và 500 tải đủ 4 tập (latin, cyrillic, cyrillic-ext, vietnamese); `check` với A, Ж, Ѣ, ạ đều `true`; **0** vi phạm `securitypolicyviolation`, 0 lỗi console về font.
- Còn lại: kiểm trên staging theo 5.2 bước 5 (QA). `admin-web` và `apps/mobile` là phần của FE-A, MOB, không thuộc #167.

## 4. Thẻ

### FB-R5-UXD-FEB-167-01

- Mức độ: Minor
- Vị trí: `apps/guest-web` trang Yêu cầu khi locale = `ru`; `strings-ru.json` thiếu `guest.tab.requests`, `guest.req.title`, `guest.req.clean`, `gw.req.clean_what`, `gw.req.empty_body`, `gw.req.fee_accept`, `gw.req.note_help`… (RU có 10/35 khóa `gw.req.*`).
- Vấn đề: khách RU thấy tab "Requests", ô "Extra cleaning", câu "Includes cleaning…" bằng tiếng Anh, ngay cạnh câu phí đã dịch. Dòng dự phòng EN nằm trong `lang="ru"`, nên trình đọc màn hình đọc tiếng Anh bằng giọng Nga, trái ghi chú content-guide mục 8 ("hiện EN, gắn `lang="en"`").
- Vì sao quan trọng: khách RU là thị trường của OTTIMO; một màn trộn hai ngôn ngữ trông chưa xong.
- Đề xuất sửa: v1.0.6. UXD viết RU cho các khóa còn thiếu của trang Yêu cầu, CPY và người bản ngữ duyệt. FE-B gắn `lang="en"` cho chuỗi rơi về EN (ví dụ `t` trả cờ dự phòng).
- Trạng thái: Open – không chặn #167.

### FB-R5-UXD-FEB-167-02

- Mức độ: Minor
- Vị trí: `guest.oci.done_title` RU "Всё готово. До встречи {date}." với `shortDate` RU dạng `month: 'short'`.
- Vấn đề: hiện "До встречи 9 нояб.." (hai dấu chấm). Tháng 5 ("мая") lại không có dấu chấm, nên sửa câu mẫu riêng không đủ.
- Đề xuất sửa: ở tiêu đề này, RU dùng `{ day: 'numeric', month: 'long' }` ("9 ноября"), câu mẫu giữ nguyên. v1.0.6, hoặc cùng lượt nếu FE-B còn sửa #167.
- Trạng thái: Open – không chặn #167.

## 5. Điểm làm tốt

- `gw.lang_auto_sr` tách khỏi dòng hiển thị đúng 4.6, `aria-describedby` không đổi chỗ.
- Test `v5-24-ru-copy` và E2E `v5-24-guest-ru-font.r5` đọc CSP thẳng từ `Caddyfile.prod`, kiểm từng tập glyph: đúng cách kiểm 5.2.
- Lint chữ khách bật theo đúng thứ tự 5.3, chừa đúng ngoại lệ RU.

## 6. Việc phụ (FE-B báo, đã sửa trên `main`, commit riêng `dac31798`)

- `product/design/content-guide.md` v0.4.8: mục 8 dán lại toàn bộ từ `strings-tables.md` (`main` + #167, gộp thử rồi sinh lại).
- `product/design/hifi/23-guest-requests.html`: 2 câu dọn phòng VI "căn" → "phòng".

## Dòng decision-log

| 2026-11-07 | 5 | **UXD – review FE-B #167 @ 838be376: DUYỆT.** Chữ 31/31 đúng từng byte theo copy-v1.0.5 4.6, 4.20 a b, 4.21, 5.1; grep mục 8 sạch; 390 px RU/EN/VI không tràn; font JetBrains Mono tải đủ 4 tập dưới CSP production, CSP không nới. Gộp lại `main` và chạy `gen_strings.py` trước khi gộp (xung đột chỉ ở `strings.js`). Thẻ 167-01, 167-02 Minor, có từ trước, v1.0.6. Không ESC | UXD | rounds/round-05/reviews/UXD-on-feb-pr-167.md |
