# FE-B – LP-v2: landing ko/zh/ru, nút chọn ngôn ngữ, giá ước tính trong form

- Vai: FE (FE-B, landing) | Round 4 – gói LP-v2 – Bước Sản xuất (code) | Ngày 01/11/2026
- Nhánh: `lp-v2-fe` (từ `origin/lp-v2`, OpenAPI 0.3.9-draft). Chưa merge, không đụng `main`, không deploy.
- Căn cứ: ARC `outputs/ARC/lp-v2-design.md` (FE-B-1…FE-B-5), UXD `outputs/UXD/lp-v2-design.md`, CPY `outputs/CPY/lp-v2-copy.md` (gồm mục 12 – ESC-043 trên `main`), SEC `outputs/SEC/lp-v2-privacy-and-api.md` (gồm Lượt 2 – ESC-044 trên `main`), BE `origin/lp-v2-be` (477552ca, `outputs/BE/lp-v2-be.md` mục 6), cập nhật ORC 01/11.
- Brand: chỉ bảng màu 80/15/5 (dist-checks đạt), Lora / Be Vietnam Pro dẫn; ngoại lệ chữ theo UXD 1.7 (Onest cho thân trang Nga, Noto KR/SC cho chữ Hàn/Trung). Không emoji, không "!".

## 1. Đã làm

| # | Việc | Kết quả |
|---|---|---|
| FE-B-1 | 5 ngôn ngữ, route động | `LANGS = en, vi, ko, zh, ru`; `src/pages/[lang]/{index,[privacy],404}.astro` thay thư mục `vi/` chép tay; `<html lang>` `ko` / `zh-Hans` / `ru`, hreflang mã trần + `x-default` hai chiều, sitemap 5 ngôn ngữ, `og:locale` ko_KR/zh_CN/ru_RU. Chữ `content/{ko,zh,ru}.ts` theo CPY; ô đồng ý + nhãn link thông báo theo SEC mục 7. 4 đổi cấu trúc CPY: `actions.chatOnSuffix` (ko "Zalo로 문의", zh "通过 Zalo 联系"), `book.form.noteLang` (chỉ ko/zh/ru), ngày theo ngôn ngữ trang (`fmtDate` dùng `Intl` ko-KR/zh-CN/ru-RU), hotline quốc tế `+84 84 444 0909` trên trang ko/zh/ru (`phoneShown`). Số nhiều tiếng Nga bằng `Intl.PluralRules('ru')`. Chữ form lúc chạy tách `scripts/booking-strings/<lang>.ts`, nạp `import()` theo ngôn ngữ trang. |
| FE-B-1 | Thông báo xử lý dữ liệu | `privacy.ts`: 3 bản ko/zh/ru của SEC + câu "đây là bản dịch" (Δ7); en/vi = chữ `2026-10-31` (Δ1–Δ4, ESC-042 B) + Δ5 dịch vụ dịch **bản Lượt 2** (ESC-044 = cho phép không giới hạn, nội dung dịch có thể gồm tên/liên hệ/lời nhắn). Một version chung 5 ngôn ngữ, **nhãn tạm `2026-11-01`** (SEC chốt nhãn thật). Trang có `<meta name="ottimo-notice-version">` (ARC D11) **và** `data-notice-version` (SEC SR-LC-04) – cùng một hằng; dist-check `checkNoticeVersion` kiểm đúng 1 mỗi loại và = `data-consent-version` của trang chủ cùng ngôn ngữ. `consentMore` en/vi sửa theo SEC-LP2-01 (Major): "…from our server within 180 days" / "…khỏi máy chủ của OTTIMO…". |
| FE-B-2 | Nút ngôn ngữ + dải gợi ý | `<details class="lang-pick">`: quả địa cầu + mã (EN/VI/KO/ZH/RU), danh sách English · Tiếng Việt · 한국어 · 简体中文 · Русский, link thường, `lang`/`hreflang`/`aria-current`, `aria-label` bắt đầu bằng mã ("KO – 언어: 한국어"). Điện thoại = tấm ngang dưới đầu trang, máy tính = thả xuống 212 px viền Oak. Mở nút ngôn ngữ đóng menu và ngược lại, Esc trả focus, bấm ra ngoài đóng; chạy không JS. Dải gợi ý: 4 dải mỗi trang; `zh`, `zh-CN`, `zh-SG`, `zh-Hans-*` → /zh/; `zh-TW`/`zh-HK`/`zh-MO`/`zh-Hant-*` → không gợi ý (`langOfTag`). Không chuyển hướng. |
| FE-B-3 | Font theo ngôn ngữ + ngân sách | Mỗi trang chỉ link `fonts-<lang>.css` của mình (`?url` trong `Base.astro`). RU: Lora cyrillic 400 + Onest 400/500/600 latin+cyrillic (`sync:fonts`, `@fontsource/onest@5.2.8`). KO/ZH: `scripts/subset-cjk.mjs` cắt Noto Sans 400/600 + Noto Serif 400 theo đúng ký tự trang (đọc bản dựng, phân vai serif/đậm/thường theo CSS), tách phần A (trang chủ) / B (privacy, 404, chữ lúc chạy, ngày `Intl`), `unicode-range` đúng mã, `font-display: swap`, không preload; nguồn `@expo-google-fonts/noto-*@0.4.4` ghim sha512, tải bằng `npm pack` vào `.font-src/` (gitignored, không thành dependency); `subset-font@2.9.0` (devDependency). Ô nhập/`select` trang ko/zh dùng font hệ thống cho chữ CJK (UXD 1.3.6). Quy tắc chữ UXD 1.5 (cách dòng, `keep-all`, `line-break: strict`, nhãn không viết hoa ko/zh, giãn 0,06em ru, `hyphens` ru). Dist-checks mới: `checkLangFonts` (CSS font ngôn ngữ X chỉ trang X link, ngân sách ko/zh ≤ 300 kB, ru ≤ 150 kB), `checkGlyphCoverage` theo CSS trang link (bỏ phần tử `lang` khác), danh sách tên font cho phép, 1 tệp CJK ≤ 80 kB. |
| FE-B-4 | Form + ô giá | `scripts/price-estimate.ts` + `booking-logic.ts` (`estimateQuery`, `estimateSearch`, `estimateView`, `formatVnd`, `isEstimate`) + `booking-transport.ts` (`estimateTransport`: GET cùng origin, 3 giây, `AbortController`, không retry). Chờ 400 ms, request mới nhất thắng, "đang tính" sau 300 ms, `role="status"` riêng (đọc sau 700 ms, chỉ khi đổi), `aria-busy`, không bao giờ chặn nút gửi, không lưu gì (API `no-store`). Ô ẩn tới khi có 200 đầu tiên; 404 = giá tắt → ẩn suốt lượt xem. Các trạng thái S0 nhắc chọn · S1 "Any room" · S2 đang tính · S3 tổng N đêm (Lora 28 px, `<data value>`) + câu giảm dài ngày/khách thêm bằng chữ + VND/thuế/giá cuối · S4/S5 **lời mời ưu đãi tháng không số** (ESC-043, `priceMonthlyOffer` CPY mục 12, ẩn nhãn "Estimated rate", không gọi API) · S6 không có số (`on_request`; `party_exceeds_room` → câu sức chứa `e.cap`; `notes.min_stay` → câu S6 tạm) · S7 lỗi trung tính (429 dừng gọi tới khi tải lại). `priceEstimateToken` chỉ gửi khi số đang hiện đúng hạng/ngày/khách đang chọn và chưa hết hạn. Trang cảm ơn có dòng "Estimated rate: …" khi token đi kèm. `NOTICE_VERSION_INVALID` và 422 `PUBLIC_FORM_NOT_READY` → khối Zalo/gọi + ẩn ô giá (ARC 2.8, BE lp-v2 6). Gửi `locale` = ngôn ngữ trang. |
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
| D4 | S4/S5 theo tháng | UXD: "Monthly rate, from VND …" | Lời mời ưu đãi không số, không gọi API | ESC-043 (INV 01/11), CPY mục 12 |
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
- G3: theo tháng / ≥ 28 đêm xử lý phía client (không gọi API) – BE sẽ chốt enum trạng thái tháng; trang vẫn hiện lời mời nếu API trả `stayKind: long`.
- G4: giá trị API giả trong test/ảnh chụp (733.667 đ/đêm) là số minh họa, không phải giá Desk.
- G5: `public_show_prices` bật sau – trước đó trang giống LP-v1 (ô giá không bao giờ hiện).

## 6. Rủi ro / việc chưa xong
- Người bản xứ chưa đọc ko/zh/ru (điều kiện chặn phát hành – SEC D4, CPY 9). Đổi chữ ko/zh → chạy lại `build:booking-preview` + `sync:fonts:cjk` (test sẽ đỏ nếu quên).
- `sync:fonts:cjk` cần mạng lần đầu (≈ 400 MB tải về `.font-src/`); CI không cần.
- OPS: Caddy route `price-estimate`, 404 theo `/(ko|zh|ru)/`, bỏ chặn `/ru`; `publish-privacy-notice` đọc meta/`data-notice-version` cho 5 ngôn ngữ.
- Admin-web (S35) hiện `priceEstimate` – việc FE-A, không thuộc nhánh này.
- Chờ CPY: `estimate.minStay`, "Estimate cleared". Chờ SEC: nhãn version thật.
