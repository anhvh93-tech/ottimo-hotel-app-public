# FE-B – Gói 2 phần trang khách: V5-24 (tiếng Nga, font và CSP), V5-23 và V5-20 phần khách

- Round 5 (v1.0.5), bước Sản xuất · FE-B · 07/11/2026
- Việc: plan R5 bảng Gói 2 (V5-20, V5-23, V5-24), mục 4a T20. Chữ: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 1, 4.6, 4.15, 4.16, 4.20, 4.21, 5.1–5.3 (bản 2.6), CPY duyệt ở `rounds/round-05/reviews/CPY-on-uxd-copy-v1.0.5.md` (C1, C2, C5, thẻ 01, 02, 06–10).
- Nhánh `r5-feb-g2-guest`, cắt từ `origin/main` `78024f17`. Chỉ đụng guest-web, tệp chữ chung và test E2E của trang khách. Không đụng admin-web.

## 1. Đã làm

### 1.1 V5-24 – 7 chuỗi RU có từ cấm "апартаменты" (mục 5.1, CPY C1)
Chữ lấy nguyên văn từ bảng chữ: script đọc thẳng tệp `copy-v1.0.5.md` rồi so với chữ cũ, chỉ cho đổi đúng chỗ bảng ghi.

| Khóa | Đổi | Ghi chú |
|---|---|---|
| `guest.stay.checkin_time` | RU: "номер всегда готов к 14:00" | Trang khách, tab Lưu trú và Thông tin |
| `guest.oci.done_body` | RU: "если номер уже готов; к 14:00 он готов всегда" | Trang khách, xong làm thủ tục trước |
| `gw.room` | RU: "Номер" | Không còn mã nào dùng; xóa khóa ở v1.0.6 (4.20 c) |
| `sale.quote_text` | RU dòng 2 "Номер {room}", dòng 4 "Предоплата, чтобы закрепить номер: {deposit}." (thẻ 01); VI dòng 2 "Phòng {room}" (4.20 a) | Sinh lại `services/api/src/generated/quote-copy.ts` bằng `gen-quote-copy.mjs`, `--check` xanh |
| `msg.booking_confirmed` | RU "номер", "Предоплата {deposit} получена, остаток {balance} — при заселении" (thẻ 08); VI "phòng {room}" (4.20 b) | Mẫu tin, chưa có mã nào gọi |
| `msg.deposit_received` | RU "номер {room}"; VI "phòng {room}" | Như trên |
| `msg.hot_water_issue` | EN, VI, RU theo thẻ 06 (bỏ "!", "в номере") | Như trên |

Thêm `gw.req.clean_long_fee` (thẻ 09): RU "При долгом проживании уборка не входит в стоимость…", EN "Cleaning isn't included in long stays…", VI giữ.

Không chuỗi nào trong bản thông báo dữ liệu (`gw.notice_*`) có từ cấm, đúng như mục 5.1 ghi, nên không có chuỗi nào phải chờ B-PN.

### 1.2 V5-24 – font chữ Nga ở ô mã và Wi-Fi bị CSP chặn (mục 5.2, BUG-R4-017)
- Nguyên nhân: Vite nhúng tệp dưới 4 KB thành `data:`. Bị nhúng có 6 tệp JetBrains Mono: Cyrillic-ext 400/500 (woff2 và woff), Vietnamese 400/500 (woff2). CSP `font-src 'self'` chặn `data:`: 6 lỗi console mỗi lần tải, mặt Cyrillic-ext lỗi hẳn. Mặt tiếng Việt vẫn tải được nhờ bản `.woff` là tệp.
- Ghi cho QA: đo trên trình duyệt thật, chữ Nga cơ bản (U+0400–045F, ví dụ "Ж") **đã** hiện bằng JetBrains Mono từ trước, vì tập `cyrillic` 5,3 KB không bị nhúng. Chỉ chữ thuộc tập Cyrillic-ext (ví dụ "Ѣ") rơi về font dự phòng. Mô tả "tập Kirin không tải được" ở BUG-R4-017 là phần Cyrillic-ext.
- Sửa: `product/apps/guest-web/vite.config.ts`, `build.assetsInlineLimit` dạng hàm, trả `false` cho `.woff` và `.woff2`, các tệp khác giữ mặc định của Vite. Mọi font tự host là tệp dưới `/assets/`.
- **Không đổi CSP.** `Caddyfile.prod`, `expected-headers.sh` giữ `font-src 'self'`. SEC xem lại cách sửa.
- Không đổi token, cỡ chữ, màu. JetBrains Mono vẫn là `--mono`, gồm tập Kirin và tiếng Việt, mặt 400 và 500.
- Phạm vi: chỉ guest-web. admin-web là việc của FE-A, PWA nhân viên là việc của MOB (mục 5.2 ý 1).

### 1.3 V5-23 – phần trang khách
- **BUG-R2-218** (mục 4.6, CPY C2, thẻ 10):
  - `gw.lang_auto` 3 ngôn ngữ: "You can change the language at the top of the page." / "Bạn có thể đổi ngôn ngữ ở đầu trang." / "Язык можно сменить вверху страницы." Câu không nói ngôn ngữ lấy từ đâu.
  - Khóa mới `gw.lang_auto_sr` ("Language selected for you" / "Ngôn ngữ đã chọn sẵn cho bạn" / "Язык выбран автоматически"): mô tả `#gw-lang-state` của ô chọn ngôn ngữ (GuestShell) khi khách chưa tự chọn. Dòng dưới lời chào (HomePage) vẫn dùng `gw.lang_auto`.
  - Đóng BUG-R2-218 trong `tests/e2e/support/known-bugs.ts`. TC-L7-053 bỏ `knownBug`, nay kiểm đúng câu `gw.lang_auto`, mô tả `gw.lang_auto_sr` của ô chọn, và trang không có "trình duyệt".
- **"căn" → "phòng"** (mục 4.20 a, bắt buộc): `gw.req.clean_makeup_free`, `gw.req.clean_second_fee` VI; `sale.quote_text` VI dòng 2 (mục 1.1).
- **Dấu "!"** (mục 4.21, nên có, cùng lượt C5): `msg.house_rules_smoking` 3 ngôn ngữ, `msg.bill` RU, `guest.late.done_title` EN, VI. Lời chào RU "Здравствуйте, {name}!" giữ.
- **U+2011 cho "2-step"** (mục 4.15): rà `strings-en.json`, cả 25 khóa đều là chữ Desk hoặc nhân viên (`auth.*`, `mfa.*`, `users.*`, `secmail.*`…). Trang khách không dùng khóa nào. **Không có phần khách**, để FE-A.
- **Câu mục đích xử lý dữ liệu** (mục 4.16): là ô email nhân viên trên Desk, không có trên trang khách. **Không có phần khách.**

### 1.4 V5-20 – phần trang khách
Rà mọi khóa guest-web ship (`guest.*`, `gw.*`, `common.*`, `error.*`, `field.*`, `shell.*`, chỉ khóa có trong mã nguồn) và landing-web: không có "Từ 28 đêm…", `stay.long_hint`, `field.LONG_STAY_REQUIRES_CONTRACT` hay "+15 %". booking-web mới có README, chưa có mã. **Không có phần khách**, cả V5-20 là chữ Desk của FE-A.

### 1.5 Kiểm tự động chữ khách (mục 5.3)
Test mới `product/apps/guest-web/src/__tests__/guest-copy-lint.test.ts` đọc đủ `strings-{vi,en,ru}.json`, nhóm `guest.*`, `gw.*`, `msg.*`, `sale.quote_text*`, `bill.line.*`. Bật bước 1–4 vì phần chữ của các bước đó đã áp trong PR này:
1. RU không có `апартамент|квартир|посуточн` (cùng danh sách `landing-web/scripts/dist-checks.mjs`);
2. RU không có "депозит";
3. VI không có "căn" đứng riêng, chừa 6 khóa 4.20 (c) tới v1.0.6. Có thêm một ca báo khi khóa nào trong danh sách chừa đã sửa xong, để người sửa bỏ khỏi danh sách;
4. không "!" và không emoji ở cả 3 ngôn ngữ, RU chừa đúng lời chào `^Здравствуйте, \{name\}!`.

Bước 5 (`phụ thu`) để `it.todo` tới C6 (v1.0.6).

## 2. Kiểm

| Kiểm | Kết quả |
|---|---|
| Vitest guest-web | **12 tệp, 110 ca đạt, 1 todo** (trước: 10 tệp, 100 ca). Mới: `v5-24-ru-copy.test.tsx` (3 ca: RU tab Lưu trú + Thông tin, RU dọn dài hạn, VI dọn bù); `guest-copy-lint.test.ts` (6 ca + 1 todo); `bundle.test.ts` thêm 1 ca font |
| Ca font trong `bundle.test.ts` | Build thật guest-web: CSS không còn `data:font`; mọi `url(…woff2?)` là `/assets/…` và tệp có trong bản build; đủ JetBrains Mono Cyrillic, Cyrillic-ext, Vietnamese × 400, 500 × woff2, woff. Đặt lại giới hạn 4096 thì ca đỏ (đã thử) |
| Trình duyệt thật, CSP production (Chromium, bản build tĩnh, cổng 5354, không gọi API) | Trước sửa: 6 lỗi `font-src` (khớp QA), 2 mặt Cyrillic-ext `error`, `document.fonts.check('… "JetBrains Mono"', 'Ѣ')` = false. Sau sửa: 0 lỗi CSP, 0 mặt lỗi, 8 mặt được dùng đều `loaded`, `check` với A, Ж, Ѣ, ạ ở 400 và 500 đều true |
| E2E mới `product/tests/e2e/ui/v5-24-guest-ru-font.r5.spec.ts` (desk-chromium, stack thật) | Thêm đúng CSP của `Caddyfile.prod` vào trang (stack CI dùng `Caddyfile.dev`, không có CSP), khách hồ sơ RU: 0 vi phạm `font-src`, mọi mặt JetBrains Mono tải được, chữ "номер", không "апартаменты", axe 0 critical/serious. Ở máy không chạy stack (máy đang có stack của vai khác); **chạy trên CI** |
| TC-L7-053 (guest-web.h18) | Bỏ `test.fail`; chạy trên CI |
| `gen_strings.py` | Sinh lại, "Copy is generated" sạch; `gen-quote-copy.mjs --check` xanh; test API `bug-r4-009-plurals`, `be-b-s2-units` 22/22 |
| Grep sau khi áp (mục 8) | `strings-ru.json`, `quote-copy.ts`: 0 "апартамент", "Депозит", "аренд". `quote-copy.ts` VI và `gw.req.clean_*`: 0 "căn" đứng riêng. 3 mẫu `msg.*` VI không còn "căn" |
| prettier, eslint, tsc (guest-web, tests) | Sạch (eslint còn 1 cảnh báo cũ ở `public/mockServiceWorker.js`) |

## 3. Tệp
- `product/design/tools/gen_strings.py` (+ sinh lại `design/copy/strings-{vi,en,ru}.json`, `design/wireframes/assets/strings.js`, `design/tools/strings-tables.md`)
- `product/services/api/src/generated/quote-copy.ts` (sinh lại)
- `product/apps/guest-web/vite.config.ts`, `src/pages/GuestShell.tsx`, `src/pages/HomePage.tsx`
- `product/apps/guest-web/src/__tests__/bundle.test.ts`, `requests.test.tsx`, mới `v5-24-ru-copy.test.tsx`, `guest-copy-lint.test.ts`
- `product/tests/e2e/ui/guest-web.h18.spec.ts`, `product/tests/e2e/support/known-bugs.ts`, mới `product/tests/e2e/ui/v5-24-guest-ru-font.r5.spec.ts`

## 4. Giả định, rủi ro, việc chưa xong
- Không ESC. Không đổi CSP.
- Giả định: FE-B làm cả `sale.quote_text` (RU dòng 2, 4 và VI dòng 2) cùng một lượt, vì đây là một khóa và bảng chữ ghi "sinh lại `quote-copy.ts` cùng lượt với bản RU". FE-A (`r5-fe-g2-booking`) không sửa lại khóa này; nếu đã sửa, chữ phải trùng từng ký tự thì gộp mới sạch.
- Giả định: làm luôn phần "nên có" của lượt C5 (4.20 b, 4.21, thẻ 06, 08) vì đều là chữ khách CPY đã duyệt, cùng nhóm `TEMPLATES`, không có mã nào gọi.
- Ngoài phạm vi, chuyển UXD: `design/content-guide.md` còn chép chữ cũ (bảng `msg.*`, `guest.stay.checkin_time`, `guest.oci.done_body`, `gw.req.clean_makeup_free`, `gw.lang_auto`), cần dán lại `strings-tables.md`. `design/hifi/23-guest-requests.html` còn câu cũ trong khung mẫu.
- Ngoài phạm vi, chuyển FE-A và MOB: cùng cách sửa font ở `apps/admin-web` và `apps/mobile` (mục 5.2 ý 2, 4).
- Ảnh: không chụp, không commit ảnh.
