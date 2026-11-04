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
- Trạng thái: Open → **Closed** (SEC xác nhận 04/11, mục 8: `2760744b` + test chống so chữ `4fe85e19`)

### FB-R4-SEC-LPV2M-02
- Mức độ: Minor
- Vị trí: `product/apps/landing-web/src/content/privacy.ts` dòng 54–58 (khối chú thích "TEMPORARY LABEL" + `const VERSION = '2026-11-01'`); `product/tests/e2e/landing/form-live.landing.spec.ts` dòng 21; `product/tests/e2e/landing/lp-v2.landing.spec.ts` dòng 508; `product/apps/landing-web/src/scripts/price-estimate.test.ts` dòng 37.
- Vấn đề: nhãn tạm vẫn còn (FB-R4-SEC-FE-02, ARC LPV2M-02). Nay SEC đã chốt.
- Vì sao quan trọng: nhãn là thứ khách đồng ý, và cũng là khóa băm khi đăng. Lọt nhãn tạm lên production thì phải đăng version mới.
- Đề xuất sửa (FE-B): `VERSION = '2026-11-04'`. Thay khối chú thích "TEMPORARY LABEL…" bằng "Version 2026-11-04 (SEC SEC-on-lp-v2-main.md mục 2): en/vi = `2026-10-31` text (PR #21, lawyer-reviewed) – never published on its own (P4); ko/zh/ru Δ5 = notice-final 7." Đổi 3 chỗ test. Chạy lại `check:dist`, `privacy.test`, `pages.spec`, landing Playwright. Ghi sha256 5 trang dựng mới vào báo cáo để OPS so khi đăng. Khi xong, FB-R4-SEC-FE-02 và ARC LPV2M-02 cùng Done.
- Trạng thái: Open → **Closed** (SEC xác nhận 04/11, mục 8: `ef2eb4ef`, chú thích `aad14baa`)

### FB-R4-SEC-LPV2M-03
- Mức độ: Minor
- Vị trí: `product/infra/server/README.md` mục 12.3 "LP-v2": dòng 286 (bước 0 "v1.0.1 trước… đã đăng `2026-10-31`"), dòng 289 ("các dòng `2026-10-31` của en/vi bị superseded"), dòng 300–301 (quay lui "bản cũ in `2026-10-31`"); chú thích `publish-privacy-notice.sql` dòng 136.
- Vấn đề: runbook vẫn giả định `2026-10-31` đã được đăng trước. Theo P4 mới, production đang ở `2026-10-24` (landing-v1.1.x), và LP-v2 sẽ thay `2026-10-24` en/vi trực tiếp. Khi quay lui trong 7 ngày, trang sẽ in `2026-10-24`, không phải `2026-10-31`.
- Vì sao quan trọng: người chạy runbook đối chiếu sai dòng "superseded" hoặc sai version của trang quay lui, rồi dừng giữa chừng lúc proxy form đang mở.
- Đề xuất sửa (OPS): viết lại bước 0, (c) và quay lui theo trạng thái thật: hiệu lực hiện tại là `2026-10-24` en/vi; sau `--apply` thấy `OK: version 2026-11-04 published (en vi ko zh ru)` và `supersede version 2026-10-24 (en)`, `(vi)`. Thêm vào runbook phát hành LP-v2 các điều kiện P1–P6 của `notice-2026-10-31-final.md` mục 5, nay áp cho lượt đăng LP-v2 (P1 K1 đã đạt 03/11; P5 đổi thành "hằng = `2026-11-04` trên bản api đang chạy").
- Trạng thái: Open → **Closed** (SEC xác nhận 04/11, mục 8: README 12.3 `917a39cf` + `aad14baa`, runbook r1.1 bảng P0)

### FB-R4-SEC-LPV2M-04
- Mức độ: Suggestion
- Vị trí: `rounds/round-04/outputs/ARC/lp-v2-main-merge.md` mục 4 bước 2
- Vấn đề: dữ liệu giả gọi là "hình dạng production" có `2026-10-31` en/vi/ru đang hiệu lực. Production thật chỉ có `2026-10-24` en/vi. Kết luận về 0092 không đổi (0092 không đụng các dòng thông báo), nhưng mô tả này góp phần làm câu P4 sai ở thẻ 01.
- Đề xuất sửa: ghi chú lại trong biên bản. Lượt diễn tập trên staging dùng đúng trạng thái `2026-10-24`.
- Trạng thái: Open → **Closed** (SEC xác nhận 04/11, mục 8: ghi chú ARC biên bản mục 4 bước 2)

### FB-R4-SEC-LPV2M-05
- Mức độ: Suggestion
- Vị trí: `price-estimate.service.ts` `parseEstimateQuery` → `date()`; cùng mẫu với `assertLocalDate` (`shared/time.ts`) và kiểm `arrival` của form (`public-booking.service.ts`)
- Vấn đề: `Date.parse('2026-02-31T00:00:00Z')` trong V8 trả ngày 03/03 chứ không phải NaN, nên `2026-02-31` qua được kiểm và được tính như một ngày thật. Câu trả lời lại in lại chuỗi gốc. Không lộ dữ liệu và không sai tiền có hại (khách chỉ nhận một con số "ước tính" cho ngày không tồn tại). Lỗi này có từ trước, không do LP-v2 sinh ra.
- Đề xuất sửa: trong `assertLocalDate`, thêm phép so khứ hồi (dựng lại `YYYY-MM-DD` từ `Date` rồi so bằng chuỗi gốc) và dùng hàm này cho cả route giá và form. Làm ở v1.0.x, không chặn.
- Trạng thái: Open → **Closed một phần** (SEC xác nhận 04/11, mục 8: route công khai dùng `isCalendarDate` ở `2760744b`; `assertLocalDate` dời v1.0.x – chấp nhận)

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

## 8. Xác nhận đóng thẻ + runbook r1.1 (04/11)

- Người review: SEC | Round 4 – gói LP-v2 – Bước: **Review (xác nhận đóng thẻ)** | 04/11/2026. Việc giao: G3 (phần SEC) và T1 (phần SEC) của `rounds/round-04/qc/lp-v2-merge-gate.md`.
- Phạm vi: `origin/lp-v2-main` @ `4fe85e19`. Đọc diff `ef2eb4ef` (FE-B), `2760744b` + `4fe85e19` (BE), `917a39cf` + `aad14baa` (OPS), biên bản ARC trên nhánh. Chỉ `git show`/`git diff`; không checkout, không sửa nhánh, không chạy test hay đột biến (việc của QA ở G2(a)). Không có bí mật, IP, digest đầy đủ hay dữ liệu khách trong mục này.
- Rà nhanh diff `917a39cf..origin/lp-v2-main` (6 tệp): không có khóa, webhook thật, digest `sha256:` đầy đủ, chuỗi 64 hex hay IP (chỉ `127.0.0.1` trong ghi chú máy kiểm của BE). gitleaks cho 3 commit này vẫn dựa vào CI PR (G1).

### 8.1 Đóng thẻ

| Thẻ | Bằng chứng | Kết luận |
|---|---|---|
| LPV2M-01 (Major) | `chat-message.ts` dòng 42: `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'`. SQL cổng giữ nguyên: `min(published_at) … WHERE version = $2` (hằng) và `published_at` của đúng (version, locale) của yêu cầu; `effectiveLevel` chặn khi `min_at` hoặc `req_at` NULL hoặc `req_at < min_at`. Không có phép so chữ `consent_version`. Chú thích nêu rõ `2026-10-31` không đăng riêng. Đủ 3 ca SEC đòi ở `gchat-notify`: (a) chỉ `2026-10-24` + `2026-11-04` → en và ko nhận C, `2026-10-24` nhận A; (b) `2026-10-31` đăng trước `2026-11-04` → A; (c) `2026-11-04` chưa đăng → A cho mọi yêu cầu. `env.production.example` và README 13.4 đã ghi "older than 2026-11-04 (the first published notice naming Google Chat)". ARC đã sửa câu P4 trong biên bản (mục 7) | **Closed** |
| LPV2M-02 (Minor) | `privacy.ts` dòng 60: `VERSION = '2026-11-04'`; khối "TEMPORARY LABEL" đã thay bằng chú thích đúng ý SEC; 3 chỗ test (`price-estimate.test.ts`, `form-live.landing.spec.ts`, `lp-v2.landing.spec.ts`) đổi sang `2026-11-04`. Không còn nhãn `2026-11-01` làm `consentVersion` trong mã chạy | **Closed**. Kéo theo FB-R4-SEC-FE-02 và ARC LPV2M-02 Done. Ghi nhận nhỏ: 3 ví dụ `consentVersion: '2026-11-01'` trong `openapi.yaml` (dòng ~9188–9219) chỉ là ví dụ tài liệu, ARC đổi ở lần chạm hợp đồng kế tiếp, không chặn |
| LPV2M-03 (Minor) | README 12.3 viết lại theo trạng thái thật: hiệu lực `2026-10-24` en/vi; bước (c) thấy `supersede version 2026-10-24 (en)`, `(vi)` rồi `OK: version 2026-11-04 published (en vi ko zh ru)`; quay lui landing in `2026-10-24`, mốc 7 ngày tính từ giờ `--apply`. Chú thích `publish-privacy-notice.sql` dòng 136–137 đúng. Runbook r1.1 có bảng D1–D7 và P1–P6 (P5 = hằng bằng nhãn đăng) | **Closed** |
| LPV2M-04 (Suggestion) | Biên bản ARC mục 4 bước 2 có ghi chú 04/11: dữ liệu giả không giống production, diễn tập staging dùng trạng thái `2026-10-24` | **Closed** |
| LPV2M-05 (Suggestion) | `isCalendarDate` (dựng lại ngày rồi so chuỗi) dùng cho route giá và cả `arrival`, `departure` của form (trước đây `departure` chỉ kiểm regex); có test. `assertLocalDate` để v1.0.x vì đổi ở đó sẽ biến ngày sai thành 500 trên API nội bộ | **Closed một phần**, phần còn lại chấp nhận dời v1.0.x |

### 8.2 Ca test BUG-R4-027 có đúng ý cổng ★2 không

**Có.** Ý của ★2 (thẻ 01, "bẫy ngược"): cổng đọc `published_at` của dòng mang nhãn bằng hằng, không so chữ version. Các ca mới kiểm đúng ý đó từ hai phía:
- `gchat-units` (4 ca, giả `min_at`/`req_at`): `2026-12-01` đăng **trước** hằng → A; `2026-11-04.1` và `2026-11-05` đã đăng, hằng chưa đăng (`min_at` NULL) → A; `2026-11-03` đăng **sau** hằng → C. Mỗi ca cho đáp án ngược nếu `effectiveLevel` bị "sửa" thành so chuỗi (`<` hay `>=`), nên đột biến ở mã TypeScript bị bắt. Ca A còn kiểm tin không chứa chữ của khách.
- `gchat-notify` (Postgres thật): đăng `2026-11-04.1` (5 ngôn ngữ) và `2026-11-05`, không đăng `2026-11-04`, mức C → cả 3 tin mức A, `levelCapped` 3, không có tên khách hay ngày đến. Ca này bắt đột biến ở SQL (`version >= $2`), thứ mà ca đơn vị không thấy vì ca đơn vị giả kết quả SQL.
- Ca "đăng cùng giao dịch" (`req_at = min_at`) vẫn ra C ở ca "after 2026-11-04 is published", nên đột biến `<=` cũng bị bắt.
- Gợi ý (không chặn, v1.0.x): thêm một khẳng định ở `gchat-units` rằng tham số `$2` của câu cổng đúng bằng hằng và `$3`/`$4` là `consent_version`/`locale` của yêu cầu. Hiện việc dùng sai tham số chỉ bị ca tích hợp bắt gián tiếp (ca "old-notice request stays A").
- SEC không tự chạy lại đột biến. Kết quả "5 đỏ + ca tích hợp đỏ" là của BE; QA chạy lại ở G2(a).

### 8.3 Kết luận G3 (phần SEC)

**ĐÓNG.** LPV2M-01, 02, 03 Closed; 04 Closed; 05 Closed một phần (phần còn lại dời có lý do). Ca test BUG-R4-027 đúng ý ★2. Phần ARC của G3 (đọc `2760744b`/`4fe85e19`) không thuộc SEC.

### 8.4 Runbook `lp-v2-release-runbook.md` r1.1 – T1 (phần SEC)

**Trả lời Q1 (SEC):** bảng P0 đủ và đúng nghĩa mục 4: đủ 7 dòng D1–D7 và 6 dòng P1–P6, cột "Ai" đúng, D7 không chặn phát hành mà chỉ chặn việc đặt mức C, K8 kiểm worker vẫn mức A. Chỉ có một chỗ sai chữ ở D1 (thẻ RB-01). Về D3: SEC **chấp nhận** "INV xác nhận trong chat ngày đăng" cho P3/P4, như lượt v1.0.1, với 3 điều kiện:
1. ORC ghi vào decision-log **trước P10**: giờ xác nhận; P3 = "phòng Chat thật chỉ có các vai OWN/MGR/FDL/FD, N thành viên, không SAL/CTV"; P4 = mục sổ tay WR8 do BA chỉ ra (đường dẫn + mục) và "lịch OWN có ngày xóa phòng Chat hằng năm". Không ghi tên, email hay số điện thoại thành viên.
2. "Ngày đăng" là ngày chạy P10. P10 trễ sang ngày khác thì phải xác nhận lại.
3. Thiếu một xác nhận thì ô đó là `CHUA`, và theo P0 phải dừng.

**Ý kiến SEC cho Q2, Q3 (ARC quyết):**
- Q2: SEC ủng hộ **giữ** bước quay landing trước khi lùi app. Về dữ liệu thì không có rủi ro lộ dữ liệu: v1.0.3 neo cổng Chat ở `2026-10-31` (chưa đăng), nên mọi tin về mức A. Nhưng nếu để landing LP-v2 đứng trước api v1.0.3, khách ko/zh sẽ điền xong dữ liệu cá nhân rồi bị từ chối. Thứ tự hiện tại thì hỏng sạch hơn: không có form ko/zh để điền.
- Q3: về phía SEC, `LIKE` là đủ. Mục đích là chứng minh CHECK có `ko`/`zh`. CHECK bị mất thì thiếu dòng, nên vẫn lộ ra. SEC không cần so nguyên văn.

**Thẻ runbook (OPS):**

### FB-R4-SEC-OPS-LPV2RB-01
- Mức độ: Minor
- Vị trí: runbook r1.1 mục 4 P0, bảng D1–D7, dòng D1, cột "Bước kiểm trong runbook" ("0.2 bước 3 (hai số `1`), lượt CI PR")
- Vấn đề: r1.1 đã bỏ hai lệnh grep in `1` ở 0.2 bước 3 (thay bằng `CHKV`). Cột này giờ trỏ vào một kết quả không còn tồn tại, nên người điền D1 không biết dựa vào đâu.
- Vì sao quan trọng: D1 là ô chặn. Căn cứ mơ hồ thì dễ điền `CO` sai.
- Đề xuất sửa: "Thẻ 01–03 Closed: `SEC-on-lp-v2-main.md` mục 8.1. CI PR: số run + `headSha` = đầu PR (QC G1) trong decision-log."
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2RB-02
- Mức độ: Minor
- Vị trí: runbook r1.1 dòng "Sửa r1.1", mục 0 "Nhãn thông báo", 0.1 `⟨NOTICE_V⟩`, `CHKV`, 5.2 bước 4(a); README 12.3 (gạch đầu dòng "Đổi nhãn thì phải đổi cả hằng…"); chú thích `privacy.ts` dòng 58–59
- Vấn đề: quy tắc "đổi nhãn thì đổi hằng, `CHKV` đòi hằng = nhãn đăng" chỉ đúng **trước lần đăng đầu tiên** của một thông báo nêu Google Chat (lượt LP-v2 này). Cổng so theo `published_at`, nên khi `2026-11-04` đã đăng, một nhãn sau đó (`2026-11-04.1`) đăng muộn hơn sẽ tự qua cổng mà không cần đổi hằng. Nếu cứ làm theo quy tắc mà đổi hằng thành `2026-11-04.1`, mọi yêu cầu đã gửi theo `2026-11-04` (đã nêu Chat) sẽ bị hạ xuống A. Ngoài ra, ở 5.2 bước 4(a) (lên lại LP-v2 với nhãn mới sau khi quay lui), `CHKV` sẽ in `KHONG` và chặn việc đăng, hoặc buộc đội Release api không cần thiết. Lỗi này vẫn fail-closed, không lộ dữ liệu.
- Vì sao quan trọng: mỗi lần đổi chữ thông báo sau này sẽ tốn thêm một lần Release api, và đường quay lui 5.2(a) bị chặn ngoài ý muốn đúng lúc đang có sự cố.
- Đề xuất sửa:
  - Runbook r2 (chỉ `rounds/`, không đổi đầu PR): ghi rõ "hằng = nhãn đăng **chỉ** khi trên DB đích chưa có dòng nào của hằng (lần đăng đầu nêu Google Chat)". Khi DB đã có dòng `2026-11-04` (K4), `CHKV` cho lượt đó so `CHAT_CONST = 2026-11-04` và `LANDING_VERSION = ⟨NOTICE_V⟩`, kèm điều kiện `⟨NOTICE_V⟩` > `2026-11-04`. SEC vẫn xem chữ mới (GCHAT-03: chữ mới bỏ Google Chat khỏi bên nhận thì hạ mức trước khi đăng). Sửa 5.2 bước 4(a) theo đó.
  - README 12.3 và chú thích `privacy.ts`: dùng cùng cách nói, sửa ở lần chạm tệp kế tiếp (v1.0.4) để không đổi đầu PR (G1/G2).
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2RB-03
- Mức độ: Minor
- Vị trí: runbook r1.1 P10 bước 0 (`RA` = "tag app đang chạy"), D2
- Vấn đề: `CHKV` đọc mã ở một ref git do ORC gõ tay. D2 thì hỏi về **bản api đang chạy**. Chưa có bước nối ref đó với `state/current_tag` của production. Ở đường phụ 1.2, hoặc khi có hotfix chen vào giữa, ORC có thể gõ nhầm tag.
- Vì sao quan trọng: D2 có thể ra `CO` cho một tag không phải bản đang chạy. Hậu quả vẫn fail-closed (Chat giữ mức A), nhưng D2 khi đó không còn là bằng chứng thật.
- Đề xuất sửa: thêm vào P10 bước 0 phép so `sha-$(git rev-parse --short=12 "$RA^{commit}")` với `current=` ở K1, đọc trong cùng phiên. Lệch thì `KHONG`. Làm tương tự ở P4, so `RA` với `⟨TAG_L⟩`.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2RB-04
- Mức độ: Suggestion
- Vị trí: runbook r1.1 bảng P1–P6 dòng P1 (đã điền sẵn `CO`); bảng staging S0
- Vấn đề: (a) K1 đạt ngày 03/11 chỉ còn giá trị khi phòng Chat và webhook không đổi (README 13.5). (b) S6 gửi nhiều yêu cầu thử trên staging, mỗi yêu cầu tạo một tin Chat. Quy tắc README là staging chỉ nối phòng THỬ hoặc để rỗng.
- Đề xuất sửa: (a) P1 ghi "CO nếu phòng Chat/webhook không đổi từ 03/11, nếu đổi thì `CHUA` và làm lại K1". (b) S0 thêm một dòng: ORC xác nhận webhook staging là phòng thử hoặc rỗng (chỉ hỏi có/không, không in URL).
- Trạng thái: Open

**Kết luận T1 (phần SEC): ĐẠT CÓ ĐIỀU KIỆN.** **Không có điểm phải sửa trước staging.** 0.2 bước 5 và S0–S8 chạy được với r1.1, vì `CHKV` đúng cho lần đăng đầu, và staging chưa có dòng `2026-11-04`, việc này S0 có kiểm. Trước P0 production, OPS ra r2 sửa RB-01, RB-02 (phần runbook) và RB-03. RB-04 tùy OPS. Phần README/`privacy.ts` của RB-02 sửa ở v1.0.4, không chặn. Khi r2 có, OPS sửa dòng "Trạng thái" của runbook thành "SEC đã đọc 04/11", và SEC chỉ cần đọc phần thay đổi.

### 8.5 Dòng decision-log đề xuất (ORC ghi)

| 2026-11-04 | 4 | **SEC – xác nhận đóng thẻ `lp-v2-main` (G3 phần SEC: ĐÓNG) + đọc runbook LP-v2 r1.1 (T1 phần SEC: ĐẠT CÓ ĐIỀU KIỆN)** (`rounds/round-04/reviews/SEC-on-lp-v2-main.md` mục 8). LPV2M-01 (hằng Chat `2026-11-04`, cổng theo `published_at`, 3 ca a/b/c), 02 (`VERSION` + 3 test), 03 (README 12.3 + runbook P0), 04 Closed; 05 Closed một phần (`assertLocalDate` v1.0.x). Ca BUG-R4-027 đúng ý ★2 (ca đơn vị bắt so chuỗi, ca tích hợp bắt `version >= $2`). Runbook: Q1 bảng P0 đủ; D3 chấp nhận INV xác nhận P3/P4 trong chat ngày đăng, ghi decision-log trước P10, không tên/email. Không có điểm phải sửa trước staging; r2 trước P0 production sửa RB-01 (D1 trỏ sai), RB-02 (quy tắc "đổi nhãn → đổi hằng" chỉ áp cho lần đăng đầu nêu Chat), RB-03 (nối ref `CHKV` với `current_tag`) | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật, chữ/nhãn thông báo) |

## 9. Đọc r2 (04/11)

- Người review: SEC | Round 4, gói LP-v2, bước **Review** | 04/11/2026.
- Phạm vi: `git diff origin/lp-v2-main origin/lp-v2-ops-runbook-r2` (4e0843e0, 1 tệp `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md`).
- Cách làm: chỉ đọc. Đối chiếu `chat-message.ts` dòng 67–70, `publish-privacy-notice.sql` dòng 116 và 136–142, `Caddyfile.landing`, `init-secrets.sh --set-booking-chat` trên nhánh.
- Diff không có bí mật, IP, URL webhook hay digest đầy đủ. `HASH_0092` là băm tệp SQL, không phải bí mật.

### 9.1 Đóng thẻ r1.1

| Thẻ | Bằng chứng trong r2 | Kết luận |
|---|---|---|
| LPV2RB-01 (Minor) | Ô D1: "Thẻ 01–03 Closed: SEC mục 8.1. CI PR: số run + `headSha` = đầu PR (QC G1) trong decision-log" | **Closed** |
| LPV2RB-02 (Minor) | Mục 0 "Nhãn thông báo" có hai trường hợp (a) DB chưa có dòng của hằng, (b) đã có. 0.1, P5, 5.2 bước 4(a) sửa theo. `CHKV` đọc `CONST_ROWS` (chỉ cột `version`, giao dịch chỉ đọc) rồi chọn luật | **Closed (phần runbook).** README 12.3 + chú thích `privacy.ts` dời v1.0.4 |
| LPV2RB-03 (Minor) | `CHKV` so `RA_IMAGE` với `RUN`; S4/P10 `RUN=DOC` đọc `state/current_tag` trong cùng lệnh; P4 so với `⟨TAG_L⟩`; lỗi SSH → `KHONG`. Ở 0.2 luôn khớp (vô hại), bằng chứng thật ở P4/P10 | **Closed** |
| LPV2RB-04 (Suggestion) | P1 bỏ `CO` điền sẵn; thêm S0b đọc kích thước và so byte, không in URL; tệp rỗng do `init-secrets.sh` ghi có kích thước 0 | **Closed** (điểm nhỏ ở RB-07) |

D3: r2 chép đủ 3 điều kiện mục 8.4 Q1.

### 9.2 Luật `CONST_ROWS≥1` có đúng ý RB-02 không

**Có.**
1. Cổng thật (`chat-message.ts` dòng 68) là `min(published_at) … WHERE organization_id = $1 AND version = $2`, không lọc `superseded_at`, nên khi hằng đã có dòng thì `min_at` cố định; nhãn đăng sau có `req_at > min_at` nên qua cổng. Không đổi hằng là đúng; `CONST_ROWS` đếm cả dòng đã bị thay thế, khớp cổng.
2. Ca "bằng hằng": SQL in `already present`, không ghi gì.
3. Phép "xếp sau" chỉ là lớp an toàn thêm; SQL vẫn từ chối nhãn cũ hơn nhãn đang hiệu lực. Đã thử `LC_ALL=C sort -C -u`: `.1` và `2026-11-05` rc 0; `2026-11-03` rc 1; bằng nhau rc 1 (có nhánh `V = C` riêng).
4. Mọi chỗ lệch nghiêng về an toàn: đọc rỗng → `CONST_ROWS=0` (luật chặt hơn); thứ tự byte khác khóa SQL chỉ khi hằng có hậu tố → `KHONG` (RB-08).
5. Giới hạn: luật không thay việc SEC xem chữ (RB-05); `CHKV` không phát hiện hằng bị dời sau lần đăng đầu nêu Chat (an toàn dữ liệu, lỗi vận hành) – README v1.0.4 ghi "sau lần đăng đầu nêu Google Chat, không đổi hằng trừ khi SEC yêu cầu".

### 9.3 5.4 bước 2 dưới góc bảo mật

**Không có rủi ro lộ dữ liệu.**
- (i) Trước mốc 7 ngày: landing cũ hiện `2026-10-24` (không nêu Chat); v1.0.3 neo hằng `2026-10-31` (chưa đăng) nên Chat ở mức A, khớp chữ khách thấy. 7 ngày tính từ giờ `--apply` ở P10.
- (ii) Quá mốc: `Caddyfile.landing` chỉ mở 3 route công khai khi `LANDING_PUBLIC_API=on`; CSP `connect-src 'self'`; CI `check-caddy-landing.sh` kiểm `off` → 404. Đóng proxy (bước 2) trước `rollback.sh` (bước 3) giữ bất biến.
- Yêu cầu theo `2026-11-04` sau khi lùi về v1.0.3 ra mức A (an toàn).

### 9.4 Thẻ mới (r2)

#### FB-R4-SEC-OPS-LPV2RB-05
- Mức độ: Minor
- Vị trí: mục 0 "Nhãn thông báo" (b); 5.2 bước 4(a); mục 7 (không có dòng 5.2)
- Vấn đề: theo luật (b) nhãn mới tự qua cổng Chat ở mức đang đặt. Bước duy nhất chặn "chữ mới bỏ Google Chat khỏi bên nhận" là SEC xem chữ (GCHAT-03), nhưng r2 chỉ nhắc trong lời văn: không phải điều kiện dừng, không có bằng chứng, `CHKV` vẫn ra `CO`.
- Vì sao quan trọng: nếu sót, tên khách và ngày đến vào Google Chat theo thông báo không nêu Google Chat (NĐ 13/2023).
- Đề xuất: 5.2 bước 4(a) trước `CHKV`: "**Dừng nếu** decision-log chưa có dòng SEC duyệt chữ `⟨NOTICE_V⟩` mới, ghi rõ 'Google Chat vẫn là bên nhận' hoặc 'đã hạ mức Chat về A theo README 13.4'". Thêm dòng 5.2 vào mục 7. Đưa ý này vào README 12.3 ở v1.0.4.
- Trạng thái: Open

#### FB-R4-SEC-OPS-LPV2RB-06
- Mức độ: Minor
- Vị trí: 5.4 bước 2 gạch cuối ("Chỉ mở lại form … hoặc sau khi đã chọn 5.2 bước 4 (a)/(b)"); 5.4 bước 4 (K5); chỗ nối 5.4(i) với 5.2 bước 4
- Vấn đề: (1) câu mở lại form không đòi api là LP-v2 – khi api còn v1.0.3 sẽ ra cặp bất biến ARC cấm; "mở lại sau khi chọn (b)" tự mâu thuẫn. (2) Nhánh (i) tới mốc 7 ngày mà app vẫn v1.0.3: 5.2(a) phạm bất biến. (3) K5 không nói kỳ vọng theo nhánh.
- Đề xuất: (1) "Chỉ mở lại proxy khi K1 cho thấy api là LP-v2 (`current=⟨TAG_L⟩` hoặc mới hơn) và `LANDING_LOCALES` đã về 5 ngôn ngữ (F1)". (2) Thêm vào (i): "Tới mốc 7 ngày mà app vẫn v1.0.3: chỉ làm 5.2 bước 4(b); 5.2 bước 4(a) chỉ sau khi app LP-v2 đã lên lại." (3) "K5: nhánh (i) `form_token=200`; nhánh (ii) `form_token=404` HTML."
- Trạng thái: Open

#### FB-R4-SEC-OPS-LPV2RB-07
- Mức độ: Suggestion
- Vị trí: S0b (lệnh `cmp`)
- Vấn đề: `if sudo -n cmp -s A B; … else SAME=0` gộp "khác nhau" (rc 1) với "chưa so được" (rc 2 / sudo từ chối).
- Đề xuất: `sudo -n cmp -s A B; echo "STG_SAME_AS_PROD_RC=$?"` – 0 trùng → dừng; 1 khác; khác = `ERR`, chỉ còn câu hỏi INV.
- Trạng thái: Open

#### FB-R4-SEC-OPS-LPV2RB-08
- Mức độ: Suggestion
- Vị trí: khối `CHKV` (mục 2)
- Vấn đề: (a) "xếp sau theo byte" khác khóa của `publish-privacy-notice.sql` khi hằng có hậu tố (lệch an toàn). (b) Dòng in không có `E` và số dòng đọc được.
- Đề xuất: in `ENV=$E ROWS=<n>`; production `ROWS=0` → `KHONG`; ghi "hằng không mang hậu tố" hoặc dùng cùng khóa SQL.
- Trạng thái: Open

### 9.5 Kết luận

r2 **ĐẠT CÓ ĐIỀU KIỆN**. RB-01, 03, 04 Closed; RB-02 Closed phần runbook. Không chặn staging. Trước P0 production: r2.1 sửa RB-05/06, hoặc ORC chép hai quy tắc vào biên bản P0. RB-07/08 tùy OPS. Khi có r2.1, SEC chỉ đọc phần thay đổi.
