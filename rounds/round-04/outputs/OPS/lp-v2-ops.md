# OPS – gói LP-v2: hạ tầng (Caddy, ngôn ngữ, thông báo N ngôn ngữ, cảnh báo)

- Round 4 – gói LP-v2 – Bước **Sản xuất** | Ngày 01/11/2026 | Nhánh `lp-v2-ops` (từ `origin/lp-v2` `8363650c`)
- Việc: ARC FB-R4-ARC-OPS-LPV2-01 (ý 1–8), SEC `SEC-on-LP-v2-code.md` mục 4 (C3 phần OPS, C4, C5, C6, C9; C8 phần cấu hình), thiết kế `outputs/ARC/lp-v2-design.md` 2.6, 3.2, 3.6, 4.3.
- Không SSH, không deploy, không đụng production hay `main`.

## 1. Đã làm gì

| Ý ARC | Việc | File |
|---|---|---|
| (1) | Matcher `@public_price_estimate`: chỉ `GET`, đúng `^/v1/public/properties/[a-z0-9-]{2,40}/price-estimate$`, cùng công tắc `LANDING_PUBLIC_API`, query ≤ 256 byte (dài hơn → 404, không tới api). HEAD, POST, đường con, slug viết hoa → 404 | `infra/caddy/Caddyfile.landing` |
| (2) | `handle_errors 404` theo tiền tố `/(vi|ko|zh|ru)/` → `/<lang>/404/index.html`. Image không có trang 404 của ngôn ngữ đó → trang 404 tiếng Anh | như trên |
| (3) | Bỏ `/ru /ru/*` khỏi `@closed`. Ngôn ngữ không có trong bản dựng tự 404 (không có tệp) | như trên |
| (4) | `check-caddy-landing.sh` thêm 22 ca: price-estimate tới api kèm query; `X-Forwarded-For` khách gửi bị thay bằng địa chỉ Caddy thấy; query 256 byte qua, 257 → 404; POST/HEAD/đường con/slug sai → 404; các lượt bị chặn không tới api; `off` → 404; `/ru/`, `/ko/`, `/zh/` 200; `/vi/x`, `/ko/x`, `/ru/x/y` → 404 đúng ngôn ngữ; `/zh/x` (không có trang 404), `/ja/x`, `/x` → 404 tiếng Anh | `infra/ci/check-caddy-landing.sh` |
| (5) | `LANDING_LOCALES: ${LANDING_LOCALES:-en,vi}` trong `x-api-env` (một compose cho staging và production). `check-compose.sh` bắt thiếu biến hoặc giá trị ngoài `en,vi,ko,zh,ru`. Dòng mẫu trong `env.example` (staging, thêm cả `LANDING_PUBLIC_API=off`) và `env.production.example` (trùng từng ký tự với dòng BE đã thêm trên `lp-v2-be`, để gộp không xung đột) | `infra/docker-compose.prod.yml`, `infra/ci/check-compose.sh`, `infra/server/env.example`, `infra/server/env.production.example` |
| (6) | `publish-privacy-notice.sh/.sql` N ngôn ngữ – xem mục 2 | `infra/server/bin/publish-privacy-notice.sh`, `infra/server/publish-privacy-notice.sql` |
| (6) | `deploy-landing.sh` bước `privacy` N ngôn ngữ – xem mục 3 | `infra/server/bin/deploy-landing.sh` |
| (7) | `ops-check`: `pricelimit`, `pricegap`, `priceswitch` – xem mục 4 | `infra/server/bin/ops-check.sh` |
| (8) | README 12.3: bước 6 mới, kiểm byte N ngôn ngữ, khối "LP-v2 – phát hành landing 5 ngôn ngữ" (thứ tự 0 → f, đổi `shortMaxNights` khi đổi mốc BR-108, quay lui trong và sau 7 ngày); mục 7 thêm 3 cảnh báo | `infra/server/README.md` |
| CI | Job `infra-scripts`: shellcheck thêm 2 tệp test, bước mới `ops-check-price.test.sh`, đổi tên bước Caddy | `.github/workflows/ci.yml` |

## 2. `publish-privacy-notice` (SR-LC-04, ARC 3.6 (3))
- **Danh sách ngôn ngữ = trang trong image đang chạy.** Không lấy `LANDING_LOCALES`, vì theo thứ tự ARC 3.6 (5) lúc đăng V2 (bước c) biến này vẫn là `en,vi` (chỉ đổi ở bước d). `/privacy/` = en, `/<xx>/privacy/` = xx. Mã lạ → từ chối.
- **"Manifest trong image"** = danh sách hreflang của `/privacy/` (cùng hàm `alternatesFor` sinh cho mọi trang). Lệch với các trang có thật → từ chối cả lượt. Bản dựng không có hreflang → danh sách trang là manifest.
- `LANDING_LOCALES` vẫn được kiểm: mọi ngôn ngữ trong đó phải có trang, và SQL kiểm readiness theo nó.
- Version: **đúng một** thẻ `<meta name="ottimo-notice-version">` mỗi trang (ARC D11/D12). `data-notice-version` (nếu có) phải bằng. Image trước LP-v2 (không có thẻ) → đọc chữ "Version"/"Phiên bản" cho en/vi. ko/zh/ru thiếu thẻ → từ chối.
- Băm trong container, so bản chép ra, so trang thật qua edge từng ngôn ngữ; băm khác nhau từng đôi (wrapper và SQL cùng kiểm).
- SQL: biến `locales`, `shas`, `required` (danh sách cách dấu phẩy, dùng `:'var'`); **một giao dịch** cho mọi ngôn ngữ; supersede theo từng ngôn ngữ; audit `security` có `locales`, `hashes` (đối tượng `{xx: sha}`), vẫn giữ khóa `shaVi`/`shaEn`. DB chưa có 0090 (CHECK chưa nhận `ko`/`zh`) → từ chối với câu "deploy the api with the LP-v2 migration first", thay vì lỗi ràng buộc.
- Log `state/privacy-notice.log`: `sha_<xx>=` cho từng ngôn ngữ, en và vi đứng đầu như dòng cũ.

## 3. `deploy-landing.sh` bước `privacy` (SR-LC-05, ARC 3.6 (4))
- Đọc **mọi** trang privacy của image mới (offline). Version từ thẻ meta, image cũ thì đọc chữ (để `--rollback` về bản 2 ngôn ngữ).
- Giữ bất biến FB-01 cho từng `(version, locale)`: cùng version mà khác byte → FAIL khi `LANDING_PUBLIC_API=on` (cả `--rollback`).
- Thêm (SEC FB-R4-SEC-FE-02, phần OPS): image có version **cũ hơn** version đã đăng của cùng ngôn ngữ → FAIL, trừ `--rollback` (WARNING, nhắc mốc 7 ngày).
- Thêm: ngôn ngữ trong `LANDING_LOCALES` mà image không có trang → FAIL, trừ `--rollback` (WARNING, nhắc sửa biến).
- Proxy đóng (`LANDING_PUBLIC_API` ≠ `on`) → mọi điều trên chỉ là WARNING, như trước.

## 4. Cảnh báo `ops-check` (SR-PE-16, C9; ARC L9)
| Mục | Nguồn | Ngưỡng | Gửi đi |
|---|---|---|---|
| `pricelimit` | log Caddy landing 60 phút, route giá, `status` 429/503 | ≥ `PRICE_REFUSED_MAX` (mặc định 200 – đúng SR-PE-16 "200/giờ") | Một câu kèm số lần. Không đường dẫn, slug, IP |
| `pricegap` | log api 24 giờ, `public_price_missing` | ≥ 1 | Chỉ số căn. Không mã căn, mã cơ sở, nguyên văn log |
| `priceswitch` | `audit_event` `config.changed` / `public_show_prices`, 35 phút | ≥ 1 lần đổi | Số lần + giá trị mới (`true`/`false`) |
| `http5xx` (sửa) | như cũ | như cũ | Không đếm 503 của route giá (bulkhead trả 503 là thiết kế). 502/500 của route giá vẫn đếm |

## 5. Test (máy OPS, 01/11)
| Test | Kết quả |
|---|---|
| `infra/ci/check-caddy-landing.sh` (caddy image ghim) | Đạt – **38/38** (16 ca cũ + 22 ca mới) |
| `infra/server/test/publish-privacy-notice.test.sh` (stack thật: postgres + migrate + seed DS-E + landing với Caddyfile mới; api `sha-8b3aec89486f-test`, landing `qa155` + biến thể 5 ngôn ngữ dựng tại chỗ) | **32/32** (22 ca cũ + 10 ca LP-v2). DB của image api chưa có 0090: test kiểm ca "từ chối, báo deploy api trước", rồi nới CHECK y như 0090 để chạy tiếp |
| `infra/server/test/deploy-landing-privacy.test.sh` | **17/17** (9 cũ + 8 mới) |
| `infra/server/test/ops-check-price.test.sh` (mới) | **10/10** |
| `infra/server/test/ops-check-cwd.test.sh` | 6/6 |
| `infra/ci/check-compose.sh` | Đạt |
| `infra/ci/test-edge.sh` (dùng `Caddyfile.landing`) | Đạt |
| shellcheck 0.10.0 `-x -S warning`, đúng danh sách của CI (+ 2 test) | 0 cảnh báo |

## 6. Giả định
- **[GIẢ ĐỊNH] G1** – Danh sách ngôn ngữ để đăng lấy từ image, không từ `LANDING_LOCALES`. Lý do: thứ tự ARC 3.6 (5) đăng V2 ở bước (c), khi `LANDING_LOCALES` còn `en,vi`. `LANDING_LOCALES` là điều kiện tối thiểu (phải có trang), không phải danh sách đăng. ARC/SEC xác nhận.
- **[GIẢ ĐỊNH] G2** – Không có tệp manifest riêng do build sinh (FE không sinh `privacy-manifest.json`). OPS dùng hreflang của `/privacy/` làm manifest. Nếu SEC muốn tệp riêng thì FE thêm một tệp JSON, OPS đọc thay hreflang.
- **[GIẢ ĐỊNH] G3** – "Bản cũ còn được nhận 7 ngày sau khi bị thay" (ARC 3.6 (5)) là hành vi của api. OPS chỉ dựa vào đó để cho `--rollback` qua với WARNING, không kiểm số ngày.
- **[GIẢ ĐỊNH] G4** – `priceswitch` dùng `after->>'value'` của audit `config.changed` (BE `parameters.service.ts`). Nếu BE đổi dạng `after`, cảnh báo vẫn chạy, chỉ giá trị hiện `other`.
- **[GIẢ ĐỊNH] G5** – `pricegap` cửa sổ 24 giờ, vì BE chỉ ghi một lần mỗi căn mỗi ngày nghiệp vụ. Cảnh báo có thể còn đỏ tới 24 giờ sau khi OWN đã nhập giá.

## 7. Rủi ro / vướng mắc
- Chưa chạy với **image landing LP-v2 thật** và **image api có 0090** (hai nhánh chưa gộp vào `lp-v2`, chưa có image CI). Biến thể 5 ngôn ngữ trong test dựng từ `qa155` theo đúng dạng FE mô tả (thẻ meta, `data-notice-version`, hreflang). QA phải chạy lại `publish-privacy-notice` chạy thử trên staging với image thật trước bước (c).
- `priceswitch` và `pricegap` FAIL làm heartbeat gửi `/fail` một lượt. Có chủ ý: đây là đường báo duy nhất cho OWN khi thiếu giá (ARC L9).
- C8 (QA chạy 12 ca SEC 9.5 qua Caddy thật, ca 6 `TRUST_PROXY`) vẫn là việc QA trên staging. Phần OPS đã có: `TRUST_PROXY` của api có `LANDING_IP` (check-compose kiểm), và test Caddy chứng minh `X-Forwarded-For` giả của khách bị thay.

## 8. Việc chưa xong / cần vai khác
- **ARC review**: 3 điểm lệch thiết kế – G1 (danh sách đăng từ image), luật mới "version cũ hơn → FAIL trừ `--rollback`", luật "ngôn ngữ đang bán thiếu trang → FAIL"; hreflang làm manifest (G2).
- **SEC duyệt lại** (SR-LC-04/05 ghi "SEC duyệt lại"): SQL mới (biến danh sách, kiểm từng đôi, kiểm CHECK 0090, audit `hashes`), nội dung câu cảnh báo (không mang dữ liệu), ngưỡng 200/giờ.
- ORC: gộp `lp-v2-ops` vào `lp-v2` cùng `lp-v2-be`/`lp-v2-fe`. `env.production.example` trùng dòng BE nên không xung đột.
- Lighthouse CI (FE-04) để bản sau, không làm ở gói này (ARC nói không chặn LP-v2).

## 9. Đề nghị ORC ghi decision-log (quyền OPS)
`| 2026-11-01 | 4 | OPS – hạ tầng LP-v2 (nhánh lp-v2-ops): Caddy mở đúng GET price-estimate (query ≤ 256 B) sau LANDING_PUBLIC_API, mở /ko /zh /ru, 404 theo ngôn ngữ; LANDING_LOCALES vào api (mặc định en,vi); publish-privacy-notice đăng mọi ngôn ngữ của image trong một giao dịch (manifest = hreflang /privacy/, version từ thẻ meta, LANDING_LOCALES phải có trang); deploy-landing từ chối version cũ hơn bản đã đăng và ngôn ngữ đang bán thiếu trang (trừ --rollback); ops-check thêm pricelimit (≥ 200 lần 429/503 mỗi 60 phút), pricegap (public_price_missing 24 h, chỉ số căn), priceswitch | OPS | Quyền OPS |`
