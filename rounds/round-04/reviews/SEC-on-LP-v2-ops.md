# SEC review hạ tầng LP-v2 – nhánh `lp-v2-ops`

- Người review: SEC (kiêm ý kiến ARC cho 3 điểm OPS hỏi – mục 2) | Round 4 – gói LP-v2 – Bước: Review chéo | Ngày 01/11/2026
- Phạm vi: commit `74e23925` (`git show 74e23925`; nền `8363650c`), báo cáo `rounds/round-04/outputs/OPS/lp-v2-ops.md` trên nhánh đó. Lúc review, `origin/lp-v2` đã gộp nhánh này (`83c13990`), nên SEC đọc theo commit chứ không theo `lp-v2...lp-v2-ops`. Đối chiếu thêm: `origin/lp-v2` cho migration BE (`0091_lp_v2_price_estimate_locales.sql`), `i18n.ts`/`langs.ts` của FE, `parameter.service.ts` và `price-estimate.service.ts` của BE.
- Đối chiếu yêu cầu: SR-LC-04/05/06, SR-PE-10/16 (`outputs/SEC/lp-v2-privacy-and-api.md`), điều kiện C4, C5, C6, C9 (`reviews/SEC-on-LP-v2-code.md` mục 4).
- Đọc mã và test. Không chạy test, không sửa mã, không commit. Không có dữ liệu khách thật, khóa hay URL bí mật trong tệp này.

## 0. Kết luận

**Đạt có điều kiện nhẹ.** Không có Blocker, không có Major. Phần OPS của C4, C5, C6, C9 đạt. Có 4 Minor và 3 Suggestion. Không thẻ nào chặn bước (a)–(f) của README 12.3 LP-v2. FB-R4-SEC-OPS-LPV2-01 (số migration) nên sửa trước khi bundle `infra/` lên staging, để người vận hành không bị nhầm với PN-01.

| Điều kiện | Kết quả | Bằng chứng chính |
|---|---|---|
| C4 – Caddy (SR-PE-10, SR-LC-06) | **Đạt** | Một matcher `@public_price_estimate`: `method GET`, `path_regexp ^/v1/public/properties/[a-z0-9-]{2,40}/price-estimate$`, cùng biểu thức `LANDING_PUBLIC_API == "on"`, query ≤ 256. Test 38/38 có: 200 kèm query; `X-Forwarded-For` của khách bị thay; query 256 qua, 257 → 404; POST, HEAD, đường con, slug hoa, `price-estimates`, slug 1 ký tự → 404 và **không tới api** (đếm log stub); `off` → 404; `/availability`, `/offers` vẫn 404 (ca cũ dòng 135). Log truy cập vẫn che query (`?[q]`). Chỗ cần sửa: query đếm theo ký tự, không theo byte (LPV2-03). |
| C5 – publish + deploy N ngôn ngữ (SR-LC-04/05) | **Đạt** | Mục 1.1–1.2. Danh sách lấy từ image, so với hreflang. Version lấy từ đúng một thẻ meta, có so `data-notice-version` và `data-consent-version` của trang chủ từng ngôn ngữ. Băm được kiểm khác nhau từng đôi ở cả wrapper lẫn SQL. Mọi ngôn ngữ ghi trong một giao dịch, supersede theo từng ngôn ngữ, audit có `locales` và `hashes`. Thiếu trang → từ chối cả lượt. Test có ca 5 ngôn ngữ, thiếu `ru`, trùng băm, thiếu meta. |
| C6 – `LANDING_LOCALES` vào api | **Đạt** | `x-api-env`: `LANDING_LOCALES: ${LANDING_LOCALES:-en,vi}`. `check-compose.sh` bắt thiếu biến, mã lạ, lặp, thiếu en/vi. Hai env mẫu để `en,vi`. |
| C9 – cảnh báo (SR-PE-16, Should) | **Đạt, 1 Minor** | `pricelimit` ≥ 200 lần 429/503 trong 60 phút, đúng "200/giờ". `priceswitch` đọc từ audit. Câu cảnh báo cố định, chỉ có số đếm và `true`/`false`; test 1b và 5b kiểm webhook và tệp state không mang đường dẫn, slug, IP, mã căn. Một lần đổi thứ hai trong cùng lượt FAIL có thể không có webhook riêng (LPV2-04). |

Các điều kiện khác vẫn như cũ, ngoài phạm vi OPS: C1, C2 (đã có commit sửa trên `lp-v2`, SEC chưa duyệt lại trong tệp này), C3 (nhãn version thật), C7 (nhánh Google Chat), C8 (QA trên staging qua Caddy thật).

## 1. Đối chiếu chi tiết

### 1.1 `publish-privacy-notice.sql` (SR-LC-04)
- **Biến danh sách.** `locales`, `shas`, `required` đi qua `:'var'` → `set_config` → `string_to_array`. Không ghép chuỗi vào SQL. Sau khi tách, từng phần tử được kiểm regex: mã ngôn ngữ trong `en|vi|ko|zh|ru` và không lặp, băm đúng 64 hex, số ngôn ngữ = số băm và ≤ 5. Danh sách rỗng (`''` → `{}`) bị từ chối. **Đạt.**
- **Khác nhau từng đôi.** `count(DISTINCT h) <> cardinality` → từ chối (dòng 80–82). Wrapper kiểm thêm bằng `uniq -d`. Lượt sau thêm ngôn ngữ mới cho cùng version vẫn gửi đủ danh sách của image, nên cặp cũ–mới cũng được so. **Đạt.**
- **`required ⊆ locales`** (dòng 83). Sau khi ghi còn kiểm lại readiness theo `required`. **Đạt.**
- **CHECK của migration.** Đọc `pg_get_constraintdef` của `privacy_notice_version_locale_check` rồi tìm `'ko'`/`'zh'`. Migration LP-v2 của BE (**0091** trên `lp-v2`) xóa rồi tạo lại ràng buộc **cùng tên** với `IN ('vi','en','ru','ko','zh')`, nên cách dò đúng với 0091. Nếu tên ràng buộc đổi, `v_check` là NULL, bước dò bị bỏ qua, và INSERT vẫn bị ràng buộc chặn. Kết quả vẫn là từ chối, không ghi gì. Test 21 cũng dò theo nội dung CHECK, không theo số migration. Logic **đạt**. Chỉ phần chữ ghi `0090` là sai (LPV2-01).
- **Một giao dịch, chỉ thêm dòng.** Kiểm mọi ngôn ngữ trước khi ghi. Chỉ INSERT. Chỉ đặt `superseded_at` của dòng đang NULL. Không UPDATE nội dung, không DELETE. Cách ghi này khớp trigger PN-01 sắp có (từ chối UPDATE trừ `superseded_at` NULL → giá trị). Xem LPV2-S2.
- **Không quay lui.** Một version mới hơn đang hiệu lực chặn việc đăng version cũ, theo từng ngôn ngữ. Đúng thiết kế FB-R4-SEC-FE-02 phía DB.
- **Audit.** `security` / `privacy_notice.published`, `after` gồm `locales`, `hashes {xx: sha}`, `shaVi`/`shaEn`, tag, digest, `superseded`. `reason` chỉ có mã nhân viên. Chạy thử không ghi audit. Không có dữ liệu cá nhân. **Đạt.**
- **Vai DB.** `ottimo_migrator` → `SET LOCAL ROLE ottimo_owner`, từ chối superuser, đặt ngữ cảnh tổ chức để FORCE RLS có hiệu lực, `lock_timeout` 5 s. Giữ nguyên như bản đã duyệt ở R3.

### 1.2 `publish-privacy-notice.sh` và `deploy-landing.sh` (SR-LC-04/05)
- Wrapper lấy danh sách trang bằng glob trong container. Mã lạ (ví dụ `ja/privacy/`) → từ chối cả lượt. Đường dẫn `cat`/`sha256sum` dựng từ mã đã qua whitelist, nên không có traversal.
- Đủ chuỗi kiểm: digest của container đang chạy → băm trong container = bản chép ra = trang thật qua edge (chứng chỉ thật trên production, không cho `SMOKE_INSECURE`/`SMOKE_ADDR`). Giữ khóa `landing.lock` giữa lúc băm và lúc ghi.
- Đọc mật khẩu xem trước của staging qua `--config <(…)`, không đưa lên dòng lệnh. Log chỉ có mã nhân viên, tag, digest, băm.
- `deploy-landing.sh`: bất biến FB-01 được mở rộng cho từng `(version, locale)`. Luật "version cũ hơn → FAIL" và "ngôn ngữ đang bán thiếu trang → FAIL" chỉ thành WARNING khi chạy `--rollback` hoặc khi proxy tắt. `--rollback` chỉ đưa về `landing_previous_tag`, không chọn được image bất kỳ, nên lối đi này hẹp. Cùng version mà khác byte vẫn FAIL với `--rollback`. **Đạt.** Còn hai khe nhỏ (LPV2-02).
- `verkey` (bash) và `v_ver_key` (SQL) xếp thứ tự giống nhau, kể cả hậu tố `.N`. Xem LPV2-S1 về `.1` và `.01`.

### 1.3 Caddy (SR-PE-10, SR-LC-06)
- Chỉ đúng một route mới. Thứ tự `handle`: `@public_price_estimate` đứng trước `@closed`, mọi `/v1/*` khác vẫn 404. Bỏ `/ru` khỏi `@closed`. Ngôn ngữ không có trong image không có tệp, nên trả 404.
- `X-Forwarded-For`: Caddy không khai `trusted_proxies`, nên bỏ giá trị khách gửi và đặt địa chỉ nhận qua PROXY protocol. Test có ca giả `203.0.113.66`. Api chỉ tin `LANDING_IP` (check-compose kiểm). **Đạt.** Ca 6 của C8 (QA trên staging) vẫn cần, vì test CI dùng api giả.
- 404 theo ngôn ngữ: `{re.lang404.1}` chỉ nhận từ danh sách `vi|ko|zh|ru`, nên không có traversal. Trang lỗi vẫn có `landing_headers` và `no-store`.

### 1.4 `ops-check` (SR-PE-16, C9)
- **Câu cảnh báo không mang dữ liệu.** `pricelimit` chỉ gửi số lần. `pricegap` chỉ gửi số căn, và mã căn chỉ dùng trong `sort -u | grep -c` rồi bỏ. `priceswitch` gửi số lần và `true`/`false`. Giá trị khác `true`/`false` thành `other`, nên chuỗi tự do trong `after` không lọt ra. Webhook nhận đúng câu đó (test 1b, 5b, 7). **Đạt.**
- **Ngưỡng.** `PRICE_REFUSED_MAX` mặc định 200, cửa sổ 60 phút, đếm 429 + 503 của đúng route giá (regex `uri` có cả trường hợp query đã che). Đúng SR-PE-16. Timer 30 phút và cửa sổ 60 phút chồng nhau, nên có thể báo hai lượt liền cho một đợt. Chấp nhận được.
- `http5xx` bỏ 503 của route giá nhưng vẫn đếm 502/500 của route đó. Hợp lý: bulkhead trả 503 là thiết kế (SR-PE-08).
- G4 khớp mã BE: `parameter.service.ts` ghi `after.value` là boolean JSON, nên `after->>'value'` ra `true`/`false`. Dạng `cancelledEffectiveFrom` (hủy lịch đổi) ra `other`. Chấp nhận.
- Định dạng log `public_price_missing … room=<uuid> …` của BE khớp fixture của test.

## 2. Ý kiến cho các điểm OPS hỏi ARC

Ghi chú: **ý kiến SEC thay ARC, ARC xác nhận sau** cho mục 2.3. Mục 2.1 và 2.2 SEC kết luận về mặt bảo mật. ARC xác nhận về thiết kế nếu muốn.

### 2.1 G1 – danh sách ngôn ngữ để đăng lấy từ image, không từ `LANDING_LOCALES` → **Đồng ý**
- Về bảo mật, cách này **chặt hơn** cách cũ. Mọi trang privacy đang phục vụ công khai (cũng là mọi form có thể gửi đồng ý) đều có dòng `(version, locale, sha)` trong DB. Đăng theo `LANDING_LOCALES` thì ở bước (c) của README, khi biến còn `en,vi`, ko/zh/ru sẽ không được ghi.
- `LANDING_LOCALES ⊆ ngôn ngữ của image` được kiểm ở cả wrapper lẫn SQL (`required <@ locales`). Như vậy api không thể bán một ngôn ngữ chưa có thông báo đã đăng.
- Thay đổi so với chữ của SR-LC-04 ("manifest/`LANDING_LOCALES`"): SEC chấp nhận, ghi lệch **SR-LC-04 (L-OPS-1)**: nguồn danh sách = image; `LANDING_LOCALES` là điều kiện tối thiểu.

### 2.2 G2 – hreflang của `/privacy/` làm manifest → **Đồng ý, kèm Suggestion LPV2-S3**
- FE sinh hreflang từ `alternatesFor()` → `LANGS` (`en, vi, ko, zh, ru`). Giá trị hreflang là mã 2 chữ (`zh`, không phải `zh-Hans`; `zh-Hans` chỉ có ở `<html lang>`). Vì vậy regex `hreflang="[a-z]{2}"` của OPS khớp, và `x-default` bị bỏ đúng.
- Danh sách hreflang và danh sách trang cùng sinh từ `LANGS`, nên phép so chỉ bắt được **bản dựng hỏng** (thiếu hoặc thừa trang). Đó chính là điều SR-LC-04 cần ("thiếu một locale có trong manifest → từ chối"). Tệp `privacy-manifest.json` riêng cũng sinh từ `LANGS`, nên không chặt hơn. **Không cần FE thêm tệp.**
- Nếu FE sau này đổi hreflang sang `zh-Hans`, regex không còn khớp, manifest lệch và công cụ từ chối. Đây là thất bại an toàn, không phải lỗ hổng.
- Khe còn lại: bản dựng không có hreflang thì bỏ qua phép so. Xem LPV2-S3.
- Ghi lệch **SR-LC-04 (L-OPS-2)**: manifest = hreflang của `/privacy/` + dist-check của FE (hreflang hai chiều).

### 2.3 Trang 404 tiếng Anh dự phòng → **Đồng ý** (ý kiến SEC thay ARC, ARC xác nhận sau)
- Chỉ xảy ra khi image không có `/<xx>/404/index.html`, tức bản dựng cũ hoặc tiền tố lạ. Trang 404 tiếng Anh không có dữ liệu, vẫn có header bảo mật và `no-store`, mã trả về vẫn 404 (test kiểm). Không lộ thông tin, không có traversal.
- Về kỹ thuật: `try_files` trong `handle_errors` là cách đơn giản và đúng. Với bản LP-v2 (có `pages/[lang]/404.astro` cho mọi ngôn ngữ), nhánh dự phòng thực tế chỉ dùng cho `/ja/x`, `/x`, hoặc khi `--rollback` về bản cũ.

### 2.4 Hai luật mới của `deploy-landing.sh` → **Đồng ý**
- "Version cũ hơn bản đã đăng → FAIL, trừ `--rollback`" đóng phần OPS của FB-R4-SEC-FE-02. Lớp DB (SQL từ chối version cũ khi bản mới đang hiệu lực) là lớp chính. Bước deploy chặn sớm hơn, trước khi đổi container. SEC đổi FE-02 sang **Fixed (phần OPS)**. Phần FE (nhãn thật) vẫn theo C3.
- "Ngôn ngữ đang bán thiếu trang → FAIL, trừ `--rollback`" đúng hướng. Nếu không chặn, api nhận form ko/zh/ru mà trang thông báo của ngôn ngữ đó đã biến mất.
- `--rollback` chỉ cảnh báo: chấp nhận, vì đường quay lui đã ghi ở README (đặt `LANDING_LOCALES=en,vi` **trước**), và bản cũ còn được nhận 7 ngày theo thiết kế ARC 3.6 (5). Trong 7 ngày đó khách đồng ý với văn bản `2026-10-31` (đúng băm đã đăng, dòng vẫn còn). Bằng chứng "khách đồng ý với văn bản nào" không bị sai.

## 3. Thẻ

### FB-R4-SEC-OPS-LPV2-01
- Mức độ: Minor
- Vị trí: `product/infra/server/README.md` dòng 249; `infra/server/bin/publish-privacy-notice.sh` dòng 120 (cả "OpenAPI 0.3.9"); `infra/server/publish-privacy-notice.sql` dòng 93; `infra/server/test/publish-privacy-notice.test.sh` dòng 13, 14, 190, 192, 194, 195; `rounds/round-04/outputs/OPS/lp-v2-ops.md` (mục 2, 5, 7, 8)
- Vấn đề: tài liệu và test ghi migration LP-v2 là **0090**. BE đã đổi thành **0091** (`0091_lp_v2_price_estimate_locales.sql`, `6ae46d4a`). Số **0090 được giữ cho PN-01** (trigger chỉ-thêm-dòng của chính bảng `privacy_notice_version`, decision-log 30/10). Logic không sai: SQL và test dò theo nội dung CHECK, câu từ chối của SQL không nêu số.
- Vì sao quan trọng: khi PN-01 lên trước, người vận hành đọc "DB chưa có migration LP-v2 (0090)" rồi thấy 0090 đã có trong journal có thể kết luận nhầm rằng api đã có migration LP-v2. Lúc đó họ sẽ đi thẳng sang bước (c) và nhận câu từ chối khó hiểu, hoặc ngược lại. Trên một bảng làm căn cứ pháp lý, tài liệu vận hành phải đúng tên.
- Đề xuất sửa: thay "0090" bằng "0091 (`0091_lp_v2_price_estimate_locales`)" ở các vị trí trên. Trong README nên ghi theo tên tệp, không chỉ theo số, vì ARC có luật "migration lên main sau lấy số kế tiếp" nên số còn có thể đổi khi gộp. Đổi "OpenAPI 0.3.9" thành 0.3.10. Câu `ok`/`ko` của test 21 đổi theo. Không cần đổi logic.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2-02
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/deploy-landing.sh`, `privacy_check()` – nhánh `WARNING: privacy $loc: no single notice version on the page` và vòng `for l in $(envval LANDING_LOCALES …)`
- Vấn đề:
  1. Khi proxy mở và **không** `--rollback`, một trang privacy không đọc được version (ko/zh/ru thiếu thẻ meta, hoặc hai thẻ) chỉ sinh WARNING rồi `continue`. Kết quả: trang đó **không được so băm** với bản đã đăng. Ví dụ: ko đã đăng V2 với băm H; bản dựng mới mất thẻ meta trên `/ko/privacy/` nhưng đổi chữ, trong khi form ko vẫn gửi `consentVersion=V2`. Deploy vẫn qua, khách ko đồng ý "V2" trên một văn bản khác H. `publish-privacy-notice` từ chối, nhưng không gì buộc chạy lại nó, vì V2 đã "published". Đây là bất biến FB-01. Dist-check của FE (`dist.test.ts` kiểm thẻ meta) là lớp chặn chính, nên chỉ Minor.
  2. `LANDING_LOCALES` không đặt → không kiểm "thiếu trang". Api thì mặc định `en,vi`, và `publish-privacy-notice.sh` cũng mặc định `en,vi`. Hai công cụ lệch nhau.
- Vì sao quan trọng: `deploy-landing` là lớp duy nhất chạy ở **mọi** lần phát hành landing. `publish` chỉ chạy khi có version mới.
- Đề xuất sửa: (1) khi `proxy_on=1` và `rollback=0`, trang không có đúng một version → FAIL (giống ca "cùng version khác byte"). Với `--rollback` hoặc proxy tắt thì giữ WARNING. Thêm 1 ca test (ko thiếu meta, proxy on → FAIL). (2) dùng `ll=$(envval LANDING_LOCALES); ll=${ll:-en,vi}` như wrapper publish.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2-03
- Mức độ: Minor
- Vị trí: `product/infra/caddy/Caddyfile.landing`, `@public_price_estimate` – `{http.request.uri.query}.matches('^[^#]{0,256}$')`
- Vấn đề: regex của CEL đếm **ký tự** (code point), không đếm byte. Một client tự viết có thể gửi byte UTF-8 thô trong query, vì Go chỉ từ chối ký tự điều khiển. Khi đó 256 ký tự 3 byte = 768 byte vẫn tới api. SR-PE-03/10 ghi "≤ 256 byte". Api tự từ chối > 256 byte (422), nên đây là lớp phòng thủ thứ hai, không phải lỗ hở.
- Vì sao quan trọng: mục đích của giới hạn ở Caddy là không để truy vấn bất thường tới api (bulkhead 2). Trình duyệt luôn mã hóa query thành ASCII (`%xx`), nên siết lại không ảnh hưởng khách thật.
- Đề xuất sửa: `.matches('^[!-~]{0,256}$')` (chỉ ASCII in được, không khoảng trắng, không ký tự điều khiển). Khi đó số ký tự bằng số byte. Thêm 1 ca test: query có byte UTF-8 thô → 404.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2-04
- Mức độ: Minor
- Vị trí: `product/infra/server/bin/ops-check.sh` – `check_priceswitch()` cùng `notify()`
- Vấn đề: comment ghi "one alert per change", nhưng `notify` chỉ gửi webhook khi trạng thái đổi (OK → FAIL), hoặc khi đã quá `REMIND_SECONDS` (6 giờ). Ví dụ: OWN bật công tắc lúc t0 → FAIL, có webhook. Lần đổi thứ hai lúc t0 + 20 phút nằm trong cửa sổ 35 phút → vẫn FAIL → **không** có webhook riêng, chỉ có dòng journal. Thêm nữa, cửa sổ 35 phút với timer 30 phút sẽ sót thay đổi nếu một lượt timer bị trễ hoặc máy khởi động lại.
- Vì sao quan trọng: SR-PE-16 cần cảnh báo **mỗi lần** công tắc đổi. Một lần bật/tắt không chủ ý (hoặc từ tài khoản OWN bị chiếm) cần có dấu vết riêng gửi tới INV. C9 là Should, không chặn.
- Đề xuất sửa: lưu `id` audit lớn nhất đã báo vào `state/priceswitch.last_id`. Mỗi lượt truy vấn `id > last_id` (không theo cửa sổ thời gian). Có dòng mới thì gửi webhook **bỏ qua** khử trùng của `notify` (một câu cho mỗi lượt, nêu số lần và giá trị mới nhất), rồi cập nhật `last_id`. Lần chạy đầu: lấy `max(id)` làm mốc, không báo.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2-S1
- Mức độ: Suggestion
- Vị trí: regex version ở `publish-privacy-notice.sh`, `.sql`, `deploy-landing.sh` – `(\.[0-9]{1,2})?`
- Vấn đề: `2026-11-20.1` và `2026-11-20.01` là hai chuỗi khác nhau nhưng cùng khóa thứ tự (SQL `0.01`, bash `01`). Cả hai đều đăng được và cái sau supersede cái trước. Không có lỗi bảo mật, nhưng hai version "bằng nhau" làm bằng chứng khó đọc.
- Đề xuất sửa: `(\.[1-9][0-9]?)?` ở cả ba nơi.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2-S2
- Mức độ: Suggestion
- Vị trí: `infra/server/test/publish-privacy-notice.test.sh`; PR PN-01 (migration 0090, chưa có nhánh)
- Vấn đề: khi trigger PN-01 lên (từ chối UPDATE trừ đặt `superseded_at` từ NULL, từ chối DELETE), lượt supersede N ngôn ngữ phải vẫn chạy được. Mã hiện tại đã đúng dạng đó, nhưng chưa có test chạy với trigger.
- Đề xuất sửa: khi PN-01 có image, chạy lại test 23 (5 ngôn ngữ, supersede en/vi) trên DB có trigger. Thêm ca: UPDATE `body_sha256` bằng `ottimo_owner` → lỗi. QA hoặc OPS làm cùng lượt PN-01.
- Trạng thái: Open

### FB-R4-SEC-OPS-LPV2-S3
- Mức độ: Suggestion
- Vị trí: `publish-privacy-notice.sh` dòng 159–165 ("A build without hreflang on that page: the pages found are the list")
- Vấn đề: nếu bản dựng không có hreflang, phép so manifest bị bỏ qua. Với bản LP-v2 thì không xảy ra (dist-check FE bắt hreflang hai chiều), nhưng công cụ không tự biết điều đó.
- Đề xuất sửa: khi có ít nhất một trang mang thẻ `ottimo-notice-version` (tức bản LP-v2 trở đi) thì **bắt buộc** có hreflang; rỗng → từ chối. Bản trước LP-v2 (en/vi, chữ in) giữ hành vi hiện tại.
- Trạng thái: Open

## 4. Rủi ro còn lại

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| OPS-RR1 | Không còn công tắc Caddy cho từng ngôn ngữ: mọi bản LP-v2 (`LANGS` cố định 5 ngôn ngữ) mở `/ko/`, `/zh/`, `/ru/` ngay ở bước (b). Nếu sau phát hành phát hiện một bản dịch thông báo sai, cách gỡ duy nhất là dựng lại landing. | Thấp | Form ko/zh/ru bị api chặn bằng `LANDING_LOCALES` (đặt ở bước d, sau C7). Nội dung phải qua người bản xứ trước khi dựng image (C2/D4, README "Điều kiện trước"). Nếu muốn có đường gỡ nhanh: biến Caddy `LANDING_CLOSED_LANGS` để trả 404 một tiền tố. Không bắt buộc. |
| OPS-RR2 | Giữa (b) và (d), trang ko/zh/ru hiển thị form nhưng api trả 422 hoặc `NOTICE_VERSION_INVALID` | Thấp (trải nghiệm) | Không có dữ liệu sai, khối Zalo/gọi hiện thay. Làm liền trong một phiên SSH như README. |
| OPS-RR3 | Kiểm "version cũ hơn" ở `deploy-landing` dựa vào `state/privacy-notice.log` cục bộ. Mất log thì bỏ qua kiểm. | Thấp | Lớp DB (SQL) vẫn chặn khi đăng. Log nằm trong backup `state/`. |

## 5. Ghi decision-log (đề nghị ORC ghi, quyền SEC)

`| 2026-11-01 | 4 | SEC – duyệt hạ tầng LP-v2 (lp-v2-ops 74e23925, reviews/SEC-on-LP-v2-ops.md): Đạt có điều kiện nhẹ, không Blocker/Major. Phần OPS của C4, C5, C6, C9 đạt. Chấp nhận lệch SR-LC-04: L-OPS-1 danh sách đăng = trang trong image (LANDING_LOCALES là điều kiện tối thiểu), L-OPS-2 manifest = hreflang /privacy/ (không cần privacy-manifest.json). FB-R4-SEC-FE-02 phần OPS Fixed. 4 Minor (số migration 0090→0091 trong tài liệu/test; deploy-landing FAIL khi trang thiếu version lúc proxy on; Caddy query chỉ ASCII; priceswitch báo mỗi lần đổi theo id audit), 3 Suggestion | SEC | Quyền SEC |`

## 6. Điểm làm tốt
- SQL là "lớp phòng thủ cuối" đúng nghĩa: kiểm lại mọi đầu vào của wrapper, có câu từ chối dễ hiểu trước khi gặp lỗi ràng buộc, chạy thử không tiêu số thứ tự audit, chỉ thêm dòng nên khớp trước với trigger PN-01.
- Test Caddy đếm log của api giả để chứng minh lượt bị từ chối **không tới api**, và có ca `X-Forwarded-For` giả. Đó đúng là hai điều SEC cần thấy cho SR-PE-10 và C8.
- Cảnh báo `ops-check` được test cả webhook lẫn tệp state để chứng minh không có slug, IP, mã căn, thay vì chỉ ghi điều đó trong comment.
