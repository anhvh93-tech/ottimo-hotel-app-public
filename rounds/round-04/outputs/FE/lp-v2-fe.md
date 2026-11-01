# FE-B – LP-v2: landing ko/zh/ru, nút chọn ngôn ngữ, giá ước tính trong form

- Vai: FE (FE-B, landing) | Round 4 – gói LP-v2 – Bước Sản xuất (code) | Ngày 01/11/2026
- Nhánh: `lp-v2-fe` (từ `origin/lp-v2`, OpenAPI 0.3.9-draft). Chưa merge, không đụng `main`, không deploy.
- Căn cứ: ARC `outputs/ARC/lp-v2-design.md` (FE-B-1…FE-B-5), UXD `outputs/UXD/lp-v2-design.md`, CPY `outputs/CPY/lp-v2-copy.md` (gồm mục 12 – ESC-043 trên `main`), SEC `outputs/SEC/lp-v2-privacy-and-api.md` (gồm Lượt 2 – ESC-044 trên `main`), BE `origin/lp-v2-be` (477552ca + 63c5731e – `monthly_offer`, `outputs/BE/lp-v2-be.md` mục 6), cập nhật ORC 01/11.
- Brand: chỉ bảng màu 80/15/5 (dist-checks đạt), Lora / Be Vietnam Pro dẫn; ngoại lệ chữ theo UXD 1.7 (Onest cho thân trang Nga, Noto KR/SC cho chữ Hàn/Trung). Không emoji, không "!".

## 1. Đã làm

| # | Việc | Kết quả |
|---|---|---|
| FE-B-1 | 5 ngôn ngữ, route động | `LANGS = en, vi, ko, zh, ru`; `src/pages/[lang]/{index,[privacy],404}.astro` thay thư mục `vi/` chép tay; `<html lang>` `ko` / `zh-Hans` / `ru`, hreflang mã trần + `x-default` hai chiều, sitemap 5 ngôn ngữ, `og:locale` ko_KR/zh_CN/ru_RU. Chữ `content/{ko,zh,ru}.ts` theo CPY; ô đồng ý + nhãn link thông báo theo SEC mục 7. 4 đổi cấu trúc CPY: `actions.chatOnSuffix` (ko "Zalo로 문의", zh "通过 Zalo 联系"), `book.form.noteLang` (chỉ ko/zh/ru), ngày theo ngôn ngữ trang (`fmtDate` dùng `Intl` ko-KR/zh-CN/ru-RU), hotline quốc tế `+84 84 444 0909` trên trang ko/zh/ru (`phoneShown`). Số nhiều tiếng Nga bằng `Intl.PluralRules('ru')`. Chữ form lúc chạy tách `scripts/booking-strings/<lang>.ts`, nạp `import()` theo ngôn ngữ trang. |
| FE-B-1 | Thông báo xử lý dữ liệu | `privacy.ts`: 3 bản ko/zh/ru của SEC + câu "đây là bản dịch" (Δ7); en/vi = chữ `2026-10-31` (Δ1–Δ4, ESC-042 B) + Δ5 dịch vụ dịch **bản Lượt 2** (ESC-044 = cho phép không giới hạn, nội dung dịch có thể gồm tên/liên hệ/lời nhắn). Một version chung 5 ngôn ngữ, **nhãn tạm `2026-11-01`** (SEC chốt nhãn thật). Trang có `<meta name="ottimo-notice-version">` (ARC D11) **và** `data-notice-version` (SEC SR-LC-04) – cùng một hằng; dist-check `checkNoticeVersion` kiểm đúng 1 mỗi loại và = `data-consent-version` của trang chủ cùng ngôn ngữ. `consentMore` en/vi sửa theo SEC-LP2-01 (Major): "…from our server within 180 days" / "…khỏi máy chủ của OTTIMO…". |
| FE-B-2 | Nút ngôn ngữ + dải gợi ý | `<details class="lang-pick">`: quả địa cầu + mã (EN/VI/KO/ZH/RU), danh sách English · Tiếng Việt · 한국어 · 简体中文 · Русский, link thường, `lang`/`hreflang`/`aria-current`, `aria-label` bắt đầu bằng mã ("KO – 언어: 한국어"). Điện thoại = tấm ngang dưới đầu trang, máy tính = thả xuống 212 px viền Oak. Mở nút ngôn ngữ đóng menu và ngược lại, Esc trả focus, bấm ra ngoài đóng; chạy không JS. Dải gợi ý: 4 dải mỗi trang; `zh`, `zh-CN`, `zh-SG`, `zh-Hans-*` → /zh/; `zh-TW`/`zh-HK`/`zh-MO`/`zh-Hant-*` → không gợi ý (`langOfTag`). Không chuyển hướng. |
| FE-B-3 | Font theo ngôn ngữ + ngân sách | Mỗi trang chỉ link `fonts-<lang>.css` của mình (`?url` trong `Base.astro`). RU: Lora cyrillic 400 + Onest 400/500/600 latin+cyrillic (`sync:fonts`, `@fontsource/onest@5.2.8`). KO/ZH: `scripts/subset-cjk.mjs` cắt Noto Sans 400/600 + Noto Serif 400 theo đúng ký tự trang (đọc bản dựng, phân vai serif/đậm/thường theo CSS), tách phần A (trang chủ) / B (privacy, 404, chữ lúc chạy, ngày `Intl`), `unicode-range` đúng mã, `font-display: swap`, không preload; nguồn `@expo-google-fonts/noto-*@0.4.4` ghim sha512, tải bằng `npm pack` vào `.font-src/` (gitignored, không thành dependency); `subset-font@2.9.0` (devDependency). Ô nhập/`select` trang ko/zh dùng font hệ thống cho chữ CJK (UXD 1.3.6). Quy tắc chữ UXD 1.5 (cách dòng, `keep-all`, `line-break: strict`, nhãn không viết hoa ko/zh, giãn 0,06em ru, `hyphens` ru). Dist-checks mới: `checkLangFonts` (CSS font ngôn ngữ X chỉ trang X link, ngân sách ko/zh ≤ 300 kB, ru ≤ 150 kB), `checkGlyphCoverage` theo CSS trang link (bỏ phần tử `lang` khác), danh sách tên font cho phép, 1 tệp CJK ≤ 80 kB. |
| FE-B-4 | Form + ô giá | `scripts/price-estimate.ts` + `booking-logic.ts` (`estimateQuery`, `estimateSearch`, `estimateView`, `formatVnd`, `isEstimate`) + `booking-transport.ts` (`estimateTransport`: GET cùng origin, 3 giây, `AbortController`, không retry). Chờ 400 ms, request mới nhất thắng, "đang tính" sau 300 ms, `role="status"` riêng (đọc sau 700 ms, chỉ khi đổi), `aria-busy`, không bao giờ chặn nút gửi, không lưu gì (API `no-store`). Ô ẩn tới khi có 200 đầu tiên; 404 = giá tắt → ẩn suốt lượt xem. Các trạng thái S0 nhắc chọn · S1 "Any room" · S2 đang tính · S3 tổng N đêm (Lora 28 px, `<data value>`) + câu giảm dài ngày/khách thêm bằng chữ + VND/thuế/giá cuối · S4/S5 **lời mời ưu đãi tháng không số** (ESC-043, `priceMonthlyOffer` CPY mục 12, ẩn nhãn "Estimated rate"): theo tháng → không gọi API; ở dài theo đêm → vẫn gọi, API trả `priceAvailable:false` + `monthly_offer` (BE 63c5731e) – **mốc 28/30 đêm chỉ nằm ở API**, trang không chép số này; không token · S6 không có số (`on_request`; `party_exceeds_room` → câu sức chứa `e.cap`; `notes.min_stay` → câu S6 tạm) · S7 lỗi trung tính (429 dừng gọi tới khi tải lại). `priceEstimateToken` chỉ gửi khi số đang hiện đúng hạng/ngày/khách đang chọn và chưa hết hạn. Trang cảm ơn có dòng "Estimated rate: …" khi token đi kèm. `NOTICE_VERSION_INVALID` và 422 `PUBLIC_FORM_NOT_READY` → khối Zalo/gọi + ẩn ô giá (ARC 2.8, BE lp-v2 6). Gửi `locale` = ngôn ngữ trang. |
| FE-B-5 | E2E + hiệu năng | Playwright mở rộng 5 ngôn ngữ (layout/axe/CSP/không bên thứ ba × 320/375/768/1280, glyph theo font trang, 404 theo tiền tố, gallery, ngân sách) + spec mới `lp-v2.landing.spec.ts` (giá ước tính, ko/zh/ru form, ảnh chụp). `serve.mjs` 404 theo `/(vi|ko|zh|ru)/`. |

## 2. Kết quả kiểm
- `pnpm --filter @ottimo/landing-web typecheck`: 0 lỗi. Vitest landing: **10 tệp, 263 test đạt** (thêm: ko/zh/ru đủ trường, từ cấm CPY mục 6 vào `BANNED` + test bắt/không bắt nhầm "星期", "两间", "Номера"…, nhãn trích dẫn khớp, `priceMonthlyOffer` không chữ số/%/`{amount}`, số nhiều Nga, định dạng VND 5 ngôn ngữ, logic/transport giá, font CJK phủ hết chữ form + thông báo).
- `check:dist` trên `dist/`, `dist-booking-preview/`, `dist-booking-live/`: tất cả đạt (14 nhóm kiểm, gồm `langFonts`, `noticeVersion`).
- Playwright landing (`tests/e2e/landing`): **108 test đạt**, 0 lỗi, 0 flaky (axe 0 vi phạm trên 5 ngôn ngữ × 4 cỡ + danh sách ngôn ngữ mở + form có giá ko/zh/ru).
- eslint + prettier xanh; `@ottimo/tests` typecheck xanh.
- `/vi/` bản production: thân trang ngoài đầu trang và dải gợi ý **trùng byte** với bản trước (đã so; Icon mới tách sang `LangIcon.astro` để giữ byte). Bản có form khác thêm: ô giá rỗng, `consentMore` mới, `data-notice-version`, chữ thông báo mới (đúng chủ đích).

### Dung lượng tải lần đầu (Playwright TC-LP-009, KB = 1024 B, nén như Caddy)
| Trang | Mở trang | Ngân sách | Cuộn hết | Ngân sách | Font ko/zh/ru |
|---|---|---|---|---|---|
| điện thoại EN DPR2 | 282,1 | 320 | 426,7 | 600 | 0 tệp |
| điện thoại VI DPR2 | 299,8 | 390 | 444,3 | 670 | 0 tệp |
| điện thoại RU DPR2 | 314,3 | 360 | 458,8 | 640 | 7 tệp 71,7 KB (≤ 150) |
| điện thoại KO DPR2 | 332,4 | 480 | 476,9 | 760 | 3 tệp 47,0 KB (≤ 300) |
| điện thoại ZH DPR2 | 387,3 | 560 | 531,8 | 840 | 3 tệp 101,2 KB (≤ 300) |
| máy tính EN DPR2 | 410,2 | 700 | 554,8 | 1100 | 0 |
| máy tính RU DPR2 | 442,4 | 700 | 586,9 | 1140 | 71,7 KB |
| máy tính KO DPR2 | 460,5 | 700 | 605,0 | 1260 | 47,0 KB |
| máy tính ZH DPR2 | 515,4 | 700 | 659,9 | 1340 | 101,2 KB |

Tệp font cắt (cả A+B, không phải tất cả tải lúc mở): KO 5 tệp ≈ 67 kB, ZH 5 tệp ≈ 150 kB – nhỏ hơn nhiều so với ước tính UXD (+105–160 / +160–235 KB). Trang Trung trên máy tính DPR2 vẫn dưới trần 700 KB của ADR-014 → không cần đòn bẩy b/c của UXD 1.6. JS: chuỗi form mỗi ngôn ngữ là một chunk riêng (≈ 2–3 kB gzip); trang en/vi không tải chunk ko/zh/ru.

Ảnh chụp (dữ liệu giả, không dữ liệu khách): `rounds/round-04/outputs/FE/screenshots/lp-v2-<en|vi|ko|zh|ru>-<390|1280>-{top,form}.png` (20 ảnh – đầu trang với danh sách ngôn ngữ mở; thẻ form có giá ước tính từ API giả).

## 3. File tạo/sửa (product/)
- Mới: `apps/landing-web/src/lib/langs.ts`, `src/content/{ko,zh,ru,index}.ts`, `src/pages/[lang]/{index,[privacy],404}.astro`, `src/components/LangIcon.astro`, `src/scripts/price-estimate.ts`, `src/scripts/booking-strings/{index,all,en,vi,ko,zh,ru}.ts` (`booking-strings.ts` → `booking-strings/types.ts`), `src/styles/fonts-{ko,zh,ru}.css` (sinh), `src/assets/fonts/{ko,zh}/*.woff2` (sinh, 10 tệp), `scripts/subset-cjk.mjs`, `tests/e2e/landing/lp-v2.landing.spec.ts`.
- Sửa: `src/lib/i18n.ts`, `content/{types,privacy,en,vi,site,photos}.ts`, `components/{Header,LangSuggest,StickyBar,BookingForm,PrivacyPage,Picture}.astro`, `components/home/{Book,Contact}.astro`, `layouts/Base.astro`, `scripts/{booking-form,booking-logic,booking-transport,lang,main}.ts`, `styles/{landing,privacy}.css`, `scripts/{dist-checks,check-dist,sync-fonts}.mjs`, test `copy/booking/lang/i18n/brand/dist`, `package.json` (+ `@fontsource/onest`, `subset-font`, `sync:fonts:cjk`), `.gitignore`, `README.md`, `pnpm-lock.yaml`; `tests/e2e/landing/{helpers,serve.mjs,layout,lang,budget,gallery,form-live}`.
- Xóa: `src/pages/vi/{index,[privacy],404}.astro`.

## 4. Điểm lệch thiết kế (cần UXD/ARC/CPY biết)
| # | Chỗ | Thiết kế | Đã làm | Lý do |
|---|---|---|---|---|
| D1 | Tên ngôn ngữ ở trang khác | UXD 1.3.7: bộ font "UI" nhỏ cho 한국어/简体中文/Русский | Font hệ thống (phương án dự phòng UXD, quy tắc 3 ARC) | 0 byte, trang en/vi tải 0 tệp font ko/zh/ru kể cả khi mở danh sách; glyph test loại trừ phần tử có `lang` khác |
| D2 | Định dạng tiền | UXD 3.5: EN "VND 2,363,000", VI "2.363.000 ₫" | CPY 2.3: số nhóm theo ngôn ngữ + " VND" sau, không ₫ | CPY nêu thiếu ký hiệu ₫ trong font thay thế, khách nước ngoài quen VND |
| D3 | Dòng "trung bình mỗi đêm", bảng từng đêm | UXD S3 có `about X a night` + "Nightly rates" | Không hiện | BE/DOM (lệnh ORC): không hiện `nightlyAvgVnd`; API không trả danh sách đêm (SEC SR-PE-17). Chuỗi `estimate.perNight` CPY còn giữ nhưng không dùng |
| D4 | S4/S5 theo tháng | UXD: "Monthly rate, from VND …" | Lời mời ưu đãi không số (theo tháng: không gọi API; ở dài theo đêm: theo `monthly_offer` của API) | ESC-043 (INV 01/11), CPY mục 12, BE 63c5731e |
| D5 | S7 lỗi | UXD: nút "Try again", chờ 8 s | Không nút, bỏ sau 3 s; lỗi trước lần 200 đầu tiên → ô ẩn hẳn | ARC 2.8 (3 s, 429 không gọi lại); CPY không có chữ "Try again"; ORC: ẩn ô giá khi API tắt/lỗi |
| D6 | Ô giá trước khi biết giá có bật | UXD: S0/S1 hiện ngay | Ô ẩn tới 200 đầu tiên | Production mặc định `public_show_prices = false` (404) – tránh hiện câu "chọn ngày để xem giá" rồi biến mất |
| D7 | "Estimate cleared." (đọc khi xóa giá) | UXD 3.6 | Không đọc | CPY chưa có chuỗi |
| D8 | Câu ở tối thiểu (`notes.min_stay`) | DOM: câu riêng có số đêm | Tạm dùng câu S6 (`estimate.unavailable`); khóa tùy chọn `estimate.minStay(n)` sẵn chỗ | CPY chưa viết |
| D9 | `party_exceeds_room` | – | Câu sức chứa `e.cap(n)` có sẵn của form | BE lp-v2 6 |
| D10 | Ngân sách Lighthouse 5 trang | ARC FE-B-5 | Chưa: repo không có `lighthouserc`/Lighthouse CI; LCP/CLS chưa đo, ngân sách byte đo bằng Playwright | OPS dựng Lighthouse CI nếu cần |
| D11 | Tagline nghiêng ở chân trang | – | Giữ tiếng Anh mọi trang (UXD U3) – không tải Lora cyrillic nghiêng | |
| D12 | Thẻ meta + data attribute | ARC: meta; SEC: `data-notice-version` | Cả hai, cùng giá trị | OPS chọn một |

## 5. Giả định
- G1: `VERSION` thông báo = **nhãn tạm `2026-11-01`** cho 5 ngôn ngữ; SEC đặt nhãn thật (> `2026-10-31`) khi chốt chữ sau người bản xứ + luật sư. Đổi nhãn = sửa một hằng.
- G2: en/vi `V3` = chữ `2026-10-31` dựng theo bảng Δ của SEC (chưa có `2026-10-31` trong repo – nhánh v1.0.1 sẽ đăng riêng; INV 01/11: LP-v2 phát hành một lần, v1.0.1 đi trước).
- G3: mốc chuyển sang tháng (28 → có thể 30 đêm, chờ INV) do API quyết qua `monthly_offer`; trên landing chỉ còn một chỗ dùng mốc là gợi ý số đêm dưới ô ngày (`site.json` `booking.shortMaxNights`). Hợp đồng `PublicPriceEstimate` của trang theo lp-v2-be 63c5731e (không còn `longStay`); api-client sinh lại có trên lp-v2-be – khi merge, kiểu nới tạm trong `booking-logic.ts` thành thừa.
- G4: giá trị API giả trong test/ảnh chụp (733.667 đ/đêm) là số minh họa, không phải giá Desk.
- G5: `public_show_prices` bật sau – trước đó trang giống LP-v1 (ô giá không bao giờ hiện).

## 6. Rủi ro / việc chưa xong
- Người bản xứ chưa đọc ko/zh/ru (điều kiện chặn phát hành – SEC D4, CPY 9). Đổi chữ ko/zh → chạy lại `build:booking-preview` + `sync:fonts:cjk` (test sẽ đỏ nếu quên).
- `sync:fonts:cjk` cần mạng lần đầu (≈ 400 MB tải về `.font-src/`); CI không cần.
- OPS: Caddy route `price-estimate`, 404 theo `/(ko|zh|ru)/`, bỏ chặn `/ru`; `publish-privacy-notice` đọc meta/`data-notice-version` cho 5 ngôn ngữ.
- Admin-web (S35) hiện `priceEstimate` – việc FE-A, không thuộc nhánh này.
- Chờ CPY: `estimate.minStay`, "Estimate cleared". Chờ SEC: nhãn version thật.

## 7. Phản hồi & sửa sau review (01/11/2026)

Trả lời từng thẻ: `rounds/round-04/responses/FE-B-LP-v2.md`. Chữ: CPY mục 13 "Lượt 3" (ORC duyệt áp bản ngắn ru/vi).

### 7.1 Đã sửa
- **Lời mời tháng khi chọn tháng trước (UXD FE-01)**: `monthlyProbeQuery` + `price-estimate.ts` – chưa biết giá bật/tắt thì gọi một lần `stayType=long` (không `departure`, không `months`; "Any room" dùng hạng đầu danh sách). 200 → lời mời; 404 → tắt; lỗi tạm → hỏi lại ở lần đổi sau; 429 → dừng.
- **Chữ tràn (UXD FE-02/03)**: ru "Выбрать даты" / "Чат в Zalo" / "Чат в ", vi "Nhắn Zalo" / "Nhắn ". Nút thanh đáy được xuống 2 dòng (lưới an toàn, không đổi cỡ chữ/padding). Trang ru 1024–1159 px: khoảng giữa mục menu 24 px (thay 32) để logo cách "Номера" 27 px (trước 15 px).
- **Dòng số tiền (UXD FE-04)**: số tiền một dòng (`.est-main`), cụm số đêm dòng phụ `.est-nights` (trên số ko/zh, dưới số en/vi/ru); `nights(n)` có U+00A0 (en/vi/zh/ru, cả `longHint`).
- **Minor UXD**: `hyphens` chỉ `.sec p` trang ru (FE-05); `h1:lang()` thay `:root:lang() h1` (FE-06); dòng chờ `.est-wait` không mờ (FE-07); ghép câu zh không dấu cách + khóa `priceMonthlyOffer.live` (FE-08); xóa vùng status khi về S0/S1, đọc `estimate.liveCleared` nếu trước đó có số (FE-09); gợi ý dưới ô ngày theo câu trả lời API, `shortMaxNights` 29 khi chưa có (FE-10).
- **CPY 13.3**: `estimate.minStay(n)` (bỏ đường lùi câu S6 – D8 xong), `estimate.liveCleared` (D7 xong). Chạy lại `sync:fonts:cjk` (4 tệp phần B ko/zh đổi).
- **SEC FE-01**: Δ5 = chữ L3 của SEC, 5 ngôn ngữ (test `privacy.test.ts`). **SEC FE-03**: e2e kiểm `sessionStorage` và IndexedDB rỗng.
- **ARC FE-01**: `site.json` `shortMaxNights` 27 → 29; chú thích "28+" → "mốc BR-108"; README.

### 7.2 Kết quả kiểm
- Vitest landing: **12 tệp, 279 test đạt** (mới: `price-estimate.test.ts` – ô giá trong DOM bằng jsdom, 9 ca; `privacy.test.ts` – Δ5, 5 ca; thêm ca `monthlyProbeQuery`, ghép câu zh, `minStay`, U+00A0). Thêm devDependency `jsdom@^26.1.0` (cùng bản admin-web/guest-web/mobile).
- `typecheck` landing: 0 lỗi; `@ottimo/tests` typecheck xanh; eslint + prettier xanh.
- `check:dist` (dist, dist-booking-preview, dist-booking-live): 14/14 nhóm đạt.
- Playwright landing toàn bộ: **144 test đạt** (thêm TC-LP-056 × 5 + 056b, TC-LP-062 × 20, ảnh 40). TC-LP-050…056 và 060 chạy lặp 3 lần: không flaky. TC-LP-053 sửa cho ổn định: độ trễ giả gắn với truy vấn 6 đêm, không theo số thứ tự lượt gọi (các ô liên hệ cũng phát `change`).
- Dung lượng (TC-LP-009, KB = 1024 B): không đổi so với mục 2 (±0,1 KB) – điện thoại EN DPR2 mở 282,2 / cuộn hết 426,7; máy tính ZH DPR2 mở 515,5 / cuộn hết 660,0 (trần 700); font ko 47,0 KB, zh 101,2 KB, ru 71,7 KB.
- Ảnh: `screenshots/lp-v2-<lang>-<360|390|1024|1280>-{top,form}.png` (40 ảnh, dữ liệu giả); ảnh form không còn bị đầu trang dính/thanh đáy che.

### 7.3 Giả định mới
- G6: "Any room" + tab tháng → hỏi giá bằng slug hạng đầu tiên trong danh sách. Câu trả lời chỉ dùng để biết giá bật/tắt; lời mời không nêu hạng. Không có dữ liệu cá nhân trong truy vấn.
- G7: Lời mời tháng hiện với mọi câu trả lời 200 cho `stayType=long` (kể cả `party_exceeds_room`/`on_request`), giống hành vi khi đã biết giá bật – theo tháng không bao giờ có số.
- G8: Giãn menu riêng trang ru 1024–1159 px (32 → 24 px) là chi tiết bố cục trong quyền FE theo FB-03; UXD xem ảnh `lp-v2-ru-1024-top.png` và có thể chọn phương án (b) của UXD thay thế.

### 7.4 Còn chờ
- ARC FE-02: `lp-v2-be` vẫn OpenAPI 0.3.9-draft (`63c5731e`), chưa có 0.3.10-draft/api-client sinh mới trên nhánh này → giữ kiểu tạm trong `booking-logic.ts`, đổi khi gộp `lp-v2-be` vào `lp-v2`.
- SEC FE-02: nhãn version thật. ARC FE-03: lấy chữ `2026-10-31` của `main` khi gộp. ARC FE-04: QA đo LCP/CLS trên staging.
- Người bản xứ: thêm câu mới CPY mục 13 + Δ5 L3 vào lượt đọc (SEC D4, CPY 9).
- UXD FE-11 (Suggestion "VND" nhỏ hơn): làm khi UXD cập nhật design system D2.

## 8. Kiểm thử – sửa lỗi QA (01/11/2026, nhánh `lp-v2-fe2` từ `lp-v2` + `lp-v2-be2` 7d9e306f)

### 8.1 Đã làm
- **BUG-R4-001 (FE-A, US-131 AC10):** ngăn S35 thêm dòng "Giá ước tính khách đã thấy: {số} – tính lúc {ngày giờ}" từ `priceEstimate` (phần `seen` server đã kiểm chữ ký); không có số (null, theo tháng) → "Khách chưa thấy giá". Nếu API có `priceEstimate.atSubmit.fromTotalVnd` khác số đã thấy thì thêm dòng "Lúc khách gửi, hệ thống tính lại: {số}" (hợp đồng 0.3.10 chưa có trường này – chỉ đọc khi có). Báo giá từ yêu cầu: cùng ngày đến, số đêm, số khách (và cùng hạng công khai nếu căn có) mà tổng khác → cảnh báo "Đã đổi: {cũ} → {mới}" + câu nhắc giải thích với khách; trùng → "Khớp giá ước tính…"; đầu vào khác → chỉ ghi số khách đã thấy, không nói "đã đổi".
- **BUG-R4-002 (FE-A):** `webreq.locale.ko` "Tiếng Hàn"/"Korean", `webreq.locale.zh` "Tiếng Trung (giản thể)"/"Chinese (Simplified)"; `ru` đã có. Test 5 locale × vi/en.
- **BUG-R4-003 (FE-B):** áp chữ CPY mục 14: `estimate.final` mới, khóa mới `estimate.guests(n)` (en 1/còn lại, ru `gen()` sau "для", U+00A0 sau số; ko viết liền). Ghi chú S3: `guests(n)` → `currency` (trừ vi) → `taxIn/taxOut` → `final`, ghép `joinSentences`. n = người lớn + trẻ 6–11 + dưới 6, **đọc lại từ query của chính con số** (`guestsOfSearch`) nên câu số khách luôn khớp số trên màn hình. `live`, `done`, `extraGuest` giữ nguyên. Chạy lại `sync:fonts:cjk` (font zh đổi; ko đã phủ đủ).
- **AC4 cỡ chữ:** `.est-note` 13 px → **15 px** (bằng nhãn ô `.f-label`, bằng các dòng khác của khối giá; lớn hơn gợi ý/lỗi 14 px).
- **BUG-R4-004 phần Desk (FE-A, lệnh ORC):** ngăn sửa căn (H04 `RoomDrawer`) thêm "Hạng phòng công khai": chọn 1 trong 4 hạng đúng chữ `production-defaults.ts` + "Chưa gán" (gửi `null`); chỉ owner sửa, manager xem chỉ đọc kèm "Chỉ chủ đầu tư đổi được hạng này."; chỉ gửi `publicRoomType` khi owner đổi. Mock MSW: manager gửi trường → 403. Desk chưa có màn "thêm căn" nên chỉ làm ở ngăn sửa. Cột "Hạng phòng" S35 đã dùng `roomTypeLabel` khi server có nhãn (slug chỉ hiện khi không khớp hạng) – không đổi.

### 8.2 Đo khối giá 360 px (TC-LP-063, 29 đêm, 2 người lớn + 1 trẻ dưới 6 → "3 khách")
| | Cao khối | Cao ghi chú | Tràn ngang |
|---|---|---|---|
| en | 273 px | 122 px | 0 |
| vi | 250 px | 99 px | 0 |
| ko | 268 px | 111 px | 0 |
| zh | 273 px | 114 px | 0 |
| ru | 294 px | 122 px | 0 |
Khối giá nằm dưới ô hạng phòng, chỉ cao lên sau khi khách chọn → không xô phần phía trên (CLS); UXD xem ảnh để chốt.

### 8.3 Kiểm
- admin-web vitest 63 file / 657 test đạt (gồm 13 test mới `r4-lp-v2-fea.test.tsx`); landing vitest 12 file / 281 đạt; `pnpm lint` (eslint + typecheck 13 workspace) xanh; `format:check` xanh; `check:dist` dist / preview / live sạch; Playwright landing 149/149 (thêm TC-LP-063 × 5, sửa TC-LP-050, TC-LP-060 zh).
- Ảnh (dữ liệu giả): `screenshots/lp-v2-fe2-estimate-{en,vi,ko,zh,ru}-360.png`; Desk `lp-v2-fe2-desk-drawer-seen-ko.png`, `lp-v2-fe2-desk-drawer-noprice-zh.png`, `lp-v2-fe2-desk-quote-changed.png`, `lp-v2-fe2-desk-room-public-type-{owner,manager}.png`; TC-LP-061 chụp lại `lp-v2-*-form.png` với ghi chú mới.

### 8.4 Giả định
- "Chữ nội dung form" (AC4) = nhãn ô 15 px (ô nhập 16 px là cỡ chống iOS phóng to, không phải chữ đọc). Nếu PO/UXD hiểu là 16 px thì đổi một dòng CSS. `[GIẢ ĐỊNH – FE; UXD/PO xác nhận]`
- `atSubmit` ra API: đọc `priceEstimate.atSubmit.fromTotalVnd` nếu ARC thêm (SEC FB-R4-SEC-BE-03); chưa có thì chỉ hiện `seen`.
- So sánh "Đã đổi" bỏ qua hạng khi căn chưa trả `publicRoomType`.

### 8.5 Còn chờ
- ARC: thêm `atSubmit` chỉ đọc vào `PublicPriceEstimateRecord` (nếu chọn) – FE đã sẵn.
- UXD/CPY: duyệt chữ Desk mới (`webreq.estimate_*`, `rooms.public_type*`) và chiều cao khối giá; người bản xứ đọc câu mới (CPY 14.7).

## 9. Kiểm thử – sửa lỗi lượt 3 (01/11/2026, nhánh `lp-v2-fe3` từ `lp-v2` @ `20afedff`)

### 9.1 Đã làm
- **BUG-R4-001 mở lại (FE-A, P2):** `compareWithSeen` so nhãn căn ("Standard Studio · Garden View") với slug web (`standard-studio-garden-view`) nên không bao giờ ra "đã đổi". Sửa: cả hai vế đi qua **cùng một hàm slug** `publicRoomTypeSlug` trước khi so.
  - Hàm slug không viết lại: luật `slugOf` của BE (`website-request-rules.ts`) chuyển nguyên văn sang `packages/contracts/src/public-room-type.ts` (`@ottimo/contracts` – gói hợp đồng dùng chung, build ra `dist`, api CommonJS đã `require()` gói ESM workspace như `@ottimo/integrations`). `slugOf` của BE nay gọi hàm này; Desk import cùng hàm. Landing không slug hóa lúc chạy (slug viết sẵn trong `content/*.ts`, test `production-bootstrap` của BE đã đối chiếu).
  - `@ottimo/contracts` chuyển từ devDependencies sang dependencies của `@ottimo/api` (để `pnpm deploy --prod` trong `Dockerfile.api` mang theo); thêm vào dependencies `@ottimo/admin-web`. Lockfile chỉ đổi 2 importer, không thêm gói ngoài.
  - Căn **chưa gán** (`publicRoomType: null`) nay ra "khác đầu vào" (không thuộc hạng nào trên web, BE `public-rate.port.ts` chỉ lấy căn `public_room_type = nhãn`); chỉ khi API không gửi trường (`undefined`, bản cũ trước BUG-R4-004) mới bỏ qua so hạng.
- **FB-R4-UXD-FE-13:** `webreq.estimate_changed` vi "Khác giá web khách đã thấy: {from} → {to}" / en "Differs from the website estimate: {from} → {to}"; `webreq.estimate_changed_hint` dùng "lịch giá hôm nay" / "Today's rate" (đúng chữ UXD).
- **FB-R4-UXD-FE-14:** `rooms.public_type_help` bỏ "giá theo yêu cầu" → vi "…web tính giá ước tính theo hạng này. Căn chưa gán không thuộc hạng nào trên web." / en "…website estimates use it. An unassigned room belongs to no type on the website." Đã kiểm hành vi BE khớp câu: `PublicRatePort.rooms` lọc `rm.public_room_type = $1`, `roomTypes()` bỏ `public_room_type IS NULL` → căn chưa gán không vào hạng nào.
- **FB-R4-UXD-FE-15:** manager thấy ô theo trạng thái **chỉ đọc** DS C3 (`Field` + `input[readonly]` nền `--surface-2`, nhãn ở trên như các ô khác), trợ giúp dưới ô `rooms.public_type_owner_only`; khi "Chưa gán" thêm `rooms.public_type_help` trước câu đó. Không khóa chữ mới.
- **FB-R4-UXD-FE-16:** `.est-line` 14 → 15 px (gộp với `.est-nights`); sửa chú thích CSS. `.est-wait` / `.est-idle` giữ 14 px.
- **BUG-R4-006 (FE-B, P3):** `.est-lbl` ("Estimated rate" và tiêu đề ưu đãi theo tháng) 13 → **15 px**, giữ chữ hoa/giãn chữ. Thứ bậc: nhãn 15 px < con số Lora 28 px; ru "ОРИЕНТИРОВОЧНАЯ ЦЕНА" vẫn một dòng ở 360 px.
- FB-R4-UXD-FE-17 (Suggestion – rút gọn `estimate_none` / `estimate_at_submit`): chưa làm lượt này (ngoài việc ORC giao); làm khi ORC xếp.

### 9.2 Đo khối giá 360 px (TC-LP-063, 29 đêm, 3 khách) – sau BUG-R4-006 + FE-16
| | Cao khối (lượt 2 → 3) | Cao ghi chú | Nhãn / ghi chú / dòng diễn giải | Tràn |
|---|---|---|---|---|
| en | 273 → 277 px | 122 px | 15 / 15 / 15 px | 0 |
| vi | 250 → 255 px | 99 px | 15 / 15 / 15 px | 0 |
| ko | 268 → 273 px | 111 px | 15 / 15 / 15 px | 0 |
| zh | 273 → 277 px | 114 px | 15 / 15 / 15 px | 0 |
| ru | 294 → 300 px | 122 px | 15 / 15 / 15 px | 0 |
Dưới ngưỡng UXD (khối ≤ 320 px, ghi chú ≤ 6 dòng).

### 9.3 Kiểm
- `@ottimo/contracts` vitest 2 test mới (4 nhãn e-brochure → slug landing; dấu tiếng Việt; slug giữ nguyên).
- admin-web vitest 63 file / 660 test đạt. `r4-lp-v2-fea.test.tsx` 16 test (thêm 3): ca **dữ liệu thật dạng nhãn** – căn "Standard Studio · Garden View" + seen `standard-studio-garden-view`, cùng ngày/khách: tổng bằng → `same`, khác → `changed`; nhãn khác / "Chưa gán" → `other`; Premium/Signature slug đúng; hộp báo giá căn 203 gán nhãn hiện "Khác giá web khách đã thấy: …", căn gán hạng khác chỉ hiện số tham khảo; manager có/không hạng (chỉ đọc, mô tả trợ giúp đúng).
- api: `typecheck` + `build` xanh; `be-d-r3-s1-units` 45/45 (gồm `slugOf`); `node` nạp `dist` CommonJS → `slugOf('Standard Studio · Garden View')` = `standard-studio-garden-view` (đã kiểm require gói ESM chạy thật).
- landing vitest 12 file / 281 đạt; `pnpm lint` (eslint + typecheck 13 workspace) xanh; `format:check` xanh.
- Playwright landing `lp-v2.landing.spec.ts` 60/60 (TC-LP-063 thêm kiểm `.est-lbl` ≥ nhãn ô và mọi `.est-line`/`.est-nights` = cỡ ghi chú).
- Ảnh (dữ liệu giả – MSW `mocks/seed.ts`, `mocks/webreq.ts`; API giả của Playwright): `screenshots/lp-v2-fe3-estimate-{en,vi,ko,zh,ru}-360.png`; Desk `lp-v2-fe3-desk-quote-changed-label.png` (căn mang nhãn, cảnh báo hiện), `lp-v2-fe3-desk-quote-other-type.png`, `lp-v2-fe3-desk-room-public-type-manager.png`, `lp-v2-fe3-desk-room-public-type-manager-unassigned.png`; TC-LP-061 chụp lại `lp-v2-*-form.png`.

### 9.4 Giả định
- Đặt hàm slug chung ở `@ottimo/contracts` (sửa 1 hàm BE + `package.json` api) thay vì để server trả slug của căn: không đổi hợp đồng API, không thêm trường. `[GIẢ ĐỊNH – FE; BE/ARC xác nhận khi review]`
- Căn "Chưa gán" → không so ("khác đầu vào"), không báo "đã đổi". `[GIẢ ĐỊNH – FE; UXD/DOM xem]`

### 9.5 Rủi ro / cần vai khác xem
- BE/ARC: review `website-request-rules.ts` (`slugOf` gọi `@ottimo/contracts`) và việc chuyển `@ottimo/contracts` sang dependencies của api. OPS: image api cần `packages/contracts/dist` (đã có qua `turbo prune` + `build --filter=@ottimo/api...` + `pnpm deploy --prod`); QA dựng lại image để xác nhận.
- Catalog căn của Desk được cache trong phiên: OWN đổi hạng xong, lễ tân đang mở Desk cần tải lại trang mới thấy hạng mới (như các trường căn khác – không đổi lượt này).
