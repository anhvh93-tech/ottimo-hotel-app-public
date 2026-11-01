# ARC review hạ tầng LP-v2 – `lp-v2-ops` + `lp-v2-ops2`

- Người review: ARC | Round 4 – gói LP-v2 – Bước: **Review** (điều kiện gộp **M5** của QC, `rounds/round-04/qc/lp-v2-gate.md`) | Ngày 01/11/2026
- Phạm vi:
  - Commit `74e23925` (Sản xuất) và `0185a935` (Phản hồi & sửa theo SEC).
  - Báo cáo `rounds/round-04/outputs/OPS/lp-v2-ops.md` và `responses/OPS-LP-v2.md` trên `origin/lp-v2`.
  - Mã đọc ở `origin/lp-v2` @ `93c549ea`. Phần `infra/` từ `0185a935` tới đầu nhánh chỉ đổi thêm `ci.yml` (`c37a0a76`, bước "Copy is generated").
- Đối chiếu với:
  - Thiết kế `rounds/round-04/outputs/ARC/lp-v2-design.md`: 2.6, 3.2, 3.4, 3.6, 4.3.
  - Thẻ FB-R4-ARC-OPS-LPV2-01, ý (1)–(8), trong `reviews/ARC-on-LP-v2-code.md`.
  - SEC `reviews/SEC-on-LP-v2-ops.md`: mục 2, các ý "ARC xác nhận sau", và rủi ro OPS-RR1…3.
  - Mã BE trên `lp-v2`: `public-site.options.ts`, `public-booking.service.ts` (ân hạn 7 ngày), `parameters.service.ts` (audit `config.changed`), `price-estimate.service.ts` (log `public_price_missing`).
- ARC tự chạy lại trên bản xuất `git archive origin/lp-v2 product/infra`. Không checkout nhánh khác, không đụng `main` ngoài `product/docs/architecture.md`.

| Test | Kết quả ARC chạy (01/11) |
|---|---|
| `infra/ci/check-caddy-landing.sh` (caddy image ghim) | **Đạt**: "only the three public operations reach the api …, 404 by language, everything else 404" |
| `infra/server/test/deploy-landing-privacy.test.sh` | **23/23** |
| `infra/server/test/ops-check-price.test.sh` | **16/16** |
| `infra/server/test/publish-privacy-notice.test.sh` | **Không chạy**: cần stack thật (postgres + migrate + landing). Theo OPS: 34/34. Test này cũng không có trong CI. QA phải chạy thử trên staging với image thật trước bước (c) (QC P10) |
| shellcheck | Không chạy (máy ARC không có). Theo OPS: 0 cảnh báo. CI job `infra-scripts` có cả 2 tệp test mới |

## 0. Kết luận

**Đạt. Đóng FB-R4-ARC-OPS-LPV2-01 (Major).**
- Đủ 8 ý của thẻ, đúng thiết kế 2.6, 3.2, 3.6 (3)(4)(5)(6), có test kèm.
- Có 3 chỗ lệch chữ thiết kế. ARC chấp nhận cả 3, và mục 3 dưới đây sửa lại chữ thiết kế cho khớp:
  - G1: danh sách đăng lấy từ image.
  - G2: hreflang dùng làm manifest.
  - `deploy-landing` có thêm hai luật mới.
- Xác nhận 3 ý SEC ghi "ARC xác nhận sau": 404 tiếng Anh dự phòng, G1, G2.
- **Blocker 0, Major 0.** Có 3 Suggestion mới (OPS-LPV2-04…06), không thẻ nào chặn gộp hay phát hành.
- FB-R4-ARC-OPS-LPV2-03 (M6, turbo `inputs`) đã sửa đúng đề xuất ở `93c549ea`. ARC đóng ở mục 4.

**M5 của QC: đạt về phía ARC.**

## 1. Đối chiếu 8 ý của FB-R4-ARC-OPS-LPV2-01

| Ý | Yêu cầu | Mã | Kết quả |
|---|---|---|---|
| (1) | `@public_price_estimate`: GET, đúng regex đường dẫn, cùng công tắc `LANDING_PUBLIC_API` | `Caddyfile.landing`: `method GET` + `path_regexp ^/v1/public/properties/[a-z0-9-]{2,40}/price-estimate$` + `"{$LANDING_PUBLIC_API:off}" == "on"`. Thêm query `^[!-~]{0,256}$` (SEC LPV2-03). `handle` đứng trước `@closed`, mọi `/v1/*` khác vẫn 404 | **Đạt.** Trả lời của api (404 khi `public_show_prices=false`, `Cache-Control: private, max-age=60`, 429/503) đi qua nguyên vẹn: `handle_errors` chỉ chạy với lỗi do Caddy sinh, không chạy với status của upstream. CSP không đổi (`connect-src 'self'`), đúng 2.6 |
| (2) | `handle_errors 404` theo `/(vi\|ko\|zh\|ru)/` | `@lang404 ^/(vi\|ko\|zh\|ru)(/\|$)` → `try_files /{lang}/404/index.html /404.html`, giữ `landing_headers` + `no-store` | **Đạt.** Tiền tố chỉ lấy từ danh sách cố định, nên không có traversal |
| (3) | Bỏ `/ru /ru/*` khỏi `@closed` | `@closed path /v1/* /health /health/* /__test__/*` | **Đạt** |
| (4) | `check-caddy-landing.sh`: on GET → api; on POST → 404; off → 404; `/ko/x` → `/ko/404/` | +25 ca so với R3 (38 → 41 sau SEC). Có thêm: đếm log api giả để chứng minh lượt bị chặn **không tới api**; `X-Forwarded-For` giả bị thay; ranh giới 256/257; UTF-8 thô | **Đạt, vượt yêu cầu** |
| (5) | compose: `LANDING_LOCALES: ${LANDING_LOCALES:-en,vi}` | `x-api-env` dòng 63; `check-compose.sh` kiểm cả `prod` và `prod-edge`; hai env mẫu để `en,vi` | **Đạt.** `check-compose` chặt hơn api (bắt buộc có `en`, `vi`, không lặp). Chấp nhận, xem 2.5 |
| (6) | publish + deploy N ngôn ngữ: version từ thẻ meta (đúng một), `--rollback` đọc chữ cũ, một giao dịch, băm khác nhau từng đôi, log `sha_<loc>=` | Wrapper + SQL + `deploy-landing.sh privacy_check()` | **Đạt.** Danh sách lấy từ image chứ không từ `LANDING_LOCALES`: ARC chấp nhận (2.2). SQL kiểm lại mọi đầu vào, chỉ thêm dòng, supersede theo từng ngôn ngữ, chặn version cũ hơn bản đang hiệu lực, kiểm readiness sau khi ghi |
| (7) | Cảnh báo `public_price_missing` và tỉ lệ 429/503 của route giá (SR-PE-16) | `ops-check.sh`: `pricelimit`, `pricegap`, `priceswitch`; `http5xx` bỏ 503 của route giá | **Đạt.** ARC đối chiếu mã BE: audit `action='config.changed'`, `entityType='config_parameter'`, `entityId=key` (`parameters.service.ts:312`). Dòng log `public_price_missing … room=<uuid>` (`price-estimate.service.ts:377`) khớp regex đếm số căn |
| (8) | README 12.3: thứ tự 3.6 (5), rollback 3.6 (6), bước "đổi `shortMaxNights` khi đổi mốc BR-108" | Khối "LP-v2 – phát hành landing 5 ngôn ngữ": bước 0 (v1.0.1 trước), (a)–(f), bước 7 BR-108, quay lui trong và sau 7 ngày | **Đạt** |

## 2. Xác nhận thiết kế cho các điểm OPS hỏi và SEC ghi "ARC xác nhận sau"

### 2.1 Trang 404 tiếng Anh dự phòng → **ARC xác nhận** (SEC 2.3)
- Đúng ý 3.2. Bản LP-v2 có `pages/[lang]/404.astro` cho mọi ngôn ngữ trong `LANGS`. Nhánh dự phòng chỉ dùng cho ba trường hợp:
  - tiền tố lạ (`/ja/x`);
  - đường dẫn gốc (`/x`);
  - image cũ khi `--rollback` (không có `/ko/404/`).
- Mã trả về vẫn 404, có header bảo mật và `no-store`. Test có cả ca `/zh/x` khi image không có trang 404 của ngôn ngữ đó.
- `try_files` trong `handle_errors` là cách gọn nhất, không cần thêm matcher cho từng ngôn ngữ.

### 2.2 G1 – danh sách ngôn ngữ để đăng lấy từ **image** → **ARC xác nhận, sửa chữ thiết kế**
- Chữ của 3.6 (3) mâu thuẫn với chính 3.6 (5):
  - 3.6 (3) ghi "danh sách = `LANDING_LOCALES`".
  - Theo 3.6 (5), lúc đăng V2 ở bước (c), biến này vẫn là `en,vi`. Biến chỉ đổi ở bước (d).
  - Làm đúng chữ 3.6 (3) thì ko/zh/ru không được ghi, và bước (d) không bật được.
- OPS chọn đúng. Bất biến cần giữ là: mọi trang privacy **đang phục vụ** (cũng là mọi form có thể gửi đồng ý) đều có dòng `(version, locale, sha)`. Lấy danh sách từ image giữ được bất biến đó trực tiếp.
- `LANDING_LOCALES` ⊆ ngôn ngữ của image được kiểm ở hai lớp: wrapper (`die … has no page`) và SQL (`v_req <@ v_locs`, rồi readiness). Như vậy api không thể bán một ngôn ngữ chưa có thông báo.
- Khớp ghi lệch SEC **L-OPS-1**. Chữ thay cho 3.6 (3): xem mục 3.

### 2.3 G2 – hreflang của `/privacy/` làm manifest → **ARC xác nhận**
- hreflang sinh từ `alternatesFor()` → `LANGS`. Đây là nguồn duy nhất của danh sách ngôn ngữ trong bản dựng (3.2). Một tệp `privacy-manifest.json` riêng cũng sinh từ `LANGS`, nên không thêm được thông tin gì. ARC **không** yêu cầu FE thêm tệp.
- Regex `hreflang="[a-z]{2}"` đúng với quy ước "hreflang chỉ mã ngôn ngữ" (ADR-014 3.3, lp-v2-design 3.1: `zh`, không phải `zh-Hans`). Có thêm ràng buộc phụ: nếu sau này ai đổi hreflang sang mã vùng (`zh-Hans`, `pt-BR`) thì wrapper sẽ từ chối. Đó là thất bại an toàn. Từ nay coi điều này là luật: **hreflang của landing chỉ là mã 2 chữ**. Đổi luật này phải sửa cả wrapper.
- Bản dựng không có hreflang: S3 đã đóng khe (bản LP-v2 có thẻ meta mà thiếu hreflang → từ chối).

### 2.4 Hai luật mới của `deploy-landing.sh` + FAIL khi thiếu version → **ARC xác nhận**
- **"Version cũ hơn bản đã đăng → FAIL, trừ `--rollback`"**: thiết kế không ghi luật này, nhưng nó khớp 3.6 (6) (SQL không cho đăng lại version cũ). Luật chặn sớm ở bước deploy, trước khi đổi container, thay vì để khách gặp `NOTICE_VERSION_INVALID` sau 7 ngày. `--rollback` chỉ cảnh báo, đúng 3.6 (6): bản cũ còn được nhận 7 ngày. ARC đã đối chiếu: api thật có ân hạn 7 ngày (`public-booking.service.ts:625`, `superseded_at > now - interval '7 days'`). Giả định G3 của OPS đúng.
- **"Ngôn ngữ đang bán thiếu trang → FAIL, trừ `--rollback`"**: đúng. Thiếu luật này thì api vẫn nhận form ko/zh/ru, trong khi trang thông báo của ngôn ngữ đó đã biến mất.
- **"Trang không có đúng một version → FAIL khi proxy mở"** (SEC LPV2-02): đúng ý 3.6 (4). Không đọc được version thì không giữ được bất biến "cùng version, cùng byte". WARNING chỉ dành cho `--rollback` hoặc khi proxy đóng.
- Thứ tự phải làm khi quay lui (đặt `LANDING_LOCALES=en,vi` và deploy lại app **trước** `--rollback`) đã ghi ở README. Quay lui quá 7 ngày thì form của bản cũ trả `NOTICE_VERSION_INVALID` và trang hiện khối Zalo/gọi. Đây là đóng an toàn, khớp 2.8.

### 2.5 Các giả định còn lại của OPS
| # | Ý ARC |
|---|---|
| G3 (ân hạn 7 ngày là hành vi api) | Đúng: đã đối chiếu mã BE (2.4) |
| G4 (`after->>'value'`) | Đúng: đã đối chiếu `parameters.service.ts`. Lịch đổi (`effectiveFrom`) cho ra `other`, chấp nhận |
| G5 (`pricegap` cửa sổ 24 giờ) | Chấp nhận: BE ghi một lần mỗi căn mỗi ngày nghiệp vụ, nên cửa sổ ngắn hơn sẽ sót |
| `check-compose` bắt buộc có `en`, `vi` | Chấp nhận như **luật cấu hình** cho production. ADR-014 3: `en` ở gốc, `vi` là ngôn ngữ chính của cơ sở. api vẫn chỉ kiểm từng mã ∈ `LandingLocale` (đúng 3.4). Hai lớp khác nhau có chủ ý: api không biết chính sách bán hàng, compose thì biết |
| SEC OPS-RR1 (không có công tắc Caddy cho từng ngôn ngữ) | Chấp nhận, **không** thêm `LANDING_CLOSED_LANGS` ở v1.0. Đường gỡ hiện có đủ dùng: (1) bỏ ngôn ngữ khỏi `LANDING_LOCALES` thì api chặn form ngay; (2) dựng lại landing không có ngôn ngữ đó (một lượt CI). Thêm công tắc thứ ba thì tăng số tổ hợp trạng thái phải test (proxy × `LANDING_LOCALES` × đóng ngôn ngữ). Xét lại nếu INV cần gỡ nội dung trong vài phút |
| Rủi ro `priceswitch` (id cấp không theo thứ tự commit) | Chấp nhận như OPS. Công tắc do OWN đổi tay, không có hai giao dịch đổi cùng khóa chạy chồng nhau |

## 3. Sửa chữ thiết kế `lp-v2-design.md` 3.6 (ARC – có hiệu lực từ file này)

Các câu dưới đây **thay** chữ tương ứng trong `rounds/round-04/outputs/ARC/lp-v2-design.md`. ARC sẽ gộp vào bản 0.3 của thiết kế khi sửa file đó lần tới.
- **3.6 (3), gạch 1** – thay "Danh sách ngôn ngữ = `LANDING_LOCALES` trong `.env`" bằng:
  - Danh sách ngôn ngữ để đăng = **các trang privacy có trong image đang chạy**.
  - Manifest = danh sách hreflang của `/privacy/`. Lệch với các trang có thật → từ chối.
  - `LANDING_LOCALES` là **điều kiện tối thiểu**: mỗi ngôn ngữ trong biến phải có trang.
  - Lý do: thứ tự 3.6 (5) đăng V2 ở bước (c), khi biến còn `en,vi`. Khớp SEC L-OPS-1 và L-OPS-2.
- **3.6 (4)** – thêm hai luật:
  - Image có version cũ hơn version đã đăng của cùng ngôn ngữ → FAIL, trừ `--rollback`.
  - Ngôn ngữ trong `LANDING_LOCALES` mà image không có trang → FAIL, trừ `--rollback`.
  - Áp khi `LANDING_PUBLIC_API=on`. Proxy đóng thì mọi luật chỉ là WARNING.
- **3.1** – thêm câu: hreflang chỉ là mã 2 chữ. Đây là ràng buộc của công cụ OPS (2.3).

## 4. Thẻ

### FB-R4-ARC-OPS-LPV2-01
- Mức độ: Major
- Vị trí: (như lượt 1 – `reviews/ARC-on-LP-v2-code.md` mục 7)
- Kết quả: đủ 8 ý (mục 1), kèm sửa theo 4 Minor + S1, S3 của SEC. ARC chạy lại 3 test, đều xanh.
- Trạng thái: **Done – ARC đóng 01/11/2026** (`74e23925`, `0185a935`)

### FB-R4-ARC-OPS-LPV2-03
- Mức độ: Minor
- Vị trí: `services/api/turbo.json` `tasks.test.inputs`
- Kết quả: `93c549ea` thêm đúng hai mục `$TURBO_ROOT$/packages/i18n/src/plural-forms.cases.json` và `$TURBO_ROOT$/design/copy/strings-*.json`. Cú pháp `$TURBO_ROOT$` đã dùng ở các mục có sẵn. ARC chưa tự chạy `turbo run test --filter=@ottimo/api --dry=json` để thấy hash đổi. Việc này để CI ở M7 xác nhận.
- Trạng thái: **Done – ARC đóng** (theo đọc mã; điều kiện M6 của QC đạt về phía ARC)

### FB-R4-ARC-OPS-LPV2-04
- Mức độ: Suggestion
- Vị trí: `product/infra/server/bin/deploy-landing.sh`, `privacy_check()`, nhánh `if [ -n "$bad" ]` khi proxy đóng (`log "WARNING: privacy page bytes changed …"; return 0`)
- Vấn đề: khi `LANDING_PUBLIC_API` ≠ `on` và có trang "cùng version khác byte", hàm `return 0` ngay. Hai cảnh báo sau nó (`older`, `missing`) không được in.
- Vì sao quan trọng: không sai luật, vì proxy đóng thì mọi thứ chỉ là WARNING. Nhưng người vận hành đang chuẩn bị mở lại proxy sẽ chỉ thấy một trong ba vấn đề, sửa xong lại gặp vấn đề tiếp theo.
- Đề xuất sửa: bỏ `return 0` trong nhánh đó, để luồng chạy tiếp xuống hai khối `older` và `missing`. Thêm 1 ca test: proxy đóng, có cả byte đổi và ngôn ngữ thiếu trang → in đủ 2 WARNING, kết quả vẫn qua.
- Trạng thái: Open (v1.1 hoặc lượt OPS kế)

### FB-R4-ARC-OPS-LPV2-05
- Mức độ: Suggestion
- Vị trí: `product/infra/server/env.production.example` dòng 46 ("proxies the two public operations"); `product/infra/docker-compose.prod.yml` comment trên `TRUST_PROXY` ("it proxies the two public form operations")
- Vấn đề: từ LP-v2 có **ba** operation đi qua proxy landing. Header `Caddyfile.landing` và `env.example` đã sửa, hai chỗ này chưa.
- Vì sao quan trọng: người vận hành đọc `env.production.example` khi bật `LANDING_PUBLIC_API=on` trên production. Chữ cũ khiến họ không biết bật proxy cũng mở route giá. Thực tế route giá vẫn 404 khi `public_show_prices=false`, nên không có rủi ro.
- Đề xuất sửa: sửa thành "the two public form operations + GET price-estimate (LP-v2)". Chỉ sửa comment.
- Trạng thái: Open (sửa cùng lượt gộp nếu tiện)

### FB-R4-ARC-OPS-LPV2-06
- Mức độ: Suggestion
- Vị trí: `publish-privacy-notice.sh` bước 4 và `deploy-landing.sh` `privacy_check()`: nhánh `elif [ "$l" = en ]` / `vi` đọc chữ "Version …"/"Phiên bản …" khi trang không có thẻ meta
- Vấn đề: thiết kế D11/D12 ghi "đúng **một** thẻ meta mỗi trang". Công cụ cho trang en/vi thiếu thẻ đọc chữ in, kể cả trong bản LP-v2 (bản có thẻ meta ở trang khác). Nếu bản LP-v2 làm rơi thẻ meta ở `/privacy/` mà chữ in vẫn đúng, công cụ vẫn qua. Byte vẫn được băm và so, nên bất biến FB-01 **không** bị phá. Chỉ có hai cách đọc version cùng tồn tại trong một bản dựng.
- Vì sao quan trọng: thấp. Dist-check của FE (`dist.test.ts`) bắt lỗi này trước. Ghi lại để luật "đọc chữ in" chỉ dùng cho đúng việc nó sinh ra: image trước LP-v2.
- Đề xuất sửa: nếu có ít nhất một trang mang thẻ `ottimo-notice-version` thì mọi trang phải có đúng một thẻ. Đây cũng là điều kiện S3 đang dùng để nhận ra bản LP-v2. Chỉ image không có thẻ nào mới đọc chữ in. Áp ở cả hai script, thêm 1 ca test mỗi script.
- Trạng thái: Open (v1.1)

## 5. Việc của ARC trong cùng lượt

### FB-R4-ARC-ARC-LPV2-01 – luật `@ottimo/contracts` → **Done**
- Đã ghi `product/docs/architecture.md`:
  - **mục 17.1 mới**;
  - cây thư mục mục 17 (mô tả `contracts`, thêm `packages/api-client`);
  - ghi chú R1 "contracts rỗng";
  - dòng lịch sử 01/11.
- Nội dung luật:
  - Chỉ chứa kiểu, hằng dữ liệu và **hàm thuần** dùng chung api ↔ client.
  - Không I/O, không đồng hồ, không API riêng Node hoặc trình duyệt, không `Intl` cho kết quả dùng để so khớp.
  - Không `dependencies` lúc chạy, không top-level `await` (api nạp bằng `require`).
  - Mỗi hàm có test trong gói. Bảng ca dùng chung khai trong turbo `inputs`.
  - Dev cần build lại contracts khi sửa (không watch).
  - Kiểu sinh từ OpenAPI ở `api-client` / `services/api/src/generated`, không ở contracts.
- Còn lại, không chặn:
  - (a) `packages/contracts/package.json` `description` vẫn là "Shared API types. R2: generated from … + zod schemas". Tệp này nằm trên `lp-v2`, ARC không sửa nhánh. Đề nghị BE hoặc FE-A sửa thành "Shared types and pure functions for api and clients – rules: docs/architecture.md 17.1" ở lượt sửa kế trên `lp-v2`.
  - (b) `product/docs/dev-setup.md` dòng 217 ("kiểu dùng chung (R2: sinh từ openapi)") và dòng 237 (kiểu sinh vào `packages/contracts/src/generated/`) đã cũ so với 17.1. Thêm câu "sửa contracts khi `pnpm dev` đang chạy → `pnpm --filter @ottimo/contracts build`" (K16 lượt 2). ARC sửa khi `lp-v2` gộp vào `main`, vì `turbo dev dependsOn` chỉ có trên `lp-v2`.

### FB-R4-ARC-ARC-LPV2-02 – sửa ví dụ `createGuest` Zalo và mô tả trong OpenAPI → **ghi việc, chưa sửa** (OpenAPI nằm trên `lp-v2`)
Việc cụ thể, chỉ sửa ví dụ và mô tả, **không đổi schema**, không đổi số phiên bản `0.3.10-draft`, ghi chú "0.3.10 bổ sung 6 (chỉ tài liệu)":
1. `paths./v1/properties/{propertyId}/guests.post` (`operationId: createGuest`, dòng ~7917 trên `lp-v2`), `requestBody.content.application/json.example`: thêm `messagingHandles: { zalo: '0901 234 567' }`. Ví dụ hiện tại có `preferredContact: zalo` mà không có handle. Gọi đúng như vậy thì server trả 422 `CONTACT_CHANNEL_EMPTY` (luật BUG-R4-011 của chính bổ sung 5).
2. `components.schemas.Guest.isForeigner` (dòng ~12813): thêm `description`: "`true` khi `nationalityCode` có và khác `VN`. `false` khi quốc tịch là `VN` **hoặc chưa biết** (`nationalityCode` vắng – 0.3.10 bổ sung 5). Không dùng để phân loại khách VN/NN cho khai báo lưu trú hay báo cáo cơ cấu: BR-009 phân loại theo **giấy tờ** (`guest_document`)".
3. `components.schemas.Guest.messagingHandles` (và câu tương ứng ở `GuestInput.messagingHandles`): thêm `description`: "Khóa = kênh (`zalo`, `whatsapp`, `kakaotalk`). Request nhận SĐT dạng người dùng gõ cho `zalo`/`whatsapp`. Response **sẽ** trả handle dạng SĐT theo E.164 có `+`, như `phone` (FB-R4-ARC-BE-LPV2-11, v1.1). Cho tới khi BE-LPV2-11 xong, server trả không có `+`, nên client so theo chữ số". Câu thứ hai bỏ đi khi BE-LPV2-11 được gộp.
4. Sinh lại và kiểm. Mô tả đi vào JSDoc của kiểu sinh, nên CI "sinh lại không đổi" sẽ đỏ nếu quên bước này.
   - `pnpm --filter @ottimo/api gen:openapi` (meta + schemas);
   - sinh lại `packages/api-client/src/generated/openapi.ts`;
   - redocly lint;
   - `contract.test.ts` "is up to date".
- Ai làm: ARC ghi ở bước Phản hồi & sửa kế trên `lp-v2`, hoặc FE-A/BE ghi theo lệnh ORC, như bổ sung 4 và 5. Không chặn gộp. Nếu ORC mở thêm lượt sửa trên `lp-v2` trước M7 thì làm luôn trong lượt đó, để ví dụ sai không lên `main`.
- Trạng thái: **Open** (việc ghi sẵn ở đây)

## 6. Đề nghị ORC ghi `decision-log.md` (quyền ARC)

`| 2026-11-01 | 4 | ARC – review hạ tầng LP-v2 (lp-v2-ops 74e23925 + lp-v2-ops2 0185a935, reviews/ARC-on-LP-v2-ops.md): Đạt, đóng FB-R4-ARC-OPS-LPV2-01 (Major) và OPS-LPV2-03 (93c549ea). Xác nhận: 404 tiếng Anh dự phòng; G1 danh sách đăng = trang privacy trong image, LANDING_LOCALES là điều kiện tối thiểu (sửa chữ lp-v2-design 3.6 (3)); G2 manifest = hreflang /privacy/, hreflang landing chỉ mã 2 chữ; deploy-landing FAIL khi version cũ hơn bản đã đăng / ngôn ngữ đang bán thiếu trang / trang không có đúng một version (proxy on, trừ --rollback); check-compose bắt buộc en,vi; không thêm công tắc Caddy theo ngôn ngữ ở v1.0 (SEC OPS-RR1). 3 Suggestion (OPS-LPV2-04…06) | ARC | Quyền ARC |`

`| 2026-11-01 | 4 | ARC – luật @ottimo/contracts (architecture.md 17.1, FB-R4-ARC-ARC-LPV2-01): chỉ kiểu, hằng dữ liệu và hàm thuần dùng chung api ↔ client; không I/O, không đồng hồ, không API riêng Node/trình duyệt, không dependencies lúc chạy, không top-level await; mỗi hàm có test trong gói, bảng ca dùng chung khai trong turbo inputs; kiểu sinh từ OpenAPI ở api-client / services/api/src/generated | ARC | Quyền ARC |`

## 7. Điểm làm tốt
- OPS thấy được mâu thuẫn giữa 3.6 (3) và 3.6 (5) của thiết kế ARC, chọn đúng bất biến cần giữ (mọi trang đang phục vụ đều đã đăng), ghi rõ thành giả định G1 để ARC/SEC quyết, chứ không lặng lẽ làm theo chữ.
- SQL là lớp phòng thủ cuối thật sự: kiểm lại mọi đầu vào của wrapper, có câu từ chối rõ ràng trước khi gặp lỗi ràng buộc (DB chưa có 0091), và chỉ thêm dòng. Cách ghi này khớp trước với trigger PN-01.
- Test Caddy chứng minh lượt bị chặn không tới api bằng cách đếm log api giả. Test cảnh báo kiểm cả nội dung webhook để chắc không có slug, IP, mã căn. Điều được hứa trong comment đều có test chứng minh.
