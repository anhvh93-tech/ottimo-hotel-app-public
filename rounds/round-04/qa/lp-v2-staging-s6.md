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
| 12 ca SEC 9.5 + BE-01 | **6 ca đạt** (2, 5, 6, 7, 11, BE-01). **2 ca đạt một phần** (1, 12): chỉ đi được nhánh `on_request`. **4 ca chưa chạy** (3, 4, 8, 10): cần tài khoản Desk và nhãn hạng. **1 ca không chạy theo lệnh ORC** (9). **0 ca đỏ**. *Cập nhật S6b–S6d (06/11 18:31): ca 1 và 12 → Đạt (S6b.3); ca 3 và 8 → Đạt; ca 4 → web Đạt, Desk "từ – đến" dời v1.0.x (FB-R4-SEC-BE-03); ca 10 → Đạt bằng bằng chứng thay thế, chờ SEC ghi nhận. Bảng tổng ở S6d.4* |
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
| 3 | **Cần Desk.** Dữ liệu staging hiện có: Sage đã bán 06/11–12/12, Pine giữ chỗ 24–25/11, mà Garden (P01–P06) và Signature (P11) vẫn có số. Đọc mã: `PublicRatePort.rooms` không đọc đơn, giữ chỗ hay đêm đã bán. Nhưng các căn cùng hạng cùng giá, nên dữ liệu này không phân biệt được. Vẫn phải chiếm **cả hai** căn Signature rồi so byte | ~~Đạt một phần, chờ ORC~~ → **Đạt** (ORC chạy 06/11 18:29–18:31, xem **S6d**) |
| 4 | **Cần Desk.** Bộ giá hiện tại không có hạng nào gồm hai căn khác giá | ~~Chờ ORC~~ → **Web Đạt**; Desk "từ – đến" dời v1.0.x theo FB-R4-SEC-BE-03 (**S6d**) |
| 8 | **Cần Desk** (OWN đổi giá) | ~~Chờ ORC~~ → **Đạt**, khoảng 2,5 giây (**S6d**) |
| 10 | **Cần Desk** (OWN) | ~~Chờ ORC~~ → **Đạt bằng bằng chứng thay thế**, chờ SEC ghi nhận (**S6d**). Bước 2 bên dưới sai giả định (BUG-R4-056) |

Các bước ORC làm trên Desk staging (khoảng 15 phút). QA chạy phần API và log ngay sau đó:
1. **Ca 4 + 8** (`qa.owner`): sửa giá đêm **The Amber = 650.000**, hiệu lực 2026-11-10, lý do "QA S6b ca 4/8". QA gọi P13 (City, 2 NL, 10→13/11) mỗi 15 giây. Đúng là: trong ≤ 60 giây web đổi từ 2.100.000 sang **1.950.000**, và không có số "đến" (ca 8 + phần web của ca 4). Sau đó QA gửi một yêu cầu `@example.test` kèm token. ORC mở yêu cầu đó trên Desk. Đúng là: Desk thấy "từ 1.950.000 – đến 2.100.000" (ca 4). Xong thì ORC đặt Amber về **700.000** từ 2026-11-10, để staging lại giống production.
2. **Ca 10** (`qa.owner`): gán nhãn City View cho `QAT1` (căn này chỉ có giá từ 01/12). QA gọi City 10→13/11 khoảng 100 lần, chia hai máy và nhiều ngày ở khác nhau (giới hạn 30 lượt / 10 phút mỗi IP). Đúng là: web vẫn ra số của Amber/Mist; log api có **đúng 1** dòng `public_price_missing` cho `QAT1` trong ngày; `ops-check pricegap` báo một lần. Xong thì ORC bỏ nhãn `QAT1`. *(Bước này sai giả định. QAT1 có `activeFrom` 01/12 nên không vào phép tính 10–13/11, và qua Desk không tạo được căn thiếu giá đêm. Ca 10 được kết luận bằng bằng chứng thay thế ở S6d; xem BUG-R4-056.)*
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
- ~~SEC ca 3, 4, 8, 10 chờ thao tác Desk (S6b.3).~~ Runbook (dòng C8) xếp các ca này vào phần staging, không phải điều kiện trực tiếp của F2. Nhưng ca 8 (đổi giá thì web theo trong ≤ 60 giây) là chỗ dựa để OWN sửa giá sau khi đã bật, nên QA đề nghị chạy trước F2. *Cập nhật 06/11 (S6d): ORC đã chạy cả 4 ca, sau khi F2 đã bật. Ca 8 **đạt** (khoảng 2,5 giây), nên đề nghị trên không còn treo. Ca 3 đạt; ca 4 đạt phần web; ca 10 đạt bằng bằng chứng thay thế, chờ SEC ghi nhận.*
- Đi tiếp khi: (1) OWN chuyển P6/P7 trên production, và INV trả lời ESC-050; (2) ORC chép đúng các tham số đó sang staging, QA chạy lại 13 ca (khoảng 10 phút, dùng lại script); (3) ORC đối chiếu 3 ca mẫu trên Desk production theo cột tương ứng, gồm Ember từng căn. Nếu INV **cố ý** giữ bảng tham số cũ, tức đổi quyết định ESC-045, thì số ở S6b.1 chính là số production sẽ hiện và F2 chỉ còn chờ ESC-050 + 3 ca mẫu. Khi đó ORC ghi quyết định mới vào decision-log, còn DOM/BA sửa sổ tay v1.0.4.

Lỗi mới: **0**. BUG-R4-055 **Closed** (đã kiểm ở trên). BUG-R4-054 vẫn Open (Playwright vẫn phải chèn `Authorization`). Dữ liệu QA để lại: không có. S6b không gửi yêu cầu nào, không tạo dòng DB nào. Bộ đếm RAM của (M) tăng thêm khoảng 30 lượt trong ngày.

Dòng decision-log đề nghị (quyền QA): `| 2026-11-06 | 4 | QA – LP-v2 staging S6b giá (sha-6414be25f20d, edge thật, nhãn + giá production đã chép): 13/13 ca giá lệch 0 đ (8 trường shortStay, oracle độc lập), 7/7 ca không số, khối giá 5 ngôn ngữ 10/10 = API; SEC 9.5 ca 1, 12 ĐẠT, ca 3/4/8/10 chờ Desk; BUG-R4-055 đóng; ota_base_rate không ảnh hưởng số web (chỉ priceVersion). F2 CHƯA: tham số production vẫn bảng cũ (15/30 %, LOS 10/15 %, trẻ 100.000, mốc 28) ≠ ESC-045/QC P6–P7; City 700.000 ≠ bảng 800.000 (ESC-050) | QA | Quyền QA (kết luận kiểm thử) |`

---

## S6c – chạy lại giá với tham số đang chạy (06/11/2026, 18:02–18:03 giờ VN)

- Bối cảnh, theo tin ORC: INV (06/11) quyết bật giá web với **bảng tham số đang chạy**, không chờ bảng 01/11, và sẽ chỉnh sau theo từ điển tham số. Trên production, `weekend_uplift_pct` = 0 từ 06/11 17:37; City View (Amber, Mist) = 800.000 / 8.500.000; Ember = 1.100.000; các tham số khác giữ nguyên. ORC đã đặt staging giống hệt, **trừ** Amber/Mist vẫn là 700.000. QA không sửa giá.
- SQL READ ONLY lúc 18:02 (`default_transaction_read_only = on`). `weekend_uplift_pct` = **0**, hiệu lực 2026-11-06, ghi lúc 11:02 UTC. Các khóa sau không đổi so với S6b: `special_uplift_pct` 30, `los_discount` 7 đêm/10 % và 14 đêm/15 %, `extra_adult_fee` 150.000, `child_fee_6_11` 100.000, `long_stay_required_from_nights` 28, `short_stay_max_nights` 27, `min_stay`, `rounding.night_rate` 1.000. Không có tham số nào hiệu lực sau 06/11. Giá đêm từ 06/11: Amber, Mist 700.000; Garden 800.000; Premium 1.100.000 (gồm Ember); Signature 1.300.000. Nhãn `11|10|4`, không có khóa OOO.
- Cách chạy: dùng lại script `s6b` (cùng 20 truy vấn, cùng oracle độc lập), chỉ đổi tham số oracle thành cuối tuần 0 %. Gọi từ (M) qua edge, 18:03, **20/20 trả 200** (0,13–0,19 s).

### S6c.1 Kết quả trên staging (giá staging đang có, City 700.000)

| Ca | Đầu vào | Kỳ vọng | Web | Lệch | KQ |
|---|---|---|---|---|---|
| P01 | Garden, 2 NL, 10→11/11 | 800.000 | 800.000 | 0 | Đạt |
| P02 | Garden, 2 NL, 13→15/11 (thứ Sáu + thứ Bảy) | 2 × 800.000 = **1.600.000** (`upliftNights` 0) | 1.600.000 | 0 | Đạt |
| P03 | Premium, 2 NL, 31/12→02/01 (đặc biệt +30 %) | 2 × 1.430.000 = **2.860.000** | 2.860.000 | 0 | Đạt |
| P04 | Garden, 2 NL, 7 đêm 09→16/11 | 7 × 720.000 = **5.040.000** (giảm 10 % = 560.000) | 5.040.000 | 0 | Đạt |
| P05 | Garden, 2 NL, 14 đêm 09→23/11 | 14 × 680.000 = **9.520.000** (giảm 15 %) | 9.520.000 | 0 | Đạt |
| P06 | Garden, 2 NL, 27 đêm 09/11→06/12 | 27 × 680.000 = **18.360.000** | 18.360.000 | 0 | Đạt |
| P07 | City, 3 NL, 13→15/11 | 2 × 700.000 + 2 × 150.000 = **1.700.000** | 1.700.000 | 0 | Đạt |
| P08 | Garden, 2 NL + trẻ 8, 1 đêm | 800.000 + 100.000 = **900.000** | 900.000 | 0 | Đạt |
| P09 | Garden, 2 NL + trẻ 4, 1 đêm | **800.000** | 800.000 | 0 | Đạt |
| P10 | Signature, 4 NL + trẻ 8 + trẻ 3, 16→23/11 | 7 × 1.170.000 + 7 × 100.000 = **8.890.000** | 8.890.000 | 0 | Đạt |
| P11 | Signature, 5 NL, 23→30/11 | 7 × 1.170.000 + 7 × 150.000 = **9.240.000** | 9.240.000 | 0 | Đạt |
| P12 | Premium, 3 NL + trẻ 8, 10→12/11 | 2 × 1.100.000 + 2 × 100.000 = **2.400.000** | 2.400.000 | 0 | Đạt |
| P13 | City, 2 NL, 10→13/11 | 3 × 700.000 = **2.100.000** | 2.100.000 | 0 | Đạt |
| N01–N05, L01, L02 | như S6b.1 | N01, N05 `party_exceeds_room`; N02, N03 `on_request` + `min_stay` 2; N04 (28 đêm), L01, L02 `monthly_offer`, không có số, không có token | như kỳ vọng | – | Đạt 7/7 |

**13/13 ca giá đạt, lệch 0 đ ở cả 8 trường `shortStay`. 7/7 ca không số đạt.** Đổi tham số là web đổi theo ngay: lúc 18:03 không còn số cũ trong bộ đệm, vì đổi tham số xóa bộ đệm.

Do staging để City 700.000, còn production là 800.000, hai ca City có số khác nhau giữa hai nơi. Production sẽ hiện **P07 = 1.900.000** (2 × 800.000 + 300.000) và **P13 = 2.400.000**. N02 (City) không có số ở cả hai nơi. 11 ca còn lại giống nhau trên staging và production.

### S6c.2 Ba ca mẫu – số production sẽ hiện (bảng production ORC gửi, City 800.000)

Đối chiếu ngay sau khi bật: web trang chủ (hoặc `GET …/price-estimate`) và Desk production → Báo giá, kênh **Trực tiếp**, **từng căn**.

| Mẫu | Đầu vào (query) | Web production phải hiện | Desk từng căn |
|---|---|---|---|
| A = P13 | City, 2 NL, 10→13/11 – `roomType=standard-studio-city-view&stayType=short&arrival=2026-11-10&departure=2026-11-13&adults=2` | **2.400.000** (3 × 800.000) | Amber 2.400.000; Mist 2.400.000 |
| B = P10 | Signature, 4 NL + trẻ 8 + trẻ 3, 16→23/11 – `roomType=signature-two-bedrooms&stayType=short&arrival=2026-11-16&departure=2026-11-23&adults=4&children=1&infants=1` | **8.890.000** (7 × 1.170.000 sau giảm 10 % + 7 × 100.000 trẻ) | Pine 8.890.000; Velvet 8.890.000 |
| C = P12 | Premium, 3 NL + trẻ 8, 10→12/11 – `roomType=premium-one-bedroom-1&stayType=short&arrival=2026-11-10&departure=2026-11-12&adults=3&children=1` | **2.400.000** | Ivory 2.400.000; **Ember 2.400.000** (nếu ra 22.200.000 thì Ember còn gõ sai; web không lộ vì lấy căn rẻ nhất) |

Thêm, nếu cần một ca cuối tuần: P02 Garden, 2 NL, 13→15/11 = **1.600.000** (giống staging).

Giả định: production có `rounding.night_rate` = 1.000, không có `web_estimate.open_until`, nhãn và sức chứa như staging (P2 dòng 10 = `10|10|4`). Gọi API production cần thêm header `Sec-Fetch-Site: same-origin`; trước khi bật thì trả 404.

### S6c.3 Kết luận

- Phần giá trên staging **đạt** với tham số đang chạy, nên QA không còn chặn F2 về mặt số. Theo quyết định mới của INV (bật với bảng đang chạy), điều kiện P6/P7 ở S6b.5 thay bằng quyết định này. ORC ghi vào decision-log là INV đổi cách làm so với ESC-045 (bật giá trước, chỉnh sau).
- ESC-050: theo ORC, production City View đã là 800.000, tức phương án A. QA ghi "Đã quyết: A" theo tin ORC.
- Sau khi bật thì vẫn còn các việc này, không chặn F2:
  - Ngày lễ vẫn +30 % (P03 = 2.860.000). ESC-045 câu 1 = A ghi cả lễ lẫn cuối tuần về 0 %, INV chỉnh sau.
  - Web hiện "Includes our longer-stay rate" từ 7 đêm.
  - Trẻ 6–11 tuổi tính 100.000.
  - Từ 28 đêm, web mời thuê tháng. Khi bật giá, gợi ý dưới ô ngày theo câu trả lời của API, nên không mâu thuẫn trên trang. Khi giá tắt, landing vẫn tính 29 đêm là ngắn ngày (`shortMaxNights` 29). Nếu giữ mốc 28 lâu dài thì FE cần đặt `shortMaxNights` = 27.
  - Sổ tay v1.0.4 (#85) đang viết theo bảng 01/11, nên DOM/BA sửa nếu bảng đang chạy được giữ.
  - ~~SEC ca 3, 4, 8, 10 vẫn chờ Desk (S6b.3).~~ Đã chạy 06/11 18:18–18:31 (S6d). Ca 3 và 8 đạt. Ca 4 đạt phần web; Desk "từ – đến" dời v1.0.x. Ca 10 đạt bằng bằng chứng thay thế, chờ SEC ghi nhận.
- Lỗi mới: 0. S6c không tạo dữ liệu nào. Lượt này dùng thêm khoảng 20 lượt trong bộ đếm ngày của (M).

---

## S6d – SEC 9.5 ca 3/4/8/10 (ORC chạy, QA kết luận)

- Tác giả: QA | Round 4 – bước **Kiểm thử** | Kết luận viết 06/11/2026 tối. Người chạy: **ORC**, trên staging, 06/11 18:18–18:31 giờ VN, vì INV muốn đội đóng nốt việc để chuyển sang vận hành. QA **không** gọi staging hay production ở lượt này. QA chỉ đọc biên bản của ORC, các tệp JSON thô, script và mã nguồn.
- Môi trường: staging, api `sha-6414be25f20d`. Giá gọi qua edge thật `staging.ottimo.vn`; basic auth đọc từ tệp root, không in ra. Có hai nơi gọi: (M) Mac của ORC và (S) VPS tự gọi chính nó qua loopback. Desk dùng `qa.owner` (giá, nhãn hạng, mở yêu cầu web) và `qa.fd` (giữ chỗ). Tham số giống S6c: cuối tuần 0 %, giảm 10 % từ 7 đêm, trẻ 6–11 tuổi 100.000; Amber và Mist 700.000.
- Tệp thô nằm ở scratchpad của ORC, không đưa vào repo vì có `estimateToken` và form token. QA tự kiểm lại:
  - `p13-*.json` (16 tệp), `est-ca4.json`, `body-ca4.json`, `sub-ca4.json`, `w/m1-*.json` (25 tệp), `p10-before.json`, `p10-after.json`, `ca3-holds.json`;
  - payload của `estimateToken`: giải mã base64 phần giữa, không đọc chữ ký;
  - các script `pub.sh`, `poll.sh`, `srvpub.sh`, `submit.sh`, `wave.sh`, `desk.py`, `ca3.py`.
- Những phần **chỉ có lời ORC**, không có tệp thô: Desk GET yêu cầu `C3QACMYB`, SQL READ ONLY `atSubmit`, đếm log api, trạng thái giữ chỗ và lệnh hủy, mã 409/200 khi thao tác trên `QAT1`, kết quả `ops-check pricegap` trên hai môi trường. Bảng dưới ghi các phần này là "theo ORC".

### S6d.1 Kết quả

| Ca | Việc (SEC 9.5) | Kết quả, QA kiểm lại từ tệp thô và mã | KQ |
|---|---|---|---|
| 3 | Chiếm hết căn hạng Signature → phản hồi trùng byte | P10 (Signature, 4 NL + trẻ 8 tuổi + trẻ 3 tuổi, 16→23/11) gọi từ (S) lúc 18:29:44 = **8.890.000** (9.100.000 − 910.000 + 700.000; `nightlyAvgVnd` 1.270.000). `qa.fd` giữ chỗ **OTM-00400** (Pine) và **OTM-00401** (Velvet) cho 16→23/11, qua báo giá BG-00069/70 rồi create-hold, lúc 18:30:35–36. Tạo đơn thẳng không cọc thì bị 422 `DEPOSIT_INSUFFICIENT`. Gọi lại P10 lúc 18:30:50. QA so `p10-before.json` với `p10-after.json`: cả hai 801 byte, cùng thứ tự 13 khóa, chỉ khác 3 khóa `computedAt`, `estimateToken`, `expiresAt`. Bỏ 3 khóa đó khỏi thân **thô** thì còn 371 byte, **giống hệt từng byte**, sha256 cùng bắt đầu `3087a106`. Con số 405 byte của ORC là cùng nội dung khi in lại bằng `json.dumps` mặc định. Payload token giống nhau ở 13/15 trường, chỉ khác `iat` và `exp`; `pv` không đổi. Hai lượt cách nhau 66 giây, lâu hơn TTL 60 giây của bộ đệm, và `computedAt` mới, nên lượt sau là tính lại thật, không phải bản đệm. Đọc mã: `PublicRatePort.rooms` chỉ đọc `room`, `room_block` (OOO) và `room_list_price` (`public-rate.port.ts:79–107`). S6b.3 đã có thêm ca đêm đã bán (Sage 06/11–12/12, Garden vẫn có số), nên cả giữ chỗ lẫn đêm đã bán đều đã thử. Hủy giữ chỗ lúc 18:31:11 (theo ORC) | **Đạt** |
| 4 | Hạng có 2 căn khác giá → web chỉ có mức "từ"; Desk thấy cả "từ" và "đến" | OWN đặt giá đêm **Amber = 650.000** từ 10/11; Mist vẫn 700.000. **Web:** `est-ca4.json` P13 = **1.950.000** (3 × 650.000), 13 khóa ngoài, `shortStay` 8 khóa. Thân không có `toTotal`, `maxTotal`, `2100000`, `Amber`, `Mist`, `roomId`, `lines`. Payload token có đủ 15 khóa như S6b, `tot` = 1.950.000, không có số "đến". Yêu cầu `@example.test` (en, consent `2026-11-04`) gửi kèm **đúng** token của lượt ước tính đó (`body-ca4.json`) → **202** `C3QACMYB` (`sub-ca4.json`). **Desk (theo ORC):** `priceEstimate.totalVnd` = 1.950.000, `suspiciousFlags` = [] (token hợp lệ, hạng khớp), **không có số "đến"**. SQL READ ONLY: `atSubmit.fromTotalVnd` = 1.950.000, `toTotalVnd` = 2.100.000. Đúng thẻ **FB-R4-SEC-BE-03** (Minor, BE Deferred v1.0.x): dữ liệu đã lưu, nhưng API và Desk chưa đưa ra. ORC từ chối yêu cầu lúc 18:31 | **Web: Đạt.** Desk "từ – đến": dời **v1.0.x** theo FB-R4-SEC-BE-03, không mở lỗi mới |
| 8 | OWN đổi giá một căn → web ra số mới trong ≤ 60 giây | Lúc 18:18:40 P13 = 2.100.000. 12 lượt gọi từ 18:18:52 tới 18:22:06 vẫn ra 2.100.000. Hai lần đổi giá đầu hỏng vì lỗi script của ORC (thiếu If-Match → 428; lỗi cú pháp). Giá không đổi, nên không tính hai lần này. Các lượt đó cũng cho thấy TTL đệm 60 giây: `computedAt` đứng yên 18:18:40 → 18:19:41 → 18:20:46 → 18:21:50. **PATCH 650.000 lúc 18:22:26 → `p13-a650-1.json` lúc 18:22:28 = 1.950.000** (`nightlyAvgVnd` 650.000, `computedAt` 18:22:28). Lúc đó bản đệm tính từ 18:21:50 mới 38 giây tuổi, còn trong TTL. Vậy số mới có ngay là nhờ đổi căn xóa bộ đệm (`platform.controller.ts:261–265`: `ParameterHooks.changed` → `PriceEstimateService.invalidate`), không phải nhờ TTL hết hạn. **Hủy dòng hẹn 10/11 (`cancel-scheduled`) lúc khoảng 18:25:30 → `p13-a700-1.json` lúc 18:25:31 = 2.100.000**, khoảng 1,1 giây sau (`t0` 18:25:31; đường hủy cũng xóa bộ đệm, `platform.controller.ts:288–291`). `priceVersion` đổi `672972…` → `67b128…` rồi về lại `672972…`: băm chỉ phụ thuộc đầu vào. Thân sau khi đổi không có tên căn, `roomId` hay số "đến" | **Đạt** (khoảng 2,5 giây và 1,1 giây; TTL 60 giây chỉ là lưới cuối) |
| 10 | Một căn giá 0, gọi 100 lần → OWN nhận đúng 1 thông báo | **Không tái hiện được.** Kịch bản S6b.3 bước 2 dựa trên giả định sai (**BUG-R4-056**). (a) `QAT1` hoạt động từ 01/12. `rooms()` chỉ lấy căn có `active_from <= arrival` (`public-rate.port.ts:92–93`), nên QAT1 không vào phép tính 10–13/11. Từ 01/12 thì QAT1 đã có giá 01/12 và 02/12, cũng không thiếu đêm nào. ORC gọi 25 lượt City từ (M), 18:26:04–18:26:20; QA đếm lại `w/m1-*.json`: **14 × 200** và **11 × 429** `RATE_LIMITED`. Trong 14 lượt 200 có 13 lượt ra số, đều 700.000/đêm, ngày đến 10/11…23/11, 1–4 đêm; lượt đến 14/11 ở 1 đêm ra `on_request` + `min_stay` 2. 11 lượt 429 là vì bộ đếm 30/10 phút của (M) đã đầy cùng các lượt ca 8 và ca 4: thêm một lần xác nhận ca 6. Log api 24 giờ trước và sau (theo ORC): **0** dòng `public_price_missing`. Đúng như mã. (b) **Không tạo được khe giá qua Desk/API:** hủy dòng giá đầu → 409 `first_price` (`rooms.service.ts:336–337`). Thêm dòng 03/12 không gửi giá đêm thì server **không chép giá đêm cũ** mà **tính giá tháng ÷ `night_from_month_divisor`** (12) theo BR-101 (5) (`rooms.service.ts:593–596`, `383–387`). QAT1 được tạo với giá tháng 9.000.000, nên ra 9.000.000 ÷ 12 = 750.000, trùng giá đêm cũ. Vì vậy mới dễ hiểu nhầm là "chép" (**BUG-R4-057**). "Giá 0" cũng không làm được: API `money` ≥ 1 (`platform.controller.ts:74`), DB có `CHECK nightly_list_price_vnd > 0` (migration 0004 dòng 108), và `createRoom` luôn ghi dòng giá đầu đúng ngày `activeFrom`. (c) **Bằng chứng thay thế:** xem S6d.3. Hoàn tác lúc 18:28:10 (theo ORC): hủy dòng 03/12, bỏ nhãn QAT1 | **Đạt bằng bằng chứng thay thế**, chờ SEC ghi nhận (S6d.3) |

### S6d.2 Phát hiện: qua Desk không tạo được khe giá

"Khe giá" ở đây là: một căn đang bán, có nhãn hạng, mà thiếu giá đêm cho ít nhất một đêm. Mọi đường ghi giá của ứng dụng đều không tạo ra khe giá:
- `createRoom` và đường nhập danh mục ghi dòng giá đầu đúng ngày `activeFrom`;
- `updateRoom` không đổi được `activeFrom`, và luôn có giá đêm (gửi kèm, hoặc tự tính);
- lệnh hủy không gỡ được dòng giá đầu;
- API và DB đều chặn giá ≤ 0.

Vì vậy khe giá chỉ có thể đến từ dữ liệu **không đi qua Desk/API**:
1. **Production bootstrap** tạo căn **không có giá** (`production-bootstrap.ts:215`: "no list price – INV enters prices in the app") nhưng đặt sẵn nhãn hạng theo `production-defaults.ts`. Đây là tình huống thật mà `pricegap` sẽ báo: dựng mới, hoặc thêm căn bằng bootstrap, rồi bật giá web trước khi nhập giá.
2. Sửa thẳng DB (SQL tay, migration). Chính test tích hợp cũng phải dùng SQL mới tạo được khe (`UPDATE room_list_price SET effective_from = '2027-06-01'`).

Hệ quả cho vận hành (ghi nhận, không phải lỗi):
- `pricegap` là lưới an toàn cho dữ liệu ngoài Desk. OWN gõ sai giá trên Desk (ví dụ Ember 11.000.000) thì `pricegap` **không** báo, vì căn vẫn có giá. Lỗi gõ chỉ bắt được bằng báo giá Desk từng căn (S6b, S6c.2).
- `pricegap` dựa vào log, nên chỉ báo khi có khách gọi đúng hạng và đúng ngày chạm khe. Production `ok` nghĩa là "24 giờ qua không lượt gọi nào chạm khe", chưa chứng minh "không có khe". Gợi ý cho OPS (Suggestion): thêm một kiểm tĩnh SQL READ ONLY. Đếm các căn `is_sellable`, có `public_room_type` và `active_from <= hôm nay` mà **không** có dòng `room_list_price` nào `effective_from <= hôm nay`; kết quả phải là 0. Kiểm này có thể đặt trong `pricegap` hoặc vào P2 của runbook.
- README `infra/server` dòng 120 ghi "nhất là sau khi nhập lại bảng giá 01/11". Câu này dễ gây hiểu nhầm, vì nhập lại bảng giá trên Desk không tạo khe. Gợi ý cho OPS: viết là "thường do dữ liệu khởi tạo hoặc sửa thẳng DB: OWN nhập giá cho căn đó trên Desk, OPS tìm nguồn".
- Số tin cảnh báo cho một khe giá không phải "đúng 1":
  - `notify` gửi một tin khi chuyển sang FAIL, rồi nhắc lại mỗi 6 giờ (`REMIND_SECONDS` = 21600) chừng nào còn FAIL. Cửa sổ log là 24 giờ, nên một khe giá thường ra khoảng 4 tin FAIL và 1 tin hết lỗi.
  - Số tin này **không phụ thuộc số lượt khách gọi**, nên vẫn đúng mục đích của SR-PE-12 / T9: người ngoài không tạo được hàng loạt thông báo. SEC đã chấp nhận cách "ghi log thay cho thông báo Desk" (`SEC-on-LP-v2-code.md` dòng 128, ARC L9).
  - Bộ nhớ khử trùng nằm trong tiến trình api, nên khi api khởi động lại thì có thể thêm 1 dòng log trong ngày.

### S6d.3 Ca 10 – bằng chứng thay thế có đủ không

Ba bằng chứng ORC dùng, QA đã đọc lại:
1. Test tích hợp `services/api/test/integration/lp-v2-price-estimate.test.ts:719`, chạy với Postgres thật. Căn bị tạo khe bằng SQL thì bị bỏ khỏi phép tính, web ra giá căn còn lại (3 × 667.000), và 3 lượt gọi (mỗi lượt xóa bộ đệm) chỉ sinh đúng **1** dòng `warn` `public_price_missing`. Khóa khử trùng là `property|room|ngày` (`price-estimate.service.ts:377–389`) và không phụ thuộc số lượt gọi, nên về logic 3 lượt hay 100 lượt là như nhau.
2. `infra/server/test/ops-check-price.test.sh:89–97`. Có 2 căn thiếu giá → `FAIL pricegap: 2 room(s)…`, rc=1, và không lộ room id hay property id ở output, webhook và tệp trạng thái. Không có dòng nào → ok.
3. `ops-check.sh pricegap` chạy thật lúc 18:28 (theo ORC): staging `ok`, production `ok`.

Ý kiến QA:
- **Đủ cho mục đích của ca 10.** Ca này cần chứng minh hai điều: người ngoài không tạo được hàng loạt thông báo, và web vẫn ra số của các căn còn lại. Nhánh thiếu giá không tới được qua Desk/API (S6d.2). Logic khử trùng có test với DB thật. `ops-check` có test riêng, và đã chạy trên cả hai máy thật mà không báo nhầm.
- **Còn hở một chỗ:** chưa lần nào thấy trọn chuỗi thật "api ghi dòng log → `ops-check` đọc log container → FAIL → tin webhook" trên một máy thật. Rủi ro thấp, vì chuỗi so khớp là chuỗi cố định (`public_price_missing`, `room=`), cùng dạng dòng log mà test dùng. Cách đóng chỗ hở này mà không ghi gì vào staging: dựng stack cục bộ bằng bootstrap (căn có nhãn, chưa có giá), gọi giá 2–3 lần, rồi chạy `ops-check.sh pricegap` với webhook giả. Mất khoảng 20 phút, OPS hoặc QA làm. **Không bắt buộc.**
- **Cần SEC ghi nhận.** 9.5 là danh sách ca bắt buộc của SEC ("QA chạy, SEC xem kết quả"), nên QA không tự thay ca của SEC. QA đề nghị SEC làm hai việc: ghi 1 dòng chấp nhận bằng chứng thay thế, và sửa câu ca 10 thành "một căn đang bán thiếu giá đêm (chỉ có từ dữ liệu ngoài Desk)". **Không cần ESC**, vì việc này không chạm tiền, phạm vi hay chính sách, và không chặn gì: F2 đã bật, `pricegap` production `ok`.

### S6d.4 SEC 9.5 sau S6d

| Ca | KQ | Nơi ghi |
|---|---|---|
| 1 | Đạt | S6b.3 |
| 2 | Đạt | mục 1 |
| 3 | **Đạt** | S6d.1 |
| 4 | **Web Đạt**; Desk "từ – đến" dời v1.0.x (FB-R4-SEC-BE-03) | S6d.1 |
| 5 | Đạt (API/DB) | mục 1 |
| 6 | Đạt | mục 1 |
| 7 | Đạt (đo thay thế) | mục 1 |
| 8 | **Đạt** | S6d.1 |
| 9 | Không chạy theo lệnh ORC (lượt 1 trên stack thử đã đạt) | mục 1 |
| 10 | **Đạt bằng bằng chứng thay thế**, chờ SEC ghi nhận | S6d.1, S6d.3 |
| 11 | Đạt | mục 1 |
| 12 | Đạt | S6b.3 |
| BE-01 | Đạt | mục 1 |

Tổng: **10 ca đạt đủ** (1, 2, 3, 5, 6, 7, 8, 11, 12, BE-01), **1 ca đạt phần web** (4), **1 ca đạt bằng bằng chứng thay thế** (10), **1 ca không chạy theo lệnh** (9). **0 ca đỏ.** Không còn ca nào chờ thao tác Desk.

### S6d.5 Lỗi mới, dữ liệu để lại

- **BUG-R4-056** (P3, tài liệu thử; vai QA + SEC): kịch bản ca 10 ở S6b.3 bước 2 và câu "giá 0" ở SEC 9.5 dựa trên giả định không làm được.
- **BUG-R4-057** (P3; vai BE + ARC + DOM): API đổi giá mà không gửi `nightlyListPriceVnd`, cùng `createRoom`, vẫn tự tính giá đêm = giá tháng ÷ 12. Đường tạm này BR-101 (5) hẹn bỏ "tới v1.0.1". Từ điển tham số lại ghi khóa này "không còn tác dụng". Desk không đi đường này.
- 0 P0 · 0 P1 · 0 P2. Không có ESC. Chi tiết ở `rounds/round-04/qa/bug-list.md`.
- Trạng thái staging sau lượt chạy (theo ORC): Amber 700.000, không còn dòng giá hẹn; QAT1 không nhãn, còn dòng giá 01/12 và 02/12 như trước; OTM-00400, OTM-00401 đã hủy; yêu cầu `C3QACMYB` đã từ chối; không đổi tham số nào. Bộ đếm tần suất RAM của (M) và (S) tự hết hạn.
