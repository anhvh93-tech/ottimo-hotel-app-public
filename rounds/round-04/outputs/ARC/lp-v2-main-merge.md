# LP-v2 – Biên bản lắp ráp nhánh tích hợp `lp-v2-main`

- Người làm: ARC | Ngày: 04/11/2026 | Round 4 – gói LP-v2 – Bước **Sản xuất (lắp ráp)**
- Lệnh ORC 04/11: tạo `lp-v2-main` = `origin/main` + `origin/lp-v2` (93c549ea), giải xung đột, chạy đủ kiểm tại máy, push nhánh. **Không** push `main`, **không** tạo PR, không chạm staging/production, không SSH.
- Lệnh ORC bổ sung (04/11, trong lúc làm): INV báo luật sư đã đọc xong thông báo dữ liệu → đưa PR #21 (`fe-b/notice-2026-10-31` @ `5474b6e1`) vào nhánh, giữ `vi.ts` chatOnZalo/chatOnPrefix của LP-v2, áp 3 câu ko/zh/ru mới của SEC cho Δ5 (§6.4), nhãn phiên bản để SEC chốt.
- Đọc trước: `plan-lp-v2.md`, `qc/lp-v2-gate.md` (M1–M8, P1–P16), decision-log 03/11 "ORC – số hợp đồng/migration v1.0.3 vs LP-v2" và 04/11 (luật sư xong; INV bỏ bước người bản xứ), `outputs/ARC/lp-v2-design.md`, `outputs/BE/lp-v2-be.md` 9.3, `outputs/SEC/notice-2026-10-31-final.md` mục 2 và 7, `plan-v1.0.4.md` mục 2 (số 0092 / 0.3.11 khớp).

---

## 1. Kết quả

| Mục | Giá trị |
|---|---|
| Nhánh | `lp-v2-main` (origin) |
| Commit gộp chính | `4fea688e` – `origin/main` `e6b0fa6d` (v1.0.3 production) + `origin/lp-v2` `93c549ea` |
| Commit gộp PR #21 | `58d6afcd` – `5474b6e1` + Δ5 ko/zh/ru + font zh |
| Commit gộp `main` mới | `65f70b0a` – `origin/main` `c6cd32a8` (7 commit chỉ tài liệu: kế hoạch v1.0.4, review-pack CPY, quyết định luật sư / bỏ người bản xứ, ESC-049). Không đổi tệp nào trong `product/` |
| Đầu nhánh | commit chứa biên bản này (SHA báo trong kết quả trả ORC) |
| Migration LP-v2 | **0092** `0092_lp_v2_price_estimate_locales` (journal idx **68**, `when` **1792782173681** = 0091 + 2000) |
| OpenAPI | **0.3.11-draft** (LP-v2; trên nhánh `lp-v2` là 0.3.10-draft) |
| Nhãn thông báo dữ liệu | **`2026-11-01` – nhãn TẠM của LP-v2, giữ nguyên.** SEC chốt nhãn thật (P3) |

Băm (sha256):

| Tệp | sha256 |
|---|---|
| `0091_user_email_change.sql` (của `main`, **không đổi byte**) | `e8bb6cb92a43a85b793fc5c73a197a9236c407d918b8ff70cb054c21fecb33a3` |
| `meta/0091_snapshot.json` (của `main`, không đổi) | `761d1639a5f51d0f50fee5a6f004adbec12d6297366c3ac81daaea53f84c7db2` |
| `0092_lp_v2_price_estimate_locales.sql` | `b1f16b35fe81eb08a46216fde3f477ec3d60d8a38fe216ed4207b46379e92b41` |
| `meta/0092_snapshot.json` (id `6d4cb691…`, prevId `094eec8a…` = id snapshot 0091 của `main`) | `7ba13e17ab872962f79a8912ae3ebe038a20b230f5c6060ad00be788e09e9a40` |

## 2. Cách giải từng xung đột (17 tệp `git merge-tree` báo + phần gộp tự động cần kiểm)

| # | Tệp | Cách giải |
|---|---|---|
| 1 | `migrations/meta/_journal.json` | Giữ nguyên 68 dòng của `main` (idx 0–67, cuối là `0091_user_email_change`), thêm dòng `0092_lp_v2_price_estimate_locales` idx 68, `when` 1792782173681 |
| 2 | `migrations/meta/0091_snapshot.json` (add/add) | Lấy bản `main` (của `0091_user_email_change`). Bản LP-v2 (prevId 0088) bỏ |
| – | `0091_lp_v2_price_estimate_locales.sql` | Đổi tên **0092**. Snapshot 0092 **sinh bằng drizzle-kit** theo cách BE 9.3: tạm rút SQL LP-v2 ra, `drizzle-kit generate --name lp_v2_price_estimate_locales` (sinh `0068_…sql` + `meta/0068_snapshot.json` theo idx), chuyển snapshot thành `meta/0092_snapshot.json`, trả `meta/0068_snapshot.json` cũ về nguyên byte, xóa SQL drizzle sinh. DDL drizzle sinh **trùng 6 câu `ALTER TABLE`** của SQL viết tay. Đặt lại SQL viết tay (thêm câu INSERT khóa tham số), chỉ sửa chú thích đầu (số, `when`, nguồn). Sau đó `drizzle-kit generate` báo "No schema changes" |
| 3 | `docs/api/openapi.yaml` | `info.version` **0.3.11-draft**. Changelog LP-v2 đặt **trên** 0.3.10 (v1.0.3) và 0.3.9, đổi nhãn "0.3.10-draft" → "0.3.11-draft" kèm câu "Trước đây 0.3.10-draft trên nhánh `lp-v2`". 26 dòng ghi chú "0.3.10 …" chỉ có ở LP-v2 (operation, schema) đổi thành "0.3.11 …"; các dòng 0.3.10 của v1.0.3 (`setMyEmail`, `updateUser.email`, `Me.email`…) giữ nguyên. Nội dung hai bên đều đủ: `PUT /v1/me/email` + `getPublicPriceEstimate`, `LandingLocale`, `listWebsiteBookingRequests.locale/total`, `GuestInput.nationalityCode` null. Sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client `generated/openapi.ts` (chỉ đổi nhãn/mô tả so với bản gộp tự động – cấu trúc đã đúng) |
| 4 | `design/tools/gen_strings.py` | Một xung đột: `guest.bill.line.room_*` EN – lấy bản LP-v2 "Room charge, {nights} night × {rate}" (UXD BE-01 đã duyệt, `UXD-on-LP-v2-fe4.md`); `main` còn bản cũ "Room {nights} night…". Mọi khóa còn lại gộp tự động |
| 5–8 | `copy/strings-en.json`, `strings-vi.json`, `wireframes/assets/strings.js`, `tools/strings-tables.md` | **Không sửa tay.** Lấy một bên rồi chạy `python3 design/tools/gen_strings.py` (3426 chuỗi + 8 mẫu). Kiểm: đủ 3414 khóa của `main` (gồm `secmail.*`, `early_departure.*`) và khóa LP-v2 (`webreq.locale.ko/zh`…); thiếu đúng 2 khóa `rooms.price_same_today/future` – `main` đã bỏ có chủ đích ở v1.0.1 (FB-R3-UXD-FE-A-04/05), không mã nào dùng |
| 9 | `design/content-guide.md` | Cùng chỗ với #4 – lấy bản LP-v2 |
| 10 | `public-site/internal/website-request-rules.ts` | Giữ bản `main`: bộ dò số nhạy cảm dùng chung `sensitive-number.ts` (BUG-R3-058, GCHAT-07, PR #24) – đã gồm NFKC, số CCCD Hàn/Trung/hộ chiếu Nga của SEC lp-v2 mục 10, mạnh hơn bản LP-v2 (chỉ NFKC + 3 regex). Bỏ bản cũ của LP-v2; không còn tham chiếu `withoutDatesAndTimes`/`nfkc` |
| 11 | `api/test/bug-r4-009-plurals.test.ts` (add/add) | Lấy bản LP-v2 (thêm ca đối chiếu bảng `plural-forms.cases.json` – FB-R4-ARC-BE-LPV2-10) |
| 12 | `packages/i18n/src/translate.test.ts` | Lấy bản LP-v2 (ca bảng dùng chung + chuỗi "Room charge, 1 night × X") |
| 13 | `.github/workflows/ci.yml` | Hợp: giữ mọi kiểm của `main` (backup-privacy-log, rollback, restore-drill, mail-test, requeue-email-changed, ops-check email_*, gitleaks…) + kiểm LP-v2 (bước "Copy is generated", ops-check-price, Caddyfile.landing có price route, shellcheck 2 tệp test mới) |
| 14 | `infra/server/bin/ops-check.sh` | Hợp. Lượt chạy đủ: `containers j16 backup disk mem tls http5xx email_dead email_missing email_changes email_ascii pricelimit pricegap priceswitch`. **Sửa ngữ nghĩa:** hàm LP-v2 dùng biến `$compose_err` mà `main` đã đổi thành `$cmd_err` (`set -u` → script chết). Đổi sang `$cmd_err` + `compose_failed`/`cmd_failed`; `priceswitch` khi truy vấn lỗi in "query failed: <loại>" (ARC CWD-03), câu trả lời lạ in "unexpected answer". `test-ops-check.sh`: kiểm danh sách lượt chạy đủ chấp nhận thêm kiểm sau `email_ascii` + 1 kiểm mới "pricelimit pricegap priceswitch có trong lượt chạy đủ" (119 kiểm) |
| 15 | `infra/server/bin/deploy-landing.sh` | Lấy bước `privacy` N ngôn ngữ của LP-v2, **giữ hành vi v1.0.3**: (a) đọc image bằng `--cap-drop ALL --security-opt no-new-privileges --read-only --user 65534` (CWD-04/PR23-04); (b) proxy form mở mà image không có trang privacy nào → FAIL; (c) WARNING riêng khi thiếu `state/privacy-notice.log` lúc proxy mở (CWD-02); (d) trang en/vi bản cũ (không thẻ meta) in không đúng một version → FAIL khi proxy mở, **kể cả `--rollback`** (thông điệp cũ "privacy en: not exactly one version printed"); (e) proxy mở mà image thiếu trang en hoặc vi → FAIL, kể cả `--rollback` (LP-v2 chỉ WARNING khi rollback – v1.0.3 thắng vì đang chạy production) |
| 16 | `infra/server/test/deploy-landing-privacy.test.sh` | Hợp 13 ca v1.0.1–v1.0.3 + 14 ca 5 ngôn ngữ + **ca 16c mới** (`--rollback` về image thiếu vi khi proxy mở → từ chối). 28/28 đạt |
| 17 | `infra/server/README.md` | 12.3: gộp hai danh sách quy tắc privacy (thêm dòng fail-closed en/vi), giữ mục "LP-v2 – phát hành landing 5 ngôn ngữ"; giữ trọn mục 13 (v1.0.1–v1.0.3); số migration LP-v2 trong 12.3 (a) → 0092; số ca test cập nhật (28, 119) |

Gộp tự động nhưng ARC sửa thêm cho đúng số mới (chỉ chú thích): `publish-privacy-notice.sh` (OpenAPI 0.3.11, migration 0092), `publish-privacy-notice.sql`, `test/publish-privacy-notice.test.sh`, `db/schema/public-site.ts` (2 chú thích), `test/integration/lp-v2-price-estimate.test.ts`. `product/docs/erd.md` 4.14: thêm đoạn "R4 LP-v2 – migration 0092" (việc ARC còn nợ từ LP-v2).

**Còn để nguyên (Minor, không chặn):** khoảng 15 chú thích trong mã LP-v2 (admin-web, api-client, contracts) còn ghi "OpenAPI 0.3.10 bổ sung 3/4/5" nghĩa là 0.3.11 – xem thẻ ARC-LPV2M-01 mục 6.

## 3. PR #21 (thông báo `2026-10-31` en/vi) – đã gộp vào `lp-v2-main`

### 3.1 Đánh giá trước lệnh bổ sung
- PR #21 **không thuộc gói LP-v2**: là đợt 1b v1.0.1 (`landing-v1.2.0`, decision-log 01/11 "ARC – kế hoạch lắp ráp v1.0.1"), chỉ en/vi, 5 tệp landing. Nhưng là **điều kiện** của LP-v2: QC M4 (en/vi của LP-v2 lấy chữ `2026-10-31` làm gốc), P4, SEC notice-final mục 7 ("en/vi của V3 phải trùng từng ký tự với `2026-10-31`").
- `main` vẫn đang ở thông báo `2026-10-24`; PR #21 chưa gộp vào `main` hay `lp-v2`.
- Xung đột với `lp-v2-main`: 2 tệp – `privacy.ts` (4 khối: đầu tệp, `VERSION`, Δ5 en, Δ5 vi) và `form-live.landing.spec.ts` (`NOTICE_VERSION`). `vi.ts`, `en.ts`, `dist.test.ts` gộp tự động.
- Đề xuất ARC ban đầu: gộp cùng (vào `lp-v2-main`), vì tách riêng thì `main` phải đăng `2026-10-31` rồi LP-v2 đăng ngay nhãn mới, cùng chữ en/vi – hai lượt landing không cần thiết. Lệnh ORC bổ sung chọn đúng hướng này.

### 3.2 Đã làm (commit `58d6afcd`)
- `privacy.ts` khối **en** và **vi** = PR #21 **từng ký tự** (kiểm bằng script: 40/40 chuỗi mỗi ngôn ngữ trùng, 0 dòng nguồn khác trong hai khối). Δ5 en/vi giờ có vế "The service handles this text under its own privacy policy, and its servers may be outside Viet Nam." / "Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam."
- ko/zh/ru: câu thứ ba của Δ5 thay bằng 3 câu SEC (notice-2026-10-31-final mục 7), nguyên văn:
  - ko `이 서비스는 해당 내용을 자체 개인정보 처리방침에 따라 처리하며, 서버는 베트남 밖에 있을 수 있습니다.`
  - zh `该服务按其自身的隐私政策处理这些内容，其服务器可能位于越南境外。`
  - ru `Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.`
- Đầu tệp: giữ phần LP-v2 (một version cho 5 ngôn ngữ, thẻ meta, `data-notice-version`), thêm câu ★2 (`CHAT_DETAILS_MIN_NOTICE_VERSION` = `2026-10-31`, api giữ nguyên) và ghi nguồn chữ.
- **Nhãn: giữ `VERSION = '2026-11-01'` (nhãn tạm của LP-v2).** Lý do: lớn hơn `2026-10-31` (SEC D2/FB-R4-SEC-FE-02, `deploy-landing.sh` từ chối version cũ hơn bản đã đăng), ≥ `CHAT_DETAILS_MIN_NOTICE_VERSION`. `form-live.landing.spec.ts` theo nhãn này. **SEC chốt nhãn thật** rồi FE-B đổi một chỗ (`VERSION`) + `NOTICE_VERSION` của spec + `consentVersion` trong 2 test landing, chạy lại `check:dist`.
- `en.ts`/`vi.ts`: `consentMore` "from our server" / "khỏi máy chủ của OTTIMO" (Δ6 của PR #21); `vi.ts` giữ "Nhắn Zalo" / "Nhắn " của LP-v2 (CPY 13.1).
- `privacy.test.ts`: kỳ vọng Δ5 5 ngôn ngữ theo chữ SEC cuối (trước là L3).
- Font zh: câu zh mới có chữ Hán chưa có trong tệp cắt (`身`…) → `brand.test` + `dist-checks` đỏ. Chạy đúng quy trình `build:booking-preview` → `sync:fonts:cjk` → `build:booking-preview` (nguồn font lấy từ bộ đệm `.font-src` đã kiểm integrity ở worktree khác, cùng phiên bản ghim). 4 tệp `fonts/zh/ottimo-sans-zh-*.woff2` + `fonts-zh.css` sinh lại; ko không đổi.
- sha256 trang privacy dựng (`dist-booking-live`, nhãn tạm): en `7c44cbd3…066a`, vi `29d4690c…6f47` – **khác** băm trong mô tả PR #21 vì trang LP-v2 có thẻ meta, bộ chọn ngôn ngữ và nhãn khác. OPS so băm trên image thật khi đăng (bước 6), không dùng băm của PR #21.
- Gộp `lp-v2-main` vào `main` sau này sẽ làm PR #21 tự hiện "merged" (commit `5474b6e1` nằm trong `main`). ORC đóng PR #21 kèm ghi chú hoặc để GitHub tự đánh dấu.

## 4. Kiểm 0092 trên DB như production (68 migration)

Postgres 17 tạm riêng (container `ottimo-arc-lpv2-pg`, cổng `127.0.0.1:55492`, mật khẩu tạm chỉ cho lượt này, vai dựng bằng `infra/postgres/init/02-roles.sh`). Không đụng staging/production.

1. DB `ottimo_prodsim`: chạy migrator (ottimo_migrator → SET ROLE ottimo_owner) với **thư mục migration của `origin/main`** (`git archive`) → 68 dòng `drizzle.__drizzle_migrations`.
2. Thêm dữ liệu giả hình dạng production (bằng superuser, bỏ FK): 5 dòng `privacy_notice_version` (`2026-10-24` en/vi đã thay, `2026-10-31` en/vi/ru đang hiệu lực), 30 dòng `website_booking_request` locale vi/en/ru, đã xóa C2.
3. Chạy migrator với thư mục của `lp-v2-main` → chỉ 0092 chạy, **~0,2 giây** cả khởi động node. Sau đó: 69 migration, `max(created_at)` = 1792782173681; CHECK locale 2 bảng = `vi, en, ru, ko, zh`; `website_booking_request_price_estimate_check` có; 30/30 dòng giữ, `price_estimate` NULL; 5/5 dòng thông báo giữ (2 `superseded_at`); trigger `privacy_notice_version_append_only` + `_no_truncate` còn; khóa `public_show_prices` = `false` (`{owner}`), `web_estimate.open_until` = `"2027-01-01"` (`{owner,manager}`).
4. Kết luận: 0092 **chỉ nới + thêm cột NULL + thêm khóa `ON CONFLICT DO NOTHING`**; khóa ngắn (ALTER TABLE trên 2 bảng nhỏ), không đổi dữ liệu, không đụng `app_user`/`user_email_change` của 0091. Quay lui app về v1.0.3 không cần lùi DB (v1.0.3 không đọc cột/khóa mới; locale ko/zh chỉ có khi `LANDING_LOCALES` mở). `public_show_prices` mặc định `false` → route giá 404 tới khi OWN bật.

Đã dừng và xóa container + volume sau khi chạy (mục 9).

## 5. Lệnh đã chạy và kết quả (máy ARC, macOS, Node 22.23.3, pnpm 9.15.4)

| # | Lệnh | Kết quả |
|---|---|---|
| 1 | `pnpm install --frozen-lockfile` | OK |
| 2 | `pnpm format:check` | Xanh |
| 3 | `pnpm lint` (eslint + `turbo run typecheck` 13 gói) | Xanh |
| 4 | `drizzle-kit generate` (bước CI "Schema matches migrations") | "No schema changes" |
| 5 | `python3 design/tools/gen_strings.py` chạy lại | Không đổi byte (bước CI "Copy is generated") |
| 6 | `gen-openapi-meta.mjs`, api-client `gen.mjs`, `gen-quote-copy` / `gen-guest-request-copy` / `gen-portal-copy` | Sinh lại; chạy lần hai không đổi |
| 7 | `openapi-spec-validator` 0.7.2 trên `openapi.yaml` + `openapi.test.yaml` | OK / OK |
| 8 | `gen_traceability.py --strict` | exit 0 |
| 9 | `gen_rbac_cases.py --check` | "rbac-cases up to date" (207 operation, 2277 ca, mismatch []) |
| 10 | `pnpm db:migrate` (DB test tạm) + `turbo run test --force` (Postgres 17 thật, ottimo_app) | **Xanh toàn bộ**: api 154 tệp đạt + 2 bỏ qua, **3855 test đạt**, 24 bỏ qua; admin-web 70 tệp / 799; mobile 132; guest-web 73; landing 281; integrations 241; api-client 37; ui 13; contracts 2; i18n 2 tệp; tests (fixtures) OK – chạy trước khi gộp PR #21 |
| 11 | `pnpm build` | Xanh |
| 12 | Sau gộp PR #21: `turbo run build test typecheck --filter=@ottimo/landing-web --force` | 12 tệp / **283 test đạt**, `astro check` 0 lỗi |
| 13 | Landing Playwright (`build` + `build:booking-preview` + `build:booking-live-test`, `test:e2e:landing`) | **149/149 đạt** (cả trước và sau gộp PR #21). Ảnh TC-LP-061 test tự ghi vào `rounds/…/FE/screenshots/` đã trả về bản commit, không đưa vào commit |
| 14 | shellcheck 0.10.0 và 0.9.0 (danh sách tệp như job `infra-scripts`) | 0 cảnh báo |
| 15 | `infra/ci/test-ops-check.sh` | 119/119 |
| 16 | `server/test/ops-check-price.test.sh` | 16/16 |
| 17 | `server/test/ops-check-cwd.test.sh` | 7/7 |
| 18 | `server/test/deploy-landing-privacy.test.sh` (docker, alpine:3.20) | **28/28** |
| 19 | `rollback.test.sh` 16/16 · `restore-drill-privacy.test.sh` 8/8 · `mail-test-send.test.sh` 20/20 · `requeue-email-changed.test.sh` 47/47 | Đạt |
| 20 | `check-compose.sh`, `test-web-build-config.sh`, `check-caddy-landing.sh`, `check-caddy-prod.sh --stub`, `test-edge.sh` | OK |
| 21 | gitleaks v8.21.2 `detect --no-git` trên `product/` với `.github/gitleaks.toml` | no leaks found |
| – | **Không chạy được tại máy:** `test-deploy-from-ci.sh` (cần Linux + flock; tệp không đổi so với `main`), `backup-privacy-log.test.sh` (tự bỏ qua trên macOS), job `docker-build` + E2E smoke stack, gitleaks trên lịch sử git, `pnpm audit` | Để CI chạy |

CI: workflow `CI` chỉ tự chạy khi push `main` hoặc có PR. ARC kích hoạt tay (`workflow_dispatch`, `t9=false`) trên `lp-v2-main` – job `publish-images`/`deploy-staging` có điều kiện `push` + `main` nên **không** chạy. Số run báo trong kết quả trả ORC.

## 6. Thẻ còn lại (ARC tự ghi, không chặn gộp)

### FB-R4-ARC-LPV2M-01
- Mức độ: Minor
- Vị trí: chú thích trong `apps/admin-web` (`r4-lp-v2-fe5.test.tsx`, `r4-lp-v2-fea4.test.tsx`, `GuestFormDialog.tsx`, `webreq/*`, `mocks/*`), `packages/api-client/src/endpoints.ts`, `types.ts`, `packages/contracts/src/public-room-type.ts`
- Vấn đề: chú thích LP-v2 còn ghi "OpenAPI 0.3.10 bổ sung 3/4/5", "0.3.10 LandingLocale" – nay là 0.3.11; dễ lẫn với 0.3.10 của v1.0.3.
- Đề xuất sửa: FE-A/BE đổi khi chạm tệp ở v1.0.4 (không đổi hành vi).
- Trạng thái: Open

### FB-R4-ARC-LPV2M-02
- Mức độ: Minor
- Vị trí: `apps/landing-web/src/content/privacy.ts` `VERSION`
- Vấn đề: nhãn tạm `2026-11-01`. Luật sư xong (04/11), INV bỏ bước người bản xứ (04/11) → không còn lý do chờ.
- Đề xuất sửa: SEC chốt nhãn (> `2026-10-31`, đề xuất ngày SEC ký chữ cuối), FE-B đổi `VERSION` + 3 chỗ test, `check:dist` + `pages.spec` chạy lại (P3, P11).
- Trạng thái: Open

## 7. Điều kiện QC LP-v2 (M1–M8) – còn đúng không

| # | Trạng thái sau lượt này |
|---|---|
| M1 gitleaks | **Xong** trên `main` (PR #19, allowlist `pe1.…`); quét lại `product/` tại máy: sạch |
| M2 v1.0.1 lên `main` trước | **Xong** – v1.0.1 → v1.0.3 đã ở `main`/production. Phần landing `2026-10-31` (PR #21) **nay đi cùng `lp-v2-main`** (lệnh ORC) thay vì lên `main` trước – QC cần ghi nhận đổi thứ tự này (xem P4) |
| M3 migration số kế tiếp + snapshot sinh lại | **Xong**: 0092, idx 68, `when` 0091 + 2000, snapshot sinh từ 0091 của `main`; `drizzle-kit` không đổi; `migrations-journal`, `schema-parity` xanh trong bộ test |
| M4 OpenAPI sau changelog trước + sinh lại; privacy en/vi gốc `2026-10-31` | **Xong**: 0.3.11 sau 0.3.10/0.3.9, `contract.test` xanh; en/vi = PR #21 từng ký tự + Δ5 ko/zh/ru mới |
| M5 ARC đóng OPS-LPV2-01 | **Xong** (`reviews/ARC-on-LP-v2-ops.md` 01/11) |
| M6 turbo inputs | **Xong** (`93c549ea`, có trong nhánh) |
| M7 PR `lp-v2` → `main`, CI xanh trên commit gộp cuối | **Còn**: CI đã chạy tay trên `lp-v2-main`; ORC mở PR `lp-v2-main` → `main` khi INV đồng ý, CI PR phải xanh trên đúng đầu nhánh |
| M8 thủ tục bug-list + decision-log | **Còn** (QA, ORC) |

Điều kiện phát hành bị ảnh hưởng: **P1** INV bỏ (04/11); **P2** xong (luật sư, 04/11); **P3** nhãn thật – SEC (thẻ LPV2M-02); **P4** đổi nghĩa: `2026-10-31` sẽ **không** đăng riêng trên production; LP-v2 đăng một lượt nhãn mới cho 5 ngôn ngữ, en/vi cùng chữ `2026-10-31`. `CHAT_DETAILS_MIN_NOTICE_VERSION` = `2026-10-31` vẫn đúng (nhãn mới lớn hơn). QC/SEC xác nhận chấp nhận cách này (đề xuất ARC: chấp nhận – điều kiện P1–P6 của SEC notice-final mục 5 chuyển sang lượt đăng LP-v2). Các P khác không đổi.

## 8. Việc review đề xuất cho từng vai

| Vai | Xem gì |
|---|---|
| **BE** | 0092 (SQL + snapshot + journal), `website-request-rules.ts` lấy bộ dò chung của `main` – chạy lại `lp-v2-be-units`, `lp-v2-price-estimate` (đã xanh trong bộ đủ); OpenAPI 0.3.11 changelog |
| **FE (FE-A, FE-B)** | FE-B: `privacy.ts` (khối en/vi = PR #21, Δ5 ko/zh/ru, nhãn tạm), font zh sinh lại, `privacy.test.ts`; FE-A: chuỗi `guest.bill.line.room_*` "Room charge" trên Desk/bill, chú thích 0.3.10 → 0.3.11 (LPV2M-01) |
| **SEC** | (1) chốt nhãn thông báo (LPV2M-02, P3); (2) xác nhận 3 câu Δ5 ko/zh/ru đúng mục 7; (3) `deploy-landing.sh` hợp hai quy tắc (mục 2 #15) + `ops-check` price dùng `cmd_failed`; (4) chấp nhận đổi nghĩa P4 |
| **OPS** | `ops-check.sh` lượt chạy đủ thêm 3 kiểm giá (vô hại khi chưa có route giá: pricelimit 0, pricegap 0, priceswitch lượt đầu đặt mốc), `deploy-landing.sh` + test 28 ca, README 12.3/13; runbook phát hành LP-v2 dùng tên tệp `0092_…` |
| **QA** | CI PR xanh; ca "LP-v2 trơ" trên v1.0.4 (plan-v1.0.4 7.2); khi có staging: smoke P10 với chữ cuối; 1 ca rollback landing khi proxy mở |
| **QC** | M1–M8 theo mục 7, ghi nhận M2/P4 đổi thứ tự, QC rút gọn khi đủ P |
| **UXD/CPY** | Câu Δ5 ko/zh/ru mới hiển thị (tràn chữ ru 320–375 px đã qua `pages.spec` trong Playwright 149/149) |

## 9. Dọn dẹp, giả định, rủi ro

- Dọn: container `ottimo-arc-lpv2-pg` + volume đã xóa; tệp tạm chỉ ở scratchpad; tệp `arc-tmp-migrate-folder.ts` đã xóa trước khi commit; `.font-src` gitignored.
- Giả định: (1) giữ nhãn tạm `2026-11-01` là đúng ý ORC "để SEC chốt"; (2) `main` mới (`c6cd32a8`) gộp vào nhánh vì chỉ là tài liệu và lệnh ghi "origin/main đầu hiện tại"; (3) bản "Room charge" (UXD duyệt) thắng bản `main` cho bill khách.
- Rủi ro: (a) gộp `lp-v2-main` vào `main` đưa mã máy chủ + Desk LP-v2 vào production v1.0.4 (plan-v1.0.4 2.1 ý 4) – trơ khi `LANDING_LOCALES=en,vi` và `public_show_prices=false`; (b) `deploy-landing.sh` chặt hơn LP-v2 thiết kế ở `--rollback` khi proxy mở (image thiếu en/vi bị từ chối) – theo đúng runbook quay lui (c): đóng proxy trước rồi mới quay lui; (c) chưa chạy job `docker-build`/E2E stack tại máy – chờ CI.
