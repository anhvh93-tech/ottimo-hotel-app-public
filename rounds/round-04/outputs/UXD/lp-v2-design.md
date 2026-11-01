# LP-v2 – Thiết kế: font ko/zh/ru, nút chọn ngôn ngữ, giá ước tính trong form

- Round 4 · Bước 1 Sản xuất (lượt A) · Vai: UXD · Ngày: 01/11/2026
- Nguồn: `rounds/round-04/plan-lp-v2.md` (FB-INV-008 + FB-INV-009, giả định ORC G1–G5)
- Đã đọc: brand guideline (`00-brief/context/brand/brand-guidelines.md`), landing hiện tại (`product/apps/landing-web/`: `astro.config.ts`, `Header.astro`, `LangSuggest.astro`, `BookingForm.astro`, `Book.astro`, `landing.css`, `fonts.css`, `scripts/sync-fonts.mjs`, `scripts/dist-checks.mjs`), Playwright `product/tests/e2e/landing/budget.landing.spec.ts`, `layout.landing.spec.ts`, ADR-014 mục 3.2 và 9, concept landing v1.2.1 (`product/design/landing/concept.md` mục 5, 7, 8, 12.2), số đo FE R3 (`rounds/round-03/outputs/FE/s1-landing.md`).
- Mock: `rounds/round-04/outputs/UXD/lp-v2-mock.html` (mở bằng trình duyệt; mock tải font từ Google Fonts **chỉ để xem**, production tự host).
- Chữ: CPY viết song song. Mọi câu trong tài liệu và mock là **chữ tạm** (khóa chuỗi ở mục 3.9). Số tiền là số minh họa.

## 0. Tóm tắt quyết định UXD

| # | Việc | Quyết định |
|---|---|---|
| 1 | Font tiếng Nga | **Tiêu đề giữ Lora** (Lora có bộ chữ Kirin). **Thân chữ: Onest** thay Be Vietnam Pro (Be Vietnam Pro không có Kirin). Cả thân trang `/ru/` dùng Onest, kể cả chữ Latin, để chữ Latin và Kirin cùng một nét. |
| 2 | Font tiếng Hàn | Tiêu đề: Lora cho chữ Latin, rồi **Noto Serif KR**. Thân: Be Vietnam Pro cho chữ Latin/số, rồi **Noto Sans KR**. |
| 3 | Font tiếng Trung giản thể | Như tiếng Hàn: Lora → **Noto Serif SC**; Be Vietnam Pro → **Noto Sans SC**. |
| 4 | Cách tải | Tự host, **cắt sẵn lúc build theo đúng ký tự trên trang** (không dùng bộ cắt 100+ lát của Google). Mỗi ngôn ngữ CJK 3 tệp (sans 400, sans 600, serif 400), tách 2 phần: chữ trang chủ / chữ còn lại. `unicode-range` đúng mã ký tự, `font-display: swap`, không preload. |
| 5 | Dung lượng thêm (ước tính, chưa đo) | RU **≈ +24 KB**; KO **≈ +105–160 KB**; ZH **≈ +160–235 KB** (so với trang EN). Đề xuất ngân sách CI ở mục 1.6. |
| 6 | Nút chọn ngôn ngữ | Một nút **quả địa cầu + mã hiện tại** (EN/VI/KO/ZH/RU) ở đầu trang, mọi cỡ màn hình, mở danh sách 5 tên ngôn ngữ viết bằng chính ngôn ngữ đó. Không cờ. `<details>` – chạy được khi không có JavaScript. |
| 7 | Giá ước tính | Một ô nền Ivory **ngay dưới "Room type"**, cuối nhóm "Your stay". 8 trạng thái (mục 3.3). Số tiền Lora 400, không đậm, không huy hiệu, không gạch giá. Một vùng `role="status"` riêng đọc kết quả cuối; "đang tính" không đọc. Không bao giờ chặn nút gửi. |

Không mở ESC mới. Lệch brand cần INV biết: mục 1.7.

---

## 1. Font cho ko / zh / ru

### 1.1 Kiểm hiện trạng (đo trên gói `@fontsource` 5.2.8 trong repo và danh mục Fontsource/jsDelivr ngày 01/11)

| Font | Latin + Việt | Kirin (Nga) | Hàn | Trung giản thể | Ghi chú |
|---|---|---|---|---|---|
| Lora (tiêu đề) | Có | **Có** – `lora-cyrillic-400-normal.woff2` 11.480 B, italic 12.512 B | Không | Không | Đủ cho tiêu đề tiếng Nga, giữ được nhận diện |
| Be Vietnam Pro (thân) | Có | **Không** (chỉ latin, latin-ext, vietnamese) | Không | Không | Cần font thay cho cả ba ngôn ngữ |
| JetBrains Mono (mã yêu cầu) | Có | Có | Không | Không | Chỉ hiện mã Crockford base32 chữ Latin – không đổi |

### 1.2 Chọn font thay thế

| Vai | ru | ko | zh (giản thể) | Lý do chọn |
|---|---|---|---|---|
| Tiêu đề (H1, H2, tên hạng phòng – vai của Lora) | **Lora** (giữ) | Lora (chữ Latin) → **Noto Serif KR** 400 | Lora → **Noto Serif SC** 400 | Có chân, nét thanh–đậm nhẹ, điềm tĩnh như Lora. Cùng họ Noto với thân chữ nên chữ Hàn/Trung trong tiêu đề và thân nhất quán. |
| Thân, nút, nhãn (vai của Be Vietnam Pro) | **Onest** 400/500/600 (cả chữ Latin) | Be Vietnam Pro (Latin, số) → **Noto Sans KR** 400/600 | Be Vietnam Pro → **Noto Sans SC** 400/600 | Onest: sans hình học–nhân văn, độ mở rộng, chiều cao chữ x lớn – gần Be Vietnam Pro nhất trong các font có Kirin chất lượng; vẽ cho Kirin từ đầu nên chữ Nga đẹp. Noto Sans KR/SC: trung tính, đủ dấu câu toàn khổ, khách Hàn/Trung quen mắt. |
| Mã, Wi-Fi | JetBrains Mono (giữ) | giữ | giữ | Chỉ ký tự Latin |

Tất cả giấy phép **SIL OFL 1.1** – tự host được, **không tốn tiền** (không cần ESC theo skill UXD).

Phương án đã loại:
- **Font hệ thống cho chữ Hàn/Trung** (Apple SD Gothic Neo / Malgun Gothic, PingFang SC / Microsoft YaHei) – 0 KB nhưng mỗi máy một kiểu, tiêu đề mất chân (Windows rơi về SimSun/Batang rất cũ), ngắt dòng và chiều cao khác nhau giữa máy → khó kiểm, lệch nhận diện. **Giữ làm phương án dự phòng** (mục 1.6, đòn bẩy c) và làm font dự phòng trong ngăn xếp.
- **Manrope** cho tiếng Nga: có Kirin, nhẹ (7,8 KB/tệp) nhưng nét hẹp, cảm giác "fintech"; xa Be Vietnam Pro hơn Onest.
- **Golos Text**: quen mắt người Nga vì dùng trên cổng dịch vụ công → cảm giác hành chính, trái tính cách "Warm · Refined".
- **Be Vietnam Pro cho chữ Latin + Onest cho Kirin trên cùng trang Nga**: chữ a, e, o, p, c Latin và Kirin trông giống nhau nhưng khác font → lệch nét trong cùng một dòng (ví dụ "Wi-Fi" giữa câu Nga). Với chữ Hàn/Trung thì ngược lại: hai hệ chữ khác hẳn hình dáng, ghép font Latin thương hiệu + font CJK là cách làm chuẩn, nên giữ Be Vietnam Pro cho chữ Latin và số.
- **Bộ cắt sẵn 100+ lát của Google/Fontsource** (`@fontsource/noto-sans-kr` 120 lát × ~11 KB; `noto-sans-sc` 97 lát × ~25 KB): một trang Hàn/Trung thường chạm 25–40 lát mỗi độ đậm → ước **300–900 KB mỗi độ đậm**, 50–100 yêu cầu. Quá nặng so với ngân sách hiện có.

### 1.3 Cách tải tiết kiệm

1. **Cắt theo ký tự thật lúc build** (CJK). Landing là trang tĩnh, chữ biết trước. Tập ký tự mỗi ngôn ngữ gồm:
   - chữ trong `src/content/<lang>.ts`, `privacy.ts` (bản ngôn ngữ đó), `booking-strings.ts`, chữ trang 404;
   - chữ do `Intl` sinh ra trong form: thứ/ngày/tháng (`11월 13일 (금)`, `11月13日周五` – đủ 7 thứ, 12 tháng), số, dấu nhóm số;
   - dấu câu toàn khổ U+3000–303F, U+FF00–FFEF đang dùng.
   Công cụ đề xuất: `subset-font` (harfbuzz bản wasm, chạy trong Node như `sync-fonts.mjs` hiện có – không cần Python). Nguồn: tệp OTF/TTF tĩnh Noto (OFL) để ở thư mục chỉ dùng khi build, hoặc tải theo phiên bản ghim + checksum. **ARC/OPS chọn nguồn và công cụ**; UXD chỉ yêu cầu kết quả. Tệp sinh ra được commit và test báo "cũ" khi chữ đổi – giống cơ chế `sync:fonts` hiện nay.
2. **Tách 2 phần mỗi tệp CJK**:
   - phần A = ký tự có trên trang chủ lúc mở (kể cả form);
   - phần B = ký tự chỉ có ở trang thông báo xử lý dữ liệu, 404, trạng thái lỗi, trang cảm ơn, trạng thái giá.
   Hai `@font-face` cùng tên họ, `unicode-range` tách rời → trình duyệt chỉ tải B khi chữ đó thật sự hiện.
3. **Độ đậm**: CJK chỉ 2 tệp sans. Tệp 400 khai báo `font-weight: 400`; tệp 600 khai báo `font-weight: 500 700` (nhãn, nút 500 và H3 600 dùng chung). Tệp 600 chỉ chứa ký tự nằm trong phần tử ≥ 500. Serif chỉ 400, chỉ chứa ký tự tiêu đề.
4. **Không nghiêng chữ CJK**: `font-synthesis: none` trên `:lang(ko)`, `:lang(zh-Hans)` (không có chữ Hàn/Trung nghiêng; nghiêng giả rất xấu). Câu tagline ở chân trang (Lora nghiêng) nên **giữ tiếng Anh** trên mọi trang (CPY quyết – đề xuất UXD).
5. **`font-display: swap`** cho mọi tệp mới. Không preload: ảnh đầu trang là LCP, preload font sẽ tranh băng thông. Chữ CJK hiện font hệ thống trước rồi đổi sang Noto; khung chữ CJK vuông đều nên gần như không xô bố cục.
6. **Ô nhập (tên, ghi chú) và `select` trên trang ko/zh dùng font hệ thống cho chữ CJK** (bỏ họ subset khỏi ngăn xếp của `.input`). Lý do: khách gõ tên bất kỳ – chữ không có trong subset sẽ rơi sang font hệ thống giữa chừng, một cái tên bị trộn hai font.
7. **Tên ngôn ngữ trong nút chọn** (`한국어`, `简体中文`, `Русский`) xuất hiện trên mọi trang. Đề xuất bộ "UI" rất nhỏ: Noto Sans KR và Noto Sans SC chỉ chứa ký tự tên ngôn ngữ + câu dải gợi ý ngôn ngữ (≈ 20 ký tự mỗi bộ, **≈ 2–4 KB**), và Onest Kirin 400 (6,5 KB) cho "Русский". Khai báo trong `fonts.css` chung với `unicode-range` → **chỉ tải khi danh sách mở hoặc dải gợi ý hiện**, trang EN lúc mở không tốn thêm byte. Phương án dự phòng: để các chữ này rơi về font hệ thống và cho phép ngoại lệ trong test glyph.
8. **Tiếng Nga**: dùng thẳng gói `@fontsource/onest` (latin + cyrillic, 400/500/600; mỗi tệp 6,5–15 KB, dưới trần 30 KB/tệp) và `lora-cyrillic` (+ `lora-cyrillic-400-italic` nếu tagline dịch). Không cần cắt riêng.

### 1.4 Ngăn xếp font (đề xuất cho `landing.css` – FE-B viết, tên họ subset FE tự đặt)

```css
:root {
  --serif: 'Lora', Georgia, 'Times New Roman', serif;
  --sans: 'Be Vietnam Pro', 'OTTIMO UI KR', 'OTTIMO UI SC', 'Onest', Arial, Helvetica, sans-serif; /* UI = bộ tên ngôn ngữ */
}
:root:lang(ru) { --sans: 'Onest', 'Be Vietnam Pro', Arial, Helvetica, sans-serif; }
:root:lang(ko) {
  --sans: 'Be Vietnam Pro', 'OTTIMO Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  --serif: 'Lora', 'OTTIMO Serif KR', 'AppleMyungjo', 'Noto Serif KR', serif;
}
:root:lang(zh-Hans) {
  --sans: 'Be Vietnam Pro', 'OTTIMO Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
  --serif: 'Lora', 'OTTIMO Serif SC', 'Songti SC', 'Noto Serif SC', serif;
}
```
- `@font-face` của KR chỉ nằm trong CSS của trang `/ko/`, của SC chỉ trong `/zh/` (CSS riêng theo ngôn ngữ, ví dụ `fonts-ko.css` import ở layout khi `lang = ko`). Trang khác không có các khai báo này.
- `<html lang>` của trang Trung phải là **`zh-Hans`** (hoặc `zh-CN`) – để font dự phòng chọn đúng dáng chữ giản thể (chữ Hán dùng chung mã giữa Trung/Nhật/Hàn). ARC chốt đường dẫn (`/zh/`) và mã hreflang.

### 1.5 Quy tắc chữ theo ngôn ngữ

| Quy tắc | ko | zh-Hans | ru |
|---|---|---|---|
| Cách dòng thân | 1,7 (EN 1,5) | 1,75 | 1,5 |
| Cách dòng H1 / H2 | 1,3 / 1,35 | 1,3 / 1,35 | giữ 1,1 / 1,2 |
| Giãn chữ tiêu đề | 0,02em | 0,02em | giữ |
| Nhãn (`.label`, `.f-title`) | bỏ chữ hoa (không có), giãn 0,04em | như ko | chữ hoa giữ, giãn **0,06em** (từ Nga dài) |
| Ngắt dòng | `word-break: keep-all` (không bẻ giữa từ) | `line-break: strict` (không để dấu câu đầu dòng) | `hyphens: auto` chỉ ở đoạn văn; **không** ở tiêu đề, nút, nhãn |
| Nghiêng | không (`font-synthesis: none`) | không | Lora nghiêng có Kirin |
| Dấu câu | CPY dùng dấu câu Hàn chuẩn | Dấu câu toàn khổ ，。：；（） | Ngoặc «», số có khoảng trắng hẹp |
| Số nhiều | không cần | không cần | **bắt buộc `Intl.PluralRules`**: 1 ночь / 3 ночи / 5 ночей |

Kiểm bố cục (FE-B, QA): tiếng Nga là chữ dài nhất – đầu trang 1024 px (menu 4 mục + nút chọn ngôn ngữ + "Chat on Zalo" + "Plan your stay") phải vừa một dòng; nút ở thanh đáy điện thoại 320 px không xuống 3 dòng. Nếu tràn: CPY đưa bản ngắn cho nhãn đầu trang (đề xuất ≤ 14 ký tự cho nút "Plan your stay" bản Nga), không thu cỡ chữ.

### 1.6 Dung lượng và ngân sách CI

Hiện trạng (FE R3, Playwright TC-LP-009, KB = 1024 B): điện thoại EN DPR2 mở trang **312,9 / 320 KB** (còn 7 KB); VI DPR2 342,3 / 390; máy tính DPR2 508,6 / 700. Trần ADR-014 mục 9: tổng tải lần đầu trang chủ ≤ 700 KB. `dist-checks.mjs`: mỗi tệp font ≤ 30.000 B, tên tệp phải là Lora/Be Vietnam Pro (+ JetBrains Mono khi có form).

Ước tính thêm cho trang mỗi ngôn ngữ (**ước tính, chưa đo** – dựa trên kích thước lát Fontsource: Noto Sans KR ≈ 100 B/chữ, Noto Sans SC ≈ 140 B/chữ, bản serif ≈ 1,8 lần; số chữ khác nhau ước từ ~1.400 từ tiếng Anh trên trang chủ + form):

| Trang | Tệp | Ước tính | So với EN |
|---|---|---|---|
| `/ru/` | Lora Kirin 400 (11,2 KB) + Onest latin+kirin 400/500/600 (64 KB) thay Be Vietnam Pro latin (63,6 KB) | **≈ +24 KB** (+12 KB nếu tagline nghiêng dịch Nga) | Đo được từ gói thật |
| `/ko/` | Sans KR 400 (550–700 chữ) 55–75 · Sans KR 600 (250–350) 25–40 · Serif KR 400 (150–250) 25–45 | **≈ +105–160 KB** | ước tính |
| `/zh/` | Sans SC 400 (650–850 chữ) 90–125 · Sans SC 600 (300–400) 40–60 · Serif SC 400 (180–280) 30–50 | **≈ +160–235 KB** | ước tính |
| Mọi trang, khi mở danh sách ngôn ngữ / dải gợi ý | Bộ UI KR + SC (2–4 KB mỗi bộ), Onest Kirin 400 (6,5 KB) | 0 KB lúc mở trang; ≤ 14 KB khi mở danh sách | – |

Lưu ý: font tải khi chữ được **vẽ**, không phụ thuộc cuộn – nên phần thêm áp cho cả "mở trang" lẫn "cuộn hết". Trang EN có khách Hàn (dải gợi ý tiếng Hàn hiện) tốn thêm ≈ 3 KB – vẫn trong 7 KB dư, nhưng sát.

Đề xuất ngân sách (QA + ARC chốt sau khi FE-B đo bản dựng đầu):

| Ca Playwright mới | Mở trang | Cuộn hết |
|---|---|---|
| điện thoại RU DPR2 | 320 + 40 = **360** | 600 + 40 = 640 |
| điện thoại KO DPR2 | 320 + 160 = **480** | 760 |
| điện thoại ZH DPR2 | 320 + 240 = **560** | 840 |
| máy tính ZH DPR2 | 700 + 240 = 940 → **vượt trần ADR 700 KB** | – |

**Vướng ADR-014 mục 9 (ARC quyết):** máy tính DPR2 tiếng Trung ước 508 + 160…235 ≈ **670–745 KB**, có thể vượt 700 KB. Đòn bẩy theo thứ tự UXD chọn:
- (a) tách phần A/B (mục 1.3 bước 2) – bắt buộc làm, ước giảm 15–25 %;
- (b) chỉ riêng trang ZH: nhãn/nút dùng 400, chỉ H3 dùng Sans SC 600 với tập chữ rất nhỏ → giảm ≈ 25–40 KB;
- (c) cuối cùng: thân chữ Trung dùng font hệ thống, chỉ tiêu đề dùng Noto Serif SC tự host (0 KB thân chữ, mất nhất quán giữa máy).
- Hoặc ARC nâng trần cho trang CJK (ví dụ 800 KB) – vẫn trong LCP vì font không chặn ảnh đầu trang.

Kiểm CI phải sửa theo (FE-B/QA, không phải UXD sửa):
- `dist-checks.mjs` `checkBudgets`: mở regex tên tệp cho `onest-*`, `lora-cyrillic-*`, tệp subset CJK. Trần mỗi tệp: giữ 30.000 B cho Latin/Kirin; tệp CJK riêng ≤ 120.000 B (hoặc chia nhỏ).
- `checkGlyphCoverage`: đọc thêm dải của CSS từng ngôn ngữ. Đây chính là chốt chặn khi CPY đổi chữ mà quên cắt lại font.
- Playwright TC-LP-002 (glyph chỉ từ Lora/Be Vietnam Pro): mở danh sách cho `Onest`, `Noto Sans KR/SC`, `Noto Serif KR/SC` theo trang; trừ ô nhập (mục 1.3 bước 6).
- TC-LP-009: thêm ca RU/KO/ZH như bảng trên.

### 1.7 Lệch brand (để ORC báo INV – không cần INV quyết)

| # | Guideline | Thực tế LP-v2 | Vì sao | Đề xuất |
|---|---|---|---|---|
| L1 | Thân chữ = Be Vietnam Pro | `/ru/`: **Onest** cho toàn bộ thân chữ | Be Vietnam Pro không có chữ Nga | Ghi ngoại lệ vào design system mục chữ; nếu sau này Be Vietnam Pro có Kirin thì quay lại |
| L2 | Tiêu đề = Lora; thân = Be Vietnam Pro | `/ko/`, `/zh/`: chữ Hàn/Trung vẽ bằng **Noto Serif / Noto Sans KR, SC**; chữ Latin và số vẫn Lora / Be Vietnam Pro | Lora, Be Vietnam Pro không có chữ Hàn/Trung | Như L1 |
| L3 | Label = chữ hoa, giãn +10 | ko/zh không có chữ hoa, giãn 0,04em; ru giãn 0,06em | Đặc điểm hệ chữ, chiều dài từ Nga | Ghi vào design system |
| L4 | Guideline: "mọi font phải hỗ trợ đủ tiếng Việt" | Noto KR/SC, Onest đều có bộ tiếng Việt – **không lệch** | – | – |
| L5 | Logo/wordmark "không thay font" | Wordmark OTTIMO giữ Lora trên mọi ngôn ngữ, không dịch "Boutique Stay" | – | – |
| L6 | Màu | Không thêm màu nào; không dùng cờ quốc gia (cờ mang màu ngoài bảng 80/15/5) | – | – |

Chi phí: 0 đồng (OFL). Rủi ro duy nhất INV cần biết: trang tiếng Hàn/Trung nặng hơn trang Anh khoảng 1/3–2/3 vì font chữ tượng hình.

---

## 2. Nút chọn ngôn ngữ (5 ngôn ngữ)

### 2.1 Vì sao đổi kiểu
Hiện tại: nhóm 2 link "EN | VI" có viền, luôn hiện (ADR-014 3.2 điểm 5). Với 5 ngôn ngữ, nhóm link sẽ dài ≥ 5 × 44 = 220 px – điện thoại 320–390 px không còn chỗ cho logo + menu, máy tính thì đầu trang thành dãy mã khó đọc ("EN VI KO ZH RU"), trái nguyên tắc "yên tĩnh".

### 2.2 Thiết kế (mock mục 1)
- **Nút**: `<details class="lang-pick">` → `<summary>` = biểu tượng quả địa cầu (nét 1,5 px, cùng bộ icon) + **mã ngôn ngữ đang xem** (EN, VI, KO, ZH, RU – Be Vietnam Pro 500, 14 px, giãn 0,06em) + mũi tên nhỏ. Viền 1 px Ink, bo 4 px, cao 44 px (vùng chạm ≥ 44×44). Mở: nền Ink, chữ Ivory (giống trạng thái "đang chọn" hiện nay), mũi tên lật.
- **Tên đọc được** (`aria-label` của summary) bắt đầu bằng mã nhìn thấy (WCAG 2.5.3): `EN – Language: English`, `KO – 언어: 한국어`… (CPY viết).
- **Danh sách**: 5 dòng, thứ tự cố định theo INV: **English · Tiếng Việt · 한국어 · 简体中文 · Русский**. Mỗi dòng là link thường tới **cùng trang** ở ngôn ngữ đó, có `lang`, `hreflang`, `data-set-lang` (giữ cơ chế lưu `ottimo.lang`). Dòng hiện tại: dấu tích + chữ 600 + `aria-current="page"`. Không cờ, không mã phụ.
  - Tiếng Trung ghi **"简体中文"** (không chỉ "中文") để khách Đài Loan/Hồng Kông biết đây là giản thể. CPY xác nhận.
- **Máy tính (≥ 768 px)**: nút nằm trong cụm công cụ bên phải, **trước** "Chat on Zalo" và "Plan your stay" (vị trí như "EN | VI" hiện nay). Danh sách thả xuống, canh phải theo nút, rộng 212 px, nền Ivory, viền 1 px Oak, bo 4 px, dòng cao 44 px, rê chuột nền Cream. Không đổ bóng (bảng màu không có màu bóng).
- **Điện thoại (< 768 px)**: đầu trang = logo · nút ngôn ngữ · nút menu (đo ở 320 px: wordmark 120 + nút ≈ 76 + menu 44 – vừa, mock mục 1). Danh sách mở thành **tấm ngang toàn chiều rộng ngay dưới đầu trang** – cùng kiểu với tấm menu hiện có: nhãn nhỏ "LANGUAGE" màu Earth, 5 dòng cao 48 px, chữ 17 px, kẻ Cream giữa các dòng, cạnh dưới Oak.
- **Hành vi** (`src/scripts/main.ts`, vài dòng): mở nút ngôn ngữ thì đóng menu và ngược lại; Esc đóng và trả focus về nút; bấm ra ngoài đóng. Không JavaScript: `<details>` vẫn mở/đóng được, link vẫn chạy.
- **Bàn phím**: Tab tới nút → Enter/Space mở → Tab qua 5 link. Không dùng `role="menu"` (đây là link điều hướng, không phải menu lệnh).
- **Dải gợi ý ngôn ngữ** (`LangSuggest.astro`): giữ nguyên cơ chế, nay mỗi trang có 4 dải ẩn (mỗi dải viết bằng ngôn ngữ của nó). Chữ do CPY viết.
- **Trang privacy, 404**: cùng nút.
- **Không thêm danh sách ngôn ngữ ở chân trang** (đầu trang dính luôn hiện, tránh tải font CJK khi khách cuộn hết trang EN).

### 2.3 Lệch ADR-014 mục 3.2 điểm 5 – cần ARC đồng ý
ADR ghi nút đổi ngôn ngữ là "link thường… luôn thấy ở đầu trang… không giấu trong menu". Thiết kế mới: **nút luôn thấy ở đầu trang**, link nằm trong danh sách mở ra từ chính nút đó (không nằm trong menu điều hướng). Mục đích của ADR (khách Việt dùng trình duyệt tiếng Anh vẫn thấy lối đổi ngôn ngữ ngay) vẫn đạt nhờ biểu tượng quả địa cầu + mã. Đề xuất ARC sửa câu ADR thành "nút ngôn ngữ luôn thấy ở đầu trang; danh sách link mở từ nút này, chạy được không cần JavaScript". QA sửa test ở `lang.landing.spec.ts` tương ứng.
- Phương án khác đã xét: máy tính hiện 5 mã nối nhau, điện thoại dùng danh sách. Loại vì hai kiểu cho cùng một việc và 5 mã Latin không giúp khách Hàn/Trung nhận ra ngôn ngữ của mình.

---

## 3. Giá ước tính trong form "Plan your stay"

Theo G1–G3: giá chỉ trong form, sau khi khách chọn hạng + ngày; hiện tổng cả chuyến (số đêm × giá, giảm theo thời gian ở nếu có), ghi "ước tính – giá cuối trong báo giá"; theo tháng: "từ X/tháng"; giá lấy từ bảng giá Desk qua API công khai (ARC). **Công thức, làm tròn, cuối tuần/lễ, giường phụ, thuế/phí: DOM.** UXD chỉ quy định cách hiện.

### 3.1 Vị trí
- **Ngay dưới ô "Room type"** (sau dòng gợi ý sức chứa và lỗi sức chứa), là phần tử cuối của nhóm "Your stay", trước đường kẻ Oak và nhóm "How we reach you". Lý do: giá đổi theo đúng 3 ô khách vừa chạm (ngày, số khách, hạng) – khách thấy kết quả ngay chỗ thao tác; trình đọc màn hình gặp nó theo đúng thứ tự đọc.
- Không đặt cạnh nút gửi (nút gửi cách 2 nhóm ô; giá đặt ở đó trông như "thanh toán"). Không dính đáy màn hình, không nổi.
- Điện thoại và máy tính cùng vị trí; ô giá rộng hết thẻ form.
- Thân trang (thẻ hạng phòng, hero) **vẫn không có giá** (quyết định 24/10).

### 3.2 Khi nào tính
- Theo đêm: có ngày đến + ngày đi hợp lệ, **đã chọn một hạng cụ thể**, số khách không vượt sức chứa.
- Theo tháng: có ngày đến hợp lệ + hạng cụ thể; số tháng bất kỳ (kể cả "Not sure yet").
- Gọi API sau khi khách ngừng thao tác **400 ms**; hủy yêu cầu cũ khi có thay đổi mới (bỏ kết quả về muộn); nhớ kết quả trong phiên theo bộ khóa (hạng, ngày, khách) để đổi qua lại không gọi lại.
- Chỉ hiện trạng thái "đang tính" khi chờ **> 300 ms** (tránh nháy).
- **Không bao giờ chặn nút gửi** vì giá (lỗi, không có giá, đang tính – đều gửi được).

### 3.3 Các trạng thái (mock mục 3, nút chuyển trạng thái)

| Trạng thái | Khi nào | Hiện gì (chữ tạm – CPY viết) | Đọc cho trình đọc màn hình |
|---|---|---|---|
| S0 Chưa đủ | Thiếu ngày/hạng, hoặc đang có lỗi ngày/sức chứa | Một dòng xám: "Choose your dates and a room type to see an estimated price." | Không (chỉ đọc "Estimate cleared." nếu trước đó đã có giá) |
| S1 "Hạng nào cũng được" | Room type = Any room | "Choose a room type to see an estimated price. Or leave it to us – we will suggest one in our quote." | Như S0 |
| S2 Đang tính | Chờ > 300 ms | Nhãn "ESTIMATED TOTAL" + thanh giữ chỗ tĩnh (Cream, không chạy sáng) + "Calculating…". Đang đổi từ giá cũ: giá cũ mờ 45 %, không biến mất. `aria-busy="true"` | **Không đọc** |
| S3 Có giá – theo đêm | API trả giá | Nhãn **ESTIMATED TOTAL** · số tiền (Lora 400, 28 px) · dòng phụ "**3 nights** · City Studio · about VND 788,000 a night" · (nếu có) dòng giảm theo thời gian ở bằng chữ · link gập "Nightly rates" (liệt kê từng đêm) · ghi chú "Our listed rate, VAT included. This is an estimate – your final price is in our quote. No payment on this website." | "Estimated total VND 2,363,000 for 3 nights, City Studio. Final price in our quote." |
| S4 Theo đêm nhưng ≥ 28 đêm | BR-108 – báo giá dài hạn | Nhãn **MONTHLY RATE, FROM** · "VND 8,000,000 / month" · "30 nights · City Studio · For 28 nights or more we quote our long-stay rate." · ghi chú dài hạn | Đọc giá tháng + câu dài hạn |
| S5 Theo tháng | Tab "By the month" | Nhãn **MONTHLY RATE, FROM** · "VND 8,000,000 / month" · "3 months · City Studio · from Nov 13" · ghi chú "Listed monthly rate, VAT included. Utilities, deposit and your final price are in our quote." (DOM chốt gồm gì) | Đọc giá tháng |
| S6 Không có giá cho ngày đó | API báo chưa có giá niêm yết cho khoảng ngày (ngoài lịch giá, ngày đóng bán…) | "We do not have a listed rate for these dates yet." + "Send your request and we will quote you." Chữ Ink/Stone – **không** màu lỗi, **không** ám chỉ hết phòng | Đọc nguyên câu |
| S7 Lỗi | Mất mạng, 429, 5xx, hết thời gian chờ (8 s) | "The estimate is not available right now." + "You can still send your request." + nút chữ "Try again" (44 px). Không màu lỗi (không phải lỗi của khách) | Đọc nguyên câu |

Ghi chú trạng thái:
- Đổi ngôn ngữ = sang trang khác; form không giữ dữ liệu → ô giá về S0. Không cần trạng thái riêng.
- Không JavaScript: form không hiện (SEC UXD-08) → không có ô giá.
- "Any room": UXD đề xuất S1 (không hiện giá). Phương án khác cho PO/DOM: hiện "From VND X a night for these dates" của hạng rẻ nhất – dễ thành "giá mồi", UXD không chọn.
- Có phụ thu khách thêm/giường phụ (nếu DOM quy định): thêm một dòng phụ bằng chữ, ví dụ "Includes an extra bed for 1 guest".

### 3.4 Bố cục và kiểu chữ (chỉ token thương hiệu)
| Phần | Kiểu | Màu (trên nền Ivory) | Tương phản |
|---|---|---|---|
| Khung | nền Ivory trên thẻ Cream, bo 4 px, đệm 16/20 px, cao tối thiểu 76 px (giảm nhảy bố cục) | – | – |
| Nhãn | Be Vietnam Pro 500, 13 px, chữ hoa giãn 0,1em (ko/zh: không chữ hoa) | Earth Brown | 5,37:1 |
| Số tiền | **Lora 400**, 28 px, `font-variant-numeric: lining-nums tabular-nums`, phần tử `<data value="2363000">` | Ink | 12,49:1 |
| "/ month" | Be Vietnam Pro 400, 15 px | Stone | 4,95:1 |
| Dòng phụ | Be Vietnam Pro 400, 14 px; số đêm 500 Ink | Stone / Ink | 4,95 / 12,49 |
| Link gập "Nightly rates" | 500, 14 px, gạch chân, cao 44 px | Earth Brown | 5,37:1 |
| Ghi chú cuối | 13 px, kẻ trên 1 px Cream | Stone | 4,95:1 |
| Thanh giữ chỗ | Cream, 180 × 28 px, tĩnh | – | trang trí, có chữ "Calculating…" đi kèm |

Chuyển trạng thái: mờ 150 ms; `prefers-reduced-motion` → tắt.

### 3.5 Định dạng số và ngày
- `Intl.NumberFormat(locale, { style: 'currency', currency: 'VND', currencyDisplay: vi ? 'symbol' : 'code', maximumFractionDigits: 0 })` → EN/KO/ZH "VND 2,363,000", VI "2.363.000 ₫", RU "2 363 000 VND" (đã chạy thử Node 22). Chỉ VND – **không quy đổi** sang won/nhân dân tệ/rúp (tỷ giá đổi, dễ thành cam kết sai).
- Ngày: `Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Ho_Chi_Minh' })`. Ký tự sinh ra phải nằm trong subset font (mục 1.3).
- Số đêm/tháng: `Intl.PluralRules` (bắt buộc cho tiếng Nga).
- Chữ số luôn là chữ số Latin (Lora cho số tiền; Be Vietnam Pro, Onest ở trang Nga, cho dòng phụ).

### 3.6 Khả năng tiếp cận
- Ô giá (phần nhìn thấy) **không** là vùng live – để không đọc lại toàn bộ khối mỗi lần đổi. Khung có `aria-labelledby` = nhãn; `aria-busy` khi đang tính.
- Một `<p class="sr" role="status">` riêng (polite, atomic), có sẵn trong HTML từ đầu (vùng live phải tồn tại trước khi đổi chữ). Chỉ ghi **câu kết quả ngắn** (cột cuối bảng 3.3), **700 ms** sau khi kết quả ổn định, và chỉ khi câu khác câu trước. Không đọc "Calculating…". Lý do: dùng phím mũi tên trên `select` hạng phòng sinh nhiều lần đổi liên tiếp – không đọc dồn.
- Lỗi của ô giá không dùng `role="alert"` (không phải lỗi khách nhập) và không đưa vào khối tóm tắt lỗi của form.
- "Nightly rates" là `<details>`; danh sách đêm là `<ul>`, mỗi dòng "ngày – số tiền".
- Không đổi focus khi giá hiện.

### 3.7 Không làm form giống trang bán rẻ
- Không gạch giá cũ, không "Save 10%", không nhãn % màu, không đỏ/xanh lá.
- Không "Only 1 left", không đếm ngược, không "Best price guaranteed", không so với Booking/Agoda (cũng là rủi ro rate parity – DOM).
- Không hiệu ứng số chạy lên, không nhấp nháy khi đổi số.
- Số tiền không đậm, cùng màu Ink, nhỏ hơn H2; nhãn ghi rõ "Estimated".
- Giảm theo thời gian ở chỉ là một câu trong dòng phụ ("Includes our weekly rate" – CPY), không huy hiệu.
- Không thêm dấu "!" hay emoji (test giọng văn hiện có đã chặn).

### 3.8 Trang cảm ơn
Thêm một dòng dưới mã yêu cầu khi khách đã thấy giá lúc gửi: "Estimate shown: VND 2,363,000 (City Studio, 3 nights). We confirm your final price in our quote." Giá trị này là bản chụp giá đi kèm yêu cầu (ARC định nghĩa trường gửi đi). Khách không thấy giá (S0/S1/S6/S7) → không có dòng này.

### 3.9 Khóa chuỗi cần CPY viết (EN/VI trước, rồi ko/zh/ru)
| Khóa | Chữ tạm EN |
|---|---|
| `estimate.label` | Estimated total |
| `estimate.labelMonthly` | Monthly rate, from |
| `estimate.perMonth` | / month |
| `estimate.nights(n)` | {n} nights (PluralRules) |
| `estimate.months(n)` | {n} months |
| `estimate.avgPerNight(amount)` | about {amount} a night |
| `estimate.nightlyRates` | Nightly rates |
| `estimate.discount(...)` | (nếu DOM có giảm theo thời gian ở) |
| `estimate.extraGuest(...)` | (nếu DOM có phụ thu) |
| `estimate.noteShort` | Our listed rate, VAT included. This is an estimate – your final price is in our quote. No payment on this website. |
| `estimate.noteLong` | Listed monthly rate, VAT included. Utilities, deposit and your final price are in our quote. |
| `estimate.longNights` | For 28 nights or more we quote our long-stay rate. |
| `estimate.idle` | Choose your dates and a room type to see an estimated price. |
| `estimate.idleAnyRoom` | Choose a room type to see an estimated price. Or leave it to us – we will suggest one in our quote. |
| `estimate.calculating` | Calculating… |
| `estimate.noRate` / `estimate.noRateNext` | We do not have a listed rate for these dates yet. / Send your request and we will quote you. |
| `estimate.error` / `estimate.errorNext` / `estimate.retry` | The estimate is not available right now. / You can still send your request. / Try again |
| `estimate.liveCleared` | Estimate cleared. |
| `estimate.live(...)` | câu đọc ngắn (cột cuối bảng 3.3) |
| `done.estimateShown(...)` | Estimate shown: {amount} ({room}, {nights}). We confirm your final price in our quote. |
| `langSwitch.button(code, name)` | {CODE} – Language: {name} |
| `langSwitch.panelTitle` | Language |
| tên ngôn ngữ | English · Tiếng Việt · 한국어 · 简体中文 · Русский |

Ràng buộc chữ: ngắn, điềm tĩnh, không "!", không emoji, không "rẻ/ưu đãi/deal"; chữ "estimate/ước tính" luôn đi cùng số tiền.

### 3.10 Câu hỏi cho vai khác (UXD đã dùng giả định để đi tiếp)
- **DOM**: định nghĩa "không có giá" (S6) gồm những ca nào; giá tháng "từ" gồm/không gồm gì (điện nước, phí dịch vụ) để CPY viết `noteLong`; có hiện bảng từng đêm (đêm cuối tuần/lễ cao hơn) không – UXD đề xuất có, gập sẵn, vì minh bạch.
- **ARC**: API trả đủ cho S3–S7 (tổng, danh sách đêm, giá tháng "từ", lý do không có giá); mã lỗi phân biệt "không có giá" với lỗi hệ thống; trường chụp giá gửi kèm yêu cầu (mục 3.8); `zh-Hans` cho `lang`/hreflang.
- **PO**: AC cho "Any room" (S1) và cho việc không chặn nút gửi.

---

## 4. Việc cho vai khác (qua ORC)
| Vai | Việc |
|---|---|
| FE-B | Ngăn xếp font + CSS theo ngôn ngữ (1.4, 1.5); script cắt font + tách A/B (1.3); nút ngôn ngữ (2.2); ô giá + vùng status (3); đo dung lượng bản dựng đầu, báo UXD nếu vượt bảng 1.6 |
| ARC | Đồng ý sửa ADR-014 3.2 điểm 5 (2.3); chốt trần dung lượng trang CJK (1.6); nguồn tệp font gốc + công cụ cắt; mã `zh-Hans` |
| QA | Thêm ca RU/KO/ZH vào TC-LP-009, TC-LP-002; sửa test nút ngôn ngữ; kiểm aria-live bằng trình đọc màn hình (VoiceOver iOS + NVDA) cho S3/S6/S7 |
| CPY | Chuỗi mục 3.9 và chữ nút/dải ngôn ngữ; tagline giữ tiếng Anh (đề xuất); bản ngắn nhãn đầu trang tiếng Nga nếu tràn |
| DOM | Câu hỏi 3.10 |
| UXD (bước sau) | Review bản dựng FE-B (ảnh 320/375/768/1024/1440 × 5 ngôn ngữ); cập nhật `product/design/landing/concept.md` và mục chữ của design system khi FE-B xong |

## 5. Giả định, rủi ro, việc chưa xong
**Giả định**
- U1: Đường dẫn `/ko/`, `/zh/`, `/ru/`; `lang` = `ko`, `zh-Hans`, `ru` (ARC chốt).
- U2: Số chữ khác nhau trên trang ko/zh ước từ chiều dài trang EN hiện tại (~1.400 từ) – dung lượng mục 1.6 là ước tính, sai số có thể ±30 %.
- U3: Tagline Lora nghiêng ở chân trang giữ tiếng Anh trên mọi ngôn ngữ.
- U4: Hạng phòng phải được chọn cụ thể mới hiện giá (G1).
- U5: Giá hiện bằng VND, đã gồm VAT (BR-101 (2)); DOM có thể sửa câu ghi chú.

**Rủi ro**
- R1: Trang Trung trên máy tính DPR2 có thể vượt trần 700 KB của ADR-014 (mục 1.6) → ARC chọn đòn bẩy.
- R2: Chữ CPY đổi sau khi cắt font → ký tự rơi về font hệ thống. Chặn bằng `checkGlyphCoverage` + test "font cũ".
- R3: Điện thoại EN DPR2 chỉ còn 7 KB dư; thêm HTML cho 4 dải gợi ý + nút ngôn ngữ (~0,5 KB gzip) + script ô giá phải đo lại.
- R4: Mock dùng Google Fonts đầy đủ – hình dáng chữ đúng, nhưng dung lượng trong mock **không** phản ánh production.

**Chưa xong**
- Chưa đo dung lượng thật (chưa có bản dựng ko/zh; UXD không tải tệp font Noto về máy – chỉ đọc kích thước công bố trên Fontsource/jsDelivr).
- Chưa có chữ thật của CPY trong mock.
- Chưa cập nhật `product/design/landing/concept.md` và design system (làm ở bước phản hồi, sau review).

**Đề xuất dòng decision-log (ORC ghi khi commit)**
| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 01/11/2026 | 4 | Font LP-v2: ru = Lora + Onest; ko = Lora/Noto Serif KR + Be Vietnam Pro/Noto Sans KR; zh = Lora/Noto Serif SC + Be Vietnam Pro/Noto Sans SC; tự host, cắt theo ký tự lúc build | UXD | Lora/Be Vietnam Pro thiếu chữ Hàn/Trung, Be Vietnam Pro thiếu Kirin; OFL, 0 đồng |
| 01/11/2026 | 4 | Nút ngôn ngữ = quả địa cầu + mã, danh sách 5 tên bản ngữ, không cờ (chờ ARC sửa ADR-014 3.2 điểm 5) | UXD | 5 ngôn ngữ không vừa dạng nhóm link trên điện thoại |
| 01/11/2026 | 4 | Giá ước tính hiện trong ô dưới "Room type", 8 trạng thái, không chặn nút gửi, vùng status riêng | UXD | FB-INV-009, G1–G3 |
