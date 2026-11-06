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

---

## S6b – giá (06/11/2026, 17:05–17:12 giờ VN)

- Tác giả: QA | Round 4 – bước **Kiểm thử** | Mục tiêu: mở điều kiện F2 của runbook (`public_show_prices` production).
- Môi trường: **chỉ staging**, api / landing / web / worker vẫn `sha-6414be25f20d`. Gọi từ (M) (Mac → Internet → edge → Caddy landing staging → api), dùng `--resolve`. Basic auth đọc thẳng từ tệp root vào cấu hình curl / header Playwright, không in ra. Không đăng nhập Desk, không gửi form, không đổi công tắc, không chạm production.
- ORC đã làm trước (06/11): gán `publicRoomType` cho 10 căn, chép giá niêm yết production (hiệu lực 2026-11-06). QA kiểm lại bằng SQL READ ONLY (`default_transaction_read_only = on`) lúc 17:05:
  - Nhãn: Amber, Mist = City View; Bloom, Fern, Sage, Valley = Garden View; Ember, Ivory = Premium; Pine, Velvet = Signature. Đếm 10 căn có nhãn, 4 hạng; `QAT1` không nhãn. Sức chứa (chuẩn/tối đa): Studio 2/3, Premium 3/4, Signature 4/5. **BUG-R4-055 đóng.**
  - Giá đêm từ 2026-11-06: Amber, Mist 700.000; Bloom, Fern, Sage, Valley 800.000; **Ember 1.100.000**, Ivory 1.100.000; Pine, Velvet 1.300.000. Giá tháng đúng như ORC gửi. Không có khóa OOO nào đang mở.
  - Tham số có hiệu lực ngày 06/11: `rounding.night_rate` 1.000; `weekend_uplift_pct` 15 (đêm thứ Sáu, thứ Bảy); `special_uplift_pct` 30 (`special_dates` có 24/12–02/01); `los_discount` 10 % từ 7 đêm, 15 % từ 14 đêm; `extra_adult_fee` 150.000; `child_fee_6_11` 100.000; `child_free_under_age` 6; `min_stay` 2 đêm khi đến thứ Sáu/thứ Bảy hoặc ngày đặc biệt; `long_stay_required_from_nights` **28**; `short_stay_max_nights` 27; `booking_window_days` 365; không có `web_estimate.open_until`. Cả hai công tắc đều `true`.
- **`ota_base_rate` (chỉ staging có):** không ảnh hưởng số trên web. Động cơ có đọc khóa này vào `PricingParams`, nhưng `estimatePublicRate` chỉ tính kênh `direct` và không dùng nó. Nó chỉ có trong chuỗi băm `priceVersion` (16 ký tự trong `estimateToken`), nên `priceVersion` của staging và production sẽ khác nhau dù cùng giá. Điều này vô hại: token chỉ kiểm trong đúng cơ sở đã cấp. Trên Desk, khóa này chỉ chạm báo giá kênh OTA.
- Cách tính số kỳ vọng: QA viết lại độc lập các quy tắc trong `reservations/public/pricing.ts` và `public-rate.ts` bằng Python, không import mã api. Gồm giá đêm theo ngày hiệu lực; một mức tăng duy nhất cho mỗi đêm (đặc biệt trước, rồi cuối tuần); giảm theo số đêm trên từng đêm; làm tròn nửa lên tới 1.000; phụ thu khách thêm theo đêm và không giảm (người lớn lấp định mức trước); "Từ" = căn rẻ nhất của hạng; tối thiểu số đêm; mốc dài hạn. Tham số và giá lấy từ SQL ở trên.
- Ngày ở của bảng gốc đã dời theo hôm nay: P11 (02→09/11) đã qua nên đổi sang 23→30/11 (vẫn có thứ Sáu + thứ Bảy). P06 đổi thành 27 đêm, vì mốc dài hạn hiện là 28.

### S6b.1 13 ca giá + 5 ca không số + 2 ca tháng (API)

`GET /v1/public/properties/dlt/price-estimate`, `Sec-Fetch-Site: same-origin`, 17:07:45–17:08:06, 20/20 trả **200** (0,12–0,25 s). So **cả 8 trường** của `shortStay` (`nights`, `roomSubtotalVnd`, `upliftNights`, `losDiscountPct`, `losDiscountVnd`, `extraPersonFeeVnd`, `totalVnd`, `nightlyAvgVnd`), không chỉ tổng tiền.

| Ca | Đầu vào (NL = người lớn, trẻ 6–11 → `children`, dưới 6 → `infants`) | Số kỳ vọng (cách tính) | Web `totalVnd` | Lệch | KQ |
|---|---|---|---|---|---|
| P01 | Garden, 2 NL, 10→11/11 (thứ Ba) | 800.000 | 800.000 | 0 | Đạt |
| P02 | Garden, 2 NL, 13→15/11 (thứ Sáu + thứ Bảy) | 2 × 920.000 = **1.840.000** (`upliftNights` 2) | 1.840.000 | 0 | Đạt |
| P03 | Premium, 2 NL, 31/12→02/01 (đặc biệt) | 2 × 1.430.000 = **2.860.000** | 2.860.000 | 0 | Đạt |
| P04 | Garden, 2 NL, 09→16/11 (7 đêm) | 5 × 720.000 + 2 × 828.000 = **5.256.000** (trước giảm 5.840.000, giảm 10 % = 584.000) | 5.256.000 | 0 | Đạt |
| P05 | Garden, 2 NL, 09→23/11 (14 đêm) | 10 × 680.000 + 4 × 782.000 = **9.928.000** (giảm 15 % = 1.752.000) | 9.928.000 | 0 | Đạt |
| P06 | Garden, 2 NL, 09/11→06/12 (**27 đêm**) | 19 × 680.000 + 8 × 782.000 = **19.176.000** | 19.176.000 | 0 | Đạt |
| P07 | City, **3 NL**, 13→15/11 | 2 × 805.000 + 2 × 150.000 = **1.910.000** | 1.910.000 | 0 | Đạt |
| P08 | Garden, 2 NL + trẻ 8 tuổi, 10→11/11 | 800.000 + 100.000 = **900.000** | 900.000 | 0 | Đạt |
| P09 | Garden, 2 NL + trẻ 4 tuổi, 10→11/11 | **800.000** (dưới 6 miễn) | 800.000 | 0 | Đạt |
| P10 | Signature, 4 NL + trẻ 8 + trẻ 3, 16→23/11 | 5 × 1.170.000 + 2 × 1.346.000 + 7 × 100.000 = **9.242.000** | 9.242.000 | 0 | Đạt |
| P11 | Signature, 5 NL, **23→30/11** (7 đêm, có cuối tuần) | 8.542.000 + 7 × 150.000 = **9.592.000** | 9.592.000 | 0 | Đạt |
| P12 | Premium, 3 NL + trẻ 8, 10→12/11 | 2 × 1.100.000 + 2 × 100.000 = **2.400.000** | 2.400.000 | 0 | Đạt |
| P13 | City, 2 NL, 10→13/11 (3 đêm) | 3 × 700.000 = **2.100.000** | 2.100.000 | 0 | Đạt |
| N01 | Garden, 4 NL, 10→11/11 | không số, `party_exceeds_room` | `party_exceeds_room` | – | Đạt |
| N02 | City, 2 NL, đến thứ Bảy 14/11, 1 đêm | không số, tối thiểu 2 | `on_request` + `notes[min_stay, 2]` | – | Đạt |
| N03 | Premium, 2 NL, đến 31/12, 1 đêm | không số, tối thiểu 2 | `on_request` + `notes[min_stay, 2]` | – | Đạt |
| N04 | Garden, 2 NL, 09/11→07/12 (**28 đêm**) | lời mời, không số | `monthly_offer`, `stayKind: long`, `notes[long_stay_required]`, không token | – | Đạt |
| N05 | Signature, 6 NL | không số | `party_exceeds_room` | – | Đạt |
| L01 | `stayType=long`, Garden, 01/12, `months=6` | lời mời, không số | `monthly_offer`, không trường tiền, không token | – | Đạt |
| L02 | `stayType=long`, Signature, 01/12, không có `months` | như trên | như trên | – | Đạt |

**13/13 ca giá đạt, lệch 0 đ ở cả 8 trường.** 7/7 ca không số đạt. Mọi ca có số đều có `estimateToken`. Token chỉ có các khóa `rt, st, a, d, m, ad, c, i, tot, n, los, xp, pv, iat, exp`, không có mã căn. Theo bộ giá này, các căn trong cùng hạng cùng giá, nên "từ" = "đến" ở mọi ca.

**Lưu ý: Ember gõ sai thì web không lộ ra.** Ước tính lấy căn **rẻ nhất** của hạng. Nếu Ember vẫn là 11.000.000, web Premium vẫn ra số của Ivory (P12: 2.400.000), còn báo giá Desk riêng cho Ember sẽ là 22.200.000. Vì vậy phải kiểm Ember bằng báo giá Desk **từng căn** (mục S6b.4), không dựa vào web.

### S6b.2 Khối giá trên trang chủ, 5 ngôn ngữ (Chromium Playwright, 390 px, 17:10–17:11)

Mở trang chủ, điền ngày, số khách, hạng. Không gửi form. Đọc `#bk-est` và `<data value>`, rồi so với phản hồi API mà chính trang nhận được.

| Ngôn ngữ | P02 Garden 2 đêm cuối tuần (1.840.000) | P10 Signature 7 đêm 6 khách (9.242.000) | Console |
|---|---|---|---|
| en | hiện, `1840000` = "1,840,000 VND for 2 nights" | hiện, `9242000`, "Includes our longer-stay rate. Includes one more guest." | 0 lỗi |
| vi | hiện, "1.840.000 VND cho 2 đêm" | hiện, "9.242.000 VND cho 7 đêm", "Đã gồm ưu đãi ở dài ngày. Đã gồm thêm một khách." | 0 |
| ko | hiện, "2박 기준 1,840,000 VND" | hiện, "7박 기준 9,242,000 VND" | 0 |
| zh | hiện, "2 晚，共 1,840,000 VND" | hiện, "7 晚，共 9,242,000 VND" | 0 |
| ru | hiện, "1 840 000 VND за 2 ночи" | hiện, "9 242 000 VND за 7 ночей" | 0 |

**10/10:** khối giá hiện, số trên trang = `<data value>` = `totalVnd` của API = số kỳ vọng. Định dạng số đúng từng ngôn ngữ. Ảnh chụp lưu ở máy QA (thư mục tạm), không đưa vào repo, vì không có dữ liệu khách. Log api từ 17:00: 30 dòng `price-estimate` (20 từ API + 10 từ trình duyệt), 0 dòng có query hay IPv4, 0 dòng `public_price_missing`.

### S6b.3 Chạy lại các ca SEC 9.5 trước đây chưa đủ

| Ca | Kết quả S6b | KQ |
|---|---|---|
| 1 | Đã đi đủ các trạng thái: `ok` (13 ca), `party_exceeds_room` (N01, N05), `on_request` + `min_stay` (N02, N03), `monthly_offer` ngắn ngày ≥ mốc (N04) và dài hạn (L01, L02). Khóa ngoài cùng nằm trong danh sách cho phép (`estimate, currency, taxIncluded, roomType, stayKind, arrival, departure, priceAvailable, unavailableReason, shortStay, notes, computedAt, estimateToken, expiresAt`). `shortStay` có đúng 8 khóa. Grep tên căn, số căn, `roomId`, `toTotal`, `lines`, `priceGap`, `floor`, `commission`, giá OTA trên 20 thân phản hồi: 0 (chuỗi "ota" chỉ là phần của `totalVnd`) | **Đạt** |
| 12 | `months=6` (L01) và không có `months` (L02): `monthly_offer`, không có trường tiền nào, không có token | **Đạt** |
| 3 | **Cần Desk.** Dữ liệu staging hiện có: Sage đã bán 06/11–12/12, Pine giữ chỗ 24–25/11, mà Garden (P01–P06) và Signature (P11) vẫn có số. Đọc mã: `PublicRatePort.rooms` không đọc đơn, giữ chỗ hay đêm đã bán. Nhưng các căn cùng hạng cùng giá, nên dữ liệu này không phân biệt được. Vẫn phải chiếm **cả hai** căn Signature rồi so byte | Đạt một phần, chờ ORC |
| 4 | **Cần Desk.** Bộ giá hiện tại không có hạng nào gồm hai căn khác giá | Chờ ORC |
| 8 | **Cần Desk** (OWN đổi giá) | Chờ ORC |
| 10 | **Cần Desk** (OWN) | Chờ ORC |

Các bước ORC làm trên Desk staging (khoảng 15 phút). QA chạy phần API và log ngay sau đó:
1. **Ca 4 + 8** (`qa.owner`): sửa giá đêm **The Amber = 650.000**, hiệu lực 2026-11-10, lý do "QA S6b ca 4/8". QA gọi P13 (City, 2 NL, 10→13/11) mỗi 15 giây. Đúng là: trong ≤ 60 giây web đổi từ 2.100.000 sang **1.950.000**, và không có số "đến" (ca 8 + phần web của ca 4). Sau đó QA gửi một yêu cầu `@example.test` kèm token. ORC mở yêu cầu đó trên Desk. Đúng là: Desk thấy "từ 1.950.000 – đến 2.100.000" (ca 4). Xong thì ORC đặt Amber về **700.000** từ 2026-11-10, để staging lại giống production.
2. **Ca 10** (`qa.owner`): gán nhãn City View cho `QAT1` (căn này chỉ có giá từ 01/12). QA gọi City 10→13/11 khoảng 100 lần, chia hai máy và nhiều ngày ở khác nhau (giới hạn 30 lượt / 10 phút mỗi IP). Đúng là: web vẫn ra số của Amber/Mist; log api có **đúng 1** dòng `public_price_missing` cho `QAT1` trong ngày; `ops-check pricegap` báo một lần. Xong thì ORC bỏ nhãn `QAT1`.
3. **Ca 3** (`qa.fd`): tạo giữ chỗ cho **cả** Pine và Velvet ngày 16→23/11. QA gọi P10 trước và sau. Đúng là: hai thân phản hồi giống nhau từng byte, trừ `computedAt`, `estimateToken`, `expiresAt`. Xong thì ORC hủy giữ chỗ.

### S6b.4 Ba ca mẫu để ORC đối chiếu production (đọc Desk, không bật giá)

Giả định: production có cùng nhãn, cùng sức chứa, cùng giá niêm yết (Ember 1.100.000) và cùng tham số như staging ở trên. Ba khóa ORC chưa nêu, QA giả định giống staging: `rounding.night_rate` = 1.000, không có `web_estimate.open_until`, `booking_window_days` = 365. Đối chiếu bằng Desk production → Báo giá, kênh **Trực tiếp**, **từng căn**:

| Mẫu | Đầu vào | Web production sẽ hiện (tham số **hiện tại**) | Desk từng căn | Nếu OWN đã chuyển P6/P7 trước khi bật (bảng 01/11) |
|---|---|---|---|---|
| A = P02 | Garden, 2 NL, 13→15/11 | **1.840.000** | Bloom, Fern, Sage, Valley: 1.840.000 mỗi căn | 1.600.000 |
| B = P10 | Signature, 4 NL + trẻ 8 + trẻ 3, 16→23/11 | **9.242.000** | Pine, Velvet: 9.242.000 | 10.150.000 |
| C = P12 | Premium, 3 NL + trẻ 8, 10→12/11 | **2.400.000** | Ivory: 2.400.000; **Ember: 2.400.000** (vẫn là 22.200.000 nghĩa là còn gõ sai) | 2.500.000 |

Cột cuối tính theo ESC-045: không tăng cuối tuần/lễ (câu 1 = A), từ 6 tuổi 150.000 (câu 3 = B), không giảm theo số đêm, dài hạn từ 30 đêm (câu 6 = A, QC P6). Có cột này để ORC đối chiếu nếu OWN chuyển tham số trước F2.

### S6b.5 Kết luận cho F2

- Phần kỹ thuật **đạt**: web = động cơ Desk = số QA tính độc lập. 13/13 ca giá lệch 0 đ, 7/7 ca không số đúng, 5 ngôn ngữ hiện đúng số, SEC ca 1 và 12 đạt đủ.
- **F2 chưa đi được**, vì runbook F2 đòi QC P6 + P7, mà tham số production (ORC nói trùng staging) vẫn là **bảng cũ**, chưa theo quyết định INV 01/11 (ESC-045) và sổ tay v1.0.4 đã gộp (#85):

| Tham số | Đang có (staging = production) | Theo INV 01/11 / QC P6–P7 | Khách thấy nếu bật giá lúc này |
|---|---|---|---|
| `weekend_uplift_pct` / `special_uplift_pct` | 15 / 30 | 0 / 0 (câu 1 = A) | Cuối tuần, lễ đắt hơn (P02 1.840.000 thay vì 1.600.000) |
| `los_discount` | 10 % từ 7 đêm, 15 % từ 14 đêm | rỗng | Web ghi "Includes our longer-stay rate" và giảm 10–15 % (P10 9.242.000 thay vì 10.150.000) |
| `child_fee_6_11` | 100.000 | 150.000 (câu 3 = B) | Trẻ 6–11 rẻ hơn 50.000 mỗi đêm |
| `long_stay_required_from_nights` / `short_stay_max_nights` | 28 / 27 | 30 / 29 (câu 6 = A; khớp `shortMaxNights` 29 của landing) | 28–29 đêm bị báo "ưu đãi dài hạn", không có số |

- Thêm một điểm: giá đêm **City View** (Amber, Mist) trên production là **700.000**, còn bảng giá INV 01/11 (`00-brief/context/pricing/OTTIMO_pricing_spec-2026-11-01.md`) và bảng DOM P6 ghi **800.000**. Giá tháng 8.500.000 thì khớp. QA không tự quyết số nào đúng → **ESC-050**.
- SEC ca 3, 4, 8, 10 chờ thao tác Desk (S6b.3). Runbook (dòng C8) xếp các ca này vào phần staging, không phải điều kiện trực tiếp của F2. Nhưng ca 8 (đổi giá thì web theo trong ≤ 60 giây) là chỗ dựa để OWN sửa giá sau khi đã bật, nên QA đề nghị chạy trước F2.
- Đi tiếp khi: (1) OWN chuyển P6/P7 trên production, và INV trả lời ESC-050; (2) ORC chép đúng các tham số đó sang staging, QA chạy lại 13 ca (khoảng 10 phút, dùng lại script); (3) ORC đối chiếu 3 ca mẫu trên Desk production theo cột tương ứng, gồm Ember từng căn. Nếu INV **cố ý** giữ bảng tham số cũ, tức đổi quyết định ESC-045, thì số ở S6b.1 chính là số production sẽ hiện và F2 chỉ còn chờ ESC-050 + 3 ca mẫu. Khi đó ORC ghi quyết định mới vào decision-log, còn DOM/BA sửa sổ tay v1.0.4.

Lỗi mới: **0**. BUG-R4-055 **Closed** (đã kiểm ở trên). BUG-R4-054 vẫn Open (Playwright vẫn phải chèn `Authorization`). Dữ liệu QA để lại: không có. S6b không gửi yêu cầu nào, không tạo dòng DB nào. Bộ đếm RAM của (M) tăng thêm khoảng 30 lượt trong ngày.

Dòng decision-log đề nghị (quyền QA): `| 2026-11-06 | 4 | QA – LP-v2 staging S6b giá (sha-6414be25f20d, edge thật, nhãn + giá production đã chép): 13/13 ca giá lệch 0 đ (8 trường shortStay, oracle độc lập), 7/7 ca không số, khối giá 5 ngôn ngữ 10/10 = API; SEC 9.5 ca 1, 12 ĐẠT, ca 3/4/8/10 chờ Desk; BUG-R4-055 đóng; ota_base_rate không ảnh hưởng số web (chỉ priceVersion). F2 CHƯA: tham số production vẫn bảng cũ (15/30 %, LOS 10/15 %, trẻ 100.000, mốc 28) ≠ ESC-045/QC P6–P7; City 700.000 ≠ bảng 800.000 (ESC-050) | QA | Quyền QA (kết luận kiểm thử) |`
