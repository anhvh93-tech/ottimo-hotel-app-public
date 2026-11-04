# QA – Kiểm thử `lp-v2-main` trước khi gộp vào `main`

- Người làm: QA | Round 4 – gói LP-v2 – Bước **Kiểm thử** | Ngày 04/11/2026, 09:39–10:00 giờ VN
- Đối tượng: `origin/lp-v2-main` @ `917a39cf` (worktree QA riêng, nhánh tạm `qa-lp-v2-main-merge`). Tham chiếu v1.0.3: tag `v1.0.3` = `da6d6f3d` (worktree tạm, đã xóa).
- Đọc: `outputs/ARC/lp-v2-main-merge.md` (mục 4, 7, 8), `reviews/SEC-on-lp-v2-main.md` (D1–D7, LPV2M-01..05), `reviews/FE-B-on-lp-v2-main.md`, `outputs/OPS/lp-v2-release-runbook.md` (trên nhánh), decision-log 04/11 (dòng "LP-v2 – Phản hồi & sửa theo SEC xong").
- Môi trường: MacBook (10 nhân, tải 25–29 suốt lượt), Node 22.23.3, pnpm 9.15.4 (`npx pnpm@9.15.4`; máy cài sẵn pnpm 12, không dùng), Postgres 17 tạm `ottimo-qa-lpv2m-pg` (cổng `127.0.0.1:55497`, cùng digest image CI, vai dựng bằng `infra/postgres/init/02-roles.sh`, mật khẩu tạm chỉ cho lượt này; đã xóa container sau lượt). Không chạm staging/production, không SSH. Chỉ dữ liệu giả (`@example.test`, "QA Guest").
- Không commit (ORC commit).

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN cho việc gộp `lp-v2-main` → `main`.**

- **0 lỗi P0, 0 P1, 0 P2.** 2 lỗi mới mức **P3**, không chặn gộp: BUG-R4-027 (test không khóa ngữ nghĩa "đọc `published_at`, không so chữ" của cổng Chat) và BUG-R4-028 (runbook không nối quy tắc "đổi chữ → nhãn mới `2026-11-04.1`" với hằng Chat).
- 6 thẻ sửa đóng đúng: LPV2M-01, 02, 03, 05, FE-B-LPV2M-01, 02 (mục 1). Riêng LPV2M-01: mã đúng; phần test đạt yêu cầu của SEC (3 ca a/b/c) nhưng một bản đột biến "so chữ" vẫn qua cả 117 ca → BUG-R4-027.
- Ca "LP-v2 trơ" đạt 10/10 (mục 2). 0092 lên DB 68 dòng trong 0,4 giây, không đổi dữ liệu. Mã v1.0.3 chạy trên DB 69: 217/219 ca đạt. 2 ca đỏ là `schema-parity` của v1.0.3, đỏ **đúng như dự kiến** vì chỉ thấy đúng phần 0092 thêm vào.
- Hồi quy v1.0.3 (email bảo mật, Trả sớm/hoàn BR-428, đăng nhập 2 bước Desk) không mất: không tệp mã nào của các phần này đổi so với `v1.0.3`; test api + admin-web của các phần này xanh (mục 3).
- Chạy tại máy: api 27 tệp / **555 ca** xanh; landing **283**; admin-web **799**; `astro check` 0 lỗi; Playwright landing **149/149** (`CI=1`, cổng 6486–6488); hạ tầng 28/28 + 119/119 + kiểm Caddy landing đạt (mục 4). Không ca nào phải chạy lại vì hết giờ.

**Điều kiện (để ORC/QC theo dõi, không phải việc của lượt này):**
1. CI trên **PR** `lp-v2-main` → `main` xanh trên đúng đầu nhánh (SEC D1). Run 41761885672 là `workflow_dispatch`. Lúc QA kết thúc (09:55), run này còn chạy job `docker images build · E2E smoke`; 7 job khác đã xanh (mục 5).
2. Trước khi gộp, nếu `main` có thêm commit đụng `product/` thì QA chạy lại mục 2 + 3. Hiện `main` (`b68b33b8`) hơn gốc gộp 17 commit, **tất cả chỉ là tài liệu** (0 tệp trong `product/`, `.github/`), và `git merge-tree` gộp sạch.
3. BUG-R4-027/028 sửa trước **lần đăng thông báo** (không phải trước gộp), hoặc ORC ghi rõ chấp nhận.

## 1. Kiểm từng commit sửa

| Thẻ | Commit | Kiểm | Kết quả |
|---|---|---|---|
| **FB-R4-SEC-LPV2M-01** (Major) | BE `2760744b` | (a) `chat-message.ts`: `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'`, chú thích "first notice … AND is published". (b) `CHAT_NOTICE_GATE_SQL` không đổi: `min(published_at) … WHERE version = $2` và `published_at … WHERE version = $3 AND locale = $4`; `effectiveLevel` so **thời điểm** (`req_at < min_at` → A, `min_at` NULL → A), không so chữ. Không còn chỗ nào trong `api/src` dùng `2026-10-31` làm ngưỡng. (c) `env.production.example` + README 13.4: "older than 2026-11-04 (the first published notice naming Google Chat)". (d) Test: `gchat-units` (hằng = `2026-11-04`) + `gchat-notify` 3 ca mới đúng a/b/c của SEC. Chạy: xanh. (e) **Đột biến QA:** đổi `effectiveLevel` sang `consent_version < CHAT_DETAILS_MIN_NOTICE_VERSION` (so chữ), chạy lại `gchat-units` + `gchat-notify` → **117/117 vẫn xanh**. Đã trả mã về như cũ (`git checkout`) | **Đạt** về mã và tài liệu. Test chưa khóa ngữ nghĩa SEC cảnh báo ("bẫy ngược") → **BUG-R4-027 (P3)** |
| **FB-R4-SEC-LPV2M-02** (Minor) | FE-B `ef2eb4ef` | `privacy.ts` `VERSION = '2026-11-04'`, khối "TEMPORARY LABEL" thay bằng ghi chú nguồn nhãn; `form-live.landing.spec.ts` `NOTICE_VERSION`, `lp-v2.landing.spec.ts` + `price-estimate.test.ts` `consentVersion` = `2026-11-04`. Không còn `2026-11-01` làm nhãn trong `landing-web/src`, `tests/e2e/landing`, `api/src` (2 chỗ `2026-11-01` còn lại là ngày "hôm nay" trong test, không phải nhãn). Bản dựng `dist-booking-live`: thẻ meta `ottimo-notice-version` = `2026-11-04` ở 5 trang. **sha256 5 trang privacy QA dựng lại trùng từng ký tự 5 băm FE-B ghi** (`7d610c5e…`, `c2ab4121…`, `dcc008db…`, `4c813cc4…`, `79246eda…`) – bản dựng lặp lại được. Khối `const en` / `const vi` của `privacy.ts` **trùng từng byte** `5474b6e1` (PR #21), 36/36 chuỗi mỗi ngôn ngữ | **Đạt** |
| **FB-R4-SEC-LPV2M-03** (Minor) | OPS `917a39cf` | README 12.3: hiện trạng `2026-10-24` en+vi, `2026-10-31` không bao giờ đăng riêng, nhãn `2026-11-04`, bước (c) "supersede version 2026-10-24 (en)/(vi)", quay lui in `2026-10-24`, hằng Chat `2026-11-04` + giải thích cổng đọc `published_at`. `publish-privacy-notice.sql` chỉ đổi chú thích. Runbook mới có bảng D1–D7 + P1–P6 (P5 = hằng `2026-11-04`), lệnh `grep -c "CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'"` ở 0.2 và P4. Còn sót: README 13.5 (K1) dòng 423 và 434 vẫn ghi "trước khi đăng thông báo `2026-10-31`" / "không đăng `2026-10-31`" – K1 đã đạt 03/11 nên chỉ là chữ cũ, gộp vào BUG-R4-028 | **Đạt** (1 sót nhỏ → BUG-R4-028) |
| **FB-R4-SEC-LPV2M-05** (Suggestion) | BE `2760744b` | `shared/time.ts` `isCalendarDate` (dựng lại ngày rồi so chuỗi); `parseEstimateQuery` và form (`arrival`, `departure`) dùng hàm này. `assertLocalDate` để nguyên (v1.0.x, đúng đề xuất). Test `time.test.ts` + `lp-v2-be-units` xanh. Ca QA I8: form `2027-02-29` → 422 `VALIDATION_FAILED`, ngày thật cuối tháng `2026-11-30` → 202 | **Đạt** |
| **FB-R4-FE-B-LPV2M-01** (Minor) | FE-B `6ce5e444` | `dist.test.ts`: `COPY` đủ en/vi/ko/zh/ru, có kiểm `Object.keys(COPY)` = `LANGS`, vòng lặp chạy cho mọi `LANGS`. landing vitest 283/283 trên 3 bản dựng QA dựng lại | **Đạt** |
| **FB-R4-FE-B-LPV2M-02** (Suggestion) | FE-B `6ce5e444` | Ghi chú ở đầu `playwright.config.ts` và `apps/landing-web/README.md` (lệnh mẫu `CI=1` + 3 cổng). QA làm theo đúng ghi chú (mục 4) | **Đạt** |
| (ARC LPV2M-04) | ARC `cc045857` | Biên bản mục 4 có ghi chú dữ liệu giả ≠ production; mục 7 P4 sửa câu hằng | Đạt (chỉ tài liệu) |

## 2. Ca "LP-v2 trơ" (gộp xong, cờ chưa lật)

Trạng thái giả lập = production hôm nay: `LANDING_LOCALES` **không đặt** (= `en,vi`), `public_show_prices` **chưa có dòng giá trị** (chỉ khóa danh mục của 0092, mặc định `false`), chỉ có thông báo `2026-10-24` en + vi.

### 2.1 Api (mã `lp-v2-main`, Fastify trong tiến trình + Postgres 17 thật)
Test tạm của QA `qa-lpv2-inert.tmp.test.ts` (để ở scratchpad, chép vào `services/api/test/integration/` chỉ khi chạy, đã xóa – **không** nằm trong nhánh). 10/10 đạt:

| # | Ca | Kết quả |
|---|---|---|
| I1 | OWN bật `public_booking_requests_enabled` khi chỉ có thông báo en+vi | 200 (điều kiện sẵn sàng chỉ đòi en, vi) |
| I2 | GET `price-estimate` hợp lệ (ngắn ngày) và theo tháng | **404**, `cache-control: no-store`; thân trả về không có số, `totalVnd`, `estimateToken`, `shortStay` |
| I3 | Khóa `public_show_prices` trong `config_parameter_def` | 1 dòng, mặc định `false`, chỉ `{owner}` sửa |
| I4 | Form en (`/`) và vi (`/vi/`), `consentVersion 2026-10-24` | 202; `price_estimate` NULL; `locale` giữ đúng |
| I5 | Form kèm `priceEstimateToken` giả khi giá đang tắt | 202, `price_estimate` NULL, cờ `offer_unverified` – không lưu số nào |
| I6 | Form `ko`, `zh`, `ru` (chưa có thông báo) | 422 `PUBLIC_FORM_NOT_READY` cả 3; `ja` → `NOT_IN_LIST` |
| I7 | Form `consentVersion 2026-11-04` khi nhãn này chưa đăng | 422 `NOTICE_VERSION_INVALID` |
| I8 | Ngày không có thật (LPV2M-05) | 422 `VALIDATION_FAILED`; ngày thật → 202 |
| I9 | Desk S35 (FDL) | 200, có `total`, chỉ en/vi |
| I10 | OWN bật giá → 200 sau 61 giây (bộ đệm 60 giây); tắt lại → 404 (quay lui 5.1) | Đạt |

Thêm: `gchat-notify` ca "C configured, 2026-11-04 not published yet → template A for everyone" xanh, tức là ở trạng thái trơ, kể cả khi `.env` đặt C, Chat vẫn mức A.

### 2.2 Landing và Caddy
- Ở trạng thái trơ, landing production **giữ** `sha-72f9ac8e2b33` (en/vi). Gói `infra/` mới (P2b) mang `Caddyfile.landing` mới. `check-caddy-landing.sh` (cổng 28743/28744): **OK**. Khi `LANDING_PUBLIC_API` không đặt thì `form-token` và `price-estimate` → 404. Khi bật, chỉ 3 thao tác công khai đi tới api; `/ko`, `/zh` không có trang thì ra trang 404 tiếng Anh.
- `deploy-landing-privacy.test.sh` **28/28**, gồm ca 14 (`LANDING_LOCALES` có ko/zh/ru mà image chỉ en+vi → từ chối) và 16c (`--rollback` về image thiếu vi khi proxy mở → từ chối).
- Không lộ giá: route giá 404 ở api (I2) **và** ở Caddy khi proxy tắt. Trang landing cũ không có khối giá.

### 2.3 Migration 0092 trên DB 68 dòng, rồi v1.0.3 trên DB 69
1. DB `ottimo_prodsim`: migrator của **`v1.0.3`** (`da6d6f3d`) → **68** dòng `drizzle.__drizzle_migrations`, `max(created_at)` = 1792782171681.
2. Dữ liệu giả, **đúng hình production** (khác ARC, theo SEC LPV2M-04): 2 dòng `privacy_notice_version` `2026-10-24` en+vi đang hiệu lực; 30 dòng `website_booking_request` locale vi/en/ru, 1 dòng đã xóa C2.
3. Migrator của `lp-v2-main` → chỉ 0092 chạy, **0,38 giây** cả khởi động node. Sau đó: **69** dòng, `max(created_at)` = 1792782173681; CHECK locale 2 bảng = `vi, en, ru, ko, zh`; có `website_booking_request_price_estimate_check`; 30/30 dòng còn, 30 `price_estimate` NULL, 1 dòng đã xóa C2 vẫn vậy; 2/2 dòng thông báo còn, vẫn hiệu lực; trigger `privacy_notice_version_append_only` + `_no_truncate` còn; `public_show_prices` = `false` `{owner}`, `web_estimate.open_until` = `"2027-01-01"` `{owner,manager}`; bảng `user_email_change` (0091) còn.
4. Chạy lại migrator `lp-v2-main` → không đổi (69). Chạy migrator **v1.0.3** trên DB 69 → "migrations applied", không lỗi, vẫn 69.
5. **Mã v1.0.3 trên DB 69** (DB test đã có 0092): 12 tệp test tích hợp của `v1.0.3` – `public-site-r3-bed`, `gchat-notify`, `v103-security-email`, `mfa-us143`, `identity`, `frontdesk-stay`, `frontdesk-s3-fixes`, `b16-preview-v101`, `approvals-refund-payout`, `email-dispatch`, `privacy-notice-append-only`, `schema-parity` → **217/219 đạt**. 2 ca đỏ đều ở `schema-parity` của v1.0.3. Chúng chỉ báo đúng phần 0092 thêm vào (cột `price_estimate`, 2 CHECK locale nới, 1 CHECK mới), tức **đỏ đúng như dự kiến**: ca này so DB với snapshot của chính bản mã, không phải lỗi chạy.
6. **v1.0.3 đọc dòng LP-v2:** test tạm QA (đã xóa) trên mã v1.0.3, DB 69. Có 3 yêu cầu `ko`, `zh`, `en` mang `price_estimate` và thông báo `2026-11-04` 5 ngôn ngữ. Kết quả: Desk S35 danh sách + chi tiết 200 cho cả 3, `locale` trả nguyên, thân không có số giá. Quay lui app về v1.0.3 sau khi đã mở ko/zh **không** làm Desk lỗi (Desk v1.0.3 có thể hiện mã ngôn ngữ thô – đã biết, BUG-R4-002 chỉ sửa ở LP-v2).
7. `deploy.sh` (cả bản v1.0.3 và bản nhánh) chấp nhận DB đi trước image **chỉ với `--rollback`** (`applied ≥ journal`); `rollback.sh` luôn truyền `--rollback`. Runbook 5.4 dùng `rollback.sh sha-da6d6f3dc22b` và ghi kết quả đúng là "69 applied / 68 in the image journal" – khớp mã. Ghi nhận: `deploy.sh sha-da6d6f3dc22b` **không** `--rollback` sẽ FAIL (69 ≠ 68). Đây là đúng thiết kế, runbook không dùng đường này.

## 3. Hồi quy v1.0.3 trọng yếu

| Phần | Cách kiểm | Kết quả |
|---|---|---|
| Phạm vi đổi so với `v1.0.3` | `git diff --stat v1.0.3 origin/lp-v2-main`: `api/src/modules/{identity,frontdesk,approvals,folio}`, `integrations/` (gồm mẫu thư), `apps/mobile`, `apps/guest-web`: **0 tệp**. admin-web đổi 19 tệp, đều thuộc webreq/quote/khách/phòng + `AppShell.tsx` (số đếm S35 dùng `loadWebreqNewCount`, nhắc email bảo mật giữ nguyên) và `s4-money.test.tsx` (1 regex RU). `packages/ui/Controls.tsx` chỉ thêm `aria-describedby` | Không mất mã |
| Chuỗi | Làm phẳng `strings-en/vi.json` của `v1.0.3` và nhánh: `secmail.*` 25/25, `early_departure*` 103/103, `mfa*` 38/38, `auth*` 27/27, `login*` 10/10, `refund*` 26/26 – **0 khác**. Thiếu 0 khóa của v1.0.3. Khác duy nhất: EN `guest.bill.line.room_*` → "Room charge, …" (UXD đã duyệt, ARC mục 2 #4) | Không mất chữ |
| Email bảo mật (secmail.*) | api: `be-a-v103-email-units`, `v103-security-email`, `email-dispatch`, `email-adapter` (nhánh) và `v103-security-email` (mã v1.0.3 trên DB 69); admin-web `v103-email-fea` 73 ca | Xanh |
| Trả sớm / hoàn (BR-428) | api: `be-a-v101-units`, `frontdesk-rules`, `frontdesk-stay`, `frontdesk-s3-fixes`, `b16-preview-v101`, `approvals-refund-payout`, `foc-resync`; admin-web `v101-early-departure-fea` 17, `r4-bug014-early-departure-lease` 7, `refund` 6 | Xanh |
| Đăng nhập 2 bước Desk | api: `mfa-us143`, `identity`; admin-web `auth.test.tsx` 11 ca (gồm `MfaStep`), `LoginPage.tsx`/`MfaStep.tsx` không đổi so với v1.0.3 | Xanh |
| CI không mất kiểm | `ci.yml` so `v1.0.3`: chỉ thêm bước ("Copy is generated", ops-check giá, shellcheck 2 tệp mới); bước Caddy landing **đổi tên** (kiểm thêm giá), không xóa | Đạt |

## 4. Lệnh đã chạy tại máy (worktree QA, `917a39cf`)

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `npx pnpm@9.15.4 install --frozen-lockfile` | OK |
| 2 | `pnpm db:migrate` (DB test tạm) | 69 migration |
| 3 | api vitest 27 tệp liên quan (gchat-units/notify/worker-only, lp-v2-be-units, lp-v2-price-estimate, time, plurals, migrations-journal, schema-parity, contract, privacy-notice-append-only, public-site-r3-bed, bug-r4-004/012, v103 email ×3, email-adapter, mfa-us143, identity, frontdesk ×3, b16, approvals-refund-payout, foc-resync, be-a-v101-units) | **27/27 tệp, 555/555 ca**, 0 bỏ qua (86 giây) |
| 4 | `turbo run build test typecheck --filter=@ottimo/landing-web --filter=@ottimo/admin-web --force` | 7/7 task; landing 12 tệp / **283**; admin-web 70 tệp / **799**; `astro check` 0 lỗi 0 cảnh báo; cảnh báo chunk > 500 kB của admin-web như trên `main` |
| 5 | `CI=1 LANDING_PORT=6486 LANDING_FORM_PORT=6487 LANDING_LIVE_PORT=6488 pnpm --filter @ottimo/tests test:e2e:landing` | **149/149** (1,5 phút). Không ca nào hết giờ, không chạy lại. Ảnh TC-LP-061 test tự ghi vào `rounds/round-04/outputs/FE/screenshots/` đã trả về bản commit |
| 6 | `infra/ci/check-caddy-landing.sh` (cổng riêng) | OK |
| 7 | `infra/server/test/deploy-landing-privacy.test.sh` | 28/28 |
| 8 | `infra/ci/test-ops-check.sh` | 119/119 |
| 9 | Đột biến cổng Chat (mục 1) | 117/117 vẫn xanh → BUG-R4-027 |
| 10 | Test tạm "trơ" (mục 2.1) và "v1.0.3 đọc dòng LP-v2" (mục 2.3 bước 6) | 10/10, 1/1 – tệp đã xóa khỏi worktree |

**Không chạy tại máy:** bộ api đầy đủ (3855 ca – CI job "format · lint · audit · test · build" đã xanh trên `917a39cf`), `pnpm audit`, gitleaks lịch sử (CI xanh), `docker-build` + E2E smoke stack (CI đang chạy), mobile/guest-web/integrations (không đổi so với v1.0.3). Api chạy trong tiến trình test (Fastify `inject`), không qua Caddy + container thật – ca qua Caddy thật là S6/D5 trên staging.

## 5. CI run 41761885672 (`workflow_dispatch`, `917a39cf`)

Lúc 09:55: **7/8 job xanh** – infra scripts (shellcheck), format · lint · audit · test · build, gitleaks, OpenAPI lint, landing Playwright, no test endpoints, API contract. Job `docker images build · E2E smoke` **đang chạy**. ORC theo dõi; QA chưa ghi kết luận cho job này.

## 6. Việc QA còn ở các bước sau (không thuộc lượt này)
- D2/P5: đọc `chat-message.ts` của **tag** app trước Release (runbook 0.2 + P4).
- D5/S6: 12 ca SEC 9.5 + ca IP qua `TRUST_PROXY` trên staging qua Caddy thật; P10 smoke (BUG-R4-011/012 trên stack thật, form 5 ngôn ngữ, 13 ca giá).
- BUG-R4-011, 012: đã sửa trên nhánh (test `bug-r4-012-guest-nationality-null` và admin-web `r4-lp-v2-fea4` xanh lượt này); đóng sau P10 như cũ.
- Xác nhận BUG-R4-027/028 khi BE/OPS báo sửa. **Đã làm 04/11 – mục 8 (G2 ĐẠT).**

## 7. Dọn dẹp
- Container `ottimo-qa-lpv2m-pg` + volume: đã xóa. Worktree tạm `v1.0.3` đã xóa. 2 tệp test tạm chỉ còn ở scratchpad QA. Bản đột biến đã trả về (`git status` sạch trong `product/`).
- Worktree QA `.claude/worktrees/qa-lp-v2-main-merge` giữ lại cho ORC commit 2 tệp: tệp này và `bug-list.md`.

## 8. Xác nhận G2 (04/11)

- Người làm: QA | Round 4 – gói LP-v2 – Bước **Kiểm thử (xác nhận sửa lỗi)** | 04/11/2026, 10:05–10:15 giờ VN
- Căn cứ: `rounds/round-04/qc/lp-v2-merge-gate.md` mục 3, dòng **G2** (a)–(d).
- Đối tượng: `origin/lp-v2-main` @ **`4fe85e19`** (`git fetch` lúc bắt đầu và lúc ghi: đầu nhánh vẫn `4fe85e198b1c…`, trùng đầu PR #34 ORC nêu). Worktree tách riêng (detached) `.claude/worktrees/qa-g2-lpv2m`, **không commit, không push** vào `lp-v2-main`; đã xóa sau lượt.
- Môi trường: MacBook, Node 22, `npx pnpm@9.15.4 install --frozen-lockfile`. Postgres 17 tạm `ottimo-qa-g2-pg` (`127.0.0.1:55498`, image `postgres:17-alpine@sha256:b0f9560a…` = digest CI, vai dựng bằng `infra/postgres/init/` của nhánh, mật khẩu là giá trị CI dùng một lần trong `ci.yml`), 69 migration. Không chạm staging/production, không SSH. Chỉ dữ liệu giả của test.

### 8.0 Kết luận G2: **ĐẠT**

| Ý | Kết quả |
|---|---|
| (a) 2 đột biến đỏ, bản gốc xanh | **Đạt**: M1 → 5 đỏ, M2 → 1 đỏ, bản gốc 122/122 |
| (b) `CHKV` runbook r1.1 + README 12.3/13.5 khớp hằng `2026-11-04` | **Đạt** |
| (c) 5 sha256 trang privacy trùng FE-B | **Đạt**: 5/5 trùng từng ký tự |
| (d) diff `917a39cf..4fe85e19` chỉ tệp đã biết | **Đạt**: 6 tệp, đúng danh sách |

BUG-R4-027 và BUG-R4-028 → **Closed** (`bug-list.md`). BUG-R4-011, 012 ghi "đã vào `main`, chờ P10" theo G4 (b). Không lỗi mới.

### 8.1 (a) Đột biến cổng Chat (BUG-R4-027)

Tệp đột biến: `product/services/api/src/modules/public-site/public/chat-message.ts`. Lệnh mỗi lượt (trong `services/api`, `DATABASE_URL` + `MIGRATION_DATABASE_URL` trỏ PG tạm): `npx vitest run test/gchat-units.test.ts test/integration/gchat-notify.test.ts`. Trước khi chạy: `turbo run build --filter='@ottimo/api^...'` (gói `integrations` cần bản dựng).

| Lượt | Thay đổi | Kết quả | Ca đỏ |
|---|---|---|---|
| Gốc | không | **122/122 xanh** | – |
| M1 (so chữ ở `effectiveLevel`, đúng bước 1 của BUG-R4-027) | điều kiện `!g?.min_at \|\| !g.req_at \|\| g.req_at < g.min_at` thay bằng `r.consent_version < CHAT_DETAILS_MIN_NOTICE_VERSION` | **5 đỏ / 117 xanh** (trước bản sửa: 0 đỏ / 117) | 4 ca unit "gate by published_at, not by label" (`2026-12-01` đăng trước → A; `2026-11-04.1` và `2026-11-05`, hằng chưa đăng → A; `2026-11-03` đăng sau → C) + ca tích hợp "BUG-R4-027/028: 2026-11-04.1 (5 languages) and 2026-11-05 published, 2026-11-04 not → A" |
| M2 (so chữ trong SQL) | subquery `min_at`: `version = $2` → `version >= $2` | **1 đỏ / 121 xanh** | ca tích hợp trên. Ca unit dùng SQL giả nên không bắt M2, đúng dự kiến – M2 chỉ bắt được trên Postgres thật |
| Trả về | chép lại bản gốc | sha256 `chat-message.ts` = `ec69b417…cdda4`, trùng `git show 4fe85e19:…`; chạy lại kèm `gchat-worker-only` **124/124 xanh** | – |

Kết quả khớp lời BE trong commit `4fe85e19` ("5 red" / "integration case red"). Mã đột biến sinh bằng script ở scratchpad QA, không nằm trong nhánh.

### 8.2 (b) Khối `CHKV` và README (BUG-R4-028)

Đọc `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` @ `4fe85e19` (r1.1) và `product/infra/server/README.md` 12.3, 13.5:
- 0.1: `⟨NOTICE_V⟩ = 2026-11-04`, ghi rõ đổi nhãn thì hằng api và `VERSION` landing phải cùng giá trị trước 0.2. Dòng "Nhãn thông báo", D2, P5: hằng = **đúng** nhãn đăng ở P10.
- `CHKV` (mục 2): trích hằng bằng `sed` khớp nguyên dòng `export const CHAT_DETAILS_MIN_NOTICE_VERSION = '…';` của ref api, trích `const VERSION = '…';` của ref landing, in `D2_CHAT_CONST=CO` chỉ khi hằng khác rỗng **và** hằng = `⟨NOTICE_V⟩` **và** `VERSION` = `⟨NOTICE_V⟩`. Được gọi ở 0.2 bước 3, S4, P4 (trước `git push` tag app), P10 bước 0. Không còn lệnh `grep -c "CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'"`. S4 và P10 đăng `--version ⟨NOTICE_V⟩`.
- README 12.3: "Đổi nhãn thì phải đổi cả hằng … Release api có hằng mới trước bước (c)"; hằng "phải bằng đúng nhãn sẽ đăng ở bước (c) – hiện là `2026-11-04`", kiểm bằng so giá trị, không grep chuỗi cố định. 13.5 K1: "trước lần đăng thông báo đầu tiên nêu Google Chat (`2026-11-04`)", K1 đã đạt 03/11; điều kiện không đạt cũng đổi theo.
- `privacy.ts` @ `4fe85e19` dòng 60: `const VERSION = '2026-11-04';`; chú thích thêm câu "a new label → set CHAT_DETAILS_MIN_NOTICE_VERSION (api chat-message.ts) to the same value".

Chạy (Mac, chỉ đọc git): 2 lệnh trích của `CHKV` trên `4fe85e19` → hằng api `2026-11-04`, `VERSION` landing `2026-11-04`; cùng lệnh trên tag `v1.0.3` → hằng `2026-10-31`; trên `5474b6e1` (PR #21) → `VERSION` `2026-10-31`. Phép so của khối (chép lại bằng Python vì công cụ của QA không chạy được khối shell nhiều lệnh) với các giá trị trích thật:

| `⟨NOTICE_V⟩` | hằng api | `VERSION` landing | Kết quả |
|---|---|---|---|
| `2026-11-04` | `2026-11-04` (`4fe85e19`) | `2026-11-04` (`4fe85e19`) | **CO** – khớp "Đúng là" của runbook |
| `2026-11-04.1` | `2026-11-04` | `2026-11-04` | KHONG (đúng ca BUG-R4-028) |
| `2026-11-04` | `2026-10-31` (`v1.0.3`) | `2026-11-04` | KHONG |
| `2026-11-04` | `2026-11-04` | `2026-10-31` (`5474b6e1`) | KHONG |
| `2026-11-04` | không trích được (`?`) | `2026-11-04` | KHONG (fail-closed) |

Ghi chú (không phải lỗi): `CHKV` dựa vào đúng dạng một dòng của khai báo hằng. Nếu sau này BE thêm kiểu (`: string`) hay xuống dòng, khối in `KHONG` (an toàn, chặn đi tiếp) – OPS/BE chỉ cần biết để sửa `sed` cùng lúc.

### 8.3 (c) Băm 5 trang privacy

Lệnh trong `apps/landing-web`: `pnpm run build:booking-live-test` (`LANDING_BOOKING_FORM=true LANDING_PROPERTY_SLUG=dl01 LANDING_OUT_DIR=dist-booking-live`), rồi `shasum -a 256 dist-booking-live/<lang>/privacy/index.html`. Thẻ meta `ottimo-notice-version` = `2026-11-04` ở cả 5 trang.

| Trang | sha256 QA dựng @ `4fe85e19` | FE-B (`reviews/FE-B-on-lp-v2-main.md` mục 4, trên nhánh) |
|---|---|---|
| `/privacy/` | `7d610c5e754874c3e1d2d53d28e06a2302cae09c5bdb14ae42edfebdf5a5f2fa` | trùng |
| `/vi/privacy/` | `c2ab41213442e07d536005984de037ea00ae2cbdfaa6b64a836fbf569857160b` | trùng |
| `/ko/privacy/` | `dcc008dbe32c0643fae1c9ba66b13c99c9bbb951afb12e5d8e8657c32b1de73f` | trùng |
| `/zh/privacy/` | `4c813cc4b328e2d81ad8a51239aeda3d2e19e2629f4cdb2685321671298cf9d1` | trùng |
| `/ru/privacy/` | `79246edae1658f6a90463059ec35855282e4de17df3388ad005ec2dab0de0577` | trùng |

Chú thích mới ở `privacy.ts` không đổi trang dựng. Thêm: dựng `dist` + `dist-booking-preview`, landing vitest **12 tệp / 283 ca** xanh (gồm `privacy.test`, `dist.test`). OPS vẫn so băm trên image thật ở S4 (biến dựng của CI có thể khác).

### 8.4 (d) Diff `917a39cf..4fe85e19`

`git diff --stat 917a39cf..4fe85e19`: **6 tệp, +186 / −26**, 3 commit (`55be09d5`, `aad14baa`, `4fe85e19`):

| Tệp | Commit | Thuộc |
|---|---|---|
| `product/apps/landing-web/src/content/privacy.ts` (+2/−1, chỉ chú thích JSDoc) | `aad14baa` | 028 |
| `product/infra/server/README.md` (12.3, 13.5) | `aad14baa` | 028 |
| `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` (r1.1) | `aad14baa` | 028 |
| `product/services/api/test/gchat-units.test.ts` (+36) | `4fe85e19` | 027 |
| `product/services/api/test/integration/gchat-notify.test.ts` (+35) | `4fe85e19` | 027 |
| `rounds/round-04/reviews/BE-on-lp-v2-main.md` (mới ở `55be09d5`, +1 dòng ở `4fe85e19`) | `55be09d5`, `4fe85e19` | review BE |

Không tệp `src/` nào của api đổi; không đổi migration, `ci.yml`, Caddy, script hạ tầng. Đúng danh sách G2 (d).

Thêm (cho G5, chỉ ghi nhận): `git diff --stat c6cd32a8 origin/main -- product .github` rỗng lúc 10:12 (`origin/main` @ `c18f9f0a`).

### 8.5 Không làm ở lượt này
- Không chạy bộ api đầy đủ, Playwright landing, admin-web: 3 commit mới chỉ đổi 2 tệp test api, 1 dòng chú thích và tài liệu; CI PR (G1) chạy đủ.
- Không đánh giá ca test có đúng ý ★2 về mặt bảo mật – việc của SEC (G3 (a)).

### 8.6 Dọn dẹp
- Container `ottimo-qa-g2-pg`: đã xóa. Worktree `.claude/worktrees/qa-g2-lpv2m`: đã xóa (`git worktree remove`). `lp-v2-main` không có commit nào của QA; đầu PR vẫn `4fe85e19`.
- 2 tệp tài liệu (tệp này, `bug-list.md`) ghi trên nền `origin/main` @ `c18f9f0a`, chưa commit – ORC commit.
