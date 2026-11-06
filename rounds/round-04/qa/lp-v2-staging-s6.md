# LP-v2 – Staging S6 (SEC D5 / C8, QC P9–P10)

- Tác giả: QA | Round 4 – bước **Kiểm thử** | Ngày 06/11/2026, 15:57–16:24 giờ VN (08:57–09:24 UTC).
- Căn cứ: runbook `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` mục 3 bước S6; SEC `rounds/round-04/outputs/SEC/lp-v2-privacy-and-api.md` mục 9.5 (11 ca) + L2.3 (ca 12); FB-R4-SEC-BE-01 (`rounds/round-04/responses/BE-LP-v2.md`).
- Môi trường: **chỉ staging** `staging.ottimo.vn` (basic auth, noindex), đi qua edge + Caddy landing thật. api / web / worker / landing đều là `sha-6414be25f20d` (`dc ps` lúc 15:58). api khởi động lại lúc khoảng 15:53 (S5 `REDEPLOY`), nên bộ đếm RAM của route giá bắt đầu từ 0.
- Trạng thái ORC đã làm trước (S0–S5) và QA đã đọc lại bằng SQL READ ONLY: `default_transaction_read_only = on`; 72 migration; thông báo `2026-11-04` đang hiệu lực cho en, ko, ru, vi, zh; `public_booking_requests_enabled = true` và `public_show_prices = true` (hiệu lực 06/11, tạo 08:55 UTC); `website_booking_request` 0 dòng và `rate_limit_counter` 0 dòng trước khi QA bắt đầu.
- Hai nơi gửi: (M) máy Mac của QA, đi Internet ra IP công khai; (S) chính máy chủ, gọi qua SSH tới IP công khai của edge. Log Caddy landing thấy (M) ở dải công khai /24 của Mac, còn (S) ở một dải nội bộ Docker /24, do gọi vòng ngược về chính máy (hairpin). Hai địa chỉ này khác nhau. Báo cáo không ghi IP nào.
- Dữ liệu thử: tên `QA S6 … Test`, email `qa-s6-…@example.test`, SĐT giả `+84 900 000 30x`, lời nhắn "test only, please ignore". Webhook Chat staging rỗng nên không có tin Chat nào được gửi.
- Không chạm production. Không tắt hai công tắc. Không đăng nhập Desk (QA không đăng nhập staging, theo plan 14.1).

## 0. Kết luận

| Nhóm | Kết quả |
|---|---|
| **Ca 6 – IP thật qua `TRUST_PROXY`** | **ĐẠT.** (S) bị 429 ở lượt 31 thì (M) vẫn nhận 200. `X-Forwarded-For` giả, đổi ở mỗi lượt, không giúp (S) thoát bộ đếm. Sau khi bị 429, (S) vẫn gửi được yêu cầu đặt phòng (202) |
| 12 ca SEC 9.5 + BE-01 | **6 ca đạt** (2, 5, 6, 7, 11, BE-01). **2 ca đạt một phần** (1, 12): chỉ đi được nhánh `on_request`. **4 ca chưa chạy** (3, 4, 8, 10): cần tài khoản Desk và nhãn hạng. **1 ca không chạy theo lệnh ORC** (9). **0 ca đỏ** |
| P10 – form 5 ngôn ngữ | **Đạt** về form: 5/5 gửi được 202 qua trình duyệt thật, đúng ngôn ngữ, đúng nhãn thông báo `2026-11-04`. Phải chèn header `Authorization` mới chạy được: xem BUG-R4-054 |
| P10 – 13 ca giá ước tính | **Chưa chạy được (bị chặn).** Cả 10 căn trên staging có `public_room_type = NULL`, nên mọi hạng đều trả `on_request` và không có số nào để so (BUG-R4-055) |
| P10 – BUG-R4-011 / 012 | **Chưa chạy.** Đã có sẵn các yêu cầu thử (Zalo ×3, Email ×3, WhatsApp ×1). Bước "Tạo nhanh hồ sơ" phải làm trên Desk (mục 4) |
| P9 – Lighthouse | **Chưa chạy.** Máy QA không có Lighthouse, và QA không tải gói mới về khi chưa được duyệt. Thay bằng đo Playwright + CDP với thông số di động kiểu Lighthouse, cộng axe (mục 5): 5/5 đạt ngưỡng LCP/CLS/dung lượng, axe 0 lỗi. **Không có điểm Lighthouse** |

Lỗi mới: **0 P0 · 0 P1 · 1 P2 (BUG-R4-055, lỗi môi trường staging) · 1 P3 (BUG-R4-054, lỗi môi trường staging)**. Không có lỗi sản phẩm mới. Không có ESC.

**Ảnh hưởng tới production:** ca 6 đạt, nên không có điều kiện dừng cả đợt. Ca 11 cũng đạt: log không có query và không có IP đầy đủ. QA thấy **không có gì chặn P8–F1** (landing, thông báo, `LANDING_LOCALES`). Riêng **F2 (`public_show_prices` production) nên chờ** tới khi chạy lại phần giá trên staging, sau khi gán nhãn hạng: 13 ca giá cùng các ca 1 (đủ trạng thái), 3, 4, 8, 10 và 12 (nhánh `monthly_offer`). Lý do: chưa có lần kiểm nào trên staging thấy được con số giá.

## 1. Ca SEC 9.5 + BE-01

Route: `GET /v1/public/properties/dlt/price-estimate`, gửi kèm `Sec-Fetch-Site: same-origin` (trừ ca kiểm cross-site). Giờ ghi theo giờ VN.

| Ca | Việc | Kết quả thật | KQ |
|---|---|---|---|
| 1 | Tập khóa JSON = danh sách cho phép; không có số phòng, `ota`, `floor`, `commission` | 6 phản hồi 200 (Garden 1 đêm, Garden 4 người lớn, tháng 6, 30 đêm, hạng lạ `penthouse`, có kèm header) đều có đúng 11 khóa: `estimate, currency, taxIncluded, roomType, stayKind, arrival, departure, priceAvailable, unavailableReason, notes, computedAt`. Đây là tập con của danh sách cho phép. Grep các chuỗi `101…402`, `ota`, `floor`, `commission`, `toTotal` trên mọi thân phản hồi: **0**. Lỗi 422 là problem+json mã chung (`VALIDATION_FAILED`, `field`, `code`, `requestId`), không có stack. **Nhưng** cả 6 phản hồi đều là `on_request` (BUG-R4-055), nên chưa đi được các trạng thái có số, `party_exceeds_room`, `min_stay`, `monthly_offer` | **Đạt một phần** |
| 2 | Thêm `channel=ota`, `promoCode=OTTIMO-BACK5`, `nationality=KR`, `roomId=…` | Cả 4 lượt trả **422** `VALIDATION_FAILED`, `errors[{field: <tên>, code: NOT_ALLOWED}]`, không có số. Mã 422 khớp hợp đồng OpenAPI 0.3.10 (lượt 1 đã chấp nhận; "400" của SEC là mã chung) | **Đạt** |
| 3 | Chiếm hết căn Signature bằng đơn staging, so byte phản hồi | Chưa chạy: cần tạo đơn trên Desk, mà QA không đăng nhập staging. Hiện so byte cũng vô nghĩa vì phản hồi luôn là `on_request` (BUG-R4-055) | **Chưa chạy** |
| 4 | Hạng 2 căn khác giá: web chỉ có "từ", Desk thấy "từ" và "đến" | Chưa chạy: bị chặn bởi BUG-R4-055, và phải mở Desk mới xem được | **Chưa chạy** |
| 5 | POST yêu cầu kèm số tiền giả | (a) Kèm `"estimate":1000`: **422** `{field: estimate, code: NOT_ALLOWED}`, không tạo dòng nào. (b) Kèm `priceEstimateToken` giả mạo (`pe1.…`): **202** `8F0DB4C5`, DB ghi `price_estimate = NULL`, `suspicious_flags = {room_type_unmatched, offer_unverified}`. Server không lưu số nào từ trình duyệt. Phần "Desk hiện số server tính" chưa xem được, vì Desk cần đăng nhập và hiện chưa có số (BUG-R4-055) | **Đạt** (phía API/DB) |
| **6** | 31 lượt / 10 phút cùng IP → lượt 31 bị 429; POST từ IP đó vẫn được nhận; hai mạng có bộ đếm riêng; XFF giả bị thay | **(S)**, 16:10:46–16:10:53: lượt 1–30 trả **200**, lượt 31 trả **429** `Retry-After: 593`. Mỗi lượt kèm `X-Forwarded-For: 198.51.100.<i>` và `X-Real-IP: 203.0.113.<i>`, đổi theo từng lượt, nhưng cả 31 lượt vẫn dồn vào **một** bộ đếm. **(M)** lúc 16:11:04 trả **200** (0,12 s), lúc 16:11:11 trả **200**. **(S)** gửi lại với XFF `192.0.2.77` lúc 16:11:05 vẫn bị **429**. **(S)** POST yêu cầu đặt phòng lúc 16:11:10 trả **202** `CBAMSZAF`. Log Caddy landing ghi `client_ip` theo IP thật của từng nơi gửi (đã cắt /24), và không có giá trị XFF giả nào (0 dòng) | **Đạt** |
| 7 | Dội tải ~50 lượt/giây trong 30 giây: Desk vẫn nhanh; `rate_limit_counter` không có dòng nào cho route giá | **(S)** gửi 1.500 lượt từ 16:21:36 tới 16:22:15. Máy chủ chỉ tạo tiến trình kịp **khoảng 38 lượt/giây trong 39,5 giây**, thấp hơn 50/giây nhưng tổng số lượt nhiều hơn yêu cầu. Kết quả: 9 × 200, 21 × 503 (bộ đếm chung 10/giây trong khoảng 1 giây đầu), **1.470 × 429**. Cùng lúc, (M) đo 30 lượt mỗi loại: Desk `/` 200, chậm nhất **0,198 s**; `/api/health` (có kiểm DB) 200, chậm nhất **0,194 s**; `/v1/me` 401, chậm nhất 0,202 s. `rate_limit_counter` sau đợt dội chỉ có khóa `webreq:*` của route POST, **0** dòng của route giá. **Thay thế:** chưa mở được *danh sách yêu cầu* trên Desk vì cần đăng nhập, nên dùng thời gian phản hồi của Desk và api health thay cho chỉ số đó | **Đạt** (đo thay thế) |
| 8 | OWN đổi giá một căn → web ra số mới trong ≤ 60 giây | Chưa chạy: cần OWN thao tác trên Desk, và hiện chưa có số (BUG-R4-055) | **Chưa chạy** |
| 9 | Tắt công tắc → 404, form vẫn gửi được | Không chạy: ORC dặn không tắt công tắc. Lượt 1 trên stack thử đã đạt (`lp-v2-test-report.md` 4.3) | **Không chạy (theo lệnh)** |
| 10 | Một căn giá 0, gọi 100 lần → OWN nhận đúng 1 thông báo | Chưa chạy: phải sửa giá trên Desk bằng OWN | **Chưa chạy** |
| 11 | Log api + Caddy sau ca 6: không có query string, không có IP đầy đủ | Log từ 16:00 trở đi. **api:** 1.567 dòng có `price-estimate`. Tất cả chỉ ghi `route: /v1/public/properties/:propertySlug/price-estimate` và `method`, không có query (0 dòng có `roomType`/`arrival=`) và không có IPv4 (0 dòng). **Caddy landing:** 1.580 dòng. `uri` luôn có dạng `…/price-estimate?[q]` (query đã che, 0 dòng có `roomType`). `client_ip` / `remote_ip` có octet cuối = 0 ở cả 1.580/1.580 dòng (cắt /24). Không ghi header (0 dòng) | **Đạt** |
| 12 | `months=6` → JSON không có trường tiền | `stayType=long&months=6` trả 200 `{estimate: true, currency, taxIncluded, roomType, stayKind: long, arrival, priceAvailable: false, unavailableReason: on_request, notes: [], computedAt}`. Không có trường tiền nào (`estimate: true` là cờ, không phải số). Nhánh `monthly_offer` chưa đi được (BUG-R4-055) | **Đạt một phần** |
| BE-01 | Một IP bị 429 không chiếm bộ đếm chung của khách khác | Trong đợt dội ca 7, (M) gọi 10 lượt cách nhau khoảng 4 giây: **10/10 trả 200** (0,09–0,33 s). Trong lúc đó (S) nhận 1.470 lượt 429 và chỉ 21 lượt 503, tất cả trong khoảng 1 giây đầu | **Đạt** |

Các kiểm khác của route (gửi từ (S) và (M), qua Caddy thật):

| Kiểm | Kết quả |
|---|---|
| `Sec-Fetch-Site: cross-site` | 403 `FORBIDDEN_ACTION` (M). Lần đầu từ (S) ra 503 vì 11 lượt dồn trong 1 giây làm đầy bộ đếm chung. Thử lại có giãn cách thì ra 403 |
| POST lên route giá; đường con `…/price-estimate/x`; `/availability`; query > 256 byte | 404 (Caddy, trang 404 landing). Không lượt nào tới api |
| Ngày đến trong quá khứ | 422 `DATE_IN_PAST` |
| Header 200 | `Cache-Control: no-store`, `X-Robots-Tag: noindex` (api) + `noindex, nofollow` (Caddy staging), `Content-Type: application/json`. Không có `Set-Cookie`, không `ETag`, không `Last-Modified` |
| `form-token` | 200 (`token`, `notBefore`, `expiresAt`, `minDelaySeconds: 3`) |

## 2. P10 – form 5 ngôn ngữ (trình duyệt thật, Chromium Playwright 1.63, 390 px)

Từ (M), 16:17–16:19. Hạng Garden View, 2 người lớn, 2 đêm, ngày đến từ 18/11 tới 22/11 tùy ngôn ngữ.

| Ngôn ngữ | `html lang` | `data-consent-version` | Khối giá (do BUG-R4-055) | Kênh | Gửi | Mã | DB |
|---|---|---|---|---|---|---|---|
| en | `en` | `2026-11-04` | "No online estimate for these dates. We will include the rate in your quote." | Zalo | 202, trang cảm ơn đúng | `VKSN49P7` | `en`, `zalo`, có SĐT |
| vi | `vi` | `2026-11-04` | "Chưa có giá ước tính trực tuyến cho ngày này. Chúng tôi sẽ báo giá riêng cho bạn." | Zalo | 202 | `608J2GGZ` | `vi`, `zalo`, có SĐT |
| ko | `ko` | `2026-11-04` | "선택하신 날짜는 온라인 예상 요금이 없습니다. …" | Email | 202 | `9H6PJVDC` | `ko`, `email`, có email |
| zh | `zh-Hans` | `2026-11-04` | "所选日期暂无在线预估价格，我们会在报价中告知您。" | WhatsApp | 202 | `0RRSYFEC` | `zh`, `whatsapp`, có SĐT |
| ru | `ru` | `2026-11-04` | "Для этих дат онлайн-оценки нет. Мы укажем цену в предложении." | Zalo | 202 | `6WNGMZRQ` | `ru`, `zalo`, có SĐT |

- Mỗi trang gọi `form-token` 200 → `price-estimate` 200 ×2 → `booking-requests` 202. Console 0 lỗi. Cả 5 yêu cầu được lưu với `consent_version = 2026-11-04`, `price_estimate = NULL`, `suspicious_flags = {room_type_unmatched}` (do BUG-R4-055).
- Trang privacy ko có `<meta name="ottimo-notice-version" content="2026-11-04">` và `data-notice-version` cùng giá trị. 5 trang chủ có `data-consent-version="2026-11-04"`.
- Lượt chạy đầu (dùng `httpCredentials`) thì 5/5 **không gửi được**: `form-token` và `price-estimate` bị 401, và trang hiện "We could not send your request…". Nguyên nhân: script landing gọi `fetch` với `credentials: 'omit'`, nên trình duyệt không gửi basic auth của staging. Lượt này không tạo yêu cầu nào. Chèn header `Authorization` cho mọi request thì chạy được → **BUG-R4-054** (lỗi môi trường staging, production không có basic auth).

## 3. P10 – 13 ca giá ước tính (bị chặn)

Đọc bằng SQL READ ONLY lúc 15:58:

- `room.public_room_type` **NULL ở cả 10 căn** (101–402) và ở căn thử `QAT1`. Production bootstrap có đặt 4 nhãn (`production-defaults.ts`), còn staging thì không. Vì vậy API trả `on_request` cho mọi hạng, và mọi yêu cầu website bị gắn cờ `room_type_unmatched` → **BUG-R4-055**.
- Bảng giá staging **khác** bảng 01/11 mà lượt 1–3 dùng, nên 13 ca P01–P13 không dùng lại số kỳ vọng cũ được:
  - Giá đêm hiệu lực mới nhất: 101 = 800.000 (26/10…29/10); 102, 103 = 850.000; 201 = 700.000; 202 = 750.000; 203 = 792.000; 301 = 958.000; 302 = 917.000; 401 = 1.042.000; 402 = 1.000.000.
  - Tham số: `weekend_uplift_pct` 15, `special_uplift_pct` 30, `los_discount` 10 % từ 7 đêm và 15 % từ 14 đêm, `long_stay_required_from_nights` **28**, `short_stay_max_nights` **27**, `extra_adult_fee` 150.000, `child_fee_6_11` 100.000.
  - Hệ quả: P06 (29 đêm) trên staging thành dài hạn, không có số. Hạng "Garden" gồm các căn khác giá nhau (750.000–850.000), nên mức "từ" phải lấy căn rẻ nhất.
- Đề nghị cách chạy lại (khoảng 20 phút):
  1. OWN thử (`qa.owner`) gán ô "Hạng phòng công khai" cho 10 căn trên Desk staging, theo đúng `production-defaults.ts`: 101, 201 = City View; 102, 103, 202, 203 = Garden View; 302, 402 = Premium; 301, 401 = Signature.
  2. QA chạy lại 13 ca với đầu vào như lượt 1 (P05 giữ 14 đêm, P06 đổi thành 27 đêm). Số kỳ vọng lấy từ `POST /quotes/calculate` (kênh `direct`) của **từng căn**, lấy số nhỏ nhất. Ai chạy bước này là ORC hoặc người ORC cho đăng nhập. QA đối chiếu thêm với bảng giá SQL ở trên.
  3. Cùng lượt đó chạy các ca 1 (đủ trạng thái), 3, 4, 8, 10, 12 (`monthly_offer`).

## 4. P10 – BUG-R4-011 / 012 (chờ thao tác Desk)

Yêu cầu thử đã có trên staging: `VKSN49P7` (en, Zalo), `608J2GGZ` (vi, Zalo), `6WNGMZRQ` (ru, Zalo), `9H6PJVDC` (ko, Email), `0RRSYFEC` (zh, WhatsApp), `CBAMSZAF` và `8F0DB4C5` (en, Email).

Các bước cho ORC (Desk staging, `qa.fd`):
1. Mở S35 → yêu cầu `VKSN49P7` → **Tạo nhanh hồ sơ** → Lưu. Đúng là: không có 422 `CONTACT_CHANNEL_EMPTY`, không có chữ `{channel}` (BUG-R4-011). Làm tương tự với `6WNGMZRQ` (ru, Zalo).
2. Mở lại hồ sơ vừa tạo. Đúng là: Quốc tịch hiện "–" (BUG-R4-012).
3. QA kiểm DB (READ ONLY): `nationality_code IS NULL` ở các hồ sơ đó. QA chỉ đóng hai lỗi sau bước 3.

## 5. P9 – Lighthouse (chưa chạy) và đo thay thế

- **Lighthouse: chưa chạy.** Máy QA chưa cài Lighthouse (`lighthouse` không có trong PATH hay `node_modules`). Muốn chạy phải tải gói về, việc này cần được duyệt. Nếu chạy, dùng `--extra-headers` để qua basic auth và `--chrome-flags=--host-resolver-rules=…`. **Không có điểm Performance / Accessibility / SEO** (US-174 AC7 nêu ≥ 90/95/95).
- **Đo thay thế** (16:04–16:05, từ (M) qua Internet thật): Chromium + CDP, giả lập di động kiểu Lighthouse (412×823, DPR 1,75, RTT 150 ms, 1,6 Mbit/s xuống, 750 kbit/s lên, CPU ×4, tắt cache). Trang chủ, 3 lượt mỗi ngôn ngữ, lấy trung vị. axe-core 4.13 (WCAG 2.0/2.1 A+AA, 2.2 AA).

| Trang chủ | HTTP | `lang` | LCP | FCP | CLS | KB tải | Request ra ngoài | axe |
|---|---|---|---|---|---|---|---|---|
| en | 200 | `en` | 984 ms | 964 ms | 0,0001 | 228,0 | 0 | 0 |
| vi | 200 | `vi` | 1.084 ms | 1.068 ms | 0,0006 | 258,4 | 0 | 0 |
| ko | 200 | `ko` | 1.136 ms | 1.120 ms | 0,0002 | 279,5 | 0 | 0 |
| zh | 200 | `zh-Hans` | 1.260 ms | 1.256 ms | 0,0001 | 334,4 | 0 | 0 |
| ru | 200 | `ru` | 1.132 ms | 1.108 ms | 0,0006 | 261,9 | 0 | 0 |

Ngưỡng ADR-014 / US-174 AC7 là LCP ≤ 2,5 s, CLS ≤ 0,1, trang chủ ≤ 700 KB: **đạt cả 5**. So với lượt 1 (stack cục bộ), LCP chậm hơn khoảng 0,24–0,42 s vì đi đường truyền thật. Dung lượng gần như trùng.
- Thẻ `<meta name="robots">` của image là `index, follow` (image phát hành, `LANDING_INDEXABLE=true`), còn Caddy staging thêm header `X-Robots-Tag: noindex, nofollow` cho mọi trang: đúng ý "noindex" của staging.

## 6. Dữ liệu QA để lại trên staging (ORC dọn khi cần)

- `website_booking_request`: 7 dòng thử: `CBAMSZAF`, `8F0DB4C5`, `VKSN49P7`, `608J2GGZ`, `9H6PJVDC`, `0RRSYFEC`, `6WNGMZRQ`, tất cả ở trạng thái `new`. Bốn yêu cầu dùng email `@example.test`; các yêu cầu Zalo/WhatsApp dùng SĐT giả `+84 900 000 30x`.
- `rate_limit_counter`: 12 dòng `webreq:*` của route POST (tự hết hạn).
- Bộ đếm RAM của route giá cho (S) và (M) tự hết hạn sau 10 phút / 24 giờ. Lượt bị 429 theo cửa sổ 10 phút không được tính vào bộ đếm ngày, nên bộ đếm ngày của (S) chỉ khoảng 72/200, và của (M) khoảng 25/200. Cả hai vẫn chạy lại phần giá được trong hôm nay.
- Không có tin Chat nào (webhook staging rỗng). Không tạo đơn, không sửa giá, không đổi công tắc.

## 7. Lỗi mới

Ghi chi tiết ở `rounds/round-04/qa/bug-list.md`:
- **BUG-R4-054** (P3, môi trường staging, OPS): basic auth của staging chặn `fetch` của form (`credentials: 'omit'`) → 401. Người dùng trình duyệt thường sẽ thấy "We could not send your request".
- **BUG-R4-055** (P2, môi trường staging, ORC/OWN + OPS): staging thiếu `public_room_type` ở cả 10 căn → không có giá ước tính, yêu cầu bị gắn `room_type_unmatched`, chặn 13 ca giá và các ca 1, 3, 4, 8, 10, 12.

## 8. Dòng decision-log đề nghị (quyền QA)

`| 2026-11-06 | 4 | QA – LP-v2 staging S6 (sha-6414be25f20d, Caddy + edge thật): ca 6 ĐẠT (IP thật qua TRUST_PROXY, hai nơi gửi có bộ đếm riêng, lượt 31 → 429, XFF giả bị bỏ, POST sau 429 vẫn 202); SEC 9.5 đạt 2, 5, 6, 7, 11 và BE-01, đạt một phần 1, 12, chưa chạy 3, 4, 8, 10 (cần Desk + nhãn hạng), không chạy 9 (theo lệnh ORC), 0 ca đỏ; form 5 ngôn ngữ 202; 13 ca giá bị chặn vì staging thiếu public_room_type (BUG-R4-055, P2 môi trường); basic auth chặn fetch của form (BUG-R4-054, P3 môi trường); Lighthouse chưa chạy, đo thay thế LCP ≤ 1,26 s, CLS ≤ 0,0006, axe 0. Không chặn P8–F1; F2 chờ chạy lại phần giá | QA | Quyền QA (kết luận kiểm thử, mức lỗi) |`
