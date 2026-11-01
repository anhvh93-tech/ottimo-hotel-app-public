# Báo cáo kiểm thử – gói LP-v2 (Round 4)

- Tác giả: QA | Round 4 – gói LP-v2 – Bước **Kiểm thử** | Ngày 01/11/2026 (14:30–15:40)
- Bản kiểm: nhánh gộp `origin/lp-v2` @ `83c13990` (= `lp-v2-be` `6ae46d4a` + `lp-v2-fe` `a72bcbfc` + `lp-v2-ops` `74e23925`), checkout detached trong worktree QA.
- Căn cứ: PO `outputs/PO/lp-v2-stories.md` (US-131, US-174, US-175); DOM `web-price-estimate-rules.md` mục 11 + `pricing-spec-2026-11-01-reconcile.md`; `product/docs/business-rules.md` v0.5.0 (BR-101, 104, 107, 110, 113, 114, 115, 116); review `reviews/ARC-on-LP-v2-code.md`, `SEC-on-LP-v2-code.md` (C1–C9), `SEC-on-LP-v2-ops.md`, `UXD-on-LP-v2-fe.md`; decision-log 01/11 (ESC-043: tháng không hiện giá; một mức giá; mốc 30 đêm).
- Lỗi mới: `rounds/round-04/qa/bug-list.md` (BUG-R4-001 … 005). Ảnh (dữ liệu giả): `rounds/round-04/qa/lp-v2/`.
- **Chỉ dữ liệu giả** (DS-E, tên/SĐT giả `+84 900 000 1xx`). Không gửi gì ra ngoài, không đụng staging/production, không khóa thật.
- **Lượt 2** (kiểm lại bản sửa trên `lp-v2` @ `20afedff`): mục 11. **Lượt 3** (`lp-v2` @ `0a25716a`): mục 12 cuối báo cáo. Mục 0–10 là lượt 1, giữ nguyên.

## 0. Kết luận

| Phần | Kết quả | Ghi chú ngắn |
|---|---|---|
| (1) Giá web = báo giá Desk kênh Trực tiếp | **Đạt** | 13/13 ca có số lệch **0 đ**; 5/5 ca không số đúng lý do; 30 đêm, tab tháng, "Any room" không có số ở cả 5 ngôn ngữ; đổi giá trên Desk → web theo trong ≤ 60 giây |
| (2) 5 ngôn ngữ, form, Desk | **Đạt có điều kiện** | Trang, hreflang, nút ngôn ngữ, tràn chữ, axe, privacy, consentMore, gửi form ko/zh/ru đều đạt. **Không đạt** 3 AC phía Desk/chữ: Desk không hiện giá khách đã thấy (BUG-R4-001), Desk hiện khóa chữ thô cho ko/zh (BUG-R4-002), khối giá thiếu 2 ý điều kiện (BUG-R4-003) |
| (3) Bảo mật / hạ tầng qua Caddy thật (SEC C8) | **Đạt** | Một IP dồn dập → 429 từ lượt 31, IP khác vẫn có giá; `X-Forwarded-For` giả bị bỏ; 13/13 ca route; không lộ trường cấm; công tắc tắt → ô ẩn, form vẫn gửi; `publish-privacy-notice` chạy thử 5 ngôn ngữ đạt; `deploy-landing --check-only` đạt |
| (4) LCP/CLS + dung lượng | **Đạt** (đo thủ công, có giới hạn – mục 5) | LCP di động 0,75–0,84 s, CLS ≤ 0,0006, trang chủ 228–334 KB (di động) / 390–497 KB (máy tính); EN/VI tải 0 byte font Hàn/Trung |

Lỗi mới: **0 P0 · 0 P1 · 4 P2 · 1 P3**. Không có ESC mới.

Đề xuất của QA cho QC: phần giá phía khách (US-131 AC1–AC9, AC11, AC13) và US-174 đạt kỹ thuật. Chưa phát hành được trọn gói khi chưa sửa BUG-R4-001 (US-131 AC10 – Must), BUG-R4-002 (US-175 AC3 – Must) và BUG-R4-003 (US-131 AC4). Cổng ngoài QA vẫn còn: người bản xứ + luật sư (US-174 AC10), nhãn version thông báo thật (SEC C3), C7 nhánh Google Chat, rate parity INV (US-131 AC12 (3)).

## 1. Môi trường

| Hạng mục | Giá trị |
|---|---|
| Stack | Dùng một lần `ottimo-qalp2` (compose dev `infra/docker-compose.yml` + overlay QA, mạng `172.31.42.0/24`). Cổng chỉ `127.0.0.1`: landing 58400 (HTTPS), Desk 58401–58403, api 53402, PostgreSQL 55402. Dừng và xóa (`down -v`) sau khi xong |
| Image (dựng tại chỗ từ `83c13990`) | api `ottimo-api:qalp2` (`e8b3c9a056f6`, có test-support), Desk `ottimo-web:qalp2` (`12f12c028625`), landing `ottimo-landing:qalp2` (`bd21d8365f1a`, `LANDING_BOOKING_FORM=true`, slug `dlt`; `check:dist` 14/14 nhóm đạt trong lúc dựng) |
| Caddy | `Caddyfile.landing` **thật** của nhánh mount vào landing, `LANDING_PUBLIC_API=on`, landing ở IP cố định `172.31.42.11` = `TRUST_PROXY` của api (giống `edge` production) |
| Api | `LANDING_LOCALES=en,vi,ko,zh,ru`, khóa ký form ngẫu nhiên tạm (`make-ci-env.sh`), `CLOCK_MODE=mutable` |
| Migration | 66 mục, mục cuối `0091_lp_v2_price_estimate_locales` (`when` 1792782171681) – áp sạch trên DB mới; seed DS-E |
| Trình duyệt | Chromium Playwright 1.63 (headless), axe-core 4.13 |

### 1.1 Dữ liệu – mô phỏng "ngày chuyển S" của DOM (reconcile mục 2.2–2.3)

Làm bằng API như OWN (`qa.owner`), **hiệu lực 01/11** (ngày nghiệp vụ của stack):
- Giá niêm yết 10 căn: Studio City 101/201 và Garden 102/103/202/203 = **800.000**/đêm, Premium 302/402 = **1.100.000**, Signature 301/401 = **1.300.000**; giá tháng theo bảng DOM 2.2. Tất cả 200.
- Tham số: `weekend_uplift_pct` 0, `special_uplift_pct` 0, `los_discount` `[]`, `long_stay_required_from_nights` 30, `short_stay_max_nights` 29, `ota_base_rate` `{"L12":800000,"N":1300000,"NPLUS":1100000}`, `long_stay_compare_from_nights` 30. Tất cả 200. `extra_adult_fee` 150.000 và `child_fee_6_11` 100.000 giữ nguyên (ESC-045 câu 3 = A).
- `public_booking_requests_enabled` = true (sau khi đăng thông báo 5 ngôn ngữ – mục 4.4), `public_show_prices` = true.
- **Vướng:** `PATCH /rooms/{id}` trả 200 nhưng **không lưu** `publicRoomType` → mọi hạng ra "giá theo yêu cầu" (lượt chạy đầu `parity-run1`: 10/10 ca `on_request`). QA đặt `room.public_room_type` theo `production-defaults.ts` bằng SQL trên stack thử rồi chạy lại → **BUG-R4-004**.

## 2. (1) Giá web = báo giá Desk (US-131 AC2, AC3, AC6, AC7, BR-115)

Cách đo: web = `GET /v1/public/properties/dlt/price-estimate` **qua Caddy landing**; Desk = `POST /quotes/calculate` (`qa.fd`, kênh `direct`) cho **từng căn** của hạng, lấy số nhỏ nhất (đúng luật "Từ" BR-115 (2)). Script: `parity.mjs` (lượt `run2`, 14:44).

| Ca | Đầu vào | Kỳ vọng | Web | Desk (từng căn) | Lệch | KQ |
|---|---|---|---|---|---|---|
| P01 | Garden, 2 NL, 10→11/11 (thứ Ba) | 800.000 | 800.000 | 102/103/202/203: 800.000 | 0 | Đạt |
| P02 | Garden, 2 NL, 13→15/11 (thứ Sáu + thứ Bảy) | 1.600.000 | 1.600.000 (`upliftNights` 0) | 1.600.000 ×4 | 0 | Đạt |
| P03 | Premium, 2 NL, 31/12→02/01 (ngày đặc biệt) | 2.200.000 | 2.200.000 | 302/402: 2.200.000 | 0 | Đạt |
| P04 | Garden, 2 NL, 09→16/11 (7 đêm) | 5.600.000 | 5.600.000 (`losDiscountPct` 0) | 5.600.000 ×4 | 0 | Đạt |
| P05 | Garden, 2 NL, 09→23/11 (14 đêm) | 11.200.000 | 11.200.000 | 11.200.000 ×4 | 0 | Đạt |
| P06 | Garden, 2 NL, 09/11→08/12 (**29 đêm**) | 23.200.000 | 23.200.000 | 23.200.000 ×4 | 0 | Đạt |
| P07 | City, **3 NL**, 13→15/11 | 1.900.000 | 1.900.000 | 101/201: 1.900.000 | 0 | Đạt |
| P08 | Garden, 2 NL + **trẻ 8 tuổi**, 10→11/11 | 900.000 | 900.000 | 900.000 ×4 | 0 | Đạt |
| P09 | Garden, 2 NL + **trẻ 4 tuổi**, 10→11/11 | 800.000 | 800.000 | 800.000 ×4 | 0 | Đạt |
| P10 | Signature, 4 NL + trẻ 8 + trẻ 3, 16→23/11 | 9.800.000 | 9.800.000 | 301/401: 9.800.000 | 0 | Đạt |
| P11 | Signature, 5 NL, 02→09/11 (7 đêm, có cuối tuần) | 10.150.000 | 10.150.000 | 10.150.000 ×2 | 0 | Đạt |
| P12 | Premium, 3 NL + trẻ 8, 10→12/11 | 2.400.000 | 2.400.000 | 2.400.000 ×2 | 0 | Đạt |
| P13 | City, 2 NL, 10→13/11 (3 đêm) | 2.400.000 | 2.400.000 | 2.400.000 ×2 | 0 | Đạt |
| N01 | Garden, **4 NL** | không số | `party_exceeds_room` | 422 `CAPACITY_EXCEEDED` ×4 | – | Đạt |
| N02 | City, đến **thứ Bảy 14/11, 1 đêm** | không số | `on_request` + `notes[min_stay, 2]` | 422 (ở tối thiểu) | – | Đạt |
| N03 | Premium, đến **31/12, 1 đêm** | không số | `on_request` + `notes[min_stay, 2]` | 422 | – | Đạt |
| N04 | Garden, 09/11→09/12 (**30 đêm**) | lời mời, không số | `monthly_offer` + `notes[long_stay_required]`, không token | 422 (thuê dài hạn) | – | Đạt |
| N05 | Premium, 31/12→03/01 (đêm 02/01 sau `open_until`) | không số | `on_request` | 3.300.000 (Desk vẫn tính) | – | Đạt (đúng BR-115 (6)) |
| M01 | `stayType=long`, Garden, 01/12, 1 tháng | lời mời, không số | 200 `monthly_offer`, không số, không token | – | – | Đạt |
| M02 | `stayType=long`, Signature, 01/12, chưa chắc số tháng | như trên | như trên | – | – | Đạt |

Số kỳ vọng P02, P03, P06, P07, P10, P11, P12 trùng ví dụ BR-115 v0.5.0 / DOM reconcile 2.4 (C1–C4).

**Trên trang (5 ngôn ngữ, `form.spec.ts`, 1280 px):** cùng hạng Garden, 2 NL từ 10/11 – 1 đêm = 800.000, 7 đêm = 5.600.000, 29 đêm = 23.200.000 (gợi ý dưới ô ngày "29 nights"), **30 đêm** = lời mời "A special offer for longer stays" **không số** (gợi ý "30 nights. We will quote our long-stay rate."), tab **tháng** = lời mời không số, **"Any room"** = câu chọn hạng, không số. Đủ 5/5 ngôn ngữ (ảnh `01`–`12`). Số `<data value>` giống hệt nhau giữa các ngôn ngữ; định dạng: en/ko/zh `800,000 VND`, vi `800.000 VND`, ru `800 000 VND` (AC11). Khách thêm: `Includes one more guest.` / `С учётом ещё одного гостя.` (P07, P08 trên trang).
- Chọn tab tháng **trước** khi trang biết công tắc giá (UXD FE-01): trang gọi một lần `stayType=long` (hạng đầu danh sách, giả định FE G6) → lời mời, không số – 5/5 ngôn ngữ, 390 px không tràn.
- Thời gian từ lúc chọn hạng tới khi hiện số: 456–553 ms (máy cục bộ, không giả lập 4G) – AC1 ≤ 1,5 s đạt trong điều kiện này.

**AC6 – đổi giá trên Desk, web đổi theo** (`ac6.mjs`, ngày nghiệp vụ dời sang 02/11 bằng đồng hồ thử): OWN đặt Garden 870.000 từ 10/11 → web 10→11/11 hiện **870.000 sau 60 s** (TTL cache 60 s; AC ≤ 10 phút); 09→11/11 = 800.000 + 870.000 = **1.670.000**; 08→09/11 giữ **800.000**. Desk báo giá cùng số ở cả 3 ca.

**AC7 (không phụ thuộc phòng trống):** chỉ kiểm gián tiếp – 3 yêu cầu và giữ chỗ không đổi số; không có đơn thật trên các căn trong lượt này. Test tĩnh "không đọc đơn đặt" của BE có (SEC SR-PE-04).

## 3. (2) Năm ngôn ngữ, form, Desk (US-174, US-175)

### 3.1 Trang × ngôn ngữ (`pages.spec.ts`, 15 trang: trang chủ, privacy, 404 × en/vi/ko/zh/ru)

| Kiểm | Kết quả |
|---|---|
| Trạng thái | Trang chủ, privacy 200; 404 đúng ngôn ngữ (`/zh/x` → trang 404 `lang="zh-Hans"`) |
| `html lang` | `en`, `vi`, `ko`, `zh-Hans`, `ru` – 15/15 đúng |
| `hreflang` | Mỗi trang chủ/privacy có 5 ngôn ngữ + `x-default` (= EN), URL tuyệt đối `https://ottimo.vn/…`, **hai chiều** và trùng canonical: 0 lệch. Mã trần `zh` theo ARC D10 (thay giả định `zh-Hans` của PO AC3). 404 không có hreflang (`noindex`) |
| Nút ngôn ngữ | Mọi trang, EN đứng đầu, tên tự xưng `English · Tiếng Việt · 한국어 · 简体中文 · Русский`, `aria-current` đúng trang, link tới **cùng trang** ở ngôn ngữ khác (404 → trang chủ). Mở bằng Enter, Esc đóng (15/15) |
| Tràn ngang 320 / 360 / 375 / 1024 px | 0 px ở 60/60 lượt; không nút/nhãn nào bị cắt (một tiêu đề ẩn `.sr` của form bị đếm là "cắt" – là chữ cho trình đọc màn hình, không phải lỗi) |
| axe WCAG 2.0/2.1 A+AA + 2.2 AA | **0 vi phạm** ở 1280 và 360 px, 15/15 trang |
| Font | EN/VI: **0** tệp font Hàn/Trung/Nga. KO/ZH chỉ tải tệp của mình (ko 4–5 tệp, zh 4–5 tệp); RU tải Onest + Lora cyrillic. Lát CJK lớn nhất 64,5 KB (≤ 80 KB – ARC 3.3) |
| Yêu cầu ra ngoài / lỗi console | 0 / 0 (trừ dòng "404" của chính trang 404) |
| Giá ở thân trang (AC5) | 15 trang × HTML phục vụ qua Caddy: **0** mẫu tiền (`đ`, `₫`, `VND`, `원`, `元`, `руб`, `$`, `/night`, `priceRange`, `offers`…). Ô giá ẩn tới khi khách chọn |
| Thông báo xử lý dữ liệu | 5 trang có đúng một `<meta name="ottimo-notice-version" content="2026-11-01">` + `data-notice-version` cùng giá trị = `data-consent-version` form cùng ngôn ngữ. Δ5 bản L3 (dịch vụ dịch "đọc và trả lời bạn") có ở 5/5, câu điều kiện cũ không còn. **Nhãn `2026-11-01` vẫn là nhãn tạm** (SEC FE-02/C3) |
| `consentMore` | en "…from our server within 180 days", vi "…khỏi máy chủ của OTTIMO…", ko "OTTIMO 서버에서", zh "从我们的服务器删除", ru "с нашего сервера" – 5/5 |
| Link đồng ý | Trỏ `/<lang>/privacy/#…` đúng ngôn ngữ (5/5) |
| Gợi ý ngôn ngữ (AC5) | Trình duyệt `ko-KR` / `zh-CN` / `ru-RU` / `vi-VN` mở `/` → dải gợi ý đúng ngôn ngữ, **không** chuyển hướng; `zh-TW` → không gợi ý (ảnh `27`) |
| `robots` | `noindex, nofollow` vì image thử dựng với `LANDING_INDEXABLE=false` (mặc định) – image phát hành CI đặt true |

### 3.2 Form ở 5 ngôn ngữ, gửi ở ko/zh/ru

| Ngôn ngữ | Khối giá (1 đêm) | Lời mời tháng / 30 đêm | Câu mời viết tiếng Anh (`noteLang`) | Kênh | Gửi |
|---|---|---|---|---|---|
| en | `ESTIMATED RATE · 800,000 VND · for 1 night · Rates in Vietnamese dong (VND). Taxes included. Your final rate is in the quote we send.` | có, không số | – | Zalo (mặc định), WhatsApp, Phone, Email | (công tắc tắt – 4.3) 202 |
| vi | `GIÁ ƯỚC TÍNH · 800.000 VND · cho 1 đêm · Đã gồm thuế. Giá chính thức có trong báo giá…` | có | – | như trên | – |
| ko | `예상 요금 · 1박 기준 · 800,000 VND · …세금 포함. 최종 요금은…` | có | có | như trên | **202**, `WAWZK780`, trang cảm ơn "예상 요금: 1박 기준 800,000 VND" |
| zh | `预估价格 · 1 晚，共 · 800,000 VND · …含税。最终价格以…` | có | có | như trên | **202**, `5S06RVS6` |
| ru | `ОРИЕНТИРОВОЧНАЯ ЦЕНА · 800 000 VND · за 1 ночь · …Налоги включены. Окончательная цена…` | có | có | như trên | **202**, `YHBQWBHK` |

AC4 (4 ý đi liền con số): có (1) "ước tính", (2) "giá cuối trong báo giá", (3) "đã gồm thuế"; **thiếu (4) "chưa giữ phòng / phòng trống xác nhận trong báo giá"** và ý "cho số khách đã chọn" của BR-115 (5) ở cả 5 ngôn ngữ → **BUG-R4-003**.

### 3.3 Desk nhận yêu cầu (US-175, US-131 AC10)

- API Desk (`listWebsiteBookingRequests`, `qa.fd`): 3 yêu cầu vào hàng chờ, `locale` = `ko` / `zh` / `ru`, `stayKind` `short`; tên và lời nhắn chữ Hàn/Hán/Kirin + emoji giữ nguyên từng ký tự; `priceEstimate` = `{nights 1, totalVnd 800000, computedAt …, priceVersion …}` khớp số khách đã thấy (AC1, AC2, AC10 phần dữ liệu – **Đạt**).
- Màn S35 (Desk, `qa.fd`, ảnh `17`–`20`): ru hiện "Tiếng Nga"; **ko/zh hiện khóa chữ thô `webreq.locale.ko` / `webreq.locale.zh`** → **BUG-R4-002**. Ngăn chi tiết **không có dòng "Giá ước tính khách đã thấy"**; mở "Báo giá" sau khi OWN đổi giá thì báo giá ra 870.000 mà không có "Đã đổi: 800.000 → 870.000" (ảnh `21`) → **BUG-R4-001**.
- "Báo giá" từ yêu cầu `ko` (US-175 AC4): hộp báo giá mở, tính giá được (2 lần `quotes/calculate` 200), mẫu chọn EN cho ko/zh theo mã. **Chưa lưu được đến cuối** trong lượt này (ô "Khách đứng tên" bắt buộc, QA chưa tạo hồ sơ khách) – AC4 **chưa kiểm xong**.

## 4. (3) Bảo mật / hạ tầng qua Caddy thật

### 4.1 Giới hạn tần suất (SEC C8, FB-R4-SEC-BE-01) – `c8.sh`

Mỗi máy khách là một container riêng trên mạng stack, gọi `https://landing.localhost` (Caddy landing) → api.

| Bước | Kết quả |
|---|---|
| IP A `172.31.42.61` gửi 200 lượt liên tiếp (235 ms), mỗi lượt kèm `X-Forwarded-For` giả khác nhau | 10 × 200, 20 × 503, **170 × 429 từ lượt 31**, `Retry-After: 600`. XFF giả bị bỏ (Caddy thay bằng IP thật, api đếm đúng IP A) |
| IP B `172.31.42.62` gửi 10 lượt cách 400 ms **trong lúc** A dồn | **8 × 200** có giá; 2 × 503 trong ~0,5 s đầu (30 lượt đầu hợp lệ của A lấp bộ đếm chung 10/giây) |
| Sau đợt dồn: A thêm 1 lượt / IP C mới `172.31.42.63` 1 lượt | A: 429; **C: 200 có giá** |

Kết luận: sửa BE-01 có tác dụng – lượt đã 429 theo IP không còn ăn bộ đếm chung. Một IP chỉ làm IP khác nhận 503 trong khoảng 1 giây cho mỗi 10 phút (30 lượt hợp lệ đầu); đúng rủi ro đã chấp nhận PE-RR4, không ghi lỗi. Trường hợp nhiều IP luân phiên chưa thử (SEC xếp Thấp).

### 4.2 Route qua Caddy + không lộ dữ liệu (`caddy.mjs`)

| Ca | Mong đợi | Thực tế |
|---|---|---|
| GET hợp lệ | 200 | 200 |
| POST / HEAD lên route giá | 404 | 404 / 404 |
| Đường con `…/price-estimate/x`, `/availability`, `/offers` | 404 | 404 |
| Slug viết hoa `DLT` / slug lạ | 404 | 404 / 404 |
| Query 257 byte | 404 (Caddy) | 404 |
| Tham số lạ (`channel=booking`) / tham số lặp | 422 | 422 / 422 |
| `Sec-Fetch-Site: cross-site` | 403 | 403 |
| Hạng lạ (`penthouse`) | 200 không số | 200 `on_request` |

- Phản hồi 200: đúng 13 trường cho phép (`estimate, currency, taxIncluded, roomType, stayKind, arrival, departure, priceAvailable, shortStay, notes, computedAt, estimateToken, expiresAt` + `unavailableReason` khi không số). **Không** có số căn, mã căn, `toTotal`, giá OTA, sàn, chế độ ngang giá, hoa hồng.
- Token `pe1`: payload chỉ có đầu vào chuẩn hóa, tổng, số đêm, `pv`, `iat`, `exp` – không dữ liệu cá nhân, không `propertyId`.
- Header: `Cache-Control: no-store`, `X-Robots-Tag: noindex`, không `Set-Cookie`, không `ETag`.
- `infra/ci/check-caddy-landing.sh` (caddy image ghim) **đạt**; `infra/ci/check-compose.sh` đạt; `docker-compose.prod.yml` có `LANDING_LOCALES: ${LANDING_LOCALES:-en,vi}` (C6).

### 4.3 Công tắc tắt (`public_show_prices` = false, cùng ngày)

- OWN đặt false hiệu lực hôm nay: 200, có hiệu lực **ngay** (công tắc khẩn) – API giá 404.
- Trang (`off.spec.ts`, 390 px): sau lần 404 đầu, ô giá ẩn và trang **không gọi lại**; đổi hạng vẫn ẩn; gửi form **202** (`617MCQZP`), thư cảm ơn không có dòng giá (ảnh `13`).
- Bật lại cùng ngày → 422 "add a row with a later effectiveFrom" (đúng luật bật lại từ ngày sau). QA đặt true từ 02/11 và dời đồng hồ stack để chạy AC6.

### 4.4 Thông báo xử lý dữ liệu và triển khai landing

| Lệnh (OTTIMO_HOME giả, `PN_TEST_DC` trỏ stack thử) | Kết quả |
|---|---|
| `publish-privacy-notice.sh --landing-tag qalp2 --version 2026-11-01` (**chạy thử, không ghi**) | **DRY RUN OK**: 5 ngôn ngữ trong image (en, vi, ko, zh, ru), băm khác nhau từng đôi, version từ thẻ meta = form, 5 trang sống qua Caddy 200 cùng băm, readiness "en+vi+ko+zh+ru"; DB **0 dòng** sau lệnh |
| như trên, `--version 2026-10-31` | REFUSED "/privacy/ shows version '2026-11-01', expected 2026-10-31" |
| như trên, `--apply` (chỉ trên stack thử, để bật form) | published 5 dòng + 1 audit `security`; `url_path` đúng từng ngôn ngữ |
| `deploy-landing.sh qalp2 --no-pull --check-only` (`LANDING_PUBLIC_API=on`, `LANDING_LOCALES=en,vi,ko,zh,ru`) | "CHECK ONLY: qalp2 passes the config, digest and privacy checks – nothing switched or recorded" – 5 ngôn ngữ "same bytes as published" |

Ghi chú nhỏ (không ghi lỗi): trong `state/privacy-notice.log`, chỉ dòng NOTICE đầu được thụt lề, các dòng sau bắt đầu sát lề; `deploy-landing` không đọc nhầm (cột 2 là `apply:` có dấu hai chấm).

## 5. (4) LCP / CLS / dung lượng (ARC FB-R4-ARC-FE-LPV2-04) – `perf.spec.ts`

Repo không có Lighthouse; QA đo bằng Chromium + CDP với thông số "di động" của Lighthouse: 412×823, DPR 1,75, RTT 150 ms, 1,6 Mbit/s xuống, 750 kbit/s lên, CPU ×4, bộ nhớ đệm tắt; "máy tính": 1350×940, DPR 2, RTT 40 ms, 10 Mbit/s. Trang chủ, mỗi ngôn ngữ 3 lượt, lấy trung vị. LCP/CLS theo `PerformanceObserver` tới 3 s sau `load` (bắt cả lúc đổi font).

| Trang chủ | LCP di động | CLS di động | KB di động | LCP máy tính | CLS máy tính | KB máy tính | Phần tử LCP |
|---|---|---|---|---|---|---|---|
| en | 748 ms | 0,0001 | 227,8 | 200 ms | 0,0005 | 390,4 | ảnh hero |
| vi | 756 ms | 0,0001 | 258,1 | 200 ms | 0,0003 | 420,7 | ảnh hero |
| ko | 820 ms | 0,0002 | 279,2 | 224 ms | 0,0002 | 441,8 | ảnh hero |
| zh | 844 ms | 0,0001 | 334,1 | 224 ms | 0 | 496,7 | ảnh hero |
| ru | 784 ms | 0,0006 | 261,6 | 200 ms | 0,0002 | 424,2 | ảnh hero |

Ngưỡng ADR-014 / US-174 AC7: LCP ≤ 2,5 s, CLS ≤ 0,1, tải lần đầu trang chủ ≤ 700 KB → **đạt cả 5**. Font của trang: en 118 KB, vi 147 KB, ko 165 KB (+47 KB Hàn), zh 220 KB (+101 KB Trung), ru 148 KB. Khớp số FE (ko 47,0 / zh 101,2 KB).

Giới hạn: máy chủ cục bộ (TLS nội bộ, không DNS/đường truyền thật), RTT và băng thông là giả lập; không có điểm Lighthouse Performance/Accessibility/SEO (US-174 AC7 nêu ≥ 90/95/95). Nên đo lại một lượt trên staging bằng Lighthouse trước phát hành (OPS dựng Lighthouse CI ở bản sau, như ARC đã nói).

## 6. Kiểm mã đi kèm (trên `83c13990`)

| Bộ | Kết quả |
|---|---|
| Vitest landing (`pnpm --filter @ottimo/landing-web test`, sau `build`) | 12 tệp, **279/279** đạt |
| Vitest api `test/lp-v2-be-units.test.ts` (gồm 9 ca bảng giá 01/11) | **48/48** đạt |
| `check:dist` (trong lúc dựng image landing) | 14/14 nhóm đạt |
| `infra/ci/check-caddy-landing.sh`, `infra/ci/check-compose.sh` | đạt |

Không chạy: `test/integration/lp-v2-price-estimate.test.ts` (cần PostgreSQL riêng cho test – BE đã báo xanh); Playwright landing `lp-v2.landing.spec.ts` của FE (dùng API giả – QA thay bằng chạy trên stack thật).

## 7. Độ bao phủ AC

| AC | KQ | Ghi chú |
|---|---|---|
| US-131 AC1 | Đạt | Không số khi chưa chọn hạng, "Any room", ngày chưa đủ; đổi lựa chọn → tính lại. Ô giá ẩn tới lần 200 đầu (FE D6 – ARC đã duyệt) |
| AC2 | Đạt | Tổng + số đêm + dòng khách thêm; không có dòng giảm vì `los_discount` = `[]` |
| AC3 | Đạt | 13/13 lệch 0 đ, mục 2. Ca "giá lẫn trong hạng" của PO không còn ý nghĩa sau một mức giá – thay bằng AC6 (giá đổi theo đêm) |
| AC4 | **Không đạt** | Thiếu ý (4) – BUG-R4-003 |
| AC5 | Đạt | 15 trang, 0 mẫu tiền |
| AC6 | Đạt | ≤ 60 s; đêm trước ngày hiệu lực giữ giá cũ |
| AC7 | Đạt một phần | Gián tiếp (mục 2) |
| AC8 | Đạt | Mục 4.2; giới hạn tần suất mục 4.1 |
| AC9 | Đạt | 404 (tắt) → ẩn, gửi được; 429/503/timeout: test FE + vitest `price-estimate.test.ts` |
| AC10 | **Không đạt** | Dữ liệu có ở API, Desk không hiện – BUG-R4-001 |
| AC11 | Đạt | VND, số như nhau giữa ngôn ngữ |
| AC12 | Ngoài QA | Cổng INV/SEC; công tắc bật/tắt được – đạt |
| AC13 | Đạt | CLS 0,0001–0,0006; 360 px không tràn với ru và số dài nhất (23.200.000 – 29 đêm); `role="status"` có (FE e2e) |
| US-174 AC1–AC6, AC8, AC9, AC11, AC12 | Đạt | Mục 3.1–3.2; AC2 (khóa chữ) theo vitest `copy.test.ts`; AC6 font: kiểm bằng mắt ảnh 360/1024 px ko/zh/ru, `glyphs` của `check:dist` |
| US-174 AC7 | Đạt (đo thủ công) | Mục 5, chưa có điểm Lighthouse |
| US-174 AC10 | Ngoài QA | Người bản xứ + luật sư |
| US-175 AC1, AC2 | Đạt | Mục 3.3 |
| US-175 AC3 | **Không đạt** | BUG-R4-002 |
| US-175 AC4 | Chưa kiểm xong | Mục 3.3 |
| US-175 AC5, AC6 | Không kiểm | Báo cáo/xuất dữ liệu và sổ tay – ngoài phạm vi lượt này |

## 8. Chưa kiểm được và vì sao

- **Staging**: theo lệnh ORC không đụng staging/production. SEC C8 yêu cầu "trên staging qua Caddy thật" – QA chạy trên stack thử dùng **đúng** Caddyfile của nhánh và cấu hình `TRUST_PROXY` như production. Trước phát hành nên chạy lại 4.1 trên staging một lượt, và **trước đó** phải có `public_room_type` cho 10 căn (BUG-R4-004).
- Lighthouse thật, 4G thật, thiết bị Android thật (mục 5).
- US-175 AC4 lưu báo giá/giữ chỗ từ yêu cầu ko/zh; AC5, AC6.
- C7 (nhánh Google Chat, `chatSafeText`) – ngoài nhánh này.
- Kiểm token giả mạo/hết hạn khi gửi form (BE có test e2e) – QA không lặp lại.
- Nhiều IP luân phiên làm đầy trần 600 lần tính mới/giờ (PE-RR4).

## 9. Đề nghị ORC ghi decision-log (quyền QA)

`| 2026-11-01 | 4 | QA – kiểm thử LP-v2 trên lp-v2@83c13990 (stack thử, Caddy thật): giá web = Desk kênh Trực tiếp 13/13 ca lệch 0 đ theo bảng giá 01/11; 5 ngôn ngữ đạt (axe 0, tràn 0, hreflang hai chiều); SEC C8 đạt trên stack thử; LCP ≤ 0,85 s, CLS ≤ 0,001. Lỗi mới 0 P0 · 0 P1 · 4 P2 · 1 P3; AC chưa đạt: US-131 AC4, AC10, US-175 AC3 | QA | Quyền QA (kết luận kiểm thử, mức lỗi) |`

## 10. Dọn dẹp

Stack `ottimo-qalp2` đã dừng và xóa kèm volume (`down -v`); image tạm `ottimo-*:qalp2` đã xóa. Script và kết quả thô nằm ngoài repo (scratchpad của phiên QA), không có dữ liệu thật hay khóa thật.

---

## 11. Lượt 2 – 20afedff

- Bước **Kiểm thử lượt 2** | 01/11/2026 15:50–16:25 | QA.
- Bản kiểm: `origin/lp-v2` @ `20afedff` = bản lượt 1 `83c13990` + `lp-v2-be2` `7d9e306f` (BUG-R4-004, 005) + `lp-v2-fe2` `c9372e52` (BUG-R4-001, 002, 003 + ô "Hạng phòng công khai") + `lp-v2-ops2` `0185a935` (4 Minor SEC). Mã lấy bằng `git archive 20afedff` ra thư mục tạm (không checkout vào repo).
- Lỗi: `rounds/round-04/qa/bug-list.md` (cập nhật BUG-R4-001…005, thêm BUG-R4-006…010). Ảnh mới (dữ liệu giả): `rounds/round-04/qa/lp-v2/28`–`41`.

### 11.0 Kết luận lượt 2

| Phần | Kết quả |
|---|---|
| BUG-R4-002, 003, 004, 005 | **Đã sửa – đã xác nhận** (đóng) |
| BUG-R4-001 | **Mở lại (P2)**. Phần hiển thị "Giá ước tính khách đã thấy" / "Khách chưa thấy giá" đạt. Phần "Đã đổi: {cũ} → {mới}" **không hiện** khi căn có hạng công khai dạng nhãn ("Standard Studio · Garden View" – đúng giá trị Desk ghi và production đang có): Desk so nhãn với slug nên luôn ra "hạng phòng khác – không so sánh" |
| Hồi quy | **Đạt**: 13/13 ca giá lệch 0 đ (cả khi hạng là nhãn), 5/5 ca không số, tháng/30 đêm không số ở 5 ngôn ngữ, C8 qua Caddy như lượt 1, Caddy chỉ nhận query ASCII, `deploy-landing` FAIL khi trang không đọc được version, `ops-check priceswitch` đúng 5 tình huống, 15 trang 0 mẫu tiền |
| US-175 AC4–AC6 (phần thiếu lượt 1) | AC4 **đạt một phần** (báo giá + giữ chỗ từ yêu cầu ko/zh thành công, tin mặc định tiếng Anh, ru mặc định tiếng Nga; thiếu câu "Khách dùng tiếng Hàn – tin gửi bằng tiếng Anh" và ngôn ngữ không vào hồ sơ). AC5 **không đạt** (không có báo cáo/xuất, danh sách S35 không có cột ngôn ngữ). AC6 **không đạt** (sổ tay chưa có dòng nào) |
| Ảnh FE `lp-v2-fe2-*` (10 ảnh) | **Đạt** quy tắc che dữ liệu: toàn dữ liệu mock MSW (`mocks/seed.ts`, `mocks/webreq.ts` – ghi rõ "test-only"), email `@example.com`, không QR, không mã cửa, không số tài khoản, không link khách |

Lỗi sau lượt 2: **0 P0 · 0 P1 · 1 P2 mở (BUG-R4-001) · 5 P3 mở (BUG-R4-006…010)**; 4 lỗi đã đóng. Không có ESC mới.

Đề xuất của QA cho QC: phần giá phía khách (US-131 AC1–AC9, AC11, AC13) và US-174 vẫn đạt; US-131 AC4 nay đạt (điều kiện nhỏ BUG-R4-006). **Chưa nên phát hành phần (a)** khi BUG-R4-001 chưa sửa xong: US-131 AC10 (Must) chỉ đạt nửa trên dữ liệu thật. Các P3 (006–010) có thể dời nếu PO chấp nhận; riêng US-175 AC5/AC6 là AC Must chưa có sản phẩm – PO quyết dời hay làm trong gói.

### 11.1 Môi trường

| Hạng mục | Giá trị |
|---|---|
| Stack | Dùng một lần `ottimo-qalp3` (compose dev + overlay QA như lượt 1, mạng `172.31.43.0/24`). Cổng chỉ `127.0.0.1`: landing 58410 (HTTPS, `Caddyfile.landing` thật của `20afedff`), Desk 58411–58413, api 53412, PostgreSQL 55412. Đã dừng và xóa (`down -v`), image tạm đã xóa |
| Image (dựng tại chỗ từ `20afedff`) | `ottimo-api:qalp3` (`INCLUDE_TEST_SUPPORT=1`), `ottimo-web:qalp3`, `ottimo-landing:qalp3` (`LANDING_BOOKING_FORM=true`, slug `dlt`); biến thể `ottimo-landing:qalp3-nometa` cho ca `deploy-landing` (mục 11.6) |
| Api | `LANDING_LOCALES=en,vi,ko,zh,ru`, `TRUST_PROXY` = IP landing, khóa ký form ngẫu nhiên tạm |
| Dữ liệu | Seed DS-E; bảng giá 01/11 nhập bằng API OWN như lượt 1 (10 căn + tham số B1–B6, B9). **Hạng công khai gán bằng API/Desk OWN, không SQL** (mục 11.2). Thông báo xử lý dữ liệu `2026-11-01` đăng bằng `publish-privacy-notice.sh` (chạy thử rồi `--apply`, chỉ trên stack thử); bật `public_booking_requests_enabled`, `public_show_prices` |
| Trình duyệt | Chromium Playwright 1.63 (headless) |

### 11.2 BUG-R4-004 – hạng phòng công khai qua API/Desk OWN

| Ca | Kết quả |
|---|---|
| `listRooms` với owner / manager / lễ tân | 200, **mọi** căn có khóa `publicRoomType` (`null` khi chưa gán) |
| Manager `PATCH {publicRoomType: "standard-studio-garden-view"}` / `{publicRoomType: null}` / kèm trường khác | **403** `FORBIDDEN_ACTION` cả 3; DB không đổi, `version` giữ 1 |
| Lễ tân gửi trường này | 403 |
| Owner gửi `""`, `"   "`, 61 ký tự, số `42`, mảng | **422** `VALIDATION_FAILED` cả 5 |
| Owner gửi `"  standard-studio-garden-view  "` | 200, trả và lưu chuỗi đã bỏ khoảng trắng; manager đọc lại thấy cùng giá trị |
| Owner 60 ký tự / không gửi khóa / `null` | 200 lưu đủ 60 / giữ nguyên / xóa |
| Bước gốc của lỗi: owner `PATCH` kèm `publicRoomType` + `listPrice` (10 căn) | 200 ×10, DB có đủ 10 hạng, giá niêm yết lưu |
| Audit | `room.updated` (`config`) ghi `publicRoomType` trước/sau cho mỗi lần 200; không có dòng cho lượt 403/422 |
| **Đổi hạng → web cập nhật ngay** (qua Caddy, không chờ TTL) | Web Garden 800.000 (đã cache) → owner bỏ gán 4 căn Garden → lượt gọi ngay sau (≈ 5 ms) ra `on_request` → gán lại → ngay 800.000. Chuyển 102 sang hạng thử `qa-test-type` → hạng đó có giá ngay; trả về → `on_request`. Manager thử bỏ gán (403) → web vẫn 800.000 |
| Desk – ngăn sửa căn, **owner** (ảnh `39`) | Có ô chọn "Hạng phòng công khai": "Chưa gán" + 4 nhãn e-brochure; giá trị cũ ngoài danh sách vẫn hiện để không mất. Chọn "Standard Studio · Garden View" → Lưu → `PATCH {"publicRoomType":"Standard Studio · Garden View"}` 200 |
| Desk – **manager** (ảnh `40`) | Chỉ đọc: nhãn hạng + "Chỉ chủ đầu tư đổi được hạng này."; sửa "Bố trí giường" rồi Lưu → `PATCH {"bedSetup":…}` 200, **không** mang `publicRoomType` |
| Giá web với hạng **dạng nhãn** (giá trị Desk ghi, như production) | 13/13 ca giá lệch 0 đ (lượt `parity-run2`), slug của nhãn khớp landing |
| Desk S35 cột "Hạng phòng" | Nay hiện nhãn "Standard Studio · Garden View" (lượt 1: slug) – ảnh `41` |

Ghi nhận cho ARC (không ghi lỗi): API nhận chuỗi tự do (QA đặt được `qa-test-type`, web tính giá cho hạng đó ngay). Đúng hợp đồng (Desk khóa bằng danh sách); chỉ OWN gọi được nên rủi ro thấp.

**Kết luận: BUG-R4-004 đã sửa – đã xác nhận.**

### 11.3 BUG-R4-001 – Desk: giá khách đã thấy và "Đã đổi"

Yêu cầu gửi từ landing thật (form 5 ngôn ngữ, mục 11.4): `AKKNTH8R` (ko), `C9GXC214` (zh), `DDYRBQA3` (ru) – Garden, 2 người lớn, 10→11/11, đều thấy 800.000; `3F97RZX0` (zh) – tab tháng, không thấy giá.

| Ca | Kết quả |
|---|---|
| Ngăn chi tiết yêu cầu có giá | "Giá ước tính khách đã thấy: 800.000 đ – tính lúc 01/11/2026 16:07" (ko/zh/ru) – **đạt** (ảnh `33`) |
| Yêu cầu không có giá | "Giá ước tính khách đã thấy: Khách chưa thấy giá" – **đạt** (ảnh `34`) |
| Báo giá cùng ngày/số khách, căn 102, **trước** khi đổi giá (102 = nhãn "Standard Studio · Garden View") | Tổng 800.000 nhưng Desk ghi "Khách đã thấy 800.000 đ cho ngày, số khách **hoặc hạng phòng khác** – không so sánh" – **sai**, mong đợi "Khớp giá ước tính…" |
| OWN đổi giá đêm 4 căn Garden thành 870.000 từ 10/11 → báo giá căn 102 | Tổng 870.000, vẫn "…hạng phòng khác – không so sánh", **không** có "Đã đổi: 800.000 → 870.000" – **không đạt** (ảnh `35`). Cùng kết quả ở `C9GXC214` (căn 202) và `DDYRBQA3` (căn 203) |
| Đối chứng: OWN đặt tạm căn 103 = slug `standard-studio-garden-view` → báo giá căn 103 | Hiện cảnh báo "**Đã đổi: 800.000 đ → 870.000 đ** – Giá Desk tính bây giờ khác số khách đã thấy trên web…" (ảnh `36`) → phần giao diện chạy đúng, chỉ sai phép so hạng |

Nguyên nhân (đọc mã `apps/admin-web/src/pages/webreq/labels.ts` `compareWithSeen`): so `q.publicRoomType === seen.roomType` – bên trái là **nhãn** của căn (`Room.publicRoomType`, ví dụ "Standard Studio · Garden View"), bên phải là **slug** web (`priceEstimate.roomType` = "standard-studio-garden-view"). Hợp đồng 0.3.10 bổ sung 3 ghi rõ `Room.publicRoomType` là nhãn và web dùng **slug của nhãn**. Test FE (`r4-lp-v2-fea.test.tsx`) và ảnh FE `lp-v2-fe2-desk-quote-changed.png` dùng mock có hạng dạng slug nên không bắt được. Production có 10 căn dạng nhãn (BE mục 10.2) → trên dữ liệu thật "Đã đổi" không bao giờ hiện.

**Kết luận: BUG-R4-001 mở lại (P2)** – chi tiết và đề xuất sửa trong bug-list.

### 11.4 BUG-R4-003 – khối giá: số khách + "chưa giữ phòng", cỡ chữ, 360 px (`est.spec.ts`)

Mỗi ngôn ngữ chạy trên trang thật qua Caddy (api khởi động lại trước mỗi ngôn ngữ để bộ đếm 30/10 phút theo IP về 0). Ca: Garden 29 đêm 2 người lớn + 1 trẻ dưới 6 (360 px) → đổi còn 1 người lớn → 1 đêm 2 người lớn → 3 người lớn → 1280 px → 30 đêm.

| Ngôn ngữ | Câu ghi chú đi liền con số (ca 1 đêm, 2 khách) | Số khách đổi theo form | Ý (4) chưa giữ phòng | Ý phòng trống trong báo giá |
|---|---|---|---|---|
| en | `For 2 guests. Rates in Vietnamese dong (VND). Taxes included. No room is held yet. Your quote confirms the final rate and availability.` | 3 / 1 / 2 / 3 guest(s) đúng | có | có |
| vi | `Cho 2 khách. Đã gồm thuế. Chưa giữ phòng cho bạn. Giá chính thức và phòng trống được xác nhận trong báo giá.` | đúng | có | có |
| ko | `2인 기준. 요금은 베트남 동(VND) 기준입니다. 세금 포함. 객실은 아직 확보되지 않았습니다. 최종 요금과 예약 가능 여부는 견적에서 안내해 드립니다.` | đúng | có | có |
| zh | `适用于 2 位客人。价格以越南盾（VND）计。含税。尚未为您保留房间。最终价格及是否有房，以我们发送的报价为准。` | đúng | có | có |
| ru | `Для 2 гостей. Цены во вьетнамских донгах (VND). Налоги включены. Это ещё не бронирование. Итоговую цену и наличие подтвердим в предложении.` | đúng (`1 гостя`, `3 гостей`) | có | có |

- Đủ 4 ý AC4 ở 5/5 ngôn ngữ: (1) nhãn ước tính, (2) giá cuối trong báo giá, (3) gồm thuế, (4) chưa giữ phòng; thêm "cho n khách" và "phòng trống trong báo giá" của BR-115 (5). Số khách tính cả trẻ dưới 6 (29 đêm, 2 NL + 1 trẻ 4 tuổi → "3 khách", giá vẫn 23.200.000 – đúng BR-110).
- 3 người lớn: tổng 950.000 + dòng "Includes one more guest." + "For 3 guests." – khớp.
- **Cỡ chữ** (CSS tính toán): câu điều kiện `.est-note` **15 px** = nhãn ô form `.f-label` 15 px ở 5/5 ngôn ngữ, 360 và 1280 px – đạt phần câu điều kiện. Nhãn "ESTIMATED RATE / GIÁ ƯỚC TÍNH / 예상 요금 / 预估价格 / ОРИЕНТИРОВОЧНАЯ ЦЕНА" (chính là ý (1)) vẫn **13 px** (`.est-lbl`, chữ hoa giãn – theo UXD `lp-v2-design.md` 220) → BUG-R4-006 (P3).
- **360 px**: tràn ngang trang 0 px, không phần tử nào trong khối giá bị cắt ở 5/5 ngôn ngữ; khối cao 225–248 px (29 đêm, số dài nhất), mép phải 328/360 px. Ảnh `28`–`32`: không ô vuông/ký tự thay thế ở ko/zh/ru.
- 30 đêm và tab tháng: lời mời, **không số** ở 5/5 (hồi quy).
- Trang cảm ơn sau khi gửi (ko/zh/ru): "예상 요금: 1박 기준 800,000 VND" / "预估价格：1 晚，共 800,000 VND" / "Ориентировочная цена: 800 000 VND за 1 ночь".

**Kết luận: BUG-R4-003 đã sửa – đã xác nhận.** (Câu mới cần người bản xứ đọc cùng lượt D4 – cổng US-174 AC10, ngoài QA.)

### 11.5 BUG-R4-002 – nhãn ngôn ngữ trong Desk

Ngăn chi tiết: ko → "Tiếng Hàn", zh → "Tiếng Trung (giản thể)" (cả `C9GXC214` và `3F97RZX0`), ru → "Tiếng Nga" (ảnh `33`, `34`). `strings-en.json` có "Korean", "Chinese (Simplified)". **Đã sửa – đã xác nhận.** Danh sách S35 vẫn chưa có cột ngôn ngữ → BUG-R4-007 (mới, khác phạm vi lỗi 002).

### 11.6 BUG-R4-005 – OpenAPI 0.3.10 bổ sung 3

Đối chiếu mô tả mới của `getPublicPriceEstimate` với đo thật lượt này:

| Mô tả mới | Đo được | KQ |
|---|---|---|
| 30/10 phút/IP → 429 + `Retry-After` | 429 từ lượt **31**, `Retry-After: 600` | khớp |
| 10 lượt/giây cả api (sau bucket theo IP) → 503 | 20–21 lượt 503 trong ~0,4 s đầu của IP dồn | khớp |
| Query > 256 byte → Caddy 404; api 422 | 257 byte → 404; 256 byte có tham số lạ → 422 (tới api) | khớp |
| `Cache-Control: no-store`, `X-Robots-Tag: noindex` | đúng ở 200 | khớp |
| Cache 60 s; xóa ngay khi `updateRoom` | đổi hạng / đổi giá niêm yết lên web ngay lượt kế tiếp | khớp |
| `RoomPatch.publicRoomType` chỉ owner, manager 403 | mục 11.2 | khớp |

`statement_timeout '1s'` không đo lại (đọc mã ở lượt 1). **Đã sửa – đã xác nhận** phía QA; ARC vẫn phải xác nhận mục "0.3.10 bổ sung 3" (BE ghi chờ ARC).

### 11.7 US-175 AC4–AC6 (phần chưa kiểm ở lượt 1)

**AC4 – Chuyển thành báo giá / giữ chỗ (`desk2.spec.ts`, `qa.fd`)**

| Yêu cầu | Báo giá | Ngôn ngữ tin mặc định | Giữ chỗ | Ghi chú |
|---|---|---|---|---|
| `AKKNTH8R` (ko), căn 102, khách "QA Kim Test" | `POST quotes` 201 → `BG-00001` | **English** (ảnh `37`) | `create-hold` 201 → `OTM-00001`, cọc 300.000 (ảnh `38`) | VietQR 409 vì stack thử chưa cài tài khoản nhận – đúng, không phải lỗi |
| `C9GXC214` (zh), căn 202, "QA Zhang Test" | 201 → `BG-00002` | **English** | 201 → `OTM-00002` | |
| `DDYRBQA3` (ru), căn 203, "QA Ivanova Test" | 201 → `BG-00003` | **Русский** | – | |

- Đạt: thao tác không lỗi ở ko/zh; tin gửi tiếng Anh cho ko/zh, tiếng Nga cho ru; yêu cầu `AKKNTH8R` chuyển "Đã thành đơn", báo giá giữ liên kết `website_booking_request_id` (yêu cầu vẫn mang `locale = ko`).
- Không đạt:
  - Desk **không** có câu "Khách dùng tiếng Hàn – tin gửi bằng tiếng Anh" ở hộp báo giá hay giữ chỗ (chỉ tự chọn "English"; chuỗi này không có trong `strings-vi.json`).
  - Hồ sơ khách **không** ghi ngôn ngữ đã dùng: `guest.preferred_locale` vẫn `vi` sau khi báo giá từ yêu cầu ko/zh/ru; cột này chỉ nhận `vi`/`en`/`ru` (CHECK). Mở lại báo giá sau đó sẽ theo hồ sơ (đúng BUG-R3-050 – PO dẫn nhầm "BUG-R3-055" ở US-175 AC4).
  - → **BUG-R4-008** (P3).
- Ghi nhận thêm: câu báo giá tiếng Anh gửi khách ghi "**(1 nights)**, 2 **Adults**" – sai số ít/nhiều, nay khách ko/zh cũng nhận bản này → **BUG-R4-009** (P3, có từ trước LP-v2).

**AC5 – Đếm được**: API `listWebsiteBookingRequests` trả `locale` (đã thấy `ko`, `zh`, `ru`; `en`/`vi` ở lượt 1). Nhưng Desk **không** có báo cáo hay xuất dữ liệu yêu cầu website nào (không có CSV/xuất ở `admin-web`, module `reporting` không đọc yêu cầu website), và danh sách S35 **không** có cột hay bộ lọc ngôn ngữ (ảnh `41`). INV không đếm được khách theo ngôn ngữ trên Desk → **không đạt** – **BUG-R4-007** (P3; PO chọn: thêm cột/lọc ở S35 hay sửa AC5).

**AC6 – Hướng dẫn trả lời**: `product/docs/manual/` (`user-manual-v1.0.md`, `guides/02-le-tan.md`, `05-sale-ctv.md`) **chưa có** dòng nào về khách ko/zh/ru, công cụ dịch hay bỏ tên/SĐT/email trước khi dán. Mục 2.18 vẫn ghi form "đang tắt". Không có trên `lp-v2` lẫn `main` → **không đạt** – **BUG-R4-010** (P3, BA viết, SEC duyệt câu dữ liệu).

### 11.8 Hồi quy nhanh

| Mục | Kết quả |
|---|---|
| 13 ca giá (P01–P13) + 5 ca không số (N01–N05) + tháng (M01, M02) | 20/20 đạt, 13/13 lệch **0 đ** – cả khi hạng là slug (lượt `parity`) và khi là nhãn (lượt `parity-run2`) |
| Tháng / 30 đêm | Web `monthly_offer` không số, không token; form 5 ngôn ngữ: 30 đêm và tab tháng không số; "month first" ko/zh/ru không số, 390 px không tràn |
| US-131 AC6 (đổi giá) | OWN đổi Garden 870.000 từ 10/11 → web 10→11/11 = **870.000 ngay lượt kế tiếp** (lượt 1: sau 60 s); 09→11/11 = 1.670.000 = Desk; 08→09/11 giữ 800.000 = Desk |
| AC1 thời gian hiện số | 537–553 ms (ko/zh/ru, máy cục bộ) |
| AC5 thân trang | 15 trang × 5 ngôn ngữ: **0** mẫu tiền |
| C8 qua Caddy (`c8.sh`) | IP A 200 lượt + XFF giả: 9 × 200, 21 × 503, **170 × 429 từ lượt 31**, `Retry-After: 600`; IP B trong lúc A dồn: 8 × 200, 2 × 503 (~0,5 s đầu); sau đợt: A 429, IP C mới **200 có giá**. Giống lượt 1 |
| Ma trận route (`caddy.mjs`) | 13/13 như lượt 1 (POST/HEAD/đường con/slug lạ/257 byte → 404; tham số lạ/lặp → 422; cross-site → 403; hạng lạ → 200 không số); 200 chỉ 13 trường cho phép, `no-store`, `noindex`, không cookie, không ETag |
| **Caddy chỉ nhận query ASCII** (SEC LPV2-03, `ascii.mjs`, gửi byte thô qua TLS) | "ệ" thô ×100 (102 ký tự, 302 byte) → **404**; 1 ký tự "ệ" thô trong query 127 byte → **404**; trộn `%E1%BB%87` + "ệ" thô → **404**; cùng chữ mã hóa `%xx` → tới api (422 tham số lạ); query đúng 256 byte → tới api; 257 byte → 404; tab thô → 400 |
| `publish-privacy-notice.sh` | Chạy thử: DRY RUN OK 5 ngôn ngữ, DB 0 dòng; `--version 2026-11-01.01` → từ chối "must be YYYY-MM-DD or YYYY-MM-DD.N" (S1); `--apply` (stack thử) → published 5 |
| **`deploy-landing` khi trang không đọc được version** (SEC LPV2-02) | Image `qalp3`: CHECK ONLY đạt, 5 ngôn ngữ "same bytes as published". Biến thể `qalp3-nometa` (bỏ thẻ meta của `/ko/privacy/`), proxy mở: **FAIL** "privacy page without exactly one notice version … for ko … nothing switched", **rc 1**. Proxy tắt: WARNING, rc 0. `--rollback` về `qalp3-nometa`: WARNING, rc 0 |
| **`ops-check priceswitch`** (SEC LPV2-04, `ops-check.sh` của `20afedff` chạy với OTTIMO_HOME giả + `dc` trỏ stack thử, **không** webhook) | Lần đầu: OK, lấy mốc id 33. Không đổi: OK. OWN đổi `public_show_prices` (false từ 05/11): **FAIL** "changed 1 time(s) … (now: false)", mốc 111. Lần sau: OK (phục hồi). Hai lần đổi (true 06/11, false 07/11): **FAIL** "changed 2 time(s) … (now: false)", mốc 115. Tệp mốc hỏng (`bad`): coi như lần đầu, không vào SQL |

### 11.9 Rà ảnh FE mới theo quy tắc che dữ liệu

10 ảnh `rounds/round-04/outputs/FE/screenshots/lp-v2-fe2-*` (5 khối giá 360 px, 3 ảnh S35/báo giá, 2 ảnh ngăn sửa căn):
- Dữ liệu từ mock MSW của admin-web (`mocks/seed.ts` ghi "Test-only values"; `mocks/webreq.ts`): tên "Trần Linh", "Đỗ Mai Anh", "Anna Keller", email `@example.com`, mã yêu cầu/khách giả. Không QR, không link khách/check-in, không số tài khoản/chủ tài khoản, không mã cửa, không mã 2 bước, không số giấy tờ. Ảnh khối giá chỉ có số tiền mock.
- **Đạt.** Gợi ý (không chặn): SĐT mock `+84 905 123 456` / `0905***456` đúng định dạng số di động thật – nên đổi mock sang dải `+84 900 000 xxx` như DS-E để ảnh không bao giờ trông như số thật.
- Ảnh QA mới `28`–`41`: chỉ dữ liệu giả (tên "QA …", "김큐에이 테스트", "测试长住 QA", SĐT `+84 900 000 10x`); ảnh giữ chỗ không có VietQR (stack thử không có tài khoản nhận).

### 11.10 Độ bao phủ AC sau lượt 2

| AC | Lượt 1 | Lượt 2 |
|---|---|---|
| US-131 AC4 | Không đạt | **Đạt có điều kiện** – đủ 4 ý + số khách ở 5 ngôn ngữ; nhãn ý (1) 13 px (BUG-R4-006, P3) |
| US-131 AC6 | Đạt | Đạt (nay tức thì khi sửa căn) |
| US-131 AC10 | Không đạt | **Không đạt** – hiện số đã thấy / chưa thấy: đạt; "Đã đổi" không hiện với hạng dạng nhãn (BUG-R4-001 mở lại) |
| US-131 các AC khác | như lượt 1 | không đổi (hồi quy đạt) |
| US-175 AC3 | Không đạt | **Đạt một phần** – chi tiết đạt; danh sách chưa có cột ngôn ngữ (BUG-R4-007) |
| US-175 AC4 | Chưa kiểm xong | **Đạt một phần** – thao tác + ngôn ngữ tin đạt; thiếu câu Desk, hồ sơ không ghi ngôn ngữ (BUG-R4-008, BUG-R3-050) |
| US-175 AC5 | Không kiểm | **Không đạt** (BUG-R4-007) |
| US-175 AC6 | Không kiểm | **Không đạt** (BUG-R4-010) |

### 11.11 Chưa kiểm ở lượt 2 và vì sao

- Không chạy lại vitest/Playwright của FE/BE (FE báo 657 + 281 + 149 đạt, BE 3347 đạt) – QA kiểm hành vi trên stack thật thay vào.
- `atSubmit` ("Lúc khách gửi, hệ thống tính lại") – API chưa trả trường này (chờ ARC), FE chỉ đọc khi có; không kiểm được.
- Staging, Lighthouse thật, thiết bị thật – như lượt 1 (mục 8).
- `deploy-landing` chạy thật (đổi container) với biến thể thiếu meta – chỉ chạy `--check-only` (OPS đã test đổi thật trong `deploy-landing-privacy.test.sh` 15b).

### 11.12 Đề nghị ORC ghi decision-log (quyền QA)

`| 2026-11-01 | 4 | QA – kiểm thử lượt 2 LP-v2 trên lp-v2@20afedff (stack thử, Caddy thật, hạng công khai gán qua API/Desk OWN): BUG-R4-002, 003, 004, 005 đã sửa – đã xác nhận; BUG-R4-001 mở lại (P2: Desk so nhãn hạng với slug web nên "Đã đổi" không hiện trên dữ liệu thật); hồi quy đạt (13/13 ca giá lệch 0 đ, C8, Caddy query ASCII, deploy-landing FAIL khi thiếu version, ops-check priceswitch). Lỗi mới 5 P3 (BUG-R4-006…010). AC chưa đạt: US-131 AC10, US-175 AC3 (danh sách), AC4 (một phần), AC5, AC6 | QA | Quyền QA (kết luận kiểm thử, mức lỗi) |`

### 11.13 Dọn dẹp lượt 2

Stack `ottimo-qalp3` đã dừng và xóa kèm volume (`down -v`), mạng đã xóa; image tạm `ottimo-*:qalp3` và `ottimo-landing:qalp3-nometa` đã xóa; tệp biến môi trường tạm (khóa ngẫu nhiên) đã xóa. Script và kết quả thô ở scratchpad phiên QA (ngoài repo). Không có dữ liệu thật, không khóa thật, không gửi gì ra ngoài.

---

## 12. Lượt 3 – 0a25716a

- Bước **Kiểm thử lượt 3** | 01/11/2026 17:00–18:10 | QA.
- Bản kiểm: `origin/lp-v2` @ `0a25716a` = lượt 2 `20afedff` + `lp-v2-fe3` `73a80804` (BUG-R4-001, 006, UXD minors) + `lp-v2-be3` `2f7b55f7`, `ee375e6d` (BUG-R4-009) + `lp-v2-fe4` `0a25716a` (BUG-R4-007, 008, BUG-R3-050). Mã lấy bằng `git archive 0a25716a` ra thư mục tạm. Sổ tay (BUG-R4-010) đọc trên `main` `38ced860`.
- Căn cứ: PO `lp-v2-stories.md` mục 9 + AC đã sửa (US-131 AC4, AC10; US-175 AC3–AC6); `02-le-tan.md` 13.1c, 13.1d; FE `lp-v2-fe.md` mục 9–10.
- Lỗi: `rounds/round-04/qa/bug-list.md` (cập nhật BUG-R4-001, 006–010; mới BUG-R4-011, 012). Ảnh mới (dữ liệu giả): `rounds/round-04/qa/lp-v2/42`–`56`.

### 12.0 Kết luận lượt 3

| Phần | Kết quả |
|---|---|
| BUG-R4-001, 006, 007, 008, 009 | **Đã sửa – đã xác nhận** (đóng). 009: câu báo giá và trang khách kiểm trên stack; dòng bill OTA chỉ đọc mã (12.6) |
| BUG-R4-010 | **Mở lại (P3)**. Sổ tay đủ 6 ý AC6, khớp tên cột, câu ko/zh, 3 câu mẫu CPY, BR-912. Còn ghi cảnh báo **"Đã đổi: {cũ} → {mới}"**, trong khi Desk nay hiện **"Khác giá web khách đã thấy: {cũ} → {mới}"** (FE3 đổi chữ theo UXD FE-13). Chưa nói câu ghi chú cho khách tiếng Nga |
| **Mới BUG-R4-011 (P2)** | "Tạo nhanh khách" từ yêu cầu khách chọn **Zalo** (kênh mặc định của form) **không lưu được**. Desk điền sẵn "Liên hệ ưu tiên: Zalo", server trả 422 `CONTACT_CHANNEL_EMPTY` (đòi `messagingHandles.zalo`, Desk không gửi). Desk hiện "Nhập **{channel}** trước khi chọn làm liên hệ ưu tiên." (biến chưa thay). Lễ tân phải tự đổi ô về "–" mới lưu được |
| **Mới BUG-R4-012 (P3)** | Hồ sơ tạo nhanh hiện Quốc tịch "–" nhưng server **lưu `VN`** (`isForeigner=false`). Phần "quốc tịch để trống" của BUG-R3-050 chưa đạt |
| BUG-R3-050 (R3, đích v1.0.1) | **Đã sửa phần chính**: ngôn ngữ gửi tin, SĐT, WhatsApp vào hồ sơ; mở lại báo giá không về tiếng Việt; ca EN hồi quy đạt (kênh WhatsApp). Còn: kênh Zalo (BUG-R4-011), quốc tịch (BUG-R4-012) |
| Hồi quy | **Đạt**: 13/13 ca giá lệch 0 đ (hạng dạng nhãn), 5/5 ca không số, tháng/30 đêm không số; C8 qua Caddy; ma trận route 13/13; 15 trang × 5 ngôn ngữ tràn 0 px ở 320/360/375/1024, axe 0, hreflang hai chiều, 0 mẫu tiền |
| Image api | Có `node_modules/@ottimo/contracts/dist` (`index.js`, `public-room-type.js`); gọi `require('@ottimo/contracts').publicRoomTypeSlug` trong image ra đúng 4 slug |

Lỗi sau lượt 3: **0 P0 · 0 P1 · 1 P2 mở (BUG-R4-011) · 2 P3 mở (BUG-R4-010, 012)**; 9 lỗi đã đóng (001–009). Không có ESC mới.

Đề xuất của QA cho QC: US-131 đạt trọn (AC4, AC10 nay đạt). US-175 AC3, AC5 đạt. AC4 **chưa đạt trọn** vì đường chính (khách chọn Zalo) không tạo nhanh hồ sơ được – BUG-R4-011 (P2) nên sửa trước khi phát hành LP-v2 (PO 9.1 B5 đặt "hồ sơ lưu ngôn ngữ gửi tin" là bắt buộc). AC6 đạt về nội dung, còn 2 chỗ lệch chữ với Desk (BUG-R4-010) – sửa nhanh trong sổ tay. BUG-R4-012 có thể đi v1.0.1 cùng BUG-R3-050 nếu PO chấp nhận.

### 12.1 Môi trường

| Hạng mục | Giá trị |
|---|---|
| Stack | Dùng một lần `ottimo-qalp4` (compose dev + overlay QA, mạng `172.31.44.0/24`). Cổng chỉ `127.0.0.1`: landing 58420 (HTTPS, `Caddyfile.landing` thật của `0a25716a`), Desk 58421–58423, api 53422, PostgreSQL 55422. Đã dừng và xóa (`down -v`) |
| Image (dựng tại chỗ từ `0a25716a`) | `ottimo-api:qalp4` (`INCLUDE_TEST_SUPPORT=1`), `ottimo-web:qalp4`, `ottimo-landing:qalp4` (`LANDING_BOOKING_FORM=true`, slug `dlt`; `check:dist` 14/14 nhóm đạt). Đã xóa |
| Api | `LANDING_LOCALES=en,vi,ko,zh,ru`, `TRUST_PROXY` = IP landing, khóa ký form ngẫu nhiên tạm (đã xóa) |
| Dữ liệu | Seed DS-E; bảng giá 01/11 nhập bằng API OWN; **hạng công khai dạng nhãn** ("Standard Studio · Garden View"…) gán bằng API OWN như production; thông báo `2026-11-01` đăng bằng `publish-privacy-notice.sh` (chạy thử rồi `--apply`, chỉ stack thử); bật `public_booking_requests_enabled`, `public_show_prices` |
| Yêu cầu website | Gửi qua landing thật (Caddy): `8F1TBJR8` (ko), `JXEV8FYX` (zh), `05E19A2G` (ru), `DT518MDK` (en, WhatsApp), `MP9FMEMT` (vi), `Y78H8PZA` (en), `N4AVY1MY` (zh, dùng so giá), `6TW4ZT5C` (ko, hồ sơ có sẵn), `FHYZRJS0` (ru, theo tháng), `CR4PQT7K` (vi). Tên "QA …", "김큐에이 테스트", "测试…", "Тест…"; SĐT `+84 900 000 12x`. Thêm 56 dòng ru nhân bản bằng SQL trên stack thử (46 mới, 10 đã đóng, SĐT `+84 900 000 2xx`) để có bộ lọc vượt một trang (Desk tải 50 dòng/trang) |
| Trình duyệt | Chromium Playwright 1.63 (headless), axe-core 4.13 |

Ghi chú dữ liệu: giới hạn gửi form theo IP lưu trong bảng `rate_limit_counter` (không mất khi khởi động lại api). QA xóa bảng này trên stack thử trước mỗi lần gửi. `CR4PQT7K` (vi) và `6TW4ZT5C` (ko) gửi lúc bộ đếm đã đầy nên không mang giá ước tính; gửi lại với bộ đếm sạch (`MP9FMEMT`, `Y78H8PZA`) thì có. Không ghi lỗi (đúng US-131 AC9: lỗi giá không chặn gửi).

### 12.2 BUG-R4-001 – "Khớp" / "Khác giá web khách đã thấy" với hạng dạng nhãn

Mọi căn mang **nhãn** (giá trị Desk ghi, như production). Khách thấy 800.000 (Garden, 2 người lớn, 10→11/11).

| Ca | Desk hiện | KQ |
|---|---|---|
| Ngăn chi tiết 7 yêu cầu (ko/zh/ru/en/vi có giá; ru theo tháng) | "Giá ước tính khách đã thấy: 800.000 đ – tính lúc 01/11/2026 17:12" / "Khách chưa thấy giá" (`FHYZRJS0`); dòng vẫn còn sau khi yêu cầu "Đã thành đơn" | Đạt |
| Báo giá `N4AVY1MY`, căn 102 (nhãn Garden), giá chưa đổi | "Khớp giá ước tính khách đã thấy (800.000 đ)." (ảnh `44`) | **Đạt** (lượt 2: "không so sánh") |
| Căn 101 (City – hạng khác) | "Khách đã thấy 800.000 đ cho ngày, số khách hoặc hạng phòng khác – không so sánh." | Đạt |
| Căn 103 tạm **Chưa gán** (`publicRoomType: null`) | "…không so sánh." (ảnh `46`); gán lại nhãn sau ca | Đạt (đúng giả định FE 9.4) |
| OWN đổi giá 4 căn Garden thành 870.000 từ 10/11 → báo giá căn 103 | Khung cảnh báo "**Khác giá web khách đã thấy: 800.000 đ → 870.000 đ**" + "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá." (ảnh `45`) | **Đạt** |
| Cùng lúc, căn 101 (hạng khác, 800.000) | "…không so sánh." | Đạt |
| Các ca ở 12.4 (ko/zh/ru, căn 102/202/203, giá chưa đổi) | "Khớp giá ước tính khách đã thấy (800.000 đ)." | Đạt |

Web sau khi đổi giá: 10→11/11 = 870.000 ngay lượt kế tiếp; 09→11/11 = 1.670.000 = Desk; 08→09/11 giữ 800.000 = Desk (AC6 hồi quy). **BUG-R4-001: đã sửa – đã xác nhận.**

### 12.3 BUG-R4-006 – nhãn "ước tính" ≥ 15 px

`est.spec.ts`, trang thật qua Caddy, đo `getComputedStyle` của `.est-lbl`, `.est-note` và nhãn ô `.f-label`:

| Ngôn ngữ | Nhãn (360 / 1280 px) | Câu điều kiện | Nhãn ô form | Nhãn xuống dòng / bị cắt | Tràn trang 360 px | Cao khối 29 đêm, 3 khách |
|---|---|---|---|---|---|---|
| en "ESTIMATED RATE" | 15 / 15 px | 15 px | 15 px | 1 dòng / 0 | 0 | 251 px |
| vi "GIÁ ƯỚC TÍNH" | 15 / 15 | 15 | 15 | 1 / 0 | 0 | 228 px |
| ko "예상 요금" | 15 / 15 | 15 | 15 | 1 / 0 | 0 | 243 px |
| zh "预估价格" | 15 / 15 | 15 | 15 | 1 / 0 | 0 | 247 px |
| ru "ОРИЕНТИРОВОЧНАЯ ЦЕНА" | 15 / 15 | 15 | 15 | 1 / 0 (ảnh `54`) | 0 | 251 px |

Tiêu đề lời mời 30 đêm ("A SPECIAL OFFER FOR LONGER STAYS", "ОСОБОЕ ПРЕДЛОЖЕНИЕ ДЛЯ ДОЛГОГО ПРОЖИВАНИЯ"…) cũng 15 px, một dòng, **không số** ở 5/5. Mọi dòng chữ trong khối 15 px (`.est-line` 14 → 15 px theo UXD FE-16). Ru: "за 29 ночей", "Для 1 гостя / 2 гостей / 3 гостей", "за 1 ночь". **BUG-R4-006: đã sửa – đã xác nhận.**

### 12.4 BUG-R4-008 + BUG-R3-050 – câu Desk, hồ sơ tạo nhanh, mở lại báo giá (US-175 AC4)

`desk3.spec.ts`, `qa.fd`, 1366 px. Mỗi yêu cầu: **Báo giá** → chọn căn → ô "Khách đứng tên" gõ tên → **Tạo nhanh khách** → đọc hộp hồ sơ → **Lưu hồ sơ** → **Lưu báo giá** → bước gửi → **Khách đồng ý – Giữ chỗ** → **Tạo giữ chỗ** → mở lại từ **Báo giá & giữ chỗ → Báo giá**.

| Yêu cầu | Hộp hồ sơ điền sẵn | Lưu hồ sơ | Ô "Ngôn ngữ gửi khách" + câu Desk | Giữ chỗ (trước / sau khi tạo) | Mở lại báo giá | Hồ sơ trong DB |
|---|---|---|---|---|---|---|
| `8F1TBJR8` ko → `BG-00001`, `OTM-00001` | SĐT `+84900000121`, Liên hệ **Zalo**, Ngôn ngữ **English**, Quốc tịch "–" (ảnh `47`) | **422** → phải đổi Liên hệ về "–" (BUG-R4-011, ảnh `48`) | English + "Khách viết bằng tiếng Hàn – gửi tin bằng tiếng Anh." (ảnh `49`) | có / có (ảnh `50`) | English + câu, chữ báo giá EN (ảnh `51`) | `en`, quốc tịch **VN** |
| `JXEV8FYX` zh → `BG-00002`, `OTM-00002` | như trên, English | 422 → như trên | English + "…tiếng Trung – gửi tin bằng tiếng Anh." | có / có | English + câu | `en`, VN |
| `05E19A2G` ru → `BG-00003`, `OTM-00003` | Zalo, **Русский** | 422 → như trên | Русский + "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." (ảnh `52`) | có / có | Русский + câu | `ru`, VN |
| `DT518MDK` en (WhatsApp) → `BG-00004`, `OTM-00004` – **ca EN hồi quy BUG-R3-050** | SĐT và **WhatsApp** điền cùng số, Liên hệ WhatsApp, English | **201** | English, không có câu (đúng) | không câu | English | `en`, liên hệ WhatsApp, VN |
| `MP9FMEMT` vi → `BG-00005` | Zalo, Tiếng Việt | 422 → như trên | Tiếng Việt, không câu | – | Tiếng Việt | `vi`, VN |
| `6TW4ZT5C` ko, **hồ sơ có sẵn** cùng SĐT (`KH-0008`, ngôn ngữ `vi`, quốc tịch KR), chọn qua "Hồ sơ có cùng liên hệ → Chọn" → `BG-00006` | – | – (không có `PATCH /guests`) | English + câu tiếng Hàn | – | English + câu (ảnh `53`) – theo yêu cầu liên kết, không theo hồ sơ `vi` | **không đổi** (`vi`, KR, `version` 1) – PO P8 |

- Câu Desk đúng chữ CPY 15.1 ở hộp báo giá (dưới ô ngôn ngữ) và hộp giữ chỗ (dưới thẻ cọc, cả trước và sau khi tạo). Đạt ý 2.
- Mở lại báo giá: Desk gọi `quotes/{id}/text?locale=vi` trước rồi `locale=en`/`ru` ngay sau (khung chữ đổi trong dưới 1 giây). Ghi nhận, không ghi lỗi.
- Ý 4: ngăn chi tiết yêu cầu đã thành đơn vẫn hiện "Ngôn ngữ khách dùng: Tiếng Hàn"; báo giá mở lại đọc ngôn ngữ gốc từ yêu cầu liên kết. Đạt.
- **Ý 3 chưa đạt trọn:** ngôn ngữ gửi tin được lưu đúng (`en`/`ru`/`vi`) **khi lưu được**. Nhưng với kênh Zalo (mặc định của form, 4/5 yêu cầu lượt này) lưu hồ sơ luôn 422 – BUG-R4-011. Quốc tịch hiện "–" nhưng lưu `VN` – BUG-R4-012.
- Gốc BUG-R4-011 (gọi thẳng API, `qa.fd`): `createGuest {phone, preferredContact: zalo}` → 422 `CONTACT_CHANNEL_EMPTY`; `{phone, preferredContact: phone}` → 201; `{phone, messagingHandles: {zalo}, preferredContact: zalo}` → 201. Desk coi Zalo dùng ô "Số điện thoại / Zalo" (kiểm phía máy cho qua) và không có ô Zalo riêng. Vì vậy lỗi đã có từ trước với hồ sơ tạo tay chọn Zalo; lượt này LP-v2 làm nó thành **mặc định** cho mọi yêu cầu Zalo. Đường "Tạo đơn" / "Ở dài ngày" dùng cùng `GuestPicker` + điền sẵn nên nhiều khả năng cùng lỗi (chưa chạy).

**BUG-R4-008: đã sửa – đã xác nhận** (phạm vi của lỗi: câu Desk + ngôn ngữ vào hồ sơ + mở lại). Phần chặn mới tách thành BUG-R4-011, 012.

### 12.5 BUG-R4-007 – S35: cột, lọc, tổng số (US-175 AC3, AC5)

`desk3.spec.ts` stage `list`, `qa.owner`, 1366 và 1280 px. Tổng Desk so với `listWebsiteBookingRequests` (`total`, gọi với `limit=50` và `limit=1`):

| Bộ lọc trạng thái | Mọi ngôn ngữ | en | vi | ko | zh | ru |
|---|---|---|---|---|---|---|
| Mới + Đang xử lý (mặc định) | 52 (tải 50 + "xem thêm") | 1 | 2 | 1 | 1 | 47 |
| Mọi trạng thái (gồm Đã thành đơn, Đã đóng, Spam) | 66 (tải 50) | 2 | 2 | 2 | 2 | **58 (tải 50)** |
| Chỉ Đã thành đơn + Đã đóng | 14 | 1 | 0 | 1 | 1 | 11 |

- 18/18 ô: số Desk "{n} yêu cầu khớp bộ lọc" = `total` API, và `total` không đổi giữa `limit=50` và `limit=1` → không phụ thuộc trang đã tải. Đạt AC5 (ảnh `42`, `43`).
- Cột "Ngôn ngữ" (thứ 7) hiện đúng nhãn VI: Tiếng Anh · Tiếng Việt · Tiếng Hàn · Tiếng Trung (giản thể) · Tiếng Nga; lọc từng ngôn ngữ chỉ còn dòng ngôn ngữ đó; kết hợp được với nút trạng thái. Đạt AC3.
- Bật "Chỉ yêu cầu tôi đang xử lý": không hiện số (đúng ghi chú FE 10.1 – tránh số sai).
- API: `locale=ja` / `locale=KO` → 422 `NOT_IN_LIST`; `locale=ko,zh` → 4.
- **1366 px:** trang không tràn ngang (0 px). Bảng vẫn cuộn ngang trong khung: `scrollWidth` 1215 / khung 1084. Ẩn tạm cột Ngôn ngữ trên cùng bản → 1122 (cột rộng 93 px). So với số FE đo trước lượt này (1440) thì bảng cuộn ít hơn; so với "cùng bản, không có cột" thì cột làm cuộn thêm 93 px. AC3 "không cuộn ngang thêm vì cột mới" phụ thuộc mốc so – FE đã nhờ UXD xác nhận bố cục; QA không ghi lỗi.
- Không kiểm Desk giao diện tiếng Anh ("Language", "Matching requests: {n}") – chỉ đọc chuỗi `strings-en.json`.

**BUG-R4-007: đã sửa – đã xác nhận.**

### 12.6 BUG-R4-009 – số ít/nhiều trong chữ gửi khách

Báo giá tạo bằng API (`qa.fd`, khách giả), `getQuoteText` 3 ngôn ngữ:

| Ca | en | ru | vi |
|---|---|---|---|
| 1 đêm, 1 người lớn (`BG-00007`) | (1 night), 1 adult | (1 ночь), 1 взрослый | (1 đêm), 1 người lớn |
| 2 đêm, 2 người lớn (`BG-00008`) | (2 nights), 2 adults | (2 ночи), 2 взрослых | (2 đêm), 2 người lớn |
| 5 đêm, 5 người lớn (`BG-00009`) | (5 nights), 5 adults | (5 ночей), 5 взрослых | (5 đêm), 5 người lớn |
| 21 đêm, 2 người lớn (`BG-00010`) | (21 nights), 2 adults | **(21 ночь)**, 2 взрослых | (21 đêm), 2 người lớn |
| Báo giá từ yêu cầu (12.4) | "Room 102 The Fern, 10/11/2026 → 11/11/2026 (1 night), 2 adults." | "(1 ночь), 2 взрослых" | "(1 đêm), 2 người lớn" |

- **Trang khách** (guest-web, link khách cấp cho đơn đã cọc, dữ liệu giả): `OTM-00005` ru "1 дек. → 2 дек. · 1 ночь"; `OTM-00006` ru "3 дек. → 5 дек. · 2 ночи" (ảnh `55`); `OTM-00009` en "8 Dec → 9 Dec · 1 night" (ảnh `56`); `OTM-00007` en "14 Dec → 16 Dec · 2 nights"; `OTM-00008` vi "17/12 → 19/12 · 2 đêm". Trang theo ngôn ngữ hồ sơ, không theo trình duyệt (như trước).
- Khối giá landing ru (12.3): "за 1 ночь", "за 29 ночей" – đúng.
- **Hóa đơn in (dòng OTA trả trước): chưa kiểm trên stack.** Nhận phòng cần giấy tờ khách chính (409 `CHECKIN_CONDITIONS_NOT_MET: main_guest_document`); QA không tạo giấy tờ giả qua luồng ảnh trong lượt này. Đọc mã `CheckOutPage.tsx` `Lcount`: mỗi ngôn ngữ của bill (vi, và en khi song ngữ) tự chọn dạng `_one/_few/_many/_other` qua `pluralForm`; chuỗi en "Room charge, 1 night / {n} nights – paid via {channel}". Đề nghị QC hoặc lượt sau kiểm trên Desk tập có máy được cấp quyền.

**BUG-R4-009: đã sửa – đã xác nhận** (câu báo giá – phạm vi của lỗi; trang khách đạt; bill chỉ đọc mã).

### 12.7 BUG-R4-010 – sổ tay đối chiếu với Desk thật (US-175 AC6)

Đọc `product/docs/manual/guides/02-le-tan.md` (bản 1.3) mục 4.2, 13.1c, 13.1d, bảng tra cứu, bài tập 11; `guides/05-sale-ctv.md` 6.3a; `user-manual-v1.0.md` 2.18 (bản 1.6). So với Desk `0a25716a` và CPY `lp-v2-copy.md`:

| Điểm đối chiếu | Sổ tay | Desk thật / nguồn | KQ |
|---|---|---|---|
| AC6 ý 1 – cột, nhãn, lọc, tổng số | "cột **Ngôn ngữ**: Tiếng Anh · Tiếng Việt · Tiếng Hàn · Tiếng Trung (giản thể) · Tiếng Nga", lọc + trạng thái, "Desk hiện tổng số yêu cầu khớp lọc" | đúng (12.5) | Đạt |
| Ngăn chi tiết | "Ngôn ngữ khách dùng", "Giá ước tính khách đã thấy", "{số} – tính lúc {giờ}", "Khách chưa thấy giá" | đúng chữ | Đạt |
| AC6 ý 2 – mặc định tiếng Anh, Русский cho ru | đúng; câu "Khách viết bằng tiếng Hàn/Trung – gửi tin bằng tiếng Anh." ở báo giá và giữ chỗ (dưới phần cọc) | đúng chữ, đúng vị trí | Đạt |
| Câu cho khách tiếng Nga | bảng 13.1d dòng Tiếng Nga và câu dưới bảng chỉ nói ko/zh có câu | Desk **cũng** hiện "Khách viết bằng tiếng Nga – gửi tin bằng tiếng Nga." | **Lệch nhỏ** |
| Cảnh báo chênh giá | **"Đã đổi: {cũ} → {mới}"** kèm "Giá Desk tính bây giờ khác số khách đã thấy trên web…" (`02-le-tan.md` dòng 1015, 1221, 1490; `05-sale-ctv.md` dòng 273–274; `user-manual-v1.0.md` dòng 1142–1143 và lịch sử 1725) | **"Khác giá web khách đã thấy: {cũ} → {mới}"** + "Giá theo lịch giá hôm nay khác số khách thấy trên web. Nói rõ lý do với khách khi gửi báo giá." (ảnh `45`) | **Lệch** – lễ tân tìm chữ "Đã đổi" sẽ không thấy |
| "Khớp giá ước tính…" / "…không so sánh." | đúng chữ | đúng | Đạt |
| AC6 ý 3 – Google Dịch mọi màn hình, khuyên dịch trên ngăn một yêu cầu | có | ESC-044, INV 01/11 câu 9 | Đạt |
| AC6 ý 4 – 3 câu mẫu EN | trùng từng chữ CPY `lp-v2-copy.md` dòng 1106–1135 (câu 1 hai biến thể + câu thêm cho ko/zh, câu 2 hai biến thể, câu 3) | – | Đạt |
| AC6 ý 5 – câu hứa | 07:00–22:00 → 60 phút ("within 1 hour"); ngoài giờ → trước 09:00 | BR-912 (4) | Đạt |
| AC6 ý 6 – 2.18 trạng thái form | đã bỏ "form đang tắt" | – | Đạt |
| 13.1d: "Mở lại báo giá cũ mà ô đang là Tiếng Việt: chọn lại English…" | lời dặn dự phòng | Desk nay tự mở lại đúng ngôn ngữ (12.4) | Không sai, có thể rút gọn |

**BUG-R4-010: mở lại (P3)** – 2 chỗ lệch chữ (bảng trên). Đề xuất sửa trong bug-list.

### 12.8 Hồi quy nhanh

| Mục | Kết quả |
|---|---|
| 13 ca giá P01–P13 + N01–N05 + M01–M02 (`parity.mjs` lượt `run3`, hạng dạng nhãn, trước khi đổi giá) | 20/20 đạt, 13/13 lệch **0 đ** web = Desk từng căn |
| Tháng / 30 đêm | Web `monthly_offer` không số, không token; trang 5 ngôn ngữ: lời mời 30 đêm không số (12.3) |
| C8 qua Caddy (`c8.sh`) | IP A 200 lượt + XFF giả: 10 × 200, 20 × 503, **170 × 429 từ lượt 31**, `Retry-After: 600`; IP B trong lúc A dồn: 7 × 200, 3 × 503 (khoảng 1 giây đầu); sau đợt: A 429, IP C mới 200 có giá. Như lượt 1–2 (PE-RR4) |
| Ma trận route (`caddy.mjs`) | 13/13 đúng; 200 chỉ 13 trường cho phép, `no-store`, `noindex`, không cookie, không ETag; token không có dữ liệu cá nhân |
| 15 trang × 5 ngôn ngữ (`pages.spec.ts`) | Tràn ngang **0 px** ở 320/360/375/1024 (60/60); **axe 0** ở 1280 và 360; hreflang 5 + x-default, hai chiều, 0 lệch; `html lang` đúng; 0 mẫu tiền trong HTML; thông báo `2026-11-01` + Δ5 có ở 5/5; EN/VI 0 tệp font Hàn/Trung; 0 yêu cầu ra ngoài; console chỉ có dòng 404 của chính trang 404 |
| `check:dist` (lúc dựng landing) | 14/14 nhóm đạt |
| Image api có `packages/contracts/dist` | Có; `publicRoomTypeSlug` chạy trong image: "Standard Studio · Garden View" → `standard-studio-garden-view`, "Premium · One Bedroom + 1" → `premium-one-bedroom-1`, "Signature · Two Bedrooms" → `signature-two-bedrooms`, slug giữ nguyên |
| US-131 AC6 (đổi giá) | 12.2 – web theo ngay, đêm trước ngày hiệu lực giữ giá cũ |

### 12.9 Rà ảnh mới theo quy tắc che dữ liệu

- Ảnh QA `42`–`56`: chỉ dữ liệu giả (tên "QA …", "김큐에이 테스트", "测试…", "Тест…", SĐT `+84 900 000 1xx`, mã yêu cầu/đơn của stack thử). Không QR (stack thử không có tài khoản nhận – VietQR 409), không mã cửa, không số giấy tờ, không link khách (ảnh trang khách chụp nội dung trang, không có URL/token).
- Ảnh FE `lp-v2-fe3-*`, `lp-v2-fe4-*` (theo FE: MSW + "Test Guest") – QA không rà lại từng ảnh lượt này.

### 12.10 Độ bao phủ AC sau lượt 3

| AC | Lượt 2 | Lượt 3 |
|---|---|---|
| US-131 AC4 | Đạt có điều kiện | **Đạt** – 4 ý + số khách, cả 4 ý ≥ 15 px ở 5 ngôn ngữ × 360/1280 px |
| US-131 AC10 | Không đạt | **Đạt** – "Khớp", "Khác giá web khách đã thấy: 800.000 → 870.000", khác hạng / chưa gán → không so sánh, trên hạng dạng nhãn |
| US-131 các AC khác | đạt | đạt (hồi quy) |
| US-175 AC3 | Đạt một phần | **Đạt** (ghi chú bảng cuộn ngang ở 1366 px – UXD) |
| US-175 AC4 | Đạt một phần | **Đạt một phần** – ý 1, 2, 4 đạt; ý 3 đạt khi lưu được, nhưng yêu cầu Zalo không tạo nhanh hồ sơ được (BUG-R4-011); quốc tịch lưu VN (BUG-R4-012) |
| US-175 AC5 | Không đạt | **Đạt** – 18/18 tổng số = API, kể cả đã thành đơn/đã đóng và bộ lọc hơn một trang |
| US-175 AC6 | Không đạt | **Đạt một phần** – đủ 6 ý; 2 chỗ lệch chữ với Desk (BUG-R4-010) |
| PO 9.1 B6 (BUG-R4-009, không có AC) | – | Đạt (báo giá, trang khách); bill chỉ đọc mã |

### 12.11 Chưa kiểm ở lượt 3 và vì sao

- Dòng bill OTA trả trước trên Desk (12.6) – cần giấy tờ khách chính để nhận phòng.
- Desk giao diện tiếng Anh (cột "Language", "Matching requests", câu "Guest wrote in…") – chỉ đọc chuỗi.
- "Tạo đơn" / "Ở dài ngày" từ yêu cầu với hồ sơ tạo nhanh (cùng `GuestPicker`) – không chạy; nhiều khả năng cùng BUG-R4-011.
- Không chạy lại vitest/Playwright của FE/BE (FE báo admin-web 674, api 3350 đạt) – QA kiểm hành vi trên stack thật.
- Staging, Lighthouse thật, thiết bị thật, người bản xứ (US-174 AC10) – ngoài lượt này.

### 12.12 Đề nghị ORC ghi decision-log (quyền QA)

`| 2026-11-01 | 4 | QA – kiểm thử lượt 3 LP-v2 trên lp-v2@0a25716a (stack thử, Caddy thật, hạng công khai dạng nhãn): BUG-R4-001, 006, 007, 008, 009 đã sửa – đã xác nhận; BUG-R4-010 mở lại (P3: sổ tay ghi "Đã đổi", Desk ghi "Khác giá web khách đã thấy"; thiếu câu cho khách tiếng Nga); mới BUG-R4-011 (P2: tạo nhanh hồ sơ từ yêu cầu Zalo bị 422 CONTACT_CHANNEL_EMPTY, chữ lỗi lộ "{channel}") và BUG-R4-012 (P3: hồ sơ tạo nhanh lưu quốc tịch VN). Hồi quy đạt (13/13 ca giá lệch 0 đ, C8, route 13/13, 15 trang × 5 ngôn ngữ tràn 0 / axe 0); image api có @ottimo/contracts/dist. AC chưa đạt trọn: US-175 AC4 (ý 3), AC6 (chữ) | QA | Quyền QA (kết luận kiểm thử, mức lỗi) |`

### 12.13 Dọn dẹp lượt 3

Stack `ottimo-qalp4` đã dừng và xóa kèm volume (`down -v`), mạng đã xóa; image tạm `ottimo-*:qalp4` đã xóa; tệp biến môi trường tạm (khóa ngẫu nhiên) và token máy tin cậy tạm đã xóa. Dữ liệu nhân bản (56 dòng ru), máy tin cậy tạm và đồng hồ thử chỉ có trên stack thử đã xóa. Script và kết quả thô ở scratchpad phiên QA (ngoài repo). Không có dữ liệu thật, không khóa thật, không gửi gì ra ngoài.
