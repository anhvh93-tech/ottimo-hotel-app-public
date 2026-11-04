# SEC review nhánh tích hợp `lp-v2-main` (LP-v2 + PR #21 + Δ5 ko/zh/ru)

- Người review: SEC | Round 4 – gói LP-v2 – Bước: **Review chéo** | Ngày 04/11/2026
- Phạm vi: `origin/lp-v2-main` @ `bfad4f2c` (biên bản `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` trên nhánh). Đọc bằng `git show` / `git diff origin/main origin/lp-v2-main` và `git diff origin/lp-v2 origin/lp-v2-main`; không checkout, không sửa mã, không commit.
- Đối chiếu: `outputs/SEC/notice-2026-10-31-final.md` (mục 2, 5, 7), `outputs/SEC/lp-v2-privacy-and-api.md` (SR-PE, SR-LC), `reviews/SEC-on-LP-v2-code.md`, `reviews/SEC-on-LP-v2-ops.md`, `reviews/SEC-on-info-sent-copies.md` (S-1), responses BE/FE-B/OPS LP-v2 trên nhánh, decision-log 04/11 (luật sư xong; INV bỏ bước người bản xứ).
- Không có dữ liệu khách thật, khóa, mật khẩu hay URL bí mật trong tệp này.

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Không có Blocker. 1 Major, 2 Minor, 2 Suggestion.

Phần bảo mật của mã LP-v2 giữ nguyên như đã duyệt, các thẻ SEC trước đều đã đóng hoặc dời có lý do. PR #21 và 3 câu Δ5 đã áp đúng từng ký tự. Phần kiểm của v1.0.3 không bị mất. Vấn đề duy nhất cần sửa là hệ quả của việc đổi thứ tự P4: nhãn `2026-10-31` sẽ không bao giờ được đăng trên production, nên cổng Google Chat (★2) đang neo vào nhãn đó sẽ giữ mức A mãi mãi (thẻ 01).

**Nhãn phiên bản thông báo CHỐT: `2026-11-04`** (mục 2).

Điều kiện trước khi gộp `lp-v2-main` → `main`: thẻ 01, 02, 03 xong và CI PR xanh trên đúng đầu nhánh (kể cả `pnpm audit`, đang chạy ở run 41751815430). Điều kiện trước khi đăng thông báo trên production: mục 4.

## 1. Đối chiếu theo việc ORC giao

| # | Hạng mục | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | API giá công khai – rate limit | **Đạt** | `public-site.controller.ts` `guardedEstimate`: đếm theo IP (10 phút, ngày, /48) **trước**, rồi mới tới bộ đếm chung 10/giây, rồi bulkhead. Lượt bị 429 theo IP không vào bộ chung (FB-R4-SEC-BE-01 Done, có test 200 lượt/5 giây). `no-store` + `noindex` trên mọi câu trả lời. |
| 2 | Không lộ giá nền / hoa hồng / biên | **Đạt** | `publicEstimateDto` dựng từng trường (allowlist). Không có `toTotal`, mã căn, giá OTA, sàn, hoa hồng. Theo tháng trả `monthly_offer`, không có số. `atSubmit` chỉ lưu nội bộ (BE-03 Deferred v1.0.x, đã chấp nhận). Không đổi gì so với `lp-v2` đã duyệt. |
| 3 | Kiểm tra đầu vào | **Đạt** | `parseEstimateQuery`: tham số theo allowlist, không cho lặp, ≤ 256 byte, slug theo regex, số nguyên 1–3 chữ số trong khoảng, ngày theo BR-112. Caddy chỉ cho GET đúng đường dẫn, query `[!-~]{0,256}`. Một khe nhỏ có từ trước (Suggestion 05). |
| 4 | Locale | **Đạt** | `LANDING_LOCALES`: mục lạ thì api dừng khi khởi động, để trống thì mặc định `en,vi`. Form: `locale` ∈ LandingLocale; ngôn ngữ chưa có thông báo hiệu lực → 422 `PUBLIC_FORM_NOT_READY`. 0092 chỉ nới CHECK. compose prod truyền `LANDING_LOCALES` (C6). |
| 5 | Form khách: dữ liệu cá nhân, consent | **Đạt** | Bộ dò số nhạy cảm dùng chung `sensitive-number.ts` của `main` (BUG-R3-058, GCHAT-07, số giấy tờ Hàn/Trung/Nga) thay bản riêng của LP-v2, đúng hướng. `consentVersion` phải là version đang hiệu lực (hoặc version trước trong 7 ngày) của đúng ngôn ngữ. `consent` / `consentMore` 5 ngôn ngữ ghi đúng "from our server". Không có đường gửi thư mới cho khách, nên S-1 (SENT) không bị chạm. Ảnh chụp mới trong `rounds/` chỉ có dữ liệu thử ("Test Guest"). |
| 6 | Privacy notice en/vi = PR #21 | **Đạt** | So bằng script: khối `const en` và `const vi` của `privacy.ts` trên nhánh **trùng từng byte** với `origin/fe-b/notice-2026-10-31` @ `5474b6e1` (= đầu PR #21, PR còn OPEN). `en.ts` / `vi.ts` `consentMore` trùng PR #21. PR #21 là tổ tiên của nhánh. |
| 7 | 3 câu Δ5 ko/zh/ru (§6.4) | **Đạt** | Mỗi câu xuất hiện đúng 1 lần, trùng nguyên văn `notice-2026-10-31-final.md` mục 7. So với `origin/lp-v2`, ko/zh/ru **chỉ đổi đúng 3 dòng đó**. `translationNote` (EN/VI là bản gốc khi có khác biệt) có trên ko/zh/ru và được hiển thị. `privacy.test.ts` giữ chữ cuối cho 5 ngôn ngữ. |
| 8 | Nhãn phiên bản | **Chốt `2026-11-04`** | Mục 2. Thẻ 02 (FE-B). |
| 9 | `publish-privacy-notice` + PN append-only (0090) | **Đạt** | `0090_privacy_notice_append_only.sql`, `0089`, `0091`: không đổi byte so với `main`. `publish-privacy-notice.sql`: chỉ INSERT và gán `superseded_at` một lần; cùng version khác băm → từ chối; version mới hơn đang hiệu lực → từ chối; superuser → từ chối; N ngôn ngữ trong một giao dịch, băm khác nhau từng đôi, ngôn ngữ đang bán phải có trong bản dựng; DB chưa có 0092 thì báo rõ thay vì lỗi ràng buộc. ARC xác nhận trigger `_append_only` + `_no_truncate` còn sau 0092 trên DB 68 migration. |
| 10 | gitleaks | **Đạt** | SEC chạy `gitleaks v8.21.2` (cùng digest CI): (a) `--log-opts origin/main..origin/lp-v2-main` (19 commit) → no leaks; (b) `--no-git` trên toàn bộ cây `git archive origin/lp-v2-main` (kể cả `rounds/`) → no leaks. Job CI `gitleaks` của run 41751815430 xanh. `.github/gitleaks.toml` không đổi so với `main`. |
| 11 | CSP landing | **Đạt** | Header CSP không đổi (`default-src 'self'`, `connect-src 'self'`, `font-src 'self'`, `frame-ancestors 'none'`…). Caddy chỉ mở thêm đúng một matcher GET giá + `/ko` `/zh` `/ru` + trang 404 theo ngôn ngữ. Font ko/zh tự host; zh được cắt lại từ bộ đệm `.font-src` (ARC nói đã kiểm integrity, SEC không kiểm lại – rủi ro thấp). |
| 12 | Không mất kiểm v1.0.3 | **Đạt** | `ci.yml`: chỉ thêm bước, không xóa (gitleaks, backup-privacy-log, rollback, restore-drill, mail-test, requeue-email-changed còn đủ). `ops-check.sh` lượt chạy đủ = 11 kiểm của `main` + `pricelimit pricegap priceswitch`; biến `$cmd_err` đã sửa đúng. `http5xx` chỉ bỏ 503 của route giá (đã có `pricelimit` đếm riêng). `deploy-landing.sh` giữ 5 quy tắc fail-closed của v1.0.3, kể cả khi `--rollback` lúc proxy đang mở. |
| 13 | Đổi nghĩa P4 (ARC mục 7) | **Chấp nhận, kèm thẻ 01 và 03** | Không đăng `2026-10-31` riêng. LP-v2 đăng một lần cho 5 ngôn ngữ, en/vi cùng chữ luật sư đã duyệt. Nhưng câu của ARC "`CHAT_DETAILS_MIN_NOTICE_VERSION` = `2026-10-31` vẫn đúng (nhãn mới lớn hơn)" là **sai**: cổng không so chữ version mà lấy `published_at` của chính dòng `2026-10-31` (xem thẻ 01). |

## 2. Nhãn phiên bản thông báo – CHỐT

**`VERSION = '2026-11-04'`** cho cả 5 ngôn ngữ (en, vi, ko, zh, ru) và cũng là `CHAT_DETAILS_MIN_NOTICE_VERSION` (thẻ 01).

Lý do:
- 04/11 là ngày chữ cuối cùng của cả 5 ngôn ngữ được chốt: luật sư xong en/vi (INV 04/11), INV bỏ bước người bản xứ (04/11), SEC xác nhận 3 câu ko/zh/ru trên nhánh hôm nay. Theo quy tắc D2, nhãn là ngày chốt chữ.
- Lớn hơn `2026-10-31` (D2, FB-R4-SEC-FE-02) và lớn hơn `2026-10-24` đang hiệu lực trên production. `deploy-landing.sh` và `publish-privacy-notice.sql` vì vậy không từ chối.
- **Không dùng `2026-11-01`**: nhãn tạm này đã được đăng trên các stack thử của QA với chữ Δ5 cũ (L3), tức là khác byte. Dùng lại thì cùng một nhãn sẽ có hai văn bản ở các môi trường khác nhau, trái quy tắc "một (version, locale) = một chuỗi byte".
- **Không dùng `2026-10-31`**: nhãn này đã được đăng trên stack thử (QA PR #24, `qa/pr24-text-safety.md`) với trang khác byte trang LP-v2. Ngoài ra nó sẽ đảo ngược D2.
- Đúng định dạng `^YYYY-MM-DD(\.[1-9][0-9]?)?$` (form, wrapper, SQL, deploy-landing).

Quy tắc giữ nhãn: nếu trước khi đăng có đổi **bất kỳ** câu nào của 5 trang thông báo, hoặc `consent` / `consentMore` của 5 ngôn ngữ, thì dùng nhãn mới (`2026-11-04.1`, hoặc ngày mới). Không bao giờ dùng lại một nhãn cho chữ khác. Các thay đổi chỉ về trình bày mà vẫn đổi byte trang (bộ chọn ngôn ngữ, CSS nội tuyến) cũng phải dùng nhãn mới **nếu** nhãn đó đã được đăng ở bất kỳ môi trường dùng chung nào (staging/production).

## 3. Thẻ

### FB-R4-SEC-LPV2M-01
- Mức độ: Major
- Vị trí: `product/services/api/src/modules/public-site/public/chat-message.ts` dòng 38 (`CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-10-31'`) và dòng 63–66 (`CHAT_NOTICE_GATE_SQL`); biên bản ARC `lp-v2-main-merge.md` mục 7 (P4); `product/infra/server/env.production.example` dòng 117; `product/infra/server/README.md` dòng 408.
- Vấn đề: cổng ★2 lấy `min(published_at) FROM privacy_notice_version WHERE version = '2026-10-31'`. Nếu dòng này không có thì `min_at` là NULL, nên mọi tin bị giữ ở mức A (`capped`). Với đổi nghĩa P4, `2026-10-31` **không bao giờ được đăng** trên production: LP-v2 đăng thẳng nhãn mới, thay `2026-10-24`. Hậu quả là sau khi LP-v2 đăng và OPS đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C`, tin Chat vẫn ở mức A mãi mãi, không có lỗi hay cảnh báo nào ngoài cờ `capped`. Việc này fail-closed, không lộ dữ liệu, nhưng làm quyết định ESC-041 C của INV âm thầm không có hiệu lực. Câu "vẫn đúng (nhãn mới lớn hơn)" trong biên bản ARC hiểu cổng là phép so chữ, trong khi mã cố ý không so chữ.
- Vì sao quan trọng: lễ tân không nhận được chi tiết trong Chat như INV đã chọn, và đội sẽ mất công tìm lỗi "C không chạy". Có một bẫy ngược: nếu sau này ai đó "sửa" bằng cách so chuỗi version, cổng sẽ mở cho cả các version không nêu Google Chat.
- Đề xuất sửa (BE, trên `lp-v2-main` trước khi gộp `main`, để không tốn thêm một lần phát hành api):
  1. `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` (nhãn chốt ở mục 2). Giữ nguyên SQL theo `published_at`. Sửa chú thích: "first notice version that names Google Chat **and is published**; `2026-10-31` was never published (P4, lp-v2-main 04/11)".
  2. Test `gchat-units` / `gchat-notify`: thêm ca (a) chỉ có `2026-10-24` + `2026-11-04` (không có `2026-10-31`): yêu cầu gửi theo `2026-11-04` (en và ko) nhận C; (b) yêu cầu theo `2026-10-24` nhận A; (c) DB chưa đăng `2026-11-04` thì mọi yêu cầu nhận A. Các fixture cũ dùng `2026-10-31` thì đổi theo hoặc giữ làm ca "nhãn không phải hằng → A".
  3. `env.production.example` dòng 117 và README dòng 408: "older than 2026-10-31" → "older than 2026-11-04 (the first published notice naming Google Chat)".
  4. ARC sửa câu P4 trong biên bản (mục 7).
  - Nếu ORC đổi ý và đăng `2026-10-31` riêng trước LP-v2 thì giữ hằng như cũ; thẻ này khi đó Rejected với lý do đó.
- Trạng thái: Open

### FB-R4-SEC-LPV2M-02
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/content/privacy.ts` dòng 54–58 (khối chú thích "TEMPORARY LABEL" + `const VERSION = '2026-11-01'`); `product/tests/e2e/landing/form-live.landing.spec.ts` dòng 21; `product/tests/e2e/landing/lp-v2.landing.spec.ts` dòng 508; `product/apps/landing-web/src/scripts/price-estimate.test.ts` dòng 37.
- Vấn đề: nhãn tạm vẫn còn (FB-R4-SEC-FE-02, ARC LPV2M-02). Nay SEC đã chốt.
- Vì sao quan trọng: nhãn là thứ khách đồng ý, và cũng là khóa băm khi đăng. Lọt nhãn tạm lên production thì phải đăng version mới.
- Đề xuất sửa (FE-B): `VERSION = '2026-11-04'`. Thay khối chú thích "TEMPORARY LABEL…" bằng "Version 2026-11-04 (SEC SEC-on-lp-v2-main.md mục 2): en/vi = `2026-10-31` text (PR #21, lawyer-reviewed) – never published on its own (P4); ko/zh/ru Δ5 = notice-final 7." Đổi 3 chỗ test. Chạy lại `check:dist`, `privacy.test`, `pages.spec`, landing Playwright. Ghi sha256 5 trang dựng mới vào báo cáo để OPS so khi đăng. Khi xong, FB-R4-SEC-FE-02 và ARC LPV2M-02 cùng Done.
- Trạng thái: Open

### FB-R4-SEC-LPV2M-03
- Mức độ: Minor
- Vị trí: `product/infra/server/README.md` mục 12.3 "LP-v2": dòng 286 (bước 0 "v1.0.1 trước… đã đăng `2026-10-31`"), dòng 289 ("các dòng `2026-10-31` của en/vi bị superseded"), dòng 300–301 (quay lui "bản cũ in `2026-10-31`"); chú thích `publish-privacy-notice.sql` dòng 136.
- Vấn đề: runbook vẫn giả định `2026-10-31` đã được đăng trước. Theo P4 mới, production đang ở `2026-10-24` (landing-v1.1.x), và LP-v2 sẽ thay `2026-10-24` en/vi trực tiếp. Khi quay lui trong 7 ngày, trang sẽ in `2026-10-24`, không phải `2026-10-31`.
- Vì sao quan trọng: người chạy runbook đối chiếu sai dòng "superseded" hoặc sai version của trang quay lui, rồi dừng giữa chừng lúc proxy form đang mở.
- Đề xuất sửa (OPS): viết lại bước 0, (c) và quay lui theo trạng thái thật: hiệu lực hiện tại là `2026-10-24` en/vi; sau `--apply` thấy `OK: version 2026-11-04 published (en vi ko zh ru)` và `supersede version 2026-10-24 (en)`, `(vi)`. Thêm vào runbook phát hành LP-v2 các điều kiện P1–P6 của `notice-2026-10-31-final.md` mục 5, nay áp cho lượt đăng LP-v2 (P1 K1 đã đạt 03/11; P5 đổi thành "hằng = `2026-11-04` trên bản api đang chạy").
- Trạng thái: Open

### FB-R4-SEC-LPV2M-04
- Mức độ: Suggestion
- Vị trí: `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` mục 4 bước 2
- Vấn đề: dữ liệu giả gọi là "hình dạng production" có `2026-10-31` en/vi/ru đang hiệu lực. Production thật chỉ có `2026-10-24` en/vi. Kết luận về 0092 không đổi (0092 không đụng các dòng thông báo), nhưng mô tả này góp phần làm câu P4 sai ở thẻ 01.
- Đề xuất sửa: ghi chú lại trong biên bản. Lượt diễn tập trên staging dùng đúng trạng thái `2026-10-24`.
- Trạng thái: Open

### FB-R4-SEC-LPV2M-05
- Mức độ: Suggestion
- Vị trí: `price-estimate.service.ts` `parseEstimateQuery` → `date()`; cùng mẫu với `assertLocalDate` (`shared/time.ts`) và kiểm `arrival` của form (`public-booking.service.ts`)
- Vấn đề: `Date.parse('2026-02-31T00:00:00Z')` trong V8 trả ngày 03/03 chứ không phải NaN, nên `2026-02-31` qua được kiểm và được tính như một ngày thật. Câu trả lời lại in lại chuỗi gốc. Không lộ dữ liệu và không sai tiền có hại (khách chỉ nhận một con số "ước tính" cho ngày không tồn tại). Lỗi này có từ trước, không do LP-v2 sinh ra.
- Đề xuất sửa: trong `assertLocalDate`, thêm phép so khứ hồi (dựng lại `YYYY-MM-DD` từ `Date` rồi so bằng chuỗi gốc) và dùng hàm này cho cả route giá và form. Làm ở v1.0.x, không chặn.
- Trạng thái: Open

## 4. Điều kiện trước khi đăng thông báo `2026-11-04` trên production (SEC kiểm)

| # | Điều kiện | Ai |
|---|---|---|
| D1 | Thẻ 01 + 02 + 03 Done; CI PR `lp-v2-main` → `main` xanh trên đúng đầu nhánh, gồm `pnpm audit` và gitleaks lịch sử | BE, FE-B, OPS, ORC |
| D2 | Bản api chạy trên production có `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` (QA đọc mã của tag) | QA |
| D3 | P2 (`retention.web_request_ip_hmac_days` ≤ 30), P3 (thành viên phòng Chat chỉ OWN/MGR/FDL/FD), P4 (sổ tay WR8 + lịch xóa phòng Chat hằng năm) của notice-final mục 5 vẫn đúng tại ngày đăng | OPS, INV, BA |
| D4 | Thứ tự trong cùng một phiên SSH: api có 0092 → `deploy-landing.sh` image LP-v2 → `publish-privacy-notice.sh` chạy thử rồi `--apply` (5 ngôn ngữ, băm khớp trang sống) → rồi mới đặt `LANDING_LOCALES=en,vi,ko,zh,ru` → `form-token` 200 | OPS |
| D5 | QA chạy lại 12 ca SEC 9.5 (C8) trên **staging qua Caddy thật**, gồm ca IP khách đến api qua `TRUST_PROXY` (kết quả hiện chỉ có trên stack thử) | QA |
| D6 | `public_show_prices` vẫn `false` cho tới khi OWN bật; `ops-check priceswitch` đã lấy mốc | OPS, INV |
| D7 | Chỉ đặt `BOOKING_REQUEST_CHAT_DETAIL_LEVEL=C` sau khi `2026-11-04` đã đăng và SEC xác nhận ★1–★8 trong decision-log (như cũ) | OPS, SEC |

## 5. Rủi ro còn lại

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| RR-NS (mới) | Bản ko/zh/ru của thông báo và trang chưa có người bản xứ đọc (INV bỏ bước này 04/11). Một câu dịch có thể sai nghĩa pháp lý (thời hạn, bên nhận, quyền) | Thấp – Trung bình | INV đã chấp nhận, **không chặn**. Có giảm nhẹ: câu Δ7 ghi EN/VI là bản gốc, và ko/zh/ru trùng chữ SEC. Đề xuất: khi có phản hồi khách về câu chữ, đổi version mới, không sửa tại chỗ. Giữ review-pack để dùng sau. |
| RR-N1 (mở rộng) | Yêu cầu gửi theo `2026-10-24` (không nêu Chat, không nêu dịch) tiếp tục được nhận cho tới khi LP-v2 đăng (P4: không có `2026-10-31` chen giữa), cộng thêm 7 ngày sau đó | Thấp | Chat vẫn mức A cho các yêu cầu này (cổng ★2). Việc dịch trên Desk vẫn có thể xảy ra (ESC-044). Rút ngắn bằng cách đăng LP-v2 sớm. |
| PE-RR1…4 | Cào giá trực tiếp; OOO lộ một phần; bộ đếm RAM; trần 600 lần tính mới/giờ | Thấp – chấp nhận | Như `SEC-on-LP-v2-code.md` mục 6. |
| BE-03 | Desk chưa hiện số server tính lại lúc nhận | Thấp | Deferred v1.0.x (BE). |
| RR-T3, RR-T4 | Dịch cả trang Desk; thông báo khách lưu trú chưa nêu việc dịch | Như cũ | RR-T4 thuộc `privacy-2026-10-v2` (v1.0.4). |

## 6. Dòng decision-log đề xuất (ORC ghi)

| 2026-11-04 | 4 | **SEC – review `lp-v2-main` (bfad4f2c): ĐẠT CÓ ĐIỀU KIỆN; chốt nhãn thông báo `2026-11-04`** (`rounds/round-04/reviews/SEC-on-lp-v2-main.md`). en/vi trùng từng byte PR #21 (5474b6e1); 3 câu Δ5 ko/zh/ru đúng notice-final 7; rate limit / allowlist / input / locale / CSP / 0090 / publish / gitleaks (lịch sử + cây) / kiểm v1.0.3 đạt. Chấp nhận đổi nghĩa P4 (không đăng `2026-10-31` riêng), kèm điều kiện: `CHAT_DETAILS_MIN_NOTICE_VERSION` → `2026-11-04` (LPV2M-01 Major, nếu không thì Chat giữ mức A mãi), FE-B đổi `VERSION` + 3 test (LPV2M-02), OPS sửa README 12.3 theo trạng thái `2026-10-24` (LPV2M-03). Điều kiện đăng D1–D7. Rủi ro RR-NS (không có người bản xứ đọc) INV đã chấp nhận, không chặn | SEC | Quyền SEC (chữ/nhãn thông báo, yêu cầu kỹ thuật); bỏ bước người bản xứ theo quyết định INV 04/11 |

## 7. Điểm làm tốt
- ARC: gộp `website-request-rules.ts` bằng cách lấy bộ dò chung mạnh hơn của `main` thay vì giữ bản riêng của LP-v2, nên form và Chat chỉ còn một nguồn nhận diện số giấy tờ/thẻ.
- ARC/OPS: `deploy-landing.sh` hợp hai bộ quy tắc mà vẫn giữ fail-closed của v1.0.3 khi `--rollback` lúc proxy mở, có ca test 16c mới; `ops-check` phát hiện và sửa `$compose_err` → `$cmd_err` (nếu không thì `set -u` làm script chết lặng lẽ).
- FE-B/ARC: Δ5 ko/zh/ru chép bằng script, kèm test giữ chữ cuối cho 5 ngôn ngữ; so với `lp-v2` chỉ đổi đúng 3 dòng.
