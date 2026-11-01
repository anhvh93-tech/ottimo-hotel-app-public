# Báo cáo kiểm thử – gói LP-v2 (Round 4)

- Tác giả: QA | Round 4 – gói LP-v2 – Bước **Kiểm thử** | Ngày 01/11/2026 (14:30–15:40)
- Bản kiểm: nhánh gộp `origin/lp-v2` @ `83c13990` (= `lp-v2-be` `6ae46d4a` + `lp-v2-fe` `a72bcbfc` + `lp-v2-ops` `74e23925`), checkout detached trong worktree QA.
- Căn cứ: PO `outputs/PO/lp-v2-stories.md` (US-131, US-174, US-175); DOM `web-price-estimate-rules.md` mục 11 + `pricing-spec-2026-11-01-reconcile.md`; `product/docs/business-rules.md` v0.5.0 (BR-101, 104, 107, 110, 113, 114, 115, 116); review `reviews/ARC-on-LP-v2-code.md`, `SEC-on-LP-v2-code.md` (C1–C9), `SEC-on-LP-v2-ops.md`, `UXD-on-LP-v2-fe.md`; decision-log 01/11 (ESC-043: tháng không hiện giá; một mức giá; mốc 30 đêm).
- Lỗi mới: `rounds/round-04/qa/bug-list.md` (BUG-R4-001 … 005). Ảnh (dữ liệu giả): `rounds/round-04/qa/lp-v2/`.
- **Chỉ dữ liệu giả** (DS-E, tên/SĐT giả `+84 900 000 1xx`). Không gửi gì ra ngoài, không đụng staging/production, không khóa thật.

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
