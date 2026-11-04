# FE-B trả lời review gói LP-v2 (Round 4 – Phản hồi & sửa)

- Vai: FE (FE-B, landing) | Ngày 01/11/2026 | Nhánh `lp-v2-fe` (commit "review fixes", sau `5db7df80`)
- Review đã đọc: `rounds/round-04/reviews/UXD-on-LP-v2-fe.md`, `SEC-on-LP-v2-code.md` (mục 2–3), `ARC-on-LP-v2-code.md` (FE-01…04).
- Chữ dùng: CPY `outputs/CPY/lp-v2-copy.md` mục 13 "Lượt 3" (trên `main`, d944c2a5), ORC duyệt áp bản ngắn ru/vi.
- Chi tiết kỹ thuật, số đo, ảnh: `rounds/round-04/outputs/FE/lp-v2-fe.md` mục 7.

## UXD

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-UXD-FE-01 | Done | Chưa biết giá bật/tắt mà khách chọn tháng: gọi **một lần** `stayType=long` (hạng, ngày đến, số khách; không `departure`/`months`; "Any room" dùng hạng đầu danh sách). 200 → hiện lời mời, từ đó không gọi lại cho tab tháng; 404 → tắt ô suốt lượt xem; 503/hết giờ → không hiện gì, lần đổi sau hỏi lại; 429 → dừng. Test: vitest `price-estimate.test.ts` (5 ca), e2e TC-LP-056 × 5 ngôn ngữ + TC-LP-056b (404). BE xác nhận trên mã `lp-v2-be`: `long` không `departure` hợp lệ (gửi `departure` với `long` = `NOT_ALLOWED`). |
| FB-R4-UXD-FE-02 | Done | Áp bản ngắn CPY 13.1: ru "Выбрать даты" / "Чат в Zalo", vi "Nhắn Zalo". Thêm lưới an toàn: nút thanh đáy được xuống 2 dòng (`white-space: normal`, `text-wrap: balance`), giữ cỡ chữ và cao ≥ 48 px. Test TC-LP-062: 320/360/375 × 5 ngôn ngữ, không nút nào `scrollWidth > clientWidth`, không cuộn ngang, nút cao ≥ 48 px. |
| FB-R4-UXD-FE-03 | Done | Chữ ngắn CPY cho đầu trang ru (một chữ dùng chung với thanh đáy). Đo lại sau khi áp: khoảng logo → "Номера" ở 1024 px chỉ 15 px (CPY đo 37 px theo cách khác) → thêm riêng trang ru, 1024–1159 px: khoảng giữa 4 mục menu 24 px thay vì 32 px (không đổi cỡ chữ) → 27 px. TC-LP-062 ở 1024 px × 5 ngôn ngữ: hàng đầu trang không tràn, nút chính 1 dòng, logo cách menu ≥ 24 px. UXD xem ảnh `lp-v2-ru-1024-top.png`. |
| FB-R4-UXD-FE-04 | Done | Số tiền một dòng riêng (`.est-main` chỉ chứa `<data>`, `display: block`); cụm số đêm thành dòng phụ `.est-nights` (15 px, Stone) – dưới số với en/vi/ru, trên số với ko/zh. `nights(n)` dùng U+00A0 giữa số và chữ (CPY 13.5, en/vi/zh/ru). Câu đọc và dòng cảm ơn giữ nguyên. |
| FB-R4-UXD-FE-05 | Done | `hyphens: auto` chỉ cho `.sec p` của trang Nga; `hyphens: manual` cho `.label`, `.f-title`, `.hint`, `.lead`, mọi phần tử ô giá, `.est-sent`. Lời dẫn hero không nằm trong `.sec` nên không ngắt từ. |
| FB-R4-UXD-FE-06 | Done | Bộ chọn đổi sang `h1:lang(ko|zh-Hans)`, `.h2:lang(…)` – tagline `lang="en"` giữ cách dòng/giãn chữ Latin trên mọi trang. |
| FB-R4-UXD-FE-07 | Done | Dòng "Checking rates…" có class riêng `.est-wait`, không bị làm mờ; chỉ số cũ (`.est-main`, `.est-nights`, `.est-line`) mờ khi đang tính. |
| FB-R4-UXD-FE-08 | Done | Ghi chú S3 ghép theo ngôn ngữ (`joinSentences`: zh liền, còn lại một dấu cách). Câu đọc lời mời dùng khóa CPY mới `priceMonthlyOffer.live` (zh có "。"). Test vitest + e2e TC-LP-060 zh. |
| FB-R4-UXD-FE-09 | Done | Về S0/S1 thì xóa ngay vùng `role="status"` (không đọc), sau đó, nếu trước đó có số, đọc `estimate.liveCleared` (CPY 13.3: "Estimated rate cleared."). Cũng xóa khi ô bị tắt. |
| FB-R4-UXD-FE-10 | Done | Khi API đã trả lời cho đúng ngày đang chọn, gợi ý dưới ô ngày theo API (`monthly_offer` → câu ở dài; có giá → chỉ số đêm). Khi chưa có/giá tắt: `site.json` `shortMaxNights` 27 → **29** (cùng FB-R4-ARC-FE-LPV2-01). TC-LP-054: 29 đêm = giá + "29 nights", 30 đêm = lời mời + câu ở dài; TC-LP-056b khi giá tắt. |
| FB-R4-UXD-FE-11 | Deferred | Suggestion "VND" nhỏ hơn: chờ UXD ghi kiểu vào design system (D2) rồi làm cùng lượt; không đổi trong lượt này để ảnh/đo của CPY còn đúng. |
| FB-R4-UXD-FE-12 | Done | Ảnh 360 / 390 / 1024 / 1280 × 5 ngôn ngữ (40 ảnh). Ảnh form ẩn đầu trang dính và thanh đáy bằng CSSOM chỉ trong test (CSP thật vẫn bật). Ảnh các trạng thái S1/S2/S4–S7: chưa thêm (UXD đã tự chụp lượt này). |

## SEC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-SEC-FE-01 | Done | Δ5 thay bằng chữ SEC mục 3 (L3) ở 5 ngôn ngữ, chép bằng script từ bảng của SEC (không gõ tay); comment theo đúng mẫu SEC. Test `src/content/privacy.test.ts`: mỗi ngôn ngữ có đúng câu L3, là đoạn cuối của mục, không còn câu điều kiện cũ. Người bản xứ đọc câu mới cùng lượt D4. |
| FB-R4-SEC-FE-02 | Open (chờ SEC) | Nhãn `2026-11-01` vẫn là nhãn tạm; đổi khi SEC báo nhãn thật. Kiểm "version > version đang hiệu lực trên máy chủ" thuộc `deploy-landing.sh` (OPS – C3/C5). |
| FB-R4-SEC-FE-03 | Done | TC-LP-050 kiểm thêm `sessionStorage.length === 0` và `indexedDB.databases()` rỗng sau khi tra giá + gửi yêu cầu. |

## ARC

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-ARC-FE-LPV2-01 | Done | `shortMaxNights` 29; chú thích "28+" đổi thành "mốc BR-108 (30 đêm)" trong `booking-strings/*.ts`, `types.ts`, `booking-logic.ts`; README ghi: đổi mốc trên Desk thì đổi `shortMaxNights` cùng ngày. ORC ghi vào checklist phát hành: chỉ phát hành khi OWN đặt `long_stay_required_from_nights = 30`. |
| FB-R4-ARC-FE-LPV2-02 | Deferred (chờ gộp) | `origin/lp-v2-be` vẫn ở `63c5731e` (OpenAPI 0.3.9-draft), chưa có 0.3.10-draft và chưa gộp vào `lp-v2`; nhánh này không có api-client sinh mới. Giữ kiểu tạm trong `booking-logic.ts`; đổi sang `components['schemas']['PublicPriceEstimate']` ngay sau khi `lp-v2-be` gộp vào `lp-v2`. |
| FB-R4-ARC-FE-LPV2-03 | Deferred (khi gộp) | Làm lúc gộp `main` vào `lp-v2` như ARC đề xuất (lấy `2026-10-31` của `main` làm gốc + Δ5 L3 + ko/zh/ru). |
| FB-R4-ARC-FE-LPV2-04 | Deferred (QA/OPS) | LCP/CLS đo thủ công trên staging (QA) trước QC; Lighthouse CI là việc OPS bản sau. |
